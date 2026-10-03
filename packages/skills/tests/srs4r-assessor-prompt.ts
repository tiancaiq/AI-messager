// SRS-4R-A offline prompt proposal. This module does not call a provider.
import { z } from "zod";
import { SupervisorInputSchema, type SupervisorInput } from "./srs4-supervisor.js";
import {
  SkillAssessmentBatchWireSchema,
  SkillAssessmentSingletonWireSchema,
} from "./srs4r-assessment.js";

export const SRS4R_A_PROMPT_ID = "SRS-4R-A-CANDIDATE-LOCAL-PROMPT-V1";
export const SRS4R_A_SYSTEM_INSTRUCTIONS = [
  "You assess communication skill applicability; you do not write a reply or choose the final skill set.",
  "For each candidate, decide only whether THIS candidate's job applies to the fixed AgentAction and bounded evidence. Treat every candidate independently. Do not compare it with, rank it against, or refer to another candidate's assessment.",
  "CORE means this candidate is a direct substantive communication job in the outgoing message. SUPPORTING means this candidate's own job is materially useful as a secondary communication contribution even when assessed on its own. SUPPORTING is not low confidence, stylistic decoration, a hedge, or a claim that another named skill is selected.",
  "UNSUPPORTED means bounded evidence does not safely establish applicability. UNCERTAIN means material ambiguity or incomplete context prevents a safe decision. Neither is supported. Do not output numeric confidence, final selected IDs, NONE, a SkillPlan, or message wording.",
  "A supported assessment needs a concrete positive evidence ref, a non-CONTEXT use, and a supported JOB or USE_WHEN clause ref. Factual skills also need USER-authored factual evidence. Do not invent responsibility, a mistake, deadline, promise, continuing limit or next step.",
  "SELECTED_GOAL may establish the desired communication OBJECTIVE, including explicit negation, but not USER-owned facts. USER_FACT, USER_RESPONSIBILITY, USER_COMMITMENT, USER_LIMIT and USER_PROMISE require USER_DRAFT or USER_HISTORY. OTHER and UNKNOWN remain separate owners.",
  "PREREQUISITE_NOT_ESTABLISHED says only that the bounded evidence does not establish a real prerequisite. It may have zero refs; never infer the prerequisite never happened. PREREQUISITE_CONTRADICTED requires positive source-appropriate evidence that it is false or resolved.",
  "EXPLICITLY_NEGATED requires OBJECTIVE evidence from USER_DRAFT, relevant USER_HISTORY or SELECTED_GOAL. OWNERSHIP_MISMATCH requires observed OTHER or UNKNOWN context. Source uncertainty may require UNCERTAIN with INSUFFICIENT_EVIDENCE.",
  "Use one closed support code for CORE or SUPPORTING, or one to three closed blocking codes for UNSUPPORTED or UNCERTAIN. Do not use any reason that depends on which other candidate will ultimately be selected.",
  "Return only the strict JSON structure. Include every supplied candidate once in batch mode, with exactly the supplied skill ID and revisions. No free-form rationale or hidden reasoning.",
].join("\n");

export const SRS4R_A_BATCH_JSON_SCHEMA = z.toJSONSchema(SkillAssessmentBatchWireSchema, {
  target: "draft-7",
});
export const SRS4R_A_SINGLETON_JSON_SCHEMA = z.toJSONSchema(SkillAssessmentSingletonWireSchema, {
  target: "draft-7",
});

function common(input: SupervisorInput) {
  return {
    fixedAction: input.fixedAction,
    language: input.language,
    warnings: input.warnings,
    evidence: input.evidence,
  };
}

export function createSkillAssessorBatchPayload(
  inputValue: SupervisorInput,
  candidateOrder?: readonly string[],
) {
  const input = SupervisorInputSchema.parse(inputValue);
  const byId = new Map(input.candidates.map((candidate) => [candidate.skillId, candidate]));
  const ids = candidateOrder ?? input.candidates.map((candidate) => candidate.skillId);
  if (
    ids.length !== input.candidates.length ||
    new Set(ids).size !== ids.length ||
    ids.some((id) => !byId.has(id))
  )
    throw Error("SRS-4R-A batch order is not an exact candidate permutation");
  return {
    promptId: SRS4R_A_PROMPT_ID,
    system: SRS4R_A_SYSTEM_INSTRUCTIONS,
    userJson: JSON.stringify({
      ...common(input),
      candidates: ids.map((id) => byId.get(id)!),
    }),
    schema: SRS4R_A_BATCH_JSON_SCHEMA,
  };
}

export function createSkillAssessorSingletonPayload(inputValue: SupervisorInput, skillId: string) {
  const input = SupervisorInputSchema.parse(inputValue);
  const candidate = input.candidates.find((item) => item.skillId === skillId);
  if (!candidate) throw Error("SRS-4R-A singleton target is not a supplied candidate");
  return {
    promptId: SRS4R_A_PROMPT_ID,
    system: SRS4R_A_SYSTEM_INSTRUCTIONS,
    userJson: JSON.stringify({ ...common(input), candidate }),
    schema: SRS4R_A_SINGLETON_JSON_SCHEMA,
  };
}
