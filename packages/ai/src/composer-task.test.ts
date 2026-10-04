import type {
  CoachingDecision,
  CoachingRequest,
  CommunicationGuidance,
} from "@ai-message-coach/contracts";
import { skillSelectionEvaluationFixtures } from "@ai-message-coach/test-fixtures";
import { describe, expect, it, vi } from "vitest";

import { evaluateCoachingDecisionGuards } from "./coaching-engine.js";
import { decideCoachingAction } from "./coaching-policy.js";
import {
  buildComposerTask,
  ComposerTaskSchema,
  detectComposerTaskViolation,
} from "./composer-task.js";
import { buildOpenAiCoachingRequest, OpenAiCoachingAdapter } from "./openai-coaching-adapter.js";

const statusFixture = skillSelectionEvaluationFixtures.find(({ id }) => id === "status-request");
if (!statusFixture) throw new Error("Missing synthetic status fixture");
const guidance: CommunicationGuidance = {
  principles: ["State only the known status clearly."],
  avoid: ["Do not invent progress or promises."],
};

function request(
  other: string,
  draft: string | null = null,
  userEvidence?: string,
): CoachingRequest {
  const otherMessage = {
    ...statusFixture!.request.analysis.messages[0]!,
    id: "other",
    order: userEvidence === undefined ? 1 : 2,
    speaker: "OTHER" as const,
    text: other,
  };
  return {
    ...statusFixture!.request,
    analysis: {
      ...statusFixture!.request.analysis,
      messages:
        userEvidence === undefined
          ? [otherMessage]
          : [
              { ...otherMessage, id: "user", order: 1, speaker: "USER", text: userEvidence },
              otherMessage,
            ],
      draft: { text: draft, confidence: 0.96 },
    },
  };
}

function guard(
  input: CoachingRequest,
  first: string,
  alternatives: string[] = [],
): ReturnType<typeof evaluateCoachingDecisionGuards> {
  const policy = decideCoachingAction(input);
  const base = {
    userIntent: policy.userIntent,
    actionConfidence: policy.actionConfidence,
    ambiguity: policy.ambiguity,
  };
  const decision: CoachingDecision =
    policy.action === "REWRITE_DRAFT" || policy.action === "COMPLETE_DRAFT"
      ? {
          ...base,
          action: policy.action,
          primary: first,
          alternatives: alternatives.map((text) => ({ label: "Alternative", text })),
        }
      : {
          ...base,
          action: "SUGGEST_REPLY",
          replies: [first, ...alternatives].map((text) => ({ label: "Natural", text })),
        };
  return evaluateCoachingDecisionGuards(decision, input, policy);
}

