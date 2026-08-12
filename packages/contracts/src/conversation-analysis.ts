import { z } from "zod";

import { ConfidenceSchema } from "./confidence.js";

export const CONVERSATION_ANALYSIS_CHANNEL = "conversation-analysis:request";
export const PROVIDER_CONFIGURATION_CHANNEL = "conversation-analysis:provider-configuration";

const nullableVisibleText = z.string().trim().min(1).max(2_000).nullable();

export const ConversationSpeakerSchema = z.enum(["USER", "OTHER", "UNKNOWN"]);

export const ExtractedMessageSchema = z
  .object({
    id: z.string().trim().min(1).max(64),
    order: z.number().int().positive().max(500),
    speaker: ConversationSpeakerSchema,
    text: z.string().trim().min(1).max(10_000),
    textConfidence: ConfidenceSchema,
    speakerConfidence: ConfidenceSchema,
  })
  .strict();

export const DraftObservationSchema = z
  .object({
    text: z.string().max(10_000).nullable(),
    confidence: ConfidenceSchema,
  })
  .strict();

export const ParticipantObservationSchema = z
  .object({
    speaker: ConversationSpeakerSchema,
    displayName: nullableVisibleText,
    username: nullableVisibleText,
    platformHint: nullableVisibleText,
    confidence: ConfidenceSchema,
  })
  .strict();

export const VisibleContactObservationSchema = z
  .object({
    displayName: nullableVisibleText,
    username: nullableVisibleText,
    channelOrGroupName: nullableVisibleText,
    platformHint: nullableVisibleText,
    confidence: ConfidenceSchema,
  })
  .strict();

export const LanguageScriptSchema = z.enum([
  "SIMPLIFIED",
  "TRADITIONAL",
  "MIXED",
  "UNKNOWN",
  "NOT_APPLICABLE",
]);

const LanguageCodeSchema = z
  .string()
  .trim()
  .regex(/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/)
  .nullable();

export const LanguageObservationSchema = z
  .object({
    primary: LanguageCodeSchema,
    secondary: LanguageCodeSchema,
    script: LanguageScriptSchema,
    codeSwitching: z.boolean(),
    supportedForLanguageSpecificSkills: z.boolean(),
    confidence: ConfidenceSchema,
  })
  .strict()
  .superRefine((value, context) => {
    const shouldBeSupported = value.primary === "en" || value.primary === "zh";

    if (value.supportedForLanguageSpecificSkills !== shouldBeSupported) {
      context.addIssue({
        code: "custom",
        message: "Language-specific skill support must be true only for en or zh.",
        path: ["supportedForLanguageSpecificSkills"],
      });
    }
  });

export const AnalysisWarningSchema = z.enum([
  "AMBIGUOUS_SPEAKER",
  "PARTIAL_MESSAGE",
  "UNCLEAR_DRAFT",
  "CROPPED_CONTENT",
  "LOW_CONFIDENCE",
  "UNREADABLE_TEXT",
  "OTHER_VISIBLE_AMBIGUITY",
]);

export const ConversationAnalysisSchema = z
  .object({
    messages: z.array(ExtractedMessageSchema).max(500),
    draft: DraftObservationSchema,
    participants: z.array(ParticipantObservationSchema).max(50),
    visibleContact: VisibleContactObservationSchema,
    language: LanguageObservationSchema,
    conversation: z
      .object({
        summary: z.string().trim().max(2_000),
        confidence: ConfidenceSchema,
      })
      .strict(),
    warnings: z.array(AnalysisWarningSchema).max(20),
    overallConfidence: ConfidenceSchema,
  })
  .strict()
  .superRefine((value, context) => {
    const seenIds = new Set<string>();
    const seenOrders = new Set<number>();

    for (const [index, message] of value.messages.entries()) {
      if (seenIds.has(message.id)) {
        context.addIssue({
          code: "custom",
          message: "Message ids must be unique.",
          path: ["messages", index, "id"],
        });
      }

      if (seenOrders.has(message.order)) {
        context.addIssue({
          code: "custom",
          message: "Message order values must be unique.",
          path: ["messages", index, "order"],
        });
      }

      if (message.order !== index + 1) {
        context.addIssue({
          code: "custom",
          message: "Messages must be sorted with sequential order values starting at 1.",
          path: ["messages", index, "order"],
        });
      }

      seenIds.add(message.id);
      seenOrders.add(message.order);
    }
  });

