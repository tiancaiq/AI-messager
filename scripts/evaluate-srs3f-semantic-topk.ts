import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
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
  type SemanticEncoder,
} from "../packages/skills/tests/srs3e-semantic-retrieval.js";
import {
  retrieveAdmissionFreeTopK,
  type TopKObservation,
} from "../packages/skills/tests/srs3f-semantic-topk.js";

const root = resolve(import.meta.dirname, "..");
const evidenceRoot = resolve(root, "packages/skills/tests/fixtures/srs3e-semantic");
const calibrationRoot = resolve(evidenceRoot, "calibration-v2");
const outputRoot = resolve(root, "packages/skills/tests/fixtures/srs3f");
const outputPath = resolve(outputRoot, "semantic-topk-exposed-v1.json");
const configPath = resolve(outputRoot, "semantic-topk-proposed-config-v1.json");
const reportPath = resolve(root, "docs/skills/srs-3f-b-semantic-topk.md");
const sha256 = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest("hex");
const json = (value: unknown) =>
  format(JSON.stringify(value), { parser: "json", printWidth: 100, tabWidth: 2, endOfLine: "lf" });
const expected = {
  calibration: "bcb55ca5ee19973e974550c75a06892e58cfa8f0bc9380efcfce790eb25e0f8a",
  vectors: "b02d4664585c29d3a0ac33e41c6827d2bd4d5d065fd7eb289182084c6dc05588",
  srs3bManifest: "0700162fd5b7c656c1d6134cdd3d69baa9a824eb4a01a598b7ea6d4b4c666362",
  profile: "b061bf17a04e696ad78af45016e6803a96f79f0e617fcb2800a4a591fbc33d1c",
  scorerSource: "f436123a66faf591c8b88263d8b5d790528b1ceb61c79c0db64cedd433cde6a5",
} as const;

