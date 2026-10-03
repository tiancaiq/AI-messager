import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { packageRoot } from "../authoring/generator.js";
import { renderSrs4D2Freeze } from "./srs4-d2-freeze.js";

describe("SRS-4-D2 immutable offline diagnostic binding", () => {
  it("regenerates twice byte-identically and preserves frozen V1/B/audit chains", async () => {
    const first = await renderSrs4D2Freeze();
    expect(await renderSrs4D2Freeze()).toBe(first);
    const persisted = await readFile(
      resolve(packageRoot, "tests/fixtures/srs4/output-contract-diagnostic-v1.json"),
      "utf8",
    );
    expect(persisted).toBe(first);
    const artifact = JSON.parse(first) as {
      diagnosticId: string;
      v1PerCaseCause: string;
      sourceSha256: Record<string, string>;
      contractSha256: Record<string, string>;
      stageOrder: string[];
      failureCodes: string[];
      auditScored: boolean;
      protectedChallengeRead: boolean;
      productionChanged: boolean;
      providerCallsAuthorized: boolean;
      canaryRequiresSeparateApproval: boolean;
    };
    expect(artifact.diagnosticId).toBe("SRS-4-OUTPUT-CONTRACT-DIAG-1");
    expect(artifact.v1PerCaseCause).toBe("NOT_RECOVERABLE_FROM_V1_TRACE");
    expect(artifact.sourceSha256).toMatchObject({
      v1Validator: "3ff83c44abe310908ea0cad16764ecb78a0efe1b7de82215cc7dadbda8824977",
      v1Config: "3b4ecfe80979486c454009d48bdba640becc8f59c642fff11b759dfd6168f93a",
      v1Trace: "edf22ea5cb29d6de824d1d2624d7f9cce9b67c3913d625a7725159c105c382ea",
      v1Metrics: "18d1ec344d4ea0b59c35975f4f1320d3f42f6473af89a89c3786f54665f67ae1",
      bConfig: "4f3f94e0b2089c9bb7a8e8c3a83c697b7df3d9f3c4c0c14b4c00ac0d4518327b",
      semanticProfiles: "b061bf17a04e696ad78af45016e6803a96f79f0e617fcb2800a4a591fbc33d1c",
      auditR2Freeze: "3297a3577ed7110e01a2629e023bf2371238559543c3c49350dbc28c727fa319",
    });
    expect(Object.values(artifact.contractSha256)).toHaveLength(9);
    expect(artifact.stageOrder.at(-1)).toBe("VALID");
    expect(artifact.failureCodes).toContain("FACT_GROUNDING_MISSING");
    expect(artifact).toMatchObject({
      auditScored: false,
      protectedChallengeRead: false,
      productionChanged: false,
      providerCallsAuthorized: false,
      canaryRequiresSeparateApproval: true,
    });
    expect(first).not.toMatch(/USER_DRAFT:0|OTHER_MESSAGE:0|OPENAI_API_KEY|"text":/u);
    expect(createHash("sha256").update(first).digest("hex")).toBe(
      "504503dc937f425d090dfab231f6919379b2a1d70a4d3747911ab7a712c5b540",
    );
  });
});
