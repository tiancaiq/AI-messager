// SRS-4-D4: evaluation-only V2 rejection-evidence contract. V1 remains frozen.
import { z } from "zod";
import {
  EvidenceFragmentSchema,
  EvidenceUseSchema,
  SRS4_USER_FACT_GATED_CAPABILITIES,
  SupervisorInputSchema,
  type SkillSupervisorJudge,
  type SupervisorInput,
  type SupervisorOutcome,
} from "./srs4-supervisor.js";

export const SRS4_V2_CONTRACT_ID = "SRS-4-SUPERVISOR-CONTRACT-V2";
export const SupervisorReasonV2Schema = z.enum([
  "DIRECTLY_SUPPORTED",
  "DISTINCT_SUPPORTED_JOB",
  "COMPLEMENTS_SELECTED",
  "PREREQUISITE_NOT_ESTABLISHED",
  "PREREQUISITE_CONTRADICTED",
  "EXPLICITLY_NEGATED",
  "OWNERSHIP_MISMATCH",
  "WRONG_TEMPORAL_ROLE",
  "REDUNDANT_WITH_SELECTED",
  "CONFLICTS_WITH_SELECTED",
  "NO_MATERIAL_JOB",
  "INSUFFICIENT_EVIDENCE",
]);
export type SupervisorReasonV2 = z.infer<typeof SupervisorReasonV2Schema>;

export const WireJudgmentV2Schema = z
  .object({
    candidateDecisions: z
      .array(
        z
          .object({
            skillId: z.string(),
            decision: z.enum(["SELECT", "REJECT"]),
            reasonCodes: z.array(SupervisorReasonV2Schema).min(1).max(3),
            evidence: z
              .array(
                z
                  .object({ ref: EvidenceFragmentSchema.shape.ref, use: EvidenceUseSchema })
                  .strict(),
              )
              .max(3),
          })
          .strict(),
      )
      .max(10),
  })
  .strict();
export type WireJudgmentV2 = z.infer<typeof WireJudgmentV2Schema>;

export const SkillSelectionV2Schema = z
  .object({
    status: z.enum(["SELECTED", "NONE", "FAILED"]),
    selectedCapabilities: z
      .array(
        z
          .object({
            skillId: z.string(),
            profileRevision: z.number().int().positive(),
            selectionReasonCodes: z.array(SupervisorReasonV2Schema),
          })
          .strict(),
      )
      .max(4),
    candidateDecisions: WireJudgmentV2Schema.shape.candidateDecisions,
    failureCode: z
      .enum(["MODEL_OUTPUT_INVALID", "PROVIDER_FAILURE", "INPUT_TOO_LARGE", "BINDING_DRIFT"])
      .optional(),
  })
  .strict()
  .superRefine((value, context) => {
    const selectedIds = value.selectedCapabilities.map((item) => item.skillId);
    const decisionIds = value.candidateDecisions
      .filter((item) => item.decision === "SELECT")
      .map((item) => item.skillId);
    if (
      new Set(selectedIds).size !== selectedIds.length ||
      (value.status === "SELECTED") !== selectedIds.length > 0 ||
      (value.status === "FAILED") !== Boolean(value.failureCode) ||
      (value.status === "FAILED" && value.candidateDecisions.length > 0) ||
      (value.status !== "FAILED" &&
        JSON.stringify([...selectedIds].sort()) !== JSON.stringify(decisionIds.sort()))
    )
      context.addIssue({ code: "custom", message: "Invalid SRS-4-V2 selection status invariant" });
  });
export type SkillSelectionV2 = z.infer<typeof SkillSelectionV2Schema>;
export type SupervisorOutcomeV2 =
  | Extract<SupervisorOutcome, { selection: null }>
  | { stage: "SUPERVISOR"; selection: SkillSelectionV2 };

