import { describe, expect, it } from "vitest";

import { calculateSkillEvaluationMetrics, initialSkillRegistry } from "./index.js";

describe("skill selection metrics", () => {
  it("calculates recall, relevance, forbidden, unnecessary, language, bounds, and strict pass", () => {
    expect(
      calculateSkillEvaluationMetrics(
        [
          {
            expectedSkills: ["status_update"],
            acceptableSkills: ["expectation_setting"],
            forbiddenSkills: ["apology"],
            selectedSkills: ["status_update"],
            languageEligible: true,
          },
          {
            expectedSkills: [],
            acceptableSkills: [],
            forbiddenSkills: ["apology"],
            selectedSkills: [],
            languageEligible: true,
          },
        ],
        initialSkillRegistry,
      ),
    ).toEqual({
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

  it("does not call an explicitly acceptable optional skill unnecessary", () => {
    expect(
      calculateSkillEvaluationMetrics(
        [
          {
            expectedSkills: [],
            acceptableSkills: ["request"],
            forbiddenSkills: [],
            selectedSkills: ["request"],
            languageEligible: true,
          },
        ],
        initialSkillRegistry,
      ).unnecessarySkillRate,
    ).toBe(0);
  });

  it("reports forbidden, unnecessary, conflicting, and ineligible selections", () => {
    const apology = initialSkillRegistry.find((skill) => skill.id === "apology")!;
    const status = initialSkillRegistry.find((skill) => skill.id === "status_update")!;
    const registry = [
      { ...apology, conflictingSkills: [status.id] },
      { ...status, conflictingSkills: [apology.id] },
    ];
    const metrics = calculateSkillEvaluationMetrics(
      [
        {
          expectedSkills: [],
          acceptableSkills: [],
          forbiddenSkills: ["apology"],
          selectedSkills: ["apology", "status_update"],
          languageEligible: false,
        },
      ],
      registry,
    );

    expect(metrics.forbiddenSkillRate).toBe(1);
    expect(metrics.unnecessarySkillRate).toBe(1);
    expect(metrics.conflictRate).toBe(1);
    expect(metrics.languageEligibilityAccuracy).toBe(0);
    expect(metrics.strictScenarioPassRate).toBe(0);
  });
});
