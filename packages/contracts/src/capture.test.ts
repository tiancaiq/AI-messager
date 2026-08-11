import { describe, expect, it } from "vitest";

import {
  CONVERSATION_CAPTURE_CHANNEL,
  ConversationCaptureResultSchema,
  ConversationCaptureSchema,
} from "./index.js";

const validCapture = {
  mimeType: "image/png" as const,
  bytes: new Uint8Array([137, 80, 78, 71]),
  width: 3024,
  height: 1964,
  display: {
    id: "1",
    sourceId: "screen:1:0",
    bounds: { x: -1512, y: 0, width: 1512, height: 982 },
    scaleFactor: 2,
  },
};

describe("conversation capture contracts", () => {
  it("exports one fixed allowlisted capture channel", () => {
    expect(CONVERSATION_CAPTURE_CHANNEL).toBe("conversation-capture:request");
  });

  it("validates an in-memory PNG with display and scaling metadata", () => {
    expect(ConversationCaptureSchema.parse(validCapture)).toEqual(validCapture);
    expect(ConversationCaptureResultSchema.parse({ ok: true, capture: validCapture })).toEqual({
      ok: true,
      capture: validCapture,
    });
  });

  it("rejects empty image bytes, invalid dimensions, and unbounded scale factors", () => {
    expect(
      ConversationCaptureSchema.safeParse({
        ...validCapture,
        bytes: new Uint8Array(),
      }).success,
    ).toBe(false);
    expect(
      ConversationCaptureSchema.safeParse({
        ...validCapture,
        width: 0,
      }).success,
    ).toBe(false);
    expect(
      ConversationCaptureSchema.safeParse({
        ...validCapture,
        display: { ...validCapture.display, scaleFactor: 9 },
      }).success,
    ).toBe(false);
  });

  it("accepts only safe capture failure envelopes", () => {
    expect(
      ConversationCaptureResultSchema.parse({
        ok: false,
        error: {
          code: "CAPTURE_UNAVAILABLE",
          message: "No screen capture source is available.",
        },
      }),
    ).toEqual({
      ok: false,
      error: {
        code: "CAPTURE_UNAVAILABLE",
        message: "No screen capture source is available.",
      },
    });

    expect(
      ConversationCaptureResultSchema.safeParse({
        ok: false,
        error: {
          code: "RAW_ELECTRON_ERROR",
          message: "private stack",
        },
      }).success,
    ).toBe(false);
  });

  it("rejects unknown fields at the IPC boundary", () => {
    expect(
      ConversationCaptureResultSchema.safeParse({
        ok: true,
        capture: { ...validCapture, path: "/tmp/private.png" },
      }).success,
    ).toBe(false);
  });
});
