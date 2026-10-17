import {
  CommunicationPlanSchema,
  SkillContextSchema,
  SkillDefinitionSchema,
  SkillRankingDiagnosticSchema,
  type CommunicationPlan,
  type SkillContext,
  type SkillDefinition,
  type SkillLanguage,
  type SkillRankingDiagnostic,
} from "@ai-message-coach/contracts";

export interface SkillEngine {
  readonly registry: readonly SkillDefinition[];
  select(
    context: SkillContext,
    inspect?: (diagnostic: SkillRankingDiagnostic) => void,
  ): CommunicationPlan;
}

function freezeSkill(skill: SkillDefinition): SkillDefinition {
  for (const value of Object.values(skill)) {
    if (Array.isArray(value)) Object.freeze(value);
  }
  return Object.freeze(skill);
}

export function validateSkillRegistry(input: readonly unknown[]): readonly SkillDefinition[] {
  const registry = input.map((skill) => SkillDefinitionSchema.parse(skill));
  const ids = new Set<string>();
  for (const skill of registry) {
    if (ids.has(skill.id)) throw new Error(`Duplicate skill id: ${skill.id}`);
    ids.add(skill.id);
  }
  for (const skill of registry) {
    for (const reference of [...skill.compatibleSkills, ...skill.conflictingSkills]) {
      if (!ids.has(reference))
        throw new Error(`Unknown skill reference: ${skill.id} -> ${reference}`);
    }
  }
  return Object.freeze(registry.map((skill) => freezeSkill(SkillDefinitionSchema.parse(skill))));
}

export function eligibleSkillLanguages(context: SkillContext): ReadonlySet<SkillLanguage> {
  const languages = new Set<SkillLanguage>(["universal"]);
  const primary = skillLanguageFamily(context.language.primary);
  if (primary === null) return languages;

  languages.add(primary);
  if (context.language.codeSwitching) {
    const secondary = skillLanguageFamily(context.language.secondary);
    if (secondary !== null) languages.add(secondary);
  }
  return languages;
}

function skillLanguageFamily(
  languageCode: string | null,
): Exclude<SkillLanguage, "universal"> | null {
  const primarySubtag = languageCode?.split("-", 1)[0]?.toLowerCase();
  return primarySubtag === "en" || primarySubtag === "zh" ? primarySubtag : null;
}

function intersects<T>(left: readonly T[], right: readonly T[]): boolean {
  return left.some((value) => right.includes(value));
}

function candidateScore(skill: SkillDefinition, context: SkillContext): number {
  let score = 0;
  if (intersects(skill.situations, context.situationTags)) score += 10;
  if (intersects(skill.intents, context.intentTags)) score += 12;
  if (skill.languages.some((language) => language !== "universal")) score += 3;
  if (skill.id === "zh.code_switching" && context.language.codeSwitching) score += 8;
  return score;
}

export function conflictsWithSelected(
  skill: SkillDefinition,
  selected: readonly SkillDefinition[],
): boolean {
  return selected.some(
    (existing) =>
      skill.conflictingSkills.includes(existing.id) ||
      existing.conflictingSkills.includes(skill.id),
  );
}

/** Validation predicate only; it does not rank or choose a replacement skill. */
export function isEligibleSkillForContext(skill: SkillDefinition, context: SkillContext): boolean {
  return eligibilityExclusions(skill, context).length === 0;
}

function eligibilityExclusions(skill: SkillDefinition, context: SkillContext): string[] {
  const languages = eligibleSkillLanguages(context);
  return [
    ...(skill.status !== "ACTIVE" ? ["Not active."] : []),
    ...(!skill.languages.some((language) => languages.has(language))
      ? ["Language not eligible."]
      : []),
    ...(!skill.actions.includes(context.action) ? ["Action not eligible."] : []),
    ...(skill.id === "zh.code_switching" && !context.language.codeSwitching
      ? ["Code-switching required."]
      : []),
    ...(skill.intents.length > 0 && !intersects(skill.intents, context.intentTags)
      ? ["No matching intent tag."]
      : []),
    ...(skill.situations.length > 0 && !intersects(skill.situations, context.situationTags)
      ? ["No matching situation tag."]
      : []),
    ...(candidateScore(skill, context) <= 0 ? ["No positive metadata score."] : []),
  ];
}

