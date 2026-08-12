import {
  ConversationAnalysisResultSchema,
  ConversationImageRequestSchema,
  ProviderConfigurationSchema,
  type ConversationAnalysisResult,
  type ConversationImageRequest,
  type ProviderConfiguration,
} from "@ai-message-coach/contracts";

export interface ConversationImageAnalyzer {
  readonly configuration: ProviderConfiguration;
  analyzeConversationImage(request: ConversationImageRequest): Promise<ConversationAnalysisResult>;
}

const notConfiguredResult: ConversationAnalysisResult = {
  ok: false,
  error: {
    code: "NOT_CONFIGURED",
    message: "Configure an API key for the selected provider, then try again.",
  },
};

const unsupportedResult: ConversationAnalysisResult = {
  ok: false,
  error: {
    code: "VISION_UNSUPPORTED",
    message: "The selected model does not support structured screenshot analysis.",
  },
};

const providerErrorResult: ConversationAnalysisResult = {
  ok: false,
  error: {
    code: "PROVIDER_ERROR",
    message: "The conversation could not be analyzed. Please try again.",
  },
};

export async function analyzeConversationImage(
  analyzer: ConversationImageAnalyzer,
  request: ConversationImageRequest,
): Promise<ConversationAnalysisResult> {
  const parsedConfiguration = ProviderConfigurationSchema.safeParse(analyzer.configuration);
  const parsedRequest = ConversationImageRequestSchema.safeParse(request);

  if (!parsedConfiguration.success || !parsedRequest.success) {
    return providerErrorResult;
  }

  if (!parsedConfiguration.data.configured) {
    return notConfiguredResult;
  }

  const capabilities = parsedConfiguration.data.capabilities;

  if (!capabilities.vision || !capabilities.textGeneration || !capabilities.structuredOutput) {
    return unsupportedResult;
  }

  try {
    const result = await analyzer.analyzeConversationImage(parsedRequest.data);
    const parsedResult = ConversationAnalysisResultSchema.safeParse(result);

    return parsedResult.success ? parsedResult.data : providerErrorResult;
  } catch {
    return providerErrorResult;
  }
}
