// SRS-4-D2: evaluation-only, content-free diagnostics for the frozen V1 validator.
// The V1 validator remains the sole acceptance authority and its bytes stay intact.
import { z } from "zod";
import {
  SRS4_USER_FACT_GATED_CAPABILITIES,
  SkillSelectionSchema,
  SupervisorInputSchema,
  SupervisorReasonSchema,
  WireJudgmentSchema,
  validateSupervisorJudgment,
  type SkillSelection,
  type SupervisorInput,
  type WireJudgment,
} from "./srs4-supervisor.js";

export const Srs4D2StageSchema = z.enum([
  "PROVIDER_RESPONSE_PRESENT",
  "OUTPUT_TEXT_OR_OBJECT_PRESENT",
  "JSON_PARSE_VALID",
  "WIRE_SCHEMA_VALID",
  "CANDIDATE_DECISION_COUNT_VALID",
  "NO_DUPLICATE_CANDIDATES",
  "CANDIDATE_ID_SET_VALID",
  "SELECTION_BUDGET_VALID",
  "REASON_POLARITY_VALID",
  "EVIDENCE_REF_UNIQUE",
  "EVIDENCE_REF_EXISTS",
  "OWNERSHIP_VALID",
  "NEGATION_PREREQUISITE_EVIDENCE_VALID",
  "FACT_GROUNDING_VALID",
  "RELATION_CONSTRAINTS_VALID",
  "FINAL_SELECTION_DERIVATION_VALID",
  "VALID",
]);
export type Srs4D2Stage = z.infer<typeof Srs4D2StageSchema>;
export const SRS4_D2_STAGE_ORDER = Srs4D2StageSchema.options;

export const Srs4D2FailureCodeSchema = z.enum([
  "MISSING_PROVIDER_OUTPUT",
  "JSON_PARSE_FAILED",
  "WIRE_SCHEMA_FAILED",
  "INVALID_DECISION_VALUE",
  "INVALID_REASON_CODE",
  "DUPLICATE_REASON_CODE",
  "INVALID_EVIDENCE_REF_FORMAT",
  "INVALID_EVIDENCE_USE",
  "MISSING_CANDIDATE_DECISION",
  "EXTRA_CANDIDATE_DECISION",
  "CANDIDATE_COUNT_MISMATCH",
  "DUPLICATE_CANDIDATE_ID",
  "UNKNOWN_CANDIDATE_ID",
  "REASON_POLARITY_MISMATCH",
  "SELECT_WITHOUT_POSITIVE_REASON",
  "REJECT_WITHOUT_REJECTION_REASON",
  "EVIDENCE_REF_USE_DUPLICATE",
  "UNKNOWN_EVIDENCE_REF",
  "INVALID_OBJECTIVE_SOURCE",
  "OTHER_USED_AS_USER_FACT",
  "UNKNOWN_USED_AS_USER_FACT",
  "SELECTED_GOAL_USED_AS_FACT",
  "NEGATION_EVIDENCE_INVALID",
  "PREREQUISITE_EVIDENCE_INVALID",
  "SELECT_WITHOUT_EVIDENCE",
  "SELECT_WITH_CONTEXT_ONLY",
  "FACT_GROUNDING_MISSING",
  "OVER_SELECTION_BUDGET",
  "UNSUPPORTED_CONFLICT_REASON",
  "MULTI_SKILL_REASON_WITHOUT_PAIR",
  "SELECTED_CONFLICT",
  "DIAGNOSTIC_PARITY_DRIFT",
]);
export type Srs4D2FailureCode = z.infer<typeof Srs4D2FailureCodeSchema>;

const counts = z
  .object({
    expectedCandidateCount: z.number().int().nonnegative(),
    returnedCandidateCount: z.number().int().nonnegative().nullable(),
    missingCandidateCount: z.number().int().nonnegative(),
    extraCandidateCount: z.number().int().nonnegative(),
    duplicateCandidateCount: z.number().int().nonnegative(),
    invalidReasonCodeCount: z.number().int().nonnegative(),
    reasonPolarityMismatchCount: z.number().int().nonnegative(),
    invalidEvidenceRefCount: z.number().int().nonnegative(),
    ownershipViolationCount: z.number().int().nonnegative(),
    factGroundingViolationCount: z.number().int().nonnegative(),
    selectedCountBeforeValidation: z.number().int().nonnegative().nullable(),
  })
  .strict();
