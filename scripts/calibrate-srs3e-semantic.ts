import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { format } from "prettier";
import { loadSrs3Corpus } from "../packages/skills/tests/srs3-ranking-corpus.js";
import { srs3dRecallRegression } from "../packages/skills/tests/srs3d-recall-regression.js";
import {
  loadLocalSemanticEncoder,
  loadPositiveDocuments,
  embedPositiveDocuments,
  loadProductionSemanticCatalog,
  SEMANTIC_MODEL,
  FROZEN_SEMANTIC_PROFILE_SHA256,
} from "../packages/skills/tests/srs3e-semantic-model.js";
import {
  retrieveSemanticCandidates,
  type SemanticConfig,
  type SemanticObservation,
  type SemanticEncoder,
} from "../packages/skills/tests/srs3e-semantic-retrieval.js";

const root = resolve(import.meta.dirname, "..");
const outputRoot = resolve(root, "packages/skills/tests/fixtures/srs3e-semantic");
const calibrationRoot = resolve(outputRoot, "calibration-v2");
const sha256 = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest("hex");
const json = (value: unknown) =>
  format(JSON.stringify(value), {
    parser: "json",
    printWidth: 100,
    tabWidth: 2,
    endOfLine: "lf",
  });
interface Label {
  id: string;
  required: string[];
  acceptable: string[];
  forbidden: string[];
  strictNone: boolean;
}
interface Case {
  id: string;
  action: Parameters<typeof retrieveSemanticCandidates>[0]["action"];
  request: Parameters<typeof retrieveSemanticCandidates>[0]["request"];
  label: Label;
  corpus: "SRS3B" | "CALIBRATION";
}
interface Observation {
  case: Case;
  result: SemanticObservation;
}

function poolStats(observations: readonly Observation[]) {
  const values = observations.map(({ result }) => result.counts.positivePool).sort((a, b) => a - b);
  return {
    mean: values.reduce((a, b) => a + b, 0) / values.length,
    p50: values[Math.max(0, Math.ceil(values.length * 0.5) - 1)]!,
    p90: values[Math.max(0, Math.ceil(values.length * 0.9) - 1)]!,
    max: values.at(-1)!,
  };
}
function measures(observations: readonly Observation[]) {
  const positives = observations.filter(({ case: row }) => row.label.required.length > 0);
  const fractions = positives.map(
    ({ case: row, result }) =>
      row.label.required.filter((id) => result.topK.some((candidate) => candidate.skillId === id))
        .length / row.label.required.length,
  );
  const required = observations.flatMap(({ case: row, result }) =>
    row.label.required.map((skillId) => ({
      caseId: row.id,
      skillId,
      preThresholdRank:
        result.capabilityTraces.find((trace) => trace.skillId === skillId)?.preThresholdRank ??
        null,
      topKRank:
        result.capabilityTraces.find((trace) => trace.skillId === skillId)?.topKRank ?? null,
      disappearedAt:
        result.capabilityTraces.find((trace) => trace.skillId === skillId)?.disappearedAt ??
        "HARD_ELIGIBILITY",
    })),
  );
  const forbidden = observations.flatMap(({ case: row, result }) =>
    row.label.forbidden.map((skillId) => ({
      caseId: row.id,
      skillId,
      admitted: result.topK.some((candidate) => candidate.skillId === skillId),
    })),
  );
  const none = observations.filter(({ case: row }) => row.label.strictNone);
  return {
    caseCount: observations.length,
    positiveCases: positives.length,
    requiredOccurrences: required.length,
    requiredHitCount: required.filter((row) => row.topKRank !== null).length,
    macroRecall: fractions.reduce((a, b) => a + b, 0) / (fractions.length || 1),
    preThresholdRecallAt3:
      required.filter((row) => row.preThresholdRank !== null && row.preThresholdRank <= 3).length /
      (required.length || 1),
    preThresholdRecallAt5:
      required.filter((row) => row.preThresholdRank !== null && row.preThresholdRank <= 5).length /
      (required.length || 1),
    preThresholdRecallAt10:
      required.filter((row) => row.preThresholdRank !== null && row.preThresholdRank <= 10).length /
      (required.length || 1),
    strictNonePass: none.filter(({ result }) => result.topK.length === 0).length,
    strictNoneTotal: none.length,
    forbiddenAdmissions: forbidden.filter((row) => row.admitted).length,
    forbiddenTotal: forbidden.length,
    required,
    forbidden,
  };
}
function rescore(
  base: SemanticObservation,
  alpha: SemanticConfig["alpha"],
  threshold: number,
): SemanticObservation {
  const copy: SemanticObservation = structuredClone(base);
  copy.capabilityTraces.forEach((trace) => {
    if (trace.score === null) return;
    const primary = trace.sourceSimilarities
      .filter((item) => item.role === "PRIMARY")
      .sort((a, b) => b.score - a.score)[0];
    const context = trace.sourceSimilarities
      .filter((item) => item.role === "CONTEXT")
      .sort((a, b) => b.score - a.score)[0];
    if (!primary) throw Error("Scored candidate without primary source");
    trace.score = context ? (1 - alpha) * primary.score + alpha * context.score : primary.score;
    trace.preThresholdRank = null;
    trace.positivePoolRank = null;
    trace.topKRank = null;
    trace.admitted = false;
    trace.disappearedAt = null;
  });
  const ranked = copy.capabilityTraces
    .filter((trace) => trace.score !== null)
    .sort((a, b) => b.score! - a.score! || a.skillId.localeCompare(b.skillId));
  ranked.forEach((trace, index) => {
    trace.preThresholdRank = index + 1;
  });
  const admitted = ranked.filter((trace) => trace.score! >= threshold);
  admitted.forEach((trace, index) => {
    trace.admitted = true;
    trace.positivePoolRank = index + 1;
    if (index < 10) trace.topKRank = index + 1;
    else trace.disappearedAt = "TOP_K_CUTOFF";
  });
  ranked
    .filter((trace) => !trace.admitted)
    .forEach((trace) => {
      trace.disappearedAt = "SEMANTIC_THRESHOLD_MISS";
    });
  copy.topK = admitted
    .slice(0, 10)
    .map((trace, index) => ({ skillId: trace.skillId, score: trace.score!, rank: index + 1 }));
  copy.counts.positivePool = admitted.length;
  copy.counts.topK = copy.topK.length;
  return copy;
}

