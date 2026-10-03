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
  type SkillSelectionResult,
} from "@ai-message-coach/contracts";
import {
  assessCommunicationNeeds,
  createApprovedSkillCatalogSnapshot,
  initialSkillRegistry,
  selectEvidenceAwareSkills,
} from "@ai-message-coach/skills";
import { z } from "zod";

import type { CommunicationProblem } from "./communication-problem.js";
import { projectSkillEvidence } from "./skill-evidence.js";

const snapshot = createApprovedSkillCatalogSnapshot(initialSkillRegistry);

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

export function runB2SkillShadow(
  problem: CommunicationProblem | null,
  context: SkillContext | null,
  action: AgentAction,
  productionPlan: CommunicationPlan,
): SkillShadowTrace {
  let shadow: SkillSelectionResult;
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
    const request = SkillSelectionRequestSchema.parse({
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
  return SkillShadowTraceSchema.parse({
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
}
