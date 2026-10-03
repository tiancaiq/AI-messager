import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { format } from "prettier";
import { srs3fOperationRaw } from "../packages/test-fixtures/src/srs3f-operation-raw.js";
import { contentDigest, packageRoot } from "../packages/skills/authoring/generator.js";
import {
  loadOperationCatalog,
  operationSourcePath,
  renderOperationProfileArtifact,
  type OperationId,
} from "../packages/skills/authoring/operation-profiles.js";
import {
  operationSupportPath,
  renderOperationSupportArtifact,
} from "../packages/skills/authoring/operation-skill-support.js";
import {
  loadLocalSemanticEncoder,
  SEMANTIC_MODEL,
} from "../packages/skills/tests/srs3e-semantic-model.js";
import type { SemanticEncoder } from "../packages/skills/tests/srs3e-semantic-retrieval.js";
import { srs3fOperationAnnotations } from "../packages/skills/tests/srs3f-operation-annotations.js";
import {
  operationCorpusSourceDigests,
  validateOperationCorpus,
} from "../packages/skills/tests/srs3f-operation-corpus.js";
import {
  detectCommunicationOperations,
  embedOperationDocuments,
  operationPositiveDocuments,
  type OperationDetectorConfig,
  type OperationObservation,
  type OperationPositiveVector,
  type OperationSourcePolicy,
} from "../packages/skills/tests/srs3f-operation-detector.js";

const outputRoot = resolve(packageRoot, "tests/fixtures/srs3f");
const sha256 = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest("hex");
const json = (value: unknown) =>
  format(JSON.stringify(value), {
    parser: "json",
    printWidth: 100,
    tabWidth: 2,
    endOfLine: "lf",
  });
const thresholds = [0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5] as const;
const sourcePolicies = ["PRIMARY_ONLY", "PRIMARY_WITH_CONTEXT"] as const;
const mode = process.argv[2];
if (process.argv.length !== 3 || !["--generate", "--check"].includes(mode!))
  throw Error("Usage: evaluate-srs3f-operations.ts --generate | --check");

async function immutableFile(name: string, value: string) {
  const path = resolve(outputRoot, name);
  const prior = await readFile(path, "utf8").catch(() => null);
  if (mode === "--check") {
    if (prior !== value) throw Error(`SRS-3F-A artifact drift: ${name}`);
  } else {
    if (prior !== null && prior !== value)
      throw Error(`Immutable SRS-3F-A artifact changed; new ID required: ${name}`);
    await writeFile(path, value, "utf8");
  }
  return sha256(value);
}

interface CaseScore {
  id: string;
  split: "CALIBRATION" | "AUDIT";
  action: string;
  expected: readonly OperationId[];
  observation: OperationObservation;
}
function predicted(row: CaseScore, threshold: number): OperationId[] {
  return row.observation.allScores.filter((item) => item.score >= threshold).map((item) => item.id);
}
function measure(cases: readonly CaseScore[], threshold: number) {
  let correct = 0;
  let predictedTotal = 0;
  let requiredTotal = 0;
  let multiTotal = 0;
  let multiAll = 0;
  let zeroTotal = 0;
  let zeroFalsePositive = 0;
  let ownershipCriticalProxy = 0;
  const sensitive = new Set<OperationId>([
    "OWN_ERROR",
    "EXPRESS_REGRET",
    "REFUSE_OPTION",
    "STATE_CONTINUING_LIMIT",
    "COORDINATE_FUTURE",
  ]);
  const ids = new Set<OperationId>(cases.flatMap((row) => [...row.expected]));
  const perOperation = Object.fromEntries(
    [...ids].sort().map((id) => [id, { hit: 0, total: 0, falsePositive: 0 }]),
  ) as Record<OperationId, { hit: number; total: number; falsePositive: number }>;
  const modeCounts: Record<string, { hit: number; required: number; predicted: number }> = {};
  const details = [];
  for (const row of cases) {
    const found = predicted(row, threshold);
    const foundSet = new Set(found);
    const expectedSet = new Set(row.expected);
    const hit = row.expected.filter((id) => foundSet.has(id));
    const extra = found.filter((id) => !expectedSet.has(id));
    correct += hit.length;
    predictedTotal += found.length;
    requiredTotal += row.expected.length;
    const mode = (modeCounts[row.action] ??= { hit: 0, required: 0, predicted: 0 });
    mode.hit += hit.length;
    mode.required += row.expected.length;
    mode.predicted += found.length;
    if (row.expected.length > 1) {
      multiTotal++;
      if (hit.length === row.expected.length) multiAll++;
    }
    if (!row.expected.length) {
      zeroTotal++;
      if (found.length) zeroFalsePositive++;
      if (found.some((id) => sensitive.has(id))) ownershipCriticalProxy++;
    }
    for (const id of row.expected) {
      perOperation[id] ??= { hit: 0, total: 0, falsePositive: 0 };
      perOperation[id].total++;
      if (foundSet.has(id)) perOperation[id].hit++;
    }
    for (const id of extra) {
      perOperation[id] ??= { hit: 0, total: 0, falsePositive: 0 };
      perOperation[id].falsePositive++;
    }
    details.push({
      id: row.id,
      action: row.action,
      status: row.observation.status,
      expected: row.expected,
      predicted: found,
      missed: row.expected.filter((id) => !foundSet.has(id)),
      extra,
      scores: row.observation.allScores.map((item) => ({
        id: item.id,
        score: item.score,
        rank: item.rank,
        winningSource: item.winningSource,
        profileDigest: item.profileDigest,
        sourceContributions: item.sourceContributions,
      })),
    });
  }
  const precision = predictedTotal ? correct / predictedTotal : 0;
  const recall = requiredTotal ? correct / requiredTotal : 0;
  const perOperationRows = Object.entries(perOperation).sort(([a], [b]) => a.localeCompare(b));
  const macroRecall =
    perOperationRows.reduce((sum, [, count]) => sum + count.hit / (count.total || 1), 0) /
    (perOperationRows.length || 1);
  return {
    cases: cases.length,
    micro: {
      hit: correct,
      predicted: predictedTotal,
      required: requiredTotal,
      precision,
      recall,
      f1: precision + recall ? (2 * precision * recall) / (precision + recall) : 0,
    },
    macroRecall,
    perOperation: Object.fromEntries(perOperationRows),
    multi: { allFound: multiAll, total: multiTotal },
    zero: { falsePositiveCases: zeroFalsePositive, total: zeroTotal },
    ownershipCriticalProxy,
    modes: modeCounts,
    details,
  };
}

