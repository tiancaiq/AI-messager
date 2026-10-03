import { createHash } from "node:crypto";
import {
  SkillContextSchema,
  SkillIntentTagSchema,
  SkillSituationTagSchema,
  type SkillContext,
} from "@ai-message-coach/contracts";
import {
  srs25RawScenarios,
  srs25ScenarioAnnotations,
  validateSrs25FixtureBoundary,
  type Srs25RawScenario,
  type Srs25ScenarioAnnotation,
} from "../../test-fixtures/src/index.js";
import { z } from "zod";
import {
  deriveSkillContextForProfile,
  type SkillContextNormalizationResult,
  type SkillContextSignalProfile,
} from "../../ai/src/skill-context-normalization.js";
import type { CoachingPolicyDecision } from "../../ai/src/coaching-policy.js";
import {
  Srs2ShadowResultSchema,
  SrsScenarioAnnotationSchema,
  type Srs2Metrics,
} from "./srs1-foundation.js";
import {
  buildSrs2Catalog,
  calculateSrs2Metrics,
  loadSrs2DevelopmentEvidence,
  runSrs2ShadowRetrieval,
  type Srs2CatalogEntry,
  type Srs2RunnableScenario,
  type Srs2ScenarioObservation,
} from "./srs2-shadow-retrieval.js";

export const SRS25_PROFILES = ["CURRENT", "SRS_2_5_PROPOSED"] as const;
export const SRS25_MODES = ["LEGACY_METADATA_GATE", "SIGNAL_ONLY"] as const;
export const SRS25_K_VALUES = [5, 10] as const;

export const Srs25NormalizationReasonSchema = z.enum([
  "MISSING_INTENT_SIGNAL",
  "MISSING_SITUATION_SIGNAL",
  "FALSE_INTENT_SIGNAL",
  "FALSE_SITUATION_SIGNAL",
  "OVER_BROAD_LEXICAL_TRIGGER",
  "DRAFT_EVIDENCE_IGNORED",
  "CONVERSATION_EVIDENCE_IGNORED",
  "SELECTED_INTENT_NOT_NORMALIZED",
  "AMBIGUOUS_CONTEXT",
  "UPSTREAM_ACTION_POLICY_ISSUE",
  "SKILL_METADATA_GAP",
  "SRS_3_RANKING_DISCRIMINATION",
]);

export const Srs25IssueSchema = z
  .object({
    signalKind: z.enum(["INTENT", "SITUATION", "ACTION", "METADATA", "RANKING"]),
    tag: z.union([SkillIntentTagSchema, SkillSituationTagSchema]).nullable(),
    reasonCode: Srs25NormalizationReasonSchema,
  })
  .strict();

export const Srs25ComparisonSchema = z
  .object({
    scenarioId: z.string().regex(/^T(?:[1-9]|1[0-8])$/u),
    action: SkillContextSchema.shape.action,
    current: SkillContextSchema,
    proposed: SkillContextSchema,
    currentSignals: z.array(
      z
        .object({
          kind: z.enum(["INTENT", "SITUATION"]),
          tag: z.union([SkillIntentTagSchema, SkillSituationTagSchema]),
          sources: z.array(
            z.enum([
              "OTHER_MESSAGE",
              "USER_DRAFT",
              "SELECTED_INTENT",
              "CONVERSATION_HISTORY",
              "STRUCTURED_CONTEXT",
            ]),
          ),
        })
        .strict(),
    ),
    proposedSignals: z.array(
      z
        .object({
          kind: z.enum(["INTENT", "SITUATION"]),
          tag: z.union([SkillIntentTagSchema, SkillSituationTagSchema]),
          sources: z.array(
            z.enum([
              "OTHER_MESSAGE",
              "USER_DRAFT",
              "SELECTED_INTENT",
              "CONVERSATION_HISTORY",
              "STRUCTURED_CONTEXT",
            ]),
          ),
        })
        .strict(),
    ),
    addedIntentTags: z.array(SkillIntentTagSchema),
    removedIntentTags: z.array(SkillIntentTagSchema),
    addedSituationTags: z.array(SkillSituationTagSchema),
    removedSituationTags: z.array(SkillSituationTagSchema),
    currentIssues: z.array(Srs25IssueSchema),
    proposedIssues: z.array(Srs25IssueSchema),
  })
  .strict();

