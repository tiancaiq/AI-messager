import { readFileSync } from "node:fs";
import { SkillContextSchema, CommunicationPlanSchema } from "@ai-message-coach/contracts";
import { initialSkillRegistry, createSkillEngine } from "@ai-message-coach/skills";
import { skillSelectionEvaluationFixtures } from "@ai-message-coach/test-fixtures";
import { describe, expect, it } from "vitest";
import { decideCoachingAction } from "./coaching-policy.js";
import { deriveSkillContext } from "./skill-context.js";
import { buildOpenAiCoachingRequest } from "./openai-coaching-adapter.js";

const baseline = JSON.parse(
  readFileSync(new URL("../../skills/tests/fixtures/pre-migration.json", import.meta.url), "utf8"),
) as {
  integration: { id: string; context: unknown; expected: unknown }[];
};
describe("Phase 7 context and complete-plan integration parity", () => {
  it("sends only unchanged compact guidance through the provider payload boundary", () => {
    const engine = createSkillEngine(initialSkillRegistry);
    for (const fixture of skillSelectionEvaluationFixtures) {
      const policy = decideCoachingAction(fixture.request);
      if (!["REWRITE_DRAFT", "COMPLETE_DRAFT", "SUGGEST_REPLY"].includes(policy.action)) continue;
      const plan = engine.select(deriveSkillContext(fixture.request, policy));
      const guidance = { principles: plan.principles, avoid: plan.avoid };
      const body = buildOpenAiCoachingRequest(fixture.request, policy, guidance, "synthetic-model");
      const input = body.input as { content: { text: string }[] }[];
      const payload = JSON.parse(input[0]!.content[0]!.text);
      expect(Object.keys(payload).sort()).toEqual(
        [
          "fixedDecision",
          "selectedIntent",
          "messages",
          "draft",
          "language",
          "warnings",
          "communicationGuidance",
        ].sort(),
      );
      expect(Object.keys(payload.communicationGuidance).sort()).toEqual(["avoid", "principles"]);
      expect(payload.communicationGuidance).toEqual(guidance);
      expect(guidance.principles.length).toBeLessThanOrEqual(12);
      expect(guidance.avoid.length).toBeLessThanOrEqual(12);
      for (const marker of [
        "recordVersion",
        "visibleContext",
        "PENDING_HUMAN_REVIEW",
        "provenance",
        "capabilityFamily",
        "selectedSkills",
      ]) {
        expect(JSON.stringify(body), fixture.id).not.toContain(marker);
      }
    }
  });
  it("matches all pre-migration captured context derivations and ordered plans", () => {
    const engine = createSkillEngine(initialSkillRegistry);
    expect(skillSelectionEvaluationFixtures.map((fixture) => fixture.id)).toEqual(
      baseline.integration.map((fixture) => fixture.id),
    );
    for (const fixture of skillSelectionEvaluationFixtures) {
      const captured = baseline.integration.find((item) => item.id === fixture.id)!;
      const context = deriveSkillContext(fixture.request, decideCoachingAction(fixture.request));
      expect(context, fixture.id).toEqual(SkillContextSchema.parse(captured.context));
      expect(engine.select(context), fixture.id).toEqual(
        CommunicationPlanSchema.parse(captured.expected),
      );
    }
  });
});
