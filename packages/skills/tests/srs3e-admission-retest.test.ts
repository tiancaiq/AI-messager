import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { packageRoot } from "../authoring/generator.js";

const root = resolve(packageRoot, "tests/fixtures/srs3e-semantic");
const digest = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest("hex");

describe("SRS-3E exposed-calibration admission retest", () => {
  it("binds the corrected evidence and never authorizes or reads the frozen challenge", async () => {
    const bytes = await readFile(resolve(root, "admission-retest-v3.json"));
    expect(digest(bytes)).toBe("f340f5862fedfad72dc32be58dc5e5f174cf89a51ce25b4171c8ae0d957b6c5c");
    const artifact = JSON.parse(bytes.toString("utf8")) as {
      evidenceUse: string;
      challengeRead: boolean;
      challengeRunAuthorized: boolean;
      selectedConfig: unknown;
      scoredCaseCount: number;
      scoredCaseIds: string[];
      bindings: { calibrationFreezeSha256: string; vectorArtifactSha256: string };
    };
    expect(artifact.evidenceUse).toBe("EXPOSED_CALIBRATION_DIAGNOSTIC_ONLY");
    expect(artifact.challengeRead).toBe(false);
    expect(artifact.challengeRunAuthorized).toBe(false);
    expect(artifact.selectedConfig).toBeNull();
    expect(artifact.scoredCaseCount).toBe(53);
    expect(artifact.scoredCaseIds.filter((id) => id.startsWith("SRS3B:")).length).toBe(29);
    expect(artifact.scoredCaseIds.filter((id) => id.startsWith("CONTROL:")).length).toBe(24);
    expect(artifact.scoredCaseIds.every((id) => !id.includes(":C"))).toBe(true);
    expect(artifact.bindings.calibrationFreezeSha256).toBe(
      digest(await readFile(resolve(root, "calibration-v2/calibration-freeze.json"))),
    );
    expect(artifact.bindings.vectorArtifactSha256).toBe(
      digest(await readFile(resolve(root, "profile-vectors-v1.json"))),
    );
    const script = await readFile(
      resolve(packageRoot, "../../scripts/retest-srs3e-admission.ts"),
      "utf8",
    );
    expect(script).not.toContain("srs3e-semantic-challenge");
    expect(script).not.toContain("fixtures/srs3e/");
  });

  it("reports the non-degenerate guard tradeoff without promoting it", async () => {
    const artifact = JSON.parse(
      await readFile(resolve(root, "admission-retest-v3.json"), "utf8"),
    ) as {
      policyCount: number;
      viableCount: number;
      bestViablePolicyId: string;
      rows: Array<{
        id: string;
        policy: { family: string };
        viable: boolean;
        combined: {
          required: { hit: number; total: number };
          strictNone: { pass: number; total: number };
          forbidden: { admitted: number; total: number };
          pool: { mean: number; p90: number; max: number };
        };
      }>;
      caseDiagnostics: Array<{
        policyId: string;
        cases: Array<{
          action: string;
          required: Array<{ admittedRank: number | null; stage: string }>;
        }>;
      }>;
    };
    expect(artifact.policyCount).toBe(103);
    expect(artifact.viableCount).toBe(22);
    const best = artifact.rows.find((row) => row.id === artifact.bestViablePolicyId)!;
    expect(best.policy.family).toBe("PEAK_SPREAD");
    expect(best.combined.required).toEqual({
      hit: 8,
      total: 46,
      preRankAt3: 22,
      preRankAt5: 26,
      preRankAt10: 38,
    });
    expect(best.combined.strictNone).toEqual({ pass: 16, total: 16 });
    expect(best.combined.forbidden).toEqual({ admitted: 2, total: 14 });
    expect(best.combined.pool.max).toBeLessThanOrEqual(10);
    const cases = artifact.caseDiagnostics.find((row) => row.policyId === best.id)!.cases;
    const rewrite = cases
      .filter((row) => row.action === "REWRITE_DRAFT")
      .flatMap((row) => row.required);
    expect(rewrite).toHaveLength(27);
    expect(rewrite.filter((row) => row.admittedRank !== null)).toHaveLength(0);
    expect(
      cases
        .flatMap((row) => row.required)
        .every((row) =>
          ["FOUND", "HARD_ELIGIBILITY", "TOP_K_CUTOFF", "ADMISSION_REJECTED"].includes(row.stage),
        ),
    ).toBe(true);
  });
});
