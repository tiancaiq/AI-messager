import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { format } from "prettier";
import { z } from "zod";
import { contentDigest, loadAuthoringRegistry, packageRoot, parseYaml } from "./generator.js";
import { OperationIdSchema } from "./operation-profiles.js";

const link = z
  .object({
    id: OperationIdSchema,
    link: z.enum(["DIRECT", "CONDITIONAL"]),
    rationale: z.string().trim().min(12).max(500),
  })
  .strict();
export const OperationSupportSchema = z
  .object({
    mappingVersion: z.literal(1),
    reviewState: z.literal("PROVISIONAL_CODEX_REVIEW"),
    skills: z.array(
      z
        .object({
          skillId: z.string().min(1),
          operations: z.array(link).min(1).max(5),
        })
        .strict()
        .refine(
          (entry) =>
            new Set(entry.operations.map((item) => item.id)).size === entry.operations.length,
          { message: "Duplicate operation link" },
        ),
    ),
  })
  .strict();
export type OperationSupport = z.infer<typeof OperationSupportSchema>;
export const operationSupportPath = resolve(packageRoot, "authoring/operation-skill-support.yaml");

export async function loadOperationSupport(): Promise<OperationSupport> {
  const mapping = OperationSupportSchema.parse(
    parseYaml(await readFile(operationSupportPath, "utf8")),
  );
  const { records } = await loadAuthoringRegistry();
  const atomic = records.filter((record) => record.kind === "ATOMIC");
  const ids = mapping.skills.map((entry) => entry.skillId);
  if (
    atomic.length !== 14 ||
    ids.length !== atomic.length ||
    new Set(ids).size !== ids.length ||
    atomic.some((record) => !ids.includes(record.definition.id)) ||
    ids.some((id) => !atomic.some((record) => record.definition.id === id))
  )
    throw Error("Operation mapping must cover exactly the 14 approved atomic skills");
  return mapping;
}

export async function renderOperationSupportArtifact() {
  const mapping = await loadOperationSupport();
  const artifact = {
    artifactVersion: 1,
    source: "SRS-3F-A_AUTHORING_ONLY_NO_DETECTOR_IMPORT",
    reviewState: mapping.reviewState,
    skills: mapping.skills.map((entry) => ({
      ...entry,
      mappingEntryDigest: contentDigest(entry),
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
