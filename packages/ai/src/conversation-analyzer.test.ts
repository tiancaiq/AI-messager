import type {
  ConversationAnalysisResult,
  ConversationImageRequest,
  ProviderConfiguration,
} from "@ai-message-coach/contracts";
import { describe, expect, it, vi } from "vitest";

import {
  analyzeConversationImage,
  type ConversationImageAnalyzer,
} from "./conversation-analyzer.js";

const request: ConversationImageRequest = {
  mimeType: "image/png",
  bytes: new Uint8Array([137, 80, 78, 71]),
  width: 800,
  height: 600,
};

function createAnalyzer(
  configuration: ProviderConfiguration,
  result: ConversationAnalysisResult,
): ConversationImageAnalyzer {
  return {
    configuration,
    analyzeConversationImage: vi.fn(async () => result),
  };
}

const baseConfiguration: ProviderConfiguration = {
  providerId: "synthetic",
  modelId: "fixture-model",
  configured: true,
  capabilities: { textGeneration: true, vision: true, structuredOutput: true },
};

describe("provider-neutral conversation analyzer", () => {
  it("fails before provider invocation when not configured", async () => {
    const analyzer = createAnalyzer(
      { ...baseConfiguration, configured: false },
      { ok: false, error: { code: "PROVIDER_ERROR", message: "unused" } },
    );

    await expect(analyzeConversationImage(analyzer, request)).resolves.toMatchObject({
      ok: false,
      error: { code: "NOT_CONFIGURED" },
    });
    expect(analyzer.analyzeConversationImage).not.toHaveBeenCalled();
  });

  it("fails capability preflight before transmitting the image", async () => {
    for (const capability of ["vision", "textGeneration", "structuredOutput"] as const) {
      const analyzer = createAnalyzer(
        {
          ...baseConfiguration,
          capabilities: { ...baseConfiguration.capabilities, [capability]: false },
        },
        { ok: false, error: { code: "PROVIDER_ERROR", message: "unused" } },
      );

      await expect(analyzeConversationImage(analyzer, request)).resolves.toMatchObject({
        ok: false,
        error: { code: "VISION_UNSUPPORTED" },
      });
      expect(analyzer.analyzeConversationImage).not.toHaveBeenCalled();
    }
  });

  it("normalizes thrown adapter failures", async () => {
    const analyzer: ConversationImageAnalyzer = {
      configuration: baseConfiguration,
      analyzeConversationImage: vi.fn(async () => {
        throw new Error("private provider detail");
      }),
    };

    await expect(analyzeConversationImage(analyzer, request)).resolves.toEqual({
      ok: false,
      error: {
        code: "PROVIDER_ERROR",
        message: "The conversation could not be analyzed. Please try again.",
      },
    });
  });
});
