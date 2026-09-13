import type { SkillContext, SkillDefinition } from "@ai-message-coach/contracts";
import { describe, expect, it } from "vitest";

import {
  createSkillEngine,
  eligibleSkillLanguages,
  initialSkillRegistry,
  parseSkillDefinition,
  validateSkillRegistry,
} from "./index.js";

const baseContext: SkillContext = {
  action: "REWRITE_DRAFT",
  intent: "Provide a status update.",
  situationTags: ["status_request"],
  intentTags: ["provide_status"],
  language: { primary: "en", secondary: null, codeSwitching: false },
  draftPresent: true,
  ambiguityMaterial: false,
};

describe("initial skill registry", () => {
  it("contains 21 valid, unique, versioned, atomic definitions", () => {
    expect(initialSkillRegistry).toHaveLength(21);
    expect(new Set(initialSkillRegistry.map((skill) => skill.id)).size).toBe(21);
    for (const skill of initialSkillRegistry) {
      expect(parseSkillDefinition(skill)).toEqual(skill);
      expect(skill.version).toBe(1);
      expect(skill.status).toBe("ACTIVE");
      expect(JSON.stringify(skill).toLowerCase()).not.toContain("relationship");
    }
    expect(validateSkillRegistry(initialSkillRegistry)).toHaveLength(21);
  });

  it("keeps registry definitions and nested metadata immutable at runtime", () => {
    expect(Object.isFrozen(initialSkillRegistry)).toBe(true);
    expect(Object.isFrozen(initialSkillRegistry[0])).toBe(true);
    expect(Object.isFrozen(initialSkillRegistry[0]?.principles)).toBe(true);
    expect(() => initialSkillRegistry[0]?.principles.push("Source mutation attempt.")).toThrow();

    const registry = validateSkillRegistry(initialSkillRegistry);
    expect(Object.isFrozen(registry)).toBe(true);
    expect(Object.isFrozen(registry[0])).toBe(true);
    expect(Object.isFrozen(registry[0]?.principles)).toBe(true);
    expect(() => registry[0]?.principles.push("Mutation attempt.")).toThrow();
  });

  it("rejects duplicate IDs, versions, self references, and unknown references", () => {
    const skill = initialSkillRegistry[0]!;
    expect(() => validateSkillRegistry([skill, skill])).toThrow(/Duplicate/);
    expect(() => parseSkillDefinition({ ...skill, version: 0 })).toThrow();
    expect(() => parseSkillDefinition({ ...skill, conflictingSkills: [skill.id] })).toThrow();
    expect(() =>
      validateSkillRegistry([{ ...skill, compatibleSkills: ["missing_skill"] }]),
    ).toThrow(/Unknown/);
  });
});

