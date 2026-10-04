import type { CoachingRequest } from "@ai-message-coach/contracts";

import { decideCoachingAction } from "../src/coaching-policy.js";
import { composerB46TargetFixtures } from "./composer-b4-6-fixtures.js";
import type { PipelineValidationFixture } from "./skill-pipeline-fixtures.js";

export const COMPOSER_B4_7_TARGET_IDS = [
  "chinese-boundary-traditional",
  "chinese-boundary-simplified-b4-7",
  "english-boundary-asking-b4-7",
  "chinese-temporary-boundary-b4-7",
  "english-temporary-boundary-b4-7",
  "pressure-empathy-durable-b4-7",
  "refusal-pressure-durable-b4-7",
  "unrelated-xian-sequence-b4-7",
  "status-request",
  "uncertain-availability",
] as const;
export const COMPOSER_B4_7_TARGET_MAX_CALLS = 10;

const baseline = new Map(composerB46TargetFixtures.map((fixture) => [fixture.id, fixture]));
const traditional = baseline.get("chinese-boundary-traditional");
const english = baseline.get("status-request");
if (!traditional || !english) throw new Error("Missing frozen B4.6 fixture baseline");

const simplifiedLanguage: CoachingRequest["analysis"]["language"] = {
  ...traditional.request.analysis.language,
  primary: "zh-Hans",
  script: "SIMPLIFIED",
};

function synthetic(
  id: string,
  categories: readonly string[],
  other: string,
  draft: string,
  language: CoachingRequest["analysis"]["language"],
  supportedEvidenceSummary: string,
): PipelineValidationFixture {
  return {
    id,
    categories,
    request: {
      analysis: {
        ...english!.request.analysis,
        messages: [
          {
            ...english!.request.analysis.messages[0]!,
            id: `${id}-m1`,
            order: 1,
            speaker: "OTHER",
            text: other,
            textConfidence: 0.96,
            speakerConfidence: 0.96,
          },
        ],
        draft: { text: draft, confidence: 0.96 },
        language,
        conversation: { summary: "Synthetic B4.7 boundary context.", confidence: 0.9 },
        warnings: [],
        overallConfidence: 0.94,
      },
      selection: null,
    },
    supportedEvidenceSummary,
  };
}

const newFixtures: readonly PipelineValidationFixture[] = [
  synthetic(
    "chinese-boundary-simplified-b4-7",
    ["chinese-simplified", "durable-boundary", "pressure"],
    "现在就要，别再拖了。",
    "我不能再这样做了，请不要再催我。",
    simplifiedLanguage,
    "The USER draft sets an unqualified pressure boundary; no temporary pause or apology is supported.",
  ),
  synthetic(
    "english-boundary-asking-b4-7",
    ["english", "durable-boundary", "repeated-asking"],
    "Can you answer this again?",
    "Please stop asking me about this.",
    english.request.analysis.language,
    "The USER asks the other person to stop asking; the draft has no temporary qualifier.",
  ),
  synthetic(
    "chinese-temporary-boundary-b4-7",
    ["chinese-traditional", "temporary-boundary", "pressure"],
    "現在能給答覆嗎？",
    "請先不要催我。",
    traditional.request.analysis.language,
    "The USER explicitly scopes the request to stop pressing with 先; do not erase or intensify that duration.",
  ),
  synthetic(
    "english-temporary-boundary-b4-7",
    ["english", "temporary-boundary", "work-limit"],
    "Can you take on another task?",
    "For now, I can't take on more work.",
    english.request.analysis.language,
    "The USER work limit is explicitly temporary; do not turn it into an unqualified limit or promise future capacity.",
  ),
  synthetic(
    "pressure-empathy-durable-b4-7",
    ["english", "durable-boundary", "empathy", "pressure"],
    "This is urgent. Please take on one more thing.",
    "I understand this is urgent, but I can't keep taking on extra work.",
    english.request.analysis.language,
    "Urgency is acknowledged, but the USER's extra-work limit has no temporary qualifier.",
  ),
  synthetic(
    "refusal-pressure-durable-b4-7",
    ["english", "durable-boundary", "refusal", "pressure"],
    "Please do this now; I need it.",
    "I can't keep doing this. Please stop pressuring me.",
    english.request.analysis.language,
    "The USER refuses continued action and sets an unqualified pressure boundary; tone may soften, scope may not.",
  ),
  synthetic(
    "unrelated-xian-sequence-b4-7",
    ["chinese-traditional", "sequence-control", "no-boundary"],
    "你要先做什麼？",
    "先確認時間，再回覆他。",
    traditional.request.analysis.language,
    "先 expresses sequence in the USER draft, not temporary boundary scope; preserve the sequence without fabricating a boundary.",
  ),
];

const fixtureById = new Map(
  [...composerB46TargetFixtures, ...newFixtures].map((fixture) => [fixture.id, fixture]),
);
export const composerB47TargetFixtures: readonly PipelineValidationFixture[] =
  COMPOSER_B4_7_TARGET_IDS.map((id) => {
    const fixture = fixtureById.get(id);
    if (!fixture) throw new Error(`Missing B4.7 target fixture ${id}`);
    if (
      !["REWRITE_DRAFT", "COMPLETE_DRAFT", "SUGGEST_REPLY"].includes(
        decideCoachingAction(fixture.request).action,
      )
    )
      throw new Error(`B4.7 target ${id} is not provider-generated`);
    return fixture;
  });

export function assertComposerB47TargetBudget(callsAttempted: number, upcoming: number): void {
  if (
    !Number.isInteger(callsAttempted) ||
    callsAttempted < 0 ||
    upcoming !== 1 ||
    callsAttempted + upcoming > COMPOSER_B4_7_TARGET_MAX_CALLS
  )
    throw new Error("B4.7 targeted call budget exhausted");
}

if (
  composerB47TargetFixtures.length !== COMPOSER_B4_7_TARGET_MAX_CALLS ||
  new Set(COMPOSER_B4_7_TARGET_IDS).size !== COMPOSER_B4_7_TARGET_MAX_CALLS
)
  throw new Error("B4.7 targeted dataset or budget changed");
