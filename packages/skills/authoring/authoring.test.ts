import { mkdtemp, readFile, writeFile, mkdir, rm, rename } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { stringify } from "yaml";
import { AuthoringRecordSchema, atomicFamilies, type AuthoringRecord } from "./schema.js";
import {
  contentDigest,
  generateRegistry,
  loadAuthoringRegistry,
  parseYaml,
  renderRegistry,
} from "./generator.js";

const historical = JSON.parse(
  await readFile(new URL("../tests/fixtures/pre-migration.json", import.meta.url), "utf8"),
);
const temporaryRoots: string[] = [];
afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((path) => rm(path, { recursive: true, force: true })),
  );
});
function syntheticRecord(): AuthoringRecord {
  const definition = { ...historical.registry[0], compatibleSkills: [], conflictingSkills: [] };
  const language = { primary: "en", secondary: null, codeSwitching: false };
  const common = {
    sourceText: "Independently authored synthetic test case.",
    visibleContext: "User forgot an attachment.",
    userIntent: "Apologize.",
    action: "SUGGEST_REPLY",
    language,
    expected: [],
    acceptable: [],
    forbidden: [],
    rationale: "Synthetic schema and approval probe.",
  };
  return AuthoringRecordSchema.parse({
    recordVersion: 1,
    kind: "ATOMIC",
    capabilityFamily: "accountability_repair",
    definition,
    neighbors: [],
    conceptualNotes: [],
    examples: {
      expectationScope: "AUTHORING_ONLY",
      selection: ["P1", "P2", "P3", "N1", "N2", "N3", "H1", "H2"].map((id) => ({
        ...common,
        id,
        category: id.startsWith("P") ? "POSITIVE" : id.startsWith("N") ? "NEGATIVE" : "NEIGHBOR",
        expected: id.startsWith("P") ? [definition.id] : [],
        forbidden: id.startsWith("N") ? [definition.id] : [],
      })),
      application: ["A1", "A2"].map((id) => ({
        ...common,
        id,
        category: "APPLICATION",
        action: "REWRITE_DRAFT",
        draft: "sorry forgot it",
        improved: "I'm sorry I forgot the attachment.",
        ledger: { facts: ["User forgot the attachment."], commitments: [], uncertainty: [] },
      })),
    },
    provenance: {
      authorship: "internal",
      definitionSource: "Synthetic test, not production.",
      exampleSource: "Synthetic test.",
      examples: "independently-authored-synthetic",
      rights: "Original synthetic test data.",
    },
    review: {
      runtime: {
        state: "APPROVED",
        approvedBy: "Synthetic test approver (not a real approval)",
        definitionDigest: contentDigest(definition),
        evidenceRefs: ["Synthetic approval fixture only."],
      },
      examples: { state: "PENDING_HUMAN_REVIEW" },
    },
  });
}
async function fixture(record = syntheticRecord()) {
  const root = await mkdtemp(join(tmpdir(), "skills-authoring-"));
  temporaryRoots.push(root);
  const manifest = join(root, "approved-manifest.yaml");
  const entry = {
    id: record.definition.id,
    source: "source.yaml",
    recordDigest: contentDigest(record),
  };
  await writeFile(
    join(root, "taxonomy.yaml"),
    stringify({
      taxonomyVersion: 1,
      families: [...atomicFamilies, "language_expression"].map((id) => ({ id, description: id })),
    }),
  );
  const write = async () => {
    await writeFile(join(root, entry.source), stringify(record));
    await writeFile(manifest, stringify({ manifestVersion: 1, entries: [entry] }));
  };
  await write();
  return { root, manifest, record, entry, write };
}

describe("strict authoring inputs", () => {
  it.each([
    "id: apology\nid: decline\n",
    "value: !execute command\n",
    "value: !!str text\n",
    "value: &shared data\ncopy: *shared\n",
    "value: [unclosed",
    "one: 1\n---\ntwo: 2\n",
    "%YAML 1.1\n---\nvalue: yes\n",
    "? [complex, key]\n: value\n",
  ])("rejects forbidden or malformed YAML: %s", (source) =>
    expect(() => parseYaml(source)).toThrow(),
  );
  it("keeps readable Chinese, scalars and exact array order", () => {
    expect(parseYaml('text: "謝謝，明天可能完成。"\nvalues: [three, one, two]\n')).toEqual({
      text: "謝謝，明天可能完成。",
      values: ["three", "one", "two"],
    });
  });
  it("validates wrapper, example categories, ledger, kind/language and taxonomy", () => {
    const record = syntheticRecord();
    expect(() => AuthoringRecordSchema.parse({ ...record, unexpected: true })).toThrow();
    expect(() => AuthoringRecordSchema.parse({ ...record, kind: "LANGUAGE_MODIFIER" })).toThrow();
    expect(() => AuthoringRecordSchema.parse({ ...record, capabilityFamily: "unknown" })).toThrow();
    const invalid = structuredClone(record);
    invalid.examples.selection[0]!.id = "N1";
    expect(() => AuthoringRecordSchema.parse(invalid)).toThrow();
    expect(() =>
      AuthoringRecordSchema.parse({
        ...record,
        examples: {
          ...record.examples,
          application: [
            {
              ...record.examples.application[0],
              ledger: { facts: [], commitments: [], uncertainty: [] },
            },
            record.examples.application[1],
          ],
        },
      }),
    ).toThrow();
  });
  it("hashes semantic values deterministically without sorting arrays", () => {
    expect(contentDigest({ b: 2, a: 1 })).toBe(contentDigest({ a: 1, b: 2 }));
    expect(contentDigest(["one", "two"])).not.toBe(contentDigest(["two", "one"]));
  });
});