const ProfileMetricsSchema = z
  .object({
    scenarioCount: z.number().int().positive(),
    requiredIntentFound: z.number().int().nonnegative(),
    requiredIntentTotal: z.number().int().nonnegative(),
    requiredSituationFound: z.number().int().nonnegative(),
    requiredSituationTotal: z.number().int().nonnegative(),
    forbiddenIntentEmitted: z.number().int().nonnegative(),
    forbiddenIntentTotal: z.number().int().nonnegative(),
    forbiddenSituationEmitted: z.number().int().nonnegative(),
    forbiddenSituationTotal: z.number().int().nonnegative(),
    missingRequiredSignalCases: z.number().int().nonnegative(),
    falseIntentSignals: z.number().int().nonnegative(),
    falseSituationSignals: z.number().int().nonnegative(),
    strictNonePasses: z.number().int().nonnegative(),
    strictNoneTotal: z.number().int().nonnegative(),
  })
  .strict();

export const Srs25ContextMetricsSchema = z
  .object({
    current: ProfileMetricsSchema,
    proposed: ProfileMetricsSchema,
    validIntentAdditions: z.number().int().nonnegative(),
    validSituationAdditions: z.number().int().nonnegative(),
    validIntentRemovals: z.number().int().nonnegative(),
    validSituationRemovals: z.number().int().nonnegative(),
    newlyMissingRequiredSignals: z.number().int().nonnegative(),
    newlyFalseSignals: z.number().int().nonnegative(),
    priorityResolved: z.number().int().nonnegative(),
    priorityTotal: z.literal(6),
  })
  .strict();

export interface Srs25NormalizedRawScenario {
  raw: Srs25RawScenario;
  current: SkillContextNormalizationResult;
  proposed: SkillContextNormalizationResult;
}

export interface Srs25RetrievalRun {
  profile: SkillContextSignalProfile;
  mode: (typeof SRS25_MODES)[number];
  topK: (typeof SRS25_K_VALUES)[number];
  metrics: Srs2Metrics;
  observations: Srs2ScenarioObservation[];
}

export interface Srs25DevelopmentEvaluation {
  schemaVersion: 1;
  phase: "SRS-2.5";
  evidenceUse: "EXPOSED_DEVELOPMENT_DIAGNOSTIC_ONLY";
  profileIds: typeof SRS25_PROFILES;
  retrievalModes: typeof SRS25_MODES;
  reportedKValues: typeof SRS25_K_VALUES;
  digests: {
    rawScenarioSet: string;
    annotationSet: string;
    productionCatalog: string;
    evaluationOverlay: string;
  };
  evidence: {
    scenarioCount: 18;
    priorityScenarioIds: readonly ["T1", "T6", "T11", "T15", "T17", "T18"];
    canonicalAuthoringExampleCount: number;
    pendingHumanReviewCount: number;
    routingMetricScenarioCount: 0;
    heldOut: { status: "NOT_AUTHORED"; read: false; scored: false };
  };
  contextMetrics: z.infer<typeof Srs25ContextMetricsSchema>;
  comparisons: z.infer<typeof Srs25ComparisonSchema>[];
  retrievalRuns: Srs25RetrievalRun[];
  findings: {
    remainingNormalizationFailures: Array<{
      scenarioId: string;
      reasonCode: z.infer<typeof Srs25NormalizationReasonSchema>;
    }>;
    skillMetadataGaps: Array<{
      scenarioId: string;
      skillId: string;
      mode: "LEGACY_METADATA_GATE";
      reasonCode: "SKILL_METADATA_GAP";
    }>;
    rankingDiscrimination: Array<{
      scenarioId: "T3" | "T4";
      reasonCode: "SRS_3_RANKING_DISCRIMINATION";
    }>;
  };
}

function digest(value: unknown): string {
  return `sha256:${createHash("sha256").update(JSON.stringify(value)).digest("hex")}`;
}

function fixedPolicy(scenario: Srs25RawScenario): CoachingPolicyDecision {
  const selected =
    scenario.request.selection?.kind === "ACTION"
      ? scenario.request.selection.intent
      : (scenario.request.selection?.answer ?? null);
  return {
    action: scenario.fixedAction,
    userIntent: {
      value:
        selected ??
        (scenario.request.analysis.draft.text
          ? "Improve the visible draft while preserving its meaning."
          : "Respond naturally to the latest visible message."),
      confidence: 1,
    },
    actionConfidence: 1,
    ambiguity: { material: false, reason: null },
  };
}

