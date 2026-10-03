import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  CoachingRequestSchema,
  SkillContextSchema,
  type AgentAction,
  type CoachingRequest,
} from "@ai-message-coach/contracts";
import type { CoachingPolicyDecision } from "../../ai/src/coaching-policy.js";
import { deriveSkillContextForProfile } from "../../ai/src/skill-context-normalization.js";
import {
  deriveSkillContextForRecallProfile,
  SRS3D_RECALL_PROFILE,
} from "../../ai/src/skill-context-recall.js";
import type { Srs3RawScenario } from "../../test-fixtures/src/srs3-ranking-development.js";
import { format, resolveConfig } from "prettier";
import { packageRoot } from "../authoring/generator.js";
import {
  buildSrs2Catalog,
  calculatePoolStatistics,
  runSrs2ShadowRetrieval,
  type Srs2CatalogEntry,
} from "./srs2-shadow-retrieval.js";
import { verifySrs3bFreeze } from "./srs3-ranking-baseline.js";
import { srs3dRecallRegression } from "./srs3d-recall-regression.js";

const root = resolve(packageRoot, "../..");
const beforePath = "packages/skills/tests/fixtures/srs3/baseline-report.json";
const beforeSha256 = "ffa306ca87866313d58e670775ded8bad91a4dcc99cb23efe5fb35839b9dbcac";
const sha256 = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest("hex");
const hashFile = async (path: string) => sha256(await readFile(resolve(root, path)));

interface Rate {
  numerator: number;
  denominator: number;
  value: number | null;
}
const rate = (numerator: number, denominator: number): Rate => ({
  numerator,
  denominator,
  value: denominator ? numerator / denominator : null,
});

export function fixedPolicy(request: CoachingRequest, action: AgentAction): CoachingPolicyDecision {
  const selected = request.selection?.kind === "ACTION" ? request.selection.intent : null;
  return {
    action,
    userIntent: {
      value:
        selected ??
        (request.analysis.draft.text
          ? "Preserve the visible draft's meaning."
          : "Respond to the visible conversation."),
      confidence: 1,
    },
    actionConfidence: 1,
    ambiguity: { material: false, reason: null },
  };
}

export function observeRecallRawOnly(
  requestInput: CoachingRequest,
  action: AgentAction,
  catalog: readonly Srs2CatalogEntry[],
) {
  const request = CoachingRequestSchema.parse(requestInput);
  const policy = fixedPolicy(request, action);
  const normalized = deriveSkillContextForRecallProfile(request, policy, {
    experimentalCandidateRouting: false,
  });
  const result = runSrs2ShadowRetrieval(
    SkillContextSchema.parse(normalized.context),
    { mode: "SIGNAL_ONLY", topK: 10, catalogScope: "PRODUCTION" },
    catalog,
  );
  return { normalized, result };
}

function rowMetrics(
  rows: readonly {
    required: readonly { foundAt3: boolean; foundAt5: boolean; foundAt10: boolean }[];
    strictNone: boolean;
    topK: readonly string[];
    forbidden: readonly { at3: boolean; at5: boolean; at10: boolean }[];
    primaryRank: number | null;
    pairResults: readonly { bothPresent: boolean; correctOrder: boolean }[];
    pool: {
      hardEligibleCount: number;
      positiveSignalCandidatePoolCount: number;
      topKCount: number;
    };
  }[],
) {
  const required = rows.flatMap((row) => row.required);
  const requiredScenarios = rows.filter((row) => row.required.length > 0);
  const forbidden = rows.flatMap((row) => row.forbidden);
  const none = rows.filter((row) => row.strictNone);
  const primary = rows.filter((row) => row.primaryRank !== null);
  const pairs = rows.flatMap((row) => row.pairResults);
  const count = (k: 3 | 5 | 10) => required.filter((item) => item[`foundAt${k}`]).length;
  const coverage = (k: 3 | 5 | 10) =>
    requiredScenarios.reduce(
      (sum, row) =>
        sum + row.required.filter((item) => item[`foundAt${k}`]).length / row.required.length,
      0,
    );
  const all = (k: 3 | 5 | 10) =>
    requiredScenarios.filter((row) => row.required.every((item) => item[`foundAt${k}`])).length;
  return {
    scenarioCount: rows.length,
    requiredRecallAt3: rate(count(3), required.length),
    requiredRecallAt5: rate(count(5), required.length),
    requiredRecallAt10: rate(count(10), required.length),
    requiredCoverageAt3: rate(coverage(3), requiredScenarios.length),
    requiredCoverageAt5: rate(coverage(5), requiredScenarios.length),
    requiredCoverageAt10: rate(coverage(10), requiredScenarios.length),
    allRequiredAt3: rate(all(3), requiredScenarios.length),
    allRequiredAt5: rate(all(5), requiredScenarios.length),
    allRequiredAt10: rate(all(10), requiredScenarios.length),
    strictNone: rate(none.filter((row) => row.topK.length === 0).length, none.length),
    forbiddenAt3: rate(forbidden.filter((item) => item.at3).length, forbidden.length),
    forbiddenAt5: rate(forbidden.filter((item) => item.at5).length, forbidden.length),
    forbiddenAt10: rate(forbidden.filter((item) => item.at10).length, forbidden.length),
    downstreamPrimaryAt1: rate(
      primary.filter((row) => row.primaryRank === 1).length,
      primary.length,
    ),
    downstreamPairEndToEndAt10: rate(
      pairs.filter((item) => item.correctOrder).length,
      pairs.length,
    ),
    downstreamPairConditionalAt10: rate(
      pairs.filter((item) => item.correctOrder).length,
      pairs.filter((item) => item.bothPresent).length,
    ),
    positivePool: calculatePoolStatistics(
      rows.map((row) => row.pool.positiveSignalCandidatePoolCount),
    ),
    hardEligiblePool: calculatePoolStatistics(rows.map((row) => row.pool.hardEligibleCount)),
  };
}

