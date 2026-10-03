import { z } from "zod";

import { AgentActionSchema } from "./coaching.js";
import { ConfidenceSchema } from "./confidence.js";
import { SelectedSkillSchema, SkillContextSchema } from "./skills.js";

export const SkillEvidenceIdSchema = z.string().regex(/^E[1-9][0-9]{0,2}$/);
export const SkillEvidenceSourceSchema = z.enum([
  "USER_SUPPLIED",
  "OBSERVED_SCREENSHOT",
  "DETERMINISTIC_DERIVATION",
  "ANALYSIS_INFERENCE",
  "POLICY",
  "UNKNOWN",
]);
export const SkillEvidenceKindSchema = z.enum([
  "USER_DIRECTION",
  "SOURCE_DRAFT",
  "VISIBLE_MESSAGE",
  "LANGUAGE",
  "HARD_CONSTRAINT",
  "STYLE_PRIORITY",
  "ANALYSIS_WARNING",
  "UNKNOWN",
  "UNKNOWN_IDENTITY",
  "UNKNOWN_RELATIONSHIP",
  "UNKNOWN_GOAL",
]);

const EvidenceValueSchema = z.discriminatedUnion("format", [
  z.object({ format: z.literal("TEXT"), text: z.string().trim().min(1).max(240) }).strict(),
  z.object({ format: z.literal("CODE"), code: z.string().trim().min(1).max(80) }).strict(),
  z.object({ format: z.literal("UNKNOWN") }).strict(),
]);

export const SkillEvidenceSchema = z
  .object({
    id: SkillEvidenceIdSchema,
    kind: SkillEvidenceKindSchema,
    source: SkillEvidenceSourceSchema,
    sourceRef: z
      .string()
      .regex(/^[A-Za-z0-9:_-]+$/)
      .max(80)
      .optional(),
    value: EvidenceValueSchema,
    confidence: ConfidenceSchema.optional(),
  })
  .strict()
  .superRefine((evidence, context) => {
    const unknownKind = evidence.kind.startsWith("UNKNOWN");
    if (unknownKind !== (evidence.source === "UNKNOWN"))
      context.addIssue({ code: "custom", message: "Unknown evidence needs unknown provenance." });
    if (unknownKind !== (evidence.value.format === "UNKNOWN"))
      context.addIssue({ code: "custom", message: "Unknown evidence needs an unknown value." });
    if (unknownKind && evidence.confidence !== undefined)
      context.addIssue({ code: "custom", message: "Unknown evidence cannot claim confidence." });
    if (
      ["SOURCE_DRAFT", "VISIBLE_MESSAGE"].includes(evidence.kind) &&
      evidence.source !== "OBSERVED_SCREENSHOT"
    )
      context.addIssue({
        code: "custom",
        message: "Visible text must retain observed provenance.",
      });
  });

export const SkillTaskPurposeSchema = z.object({ kind: z.literal("PRIMARY_COACHING") }).strict();
export const SkillContextProjectionSchema = SkillContextSchema.omit({ action: true, intent: true });
export const ApprovedCatalogSnapshotIdSchema = z
  .string()
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,95}$/);

const EvidenceListSchema = z
  .array(SkillEvidenceSchema)
  .max(12)
  .superRefine((items, context) => {
    if (new Set(items.map((item) => item.id)).size !== items.length)
      context.addIssue({ code: "custom", message: "Evidence IDs must be unique." });
  });

export const SkillAssessmentRequestSchema = z
  .object({
    action: AgentActionSchema,
    taskPurpose: SkillTaskPurposeSchema,
    evidence: EvidenceListSchema,
    context: SkillContextProjectionSchema,
  })
  .strict();

export const CommunicationNeedSchema = z
  .object({
    signalId: z
      .string()
      .regex(/^[a-z][a-z0-9_]*$/)
      .max(64),
    evidenceRefs: z.array(SkillEvidenceIdSchema).min(1).max(4),
  })
  .strict();

export const SkillUncertaintyCodeSchema = z.enum([
  "INSUFFICIENT_EVIDENCE",
  "LOW_SOURCE_CONFIDENCE",
  "UNRESOLVED_CONTEXT",
]);
export const SkillFailureCodeSchema = z.enum([
  "INVALID_INPUT",
  "CATALOG_MISMATCH",
  "UNRESOLVED_SKILL",
  "ASSESSMENT_FAILED",
  "SELECTION_FAILED",
  "COMPILATION_FAILED",
]);

export const CommunicationAssessmentSchema = z
  .object({
    status: z.enum(["ASSESSED", "INSUFFICIENT_EVIDENCE", "FAILED", "UNASSESSED"]),
    needs: z.array(CommunicationNeedSchema).max(8),
    uncertaintyCodes: z.array(SkillUncertaintyCodeSchema).max(3),
    failureCode: SkillFailureCodeSchema.optional(),
  })
  .strict()
  .superRefine((assessment, context) => {
    if (assessment.status !== "ASSESSED" && assessment.needs.length > 0)
      context.addIssue({ code: "custom", message: "Only ASSESSED may contain needs." });
    if ((assessment.status === "FAILED") !== (assessment.failureCode !== undefined))
      context.addIssue({ code: "custom", message: "FAILED requires a failure code." });
    if (new Set(assessment.needs.map((need) => need.signalId)).size !== assessment.needs.length)
      context.addIssue({ code: "custom", message: "Communication signals must be unique." });
  });

