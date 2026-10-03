import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { format } from "prettier";
import { AgentActionSchema, CoachingRequestSchema } from "@ai-message-coach/contracts";
import { z } from "zod";
import { skillSelectionEvaluationFixtures } from "../../test-fixtures/src/index.js";
import { srs25RawScenarios } from "../../test-fixtures/src/srs2-5-context-normalization.js";
import { srs3RawScenarios } from "../../test-fixtures/src/srs3-ranking-development.js";
import {
  srs3eChallengeRaw,
  type ChallengeRawScenario,
} from "../../test-fixtures/src/srs3e-semantic-challenge.js";
import { loadAuthoringRegistry, packageRoot } from "../authoring/generator.js";
import {
  srs3eChallengeAnnotations,
  type ChallengeAnnotation,
  type CapabilityChallengeAnnotation,
} from "./srs3e-challenge-annotations.js";
import {
  srs3eChallengeAuthoring,
  type ChallengeAuthoringRow,
} from "./srs3e-challenge-authoring.js";
import { srs3eChallengeReview, type ChallengeReviewRow } from "./srs3e-challenge-review.js";
import { srs3dRecallRegression } from "./srs3d-recall-regression.js";

export const challengeRoot = resolve(packageRoot, "tests/fixtures/srs3e");
const repoRoot = resolve(packageRoot, "../..");
const sourcePaths = {
  raw: "packages/test-fixtures/src/srs3e-semantic-challenge.ts",
  annotations: "packages/skills/tests/srs3e-challenge-annotations.ts",
  authoring: "packages/skills/tests/srs3e-challenge-authoring.ts",
  review: "packages/skills/tests/srs3e-challenge-review.ts",
  catalog: "packages/skills/definitions/approved-manifest.yaml",
  profiles: "packages/skills/tests/fixtures/srs3/semantic-skill-profiles.json",
} as const;
const digest = (bytes: string | Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const unique = (values: readonly string[]) => new Set(values).size === values.length;
const fail = (message: string): never => {
  throw Error("SRS-3E challenge: " + message);
};

const RawSchema = z
  .object({
    id: z.string().regex(/^[CM](?:0[1-9]|[1-9][0-9]*)$/u),
    revision: z.literal("R1"),
    scenarioFamily: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u),
    split: z.literal("EXPOSED_DEVELOPMENT"),
    request: CoachingRequestSchema,
    fixedAction: AgentActionSchema,
    catalogScope: z.literal("PRODUCTION"),
    setting: z.enum(["WORK", "PERSONAL", "SERVICE"]),
    languageGroup: z.enum([
      "ENGLISH",
      "SIMPLIFIED_CHINESE",
      "TRADITIONAL_CHINESE",
      "CODE_SWITCHING",
    ]),
  })
  .strict();

function validateRaw(raw: readonly ChallengeRawScenario[]) {
  if (raw.length !== 68) fail("expected 68 distinct raw scenarios");
  const ids = raw.map((scenario) => scenario.id);
  if (!unique(ids) || !unique(raw.map((scenario) => scenario.scenarioFamily)))
    fail("duplicate ID or scenario family");
  for (const scenario of raw) {
    RawSchema.parse(scenario);
    const draft = scenario.request.analysis.draft.text?.trim() ?? "";
    const selection = scenario.request.selection;
    const language = scenario.request.analysis.language;
    if (["REWRITE_DRAFT", "COMPLETE_DRAFT"].includes(scenario.fixedAction) && !draft)
      fail(scenario.id + " requires a nonempty draft");
    if (["SUGGEST_REPLY", "NO_REPLY_NEEDED"].includes(scenario.fixedAction) && draft)
      fail(scenario.id + " must have an empty draft");
    if (
      ["SUGGEST_REPLY", "COMPLETE_DRAFT"].includes(scenario.fixedAction) &&
      selection?.kind !== "ACTION"
    )
      fail(scenario.id + " needs a fixed user goal");
    if (scenario.fixedAction === "NO_REPLY_NEEDED" && selection !== null)
      fail(scenario.id + " cannot supply a wording goal");
    const observed =
      language.primary === "en" && !language.codeSwitching
        ? "ENGLISH"
        : language.primary === "zh" && language.codeSwitching && language.secondary === "en"
          ? "CODE_SWITCHING"
          : language.primary === "zh" && language.script === "SIMPLIFIED"
            ? "SIMPLIFIED_CHINESE"
            : language.primary === "zh" && language.script === "TRADITIONAL"
              ? "TRADITIONAL_CHINESE"
              : null;
    if (observed !== scenario.languageGroup) fail(scenario.id + " language observation mismatch");
    if (scenario.id.startsWith("M") && scenario.fixedAction === "NO_REPLY_NEEDED")
      fail(scenario.id + " modifier case cannot be non-wording");
  }
}

