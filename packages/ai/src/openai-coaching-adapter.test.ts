import type {
  CoachingDecision,
  CoachingRequest,
  ConversationAnalysis,
} from "@ai-message-coach/contracts";
import { describe, expect, it, vi } from "vitest";

import { buildOpenAiCoachingRequest, OpenAiCoachingAdapter } from "./openai-coaching-adapter.js";
import { decideCoachingAction } from "./coaching-policy.js";

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
    displayName: "Alex",
    username: null,
    channelOrGroupName: null,
    platformHint: null,
    confidence: 0.8,
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
const policy = decideCoachingAction(request);
const decision: CoachingDecision = {
  action: "REWRITE_DRAFT",
  userIntent: policy.userIntent,
  actionConfidence: policy.actionConfidence,
  ambiguity: policy.ambiguity,
  primary: "Sorry, testing is taking longer, so it will probably be tomorrow.",
  alternatives: [],
};

function response(value: unknown): Response {
  return new Response(
    JSON.stringify({
      status: "completed",
      output: [{ content: [{ type: "output_text", text: JSON.stringify(value) }] }],
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

describe("OpenAI coaching adapter", () => {
  it("builds one private text-only structured request", () => {
    const body = buildOpenAiCoachingRequest(request, policy, "fixture-model");
    const serialized = JSON.stringify(body);
    expect(body).toMatchObject({
      model: "fixture-model",
      store: false,
      text: { format: { type: "json_schema", name: "coaching_decision", strict: true } },
    });
    expect(serialized).not.toContain("input_image");
    expect(serialized).not.toContain("Alex");
    expect(serialized).toContain("probably tomorrow");
    expect(serialized).toContain("Never invent deadlines");
  });

  it("validates successful output", async () => {
    const fetchImplementation = vi.fn<typeof fetch>(async () => response(decision));
    const adapter = new OpenAiCoachingAdapter({ apiKey: "synthetic-key", fetchImplementation });
    await expect(adapter.generateCoachingDecision(request, policy)).resolves.toEqual({
      ok: true,
      decision,
    });
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
  });

  it("rejects relationship output and malformed data", async () => {
    const adapter = new OpenAiCoachingAdapter({
      apiKey: "synthetic-key",
      fetchImplementation: vi.fn(async () => response({ ...decision, relationship: "manager" })),
    });
    await expect(adapter.generateCoachingDecision(request, policy)).resolves.toMatchObject({
      ok: false,
      error: { code: "INVALID_RESPONSE" },
    });
  });

  it.each([
    [401, "INVALID_CREDENTIALS"],
    [429, "RATE_LIMITED"],
    [404, "MODEL_UNAVAILABLE"],
    [504, "TIMEOUT"],
    [500, "PROVIDER_ERROR"],
  ])("maps HTTP %s", async (status, expected) => {
    const adapter = new OpenAiCoachingAdapter({
      apiKey: "synthetic-key",
      fetchImplementation: vi.fn(async () => new Response("{}", { status })),
    });
    await expect(adapter.generateCoachingDecision(request, policy)).resolves.toMatchObject({
      ok: false,
      error: { code: expected },
    });
  });
});
