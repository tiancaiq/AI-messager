import {
  AnalysisWarningSchema,
  CoachingRequestSchema,
  ConfidenceSchema,
  LanguageObservationSchema,
  VisibleContactObservationSchema,
  type CoachingRequest,
} from "@ai-message-coach/contracts";
import { z } from "zod";

const userText = z.string().trim().min(1).max(500);
const constraintText = z.string().trim().min(1).max(300);
const priorityText = z.string().trim().min(1).max(120);
const sourceText = z.string().min(1).max(10_000);

export const UserSuppliedCommunicationContextSchema = z
  .object({
    instruction: userText.optional(),
    recipient: userText.optional(),
    relationship: userText.optional(),
    hardConstraints: z.array(constraintText).max(8).default([]),
    stylisticPriorities: z.array(priorityText).max(6).default([]),
  })
  .strict();

const UserSuppliedValueSchema = z
  .object({ value: userText, provenance: z.literal("USER_SUPPLIED") })
  .strict();
const ObservedDraftSchema = z
  .object({
    text: sourceText,
    confidence: ConfidenceSchema,
    provenance: z.literal("OBSERVED_SCREENSHOT"),
  })
  .strict();
const ObservedMessageSchema = z
  .object({
    id: z.string().trim().min(1).max(64),
    order: z.number().int().positive().max(500),
    text: sourceText,
    textConfidence: ConfidenceSchema,
    speakerConfidence: ConfidenceSchema,
    provenance: z.literal("OBSERVED_SCREENSHOT"),
  })
  .strict();

export const CommunicationProblemSchema = z
  .object({
    instruction: UserSuppliedValueSchema.nullable(),
    goal: z
      .object({
        kind: z.enum(["WORK_WITH_DRAFT", "FOLLOW_SELECTION", "FOLLOW_INSTRUCTION", "UNKNOWN"]),
        value: userText.nullable(),
        provenance: z.enum(["DETERMINISTIC_DERIVATION", "UNKNOWN"]),
      })
      .strict(),
    sourceDraft: ObservedDraftSchema.nullable(),
    latestOtherMessage: ObservedMessageSchema.nullable(),
    meaningToPreserve: z
      .object({
        text: sourceText,
        provenance: z.enum(["OBSERVED_SCREENSHOT", "USER_SUPPLIED"]),
      })
      .strict()
      .nullable(),
    language: LanguageObservationSchema,
    visibleContact: VisibleContactObservationSchema.extend({
      provenance: z.literal("OBSERVED_SCREENSHOT"),
    }),
    recipient: UserSuppliedValueSchema.nullable(),
    relationship: UserSuppliedValueSchema.nullable(),
    hardConstraints: z
      .array(z.object({ value: constraintText, provenance: z.literal("USER_SUPPLIED") }).strict())
      .max(8),
    stylisticPriorities: z
      .array(z.object({ value: priorityText, provenance: z.literal("USER_SUPPLIED") }).strict())
      .max(6),
    concerns: z
      .array(
        z
          .object({
            code: AnalysisWarningSchema,
            provenance: z.literal("ANALYSIS_INFERENCE"),
          })
          .strict(),
      )
      .max(20),
    unknowns: z
      .array(
        z.enum([
          "EXPLICIT_INSTRUCTION",
          "RECIPIENT",
          "RELATIONSHIP",
          "CONFIRMED_IDENTITY",
          "COMMUNICATION_GOAL",
          "SOURCE_DRAFT",
        ]),
      )
      .max(6),
  })
  .strict();

export type UserSuppliedCommunicationContext = z.input<
  typeof UserSuppliedCommunicationContextSchema
>;
export type CommunicationProblem = z.infer<typeof CommunicationProblemSchema>;
export type CommunicationProblemGoalKind = CommunicationProblem["goal"]["kind"];

