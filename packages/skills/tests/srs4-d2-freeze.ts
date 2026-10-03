import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { format } from "prettier";
import { z } from "zod";
import { packageRoot } from "../authoring/generator.js";
import {
  SRS4_D2_STAGE_ORDER,
  Srs4D2DiagnosticSchema,
  Srs4D2FailureCodeSchema,
} from "./srs4-output-contract-diagnostic.js";
import { SRS4_SYSTEM_INSTRUCTIONS, SRS4_WIRE_JSON_SCHEMA } from "./srs4-supervisor-prompt.js";
import { SupervisorReasonSchema } from "./srs4-supervisor.js";

const root = resolve(packageRoot, "../..");
const sha256 = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const paths = {
  v1Validator: "packages/skills/tests/srs4-supervisor.ts",
  v1Prompt: "packages/skills/tests/srs4-supervisor-prompt.ts",
  d2Diagnostic: "packages/skills/tests/srs4-output-contract-diagnostic.ts",
  d2FocusedTests: "packages/skills/tests/srs4-output-contract-diagnostic.test.ts",
  canonicalFakeJudgment: "packages/skills/tests/fixtures/srs4/d2-valid-judgment-v1.json",
  v1Config: "packages/skills/tests/fixtures/srs4/development-live-config-v1.json",
  v1Trace: "packages/skills/tests/fixtures/srs4/development-live-v1/content-free-trace.json",
  v1Metrics: "packages/skills/tests/fixtures/srs4/development-live-v1/metrics.json",
  bConfig: "packages/skills/tests/fixtures/srs3f/semantic-topk-proposed-config-v1.json",
  semanticProfiles: "packages/skills/tests/fixtures/srs3/semantic-skill-profiles.json",
  auditR2Freeze: "packages/skills/tests/fixtures/srs4/audit-authoring-freeze-v2.json",
} as const;
const historical = {
  v1Validator: "3ff83c44abe310908ea0cad16764ecb78a0efe1b7de82215cc7dadbda8824977",
  v1Prompt: "3e05fcfd50796489061a1a819f5d021ba792e846bc4487f2b321ee5bceb14001",
  v1Config: "3b4ecfe80979486c454009d48bdba640becc8f59c642fff11b759dfd6168f93a",
  v1Trace: "edf22ea5cb29d6de824d1d2624d7f9cce9b67c3913d625a7725159c105c382ea",
  v1Metrics: "18d1ec344d4ea0b59c35975f4f1320d3f42f6473af89a89c3786f54665f67ae1",
  bConfig: "4f3f94e0b2089c9bb7a8e8c3a83c697b7df3d9f3c4c0c14b4c00ac0d4518327b",
  semanticProfiles: "b061bf17a04e696ad78af45016e6803a96f79f0e617fcb2800a4a591fbc33d1c",
  auditR2Freeze: "3297a3577ed7110e01a2629e023bf2371238559543c3c49350dbc28c727fa319",
} as const;

function sourceSection(source: string, startMarker: string, endMarker: string): string {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end <= start) throw Error("SRS-4-D2 source section marker drift");
  return source.slice(start, end);
}

export async function renderSrs4D2Freeze(): Promise<string> {
  const sourceSha256 = Object.fromEntries(
    await Promise.all(
      Object.entries(paths).map(async ([key, path]) => [
        key,
        sha256(await readFile(resolve(root, path))),
      ]),
    ),
  );
  for (const [key, expected] of Object.entries(historical))
    if (sourceSha256[key] !== expected) throw Error(`SRS-4-D2 historical ${key} binding drift`);
  const v1 = JSON.parse(await readFile(resolve(root, paths.v1Config), "utf8")) as {
    sourceSha256: Record<string, string>;
    noAuditScoring: boolean;
    noProtectedChallenge: boolean;
  };
  if (
    v1.sourceSha256.supervisor !== historical.v1Validator ||
    v1.sourceSha256.prompt !== historical.v1Prompt ||
    v1.sourceSha256.bConfig !== historical.bConfig ||
    v1.sourceSha256.profiles !== historical.semanticProfiles ||
    v1.sourceSha256.auditR2Freeze !== historical.auditR2Freeze ||
    !v1.noAuditScoring ||
    !v1.noProtectedChallenge
  )
    throw Error("SRS-4-D2 V1 provenance chain drift");
  const supervisorSource = await readFile(resolve(root, paths.v1Validator), "utf8");
  const raw = {
    schemaVersion: 1,
    diagnosticId: "SRS-4-OUTPUT-CONTRACT-DIAG-1",
    status: "OFFLINE_DIAGNOSTIC_FROZEN_NO_PROVIDER_CALL",
    historicalExperiment: "SRS-4-DEV-LIVE-1",
    v1PerCaseCause: "NOT_RECOVERABLE_FROM_V1_TRACE",
    sourcePaths: paths,
    sourceSha256,
    contractSha256: {
      wireJsonSchema: sha256(JSON.stringify(SRS4_WIRE_JSON_SCHEMA)),
      serializerFunction: sha256(
        sourceSection(
          supervisorSource,
          "export function serializeSupervisorEvidence(",
          "export function projectSupervisorCandidates(",
        ),
      ),
      candidateProjectionFunction: sha256(
        sourceSection(
          supervisorSource,
          "export function projectSupervisorCandidates(",
          "export function buildSupervisorInput(",
        ),
      ),
      validatorFunction: sha256(
        sourceSection(
          supervisorSource,
          "export function validateSupervisorJudgment(",
          "export interface SkillSupervisorJudge",
        ),
      ),
      promptInstructions: sha256(SRS4_SYSTEM_INSTRUCTIONS),
      reasonCodeSchema: sha256(JSON.stringify(SupervisorReasonSchema.options)),
      diagnosticStageSchema: sha256(JSON.stringify(SRS4_D2_STAGE_ORDER)),
      diagnosticFailureCodeSchema: sha256(JSON.stringify(Srs4D2FailureCodeSchema.options)),
      diagnosticRecordSchema: sha256(
        JSON.stringify(z.toJSONSchema(Srs4D2DiagnosticSchema, { target: "draft-7" })),
      ),
    },
    stageOrder: SRS4_D2_STAGE_ORDER,
    failureCodes: Srs4D2FailureCodeSchema.options,
    auditScored: false,
    protectedChallengeRead: false,
    productionChanged: false,
    providerCallsAuthorized: false,
    canaryRequiresSeparateApproval: true,
  };
  return format(JSON.stringify(raw), { parser: "json" });
}
