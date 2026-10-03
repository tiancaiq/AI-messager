import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { format } from "prettier";
import { packageRoot } from "../authoring/generator.js";
import { prepareSrs4Development } from "./srs4-development.js";
import {
  createOfflineSupervisorPayload,
  SRS4_OFFLINE_PROMPT_ID,
  SRS4_SYSTEM_INSTRUCTIONS,
  SRS4_WIRE_JSON_SCHEMA,
} from "./srs4-supervisor-prompt.js";
import { SRS4_B_SHA256 } from "./srs4-supervisor.js";

const root = resolve(packageRoot, "../..");
const sha256 = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest("hex");
const files = {
  supervisor: "packages/skills/tests/srs4-supervisor.ts",
  prompt: "packages/skills/tests/srs4-supervisor-prompt.ts",
  development: "packages/skills/tests/srs4-development.ts",
  evaluator: "packages/skills/tests/srs4-development-evaluator.ts",
  bConfig: "packages/skills/tests/fixtures/srs3f/semantic-topk-proposed-config-v1.json",
  bTrace: "packages/skills/tests/fixtures/srs3f/semantic-topk-exposed-v1.json",
  profiles: "packages/skills/tests/fixtures/srs3/semantic-skill-profiles.json",
  auditR2Freeze: "packages/skills/tests/fixtures/srs4/audit-authoring-freeze-v2.json",
} as const;
const AUDIT_R2_SHA256 = "3297a3577ed7110e01a2629e023bf2371238559543c3c49350dbc28c727fa319";
const MAX_OUTPUT_TOKENS = 8192;
const INPUT_TOKEN_ALLOWANCE_PER_REQUEST = 1024;
const PRICE_USD_PER_MILLION = { inputOrCacheWrite: 2.5, output: 10 } as const;

const requireCondition = (condition: unknown, message: string): void => {
  if (!condition) throw Error(`SRS-4 development config: ${message}`);
};

