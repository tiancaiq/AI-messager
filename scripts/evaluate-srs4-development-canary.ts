// SRS-4-D3: opt-in, five-request output-contract canary. Never import from production.
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { packageRoot } from "../packages/skills/authoring/generator.js";
import {
  SRS4_D3_CASES,
  SRS4_D3_ID,
  renderSrs4DevelopmentCanaryConfig,
} from "../packages/skills/tests/srs4-development-canary-config.js";
import { prepareSrs4Development } from "../packages/skills/tests/srs4-development.js";
import {
  aggregateD2Stages,
  diagnoseSupervisorProviderResponse,
  Srs4D2DiagnosticSchema,
  type Srs4D2Diagnostic,
} from "../packages/skills/tests/srs4-output-contract-diagnostic.js";
import { createOfflineSupervisorPayload } from "../packages/skills/tests/srs4-supervisor-prompt.js";
import type { SupervisorInput } from "../packages/skills/tests/srs4-supervisor.js";

const root = resolve(packageRoot, "../..");
const configPath = resolve(packageRoot, "tests/fixtures/srs4/development-canary-config-v1.json");
const outputDir = resolve(packageRoot, "tests/fixtures/srs4/development-canary-v1");
const sha256 = (value: Uint8Array | string): string =>
  createHash("sha256").update(value).digest("hex");
const finiteInt = (value: unknown): number | null =>
  Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : null;
const object = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
const safeModel = (value: unknown): string | null =>
  typeof value === "string" && /^[A-Za-z0-9._-]{1,80}$/u.test(value) ? value : null;
const safeStatus = (value: unknown): string | null =>
  typeof value === "string" && /^[a-z_]{1,40}$/u.test(value) ? value : null;

interface Config {
  experimentId: string;
  status: string;
  evidenceUse: string;
  spendAuthorization: { approvedCapUSD: number; plannedRequests: number };
  provider: {
    requestedModel: string;
    reasoning: { mode: string; effort: string };
    responseFormat: { name: string; schemaSha256: string };
    maxOutputTokens: number;
    timeoutMs: number;
    automaticRetries: number;
    store: boolean;
  };
  caseBindings: Array<{
    key: string;
    rawRevision: string;
    payloadSha256: string;
    payloadBytes: number;
    candidateCount: number;
  }>;
  costEstimate: {
    estimatedMaximumUSD: number;
    priceUSDPerMillionTokens: { inputOrCacheWrite: number; output: number };
  };
  auditScored: boolean;
  protectedChallengeRead: boolean;
  productionChanged: boolean;
}

type FailureKind =
  | "NONE"
  | "HTTP_ERROR"
  | "TRANSPORT_ERROR"
  | "PROVIDER_BODY_INVALID"
  | "MODEL_MISMATCH"
  | "PROVIDER_INCOMPLETE"
  | "VALIDATION_FAILED";

interface CanaryObservation {
  key: string;
  rawRevision: string;
  payloadSha256: string;
  httpStatus: number | null;
  httpSuccess: boolean;
  providerCompletionStatus: string | null;
  returnedModel: string | null;
  serviceTier: string | null;
  providerBodyJsonValid: boolean | null;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  latencyMs: number;
  failureKind: FailureKind;
  d2: Srs4D2Diagnostic;
  v1ValidatorStatus: "VALID" | "INVALID";
  v1SelectionStatus: "SELECTED" | "NONE" | "FAILED";
  selectedIds: string[];
  knownCostUSD: number | null;
  conservativeCostUpperBoundUSD: number;
}

function boundCost(input: number, output: number, config: Config): number {
  const prices = config.costEstimate.priceUSDPerMillionTokens;
  return (input * prices.inputOrCacheWrite + output * prices.output) / 1_000_000;
}

