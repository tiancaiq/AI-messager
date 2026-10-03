import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderSrs4DevelopmentCanaryConfig } from "../packages/skills/tests/srs4-development-canary-config.js";

const mode = process.argv[2];
if (mode !== "--write" && mode !== "--check")
  throw Error("Usage: freeze-srs4-development-canary.ts --write | --check");
const path = resolve(
  import.meta.dirname,
  "../packages/skills/tests/fixtures/srs4/development-canary-config-v1.json",
);
const rendered = await renderSrs4DevelopmentCanaryConfig();
if (mode === "--write") await writeFile(path, rendered, { flag: "wx" });
else if ((await readFile(path, "utf8")) !== rendered)
  throw Error("SRS-4-D3 frozen canary configuration drift");
process.stdout.write(
  `SRS-4-D3 ${mode}: SHA-256 ${createHash("sha256").update(rendered).digest("hex")}; five exposed-development requests only.\n`,
);
