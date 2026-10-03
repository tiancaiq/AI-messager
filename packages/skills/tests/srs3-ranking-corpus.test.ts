import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { srs25RawScenarios } from "../../test-fixtures/src/srs2-5-context-normalization.js";
import { srs3RawScenarios } from "../../test-fixtures/src/srs3-ranking-development.js";
import { buildSrs2Catalog } from "./srs2-shadow-retrieval.js";
import {
  FROZEN_SRS3A_MANIFEST_SHA256,
  Srs3AnnotationSchema,
  Srs3RawScenarioSchema,
  loadSrs3Corpus,
  observeSrs3RawOnly,
  summarizeSrs3Coverage,
  validateRankingCorpus,
  validateSrs3AuthoringMetadata,
  validateSourceTriage,
} from "./srs3-ranking-corpus.js";

interface EvidenceFixture {
  sourceKey: string;
  lineageId: string;
  sourceRevision: string;
  sourceArtifact: string;
  sourceArtifactDigest: string;
  itemDigest: string;
  reviewedContentDigest: string | null;
  conversionOutcome: string;
  lane: string;
  recordType: string;
  exclusionReasonCodes: string[];
}

interface AnnotationFixture {
  annotations: Array<{
    scenarioFamily: string;
    source?: unknown;
    required: string[];
    acceptable: string[];
    primary: string[];
    strictNone: boolean;
    shouldRankAbove: string[][];
  }>;
}

async function json<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(new URL(path, import.meta.url), "utf8")) as T;
}

async function inputs() {
  const [manifest, triage, annotations, catalog] = await Promise.all([
    json<{ evidenceRecords: EvidenceFixture[] }>("./fixtures/srs3/phase8a-evidence-manifest.json"),
    json<{ entries: Array<{ itemDigest: string }> }>("./fixtures/srs3/source-triage.json"),
    json<AnnotationFixture>("./fixtures/srs3/development-annotations.json"),
    buildSrs2Catalog("PRODUCTION"),
  ]);
  return { manifest, triage, annotations, catalog };
}