export function normalizeSrs25RawScenario(scenario: Srs25RawScenario): Srs25NormalizedRawScenario {
  const policy = fixedPolicy(scenario);
  const options = {
    experimentalCandidateRouting: scenario.catalogScope === "PRODUCTION_PLUS_EVALUATION",
  };
  return {
    raw: scenario,
    current: deriveSkillContextForProfile(scenario.request, policy, "CURRENT", options),
    proposed: deriveSkillContextForProfile(scenario.request, policy, "SRS_2_5_PROPOSED", options),
  };
}

function difference<T>(left: readonly T[], right: readonly T[]): T[] {
  return left.filter((value) => !right.includes(value));
}

function signalIssues(
  scenario: Srs25RawScenario,
  annotation: Srs25ScenarioAnnotation,
  result: SkillContextNormalizationResult,
): z.infer<typeof Srs25IssueSchema>[] {
  const issues: z.infer<typeof Srs25IssueSchema>[] = [];
  const { context } = result;
  for (const tag of annotation.normalization.requiredIntentTags)
    if (!context.intentTags.includes(tag))
      issues.push({ signalKind: "INTENT", tag, reasonCode: "MISSING_INTENT_SIGNAL" });
  for (const tag of annotation.normalization.requiredSituationTags)
    if (!context.situationTags.includes(tag))
      issues.push({ signalKind: "SITUATION", tag, reasonCode: "MISSING_SITUATION_SIGNAL" });
  for (const tag of annotation.normalization.forbiddenIntentTags)
    if (context.intentTags.includes(tag))
      issues.push({ signalKind: "INTENT", tag, reasonCode: "FALSE_INTENT_SIGNAL" });
  for (const tag of annotation.normalization.forbiddenSituationTags)
    if (context.situationTags.includes(tag))
      issues.push({ signalKind: "SITUATION", tag, reasonCode: "FALSE_SITUATION_SIGNAL" });
  if (
    issues.some(({ reasonCode }) => reasonCode.startsWith("MISSING")) &&
    scenario.request.analysis.draft.text
  )
    issues.push({ signalKind: "INTENT", tag: null, reasonCode: "DRAFT_EVIDENCE_IGNORED" });
  if (
    issues.some(({ reasonCode }) => reasonCode.startsWith("MISSING")) &&
    scenario.request.selection !== null
  )
    issues.push({
      signalKind: "INTENT",
      tag: null,
      reasonCode: "SELECTED_INTENT_NOT_NORMALIZED",
    });
  if (
    issues.some(({ reasonCode }) => reasonCode.startsWith("MISSING")) &&
    scenario.request.analysis.messages.length > 0
  )
    issues.push({
      signalKind: "SITUATION",
      tag: null,
      reasonCode: "CONVERSATION_EVIDENCE_IGNORED",
    });
  if (
    issues.some(({ reasonCode }) => reasonCode.startsWith("FALSE")) &&
    context.intentTags.includes("plan") &&
    context.situationTags.includes("planning")
  )
    issues.push({
      signalKind: "INTENT",
      tag: "plan",
      reasonCode: "OVER_BROAD_LEXICAL_TRIGGER",
    });
  if (context.action !== scenario.fixedAction)
    issues.push({ signalKind: "ACTION", tag: null, reasonCode: "UPSTREAM_ACTION_POLICY_ISSUE" });
  if (["T3", "T4"].includes(scenario.id))
    issues.push({
      signalKind: "RANKING",
      tag: null,
      reasonCode: "SRS_3_RANKING_DISCRIMINATION",
    });
  return issues.map((issue) => Srs25IssueSchema.parse(issue));
}

