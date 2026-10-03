// SRS-4R-A: private, provider-neutral, candidate-local shadow assessment contract.
// No final skill-set selection or production import is permitted here.
import { z } from "zod";
import {
  EvidenceFragmentSchema,
  EvidenceUseSchema,
  SRS4_USER_FACT_GATED_CAPABILITIES,
  SupervisorInputSchema,
  type CandidateProjection,
  type SupervisorInput,
  type SupervisorOutcome,
} from "./srs4-supervisor.js";

export const SRS4R_A_CONTRACT_ID = "SRS-4R-A-SKILL-ASSESSMENT-V1";
export const SkillApplicabilitySchema = z.enum(["CORE", "SUPPORTING", "UNSUPPORTED", "UNCERTAIN"]);
export type SkillApplicability = z.infer<typeof SkillApplicabilitySchema>;
export const SkillSupportReasonSchema = z.enum(["DIRECT_JOB_SUPPORTED", "SECONDARY_JOB_SUPPORTED"]);
export const SkillBlockingReasonSchema = z.enum([
  "PREREQUISITE_NOT_ESTABLISHED",
  "PREREQUISITE_CONTRADICTED",
  "EXPLICITLY_NEGATED",
  "OWNERSHIP_MISMATCH",
  "WRONG_TEMPORAL_ROLE",
  "NO_MATERIAL_JOB",
  "INSUFFICIENT_EVIDENCE",
]);
export const SupportedProfileRefSchema = z.enum([
  "JOB",
  "USE_WHEN:0",
  "USE_WHEN:1",
  "USE_WHEN:2",
  "USE_WHEN:3",
  "USE_WHEN:4",
  "USE_WHEN:5",
  "USE_WHEN:6",
  "USE_WHEN:7",
]);
export const SkillAssessmentSchema = z
  .object({
    skillId: z.string().min(1),
    definitionVersion: z.number().int().positive(),
    profileRevision: z.number().int().positive(),
    applicability: SkillApplicabilitySchema,
    evidence: z
      .array(z.object({ ref: EvidenceFragmentSchema.shape.ref, use: EvidenceUseSchema }).strict())
      .max(3),
    supportedProfileRefs: z.array(SupportedProfileRefSchema).max(3),
    supportReasonCodes: z.array(SkillSupportReasonSchema).max(1),
    blockingReasonCodes: z.array(SkillBlockingReasonSchema).max(3),
  })
  .strict();
export type SkillAssessment = z.infer<typeof SkillAssessmentSchema>;
export const SkillAssessmentBatchWireSchema = z
  .object({ assessments: z.array(SkillAssessmentSchema).max(10) })
  .strict();
export const SkillAssessmentSingletonWireSchema = z
  .object({ assessment: SkillAssessmentSchema })
  .strict();

export const AssessmentFailureCodeSchema = z.enum([
  "WIRE_SCHEMA_INVALID",
  "CANDIDATE_SET_MISMATCH",
  "DUPLICATE_CANDIDATE",
  "UNKNOWN_CANDIDATE",
  "REVISION_MISMATCH",
  "PROFILE_REF_INVALID",
  "APPLICABILITY_REASON_MISMATCH",
  "EVIDENCE_REF_DUPLICATE",
  "EVIDENCE_REF_UNKNOWN",
  "OBJECTIVE_SOURCE_INVALID",
  "FACTUAL_SOURCE_INVALID",
  "SUPPORTED_EVIDENCE_MISSING",
  "SUPPORTED_CONTEXT_ONLY",
  "FACT_GROUNDING_MISSING",
  "CONTRADICTION_EVIDENCE_MISSING",
  "EXPLICIT_NEGATION_EVIDENCE_INVALID",
  "OWNERSHIP_MISMATCH_EVIDENCE_MISSING",
  "TEMPORAL_EVIDENCE_MISSING",
  "INCOMPATIBLE_PREREQUISITE_REASONS",
  "BINDING_DRIFT",
  "PROVIDER_FAILURE",
]);
export type AssessmentFailureCode = z.infer<typeof AssessmentFailureCodeSchema>;
export const AssessmentValidationCountsSchema = z
  .object({
    expectedCandidateCount: z.number().int().nonnegative(),
    returnedCandidateCount: z.number().int().nonnegative().nullable(),
    missingCandidateCount: z.number().int().nonnegative(),
    extraCandidateCount: z.number().int().nonnegative(),
    duplicateCandidateCount: z.number().int().nonnegative(),
    coreCount: z.number().int().nonnegative(),
    supportingCount: z.number().int().nonnegative(),
    unsupportedCount: z.number().int().nonnegative(),
    uncertainCount: z.number().int().nonnegative(),
  })
  .strict();
