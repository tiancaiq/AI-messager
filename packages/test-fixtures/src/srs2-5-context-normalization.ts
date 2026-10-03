import type {
  AgentAction,
  CoachingRequest,
  ConversationAnalysis,
  ConversationSpeaker,
  SkillIntentTag,
  SkillSituationTag,
} from "@ai-message-coach/contracts";

export type Srs25CatalogScope = "PRODUCTION" | "PRODUCTION_PLUS_EVALUATION";

export interface Srs25RawScenario {
  id: `T${number}`;
  scenarioFamily: string;
  split: "DEVELOPMENT";
  request: CoachingRequest;
  fixedAction: AgentAction;
  catalogScope: Srs25CatalogScope;
}

export interface Srs25SignalExpectation {
  requiredIntentTags: SkillIntentTag[];
  allowedIntentTags: SkillIntentTag[];
  forbiddenIntentTags: SkillIntentTag[];
  requiredSituationTags: SkillSituationTag[];
  allowedSituationTags: SkillSituationTag[];
  forbiddenSituationTags: SkillSituationTag[];
}

export interface Srs25RetrievalExpectation {
  required: string[];
  acceptable: string[];
  forbidden: string[];
  strictNone: boolean;
}

export interface Srs25ScenarioAnnotation {
  id: Srs25RawScenario["id"];
  normalization: Srs25SignalExpectation;
  retrieval: Srs25RetrievalExpectation;
}

interface MessageInput {
  speaker: ConversationSpeaker;
  text: string;
}

interface AnalysisInput {
  messages: MessageInput[];
  draft: string | null;
  primary?: string;
  secondary?: string | null;
  script?: ConversationAnalysis["language"]["script"];
  codeSwitching?: boolean;
}

function makeAnalysis({
  messages,
  draft,
  primary = "en",
  secondary = null,
  script = primary.startsWith("zh") ? "SIMPLIFIED" : "NOT_APPLICABLE",
  codeSwitching = false,
}: AnalysisInput): ConversationAnalysis {
  return {
    messages: messages.map((message, index) => ({
      id: `m${index + 1}`,
      order: index + 1,
      ...message,
      textConfidence: 0.99,
      speakerConfidence: 0.99,
    })),
    draft: { text: draft, confidence: 0.99 },
    participants: [],
    visibleContact: {
      displayName: null,
      username: null,
      channelOrGroupName: null,
      platformHint: null,
      confidence: 0.2,
    },
    language: {
      primary,
      secondary,
      script,
      codeSwitching,
      supportedForLanguageSpecificSkills: primary === "en" || primary.startsWith("zh"),
      confidence: 0.99,
    },
    conversation: { summary: "Synthetic SRS-2.5 exposed-development context.", confidence: 0.99 },
    warnings: [],
    overallConfidence: 0.99,
  };
}

function raw(
  id: Srs25RawScenario["id"],
  scenarioFamily: string,
  fixedAction: AgentAction,
  input: AnalysisInput,
  selectedIntent?: string,
  catalogScope: Srs25CatalogScope = "PRODUCTION",
): Srs25RawScenario {
  return {
    id,
    scenarioFamily,
    split: "DEVELOPMENT",
    request: {
      analysis: makeAnalysis(input),
      selection:
        selectedIntent === undefined
          ? null
          : {
              kind: "ACTION",
              id: `srs25-${id.toLowerCase()}-intent`,
              label: "Use the selected communication goal",
              intent: selectedIntent,
            },
    },
    fixedAction,
    catalogScope,
  };
}

