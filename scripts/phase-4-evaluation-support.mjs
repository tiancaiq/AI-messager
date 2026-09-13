function languageFamily(languageCode) {
  const primarySubtag = languageCode?.split("-", 1)[0]?.toLowerCase();
  return primarySubtag === "en" || primarySubtag === "zh" ? primarySubtag : null;
}

// This oracle is evaluator-owned and intentionally does not call production eligibility code.
export function oracleSkillLanguages(language) {
  const eligible = new Set(["universal"]);
  const primary = languageFamily(language.primary);
  if (primary === null) return eligible;
  eligible.add(primary);
  if (language.codeSwitching) {
    const secondary = languageFamily(language.secondary);
    if (secondary !== null) eligible.add(secondary);
  }
  return eligible;
}

export function declaredConflictPairCount(registry) {
  const pairs = new Set();
  for (const skill of registry) {
    for (const conflict of skill.conflictingSkills) {
      pairs.add([skill.id, conflict].sort().join("::"));
    }
  }
  return pairs.size;
}

export function runSyntheticConflictProbe(createSkillEngine) {
  const makeSkill = (id, conflict) => ({
    id,
    name: id,
    description: "Synthetic evaluator-only conflict probe.",
    languages: ["universal"],
    situations: ["conflict"],
    intents: ["de_escalate"],
    actions: ["SUGGEST_REPLY"],
    useWhen: ["The evaluator exercises deterministic conflict filtering."],
    doNotUseWhen: [],
    principles: [`Use ${id}.`],
    avoid: [],
    compatibleSkills: [],
    conflictingSkills: [conflict],
    version: 1,
    status: "ACTIVE",
  });
  const probe = createSkillEngine([
    makeSkill("probe_alpha", "probe_beta"),
    makeSkill("probe_beta", "probe_alpha"),
  ]).select({
    action: "SUGGEST_REPLY",
    intent: "De-escalate a synthetic conflict.",
    situationTags: ["conflict"],
    intentTags: ["de_escalate"],
    language: { primary: "en", secondary: null, codeSwitching: false },
    draftPresent: false,
    ambiguityMaterial: false,
  });
  return (
    probe.selectedSkills.length === 1 &&
    probe.selectedSkills[0]?.id === "probe_alpha" &&
    probe.principles.length === 1 &&
    probe.principles[0] === "Use probe_alpha."
  );
}
