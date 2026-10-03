import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { contentDigest, loadAuthoringRegistry, packageRoot } from "../authoring/generator.js";

const root = resolve(packageRoot, "../..");

export const PHASE8A_SOURCE_DIGESTS = {
  "packages/skills/tests/fixtures/phase8/codex-semantic-review.json":
    "16b6a2606b7b6f3724a0c3f4fce899b261709c6f88ceab4a303fdbc3efc58dec",
  "packages/skills/tests/fixtures/phase8/focused-human-approval.json":
    "a755dba45b4e522981de9246672d4b37f49b38316d564ec4e475b87d294c8c2a",
  "packages/skills/tests/fixtures/phase8/weak-invalid-remediation.json":
    "16d5a358a1cd747428dd0f2574cf9707584a23de3a9b07625abe38947c9d9fd5",
  "packages/skills/tests/fixtures/phase8/weak-invalid-rereview.json":
    "262cf217be3e8d06feb0b8c0a24e1057607698623f70f2ea32dbde05e7ed63bc",
  "docs/skills/phase-8-codex-semantic-review.md":
    "224b788f47a26ee29461adb4fe2d39e8900d5fc17a59b0d85530a7b35f040dc6",
} as const;

type SourcePath = keyof typeof PHASE8A_SOURCE_DIGESTS;
const CLOSED_CONVERSION_OUTCOMES = [
  "BOUNDARY_RELATIONSHIP_SOURCE",
  "EVALUATION_LABEL_SOURCE",
  "MODIFIER_SEPARATION_ONLY",
  "FAILURE_ANALYSIS_ONLY",
  "UNAPPROVED_PROPOSAL_EXCLUDED",
] as const;
const CLOSED_ELIGIBILITY_BASES = ["RESOLVED_ORIGINAL_DEV", "APPROVED_REVISION_DEV"] as const;
type ConversionOutcome = (typeof CLOSED_CONVERSION_OUTCOMES)[number];
type EligibilityBasis = (typeof CLOSED_ELIGIBILITY_BASES)[number] | null;
type ScoringRole = "RELATIONSHIP_SOURCE" | "EVALUATION_LABEL_SOURCE" | "REGRESSION_FAILURE_ONLY";
type BoundaryShape =
  "FOCAL_ONLY" | "NEIGHBOR_ONLY" | "BOTH_VALID" | "NEITHER" | "CONTEXT_INSUFFICIENT";

interface Example {
  action: string;
  language: { primary: string; secondary: string | null; codeSwitching: boolean };
  expected: string[];
  acceptable: string[];
  forbidden: string[];
  draft?: string;
}

interface NeighborDecision {
  classification: BoundaryShape;
  required: string[];
  acceptable: string[];
  forbidden: string[];
  conceptualNeighbors?: string[];
}

interface ReviewRow {
  key: string;
  skillId: string;
  category: string;
  reviewerType: string;
  decision: "KEEP" | "REVISE" | "REJECT" | "QUARANTINE";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  boundaryValid: boolean;
  neighborDecision: NeighborDecision;
  futureUse: { developmentEvaluation: string };
  humanEscalation: { required: boolean };
  source: {
    path: string;
    rawSha256: string;
    exampleDigest: string;
    definitionDigest: string;
    recordDigest: string;
    reviewContextDigest: string;
  };
  originalExample: Example;
  proposedRevision: null | {
    proposedExampleDigest: string;
    example: Example;
  };
}

interface ReviewArtifact {
  reviewerType: string;
  startingFiles: Record<string, string>;
  boundaries: Array<{
    skillId: string;
    nearestNeighbors: string;
  }>;
  neighborPatterns: Array<{ a: string; b: string }>;
  rows: ReviewRow[];
  duplicateDecisions: Array<{ keys: string[]; decision: string }>;
  candidateBoundaryFindings: Array<{ candidate: string; code: string; evidenceKeys: string[] }>;
}

interface RemediationRow {
  key: string;
  revision: number;
  originalDecision: ReviewRow["decision"];
  originalBinding: {
    path: string;
    rawSha256: string;
    exampleDigest: string;
    definitionDigest: string;
    recordDigest: string;
    reviewContextDigest: string;
    reviewRowDigest: string;
    reviewRawSha256: string;
  };
  replacement: Example;
  replacementDigest: string;
  unresolvedOriginalQuestion: boolean;
}

interface RereviewRow {
  key: string;
  reviewerType: string;
  decision: "KEEP";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  boundaryValid: boolean;
  neighborDecision: NeighborDecision;
  source: {
    artifactPath: string;
    artifactRawSha256: string;
    artifactRevision: number;
    replacementDigest: string;
    remediationRowDigest: string;
    definitionPath: string;
    definitionDigest: string;
  };
}

interface ApprovalRow {
  key: string;
  group: string;
  decision: "ACCEPT";
  reviewedRevision: "ORIGINAL_CANONICAL" | "REPLACEMENT_REVISION_1";
  reviewedContent: Example;
  reviewedContentDigest: string;
  definitionDigest: string;
  originalReviewRowDigest: string;
  remediationRowDigest: string | null;
  secondReviewRowDigest: string | null;
  originalDisposition: ReviewRow["decision"];
  originalGoldApproved: boolean;
  humanApproval: true;
  approvalDigest: string;
}

interface ApprovalArtifact {
  reviewerType: string;
  revision: number;
  sourceBindings: Record<string, string>;
  rows: ApprovalRow[];
  approvalSetDigest: string;
}

interface RemediationArtifact {
  revision: number;
  reviewerType: string;
  rows: RemediationRow[];
}

interface RereviewArtifact {
  reviewerType: string;
  rows: RereviewRow[];
}

