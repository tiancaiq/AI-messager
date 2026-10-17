import type { CoachingRequest, ConversationAnalysis } from "@ai-message-coach/contracts";
import { describe, expect, it } from "vitest";

import { decideCoachingAction } from "./coaching-policy.js";

function analysis(
  options: {
    message?: string;
    draft?: string | null;
    draftConfidence?: number;
    language?: "en" | "zh" | "ko";
    script?: "SIMPLIFIED" | "TRADITIONAL" | "MIXED" | "NOT_APPLICABLE";
    overallConfidence?: number;
    messages?: ConversationAnalysis["messages"];
  } = {},
): ConversationAnalysis {
  const language = options.language ?? "en";
  return {
    messages:
      options.messages ??
      (options.message
        ? [
            {
              id: "m1",
              order: 1,
              speaker: "OTHER",
              text: options.message,
              textConfidence: 0.95,
              speakerConfidence: 0.9,
            },
          ]
        : []),
    draft: { text: options.draft ?? null, confidence: options.draftConfidence ?? 0.95 },
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
      script: options.script ?? "NOT_APPLICABLE",
      codeSwitching: options.script === "MIXED",
      supportedForLanguageSpecificSkills: language === "en" || language === "zh",
      confidence: 0.95,
    },
    conversation: { summary: "Synthetic coaching fixture.", confidence: 0.9 },
    warnings: [],
    overallConfidence: options.overallConfidence ?? 0.9,
  };
}

const request = (value: ConversationAnalysis): CoachingRequest => ({
  analysis: value,
  selection: null,
  replyDecisionMode: "R1",
});

