import { z } from "zod";

export const AgentActionSchema = z.enum([
  "REWRITE_DRAFT",
  "COMPLETE_DRAFT",
  "SUGGEST_REPLY",
  "SUGGEST_ACTIONS",
  "ASK_CLARIFICATION",
  "NO_REPLY_NEEDED",
]);

export type AgentAction = z.infer<typeof AgentActionSchema>;

export const ConfidenceSchema = z.number().min(0).max(1);

export const ConfidenceScoresSchema = z
  .object({
    identity: ConfidenceSchema,
    relationship: ConfidenceSchema,
    situation: ConfidenceSchema,
    userIntent: ConfidenceSchema,
    otherIntent: ConfidenceSchema,
    language: ConfidenceSchema,
    skillSelection: ConfidenceSchema,
  })
  .strict();

export type ConfidenceScores = z.infer<typeof ConfidenceScoresSchema>;

export const MessageOwnerSchema = z.enum(["USER", "OTHER", "UNKNOWN"]);

export const ObservedMessageSchema = z
  .object({
    id: z.string().min(1),
    owner: MessageOwnerSchema,
    text: z.string(),
  })
  .strict();

export const ConversationObservationSchema = z
  .object({
    messages: z.array(ObservedMessageSchema),
    draft: z.string().nullable(),
  })
  .strict();

export type ConversationObservation = z.infer<typeof ConversationObservationSchema>;

export const CoachResultSchema = z
  .object({
    action: AgentActionSchema,
    confidences: ConfidenceScoresSchema,
  })
  .strict();

export type CoachResult = z.infer<typeof CoachResultSchema>;
