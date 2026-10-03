import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { format, resolveConfig } from "prettier";
import { z } from "zod";
import { packageRoot } from "../authoring/generator.js";
import { calculatePoolStatistics, buildSrs2Catalog } from "./srs2-shadow-retrieval.js";
import { loadSrs3Corpus, observeSrs3RawOnly } from "./srs3-ranking-corpus.js";

const root = resolve(packageRoot, "../..");
const freezePath = "packages/skills/tests/fixtures/srs3/srs3b-english-freeze.json";
const reportPath = "packages/skills/tests/fixtures/srs3/baseline-report.json";
export const SRS3B_FREEZE_SHA256 =
  "0667d3ae16dbfe0132bb2a62ca7bc6c63e0324bf6a331e05538d6983d0f0c03e";
const boundPaths = {
  rawSourceSha256: "packages/test-fixtures/src/srs3-ranking-development.ts",
  annotationsSha256: "packages/skills/tests/fixtures/srs3/development-annotations.json",
  authoringMetadataSha256: "packages/skills/tests/fixtures/srs3/authoring-metadata.json",
  sourceTriageSha256: "packages/skills/tests/fixtures/srs3/source-triage.json",
  productionCatalogManifestSha256: "packages/skills/definitions/approved-manifest.yaml",
  phase8aEvidenceManifestSha256:
    "packages/skills/tests/fixtures/srs3/phase8a-evidence-manifest.json",
} as const;
const sourcePaths = {
  normalizer: "packages/ai/src/skill-context-normalization.ts",
  retriever: "packages/skills/tests/srs2-shadow-retrieval.ts",
  observer: "packages/skills/tests/srs3-ranking-corpus.ts",
  evaluator: "packages/skills/tests/srs3-ranking-baseline.ts",
  traceSchema: "packages/skills/tests/srs1-foundation.ts",
} as const;
const digest = z.string().regex(/^[a-f0-9]{64}$/u);
const sha256 = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest("hex");
const fileHash = async (path: string) => sha256(await readFile(resolve(root, path)));
export function assertSrs3bArtifactDigest(bytes: Uint8Array, expected: string, label: string) {
  if (sha256(bytes) !== expected) throw Error(`SRS-3B bound artifact drift: ${label}`);
}
export function assertSrs3bFreezeBytes(bytes: Uint8Array) {
  if (sha256(bytes) !== SRS3B_FREEZE_SHA256) throw Error("SRS-3B freeze-file drift.");
  return FreezeSchema.parse(JSON.parse(Buffer.from(bytes).toString("utf8")));
}
const pairKey = (id: string, revision: string) => `${id}:${revision}`;
const sameKeys = (left: readonly string[], right: readonly string[]) => {
  const orderedRight = [...right].sort();
  return (
    left.length === right.length &&
    [...left].sort().every((value, index) => value === orderedRight[index])
  );
};

const FreezeSchema = z
  .object({
    schemaVersion: z.literal(1),
    freezeId: z.literal("SRS-3B-ENGLISH-1"),
    scope: z.literal("EXPOSED_DEVELOPMENT_ENGLISH_ONLY"),
    reviewVerdict: z.literal("PASS_WITH_NONBLOCKING_FINDINGS"),
    mutationPolicy: z.literal("NEW_REVIEW_AND_NEW_FREEZE_ID_REQUIRED"),
    baselineAuthorization: z.literal("SEPARATE_APPROVAL_REQUIRED"),
    reviewReportSha256: digest,
    artifacts: z
      .object({
        rawSourceSha256: digest,
        serializedRawSetSha256: digest,
        annotationsSha256: digest,
        authoringMetadataSha256: digest,
        sourceTriageSha256: digest,
        productionCatalogManifestSha256: digest,
        phase8aEvidenceManifestSha256: digest,
      })
      .strict(),
    acceptedEnglish: z.array(z.string()).length(29),
    quarantinedUnscored: z.array(z.string()).length(12),
    expectedCounts: z
      .object({
        acceptedEnglish: z.literal(29),
        quarantinedUnscored: z.literal(12),
        primaryLabelledScenarios: z.literal(18),
        pairwiseEdges: z.literal(11),
        multiRequiredNoOrderScenarios: z.literal(7),
        strictNoneScenarios: z.literal(4),
        requiredOccurrences: z.literal(32),
        scenariosWithRequired: z.literal(25),
      })
      .strict(),
  })
  .strict();

