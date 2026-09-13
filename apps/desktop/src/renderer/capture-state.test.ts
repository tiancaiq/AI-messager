import type { ConversationAnalysis } from "@ai-message-coach/contracts";
import { describe, expect, it } from "vitest";

import {
  captureReducer,
  initialCaptureState,
  type CaptureState,
  type CapturedImageResource,
  type CropPreviewResource,
} from "./capture-state.js";

const capture: CapturedImageResource = {
  imageUrl: "blob:capture",
  width: 2000,
  height: 1000,
  display: {
    id: "1",
    sourceId: "screen:1:0",
    bounds: { x: 0, y: 0, width: 1000, height: 500 },
    scaleFactor: 2,
  },
};

const preview: CropPreviewResource = {
  blob: new Blob(["preview"], { type: "image/png" }),
  imageUrl: "blob:preview",
  width: 600,
  height: 400,
};

const analysis: ConversationAnalysis = {
  messages: [],
  draft: { text: null, confidence: 0.8 },
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
  conversation: { summary: "No readable messages.", confidence: 0.2 },
  warnings: ["UNREADABLE_TEXT"],
  overallConfidence: 0.2,
};

describe("capture and analysis state", () => {
  it("follows capture, selection, analysis, and validated result transitions", () => {
    const capturing = captureReducer(initialCaptureState, { type: "GENERATE" });
    const selecting = captureReducer(capturing, { type: "CAPTURE_SUCCEEDED", capture });
    const previewing = captureReducer(selecting, { type: "SELECTION_SUCCEEDED", preview });
    const analyzing = captureReducer(previewing, { type: "ANALYZE" });
    const deciding = captureReducer(analyzing, {
      type: "ANALYSIS_SUCCEEDED",
      result: { analysis, provider: { providerId: "openai", modelId: "fixture-model" } },
    });
    const result = captureReducer(deciding, {
      type: "COACHING_SUCCEEDED",
      decision: {
        action: "SUGGEST_REPLY",
        userIntent: { value: "Reply naturally.", confidence: 0.8 },
        actionConfidence: 0.9,
        ambiguity: { material: false, reason: null },
        replies: [{ label: "Natural", text: "Sure." }],
      },
    });

    expect(analyzing).toEqual({ status: "ANALYZING", preview });
    expect(deciding).toMatchObject({
      status: "DECIDING",
      result: { analysis },
      selection: null,
    });
    expect(result).toMatchObject({ status: "COACHING_RESULT", result: { analysis } });
  });

  it("retains the selected crop for recoverable analysis failures", () => {
    const error = captureReducer(
      { status: "ANALYZING", preview },
      { type: "ANALYSIS_FAILED", message: "Try again." },
    );

    expect(error).toEqual({ status: "ANALYSIS_ERROR", preview, message: "Try again." });
    expect(captureReducer(error, { type: "RETRY_ANALYSIS" })).toEqual({
      status: "ANALYZING",
      preview,
    });
  });

  it("suppresses duplicate analysis and capture events", () => {
    const analyzing = { status: "ANALYZING", preview } as const;
    const capturing = { status: "CAPTURING" } as const;

    expect(captureReducer(analyzing, { type: "ANALYZE" })).toBe(analyzing);
    expect(captureReducer(capturing, { type: "GENERATE" })).toBe(capturing);
  });

  it("keeps coaching failures recoverable and reuses analysis for a choice", () => {
    const provider = { providerId: "openai", modelId: "fixture-model" };
    const deciding = {
      status: "DECIDING",
      result: { analysis, provider },
      selection: null,
    } as const;
    const error = captureReducer(deciding, { type: "COACHING_FAILED", message: "Try again." });
    expect(error).toEqual({
      status: "COACHING_ERROR",
      result: deciding.result,
      selection: null,
      message: "Try again.",
    });
    expect(captureReducer(error, { type: "RETRY_COACHING" })).toEqual(deciding);

    const choices = captureReducer(deciding, {
      type: "COACHING_SUCCEEDED",
      decision: {
        action: "SUGGEST_ACTIONS",
        userIntent: { value: null, confidence: 0.4 },
        actionConfidence: 0.9,
        ambiguity: { material: true, reason: "The choice changes the reply." },
        actions: [
          { id: "accept", label: "Accept", intent: "Accept." },
          { id: "decline", label: "Decline", intent: "Decline." },
        ],
      },
    });
    expect(
      captureReducer(choices, {
        type: "CONTINUE_COACHING",
        selection: { kind: "CLARIFICATION", answer: "Acknowledge" },
      }),
    ).toEqual({
      status: "DECIDING",
      result: deciding.result,
      selection: { kind: "CLARIFICATION", answer: "Acknowledge" },
    });
  });

  it("preserves the exact selected intent after failure and retry", () => {
    const provider = { providerId: "openai", modelId: "fixture-model" };
    const selection = { kind: "CLARIFICATION", answer: "Acknowledge" } as const;
    const choices: CaptureState = {
      status: "COACHING_RESULT",
      result: {
        analysis,
        provider,
        decision: {
          action: "ASK_CLARIFICATION",
          userIntent: { value: null, confidence: 0.2 },
          actionConfidence: 0.8,
          ambiguity: { material: true, reason: "The intent is unclear." },
          question: "What would you like to do next?",
          options: ["Acknowledge", "Ask a follow-up"],
        },
      },
    };
    const deciding = captureReducer(choices, { type: "CONTINUE_COACHING", selection });
    const failed = captureReducer(deciding, { type: "COACHING_FAILED", message: "Try again." });
    const retried = captureReducer(failed, { type: "RETRY_COACHING" });

    expect(failed).toMatchObject({ status: "COACHING_ERROR", selection });
    expect(retried).toEqual({
      status: "DECIDING",
      result: { analysis, provider },
      selection,
    });
  });

  it("allows retake or cancel after an analysis failure", () => {
    const error = { status: "ANALYSIS_ERROR", preview, message: "Try again." } as const;

    expect(captureReducer(error, { type: "RETAKE" })).toEqual({ status: "CAPTURING" });
    expect(captureReducer(error, { type: "CANCEL" })).toEqual(initialCaptureState);
  });

  it("keeps invalid selections recoverable and capture failures retryable", () => {
    expect(
      captureReducer(
        { status: "SELECTING", capture },
        { type: "SELECTION_INVALID", message: "Select a larger region." },
      ),
    ).toEqual({
      status: "SELECTING",
      capture,
      message: "Select a larger region.",
    });

    const error = captureReducer(
      { status: "CAPTURING" },
      { type: "CAPTURE_FAILED", message: "Capture unavailable." },
    );
    expect(captureReducer(error, { type: "GENERATE" })).toEqual({ status: "CAPTURING" });
  });
});