type Corpus = "SRS3B" | "CONTROL";
interface RawCase {
  id: string;
  corpus: Corpus;
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
interface Scored {
  key: string;
  action: AgentAction;
  observation: TopKObservation;
}
const mode = process.argv[2];
if (process.argv.length !== 3 || !["--generate", "--check"].includes(mode!))
  throw Error("Usage: evaluate-srs3f-semantic-topk.ts --generate | --check");

const [freezeBytes, rawBytes, annotationBytes, reviewBytes, vectorBytes, scorerSource] =
  await Promise.all([
    readFile(resolve(calibrationRoot, "calibration-freeze.json")),
    readFile(resolve(calibrationRoot, "calibration-raw.json")),
    readFile(resolve(calibrationRoot, "calibration-annotations.json")),
    readFile(resolve(calibrationRoot, "calibration-review.json")),
    readFile(resolve(evidenceRoot, "profile-vectors-v1.json")),
    readFile(resolve(root, "packages/skills/tests/srs3e-semantic-retrieval.ts")),
  ]);
if (
  sha256(freezeBytes) !== expected.calibration ||
  sha256(vectorBytes) !== expected.vectors ||
  sha256(scorerSource) !== expected.scorerSource ||
  FROZEN_SEMANTIC_PROFILE_SHA256 !== expected.profile
)
  throw Error("Frozen SRS-3E source/profile/vector or exposed binding drift");
const freeze = JSON.parse(freezeBytes.toString("utf8")) as {
  artifactSha256: Record<string, string>;
};
for (const [name, bytes] of [
  ["raw", rawBytes],
  ["annotations", annotationBytes],
  ["review", reviewBytes],
] as const)
  if (freeze.artifactSha256[name] !== sha256(bytes)) throw Error(`Exposed ${name} drift`);
const sourceRaw = JSON.parse(rawBytes.toString("utf8")) as {
  scenarios: Array<{ id: string; fixedAction: AgentAction; request: CoachingRequest }>;
};
const sourceLabels = JSON.parse(annotationBytes.toString("utf8")) as { annotations: Label[] };
const sourceReviews = JSON.parse(reviewBytes.toString("utf8")) as {
  reviews: Array<{ id: string; reviewedRevision: string; decision: string }>;
};
if (
  sourceRaw.scenarios.length !== 24 ||
  sourceLabels.annotations.length !== 24 ||
  sourceReviews.reviews.length !== 24 ||
  sourceReviews.reviews.some((review) => review.decision !== "PASS")
)
  throw Error("Exposed control review binding drift");
const sourceReviewMap = new Map(sourceReviews.reviews.map((review) => [review.id, review]));
if (
  sourceRaw.scenarios.some(
    (row) => !sourceReviewMap.has(row.id) || sourceReviewMap.get(row.id)!.reviewedRevision !== "R1",
  )
)
  throw Error("Exposed control revision drift");
const vectorArtifact = JSON.parse(vectorBytes.toString("utf8")) as {
  profileArtifactSha256: string;
  model: typeof SEMANTIC_MODEL;
  vectors: Array<FrozenPositiveVector & { vectorSha256: string }>;
};
if (
  vectorArtifact.profileArtifactSha256 !== expected.profile ||
  JSON.stringify(vectorArtifact.model) !== JSON.stringify(SEMANTIC_MODEL) ||
  vectorArtifact.vectors.some((row) => row.vectorSha256 !== sha256(JSON.stringify(row.vector)))
)
  throw Error("Frozen model/vector binding drift");
const srs3b = await loadSrs3Corpus();
if (srs3b.bindings.manifestSha256 !== expected.srs3bManifest)
  throw Error("SRS-3B evidence freeze drift");
const accepted = srs3b.annotations.filter(
  (annotation) =>
    annotation.reviewState === "ACCEPTED" &&
    srs3b.raw.some((row) => row.id === annotation.id && row.languageGroup === "ENGLISH"),
);
if (accepted.length !== 29) throw Error("SRS-3B qualified English case count drift");
const rawCases: RawCase[] = [
  ...accepted.map((annotation) => {
    const row = srs3b.raw.find((item) => item.id === annotation.id)!;
    if (row.revision !== annotation.reviewedRevision) throw Error("SRS-3B reviewed revision drift");
    return { id: row.id, corpus: "SRS3B" as const, action: row.fixedAction, request: row.request };
  }),
  ...sourceRaw.scenarios.map((row) => ({
    id: row.id,
    corpus: "CONTROL" as const,
    action: row.fixedAction,
    request: row.request,
  })),
];
const labelMap = new Map<string, Label>();
for (const annotation of accepted) labelMap.set(`SRS3B:${annotation.id}`, annotation);
for (const annotation of sourceLabels.annotations)
  labelMap.set(`CONTROL:${annotation.id}`, annotation);
if (
  labelMap.size !== rawCases.length ||
  rawCases.some((row) => !labelMap.has(`${row.corpus}:${row.id}`))
)
  throw Error("Exposed raw/annotation mismatch");
const catalog = await loadProductionSemanticCatalog();
if (
  catalog.length !== 21 ||
  catalog.filter((row) => row.definitionType === "ATOMIC").length !== 14 ||
  catalog.filter((row) => row.definitionType === "LANGUAGE_MODIFIER").length !== 7 ||
  catalog.some((row) => row.catalog !== "PRODUCTION" || row.definition.status !== "ACTIVE")
)
  throw Error("Approved production catalog boundary drift");
const catalogBindings = catalog
  .map((row) => ({
    skillId: row.definition.id,
    lane: row.definitionType,
    version: row.definition.version,
    status: row.definition.status,
    sourceDigest: row.sourceDigest,
  }))
  .sort((a, b) => a.skillId.localeCompare(b.skillId));
const catalogSha256 = sha256(JSON.stringify(catalogBindings));
const encoder = await loadLocalSemanticEncoder();
const memo = new Map<string, readonly number[]>();
const memoEncoder: SemanticEncoder = {
  tokenCount: (text) => encoder.tokenCount(text),
  async encode(text) {
    let value = memo.get(text);
    if (!value) {
      value = await encoder.encode(text);
      memo.set(text, value);
    }
    return value;
  },
};
const scored: Scored[] = [];
for (const raw of rawCases) {
  const key = `${raw.corpus}:${raw.id}`;
  const observation = await retrieveAdmissionFreeTopK({
    request: raw.request,
    action: raw.action,
    catalog,
    vectors: vectorArtifact.vectors,
    vectorArtifactDigest: expected.vectors,
    encoder: memoEncoder,
  });
  const prior = await retrieveSemanticCandidates({
    request: raw.request,
    action: raw.action,
    catalog,
    vectors: vectorArtifact.vectors,
    encoder: memoEncoder,
    config: { alpha: 0, threshold: 0.3, topK: 10, configId: "SRS-3F-B-PARITY-ONLY" },
  });
  for (const candidate of observation.fullEligibleRanking) {
    const original = prior.capabilityTraces.find((trace) => trace.skillId === candidate.skillId);
    if (
      !original ||
      original.score !== candidate.semanticScore ||
      original.preThresholdRank !== candidate.semanticRank ||
      original.winningSource !== candidate.winningSource ||
      original.winningField !== candidate.winningField ||
      original.winningProfileOrdinal !== candidate.winningProfileOrdinal ||
      JSON.stringify(original.sourceSimilarities) !== JSON.stringify(candidate.sourceScores)
    )
      throw Error(
        `Frozen pre-admission score/source/rank parity failed: ${key}/${candidate.skillId}`,
      );
  }
  if (
    observation.capabilityEligibility.length !== prior.capabilityTraces.length ||
    observation.hardEligibleCount !== prior.counts.hardEligible ||
    JSON.stringify(observation.modifierEligibility) !==
      JSON.stringify(
        prior.modifierEligibilityTraces.map((trace) => ({
          skillId: trace.skillId,
          hardEligible: trace.eligible,
          reasons: trace.reasons,
        })),
      )
  )
    throw Error(`Frozen structural/modifier parity failed: ${key}`);
  scored.push({ key, action: raw.action, observation });
}

// Only now join revision-qualified labels; the scorer never receives them.
const ks = [3, 5, 10] as const;
const hits = (ranks: readonly (number | null)[], k: number) =>
  ranks.filter((rank) => rank !== null && rank <= k).length;
const bySkill = new Map<string, { total: number; at3: number; at5: number; at10: number }>();
const details = scored.map((row) => {
  const label = labelMap.get(row.key)!;
  const rankOf = (id: string) =>
    row.observation.fullEligibleRanking.find((candidate) => candidate.skillId === id)
      ?.semanticRank ?? null;
  const required = label.required.map((skillId) => {
    const rank = rankOf(skillId);
    const eligible = row.observation.capabilityEligibility.find((item) => item.skillId === skillId);
    const stageAt = (k: 3 | 5 | 10) =>
      rank === null
        ? eligible?.hardEligible
          ? row.observation.status
          : "HARD_ELIGIBILITY"
        : rank > k
          ? `TOP_${k}_CUTOFF`
          : "FOUND";
    const counter = bySkill.get(skillId) ?? { total: 0, at3: 0, at5: 0, at10: 0 };
    counter.total++;
    if (rank !== null && rank <= 3) counter.at3++;
    if (rank !== null && rank <= 5) counter.at5++;
    if (rank !== null && rank <= 10) counter.at10++;
    bySkill.set(skillId, counter);
    return {
      skillId,
      rank,
      stageAt3: stageAt(3),
      stageAt5: stageAt(5),
      stageAt10: stageAt(10),
      diagnosis: rank !== null && rank > 10 ? "SEMANTIC_RANK_MISS" : null,
    };
  });
  return {
    key: row.key,
    action: row.action,
    strictNone: label.strictNone,
    status: row.observation.status,
    hardEligibleCount: row.observation.hardEligibleCount,
    top3: row.observation.top3.map(({ skillId, semanticScore, semanticRank }) => ({
      skillId,
      semanticScore,
      semanticRank,
    })),
    top5: row.observation.top5.map(({ skillId }) => skillId),
    top10: row.observation.top10.map(({ skillId }) => skillId),
    fullRanking: row.observation.fullEligibleRanking,
    capabilityEligibility: row.observation.capabilityEligibility,
    modifierEligibility: row.observation.modifierEligibility,
    required,
    acceptable: label.acceptable.map((skillId) => ({ skillId, rank: rankOf(skillId) })),
    forbidden: label.forbidden.map((skillId) => ({ skillId, rank: rankOf(skillId) })),
  };
});
const required = details.flatMap((row) => row.required);
const rewrites = details
  .filter((row) => row.action === "REWRITE_DRAFT")
  .flatMap((row) => row.required);
const positives = details.filter((row) => row.required.length > 0);
const multis = positives.filter((row) => row.required.length > 1);
const forbidden = details.flatMap((row) => row.forbidden);
const wordingNone = details.filter((row) => row.strictNone && row.status !== "STRUCTURAL_EMPTY");
const structuralNone = details.filter((row) => row.strictNone && row.status === "STRUCTURAL_EMPTY");
const skills = [...bySkill]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([skillId, count]) => ({
    skillId,
    ...count,
  }));
