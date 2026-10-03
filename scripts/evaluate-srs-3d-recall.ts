import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { evaluateSrs3dRecall } from "../packages/skills/tests/srs3d-recall-evaluation.js";

const reportPath = resolve(
  import.meta.dirname,
  "../packages/skills/tests/fixtures/srs3/recall-after.json",
);
const args = process.argv.slice(2);
if (args.length !== 1 || !["--check", "--generate"].includes(args[0]!))
  throw Error("Usage: evaluate-srs-3d-recall.ts --check | --generate");

const { json, sha256 } = await evaluateSrs3dRecall();
if (args[0] === "--check") {
  const saved = await readFile(reportPath, "utf8");
  if (saved !== json)
    throw Error("SRS-3D-A AFTER evidence differs from frozen inputs or evaluator.");
} else {
  await writeFile(reportPath, json, "utf8");
}
process.stdout.write(`SRS-3D-A recall ${args[0]}: sha256 ${sha256}\n`);