const mode = process.argv[2];
if (process.argv.length !== 3 || !["--generate", "--check"].includes(mode!))
  throw Error("Usage: calibrate-srs3e-semantic.ts --generate | --check");
const manifestBytes = await readFile(resolve(calibrationRoot, "calibration-freeze.json"));
const calibrationManifest = JSON.parse(manifestBytes.toString("utf8")) as {
  calibrationId: string;
  artifactSha256: Record<string, string>;
};
if (
  calibrationManifest.calibrationId !== "SRS-3E-SEMANTIC-CALIBRATION-2" ||
  sha256(manifestBytes) !== "bcb55ca5ee19973e974550c75a06892e58cfa8f0bc9380efcfce790eb25e0f8a"
)
  throw Error("SRS-3E calibration manifest binding drift");
const [rawBytes, annotationBytes, reviewBytes] = await Promise.all(
  ["raw", "annotations", "review"].map((name) =>
    readFile(resolve(calibrationRoot, `calibration-${name}.json`)),
  ),
);
for (const [name, bytes] of [
  ["raw", rawBytes],
  ["annotations", annotationBytes],
  ["review", reviewBytes],
] as const)
  if (sha256(bytes) !== calibrationManifest.artifactSha256[name])
    throw Error(`Calibration ${name} drift`);
const raw = JSON.parse(rawBytes.toString("utf8")) as {
  scenarios: Array<{ id: string; fixedAction: Case["action"]; request: Case["request"] }>;
};
const labels = JSON.parse(annotationBytes.toString("utf8")) as { annotations: Label[] };
const reviews = JSON.parse(reviewBytes.toString("utf8")) as {
  reviews: Array<{ id: string; decision: string }>;
};
if (
  raw.scenarios.length !== 24 ||
  labels.annotations.length !== 24 ||
  reviews.reviews.some((row) => row.decision !== "PASS")
)
  throw Error("Calibration review/count drift");
const calibrationCases: Case[] = raw.scenarios.map((scenario, index) => {
  const label = labels.annotations[index]!;
  if (label.id !== scenario.id) throw Error("Calibration label binding mismatch");
  return {
    id: scenario.id,
    action: scenario.fixedAction,
    request: scenario.request,
    label,
    corpus: "CALIBRATION",
  };
});
const corpus = await loadSrs3Corpus();
const accepted = corpus.annotations.filter(
  (annotation) =>
    annotation.reviewState === "ACCEPTED" &&
    corpus.raw.some((row) => row.id === annotation.id && row.languageGroup === "ENGLISH"),
);
if (accepted.length !== 29) throw Error("SRS-3B English source drift");
const srs3bCases: Case[] = accepted.map((label) => {
  const scenario = corpus.raw.find((item) => item.id === label.id)!;
  if (label.reviewedRevision !== scenario.revision) throw Error("SRS-3B review revision drift");
  return {
    id: scenario.id,
    action: scenario.fixedAction,
    request: scenario.request,
    label: {
      id: label.id,
      required: label.required,
      acceptable: label.acceptable,
      forbidden: label.forbidden,
      strictNone: label.strictNone,
    },
    corpus: "SRS3B",
  };
});
const encoder = await loadLocalSemanticEncoder();
const cached = new Map<string, readonly number[]>();
const memoEncoder: SemanticEncoder = {
  tokenCount: (text) => encoder.tokenCount(text),
  async encode(text) {
    let vector = cached.get(text);
    if (!vector) {
      vector = await encoder.encode(text);
      cached.set(text, vector);
    }
    return vector;
  },
};
const documents = await loadPositiveDocuments();
const vectors = await embedPositiveDocuments(memoEncoder);
const catalog = await loadProductionSemanticCatalog();
if (
  catalog.length !== 21 ||
  documents.length !== vectors.length ||
  new Set(vectors.map((row) => row.skillId)).size !== 14
)
  throw Error("Approved semantic catalog/profile count drift");
