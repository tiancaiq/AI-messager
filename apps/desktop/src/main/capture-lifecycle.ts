import type { ConversationCaptureResult } from "@ai-message-coach/contracts";

export interface CapturableCoachWindow {
  focus(): void;
  hide(): void;
  isDestroyed(): boolean;
  isVisible(): boolean;
  show(): void;
}

interface CaptureLifecycleDependencies {
  getCoachWindows(): CapturableCoachWindow[];
  waitForWindowsToHide(): Promise<void>;
}

type CaptureTask = () => Promise<ConversationCaptureResult>;

const captureInProgressResult: ConversationCaptureResult = {
  ok: false,
  error: {
    code: "CAPTURE_IN_PROGRESS",
    message: "A conversation capture is already in progress.",
  },
};

const captureFailedResult: ConversationCaptureResult = {
  ok: false,
  error: {
    code: "CAPTURE_FAILED",
    message: "The screen could not be captured. Please try again.",
  },
};

export function createCaptureLifecycle({
  getCoachWindows,
  waitForWindowsToHide,
}: CaptureLifecycleDependencies) {
  let captureInProgress = false;

  return {
    async run(
      capture: CaptureTask,
      restoreFocusTo?: CapturableCoachWindow,
    ): Promise<ConversationCaptureResult> {
      if (captureInProgress) {
        return captureInProgressResult;
      }

      captureInProgress = true;
      const previouslyVisibleWindows = getCoachWindows().filter(
        (window) => !window.isDestroyed() && window.isVisible(),
      );

      try {
        for (const window of previouslyVisibleWindows) {
          window.hide();
        }

        if (previouslyVisibleWindows.length > 0) {
          await waitForWindowsToHide();
        }

        return await capture();
      } catch {
        return captureFailedResult;
      } finally {
        for (const window of previouslyVisibleWindows) {
          if (!window.isDestroyed()) {
            window.show();
          }
        }

        if (
          restoreFocusTo !== undefined &&
          !restoreFocusTo.isDestroyed() &&
          previouslyVisibleWindows.includes(restoreFocusTo)
        ) {
          restoreFocusTo.focus();
        }

        captureInProgress = false;
      }
    },
  };
}
