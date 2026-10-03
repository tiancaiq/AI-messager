import { srs4AuditRawR2 } from "../../test-fixtures/src/srs4-audit-raw-r2.js";

// Bind the user-relayed ChatGPT R2 decisions to the exact frozen source bytes.
// Detailed reviewer rationale/transcript was not supplied; do not represent
// these decisions as human, qualified-human, or live-model evaluation evidence.
export const SRS4_AUDIT_R2_REVIEWED_SOURCE_SHA256 = {
  rawR2: "477019208fcfef97e133f46ea0aba26c6faeb91bcf42b01557f1d0f3df259106",
  annotationsR2: "d51f2d90068f2bcb6a536258ce432dc7fbc0de3c100c9c92601178a65ad827b9",
} as const;

const approvedIds = ["A05", "A10", "A19", "A24", "A30", "A35"] as const;

export const srs4AuditIndependentReviewR2 = approvedIds.map((id) => ({
  id,
  reviewedAuthoringRevision: "R2" as const,
  reviewedRawRevision: srs4AuditRawR2.find((row) => row.id === id)!.revision,
  reviewerType: "CHATGPT_MODEL_SEMANTIC_REVIEW" as const,
  decisionSource: "USER_RELAYED_REVIEW_RESULT" as const,
  qualifiedHumanApproval: false as const,
  decision: "APPROVE" as const,
  rationale: null,
}));
