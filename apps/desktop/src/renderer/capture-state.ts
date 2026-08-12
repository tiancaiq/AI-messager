import type {
  CaptureDisplay,
  CoachingDecision,
  ConversationAnalysis,
  ProviderConfiguration,
} from "@ai-message-coach/contracts";

export interface CapturedImageResource {
  imageUrl: string;
  width: number;
  height: number;
  display: CaptureDisplay;
}

export interface CropPreviewResource {
  blob: Blob;
  imageUrl: string;
  width: number;
  height: number;
}

export interface AnalysisResultResource {
  analysis: ConversationAnalysis;
  provider: Pick<ProviderConfiguration, "providerId" | "modelId">;
}

export interface CoachingResultResource extends AnalysisResultResource {
  decision: CoachingDecision;
}

export type CaptureState =
  | { status: "IDLE" }
  | { status: "CAPTURING" }
  | { status: "SELECTING"; capture: CapturedImageResource; message?: string }
  | { status: "PREVIEW"; preview: CropPreviewResource }
  | { status: "ANALYZING"; preview: CropPreviewResource }
  | { status: "ANALYSIS_ERROR"; preview: CropPreviewResource; message: string }
  | { status: "DECIDING"; result: AnalysisResultResource }
  | { status: "COACHING_ERROR"; result: AnalysisResultResource; message: string }
  | { status: "COACHING_RESULT"; result: CoachingResultResource }
  | { status: "CAPTURE_ERROR"; message: string };

export type CaptureEvent =
  | { type: "GENERATE" }
  | { type: "CAPTURE_SUCCEEDED"; capture: CapturedImageResource }
  | { type: "CAPTURE_FAILED"; message: string }
  | { type: "SELECTION_INVALID"; message: string }
  | { type: "SELECTION_FAILED"; message: string }
  | { type: "SELECTION_SUCCEEDED"; preview: CropPreviewResource }
  | { type: "RETAKE" }
  | { type: "CANCEL" }
  | { type: "ANALYZE" }
  | { type: "RETRY_ANALYSIS" }
  | { type: "ANALYSIS_SUCCEEDED"; result: AnalysisResultResource }
  | { type: "ANALYSIS_FAILED"; message: string }
  | { type: "COACHING_SUCCEEDED"; decision: CoachingDecision }
  | { type: "COACHING_FAILED"; message: string }
  | { type: "RETRY_COACHING" }
  | { type: "CONTINUE_COACHING" };

export const initialCaptureState: CaptureState = { status: "IDLE" };

export function captureReducer(state: CaptureState, event: CaptureEvent): CaptureState {
  switch (event.type) {
    case "GENERATE":
      return state.status === "IDLE" ||
        state.status === "COACHING_RESULT" ||
        state.status === "COACHING_ERROR" ||
        state.status === "CAPTURE_ERROR"
        ? { status: "CAPTURING" }
        : state;
    case "CAPTURE_SUCCEEDED":
      return state.status === "CAPTURING" ? { status: "SELECTING", capture: event.capture } : state;
    case "CAPTURE_FAILED":
      return state.status === "CAPTURING"
        ? { status: "CAPTURE_ERROR", message: event.message }
        : state;
    case "SELECTION_INVALID":
      return state.status === "SELECTING" ? { ...state, message: event.message } : state;
    case "SELECTION_FAILED":
      return state.status === "SELECTING"
        ? { status: "CAPTURE_ERROR", message: event.message }
        : state;
    case "SELECTION_SUCCEEDED":
      return state.status === "SELECTING" ? { status: "PREVIEW", preview: event.preview } : state;
    case "ANALYZE":
      return state.status === "PREVIEW" ? { status: "ANALYZING", preview: state.preview } : state;
    case "RETRY_ANALYSIS":
      return state.status === "ANALYSIS_ERROR"
        ? { status: "ANALYZING", preview: state.preview }
        : state;
    case "ANALYSIS_SUCCEEDED":
      return state.status === "ANALYZING" ? { status: "DECIDING", result: event.result } : state;
    case "ANALYSIS_FAILED":
      return state.status === "ANALYZING"
        ? { status: "ANALYSIS_ERROR", preview: state.preview, message: event.message }
        : state;
    case "COACHING_SUCCEEDED":
      return state.status === "DECIDING"
        ? { status: "COACHING_RESULT", result: { ...state.result, decision: event.decision } }
        : state;
    case "COACHING_FAILED":
      return state.status === "DECIDING"
        ? { status: "COACHING_ERROR", result: state.result, message: event.message }
        : state;
    case "RETRY_COACHING":
      return state.status === "COACHING_ERROR"
        ? { status: "DECIDING", result: state.result }
        : state;
    case "CONTINUE_COACHING":
      return state.status === "COACHING_RESULT"
        ? {
            status: "DECIDING",
            result: { analysis: state.result.analysis, provider: state.result.provider },
          }
        : state;
    case "RETAKE":
      return state.status === "PREVIEW" || state.status === "ANALYSIS_ERROR"
        ? { status: "CAPTURING" }
        : state;
    case "CANCEL":
      return state.status === "CAPTURING" ||
        state.status === "SELECTING" ||
        state.status === "PREVIEW" ||
        state.status === "ANALYSIS_ERROR" ||
        state.status === "CAPTURE_ERROR"
        ? { status: "IDLE" }
        : state;
  }
}
