import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { CoachingRequestSchema, SkillContextSchema } from "@ai-message-coach/contracts";
import { format } from "prettier";
import { deriveSkillContextForProfile } from "../../ai/src/skill-context-normalization.js";
import { srs3eChallengeRaw } from "../../test-fixtures/src/srs3e-semantic-challenge.js";
import { packageRoot } from "../authoring/generator.js";
import { srs3eChallengeAnnotations } from "./srs3e-challenge-annotations.js";
import { challengeRoot, renderChallengeArtifacts } from "./srs3e-challenge-corpus.js";
import { fixedPolicy, observeRecallRawOnly } from "./srs3d-recall-evaluation.js";
import {
  buildSrs2Catalog,
  calculatePoolStatistics,
  runSrs2ShadowRetrieval,
} from "./srs2-shadow-retrieval.js";

const root = resolve(packageRoot, "../..");
const frozenSha256 = "4cd2a78487b0d59c67d97bfe672219f9ff19c9913d079372b2324dbb80a87b84";
const digest = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
const rate = (numerator: number, denominator: number) => ({
  numerator,
  denominator,
  value: denominator ? numerator / denominator : null,
});

export async function verifySrs3eChallengeFreeze() {
  const expected = await renderChallengeArtifacts();
  const savedFreeze = await readFile(resolve(challengeRoot, "challenge-freeze.json"), "utf8");
  if (digest(savedFreeze) !== frozenSha256 || savedFreeze !== expected.freeze)
    throw Error("SRS-3E challenge freeze drift");
  for (const [name, json] of Object.entries(expected.serialized)) {
    const saved = await readFile(
      resolve(challengeRoot, `challenge-${name === "raw" ? "raw-set" : name}.json`),
      "utf8",
    );
    if (saved !== json) throw Error(`SRS-3E challenge ${name} artifact drift`);
  }
  const freeze = JSON.parse(savedFreeze) as {
    freezeId: string;
    acceptedEnglishIds: string[];
    quarantinedLanguageIds: string[];
  };
  if (freeze.acceptedEnglishIds.length !== 55 || freeze.quarantinedLanguageIds.length !== 13)
    throw Error("SRS-3E challenge denominator drift");
  return freeze;
}

type Observation = ReturnType<typeof observeRecallRawOnly>["result"];

function compactObservation(result: Observation) {
  return {
    topK: result.capabilityTopK.map(({ id, retrievalScore, rank }) => ({
      id,
      retrievalScore,
      rank,
    })),
    eligibleModifierIds: result.eligibleModifierIds,
    pool: result.poolCounts,
    traces: result.capabilityTraces.map(
      ({ id, eligibility, retrieval, disappearedAt, disappearanceReasonCodes }) => ({
        id,
        eligibility: eligibility.result,
        rank: retrieval?.rank ?? null,
        disappearedAt,
        reasonCodes: disappearanceReasonCodes,
      }),
    ),
  };
}

type Compact = ReturnType<typeof compactObservation>;
const present = (observation: Compact, id: string, k: number) =>
  observation.topK.slice(0, k).some((item) => item.id === id);

