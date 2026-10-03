import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderSrs4rAFreeze } from "../packages/skills/tests/srs4r-a-freeze.js";

const mode = process.argv[2];
if (mode !== "--write" && mode !== "--check")
  throw Error("Usage: freeze-srs4r-a.ts --write | --check");
const path = resolve(
  import.meta.dirname,
  "../packages/skills/tests/fixtures/srs4r/assessor-offline-freeze-v1.json",
);
const rendered = await renderSrs4rAFreeze();
if (mode === "--write") await writeFile(path, rendered, "utf8");
else if ((await readFile(path, "utf8")) !== rendered) throw Error("SRS-4R-A offline freeze drift");
process.stdout.write(
  `SRS-4R-A ${mode}: SHA-256 ${createHash("sha256").update(rendered).digest("hex")}; offline only, live gate NOT_RUN.\n`,
);
