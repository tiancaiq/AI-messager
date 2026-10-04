import type { CoachingRequest } from "@ai-message-coach/contracts";

import { decideCoachingAction } from "../src/coaching-policy.js";
import {
  adversarialSkillFixtures,
  frozenSkillFixtures,
  type PipelineValidationFixture,
} from "./skill-pipeline-fixtures.js";

const source = frozenSkillFixtures.find(({ id }) => id === "status-request");
if (!source) throw new Error("Missing synthetic status-request baseline");

function ordinary(
  id: string,
  categories: readonly string[],
  other: string,
  draft: string | null,
  supportedEvidenceSummary: string,
): PipelineValidationFixture {
  const analysis = source!.request.analysis;
  const request: CoachingRequest = {
    analysis: {
      ...analysis,
      messages: [
        {
          id: `${id}-m1`,
          order: 1,
          speaker: "OTHER",
          text: other,
          textConfidence: 0.96,
          speakerConfidence: 0.96,
        },
      ],
      draft: { text: draft, confidence: 0.96 },
      conversation: { summary: "Synthetic ordinary B4 message context.", confidence: 0.9 },
      overallConfidence: 0.94,
    },
    selection: null,
  };
  return { id, categories, request, supportedEvidenceSummary };
}

export const ordinaryComposerB4Fixtures: readonly PipelineValidationFixture[] = [
  ordinary(
    "ordinary-appreciation",
    ["ordinary", "rapport"],
    "Thanks for checking on this for me.",
    "I appreciate your help with this.",
    "A brief, warm acknowledgment; no invented relationship or promise.",
  ),
  ordinary(
    "ordinary-clear-next-step",
    ["ordinary", "clarity", "coordination"],
    "What should we do next?",
    "Let's review the notes tomorrow and decide after that.",
    "Known next step and tomorrow anchor, with no invented time or commitment beyond the draft.",
  ),
  ordinary(
    "ordinary-polite-follow-up",
    ["ordinary", "follow-up"],
    "I'll send the notes when they're ready.",
    "Could you let me know when the notes are ready?",
    "User-owned follow-up request; no blame or invented urgency.",
  ),
  ordinary(
    "ordinary-ask-for-help",
    ["ordinary", "request", "help"],
    "What are you working on?",
    "Could you help me check this today?",
    "User-owned help request and today anchor; no obligation to help is implied.",
  ),
];

const providerActions = new Set(["REWRITE_DRAFT", "COMPLETE_DRAFT", "SUGGEST_REPLY"]);

export const composerB4Fixtures: readonly PipelineValidationFixture[] = [
  ...[...frozenSkillFixtures, ...adversarialSkillFixtures].filter((fixture) =>
    providerActions.has(decideCoachingAction(fixture.request).action),
  ),
  ...ordinaryComposerB4Fixtures,
];
