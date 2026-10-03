import type { SkillContext, SkillDefinition } from "@ai-message-coach/contracts";
import { readFile } from "node:fs/promises";
import { createSkillEngine, initialSkillRegistry } from "../src/index.js";
import { describe, expect, it } from "vitest";
import {
  Srs2MetricsSchema,
  Srs2ShadowResultSchema,
  SrsCandidateTraceSchema,
  type Srs2ShadowResult,
  type SrsCandidateTrace,
} from "./srs1-foundation.js";
import {
  SRS2_DEFAULT_TOP_K,
  buildSrs2Catalog,
  calculatePoolStatistics,
  calculateSrs2Metrics,
  evaluatorEligibleLanguages,
  loadSrs2DevelopmentEvidence,
  runSrs2ShadowRetrieval,
  type Srs2CatalogEntry,
  type Srs2RunnableScenario,
  type Srs2ScenarioObservation,
} from "./srs2-shadow-retrieval.js";

const baseContext: SkillContext = {
  action: "SUGGEST_REPLY",
  intent: "Synthetic SRS-2 context.",
  situationTags: ["status_request"],
  intentTags: ["provide_status"],
  language: { primary: "en", secondary: null, codeSwitching: false },
  draftPresent: false,
  ambiguityMaterial: false,
};

function definition(id: string, overrides: Partial<SkillDefinition> = {}): SkillDefinition {
  return {
    id,
    name: id,
    description: "Synthetic private SRS-2 probe.",
    languages: ["universal"],
    situations: ["status_request"],
    intents: ["provide_status"],
    actions: ["SUGGEST_REPLY"],
    useWhen: ["Synthetic evaluator case."],
    doNotUseWhen: [],
    principles: ["Synthetic principle."],
    avoid: [],
    compatibleSkills: [],
    conflictingSkills: [],
    version: 1,
    status: "ACTIVE",
    ...overrides,
  };
}

function entry(
  id: string,
  overrides: Partial<SkillDefinition> = {},
  catalog: Srs2CatalogEntry["catalog"] = "PRODUCTION",
): Srs2CatalogEntry {
  return {
    definition: definition(id, overrides),
    definitionType: "ATOMIC",
    catalog,
    sourceDigest: `sha256:${"a".repeat(64)}`,
  };
}

const config = {
  mode: "LEGACY_METADATA_GATE" as const,
  topK: SRS2_DEFAULT_TOP_K,
  catalogScope: "PRODUCTION" as const,
};

