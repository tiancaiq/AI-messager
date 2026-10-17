import {
  SkillDefinitionSchema,
  type CommunicationSkillAction,
  type SkillDefinition,
  type SkillIntentTag,
  type SkillLanguage,
  type SkillSituationTag,
} from "@ai-message-coach/contracts";

const wordingActions: CommunicationSkillAction[] = [
  "REWRITE_DRAFT",
  "COMPLETE_DRAFT",
  "SUGGEST_REPLY",
];

interface SkillSeed {
  id: string;
  name: string;
  description: string;
  languages: SkillLanguage[];
  situations?: SkillSituationTag[];
  intents?: SkillIntentTag[];
  actions?: CommunicationSkillAction[];
  principles: string[];
  avoid?: string[];
  compatibleSkills?: string[];
  conflictingSkills?: string[];
  status?: "ACTIVE" | "INACTIVE";
}

function define(seed: SkillSeed): SkillDefinition {
  const definition = SkillDefinitionSchema.parse({
    situations: [],
    intents: [],
    actions: wordingActions,
    useWhen: [seed.description],
    doNotUseWhen: [
      "Do not apply when its communication operation is unsupported by visible context or user intent.",
    ],
    avoid: [],
    compatibleSkills: [],
    conflictingSkills: [],
    version: 1,
    status: "ACTIVE",
    ...seed,
  });
  for (const value of Object.values(definition)) {
    if (Array.isArray(value)) Object.freeze(value);
  }
  return Object.freeze(definition);
}