describe("SRS-3B exposed ranking corpus", () => {
  it("binds all 69 triage decisions and accounts for independently authored family coverage", async () => {
    const corpus = await loadSrs3Corpus();
    const report = summarizeSrs3Coverage(corpus);
    expect(report.bindings.manifestSha256).toBe(FROZEN_SRS3A_MANIFEST_SHA256);
    expect(report.sourceTriage).toEqual({
      INSUFFICIENT_FOR_RANKING: 37,
      REGRESSION_ONLY: 32,
      ADAPT_TO_RANKING_CASE: 0,
      DUPLICATIVE: 0,
    });
    expect(report).toMatchObject({
      rawScenarios: 41,
      distinctFamilies: 41,
      accepted: 29,
      acceptedFamilies: 29,
      quarantined: 12,
      acceptedRewrite: 14,
      acceptedEmptyDraftSuggest: 14,
      acceptedNonWording: 1,
      acceptedStrictNone: 4,
      acceptedMultiRequired: 7,
      acceptedMultiRequiredNoOrder: 7,
      acceptedPrimaryLabels: 18,
      acceptedPairOrders: 11,
      heldOut: { status: "NOT_AUTHORED", read: false, scored: false },
      baselineCalculated: false,
    });
    expect(report.language).toEqual({
      ENGLISH: { raw: 29, accepted: 29 },
      SIMPLIFIED_CHINESE: { raw: 4, accepted: 0 },
      TRADITIONAL_CHINESE: { raw: 4, accepted: 0 },
      CODE_SWITCHING: { raw: 4, accepted: 0 },
    });
    expect(["WORK", "PERSONAL", "SERVICE"].every((key) => report.setting[key]!.accepted >= 3)).toBe(
      true,
    );
    expect(report.priorityPairCoverage.filter((pair) => pair.aAboveB && pair.bAboveA)).toHaveLength(
      2,
    );
    expect(report.priorityPairCoverage.filter((pair) => pair.bothValidNoOrder)).toHaveLength(5);
    expect(report.acceptedBoundaryExplicitness).toEqual({
      REWRITE_DRAFT: { EXPLICIT: 0, IMPLICIT: 14 },
      SUGGEST_REPLY: { EXPLICIT: 5, IMPLICIT: 9 },
      NO_REPLY_NEEDED: { EXPLICIT: 0, IMPLICIT: 1 },
    });
    expect(report.draftRealism).toEqual({
      ROUGH: 7,
      NORMAL: 7,
      ALREADY_DECENT: 6,
      OVER_POLISHED: 0,
    });
  });

  it("fails closed on stale source bindings, missing triage, and excluded matrix lineages", async () => {
    const { manifest, triage, annotations, catalog } = await inputs();
    const eligible = manifest.evidenceRecords.filter(
      (record) => record.conversionOutcome === "EVALUATION_LABEL_SOURCE",
    );
    expect(eligible).toHaveLength(69);
    expect(
      manifest.evidenceRecords.filter((record) =>
        record.exclusionReasonCodes.includes("MATRIX_LINEAGE_INDEPENDENCE_UNPROVEN"),
      ),
    ).toHaveLength(21);
    expect(
      manifest.evidenceRecords.filter(
        (record) => record.recordType === "NEIGHBOR_MATRIX" && record.lane === "CAPABILITY",
      ),
    ).toHaveLength(8);
    expect(() =>
      validateSourceTriage(
        { ...triage, entries: triage.entries.slice(1) },
        eligible,
        FROZEN_SRS3A_MANIFEST_SHA256,
      ),
    ).toThrow();
    const stale = structuredClone(triage);
    stale.entries[0]!.itemDigest = "sha256:" + "0".repeat(64);
    expect(() => validateSourceTriage(stale, eligible, FROZEN_SRS3A_MANIFEST_SHA256)).toThrow(
      /Stale triage/,
    );
    const excluded = manifest.evidenceRecords.find((record) =>
      record.exclusionReasonCodes.includes("MATRIX_LINEAGE_INDEPENDENCE_UNPROVEN"),
    );
    if (!excluded) throw Error("Expected matrix overlap source.");
    const adapted = structuredClone(annotations);
    adapted.annotations[0]!.source = {
      sourceKind: "PHASE8A_ADAPTED",
      sourceLineage: excluded.lineageId,
      sourceRevision: excluded.sourceRevision,
      sourceItemDigest: excluded.itemDigest,
      sourceArtifactDigest: excluded.sourceArtifactDigest,
      evidenceRole: "EVALUATION_LABEL_SOURCE",
    };
    expect(() =>
      validateRankingCorpus(srs3RawScenarios, adapted, manifest.evidenceRecords, catalog),
    ).toThrow(/Invalid Phase 8A adaptation/);
  });

  it("rejects modifier, candidate, absent, and action-ineligible capability labels", async () => {
    const { manifest, annotations, catalog } = await inputs();
    for (const invalid of ["en.direct_but_polite", "give_constructive_feedback", "confirmation"]) {
      const altered = structuredClone(annotations);
      altered.annotations[0]!.required = [invalid];
      altered.annotations[0]!.acceptable = [];
      altered.annotations[0]!.primary = [invalid];
      altered.annotations[0]!.shouldRankAbove = [];
      expect(() =>
        validateRankingCorpus(srs3RawScenarios, altered, manifest.evidenceRecords, catalog),
      ).toThrow();
    }
    const actionIneligible = structuredClone(annotations);
    actionIneligible.annotations[28]!.required = ["decline"];
    actionIneligible.annotations[28]!.primary = ["decline"];
    actionIneligible.annotations[28]!.strictNone = false;
    expect(() =>
      validateRankingCorpus(srs3RawScenarios, actionIneligible, manifest.evidenceRecords, catalog),
    ).toThrow(/Invalid capability label/);
    const wrongFamily = structuredClone(annotations);
    wrongFamily.annotations[0]!.scenarioFamily = "unrelated-family";
    expect(() =>
      validateRankingCorpus(srs3RawScenarios, wrongFamily, manifest.evidenceRecords, catalog),
    ).toThrow(/Duplicate-family binding drift/);
  });

  it("rejects draft/action/language disagreement and contradictory or cyclic labels", () => {
    const rewrite = structuredClone(srs3RawScenarios[0]!);
    rewrite.request.analysis.draft.text = null;
    expect(Srs3RawScenarioSchema.safeParse(rewrite).success).toBe(false);
    const suggest = structuredClone(srs3RawScenarios[1]!);
    suggest.request.analysis.draft.text = "Unexpected draft";
    expect(Srs3RawScenarioSchema.safeParse(suggest).success).toBe(false);
    const language = structuredClone(srs3RawScenarios[29]!);
    language.languageGroup = "TRADITIONAL_CHINESE";
    expect(Srs3RawScenarioSchema.safeParse(language).success).toBe(false);
    const setting = { ...srs3RawScenarios[0]!, setting: "SCHOOL" };
    expect(Srs3RawScenarioSchema.safeParse(setting).success).toBe(false);
    const none = {
      id: "R26",
      scenarioFamily: "ordinary-receipt-acknowledgement",
      required: ["request"],
      acceptable: [],
      forbidden: [],
      strictNone: true,
      primary: ["request"],
      shouldRankAbove: [],
      reviewState: "ACCEPTED",
      reviewerType: "CODEX_SEMANTIC_REVIEW",
      reviewedRevision: "R1",
      reviewIssueCodes: [],
      reviewerJustification: "This is a synthetic contradictory label for validation.",
      preservation: {
        intent: true,
        facts: true,
        commitments: true,
        certainty: true,
        responsibility: true,
      },
    };
    expect(Srs3AnnotationSchema.safeParse(none).success).toBe(false);
    expect(
      Srs3AnnotationSchema.safeParse({
        ...none,
        id: "R01",
        strictNone: false,
        required: ["request", "clarification"],
        primary: ["request"],
        shouldRankAbove: [
          ["request", "clarification"],
          ["clarification", "request"],
        ],
      }).success,
    ).toBe(false);
  });

  it("keeps multi-required cases unordered and quarantines unreviewed language cases", async () => {
    const corpus = await loadSrs3Corpus();
    const byId = new Map(corpus.annotations.map((item) => [item.id, item]));
    for (const id of ["R13", "R15", "R19", "R22", "R23", "R24", "R25"]) {
      const item = byId.get(id)!;
      expect(item.required).toHaveLength(2);
      expect(item.primary).toEqual([]);
      expect(item.shouldRankAbove).toEqual([]);
    }
    const r23 = corpus.raw.find((item) => item.id === "R23");
    if (!r23 || r23.request.selection?.kind !== "ACTION")
      throw Error("R23 must carry the user's selected status and expectation evidence.");
    expect(r23.revision).toBe("R2");
    expect(byId.get("R23")?.reviewedRevision).toBe("R2");
    expect(r23.request.selection.intent).toContain("refund pending");
    expect(r23.request.selection.intent).toContain("No payment date");
    expect(
      r23.request.analysis.messages.every((message) => !message.text.includes("refund pending")),
    ).toBe(true);
    expect(byId.get("R01")).toMatchObject({
      required: ["request"],
      acceptable: [],
      shouldRankAbove: [],
    });
    expect(byId.get("R41")).toMatchObject({ required: ["expectation_setting"], acceptable: [] });
    for (const id of ["R01", "R03", "R05", "R07", "R09", "R13", "R15", "R19", "R21", "R22", "R24"])
      expect(byId.get(id)?.reviewedRevision).toBe("R2");
    for (const item of corpus.annotations.slice(29)) {
      expect(item.reviewState).toBe("QUARANTINE");
      expect(item.reviewerType).toBe("NONE");
      expect(item.reviewedRevision).toBeNull();
      expect(item.preservation).toBeNull();
      expect(item.reviewIssueCodes).toEqual(["INSUFFICIENT_EVIDENCE"]);
    }
    expect(
      corpus.annotations
        .slice(0, 29)
        .every(
          (item) =>
            item.reviewState === "ACCEPTED" &&
            item.preservation !== null &&
            Object.values(item.preservation).every(Boolean),
        ),
    ).toBe(true);
  });

  it("keeps variant families to one aggregate weight", async () => {
    const corpus = await loadSrs3Corpus();
    const { manifest, annotations, catalog } = await inputs();
    const variants = [...structuredClone(srs3RawScenarios)];
    variants[1]!.scenarioFamily = variants[0]!.scenarioFamily;
    const bound = structuredClone(annotations);
    bound.annotations[1]!.scenarioFamily = variants[0]!.scenarioFamily;
    const checked = validateRankingCorpus(variants, bound, manifest.evidenceRecords, catalog);
    const report = summarizeSrs3Coverage({
      ...corpus,
      raw: checked.raw,
      annotations: checked.annotations,
    });
    expect(report.rawScenarios).toBe(41);
    expect(report.distinctFamilies).toBe(40);
    expect(report.acceptedFamilies).toBe(28);
  });

  it("binds fixture-only authoring metadata to every raw revision without exposing it to observation", async () => {
    const corpus = await loadSrs3Corpus();
    const metadata = await json<unknown>("./fixtures/srs3/authoring-metadata.json");
    expect(validateSrs3AuthoringMetadata(metadata, corpus.raw)).toEqual(corpus.authoring);
    const stale = structuredClone(corpus.authoring);
    stale.cases[0]!.revision = "R1";
    expect(() => validateSrs3AuthoringMetadata(stale, corpus.raw)).toThrow(/revision drift/u);
    const missing = structuredClone(corpus.authoring);
    missing.cases.pop();
    expect(() => validateSrs3AuthoringMetadata(missing, corpus.raw)).toThrow(/coverage drift/u);
  });

  it("keeps annotations and fixture-only setting out of the raw normalization and retrieval path", async () => {
    const corpus = await loadSrs3Corpus();
    const { catalog } = await inputs();
    const raw = corpus.raw[0]!;
    const before = observeSrs3RawOnly(raw, catalog);
    const changedSetting = { ...raw, setting: "UNSPECIFIED" as const };
    expect(observeSrs3RawOnly(changedSetting, catalog)).toEqual(before);
    const removedLabels = corpus.annotations.filter((item) => item.id !== raw.id);
    const reversedLabels = corpus.annotations.map((item) => ({
      ...item,
      shouldRankAbove: item.shouldRankAbove.map(([a, b]) => [b, a]),
    }));
    expect(removedLabels).toHaveLength(40);
    expect(reversedLabels[1]!.shouldRankAbove).toEqual([["request", "clarification"]]);
    expect(observeSrs3RawOnly(raw, catalog)).toEqual(before);
    const serialized = JSON.stringify({
      raw: corpus.raw,
      context: before.context,
      trace: before.result,
    });
    expect(
      /"(?:required|acceptable|forbidden|shouldRankAbove|reviewerJustification|expectedRank)"\s*:/u.test(
        serialized,
      ),
    ).toBe(false);
    expect(/"primary"\s*:\s*\[/u.test(serialized)).toBe(false);
    expect(/"(?:boundaryExplicitness|draftRealism)"\s*:/u.test(serialized)).toBe(false);
    for (const scenario of corpus.raw) {
      const observation = observeSrs3RawOnly(scenario, catalog);
      expect(observation.context).not.toHaveProperty("setting");
      expect(observation.result.config.catalogScope).toBe("PRODUCTION");
      expect(observation.result.capabilityTopK.every((item) => !item.id.includes("."))).toBe(true);
    }
  });

  it("does not copy exact Phase 8A, matrix, or T1-T18 input text into a new family", async () => {
    const review = await json<{
      rows: Array<{
        originalExample: { sourceText: string; visibleContext: string; userIntent: string };
      }>;
      neighborPatterns: Array<Record<string, string>>;
    }>("./fixtures/phase8/codex-semantic-review.json");
    const normalize = (value: string) =>
      value
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim();
    const prior = new Set<string>();
    for (const row of review.rows)
      for (const value of Object.values(row.originalExample))
        if (typeof value === "string" && normalize(value).length >= 25) prior.add(normalize(value));
    for (const matrix of review.neighborPatterns)
      for (const value of Object.values(matrix))
        if (typeof value === "string" && normalize(value).length >= 25) prior.add(normalize(value));
    for (const scenario of srs25RawScenarios) {
      for (const message of scenario.request.analysis.messages) prior.add(normalize(message.text));
      if (scenario.request.analysis.draft.text)
        prior.add(normalize(scenario.request.analysis.draft.text));
    }
    for (const scenario of srs3RawScenarios) {
      const text = [
        ...scenario.request.analysis.messages.map((message) => message.text),
        scenario.request.analysis.draft.text,
        scenario.request.selection?.kind === "ACTION" ? scenario.request.selection.intent : null,
      ].filter((value): value is string => value !== null);
      expect(
        text.every((value) => normalize(value).length < 25 || !prior.has(normalize(value))),
      ).toBe(true);
    }
  });
});
