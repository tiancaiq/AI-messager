import { decideCoachingAction } from "../src/coaching-policy.js";
import { composerB45Fixtures } from "./composer-b4-5-fixtures.js";
import type { PipelineValidationFixture } from "./skill-pipeline-fixtures.js";

export const COMPOSER_B4_6_TARGET_IDS = [
  "status-request",
  "regional-english-status",
  "regional-traditional-status",
  "unsupported-primary-code-switching",
  "korean-universal",
  "missed-commitment",
  "ordinary-appreciation",
  "clear-refusal",
  "uncertain-availability",
  "chinese-boundary-traditional",
  "cap-pressure-multi-need",
  "supported-status-b4-6",
  "ordinary-ask-for-help",
] as const;
export const COMPOSER_B4_6_TARGET_MAX_CALLS = 13;

const statusBaseline = composerB45Fixtures.find(({ id }) => id === "status-request");
if (!statusBaseline) throw new Error("Missing frozen status baseline");

/** The only new live fixture: explicit user-owned status before the other person's request. */
export const supportedStatusB46Fixture: PipelineValidationFixture = {
  ...statusBaseline,
  id: "supported-status-b4-6",
  categories: ["status", "supported-status"],
  request: {
    ...statusBaseline.request,
    analysis: {
      ...statusBaseline.request.analysis,
      messages: [
        {
          ...statusBaseline.request.analysis.messages[0]!,
          id: "supported-status-user",
          order: 1,
          speaker: "USER",
          text: "No update yet.",
          textConfidence: 0.96,
          speakerConfidence: 0.96,
        },
        {
          ...statusBaseline.request.analysis.messages[0]!,
          id: "supported-status-other",
          order: 2,
          speaker: "OTHER",
          text: "Can you share a progress update?",
        },
      ],
    },
  },
  supportedEvidenceSummary:
    "The USER explicitly stated no update before the OTHER requested progress; no future follow-up was promised.",
};

export const composerB46TargetFixtures: readonly PipelineValidationFixture[] =
  COMPOSER_B4_6_TARGET_IDS.map((id) => {
    const fixture =
      id === supportedStatusB46Fixture.id
        ? supportedStatusB46Fixture
        : composerB45Fixtures.find((candidate) => candidate.id === id);
    if (!fixture) throw new Error(`Missing B4.6 target fixture ${id}`);
    if (
      !["REWRITE_DRAFT", "COMPLETE_DRAFT", "SUGGEST_REPLY"].includes(
        decideCoachingAction(fixture.request).action,
      )
    )
      throw new Error(`B4.6 target ${id} is not provider-generated`);
    return fixture;
  });

export function assertComposerB46TargetBudget(callsAttempted: number, upcoming: number): void {
  if (
    !Number.isInteger(callsAttempted) ||
    callsAttempted < 0 ||
    upcoming !== 1 ||
    callsAttempted + upcoming > COMPOSER_B4_6_TARGET_MAX_CALLS
  )
    throw new Error("B4.6 targeted call budget exhausted");
}

if (
  composerB46TargetFixtures.length !== COMPOSER_B4_6_TARGET_MAX_CALLS ||
  new Set(COMPOSER_B4_6_TARGET_IDS).size !== COMPOSER_B4_6_TARGET_MAX_CALLS
)
  throw new Error("B4.6 targeted dataset or budget changed");
