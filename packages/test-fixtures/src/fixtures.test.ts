import {
  CoachingDecisionSchema,
  ConversationAnalysisSchema,
  SkillDefinitionSchema,
} from "@ai-message-coach/contracts";
import { describe, expect, it } from "vitest";

import {
  invalidCoachingDecisionFixture,
  conversationUnderstandingFixtures,
  coachingEvaluationFixtures,
  skillSelectionEvaluationFixtures,
  renderConversationFixtureSvg,
  validCoachingDecisionFixture,
  validSkillFixture,
} from "./index.js";

describe("synthetic workspace fixtures", () => {
  it("keeps valid fixtures aligned with shared schemas", () => {
    expect(CoachingDecisionSchema.safeParse(validCoachingDecisionFixture).success).toBe(true);
    expect(SkillDefinitionSchema.safeParse(validSkillFixture).success).toBe(true);
  });

  it("provides an intentionally invalid result boundary fixture", () => {
    expect(CoachingDecisionSchema.safeParse(invalidCoachingDecisionFixture).success).toBe(false);
  });

  it("provides at least fifty valid observation-only Phase 2 scenarios", () => {
    expect(conversationUnderstandingFixtures).toHaveLength(52);
    expect(new Set(conversationUnderstandingFixtures.map((fixture) => fixture.id)).size).toBe(52);

    for (const fixture of conversationUnderstandingFixtures) {
      expect(ConversationAnalysisSchema.safeParse(fixture.expected).success).toBe(true);
      expect(JSON.stringify(fixture).toLowerCase()).not.toContain("relationship");
      expect(renderConversationFixtureSvg(fixture)).toMatch(/^<svg[\s\S]*<\/svg>$/);
    }
  });

  it("covers the required language, draft, layout, and ambiguity categories", () => {
    const categories = new Set(
      conversationUnderstandingFixtures.flatMap((fixture) => fixture.categories),
    );

    for (const category of [
      "english",
      "chinese-simplified",
      "chinese-traditional",
      "mixed-english-chinese",
      "other-language",
      "typed-draft",
      "no-draft",
      "long-draft",
      "group-chat",
      "ambiguous-speaker",
      "emoji",
      "light",
      "dark",
    ]) {
      expect(categories.has(category)).toBe(true);
    }
  });

  it("provides representative Phase 3 decision and integrity scenarios", () => {
    expect(coachingEvaluationFixtures).toHaveLength(14);
    expect(new Set(coachingEvaluationFixtures.map((fixture) => fixture.id)).size).toBe(14);
    expect(new Set(coachingEvaluationFixtures.map((fixture) => fixture.expectedAction))).toEqual(
      new Set([
        "REWRITE_DRAFT",
        "COMPLETE_DRAFT",
        "SUGGEST_REPLY",
        "SUGGEST_ACTIONS",
        "ASK_CLARIFICATION",
        "NO_REPLY_NEEDED",
      ]),
    );
    for (const fixture of coachingEvaluationFixtures) {
      expect(ConversationAnalysisSchema.safeParse(fixture.input).success).toBe(true);
      expect(fixture.importantConstraints.length).toBeGreaterThan(0);
    }
  });

  it("provides separate exact-ID Phase 4 skill-selection scenarios", () => {
    expect(skillSelectionEvaluationFixtures).toHaveLength(21);
    expect(
      skillSelectionEvaluationFixtures.filter((fixture) =>
        fixture.categories.includes("regional-language-tag"),
      ),
    ).toHaveLength(2);
    expect(
      skillSelectionEvaluationFixtures.some(
        (fixture) => fixture.id === "unsupported-primary-code-switching",
      ),
    ).toBe(true);
    for (const fixture of skillSelectionEvaluationFixtures) {
      expect(fixture.importantConstraints.length).toBeGreaterThan(0);
      expect(
        new Set([
          ...fixture.expectedSkills,
          ...fixture.acceptableSkills,
          ...fixture.forbiddenSkills,
        ]).size,
      ).toBe(
        fixture.expectedSkills.length +
          fixture.acceptableSkills.length +
          fixture.forbiddenSkills.length,
      );
    }
  });
});
