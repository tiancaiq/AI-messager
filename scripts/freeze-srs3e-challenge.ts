import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  challengeRoot,
  renderChallengeArtifacts,
} from "../packages/skills/tests/srs3e-challenge-corpus.js";

const mode = process.argv[2];
if (process.argv.length !== 3 || !["--generate", "--check"].includes(mode ?? ""))
  throw Error("Usage: freeze-srs3e-challenge.ts --generate | --check");

const { serialized, freeze } = await renderChallengeArtifacts();
const files = {
  "challenge-raw-set.json": serialized.raw,
  "challenge-annotations.json": serialized.annotations,
  "challenge-authoring.json": serialized.authoring,
  "challenge-review.json": serialized.review,
  "challenge-coverage.json": serialized.coverage,
  "challenge-freeze.json": freeze,
};

if (mode === "--generate") {
  await mkdir(challengeRoot, { recursive: true });
  const freezePath = resolve(challengeRoot, "challenge-freeze.json");
  const existingFreeze = await readFile(freezePath, "utf8").catch((error: unknown) => {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  });
  if (existingFreeze !== null && existingFreeze !== freeze)
    throw Error("Frozen challenge changed; a new review and freeze ID are required.");
  for (const [name, contents] of Object.entries(files))
    await writeFile(resolve(challengeRoot, name), contents, "utf8");
} else {
  for (const [name, contents] of Object.entries(files)) {
    if ((await readFile(resolve(challengeRoot, name), "utf8")) !== contents)
      throw Error("SRS-3E challenge artifact drift: " + name);
  }
}
process.stdout.write(`SRS-3E challenge ${mode}: ${JSON.parse(freeze).freezeId}\n`);
