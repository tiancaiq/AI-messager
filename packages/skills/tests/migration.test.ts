import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import {
  AgentActionSchema,
  CommunicationPlanSchema,
  SkillContextSchema,
  SkillDefinitionSchema,
} from "@ai-message-coach/contracts";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createSkillEngine, initialSkillRegistry, validateSkillRegistry } from "../src/index.js";
import { approvedSkillDefinitions } from "../src/generated/approved-registry.js";
import {
  contentDigest,
  defaultOutput,
  loadAuthoringRegistry,
  packageRoot,
  renderRegistry,
} from "../authoring/generator.js";

const historical = z
  .object({
    notice: z.string(),
    revision: z.string(),
    sourceSha256: z.record(z.string(), z.string()),
    registry: z.array(SkillDefinitionSchema),
    integration: z.array(
      z.object({ id: z.string(), context: SkillContextSchema, expected: CommunicationPlanSchema }),
    ),
    cases: z.array(
      z.object({
        id: z.string(),
        context: SkillContextSchema,
        registry: z.array(SkillDefinitionSchema).optional(),
        expected: CommunicationPlanSchema,
      }),
    ),
  })
  .parse(
    JSON.parse(await readFile(new URL("./fixtures/pre-migration.json", import.meta.url), "utf8")),
  );
const oldEngine = createSkillEngine(historical.registry);
const newEngine = createSkillEngine(approvedSkillDefinitions);

describe("frozen migration parity", () => {
  it("preserves all 21 normalized definitions including order, versions, defaults and strings", () => {
    expect(approvedSkillDefinitions).toEqual(historical.registry);
    expect(initialSkillRegistry).toEqual(historical.registry);
    expect(approvedSkillDefinitions).toHaveLength(21);
    expect(
      approvedSkillDefinitions.filter((skill) => skill.languages.includes("universal")),
    ).toHaveLength(14);
    expect(approvedSkillDefinitions.filter((skill) => skill.languages.includes("en"))).toHaveLength(
      3,
    );
    expect(approvedSkillDefinitions.filter((skill) => skill.languages.includes("zh"))).toHaveLength(
      4,
    );
    expect(
      approvedSkillDefinitions.every((skill) => skill.status === "ACTIVE" && skill.version === 1),
    ).toBe(true);
  });
  it.each(historical.cases)("$id preserves the full captured ordered plan", (fixture) => {
    const before = fixture.registry ? createSkillEngine(fixture.registry) : oldEngine;
    const after = fixture.registry ? createSkillEngine(fixture.registry) : newEngine;
    expect(before.select(fixture.context)).toEqual(fixture.expected);
    expect(after.select(fixture.context)).toEqual(fixture.expected);
    expect(after.select(fixture.context).selectedSkills.length).toBeLessThanOrEqual(4);
  });
  it.each(historical.integration)(
    "integration context $id preserves complete reasons and guidance",
    (fixture) => {
      expect(oldEngine.select(fixture.context)).toEqual(fixture.expected);
      expect(newEngine.select(fixture.context)).toEqual(fixture.expected);
    },
  );
  it("covers every action, both one-sided conflicts, first-occurrence deduplication and both caps", () => {
    expect(
      new Set(
        historical.cases.filter((f) => f.id.startsWith("action-")).map((f) => f.context.action),
      ),
    ).toEqual(new Set(AgentActionSchema.options));
    const plan = (id: string) => historical.cases.find((f) => f.id === id)!.expected;
    expect(plan("conflict-forward").selectedSkills.map((skill) => skill.id)).toEqual(["alpha"]);
    expect(plan("conflict-reverse").selectedSkills.map((skill) => skill.id)).toEqual(["alpha"]);
    expect(plan("deduplication").principles).toEqual([
      "Shared principle.",
      "probe_0 principle.",
      "probe_1 principle.",
      "probe_2 principle.",
      "probe_3 principle.",
    ]);
    expect(plan("deduplication").avoid).toEqual([
      "Shared avoidance.",
      "probe_0 avoidance.",
      "probe_1 avoidance.",
      "probe_2 avoidance.",
      "probe_3 avoidance.",
    ]);
    expect(plan("both-guidance-caps").principles).toEqual(
      Array.from(
        { length: 12 },
        (_, index) => "Principle " + Math.floor(index / 6) + "." + (index % 6),
      ),
    );
    expect(plan("both-guidance-caps").avoid).toEqual(
      Array.from(
        { length: 12 },
        (_, index) => "Avoid " + Math.floor(index / 6) + "." + (index % 6),
      ),
    );
  });
  it("preserves explicit invalid-context and invalid-registry failures", () => {
    for (const engine of [oldEngine, newEngine]) {
      expect(() =>
        engine.select({ ...historical.cases[0]!.context, action: "INVALID" } as never),
      ).toThrow();
    }
    expect(() =>
      validateSkillRegistry([...approvedSkillDefinitions, approvedSkillDefinitions[0]]),
    ).toThrow(/Duplicate/);
  });
  it("freezes every exported object and nested runtime array", () => {
    for (const registry of [
      initialSkillRegistry,
      validateSkillRegistry(approvedSkillDefinitions),
    ]) {
      expect(Object.isFrozen(registry)).toBe(true);
      for (const skill of registry) {
        expect(Object.isFrozen(skill)).toBe(true);
        for (const value of Object.values(skill))
          if (Array.isArray(value)) expect(Object.isFrozen(value)).toBe(true);
      }
    }
  });
});