describe("draft-aware coaching policy", () => {
  it.each([
    ["sry testing taking longer probably tomorrow", "REWRITE_DRAFT"],
    ["I don't want to go", "REWRITE_DRAFT"],
    ["可能明天", "REWRITE_DRAFT"],
    ["ok，那我大概 3 点过去", "REWRITE_DRAFT"],
    ["I'm sorry I didn't...", "COMPLETE_DRAFT"],
    ["对不起我因为", "COMPLETE_DRAFT"],
  ])("classifies draft %s as %s", (draft, expected) => {
    expect(decideCoachingAction(request(analysis({ draft }))).action).toBe(expected);
  });

  it("offers choices when answering a request would commit unknown user ability", () => {
    const result = decideCoachingAction(
      request(analysis({ message: "Can you send me the file when you get home?" })),
    );
    expect(result.action).toBe("SUGGEST_ACTIONS");
    expect(result.actions?.map(({ id }) => id)).toEqual(["accept", "decline", "details"]);
  });

  it("suggests a brief general acknowledgment without assuming a wish to continue contact", () => {
    for (const message of [
      "I don't want to speak with you, we are done",
      "Please don't contact me again.",
      "我不想再和你說話了，別再聯絡我。",
    ]) {
      const result = decideCoachingAction(request(analysis({ message })));
      expect(result.action, message).toBe("SUGGEST_REPLY");
      expect(result.userIntent.value, message).toMatch(/brief, general expression of regret/iu);
      expect(result.noReply, message).toBeUndefined();
    }
  });

  it("treats a coach-entered direction as the explicit goal of a new reply", () => {
    const result = decideCoachingAction({
      ...request(analysis({ message: "I don't want to speak with you, we are done" })),
      userDirection: { kind: "NEW_REPLY_GOAL", text: "Ask what happened." },
    });
    expect(result.action).toBe("SUGGEST_REPLY");
    expect(result.userIntent).toEqual({ value: "Ask what happened.", confidence: 1 });
  });

  it("does not mistake a coach-entered new-reply direction for a visible draft", () => {
    const result = decideCoachingAction({
      ...request(analysis({ message: "What happened?", draft: "Thanks for asking." })),
      userDirection: { kind: "NEW_REPLY_GOAL", text: "Ask for more detail instead." },
    });
    expect(result.action).toBe("SUGGEST_REPLY");
    expect(result.userIntent.value).toBe("Ask for more detail instead.");
  });

  it("uses a specific acknowledgment goal for a simple incoming statement", () => {
    const result = decideCoachingAction(request(analysis({ message: "I submitted the review." })));
    expect(result.action).toBe("SUGGEST_REPLY");
    expect(result.userIntent.value).toMatch(/acknowledge/iu);
  });

  it("asks for the user's answer when an open question requires unknown personal facts", () => {
    const result = decideCoachingAction(request(analysis({ message: "What happened?" })));
    expect(result.action).toBe("ASK_CLARIFICATION");
    expect(result.ambiguity.material).toBe(true);
  });

  it("does not infer a reply goal from low-confidence incoming text or speaker ownership", () => {
    const observed = analysis({ message: "I don't want to speak with you." });
    const uncertain = {
      ...observed,
      messages: [{ ...observed.messages[0]!, speakerConfidence: 0.4 }],
    };
    expect(decideCoachingAction(request(uncertain)).action).toBe("ASK_CLARIFICATION");
  });

  it("does not reply to a stale incoming turn when the latest visible message is from the user", () => {
    const observed = analysis({ message: "Can you send me the file?" });
    const result = decideCoachingAction(
      request({
        ...observed,
        messages: [
          ...observed.messages,
          {
            id: "m2",
            order: 2,
            speaker: "USER",
            text: "I'll check and let you know.",
            textConfidence: 0.95,
            speakerConfidence: 0.95,
          },
        ],
      }),
    );
    expect(result.action).toBe("NO_REPLY_NEEDED");
    expect(result.noReply?.optionalReply).toBeNull();
  });

  it("asks before replying when the newest visible speaker is unknown", () => {
    const observed = analysis({ message: "I submitted the review." });
    expect(
      decideCoachingAction(
        request({
          ...observed,
          messages: [
            ...observed.messages,
            {
              id: "m2",
              order: 2,
              speaker: "UNKNOWN",
              text: "Can you send it?",
              textConfidence: 0.95,
              speakerConfidence: 0.2,
            },
          ],
        }),
      ).action,
    ).toBe("ASK_CLARIFICATION");
  });

  it("offers actions for materially different invitation choices", () => {
    const result = decideCoachingAction(request(analysis({ message: "Want to come tonight?" })));
    expect(result.action).toBe("SUGGEST_ACTIONS");
    expect(result.actions?.map((item) => item.id)).toEqual([
      "accept",
      "decline",
      "maybe",
      "details",
    ]);
  });

  it("asks one clarification for an isolated ambiguous acknowledgment", () => {
    const result = decideCoachingAction(request(analysis({ message: "Okay." })));
    expect(result.action).toBe("ASK_CLARIFICATION");
    expect(result.ambiguity.material).toBe(true);
    expect(result.clarification?.options.length).toBeGreaterThan(1);
  });

  it("does not ask merely because relationship-like context is uncertain", () => {
    expect(
      decideCoachingAction(
        request(analysis({ draft: "I can't finish today because testing is still failing." })),
      ).action,
    ).toBe("REWRITE_DRAFT");
  });

  it("asks when draft extraction is too uncertain to preserve intent", () => {
    expect(
      decideCoachingAction(request(analysis({ draft: "maybe no", draftConfidence: 0.3 }))).action,
    ).toBe("ASK_CLARIFICATION");
  });

  it("allows a naturally closed conversation to end", () => {
    expect(decideCoachingAction(request(analysis({ message: "Thanks, looks good." }))).action).toBe(
      "NO_REPLY_NEEDED",
    );
  });

  it("continues an action or clarification from the existing structured context", () => {
    for (const selection of [
      {
        kind: "ACTION" as const,
        id: "decline",
        label: "Decline",
        intent: "Decline without inventing a reason.",
      },
      { kind: "CLARIFICATION" as const, answer: "Ask when the file is needed." },
    ]) {
      const result = decideCoachingAction({
        analysis: analysis({ message: "Want to come tonight?" }),
        selection,
      });
      expect(result.action).toBe("SUGGEST_REPLY");
      expect(result.userIntent.value).toContain(
        selection.kind === "ACTION" ? "Decline" : "Ask when",
      );
    }
  });

  it("supports Traditional Chinese and conservatively clarifies unsupported languages", () => {
    expect(
      decideCoachingAction(
        request(analysis({ message: "今晚要不要一起來？", language: "zh", script: "TRADITIONAL" })),
      ).action,
    ).toBe("SUGGEST_ACTIONS");
    expect(
      decideCoachingAction(request(analysis({ message: "자료를 보내 주세요", language: "ko" })))
        .action,
    ).toBe("ASK_CLARIFICATION");
  });
});
