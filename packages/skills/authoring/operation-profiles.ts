import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { format } from "prettier";
import { z } from "zod";
import { contentDigest, packageRoot, parseYaml } from "./generator.js";

export const OperationIdSchema = z.enum([
  "SEEK_ACTION",
  "SEEK_INFORMATION",
  "REVISIT_OPEN_THREAD",
  "REPORT_CURRENT_STATE",
  "COORDINATE_FUTURE",
  "REFUSE_OPTION",
  "STATE_CONTINUING_LIMIT",
  "OWN_ERROR",
  "EXPRESS_REGRET",
  "RESPOND_TO_CONCERN",
  "REDUCE_TENSION",
]);
export type OperationId = z.infer<typeof OperationIdSchema>;

const text = z.string().trim().min(12).max(600);
export const OperationProfileSchema = z
  .object({
    id: OperationIdSchema,
    revision: z.number().int().positive(),
    job: text,
    positiveEvidence: z.array(text).min(2).max(6),
    whenNotUse: z.array(text).min(2).max(6),
    neighbors: z
      .array(z.object({ id: OperationIdSchema, distinction: text }).strict())
      .min(1)
      .max(5),
  })
  .strict()
  .superRefine((profile, context) => {
    const ids = profile.neighbors.map((neighbor) => neighbor.id);
    if (ids.includes(profile.id) || new Set(ids).size !== ids.length)
      context.addIssue({ code: "custom", message: "Invalid operation neighbors: " + profile.id });
  });
export const OperationCatalogSchema = z
  .object({
    catalogVersion: z.literal(1),
    reviewState: z.literal("PROVISIONAL_CODEX_REVIEW"),
    profiles: z.array(OperationProfileSchema).length(OperationIdSchema.options.length),
  })
  .strict()
  .superRefine((catalog, context) => {
    const ids = catalog.profiles.map((profile) => profile.id);
    if (new Set(ids).size !== OperationIdSchema.options.length)
      context.addIssue({ code: "custom", message: "Duplicate or missing operation IDs" });
    if (OperationIdSchema.options.some((id) => !ids.includes(id)))
      context.addIssue({ code: "custom", message: "Operation vocabulary incomplete" });
  });

export type OperationProfile = z.infer<typeof OperationProfileSchema>;
export type OperationCatalog = z.infer<typeof OperationCatalogSchema>;
export const operationSourcePath = resolve(packageRoot, "authoring/operation-profiles.yaml");

export async function loadOperationCatalog(): Promise<OperationCatalog> {
  const source = await readFile(operationSourcePath, "utf8");
  return OperationCatalogSchema.parse(parseYaml(source));
}

export async function renderOperationProfileArtifact() {
  const catalog = await loadOperationCatalog();
  const artifact = {
    artifactVersion: 1,
    source: "SRS-3F-A_EVALUATION_ONLY",
    reviewState: catalog.reviewState,
    operationIds: OperationIdSchema.options,
    profiles: catalog.profiles.map((profile) => ({
      ...profile,
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
    artifact,
    json,
    sha256: createHash("sha256").update(json, "utf8").digest("hex"),
  };
}
