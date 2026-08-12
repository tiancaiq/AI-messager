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

  it("suggests a reply when no draft exists but the request is obvious", () => {
    expect(
      decideCoachingAction(
        request(analysis({ message: "Can you send me the file when you get home?" })),
      ).action,
    ).toBe("SUGGEST_REPLY");
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

  it("supports Traditional Chinese and other-language contexts without skills", () => {
    expect(
      decideCoachingAction(
        request(analysis({ message: "今晚要不要一起來？", language: "zh", script: "TRADITIONAL" })),
      ).action,
    ).toBe("SUGGEST_ACTIONS");
    expect(
      decideCoachingAction(request(analysis({ message: "자료를 보내 주세요", language: "ko" })))
        .action,
    ).toBe("SUGGEST_REPLY");
  });
});
