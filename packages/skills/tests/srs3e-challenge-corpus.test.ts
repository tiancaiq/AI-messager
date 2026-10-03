import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { srs3eChallengeRaw } from "../../test-fixtures/src/srs3e-semantic-challenge.js";
import { packageRoot, renderRegistry } from "../authoring/generator.js";
import {
  srs3eChallengeAnnotations,
  type ChallengeAnnotation,
} from "./srs3e-challenge-annotations.js";
import { srs3eChallengeAuthoring } from "./srs3e-challenge-authoring.js";
import {
  buildChallengeCoverage,
  challengeRoot,
  renderChallengeArtifacts,
} from "./srs3e-challenge-corpus.js";
import { srs3eChallengeReview } from "./srs3e-challenge-review.js";

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const byId = new Map<string, ChallengeAnnotation>(
  srs3eChallengeAnnotations.map((row) => [row.id, row]),
);

describe("SRS-3E fresh challenge corpus, authoring only", () => {
  it("has separate capability/modifier lanes, all 21 skills and complete English boundary coverage", async () => {
    const coverage = await buildChallengeCoverage();
    expect(coverage.counts).toMatchObject({
      total: 68,
      capability: 52,
      modifier: 16,
      acceptedEnglishCapability: 48,
      acceptedEnglishCapabilityPositive: 42,
      quarantinedLanguage: 13,
      strictNone: 6,
      multiSkill: 10,
    });
    expect(coverage.capabilityCoverage).toHaveLength(14);
    expect(coverage.modifierCoverage).toHaveLength(7);
    for (const row of coverage.capabilityCoverage) {
      const english = (ids: string[]) =>
        ids.filter(
          (id) =>
            srs3eChallengeRaw.find((scenario) => scenario.id === id)?.languageGroup === "ENGLISH",
        );
      expect(english(row.positive).length, row.skillId).toBeGreaterThanOrEqual(2);
      expect(english(row.negative).length, row.skillId).toBeGreaterThanOrEqual(1);
      expect(english(row.hardNeighbor).length, row.skillId).toBeGreaterThanOrEqual(1);
    }
    for (const row of coverage.modifierCoverage) {
      expect(row.positive.length, row.skillId).toBeGreaterThanOrEqual(1);
      expect(row.negativeOrNeighbor.length, row.skillId).toBeGreaterThanOrEqual(1);
    }
    expect(coverage.counts.modes).toMatchObject({
      REWRITE_DRAFT: expect.any(Number),
      SUGGEST_REPLY: expect.any(Number),
      COMPLETE_DRAFT: 3,
      NO_REPLY_NEEDED: 1,
    });
    expect(Object.keys(coverage.counts.settings).sort()).toEqual(["PERSONAL", "SERVICE", "WORK"]);
    expect(Object.keys(coverage.counts.draftRealism).sort()).toEqual([
      "ALREADY_DECENT",
      "NORMAL",
      "ROUGH",
    ]);
  }, 20_000);

  it("keeps all eight requested compositions unranked and six NONE cases distinct", async () => {
    const expectedCompositions = ["C02", "C05", "C09", "C10", "C17", "C19", "C23", "C24"];
    for (const id of expectedCompositions) {
      const row = byId.get(id);
      expect(row?.lane).toBe("CAPABILITY");
      if (row?.lane !== "CAPABILITY") throw Error("Missing capability composition: " + id);
      expect(row.required.length).toBe(2);
      expect(row.primary).toEqual([]);
      expect(row.shouldRankAbove).toEqual([]);
    }
    for (const id of ["C47", "C48", "C49", "C50", "C51", "C52"]) {
      const row = byId.get(id);
      expect(row?.lane).toBe("CAPABILITY");
      if (row?.lane !== "CAPABILITY") throw Error("Missing NONE case: " + id);
      expect(row.strictNone).toBe(true);
      expect(row.required).toEqual([]);
      expect(row.acceptable).toEqual([]);
    }
    expect(srs3eChallengeRaw.find((row) => row.id === "C52")?.fixedAction).toBe("NO_REPLY_NEEDED");
  });

  it("does not leak labels or semantic profile prose into raw product input", async () => {
    const raw = JSON.stringify(srs3eChallengeRaw);
    expect(
      /"(?:required|acceptable|forbidden|shouldRankAbove|requiredModifiers|profileDigest|semanticTriggers)"\s*:/u.test(
        raw,
      ),
    ).toBe(false);
    const profile = JSON.parse(
      await readFile(
        resolve(packageRoot, "tests/fixtures/srs3/semantic-skill-profiles.json"),
        "utf8",
      ),
    ) as {
      profiles: Array<{
        useWhen: string[];
        whenNotUse: string[];
        semanticTriggers: string[];
        neighbors: Array<{ distinction: string }>;
      }>;
    };
    const phrases = profile.profiles.flatMap((row) => [
      ...row.useWhen,
      ...row.whenNotUse,
      ...row.semanticTriggers,
      ...row.neighbors.map((neighbor) => neighbor.distinction),
    ]);
    const normalize = (text: string) =>
      text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim();
    for (const scenario of srs3eChallengeRaw) {
      const goal =
        scenario.request.selection?.kind === "ACTION"
          ? normalize(scenario.request.selection.intent)
          : "";
      if (!goal) continue;
      expect(
        phrases.some(
          (phrase) => normalize(phrase).split(" ").length >= 5 && goal.includes(normalize(phrase)),
        ),
        scenario.id,
      ).toBe(false);
    }
  });

  it("records raw-first Codex review, native quarantine, novelty checks and no held-out set", async () => {
    const coverage = await buildChallengeCoverage();
    expect(coverage.heldOut).toBe("NOT_AUTHORED");
    expect(coverage.counts.decisions).toEqual({ PASS: 55, QUARANTINE: 13 });
    expect(coverage.novelty.every((row) => !row.exactDuplicate)).toBe(true);
    expect(coverage.counts.surfaceNovelEnglishPositive).toBeGreaterThanOrEqual(21);
    for (const scenario of srs3eChallengeRaw) {
      const review = srs3eChallengeReview.find((row) => row.id === scenario.id)!;
      expect(review.rationale.length).toBeGreaterThan(75);
      expect(review.reviewedRevision).toBe(scenario.revision);
      expect(review.nativeLanguageGate).toBe(
        scenario.languageGroup === "ENGLISH" ? "NOT_REQUIRED" : "NATIVE_LANGUAGE_REVIEW_REQUIRED",
      );
    }
    expect(srs3eChallengeAuthoring.map((row) => row.id)).toEqual(
      srs3eChallengeRaw.map((row) => row.id),
    );
  }, 20_000);

  it("rejects annotation loss and modifier labels in capability cases before freeze", async () => {
    await expect(
      buildChallengeCoverage(srs3eChallengeRaw, srs3eChallengeAnnotations.slice(1)),
    ).rejects.toThrow(/count\/ID mismatch/u);
    const mixed = [...structuredClone(srs3eChallengeAnnotations)];
    mixed[0] = { ...mixed[52]!, id: "C01" } as unknown as ChallengeAnnotation;
    await expect(buildChallengeCoverage(srs3eChallengeRaw, mixed)).rejects.toThrow(
      /mixed modifier lane/u,
    );
  });

  it("freezes exact raw, labels, review, coverage, catalog and profile bytes deterministically", async () => {
    const first = await renderChallengeArtifacts();
    const second = await renderChallengeArtifacts();
    expect(first).toEqual(second);
    const paths = {
      "challenge-raw-set.json": first.serialized.raw,
      "challenge-annotations.json": first.serialized.annotations,
      "challenge-authoring.json": first.serialized.authoring,
      "challenge-review.json": first.serialized.review,
      "challenge-coverage.json": first.serialized.coverage,
      "challenge-freeze.json": first.freeze,
    };
    for (const [name, contents] of Object.entries(paths))
      expect(await readFile(resolve(challengeRoot, name), "utf8")).toBe(contents);
    const freeze = JSON.parse(first.freeze) as {
      heldOut: string;
      sourceSha256: { catalog: string; profiles: string };
      artifactSha256: { raw: string; annotations: string; review: string; coverage: string };
    };
    expect(freeze.heldOut).toBe("NOT_AUTHORED");
    expect(freeze.sourceSha256.profiles).toBe(
      "b061bf17a04e696ad78af45016e6803a96f79f0e617fcb2800a4a591fbc33d1c",
    );
    expect(freeze.sourceSha256.catalog).toBe(
      "f53d78d4866a386fd544e0cf3a9e3b76373e49e265c7fc9a180b866871a8eb72",
    );
    expect(freeze.artifactSha256.raw).toBe(sha256(first.serialized.raw));
    expect(freeze.artifactSha256.annotations).toBe(sha256(first.serialized.annotations));
    expect(freeze.artifactSha256.review).toBe(sha256(first.serialized.review));
    expect(freeze.artifactSha256.coverage).toBe(sha256(first.serialized.coverage));
    expect(await readFile(resolve(packageRoot, "src/generated/approved-registry.ts"), "utf8")).toBe(
      await renderRegistry(),
    );
  }, 20_000);
});