function validateAnnotations(
  raw: readonly ChallengeRawScenario[],
  annotations: readonly ChallengeAnnotation[],
  authoring: readonly ChallengeAuthoringRow[],
  review: readonly ChallengeReviewRow[],
  atomic: Set<string>,
  modifiers: Set<string>,
) {
  for (const [name, rows] of [
    ["annotations", annotations],
    ["authoring", authoring],
    ["review", review],
  ] as const) {
    if (rows.length !== raw.length || !unique(rows.map((row) => row.id)))
      fail(name + " count/ID mismatch");
    if (raw.some((scenario) => !rows.some((row) => row.id === scenario.id)))
      fail(name + " missing raw ID");
  }
  const metaById = new Map(authoring.map((row) => [row.id, row]));
  const reviewById = new Map(review.map((row) => [row.id, row]));
  for (let index = 0; index < raw.length; index++) {
    const scenario = raw[index]!;
    const label = annotations[index]!;
    const meta = metaById.get(scenario.id)!;
    const decision = reviewById.get(scenario.id)!;
    if (
      label.id !== scenario.id ||
      authoring[index]?.id !== scenario.id ||
      review[index]?.id !== scenario.id
    )
      fail(scenario.id + " artifacts must use identical stable order");
    const chinese = scenario.languageGroup !== "ENGLISH";
    if (
      decision.reviewedRevision !== scenario.revision ||
      decision.decision !== (chinese ? "QUARANTINE" : "PASS") ||
      decision.reviewerType !== (chinese ? "CODEX_STRUCTURAL_REVIEW" : "CODEX_SEMANTIC_REVIEW") ||
      decision.nativeLanguageGate !==
        (chinese ? "NATIVE_LANGUAGE_REVIEW_REQUIRED" : "NOT_REQUIRED") ||
      decision.rationale.length < 75 ||
      Object.values(decision.checks).some((passed) => passed !== true)
    )
      fail(scenario.id + " has incomplete or overstated review");
    const hasDraft = Boolean(scenario.request.analysis.draft.text?.trim());
    if (Boolean(meta.draftRealism) !== hasDraft || meta.freshnessNote.length < 30)
      fail(scenario.id + " authoring metadata mismatch");
    if (!unique(meta.hardNeighborFor) || meta.hardNeighborFor.some((id) => !atomic.has(id)))
      fail(scenario.id + " invalid hard-neighbor metadata");
    if (meta.role !== "HARD_NEIGHBOR" && meta.hardNeighborFor.length)
      fail(scenario.id + " hard-neighbor metadata outside a hard-neighbor case");
    if (label.lane === "CAPABILITY") {
      if (!scenario.id.startsWith("C")) fail(scenario.id + " mixed annotation lane");
      const all = [...label.required, ...label.acceptable, ...label.forbidden];
      if (!unique(all) || all.some((id) => !atomic.has(id)))
        fail(scenario.id + " invalid capability label set");
      if (label.strictNone !== (label.required.length === 0 && label.acceptable.length === 0))
        fail(scenario.id + " strict NONE mismatch");
      if (label.primary.length > 1 || !unique(label.primary))
        fail(scenario.id + " invalid primary");
      const supported = new Set([...label.required, ...label.acceptable]);
      if (label.primary.some((id) => !supported.has(id)))
        fail(scenario.id + " unsupported primary");
      if (label.required.length > 1 && (label.primary.length || label.shouldRankAbove.length))
        fail(scenario.id + " forces an order for a multi-required composition");
      if (
        label.shouldRankAbove.some(
          ([above, below]) => above === below || !supported.has(above) || !supported.has(below),
        )
      )
        fail(scenario.id + " unsupported pairwise order");
      if (meta.role === "STRICT_NONE" && !label.strictNone)
        fail(scenario.id + " NONE authoring role mismatch");
      if (meta.role === "HARD_NEIGHBOR" && !meta.hardNeighborFor.length)
        fail(scenario.id + " lacks a hard-neighbor target");
      if (meta.hardNeighborFor.some((id) => !all.includes(id)))
        fail(scenario.id + " hard-neighbor target not adjudicated");
    } else {
      if (!scenario.id.startsWith("M") || meta.role !== "MODIFIER")
        fail(scenario.id + " mixed modifier lane");
      const all = [
        ...label.requiredModifiers,
        ...label.acceptableModifiers,
        ...label.forbiddenModifiers,
      ];
      if (
        !label.underlyingCapabilities.length ||
        label.underlyingCapabilities.some((id) => !atomic.has(id)) ||
        !label.requiredModifiers.length ||
        !unique(all) ||
        all.some((id) => !modifiers.has(id))
      )
        fail(scenario.id + " invalid modifier/underlying labels");
      if (scenario.languageGroup === "ENGLISH" && all.some((id) => !id.startsWith("en.")))
        fail(scenario.id + " ineligible Chinese modifier");
      if (chinese && all.some((id) => !id.startsWith("zh.")))
        fail(scenario.id + " ineligible English modifier");
    }
  }
}

