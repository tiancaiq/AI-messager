import type {
  AgentAction,
  CoachingRequest,
  ConversationAnalysis,
} from "@ai-message-coach/contracts";

export interface SemanticCalibrationRaw {
  id: `K${number}`;
  revision: "R1";
  split: "CALIBRATION_ONLY";
  scenarioFamily: string;
  fixedAction: AgentAction;
  request: CoachingRequest;
}

type Speaker = "USER" | "OTHER";
interface Seed {
  id: SemanticCalibrationRaw["id"];
  family: string;
  action: AgentAction;
  messages: Array<[Speaker, string]>;
  draft: string | null;
  goal?: string;
}

function raw(seed: Seed): SemanticCalibrationRaw {
  const analysis: ConversationAnalysis = {
    messages: seed.messages.map(([speaker, text], index) => ({
      id: `m${index + 1}`,
      order: index + 1,
      speaker,
      text,
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
      primary: "en",
      secondary: null,
      script: "NOT_APPLICABLE",
      codeSwitching: false,
      supportedForLanguageSpecificSkills: true,
      confidence: 0.99,
    },
    conversation: { summary: "Synthetic calibration conversation.", confidence: 0.99 },
    warnings: [],
    overallConfidence: 0.99,
  };
  return {
    id: seed.id,
    revision: "R1",
    split: "CALIBRATION_ONLY",
    scenarioFamily: seed.family,
    fixedAction: seed.action,
    request: {
      analysis,
      selection: seed.goal
        ? {
            kind: "ACTION",
            id: `calibration-${seed.id}`,
            label: "Use this goal",
            intent: seed.goal,
          }
        : null,
    },
  };
}

// Raw product input only. Labels, review and semantic profiles are separate.
export const srs3eSemanticCalibrationRaw: readonly SemanticCalibrationRaw[] = [
  raw({
    id: "K01",
    family: "mural-photo-ack",
    action: "REWRITE_DRAFT",
    messages: [["OTHER", "Here is the mural photo I promised."]],
    draft: "photo came through, cheers",
  }),
  raw({
    id: "K02",
    family: "puppy-photo-reaction",
    action: "SUGGEST_REPLY",
    messages: [["OTHER", "Look at the puppy asleep in the basket."]],
    draft: null,
    goal: "Send a simple friendly reaction to the photo.",
  }),
  raw({
    id: "K03",
    family: "museum-door-color",
    action: "REWRITE_DRAFT",
    messages: [["OTHER", "What color is the museum side door?"]],
    draft: "its green",
  }),
  raw({
    id: "K04",
    family: "ferry-ticket-thread-done",
    action: "NO_REPLY_NEEDED",
    messages: [
      ["USER", "The ferry ticket is in your email."],
      ["OTHER", "Found it, thank you!"],
    ],
    draft: null,
  }),
  raw({
    id: "K05",
    family: "book-title-ack",
    action: "REWRITE_DRAFT",
    messages: [["OTHER", "The book is called The Glass Orchard."]],
    draft: "oh nice",
  }),
  raw({
    id: "K06",
    family: "tournament-score-thread-done",
    action: "NO_REPLY_NEEDED",
    messages: [
      ["OTHER", "The match ended 2–1."],
      ["USER", "Thanks for letting me know."],
      ["OTHER", "No problem!"],
    ],
    draft: null,
  }),
  raw({
    id: "K07",
    family: "settled-picnic-confirmation",
    action: "REWRITE_DRAFT",
    messages: [["OTHER", "The picnic is confirmed for noon; see you there."]],
    draft: "yep see u",
  }),
  raw({
    id: "K08",
    family: "birthday-greeting-only",
    action: "SUGGEST_REPLY",
    messages: [["OTHER", "It's my birthday today!"]],
    draft: null,
    goal: "Wish them a happy birthday.",
  }),
  raw({
    id: "K09",
    family: "paint-swatch-fact",
    action: "REWRITE_DRAFT",
    messages: [["OTHER", "Which paint swatch did you pick?"]],
    draft: "the orange one",
  }),
  raw({
    id: "K10",
    family: "finished-arrival-phrase",
    action: "COMPLETE_DRAFT",
    messages: [["OTHER", "I'll be by the fountain at six, as agreed."]],
    draft: "see you at",
    goal: "Finish the simple acknowledgment without proposing a new plan.",
  }),
  raw({
    id: "K11",
    family: "tea-offer-accept",
    action: "SUGGEST_REPLY",
    messages: [["OTHER", "Want a cup of tea while you're here?"]],
    draft: null,
    goal: "Accept the tea.",
  }),
  raw({
    id: "K12",
    family: "fabric-sample-received",
    action: "REWRITE_DRAFT",
    messages: [["OTHER", "I dropped the fabric sample at reception."]],
    draft: "received it",
  }),
  raw({
    id: "K13",
    family: "badge-bin-misplacement",
    action: "REWRITE_DRAFT",
    messages: [["OTHER", "The visitor badges aren't in the return bin."]],
    draft: "i put them in the supply drawer by mistake. moving them now",
  }),
  raw({
    id: "K14",
    family: "kept-dance-partner-waiting",
    action: "SUGGEST_REPLY",
    messages: [["OTHER", "I was waiting outside the hall while you finished your call."]],
    draft: null,
    goal: "Apologize for keeping them waiting outside.",
  }),
  raw({
    id: "K15",
    family: "estate-paperwork-overwhelm",
    action: "REWRITE_DRAFT",
    messages: [["OTHER", "I feel overwhelmed sorting through my father's estate paperwork."]],
    draft: "that sounds like a lot to carry",
  }),
  raw({
    id: "K16",
    family: "backup-lantern-known",
    action: "SUGGEST_REPLY",
    messages: [["OTHER", "I'm worried the campsite will be dark if the lamp breaks."]],
    draft: null,
    goal: "Remind them we already packed a spare lantern.",
  }),
  raw({
    id: "K17",
    family: "single-stall-duty-refusal",
    action: "REWRITE_DRAFT",
    messages: [["OTHER", "Could you cover my market stall this Saturday?"]],
    draft: "i cant cover it this saturday",
  }),
  raw({
    id: "K18",
    family: "repeated-evening-visit-limit",
    action: "REWRITE_DRAFT",
    messages: [["OTHER", "I know I've asked several times, but can I come by late again tonight?"]],
    draft: "no late visit tonight. please dont ask to come after 10 again",
  }),
  raw({
    id: "K19",
    family: "unanswered-archive-opening-hours",
    action: "REWRITE_DRAFT",
    messages: [
      ["USER", "Could you confirm Sunday's archive opening hours?"],
      ["OTHER", "I'll check with the caretaker."],
    ],
    draft: "any word from the caretaker on sunday hours?",
  }),
  raw({
    id: "K20",
    family: "first-request-blueprint-copy",
    action: "SUGGEST_REPLY",
    messages: [["OTHER", "The updated blueprint is on my laptop."]],
    draft: null,
    goal: "Ask them for the updated blueprint copy.",
  }),
  raw({
    id: "K21",
    family: "choose-choir-practice-slot",
    action: "REWRITE_DRAFT",
    messages: [["OTHER", "I can rehearse Wednesday or Friday."]],
    draft: "friday at 4?",
  }),
  raw({
    id: "K22",
    family: "tent-repair-uncertain-timing",
    action: "SUGGEST_REPLY",
    messages: [["OTHER", "When will the tent repair be finished?"]],
    draft: null,
    goal: "Say it may take until early next week, but that isn't confirmed.",
  }),
  raw({
    id: "K23",
    family: "two-willow-trailheads",
    action: "REWRITE_DRAFT",
    messages: [
      [
        "OTHER",
        "Meet me at the Willow trailhead; the map has one by the lake and another by the gate.",
      ],
    ],
    draft: "which willow trailhead did u mean?",
  }),
  raw({
    id: "K24",
    family: "archive-reboxing-count",
    action: "SUGGEST_REPLY",
    messages: [["OTHER", "How far along is the archive reboxing?"]],
    draft: null,
    goal: "Tell them 18 of the 24 boxes have been catalogued.",
  }),
];
