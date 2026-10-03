import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  renderSemanticCalibrationArtifacts,
  semanticFixtureRoot,
} from "../packages/skills/tests/srs3e-semantic-calibration.js";

const mode = process.argv[2];
if (process.argv.length !== 3 || !["--generate", "--check"].includes(mode!))
  throw Error("Usage: freeze-srs3e-semantic-calibration.ts --generate | --check");
const { artifacts, manifest, manifestSha256 } = await renderSemanticCalibrationArtifacts();
const files = {
  "calibration-raw.json": artifacts.raw,
  "calibration-annotations.json": artifacts.annotations,
  "calibration-review.json": artifacts.review,
  "calibration-freeze.json": manifest,
};
if (mode === "--generate") {
  await mkdir(semanticFixtureRoot, { recursive: true });
  const existing = await readFile(
    resolve(semanticFixtureRoot, "calibration-freeze.json"),
    "utf8",
  ).catch(() => null);
  if (existing !== null && existing !== manifest)
    throw Error("SRS-3E calibration freeze drift; new review and freeze ID required");
  for (const [name, json] of Object.entries(files))
    await writeFile(resolve(semanticFixtureRoot, name), json, "utf8");
} else {
  for (const [name, json] of Object.entries(files)) {
    if ((await readFile(resolve(semanticFixtureRoot, name), "utf8")) !== json)
      throw Error(`SRS-3E calibration ${name} drift`);
  }
}
process.stdout.write(`SRS-3E semantic calibration ${mode}: sha256 ${manifestSha256}\n`);
