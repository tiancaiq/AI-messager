import type {
  CoachingDecisionResult,
  CoachingRequest,
  ConversationAnalysis,
} from "@ai-message-coach/contracts";
import { describe, expect, it, vi } from "vitest";

import { coachConversation, type CoachingTextGenerator } from "./coaching-engine.js";

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
  it("validates provider wording and fixed action", async () => {
    const result: CoachingDecisionResult = {
      ok: true,
      decision: {
        action: "REWRITE_DRAFT",
        userIntent: { value: "Preserve uncertainty.", confidence: 0.96 },
        actionConfidence: 0.97,
        ambiguity: { material: false, reason: null },
        primary: "Sorry, testing is taking longer, so it will probably be tomorrow.",
        alternatives: [
          { label: "Shorter", text: "Testing is taking longer, so probably tomorrow." },
        ],
      },
    };
    await expect(coachConversation(generator(result), request)).resolves.toEqual(result);
  });

  it("rejects a provider action that disagrees with the deterministic gate", async () => {
    const result: CoachingDecisionResult = {
      ok: true,
      decision: {
        action: "SUGGEST_REPLY",
        userIntent: { value: "Reply", confidence: 0.9 },
        actionConfidence: 0.9,
        ambiguity: { material: false, reason: null },
        replies: [{ label: "Natural", text: "Sure." }],
      },
    };
    await expect(coachConversation(generator(result), request)).resolves.toMatchObject({
      ok: false,
      error: { code: "INVALID_RESPONSE" },
    });
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
    await expect(coachConversation(localGenerator, choiceRequest)).resolves.toMatchObject({
      ok: true,
      decision: { action: "SUGGEST_ACTIONS" },
    });
    await expect(coachConversation(localGenerator, closedRequest)).resolves.toMatchObject({
      ok: true,
      decision: { action: "NO_REPLY_NEEDED" },
    });
    expect(localGenerator.generateCoachingDecision).not.toHaveBeenCalled();
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
