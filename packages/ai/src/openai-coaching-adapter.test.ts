import type {
  CoachingDecision,
  CoachingRequest,
  CommunicationGuidance,
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
const communicationGuidance: CommunicationGuidance = {
  principles: ["State known status clearly."],
  avoid: ["Do not invent dates."],
};
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
  it("builds one private text-only root-object request for rewriting", () => {
    const body = buildOpenAiCoachingRequest(
      request,
      policy,
      communicationGuidance,
      "fixture-model",
    );
    const serialized = JSON.stringify(body);
    expect(body).toMatchObject({
      model: "fixture-model",
      store: false,
      text: {
        format: {
          type: "json_schema",
          name: "coaching_message",
          strict: true,
          schema: {
            type: "object",
            required: ["primary", "alternatives"],
            additionalProperties: false,
          },
        },
      },
    });
    expect(serialized).not.toContain('"$schema"');
    expect(serialized).not.toContain('"oneOf"');
    expect(serialized).not.toContain('"anyOf"');
    expect(serialized).not.toContain("input_image");
    expect(serialized).not.toContain("Alex");
    expect(serialized).toContain("probably tomorrow");
    expect(serialized).toContain("Never invent deadlines");
    expect(serialized).toContain("State known status clearly");
    expect(serialized).not.toContain("status_update");
    expect(serialized).not.toContain("Matched visible situation");
    expect(serialized).not.toContain('"status":"SELECTED"');
    expect(serialized).not.toContain('"version":1');
  });

  it("validates wording output and reconstructs policy-owned metadata locally", async () => {
    const fetchImplementation = vi.fn<typeof fetch>(async () =>
      response({ primary: decision.primary, alternatives: decision.alternatives }),
    );
    const adapter = new OpenAiCoachingAdapter({ apiKey: "synthetic-key", fetchImplementation });
    await expect(
      adapter.generateCoachingDecision(request, policy, communicationGuidance),
    ).resolves.toEqual({
      ok: true,
      decision,
    });
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
  });

  it("rejects policy-owned or relationship fields in provider wording output", async () => {
    const adapter = new OpenAiCoachingAdapter({
      apiKey: "synthetic-key",
      fetchImplementation: vi.fn(async () =>
        response({
          action: "REWRITE_DRAFT",
          primary: decision.primary,
          alternatives: decision.alternatives,
          relationship: "manager",
        }),
      ),
    });
    await expect(
      adapter.generateCoachingDecision(request, policy, communicationGuidance),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "INVALID_RESPONSE" },
    });
  });

  it("uses a root-object reply schema after an explicit selection", async () => {
    const selectedRequest: CoachingRequest = {
      analysis: { ...analysis, draft: { text: null, confidence: 0.96 } },
      selection: { kind: "CLARIFICATION", answer: "Acknowledge" },
    };
    const selectedPolicy = decideCoachingAction(selectedRequest);
    const fetchImplementation = vi.fn<typeof fetch>(async () =>
      response({ replies: [{ label: "Natural", text: "Got it—thanks for the update." }] }),
    );
    const adapter = new OpenAiCoachingAdapter({ apiKey: "synthetic-key", fetchImplementation });

    await expect(
      adapter.generateCoachingDecision(selectedRequest, selectedPolicy, communicationGuidance),
    ).resolves.toEqual({
      ok: true,
      decision: {
        action: "SUGGEST_REPLY",
        userIntent: { value: "Acknowledge", confidence: 1 },
        actionConfidence: 1,
        ambiguity: { material: false, reason: null },
        replies: [{ label: "Natural", text: "Got it—thanks for the update." }],
      },
    });

    const body = JSON.parse(String(fetchImplementation.mock.calls[0]?.[1]?.body)) as {
      text: { format: { name: string; schema: Record<string, unknown> } };
    };
    expect(body.text.format).toMatchObject({
      name: "coaching_replies",
      schema: { type: "object", required: ["replies"], additionalProperties: false },
    });
    expect(JSON.stringify(body.text.format.schema)).not.toMatch(/"(?:oneOf|anyOf)"/u);
  });

  it("does not call a provider for a locally resolved action", async () => {
    const localRequest: CoachingRequest = {
      analysis: { ...analysis, draft: { text: null, confidence: 0.96 } },
      selection: null,
    };
    const invitationRequest: CoachingRequest = {
      ...localRequest,
      analysis: {
        ...localRequest.analysis,
        messages: [{ ...analysis.messages[0]!, text: "Want to come tonight?" }],
      },
    };
    const localPolicy = decideCoachingAction(invitationRequest);
    const fetchImplementation = vi.fn<typeof fetch>();
    const adapter = new OpenAiCoachingAdapter({ apiKey: "synthetic-key", fetchImplementation });

    await expect(
      adapter.generateCoachingDecision(invitationRequest, localPolicy, communicationGuidance),
    ).resolves.toMatchObject({ ok: false, error: { code: "INVALID_RESPONSE" } });
    expect(fetchImplementation).not.toHaveBeenCalled();
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
    await expect(
      adapter.generateCoachingDecision(request, policy, communicationGuidance),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: expected },
    });
  });
});
