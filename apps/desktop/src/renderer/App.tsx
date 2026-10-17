import type {
  AiProviderErrorCode,
  CoachingDecision,
  CoachingErrorCode,
  CoachingSelection,
  ConversationAnalysis,
  ProviderConfiguration,
} from "@ai-message-coach/contracts";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";

import { CaptureSelection } from "./CaptureSelection.js";
import { LocalMemoryInspector } from "./LocalMemoryInspector.js";
import { LocalMemorySettings } from "./LocalMemorySettings.js";
import { Lab } from "./Lab.js";
import {
  captureReducer,
  initialCaptureState,
  type CaptureState,
  type CropPreviewResource,
} from "./capture-state.js";

const captureErrorMessages = {
  CAPTURE_IN_PROGRESS: "A conversation capture is already in progress.",
  CAPTURE_PERMISSION_DENIED:
    "Allow screen recording for AI Message Coach in system settings, then try again.",
  CAPTURE_UNAVAILABLE: "Screen capture is unavailable. Check permissions and try again.",
  CAPTURE_FAILED: "The screen could not be captured. Please try again.",
} as const;

const analysisErrorMessages: Record<AiProviderErrorCode, string> = {
  ANALYSIS_IN_PROGRESS: "Conversation analysis is already in progress.",
  NOT_CONFIGURED: "Configure an OpenAI API key in .env.local, then restart the desktop app.",
  INVALID_CREDENTIALS: "The configured provider key was rejected. Check it and try again.",
  RATE_LIMITED: "The provider is busy. Wait briefly, then try again.",
  INSUFFICIENT_CREDITS: "The provider account does not have enough available credits.",
  MODEL_UNAVAILABLE: "The configured analysis model is unavailable.",
  VISION_UNSUPPORTED: "The configured model cannot analyze conversation screenshots.",
  REQUEST_TOO_LARGE: "The selected conversation image is too large.",
  TIMEOUT: "The provider request timed out. Please try again.",
  INVALID_RESPONSE: "The provider returned an invalid analysis. Please try again.",
  PROVIDER_ERROR: "The conversation could not be analyzed. Please try again.",
};

const coachingErrorMessages: Record<CoachingErrorCode, string> = {
  COACHING_IN_PROGRESS: "A coaching request is already in progress.",
  NOT_CONFIGURED: "Configure an OpenAI API key in .env.local, then restart the desktop app.",
  INVALID_CREDENTIALS: "The configured provider key was rejected. Check it and try again.",
  RATE_LIMITED: "The provider is busy. Wait briefly, then try again.",
  INSUFFICIENT_CREDITS: "The provider account does not have enough available credits.",
  MODEL_UNAVAILABLE: "The configured model cannot generate coaching.",
  TIMEOUT: "The provider request timed out. Please try again.",
  INVALID_RESPONSE: "The provider returned an invalid coaching result. Please try again.",
  PROVIDER_ERROR: "A message could not be generated. Please try again.",
};

function stateImageUrl(state: CaptureState): string | undefined {
  if (state.status === "SELECTING") {
    return state.capture.imageUrl;
  }

  if (
    state.status === "PREVIEW" ||
    state.status === "ANALYZING" ||
    state.status === "ANALYSIS_ERROR"
  ) {
    return state.preview.imageUrl;
  }

  return undefined;
}

