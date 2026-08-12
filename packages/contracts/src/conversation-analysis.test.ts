import { describe, expect, it } from "vitest";

import {
  ConversationAnalysisResultSchema,
  ConversationAnalysisSchema,
  ConversationImageRequestSchema,
  ProviderConfigurationSchema,
} from "./conversation-analysis.js";

const validAnalysis = {
  messages: [
    {
      id: "message-1",
      order: 1,
      speaker: "OTHER",
      text: "Can you send the notes today?",
      textConfidence: 0.99,
      speakerConfidence: 0.95,
    },
    {
      id: "message-2",
      order: 2,
      speaker: "USER",
      text: "I am finishing them now.",
      textConfidence: 0.98,
      speakerConfidence: 0.94,
    },
  ],
  draft: { text: "I will send them by 4.", confidence: 0.93 },
  participants: [
    {
      speaker: "OTHER",
      displayName: "Alex",
      username: "@alex",
      platformHint: null,
      confidence: 0.9,
    },
  ],
  visibleContact: {
    displayName: "Alex",
    username: "@alex",
    channelOrGroupName: null,
    platformHint: null,
    confidence: 0.92,
  },
  language: {
    primary: "en",
    secondary: null,
    script: "NOT_APPLICABLE",
    codeSwitching: false,
    supportedForLanguageSpecificSkills: true,
    confidence: 0.99,
  },
  conversation: {
    summary: "A request for notes and a status update are visible.",
    confidence: 0.9,
  },
  warnings: [],
  overallConfidence: 0.94,
} as const;

describe("conversation analysis contracts", () => {
  it("accepts observation-only structured analysis", () => {
    expect(ConversationAnalysisSchema.parse(validAnalysis)).toEqual(validAnalysis);
  });

  it("rejects relationship, coaching, intent, and response fields", () => {
    for (const forbidden of ["relationship", "relationshipRole", "userIntent", "action", "reply"]) {
      expect(
        ConversationAnalysisSchema.safeParse({ ...validAnalysis, [forbidden]: "forbidden" })
          .success,
      ).toBe(false);
    }
  });

  it("requires unique sequential message order and ids", () => {
    expect(
      ConversationAnalysisSchema.safeParse({
        ...validAnalysis,
        messages: validAnalysis.messages.map((message) => ({ ...message, order: 2 })),
      }).success,
    ).toBe(false);

    expect(
      ConversationAnalysisSchema.safeParse({
        ...validAnalysis,
        messages: validAnalysis.messages.map((message) => ({ ...message, id: "duplicate" })),
      }).success,
    ).toBe(false);
  });

  it("enforces independent normalized confidence values", () => {
    expect(
      ConversationAnalysisSchema.safeParse({ ...validAnalysis, overallConfidence: 1.01 }).success,
    ).toBe(false);
    expect(
      ConversationAnalysisSchema.safeParse({
        ...validAnalysis,
        draft: { ...validAnalysis.draft, confidence: -0.01 },
      }).success,
    ).toBe(false);
  });

  it("represents Chinese, mixed-language, other-language, and no-draft cases", () => {
    expect(
      ConversationAnalysisSchema.safeParse({
        ...validAnalysis,
        draft: { text: null, confidence: 0.98 },
        language: {
          primary: "zh",
          secondary: "en",
          script: "MIXED",
          codeSwitching: true,
          supportedForLanguageSpecificSkills: true,
          confidence: 0.9,
        },
      }).success,
    ).toBe(true);

    expect(
      ConversationAnalysisSchema.safeParse({
        ...validAnalysis,
        language: {
          primary: "ko",
          secondary: null,
          script: "NOT_APPLICABLE",
          codeSwitching: false,
          supportedForLanguageSpecificSkills: false,
          confidence: 0.92,
        },
      }).success,
    ).toBe(true);
  });

  it("validates bounded in-memory PNG requests", () => {
    expect(
      ConversationImageRequestSchema.safeParse({
        mimeType: "image/png",
        bytes: new Uint8Array([137, 80, 78, 71]),
        width: 800,
        height: 600,
      }).success,
    ).toBe(true);
    expect(
      ConversationImageRequestSchema.safeParse({
        mimeType: "image/jpeg",
        bytes: new Uint8Array([1]),
        width: 800,
        height: 600,
      }).success,
    ).toBe(false);
    expect(
      ConversationImageRequestSchema.safeParse({
        mimeType: "image/png",
        bytes: new Uint8Array(),
        width: 800,
        height: 600,
      }).success,
    ).toBe(false);
  });

  it("validates safe provider configuration and result envelopes", () => {
    const provider = {
      providerId: "openai",
      modelId: "gpt-5.6-luna",
      configured: true,
      capabilities: { textGeneration: true, vision: true, structuredOutput: true },
    };

    expect(ProviderConfigurationSchema.parse(provider)).toEqual(provider);
    expect(
      ConversationAnalysisResultSchema.safeParse({
        ok: true,
        analysis: validAnalysis,
        provider: { providerId: "openai", modelId: "gpt-5.6-luna" },
      }).success,
    ).toBe(true);
    expect(
      ConversationAnalysisResultSchema.safeParse({
        ok: false,
        error: { code: "INVALID_CREDENTIALS", message: "Check the configured provider key." },
      }).success,
    ).toBe(true);
  });
});
