import { z } from "zod";

export const CONVERSATION_CAPTURE_CHANNEL = "conversation-capture:request" as const;

const CaptureDimensionSchema = z.number().int().positive().max(32_768);

export const CaptureBoundsSchema = z
  .object({
    x: z.number().finite(),
    y: z.number().finite(),
    width: z.number().finite().positive(),
    height: z.number().finite().positive(),
  })
  .strict();

export const CaptureDisplaySchema = z
  .object({
    id: z.string().min(1).max(128),
    sourceId: z.string().min(1).max(256),
    bounds: CaptureBoundsSchema,
    scaleFactor: z.number().finite().positive().max(8),
  })
  .strict();

export const ConversationCaptureSchema = z
  .object({
    mimeType: z.literal("image/png"),
    bytes: z
      .instanceof(Uint8Array)
      .refine((bytes) => bytes.byteLength > 0, "Capture bytes cannot be empty.")
      .refine(
        (bytes) => bytes.byteLength <= 256 * 1024 * 1024,
        "Capture bytes exceed the in-memory limit.",
      ),
    width: CaptureDimensionSchema,
    height: CaptureDimensionSchema,
    display: CaptureDisplaySchema,
  })
  .strict();

export const CaptureErrorCodeSchema = z.enum([
  "CAPTURE_IN_PROGRESS",
  "CAPTURE_PERMISSION_DENIED",
  "CAPTURE_UNAVAILABLE",
  "CAPTURE_FAILED",
]);

export const CaptureErrorSchema = z
  .object({
    code: CaptureErrorCodeSchema,
    message: z.string().min(1).max(240),
  })
  .strict();

export const ConversationCaptureResultSchema = z.discriminatedUnion("ok", [
  z
    .object({
      ok: z.literal(true),
      capture: ConversationCaptureSchema,
    })
    .strict(),
  z
    .object({
      ok: z.literal(false),
      error: CaptureErrorSchema,
    })
    .strict(),
]);

export type CaptureBounds = z.infer<typeof CaptureBoundsSchema>;
export type CaptureDisplay = z.infer<typeof CaptureDisplaySchema>;
export type ConversationCapture = z.infer<typeof ConversationCaptureSchema>;
export type CaptureError = z.infer<typeof CaptureErrorSchema>;
export type ConversationCaptureResult = z.infer<typeof ConversationCaptureResultSchema>;
