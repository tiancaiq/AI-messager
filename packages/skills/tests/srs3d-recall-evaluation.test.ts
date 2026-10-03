import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { packageRoot } from "../authoring/generator.js";
import { buildSrs2Catalog } from "./srs2-shadow-retrieval.js";
import { evaluateSrs3dRecall, observeRecallRawOnly } from "./srs3d-recall-evaluation.js";
import { srs3dRecallRegression } from "./srs3d-recall-regression.js";

describe("SRS-3D-A shadow recall", () => {
  it("keeps the frozen SRS-3C source and evidence reproducible while generating deterministic AFTER evidence", async () => {
    const first = await evaluateSrs3dRecall();
    const second = await evaluateSrs3dRecall();
    expect(first.json).toBe(second.json);
    expect(first.sha256).toBe(second.sha256);
    expect(first.report.sourceHashes.beforeEvidence).toBe(
      "ffa306ca87866313d58e670775ded8bad91a4dcc99cb23efe5fb35839b9dbcac",
    );
    const saved = await readFile(
      resolve(packageRoot, "../../packages/skills/tests/fixtures/srs3/recall-after.json"),
      "utf8",
    );
    expect(saved).toBe(first.json);
    expect(first.json).not.toMatch(/"text"|"draft"|"intent"\s*:/u);
  });

  it("recovers required skills without losing prior hits, NONE, or forbidden precision", async () => {
    const { report } = await evaluateSrs3dRecall();
    expect(report.after.requiredRecallAt10.denominator).toBe(32);
    expect(report.after.requiredRecallAt10.numerator).toBeGreaterThan(19);
    expect(report.after.strictNone).toEqual({ numerator: 4, denominator: 4, value: 1 });
    expect(report.changes.recovered).toHaveLength(13);
    expect(report.changes.lost).toEqual([]);
    expect(report.changes.newForbidden).toEqual([]);
    expect(report.after.forbiddenAt10.numerator).toBeLessThanOrEqual(1);
    expect(report.after.positivePool.max).toBeLessThanOrEqual(6);
    expect(report.rows).toHaveLength(29);
    expect(report.rows.every((row) => row.topK.length <= 10)).toBe(true);
  });

  it("covers eight operations across fresh forms and controls without newly enabling target-intent false positives", async () => {
    const { report } = await evaluateSrs3dRecall();
    expect(srs3dRecallRegression).toHaveLength(68);
    const targets = new Set(srs3dRecallRegression.map((row) => row.capability));
    expect(targets.size).toBe(8);
    for (const target of targets) {
      const cases = srs3dRecallRegression.filter((row) => row.capability === target);
      expect(cases.filter((row) => row.class === "POSITIVE").length).toBeGreaterThanOrEqual(6);
      expect(cases.map((row) => row.variant)).toEqual(
        expect.arrayContaining([
          "FORMAL",
          "NORMAL",
          "ROUGH",
          "FRAGMENT",
          "MULTI_OPERATION",
          "CONTROL",
        ]),
      );
      expect(cases.some((row) => row.class === "HARD_NEIGHBOR")).toBe(true);
      expect(cases.some((row) => row.class === "NEGATIVE")).toBe(true);
    }
    expect(report.regression.positive).toEqual({ numerator: 48, denominator: 48, value: 1 });
    expect(
      report.regression.rows.filter((row) => row.class === "POSITIVE" && !row.afterTargetSkillAt10),
    ).toEqual([]);
    expect(
      report.regression.rows.filter(
        (row) => row.class !== "POSITIVE" && row.afterTargetIntent && !row.beforeTargetIntent,
      ),
    ).toEqual([]);
    expect(report.regression.newlyEnabledControlTargetSkills).toEqual([
      "D31/expectation_setting",
      "D32/expectation_setting",
    ]);
  });

  it("does not send labels or scenario IDs into the normalizer or retriever", async () => {
    const catalog = await buildSrs2Catalog("PRODUCTION");
    const caseInput = srs3dRecallRegression[0]!;
    const alteredLabels = {
      ...caseInput,
      id: "changed",
      capability: "planning",
      class: "NEGATIVE" as const,
    };
    const original = observeRecallRawOnly(caseInput.request, caseInput.action, catalog);
    const permuted = observeRecallRawOnly(alteredLabels.request, alteredLabels.action, catalog);
    expect(permuted).toEqual(original);
    expect(original.result.config).toMatchObject({
      mode: "SIGNAL_ONLY",
      topK: 10,
      catalogScope: "PRODUCTION",
    });
    expect(
      original.result.capabilityTraces.every((trace) => trace.disappearedAt !== "RERANK_CUTOFF"),
    ).toBe(true);
  });
});