const baseConfig: SemanticConfig = {
  alpha: 0,
  threshold: 0.3,
  topK: 10,
  configId: "SRS-3E-CALIBRATION-GRID-1",
};
const cases = [...srs3bCases, ...calibrationCases];
const baseObservations: Observation[] = [];
for (const row of cases)
  baseObservations.push({
    case: row,
    result: await retrieveSemanticCandidates({
      request: row.request,
      action: row.action,
      catalog,
      vectors,
      encoder: memoEncoder,
      config: baseConfig,
    }),
  });
const grid = [];
for (const alpha of [0, 0.2, 0.35] as const)
  for (let step = 0; step <= 18; step++) {
    const threshold = Math.round((0.3 + 0.025 * step) * 1000) / 1000;
    const observations = baseObservations.map(({ case: row, result }) => ({
      case: row,
      result: rescore(result, alpha, threshold),
    }));
    const b = measures(observations.filter(({ case: row }) => row.corpus === "SRS3B"));
    const k = measures(observations.filter(({ case: row }) => row.corpus === "CALIBRATION"));
    const pool = poolStats(observations);
    const forbiddenAdmissions = b.forbiddenAdmissions + k.forbiddenAdmissions;
    const forbiddenTotal = b.forbiddenTotal + k.forbiddenTotal;
    grid.push({
      alpha,
      threshold,
      macroRecall: (b.macroRecall + k.macroRecall) / 2,
      srs3bMacroRecall: b.macroRecall,
      controlMacroRecall: k.macroRecall,
      strictNonePass: b.strictNonePass + k.strictNonePass,
      strictNoneTotal: b.strictNoneTotal + k.strictNoneTotal,
      forbiddenAdmissions,
      forbiddenTotal,
      pool,
      feasible:
        b.strictNonePass + k.strictNonePass === b.strictNoneTotal + k.strictNoneTotal &&
        forbiddenAdmissions / (forbiddenTotal || 1) <= 0.2 &&
        pool.mean <= 5 &&
        pool.p90 <= 8,
    });
  }
const feasible = grid
  .filter((row) => row.feasible)
  .sort(
    (a, b) =>
      b.macroRecall - a.macroRecall ||
      a.forbiddenAdmissions - b.forbiddenAdmissions ||
      a.pool.mean - b.pool.mean ||
      b.threshold - a.threshold ||
      a.alpha - b.alpha,
  );
const selected = feasible[0] ?? null;
const selectedObservations = selected
  ? baseObservations.map(({ case: row, result }) => ({
      case: row,
      result: rescore(result, selected.alpha, selected.threshold),
    }))
  : [];
const dObservations = selected
  ? await Promise.all(
      srs3dRecallRegression.map(async (row) => ({
        id: row.id,
        target: row.capability,
        class: row.class,
        result: await retrieveSemanticCandidates({
          request: row.request,
          action: row.action,
          catalog,
          vectors,
          encoder: memoEncoder,
          config: {
            alpha: selected.alpha as SemanticConfig["alpha"],
            threshold: selected.threshold,
            topK: 10,
            configId: "SRS-3E-CALIBRATION-GRID-1",
          },
        }),
      })),
    )
  : [];
