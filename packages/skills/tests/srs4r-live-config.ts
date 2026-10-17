// One-shot exposed-development configuration. No provider calls in this module.
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { format } from "prettier";
import { packageRoot } from "../authoring/generator.js";
import { prepareSrs4Development } from "./srs4-development.js";
import {
  createSkillAssessorBatchPayload,
  createSkillAssessorSingletonPayload,
} from "./srs4r-assessor-prompt.js";
import { SRS4R_A_INDEPENDENCE_CASE_KEYS } from "./srs4r-independence.js";

const root = resolve(packageRoot, "../..");
const sha = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
export const SRS4R_LIVE_MODEL = "gpt-5.6-luna";
export const SRS4R_LIVE_CAP_USD = 2;
export const SRS4R_LIVE_PRICE = { input: 0.2, output: 1.2 } as const;
export const SRS4R_LIVE_BATCH_MAX_OUTPUT = 8192;
export const SRS4R_LIVE_SINGLETON_MAX_OUTPUT = 1024;
export const SRS4R_LIVE_TIMEOUT_MS = 45_000;
export const SRS4R_OFFLINE_FREEZE_SHA =
  "76cab0f8b3391c132b17bd5e1c53ff6f4447a168f26f7e9398d33049516cdfc0";

interface AssessorPayload {
  system: string;
  userJson: string;
  schema: object;
}

export function liveRequestBody(payload: AssessorPayload, view: "BATCH" | "SINGLETON") {
  const schema = { ...payload.schema } as Record<string, unknown>;
  delete schema.$schema;
  return {
    model: SRS4R_LIVE_MODEL,
    store: false,
    instructions: payload.system,
    input: [{ role: "user", content: [{ type: "input_text", text: payload.userJson }] }],
    reasoning: { effort: "low" },
    max_output_tokens:
      view === "BATCH" ? SRS4R_LIVE_BATCH_MAX_OUTPUT : SRS4R_LIVE_SINGLETON_MAX_OUTPUT,
    text: {
      format: {
        type: "json_schema",
        name: view === "BATCH" ? "skill_assessment_batch_v1" : "skill_assessment_singleton_v1",
        strict: true,
        schema,
      },
    },
  };
}

export function requestUpperBoundUSD(requestBody: ReturnType<typeof liveRequestBody>): number {
  const inputTokenEnvelope = Buffer.byteLength(JSON.stringify(requestBody), "utf8") + 1024;
  return (
    (inputTokenEnvelope * SRS4R_LIVE_PRICE.input +
      requestBody.max_output_tokens * SRS4R_LIVE_PRICE.output) /
    1_000_000
  );
}

function binding(payload: AssessorPayload, view: "BATCH" | "SINGLETON") {
  const body = liveRequestBody(payload, view);
  return {
    requestSha256: sha(JSON.stringify(body)),
    requestBytes: Buffer.byteLength(JSON.stringify(body), "utf8"),
    maxOutputTokens: body.max_output_tokens,
    costUpperBoundUSD: requestUpperBoundUSD(body),
  };
}

export async function renderSrs4rLiveConfig(): Promise<string> {
  const offlineBytes = await readFile(
    resolve(packageRoot, "tests/fixtures/srs4r/assessor-offline-freeze-v1.json"),
  );
  if (sha(offlineBytes) !== SRS4R_OFFLINE_FREEZE_SHA) throw Error("SRS-4R-A offline freeze drift");
  const { cases } = await prepareSrs4Development();
  if (cases.length !== 53) throw Error("SRS-4R exposed development count drift");
  const gateKeys = new Set<string>(SRS4R_A_INDEPENDENCE_CASE_KEYS);
  const caseBindings = cases.map((row) => {
    const input = row.input;
    if ("stage" in input) return { key: row.key, action: row.action, modelRequest: false };
    const idOrder = binding(createSkillAssessorBatchPayload(input), "BATCH");
    if (!gateKeys.has(row.key))
      return { key: row.key, action: row.action, modelRequest: true, idOrder };
    const reverseOrder = binding(
      createSkillAssessorBatchPayload(
        input,
        input.candidates.map((item) => item.skillId).reverse(),
      ),
      "BATCH",
    );
    const singletons = input.candidates.map((candidate) => ({
      skillId: candidate.skillId,
      ...binding(createSkillAssessorSingletonPayload(input, candidate.skillId), "SINGLETON"),
    }));
    return {
      key: row.key,
      action: row.action,
      modelRequest: true,
      idOrder,
      reverseOrder,
      singletons,
    };
  });
  const requests = caseBindings.flatMap((row) =>
    "idOrder" in row && row.idOrder
      ? [
          row.idOrder,
          ...("reverseOrder" in row && row.reverseOrder ? [row.reverseOrder] : []),
          ...("singletons" in row && row.singletons ? row.singletons : []),
        ]
      : [],
  );
  const maximumReservedCostUSD = requests.reduce((sum, item) => sum + item.costUpperBoundUSD, 0);
  if (requests.length !== 138 || maximumReservedCostUSD > SRS4R_LIVE_CAP_USD)
    throw Error("SRS-4R-A live request count or worst-case cost exceeds approval");
  const sourcePaths = {
    offlineFreeze: "packages/skills/tests/fixtures/srs4r/assessor-offline-freeze-v1.json",
    developmentLoader: "packages/skills/tests/srs4-development.ts",
    liveConfigBuilder: "packages/skills/tests/srs4r-live-config.ts",
    independencePlan: "packages/skills/tests/fixtures/srs4r/assessor-independence-plan-v1.json",
  } as const;
  const sourceSha256 = Object.fromEntries(
    await Promise.all(
      Object.entries(sourcePaths).map(async ([name, path]) => [
        name,
        sha(await readFile(resolve(root, path))),
      ]),
    ),
  );
  return format(
    JSON.stringify({
      schemaVersion: 1,
      experimentId: "SRS-4R-A-LIVE-PROOF-V1",
      status: "FROZEN_EXPOSED_DEVELOPMENT_ONLY",
      approval: { totalSpendCapUSD: SRS4R_LIVE_CAP_USD, maximumRequests: 138 },
      provider: {
        model: SRS4R_LIVE_MODEL,
        endpoint: "https://api.openai.com/v1/responses",
        store: false,
        reasoningEffort: "low",
        timeoutMs: SRS4R_LIVE_TIMEOUT_MS,
        automaticRetries: 0,
        batchMaxOutputTokens: SRS4R_LIVE_BATCH_MAX_OUTPUT,
        singletonMaxOutputTokens: SRS4R_LIVE_SINGLETON_MAX_OUTPUT,
      },
      priceUSDPerMillionTokens: SRS4R_LIVE_PRICE,
      maximumReservedCostUSD,
      sourcePaths,
      sourceSha256,
      caseBindings,
      independenceCaseKeys: SRS4R_A_INDEPENDENCE_CASE_KEYS,
      auditScored: false,
      protectedChallengeRead: false,
      productionChanged: false,
      combinationImplemented: false,
    }),
    { parser: "json" },
  );
}
