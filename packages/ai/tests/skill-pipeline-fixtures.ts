import type { CoachingRequest } from "@ai-message-coach/contracts";
import { skillSelectionEvaluationFixtures } from "@ai-message-coach/test-fixtures";

import type { UserSuppliedCommunicationContext } from "../src/communication-problem.js";

export interface PipelineValidationFixture {
  id: string;
  categories: readonly string[];
  request: CoachingRequest;
  suppliedContext?: UserSuppliedCommunicationContext;
  supportedEvidenceSummary: string;
  forbiddenSkills?: readonly string[];
  requiredSkills?: readonly string[];
}

function existing(id: string): PipelineValidationFixture {
  const fixture = skillSelectionEvaluationFixtures.find((item) => item.id === id);
  if (!fixture) throw new Error(`Missing frozen fixture: ${id}`);
  return {
    id: fixture.id,
    categories: fixture.categories,
    request: fixture.request,
    supportedEvidenceSummary:
      fixture.importantConstraints.join("; ") || "Synthetic visible context",
    forbiddenSkills: fixture.forbiddenSkills,
    requiredSkills: fixture.expectedSkills,
  };
}

const template = existing("status-request").request.analysis;

function scenario(
  id: string,
  categories: readonly string[],
  other: string,
  draft: string | null,
  supportedEvidenceSummary: string,
  options: {
    language?: CoachingRequest["analysis"]["language"];
    visibleContact?: CoachingRequest["analysis"]["visibleContact"];
    speaker?: CoachingRequest["analysis"]["messages"][number]["speaker"];
    suppliedContext?: UserSuppliedCommunicationContext;
    forbiddenSkills?: readonly string[];
    requiredSkills?: readonly string[];
  } = {},
): PipelineValidationFixture {
  return {
    id,
    categories,
    request: {
      analysis: {
        ...template,
        messages: [
          {
            id: `${id}-m1`,
            order: 1,
            speaker: options.speaker ?? "OTHER",
            text: other,
            textConfidence: 0.96,
            speakerConfidence: options.speaker === "UNKNOWN" ? 0.35 : 0.96,
          },
        ],
        draft: { text: draft, confidence: draft === null ? 0.9 : 0.96 },
        language: options.language ?? template.language,
        visibleContact: options.visibleContact ?? template.visibleContact,
        conversation: { summary: "Synthetic validation context.", confidence: 0.9 },
        warnings: [],
        overallConfidence: 0.94,
      },
      selection: null,
    },
    supportedEvidenceSummary,
    ...(options.suppliedContext ? { suppliedContext: options.suppliedContext } : {}),
    ...(options.forbiddenSkills ? { forbiddenSkills: options.forbiddenSkills } : {}),
    ...(options.requiredSkills ? { requiredSkills: options.requiredSkills } : {}),
  };
}

export const frozenSkillFixtures: readonly PipelineValidationFixture[] =
  skillSelectionEvaluationFixtures.map(({ id }) => existing(id));

export const adversarialSkillFixtures: readonly PipelineValidationFixture[] = [
  scenario(
    "sparse-nicer",
    ["sparse", "unknown-goal"],
    "Okay.",
    "Make this nicer.",
    "Only a vague draft request; no supported relationship or specific communication need.",
    { forbiddenSkills: ["apology", "reassurance"] },
  ),
  scenario(
    "uncertain-availability",
    ["uncertainty", "planning"],
    "Are you free tomorrow?",
    "I might be available tomorrow.",
    "The draft explicitly says might; no confirmed availability or promise.",
  ),
  scenario(
    "direct-refusal",
    ["refusal", "intent-preservation"],
    "Can you do this for me?",
    "No, I can't take this on.",
    "The user-owned draft explicitly refuses; no acceptance or negotiation.",
    { requiredSkills: ["decline"], forbiddenSkills: ["reassurance"] },
  ),
  scenario(
    "less-confrontational-no-apology",
    ["conflict", "boundary", "negated-apology"],
    "You must do this now. This is unfair.",
    "I cannot keep doing this. Please stop asking. I don't want to apologize.",
    "User sets a limit and explicitly rejects apologizing; visible pressure/conflict only.",
    { requiredSkills: ["boundary_setting"], forbiddenSkills: ["apology"] },
  ),
  scenario(
    "manager-recipient-unproven",
    ["relationship-unknown", "identity-unknown", "coordination"],
    "Can you share an update?",
    "I can send a status update soon.",
    "User says manager in an instruction, but screenshot contact identity is unconfirmed.",
    {
      visibleContact: { ...template.visibleContact, displayName: "Manager Pat" },
      suppliedContext: { instruction: "Make this suitable for my manager." },
      forbiddenSkills: ["apology"],
    },
  ),
  scenario(
    "disagree-relationship",
    ["multi-signal", "conflict", "clarity", "empathy"],
    "Your plan is unfair and I feel hurt.",
    "I disagree, but I don't want to argue. Could you please explain your plan?",
    "Visible hurt/conflict and a user-owned clarification request; no supported fault admission.",
    { forbiddenSkills: ["apology"] },
  ),
  scenario(
    "cap-pressure-multi-need",
    ["skill-cap", "repair", "coordination", "clarity", "style"],
    "Can you send the status now? I already asked twice. Need this now.",
    "Sorry I'm late with the status; I probably can't finish today. Could you help plan tomorrow's review?",
    "User-owned apology, uncertain timing, status, help request and planning; cap at four skills.",
    { requiredSkills: ["acknowledge_mistake"] },
  ),
  scenario(
    "chinese-boundary-traditional",
    ["chinese-traditional", "boundary", "pressure"],
    "現在就要，別再拖了。",
    "我不能再這樣做了，請不要再催。",
    "Traditional Chinese pressure and explicit limit; no apology or new commitment.",
    {
      language: {
        primary: "zh-Hant",
        secondary: null,
        script: "TRADITIONAL",
        codeSwitching: false,
        supportedForLanguageSpecificSkills: true,
        confidence: 0.98,
      },
      forbiddenSkills: ["en.professional_conciseness", "apology"],
    },
  ),
  scenario(
    "english-chinese-code-switch",
    ["mixed-language", "planning"],
    "明天 what time should we meet?",
    "Maybe 下午三點; I need to check first.",
    "Supported English/Chinese code-switching and approximate time, not a firm commitment.",
    {
      language: {
        primary: "en",
        secondary: "zh",
        script: "MIXED",
        codeSwitching: true,
        supportedForLanguageSpecificSkills: true,
        confidence: 0.98,
      },
    },
  ),
  scenario(
    "ambiguous-speaker-empty-draft",
    ["unknown-speaker", "unknown-goal", "local-action"],
    "Can you help me?",
    null,
    "Speaker is unknown and no user draft or direction is present.",
    { speaker: "UNKNOWN", forbiddenSkills: ["apology", "request"] },
  ),
  scenario(
    "identity-label-only",
    ["identity-unknown", "relationship-unknown"],
    "Please send the notes.",
    "I can send the notes later.",
    "A visible contact label alone cannot prove identity or relationship.",
    { visibleContact: { ...template.visibleContact, displayName: "Pat" } },
  ),
  scenario(
    "repair-and-empathy",
    ["multi-signal", "repair", "empathy"],
    "I'm upset that the review was late.",
    "Sorry I missed the review. I understand this was frustrating.",
    "User-owned apology and supported visible upset; no diagnosis or invented excuse.",
    { requiredSkills: ["apology"], forbiddenSkills: ["planning"] },
  ),
];