export async function verifySrs3bFreeze() {
  const bytes = await readFile(resolve(root, freezePath));
  const freeze = assertSrs3bFreezeBytes(bytes);
  for (const [key, path] of Object.entries(boundPaths) as Array<
    [keyof typeof boundPaths, string]
  >) {
    assertSrs3bArtifactDigest(await readFile(resolve(root, path)), freeze.artifacts[key], key);
  }
  if (
    (await fileHash("docs/skills/srs-3b-ranking-corpus-fresh-independent-review.md")) !==
    freeze.reviewReportSha256
  )
    throw Error("SRS-3B review report drift.");

  // Loading validates the annotation/triage chain and production-only label IDs.
  // No normalizer or retrieval call occurs before every assertion below passes.
  const corpus = await loadSrs3Corpus();
  if (corpus.bindings.rawSetSha256 !== freeze.artifacts.serializedRawSetSha256)
    throw Error("SRS-3B serialized raw-set drift.");
  const rawById = new Map(corpus.raw.map((raw) => [raw.id, raw]));
  const accepted = corpus.annotations.filter((row) => row.reviewState === "ACCEPTED");
  const quarantined = corpus.annotations.filter((row) => row.reviewState === "QUARANTINE");
  const keys = (rows: typeof accepted) =>
    rows.map((row) => pairKey(row.id, rawById.get(row.id)!.revision));
  if (
    corpus.raw.length !== 41 ||
    rawById.size !== 41 ||
    new Set(corpus.raw.map((row) => row.scenarioFamily)).size !== 41 ||
    !sameKeys(keys(accepted), freeze.acceptedEnglish) ||
    !sameKeys(keys(quarantined), freeze.quarantinedUnscored) ||
    accepted.some(
      (row) =>
        rawById.get(row.id)?.languageGroup !== "ENGLISH" ||
        row.reviewedRevision !== rawById.get(row.id)?.revision,
    ) ||
    quarantined.some((row) => rawById.get(row.id)?.languageGroup === "ENGLISH")
  )
    throw Error("SRS-3B frozen ID, revision, state, or language drift.");
  const counts = {
    acceptedEnglish: accepted.length,
    quarantinedUnscored: quarantined.length,
    primaryLabelledScenarios: accepted.filter((row) => row.primary.length > 0).length,
    pairwiseEdges: accepted.reduce((sum, row) => sum + row.shouldRankAbove.length, 0),
    multiRequiredNoOrderScenarios: accepted.filter(
      (row) => row.required.length > 1 && !row.primary.length && !row.shouldRankAbove.length,
    ).length,
    strictNoneScenarios: accepted.filter((row) => row.strictNone).length,
    requiredOccurrences: accepted.reduce((sum, row) => sum + row.required.length, 0),
    scenariosWithRequired: accepted.filter((row) => row.required.length > 0).length,
  };
  if (JSON.stringify(counts) !== JSON.stringify(freeze.expectedCounts))
    throw Error("SRS-3B frozen denominator drift.");
  if (
    !sameKeys(
      accepted
        .filter(
          (row) => row.required.length > 1 && !row.primary.length && !row.shouldRankAbove.length,
        )
        .map((row) => row.id),
      ["R13", "R15", "R19", "R22", "R23", "R24", "R25"],
    ) ||
    !sameKeys(
      accepted.filter((row) => row.strictNone).map((row) => row.id),
      ["R26", "R27", "R28", "R29"],
    ) ||
    accepted.reduce((sum, row) => sum + row.acceptable.length, 0) !== 12 ||
    accepted.reduce((sum, row) => sum + row.forbidden.length, 0) !== 5 ||
    corpus.annotations.some((row) =>
      [...row.required, ...row.acceptable, ...row.forbidden].some(
        (id) =>
          id === "confirmation" ||
          id === "perspective_acknowledgement" ||
          id === "give_constructive_feedback",
      ),
    )
  )
    throw Error("SRS-3B frozen label-set drift.");
  return { freeze, corpus, counts };
}

