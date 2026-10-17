import type {
  SkillContext,
  SkillDefinition,
  SkillRankingDiagnostic,
} from "@ai-message-coach/contracts";
import { describe, expect, it } from "vitest";
import { createSkillEngine } from "./engine.js";
import { initialSkillRegistry } from "./registry.js";

describe("selection inspection", () => {
  it("reports actual tie order, conflict, cap and hard exclusions without changing the plan", () => {
    const registry: SkillDefinition[] = ["a", "b", "c", "d", "e", "f", "inactive"].map((id) => ({
      ...initialSkillRegistry[0]!,
      id,
      languages: ["universal"],
      situations: ["status_request"],
      intents: ["provide_status"],
      actions: ["REWRITE_DRAFT"],
      compatibleSkills: [],
      conflictingSkills: id === "b" ? ["a"] : [],
      status: id === "inactive" ? "INACTIVE" : "ACTIVE",
    }));
    const context: SkillContext = {
      action: "REWRITE_DRAFT",
      intent: null,
      situationTags: ["status_request"],
      intentTags: ["provide_status"],
      language: { primary: "en", secondary: null, codeSwitching: false },
      draftPresent: true,
      ambiguityMaterial: false,
    };
    const engine = createSkillEngine(registry);
    const observations: SkillRankingDiagnostic[] = [];
    const plan = engine.select(context, (trace) => observations.push(trace));
    expect(plan).toEqual(engine.select(context));
    expect(plan.selectedSkills.map(({ id }) => id)).toEqual(["a", "c", "d", "e"]);
    expect(
      observations[0]?.candidates.map(({ id, rank, score, outcome }) => ({
        id,
        rank,
        score,
        outcome,
      })),
    ).toEqual([
      { id: "a", rank: 1, score: 22, outcome: "SELECTED" },
      { id: "b", rank: 2, score: 22, outcome: "CONFLICT" },
      { id: "c", rank: 3, score: 22, outcome: "SELECTED" },
      { id: "d", rank: 4, score: 22, outcome: "SELECTED" },
      { id: "e", rank: 5, score: 22, outcome: "SELECTED" },
      { id: "f", rank: 6, score: 22, outcome: "TOP_K_CAP" },
      { id: "inactive", rank: null, score: null, outcome: "INELIGIBLE" },
    ]);
    expect(observations[0]?.candidates.at(-1)?.reasons).toEqual(["Not active."]);
  });
});
