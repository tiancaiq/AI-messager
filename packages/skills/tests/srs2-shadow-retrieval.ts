import {
  SkillContextSchema,
  type SkillContext,
  type SkillDefinition,
} from "@ai-message-coach/contracts";
import { decideCoachingAction, deriveSkillContext } from "../../ai/src/index.js";
import {
  phase8CandidateDefinitions,
  phase8CandidateSelectionFixtures,
  skillSelectionEvaluationFixtures,
} from "../../test-fixtures/src/index.js";
import { contentDigest, loadAuthoringRegistry } from "../authoring/generator.js";
import {
  Srs2MetricsSchema,
  Srs2ShadowConfigSchema,
  Srs2ShadowResultSchema,
  SrsScenarioAnnotationSchema,
  assertScenarioDefinitionKinds,
  type Srs2Metrics,
  type Srs2ShadowConfig,
  type Srs2ShadowResult,
  type SrsCandidateTrace,
  type SrsDefinitionKind,
  type SrsScenarioAnnotation,
} from "./srs1-foundation.js";

export const SRS2_DEFAULT_TOP_K = 10;
export const SRS2_RETRIEVAL_MODES = ["LEGACY_METADATA_GATE", "SIGNAL_ONLY"] as const;
export const SRS2_EVALUATION_BINDINGS = {
  perspective_acknowledgement:
    "sha256:00744f749a3efffa23b91bbbe246b8f967557907618d1d22be081e107d643fa2",
  give_constructive_feedback:
    "sha256:b6edf39686b4d1b33688d1b8ca5d5faee2832e552204bfb6d087a0e00f8b32b2",
} as const;

export interface Srs2CatalogEntry {
  definition: SkillDefinition;
  definitionType: SrsDefinitionKind;
  catalog: "PRODUCTION" | "EVALUATION_ONLY";
  sourceDigest: string;
}

export interface Srs2RunnableScenario {
  annotation: SrsScenarioAnnotation;
  context: SkillContext;
  sourceKind: "PHASE4_REGRESSION" | "PHASE8_CANDIDATE" | "SRS25_DIAGNOSTIC";
}

export interface Srs2ScenarioObservation {
  scenario: Srs2RunnableScenario;
  result: Srs2ShadowResult;
  productionSelectedCapabilityIds?: readonly string[];
}

export interface Srs2CanonicalAudit {
  recordCount: number;
  exampleCount: number;
  pendingHumanReviewCount: number;
  invalidLabelCount: number;
  routingMetricScenarioCount: 0;
}

const nonWordingActions = new Set(["SUGGEST_ACTIONS", "ASK_CLARIFICATION", "NO_REPLY_NEEDED"]);
const candidateKinds = new Map<string, SrsDefinitionKind>([
  ["perspective_acknowledgement", "ATOMIC"],
  ["give_constructive_feedback", "ATOMIC"],
]);

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function intersects<T>(left: readonly T[], right: readonly T[]): boolean {
  return left.some((value) => right.includes(value));
}

function languageFamily(value: string | null): "en" | "zh" | null {
  const family = value?.split("-", 1)[0]?.toLowerCase();
  return family === "en" || family === "zh" ? family : null;
}

export function evaluatorEligibleLanguages(
  context: SkillContext,
): ReadonlySet<"universal" | "en" | "zh"> {
  const languages = new Set<"universal" | "en" | "zh">(["universal"]);
  const primary = languageFamily(context.language.primary);
  if (primary === null) return languages;
  languages.add(primary);
  if (context.language.codeSwitching) {
    const secondary = languageFamily(context.language.secondary);
    if (secondary !== null) languages.add(secondary);
  }
  return languages;
}