function scoreRows(
  rows: readonly {
    required: readonly string[];
    acceptable: readonly string[];
    forbidden: readonly string[];
    strictNone: boolean;
    primary: readonly string[];
    shouldRankAbove: readonly (readonly [string, string])[];
    observed: Compact;
  }[],
) {
  const required = rows.flatMap((row) => row.required.map((id) => ({ row, id })));
  const positive = rows.filter((row) => row.required.length > 0);
  const none = rows.filter((row) => row.strictNone);
  const forbidden = rows.flatMap((row) => row.forbidden.map((id) => ({ row, id })));
  const acceptable = rows.flatMap((row) => row.acceptable.map((id) => ({ row, id })));
  const primary = rows.filter((row) => row.primary.length > 0);
  const pairs = rows.flatMap((row) =>
    row.shouldRankAbove.map(([higher, lower]) => ({ row, higher, lower })),
  );
  const covered = (k: number) =>
    positive.reduce(
      (sum, row) =>
        sum +
        row.required.filter((id) => present(row.observed, id, k)).length / row.required.length,
      0,
    );
  const all = (k: number) =>
    positive.filter((row) => row.required.every((id) => present(row.observed, id, k))).length;
  const both = pairs.filter(
    ({ row, higher, lower }) =>
      present(row.observed, higher, 10) && present(row.observed, lower, 10),
  );
  const correct = pairs.filter(({ row, higher, lower }) => {
    const ids = row.observed.topK.map(({ id }) => id);
    const higherRank = ids.indexOf(higher);
    const lowerRank = ids.indexOf(lower);
    return higherRank >= 0 && lowerRank >= 0 && higherRank < lowerRank;
  });
  return {
    scenarioCount: rows.length,
    requiredRecallAt3: rate(
      required.filter(({ row, id }) => present(row.observed, id, 3)).length,
      required.length,
    ),
    requiredRecallAt5: rate(
      required.filter(({ row, id }) => present(row.observed, id, 5)).length,
      required.length,
    ),
    requiredRecallAt10: rate(
      required.filter(({ row, id }) => present(row.observed, id, 10)).length,
      required.length,
    ),
    requiredCoverageAt10: rate(covered(10), positive.length),
    allRequiredAt10: rate(all(10), positive.length),
    strictNone: rate(none.filter((row) => row.observed.topK.length === 0).length, none.length),
    forbiddenAt10: rate(
      forbidden.filter(({ row, id }) => present(row.observed, id, 10)).length,
      forbidden.length,
    ),
    acceptableAt10: rate(
      acceptable.filter(({ row, id }) => present(row.observed, id, 10)).length,
      acceptable.length,
    ),
    downstreamPrimaryAt1: rate(
      primary.filter((row) => row.primary.some((id) => present(row.observed, id, 1))).length,
      primary.length,
    ),
    downstreamPairEndToEndAt10: rate(correct.length, pairs.length),
    downstreamPairConditionalAt10: rate(correct.length, both.length),
    positivePool: calculatePoolStatistics(
      rows.map((row) => row.observed.pool.positiveSignalCandidatePoolCount),
    ),
    hardEligiblePool: calculatePoolStatistics(
      rows.map((row) => row.observed.pool.hardEligibleCount),
    ),
  };
}

