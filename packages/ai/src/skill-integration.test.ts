import { skillSelectionEvaluationFixtures } from "@ai-message-coach/test-fixtures";
import {
  calculateSkillEvaluationMetrics,
  createSkillEngine,
  eligibleSkillLanguages,
  initialSkillRegistry,
} from "@ai-message-coach/skills";
import { describe, expect, it } from "vitest";

import { decideCoachingAction } from "./coaching-policy.js";
import { deriveSkillContext } from "./skill-context.js";

describe("Phase 4 skill integration evaluation", () => {
  const engine = createSkillEngine(initialSkillRegistry);

  it("preserves every Phase 3 action and selects only existing bounded skills", () => {
    for (const fixture of skillSelectionEvaluationFixtures) {
      const policy = decideCoachingAction(fixture.request);
      const context = deriveSkillContext(fixture.request, policy);
      const plan = engine.select(context);
      expect(policy.action, fixture.id).toBe(fixture.expectedAction);
      expect(plan.selectedSkills.length, fixture.id).toBeLessThanOrEqual(4);
      for (const selected of plan.selectedSkills) {
        expect(
          initialSkillRegistry.some((skill) => skill.id === selected.id),
          fixture.id,
        ).toBe(true);
        expect(selected.version).toBe(1);
      }
    }
  });

  it("passes the deterministic exact-skill fixture matrix", () => {
    const observations = skillSelectionEvaluationFixtures.map((fixture) => {
      const policy = decideCoachingAction(fixture.request);
      const context = deriveSkillContext(fixture.request, policy);
      const plan = engine.select(context);
      const eligible = eligibleSkillLanguages(context);
      const selectedSkills = plan.selectedSkills.map((skill) => skill.id);
      return {
        expectedSkills: fixture.expectedSkills,
        acceptableSkills: fixture.acceptableSkills,
        forbiddenSkills: fixture.forbiddenSkills,
        selectedSkills,
        languageEligible: selectedSkills.every((id) => {
          const skill = initialSkillRegistry.find((candidate) => candidate.id === id);
          return skill !== undefined && skill.languages.some((language) => eligible.has(language));
        }),
      };
    });
    const metrics = calculateSkillEvaluationMetrics(observations, initialSkillRegistry);
    expect(metrics).toEqual({
      expectedSkillRecall: 1,
      relevancePrecision: 1,
      forbiddenSkillRate: 0,
      unnecessarySkillRate: 0,
      conflictRate: 0,
      languageEligibilityAccuracy: 1,
      boundedSetRate: 1,
      strictScenarioPassRate: 1,
    });
  });

  it("keeps refusal and uncertain timing constraints in the composed guidance", () => {
    const planFor = (id: string) => {
      const fixture = skillSelectionEvaluationFixtures.find((candidate) => candidate.id === id);
      expect(fixture).toBeDefined();
      const policy = decideCoachingAction(fixture!.request);
      return engine.select(deriveSkillContext(fixture!.request, policy));
    };

    const refusal = planFor("clear-refusal");
    expect(refusal.principles.join(" ")).toContain("Preserve the refusal");
    expect(refusal.avoid.join(" ")).toContain("Do not turn a refusal into acceptance");

    const uncertainTiming = planFor("missed-commitment");
    expect(uncertainTiming.avoid.join(" ")).toContain(
      "Do not convert maybe or probably into a promise",
    );
  });
});
