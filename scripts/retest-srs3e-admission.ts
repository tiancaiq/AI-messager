import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { format } from "prettier";
import type { AgentAction, CoachingRequest } from "@ai-message-coach/contracts";
import { loadSrs3Corpus } from "../packages/skills/tests/srs3-ranking-corpus.js";
import {
  loadLocalSemanticEncoder,
  loadProductionSemanticCatalog,
  FROZEN_SEMANTIC_PROFILE_SHA256,
  SEMANTIC_MODEL,
} from "../packages/skills/tests/srs3e-semantic-model.js";
import {
  retrieveSemanticCandidates,
  type FrozenPositiveVector,
  type SemanticCandidateTrace,
  type SemanticEncoder,
} from "../packages/skills/tests/srs3e-semantic-retrieval.js";

const root = resolve(import.meta.dirname, "..");
const evidenceRoot = resolve(root, "packages/skills/tests/fixtures/srs3e-semantic");
const calibrationRoot = resolve(evidenceRoot, "calibration-v2");
const outputPath = resolve(evidenceRoot, "admission-retest-v3.json");
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
  priorGrid: "d5cb69af28b6cf4d51611c58b5ee42d43ba91feea6404f43036d815a595b8a33",
  srs3bManifest: "0700162fd5b7c656c1d6134cdd3d69baa9a824eb4a01a598b7ea6d4b4c666362",
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
type Family = "ABSOLUTE" | "CENTERED" | "PEAK_SPREAD" | "DUAL_SOURCE";
interface Policy {
  family: Family;
  floor?: number;
  lift?: number;
  width?: number;
  spread?: number;
  threshold?: number;
  primaryFloor?: number;
  contextFloor?: number;
}
interface Admission {
  id: string;
  score: number;
  rank: number;
}
interface Result {
  raw: RawCase;
  admitted: Admission[];
  pool: Admission[];
  poolCount: number;
  traces: SemanticCandidateTrace[];
}

function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

function admit(scored: ScoredCase, policy: Policy): Result {
  const candidates = scored.traces.filter((trace) => trace.hardEligible && trace.score !== null);
  const allScores = candidates.map((trace) => trace.score!);
  const mid = median(allScores);
  const max = allScores.length ? Math.max(...allScores) : Number.NEGATIVE_INFINITY;
  const eligible = candidates
    .filter((trace) => {
      const score = trace.score!;
      switch (policy.family) {
        case "ABSOLUTE":
          return score >= policy.threshold!;
        case "CENTERED":
          return score >= policy.floor! && score - mid >= policy.lift!;
        case "PEAK_SPREAD":
          return (
            score >= policy.floor! && score >= max - policy.width! && max - mid >= policy.spread!
          );
        case "DUAL_SOURCE": {
          const primary = trace.sourceSimilarities
            .filter((item) => item.role === "PRIMARY")
            .map((item) => item.score);
          const context = trace.sourceSimilarities
            .filter((item) => item.role === "CONTEXT")
            .map((item) => item.score);
          return (
            primary.length > 0 &&
            Math.max(...primary) >= policy.primaryFloor! &&
            (context.length === 0 || Math.max(...context) >= policy.contextFloor!)
          );
        }
      }
    })
    .sort((a, b) => b.score! - a.score! || a.skillId.localeCompare(b.skillId));
  return {
    raw: scored.raw,
    poolCount: eligible.length,
    traces: scored.traces,
    pool: eligible.map((trace, index) => ({
      id: trace.skillId,
      score: trace.score!,
      rank: index + 1,
    })),
    admitted: eligible
      .slice(0, 10)
      .map((trace, index) => ({ id: trace.skillId, score: trace.score!, rank: index + 1 })),
  };
}