describe("deterministic skill selection", () => {
  const engine = createSkillEngine(initialSkillRegistry);

  it("selects a small ordered status composition repeatably", () => {
    const first = engine.select(baseContext);
    const second = engine.select(baseContext);
    expect(first).toEqual(second);
    expect(first.status).toBe("SELECTED");
    expect(first.selectedSkills.map((skill) => skill.id)).toEqual([
      "status_update",
      "en.professional_conciseness",
    ]);
    expect(first.selectedSkills.length).toBeLessThanOrEqual(4);
  });

  it("applies universal plus eligible language modifiers", () => {
    const chinese = engine.select({
      ...baseContext,
      language: { primary: "zh", secondary: null, codeSwitching: false },
    });
    expect(chinese.selectedSkills.map((skill) => skill.id)).toEqual([
      "status_update",
      "zh.professional_formality",
    ]);
    expect(chinese.selectedSkills.some((skill) => skill.id.startsWith("en."))).toBe(false);

    const korean = engine.select({
      ...baseContext,
      language: { primary: "ko", secondary: null, codeSwitching: false },
    });
    expect(korean.selectedSkills.map((skill) => skill.id)).toEqual(["status_update"]);
  });

  it("normalizes regional language tags and keeps unsupported-primary code switching universal", () => {
    expect(
      eligibleSkillLanguages({
        ...baseContext,
        language: { primary: "en-US", secondary: null, codeSwitching: false },
      }),
    ).toEqual(new Set(["universal", "en"]));
    expect(
      eligibleSkillLanguages({
        ...baseContext,
        language: { primary: "zh-Hant", secondary: "en-US", codeSwitching: true },
      }),
    ).toEqual(new Set(["universal", "zh", "en"]));
    expect(
      eligibleSkillLanguages({
        ...baseContext,
        language: { primary: "ko", secondary: "en", codeSwitching: true },
      }),
    ).toEqual(new Set(["universal"]));

    const regionalEnglish = engine.select({
      ...baseContext,
      language: { primary: "en-US", secondary: null, codeSwitching: false },
    });
    expect(regionalEnglish.selectedSkills.map((skill) => skill.id)).toEqual([
      "status_update",
      "en.professional_conciseness",
    ]);

    const unsupportedPrimary = engine.select({
      ...baseContext,
      language: { primary: "ko", secondary: "en", codeSwitching: true },
    });
    expect(unsupportedPrimary.selectedSkills.map((skill) => skill.id)).toEqual(["status_update"]);
  });

  it("prefers the Chinese code-switching modifier for mixed planning", () => {
    const plan = engine.select({
      ...baseContext,
      intent: "Coordinate the meeting time.",
      situationTags: ["planning"],
      intentTags: ["plan"],
      language: { primary: "zh", secondary: "en", codeSwitching: true },
    });
    expect(plan.selectedSkills.map((skill) => skill.id)).toEqual([
      "planning",
      "zh.code_switching",
      "en.casual_naturalness",
      "zh.natural_conciseness",
    ]);
  });

  it.each(["SUGGEST_ACTIONS", "ASK_CLARIFICATION", "NO_REPLY_NEEDED"] as const)(
    "selects no skills for %s",
    (action) => {
      expect(engine.select({ ...baseContext, action })).toEqual({
        status: "NONE",
        selectedSkills: [],
        principles: [],
        avoid: [],
      });
    },
  );

  it("supports a legitimate zero-skill result and excludes inactive skills", () => {
    expect(
      engine.select({ ...baseContext, situationTags: [], intentTags: [], intent: null }),
    ).toEqual({ status: "NONE", selectedSkills: [], principles: [], avoid: [] });
    const inactive = initialSkillRegistry.map((skill) =>
      skill.id === "status_update" ? { ...skill, status: "INACTIVE" as const } : skill,
    );
    expect(
      createSkillEngine(inactive)
        .select({
          ...baseContext,
          language: { primary: "ko", secondary: null, codeSwitching: false },
        })
        .selectedSkills.map((skill) => skill.id),
    ).toEqual([]);
  });

  it("filters by action, situation, and intent and caps a large candidate set", () => {
    expect(
      engine.select({
        ...baseContext,
        action: "SUGGEST_ACTIONS",
      }).selectedSkills,
    ).toEqual([]);
    expect(
      engine.select({
        ...baseContext,
        situationTags: ["planning"],
        intentTags: ["provide_status"],
        language: { primary: "ko", secondary: null, codeSwitching: false },
      }).selectedSkills,
    ).toEqual([]);

    const make = (index: number): SkillDefinition => ({
      id: `candidate_${index}`,
      name: `Candidate ${index}`,
      description: "Synthetic bounded-selection skill.",
      languages: ["universal"],
      situations: ["status_request"],
      intents: ["provide_status"],
      actions: ["REWRITE_DRAFT"],
      useWhen: ["Synthetic bounded-selection fixture."],
      doNotUseWhen: [],
      principles: [`Use candidate ${index}.`],
      avoid: [],
      compatibleSkills: [],
      conflictingSkills: [],
      version: 1,
      status: "ACTIVE",
    });
    expect(
      createSkillEngine(Array.from({ length: 6 }, (_, index) => make(index + 1)))
        .select(baseContext)
        .selectedSkills.map(({ id }) => id),
    ).toEqual(["candidate_1", "candidate_2", "candidate_3", "candidate_4"]);
  });

  it("resolves conflicts greedily and composes only the winner", () => {
    const make = (id: string, conflict: string): SkillDefinition => ({
      id,
      name: id,
      description: "Synthetic conflict skill.",
      languages: ["universal"],
      situations: ["conflict"],
      intents: ["de_escalate"],
      actions: ["SUGGEST_REPLY"],
      useWhen: ["Synthetic conflict fixture."],
      doNotUseWhen: [],
      principles: [`Use ${id}.`],
      avoid: [],
      compatibleSkills: [],
      conflictingSkills: [conflict],
      version: 1,
      status: "ACTIVE",
    });
    const conflictEngine = createSkillEngine([make("alpha", "beta"), make("beta", "alpha")]);
    const result = conflictEngine.select({
      ...baseContext,
      action: "SUGGEST_REPLY",
      situationTags: ["conflict"],
      intentTags: ["de_escalate"],
    });
    expect(result.selectedSkills.map((skill) => skill.id)).toEqual(["alpha"]);
    expect(result.principles).toEqual(["Use alpha."]);
  });
});