export type AssessmentValidationCounts = z.infer<typeof AssessmentValidationCountsSchema>;
export const AssessmentValidationSchema = z
  .object({
    status: z.enum(["VALID", "FAILED"]),
    assessments: z.array(SkillAssessmentSchema).max(10),
    failureCodes: z.array(AssessmentFailureCodeSchema),
    counts: AssessmentValidationCountsSchema,
  })
  .strict();
export type AssessmentValidation = z.infer<typeof AssessmentValidationSchema>;

const factualUses = new Set<z.infer<typeof EvidenceUseSchema>>([
  "USER_FACT",
  "USER_RESPONSIBILITY",
  "USER_COMMITMENT",
  "USER_LIMIT",
  "USER_PROMISE",
]);
const userSources = new Set(["USER_DRAFT", "USER_HISTORY"]);
const objectiveSources = new Set(["USER_DRAFT", "USER_HISTORY", "SELECTED_GOAL"]);
const supported = new Set<SkillApplicability>(["CORE", "SUPPORTING"]);

function initialCounts(input: SupervisorInput): AssessmentValidationCounts {
  return {
    expectedCandidateCount: input.candidates.length,
    returnedCandidateCount: null,
    missingCandidateCount: 0,
    extraCandidateCount: 0,
    duplicateCandidateCount: 0,
    coreCount: 0,
    supportingCount: 0,
    unsupportedCount: 0,
    uncertainCount: 0,
  };
}

function validateOne(
  input: SupervisorInput,
  candidate: CandidateProjection,
  row: SkillAssessment,
): AssessmentFailureCode[] {
  const codes = new Set<AssessmentFailureCode>();
  if (
    row.definitionVersion !== candidate.definitionVersion ||
    row.profileRevision !== candidate.profileRevision
  )
    codes.add("REVISION_MISMATCH");
  if (
    new Set(row.supportedProfileRefs).size !== row.supportedProfileRefs.length ||
    row.supportedProfileRefs.some((ref) =>
      ref === "JOB" ? false : Number(ref.slice("USE_WHEN:".length)) >= candidate.useWhen.length,
    )
  )
    codes.add("PROFILE_REF_INVALID");
  const evidence = new Map(input.evidence.map((fragment) => [fragment.ref, fragment]));
  if (new Set(row.evidence.map((item) => `${item.ref}/${item.use}`)).size !== row.evidence.length)
    codes.add("EVIDENCE_REF_DUPLICATE");
  for (const item of row.evidence) {
    const fragment = evidence.get(item.ref);
    if (!fragment) {
      codes.add("EVIDENCE_REF_UNKNOWN");
      continue;
    }
    if (item.use === "OBJECTIVE" && !objectiveSources.has(fragment.source))
      codes.add("OBJECTIVE_SOURCE_INVALID");
    if (factualUses.has(item.use) && !userSources.has(fragment.source))
      codes.add("FACTUAL_SOURCE_INVALID");
  }
  const hasUserFact = row.evidence.some((item) => {
    const fragment = evidence.get(item.ref);
    return fragment && userSources.has(fragment.source) && factualUses.has(item.use);
  });
  const hasObjective = row.evidence.some((item) => {
    const fragment = evidence.get(item.ref);
    return fragment && objectiveSources.has(fragment.source) && item.use === "OBJECTIVE";
  });
  const hasContradiction = row.evidence.some((item) => {
    const fragment = evidence.get(item.ref);
    return (
      fragment &&
      ((userSources.has(fragment.source) && factualUses.has(item.use)) ||
        (fragment.source === "OTHER_MESSAGE" && item.use === "CONTEXT"))
    );
  });
  const isSupported = supported.has(row.applicability);
  if (isSupported) {
    const expected =
      row.applicability === "CORE" ? "DIRECT_JOB_SUPPORTED" : "SECONDARY_JOB_SUPPORTED";
    if (
      row.supportReasonCodes.length !== 1 ||
      row.supportReasonCodes[0] !== expected ||
      row.blockingReasonCodes.length ||
      row.supportedProfileRefs.length === 0
    )
      codes.add("APPLICABILITY_REASON_MISMATCH");
    if (row.evidence.length === 0) codes.add("SUPPORTED_EVIDENCE_MISSING");
    else if (!row.evidence.some((item) => item.use !== "CONTEXT"))
      codes.add("SUPPORTED_CONTEXT_ONLY");
    if (SRS4_USER_FACT_GATED_CAPABILITIES.has(row.skillId) && !hasUserFact)
      codes.add("FACT_GROUNDING_MISSING");
  } else {
    if (
      row.supportReasonCodes.length ||
      row.supportedProfileRefs.length ||
      row.blockingReasonCodes.length === 0 ||
      (row.applicability === "UNCERTAIN" &&
        (row.blockingReasonCodes.length !== 1 ||
          row.blockingReasonCodes[0] !== "INSUFFICIENT_EVIDENCE"))
    )
      codes.add("APPLICABILITY_REASON_MISMATCH");
    if (
      row.blockingReasonCodes.includes("PREREQUISITE_NOT_ESTABLISHED") &&
      row.blockingReasonCodes.includes("PREREQUISITE_CONTRADICTED")
    )
      codes.add("INCOMPATIBLE_PREREQUISITE_REASONS");
    if (row.blockingReasonCodes.includes("PREREQUISITE_CONTRADICTED") && !hasContradiction)
      codes.add("CONTRADICTION_EVIDENCE_MISSING");
    if (row.blockingReasonCodes.includes("EXPLICITLY_NEGATED") && !hasObjective)
      codes.add("EXPLICIT_NEGATION_EVIDENCE_INVALID");
    if (
      row.blockingReasonCodes.includes("OWNERSHIP_MISMATCH") &&
      !row.evidence.some((item) => {
        const fragment = evidence.get(item.ref);
        return (
          fragment &&
          (fragment.source === "OTHER_MESSAGE" || fragment.source === "UNKNOWN_MESSAGE") &&
          item.use === "CONTEXT"
        );
      })
    )
      codes.add("OWNERSHIP_MISMATCH_EVIDENCE_MISSING");
    if (row.blockingReasonCodes.includes("WRONG_TEMPORAL_ROLE") && row.evidence.length === 0)
      codes.add("TEMPORAL_EVIDENCE_MISSING");
  }
  return [...codes];
}

