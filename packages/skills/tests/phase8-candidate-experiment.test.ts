import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SkillDefinitionSchema } from "@ai-message-coach/contracts";
import {
  phase8CandidateDefinitions,
  phase8CandidateGenerationFixtures,
  phase8CandidateSelectionFixtures,
  type Phase8CandidateId,
} from "../../test-fixtures/src/phase8-candidate-experiment.js";
import { describe, expect, it } from "vitest";

import { decideCoachingAction } from "../../ai/src/coaching-policy.js";
import { deriveSkillContext } from "../../ai/src/skill-context.js";
import { createSkillEngine } from "../src/engine.js";
import { initialSkillRegistry } from "../src/registry.js";

const candidateIds = [
  "perspective_acknowledgement",
  "give_constructive_feedback",
] as const satisfies readonly Phase8CandidateId[];

function activeCandidates(ids: readonly Phase8CandidateId[]) {
  return phase8CandidateDefinitions
    .filter((definition) => ids.includes(definition.id))
    .map((definition) => SkillDefinitionSchema.parse({ ...definition, status: "ACTIVE" }));
}

describe("Phase 8 candidate experiment isolation", () => {
  it("keeps both candidates inactive and outside the 21-skill production registry", () => {
    expect(initialSkillRegistry).toHaveLength(21);
    expect(phase8CandidateDefinitions.map(({ status }) => status)).toEqual([
      "INACTIVE",
      "INACTIVE",
    ]);
    expect(initialSkillRegistry.map(({ id }) => id)).not.toContain("perspective_acknowledgement");
    expect(initialSkillRegistry.map(({ id }) => id)).not.toContain("give_constructive_feedback");
    expect(initialSkillRegistry.map(({ id }) => id)).not.toContain("confirmation");
  });

  it("has balanced direct selection coverage for each authorized candidate", () => {
    for (const candidateId of candidateIds) {
      const fixtures = phase8CandidateSelectionFixtures.filter(
        (fixture) => fixture.candidateId === candidateId,
      );
      expect(fixtures).toHaveLength(16);
      expect(fixtures.filter(({ category }) => category === "POSITIVE")).toHaveLength(8);
      expect(fixtures.filter(({ category }) => category === "NEGATIVE")).toHaveLength(2);
      expect(fixtures.filter(({ category }) => category === "HARD_NEIGHBOR")).toHaveLength(4);
      expect(fixtures.filter(({ category }) => category === "NONE")).toHaveLength(2);
      expect(fixtures.filter(({ mode }) => mode === "REWRITE_DRAFT")).toHaveLength(8);
      expect(fixtures.filter(({ mode }) => mode === "SUGGEST_REPLY")).toHaveLength(8);
    }
  });

  it.each(candidateIds)(
    "selects %s on positives and excludes it on every boundary case",
    (candidateId) => {
      const engine = createSkillEngine([
        ...initialSkillRegistry,
        ...activeCandidates([candidateId]),
      ]);
      const fixtures = phase8CandidateSelectionFixtures.filter(
        (fixture) => fixture.candidateId === candidateId,
      );

      for (const fixture of fixtures) {
        const plan = engine.select(fixture.context);
        const selected = plan.selectedSkills.map(({ id }) => id);
        for (const expected of fixture.expectedSkills) expect(selected).toContain(expected);
        for (const forbidden of fixture.forbiddenSkills) expect(selected).not.toContain(forbidden);
        if (fixture.category === "NONE") expect(plan.status).toBe("NONE");
      }
    },
  );

  it("does not create cross-candidate confusion when both simulations are active", () => {
    const engine = createSkillEngine([...initialSkillRegistry, ...activeCandidates(candidateIds)]);
    for (const fixture of phase8CandidateSelectionFixtures) {
      const selected = engine.select(fixture.context).selectedSkills.map(({ id }) => id);
      const otherCandidate = candidateIds.find((id) => id !== fixture.candidateId);
      expect(selected).not.toContain(otherCandidate);
    }
  });

  it("keeps experimental raw routing off by default and enables it only when requested", () => {
    const engine = createSkillEngine([...initialSkillRegistry, ...activeCandidates(candidateIds)]);
    for (const fixture of phase8CandidateGenerationFixtures) {
      const policy = decideCoachingAction(fixture.request);
      expect(policy.action).toBe(fixture.mode);
      const baseline = deriveSkillContext(fixture.request, policy);
      const experimental = deriveSkillContext(fixture.request, policy, {
        experimentalCandidateRouting: true,
      });
      expect(engine.select(baseline).selectedSkills.map(({ id }) => id)).not.toContain(
        fixture.candidateId,
      );
      expect(
        engine.select(experimental).selectedSkills.map(({ id }) => id),
        fixture.id,
      ).toContain(fixture.candidateId);
    }
  });

  it("keeps raw hard neighbors outside the experimental candidate tags", () => {
    const perspective = structuredClone(
      phase8CandidateGenerationFixtures.find(({ id }) => id === "perspective-personal-suggest-en")!
        .request,
    );
    perspective.analysis.messages[0]!.text = "I am sad about the delay.";
    if (perspective.selection?.kind === "ACTION")
      perspective.selection.intent = "Acknowledge the expressed sadness without explaining it.";

    const feedback = structuredClone(
      phase8CandidateGenerationFixtures.find(({ id }) => id === "feedback-personal-suggest-en")!
        .request,
    );
    if (feedback.selection?.kind === "ACTION")
      feedback.selection.intent = "Ask them to send the updated pickup plan.";

    const perspectivePolicy = decideCoachingAction(perspective);
    const feedbackPolicy = decideCoachingAction(feedback);
    expect(
      deriveSkillContext(perspective, perspectivePolicy, {
        experimentalCandidateRouting: true,
      }).intentTags,
    ).not.toContain("acknowledge_perspective");
    expect(
      deriveSkillContext(feedback, feedbackPolicy, {
        experimentalCandidateRouting: true,
      }).intentTags,
    ).not.toContain("give_feedback");
  });

  it("covers both modes, all requested scripts, and three context settings for generation", () => {
    for (const candidateId of candidateIds) {
      const fixtures = phase8CandidateGenerationFixtures.filter(
        (fixture) => fixture.candidateId === candidateId,
      );
      expect(fixtures).toHaveLength(4);
      expect(new Set(fixtures.map(({ mode }) => mode))).toEqual(
        new Set(["REWRITE_DRAFT", "SUGGEST_REPLY"]),
      );
      expect(new Set(fixtures.map(({ language }) => language))).toEqual(
        new Set(["en", "zh-Hans", "zh-Hant"]),
      );
      expect(new Set(fixtures.map(({ contextSetting }) => contextSetting))).toEqual(
        new Set(["work", "personal", "service"]),
      );
    }
  });

  it("records bounded results without granting approval or activation", () => {
    const results = JSON.parse(
      readFileSync(
        resolve(import.meta.dirname, "fixtures/phase8/candidate-experiment-results.json"),
        "utf8",
      ),
    ) as {
      authorization: { productionActivation: boolean; confirmation: string };
      production: { definitionCount: number; candidateDefinitionsPublished: boolean };
      livePilot: { requests: number; successfulOutputs: number; failedOutputs: number };
      dispositions: Record<string, { decision: string }>;
    };

    expect(results.authorization).toMatchObject({
      productionActivation: false,
      confirmation: "DEFERRED_NOT_RUN",
    });
    expect(results.production).toMatchObject({
      definitionCount: 21,
      candidateDefinitionsPublished: false,
    });
    expect(results.livePilot).toMatchObject({
      requests: 32,
      successfulOutputs: 24,
      failedOutputs: 8,
    });
    expect(results.dispositions).toEqual({
      perspective_acknowledgement: expect.objectContaining({ decision: "DEFER" }),
      give_constructive_feedback: expect.objectContaining({ decision: "DEFER" }),
      confirmation: expect.objectContaining({ decision: "DEFER" }),
    });
  });
});
