import { srs4AuditRaw } from "../../test-fixtures/src/srs4-audit-raw.js";

export const SRS4_AUDIT_R1_FREEZE_SHA256 =
  "232a7e5815fe44ecc51c40cef903590d89163e42be76bcab7995c434b4325844";

const revisions = new Map<string, string>([
  ["A05", "Remove request from forbidden; leave it unlabeled."],
  ["A10", "Remove request from forbidden; leave it unlabeled."],
  ["A19", "Remove request from forbidden; leave it unlabeled."],
  ["A24", "Remove request from forbidden; leave it unlabeled."],
  ["A30", "Add visible repeated-pressure evidence in new raw revision or remove boundary_setting."],
  ["A35", "Remove request from forbidden; leave it unlabeled."],
]);

// User-relayed ChatGPT semantic review of R1. This is model review, not human
// or qualified-human approval. It does not authorize provider evaluation.
export const srs4AuditIndependentReviewR1 = srs4AuditRaw.map((row) => ({
  id: row.id,
  reviewedRevision: "R1" as const,
  reviewerType: "CHATGPT_MODEL_SEMANTIC_REVIEW" as const,
  decisionSource: "USER_RELAYED_REVIEW_RESULT" as const,
  qualifiedHumanApproval: false as const,
  decision: revisions.has(row.id) ? ("REVISE" as const) : ("APPROVE" as const),
  requestedChange: revisions.get(row.id) ?? null,
}));