describe("manifest and revision approval", () => {
  it("projects only runtime fields from an approved record while examples await review", async () => {
    const f = await fixture();
    const { registry } = await loadAuthoringRegistry(f.manifest);
    expect(registry).toEqual([f.record.definition]);
    expect(Object.isFrozen(registry[0]?.principles)).toBe(true);
    const source = await renderRegistry(f.manifest);
    for (const field of [
      "visibleContext",
      "exampleSource",
      "approvedBy",
      "capabilityFamily",
      "expectationScope",
      "Synthetic test approver",
    ])
      expect(source).not.toContain(field);
  });
  it.each(["id", "source"] as const)("rejects repeated manifest %s", async (field) => {
    const f = await fixture();
    const duplicate = { ...f.entry, id: "other", source: "other.yaml", [field]: f.entry[field] };
    await writeFile(f.manifest, stringify({ manifestVersion: 1, entries: [f.entry, duplicate] }));
    await expect(loadAuthoringRegistry(f.manifest)).rejects.toThrow(/Duplicate/);
  });
  it("rejects missing files, mismatched IDs and an unknown taxonomy", async () => {
    const f = await fixture();
    await writeFile(
      f.manifest,
      stringify({ manifestVersion: 1, entries: [{ ...f.entry, source: "missing.yaml" }] }),
    );
    await expect(loadAuthoringRegistry(f.manifest)).rejects.toThrow();
    f.entry.id = "wrong";
    await f.write();
    await expect(loadAuthoringRegistry(f.manifest)).rejects.toThrow(/ID mismatch/);
    f.entry.id = f.record.definition.id;
    await f.write();
    await writeFile(join(f.root, "taxonomy.yaml"), stringify({ taxonomyVersion: 1, families: [] }));
    await expect(loadAuthoringRegistry(f.manifest)).rejects.toThrow();
  });
  it("rejects paths outside the manifest directory", async () => {
    const f = await fixture();
    for (const source of [
      "../escape.yaml",
      "C:/escape.yaml",
      "/escape.yaml",
      "nested/../../escape.yaml",
    ]) {
      await writeFile(
        f.manifest,
        stringify({ manifestVersion: 1, entries: [{ ...f.entry, source }] }),
      );
      await expect(loadAuthoringRegistry(f.manifest)).rejects.toThrow();
    }
  });
  it("rejects DRAFT even when its runtime definition says ACTIVE", async () => {
    const f = await fixture();
    f.record.review.runtime = { state: "DRAFT" };
    f.entry.recordDigest = contentDigest(f.record);
    await f.write();
    await expect(loadAuthoringRegistry(f.manifest)).rejects.toThrow(/Unapproved/);
  });
  it("does not discover unlisted draft files", async () => {
    const f = await fixture();
    await writeFile(join(f.root, "unlisted.yaml"), "invalid: [draft");
    expect((await loadAuthoringRegistry(f.manifest)).registry).toHaveLength(1);
  });
  it("invalidates stale example revisions independently from runtime approval", async () => {
    const f = await fixture();
    f.record.examples.selection[0]!.rationale = "An edited example still awaiting human review.";
    await f.write();
    await expect(loadAuthoringRegistry(f.manifest)).rejects.toThrow(/Stale record/);
    f.entry.recordDigest = contentDigest(f.record);
    await f.write();
    expect((await loadAuthoringRegistry(f.manifest)).registry).toEqual([f.record.definition]);
  });
  it("rejects stale runtime approval even if the record digest is updated", async () => {
    const f = await fixture();
    f.record.definition.principles = ["Changed behavior."];
    f.entry.recordDigest = contentDigest(f.record);
    await f.write();
    await expect(loadAuthoringRegistry(f.manifest)).rejects.toThrow(/Stale runtime/);
  });
  it("requires exact baseline parity to inherit approval, not a newly calculated digest", async () => {
    const f = await fixture();
    f.record.definition = historical.registry[0];
    f.record.review.runtime = {
      state: "INHERITED",
      baselineRevision: historical.revision,
      definitionDigest: contentDigest(f.record.definition),
      evidenceRefs: ["Historical approval."],
    };
    // Use an originally unreferenced definition to isolate inheritance from cross-references.
    f.record.definition = {
      ...historical.registry.find((item: { id: string }) => item.id === "ask_for_help"),
    };
    f.entry.id = f.record.definition.id;
    for (const example of f.record.examples.selection) {
      example.expected = example.category === "POSITIVE" ? [f.entry.id] : [];
      example.forbidden = example.category === "NEGATIVE" ? [f.entry.id] : [];
    }
    f.record.review.runtime.definitionDigest = contentDigest(f.record.definition);
    f.entry.recordDigest = contentDigest(f.record);
    await f.write();
    expect((await loadAuthoringRegistry(f.manifest)).registry).toHaveLength(1);
    f.record.definition.avoid = ["Different behavior cannot inherit approval."];
    f.record.review.runtime.definitionDigest = contentDigest(f.record.definition);
    f.entry.recordDigest = contentDigest(f.record);
    await f.write();
    await expect(loadAuthoringRegistry(f.manifest)).rejects.toThrow(/requires explicit review/);
  });
  it.each(["runtime", "neighbor", "example"])("rejects unknown %s references", async (kind) => {
    const f = await fixture();
    if (kind === "runtime") f.record.definition.compatibleSkills = ["missing"];
    if (kind === "neighbor")
      f.record.neighbors = [{ id: "missing", distinction: "Different job.", caseId: "H1" }];
    if (kind === "example") f.record.examples.selection[3]!.acceptable = ["missing"];
    if (f.record.review.runtime.state === "APPROVED")
      f.record.review.runtime.definitionDigest = contentDigest(f.record.definition);
    f.entry.recordDigest = contentDigest(f.record);
    await f.write();
    await expect(loadAuthoringRegistry(f.manifest)).rejects.toThrow(/Unknown/);
  });
  it("rejects self references and compatibility/conflict overlap", () => {
    const f = syntheticRecord();
    expect(() =>
      AuthoringRecordSchema.parse({
        ...f,
        definition: { ...f.definition, compatibleSkills: [f.definition.id] },
      }),
    ).toThrow();
    expect(() =>
      AuthoringRecordSchema.parse({
        ...f,
        definition: { ...f.definition, compatibleSkills: ["other"], conflictingSkills: ["other"] },
      }),
    ).toThrow();
  });
});