describe("B4.6 Composer task and candidate grounding", () => {
  it("marks unknown status as a reply-scope question without changing the Agent action", () => {
    const input = request("Any status update?");
    const task = buildComposerTask(input, decideCoachingAction(input), guidance);
    expect(task.fixedAction).toBe("SUGGEST_REPLY");
    expect(task.statusReplyMode).toBe("ASK_SCOPE_ONLY");
    expect(task.mustNotInvent).toContain("NO_UPDATE_OR_PROGRESS");
    expect(task.mustNotInvent).toContain("USER_INFORMATION_STATE");
    expect(task.coreCommunicationGuidance).toEqual(guidance);
    expect(guard(input, "Which project's status do you mean?")).toBeNull();
  });

  it("rejects an unsupported no-update statement", () => {
    expect(guard(request("Any status update?"), "No update yet.")).toBe("STATUS_GROUNDING");
  });

  it("allows a user-owned no-update fact", () => {
    const input = request("Any status update?", null, "No update yet.");
    expect(buildComposerTask(input, decideCoachingAction(input), guidance).statusReplyMode).toBe(
      "NONE",
    );
    expect(guard(input, "No update yet.")).toBeNull();
  });

  it("rejects an unsupported checking assertion", () => {
    expect(guard(request("Any status update?"), "I'm still checking.")).toBe("STATUS_GROUNDING");
  });

  it("allows a user-owned checking state", () => {
    expect(
      guard(request("Any status update?", null, "I'm still checking."), "I'm still checking."),
    ).toBeNull();
  });

  it("rejects an unsupported follow-up promise", () => {
    expect(guard(request("Any status update?"), "I'll update you later.")).toBe("STATUS_GROUNDING");
  });

  it("allows a user-owned follow-up promise", () => {
    expect(
      guard(
        request("Any status update?", null, "I'll update you later."),
        "I'll update you later.",
      ),
    ).toBeNull();
  });

  it("rejects unsupported user information-state claims even when the lexical status guard passes", () => {
    expect(guard(request("Any status update?"), "I don't have enough context to answer.")).toBe(
      "UNSUPPORTED_INFORMATION_STATE",
    );
  });

  it("rejects an invented indecision state but preserves an explicitly tentative draft", () => {
    expect(guard(request("What time works for you tomorrow?"), "I'm not sure yet.")).toBe(
      "UNSUPPORTED_INFORMATION_STATE",
    );
    expect(
      guard(
        request("What time works for you tomorrow?", "Maybe tomorrow; I need to check first."),
        "I need to check first; maybe tomorrow.",
      ),
    ).toBeNull();
  });

  it("rejects recipient request becoming an English send commitment", () => {
    expect(guard(request("Can you send the file?"), "I'll send the file shortly.")).toBe(
      "UNSUPPORTED_COMMITMENT",
    );
    expect(guard(request("Can you send the file?"), "I can send the file.")).toBe(
      "UNSUPPORTED_COMMITMENT",
    );
  });

  it("rejects recipient request becoming a Korean send commitment", () => {
    expect(guard(request("자료를 보내 주세요"), "네, 자료 보내드리겠습니다.")).toBe(
      "UNSUPPORTED_COMMITMENT",
    );
  });

  it("allows an explicit user-owned send commitment", () => {
    expect(
      guard(request("Can you send the file?", null, "I'll send the file."), "I'll send the file."),
    ).toBeNull();
  });

  it("distinguishes a review request from a user review commitment", () => {
    expect(guard(request("Could you review this?"), "I'll review this.")).toBe(
      "UNSUPPORTED_COMMITMENT",
    );
  });

  it("allows review capability after the user explicitly accepted that request", () => {
    const input = request("Can you review this?", "Yes I can");
    const task = buildComposerTask(input, decideCoachingAction(input), guidance);
    expect(task.mustPreserve).toContainEqual(
      expect.objectContaining({ concept: "ACCEPTANCE", value: "accepted review request" }),
    );
    expect(guard(input, "Yes, I can review it.")).toBeNull();
  });

  it("does not turn a user-owned polite Could you request into tentative self-action", () => {
    const input = request("What do you need?", "Could you help me check this today?");
    const task = buildComposerTask(input, decideCoachingAction(input), guidance);
    expect(task.mustPreserve.some(({ concept }) => concept === "REQUEST")).toBe(true);
    expect(task.mustPreserve.some(({ concept }) => concept === "UNCERTAINTY")).toBe(false);
  });

  it("distinguishes an availability question from user availability", () => {
    expect(guard(request("What time works for you tomorrow?"), "I'm free tomorrow.")).toBe(
      "UNSUPPORTED_COMMITMENT",
    );
  });

  it("preserves a tentative tomorrow anchor in every candidate", () => {
    const input = request("Can you finish today?", "I'll probably finish tomorrow.");
    const task = buildComposerTask(input, decideCoachingAction(input), guidance);
    expect(task.mustPreserve).toContainEqual(
      expect.objectContaining({ concept: "TIMING", value: "tomorrow", certainty: "TENTATIVE" }),
    );
    expect(guard(input, "I'll probably finish tomorrow.", ["I'll finish tomorrow."])).toBe(
      "UNCERTAINTY_PRESERVATION",
    );
    expect(guard(input, "I'll probably finish tomorrow.", ["Probably tomorrow."])).toBeNull();
  });

  it("retains approximate bilingual clock time without allowing an invented exact time", () => {
    const input = request(
      "明天 what time should we meet?",
      "Maybe 下午三點; I need to check first.",
    );
    expect(guard(input, "Maybe 3 PM? I need to check first.")).toBeNull();
    expect(guard(input, "Maybe 4 PM? I need to check first.")).toBe("FACTUAL_ANCHOR");
  });

  it("preserves a direct refusal", () => {
    expect(
      guard(request("Could you take this on?", "I can't take this on."), "I can't take this on."),
    ).toBeNull();
  });

  // Human-reviewed B4.6 blocker: a valid primary cannot rescue an alternative
  // that turns an unqualified pressure boundary into a temporary pause.
  for (const [label, draft, alternative] of [
    ["先", "我不能再這樣做了，請不要再催。", "我不能再這樣做了，請先不要再催。"],
    ["暫時", "我不能再這樣做了，請不要再催。", "我不能再這樣做了，請暫時不要再催。"],
    [
      "for now",
      "I can't keep doing this. Please stop pressuring me.",
      "I can't keep doing this. Please stop pressuring me for now.",
    ],
    [
      "at the moment",
      "I can't keep doing this. Please stop pressuring me.",
      "I can't keep doing this. Please stop pressuring me at the moment.",
    ],
  ] as const) {
    it(`rejects an unsupported ${label} qualifier in a boundary alternative`, () => {
      const input = request("Please do this now.", draft);
      expect(guard(input, draft, [alternative])).toBe("BOUNDARY_TEMPORAL_WEAKENING");
    });
  }

  it("propagates a source-qualified durable boundary anchor into the provider task", () => {
    const input = request("現在就要，別再拖了。", "我不能再這樣做了，請不要再催。");
    const policy = decideCoachingAction(input);
    const task = buildComposerTask(input, policy, guidance);
    expect(task.mustPreserve).toContainEqual(
      expect.objectContaining({
        concept: "BOUNDARY_SCOPE",
        value: "STOP_PRESSURE:DURABLE_OR_UNQUALIFIED",
        owner: "USER",
        sourceRef: "DRAFT",
      }),
    );
    const payload = buildOpenAiCoachingRequest(input, policy, guidance, "fixture-model", task);
    const text = (payload.input as { content: { text: string }[] }[])[0]!.content[0]!.text;
    expect(JSON.parse(text).composerTask.mustPreserve).toContainEqual(
      expect.objectContaining({
        concept: "BOUNDARY_SCOPE",
        value: "STOP_PRESSURE:DURABLE_OR_UNQUALIFIED",
      }),
    );
  });

  it("rejects the exact human-rejected B4.6 alternative despite its valid primary", () => {
    const input = request("現在就要，別再拖了。", "我不能再這樣做了，請不要再催。");
    expect(
      guard(input, "我沒辦法再這樣做下去了，請不要再催了。", [
        "這件事我沒辦法再繼續了，請先不要再催我。",
      ]),
    ).toBe("BOUNDARY_TEMPORAL_WEAKENING");
  });

  it("rejects Simplified Chinese durable-to-temporary boundary scope", () => {
    const input = request("现在就要。", "我不能再这样做了，请不要再催我。");
    expect(
      guard(input, "我不能再这样做了，请不要再催我。", ["我不能再这样做了，请暂时不要再催我。"]),
    ).toBe("BOUNDARY_TEMPORAL_WEAKENING");
  });

  it("rejects English durable-to-temporary scope but allows an equivalent unqualified paraphrase", () => {
    const input = request("Please answer again.", "Please stop asking me about this.");
    expect(guard(input, "Please don't keep asking me about this.")).toBeNull();
    expect(guard(input, "For now, please stop asking me about this.")).toBe(
      "BOUNDARY_TEMPORAL_WEAKENING",
    );
    expect(guard(input, "Please stop asking me about this for the time being.")).toBe(
      "BOUNDARY_TEMPORAL_WEAKENING",
    );
  });

  it("preserves a source-supported temporary English work limit without strengthening it", () => {
    const input = request("Can you take on more work?", "For now, I can't take on more work.");
    const task = buildComposerTask(input, decideCoachingAction(input), guidance);
    expect(task.mustPreserve).toContainEqual(
      expect.objectContaining({ concept: "BOUNDARY_SCOPE", value: "CAPACITY_LIMIT:TEMPORARY" }),
    );
    expect(guard(input, "I can't take on more work at the moment.")).toBeNull();
    expect(guard(input, "I can't take on more work.")).toBe("BOUNDARY_TEMPORAL_STRENGTHENING");
    expect(
      guard(input, "For now, I can't take on more work.", ["I can't take on more work."]),
    ).toBe("BOUNDARY_TEMPORAL_STRENGTHENING");
  });

  it("preserves a source-supported temporary Chinese pressure boundary", () => {
    const input = request("現在可以嗎？", "請先不要催我。");
    expect(guard(input, "暫時請不要催我。")).toBeNull();
    expect(guard(input, "請不要催我。")).toBe("BOUNDARY_TEMPORAL_STRENGTHENING");
  });

  it("does not treat an unrelated tomorrow fact as temporary pressure scope", () => {
    const input = request(
      "Can you do this tomorrow?",
      "I can't do this tomorrow. Please stop pressuring me.",
    );
    expect(guard(input, "I can't do this tomorrow. Please don't keep pushing me.")).toBeNull();
  });

  it("does not treat Chinese 先 used for sequence as a boundary qualifier", () => {
    const input = request("你要先做什麼？", "先確認時間，再回覆他。");
    const task = buildComposerTask(input, decideCoachingAction(input), guidance);
    expect(task.mustPreserve.some(({ concept }) => concept === "BOUNDARY_SCOPE")).toBe(false);
    expect(guard(input, "先確認時間，再回覆他。")).toBeNull();
  });

  it("does not let empathy and de-escalation make an extra-work limit temporary", () => {
    const input = request(
      "This is urgent. Please take on more work.",
      "I understand this is urgent, but I can't keep taking on extra work.",
    );
    expect(
      guard(input, "I hear this is urgent, but I can't keep taking on extra work."),
    ).toBeNull();
    expect(guard(input, "I hear this is urgent, but for now I can't take on more work.")).toBe(
      "BOUNDARY_TEMPORAL_WEAKENING",
    );
  });

  it("rejects temporal scope invented for a recognized but uncertain boundary", () => {
    const input = request("Can you continue?", "Maybe I can't keep doing this.");
    const task = buildComposerTask(input, decideCoachingAction(input), guidance);
    expect(task.mustPreserve).toContainEqual(
      expect.objectContaining({ concept: "BOUNDARY_SCOPE", value: "CAPACITY_LIMIT:UNKNOWN" }),
    );
    expect(guard(input, "Maybe, for now I can't keep doing this.")).toBe(
      "BOUNDARY_TEMPORAL_WEAKENING",
    );
  });

  it("rejects malformed boundary-scope anchors before provider serialization", () => {
    const input = request("Please stop.", "Please stop pressuring me.");
    const task = buildComposerTask(input, decideCoachingAction(input), guidance);
    expect(() =>
      ComposerTaskSchema.parse({
        ...task,
        mustPreserve: task.mustPreserve.map((anchor) =>
          anchor.concept === "BOUNDARY_SCOPE"
            ? { ...anchor, value: "STOP_PRESSURE:PERMANENT" }
            : anchor,
        ),
      }),
    ).toThrow();
  });

  it("accepts a conventional pass refusal and rejects an acceptance reversal", () => {
    const input: CoachingRequest = {
      ...request("Want to come tonight?"),
      selection: { kind: "ACTION", id: "decline", label: "Decline", intent: "I'll pass." },
    };
    expect(guard(input, "I'll pass.")).toBeNull();
    expect(guard(input, "Sure, I'll join.")).toBe("REFUSAL_PRESERVATION");
  });

  it("rejects unsupported prior thanks in an alternative", () => {
    expect(
      guard(
        request("Thanks for checking on this.", "I appreciate your help."),
        "I appreciate your help.",
        ["Thanks again for your help."],
      ),
    ).toBe("PRIOR_APPRECIATION");
  });

  it("rejects unsupported emotion attributed to the other person", () => {
    expect(guard(request("Can you help?"), "I know you're upset. Can you tell me more?")).toBe(
      "UNSUPPORTED_EMOTION",
    );
  });

  it("allows an explicitly stated other-person emotion", () => {
    expect(guard(request("I'm upset about the delay."), "I understand you're upset.")).toBeNull();
  });

  it("keeps a zero-skill Agent tone instruction separate from Skill guidance in the payload", () => {
    const input = request("What do you think?", "Thanks for your help.");
    const policy = decideCoachingAction(input);
    const empty: CommunicationGuidance = { principles: [], avoid: [] };
    const task = buildComposerTask(input, policy, empty, { instruction: "Make this nicer." });
    const payload = buildOpenAiCoachingRequest(input, policy, empty, "fixture-model", task);
    const text = (payload.input as { content: { text: string }[] }[])[0]!.content[0]!.text;
    const body = JSON.parse(text) as { composerTask: typeof task };
    expect(body.composerTask.optionalStyle.agentInstruction).toEqual({
      value: "Make this nicer.",
      provenance: "USER_SUPPLIED",
    });
    expect(body.composerTask.coreCommunicationGuidance).toEqual(empty);
    expect(text).not.toContain("skillId");
  });

  it("fails an entire package when only an alternative invents a commitment", () => {
    expect(
      guard(request("Can you send the file?"), "Which file do you mean?", [
        "I'll send the file now.",
      ]),
    ).toBe("UNSUPPORTED_COMMITMENT");
  });

  it("rejects an internally contradictory task before provider serialization", () => {
    const input = request("Can you send the file?", "I'll send the file.");
    const policy = decideCoachingAction(input);
    const task = buildComposerTask(input, policy, guidance);
    expect(task.mustPreserve).toContainEqual(
      expect.objectContaining({ concept: "COMMITMENT", value: "SEND_COMMITMENT" }),
    );
    expect(() =>
      ComposerTaskSchema.parse({
        ...task,
        mustNotInvent: [...task.mustNotInvent, "SEND_COMMITMENT"],
      }),
    ).toThrow();
    expect(() =>
      buildOpenAiCoachingRequest(input, policy, guidance, "fixture-model", {
        ...task,
        fixedAction: "NO_REPLY_NEEDED",
      }),
    ).toThrow("Composer task does not match");
  });

  it("does not invoke the provider when a caller supplies a mismatched task", async () => {
    const input = request("Can you send the file?");
    const policy = decideCoachingAction(input);
    const task = buildComposerTask(input, policy, guidance);
    const fetchImplementation = vi.fn<typeof fetch>();
    const adapter = new OpenAiCoachingAdapter({ apiKey: "synthetic-key", fetchImplementation });
    await expect(
      adapter.generateCoachingDecision(input, policy, guidance, {
        ...task,
        fixedAction: "NO_REPLY_NEEDED",
      }),
    ).resolves.toMatchObject({ ok: false });
    expect(fetchImplementation).not.toHaveBeenCalled();
  });

  it("keeps all-candidate status questions within the fixed reply action", () => {
    const input = request("Any update?");
    expect(
      guard(input, "Which update do you mean?", ["Which part are you asking about?"]),
    ).toBeNull();
    expect(guard(input, "Which update do you mean?", ["I need more context to answer."])).toBe(
      "UNSUPPORTED_INFORMATION_STATE",
    );
    const task = buildComposerTask(input, decideCoachingAction(input), guidance);
    expect(detectComposerTaskViolation("Which update do you mean?", task)).toBeNull();
  });
});
