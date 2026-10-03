// SRS-4R-A: exposed-only, annotation-isolated assessor metrics. No final set selection.
import type { AgentAction } from "@ai-message-coach/contracts";
import { SRS4_USER_FACT_GATED_CAPABILITIES, type SupervisorInput } from "./srs4-supervisor.js";
import type { DevelopmentLabel } from "./srs4-development-evaluator.js";
import type { PreparedDevelopmentCase } from "./srs4-development.js";
import type { SkillAssessmentOutcome, SkillApplicability } from "./srs4r-assessment.js";

const wording = new Set<AgentAction>(["REWRITE_DRAFT", "COMPLETE_DRAFT", "SUGGEST_REPLY"]);
const supports = (value: SkillApplicability | undefined) =>
  value === "CORE" || value === "SUPPORTING";

export interface AssessorDevelopmentObservation {
  key: string;
  action: AgentAction;
  stage: SkillAssessmentOutcome["stage"];
  status: SkillAssessmentOutcome["status"];
  candidateIds: string[];
  hardEligibleIds: string[];
  groundedCandidateIds: string[];
  applicabilityById: Record<string, SkillApplicability>;
  blockingReasonsById: Record<string, string[]>;
}

export function contentFreeAssessorObservation(
  row: PreparedDevelopmentCase,
  outcome: SkillAssessmentOutcome,
): AssessorDevelopmentObservation {
  const input: SupervisorInput | null = "stage" in row.input ? null : row.input;
  const hasUserFact = input?.evidence.some(
    (fragment) => fragment.source === "USER_DRAFT" || fragment.source === "USER_HISTORY",
  );
  return {
    key: row.key,
    action: row.action,
    stage: outcome.stage,
    status: outcome.status,
    candidateIds: row.topK.top10.map((candidate) => candidate.skillId),
    hardEligibleIds: row.topK.capabilityEligibility
      .filter((trace) => trace.hardEligible)
      .map((trace) => trace.skillId),
    groundedCandidateIds: input
      ? input.candidates
          .filter(
            (candidate) => !SRS4_USER_FACT_GATED_CAPABILITIES.has(candidate.skillId) || hasUserFact,
          )
          .map((candidate) => candidate.skillId)
      : [],
    applicabilityById:
      outcome.status === "VALID"
        ? Object.fromEntries(
            outcome.assessments.map((assessment) => [assessment.skillId, assessment.applicability]),
          )
        : {},
    blockingReasonsById:
      outcome.status === "VALID"
        ? Object.fromEntries(
            outcome.assessments.map((assessment) => [
              assessment.skillId,
              assessment.blockingReasonCodes,
            ]),
          )
        : {},
  };
}

export interface AssessorDevelopmentMetrics {
  scenarios: number;
  wordingScenarios: number;
  structuralScenarios: number;
  failed: number;
  requiredTotal: number;
  requiredTop10: number;
  requiredProvenanceBlocked: number;
  requiredGroundedAvailable: number;
  requiredGroundedSupported: number;
  requiredCore: number;
  requiredSupporting: number;
  forbiddenAvailable: number;
  forbiddenPositivelySupported: number;
  wordingNoneTotal: number;
  wordingNoneWithoutSupportedCandidate: number;
  uncertainCandidateCount: number;
  perSkill: Record<
    string,
    { groundedRequired: number; supportedRequired: number; forbiddenSupported: number }
  >;
  byAction: Record<
    string,
    {
      groundedRequired: number;
      supportedRequired: number;
      wordingNone: number;
      wordingNoneClean: number;
    }
  >;
  requiredDiagnostics: Array<{
    key: string;
    skillId: string;
    stage:
      | "HARD_ELIGIBILITY"
      | "RETRIEVAL_TOP10_MISS"
      | "PROVENANCE_GROUNDING_BLOCKED"
      | "ASSESSOR_FAILED"
      | "ASSESSOR_REQUIRED_MISS"
      | "SUPPORTED";
  }>;
}

