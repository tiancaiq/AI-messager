import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  OpenAiCoachingAdapter,
  coachConversation,
  decideCoachingAction,
  deriveSkillContext,
} from "../packages/ai/dist/index.js";
import {
  CommunicationPlanSchema,
  SkillDefinitionSchema,
} from "../packages/contracts/dist/index.js";
import { createSkillEngine, initialSkillRegistry } from "../packages/skills/dist/index.js";
import {
  phase8CandidateDefinitions,
  phase8CandidateGenerationFixtures,
  phase8CandidateSelectionFixtures,
} from "../packages/test-fixtures/dist/index.js";
import { loadPhase4LiveEnvironment } from "./phase-4-environment.mjs";

const runLive = process.argv.includes("--live");
loadPhase4LiveEnvironment(runLive);
const outputIndex = process.argv.indexOf("--review-output");
const reviewOutput = outputIndex === -1 ? undefined : resolve(process.argv[outputIndex + 1] ?? "");
if (outputIndex !== -1 && !process.argv[outputIndex + 1])
  throw new Error("--review-output requires a path.");
if (runLive && reviewOutput === undefined)
  throw new Error("--review-output is required for a live Phase 8 candidate run.");
if (!runLive && reviewOutput !== undefined)
  throw new Error("--review-output is available only with --live.");

const candidateIds = ["perspective_acknowledgement", "give_constructive_feedback"];
const productionIds = new Set(initialSkillRegistry.map(({ id }) => id));
const candidateById = new Map(phase8CandidateDefinitions.map((skill) => [skill.id, skill]));

function activeCandidate(id) {
  const definition = candidateById.get(id);
  if (!definition) throw new Error(`Missing candidate definition: ${id}`);
  return SkillDefinitionSchema.parse({ ...definition, status: "ACTIVE" });
}

function experimentalEngine(ids) {
  return createSkillEngine([...initialSkillRegistry, ...ids.map(activeCandidate)]);
}

function selectedIds(plan) {
  return plan.selectedSkills.map(({ id }) => id);
}

function selectionSummary() {
  const combined = experimentalEngine(candidateIds);
  const byCandidate = {};
  for (const candidateId of candidateIds) {
    const individual = experimentalEngine([candidateId]);
    const cases = phase8CandidateSelectionFixtures.filter(
      (fixture) => fixture.candidateId === candidateId,
    );
    let passed = 0;
    const categories = {};
    for (const fixture of cases) {
      const selected = selectedIds(individual.select(fixture.context));
      const combinedSelected = selectedIds(combined.select(fixture.context));
      const expectedPresent = fixture.expectedSkills.every((id) => selected.includes(id));
      const forbiddenAbsent = fixture.forbiddenSkills.every((id) => !selected.includes(id));
      const otherCandidateAbsent = candidateIds
        .filter((id) => id !== candidateId)
        .every((id) => !combinedSelected.includes(id));
      const noneCorrect = fixture.category !== "NONE" || selected.length === 0;
      const casePassed = expectedPresent && forbiddenAbsent && otherCandidateAbsent && noneCorrect;
      if (casePassed) passed += 1;
      const category = (categories[fixture.category] ??= { passed: 0, total: 0 });
      category.total += 1;
      if (casePassed) category.passed += 1;
    }

    const rawCases = phase8CandidateGenerationFixtures.filter(
      (fixture) => fixture.candidateId === candidateId,
    );
    let rawPassed = 0;
    let defaultIsolationPassed = 0;
    for (const fixture of rawCases) {
      const policy = decideCoachingAction(fixture.request);
      const baseline = individual.select(deriveSkillContext(fixture.request, policy));
      const experiment = individual.select(
        deriveSkillContext(fixture.request, policy, { experimentalCandidateRouting: true }),
      );
      if (!selectedIds(baseline).includes(candidateId)) defaultIsolationPassed += 1;
      if (selectedIds(experiment).includes(candidateId)) rawPassed += 1;
    }
    byCandidate[candidateId] = {
      direct: { passed, total: cases.length, categories },
      rawOptIn: { passed: rawPassed, total: rawCases.length },
      defaultIsolation: { passed: defaultIsolationPassed, total: rawCases.length },
    };
  }
  return byCandidate;
}