describe("SRS-2 shadow catalog and hard eligibility", () => {
  it("keeps the default catalog production-only and binds the explicit evaluation overlay", async () => {
    const production = await buildSrs2Catalog("PRODUCTION");
    const overlay = await buildSrs2Catalog("PRODUCTION_PLUS_EVALUATION");
    expect(production).toHaveLength(21);
    expect(production.filter(({ definitionType }) => definitionType === "ATOMIC")).toHaveLength(14);
    expect(
      production.filter(({ definitionType }) => definitionType === "LANGUAGE_MODIFIER"),
    ).toHaveLength(7);
    expect(production.some(({ catalog }) => catalog === "EVALUATION_ONLY")).toBe(false);
    expect(overlay).toHaveLength(23);
    expect(
      overlay
        .filter(({ catalog }) => catalog === "EVALUATION_ONLY")
        .map(({ definition }) => definition.id),
    ).toEqual(["perspective_acknowledgement", "give_constructive_feedback"]);
    expect(overlay.some(({ definition }) => definition.id === "confirmation")).toBe(false);
  });

  it("records every independent hard gate and preserves their fixed ordering", () => {
    const probes: Array<[string, Srs2CatalogEntry, SkillContext, string]> = [
      ["status", entry("probe_status", { status: "INACTIVE" }), baseContext, "STATUS_INACTIVE"],
      ["catalog", entry("probe_catalog", {}, "EVALUATION_ONLY"), baseContext, "CATALOG_ISOLATED"],
      [
        "action",
        entry("probe_action", { actions: ["REWRITE_DRAFT"] }),
        baseContext,
        "ACTION_INELIGIBLE",
      ],
      [
        "language",
        entry("probe_language", { languages: ["zh"] }),
        baseContext,
        "LANGUAGE_INELIGIBLE",
      ],
      [
        "code-switch",
        entry("zh.code_switching", { languages: ["zh"] }),
        { ...baseContext, language: { primary: "zh-Hans", secondary: null, codeSwitching: false } },
        "MISSING_STRUCTURED_PREREQUISITE",
      ],
    ];
    for (const [name, catalogEntry, context, reason] of probes) {
      const result = runSrs2ShadowRetrieval(context, config, [catalogEntry]);
      const trace = result.capabilityTraces[0] ?? result.modifierEligibilityTraces[0];
      expect(trace?.eligibility.reasonCodes, name).toContain(reason);
      expect(trace?.disappearedAt, name).toBe("HARD_ELIGIBILITY");
    }

    const combined = entry(
      "probe_combined",
      { status: "INACTIVE", actions: ["REWRITE_DRAFT"], languages: ["zh"] },
      "EVALUATION_ONLY",
    );
    expect(
      runSrs2ShadowRetrieval(baseContext, config, [combined]).capabilityTraces[0]?.eligibility
        .reasonCodes,
    ).toEqual(["STATUS_INACTIVE", "CATALOG_ISOLATED", "ACTION_INELIGIBLE", "LANGUAGE_INELIGIBLE"]);
  });

  it("returns an empty capability pool for each non-wording action", () => {
    for (const action of ["SUGGEST_ACTIONS", "ASK_CLARIFICATION", "NO_REPLY_NEEDED"] as const) {
      const result = runSrs2ShadowRetrieval({ ...baseContext, action }, config, [
        entry("probe", { actions: [action] }),
      ]);
      expect(result.capabilityTopK, action).toEqual([]);
      expect(result.capabilityTraces[0]?.eligibility.reasonCodes, action).toContain(
        "ACTION_INELIGIBLE",
      );
    }
  });

  it("validates the raw SkillContext before eligibility runs", () => {
    expect(() =>
      runSrs2ShadowRetrieval(
        { ...baseContext, action: "SEND_DIRECTLY" } as unknown as SkillContext,
        config,
        [entry("probe")],
      ),
    ).toThrow();
  });

  it("uses the supported primary family and safe code-switching rule", () => {
    expect([...evaluatorEligibleLanguages(baseContext)]).toEqual(["universal", "en"]);
    expect([
      ...evaluatorEligibleLanguages({
        ...baseContext,
        language: { primary: "zh-Hans", secondary: null, codeSwitching: false },
      }),
    ]).toEqual(["universal", "zh"]);
    expect([
      ...evaluatorEligibleLanguages({
        ...baseContext,
        language: { primary: "zh-Hant", secondary: "en-US", codeSwitching: true },
      }),
    ]).toEqual(["universal", "zh", "en"]);
    expect([
      ...evaluatorEligibleLanguages({
        ...baseContext,
        language: { primary: "ko-KR", secondary: "en-US", codeSwitching: true },
      }),
    ]).toEqual(["universal"]);
  });

  it("keeps modifier eligibility separate from capability ranking", async () => {
    const catalog = await buildSrs2Catalog("PRODUCTION");
    const result = runSrs2ShadowRetrieval(baseContext, config, catalog);
    expect(result.capabilityTraces).toHaveLength(14);
    expect(result.modifierEligibilityTraces).toHaveLength(7);
    expect(result.capabilityTopK.some(({ id }) => result.eligibleModifierIds.includes(id))).toBe(
      false,
    );
    for (const trace of result.modifierEligibilityTraces) {
      expect(trace.retrieval).toBeNull();
      expect(trace.rerank).toBeNull();
    }
  });
});