function compare(
  normalized: Srs25NormalizedRawScenario,
  annotation: Srs25ScenarioAnnotation,
): z.infer<typeof Srs25ComparisonSchema> {
  const value = {
    scenarioId: normalized.raw.id,
    action: normalized.raw.fixedAction,
    current: normalized.current.context,
    proposed: normalized.proposed.context,
    currentSignals: normalized.current.signals,
    proposedSignals: normalized.proposed.signals,
    addedIntentTags: difference(
      normalized.proposed.context.intentTags,
      normalized.current.context.intentTags,
    ),
    removedIntentTags: difference(
      normalized.current.context.intentTags,
      normalized.proposed.context.intentTags,
    ),
    addedSituationTags: difference(
      normalized.proposed.context.situationTags,
      normalized.current.context.situationTags,
    ),
    removedSituationTags: difference(
      normalized.current.context.situationTags,
      normalized.proposed.context.situationTags,
    ),
    currentIssues: signalIssues(normalized.raw, annotation, normalized.current),
    proposedIssues: signalIssues(normalized.raw, annotation, normalized.proposed),
  };
  return Srs25ComparisonSchema.parse(value);
}

function profileMetrics(
  comparisons: readonly z.infer<typeof Srs25ComparisonSchema>[],
  annotations: readonly Srs25ScenarioAnnotation[],
  profile: "current" | "proposed",
) {
  let requiredIntentFound = 0;
  let requiredIntentTotal = 0;
  let requiredSituationFound = 0;
  let requiredSituationTotal = 0;
  let forbiddenIntentEmitted = 0;
  let forbiddenIntentTotal = 0;
  let forbiddenSituationEmitted = 0;
  let forbiddenSituationTotal = 0;
  let missingRequiredSignalCases = 0;
  let falseIntentSignals = 0;
  let falseSituationSignals = 0;
  let strictNonePasses = 0;
  let strictNoneTotal = 0;
  for (const [index, comparison] of comparisons.entries()) {
    const annotation = annotations[index]!;
    const context = comparison[profile];
    const requiredIntents = annotation.normalization.requiredIntentTags;
    const requiredSituations = annotation.normalization.requiredSituationTags;
    const forbiddenIntents = annotation.normalization.forbiddenIntentTags;
    const forbiddenSituations = annotation.normalization.forbiddenSituationTags;
    requiredIntentFound += requiredIntents.filter((tag) => context.intentTags.includes(tag)).length;
    requiredIntentTotal += requiredIntents.length;
    requiredSituationFound += requiredSituations.filter((tag) =>
      context.situationTags.includes(tag),
    ).length;
    requiredSituationTotal += requiredSituations.length;
    const falseIntents = forbiddenIntents.filter((tag) => context.intentTags.includes(tag)).length;
    const falseSituations = forbiddenSituations.filter((tag) =>
      context.situationTags.includes(tag),
    ).length;
    forbiddenIntentEmitted += falseIntents;
    forbiddenIntentTotal += forbiddenIntents.length;
    forbiddenSituationEmitted += falseSituations;
    forbiddenSituationTotal += forbiddenSituations.length;
    falseIntentSignals += falseIntents;
    falseSituationSignals += falseSituations;
    if (
      requiredIntents.some((tag) => !context.intentTags.includes(tag)) ||
      requiredSituations.some((tag) => !context.situationTags.includes(tag))
    )
      missingRequiredSignalCases += 1;
    if (annotation.retrieval.strictNone) {
      strictNoneTotal += 1;
      if (context.intentTags.length === 0 && context.situationTags.length === 0)
        strictNonePasses += 1;
    }
  }
  return {
    scenarioCount: comparisons.length,
    requiredIntentFound,
    requiredIntentTotal,
    requiredSituationFound,
    requiredSituationTotal,
    forbiddenIntentEmitted,
    forbiddenIntentTotal,
    forbiddenSituationEmitted,
    forbiddenSituationTotal,
    missingRequiredSignalCases,
    falseIntentSignals,
    falseSituationSignals,
    strictNonePasses,
    strictNoneTotal,
  };
}

