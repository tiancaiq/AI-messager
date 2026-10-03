import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { packageRoot } from "../authoring/generator.js";
import {
  SRS4_D3_CASES,
  SRS4_D3_ID,
  renderSrs4DevelopmentCanaryConfig,
} from "./srs4-development-canary-config.js";

const root = resolve(packageRoot, "../..");
const sha256 = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");

describe("SRS-4-D3 frozen canary", () => {
  it("reproduces five exact exposed cases with unchanged V1 settings and bounded spend", async () => {
    const rendered = await renderSrs4DevelopmentCanaryConfig();
    expect(await renderSrs4DevelopmentCanaryConfig()).toBe(rendered);
    const config = JSON.parse(rendered) as {
      experimentId: string;
      caseBindings: Array<{
        key: string;
        rawRevision: string;
        payloadSha256: string;
        candidateCount: number;
      }>;
      provider: Record<string, unknown>;
      costEstimate: { estimatedMaximumUSD: number };
      spendAuthorization: { approvedCapUSD: number; plannedRequests: number };
      sourcePaths: Record<string, string>;
      sourceSha256: Record<string, string>;
      d2FreezeSha256: string;
      auditScored: boolean;
      protectedChallengeRead: boolean;
      productionChanged: boolean;
    };
    const v1 = JSON.parse(await readFile(resolve(root, config.sourcePaths.v1Config!), "utf8")) as {
      provider: Record<string, unknown>;
    };
    expect(config.experimentId).toBe(SRS4_D3_ID);
    expect(
      config.caseBindings.map(({ key, rawRevision }) => ({ key, revision: rawRevision })),
    ).toEqual(SRS4_D3_CASES);
    expect(config.caseBindings.every((row) => row.candidateCount === 10)).toBe(true);
    expect(config.provider).toEqual(v1.provider);
    expect(config.spendAuthorization).toEqual({
      source: "USER_EXPLICIT_2026-10-03",
      approvedCapUSD: 1,
      plannedRequests: 5,
    });
    expect(config.costEstimate.estimatedMaximumUSD).toBeLessThan(1);
    expect(config.auditScored).toBe(false);
    expect(config.protectedChallengeRead).toBe(false);
    expect(config.productionChanged).toBe(false);
    expect(config.d2FreezeSha256).toBe(
      "504503dc937f425d090dfab231f6919379b2a1d70a4d3747911ab7a712c5b540",
    );
    for (const [name, path] of Object.entries(config.sourcePaths))
      expect(sha256(await readFile(resolve(root, path)))).toBe(config.sourceSha256[name]);
    expect(rendered).not.toMatch(/candidateDecisions|USER_DRAFT:0|OTHER_MESSAGE:0|apiKey/iu);
  });
});
