import { performance } from "node:perf_hooks";

import {
  SkillSelectionRequestSchema,
  type AgentAction,
  type CommunicationAssessment,
  type CommunicationPlan,
  type SkillAssessmentRequest,
  type SkillEvidence,
  type SkillPlan,
  type SkillReference,
  type SkillSelectionResult,
} from "@ai-message-coach/contracts";
import {
  assessCommunicationNeeds,
  createApprovedSkillCatalogSnapshot,
  createDeterministicSkillPlanCompiler,
  createSkillEngine,
  initialSkillRegistry,
  selectEvidenceAwareSkills,
  type ApprovedSkillCatalogSnapshot,
} from "@ai-message-coach/skills";

import { normalizeCommunicationProblem } from "../src/communication-problem.js";
import { decideCoachingAction } from "../src/coaching-policy.js";
import { projectSkillEvidence } from "../src/skill-evidence.js";
import { deriveSkillContext } from "../src/skill-context.js";
import { refineShadowSkillContext } from "../src/skill-shadow-context.js";
import type { PipelineValidationFixture } from "./skill-pipeline-fixtures.js";

export const approvedPipelineSnapshot = createApprovedSkillCatalogSnapshot(initialSkillRegistry);

export type ComparisonCategory =
  | "MATCH"
  | "EXPECTED_DIFFERENCE"
  | "POTENTIAL_IMPROVEMENT"
  | "POTENTIAL_REGRESSION"
  | "NOT_COMPARABLE";

export type ComparisonReasonCode =
  | "FAILURE"
  | "STATUS_MISMATCH"
  | "SKILL_SET_MISMATCH"
  | "SKILL_ORDER_MISMATCH"
  | "PRINCIPLE_MISMATCH"
  | "AVOID_MISMATCH";

function referenceKeys(references: readonly SkillReference[]): string[] {
  return references.map(({ id, version }) => `${id}@${version}`);
}

function compare(
  legacy: CommunicationPlan,
  selection: SkillSelectionResult,
  plan: SkillPlan,
): { category: ComparisonCategory; reasonCodes: ComparisonReasonCode[] } {
  if (legacy.status === "FAILED" || selection.status === "FAILED" || plan.status === "FAILED")
    return { category: "NOT_COMPARABLE", reasonCodes: ["FAILURE"] };
  const oldRefs = referenceKeys(legacy.selectedSkills);
  const newRefs = referenceKeys(selection.selectedSkills);
  const reasons: ComparisonReasonCode[] = [];
  if ((legacy.status === "NONE") !== (selection.status === "NONE")) reasons.push("STATUS_MISMATCH");
  if (oldRefs.length !== newRefs.length || oldRefs.some((ref) => !newRefs.includes(ref)))
    reasons.push("SKILL_SET_MISMATCH");
  else if (oldRefs.some((ref, index) => ref !== newRefs[index]))
    reasons.push("SKILL_ORDER_MISMATCH");
  if (
    legacy.principles.length !== plan.principles.length ||
    legacy.principles.some((text, index) => text !== plan.principles[index]?.text)
  )
    reasons.push("PRINCIPLE_MISMATCH");
  if (
    legacy.avoid.length !== plan.avoid.length ||
    legacy.avoid.some((text, index) => text !== plan.avoid[index]?.text)
  )
    reasons.push("AVOID_MISMATCH");
  if (!reasons.length) return { category: "MATCH", reasonCodes: [] };
  if (oldRefs.some((ref) => !newRefs.includes(ref)))
    return { category: "POTENTIAL_REGRESSION", reasonCodes: reasons };
  if (!oldRefs.length && newRefs.length)
    return { category: "POTENTIAL_IMPROVEMENT", reasonCodes: reasons };
  return { category: "EXPECTED_DIFFERENCE", reasonCodes: reasons };
}

