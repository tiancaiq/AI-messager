import {
  CommunicationAssessmentSchema,
  SkillAssessmentRequestSchema,
  SkillPlanSchema,
  SkillSelectionResultSchema,
  type CoachingDecisionResult,
} from "@ai-message-coach/contracts";
import {
  assessCommunicationNeeds,
  createApprovedSkillCatalogSnapshot,
  createDeterministicSkillPlanCompiler,
  eligibleSkillLanguages,
  initialSkillRegistry,
  validateCommunicationAssessment,
  type ApprovedSkillCatalogSnapshot,
} from "@ai-message-coach/skills";
import { describe, expect, it, vi } from "vitest";

import { coachConversation, type CoachingTextGenerator } from "../src/coaching-engine.js";
import { decideCoachingAction } from "../src/coaching-policy.js";
import { deriveSkillContext } from "../src/skill-context.js";
import { normalizeCommunicationProblem } from "../src/communication-problem.js";
import { refineShadowSkillContext } from "../src/skill-shadow-context.js";
import { rankEligibleSkillCandidates } from "../../skills/src/engine.js";
import {
  adversarialSkillFixtures,
  frozenSkillFixtures,
  type PipelineValidationFixture,
} from "./skill-pipeline-fixtures.js";
import { approvedPipelineSnapshot, createSkillPipelineHarness } from "./skill-pipeline-harness.js";

const allFixtures = [...frozenSkillFixtures, ...adversarialSkillFixtures];
const reviewedDifferences: Record<string, string> = {
  "missed-commitment": "EXPECTED_DIFFERENCE",
  "professional-status": "EXPECTED_DIFFERENCE",
  "mixed-planning": "POTENTIAL_REGRESSION",
  "uncertain-availability": "POTENTIAL_IMPROVEMENT",
  "less-confrontational-no-apology": "EXPECTED_DIFFERENCE",
  "disagree-relationship": "POTENTIAL_REGRESSION",
  "cap-pressure-multi-need": "POTENTIAL_REGRESSION",
  "english-chinese-code-switch": "POTENTIAL_REGRESSION",
  "repair-and-empathy": "POTENTIAL_REGRESSION",
};
const run = createSkillPipelineHarness();
const byId = new Map(approvedPipelineSnapshot.registry.map((skill) => [skill.id, skill]));
const controlFields = [
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
  "composerInstruction",
  "evaluatorInstruction",
  "userIntent",
];

function fixture(id: string): PipelineValidationFixture {
  const found = allFixtures.find((item) => item.id === id);
  if (!found) throw new Error(`Missing fixture: ${id}`);
  return found;
}

