import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { packageRoot } from "../authoring/generator.js";
import {
  renderSemanticCalibrationArtifacts,
  semanticFixtureRoot,
} from "./srs3e-semantic-calibration.js";
import { FROZEN_SEMANTIC_PROFILE_SHA256, loadPositiveDocuments } from "./srs3e-semantic-model.js";

const sha256 = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest("hex");

describe("SRS-3E calibration evidence and stop gate", () => {
  it("rebuilds the corrected calibration freeze exactly, without promoting Codex review to human approval", async () => {
    const rendered = await renderSemanticCalibrationArtifacts();
    expect(rendered.manifestSha256).toBe(
      "bcb55ca5ee19973e974550c75a06892e58cfa8f0bc9380efcfce790eb25e0f8a",
    );
    const manifest = JSON.parse(rendered.manifest) as {
      calibrationId: string;
      reviewerType: string;
    };
    expect(manifest.calibrationId).toBe("SRS-3E-SEMANTIC-CALIBRATION-2");
    expect(manifest.reviewerType).toBe("CODEX_SEMANTIC_REVIEW");
    for (const [name, content] of Object.entries({
      "calibration-freeze.json": rendered.manifest,
      "calibration-raw.json": rendered.artifacts.raw,
      "calibration-annotations.json": rendered.artifacts.annotations,
      "calibration-review.json": rendered.artifacts.review,
    }))
      expect(await readFile(resolve(semanticFixtureRoot, name), "utf8")).toBe(content);
  });

  it("binds vectors to the approved positive profile artifact and keeps the failed config unapproved", async () => {
    const root = resolve(packageRoot, "tests/fixtures/srs3e-semantic");
    const vectorBytes = await readFile(resolve(root, "profile-vectors-v1.json"));
    const vectors = JSON.parse(vectorBytes.toString("utf8")) as {
      profileArtifactSha256: string;
      vectors: Array<{ skillId: string; field: string; vector: number[]; vectorSha256: string }>;
    };
    expect(vectors.profileArtifactSha256).toBe(FROZEN_SEMANTIC_PROFILE_SHA256);
    expect(vectors.vectors.length).toBe((await loadPositiveDocuments()).length);
    expect(new Set(vectors.vectors.map((row) => row.skillId)).size).toBe(14);
    expect(
      vectors.vectors.every((row) => ["job", "useWhen", "semanticTriggers"].includes(row.field)),
    ).toBe(true);
    expect(
      vectors.vectors.every(
        (row) =>
          row.vector.length === 384 && row.vectorSha256 === sha256(JSON.stringify(row.vector)),
      ),
    ).toBe(true);
    const config = JSON.parse(
      await readFile(resolve(root, "first-run-config-v1.json"), "utf8"),
    ) as {
      reviewState: string;
      challengeRunAuthorized: boolean;
      positiveVectorArtifactSha256: string;
    };
    expect(config.reviewState).toBe("PENDING_HUMAN_PRE_CHALLENGE_REVIEW");
    expect(config.challengeRunAuthorized).toBe(false);
    expect(config.positiveVectorArtifactSha256).toBe(sha256(vectorBytes));
    const grid = JSON.parse(await readFile(resolve(root, "calibration-grid-v1.json"), "utf8")) as {
      selected: { macroRecall: number; strictNonePass: number; strictNoneTotal: number };
    };
    expect(grid.selected.macroRecall).toBe(0);
    expect(grid.selected.strictNonePass).toBe(grid.selected.strictNoneTotal);
    const disposition = JSON.parse(
      await readFile(resolve(root, "calibration-disposition-v1.json"), "utf8"),
    ) as { status: string; challengeRunAuthorized: boolean; configArtifactSha256: string };
    expect(disposition.status).toBe("STOP_ZERO_RECALL");
    expect(disposition.challengeRunAuthorized).toBe(false);
    expect(disposition.configArtifactSha256).toBe(
      sha256(await readFile(resolve(root, "first-run-config-v1.json"))),
    );
  });
});