function planFromDefinitions(definitions) {
  if (definitions.length === 0)
    return { status: "NONE", selectedSkills: [], principles: [], avoid: [] };
  return CommunicationPlanSchema.parse({
    status: "SELECTED",
    selectedSkills: definitions.map((skill) => ({
      id: skill.id,
      version: skill.version,
      reasons: ["Frozen Phase 8 experiment condition."],
    })),
    principles: [...new Set(definitions.flatMap(({ principles }) => principles))].slice(0, 12),
    avoid: [...new Set(definitions.flatMap(({ avoid }) => avoid))].slice(0, 12),
  });
}

function conditionPlan(fixture, condition) {
  const existing = fixture.existingSkillIds.map((id) => {
    const skill = initialSkillRegistry.find((item) => item.id === id);
    if (!skill) throw new Error(`Unknown existing comparator: ${fixture.id} -> ${id}`);
    return skill;
  });
  const candidate = activeCandidate(fixture.candidateId);
  const definitions =
    condition === "G"
      ? []
      : condition === "E"
        ? existing
        : condition === "N"
          ? [candidate]
          : [...existing, candidate];
  const plan = planFromDefinitions(definitions);
  if (condition === "E+N") {
    const baseline = planFromDefinitions(existing);
    for (const principle of baseline.principles)
      if (!plan.principles.includes(principle))
        throw new Error(`Truncated E principle: ${fixture.id}`);
    for (const item of baseline.avoid)
      if (!plan.avoid.includes(item)) throw new Error(`Truncated E avoid rule: ${fixture.id}`);
  }
  return plan;
}

function deterministicOrder(id) {
  return ["G", "E", "N", "E+N"]
    .map((condition) => ({
      condition,
      key: createHash("sha256").update(`${id}:${condition}`).digest("hex"),
    }))
    .sort((left, right) => left.key.localeCompare(right.key))
    .map(({ condition }) => condition);
}

function generatedTexts(decision) {
  if (decision.action === "REWRITE_DRAFT" || decision.action === "COMPLETE_DRAFT")
    return [decision.primary, ...decision.alternatives.map(({ text }) => text)];
  if (decision.action === "SUGGEST_REPLY") return decision.replies.map(({ text }) => text);
  return [];
}

function safetyCheck(fixture, decision) {
  const texts = generatedTexts(decision);
  const normalized = texts.map((text) => text.normalize("NFKC").toLowerCase());
  return {
    actionPreserved: decision.action === fixture.mode,
    requiredAnchorsPreserved: fixture.requiredAnchors.every((anchor) =>
      normalized.every((text) => text.includes(anchor.normalize("NFKC").toLowerCase())),
    ),
    forbiddenClaimsAbsent: fixture.forbiddenClaims.every((claim) =>
      normalized.every((text) => !text.includes(claim.normalize("NFKC").toLowerCase())),
    ),
  };
}

function digest(value) {
  return `sha256:${createHash("sha256").update(JSON.stringify(value)).digest("hex")}`;
}

const deterministic = selectionSummary();
process.stdout.write(
  `phase8-selection-summary: production=${initialSkillRegistry.length} candidates=${candidateIds.length} results=${JSON.stringify(deterministic)}\n`,
);
if (
  initialSkillRegistry.length !== 21 ||
  candidateIds.some((id) => productionIds.has(id)) ||
  Object.values(deterministic).some(
    ({ direct, rawOptIn, defaultIsolation }) =>
      direct.passed !== direct.total ||
      rawOptIn.passed !== rawOptIn.total ||
      defaultIsolation.passed !== defaultIsolation.total,
  )
)
  throw new Error("Phase 8 deterministic candidate experiment failed.");

