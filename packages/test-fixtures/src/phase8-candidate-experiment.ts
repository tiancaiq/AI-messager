import type {
  AgentAction,
  CoachingRequest,
  ConversationAnalysis,
  SkillContext,
  SkillDefinition,
} from "@ai-message-coach/contracts";

export type Phase8CandidateId = "perspective_acknowledgement" | "give_constructive_feedback";

export const phase8CandidateDefinitions = [
  {
    id: "perspective_acknowledgement",
    name: "Perspective acknowledgement",
    description:
      "Acknowledge another person's explicitly stated interpretation without endorsing it as fact.",
    languages: ["universal"],
    situations: [],
    intents: ["acknowledge_perspective"],
    actions: ["REWRITE_DRAFT", "SUGGEST_REPLY"],
    useWhen: [
      "The other person explicitly states an interpretation and the user chooses to recognize it.",
    ],
    doNotUseWhen: [
      "Only a feeling, missing fact, neutral logistical detail, or unsupported interpretation is present.",
    ],
    principles: [
      "Recognize the other person's stated reading in plain attributed language.",
      "Separate acknowledging that reading from endorsing disputed facts or motives.",
      "Preserve the user's position and any supplied uncertainty or denial.",
    ],
    avoid: [
      "Do not invent feelings, intentions, explanations, or fault.",
      "Do not turn a denial into agreement, apology, or a promise.",
      "Avoid unchosen questions and formulaic validation.",
    ],
    compatibleSkills: [],
    conflictingSkills: [],
    version: 1,
    status: "INACTIVE",
  },
  {
    id: "give_constructive_feedback",
    name: "Give constructive feedback",
    description:
      "State supported behavior, its supported impact, and a desired actionable change without attacking identity.",
    languages: ["universal"],
    situations: [],
    intents: ["give_feedback"],
    actions: ["REWRITE_DRAFT", "SUGGEST_REPLY"],
    useWhen: [
      "The user chooses feedback and visible evidence supports the behavior, impact, and desired change.",
    ],
    doNotUseWhen: [
      "The input only contains a request, a limit, a status statement, or an unsupported motive or impact.",
    ],
    principles: [
      "Describe only the supported behavior and its supported impact.",
      "State the desired actionable change clearly and proportionately.",
      "Keep the feedback focused on the event rather than the person's identity or motive.",
    ],
    avoid: [
      "Do not invent incidents, repetition, motives, impact, or authority.",
      "Do not use insults, humiliation, identity labels, or threats.",
      "Do not create a new promise or certainty for either person.",
    ],
    compatibleSkills: [],
    conflictingSkills: [],
    version: 1,
    status: "INACTIVE",
  },
] as const satisfies readonly SkillDefinition[];

export interface Phase8SelectionFixture {
  id: string;
  candidateId: Phase8CandidateId;
  category: "POSITIVE" | "NEGATIVE" | "HARD_NEIGHBOR" | "NONE";
  mode: "REWRITE_DRAFT" | "SUGGEST_REPLY";
  context: SkillContext;
  expectedSkills: string[];
  forbiddenSkills: string[];
}

const context = (
  action: "REWRITE_DRAFT" | "SUGGEST_REPLY",
  intentTags: SkillContext["intentTags"],
  situationTags: SkillContext["situationTags"] = [],
  language = "en",
): SkillContext => ({
  action,
  intent: "Synthetic Phase 8 selection case.",
  situationTags,
  intentTags,
  language: { primary: language, secondary: null, codeSwitching: false },
  draftPresent: action === "REWRITE_DRAFT",
  ambiguityMaterial: false,
});

const modes = ["REWRITE_DRAFT", "SUGGEST_REPLY"] as const;

function positiveCases(
  candidateId: Phase8CandidateId,
  intentTag: "acknowledge_perspective" | "give_feedback",
): Phase8SelectionFixture[] {
  const languages = ["en", "en-US", "zh-Hans", "zh-Hant"];
  return languages.flatMap((language, index) =>
    modes.map((mode) => ({
      id: `${candidateId}-positive-${index + 1}-${mode.toLowerCase()}`,
      candidateId,
      category: "POSITIVE" as const,
      mode,
      context: context(mode, [intentTag], [], language),
      expectedSkills: [candidateId],
      forbiddenSkills: [],
    })),
  );
}

