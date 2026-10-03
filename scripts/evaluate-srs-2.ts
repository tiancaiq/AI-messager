import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { format, resolveConfig } from "prettier";
import { createSkillEngine, initialSkillRegistry } from "../packages/skills/src/index.js";
import {
  SRS2_DEFAULT_TOP_K,
  SRS2_RETRIEVAL_MODES,
  buildSrs2Catalog,
  calculateSrs2Metrics,
  diagnosticCounts,
  loadSrs2DevelopmentEvidence,
  runSrs2ShadowRetrieval,
  type Srs2ScenarioObservation,
} from "../packages/skills/tests/srs2-shadow-retrieval.js";

const reportPath = resolve(
  import.meta.dirname,
  "../packages/skills/tests/fixtures/srs2/development-report.json",
);
const configuredTopK = SRS2_DEFAULT_TOP_K;
const kValues = [...new Set([5, 10, configuredTopK])].sort((left, right) => left - right);
const evidence = await loadSrs2DevelopmentEvidence();
const productionCatalog = await buildSrs2Catalog("PRODUCTION");
const evaluationCatalog = await buildSrs2Catalog("PRODUCTION_PLUS_EVALUATION");
const productionEngine = createSkillEngine(initialSkillRegistry);

function definitionKind(id: string) {
  return evidence.kinds.get(id);
}

function capabilityIds(ids: readonly string[]): string[] {
  return ids.filter((id) => {
    const kind = definitionKind(id);
    return kind === "ATOMIC" || kind === "PLAYBOOK";
  });
}

function modifierIds(ids: readonly string[]): string[] {
  return ids.filter((id) => definitionKind(id) === "LANGUAGE_MODIFIER");
}

const productionSelections = new Map<string, { capabilities: string[]; modifiers: string[] }>();
for (const scenario of evidence.scenarios) {
  if (scenario.sourceKind !== "PHASE4_REGRESSION") continue;
  const selected = productionEngine.select(scenario.context).selectedSkills.map(({ id }) => id);
  productionSelections.set(scenario.annotation.id, {
    capabilities: capabilityIds(selected),
    modifiers: modifierIds(selected),
  });
}

function languageCategory(primary: string | null): string {
  const family = primary?.split("-", 1)[0]?.toLowerCase();
  return family === "en" || family === "zh" ? family : "other";
}

function failureCounts(metrics: ReturnType<typeof calculateSrs2Metrics>) {
  return Object.fromEntries(
    ["FOUND", "ELIGIBILITY_FAILURE", "RETRIEVAL_FAILURE", "RANKING_FAILURE"].map((outcome) => [
      outcome,
      metrics.requiredRanks.filter((row) => row.outcome === outcome).length,
    ]),
  );
}