const StageSchema = z.enum(["HARD_ELIGIBILITY", "RETRIEVAL_CUTOFF", "TOP_K_CUTOFF"]);
// These fixture cases were inspected against their raw visible evidence after the
// raw-only run. Each named operation is present in the request/draft/selection,
// while the proposed normalizer omitted its corresponding tag.
const reviewedNormalizationMisses: Readonly<Record<string, readonly string[]>> = {
  R01: ["request"],
  R02: ["clarification", "request"],
  R06: ["request"],
  R07: ["boundary_setting", "decline"],
  R11: ["planning", "expectation_setting"],
  R13: ["planning"],
  R16: ["acknowledge_mistake", "apology"],
  R17: ["emotional_validation", "reassurance"],
  R19: ["status_update"],
  R21: ["planning"],
  R22: ["planning", "expectation_setting"],
  R25: ["acknowledge_mistake"],
};
const CauseSchema = z.enum([
  "AGENT_ACTION_UPSTREAM_ISSUE",
  "CONTEXT_NORMALIZATION_ISSUE",
  "SKILL_METADATA_GAP",
  "RETRIEVAL_FAILURE",
  "TOP_K_FAILURE",
  "PAIRWISE_RETRIEVAL_FAILURE",
  "RANKING_FAILURE",
  "PAIRWISE_ORDER_FAILURE",
  "FORBIDDEN_RANKING_FAILURE",
  "STRICT_NONE_FAILURE",
  "BAD_EVAL_LABEL",
  "SKILL_BOUNDARY_AMBIGUITY",
  "NEEDS_REVIEW",
]);
const CandidateSchema = z
  .object({
    id: z.string(),
    version: z.number().int().positive(),
    definitionType: z.enum(["ATOMIC", "PLAYBOOK"]),
    state: z.enum(["REQUIRED", "ACCEPTABLE", "FORBIDDEN", "UNLABELED"]),
    eligibility: z.enum(["PASSED", "FAILED"]),
    eligibilityReasonCodes: z.array(z.string()),
    matchedFeatureReasonCodes: z.array(z.enum(["INTENT_MATCH", "SITUATION_MATCH"])),
    retrievalScore: z.number().nullable(),
    retrievalRank: z.number().int().positive().nullable(),
    topKRank: z.number().int().positive().nullable(),
    rankingStatus: z.literal("NOT_RUN"),
    rankingRank: z.null(),
    disappearedAt: StageSchema.nullable(),
    disappearanceReasonCodes: z.array(z.string()),
  })
  .strict();
const FailureSchema = z
  .object({
    target: z.string(),
    symptom: z.enum([
      "REQUIRED_MISS",
      "PRIMARY_ORDER",
      "PAIR_MISSING",
      "PAIR_REVERSED",
      "FORBIDDEN_HIT",
      "STRICT_NONE",
    ]),
    stage: StageSchema.nullable(),
    admissionStage: z.enum(["HARD_ELIGIBILITY", "POSITIVE_SIGNAL_ADMISSION"]).nullable(),
    cause: CauseSchema,
    reasonCodes: z.array(z.string()),
    endpointCauses: z.array(
      z.object({ id: z.string(), stage: StageSchema.nullable(), cause: CauseSchema }).strict(),
    ),
  })
  .strict();
const ScenarioSchema = z
  .object({
    id: z.string(),
    revision: z.string(),
    family: z.string(),
    action: z.string(),
    assistanceMode: z.string(),
    languageGroup: z.string(),
    setting: z.string(),
    boundaryExplicitness: z.string(),
    draftRealism: z.string().nullable(),
    context: z
      .object({
        intentTags: z.array(z.string()),
        situationTags: z.array(z.string()),
        signals: z.array(
          z
            .object({
              kind: z.enum(["INTENT", "SITUATION"]),
              tag: z.string(),
              sources: z.array(z.string()),
            })
            .strict(),
        ),
      })
      .strict(),
    candidates: z.array(CandidateSchema),
    modifiers: z.array(
      z
        .object({
          id: z.string(),
          eligibility: z.enum(["PASSED", "FAILED"]),
          reasonCodes: z.array(z.string()),
        })
        .strict(),
    ),
    poolCounts: z
      .object({
        hardEligibleCount: z.number(),
        positiveSignalCandidatePoolCount: z.number(),
        topKCount: z.number(),
      })
      .strict(),
    expected: z
      .object({
        required: z.array(z.string()),
        acceptable: z.array(z.string()),
        forbidden: z.array(z.string()),
        primary: z.array(z.string()),
        pairs: z.array(z.tuple([z.string(), z.string()])),
        strictNone: z.boolean(),
      })
      .strict(),
    required: z.array(
      z
        .object({
          id: z.string(),
          retrievalRank: z.number().nullable(),
          topKRank: z.number().nullable(),
          at3: z.boolean(),
          at5: z.boolean(),
          at10: z.boolean(),
          disappearedAt: StageSchema.nullable(),
        })
        .strict(),
    ),
    acceptable: z.array(
      z
        .object({
          id: z.string(),
          retrievalRank: z.number().nullable(),
          topKRank: z.number().nullable(),
          at3: z.boolean(),
          at5: z.boolean(),
          at10: z.boolean(),
        })
        .strict(),
    ),
    forbidden: z.array(
      z
        .object({
          id: z.string(),
          retrievalRank: z.number().nullable(),
          topKRank: z.number().nullable(),
          at3: z.boolean(),
          at5: z.boolean(),
          at10: z.boolean(),
        })
        .strict(),
    ),
    primaryBestRank: z.number().nullable(),
    unlabeledAbovePrimary: z.number().int().nonnegative(),
    unlabeledAbovePrimaries: z.array(
      z
        .object({
          id: z.string(),
          fullPool: z.number().int().nonnegative(),
          top10: z.number().int().nonnegative(),
        })
        .strict(),
    ),
    pairResults: z.array(
      z
        .object({
          higher: z.string(),
          lower: z.string(),
          higherRank: z.number().nullable(),
          lowerRank: z.number().nullable(),
          bothPresent: z.boolean(),
          correctOrder: z.boolean(),
        })
        .strict(),
    ),
    strictNonePass: z.boolean().nullable(),
    strictNoneFalsePositiveIds: z.array(z.string()),
    earliestFailureStage: StageSchema.nullable(),
    failures: z.array(FailureSchema),
  })
  .strict();