function boundaryCases(
  candidateId: Phase8CandidateId,
  negative: { intent: SkillContext["intentTags"]; situations: SkillContext["situationTags"] },
  neighbors: readonly {
    id: string;
    intent: SkillContext["intentTags"];
    situations: SkillContext["situationTags"];
  }[],
): Phase8SelectionFixture[] {
  return [
    ...modes.map((mode) => ({
      id: `${candidateId}-negative-${mode.toLowerCase()}`,
      candidateId,
      category: "NEGATIVE" as const,
      mode,
      context: context(mode, negative.intent, negative.situations),
      expectedSkills: [],
      forbiddenSkills: [candidateId],
    })),
    ...neighbors.flatMap((neighbor) =>
      modes.map((mode) => ({
        id: `${candidateId}-neighbor-${neighbor.id}-${mode.toLowerCase()}`,
        candidateId,
        category: "HARD_NEIGHBOR" as const,
        mode,
        context: context(mode, neighbor.intent, neighbor.situations),
        expectedSkills: [neighbor.id],
        forbiddenSkills: [candidateId],
      })),
    ),
    ...modes.map((mode) => ({
      id: `${candidateId}-none-${mode.toLowerCase()}`,
      candidateId,
      category: "NONE" as const,
      mode,
      context: context(mode, [], []),
      expectedSkills: [],
      forbiddenSkills: [candidateId],
    })),
  ];
}

export const phase8CandidateSelectionFixtures: readonly Phase8SelectionFixture[] = [
  ...positiveCases("perspective_acknowledgement", "acknowledge_perspective"),
  ...boundaryCases("perspective_acknowledgement", { intent: ["plan"], situations: ["planning"] }, [
    { id: "emotional_validation", intent: ["validate_emotion"], situations: ["emotional_support"] },
    { id: "clarification", intent: ["clarify"], situations: ["request"] },
  ]),
  ...positiveCases("give_constructive_feedback", "give_feedback"),
  ...boundaryCases(
    "give_constructive_feedback",
    { intent: ["provide_status"], situations: ["status_request"] },
    [
      { id: "request", intent: ["make_request"], situations: ["request"] },
      { id: "boundary_setting", intent: ["set_boundary"], situations: ["pressure"] },
    ],
  ),
];

export interface Phase8GenerationFixture {
  id: string;
  candidateId: Phase8CandidateId;
  mode: "REWRITE_DRAFT" | "SUGGEST_REPLY";
  language: "en" | "zh-Hans" | "zh-Hant";
  contextSetting: "work" | "personal" | "service";
  request: CoachingRequest;
  existingSkillIds: string[];
  requiredAnchors: string[];
  forbiddenClaims: string[];
}

function makeAnalysis({
  other,
  user,
  draft,
  language,
}: {
  other: string;
  user?: string;
  draft: string | null;
  language: "en" | "zh-Hans" | "zh-Hant";
}): ConversationAnalysis {
  const messages = [
    { speaker: "OTHER" as const, text: other },
    ...(user ? [{ speaker: "USER" as const, text: user }] : []),
  ].map((message, index) => ({
    id: `m${index + 1}`,
    order: index + 1,
    ...message,
    textConfidence: 0.99,
    speakerConfidence: 0.99,
  }));
  const isChinese = language.startsWith("zh");
  return {
    messages,
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
      primary: language,
      secondary: null,
      script:
        language === "zh-Hans"
          ? "SIMPLIFIED"
          : language === "zh-Hant"
            ? "TRADITIONAL"
            : "NOT_APPLICABLE",
      codeSwitching: false,
      supportedForLanguageSpecificSkills: isChinese || language === "en",
      confidence: 0.99,
    },
    conversation: { summary: "Synthetic Phase 8 experiment context.", confidence: 0.99 },
    warnings: [],
    overallConfidence: 0.99,
  };
}

function generationFixture(
  fixture: Omit<Phase8GenerationFixture, "request"> & {
    other: string;
    user?: string;
    draft: string | null;
    selectedIntent?: string;
  },
): Phase8GenerationFixture {
  const { other, user, draft, selectedIntent, ...metadata } = fixture;
  const action: AgentAction = draft === null ? "SUGGEST_REPLY" : "REWRITE_DRAFT";
  if (metadata.mode !== action) throw new Error(`Mode mismatch for ${metadata.id}.`);
  return {
    ...metadata,
    request: {
      analysis: makeAnalysis({
        other,
        ...(user === undefined ? {} : { user }),
        draft,
        language: metadata.language,
      }),
      selection:
        draft === null
          ? {
              kind: "ACTION",
              id: "phase8-explicit-intent",
              label: "Use the selected communication goal",
              intent: selectedIntent ?? "Respond using only the visible facts.",
            }
          : null,
    },
  };
}

