import { z } from "zod";

import {
  AgentActionSchema,
  CoachingDecisionSchema,
  CoachingDecisionResultSchema,
  CoachingSelectionSchema,
} from "./coaching.js";
import { ProviderConfigurationSchema } from "./conversation-analysis.js";
import {
  SkillSelectionRequestSchema,
  SkillSelectionResultSchema,
  SkillPlanSchema,
} from "./agent-skill.js";
import {
  CommunicationPlanSchema,
  CommunicationGuidanceSchema,
  SkillContextSchema,
  SelectedSkillSchema,
} from "./skills.js";

export const LAB_RUN_CHANNEL = "development-lab:run";
export const LAB_DEVELOPMENT_ARGUMENT = "--ai-message-coach-development-lab";
export const LAB_CONFIGURATION_CHANNEL = "development-lab:configuration";
export const LabRequestSchema = z
  .object({
    draft: z.string().trim().max(10_000),
    incoming: z.string().trim().max(10_000),
    userContext: z.string().trim().max(10_000),
    language: z.enum(["en", "zh-Hans", "zh-Hant", "mixed", "other"]),
    selection: CoachingSelectionSchema.nullable().optional(),
  })
  .strict();

export const SkillCandidateDiagnosticSchema = z
  .object({
    id: z.string().max(128),
    version: SelectedSkillSchema.shape.version,
    rank: z.number().int().positive().nullable(),
    score: z.number().finite().nullable(),
    outcome: z.enum(["INELIGIBLE", "SELECTED", "CONFLICT", "TOP_K_CAP"]),
    reasons: z.array(z.string().max(300)).max(12),
  })
  .strict();
export const SkillRankingDiagnosticSchema = z
  .object({
    maxSkills: z.literal(4),
    candidates: z.array(SkillCandidateDiagnosticSchema).max(100),
  })
  .strict();

export const CoachingGuardRuleCodeSchema = z.enum([
  "POLICY_MISMATCH",
  "UNCERTAINTY_PRESERVATION",
  "REFUSAL_PRESERVATION",
  "NEGATIVE_COMMITMENT",
  "FACTUAL_ANCHOR",
  "STATUS_GROUNDING",
  "PRIOR_APPRECIATION",
  "STATUS_REPLY_GROUNDING",
  "UNSUPPORTED_INFORMATION_STATE",
  "UNSUPPORTED_COMMITMENT",
  "UNSUPPORTED_EMOTION",
  "BOUNDARY_TEMPORAL_WEAKENING",
  "BOUNDARY_TEMPORAL_STRENGTHENING",
]);
export const CoachingValidationInspectionSchema = z
  .object({
    stage: z.enum([
      "NOT_REACHED",
      "ADAPTER_FAILURE",
      "RESULT_SCHEMA_REJECTED",
      "GUARD_REJECTED",
      "PASSED",
    ]),
    guardRule: CoachingGuardRuleCodeSchema.nullable(),
    candidate: CoachingDecisionSchema.nullable(),
  })
  .strict();
export const ShadowStageInspectionSchema = z
  .object({
    request: SkillSelectionRequestSchema.nullable(),
    selection: SkillSelectionResultSchema,
    plan: SkillPlanSchema.nullable(),
  })
  .strict();
export const LabTraceSchema = z
  .object({
    inputSource: z.literal("MANUAL_SIMULATION"),
    fixedAction: AgentActionSchema,
    context: SkillContextSchema.nullable(),
    productionPlan: CommunicationPlanSchema.nullable(),
    ranking: SkillRankingDiagnosticSchema.nullable(),
    shadow: ShadowStageInspectionSchema.nullable(),
    composerGuidance: CommunicationGuidanceSchema.nullable(),
    validation: CoachingValidationInspectionSchema,
  })
  .strict();
export const LabResultSchema = z.discriminatedUnion("ok", [
  z
    .object({
      ok: z.literal(true),
      provider: ProviderConfigurationSchema,
      result: CoachingDecisionResultSchema,
      trace: LabTraceSchema,
    })
    .strict(),
  z
    .object({
      ok: z.literal(false),
      code: z.enum([
        "INVALID_REQUEST",
        "UNAVAILABLE",
        "UNSUPPORTED_ACTION",
        "COACHING_IN_PROGRESS",
        "LAB_FAILED",
      ]),
      action: AgentActionSchema.nullable(),
    })
    .strict(),
]);

export type LabRequest = z.infer<typeof LabRequestSchema>;
export type LabResult = z.infer<typeof LabResultSchema>;
export type LabTrace = z.infer<typeof LabTraceSchema>;
export type SkillRankingDiagnostic = z.infer<typeof SkillRankingDiagnosticSchema>;
export type CoachingGuardRuleCode = z.infer<typeof CoachingGuardRuleCodeSchema>;
export type CoachingValidationInspection = z.infer<typeof CoachingValidationInspectionSchema>;
export type ShadowStageInspection = z.infer<typeof ShadowStageInspectionSchema>;
