import {
  AgentActionSchema,
  SkillContextSchema,
  SkillDefinitionSchema,
} from "@ai-message-coach/contracts";
import { z } from "zod";

const unique = <T>(values: readonly T[]): boolean => new Set(values).size === values.length;
const text = z.string().trim().min(1).max(500);
const digest = z.string().regex(/^sha256:[a-f0-9]{64}$/u);
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u);
const skillId = SkillDefinitionSchema.shape.id;
const skillIds = z.array(skillId).max(24).refine(unique, "Skill IDs must be unique.");

export const SrsDefinitionKindSchema = z.enum(["ATOMIC", "PLAYBOOK", "LANGUAGE_MODIFIER"]);
export const SrsDisappearanceStageSchema = z.enum([
  "HARD_ELIGIBILITY",
  "RETRIEVAL_CUTOFF",
  "TOP_K_CUTOFF",
  "RERANK_CUTOFF",
  "SUPERVISOR",
  "FINAL_RESOLUTION",
  "RETAINED",
]);
export const SrsTraceReasonCodeSchema = z.enum([
  "STATUS_INACTIVE",
  "ACTION_INELIGIBLE",
  "LANGUAGE_INELIGIBLE",
  "CATALOG_ISOLATED",
  "MISSING_STRUCTURED_PREREQUISITE",
  "BELOW_RETRIEVAL_CUTOFF",
  "LEGACY_INTENT_ADMISSION_FAILED",
  "LEGACY_SITUATION_ADMISSION_FAILED",
  "INTENT_MATCH",
  "SITUATION_MATCH",
  "BELOW_TOP_K",
  "BELOW_RERANK_CUTOFF",
  "REQUIRED_CAPABILITY",
  "ACCEPTABLE_CAPABILITY",
  "NO_SUPPORTING_EVIDENCE",
  "REDUNDANT_WITH_SELECTED",
  "LANGUAGE_MATCH",
  "DELIVERY_RELEVANT",
  "MODIFIER_NOT_NEEDED",
  "CONFLICT",
  "MISSING_DEPENDENCY",
  "SELECTION_BUDGET",
  "RETAINED",
]);

const reasonCodes = z
  .array(SrsTraceReasonCodeSchema)
  .max(12)
  .refine(unique, "Reason codes must be unique.");
export const SrsMatchedFeatureReasonCodeSchema = z.enum(["INTENT_MATCH", "SITUATION_MATCH"]);
const matchedFeatureReasonCodes = z
  .array(SrsMatchedFeatureReasonCodeSchema)
  .max(2)
  .refine(unique, "Matched-feature reason codes must be unique.");
const eligibility = z
  .object({
    result: z.enum(["NOT_RUN", "PASSED", "FAILED"]),
    reasonCodes,
  })
  .strict();
const rankedStage = z
  .object({
    score: z.number().finite(),
    rank: z.number().int().positive(),
    matchedFeatureReasonCodes,
  })
  .strict();
const decisionStage = z
  .object({
    selected: z.boolean(),
    reasonCode: SrsTraceReasonCodeSchema,
  })
  .strict();
const resolutionStage = z
  .object({
    included: z.boolean(),
    reasonCode: SrsTraceReasonCodeSchema.nullable(),
  })
  .strict();

