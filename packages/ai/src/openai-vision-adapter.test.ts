import type { ConversationAnalysis, ConversationImageRequest } from "@ai-message-coach/contracts";
import { describe, expect, it, vi } from "vitest";

import { buildOpenAiConversationRequest, OpenAiVisionAdapter } from "./openai-vision-adapter.js";

const request: ConversationImageRequest = {
  mimeType: "image/png",
  bytes: new Uint8Array([137, 80, 78, 71]),
  width: 800,
  height: 600,
};

const analysis: ConversationAnalysis = {
  messages: [
    {
      id: "message-1",
      order: 1,
      speaker: "OTHER",
      text: "Can you review this?",
      textConfidence: 0.98,
      speakerConfidence: 0.92,
    },
  ],
  draft: { text: null, confidence: 0.96 },
  participants: [],
  visibleContact: {
    displayName: null,
    username: null,
    channelOrGroupName: null,
    platformHint: null,
    confidence: 0.3,
  },
  language: {
    primary: "en",
    secondary: null,
    script: "NOT_APPLICABLE",
    codeSwitching: false,
    supportedForLanguageSpecificSkills: true,
    confidence: 0.99,
  },
  conversation: { summary: "A review request is visible.", confidence: 0.9 },
  warnings: [],
  overallConfidence: 0.9,
};

function responseWithOutput(value: unknown): Response {
  return new Response(
    JSON.stringify({
      status: "completed",
      output: [
        {
          type: "message",
          content: [{ type: "output_text", text: JSON.stringify(value) }],
        },
      ],
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

describe("OpenAI vision adapter", () => {
  it("builds one private observation-only structured image request", () => {
    const body = buildOpenAiConversationRequest(request, "gpt-5.6-luna");
    const serialized = JSON.stringify(body);

    expect(body).toMatchObject({
      model: "gpt-5.6-luna",
      store: false,
      text: { format: { type: "json_schema", name: "conversation_analysis", strict: true } },
    });
    expect(serialized).toContain("data:image/png;base64,");
    expect(serialized).toContain("Relationship prediction is prohibited");
    expect(serialized).not.toContain('"relationship"');
    expect(serialized).not.toContain('"action"');
    expect(serialized).not.toContain('"reply"');
  });

  it("normalizes and validates successful structured output", async () => {
    const fetchImplementation = vi.fn<typeof fetch>(async () => responseWithOutput(analysis));
    const adapter = new OpenAiVisionAdapter({ apiKey: "synthetic-key", fetchImplementation });

    await expect(adapter.analyzeConversationImage(request)).resolves.toEqual({
      ok: true,
      analysis,
      provider: { providerId: "openai", modelId: "gpt-5.6-luna" },
    });
    expect(fetchImplementation).toHaveBeenCalledTimes(1);

    const [url, options] = fetchImplementation.mock.calls[0] ?? [];
    expect(url).toBe("https://api.openai.com/v1/responses");
    expect(options?.headers).toMatchObject({ Authorization: "Bearer synthetic-key" });
  });

  it("rejects extra relationship output instead of passing it downstream", async () => {
    const fetchImplementation = vi.fn(async () =>
      responseWithOutput({ ...analysis, relationship: "friend" }),
    );
    const adapter = new OpenAiVisionAdapter({ apiKey: "synthetic-key", fetchImplementation });

    await expect(adapter.analyzeConversationImage(request)).resolves.toMatchObject({
      ok: false,
      error: { code: "INVALID_RESPONSE" },
    });
  });

  it.each([
    [401, {}, "INVALID_CREDENTIALS"],
    [429, {}, "RATE_LIMITED"],
    [429, { error: { code: "insufficient_quota" } }, "INSUFFICIENT_CREDITS"],
    [404, { error: { code: "model_not_found" } }, "MODEL_UNAVAILABLE"],
    [413, {}, "REQUEST_TOO_LARGE"],
    [504, {}, "TIMEOUT"],
    [500, {}, "PROVIDER_ERROR"],
  ])("maps HTTP %s to %s", async (status, payload, expectedCode) => {
    const fetchImplementation = vi.fn(
      async () =>
        new Response(JSON.stringify(payload), {
          status,
          headers: { "Content-Type": "application/json" },
        }),
    );
    const adapter = new OpenAiVisionAdapter({ apiKey: "synthetic-key", fetchImplementation });

    await expect(adapter.analyzeConversationImage(request)).resolves.toMatchObject({
      ok: false,
      error: { code: expectedCode },
    });
  });

  it("fails safely for malformed and incomplete provider output", async () => {
    const malformed = new OpenAiVisionAdapter({
      apiKey: "synthetic-key",
      fetchImplementation: vi.fn(
        async () =>
          new Response(JSON.stringify({ status: "completed", output: [] }), { status: 200 }),
      ),
    });
    const incomplete = new OpenAiVisionAdapter({
      apiKey: "synthetic-key",
      fetchImplementation: vi.fn(
        async () =>
          new Response(JSON.stringify({ status: "incomplete", output: [] }), { status: 200 }),
      ),
    });

    await expect(malformed.analyzeConversationImage(request)).resolves.toMatchObject({
      ok: false,
      error: { code: "INVALID_RESPONSE" },
    });
    await expect(incomplete.analyzeConversationImage(request)).resolves.toMatchObject({
      ok: false,
      error: { code: "INVALID_RESPONSE" },
    });
  });
});
