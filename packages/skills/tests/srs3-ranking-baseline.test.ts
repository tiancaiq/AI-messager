import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { packageRoot } from "../authoring/generator.js";
import { buildSrs2Catalog, runSrs2ShadowRetrieval } from "./srs2-shadow-retrieval.js";
import { loadSrs3Corpus, observeSrs3RawOnly } from "./srs3-ranking-corpus.js";
import {
  SRS3B_FREEZE_SHA256,
  assertSrs3bArtifactDigest,
  assertSrs3bFreezeBytes,
  bestPrimaryRank,
  calculateSrs3BaselineMetrics,
  evaluateSrs3Baseline,
  passesStrictNone,
  verifySrs3bFreeze,
  type Srs3BaselineScenario,
} from "./srs3-ranking-baseline.js";

const root = resolve(packageRoot, "../..");
const fixturePath = resolve(root, "packages/skills/tests/fixtures/srs3/baseline-report.json");

describe("SRS-3C frozen shadow-ordering baseline", () => {
  it("refuses a changed freeze and verifies exact bound revisions and denominators", async () => {
    const freezeBytes = await readFile(
      resolve(root, "packages/skills/tests/fixtures/srs3/srs3b-english-freeze.json"),
    );
    expect(createHash("sha256").update(freezeBytes).digest("hex")).toBe(SRS3B_FREEZE_SHA256);
    expect(() => assertSrs3bFreezeBytes(Buffer.concat([freezeBytes, Buffer.from(" ")]))).toThrow(
      /freeze-file drift/u,
    );
    const freeze = assertSrs3bFreezeBytes(freezeBytes);
    for (const [key, path] of Object.entries({
      rawSourceSha256: "packages/test-fixtures/src/srs3-ranking-development.ts",
      annotationsSha256: "packages/skills/tests/fixtures/srs3/development-annotations.json",
      authoringMetadataSha256: "packages/skills/tests/fixtures/srs3/authoring-metadata.json",
      sourceTriageSha256: "packages/skills/tests/fixtures/srs3/source-triage.json",
      productionCatalogManifestSha256: "packages/skills/definitions/approved-manifest.yaml",
      phase8aEvidenceManifestSha256:
        "packages/skills/tests/fixtures/srs3/phase8a-evidence-manifest.json",
    }) as Array<[keyof typeof freeze.artifacts, string]>) {
      const bytes = await readFile(resolve(root, path));
      expect(() => assertSrs3bArtifactDigest(bytes, freeze.artifacts[key], key)).not.toThrow();
      expect(() =>
        assertSrs3bArtifactDigest(
          Buffer.concat([bytes, Buffer.from(" ")]),
          freeze.artifacts[key],
          key,
        ),
      ).toThrow(/bound artifact drift/u);
    }
    const { counts, corpus } = await verifySrs3bFreeze();
    expect(counts).toEqual({
      acceptedEnglish: 29,
      quarantinedUnscored: 12,
      primaryLabelledScenarios: 18,
      pairwiseEdges: 11,
      multiRequiredNoOrderScenarios: 7,
      strictNoneScenarios: 4,
      requiredOccurrences: 32,
      scenariosWithRequired: 25,
    });
    expect(corpus.raw).toHaveLength(41);
  });

  it("produces deterministic content-free evidence with validated source bindings", async () => {
    const first = await evaluateSrs3Baseline();
    const second = await evaluateSrs3Baseline();
    expect(first.json).toBe(second.json);
    expect(first.json).toBe(await readFile(fixturePath, "utf8"));
    expect(first.report.rows.map((row) => row.id)).toEqual(
      Array.from({ length: 29 }, (_, index) => `R${String(index + 1).padStart(2, "0")}`),
    );
    expect(first.report.quarantinedUnscoredIds).toHaveLength(12);
    expect(first.report.rows.some((row) => row.id === "R30")).toBe(false);
    expect(
      first.report.rows.every((row) =>
        row.candidates.every(
          (candidate) => candidate.rankingStatus === "NOT_RUN" && candidate.rankingRank === null,
        ),
      ),
    ).toBe(true);
    expect(
      first.report.rows.every((row) =>
        row.candidates.every(
          (candidate) => !row.modifiers.some((modifier) => modifier.id === candidate.id),
        ),
      ),
    ).toBe(true);
    expect(first.json).not.toMatch(
      /RERANK_CUTOFF|rankingScore|reviewerJustification|"messages"|"draft"|"selectedIntent"/u,
    );
    expect(first.json).not.toContain("The warehouse has two export formats");
    expect(first.json).not.toContain("pls run the weekly inventory export");
    for (const [key, path] of Object.entries({
      normalizer: "packages/ai/src/skill-context-normalization.ts",
      retriever: "packages/skills/tests/srs2-shadow-retrieval.ts",
      observer: "packages/skills/tests/srs3-ranking-corpus.ts",
      evaluator: "packages/skills/tests/srs3-ranking-baseline.ts",
      traceSchema: "packages/skills/tests/srs1-foundation.ts",
    }))
      expect(first.report.sourceHashes[key]).toBe(
        createHash("sha256")
          .update(await readFile(resolve(root, path)))
          .digest("hex"),
      );
  });

  it("keeps acceptable, forbidden, and unlabeled states distinct from required recall", async () => {
    const { report } = await evaluateSrs3Baseline();
    const metrics = report.metrics;
    expect(metrics.primaryAt1.denominator).toBe(18);
    expect(metrics.pairEndToEndAt10.denominator).toBe(11);
    expect(metrics.requiredRecallAt10.denominator).toBe(32);
    expect(metrics.requiredCoverageAt10.denominator).toBe(25);
    expect(metrics.acceptableAt10.denominator).toBe(12);
    expect(metrics.forbiddenAt10.denominator).toBe(5);
    expect(report.rows.filter((row) => row.forbidden.some((item) => item.at10))).toHaveLength(1);
    expect(report.rows.find((row) => row.id === "R10")?.forbidden[0]?.id).toBe("boundary_setting");
    expect(
      report.rows
        .flatMap((row) => row.candidates)
        .some((candidate) => candidate.state === "UNLABELED"),
    ).toBe(true);
    expect(
      report.rows
        .filter((row) => row.expected.primary.length === 0 && row.required.length > 1)
        .map((row) => row.id),
    ).toEqual(["R13", "R15", "R19", "R22", "R23", "R24", "R25"]);
    expect(
      report.rows.filter((row) => row.expected.strictNone).map((row) => row.strictNonePass),
    ).toEqual([true, true, true, true]);
    expect(report.rows.find((row) => row.id === "R29")?.poolCounts.hardEligibleCount).toBe(0);
    expect(report.reviewQueue).toEqual([]);
  });

  it("separates missing pair endpoints from reversed pairs and keeps zero denominators N/A", async () => {
    const { report } = await evaluateSrs3Baseline();
    const r02 = report.rows.find((row) => row.id === "R02")!;
    const r03 = report.rows.find((row) => row.id === "R03")!;
    expect(r02.pairResults[0]?.bothPresent).toBe(false);
    expect(r02.failures.find((failure) => failure.symptom === "PAIR_MISSING")?.cause).toBe(
      "PAIRWISE_RETRIEVAL_FAILURE",
    );
    expect(
      r02.failures.find((failure) => failure.symptom === "PAIR_MISSING")?.endpointCauses,
    ).toHaveLength(2);
    expect(r03.pairResults[0]?.bothPresent).toBe(true);
    expect(r03.failures.find((failure) => failure.symptom === "PAIR_REVERSED")?.cause).toBe(
      "PAIRWISE_ORDER_FAILURE",
    );
    expect(report.metrics.pairMissingEndpoints).toBe(5);
    expect(report.metrics.pairConditionalAt10.denominator).toBe(6);
    expect(report.subgroups.explicitness?.EXPLICIT?.pairConditionalAt10.value).toBeNull();
    expect(report.subgroups.draftRealism?.OVER_POLISHED?.requiredRecallAt10.value).toBeNull();
    expect(report.subgroups.assistanceMode?.COMPLETE_DRAFT?.primaryAt1.value).toBeNull();
  });

  it("uses any co-primary, missing-primary reciprocal zero, and macro required coverage", async () => {
    const { report } = await evaluateSrs3Baseline();
    expect(bestPrimaryRank(["request", "ask_for_help"], [{ id: "ask_for_help", rank: 1 }])).toBe(1);
    expect(bestPrimaryRank(["request", "ask_for_help"], [])).toBeNull();
    const one = structuredClone(
      report.rows.find((row) => row.id === "R03")!,
    ) as Srs3BaselineScenario;
    one.expected.primary = ["request", "ask_for_help"];
    one.primaryBestRank = 1;
    const absent = structuredClone(
      report.rows.find((row) => row.id === "R01")!,
    ) as Srs3BaselineScenario;
    absent.primaryBestRank = null;
    const metrics = calculateSrs3BaselineMetrics([one, absent]);
    expect(metrics.primaryAt1).toEqual({ numerator: 1, denominator: 2, value: 0.5 });
    expect(metrics.mrrAt10).toEqual({ numerator: 1, denominator: 2, value: 0.5 });
    expect(metrics.requiredRecallAt10).toEqual({ numerator: 1, denominator: 2, value: 0.5 });
    expect(metrics.requiredCoverageAt10).toEqual({ numerator: 1, denominator: 2, value: 0.5 });
    const beyondTop10 = structuredClone(one);
    beyondTop10.required[0]!.retrievalRank = 11;
    beyondTop10.required[0]!.topKRank = null;
    expect(calculateSrs3BaselineMetrics([beyondTop10]).requiredRecallAt10.numerator).toBe(0);
    expect(beyondTop10.required[0]!.retrievalRank).toBe(11);
    const neutral = structuredClone(one);
    neutral.candidates[0]!.state = "UNLABELED";
    expect(calculateSrs3BaselineMetrics([neutral]).requiredRecallAt10).toEqual(
      calculateSrs3BaselineMetrics([one]).requiredRecallAt10,
    );
  });

  it("counts forbidden occurrences and affected scenarios separately and checks NONE before truncation", async () => {
    const { report } = await evaluateSrs3Baseline();
    const row = structuredClone(
      report.rows.find((item) => item.id === "R10")!,
    ) as Srs3BaselineScenario;
    row.forbidden.push({ ...row.forbidden[0]!, id: "another_explicit_forbidden" });
    const metrics = calculateSrs3BaselineMetrics([row]);
    expect(metrics.forbiddenAt10).toEqual({ numerator: 2, denominator: 2, value: 1 });
    expect(metrics.forbiddenScenarioAt10).toEqual({ numerator: 1, denominator: 1, value: 1 });
    expect(
      passesStrictNone("REWRITE_DRAFT", {
        hardEligibleCount: 14,
        positiveSignalCandidatePoolCount: 1,
        topKCount: 0,
      }),
    ).toBe(false);
    expect(
      passesStrictNone("NO_REPLY_NEEDED", {
        hardEligibleCount: 1,
        positiveSignalCandidatePoolCount: 0,
        topKCount: 0,
      }),
    ).toBe(false);
  });

  it("uses Top-10 prefixes equivalent to native Top-3 and Top-5 without changing the baseline run", async () => {
    const corpus = await loadSrs3Corpus();
    const catalog = await buildSrs2Catalog("PRODUCTION");
    for (const raw of corpus.raw.filter((row) => ["R03", "R05", "R18"].includes(row.id))) {
      const { context, result } = observeSrs3RawOnly(raw, catalog);
      for (const k of [3, 5]) {
        const native = runSrs2ShadowRetrieval(
          context,
          { mode: "SIGNAL_ONLY", topK: k, catalogScope: "PRODUCTION" },
          catalog,
        );
        expect(result.capabilityTopK.slice(0, k).map((item) => item.id)).toEqual(
          native.capabilityTopK.map((item) => item.id),
        );
      }
    }
  });

  it("keeps labels and fixture-only reporting metadata out of the raw observer", async () => {
    const corpus = await loadSrs3Corpus();
    const catalog = await buildSrs2Catalog("PRODUCTION");
    expect(catalog).toHaveLength(21);
    expect(catalog.every((entry) => entry.catalog === "PRODUCTION")).toBe(true);
    const raw = corpus.raw.find((row) => row.id === "R03")!;
    const before = JSON.stringify(observeSrs3RawOnly(raw, catalog));
    const annotation = corpus.annotations.find((row) => row.id === raw.id)!;
    const metadata = corpus.authoring.cases.find((row) => row.id === raw.id)!;
    annotation.required.reverse();
    annotation.primary = ["ask_for_help"];
    metadata.boundaryExplicitness = "EXPLICIT";
    expect(JSON.stringify(observeSrs3RawOnly(raw, catalog))).toBe(before);
  });
});
