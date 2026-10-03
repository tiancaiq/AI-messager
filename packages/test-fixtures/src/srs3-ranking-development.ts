import type {
  AgentAction,
  CoachingRequest,
  ConversationAnalysis,
} from "@ai-message-coach/contracts";

export type Srs3Setting = "WORK" | "PERSONAL" | "SERVICE" | "UNSPECIFIED";
export type Srs3Language =
  "ENGLISH" | "SIMPLIFIED_CHINESE" | "TRADITIONAL_CHINESE" | "CODE_SWITCHING";

export interface Srs3RawScenario {
  id: string;
  revision: `R${number}`;
  scenarioFamily: string;
  split: "EXPOSED_DEVELOPMENT";
  request: CoachingRequest;
  fixedAction: AgentAction;
  catalogScope: "PRODUCTION";
  setting: Srs3Setting;
  languageGroup: Srs3Language;
}

interface Seed {
  id: `R${number}`;
  revision?: `R${number}`;
  family: string;
  setting: Srs3Setting;
  action: AgentAction;
  messages: Array<{ speaker: "OTHER" | "USER"; text: string }>;
  draft: string | null;
  intent?: string;
  language?: Srs3Language;
}

function raw(seed: Seed): Srs3RawScenario {
  const language = seed.language ?? "ENGLISH";
  const chinese = language !== "ENGLISH";
  const codeSwitching = language === "CODE_SWITCHING";
  const analysis: ConversationAnalysis = {
    messages: seed.messages.map((message, index) => ({
      id: `m${index + 1}`,
      order: index + 1,
      speaker: message.speaker,
      text: message.text,
      textConfidence: 0.99,
      speakerConfidence: 0.99,
    })),
    draft: { text: seed.draft, confidence: 0.99 },
    participants: [],
    visibleContact: {
      displayName: null,
      username: null,
      channelOrGroupName: null,
      platformHint: null,
      confidence: 0.2,
    },
    language: {
      primary: chinese ? "zh" : "en",
      secondary: codeSwitching ? "en" : null,
      script:
        language === "TRADITIONAL_CHINESE"
          ? "TRADITIONAL"
          : chinese
            ? "SIMPLIFIED"
            : "NOT_APPLICABLE",
      codeSwitching,
      supportedForLanguageSpecificSkills: true,
      confidence: 0.99,
    },
    conversation: { summary: "Synthetic exposed-development conversation.", confidence: 0.99 },
    warnings: [],
    overallConfidence: 0.99,
  };
  return {
    id: seed.id,
    revision: seed.revision ?? "R1",
    scenarioFamily: seed.family,
    split: "EXPOSED_DEVELOPMENT",
    request: {
      analysis,
      selection: seed.intent
        ? {
            kind: "ACTION",
            id: `srs3-${seed.id.toLowerCase()}`,
            label: "Use this goal",
            intent: seed.intent,
          }
        : null,
    },
    fixedAction: seed.action,
    catalogScope: "PRODUCTION",
    setting: seed.setting,
    languageGroup: language,
  };
}

