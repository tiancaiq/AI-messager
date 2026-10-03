import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { srs4AuditRaw } from "../packages/test-fixtures/src/srs4-audit-raw.js";
import { srs4AuditAnnotations } from "../packages/skills/tests/srs4-audit-annotations.js";
import { srs4AuditAuthorReview } from "../packages/skills/tests/srs4-audit-author-review.js";
import { renderSrs4AuditAuthoringFreeze } from "../packages/skills/tests/srs4-audit-freeze.js";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "docs/skills/srs-4-audit-review-packet.md");
const mode = process.argv[2];
if (!(["--write", "--check"] as const).some((value) => value === mode))
  throw Error("Usage: render-srs4-audit-review-packet.ts --write | --check");

const freeze = JSON.parse(await renderSrs4AuditAuthoringFreeze()) as {
  sourceSha256: Record<string, string>;
  coverage: { independentReviewed: number };
};
const escape = (value: string) => value.replace(/\|/gu, "\\|").replace(/\n/gu, " ");
const lines: string[] = [
  "# SRS-4 fresh audit — independent review packet",
  "",
  "This is synthetic exposed-audit **authoring evidence, not scored results or approved gold**. The same Codex instance authored and self-reviewed it; independent semantic review is pending. Do not run a live Supervisor or protected challenge from this packet.",
  "",
  `Authoring freeze: \`SRS-4-AUDIT-AUTHORING-R1\`. Raw SHA-256: \`${freeze.sourceSha256.raw}\`; annotation SHA-256: \`${freeze.sourceSha256.annotations}\`. All 64 cases remain unscored; independently reviewed: ${freeze.coverage.independentReviewed}/64.`,
  "",
  "For each case, check the proposed required/acceptable/forbidden labels against the actual USER draft/history, OTHER messages, and selected goal. In particular, a selected goal may support an objective but not prove a user-owned fact, responsibility, deadline, commitment, limit, or promise. Reply with **APPROVE A01–A64** only if every case and label is acceptable, or list exact IDs with **REVISE** or **QUARANTINE** and your reason. Approval will be recorded against the source hashes above; it does not authorize provider calls.",
  "",
  "| Case | Fixed action / role | Raw evidence | Proposed labels | Author self-review | Independent decision |",
  "| --- | --- | --- | --- | --- | --- |",
];
for (const [index, row] of srs4AuditRaw.entries()) {
  const label = srs4AuditAnnotations[index]!;
  const review = srs4AuditAuthorReview[index]!;
  const evidence = [
    ...row.request.analysis.messages.map((message) => `${message.speaker}: ${message.text}`),
    ...(row.request.analysis.draft.text ? [`USER_DRAFT: ${row.request.analysis.draft.text}`] : []),
    ...(row.request.selection?.kind === "ACTION"
      ? [`SELECTED_GOAL: ${row.request.selection.intent}`]
      : []),
  ].join("<br>");
  const labels = [
    `required: ${label.required.join(", ") || "—"}`,
    `acceptable: ${label.acceptable.join(", ") || "—"}`,
    `forbidden: ${label.forbidden.join(", ") || "—"}`,
    `strict NONE: ${label.strictNone}`,
  ].join("<br>");
  lines.push(
    `| ${row.id} · ${row.scenarioFamily} | ${row.fixedAction}<br>${row.role} · ${row.setting} | ${escape(evidence)} | ${escape(labels)} | ${escape(review.rationale)} | ☐ Approve / ☐ Revise / ☐ Quarantine |`,
  );
}
lines.push(
  "",
  "No semantic retrieval ranks, scores, Supervisor selections, or audit outcomes were used to author this packet.",
  "",
);
const rendered = lines.join("\n");
if (mode === "--write") await writeFile(output, rendered, "utf8");
else if ((await readFile(output, "utf8")) !== rendered)
  throw Error("SRS-4 review packet is stale against frozen authoring sources");