describe("migrated authoring evidence and production boundary", () => {
  it("validates 210 source-grounded examples and only carries forward runtime approval", async () => {
    const { records, registry } = await loadAuthoringRegistry();
    const source = await readFile(
      resolve(packageRoot, "../../docs/skills/phase-5-registry-expansion.md"),
      "utf8",
    );
    const baseline = JSON.parse(
      await readFile(new URL("../authoring/baseline-approvals.json", import.meta.url), "utf8"),
    );
    expect(baseline.revision).toBe(historical.revision);
    expect(baseline.definitions).toEqual(
      historical.registry.map((definition) => ({
        id: definition.id,
        definitionDigest: contentDigest(definition),
      })),
    );
    expect(registry).toEqual(historical.registry);
    let examples = 0;
    for (const record of records) {
      expect(record.review.runtime.state).toBe("INHERITED");
      expect(record.review.examples.state).toBe("PENDING_HUMAN_REVIEW");
      for (const example of [...record.examples.selection, ...record.examples.application]) {
        expect(source, record.definition.id + " " + example.id).toContain(
          example.id + ": " + example.sourceText,
        );
        examples++;
      }
      const runtime = registry.find((skill) => skill.id === record.definition.id)!;
      expect(Object.keys(runtime).sort()).toEqual(Object.keys(historical.registry[0]!).sort());
    }
    expect(examples).toBe(210);
    expect(
      records.flatMap((record) => record.neighbors.map((neighbor) => neighbor.id)),
    ).not.toContain("confirmation");
    for (const candidate of [
      "confirmation",
      "perspective_acknowledgement",
      "give_constructive_feedback",
    ]) {
      expect(registry.map((skill) => skill.id)).not.toContain(candidate);
    }
    expect(registry.some((skill) => skill.id.startsWith("playbook."))).toBe(false);
  });
  it("has a fresh, byte-reproducible generated artifact", async () => {
    const first = await renderRegistry();
    expect(await renderRegistry()).toBe(first);
    expect(await readFile(defaultOutput, "utf8")).toBe(first);
  });
  it("runs generation checks outside the repository working directory", async () => {
    const require = createRequire(import.meta.url);
    const result = await promisify(execFile)(
      process.execPath,
      [
        "--conditions=development",
        "--import",
        pathToFileURL(require.resolve("tsx")).href,
        resolve(packageRoot, "authoring/cli.ts"),
        "--check",
      ],
      { cwd: tmpdir() },
    );
    expect(result.stdout).toContain("is fresh");
    expect(result.stderr).toBe("");
  });
});
