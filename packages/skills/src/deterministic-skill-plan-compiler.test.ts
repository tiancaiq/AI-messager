import {
  SkillPlanCompilationRequestSchema,
  SkillPlanSchema,
  type SkillDefinition,
  type SkillPlanCompilationRequest,
} from "@ai-message-coach/contracts";
import { describe, expect, it } from "vitest";

import { createApprovedSkillCatalogSnapshot } from "./catalog-snapshot.js";
import { validateSkillPlan } from "./agent-skill-boundary.js";
import { createDeterministicSkillPlanCompiler } from "./deterministic-skill-plan-compiler.js";
import { initialSkillRegistry } from "./registry.js";

const snapshot = createApprovedSkillCatalogSnapshot(initialSkillRegistry);
const apology = snapshot.registry.find((skill) => skill.id === "apology")!;
const reference = { id: apology.id, version: apology.version };
const evidence = [
  {
    id: "E1" as const,
    kind: "CONTEXT_TAG" as const,
    source: "DETERMINISTIC_DERIVATION" as const,
    sourceRef: "context:intent:apologize",
    value: { format: "CODE" as const, code: "INTENT:apologize" },
  },
  {
    id: "E3" as const,
    kind: "USER_DIRECTION" as const,
    source: "USER_SUPPLIED" as const,
    sourceRef: "selection:direction",
    value: { format: "TEXT" as const, text: "Apologize without inventing a reason." },
  },
  {
    id: "E4" as const,
    kind: "CONTEXT_TAG" as const,
    source: "DETERMINISTIC_DERIVATION" as const,
    sourceRef: "context:situation:status_request",
    value: { format: "CODE" as const, code: "SITUATION:status_request" },
  },
  {
    id: "E2" as const,
    kind: "UNKNOWN_RELATIONSHIP" as const,
    source: "UNKNOWN" as const,
    value: { format: "UNKNOWN" as const },
  },
];

function requestFor(catalog = snapshot, selected = [reference]): SkillPlanCompilationRequest {
  return {
    action: "REWRITE_DRAFT",
    selection: {
      status: selected.length ? "SELECTED" : "NONE",
      selectedSkills: selected,
      reasons: selected.map((skill) => ({
        skillId: skill.id,
        evidenceRefs: ["E1"],
        code: "CONTEXT_MATCH",
      })),
      uncertaintyCodes: [],
      catalogSnapshotId: catalog.id,
    },
    evidence,
    context: {
      situationTags: ["mistake"],
      intentTags: ["apologize"],
      language: { primary: "en", secondary: null, codeSwitching: false },
      draftPresent: true,
      ambiguityMaterial: false,
    },
    constraints: [{ kind: "HARD", evidenceRef: "E3" }],
    catalogSnapshotId: catalog.id,
  };
}

function modifiedSnapshot(change: (skill: SkillDefinition) => SkillDefinition) {
  return createApprovedSkillCatalogSnapshot(
    snapshot.registry.map((skill) => (skill.id === apology.id ? change(skill) : skill)),
  );
}

