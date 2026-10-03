import { describe, expect, it } from "vitest";

import {
  CommunicationAssessmentSchema,
  SkillAssessmentRequestSchema,
  SkillEvidenceSchema,
  SkillPlanSchema,
  SkillSelectionResultSchema,
  type SkillAssessmentRequest,
} from "./agent-skill.js";

const request: SkillAssessmentRequest = {
  action: "REWRITE_DRAFT",
  taskPurpose: { kind: "PRIMARY_COACHING" },
  evidence: [
    {
      id: "E1",
      kind: "SOURCE_DRAFT",
      source: "OBSERVED_SCREENSHOT",
      sourceRef: "draft:current",
      value: { format: "TEXT", text: "Sorry for missing our call." },
      confidence: 0.9,
    },
    {
      id: "E2",
      kind: "UNKNOWN_RELATIONSHIP",
      source: "UNKNOWN",
      value: { format: "UNKNOWN" },
    },
  ],
  context: {
    situationTags: ["missed_commitment"],
    intentTags: ["apologize"],
    language: { primary: "en", secondary: null, codeSwitching: false },
    draftPresent: true,
    ambiguityMaterial: false,
  },
};

describe("B1 Agent–Skill contracts", () => {
  it("retains fixed input action, bounded evidence and source attribution", () => {
    expect(SkillAssessmentRequestSchema.parse(request)).toEqual(request);
    expect(SkillAssessmentRequestSchema.safeParse({ ...request, action: "DECLINE" }).success).toBe(
      false,
    );
    expect(
      SkillAssessmentRequestSchema.safeParse({
        ...request,
        evidence: [request.evidence[0], request.evidence[0]],
      }).success,
    ).toBe(false);
    expect(
      SkillEvidenceSchema.safeParse({
        ...request.evidence[0],
        source: "USER_SUPPLIED",
      }).success,
    ).toBe(false);
    expect(
      SkillEvidenceSchema.safeParse({
        ...request.evidence[1],
        value: { format: "TEXT", text: "They are my partner." },
      }).success,
    ).toBe(false);
    expect(
      SkillEvidenceSchema.safeParse({ ...request.evidence[1], confidence: 0.95 }).success,
    ).toBe(false);
  });

  it("rejects task purposes that smuggle a goal or orchestration directive", () => {
    expect(
      SkillAssessmentRequestSchema.safeParse({
        ...request,
        taskPurpose: { kind: "PRIMARY_COACHING", goal: "convince them to agree" },
      }).success,
    ).toBe(false);
    expect(
      SkillAssessmentRequestSchema.safeParse({
        ...request,
        taskPurpose: { kind: "PRIMARY_COACHING", shouldCallModel: true },
      }).success,
    ).toBe(false);
  });

  it("keeps assessment, selection and guidance outputs distinct and command-free", () => {
    const assessment = {
      status: "ASSESSED",
      needs: [{ signalId: "repair", evidenceRefs: ["E1"] }],
      uncertaintyCodes: [],
    };
    const selection = {
      status: "SELECTED",
      selectedSkills: [{ id: "apology", version: 1 }],
      reasons: [{ skillId: "apology", evidenceRefs: ["E1"], code: "NEED_MATCH" }],
      uncertaintyCodes: [],
      catalogSnapshotId: "approved-test",
    };
    const plan = {
      status: "COMPILED",
      selectedSkills: [{ id: "apology", version: 1 }],
      principles: [
        {
          text: "Acknowledge the missed call.",
          skillRefs: [{ id: "apology", version: 1 }],
          evidenceRefs: ["E1"],
        },
      ],
      avoid: [],
      tradeoffs: [],
      recommendations: [],
      catalogSnapshotId: "approved-test",
    };
    expect(CommunicationAssessmentSchema.parse(assessment)).toEqual(assessment);
    expect(SkillSelectionResultSchema.parse(selection)).toEqual(selection);
    expect(SkillPlanSchema.parse(plan)).toEqual(plan);
    for (const field of [
      "action",
      "nextAction",
      "agent",
      "nextAgent",
      "shouldContinue",
      "shouldStop",
      "shouldRevise",
      "callModel",
      "executionDepth",
      "callBudget",
      "userIntent",
      "goal",
    ]) {
      expect(
        CommunicationAssessmentSchema.safeParse({ ...assessment, [field]: true }).success,
      ).toBe(false);
      expect(SkillSelectionResultSchema.safeParse({ ...selection, [field]: true }).success).toBe(
        false,
      );
      expect(SkillPlanSchema.safeParse({ ...plan, [field]: true }).success).toBe(false);
    }
  });

  it("bounds content and rejects inconsistent stage status", () => {
    expect(
      SkillEvidenceSchema.safeParse({
        ...request.evidence[0],
        value: { format: "TEXT", text: "x".repeat(241) },
      }).success,
    ).toBe(false);
    expect(
      CommunicationAssessmentSchema.safeParse({
        status: "UNASSESSED",
        needs: [{ signalId: "repair", evidenceRefs: ["E1"] }],
        uncertaintyCodes: [],
      }).success,
    ).toBe(false);
    expect(
      SkillSelectionResultSchema.safeParse({
        status: "NONE",
        selectedSkills: [{ id: "apology", version: 1 }],
        reasons: [],
        uncertaintyCodes: [],
        catalogSnapshotId: "approved-test",
      }).success,
    ).toBe(false);
    expect(
      SkillSelectionResultSchema.parse({
        status: "NONE",
        selectedSkills: [],
        reasons: [],
        uncertaintyCodes: ["INSUFFICIENT_EVIDENCE"],
        catalogSnapshotId: "approved-test",
      }).status,
    ).toBe("NONE");
    expect(
      SkillSelectionResultSchema.safeParse({
        status: "FAILED",
        selectedSkills: [],
        reasons: [],
        uncertaintyCodes: [],
        catalogSnapshotId: "approved-test",
      }).success,
    ).toBe(false);
    expect(
      SkillPlanSchema.safeParse({
        status: "FAILED",
        selectedSkills: [],
        principles: [
          {
            text: "Unvalidated advice",
            skillRefs: [{ id: "apology", version: 1 }],
            evidenceRefs: ["E1"],
          },
        ],
        avoid: [],
        tradeoffs: [],
        recommendations: [],
        failureCode: "COMPILATION_FAILED",
        catalogSnapshotId: "approved-test",
      }).success,
    ).toBe(false);
  });
});
