import type { CoachingRequest, ConversationAnalysis } from "@ai-message-coach/contracts";
import { createSkillEngine, initialSkillRegistry } from "@ai-message-coach/skills";
import { describe, expect, it } from "vitest";

import { decideCoachingAction } from "./coaching-policy.js";
import { deriveSkillContext } from "./skill-context.js";

function analysis(message: string, speaker: "USER" | "OTHER"): ConversationAnalysis {
  return {
    messages: [
      {
        id: "m1",
        order: 1,
        speaker,
        text: message,
        textConfidence: 0.98,
        speakerConfidence: 0.98,
      },
    ],
    draft: { text: null, confidence: 0.98 },
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
    conversation: { summary: "Synthetic ownership fixture.", confidence: 0.95 },
    warnings: [],
    overallConfidence: 0.95,
  };
}

function requestWithDraft(message: string, draft: string): CoachingRequest {
  const input = analysis(message, "OTHER");
  input.draft = { text: draft, confidence: 0.98 };
  return { analysis: input, selection: null };
}

function selectedAction(message: string, intent: string): CoachingRequest {
  return {
    analysis: analysis(message, "OTHER"),
    selection: {
      kind: "ACTION",
      id: "synthetic-action",
      label: "Synthetic action",
      intent,
    },
  };
}

describe("skill-context evidence ownership", () => {
  it("does not attribute another speaker's apology or missed commitment to the user", () => {
    const request: CoachingRequest = {
      analysis: analysis("Sorry, I missed the deadline and sent the update late.", "OTHER"),
      selection: null,
    };
    const context = deriveSkillContext(request, decideCoachingAction(request));
    const plan = createSkillEngine(initialSkillRegistry).select(context);

    expect(context.situationTags).not.toContain("mistake");
    expect(context.situationTags).not.toContain("missed_commitment");
    expect(context.intentTags).not.toContain("acknowledge_mistake");
    expect(plan.selectedSkills.map(({ id }) => id)).not.toContain("acknowledge_mistake");
    expect(plan.selectedSkills.map(({ id }) => id)).not.toContain("apology");
  });

  it("uses user-owned visible evidence for mistake acknowledgement", () => {
    const request: CoachingRequest = {
      analysis: analysis("Sorry, I missed the deadline and sent the update late.", "USER"),
      selection: null,
    };
    const context = deriveSkillContext(request, decideCoachingAction(request));

    expect(context.situationTags).toContain("mistake");
    expect(context.intentTags).toContain("acknowledge_mistake");
  });

  it("does not turn another speaker's pressure into a user boundary decision", () => {
    const request: CoachingRequest = {
      analysis: analysis("I already asked twice. You need to do this now.", "OTHER"),
      selection: null,
    };
    const context = deriveSkillContext(request, decideCoachingAction(request));
    const selectedIds = createSkillEngine(initialSkillRegistry)
      .select(context)
      .selectedSkills.map(({ id }) => id);

    expect(context.situationTags).toContain("pressure");
    expect(context.intentTags).not.toContain("set_boundary");
    expect(selectedIds).not.toContain("boundary_setting");
  });

  it("does not turn another speaker's late update into user status or apology intent", () => {
    const request: CoachingRequest = {
      analysis: analysis("Sorry, I sent the update late.", "OTHER"),
      selection: null,
    };
    const context = deriveSkillContext(request, decideCoachingAction(request));
    const selectedIds = createSkillEngine(initialSkillRegistry)
      .select(context)
      .selectedSkills.map(({ id }) => id);

    expect(context.intentTags).not.toContain("apologize");
    expect(context.intentTags).not.toContain("acknowledge_mistake");
    expect(context.intentTags).not.toContain("provide_status");
    expect(selectedIds).not.toContain("apology");
    expect(selectedIds).not.toContain("status_update");
  });
});

describe("skill-context explicit intent and negation", () => {
  it("does not infer declining from a draft that explicitly negates declining", () => {
    const request = requestWithDraft("Would you like to join us?", "I do not want to decline.");
    const context = deriveSkillContext(request, decideCoachingAction(request));
    const selectedIds = createSkillEngine(initialSkillRegistry)
      .select(context)
      .selectedSkills.map(({ id }) => id);

    expect(context.intentTags).not.toContain("decline");
    expect(selectedIds).not.toContain("decline");
  });

  it.each([
    "I refuse to decline this invitation.",
    "I can't bring myself to decline, so I'd like to accept.",
  ])("does not infer declining from opposite-intent wording: %s", (draft) => {
    const request = requestWithDraft("Would you like to join us?", draft);
    const context = deriveSkillContext(request, decideCoachingAction(request));
    const selectedIds = createSkillEngine(initialSkillRegistry)
      .select(context)
      .selectedSkills.map(({ id }) => id);

    expect(context.intentTags).not.toContain("decline");
    expect(selectedIds).not.toContain("decline");
  });

  it("keeps an explicit decline when unrelated policy wording also contains a negation", () => {
    const request = selectedAction(
      "Would you like to join us?",
      "Decline without inventing a reason.",
    );
    const context = deriveSkillContext(request, decideCoachingAction(request));

    expect(context.intentTags).toContain("decline");
  });

  it("does not infer apology or fault from an explicitly negated draft", () => {
    const request = requestWithDraft(
      "I was worried this was my fault.",
      "No need to apologize—it was not your fault.",
    );
    const context = deriveSkillContext(request, decideCoachingAction(request));
    const selectedIds = createSkillEngine(initialSkillRegistry)
      .select(context)
      .selectedSkills.map(({ id }) => id);

    expect(context.situationTags).not.toContain("mistake");
    expect(context.situationTags).not.toContain("missed_commitment");
    expect(context.intentTags).not.toContain("apologize");
    expect(context.intentTags).not.toContain("acknowledge_mistake");
    expect(selectedIds).not.toContain("apology");
    expect(selectedIds).not.toContain("acknowledge_mistake");
  });

  it("uses an explicit selected apology as the current user intent", () => {
    const request = selectedAction(
      "You missed the deadline.",
      "Apologize for missing the deadline.",
    );
    const context = deriveSkillContext(request, decideCoachingAction(request));
    const selectedIds = createSkillEngine(initialSkillRegistry)
      .select(context)
      .selectedSkills.map(({ id }) => id);

    expect(context.situationTags).toContain("mistake");
    expect(context.intentTags).toContain("apologize");
    expect(selectedIds).toContain("apology");
  });

  it("still selects a boundary when the user's draft clearly states one", () => {
    const request = requestWithDraft(
      "I already asked twice. You need to do this now.",
      "I can't keep taking on extra work.",
    );
    const context = deriveSkillContext(request, decideCoachingAction(request));

    expect(context.situationTags).toContain("pressure");
    expect(context.intentTags).toContain("set_boundary");
  });
});
