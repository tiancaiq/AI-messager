import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderSrs4D4Freeze } from "../packages/skills/tests/srs4-d4-freeze.js";

const mode = process.argv[2];
if (mode !== "--write" && mode !== "--check")
  throw Error("Usage: freeze-srs4-d4.ts --write | --check");
const path = resolve(
  import.meta.dirname,
  "../packages/skills/tests/fixtures/srs4/supervisor-contract-v2-freeze.json",
);
const rendered = await renderSrs4D4Freeze();
if (mode === "--write") await writeFile(path, rendered, "utf8");
else if ((await readFile(path, "utf8")) !== rendered) throw Error("SRS-4-D4 contract freeze drift");
process.stdout.write(
  `SRS-4-D4 ${mode}: SHA-256 ${createHash("sha256").update(rendered).digest("hex")}; offline only.\n`,
);
