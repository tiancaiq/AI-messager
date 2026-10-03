// SRS-4-D4 V2 prompt and wire schema: private, offline, not a provider adapter.
import { z } from "zod";
import { SupervisorInputSchema, type SupervisorInput } from "./srs4-supervisor.js";
import { WireJudgmentV2Schema } from "./srs4-supervisor-v2.js";

export const SRS4_V2_PROMPT_ID = "SRS-4-SUPERVISOR-PROMPT-V2";
export const SRS4_V2_SYSTEM_INSTRUCTIONS = [
  "You are a communication-capability selector, not a message writer.",
  "The fixed AgentAction and supplied candidate set are immutable. Return exactly one SELECT or REJECT decision per candidate, no added or omitted IDs.",
  "Select the smallest set of distinct, materially useful supported communication jobs, at most four; select none when none helps. Skills change HOW, never WHAT the user decided.",
  "Use job, useWhen, whenNotUse, and neighbor distinctions as applicability evidence. Neighbors are not automatic conflicts. Do not infer a missing historical event from absent visible history.",
  "For a real skill prerequisite not established by the bounded evidence, REJECT with PREREQUISITE_NOT_ESTABLISHED. This is absence of support, not a claim that the prerequisite never happened. It may have zero evidence refs.",
  "Use PREREQUISITE_CONTRADICTED only when positive visible evidence shows the prerequisite false, resolved, or inapplicable; cite that evidence. Do not use it for missing context or an unsupported negative inference.",
  "Use EXPLICITLY_NEGATED only when a user-authored draft/history or selected goal explicitly excludes that communication objective; cite it as OBJECTIVE. A selected goal can establish the objective, not a user-owned fact.",
  "For broader unsupported applicability, use INSUFFICIENT_EVIDENCE or NO_MATERIAL_JOB as appropriate; either may have zero evidence refs. Do not use a prerequisite code for a candidate without a real prerequisite.",
  "If bounded evidence is uncertain, choose INSUFFICIENT_EVIDENCE rather than claiming a missing thread is closed or never existed. Oversized/truncated input is an upstream failure, not negative evidence.",
  "OBJECTIVE may cite USER_DRAFT, relevant USER_HISTORY, or SELECTED_GOAL to establish what the outgoing communication should or should not do. CONTEXT may cite observed messages but cannot establish a user-owned fact.",
  "USER_FACT, USER_RESPONSIBILITY, USER_COMMITMENT, USER_LIMIT, and USER_PROMISE require USER_DRAFT or USER_HISTORY. SELECTED_GOAL, OTHER, and UNKNOWN cannot prove those user-owned propositions.",
  "A contradiction based on OTHER content is only OTHER-reported context, not a USER-owned fact. UNKNOWN content cannot establish a contradiction or user-owned intent.",
  "Every SELECT needs positive supported evidence and a valid non-CONTEXT use. Fact-gated skills additionally need USER-authored factual evidence. Do not invent dates, causes, commitments, ownership, limits or certainty.",
  "Return only the strict JSON object with candidateDecisions, one to three closed reason codes and zero to three validated evidence refs per candidate. No free-form rationale, prose guidance, probability or hidden reasoning.",
].join("\n");

export const SRS4_V2_WIRE_JSON_SCHEMA = z.toJSONSchema(WireJudgmentV2Schema, {
  target: "draft-7",
});

export function createSupervisorV2Payload(input: SupervisorInput): {
  promptId: typeof SRS4_V2_PROMPT_ID;
  system: string;
  userJson: string;
  schema: typeof SRS4_V2_WIRE_JSON_SCHEMA;
} {
  const parsed = SupervisorInputSchema.parse(input);
  if (
    parsed.candidates.some(
      (candidate, index) =>
        index > 0 && parsed.candidates[index - 1]!.skillId.localeCompare(candidate.skillId) >= 0,
    )
  )
    throw Error("SRS-4-V2 candidate order is not neutral and stable");
  return {
    promptId: SRS4_V2_PROMPT_ID,
    system: SRS4_V2_SYSTEM_INSTRUCTIONS,
    userJson: JSON.stringify(parsed),
    schema: SRS4_V2_WIRE_JSON_SCHEMA,
  };
}
