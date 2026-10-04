import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import type { CoachingDecisionResult } from "../packages/contracts/src/index.js";
import { OpenAiCoachingAdapter } from "../packages/ai/src/openai-coaching-adapter.js";
import { composerB4Fixtures } from "../packages/ai/tests/composer-b4-fixtures.js";
import {
  assertComposerB4CallBudget,
  composerB4Order,
  COMPOSER_B4_MAX_CALLS,
  runComposerB4Case,
  type ComposerB4CaseResult,
} from "../packages/ai/tests/composer-b4-harness.js";
import { approvedPipelineSnapshot } from "../packages/ai/tests/skill-pipeline-harness.js";

const SEED = 20261004;
const AGENT_FREEZE = "b9eef8a171782973104189a1bf804b6b1432c657";
const SKILLS_BASELINE = "dcc52eb15b578a4dbc65e4c74b64dbf9806cc899";
const outputDirectory = resolve(process.cwd(), ".local-eval", "b4");
const resultsPath = resolve(outputDirectory, "results.json");
const reviewPath = resolve(outputDirectory, "blind-review.md");
const mappingPath = resolve(outputDirectory, "arm-map.json");

interface StoredPair {
  caseId: string;
  result: ComposerB4CaseResult;
}

interface StoredRun {
  agentFreeze: string;
  skillsBaseline: string;
  catalogSnapshotId: string;
  providerId: "openai";
  modelId: string;
  seed: number;
  maxCalls: number;
  callsAttempted: number;
  inProgressCase: string | null;
  pairs: StoredPair[];
}

function candidateMessages(result: CoachingDecisionResult | null): string {
  if (!result?.ok) return "[No schema-valid candidate returned]";
  if (result.decision.action === "REWRITE_DRAFT" || result.decision.action === "COMPLETE_DRAFT")
    return [
      `Primary: ${result.decision.primary}`,
      ...result.decision.alternatives.map(({ label, text }) => `Alternative (${label}): ${text}`),
    ].join("\n");
  if (result.decision.action === "SUGGEST_REPLY")
    return result.decision.replies
      .map(
        ({ label, text }, index) =>
          `${index === 0 ? "Primary" : "Alternative"} (${label}): ${text}`,
      )
      .join("\n");
  return "[Local action; not a B4 Composer candidate]";
}

function quoted(value: string): string {
  return value
    .split(/\r?\n/u)
    .map((line) => `> ${line}`)
    .join("\n");
}

