import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { AgentActionSchema, CoachingRequestSchema } from "@ai-message-coach/contracts";
import { format } from "prettier";
import { srs3RawScenarios } from "../../test-fixtures/src/srs3-ranking-development.js";
import { srs3eChallengeRaw } from "../../test-fixtures/src/srs3e-semantic-challenge.js";
import { srs3eSemanticCalibrationRaw } from "../../test-fixtures/src/srs3e-semantic-calibration.js";
import { packageRoot } from "../authoring/generator.js";
import { srs3dRecallRegression } from "./srs3d-recall-regression.js";
import { srs3eSemanticCalibrationAnnotations } from "./srs3e-semantic-calibration-annotations.js";
import { srs3eSemanticCalibrationReview } from "./srs3e-semantic-calibration-review.js";

export const semanticFixtureRoot = resolve(
  packageRoot,
  "tests/fixtures/srs3e-semantic/calibration-v2",
);
const repoRoot = resolve(packageRoot, "../..");
const digest = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
const idKey = (id: string, revision: string) => `${id}:${revision}`;
const normalized = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
const textOf = (request: (typeof srs3eSemanticCalibrationRaw)[number]["request"]) =>
  normalized(
    [
      ...request.analysis.messages.map(({ speaker, text }) => `${speaker} ${text}`),
      request.analysis.draft.text ?? "",
      request.selection?.kind === "ACTION" ? request.selection.intent : "",
    ].join(" "),
  );
const json = (value: unknown) =>
  format(JSON.stringify(value), { parser: "json", printWidth: 100, tabWidth: 2, endOfLine: "lf" });