export function evaluateAssessorDevelopment(
  observations: readonly AssessorDevelopmentObservation[],
  labels: readonly DevelopmentLabel[],
): AssessorDevelopmentMetrics {
  const byKey = new Map(observations.map((row) => [row.key, row]));
  if (byKey.size !== observations.length || observations.length !== labels.length)
    throw Error("SRS-4R-A exposed observation/label count mismatch");
  const metrics: AssessorDevelopmentMetrics = {
    scenarios: observations.length,
    wordingScenarios: 0,
    structuralScenarios: 0,
    failed: 0,
    requiredTotal: 0,
    requiredTop10: 0,
    requiredProvenanceBlocked: 0,
    requiredGroundedAvailable: 0,
    requiredGroundedSupported: 0,
    requiredCore: 0,
    requiredSupporting: 0,
    forbiddenAvailable: 0,
    forbiddenPositivelySupported: 0,
    wordingNoneTotal: 0,
    wordingNoneWithoutSupportedCandidate: 0,
    uncertainCandidateCount: 0,
    perSkill: {},
    byAction: {},
    requiredDiagnostics: [],
  };
  for (const label of labels) {
    const row = byKey.get(label.key);
    if (!row || row.action !== label.action) throw Error("SRS-4R-A label/raw key-action drift");
    const isWording = wording.has(row.action);
    if (isWording) metrics.wordingScenarios++;
    else metrics.structuralScenarios++;
    if (row.status === "FAILED") metrics.failed++;
    metrics.uncertainCandidateCount += Object.values(row.applicabilityById).filter(
      (value) => value === "UNCERTAIN",
    ).length;
    const action = (metrics.byAction[row.action] ??= {
      groundedRequired: 0,
      supportedRequired: 0,
      wordingNone: 0,
      wordingNoneClean: 0,
    });
    for (const skillId of label.required) {
      metrics.requiredTotal++;
      const skill = (metrics.perSkill[skillId] ??= {
        groundedRequired: 0,
        supportedRequired: 0,
        forbiddenSupported: 0,
      });
      let stage: AssessorDevelopmentMetrics["requiredDiagnostics"][number]["stage"];
      if (!row.hardEligibleIds.includes(skillId)) stage = "HARD_ELIGIBILITY";
      else if (!row.candidateIds.includes(skillId)) stage = "RETRIEVAL_TOP10_MISS";
      else {
        metrics.requiredTop10++;
        if (!row.groundedCandidateIds.includes(skillId)) {
          metrics.requiredProvenanceBlocked++;
          stage = "PROVENANCE_GROUNDING_BLOCKED";
        } else {
          metrics.requiredGroundedAvailable++;
          skill.groundedRequired++;
          action.groundedRequired++;
          const applicability = row.applicabilityById[skillId];
          if (row.status === "FAILED") stage = "ASSESSOR_FAILED";
          else if (!supports(applicability)) stage = "ASSESSOR_REQUIRED_MISS";
          else {
            stage = "SUPPORTED";
            metrics.requiredGroundedSupported++;
            skill.supportedRequired++;
            action.supportedRequired++;
            if (applicability === "CORE") metrics.requiredCore++;
            else metrics.requiredSupporting++;
          }
        }
      }
      metrics.requiredDiagnostics.push({ key: label.key, skillId, stage });
    }
    for (const skillId of label.forbidden) {
      if (!row.candidateIds.includes(skillId)) continue;
      metrics.forbiddenAvailable++;
      if (supports(row.applicabilityById[skillId])) {
        metrics.forbiddenPositivelySupported++;
        (metrics.perSkill[skillId] ??= {
          groundedRequired: 0,
          supportedRequired: 0,
          forbiddenSupported: 0,
        }).forbiddenSupported++;
      }
    }
    if (label.strictNone && isWording) {
      metrics.wordingNoneTotal++;
      action.wordingNone++;
      if (
        row.status === "VALID" &&
        !Object.values(row.applicabilityById).some((value) => supports(value))
      ) {
        metrics.wordingNoneWithoutSupportedCandidate++;
        action.wordingNoneClean++;
      }
    }
  }
  return metrics;
}
