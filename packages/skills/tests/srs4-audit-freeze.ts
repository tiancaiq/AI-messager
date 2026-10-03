import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { format } from "prettier";
import { CoachingRequestSchema } from "@ai-message-coach/contracts";
import { srs3RawScenarios } from "../../test-fixtures/src/srs3-ranking-development.js";
import { srs3eSemanticCalibrationRaw } from "../../test-fixtures/src/srs3e-semantic-calibration.js";
import { srs4AuditRaw } from "../../test-fixtures/src/srs4-audit-raw.js";
import { packageRoot } from "../authoring/generator.js";
import { srs4AuditAnnotations } from "./srs4-audit-annotations.js";
import { srs4AuditAuthorReview } from "./srs4-audit-author-review.js";
import { SRS4_B_SHA256, SRS4_USER_FACT_GATED_CAPABILITIES } from "./srs4-supervisor.js";

const root = resolve(packageRoot, "../..");
const files = {
  raw: "packages/test-fixtures/src/srs4-audit-raw.ts",
  annotations: "packages/skills/tests/srs4-audit-annotations.ts",
  authorReview: "packages/skills/tests/srs4-audit-author-review.ts",
} as const;
const sha256 = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest("hex");
const unique = (values: readonly string[]) => new Set(values).size === values.length;
const fail = (message: string): never => {
  throw Error("SRS-4 audit authoring: " + message);
};

export interface Srs4AuditCoverage {
  cases: number;
  single: number;
  multi: number;
  wordingNone: number;
  structural: number;
  positiveModes: Record<"REWRITE_DRAFT" | "SUGGEST_REPLY" | "COMPLETE_DRAFT", number>;
  requiredOccurrences: number;
  forbiddenOccurrences: number;
  perSkillRequired: Record<string, number>;
  independentReviewed: number;
  quarantined: number;
}