export async function evaluateSrs3eChallengeRecall() {
  const freeze = await verifySrs3eChallengeFreeze();
  const catalog = await buildSrs2Catalog("PRODUCTION");
  const accepted = new Set(freeze.acceptedEnglishIds);
  const raw = srs3eChallengeRaw.filter((row) => accepted.has(`${row.id}:${row.revision}`));
  if (raw.length !== 55 || raw.filter((row) => row.id.startsWith("C")).length !== 48)
    throw Error("SRS-3E accepted raw case mismatch");

  // Both observations receive only the frozen product request, fixed action and production catalog.
  // Annotation IDs and labels are joined only after all raw observations have completed.
  const observed = raw.map((row) => {
    const request = CoachingRequestSchema.parse(row.request);
    const policy = fixedPolicy(request, row.fixedAction);
    const beforeContext = deriveSkillContextForProfile(request, policy, "SRS_2_5_PROPOSED", {
      experimentalCandidateRouting: false,
    });
    const before = runSrs2ShadowRetrieval(
      SkillContextSchema.parse(beforeContext.context),
      { mode: "SIGNAL_ONLY", topK: 10, catalogScope: "PRODUCTION" },
      catalog,
    );
    const after = observeRecallRawOnly(request, row.fixedAction, catalog).result;
    return {
      id: row.id,
      revision: row.revision,
      fixedAction: row.fixedAction,
      before: compactObservation(before),
      after: compactObservation(after),
    };
  });
  const labels = new Map(srs3eChallengeAnnotations.map((row) => [row.id, row]));
  const capabilityRows = observed
    .filter((row) => row.id.startsWith("C"))
    .map((row) => {
      const label = labels.get(row.id);
      if (!label || label.lane !== "CAPABILITY")
        throw Error(`SRS-3E missing capability label ${row.id}`);
      return {
        ...row,
        required: label.required,
        acceptable: label.acceptable,
        forbidden: label.forbidden,
        strictNone: label.strictNone,
        primary: label.primary,
        shouldRankAbove: label.shouldRankAbove,
      };
    });
  const modifierRows = observed
    .filter((row) => row.id.startsWith("M"))
    .map((row) => {
      const label = labels.get(row.id);
      if (!label || label.lane !== "MODIFIER")
        throw Error(`SRS-3E missing modifier label ${row.id}`);
      return {
        ...row,
        underlyingCapabilities: label.underlyingCapabilities,
        requiredModifiers: label.requiredModifiers,
        forbiddenModifiers: label.forbiddenModifiers,
      };
    });
  const scored = (profile: "before" | "after") =>
    capabilityRows.map((row) => ({
      required: row.required,
      acceptable: row.acceptable,
      forbidden: row.forbidden,
      strictNone: row.strictNone,
      primary: row.primary,
      shouldRankAbove: row.shouldRankAbove,
      observed: row[profile],
    }));
  const report = {
    schemaVersion: 1,
    phase: "SRS_3E_FROZEN_CHALLENGE_RECALL_DIAGNOSTIC",
    split: "EXPOSED_DEVELOPMENT",
    heldOut: "NOT_AUTHORED",
    freezeId: freeze.freezeId,
    freezeSha256: frozenSha256,
    sourceHashes: Object.fromEntries(
      await Promise.all(
        Object.entries({
          normalizer: "packages/ai/src/skill-context-normalization.ts",
          recallProfile: "packages/ai/src/skill-context-recall.ts",
          retriever: "packages/skills/tests/srs2-shadow-retrieval.ts",
          evaluator: "packages/skills/tests/srs3e-challenge-recall-evaluation.ts",
        }).map(async ([name, path]) => [name, digest(await readFile(resolve(root, path)))]),
      ),
    ),
    profiles: ["SRS_2_5_PROPOSED", "SRS_3D_RECALL_PROPOSED"],
    config: { mode: "SIGNAL_ONLY", topK: 10, catalogScope: "PRODUCTION" },
    denominators: {
      acceptedEnglishCapability: 48,
      acceptedEnglishModifier: 7,
      quarantinedUnscored: 13,
    },
    before: scoreRows(scored("before")),
    after: scoreRows(scored("after")),
    byMode: Object.fromEntries(
      ["REWRITE_DRAFT", "SUGGEST_REPLY", "COMPLETE_DRAFT", "NO_REPLY_NEEDED"].map((action) => {
        const modeRows = capabilityRows.filter((row) => row.fixedAction === action);
        const modeScored = (profile: "before" | "after") =>
          modeRows.map((row) => ({
            required: row.required,
            acceptable: row.acceptable,
            forbidden: row.forbidden,
            strictNone: row.strictNone,
            primary: row.primary,
            shouldRankAbove: row.shouldRankAbove,
            observed: row[profile],
          }));
        return [
          action,
          { before: scoreRows(modeScored("before")), after: scoreRows(modeScored("after")) },
        ];
      }),
    ),
    capabilityRows: capabilityRows.map((row) => ({
      id: row.id,
      fixedAction: row.fixedAction,
      required: row.required,
      acceptable: row.acceptable,
      forbidden: row.forbidden,
      strictNone: row.strictNone,
      primary: row.primary,
      shouldRankAbove: row.shouldRankAbove,
      before: row.before,
      after: row.after,
    })),
    modifierEligibility: modifierRows.map((row) => ({
      id: row.id,
      fixedAction: row.fixedAction,
      underlyingCapabilities: row.underlyingCapabilities,
      requiredModifiers: row.requiredModifiers,
      forbiddenModifiers: row.forbiddenModifiers,
      before: row.before.eligibleModifierIds,
      after: row.after.eligibleModifierIds,
    })),
  };
  const json = await format(JSON.stringify(report), {
    parser: "json",
    printWidth: 100,
    tabWidth: 2,
    endOfLine: "lf",
  });
  return { report, json, sha256: digest(json) };
}