function review(run: StoredRun): string {
  const intro = `# B4 blind Composer A/B review

All context and outputs here are synthetic. Candidate labels conceal the guidance source. Do not open the separate arm map until judgments are recorded. The same fixed action, provider/model, Composer prompt and output schema apply to each pair; guidance is the intended changed field. Review the primary message and alternatives as one candidate package: a failed deterministic guard may come from an alternative. A failed guard is blocking even if the primary reads better, unless a reviewer explicitly documents a guard false positive.

Record one judgment per case: **A better**, **B better**, **Tie**, **Both unacceptable**, or **Cannot determine**. Check meaning/facts before tone/style. Give concise reasons across meaning preservation, instruction fit, communication effectiveness, naturalness, relevance, concision, unsupported inference and tone. Do not infer quality from selected-skill IDs or structural comparator labels.

Provider: ${run.providerId}; model: ${run.modelId}; cases generated: ${run.pairs.length}/${composerB4Fixtures.length}; calls attempted: ${run.callsAttempted}/${run.maxCalls}.
`;
  return `${intro}\n${run.pairs
    .map(({ caseId, result }) => {
      const fixture = composerB4Fixtures.find(({ id }) => id === caseId)!;
      const a = result.arms[0]!;
      const b = result.arms[1]!;
      const source = fixture.request.analysis.messages
        .map(({ speaker, text }) => `${speaker}: ${text}`)
        .join("\n");
      const selected =
        fixture.request.selection?.kind === "ACTION"
          ? fixture.request.selection.intent
          : fixture.request.selection?.answer;
      const status = (candidate: typeof a) =>
        candidate.result.ok ? "PASS" : `FAIL (${candidate.result.error.code})`;
      return `## ${caseId}

Fixed action: \`${result.action}\`. Evidence summary: ${result.evidenceSummary}

Visible synthetic context:
${quoted(source)}

User-owned draft: ${fixture.request.analysis.draft.text ? `\n${quoted(fixture.request.analysis.draft.text)}` : "none"}
${selected ? `\nSelected user intent: ${selected}\n` : ""}
Candidate A — deterministic guard: **${status(a)}**
${quoted(candidateMessages(a.providerResult))}

Candidate B — deterministic guard: **${status(b)}**
${quoted(candidateMessages(b.providerResult))}

Decision: [ ] A better  [ ] B better  [ ] Tie  [ ] Both unacceptable  [ ] Cannot determine

Meaning/factual validity and unsupported inference:

Instruction fit, communication effectiveness, naturalness, relevance, concision and tone:

---`;
    })
    .join("\n\n")}\n`;
}

function save(run: StoredRun): void {
  writeFileSync(resultsPath, `${JSON.stringify(run, null, 2)}\n`, { encoding: "utf8", flag: "w" });
  writeFileSync(reviewPath, review(run), { encoding: "utf8", flag: "w" });
  writeFileSync(
    mappingPath,
    `${JSON.stringify(
      {
        agentFreeze: run.agentFreeze,
        catalogSnapshotId: run.catalogSnapshotId,
        seed: run.seed,
        pairs: run.pairs.map(({ caseId, result }) => ({
          caseId,
          candidateA: result.arms[0]!.arm,
          candidateB: result.arms[1]!.arm,
          legacySelected: result.legacyPlan.selectedSkills.map(({ id, version }) => ({
            id,
            version,
          })),
          newSelected: result.newPlan.selectedSkills,
        })),
      },
      null,
      2,
    )}\n`,
    { encoding: "utf8", flag: "w" },
  );
}

function operationalFailure(pair: ComposerB4CaseResult): boolean {
  const codes = pair.arms.map(({ result }) => (result.ok ? null : result.error.code));
  const first = codes[0];
  return (
    first !== null &&
    first !== undefined &&
    first === codes[1] &&
    [
      "NOT_CONFIGURED",
      "INVALID_CREDENTIALS",
      "INSUFFICIENT_CREDITS",
      "RATE_LIMITED",
      "MODEL_UNAVAILABLE",
      "TIMEOUT",
      "PROVIDER_ERROR",
    ].includes(first)
  );
}

async function main(): Promise<void> {
  if (composerB4Fixtures.length !== 30) throw new Error("B4 dataset must contain exactly 30 cases");
  if (approvedPipelineSnapshot.id !== "approved-fnv128:f292695be12e86102468e1fa9f7d27f5")
    throw new Error("The approved catalog snapshot changed; stop for review");
  if (process.argv.includes("--render-existing")) {
    const run = JSON.parse(readFileSync(resultsPath, "utf8")) as StoredRun;
    if (run.agentFreeze !== AGENT_FREEZE || run.catalogSnapshotId !== approvedPipelineSnapshot.id)
      throw new Error("Existing B4 run uses a different frozen baseline");
    save(run);
    process.stdout.write(
      `Rendered existing synthetic blind review with no provider calls: ${reviewPath}\n`,
    );
    return;
  }
  if (!process.argv.includes("--live")) {
    process.stdout.write(
      `B4 readiness: ${composerB4Fixtures.length} synthetic provider-generation cases; max ${COMPOSER_B4_MAX_CALLS} calls; no provider invoked.\n`,
    );
    return;
  }
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
  const modelId = process.env.OPENAI_TEXT_MODEL?.trim() || "gpt-5.6-luna";
  if (existsSync(resultsPath))
    throw new Error("B4 output already exists; no automatic overwrite or repeat calls");
  mkdirSync(outputDirectory, { recursive: true });
  const run: StoredRun = {
    agentFreeze: AGENT_FREEZE,
    skillsBaseline: SKILLS_BASELINE,
    catalogSnapshotId: approvedPipelineSnapshot.id,
    providerId: "openai",
    modelId,
    seed: SEED,
    maxCalls: COMPOSER_B4_MAX_CALLS,
    callsAttempted: 0,
    inProgressCase: null,
    pairs: [],
  };
  const generator = new OpenAiCoachingAdapter({ apiKey: process.env.OPENAI_API_KEY, modelId });
  save(run);
  for (let index = 0; index < composerB4Fixtures.length; index += 1) {
    assertComposerB4CallBudget(run.callsAttempted, 2);
    const fixture = composerB4Fixtures[index]!;
    run.inProgressCase = fixture.id;
    save(run);
    const pair = await runComposerB4Case(fixture, generator, composerB4Order(index, SEED));
    run.callsAttempted += pair.arms.reduce((sum, arm) => sum + arm.providerCalls, 0);
    run.pairs.push({ caseId: fixture.id, result: pair });
    run.inProgressCase = null;
    save(run);
    const statuses = pair.arms.map(({ result }) => (result.ok ? "PASS" : result.error.code));
    process.stdout.write(
      `${index + 1}/${composerB4Fixtures.length} ${fixture.id}: ${statuses.join(" / ")}\n`,
    );
    if (operationalFailure(pair)) {
      process.stdout.write("Stopped after paired provider failure; no automatic retry.\n");
      return;
    }
    if (index === 2)
      process.stdout.write(
        "Three-pair pilot passed operational checks; continuing within the same 60-call cap.\n",
      );
  }
  process.stdout.write(
    `B4 generation complete: ${run.pairs.length} pairs, ${run.callsAttempted} calls. Blind review: ${reviewPath}\n`,
  );
}

main().catch(() => {
  // Never print raw provider responses, payloads, keys or generated messages.
  process.stderr.write("B4_RUN_FAILED; inspect only content-free run status and local tests.\n");
  process.exitCode = 1;
});