export function validateSrs4AuditAuthoring(): Srs4AuditCoverage {
  if (
    srs4AuditRaw.length !== 64 ||
    srs4AuditAnnotations.length !== 64 ||
    srs4AuditAuthorReview.length !== 64
  )
    fail("expected exactly 64 raw, label and author-review rows");
  const ids = srs4AuditRaw.map((row) => row.id);
  const families = srs4AuditRaw.map((row) => row.scenarioFamily);
  const developmentFamilies = new Set([
    ...srs3RawScenarios.map((row) => row.scenarioFamily),
    ...srs3eSemanticCalibrationRaw.map((row) => row.scenarioFamily),
  ]);
  if (
    !unique(ids) ||
    !unique(families) ||
    families.some((family) => developmentFamilies.has(family))
  )
    fail("duplicate ID/family or development-family collision");
  const coverage: Srs4AuditCoverage = {
    cases: 64,
    single: 0,
    multi: 0,
    wordingNone: 0,
    structural: 0,
    positiveModes: { REWRITE_DRAFT: 0, SUGGEST_REPLY: 0, COMPLETE_DRAFT: 0 },
    requiredOccurrences: 0,
    forbiddenOccurrences: 0,
    perSkillRequired: {},
    independentReviewed: 0,
    quarantined: 0,
  };
  const atomic = new Set([
    "acknowledge_mistake",
    "apology",
    "ask_for_help",
    "boundary_setting",
    "clarification",
    "de_escalation",
    "decline",
    "emotional_validation",
    "expectation_setting",
    "follow_up",
    "planning",
    "reassurance",
    "request",
    "status_update",
  ]);
  const pairCoverage = new Set<string>();
  for (const [index, row] of srs4AuditRaw.entries()) {
    const label = srs4AuditAnnotations[index]!;
    const review = srs4AuditAuthorReview[index]!;
    CoachingRequestSchema.parse(row.request);
    if (
      row.id !== `A${String(index + 1).padStart(2, "0")}` ||
      label.id !== row.id ||
      review.id !== row.id ||
      row.revision !== label.reviewedRevision ||
      row.revision !== review.reviewedRevision ||
      row.split !== "EXPOSED_AUDIT_UNSCORED" ||
      review.reviewerType !== "CODEX_AUTHOR_SELF_REVIEW" ||
      review.independentReview !== "PENDING" ||
      review.rationale.length < 45
    )
      fail(row.id + " ID/provenance/review mismatch");
    if (!unique([...label.required, ...label.acceptable, ...label.forbidden]))
      fail(row.id + " overlapping or duplicate labels");
    if ([...label.required, ...label.acceptable, ...label.forbidden].some((id) => !atomic.has(id)))
      fail(row.id + " non-atomic or unknown label");
    if (label.strictNone !== (label.required.length === 0 && label.acceptable.length === 0))
      fail(row.id + " strict NONE mismatch");
    const draft = row.request.analysis.draft.text?.trim() ?? "";
    if (
      !draft &&
      !row.request.analysis.messages.some((message) => message.speaker === "USER") &&
      label.required.some((id) => SRS4_USER_FACT_GATED_CAPABILITIES.has(id))
    )
      fail(row.id + " required factual skill has selected-goal-only support");
    if (["REWRITE_DRAFT", "COMPLETE_DRAFT"].includes(row.fixedAction) !== Boolean(draft))
      fail(row.id + " action/draft mismatch");
    if (row.fixedAction === "SUGGEST_REPLY" && row.request.selection?.kind !== "ACTION")
      fail(row.id + " empty draft needs fixed goal");
    if (row.fixedAction === "COMPLETE_DRAFT" && row.request.selection?.kind !== "ACTION")
      fail(row.id + " completion needs fixed goal");
    if (
      row.request.analysis.language.primary !== "en" ||
      row.request.analysis.language.codeSwitching
    )
      fail(row.id + " language outside first audit");
    if (row.role === "SINGLE") {
      coverage.single++;
      if (label.required.length !== 1) fail(row.id + " single-required mismatch");
    } else if (row.role === "MULTI") {
      coverage.multi++;
      if (label.required.length < 2) fail(row.id + " multi-required mismatch");
    } else if (row.role === "WORDING_NONE") {
      coverage.wordingNone++;
      if (
        !label.strictNone ||
        !["REWRITE_DRAFT", "SUGGEST_REPLY", "COMPLETE_DRAFT"].includes(row.fixedAction)
      )
        fail(row.id + " wording NONE mismatch");
    } else {
      coverage.structural++;
      if (
        !label.strictNone ||
        !["NO_REPLY_NEEDED", "SUGGEST_ACTIONS", "ASK_CLARIFICATION"].includes(row.fixedAction)
      )
        fail(row.id + " structural mismatch");
    }
    if (row.role === "SINGLE" || row.role === "MULTI") {
      coverage.positiveModes[row.fixedAction as keyof typeof coverage.positiveModes]++;
    }
    coverage.requiredOccurrences += label.required.length;
    coverage.forbiddenOccurrences += label.forbidden.length;
    for (const id of label.required) {
      coverage.perSkillRequired[id] = (coverage.perSkillRequired[id] ?? 0) + 1;
      for (const negative of label.forbidden) pairCoverage.add([id, negative].sort().join("/"));
    }
    if (review.independentReview !== "PENDING") coverage.independentReviewed++;
    if (review.decision === "QUARANTINE") coverage.quarantined++;
  }
  if (
    coverage.single !== 24 ||
    coverage.multi !== 16 ||
    coverage.wordingNone !== 16 ||
    coverage.structural !== 8 ||
    coverage.positiveModes.REWRITE_DRAFT < 18 ||
    coverage.positiveModes.SUGGEST_REPLY < 18 ||
    coverage.positiveModes.COMPLETE_DRAFT < 4 ||
    coverage.forbiddenOccurrences < 24 ||
    atomic.size !== Object.keys(coverage.perSkillRequired).length ||
    Object.values(coverage.perSkillRequired).some((count) => count < 2)
  )
    fail("predeclared coverage missing");
  const requiredPairs = [
    "follow_up/request",
    "planning/status_update",
    "expectation_setting/planning",
    "boundary_setting/de_escalation",
    "acknowledge_mistake/apology",
    "emotional_validation/reassurance",
    "clarification/request",
  ].map((pair) => pair.split("/").sort().join("/"));
  if (requiredPairs.some((pair) => !pairCoverage.has(pair)))
    fail("seven boundary-pair hard negatives incomplete");
  return coverage;
}

export async function renderSrs4AuditAuthoringFreeze(): Promise<string> {
  const coverage = validateSrs4AuditAuthoring();
  const hashes = Object.fromEntries(
    await Promise.all(
      Object.entries(files).map(async ([key, path]) => [
        key,
        sha256(await readFile(resolve(root, path))),
      ]),
    ),
  );
  return format(
    JSON.stringify({
      schemaVersion: 1,
      freezeId: "SRS-4-AUDIT-AUTHORING-R1",
      status: "AUTHORING_FROZEN_INDEPENDENT_REVIEW_PENDING",
      evidenceUse: "EXPOSED_AUDIT_UNSCORED",
      providerCallsAuthorized: false,
      auditScored: false,
      challengeRead: false,
      frozenB: SRS4_B_SHA256,
      sourcePaths: files,
      sourceSha256: hashes,
      coverage,
      gate: "CLOSED_UNTIL_INDEPENDENT_REVIEW_AND_SEPARATE_PROVIDER_KEY_BUDGET_APPROVAL",
    }),
    { parser: "json", printWidth: 100, tabWidth: 2, endOfLine: "lf" },
  );
}
