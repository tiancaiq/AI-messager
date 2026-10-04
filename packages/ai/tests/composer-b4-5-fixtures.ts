import { decideCoachingAction } from "../src/coaching-policy.js";
import { composerB4Fixtures } from "./composer-b4-fixtures.js";
import type { PipelineValidationFixture } from "./skill-pipeline-fixtures.js";

const legacyWins = [
  "missed-commitment",
  "korean-universal",
  "emotional-support",
  "simple-planning",
  "direct-refusal",
  "less-confrontational-no-apology",
  "english-chinese-code-switch",
  "repair-and-empathy",
  "ordinary-clear-next-step",
  "ordinary-ask-for-help",
] as const;
const bothFailed = [
  "status-request",
  "regional-english-status",
  "regional-traditional-status",
  "unsupported-primary-code-switching",
  "ordinary-appreciation",
] as const;
const guardCases = ["decline-after-action", "ordinary-polite-follow-up"] as const;
const controls = [
  "professional-status",
  "uncertain-availability",
  "clear-refusal",
  "apology-mistake",
  "chinese-boundary-traditional",
  "cap-pressure-multi-need",
] as const;

export const COMPOSER_B4_5_CASE_IDS = [
  ...legacyWins,
  ...bothFailed,
  ...guardCases,
  ...controls,
] as const;
export const COMPOSER_B4_5_MAX_CALLS = 46;

export function assertComposerB45CallBudget(callsAttempted: number, upcomingCalls: number): void {
  if (
    !Number.isInteger(callsAttempted) ||
    callsAttempted < 0 ||
    !Number.isInteger(upcomingCalls) ||
    upcomingCalls !== 2 ||
    callsAttempted + upcomingCalls > COMPOSER_B4_5_MAX_CALLS
  )
    throw new Error("B4.5 live-call budget exhausted");
}

export const composerB45Fixtures: readonly PipelineValidationFixture[] = COMPOSER_B4_5_CASE_IDS.map(
  (id) => {
    const fixture = composerB4Fixtures.find((candidate) => candidate.id === id);
    if (!fixture) throw new Error(`Missing frozen B4 fixture ${id}`);
    if (
      !["REWRITE_DRAFT", "COMPLETE_DRAFT", "SUGGEST_REPLY"].includes(
        decideCoachingAction(fixture.request).action,
      )
    )
      throw new Error(`B4.5 focused case ${id} is not provider-generated`);
    return fixture;
  },
);

if (new Set(COMPOSER_B4_5_CASE_IDS).size !== 23)
  throw new Error("B4.5 focused fixture set must contain 23 unique cases");

/** Replaces the misconstructed B4 sparse-nicer case for test-only Agent instruction probing. */
export const sparseNicerB45Fixture: PipelineValidationFixture = (() => {
  const source = composerB4Fixtures.find(({ id }) => id === "sparse-nicer");
  if (!source) throw new Error("Missing historical sparse-nicer fixture");
  return {
    ...source,
    id: "sparse-nicer-repaired",
    request: {
      ...source.request,
      analysis: {
        ...source.request.analysis,
        draft: { text: "Thanks for your help.", confidence: 0.96 },
      },
    },
    suppliedContext: { instruction: "Make this nicer." },
    supportedEvidenceSummary:
      "Actual user message plus a separate validated Agent-side tone instruction; no new factual claim.",
  };
})();
