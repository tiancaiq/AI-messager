import {
  ApprovedCatalogSnapshotIdSchema,
  CommunicationAssessmentSchema,
  SkillAssessmentRequestSchema,
  SkillPlanCompilationRequestSchema,
  SkillPlanSchema,
  SkillSelectionRequestSchema,
  SkillSelectionResultSchema,
  type CommunicationAssessment,
  type SkillAssessmentRequest,
  type SkillDefinition,
  type SkillPlan,
  type SkillPlanCompilationRequest,
  type SkillSelectionRequest,
  type SkillSelectionResult,
} from "@ai-message-coach/contracts";

import {
  validateApprovedSkillCatalogSnapshot,
  type ApprovedSkillCatalogSnapshot,
} from "./catalog-snapshot.js";

export type { ApprovedSkillCatalogSnapshot } from "./catalog-snapshot.js";

export interface SkillAssessmentPort {
  assess(request: SkillAssessmentRequest): Promise<CommunicationAssessment>;
}

export interface SkillSelector {
  select(request: SkillSelectionRequest): Promise<SkillSelectionResult>;
}

export interface SkillPlanCompiler {
  compile(request: SkillPlanCompilationRequest): Promise<SkillPlan>;
}

function assertEvidenceRefs(references: readonly string[], evidenceIds: ReadonlySet<string>): void {
  if (references.some((reference) => !evidenceIds.has(reference)))
    throw new Error("UNSUPPORTED_EVIDENCE_REFERENCE");
}

function assertApprovedReferences(
  references: readonly { id: string; version: number }[],
  action: SkillSelectionRequest["action"],
  registry: readonly SkillDefinition[],
): void {
  const skills = new Map(registry.map((skill) => [skill.id, skill]));
  for (const reference of references) {
    const skill = skills.get(reference.id);
    if (
      skill?.status !== "ACTIVE" ||
      skill.version !== reference.version ||
      !skill.actions.includes(action)
    )
      throw new Error("UNRESOLVED_APPROVED_SKILL_REFERENCE");
  }
}

function assertSnapshot(
  requestedId: string,
  returnedId: string,
  snapshot: ApprovedSkillCatalogSnapshot,
): readonly SkillDefinition[] {
  const snapshotId = ApprovedCatalogSnapshotIdSchema.parse(snapshot.id);
  if (requestedId !== snapshotId || returnedId !== snapshotId)
    throw new Error("CATALOG_SNAPSHOT_MISMATCH");
  return validateApprovedSkillCatalogSnapshot(snapshot);
}

export function validateCommunicationAssessment(
  rawRequest: SkillAssessmentRequest,
  rawAssessment: CommunicationAssessment,
  allowedSignalIds: ReadonlySet<string>,
): CommunicationAssessment {
  const request = SkillAssessmentRequestSchema.parse(rawRequest);
  const assessment = CommunicationAssessmentSchema.parse(rawAssessment);
  const evidenceIds = new Set(request.evidence.map((item) => item.id));
  for (const need of assessment.needs) {
    if (!allowedSignalIds.has(need.signalId)) throw new Error("UNAPPROVED_COMMUNICATION_SIGNAL");
    assertEvidenceRefs(need.evidenceRefs, evidenceIds);
  }
  return assessment;
}

/** B1's deterministic default is deliberately unassessed; B2 owns real assessment. */
export function createDeterministicSkillAssessor(): SkillAssessmentPort {
  return {
    async assess(rawRequest) {
      const request = SkillAssessmentRequestSchema.parse(rawRequest);
      return validateCommunicationAssessment(
        request,
        {
          status: "UNASSESSED",
          needs: [],
          uncertaintyCodes: [],
        },
        new Set(),
      );
    },
  };
}

export function validateSkillSelectionResult(
  rawRequest: SkillSelectionRequest,
  rawResult: SkillSelectionResult,
  snapshot: ApprovedSkillCatalogSnapshot,
  allowedSignalIds: ReadonlySet<string>,
): SkillSelectionResult {
  const request = SkillSelectionRequestSchema.parse(rawRequest);
  const result = SkillSelectionResultSchema.parse(rawResult);
  const registry = assertSnapshot(request.catalogSnapshotId, result.catalogSnapshotId, snapshot);
  validateCommunicationAssessment(
    {
      action: request.action,
      taskPurpose: request.taskPurpose,
      evidence: request.evidence,
      context: request.context,
    },
    request.assessment,
    allowedSignalIds,
  );
  if (result.selectedSkills.length > request.maxSkills)
    throw new Error("SKILL_SELECTION_LIMIT_EXCEEDED");
  if (result.status === "SELECTED" && request.assessment.status !== "ASSESSED")
    throw new Error("SELECTION_REQUIRES_ASSESSMENT");
  assertApprovedReferences(result.selectedSkills, request.action, registry);
  const evidenceIds = new Set(request.evidence.map((item) => item.id));
  for (const reason of result.reasons) assertEvidenceRefs(reason.evidenceRefs, evidenceIds);
  return result;
}

export function validateSkillPlan(
  rawRequest: SkillPlanCompilationRequest,
  rawPlan: SkillPlan,
  snapshot: ApprovedSkillCatalogSnapshot,
): SkillPlan {
  const request = SkillPlanCompilationRequestSchema.parse(rawRequest);
  const plan = SkillPlanSchema.parse(rawPlan);
  const registry = assertSnapshot(request.catalogSnapshotId, plan.catalogSnapshotId, snapshot);
  if (request.selection.catalogSnapshotId !== snapshot.id)
    throw new Error("CATALOG_SNAPSHOT_MISMATCH");
  const evidenceIds = new Set(request.evidence.map((item) => item.id));
  for (const constraint of request.constraints)
    assertEvidenceRefs([constraint.evidenceRef], evidenceIds);
  for (const reason of request.selection.reasons)
    assertEvidenceRefs(reason.evidenceRefs, evidenceIds);

  if (request.selection.status === "NONE" && plan.status !== "NONE")
    throw new Error("SKILL_PLAN_STATUS_MISMATCH");
  if (request.selection.status === "FAILED" && plan.status !== "FAILED")
    throw new Error("SKILL_PLAN_STATUS_MISMATCH");
  if (request.selection.status === "SELECTED" && plan.status === "NONE")
    throw new Error("SKILL_PLAN_STATUS_MISMATCH");
  if (plan.status === "COMPILED")
    assertApprovedReferences(request.selection.selectedSkills, request.action, registry);

  if (
    plan.status !== "FAILED" &&
    (plan.selectedSkills.length !== request.selection.selectedSkills.length ||
      plan.selectedSkills.some(
        (skill, index) =>
          skill.id !== request.selection.selectedSkills[index]?.id ||
          skill.version !== request.selection.selectedSkills[index]?.version,
      ))
  )
    throw new Error("SKILL_PLAN_SELECTION_MISMATCH");

  const selected = new Set(
    request.selection.selectedSkills.map((skill) => `${skill.id}@${skill.version}`),
  );
  for (const item of [
    ...plan.principles,
    ...plan.avoid,
    ...plan.tradeoffs,
    ...plan.recommendations,
  ]) {
    assertEvidenceRefs(item.evidenceRefs, evidenceIds);
    if (item.skillRefs.some((skill) => !selected.has(`${skill.id}@${skill.version}`)))
      throw new Error("UNSELECTED_SKILL_GUIDANCE");
  }
  return plan;
}