export const SrsCandidateTraceSchema = z
  .object({
    id: skillId,
    version: z.number().int().positive(),
    definitionType: SrsDefinitionKindSchema,
    catalog: z.enum(["PRODUCTION", "EVALUATION_ONLY"]),
    eligibility,
    retrieval: rankedStage.nullable(),
    rerank: rankedStage.nullable(),
    supervisor: decisionStage.nullable(),
    modifierSelection: decisionStage.nullable(),
    finalResolution: resolutionStage.nullable(),
    disappearedAt: SrsDisappearanceStageSchema.nullable(),
    disappearanceReasonCodes: reasonCodes,
  })
  .strict()
  .superRefine((trace, context) => {
    const report = (message: string, path: (string | number)[]) =>
      context.addIssue({ code: "custom", message, path });
    if (trace.definitionType === "LANGUAGE_MODIFIER") {
      if (trace.retrieval !== null || trace.rerank !== null || trace.supervisor !== null)
        report("Modifiers cannot participate in capability retrieval or supervision.", [
          "definitionType",
        ]);
    } else if (trace.modifierSelection !== null) {
      report("Capabilities cannot participate in modifier selection.", ["modifierSelection"]);
    }
    if (trace.disappearedAt === "RETAINED" && trace.finalResolution?.included !== true)
      report("RETAINED requires final inclusion.", ["disappearedAt"]);
    if (trace.disappearedAt === "HARD_ELIGIBILITY" && trace.eligibility.result !== "FAILED")
      report("HARD_ELIGIBILITY requires failed eligibility.", ["disappearedAt"]);
    if (trace.disappearedAt === "TOP_K_CUTOFF") {
      if (trace.rerank === null || !trace.disappearanceReasonCodes.includes("BELOW_TOP_K"))
        report("TOP_K_CUTOFF requires a ranked candidate and BELOW_TOP_K.", ["disappearedAt"]);
    }
    if (
      trace.disappearedAt === "RERANK_CUTOFF" &&
      (trace.rerank === null || !trace.disappearanceReasonCodes.includes("BELOW_RERANK_CUTOFF"))
    )
      report("RERANK_CUTOFF requires a reranked candidate and BELOW_RERANK_CUTOFF.", [
        "disappearedAt",
      ]);
    if (trace.disappearedAt === null && trace.disappearanceReasonCodes.length > 0)
      report("Retained or pending traces cannot have disappearance reasons.", [
        "disappearanceReasonCodes",
      ]);
    if (trace.disappearedAt === "SUPERVISOR" && trace.supervisor?.selected !== false)
      report("SUPERVISOR disappearance requires supervisor rejection.", ["disappearedAt"]);
    if (trace.disappearedAt === "FINAL_RESOLUTION" && trace.finalResolution?.included !== false)
      report("FINAL_RESOLUTION disappearance requires final exclusion.", ["disappearedAt"]);
  });

export const Srs2ShadowConfigSchema = z
  .object({
    mode: z.enum(["LEGACY_METADATA_GATE", "SIGNAL_ONLY"]),
    topK: z.number().int().positive(),
    catalogScope: z.enum(["PRODUCTION", "PRODUCTION_PLUS_EVALUATION"]),
  })
  .strict();

export const Srs2TopKEntrySchema = z
  .object({
    id: skillId,
    version: z.number().int().positive(),
    definitionType: z.enum(["ATOMIC", "PLAYBOOK"]),
    retrievalScore: z.number().finite().positive(),
    rank: z.number().int().positive(),
    matchedFeatureReasonCodes,
  })
  .strict();

