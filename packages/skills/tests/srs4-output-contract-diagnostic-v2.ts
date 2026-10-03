// SRS-4-D4: content-free V2 diagnostics. V1/D2 observations remain immutable.
import { z } from "zod";
import { SupervisorInputSchema, type SupervisorInput } from "./srs4-supervisor.js";
import {
  Srs4V2FailureCodeSchema,
  Srs4V2StageSchema,
  Srs4V2ValidationCountsSchema,
  validateSupervisorJudgmentV2Detailed,
  type SkillSelectionV2,
} from "./srs4-supervisor-v2.js";

export const SRS4_D4_DIAGNOSTIC_ID = "SRS-4-D4-OUTPUT-CONTRACT-DIAG-V2";
export const SRS4_D4_STAGE_ORDER = Srs4V2StageSchema.options;
export const Srs4D4DiagnosticSchema = z
  .object({
    diagnosticId: z.literal(SRS4_D4_DIAGNOSTIC_ID),
    scenarioId: z.string().nullable(),
    validatorStatus: z.enum(["VALID", "INVALID"]),
    firstFailedStage: Srs4V2StageSchema.nullable(),
    failureCodes: z.array(Srs4V2FailureCodeSchema),
    providerResponsePresent: z.boolean(),
    outputPresent: z.boolean(),
    jsonParseValid: z.boolean().nullable(),
    wireSchemaValid: z.boolean().nullable(),
    applicationValid: z.boolean().nullable(),
    counts: Srs4V2ValidationCountsSchema,
  })
  .strict();
export type Srs4D4Diagnostic = z.infer<typeof Srs4D4DiagnosticSchema>;

export function diagnoseSupervisorOutputV2(
  inputValue: SupervisorInput,
  rawOutput: unknown,
  scenarioId: string | null = null,
  providerResponsePresent = true,
): { diagnostic: Srs4D4Diagnostic; selection: SkillSelectionV2 } {
  const input = SupervisorInputSchema.parse(inputValue);
  const outputPresent = rawOutput !== null && rawOutput !== undefined;
  let jsonParseValid: boolean | null = null;
  let output: unknown = rawOutput;
  let preFailure: "MISSING_PROVIDER_OUTPUT" | "JSON_PARSE_FAILED" | null = null;
  if (!outputPresent) preFailure = "MISSING_PROVIDER_OUTPUT";
  else if (typeof rawOutput === "string") {
    try {
      output = JSON.parse(rawOutput) as unknown;
      jsonParseValid = true;
    } catch {
      jsonParseValid = false;
      preFailure = "JSON_PARSE_FAILED";
    }
  } else jsonParseValid = true;
  const detail = validateSupervisorJudgmentV2Detailed(input, preFailure ? undefined : output);
  const first = preFailure
    ? preFailure === "JSON_PARSE_FAILED"
      ? "JSON_PARSE_VALID"
      : providerResponsePresent
        ? "OUTPUT_TEXT_OR_OBJECT_PRESENT"
        : "PROVIDER_RESPONSE_PRESENT"
    : (SRS4_D4_STAGE_ORDER.find((stage) =>
        detail.violations.some((item) => item.stage === stage),
      ) ?? null);
  const failureCodes = preFailure
    ? [preFailure]
    : [...new Set(detail.violations.map((item) => item.code))];
  const diagnostic = Srs4D4DiagnosticSchema.parse({
    diagnosticId: SRS4_D4_DIAGNOSTIC_ID,
    scenarioId,
    validatorStatus: preFailure || detail.violations.length ? "INVALID" : "VALID",
    firstFailedStage: first,
    failureCodes,
    providerResponsePresent,
    outputPresent,
    jsonParseValid,
    wireSchemaValid: preFailure ? null : detail.wireSchemaValid,
    applicationValid: preFailure || !detail.wireSchemaValid ? null : detail.violations.length === 0,
    counts: detail.counts,
  });
  if ((diagnostic.validatorStatus === "VALID") !== (detail.selection.status !== "FAILED"))
    throw Error("SRS-4-D4 diagnostic/V2 validator parity drift");
  return { diagnostic, selection: detail.selection };
}

export function diagnoseSupervisorProviderResponseV2(
  input: SupervisorInput,
  providerResponse: unknown,
  scenarioId: string | null = null,
): { diagnostic: Srs4D4Diagnostic; selection: SkillSelectionV2 } {
  if (providerResponse === null || providerResponse === undefined) {
    const result = diagnoseSupervisorOutputV2(input, null, scenarioId, false);
    return {
      ...result,
      selection: {
        status: "FAILED",
        selectedCapabilities: [],
        candidateDecisions: [],
        failureCode: "PROVIDER_FAILURE",
      },
    };
  }
  const response =
    typeof providerResponse === "object" && providerResponse !== null
      ? (providerResponse as Record<string, unknown>)
      : null;
  if (response?.status !== "completed") return diagnoseSupervisorOutputV2(input, null, scenarioId);
  const messages = Array.isArray(response.output) ? response.output : [];
  const contents = messages.flatMap((item) => {
    const message =
      typeof item === "object" && item !== null ? (item as Record<string, unknown>) : null;
    return Array.isArray(message?.content) ? message.content : [];
  });
  const part = contents.find(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      (item as Record<string, unknown>).type === "output_text" &&
      typeof (item as Record<string, unknown>).text === "string",
  ) as Record<string, unknown> | undefined;
  return diagnoseSupervisorOutputV2(input, part?.text ?? null, scenarioId);
}