export type Srs3BaselineScenario = z.infer<typeof ScenarioSchema>;
const RateSchema = z
  .object({
    numerator: z.number().nonnegative(),
    denominator: z.number().int().nonnegative(),
    value: z.number().nullable(),
  })
  .strict();
const MetricsSchema = z
  .object({
    scenarioCount: z.number().int(),
    primaryAt1: RateSchema,
    primaryAt3: RateSchema,
    mrrAt10: RateSchema,
    pairEndToEndAt10: RateSchema,
    pairConditionalAt10: RateSchema,
    pairMissingEndpoints: z.number().int(),
    requiredRecallAt3: RateSchema,
    requiredRecallAt5: RateSchema,
    requiredRecallAt10: RateSchema,
    requiredCoverageAt3: RateSchema,
    requiredCoverageAt5: RateSchema,
    requiredCoverageAt10: RateSchema,
    allRequiredAt3: RateSchema,
    allRequiredAt5: RateSchema,
    allRequiredAt10: RateSchema,
    acceptableAt3: RateSchema,
    acceptableAt5: RateSchema,
    acceptableAt10: RateSchema,
    forbiddenAt3: RateSchema,
    forbiddenAt5: RateSchema,
    forbiddenAt10: RateSchema,
    forbiddenScenarioAt3: RateSchema,
    forbiddenScenarioAt5: RateSchema,
    forbiddenScenarioAt10: RateSchema,
    strictNone: RateSchema,
    pool: z.object({ hardEligible: z.any(), positiveSignal: z.any(), top10: z.any() }).strict(),
  })
  .strict();
const ReportSchema = z
  .object({
    schemaVersion: z.literal(1),
    phase: z.literal("SRS-3C"),
    evidenceUse: z.literal("EXPOSED_DEVELOPMENT_ONLY"),
    freezeId: z.literal("SRS-3B-ENGLISH-1"),
    freezeSha256: digest,
    bindings: z.record(z.string(), digest),
    sourceHashes: z.record(z.string(), digest),
    configuration: z
      .object({
        profile: z.literal("SRS_2_5_PROPOSED"),
        mode: z.literal("SIGNAL_ONLY"),
        catalog: z.literal("PRODUCTION"),
        topK: z.literal(10),
        tieBreak: z.literal("SKILL_ID_ASC"),
        score: z.literal("INTENT_12_SITUATION_10"),
        rankingStatus: z.literal("NOT_RUN"),
      })
      .strict(),
    acceptedIds: z.array(z.string()).length(29),
    quarantinedUnscoredIds: z.array(z.string()).length(12),
    rows: z.array(ScenarioSchema).length(29),
    metrics: MetricsSchema,
    subgroups: z.record(z.string(), z.record(z.string(), MetricsSchema)),
    reviewQueue: z.array(
      z
        .object({
          scenarioId: z.string(),
          target: z.string(),
          stage: StageSchema.nullable(),
          reasonCodes: z.array(z.string()),
        })
        .strict(),
    ),
    dependenceClusters: z.array(z.array(z.string())),
    coverageGaps: z.array(z.string()),
  })
  .strict();

