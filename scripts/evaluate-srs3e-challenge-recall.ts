import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { evaluateSrs3eChallengeRecall } from "../packages/skills/tests/srs3e-challenge-recall-evaluation.js";

const reportPath = resolve(
  import.meta.dirname,
  "../packages/skills/tests/fixtures/srs3e/challenge-recall-diagnostic.json",
);
const args = process.argv.slice(2);
if (args.length !== 1 || !["--check", "--generate"].includes(args[0]!))
  throw Error("Usage: evaluate-srs3e-challenge-recall.ts --check | --generate");

const { json, sha256 } = await evaluateSrs3eChallengeRecall();
if (args[0] === "--check") {
  const saved = await readFile(reportPath, "utf8");
  if (saved !== json) throw Error("SRS-3E challenge recall evidence drift");
} else {
  await writeFile(reportPath, json, "utf8");
}
process.stdout.write(`SRS-3E frozen challenge recall ${args[0]}: sha256 ${sha256}\n`);
