import type {
  ConversationAnalysisResult,
  ConversationImageRequest,
  ProviderConfiguration,
} from "@ai-message-coach/contracts";
import { describe, expect, it, vi } from "vitest";

import { createConversationAnalysisService } from "./conversation-analysis.js";

const configuration: ProviderConfiguration = {
  providerId: "synthetic",
  modelId: "fixture-model",
  configured: true,
  capabilities: { textGeneration: true, vision: true, structuredOutput: true },
};

const request: ConversationImageRequest = {
  mimeType: "image/png",
  bytes: new Uint8Array([137, 80, 78, 71]),
  width: 800,
  height: 600,
};

const providerFailure: ConversationAnalysisResult = {
  ok: false,
  error: { code: "PROVIDER_ERROR", message: "Synthetic failure." },
};

describe("main-process conversation analysis service", () => {
  it("returns a clone of the safe provider configuration", () => {
    const service = createConversationAnalysisService({
      configuration,
      analyzeConversationImage: vi.fn(async () => providerFailure),
    });

    const result = service.getProviderConfiguration();

    expect(result).toEqual(configuration);
    expect(result).not.toBe(configuration);
    expect(result).not.toHaveProperty("apiKey");
  });

  it("suppresses duplicate requests and accepts a new request after completion", async () => {
    let resolveAnalysis: ((result: ConversationAnalysisResult) => void) | undefined;
    const analyzeConversationImage = vi
      .fn()
      .mockImplementationOnce(
        async () =>
          await new Promise<ConversationAnalysisResult>((resolve) => {
            resolveAnalysis = resolve;
          }),
      )
      .mockResolvedValue(providerFailure);
    const service = createConversationAnalysisService({ configuration, analyzeConversationImage });

    const first = service.requestAnalysis(request);

    await expect(service.requestAnalysis(request)).resolves.toMatchObject({
      ok: false,
      error: { code: "ANALYSIS_IN_PROGRESS" },
    });
    expect(analyzeConversationImage).toHaveBeenCalledTimes(1);

    resolveAnalysis?.(providerFailure);
    await expect(first).resolves.toEqual(providerFailure);
    await service.requestAnalysis(request);
    expect(analyzeConversationImage).toHaveBeenCalledTimes(2);
  });

  it("clears the single-flight guard after a thrown provider failure", async () => {
    const analyzeConversationImage = vi.fn(async () => {
      throw new Error("private failure");
    });
    const service = createConversationAnalysisService({ configuration, analyzeConversationImage });

    await expect(service.requestAnalysis(request)).resolves.toMatchObject({
      ok: false,
      error: { code: "PROVIDER_ERROR" },
    });
    await service.requestAnalysis(request);
    expect(analyzeConversationImage).toHaveBeenCalledTimes(2);
  });
});