async function scoreSplit(
  split: "CALIBRATION" | "AUDIT",
  policy: OperationSourcePolicy,
  catalog: Awaited<ReturnType<typeof loadOperationCatalog>>,
  vectors: readonly OperationPositiveVector[],
  encoder: SemanticEncoder,
  profileSha256: string,
): Promise<CaseScore[]> {
  const annotationById = new Map(srs3fOperationAnnotations.map((item) => [item.id, item]));
  const out: CaseScore[] = [];
  for (const row of srs3fOperationRaw.filter((item) => item.split === split)) {
    const observation = await detectCommunicationOperations({
      request: row.request,
      action: row.fixedAction,
      catalog,
      vectors,
      encoder,
      config: {
        id: `SRS-3F-A-${policy}-RAW-SCORING-1`,
        threshold: -1,
        sourcePolicy: policy,
        modelDigest: contentDigest(SEMANTIC_MODEL),
        profileArtifactSha256: profileSha256,
      },
    });
    out.push({
      id: row.id,
      split,
      action: row.fixedAction,
      expected: annotationById.get(row.id)!.operations,
      observation,
    });
  }
  return out;
}

const corpus = validateOperationCorpus();
const [profiles, mapping, profileSourceBytes, mappingSourceBytes, sourceDigests] =
  await Promise.all([
    renderOperationProfileArtifact(),
    renderOperationSupportArtifact(),
    readFile(operationSourcePath),
    readFile(operationSupportPath),
    operationCorpusSourceDigests(),
  ]);
const catalog = await loadOperationCatalog();
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
const documents = operationPositiveDocuments(catalog);
const vectors = await embedOperationDocuments(documents, memoEncoder);
const vectorJson = await json({
  artifactVersion: 1,
  experimentId: "SRS-3F-A-OPERATION-VECTORS-1",
  profileArtifactSha256: profiles.sha256,
  model: SEMANTIC_MODEL,
  vectors: vectors.map((item) => ({
    ...item,
    vectorSha256: sha256(JSON.stringify(item.vector)),
  })),
});
const corpusManifest = await json({
  schemaVersion: 1,
  experimentId: "SRS-3F-A-OPERATION-CORPUS-2",
  reviewQualification: "CODEX_SELF_REVIEW_PROVISIONAL_NOT_HUMAN_OR_INDEPENDENT",
  sourceSha256: {
    ...sourceDigests,
    operationProfiles: sha256(profileSourceBytes),
    operationSupport: sha256(mappingSourceBytes),
  },
  profileArtifactSha256: profiles.sha256,
  mappingArtifactSha256: mapping.sha256,
  vectorArtifactSha256: sha256(vectorJson),
  coverage: corpus.counts,
  splitRule: "ODD_ID_CALIBRATION_EVEN_ID_AUDIT_UNIQUE_FAMILIES",
  challengeContentNotInspected: true,
  challengeOverlapQualification:
    "NEW_SYNTHETIC_AUTHORING_NO_CHALLENGE_SOURCE_IMPORTED_SEMANTIC_OVERLAP_UNVERIFIED",
});
if (mode === "--generate") await mkdir(outputRoot, { recursive: true });
await immutableFile("operation-profiles-v1.json", profiles.json);
await immutableFile("operation-skill-support-v1.json", mapping.json);
await immutableFile("operation-vectors-v1.json", vectorJson);
await immutableFile("operation-corpus-freeze-v2.json", corpusManifest);

