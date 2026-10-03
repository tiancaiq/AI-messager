import { srs4AuditRaw, type Srs4AuditRaw } from "./srs4-audit-raw.js";

export type Srs4AuditRawR2 = Omit<Srs4AuditRaw, "revision"> & { revision: "R1" | "R2" };

// R1 is immutable. Only A30 receives new raw evidence; the other 63 rows retain
// their exact R1 requests and revision bindings.
export const srs4AuditRawR2: readonly Srs4AuditRawR2[] = srs4AuditRaw.map((row) => {
  if (row.id !== "A30") return row;
  return {
    ...row,
    revision: "R2",
    request: {
      ...row.request,
      analysis: {
        ...row.request.analysis,
        messages: [
          {
            id: "m1",
            order: 1,
            speaker: "OTHER",
            speakerConfidence: 0.99,
            text: "Could you cover Monday's overnight shift?",
            textConfidence: 0.99,
          },
          {
            id: "m2",
            order: 2,
            speaker: "USER",
            speakerConfidence: 0.99,
            text: "No, I no longer take overnight shifts.",
            textConfidence: 0.99,
          },
          {
            id: "m3",
            order: 3,
            speaker: "OTHER",
            speakerConfidence: 0.99,
            text: "Could you cover tonight's overnight shift anyway?",
            textConfidence: 0.99,
          },
        ],
      },
    },
  };
});
