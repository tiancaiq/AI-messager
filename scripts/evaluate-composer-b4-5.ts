import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import type { CoachingDecisionResult } from "../packages/contracts/src/index.js";
import {
  evaluateCoachingDecisionGuards,
  type CoachingGuardRuleCode,
} from "../packages/ai/src/coaching-engine.js";
import { OpenAiCoachingAdapter } from "../packages/ai/src/openai-coaching-adapter.js";
import { decideCoachingAction } from "../packages/ai/src/coaching-policy.js";
import {
  composerB4Order,
  runComposerB4Case,
  type ComposerB4Arm,
  type ComposerB4CaseResult,
} from "../packages/ai/tests/composer-b4-harness.js";
import {
  COMPOSER_B4_5_MAX_CALLS,
  assertComposerB45CallBudget,
  composerB45Fixtures,
} from "../packages/ai/tests/composer-b4-5-fixtures.js";
import { approvedPipelineSnapshot } from "../packages/ai/tests/skill-pipeline-harness.js";

const AGENT_BASELINE = "be935923967862e9a65af669c7ca1ec7784125fa";
const SKILLS_BASELINE = "dcc52eb15b578a4dbc65e4c74b64dbf9806cc899";
const CATALOG_SNAPSHOT = "approved-fnv128:f292695be12e86102468e1fa9f7d27f5";
const MODEL_ID = "gpt-5.6-luna";
const SEED = 20261005;
const outputDirectory = resolve(process.cwd(), ".local-eval", "b4-5");
const resultsPath = resolve(outputDirectory, "results.json");
const reviewPath = resolve(outputDirectory, "blind-review.md");
const mappingPath = resolve(outputDirectory, "arm-map.json");

interface StoredPair {
  caseId: string;
  result: ComposerB4CaseResult;
  guardRules: readonly { arm: ComposerB4Arm; ruleCode: CoachingGuardRuleCode | null }[];
}

interface StoredRun {
  agentBaseline: string;
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
  const decision = result.decision;
  if (decision.action === "REWRITE_DRAFT" || decision.action === "COMPLETE_DRAFT")
    return [
      `Primary: ${decision.primary}`,
      ...decision.alternatives.map(({ label, text }) => `Alternative (${label}): ${text}`),
    ].join("\n");
  if (decision.action === "SUGGEST_REPLY")
    return decision.replies
      .map(
        ({ label, text }, index) =>
          `${index === 0 ? "Primary" : "Alternative"} (${label}): ${text}`,
      )
      .join("\n");
  return "[Local action; not a B4.5 case]";
}

function quoted(value: string): string {
  return value
    .split(/\r?\n/u)
    .map((line) => `> ${line}`)
    .join("\n");
}

