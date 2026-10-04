import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import type {
  CoachingDecisionResult,
  CommunicationGuidance,
} from "../packages/contracts/src/index.js";
import {
  coachConversation,
  evaluateCoachingDecisionGuards,
  type CoachingGuardRuleCode,
  type CoachingTextGenerator,
} from "../packages/ai/src/coaching-engine.js";
import { decideCoachingAction } from "../packages/ai/src/coaching-policy.js";
import { buildComposerTask } from "../packages/ai/src/composer-task.js";
import { OpenAiCoachingAdapter } from "../packages/ai/src/openai-coaching-adapter.js";
import { skillPlanAsCommunicationPlan } from "../packages/ai/tests/composer-b4-harness.js";
import {
  assertComposerB47TargetBudget,
  COMPOSER_B4_7_TARGET_MAX_CALLS,
  composerB47TargetFixtures,
} from "../packages/ai/tests/composer-b4-7-fixtures.js";
import {
  approvedPipelineSnapshot,
  createSkillPipelineHarness,
} from "../packages/ai/tests/skill-pipeline-harness.js";

const AGENT_BASELINE = "b1d50240f998577c176671d46d6cfaee66c27c89";
const SKILLS_BASELINE = "dcc52eb15b578a4dbc65e4c74b64dbf9806cc899";
const CATALOG_SNAPSHOT = "approved-fnv128:f292695be12e86102468e1fa9f7d27f5";
const MODEL_ID = "gpt-5.6-luna";
const outputDirectory = resolve(process.cwd(), ".local-eval", "b4-7", "targeted");
const resultsPath = resolve(outputDirectory, "results.json");
const reviewPath = resolve(outputDirectory, "review.md");

interface StoredCase {
  caseId: string;
  action: string;
  evidenceSummary: string;
  planStatus: string;
  guidance: CommunicationGuidance;
  providerDecision: CoachingDecisionResult | null;
  resultCode: "PASS" | string;
  guardRule: CoachingGuardRuleCode | null;
  durationMs: number;
}

interface StoredRun {
  agentBaseline: string;
  skillsBaseline: string;
  catalogSnapshotId: string;
  providerId: "openai";
  modelId: string;
  maxCalls: number;
  callsAttempted: number;
  inProgressCase: string | null;
  cases: StoredCase[];
}

function quoted(value: string): string {
  return value
    .split(/\r?\n/u)
    .map((line) => `> ${line}`)
    .join("\n");
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
  return "[Unexpected local action]";
}

