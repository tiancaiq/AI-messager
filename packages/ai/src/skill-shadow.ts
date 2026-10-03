import {
  AgentActionSchema,
  ApprovedCatalogSnapshotIdSchema,
  SkillFailureCodeSchema,
  SkillReferenceSchema,
  SkillSelectionRequestSchema,
  SkillSelectionResultSchema,
  type AgentAction,
  type CommunicationPlan,
  type SkillContext,
  type SkillReference,
  type SkillSelectionRequest,
  type SkillSelectionResult,
} from "@ai-message-coach/contracts";
import {
  assessCommunicationNeeds,
  createApprovedSkillCatalogSnapshot,
  createDeterministicSkillPlanCompiler,
  initialSkillRegistry,
  selectEvidenceAwareSkills,
} from "@ai-message-coach/skills";
import { z } from "zod";

import type { CommunicationProblem } from "./communication-problem.js";
import { projectSkillEvidence } from "./skill-evidence.js";

const snapshot = createApprovedSkillCatalogSnapshot(initialSkillRegistry);
const compiler = createDeterministicSkillPlanCompiler(snapshot);

const SkillShadowTraceSchema = z
  .object({
    path: z.literal("B2_SHADOW"),
    action: AgentActionSchema,
    productionStatus: z.enum(["SELECTED", "NONE", "FAILED"]),
    productionSelected: z.array(SkillReferenceSchema).max(4),
    shadowStatus: z.enum(["SELECTED", "NONE", "FAILED"]),
    shadowSelected: z.array(SkillReferenceSchema).max(4),
    signalIds: z.array(z.string().max(64)).max(8),
    selectionCount: z.number().int().min(0).max(4),
    conflictOutcome: z.enum(["NONE", "BLOCKED", "NOT_COMPARABLE"]),
    languageEligibility: z.enum(["UNIVERSAL_ONLY", "EN", "ZH", "CODE_SWITCHED"]),
    catalogSnapshotId: ApprovedCatalogSnapshotIdSchema,
    comparisonCategory: z.enum([
      "MATCH",
      "EXPECTED_DIFFERENCE",
      "POTENTIAL_IMPROVEMENT",
      "POTENTIAL_REGRESSION",
      "NOT_COMPARABLE",
    ]),
    failureCode: SkillFailureCodeSchema.optional(),
  })
  .strict();

export type SkillShadowTrace = z.infer<typeof SkillShadowTraceSchema>;

const SkillPlanShadowTraceSchema = SkillShadowTraceSchema.extend({
  path: z.literal("B3_SHADOW"),
  planStatus: z.enum(["COMPILED", "NONE", "FAILED"]),
  principleCount: z.number().int().min(0).max(12),
  avoidCount: z.number().int().min(0).max(12),
  guidanceContentEqual: z.boolean(),
  guidanceOrderEqual: z.boolean(),
  planComparisonCategory: SkillShadowTraceSchema.shape.comparisonCategory,
  planFailureCode: SkillFailureCodeSchema.optional(),
}).strict();

export type SkillPlanShadowTrace = z.infer<typeof SkillPlanShadowTraceSchema>;

export function compareSkillReferences(
  production: CommunicationPlan,
  shadow: SkillSelectionResult,
  assessmentInsufficient: boolean,
): SkillShadowTrace["comparisonCategory"] {
  if (production.status === "FAILED" || shadow.status === "FAILED") return "NOT_COMPARABLE";
  const before = production.selectedSkills.map(({ id, version }) => `${id}@${version}`);
  const after = shadow.selectedSkills.map(({ id, version }) => `${id}@${version}`);
  if (before.length === after.length && before.every((item, index) => item === after[index]))
    return "MATCH";
  if (assessmentInsufficient && shadow.status === "NONE") return "EXPECTED_DIFFERENCE";
  if (!before.length && after.length) return "POTENTIAL_IMPROVEMENT";
  if (before.some((item) => !after.includes(item))) return "POTENTIAL_REGRESSION";
  return "EXPECTED_DIFFERENCE";
}

function languageEligibility(
  context: SkillContext | null,
): SkillShadowTrace["languageEligibility"] {
  if (!context) return "UNIVERSAL_ONLY";
  const primary = context.language.primary?.split("-", 1)[0]?.toLowerCase();
  const secondary = context.language.secondary?.split("-", 1)[0]?.toLowerCase();
  if (
    context.language.codeSwitching &&
    (primary === "en" || primary === "zh") &&
    (secondary === "en" || secondary === "zh") &&
    primary !== secondary
  )
    return "CODE_SWITCHED";
  if (primary === "en") return "EN";
  if (primary === "zh") return "ZH";
  return "UNIVERSAL_ONLY";
}

function references(plan: CommunicationPlan): SkillReference[] {
  return plan.selectedSkills.map(({ id, version }) => ({ id, version }));
}

