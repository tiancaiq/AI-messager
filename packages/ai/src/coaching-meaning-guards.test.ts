import type { CoachingDecision, CoachingRequest } from "@ai-message-coach/contracts";
import { skillSelectionEvaluationFixtures } from "@ai-message-coach/test-fixtures";
import { describe, expect, it } from "vitest";

import { evaluateCoachingDecisionGuards } from "./coaching-engine.js";
import { decideCoachingAction } from "./coaching-policy.js";

const statusFixture = skillSelectionEvaluationFixtures.find(({ id }) => id === "status-request");
if (!statusFixture) throw new Error("Missing B4 guard fixture");

function statusRequest(draft: string | null, other = "Any status update?"): CoachingRequest {
  return {
    ...statusFixture!.request,
    analysis: {
      ...statusFixture!.request.analysis,
      messages: [{ ...statusFixture!.request.analysis.messages[0]!, text: other }],
      draft: { text: draft, confidence: 0.96 },
    },
  };
}

function appreciationRequest(): CoachingRequest {
  return statusRequest("I appreciate your help with this.", "Thanks for checking on this for me.");
}

function guardRule(
  request: CoachingRequest,
  primary: string,
  alternatives: readonly string[] = [],
) {
  const policy = decideCoachingAction(request);
  const base = {
    userIntent: policy.userIntent,
    actionConfidence: policy.actionConfidence,
    ambiguity: policy.ambiguity,
  };
  let decision: CoachingDecision;
  if (policy.action === "REWRITE_DRAFT" || policy.action === "COMPLETE_DRAFT") {
    decision = {
      ...base,
      action: policy.action,
      primary,
      alternatives: alternatives.map((text) => ({ label: "Alternative", text })),
    };
  } else if (policy.action === "SUGGEST_REPLY") {
    decision = {
      ...base,
      action: policy.action,
      replies: [primary, ...alternatives].map((text) => ({ label: "Natural", text })),
    };
  } else {
    throw new Error(`Expected provider-generated action, got ${policy.action}`);
  }
  return evaluateCoachingDecisionGuards(decision, request, policy);
}