const calibrationScores = new Map<OperationSourcePolicy, CaseScore[]>();
for (const policy of sourcePolicies)
  calibrationScores.set(
    policy,
    await scoreSplit("CALIBRATION", policy, catalog, vectors, memoEncoder, profiles.sha256),
  );
const grid = sourcePolicies.flatMap((policy) =>
  thresholds.map((threshold) => {
    const metrics = measure(calibrationScores.get(policy)!, threshold);
    return {
      policy,
      threshold,
      metrics: { ...metrics, details: undefined },
    };
  }),
);
grid.sort(
  (a, b) =>
    b.metrics.micro.f1 - a.metrics.micro.f1 ||
    a.metrics.zero.falsePositiveCases - b.metrics.zero.falsePositiveCases ||
    b.metrics.micro.precision - a.metrics.micro.precision ||
    b.threshold - a.threshold ||
    sourcePolicies.indexOf(a.policy) - sourcePolicies.indexOf(b.policy),
);
const chosen = grid[0]!;
const config: OperationDetectorConfig = {
  id: "SRS-3F-A-OPERATION-DETECTOR-CALIBRATED-2",
  threshold: chosen.threshold,
  sourcePolicy: chosen.policy,
  modelDigest: contentDigest(SEMANTIC_MODEL),
  profileArtifactSha256: profiles.sha256,
};
const calibrationArtifact = await json({
  schemaVersion: 1,
  experimentId: "SRS-3F-A-OPERATION-CALIBRATION-2",
  corpusManifestSha256: sha256(corpusManifest),
  vectorArtifactSha256: sha256(vectorJson),
  thresholdGrid: thresholds,
  sourcePolicies,
  selectionRule:
    "MAX_MICRO_F1_THEN_FEWER_ZERO_FP_THEN_HIGHER_PRECISION_THEN_HIGHER_THRESHOLD_THEN_PRIMARY_ONLY",
  rows: grid,
  selected: { policy: chosen.policy, threshold: chosen.threshold },
});
const configArtifact = await json({
  schemaVersion: 1,
  experimentId: config.id,
  config,
  selectionEvidenceSha256: sha256(calibrationArtifact),
  corpusManifestSha256: sha256(corpusManifest),
  vectorArtifactSha256: sha256(vectorJson),
  reviewQualification: "CODEX_SELF_REVIEW_PROVISIONAL_NOT_HUMAN_OR_INDEPENDENT",
  auditRunAuthorized: true,
  candidateFusionAuthorized: false,
});
await immutableFile("operation-calibration-v2.json", calibrationArtifact);
await immutableFile("operation-config-v2.json", configArtifact);

// The config artifact above is frozen and verified before scoring AUDIT raw rows.
const auditScores = await scoreSplit(
  "AUDIT",
  config.sourcePolicy,
  catalog,
  vectors,
  memoEncoder,
  profiles.sha256,
);
const auditMetrics = measure(auditScores, config.threshold);
const perOpValues = Object.values(auditMetrics.perOperation);
const numericGates = {
  microRecall: auditMetrics.micro.recall >= 0.75,
  microPrecision: auditMetrics.micro.precision >= 0.7,
  perOperationRecall: perOpValues.every((item) => item.hit / (item.total || 1) >= 0.5),
  multiAll: auditMetrics.multi.allFound / (auditMetrics.multi.total || 1) >= 0.6,
  zeroNoise: auditMetrics.zero.falsePositiveCases / (auditMetrics.zero.total || 1) <= 0.2,
  noCriticalProxy: auditMetrics.ownershipCriticalProxy === 0,
};
const auditArtifact = await json({
  schemaVersion: 1,
  experimentId: "SRS-3F-A-OPERATION-AUDIT-2",
  split: "EXPOSED_FAMILY_DISJOINT_AUDIT_NOT_HELD_OUT",
  reviewQualification: "CODEX_SELF_REVIEW_PROVISIONAL_NOT_HUMAN_OR_INDEPENDENT",
  configArtifactSha256: sha256(configArtifact),
  corpusManifestSha256: sha256(corpusManifest),
  vectorArtifactSha256: sha256(vectorJson),
  metrics: auditMetrics,
  numericGates,
  numericPass: Object.values(numericGates).every(Boolean),
  independentSemanticReview: "PENDING",
  humanApproval: "NOT_REQUESTED",
  nextIncrementAuthorized: false,
});
await immutableFile("operation-audit-v2.json", auditArtifact);
process.stdout.write(
  JSON.stringify({
    profileSha256: profiles.sha256,
    mappingSha256: mapping.sha256,
    vectorSha256: sha256(vectorJson),
    corpusSha256: sha256(corpusManifest),
    configSha256: sha256(configArtifact),
    auditSha256: sha256(auditArtifact),
    coverage: corpus.counts,
    selected: { policy: chosen.policy, threshold: chosen.threshold },
    calibration: chosen.metrics,
    audit: { ...auditMetrics, details: undefined },
    numericGates,
  }) + "\n",
);
