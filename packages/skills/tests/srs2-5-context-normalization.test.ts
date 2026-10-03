import { readFile } from "node:fs/promises";
import {
  srs25RawScenarios,
  srs25ScenarioAnnotations,
  validateSrs25FixtureBoundary,
} from "../../test-fixtures/src/index.js";
import { describe, expect, it } from "vitest";
import {
  SRS25_K_VALUES,
  SRS25_MODES,
  SRS25_PROFILES,
  Srs25ComparisonSchema,
  aggregatePoolDelta,
  evaluateSrs25Development,
  normalizeSrs25RawScenario,
  retrievalDelta,
  summarizeRetrievalRun,
} from "./srs2-5-context-normalization.js";

describe("SRS-2.5 fixture and profile boundaries", () => {
  it("keeps T1-T18 raw inputs separate from disjoint signal and retrieval annotations", () => {
    expect(() => validateSrs25FixtureBoundary()).not.toThrow();
    expect(srs25RawScenarios).toHaveLength(18);
    expect(srs25ScenarioAnnotations).toHaveLength(18);
    expect(Object.keys(srs25RawScenarios[0]!)).not.toEqual(
      expect.arrayContaining(["required", "acceptable", "forbidden", "expectedRanks"]),
    );
  });

  it("normalizes byte-identically when evaluation labels are permuted or removed", () => {
    const before = srs25RawScenarios.map(normalizeSrs25RawScenario);
    const changedAnnotations = srs25ScenarioAnnotations.map((annotation) => ({
      ...annotation,
      retrieval: {
        required: [...annotation.retrieval.forbidden],
        acceptable: [],
        forbidden: [...annotation.retrieval.required],
        strictNone: !annotation.retrieval.strictNone,
      },
    }));
    expect(changedAnnotations).not.toEqual(srs25ScenarioAnnotations);
    expect(srs25RawScenarios.map(normalizeSrs25RawScenario)).toEqual(before);
  });

  it("rejects free-form rationale and unknown issue fields", async () => {
    const evaluation = await evaluateSrs25Development();
    const comparison = evaluation.comparisons[0]!;
    expect(
      Srs25ComparisonSchema.safeParse({ ...comparison, rationale: "hidden explanation" }).success,
    ).toBe(false);
    expect(
      Srs25ComparisonSchema.safeParse({
        ...comparison,
        currentIssues: [{ signalKind: "INTENT", tag: null, reasonCode: "FREE_TEXT" }],
      }).success,
    ).toBe(false);
  });
});