export async function buildSrs2Catalog(
  scope: Srs2ShadowConfig["catalogScope"],
): Promise<readonly Srs2CatalogEntry[]> {
  const { records } = await loadAuthoringRegistry();
  const production = records.map((record) => ({
    definition: record.definition,
    definitionType: record.kind,
    catalog: "PRODUCTION" as const,
    sourceDigest: contentDigest(record),
  }));
  if (scope === "PRODUCTION") return production;

  const evaluation = phase8CandidateDefinitions.map((definition) => {
    const expected = SRS2_EVALUATION_BINDINGS[definition.id];
    const actual = contentDigest(definition);
    if (actual !== expected) throw new Error(`Stale evaluation binding: ${definition.id}`);
    return {
      definition: { ...definition, status: "ACTIVE" as const },
      definitionType: "ATOMIC" as const,
      catalog: "EVALUATION_ONLY" as const,
      sourceDigest: actual,
    };
  });
  return [...production, ...evaluation];
}

function hardEligibilityReasons(
  entry: Srs2CatalogEntry,
  context: SkillContext,
  config: Srs2ShadowConfig,
): SrsCandidateTrace["eligibility"]["reasonCodes"] {
  const reasons: SrsCandidateTrace["eligibility"]["reasonCodes"] = [];
  const definition = entry.definition;
  if (definition.status !== "ACTIVE") reasons.push("STATUS_INACTIVE");
  if (
    entry.catalog === "EVALUATION_ONLY" &&
    (config.catalogScope !== "PRODUCTION_PLUS_EVALUATION" ||
      SRS2_EVALUATION_BINDINGS[definition.id as keyof typeof SRS2_EVALUATION_BINDINGS] !==
        entry.sourceDigest)
  )
    reasons.push("CATALOG_ISOLATED");
  if (nonWordingActions.has(context.action) || !definition.actions.includes(context.action))
    reasons.push("ACTION_INELIGIBLE");
  const languages = evaluatorEligibleLanguages(context);
  if (!definition.languages.some((language) => languages.has(language)))
    reasons.push("LANGUAGE_INELIGIBLE");
  if (definition.id === "zh.code_switching" && !context.language.codeSwitching)
    reasons.push("MISSING_STRUCTURED_PREREQUISITE");
  return unique(reasons);
}

function baseTrace(entry: Srs2CatalogEntry): Omit<SrsCandidateTrace, "eligibility"> {
  return {
    id: entry.definition.id,
    version: entry.definition.version,
    definitionType: entry.definitionType,
    catalog: entry.catalog,
    retrieval: null,
    rerank: null,
    supervisor: null,
    modifierSelection: null,
    finalResolution: null,
    disappearedAt: null,
    disappearanceReasonCodes: [],
  };
}