export const initialSkillRegistry: readonly SkillDefinition[] = Object.freeze([
  define({
    id: "apology",
    name: "Apology",
    description: "Use when the user intends to apologize for a supported mistake or impact.",
    languages: ["universal"],
    situations: ["mistake", "missed_commitment"],
    intents: ["apologize"],
    principles: ["Apologize directly and proportionately for the supported impact."],
    avoid: ["Do not invent fault, excuses, or excessive self-blame."],
    compatibleSkills: ["acknowledge_mistake", "expectation_setting"],
  }),
  define({
    id: "acknowledge_mistake",
    name: "Acknowledge mistake",
    description: "Use when visible context supports that the user made or missed something.",
    languages: ["universal"],
    situations: ["mistake", "missed_commitment"],
    intents: ["acknowledge_mistake"],
    principles: ["Name the supported mistake or delay without defensiveness."],
    avoid: ["Do not shift blame or add an unsupported explanation."],
    compatibleSkills: ["apology", "status_update", "expectation_setting"],
  }),
  define({
    id: "emotional_validation",
    name: "Emotional validation",
    description: "Use when the other person shares a clearly upsetting experience or feeling.",
    languages: ["universal"],
    situations: ["emotional_support"],
    intents: ["validate_emotion"],
    principles: ["Acknowledge the visible feeling or difficulty before advice."],
    avoid: ["Do not diagnose, minimize, or claim to know an unspoken feeling."],
    compatibleSkills: ["reassurance"],
  }),
  define({
    id: "reassurance",
    name: "Reassurance",
    description: "Use when grounded reassurance would support a visible concern.",
    languages: ["universal"],
    situations: ["emotional_support"],
    intents: ["reassure"],
    principles: ["Offer grounded support without promising outcomes you cannot know."],
    avoid: ["Do not guarantee that everything will be fine."],
    compatibleSkills: ["emotional_validation"],
  }),
  define({
    id: "boundary_setting",
    name: "Boundary setting",
    description: "Use when the user intends to set a limit under repeated pressure.",
    languages: ["universal"],
    situations: ["pressure", "conflict"],
    intents: ["set_boundary"],
    principles: ["State the limit clearly and focus on what the user can or cannot do."],
    avoid: [
      "Do not apologize for a reasonable boundary unless the context separately supports an apology.",
    ],
    compatibleSkills: ["de_escalation", "decline"],
  }),
  define({
    id: "de_escalation",
    name: "De-escalation",
    description: "Use when visible conflict benefits from calm, non-accusatory wording.",
    languages: ["universal"],
    situations: ["conflict", "pressure"],
    intents: ["de_escalate"],
    principles: ["Use calm, concrete language and avoid escalating accusations."],
    avoid: ["Do not concede the user’s decision merely to reduce tension."],
    compatibleSkills: ["boundary_setting"],
  }),
  define({
    id: "decline",
    name: "Decline",
    description: "Use when the user clearly intends to refuse or decline.",
    languages: ["universal"],
    situations: ["invitation", "request"],
    intents: ["decline"],
    principles: ["Preserve the refusal and make it clear without inventing a reason."],
    avoid: ["Do not turn a refusal into acceptance or an unsupported future commitment."],
    compatibleSkills: ["boundary_setting"],
  }),
  define({
    id: "ask_for_help",
    name: "Ask for help",
    description: "Use when the user intends to request assistance.",
    languages: ["universal"],
    situations: ["request"],
    intents: ["ask_for_help"],
    principles: ["Make the requested help and known context clear."],
    avoid: ["Do not invent urgency, authority, or an obligation to help."],
  }),
  define({
    id: "follow_up",
    name: "Follow up",
    description: "Use for a supported follow-up on an earlier visible request.",
    languages: ["universal"],
    situations: ["follow_up"],
    intents: ["follow_up"],
    principles: ["Refer to the visible request concisely and make the next step clear."],
    avoid: ["Do not imply blame from a lack of response alone."],
  }),
  define({
    id: "status_update",
    name: "Status update",
    description: "Use when the other person requests progress or the user provides current status.",
    languages: ["universal"],
    situations: ["status_request", "missed_commitment"],
    intents: ["provide_status"],
    principles: ["State the known current status and relevant next step clearly."],
    avoid: ["Do not invent progress, dates, blockers, or certainty."],
    compatibleSkills: ["acknowledge_mistake", "expectation_setting"],
  }),
  define({
    id: "expectation_setting",
    name: "Expectation setting",
    description: "Use when supported timing or limits need to be communicated realistically.",
    languages: ["universal"],
    situations: ["missed_commitment", "status_request", "planning"],
    intents: ["set_expectation"],
    principles: ["State supported timing with the same certainty expressed by the user."],
    avoid: ["Do not convert maybe or probably into a promise."],
    compatibleSkills: ["status_update", "acknowledge_mistake"],
  }),
  define({
    id: "planning",
    name: "Planning",
    description: "Use for simple visible coordination of time, place, or next steps.",
    languages: ["universal"],
    situations: ["planning", "invitation"],
    intents: ["plan"],
    principles: ["Make known logistics and the next coordination step easy to understand."],
    avoid: ["Do not add unsupported times, places, or availability."],
  }),
  define({
    id: "clarification",
    name: "Clarification",
    description: "Use when the user intends to ask for one concrete missing detail.",
    languages: ["universal"],
    situations: ["request"],
    intents: ["clarify"],
    principles: ["Ask one concise question that resolves the material missing detail."],
    avoid: ["Do not ask multiple questions or repeat what is already visible."],
  }),
  define({
    id: "request",
    name: "Clear request",
    description: "Use when the user wants to make a supported request.",
    languages: ["universal"],
    situations: ["request"],
    intents: ["make_request"],
    principles: ["State the requested action clearly and leave room for a truthful response."],
    avoid: ["Do not invent authority, urgency, or consequences."],
  }),
  define({
    id: "en.professional_conciseness",
    name: "English professional conciseness",
    description:
      "Use for English status, request, or follow-up wording that benefits from concise professional convention.",
    languages: ["en"],
    situations: ["status_request", "missed_commitment", "follow_up", "request"],
    principles: ["Use concise professional English without turning a chat message into an email."],
    avoid: ["Avoid ceremonial greetings, corporate filler, and unnecessary formality."],
  }),
  define({
    id: "en.casual_naturalness",
    name: "English casual naturalness",
    description: "Use for short casual English replies and planning.",
    languages: ["en"],
    situations: ["planning", "invitation"],
    principles: ["Use natural conversational English and preserve the message’s brevity."],
    avoid: ["Avoid stiff email-like phrasing."],
  }),
  define({
    id: "en.direct_but_polite",
    name: "English direct but polite",
    description: "Use for English boundaries, declines, and clear requests.",
    languages: ["en"],
    situations: ["pressure", "conflict", "request", "invitation"],
    intents: ["set_boundary", "decline", "make_request"],
    principles: ["Be direct about the decision or request while remaining respectful."],
    avoid: ["Do not soften the message until its meaning becomes ambiguous."],
  }),
  define({
    id: "zh.politeness_calibration",
    name: "Chinese politeness calibration",
    description:
      "Use for Chinese requests, declines, and boundaries that need natural calibrated politeness.",
    languages: ["zh"],
    situations: ["request", "pressure", "conflict", "invitation"],
    principles: [
      "Use natural Chinese politeness appropriate to a chat without changing the decision.",
    ],
    avoid: ["Avoid excessive honorifics or indirectness that obscures intent."],
  }),
  define({
    id: "zh.professional_formality",
    name: "Chinese professional formality",
    description:
      "Use for Chinese status and missed-commitment messages that benefit from concise professional convention.",
    languages: ["zh"],
    situations: ["status_request", "missed_commitment", "follow_up"],
    principles: ["Use concise professional Chinese while preserving visible certainty and facts."],
    avoid: ["Avoid bureaucratic filler and unsupported commitments."],
  }),
  define({
    id: "zh.natural_conciseness",
    name: "Chinese natural conciseness",
    description: "Use for concise Chinese chat replies and planning.",
    languages: ["zh"],
    situations: ["planning", "invitation", "request"],
    principles: ["Keep Chinese chat wording natural, concise, and easy to act on."],
    avoid: ["Avoid literal translation patterns and redundant subjects."],
  }),
  define({
    id: "zh.code_switching",
    name: "Chinese code switching",
    description: "Use when the visible Chinese context intentionally mixes English terms.",
    languages: ["zh"],
    situations: ["planning", "status_request", "request"],
    principles: [
      "Preserve natural English terms already used in the Chinese conversation where appropriate.",
    ],
    avoid: ["Do not force the entire message into one language or add new jargon."],
  }),
]);
