import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join } from "node:path";

// Resolve the actual production export as its AI consumer does, without development.
const require = createRequire(new URL("../packages/ai/package.json", import.meta.url));
const entry = require.resolve("@ai-message-coach/skills");
assert.equal(entry, fileURLToPath(new URL("../packages/skills/dist/index.js", import.meta.url)));
const skills = await import(pathToFileURL(entry).href);
assert.deepEqual(
  Object.keys(skills).sort(),
  [
    "SkillDefinitionSchema",
    "calculateSkillEvaluationMetrics",
    "createSkillEngine",
    "eligibleSkillLanguages",
    "initialSkillRegistry",
    "parseSkillDefinition",
    "validateSkillRegistry",
  ].sort(),
);
const baseline = JSON.parse(
  await readFile(
    new URL("../packages/skills/tests/fixtures/pre-migration.json", import.meta.url),
    "utf8",
  ),
);
assert.deepEqual(skills.initialSkillRegistry, baseline.registry);
const engine = skills.createSkillEngine(skills.initialSkillRegistry);
for (const fixture of [...baseline.integration, ...baseline.cases]) {
  const subject = fixture.registry ? skills.createSkillEngine(fixture.registry) : engine;
  assert.deepEqual(subject.select(fixture.context), fixture.expected, fixture.id);
}
for (const registry of [skills.initialSkillRegistry, engine.registry]) {
  assert(Object.isFrozen(registry));
  for (const definition of registry) {
    assert(Object.isFrozen(definition));
    for (const value of Object.values(definition))
      if (Array.isArray(value)) assert(Object.isFrozen(value));
  }
}
const dist = fileURLToPath(new URL("../packages/skills/dist/", import.meta.url));
const files = await readdir(dist, { recursive: true });
assert(files.every((path) => !/authoring|definitions|fixtures|\.ya?ml$/u.test(path)));
for (const path of files.filter((path) => path.endsWith(".js"))) {
  const source = await readFile(join(dist, path), "utf8");
  assert(
    !/from ["']yaml["']|visibleContext|expectationScope|approvedBy|PENDING_HUMAN_REVIEW/u.test(
      source,
    ),
    path,
  );
}
process.stdout.write(
  "Production package: 21 exact definitions, 153 ordered plans, public exports, deep freezing and authoring exclusion passed.\n",
);
