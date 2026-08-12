import {
  APP_NAME,
  AppInfoSchema,
  COACHING_REQUEST_CHANNEL,
  COPY_COACHING_TEXT_CHANNEL,
  CONVERSATION_ANALYSIS_CHANNEL,
  CONVERSATION_CAPTURE_CHANNEL,
  ConversationAnalysisResultSchema,
  ConversationCaptureResultSchema,
  ConversationImageRequestSchema,
  CoachingDecisionResultSchema,
  CoachingRequestSchema,
  CopyCoachingTextRequestSchema,
  CopyCoachingTextResultSchema,
  PROVIDER_CONFIGURATION_CHANNEL,
  ProviderConfigurationSchema,
  type ConversationAnalysisResult,
  type ConversationCaptureResult,
  type ConversationImageRequest,
  type CoachingDecisionResult,
  type CoachingRequest,
  type CopyCoachingTextResult,
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
const invalidCoachingResponse: CoachingDecisionResult = {
  ok: false,
  error: { code: "PROVIDER_ERROR", message: "The coaching response could not be validated." },
};
const invalidCopyResponse: CopyCoachingTextResult = {
  ok: false,
  error: { message: "The copy response could not be validated." },
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

async function requestCoaching(request: CoachingRequest): Promise<CoachingDecisionResult> {
  const parsed = CoachingRequestSchema.safeParse(request);
  if (!parsed.success) return invalidCoachingResponse;
  const result = CoachingDecisionResultSchema.safeParse(
    await ipcRenderer.invoke(COACHING_REQUEST_CHANNEL, parsed.data),
  );
  return result.success ? result.data : invalidCoachingResponse;
}

async function copyCoachingText(text: string): Promise<CopyCoachingTextResult> {
  const request = CopyCoachingTextRequestSchema.safeParse({ text });
  if (!request.success) return invalidCopyResponse;
  const result = CopyCoachingTextResultSchema.safeParse(
    await ipcRenderer.invoke(COPY_COACHING_TEXT_CHANNEL, request.data),
  );
  return result.success ? result.data : invalidCopyResponse;
}

const bridge = Object.freeze({
  appInfo: AppInfoSchema.parse({ name: APP_NAME }),
  analyzeConversationImage,
  copyCoachingText,
  getProviderConfiguration,
  requestConversationCapture,
  requestCoaching,
});

contextBridge.exposeInMainWorld("messageCoach", bridge);
