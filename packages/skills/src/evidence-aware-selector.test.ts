import {
  CommunicationAssessmentSchema,
  SkillAssessmentRequestSchema,
  SkillDefinitionSchema,
  SkillSelectionResultSchema,
  type SkillAssessmentRequest,
  type SkillDefinition,
  type SkillSelectionRequest,
} from "@ai-message-coach/contracts";
import { describe, expect, it } from "vitest";

import {
  assessCommunicationNeeds,
  communicationSignalIds,
  createApprovedSkillCatalogSnapshot,
  createEvidenceAwareSkillAssessor,
  createEvidenceAwareSkillSelector,
  initialSkillRegistry,
  selectEvidenceAwareSkills,
} from "./index.js";

const snapshot = createApprovedSkillCatalogSnapshot(initialSkillRegistry);
const assessmentRequest: SkillAssessmentRequest = {
  action: "REWRITE_DRAFT",
  taskPurpose: { kind: "PRIMARY_COACHING" },
  evidence: [
    {
      id: "E1",
      kind: "LANGUAGE",
      source: "OBSERVED_SCREENSHOT",
      value: { format: "CODE", code: "PRIMARY:en" },
    },
    {
      id: "E2",
      kind: "CONTEXT_TAG",
      source: "DETERMINISTIC_DERIVATION",
      value: { format: "CODE", code: "SITUATION:conflict" },
    },
    {
      id: "E3",
      kind: "CONTEXT_TAG",
      source: "DETERMINISTIC_DERIVATION",
      value: { format: "CODE", code: "INTENT:de_escalate" },
    },
    { id: "E4", kind: "UNKNOWN_RELATIONSHIP", source: "UNKNOWN", value: { format: "UNKNOWN" } },
  ],
  context: {
    situationTags: ["conflict"],
    intentTags: ["de_escalate"],
    language: { primary: "en", secondary: null, codeSwitching: false },
    draftPresent: true,
    ambiguityMaterial: false,
  },
};
const assessment = assessCommunicationNeeds(assessmentRequest);
const selectionRequest: SkillSelectionRequest = {
  ...assessmentRequest,
  assessment,
  maxSkills: 4,
  catalogSnapshotId: snapshot.id,
};

function syntheticSkill(id: string, options: Partial<SkillDefinition> = {}): SkillDefinition {
  return SkillDefinitionSchema.parse({
    id,
    name: id,
    description: "Synthetic test definition.",
    languages: ["universal"],
    situations: ["conflict"],
    intents: ["de_escalate"],
    actions: ["REWRITE_DRAFT"],
    useWhen: ["Supported conflict."],
    doNotUseWhen: [],
    principles: ["Stay grounded."],
    avoid: [],
    compatibleSkills: [],
    conflictingSkills: [],
    version: 1,
    status: "ACTIVE",
    ...options,
  });
}

