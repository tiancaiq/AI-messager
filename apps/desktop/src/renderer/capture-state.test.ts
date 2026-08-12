import type { ConversationAnalysis } from "@ai-message-coach/contracts";
import { describe, expect, it } from "vitest";

import {
  captureReducer,
  initialCaptureState,
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
    const result = captureReducer(analyzing, {
      type: "ANALYSIS_SUCCEEDED",
      result: { analysis, provider: { providerId: "openai", modelId: "fixture-model" } },
    });

    expect(analyzing).toEqual({ status: "ANALYZING", preview });
    expect(result).toMatchObject({ status: "RESULT", result: { analysis } });
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
