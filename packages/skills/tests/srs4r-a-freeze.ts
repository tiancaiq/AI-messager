import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { format } from "prettier";
import { z } from "zod";
import { packageRoot } from "../authoring/generator.js";
import { EvidenceUseSchema } from "./srs4-supervisor.js";
import {
  AssessmentDiagnosticSchema,
  AssessmentDiagnosticFailureCodeSchema,
} from "./srs4r-assessment-diagnostic.js";
import {
  AssessmentFailureCodeSchema,
  SkillApplicabilitySchema,
  SkillBlockingReasonSchema,
  SkillSupportReasonSchema,
} from "./srs4r-assessment.js";
import {
  SRS4R_A_BATCH_JSON_SCHEMA,
  SRS4R_A_SINGLETON_JSON_SCHEMA,
  SRS4R_A_SYSTEM_INSTRUCTIONS,
} from "./srs4r-assessor-prompt.js";
import {
  SRS4R_A_INDEPENDENCE_CASE_KEYS,
  SRS4R_A_INDEPENDENCE_GATE_ID,
  unrunIndependenceGate,
} from "./srs4r-independence.js";

const root = resolve(packageRoot, "../..");
const sha = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
const paths = {
  v1Serializer: "packages/skills/tests/srs4-supervisor.ts",
  d4Freeze: "packages/skills/tests/fixtures/srs4/supervisor-contract-v2-freeze.json",
  bConfig: "packages/skills/tests/fixtures/srs3f/semantic-topk-proposed-config-v1.json",
  bTrace: "packages/skills/tests/fixtures/srs3f/semantic-topk-exposed-v1.json",
  exposedRaw: "packages/test-fixtures/src/srs3-ranking-development.ts",
  exposedAnnotations: "packages/skills/tests/fixtures/srs3/development-annotations.json",
  exposedControlRaw:
    "packages/skills/tests/fixtures/srs3e-semantic/calibration-v2/calibration-raw.json",
  profiles: "packages/skills/tests/fixtures/srs3/semantic-skill-profiles.json",
  auditR2Freeze: "packages/skills/tests/fixtures/srs4/audit-authoring-freeze-v2.json",
  assessment: "packages/skills/tests/srs4r-assessment.ts",
  prompt: "packages/skills/tests/srs4r-assessor-prompt.ts",
  diagnostic: "packages/skills/tests/srs4r-assessment-diagnostic.ts",
  independence: "packages/skills/tests/srs4r-independence.ts",
  independencePlan: "packages/skills/tests/fixtures/srs4r/assessor-independence-plan-v1.json",
  development: "packages/skills/tests/srs4r-development.ts",
  focusedTests: "packages/skills/tests/srs4r-assessment.test.ts",
  freezeTests: "packages/skills/tests/srs4r-a-freeze.test.ts",
} as const;
const historical = {
  v1Serializer: "3ff83c44abe310908ea0cad16764ecb78a0efe1b7de82215cc7dadbda8824977",
  d4Freeze: "beb27af30f72d99fd1c04879e4a5fd1d3957cac795253a696eed45a5a741afb7",
  bConfig: "4f3f94e0b2089c9bb7a8e8c3a83c697b7df3d9f3c4c0c14b4c00ac0d4518327b",
  bTrace: "3da194a50d46c33c26b5dcaa2f59ce7d33eb03d4352e5eefc706d9241e6ed214",
  profiles: "b061bf17a04e696ad78af45016e6803a96f79f0e617fcb2800a4a591fbc33d1c",
  auditR2Freeze: "3297a3577ed7110e01a2629e023bf2371238559543c3c49350dbc28c727fa319",
} as const;

export async function renderSrs4rAFreeze(): Promise<string> {
  const sourceSha256 = Object.fromEntries(
    await Promise.all(
      Object.entries(paths).map(async ([key, path]) => [
        key,
        sha(await readFile(resolve(root, path))),
      ]),
    ),
  );
  for (const [key, expected] of Object.entries(historical))
    if (sourceSha256[key] !== expected) throw Error(`SRS-4R-A historical ${key} drift`);
  const independencePlan = JSON.parse(
    await readFile(resolve(root, paths.independencePlan), "utf8"),
  ) as {
    gateId: string;
    caseKeys: string[];
    liveProviderRunStatus: string;
    providerCallsAuthorized: boolean;
    auditScored: boolean;
  };
  if (
    independencePlan.gateId !== SRS4R_A_INDEPENDENCE_GATE_ID ||
    JSON.stringify(independencePlan.caseKeys) !== JSON.stringify(SRS4R_A_INDEPENDENCE_CASE_KEYS) ||
    independencePlan.liveProviderRunStatus !== "NOT_RUN" ||
    independencePlan.providerCallsAuthorized ||
    independencePlan.auditScored
  )
    throw Error("SRS-4R-A independence gate plan drift");
  const raw = {
    schemaVersion: 1,
    contractId: "SRS-4R-A-SKILL-ASSESSMENT-V1",
    status: "OFFLINE_CONTRACT_FROZEN_LIVE_EVALUATION_NOT_RUN",
    sourcePaths: paths,
    sourceSha256,
    contractSha256: {
      promptInstructions: sha(SRS4R_A_SYSTEM_INSTRUCTIONS),
      batchWireJsonSchema: sha(JSON.stringify(SRS4R_A_BATCH_JSON_SCHEMA)),
      singletonWireJsonSchema: sha(JSON.stringify(SRS4R_A_SINGLETON_JSON_SCHEMA)),
      applicabilitySchema: sha(JSON.stringify(SkillApplicabilitySchema.options)),
      supportReasonSchema: sha(JSON.stringify(SkillSupportReasonSchema.options)),
      blockingReasonSchema: sha(JSON.stringify(SkillBlockingReasonSchema.options)),
      evidenceUseSchema: sha(JSON.stringify(EvidenceUseSchema.options)),
      validatorFailureCodeSchema: sha(JSON.stringify(AssessmentFailureCodeSchema.options)),
      diagnosticFailureCodeSchema: sha(
        JSON.stringify(
          z.toJSONSchema(AssessmentDiagnosticFailureCodeSchema, { target: "draft-7" }),
        ),
      ),
      diagnosticRecordSchema: sha(
        JSON.stringify(z.toJSONSchema(AssessmentDiagnosticSchema, { target: "draft-7" })),
      ),
    },
    independenceGate: unrunIndependenceGate(),
    exposedDevelopmentScenarios: 53,
    auditScored: false,
    protectedChallengeRead: false,
    productionChanged: false,
    providerCallsMade: 0,
    futureModelDirection: "gpt-5.6-luna",
    separateLiveApprovalRequired: true,
    combinationImplemented: false,
  };
  return format(JSON.stringify(raw), { parser: "json" });
}
