import {
  SkillAssessmentRequestSchema,
  SkillContextSchema,
  type AgentAction,
  type SkillContext,
  type SkillEvidence,
} from "@ai-message-coach/contracts";

import { CommunicationProblemSchema, type CommunicationProblem } from "./communication-problem.js";

/** Project already-supported request facts; no text or new semantic inference crosses this seam. */
export function projectSkillEvidence(
  rawProblem: CommunicationProblem,
  rawContext: SkillContext,
  action: AgentAction,
): SkillEvidence[] {
  const problem = CommunicationProblemSchema.parse(rawProblem);
  const context = SkillContextSchema.parse(rawContext);
  if (context.action !== action) throw new Error("FIXED_ACTION_MISMATCH");
  if (
    context.language.primary !== problem.language.primary ||
    context.language.secondary !== problem.language.secondary ||
    context.language.codeSwitching !== problem.language.codeSwitching ||
    context.draftPresent !== (problem.sourceDraft !== null)
  )
    throw new Error("PROJECTION_CONTEXT_MISMATCH");

  const evidence: SkillEvidence[] = [];
  const add = (item: Omit<SkillEvidence, "id">): void => {
    evidence.push({ id: `E${evidence.length + 1}`, ...item });
  };

  if (problem.language.primary)
    add({
      kind: "LANGUAGE",
      source: "OBSERVED_SCREENSHOT",
      sourceRef: "language:primary",
      value: { format: "CODE", code: `PRIMARY:${problem.language.primary}` },
      confidence: problem.language.confidence,
    });
  if (problem.sourceDraft)
    add({
      kind: "SOURCE_DRAFT",
      source: "OBSERVED_SCREENSHOT",
      sourceRef: "draft:current",
      value: { format: "CODE", code: "PRESENT" },
      confidence: problem.sourceDraft.confidence,
    });
  if (problem.latestOtherMessage)
    add({
      kind: "VISIBLE_MESSAGE",
      source: "OBSERVED_SCREENSHOT",
      sourceRef: `message:${problem.latestOtherMessage.order}`,
      value: { format: "CODE", code: "OTHER_PRESENT" },
      confidence: problem.latestOtherMessage.textConfidence,
    });
  for (const tag of context.situationTags)
    add({
      kind: "CONTEXT_TAG",
      source: "DETERMINISTIC_DERIVATION",
      sourceRef: `context:situation:${tag}`,
      value: { format: "CODE", code: `SITUATION:${tag}` },
    });
  for (const tag of context.intentTags)
    add({
      kind: "CONTEXT_TAG",
      source: "DETERMINISTIC_DERIVATION",
      sourceRef: `context:intent:${tag}`,
      value: { format: "CODE", code: `INTENT:${tag}` },
    });
  for (const concern of problem.concerns.slice(0, 3))
    add({
      kind: "ANALYSIS_WARNING",
      source: concern.provenance,
      value: { format: "CODE", code: concern.code },
    });
  if (problem.instruction)
    add({
      kind: "USER_DIRECTION",
      source: "USER_SUPPLIED",
      sourceRef: "instruction:current",
      value: { format: "CODE", code: "PRESENT" },
    });
  if (problem.hardConstraints.length > 0)
    add({
      kind: "HARD_CONSTRAINT",
      source: "USER_SUPPLIED",
      value: { format: "CODE", code: "PRESENT" },
    });
  if (problem.stylisticPriorities.length > 0)
    add({
      kind: "STYLE_PRIORITY",
      source: "USER_SUPPLIED",
      value: { format: "CODE", code: "PRESENT" },
    });
  for (const [unknown, kind] of [
    ["CONFIRMED_IDENTITY", "UNKNOWN_IDENTITY"],
    ["RELATIONSHIP", "UNKNOWN_RELATIONSHIP"],
    ["COMMUNICATION_GOAL", "UNKNOWN_GOAL"],
  ] as const) {
    if (problem.unknowns.includes(unknown))
      add({ kind, source: "UNKNOWN", value: { format: "UNKNOWN" } });
  }

  return SkillAssessmentRequestSchema.parse({
    action,
    taskPurpose: { kind: "PRIMARY_COACHING" },
    evidence,
    context: {
      situationTags: context.situationTags,
      intentTags: context.intentTags,
      language: context.language,
      draftPresent: context.draftPresent,
      ambiguityMaterial: context.ambiguityMaterial,
    },
  }).evidence;
}