export const srs25RawScenarios: readonly Srs25RawScenario[] = [
  raw("T1", "missed-deadline-multi-capability", "REWRITE_DRAFT", {
    messages: [
      {
        speaker: "OTHER",
        text: "You said this would be ready Friday. I had to explain the delay to the client. What's actually happening, and when will I have it?",
      },
    ],
    draft:
      "You're right, I should have updated you earlier. Testing is still blocked by two issues. I don't want to promise a time I can't meet. I'll send you another update this afternoon.",
  }),
  raw("T2", "boundary-decline-de-escalation", "REWRITE_DRAFT", {
    messages: [
      { speaker: "OTHER", text: "I already asked twice. You need to take this on today." },
    ],
    draft: "I can't keep taking on extra work. I need to finish what I'm already responsible for.",
  }),
  raw(
    "T3",
    "feedback-request-boundary",
    "REWRITE_DRAFT",
    {
      messages: [
        { speaker: "OTHER", text: "If I'm interrupting too much during reviews, tell me." },
      ],
      draft:
        "You interrupted me several times today and I couldn't finish explaining my point. Next time, please let me finish before responding.",
    },
    undefined,
    "PRODUCTION_PLUS_EVALUATION",
  ),
  raw(
    "T4",
    "perspective-vs-emotion",
    "REWRITE_DRAFT",
    {
      messages: [
        {
          speaker: "OTHER",
          text: "I read the unannounced schedule change as a sign that my input didn't matter.",
        },
      ],
      draft: "I understand how the change looked, but that wasn't my intention.",
    },
    undefined,
    "PRODUCTION_PLUS_EVALUATION",
  ),
  raw("T5", "emotion-vs-perspective", "SUGGEST_REPLY", {
    messages: [
      { speaker: "OTHER", text: "I got some really bad news today and I'm honestly devastated." },
    ],
    draft: null,
  }),
  raw("T6", "mistake-vs-apology", "REWRITE_DRAFT", {
    messages: [{ speaker: "OTHER", text: "You sent me the wrong numbers yesterday." }],
    draft: "You're right, I used the old figures. I'll correct them.",
  }),
  raw("T7", "other-person-mistake", "REWRITE_DRAFT", {
    messages: [
      { speaker: "OTHER", text: "The meeting started late because Alex didn't send the link." },
    ],
    draft: "I'll send everyone the updated notes.",
  }),
  raw("T8", "status-expectation-planning", "REWRITE_DRAFT", {
    messages: [{ speaker: "OTHER", text: "Will this be ready today?" }],
    draft:
      "There are still two tests failing. I probably won't finish today. I'll know more after the next test run.",
  }),
  raw("T9", "planning-vs-expectation", "SUGGEST_REPLY", {
    messages: [
      { speaker: "OTHER", text: "What time should we meet tomorrow?" },
      { speaker: "USER", text: "I am available around 3 PM." },
    ],
    draft: null,
  }),
  raw("T10", "clarification-vs-request", "REWRITE_DRAFT", {
    messages: [{ speaker: "OTHER", text: "Please send the report before the meeting." }],
    draft: "Do you mean the sales report or the budget report?",
  }),
  raw(
    "T11",
    "request-vs-clarification",
    "SUGGEST_REPLY",
    { messages: [{ speaker: "OTHER", text: "The revised report is ready." }], draft: null },
    "Ask them to send it to you.",
  ),
  raw("T12", "follow-up-vs-request", "REWRITE_DRAFT", {
    messages: [
      { speaker: "USER", text: "Could you send me the contract?" },
      { speaker: "OTHER", text: "Sure, I'll send it this afternoon." },
    ],
    draft: "Just following up on the contract when you have a chance.",
  }),
  raw("T13", "first-request", "REWRITE_DRAFT", {
    messages: [{ speaker: "OTHER", text: "I have the latest contract." }],
    draft: "Could you send it to me?",
  }),
  raw("T14", "zh-professional-status", "REWRITE_DRAFT", {
    messages: [{ speaker: "OTHER", text: "这个版本今天一定能给吗？客户一直在催。" }],
    draft: "现在还有两个问题没解决，我不想先承诺今天一定能完成。下午三点前我再给你一个更新。",
    primary: "zh-Hans",
    script: "SIMPLIFIED",
  }),
  raw("T15", "zh-en-code-switch-status", "REWRITE_DRAFT", {
    messages: [{ speaker: "OTHER", text: "明天 client meeting 改到几点？" }],
    draft: "我还没收到 confirmed time，可能是 3 点，我确认后跟你说。",
    primary: "zh-Hans",
    secondary: "en",
    script: "MIXED",
    codeSwitching: true,
  }),
  raw("T16", "strict-none-social", "REWRITE_DRAFT", {
    messages: [{ speaker: "OTHER", text: "How are you?" }],
    draft: "Good, you?",
  }),
  raw("T17", "strict-none-acknowledgement", "REWRITE_DRAFT", {
    messages: [{ speaker: "OTHER", text: "Meeting moved to 3 PM." }],
    draft: "Thanks, got it.",
  }),
  raw("T18", "maximum-confusion", "REWRITE_DRAFT", {
    messages: [
      {
        speaker: "OTHER",
        text: "You missed the deadline, didn't tell me until I asked, and now you're saying you can't stay late to finish it. I had to explain this to the client. I need to know what's happening and whether I can rely on you tomorrow.",
      },
    ],
    draft:
      "You're right that I should have updated you earlier, and I'm sorry about that. Testing is still blocked by two issues. I can't stay late tonight, and I don't want to promise tomorrow until I know those issues are resolved. I'll send you a status update first thing in the morning.",
  }),
];

