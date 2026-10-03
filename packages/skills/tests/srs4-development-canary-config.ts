// SRS-4-D3: content-free, immutable five-case live-canary configuration.
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { format } from "prettier";
import { packageRoot } from "../authoring/generator.js";
import { loadSrs3Corpus } from "./srs3-ranking-corpus.js";
import { prepareSrs4Development } from "./srs4-development.js";
import { createOfflineSupervisorPayload } from "./srs4-supervisor-prompt.js";

const root = resolve(packageRoot, "../..");
const sha256 = (value: Uint8Array | string): string =>
  createHash("sha256").update(value).digest("hex");
export const SRS4_D3_ID = "SRS-4-DEV-CANARY-1";
export const SRS4_D3_CASES = [
  { key: "SRS3B:R06", revision: "R1" },
  { key: "SRS3B:R10", revision: "R1" },
  { key: "SRS3B:R14", revision: "R1" },
  { key: "SRS3B:R26", revision: "R1" },
  { key: "SRS3B:R13", revision: "R2" },
] as const;

const expected = {
  v1Config: "3b4ecfe80979486c454009d48bdba640becc8f59c642fff11b759dfd6168f93a",
  d2Freeze: "504503dc937f425d090dfab231f6919379b2a1d70a4d3747911ab7a712c5b540",
} as const;
const paths = {
  v1Config: "packages/skills/tests/fixtures/srs4/development-live-config-v1.json",
  d2Freeze: "packages/skills/tests/fixtures/srs4/output-contract-diagnostic-v1.json",
  v1Validator: "packages/skills/tests/srs4-supervisor.ts",
  v1Prompt: "packages/skills/tests/srs4-supervisor-prompt.ts",
  v1Development: "packages/skills/tests/srs4-development.ts",
  d2Diagnostic: "packages/skills/tests/srs4-output-contract-diagnostic.ts",
  bConfig: "packages/skills/tests/fixtures/srs3f/semantic-topk-proposed-config-v1.json",
  bTrace: "packages/skills/tests/fixtures/srs3f/semantic-topk-exposed-v1.json",
  semanticProfiles: "packages/skills/tests/fixtures/srs3/semantic-skill-profiles.json",
  auditR2Freeze: "packages/skills/tests/fixtures/srs4/audit-authoring-freeze-v2.json",
  d3ConfigBuilder: "packages/skills/tests/srs4-development-canary-config.ts",
} as const;

interface V1Config {
  experimentId: string;
  evidenceUse: string;
  provider: {
    api: string;
    requestedModel: string;
    reasoning: { mode: string; effort: string };
    responseFormat: { type: string; name: string; strict: boolean; schemaSha256: string };
    systemInstructionsSha256: string;
    maxOutputTokens: number;
    timeoutMs: number;
    automaticRetries: number;
    store: boolean;
    tools: unknown[];
  } & Record<string, unknown>;
  corpus: {
    caseBindings: Array<{
      key: string;
      action: string;
      modelRequest: boolean;
      payloadSha256?: string;
      payloadBytes?: number;
      candidateCount?: number;
    }>;
  };
  sourceSha256: Record<string, string>;
  noAuditScoring: boolean;
  noProtectedChallenge: boolean;
  noProductionChange: boolean;
}