const metric = {
  cases: details.length,
  positiveCases: positives.length,
  required: {
    total: required.length,
    at3: hits(
      required.map((r) => r.rank),
      3,
    ),
    at5: hits(
      required.map((r) => r.rank),
      5,
    ),
    at10: hits(
      required.map((r) => r.rank),
      10,
    ),
  },
  rewrite: {
    total: rewrites.length,
    at3: hits(
      rewrites.map((r) => r.rank),
      3,
    ),
    at5: hits(
      rewrites.map((r) => r.rank),
      5,
    ),
    at10: hits(
      rewrites.map((r) => r.rank),
      10,
    ),
  },
  byAction: Object.fromEntries(
    [...new Set(details.map((row) => row.action))].sort().map((action) => {
      const rows = details.filter((row) => row.action === action);
      const ranks = rows.flatMap((row) => row.required.map((r) => r.rank));
      return [
        action,
        {
          cases: rows.length,
          required: ranks.length,
          at3: hits(ranks, 3),
          at5: hits(ranks, 5),
          at10: hits(ranks, 10),
        },
      ];
    }),
  ),
  allRequiredAt10: {
    hit: positives.filter((row) => row.required.every((r) => r.rank !== null && r.rank <= 10))
      .length,
    total: positives.length,
  },
  macroScenarioCoverageAt10:
    positives.reduce(
      (sum, row) =>
        sum +
        row.required.filter((r) => r.rank !== null && r.rank <= 10).length / row.required.length,
      0,
    ) / positives.length,
  multi: {
    total: multis.length,
    allAt10: multis.filter((row) => row.required.every((r) => r.rank !== null && r.rank <= 10))
      .length,
    atLeastOneAt10: multis.filter((row) =>
      row.required.some((r) => r.rank !== null && r.rank <= 10),
    ).length,
  },
  breadthAt10: skills.filter((row) => row.at10 > 0).length,
  bySkill: skills,
  forbidden: {
    total: forbidden.length,
    rank1: hits(
      forbidden.map((r) => (r.rank === 1 ? 1 : null)),
      1,
    ),
    at3: hits(
      forbidden.map((r) => r.rank),
      3,
    ),
    at5: hits(
      forbidden.map((r) => r.rank),
      5,
    ),
    at10: hits(
      forbidden.map((r) => r.rank),
      10,
    ),
  },
  acceptable: {
    total: details.flatMap((row) => row.acceptable).length,
    at3: hits(
      details.flatMap((row) => row.acceptable.map((r) => r.rank)),
      3,
    ),
    at5: hits(
      details.flatMap((row) => row.acceptable.map((r) => r.rank)),
      5,
    ),
    at10: hits(
      details.flatMap((row) => row.acceptable.map((r) => r.rank)),
      10,
    ),
  },
  wordingNone: {
    total: wordingNone.length,
    candidateNonempty: wordingNone.filter((row) => row.top10.length > 0).length,
  },
  structuralNone: {
    total: structuralNone.length,
    empty: structuralNone.filter((row) => row.top10.length === 0).length,
  },
  completePositive: details.filter(
    (row) => row.action === "COMPLETE_DRAFT" && row.required.length > 0,
  ).length,
  pool: {
    meanHardEligible: details.reduce((sum, row) => sum + row.hardEligibleCount, 0) / details.length,
    meanTop10: details.reduce((sum, row) => sum + row.top10.length, 0) / details.length,
  },
};
const automaticGates = {
  requiredAt3: metric.required.at3 >= 22,
  requiredAt5: metric.required.at5 >= 26,
  requiredAt10: metric.required.at10 >= 38,
  rewriteAt10: metric.rewrite.at10 >= 20,
  breadth: metric.breadthAt10 === 14,
  multiAll: metric.multi.allAt10 >= 6,
  multiOne: metric.multi.atLeastOneAt10 === 9,
  allRequired: metric.allRequiredAt10.hit >= 29,
  forbiddenRank1: metric.forbidden.rank1 <= 2,
  forbiddenAt3: metric.forbidden.at3 <= 6,
  structuralNone: metric.structuralNone.empty === metric.structuralNone.total,
  parity: true,
};
const artifact = await json({
  schemaVersion: 1,
  experimentId: "SRS-3F-B-EXPOSED-TOPK-1",
  evidenceUse: "EXPOSED_DEVELOPMENT_ONLY",
  challengeRead: false,
  challengeRunAuthorized: false,
  operationSignalUsed: false,
  admissionUsed: false,
  scoring: {
    alpha: 0,
    comparator: "COSINE_POSITIVE_PROFILE_MAX",
    tie: "SCORE_DESC_THEN_SKILL_ID",
    k: ks,
  },
  bindings: {
    catalogSha256,
    catalogBindings,
    calibrationFreezeSha256: sha256(freezeBytes),
    calibrationRawSha256: sha256(rawBytes),
    calibrationAnnotationSha256: sha256(annotationBytes),
    calibrationReviewSha256: sha256(reviewBytes),
    srs3b: srs3b.bindings,
    profileArtifactSha256: expected.profile,
    vectorArtifactSha256: expected.vectors,
    sourceAwareScorerSha256: sha256(scorerSource),
    model: SEMANTIC_MODEL,
  },
  metrics: metric,
  automaticGates,
  humanCriticalForbiddenRank1Review: "PENDING",
  cases: details,
});
const scorerDigest = sha256(
  await readFile(resolve(root, "packages/skills/tests/srs3f-semantic-topk.ts")),
);
const config = await json({
  schemaVersion: 1,
  configId: "SRS-3F-B-PROPOSED-TOPK-1",
  status: "PROPOSED_NOT_CHALLENGE_AUTHORIZED",
  evidenceUse: "EXPOSED_DEVELOPMENT_ONLY",
  alpha: 0,
  admission: null,
  operationSignals: null,
  topK: [3, 5, 10],
  structuralEligibility: [
    "PRODUCTION",
    "ACTIVE",
    "FIXED_AGENT_ACTION",
    "LANGUAGE",
    "CODE_SWITCH_PREREQUISITE",
    "ATOMIC_LANE",
  ],
  queryPolicy: "FROZEN_SRS3E_SOURCE_AWARE_PRIMARY_MAX_ALPHA_ZERO",
  tieRule: "SCORE_DESC_THEN_SKILL_ID",
  scorerSha256: scorerDigest,
  sourceAwareScorerSha256: expected.scorerSource,
  profileArtifactSha256: expected.profile,
  vectorArtifactSha256: expected.vectors,
  catalogSha256,
  catalogBindings,
  calibrationFreezeSha256: expected.calibration,
  srs3bManifestSha256: expected.srs3bManifest,
  model: SEMANTIC_MODEL,
  exposedTraceSha256: sha256(artifact),
  challengeRunAuthorized: false,
});
const gateRows = Object.entries(automaticGates)
  .map(([name, pass]) => `| ${name} | ${pass ? "PASS" : "FAIL"} |`)
  .join("\n");