async function main(): Promise<void> {
  if (
    process.argv.length !== 4 ||
    process.argv[2] !== "--live" ||
    process.argv[3] !== "--approved-cap-usd=1"
  )
    throw Error("SRS-4-D3 requires exact --live --approved-cap-usd=1 flags");
  if (existsSync(outputDir)) throw Error("SRS-4-D3 immutable canary output already exists");
  const configBytes = await readFile(configPath);
  const rendered = await renderSrs4DevelopmentCanaryConfig();
  if (configBytes.toString("utf8") !== rendered) throw Error("SRS-4-D3 config/payload drift");
  const config = JSON.parse(rendered) as Config;
  if (
    config.experimentId !== SRS4_D3_ID ||
    config.status !== "FROZEN_APPROVED_FIVE_REQUEST_CANARY" ||
    config.evidenceUse !== "EXPOSED_DEVELOPMENT_ONLY" ||
    config.spendAuthorization.approvedCapUSD !== 1 ||
    config.spendAuthorization.plannedRequests !== 5 ||
    config.provider.requestedModel !== "gpt-6.1-sol" ||
    config.provider.reasoning.mode !== "standard" ||
    config.provider.reasoning.effort !== "medium" ||
    config.provider.maxOutputTokens !== 8192 ||
    config.provider.timeoutMs !== 60_000 ||
    config.provider.automaticRetries !== 0 ||
    config.provider.store !== false ||
    config.caseBindings.length !== 5 ||
    config.costEstimate.estimatedMaximumUSD >= 1 ||
    config.auditScored ||
    config.protectedChallengeRead ||
    config.productionChanged
  )
    throw Error("SRS-4-D3 frozen scope mismatch");
  const { cases } = await prepareSrs4Development();
  const byKey = new Map(cases.map((row) => [row.key, row]));
  const prepared = config.caseBindings.map((binding, index) => {
    const expected = SRS4_D3_CASES[index];
    const row = byKey.get(binding.key);
    if (
      !expected ||
      binding.key !== expected.key ||
      binding.rawRevision !== expected.revision ||
      !row ||
      "stage" in row.input
    )
      throw Error("SRS-4-D3 requested case/revision unavailable");
    const payload = createOfflineSupervisorPayload(row.input);
    const payloadBytes = Buffer.from(
      `${payload.system}\n${payload.userJson}\n${JSON.stringify(payload.schema)}`,
      "utf8",
    );
    if (
      sha256(payloadBytes) !== binding.payloadSha256 ||
      payloadBytes.length !== binding.payloadBytes ||
      row.input.candidates.length !== binding.candidateCount ||
      sha256(JSON.stringify(payload.schema)) !== config.provider.responseFormat.schemaSha256
    )
      throw Error(`SRS-4-D3 frozen payload mismatch: ${binding.key}`);
    return { binding, input: row.input as SupervisorInput, payload };
  });
  if (new Set(config.caseBindings.map((item) => item.key)).size !== 5)
    throw Error("SRS-4-D3 duplicate requested case");
  const envPath = resolve(root, ".env.local");
  if (existsSync(envPath)) process.loadEnvFile(envPath);
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw Error("SRS-4-D3 approved local credential unavailable");

  // The directory and per-request intent markers prevent an ambiguous rerun after interruption.
  await mkdir(outputDir, { recursive: false });
  const observations: CanaryObservation[] = [];
  const configSha256 = sha256(configBytes);
  let reservedUpperBoundUSD = 0;
  let fatalStop: string | null = null;
  for (const [index, { binding, input, payload }] of prepared.entries()) {
    const worstCallUSD = boundCost(binding.payloadBytes + 1024, 8192, config);
    if (reservedUpperBoundUSD + worstCallUSD > 1 + 1e-9) {
      fatalStop = "BUDGET_CAP_GUARD";
      break;
    }
    await writeFile(
      resolve(outputDir, `intent-${String(index + 1).padStart(2, "0")}.json`),
      `${JSON.stringify({ experimentId: SRS4_D3_ID, key: binding.key, payloadSha256: binding.payloadSha256, oneRequestOnly: true }, null, 2)}\n`,
      { flag: "wx" },
    );
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
    let httpStatus: number | null = null;
    let providerBodyJsonValid: boolean | null = null;
    let providerData: unknown = null;
    let failureKind: FailureKind = "NONE";
    const started = performance.now();
    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(config.provider.timeoutMs),
      });
      httpStatus = response.status;
      const responseText = await response.text();
      try {
        providerData = JSON.parse(responseText) as unknown;
        providerBodyJsonValid = true;
      } catch {
        providerBodyJsonValid = false;
        failureKind = "PROVIDER_BODY_INVALID";
      }
      if (!response.ok) failureKind = "HTTP_ERROR";
    } catch {
      failureKind = "TRANSPORT_ERROR";
    }
    const latencyMs = Math.round(performance.now() - started);
    const data = object(providerData);
    const usage = object(data?.usage);
    const returnedModel = safeModel(data?.model);
    const providerCompletionStatus = safeStatus(data?.status);
    const inputTokens = finiteInt(usage?.input_tokens);
    const outputTokens = finiteInt(usage?.output_tokens);
    const totalTokens = finiteInt(usage?.total_tokens);
    const httpSuccess = httpStatus !== null && httpStatus >= 200 && httpStatus < 300;
    const { diagnostic, selection } = diagnoseSupervisorProviderResponse(
      input,
      httpSuccess && providerBodyJsonValid ? providerData : null,
      binding.key,
    );
    Srs4D2DiagnosticSchema.parse(diagnostic);
    const v1SelectionStatus = selection?.status ?? "FAILED";
    if (httpSuccess && returnedModel && returnedModel !== config.provider.requestedModel)
      failureKind = "MODEL_MISMATCH";
    else if (httpSuccess && providerCompletionStatus !== "completed")
      failureKind = "PROVIDER_INCOMPLETE";
    else if (failureKind === "NONE" && diagnostic.validatorStatus === "INVALID")
      failureKind = "VALIDATION_FAILED";
    const knownCostUSD =
      inputTokens !== null && outputTokens !== null
        ? boundCost(inputTokens, outputTokens, config)
        : null;
    const conservativeCostUpperBoundUSD = Math.max(worstCallUSD, knownCostUSD ?? 0);
    reservedUpperBoundUSD += conservativeCostUpperBoundUSD;
    const observation: CanaryObservation = {
      key: binding.key,
      rawRevision: binding.rawRevision,
      payloadSha256: binding.payloadSha256,
      httpStatus,
      httpSuccess,
      providerCompletionStatus,
      returnedModel,
      serviceTier: safeModel(data?.service_tier),
      providerBodyJsonValid,
      inputTokens,
      outputTokens,
      totalTokens,
      latencyMs,
      failureKind,
      d2: diagnostic,
      v1ValidatorStatus: diagnostic.validatorStatus,
      v1SelectionStatus,
      selectedIds:
        diagnostic.validatorStatus === "VALID" && selection?.status === "SELECTED"
          ? selection.selectedCapabilities.map((item) => item.skillId)
          : [],
      knownCostUSD: knownCostUSD === null ? null : Number(knownCostUSD.toFixed(6)),
      conservativeCostUpperBoundUSD: Number(conservativeCostUpperBoundUSD.toFixed(6)),
    };
    observations.push(observation);
    await writeFile(
      resolve(outputDir, `observation-${String(index + 1).padStart(2, "0")}.json`),
      `${JSON.stringify(observation, null, 2)}\n`,
      { flag: "wx" },
    );
    process.stdout.write(
      `${index + 1}/5 ${binding.key} ${diagnostic.validatorStatus} ${diagnostic.firstFailedStage ?? "VALID"}\n`,
    );
    if (reservedUpperBoundUSD > 1 + 1e-9) fatalStop = "COST_ENVELOPE_EXCEEDED";
    if (httpStatus === 401 || httpStatus === 403 || httpStatus === 404)
      fatalStop ??= "PROVIDER_ACCESS_FAILURE";
    if (failureKind === "MODEL_MISMATCH") fatalStop ??= "RETURNED_MODEL_MISMATCH";
    if (fatalStop) break;
  }
  const trace = {
    experimentId: SRS4_D3_ID,
    configSha256,
    plannedRequests: 5,
    actualRequests: observations.length,
    observations,
  };
  const traceBytes = `${JSON.stringify(trace, null, 2)}\n`;
  const valid = observations.filter((item) => item.v1ValidatorStatus === "VALID").length;
  const diagnostics = observations.map((item) => item.d2);
  const stageStats = aggregateD2Stages(diagnostics);
  const failureCodeCounts = Object.fromEntries(
    [...new Set(diagnostics.flatMap((item) => item.failureCodes))]
      .sort()
      .map((code) => [code, diagnostics.filter((item) => item.failureCodes.includes(code)).length]),
  );
  const metrics = {
    experimentId: SRS4_D3_ID,
    configSha256,
    plannedRequests: 5,
    actualRequests: observations.length,
    completed: observations.length === 5 && fatalStop === null,
    fatalStop,
    contractValid: valid,
    contractValidityDenominator: 5,
    verdict:
      observations.length !== 5 || fatalStop
        ? "INCOMPLETE"
        : valid === 5
          ? "READY"
          : valid > 0
            ? "PARTIAL"
            : "FAIL",
    stageStats,
    failureCodeCounts,
    candidateOmissionCases: observations
      .filter((item) => item.d2.counts.missingCandidateCount > 0)
      .map((item) => item.key),
    wireSchemaFailureCases: observations
      .filter((item) => item.d2.wireSchemaValid === false)
      .map((item) => item.key),
    evidenceOrProvenanceFailureCases: observations
      .filter((item) =>
        item.d2.failureCodes.some((code) =>
          [
            "EVIDENCE_REF_USE_DUPLICATE",
            "UNKNOWN_EVIDENCE_REF",
            "INVALID_OBJECTIVE_SOURCE",
            "OTHER_USED_AS_USER_FACT",
            "UNKNOWN_USED_AS_USER_FACT",
            "SELECTED_GOAL_USED_AS_FACT",
            "NEGATION_EVIDENCE_INVALID",
            "PREREQUISITE_EVIDENCE_INVALID",
            "SELECT_WITHOUT_EVIDENCE",
            "SELECT_WITH_CONTEXT_ONLY",
            "FACT_GROUNDING_MISSING",
          ].includes(code),
        ),
      )
      .map((item) => item.key),
    inputTokens: observations.reduce((sum, item) => sum + (item.inputTokens ?? 0), 0),
    outputTokens: observations.reduce((sum, item) => sum + (item.outputTokens ?? 0), 0),
    knownCostUSD: Number(
      observations.reduce((sum, item) => sum + (item.knownCostUSD ?? 0), 0).toFixed(6),
    ),
    conservativeCostUpperBoundUSD: Number(reservedUpperBoundUSD.toFixed(6)),
    latencyMs: {
      total: observations.reduce((sum, item) => sum + item.latencyMs, 0),
      max: Math.max(0, ...observations.map((item) => item.latencyMs)),
    },
    modelRequested: config.provider.requestedModel,
    returnedModels: [...new Set(observations.map((item) => item.returnedModel).filter(Boolean))],
    auditScored: false,
    protectedChallengeRead: false,
    productionChanged: false,
  };
  const metricsBytes = `${JSON.stringify(metrics, null, 2)}\n`;
  await writeFile(resolve(outputDir, "content-free-trace.json"), traceBytes, { flag: "wx" });
  await writeFile(resolve(outputDir, "metrics.json"), metricsBytes, { flag: "wx" });
  const validation = {
    experimentId: SRS4_D3_ID,
    configSha256,
    traceSha256: sha256(traceBytes),
    metricsSha256: sha256(metricsBytes),
    d2FreezeSha256: "504503dc937f425d090dfab231f6919379b2a1d70a4d3747911ab7a712c5b540",
    v1ConfigSha256: "3b4ecfe80979486c454009d48bdba640becc8f59c642fff11b759dfd6168f93a",
    checks: {
      fiveExactCases: config.caseBindings.map((item) => item.key),
      noAutomaticRetries: config.provider.automaticRetries === 0,
      auditScored: false,
      protectedChallengeRead: false,
      productionChanged: false,
    },
  };
  await writeFile(
    resolve(outputDir, "validation-record.json"),
    `${JSON.stringify(validation, null, 2)}\n`,
    {
      flag: "wx",
    },
  );
  process.stdout.write(
    `SRS-4-D3 RESULT ${valid}/${observations.length} valid; verdict=${metrics.verdict}; cost_upper_usd=${metrics.conservativeCostUpperBoundUSD}; trace_sha256=${validation.traceSha256}\n`,
  );
  if (fatalStop) process.exitCode = 1;
}

main().catch(() => {
  // Never print provider response, prompt, credential, or raw exception details.
  process.stderr.write("SRS-4-D3 stopped by a preflight or diagnostic safety check.\n");
  process.exitCode = 1;
});