export async function renderSemanticCalibrationArtifacts() {
  const raw = srs3eSemanticCalibrationRaw;
  const labels = srs3eSemanticCalibrationAnnotations;
  const review = srs3eSemanticCalibrationReview;
  if (raw.length !== 24 || labels.length !== 24 || review.length !== 24)
    throw Error("SRS-3E calibration must have exactly 24 raw, label and review rows");
  const ids = raw.map(({ id }) => id);
  if (
    new Set(ids).size !== 24 ||
    new Set(raw.map(({ scenarioFamily }) => scenarioFamily)).size !== 24
  )
    throw Error("SRS-3E calibration duplicate ID/family");
  if (ids.some((id, index) => id !== `K${String(index + 1).padStart(2, "0")}`))
    throw Error("SRS-3E calibration ID/order mismatch");
  if (
    labels.some((row, index) => row.id !== ids[index]) ||
    review.some((row, index) => row.id !== ids[index])
  )
    throw Error("SRS-3E calibration annotation/review binding mismatch");
  for (const [index, row] of raw.entries()) {
    CoachingRequestSchema.parse(row.request);
    AgentActionSchema.parse(row.fixedAction);
    if (row.split !== "CALIBRATION_ONLY" || row.revision !== "R1")
      throw Error("SRS-3E calibration split/revision mismatch");
    if (
      row.request.analysis.language.primary !== "en" ||
      row.request.analysis.language.codeSwitching
    )
      throw Error("SRS-3E calibration must remain English-only");
    const draft = row.request.analysis.draft.text?.trim() ?? "";
    if (["REWRITE_DRAFT", "COMPLETE_DRAFT"].includes(row.fixedAction) && !draft)
      throw Error("SRS-3E calibration draft mode missing draft: " + row.id);
    if (["SUGGEST_REPLY", "NO_REPLY_NEEDED"].includes(row.fixedAction) && draft)
      throw Error("SRS-3E calibration empty-draft mode has draft: " + row.id);
    if (
      ["SUGGEST_REPLY", "COMPLETE_DRAFT"].includes(row.fixedAction) &&
      row.request.selection?.kind !== "ACTION"
    )
      throw Error("SRS-3E calibration selected goal missing: " + row.id);
    if (row.fixedAction === "NO_REPLY_NEEDED" && row.request.selection !== null)
      throw Error("SRS-3E calibration non-wording selection: " + row.id);
    const label = labels[index]!;
    if (label.strictNone !== (label.required.length === 0))
      throw Error("SRS-3E calibration NONE label mismatch: " + row.id);
    if ((index < 12 && !label.strictNone) || (index >= 12 && label.strictNone))
      throw Error("SRS-3E calibration control partition mismatch: " + row.id);
    if (
      review[index]!.decision !== "PASS" ||
      review[index]!.reviewerType !== "CODEX_SEMANTIC_REVIEW" ||
      review[index]!.rationale.length < 45
    )
      throw Error("SRS-3E calibration semantic review missing: " + row.id);
  }
  const oldSources = [
    ...srs3RawScenarios.map(({ request }) => ({ source: "SRS3B", request })),
    ...srs3dRecallRegression.map(({ request }) => ({ source: "SRS3D_A", request })),
    ...srs3eChallengeRaw.map(({ request }) => ({ source: "SRS3E_CHALLENGE", request })),
  ];
  const oldTexts = oldSources.map(({ source, request }) => ({ source, text: textOf(request) }));
  const oldGoals = oldSources.map(({ source, request }) => ({
    source,
    text: request.selection?.kind === "ACTION" ? normalized(request.selection.intent) : "",
  }));
  const duplicates = raw.flatMap(({ id, request }) => {
    const text = textOf(request);
    const goal = request.selection?.kind === "ACTION" ? normalized(request.selection.intent) : "";
    return oldTexts
      .filter((item) => item.text === text)
      .map(({ source }) => ({ id, source, kind: "RAW" }))
      .concat(
        goal
          ? oldGoals
              .filter((item) => item.text === goal)
              .map(({ source }) => ({ id, source, kind: "GOAL" }))
          : [],
      );
  });
  if (duplicates.length)
    throw Error("SRS-3E calibration duplicates previous evidence: " + JSON.stringify(duplicates));
  const artifacts = {
    raw: await json({ schemaVersion: 1, split: "CALIBRATION_ONLY", scenarios: raw }),
    annotations: await json({ schemaVersion: 1, annotations: labels }),
    review: await json({ schemaVersion: 1, reviews: review }),
  };
  const sourcePaths = {
    raw: "packages/test-fixtures/src/srs3e-semantic-calibration.ts",
    annotations: "packages/skills/tests/srs3e-semantic-calibration-annotations.ts",
    review: "packages/skills/tests/srs3e-semantic-calibration-review.ts",
    challengeFreeze: "packages/skills/tests/fixtures/srs3e/challenge-freeze.json",
    srs3bFreeze: "packages/skills/tests/fixtures/srs3/srs3b-english-freeze.json",
    srs3dVariants: "packages/skills/tests/srs3d-recall-regression.ts",
  } as const;
  const sourceSha256 = Object.fromEntries(
    await Promise.all(
      Object.entries(sourcePaths).map(async ([key, path]) => [
        key,
        digest(await readFile(resolve(repoRoot, path))),
      ]),
    ),
  );
  const manifest = await json({
    schemaVersion: 1,
    calibrationId: "SRS-3E-SEMANTIC-CALIBRATION-2",
    split: "CALIBRATION_ONLY",
    reviewerType: "CODEX_SEMANTIC_REVIEW",
    mutationPolicy: "NEW_REVIEW_AND_NEW_FREEZE_ID_REQUIRED",
    counts: {
      total: 24,
      strictNone: 12,
      hardNeighbor: 12,
      requiredOccurrences: labels.reduce((n, row) => n + row.required.length, 0),
    },
    acceptedIds: raw.map(({ id, revision }) => idKey(id, revision)),
    exactPriorDuplicates: 0,
    sourceSha256,
    artifactSha256: Object.fromEntries(
      Object.entries(artifacts).map(([key, value]) => [key, digest(value)]),
    ),
  });
  return { artifacts, manifest, manifestSha256: digest(manifest) };
}