describe("SRS-2 metadata admission, ranking, and Top-K", () => {
  it("distinguishes legacy two-dimension admission from signal-only partial matching", () => {
    const catalog = [entry("two_dimension")];
    const context = { ...baseContext, situationTags: [] as SkillContext["situationTags"] };
    const legacy = runSrs2ShadowRetrieval(context, config, catalog);
    const signal = runSrs2ShadowRetrieval(context, { ...config, mode: "SIGNAL_ONLY" }, catalog);
    expect(legacy.capabilityTopK).toEqual([]);
    expect(legacy.capabilityTraces[0]).toMatchObject({
      disappearedAt: "RETRIEVAL_CUTOFF",
      disappearanceReasonCodes: ["LEGACY_SITUATION_ADMISSION_FAILED"],
    });
    expect(signal.capabilityTopK[0]).toMatchObject({
      id: "two_dimension",
      retrievalScore: 12,
      matchedFeatureReasonCodes: ["INTENT_MATCH"],
    });
  });

  it("excludes zero-signal capabilities in both modes", () => {
    const context = { ...baseContext, intentTags: [], situationTags: [] } as SkillContext;
    for (const mode of ["LEGACY_METADATA_GATE", "SIGNAL_ONLY"] as const) {
      const result = runSrs2ShadowRetrieval(context, { ...config, mode }, [entry("zero")]);
      expect(result.capabilityTopK).toEqual([]);
      expect(result.capabilityTraces[0]).toMatchObject({
        disappearedAt: "RETRIEVAL_CUTOFF",
      });
      expect(result.capabilityTraces[0]?.disappearanceReasonCodes).toContain(
        "NO_SUPPORTING_EVIDENCE",
      );
    }
  });

  it("emits exact 12/10 scores, stable IDs, and input-order-independent ranks", () => {
    const catalog = [
      entry("zeta", { situations: [], intents: ["provide_status"] }),
      entry("alpha", { situations: [], intents: ["provide_status"] }),
      entry("both"),
      entry("situation", { intents: [], situations: ["status_request"] }),
    ];
    const first = runSrs2ShadowRetrieval(baseContext, config, catalog);
    const reversed = runSrs2ShadowRetrieval(baseContext, config, [...catalog].reverse());
    expect(first.capabilityTopK.map(({ id, retrievalScore }) => [id, retrievalScore])).toEqual([
      ["both", 22],
      ["alpha", 12],
      ["zeta", 12],
      ["situation", 10],
    ]);
    expect(reversed).toEqual(first);
    for (const trace of first.capabilityTraces.filter(({ retrieval }) => retrieval !== null))
      expect(trace.rerank).toEqual(trace.retrieval);
  });

  it("uses TOP_K_CUTOFF for ranks below K and never consumes RERANK_CUTOFF", () => {
    const catalog = Array.from({ length: 12 }, (_, index) =>
      entry(`probe_${String(index + 1).padStart(2, "0")}`),
    );
    for (const topK of [1, 5, 10, 20]) {
      const result = runSrs2ShadowRetrieval(baseContext, { ...config, topK }, catalog);
      expect(result.capabilityTopK).toHaveLength(Math.min(topK, catalog.length));
      expect(
        result.capabilityTraces.some(({ disappearedAt }) => disappearedAt === "RERANK_CUTOFF"),
      ).toBe(false);
      for (const trace of result.capabilityTraces) {
        if ((trace.rerank?.rank ?? 0) > topK)
          expect(trace).toMatchObject({
            disappearedAt: "TOP_K_CUTOFF",
            disappearanceReasonCodes: ["BELOW_TOP_K"],
          });
      }
    }
    expect(() => runSrs2ShadowRetrieval(baseContext, { ...config, topK: 0 }, catalog)).toThrow();
  });

  it("rejects impossible SRS-2 trace and result states", () => {
    const result = runSrs2ShadowRetrieval(baseContext, { ...config, topK: 1 }, [
      entry("alpha"),
      entry("beta"),
    ]);
    const below = result.capabilityTraces.find(({ id }) => id === "beta")!;
    expect(
      SrsCandidateTraceSchema.safeParse({ ...below, disappearedAt: "RERANK_CUTOFF" }).success,
    ).toBe(false);
    expect(
      SrsCandidateTraceSchema.safeParse({
        ...below,
        disappearedAt: "RERANK_CUTOFF",
        disappearanceReasonCodes: ["BELOW_RERANK_CUTOFF"],
      }).success,
    ).toBe(true);
    expect(
      SrsCandidateTraceSchema.safeParse({ ...below, hiddenRationale: "because" }).success,
    ).toBe(false);
    expect(
      Srs2ShadowResultSchema.safeParse({
        ...result,
        poolCounts: { ...result.poolCounts, topKCount: 2 },
      }).success,
    ).toBe(false);
  });
});

