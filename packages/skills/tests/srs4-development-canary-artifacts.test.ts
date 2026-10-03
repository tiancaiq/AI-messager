import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { packageRoot } from "../authoring/generator.js";
import { SRS4_D3_CASES, SRS4_D3_ID } from "./srs4-development-canary-config.js";
import { Srs4D2DiagnosticSchema } from "./srs4-output-contract-diagnostic.js";

const directory = resolve(packageRoot, "tests/fixtures/srs4/development-canary-v1");
const configPath = resolve(packageRoot, "tests/fixtures/srs4/development-canary-config-v1.json");
const sha256 = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const digest = z.string().regex(/^[a-f0-9]{64}$/u);
const safeId = z.string().regex(/^[A-Za-z0-9:_-]{1,80}$/u);
const optionalMetadata = z
  .string()
  .regex(/^[A-Za-z0-9._-]{1,80}$/u)
  .nullable();
const observation = z
  .object({
    key: safeId,
    rawRevision: z.string().regex(/^R[1-9][0-9]*$/u),
    payloadSha256: digest,
    httpStatus: z.number().int().min(100).max(599).nullable(),
    httpSuccess: z.boolean(),
    providerCompletionStatus: z
      .string()
      .regex(/^[a-z_]{1,40}$/u)
      .nullable(),
    returnedModel: optionalMetadata,
    serviceTier: optionalMetadata,
    providerBodyJsonValid: z.boolean().nullable(),
    inputTokens: z.number().int().nonnegative().nullable(),
    outputTokens: z.number().int().nonnegative().nullable(),
    totalTokens: z.number().int().nonnegative().nullable(),
    latencyMs: z.number().int().nonnegative(),
    failureKind: z.enum([
      "NONE",
      "HTTP_ERROR",
      "TRANSPORT_ERROR",
      "PROVIDER_BODY_INVALID",
      "MODEL_MISMATCH",
      "PROVIDER_INCOMPLETE",
      "VALIDATION_FAILED",
    ]),
    d2: Srs4D2DiagnosticSchema,
    v1ValidatorStatus: z.enum(["VALID", "INVALID"]),
    v1SelectionStatus: z.enum(["SELECTED", "NONE", "FAILED"]),
    selectedIds: z.array(z.string().regex(/^[a-z][a-z0-9_]*$/u)),
    knownCostUSD: z.number().nonnegative().nullable(),
    conservativeCostUpperBoundUSD: z.number().nonnegative(),
  })
  .strict();
const traceSchema = z
  .object({
    experimentId: z.literal(SRS4_D3_ID),
    configSha256: digest,
    plannedRequests: z.literal(5),
    actualRequests: z.number().int().min(0).max(5),
    observations: z.array(observation).max(5),
  })
  .strict();

describe("SRS-4-D3 immutable content-free artifacts", () => {
  it("binds exactly five one-shot observations to the frozen config and D2 results", async () => {
    const [configBytes, traceBytes, metricsBytes, validationBytes] = await Promise.all([
      readFile(configPath),
      readFile(resolve(directory, "content-free-trace.json")),
      readFile(resolve(directory, "metrics.json")),
      readFile(resolve(directory, "validation-record.json")),
    ]);
    const trace = traceSchema.parse(JSON.parse(traceBytes.toString("utf8")) as unknown);
    const metrics = JSON.parse(metricsBytes.toString("utf8")) as {
      experimentId: string;
      contractValid: number;
      actualRequests: number;
      auditScored: boolean;
      protectedChallengeRead: boolean;
      productionChanged: boolean;
    };
    const validation = JSON.parse(validationBytes.toString("utf8")) as {
      experimentId: string;
      configSha256: string;
      traceSha256: string;
      metricsSha256: string;
    };
    expect(trace.configSha256).toBe(sha256(configBytes));
    expect(trace.actualRequests).toBe(5);
    expect(trace.observations.map((row) => row.key)).toEqual(SRS4_D3_CASES.map((row) => row.key));
    expect(metrics.experimentId).toBe(SRS4_D3_ID);
    expect(metrics.actualRequests).toBe(trace.actualRequests);
    expect(metrics.contractValid).toBe(
      trace.observations.filter((row) => row.v1ValidatorStatus === "VALID").length,
    );
    expect(metrics.auditScored).toBe(false);
    expect(metrics.protectedChallengeRead).toBe(false);
    expect(metrics.productionChanged).toBe(false);
    expect(validation.experimentId).toBe(SRS4_D3_ID);
    expect(validation.configSha256).toBe(sha256(configBytes));
    expect(validation.traceSha256).toBe(sha256(traceBytes));
    expect(validation.metricsSha256).toBe(sha256(metricsBytes));
    for (const [index, row] of trace.observations.entries()) {
      const number = String(index + 1).padStart(2, "0");
      const intent = JSON.parse(
        await readFile(resolve(directory, `intent-${number}.json`), "utf8"),
      ) as { key: string; payloadSha256: string; oneRequestOnly: boolean };
      const separate = observation.parse(
        JSON.parse(
          await readFile(resolve(directory, `observation-${number}.json`), "utf8"),
        ) as unknown,
      );
      expect(intent).toMatchObject({
        key: row.key,
        payloadSha256: row.payloadSha256,
        oneRequestOnly: true,
      });
      expect(separate).toEqual(row);
      expect(row.d2.validatorStatus).toBe(row.v1ValidatorStatus);
      expect(row.d2.scenarioId).toBe(row.key);
    }
  });
});
