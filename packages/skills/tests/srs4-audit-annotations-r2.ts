import { srs4AuditAnnotations, type Srs4AuditAnnotation } from "./srs4-audit-annotations.js";
import type { Srs4AuditRawR2 } from "../../test-fixtures/src/srs4-audit-raw-r2.js";

export type Srs4AuditAnnotationR2 = Omit<Srs4AuditAnnotation, "reviewedRevision"> & {
  reviewedRevision: Srs4AuditRawR2["revision"];
};

const requestUnlabeled = new Set(["A05", "A10", "A19", "A24", "A35"]);

// Only explicit R1 forbidden labels are withdrawn. `request` is UNLABELED,
// never silently promoted to acceptable or required.
export const srs4AuditAnnotationsR2: readonly Srs4AuditAnnotationR2[] = srs4AuditAnnotations.map(
  (row) => ({
    ...row,
    reviewedRevision: row.id === "A30" ? "R2" : "R1",
    forbidden: requestUnlabeled.has(row.id)
      ? row.forbidden.filter((id) => id !== "request")
      : row.forbidden,
  }),
);
