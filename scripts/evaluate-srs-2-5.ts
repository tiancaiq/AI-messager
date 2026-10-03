import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { format, resolveConfig } from "prettier";
import {
  aggregatePoolDelta,
  evaluateSrs25Development,
  retrievalDelta,
  summarizeRetrievalRun,
} from "../packages/skills/tests/srs2-5-context-normalization.js";

const reportPath = resolve(
  import.meta.dirname,
  "../packages/skills/tests/fixtures/srs2-5/development-report.json",
);
const evaluation = await evaluateSrs25Development();
const runSummaries = evaluation.retrievalRuns.map(summarizeRetrievalRun);

function run(profile: "CURRENT" | "SRS_2_5_PROPOSED", mode: string, topK = 10) {
  return evaluation.retrievalRuns.find(
    (entry) => entry.profile === profile && entry.mode === mode && entry.topK === topK,
  )!;
}

function summary(profile: "CURRENT" | "SRS_2_5_PROPOSED", mode: string) {
  return runSummaries.find(
    (entry) => entry.profile === profile && entry.mode === mode && entry.topK === 10,
  )!;
}

const scenarioRows = evaluation.comparisons.map((comparison) => {
  const modes = evaluation.retrievalModes.map((mode) => {
    const currentSummary = summary("CURRENT", mode).scenarios.find(
      ({ id }) => id === comparison.scenarioId,
    )!;
    const proposedSummary = summary("SRS_2_5_PROPOSED", mode).scenarios.find(
      ({ id }) => id === comparison.scenarioId,
    )!;
    const delta = retrievalDelta(run("CURRENT", mode), run("SRS_2_5_PROPOSED", mode)).find(
      ({ id }) => id === comparison.scenarioId,
    )!;
    return { mode, current: currentSummary, proposed: proposedSummary, delta };
  });
  return {
    id: comparison.scenarioId,
    action: comparison.action,
    current: {
      intentTags: comparison.current.intentTags,
      situationTags: comparison.current.situationTags,
      signals: comparison.currentSignals,
      issues: comparison.currentIssues,
    },
    proposed: {
      intentTags: comparison.proposed.intentTags,
      situationTags: comparison.proposed.situationTags,
      signals: comparison.proposedSignals,
      issues: comparison.proposedIssues,
    },
    contextDelta: {
      addedIntentTags: comparison.addedIntentTags,
      removedIntentTags: comparison.removedIntentTags,
      addedSituationTags: comparison.addedSituationTags,
      removedSituationTags: comparison.removedSituationTags,
    },
    retrievalAt10: modes,
  };
});

function counts<T extends string>(values: readonly T[]): Record<string, number> {
  return Object.fromEntries(
    [...new Set(values)]
      .sort()
      .map((value) => [value, values.filter((item) => item === value).length]),
  );
}

const report = {
  schemaVersion: evaluation.schemaVersion,
  phase: evaluation.phase,
  evidenceUse: evaluation.evidenceUse,
  profileIds: evaluation.profileIds,
  retrievalModes: evaluation.retrievalModes,
  reportedKValues: evaluation.reportedKValues,
  unchangedRetrieval: {
    intentMatchScore: 12,
    situationMatchScore: 10,
    stableTieBreak: "SKILL_ID_ASCENDING",
    rerank: "IDENTITY",
    rankingImprovementOwner: "SRS-3",
  },
  digests: evaluation.digests,
  evidence: evaluation.evidence,
  contextMetrics: evaluation.contextMetrics,
  diagnostics: {
    issueCounts: {
      current: counts(
        evaluation.comparisons.flatMap(({ currentIssues }) =>
          currentIssues.map(({ reasonCode }) => reasonCode),
        ),
      ),
      proposed: counts(
        evaluation.comparisons.flatMap(({ proposedIssues }) =>
          proposedIssues.map(({ reasonCode }) => reasonCode),
        ),
      ),
    },
    evidenceSourceCounts: {
      current: counts(
        evaluation.comparisons.flatMap(({ currentSignals }) =>
          currentSignals.flatMap(({ sources }) => sources),
        ),
      ),
      proposed: counts(
        evaluation.comparisons.flatMap(({ proposedSignals }) =>
          proposedSignals.flatMap(({ sources }) => sources),
        ),
      ),
    },
    actionCounts: counts(evaluation.comparisons.map(({ action }) => action)),
    languageCounts: counts(
      evaluation.comparisons.map(({ current }) => {
        const family = current.language.primary?.split("-", 1)[0]?.toLowerCase();
        return family === "en" || family === "zh" ? family : "other";
      }),
    ),
  },
  findings: evaluation.findings,
  poolBreadth: aggregatePoolDelta(evaluation.retrievalRuns),
  retrievalRuns: runSummaries,
  scenarios: scenarioRows,
  productionBoundary: {
    activeDefinitionCount: 21,
    frozenPlanCount: 153,
    productionProfile: "CURRENT",
    proposedProfileProductionCallers: 0,
    candidatesActiveInProduction: 0,
    confirmationCatalogState: "NOT_IN_CATALOG",
  },
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

for (const entry of evaluation.retrievalRuns) {
  process.stdout.write(
    `${entry.profile} ${entry.mode} K=${entry.topK}: recall=${entry.metrics.recallAtK.toFixed(4)} coverage=${entry.metrics.requiredSkillCoverageAtK.toFixed(4)} all_required=${entry.metrics.allRequiredFoundAtK.toFixed(4)} strict_none=${entry.metrics.strictNonePassRate.toFixed(4)} forbidden=${entry.metrics.forbiddenInTopKRate.toFixed(4)} pool_mean=${entry.metrics.poolStatistics.positiveSignalCandidatePoolCount.mean.toFixed(4)}\n`,
  );
}
process.stdout.write(
  `SRS-2.5 context: required_intent=${evaluation.contextMetrics.current.requiredIntentFound}/${evaluation.contextMetrics.current.requiredIntentTotal}->${evaluation.contextMetrics.proposed.requiredIntentFound}/${evaluation.contextMetrics.proposed.requiredIntentTotal} required_situation=${evaluation.contextMetrics.current.requiredSituationFound}/${evaluation.contextMetrics.current.requiredSituationTotal}->${evaluation.contextMetrics.proposed.requiredSituationFound}/${evaluation.contextMetrics.proposed.requiredSituationTotal} false_intent=${evaluation.contextMetrics.current.falseIntentSignals}->${evaluation.contextMetrics.proposed.falseIntentSignals} false_situation=${evaluation.contextMetrics.current.falseSituationSignals}->${evaluation.contextMetrics.proposed.falseSituationSignals} priority=${evaluation.contextMetrics.priorityResolved}/${evaluation.contextMetrics.priorityTotal}\n`,
);
process.stdout.write(
  `SRS-2.5 report: scenarios=${evaluation.evidence.scenarioCount} canonical=${evaluation.evidence.canonicalAuthoringExampleCount} pending=${evaluation.evidence.pendingHumanReviewCount} metadata_gaps=${evaluation.findings.skillMetadataGaps.length} output=${reportPath}\n`,
);