export const Srs4D2DiagnosticSchema = z
  .object({
    scenarioId: z
      .string()
      .regex(/^[A-Za-z0-9:_-]{1,80}$/u)
      .nullable(),
    validatorStatus: z.enum(["VALID", "INVALID"]),
    firstFailedStage: Srs4D2StageSchema.nullable(),
    failureCodes: z.array(Srs4D2FailureCodeSchema),
    providerResponsePresent: z.boolean(),
    outputPresent: z.boolean(),
    jsonParseValid: z.boolean().nullable(),
    wireSchemaValid: z.boolean().nullable(),
    applicationValid: z.boolean().nullable(),
    counts,
  })
  .strict();
export type Srs4D2Diagnostic = z.infer<typeof Srs4D2DiagnosticSchema>;
export interface DiagnosticResult {
  diagnostic: Srs4D2Diagnostic;
  selection: SkillSelection | null;
}

type Violation = { stage: Srs4D2Stage; code: Srs4D2FailureCode };
const positiveReasons = new Set<z.infer<typeof SupervisorReasonSchema>>([
  "DIRECTLY_SUPPORTED",
  "DISTINCT_SUPPORTED_JOB",
  "COMPLEMENTS_SELECTED",
]);
const factualUses = new Set([
  "USER_FACT",
  "USER_RESPONSIBILITY",
  "USER_COMMITMENT",
  "USER_LIMIT",
  "USER_PROMISE",
]);

function emptyCounts(input: SupervisorInput): z.infer<typeof counts> {
  return {
    expectedCandidateCount: input.candidates.length,
    returnedCandidateCount: null,
    missingCandidateCount: 0,
    extraCandidateCount: 0,
    duplicateCandidateCount: 0,
    invalidReasonCodeCount: 0,
    reasonPolarityMismatchCount: 0,
    invalidEvidenceRefCount: 0,
    ownershipViolationCount: 0,
    factGroundingViolationCount: 0,
    selectedCountBeforeValidation: null,
  };
}

function finish(
  scenarioId: string | null,
  violations: readonly Violation[],
  numeric: z.infer<typeof counts>,
  states: Pick<
    Srs4D2Diagnostic,
    | "providerResponsePresent"
    | "outputPresent"
    | "jsonParseValid"
    | "wireSchemaValid"
    | "applicationValid"
  >,
  selection: SkillSelection | null,
): DiagnosticResult {
  const stage = SRS4_D2_STAGE_ORDER.find((candidate) =>
    violations.some((item) => item.stage === candidate),
  );
  const codes = [...new Set(violations.map((item) => item.code))];
  const diagnostic = Srs4D2DiagnosticSchema.parse({
    scenarioId,
    validatorStatus: violations.length ? "INVALID" : "VALID",
    firstFailedStage: stage ?? null,
    failureCodes: codes,
    ...states,
    counts: numeric,
  });
  if (diagnostic.validatorStatus === "VALID" && selection?.status === "FAILED")
    throw Error("D2 diagnostic/original validator parity drift");
  if (diagnostic.validatorStatus === "INVALID" && selection?.status !== "FAILED" && selection)
    throw Error("D2 diagnostic/original validator parity drift");
  // This parse also confirms the wrapper never returns an altered selection object.
  if (selection) SkillSelectionSchema.parse(selection);
  return { diagnostic, selection };
}

function schemaViolations(
  input: SupervisorInput,
  wire: unknown,
  numeric: z.infer<typeof counts>,
): { parsed: WireJudgment | null; violations: Violation[] } {
  const parsed = WireJudgmentSchema.safeParse(wire);
  if (parsed.success) return { parsed: parsed.data, violations: [] };
  const violations: Violation[] = [{ stage: "WIRE_SCHEMA_VALID", code: "WIRE_SCHEMA_FAILED" }];
  const raw = wire !== null && typeof wire === "object" ? (wire as Record<string, unknown>) : null;
  const decisions = Array.isArray(raw?.candidateDecisions) ? raw.candidateDecisions : null;
  numeric.returnedCandidateCount = decisions?.length ?? null;
  if (decisions && decisions.length !== input.candidates.length) {
    violations.push({ stage: "WIRE_SCHEMA_VALID", code: "CANDIDATE_COUNT_MISMATCH" });
    violations.push({
      stage: "WIRE_SCHEMA_VALID",
      code:
        decisions.length > input.candidates.length
          ? "EXTRA_CANDIDATE_DECISION"
          : "MISSING_CANDIDATE_DECISION",
    });
  }
  for (const issue of parsed.error.issues) {
    const path = issue.path.map(String);
    if (path.includes("decision"))
      violations.push({ stage: "WIRE_SCHEMA_VALID", code: "INVALID_DECISION_VALUE" });
    else if (path.includes("reasonCodes")) {
      violations.push({ stage: "WIRE_SCHEMA_VALID", code: "INVALID_REASON_CODE" });
      numeric.invalidReasonCodeCount++;
    } else if (path.includes("ref")) {
      violations.push({ stage: "WIRE_SCHEMA_VALID", code: "INVALID_EVIDENCE_REF_FORMAT" });
      numeric.invalidEvidenceRefCount++;
    } else if (path.includes("use")) {
      violations.push({ stage: "WIRE_SCHEMA_VALID", code: "INVALID_EVIDENCE_USE" });
      numeric.ownershipViolationCount++;
    }
  }
  return { parsed: null, violations };
}

