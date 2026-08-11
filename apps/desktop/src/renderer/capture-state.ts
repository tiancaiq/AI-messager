import type { CaptureDisplay } from "@ai-message-coach/contracts";

export interface CapturedImageResource {
  imageUrl: string;
  width: number;
  height: number;
  display: CaptureDisplay;
}

export interface CropPreviewResource {
  imageUrl: string;
  width: number;
  height: number;
}

export type CaptureState =
  | { status: "IDLE" }
  | { status: "CAPTURING" }
  | { status: "SELECTING"; capture: CapturedImageResource; message?: string }
  | { status: "PREVIEW"; preview: CropPreviewResource }
  | { status: "READY" }
  | { status: "ERROR"; message: string };

export type CaptureEvent =
  | { type: "GENERATE" }
  | { type: "CAPTURE_SUCCEEDED"; capture: CapturedImageResource }
  | { type: "CAPTURE_FAILED"; message: string }
  | { type: "SELECTION_INVALID"; message: string }
  | { type: "SELECTION_FAILED"; message: string }
  | { type: "SELECTION_SUCCEEDED"; preview: CropPreviewResource }
  | { type: "RETAKE" }
  | { type: "CANCEL" }
  | { type: "CONTINUE" };

export const initialCaptureState: CaptureState = { status: "IDLE" };

export function captureReducer(state: CaptureState, event: CaptureEvent): CaptureState {
  switch (event.type) {
    case "GENERATE":
      return state.status === "IDLE" || state.status === "READY" || state.status === "ERROR"
        ? { status: "CAPTURING" }
        : state;
    case "CAPTURE_SUCCEEDED":
      return state.status === "CAPTURING" ? { status: "SELECTING", capture: event.capture } : state;
    case "CAPTURE_FAILED":
      return state.status === "CAPTURING" ? { status: "ERROR", message: event.message } : state;
    case "SELECTION_INVALID":
      return state.status === "SELECTING" ? { ...state, message: event.message } : state;
    case "SELECTION_FAILED":
      return state.status === "SELECTING" ? { status: "ERROR", message: event.message } : state;
    case "SELECTION_SUCCEEDED":
      return state.status === "SELECTING" ? { status: "PREVIEW", preview: event.preview } : state;
    case "RETAKE":
      return state.status === "PREVIEW" ? { status: "CAPTURING" } : state;
    case "CANCEL":
      return state.status === "CAPTURING" ||
        state.status === "SELECTING" ||
        state.status === "PREVIEW" ||
        state.status === "ERROR"
        ? { status: "IDLE" }
        : state;
    case "CONTINUE":
      return state.status === "PREVIEW" ? { status: "READY" } : state;
  }
}