export const Srs2ShadowResultSchema = z
  .object({
    config: Srs2ShadowConfigSchema,
    capabilityTopK: z.array(Srs2TopKEntrySchema),
    capabilityTraces: z.array(SrsCandidateTraceSchema),
    modifierEligibilityTraces: z.array(SrsCandidateTraceSchema),
    eligibleModifierIds: skillIds,
    poolCounts: z
      .object({
        hardEligibleCount: z.number().int().nonnegative(),
        positiveSignalCandidatePoolCount: z.number().int().nonnegative(),
        topKCount: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict()
  .superRefine((result, context) => {
    if (result.capabilityTopK.length !== result.poolCounts.topKCount)
      context.addIssue({
        code: "custom",
        message: "Top-K count must equal returned capabilities.",
      });
    if (
      result.poolCounts.topKCount !==
      Math.min(result.config.topK, result.poolCounts.positiveSignalCandidatePoolCount)
    )
      context.addIssue({ code: "custom", message: "Top-K count must be the bounded pool size." });
    if (
      result.capabilityTopK.some((entry, index) => entry.rank !== index + 1) ||
      result.capabilityTopK.some((entry) => entry.rank > result.config.topK)
    )
      context.addIssue({ code: "custom", message: "Top-K ranks must be ordered and bounded." });
    if (
      result.modifierEligibilityTraces.some((trace) => trace.definitionType !== "LANGUAGE_MODIFIER")
    )
      context.addIssue({ code: "custom", message: "Modifier traces must stay in their lane." });
    if (result.capabilityTraces.some((trace) => trace.definitionType === "LANGUAGE_MODIFIER"))
      context.addIssue({ code: "custom", message: "Capability traces must exclude modifiers." });
  });

export const Srs2PoolStatisticsSchema = z
  .object({
    scenarioCount: z.number().int().nonnegative(),
    min: z.number().nonnegative(),
    max: z.number().nonnegative(),
    mean: z.number().nonnegative(),
    p50: z.number().nonnegative(),
    p90: z.number().nonnegative(),
  })
  .strict();

export const Srs2RankObservationSchema = z
  .object({
    scenarioId: text,
    skillId,
    expectation: z.enum(["REQUIRED", "ACCEPTABLE"]),
    fullRank: z.number().int().positive().nullable(),
    disappearedAt: SrsDisappearanceStageSchema.nullable(),
    reasonCodes,
    outcome: z.enum(["FOUND", "ELIGIBILITY_FAILURE", "RETRIEVAL_FAILURE", "RANKING_FAILURE"]),
    downstreamSelectionDifference: z.boolean(),
  })
  .strict();

export const Srs2MetricsSchema = z
  .object({
    scenarioCount: z.number().int().nonnegative(),
    scenariosWithRequired: z.number().int().nonnegative(),
    requiredOccurrences: z.number().int().nonnegative(),
    recallAtK: z.number().min(0).max(1),
    requiredSkillCoverageAtK: z.number().min(0).max(1),
    allRequiredFoundAtK: z.number().min(0).max(1),
    strictNonePassRate: z.number().min(0).max(1),
    forbiddenInTopKRate: z.number().min(0).max(1),
    requiredRanks: z.array(Srs2RankObservationSchema),
    acceptableRanks: z.array(Srs2RankObservationSchema),
    poolStatistics: z
      .object({
        hardEligibleCount: Srs2PoolStatisticsSchema,
        positiveSignalCandidatePoolCount: Srs2PoolStatisticsSchema,
        topKCount: Srs2PoolStatisticsSchema,
      })
      .strict(),
  })
  .strict();

const labels = z
  .object({ required: skillIds, acceptable: skillIds, forbidden: skillIds })
  .strict()
  .superRefine((value, context) => {
    const combined = [...value.required, ...value.acceptable, ...value.forbidden];
    if (!unique(combined))
      context.addIssue({ code: "custom", message: "Expectation label sets cannot overlap." });
  });

export const SrsScenarioAnnotationSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u),
    scenarioFamily: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u),
    split: z.enum(["DEVELOPMENT", "HELD_OUT"]),
    source: z
      .object({
        path: text,
        fixtureId: text,
      })
      .strict(),
    catalog: z.enum(["PRODUCTION", "EVALUATION_ONLY"]),
    action: AgentActionSchema,
    assistanceMode: z.enum([
      "REWRITE_DRAFT",
      "SUGGEST_REPLY",
      "COMPLETE_DRAFT",
      "NON_WORDING_ACTION",
    ]),
    language: SkillContextSchema.shape.language,
    capabilities: labels,
    modifiers: labels,
    strictNone: z.boolean(),
    preservation: z
      .object({
        intent: z.literal(true),
        facts: z.literal(true),
        commitments: z.literal(true),
        uncertainty: z.literal(true),
      })
      .strict(),
    reviewerState: z.enum(["EXPOSED_DEVELOPMENT_EVIDENCE", "PENDING_HUMAN_REVIEW"]),
  })
  .strict()
  .superRefine((scenario, context) => {
    const wordingActions = new Set(["REWRITE_DRAFT", "SUGGEST_REPLY", "COMPLETE_DRAFT"]);
    if (
      (wordingActions.has(scenario.action) && scenario.assistanceMode !== scenario.action) ||
      (!wordingActions.has(scenario.action) && scenario.assistanceMode !== "NON_WORDING_ACTION")
    )
      context.addIssue({
        code: "custom",
        message: "Assistance mode must agree with the fixed AgentAction.",
        path: ["assistanceMode"],
      });
    if (scenario.strictNone) {
      const permitted = [
        ...scenario.capabilities.required,
        ...scenario.capabilities.acceptable,
        ...scenario.modifiers.required,
        ...scenario.modifiers.acceptable,
      ];
      if (permitted.length > 0)
        context.addIssue({
          code: "custom",
          message: "Strict NONE scenarios cannot require or accept definitions.",
          path: ["strictNone"],
        });
    }
  });

