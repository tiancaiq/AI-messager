import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { packageRoot } from "../authoring/generator.js";
import type { SemanticCandidateTrace } from "./srs3e-semantic-retrieval.js";
import { rankAndAdmitP087, sourceScore } from "./srs3e-rewrite-source-dominance.js";

function trace(draft: number, context: number, goal?: number): SemanticCandidateTrace {
  return {
    skillId: "acknowledge_mistake",
    version: 1,
    sourceDefinitionDigest: "definition",
    profileDigest: "profile",
    hardEligible: true,
    eligibilityReasons: [],
    sourceSimilarities: [
      {
        source: "USER_DRAFT",
        ordinal: 0,
        role: "PRIMARY",
        score: draft,
        field: "job",
        profileOrdinal: 0,
      },
      {
        source: "OTHER_MESSAGE",
        ordinal: 0,
        role: "CONTEXT",
        score: context,
        field: "job",
        profileOrdinal: 0,
      },
      ...(goal === undefined
        ? []
        : [
            {
              source: "SELECTED_GOAL" as const,
              ordinal: 0,
              role: "PRIMARY" as const,
              score: goal,
              field: "job" as const,
              profileOrdinal: 0,
            },
          ]),
    ],
    score: draft,
    winningSource: "USER_DRAFT",
    winningField: "job",
    winningProfileOrdinal: 0,
    preThresholdRank: 1,
    admitted: false,
    positivePoolRank: null,
    topKRank: null,
    disappearedAt: null,
  };
}

describe("SRS-3E-v2 exposed rewrite source dominance", () => {
  it("does not let OTHER rescue a weak draft or introduce an admission", () => {
    const weak = trace(0.1, 0.95, 0.9);
    for (const policy of [
      "DRAFT_ONLY",
      "DRAFT_CONTEXT_BOOST",
      "PRIMARY_FLOOR",
      "SOURCE_MAX_DOMINANCE",
    ] as const) {
      expect(sourceScore(weak, "REWRITE_DRAFT", policy).combined).toBe(0.1);
      expect(rankAndAdmitP087([weak], "REWRITE_DRAFT", policy).topK).toEqual([]);
    }
  });

  it("uses bounded context only with a nontrivial draft and keeps non-rewrite unchanged", () => {
    const candidate = trace(0.3, 0.8, 0.6);
    expect(sourceScore(candidate, "REWRITE_DRAFT", "DRAFT_ONLY").combined).toBe(0.3);
    expect(sourceScore(candidate, "REWRITE_DRAFT", "DRAFT_CONTEXT_BOOST").combined).toBe(0.35);
    expect(sourceScore(candidate, "REWRITE_DRAFT", "PRIMARY_FLOOR").combined).toBeCloseTo(0.4);
    expect(sourceScore(candidate, "REWRITE_DRAFT", "SOURCE_MAX_DOMINANCE").combined).toBe(0.65);
    expect(sourceScore(candidate, "SUGGEST_REPLY", "SOURCE_MAX_DOMINANCE").combined).toBe(0.3);
  });

  it("binds the corrected content-free evidence and reproduces the fixed baseline", async () => {
    const evidenceRoot = resolve(packageRoot, "tests/fixtures/srs3e-semantic");
    const artifact = JSON.parse(
      await readFile(resolve(evidenceRoot, "rewrite-source-dominance-v2.json"), "utf8"),
    ) as {
      challengeRead: boolean;
      challengeRunAuthorized: boolean;
      scoredCaseCount: number;
      decision: { status: string };
      evaluations: Array<{
        policy: string;
        combined: {
          required: { hit: number; total: number };
          rewrite: { hit: number; total: number };
          strictNone: { pass: number; total: number };
          forbidden: { admitted: number; total: number };
        };
      }>;
      bindings: { calibrationFreezeSha256: string; vectorArtifactSha256: string };
    };
    expect(artifact.challengeRead).toBe(false);
    expect(artifact.challengeRunAuthorized).toBe(false);
    expect(artifact.scoredCaseCount).toBe(53);
    expect(artifact.evaluations.map((item) => item.policy)).toEqual([
      "DRAFT_ONLY",
      "DRAFT_CONTEXT_BOOST",
      "PRIMARY_FLOOR",
      "SOURCE_MAX_DOMINANCE",
    ]);
    expect(artifact.evaluations[0]!.combined.required).toMatchObject({ hit: 8, total: 46 });
    expect(artifact.evaluations[0]!.combined.rewrite).toMatchObject({ hit: 0, total: 27 });
    expect(artifact.evaluations[0]!.combined.strictNone).toEqual({ pass: 16, total: 16 });
    expect(artifact.evaluations[0]!.combined.forbidden).toEqual({ admitted: 2, total: 14 });
    const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
    expect(artifact.bindings.calibrationFreezeSha256).toBe(
      digest(await readFile(resolve(evidenceRoot, "calibration-v2/calibration-freeze.json"))),
    );
    expect(artifact.bindings.vectorArtifactSha256).toBe(
      digest(await readFile(resolve(evidenceRoot, "profile-vectors-v1.json"))),
    );
    const script = await readFile(
      resolve(packageRoot, "../../scripts/evaluate-srs3e-rewrite-source-dominance.ts"),
      "utf8",
    );
    expect(script).not.toContain("srs3e-semantic-challenge");
    expect(script).not.toContain("fixtures/srs3e/");
  });
});