export const Srs4V2StageSchema = z.enum([
  "PROVIDER_RESPONSE_PRESENT",
  "OUTPUT_TEXT_OR_OBJECT_PRESENT",
  "JSON_PARSE_VALID",
  "WIRE_SCHEMA_VALID",
  "CANDIDATE_COVERAGE_VALID",
  "SELECTION_BUDGET_VALID",
  "REASON_POLARITY_VALID",
  "EVIDENCE_REF_VALID",
  "EVIDENCE_USE_VALID",
  "REJECTION_EVIDENCE_VALID",
  "SELECT_GROUNDING_VALID",
  "RELATION_CONSTRAINTS_VALID",
  "FINAL_SELECTION_DERIVATION_VALID",
  "VALID",
]);
export type Srs4V2Stage = z.infer<typeof Srs4V2StageSchema>;
export const Srs4V2FailureCodeSchema = z.enum([
  "MISSING_PROVIDER_OUTPUT",
  "JSON_PARSE_FAILED",
  "WIRE_SCHEMA_FAILED",
  "INVALID_REASON_CODE",
  "INVALID_EVIDENCE_REF_FORMAT",
  "INVALID_EVIDENCE_USE",
  "CANDIDATE_COUNT_MISMATCH",
  "DUPLICATE_CANDIDATE_ID",
  "UNKNOWN_CANDIDATE_ID",
  "OVER_SELECTION_BUDGET",
  "REASON_POLARITY_MISMATCH",
  "DUPLICATE_REASON_CODE",
  "INCOMPATIBLE_PREREQUISITE_REASONS",
  "EVIDENCE_REF_USE_DUPLICATE",
  "UNKNOWN_EVIDENCE_REF",
  "OBJECTIVE_SOURCE_INVALID",
  "FACTUAL_SOURCE_INVALID",
  "CONTRADICTION_EVIDENCE_MISSING",
  "EXPLICIT_NEGATION_EVIDENCE_INVALID",
  "OWNERSHIP_MISMATCH_EVIDENCE_MISSING",
  "SELECT_EVIDENCE_MISSING",
  "SELECT_CONTEXT_ONLY",
  "SELECT_FACT_GROUNDING_MISSING",
  "UNSUPPORTED_CONFLICT_REASON",
  "MULTI_SKILL_REASON_WITHOUT_PAIR",
  "SELECTED_CONFLICT",
]);
export type Srs4V2FailureCode = z.infer<typeof Srs4V2FailureCodeSchema>;
export type Srs4V2Violation = { stage: Srs4V2Stage; code: Srs4V2FailureCode };

export const Srs4V2ValidationCountsSchema = z
  .object({
    expectedCandidateCount: z.number().int().nonnegative(),
    returnedCandidateCount: z.number().int().nonnegative().nullable(),
    missingCandidateCount: z.number().int().nonnegative(),
    extraCandidateCount: z.number().int().nonnegative(),
    duplicateCandidateCount: z.number().int().nonnegative(),
    selectedCountBeforeValidation: z.number().int().nonnegative().nullable(),
    prerequisiteNotEstablishedRejections: z.number().int().nonnegative(),
    prerequisiteContradictedRejections: z.number().int().nonnegative(),
    validObjectiveNegations: z.number().int().nonnegative(),
    invalidContradictionEvidenceCount: z.number().int().nonnegative(),
    invalidNegationEvidenceCount: z.number().int().nonnegative(),
    factualSourceViolationCount: z.number().int().nonnegative(),
    selectGroundingViolationCount: z.number().int().nonnegative(),
  })
  .strict();
export type Srs4V2ValidationCounts = z.infer<typeof Srs4V2ValidationCountsSchema>;
export interface Srs4V2ValidationDetail {
  selection: SkillSelectionV2;
  violations: Srs4V2Violation[];
  counts: Srs4V2ValidationCounts;
  wireSchemaValid: boolean;
}

const positiveReasons = new Set<SupervisorReasonV2>([
  "DIRECTLY_SUPPORTED",
  "DISTINCT_SUPPORTED_JOB",
  "COMPLEMENTS_SELECTED",
]);
const userSources = new Set(["USER_DRAFT", "USER_HISTORY"]);
const objectiveSources = new Set(["USER_DRAFT", "USER_HISTORY", "SELECTED_GOAL"]);
const factualUses = new Set([
  "USER_FACT",
  "USER_RESPONSIBILITY",
  "USER_COMMITMENT",
  "USER_LIMIT",
  "USER_PROMISE",
]);

function failed(): SkillSelectionV2 {
  return {
    status: "FAILED",
    selectedCapabilities: [],
    candidateDecisions: [],
    failureCode: "MODEL_OUTPUT_INVALID",
  };
}

