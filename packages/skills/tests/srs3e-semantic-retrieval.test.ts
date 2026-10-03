import { describe, expect, it } from "vitest";
import { srs3eSemanticCalibrationRaw } from "../../test-fixtures/src/srs3e-semantic-calibration.js";
import { loadPositiveDocuments, loadProductionSemanticCatalog } from "./srs3e-semantic-model.js";
import {
  retrieveSemanticCandidates,
  sourceAwareQuery,
  type FrozenPositiveVector,
  type SemanticEncoder,
} from "./srs3e-semantic-retrieval.js";

const row = (id: string) => srs3eSemanticCalibrationRaw.find((item) => item.id === id)!;
const encoder: SemanticEncoder = {
  tokenCount: () => 4,
  async encode(text) {
    return /friday|rehears|slot/iu.test(text) ? [1, 0] : [0, 1];
  },
};

async function fixtureVectors(): Promise<FrozenPositiveVector[]> {
  const docs = await loadPositiveDocuments();
  return docs.map((doc) => ({
    skillId: doc.skillId,
    field: doc.field,
    ordinal: doc.ordinal,
    profileDigest: doc.profileDigest,
    sourceDefinitionDigest: doc.sourceDefinitionDigest,
    vector: doc.skillId === "planning" ? [1, 0] : [0, 1],
  }));
}

describe("SRS-3E evaluation-only semantic retrieval", () => {
  it("keeps the current draft, selected goal, OTHER messages, and USER history as separate sources", () => {
    const request = structuredClone(row("K19").request);
    request.selection = {
      kind: "ACTION",
      id: "goal",
      label: "Goal",
      intent: "Ask for a status check",
    };
    const fragments = sourceAwareQuery(request, "REWRITE_DRAFT");
    expect(fragments.map(({ source, role }) => [source, role])).toEqual([
      ["USER_DRAFT", "PRIMARY"],
      ["SELECTED_GOAL", "PRIMARY"],
      ["OTHER_MESSAGE", "CONTEXT"],
      ["USER_HISTORY", "CONTEXT"],
    ]);
    expect(
      sourceAwareQuery(row("K20").request, "SUGGEST_REPLY").map((item) => item.source),
    ).toEqual(["SELECTED_GOAL", "OTHER_MESSAGE"]);
    expect(sourceAwareQuery(row("K04").request, "NO_REPLY_NEEDED")).toEqual([]);
  });

  it("uses only positive profile fields, never exclusion or neighbor text", async () => {
    const docs = await loadPositiveDocuments();
    expect(new Set(docs.map((item) => item.skillId)).size).toBe(14);
    expect(new Set(docs.map((item) => item.field))).toEqual(
      new Set(["job", "useWhen", "semanticTriggers"]),
    );
    expect(docs.every((item) => item.text.length > 0)).toBe(true);
  });

  it("records pre-threshold rank and threshold loss without turning relevance into confidence", async () => {
    const catalog = await loadProductionSemanticCatalog();
    const vectors = await fixtureVectors();
    const request = row("K21").request;
    const result = await retrieveSemanticCandidates({
      request,
      action: "REWRITE_DRAFT",
      catalog,
      vectors,
      encoder,
      config: { alpha: 0, threshold: 0.75, topK: 10, configId: "TEST" },
    });
    const planning = result.capabilityTraces.find((trace) => trace.skillId === "planning")!;
    expect(planning.preThresholdRank).toBe(1);
    expect(planning.topKRank).toBe(1);
    expect(result.topK[0]?.skillId).toBe("planning");
    const highThreshold = await retrieveSemanticCandidates({
      request,
      action: "REWRITE_DRAFT",
      catalog,
      vectors,
      encoder: {
        ...encoder,
        async encode() {
          return [0.5, 0.5];
        },
      },
      config: { alpha: 0, threshold: 0.75, topK: 10, configId: "TEST" },
    });
    expect(highThreshold.topK).toEqual([]);
    expect(
      highThreshold.capabilityTraces.find((trace) => trace.skillId === "planning")?.disappearedAt,
    ).toBe("SEMANTIC_THRESHOLD_MISS");
  });

  it("abstains before embedding for non-wording actions and unsupported languages", async () => {
    const catalog = await loadProductionSemanticCatalog();
    const vectors = await fixtureVectors();
    const failEncoder: SemanticEncoder = {
      tokenCount: () => {
        throw Error("embedded");
      },
      encode: async () => {
        throw Error("embedded");
      },
    };
    const none = await retrieveSemanticCandidates({
      request: row("K04").request,
      action: "NO_REPLY_NEEDED",
      catalog,
      vectors,
      encoder: failEncoder,
      config: { alpha: 0, threshold: 0.3, topK: 10, configId: "TEST" },
    });
    expect(none.topK).toEqual([]);
    const chinese = structuredClone(row("K21").request);
    chinese.analysis.language.primary = "zh";
    chinese.analysis.language.script = "SIMPLIFIED";
    const unsupported = await retrieveSemanticCandidates({
      request: chinese,
      action: "REWRITE_DRAFT",
      catalog,
      vectors,
      encoder: failEncoder,
      config: { alpha: 0, threshold: 0.3, topK: 10, configId: "TEST" },
    });
    expect(unsupported.diagnostics).toContain("MODEL_UNSUPPORTED_LANGUAGE");
    expect(unsupported.topK).toEqual([]);
    expect(
      unsupported.capabilityTraces.find((trace) => trace.skillId === "planning")?.preThresholdRank,
    ).toBeNull();
  });

  it("rejects an unapproved threshold outside the predeclared calibration grid", async () => {
    await expect(
      retrieveSemanticCandidates({
        request: row("K21").request,
        action: "REWRITE_DRAFT",
        catalog: await loadProductionSemanticCatalog(),
        vectors: await fixtureVectors(),
        encoder,
        config: { alpha: 0, threshold: 0.333, topK: 10, configId: "TEST" },
      }),
    ).rejects.toThrow("outside predeclared grid");
  });
});