const report = `# SRS-3F-B exposed admission-free semantic Top-K\n\nStatus: **exposed evaluation complete; proposed config frozen; human review pending; challenge not authorized**.\n\nThis evaluation reused the frozen SRS-3E MiniLM, positive profiles/vectors, source-aware query serializer and \`alpha=0\` score. It ranks every hard-eligible ATOMIC skill without a score threshold. CommunicationOperation signals and production routing were not used. The 53 exposed English cases comprise 29 revision-qualified SRS-3B cases and 24 reviewed calibration controls. No challenge row was read or scored.\n\n## Results\n\n| Measure | Exposed result |\n| --- | ---: |\n| Required Recall@3 / @5 / @10 | ${metric.required.at3}/${metric.required.total} / ${metric.required.at5}/${metric.required.total} / ${metric.required.at10}/${metric.required.total} |\n| Rewrite required @10 | ${metric.rewrite.at10}/${metric.rewrite.total} |\n| Per-skill breadth @10 | ${metric.breadthAt10}/14 |\n| Positive cases all-required @10 | ${metric.allRequiredAt10.hit}/${metric.allRequiredAt10.total} |\n| Multi-required all / at-least-one @10 | ${metric.multi.allAt10}/${metric.multi.total} / ${metric.multi.atLeastOneAt10}/${metric.multi.total} |\n| Explicit forbidden rank 1 / @3 / @10 | ${metric.forbidden.rank1}/${metric.forbidden.total} / ${metric.forbidden.at3}/${metric.forbidden.total} / ${metric.forbidden.at10}/${metric.forbidden.total} |\n| Wording NONE with nonempty candidate pool | ${metric.wordingNone.candidateNonempty}/${metric.wordingNone.total} (expected; Supervisor decision deferred) |\n| Structural no-reply empty | ${metric.structuralNone.empty}/${metric.structuralNone.total} |\n| Positive COMPLETE_DRAFT cases | ${metric.completePositive} (N/A for recall) |\n\n## Predeclared automatic gates\n\n| Gate | Result |\n| --- | --- |\n${gateRows}\n\nA zero confirmed intent/ownership-critical forbidden rank-1 error gate remains **PENDING HUMAN REVIEW**; automated gates cannot approve it. Candidate retrieval does not decide \`NONE\` or final selection. Scores are relevance signals, not confidence. Unlabeled skills are unlabeled, not unsupported. Low-score/negative-score candidates remain in the bounded Top-K.\n\n## Comparison and limits\n\nB's full ranking/source scores were checked for exact parity with SRS-3E's frozen \`alpha=0\` **pre-admission** traces on every exposed case. B's rank coverage therefore preserves prior exposed pre-admission signal; removing admission does not improve MiniLM ordering. Historical SRS-2.5 and SRS-3D-A aggregate challenge denominators are **NOT_COMPARABLE** to this 53-row exposed corpus. Their current scripts do not expose an unchanged same-raw-input/fixed-action API, so no cross-corpus uplift claim is made. The 13 wording NONE rows are not required to have empty retrieval; three no-reply rows are structural empties. Positive COMPLETE_DRAFT and non-English embedding coverage are not evaluable here.\n\nThe [content-free machine trace](../../packages/skills/tests/fixtures/srs3f/semantic-topk-exposed-v1.json) is SHA-256 \`${sha256(artifact)}\`; the [immutable proposed config](../../packages/skills/tests/fixtures/srs3f/semantic-topk-proposed-config-v1.json) is SHA-256 \`${sha256(config)}\`. They bind the pinned model, catalog, scorer/query source, profiles/vectors, and exact exposed evidence. Further challenge evaluation requires separate approval after human review of boundary and forbidden-rank cases. No Supervisor or operation fusion is included.\n`;
const forbiddenHotRows = details
  .flatMap((row) =>
    row.forbidden
      .filter((item) => item.rank !== null && item.rank <= 3)
      .map((item) => `| ${row.key} | ${row.action} | ${item.skillId} | ${item.rank} |`),
  )
  .join("\n");