function confidence(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function displayValue(value: string | null): string {
  return value ?? "Not visible";
}

export function AnalysisResultView({ analysis }: { analysis: ConversationAnalysis }) {
  return (
    <div className="analysis-grid">
      <section className="analysis-panel analysis-summary">
        <div>
          <p className="result-label">Visible conversation</p>
          <h2>{analysis.conversation.summary || "No readable conversation summary."}</h2>
        </div>
        <span className="confidence-chip">{confidence(analysis.overallConfidence)} confidence</span>
      </section>

      <section className="analysis-panel">
        <h2>Visible contact</h2>
        <dl className="fact-grid">
          <div>
            <dt>Name</dt>
            <dd>{displayValue(analysis.visibleContact.displayName)}</dd>
          </div>
          <div>
            <dt>Username</dt>
            <dd>{displayValue(analysis.visibleContact.username)}</dd>
          </div>
          <div>
            <dt>Channel or group</dt>
            <dd>{displayValue(analysis.visibleContact.channelOrGroupName)}</dd>
          </div>
          <div>
            <dt>Platform hint</dt>
            <dd>{displayValue(analysis.visibleContact.platformHint)}</dd>
          </div>
        </dl>
      </section>

      <section className="analysis-panel">
        <h2>Language</h2>
        <p>
          {analysis.language.primary ?? "Unknown"}
          {analysis.language.secondary === null ? "" : ` + ${analysis.language.secondary}`} ·{" "}
          {analysis.language.script.toLowerCase().replaceAll("_", " ")} ·{" "}
          {confidence(analysis.language.confidence)} confidence
        </p>
        <p className="result-note">
          {analysis.language.codeSwitching
            ? "Code-switching observed."
            : "No code-switching observed."}
        </p>
      </section>

      <section className="analysis-panel analysis-messages">
        <h2>Messages in visible order</h2>
        {analysis.messages.length === 0 ? (
          <p className="empty-result">No readable messages were extracted.</p>
        ) : (
          <ol className="message-list">
            {analysis.messages.map((message) => (
              <li key={message.id}>
                <div className="message-meta">
                  <span>{message.speaker.toLowerCase()}</span>
                  <span>
                    text {confidence(message.textConfidence)} · speaker{" "}
                    {confidence(message.speakerConfidence)}
                  </span>
                </div>
                <p>{message.text}</p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="analysis-panel">
        <h2>Visible draft</h2>
        <p>{analysis.draft.text ?? "No draft detected."}</p>
        <p className="result-note">{confidence(analysis.draft.confidence)} confidence</p>
      </section>

      <section className="analysis-panel">
        <h2>Warnings</h2>
        {analysis.warnings.length === 0 ? (
          <p className="empty-result">No extraction warnings.</p>
        ) : (
          <ul className="warning-list">
            {analysis.warnings.map((warning) => (
              <li key={warning}>{warning.toLowerCase().replaceAll("_", " ")}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function decisionMessages(decision: CoachingDecision): { label: string; text: string }[] {
  if (decision.action === "REWRITE_DRAFT" || decision.action === "COMPLETE_DRAFT") {
    return [{ label: "Suggested message", text: decision.primary }, ...decision.alternatives];
  }
  if (decision.action === "SUGGEST_REPLY") return decision.replies;
  if (decision.action === "NO_REPLY_NEEDED" && decision.optionalReply)
    return [{ label: "Optional acknowledgment", text: decision.optionalReply }];
  return [];
}

export function CoachingDecisionView({
  decision,
  copyStatus,
  onCopy,
  onSelect,
}: {
  decision: CoachingDecision;
  copyStatus: string | undefined;
  onCopy: (text: string) => void;
  onSelect: (selection: CoachingSelection) => void;
}) {
  const messages = decisionMessages(decision);
  return (
    <section className="coaching-card">
      <p className="eyebrow">{decision.action.toLowerCase().replaceAll("_", " ")}</p>
      {decision.action === "SUGGEST_ACTIONS" ? (
        <>
          <h1>What would you like to do?</h1>
          <div className="choice-grid">
            {decision.actions.map((action) => (
              <button
                key={action.id}
                className="button button-quiet"
                type="button"
                onClick={() => onSelect({ kind: "ACTION", ...action })}
              >
                {action.label}
              </button>
            ))}
          </div>
        </>
      ) : decision.action === "ASK_CLARIFICATION" ? (
        <>
          <h1>{decision.question}</h1>
          <div className="choice-grid">
            {decision.options.map((option) => (
              <button
                key={option}
                className="button button-quiet"
                type="button"
                onClick={() => onSelect({ kind: "CLARIFICATION", answer: option })}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      ) : decision.action === "NO_REPLY_NEEDED" ? (
        <>
          <h1>No reply is necessary.</h1>
          <p>{decision.reason}</p>
        </>
      ) : (
        <h1>
          {decision.action === "SUGGEST_REPLY"
            ? "Here are a few replies"
            : "Here’s a clearer message"}
        </h1>
      )}
      {messages.length > 0 ? (
        <div className="message-options">
          {messages.map((message) => (
            <article key={`${message.label}-${message.text}`} className="message-option">
              <span>{message.label}</span>
              <p>{message.text}</p>
              <button
                className="button button-primary"
                type="button"
                onClick={() => onCopy(message.text)}
              >
                Copy
              </button>
            </article>
          ))}
        </div>
      ) : null}
      <p className="confidence-note">
        Action confidence {confidence(decision.actionConfidence)} · model-estimated, not calibrated
      </p>
      {copyStatus ? (
        <p className="copy-status" role="status">
          {copyStatus}
        </p>
      ) : null}
    </section>
  );
}

export function App() {
  const [state, dispatch] = useReducer(captureReducer, initialCaptureState);
  const [providerConfiguration, setProviderConfiguration] = useState<
    ProviderConfiguration | undefined
  >();
  const [copyStatus, setCopyStatus] = useState<string>();
  const captureInFlightReference = useRef(false);
  const analysisInFlightReference = useRef(false);
  const coachingInFlightReference = useRef(false);
  const captureSessionReference = useRef(0);
  const analysisSessionReference = useRef(0);
  const mountedReference = useRef(true);
  const objectUrlsReference = useRef(new Set<string>());
  const appName =
    typeof window === "undefined"
      ? "AI Message Coach"
      : (window.messageCoach?.appInfo.name ?? "AI Message Coach");
  const inspectorAvailable =
    typeof window !== "undefined" && window.messageCoach?.inspectLocalMemory !== undefined;
  const labAvailable = typeof window !== "undefined" && window.messageCoach?.runLab !== undefined;
  const [labOpen, setLabOpen] = useState(false);
  const labEntry = useRef<HTMLButtonElement>(null);

  const releaseObjectUrl = useCallback((imageUrl: string | undefined): void => {
    if (imageUrl === undefined || !objectUrlsReference.current.delete(imageUrl)) {
      return;
    }

    URL.revokeObjectURL(imageUrl);
  }, []);

  useEffect(() => {
    mountedReference.current = true;
    const objectUrls = objectUrlsReference.current;
    let active = true;

    const bridge = window.messageCoach;
    if (bridge !== undefined) {
      void bridge
        .getProviderConfiguration()
        .then((configuration) => {
          if (active) {
            setProviderConfiguration(configuration);
          }
        })
        .catch(() => undefined);
    }

    return () => {
      active = false;
      mountedReference.current = false;
      for (const imageUrl of objectUrls) {
        URL.revokeObjectURL(imageUrl);
      }
      objectUrls.clear();
    };
  }, []);

  const beginCapture = useCallback(
    async (eventType: "GENERATE" | "RETAKE"): Promise<void> => {
      if (
        captureInFlightReference.current ||
        analysisInFlightReference.current ||
        coachingInFlightReference.current
      ) {
        return;
      }

      const canGenerate =
        eventType === "RETAKE"
          ? state.status === "PREVIEW" || state.status === "ANALYSIS_ERROR"
          : state.status === "IDLE" ||
            state.status === "COACHING_RESULT" ||
            state.status === "COACHING_ERROR" ||
            state.status === "CAPTURE_ERROR";

      if (!canGenerate) {
        return;
      }

      captureInFlightReference.current = true;
      const session = ++captureSessionReference.current;
      releaseObjectUrl(stateImageUrl(state));
      dispatch({ type: eventType });

      try {
        const bridge = window.messageCoach;

        if (bridge === undefined) {
          throw new Error("The desktop capture bridge is unavailable.");
        }

        const result = await bridge.requestConversationCapture();

        if (!mountedReference.current || session !== captureSessionReference.current) {
          return;
        }

        if (!result.ok) {
          dispatch({ type: "CAPTURE_FAILED", message: captureErrorMessages[result.error.code] });
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
        captureInFlightReference.current = false;
      }
    },
    [releaseObjectUrl, state],
  );

  const cancelCapture = useCallback((): void => {
    captureSessionReference.current += 1;
    analysisSessionReference.current += 1;
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
          blob,
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

  const analyzeSelected = useCallback(async (): Promise<void> => {
    if (
      analysisInFlightReference.current ||
      (state.status !== "PREVIEW" && state.status !== "ANALYSIS_ERROR")
    ) {
      return;
    }

    const preview = state.preview;
    const retry = state.status === "ANALYSIS_ERROR";
    analysisInFlightReference.current = true;
    const session = ++analysisSessionReference.current;
    dispatch({ type: retry ? "RETRY_ANALYSIS" : "ANALYZE" });

    let ownedBytes: Uint8Array<ArrayBuffer> | undefined;

    try {
      const bridge = window.messageCoach;

      if (bridge === undefined) {
        throw new Error("The desktop analysis bridge is unavailable.");
      }

      ownedBytes = new Uint8Array(await preview.blob.arrayBuffer());
      const result = await bridge.analyzeConversationImage({
        mimeType: "image/png",
        bytes: ownedBytes,
        width: preview.width,
        height: preview.height,
      });

      if (!mountedReference.current || session !== analysisSessionReference.current) {
        return;
      }

      if (!result.ok) {
        dispatch({ type: "ANALYSIS_FAILED", message: analysisErrorMessages[result.error.code] });
        return;
      }

      releaseObjectUrl(preview.imageUrl);
      dispatch({
        type: "ANALYSIS_SUCCEEDED",
        result: { analysis: result.analysis, provider: result.provider },
      });
    } catch {
      if (mountedReference.current && session === analysisSessionReference.current) {
        dispatch({ type: "ANALYSIS_FAILED", message: analysisErrorMessages.PROVIDER_ERROR });
      }
    } finally {
      ownedBytes?.fill(0);
      analysisInFlightReference.current = false;
    }
  }, [releaseObjectUrl, state]);

  const requestCoaching = useCallback(
    async (analysis: ConversationAnalysis, selection: CoachingSelection | null): Promise<void> => {
      if (coachingInFlightReference.current) return;
      coachingInFlightReference.current = true;
      setCopyStatus(undefined);
      try {
        const bridge = window.messageCoach;
        if (!bridge) throw new Error("The desktop coaching bridge is unavailable.");
        const result = await bridge.requestCoaching({ analysis, selection });
        if (!mountedReference.current) return;
        dispatch(
          result.ok
            ? { type: "COACHING_SUCCEEDED", decision: result.decision }
            : { type: "COACHING_FAILED", message: coachingErrorMessages[result.error.code] },
        );
      } catch {
        if (mountedReference.current)
          dispatch({ type: "COACHING_FAILED", message: coachingErrorMessages.PROVIDER_ERROR });
      } finally {
        coachingInFlightReference.current = false;
      }
    },
    [],
  );

  useEffect(() => {
    if (state.status === "DECIDING" && !coachingInFlightReference.current) {
      void requestCoaching(state.result.analysis, state.selection);
    }
  }, [requestCoaching, state]);

  const copyMessage = useCallback(async (text: string): Promise<void> => {
    try {
      const result = await window.messageCoach?.copyCoachingText(text);
      setCopyStatus(
        result?.ok ? "Copied." : (result?.error.message ?? "Copy failed. Please try again."),
      );
    } catch {
      setCopyStatus("Copy failed. Please try again.");
    }
  }, []);

  useEffect(() => {
    const isCancelable =
      state.status === "CAPTURING" ||
      state.status === "SELECTING" ||
      state.status === "PREVIEW" ||
      state.status === "ANALYSIS_ERROR";

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

  if (
    state.status === "PREVIEW" ||
    state.status === "ANALYZING" ||
    state.status === "ANALYSIS_ERROR"
  ) {
    const isAnalyzing = state.status === "ANALYZING";
    const hasError = state.status === "ANALYSIS_ERROR";

    return (
      <main className="app-shell preview-shell">
        <section className="content-card preview-card">
          <p className="eyebrow">Conversation understanding</p>
          <h1>{isAnalyzing ? "Analyzing conversation…" : "Review selection"}</h1>
          <div className="preview-frame">
            <img alt="Selected conversation region preview" src={state.preview.imageUrl} />
            {isAnalyzing ? <div className="analysis-progress">Analyzing securely…</div> : null}
          </div>
          <p className="preview-size">
            {state.preview.width} × {state.preview.height} px
          </p>
          {hasError ? (
            <p className="inline-error" role="alert">
              {state.message}
            </p>
          ) : null}
          <div className="button-row">
            <button
              className="button button-quiet"
              disabled={isAnalyzing}
              type="button"
              onClick={() => void beginCapture("RETAKE")}
            >
              Retake
            </button>
            <button
              className="button button-quiet"
              disabled={isAnalyzing}
              type="button"
              onClick={cancelCapture}
            >
              Cancel
            </button>
            <button
              className="button button-primary"
              disabled={isAnalyzing}
              type="button"
              onClick={() => void analyzeSelected()}
            >
              {hasError ? "Try analysis again" : "Continue"}
            </button>
          </div>
          <p className="provider-note">
            {providerConfiguration?.providerId ?? "Provider"} ·{" "}
            {providerConfiguration?.modelId ?? "status unavailable"} · Your provider may charge for
            this request.
          </p>
          {!isAnalyzing ? <p className="keyboard-hint">Press Esc to cancel</p> : null}
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

  if (state.status === "CAPTURE_ERROR") {
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

  if (state.status === "DECIDING") {
    return (
      <main className="app-shell">
        <section className="content-card status-card" aria-live="polite">
          <p className="eyebrow">Draft-aware coaching</p>
          <h1>Thinking about the response…</h1>
          <p>Choosing the most useful next step from the visible conversation.</p>
        </section>
      </main>
    );
  }

  if (state.status === "COACHING_ERROR") {
    return (
      <main className="app-shell">
        <section className="content-card status-card" aria-live="polite">
          <p className="eyebrow">Coaching unavailable</p>
          <h1>We couldn’t prepare a message.</h1>
          <p className="inline-error">{state.message}</p>
          <div className="button-row">
            <button
              className="button button-quiet"
              type="button"
              onClick={() => void beginCapture("GENERATE")}
            >
              Start over
            </button>
            <button
              className="button button-primary"
              type="button"
              onClick={() => dispatch({ type: "RETRY_COACHING" })}
            >
              Try again
            </button>
          </div>
          <details className="analysis-details">
            <summary>Inspect extracted conversation</summary>
            <AnalysisResultView analysis={state.result.analysis} />
          </details>
        </section>
      </main>
    );
  }

  if (state.status === "COACHING_RESULT") {
    return (
      <main className="coaching-shell">
        <header className="result-header">
          <div>
            <p className="eyebrow">AI Message Coach</p>
            <h1>Your next message</h1>
            <p className="provider-note">
              {state.result.provider.providerId} · {state.result.provider.modelId}
            </p>
          </div>
          <button
            className="button button-primary"
            type="button"
            onClick={() => void beginCapture("GENERATE")}
          >
            New capture
          </button>
        </header>
        <CoachingDecisionView
          decision={state.result.decision}
          copyStatus={copyStatus}
          onCopy={(text) => void copyMessage(text)}
          onSelect={(selection) => dispatch({ type: "CONTINUE_COACHING", selection })}
        />
        <details className="analysis-details">
          <summary>Inspect extracted conversation</summary>
          <AnalysisResultView analysis={state.result.analysis} />
        </details>
        <p className="phase-boundary-note">
          Review before sending. Message Coach never sends or inserts text automatically.
        </p>
      </main>
    );
  }

  if (labOpen && labAvailable)
    return (
      <Lab
        onClose={() => {
          setLabOpen(false);
          requestAnimationFrame(() => labEntry.current?.focus());
        }}
      />
    );

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
        <p className={`provider-status ${providerConfiguration?.configured ? "is-ready" : ""}`}>
          {providerConfiguration === undefined
            ? "Checking provider configuration…"
            : `${providerConfiguration.providerId} · ${providerConfiguration.modelId} · ${
                providerConfiguration.configured ? "configured" : "not configured"
              }`}
        </p>
        {labAvailable && (
          <button
            ref={labEntry}
            className="button button-quiet"
            type="button"
            onClick={() => setLabOpen(true)}
          >
            Open Lab · development
          </button>
        )}
        <LocalMemorySettings />
        {inspectorAvailable ? <LocalMemoryInspector /> : null}
      </section>
    </main>
  );
}