export function validateSkillAssessmentBatch(
  inputValue: SupervisorInput,
  wire: unknown,
): AssessmentValidation {
  const input = SupervisorInputSchema.parse(inputValue);
  const counts = initialCounts(input);
  const parsed = SkillAssessmentBatchWireSchema.safeParse(wire);
  if (!parsed.success) {
    const raw = wire && typeof wire === "object" ? (wire as Record<string, unknown>) : null;
    if (Array.isArray(raw?.assessments)) counts.returnedCandidateCount = raw.assessments.length;
    return AssessmentValidationSchema.parse({
      status: "FAILED",
      assessments: [],
      failureCodes: ["WIRE_SCHEMA_INVALID"],
      counts,
    });
  }
  const rows = parsed.data.assessments;
  const expected = new Map(input.candidates.map((candidate) => [candidate.skillId, candidate]));
  const ids = rows.map((row) => row.skillId);
  const returned = new Set(ids);
  const failures = new Set<AssessmentFailureCode>();
  counts.returnedCandidateCount = rows.length;
  counts.missingCandidateCount = input.candidates.filter(
    (item) => !returned.has(item.skillId),
  ).length;
  counts.extraCandidateCount = rows.filter((row) => !expected.has(row.skillId)).length;
  counts.duplicateCandidateCount = ids.length - returned.size;
  if (counts.missingCandidateCount || rows.length !== input.candidates.length)
    failures.add("CANDIDATE_SET_MISMATCH");
  if (counts.extraCandidateCount) failures.add("UNKNOWN_CANDIDATE");
  if (counts.duplicateCandidateCount) failures.add("DUPLICATE_CANDIDATE");
  for (const row of rows) {
    if (row.applicability === "CORE") counts.coreCount++;
    else if (row.applicability === "SUPPORTING") counts.supportingCount++;
    else if (row.applicability === "UNSUPPORTED") counts.unsupportedCount++;
    else counts.uncertainCount++;
    const candidate = expected.get(row.skillId);
    if (!candidate) continue;
    for (const code of validateOne(input, candidate, row)) failures.add(code);
  }
  return AssessmentValidationSchema.parse({
    status: failures.size ? "FAILED" : "VALID",
    assessments: failures.size ? [] : [...rows].sort((a, b) => a.skillId.localeCompare(b.skillId)),
    failureCodes: [...failures].sort(),
    counts,
  });
}