export function runSrs2ShadowRetrieval(
  rawContext: SkillContext,
  rawConfig: Srs2ShadowConfig,
  rawCatalog: readonly Srs2CatalogEntry[],
): Srs2ShadowResult {
  const config = Srs2ShadowConfigSchema.parse(rawConfig);
  const context = SkillContextSchema.parse(rawContext);
  const catalog = [...rawCatalog].sort((left, right) =>
    left.definition.id.localeCompare(right.definition.id),
  );
  const capabilityTraces = new Map<string, SrsCandidateTrace>();
  const modifierEligibilityTraces: SrsCandidateTrace[] = [];
  const ranked: Array<{
    entry: Srs2CatalogEntry;
    score: number;
    matchedFeatureReasonCodes: Array<"INTENT_MATCH" | "SITUATION_MATCH">;
  }> = [];
  let hardEligibleCount = 0;

  for (const entry of catalog) {
    const failures = hardEligibilityReasons(entry, context, config);
    const traceBase = baseTrace(entry);
    if (failures.length > 0) {
      const trace: SrsCandidateTrace = {
        ...traceBase,
        eligibility: { result: "FAILED", reasonCodes: failures },
        disappearedAt: "HARD_ELIGIBILITY",
        disappearanceReasonCodes: failures,
      };
      if (entry.definitionType === "LANGUAGE_MODIFIER") modifierEligibilityTraces.push(trace);
      else capabilityTraces.set(entry.definition.id, trace);
      continue;
    }

    if (entry.definitionType === "LANGUAGE_MODIFIER") {
      modifierEligibilityTraces.push({
        ...traceBase,
        eligibility: { result: "PASSED", reasonCodes: [] },
      });
      continue;
    }

    hardEligibleCount += 1;
    const intentMatch = intersects(entry.definition.intents, context.intentTags);
    const situationMatch = intersects(entry.definition.situations, context.situationTags);
    const matchedFeatureReasonCodes: Array<"INTENT_MATCH" | "SITUATION_MATCH"> = [];
    if (intentMatch) matchedFeatureReasonCodes.push("INTENT_MATCH");
    if (situationMatch) matchedFeatureReasonCodes.push("SITUATION_MATCH");
    const score = (intentMatch ? 12 : 0) + (situationMatch ? 10 : 0);
    const cutoffReasons: SrsCandidateTrace["disappearanceReasonCodes"] = [];
    if (
      config.mode === "LEGACY_METADATA_GATE" &&
      entry.definition.intents.length > 0 &&
      !intentMatch
    )
      cutoffReasons.push("LEGACY_INTENT_ADMISSION_FAILED");
    if (
      config.mode === "LEGACY_METADATA_GATE" &&
      entry.definition.situations.length > 0 &&
      !situationMatch
    )
      cutoffReasons.push("LEGACY_SITUATION_ADMISSION_FAILED");
    if (score === 0) cutoffReasons.push("NO_SUPPORTING_EVIDENCE");

    if (cutoffReasons.length > 0) {
      capabilityTraces.set(entry.definition.id, {
        ...traceBase,
        eligibility: { result: "PASSED", reasonCodes: [] },
        disappearedAt: "RETRIEVAL_CUTOFF",
        disappearanceReasonCodes: unique(cutoffReasons),
      });
      continue;
    }
    ranked.push({ entry, score, matchedFeatureReasonCodes });
  }

  ranked.sort(
    (left, right) =>
      right.score - left.score || left.entry.definition.id.localeCompare(right.entry.definition.id),
  );
  const capabilityTopK = ranked
    .slice(0, config.topK)
    .map(({ entry, score, matchedFeatureReasonCodes }, index) => ({
      id: entry.definition.id,
      version: entry.definition.version,
      definitionType: entry.definitionType as "ATOMIC" | "PLAYBOOK",
      retrievalScore: score,
      rank: index + 1,
      matchedFeatureReasonCodes,
    }));

  for (const [index, candidate] of ranked.entries()) {
    const rank = index + 1;
    const stage = {
      score: candidate.score,
      rank,
      matchedFeatureReasonCodes: candidate.matchedFeatureReasonCodes,
    };
    capabilityTraces.set(candidate.entry.definition.id, {
      ...baseTrace(candidate.entry),
      eligibility: { result: "PASSED", reasonCodes: [] },
      retrieval: stage,
      rerank: { ...stage },
      disappearedAt: rank > config.topK ? "TOP_K_CUTOFF" : null,
      disappearanceReasonCodes: rank > config.topK ? ["BELOW_TOP_K"] : [],
    });
  }

  return Srs2ShadowResultSchema.parse({
    config,
    capabilityTopK,
    capabilityTraces: [...capabilityTraces.values()].sort((left, right) =>
      left.id.localeCompare(right.id),
    ),
    modifierEligibilityTraces: modifierEligibilityTraces.sort((left, right) =>
      left.id.localeCompare(right.id),
    ),
    eligibleModifierIds: modifierEligibilityTraces
      .filter((trace) => trace.eligibility.result === "PASSED")
      .map(({ id }) => id),
    poolCounts: {
      hardEligibleCount,
      positiveSignalCandidatePoolCount: ranked.length,
      topKCount: capabilityTopK.length,
    },
  });
}