const expectation = (
  id: Srs25ScenarioAnnotation["id"],
  normalization: Partial<Srs25SignalExpectation>,
  retrieval: Srs25RetrievalExpectation,
): Srs25ScenarioAnnotation => ({
  id,
  normalization: {
    requiredIntentTags: [],
    allowedIntentTags: [],
    forbiddenIntentTags: [],
    requiredSituationTags: [],
    allowedSituationTags: [],
    forbiddenSituationTags: [],
    ...normalization,
  },
  retrieval,
});

export const srs25ScenarioAnnotations: readonly Srs25ScenarioAnnotation[] = [
  expectation(
    "T1",
    {
      requiredIntentTags: ["acknowledge_mistake", "provide_status", "set_expectation"],
      requiredSituationTags: ["mistake", "status_request"],
      allowedIntentTags: ["follow_up"],
      forbiddenIntentTags: ["decline", "plan"],
      forbiddenSituationTags: ["planning", "invitation"],
    },
    {
      required: ["acknowledge_mistake", "status_update", "expectation_setting"],
      acceptable: ["apology", "follow_up"],
      forbidden: ["reassurance"],
      strictNone: false,
    },
  ),
  expectation(
    "T2",
    {
      requiredIntentTags: ["set_boundary"],
      requiredSituationTags: ["pressure"],
      allowedIntentTags: ["decline", "de_escalate"],
    },
    {
      required: ["boundary_setting"],
      acceptable: ["decline", "de_escalation"],
      forbidden: ["apology", "reassurance"],
      strictNone: false,
    },
  ),
  expectation(
    "T3",
    { requiredIntentTags: ["give_feedback", "make_request"], requiredSituationTags: ["request"] },
    {
      required: ["give_constructive_feedback"],
      acceptable: ["request", "boundary_setting"],
      forbidden: ["apology", "reassurance"],
      strictNone: false,
    },
  ),
  expectation(
    "T4",
    {
      requiredIntentTags: ["acknowledge_perspective"],
      forbiddenIntentTags: ["validate_emotion", "plan"],
      forbiddenSituationTags: ["emotional_support", "planning"],
    },
    {
      required: ["perspective_acknowledgement"],
      acceptable: ["de_escalation"],
      forbidden: ["emotional_validation", "apology"],
      strictNone: false,
    },
  ),
  expectation(
    "T5",
    {
      requiredIntentTags: ["validate_emotion"],
      requiredSituationTags: ["emotional_support"],
      forbiddenIntentTags: ["acknowledge_perspective", "plan"],
      forbiddenSituationTags: ["planning"],
    },
    {
      required: ["emotional_validation"],
      acceptable: ["reassurance"],
      forbidden: ["perspective_acknowledgement", "planning"],
      strictNone: false,
    },
  ),
  expectation(
    "T6",
    { requiredIntentTags: ["acknowledge_mistake"], requiredSituationTags: ["mistake"] },
    {
      required: ["acknowledge_mistake"],
      acceptable: ["apology"],
      forbidden: ["emotional_validation"],
      strictNone: false,
    },
  ),
  expectation(
    "T7",
    {
      forbiddenIntentTags: ["apologize", "acknowledge_mistake"],
      forbiddenSituationTags: ["mistake", "missed_commitment", "planning"],
    },
    {
      required: [],
      acceptable: ["follow_up"],
      forbidden: ["apology", "acknowledge_mistake"],
      strictNone: false,
    },
  ),
  expectation(
    "T8",
    {
      requiredIntentTags: ["provide_status", "set_expectation"],
      requiredSituationTags: ["status_request"],
      forbiddenIntentTags: ["decline", "plan"],
      forbiddenSituationTags: ["planning"],
    },
    {
      required: ["status_update", "expectation_setting"],
      acceptable: ["follow_up"],
      forbidden: ["planning", "reassurance"],
      strictNone: false,
    },
  ),
  expectation(
    "T9",
    {
      requiredIntentTags: ["plan"],
      requiredSituationTags: ["planning"],
      forbiddenIntentTags: ["set_expectation", "provide_status"],
    },
    {
      required: ["planning"],
      acceptable: [],
      forbidden: ["expectation_setting", "status_update"],
      strictNone: false,
    },
  ),
  expectation(
    "T10",
    {
      requiredIntentTags: ["clarify"],
      requiredSituationTags: ["request"],
      forbiddenIntentTags: ["make_request", "plan"],
      forbiddenSituationTags: ["planning"],
    },
    {
      required: ["clarification"],
      acceptable: [],
      forbidden: ["request", "planning"],
      strictNone: false,
    },
  ),
  expectation(
    "T11",
    { requiredIntentTags: ["make_request"], forbiddenIntentTags: ["clarify"] },
    { required: ["request"], acceptable: [], forbidden: ["clarification"], strictNone: false },
  ),
  expectation(
    "T12",
    {
      requiredIntentTags: ["follow_up"],
      requiredSituationTags: ["follow_up"],
      allowedIntentTags: ["make_request"],
      allowedSituationTags: ["request"],
      forbiddenIntentTags: ["provide_status"],
    },
    {
      required: ["follow_up"],
      acceptable: ["request"],
      forbidden: ["status_update"],
      strictNone: false,
    },
  ),
  expectation(
    "T13",
    {
      requiredIntentTags: ["make_request"],
      requiredSituationTags: ["request"],
      forbiddenIntentTags: ["follow_up"],
      forbiddenSituationTags: ["follow_up"],
    },
    { required: ["request"], acceptable: [], forbidden: ["follow_up"], strictNone: false },
  ),
  expectation(
    "T14",
    {
      requiredIntentTags: ["provide_status", "set_expectation"],
      requiredSituationTags: ["status_request"],
      forbiddenIntentTags: ["decline"],
    },
    {
      required: ["status_update", "expectation_setting"],
      acceptable: ["follow_up"],
      forbidden: ["reassurance"],
      strictNone: false,
    },
  ),
  expectation(
    "T15",
    {
      requiredIntentTags: ["provide_status", "set_expectation"],
      requiredSituationTags: ["status_request"],
      allowedIntentTags: ["plan", "follow_up"],
      allowedSituationTags: ["planning", "follow_up"],
    },
    {
      required: ["status_update", "expectation_setting"],
      acceptable: ["follow_up", "planning"],
      forbidden: [],
      strictNone: false,
    },
  ),
  expectation(
    "T16",
    {
      forbiddenIntentTags: ["validate_emotion", "reassure", "clarify", "plan", "make_request"],
      forbiddenSituationTags: ["emotional_support", "planning", "request"],
    },
    {
      required: [],
      acceptable: [],
      forbidden: ["emotional_validation", "reassurance", "clarification", "planning", "request"],
      strictNone: true,
    },
  ),
  expectation(
    "T17",
    {
      forbiddenIntentTags: ["plan", "provide_status", "follow_up"],
      forbiddenSituationTags: ["planning", "status_request", "follow_up"],
    },
    {
      required: [],
      acceptable: [],
      forbidden: ["planning", "confirmation", "status_update", "follow_up"],
      strictNone: true,
    },
  ),
  expectation(
    "T18",
    {
      requiredIntentTags: [
        "acknowledge_mistake",
        "provide_status",
        "set_expectation",
        "set_boundary",
      ],
      requiredSituationTags: ["mistake", "missed_commitment", "status_request", "pressure"],
      allowedIntentTags: ["apologize", "decline", "follow_up", "de_escalate"],
    },
    {
      required: ["acknowledge_mistake", "status_update", "expectation_setting", "boundary_setting"],
      acceptable: ["apology", "follow_up", "de_escalation"],
      forbidden: ["reassurance"],
      strictNone: false,
    },
  ),
];

