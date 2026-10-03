import type {
  CommunicationAssessment,
  SkillAssessmentRequest,
  SkillPlan,
  SkillPlanCompilationRequest,
  SkillSelectionRequest,
  SkillSelectionResult,
} from "@ai-message-coach/contracts";
import { describe, expect, it } from "vitest";

import {
  createDeterministicSkillAssessor,
  createApprovedSkillCatalogSnapshot,
  initialSkillRegistry,
  validateCommunicationAssessment as validateAssessmentWithSignals,
  validateSkillPlan,
  validateSkillSelectionResult as validateSelectionWithSignals,
  type ApprovedSkillCatalogSnapshot,
} from "./index.js";

const skill = initialSkillRegistry.find(
  (candidate) => candidate.status === "ACTIVE" && candidate.actions.includes("REWRITE_DRAFT"),
)!;
const reference = { id: skill.id, version: skill.version };
const snapshot: ApprovedSkillCatalogSnapshot =
  createApprovedSkillCatalogSnapshot(initialSkillRegistry);
const allowedSignals = new Set(["wording_support"]);
const validateCommunicationAssessment = (
  request: SkillAssessmentRequest,
  result: CommunicationAssessment,
) => validateAssessmentWithSignals(request, result, allowedSignals);
const validateSkillSelectionResult = (
  request: SkillSelectionRequest,
  result: SkillSelectionResult,
  catalog: ApprovedSkillCatalogSnapshot,
) => validateSelectionWithSignals(request, result, catalog, allowedSignals);
const assessmentRequest: SkillAssessmentRequest = {
  action: "REWRITE_DRAFT",
  taskPurpose: { kind: "PRIMARY_COACHING" },
  evidence: [
    {
      id: "E1",
      kind: "SOURCE_DRAFT",
      source: "OBSERVED_SCREENSHOT",
      sourceRef: "draft:current",
      value: { format: "TEXT", text: "Please help me word this." },
      confidence: 0.9,
    },
  ],
  context: {
    situationTags: [],
    intentTags: [],
    language: { primary: "en", secondary: null, codeSwitching: false },
    draftPresent: true,
    ambiguityMaterial: false,
  },
};
const assessment: CommunicationAssessment = {
  status: "ASSESSED",
  needs: [{ signalId: "wording_support", evidenceRefs: ["E1"] }],
  uncertaintyCodes: [],
};
const selectionRequest: SkillSelectionRequest = {
  ...assessmentRequest,
  assessment,
  maxSkills: 1,
  catalogSnapshotId: snapshot.id,
};
const selection: SkillSelectionResult = {
  status: "SELECTED",
  selectedSkills: [reference],
  reasons: [{ skillId: skill.id, evidenceRefs: ["E1"], code: "NEED_MATCH" }],
  uncertaintyCodes: [],
  catalogSnapshotId: snapshot.id,
};
const compilationRequest: SkillPlanCompilationRequest = {
  action: "REWRITE_DRAFT",
  selectedSkills: [reference],
  evidence: assessmentRequest.evidence,
  constraints: [{ kind: "HARD", evidenceRef: "E1" }],
  catalogSnapshotId: snapshot.id,
};
const plan: SkillPlan = {
  status: "COMPILED",
  selectedSkills: [reference],
  principles: [
    {
      text: "Preserve the stated meaning.",
      skillRefs: [reference],
      evidenceRefs: ["E1"],
    },
  ],
  avoid: [],
  tradeoffs: [],
  recommendations: [],
  catalogSnapshotId: snapshot.id,
};