function applicationViolations(
  input: SupervisorInput,
  wire: WireJudgment,
  numeric: z.infer<typeof counts>,
): Violation[] {
  const violations: Violation[] = [];
  const add = (stage: Srs4D2Stage, code: Srs4D2FailureCode) => violations.push({ stage, code });
  const decisions = wire.candidateDecisions;
  const expectedIds = new Set(input.candidates.map((item) => item.skillId));
  const returnedIds = decisions.map((item) => item.skillId);
  const returnedSet = new Set(returnedIds);
  numeric.returnedCandidateCount = decisions.length;
  numeric.missingCandidateCount = [...expectedIds].filter((id) => !returnedSet.has(id)).length;
  numeric.extraCandidateCount = decisions.filter((item) => !expectedIds.has(item.skillId)).length;
  numeric.duplicateCandidateCount = returnedIds.length - returnedSet.size;
  if (decisions.length !== expectedIds.size) {
    add("CANDIDATE_DECISION_COUNT_VALID", "CANDIDATE_COUNT_MISMATCH");
    if (decisions.length < expectedIds.size)
      add("CANDIDATE_DECISION_COUNT_VALID", "MISSING_CANDIDATE_DECISION");
    else add("CANDIDATE_DECISION_COUNT_VALID", "EXTRA_CANDIDATE_DECISION");
  }
  if (numeric.duplicateCandidateCount) add("NO_DUPLICATE_CANDIDATES", "DUPLICATE_CANDIDATE_ID");
  if (numeric.missingCandidateCount) add("CANDIDATE_ID_SET_VALID", "MISSING_CANDIDATE_DECISION");
  if (numeric.extraCandidateCount) add("CANDIDATE_ID_SET_VALID", "UNKNOWN_CANDIDATE_ID");

  const selected = decisions.filter((item) => item.decision === "SELECT");
  numeric.selectedCountBeforeValidation = selected.length;
  if (selected.length > 4) add("SELECTION_BUDGET_VALID", "OVER_SELECTION_BUDGET");
  const evidence = new Map(input.evidence.map((item) => [item.ref, item]));
  const selectedIds = new Set(selected.map((item) => item.skillId));
  for (const decision of decisions) {
    const isSelect = decision.decision === "SELECT";
    const polarityMismatch = decision.reasonCodes.filter(
      (code) => positiveReasons.has(code) !== isSelect,
    );
    numeric.reasonPolarityMismatchCount += polarityMismatch.length;
    if (polarityMismatch.length) {
      add("REASON_POLARITY_VALID", "REASON_POLARITY_MISMATCH");
      if (isSelect && !decision.reasonCodes.some((code) => positiveReasons.has(code)))
        add("REASON_POLARITY_VALID", "SELECT_WITHOUT_POSITIVE_REASON");
      if (!isSelect && !decision.reasonCodes.some((code) => !positiveReasons.has(code)))
        add("REASON_POLARITY_VALID", "REJECT_WITHOUT_REJECTION_REASON");
    }
    if (new Set(decision.reasonCodes).size !== decision.reasonCodes.length)
      add("REASON_POLARITY_VALID", "DUPLICATE_REASON_CODE");
    const refUses = decision.evidence.map((item) => `${item.ref}/${item.use}`);
    if (new Set(refUses).size !== refUses.length)
      add("EVIDENCE_REF_UNIQUE", "EVIDENCE_REF_USE_DUPLICATE");
    for (const item of decision.evidence) {
      const fragment = evidence.get(item.ref);
      if (!fragment) {
        numeric.invalidEvidenceRefCount++;
        add("EVIDENCE_REF_EXISTS", "UNKNOWN_EVIDENCE_REF");
        continue;
      }
      if (item.use === "CONTEXT") continue;
      if (item.use === "OBJECTIVE") {
        if (fragment.source !== "USER_DRAFT" && fragment.source !== "SELECTED_GOAL") {
          numeric.ownershipViolationCount++;
          add("OWNERSHIP_VALID", "INVALID_OBJECTIVE_SOURCE");
        }
      } else if (fragment.source !== "USER_DRAFT" && fragment.source !== "USER_HISTORY") {
        numeric.ownershipViolationCount++;
        add(
          "OWNERSHIP_VALID",
          fragment.source === "OTHER_MESSAGE"
            ? "OTHER_USED_AS_USER_FACT"
            : fragment.source === "UNKNOWN_MESSAGE"
              ? "UNKNOWN_USED_AS_USER_FACT"
              : "SELECTED_GOAL_USED_AS_FACT",
        );
      }
    }
    const hasUserFact = decision.evidence.some(
      (item) =>
        (item.ref.startsWith("USER_DRAFT:") || item.ref.startsWith("USER_HISTORY:")) &&
        factualUses.has(item.use),
    );
    if (!hasUserFact) {
      if (decision.reasonCodes.includes("EXPLICITLY_NEGATED"))
        add("NEGATION_PREREQUISITE_EVIDENCE_VALID", "NEGATION_EVIDENCE_INVALID");
      if (decision.reasonCodes.includes("PREREQUISITE_UNSUPPORTED"))
        add("NEGATION_PREREQUISITE_EVIDENCE_VALID", "PREREQUISITE_EVIDENCE_INVALID");
    }
    if (isSelect) {
      if (decision.evidence.length === 0) add("FACT_GROUNDING_VALID", "SELECT_WITHOUT_EVIDENCE");
      else if (!decision.evidence.some((item) => item.use !== "CONTEXT"))
        add("FACT_GROUNDING_VALID", "SELECT_WITH_CONTEXT_ONLY");
      if (SRS4_USER_FACT_GATED_CAPABILITIES.has(decision.skillId) && !hasUserFact) {
        numeric.factGroundingViolationCount++;
        add("FACT_GROUNDING_VALID", "FACT_GROUNDING_MISSING");
      }
    }
  }
  for (const decision of decisions) {
    const candidate = input.candidates.find((item) => item.skillId === decision.skillId);
    if (!candidate) continue;
    if (
      decision.reasonCodes.includes("CONFLICTS_WITH_SELECTED") &&
      !input.candidates.some(
        (other) =>
          selectedIds.has(other.skillId) &&
          (candidate.conflictingSkills.includes(other.skillId) ||
            other.conflictingSkills.includes(candidate.skillId)),
      )
    )
      add("RELATION_CONSTRAINTS_VALID", "UNSUPPORTED_CONFLICT_REASON");
    if (
      selectedIds.size < 2 &&
      decision.reasonCodes.some(
        (code) => code === "COMPLEMENTS_SELECTED" || code === "DISTINCT_SUPPORTED_JOB",
      )
    )
      add("RELATION_CONSTRAINTS_VALID", "MULTI_SKILL_REASON_WITHOUT_PAIR");
  }
  for (const candidate of input.candidates) {
    if (!selectedIds.has(candidate.skillId)) continue;
    if (
      candidate.conflictingSkills.some((id) => selectedIds.has(id)) ||
      input.candidates.some(
        (other) =>
          selectedIds.has(other.skillId) && other.conflictingSkills.includes(candidate.skillId),
      )
    )
      add("RELATION_CONSTRAINTS_VALID", "SELECTED_CONFLICT");
  }
  return violations;
}