describe("B3 deterministic SkillPlan compiler", () => {
  it("compiles only the exact selected approved reference and preserves fixed action authority", async () => {
    const plan = await createDeterministicSkillPlanCompiler(snapshot).compile(requestFor());
    expect(plan.status).toBe("COMPILED");
    expect(plan.selectedSkills).toEqual([reference]);
    expect(plan.principles.map(({ text }) => text)).toEqual(apology.principles);
    expect(plan.avoid.map(({ text }) => text)).toEqual(apology.avoid);
    expect(plan.tradeoffs).toEqual([]);
    expect(plan.recommendations).toEqual([]);
    expect(plan.principles[0]).toMatchObject({ skillRefs: [reference], evidenceRefs: ["E1"] });
    expect(plan).not.toHaveProperty("action");
    expect(plan).not.toHaveProperty("nextAction");
    expect(plan).not.toHaveProperty("callModel");
    expect(plan).not.toHaveProperty("shouldStop");
    expect(SkillPlanSchema.safeParse({ ...plan, nextAgent: "composer" }).success).toBe(false);
    expect(
      SkillPlanCompilationRequestSchema.safeParse({ ...requestFor(), callBudget: 2 }).success,
    ).toBe(false);
  });

  it("fails closed for unknown, inactive, changed-version, mismatched-snapshot and ineligible refs", async () => {
    const compiler = createDeterministicSkillPlanCompiler(snapshot);
    for (const changed of [
      { id: "unknown_skill", version: 1 },
      { ...reference, version: reference.version + 1 },
    ]) {
      const plan = await compiler.compile(requestFor(snapshot, [changed]));
      expect(plan).toMatchObject({
        status: "FAILED",
        selectedSkills: [],
        failureCode: "UNRESOLVED_SKILL",
      });
      expect(plan.principles).toEqual([]);
    }
    const inactive = modifiedSnapshot((skill) => ({ ...skill, status: "INACTIVE" }));
    expect(
      await createDeterministicSkillPlanCompiler(inactive).compile(requestFor(inactive)),
    ).toMatchObject({ status: "FAILED", failureCode: "UNRESOLVED_SKILL" });
    expect(await compiler.compile({ ...requestFor(), catalogSnapshotId: "other" })).toMatchObject({
      status: "FAILED",
      failureCode: "CATALOG_MISMATCH",
    });
    expect(await compiler.compile({ ...requestFor(), action: "ASK_CLARIFICATION" })).toMatchObject({
      status: "FAILED",
      failureCode: "UNRESOLVED_SKILL",
    });
  });

  it("never invents a fallback for NONE or compiles a FAILED selection", async () => {
    const compiler = createDeterministicSkillPlanCompiler(snapshot);
    expect(await compiler.compile(requestFor(snapshot, []))).toEqual({
      status: "NONE",
      selectedSkills: [],
      principles: [],
      avoid: [],
      tradeoffs: [],
      recommendations: [],
      catalogSnapshotId: snapshot.id,
    });
    const failed = requestFor();
    failed.selection = {
      status: "FAILED",
      selectedSkills: [],
      reasons: [],
      uncertaintyCodes: [],
      failureCode: "SELECTION_FAILED",
      catalogSnapshotId: snapshot.id,
    };
    expect(await compiler.compile(failed)).toMatchObject({
      status: "FAILED",
      selectedSkills: [],
      principles: [],
      failureCode: "SELECTION_FAILED",
    });
  });

  it("rejects output attempts to add, remove or change a selected version", async () => {
    const input = requestFor();
    const plan = await createDeterministicSkillPlanCompiler(snapshot).compile(input);
    const extra = snapshot.registry.find((skill) => skill.id === "acknowledge_mistake")!;
    expect(() =>
      validateSkillPlan(
        input,
        {
          ...plan,
          selectedSkills: [...plan.selectedSkills, { id: extra.id, version: extra.version }],
        },
        snapshot,
      ),
    ).toThrow("SKILL_PLAN_SELECTION_MISMATCH");
    expect(() => validateSkillPlan(input, { ...plan, selectedSkills: [] }, snapshot)).toThrow();
    expect(() =>
      validateSkillPlan(
        input,
        { ...plan, selectedSkills: [{ ...reference, version: reference.version + 1 }] },
        snapshot,
      ),
    ).toThrow("SKILL_PLAN_SELECTION_MISMATCH");
  });

  it("rejects conflicts without removing, replacing or re-ranking selected skills", async () => {
    const conflict = modifiedSnapshot((skill) => ({
      ...skill,
      conflictingSkills: ["acknowledge_mistake"],
      compatibleSkills: skill.compatibleSkills.filter((id) => id !== "acknowledge_mistake"),
    }));
    const second = conflict.registry.find((skill) => skill.id === "acknowledge_mistake")!;
    const input = requestFor(conflict, [reference, { id: second.id, version: second.version }]);
    input.context.intentTags = ["apologize", "acknowledge_mistake"];
    input.evidence.push({
      id: "E5",
      kind: "CONTEXT_TAG",
      source: "DETERMINISTIC_DERIVATION",
      sourceRef: "context:intent:acknowledge_mistake",
      value: { format: "CODE", code: "INTENT:acknowledge_mistake" },
    });
    input.selection.reasons[1]!.evidenceRefs = ["E5"];
    expect(await createDeterministicSkillPlanCompiler(conflict).compile(input)).toMatchObject({
      status: "FAILED",
      selectedSkills: [],
      failureCode: "COMPILATION_FAILED",
    });
  });

  it("bounds and deduplicates principles/avoidances in selected order with valid citations", async () => {
    const ids = ["apology", "acknowledge_mistake", "emotional_validation", "reassurance"];
    const custom = createApprovedSkillCatalogSnapshot(
      snapshot.registry.map((skill) => {
        const index = ids.indexOf(skill.id);
        if (index < 0) return skill;
        return {
          ...skill,
          situations: ["mistake"],
          intents: ["apologize"],
          principles: [
            "Shared principle.",
            ...Array.from({ length: 5 }, (_, n) => `P${index}-${n}`),
          ],
          avoid: ["Shared avoidance.", ...Array.from({ length: 5 }, (_, n) => `A${index}-${n}`)],
          conflictingSkills: [],
          compatibleSkills: skill.compatibleSkills.filter((id) => !ids.includes(id)),
        };
      }),
    );
    const refs = ids.map((id) => {
      const skill = custom.registry.find((candidate) => candidate.id === id)!;
      return { id: skill.id, version: skill.version };
    });
    const input = requestFor(custom, refs);
    const compiler = createDeterministicSkillPlanCompiler(custom);
    const first = await compiler.compile(input);
    const second = await compiler.compile(input);
    expect(first).toEqual(second);
    expect(first.selectedSkills).toEqual(refs);
    expect(first.principles).toHaveLength(12);
    expect(first.avoid).toHaveLength(12);
    expect(first.principles[0]?.text).toBe("Shared principle.");
    expect(first.avoid[0]?.text).toBe("Shared avoidance.");
    expect(first.principles[0]?.skillRefs).toEqual(refs);
    expect(first.avoid[0]?.skillRefs).toEqual(refs);
    expect(new Set(first.principles.map(({ text }) => text)).size).toBe(12);
    expect(new Set(first.avoid.map(({ text }) => text)).size).toBe(12);
    expect(first.principles.flatMap(({ evidenceRefs }) => evidenceRefs)).not.toContain("E2");
  });

  it("does not copy private evidence, invent a relationship/goal, or bypass language eligibility", async () => {
    const compiler = createDeterministicSkillPlanCompiler(snapshot);
    const input = requestFor();
    input.evidence.find((item) => item.id === "E3")!.value = {
      format: "TEXT",
      text: "convince them to agree",
    };
    const plan = await compiler.compile(input);
    expect(JSON.stringify(plan)).not.toContain("convince them to agree");
    expect(JSON.stringify(plan)).not.toContain("partner");
    expect(plan.principles[0]?.evidenceRefs).toEqual(["E1"]);
    const english = snapshot.registry.find((skill) => skill.id === "en.professional_conciseness")!;
    const englishInput = requestFor(snapshot, [{ id: english.id, version: english.version }]);
    englishInput.context.situationTags = [...english.situations];
    englishInput.context.intentTags = [...english.intents];
    englishInput.selection.reasons[0]!.evidenceRefs = ["E4"];
    englishInput.context.language.primary = "fr";
    expect(await compiler.compile(englishInput)).toMatchObject({
      status: "FAILED",
      failureCode: "UNRESOLVED_SKILL",
    });
  });

  it("rejects unsupported selection citations and output authority fields", async () => {
    const compiler = createDeterministicSkillPlanCompiler(snapshot);
    const invalid = requestFor();
    invalid.selection.reasons[0]!.evidenceRefs = ["E9"];
    expect(await compiler.compile(invalid)).toMatchObject({
      status: "FAILED",
      failureCode: "INVALID_INPUT",
    });
    const ungrounded = requestFor();
    ungrounded.selection.reasons[0]!.evidenceRefs = ["E3"];
    expect(await compiler.compile(ungrounded)).toMatchObject({
      status: "FAILED",
      failureCode: "INVALID_INPUT",
    });
    const valid = await compiler.compile(requestFor());
    expect(SkillPlanSchema.safeParse({ ...valid, shouldRevise: true }).success).toBe(false);
    expect(SkillPlanSchema.safeParse({ ...valid, composerInstruction: "new goal" }).success).toBe(
      false,
    );
    expect(
      SkillPlanSchema.safeParse({
        ...valid,
        principles: [{ ...valid.principles[0]!, text: "x".repeat(301) }],
      }).success,
    ).toBe(false);
    expect(
      SkillPlanSchema.safeParse({
        ...valid,
        principles: Array.from({ length: 12 }, (_, index) => ({
          ...valid.principles[0]!,
          text: `P${index}`,
        })),
        avoid: Array.from({ length: 12 }, (_, index) => ({
          ...valid.avoid[0]!,
          text: `A${index}`,
        })),
        recommendations: [{ ...valid.principles[0]!, text: "Extra guidance" }],
      }).success,
    ).toBe(false);
  });
});
