import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  buildPhase8aEvidenceManifest,
  PHASE8A_SOURCE_DIGESTS,
} from "./srs3-phase8a-evidence-audit.js";

const manifestUrl = new URL("./fixtures/srs3/phase8a-evidence-manifest.json", import.meta.url);

describe("SRS-3 Phase 8A evidence-reuse audit", () => {
  it("rebuilds the checked-in manifest exactly and accounts for every source item", async () => {
    const expected = JSON.parse(await readFile(manifestUrl, "utf8"));
    const actual = await buildPhase8aEvidenceManifest();
    expect(actual).toEqual(expected);
    expect(actual.sourceSummary).toMatchObject({
      originalRows: 210,
      ledgerProposals: 71,
      remediationReplacements: 35,
      humanApprovalBindings: 34,
      boundaryRecords: 21,
      neighborMatrices: 13,
      capabilityMatrices: 8,
      modifierMatrices: 5,
    });
    expect(actual.auditCounts.relationshipEvaluationOverlap).toBe(0);
    expect(actual.auditCounts).toMatchObject({
      conversionOutcomeCounts: {
        BOUNDARY_RELATIONSHIP_SOURCE: 22,
        EVALUATION_LABEL_SOURCE: 69,
        FAILURE_ANALYSIS_ONLY: 102,
        MODIFIER_SEPARATION_ONLY: 65,
        UNAPPROVED_PROPOSAL_EXCLUDED: 92,
      },
      matrixOverlapLineagesExcludedFromEfficacy: 21,
      scoringRoleLineageCounts: {
        RELATIONSHIP_SOURCE: 22,
        EVALUATION_LABEL_SOURCE: 69,
        REGRESSION_FAILURE_ONLY: 146,
      },
    });
    expect(
      actual.evidenceRecords.every(({ conversionOutcome }) =>
        actual.closedConversionOutcomes.includes(conversionOutcome),
      ),
    ).toBe(true);
    expect(
      actual.evidenceRecords.every(
        ({ eligibilityBasis }) =>
          eligibilityBasis === null || actual.closedEligibilityBases.includes(eligibilityBasis),
      ),
    ).toBe(true);
    expect(actual.productionBoundary).toMatchObject({
      activeDefinitionCount: 21,
      frozenPlanCount: 153,
      runtimeChanged: false,
      rankingImplemented: false,
      newScenariosAuthored: 0,
    });
  });

  it("keeps rejected, quarantined, unresolved, unapproved, modifier, and circular material out of evaluation sources", async () => {
    const manifest = await buildPhase8aEvidenceManifest();
    const eligible = manifest.evidenceRecords.filter(
      ({ eligibleEvaluationSource }) => eligibleEvaluationSource,
    );
    expect(
      eligible.every(({ sourceDecision }) => !["REJECT", "QUARANTINE"].includes(sourceDecision)),
    ).toBe(true);
    expect(
      eligible.every(({ conversionOutcome }) => conversionOutcome === "EVALUATION_LABEL_SOURCE"),
    ).toBe(true);
    expect(eligible.every(({ lane }) => lane === "CAPABILITY")).toBe(true);
    expect(
      eligible.every(
        ({ rankingAnnotationState }) => rankingAnnotationState === "NOT_AUTHORED_IN_PHASE_8A_AUDIT",
      ),
    ).toBe(true);
    expect(manifest.auditCounts.authoredPrimaryLabels).toBe(0);
    expect(manifest.auditCounts.authoredPairwiseLabels).toBe(0);
    expect(
      manifest.evidenceRecords
        .filter(({ conversionOutcome }) => conversionOutcome === "UNAPPROVED_PROPOSAL_EXCLUDED")
        .every(({ eligibleEvaluationSource }) => !eligibleEvaluationSource),
    ).toBe(true);
    expect(
      manifest.evidenceRecords
        .filter(({ eligibilityBasis }) => eligibilityBasis === "APPROVED_REVISION_DEV")
        .every(
          ({ approvalState, approvalDigest }) =>
            approvalState === "EXACT_HUMAN_APPROVED" && approvalDigest !== null,
        ),
    ).toBe(true);
  });

  it("keeps capability relationships, evaluation labels, and modifier separation non-circular", async () => {
    const manifest = await buildPhase8aEvidenceManifest();
    const roles = new Map<string, Set<string>>();
    for (const record of manifest.evidenceRecords) {
      const set = roles.get(record.lineageId) ?? new Set<string>();
      set.add(record.scoringRole);
      roles.set(record.lineageId, set);
    }
    expect([...roles.values()].every((set) => set.size === 1)).toBe(true);
    expect(
      manifest.evidenceRecords
        .filter(({ conversionOutcome }) => conversionOutcome === "MODIFIER_SEPARATION_ONLY")
        .every(
          ({ lane, scoringRole }) =>
            lane === "MODIFIER" && scoringRole === "REGRESSION_FAILURE_ONLY",
        ),
    ).toBe(true);
    expect(
      manifest.evidenceRecords
        .filter(({ scoringRole }) => scoringRole === "RELATIONSHIP_SOURCE")
        .every(
          ({ lane, eligibleEvaluationSource }) =>
            lane === "CAPABILITY" && !eligibleEvaluationSource,
        ),
    ).toBe(true);
    expect(
      manifest.evidenceRecords
        .filter(({ exclusionReasonCodes }) =>
          exclusionReasonCodes.includes("MATRIX_LINEAGE_INDEPENDENCE_UNPROVEN"),
        )
        .every(
          ({ scoringRole, eligibleEvaluationSource }) =>
            scoringRole === "REGRESSION_FAILURE_ONLY" && !eligibleEvaluationSource,
        ),
    ).toBe(true);

    const capabilityMatrixPairs = new Set(
      manifest.evidenceRecords
        .filter(({ recordType, lane }) => recordType === "NEIGHBOR_MATRIX" && lane === "CAPABILITY")
        .map(({ focalSkillId, neighborSkillIds }) =>
          [focalSkillId!, neighborSkillIds[0]!].sort().join("--"),
        ),
    );
    expect(capabilityMatrixPairs.size).toBe(8);
    const matrixOverlaps = manifest.evidenceRecords.filter(
      ({ eligibilityBasis, focalSkillId, neighborSkillIds }) =>
        eligibilityBasis !== null &&
        focalSkillId !== null &&
        neighborSkillIds.some((neighborSkillId) =>
          capabilityMatrixPairs.has([focalSkillId, neighborSkillId].sort().join("--")),
        ),
    );
    expect(new Set(matrixOverlaps.map(({ lineageId }) => lineageId)).size).toBe(21);
    expect(
      matrixOverlaps.every(
        ({ conversionOutcome, scoringRole, eligibleEvaluationSource, exclusionReasonCodes }) =>
          conversionOutcome === "FAILURE_ANALYSIS_ONLY" &&
          scoringRole === "REGRESSION_FAILURE_ONLY" &&
          !eligibleEvaluationSource &&
          exclusionReasonCodes.includes("MATRIX_LINEAGE_INDEPENDENCE_UNPROVEN"),
      ),
    ).toBe(true);

    expect(
      manifest.evidenceRecords.find(
        ({ recordType, sourceKey }) => recordType === "ORIGINAL_ROW" && sourceKey === "planning/A2",
      ),
    ).toMatchObject({
      lineageId: "phase8a-row-planning/A2",
      conversionOutcome: "FAILURE_ANALYSIS_ONLY",
      scoringRole: "REGRESSION_FAILURE_ONLY",
      eligibleEvaluationSource: false,
      exclusionReasonCodes: ["MATRIX_LINEAGE_INDEPENDENCE_UNPROVEN"],
    });
  });

  it("is content-free and binds the immutable source digests", async () => {
    const raw = await readFile(manifestUrl, "utf8");
    expect(raw).not.toMatch(
      /"(?:message|messageText|visibleContext|userIntent|draft|improved|sourceText|rationale|hiddenReasoning|providerPayload)"\s*:/u,
    );
    const manifest = await buildPhase8aEvidenceManifest();
    expect(
      Object.fromEntries(manifest.sourceArtifacts.map(({ path, rawSha256 }) => [path, rawSha256])),
    ).toEqual(PHASE8A_SOURCE_DIGESTS);
    expect(manifest.privacy).toEqual({
      containsRawMessageText: false,
      containsDraftText: false,
      containsFreeTextRationale: false,
      containsHiddenReasoning: false,
      containsRealUserData: false,
    });
    expect(manifest.heldOut).toEqual({ status: "NOT_AUTHORED", read: false, scored: false });
  });
});
