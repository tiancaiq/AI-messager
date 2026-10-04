import type { CoachingDecisionResult, SkillPlan } from "@ai-message-coach/contracts";
import { describe, expect, it, vi } from "vitest";

import { type CoachingTextGenerator } from "../src/coaching-engine.js";
import { decideCoachingAction } from "../src/coaching-policy.js";
import { buildOpenAiCoachingRequest } from "../src/openai-coaching-adapter.js";
import { composerB4Fixtures, ordinaryComposerB4Fixtures } from "./composer-b4-fixtures.js";
import {
  assertComposerB4CallBudget,
  composerB4Order,
  runComposerB4Case,
  skillPlanAsCommunicationPlan,
} from "./composer-b4-harness.js";

const fixture = (id: string) => {
  const found = composerB4Fixtures.find((item) => item.id === id);
  if (!found) throw new Error(`Missing B4 case: ${id}`);
  return found;
};

function generator(result: CoachingDecisionResult): CoachingTextGenerator {
  return {
    configuration: {
      providerId: "fixture",
      modelId: "fixture-model",
      configured: true,
      capabilities: { vision: false, textGeneration: true, structuredOutput: true },
    },
    generateCoachingDecision: vi.fn(async () => result),
  };
}

function promptInput(value: Record<string, unknown>): Record<string, unknown> {
  const input = value.input as { content: { text: string }[] }[];
  return JSON.parse(input[0]!.content[0]!.text) as Record<string, unknown>;
}