function contextMetrics(
  comparisons: readonly z.infer<typeof Srs25ComparisonSchema>[],
  annotations: readonly Srs25ScenarioAnnotation[],
) {
  const priority = new Set(["T1", "T6", "T11", "T15", "T17", "T18"]);
  const current = profileMetrics(comparisons, annotations, "current");
  const proposed = profileMetrics(comparisons, annotations, "proposed");
  const validIntentAdditions = comparisons.reduce((count, comparison, index) => {
    const expected = annotations[index]!.normalization;
    return (
      count +
      comparison.addedIntentTags.filter((tag) =>
        [...expected.requiredIntentTags, ...expected.allowedIntentTags].includes(tag),
      ).length
    );
  }, 0);
  const validSituationAdditions = comparisons.reduce((count, comparison, index) => {
    const expected = annotations[index]!.normalization;
    return (
      count +
      comparison.addedSituationTags.filter((tag) =>
        [...expected.requiredSituationTags, ...expected.allowedSituationTags].includes(tag),
      ).length
    );
  }, 0);
  const validIntentRemovals = comparisons.reduce(
    (count, comparison, index) =>
      count +
      comparison.removedIntentTags.filter((tag) =>
        annotations[index]!.normalization.forbiddenIntentTags.includes(tag),
      ).length,
    0,
  );
  const validSituationRemovals = comparisons.reduce(
    (count, comparison, index) =>
      count +
      comparison.removedSituationTags.filter((tag) =>
        annotations[index]!.normalization.forbiddenSituationTags.includes(tag),
      ).length,
    0,
  );
  const priorityResolved = comparisons.filter(
    (comparison) =>
      priority.has(comparison.scenarioId) &&
      comparison.proposedIssues.every(
        ({ reasonCode }) =>
          ![
            "MISSING_INTENT_SIGNAL",
            "MISSING_SITUATION_SIGNAL",
            "FALSE_INTENT_SIGNAL",
            "FALSE_SITUATION_SIGNAL",
          ].includes(reasonCode),
      ),
  ).length;
  return Srs25ContextMetricsSchema.parse({
    current,
    proposed,
    validIntentAdditions,
    validSituationAdditions,
    validIntentRemovals,
    validSituationRemovals,
    newlyMissingRequiredSignals: Math.max(
      0,
      proposed.missingRequiredSignalCases - current.missingRequiredSignalCases,
    ),
    newlyFalseSignals: Math.max(
      0,
      proposed.falseIntentSignals +
        proposed.falseSituationSignals -
        current.falseIntentSignals -
        current.falseSituationSignals,
    ),
    priorityResolved,
    priorityTotal: 6,
  });
}

function assistanceMode(
  action: SkillContext["action"],
): "REWRITE_DRAFT" | "SUGGEST_REPLY" | "COMPLETE_DRAFT" | "NON_WORDING_ACTION" {
  return action === "REWRITE_DRAFT" || action === "SUGGEST_REPLY" || action === "COMPLETE_DRAFT"
    ? action
    : "NON_WORDING_ACTION";
}

function runnable(
  raw: Srs25RawScenario,
  annotation: Srs25ScenarioAnnotation,
  context: SkillContext,
): Srs2RunnableScenario {
  return {
    sourceKind: "SRS25_DIAGNOSTIC",
    context,
    annotation: SrsScenarioAnnotationSchema.parse({
      id: `srs25-${raw.id.toLowerCase()}`,
      scenarioFamily: raw.scenarioFamily,
      split: "DEVELOPMENT",
      source: {
        path: "packages/test-fixtures/src/srs2-5-context-normalization.ts",
        fixtureId: raw.id,
      },
      catalog: raw.catalogScope === "PRODUCTION" ? "PRODUCTION" : "EVALUATION_ONLY",
      action: raw.fixedAction,
      assistanceMode: assistanceMode(raw.fixedAction),
      language: context.language,
      capabilities: {
        required: annotation.retrieval.required,
        acceptable: annotation.retrieval.acceptable,
        forbidden: annotation.retrieval.forbidden,
      },
      modifiers: {
        required: raw.id === "T15" ? ["zh.code_switching"] : [],
        acceptable: [],
        forbidden: [],
      },
      strictNone: annotation.retrieval.strictNone,
      preservation: { intent: true, facts: true, commitments: true, uncertainty: true },
      reviewerState: "EXPOSED_DEVELOPMENT_EVIDENCE",
    }),
  };
}

