// SRS-4 live development evaluator. Deliberately outside production imports.
// Opt-in only: the $8 approval is scoped to the 50 frozen exposed cases.
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { packageRoot } from "../packages/skills/authoring/generator.js";
import {
  contentFreeDevelopmentObservation,
  prepareSrs4Development,
} from "../packages/skills/tests/srs4-development.js";
import { evaluateSupervisorDevelopment } from "../packages/skills/tests/srs4-development-evaluator.js";
import { createOfflineSupervisorPayload } from "../packages/skills/tests/srs4-supervisor-prompt.js";
import {
  observeSupervisor,
  type SkillSelection,
  type SupervisorInput,
} from "../packages/skills/tests/srs4-supervisor.js";

const root = resolve(packageRoot, "../..");
const configPath = resolve(packageRoot, "tests/fixtures/srs4/development-live-config-v1.json");
const outputDir = resolve(packageRoot, "tests/fixtures/srs4/development-live-v1");
const CONFIG_SHA256 = "3b4ecfe80979486c454009d48bdba640becc8f59c642fff11b759dfd6168f93a";
const APPROVED_CAP_USD = 8;
const sha256 = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const finiteInt = (value: unknown): number | null =>
  Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : null;
const object = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

interface FrozenConfig {
  experimentId: string;
  status: string;
  evidenceUse: string;
  provider: {
    requestedModel: string;
    maxOutputTokens: number;
    timeoutMs: number;
    automaticRetries: number;
    store: boolean;
    responseFormat: { name: string; schemaSha256: string };
  };
  corpus: {
    cases: number;
    plannedModelRequests: number;
    structuralBypasses: number;
    caseBindings: Array<{
      key: string;
      modelRequest: boolean;
      payloadSha256?: string;
      payloadBytes?: number;
    }>;
  };
  costEstimate: {
    proposedSpendCapUSD: number;
    estimatedMaximumUSD: number;
    estimatedInputTokenEnvelope: number;
    maxOutputTokensForRun: number;
    priceUSDPerMillionTokens: { inputOrCacheWrite: number; output: number };
  };
  sourcePaths: Record<string, string>;
  sourceSha256: Record<string, string>;
  noAuditScoring: boolean;
  noProtectedChallenge: boolean;
  noProductionChange: boolean;
  providerCallsAuthorized: boolean;
}

interface CallMetadata {
  key: string;
  stage: string;
  httpStatus: number | null;
  providerStatus: string | null;
  returnedModel: string | null;
  serviceTier: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  latencyMs: number;
  failureKind: string | null;
  costUpperBoundUSD: number;
}

function outputText(payload: unknown): string | null {
  const response = object(payload);
  if (response?.status !== "completed" || !Array.isArray(response.output)) return null;
  for (const item of response.output) {
    const message = object(item);
    if (!Array.isArray(message?.content)) continue;
    for (const part of message.content) {
      const content = object(part);
      if (content?.type === "output_text" && typeof content.text === "string") return content.text;
    }
  }
  return null;
}

function boundCost(inputTokens: number, outputTokens: number, config: FrozenConfig): number {
  const prices = config.costEstimate.priceUSDPerMillionTokens;
  return (inputTokens * prices.inputOrCacheWrite + outputTokens * prices.output) / 1_000_000;
}

function selectionIds(selection: SkillSelection | null): string[] {
  return selection?.status === "SELECTED"
    ? selection.selectedCapabilities.map((item) => item.skillId)
    : [];
}

