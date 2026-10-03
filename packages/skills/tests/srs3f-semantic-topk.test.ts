import { describe, expect, it } from "vitest";
import { srs3eSemanticCalibrationRaw } from "../../test-fixtures/src/srs3e-semantic-calibration.js";
import { loadPositiveDocuments, loadProductionSemanticCatalog } from "./srs3e-semantic-model.js";
import {
  retrieveSemanticCandidates,
  type FrozenPositiveVector,
  type SemanticEncoder,
} from "./srs3e-semantic-retrieval.js";
import { retrieveAdmissionFreeTopK } from "./srs3f-semantic-topk.js";

const row = (id: string) => srs3eSemanticCalibrationRaw.find((item) => item.id === id)!;
const digest = "a".repeat(64);
const encoder: SemanticEncoder = {
  tokenCount: () => 4,
  async encode(text) {
    return /friday|rehears|slot/iu.test(text) ? [0.1, 0] : [0, 0.1];
  },
};
async function vectors(): Promise<FrozenPositiveVector[]> {
  return (await loadPositiveDocuments()).map((doc) => ({
    skillId: doc.skillId,
    field: doc.field,
    ordinal: doc.ordinal,
    profileDigest: doc.profileDigest,
    sourceDefinitionDigest: doc.sourceDefinitionDigest,
    vector: doc.skillId === "planning" ? [1, 0] : [0, 1],
  }));
}

describe("SRS-3F-B admission-free shadow Top-K", () => {
  it("ranks every eligible atom including low scores; prefixes are stable and threshold-free", async () => {
    const catalog = await loadProductionSemanticCatalog();
    const frozenVectors = await vectors();
    const request = row("K21").request;
    const result = await retrieveAdmissionFreeTopK({
      request,
      action: "REWRITE_DRAFT",
      catalog,
      vectors: frozenVectors,
      vectorArtifactDigest: digest,
      encoder,
    });
    const prior = await retrieveSemanticCandidates({
      request,
      action: "REWRITE_DRAFT",
      catalog,
      vectors: frozenVectors,
      encoder,
      config: { alpha: 0, threshold: 0.75, topK: 10, configId: "TEST" },
    });
    expect(result.status).toBe("RANKED");
    expect(result.fullEligibleRanking).toHaveLength(result.hardEligibleCount);
    expect(result.top3).toEqual(result.fullEligibleRanking.slice(0, 3));
    expect(result.top5).toEqual(result.fullEligibleRanking.slice(0, 5));
    expect(result.top10).toEqual(result.fullEligibleRanking.slice(0, 10));
    expect(result.top10.length).toBeGreaterThan(0);
    expect(result.top10.some((item) => item.semanticScore < 0.3)).toBe(true);
    for (const item of result.fullEligibleRanking) {
      const old = prior.capabilityTraces.find((trace) => trace.skillId === item.skillId)!;
      expect([
        item.semanticScore,
        item.semanticRank,
        item.winningSource,
        item.winningField,
      ]).toEqual([old.score, old.preThresholdRank, old.winningSource, old.winningField]);
    }
    expect(result).not.toHaveProperty("none");
    expect(result.top10[0]).not.toHaveProperty("confidence");
  });

  it("keeps language modifiers separate and hard-gates evaluation entries", async () => {
    const catalog = await loadProductionSemanticCatalog();
    const result = await retrieveAdmissionFreeTopK({
      request: row("K21").request,
      action: "REWRITE_DRAFT",
      catalog: [
        ...catalog,
        {
          ...catalog.find((item) => item.definition.id === "planning")!,
          catalog: "EVALUATION_ONLY",
        },
      ],
      vectors: await vectors(),
      vectorArtifactDigest: digest,
      encoder,
    });
    expect(result.fullEligibleRanking.every((item) => item.lane === "ATOMIC")).toBe(true);
    expect(result.top10.every((item) => !item.skillId.startsWith("en."))).toBe(true);
    expect(
      result.capabilityEligibility.some(
        (item) => !item.hardEligible && item.reasons.includes("CATALOG_ISOLATED"),
      ),
    ).toBe(true);
    expect(result.modifierEligibility.some((item) => item.hardEligible)).toBe(true);
  });

  it("returns structural emptiness and explicit unsupported-language status without embedding", async () => {
    const catalog = await loadProductionSemanticCatalog();
    const frozenVectors = await vectors();
    const failEncoder: SemanticEncoder = {
      tokenCount: () => {
        throw Error("unexpected embedding");
      },
      encode: async () => {
        throw Error("unexpected embedding");
      },
    };
    const structural = await retrieveAdmissionFreeTopK({
      request: row("K04").request,
      action: "NO_REPLY_NEEDED",
      catalog,
      vectors: frozenVectors,
      vectorArtifactDigest: digest,
      encoder: failEncoder,
    });
    expect(structural.status).toBe("STRUCTURAL_EMPTY");
    expect(structural.top10).toEqual([]);
    const chinese = structuredClone(row("K21").request);
    chinese.analysis.language.primary = "zh";
    chinese.analysis.language.script = "SIMPLIFIED";
    const unsupported = await retrieveAdmissionFreeTopK({
      request: chinese,
      action: "REWRITE_DRAFT",
      catalog,
      vectors: frozenVectors,
      vectorArtifactDigest: digest,
      encoder: failEncoder,
    });
    expect(unsupported.status).toBe("MODEL_UNSUPPORTED_LANGUAGE");
    expect(unsupported.top10).toEqual([]);
  });
});