const runs = [];
for (const mode of SRS2_RETRIEVAL_MODES) {
  for (const topK of kValues) {
    const observations: Srs2ScenarioObservation[] = evidence.scenarios.map((scenario) => {
      const evaluation = scenario.annotation.catalog === "EVALUATION_ONLY";
      const result = runSrs2ShadowRetrieval(
        scenario.context,
        {
          mode,
          topK,
          catalogScope: evaluation ? "PRODUCTION_PLUS_EVALUATION" : "PRODUCTION",
        },
        evaluation ? evaluationCatalog : productionCatalog,
      );
      return {
        scenario,
        result,
        ...(productionSelections.has(scenario.annotation.id)
          ? {
              productionSelectedCapabilityIds: productionSelections.get(scenario.annotation.id)!
                .capabilities,
            }
          : {}),
      };
    });
    const metrics = calculateSrs2Metrics(observations);
    runs.push({
      mode,
      topK,
      metrics,
      requiredFailureCounts: failureCounts(metrics),
      diagnosticCounts: diagnosticCounts(observations),
      scenarios: observations.map(({ scenario, result, productionSelectedCapabilityIds }) => {
        const requiredRanks = metrics.requiredRanks.filter(
          ({ scenarioId }) => scenarioId === scenario.annotation.id,
        );
        const acceptableRanks = metrics.acceptableRanks.filter(
          ({ scenarioId }) => scenarioId === scenario.annotation.id,
        );
        const topKIds = result.capabilityTopK.map(({ id }) => id);
        const production = productionSelections.get(scenario.annotation.id);
        const downstreamDifferences = requiredRanks
          .filter(({ downstreamSelectionDifference }) => downstreamSelectionDifference)
          .map(({ skillId }) => skillId);
        return {
          id: scenario.annotation.id,
          sourceKind: scenario.sourceKind,
          scenarioFamily: scenario.annotation.scenarioFamily,
          action: scenario.annotation.action,
          assistanceMode: scenario.annotation.assistanceMode,
          languageCategory: languageCategory(scenario.annotation.language.primary),
          catalog: scenario.annotation.catalog,
          strictNone: scenario.annotation.strictNone,
          requiredCapabilityIds: scenario.annotation.capabilities.required,
          acceptableCapabilityIds: scenario.annotation.capabilities.acceptable,
          forbiddenCapabilityIds: scenario.annotation.capabilities.forbidden,
          capabilityTopK: result.capabilityTopK,
          eligibleModifierIds: result.eligibleModifierIds,
          poolCounts: result.poolCounts,
          requiredRanks,
          acceptableRanks,
          forbiddenCapabilitiesInTopK: scenario.annotation.capabilities.forbidden.filter((id) =>
            topKIds.includes(id),
          ),
          ...(production === undefined
            ? {}
            : {
                productionSelectedCapabilities: production.capabilities,
                productionSelectedModifiers: production.modifiers,
                productionRequiredMissesRecoveredByShadow:
                  scenario.annotation.capabilities.required.filter(
                    (id) => !production.capabilities.includes(id) && topKIds.includes(id),
                  ),
                shadowRetrievedRequiredNotSelectedByProduction: downstreamDifferences,
              }),
          fullRankedCapabilityCount: result.poolCounts.positiveSignalCandidatePoolCount,
          productionComparisonApplicable: productionSelectedCapabilityIds !== undefined,
        };
      }),
    });
  }
}

const report = {
  schemaVersion: 1,
  phase: "SRS-2",
  evidenceUse: "EXPOSED_DEVELOPMENT_DIAGNOSTIC_ONLY",
  configuredTopK,
  reportedKValues: kValues,
  retrievalModes: SRS2_RETRIEVAL_MODES,
  coarseDiagnosticScoring: { intentMatch: 12, situationMatch: 10 },
  rankingImprovementOwner: "SRS-3",
  catalogDigests: {
    production: evidence.productionCatalogDigest,
    evaluationOverlay: evidence.evaluationOverlayDigest,
    scenarioSet: evidence.scenarioSetDigest,
  },
  evidence: {
    runnableScenarioCount: evidence.scenarios.length,
    phase4ScenarioCount: evidence.scenarios.filter(
      ({ sourceKind }) => sourceKind === "PHASE4_REGRESSION",
    ).length,
    phase8ScenarioCount: evidence.scenarios.filter(
      ({ sourceKind }) => sourceKind === "PHASE8_CANDIDATE",
    ).length,
    canonicalAuthoring: evidence.canonicalAudit,
    heldOut: { status: "NOT_AUTHORED", sealed: false, read: false, scored: false },
  },
  productionBaseline: {
    definitionCount: initialSkillRegistry.length,
    frozenPlanCount: 153,
    phase4ScenarioCount: productionSelections.size,
  },
  runs,
};

await mkdir(dirname(reportPath), { recursive: true });
await writeFile(
  reportPath,
  await format(JSON.stringify(report), {
    ...(await resolveConfig(reportPath)),
    filepath: reportPath,
  }),
  "utf8",
);
for (const run of runs) {
  process.stdout.write(
    `${run.mode} K=${run.topK}: scenarios=${run.metrics.scenarioCount} recall=${run.metrics.recallAtK.toFixed(4)} coverage=${run.metrics.requiredSkillCoverageAtK.toFixed(4)} all_required=${run.metrics.allRequiredFoundAtK.toFixed(4)} strict_none=${run.metrics.strictNonePassRate.toFixed(4)} forbidden=${run.metrics.forbiddenInTopKRate.toFixed(4)} pool=${JSON.stringify(run.metrics.poolStatistics)} failures=${JSON.stringify(run.requiredFailureCounts)}\n`,
  );
}
process.stdout.write(
  `SRS-2 report: scenarios=${evidence.scenarios.length} phase4=${productionSelections.size} canonical=${evidence.canonicalAudit.exampleCount} pending=${evidence.canonicalAudit.pendingHumanReviewCount} output=${reportPath}\n`,
);