function assistanceMode(action: SkillContext["action"]): SrsScenarioAnnotation["assistanceMode"] {
  if (
    action === "SUGGEST_ACTIONS" ||
    action === "ASK_CLARIFICATION" ||
    action === "NO_REPLY_NEEDED"
  ) {
    return "NON_WORDING_ACTION";
  }

  return action;
}

function partitionLabels(
  ids: readonly string[],
  kinds: ReadonlyMap<string, SrsDefinitionKind>,
  expectedKind: "CAPABILITY" | "MODIFIER",
): string[] {
  return ids.filter((id) => {
    const kind = kinds.get(id);
    return expectedKind === "CAPABILITY"
      ? kind === "ATOMIC" || kind === "PLAYBOOK"
      : kind === "LANGUAGE_MODIFIER";
  });
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("_", "-")
    .replace(/[^a-z0-9-]+/gu, "-")
    .replace(/-+/gu, "-")
    .replace(/^-|-$/gu, "");
}

export async function loadSrs2DevelopmentEvidence(): Promise<{
  scenarios: readonly Srs2RunnableScenario[];
  kinds: ReadonlyMap<string, SrsDefinitionKind>;
  canonicalAudit: Srs2CanonicalAudit;
  productionCatalogDigest: string;
  evaluationOverlayDigest: string;
  scenarioSetDigest: string;
}> {
  const { records, registry } = await loadAuthoringRegistry();
  const kinds = new Map<string, SrsDefinitionKind>(
    records.map((record) => [record.definition.id, record.kind]),
  );
  for (const [id, kind] of candidateKinds) kinds.set(id, kind);
  const scenarios: Srs2RunnableScenario[] = [];

  for (const fixture of skillSelectionEvaluationFixtures) {
    const policy = decideCoachingAction(fixture.request);
    const context = deriveSkillContext(fixture.request, policy);
    if (policy.action !== fixture.expectedAction)
      throw new Error(`Phase 4 action drift: ${fixture.id}`);
    const capabilities = {
      required: partitionLabels(fixture.expectedSkills, kinds, "CAPABILITY"),
      acceptable: partitionLabels(fixture.acceptableSkills, kinds, "CAPABILITY"),
      forbidden: partitionLabels(fixture.forbiddenSkills, kinds, "CAPABILITY"),
    };
    const modifiers = {
      required: partitionLabels(fixture.expectedSkills, kinds, "MODIFIER"),
      acceptable: partitionLabels(fixture.acceptableSkills, kinds, "MODIFIER"),
      forbidden: partitionLabels(fixture.forbiddenSkills, kinds, "MODIFIER"),
    };
    const annotation = SrsScenarioAnnotationSchema.parse({
      id: slug(fixture.id),
      scenarioFamily: slug(fixture.id),
      split: "DEVELOPMENT",
      source: { path: "packages/test-fixtures/src/index.ts", fixtureId: fixture.id },
      catalog: "PRODUCTION",
      action: context.action,
      assistanceMode: assistanceMode(context.action),
      language: context.language,
      capabilities,
      modifiers,
      strictNone:
        capabilities.required.length === 0 &&
        capabilities.acceptable.length === 0 &&
        modifiers.required.length === 0 &&
        modifiers.acceptable.length === 0,
      preservation: { intent: true, facts: true, commitments: true, uncertainty: true },
      reviewerState: "EXPOSED_DEVELOPMENT_EVIDENCE",
    });
    assertScenarioDefinitionKinds(annotation, kinds);
    scenarios.push({ annotation, context, sourceKind: "PHASE4_REGRESSION" });
  }

  for (const fixture of phase8CandidateSelectionFixtures) {
    const capabilities = {
      required: partitionLabels(fixture.expectedSkills, kinds, "CAPABILITY"),
      acceptable: [],
      forbidden: partitionLabels(fixture.forbiddenSkills, kinds, "CAPABILITY"),
    };
    const modifiers = {
      required: partitionLabels(fixture.expectedSkills, kinds, "MODIFIER"),
      acceptable: [],
      forbidden: partitionLabels(fixture.forbiddenSkills, kinds, "MODIFIER"),
    };
    const family = fixture.id.replace(/-(?:rewrite_draft|suggest_reply)$/u, "");
    const annotation = SrsScenarioAnnotationSchema.parse({
      id: slug(`phase8-${fixture.id}`),
      scenarioFamily: slug(`phase8-${family}`),
      split: "DEVELOPMENT",
      source: {
        path: "packages/test-fixtures/src/phase8-candidate-experiment.ts",
        fixtureId: fixture.id,
      },
      catalog: "EVALUATION_ONLY",
      action: fixture.context.action,
      assistanceMode: assistanceMode(fixture.context.action),
      language: fixture.context.language,
      capabilities,
      modifiers,
      strictNone: fixture.category === "NONE",
      preservation: { intent: true, facts: true, commitments: true, uncertainty: true },
      reviewerState: "EXPOSED_DEVELOPMENT_EVIDENCE",
    });
    assertScenarioDefinitionKinds(annotation, kinds);
    scenarios.push({ annotation, context: fixture.context, sourceKind: "PHASE8_CANDIDATE" });
  }

  const knownIds = new Set(kinds.keys());
  let exampleCount = 0;
  let pendingHumanReviewCount = 0;
  let invalidLabelCount = 0;
  for (const record of records) {
    const examples = [...record.examples.selection, ...record.examples.application];
    exampleCount += examples.length;
    if (record.review.examples.state === "PENDING_HUMAN_REVIEW")
      pendingHumanReviewCount += examples.length;
    for (const example of examples)
      for (const id of [...example.expected, ...example.acceptable, ...example.forbidden])
        if (!knownIds.has(id)) invalidLabelCount += 1;
  }

  return {
    scenarios,
    kinds,
    canonicalAudit: {
      recordCount: records.length,
      exampleCount,
      pendingHumanReviewCount,
      invalidLabelCount,
      routingMetricScenarioCount: 0,
    },
    productionCatalogDigest: contentDigest(registry),
    evaluationOverlayDigest: contentDigest(phase8CandidateDefinitions),
    scenarioSetDigest: contentDigest(
      scenarios.map(({ annotation, context, sourceKind }) => ({ annotation, context, sourceKind })),
    ),
  };
}