describe("B4.5 candidate-level meaning guards", () => {
  it.each([
    ["no-update", "I don't have an update yet.", "No update yet."],
    ["no-progress", "No progress yet.", "No progress yet."],
    ["checking", "I'm still checking.", "I'm checking."],
    ["follow-up", "I'll update you later.", "I'll update you when I know more."],
  ])("allows a source-supported %s claim", (_name, draft, output) => {
    expect(guardRule(statusRequest(draft), output)).toBeNull();
  });

  it.each([
    ["no-update", "No update yet."],
    ["no-progress", "No progress yet."],
    ["checking", "I'm still checking."],
    ["follow-up", "I'll update you later."],
  ])("rejects an unsupported %s claim", (_name, output) => {
    expect(guardRule(statusRequest(null), output)).toBe("STATUS_GROUNDING");
  });

  it("rejects an unsupported status claim in an alternative even when the primary is grounded", () => {
    expect(guardRule(statusRequest(null), "Thanks for checking in.", ["No update yet."])).toBe(
      "STATUS_GROUNDING",
    );
  });

  it("rejects a B4-style alternative that drops the user-owned tomorrow anchor", () => {
    const missed = skillSelectionEvaluationFixtures.find(({ id }) => id === "missed-commitment");
    if (!missed) throw new Error("Missing missed-commitment fixture");
    expect(
      guardRule(missed.request, "Sorry, testing is taking longer—probably tomorrow.", [
        "Sorry, I probably won't finish today. Testing is taking longer.",
      ]),
    ).toBe("FACTUAL_ANCHOR");
  });

  it("requires uncertainty in every alternative, not only the primary", () => {
    expect(
      guardRule(
        statusRequest("I might send it tomorrow.", "Can you send it?"),
        "I might send it tomorrow.",
        ["I'll send it tomorrow."],
      ),
    ).toBe("UNCERTAINTY_PRESERVATION");
  });

  it.each([
    ["Traditional Chinese", "進度呢？", "目前暫時沒有新的進度，確認後再回覆你。"],
    ["Korean", "진행 상황 부탁해요.", "현재 확인 중입니다. 아직 업데이트는 없습니다."],
  ])("rejects unsupported %s status/checking claims", (_name, other, output) => {
    expect(guardRule(statusRequest(null, other), output)).toBe("STATUS_GROUNDING");
  });

  it("allows a source-supported Traditional Chinese checking state", () => {
    expect(guardRule(statusRequest("我還在確認中。", "進度呢？"), "我還在確認中。")).toBeNull();
  });

  it.each([
    ["Traditional Chinese no-progress", "目前沒有新的進度。", "目前沒有新的進度。"],
    ["Korean checking", "현재 확인 중입니다.", "현재 확인 중입니다."],
    ["Korean follow-up", "확인 후 업데이트드리겠습니다.", "확인 후 업데이트드리겠습니다."],
  ])("allows source-supported %s", (_name, draft, output) => {
    expect(guardRule(statusRequest(draft), output)).toBeNull();
  });

  it("rejects unsupported prior thanks in an alternative, not just in a primary", () => {
    expect(
      guardRule(appreciationRequest(), "I really appreciate your help.", [
        "Thanks again for your help.",
      ]),
    ).toBe("PRIOR_APPRECIATION");
  });

  it("allows again when a prior user thank-you is visible", () => {
    const request: CoachingRequest = {
      ...appreciationRequest(),
      analysis: {
        ...appreciationRequest().analysis,
        messages: [
          {
            ...appreciationRequest().analysis.messages[0]!,
            id: "prior-user-thanks",
            speaker: "USER",
            order: 1,
            text: "Thanks for your help earlier.",
          },
          { ...appreciationRequest().analysis.messages[0]!, order: 2 },
        ],
      },
    };
    expect(
      guardRule(request, "I appreciate your help.", ["Thanks again for your help."]),
    ).toBeNull();
  });

  it.each([
    ["Could you send it?", "Please send it."],
    ["Can you help?", "Please help."],
  ])("does not mistake a polite request for uncertain self-action: %s", (draft, output) => {
    expect(guardRule(statusRequest(draft, "What do you need?"), output)).toBeNull();
  });

  it.each([
    ["I could send it.", "I'll send it."],
    ["I might send it.", "I'll send it."],
  ])("still preserves genuine user uncertainty: %s", (draft, output) => {
    expect(guardRule(statusRequest(draft, "Can you send it?"), output)).toBe(
      "UNCERTAINTY_PRESERVATION",
    );
  });

  it("rejects a Chinese refusal followed by contradictory acceptance", () => {
    const request: CoachingRequest = {
      ...statusRequest(null, "今晚要参加吗？"),
      selection: {
        kind: "ACTION",
        id: "decline",
        label: "Decline",
        intent: "我还是不参加了。",
      },
    };
    expect(guardRule(request, "我不参加，但我会参加。")).toBe("REFUSAL_PRESERVATION");
  });

  it("accepts the reviewed not-willing refusal without treating acceptance as a refusal", () => {
    const request = statusRequest(
      "I cannot keep doing this. Please stop asking. I don't want to apologize.",
      "You must do this now. This is unfair.",
    );
    expect(
      guardRule(
        request,
        "I can’t continue with this. Please stop asking me, and understand that I’m not willing to apologize.",
        [
          "I can’t keep doing this. Please stop asking. I’m not going to apologize.",
          "I’m not willing to continue with this or apologize. Please stop asking.",
        ],
      ),
    ).toBeNull();
    expect(guardRule(request, "I am willing to continue with this.")).toBe("REFUSAL_PRESERVATION");
  });

  it("treats the reviewed Chinese and English 3 PM anchors as equivalent, not arbitrary afternoon times", () => {
    const request = statusRequest(
      "Maybe 下午三點; I need to check first.",
      "明天 what time should we meet?",
    );
    expect(
      guardRule(request, "Maybe 下午三點；I need to check first.", [
        "Maybe 下午三點，我先確認一下。",
        "Maybe 3 PM? I need to check first.",
      ]),
    ).toBeNull();
    expect(guardRule(request, "Maybe 4 PM? I need to check first.")).toBe("FACTUAL_ANCHOR");
    expect(guardRule(statusRequest("Maybe 下午; I need to check first."), "Maybe 3 PM.")).toBe(
      "FACTUAL_ANCHOR",
    );
  });
});
