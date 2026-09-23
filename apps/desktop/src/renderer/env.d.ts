import type {
  AppInfo,
  ConversationAnalysisResult,
  ConversationCaptureResult,
  ConversationImageRequest,
  CoachingDecisionResult,
  CoachingRequest,
  CopyCoachingTextResult,
  ClearLocalMemoryRequest,
  DeleteMessageLengthRequest,
  LocalMemoryResult,
  LocalMemoryInspectorResult,
  LocalMemoryInspectorRequest,
  LocalMemoryStatus,
  ProviderConfiguration,
  ResetUnavailableLocalMemoryRequest,
  SaveMessageLengthRequest,
} from "@ai-message-coach/contracts";

declare global {
  interface Window {
    readonly messageCoach?: {
      readonly appInfo: AppInfo;
      readonly analyzeConversationImage: (
        request: ConversationImageRequest,
      ) => Promise<ConversationAnalysisResult>;
      readonly copyCoachingText: (text: string) => Promise<CopyCoachingTextResult>;
      readonly clearLocalMemory: (request: ClearLocalMemoryRequest) => Promise<LocalMemoryResult>;
      readonly deleteMessageLength: (
        request: DeleteMessageLengthRequest,
      ) => Promise<LocalMemoryResult>;
      readonly getProviderConfiguration: () => Promise<ProviderConfiguration>;
      readonly getLocalMemoryStatus: () => Promise<LocalMemoryStatus>;
      readonly inspectLocalMemory?: (
        request: LocalMemoryInspectorRequest,
      ) => Promise<LocalMemoryInspectorResult>;
      readonly readLocalMemory: () => Promise<LocalMemoryResult>;
      readonly requestConversationCapture: () => Promise<ConversationCaptureResult>;
      readonly requestCoaching: (request: CoachingRequest) => Promise<CoachingDecisionResult>;
      readonly resetUnavailableLocalMemory: (
        request: ResetUnavailableLocalMemoryRequest,
      ) => Promise<LocalMemoryResult>;
      readonly saveMessageLength: (request: SaveMessageLengthRequest) => Promise<LocalMemoryResult>;
    };
  }
}

export {};
