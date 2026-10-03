import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderSrs4D2Freeze } from "../packages/skills/tests/srs4-d2-freeze.js";

const mode = process.argv[2];
if (mode !== "--write" && mode !== "--check")
  throw Error("Usage: freeze-srs4-d2.ts --write | --check");
const path = resolve(
  import.meta.dirname,
  "../packages/skills/tests/fixtures/srs4/output-contract-diagnostic-v1.json",
);
const rendered = await renderSrs4D2Freeze();
if (mode === "--write") await writeFile(path, rendered, "utf8");
else if ((await readFile(path, "utf8")) !== rendered)
  throw Error("SRS-4-D2 diagnostic freeze drift");
process.stdout.write(
  `SRS-4-D2 ${mode}: SHA-256 ${createHash("sha256").update(rendered).digest("hex")}; offline only, no provider calls.\n`,
);