/** Shared hard eligibility and baseline ranking for production and B2 shadow selection. */
export function rankEligibleSkillCandidates(
  registry: readonly SkillDefinition[],
  context: SkillContext,
): { skill: SkillDefinition; score: number }[] {
  return registry
    .filter((skill) => isEligibleSkillForContext(skill, context))
    .map((skill) => ({ skill, score: candidateScore(skill, context) }))
    .sort((left, right) => right.score - left.score || left.skill.id.localeCompare(right.skill.id));
}

function compose(
  selected: readonly SkillDefinition[],
  reasons: Map<string, string[]>,
): CommunicationPlan {
  const principles = [...new Set(selected.flatMap((skill) => skill.principles))].slice(0, 12);
  const avoid = [...new Set(selected.flatMap((skill) => skill.avoid))].slice(0, 12);
  return CommunicationPlanSchema.parse({
    status: selected.length > 0 ? "SELECTED" : "NONE",
    selectedSkills: selected.map((skill) => ({
      id: skill.id,
      version: skill.version,
      reasons: reasons.get(skill.id) ?? ["Applicable skill metadata matched."],
    })),
    principles,
    avoid,
  });
}

export function createSkillEngine(input: readonly unknown[]): SkillEngine {
  const registry = validateSkillRegistry(input);
  return {
    registry,
    select(rawContext, inspect) {
      const context = SkillContextSchema.parse(rawContext);
      if (["SUGGEST_ACTIONS", "ASK_CLARIFICATION", "NO_REPLY_NEEDED"].includes(context.action))
        return { status: "NONE", selectedSkills: [], principles: [], avoid: [] };
      const reasons = new Map<string, string[]>();
      const candidates = rankEligibleSkillCandidates(registry, context);
      const selected: SkillDefinition[] = [];
      const diagnostic: SkillRankingDiagnostic = { maxSkills: 4, candidates: [] };
      for (const [index, { skill, score }] of candidates.entries()) {
        const capped = selected.length >= 4;
        const conflict = !capped && conflictsWithSelected(skill, selected);
        if (capped || conflict) {
          diagnostic.candidates.push({
            id: skill.id,
            version: skill.version,
            rank: index + 1,
            score,
            outcome: capped ? "TOP_K_CAP" : "CONFLICT",
            reasons: [
              capped
                ? "Four skills already selected; later candidates are not evaluated for conflicts."
                : "Conflicts with an earlier selected skill.",
            ],
          });
          continue;
        }
        const matches: string[] = [];
        if (intersects(skill.intents, context.intentTags))
          matches.push("Matched communication intent.");
        if (intersects(skill.situations, context.situationTags))
          matches.push("Matched visible situation.");
        if (skill.languages.some((language) => language !== "universal"))
          matches.push("Matched language convention.");
        reasons.set(skill.id, matches);
        selected.push(skill);
        diagnostic.candidates.push({
          id: skill.id,
          version: skill.version,
          rank: index + 1,
          score,
          outcome: "SELECTED",
          reasons: matches,
        });
      }
      for (const skill of registry) {
        const exclusions = eligibilityExclusions(skill, context);
        if (exclusions.length)
          diagnostic.candidates.push({
            id: skill.id,
            version: skill.version,
            rank: null,
            score: null,
            outcome: "INELIGIBLE",
            reasons: exclusions,
          });
      }
      try {
        inspect?.(SkillRankingDiagnosticSchema.parse(diagnostic));
      } catch {
        /* Observers cannot change selection. */
      }
      return compose(selected, reasons);
    },
  };
}
