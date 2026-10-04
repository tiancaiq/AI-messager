import type {
  CoachingDecisionResult,
  CoachingRequest,
  CommunicationGuidance,
  CommunicationPlan,
  ConversationAnalysis,
} from "@ai-message-coach/contracts";
import { describe, expect, it, vi } from "vitest";

import { createSkillEngine, initialSkillRegistry } from "@ai-message-coach/skills";
import { skillSelectionEvaluationFixtures } from "@ai-message-coach/test-fixtures";

import { coachConversation, type CoachingTextGenerator } from "./coaching-engine.js";
import { decideCoachingAction } from "./coaching-policy.js";
import { deriveSkillContext } from "./skill-context.js";
import { compareSkillReferences, type SkillPlanShadowTrace } from "./skill-shadow.js";

const analysis: ConversationAnalysis = {
  messages: [
    {
      id: "m1",
      order: 1,
      speaker: "OTHER",
      text: "Can you finish this today?",
      textConfidence: 0.98,
      speakerConfidence: 0.95,
    },
  ],
  draft: { text: "sry testing taking longer probably tomorrow", confidence: 0.96 },
  participants: [],
  visibleContact: {
    displayName: null,
    username: null,
    channelOrGroupName: null,
    platformHint: null,
    confidence: 0.2,
  },
  language: {
    primary: "en",
    secondary: null,
    script: "NOT_APPLICABLE",
    codeSwitching: false,
    supportedForLanguageSpecificSkills: true,
    confidence: 0.99,
  },
  conversation: { summary: "A deadline is being discussed.", confidence: 0.9 },
  warnings: [],
  overallConfidence: 0.92,
};

const request: CoachingRequest = { analysis, selection: null };
const fixedDecision = {
  userIntent: {
    value: "Improve the visible draft while preserving its meaning.",
    confidence: 0.96,
  },
  actionConfidence: 0.97,
  ambiguity: { material: false, reason: null },
} as const;

function generator(result: CoachingDecisionResult, configured = true): CoachingTextGenerator {
  return {
    configuration: {
      providerId: "fixture",
      modelId: "fixture-model",
      configured,
      capabilities: { vision: false, textGeneration: true, structuredOutput: true },
    },
    generateCoachingDecision: vi.fn(async () => result),
  };
}