if (runLive) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is required for the live candidate experiment.");
  const adapter = new OpenAiCoachingAdapter({
    apiKey,
    ...(process.env.OPENAI_TEXT_MODEL ? { modelId: process.env.OPENAI_TEXT_MODEL } : {}),
  });
  const reviewCases = [];
  const conditionMap = [];
  const liveSummary = Object.fromEntries(
    candidateIds.map((id) => [id, { successes: 0, failures: 0, safetyPasses: 0, total: 0 }]),
  );

  for (const fixture of phase8CandidateGenerationFixtures) {
    const blindOutputs = [];
    const assignments = [];
    const order = deterministicOrder(fixture.id);
    for (const [index, condition] of order.entries()) {
      const plan = conditionPlan(fixture, condition);
      const result = await coachConversation(adapter, fixture.request, {
        skillPlanner: { plan: () => plan },
      });
      const summary = liveSummary[fixture.candidateId];
      summary.total += 1;
      const blindId = `output_${index + 1}`;
      assignments.push({ blindId, condition, planDigest: digest(plan) });
      if (!result.ok) {
        summary.failures += 1;
        blindOutputs.push({ blindId, ok: false, errorCode: result.error.code });
        process.stdout.write(`${fixture.id}: ${blindId}=provider-error:${result.error.code}\n`);
        continue;
      }
      summary.successes += 1;
      const safety = safetyCheck(fixture, result.decision);
      const safetyPassed = Object.values(safety).every(Boolean);
      if (safetyPassed) summary.safetyPasses += 1;
      blindOutputs.push({
        blindId,
        ok: true,
        outputDigest: digest(result.decision),
        decision: result.decision,
        safety,
      });
      process.stdout.write(`${fixture.id}: ${blindId}=ready safety=${safetyPassed}\n`);
    }
    reviewCases.push({
      id: fixture.id,
      candidateId: fixture.candidateId,
      mode: fixture.mode,
      language: fixture.language,
      contextSetting: fixture.contextSetting,
      syntheticRequest: fixture.request,
      requiredAnchors: fixture.requiredAnchors,
      forbiddenClaims: fixture.forbiddenClaims,
      blindOutputs,
      reviewDimensions: [
        "intent, fact, commitment, and certainty preservation",
        "appropriateness and clarity",
        "visible-evidence grounding",
        "natural language and register",
        "candidate-specific incremental benefit",
      ],
    });
    conditionMap.push({ id: fixture.id, assignments });
  }

  const artifact = {
    artifactVersion: 1,
    generatedAt: new Date().toISOString(),
    modelId: adapter.configuration.modelId,
    repetitions: 1,
    retryPolicy: "NO_RETRIES",
    retention: "USER_TEMP_DIRECTORY_UNTIL_REVIEW_OR_USER_DELETION",
    conditions: "BLINDED; see separate condition map after rating",
    cases: reviewCases,
  };
  const mapPath = resolve(
    dirname(reviewOutput),
    `${reviewOutput.split(/[\\/]/).pop()}.conditions.json`,
  );
  writeFileSync(reviewOutput, `${JSON.stringify(artifact, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  writeFileSync(
    mapPath,
    `${JSON.stringify(
      {
        artifactVersion: 1,
        generatedAt: artifact.generatedAt,
        modelId: artifact.modelId,
        conditions: conditionMap,
      },
      null,
      2,
    )}\n`,
    { encoding: "utf8", mode: 0o600 },
  );
  process.stdout.write(`phase8-live-summary: ${JSON.stringify(liveSummary)}\n`);
  process.stdout.write(`review-output: ${reviewOutput}\ncondition-map: ${mapPath}\n`);
  if (Object.values(liveSummary).some(({ failures }) => failures > 0))
    throw new Error("One or more Phase 8 live experiment arms failed.");
}
