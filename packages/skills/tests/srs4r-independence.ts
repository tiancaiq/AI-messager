// SRS-4R-A mandatory gate. Fake parity tests never count as a live gate pass.
import { z } from "zod";
import { AssessmentValidationSchema, type SkillAssessment } from "./srs4r-assessment.js";

export const SRS4R_A_INDEPENDENCE_GATE_ID = "SRS-4R-A-SINGLETON-BATCH-INDEPENDENCE-V1";
export const SRS4R_A_INDEPENDENCE_CASE_KEYS = [
  "SRS3B:R06",
  "SRS3B:R10",
  "SRS3B:R14",
  "SRS3B:R19",
  "SRS3B:R24",
  "SRS3B:R26",
  "CONTROL:K21",
  "CONTROL:K22",
] as const;

export const IndependenceRecordSchema = z
  .object({
    key: z.enum(SRS4R_A_INDEPENDENCE_CASE_KEYS),
    batchIdOrder: AssessmentValidationSchema,
    batchReverseOrder: AssessmentValidationSchema,
    allSingletons: AssessmentValidationSchema,
  })
  .strict();
export type IndependenceRecord = z.infer<typeof IndependenceRecordSchema>;
export const IndependenceGateResultSchema = z
  .object({
    gateId: z.literal(SRS4R_A_INDEPENDENCE_GATE_ID),
    gateStatus: z.enum(["NOT_RUN", "PASS", "FAIL"]),
    parityStatus: z.enum(["NOT_RUN", "PASS", "FAIL"]),
    evidenceKind: z.enum(["NONE", "OFFLINE_FAKE", "LIVE_PROVIDER"]),
    expectedCaseCount: z.literal(8),
    observedCaseCount: z.number().int().nonnegative(),
    comparedCandidateCount: z.number().int().nonnegative(),
    applicabilityMismatchCount: z.number().int().nonnegative(),
    supportDecisionMismatchCount: z.number().int().nonnegative(),
    invalidViewCount: z.number().int().nonnegative(),
    reasonMismatchCount: z.number().int().nonnegative(),
    mismatches: z.array(
      z
        .object({
          key: z.string(),
          skillId: z.string(),
          view: z.enum(["BATCH_REVERSE_ORDER", "ALL_SINGLETONS"]),
        })
        .strict(),
    ),
  })
  .strict();
export type IndependenceGateResult = z.infer<typeof IndependenceGateResultSchema>;

function sameReasons(a: SkillAssessment, b: SkillAssessment): boolean {
  return (
    JSON.stringify([...a.supportReasonCodes].sort()) ===
      JSON.stringify([...b.supportReasonCodes].sort()) &&
    JSON.stringify([...a.blockingReasonCodes].sort()) ===
      JSON.stringify([...b.blockingReasonCodes].sort())
  );
}

export function evaluateSingletonBatchIndependence(
  rawRecords: readonly IndependenceRecord[],
  evidenceKind: "OFFLINE_FAKE" | "LIVE_PROVIDER",
): IndependenceGateResult {
  const records = rawRecords.map((record) => IndependenceRecordSchema.parse(record));
  const seen = new Set(records.map((record) => record.key));
  let invalidViewCount = 0;
  let comparedCandidateCount = 0;
  let applicabilityMismatchCount = 0;
  let supportDecisionMismatchCount = 0;
  let reasonMismatchCount = 0;
  const mismatches: IndependenceGateResult["mismatches"] = [];
  for (const record of records) {
    const views = [record.batchIdOrder, record.batchReverseOrder, record.allSingletons];
    invalidViewCount += views.filter((view) => view.status !== "VALID").length;
    if (views.some((view) => view.status !== "VALID")) continue;
    const baseline = new Map(record.batchIdOrder.assessments.map((row) => [row.skillId, row]));
    for (const [viewName, view] of [
      ["BATCH_REVERSE_ORDER", record.batchReverseOrder],
      ["ALL_SINGLETONS", record.allSingletons],
    ] as const) {
      const actual = new Map(view.assessments.map((row) => [row.skillId, row]));
      for (const [skillId, reference] of baseline) {
        comparedCandidateCount++;
        const row = actual.get(skillId);
        if (!row || row.applicability !== reference.applicability) {
          applicabilityMismatchCount++;
          mismatches.push({ key: record.key, skillId, view: viewName });
        }
        const supported = (value: SkillAssessment | undefined) =>
          value?.applicability === "CORE" || value?.applicability === "SUPPORTING";
        if (supported(row) !== supported(reference)) supportDecisionMismatchCount++;
        if (!row || !sameReasons(reference, row)) reasonMismatchCount++;
      }
      if (actual.size !== baseline.size) invalidViewCount++;
    }
  }
  const complete =
    records.length === SRS4R_A_INDEPENDENCE_CASE_KEYS.length &&
    seen.size === SRS4R_A_INDEPENDENCE_CASE_KEYS.length &&
    SRS4R_A_INDEPENDENCE_CASE_KEYS.every((key) => seen.has(key));
  const parityStatus =
    complete &&
    invalidViewCount === 0 &&
    applicabilityMismatchCount === 0 &&
    supportDecisionMismatchCount === 0 &&
    comparedCandidateCount === records.length * 20
      ? "PASS"
      : "FAIL";
  return IndependenceGateResultSchema.parse({
    gateId: SRS4R_A_INDEPENDENCE_GATE_ID,
    gateStatus: evidenceKind === "LIVE_PROVIDER" ? parityStatus : "NOT_RUN",
    parityStatus,
    evidenceKind,
    expectedCaseCount: 8,
    observedCaseCount: records.length,
    comparedCandidateCount,
    applicabilityMismatchCount,
    supportDecisionMismatchCount,
    invalidViewCount,
    reasonMismatchCount,
    mismatches,
  });
}

export function unrunIndependenceGate(): IndependenceGateResult {
  return IndependenceGateResultSchema.parse({
    gateId: SRS4R_A_INDEPENDENCE_GATE_ID,
    gateStatus: "NOT_RUN",
    parityStatus: "NOT_RUN",
    evidenceKind: "NONE",
    expectedCaseCount: 8,
    observedCaseCount: 0,
    comparedCandidateCount: 0,
    applicabilityMismatchCount: 0,
    supportDecisionMismatchCount: 0,
    invalidViewCount: 0,
    reasonMismatchCount: 0,
    mismatches: [],
  });
}
