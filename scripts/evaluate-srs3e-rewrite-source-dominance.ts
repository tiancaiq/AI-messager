import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { format } from "prettier";
import type { AgentAction, CoachingRequest } from "@ai-message-coach/contracts";
import { loadSrs3Corpus } from "../packages/skills/tests/srs3-ranking-corpus.js";
import {
  FROZEN_SEMANTIC_PROFILE_SHA256,
  loadLocalSemanticEncoder,
  loadProductionSemanticCatalog,
  SEMANTIC_MODEL,
} from "../packages/skills/tests/srs3e-semantic-model.js";
import {
  retrieveSemanticCandidates,
  type FrozenPositiveVector,
  type SemanticCandidateTrace,
  type SemanticEncoder,
} from "../packages/skills/tests/srs3e-semantic-retrieval.js";
import {
  rankAndAdmitP087,
  rewriteSourcePolicies,
  type RewriteSourcePolicy,
  type SourceScore,
} from "../packages/skills/tests/srs3e-rewrite-source-dominance.js";

const root = resolve(import.meta.dirname, "..");
const evidenceRoot = resolve(root, "packages/skills/tests/fixtures/srs3e-semantic");
const calibrationRoot = resolve(evidenceRoot, "calibration-v2");
const outputPath = resolve(evidenceRoot, "rewrite-source-dominance-v2.json");
const sha256 = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest("hex");
const json = (value: unknown) =>
  format(JSON.stringify(value), {
    parser: "json",
    printWidth: 100,
    tabWidth: 2,
    endOfLine: "lf",
  });
const expected = {
  calibration: "bcb55ca5ee19973e974550c75a06892e58cfa8f0bc9380efcfce790eb25e0f8a",
  vectors: "b02d4664585c29d3a0ac33e41c6827d2bd4d5d065fd7eb289182084c6dc05588",
  srs3bManifest: "0700162fd5b7c656c1d6134cdd3d69baa9a824eb4a01a598b7ea6d4b4c666362",
  previous: "f340f5862fedfad72dc32be58dc5e5f174cf89a51ce25b4171c8ae0d957b6c5c",
} as const;

interface RawCase {
  id: string;
  corpus: "SRS3B" | "CONTROL";
  action: AgentAction;
  request: CoachingRequest;
}
interface Label {
  id: string;
  required: string[];
  acceptable: string[];
  forbidden: string[];
  strictNone: boolean;
}
interface ScoredCase {
  raw: RawCase;
  traces: SemanticCandidateTrace[];
}
interface EvaluatedCase extends ScoredCase {
  scores: SourceScore[];
  topK: SourceScore[];
  poolCount: number;
}

function sourceRanks(scores: readonly SourceScore[], source: "draft" | "context") {
  return new Map(
    scores
      .filter((item) => item[source] !== null)
      .sort((a, b) => b[source]! - a[source]! || a.skillId.localeCompare(b.skillId))
      .map((item, index) => [item.skillId, index + 1]),
  );
}

