import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { srs3fOperationRaw } from "../../test-fixtures/src/srs3f-operation-raw.js";
import { packageRoot } from "../authoring/generator.js";
import {
  loadOperationCatalog,
  OperationCatalogSchema,
  OperationIdSchema,
} from "../authoring/operation-profiles.js";
import { loadOperationSupport } from "../authoring/operation-skill-support.js";
import { validateOperationCorpus } from "./srs3f-operation-corpus.js";
import {
  detectCommunicationOperations,
  operationPositiveDocuments,
  type OperationPositiveVector,
} from "./srs3f-operation-detector.js";

const row = (id: string) => srs3fOperationRaw.find((item) => item.id === id)!;
const vector = (first: number) => [first, ...Array<number>(383).fill(0)];

describe("SRS-3F-A private communication operations", () => {
  it("validates eleven independent operation profiles and a separate 14-atom support map", async () => {
    const catalog = await loadOperationCatalog();
    const support = await loadOperationSupport();
    expect(catalog.profiles.length).toBe(11);
    expect(new Set(catalog.profiles.map((item) => item.id))).toEqual(
      new Set(OperationIdSchema.options),
    );
    expect(support.skills.length).toBe(14);
    expect(support.skills.every((entry) => entry.operations.length > 0)).toBe(true);
    const docs = operationPositiveDocuments(catalog);
    expect(docs.length).toBe(33);
    expect(new Set(docs.map((doc) => doc.field))).toEqual(new Set(["job", "positiveEvidence"]));
    const invalid = structuredClone(catalog);
    invalid.profiles[0]!.neighbors[0]!.id = invalid.profiles[0]!.id;
    expect(OperationCatalogSchema.safeParse(invalid).success).toBe(false);
  });

  it("holds raw, annotation, review qualification, and mode coverage apart", () => {
    const corpus = validateOperationCorpus();
    expect(corpus.counts).toMatchObject({
      total: 86,
      calibration: 43,
      audit: 43,
      zero: 20,
      multi: 26,
      rewrites: 65,
      suggest: 16,
      distinctFamilies: 86,
    });
    expect(Object.values(corpus.counts.positiveByOperation).every((count) => count >= 8)).toBe(
      true,
    );
    expect(
      corpus.labels.every((item) => item.reviewerType === "CODEX_SELF_REVIEW_PROVISIONAL"),
    ).toBe(true);
  });

  it("never lets OTHER context rescue weak user-draft operation evidence", async () => {
    const catalog = await loadOperationCatalog();
    const vectors: OperationPositiveVector[] = operationPositiveDocuments(catalog).map((doc) => ({
      operationId: doc.operationId,
      field: doc.field,
      ordinal: doc.ordinal,
      profileDigest: doc.profileDigest,
      vector: vector(1),
    }));
    const draft = row("O01").request.analysis.draft.text!;
    const result = await detectCommunicationOperations({
      request: row("O01").request,
      action: "REWRITE_DRAFT",
      catalog,
      vectors,
      encoder: {
        tokenCount: () => 4,
        async encode(text) {
          return vector(text === draft ? 0.1 : 0.9);
        },
      },
      config: {
        id: "TEST",
        threshold: 0.2,
        sourcePolicy: "PRIMARY_WITH_CONTEXT",
        modelDigest: "test-model",
        profileArtifactSha256: "test-profile",
      },
    });
    expect(result.status).toBe("SCORED");
    expect(result.signals).toEqual([]);
    expect(result.allScores.every((item) => item.score === 0.1)).toBe(true);
    expect(result.allScores[0]?.sourceContributions.map(({ source }) => source)).toEqual([
      "USER_DRAFT",
      "OTHER_MESSAGE",
    ]);
  });

  it("returns structural/unsupported outcomes without embeddings", async () => {
    const catalog = await loadOperationCatalog();
    const encoder = {
      tokenCount() {
        throw Error("unexpected encode");
      },
      async encode() {
        throw Error("unexpected encode");
      },
    };
    const config = {
      id: "TEST",
      threshold: 0.3,
      sourcePolicy: "PRIMARY_ONLY" as const,
      modelDigest: "test-model",
      profileArtifactSha256: "test-profile",
    };
    const none = await detectCommunicationOperations({
      request: row("O70").request,
      action: "NO_REPLY_NEEDED",
      catalog,
      vectors: [],
      encoder,
      config,
    });
    expect(none.status).toBe("STRUCTURAL_EMPTY");
    expect(none.signals).toEqual([]);
    const chinese = structuredClone(row("O01").request);
    chinese.analysis.language.primary = "zh";
    chinese.analysis.language.script = "SIMPLIFIED";
    const unsupported = await detectCommunicationOperations({
      request: chinese,
      action: "REWRITE_DRAFT",
      catalog,
      vectors: [],
      encoder,
      config,
    });
    expect(unsupported.status).toBe("MODEL_UNSUPPORTED_LANGUAGE");
    expect(unsupported.signals).toEqual([]);
  });

  it("does not import skill mapping, skill labels, or a challenge source into the detector", async () => {
    const source = await readFile(
      resolve(packageRoot, "tests/srs3f-operation-detector.ts"),
      "utf8",
    );
    expect(source).not.toContain("operation-skill-support");
    expect(source).not.toContain("srs3f-operation-annotations");
    expect(source).not.toContain("srs3e-semantic-challenge");
    expect(source).not.toContain("SkillContext");
  });

  it("binds provisional audit evidence without authorizing candidate fusion or production", async () => {
    const root = resolve(packageRoot, "tests/fixtures/srs3f");
    const manifest = JSON.parse(
      await readFile(resolve(root, "operation-corpus-freeze-v2.json"), "utf8"),
    ) as {
      reviewQualification: string;
      challengeContentNotInspected: boolean;
      sourceSha256: { raw: string; annotations: string; detector: string };
      coverage: { total: number; zero: number; multi: number };
    };
    const config = JSON.parse(
      await readFile(resolve(root, "operation-config-v2.json"), "utf8"),
    ) as {
      config: { threshold: number; sourcePolicy: string };
      candidateFusionAuthorized: boolean;
    };
    const audit = JSON.parse(await readFile(resolve(root, "operation-audit-v2.json"), "utf8")) as {
      metrics: { cases: number; micro: { hit: number; required: number; predicted: number } };
      independentSemanticReview: string;
      nextIncrementAuthorized: boolean;
    };
    expect(manifest.reviewQualification).toContain("NOT_HUMAN_OR_INDEPENDENT");
    expect(manifest.challengeContentNotInspected).toBe(true);
    expect(manifest.coverage).toMatchObject({ total: 86, zero: 20, multi: 26 });
    expect(
      Object.values(manifest.sourceSha256).every((digest) => /^[a-f0-9]{64}$/.test(digest)),
    ).toBe(true);
    expect(config.config).toEqual({
      id: "SRS-3F-A-OPERATION-DETECTOR-CALIBRATED-2",
      threshold: 0.3,
      sourcePolicy: "PRIMARY_ONLY",
      modelDigest: expect.any(String),
      profileArtifactSha256: expect.any(String),
    });
    expect(config.candidateFusionAuthorized).toBe(false);
    expect(audit.metrics).toMatchObject({
      cases: 43,
      micro: { hit: 12, required: 48, predicted: 43 },
    });
    expect(audit.independentSemanticReview).toBe("PENDING");
    expect(audit.nextIncrementAuthorized).toBe(false);
    const evaluator = await readFile(
      resolve(packageRoot, "../../scripts/evaluate-srs3f-operations.ts"),
      "utf8",
    );
    expect(evaluator).not.toContain("srs3e-semantic-challenge");
    expect(evaluator).not.toContain("fixtures/srs3e/");
  });
});
