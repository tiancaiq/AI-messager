import type { CoachingRequest } from "@ai-message-coach/contracts";
import { describe, expect, it } from "vitest";

import { resolveDraftInstruction, shouldInterpretDraft } from "./draft-instruction.js";

const base: CoachingRequest = {
  analysis: {
    messages: [
      {
        id: "m1",
        order: 1,
        speaker: "OTHER",
        text: "Can you finish this?",
        textConfidence: 0.99,
        speakerConfidence: 0.99,
      },
    ],
    draft: { text: "no I can't finish write polite", confidence: 0.98 },
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
    conversation: { summary: "A request is visible.", confidence: 0.9 },
    warnings: [],
    overallConfidence: 0.95,
  },
  selection: null,
  replyDecisionMode: "R1",
};

describe("conditional inline draft interpretation", () => {
  it("prefilters only R1 reliable suspected drafts, not ordinary or historical drafts", () => {
    expect(shouldInterpretDraft(base)).toBe(true);
    expect(shouldInterpretDraft({ ...base, replyDecisionMode: undefined })).toBe(false);
    expect(
      shouldInterpretDraft({
        ...base,
        analysis: { ...base.analysis, draft: { text: "I can't finish this.", confidence: 0.98 } },
      }),
    ).toBe(false);
    expect(
      shouldInterpretDraft({
        ...base,
        analysis: { ...base.analysis, draft: { ...base.analysis.draft, confidence: 0.4 } },
      }),
    ).toBe(false);
    expect(
      shouldInterpretDraft({
        ...base,
        analysis: {
          ...base.analysis,
          draft: { text: "我不能完成，帮我写得礼貌一点", confidence: 0.98 },
        },
      }),
    ).toBe(true);
    expect(
      shouldInterpretDraft({
        ...base,
        analysis: { ...base.analysis, draft: { text: "ask what happened", confidence: 0.98 } },
      }),
    ).toBe(true);
    expect(
      shouldInterpretDraft({
        ...base,
        analysis: {
          ...base.analysis,
          draft: { text: "我不能完成，幫我寫得禮貌一點", confidence: 0.98 },
        },
      }),
    ).toBe(true);
  });

  it("separates only exact complete source spans", () => {
    const draft = base.analysis.draft.text!;
    const result = {
      kind: "MIXED",
      instructionPurpose: "STYLE",
      messageStart: 0,
      messageEnd: 17,
      instructionStart: 18,
      instructionEnd: draft.length,
      confidence: 0.95,
    };
    expect(resolveDraftInstruction(draft, result)).toEqual({
      kind: "MIXED",
      messageText: "no I can't finish",
      instructionText: "write polite",
    });
    expect(resolveDraftInstruction(draft, { ...result, messageEnd: 20 })).toEqual({
      kind: "UNCERTAIN",
    });
    expect(resolveDraftInstruction(draft, { ...result, instructionStart: 19 })).toEqual({
      kind: "UNCERTAIN",
    });
    expect(resolveDraftInstruction(draft, { ...result, instructionEnd: 99 })).toEqual({
      kind: "UNCERTAIN",
    });
    expect(resolveDraftInstruction(draft, { ...result, confidence: 0.6 })).toEqual({
      kind: "UNCERTAIN",
    });
  });

  it("can keep literal wording intact or identify an instruction-only draft", () => {
    expect(
      resolveDraftInstruction("I will write politely to her.", {
        kind: "MESSAGE_ONLY",
        instructionPurpose: null,
        messageStart: null,
        messageEnd: null,
        instructionStart: null,
        instructionEnd: null,
        confidence: 0.92,
      }),
    ).toEqual({ kind: "MESSAGE_ONLY" });
    expect(
      resolveDraftInstruction("write polite", {
        kind: "INSTRUCTION_ONLY",
        instructionPurpose: "STYLE",
        messageStart: null,
        messageEnd: null,
        instructionStart: 0,
        instructionEnd: 12,
        confidence: 0.95,
      }),
    ).toEqual({ kind: "INSTRUCTION_ONLY", instructionText: "write polite", purpose: "STYLE" });
    expect(
      resolveDraftInstruction("ask what happened", {
        kind: "INSTRUCTION_ONLY",
        instructionPurpose: "REPLY_GOAL",
        messageStart: null,
        messageEnd: null,
        instructionStart: 0,
        instructionEnd: 17,
        confidence: 0.95,
      }),
    ).toEqual({
      kind: "INSTRUCTION_ONLY",
      instructionText: "ask what happened",
      purpose: "REPLY_GOAL",
    });
  });

  it("accepts a leading instruction and exact Chinese source spans", () => {
    const leading = "write polite no I can't finish";
    expect(
      resolveDraftInstruction(leading, {
        kind: "MIXED",
        instructionPurpose: "STYLE",
        messageStart: 13,
        messageEnd: leading.length,
        instructionStart: 0,
        instructionEnd: 12,
        confidence: 0.95,
      }),
    ).toEqual({
      kind: "MIXED",
      messageText: "no I can't finish",
      instructionText: "write polite",
    });
    for (const [draft, message, instruction] of [
      ["我不能完成，帮我写得礼貌一点", "我不能完成，", "帮我写得礼貌一点"],
      ["我不能完成，幫我寫得禮貌一點", "我不能完成，", "幫我寫得禮貌一點"],
    ] as const) {
      expect(
        resolveDraftInstruction(draft, {
          kind: "MIXED",
          instructionPurpose: "STYLE",
          messageStart: 0,
          messageEnd: message.length,
          instructionStart: message.length,
          instructionEnd: draft.length,
          confidence: 0.95,
        }),
      ).toEqual({ kind: "MIXED", messageText: message, instructionText: instruction });
    }
  });
});