function metrics(cases: readonly EvaluatedCase[], labels: ReadonlyMap<string, Label>) {
  const required: Array<{
    caseId: string;
    skillId: string;
    action: AgentAction;
    draftRank: number | null;
    contextRank: number | null;
    combinedRank: number | null;
    poolRank: number | null;
    admittedRank: number | null;
    draftScore: number | null;
    contextScore: number | null;
    combinedScore: number | null;
    stage: string;
  }> = [];
  let noneTotal = 0;
  let nonePass = 0;
  let forbiddenTotal = 0;
  let forbiddenAdmitted = 0;
  let acceptableTotal = 0;
  let acceptableFound = 0;
  let otherOnlyViolation = 0;
  const pools: number[] = [];
  for (const row of cases) {
    const key = `${row.raw.corpus}:${row.raw.id}`;
    const label = labels.get(key);
    if (!label) throw Error(`Missing exposed label for ${key}`);
    const found = new Set(row.topK.map((item) => item.skillId));
    const draftRanks = sourceRanks(row.scores, "draft");
    const contextRanks = sourceRanks(row.scores, "context");
    pools.push(row.poolCount);
    if (label.strictNone) {
      noneTotal++;
      if (row.poolCount === 0) nonePass++;
    }
    forbiddenTotal += label.forbidden.length;
    forbiddenAdmitted += label.forbidden.filter((id) => found.has(id)).length;
    acceptableTotal += label.acceptable.length;
    acceptableFound += label.acceptable.filter((id) => found.has(id)).length;
    if (row.raw.action === "REWRITE_DRAFT") {
      otherOnlyViolation += row.scores.filter(
        (item) =>
          item.draft !== null &&
          item.draft < 0.25 &&
          item.admittedRank !== null &&
          item.combined !== item.draft,
      ).length;
    }
    for (const id of label.required) {
      const score = row.scores.find((item) => item.skillId === id);
      const trace = row.traces.find((item) => item.skillId === id);
      const draftRank = draftRanks.get(id) ?? null;
      const contextRank = contextRanks.get(id) ?? null;
      const stage = !trace?.hardEligible
        ? "HARD_ELIGIBILITY"
        : score?.admittedRank !== null && score?.admittedRank !== undefined
          ? "FOUND"
          : score?.rank === null || score?.rank === undefined
            ? "DRAFT_REPRESENTATION"
            : score.poolRank !== null && score.poolRank > 10
              ? "TOP_K_CUTOFF"
              : score.rank > 10
                ? row.raw.action === "REWRITE_DRAFT" && draftRank !== null && draftRank <= 10
                  ? "CONTEXT_RERANK"
                  : "DRAFT_REPRESENTATION"
                : "ADMISSION_REJECTED";
      required.push({
        caseId: key,
        skillId: id,
        action: row.raw.action,
        draftRank,
        contextRank,
        combinedRank: score?.rank ?? null,
        poolRank: score?.poolRank ?? null,
        admittedRank: score?.admittedRank ?? null,
        draftScore: score?.draft ?? null,
        contextScore: score?.context ?? null,
        combinedScore: score?.combined ?? null,
        stage,
      });
    }
  }
  pools.sort((a, b) => a - b);
  const atK = (
    rows: typeof required,
    field: "draftRank" | "contextRank" | "combinedRank",
    k: number,
  ) => rows.filter((item) => item[field] !== null && item[field]! <= k).length;
  const rewrites = required.filter((item) => item.action === "REWRITE_DRAFT");
  return {
    cases: cases.length,
    required: {
      hit: required.filter((item) => item.stage === "FOUND").length,
      total: required.length,
      preAdmissionAt3: atK(required, "combinedRank", 3),
      preAdmissionAt5: atK(required, "combinedRank", 5),
      preAdmissionAt10: atK(required, "combinedRank", 10),
    },
    rewrite: {
      hit: rewrites.filter((item) => item.stage === "FOUND").length,
      total: rewrites.length,
      draftOnlyAt3: atK(rewrites, "draftRank", 3),
      draftOnlyAt5: atK(rewrites, "draftRank", 5),
      draftOnlyAt10: atK(rewrites, "draftRank", 10),
      contextOnlyAt3: atK(rewrites, "contextRank", 3),
      contextOnlyAt5: atK(rewrites, "contextRank", 5),
      contextOnlyAt10: atK(rewrites, "contextRank", 10),
      combinedAt3: atK(rewrites, "combinedRank", 3),
      combinedAt5: atK(rewrites, "combinedRank", 5),
      combinedAt10: atK(rewrites, "combinedRank", 10),
    },
    strictNone: { pass: nonePass, total: noneTotal },
    forbidden: { admitted: forbiddenAdmitted, total: forbiddenTotal },
    acceptable: { found: acceptableFound, total: acceptableTotal },
    pool: {
      mean: pools.reduce((sum, count) => sum + count, 0) / (pools.length || 1),
      p90: pools[Math.max(0, Math.ceil(pools.length * 0.9) - 1)] ?? 0,
      max: pools.at(-1) ?? 0,
    },
    otherOnlyViolation,
    requiredDetails: required,
  };
}

const mode = process.argv[2];
if (process.argv.length !== 3 || !["--generate", "--check"].includes(mode!))
  throw Error("Usage: evaluate-srs3e-rewrite-source-dominance.ts --generate | --check");

const [freezeBytes, vectorBytes, rawBytes, labelBytes, reviewBytes, previousBytes] =
  await Promise.all([
    readFile(resolve(calibrationRoot, "calibration-freeze.json")),
    readFile(resolve(evidenceRoot, "profile-vectors-v1.json")),
    readFile(resolve(calibrationRoot, "calibration-raw.json")),
    readFile(resolve(calibrationRoot, "calibration-annotations.json")),
    readFile(resolve(calibrationRoot, "calibration-review.json")),
    readFile(resolve(evidenceRoot, "admission-retest-v3.json")),
  ]);