function assertDisjoint(id: string, groups: readonly (readonly string[])[]): void {
  const seen = new Set<string>();
  for (const group of groups) {
    for (const value of group) {
      if (seen.has(value))
        throw new Error(`${id} repeats label ${value} across expectation groups.`);
      seen.add(value);
    }
  }
}

export function validateSrs25FixtureBoundary(): void {
  if (srs25RawScenarios.length !== 18 || srs25ScenarioAnnotations.length !== 18)
    throw new Error("SRS-2.5 requires exactly T1-T18 raw scenarios and annotations.");
  const rawIds = srs25RawScenarios.map(({ id }) => id);
  const annotationIds = srs25ScenarioAnnotations.map(({ id }) => id);
  if (
    new Set(rawIds).size !== rawIds.length ||
    new Set(annotationIds).size !== annotationIds.length
  )
    throw new Error("SRS-2.5 fixture IDs must be unique.");
  if (rawIds.some((id, index) => annotationIds[index] !== id))
    throw new Error("SRS-2.5 raw scenarios and annotations must have identical ordered IDs.");
  for (const annotation of srs25ScenarioAnnotations) {
    assertDisjoint(annotation.id, [
      annotation.normalization.requiredIntentTags,
      annotation.normalization.allowedIntentTags,
      annotation.normalization.forbiddenIntentTags,
    ]);
    assertDisjoint(annotation.id, [
      annotation.normalization.requiredSituationTags,
      annotation.normalization.allowedSituationTags,
      annotation.normalization.forbiddenSituationTags,
    ]);
    assertDisjoint(annotation.id, [
      annotation.retrieval.required,
      annotation.retrieval.acceptable,
      annotation.retrieval.forbidden,
    ]);
  }
}