export async function renderSrs4DevelopmentCanaryConfig(): Promise<string> {
  const sourceSha256 = Object.fromEntries(
    await Promise.all(
      Object.entries(paths).map(async ([name, path]) => [
        name,
        sha256(await readFile(resolve(root, path))),
      ]),
    ),
  );
  if (sourceSha256.v1Config !== expected.v1Config || sourceSha256.d2Freeze !== expected.d2Freeze)
    throw Error("SRS-4-D3 V1/D2 freeze drift");
  const v1 = JSON.parse(await readFile(resolve(root, paths.v1Config), "utf8")) as V1Config;
  const d2 = JSON.parse(await readFile(resolve(root, paths.d2Freeze), "utf8")) as {
    contractSha256: Record<string, string>;
    sourceSha256: Record<string, string>;
    auditScored: boolean;
    protectedChallengeRead: boolean;
    productionChanged: boolean;
  };
  if (
    v1.experimentId !== "SRS-4-DEV-LIVE-1" ||
    v1.evidenceUse !== "EXPOSED_DEVELOPMENT_ONLY" ||
    v1.provider.api !== "OPENAI_RESPONSES" ||
    v1.provider.requestedModel !== "gpt-6.1-sol" ||
    v1.provider.reasoning.mode !== "standard" ||
    v1.provider.reasoning.effort !== "medium" ||
    v1.provider.responseFormat.type !== "json_schema" ||
    v1.provider.responseFormat.strict !== true ||
    v1.provider.maxOutputTokens !== 8192 ||
    v1.provider.timeoutMs !== 60_000 ||
    v1.provider.automaticRetries !== 0 ||
    v1.provider.store !== false ||
    v1.provider.tools.length !== 0 ||
    !v1.noAuditScoring ||
    !v1.noProtectedChallenge ||
    !v1.noProductionChange ||
    d2.auditScored ||
    d2.protectedChallengeRead ||
    d2.productionChanged
  )
    throw Error("SRS-4-D3 V1/D2 scope or provider drift");
  const chains = {
    v1Validator: [v1.sourceSha256.supervisor, d2.sourceSha256.v1Validator],
    v1Prompt: [v1.sourceSha256.prompt, d2.sourceSha256.v1Prompt],
    v1Development: [v1.sourceSha256.development],
    d2Diagnostic: [d2.sourceSha256.d2Diagnostic],
    bConfig: [v1.sourceSha256.bConfig, d2.sourceSha256.bConfig],
    bTrace: [v1.sourceSha256.bTrace],
    semanticProfiles: [v1.sourceSha256.profiles, d2.sourceSha256.semanticProfiles],
    auditR2Freeze: [v1.sourceSha256.auditR2Freeze, d2.sourceSha256.auditR2Freeze],
  };
  for (const [key, digests] of Object.entries(chains))
    if (digests.some((digest) => sourceSha256[key] !== digest))
      throw Error(`SRS-4-D3 ${key} provenance drift`);
  if (
    d2.contractSha256.wireJsonSchema !== v1.provider.responseFormat.schemaSha256 ||
    d2.contractSha256.promptInstructions !== v1.provider.systemInstructionsSha256
  )
    throw Error("SRS-4-D3 wire schema or prompt drift");
  const audit = JSON.parse(await readFile(resolve(root, paths.auditR2Freeze), "utf8")) as {
    auditScored: boolean;
    challengeRead: boolean;
    coverage: { semanticApproved: number };
  };
  if (audit.auditScored || audit.challengeRead || audit.coverage.semanticApproved !== 64)
    throw Error("SRS-4-D3 audit boundary drift");

  const [{ cases }, corpus] = await Promise.all([prepareSrs4Development(), loadSrs3Corpus()]);
  const byKey = new Map(cases.map((item) => [item.key, item]));
  const rawRevisions = new Map(corpus.raw.map((item) => [`SRS3B:${item.id}`, item.revision]));
  const v1Bindings = new Map(v1.corpus.caseBindings.map((item) => [item.key, item]));
  const caseBindings = SRS4_D3_CASES.map(({ key, revision }) => {
    const row = byKey.get(key);
    const prior = v1Bindings.get(key);
    if (!row || !prior || "stage" in row.input || rawRevisions.get(key) !== revision)
      throw Error(`SRS-4-D3 requested case/revision unavailable: ${key}`);
    const payload = createOfflineSupervisorPayload(row.input);
    const wireBytes = Buffer.from(
      `${payload.system}\n${payload.userJson}\n${JSON.stringify(payload.schema)}`,
      "utf8",
    );
    if (
      !prior.modelRequest ||
      prior.action !== row.action ||
      prior.payloadSha256 !== sha256(wireBytes) ||
      prior.payloadBytes !== wireBytes.length ||
      prior.candidateCount !== row.input.candidates.length ||
      sha256(JSON.stringify(payload.schema)) !== v1.provider.responseFormat.schemaSha256
    )
      throw Error(`SRS-4-D3 frozen payload drift: ${key}`);
    return {
      key,
      rawRevision: revision,
      action: row.action,
      candidateCount: row.input.candidates.length,
      payloadSha256: prior.payloadSha256,
      payloadBytes: prior.payloadBytes,
    };
  });
  const totalPayloadBytes = caseBindings.reduce((sum, row) => sum + row.payloadBytes, 0);
  const estimatedInputTokenEnvelope = totalPayloadBytes + caseBindings.length * 1024;
  const maxOutputTokensForRun = caseBindings.length * v1.provider.maxOutputTokens;
  const estimatedMaximumUSD =
    (estimatedInputTokenEnvelope * 2.5 + maxOutputTokensForRun * 10) / 1_000_000;
  if (caseBindings.length !== 5 || estimatedMaximumUSD >= 1)
    throw Error("SRS-4-D3 case count or approved budget exceeded");
  return format(
    JSON.stringify({
      schemaVersion: 1,
      experimentId: SRS4_D3_ID,
      status: "FROZEN_APPROVED_FIVE_REQUEST_CANARY",
      evidenceUse: "EXPOSED_DEVELOPMENT_ONLY",
      purpose: "OUTPUT_CONTRACT_VALIDITY_ONLY",
      spendAuthorization: {
        source: "USER_EXPLICIT_2026-10-03",
        approvedCapUSD: 1,
        plannedRequests: 5,
      },
      credentialSourceCategory: "EXISTING_IGNORED_SKILLS_WORKTREE_ENV_LOCAL_USER_APPROVED_REUSE",
      provider: v1.provider,
      caseBindings,
      costEstimate: {
        method: "ONE_TOKEN_PER_UTF8_BYTE_PLUS_1024_PER_REQUEST_FULL_OUTPUT_CAP",
        totalPayloadBytes,
        estimatedInputTokenEnvelope,
        maxOutputTokensForRun,
        priceUSDPerMillionTokens: { inputOrCacheWrite: 2.5, output: 10 },
        estimatedMaximumUSD: Number(estimatedMaximumUSD.toFixed(6)),
        pricingSource: "https://developers.openai.com/api/docs/models/gpt-6.1-sol",
        caveat: "Estimate, not a provider-enforced hard cap.",
      },
      sourcePaths: paths,
      sourceSha256,
      contractSha256: d2.contractSha256,
      v1ConfigSha256: expected.v1Config,
      d2FreezeSha256: expected.d2Freeze,
      auditScored: false,
      protectedChallengeRead: false,
      productionChanged: false,
      automaticRetries: 0,
    }),
    { parser: "json", printWidth: 100, tabWidth: 2, endOfLine: "lf" },
  );
}
