import {
  CommunicationGuidanceSchema,
  CommunicationPlanSchema,
  type CoachingDecisionResult,
  type CommunicationGuidance,
  type CommunicationPlan,
  type SkillPlan,
} from "@ai-message-coach/contracts";

import { coachConversation, type CoachingTextGenerator } from "../src/coaching-engine.js";
import { decideCoachingAction } from "../src/coaching-policy.js";
import { approvedPipelineSnapshot, createSkillPipelineHarness } from "./skill-pipeline-harness.js";
import type { PipelineValidationFixture } from "./skill-pipeline-fixtures.js";

export type ComposerB4Arm = "legacy" | "new";
export const COMPOSER_B4_MAX_CALLS = 60;

export function composerB4Order(
  index: number,
  seed: number,
): readonly [ComposerB4Arm, ComposerB4Arm] {
  if (!Number.isInteger(index) || index < 0 || !Number.isInteger(seed))
    throw new Error("Invalid B4 order input");
  return (index + seed) % 2 === 0 ? ["legacy", "new"] : ["new", "legacy"];
}

export function assertComposerB4CallBudget(callsAttempted: number, upcomingCalls: number): void {
  if (
    !Number.isInteger(callsAttempted) ||
    callsAttempted < 0 ||
    !Number.isInteger(upcomingCalls) ||
    upcomingCalls < 1 ||
    callsAttempted + upcomingCalls > COMPOSER_B4_MAX_CALLS
  )
    throw new Error("B4 live-call budget exhausted");
}

export interface ComposerB4ArmResult {
  arm: ComposerB4Arm;
  guidance: CommunicationGuidance;
  result: CoachingDecisionResult;
  providerResult: CoachingDecisionResult | null;
  providerCalls: number;
  durationMs: number;
}

export interface ComposerB4CaseResult {
  fixtureId: string;
  action: ReturnType<typeof decideCoachingAction>["action"];
  evidenceSummary: string;
  signalIds: readonly string[];
  legacyPlan: CommunicationPlan;
  newPlan: SkillPlan;
  arms: readonly ComposerB4ArmResult[];
}

/** Evaluation-only adapter. It copies approved guidance text, not skill control fields. */
export function skillPlanAsCommunicationPlan(plan: SkillPlan): CommunicationPlan {
  if (plan.status === "FAILED") throw new Error("Cannot evaluate a failed SkillPlan");
  return CommunicationPlanSchema.parse({
    status: plan.status === "NONE" ? "NONE" : "SELECTED",
    // Legacy plan validation requires an internal reason. It is never sent to Composer.
    selectedSkills: plan.selectedSkills.map(({ id, version }) => ({
      id,
      version,
      reasons: ["Validated SkillPlan selection for B4 evaluation."],
    })),
    principles: plan.principles.map(({ text }) => text),
    avoid: plan.avoid.map(({ text }) => text),
  });
}

function guidance(plan: CommunicationPlan): CommunicationGuidance {
  return CommunicationGuidanceSchema.parse({ principles: plan.principles, avoid: plan.avoid });
}

/** Both arms use the same production Composer/guard implementation; only injected guidance differs. */
export async function runComposerB4Case(
  fixture: PipelineValidationFixture,
  generator: CoachingTextGenerator,
  order: readonly [ComposerB4Arm, ComposerB4Arm],
): Promise<ComposerB4CaseResult> {
  if (order[0] === order[1]) throw new Error("Both Composer arms must run exactly once");
  const inspected = await createSkillPipelineHarness(approvedPipelineSnapshot)(fixture);
  const action = decideCoachingAction(fixture.request).action;
  if (!["REWRITE_DRAFT", "COMPLETE_DRAFT", "SUGGEST_REPLY"].includes(action))
    throw new Error("B4 Composer cases require a provider-generated fixed action");
  if (inspected.plan.status === "FAILED") throw new Error("Cannot compare a failed SkillPlan");
  const plans = {
    legacy: CommunicationPlanSchema.parse(inspected.legacy),
    new: skillPlanAsCommunicationPlan(inspected.plan),
  };
  const arms: ComposerB4ArmResult[] = [];
  for (const arm of order) {
    const plan = plans[arm];
    let providerResult: CoachingDecisionResult | null = null;
    let providerCalls = 0;
    const recordingGenerator: CoachingTextGenerator = {
      configuration: generator.configuration,
      async generateCoachingDecision(request, policy, communicationGuidance, task) {
        providerCalls += 1;
        providerResult = await generator.generateCoachingDecision(
          request,
          policy,
          communicationGuidance,
          task,
        );
        return providerResult;
      },
    };
    const started = performance.now();
    const result = await coachConversation(recordingGenerator, fixture.request, {
      skillPlanner: { plan: () => plan },
    });
    const durationMs = performance.now() - started;
    if (providerCalls !== 1) throw new Error("A B4 arm did not make exactly one provider call");
    arms.push({ arm, guidance: guidance(plan), result, providerResult, providerCalls, durationMs });
  }
  return {
    fixtureId: fixture.id,
    action,
    evidenceSummary: fixture.supportedEvidenceSummary,
    signalIds: inspected.assessment.needs.map(({ signalId }) => signalId),
    legacyPlan: plans.legacy,
    newPlan: inspected.plan,
    arms,
  };
}