export const phase8CandidateGenerationFixtures: readonly Phase8GenerationFixture[] = [
  generationFixture({
    id: "perspective-work-rewrite-en",
    candidateId: "perspective_acknowledgement",
    mode: "REWRITE_DRAFT",
    language: "en",
    contextSetting: "work",
    other: "I read the unannounced schedule change as a sign that my input did not matter.",
    draft: "I understand how the change looked, but that was not my intention.",
    existingSkillIds: [],
    requiredAnchors: [],
    forbiddenClaims: ["you were right", "my fault", "i promise"],
  }),
  generationFixture({
    id: "perspective-personal-suggest-en",
    candidateId: "perspective_acknowledgement",
    mode: "SUGGEST_REPLY",
    language: "en",
    contextSetting: "personal",
    other: "I read your short reply as dismissive.",
    draft: null,
    selectedIntent:
      "Acknowledge their interpretation without agreeing that dismissal was intended and without apologizing.",
    existingSkillIds: [],
    requiredAnchors: [],
    forbiddenClaims: ["you were right", "i meant to dismiss", "i promise"],
  }),
  generationFixture({
    id: "perspective-work-rewrite-zh-hans",
    candidateId: "perspective_acknowledgement",
    mode: "REWRITE_DRAFT",
    language: "zh-Hans",
    contextSetting: "work",
    other: "我觉得一直没收到回复，意味着这个问题不重要。",
    draft: "我理解你会这样解读，但这不是我的本意。",
    existingSkillIds: [],
    requiredAnchors: [],
    forbiddenClaims: ["你是对的", "是我的错", "我保证"],
  }),
  generationFixture({
    id: "perspective-service-suggest-zh-hant",
    candidateId: "perspective_acknowledgement",
    mode: "SUGGEST_REPLY",
    language: "zh-Hant",
    contextSetting: "service",
    other: "看到兩個價格，我覺得這項優惠的資訊不一致。",
    draft: null,
    selectedIntent: "回應並承認對方的看法，不確認哪個價格正確，也不承諾更改。",
    existingSkillIds: [],
    requiredAnchors: [],
    forbiddenClaims: ["您說得對", "正確價格是", "我保證"],
  }),
  generationFixture({
    id: "feedback-work-rewrite-en",
    candidateId: "give_constructive_feedback",
    mode: "REWRITE_DRAFT",
    language: "en",
    contextSetting: "work",
    other: "Please tell me if my interruptions are making the review harder.",
    draft:
      "You interrupted me 2 times during the review, so I could not finish explaining. Please let me finish next time.",
    existingSkillIds: ["request"],
    requiredAnchors: ["2"],
    forbiddenClaims: ["you always", "you do not care", "i promise"],
  }),
  generationFixture({
    id: "feedback-personal-suggest-en",
    candidateId: "give_constructive_feedback",
    mode: "SUGGEST_REPLY",
    language: "en",
    contextSetting: "personal",
    other: "Did changing the pickup plan cause a problem for you?",
    user: "The plan changed without a message, and I made an unnecessary trip.",
    draft: null,
    selectedIntent:
      "Give constructive feedback about the unannounced change and ask for advance notice next time.",
    existingSkillIds: ["request"],
    requiredAnchors: [],
    forbiddenClaims: ["you did it deliberately", "you never care", "i promise"],
  }),
  generationFixture({
    id: "feedback-work-rewrite-zh-hans",
    candidateId: "give_constructive_feedback",
    mode: "REWRITE_DRAFT",
    language: "zh-Hans",
    contextSetting: "work",
    other: "如果我在评审中打断你，请直接告诉我。",
    draft: "你在评审中打断了我2次，导致我没说完。下次请先让我说完。",
    existingSkillIds: ["request"],
    requiredAnchors: ["2"],
    forbiddenClaims: ["你总是", "你故意", "我保证"],
  }),
  generationFixture({
    id: "feedback-service-suggest-zh-hant",
    candidateId: "give_constructive_feedback",
    mode: "SUGGEST_REPLY",
    language: "zh-Hant",
    contextSetting: "service",
    other: "這批圖表的標籤有問題嗎？",
    user: "其中3張圖缺少標籤，讓我很難核對內容。",
    draft: null,
    selectedIntent: "提供具體回饋，並請對方在下次評審前補上缺少的標籤。",
    existingSkillIds: ["request"],
    requiredAnchors: ["3"],
    forbiddenClaims: ["你根本不在乎", "你總是", "我保證"],
  }),
];
