import {
  APP_NAME,
  AppInfoSchema,
  CONVERSATION_ANALYSIS_CHANNEL,
  CONVERSATION_CAPTURE_CHANNEL,
  ConversationAnalysisResultSchema,
  ConversationCaptureResultSchema,
  ConversationImageRequestSchema,
  PROVIDER_CONFIGURATION_CHANNEL,
  ProviderConfigurationSchema,
  type ConversationAnalysisResult,
  type ConversationCaptureResult,
  type ConversationImageRequest,
  type ProviderConfiguration,
} from "@ai-message-coach/contracts";
import { contextBridge, ipcRenderer } from "electron";

const invalidCaptureResponse: ConversationCaptureResult = {
  ok: false,
  error: {
    code: "CAPTURE_FAILED",
    message: "The capture response could not be validated. Please try again.",
  },
};

const invalidAnalysisResponse: ConversationAnalysisResult = {
  ok: false,
  error: {
    code: "PROVIDER_ERROR",
    message: "The analysis response could not be validated. Please try again.",
  },
};

const unavailableProviderConfiguration: ProviderConfiguration = {
  providerId: "openai",
  modelId: "unavailable",
  configured: false,
  capabilities: { textGeneration: false, vision: false, structuredOutput: false },
};

async function requestConversationCapture(): Promise<ConversationCaptureResult> {
  const result = ConversationCaptureResultSchema.safeParse(
    await ipcRenderer.invoke(CONVERSATION_CAPTURE_CHANNEL),
  );

  return result.success ? result.data : invalidCaptureResponse;
}

async function getProviderConfiguration(): Promise<ProviderConfiguration> {
  const result = ProviderConfigurationSchema.safeParse(
    await ipcRenderer.invoke(PROVIDER_CONFIGURATION_CHANNEL),
  );

  return result.success ? result.data : unavailableProviderConfiguration;
}

async function analyzeConversationImage(
  request: ConversationImageRequest,
): Promise<ConversationAnalysisResult> {
  const parsedRequest = ConversationImageRequestSchema.safeParse(request);

  if (!parsedRequest.success) {
    return invalidAnalysisResponse;
  }

  const result = ConversationAnalysisResultSchema.safeParse(
    await ipcRenderer.invoke(CONVERSATION_ANALYSIS_CHANNEL, parsedRequest.data),
  );

  return result.success ? result.data : invalidAnalysisResponse;
}

const bridge = Object.freeze({
  appInfo: AppInfoSchema.parse({ name: APP_NAME }),
  analyzeConversationImage,
  getProviderConfiguration,
  requestConversationCapture,
});

contextBridge.exposeInMainWorld("messageCoach", bridge);
