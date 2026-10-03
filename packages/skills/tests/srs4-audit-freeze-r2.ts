import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { format } from "prettier";
import { CoachingRequestSchema } from "@ai-message-coach/contracts";
import { srs4AuditRaw } from "../../test-fixtures/src/srs4-audit-raw.js";
import { srs4AuditRawR2 } from "../../test-fixtures/src/srs4-audit-raw-r2.js";
import { packageRoot } from "../authoring/generator.js";
import { srs4AuditAnnotations } from "./srs4-audit-annotations.js";
import { srs4AuditAnnotationsR2 } from "./srs4-audit-annotations-r2.js";
import { validateSrs4AuditAuthoring } from "./srs4-audit-freeze.js";
import {
  SRS4_AUDIT_R1_FREEZE_SHA256,
  srs4AuditIndependentReviewR1,
} from "./srs4-audit-independent-review-r1.js";
import {
  SRS4_AUDIT_R2_REVIEWED_SOURCE_SHA256,
  srs4AuditIndependentReviewR2,
} from "./srs4-audit-independent-review-r2.js";
import { SRS4_B_SHA256 } from "./srs4-supervisor.js";

const root = resolve(packageRoot, "../..");
const files = {
  rawR1: "packages/test-fixtures/src/srs4-audit-raw.ts",
  annotationsR1: "packages/skills/tests/srs4-audit-annotations.ts",
  rawR2: "packages/test-fixtures/src/srs4-audit-raw-r2.ts",
  annotationsR2: "packages/skills/tests/srs4-audit-annotations-r2.ts",
  independentReviewR1: "packages/skills/tests/srs4-audit-independent-review-r1.ts",
  independentReviewR2: "packages/skills/tests/srs4-audit-independent-review-r2.ts",
  freezeR1: "packages/skills/tests/fixtures/srs4/audit-authoring-freeze-v1.json",
} as const;
const sha256 = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest("hex");
const revise = new Set(["A05", "A10", "A19", "A24", "A30", "A35"]);
const requestUnlabeled = new Set(["A05", "A10", "A19", "A24", "A35"]);
const assert = (condition: unknown, message: string): void => {
  if (!condition) throw Error(`SRS-4 R2 audit freeze: ${message}`);
};

