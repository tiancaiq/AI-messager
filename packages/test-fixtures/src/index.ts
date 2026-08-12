import type {
  CoachResult,
  ConversationAnalysis,
  ConversationObservation,
  ConversationSpeaker,
  LanguageObservation,
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

export interface ConversationFixtureMessage {
  speaker: ConversationSpeaker;
  text: string;
}

export interface ConversationUnderstandingFixture {
  id: string;
  title: string;
  categories: string[];
  theme: "LIGHT" | "DARK";
  messages: ConversationFixtureMessage[];
  draft: string | null;
  expected: ConversationAnalysis;
}

interface ScenarioSeed {
  slug: string;
  title: string;
  categories: string[];
  messages: ConversationFixtureMessage[];
  draft: string | null;
  displayName: string | null;
  username: string | null;
  channelOrGroupName?: string | null;
  platformHint?: string | null;
  language: LanguageObservation;
  warnings?: ConversationAnalysis["warnings"];
  confidence?: number;
}

const language = (
  primary: string,
  options: Partial<LanguageObservation> = {},
): LanguageObservation => ({
  primary,
  secondary: null,
  script: "NOT_APPLICABLE",
  codeSwitching: false,
  supportedForLanguageSpecificSkills: primary === "en" || primary === "zh",
  confidence: 0.98,
  ...options,
});

const scenarioSeeds: ScenarioSeed[] = [
  {
    slug: "english-draft",
    title: "English conversation with typed draft",
    categories: ["english", "typed-draft", "multiple-messages"],
    messages: [
      { speaker: "OTHER", text: "Can you share the revised notes today?" },
      { speaker: "USER", text: "I am reviewing the last section now." },
    ],
    draft: "I will send them before 4 PM.",
    displayName: "Alex",
    username: "@alex",
    language: language("en"),
  },
  {
    slug: "english-no-draft",
    title: "English conversation without a draft",
    categories: ["english", "no-draft"],
    messages: [{ speaker: "OTHER", text: "What time should we start?" }],
    draft: null,
    displayName: "Morgan",
    username: null,
    language: language("en"),
  },
  {
    slug: "simplified-chinese-draft",
    title: "Simplified Chinese with typed draft",
    categories: ["chinese-simplified", "typed-draft"],
    messages: [
      { speaker: "OTHER", text: "今天可以把测试结果发给我吗？" },
      { speaker: "USER", text: "还在检查最后一个问题。" },
    ],
    draft: "我下午四点前发给你。",
    displayName: "小陈",
    username: null,
    language: language("zh", { script: "SIMPLIFIED" }),
  },
  {
    slug: "traditional-chinese-no-draft",
    title: "Traditional Chinese without a draft",
    categories: ["chinese-traditional", "no-draft"],
    messages: [
      { speaker: "OTHER", text: "明天的會議改到下午三點。" },
      { speaker: "USER", text: "收到，謝謝通知。" },
    ],
    draft: null,
    displayName: "怡君",
    username: "@yijun",
    language: language("zh", { script: "TRADITIONAL" }),
  },
  {
    slug: "mixed-english-chinese",
    title: "Mixed English and Chinese code switching",
    categories: ["mixed-english-chinese", "code-switching", "typed-draft"],
    messages: [
      { speaker: "OTHER", text: "明天 meeting 幾點？" },
      { speaker: "USER", text: "Around 3，會議室 B。" },
    ],
    draft: "ok 那我到時候找你",
    displayName: "Kai",
    username: null,
    language: language("zh", {
      secondary: "en",
      script: "MIXED",
      codeSwitching: true,
      confidence: 0.94,
    }),
  },
  {
    slug: "korean",
    title: "Korean unsupported-language observation",
    categories: ["other-language", "korean", "typed-draft"],
    messages: [{ speaker: "OTHER", text: "내일 오전에 시간 괜찮아요?" }],
    draft: "네, 열 시에 가능해요.",
    displayName: "민준",
    username: null,
    language: language("ko"),
  },
  {
    slug: "japanese",
    title: "Japanese unsupported-language observation",
    categories: ["other-language", "japanese", "no-draft"],
    messages: [{ speaker: "OTHER", text: "資料を確認してもらえますか？" }],
    draft: null,
    displayName: "Haruka",
    username: "@haruka",
    language: language("ja"),
  },
  {
    slug: "spanish",
    title: "Spanish unsupported-language observation",
    categories: ["other-language", "spanish", "typed-draft"],
    messages: [{ speaker: "OTHER", text: "¿Puedes revisar el documento hoy?" }],
    draft: "Sí, lo revisaré esta tarde.",
    displayName: "Lucía",
    username: null,
    language: language("es"),
  },
  {
    slug: "emoji",
    title: "Emoji and short informal text",
    categories: ["emoji", "short-informal", "typed-draft"],
    messages: [
      { speaker: "OTHER", text: "Made it! 🎉" },
      { speaker: "USER", text: "Nice!!" },
    ],
    draft: "👏👏",
    displayName: "Riley",
    username: null,
    language: language("en"),
  },
  {
    slug: "single-message",
    title: "Single visible message",
    categories: ["single-message", "no-draft"],
    messages: [{ speaker: "OTHER", text: "The package arrived." }],
    draft: null,
    displayName: "Taylor",
    username: null,
    language: language("en"),
  },
  {
    slug: "many-messages",
    title: "Long visible message sequence",
    categories: ["multiple-messages", "long-thread", "typed-draft"],
    messages: Array.from({ length: 10 }, (_, index) => ({
      speaker: index % 2 === 0 ? "OTHER" : "USER",
      text: `Synthetic visible message ${index + 1}`,
    })),
    draft: "One more detail to add.",
    displayName: "Casey",
    username: "@casey",
    language: language("en"),
  },
  {
    slug: "ambiguous-speaker",
    title: "Ambiguous speaker ownership",
    categories: ["ambiguous-speaker", "no-draft"],
    messages: [
      { speaker: "UNKNOWN", text: "This bubble has no reliable ownership cue." },
      { speaker: "OTHER", text: "The next visible bubble is aligned left." },
    ],
    draft: null,
    displayName: null,
    username: null,
    language: language("en", { confidence: 0.9 }),
    warnings: ["AMBIGUOUS_SPEAKER"],
    confidence: 0.62,
  },
  {
    slug: "group-chat",
    title: "Group chat with visible channel name",
    categories: ["group-chat", "multiple-messages", "typed-draft"],
    messages: [
      { speaker: "OTHER", text: "Ava: I uploaded the outline." },
      { speaker: "OTHER", text: "Noah: I added comments." },
      { speaker: "USER", text: "I will review both versions." },
    ],
    draft: "Thanks, I am opening them now.",
    displayName: null,
    username: null,
    channelOrGroupName: "Launch planning",
    platformHint: "group chat",
    language: language("en"),
  },
  {
    slug: "long-username",
    title: "Long visible username",
    categories: ["long-username", "visible-contact", "no-draft"],
    messages: [{ speaker: "OTHER", text: "The draft is ready for review." }],
    draft: null,
    displayName: "Operations Updates",
    username: "@regional_operations_updates_2026",
    language: language("en"),
  },
  {
    slug: "no-visible-username",
    title: "Display name with no username",
    categories: ["no-visible-username", "visible-contact", "typed-draft"],
    messages: [{ speaker: "OTHER", text: "I shared the calendar invite." }],
    draft: "I see it now.",
    displayName: "Sam",
    username: null,
    language: language("en"),
  },
  {
    slug: "draft-only",
    title: "Draft visible with no sent messages",
    categories: ["typed-draft", "no-messages"],
    messages: [],
    draft: "This text is still in the compose box.",
    displayName: "Jordan",
    username: null,
    language: language("en"),
    warnings: ["CROPPED_CONTENT"],
    confidence: 0.8,
  },
  {
    slug: "cropped-message",
    title: "Partially cropped visible message",
    categories: ["cropped-content", "partial-message", "no-draft"],
    messages: [{ speaker: "OTHER", text: "…the final section before sending" }],
    draft: null,
    displayName: null,
    username: null,
    language: language("en", { confidence: 0.86 }),
    warnings: ["PARTIAL_MESSAGE", "CROPPED_CONTENT"],
    confidence: 0.7,
  },
  {
    slug: "unreadable-text",
    title: "Low-confidence unreadable text",
    categories: ["unreadable-text", "low-confidence", "no-draft"],
    messages: [{ speaker: "UNKNOWN", text: "[unclear visible text]" }],
    draft: null,
    displayName: null,
    username: null,
    language: language("en", { confidence: 0.55 }),
    warnings: ["UNREADABLE_TEXT", "LOW_CONFIDENCE", "AMBIGUOUS_SPEAKER"],
    confidence: 0.42,
  },
  {
    slug: "short-informal",
    title: "Very short informal exchange",
    categories: ["short-informal", "no-draft"],
    messages: [
      { speaker: "OTHER", text: "u there?" },
      { speaker: "USER", text: "yep" },
    ],
    draft: null,
    displayName: "Lee",
    username: null,
    language: language("en"),
  },
  {
    slug: "status-update",
    title: "Professional status-update content",
    categories: ["professional-content", "typed-draft", "multiple-messages"],
    messages: [
      { speaker: "OTHER", text: "Is the release checklist complete?" },
      { speaker: "USER", text: "Two verification items remain." },
    ],
    draft: "I will post the final status after testing.",
    displayName: "Project Updates",
    username: null,
    platformHint: "team chat",
    language: language("en"),
  },
  {
    slug: "scheduling",
    title: "Scheduling details in visible messages",
    categories: ["scheduling", "typed-draft"],
    messages: [
      { speaker: "OTHER", text: "Tuesday at 10 or Wednesday at 2?" },
      { speaker: "USER", text: "Wednesday is easier." },
    ],
    draft: "Let us use Wednesday at 2.",
    displayName: "Dana",
    username: null,
    language: language("en"),
  },
  {
    slug: "long-draft",
    title: "Long multiline compose-box draft",
    categories: ["long-draft", "typed-draft"],
    messages: [{ speaker: "OTHER", text: "Please share the current status and next steps." }],
    draft:
      "The first validation pass is complete. I am checking the remaining edge cases now, and I will share the final results after that review.",
    displayName: "Update Thread",
    username: null,
    language: language("en"),
  },
  {
    slug: "mixed-chinese-script",
    title: "Mixed Simplified and Traditional Chinese script",
    categories: ["chinese-mixed-script", "code-switching", "no-draft"],
    messages: [
      { speaker: "OTHER", text: "这个版本還需要再確認嗎？" },
      { speaker: "USER", text: "需要，我今天會再检查一次。" },
    ],
    draft: null,
    displayName: "工作群組",
    username: null,
    language: language("zh", { script: "MIXED", codeSwitching: true, confidence: 0.9 }),
  },
  {
    slug: "display-name-only",
    title: "Visible contact display name only",
    categories: ["visible-contact", "display-name-only", "no-draft"],
    messages: [{ speaker: "OTHER", text: "The room number is 204." }],
    draft: null,
    displayName: "Workshop Desk",
    username: null,
    language: language("en"),
  },
  {
    slug: "platform-hint",
    title: "Visible platform hint",
    categories: ["visible-contact", "platform-hint", "typed-draft"],
    messages: [{ speaker: "OTHER", text: "I opened a new thread for the review." }],
    draft: "I will continue there.",
    displayName: "Review channel",
    username: "#review",
    platformHint: "workspace channel",
    language: language("en"),
  },
  {
    slug: "unclear-draft",
    title: "Unclear compose-box draft",
    categories: ["typed-draft", "unclear-draft", "low-confidence"],
    messages: [{ speaker: "OTHER", text: "Should I publish the document?" }],
    draft: "maybe th",
    displayName: "Pat",
    username: null,
    language: language("en", { confidence: 0.9 }),
    warnings: ["UNCLEAR_DRAFT", "LOW_CONFIDENCE"],
    confidence: 0.65,
  },
];

const themes = ["LIGHT", "DARK"] as const;

function createExpectedAnalysis(seed: ScenarioSeed): ConversationAnalysis {
  const confidence = seed.confidence ?? 0.95;
  const participantConfidence =
    seed.displayName === null && seed.username === null && seed.channelOrGroupName == null
      ? 0.4
      : confidence;

  return {
    messages: seed.messages.map((message, index) => ({
      id: `message-${index + 1}`,
      order: index + 1,
      speaker: message.speaker,
      text: message.text,
      textConfidence: confidence,
      speakerConfidence: message.speaker === "UNKNOWN" ? Math.min(confidence, 0.5) : confidence,
    })),
    draft: { text: seed.draft, confidence },
    participants:
      seed.displayName === null && seed.username === null
        ? []
        : [
            {
              speaker: "OTHER",
              displayName: seed.displayName,
              username: seed.username,
              platformHint: seed.platformHint ?? null,
              confidence: participantConfidence,
            },
          ],
    visibleContact: {
      displayName: seed.displayName,
      username: seed.username,
      channelOrGroupName: seed.channelOrGroupName ?? null,
      platformHint: seed.platformHint ?? null,
      confidence: participantConfidence,
    },
    language: seed.language,
    conversation: { summary: seed.title, confidence },
    warnings: seed.warnings ?? [],
    overallConfidence: confidence,
  };
}

export const conversationUnderstandingFixtures: ConversationUnderstandingFixture[] =
  scenarioSeeds.flatMap((seed) =>
    themes.map((theme) => ({
      id: `${seed.slug}-${theme.toLowerCase()}`,
      title: seed.title,
      categories: [...seed.categories, theme.toLowerCase()],
      theme,
      messages: seed.messages,
      draft: seed.draft,
      expected: createExpectedAnalysis(seed),
    })),
  );

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function renderConversationFixtureSvg(fixture: ConversationUnderstandingFixture): string {
  const dark = fixture.theme === "DARK";
  const background = dark ? "#111827" : "#f4f7fb";
  const header = dark ? "#1f2937" : "#ffffff";
  const foreground = dark ? "#f9fafb" : "#111827";
  const otherBubble = dark ? "#374151" : "#ffffff";
  const userBubble = dark ? "#4338ca" : "#4f46e5";
  const unknownBubble = dark ? "#78350f" : "#fef3c7";
  const bubbleText = "#ffffff";
  const otherText = dark ? "#f9fafb" : "#111827";
  const contact = fixture.expected.visibleContact;
  const heading =
    contact.channelOrGroupName ?? contact.displayName ?? contact.username ?? "Conversation";
  const messageMarkup = fixture.messages
    .slice(0, 10)
    .map((message, index) => {
      const isUser = message.speaker === "USER";
      const x = isUser ? 330 : 50;
      const width = 420;
      const y = 104 + index * 62;
      const fill =
        message.speaker === "UNKNOWN" ? unknownBubble : isUser ? userBubble : otherBubble;
      const textFill = message.speaker === "OTHER" ? otherText : bubbleText;
      const text = message.text.length > 58 ? `${message.text.slice(0, 55)}…` : message.text;
      return `<rect x="${x}" y="${y}" width="${width}" height="46" rx="18" fill="${fill}"/><text x="${x + 18}" y="${y + 29}" fill="${textFill}" font-size="17">${escapeXml(text)}</text>`;
    })
    .join("");
  const draft = fixture.draft ?? "Message";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
    <rect width="800" height="800" fill="${background}"/>
    <rect width="800" height="82" fill="${header}"/>
    <text x="32" y="50" fill="${foreground}" font-family="Arial, sans-serif" font-size="25" font-weight="700">${escapeXml(heading)}</text>
    <g font-family="Arial, sans-serif">${messageMarkup}</g>
    <rect x="36" y="714" width="728" height="58" rx="22" fill="${header}" stroke="#94a3b8"/>
    <text x="58" y="750" fill="${fixture.draft === null ? "#94a3b8" : foreground}" font-family="Arial, sans-serif" font-size="18">${escapeXml(draft.length > 70 ? `${draft.slice(0, 67)}…` : draft)}</text>
  </svg>`;
}