export type SrsDefinitionKind = z.infer<typeof SrsDefinitionKindSchema>;
export type SrsScenarioAnnotation = z.infer<typeof SrsScenarioAnnotationSchema>;
export type SrsCandidateTrace = z.infer<typeof SrsCandidateTraceSchema>;
export type Srs2ShadowConfig = z.infer<typeof Srs2ShadowConfigSchema>;
export type Srs2ShadowResult = z.infer<typeof Srs2ShadowResultSchema>;
export type Srs2Metrics = z.infer<typeof Srs2MetricsSchema>;

export function assertScenarioDefinitionKinds(
  scenario: SrsScenarioAnnotation,
  kinds: ReadonlyMap<string, SrsDefinitionKind>,
): void {
  for (const id of [
    ...scenario.capabilities.required,
    ...scenario.capabilities.acceptable,
    ...scenario.capabilities.forbidden,
  ]) {
    const kind = kinds.get(id);
    if (kind !== "ATOMIC" && kind !== "PLAYBOOK")
      throw new Error(`Capability label has non-capability kind: ${id}`);
  }
  for (const id of [
    ...scenario.modifiers.required,
    ...scenario.modifiers.acceptable,
    ...scenario.modifiers.forbidden,
  ]) {
    if (kinds.get(id) !== "LANGUAGE_MODIFIER")
      throw new Error(`Modifier label has non-modifier kind: ${id}`);
  }
}

export const Srs1BaselineSchema = z
  .object({
    schemaVersion: z.literal(1),
    capturedAt: z.literal("2026-09-24"),
    branch: z.literal("skills"),
    head: z.string().regex(/^[a-f0-9]{40}$/u),
    excludedSrs1OwnedPaths: z.array(text).min(1).refine(unique),
    workspace: z
      .object({ fileCount: z.number().int().positive(), contentMapDigest: digest })
      .strict(),
    production: z
      .object({
        definitionCount: z.literal(21),
        atomicCount: z.literal(14),
        modifierCount: z.literal(7),
        canonicalExampleCount: z.literal(210),
        registryDigest: digest,
        manifestRawSha256: rawSha256,
        generatedRegistryRawSha256: rawSha256,
        baselineApprovalsRawSha256: rawSha256,
      })
      .strict(),
    phase7: z
      .object({
        preMigrationPath: text,
        preMigrationRawSha256: rawSha256,
        frozenIntegrationPlanCount: z.literal(21),
        frozenDirectPlanCount: z.literal(132),
        frozenPlanCount: z.literal(153),
      })
      .strict(),
    phase8: z.record(text, rawSha256),
    heldOut: z.object({ status: z.literal("NOT_AUTHORED"), sealed: z.literal(false) }).strict(),
  })
  .strict();

export const Srs1DevelopmentInventorySchema = z
  .object({
    schemaVersion: z.literal(1),
    split: z.literal("DEVELOPMENT"),
    sources: z.array(
      z
        .object({
          id: z.enum(["PHASE4_REGRESSION", "APPROVED_CANONICAL", "PHASE8_CANDIDATE"]),
          path: text,
          caseCount: z.number().int().positive(),
          scenarioGroupCount: z.number().int().positive(),
          evidenceUse: z.enum([
            "PRODUCTION_PARITY",
            "EXPOSED_AUTHORING_BOUNDARY_EVIDENCE",
            "EXPOSED_CANDIDATE_DEVELOPMENT_EVIDENCE",
          ]),
        })
        .strict(),
    ),
    proposedSrs2SourceIds: z
      .array(z.enum(["PHASE4_REGRESSION", "APPROVED_CANONICAL", "PHASE8_CANDIDATE"]))
      .min(1)
      .refine(unique),
    sampleAnnotations: z.array(SrsScenarioAnnotationSchema).min(4),
    heldOut: z
      .object({
        status: z.literal("NOT_AUTHORED"),
        sealed: z.literal(false),
        groupingRule: text,
      })
      .strict(),
  })
  .strict();