export async function evaluateSrs3dRecall() {
  // The old freeze and source-bound baseline are checked before any new observation.
  const { freeze, corpus } = await verifySrs3bFreeze();
  const beforeBytes = await readFile(resolve(root, beforePath));
  if (sha256(beforeBytes) !== beforeSha256) throw Error("SRS-3C BEFORE evidence drift");
  const before = JSON.parse(beforeBytes.toString("utf8")) as {
    rows: Array<{
      id: string;
      required: Array<{ id: string; at10: boolean }>;
      forbidden: Array<{ id: string; at10: boolean }>;
    }>;
    metrics: Record<string, unknown>;
  };
  const beforeById = new Map(before.rows.map((row) => [row.id, row]));
  const catalog = await buildSrs2Catalog("PRODUCTION");
  const rawById = new Map(corpus.raw.map((row) => [row.id, row]));
  const labelsById = new Map(corpus.annotations.map((row) => [row.id, row]));
  const rows = freeze.acceptedEnglish.map((key) => {
    const [id] = key.split(":");
    const raw = rawById.get(id!) as Srs3RawScenario;
    const observation = observeRecallRawOnly(raw.request, raw.fixedAction, catalog);
    const labels = labelsById.get(id!)!;
    const beforeRow = beforeById.get(id!)!;
    const topK = observation.result.capabilityTopK.map(({ id }) => id);
    const traceById = new Map(
      observation.result.capabilityTraces.map((trace) => [trace.id, trace]),
    );
    const foundAt = (skill: string, k: number) => topK.slice(0, k).includes(skill);
    const required = labels.required.map((skill) => {
      const trace = traceById.get(skill)!;
      return {
        id: skill,
        foundAt3: foundAt(skill, 3),
        foundAt5: foundAt(skill, 5),
        foundAt10: foundAt(skill, 10),
        retrievalRank: trace.retrieval?.rank ?? null,
        disappearedAt: trace.disappearedAt,
        reasonCodes: trace.disappearanceReasonCodes,
        recoveredFromBefore:
          !beforeRow.required.find((item) => item.id === skill)?.at10 && foundAt(skill, 10),
      };
    });
    const forbidden = labels.forbidden.map((skill) => ({
      id: skill,
      at3: foundAt(skill, 3),
      at5: foundAt(skill, 5),
      at10: foundAt(skill, 10),
      newlyEnabled:
        foundAt(skill, 10) && !beforeRow.forbidden.find((item) => item.id === skill)?.at10,
    }));
    const primaryRanks = labels.primary
      .map((skill) => topK.indexOf(skill) + 1)
      .filter((rank) => rank > 0);
    const primaryRank = labels.primary.length
      ? primaryRanks.length
        ? Math.min(...primaryRanks)
        : 0
      : null;
    const pairResults = labels.shouldRankAbove.map(([higher, lower]) => {
      const higherRank = topK.indexOf(higher);
      const lowerRank = topK.indexOf(lower);
      return {
        bothPresent: higherRank >= 0 && lowerRank >= 0,
        correctOrder: higherRank >= 0 && lowerRank >= 0 && higherRank < lowerRank,
      };
    });
    return {
      id: raw.id,
      revision: raw.revision,
      action: raw.fixedAction,
      intentTags: observation.normalized.context.intentTags,
      situationTags: observation.normalized.context.situationTags,
      signals: observation.normalized.signals,
      topK,
      pool: observation.result.poolCounts,
      required,
      forbidden,
      primaryRank,
      pairResults,
      strictNone: labels.strictNone,
    };
  });
  const regression = srs3dRecallRegression.map((item) => {
    const policy = fixedPolicy(item.request, item.action);
    const old = deriveSkillContextForProfile(item.request, policy, "SRS_2_5_PROPOSED", {
      experimentalCandidateRouting: false,
    });
    const beforeResult = runSrs2ShadowRetrieval(
      old.context,
      { mode: "SIGNAL_ONLY", topK: 10, catalogScope: "PRODUCTION" },
      catalog,
    );
    const after = observeRecallRawOnly(item.request, item.action, catalog);
    const beforeTopK = beforeResult.capabilityTopK.map(({ id }) => id);
    const afterTopK = after.result.capabilityTopK.map(({ id }) => id);
    return {
      id: item.id,
      target: item.capability,
      class: item.class,
      variant: item.variant,
      action: item.action,
      beforeTargetIntent: old.context.intentTags.includes(item.targetIntent),
      afterTargetIntent: after.normalized.context.intentTags.includes(item.targetIntent),
      beforeTargetSkillAt10: beforeTopK.includes(item.capability),
      afterTargetSkillAt10: afterTopK.includes(item.capability),
      newIntentTags: after.normalized.context.intentTags.filter(
        (tag) => !old.context.intentTags.includes(tag),
      ),
      newSituationTags: after.normalized.context.situationTags.filter(
        (tag) => !old.context.situationTags.includes(tag),
      ),
      newlyEnabledCapabilityIds: afterTopK.filter((id) => !beforeTopK.includes(id)),
      beforePoolCount: beforeResult.poolCounts.positiveSignalCandidatePoolCount,
      poolCount: after.result.poolCounts.positiveSignalCandidatePoolCount,
    };
  });
  const recovered = rows.flatMap((row) =>
    row.required.filter((item) => item.recoveredFromBefore).map((item) => `${row.id}/${item.id}`),
  );
  const lost = rows.flatMap((row) =>
    row.required
      .filter(
        (item) =>
          !item.foundAt10 &&
          beforeById.get(row.id)!.required.find((old) => old.id === item.id)?.at10,
      )
      .map((item) => `${row.id}/${item.id}`),
  );
  const newForbidden = rows.flatMap((row) =>
    row.forbidden.filter((item) => item.newlyEnabled).map((item) => `${row.id}/${item.id}`),
  );
  const report = {
    schemaVersion: 1,
    phase: "SRS_3D_A_RECALL_EXPOSED_DEVELOPMENT",
    profile: SRS3D_RECALL_PROFILE,
    freezeId: freeze.freezeId,
    freezeSha256: await hashFile("packages/skills/tests/fixtures/srs3/srs3b-english-freeze.json"),
    sourceHashes: {
      beforeEvidence: beforeSha256,
      recallProfile: await hashFile("packages/ai/src/skill-context-recall.ts"),
      regressionFixture: await hashFile("packages/skills/tests/srs3d-recall-regression.ts"),
      retrieval: await hashFile("packages/skills/tests/srs2-shadow-retrieval.ts"),
      evaluator: await hashFile("packages/skills/tests/srs3d-recall-evaluation.ts"),
    },
    before: {
      scenarioCount: 29,
      requiredRecallAt3: before.metrics.requiredRecallAt3,
      requiredRecallAt5: before.metrics.requiredRecallAt5,
      requiredRecallAt10: before.metrics.requiredRecallAt10,
      requiredCoverageAt10: before.metrics.requiredCoverageAt10,
      allRequiredAt10: before.metrics.allRequiredAt10,
      strictNone: before.metrics.strictNone,
      forbiddenAt3: before.metrics.forbiddenAt3,
      forbiddenAt5: before.metrics.forbiddenAt5,
      forbiddenAt10: before.metrics.forbiddenAt10,
      downstreamPrimaryAt1: before.metrics.primaryAt1,
      downstreamPairEndToEndAt10: before.metrics.pairEndToEndAt10,
      downstreamPairConditionalAt10: before.metrics.pairConditionalAt10,
      positivePool: (before.metrics.pool as { positiveSignal: unknown }).positiveSignal,
    },
    after: rowMetrics(rows),
    changes: { recovered, lost, newForbidden },
    rows,
    regression: {
      count: regression.length,
      positive: rate(
        regression.filter((item) => item.class === "POSITIVE" && item.afterTargetIntent).length,
        regression.filter((item) => item.class === "POSITIVE").length,
      ),
      neighborAndNegativeTargetIntentHits: rate(
        regression.filter((item) => item.class !== "POSITIVE" && item.afterTargetIntent).length,
        regression.filter((item) => item.class !== "POSITIVE").length,
      ),
      newlyEnabledControlTargetSkills: regression
        .filter(
          (item) =>
            item.class !== "POSITIVE" && item.afterTargetSkillAt10 && !item.beforeTargetSkillAt10,
        )
        .map((item) => `${item.id}/${item.target}`),
      pool: calculatePoolStatistics(regression.map((item) => item.poolCount)),
      rows: regression,
    },
  };
  const outputPath = resolve(root, "packages/skills/tests/fixtures/srs3/recall-after.json");
  const json = await format(JSON.stringify(report), {
    ...(await resolveConfig(outputPath)),
    filepath: outputPath,
    parser: "json",
  });
  return { report, json, sha256: sha256(json) };
}
