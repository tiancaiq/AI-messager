import { expect, it, vi } from "vitest";

import { normalizeCommunicationProblem } from "../src/communication-problem.js";
import { decideCoachingAction } from "../src/coaching-policy.js";
import { skillPlanAsCommunicationPlan } from "./composer-b4-harness.js";
import {
  COMPOSER_B4_5_CASE_IDS,
  COMPOSER_B4_5_MAX_CALLS,
  assertComposerB45CallBudget,
  composerB45Fixtures,
  sparseNicerB45Fixture,
} from "./composer-b4-5-fixtures.js";
import { createSkillPipelineHarness } from "./skill-pipeline-harness.js";

it("locks the 23-case focused set and 46-call ceiling before live generation", () => {
  expect(composerB45Fixtures.map(({ id }) => id)).toEqual(COMPOSER_B4_5_CASE_IDS);
  expect(new Set(COMPOSER_B4_5_CASE_IDS).size).toBe(23);
  expect(COMPOSER_B4_5_MAX_CALLS).toBe(2 * composerB45Fixtures.length);
  expect(COMPOSER_B4_5_CASE_IDS).not.toContain("sparse-nicer");
  expect(() => assertComposerB45CallBudget(44, 2)).not.toThrow();
  expect(() => assertComposerB45CallBudget(45, 2)).toThrow("budget exhausted");
});

it("keeps a validated Agent tone instruction separate from zero-skill guidance", async () => {
  const fixture = sparseNicerB45Fixture;
  const policy = decideCoachingAction(fixture.request);
  const problem = normalizeCommunicationProblem(fixture.request, fixture.suppliedContext);
  const inspected = await createSkillPipelineHarness()(fixture);
  const guidance = skillPlanAsCommunicationPlan(inspected.plan);
  const composerProbe = vi.fn(
    (input: { instruction: typeof problem.instruction; guidance: typeof guidance }) => input,
  );

  expect(policy.action).toBe("REWRITE_DRAFT");
  expect(fixture.request.analysis.draft.text).toBe("Thanks for your help.");
  expect(problem.instruction).toEqual({ value: "Make this nicer.", provenance: "USER_SUPPLIED" });
  expect(inspected.selection.selectedSkills).toEqual([]);
  expect(inspected.plan.status).toBe("NONE");
  expect(guidance.principles).toEqual([]);
  composerProbe({ instruction: problem.instruction, guidance });
  expect(composerProbe).toHaveBeenCalledWith({
    instruction: { value: "Make this nicer.", provenance: "USER_SUPPLIED" },
    guidance: expect.objectContaining({ status: "NONE", selectedSkills: [] }),
  });
});
