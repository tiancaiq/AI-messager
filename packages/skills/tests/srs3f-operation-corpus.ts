import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { AgentActionSchema, CoachingRequestSchema } from "@ai-message-coach/contracts";
import { srs3fOperationRaw } from "../../test-fixtures/src/srs3f-operation-raw.js";
import { OperationIdSchema, type OperationId } from "../authoring/operation-profiles.js";
import { packageRoot } from "../authoring/generator.js";
import { srs3fOperationAnnotations } from "./srs3f-operation-annotations.js";

const repoRoot = resolve(packageRoot, "../..");
const sha256 = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest("hex");
const normalized = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

// Explicit hard negatives for each operation. These are separate raw IDs whose
// reviewed label excludes that operation; ordinary unrelated negatives do not count.
const pertinentNegatives: Record<OperationId, readonly string[]> = {
  SEEK_ACTION: ["O05", "O06", "O07", "O08", "O09", "O10", "O11", "O12"],
  SEEK_INFORMATION: ["O01", "O02", "O03", "O04", "O13", "O14", "O15", "O16"],
  REVISIT_OPEN_THREAD: ["O01", "O02", "O03", "O04", "O05", "O06", "O07", "O08"],
  REPORT_CURRENT_STATE: ["O09", "O10", "O11", "O12", "O17", "O18", "O19", "O20"],
  COORDINATE_FUTURE: ["O09", "O10", "O11", "O12", "O13", "O14", "O15", "O16"],
  REFUSE_OPTION: ["O25", "O26", "O27", "O28", "O72", "O74", "O81", "O83"],
  STATE_CONTINUING_LIMIT: ["O21", "O22", "O23", "O24", "O70", "O72", "O74", "O81"],
  OWN_ERROR: ["O13", "O14", "O15", "O16", "O73", "O74", "O75", "O76"],
  EXPRESS_REGRET: ["O29", "O30", "O31", "O32", "O37", "O38", "O39", "O40"],
  RESPOND_TO_CONCERN: ["O41", "O42", "O43", "O44", "O73", "O75", "O76", "O77"],
  REDUCE_TENSION: ["O37", "O38", "O39", "O40", "O67", "O77", "O79", "O81"],
};

export function validateOperationCorpus() {
  const raw = srs3fOperationRaw;
  const labels = srs3fOperationAnnotations;
  if (raw.length !== 86 || labels.length !== 86) throw Error("Operation corpus row count drift");
  if (new Set(raw.map((row) => row.scenarioFamily)).size !== raw.length)
    throw Error("Operation scenario family duplication");
  const textKeys = new Set<string>();
  const annotations = new Map(labels.map((item) => [item.id, item]));
  for (const [index, row] of raw.entries()) {
    const expectedId = `O${String(index + 1).padStart(2, "0")}`;
    if (
      row.id !== expectedId ||
      row.revision !== "R1" ||
      row.split !== (index % 2 === 0 ? "CALIBRATION" : "AUDIT")
    )
      throw Error("Operation raw ID/revision/split drift: " + row.id);
    CoachingRequestSchema.parse(row.request);
    AgentActionSchema.parse(row.fixedAction);
    const annotation = annotations.get(row.id);
    if (
      !annotation ||
      annotation.revision !== row.revision ||
      annotation.reviewerType !== "CODEX_SELF_REVIEW_PROVISIONAL" ||
      annotation.rationale.length < 30 ||
      new Set(annotation.operations).size !== annotation.operations.length
    )
      throw Error("Operation annotation/review binding drift: " + row.id);
    annotation.operations.forEach((id) => OperationIdSchema.parse(id));
    const key = normalized(
      [
        ...row.request.analysis.messages.map((item) => `${item.speaker} ${item.text}`),
        row.request.analysis.draft.text ?? "",
        row.request.selection?.kind === "ACTION" ? row.request.selection.intent : "",
      ].join(" "),
    );
    if (textKeys.has(key)) throw Error("Operation raw exact-family duplicate: " + row.id);
    textKeys.add(key);
    if (
      row.request.analysis.language.primary !== "en" ||
      row.request.analysis.language.codeSwitching
    )
      throw Error("English-only operation corpus drift: " + row.id);
  }
  if (annotations.size !== raw.length) throw Error("Operation annotation ID mismatch");
  const counts = Object.fromEntries(
    OperationIdSchema.options.map((id) => [
      id,
      labels.filter((row) => row.operations.includes(id)).length,
    ]),
  ) as Record<OperationId, number>;
  for (const id of OperationIdSchema.options) {
    if (counts[id] < 8) throw Error("Operation positive coverage below eight: " + id);
    const negatives = pertinentNegatives[id];
    if (
      negatives.length < 8 ||
      new Set(negatives).size !== negatives.length ||
      negatives.some((caseId) => annotations.get(caseId)?.operations.includes(id) !== false)
    )
      throw Error("Operation pertinent-negative coverage invalid: " + id);
  }
  const zero = labels.filter((row) => row.operations.length === 0).length;
  const multi = labels.filter((row) => row.operations.length > 1).length;
  const rewrites = raw.filter((row) => row.fixedAction === "REWRITE_DRAFT").length;
  const suggest = raw.filter((row) => row.fixedAction === "SUGGEST_REPLY").length;
  const complete = raw.filter((row) => row.fixedAction === "COMPLETE_DRAFT").length;
  const nonWording = raw.filter((row) => row.fixedAction === "NO_REPLY_NEEDED").length;
  if (zero < 20 || multi < 20 || rewrites < 12 || suggest < 12 || !complete || !nonWording)
    throw Error("Operation corpus mode/multi/zero coverage incomplete");
  return {
    raw,
    labels,
    counts: {
      total: raw.length,
      calibration: raw.filter((row) => row.split === "CALIBRATION").length,
      audit: raw.filter((row) => row.split === "AUDIT").length,
      positiveByOperation: counts,
      pertinentNegativeByOperation: Object.fromEntries(
        OperationIdSchema.options.map((id) => [id, pertinentNegatives[id].length]),
      ),
      zero,
      multi,
      rewrites,
      suggest,
      complete,
      nonWording,
      distinctFamilies: raw.length,
    },
  };
}

export async function operationCorpusSourceDigests() {
  const paths = {
    raw: "packages/test-fixtures/src/srs3f-operation-raw.ts",
    annotations: "packages/skills/tests/srs3f-operation-annotations.ts",
    corpusValidator: "packages/skills/tests/srs3f-operation-corpus.ts",
    detector: "packages/skills/tests/srs3f-operation-detector.ts",
    querySerializer: "packages/skills/tests/srs3e-semantic-retrieval.ts",
    evaluator: "scripts/evaluate-srs3f-operations.ts",
  };
  return Object.fromEntries(
    await Promise.all(
      Object.entries(paths).map(async ([key, path]) => [
        key,
        sha256(await readFile(resolve(repoRoot, path))),
      ]),
    ),
  );
}