function measure(results: readonly Result[], labels: ReadonlyMap<string, Label>) {
  const required = [];
  const forbidden = [];
  let positiveCases = 0;
  let allRequired = 0;
  let macroSum = 0;
  let noneTotal = 0;
  let nonePass = 0;
  let acceptableTotal = 0;
  let acceptableFound = 0;
  const pool = results.map((result) => result.poolCount).sort((a, b) => a - b);
  for (const result of results) {
    const label = labels.get(`${result.raw.corpus}:${result.raw.id}`);
    if (!label) throw Error(`Missing exposed label for ${result.raw.corpus}:${result.raw.id}`);
    const admitted = new Set(result.admitted.map((candidate) => candidate.id));
    const hits = label.required.filter((id) => admitted.has(id)).length;
    if (label.required.length) {
      positiveCases++;
      macroSum += hits / label.required.length;
      if (hits === label.required.length) allRequired++;
    }
    if (label.strictNone) {
      noneTotal++;
      if (result.poolCount === 0) nonePass++;
    }
    acceptableTotal += label.acceptable.length;
    acceptableFound += label.acceptable.filter((id) => admitted.has(id)).length;
    for (const id of label.required) {
      const trace = result.traces.find((item) => item.skillId === id);
      required.push({
        caseId: result.raw.id,
        skillId: id,
        found: admitted.has(id),
        preRank: trace?.preThresholdRank ?? null,
        outcome: admitted.has(id)
          ? "FOUND"
          : !trace?.hardEligible
            ? "HARD_ELIGIBILITY"
            : result.pool.some((item) => item.id === id)
              ? "TOP_K_CUTOFF"
              : "ADMISSION_REJECTED",
      });
    }
    for (const id of label.forbidden)
      forbidden.push({ caseId: result.raw.id, skillId: id, admitted: admitted.has(id) });
  }
  return {
    cases: results.length,
    positiveCases,
    required: {
      hit: required.filter((item) => item.found).length,
      total: required.length,
      preRankAt3: required.filter((item) => item.preRank !== null && item.preRank <= 3).length,
      preRankAt5: required.filter((item) => item.preRank !== null && item.preRank <= 5).length,
      preRankAt10: required.filter((item) => item.preRank !== null && item.preRank <= 10).length,
    },
    macroRecall: positiveCases ? macroSum / positiveCases : 0,
    allRequired: { hit: allRequired, total: positiveCases },
    strictNone: { pass: nonePass, total: noneTotal },
    forbidden: {
      admitted: forbidden.filter((item) => item.admitted).length,
      total: forbidden.length,
    },
    acceptable: { found: acceptableFound, total: acceptableTotal },
    pool: {
      mean: pool.reduce((a, b) => a + b, 0) / (pool.length || 1),
      p90: pool[Math.max(0, Math.ceil(pool.length * 0.9) - 1)] ?? 0,
      max: pool.at(-1) ?? 0,
    },
    requiredDetails: required,
  };
}

function guards(metrics: ReturnType<typeof measure>) {
  return {
    strictNone: metrics.strictNone.pass === metrics.strictNone.total,
    forbidden: metrics.forbidden.admitted / (metrics.forbidden.total || 1) <= 0.2,
    meanPool: metrics.pool.mean <= 5,
    p90Pool: metrics.pool.p90 <= 8,
    maxPool: metrics.pool.max <= 10,
    nonzeroRecall: metrics.required.hit > 0,
  };
}

const policies: Policy[] = [];
for (let step = 0; step <= 18; step++)
  policies.push({ family: "ABSOLUTE", threshold: Math.round((0.3 + step * 0.025) * 1000) / 1000 });
for (const floor of [0.2, 0.3, 0.4])
  for (const lift of [0.05, 0.1, 0.15, 0.2, 0.25])
    policies.push({ family: "CENTERED", floor, lift });
for (const floor of [0.2, 0.3, 0.4])
  for (const width of [0.05, 0.1, 0.15, 0.2])
    for (const spread of [0.1, 0.15, 0.2, 0.25, 0.3])
      policies.push({ family: "PEAK_SPREAD", floor, width, spread });
for (const primaryFloor of [0.25, 0.35, 0.45])
  for (const contextFloor of [0.2, 0.3, 0.4])
    policies.push({ family: "DUAL_SOURCE", primaryFloor, contextFloor });

const mode = process.argv[2];
if (process.argv.length !== 3 || !["--generate", "--check"].includes(mode!))
  throw Error("Usage: retest-srs3e-admission.ts --generate | --check");
const [freezeBytes, vectorBytes, priorGridBytes, rawBytes, labelBytes, reviewBytes] =
  await Promise.all([
    readFile(resolve(calibrationRoot, "calibration-freeze.json")),
    readFile(resolve(evidenceRoot, "profile-vectors-v1.json")),
    readFile(resolve(evidenceRoot, "calibration-grid-v1.json")),
    readFile(resolve(calibrationRoot, "calibration-raw.json")),
    readFile(resolve(calibrationRoot, "calibration-annotations.json")),
    readFile(resolve(calibrationRoot, "calibration-review.json")),
  ]);
if (
  sha256(freezeBytes) !== expected.calibration ||
  sha256(vectorBytes) !== expected.vectors ||
  sha256(priorGridBytes) !== expected.priorGrid
)
  throw Error("Frozen exposed SRS-3E binding drift");
