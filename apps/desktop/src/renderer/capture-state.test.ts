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
  imageUrl: "blob:preview",
  width: 600,
  height: 400,
};

describe("capture state", () => {
  it("follows IDLE → CAPTURING → SELECTING → PREVIEW → READY", () => {
    const capturing = captureReducer(initialCaptureState, { type: "GENERATE" });
    const selecting = captureReducer(capturing, { type: "CAPTURE_SUCCEEDED", capture });
    const previewing = captureReducer(selecting, {
      type: "SELECTION_SUCCEEDED",
      preview,
    });
    const ready = captureReducer(previewing, { type: "CONTINUE" });

    expect(capturing).toEqual({ status: "CAPTURING" });
    expect(selecting).toEqual({ status: "SELECTING", capture });
    expect(previewing).toEqual({ status: "PREVIEW", preview });
    expect(ready).toEqual({ status: "READY" });
  });

  it("retakes from PREVIEW and ignores duplicate Generate while capturing", () => {
    const capturing = { status: "CAPTURING" } as const;
    const previewing = { status: "PREVIEW", preview } as const;

    expect(captureReducer(previewing, { type: "RETAKE" })).toEqual({
      status: "CAPTURING",
    });
    expect(captureReducer(capturing, { type: "GENERATE" })).toBe(capturing);
  });

  it("cancels from SELECTING and PREVIEW", () => {
    expect(captureReducer({ status: "SELECTING", capture }, { type: "CANCEL" })).toEqual(
      initialCaptureState,
    );
    expect(captureReducer({ status: "PREVIEW", preview }, { type: "CANCEL" })).toEqual(
      initialCaptureState,
    );
  });

  it("moves capture failures to a recoverable error state", () => {
    const error = captureReducer(
      { status: "CAPTURING" },
      { type: "CAPTURE_FAILED", message: "Capture unavailable." },
    );

    expect(error).toEqual({ status: "ERROR", message: "Capture unavailable." });
    expect(captureReducer(error, { type: "GENERATE" })).toEqual({
      status: "CAPTURING",
    });
    expect(captureReducer(error, { type: "CANCEL" })).toEqual(initialCaptureState);
  });

  it("keeps invalid selections recoverable in selection mode", () => {
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
  });

  it("turns image decoding failures into a recoverable error", () => {
    const error = captureReducer(
      { status: "SELECTING", capture },
      { type: "SELECTION_FAILED", message: "The image could not be displayed." },
    );

    expect(error).toEqual({
      status: "ERROR",
      message: "The image could not be displayed.",
    });
    expect(captureReducer(error, { type: "GENERATE" })).toEqual({
      status: "CAPTURING",
    });
  });
});