const rate = (numerator: number, denominator: number) => ({
  numerator,
  denominator,
  value: denominator ? numerator / denominator : null,
});
const inK = (rank: number | null, k: number) => rank !== null && rank <= k;
export function bestPrimaryRank(
  primary: readonly string[],
  topK: readonly { id: string; rank: number }[],
) {
  const positions = primary.flatMap((id) => {
    const match = topK.find((item) => item.id === id);
    return match ? [match.rank] : [];
  });
  return positions.length ? Math.min(...positions) : null;
}
export function passesStrictNone(
  action: string,
  pool: { hardEligibleCount: number; positiveSignalCandidatePoolCount: number; topKCount: number },
) {
  return (
    pool.positiveSignalCandidatePoolCount === 0 &&
    pool.topKCount === 0 &&
    (action !== "NO_REPLY_NEEDED" || pool.hardEligibleCount === 0)
  );
}
const stageOrder = ["HARD_ELIGIBILITY", "RETRIEVAL_CUTOFF", "TOP_K_CUTOFF"] as const;
const earliest = (stages: Array<z.infer<typeof StageSchema> | null>) =>
  stageOrder.find((stage) => stages.includes(stage)) ?? null;

export function calculateSrs3BaselineMetrics(rows: readonly Srs3BaselineScenario[]) {
  const primary = rows.filter((row) => row.expected.primary.length);
  const pairs = rows.flatMap((row) => row.pairResults);
  const required = rows.flatMap((row) => row.required);
  const requiredScenarios = rows.filter((row) => row.required.length);
  const acceptable = rows.flatMap((row) => row.acceptable);
  const forbidden = rows.flatMap((row) => row.forbidden);
  const none = rows.filter((row) => row.expected.strictNone);
  const found = (items: readonly { topKRank: number | null }[], k: number) =>
    items.filter((item) => inK(item.topKRank, k)).length;
  const coverage = (k: number) =>
    rate(
      requiredScenarios.reduce(
        (sum, row) =>
          sum + row.required.filter((item) => inK(item.topKRank, k)).length / row.required.length,
        0,
      ),
      requiredScenarios.length,
    );
  const allRequired = (k: number) =>
    rate(
      requiredScenarios.filter((row) => row.required.every((item) => inK(item.topKRank, k))).length,
      requiredScenarios.length,
    );
  const forbiddenScenarios = rows.filter((row) => row.forbidden.length);
  return MetricsSchema.parse({
    scenarioCount: rows.length,
    primaryAt1: rate(primary.filter((row) => inK(row.primaryBestRank, 1)).length, primary.length),
    primaryAt3: rate(primary.filter((row) => inK(row.primaryBestRank, 3)).length, primary.length),
    mrrAt10: rate(
      primary.reduce((sum, row) => sum + (row.primaryBestRank ? 1 / row.primaryBestRank : 0), 0),
      primary.length,
    ),
    pairEndToEndAt10: rate(pairs.filter((pair) => pair.correctOrder).length, pairs.length),
    pairConditionalAt10: rate(
      pairs.filter((pair) => pair.correctOrder).length,
      pairs.filter((pair) => pair.bothPresent).length,
    ),
    pairMissingEndpoints: pairs.filter((pair) => !pair.bothPresent).length,
    requiredRecallAt3: rate(found(required, 3), required.length),
    requiredRecallAt5: rate(found(required, 5), required.length),
    requiredRecallAt10: rate(found(required, 10), required.length),
    requiredCoverageAt3: coverage(3),
    requiredCoverageAt5: coverage(5),
    requiredCoverageAt10: coverage(10),
    allRequiredAt3: allRequired(3),
    allRequiredAt5: allRequired(5),
    allRequiredAt10: allRequired(10),
    acceptableAt3: rate(found(acceptable, 3), acceptable.length),
    acceptableAt5: rate(found(acceptable, 5), acceptable.length),
    acceptableAt10: rate(found(acceptable, 10), acceptable.length),
    forbiddenAt3: rate(found(forbidden, 3), forbidden.length),
    forbiddenAt5: rate(found(forbidden, 5), forbidden.length),
    forbiddenAt10: rate(found(forbidden, 10), forbidden.length),
    forbiddenScenarioAt3: rate(
      forbiddenScenarios.filter((row) => row.forbidden.some((item) => inK(item.topKRank, 3)))
        .length,
      forbiddenScenarios.length,
    ),
    forbiddenScenarioAt5: rate(
      forbiddenScenarios.filter((row) => row.forbidden.some((item) => inK(item.topKRank, 5)))
        .length,
      forbiddenScenarios.length,
    ),
    forbiddenScenarioAt10: rate(
      forbiddenScenarios.filter((row) => row.forbidden.some((item) => inK(item.topKRank, 10)))
        .length,
      forbiddenScenarios.length,
    ),
    strictNone: rate(none.filter((row) => row.strictNonePass).length, none.length),
    pool: {
      hardEligible: calculatePoolStatistics(rows.map((row) => row.poolCounts.hardEligibleCount)),
      positiveSignal: calculatePoolStatistics(
        rows.map((row) => row.poolCounts.positiveSignalCandidatePoolCount),
      ),
      top10: calculatePoolStatistics(rows.map((row) => row.poolCounts.topKCount)),
    },
  });
}

