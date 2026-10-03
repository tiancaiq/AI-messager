import {
  SkillAssessmentRequestSchema,
  SkillContextSchema,
  SkillSelectionRequestSchema,
  SkillSelectionResultSchema,
  type SkillSelectionRequest,
  type SkillSelectionResult,
} from "@ai-message-coach/contracts";

import {
  validateCommunicationAssessment,
  validateSkillSelectionResult,
  type SkillSelector,
} from "./agent-skill-boundary.js";
import {
  validateApprovedSkillCatalogSnapshot,
  type ApprovedSkillCatalogSnapshot,
} from "./catalog-snapshot.js";
import {
  communicationSignalIds,
  signalMatchesSkillMetadata,
  supportedSignalEvidenceRefs,
} from "./communication-signals.js";
import { conflictsWithSelected, rankEligibleSkillCandidates } from "./engine.js";

export interface DeterministicSelectionDiagnostic {
  readonly result: SkillSelectionResult;
  readonly conflictBlocked: boolean;
}

function failed(
  request: SkillSelectionRequest,
  failureCode: "CATALOG_MISMATCH" | "ASSESSMENT_FAILED" | "SELECTION_FAILED",
): DeterministicSelectionDiagnostic {
  return {
    result: SkillSelectionResultSchema.parse({
      status: "FAILED",
      selectedSkills: [],
      reasons: [],
      uncertaintyCodes: [],
      failureCode,
      catalogSnapshotId: request.catalogSnapshotId,
    }),
    conflictBlocked: false,
  };
}

function assessmentRequest(request: SkillSelectionRequest) {
  return SkillAssessmentRequestSchema.parse({
    action: request.action,
    taskPurpose: request.taskPurpose,
    evidence: request.evidence,
    context: request.context,
  });
}

export function selectEvidenceAwareSkills(
  rawRequest: SkillSelectionRequest,
  snapshot: ApprovedSkillCatalogSnapshot,
): DeterministicSelectionDiagnostic {
  const request = SkillSelectionRequestSchema.parse(rawRequest);
  let registry;
  try {
    registry = validateApprovedSkillCatalogSnapshot(snapshot);
  } catch {
    return failed(request, "CATALOG_MISMATCH");
  }
  if (request.catalogSnapshotId !== snapshot.id) return failed(request, "CATALOG_MISMATCH");

  const assessmentInput = assessmentRequest(request);
  try {
    validateCommunicationAssessment(assessmentInput, request.assessment, communicationSignalIds);
    for (const need of request.assessment.needs) {
      const supported = supportedSignalEvidenceRefs(assessmentInput, need.signalId);
      if (!supported.length || !need.evidenceRefs.every((ref) => supported.includes(ref)))
        throw new Error("UNSUPPORTED_COMMUNICATION_NEED");
    }
  } catch {
    return failed(request, "ASSESSMENT_FAILED");
  }
  if (request.assessment.status === "FAILED") return failed(request, "ASSESSMENT_FAILED");
  if (request.assessment.status !== "ASSESSED")
    return {
      result: SkillSelectionResultSchema.parse({
        status: "NONE",
        selectedSkills: [],
        reasons: [],
        uncertaintyCodes: request.assessment.uncertaintyCodes,
        catalogSnapshotId: snapshot.id,
      }),
      conflictBlocked: false,
    };
  if (["SUGGEST_ACTIONS", "ASK_CLARIFICATION", "NO_REPLY_NEEDED"].includes(request.action))
    return {
      result: SkillSelectionResultSchema.parse({
        status: "NONE",
        selectedSkills: [],
        reasons: [],
        uncertaintyCodes: [],
        catalogSnapshotId: snapshot.id,
      }),
      conflictBlocked: false,
    };

  const context = SkillContextSchema.parse({
    ...request.context,
    action: request.action,
    intent: null,
  });
  const candidates = rankEligibleSkillCandidates(registry, context)
    .map(({ skill, score }) => ({
      skill,
      score:
        score +
        (request.assessment.needs.some((need) =>
          signalMatchesSkillMetadata(
            need.signalId,
            skill.situations,
            skill.intents,
            request.context.situationTags,
            request.context.intentTags,
          ),
        )
          ? 5
          : 0),
    }))
    .sort((left, right) => right.score - left.score || left.skill.id.localeCompare(right.skill.id));
  const selected: (typeof registry)[number][] = [];
  const reasons: SkillSelectionResult["reasons"] = [];
  let conflictBlocked = false;
  for (const { skill } of candidates) {
    if (selected.length >= request.maxSkills) continue;
    if (conflictsWithSelected(skill, selected)) {
      conflictBlocked = true;
      continue;
    }
    const matchingNeed = request.assessment.needs.find((need) =>
      signalMatchesSkillMetadata(
        need.signalId,
        skill.situations,
        skill.intents,
        request.context.situationTags,
        request.context.intentTags,
      ),
    );
    const matchingTag = request.evidence.find((item) => {
      if (
        item.kind !== "CONTEXT_TAG" ||
        item.source !== "DETERMINISTIC_DERIVATION" ||
        item.value.format !== "CODE"
      )
        return false;
      const code = item.value.code;
      return (
        (code.startsWith("SITUATION:") &&
          request.context.situationTags.some((tag) => tag === code.slice(10)) &&
          skill.situations.some((tag) => tag === code.slice(10))) ||
        (code.startsWith("INTENT:") &&
          request.context.intentTags.some((tag) => tag === code.slice(7)) &&
          skill.intents.some((tag) => tag === code.slice(7)))
      );
    });
    const primaryLanguage = request.context.language.primary?.split("-", 1)[0]?.toLowerCase();
    const language = request.evidence.find(
      (item) =>
        item.kind === "LANGUAGE" &&
        item.value.format === "CODE" &&
        item.value.code === `PRIMARY:${request.context.language.primary}` &&
        skill.languages.some((family) => family !== "universal" && family === primaryLanguage),
    );
    const reason = matchingNeed
      ? { skillId: skill.id, evidenceRefs: matchingNeed.evidenceRefs, code: "NEED_MATCH" as const }
      : matchingTag
        ? { skillId: skill.id, evidenceRefs: [matchingTag.id], code: "CONTEXT_MATCH" as const }
        : language
          ? { skillId: skill.id, evidenceRefs: [language.id], code: "LANGUAGE_MATCH" as const }
          : null;
    if (!reason) continue;
    selected.push(skill);
    reasons.push(reason);
  }
  const result = SkillSelectionResultSchema.parse({
    status: selected.length ? "SELECTED" : "NONE",
    selectedSkills: selected.map(({ id, version }) => ({ id, version })),
    reasons,
    uncertaintyCodes: [],
    catalogSnapshotId: snapshot.id,
  });
  return {
    result: validateSkillSelectionResult(request, result, snapshot, communicationSignalIds),
    conflictBlocked,
  };
}

export function createEvidenceAwareSkillSelector(
  snapshot: ApprovedSkillCatalogSnapshot,
): SkillSelector {
  return {
    async select(request) {
      return selectEvidenceAwareSkills(request, snapshot).result;
    },
  };
}