describe("B4 evaluation-only Composer A/B isolation", () => {
  it("uses 30 distinct synthetic provider-generation cases with ordinary and adversarial coverage", () => {
    expect(composerB4Fixtures).toHaveLength(30);
    expect(ordinaryComposerB4Fixtures).toHaveLength(4);
    expect(new Set(composerB4Fixtures.map(({ id }) => id)).size).toBe(30);
    for (const item of composerB4Fixtures)
      expect(["REWRITE_DRAFT", "COMPLETE_DRAFT", "SUGGEST_REPLY"]).toContain(
        decideCoachingAction(item.request).action,
      );
    for (const id of [
      "disagree-relationship",
      "cap-pressure-multi-need",
      "chinese-boundary-traditional",
      "mixed-planning",
      "uncertain-availability",
      "sparse-nicer",
      "repair-and-empathy",
      "ordinary-appreciation",
    ])
      expect(
        composerB4Fixtures.some((item) => item.id === id),
        id,
      ).toBe(true);
  });

  it("balances blind call order and enforces the 60-call hard cap", () => {
    const orders = composerB4Fixtures.map((_, index) => composerB4Order(index, 20261004));
    expect(orders.filter(([first]) => first === "legacy")).toHaveLength(15);
    expect(orders.filter(([first]) => first === "new")).toHaveLength(15);
    expect(orders.every(([first, second]) => first !== second)).toBe(true);
    expect(composerB4Order(0, 20261004)).toEqual(composerB4Order(0, 20261004));
    expect(() => assertComposerB4CallBudget(58, 2)).not.toThrow();
    expect(() => assertComposerB4CallBudget(59, 2)).toThrow("budget exhausted");
    expect(() => assertComposerB4CallBudget(60, 1)).toThrow("budget exhausted");
  });

  it("adapts only approved SkillPlan guidance and rejects failed plans", () => {
    const plan: SkillPlan = {
      status: "COMPILED",
      selectedSkills: [{ id: "expectation_setting", version: 1 }],
      principles: [
        {
          text: "State supported timing.",
          skillRefs: [{ id: "expectation_setting", version: 1 }],
          evidenceRefs: ["E1"],
        },
      ],
      avoid: [
        {
          text: "Do not invent a promise.",
          skillRefs: [{ id: "expectation_setting", version: 1 }],
          evidenceRefs: ["E1"],
        },
      ],
      tradeoffs: [],
      recommendations: [],
      catalogSnapshotId: "approved-fnv128:test",
    };
    expect(skillPlanAsCommunicationPlan(plan)).toEqual({
      status: "SELECTED",
      selectedSkills: [
        {
          id: "expectation_setting",
          version: 1,
          reasons: ["Validated SkillPlan selection for B4 evaluation."],
        },
      ],
      principles: ["State supported timing."],
      avoid: ["Do not invent a promise."],
    });
    expect(
      skillPlanAsCommunicationPlan({
        ...plan,
        status: "NONE",
        selectedSkills: [],
        principles: [],
        avoid: [],
      }),
    ).toMatchObject({
      status: "NONE",
      selectedSkills: [],
      principles: [],
      avoid: [],
    });
    expect(() => skillPlanAsCommunicationPlan({ ...plan, status: "FAILED" })).toThrow();
  });

  it("holds the fixed request, action, Composer prompt/model/settings/schema constant across arms", async () => {
    const item = fixture("mixed-planning");
    const failed: CoachingDecisionResult = {
      ok: false,
      error: { code: "PROVIDER_ERROR", message: "Synthetic provider failure." },
    };
    const textGenerator = generator(failed);
    const pair = await runComposerB4Case(item, textGenerator, ["new", "legacy"]);
    expect(pair.action).toBe("REWRITE_DRAFT");
    expect(pair.arms.map(({ arm }) => arm)).toEqual(["new", "legacy"]);
    expect(pair.arms.map(({ providerCalls }) => providerCalls)).toEqual([1, 1]);
    expect(textGenerator.generateCoachingDecision).toHaveBeenCalledTimes(2);
    const calls = vi.mocked(textGenerator.generateCoachingDecision).mock.calls;
    expect(calls[0]?.[0]).toEqual(calls[1]?.[0]);
    expect(calls[0]?.[1]).toEqual(calls[1]?.[1]);
    expect(calls[0]?.[0]).toEqual(item.request);
    expect(calls[0]?.[2]).not.toEqual(calls[1]?.[2]);
    const payloads = pair.arms.map(({ guidance }) =>
      buildOpenAiCoachingRequest(
        item.request,
        decideCoachingAction(item.request),
        guidance,
        "fixture-model",
      ),
    );
    const inputs = payloads.map(promptInput);
    const tasks = inputs.map((input) => input.composerTask as Record<string, unknown>);
    expect(tasks[0]?.coreCommunicationGuidance).not.toEqual(tasks[1]?.coreCommunicationGuidance);
    delete tasks[0]!.coreCommunicationGuidance;
    delete tasks[1]!.coreCommunicationGuidance;
    expect(inputs[0]).toEqual(inputs[1]);
    const withoutInput = payloads.map((payload) => ({ ...payload, input: undefined }));
    expect(withoutInput[0]).toEqual(withoutInput[1]);
    expect(JSON.stringify(payloads)).not.toMatch(/legacy plan|improved skillplan/iu);
  });

  it("applies the same production uncertainty guard to both arms", async () => {
    const item = fixture("uncertain-availability");
    const policy = decideCoachingAction(item.request);
    const unsafe: CoachingDecisionResult = {
      ok: true,
      decision: {
        action: "REWRITE_DRAFT",
        userIntent: policy.userIntent,
        actionConfidence: policy.actionConfidence,
        ambiguity: policy.ambiguity,
        primary: "I will definitely be available tomorrow.",
        alternatives: [],
      },
    };
    const pair = await runComposerB4Case(item, generator(unsafe), ["legacy", "new"]);
    expect(pair.arms.map(({ result }) => result)).toEqual([
      {
        ok: false,
        error: {
          code: "INVALID_RESPONSE",
          message: "The provider returned an invalid coaching result.",
        },
      },
      {
        ok: false,
        error: {
          code: "INVALID_RESPONSE",
          message: "The provider returned an invalid coaching result.",
        },
      },
    ]);
    expect(pair.arms.every(({ providerResult }) => providerResult?.ok === true)).toBe(true);
  });

  it("does not run a provider arm for a local-action fixture", async () => {
    const local = {
      ...fixture("status-request"),
      id: "b4-local-action",
      request: {
        ...fixture("status-request").request,
        analysis: {
          ...fixture("status-request").request.analysis,
          messages: [
            {
              ...fixture("status-request").request.analysis.messages[0]!,
              text: "Want to come tonight?",
            },
          ],
        },
      },
    };
    expect(decideCoachingAction(local.request).action).toBe("SUGGEST_ACTIONS");
    await expect(
      runComposerB4Case(
        local,
        generator({ ok: false, error: { code: "PROVIDER_ERROR", message: "Synthetic." } }),
        ["legacy", "new"],
      ),
    ).rejects.toThrow("provider-generated fixed action");
  });
});
