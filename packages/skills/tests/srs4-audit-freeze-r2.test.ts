import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { srs4AuditRaw } from "../../test-fixtures/src/srs4-audit-raw.js";
import { srs4AuditRawR2 } from "../../test-fixtures/src/srs4-audit-raw-r2.js";
import { packageRoot } from "../authoring/generator.js";
import { srs4AuditAnnotationsR2 } from "./srs4-audit-annotations-r2.js";
import { srs4AuditIndependentReviewR1 } from "./srs4-audit-independent-review-r1.js";
import { srs4AuditIndependentReviewR2 } from "./srs4-audit-independent-review-r2.js";
import {
  renderSrs4AuditAuthoringFreezeR2,
  validateSrs4AuditAuthoringR2,
} from "./srs4-audit-freeze-r2.js";

describe("SRS-4 audit R2 authoring freeze (no scoring)", () => {
  it("preserves 58 R1 approvals and binds six R2 model-semantic approvals", async () => {
    const coverage = await validateSrs4AuditAuthoringR2();
    expect(coverage).toMatchObject({
      cases: 64,
      requiredOccurrences: 56,
      forbiddenOccurrences: 65,
      approvedR1: 58,
      revisedR1: 6,
      approvedR2: 6,
      semanticApproved: 64,
      modelReviewed: 64,
      humanApproved: 0,
      revisedR2PendingConfirmation: 0,
      quarantined: 0,
    });
    expect(
      srs4AuditIndependentReviewR1.every(
        (row) =>
          row.reviewerType === "CHATGPT_MODEL_SEMANTIC_REVIEW" &&
          row.qualifiedHumanApproval === false,
      ),
    ).toBe(true);
    expect(srs4AuditIndependentReviewR2.map((row) => [row.id, row.decision])).toEqual([
      ["A05", "APPROVE"],
      ["A10", "APPROVE"],
      ["A19", "APPROVE"],
      ["A24", "APPROVE"],
      ["A30", "APPROVE"],
      ["A35", "APPROVE"],
    ]);
    for (const [index, row] of srs4AuditRawR2.entries()) {
      if (row.id !== "A30") expect(row).toEqual(srs4AuditRaw[index]);
    }
    for (const id of ["A05", "A10", "A19", "A24", "A35"]) {
      const label = srs4AuditAnnotationsR2.find((row) => row.id === id)!;
      expect([...label.required, ...label.acceptable, ...label.forbidden]).not.toContain("request");
    }
    const a30 = srs4AuditRawR2.find((row) => row.id === "A30")!;
    expect(a30.revision).toBe("R2");
    expect(a30.request.analysis.messages.map((message) => message.speaker)).toEqual([
      "OTHER",
      "USER",
      "OTHER",
    ]);
    expect(srs4AuditAnnotationsR2.find((row) => row.id === "A30")!.required).toEqual([
      "decline",
      "boundary_setting",
    ]);
  });

  it("is byte-deterministic and keeps all live/evaluation gates closed", async () => {
    const first = await renderSrs4AuditAuthoringFreezeR2();
    expect(await renderSrs4AuditAuthoringFreezeR2()).toBe(first);
    const file = await readFile(
      resolve(packageRoot, "tests/fixtures/srs4/audit-authoring-freeze-v2.json"),
      "utf8",
    );
    expect(file).toBe(first);
    const freeze = JSON.parse(file) as {
      status: string;
      auditScored: boolean;
      providerCallsAuthorized: boolean;
      challengeRead: boolean;
      reviewerType: string;
      qualifiedHumanApproval: boolean;
      sourceSha256: { freezeR1: string };
    };
    expect(freeze).toMatchObject({
      status: "AUTHORING_FROZEN_MODEL_SEMANTIC_REVIEW_APPROVED_UNSCORED",
      reviewerType: "CHATGPT_MODEL_SEMANTIC_REVIEW",
      qualifiedHumanApproval: false,
      auditScored: false,
      providerCallsAuthorized: false,
      challengeRead: false,
    });
    expect(freeze.sourceSha256.freezeR1).toBe(
      "232a7e5815fe44ecc51c40cef903590d89163e42be76bcab7995c434b4325844",
    );
    expect(createHash("sha256").update(first).digest("hex")).toMatch(/^[a-f0-9]{64}$/u);
  });
});
