import type {
  AgentAction,
  CoachingRequest,
  ConversationAnalysis,
  SkillContext,
} from "@ai-message-coach/contracts";
import { createSkillEngine, initialSkillRegistry } from "@ai-message-coach/skills";
import {
  srs25RawScenarios,
  srs25ScenarioAnnotations,
  validateSrs25FixtureBoundary,
} from "@ai-message-coach/test-fixtures";
import { describe, expect, it } from "vitest";

import { decideCoachingAction, type CoachingPolicyDecision } from "./coaching-policy.js";
import { deriveSkillContextForProfile } from "./skill-context-normalization.js";
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

function fixedPolicy(request: CoachingRequest, action: AgentAction): CoachingPolicyDecision {
  const selected =
    request.selection?.kind === "ACTION"
      ? request.selection.intent
      : (request.selection?.answer ?? null);
  return {
    action,
    userIntent: {
      value:
        selected ??
        (request.analysis.draft.text
          ? "Improve the visible draft while preserving its meaning."
          : "Respond naturally to the latest visible message."),
      confidence: 1,
    },
    actionConfidence: 1,
    ambiguity: { material: false, reason: null },
  };
}

function proposed(
  request: CoachingRequest,
  action: AgentAction,
  experimentalCandidateRouting = false,
) {
  return deriveSkillContextForProfile(request, fixedPolicy(request, action), "SRS_2_5_PROPOSED", {
    experimentalCandidateRouting,
  });
}

function proposedDraft(draft: string, other = "Please review this."): SkillContext {
  const request = requestWithDraft(other, draft);
  return proposed(request, "REWRITE_DRAFT").context;
}

describe("SRS-2.5 private profile boundary", () => {
  it("keeps CURRENT byte-equal to the production deriveSkillContext path for T1-T18", () => {
    validateSrs25FixtureBoundary();
    for (const scenario of srs25RawScenarios) {
      const policy = fixedPolicy(scenario.request, scenario.fixedAction);
      const options = {
        experimentalCandidateRouting: scenario.catalogScope === "PRODUCTION_PLUS_EVALUATION",
      };
      expect(
        deriveSkillContextForProfile(scenario.request, policy, "CURRENT", options).context,
        scenario.id,
      ).toEqual(deriveSkillContext(scenario.request, policy, options));
    }
  });

  it("recovers every priority signal and removes the T17 planning false positive", () => {
    const expected: Record<string, { intents: string[]; situations: string[] }> = {
      T1: {
        intents: ["acknowledge_mistake", "provide_status", "set_expectation"],
        situations: ["mistake", "status_request"],
      },
      T6: { intents: ["acknowledge_mistake"], situations: ["mistake"] },
      T11: { intents: ["make_request"], situations: [] },
      T15: {
        intents: ["provide_status", "set_expectation"],
        situations: ["status_request"],
      },
      T18: {
        intents: ["acknowledge_mistake", "provide_status", "set_expectation", "set_boundary"],
        situations: ["mistake", "status_request", "pressure"],
      },
    };
    for (const scenario of srs25RawScenarios) {
      const result = proposed(
        scenario.request,
        scenario.fixedAction,
        scenario.catalogScope === "PRODUCTION_PLUS_EVALUATION",
      );
      const priority = expected[scenario.id];
      if (priority) {
        expect(result.context.intentTags, scenario.id).toEqual(
          expect.arrayContaining(priority.intents),
        );
        expect(result.context.situationTags, scenario.id).toEqual(
          expect.arrayContaining(priority.situations),
        );
      }
      if (scenario.id === "T17") {
        expect(result.context.intentTags).not.toContain("plan");
        expect(result.context.situationTags).not.toContain("planning");
      }
    }
  });

  it("records source-aware evidence without exposing rationale", () => {
    const results = new Map(
      srs25RawScenarios.map((scenario) => [
        scenario.id,
        proposed(scenario.request, scenario.fixedAction, true),
      ]),
    );
    expect(results.get("T6")?.signals).toContainEqual({
      kind: "INTENT",
      tag: "acknowledge_mistake",
      sources: ["USER_DRAFT"],
    });
    expect(results.get("T11")?.signals).toContainEqual({
      kind: "INTENT",
      tag: "make_request",
      sources: ["SELECTED_INTENT"],
    });
    expect(results.get("T15")?.signals).toContainEqual({
      kind: "INTENT",
      tag: "provide_status",
      sources: ["USER_DRAFT"],
    });
    expect(JSON.stringify([...results.values()])).not.toMatch(/rationale|reasoning/iu);
  });

  it("keeps fixture labels separate from raw normalizer inputs", () => {
    const before = srs25RawScenarios.map((scenario) =>
      proposed(scenario.request, scenario.fixedAction, true),
    );
    const permuted = [...srs25ScenarioAnnotations].reverse().map((annotation) => ({
      ...annotation,
      retrieval: {
        required: [...annotation.retrieval.forbidden],
        acceptable: [...annotation.retrieval.required],
        forbidden: [...annotation.retrieval.acceptable],
        strictNone: !annotation.retrieval.strictNone,
      },
    }));
    expect(permuted).not.toEqual(srs25ScenarioAnnotations);
    const after = srs25RawScenarios.map((scenario) =>
      proposed(scenario.request, scenario.fixedAction, true),
    );
    expect(after).toEqual(before);
  });
});