export function diagnoseSupervisorOutput(
  inputValue: SupervisorInput,
  rawOutput: unknown,
  scenarioId: string | null = null,
): DiagnosticResult {
  const input = SupervisorInputSchema.parse(inputValue);
  const numeric = emptyCounts(input);
  const states = {
    providerResponsePresent: true,
    outputPresent: rawOutput !== null && rawOutput !== undefined,
    jsonParseValid: null as boolean | null,
    wireSchemaValid: null as boolean | null,
    applicationValid: null as boolean | null,
  };
  if (!states.outputPresent)
    return finish(
      scenarioId,
      [{ stage: "OUTPUT_TEXT_OR_OBJECT_PRESENT", code: "MISSING_PROVIDER_OUTPUT" }],
      numeric,
      states,
      validateSupervisorJudgment(input, undefined),
    );
  let output: unknown = rawOutput;
  if (typeof rawOutput === "string") {
    try {
      output = JSON.parse(rawOutput) as unknown;
      states.jsonParseValid = true;
    } catch {
      states.jsonParseValid = false;
      return finish(
        scenarioId,
        [{ stage: "JSON_PARSE_VALID", code: "JSON_PARSE_FAILED" }],
        numeric,
        states,
        validateSupervisorJudgment(input, undefined),
      );
    }
  } else states.jsonParseValid = true;
  const schema = schemaViolations(input, output, numeric);
  states.wireSchemaValid = schema.parsed !== null;
  const selection = validateSupervisorJudgment(input, output);
  if (!schema.parsed) {
    states.applicationValid = null;
    return finish(scenarioId, schema.violations, numeric, states, selection);
  }
  const violations = applicationViolations(input, schema.parsed, numeric);
  states.applicationValid = violations.length === 0;
  if (violations.length === 0 && selection.status === "FAILED")
    violations.push({ stage: "FINAL_SELECTION_DERIVATION_VALID", code: "DIAGNOSTIC_PARITY_DRIFT" });
  if (violations.length > 0 && selection.status !== "FAILED")
    violations.push({ stage: "FINAL_SELECTION_DERIVATION_VALID", code: "DIAGNOSTIC_PARITY_DRIFT" });
  if (violations.some((item) => item.code === "DIAGNOSTIC_PARITY_DRIFT"))
    throw Error("D2 diagnostic/original validator parity drift");
  return finish(scenarioId, violations, numeric, states, selection);
}

