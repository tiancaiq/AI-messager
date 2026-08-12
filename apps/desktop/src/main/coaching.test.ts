import type {
  CoachingDecisionResult,
  CoachingRequest,
  ConversationAnalysis,
} from "@ai-message-coach/contracts";
import { describe, expect, it, vi } from "vitest";

import { copyCoachingText, createCoachingService } from "./coaching.js";

const analysis: ConversationAnalysis = {
  messages: [
    {
      id: "m1",
      order: 1,
      speaker: "OTHER",
      text: "Can you review this?",
      textConfidence: 0.9,
      speakerConfidence: 0.9,
    },
  ],
  draft: { text: "Yes I can", confidence: 0.9 },
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
    confidence: 0.9,
  },
  conversation: { summary: "Review request.", confidence: 0.9 },
  warnings: [],
  overallConfidence: 0.9,
};
const request: CoachingRequest = { analysis, selection: null };
const success: CoachingDecisionResult = {
  ok: true,
  decision: {
    action: "REWRITE_DRAFT",
    userIntent: { value: "Agree to review.", confidence: 0.9 },
    actionConfidence: 0.9,
    ambiguity: { material: false, reason: null },
    primary: "Yes, I can review it.",
    alternatives: [],
  },
};

describe("desktop coaching service", () => {
  it("suppresses overlapping requests and clears the guard", async () => {
    let resolve!: (value: CoachingDecisionResult) => void;
    const generator = {
      configuration: {
        providerId: "fixture",
        modelId: "fixture",
        configured: true,
        capabilities: { vision: false, textGeneration: true, structuredOutput: true },
      },
      generateCoachingDecision: vi.fn(
        () =>
          new Promise<CoachingDecisionResult>((done) => {
            resolve = done;
          }),
      ),
    };
    const service = createCoachingService(generator);
    const first = service.requestCoaching(request);
    await expect(service.requestCoaching(request)).resolves.toMatchObject({
      ok: false,
      error: { code: "COACHING_IN_PROGRESS" },
    });
    resolve(success);
    await expect(first).resolves.toEqual(success);
    generator.generateCoachingDecision.mockResolvedValue(success);
    await expect(service.requestCoaching(request)).resolves.toEqual(success);
  });

  it("copies only after an explicit service call and normalizes failure", () => {
    const writer = { writeText: vi.fn() };
    expect(copyCoachingText(writer, "Synthetic reply")).toEqual({ ok: true });
    expect(writer.writeText).toHaveBeenCalledWith("Synthetic reply");
    expect(
      copyCoachingText(
        {
          writeText: () => {
            throw new Error("blocked");
          },
        },
        "Synthetic reply",
      ),
    ).toMatchObject({ ok: false });
  });
});
