import type {
  AgentAction,
  CoachingRequest,
  ConversationAnalysis,
  SuggestedAction,
} from "@ai-message-coach/contracts";

export interface CoachingPolicyDecision {
  action: AgentAction;
  userIntent: { value: string | null; confidence: number };
  actionConfidence: number;
  ambiguity: { material: boolean; reason: string | null };
  actions?: SuggestedAction[];
  clarification?: { question: string; options: string[] };
  noReply?: { reason: string; optionalReply: string | null };
}

const incompleteEnding =
  /(?:\.\.\.|…|\b(?:because|but|so|if|when|that|didn't|did not|can't|cannot|won't|will not|sorry I)|对不起我|因為|因为|但是|所以)\s*$/iu;
const invitation =
  /\b(?:want to|would you like to|can you come|are you free|join us|come tonight)\b|(?:要不要|想不想|有空嗎|有空吗|一起來|一起来)/iu;
const closedConversation =
  /^(?:thanks(?:,? looks good)?[!.]*|thank you[!.]*|got it[!.]*|sounds good[!.]*|收到[，,！!。]*|谢谢[！!。]*|謝謝[！!。]*)$/iu;
const ambiguousAcknowledgment = /^(?:ok(?:ay)?|k|好|好的|嗯|收到)[.!。]*$/iu;
const noContactBoundary =
  /\b(?:i (?:do not|don['’]t) want to (?:speak|talk) (?:to|with) you|(?:please )?(?:do not|don['’]t) contact me again|(?:leave me alone|stop (?:contacting|messaging|texting) me))\b|(?:不想再?和你(?:说话|說話)|別再聯絡我|别再联系我|不要再(?:聯絡|联系|找)我)/iu;
const capabilityRequest =
  /\b(?:can|could|would) you\b|(?:你|您)(?:能|可以|可否).{0,24}[?？]|(?:能否|可否|可以)(?:请|請)?你.{0,24}[?？]/iu;
const openQuestion =
  /^(?:who|what|when|where|why|how)\b|^(?:什么|什麼|為什麼|为什么|怎么|怎麼|何时|何時|哪里|哪裡)/iu;

function lastOtherMessage(
  analysis: ConversationAnalysis,
): ConversationAnalysis["messages"][number] | undefined {
  return [...analysis.messages].reverse().find((message) => message.speaker === "OTHER");
}

export function hasReliableNoContactBoundary(analysis: ConversationAnalysis): boolean {
  const message = lastOtherMessage(analysis);
  return (
    message !== undefined &&
    message.speakerConfidence >= 0.65 &&
    message.textConfidence >= 0.65 &&
    noContactBoundary.test(message.text)
  );
}

function chineseActions(analysis: ConversationAnalysis): SuggestedAction[] {
  const traditional = analysis.language.script === "TRADITIONAL";
  return [
    { id: "accept", label: traditional ? "接受" : "接受", intent: "Accept the invitation." },
    {
      id: "decline",
      label: traditional ? "婉拒" : "婉拒",
      intent: "Decline without inventing a reason.",
    },
    {
      id: "maybe",
      label: traditional ? "還不確定" : "还不确定",
      intent: "Say the decision is not certain yet.",
    },
    {
      id: "details",
      label: traditional ? "詢問詳情" : "询问详情",
      intent: "Ask for relevant details.",
    },
  ];
}

export function decideCoachingAction(request: CoachingRequest): CoachingPolicyDecision {
  const { analysis, selection } = request;
  const replyDecisionR1 = request.replyDecisionMode === "R1" || request.userDirection != null;

  if (selection !== null) {
    if (
      replyDecisionR1 &&
      selection.kind === "CLARIFICATION" &&
      /^no reply$/iu.test(selection.answer.trim())
    ) {
      return {
        action: "NO_REPLY_NEEDED",
        userIntent: { value: "Do not send a reply.", confidence: 1 },
        actionConfidence: 1,
        ambiguity: { material: false, reason: null },
        noReply: { reason: "You chose not to reply.", optionalReply: null },
      };
    }
    const selectedIntent = selection.kind === "ACTION" ? selection.intent : selection.answer;
    return {
      action: "SUGGEST_REPLY",
      userIntent: { value: selectedIntent, confidence: 1 },
      actionConfidence: 1,
      ambiguity: { material: false, reason: null },
    };
  }

  if (request.userDirection != null) {
    return {
      action: "SUGGEST_REPLY",
      userIntent: { value: request.userDirection.text, confidence: 1 },
      actionConfidence: 1,
      ambiguity: { material: false, reason: null },
    };
  }

  const draft = analysis.draft.text?.trim();

  if (draft) {
    if (analysis.draft.confidence < 0.45) {
      return {
        action: "ASK_CLARIFICATION",
        userIntent: { value: null, confidence: analysis.draft.confidence },
        actionConfidence: 0.58,
        ambiguity: {
          material: true,
          reason: "The visible draft is too uncertain to preserve its meaning safely.",
        },
        clarification: {
          question: "Should I improve the visible draft, or help with a new reply?",
          options: ["Improve the draft", "Write a new reply"],
        },
      };
    }

    const incomplete = incompleteEnding.test(draft);
    return {
      action: incomplete ? "COMPLETE_DRAFT" : "REWRITE_DRAFT",
      userIntent: {
        value: incomplete
          ? "Complete the visible draft without adding facts."
          : "Improve the visible draft while preserving its meaning.",
        confidence: analysis.draft.confidence,
      },
      actionConfidence: incomplete ? 0.88 : 0.97,
      ambiguity: { material: false, reason: null },
    };
  }

  if (replyDecisionR1 && analysis.messages.length > 0) {
    const newestVisibleMessage = analysis.messages.reduce((newest, message) =>
      message.order > newest.order ? message : newest,
    );
    if (newestVisibleMessage.speaker === "USER" && newestVisibleMessage.speakerConfidence >= 0.65) {
      return {
        action: "NO_REPLY_NEEDED",
        userIntent: { value: "Wait for a new incoming message.", confidence: 0.9 },
        actionConfidence: 0.9,
        ambiguity: { material: false, reason: null },
        noReply: { reason: "Your message is the latest visible turn.", optionalReply: null },
      };
    }
    if (newestVisibleMessage.speaker !== "OTHER") {
      return {
        action: "ASK_CLARIFICATION",
        userIntent: { value: null, confidence: 0.2 },
        actionConfidence: 0.8,
        ambiguity: { material: true, reason: "The latest visible speaker is uncertain." },
        clarification: {
          question: "What would you like to communicate?",
          options: ["Acknowledge", "Ask a follow-up", "No reply"],
        },
      };
    }
  }

  const latestMessage = lastOtherMessage(analysis);
  const latest = latestMessage?.text.trim();

  if (latest === undefined || (analysis.overallConfidence < 0.45 && analysis.messages.length < 2)) {
    return {
      action: "ASK_CLARIFICATION",
      userIntent: { value: null, confidence: 0.2 },
      actionConfidence: 0.72,
      ambiguity: {
        material: true,
        reason: "There is not enough reliable visible context to choose a response.",
      },
      clarification: {
        question: "What would you like to communicate?",
        options: ["Acknowledge", "Ask a follow-up", "Share an update"],
      },
    };
  }

  if (
    replyDecisionR1 &&
    latestMessage !== undefined &&
    (latestMessage.speakerConfidence < 0.65 || latestMessage.textConfidence < 0.65)
  ) {
    return {
      action: "ASK_CLARIFICATION",
      userIntent: { value: null, confidence: 0.2 },
      actionConfidence: 0.8,
      ambiguity: {
        material: true,
        reason:
          "The latest incoming message or its speaker is not reliable enough to infer a reply goal.",
      },
      clarification: {
        question: "What would you like to communicate?",
        options: ["Acknowledge", "Ask a follow-up", "No reply"],
      },
    };
  }

  if (closedConversation.test(latest)) {
    return {
      action: "NO_REPLY_NEEDED",
      userIntent: { value: "Let the conversation close naturally.", confidence: 0.92 },
      actionConfidence: 0.94,
      ambiguity: { material: false, reason: null },
      noReply: {
        reason: "The other person's message closes the conversation naturally.",
        optionalReply: analysis.language.primary === "zh" ? "谢谢！" : "Thanks!",
      },
    };
  }

  if (replyDecisionR1 && hasReliableNoContactBoundary(analysis)) {
    return {
      action: "SUGGEST_REPLY",
      userIntent: {
        value:
          "Offer one brief, general expression of regret (such as 'I'm sorry to hear that') and acknowledge the other person's boundary without accepting blame, asking a question, or seeking further contact.",
        confidence: 0.85,
      },
      actionConfidence: 0.85,
      ambiguity: { material: false, reason: null },
    };
  }

  if (invitation.test(latest)) {
    const actions =
      analysis.language.primary === "zh"
        ? chineseActions(analysis)
        : [
            { id: "accept", label: "Accept", intent: "Accept the invitation." },
            { id: "decline", label: "Decline", intent: "Decline without inventing a reason." },
            { id: "maybe", label: "Maybe", intent: "Say the decision is not certain yet." },
            { id: "details", label: "Ask for details", intent: "Ask for relevant details." },
          ];
    return {
      action: "SUGGEST_ACTIONS",
      userIntent: { value: null, confidence: 0.4 },
      actionConfidence: 0.94,
      ambiguity: {
        material: true,
        reason: "Accepting and declining would produce materially different replies.",
      },
      actions,
    };
  }

  if (ambiguousAcknowledgment.test(latest) && analysis.messages.length < 2) {
    return {
      action: "ASK_CLARIFICATION",
      userIntent: { value: null, confidence: 0.2 },
      actionConfidence: 0.88,
      ambiguity: {
        material: true,
        reason: "The acknowledgment alone does not reveal what response would help.",
      },
      clarification: {
        question: "What would you like to do next?",
        options: ["Acknowledge", "Ask a follow-up", "No reply"],
      },
    };
  }

  if (replyDecisionR1 && capabilityRequest.test(latest)) {
    return {
      action: "SUGGEST_ACTIONS",
      userIntent: { value: null, confidence: 0.35 },
      actionConfidence: 0.9,
      ambiguity: {
        material: true,
        reason: "Accepting or declining the request would make different commitments.",
      },
      actions: [
        { id: "accept", label: "Accept", intent: "Accept the request without inventing details." },
        {
          id: "decline",
          label: "Decline",
          intent: "Decline the request without inventing a reason.",
        },
        { id: "details", label: "Ask details", intent: "Ask for the details needed to decide." },
      ],
    };
  }

  if (replyDecisionR1 && openQuestion.test(latest)) {
    return {
      action: "ASK_CLARIFICATION",
      userIntent: { value: null, confidence: 0.25 },
      actionConfidence: 0.86,
      ambiguity: {
        material: true,
        reason: "The visible question does not establish the user's answer.",
      },
      clarification: {
        question: "How would you like to respond?",
        options: ["Ask which part they mean", "Acknowledge the question", "No reply"],
      },
    };
  }

  if (replyDecisionR1 && !analysis.language.supportedForLanguageSpecificSkills) {
    return {
      action: "ASK_CLARIFICATION",
      userIntent: { value: null, confidence: 0.2 },
      actionConfidence: 0.8,
      ambiguity: {
        material: true,
        reason: "This deterministic reply decision cannot establish the reply goal reliably.",
      },
      clarification: {
        question: "What would you like to communicate?",
        options: ["Acknowledge", "Ask a follow-up", "No reply"],
      },
    };
  }

  return {
    action: "SUGGEST_REPLY",
    userIntent: {
      value: replyDecisionR1
        ? "Acknowledge the latest visible message without adding facts or commitments."
        : "Respond naturally to the latest visible message.",
      confidence: Math.max(0.55, analysis.overallConfidence),
    },
    actionConfidence: Math.max(0.72, analysis.overallConfidence),
    ambiguity: { material: false, reason: null },
  };
}