describe("B1 Skill boundary", () => {
  it("provides an offline deterministic, unassessed default without selecting skills", async () => {
    const result = await createDeterministicSkillAssessor().assess(assessmentRequest);
    expect(result).toEqual({ status: "UNASSESSED", needs: [], uncertaintyCodes: [] });
    expect(result).not.toHaveProperty("action");
    expect(result).not.toHaveProperty("selectedSkills");
  });

  it("accepts only assessment signals backed by supplied evidence", () => {
    expect(validateCommunicationAssessment(assessmentRequest, assessment)).toEqual(assessment);
    expect(() =>
      validateCommunicationAssessment(assessmentRequest, {
        ...assessment,
        needs: [{ signalId: "wording_support", evidenceRefs: ["E2"] }],
      }),
    ).toThrow("UNSUPPORTED_EVIDENCE_REFERENCE");
    expect(() =>
      validateCommunicationAssessment(assessmentRequest, {
        ...assessment,
        needs: [{ signalId: "convince_them_to_agree", evidenceRefs: ["E1"] }],
      }),
    ).toThrow("UNAPPROVED_COMMUNICATION_SIGNAL");
  });

  it("resolves exact active skill references against the supplied approved snapshot", () => {
    expect(validateSkillSelectionResult(selectionRequest, selection, snapshot)).toEqual(selection);
    expect(() =>
      validateSkillSelectionResult(
        selectionRequest,
        { ...selection, selectedSkills: [{ ...reference, version: reference.version + 1 }] },
        snapshot,
      ),
    ).toThrow("UNRESOLVED_APPROVED_SKILL_REFERENCE");
    expect(() =>
      validateSkillSelectionResult(
        selectionRequest,
        {
          ...selection,
          selectedSkills: [{ id: "unknown_skill", version: 1 }],
          reasons: [{ skillId: "unknown_skill", evidenceRefs: ["E1"], code: "NEED_MATCH" }],
        },
        snapshot,
      ),
    ).toThrow("UNRESOLVED_APPROVED_SKILL_REFERENCE");
    const inactiveSnapshot = createApprovedSkillCatalogSnapshot(
      snapshot.registry.map((candidate) =>
        candidate.id === skill.id ? { ...candidate, status: "INACTIVE" } : candidate,
      ),
    );
    expect(() =>
      validateSkillSelectionResult(
        { ...selectionRequest, catalogSnapshotId: inactiveSnapshot.id },
        { ...selection, catalogSnapshotId: inactiveSnapshot.id },
        inactiveSnapshot,
      ),
    ).toThrow("UNRESOLVED_APPROVED_SKILL_REFERENCE");
    expect(() =>
      validateSkillSelectionResult(selectionRequest, selection, {
        ...snapshot,
        registry: inactiveSnapshot.registry,
      }),
    ).toThrow("CATALOG_SNAPSHOT_MISMATCH");
    expect(() =>
      validateSkillSelectionResult(selectionRequest, selection, {
        ...snapshot,
        id: "other-snapshot",
      }),
    ).toThrow("CATALOG_SNAPSHOT_MISMATCH");
  });

  it("rejects unsupported reasons, oversized selections and unassessed selection", () => {
    expect(() =>
      validateSkillSelectionResult(
        selectionRequest,
        {
          ...selection,
          reasons: [{ skillId: skill.id, evidenceRefs: ["E2"], code: "NEED_MATCH" }],
        },
        snapshot,
      ),
    ).toThrow("UNSUPPORTED_EVIDENCE_REFERENCE");
    expect(() =>
      validateSkillSelectionResult(
        {
          ...selectionRequest,
          assessment: { status: "UNASSESSED", needs: [], uncertaintyCodes: [] },
        },
        selection,
        snapshot,
      ),
    ).toThrow("SELECTION_REQUIRES_ASSESSMENT");
    const other = snapshot.registry.find(
      (candidate) => candidate.id !== skill.id && candidate.actions.includes("REWRITE_DRAFT"),
    )!;
    expect(() =>
      validateSkillSelectionResult(
        selectionRequest,
        {
          ...selection,
          selectedSkills: [reference, { id: other.id, version: other.version }],
          reasons: [
            ...selection.reasons,
            { skillId: other.id, evidenceRefs: ["E1"], code: "CONTEXT_MATCH" },
          ],
        },
        snapshot,
      ),
    ).toThrow("SKILL_SELECTION_LIMIT_EXCEEDED");
  });

  it("validates SkillPlan citations against selected skills and evidence", () => {
    expect(validateSkillPlan(compilationRequest, plan, snapshot)).toEqual(plan);
    expect(() =>
      validateSkillPlan(
        compilationRequest,
        {
          ...plan,
          principles: [{ ...plan.principles[0]!, evidenceRefs: ["E2"] }],
        },
        snapshot,
      ),
    ).toThrow("UNSUPPORTED_EVIDENCE_REFERENCE");
    expect(() =>
      validateSkillPlan(
        compilationRequest,
        {
          ...plan,
          principles: [
            { ...plan.principles[0]!, skillRefs: [{ id: "unselected_skill", version: 1 }] },
          ],
        },
        snapshot,
      ),
    ).toThrow("UNSELECTED_SKILL_GUIDANCE");
    expect(() =>
      validateSkillPlan(compilationRequest, { ...plan, selectedSkills: [] }, snapshot),
    ).toThrow();
  });
});
