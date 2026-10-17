// Explicit opt-in, one-shot SRS-4R-A exposed-development proof. No runtime import.
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { packageRoot } from "../packages/skills/authoring/generator.js";
import { prepareSrs4Development } from "../packages/skills/tests/srs4-development.js";
import type { SupervisorInput } from "../packages/skills/tests/srs4-supervisor.js";
import {
  validateSkillAssessmentBatch,
  validateSkillAssessmentSingleton,
  type AssessmentValidation,
  type SkillAssessment,
  type SkillAssessmentOutcome,
} from "../packages/skills/tests/srs4r-assessment.js";
import {
  createSkillAssessorBatchPayload,
  createSkillAssessorSingletonPayload,
} from "../packages/skills/tests/srs4r-assessor-prompt.js";
import {
  contentFreeAssessorObservation,
  evaluateAssessorDevelopment,
  type AssessorDevelopmentObservation,
} from "../packages/skills/tests/srs4r-development.js";
import {
  SRS4R_A_INDEPENDENCE_CASE_KEYS,
  evaluateSingletonBatchIndependence,
  unrunIndependenceGate,
  type IndependenceRecord,
} from "../packages/skills/tests/srs4r-independence.js";
import {
  SRS4R_LIVE_CAP_USD,
  SRS4R_LIVE_MODEL,
  SRS4R_LIVE_PRICE,
  SRS4R_LIVE_TIMEOUT_MS,
  liveRequestBody,
  renderSrs4rLiveConfig,
  requestUpperBoundUSD,
} from "../packages/skills/tests/srs4r-live-config.js";

const root = resolve(packageRoot, "../..");
const configPath = resolve(packageRoot, "tests/fixtures/srs4r/live-development-config-v1.json");
const outputDir = resolve(packageRoot, "tests/fixtures/srs4r/live-development-v1");
const CONFIG_SHA256 = "1fa4019d91e53c5d0746f99f91614ecbfa2e40b16324f48504ef2e1ba537db2e";
const sha = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
const object = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
const integer = (value: unknown): number | null =>
  Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : null;
const billedUSD = (input: number, output: number) =>
  (input * SRS4R_LIVE_PRICE.input + output * SRS4R_LIVE_PRICE.output) / 1_000_000;

