import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { packageRoot } from "../authoring/generator.js";
import { renderSrs4DevelopmentLiveConfig } from "./srs4-development-live-config.js";

describe("SRS-4 development live configuration freeze (offline only)", () => {
  it("binds only 53 exposed cases and keeps provider/audit/challenge gates closed", async () => {
    const first = await renderSrs4DevelopmentLiveConfig();
    expect(await renderSrs4DevelopmentLiveConfig()).toBe(first);
    const file = await readFile(
      resolve(packageRoot, "tests/fixtures/srs4/development-live-config-v1.json"),
      "utf8",
    );
    expect(file).toBe(first);
    const config = JSON.parse(first) as {
      corpus: {
        cases: number;
        plannedModelRequests: number;
        structuralBypasses: number;
        caseBindings: Array<{ key: string; modelRequest: boolean; payloadSha256?: string }>;
      };
      provider: {
        requestedModel: string;
        maxOutputTokens: number;
        automaticRetries: number;
        store: boolean;
        tools: unknown[];
        scoreVisibleToModel: boolean;
      };
      costEstimate: { estimatedMaximumUSD: number; proposedSpendCapUSD: number };
      sourceSha256: { auditR2Freeze: string };
      providerCallsAuthorized: boolean;
      noAuditScoring: boolean;
      noProtectedChallenge: boolean;
    };
    expect(config.corpus).toMatchObject({
      cases: 53,
      plannedModelRequests: 50,
      structuralBypasses: 3,
    });
    expect(config.corpus.caseBindings).toHaveLength(53);
    expect(
      config.corpus.caseBindings.every((row) => !row.modelRequest || !!row.payloadSha256),
    ).toBe(true);
    expect(config.provider).toMatchObject({
      requestedModel: "gpt-6.1-sol",
      maxOutputTokens: 8192,
      automaticRetries: 0,
      store: false,
      tools: [],
      scoreVisibleToModel: false,
    });
    expect(config.sourceSha256.auditR2Freeze).toBe(
      "3297a3577ed7110e01a2629e023bf2371238559543c3c49350dbc28c727fa319",
    );
    expect(config.costEstimate.estimatedMaximumUSD).toBeLessThan(
      config.costEstimate.proposedSpendCapUSD,
    );
    expect(config).toMatchObject({
      providerCallsAuthorized: false,
      noAuditScoring: true,
      noProtectedChallenge: true,
    });
    expect(first).not.toMatch(
      /USER_DRAFT:0|OTHER_MESSAGE:0|candidateDecisions|"required"|"forbidden"/u,
    );
    expect(createHash("sha256").update(first).digest("hex")).toMatch(/^[a-f0-9]{64}$/u);
  });
});