const finalReport = await format(
  report
    .replace(
      "Status: **exposed evaluation complete; proposed config frozen; human review pending; challenge not authorized**.",
      "Status: **exposed gate FAIL (forbidden@3); proposed config frozen; human review pending; challenge not authorized**.",
    )
    .replace(
      "A zero confirmed intent/ownership-critical forbidden rank-1 error gate remains **PENDING HUMAN REVIEW**; automated gates cannot approve it.",
      `The predeclared forbidden@3 limit is 6/14; the observed **7/14 fails**. The seven ranked forbidden occurrences are:\n\n| Case | Action | Forbidden skill | Rank |\n| --- | --- | --- | ---: |\n${forbiddenHotRows}\n\nThe two rank-1 occurrences (R06 follow_up, R14 planning) require explicit ownership/intent review; the zero confirmed critical-error gate remains **PENDING HUMAN REVIEW**. Automated gates cannot approve it. The exposed gate failure blocks the challenge under the approved plan.`,
    )
    .replace(
      "Further challenge evaluation requires separate approval after human review of boundary and forbidden-rank cases.",
      "Do not run the challenge under this failed gate; any exception would need an explicit separate decision after human review.",
    ),
  { parser: "markdown", printWidth: 100, tabWidth: 2, endOfLine: "lf" },
);
async function save(path: string, value: string) {
  const existing = await readFile(path, "utf8").catch(() => null);
  if (mode === "--check") {
    if (existing !== value) throw Error(`SRS-3F-B artifact drift: ${path}`);
  } else {
    if (existing !== null && existing !== value)
      throw Error(`Immutable SRS-3F-B artifact drift: ${path}`);
    await writeFile(path, value, "utf8");
  }
}
if (mode === "--generate") await mkdir(outputRoot, { recursive: true });
await save(outputPath, artifact);
await save(configPath, config);
await save(reportPath, finalReport);
process.stdout.write(
  JSON.stringify({
    artifactSha256: sha256(artifact),
    configSha256: sha256(config),
    metrics: metric,
    automaticGates,
  }) + "\n",
);
