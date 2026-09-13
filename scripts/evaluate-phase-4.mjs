import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  OpenAiCoachingAdapter,
  coachConversation,
  decideCoachingAction,
  deriveSkillContext,
} from "../packages/ai/dist/index.js";
import {
  calculateSkillEvaluationMetrics,
  createSkillEngine,
  initialSkillRegistry,
} from "../packages/skills/dist/index.js";
import { skillSelectionEvaluationFixtures } from "../packages/test-fixtures/dist/index.js";
import {
  declaredConflictPairCount,
  oracleSkillLanguages,
  runSyntheticConflictProbe,
} from "./phase-4-evaluation-support.mjs";
import { loadPhase4LiveEnvironment } from "./phase-4-environment.mjs";

function positiveIntegerArgument(name, fallback) {
  const argument = process.argv.indexOf(name);
  if (argument === -1) return fallback;
  const value = Number.parseInt(process.argv[argument + 1] ?? "", 10);
  if (!Number.isSafeInteger(value) || value <= 0)
    throw new Error(`${name} must be a positive integer.`);
  return value;
}

const limit = Math.min(
  positiveIntegerArgument("--limit", skillSelectionEvaluationFixtures.length),
  skillSelectionEvaluationFixtures.length,
);
const runLiveComparison = process.argv.includes("--live");
loadPhase4LiveEnvironment(runLiveComparison);
const reviewOutputArgument = process.argv.indexOf("--review-output");
const reviewOutput =
  reviewOutputArgument === -1 ? undefined : resolve(process.argv[reviewOutputArgument + 1] ?? "");
if (reviewOutputArgument !== -1 && !process.argv[reviewOutputArgument + 1])
  throw new Error("--review-output requires a path.");
if (reviewOutput !== undefined && !runLiveComparison)
  throw new Error("--review-output is available only with --live.");
const fixtures = skillSelectionEvaluationFixtures.slice(0, limit);
const engine = createSkillEngine(initialSkillRegistry);
const registryById = new Map(initialSkillRegistry.map((skill) => [skill.id, skill]));
const observations = [];
let actionMatches = 0;
let inventedSkillCases = 0;

for (const fixture of fixtures) {
  const policy = decideCoachingAction(fixture.request);
  const context = deriveSkillContext(fixture.request, policy);
  const plan = engine.select(context);
  const eligible = oracleSkillLanguages(fixture.request.analysis.language);
  const selectedSkills = plan.selectedSkills.map((skill) => skill.id);
  const invented = selectedSkills.some((id) => !registryById.has(id));
  const languageEligible = selectedSkills.every((id) =>
    registryById.get(id)?.languages.some((language) => eligible.has(language)),
  );
  if (policy.action === fixture.expectedAction) actionMatches += 1;
  if (invented) inventedSkillCases += 1;
  observations.push({
    expectedSkills: fixture.expectedSkills,
    acceptableSkills: fixture.acceptableSkills,
    forbiddenSkills: fixture.forbiddenSkills,
    selectedSkills,
    languageEligible,
  });
  const references = plan.selectedSkills.map(({ id, version }) => `${id}@${version}`).join(",");
  process.stdout.write(
    `${fixture.id}: action=${policy.action} skills=${references || "none"} status=${plan.status}\n`,
  );
}

const metrics = calculateSkillEvaluationMetrics(observations, initialSkillRegistry);
const conflictCoverage = {
  productionDeclaredPairs: declaredConflictPairCount(initialSkillRegistry),
  syntheticProbePassed: runSyntheticConflictProbe(createSkillEngine),
};
process.stdout.write(
  `deterministic-summary: scenarios=${fixtures.length} action_preservation=${actionMatches}/${fixtures.length} no_invention=${fixtures.length - inventedSkillCases}/${fixtures.length} metrics=${JSON.stringify(metrics)} conflict_coverage=${JSON.stringify(conflictCoverage)}\n`,
);

if (
  actionMatches !== fixtures.length ||
  inventedSkillCases !== 0 ||
  !conflictCoverage.syntheticProbePassed ||
  metrics.strictScenarioPassRate !== 1
) {
  throw new Error("The deterministic Phase 4 evaluation did not meet its strict baseline.");
}

if (runLiveComparison) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is required for the opt-in live comparison.");
  const adapter = new OpenAiCoachingAdapter({
    apiKey,
    ...(process.env.OPENAI_TEXT_MODEL ? { modelId: process.env.OPENAI_TEXT_MODEL } : {}),
  });
  const genericPlanner = {
    plan: () => ({ status: "NONE", selectedSkills: [], principles: [], avoid: [] }),
  };
  let pairedSuccesses = 0;
  let providerFailures = 0;
  const reviewCases = [];
  for (const fixture of fixtures) {
    const generic = await coachConversation(adapter, fixture.request, {
      skillPlanner: genericPlanner,
    });
    const guided = await coachConversation(adapter, fixture.request);
    if (!generic.ok || !guided.ok) {
      providerFailures += 1;
      process.stdout.write(`${fixture.id}: live-comparison=provider-error\n`);
      continue;
    }
    pairedSuccesses += 1;
    reviewCases.push({
      id: fixture.id,
      importantConstraints: fixture.importantConstraints,
      generic: generic.decision,
      skillGuided: guided.decision,
      reviewDimensions: [
        "intent preservation",
        "appropriateness",
        "clarity",
        "communication goal fit",
        "unsupported facts",
        "tone fit",
      ],
    });
    process.stdout.write(
      `${fixture.id}: live-comparison=ready generic_action=${generic.decision.action} guided_action=${guided.decision.action}\n`,
    );
  }
  process.stdout.write(
    `live-summary: paired_successes=${pairedSuccesses}/${fixtures.length} provider_failures=${providerFailures}\n`,
  );
  process.stdout.write(
    "A human must compare intent preservation, appropriateness, clarity, goal fit, unsupported facts, and tone fit. Generated message text is intentionally not logged.\n",
  );
  if (reviewOutput !== undefined) {
    writeFileSync(
      reviewOutput,
      `${JSON.stringify({ generatedAt: new Date().toISOString(), cases: reviewCases }, null, 2)}\n`,
      { encoding: "utf8", mode: 0o600 },
    );
    process.stdout.write(
      `review-output: ${reviewOutput} (synthetic fixture output only; remove after review)\n`,
    );
  }
}