export function validateSkillAssessmentSingleton(
  inputValue: SupervisorInput,
  skillId: string,
  wire: unknown,
): AssessmentValidation {
  const input = SupervisorInputSchema.parse(inputValue);
  const candidate = input.candidates.find((item) => item.skillId === skillId);
  if (!candidate) throw Error("SRS-4R-A singleton target is not a supplied candidate");
  const parsed = SkillAssessmentSingletonWireSchema.safeParse(wire);
  if (!parsed.success)
    return validateSkillAssessmentBatch({ ...input, candidates: [candidate] }, undefined);
  return validateSkillAssessmentBatch(
    { ...input, candidates: [candidate] },
    { assessments: [parsed.data.assessment] },
  );
}

export type SkillAssessmentOutcome =
  | { stage: "ASSESSOR"; status: "VALID"; assessments: SkillAssessment[]; failureCodes: [] }
  | {
      stage: "ASSESSOR";
      status: "FAILED";
      assessments: [];
      failureCodes: AssessmentFailureCode[];
    }
  | {
      stage: "STRUCTURAL_EMPTY" | "UNSUPPORTED_LANGUAGE" | "EMPTY_QUERY";
      status: "BYPASSED";
      assessments: [];
      failureCodes: [];
    };

export interface SkillAssessorJudge {
  assessBatch(input: SupervisorInput): Promise<unknown>;
  assessSingleton(input: SupervisorInput, candidate: CandidateProjection): Promise<unknown>;
}

export class FakeSkillAssessorJudge implements SkillAssessorJudge {
  constructor(
    private readonly one: (
      input: SupervisorInput,
      candidate: CandidateProjection,
    ) => unknown | Promise<unknown>,
  ) {}
  async assessSingleton(input: SupervisorInput, candidate: CandidateProjection): Promise<unknown> {
    return { assessment: await this.one({ ...input, candidates: [candidate] }, candidate) };
  }
  async assessBatch(input: SupervisorInput): Promise<unknown> {
    return {
      assessments: await Promise.all(
        input.candidates.map((candidate) =>
          this.one({ ...input, candidates: [candidate] }, candidate),
        ),
      ),
    };
  }
}

export async function observeSkillAssessments(
  input: SupervisorInput | SupervisorOutcome,
  judge: SkillAssessorJudge,
  transport: "BATCH" | "SINGLETONS",
): Promise<SkillAssessmentOutcome> {
  if ("stage" in input) {
    if (input.stage === "SUPERVISOR")
      return {
        stage: "ASSESSOR",
        status: "FAILED",
        assessments: [],
        failureCodes: ["BINDING_DRIFT"],
      };
    return { stage: input.stage, status: "BYPASSED", assessments: [], failureCodes: [] };
  }
  try {
    if (transport === "BATCH") {
      const result = validateSkillAssessmentBatch(input, await judge.assessBatch(input));
      return result.status === "VALID"
        ? { stage: "ASSESSOR", status: "VALID", assessments: result.assessments, failureCodes: [] }
        : {
            stage: "ASSESSOR",
            status: "FAILED",
            assessments: [],
            failureCodes: result.failureCodes,
          };
    }
    const rows: SkillAssessment[] = [];
    for (const candidate of input.candidates) {
      const result = validateSkillAssessmentSingleton(
        input,
        candidate.skillId,
        await judge.assessSingleton(input, candidate),
      );
      if (result.status === "FAILED")
        return {
          stage: "ASSESSOR",
          status: "FAILED",
          assessments: [],
          failureCodes: result.failureCodes,
        };
      rows.push(result.assessments[0]!);
    }
    const combined = validateSkillAssessmentBatch(input, { assessments: rows });
    return combined.status === "VALID"
      ? { stage: "ASSESSOR", status: "VALID", assessments: combined.assessments, failureCodes: [] }
      : {
          stage: "ASSESSOR",
          status: "FAILED",
          assessments: [],
          failureCodes: combined.failureCodes,
        };
  } catch {
    return {
      stage: "ASSESSOR",
      status: "FAILED",
      assessments: [],
      failureCodes: ["PROVIDER_FAILURE"],
    };
  }
}