function review(run: StoredRun): string {
  const intro = `# B4.7 boundary-scope targeted review

All context and outputs are synthetic. This is a one-arm grounding gate, not a legacy-vs-new quality vote. Guidance identity is omitted from the worksheet. Review every primary and alternative as one package; an invalid alternative invalidates the package. Deterministic PASS is not semantic signoff. For each case, classify source boundary scope, candidate scope, any unrelated temporal wording, factual/commitment validity, uncertainty, refusal, instruction fit, then communication quality. Human review is required before a final gate decision.

Provider: ${run.providerId}; model: ${run.modelId}; cases: ${run.cases.length}/${composerB47TargetFixtures.length}; calls attempted: ${run.callsAttempted}/${run.maxCalls}.
`;
  return `${intro}\n${run.cases
    .map((item) => {
      const fixture = composerB47TargetFixtures.find(({ id }) => id === item.caseId)!;
      const source = fixture.request.analysis.messages
        .map(({ speaker, text }) => `${speaker}: ${text}`)
        .join("\n");
      const guard =
        item.resultCode === "PASS" ? "PASS" : `FAIL (${item.guardRule ?? item.resultCode})`;
      return `## ${item.caseId}

Fixed action: \`${item.action}\`. Evidence summary: ${item.evidenceSummary}

Visible synthetic context:
${quoted(source)}

User-owned draft: ${fixture.request.analysis.draft.text ? `\n${quoted(fixture.request.analysis.draft.text)}` : "none"}

Candidate A — deterministic guard: **${guard}**
${quoted(candidateMessages(item.providerDecision))}

Human disposition: [ ] Acceptable  [ ] Unacceptable  [ ] Guard false positive  [ ] Not comparable

Source boundary scope and each candidate's scope:

Meaning/factual/commitment/uncertainty, alternative-level and unrelated-temporal findings:

Instruction fit, communication effectiveness, naturalness, tone, relevance and concision:

---`;
    })
    .join("\n\n")}\n`;
}

function save(run: StoredRun): void {
  writeFileSync(resultsPath, `${JSON.stringify(run, null, 2)}\n`, { encoding: "utf8", flag: "w" });
  writeFileSync(reviewPath, review(run), { encoding: "utf8", flag: "w" });
}

function operationalFailure(code: string): boolean {
  return [
    "NOT_CONFIGURED",
    "INVALID_CREDENTIALS",
    "INSUFFICIENT_CREDITS",
    "RATE_LIMITED",
    "MODEL_UNAVAILABLE",
    "TIMEOUT",
    "PROVIDER_ERROR",
  ].includes(code);
}

async function main(): Promise<void> {
  if (
    composerB47TargetFixtures.length !== COMPOSER_B4_7_TARGET_MAX_CALLS ||
    COMPOSER_B4_7_TARGET_MAX_CALLS !== 10
  )
    throw new Error("Targeted B4.7 dataset/cap changed");
  if (approvedPipelineSnapshot.id !== CATALOG_SNAPSHOT)
    throw new Error("Approved Skills snapshot changed; stop for review");
  if (!process.argv.includes("--live")) {
    process.stdout.write("B4.7 readiness: 10 synthetic cases, 10-call cap; no provider invoked.\n");
    return;
  }
  if (process.env.OPENAI_TEXT_MODEL && process.env.OPENAI_TEXT_MODEL !== MODEL_ID)
    throw new Error("B4.7 model must match the frozen B4.6 model");
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
  if (existsSync(resultsPath))
    throw new Error("B4.7 targeted output already exists; no automatic overwrite or repeat calls");
  mkdirSync(outputDirectory, { recursive: true });
  const run: StoredRun = {
    agentBaseline: AGENT_BASELINE,
    skillsBaseline: SKILLS_BASELINE,
    catalogSnapshotId: approvedPipelineSnapshot.id,
    providerId: "openai",
    modelId: MODEL_ID,
    maxCalls: COMPOSER_B4_7_TARGET_MAX_CALLS,
    callsAttempted: 0,
    inProgressCase: null,
    cases: [],
  };
  const provider = new OpenAiCoachingAdapter({
    apiKey: process.env.OPENAI_API_KEY,
    modelId: MODEL_ID,
  });
  save(run);
  for (let index = 0; index < composerB47TargetFixtures.length; index += 1) {
    assertComposerB47TargetBudget(run.callsAttempted, 1);
    const fixture = composerB47TargetFixtures[index]!;
    const policy = decideCoachingAction(fixture.request);
    const inspected = await createSkillPipelineHarness(approvedPipelineSnapshot)(fixture);
    if (inspected.plan.status === "FAILED") throw new Error("Invalid SkillPlan in target fixture");
    const plan = skillPlanAsCommunicationPlan(inspected.plan);
    const guidance: CommunicationGuidance = { principles: plan.principles, avoid: plan.avoid };
    const task = buildComposerTask(fixture.request, policy, guidance);
    if (task.fixedAction !== policy.action) throw new Error("Fixed action changed");
    const observation: { providerDecision: CoachingDecisionResult | null; calls: number } = {
      providerDecision: null,
      calls: 0,
    };
    const generator: CoachingTextGenerator = {
      configuration: provider.configuration,
      async generateCoachingDecision(request, fixedPolicy, suppliedGuidance, suppliedTask) {
        observation.calls += 1;
        observation.providerDecision = await provider.generateCoachingDecision(
          request,
          fixedPolicy,
          suppliedGuidance,
          suppliedTask,
        );
        return observation.providerDecision;
      },
    };
    run.inProgressCase = fixture.id;
    run.callsAttempted += 1; // Reserve before the request; interruption never retries this case.
    save(run);
    const started = performance.now();
    const result = await coachConversation(generator, fixture.request, {
      skillPlanner: { plan: () => plan },
    });
    const durationMs = performance.now() - started;
    if (observation.calls !== 1) throw new Error("B4.7 fixture made an unexpected call count");
    const guardRule = observation.providerDecision?.ok
      ? evaluateCoachingDecisionGuards(
          observation.providerDecision.decision,
          fixture.request,
          policy,
          task,
        )
      : null;
    const resultCode = result.ok ? "PASS" : result.error.code;
    run.cases.push({
      caseId: fixture.id,
      action: policy.action,
      evidenceSummary: fixture.supportedEvidenceSummary,
      planStatus: inspected.plan.status,
      guidance,
      providerDecision: observation.providerDecision,
      resultCode,
      guardRule,
      durationMs,
    });
    run.inProgressCase = null;
    save(run);
    process.stdout.write(
      `${index + 1}/${composerB47TargetFixtures.length} ${fixture.id}: ${resultCode}${guardRule ? ` (${guardRule})` : ""}\n`,
    );
    if (operationalFailure(resultCode)) {
      process.stdout.write("Stopped after provider failure; no retry.\n");
      return;
    }
  }
  process.stdout.write(
    `B4.7 targeted generation complete: ${run.cases.length} cases, ${run.callsAttempted} calls. Review: ${reviewPath}\n`,
  );
}

main().catch(() => {
  // Never print provider responses, request content, validation errors, or credentials.
  process.stderr.write("B4_7_TARGET_RUN_FAILED; inspect content-free run state and local tests.\n");
  process.exitCode = 1;
});