const freeze = JSON.parse(freezeBytes.toString("utf8")) as {
  artifactSha256: Record<string, string>;
};
for (const [name, bytes] of [
  ["raw", rawBytes],
  ["annotations", labelBytes],
  ["review", reviewBytes],
] as const)
  if (freeze.artifactSha256[name] !== sha256(bytes)) throw Error(`Calibration ${name} drift`);
const sourceRaw = JSON.parse(rawBytes.toString("utf8")) as {
  scenarios: Array<{ id: string; fixedAction: AgentAction; request: CoachingRequest }>;
};
const sourceLabels = JSON.parse(labelBytes.toString("utf8")) as { annotations: Label[] };
const reviews = JSON.parse(reviewBytes.toString("utf8")) as {
  reviews: Array<{ decision: string }>;
};
if (
  sourceRaw.scenarios.length !== 24 ||
  sourceLabels.annotations.length !== 24 ||
  reviews.reviews.length !== 24 ||
  reviews.reviews.some((item) => item.decision !== "PASS")
)
  throw Error("Calibration case/review count drift");
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
  throw Error("Frozen profile-vector binding drift");
const srs3b = await loadSrs3Corpus();
if (srs3b.bindings.manifestSha256 !== expected.srs3bManifest) throw Error("SRS-3B freeze drift");
const accepted = srs3b.annotations.filter(
  (annotation) =>
    annotation.reviewState === "ACCEPTED" &&
    srs3b.raw.some((row) => row.id === annotation.id && row.languageGroup === "ENGLISH"),
);
if (accepted.length !== 29) throw Error("SRS-3B accepted English count drift");
const rawCases: RawCase[] = [
  ...accepted.map((annotation) => {
    const row = srs3b.raw.find((item) => item.id === annotation.id)!;
    if (row.revision !== annotation.reviewedRevision) throw Error("SRS-3B revision drift");
    return { id: row.id, corpus: "SRS3B" as const, action: row.fixedAction, request: row.request };
  }),
  ...sourceRaw.scenarios.map((row) => ({
    id: row.id,
    corpus: "CONTROL" as const,
    action: row.fixedAction,
    request: row.request,
  })),
];
const labels = new Map<string, Label>();
for (const annotation of accepted) labels.set(`SRS3B:${annotation.id}`, annotation);
for (const annotation of sourceLabels.annotations)
  labels.set(`CONTROL:${annotation.id}`, annotation);
if (labels.size !== rawCases.length) throw Error("Exposed raw/label binding mismatch");
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
for (const raw of rawCases) {
  const observation = await retrieveSemanticCandidates({
    request: raw.request,
    action: raw.action,
    catalog,
    vectors: vectorArtifact.vectors,
    encoder: memoEncoder,
    config: { alpha: 0, threshold: 0.3, topK: 10, configId: "SRS-3E-ADMISSION-RETEST-SCORING-1" },
  });
  scored.push({ raw, traces: observation.capabilityTraces });
}
const rows = policies.map((policy, index) => {
  const results = scored.map((item) => admit(item, policy));
  const srs3bMetrics = measure(
    results.filter((item) => item.raw.corpus === "SRS3B"),
    labels,
  );
  const controlMetrics = measure(
    results.filter((item) => item.raw.corpus === "CONTROL"),
    labels,
  );
  const combined = measure(results, labels);
  const gate = guards(combined);
  return {
    id: `P${String(index + 1).padStart(3, "0")}`,
    policy,
    srs3b: { ...srs3bMetrics, requiredDetails: undefined },
    controls: { ...controlMetrics, requiredDetails: undefined },
    combined: { ...combined, requiredDetails: undefined },
    guard: gate,
    viable: Object.values(gate).every(Boolean),
    equalCorpusMacroRecall: (srs3bMetrics.macroRecall + controlMetrics.macroRecall) / 2,
  };
});
const viable = rows
  .filter((row) => row.viable)
  .sort(
    (a, b) =>
      b.equalCorpusMacroRecall - a.equalCorpusMacroRecall ||
      a.combined.forbidden.admitted - b.combined.forbidden.admitted ||
      a.combined.pool.mean - b.combined.pool.mean ||
      a.id.localeCompare(b.id),
  );