interface Coverage {
  boundaryShape: BoundaryShape;
  assistanceMode:
    | "REWRITE_DRAFT"
    | "COMPLETE_DRAFT"
    | "EMPTY_DRAFT_SUGGEST_REPLY"
    | "DRAFT_PRESENT_SUGGEST_REPLY"
    | "NON_WORDING";
  language:
    | "ENGLISH"
    | "SIMPLIFIED_CHINESE"
    | "TRADITIONAL_CHINESE"
    | "CHINESE_SCRIPT_UNSPECIFIED"
    | "SUPPORTED_CODE_SWITCHING"
    | "UNSUPPORTED_PRIMARY";
  setting: "STRUCTURED_SETTING_UNAVAILABLE";
  action: string;
  strictNone: boolean;
}

interface EvidenceRecord {
  recordType:
    | "ORIGINAL_ROW"
    | "LEDGER_PROPOSAL"
    | "REMEDIATION_REPLACEMENT"
    | "BOUNDARY_RECORD"
    | "NEIGHBOR_MATRIX";
  sourceArtifact: SourcePath;
  sourceArtifactDigest: string;
  sourceKey: string;
  sourceRevision: string;
  itemDigest: string;
  reviewedContentDigest: string | null;
  reviewerType: string;
  sourceDecision: string;
  confidence: string;
  approvalState:
    "EXACT_HUMAN_APPROVED" | "CODEX_REVIEW_DEV_ALLOWED" | "NOT_APPROVED" | "NOT_APPLICABLE";
  approvalDigest: string | null;
  conversionOutcome: ConversionOutcome;
  eligibilityBasis: EligibilityBasis;
  eligibleEvaluationSource: boolean;
  rankingAnnotationState: "NOT_AUTHORED_IN_PHASE_8A_AUDIT";
  reviewedSelection: {
    required: string[];
    acceptable: string[];
    forbidden: string[];
  } | null;
  exclusionReasonCodes: string[];
  lineageId: string;
  scoringRole: ScoringRole;
  lane: "CAPABILITY" | "MODIFIER";
  focalSkillId: string | null;
  neighborSkillIds: string[];
  definitionBindings: Array<{
    skillId: string;
    path: string;
    rawSha256: string;
    definitionDigest: string;
    recordDigest: string;
    reviewContextDigest: string;
  }>;
  coverage: Coverage | null;
}

interface InternalRecord extends EvidenceRecord {
  pairReferences: string[];
}

const reviewPath = "packages/skills/tests/fixtures/phase8/codex-semantic-review.json";
const approvalPath = "packages/skills/tests/fixtures/phase8/focused-human-approval.json";
const remediationPath = "packages/skills/tests/fixtures/phase8/weak-invalid-remediation.json";
const rereviewPath = "packages/skills/tests/fixtures/phase8/weak-invalid-rereview.json";

const targetPairs = [
  ["request", "clarification"],
  ["request", "ask_for_help"],
  ["request", "give_constructive_feedback"],
  ["follow_up", "request"],
  ["boundary_setting", "decline"],
  ["boundary_setting", "de_escalation"],
  ["planning", "expectation_setting"],
  ["planning", "status_update"],
  ["apology", "acknowledge_mistake"],
  ["emotional_validation", "reassurance"],
  ["emotional_validation", "perspective_acknowledgement"],
  ["status_update", "expectation_setting"],
] as const;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function json<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(resolve(root, path), "utf8")) as T;
}

async function rawDigest(path: string): Promise<string> {
  return createHash("sha256")
    .update(await readFile(resolve(root, path)))
    .digest("hex");
}

