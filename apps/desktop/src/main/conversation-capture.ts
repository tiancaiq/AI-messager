import {
  ConversationCaptureSchema,
  type ConversationCaptureResult,
} from "@ai-message-coach/contracts";
import {
  desktopCapturer,
  screen,
  systemPreferences,
  type BrowserWindow,
  type Display,
} from "electron";

import { createCaptureLifecycle } from "./capture-lifecycle.js";
import { selectCaptureSource } from "./capture-source.js";

// A hidden native window can remain in the desktop compositor for a few frames.
// Keep the only timing allowance here so callers never accumulate arbitrary delays.
const WINDOW_HIDE_SETTLE_MS = 100;

const waitForWindowsToHide = async (): Promise<void> =>
  await new Promise((resolve) => setTimeout(resolve, WINDOW_HIDE_SETTLE_MS));

function captureUnavailable(message: string): ConversationCaptureResult {
  return {
    ok: false,
    error: {
      code: "CAPTURE_UNAVAILABLE",
      message,
    },
  };
}

function hasDeniedScreenPermission(): boolean {
  if (process.platform !== "darwin") {
    return false;
  }

  const status = systemPreferences.getMediaAccessStatus("screen");
  return status === "denied" || status === "restricted";
}

async function captureDisplay(display: Display): Promise<ConversationCaptureResult> {
  if (hasDeniedScreenPermission()) {
    return {
      ok: false,
      error: {
        code: "CAPTURE_PERMISSION_DENIED",
        message: "Allow screen recording for AI Message Coach, then try again.",
      },
    };
  }

  const requestedWidth = Math.ceil(display.size.width * display.scaleFactor);
  const requestedHeight = Math.ceil(display.size.height * display.scaleFactor);
  const sources = await desktopCapturer.getSources({
    types: ["screen"],
    thumbnailSize: {
      width: requestedWidth,
      height: requestedHeight,
    },
  });
  const displayId = String(display.id);
  const source = selectCaptureSource(sources, displayId);

  if (source === undefined) {
    return captureUnavailable("The current display could not be matched to a capture source.");
  }

  if (source.thumbnail.isEmpty()) {
    return captureUnavailable(
      "The current display returned no image. Check screen recording permissions and try again.",
    );
  }

  const imageSize = source.thumbnail.getSize();
  const capture = ConversationCaptureSchema.parse({
    mimeType: "image/png",
    bytes: source.thumbnail.toPNG(),
    width: imageSize.width,
    height: imageSize.height,
    display: {
      id: displayId,
      sourceId: source.id,
      bounds: display.bounds,
      scaleFactor: display.scaleFactor,
    },
  });

  return { ok: true, capture };
}

export function createConversationCaptureService(getCoachWindows: () => BrowserWindow[]) {
  const captureLifecycle = createCaptureLifecycle({
    getCoachWindows,
    waitForWindowsToHide,
  });

  return {
    async requestConversationCapture(
      requestingWindow: BrowserWindow,
    ): Promise<ConversationCaptureResult> {
      const targetDisplay = screen.getDisplayMatching(requestingWindow.getBounds());

      return await captureLifecycle.run(
        async () => await captureDisplay(targetDisplay),
        requestingWindow,
      );
    },
  };
}