describe("B2 deterministic Skill assessment and selection", () => {
  it.each([
    ["clarity", "SITUATION:request"],
    ["coordination", "SITUATION:planning"],
    ["empathy", "SITUATION:emotional_support"],
    ["conflict_management", "SITUATION:conflict"],
    ["assertive_limits", "INTENT:set_boundary"],
    ["repair", "SITUATION:mistake"],
  ])("grounds %s only in its supplied context-tag evidence", (signalId, code) => {
    const situation = code.startsWith("SITUATION:") ? [code.slice(10)] : [];
    const intent = code.startsWith("INTENT:") ? [code.slice(7)] : [];
    const request = SkillAssessmentRequestSchema.parse({
      ...assessmentRequest,
      evidence: [
        {
          id: "E1",
          kind: "CONTEXT_TAG",
          source: "DETERMINISTIC_DERIVATION",
          value: { format: "CODE", code },
        },
      ],
      context: {
        ...assessmentRequest.context,
        situationTags: situation,
        intentTags: intent,
      },
    });
    expect(assessCommunicationNeeds(request).needs).toContainEqual({
      signalId,
      evidenceRefs: ["E1"],
    });
    expect(assessCommunicationNeeds({ ...request, evidence: [] }).status).toBe(
      "INSUFFICIENT_EVIDENCE",
    );
  });

  it("uses only approved evidence-backed communication signals and stable output", async () => {
    expect(communicationSignalIds.has("conflict_management")).toBe(true);
    expect(communicationSignalIds.has("convince_them_to_agree")).toBe(false);
    expect(assessment).toEqual({
      status: "ASSESSED",
      needs: [{ signalId: "conflict_management", evidenceRefs: ["E2", "E3"] }],
      uncertaintyCodes: [],
    });
    expect(await createEvidenceAwareSkillAssessor().assess(assessmentRequest)).toEqual(assessment);
    expect(assessment).not.toHaveProperty("action");
    expect(assessment).not.toHaveProperty("intent");
    expect(() =>
      CommunicationAssessmentSchema.parse({ ...assessment, nextAgent: "writer" }),
    ).toThrow();
    expect(() =>
      assessCommunicationNeeds({
        ...assessmentRequest,
        evidence: assessmentRequest.evidence.filter((item) => item.id !== "E2" && item.id !== "E3"),
      }),
    ).not.toThrow();
    const noEvidence = assessCommunicationNeeds({
      ...assessmentRequest,
      evidence: assessmentRequest.evidence.filter((item) => item.id !== "E2" && item.id !== "E3"),
    });
    expect(noEvidence.status).toBe("INSUFFICIENT_EVIDENCE");
  });

  it("selects only approved active exact versions and never emits action or guidance", async () => {
    const result = await createEvidenceAwareSkillSelector(snapshot).select(selectionRequest);
    expect(result.status).toBe("SELECTED");
    expect(result.selectedSkills.length).toBeGreaterThan(0);
    expect(result.selectedSkills.length).toBeLessThanOrEqual(4);
    for (const reference of result.selectedSkills) {
      const definition = snapshot.registry.find((skill) => skill.id === reference.id)!;
      expect(definition.status).toBe("ACTIVE");
      expect(definition.version).toBe(reference.version);
      expect(definition.actions).toContain(selectionRequest.action);
    }
    for (const reason of result.reasons)
      expect(
        reason.evidenceRefs.every((ref) =>
          assessmentRequest.evidence.some((item) => item.id === ref),
        ),
      ).toBe(true);
    expect(result).not.toHaveProperty("action");
    expect(result).not.toHaveProperty("principles");
    expect(() => SkillSelectionResultSchema.parse({ ...result, callModel: true })).toThrow();
  });

  it("fails closed for an invented signal, unsupported citation or changed snapshot", () => {
    const invented = selectEvidenceAwareSkills(
      {
        ...selectionRequest,
        assessment: {
          ...assessment,
          needs: [{ signalId: "convince_them_to_agree", evidenceRefs: ["E2"] }],
        },
      },
      snapshot,
    ).result;
    expect(invented).toMatchObject({
      status: "FAILED",
      failureCode: "ASSESSMENT_FAILED",
      selectedSkills: [],
    });
    const unsupported = selectEvidenceAwareSkills(
      {
        ...selectionRequest,
        assessment: {
          ...assessment,
          needs: [{ signalId: "conflict_management", evidenceRefs: ["E4"] }],
        },
      },
      snapshot,
    ).result;
    expect(unsupported).toMatchObject({ status: "FAILED", failureCode: "ASSESSMENT_FAILED" });
    const mismatched = selectEvidenceAwareSkills(selectionRequest, {
      ...snapshot,
      registry: snapshot.registry.map((skill) =>
        skill.id === snapshot.registry[0]?.id ? { ...skill, version: skill.version + 1 } : skill,
      ),
    }).result;
    expect(mismatched).toMatchObject({
      status: "FAILED",
      failureCode: "CATALOG_MISMATCH",
      selectedSkills: [],
    });
  });

  it("keeps NONE distinct from FAILED and preserves fixed-action and language gates", () => {
    const none = selectEvidenceAwareSkills(
      {
        ...selectionRequest,
        assessment: {
          status: "INSUFFICIENT_EVIDENCE",
          needs: [],
          uncertaintyCodes: ["INSUFFICIENT_EVIDENCE"],
        },
      },
      snapshot,
    ).result;
    expect(none).toMatchObject({ status: "NONE", selectedSkills: [] });
    const local = selectEvidenceAwareSkills(
      { ...selectionRequest, action: "SUGGEST_ACTIONS" },
      snapshot,
    ).result;
    expect(local).toMatchObject({ status: "NONE", selectedSkills: [] });
    const zhOnly = createApprovedSkillCatalogSnapshot([
      syntheticSkill("zh_only", { languages: ["zh"] }),
    ]);
    const languageResult = selectEvidenceAwareSkills(
      { ...selectionRequest, catalogSnapshotId: zhOnly.id },
      zhOnly,
    ).result;
    expect(languageResult).toMatchObject({ status: "NONE", selectedSkills: [] });
    const wrongAction = createApprovedSkillCatalogSnapshot([
      syntheticSkill("wrong_action", { actions: ["SUGGEST_REPLY"] }),
    ]);
    expect(
      selectEvidenceAwareSkills(
        { ...selectionRequest, catalogSnapshotId: wrongAction.id },
        wrongAction,
      ).result.status,
    ).toBe("NONE");
    const languageOnly = createApprovedSkillCatalogSnapshot([
      syntheticSkill("en_style", { languages: ["en"], situations: [], intents: [] }),
    ]);
    expect(
      selectEvidenceAwareSkills(
        { ...selectionRequest, catalogSnapshotId: languageOnly.id },
        languageOnly,
      ).result.reasons,
    ).toEqual([{ skillId: "en_style", evidenceRefs: ["E1"], code: "LANGUAGE_MATCH" }]);
  });

  it("uses supplied tag eligibility, symmetric conflict handling and the requested cap", () => {
    const registry = createApprovedSkillCatalogSnapshot([
      syntheticSkill("alpha", { conflictingSkills: ["beta"] }),
      syntheticSkill("beta"),
      syntheticSkill("gamma", { status: "INACTIVE" }),
      syntheticSkill("delta", { situations: ["planning"] }),
    ]);
    const request = { ...selectionRequest, catalogSnapshotId: registry.id };
    const diagnostic = selectEvidenceAwareSkills(request, registry);
    expect(diagnostic.result.selectedSkills.map(({ id }) => id)).toEqual(["alpha"]);
    expect(diagnostic.conflictBlocked).toBe(true);
    expect(
      selectEvidenceAwareSkills({ ...request, maxSkills: 1 }, registry).result.selectedSkills,
    ).toHaveLength(1);
    expect(
      selectEvidenceAwareSkills(
        { ...request, context: { ...request.context, situationTags: [] } },
        registry,
      ).result.status,
    ).toBe("FAILED");
  });

  it("uses marginal meaning priority and repair overlap when eligible skills exceed the cap", () => {
    const context = {
      ...assessmentRequest.context,
      situationTags: ["status_request", "mistake", "request"] as const,
      intentTags: [
        "set_expectation",
        "provide_status",
        "apologize",
        "acknowledge_mistake",
        "ask_for_help",
      ] as const,
    };
    const codes = [
      "SITUATION:status_request",
      "SITUATION:mistake",
      "SITUATION:request",
      "INTENT:set_expectation",
      "INTENT:provide_status",
      "INTENT:apologize",
      "INTENT:acknowledge_mistake",
      "INTENT:ask_for_help",
    ];
    const input = SkillAssessmentRequestSchema.parse({
      ...assessmentRequest,
      context,
      evidence: [
        assessmentRequest.evidence[0],
        ...codes.map((code, index) => ({
          id: `E${index + 2}`,
          kind: "CONTEXT_TAG",
          source: "DETERMINISTIC_DERIVATION",
          value: { format: "CODE", code },
        })),
      ],
    });
    const catalog = createApprovedSkillCatalogSnapshot([
      syntheticSkill("style_modifier", {
        languages: ["en"],
        situations: ["request"],
        intents: ["ask_for_help"],
      }),
      syntheticSkill("repair_acknowledge", {
        situations: ["mistake"],
        intents: ["acknowledge_mistake"],
      }),
      syntheticSkill("repair_apologize", {
        situations: ["mistake"],
        intents: ["apologize"],
      }),
      syntheticSkill("help", { situations: ["request"], intents: ["ask_for_help"] }),
      syntheticSkill("status", { situations: ["status_request"], intents: ["provide_status"] }),
      syntheticSkill("expectation", {
        situations: ["status_request"],
        intents: ["set_expectation"],
      }),
    ]);
    const result = selectEvidenceAwareSkills(
      {
        ...input,
        assessment: assessCommunicationNeeds(input),
        maxSkills: 4,
        catalogSnapshotId: catalog.id,
      },
      catalog,
    ).result;
    expect(result.selectedSkills.map(({ id }) => id)).toEqual([
      "expectation",
      "status",
      "help",
      "repair_acknowledge",
    ]);
    expect(result.reasons.every((reason) => reason.evidenceRefs.length > 0)).toBe(true);
  });
});