export async function validateSrs4AuditAuthoringR2() {
  const r1Coverage = validateSrs4AuditAuthoring();
  const r1Freeze = await readFile(resolve(root, files.freezeR1));
  assert(sha256(r1Freeze) === SRS4_AUDIT_R1_FREEZE_SHA256, "R1 freeze binding drift");
  for (const [key, expected] of Object.entries(SRS4_AUDIT_R2_REVIEWED_SOURCE_SHA256)) {
    assert(
      sha256(await readFile(resolve(root, files[key as "rawR2" | "annotationsR2"]))) === expected,
      `${key} changed after model semantic review`,
    );
  }
  assert(
    srs4AuditRawR2.length === 64 &&
      srs4AuditAnnotationsR2.length === 64 &&
      srs4AuditIndependentReviewR1.length === 64 &&
      srs4AuditIndependentReviewR2.length === 6,
    "64 aligned rows required",
  );
  let approvedR1 = 0;
  let revisedR1 = 0;
  let forbiddenOccurrences = 0;
  let requiredOccurrences = 0;
  for (let index = 0; index < 64; index++) {
    const oldRaw = srs4AuditRaw[index]!;
    const raw = srs4AuditRawR2[index]!;
    const oldLabel = srs4AuditAnnotations[index]!;
    const label = srs4AuditAnnotationsR2[index]!;
    const review = srs4AuditIndependentReviewR1[index]!;
    assert(raw.id === oldRaw.id && label.id === raw.id && review.id === raw.id, "ID alignment");
    assert(
      review.reviewerType === "CHATGPT_MODEL_SEMANTIC_REVIEW" &&
        review.decisionSource === "USER_RELAYED_REVIEW_RESULT" &&
        review.qualifiedHumanApproval === false &&
        review.reviewedRevision === "R1",
      "review provenance",
    );
    assert(
      review.decision === (revise.has(raw.id) ? "REVISE" : "APPROVE"),
      `${raw.id} review decision`,
    );
    assert(review.requestedChange === null || revise.has(raw.id), `${raw.id} unexpected request`);
    if (review.decision === "APPROVE") approvedR1++;
    else revisedR1++;
    assert(raw.split === "EXPOSED_AUDIT_UNSCORED", `${raw.id} split drift`);
    CoachingRequestSchema.parse(raw.request);
    assert(raw.revision === (raw.id === "A30" ? "R2" : "R1"), `${raw.id} raw revision`);
    assert(label.reviewedRevision === raw.revision, `${raw.id} label/raw revision`);
    if (raw.id !== "A30")
      assert(JSON.stringify(raw) === JSON.stringify(oldRaw), `${raw.id} raw drift`);
    else {
      assert(
        JSON.stringify({ ...raw, revision: "R1", request: oldRaw.request }) ===
          JSON.stringify(oldRaw),
        "A30 changed outside raw request",
      );
      const messages = raw.request.analysis.messages;
      assert(
        messages.length >= 3 &&
          messages.filter((m) => m.speaker === "OTHER" && /overnight shift/u.test(m.text)).length >=
            2 &&
          messages.some(
            (m) => m.speaker === "USER" && /no longer take overnight shifts/u.test(m.text),
          ),
        "A30 requires visible repeated pressure and user-owned continuing limit",
      );
    }
    const expectedForbidden = requestUnlabeled.has(raw.id)
      ? oldLabel.forbidden.filter((id) => id !== "request")
      : oldLabel.forbidden;
    assert(
      JSON.stringify(label.required) === JSON.stringify(oldLabel.required) &&
        JSON.stringify(label.acceptable) === JSON.stringify(oldLabel.acceptable) &&
        JSON.stringify(label.forbidden) === JSON.stringify(expectedForbidden) &&
        label.strictNone === oldLabel.strictNone,
      `${raw.id} unexpected label drift`,
    );
    assert(
      !requestUnlabeled.has(raw.id) ||
        ![...label.required, ...label.acceptable, ...label.forbidden].includes("request"),
      `${raw.id} request not unlabeled`,
    );
    requiredOccurrences += label.required.length;
    forbiddenOccurrences += label.forbidden.length;
  }
  assert(approvedR1 === 58 && revisedR1 === 6, "review counts");
  const revisedIds = srs4AuditIndependentReviewR2.map((row) => row.id);
  assert(
    new Set(revisedIds).size === 6 &&
      revisedIds.every((id) => revise.has(id)) &&
      [...revise].every((id) => revisedIds.includes(id as (typeof revisedIds)[number])),
    "R2 approval IDs must exactly match six R1 REVISE IDs",
  );
  for (const review of srs4AuditIndependentReviewR2) {
    const raw = srs4AuditRawR2.find((row) => row.id === review.id);
    assert(
      raw &&
        review.reviewedAuthoringRevision === "R2" &&
        review.reviewedRawRevision === raw.revision &&
        review.reviewerType === "CHATGPT_MODEL_SEMANTIC_REVIEW" &&
        review.decisionSource === "USER_RELAYED_REVIEW_RESULT" &&
        review.qualifiedHumanApproval === false &&
        review.decision === "APPROVE" &&
        review.rationale === null,
      `${review.id} R2 model review provenance/decision`,
    );
  }
  assert(requiredOccurrences === 56 && forbiddenOccurrences === 65, "R2 label counts");
  return {
    ...r1Coverage,
    requiredOccurrences,
    forbiddenOccurrences,
    approvedR1,
    revisedR1,
    approvedR2: 6,
    semanticApproved: 64,
    modelReviewed: 64,
    humanApproved: 0,
    revisedR2PendingConfirmation: 0,
    quarantined: 0,
  };
}

export async function renderSrs4AuditAuthoringFreezeR2(): Promise<string> {
  const coverage = await validateSrs4AuditAuthoringR2();
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
      schemaVersion: 3,
      freezeId: "SRS-4-AUDIT-AUTHORING-R2",
      status: "AUTHORING_FROZEN_MODEL_SEMANTIC_REVIEW_APPROVED_UNSCORED",
      evidenceUse: "EXPOSED_AUDIT_UNSCORED",
      reviewerType: "CHATGPT_MODEL_SEMANTIC_REVIEW",
      decisionSource: "USER_RELAYED_REVIEW_RESULT",
      qualifiedHumanApproval: false,
      reviewBinding: "R1_MODEL_58_APPROVE_6_REVISE;R2_MODEL_6_APPROVE_0_REVISE_0_QUARANTINE",
      providerCallsAuthorized: false,
      auditScored: false,
      challengeRead: false,
      frozenB: SRS4_B_SHA256,
      sourcePaths: files,
      sourceSha256: hashes,
      coverage,
      gate: "CLOSED_NO_LIVE_PROVIDER_OR_AUDIT_SCORING_AUTHORIZATION",
      remainingGates: ["HUMAN_BOUNDARY_REVIEW", "PROVIDER_KEY_BUDGET_APPROVAL"],
    }),
    { parser: "json", printWidth: 100, tabWidth: 2, endOfLine: "lf" },
  );
}
