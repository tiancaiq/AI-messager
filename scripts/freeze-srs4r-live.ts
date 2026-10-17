import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderSrs4rLiveConfig } from "../packages/skills/tests/srs4r-live-config.js";

const mode = process.argv[2];
if (mode !== "--write" && mode !== "--check")
  throw Error("Usage: freeze-srs4r-live.ts --write | --check");
const path = resolve(
  import.meta.dirname,
  "../packages/skills/tests/fixtures/srs4r/live-development-config-v1.json",
);
const rendered = await renderSrs4rLiveConfig();
if (mode === "--write") await writeFile(path, rendered, { encoding: "utf8", flag: "wx" });
else if ((await readFile(path, "utf8")) !== rendered) throw Error("SRS-4R-A live config drift");
process.stdout.write(
  `SRS-4R-A live ${mode}: SHA-256 ${createHash("sha256").update(rendered).digest("hex")}; no provider call.\n`,
);
