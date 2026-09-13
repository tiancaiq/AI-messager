import type { SkillDefinition } from "@ai-message-coach/contracts";

export interface SkillEvaluationObservation {
  expectedSkills: readonly string[];
  acceptableSkills: readonly string[];
  forbiddenSkills: readonly string[];
  selectedSkills: readonly string[];
  languageEligible: boolean;
}

export interface SkillEvaluationMetrics {
  expectedSkillRecall: number | null;
  relevancePrecision: number;
  forbiddenSkillRate: number;
  unnecessarySkillRate: number;
  conflictRate: number;
  languageEligibilityAccuracy: number;
  boundedSetRate: number;
  strictScenarioPassRate: number;
}

function hasConflict(ids: readonly string[], registry: readonly SkillDefinition[]): boolean {
  const byId = new Map(registry.map((skill) => [skill.id, skill]));
  return ids.some((id) => {
    const skill = byId.get(id);
    return skill?.conflictingSkills.some((conflict) => ids.includes(conflict)) ?? false;
  });
}

export function calculateSkillEvaluationMetrics(
  observations: readonly SkillEvaluationObservation[],
  registry: readonly SkillDefinition[],
): SkillEvaluationMetrics {
  let expected = 0;
  let recalled = 0;
  let selected = 0;
  let relevant = 0;
  let forbiddenCases = 0;
  let zeroCases = 0;
  let unnecessaryCases = 0;
  let conflicts = 0;
  let languageEligible = 0;
  let bounded = 0;
  let strict = 0;
  for (const observation of observations) {
    const selectedSet = new Set(observation.selectedSkills);
    const allowed = new Set([...observation.expectedSkills, ...observation.acceptableSkills]);
    expected += observation.expectedSkills.length;
    recalled += observation.expectedSkills.filter((id) => selectedSet.has(id)).length;
    selected += observation.selectedSkills.length;
    relevant += observation.selectedSkills.filter((id) => allowed.has(id)).length;
    const forbidden = observation.forbiddenSkills.some((id) => selectedSet.has(id));
    if (forbidden) forbiddenCases += 1;
    if (observation.expectedSkills.length === 0 && observation.acceptableSkills.length === 0) {
      zeroCases += 1;
      if (observation.selectedSkills.length > 0) unnecessaryCases += 1;
    }
    const conflict = hasConflict(observation.selectedSkills, registry);
    if (conflict) conflicts += 1;
    if (observation.languageEligible) languageEligible += 1;
    if (observation.selectedSkills.length <= 4) bounded += 1;
    const hasExpected = observation.expectedSkills.every((id) => selectedSet.has(id));
    const onlyAllowed = observation.selectedSkills.every((id) => allowed.has(id));
    if (
      hasExpected &&
      onlyAllowed &&
      !forbidden &&
      !conflict &&
      observation.languageEligible &&
      observation.selectedSkills.length <= 4
    )
      strict += 1;
  }
  const count = observations.length;
  return {
    expectedSkillRecall: expected === 0 ? null : recalled / expected,
    relevancePrecision: selected === 0 ? 1 : relevant / selected,
    forbiddenSkillRate: count === 0 ? 0 : forbiddenCases / count,
    unnecessarySkillRate: zeroCases === 0 ? 0 : unnecessaryCases / zeroCases,
    conflictRate: count === 0 ? 0 : conflicts / count,
    languageEligibilityAccuracy: count === 0 ? 1 : languageEligible / count,
    boundedSetRate: count === 0 ? 1 : bounded / count,
    strictScenarioPassRate: count === 0 ? 1 : strict / count,
  };
}