describe("B3.5 full Skill pipeline validation", () => {
  it("preserves action, exact selected refs, evidence, eligibility, bounds and authority on every fixture", async () => {
    expect(frozenSkillFixtures).toHaveLength(21);
    expect(adversarialSkillFixtures).toHaveLength(12);
    for (const item of allFixtures) {
      const result = await run(item);
      const { structural, evidence, assessment, selection, plan, legacy, context } = result;
      const action = decideCoachingAction(item.request).action;
      expect(structural.action, item.id).toBe(action);
      expect(structural.catalogSnapshotId, item.id).toBe(approvedPipelineSnapshot.id);
      expect(structural.legacyStatus, item.id).toBe(legacy.status);
      expect(structural.selectionStatus, item.id).toBe(selection.status);
      expect(structural.planStatus, item.id).toBe(plan.status);
      expect(structural.category, item.id).toBe(reviewedDifferences[item.id] ?? "MATCH");
      if (structural.category === "MATCH") expect(structural.reasonCodes, item.id).toEqual([]);
      expect(structural.unknownCodes, item.id).toContain("CONFIRMED_IDENTITY");
      expect(structural.unknownCodes, item.id).toContain("RELATIONSHIP");
      expect(structural.selected, item.id).toEqual(selection.selectedSkills);
      expect(plan.selectedSkills, item.id).toEqual(selection.selectedSkills);
      expect(selection.selectedSkills.length, item.id).toBeLessThanOrEqual(4);
      expect(plan.principles.length, item.id).toBeLessThanOrEqual(12);
      expect(plan.avoid.length, item.id).toBeLessThanOrEqual(12);
      expect(plan.principles.length + plan.avoid.length, item.id).toBeLessThanOrEqual(24);
      expect(plan.tradeoffs, item.id).toEqual([]);
      expect(plan.recommendations, item.id).toEqual([]);
      expect(plan.catalogSnapshotId, item.id).toBe(approvedPipelineSnapshot.id);
      expect(new Set(evidence.map(({ id }) => id)).size, item.id).toBe(evidence.length);
      expect(evidence.length, item.id).toBeLessThanOrEqual(32);
      const evidenceIds = new Set(evidence.map(({ id }) => id));
      for (const need of assessment.needs) {
        expect(need.evidenceRefs.length, item.id).toBeGreaterThan(0);
        expect(
          need.evidenceRefs.every((id) => evidenceIds.has(id)),
          item.id,
        ).toBe(true);
      }
      for (const reason of selection.reasons) {
        expect(
          reason.evidenceRefs.every((id) => evidenceIds.has(id)),
          item.id,
        ).toBe(true);
        expect(
          selection.selectedSkills.some(({ id }) => id === reason.skillId),
          item.id,
        ).toBe(true);
      }
      const selectedKeys = new Set(
        selection.selectedSkills.map(({ id, version }) => `${id}@${version}`),
      );
      const allowedLanguages = eligibleSkillLanguages({
        ...context,
        action,
        intent: null,
      });
      for (const reference of selection.selectedSkills) {
        const skill = byId.get(reference.id);
        expect(skill?.status, item.id).toBe("ACTIVE");
        expect(skill?.version, item.id).toBe(reference.version);
        expect(skill?.actions.includes(action), item.id).toBe(true);
        expect(
          skill?.languages.some((language) => allowedLanguages.has(language)),
          item.id,
        ).toBe(true);
      }
      for (let index = 0; index < selection.selectedSkills.length; index += 1) {
        const skill = byId.get(selection.selectedSkills[index]!.id)!;
        for (const earlier of selection.selectedSkills.slice(0, index)) {
          const other = byId.get(earlier.id)!;
          expect(skill.conflictingSkills.includes(other.id), item.id).toBe(false);
          expect(other.conflictingSkills.includes(skill.id), item.id).toBe(false);
        }
      }
      for (const [field, guidance] of [
        ["principles", plan.principles],
        ["avoid", plan.avoid],
      ] as const) {
        expect(new Set(guidance.map(({ text }) => text)).size, item.id).toBe(guidance.length);
        for (const entry of guidance) {
          expect(entry.text.length, item.id).toBeLessThanOrEqual(300);
          expect(entry.skillRefs.length, item.id).toBeGreaterThan(0);
          expect(entry.evidenceRefs.length, item.id).toBeGreaterThan(0);
          expect(
            entry.evidenceRefs.every((id) => evidenceIds.has(id)),
            item.id,
          ).toBe(true);
          for (const reference of entry.skillRefs) {
            expect(selectedKeys.has(`${reference.id}@${reference.version}`), item.id).toBe(true);
            expect(byId.get(reference.id)?.[field].includes(entry.text), item.id).toBe(true);
          }
        }
      }
      expect(
        plan.principles.some((entry) => plan.avoid.some((avoid) => avoid.text === entry.text)),
        item.id,
      ).toBe(false);
      for (const forbidden of item.forbiddenSkills ?? [])
        expect(
          selection.selectedSkills.some(({ id }) => id === forbidden),
          item.id,
        ).toBe(false);
      for (const required of item.requiredSkills ?? [])
        expect(
          selection.selectedSkills.some(({ id }) => id === required),
          item.id,
        ).toBe(true);
      for (const stage of [assessment, selection, plan])
        for (const field of controlFields)
          expect(stage, `${item.id}:${field}`).not.toHaveProperty(field);
      if (selection.status === "NONE") {
        expect(plan.status, item.id).toBe("NONE");
        expect(plan.principles, item.id).toEqual([]);
      }
    }
  });

  it("is exactly deterministic over repeated fixed input and independent of registry ordering", async () => {
    const reversed = createApprovedSkillCatalogSnapshot([...initialSkillRegistry].reverse());
    expect(reversed.id).not.toBe(approvedPipelineSnapshot.id);
    const reversedRun = createSkillPipelineHarness(reversed);
    for (const item of allFixtures) {
      const first = await run(item);
      const again = await run(item);
      const reordered = await reversedRun(item);
      expect(again.assessment, item.id).toEqual(first.assessment);
      expect(again.selection, item.id).toEqual(first.selection);
      expect(again.plan, item.id).toEqual(first.plan);
      expect(reordered.assessment, item.id).toEqual(first.assessment);
      expect(reordered.selection.selectedSkills, item.id).toEqual(first.selection.selectedSkills);
      expect(reordered.selection.reasons, item.id).toEqual(first.selection.reasons);
      expect(reordered.plan.selectedSkills, item.id).toEqual(first.plan.selectedSkills);
      expect(reordered.plan.principles, item.id).toEqual(first.plan.principles);
      expect(reordered.plan.avoid, item.id).toEqual(first.plan.avoid);
      expect(reordered.structural.category, item.id).toBe(first.structural.category);
    }
    expect(() =>
      createApprovedSkillCatalogSnapshot([
        { ...initialSkillRegistry[0]!, authoringPath: "drafts/anything.yaml" },
        ...initialSkillRegistry.slice(1),
      ]),
    ).toThrow();
  });

  it("keeps sparse, uncertainty, refusal, no-apology and unknown-source boundaries explicit", async () => {
    const sparse = await run(fixture("sparse-nicer"));
    expect(sparse.assessment).toMatchObject({ status: "INSUFFICIENT_EVIDENCE", needs: [] });
    expect(sparse.selection.status).toBe("NONE");
    expect(sparse.plan.status).toBe("NONE");
    const uncertain = await run(fixture("uncertain-availability"));
    expect(uncertain.selection.selectedSkills.map(({ id }) => id)).toContain("expectation_setting");
    expect(uncertain.plan.avoid.map(({ text }) => text)).toContain(
      "Do not convert maybe or probably into a promise.",
    );
    expect(JSON.stringify(uncertain.plan)).not.toMatch(/I will be available|guarantee/i);
    const refusal = await run(fixture("direct-refusal"));
    expect(refusal.selection.selectedSkills.map(({ id }) => id)).toContain("decline");
    expect(JSON.stringify(refusal.plan)).not.toMatch(/accept the invitation|negotiate/i);
    const noApology = await run(fixture("less-confrontational-no-apology"));
    expect(noApology.structural.signalIds).toContain("conflict_management");
    expect(noApology.selection.selectedSkills.map(({ id }) => id)).not.toContain("apology");
    for (const id of [
      "manager-recipient-unproven",
      "identity-label-only",
      "ambiguous-speaker-empty-draft",
    ]) {
      const result = await run(fixture(id));
      expect(result.structural.unknownCodes).toContain("CONFIRMED_IDENTITY");
      expect(result.structural.unknownCodes).toContain("RELATIONSHIP");
      expect(result.evidence.some(({ kind }) => kind === "UNKNOWN_IDENTITY")).toBe(true);
      expect(result.evidence.some(({ kind }) => kind === "UNKNOWN_RELATIONSHIP")).toBe(true);
    }
  });

  it("preserves explicit tentative expectations without letting style displace them", async () => {
    for (const id of ["mixed-planning", "uncertain-availability", "english-chinese-code-switch"]) {
      const result = await run(fixture(id));
      expect(result.context.intentTags, id).toContain("set_expectation");
      expect(
        result.selection.selectedSkills.map(({ id: skillId }) => skillId),
        id,
      ).toContain("expectation_setting");
      expect(
        result.plan.avoid.map(({ text }) => text),
        id,
      ).toContain("Do not convert maybe or probably into a promise.");
      expect(result.selection.selectedSkills.length, id).toBeLessThanOrEqual(4);
    }

    const base = fixture("uncertain-availability");
    for (const draft of [
      "I might be available tomorrow.",
      "Probably today, but I need to check first.",
      "Maybe I can finish tomorrow.",
      "Around 3, if that works.",
    ]) {
      const changed = {
        ...base,
        request: {
          ...base.request,
          analysis: {
            ...base.request.analysis,
            draft: { ...base.request.analysis.draft, text: draft },
          },
        },
      };
      expect((await run(changed)).context.intentTags, draft).toContain("set_expectation");
    }
    for (const draft of [
      "I am available tomorrow.",
      "I don't want to meet tomorrow.",
      "The word maybe is in the document.",
    ]) {
      const changed = {
        ...base,
        request: {
          ...base.request,
          analysis: {
            ...base.request.analysis,
            draft: { ...base.request.analysis.draft, text: draft },
          },
        },
      };
      expect((await run(changed)).context.intentTags, draft).not.toContain("set_expectation");
    }
  });

  it("distinguishes a missed review event from genuine review progress", async () => {
    const repair = await run(fixture("repair-and-empathy"));
    expect(repair.context.intentTags).not.toContain("provide_status");
    expect(repair.context.situationTags).not.toContain("status_request");
    expect(repair.selection.selectedSkills.map(({ id }) => id)).not.toContain("status_update");
    expect(repair.selection.selectedSkills.map(({ id }) => id)).toEqual(
      expect.arrayContaining(["acknowledge_mistake", "emotional_validation", "apology"]),
    );

    const base = fixture("repair-and-empathy");
    for (const [other, draft] of [
      ["What's the status of the review?", "I'm still reviewing it."],
      ["When will the review be done?", "I'll finish the review tomorrow."],
      ["Can you share a progress update on the review?", "Testing is still in progress."],
    ] as const) {
      const changed = {
        ...base,
        request: {
          ...base.request,
          analysis: {
            ...base.request.analysis,
            messages: [{ ...base.request.analysis.messages[0]!, text: other }],
            draft: { ...base.request.analysis.draft, text: draft },
          },
        },
      };
      const result = await run(changed);
      expect(result.context.intentTags, other).toContain("provide_status");
      expect(
        result.selection.selectedSkills.map(({ id }) => id),
        other,
      ).toContain("status_update");
    }
  });

  it("requires an actual refusal before shadow selection may use the decline tag", async () => {
    const disagreement = fixture("disagree-relationship");
    const policy = decideCoachingAction(disagreement.request);
    const legacyContext = deriveSkillContext(disagreement.request, policy);
    expect(legacyContext.intentTags).toContain("decline");
    const refined = refineShadowSkillContext(
      normalizeCommunicationProblem(disagreement.request),
      legacyContext,
    );
    expect(refined.intentTags).not.toContain("decline");
    expect(refined.intentTags).toEqual(legacyContext.intentTags.filter((tag) => tag !== "decline"));
    expect((await run(disagreement)).selection.selectedSkills.map(({ id }) => id)).not.toContain(
      "decline",
    );
    for (const draft of [
      "I don't want to damage our relationship.",
      "I don't want to argue about this.",
      "I don't want to decline this invitation.",
      "I can't agree with this plan.",
    ]) {
      const request = {
        ...disagreement.request,
        analysis: {
          ...disagreement.request.analysis,
          draft: { ...disagreement.request.analysis.draft, text: draft },
        },
      };
      const candidate = deriveSkillContext(request, decideCoachingAction(request));
      expect(
        refineShadowSkillContext(normalizeCommunicationProblem(request), candidate).intentTags,
      ).not.toContain("decline");
    }
    for (const id of ["direct-refusal", "chinese-boundary-traditional"]) {
      const item = fixture(id);
      const context = deriveSkillContext(item.request, decideCoachingAction(item.request));
      expect(
        refineShadowSkillContext(normalizeCommunicationProblem(item.request), context).intentTags,
      ).toContain("decline");
    }
    for (const draft of ["No, I won't.", "I can't take this on.", "I don't want to."]) {
      const request = {
        ...disagreement.request,
        analysis: {
          ...disagreement.request.analysis,
          draft: { ...disagreement.request.analysis.draft, text: draft },
        },
      };
      const context = deriveSkillContext(request, decideCoachingAction(request));
      expect(
        refineShadowSkillContext(normalizeCommunicationProblem(request), context).intentTags,
        draft,
      ).toContain("decline");
    }
  });

  it("prioritizes distinct meaning under cap pressure and keeps a boundary request secondary", async () => {
    const capFixture = fixture("cap-pressure-multi-need");
    const policy = decideCoachingAction(capFixture.request);
    const context = deriveSkillContext(capFixture.request, policy);
    expect(
      rankEligibleSkillCandidates(approvedPipelineSnapshot.registry, context).length,
    ).toBeGreaterThan(4);
    const cap = await run(capFixture);
    expect(cap.selection.selectedSkills).toHaveLength(4);
    const selected = cap.selection.selectedSkills.map(({ id }) => id);
    expect(selected).toEqual([
      "expectation_setting",
      "status_update",
      "acknowledge_mistake",
      "ask_for_help",
    ]);
    expect(selected).not.toContain("en.direct_but_polite");
    expect(selected).not.toContain("apology");
    expect(cap.plan.avoid.map(({ text }) => text)).toContain(
      "Do not convert maybe or probably into a promise.",
    );
    const disagreement = await run(fixture("disagree-relationship"));
    expect(disagreement.selection.selectedSkills.map(({ id }) => id)).not.toContain("decline");
    expect(disagreement.selection.selectedSkills.map(({ id }) => id)).toContain("request");
    const boundary = await run(fixture("chinese-boundary-traditional"));
    const boundaryIds = boundary.selection.selectedSkills.map(({ id }) => id);
    expect(boundaryIds).toEqual([
      "boundary_setting",
      "decline",
      "request",
      "zh.natural_conciseness",
    ]);
    const crowdedBoundary = fixture("chinese-boundary-traditional");
    const crowded = {
      ...crowdedBoundary,
      id: "chinese-boundary-crowded",
      request: {
        ...crowdedBoundary.request,
        analysis: {
          ...crowdedBoundary.request.analysis,
          messages: [
            {
              ...crowdedBoundary.request.analysis.messages[0]!,
              text: "現在就要，別再拖了。這不公平，我很難過。",
            },
          ],
        },
      },
    };
    const crowdedIds = (await run(crowded)).selection.selectedSkills.map(({ id }) => id);
    expect(crowdedIds).toContain("boundary_setting");
    expect(crowdedIds).toContain("decline");
    expect(crowdedIds).toContain("de_escalation");
    expect(crowdedIds).toContain("emotional_validation");
    expect(crowdedIds).not.toContain("request");
  });

  it("rejects dangling/duplicate evidence, unsupported signals and malformed stage outputs", async () => {
    const result = await run(fixture("direct-refusal"));
    const request = {
      action: result.structural.action,
      taskPurpose: { kind: "PRIMARY_COACHING" as const },
      evidence: result.evidence,
      context: result.context,
    };
    expect(
      SkillAssessmentRequestSchema.safeParse({
        ...request,
        evidence: [...request.evidence, request.evidence[0]],
      }).success,
    ).toBe(false);
    const noEvidence = assessCommunicationNeeds({ ...request, evidence: [] });
    expect(noEvidence).toMatchObject({ status: "INSUFFICIENT_EVIDENCE", needs: [] });
    expect(() =>
      validateCommunicationAssessment(
        request,
        {
          status: "ASSESSED",
          needs: [{ signalId: "unsupported_signal", evidenceRefs: [result.evidence[0]!.id] }],
          uncertaintyCodes: [],
        },
        new Set(["clarity", "assertive_limits"]),
      ),
    ).toThrow("UNAPPROVED_COMMUNICATION_SIGNAL");
    expect(
      CommunicationAssessmentSchema.safeParse({ ...result.assessment, selectedSkills: [] }).success,
    ).toBe(false);
    expect(
      SkillSelectionResultSchema.safeParse({ ...result.selection, nextAction: "ASK_CLARIFICATION" })
        .success,
    ).toBe(false);
    expect(SkillPlanSchema.safeParse({ ...result.plan, callBudget: 2 }).success).toBe(false);
    expect(
      SkillPlanSchema.safeParse({
        ...result.plan,
        principles: [{ ...result.plan.principles[0]!, text: "x".repeat(301) }],
      }).success,
    ).toBe(false);
    expect(
      SkillPlanSchema.safeParse({
        ...result.plan,
        principles: Array.from({ length: 13 }, (_, index) => ({
          ...result.plan.principles[0]!,
          text: `P${index}`,
        })),
      }).success,
    ).toBe(false);
    const compiler = createDeterministicSkillPlanCompiler(approvedPipelineSnapshot);
    const invalidSelection = {
      ...result.selection,
      reasons: result.selection.reasons.map((reason, index) =>
        index === 0 ? { ...reason, evidenceRefs: ["E999"] } : reason,
      ),
    };
    expect(
      await compiler.compile({
        action: result.structural.action,
        selection: invalidSelection,
        evidence: result.evidence,
        context: result.context,
        constraints: [],
        catalogSnapshotId: approvedPipelineSnapshot.id,
      }),
    ).toMatchObject({
      status: "FAILED",
      selectedSkills: [],
      principles: [],
      failureCode: "INVALID_INPUT",
    });
  });

  it("fails closed on snapshot, unresolved, version, inactive, language and conflict faults", async () => {
    const result = await run(fixture("direct-refusal"));
    const compiler = createDeterministicSkillPlanCompiler(approvedPipelineSnapshot);
    const valid = {
      action: result.structural.action,
      selection: result.selection,
      evidence: result.evidence,
      context: result.context,
      constraints: [],
      catalogSnapshotId: approvedPipelineSnapshot.id,
    };
    expect(await compiler.compile({ ...valid, catalogSnapshotId: "wrong" })).toMatchObject({
      status: "FAILED",
      failureCode: "CATALOG_MISMATCH",
      selectedSkills: [],
    });
    const changedRef = (id: string, version: number) => ({
      ...valid,
      selection: {
        ...result.selection,
        selectedSkills: [{ id, version }],
        reasons: [{ ...result.selection.reasons[0]!, skillId: id }],
      },
    });
    expect(await compiler.compile(changedRef("unknown_skill", 1))).toMatchObject({
      status: "FAILED",
      failureCode: "UNRESOLVED_SKILL",
    });
    const selected = result.selection.selectedSkills[0]!;
    expect(await compiler.compile(changedRef(selected.id, selected.version + 1))).toMatchObject({
      status: "FAILED",
      failureCode: "UNRESOLVED_SKILL",
    });
    const inactive: ApprovedSkillCatalogSnapshot = createApprovedSkillCatalogSnapshot(
      initialSkillRegistry.map((skill) =>
        skill.id === selected.id ? { ...skill, status: "INACTIVE" } : skill,
      ),
    );
    const inactiveCompiler = createDeterministicSkillPlanCompiler(inactive);
    expect(
      await inactiveCompiler.compile({
        ...changedRef(selected.id, selected.version),
        catalogSnapshotId: inactive.id,
        selection: {
          ...changedRef(selected.id, selected.version).selection,
          catalogSnapshotId: inactive.id,
        },
      }),
    ).toMatchObject({ status: "FAILED", failureCode: "UNRESOLVED_SKILL" });
    expect(
      await compiler.compile({
        ...valid,
        context: {
          ...result.context,
          language: { primary: "ko", secondary: null, codeSwitching: false },
        },
      }),
    ).toMatchObject({
      status: "FAILED",
      failureCode: "UNRESOLVED_SKILL",
    });
    const conflict = createApprovedSkillCatalogSnapshot(
      initialSkillRegistry.map((skill) =>
        skill.id === "apology"
          ? {
              ...skill,
              compatibleSkills: skill.compatibleSkills.filter((id) => id !== "acknowledge_mistake"),
              conflictingSkills: ["acknowledge_mistake"],
            }
          : skill,
      ),
    );
    const conflictRun = createSkillPipelineHarness(conflict);
    const conflictResult = await conflictRun(fixture("apology-mistake"));
    expect(conflictResult.structural.conflictBlocked).toBe(true);
    expect(conflictResult.structural.selected.length).toBeLessThanOrEqual(4);
    expect(conflictResult.plan.selectedSkills).toEqual(conflictResult.selection.selectedSkills);
    const normal = await run(fixture("apology-mistake"));
    const conflictCompiler = createDeterministicSkillPlanCompiler(conflict);
    expect(
      await conflictCompiler.compile({
        action: normal.structural.action,
        selection: { ...normal.selection, catalogSnapshotId: conflict.id },
        evidence: normal.evidence,
        context: normal.context,
        constraints: [],
        catalogSnapshotId: conflict.id,
      }),
    ).toMatchObject({
      status: "FAILED",
      failureCode: "COMPILATION_FAILED",
      selectedSkills: [],
    });
  });

  it("handles a small synthetic catalog expansion without a fixed count or ordering assumption", async () => {
    const status = byId.get("status_update")!;
    const extra = {
      ...status,
      id: "synthetic_extra",
      name: "Synthetic extra status",
      description: "Approved test-only extra status guidance.",
      principles: ["Communicate only supported status in a clear sentence."],
      avoid: ["Do not invent a completed task."],
      compatibleSkills: [],
      conflictingSkills: [],
    };
    const variant = createApprovedSkillCatalogSnapshot([
      ...[...initialSkillRegistry].reverse(),
      extra,
      { ...extra, id: "synthetic_inactive", status: "INACTIVE" },
    ]);
    expect(variant.registry.length).toBe(initialSkillRegistry.length + 2);
    expect(variant.id).not.toBe(approvedPipelineSnapshot.id);
    const result = await createSkillPipelineHarness(variant)(fixture("status-request"));
    expect(result.selection.selectedSkills.length).toBeLessThanOrEqual(4);
    expect(result.selection.selectedSkills.map(({ id }) => id)).toContain("synthetic_extra");
    expect(result.selection.selectedSkills.map(({ id }) => id)).not.toContain("synthetic_inactive");
    expect(result.plan.selectedSkills).toEqual(result.selection.selectedSkills);
    expect(result.plan.catalogSnapshotId).toBe(variant.id);
  });

  it("keeps structural traces content-free and the production Composer/provider path unchanged", async () => {
    const item = fixture("manager-recipient-unproven");
    const inspected = await run(item);
    const traceText = JSON.stringify(inspected.structural);
    for (const privateText of [
      item.request.analysis.messages[0]?.text,
      item.request.analysis.draft.text,
      item.request.analysis.visibleContact.displayName,
      item.suppliedContext?.instruction,
    ])
      if (privateText) expect(traceText).not.toContain(privateText);
    const providerResult: CoachingDecisionResult = {
      ok: false,
      error: { code: "PROVIDER_ERROR", message: "Synthetic provider failure." },
    };
    const generator = {
      configuration: {
        providerId: "fixture",
        modelId: "fixture-model",
        configured: true,
        capabilities: { vision: false, textGeneration: true, structuredOutput: true },
      },
      generateCoachingDecision: vi.fn<CoachingTextGenerator["generateCoachingDecision"]>(
        async () => providerResult,
      ),
    };
    const result = await coachConversation(generator, item.request);
    expect(result).toEqual(providerResult);
    expect(generator.generateCoachingDecision).toHaveBeenCalledTimes(1);
    expect(generator.generateCoachingDecision.mock.calls[0]?.[2]).toEqual({
      principles: inspected.legacy.principles,
      avoid: inspected.legacy.avoid,
    });
    const local = fixture("ambiguous-speaker-empty-draft");
    await coachConversation(generator, local.request);
    expect(generator.generateCoachingDecision).toHaveBeenCalledTimes(1);
  });
});