function syntheticScenario(
  id: string,
  required: string[],
  acceptable: string[],
  forbidden: string[],
  strictNone = false,
): Srs2RunnableScenario {
  return {
    sourceKind: "PHASE4_REGRESSION",
    context: baseContext,
    annotation: {
      id,
      scenarioFamily: id,
      split: "DEVELOPMENT",
      source: { path: "synthetic.ts", fixtureId: id },
      catalog: "PRODUCTION",
      action: "SUGGEST_REPLY",
      assistanceMode: "SUGGEST_REPLY",
      language: baseContext.language,
      capabilities: { required, acceptable, forbidden },
      modifiers: { required: [], acceptable: [], forbidden: [] },
      strictNone,
      preservation: { intent: true, facts: true, commitments: true, uncertainty: true },
      reviewerState: "EXPOSED_DEVELOPMENT_EVIDENCE",
    },
  };
}

function metricResult(
  topKIds: string[],
  rankedIds: string[],
  counts: [number, number, number],
): Srs2ShadowResult {
  const traces: SrsCandidateTrace[] = rankedIds.map((id, index) => ({
    id,
    version: 1,
    definitionType: "ATOMIC" as const,
    catalog: "PRODUCTION" as const,
    eligibility: { result: "PASSED" as const, reasonCodes: [] },
    retrieval: { score: 12, rank: index + 1, matchedFeatureReasonCodes: ["INTENT_MATCH" as const] },
    rerank: { score: 12, rank: index + 1, matchedFeatureReasonCodes: ["INTENT_MATCH" as const] },
    supervisor: null,
    modifierSelection: null,
    finalResolution: null,
    disappearedAt: topKIds.includes(id) ? null : ("TOP_K_CUTOFF" as const),
    disappearanceReasonCodes: topKIds.includes(id) ? [] : ["BELOW_TOP_K"],
  }));
  return {
    config,
    capabilityTopK: topKIds.map((id) => {
      const trace = traces.find((item) => item.id === id)!;
      return {
        id,
        version: 1,
        definitionType: "ATOMIC",
        retrievalScore: 12,
        rank: trace.retrieval!.rank,
        matchedFeatureReasonCodes: ["INTENT_MATCH"],
      };
    }),
    capabilityTraces: traces,
    modifierEligibilityTraces: [],
    eligibleModifierIds: [],
    poolCounts: {
      hardEligibleCount: counts[0],
      positiveSignalCandidatePoolCount: counts[1],
      topKCount: counts[2],
    },
  };
}

