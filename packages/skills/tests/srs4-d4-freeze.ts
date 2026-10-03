import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { format } from "prettier";
import { z } from "zod";
import { packageRoot } from "../authoring/generator.js";
import { EvidenceUseSchema, SupervisorReasonSchema } from "./srs4-supervisor.js";
import { Srs4D4DiagnosticSchema } from "./srs4-output-contract-diagnostic-v2.js";
import {
  SRS4_V2_SYSTEM_INSTRUCTIONS,
  SRS4_V2_WIRE_JSON_SCHEMA,
} from "./srs4-supervisor-prompt-v2.js";
import { SupervisorReasonV2Schema } from "./srs4-supervisor-v2.js";

const root = resolve(packageRoot, "../..");
const sha = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
const paths = {
  v1Validator: "packages/skills/tests/srs4-supervisor.ts",
  v1Prompt: "packages/skills/tests/srs4-supervisor-prompt.ts",
  d2Freeze: "packages/skills/tests/fixtures/srs4/output-contract-diagnostic-v1.json",
  d3Config: "packages/skills/tests/fixtures/srs4/development-canary-config-v1.json",
  d3Trace: "packages/skills/tests/fixtures/srs4/development-canary-v1/content-free-trace.json",
  d3Metrics: "packages/skills/tests/fixtures/srs4/development-canary-v1/metrics.json",
  d3Validation: "packages/skills/tests/fixtures/srs4/development-canary-v1/validation-record.json",
  serializerAndProjection: "packages/skills/tests/srs4-supervisor.ts",
  v2Validator: "packages/skills/tests/srs4-supervisor-v2.ts",
  v2Prompt: "packages/skills/tests/srs4-supervisor-prompt-v2.ts",
  v2Diagnostic: "packages/skills/tests/srs4-output-contract-diagnostic-v2.ts",
  v2Tests: "packages/skills/tests/srs4-supervisor-v2.test.ts",
  canonicalRecipes: "packages/skills/tests/fixtures/srs4/d4-valid-judgment-recipes-v1.json",
  bConfig: "packages/skills/tests/fixtures/srs3f/semantic-topk-proposed-config-v1.json",
  profiles: "packages/skills/tests/fixtures/srs3/semantic-skill-profiles.json",
  auditR2Freeze: "packages/skills/tests/fixtures/srs4/audit-authoring-freeze-v2.json",
} as const;
const historical = {
  v1Validator: "3ff83c44abe310908ea0cad16764ecb78a0efe1b7de82215cc7dadbda8824977",
  v1Prompt: "3e05fcfd50796489061a1a819f5d021ba792e846bc4487f2b321ee5bceb14001",
  d2Freeze: "504503dc937f425d090dfab231f6919379b2a1d70a4d3747911ab7a712c5b540",
  d3Config: "7d64661ccd0a1b35dc249ae890708c2ea9487cf8aa5f9002ca80f0639eec4e95",
  d3Trace: "34f2ba762019bddb6946abc25ab0b3fb458f690266a09ce874df1b6f1d5b6bb7",
  d3Metrics: "33ebd0d359394b1c92df5c1e68fdb3eb23c7d5367415436c5b48647dec80188c",
  d3Validation: "1821f3a685294eebf4f15ad9ddefcd72c2eaa1f86735968ba08711090353d367",
  bConfig: "4f3f94e0b2089c9bb7a8e8c3a83c697b7df3d9f3c4c0c14b4c00ac0d4518327b",
  profiles: "b061bf17a04e696ad78af45016e6803a96f79f0e617fcb2800a4a591fbc33d1c",
  auditR2Freeze: "3297a3577ed7110e01a2629e023bf2371238559543c3c49350dbc28c727fa319",
} as const;

function section(source: string, first: string, next: string): string {
  const a = source.indexOf(first);
  const b = source.indexOf(next, a + first.length);
  if (a < 0 || b <= a) throw Error("SRS-4-D4 source section drift");
  return source.slice(a, b);
}

export async function renderSrs4D4Freeze(): Promise<string> {
  const sourceSha256 = Object.fromEntries(
    await Promise.all(
      Object.entries(paths).map(async ([key, path]) => [
        key,
        sha(await readFile(resolve(root, path))),
      ]),
    ),
  );
  for (const [key, expected] of Object.entries(historical))
    if (sourceSha256[key] !== expected) throw Error(`SRS-4-D4 historical ${key} drift`);
  const source = await readFile(resolve(root, paths.v1Validator), "utf8");
  const canonical = JSON.parse(await readFile(resolve(root, paths.canonicalRecipes), "utf8")) as {
    contractId: string;
    recipes: unknown[];
  };
  if (canonical.contractId !== "SRS-4-SUPERVISOR-CONTRACT-V2" || canonical.recipes.length < 5)
    throw Error("SRS-4-D4 canonical fixture binding invalid");
  const raw = {
    schemaVersion: 1,
    contractId: "SRS-4-SUPERVISOR-CONTRACT-V2",
    diagnosticId: "SRS-4-D4-OUTPUT-CONTRACT-DIAG-V2",
    status: "OFFLINE_CONTRACT_FROZEN_NO_PROVIDER_CALL",
    historicalVerdict: { v1: "FAIL", d2: "PASS_OFFLINE", d3: "FAIL_0_OF_5_VALID" },
    sourcePaths: paths,
    sourceSha256,
    contractSha256: {
      wireJsonSchema: sha(JSON.stringify(SRS4_V2_WIRE_JSON_SCHEMA)),
      promptInstructions: sha(SRS4_V2_SYSTEM_INSTRUCTIONS),
      v1ReasonCodeSchema: sha(JSON.stringify(SupervisorReasonSchema.options)),
      v2ReasonCodeSchema: sha(JSON.stringify(SupervisorReasonV2Schema.options)),
      evidenceUseSchema: sha(JSON.stringify(EvidenceUseSchema.options)),
      diagnosticRecordSchema: sha(
        JSON.stringify(z.toJSONSchema(Srs4D4DiagnosticSchema, { target: "draft-7" })),
      ),
      serializerFunction: sha(
        section(
          source,
          "export function serializeSupervisorEvidence(",
          "export function projectSupervisorCandidates(",
        ),
      ),
      candidateProjectionFunction: sha(
        section(
          source,
          "export function projectSupervisorCandidates(",
          "export function buildSupervisorInput(",
        ),
      ),
      v1ValidatorFunction: sha(
        section(
          source,
          "export function validateSupervisorJudgment(",
          "export interface SkillSupervisorJudge",
        ),
      ),
    },
    canonicalFixtureCount: canonical.recipes.length,
    auditScored: false,
    protectedChallengeRead: false,
    productionChanged: false,
    providerCallsMade: 0,
    d5RequiresSeparateApproval: true,
    nextRequestedModel: "gpt-5.6-luna",
  };
  return format(JSON.stringify(raw), { parser: "json" });
}
