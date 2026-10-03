// SRS-4R-A content-free diagnostics; no provider adapter or raw response retention.
import { z } from "zod";
import { SupervisorInputSchema, type SupervisorInput } from "./srs4-supervisor.js";
import {
  AssessmentFailureCodeSchema,
  AssessmentValidationCountsSchema,
  validateSkillAssessmentBatch,
  type AssessmentValidation,
} from "./srs4r-assessment.js";

export const SRS4R_A_DIAGNOSTIC_ID = "SRS-4R-A-ASSESSMENT-DIAGNOSTIC-V1";
export const AssessmentDiagnosticStageSchema = z.enum([
  "OUTPUT_PRESENT",
  "JSON_PARSE_VALID",
  "WIRE_SCHEMA_VALID",
  "CANDIDATE_COVERAGE_VALID",
  "REVISION_BINDING_VALID",
  "EVIDENCE_VALID",
  "APPLICABILITY_VALID",
  "VALID",
]);
export const AssessmentDiagnosticFailureCodeSchema = z.union([
  AssessmentFailureCodeSchema,
  z.enum(["MISSING_OUTPUT", "JSON_PARSE_FAILED"]),
]);
export const AssessmentDiagnosticSchema = z
  .object({
    diagnosticId: z.literal(SRS4R_A_DIAGNOSTIC_ID),
    scenarioId: z.string().nullable(),
    validatorStatus: z.enum(["VALID", "FAILED"]),
    firstFailedStage: AssessmentDiagnosticStageSchema.nullable(),
    failureCodes: z.array(AssessmentDiagnosticFailureCodeSchema),
    outputPresent: z.boolean(),
    jsonParseValid: z.boolean().nullable(),
    wireSchemaValid: z.boolean().nullable(),
    counts: AssessmentValidationCountsSchema,
  })
  .strict();
export type AssessmentDiagnostic = z.infer<typeof AssessmentDiagnosticSchema>;

function stageFor(code: z.infer<typeof AssessmentFailureCodeSchema>) {
  if (code === "WIRE_SCHEMA_INVALID") return "WIRE_SCHEMA_VALID" as const;
  if (
    code === "CANDIDATE_SET_MISMATCH" ||
    code === "DUPLICATE_CANDIDATE" ||
    code === "UNKNOWN_CANDIDATE"
  )
    return "CANDIDATE_COVERAGE_VALID" as const;
  if (code === "REVISION_MISMATCH") return "REVISION_BINDING_VALID" as const;
  if (
    code === "PROFILE_REF_INVALID" ||
    code === "APPLICABILITY_REASON_MISMATCH" ||
    code === "INCOMPATIBLE_PREREQUISITE_REASONS"
  )
    return "APPLICABILITY_VALID" as const;
  return "EVIDENCE_VALID" as const;
}

export function diagnoseSkillAssessorBatchOutput(
  inputValue: SupervisorInput,
  rawOutput: unknown,
  scenarioId: string | null = null,
): { diagnostic: AssessmentDiagnostic; validation: AssessmentValidation } {
  const input = SupervisorInputSchema.parse(inputValue);
  const outputPresent = rawOutput !== null && rawOutput !== undefined;
  let jsonParseValid: boolean | null = null;
  let output: unknown = rawOutput;
  let preFailure: "MISSING_OUTPUT" | "JSON_PARSE_FAILED" | null = null;
  if (!outputPresent) preFailure = "MISSING_OUTPUT";
  else if (typeof rawOutput === "string") {
    try {
      output = JSON.parse(rawOutput) as unknown;
      jsonParseValid = true;
    } catch {
      jsonParseValid = false;
      preFailure = "JSON_PARSE_FAILED";
    }
  } else jsonParseValid = true;
  const validation = validateSkillAssessmentBatch(input, preFailure ? undefined : output);
  const stages = validation.failureCodes.map(stageFor);
  const order = AssessmentDiagnosticStageSchema.options;
  const firstFailedStage = preFailure
    ? preFailure === "MISSING_OUTPUT"
      ? "OUTPUT_PRESENT"
      : "JSON_PARSE_VALID"
    : (order.find((stage) => stages.includes(stage as (typeof stages)[number])) ?? null);
  const diagnostic = AssessmentDiagnosticSchema.parse({
    diagnosticId: SRS4R_A_DIAGNOSTIC_ID,
    scenarioId,
    validatorStatus: preFailure ? "FAILED" : validation.status,
    firstFailedStage,
    failureCodes: preFailure ? [preFailure] : validation.failureCodes,
    outputPresent,
    jsonParseValid,
    wireSchemaValid: preFailure ? null : !validation.failureCodes.includes("WIRE_SCHEMA_INVALID"),
    counts: validation.counts,
  });
  return { diagnostic, validation };
}