// These inputs contain no expected skills, ranks, reviewer text, or source metadata.
export const srs3RawScenarios: readonly Srs3RawScenario[] = [
  raw({
    id: "R01",
    revision: "R2",
    family: "warehouse-export-action-and-version",
    setting: "WORK",
    action: "REWRITE_DRAFT",
    messages: [
      {
        speaker: "OTHER",
        text: "The warehouse has two export formats. I can run whichever you need.",
      },
    ],
    draft: "pls run the weekly inventory export and lmk if u used csv or json",
  }),
  raw({
    id: "R02",
    family: "service-plan-unclear-version",
    setting: "SERVICE",
    action: "SUGGEST_REPLY",
    messages: [
      {
        speaker: "OTHER",
        text: "I can renew the plan you mentioned, but I see a basic and a plus plan on your account.",
      },
    ],
    draft: null,
    intent: "Ask which plan the agent means before deciding whether to renew.",
  }),
  raw({
    id: "R03",
    revision: "R2",
    family: "museum-photo-request",
    setting: "PERSONAL",
    action: "REWRITE_DRAFT",
    messages: [{ speaker: "OTHER", text: "I have the photos from the museum trip on my phone." }],
    draft:
      "can you send me the group photo? if you have a moment could you help me figure out who's in the back row too?",
  }),
  raw({
    id: "R04",
    family: "interview-audio-cleanup-assistance",
    setting: "WORK",
    action: "SUGGEST_REPLY",
    messages: [
      {
        speaker: "OTHER",
        text: "The interview recording has a hum in the left channel, but the original track is still available.",
      },
    ],
    draft: null,
    intent:
      "Ask them to help remove the hum; request a sample of the original track if that would help.",
  }),
  raw({
    id: "R05",
    revision: "R2",
    family: "unanswered-library-reservation",
    setting: "SERVICE",
    action: "REWRITE_DRAFT",
    messages: [
      {
        speaker: "USER",
        text: "Could you confirm whether my study room is reserved for Thursday?",
      },
      { speaker: "OTHER", text: "We are checking reservations." },
    ],
    draft: "following up on my study room for thursday — is it booked?",
  }),
  raw({
    id: "R06",
    family: "new-billing-document-after-old-ticket",
    setting: "SERVICE",
    action: "SUGGEST_REPLY",
    messages: [
      { speaker: "USER", text: "Thanks for closing the delivery ticket last week." },
      { speaker: "OTHER", text: "Happy to help. Is there anything else?" },
    ],
    draft: null,
    intent: "Ask for a copy of the new invoice for this month.",
  }),
  raw({
    id: "R07",
    revision: "R2",
    family: "repeated-lunch-meeting-pressure",
    setting: "WORK",
    action: "REWRITE_DRAFT",
    messages: [
      {
        speaker: "OTHER",
        text: "Can I add another meeting during your lunch break? I've scheduled one there every day this week.",
      },
    ],
    draft: "cant do a lunch meeting today. need my lunch break kept free going forward",
  }),
  raw({
    id: "R08",
    family: "single-bicycle-sale-refusal",
    setting: "PERSONAL",
    action: "SUGGEST_REPLY",
    messages: [{ speaker: "OTHER", text: "Would you sell me your old bicycle?" }],
    draft: null,
    intent: "Politely decline this sale offer; do not imply a standing rule about future offers.",
  }),
  raw({
    id: "R09",
    revision: "R2",
    family: "repeated-demand-during-dispute",
    setting: "WORK",
    action: "REWRITE_DRAFT",
    messages: [
      {
        speaker: "OTHER",
        text: "You must answer every message immediately. I have asked four times today.",
      },
    ],
    draft:
      "I can reply during work hours, but can't promise an immediate answer to every message. Can we keep this calm?",
  }),
  raw({
    id: "R10",
    family: "heated-dispute-without-limit",
    setting: "PERSONAL",
    action: "SUGGEST_REPLY",
    messages: [{ speaker: "OTHER", text: "You never listen. This is ridiculous and I'm angry." }],
    draft: null,
    intent:
      "Lower the heat and keep the conversation constructive; do not invent a limit or refuse to talk.",
  }),
  raw({
    id: "R11",
    family: "clinic-appointment-options",
    setting: "SERVICE",
    action: "REWRITE_DRAFT",
    messages: [{ speaker: "OTHER", text: "Tuesday at 10 and Wednesday at 3 are both open." }],
    draft: "Wednesday at 3 works for me. Please put that on the calendar; I can arrive by 2:50.",
  }),
  raw({
    id: "R12",
    family: "repair-timing-uncertain",
    setting: "SERVICE",
    action: "SUGGEST_REPLY",
    messages: [
      { speaker: "OTHER", text: "Do you know when your technician can finish the inspection?" },
    ],
    draft: null,
    intent:
      "Explain that the technician has not confirmed a finish time and promise only an update after they do.",
  }),
  raw({
    id: "R13",
    revision: "R2",
    family: "review-next-step-and-current-state",
    setting: "WORK",
    action: "REWRITE_DRAFT",
    messages: [{ speaker: "OTHER", text: "Where are we with the accessibility review?" }],
    draft:
      "screen reader pass done. lets compare the remaining keyboard issues thurs before assigning fixes",
  }),
  raw({
    id: "R14",
    family: "parcel-current-state-no-plan",
    setting: "SERVICE",
    action: "SUGGEST_REPLY",
    messages: [{ speaker: "OTHER", text: "Has the return parcel reached you yet?" }],
    draft: null,
    intent: "Say it arrived this morning and is still unopened; do not propose next steps.",
  }),
  raw({
    id: "R15",
    revision: "R2",
    family: "missed-event-regret-and-ownership",
    setting: "PERSONAL",
    action: "REWRITE_DRAFT",
    messages: [
      { speaker: "OTHER", text: "You said you would be at my recital and I waited for you." },
    ],
    draft:
      "sorry i missed your recital. forgot to put it in my calendar. you ended up waiting for me",
  }),
  raw({
    id: "R16",
    family: "outdated-presentation-link-ownership",
    setting: "WORK",
    action: "SUGGEST_REPLY",
    messages: [
      { speaker: "OTHER", text: "The presentation link you posted opens last year's slides." },
    ],
    draft: null,
    intent:
      "Say I pasted the outdated link and will replace it with the current deck link. Include a brief apology for the confusion without blaming anyone else.",
  }),
  raw({
    id: "R17",
    family: "exam-disappointment-heard",
    setting: "PERSONAL",
    action: "REWRITE_DRAFT",
    messages: [
      { speaker: "OTHER", text: "I studied for weeks and failed the exam. I'm embarrassed." },
    ],
    draft:
      "That sounds really disappointing. I can see why you feel embarrassed, and one result doesn't erase the work you put in.",
  }),
  raw({
    id: "R18",
    family: "injury-recovery-progress",
    setting: "PERSONAL",
    action: "SUGGEST_REPLY",
    messages: [
      {
        speaker: "OTHER",
        text: "I'm worried I won't get back to hiking, even though I walked farther this week than last.",
      },
    ],
    draft: null,
    intent:
      "Offer grounded encouragement based on this week's progress without predicting recovery.",
  }),
  raw({
    id: "R19",
    revision: "R2",
    family: "inventory-current-and-later-window",
    setting: "WORK",
    action: "REWRITE_DRAFT",
    messages: [
      {
        speaker: "OTHER",
        text: "Where does the stock count stand, and when can stores expect a number?",
      },
    ],
    draft:
      "3 of 5 aisles counted. rest might take till tomorrow, ill confirm the delivery window after the last one",
  }),
  raw({
    id: "R20",
    family: "release-window-with-minimal-state",
    setting: "WORK",
    action: "SUGGEST_REPLY",
    messages: [
      { speaker: "OTHER", text: "Can I tell support the patch is going out this afternoon?" },
    ],
    draft: null,
    intent:
      "Say the patch is still in verification and this afternoon is not confirmed; give an update after verification.",
  }),
  raw({
    id: "R21",
    revision: "R2",
    family: "post-demo-microphone-test",
    setting: "WORK",
    action: "REWRITE_DRAFT",
    messages: [
      {
        speaker: "OTHER",
        text: "The test room is free from 3 to 4 after the product demo.",
      },
    ],
    draft: "let's test the mic at 3:30 after the demo. can you bring the HDMI adapter?",
  }),
  raw({
    id: "R22",
    revision: "R2",
    family: "care-visit-time-and-availability",
    setting: "PERSONAL",
    action: "REWRITE_DRAFT",
    messages: [{ speaker: "OTHER", text: "I can visit on Sunday afternoon if you're around." }],
    draft: "Sunday works, should be free after lunch. let's pick a time once you know your train",
  }),
  raw({
    id: "R23",
    revision: "R2",
    family: "support-return-status-and-forecast",
    setting: "SERVICE",
    action: "SUGGEST_REPLY",
    messages: [
      {
        speaker: "OTHER",
        text: "I can check your return. What does your account show now, and has a refund date appeared?",
      },
    ],
    draft: null,
    intent:
      "Say my account currently shows 'refund pending'. No payment date has appeared, so do not predict one.",
  }),
  raw({
    id: "R24",
    revision: "R2",
    family: "neighbor-conflict-and-quiet-hours",
    setting: "PERSONAL",
    action: "REWRITE_DRAFT",
    messages: [
      {
        speaker: "OTHER",
        text: "You've complained about my music every night this week. Stop overreacting.",
      },
    ],
    draft: "dont want to argue. the music keeps waking me up. need it quiet after 10 p.m.",
  }),
  raw({
    id: "R25",
    family: "delayed-project-apology-and-ownership",
    setting: "WORK",
    action: "SUGGEST_REPLY",
    messages: [
      {
        speaker: "OTHER",
        text: "The slide deck was late because your section wasn't uploaded by noon.",
      },
    ],
    draft: null,
    intent: "Own my late upload and apologize for the resulting delay without shifting blame.",
  }),
  raw({
    id: "R26",
    family: "ordinary-receipt-acknowledgement",
    setting: "WORK",
    action: "SUGGEST_REPLY",
    messages: [{ speaker: "OTHER", text: "I uploaded the signed receipt to the shared folder." }],
    draft: null,
    intent: "Acknowledge receipt with a brief thanks and no new task.",
  }),
  raw({
    id: "R27",
    family: "ordinary-social-small-talk",
    setting: "PERSONAL",
    action: "REWRITE_DRAFT",
    messages: [{ speaker: "OTHER", text: "The park was busy today, but the weather was nice." }],
    draft: "Sounds like a pleasant afternoon!",
  }),
  raw({
    id: "R28",
    family: "neutral-information-no-operation",
    setting: "SERVICE",
    action: "SUGGEST_REPLY",
    messages: [{ speaker: "OTHER", text: "The museum closes at 6 p.m. on weekdays." }],
    draft: null,
    intent: "Simply acknowledge the stated hours without asking, planning, or changing anything.",
  }),
  raw({
    id: "R29",
    family: "completed-conversation-no-reply",
    setting: "PERSONAL",
    action: "NO_REPLY_NEEDED",
    messages: [
      { speaker: "USER", text: "See you there." },
      { speaker: "OTHER", text: "See you!" },
    ],
    draft: null,
  }),
  raw({
    id: "R30",
    revision: "R2",
    family: "zh-simplified-booking-detail",
    setting: "SERVICE",
    action: "SUGGEST_REPLY",
    messages: [
      {
        speaker: "OTHER",
        text: "您的预约信息里显示上午或下午，但这里没有写清楚具体是哪一个时段。",
      },
    ],
    draft: null,
    intent: "请询问预约具体是上午还是下午，不要自行确定。",
    language: "SIMPLIFIED_CHINESE",
  }),
  raw({
    id: "R31",
    family: "zh-simplified-colleague-help",
    setting: "WORK",
    action: "REWRITE_DRAFT",
    messages: [{ speaker: "OTHER", text: "报表里的合计公式一直报错。" }],
    draft: "你方便帮我一起检查一下合计公式吗？",
    language: "SIMPLIFIED_CHINESE",
  }),
  raw({
    id: "R32",
    family: "zh-simplified-projector-repair-state",
    setting: "WORK",
    action: "SUGGEST_REPLY",
    messages: [{ speaker: "OTHER", text: "那台投影仪的维修进度怎么样？" }],
    draft: null,
    intent: "说明维修中心已经收到设备，但还没有给出诊断。",
    language: "SIMPLIFIED_CHINESE",
  }),
  raw({
    id: "R33",
    family: "zh-simplified-study-room-entry-limit",
    setting: "PERSONAL",
    action: "REWRITE_DRAFT",
    messages: [{ speaker: "OTHER", text: "我这周每天都在你开会时进书房拿东西，今晚还会进去。" }],
    draft: "我开会时请不要进书房，需要拿东西请等会议结束。",
    language: "SIMPLIFIED_CHINESE",
  }),
  raw({
    id: "R34",
    family: "zh-traditional-appointment-plan",
    setting: "SERVICE",
    action: "REWRITE_DRAFT",
    messages: [{ speaker: "OTHER", text: "週四下午可以看診，週五上午也有空位。" }],
    draft: "我選週五上午，請幫我預約。",
    language: "TRADITIONAL_CHINESE",
  }),
  raw({
    id: "R35",
    family: "zh-traditional-grounded-comfort",
    setting: "PERSONAL",
    action: "SUGGEST_REPLY",
    messages: [{ speaker: "OTHER", text: "我很擔心演講，但這週已經練習了三次。" }],
    draft: null,
    intent: "根據已練習三次這件事給予鼓勵，不保證結果。",
    language: "TRADITIONAL_CHINESE",
  }),
  raw({
    id: "R36",
    family: "zh-traditional-mistake-owned",
    setting: "WORK",
    action: "REWRITE_DRAFT",
    messages: [{ speaker: "OTHER", text: "你昨天傳的表格少了最後一頁。" }],
    draft: "是我漏傳了最後一頁，我現在補上。",
    language: "TRADITIONAL_CHINESE",
  }),
  raw({
    id: "R37",
    family: "zh-traditional-decline-event",
    setting: "PERSONAL",
    action: "SUGGEST_REPLY",
    messages: [{ speaker: "OTHER", text: "這星期六一起去看展覽嗎？" }],
    draft: null,
    intent: "婉拒這次邀請，不暗示以後都不去。",
    language: "TRADITIONAL_CHINESE",
  }),
  raw({
    id: "R38",
    family: "mixed-language-release-status",
    setting: "WORK",
    action: "REWRITE_DRAFT",
    messages: [{ speaker: "OTHER", text: "QA 的结果出来了吗？" }],
    draft: "QA 已经跑完主要流程，edge cases 还在检查。我今天晚点再更新。",
    language: "CODE_SWITCHING",
  }),
  raw({
    id: "R39",
    revision: "R2",
    family: "mixed-language-file-request",
    setting: "WORK",
    action: "SUGGEST_REPLY",
    messages: [{ speaker: "OTHER", text: "draft deck 已经放在 Drive 里了。" }],
    draft: null,
    intent: "请对方把 draft deck 的链接发给我。",
    language: "CODE_SWITCHING",
  }),
  raw({
    id: "R40",
    family: "mixed-language-lost-cat-worry",
    setting: "PERSONAL",
    action: "REWRITE_DRAFT",
    messages: [{ speaker: "OTHER", text: "我的猫不见了，我现在很着急，已经问过邻居了。" }],
    draft: "听起来你真的很着急。If you want to talk, 我在这里听你说。",
    language: "CODE_SWITCHING",
  }),
  raw({
    id: "R41",
    revision: "R2",
    family: "mixed-language-support-timing",
    setting: "SERVICE",
    action: "SUGGEST_REPLY",
    messages: [
      {
        speaker: "OTHER",
        text: "你的 ticket 还在 open，但 team 还没有给 completion time。",
      },
    ],
    draft: null,
    intent: "说明 ETA 还没确认，收到时间后再更新，不自行承诺。",
    language: "CODE_SWITCHING",
  }),
];
