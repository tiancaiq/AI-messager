import { readFile, writeFile } from "node:fs/promises";
import {
  renderSemanticArtifact,
  semanticArtifactPath,
} from "../packages/skills/authoring/semantic-profiles.js";

const mode = process.argv[2];
if (process.argv.length !== 3 || !["--check", "--generate"].includes(mode ?? ""))
  throw Error("Usage: generate-semantic-profiles.ts --check | --generate");

const { json, sha256 } = await renderSemanticArtifact();
if (mode === "--check") {
  if ((await readFile(semanticArtifactPath, "utf8")) !== json)
    throw Error("SRS-3D-B semantic artifact differs from validated authoring profiles.");
} else {
  await writeFile(semanticArtifactPath, json, "utf8");
}
process.stdout.write(`SRS-3D-B semantic profiles ${mode}: sha256 ${sha256}\n`);