const dGuard = Object.fromEntries(
  ["POSITIVE", "HARD_NEIGHBOR", "NEGATIVE"].map((kind) => {
    const rows = dObservations.filter((row) => row.class === kind);
    return [
      kind,
      {
        total: rows.length,
        targetAdmitted: rows.filter((row) =>
          row.result.topK.some((item) => item.skillId === row.target),
        ).length,
      },
    ];
  }),
);
const vectorArtifact = await json({
  schemaVersion: 1,
  vectorSetId: "SRS-3E-PROFILE-VECTORS-1",
  profileArtifactSha256: FROZEN_SEMANTIC_PROFILE_SHA256,
  model: SEMANTIC_MODEL,
  serializer: "PROFILE_POSITIVE_FRAGMENT_NFC_V1_FLOAT7",
  vectors: vectors.map((row) => ({
    ...row,
    vectorSha256: sha256(JSON.stringify(row.vector)),
  })),
});
const gridArtifact = await json({
  schemaVersion: 1,
  calibrationGridId: "SRS-3E-CALIBRATION-GRID-1",
  calibrationManifestSha256: sha256(manifestBytes),
  srs3bBindings: corpus.bindings,
  dSourceSha256: sha256(
    await readFile(resolve(root, "packages/skills/tests/srs3d-recall-regression.ts")),
  ),
  vectorArtifactSha256: sha256(vectorArtifact),
  grid,
  selected,
  dGuard,
  selectedCorpusMeasures: selected
    ? {
        srs3b: measures(selectedObservations.filter(({ case: row }) => row.corpus === "SRS3B")),
        controls: measures(
          selectedObservations.filter(({ case: row }) => row.corpus === "CALIBRATION"),
        ),
      }
    : null,
});
const configArtifact = selected
  ? await json({
      schemaVersion: 1,
      configId: "SRS-3E-SEMANTIC-FIRST-RUN-1",
      reviewState: "PENDING_HUMAN_PRE_CHALLENGE_REVIEW",
      challengeRunAuthorized: false,
      model: SEMANTIC_MODEL,
      profileArtifactSha256: FROZEN_SEMANTIC_PROFILE_SHA256,
      positiveVectorArtifactSha256: sha256(vectorArtifact),
      calibrationGridSha256: sha256(gridArtifact),
      calibrationManifestSha256: sha256(manifestBytes),
      srs3bBindings: corpus.bindings,
      sourceSerialization: "SOURCE_AWARE_NFC_WHITESPACE_V1",
      positiveSerialization: "PROFILE_POSITIVE_FRAGMENT_NFC_V1_FLOAT7",
      aggregation: "MAX_COSINE_PER_SOURCE_THEN_PRIMARY_CONTEXT_ALPHA",
      negativePenalty: false,
      hardGates: [
        "PRODUCTION_ONLY",
        "ACTIVE",
        "FIXED_ACTION",
        "LANGUAGE",
        "CODE_SWITCH_PREREQUISITE",
        "ATOMIC_LANE",
      ],
      tieRule: "HIGHER_SCORE_THEN_SKILL_ID",
      topK: 10,
      alpha: selected.alpha,
      threshold: selected.threshold,
    })
  : null;
const dispositionArtifact = await json({
  schemaVersion: 1,
  dispositionId: "SRS-3E-SEMANTIC-CALIBRATION-DISPOSITION-1",
  configArtifactSha256: configArtifact ? sha256(configArtifact) : null,
  gridArtifactSha256: sha256(gridArtifact),
  status:
    selected?.macroRecall === 0
      ? "STOP_ZERO_RECALL"
      : selected
        ? "PENDING_HUMAN_REVIEW"
        : "STOP_NO_FEASIBLE_PAIR",
  challengeRunAuthorized: false,
  reason:
    selected?.macroRecall === 0
      ? "All guard-satisfying grid pairs have zero positive-case recall; no non-degenerate first-run configuration exists."
      : selected
        ? "A separate human configuration review is required before challenge evaluation."
        : "No predeclared grid pair satisfies all calibration guards.",
});
await mkdir(outputRoot, { recursive: true });
const outputs = {
  "profile-vectors-v1.json": vectorArtifact,
  "calibration-grid-v1.json": gridArtifact,
  ...(configArtifact ? { "first-run-config-v1.json": configArtifact } : {}),
  "calibration-disposition-v1.json": dispositionArtifact,
};
if (mode === "--generate") {
  for (const [name, content] of Object.entries(outputs)) {
    const path = resolve(outputRoot, name);
    const existing = await readFile(path, "utf8").catch(() => null);
    if (existing !== null && existing !== content)
      throw Error(`Frozen semantic artifact drift: ${name}`);
    await writeFile(path, content, "utf8");
  }
} else
  for (const [name, content] of Object.entries(outputs))
    if ((await readFile(resolve(outputRoot, name), "utf8")) !== content)
      throw Error(`Frozen semantic artifact drift: ${name}`);
process.stdout.write(
  JSON.stringify({
    selected,
    feasiblePairs: feasible.length,
    vectorSha256: sha256(vectorArtifact),
    gridSha256: sha256(gridArtifact),
    configSha256: configArtifact ? sha256(configArtifact) : null,
    dispositionSha256: sha256(dispositionArtifact),
    dGuard,
  }) + "\n",
);
