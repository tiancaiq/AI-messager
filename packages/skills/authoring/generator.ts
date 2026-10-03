import { createHash } from "node:crypto";
import { readFile, realpath, mkdir, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { format } from "prettier";
import { isAlias, isNode, parseDocument, visit } from "yaml";
import { validateSkillRegistry } from "../src/engine.js";
import {
  AuthoringRecordSchema,
  BaselineApprovalsSchema,
  ManifestSchema,
  TaxonomySchema,
  type AuthoringRecord,
} from "./schema.js";

export const packageRoot = fileURLToPath(new URL("../", import.meta.url));
export const defaultManifest = resolve(packageRoot, "definitions/approved-manifest.yaml");
export const defaultOutput = resolve(packageRoot, "src/generated/approved-registry.ts");

// Object keys are sorted by code point; arrays and string values retain exact order/content.
// Hash semantic, validated JSON, not YAML formatting, paths or timestamps.
function canonical(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value !== null && typeof value === "object") {
    return (
      "{" +
      Object.keys(value)
        .sort()
        .map(
          (key) => JSON.stringify(key) + ":" + canonical((value as Record<string, unknown>)[key]),
        )
        .join(",") +
      "}"
    );
  }
  const json = JSON.stringify(value);
  if (json === undefined) throw new Error("Digest input must be JSON data.");
  return json;
}
export function contentDigest(value: unknown): string {
  return "sha256:" + createHash("sha256").update(canonical(value), "utf8").digest("hex");
}

export function parseYaml(source: string): unknown {
  const doc = parseDocument(source, {
    version: "1.2",
    schema: "core",
    uniqueKeys: true,
    stringKeys: true,
    strict: true,
    prettyErrors: false,
  });
  if (doc.errors.length || doc.warnings.length)
    throw new Error(
      "Invalid YAML: " + [...doc.errors, ...doc.warnings].map((error) => error.code).join(", "),
    );
  if (
    doc.directives?.yaml.explicit ||
    (doc.directives && Object.keys(doc.directives.tags).some((tag) => tag !== "!!"))
  )
    throw new Error("YAML directives are not supported.");
  visit(doc, (_key, node) => {
    if (isAlias(node) || (isNode(node) && (node.tag || ("anchor" in node && node.anchor))))
      throw new Error("YAML tags, anchors and aliases are not supported.");
  });
  return doc.toJS({ maxAliasCount: 0 });
}

async function readYaml(path: string): Promise<unknown> {
  return parseYaml(await readFile(path, "utf8"));
}

function contained(root: string, path: string): boolean {
  const child = relative(root, path);
  return child !== "" && !isAbsolute(child) && child !== ".." && !child.startsWith(".." + sep);
}

export async function loadAuthoringRegistry(manifestPath = defaultManifest) {
  const manifest = ManifestSchema.parse(await readYaml(manifestPath));
  const root = await realpath(dirname(manifestPath));
  TaxonomySchema.parse(await readYaml(resolve(root, "taxonomy.yaml")));
  const baseline = BaselineApprovalsSchema.parse(
    JSON.parse(await readFile(new URL("./baseline-approvals.json", import.meta.url), "utf8")),
  );
  const records: AuthoringRecord[] = [];
  const paths = new Set<string>();
  for (const entry of manifest.entries) {
    const source = await realpath(resolve(root, entry.source));
    if (!contained(root, source))
      throw new Error("Manifest source escapes definitions directory: " + entry.id);
    const pathKey = process.platform === "win32" ? source.toLowerCase() : source;
    if (paths.has(pathKey)) throw new Error("Duplicate resolved source: " + entry.id);
    paths.add(pathKey);
    const record = AuthoringRecordSchema.parse(await readYaml(source));
    if (record.definition.id !== entry.id) throw new Error("Manifest ID mismatch: " + entry.id);
    if (contentDigest(record) !== entry.recordDigest)
      throw new Error("Stale record revision: " + entry.id);
    const review = record.review.runtime;
    if (review.state === "DRAFT") throw new Error("Unapproved runtime definition: " + entry.id);
    const definitionDigest = contentDigest(record.definition);
    if (definitionDigest !== review.definitionDigest)
      throw new Error("Stale runtime approval: " + entry.id);
    if (review.state === "INHERITED") {
      const approved = baseline.definitions.find((definition) => definition.id === entry.id);
      if (
        review.baselineRevision !== baseline.revision ||
        approved?.definitionDigest !== definitionDigest
      )
        throw new Error(
          "Runtime change requires explicit review; cannot inherit approval: " + entry.id,
        );
    }
    records.push(record);
  }
  const registry = validateSkillRegistry(records.map((record) => record.definition));
  const ids = new Set(registry.map((definition) => definition.id));
  for (const record of records) {
    const examples = [...record.examples.selection, ...record.examples.application];
    const references = [
      ...record.neighbors.map((neighbor) => neighbor.id),
      ...examples.flatMap((example) => [
        ...example.expected,
        ...example.acceptable,
        ...example.forbidden,
      ]),
    ];
    if (references.some((id) => !ids.has(id)))
      throw new Error("Unknown authoring skill reference: " + record.definition.id);
  }
  return { registry, records };
}

export async function renderRegistry(manifestPath = defaultManifest): Promise<string> {
  const { registry } = await loadAuthoringRegistry(manifestPath);
  const source =
    "// Generated from packages/skills/definitions/approved-manifest.yaml. Do not edit.\n" +
    "// Run pnpm skills:generate; review and edit the YAML authoring sources.\n" +
    'import type { SkillDefinition } from "@ai-message-coach/contracts";\n\n' +
    "export const approvedSkillDefinitions: readonly SkillDefinition[] = " +
    JSON.stringify(registry, null, 2) +
    ";\n";
  return format(source, {
    parser: "typescript",
    printWidth: 100,
    tabWidth: 2,
    useTabs: false,
    semi: true,
    singleQuote: false,
    trailingComma: "all",
    endOfLine: "lf",
  });
}

export async function generateRegistry(options: {
  check: boolean;
  manifestPath?: string;
  outputPath?: string;
}) {
  const output = options.outputPath ?? defaultOutput;
  const expected = await renderRegistry(options.manifestPath);
  if (options.check) {
    let actual: string;
    try {
      actual = await readFile(output, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      throw new Error("Generated skill registry is missing; run pnpm skills:generate.", {
        cause: error,
      });
    }
    if (actual !== expected)
      throw new Error("Generated skill registry is stale; run pnpm skills:generate.");
  } else {
    // Validate every source and all references before touching output.
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, expected, "utf8");
  }
}
