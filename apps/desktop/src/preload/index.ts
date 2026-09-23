import {
  APP_NAME,
  AppInfoSchema,
  COACHING_REQUEST_CHANNEL,
  COPY_COACHING_TEXT_CHANNEL,
  LOCAL_MEMORY_CLEAR_CHANNEL,
  LOCAL_MEMORY_DELETE_CHANNEL,
  LOCAL_MEMORY_INSPECT_CHANNEL,
  LOCAL_MEMORY_READ_CHANNEL,
  LOCAL_MEMORY_RESET_UNAVAILABLE_CHANNEL,
  LOCAL_MEMORY_SAVE_CHANNEL,
  LOCAL_MEMORY_STATUS_CHANNEL,
  CONVERSATION_ANALYSIS_CHANNEL,
  CONVERSATION_CAPTURE_CHANNEL,
  ConversationAnalysisResultSchema,
  ConversationCaptureResultSchema,
  ConversationImageRequestSchema,
  CoachingDecisionResultSchema,
  CoachingRequestSchema,
  CopyCoachingTextRequestSchema,
  CopyCoachingTextResultSchema,
  ClearLocalMemoryRequestSchema,
  DeleteMessageLengthRequestSchema,
  LocalMemoryResultSchema,
  LocalMemoryInspectorResultSchema,
  LocalMemoryInspectorRequestSchema,
  LocalMemoryStatusSchema,
  ResetUnavailableLocalMemoryRequestSchema,
  SaveMessageLengthRequestSchema,
  isDesktopDevelopmentRendererUrl,
  PROVIDER_CONFIGURATION_CHANNEL,
  ProviderConfigurationSchema,
  type ConversationAnalysisResult,
  type ConversationCaptureResult,
  type ConversationImageRequest,
  type CoachingDecisionResult,
  type CoachingRequest,
  type CopyCoachingTextResult,
  type ClearLocalMemoryRequest,
  type DeleteMessageLengthRequest,
  type LocalMemoryResult,
  type LocalMemoryInspectorResult,
  type LocalMemoryInspectorRequest,
  type LocalMemoryStatus,
  type ResetUnavailableLocalMemoryRequest,
  type SaveMessageLengthRequest,
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
const invalidMemoryResult: LocalMemoryResult = {
  ok: false,
  error: { code: "INVALID_REQUEST", message: "The local memory response was not accepted." },
};
const invalidMemoryStatus: LocalMemoryStatus = {
  available: false,
  error: invalidMemoryResult.error,
};
const invalidInspectorResult: LocalMemoryInspectorResult = invalidMemoryResult;

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

async function getLocalMemoryStatus(): Promise<LocalMemoryStatus> {
  const parsed = LocalMemoryStatusSchema.safeParse(
    await ipcRenderer.invoke(LOCAL_MEMORY_STATUS_CHANNEL),
  );
  return parsed.success ? parsed.data : invalidMemoryStatus;
}

async function readLocalMemory(): Promise<LocalMemoryResult> {
  const parsed = LocalMemoryResultSchema.safeParse(
    await ipcRenderer.invoke(LOCAL_MEMORY_READ_CHANNEL),
  );
  return parsed.success ? parsed.data : invalidMemoryResult;
}

async function saveMessageLength(request: SaveMessageLengthRequest): Promise<LocalMemoryResult> {
  const validated = SaveMessageLengthRequestSchema.safeParse(request);
  if (!validated.success) return invalidMemoryResult;
  const parsed = LocalMemoryResultSchema.safeParse(
    await ipcRenderer.invoke(LOCAL_MEMORY_SAVE_CHANNEL, validated.data),
  );
  return parsed.success ? parsed.data : invalidMemoryResult;
}

async function deleteMessageLength(
  request: DeleteMessageLengthRequest,
): Promise<LocalMemoryResult> {
  const validated = DeleteMessageLengthRequestSchema.safeParse(request);
  if (!validated.success) return invalidMemoryResult;
  const parsed = LocalMemoryResultSchema.safeParse(
    await ipcRenderer.invoke(LOCAL_MEMORY_DELETE_CHANNEL, validated.data),
  );
  return parsed.success ? parsed.data : invalidMemoryResult;
}

async function clearLocalMemory(request: ClearLocalMemoryRequest): Promise<LocalMemoryResult> {
  const validated = ClearLocalMemoryRequestSchema.safeParse(request);
  if (!validated.success) return invalidMemoryResult;
  const parsed = LocalMemoryResultSchema.safeParse(
    await ipcRenderer.invoke(LOCAL_MEMORY_CLEAR_CHANNEL, validated.data),
  );
  return parsed.success ? parsed.data : invalidMemoryResult;
}

async function resetUnavailableLocalMemory(
  request: ResetUnavailableLocalMemoryRequest,
): Promise<LocalMemoryResult> {
  const validated = ResetUnavailableLocalMemoryRequestSchema.safeParse(request);
  if (!validated.success) return invalidMemoryResult;
  const parsed = LocalMemoryResultSchema.safeParse(
    await ipcRenderer.invoke(LOCAL_MEMORY_RESET_UNAVAILABLE_CHANNEL, validated.data),
  );
  return parsed.success ? parsed.data : invalidMemoryResult;
}

async function inspectLocalMemory(
  request: LocalMemoryInspectorRequest,
): Promise<LocalMemoryInspectorResult> {
  const validated = LocalMemoryInspectorRequestSchema.safeParse(request);
  if (!validated.success) return invalidInspectorResult;
  const parsed = LocalMemoryInspectorResultSchema.safeParse(
    await ipcRenderer.invoke(LOCAL_MEMORY_INSPECT_CHANNEL, validated.data),
  );
  return parsed.success ? parsed.data : invalidInspectorResult;
}

const productionBridge = {
  appInfo: AppInfoSchema.parse({ name: APP_NAME }),
  analyzeConversationImage,
  copyCoachingText,
  clearLocalMemory,
  deleteMessageLength,
  getProviderConfiguration,
  getLocalMemoryStatus,
  readLocalMemory,
  requestConversationCapture,
  requestCoaching,
  resetUnavailableLocalMemory,
  saveMessageLength,
};

const bridge = Object.freeze(
  process.defaultApp && isDesktopDevelopmentRendererUrl(process.env.VITE_DEV_SERVER_URL)
    ? { ...productionBridge, inspectLocalMemory }
    : productionBridge,
);

contextBridge.exposeInMainWorld("messageCoach", bridge);
