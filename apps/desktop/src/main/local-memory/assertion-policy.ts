import type { MemoryAssertionRecord } from "@ai-message-coach/contracts";

export type AssertionTransition = Pick<
  MemoryAssertionRecord,
  "acceptance" | "lifecycle" | "applicability"
>;

export function addSupport(current: AssertionTransition): AssertionTransition {
  return { ...current };
}

export function decideCandidate(
  current: AssertionTransition,
  decision: "CONFIRM" | "REJECT",
): AssertionTransition | undefined {
  if (current.lifecycle !== "ACTIVE" || current.acceptance !== "CANDIDATE") return undefined;
  return { ...current, acceptance: decision === "CONFIRM" ? "CONFIRMED" : "REJECTED" };
}

export function supersede(current: AssertionTransition): AssertionTransition | undefined {
  if (current.lifecycle !== "ACTIVE") return undefined;
  return { ...current, lifecycle: "SUPERSEDED", applicability: "HISTORICAL" };
}

export function canReconsider(current: AssertionTransition): boolean {
  return current.lifecycle === "ACTIVE" && current.acceptance === "REJECTED";
}