export async function renderSrs4DevelopmentLiveConfig(): Promise<string> {
  const sourceSha256 = Object.fromEntries(
    await Promise.all(
      Object.entries(files).map(async ([key, path]) => [
        key,
        sha256(await readFile(resolve(root, path))),
      ]),
    ),
  );
  requireCondition(sourceSha256.bConfig === SRS4_B_SHA256.config, "B config drift");
  requireCondition(sourceSha256.bTrace === SRS4_B_SHA256.trace, "B trace drift");
  requireCondition(sourceSha256.profiles === SRS4_B_SHA256.profiles, "profile drift");
  requireCondition(sourceSha256.auditR2Freeze === AUDIT_R2_SHA256, "audit freeze drift");
  const audit = JSON.parse(await readFile(resolve(root, files.auditR2Freeze), "utf8")) as {
    status: string;
    auditScored: boolean;
    challengeRead: boolean;
    qualifiedHumanApproval: boolean;
    coverage: { semanticApproved: number; revisedR2PendingConfirmation: number };
  };
  requireCondition(
    audit.status === "AUTHORING_FROZEN_MODEL_SEMANTIC_REVIEW_APPROVED_UNSCORED" &&
      audit.auditScored === false &&
      audit.challengeRead === false &&
      audit.qualifiedHumanApproval === false &&
      audit.coverage.semanticApproved === 64 &&
      audit.coverage.revisedR2PendingConfirmation === 0,
    "audit metadata gate drift",
  );

  const { cases } = await prepareSrs4Development();
  requireCondition(cases.length === 53, "development case count drift");
  let totalPayloadBytes = 0;
  const caseBindings = cases.map((row) => {
    if ("stage" in row.input) {
      requireCondition(row.input.stage === "STRUCTURAL_EMPTY", `${row.key} unexpected bypass`);
      return { key: row.key, action: row.action, stage: row.input.stage, modelRequest: false };
    }
    const payload = createOfflineSupervisorPayload(row.input);
    const wireBytes = Buffer.from(
      `${payload.system}\n${payload.userJson}\n${JSON.stringify(payload.schema)}`,
      "utf8",
    );
    totalPayloadBytes += wireBytes.length;
    return {
      key: row.key,
      action: row.action,
      stage: "SUPERVISOR" as const,
      modelRequest: true,
      payloadSha256: sha256(wireBytes),
      payloadBytes: wireBytes.length,
      candidateCount: row.input.candidates.length,
    };
  });
  const requests = caseBindings.filter((row) => row.modelRequest).length;
  requireCondition(
    requests === 50 && cases.length - requests === 3,
    "model-call/bypass split drift",
  );
  const estimatedInputTokenEnvelope =
    totalPayloadBytes + requests * INPUT_TOKEN_ALLOWANCE_PER_REQUEST;
  const maxOutputTokensForRun = requests * MAX_OUTPUT_TOKENS;
  const estimatedMaximumUSD =
    (estimatedInputTokenEnvelope * PRICE_USD_PER_MILLION.inputOrCacheWrite +
      maxOutputTokensForRun * PRICE_USD_PER_MILLION.output) /
    1_000_000;

  return format(
    JSON.stringify({
      schemaVersion: 1,
      experimentId: "SRS-4-DEV-LIVE-1",
      status: "FROZEN_PENDING_SEPARATE_SPEND_APPROVAL_NO_PROVIDER_CALL",
      evidenceUse: "EXPOSED_DEVELOPMENT_ONLY",
      credentialSourceCategory: "EXISTING_IGNORED_SKILLS_WORKTREE_ENV_LOCAL_USER_APPROVED_REUSE",
      provider: {
        api: "OPENAI_RESPONSES",
        requestedModel: "gpt-6.1-sol",
        modelAvailability: "NOT_LIVE_VERIFIED",
        reasoning: { mode: "standard", effort: "medium" },
        serviceTier: "OMITTED_DEFAULT_STANDARD_ASSUMED",
        responseFormat: {
          type: "json_schema",
          name: "srs4_supervisor_judgment_v1",
          strict: true,
          schemaSha256: sha256(JSON.stringify(SRS4_WIRE_JSON_SCHEMA)),
        },
        promptId: SRS4_OFFLINE_PROMPT_ID,
        systemInstructionsSha256: sha256(SRS4_SYSTEM_INSTRUCTIONS),
        candidateOrder: "SKILL_ID_ASC_NOT_SEMANTIC_RANK",
        scoreVisibleToModel: false,
        tools: [],
        store: false,
        temperature: "OMITTED",
        topP: "OMITTED",
        seed: "OMITTED_UNVERIFIED",
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        timeoutMs: 60_000,
        automaticRetries: 0,
      },
      corpus: {
        cases: cases.length,
        plannedModelRequests: requests,
        structuralBypasses: cases.length - requests,
        caseBindings,
      },
      costEstimate: {
        method:
          "CONSERVATIVE_INPUT_ESTIMATE_ONE_TOKEN_PER_UTF8_BYTE_PLUS_1024_PER_REQUEST_AND_FULL_OUTPUT_CAP",
        totalPayloadBytes,
        estimatedInputTokenEnvelope,
        maxOutputTokensForRun,
        priceUSDPerMillionTokens: PRICE_USD_PER_MILLION,
        estimatedMaximumUSD: Number(estimatedMaximumUSD.toFixed(4)),
        proposedSpendCapUSD: 8,
        pricingSource: "https://developers.openai.com/api/docs/models/gpt-6.1-sol",
        caveat:
          "Estimate, not an invoice or provider-enforced hard cap; requires explicit spend approval.",
      },
      sourcePaths: files,
      sourceSha256,
      noAuditScoring: true,
      noProtectedChallenge: true,
      noProductionChange: true,
      providerCallsAuthorized: false,
    }),
    { parser: "json", printWidth: 100, tabWidth: 2, endOfLine: "lf" },
  );
}