function traceFor(result: Srs2ShadowResult, id: string): SrsCandidateTrace | undefined {
  return result.capabilityTraces.find((trace) => trace.id === id);
}

function rankObservation(
  observation: Srs2ScenarioObservation,
  skillId: string,
  expectation: "REQUIRED" | "ACCEPTABLE",
): Srs2Metrics["requiredRanks"][number] {
  const trace = traceFor(observation.result, skillId);
  const found = observation.result.capabilityTopK.some(({ id }) => id === skillId);
  const outcome = found
    ? "FOUND"
    : trace?.disappearedAt === "HARD_ELIGIBILITY" || trace === undefined
      ? "ELIGIBILITY_FAILURE"
      : trace.disappearedAt === "TOP_K_CUTOFF"
        ? "RANKING_FAILURE"
        : "RETRIEVAL_FAILURE";
  return {
    scenarioId: observation.scenario.annotation.id,
    skillId,
    expectation,
    fullRank: trace?.rerank?.rank ?? null,
    disappearedAt: trace?.disappearedAt ?? (trace === undefined ? "HARD_ELIGIBILITY" : null),
    reasonCodes: trace?.disappearanceReasonCodes ?? ["CATALOG_ISOLATED"],
    outcome,
    downstreamSelectionDifference:
      found &&
      observation.productionSelectedCapabilityIds !== undefined &&
      !observation.productionSelectedCapabilityIds.includes(skillId),
  };
}

