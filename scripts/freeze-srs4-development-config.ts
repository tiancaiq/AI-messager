import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderSrs4DevelopmentLiveConfig } from "../packages/skills/tests/srs4-development-live-config.js";

const mode = process.argv[2];
if (mode !== "--write" && mode !== "--check")
  throw Error("Usage: freeze-srs4-development-config.ts --write | --check");
const path = resolve(
  import.meta.dirname,
  "../packages/skills/tests/fixtures/srs4/development-live-config-v1.json",
);
const rendered = await renderSrs4DevelopmentLiveConfig();
if (mode === "--write") await writeFile(path, rendered, "utf8");
else if ((await readFile(path, "utf8")) !== rendered)
  throw Error("SRS-4 frozen development configuration drift");
const config = JSON.parse(rendered) as {
  corpus: { plannedModelRequests: number };
  costEstimate: { estimatedMaximumUSD: number; proposedSpendCapUSD: number };
};
process.stdout.write(
  `SRS-4 development config ${mode}: SHA-256 ${createHash("sha256").update(rendered).digest("hex")}; ${config.corpus.plannedModelRequests} planned requests; conservative estimate $${config.costEstimate.estimatedMaximumUSD}; proposed cap $${config.costEstimate.proposedSpendCapUSD}; no live calls.\n`,
);