function runB2SkillShadowStages(
  problem: CommunicationProblem | null,
  context: SkillContext | null,
  action: AgentAction,
  productionPlan: CommunicationPlan,
): {
  trace: SkillShadowTrace;
  request: SkillSelectionRequest | null;
  selection: SkillSelectionResult;
} {
  let shadow: SkillSelectionResult;
  let request: SkillSelectionRequest | null = null;
  let signalIds: string[] = [];
  let conflictBlocked = false;
  try {
    if (!problem || !context) throw new Error("MISSING_SHADOW_INPUT");
    const evidence = projectSkillEvidence(problem, context, action);
    const assessmentInput = {
      action,
      taskPurpose: { kind: "PRIMARY_COACHING" as const },
      evidence,
      context: {
        situationTags: context.situationTags,
        intentTags: context.intentTags,
        language: context.language,
        draftPresent: context.draftPresent,
        ambiguityMaterial: context.ambiguityMaterial,
      },
    };
    const assessment = assessCommunicationNeeds(assessmentInput);
    signalIds = assessment.needs.map(({ signalId }) => signalId);
    request = SkillSelectionRequestSchema.parse({
      ...assessmentInput,
      assessment,
      maxSkills: 4,
      catalogSnapshotId: snapshot.id,
    });
    const diagnostic = selectEvidenceAwareSkills(request, snapshot);
    shadow = SkillSelectionResultSchema.parse(diagnostic.result);
    conflictBlocked = diagnostic.conflictBlocked;
  } catch {
    shadow = SkillSelectionResultSchema.parse({
      status: "FAILED",
      selectedSkills: [],
      reasons: [],
      uncertaintyCodes: [],
      failureCode: "SELECTION_FAILED",
      catalogSnapshotId: snapshot.id,
    });
  }
  const trace = SkillShadowTraceSchema.parse({
    path: "B2_SHADOW",
    action,
    productionStatus: productionPlan.status,
    productionSelected: references(productionPlan),
    shadowStatus: shadow.status,
    shadowSelected: shadow.selectedSkills,
    signalIds,
    selectionCount: shadow.selectedSkills.length,
    conflictOutcome:
      shadow.status === "FAILED" ? "NOT_COMPARABLE" : conflictBlocked ? "BLOCKED" : "NONE",
    languageEligibility: languageEligibility(context),
    catalogSnapshotId: snapshot.id,
    comparisonCategory: compareSkillReferences(
      productionPlan,
      shadow,
      shadow.status === "NONE" && signalIds.length === 0,
    ),
    ...(shadow.failureCode ? { failureCode: shadow.failureCode } : {}),
  });
  return { trace, request, selection: shadow };
}

export function runB2SkillShadow(
  problem: CommunicationProblem | null,
  context: SkillContext | null,
  action: AgentAction,
  productionPlan: CommunicationPlan,
): SkillShadowTrace {
  return runB2SkillShadowStages(problem, context, action, productionPlan).trace;
}

function compareGuidance(
  production: CommunicationPlan,
  plan: {
    status: "COMPILED" | "NONE" | "FAILED";
    principles: { text: string }[];
    avoid: { text: string }[];
  },
): Pick<
  SkillPlanShadowTrace,
  "guidanceContentEqual" | "guidanceOrderEqual" | "planComparisonCategory"
> {
  if (production.status === "FAILED" || plan.status === "FAILED")
    return {
      guidanceContentEqual: false,
      guidanceOrderEqual: false,
      planComparisonCategory: "NOT_COMPARABLE",
    };
  const before = [...production.principles, ...production.avoid];
  const after = [
    ...plan.principles.map((item) => item.text),
    ...plan.avoid.map((item) => item.text),
  ];
  const contentEqual =
    before.length === after.length && before.every((text) => after.includes(text));
  const orderEqual =
    production.principles.length === plan.principles.length &&
    production.avoid.length === plan.avoid.length &&
    production.principles.every((text, index) => text === plan.principles[index]?.text) &&
    production.avoid.every((text, index) => text === plan.avoid[index]?.text);
  const statusEqual =
    (production.status === "SELECTED" && plan.status === "COMPILED") ||
    (production.status === "NONE" && plan.status === "NONE");
  return {
    guidanceContentEqual: contentEqual,
    guidanceOrderEqual: orderEqual,
    planComparisonCategory:
      statusEqual && orderEqual
        ? "MATCH"
        : !before.length && after.length
          ? "POTENTIAL_IMPROVEMENT"
          : before.length && !after.length
            ? "POTENTIAL_REGRESSION"
            : "EXPECTED_DIFFERENCE",
  };
}

export async function runB3SkillShadow(
  problem: CommunicationProblem | null,
  context: SkillContext | null,
  action: AgentAction,
  productionPlan: CommunicationPlan,
): Promise<SkillPlanShadowTrace> {
  const { trace, request, selection } = runB2SkillShadowStages(
    problem,
    context,
    action,
    productionPlan,
  );
  let planStatus: SkillPlanShadowTrace["planStatus"] = "FAILED";
  let principleCount = 0;
  let avoidCount = 0;
  let guidanceContentEqual = false;
  let guidanceOrderEqual = false;
  let planComparisonCategory: SkillPlanShadowTrace["planComparisonCategory"] = "NOT_COMPARABLE";
  let planFailureCode: SkillPlanShadowTrace["planFailureCode"] = "COMPILATION_FAILED";
  try {
    if (request) {
      const plan = await compiler.compile({
        action,
        selection,
        evidence: request.evidence,
        context: request.context,
        constraints: [],
        catalogSnapshotId: snapshot.id,
      });
      planStatus = plan.status;
      principleCount = plan.principles.length;
      avoidCount = plan.avoid.length;
      planFailureCode = plan.failureCode;
      ({ guidanceContentEqual, guidanceOrderEqual, planComparisonCategory } = compareGuidance(
        productionPlan,
        plan,
      ));
      if (trace.comparisonCategory !== "MATCH" && planComparisonCategory === "MATCH")
        planComparisonCategory = trace.comparisonCategory;
    }
  } catch {
    // A shadow failure cannot affect the production plan or provider call.
  }
  return SkillPlanShadowTraceSchema.parse({
    ...trace,
    path: "B3_SHADOW",
    planStatus,
    principleCount,
    avoidCount,
    guidanceContentEqual,
    guidanceOrderEqual,
    planComparisonCategory,
    ...(planFailureCode ? { planFailureCode } : {}),
  });
}