export const ConversationAnalysisJsonSchema = z.toJSONSchema(ConversationAnalysisSchema, {
  target: "draft-7",
});

export const ConversationImageRequestSchema = z
  .object({
    mimeType: z.literal("image/png"),
    bytes: z
      .instanceof(Uint8Array)
      .refine((bytes) => bytes.byteLength > 0, {
        message: "The conversation crop cannot be empty.",
      })
      .refine((bytes) => bytes.byteLength <= 20 * 1024 * 1024, {
        message: "The conversation crop exceeds the 20 MiB request limit.",
      }),
    width: z.number().int().positive().max(32_768),
    height: z.number().int().positive().max(32_768),
  })
  .strict();

export const ModelCapabilitiesSchema = z
  .object({
    textGeneration: z.boolean(),
    vision: z.boolean(),
    structuredOutput: z.boolean(),
  })
  .strict();

export const ProviderConfigurationSchema = z
  .object({
    providerId: z.string().trim().min(1).max(64),
    modelId: z.string().trim().min(1).max(128),
    configured: z.boolean(),
    capabilities: ModelCapabilitiesSchema,
  })
  .strict();

export const AiProviderErrorCodeSchema = z.enum([
  "ANALYSIS_IN_PROGRESS",
  "NOT_CONFIGURED",
  "INVALID_CREDENTIALS",
  "RATE_LIMITED",
  "INSUFFICIENT_CREDITS",
  "MODEL_UNAVAILABLE",
  "VISION_UNSUPPORTED",
  "REQUEST_TOO_LARGE",
  "TIMEOUT",
  "INVALID_RESPONSE",
  "PROVIDER_ERROR",
]);

export const AiProviderErrorSchema = z
  .object({
    code: AiProviderErrorCodeSchema,
    message: z.string().trim().min(1).max(500),
  })
  .strict();

export const ConversationAnalysisResultSchema = z.discriminatedUnion("ok", [
  z
    .object({
      ok: z.literal(true),
      analysis: ConversationAnalysisSchema,
      provider: ProviderConfigurationSchema.pick({ providerId: true, modelId: true }),
    })
    .strict(),
  z
    .object({
      ok: z.literal(false),
      error: AiProviderErrorSchema,
    })
    .strict(),
]);

export type ConversationSpeaker = z.infer<typeof ConversationSpeakerSchema>;
export type ExtractedMessage = z.infer<typeof ExtractedMessageSchema>;
export type DraftObservation = z.infer<typeof DraftObservationSchema>;
export type ParticipantObservation = z.infer<typeof ParticipantObservationSchema>;
export type VisibleContactObservation = z.infer<typeof VisibleContactObservationSchema>;
export type LanguageObservation = z.infer<typeof LanguageObservationSchema>;
export type AnalysisWarning = z.infer<typeof AnalysisWarningSchema>;
export type ConversationAnalysis = z.infer<typeof ConversationAnalysisSchema>;
export type ConversationImageRequest = z.infer<typeof ConversationImageRequestSchema>;
export type ModelCapabilities = z.infer<typeof ModelCapabilitiesSchema>;
export type ProviderConfiguration = z.infer<typeof ProviderConfigurationSchema>;
export type AiProviderErrorCode = z.infer<typeof AiProviderErrorCodeSchema>;
export type AiProviderError = z.infer<typeof AiProviderErrorSchema>;
export type ConversationAnalysisResult = z.infer<typeof ConversationAnalysisResultSchema>;