describe("SRS-2 metrics and exposed development boundary", () => {
  it("computes the preregistered formulas and keeps acceptable ranks diagnostic", () => {
    const observations: Srs2ScenarioObservation[] = [
      {
        scenario: syntheticScenario("one", ["alpha", "beta"], ["gamma"], ["delta"]),
        result: metricResult(["alpha", "gamma"], ["alpha", "gamma", "beta", "delta"], [4, 4, 2]),
        productionSelectedCapabilityIds: ["alpha"],
      },
      {
        scenario: syntheticScenario("two", ["beta"], [], []),
        result: metricResult(["beta"], ["beta"], [1, 1, 1]),
        productionSelectedCapabilityIds: [],
      },
      {
        scenario: syntheticScenario("none", [], [], [], true),
        result: metricResult([], [], [0, 0, 0]),
        productionSelectedCapabilityIds: [],
      },
    ];
    const metrics = calculateSrs2Metrics(observations);
    expect(metrics).toMatchObject({
      scenarioCount: 3,
      scenariosWithRequired: 2,
      requiredOccurrences: 3,
      recallAtK: 2 / 3,
      requiredSkillCoverageAtK: 0.75,
      allRequiredFoundAtK: 0.5,
      strictNonePassRate: 1,
      forbiddenInTopKRate: 0,
    });
    expect(metrics.requiredRanks).toHaveLength(3);
    expect(metrics.acceptableRanks).toHaveLength(1);
    expect(
      metrics.requiredRanks.find(
        ({ scenarioId, skillId }) => scenarioId === "two" && skillId === "beta",
      ),
    ).toMatchObject({ outcome: "FOUND", downstreamSelectionDifference: true });
    expect(Srs2MetricsSchema.parse(metrics)).toEqual(metrics);
  });

  it("computes exact pool min/max/mean/p50/p90 statistics", () => {
    expect(calculatePoolStatistics([0, 1, 2, 3])).toEqual({
      scenarioCount: 4,
      min: 0,
      max: 3,
      mean: 1.5,
      p50: 1.5,
      p90: 3,
    });
  });

  it("loads exactly 53 exposed runnable cases and audits all 210 pending examples without routing them", async () => {
    const evidence = await loadSrs2DevelopmentEvidence();
    expect(evidence.scenarios).toHaveLength(53);
    expect(
      evidence.scenarios.filter(({ sourceKind }) => sourceKind === "PHASE4_REGRESSION"),
    ).toHaveLength(21);
    expect(
      evidence.scenarios.filter(({ sourceKind }) => sourceKind === "PHASE8_CANDIDATE"),
    ).toHaveLength(32);
    expect(evidence.canonicalAudit).toEqual({
      recordCount: 21,
      exampleCount: 210,
      pendingHumanReviewCount: 210,
      invalidLabelCount: 0,
      routingMetricScenarioCount: 0,
    });
  });

  it("retrieves evaluation candidates only in the explicit overlay", async () => {
    const evidence = await loadSrs2DevelopmentEvidence();
    const scenario = evidence.scenarios.find(
      ({ annotation }) =>
        annotation.source.fixtureId === "perspective_acknowledgement-positive-1-rewrite_draft",
    )!;
    const production = await buildSrs2Catalog("PRODUCTION");
    const overlay = await buildSrs2Catalog("PRODUCTION_PLUS_EVALUATION");
    const defaultResult = runSrs2ShadowRetrieval(scenario.context, config, production);
    const overlayResult = runSrs2ShadowRetrieval(
      scenario.context,
      { ...config, catalogScope: "PRODUCTION_PLUS_EVALUATION" },
      overlay,
    );
    expect(
      defaultResult.capabilityTraces.some(({ id }) => id === "perspective_acknowledgement"),
    ).toBe(false);
    expect(overlayResult.capabilityTopK.map(({ id }) => id)).toContain(
      "perspective_acknowledgement",
    );
  });

  it("leaves the unchanged production selector at 21 definitions", () => {
    const engine = createSkillEngine(initialSkillRegistry);
    expect(engine.registry).toHaveLength(21);
    expect(initialSkillRegistry.some(({ id }) => id === "perspective_acknowledgement")).toBe(false);
  });

  it("keeps the generated development report content-free and preserves the evidence boundary", async () => {
    const rawReport = await readFile(
      new URL("./fixtures/srs2/development-report.json", import.meta.url),
      "utf8",
    );
    expect(rawReport).not.toMatch(
      /"(?:messages?|messageText|draft|rationale|hiddenRationale|prompt|providerPayload)"\s*:/u,
    );
    const report = JSON.parse(rawReport) as {
      evidence: {
        runnableScenarioCount: number;
        canonicalAuthoring: {
          exampleCount: number;
          pendingHumanReviewCount: number;
          routingMetricScenarioCount: number;
        };
        heldOut: { status: string; read: boolean; scored: boolean };
      };
      runs: Array<{ mode: string; topK: number }>;
    };
    expect(report.evidence).toMatchObject({
      runnableScenarioCount: 53,
      canonicalAuthoring: {
        exampleCount: 210,
        pendingHumanReviewCount: 210,
        routingMetricScenarioCount: 0,
      },
      heldOut: { status: "NOT_AUTHORED", read: false, scored: false },
    });
    expect(report.runs.map(({ mode, topK }) => [mode, topK])).toEqual([
      ["LEGACY_METADATA_GATE", 5],
      ["LEGACY_METADATA_GATE", 10],
      ["SIGNAL_ONLY", 5],
      ["SIGNAL_ONLY", 10],
    ]);
  });
});