if (
  sha256(freezeBytes) !== expected.calibration ||
  sha256(vectorBytes) !== expected.vectors ||
  sha256(previousBytes) !== expected.previous
)
  throw Error("Frozen exposed semantic binding drift");
const freeze = JSON.parse(freezeBytes.toString("utf8")) as {
  artifactSha256: Record<string, string>;
};
for (const [name, bytes] of [
  ["raw", rawBytes],
  ["annotations", labelBytes],
  ["review", reviewBytes],
] as const)
  if (freeze.artifactSha256[name] !== sha256(bytes)) throw Error(`Calibration ${name} drift`);
const raw = JSON.parse(rawBytes.toString("utf8")) as {
  scenarios: Array<{ id: string; fixedAction: AgentAction; request: CoachingRequest }>;
};
const annotations = JSON.parse(labelBytes.toString("utf8")) as { annotations: Label[] };
const reviews = JSON.parse(reviewBytes.toString("utf8")) as {
  reviews: Array<{ decision: string }>;
};
if (
  raw.scenarios.length !== 24 ||
  annotations.annotations.length !== 24 ||
  reviews.reviews.length !== 24 ||
  reviews.reviews.some((item) => item.decision !== "PASS")
)
  throw Error("Corrected exposed control binding drift");
const catalog = await loadProductionSemanticCatalog();
const vectorArtifact = JSON.parse(vectorBytes.toString("utf8")) as {
  profileArtifactSha256: string;
  model: typeof SEMANTIC_MODEL;
  vectors: Array<FrozenPositiveVector & { vectorSha256: string }>;
};
if (
  vectorArtifact.profileArtifactSha256 !== FROZEN_SEMANTIC_PROFILE_SHA256 ||
  JSON.stringify(vectorArtifact.model) !== JSON.stringify(SEMANTIC_MODEL) ||
  vectorArtifact.vectors.some((item) => item.vectorSha256 !== sha256(JSON.stringify(item.vector)))
)
  throw Error("Frozen positive vector binding drift");
const srs3b = await loadSrs3Corpus();
if (srs3b.bindings.manifestSha256 !== expected.srs3bManifest) throw Error("SRS-3B freeze drift");
const accepted = srs3b.annotations.filter(
  (item) =>
    item.reviewState === "ACCEPTED" &&
    srs3b.raw.some((row) => row.id === item.id && row.languageGroup === "ENGLISH"),
);
if (accepted.length !== 29) throw Error("SRS-3B accepted English count drift");
const cases: RawCase[] = [
  ...accepted.map((item) => {
    const row = srs3b.raw.find((source) => source.id === item.id)!;
    if (row.revision !== item.reviewedRevision) throw Error("SRS-3B revision drift");
    return { id: row.id, corpus: "SRS3B" as const, action: row.fixedAction, request: row.request };
  }),
  ...raw.scenarios.map((row) => ({
    id: row.id,
    corpus: "CONTROL" as const,
    action: row.fixedAction,
    request: row.request,
  })),
];
const labels = new Map<string, Label>();
for (const item of accepted) labels.set(`SRS3B:${item.id}`, item);
for (const item of annotations.annotations) labels.set(`CONTROL:${item.id}`, item);
if (labels.size !== cases.length) throw Error("Exposed raw/label binding mismatch");