async function retrievalRuns(
  normalized: readonly Srs25NormalizedRawScenario[],
  annotations: readonly Srs25ScenarioAnnotation[],
): Promise<Srs25RetrievalRun[]> {
  const production = await buildSrs2Catalog("PRODUCTION");
  const evaluation = await buildSrs2Catalog("PRODUCTION_PLUS_EVALUATION");
  const runs: Srs25RetrievalRun[] = [];
  for (const profile of SRS25_PROFILES) {
    for (const mode of SRS25_MODES) {
      for (const topK of SRS25_K_VALUES) {
        const observations: Srs2ScenarioObservation[] = normalized.map((item, index) => {
          const annotation = annotations[index]!;
          const context = profile === "CURRENT" ? item.current.context : item.proposed.context;
          const scenario = runnable(item.raw, annotation, context);
          const catalog: readonly Srs2CatalogEntry[] =
            item.raw.catalogScope === "PRODUCTION" ? production : evaluation;
          const result = Srs2ShadowResultSchema.parse(
            runSrs2ShadowRetrieval(
              context,
              {
                mode,
                topK,
                catalogScope: item.raw.catalogScope,
              },
              catalog,
            ),
          );
          return { scenario, result };
        });
        runs.push({
          profile,
          mode,
          topK,
          observations,
          metrics: calculateSrs2Metrics(observations),
        });
      }
    }
  }
  return runs;
}

export function summarizeRetrievalRun(run: Srs25RetrievalRun) {
  return {
    profile: run.profile,
    mode: run.mode,
    topK: run.topK,
    metrics: run.metrics,
    scenarios: run.observations.map(({ scenario, result }) => ({
      id: scenario.annotation.source.fixtureId,
      action: scenario.annotation.action,
      intentTags: scenario.context.intentTags,
      situationTags: scenario.context.situationTags,
      positiveSignalCandidatePoolCount: result.poolCounts.positiveSignalCandidatePoolCount,
      poolCounts: result.poolCounts,
      topK: result.capabilityTopK,
      eligibleModifierIds: result.eligibleModifierIds,
      missingRequired: run.metrics.requiredRanks.filter(
        ({ scenarioId, outcome }) => scenarioId === scenario.annotation.id && outcome !== "FOUND",
      ),
      acceptableRanks: run.metrics.acceptableRanks.filter(
        ({ scenarioId }) => scenarioId === scenario.annotation.id,
      ),
      forbiddenInTopK: scenario.annotation.capabilities.forbidden.filter((id) =>
        result.capabilityTopK.some((entry) => entry.id === id),
      ),
      strictNonePass: !scenario.annotation.strictNone || result.capabilityTopK.length === 0,
    })),
  };
}

export function retrievalDelta(current: Srs25RetrievalRun, proposed: Srs25RetrievalRun) {
  if (current.mode !== proposed.mode || current.topK !== proposed.topK)
    throw new Error("SRS-2.5 retrieval deltas require matching mode and K.");
  return current.observations.map((currentObservation, index) => {
    const proposedObservation = proposed.observations[index]!;
    const expected = currentObservation.scenario.annotation.capabilities;
    const currentIds = currentObservation.result.capabilityTopK.map(({ id }) => id);
    const proposedIds = proposedObservation.result.capabilityTopK.map(({ id }) => id);
    return {
      id: currentObservation.scenario.annotation.source.fixtureId,
      recoveredRequired: expected.required.filter(
        (id) => !currentIds.includes(id) && proposedIds.includes(id),
      ),
      newlyEnabledAcceptable: expected.acceptable.filter(
        (id) => !currentIds.includes(id) && proposedIds.includes(id),
      ),
      newlyEnabledForbidden: expected.forbidden.filter(
        (id) => !currentIds.includes(id) && proposedIds.includes(id),
      ),
      lostRequired: expected.required.filter(
        (id) => currentIds.includes(id) && !proposedIds.includes(id),
      ),
      strictNoneBefore:
        !currentObservation.scenario.annotation.strictNone || currentIds.length === 0,
      strictNoneAfter:
        !proposedObservation.scenario.annotation.strictNone || proposedIds.length === 0,
      poolSizeDelta:
        proposedObservation.result.poolCounts.positiveSignalCandidatePoolCount -
        currentObservation.result.poolCounts.positiveSignalCandidatePoolCount,
    };
  });
}