function review(run: StoredRun): string {
  const introduction = `# B4.5 focused blind Composer review

All source and generated text is synthetic. Candidate A/B labels conceal legacy versus new guidance. The fixed action, provider/model, output schema and 3,000-token limit are the same; the narrow B4.5 Composer prompt and guard repairs apply to both arms. Review the primary **and every alternative** as one package. A valid primary cannot rescue an unsupported alternative. A deterministic failure is blocking unless a human explicitly documents a false positive. Record meaning/factual support before instruction fit, naturalness, tone, relevance and concision. Do not open the separate arm map before writing decisions.

Provider: ${run.providerId}; model: ${run.modelId}; cases: ${run.pairs.length}/${composerB45Fixtures.length}; calls attempted: ${run.callsAttempted}/${run.maxCalls}.
`;
  return `${introduction}\n${run.pairs
    .map(({ caseId, result, guardRules }) => {
      const fixture = composerB45Fixtures.find(({ id }) => id === caseId)!;
      const source = fixture.request.analysis.messages
        .map(({ speaker, text }) => `${speaker}: ${text}`)
        .join("\n");
      const candidates = result.arms.map((arm, index) => {
        const ruleCode = guardRules.find((item) => item.arm === arm.arm)?.ruleCode ?? null;
        const status = arm.result.ok ? "PASS" : `FAIL (${ruleCode ?? arm.result.error.code})`;
        return `Candidate ${index === 0 ? "A" : "B"} — deterministic guard: **${status}**\n${quoted(candidateMessages(arm.providerResult))}`;
      });
      return `## ${caseId}

Fixed action: \`${result.action}\`. Evidence summary: ${result.evidenceSummary}

Visible synthetic context:
${quoted(source)}

User-owned draft: ${fixture.request.analysis.draft.text ? `\n${quoted(fixture.request.analysis.draft.text)}` : "none"}

${candidates.join("\n\n")}

Decision: [ ] A better  [ ] B better  [ ] Tie  [ ] Both unacceptable  [ ] Not comparable

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
        agentBaseline: run.agentBaseline,
        catalogSnapshotId: run.catalogSnapshotId,
        seed: run.seed,
        pairs: run.pairs.map(({ caseId, result }) => ({
          caseId,
          candidateA: result.arms[0]!.arm,
          candidateB: result.arms[1]!.arm,
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
  return (
    codes[0] !== null &&
    codes[0] === codes[1] &&
    [
      "NOT_CONFIGURED",
      "INVALID_CREDENTIALS",
      "INSUFFICIENT_CREDITS",
      "RATE_LIMITED",
      "MODEL_UNAVAILABLE",
      "TIMEOUT",
      "PROVIDER_ERROR",
    ].includes(codes[0]!)
  );
}

async function main(): Promise<void> {
  if (composerB45Fixtures.length !== 23 || COMPOSER_B4_5_MAX_CALLS !== 46)
    throw new Error("Focused B4.5 dataset or cap changed");
  if (approvedPipelineSnapshot.id !== CATALOG_SNAPSHOT)
    throw new Error("Approved Skills snapshot changed; stop for review");
  if (!process.argv.includes("--live")) {
    process.stdout.write("B4.5 readiness: 23 synthetic cases, 46-call cap; no provider invoked.\n");
    return;
  }
  if (process.env.OPENAI_TEXT_MODEL && process.env.OPENAI_TEXT_MODEL !== MODEL_ID)
    throw new Error("B4.5 model must match the B4 frozen model");
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
  if (existsSync(resultsPath))
    throw new Error("B4.5 output already exists; no automatic overwrite or repeat calls");
  mkdirSync(outputDirectory, { recursive: true });
  const run: StoredRun = {
    agentBaseline: AGENT_BASELINE,
    skillsBaseline: SKILLS_BASELINE,
    catalogSnapshotId: approvedPipelineSnapshot.id,
    providerId: "openai",
    modelId: MODEL_ID,
    seed: SEED,
    maxCalls: COMPOSER_B4_5_MAX_CALLS,
    callsAttempted: 0,
    inProgressCase: null,
    pairs: [],
  };
  const generator = new OpenAiCoachingAdapter({
    apiKey: process.env.OPENAI_API_KEY,
    modelId: MODEL_ID,
  });
  save(run);
  for (let index = 0; index < composerB45Fixtures.length; index += 1) {
    assertComposerB45CallBudget(run.callsAttempted, 2);
    const fixture = composerB45Fixtures[index]!;
    run.inProgressCase = fixture.id;
    save(run);
    const pair = await runComposerB4Case(fixture, generator, composerB4Order(index, SEED));
    const guardRules = pair.arms.map(({ arm, providerResult }) => ({
      arm,
      ruleCode: providerResult?.ok
        ? evaluateCoachingDecisionGuards(
            providerResult.decision,
            fixture.request,
            decideCoachingAction(fixture.request),
          )
        : null,
    }));
    run.callsAttempted += pair.arms.reduce((sum, arm) => sum + arm.providerCalls, 0);
    run.pairs.push({ caseId: fixture.id, result: pair, guardRules });
    run.inProgressCase = null;
    save(run);
    process.stdout.write(
      `${index + 1}/${composerB45Fixtures.length} ${fixture.id}: ${pair.arms.map(({ result }) => (result.ok ? "PASS" : result.error.code)).join(" / ")}\n`,
    );
    if (operationalFailure(pair)) {
      process.stdout.write("Stopped after paired provider failure; no automatic retry.\n");
      return;
    }
  }
  process.stdout.write(
    `B4.5 generation complete: ${run.pairs.length} pairs, ${run.callsAttempted} calls. Blind review: ${reviewPath}\n`,
  );
}

main().catch(() => {
  // Provider responses, request content and credentials must not appear on stderr.
  process.stderr.write("B4_5_RUN_FAILED; inspect content-free run state and local tests.\n");
  process.exitCode = 1;
});