describe("SRS-2.5 context and retrieval effects", () => {
  it("reproduces the published CURRENT baseline and resolves all six priority context failures", async () => {
    const evaluation = await evaluateSrs25Development();
    expect(evaluation.profileIds).toEqual(SRS25_PROFILES);
    expect(evaluation.retrievalModes).toEqual(SRS25_MODES);
    expect(evaluation.reportedKValues).toEqual(SRS25_K_VALUES);
    expect(evaluation.contextMetrics).toMatchObject({
      current: {
        requiredIntentFound: 17,
        requiredIntentTotal: 24,
        requiredSituationFound: 13,
        requiredSituationTotal: 17,
        falseIntentSignals: 7,
        falseSituationSignals: 6,
        strictNonePasses: 1,
        strictNoneTotal: 2,
      },
      proposed: {
        requiredIntentFound: 24,
        requiredIntentTotal: 24,
        requiredSituationFound: 17,
        requiredSituationTotal: 17,
        falseIntentSignals: 0,
        falseSituationSignals: 0,
        strictNonePasses: 2,
        strictNoneTotal: 2,
      },
      newlyMissingRequiredSignals: 0,
      newlyFalseSignals: 0,
      priorityResolved: 6,
      priorityTotal: 6,
    });
  });

  it("recovers the five missing priority capabilities and repairs T17 strict NONE", async () => {
    const evaluation = await evaluateSrs25Development();
    const current = evaluation.retrievalRuns.find(
      ({ profile, mode, topK }) => profile === "CURRENT" && mode === "SIGNAL_ONLY" && topK === 10,
    )!;
    const proposed = evaluation.retrievalRuns.find(
      ({ profile, mode, topK }) =>
        profile === "SRS_2_5_PROPOSED" && mode === "SIGNAL_ONLY" && topK === 10,
    )!;
    const deltas = new Map(retrievalDelta(current, proposed).map((delta) => [delta.id, delta]));
    expect(deltas.get("T1")?.recoveredRequired).toEqual(["acknowledge_mistake"]);
    expect(deltas.get("T6")?.recoveredRequired).toEqual(["acknowledge_mistake"]);
    expect(deltas.get("T11")?.recoveredRequired).toEqual(["request"]);
    expect(deltas.get("T15")?.recoveredRequired).toEqual(["status_update"]);
    expect(deltas.get("T18")?.recoveredRequired).toEqual(["boundary_setting"]);
    expect(deltas.get("T17")).toMatchObject({ strictNoneBefore: false, strictNoneAfter: true });
    expect([...deltas.values()].flatMap(({ lostRequired }) => lostRequired)).toEqual([]);
    expect(
      [...deltas.values()].flatMap(({ newlyEnabledForbidden }) => newlyEnabledForbidden),
    ).toEqual([]);
  });

  it("uses selected request intent without manufacturing clarification situation evidence", async () => {
    const evaluation = await evaluateSrs25Development();
    const run = evaluation.retrievalRuns.find(
      ({ profile, mode, topK }) =>
        profile === "SRS_2_5_PROPOSED" && mode === "SIGNAL_ONLY" && topK === 10,
    )!;
    const t11 = run.observations.find(
      ({ scenario }) => scenario.annotation.source.fixtureId === "T11",
    )!;
    expect(t11.scenario.context.intentTags).toContain("make_request");
    expect(t11.scenario.context.intentTags).not.toContain("clarify");
    expect(t11.scenario.context.situationTags).not.toContain("request");
    expect(t11.result.capabilityTopK.map(({ id }) => id)).toContain("request");
    expect(t11.result.capabilityTopK.map(({ id }) => id)).not.toContain("clarification");
    expect(evaluation.findings.skillMetadataGaps).toEqual([
      {
        scenarioId: "T11",
        skillId: "request",
        mode: "LEGACY_METADATA_GATE",
        reasonCode: "SKILL_METADATA_GAP",
      },
    ]);
    expect(evaluation.findings.remainingNormalizationFailures).toEqual([]);
  });

  it("keeps code switching in the modifier lane and candidates in the explicit overlay", async () => {
    const evaluation = await evaluateSrs25Development();
    const run = evaluation.retrievalRuns.find(
      ({ profile, mode, topK }) =>
        profile === "SRS_2_5_PROPOSED" && mode === "SIGNAL_ONLY" && topK === 10,
    )!;
    const t15 = run.observations.find(
      ({ scenario }) => scenario.annotation.source.fixtureId === "T15",
    )!;
    expect(t15.result.eligibleModifierIds).toContain("zh.code_switching");
    expect(t15.result.capabilityTopK.map(({ id }) => id)).not.toContain("zh.code_switching");
    const t3 = run.observations.find(
      ({ scenario }) => scenario.annotation.source.fixtureId === "T3",
    )!;
    expect(t3.result.capabilityTopK.map(({ id }) => id)).toContain("give_constructive_feedback");
    expect(
      evaluation.comparisons
        .find(({ scenarioId }) => scenarioId === "T3")
        ?.proposedIssues.some(({ reasonCode }) => reasonCode === "SRS_3_RANKING_DISCRIMINATION"),
    ).toBe(true);
  });

  it("keeps the unchanged SRS-2 score, rank, Top-K, and cutoff contracts", async () => {
    const evaluation = await evaluateSrs25Development();
    for (const run of evaluation.retrievalRuns) {
      for (const { result } of run.observations) {
        for (const entry of result.capabilityTopK) {
          expect(entry.retrievalScore).toBeGreaterThan(0);
          expect([10, 12, 22]).toContain(entry.retrievalScore);
          expect(entry.rank).toBeLessThanOrEqual(run.topK);
        }
        expect(
          result.capabilityTraces.some(({ disappearedAt }) => disappearedAt === "RERANK_CUTOFF"),
        ).toBe(false);
      }
    }
  });

  it("is deterministic across repeated evaluation and reports bounded pool deltas", async () => {
    const first = await evaluateSrs25Development();
    const second = await evaluateSrs25Development();
    expect(second).toEqual(first);
    const deltas = aggregatePoolDelta(first.retrievalRuns);
    expect(deltas).toHaveLength(2);
    expect(
      deltas.every(({ current, proposed }) => current.scenarioCount === proposed.scenarioCount),
    ).toBe(true);
  });

  it("serializes content-free scenario summaries", async () => {
    const evaluation = await evaluateSrs25Development();
    const summaries = evaluation.retrievalRuns.map(summarizeRetrievalRun);
    const serialized = JSON.stringify({
      evidence: evaluation.evidence,
      comparisons: evaluation.comparisons,
      summaries,
    });
    expect(serialized).not.toMatch(
      /"(?:messages?|messageText|draft|selectedIntent|prompt|rationale|hiddenRationale|providerPayload)"\s*:/u,
    );
  });

  it("keeps the generated report content-free once present", async () => {
    const path = new URL("./fixtures/srs2-5/development-report.json", import.meta.url);
    try {
      const raw = await readFile(path, "utf8");
      expect(raw).not.toMatch(
        /"(?:messages?|messageText|draft|selectedIntent|prompt|rationale|hiddenRationale|providerPayload)"\s*:/u,
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  });
});
