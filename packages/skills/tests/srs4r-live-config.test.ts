import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { packageRoot } from "../authoring/generator.js";
import { prepareSrs4Development } from "./srs4-development.js";
import { createSkillAssessorBatchPayload } from "./srs4r-assessor-prompt.js";
import { SRS4R_A_INDEPENDENCE_CASE_KEYS } from "./srs4r-independence.js";
import {
  SRS4R_LIVE_CAP_USD,
  SRS4R_LIVE_MODEL,
  liveRequestBody,
  renderSrs4rLiveConfig,
  requestUpperBoundUSD,
} from "./srs4r-live-config.js";

const sha = (value: string) => createHash("sha256").update(value).digest("hex");

describe("SRS-4R-A live proof preflight (no provider call)", () => {
  it("freezes 138 requests, the eight singleton/batch cases, and a <$2 upper bound", async () => {
    const rendered = await renderSrs4rLiveConfig();
    const saved = await readFile(
      resolve(packageRoot, "tests/fixtures/srs4r/live-development-config-v1.json"),
      "utf8",
    );
    expect(rendered).toBe(saved);
    expect(await renderSrs4rLiveConfig()).toBe(saved);
    expect(sha(saved)).toBe("1fa4019d91e53c5d0746f99f91614ecbfa2e40b16324f48504ef2e1ba537db2e");
    const config = JSON.parse(saved) as {
      approval: { totalSpendCapUSD: number; maximumRequests: number };
      provider: { model: string; store: boolean; automaticRetries: number };
      maximumReservedCostUSD: number;
      caseBindings: Array<{
        key: string;
        modelRequest: boolean;
        singletons?: Array<{ skillId: string }>;
        reverseOrder?: unknown;
      }>;
      auditScored: boolean;
      protectedChallengeRead: boolean;
      productionChanged: boolean;
      combinationImplemented: boolean;
    };
    expect(config.approval).toEqual({ totalSpendCapUSD: 2, maximumRequests: 138 });
    expect(config.provider).toMatchObject({
      model: SRS4R_LIVE_MODEL,
      store: false,
      automaticRetries: 0,
    });
    expect(config.maximumReservedCostUSD).toBeLessThan(SRS4R_LIVE_CAP_USD);
    expect(config.caseBindings).toHaveLength(53);
    expect(config.caseBindings.filter((row) => row.modelRequest)).toHaveLength(50);
    expect(config.caseBindings.filter((row) => !row.modelRequest)).toHaveLength(3);
    expect(config.caseBindings.filter((row) => row.reverseOrder).map((row) => row.key)).toEqual(
      expect.arrayContaining([...SRS4R_A_INDEPENDENCE_CASE_KEYS]),
    );
    for (const key of SRS4R_A_INDEPENDENCE_CASE_KEYS)
      expect(config.caseBindings.find((row) => row.key === key)?.singletons).toHaveLength(10);
    expect(config.auditScored).toBe(false);
    expect(config.protectedChallengeRead).toBe(false);
    expect(config.productionChanged).toBe(false);
    expect(config.combinationImplemented).toBe(false);
  });

  it("uses the fixed model, no storage, bounded output, and a monotone cost guard", async () => {
    const { cases } = await prepareSrs4Development();
    const input = cases.find((row) => row.key === "SRS3B:R06")!.input;
    if ("stage" in input) throw Error("Expected wording input");
    const request = liveRequestBody(createSkillAssessorBatchPayload(input), "BATCH");
    expect(request.model).toBe(SRS4R_LIVE_MODEL);
    expect(request.store).toBe(false);
    expect(request.reasoning).toEqual({ effort: "low" });
    expect(request.max_output_tokens).toBe(8192);
    expect(requestUpperBoundUSD(request)).toBeGreaterThan(0);
    const larger = { ...request, max_output_tokens: request.max_output_tokens + 100 };
    expect(requestUpperBoundUSD(larger)).toBeGreaterThan(requestUpperBoundUSD(request));
  });
});