export function diagnoseSupervisorProviderResponse(
  input: SupervisorInput,
  providerResponse: unknown,
  scenarioId: string | null = null,
): DiagnosticResult {
  if (providerResponse === null || providerResponse === undefined) {
    const numeric = emptyCounts(SupervisorInputSchema.parse(input));
    return finish(
      scenarioId,
      [{ stage: "PROVIDER_RESPONSE_PRESENT", code: "MISSING_PROVIDER_OUTPUT" }],
      numeric,
      {
        providerResponsePresent: false,
        outputPresent: false,
        jsonParseValid: null,
        wireSchemaValid: null,
        applicationValid: null,
      },
      {
        status: "FAILED",
        selectedCapabilities: [],
        candidateDecisions: [],
        failureCode: "PROVIDER_FAILURE",
      },
    );
  }
  const response =
    typeof providerResponse === "object" && providerResponse !== null
      ? (providerResponse as Record<string, unknown>)
      : null;
  if (response?.status !== "completed") return diagnoseSupervisorOutput(input, null, scenarioId);
  const messages = Array.isArray(response?.output) ? response.output : [];
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
  return diagnoseSupervisorOutput(input, part?.text ?? null, scenarioId);
}

export function aggregateD2Stages(diagnostics: readonly Srs4D2Diagnostic[]): {
  total: number;
  valid: number;
  firstFailureCounts: Record<Srs4D2Stage, number>;
  passedThroughCounts: Record<Srs4D2Stage, number>;
} {
  const firstFailureCounts = Object.fromEntries(
    SRS4_D2_STAGE_ORDER.map((stage) => [stage, 0]),
  ) as Record<Srs4D2Stage, number>;
  const passedThroughCounts = Object.fromEntries(
    SRS4_D2_STAGE_ORDER.map((stage) => [stage, 0]),
  ) as Record<Srs4D2Stage, number>;
  for (const raw of diagnostics) {
    const diagnostic = Srs4D2DiagnosticSchema.parse(raw);
    const index = diagnostic.firstFailedStage
      ? SRS4_D2_STAGE_ORDER.indexOf(diagnostic.firstFailedStage)
      : SRS4_D2_STAGE_ORDER.length - 1;
    if (diagnostic.firstFailedStage) firstFailureCounts[diagnostic.firstFailedStage]++;
    for (let i = 0; i < index; i++) passedThroughCounts[SRS4_D2_STAGE_ORDER[i]!]++;
    if (!diagnostic.firstFailedStage) passedThroughCounts.VALID++;
  }
  return {
    total: diagnostics.length,
    valid: diagnostics.filter((item) => item.validatorStatus === "VALID").length,
    firstFailureCounts,
    passedThroughCounts,
  };
}
