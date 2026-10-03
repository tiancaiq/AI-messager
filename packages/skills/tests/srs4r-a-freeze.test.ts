import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { packageRoot } from "../authoring/generator.js";
import { renderSrs4rAFreeze } from "./srs4r-a-freeze.js";

const path = resolve(packageRoot, "tests/fixtures/srs4r/assessor-offline-freeze-v1.json");
const sha = (value: string) => createHash("sha256").update(value).digest("hex");

describe("SRS-4R-A offline freeze", () => {
  it("is deterministic, source-bound, and retains all live/audit/production stop gates", async () => {
    const first = await renderSrs4rAFreeze();
    const second = await renderSrs4rAFreeze();
    const saved = await readFile(path, "utf8");
    expect(first).toBe(second);
    expect(saved).toBe(first);
    expect(sha(saved)).toBe(sha(second));
    const freeze = JSON.parse(saved) as {
      status: string;
      independenceGate: { gateStatus: string; evidenceKind: string };
      auditScored: boolean;
      protectedChallengeRead: boolean;
      productionChanged: boolean;
      providerCallsMade: number;
      combinationImplemented: boolean;
      sourcePaths: Record<string, string>;
    };
    expect(freeze.status).toBe("OFFLINE_CONTRACT_FROZEN_LIVE_EVALUATION_NOT_RUN");
    expect(freeze.independenceGate).toMatchObject({ gateStatus: "NOT_RUN", evidenceKind: "NONE" });
    expect(freeze.auditScored).toBe(false);
    expect(freeze.protectedChallengeRead).toBe(false);
    expect(freeze.productionChanged).toBe(false);
    expect(freeze.providerCallsMade).toBe(0);
    expect(freeze.combinationImplemented).toBe(false);
    expect(freeze.sourcePaths).toHaveProperty("freezeTests");
  });
});