describe("deterministic emission and freshness", () => {
  it("generates reproducible UTF-8 LF bytes and checks without rewriting", async () => {
    const f = await fixture();
    const outputPath = join(f.root, "generated.ts");
    await generateRegistry({ check: false, manifestPath: f.manifest, outputPath });
    const first = await readFile(outputPath, "utf8");
    await generateRegistry({ check: false, manifestPath: f.manifest, outputPath });
    expect(await readFile(outputPath, "utf8")).toBe(first);
    expect(first).not.toContain("\r");
    await generateRegistry({ check: true, manifestPath: f.manifest, outputPath });
    await writeFile(outputPath, "stale");
    await expect(
      generateRegistry({ check: true, manifestPath: f.manifest, outputPath }),
    ).rejects.toThrow(/stale/);
    expect(await readFile(outputPath, "utf8")).toBe("stale");
    await expect(
      generateRegistry({
        check: true,
        manifestPath: f.manifest,
        outputPath: join(f.root, "missing.ts"),
      }),
    ).rejects.toThrow(/missing/);
  });
  it("never writes partial output on a validation failure", async () => {
    const f = await fixture();
    const outputPath = join(f.root, "generated.ts");
    await writeFile(outputPath, "existing artifact");
    await writeFile(
      f.manifest,
      stringify({
        manifestVersion: 1,
        entries: [f.entry, { ...f.entry, id: "missing", source: "missing.yaml" }],
      }),
    );
    await expect(
      generateRegistry({ check: false, manifestPath: f.manifest, outputPath }),
    ).rejects.toThrow();
    expect(await readFile(outputPath, "utf8")).toBe("existing artifact");
  });
  it("keeps runtime projection independent of path, taxonomy description and atomic family", async () => {
    const f = await fixture();
    const before = await renderRegistry(f.manifest);
    await mkdir(join(f.root, "moved"));
    await rename(join(f.root, f.entry.source), join(f.root, "moved/renamed.yaml"));
    f.entry.source = "moved/renamed.yaml";
    f.record.capabilityFamily = "recognition_support";
    f.entry.recordDigest = contentDigest(f.record);
    await f.write();
    expect(await renderRegistry(f.manifest)).toBe(before);
    const taxonomy = parseYaml(await readFile(join(f.root, "taxonomy.yaml"), "utf8")) as {
      families: { description: string }[];
    };
    taxonomy.families[0]!.description = "Updated navigation description.";
    await writeFile(join(f.root, "taxonomy.yaml"), stringify(taxonomy));
    expect(await renderRegistry(f.manifest)).toBe(before);
  });
});
