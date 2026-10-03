import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { packageRoot } from "../authoring/generator.js";
import { renderSrs4D4Freeze } from "./srs4-d4-freeze.js";

describe("SRS-4-D4 immutable offline contract freeze", () => {
  it("rebuilds byte-identically with historical evidence and untouched audit bindings", async () => {
    const stored = await readFile(
      resolve(packageRoot, "tests/fixtures/srs4/supervisor-contract-v2-freeze.json"),
      "utf8",
    );
    expect(await renderSrs4D4Freeze()).toBe(stored);
    expect(await renderSrs4D4Freeze()).toBe(stored);
    const freeze = JSON.parse(stored) as {
      sourceSha256: Record<string, string>;
      providerCallsMade: number;
      auditScored: boolean;
      protectedChallengeRead: boolean;
      nextRequestedModel: string;
      canonicalFixtureCount: number;
    };
    expect(freeze.sourceSha256.d2Freeze).toBe(
      "504503dc937f425d090dfab231f6919379b2a1d70a4d3747911ab7a712c5b540",
    );
    expect(freeze.sourceSha256.auditR2Freeze).toBe(
      "3297a3577ed7110e01a2629e023bf2371238559543c3c49350dbc28c727fa319",
    );
    expect(freeze.providerCallsMade).toBe(0);
    expect(freeze.auditScored).toBe(false);
    expect(freeze.protectedChallengeRead).toBe(false);
    expect(freeze.nextRequestedModel).toBe("gpt-5.6-luna");
    expect(freeze.canonicalFixtureCount).toBe(6);
  });
});