function rawText(request: ChallengeRawScenario["request"]): string {
  return [
    ...request.analysis.messages.map((message) => message.text),
    request.analysis.draft.text ?? "",
    request.selection?.kind === "ACTION" ? request.selection.intent : "",
  ].join(" ");
}
const selectedGoal = (request: ChallengeRawScenario["request"]): string =>
  request.selection?.kind === "ACTION" ? request.selection.intent : "";
const normalized = (text: string) =>
  text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/gu, " ");
const grams = (text: string, size: number): Set<string> => {
  const tokens = normalized(text).split(" ").filter(Boolean);
  return new Set(
    tokens
      .slice(0, Math.max(0, tokens.length - size + 1))
      .map((_, index) => tokens.slice(index, index + size).join(" ")),
  );
};
const jaccard = (a: Set<string>, b: Set<string>) => {
  if (!a.size || !b.size) return 0;
  let common = 0;
  for (const item of a) if (b.has(item)) common++;
  return common / (a.size + b.size - common);
};

async function oldDevelopmentInputs() {
  const { records } = await loadAuthoringRegistry();
  const samples = [
    ...srs3RawScenarios.map((row) => ({
      key: `SRS3B/${row.id}`,
      text: rawText(row.request),
      goal: selectedGoal(row.request),
    })),
    ...srs25RawScenarios.map((row) => ({
      key: `SRS25/${row.id}`,
      text: rawText(row.request),
      goal: selectedGoal(row.request),
    })),
    ...srs3dRecallRegression.map((row) => ({
      key: `SRS3DA/${row.id}`,
      text: rawText(row.request),
      goal: selectedGoal(row.request),
    })),
    ...skillSelectionEvaluationFixtures.map((row) => ({
      key: `SRS2/${row.id}`,
      text: rawText(row.request),
      goal: selectedGoal(row.request),
    })),
    ...records.flatMap((record) =>
      [...record.examples.selection, ...record.examples.application].map((example) => ({
        key: `PHASE8/${record.definition.id}/${example.id}`,
        text: [
          example.sourceText,
          example.visibleContext,
          example.userIntent ?? "",
          "draft" in example ? example.draft : "",
        ].join(" "),
        goal: example.userIntent ?? "",
      })),
    ),
  ];
  return samples.map((sample) => ({
    ...sample,
    normalized: normalized(sample.text),
    grams: grams(sample.text, 3),
    goalNormalized: normalized(sample.goal),
    goalGrams: grams(sample.goal, 2),
  }));
}