async function main(): Promise<void> {
  if (!process.argv.includes("--live") || !process.argv.includes("--approved-cap-usd=8"))
    throw Error("Explicit --live and exact approved $8 cap flags are required");
  if (existsSync(outputDir)) throw Error("Immutable development observation output already exists");
  const configBytes = await readFile(configPath);
  if (sha256(configBytes) !== CONFIG_SHA256) throw Error("Frozen development config drift");
  const config = JSON.parse(configBytes.toString("utf8")) as FrozenConfig;
  if (
    config.experimentId !== "SRS-4-DEV-LIVE-1" ||
    config.status !== "FROZEN_PENDING_SEPARATE_SPEND_APPROVAL_NO_PROVIDER_CALL" ||
    config.evidenceUse !== "EXPOSED_DEVELOPMENT_ONLY" ||
    config.provider.requestedModel !== "gpt-6.1-sol" ||
    config.provider.maxOutputTokens !== 8192 ||
    config.provider.timeoutMs !== 60_000 ||
    config.provider.automaticRetries !== 0 ||
    config.provider.store !== false ||
    config.corpus.cases !== 53 ||
    config.corpus.plannedModelRequests !== 50 ||
    config.corpus.structuralBypasses !== 3 ||
    config.costEstimate.proposedSpendCapUSD !== APPROVED_CAP_USD ||
    config.costEstimate.estimatedMaximumUSD > APPROVED_CAP_USD ||
    !config.noAuditScoring ||
    !config.noProtectedChallenge ||
    !config.noProductionChange ||
    config.providerCallsAuthorized !== false
  )
    throw Error("Frozen development scope/config mismatch");
  for (const [name, path] of Object.entries(config.sourcePaths)) {
    if (sha256(await readFile(resolve(root, path))) !== config.sourceSha256[name])
      throw Error(`Frozen ${name} source drift`);
  }
  const prepared = await prepareSrs4Development();
  if (prepared.cases.length !== 53 || config.corpus.caseBindings.length !== 53)
    throw Error("Development case count mismatch");
  const boundByKey = new Map(config.corpus.caseBindings.map((item) => [item.key, item]));
  for (const row of prepared.cases) {
    const binding = boundByKey.get(row.key);
    if (!binding) throw Error("Missing frozen case binding");
    if ("stage" in row.input) {
      if (binding.modelRequest) throw Error("Structural bypass mismatch");
      continue;
    }
    const payload = createOfflineSupervisorPayload(row.input);
    const bytes = Buffer.from(
      `${payload.system}\n${payload.userJson}\n${JSON.stringify(payload.schema)}`,
      "utf8",
    );
    if (
      !binding.modelRequest ||
      binding.payloadSha256 !== sha256(bytes) ||
      binding.payloadBytes !== bytes.length ||
      config.provider.responseFormat.schemaSha256 !== sha256(JSON.stringify(payload.schema))
    )
      throw Error(`Frozen payload binding drift: ${row.key}`);
  }

  const envPath = resolve(root, ".env.local");
  if (existsSync(envPath)) process.loadEnvFile(envPath);
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw Error("Approved local OPENAI_API_KEY unavailable");
  // Never persist the key, requests, conversation text, or raw provider responses.
  const observations = [];
  const calls: CallMetadata[] = [];
  let reservedSpendUpperBoundUSD = 0;
  let completedRequests = 0;
  let fatalStop: string | null = null;
  for (const row of prepared.cases) {
    if ("stage" in row.input) {
      observations.push(contentFreeDevelopmentObservation(row, row.input));
      continue;
    }
    const binding = boundByKey.get(row.key)!;
    const perCallInputEnvelope = binding.payloadBytes! + 1024;
    const worstCallUSD = boundCost(perCallInputEnvelope, 8192, config);
    if (reservedSpendUpperBoundUSD + worstCallUSD > APPROVED_CAP_USD + 1e-9) {
      fatalStop = "BUDGET_CAP_GUARD";
      break;
    }
    const input = row.input as SupervisorInput;
    const payload = createOfflineSupervisorPayload(input);
    const providerSchema = { ...payload.schema } as Record<string, unknown>;
    delete providerSchema.$schema;
    const requestBody = {
      model: config.provider.requestedModel,
      store: false,
      instructions: payload.system,
      input: [{ role: "user", content: [{ type: "input_text", text: payload.userJson }] }],
      reasoning: { effort: "medium" },
      max_output_tokens: config.provider.maxOutputTokens,
      text: {
        format: {
          type: "json_schema",
          name: config.provider.responseFormat.name,
          strict: true,
          schema: providerSchema,
        },
      },
    };
    const started = performance.now();
    const meta: CallMetadata = {
      key: row.key,
      stage: "SUPERVISOR",
      httpStatus: null,
      providerStatus: null,
      returnedModel: null,
      serviceTier: null,
      inputTokens: null,
      outputTokens: null,
      totalTokens: null,
      latencyMs: 0,
      failureKind: null,
      costUpperBoundUSD: worstCallUSD,
    };
    const outcome = await observeSupervisor(input, {
      async judge() {
        // No automatic retries. A failed request is one FAILED observation.
        const response = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(config.provider.timeoutMs),
        });
        meta.httpStatus = response.status;
        const raw = (await response.json()) as unknown;
        const data = object(raw);
        meta.providerStatus = typeof data?.status === "string" ? data.status : null;
        meta.returnedModel = typeof data?.model === "string" ? data.model : null;
        meta.serviceTier = typeof data?.service_tier === "string" ? data.service_tier : null;
        const usage = object(data?.usage);
        meta.inputTokens = finiteInt(usage?.input_tokens);
        meta.outputTokens = finiteInt(usage?.output_tokens);
        meta.totalTokens = finiteInt(usage?.total_tokens);
        if (!response.ok) {
          meta.failureKind =
            response.status === 404 ? "MODEL_UNAVAILABLE" : `HTTP_${response.status}`;
          throw Error(meta.failureKind);
        }
        if (meta.returnedModel !== config.provider.requestedModel) {
          meta.failureKind = "RETURNED_MODEL_MISMATCH";
          throw Error(meta.failureKind);
        }
        const text = outputText(raw);
        if (!text) {
          meta.failureKind = meta.providerStatus === "incomplete" ? "INCOMPLETE" : "NO_OUTPUT_TEXT";
          return undefined;
        }
        try {
          return JSON.parse(text) as unknown;
        } catch {
          meta.failureKind = "INVALID_JSON";
          return undefined;
        }
      },
    });
    meta.latencyMs = Math.round(performance.now() - started);
    if (outcome.selection?.status === "FAILED" && meta.failureKind === null)
      meta.failureKind = outcome.selection.failureCode ?? "VALIDATION_FAILED";
    if (meta.inputTokens !== null && meta.outputTokens !== null) {
      meta.costUpperBoundUSD = boundCost(meta.inputTokens, meta.outputTokens, config);
      if (meta.costUpperBoundUSD > worstCallUSD) {
        fatalStop = "COST_ENVELOPE_EXCEEDED";
      }
    }
    reservedSpendUpperBoundUSD += Math.max(worstCallUSD, meta.costUpperBoundUSD);
    completedRequests++;
    calls.push(meta);
    observations.push(contentFreeDevelopmentObservation(row, outcome));
    process.stdout.write(
      `${String(completedRequests).padStart(2, "0")}/50 ${row.key} ${outcome.selection?.status ?? "BYPASS"} cost_upper_usd=${reservedSpendUpperBoundUSD.toFixed(4)}\n`,
    );
    if (
      fatalStop ||
      meta.failureKind === "MODEL_UNAVAILABLE" ||
      meta.failureKind === "RETURNED_MODEL_MISMATCH" ||
      meta.httpStatus === 401 ||
      meta.httpStatus === 403
    ) {
      fatalStop ??= meta.failureKind ?? `HTTP_${meta.httpStatus}`;
      break;
    }
  }
  // Join labels only after all intended raw observations or a recorded fatal stop.
  const metrics =
    observations.length === prepared.cases.length
      ? evaluateSupervisorDevelopment(observations, prepared.labels)
      : null;
  const regressionKeys: Record<string, string[]> = {
    "SRS3B:R06": ["follow_up"],
    "SRS3B:R10": ["boundary_setting"],
    "SRS3B:R14": ["planning"],
    "CONTROL:K20": ["follow_up"],
    "CONTROL:K21": ["expectation_setting"],
    "CONTROL:K22": ["status_update", "planning"],
  };
  const byKey = new Map(observations.map((item) => [item.key, item]));
  const regressions = Object.entries(regressionKeys).flatMap(([key, ids]) =>
    ids.map((skillId) => ({
      key,
      skillId,
      selected: selectionIds(byKey.get(key)?.selection ?? null).includes(skillId),
      evaluated: byKey.has(key),
    })),
  );
  const totalInputTokens = calls.reduce((sum, item) => sum + (item.inputTokens ?? 0), 0);
  const totalOutputTokens = calls.reduce((sum, item) => sum + (item.outputTokens ?? 0), 0);
  const knownCostUSD = calls.reduce(
    (sum, item) =>
      sum +
      (item.inputTokens !== null && item.outputTokens !== null
        ? boundCost(item.inputTokens, item.outputTokens, config)
        : 0),
    0,
  );
  const summary = {
    experimentId: config.experimentId,
    configSha256: CONFIG_SHA256,
    approvedCapUSD: APPROVED_CAP_USD,
    estimatedMaximumUSD: config.costEstimate.estimatedMaximumUSD,
    callsCompleted: completedRequests,
    structuralBypasses: observations.filter((item) => item.stage === "STRUCTURAL_EMPTY").length,
    fatalStop,
    modelRequested: config.provider.requestedModel,
    returnedModels: [...new Set(calls.map((item) => item.returnedModel).filter(Boolean))],
    totalInputTokens,
    totalOutputTokens,
    knownCostUSD: Number(knownCostUSD.toFixed(6)),
    conservativeCostUpperBoundUSD: Number(reservedSpendUpperBoundUSD.toFixed(6)),
    latencyMs: {
      total: calls.reduce((sum, item) => sum + item.latencyMs, 0),
      max: Math.max(0, ...calls.map((item) => item.latencyMs)),
    },
    sevenForbiddenRegressions: regressions,
    metrics,
    auditScored: false,
    protectedChallengeRead: false,
    productionChanged: false,
  };
  await mkdir(outputDir, { recursive: false });
  await Promise.all([
    writeFile(
      resolve(outputDir, "content-free-trace.json"),
      `${JSON.stringify({ observations, calls }, null, 2)}\n`,
      { flag: "wx" },
    ),
    writeFile(resolve(outputDir, "metrics.json"), `${JSON.stringify(summary, null, 2)}\n`, {
      flag: "wx",
    }),
  ]);
  process.stdout.write(
    `SUMMARY ${JSON.stringify({ callsCompleted: completedRequests, fatalStop, knownCostUSD: summary.knownCostUSD, conservativeCostUpperBoundUSD: summary.conservativeCostUpperBoundUSD, requiredGroundedSelected: metrics?.requiredGroundedSelected ?? null, forbiddenSelected: metrics?.forbiddenSelected ?? null })}\n`,
  );
  if (fatalStop) process.exitCode = 1;
}

main().catch((error: unknown) => {
  process.stderr.write(
    `SRS-4 live development stopped: ${error instanceof Error ? error.message : "UNKNOWN"}\n`,
  );
  process.exitCode = 1;
});
