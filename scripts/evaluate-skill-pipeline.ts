import {
  approvedPipelineSnapshot,
  createSkillPipelineHarness,
  type ComparisonCategory,
  type PipelineInspection,
} from "../packages/ai/tests/skill-pipeline-harness.js";
import {
  adversarialSkillFixtures,
  frozenSkillFixtures,
  type PipelineValidationFixture,
} from "../packages/ai/tests/skill-pipeline-fixtures.js";

const fixtures = [...frozenSkillFixtures, ...adversarialSkillFixtures];
const run = createSkillPipelineHarness();
const results = await Promise.all(fixtures.map(run));
const categories: ComparisonCategory[] = [
  "MATCH",
  "EXPECTED_DIFFERENCE",
  "POTENTIAL_IMPROVEMENT",
  "POTENTIAL_REGRESSION",
  "NOT_COMPARABLE",
];
const totals = Object.fromEntries(
  categories.map((category) => [
    category,
    results.filter((result) => result.structural.category === category).length,
  ]),
);
const write = (line: string): void => {
  process.stdout.write(`${line}\n`);
};

const reviewIds = [
  "apology-mistake",
  "status-request",
  "missed-commitment",
  "invitation-before-choice",
  "simplified-status",
  "mixed-planning",
  "clear-refusal",
  "repeated-pressure-boundary",
  "emotional-support",
  "simple-planning",
  "sparse-nicer",
  "uncertain-availability",
  "direct-refusal",
  "less-confrontational-no-apology",
  "manager-recipient-unproven",
  "disagree-relationship",
  "cap-pressure-multi-need",
  "chinese-boundary-traditional",
  "english-chinese-code-switch",
  "ambiguous-speaker-empty-draft",
  "repair-and-empathy",
] as const;

function refs(items: readonly { id: string; version: number }[]): string {
  return items.map(({ id, version }) => `${id}@${version}`).join(", ") || "none";
}

function guidance(items: readonly string[]): string {
  return items.map((item) => `  - ${item}`).join("\n") || "  - none";
}

function printReview(fixture: PipelineValidationFixture, result: PipelineInspection): void {
  const { structural, plan, legacy } = result;
  write(`### ${fixture.id}\n`);
  write(`- Fixed action: \`${structural.action}\``);
  write(`- Supported evidence: ${fixture.supportedEvidenceSummary}`);
  write(`- Assessment signals: ${structural.signalIds.join(", ") || "none"}`);
  write(`- Selected skills: ${refs(structural.selected)}`);
  write(
    `- New SkillPlan: \`${plan.status}\`; principles:\n${guidance(plan.principles.map(({ text }) => text))}`,
  );
  write(`  Avoid:\n${guidance(plan.avoid.map(({ text }) => text))}`);
  write(
    `- Legacy CommunicationPlan: \`${legacy.status}\`; skills: ${refs(legacy.selectedSkills)}; principles:\n${guidance(legacy.principles)}`,
  );
  write(`  Avoid:\n${guidance(legacy.avoid)}`);
  write(
    `- Comparison: \`${structural.category}\`${structural.reasonCodes.length ? ` (${structural.reasonCodes.join(", ")})` : ""}\n`,
  );
}

if (process.argv.includes("--cases")) {
  write(
    JSON.stringify(
      results.map(({ structural }) => structural),
      null,
      2,
    ),
  );
} else if (process.argv.includes("--review")) {
  write("# B3.5 synthetic Skill expertise review set\n");
  write(
    "Judge relevance, missed/unnecessary expertise, plan fidelity, unsupported invention and structural strength; do not judge final wording. All cases and guidance below are synthetic/approved.\n",
  );
  for (const id of reviewIds) {
    const index = fixtures.findIndex((fixture) => fixture.id === id);
    if (index < 0) throw new Error(`Missing review fixture: ${id}`);
    printReview(fixtures[index]!, results[index]!);
  }
} else {
  for (let warmup = 0; warmup < 2; warmup += 1) for (const fixture of fixtures) await run(fixture);
  const samples: PipelineInspection["timingsMs"][] = [];
  for (let pass = 0; pass < 10; pass += 1)
    for (const fixture of fixtures) samples.push((await run(fixture)).timingsMs);
  const timing = Object.fromEntries(
    (["assessment", "selection", "compilation", "full"] as const).map((stage) => {
      const values = samples.map((sample) => sample[stage]).sort((a, b) => a - b);
      return [
        stage,
        {
          medianMs: Number(values[Math.floor(values.length / 2)]!.toFixed(3)),
          worstMs: Number(values[values.length - 1]!.toFixed(3)),
        },
      ];
    }),
  );
  write(
    JSON.stringify(
      {
        baseline: approvedPipelineSnapshot.id,
        frozenFixtureCount: frozenSkillFixtures.length,
        adversarialFixtureCount: adversarialSkillFixtures.length,
        totalFixtures: fixtures.length,
        categories: totals,
        nonMatches: results
          .filter(({ structural }) => structural.category !== "MATCH")
          .map(({ structural }) => ({
            fixtureId: structural.fixtureId,
            category: structural.category,
            reasonCodes: structural.reasonCodes,
            legacySelected: structural.legacySelected,
            selected: structural.selected,
          })),
        performance: { samples: samples.length, warmupPasses: 2, measuredPasses: 10, timing },
      },
      null,
      2,
    ),
  );
}
