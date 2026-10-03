import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { format } from "prettier";
import { z } from "zod";
import { SkillDefinitionSchema } from "@ai-message-coach/contracts";
import { contentDigest, loadAuthoringRegistry, packageRoot, parseYaml } from "./generator.js";
import type { AuthoringRecord } from "./schema.js";

const id = SkillDefinitionSchema.shape.id;
const text = z.string().trim().min(1).max(1000);
const statements = z.array(text).min(1).max(8);
const NeighborSchema = z
  .object({
    skillId: id,
    relationship: z.enum([
      "NEAR_NEIGHBOR",
      "MORE_SPECIFIC_THAN",
      "MORE_GENERAL_THAN",
      "OVERLAPPING",
      "COMPLEMENTARY",
    ]),
    distinction: text,
    coexistence: z.enum(["COMPATIBLE", "CONDITIONAL", "USUALLY_ALTERNATIVE"]),
  })
  .strict();

export const SemanticProfileSchema = z
  .object({
    id,
    lane: z.enum(["ATOMIC", "LANGUAGE_MODIFIER"]),
    profileRevision: z.number().int().positive(),
    job: text,
    useWhen: statements,
    whenNotUse: statements,
    semanticTriggers: statements,
    neighbors: z.array(NeighborSchema).max(12),
    knownBoundaryIssue: text.optional(),
    reviewState: z.enum(["PASS", "REVISE", "BOUNDARY_REVIEW_REQUIRED"]),
  })
  .strict()
  .superRefine((profile, context) => {
    const seen = new Set<string>();
    for (const neighbor of profile.neighbors) {
      if (neighbor.skillId === profile.id)
        context.addIssue({ code: "custom", message: "Self-neighbor: " + profile.id });
      if (seen.has(neighbor.skillId))
        context.addIssue({ code: "custom", message: "Duplicate neighbor: " + neighbor.skillId });
      seen.add(neighbor.skillId);
    }
    if (profile.reviewState === "BOUNDARY_REVIEW_REQUIRED" && !profile.knownBoundaryIssue)
      context.addIssue({ code: "custom", message: "Boundary review requires an issue note." });
    for (const trigger of profile.semanticTriggers) {
      if (/\b(?:contains?|keyword|regex|literal token|exact phrase)\b/iu.test(trigger))
        context.addIssue({ code: "custom", message: "Trigger appears lexical: " + profile.id });
    }
  });

export const SemanticCatalogSchema = z
  .object({
    catalogVersion: z.literal(1),
    profiles: z.array(SemanticProfileSchema).length(21),
  })
  .strict()
  .refine((catalog) => new Set(catalog.profiles.map((profile) => profile.id)).size === 21, {
    message: "Duplicate semantic profile IDs.",
  });

export type SemanticProfile = z.infer<typeof SemanticProfileSchema>;
export type SemanticCatalog = z.infer<typeof SemanticCatalogSchema>;

export const semanticSourcePath = resolve(packageRoot, "authoring/semantic-profiles.yaml");
export const semanticArtifactPath = resolve(
  packageRoot,
  "tests/fixtures/srs3/semantic-skill-profiles.json",
);

export function validateSemanticCatalog(
  catalogInput: unknown,
  records: readonly AuthoringRecord[],
) {
  const catalog = SemanticCatalogSchema.parse(catalogInput);
  const approved = new Map(records.map((record) => [record.definition.id, record]));
  if (approved.size !== 21 || records.some((record) => record.definition.status !== "ACTIVE"))
    throw Error("Expected exactly 21 ACTIVE approved authoring records.");
  const profiles = new Map(catalog.profiles.map((profile) => [profile.id, profile]));
  for (const record of records) {
    const profile = profiles.get(record.definition.id);
    if (!profile) throw Error("Missing semantic profile: " + record.definition.id);
    if (profile.lane !== record.kind) throw Error("Semantic profile lane mismatch: " + profile.id);
    for (const neighbor of profile.neighbors) {
      const target = approved.get(neighbor.skillId);
      if (!target) throw Error("Unknown semantic neighbor: " + neighbor.skillId);
      if (profile.lane === "ATOMIC" && target.kind !== "ATOMIC")
        throw Error("Modifier in capability neighbor lane: " + profile.id);
    }
  }
  if (catalog.profiles.some((profile) => !approved.has(profile.id)))
    throw Error("Unapproved skill in semantic profiles.");
  return catalog;
}

export function capabilitySemanticProfiles(catalog: SemanticCatalog) {
  return catalog.profiles.filter((profile) => profile.lane === "ATOMIC");
}

export async function loadSemanticProfiles() {
  const { records } = await loadAuthoringRegistry();
  const yaml = await readFile(semanticSourcePath, "utf8");
  return {
    records,
    catalog: validateSemanticCatalog(parseYaml(yaml), records),
  };
}

export async function renderSemanticArtifact() {
  const { catalog, records } = await loadSemanticProfiles();
  const definitions = new Map(records.map((record) => [record.definition.id, record.definition]));
  const artifact = {
    artifactVersion: 1,
    source: "SRS-3D-B_AUTHORING_ONLY",
    reviewerType: "CODEX_SEMANTIC_REVIEW",
    profiles: catalog.profiles.map((profile) => ({
      ...profile,
      sourceDefinitionDigest: contentDigest(definitions.get(profile.id)),
      profileDigest: contentDigest(profile),
    })),
  };
  const json = await format(JSON.stringify(artifact), {
    parser: "json",
    printWidth: 100,
    tabWidth: 2,
    endOfLine: "lf",
  });
  return {
    json,
    sha256: createHash("sha256").update(json, "utf8").digest("hex"),
    artifact,
  };
}