export async function evaluateSrs25Development(): Promise<Srs25DevelopmentEvaluation> {
  validateSrs25FixtureBoundary();
  // Normalize the raw inputs before reading or joining any evaluation annotations.
  const normalized = srs25RawScenarios.map(normalizeSrs25RawScenario);
  const annotations = [...srs25ScenarioAnnotations];
  const comparisons = normalized.map((item, index) => compare(item, annotations[index]!));
  const runs = await retrievalRuns(normalized, annotations);
  const srs2Evidence = await loadSrs2DevelopmentEvidence();
  const proposedLegacy = runs.find(
    ({ profile, mode, topK }) =>
      profile === "SRS_2_5_PROPOSED" && mode === "LEGACY_METADATA_GATE" && topK === 10,
  )!;
  const proposedSignal = runs.find(
    ({ profile, mode, topK }) =>
      profile === "SRS_2_5_PROPOSED" && mode === "SIGNAL_ONLY" && topK === 10,
  )!;
  const skillMetadataGaps = proposedLegacy.metrics.requiredRanks
    .filter(({ outcome }) => outcome !== "FOUND")
    .filter(({ scenarioId, skillId }) =>
      proposedSignal.metrics.requiredRanks.some(
        (row) =>
          row.scenarioId === scenarioId && row.skillId === skillId && row.outcome === "FOUND",
      ),
    )
    .map(({ scenarioId, skillId }) => ({
      scenarioId: proposedLegacy.observations.find(
        ({ scenario }) => scenario.annotation.id === scenarioId,
      )!.scenario.annotation.source.fixtureId,
      skillId,
      mode: "LEGACY_METADATA_GATE" as const,
      reasonCode: "SKILL_METADATA_GAP" as const,
    }));
  return {
    schemaVersion: 1,
    phase: "SRS-2.5",
    evidenceUse: "EXPOSED_DEVELOPMENT_DIAGNOSTIC_ONLY",
    profileIds: SRS25_PROFILES,
    retrievalModes: SRS25_MODES,
    reportedKValues: SRS25_K_VALUES,
    digests: {
      rawScenarioSet: digest(srs25RawScenarios),
      annotationSet: digest(srs25ScenarioAnnotations),
      productionCatalog: srs2Evidence.productionCatalogDigest,
      evaluationOverlay: srs2Evidence.evaluationOverlayDigest,
    },
    evidence: {
      scenarioCount: 18,
      priorityScenarioIds: ["T1", "T6", "T11", "T15", "T17", "T18"],
      canonicalAuthoringExampleCount: srs2Evidence.canonicalAudit.exampleCount,
      pendingHumanReviewCount: srs2Evidence.canonicalAudit.pendingHumanReviewCount,
      routingMetricScenarioCount: 0,
      heldOut: { status: "NOT_AUTHORED", read: false, scored: false },
    },
    contextMetrics: contextMetrics(comparisons, annotations),
    comparisons,
    retrievalRuns: runs,
    findings: {
      remainingNormalizationFailures: comparisons.flatMap((comparison) =>
        comparison.proposedIssues
          .filter(({ reasonCode }) =>
            [
              "MISSING_INTENT_SIGNAL",
              "MISSING_SITUATION_SIGNAL",
              "FALSE_INTENT_SIGNAL",
              "FALSE_SITUATION_SIGNAL",
            ].includes(reasonCode),
          )
          .map(({ reasonCode }) => ({ scenarioId: comparison.scenarioId, reasonCode })),
      ),
      skillMetadataGaps,
      rankingDiscrimination: [
        { scenarioId: "T3", reasonCode: "SRS_3_RANKING_DISCRIMINATION" },
        { scenarioId: "T4", reasonCode: "SRS_3_RANKING_DISCRIMINATION" },
      ],
    },
  };
}

export function aggregatePoolDelta(runs: readonly Srs25RetrievalRun[]) {
  return SRS25_MODES.map((mode) => {
    const current = runs.find(
      (run) => run.profile === "CURRENT" && run.mode === mode && run.topK === 10,
    )!;
    const proposed = runs.find(
      (run) => run.profile === "SRS_2_5_PROPOSED" && run.mode === mode && run.topK === 10,
    )!;
    const deltas = current.observations.map(
      (observation, index) =>
        proposed.observations[index]!.result.poolCounts.positiveSignalCandidatePoolCount -
        observation.result.poolCounts.positiveSignalCandidatePoolCount,
    );
    return {
      mode,
      current: current.metrics.poolStatistics.positiveSignalCandidatePoolCount,
      proposed: proposed.metrics.poolStatistics.positiveSignalCandidatePoolCount,
      meanDelta: deltas.reduce((sum, value) => sum + value, 0) / deltas.length,
    };
  });
}