export interface PipelineStructuralResult {
  fixtureId: string;
  action: AgentAction;
  catalogSnapshotId: string;
  unknownCodes: readonly string[];
  evidenceRefs: readonly { id: string; kind: SkillEvidence["kind"] }[];
  signalIds: readonly string[];
  legacyStatus: CommunicationPlan["status"];
  legacySelected: readonly SkillReference[];
  selectionStatus: SkillSelectionResult["status"];
  selected: readonly SkillReference[];
  planStatus: SkillPlan["status"];
  principleCount: number;
  avoidCount: number;
  conflictBlocked: boolean;
  category: ComparisonCategory;
  reasonCodes: readonly ComparisonReasonCode[];
}

export interface PipelineInspection {
  structural: PipelineStructuralResult;
  evidence: SkillEvidence[];
  assessment: CommunicationAssessment;
  selection: SkillSelectionResult;
  plan: SkillPlan;
  legacy: CommunicationPlan;
  context: SkillAssessmentRequest["context"];
  timingsMs: { assessment: number; selection: number; compilation: number; full: number };
}

/** Test/evaluation-only harness. Only `structural` is suitable for a content-free trace. */
export function createSkillPipelineHarness(
  snapshot: ApprovedSkillCatalogSnapshot = approvedPipelineSnapshot,
): (fixture: PipelineValidationFixture) => Promise<PipelineInspection> {
  const legacyEngine = createSkillEngine(snapshot.registry);
  const compiler = createDeterministicSkillPlanCompiler(snapshot);
  return async (fixture) => {
    const started = performance.now();
    const policy = decideCoachingAction(fixture.request);
    const problem = normalizeCommunicationProblem(fixture.request, fixture.suppliedContext);
    const skillContext = deriveSkillContext(fixture.request, policy);
    const shadowContext = refineShadowSkillContext(problem, skillContext);
    const context: SkillAssessmentRequest["context"] = {
      situationTags: shadowContext.situationTags,
      intentTags: shadowContext.intentTags,
      language: shadowContext.language,
      draftPresent: shadowContext.draftPresent,
      ambiguityMaterial: shadowContext.ambiguityMaterial,
    };
    const legacy = legacyEngine.select(skillContext);
    const evidence = projectSkillEvidence(problem, shadowContext, policy.action);
    const assessmentRequest = {
      action: policy.action,
      taskPurpose: { kind: "PRIMARY_COACHING" as const },
      evidence,
      context,
    };
    const assessmentStarted = performance.now();
    const assessment = assessCommunicationNeeds(assessmentRequest);
    const assessmentDone = performance.now();
    const selectionRequest = SkillSelectionRequestSchema.parse({
      ...assessmentRequest,
      assessment,
      maxSkills: 4,
      catalogSnapshotId: snapshot.id,
    });
    const diagnostic = selectEvidenceAwareSkills(selectionRequest, snapshot);
    const selection = diagnostic.result;
    const selectionDone = performance.now();
    const plan = await compiler.compile({
      action: policy.action,
      selection,
      evidence,
      context,
      constraints: [],
      catalogSnapshotId: snapshot.id,
    });
    const completed = performance.now();
    const comparison = compare(legacy, selection, plan);
    const structural: PipelineStructuralResult = {
      fixtureId: fixture.id,
      action: policy.action,
      catalogSnapshotId: snapshot.id,
      unknownCodes: problem.unknowns,
      evidenceRefs: evidence.map(({ id, kind }) => ({ id, kind })),
      signalIds: assessment.needs.map(({ signalId }) => signalId),
      legacyStatus: legacy.status,
      legacySelected: legacy.selectedSkills.map(({ id, version }) => ({ id, version })),
      selectionStatus: selection.status,
      selected: selection.selectedSkills,
      planStatus: plan.status,
      principleCount: plan.principles.length,
      avoidCount: plan.avoid.length,
      conflictBlocked: diagnostic.conflictBlocked,
      category: comparison.category,
      reasonCodes: comparison.reasonCodes,
    };
    return {
      structural,
      evidence,
      assessment,
      selection,
      plan,
      legacy,
      context,
      timingsMs: {
        assessment: assessmentDone - assessmentStarted,
        selection: selectionDone - assessmentDone,
        compilation: completed - selectionDone,
        full: completed - started,
      },
    };
  };
}
