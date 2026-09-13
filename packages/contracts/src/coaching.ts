import { z } from "zod";

import { ConfidenceSchema } from "./confidence.js";
import { ConversationAnalysisSchema } from "./conversation-analysis.js";

export const COACHING_REQUEST_CHANNEL = "coaching:request";
export const COPY_COACHING_TEXT_CHANNEL = "coaching:copy-text";

export const AgentActionSchema = z.enum([
  "REWRITE_DRAFT",
  "COMPLETE_DRAFT",
  "SUGGEST_REPLY",
  "SUGGEST_ACTIONS",
  "ASK_CLARIFICATION",
  "NO_REPLY_NEEDED",
]);

export const CoachingSelectionSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("ACTION"),
      id: z.string().trim().min(1).max(64),
      label: z.string().trim().min(1).max(120),
      intent: z.string().trim().min(1).max(500),
    })
    .strict(),
  z
    .object({
      kind: z.literal("CLARIFICATION"),
      answer: z.string().trim().min(1).max(500),
    })
    .strict(),
]);

export const CoachingRequestSchema = z
  .object({
    analysis: ConversationAnalysisSchema,
    selection: CoachingSelectionSchema.nullable(),
  })
  .strict();

const UserIntentSchema = z
  .object({
    value: z.string().trim().min(1).max(500).nullable(),
    confidence: ConfidenceSchema,
  })
  .strict();

const AmbiguitySchema = z
  .object({
    material: z.boolean(),
    reason: z.string().trim().min(1).max(500).nullable(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.material !== (value.reason !== null)) {
      context.addIssue({
        code: "custom",
        message: "A material ambiguity must have one safe reason and no reason otherwise.",
        path: ["reason"],
      });
    }
  });

const DecisionBaseSchema = z.object({
  userIntent: UserIntentSchema,
  actionConfidence: ConfidenceSchema,
  ambiguity: AmbiguitySchema,
});

export const MessageOptionSchema = z
  .object({
    label: z.string().trim().min(1).max(80),
    text: z.string().trim().min(1).max(10_000),
  })
  .strict();

export const SuggestedActionSchema = z
  .object({
    id: z.string().trim().min(1).max(64),
    label: z.string().trim().min(1).max(120),
    intent: z.string().trim().min(1).max(500),
  })
  .strict();

export const RewriteOrCompletionOutputSchema = z
  .object({
    primary: z.string().trim().min(1).max(10_000),
    alternatives: z.array(MessageOptionSchema).max(3),
  })
  .strict();

export const SuggestedReplyOutputSchema = z
  .object({
    replies: z.array(MessageOptionSchema).min(1).max(3),
  })
  .strict();

const GeneratedDecisionSchema = DecisionBaseSchema.extend({
  action: z.enum(["REWRITE_DRAFT", "COMPLETE_DRAFT"]),
  ...RewriteOrCompletionOutputSchema.shape,
}).strict();

const ReplyDecisionSchema = DecisionBaseSchema.extend({
  action: z.literal("SUGGEST_REPLY"),
  ...SuggestedReplyOutputSchema.shape,
}).strict();

const ActionDecisionSchema = DecisionBaseSchema.extend({
  action: z.literal("SUGGEST_ACTIONS"),
  actions: z.array(SuggestedActionSchema).min(2).max(5),
}).strict();

const ClarificationDecisionSchema = DecisionBaseSchema.extend({
  action: z.literal("ASK_CLARIFICATION"),
  question: z.string().trim().min(1).max(500),
  options: z.array(z.string().trim().min(1).max(120)).min(2).max(5),
}).strict();

const NoReplyDecisionSchema = DecisionBaseSchema.extend({
  action: z.literal("NO_REPLY_NEEDED"),
  reason: z.string().trim().min(1).max(500),
  optionalReply: z.string().trim().min(1).max(500).nullable(),
}).strict();

export const CoachingDecisionSchema = z.discriminatedUnion("action", [
  GeneratedDecisionSchema,
  ReplyDecisionSchema,
  ActionDecisionSchema,
  ClarificationDecisionSchema,
  NoReplyDecisionSchema,
]);

export const RewriteOrCompletionOutputJsonSchema = z.toJSONSchema(RewriteOrCompletionOutputSchema, {
  target: "draft-7",
});

export const SuggestedReplyOutputJsonSchema = z.toJSONSchema(SuggestedReplyOutputSchema, {
  target: "draft-7",
});

export const CoachingErrorCodeSchema = z.enum([
  "COACHING_IN_PROGRESS",
  "NOT_CONFIGURED",
  "INVALID_CREDENTIALS",
  "RATE_LIMITED",
  "INSUFFICIENT_CREDITS",
  "MODEL_UNAVAILABLE",
  "TIMEOUT",
  "INVALID_RESPONSE",
  "PROVIDER_ERROR",
]);

export const CoachingErrorSchema = z
  .object({
    code: CoachingErrorCodeSchema,
    message: z.string().trim().min(1).max(500),
  })
  .strict();

export const CoachingDecisionResultSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true), decision: CoachingDecisionSchema }).strict(),
  z.object({ ok: z.literal(false), error: CoachingErrorSchema }).strict(),
]);

export const CopyCoachingTextRequestSchema = z
  .object({ text: z.string().trim().min(1).max(10_000) })
  .strict();

export const CopyCoachingTextResultSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true) }).strict(),
  z
    .object({
      ok: z.literal(false),
      error: z.object({ message: z.string().trim().min(1).max(500) }).strict(),
    })
    .strict(),
]);

export type AgentAction = z.infer<typeof AgentActionSchema>;
export type CoachingSelection = z.infer<typeof CoachingSelectionSchema>;
export type CoachingRequest = z.infer<typeof CoachingRequestSchema>;
export type MessageOption = z.infer<typeof MessageOptionSchema>;
export type SuggestedAction = z.infer<typeof SuggestedActionSchema>;
export type RewriteOrCompletionOutput = z.infer<typeof RewriteOrCompletionOutputSchema>;
export type SuggestedReplyOutput = z.infer<typeof SuggestedReplyOutputSchema>;
export type CoachingDecision = z.infer<typeof CoachingDecisionSchema>;
export type CoachingErrorCode = z.infer<typeof CoachingErrorCodeSchema>;
export type CoachingError = z.infer<typeof CoachingErrorSchema>;
export type CoachingDecisionResult = z.infer<typeof CoachingDecisionResultSchema>;
export type CopyCoachingTextRequest = z.infer<typeof CopyCoachingTextRequestSchema>;
export type CopyCoachingTextResult = z.infer<typeof CopyCoachingTextResultSchema>;
