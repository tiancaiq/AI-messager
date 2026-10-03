import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { srs4AuditRawR2 } from "../packages/test-fixtures/src/srs4-audit-raw-r2.js";
import { srs4AuditAnnotationsR2 } from "../packages/skills/tests/srs4-audit-annotations-r2.js";
import { srs4AuditIndependentReviewR1 } from "../packages/skills/tests/srs4-audit-independent-review-r1.js";
import { srs4AuditIndependentReviewR2 } from "../packages/skills/tests/srs4-audit-independent-review-r2.js";
import { renderSrs4AuditAuthoringFreezeR2 } from "../packages/skills/tests/srs4-audit-freeze-r2.js";

const mode = process.argv[2];
if (mode !== "--write" && mode !== "--check")
  throw Error("Usage: freeze-srs4-audit-r2.ts --write | --check");
const root = resolve(import.meta.dirname, "..");
const fixture = resolve(root, "packages/skills/tests/fixtures/srs4/audit-authoring-freeze-v2.json");
const packet = resolve(root, "docs/skills/srs-4-audit-review-delta-r2.md");
const freeze = await renderSrs4AuditAuthoringFreezeR2();
const hash = createHash("sha256").update(freeze).digest("hex");
const changed = srs4AuditIndependentReviewR1.filter((row) => row.decision === "REVISE");
const esc = (value: string) => value.replace(/\|/gu, "\\|").replace(/\n/gu, " ");
const lines = [
  "# SRS-4 audit R2 — independent review delta",
  "",
  "The original [R1 review packet](srs-4-audit-review-packet.md) and R1 freeze remain unchanged. A user-relayed **ChatGPT/model semantic review**, not human or qualified-human approval, approved 58 R1 cases and requested six revisions. The same review provenance approved all six R2 revisions. The audit corpus is now **64/64 model-semantically approved, 0 REVISE, 0 QUARANTINE**, but remains **unscored**. The original reviewer transcript and detailed rationales were not supplied; these reported decisions are bound to source hashes, not independently authenticated as a human review.",
  "",
  `R2 freeze SHA-256: \`${hash}\`. R1 review is bound to the R1 freeze; the six R2 decisions bind the R2 raw and annotation source hashes.`,
  "",
  "| Case | R1 decision | R2 model decision | R2 change | R2 required | R2 acceptable | R2 forbidden |",
  "| --- | --- | --- | --- | --- | --- | --- |",
  ...changed.map((review) => {
    const raw = srs4AuditRawR2.find((row) => row.id === review.id)!;
    const label = srs4AuditAnnotationsR2.find((row) => row.id === review.id)!;
    const approval = srs4AuditIndependentReviewR2.find((row) => row.id === review.id)!;
    const change =
      review.id === "A30"
        ? `New raw revision ${raw.revision}: ${raw.request.analysis.messages.map((message) => `${message.speaker}: ${message.text}`).join(" / ")}; USER_DRAFT: ${raw.request.analysis.draft.text}`
        : "Removed request from forbidden; request remains unlabeled.";
    return `| ${review.id} | REVISE | ${approval.decision} | ${esc(change)} | ${label.required.join(", ")} | ${label.acceptable.join(", ") || "—"} | ${label.forbidden.join(", ") || "—"} |`;
  }),
  "",
  "All other 58 R1 rows retain their original raw input and labels. In A30, the earlier refusal and continuing limit are USER-authored, followed by a renewed OTHER request; the unchanged draft declines tonight and restates the limit. This is authoring evidence only, not a Supervisor result.",
  "",
  "**Gate:** this is model semantic approval only, not a Supervisor quality result or qualified-human signoff. Human boundary review and separate provider/key/budget approval remain open under the SRS-4 plan. No live Supervisor call, audit scoring, protected challenge or production change is authorized.",
  "",
].join("\n");
if (mode === "--write") {
  await writeFile(fixture, freeze, "utf8");
  await writeFile(packet, lines, "utf8");
} else {
  if ((await readFile(fixture, "utf8")) !== freeze || (await readFile(packet, "utf8")) !== lines)
    throw Error("SRS-4 R2 authoring freeze/review packet drift");
}
process.stdout.write(
  `SRS-4 R2 authoring freeze ${mode}: SHA-256 ${hash}; 64/64 model-semantic APPROVE, 0 REVISE, 0 QUARANTINE; unscored, no human approval.\n`,
);