export function calculatePoolStatistics(values: readonly number[]) {
  if (values.length === 0) return { scenarioCount: 0, min: 0, max: 0, mean: 0, p50: 0, p90: 0 };
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  const p50 =
    sorted.length % 2 === 1 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
  const p90 = sorted[Math.max(0, Math.ceil(sorted.length * 0.9) - 1)]!;
  return {
    scenarioCount: values.length,
    min: sorted[0]!,
    max: sorted.at(-1)!,
    mean: values.reduce((sum, value) => sum + value, 0) / values.length,
    p50,
    p90,
  };
}

export function calculateSrs2Metrics(
  observations: readonly Srs2ScenarioObservation[],
): Srs2Metrics {
  const requiredRanks = observations.flatMap((observation) =>
    observation.scenario.annotation.capabilities.required.map((id) =>
      rankObservation(observation, id, "REQUIRED"),
    ),
  );
  const acceptableRanks = observations.flatMap((observation) =>
    observation.scenario.annotation.capabilities.acceptable.map((id) =>
      rankObservation(observation, id, "ACCEPTABLE"),
    ),
  );
  const withRequired = observations.filter(
    ({ scenario }) => scenario.annotation.capabilities.required.length > 0,
  );
  const foundRequired = requiredRanks.filter(({ outcome }) => outcome === "FOUND").length;
  const macroCoverage = withRequired.map(({ scenario, result }) => {
    const topK = new Set(result.capabilityTopK.map(({ id }) => id));
    const required = scenario.annotation.capabilities.required;
    return required.filter((id) => topK.has(id)).length / required.length;
  });
  const strictNone = observations.filter(({ scenario }) => scenario.annotation.strictNone);
  const forbidden = observations.flatMap(({ scenario, result }) => {
    const topK = new Set(result.capabilityTopK.map(({ id }) => id));
    return scenario.annotation.capabilities.forbidden.map((id) => topK.has(id));
  });
  const metric = (numerator: number, denominator: number) =>
    denominator === 0 ? 0 : numerator / denominator;

  return Srs2MetricsSchema.parse({
    scenarioCount: observations.length,
    scenariosWithRequired: withRequired.length,
    requiredOccurrences: requiredRanks.length,
    recallAtK: metric(foundRequired, requiredRanks.length),
    requiredSkillCoverageAtK: metric(
      macroCoverage.reduce((sum, value) => sum + value, 0),
      macroCoverage.length,
    ),
    allRequiredFoundAtK: metric(
      macroCoverage.filter((value) => value === 1).length,
      macroCoverage.length,
    ),
    strictNonePassRate: metric(
      strictNone.filter(({ result }) => result.capabilityTopK.length === 0).length,
      strictNone.length,
    ),
    forbiddenInTopKRate: metric(forbidden.filter(Boolean).length, forbidden.length),
    requiredRanks,
    acceptableRanks,
    poolStatistics: {
      hardEligibleCount: calculatePoolStatistics(
        observations.map(({ result }) => result.poolCounts.hardEligibleCount),
      ),
      positiveSignalCandidatePoolCount: calculatePoolStatistics(
        observations.map(({ result }) => result.poolCounts.positiveSignalCandidatePoolCount),
      ),
      topKCount: calculatePoolStatistics(
        observations.map(({ result }) => result.poolCounts.topKCount),
      ),
    },
  });
}

export function diagnosticCounts(observations: readonly Srs2ScenarioObservation[]) {
  const count = (values: readonly string[]) =>
    Object.fromEntries(
      [...new Set(values)]
        .sort()
        .map((value) => [value, values.filter((item) => item === value).length]),
    );
  return {
    language: count(
      observations.map(
        ({ scenario }) => languageFamily(scenario.annotation.language.primary) ?? "other",
      ),
    ),
    action: count(observations.map(({ scenario }) => scenario.annotation.action)),
    scenarioFamily: count(observations.map(({ scenario }) => scenario.annotation.scenarioFamily)),
    catalog: count(observations.map(({ scenario }) => scenario.annotation.catalog)),
    assistanceMode: count(observations.map(({ scenario }) => scenario.annotation.assistanceMode)),
  };
}
