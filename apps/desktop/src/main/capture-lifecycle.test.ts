import { describe, expect, it } from "vitest";

import { createCaptureLifecycle, type CapturableCoachWindow } from "./capture-lifecycle.js";

function createWindow(visible = true) {
  const calls: string[] = [];
  let destroyed = false;
  let isVisible = visible;

  const window: CapturableCoachWindow = {
    focus: () => calls.push("focus"),
    hide: () => {
      calls.push("hide");
      isVisible = false;
    },
    isDestroyed: () => destroyed,
    isVisible: () => isVisible,
    show: () => {
      calls.push("show");
      isVisible = true;
    },
  };

  return {
    calls,
    destroy: () => {
      destroyed = true;
    },
    window,
  };
}

const unavailableResult = {
  ok: false as const,
  error: {
    code: "CAPTURE_UNAVAILABLE" as const,
    message: "No screen capture source is available.",
  },
};

describe("capture lifecycle", () => {
  it("hides visible coach windows before capture and restores focus afterward", async () => {
    const primary = createWindow();
    const secondary = createWindow();
    const hidden = createWindow(false);
    const sequence: string[] = [];
    const lifecycle = createCaptureLifecycle({
      getCoachWindows: () => [primary.window, secondary.window, hidden.window],
      waitForWindowsToHide: async () => {
        sequence.push("settled");
        expect(primary.calls).toEqual(["hide"]);
        expect(secondary.calls).toEqual(["hide"]);
      },
    });

    const result = await lifecycle.run(async () => {
      sequence.push("captured");
      return unavailableResult;
    }, primary.window);

    expect(result).toEqual(unavailableResult);
    expect(sequence).toEqual(["settled", "captured"]);
    expect(primary.calls).toEqual(["hide", "show", "focus"]);
    expect(secondary.calls).toEqual(["hide", "show"]);
    expect(hidden.calls).toEqual([]);
  });

  it("restores the coach and returns a safe error when capture throws", async () => {
    const primary = createWindow();
    const lifecycle = createCaptureLifecycle({
      getCoachWindows: () => [primary.window],
      waitForWindowsToHide: async () => undefined,
    });

    const result = await lifecycle.run(async () => {
      throw new Error("native stack with private implementation details");
    }, primary.window);

    expect(result).toEqual({
      ok: false,
      error: {
        code: "CAPTURE_FAILED",
        message: "The screen could not be captured. Please try again.",
      },
    });
    expect(primary.calls).toEqual(["hide", "show", "focus"]);
  });

  it("prevents overlapping capture tasks", async () => {
    const primary = createWindow();
    let releaseCapture: (() => void) | undefined;
    const lifecycle = createCaptureLifecycle({
      getCoachWindows: () => [primary.window],
      waitForWindowsToHide: async () => undefined,
    });

    const firstCapture = lifecycle.run(
      async () =>
        await new Promise((resolve) => {
          releaseCapture = () => resolve(unavailableResult);
        }),
      primary.window,
    );

    const duplicateResult = await lifecycle.run(async () => unavailableResult, primary.window);

    expect(duplicateResult).toEqual({
      ok: false,
      error: {
        code: "CAPTURE_IN_PROGRESS",
        message: "A conversation capture is already in progress.",
      },
    });

    releaseCapture?.();
    await firstCapture;
    expect(primary.calls).toEqual(["hide", "show", "focus"]);
  });

  it("does not attempt to restore a window destroyed during capture", async () => {
    const primary = createWindow();
    const lifecycle = createCaptureLifecycle({
      getCoachWindows: () => [primary.window],
      waitForWindowsToHide: async () => undefined,
    });

    await lifecycle.run(async () => {
      primary.destroy();
      return unavailableResult;
    }, primary.window);

    expect(primary.calls).toEqual(["hide"]);
  });
});
