import {
  CommunicationAssessmentSchema,
  SkillAssessmentRequestSchema,
  type CommunicationAssessment,
  type SkillAssessmentRequest,
} from "@ai-message-coach/contracts";

import {
  validateCommunicationAssessment,
  type SkillAssessmentPort,
} from "./agent-skill-boundary.js";

const signalDefinitions = [
  { id: "clarity", situations: ["request"], intents: ["clarify", "make_request"] },
  {
    id: "coordination",
    situations: ["status_request", "planning", "follow_up"],
    intents: ["provide_status", "set_expectation", "plan", "follow_up"],
  },
  {
    id: "empathy",
    situations: ["emotional_support"],
    intents: ["validate_emotion", "reassure"],
  },
  {
    id: "conflict_management",
    situations: ["conflict", "pressure"],
    intents: ["de_escalate"],
  },
  { id: "assertive_limits", situations: [], intents: ["set_boundary", "decline"] },
  {
    id: "repair",
    situations: ["mistake", "missed_commitment"],
    intents: ["apologize", "acknowledge_mistake"],
  },
] as const;

export const communicationSignalIds: ReadonlySet<string> = new Set(
  signalDefinitions.map(({ id }) => id),
);

function supportedCodes(request: SkillAssessmentRequest): Map<string, string> {
  const allowed = new Set([
    ...request.context.situationTags.map((tag) => `SITUATION:${tag}`),
    ...request.context.intentTags.map((tag) => `INTENT:${tag}`),
  ]);
  return new Map(
    request.evidence
      .filter(
        (item) =>
          item.kind === "CONTEXT_TAG" &&
          item.source === "DETERMINISTIC_DERIVATION" &&
          item.value.format === "CODE" &&
          allowed.has(item.value.code),
      )
      .map((item) => [item.value.format === "CODE" ? item.value.code : "", item.id]),
  );
}

export function supportedSignalEvidenceRefs(
  rawRequest: SkillAssessmentRequest,
  signalId: string,
): string[] {
  const request = SkillAssessmentRequestSchema.parse(rawRequest);
  const definition = signalDefinitions.find((item) => item.id === signalId);
  if (!definition) return [];
  const codes = supportedCodes(request);
  return [
    ...definition.situations.map((tag) => codes.get(`SITUATION:${tag}`)),
    ...definition.intents.map((tag) => codes.get(`INTENT:${tag}`)),
  ]
    .filter((ref): ref is string => ref !== undefined)
    .slice(0, 4);
}

export function signalMatchesSkillMetadata(
  signalId: string,
  situations: readonly string[],
  intents: readonly string[],
  contextSituations: readonly string[],
  contextIntents: readonly string[],
): boolean {
  const definition = signalDefinitions.find((item) => item.id === signalId);
  return Boolean(
    definition &&
    (definition.situations.some(
      (tag) => situations.includes(tag) && contextSituations.includes(tag),
    ) ||
      definition.intents.some((tag) => intents.includes(tag) && contextIntents.includes(tag))),
  );
}

export function assessCommunicationNeeds(
  rawRequest: SkillAssessmentRequest,
): CommunicationAssessment {
  const request = SkillAssessmentRequestSchema.parse(rawRequest);
  const needs = signalDefinitions.flatMap(({ id }) => {
    const evidenceRefs = supportedSignalEvidenceRefs(request, id);
    return evidenceRefs.length ? [{ signalId: id, evidenceRefs }] : [];
  });
  const uncertaintyCodes = new Set<CommunicationAssessment["uncertaintyCodes"][number]>();
  if (request.context.ambiguityMaterial) uncertaintyCodes.add("UNRESOLVED_CONTEXT");
  if (
    request.evidence.some(
      (item) =>
        item.kind === "ANALYSIS_WARNING" &&
        item.value.format === "CODE" &&
        item.value.code === "LOW_CONFIDENCE",
    )
  )
    uncertaintyCodes.add("LOW_SOURCE_CONFIDENCE");
  if (!needs.length) uncertaintyCodes.add("INSUFFICIENT_EVIDENCE");
  return validateCommunicationAssessment(
    request,
    CommunicationAssessmentSchema.parse({
      status: needs.length ? "ASSESSED" : "INSUFFICIENT_EVIDENCE",
      needs,
      uncertaintyCodes: [...uncertaintyCodes],
    }),
    communicationSignalIds,
  );
}

export function createEvidenceAwareSkillAssessor(): SkillAssessmentPort {
  return {
    async assess(request) {
      return assessCommunicationNeeds(request);
    },
  };
}
