import { z } from "zod";
import {
  SupervisorInputSchema,
  WireJudgmentSchema,
  type SupervisorInput,
} from "./srs4-supervisor.js";

export const SRS4_OFFLINE_PROMPT_ID = "SRS-4-OFFLINE-PROMPT-DRAFT-1";

// Deliberately private and not wired to any provider. Review/freeze again before
// a separately approved live experiment.
export const SRS4_SYSTEM_INSTRUCTIONS = [
  "You are a communication-capability selector, not a message writer.",
  "The fixed AgentAction and supplied candidate set are immutable. Decide SELECT or REJECT exactly once for every candidate.",
  "Select the smallest set of distinct, materially useful supported communication jobs, at most four; select none when no candidate materially helps.",
  "Skills change HOW the supported user intent is communicated, never WHAT the user decided.",
  "Use job, useWhen, whenNotUse, and neighbor distinctions as contextual applicability evidence; neighbors are not automatic conflicts.",
  "Test prerequisites, explicit negation, USER versus OTHER versus UNKNOWN ownership, resolved versus unresolved prior threads, present status versus future estimate versus coordination, and redundant overlap.",
  "A SELECTED_GOAL can establish a chosen communication objective only. It cannot by itself establish a user-owned fact, mistake, responsibility, commitment, deadline, continuing limit, promise, or other factual proposition.",
  "Ground such propositions in appropriate USER_DRAFT or USER_HISTORY evidence. OTHER and UNKNOWN content cannot prove user ownership. Missing visible history is not proof no earlier thread exists.",
  "Do not invent dates, causes, motives, certainty, responsibility, next steps, promises, limits, or reversals of a refusal.",
  "Use only supplied evidence refs. Tag each ref as OBJECTIVE, CONTEXT, or a specific USER-owned factual use. A factual tag is invalid on SELECTED_GOAL, OTHER, or UNKNOWN.",
  "Return only the strict JSON object with candidateDecisions. Use one to three closed reason codes and zero to three evidence refs per candidate. No free-form rationale, prose guidance, probabilities, or hidden reasoning.",
].join("\n");

export const SRS4_WIRE_JSON_SCHEMA = z.toJSONSchema(WireJudgmentSchema, { target: "draft-7" });

export function createOfflineSupervisorPayload(input: SupervisorInput): {
  promptId: typeof SRS4_OFFLINE_PROMPT_ID;
  system: string;
  userJson: string;
  schema: typeof SRS4_WIRE_JSON_SCHEMA;
} {
  const parsed = SupervisorInputSchema.parse(input);
  if (
    parsed.candidates.some(
      (candidate, index) =>
        index > 0 && parsed.candidates[index - 1]!.skillId.localeCompare(candidate.skillId) >= 0,
    )
  )
    throw Error("Supervisor candidate order is not neutral and stable");
  return {
    promptId: SRS4_OFFLINE_PROMPT_ID,
    system: SRS4_SYSTEM_INSTRUCTIONS,
    userJson: JSON.stringify(parsed),
    schema: SRS4_WIRE_JSON_SCHEMA,
  };
}