interface Binding {
  requestSha256: string;
  requestBytes: number;
  maxOutputTokens: number;
  costUpperBoundUSD: number;
}
interface CaseBinding {
  key: string;
  modelRequest: boolean;
  idOrder?: Binding;
  reverseOrder?: Binding;
  singletons?: Array<Binding & { skillId: string }>;
}
interface FrozenConfig {
  experimentId: string;
  status: string;
  approval: { totalSpendCapUSD: number; maximumRequests: number };
  provider: { model: string; store: boolean; automaticRetries: number };
  maximumReservedCostUSD: number;
  caseBindings: CaseBinding[];
  auditScored: boolean;
  protectedChallengeRead: boolean;
  productionChanged: boolean;
  combinationImplemented: boolean;
}
interface CallRecord {
  key: string;
  view: "BATCH_ID_ORDER" | "BATCH_REVERSE_ORDER" | "SINGLETON";
  skillId: string | null;
  httpStatus: number | null;
  providerStatus: string | null;
  returnedModel: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number;
  costUpperBoundUSD: number;
  knownCostUSD: number | null;
  failureCode: string | null;
  validationStatus: "VALID" | "FAILED" | null;
  validationFailureCodes: string[];
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

async function main(): Promise<void> {
  if (!process.argv.includes("--live") || !process.argv.includes("--approved-cap-usd=2"))
    throw Error("Exact --live and --approved-cap-usd=2 flags are required");
  if (existsSync(outputDir)) throw Error("Immutable SRS-4R-A live output already exists");
  const configBytes = await readFile(configPath);
  if (
    sha(configBytes) !== CONFIG_SHA256 ||
    configBytes.toString("utf8") !== (await renderSrs4rLiveConfig())
  )
    throw Error("SRS-4R-A live config/source drift");
  const config = JSON.parse(configBytes.toString("utf8")) as FrozenConfig;
  if (
    config.experimentId !== "SRS-4R-A-LIVE-PROOF-V1" ||
    config.status !== "FROZEN_EXPOSED_DEVELOPMENT_ONLY" ||
    config.approval.totalSpendCapUSD !== SRS4R_LIVE_CAP_USD ||
    config.approval.maximumRequests !== 138 ||
    config.provider.model !== SRS4R_LIVE_MODEL ||
    config.provider.store !== false ||
    config.provider.automaticRetries !== 0 ||
    config.maximumReservedCostUSD > SRS4R_LIVE_CAP_USD ||
    config.auditScored ||
    config.protectedChallengeRead ||
    config.productionChanged ||
    config.combinationImplemented
  )
    throw Error("SRS-4R-A live scope mismatch");
  const prepared = await prepareSrs4Development();
  const caseByKey = new Map(prepared.cases.map((row) => [row.key, row]));
  const bindingByKey = new Map(config.caseBindings.map((row) => [row.key, row]));
  if (caseByKey.size !== 53 || bindingByKey.size !== 53) throw Error("Exposed case binding drift");
  const envPath = resolve(root, ".env.local");
  if (existsSync(envPath)) process.loadEnvFile(envPath);
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw Error("Previously approved local key unavailable");

  const calls: CallRecord[] = [];
  const gateRecords: IndependenceRecord[] = [];
  const observations: AssessorDevelopmentObservation[] = [];
  let reservedUSD = 0;
  let knownUSD = 0;
  let fatalStop: string | null = null;
  let gate = unrunIndependenceGate();
  let metrics: ReturnType<typeof evaluateAssessorDevelopment> | null = null;
  await mkdir(outputDir, { recursive: false });
  const save = async () => {
    // Closed metadata, skill IDs, and source refs only. Never write prompts or model responses.
    const trace = {
      experimentId: config.experimentId,
      configSha256: CONFIG_SHA256,
      calls,
      gateRecords,
      observations,
      gate,
      metrics,
      reservedUpperBoundUSD: Number(reservedUSD.toFixed(6)),
      knownBilledUSD: Number(knownUSD.toFixed(6)),
      fatalStop,
      auditScored: false,
      protectedChallengeRead: false,
      productionChanged: false,
    };
    await writeFile(
      resolve(outputDir, "content-free-trace.json"),
      `${JSON.stringify(trace, null, 2)}\n`,
      "utf8",
    );
  };

  async function assess(
    key: string,
    input: SupervisorInput,
    view: CallRecord["view"],
    expected: Binding,
    skillId: string | null = null,
  ): Promise<AssessmentValidation | null> {
    const payload = skillId
      ? createSkillAssessorSingletonPayload(input, skillId)
      : view === "BATCH_REVERSE_ORDER"
        ? createSkillAssessorBatchPayload(
            input,
            input.candidates.map((item) => item.skillId).reverse(),
          )
        : createSkillAssessorBatchPayload(input);
    const body = liveRequestBody(payload, skillId ? "SINGLETON" : "BATCH");
    const serialized = JSON.stringify(body);
    const upper = requestUpperBoundUSD(body);
    if (
      sha(serialized) !== expected.requestSha256 ||
      Buffer.byteLength(serialized, "utf8") !== expected.requestBytes ||
      body.max_output_tokens !== expected.maxOutputTokens ||
      Math.abs(upper - expected.costUpperBoundUSD) > 1e-12
    )
      throw Error(`Frozen request binding drift: ${key}/${view}`);
    if (
      calls.length >= config.approval.maximumRequests ||
      reservedUSD + upper > SRS4R_LIVE_CAP_USD + 1e-9
    ) {
      fatalStop = "BUDGET_CAP_GUARD";
      return null;
    }
    reservedUSD += upper; // Reserve before the request, including an unknown-usage timeout.
    const record: CallRecord = {
      key,
      view,
      skillId,
      httpStatus: null,
      providerStatus: null,
      returnedModel: null,
      inputTokens: null,
      outputTokens: null,
      latencyMs: 0,
      costUpperBoundUSD: upper,
      knownCostUSD: null,
      failureCode: null,
      validationStatus: null,
      validationFailureCodes: [],
    };
    calls.push(record);
    const start = performance.now();
    let decoded: unknown = null;
    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: serialized,
        signal: AbortSignal.timeout(SRS4R_LIVE_TIMEOUT_MS),
      });
      record.httpStatus = response.status;
      const raw = (await response.json()) as unknown;
      const data = object(raw);
      record.providerStatus = typeof data?.status === "string" ? data.status : null;
      record.returnedModel = typeof data?.model === "string" ? data.model : null;
      const usage = object(data?.usage);
      record.inputTokens = integer(usage?.input_tokens);
      record.outputTokens = integer(usage?.output_tokens);
      if (record.inputTokens !== null && record.outputTokens !== null) {
        record.knownCostUSD = billedUSD(record.inputTokens, record.outputTokens);
        knownUSD += record.knownCostUSD;
        if (record.knownCostUSD > upper + 1e-9) record.failureCode = "COST_ENVELOPE_EXCEEDED";
      }
      if (!response.ok)
        record.failureCode ??=
          response.status === 404 ? "MODEL_UNAVAILABLE" : `HTTP_${response.status}`;
      else if (record.returnedModel !== SRS4R_LIVE_MODEL)
        record.failureCode ??= "RETURNED_MODEL_MISMATCH";
      else {
        const text = outputText(raw);
        if (!text)
          record.failureCode ??=
            record.providerStatus === "incomplete" ? "INCOMPLETE" : "NO_OUTPUT_TEXT";
        else {
          try {
            decoded = JSON.parse(text) as unknown;
          } catch {
            record.failureCode ??= "JSON_PARSE_FAILED";
          }
        }
      }
    } catch {
      record.failureCode ??= "TRANSPORT_OR_TIMEOUT";
    }
    record.latencyMs = Math.round(performance.now() - start);
    if (record.failureCode === null) {
      const validation = skillId
        ? validateSkillAssessmentSingleton(input, skillId, decoded)
        : validateSkillAssessmentBatch(input, decoded);
      record.validationStatus = validation.status;
      record.validationFailureCodes = validation.failureCodes;
      if (validation.status === "FAILED") record.failureCode = "APPLICATION_VALIDATION_FAILED";
      await save();
      process.stdout.write(
        `${calls.length}/138 ${key} ${view}${skillId ? ` ${skillId}` : ""} ${validation.status} reserved=$${reservedUSD.toFixed(4)}\n`,
      );
      return validation;
    }
    fatalStop = record.failureCode;
    await save();
    process.stdout.write(
      `${calls.length}/138 ${key} ${view} FAILED:${record.failureCode} reserved=$${reservedUSD.toFixed(4)}\n`,
    );
    return null;
  }

  try {
    // Gate first. A failure ends this one-shot run before the remaining development batches.
    for (const key of SRS4R_A_INDEPENDENCE_CASE_KEYS) {
      const row = caseByKey.get(key);
      const bound = bindingByKey.get(key);
      if (
        !row ||
        !bound?.idOrder ||
        !bound.reverseOrder ||
        !bound.singletons ||
        "stage" in row.input
      )
        throw Error(`Independence case binding missing: ${key}`);
      const input = row.input;
      const batchIdOrder = await assess(key, input, "BATCH_ID_ORDER", bound.idOrder);
      if (batchIdOrder?.status !== "VALID") {
        fatalStop ??= "BATCH_ID_ORDER_INVALID";
        break;
      }
      observations.push(
        contentFreeAssessorObservation(row, {
          stage: "ASSESSOR",
          status: "VALID",
          assessments: batchIdOrder.assessments,
          failureCodes: [],
        }),
      );
      const batchReverseOrder = await assess(key, input, "BATCH_REVERSE_ORDER", bound.reverseOrder);
      if (batchReverseOrder?.status !== "VALID") {
        fatalStop ??= "BATCH_REVERSE_ORDER_INVALID";
        break;
      }
      const singletonRows: SkillAssessment[] = [];
      for (const candidate of input.candidates) {
        const singletonBinding = bound.singletons.find(
          (item) => item.skillId === candidate.skillId,
        );
        if (!singletonBinding)
          throw Error(`Singleton binding missing: ${key}/${candidate.skillId}`);
        const singleton = await assess(
          key,
          input,
          "SINGLETON",
          singletonBinding,
          candidate.skillId,
        );
        if (singleton?.status !== "VALID") {
          fatalStop ??= "SINGLETON_INVALID";
          break;
        }
        singletonRows.push(singleton.assessments[0]!);
      }
      if (fatalStop) break;
      const allSingletons = validateSkillAssessmentBatch(input, { assessments: singletonRows });
      gateRecords.push({ key, batchIdOrder, batchReverseOrder, allSingletons });
      await save();
    }
    if (!fatalStop) {
      gate = evaluateSingletonBatchIndependence(gateRecords, "LIVE_PROVIDER");
      await save();
      if (gate.gateStatus !== "PASS") fatalStop = "INDEPENDENCE_GATE_FAIL";
    }
    if (!fatalStop) {
      for (const row of prepared.cases) {
        if (SRS4R_A_INDEPENDENCE_CASE_KEYS.some((key) => key === row.key)) continue;
        if ("stage" in row.input) {
          const bypass: SkillAssessmentOutcome = {
            stage: row.input.stage === "SUPERVISOR" ? "STRUCTURAL_EMPTY" : row.input.stage,
            status: "BYPASSED",
            assessments: [],
            failureCodes: [],
          };
          observations.push(contentFreeAssessorObservation(row, bypass));
          continue;
        }
        const bound = bindingByKey.get(row.key);
        if (!bound?.idOrder) throw Error(`Exposed batch binding missing: ${row.key}`);
        const result = await assess(row.key, row.input, "BATCH_ID_ORDER", bound.idOrder);
        if (result?.status !== "VALID") {
          fatalStop ??= "DEVELOPMENT_BATCH_INVALID";
          break;
        }
        observations.push(
          contentFreeAssessorObservation(row, {
            stage: "ASSESSOR",
            status: "VALID",
            assessments: result.assessments,
            failureCodes: [],
          }),
        );
      }
    }
    if (!fatalStop) metrics = evaluateAssessorDevelopment(observations, prepared.labels);
  } catch {
    fatalStop ??= "LOCAL_EVALUATOR_FAILURE";
  } finally {
    await save();
  }
  process.stdout.write(
    `SUMMARY ${JSON.stringify({ calls: calls.length, gate: gate.gateStatus, fatalStop, requiredGroundedSupported: metrics?.requiredGroundedSupported ?? null, forbiddenPositivelySupported: metrics?.forbiddenPositivelySupported ?? null, wordingNoneClean: metrics?.wordingNoneWithoutSupportedCandidate ?? null, knownUSD: Number(knownUSD.toFixed(6)), reservedUpperBoundUSD: Number(reservedUSD.toFixed(6)) })}\n`,
  );
  if (fatalStop || gate.gateStatus !== "PASS") process.exitCode = 1;
}

main().catch((error: unknown) => {
  process.stderr.write(
    `SRS-4R-A live preflight stopped: ${error instanceof Error ? error.message : "UNKNOWN"}\n`,
  );
  process.exitCode = 1;
});