const encoder = await loadLocalSemanticEncoder();
const memo = new Map<string, readonly number[]>();
const memoEncoder: SemanticEncoder = {
  tokenCount: (text) => encoder.tokenCount(text),
  async encode(text) {
    let vector = memo.get(text);
    if (!vector) {
      vector = await encoder.encode(text);
      memo.set(text, vector);
    }
    return vector;
  },
};
const scored: ScoredCase[] = [];
for (const item of cases) {
  const observation = await retrieveSemanticCandidates({
    request: item.request,
    action: item.action,
    catalog,
    vectors: vectorArtifact.vectors,
    encoder: memoEncoder,
    config: { alpha: 0, threshold: 0.3, topK: 10, configId: "SRS-3E-V2-SOURCE-SCORING-1" },
  });
  scored.push({ raw: item, traces: observation.capabilityTraces });
}
const evaluations = rewriteSourcePolicies.map((policy: RewriteSourcePolicy) => {
  const results: EvaluatedCase[] = scored.map((item) => ({
    ...item,
    ...rankAndAdmitP087(item.traces, item.raw.action, policy),
  }));
  const combined = metrics(results, labels);
  const srs3bMetrics = metrics(
    results.filter((item) => item.raw.corpus === "SRS3B"),
    labels,
  );
  const controls = metrics(
    results.filter((item) => item.raw.corpus === "CONTROL"),
    labels,
  );
  const gates = {
    rewrite: combined.rewrite.hit >= 6,
    overall: combined.required.hit >= 14,
    none: combined.strictNone.pass >= 15,
    forbidden: combined.forbidden.admitted <= 3,
    meanPool: combined.pool.mean <= 5,
    p90Pool: combined.pool.p90 <= 8,
    maxPool: combined.pool.max <= 10,
    noOtherOnlyViolation: combined.otherOnlyViolation === 0,
  };
  return {
    policy,
    combined,
    srs3b: { ...srs3bMetrics, requiredDetails: undefined },
    controls: { ...controls, requiredDetails: undefined },
    gates,
    promising: Object.values(gates).every(Boolean),
  };
});
const baseline = evaluations[0]!.combined;
if (
  baseline.required.hit !== 8 ||
  baseline.required.total !== 46 ||
  baseline.rewrite.hit !== 0 ||
  baseline.rewrite.total !== 27 ||
  baseline.strictNone.pass !== 16 ||
  baseline.strictNone.total !== 16 ||
  baseline.forbidden.admitted !== 2 ||
  baseline.forbidden.total !== 14
)
  throw Error("Fixed P087 baseline reproduction failed");
const promising = evaluations
  .filter((item) => item.promising)
  .sort(
    (a, b) =>
      b.combined.rewrite.hit - a.combined.rewrite.hit ||
      b.combined.required.hit - a.combined.required.hit ||
      a.combined.forbidden.admitted - b.combined.forbidden.admitted ||
      a.combined.pool.mean - b.combined.pool.mean ||
      rewriteSourcePolicies.indexOf(a.policy) - rewriteSourcePolicies.indexOf(b.policy),
  );
const artifact = await json({
  schemaVersion: 1,
  experimentId: "SRS-3E-V2-EXPOSED-REWRITE-SOURCE-DOMINANCE-2",
  evidenceUse: "EXPOSED_CALIBRATION_DIAGNOSTIC_ONLY",
  challengeRead: false,
  challengeRunAuthorized: false,
  selectedChallengeConfig: null,
  fixedAdmission: { family: "PEAK_SPREAD", floor: 0.4, width: 0.15, spread: 0.2, topK: 10 },
  sourcePolicies: rewriteSourcePolicies,
  bindings: {
    calibrationFreezeSha256: sha256(freezeBytes),
    vectorArtifactSha256: sha256(vectorBytes),
    previousRetestSha256: sha256(previousBytes),
    srs3b: srs3b.bindings,
    model: SEMANTIC_MODEL,
    profileArtifactSha256: FROZEN_SEMANTIC_PROFILE_SHA256,
  },
  scoredCaseCount: scored.length,
  scoredCaseIds: scored.map(({ raw: item }) => `${item.corpus}:${item.id}`),
  evaluations,
  decision: promising[0]
    ? { status: "PROMISING_EXPOSED_ONLY", policy: promising[0].policy }
    : { status: "STOP_SRS3E_QUERY_ITERATION", policy: null },
});
if (mode === "--generate") {
  const existing = await readFile(outputPath, "utf8").catch(() => null);
  if (existing !== null && existing !== artifact)
    throw Error("Immutable source-dominance artifact drift; new experiment ID required");
  await writeFile(outputPath, artifact, "utf8");
} else if ((await readFile(outputPath, "utf8")) !== artifact)
  throw Error("Source-dominance artifact drift");
process.stdout.write(
  JSON.stringify({
    artifactSha256: sha256(artifact),
    scoredCases: scored.length,
    evaluations: evaluations.map(({ policy, combined, promising }) => ({
      policy,
      required: combined.required,
      rewrite: combined.rewrite,
      strictNone: combined.strictNone,
      forbidden: combined.forbidden,
      pool: combined.pool,
      promising,
    })),
    decision: promising[0]?.policy ?? "STOP_SRS3E_QUERY_ITERATION",
  }) + "\n",
);