export async function buildChallengeCoverage(
  raw = srs3eChallengeRaw,
  annotations = srs3eChallengeAnnotations,
  authoring = srs3eChallengeAuthoring,
  review = srs3eChallengeReview,
) {
  const { records } = await loadAuthoringRegistry();
  const atomic = new Set(
    records.filter((record) => record.kind === "ATOMIC").map((record) => record.definition.id),
  );
  const modifiers = new Set(
    records
      .filter((record) => record.kind === "LANGUAGE_MODIFIER")
      .map((record) => record.definition.id),
  );
  if (atomic.size !== 14 || modifiers.size !== 7) fail("production catalog lane count changed");
  validateRaw(raw);
  validateAnnotations(raw, annotations, authoring, review, atomic, modifiers);

  const previous = await oldDevelopmentInputs();
  const previousExact = new Set(previous.map((sample) => sample.normalized));
  const previousGoals = new Set(previous.map((sample) => sample.goalNormalized).filter(Boolean));
  const metaById = new Map(authoring.map((row) => [row.id, row]));
  const novelty = raw.map((scenario) => {
    const text = rawText(scenario.request);
    const own = grams(text, 3);
    const goal = selectedGoal(scenario.request);
    const goalGrams = grams(goal, 2);
    let maxOverlap = 0;
    let maxGoalOverlap = 0;
    let closestSource = "NONE";
    let closestGoalSource = "NONE";
    for (const old of previous) {
      const overlap = jaccard(own, old.grams);
      if (overlap > maxOverlap) {
        maxOverlap = overlap;
        closestSource = old.key;
      }
      const goalOverlap = jaccard(goalGrams, old.goalGrams);
      if (goalOverlap > maxGoalOverlap) {
        maxGoalOverlap = goalOverlap;
        closestGoalSource = old.key;
      }
    }
    return {
      id: scenario.id,
      exactDuplicate: previousExact.has(normalized(text)),
      exactSelectedGoalDuplicate: Boolean(goal) && previousGoals.has(normalized(goal)),
      maxTrigramJaccard: Number(maxOverlap.toFixed(3)),
      maxSelectedGoalBigramJaccard: Number(maxGoalOverlap.toFixed(3)),
      closestSource,
      closestGoalSource,
      surfaceNovel: maxOverlap < 0.25 && maxGoalOverlap < 0.5,
    };
  });
  if (novelty.some((row) => row.exactDuplicate)) fail("exact old-development scenario duplication");
  if (novelty.some((row) => row.exactSelectedGoalDuplicate))
    fail("exact old-development selected-goal duplication");
  const noveltyById = new Map(novelty.map((row) => [row.id, row]));
  const englishPositive = raw.filter(
    (scenario, index) =>
      scenario.id.startsWith("C") &&
      scenario.languageGroup === "ENGLISH" &&
      (annotations[index] as CapabilityChallengeAnnotation).required.length > 0,
  );
  const surfaceNovelCount = englishPositive.filter(
    (scenario) => noveltyById.get(scenario.id)?.surfaceNovel,
  ).length;
  if (surfaceNovelCount * 2 < englishPositive.length)
    fail("fewer than half of accepted English positives have novel surface forms");

  const capabilityCoverage = [...atomic].map((skillId) => {
    const positive: string[] = [];
    const negative: string[] = [];
    const hardNeighbor: string[] = [];
    const multiSkill: string[] = [];
    const modes = new Set<string>();
    const languages = new Set<string>();
    const settings = new Set<string>();
    const draftRealism = new Set<string>();
    for (let index = 0; index < raw.length; index++) {
      const scenario = raw[index]!;
      const label = annotations[index]!;
      if (label.lane !== "CAPABILITY") continue;
      const meta = metaById.get(scenario.id)!;
      if (label.required.includes(skillId)) {
        positive.push(scenario.id);
        if (label.required.length > 1) multiSkill.push(scenario.id);
        modes.add(scenario.fixedAction);
        languages.add(scenario.languageGroup);
        settings.add(scenario.setting);
        if (meta.draftRealism) draftRealism.add(meta.draftRealism);
      }
      if (label.forbidden.includes(skillId)) negative.push(scenario.id);
      if (meta.hardNeighborFor.includes(skillId)) hardNeighbor.push(scenario.id);
    }
    const english = (ids: string[]) =>
      ids.filter((id) => raw.find((scenario) => scenario.id === id)?.languageGroup === "ENGLISH");
    if (
      english(positive).length < 2 ||
      english(negative).length < 1 ||
      english(hardNeighbor).length < 1
    )
      fail(skillId + " lacks accepted English positive/negative/hard-neighbor coverage");
    return {
      skillId,
      positive,
      negative,
      hardNeighbor,
      multiSkill,
      modes: [...modes].sort(),
      languages: [...languages].sort(),
      settings: [...settings].sort(),
      draftRealism: [...draftRealism].sort(),
    };
  });
  const modifierCoverage = [...modifiers].map((skillId) => {
    const positive: string[] = [];
    const negativeOrNeighbor: string[] = [];
    for (const label of annotations) {
      if (label.lane !== "MODIFIER") continue;
      if (label.requiredModifiers.includes(skillId)) positive.push(label.id);
      if (label.forbiddenModifiers.includes(skillId)) negativeOrNeighbor.push(label.id);
    }
    if (!positive.length || !negativeOrNeighbor.length)
      fail(skillId + " lacks modifier positive/negative coverage");
    return { skillId, positive, negativeOrNeighbor };
  });
  const strictNone = annotations
    .filter((label) => label.lane === "CAPABILITY" && label.strictNone)
    .map((label) => label.id);
  const multiSkill = annotations
    .filter((label) => label.lane === "CAPABILITY" && label.required.length > 1)
    .map((label) => label.id);
  if (strictNone.length < 6 || multiSkill.length < 8)
    fail("NONE or composition coverage below minimum");
  const countBy = (values: readonly string[]) =>
    Object.fromEntries(
      [...new Set(values)]
        .sort()
        .map((value) => [value, values.filter((item) => item === value).length]),
    );
  const report = {
    schemaVersion: 1,
    phase: "SRS-3E_CHALLENGE_PREPARATION",
    split: "EXPOSED_DEVELOPMENT",
    heldOut: "NOT_AUTHORED",
    reviewerType: "CODEX_SEMANTIC_REVIEW_WITH_NATIVE_QUARANTINE",
    counts: {
      total: raw.length,
      capability: raw.filter((row) => row.id.startsWith("C")).length,
      modifier: raw.filter((row) => row.id.startsWith("M")).length,
      acceptedEnglishCapability: raw.filter(
        (row) => row.id.startsWith("C") && row.languageGroup === "ENGLISH",
      ).length,
      acceptedEnglishCapabilityPositive: englishPositive.length,
      quarantinedLanguage: raw.filter((row) => row.languageGroup !== "ENGLISH").length,
      strictNone: strictNone.length,
      multiSkill: multiSkill.length,
      surfaceNovelEnglishPositive: surfaceNovelCount,
      modes: countBy(raw.map((row) => row.fixedAction)),
      settings: countBy(raw.map((row) => row.setting)),
      languages: countBy(raw.map((row) => row.languageGroup)),
      draftRealism: countBy(
        authoring.flatMap((row) => (row.draftRealism ? [row.draftRealism] : [])),
      ),
      decisions: countBy(review.map((row) => row.decision)),
    },
    strictNone,
    multiSkill,
    capabilityCoverage,
    modifierCoverage,
    novelty,
  };
  return report;
}