const bestViable = viable[0] ?? null;
const crossCorpus = ([training, evaluation]: ["SRS3B" | "CONTROL", "SRS3B" | "CONTROL"]) => {
  const trainingRows = rows
    .filter((row) => {
      const metric = training === "SRS3B" ? row.srs3b : row.controls;
      return Object.values(guards({ ...metric, requiredDetails: [] })).every(Boolean);
    })
    .sort((a, b) => {
      const left = training === "SRS3B" ? a.srs3b : a.controls;
      const right = training === "SRS3B" ? b.srs3b : b.controls;
      return right.macroRecall - left.macroRecall || a.id.localeCompare(b.id);
    });
  const chosen = trainingRows[0];
  return {
    training,
    evaluation,
    policyId: chosen?.id ?? null,
    trainingMetrics: chosen ? (training === "SRS3B" ? chosen.srs3b : chosen.controls) : null,
    evaluationMetrics: chosen ? (evaluation === "SRS3B" ? chosen.srs3b : chosen.controls) : null,
  };
};
const anchorIds = new Set([bestViable?.id, "P001"].filter((id): id is string => Boolean(id)));
const caseDiagnostics = rows
  .filter((row) => anchorIds.has(row.id))
  .map((row) => ({
    policyId: row.id,
    cases: scored.map((item) => {
      const result = admit(item, row.policy);
      const label = labels.get(`${item.raw.corpus}:${item.raw.id}`)!;
      return {
        corpus: item.raw.corpus,
        id: item.raw.id,
        action: item.raw.action,
        required: label.required.map((skillId) => {
          const trace = item.traces.find((candidate) => candidate.skillId === skillId);
          return {
            skillId,
            preRank: trace?.preThresholdRank ?? null,
            admittedRank:
              result.admitted.find((candidate) => candidate.id === skillId)?.rank ?? null,
            poolRank: result.pool.find((candidate) => candidate.id === skillId)?.rank ?? null,
            stage: result.admitted.some((candidate) => candidate.id === skillId)
              ? "FOUND"
              : !trace?.hardEligible
                ? "HARD_ELIGIBILITY"
                : result.pool.some((candidate) => candidate.id === skillId)
                  ? "TOP_K_CUTOFF"
                  : "ADMISSION_REJECTED",
          };
        }),
        strictNone: label.strictNone,
        poolCount: result.poolCount,
        topK: result.admitted.map(({ id, rank }) => ({ id, rank })),
      };
    }),
  }));
const artifact = await json({
  schemaVersion: 1,
  experimentId: "SRS-3E-EXPOSED-ADMISSION-RETEST-2",
  evidenceUse: "EXPOSED_CALIBRATION_DIAGNOSTIC_ONLY",
  challengeRunAuthorized: false,
  challengeRead: false,
  selectedConfig: null,
  bindings: {
    calibrationFreezeSha256: sha256(freezeBytes),
    vectorArtifactSha256: sha256(vectorBytes),
    priorGridSha256: sha256(priorGridBytes),
    srs3b: srs3b.bindings,
    model: SEMANTIC_MODEL,
    profileArtifactSha256: FROZEN_SEMANTIC_PROFILE_SHA256,
  },
  scoredCaseCount: scored.length,
  scoredCaseIds: scored.map(({ raw }) => `${raw.corpus}:${raw.id}`),
  alpha: 0,
  topK: 10,
  policyCount: policies.length,
  rows,
  viableCount: viable.length,
  bestViablePolicyId: bestViable?.id ?? null,
  crossCorpus: [crossCorpus(["SRS3B", "CONTROL"]), crossCorpus(["CONTROL", "SRS3B"])],
  caseDiagnostics,
});
if (mode === "--generate") {
  const existing = await readFile(outputPath, "utf8").catch(() => null);
  if (existing !== null && existing !== artifact)
    throw Error("Frozen admission retest drift; new ID required");
  await writeFile(outputPath, artifact, "utf8");
} else if ((await readFile(outputPath, "utf8")) !== artifact) throw Error("Admission retest drift");
process.stdout.write(
  JSON.stringify({
    artifactSha256: sha256(artifact),
    scoredCases: scored.length,
    policyCount: policies.length,
    viableCount: viable.length,
    bestViablePolicyId: bestViable?.id ?? null,
    bestViable: bestViable ? { policy: bestViable.policy, combined: bestViable.combined } : null,
    crossCorpus: [crossCorpus(["SRS3B", "CONTROL"]), crossCorpus(["CONTROL", "SRS3B"])].map(
      (row) => ({
        training: row.training,
        policyId: row.policyId,
        trainingRecall: row.trainingMetrics?.required,
        evaluationRecall: row.evaluationMetrics?.required,
        evaluationNone: row.evaluationMetrics?.strictNone,
      }),
    ),
  }) + "\n",
);
