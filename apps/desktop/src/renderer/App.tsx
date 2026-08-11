import { useCallback, useEffect, useReducer, useRef } from "react";

import { CaptureSelection } from "./CaptureSelection.js";
import {
  captureReducer,
  initialCaptureState,
  type CaptureState,
  type CropPreviewResource,
} from "./capture-state.js";

const errorMessages = {
  CAPTURE_IN_PROGRESS: "A conversation capture is already in progress.",
  CAPTURE_PERMISSION_DENIED:
    "Allow screen recording for AI Message Coach in system settings, then try again.",
  CAPTURE_UNAVAILABLE: "Screen capture is unavailable. Check permissions and try again.",
  CAPTURE_FAILED: "The screen could not be captured. Please try again.",
} as const;

function stateImageUrl(state: CaptureState): string | undefined {
  if (state.status === "SELECTING") {
    return state.capture.imageUrl;
  }

  if (state.status === "PREVIEW") {
    return state.preview.imageUrl;
  }

  return undefined;
}

export function App() {
  const [state, dispatch] = useReducer(captureReducer, initialCaptureState);
  const requestInFlightReference = useRef(false);
  const captureSessionReference = useRef(0);
  const mountedReference = useRef(true);
  const objectUrlsReference = useRef(new Set<string>());
  const appName =
    typeof window === "undefined"
      ? "AI Message Coach"
      : (window.messageCoach?.appInfo.name ?? "AI Message Coach");

  const releaseObjectUrl = useCallback((imageUrl: string | undefined): void => {
    if (imageUrl === undefined || !objectUrlsReference.current.delete(imageUrl)) {
      return;
    }

    URL.revokeObjectURL(imageUrl);
  }, []);

  useEffect(() => {
    mountedReference.current = true;
    const objectUrls = objectUrlsReference.current;

    return () => {
      mountedReference.current = false;
      for (const imageUrl of objectUrls) {
        URL.revokeObjectURL(imageUrl);
      }
      objectUrls.clear();
    };
  }, []);

  const beginCapture = useCallback(
    async (eventType: "GENERATE" | "RETAKE"): Promise<void> => {
      if (requestInFlightReference.current) {
        return;
      }

      const canGenerate =
        eventType === "RETAKE"
          ? state.status === "PREVIEW"
          : state.status === "IDLE" || state.status === "READY" || state.status === "ERROR";

      if (!canGenerate) {
        return;
      }

      requestInFlightReference.current = true;
      const session = ++captureSessionReference.current;
      releaseObjectUrl(stateImageUrl(state));
      dispatch({ type: eventType });

      try {
        const bridge = typeof window === "undefined" ? undefined : window.messageCoach;

        if (bridge === undefined) {
          throw new Error("The desktop capture bridge is unavailable.");
        }

        const result = await bridge.requestConversationCapture();

        if (!mountedReference.current || session !== captureSessionReference.current) {
          return;
        }

        if (!result.ok) {
          dispatch({ type: "CAPTURE_FAILED", message: errorMessages[result.error.code] });
          return;
        }

        const ownedBytes = new Uint8Array(result.capture.bytes.byteLength);
        ownedBytes.set(result.capture.bytes);
        const blob = new Blob([ownedBytes], { type: result.capture.mimeType });
        ownedBytes.fill(0);
        const imageUrl = URL.createObjectURL(blob);

        if (!mountedReference.current || session !== captureSessionReference.current) {
          URL.revokeObjectURL(imageUrl);
          return;
        }

        objectUrlsReference.current.add(imageUrl);
        dispatch({
          type: "CAPTURE_SUCCEEDED",
          capture: {
            imageUrl,
            width: result.capture.width,
            height: result.capture.height,
            display: result.capture.display,
          },
        });
      } catch {
        if (mountedReference.current && session === captureSessionReference.current) {
          dispatch({
            type: "CAPTURE_FAILED",
            message: "The screen could not be captured. Please try again.",
          });
        }
      } finally {
        requestInFlightReference.current = false;
      }
    },
    [releaseObjectUrl, state],
  );

  const cancelCapture = useCallback((): void => {
    captureSessionReference.current += 1;
    releaseObjectUrl(stateImageUrl(state));
    dispatch({ type: "CANCEL" });
  }, [releaseObjectUrl, state]);

  const handleSelected = useCallback(
    (blob: Blob, size: { width: number; height: number }): void => {
      if (state.status !== "SELECTING") {
        return;
      }

      try {
        const previewUrl = URL.createObjectURL(blob);
        const preview: CropPreviewResource = {
          imageUrl: previewUrl,
          width: size.width,
          height: size.height,
        };
        objectUrlsReference.current.add(previewUrl);
        releaseObjectUrl(state.capture.imageUrl);
        dispatch({ type: "SELECTION_SUCCEEDED", preview });
      } catch {
        dispatch({
          type: "SELECTION_INVALID",
          message: "That region could not be previewed. Please select it again.",
        });
      }
    },
    [releaseObjectUrl, state],
  );

  const continueCapture = useCallback((): void => {
    if (state.status !== "PREVIEW") {
      return;
    }

    releaseObjectUrl(state.preview.imageUrl);
    dispatch({ type: "CONTINUE" });
  }, [releaseObjectUrl, state]);

  useEffect(() => {
    const isCancelable =
      state.status === "CAPTURING" || state.status === "SELECTING" || state.status === "PREVIEW";

    if (!isCancelable) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        cancelCapture();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cancelCapture, state.status]);

  if (state.status === "SELECTING") {
    return (
      <CaptureSelection
        capture={state.capture}
        message={state.message}
        onCancel={cancelCapture}
        onFailure={(message) => {
          releaseObjectUrl(state.capture.imageUrl);
          dispatch({ type: "SELECTION_FAILED", message });
        }}
        onInvalid={(message) => dispatch({ type: "SELECTION_INVALID", message })}
        onSelected={handleSelected}
      />
    );
  }

  if (state.status === "PREVIEW") {
    return (
      <main className="app-shell preview-shell">
        <section className="content-card preview-card">
          <p className="eyebrow">Conversation capture</p>
          <h1>Review selection</h1>
          <div className="preview-frame">
            <img alt="Selected conversation region preview" src={state.preview.imageUrl} />
          </div>
          <p className="preview-size">
            {state.preview.width} × {state.preview.height} px
          </p>
          <div className="button-row">
            <button
              className="button button-quiet"
              type="button"
              onClick={() => void beginCapture("RETAKE")}
            >
              Retake
            </button>
            <button className="button button-quiet" type="button" onClick={cancelCapture}>
              Cancel
            </button>
            <button className="button button-primary" type="button" onClick={continueCapture}>
              Continue
            </button>
          </div>
          <p className="keyboard-hint">Press Esc to cancel</p>
        </section>
      </main>
    );
  }

  if (state.status === "CAPTURING") {
    return (
      <main className="app-shell">
        <section className="content-card status-card" aria-live="polite">
          <p className="eyebrow">Conversation capture</p>
          <h1>Capturing current display…</h1>
          <p>Message Coach will return as soon as the display is ready.</p>
        </section>
      </main>
    );
  }

  if (state.status === "ERROR") {
    return (
      <main className="app-shell">
        <section className="content-card status-card" aria-live="polite">
          <p className="eyebrow">Capture unavailable</p>
          <h1>We couldn’t capture the display.</h1>
          <p className="inline-error">{state.message}</p>
          <div className="button-row">
            <button className="button button-quiet" type="button" onClick={cancelCapture}>
              Cancel
            </button>
            <button
              className="button button-primary"
              type="button"
              onClick={() => void beginCapture("GENERATE")}
            >
              Try again
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (state.status === "READY") {
    return (
      <main className="app-shell">
        <section className="content-card status-card" aria-live="polite">
          <p className="eyebrow">Conversation capture</p>
          <h1>Capture ready for analysis.</h1>
          <p>No analysis or network request is performed in Phase 1.</p>
          <button
            className="button button-primary"
            type="button"
            onClick={() => void beginCapture("GENERATE")}
          >
            Capture again
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="home-content">
        <p className="eyebrow">Desktop message assistance</p>
        <h1>{appName}</h1>
        <p className="home-description">
          Open the conversation you want help with, then capture the relevant messages.
        </p>
        <button
          className="button button-primary generate-button"
          type="button"
          onClick={() => void beginCapture("GENERATE")}
        >
          Generate
        </button>
      </section>
    </main>
  );
}
