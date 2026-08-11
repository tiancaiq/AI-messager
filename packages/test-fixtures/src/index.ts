import type {
  CoachResult,
  ConversationObservation,
  SkillDefinition,
} from "@ai-message-coach/contracts";

export const validCoachResultFixture = {
  action: "SUGGEST_REPLY",
  confidences: {
    identity: 0.1,
    relationship: 0.85,
    situation: 0.95,
    userIntent: 0.9,
    otherIntent: 0.8,
    language: 1,
    skillSelection: 0.75,
  },
} satisfies CoachResult;

export const invalidCoachResultFixture: unknown = {
  action: "SEND_MESSAGE",
  confidences: {
    identity: 2,
  },
};

export const syntheticObservationFixture = {
  messages: [
    {
      id: "message-1",
      owner: "OTHER",
      text: "Can you share a synthetic status update?",
    },
  ],
  draft: null,
} satisfies ConversationObservation;

export const validSkillFixture = {
  id: "concise-status-update",
  name: "Concise status update",
  description: "A synthetic definition used only to validate the Phase 0 skill boundary.",
  kind: "ATOMIC",
  status: "APPROVED",
  languages: ["universal"],
  domains: ["professional"],
  relationships: ["professional"],
  situations: ["status-update"],
  useWhen: ["A concise update is appropriate."],
  doNotUseWhen: ["The user has no status information."],
  principles: ["State known facts clearly."],
  avoid: ["Do not invent progress or dates."],
  requiredContext: ["known-status"],
  optionalContext: ["known-timeline"],
  compatibleSkills: [],
  conflictingSkills: [],
  dependsOn: [],
  version: 1,
} satisfies SkillDefinition;