function without<T extends Record<string, unknown>>(value: T, key: string) {
  return Object.fromEntries(Object.entries(value).filter(([name]) => name !== key));
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function coverage(example: Example, shape: BoundaryShape): Coverage {
  const primary = example.language.primary.toLowerCase();
  const language =
    example.language.codeSwitching || example.language.secondary
      ? "SUPPORTED_CODE_SWITCHING"
      : primary === "en" || primary.startsWith("en-")
        ? "ENGLISH"
        : primary === "zh-hans"
          ? "SIMPLIFIED_CHINESE"
          : primary === "zh-hant"
            ? "TRADITIONAL_CHINESE"
            : primary === "zh"
              ? "CHINESE_SCRIPT_UNSPECIFIED"
              : "UNSUPPORTED_PRIMARY";
  const assistanceMode =
    example.action === "REWRITE_DRAFT"
      ? "REWRITE_DRAFT"
      : example.action === "COMPLETE_DRAFT"
        ? "COMPLETE_DRAFT"
        : example.action === "SUGGEST_REPLY"
          ? example.draft?.trim()
            ? "DRAFT_PRESENT_SUGGEST_REPLY"
            : "EMPTY_DRAFT_SUGGEST_REPLY"
          : "NON_WORDING";
  return {
    boundaryShape: shape,
    assistanceMode,
    language,
    setting: "STRUCTURED_SETTING_UNAVAILABLE",
    action: example.action,
    strictNone:
      shape === "NEITHER" && example.expected.length === 0 && example.acceptable.length === 0,
  };
}

function exclusions(row: ReviewRow): string[] {
  const reasons: string[] = [];
  if (row.decision === "REVISE") reasons.push("ORIGINAL_REVISE");
  if (row.decision === "REJECT") reasons.push("ORIGINAL_REJECT");
  if (row.decision === "QUARANTINE") reasons.push("ORIGINAL_QUARANTINE");
  if (!row.boundaryValid) reasons.push("BOUNDARY_INVALID");
  if (row.confidence === "LOW") reasons.push("LOW_CONFIDENCE");
  if (row.neighborDecision.classification === "CONTEXT_INSUFFICIENT")
    reasons.push("CONTEXT_INSUFFICIENT");
  if (row.futureUse.developmentEvaluation !== "DEV_EVAL_ALLOWED_AFTER_EXECUTABLE_ANNOTATION")
    reasons.push("DEV_EVAL_NOT_ALLOWED");
  if (row.humanEscalation.required) reasons.push("HUMAN_ESCALATION_ORIGINAL_UNRESOLVED");
  return unique(reasons).sort();
}

function pairReferences(focal: string, decision: NeighborDecision): string[] {
  const references = new Set([
    ...decision.required,
    ...decision.acceptable,
    ...decision.forbidden,
    ...(decision.conceptualNeighbors ?? []),
  ]);
  return targetPairs
    .filter(([a, b]) => (focal === a && references.has(b)) || (focal === b && references.has(a)))
    .map(([a, b]) => `${a}--${b}`);
}

function pairShape(
  focal: string,
  pair: readonly [string, string],
  shape: BoundaryShape,
): "A_ONLY" | "B_ONLY" | "BOTH_VALID" | "NEITHER" | "CONTEXT_INSUFFICIENT" {
  if (shape === "BOTH_VALID" || shape === "NEITHER" || shape === "CONTEXT_INSUFFICIENT")
    return shape;
  if (shape === "FOCAL_ONLY") return focal === pair[0] ? "A_ONLY" : "B_ONLY";
  return focal === pair[0] ? "B_ONLY" : "A_ONLY";
}

function groupedCounts(records: readonly InternalRecord[], field: keyof Coverage) {
  const values = new Map<string, { raw: number; lineages: Set<string> }>();
  for (const record of records) {
    const value = String(record.coverage?.[field]);
    const entry = values.get(value) ?? { raw: 0, lineages: new Set<string>() };
    entry.raw += 1;
    entry.lineages.add(record.lineageId);
    values.set(value, entry);
  }
  return Object.fromEntries(
    [...values.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => [key, { raw: value.raw, deduplicated: value.lineages.size }]),
  );
}

export async function buildPhase8aEvidenceManifest() {
  const [review, approval, remediation, rereview] = await Promise.all([
    json<ReviewArtifact>(reviewPath),
    json<ApprovalArtifact>(approvalPath),
    json<RemediationArtifact>(remediationPath),
    json<RereviewArtifact>(rereviewPath),
  ]);

  for (const [path, expected] of Object.entries(PHASE8A_SOURCE_DIGESTS))
    assert((await rawDigest(path)) === expected, `Phase 8A source digest drift: ${path}`);
  for (const [path, expected] of Object.entries(approval.sourceBindings))
    assert((await rawDigest(path)) === expected, `Focused approval source binding drift: ${path}`);
  assert(review.rows.length === 210, "Phase 8A must contain 210 original rows.");
  assert(review.boundaries.length === 21, "Phase 8A must contain 21 boundary records.");
  assert(review.neighborPatterns.length === 13, "Phase 8A must contain 13 neighbor matrices.");
  assert(remediation.rows.length === 35 && rereview.rows.length === 35, "Replacement set drift.");
  assert(approval.rows.length === 34, "Focused approval set drift.");

  const uniqueKeys = (values: readonly string[], label: string) =>
    assert(new Set(values).size === values.length, `Duplicate ${label} keys.`);
  uniqueKeys(
    review.rows.map(({ key }) => key),
    "review row",
  );
  uniqueKeys(
    remediation.rows.map(({ key }) => key),
    "remediation",
  );
  uniqueKeys(
    rereview.rows.map(({ key }) => key),
    "rereview",
  );
  uniqueKeys(
    approval.rows.map(({ key }) => key),
    "approval",
  );

  const rowByKey = new Map(review.rows.map((row) => [row.key, row]));
  const remediationByKey = new Map(remediation.rows.map((row) => [row.key, row]));
  const rereviewByKey = new Map(rereview.rows.map((row) => [row.key, row]));
  const approvalByKey = new Map(approval.rows.map((row) => [row.key, row]));
  const { records: authoringRecords } = await loadAuthoringRegistry();
  const authoringById = new Map(authoringRecords.map((record) => [record.definition.id, record]));

  for (const row of review.rows) {
    assert(["KEEP", "REVISE", "REJECT", "QUARANTINE"].includes(row.decision), "Unknown decision.");
    assert(
      (await rawDigest(row.source.path)) === row.source.rawSha256,
      `Definition drift: ${row.key}`,
    );
    const record = authoringById.get(row.skillId);
    assert(record, `Missing definition: ${row.skillId}`);
    assert(contentDigest(record) === row.source.recordDigest, `Record digest drift: ${row.key}`);
    assert(
      contentDigest(record.definition) === row.source.definitionDigest,
      `Definition digest drift: ${row.key}`,
    );
    assert(
      contentDigest(row.originalExample) === row.source.exampleDigest,
      `Example drift: ${row.key}`,
    );
  }

  for (const row of approval.rows) {
    const original = rowByKey.get(row.key);
    assert(original, `Approval has unknown original: ${row.key}`);
    assert(
      contentDigest(original) === row.originalReviewRowDigest,
      `Approval original drift: ${row.key}`,
    );
    assert(
      row.definitionDigest === original.source.definitionDigest,
      `Approval definition drift: ${row.key}`,
    );
    assert(
      contentDigest(row.reviewedContent) === row.reviewedContentDigest,
      `Approval content drift: ${row.key}`,
    );
    if (row.reviewedRevision === "ORIGINAL_CANONICAL") {
      assert(
        row.reviewedContentDigest === original.source.exampleDigest,
        `Original approval mismatch: ${row.key}`,
      );
      assert(row.originalGoldApproved, `Original approval does not approve gold: ${row.key}`);
      assert(
        row.remediationRowDigest === null && row.secondReviewRowDigest === null,
        `Unexpected replacement chain: ${row.key}`,
      );
    } else {
      const replacement = remediationByKey.get(row.key);
      const second = rereviewByKey.get(row.key);
      assert(replacement && second, `Replacement approval chain is incomplete: ${row.key}`);
      assert(
        row.reviewedContentDigest === replacement.replacementDigest &&
          row.reviewedContentDigest === second.source.replacementDigest,
        `Replacement digest mismatch: ${row.key}`,
      );
      assert(
        row.remediationRowDigest === contentDigest(replacement),
        `Remediation row drift: ${row.key}`,
      );
      assert(
        row.secondReviewRowDigest === contentDigest(second),
        `Second review drift: ${row.key}`,
      );
      assert(!row.originalGoldApproved, `Replacement approval leaked to original: ${row.key}`);
    }
    assert(
      contentDigest(without(row as unknown as Record<string, unknown>, "approvalDigest")) ===
        row.approvalDigest,
      `Approval digest drift: ${row.key}`,
    );
  }
  assert(contentDigest(approval.rows) === approval.approvalSetDigest, "Approval set digest drift.");

  const capabilityIds = new Set(
    review.rows.filter((row) => row.source.path.includes("/atomic/")).map(({ skillId }) => skillId),
  );
  assert(capabilityIds.size === 14, "Capability lane drift.");
  const capabilityMatrixPairs = new Set(
    review.neighborPatterns
      .filter(({ a, b }) => capabilityIds.has(a) && capabilityIds.has(b))
      .map(({ a, b }) => [a, b].sort().join("--")),
  );
  assert(capabilityMatrixPairs.size === 8, "Capability matrix split drift.");

  const lineageByKey = new Map<string, string>();
  review.duplicateDecisions.forEach((group, index) => {
    for (const key of group.keys) {
      assert(!lineageByKey.has(key), `Duplicate lineage assignment: ${key}`);
      lineageByKey.set(key, `phase8a-shared-family-${String(index + 1).padStart(2, "0")}`);
    }
  });
  for (const row of review.rows)
    if (!lineageByKey.has(row.key)) lineageByKey.set(row.key, `phase8a-row-${row.key}`);

  const definitionBinding = (row: ReviewRow) => ({
    skillId: row.skillId,
    path: row.source.path,
    rawSha256: row.source.rawSha256,
    definitionDigest: row.source.definitionDigest,
    recordDigest: row.source.recordDigest,
    reviewContextDigest: row.source.reviewContextDigest,
  });

  const records: InternalRecord[] = [];
  for (const row of review.rows) {
    const originalApproval = approvalByKey.get(row.key);
    const eligible =
      row.decision === "KEEP" &&
      row.boundaryValid &&
      row.confidence !== "LOW" &&
      row.neighborDecision.classification !== "CONTEXT_INSUFFICIENT" &&
      row.futureUse.developmentEvaluation === "DEV_EVAL_ALLOWED_AFTER_EXECUTABLE_ANNOTATION";
    records.push({
      recordType: "ORIGINAL_ROW",
      sourceArtifact: reviewPath,
      sourceArtifactDigest: PHASE8A_SOURCE_DIGESTS[reviewPath],
      sourceKey: row.key,
      sourceRevision: "ORIGINAL_CANONICAL",
      itemDigest: contentDigest(row),
      reviewedContentDigest: row.source.exampleDigest,
      reviewerType: row.reviewerType,
      sourceDecision: row.decision,
      confidence: row.confidence,
      approvalState:
        originalApproval?.reviewedRevision === "ORIGINAL_CANONICAL"
          ? "EXACT_HUMAN_APPROVED"
          : eligible
            ? "CODEX_REVIEW_DEV_ALLOWED"
            : "NOT_APPROVED",
      approvalDigest:
        originalApproval?.reviewedRevision === "ORIGINAL_CANONICAL"
          ? originalApproval.approvalDigest
          : null,
      conversionOutcome: eligible ? "EVALUATION_LABEL_SOURCE" : "FAILURE_ANALYSIS_ONLY",
      eligibilityBasis: eligible ? "RESOLVED_ORIGINAL_DEV" : null,
      eligibleEvaluationSource: eligible && capabilityIds.has(row.skillId),
      rankingAnnotationState: "NOT_AUTHORED_IN_PHASE_8A_AUDIT",
      reviewedSelection: {
        required: row.neighborDecision.required,
        acceptable: row.neighborDecision.acceptable,
        forbidden: row.neighborDecision.forbidden,
      },
      exclusionReasonCodes: eligible ? [] : exclusions(row),
      lineageId: lineageByKey.get(row.key)!,
      scoringRole: "REGRESSION_FAILURE_ONLY",
      lane: capabilityIds.has(row.skillId) ? "CAPABILITY" : "MODIFIER",
      focalSkillId: row.skillId,
      neighborSkillIds: unique([
        ...row.neighborDecision.required,
        ...row.neighborDecision.acceptable,
        ...row.neighborDecision.forbidden,
        ...(row.neighborDecision.conceptualNeighbors ?? []),
      ]).sort(),
      definitionBindings: [definitionBinding(row)],
      coverage: coverage(row.originalExample, row.neighborDecision.classification),
      pairReferences: pairReferences(row.skillId, row.neighborDecision),
    });
    if (row.proposedRevision) {
      records.push({
        recordType: "LEDGER_PROPOSAL",
        sourceArtifact: reviewPath,
        sourceArtifactDigest: PHASE8A_SOURCE_DIGESTS[reviewPath],
        sourceKey: row.key,
        sourceRevision: "LEDGER_PROPOSAL_REVISION_1",
        itemDigest: contentDigest(row.proposedRevision),
        reviewedContentDigest: row.proposedRevision.proposedExampleDigest,
        reviewerType: row.reviewerType,
        sourceDecision: "PROPOSED_NOT_APPROVED",
        confidence: row.confidence,
        approvalState: "NOT_APPROVED",
        approvalDigest: null,
        conversionOutcome: "UNAPPROVED_PROPOSAL_EXCLUDED",
        eligibilityBasis: null,
        eligibleEvaluationSource: false,
        rankingAnnotationState: "NOT_AUTHORED_IN_PHASE_8A_AUDIT",
        reviewedSelection: null,
        exclusionReasonCodes: [
          "PROPOSAL_NOT_HUMAN_APPROVED",
          ...(remediationByKey.has(row.key) ? ["SUPERSEDED_BY_REMEDIATION_REVISION"] : []),
        ],
        lineageId: lineageByKey.get(row.key)!,
        scoringRole: "REGRESSION_FAILURE_ONLY",
        lane: capabilityIds.has(row.skillId) ? "CAPABILITY" : "MODIFIER",
        focalSkillId: row.skillId,
        neighborSkillIds: [],
        definitionBindings: [definitionBinding(row)],
        coverage: coverage(row.proposedRevision.example, row.neighborDecision.classification),
        pairReferences: [],
      });
    }
  }

  for (const replacement of remediation.rows) {
    const original = rowByKey.get(replacement.key)!;
    const second = rereviewByKey.get(replacement.key)!;
    const accepted = approvalByKey.get(replacement.key);
    const approved = accepted?.reviewedRevision === "REPLACEMENT_REVISION_1";
    assert(second, `Missing second review: ${replacement.key}`);
    assert(
      replacement.originalBinding.reviewRowDigest === contentDigest(original),
      `Remediation original binding drift: ${replacement.key}`,
    );
    assert(
      replacement.originalBinding.reviewRawSha256 === PHASE8A_SOURCE_DIGESTS[reviewPath],
      `Remediation source digest drift: ${replacement.key}`,
    );
    assert(
      contentDigest(replacement.replacement) === replacement.replacementDigest,
      `Replacement content drift: ${replacement.key}`,
    );
    assert(
      second.source.remediationRowDigest === contentDigest(replacement),
      `Rereview remediation binding drift: ${replacement.key}`,
    );
    records.push({
      recordType: "REMEDIATION_REPLACEMENT",
      sourceArtifact: remediationPath,
      sourceArtifactDigest: PHASE8A_SOURCE_DIGESTS[remediationPath],
      sourceKey: replacement.key,
      sourceRevision: `REMEDIATION_REVISION_${replacement.revision}`,
      itemDigest: contentDigest(replacement),
      reviewedContentDigest: replacement.replacementDigest,
      reviewerType: `${remediation.reviewerType}+${second.reviewerType}`,
      sourceDecision: second.decision,
      confidence: second.confidence,
      approvalState: approved ? "EXACT_HUMAN_APPROVED" : "NOT_APPROVED",
      approvalDigest: approved ? accepted.approvalDigest : null,
      conversionOutcome: approved ? "EVALUATION_LABEL_SOURCE" : "UNAPPROVED_PROPOSAL_EXCLUDED",
      eligibilityBasis: approved ? "APPROVED_REVISION_DEV" : null,
      eligibleEvaluationSource: approved && capabilityIds.has(original.skillId),
      rankingAnnotationState: "NOT_AUTHORED_IN_PHASE_8A_AUDIT",
      reviewedSelection: {
        required: second.neighborDecision.required,
        acceptable: second.neighborDecision.acceptable,
        forbidden: second.neighborDecision.forbidden,
      },
      exclusionReasonCodes: approved ? [] : ["REPLACEMENT_NOT_HUMAN_APPROVED"],
      lineageId: lineageByKey.get(replacement.key)!,
      scoringRole: "REGRESSION_FAILURE_ONLY",
      lane: capabilityIds.has(original.skillId) ? "CAPABILITY" : "MODIFIER",
      focalSkillId: original.skillId,
      neighborSkillIds: unique([
        ...second.neighborDecision.required,
        ...second.neighborDecision.acceptable,
        ...second.neighborDecision.forbidden,
      ]).sort(),
      definitionBindings: [definitionBinding(original)],
      coverage: coverage(replacement.replacement, second.neighborDecision.classification),
      pairReferences: pairReferences(original.skillId, second.neighborDecision),
    });
  }

  const sourceRowForSkill = new Map<string, ReviewRow>();
  for (const row of review.rows)
    if (!sourceRowForSkill.has(row.skillId)) sourceRowForSkill.set(row.skillId, row);

  review.boundaries.forEach((boundary) => {
    const row = sourceRowForSkill.get(boundary.skillId)!;
    const capability = capabilityIds.has(boundary.skillId);
    assert(row, `Boundary has unknown skill: ${boundary.skillId}`);
    records.push({
      recordType: "BOUNDARY_RECORD",
      sourceArtifact: reviewPath,
      sourceArtifactDigest: PHASE8A_SOURCE_DIGESTS[reviewPath],
      sourceKey: `boundary:${boundary.skillId}`,
      sourceRevision: "BOUNDARY_RECORD_REVISION_1",
      itemDigest: contentDigest(boundary),
      reviewedContentDigest: null,
      reviewerType: review.reviewerType,
      sourceDecision: "REVIEWED_BOUNDARY",
      confidence: "NOT_RECORDED",
      approvalState: "NOT_APPLICABLE",
      approvalDigest: null,
      conversionOutcome: capability ? "BOUNDARY_RELATIONSHIP_SOURCE" : "MODIFIER_SEPARATION_ONLY",
      eligibilityBasis: null,
      eligibleEvaluationSource: false,
      rankingAnnotationState: "NOT_AUTHORED_IN_PHASE_8A_AUDIT",
      reviewedSelection: null,
      exclusionReasonCodes: capability ? [] : ["MODIFIER_ENDPOINT"],
      lineageId: `phase8a-boundary-${boundary.skillId}`,
      scoringRole: capability ? "RELATIONSHIP_SOURCE" : "REGRESSION_FAILURE_ONLY",
      lane: capability ? "CAPABILITY" : "MODIFIER",
      focalSkillId: boundary.skillId,
      neighborSkillIds: boundary.nearestNeighbors
        .split(";")
        .map((value) => value.trim())
        .filter(Boolean),
      definitionBindings: [definitionBinding(row)],
      coverage: null,
      pairReferences: [],
    });
  });

  review.neighborPatterns.forEach((matrix, index) => {
    const aRow = sourceRowForSkill.get(matrix.a)!;
    const bRow = sourceRowForSkill.get(matrix.b)!;
    assert(aRow && bRow, `Neighbor matrix has unknown endpoint: ${matrix.a}/${matrix.b}`);
    const capability = capabilityIds.has(matrix.a) && capabilityIds.has(matrix.b);
    records.push({
      recordType: "NEIGHBOR_MATRIX",
      sourceArtifact: reviewPath,
      sourceArtifactDigest: PHASE8A_SOURCE_DIGESTS[reviewPath],
      sourceKey: `neighbor-matrix-${String(index + 1).padStart(2, "0")}:${matrix.a}--${matrix.b}`,
      sourceRevision: "NEIGHBOR_MATRIX_REVISION_1",
      itemDigest: contentDigest(matrix),
      reviewedContentDigest: null,
      reviewerType: review.reviewerType,
      sourceDecision: "REVIEWED_NEIGHBOR_MATRIX",
      confidence: "NOT_RECORDED",
      approvalState: "NOT_APPLICABLE",
      approvalDigest: null,
      conversionOutcome: capability ? "BOUNDARY_RELATIONSHIP_SOURCE" : "MODIFIER_SEPARATION_ONLY",
      eligibilityBasis: null,
      eligibleEvaluationSource: false,
      rankingAnnotationState: "NOT_AUTHORED_IN_PHASE_8A_AUDIT",
      reviewedSelection: null,
      exclusionReasonCodes: capability ? [] : ["MODIFIER_ENDPOINT"],
      lineageId: `phase8a-matrix-${matrix.a}--${matrix.b}`,
      scoringRole: capability ? "RELATIONSHIP_SOURCE" : "REGRESSION_FAILURE_ONLY",
      lane: capability ? "CAPABILITY" : "MODIFIER",
      focalSkillId: matrix.a,
      neighborSkillIds: [matrix.b],
      definitionBindings: [definitionBinding(aRow), definitionBinding(bRow)],
      coverage: null,
      pairReferences: capability ? [`${matrix.a}--${matrix.b}`] : [],
    });
  });

  const matrixOverlapLineages = new Set(
    records
      .filter(
        ({ eligibilityBasis, focalSkillId, neighborSkillIds }) =>
          eligibilityBasis !== null &&
          focalSkillId !== null &&
          neighborSkillIds.some((neighborSkillId) =>
            capabilityMatrixPairs.has([focalSkillId, neighborSkillId].sort().join("--")),
          ),
      )
      .map(({ lineageId }) => lineageId),
  );
  for (const record of records) {
    if (record.eligibilityBasis === null) continue;
    if (record.lane === "MODIFIER") {
      record.conversionOutcome = "MODIFIER_SEPARATION_ONLY";
      record.eligibleEvaluationSource = false;
      record.exclusionReasonCodes = unique([
        ...record.exclusionReasonCodes,
        "MODIFIER_LANE_NOT_CAPABILITY_EFFICACY",
      ]).sort();
    } else if (matrixOverlapLineages.has(record.lineageId)) {
      record.conversionOutcome = "FAILURE_ANALYSIS_ONLY";
      record.eligibleEvaluationSource = false;
      record.exclusionReasonCodes = unique([
        ...record.exclusionReasonCodes,
        "MATRIX_LINEAGE_INDEPENDENCE_UNPROVEN",
      ]).sort();
    }
  }
  const evaluationLineages = new Set(
    records
      .filter(({ eligibleEvaluationSource }) => eligibleEvaluationSource)
      .map(({ lineageId }) => lineageId),
  );
  for (const record of records) {
    if (record.scoringRole === "RELATIONSHIP_SOURCE") continue;
    if (evaluationLineages.has(record.lineageId)) record.scoringRole = "EVALUATION_LABEL_SOURCE";
  }

  const roleByLineage = new Map<string, ScoringRole>();
  for (const record of records) {
    const prior = roleByLineage.get(record.lineageId);
    assert(!prior || prior === record.scoringRole, `Circular lineage role: ${record.lineageId}`);
    roleByLineage.set(record.lineageId, record.scoringRole);
  }

  const eligibleEvaluation = records.filter(
    ({ eligibleEvaluationSource }) => eligibleEvaluationSource,
  );
  const pairCoverage = targetPairs.map((pair) => {
    const pairId = `${pair[0]}--${pair[1]}`;
    const matching = eligibleEvaluation.filter(({ pairReferences }) =>
      pairReferences.includes(pairId),
    );
    const shapes = ["A_ONLY", "B_ONLY", "BOTH_VALID", "NEITHER"] as const;
    const shapeCounts = Object.fromEntries(
      shapes.map((shape) => {
        const matchingShape = matching.filter(
          (record) =>
            pairShape(record.focalSkillId!, pair, record.coverage!.boundaryShape) === shape,
        );
        return [
          shape,
          {
            raw: matchingShape.length,
            deduplicated: new Set(matchingShape.map(({ lineageId }) => lineageId)).size,
          },
        ];
      }),
    );
    return {
      pairId,
      a: pair[0],
      b: pair[1],
      relationshipMatrixAvailable: records.some(
        (record) =>
          record.recordType === "NEIGHBOR_MATRIX" &&
          new Set([record.focalSkillId!, ...record.neighborSkillIds]).has(pair[0]) &&
          new Set([record.focalSkillId!, ...record.neighborSkillIds]).has(pair[1]),
      ),
      evaluationShapeCounts: shapeCounts,
      missingEvaluationShapes: shapes.filter((shape) => shapeCounts[shape]!.deduplicated === 0),
    };
  });

  const outcomeCounts = Object.fromEntries(
    unique(records.map(({ conversionOutcome }) => conversionOutcome))
      .sort()
      .map((outcome) => [
        outcome,
        records.filter(({ conversionOutcome }) => conversionOutcome === outcome).length,
      ]),
  );
  const approvalStateCounts = Object.fromEntries(
    unique(records.map(({ approvalState }) => approvalState))
      .sort()
      .map((state) => [
        state,
        records.filter(({ approvalState }) => approvalState === state).length,
      ]),
  );
  const decisionCounts = Object.fromEntries(
    unique(review.rows.map(({ decision }) => decision))
      .sort()
      .map((decision) => [decision, review.rows.filter((row) => row.decision === decision).length]),
  );
  const roleCounts = Object.fromEntries(
    (["RELATIONSHIP_SOURCE", "EVALUATION_LABEL_SOURCE", "REGRESSION_FAILURE_ONLY"] as const).map(
      (role) => [role, [...roleByLineage.values()].filter((value) => value === role).length],
    ),
  );
  const sourceArtifacts = await Promise.all(
    Object.entries(PHASE8A_SOURCE_DIGESTS).map(async ([path, digest]) => ({
      path,
      rawSha256: digest,
      byteLength: (await readFile(resolve(root, path))).byteLength,
    })),
  );

  const gaps = [
    {
      code: "STRUCTURED_SETTING_LABEL_ABSENT",
      dimension: "SETTING",
      affectedValues: ["WORK", "PERSONAL", "SERVICE"],
    },
    ...(eligibleEvaluation.some(({ coverage }) => coverage?.assistanceMode === "COMPLETE_DRAFT")
      ? []
      : [
          {
            code: "COMPLETE_DRAFT_EVIDENCE_ABSENT",
            dimension: "ASSISTANCE_MODE",
            affectedValues: ["COMPLETE_DRAFT"],
          },
        ]),
    ...(["SIMPLIFIED_CHINESE", "TRADITIONAL_CHINESE", "SUPPORTED_CODE_SWITCHING"] as const)
      .filter(
        (language) => !eligibleEvaluation.some(({ coverage }) => coverage?.language === language),
      )
      .map((language) => ({
        code: "LANGUAGE_EVALUATION_SOURCE_GAP",
        dimension: "LANGUAGE",
        affectedValues: [language],
      })),
    ...(["FOCAL_ONLY", "NEIGHBOR_ONLY", "BOTH_VALID", "NEITHER"] as const)
      .filter(
        (shape) => !eligibleEvaluation.some(({ coverage }) => coverage?.boundaryShape === shape),
      )
      .map((shape) => ({
        code: "GLOBAL_BOUNDARY_SHAPE_GAP",
        dimension: "BOUNDARY_SHAPE",
        affectedValues: [shape],
      })),
    ...pairCoverage
      .filter(({ missingEvaluationShapes }) => missingEvaluationShapes.length > 0)
      .map(({ pairId, missingEvaluationShapes }) => ({
        code: "PAIR_EVALUATION_SHAPE_GAP",
        dimension: "BOUNDARY_SHAPE",
        affectedValues: [pairId, ...missingEvaluationShapes],
      })),
    {
      code: "CAPABILITY_MATRIX_LINEAGE_INDEPENDENCE_UNPROVEN",
      dimension: "NON_CIRCULARITY",
      affectedValues: [...matrixOverlapLineages].sort(),
    },
    {
      code: "CANDIDATE_BOUNDARIES_UNRESOLVED",
      dimension: "CAPABILITY",
      affectedValues: ["give_constructive_feedback", "perspective_acknowledgement", "confirmation"],
    },
  ];

  const publicRecords: EvidenceRecord[] = records.map((record) => {
    const copy: Partial<InternalRecord> = { ...record };
    delete copy.pairReferences;
    return copy as EvidenceRecord;
  });
  return {
    schemaVersion: 1,
    phase: "SRS-3",
    gate: "PHASE_8A_EVIDENCE_REUSE_AUDIT",
    status: "AUDIT_COMPLETE_AWAITING_INDEPENDENT_REVIEW",
    evidenceUse: "EXPOSED_DEVELOPMENT_AUDIT_ONLY",
    generatedDate: "2026-09-28",
    closedConversionOutcomes: [...CLOSED_CONVERSION_OUTCOMES],
    closedEligibilityBases: [...CLOSED_ELIGIBILITY_BASES],
    closedScoringRoles: [
      "RELATIONSHIP_SOURCE",
      "EVALUATION_LABEL_SOURCE",
      "REGRESSION_FAILURE_ONLY",
    ],
    sourceArtifacts,
    sourceSummary: {
      originalRows: review.rows.length,
      ledgerProposals: review.rows.filter(({ proposedRevision }) => proposedRevision !== null)
        .length,
      remediationReplacements: remediation.rows.length,
      humanApprovalBindings: approval.rows.length,
      boundaryRecords: review.boundaries.length,
      neighborMatrices: review.neighborPatterns.length,
      capabilityMatrices: publicRecords.filter(
        ({ recordType, lane }) => recordType === "NEIGHBOR_MATRIX" && lane === "CAPABILITY",
      ).length,
      modifierMatrices: publicRecords.filter(
        ({ recordType, lane }) => recordType === "NEIGHBOR_MATRIX" && lane === "MODIFIER",
      ).length,
      decisionCounts,
      exactHumanApprovedOriginals: approval.rows.filter(
        ({ reviewedRevision }) => reviewedRevision === "ORIGINAL_CANONICAL",
      ).length,
      exactHumanApprovedReplacements: approval.rows.filter(
        ({ reviewedRevision }) => reviewedRevision === "REPLACEMENT_REVISION_1",
      ).length,
    },
    auditCounts: {
      consideredEvidenceRecords: publicRecords.length,
      conversionOutcomeCounts: outcomeCounts,
      approvalStateCounts,
      laneRecordCounts: {
        capability: records.filter(({ lane }) => lane === "CAPABILITY").length,
        modifier: records.filter(({ lane }) => lane === "MODIFIER").length,
      },
      resolvedOrApprovedLaneCounts: {
        capability: records.filter(
          ({ lane, eligibilityBasis }) => lane === "CAPABILITY" && eligibilityBasis !== null,
        ).length,
        modifier: records.filter(
          ({ lane, eligibilityBasis }) => lane === "MODIFIER" && eligibilityBasis !== null,
        ).length,
      },
      resolvedOrApprovedSourceRecords: records.filter(
        ({ eligibilityBasis }) => eligibilityBasis !== null,
      ).length,
      deduplicatedResolvedOrApprovedLineages: new Set(
        records
          .filter(({ eligibilityBasis }) => eligibilityBasis !== null)
          .map(({ lineageId }) => lineageId),
      ).size,
      eligibleEvaluationSourceRecords: eligibleEvaluation.length,
      deduplicatedEvaluationSourceLineages: evaluationLineages.size,
      matrixOverlapLineagesExcludedFromEfficacy: matrixOverlapLineages.size,
      authoredPrimaryLabels: 0,
      authoredPairwiseLabels: 0,
      totalLineages: roleByLineage.size,
      scoringRoleLineageCounts: roleCounts,
      relationshipEvaluationOverlap: 0,
    },
    coverage: {
      population: "NON_CIRCULAR_ELIGIBLE_EVALUATION_SOURCES_ONLY",
      rawRecords: eligibleEvaluation.length,
      deduplicatedLineages: evaluationLineages.size,
      byBoundaryShape: groupedCounts(eligibleEvaluation, "boundaryShape"),
      byAssistanceMode: groupedCounts(eligibleEvaluation, "assistanceMode"),
      byLanguage: groupedCounts(eligibleEvaluation, "language"),
      bySetting: groupedCounts(eligibleEvaluation, "setting"),
      byAction: groupedCounts(eligibleEvaluation, "action"),
      strictNone: {
        raw: eligibleEvaluation.filter(({ coverage }) => coverage?.strictNone).length,
        deduplicated: new Set(
          eligibleEvaluation
            .filter(({ coverage }) => coverage?.strictNone)
            .map(({ lineageId }) => lineageId),
        ).size,
      },
      pairCoverage,
    },
    gaps,
    approvalBindings: approval.rows.map((row) => ({
      sourceArtifact: approvalPath,
      sourceArtifactDigest: PHASE8A_SOURCE_DIGESTS[approvalPath],
      sourceKey: row.key,
      approvalGroup: row.group,
      reviewedRevision: row.reviewedRevision,
      reviewedContentDigest: row.reviewedContentDigest,
      definitionDigest: row.definitionDigest,
      originalReviewRowDigest: row.originalReviewRowDigest,
      remediationRowDigest: row.remediationRowDigest,
      secondReviewRowDigest: row.secondReviewRowDigest,
      originalDisposition: row.originalDisposition,
      originalGoldApproved: row.originalGoldApproved,
      approvalDigest: row.approvalDigest,
    })),
    evidenceRecords: publicRecords,
    unresolvedCandidateFindings: review.candidateBoundaryFindings.map(
      ({ candidate, code, evidenceKeys }) => ({
        candidate,
        code,
        evidenceKeys,
        conversionOutcome: "FAILURE_ANALYSIS_ONLY" as const,
        scoringRole: "REGRESSION_FAILURE_ONLY" as const,
      }),
    ),
    privacy: {
      containsRawMessageText: false,
      containsDraftText: false,
      containsFreeTextRationale: false,
      containsHiddenReasoning: false,
      containsRealUserData: false,
    },
    heldOut: { status: "NOT_AUTHORED", read: false, scored: false },
    productionBoundary: {
      activeDefinitionCount: 21,
      frozenPlanCount: 153,
      contextProfile: "CURRENT",
      runtimeChanged: false,
      metadataChanged: false,
      rankingImplemented: false,
      newScenariosAuthored: 0,
    },
  };
}
