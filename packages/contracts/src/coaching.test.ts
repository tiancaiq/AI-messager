import { describe, expect, it } from "vitest";

import {
  CoachingDecisionSchema,
  CoachingRequestSchema,
  RewriteOrCompletionOutputJsonSchema,
  RewriteOrCompletionOutputSchema,
  SuggestedReplyOutputJsonSchema,
  SuggestedReplyOutputSchema,
  type ConversationAnalysis,
} from "./index.js";

const analysis: ConversationAnalysis = {
  messages: [
    {
      id: "message-1",
      order: 1,
      speaker: "OTHER",
      text: "Can you finish this today?",
      textConfidence: 0.98,
      speakerConfidence: 0.96,
    },
  ],
  draft: { text: "Probably tomorrow", confidence: 0.95 },
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
    confidence: 0.98,
  },
  conversation: { summary: "A deadline question is visible.", confidence: 0.9 },
  warnings: [],
  overallConfidence: 0.92,
};

const base = {
  userIntent: { value: "Say completion is more likely tomorrow.", confidence: 0.92 },
  actionConfidence: 0.95,
  ambiguity: { material: false, reason: null },
};

describe("Phase 3 coaching contracts", () => {
  it.each([
    {
      ...base,
      action: "REWRITE_DRAFT",
      primary: "Sorry, testing is taking longer than expected, so it will probably be tomorrow.",
      alternatives: [],
    },
    {
      ...base,
      action: "COMPLETE_DRAFT",
      primary: "I'm sorry I didn't get this done today.",
      alternatives: [],
    },
    {
      ...base,
      action: "SUGGEST_REPLY",
      replies: [{ label: "Natural", text: "Sure, I'll send it when I get home." }],
    },
    {
      ...base,
      action: "SUGGEST_ACTIONS",
      actions: [
        { id: "accept", label: "Accept", intent: "Accept the invitation." },
        { id: "decline", label: "Decline", intent: "Decline the invitation." },
      ],
    },
    {
      ...base,
      action: "ASK_CLARIFICATION",
      ambiguity: { material: true, reason: "The visible message has no actionable context." },
      question: "What would you like to communicate?",
      options: ["Acknowledge", "Ask a follow-up"],
    },
    {
      ...base,
      action: "NO_REPLY_NEEDED",
      reason: "The conversation closes naturally.",
      optionalReply: "Thanks!",
    },
  ])("validates $action", (decision) => {
    expect(CoachingDecisionSchema.safeParse(decision).success).toBe(true);
  });

  it("accepts the Phase 2 analysis directly and a bounded continuation selection", () => {
    expect(
      CoachingRequestSchema.parse({
        analysis,
        selection: {
          kind: "ACTION",
          id: "decline",
          label: "Decline",
          intent: "Decline without inventing a reason.",
        },
      }).analysis,
    ).toEqual(analysis);
  });

  it("keeps an explicit new-reply goal separate from screenshot draft and choices", () => {
    const goal = { kind: "NEW_REPLY_GOAL", text: "Ask what happened." };
    expect(
      CoachingRequestSchema.parse({ analysis, selection: null, userDirection: goal }).userDirection,
    ).toEqual(goal);
    for (const userDirection of [
      { kind: "NEW_REPLY_GOAL", text: " " },
      { kind: "NEW_REPLY_GOAL", text: "x".repeat(501) },
      { kind: "NEW_REPLY_GOAL", text: "Ask what happened.", nextAction: "SEND" },
      { kind: "TOOL", text: "Ask what happened." },
    ]) {
      expect(
        CoachingRequestSchema.safeParse({ analysis, selection: null, userDirection }).success,
      ).toBe(false);
    }
    expect(
      CoachingRequestSchema.safeParse({
        analysis,
        selection: { kind: "CLARIFICATION", answer: "Ask why." },
        userDirection: goal,
      }).success,
    ).toBe(false);
  });

  it("rejects relationship and skill fields at the Phase 3 decision boundary", () => {
    expect(
      CoachingDecisionSchema.safeParse({
        ...base,
        action: "SUGGEST_REPLY",
        replies: [{ label: "Natural", text: "Sure." }],
        relationship: "manager",
      }).success,
    ).toBe(false);
    expect(
      CoachingDecisionSchema.safeParse({
        ...base,
        action: "SUGGEST_REPLY",
        replies: [{ label: "Natural", text: "Sure." }],
        selectedSkill: "professional-tone",
      }).success,
    ).toBe(false);
  });

  it("requires a reason exactly when ambiguity is material", () => {
    expect(
      CoachingDecisionSchema.safeParse({
        ...base,
        action: "ASK_CLARIFICATION",
        ambiguity: { material: true, reason: null },
        question: "What do you want to do?",
        options: ["Accept", "Decline"],
      }).success,
    ).toBe(false);
  });

  it("publishes action-specific root-object schemas for provider wording", () => {
    expect(RewriteOrCompletionOutputJsonSchema).toMatchObject({
      type: "object",
      required: ["primary", "alternatives"],
      additionalProperties: false,
    });
    expect(SuggestedReplyOutputJsonSchema).toMatchObject({
      type: "object",
      required: ["replies"],
      additionalProperties: false,
    });
    expect(JSON.stringify(RewriteOrCompletionOutputJsonSchema)).not.toContain('"oneOf"');
    expect(JSON.stringify(RewriteOrCompletionOutputJsonSchema)).not.toContain('"anyOf"');
    expect(JSON.stringify(SuggestedReplyOutputJsonSchema)).not.toContain('"oneOf"');
    expect(JSON.stringify(SuggestedReplyOutputJsonSchema)).not.toContain('"anyOf"');
  });

  it("keeps provider wording outputs strict and free of policy-owned fields", () => {
    expect(
      RewriteOrCompletionOutputSchema.safeParse({
        primary: "Testing is taking longer, so it will probably be tomorrow.",
        alternatives: [],
      }).success,
    ).toBe(true);
    expect(
      SuggestedReplyOutputSchema.safeParse({
        replies: [{ label: "Natural", text: "Thanks—I’ll take a look." }],
      }).success,
    ).toBe(true);
    expect(
      RewriteOrCompletionOutputSchema.safeParse({
        action: "REWRITE_DRAFT",
        primary: "Testing is taking longer.",
        alternatives: [],
      }).success,
    ).toBe(false);
    expect(
      SuggestedReplyOutputSchema.safeParse({
        replies: [{ label: "Natural", text: "Thanks." }],
        relationship: "manager",
      }).success,
    ).toBe(false);
  });
});