export function validateSupervisorJudgmentV2Detailed(
  inputValue: SupervisorInput,
  wire: unknown,
): Srs4V2ValidationDetail {
  const input = SupervisorInputSchema.parse(inputValue);
  const counts: Srs4V2ValidationCounts = {
    expectedCandidateCount: input.candidates.length,
    returnedCandidateCount: null,
    missingCandidateCount: 0,
    extraCandidateCount: 0,
    duplicateCandidateCount: 0,
    selectedCountBeforeValidation: null,
    prerequisiteNotEstablishedRejections: 0,
    prerequisiteContradictedRejections: 0,
    validObjectiveNegations: 0,
    invalidContradictionEvidenceCount: 0,
    invalidNegationEvidenceCount: 0,
    factualSourceViolationCount: 0,
    selectGroundingViolationCount: 0,
  };
  const violations: Srs4V2Violation[] = [];
  const add = (stage: Srs4V2Stage, code: Srs4V2FailureCode): void => {
    violations.push({ stage, code });
  };
  const parsed = WireJudgmentV2Schema.safeParse(wire);
  if (!parsed.success) {
    add("WIRE_SCHEMA_VALID", "WIRE_SCHEMA_FAILED");
    const raw = wire && typeof wire === "object" ? (wire as Record<string, unknown>) : null;
    if (Array.isArray(raw?.candidateDecisions))
      counts.returnedCandidateCount = raw.candidateDecisions.length;
    for (const issue of parsed.error.issues) {
      const path = issue.path.map(String);
      if (path.includes("reasonCodes")) add("WIRE_SCHEMA_VALID", "INVALID_REASON_CODE");
      else if (path.includes("ref")) add("WIRE_SCHEMA_VALID", "INVALID_EVIDENCE_REF_FORMAT");
      else if (path.includes("use")) add("WIRE_SCHEMA_VALID", "INVALID_EVIDENCE_USE");
    }
    return { selection: failed(), violations, counts, wireSchemaValid: false };
  }
  const decisions = parsed.data.candidateDecisions;
  const candidateIds = new Set(input.candidates.map((candidate) => candidate.skillId));
  const returnedIds = decisions.map((decision) => decision.skillId);
  const returnedSet = new Set(returnedIds);
  counts.returnedCandidateCount = decisions.length;
  counts.missingCandidateCount = [...candidateIds].filter((id) => !returnedSet.has(id)).length;
  counts.extraCandidateCount = decisions.filter(
    (decision) => !candidateIds.has(decision.skillId),
  ).length;
  counts.duplicateCandidateCount = decisions.length - returnedSet.size;
  if (
    decisions.length !== candidateIds.size ||
    counts.missingCandidateCount ||
    counts.extraCandidateCount
  )
    add("CANDIDATE_COVERAGE_VALID", "CANDIDATE_COUNT_MISMATCH");
  if (counts.duplicateCandidateCount) add("CANDIDATE_COVERAGE_VALID", "DUPLICATE_CANDIDATE_ID");
  if (counts.extraCandidateCount) add("CANDIDATE_COVERAGE_VALID", "UNKNOWN_CANDIDATE_ID");
  const selected = decisions.filter((decision) => decision.decision === "SELECT");
  const selectedIds = new Set(selected.map((decision) => decision.skillId));
  counts.selectedCountBeforeValidation = selected.length;
  if (selected.length > 4) add("SELECTION_BUDGET_VALID", "OVER_SELECTION_BUDGET");
  const evidence = new Map(input.evidence.map((fragment) => [fragment.ref, fragment]));
  for (const decision of decisions) {
    const isSelect = decision.decision === "SELECT";
    if (new Set(decision.reasonCodes).size !== decision.reasonCodes.length)
      add("REASON_POLARITY_VALID", "DUPLICATE_REASON_CODE");
    if (
      decision.reasonCodes.includes("PREREQUISITE_NOT_ESTABLISHED") &&
      decision.reasonCodes.includes("PREREQUISITE_CONTRADICTED")
    )
      add("REASON_POLARITY_VALID", "INCOMPATIBLE_PREREQUISITE_REASONS");
    if (decision.reasonCodes.some((code) => positiveReasons.has(code) !== isSelect))
      add("REASON_POLARITY_VALID", "REASON_POLARITY_MISMATCH");
    if (
      new Set(decision.evidence.map((item) => `${item.ref}/${item.use}`)).size !==
      decision.evidence.length
    )
      add("EVIDENCE_REF_VALID", "EVIDENCE_REF_USE_DUPLICATE");
    for (const item of decision.evidence) {
      const fragment = evidence.get(item.ref);
      if (!fragment) {
        add("EVIDENCE_REF_VALID", "UNKNOWN_EVIDENCE_REF");
        continue;
      }
      if (item.use === "OBJECTIVE" && !objectiveSources.has(fragment.source))
        add("EVIDENCE_USE_VALID", "OBJECTIVE_SOURCE_INVALID");
      if (factualUses.has(item.use) && !userSources.has(fragment.source)) {
        counts.factualSourceViolationCount++;
        add("EVIDENCE_USE_VALID", "FACTUAL_SOURCE_INVALID");
      }
    }
    const hasUserFact = decision.evidence.some((item) => {
      const fragment = evidence.get(item.ref);
      return fragment && userSources.has(fragment.source) && factualUses.has(item.use);
    });
    const hasObjective = decision.evidence.some((item) => {
      const fragment = evidence.get(item.ref);
      return fragment && objectiveSources.has(fragment.source) && item.use === "OBJECTIVE";
    });
    const hasContradiction = decision.evidence.some((item) => {
      const fragment = evidence.get(item.ref);
      return (
        fragment &&
        ((userSources.has(fragment.source) && factualUses.has(item.use)) ||
          (fragment.source === "OTHER_MESSAGE" && item.use === "CONTEXT"))
      );
    });
    if (!isSelect) {
      if (decision.reasonCodes.includes("PREREQUISITE_NOT_ESTABLISHED"))
        counts.prerequisiteNotEstablishedRejections++;
      if (decision.reasonCodes.includes("PREREQUISITE_CONTRADICTED")) {
        counts.prerequisiteContradictedRejections++;
        if (!hasContradiction) {
          counts.invalidContradictionEvidenceCount++;
          add("REJECTION_EVIDENCE_VALID", "CONTRADICTION_EVIDENCE_MISSING");
        }
      }
      if (decision.reasonCodes.includes("EXPLICITLY_NEGATED")) {
        if (hasObjective) counts.validObjectiveNegations++;
        else {
          counts.invalidNegationEvidenceCount++;
          add("REJECTION_EVIDENCE_VALID", "EXPLICIT_NEGATION_EVIDENCE_INVALID");
        }
      }
      if (
        decision.reasonCodes.includes("OWNERSHIP_MISMATCH") &&
        !decision.evidence.some((item) => {
          const fragment = evidence.get(item.ref);
          return (
            fragment &&
            (fragment.source === "OTHER_MESSAGE" || fragment.source === "UNKNOWN_MESSAGE") &&
            item.use === "CONTEXT"
          );
        })
      )
        add("REJECTION_EVIDENCE_VALID", "OWNERSHIP_MISMATCH_EVIDENCE_MISSING");
    } else {
      if (decision.evidence.length === 0) {
        counts.selectGroundingViolationCount++;
        add("SELECT_GROUNDING_VALID", "SELECT_EVIDENCE_MISSING");
      } else if (!decision.evidence.some((item) => item.use !== "CONTEXT")) {
        counts.selectGroundingViolationCount++;
        add("SELECT_GROUNDING_VALID", "SELECT_CONTEXT_ONLY");
      }
      if (SRS4_USER_FACT_GATED_CAPABILITIES.has(decision.skillId) && !hasUserFact) {
        counts.selectGroundingViolationCount++;
        add("SELECT_GROUNDING_VALID", "SELECT_FACT_GROUNDING_MISSING");
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
  if (violations.length) return { selection: failed(), violations, counts, wireSchemaValid: true };
  const selection = SkillSelectionV2Schema.parse({
    status: selected.length ? "SELECTED" : "NONE",
    selectedCapabilities: selected
      .map((decision) => ({
        skillId: decision.skillId,
        profileRevision: input.candidates.find((item) => item.skillId === decision.skillId)!
          .profileRevision,
        selectionReasonCodes: decision.reasonCodes,
      }))
      .sort((a, b) => a.skillId.localeCompare(b.skillId)),
    candidateDecisions: decisions,
  });
  return { selection, violations, counts, wireSchemaValid: true };
}

export function validateSupervisorJudgmentV2(
  input: SupervisorInput,
  wire: unknown,
): SkillSelectionV2 {
  return validateSupervisorJudgmentV2Detailed(input, wire).selection;
}

export async function observeSupervisorV2(
  input: SupervisorInput | Extract<SupervisorOutcome, { selection: null }>,
  judge: SkillSupervisorJudge,
): Promise<SupervisorOutcomeV2> {
  if ("stage" in input) return input;
  try {
    return {
      stage: "SUPERVISOR",
      selection: validateSupervisorJudgmentV2(input, await judge.judge(input)),
    };
  } catch {
    return {
      stage: "SUPERVISOR",
      selection: {
        status: "FAILED",
        selectedCapabilities: [],
        candidateDecisions: [],
        failureCode: "PROVIDER_FAILURE",
      },
    };
  }
}