async function json(value: unknown) {
  return format(JSON.stringify(value), {
    parser: "json",
    printWidth: 100,
    tabWidth: 2,
    endOfLine: "lf",
  });
}

export async function renderChallengeArtifacts() {
  const coverage = await buildChallengeCoverage();
  const serialized = {
    raw: await json({ schemaVersion: 1, scenarios: srs3eChallengeRaw }),
    annotations: await json({ schemaVersion: 1, annotations: srs3eChallengeAnnotations }),
    authoring: await json({ schemaVersion: 1, cases: srs3eChallengeAuthoring }),
    review: await json({ schemaVersion: 1, reviews: srs3eChallengeReview }),
    coverage: await json(coverage),
  };
  const sourceHashes = Object.fromEntries(
    await Promise.all(
      Object.entries(sourcePaths).map(async ([key, path]) => [
        key,
        digest(await readFile(resolve(repoRoot, path))),
      ]),
    ),
  );
  const freeze = {
    schemaVersion: 1,
    freezeId: "SRS-3E-FRESH-CHALLENGE-1",
    scope: "EXPOSED_DEVELOPMENT_WITH_NATIVE_QUARANTINE",
    mutationPolicy: "NEW_REVIEW_AND_NEW_FREEZE_ID_REQUIRED",
    heldOut: "NOT_AUTHORED",
    sourceSha256: sourceHashes,
    artifactSha256: Object.fromEntries(
      Object.entries(serialized).map(([key, value]) => [key, digest(value)]),
    ),
    acceptedEnglishIds: srs3eChallengeRaw
      .filter((row) => row.languageGroup === "ENGLISH")
      .map((row) => `${row.id}:${row.revision}`),
    quarantinedLanguageIds: srs3eChallengeRaw
      .filter((row) => row.languageGroup !== "ENGLISH")
      .map((row) => `${row.id}:${row.revision}`),
    counts: coverage.counts,
  };
  return { serialized, freeze: await json(freeze), coverage };
}