export async function evaluateSrs3Baseline() {
  const { freeze, corpus } = await verifySrs3bFreeze();
  const catalog = await buildSrs2Catalog("PRODUCTION");
  if (catalog.length !== 21 || catalog.some((entry) => entry.catalog !== "PRODUCTION"))
    throw Error("Production catalog drift.");
  const rawById = new Map(corpus.raw.map((raw) => [raw.id, raw]));
  const metadataById = new Map(corpus.authoring.cases.map((item) => [item.id, item]));
  const annotationsById = new Map(corpus.annotations.map((item) => [item.id, item]));
  const rows: Srs3BaselineScenario[] = [];
  for (const key of freeze.acceptedEnglish) {
    const [id] = key.split(":");
    const raw = rawById.get(id!)!;
    // Annotation and authoring metadata are deliberately untouched until after this call.
    const observation = observeSrs3RawOnly(raw, catalog);
    const annotation = annotationsById.get(id!)!;
    const metadata = metadataById.get(id!)!;
    const byId = new Map(observation.result.capabilityTraces.map((trace) => [trace.id, trace]));
    const primaryBestRank = bestPrimaryRank(annotation.primary, observation.result.capabilityTopK);
    const failures: z.infer<typeof FailureSchema>[] = [];
    const rank = (skill: string) =>
      observation.result.capabilityTopK.find((item) => item.id === skill)?.rank ?? null;
    const candidate = (skill: string) => {
      const trace = byId.get(skill);
      if (!trace) throw Error(`Missing capability trace: ${id}/${skill}`);
      return trace;
    };
    const missingCause = (skill: string, stage: z.infer<typeof StageSchema> | null) =>
      stage === "TOP_K_CUTOFF"
        ? ("TOP_K_FAILURE" as const)
        : reviewedNormalizationMisses[id!]?.includes(skill)
          ? ("CONTEXT_NORMALIZATION_ISSUE" as const)
          : ("NEEDS_REVIEW" as const);
    const symptom = (
      target: string,
      kind: z.infer<typeof FailureSchema>["symptom"],
      cause: z.infer<typeof CauseSchema>,
      stage: z.infer<typeof StageSchema> | null,
      reasonCodes: string[],
      endpointCauses: z.infer<typeof FailureSchema>["endpointCauses"] = [],
      admissionStage: "HARD_ELIGIBILITY" | "POSITIVE_SIGNAL_ADMISSION" | null = null,
    ) =>
      failures.push({
        target,
        symptom: kind,
        cause,
        stage,
        admissionStage,
        reasonCodes,
        endpointCauses,
      });
    const required = annotation.required.map((skill) => {
      const trace = candidate(skill);
      const topKRank = rank(skill);
      const disappearance = StageSchema.nullable().parse(trace.disappearedAt);
      if (topKRank === null)
        symptom(
          skill,
          "REQUIRED_MISS",
          missingCause(skill, disappearance),
          disappearance,
          trace.disappearanceReasonCodes,
        );
      return {
        id: skill,
        retrievalRank: trace.retrieval?.rank ?? null,
        topKRank,
        at3: inK(topKRank, 3),
        at5: inK(topKRank, 5),
        at10: inK(topKRank, 10),
        disappearedAt: disappearance,
      };
    });
    if (annotation.primary.length && primaryBestRank !== 1) {
      const best = annotation.primary.map((skill) => candidate(skill));
      const stage = earliest(
        best.map((trace) => StageSchema.nullable().parse(trace.disappearedAt)),
      );
      symptom(
        annotation.primary.join("|"),
        "PRIMARY_ORDER",
        primaryBestRank === null ? missingCause(annotation.primary[0]!, stage) : "RANKING_FAILURE",
        stage,
        best.flatMap((trace) => trace.disappearanceReasonCodes),
      );
    }
    const pairResults = annotation.shouldRankAbove.map(([higher, lower]) => {
      const higherRank = rank(higher),
        lowerRank = rank(lower);
      const bothPresent = higherRank !== null && lowerRank !== null;
      const correctOrder = bothPresent && higherRank < lowerRank;
      if (!correctOrder) {
        const traces = [candidate(higher), candidate(lower)];
        symptom(
          `${higher}>${lower}`,
          bothPresent ? "PAIR_REVERSED" : "PAIR_MISSING",
          bothPresent ? "PAIRWISE_ORDER_FAILURE" : "PAIRWISE_RETRIEVAL_FAILURE",
          earliest(traces.map((trace) => StageSchema.nullable().parse(trace.disappearedAt))),
          traces.flatMap((trace) => trace.disappearanceReasonCodes),
          bothPresent
            ? []
            : [higher, lower]
                .filter((skill) => rank(skill) === null)
                .map((skill) => {
                  const trace = candidate(skill);
                  const stage = StageSchema.nullable().parse(trace.disappearedAt);
                  return { id: skill, stage, cause: missingCause(skill, stage) };
                }),
        );
      }
      return { higher, lower, higherRank, lowerRank, bothPresent, correctOrder };
    });
    const diagnostic = (skill: string) => {
      const trace = candidate(skill);
      const topKRank = rank(skill);
      return {
        id: skill,
        retrievalRank: trace.retrieval?.rank ?? null,
        topKRank,
        at3: inK(topKRank, 3),
        at5: inK(topKRank, 5),
        at10: inK(topKRank, 10),
      };
    };
    const acceptable = annotation.acceptable.map(diagnostic);
    const forbidden = annotation.forbidden.map(diagnostic);
    for (const item of forbidden.filter((item) => item.at10))
      symptom(item.id, "FORBIDDEN_HIT", "FORBIDDEN_RANKING_FAILURE", null, []);
    const falsePositiveIds = annotation.strictNone
      ? observation.result.capabilityTraces
          .filter((trace) =>
            raw.fixedAction === "NO_REPLY_NEEDED"
              ? trace.eligibility.result === "PASSED"
              : trace.retrieval !== null,
          )
          .map((trace) => trace.id)
      : [];
    const strictNonePass = annotation.strictNone
      ? passesStrictNone(raw.fixedAction, observation.result.poolCounts)
      : null;
    if (strictNonePass === false)
      for (const skill of falsePositiveIds)
        symptom(
          skill,
          "STRICT_NONE",
          "STRICT_NONE_FAILURE",
          null,
          [],
          [],
          raw.fixedAction === "NO_REPLY_NEEDED" ? "HARD_ELIGIBILITY" : "POSITIVE_SIGNAL_ADMISSION",
        );
    const candidates = observation.result.capabilityTraces.map((trace) => {
      const state = annotation.required.includes(trace.id)
        ? "REQUIRED"
        : annotation.acceptable.includes(trace.id)
          ? "ACCEPTABLE"
          : annotation.forbidden.includes(trace.id)
            ? "FORBIDDEN"
            : "UNLABELED";
      return {
        id: trace.id,
        version: trace.version,
        definitionType: trace.definitionType as "ATOMIC" | "PLAYBOOK",
        state,
        eligibility: trace.eligibility.result as "PASSED" | "FAILED",
        eligibilityReasonCodes: trace.eligibility.reasonCodes,
        matchedFeatureReasonCodes: trace.retrieval?.matchedFeatureReasonCodes ?? [],
        retrievalScore: trace.retrieval?.score ?? null,
        retrievalRank: trace.retrieval?.rank ?? null,
        topKRank: rank(trace.id),
        rankingStatus: "NOT_RUN" as const,
        rankingRank: null,
        disappearedAt: StageSchema.nullable().parse(trace.disappearedAt),
        disappearanceReasonCodes: trace.disappearanceReasonCodes,
      };
    });
    const unlabeledAbovePrimaries = annotation.primary.map((skill) => {
      const trace = candidate(skill);
      return {
        id: skill,
        fullPool:
          trace.retrieval === null
            ? 0
            : candidates.filter(
                (item) =>
                  item.state === "UNLABELED" &&
                  item.retrievalRank !== null &&
                  item.retrievalRank < trace.retrieval!.rank,
              ).length,
        top10:
          rank(skill) === null
            ? 0
            : candidates.filter(
                (item) =>
                  item.state === "UNLABELED" &&
                  item.topKRank !== null &&
                  item.topKRank < rank(skill)!,
              ).length,
      };
    });
    const unlabeledAbovePrimary =
      primaryBestRank === null
        ? 0
        : candidates.filter(
            (item) =>
              item.state === "UNLABELED" &&
              item.topKRank !== null &&
              item.topKRank < primaryBestRank,
          ).length;
    rows.push(
      ScenarioSchema.parse({
        id: raw.id,
        revision: raw.revision,
        family: raw.scenarioFamily,
        action: raw.fixedAction,
        assistanceMode:
          raw.fixedAction === "NO_REPLY_NEEDED" ? "NON_WORDING_ACTION" : raw.fixedAction,
        languageGroup: raw.languageGroup,
        setting: raw.setting,
        boundaryExplicitness: metadata.boundaryExplicitness,
        draftRealism: metadata.draftRealism ?? null,
        context: {
          intentTags: observation.context.intentTags,
          situationTags: observation.context.situationTags,
          signals: observation.signals,
        },
        candidates,
        modifiers: observation.result.modifierEligibilityTraces.map((trace) => ({
          id: trace.id,
          eligibility: trace.eligibility.result,
          reasonCodes: trace.eligibility.reasonCodes,
        })),
        poolCounts: observation.result.poolCounts,
        expected: {
          required: annotation.required,
          acceptable: annotation.acceptable,
          forbidden: annotation.forbidden,
          primary: annotation.primary,
          pairs: annotation.shouldRankAbove,
          strictNone: annotation.strictNone,
        },
        required,
        acceptable,
        forbidden,
        primaryBestRank,
        unlabeledAbovePrimary,
        unlabeledAbovePrimaries,
        pairResults,
        strictNonePass,
        strictNoneFalsePositiveIds: falsePositiveIds,
        earliestFailureStage: earliest(failures.map((failure) => failure.stage)),
        failures,
      }),
    );
  }
  const groups = {
    explicitness: ["EXPLICIT", "IMPLICIT"],
    draftRealism: ["ROUGH", "NORMAL", "ALREADY_DECENT", "OVER_POLISHED"],
    assistanceMode: ["REWRITE_DRAFT", "SUGGEST_REPLY", "COMPLETE_DRAFT", "NON_WORDING_ACTION"],
    setting: ["WORK", "PERSONAL", "SERVICE"],
  } as const;
  const subgroups = Object.fromEntries(
    Object.entries(groups).map(([group, values]) => [
      group,
      Object.fromEntries(
        values.map((value) => [
          value,
          calculateSrs3BaselineMetrics(
            rows.filter((row) => {
              if (group === "explicitness") return row.boundaryExplicitness === value;
              if (group === "draftRealism") return row.draftRealism === value;
              if (group === "assistanceMode") return row.assistanceMode === value;
              return row.setting === value;
            }),
          ),
        ]),
      ),
    ]),
  );
  const sourceHashes = Object.fromEntries(
    await Promise.all(
      Object.entries(sourcePaths).map(async ([key, path]) => [key, await fileHash(path)]),
    ),
  );
  const report = ReportSchema.parse({
    schemaVersion: 1,
    phase: "SRS-3C",
    evidenceUse: "EXPOSED_DEVELOPMENT_ONLY",
    freezeId: freeze.freezeId,
    freezeSha256: SRS3B_FREEZE_SHA256,
    bindings: { ...freeze.artifacts, reviewReportSha256: freeze.reviewReportSha256 },
    sourceHashes,
    configuration: {
      profile: "SRS_2_5_PROPOSED",
      mode: "SIGNAL_ONLY",
      catalog: "PRODUCTION",
      topK: 10,
      tieBreak: "SKILL_ID_ASC",
      score: "INTENT_12_SITUATION_10",
      rankingStatus: "NOT_RUN",
    },
    acceptedIds: [...freeze.acceptedEnglish],
    quarantinedUnscoredIds: [...freeze.quarantinedUnscored],
    rows,
    metrics: calculateSrs3BaselineMetrics(rows),
    subgroups,
    reviewQueue: rows.flatMap((row) =>
      row.failures.flatMap((failure) => [
        ...(failure.cause === "NEEDS_REVIEW"
          ? [
              {
                scenarioId: row.id,
                target: failure.target,
                stage: failure.stage,
                reasonCodes: failure.reasonCodes,
              },
            ]
          : []),
        ...failure.endpointCauses
          .filter((endpoint) => endpoint.cause === "NEEDS_REVIEW")
          .map((endpoint) => ({
            scenarioId: row.id,
            target: endpoint.id,
            stage: endpoint.stage,
            reasonCodes: failure.reasonCodes,
          })),
      ]),
    ),
    dependenceClusters: [
      ["R19", "R23"],
      ["R15", "R25"],
      ["R07", "R09", "R24"],
    ],
    coverageGaps: ["COMPLETE_DRAFT", "QUARANTINED_CHINESE_UNSCORED"],
  });
  const absoluteReportPath = resolve(root, reportPath);
  const json = await format(JSON.stringify(report), {
    ...(await resolveConfig(absoluteReportPath)),
    filepath: absoluteReportPath,
    parser: "json",
  });
  if (
    /RERANK_CUTOFF|rankingScore|reviewerJustification|"messages"|"draft"|"selectedIntent"/u.test(
      json,
    )
  )
    throw Error("SRS-3C evidence contains forbidden fields.");
  return { report, json, sha256: sha256(json) };
}