export function normalizeCommunicationProblem(
  rawRequest: CoachingRequest,
  rawSuppliedContext: UserSuppliedCommunicationContext = {},
): CommunicationProblem {
  const request = CoachingRequestSchema.parse(rawRequest);
  const supplied = UserSuppliedCommunicationContextSchema.parse(rawSuppliedContext);
  const draft = request.analysis.draft.text?.trim() ? request.analysis.draft.text : null;
  const latestOther = [...request.analysis.messages]
    .reverse()
    .find((message) => message.speaker === "OTHER");
  const selectedIntent =
    request.selection === null
      ? null
      : request.selection.kind === "ACTION"
        ? request.selection.intent
        : request.selection.answer;
  const explicitReplyGoal = request.userDirection?.text ?? null;

  const goal: CommunicationProblem["goal"] = selectedIntent
    ? {
        kind: "FOLLOW_SELECTION",
        value: selectedIntent,
        provenance: "DETERMINISTIC_DERIVATION",
      }
    : explicitReplyGoal
      ? {
          kind: "FOLLOW_INSTRUCTION",
          value: explicitReplyGoal,
          provenance: "DETERMINISTIC_DERIVATION",
        }
      : draft !== null
        ? { kind: "WORK_WITH_DRAFT", value: null, provenance: "DETERMINISTIC_DERIVATION" }
        : supplied.instruction
          ? {
              kind: "FOLLOW_INSTRUCTION",
              value: supplied.instruction,
              provenance: "DETERMINISTIC_DERIVATION",
            }
          : { kind: "UNKNOWN", value: null, provenance: "UNKNOWN" };

  const unknowns: CommunicationProblem["unknowns"] = ["CONFIRMED_IDENTITY"];
  if (!supplied.instruction && !explicitReplyGoal) unknowns.push("EXPLICIT_INSTRUCTION");
  if (!supplied.recipient) unknowns.push("RECIPIENT");
  if (!supplied.relationship) unknowns.push("RELATIONSHIP");
  if (goal.kind === "UNKNOWN") unknowns.push("COMMUNICATION_GOAL");
  if (draft === null) unknowns.push("SOURCE_DRAFT");

  return CommunicationProblemSchema.parse({
    instruction: supplied.instruction
      ? { value: supplied.instruction, provenance: "USER_SUPPLIED" }
      : null,
    goal,
    sourceDraft:
      draft === null
        ? null
        : {
            text: draft,
            confidence: request.analysis.draft.confidence,
            provenance: "OBSERVED_SCREENSHOT",
          },
    latestOtherMessage: latestOther
      ? {
          id: latestOther.id,
          order: latestOther.order,
          text: latestOther.text,
          textConfidence: latestOther.textConfidence,
          speakerConfidence: latestOther.speakerConfidence,
          provenance: "OBSERVED_SCREENSHOT",
        }
      : null,
    meaningToPreserve: selectedIntent
      ? { text: selectedIntent, provenance: "USER_SUPPLIED" }
      : explicitReplyGoal
        ? { text: explicitReplyGoal, provenance: "USER_SUPPLIED" }
        : draft !== null
          ? { text: draft, provenance: "OBSERVED_SCREENSHOT" }
          : null,
    language: request.analysis.language,
    visibleContact: {
      ...request.analysis.visibleContact,
      provenance: "OBSERVED_SCREENSHOT",
    },
    recipient: supplied.recipient
      ? { value: supplied.recipient, provenance: "USER_SUPPLIED" }
      : null,
    relationship: supplied.relationship
      ? { value: supplied.relationship, provenance: "USER_SUPPLIED" }
      : null,
    hardConstraints: supplied.hardConstraints.map((value) => ({
      value,
      provenance: "USER_SUPPLIED",
    })),
    stylisticPriorities: supplied.stylisticPriorities.map((value) => ({
      value,
      provenance: "USER_SUPPLIED",
    })),
    concerns: request.analysis.warnings.map((code) => ({
      code,
      provenance: "ANALYSIS_INFERENCE",
    })),
    unknowns,
  });
}