describe("provider-neutral coaching engine", () => {
  it("normalizes structurally while leaving current skill inputs and results unchanged", async () => {
    const skillEngine = createSkillEngine(initialSkillRegistry);
    const reviewedOrderDifferences = new Set([
      "missed-commitment",
      "professional-status",
      "less-confrontational-no-apology",
    ]);
    const reviewedContentDifferences = new Set(["mixed-planning"]);
    for (const fixture of skillSelectionEvaluationFixtures) {
      const expectedPolicy = decideCoachingAction(fixture.request);
      const expectedContext = deriveSkillContext(fixture.request, expectedPolicy);
      const expectedPlan = skillEngine.select(expectedContext);
      const contexts: (typeof expectedContext)[] = [];
      const plans: CommunicationPlan[] = [];
      const statuses: unknown[] = [];
      const traces: SkillPlanShadowTrace[] = [];
      const textGenerator = generator({
        ok: false,
        error: { code: "PROVIDER_ERROR", message: "Synthetic generation failure." },
      });
      const actualResult = await coachConversation(textGenerator, fixture.request, {
        skillPlanner: {
          plan(context) {
            contexts.push(context);
            return skillEngine.select(context);
          },
        },
        onCommunicationPlan: (plan) => plans.push(plan),
        onProblemNormalization: (status) => statuses.push(status),
        onShadowComparison: (trace) => traces.push(trace),
      });
      expect(statuses, fixture.id).toEqual([
        { status: "NORMALIZED", goalKind: expect.any(String) },
      ]);
      expect(JSON.stringify(statuses), fixture.id).not.toContain(
        fixture.request.analysis.draft.text ?? "synthetic-private-text",
      );
      expect(traces, fixture.id).toHaveLength(1);
      expect(traces[0]?.path, fixture.id).toBe("B3_SHADOW");
      expect(traces[0]?.action, fixture.id).toBe(expectedPolicy.action);
      expect(traces[0]?.productionSelected, fixture.id).toEqual(
        (expectedPolicy.action === "SUGGEST_ACTIONS" ||
        expectedPolicy.action === "ASK_CLARIFICATION" ||
        expectedPolicy.action === "NO_REPLY_NEEDED"
          ? []
          : expectedPlan.selectedSkills
        ).map(({ id, version }) => ({ id, version })),
      );
      expect(traces[0]?.planComparisonCategory, fixture.id).toBe(
        reviewedOrderDifferences.has(fixture.id) || reviewedContentDifferences.has(fixture.id)
          ? "EXPECTED_DIFFERENCE"
          : "MATCH",
      );
      expect(traces[0]?.guidanceContentEqual, fixture.id).toBe(
        !reviewedContentDifferences.has(fixture.id),
      );
      expect(traces[0]?.guidanceOrderEqual, fixture.id).toBe(
        !reviewedOrderDifferences.has(fixture.id) && !reviewedContentDifferences.has(fixture.id),
      );
      expect(traces[0]?.principleCount, fixture.id).toBe(
        ["SUGGEST_ACTIONS", "ASK_CLARIFICATION", "NO_REPLY_NEEDED"].includes(expectedPolicy.action)
          ? 0
          : expectedPlan.principles.length,
      );
      expect(traces[0]?.avoidCount, fixture.id).toBe(
        ["SUGGEST_ACTIONS", "ASK_CLARIFICATION", "NO_REPLY_NEEDED"].includes(expectedPolicy.action)
          ? 0
          : expectedPlan.avoid.length,
      );
      const traceText = JSON.stringify(traces);
      for (const privateText of [
        fixture.request.analysis.draft.text,
        ...fixture.request.analysis.messages.map((message) => message.text),
        fixture.request.analysis.visibleContact.displayName,
      ]) {
        if (privateText) expect(traceText, fixture.id).not.toContain(privateText);
      }
      if (
        ["SUGGEST_ACTIONS", "ASK_CLARIFICATION", "NO_REPLY_NEEDED"].includes(expectedPolicy.action)
      ) {
        expect(actualResult, fixture.id).toMatchObject({
          ok: true,
          decision: { action: expectedPolicy.action },
        });
        expect(contexts, fixture.id).toEqual([]);
        expect(plans, fixture.id).toEqual([
          { status: "NONE", selectedSkills: [], principles: [], avoid: [] },
        ]);
        expect(textGenerator.generateCoachingDecision, fixture.id).not.toHaveBeenCalled();
      } else {
        expect(actualResult, fixture.id).toEqual({
          ok: false,
          error: { code: "PROVIDER_ERROR", message: "Synthetic generation failure." },
        });
        expect(contexts, fixture.id).toEqual([expectedContext]);
        expect(plans, fixture.id).toEqual([expectedPlan]);
        expect(textGenerator.generateCoachingDecision, fixture.id).toHaveBeenCalledTimes(1);
        expect(textGenerator.generateCoachingDecision, fixture.id).toHaveBeenCalledWith(
          fixture.request,
          expectedPolicy,
          { principles: expectedPlan.principles, avoid: expectedPlan.avoid },
        );
      }
    }
  });

  it("validates provider wording and fixed action", async () => {
    const result: CoachingDecisionResult = {
      ok: true,
      decision: {
        action: "REWRITE_DRAFT",
        ...fixedDecision,
        primary: "Sorry, testing is taking longer, so it will probably be tomorrow.",
        alternatives: [
          { label: "Shorter", text: "Testing is taking longer, so probably tomorrow." },
        ],
      },
    };
    await expect(coachConversation(generator(result), request)).resolves.toEqual(result);
  });

  it("passes only compact guidance to generation and keeps selection metadata inspectable", async () => {
    const result: CoachingDecisionResult = {
      ok: true,
      decision: {
        action: "REWRITE_DRAFT",
        ...fixedDecision,
        primary: "Sorry, testing is taking longer, so it will probably be tomorrow.",
        alternatives: [],
      },
    };
    const generatedGuidance: CommunicationGuidance[] = [];
    const inspectedPlans: CommunicationPlan[] = [];
    const textGenerator = generator(result);
    textGenerator.generateCoachingDecision = vi.fn(async (_request, _policy, guidance) => {
      generatedGuidance.push(guidance);
      return result;
    });

    await expect(
      coachConversation(textGenerator, request, {
        onShadowComparison: (trace) => {
          trace.shadowSelected.splice(0);
        },
        onCommunicationPlan: (plan) => {
          inspectedPlans.push(plan);
          plan.principles.splice(0);
        },
      }),
    ).resolves.toEqual(result);

    expect(generatedGuidance).toHaveLength(1);
    expect(Object.keys(generatedGuidance[0] ?? {}).sort()).toEqual(["avoid", "principles"]);
    expect(inspectedPlans[0]?.selectedSkills.map(({ id }) => id)).toEqual([
      "acknowledge_mistake",
      "apology",
      "expectation_setting",
      "status_update",
    ]);
    expect(inspectedPlans[0]?.principles).toEqual([]);
    expect(generatedGuidance[0]?.principles.length).toBeGreaterThan(0);
  });

  it("isolates a failing shadow observer from production result and model-call count", async () => {
    const result: CoachingDecisionResult = {
      ok: true,
      decision: {
        action: "REWRITE_DRAFT",
        ...fixedDecision,
        primary: "Sorry, testing is taking longer, so it will probably be tomorrow.",
        alternatives: [],
      },
    };
    const textGenerator = generator(result);
    await expect(
      coachConversation(textGenerator, request, {
        onShadowComparison: () => {
          throw new Error("synthetic observer failure");
        },
      }),
    ).resolves.toEqual(result);
    expect(textGenerator.generateCoachingDecision).toHaveBeenCalledTimes(1);
  });

  it("classifies structural shadow differences deterministically without claiming quality", () => {
    const production: CommunicationPlan = {
      status: "SELECTED",
      selectedSkills: [{ id: "alpha", version: 1, reasons: ["Synthetic metadata match."] }],
      principles: [],
      avoid: [],
    };
    const shadow = {
      status: "SELECTED" as const,
      selectedSkills: [{ id: "alpha", version: 1 }],
      reasons: [{ skillId: "alpha", evidenceRefs: ["E1"], code: "NEED_MATCH" as const }],
      uncertaintyCodes: [],
      catalogSnapshotId: "synthetic",
    };
    expect(compareSkillReferences(production, shadow, false)).toBe("MATCH");
    expect(
      compareSkillReferences(
        production,
        { ...shadow, status: "NONE", selectedSkills: [], reasons: [] },
        true,
      ),
    ).toBe("EXPECTED_DIFFERENCE");
    expect(
      compareSkillReferences(
        production,
        { ...shadow, status: "NONE", selectedSkills: [], reasons: [] },
        false,
      ),
    ).toBe("POTENTIAL_REGRESSION");
    expect(
      compareSkillReferences({ ...production, status: "NONE", selectedSkills: [] }, shadow, false),
    ).toBe("POTENTIAL_IMPROVEMENT");
    expect(
      compareSkillReferences(
        { ...production, status: "FAILED", selectedSkills: [] },
        shadow,
        false,
      ),
    ).toBe("NOT_COMPARABLE");
  });

  it("distinguishes a selection failure and falls back to generic generation", async () => {
    const result: CoachingDecisionResult = {
      ok: true,
      decision: {
        action: "REWRITE_DRAFT",
        ...fixedDecision,
        primary: "Testing is taking longer, so it will probably be tomorrow.",
        alternatives: [],
      },
    };
    const generatedGuidance: CommunicationGuidance[] = [];
    const textGenerator = generator(result);
    textGenerator.generateCoachingDecision = vi.fn(async (_request, _policy, guidance) => {
      generatedGuidance.push(guidance);
      return result;
    });

    await expect(
      coachConversation(textGenerator, request, {
        skillPlanner: {
          plan() {
            throw new Error("synthetic selection failure");
          },
        },
      }),
    ).resolves.toEqual(result);
    expect(generatedGuidance).toEqual([{ principles: [], avoid: [] }]);
  });

  it("rejects a provider action that disagrees with the deterministic gate", async () => {
    const result: CoachingDecisionResult = {
      ok: true,
      decision: {
        action: "SUGGEST_REPLY",
        ...fixedDecision,
        replies: [{ label: "Natural", text: "Sure." }],
      },
    };
    await expect(coachConversation(generator(result), request)).resolves.toMatchObject({
      ok: false,
      error: { code: "INVALID_RESPONSE" },
    });
  });

  it("rejects accepting wording after the user explicitly chooses to decline", async () => {
    const declineRequest: CoachingRequest = {
      analysis: {
        ...analysis,
        draft: { text: null, confidence: 0.96 },
        messages: [{ ...analysis.messages[0]!, text: "Want to come tonight?" }],
      },
      selection: {
        kind: "ACTION",
        id: "decline",
        label: "Decline",
        intent: "Decline without inventing a reason.",
      },
    };
    const declineDecision = {
      action: "SUGGEST_REPLY" as const,
      userIntent: { value: "Decline without inventing a reason.", confidence: 1 },
      actionConfidence: 1,
      ambiguity: { material: false, reason: null },
      replies: [{ label: "Natural", text: "Sure, I would love to come tonight!" }],
    };
    const result: CoachingDecisionResult = { ok: true, decision: declineDecision };

    await expect(coachConversation(generator(result), declineRequest)).resolves.toMatchObject({
      ok: false,
      error: { code: "INVALID_RESPONSE" },
    });

    const changedIntent: CoachingDecisionResult = {
      ok: true,
      decision: {
        ...declineDecision,
        userIntent: { value: "Accept the invitation.", confidence: 1 },
      },
    };
    await expect(
      coachConversation(generator(changedIntent), declineRequest),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "INVALID_RESPONSE" },
    });

    const validDecline: CoachingDecisionResult = {
      ok: true,
      decision: {
        ...declineDecision,
        replies: [
          { label: "Natural", text: "Thanks for inviting me, but I'll have to pass tonight." },
        ],
      },
    };
    await expect(coachConversation(generator(validDecline), declineRequest)).resolves.toEqual(
      validDecline,
    );
  });

  it("rejects a negated refusal that semantically accepts the invitation", async () => {
    const declineRequest: CoachingRequest = {
      analysis: {
        ...analysis,
        draft: { text: null, confidence: 0.96 },
        messages: [{ ...analysis.messages[0]!, text: "Want to come tonight?" }],
      },
      selection: {
        kind: "ACTION",
        id: "decline",
        label: "Decline",
        intent: "Decline without inventing a reason.",
      },
    };
    const result: CoachingDecisionResult = {
      ok: true,
      decision: {
        action: "SUGGEST_REPLY",
        userIntent: { value: "Decline without inventing a reason.", confidence: 1 },
        actionConfidence: 1,
        ambiguity: { material: false, reason: null },
        replies: [{ label: "Natural", text: "I can't decline—I’d be delighted to join you." }],
      },
    };

    await expect(coachConversation(generator(result), declineRequest)).resolves.toMatchObject({
      ok: false,
      error: { code: "INVALID_RESPONSE" },
    });
  });

  it.each([
    "I’d be delighted to join you another time, but I can’t tonight.",
    "I’d love to, but I can’t tonight.",
    "I can’t decline because I can’t attend tonight.",
  ])("accepts a polite decline with a genuine refusal: %s", async (text) => {
    const declineRequest: CoachingRequest = {
      analysis: {
        ...analysis,
        draft: { text: null, confidence: 0.96 },
        messages: [{ ...analysis.messages[0]!, text: "Want to come tonight?" }],
      },
      selection: {
        kind: "ACTION",
        id: "decline",
        label: "Decline",
        intent: "Decline without inventing a reason.",
      },
    };
    const result: CoachingDecisionResult = {
      ok: true,
      decision: {
        action: "SUGGEST_REPLY",
        userIntent: { value: "Decline without inventing a reason.", confidence: 1 },
        actionConfidence: 1,
        ambiguity: { material: false, reason: null },
        replies: [{ label: "Natural", text }],
      },
    };

    await expect(coachConversation(generator(result), declineRequest)).resolves.toEqual(result);
  });

  it.each([
    "I can’t decline—count me in.",
    "I refuse to say no; I'll join.",
    "I can’t attend, but count me in anyway.",
    "I can’t tonight. See you there.",
    "I’d be delighted to join you.",
    "I cannot wait to join you.",
    "I can’t resist—I’d love to join you.",
  ])("rejects a reply that lacks an uncontradicted refusal: %s", async (text) => {
    const declineRequest: CoachingRequest = {
      analysis: {
        ...analysis,
        draft: { text: null, confidence: 0.96 },
        messages: [{ ...analysis.messages[0]!, text: "Want to come tonight?" }],
      },
      selection: {
        kind: "ACTION",
        id: "decline",
        label: "Decline",
        intent: "Decline without inventing a reason.",
      },
    };
    const result: CoachingDecisionResult = {
      ok: true,
      decision: {
        action: "SUGGEST_REPLY",
        userIntent: { value: "Decline without inventing a reason.", confidence: 1 },
        actionConfidence: 1,
        ambiguity: { material: false, reason: null },
        replies: [{ label: "Natural", text }],
      },
    };

    await expect(coachConversation(generator(result), declineRequest)).resolves.toMatchObject({
      ok: false,
      error: { code: "INVALID_RESPONSE" },
    });
  });

  it("does not treat a negated decline as a refusal even with a deferred invitation", async () => {
    const declineRequest: CoachingRequest = {
      analysis: {
        ...analysis,
        draft: { text: null, confidence: 0.96 },
        messages: [{ ...analysis.messages[0]!, text: "Want to come tonight?" }],
      },
      selection: {
        kind: "ACTION",
        id: "decline",
        label: "Decline",
        intent: "Decline without inventing a reason.",
      },
    };
    const result: CoachingDecisionResult = {
      ok: true,
      decision: {
        action: "SUGGEST_REPLY",
        userIntent: { value: "Decline without inventing a reason.", confidence: 1 },
        actionConfidence: 1,
        ambiguity: { material: false, reason: null },
        replies: [
          {
            label: "Natural",
            text: "I can’t decline—I’d be delighted to join you another time.",
          },
        ],
      },
    };

    await expect(coachConversation(generator(result), declineRequest)).resolves.toMatchObject({
      ok: false,
      error: { code: "INVALID_RESPONSE" },
    });
  });

  it.each([
    ["hardened uncertainty", "Testing will definitely be complete tomorrow."],
    ["an invented date anchor", "Testing will probably be complete tomorrow, by Friday."],
  ])("rejects %s", async (_case, primary) => {
    const result: CoachingDecisionResult = {
      ok: true,
      decision: {
        action: "REWRITE_DRAFT",
        ...fixedDecision,
        primary,
        alternatives: [],
      },
    };
    await expect(coachConversation(generator(result), request)).resolves.toMatchObject({
      ok: false,
      error: { code: "INVALID_RESPONSE" },
    });
  });

  it("accepts cautious uncertainty while preserving the visible date anchor", async () => {
    const result: CoachingDecisionResult = {
      ok: true,
      decision: {
        action: "REWRITE_DRAFT",
        ...fixedDecision,
        primary: "Testing is taking longer, so I think it will probably be tomorrow.",
        alternatives: [],
      },
    };
    await expect(coachConversation(generator(result), request)).resolves.toEqual(result);
  });

  it("returns local choice and no-reply decisions without calling a provider", async () => {
    const localGenerator = generator(
      { ok: false, error: { code: "PROVIDER_ERROR", message: "unused" } },
      false,
    );
    const choiceRequest = {
      ...request,
      analysis: {
        ...analysis,
        draft: { text: null, confidence: 0.9 },
        messages: [{ ...analysis.messages[0]!, text: "Want to come tonight?" }],
      },
    };
    const closedRequest = {
      ...choiceRequest,
      analysis: {
        ...choiceRequest.analysis,
        messages: [{ ...analysis.messages[0]!, text: "Thanks, looks good." }],
      },
    };
    const inspectedPlans: CommunicationPlan[] = [];
    const options = { onCommunicationPlan: (plan: CommunicationPlan) => inspectedPlans.push(plan) };
    await expect(coachConversation(localGenerator, choiceRequest, options)).resolves.toMatchObject({
      ok: true,
      decision: { action: "SUGGEST_ACTIONS" },
    });
    await expect(coachConversation(localGenerator, closedRequest, options)).resolves.toMatchObject({
      ok: true,
      decision: { action: "NO_REPLY_NEEDED" },
    });
    expect(localGenerator.generateCoachingDecision).not.toHaveBeenCalled();
    expect(inspectedPlans).toEqual([
      { status: "NONE", selectedSkills: [], principles: [], avoid: [] },
      { status: "NONE", selectedSkills: [], principles: [], avoid: [] },
    ]);
  });

  it("fails safely when generation needs an unconfigured provider", async () => {
    await expect(
      coachConversation(
        generator({ ok: false, error: { code: "PROVIDER_ERROR", message: "unused" } }, false),
        request,
      ),
    ).resolves.toMatchObject({ ok: false, error: { code: "NOT_CONFIGURED" } });
  });
});