export const SkillReferenceSchema = SelectedSkillSchema.pick({ id: true, version: true });
const SkillReferenceListSchema = z
  .array(SkillReferenceSchema)
  .max(4)
  .superRefine((references, context) => {
    if (new Set(references.map((reference) => reference.id)).size !== references.length)
      context.addIssue({ code: "custom", message: "Skill references must be unique." });
  });

export const SkillSelectionRequestSchema = z
  .object({
    action: AgentActionSchema,
    taskPurpose: SkillTaskPurposeSchema,
    assessment: CommunicationAssessmentSchema,
    evidence: EvidenceListSchema,
    context: SkillContextProjectionSchema,
    maxSkills: z.number().int().min(1).max(4),
    catalogSnapshotId: ApprovedCatalogSnapshotIdSchema,
  })
  .strict();

export const EvidenceBackedSelectionReasonSchema = z
  .object({
    skillId: SkillReferenceSchema.shape.id,
    evidenceRefs: z.array(SkillEvidenceIdSchema).min(1).max(4),
    code: z.enum(["NEED_MATCH", "CONTEXT_MATCH", "LANGUAGE_MATCH"]),
  })
  .strict();

export const SkillSelectionResultSchema = z
  .object({
    status: z.enum(["SELECTED", "NONE", "FAILED"]),
    selectedSkills: SkillReferenceListSchema,
    reasons: z.array(EvidenceBackedSelectionReasonSchema).max(4),
    uncertaintyCodes: z.array(SkillUncertaintyCodeSchema).max(3),
    failureCode: SkillFailureCodeSchema.optional(),
    catalogSnapshotId: ApprovedCatalogSnapshotIdSchema,
  })
  .strict()
  .superRefine((result, context) => {
    if ((result.status === "SELECTED") !== result.selectedSkills.length > 0)
      context.addIssue({ code: "custom", message: "SELECTED requires skill references." });
    if (result.status !== "SELECTED" && result.reasons.length > 0)
      context.addIssue({ code: "custom", message: "NONE/FAILED cannot contain reasons." });
    if ((result.status === "FAILED") !== (result.failureCode !== undefined))
      context.addIssue({ code: "custom", message: "FAILED requires a failure code." });
    const selected = new Set(result.selectedSkills.map((skill) => skill.id));
    const reasonIds = result.reasons.map((reason) => reason.skillId);
    if (
      reasonIds.length !== selected.size ||
      new Set(reasonIds).size !== selected.size ||
      reasonIds.some((id) => !selected.has(id))
    )
      context.addIssue({ code: "custom", message: "Each selected skill needs one reason." });
  });

export const SkillPlanCompilationRequestSchema = z
  .object({
    action: AgentActionSchema,
    selectedSkills: SkillReferenceListSchema,
    evidence: EvidenceListSchema,
    constraints: z
      .array(
        z
          .object({
            kind: z.enum(["HARD", "SOFT"]),
            evidenceRef: SkillEvidenceIdSchema,
          })
          .strict(),
      )
      .max(8),
    catalogSnapshotId: ApprovedCatalogSnapshotIdSchema,
  })
  .strict();

export const SkillPlanGuidanceItemSchema = z
  .object({
    text: z.string().trim().min(1).max(300),
    skillRefs: z.array(SkillReferenceSchema).min(1).max(4),
    evidenceRefs: z.array(SkillEvidenceIdSchema).min(1).max(4),
  })
  .strict();

export const SkillPlanSchema = z
  .object({
    status: z.enum(["COMPILED", "NONE", "FAILED"]),
    selectedSkills: SkillReferenceListSchema,
    principles: z.array(SkillPlanGuidanceItemSchema).max(12),
    avoid: z.array(SkillPlanGuidanceItemSchema).max(12),
    tradeoffs: z.array(SkillPlanGuidanceItemSchema).max(8),
    recommendations: z.array(SkillPlanGuidanceItemSchema).max(8),
    failureCode: SkillFailureCodeSchema.optional(),
    catalogSnapshotId: ApprovedCatalogSnapshotIdSchema,
  })
  .strict()
  .superRefine((plan, context) => {
    const guidance = [
      ...plan.principles,
      ...plan.avoid,
      ...plan.tradeoffs,
      ...plan.recommendations,
    ];
    if ((plan.status === "COMPILED") !== plan.selectedSkills.length > 0)
      context.addIssue({ code: "custom", message: "COMPILED requires skill references." });
    if (plan.status !== "COMPILED" && guidance.length > 0)
      context.addIssue({ code: "custom", message: "NONE/FAILED cannot contain guidance." });
    if ((plan.status === "FAILED") !== (plan.failureCode !== undefined))
      context.addIssue({ code: "custom", message: "FAILED requires a failure code." });
  });

export type SkillEvidence = z.infer<typeof SkillEvidenceSchema>;
export type SkillAssessmentRequest = z.infer<typeof SkillAssessmentRequestSchema>;
export type CommunicationAssessment = z.infer<typeof CommunicationAssessmentSchema>;
export type SkillReference = z.infer<typeof SkillReferenceSchema>;
export type SkillSelectionRequest = z.infer<typeof SkillSelectionRequestSchema>;
export type SkillSelectionResult = z.infer<typeof SkillSelectionResultSchema>;
export type SkillPlanCompilationRequest = z.infer<typeof SkillPlanCompilationRequestSchema>;
export type SkillPlan = z.infer<typeof SkillPlanSchema>;