describe("SRS-2.5 general semantic rules", () => {
  it.each([
    [
      "ownership positive",
      "I entered the incorrect total in the sheet.",
      "acknowledge_mistake",
      true,
    ],
    [
      "ownership negative",
      "Jordan entered the incorrect total in the sheet.",
      "acknowledge_mistake",
      false,
    ],
    [
      "ownership hard neighbor",
      "The total in the sheet is incorrect.",
      "acknowledge_mistake",
      false,
    ],
    ["boundary positive", "I can't take on another assignment today.", "set_boundary", true],
    ["boundary negative", "I probably can't finish the assignment today.", "set_boundary", false],
    ["boundary hard neighbor", "I won't be there tomorrow.", "set_boundary", false],
    ["status positive", "Three checks are still failing.", "provide_status", true],
    ["status negative", "I'll run three checks tomorrow.", "provide_status", false],
    [
      "status hard neighbor",
      "Could you tell me whether the checks passed?",
      "provide_status",
      false,
    ],
    ["expectation positive", "It may take another day to complete.", "set_expectation", true],
    ["expectation negative", "Let's meet at noon tomorrow.", "set_expectation", false],
    ["expectation hard neighbor", "I can't take on more work.", "set_expectation", false],
  ])("handles %s", (_name, draft, tag, present) => {
    const context = proposedDraft(draft);
    expect(context.intentTags.includes(tag as SkillContext["intentTags"][number])).toBe(present);
  });

  it("distinguishes requests from informational and clarification neighbors", () => {
    const selected = selectedAction(
      "The invoice is ready.",
      "Ask the recipient to attach the invoice.",
    );
    expect(proposed(selected, "SUGGEST_REPLY").context.intentTags).toContain("make_request");
    expect(proposedDraft("The invoice is attached.").intentTags).not.toContain("make_request");
    const clarifyContext = proposedDraft("Which invoice do you mean, the March one or April one?");
    expect(clarifyContext.intentTags).toContain("clarify");
    expect(clarifyContext.intentTags).not.toContain("make_request");
  });

  it("distinguishes clarification from known requests and active planning", () => {
    expect(proposedDraft("Do you mean the first file or the revised file?").intentTags).toContain(
      "clarify",
    );
    expect(proposedDraft("Please send the revised file.").intentTags).not.toContain("clarify");
    expect(proposedDraft("What time should we meet on Tuesday?").intentTags).not.toContain(
      "clarify",
    );
  });

  it("requires active coordination for planning", () => {
    expect(proposedDraft("Can we meet at 4 tomorrow?").intentTags).toContain("plan");
    expect(proposedDraft("The appointment is set for 4 tomorrow.").intentTags).not.toContain(
      "plan",
    );
    expect(
      proposedDraft("The deployment is still blocked; the meeting is tomorrow.").intentTags,
    ).not.toContain("plan");
  });

  it("requires an open thread for follow-up", () => {
    const followUpRequest: CoachingRequest = {
      analysis: {
        ...analysis("Could you share the signed form?", "USER"),
        messages: [
          {
            id: "m1",
            order: 1,
            speaker: "USER",
            text: "Could you share the signed form?",
            textConfidence: 0.98,
            speakerConfidence: 0.98,
          },
          {
            id: "m2",
            order: 2,
            speaker: "OTHER",
            text: "I'll send it later.",
            textConfidence: 0.98,
            speakerConfidence: 0.98,
          },
        ],
        draft: { text: "Following up on the signed form.", confidence: 0.98 },
      },
      selection: null,
    };
    expect(proposed(followUpRequest, "REWRITE_DRAFT").context.intentTags).toContain("follow_up");
    expect(proposedDraft("Could you share the signed form?").intentTags).not.toContain("follow_up");
    expect(proposedDraft("I'm still reviewing the signed form.").intentTags).not.toContain(
      "follow_up",
    );
  });

  it.each([
    ["Simplified ownership", "我不小心发错了版本。", "acknowledge_mistake"],
    ["Traditional ownership", "我不小心發錯了版本。", "acknowledge_mistake"],
    ["Simplified request", "请对方发送最新文件。", "make_request"],
    ["Traditional request", "請對方傳送最新檔案。", "make_request"],
    ["Simplified planning", "我们几点见面？", "plan"],
    ["Traditional planning", "我們幾點見面？", "plan"],
    ["Simplified status", "现在还有两项检查没完成。", "provide_status"],
    ["Traditional status", "目前還有兩項檢查沒完成。", "provide_status"],
    ["Simplified expectation", "可能还需要一天才能完成。", "set_expectation"],
    ["Traditional expectation", "可能還需要一天才能完成。", "set_expectation"],
  ])("supports %s", (_name, draft, tag) => {
    expect(proposedDraft(draft).intentTags).toContain(tag);
  });

  it("preserves code-switch language data while keeping normalization capability-only", () => {
    const scenario = srs25RawScenarios.find(({ id }) => id === "T15")!;
    const result = proposed(scenario.request, scenario.fixedAction);
    expect(result.context.language).toEqual({
      primary: "zh-Hans",
      secondary: "en",
      codeSwitching: true,
    });
    expect(result.context.intentTags).toEqual(
      expect.arrayContaining(["provide_status", "set_expectation"]),
    );
    expect(result.signals.map(({ tag }) => String(tag))).not.toContain("zh.code_switching");
  });
});
