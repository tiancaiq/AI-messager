import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { srs3RawScenarios } from "../../test-fixtures/src/srs3-ranking-development.js";
import { srs3eSemanticCalibrationRaw } from "../../test-fixtures/src/srs3e-semantic-calibration.js";
import { srs4AuditRaw } from "../../test-fixtures/src/srs4-audit-raw.js";
import { packageRoot } from "../authoring/generator.js";
import { srs4AuditAnnotations } from "./srs4-audit-annotations.js";
import { renderSrs4AuditAuthoringFreeze, validateSrs4AuditAuthoring } from "./srs4-audit-freeze.js";

function words(text: string): Set<string> {
  const tokens = text.toLowerCase().match(/[a-z]+/gu) ?? [];
  const grams = new Set<string>();
  for (let index = 0; index + 3 < tokens.length; index++)
    grams.add(tokens.slice(index, index + 4).join(" "));
  return grams;
}
function content(row: { request: (typeof srs4AuditRaw)[number]["request"] }): string {
  return [
    ...row.request.analysis.messages.map((message) => message.text),
    row.request.analysis.draft.text ?? "",
    row.request.selection?.kind === "ACTION" ? row.request.selection.intent : "",
  ].join(" ");
}
function jaccard(left: Set<string>, right: Set<string>): number {
  let common = 0;
  for (const value of left) if (right.has(value)) common++;
  return common / (left.size + right.size - common || 1);
}

describe("SRS-4 audit authoring freeze (no retrieval or Supervisor scoring)", () => {
  it("has the predeclared 64-case role/mode/skill/negative-pair coverage", () => {
    const coverage = validateSrs4AuditAuthoring();
    expect(coverage).toMatchObject({
      cases: 64,
      single: 24,
      multi: 16,
      wordingNone: 16,
      structural: 8,
      positiveModes: { REWRITE_DRAFT: 18, SUGGEST_REPLY: 18, COMPLETE_DRAFT: 4 },
      requiredOccurrences: 56,
      independentReviewed: 0,
    });
    expect(coverage.forbiddenOccurrences).toBeGreaterThanOrEqual(24);
    expect(Object.keys(coverage.perSkillRequired)).toHaveLength(14);
    expect(srs4AuditRaw.every((row) => row.split === "EXPOSED_AUDIT_UNSCORED")).toBe(true);
    expect(srs4AuditAnnotations.every((row) => row.reviewedRevision === "R1")).toBe(true);
  });

  it("is family-disjoint and not a near-copy of exposed development text", () => {
    const development = [...srs3RawScenarios, ...srs3eSemanticCalibrationRaw];
    const devGrams = development.map((row) => [row.scenarioFamily, words(content(row))] as const);
    let worst = { audit: "", development: "", score: 0 };
    for (const row of srs4AuditRaw) {
      const audit = words(content(row));
      for (const [family, developmentWords] of devGrams) {
        const score = jaccard(audit, developmentWords);
        if (score > worst.score) worst = { audit: row.id, development: family, score };
      }
    }
    expect(worst.score, JSON.stringify(worst)).toBeLessThan(0.55);
  });

  it("has byte-identical deterministic authoring freeze and keeps all live gates closed", async () => {
    const first = await renderSrs4AuditAuthoringFreeze();
    const second = await renderSrs4AuditAuthoringFreeze();
    expect(first).toBe(second);
    const file = await readFile(
      resolve(packageRoot, "tests/fixtures/srs4/audit-authoring-freeze-v1.json"),
      "utf8",
    );
    expect(file).toBe(first);
    const freeze = JSON.parse(file) as {
      status: string;
      auditScored: boolean;
      providerCallsAuthorized: boolean;
      challengeRead: boolean;
      coverage: { independentReviewed: number };
    };
    expect(freeze).toMatchObject({
      status: "AUTHORING_FROZEN_INDEPENDENT_REVIEW_PENDING",
      auditScored: false,
      providerCallsAuthorized: false,
      challengeRead: false,
      coverage: { independentReviewed: 0 },
    });
  });
});
