import type {
  AppInfo,
  ConversationAnalysisResult,
  ConversationCaptureResult,
  ConversationImageRequest,
  ProviderConfiguration,
} from "@ai-message-coach/contracts";

declare global {
  interface Window {
    readonly messageCoach?: {
      readonly appInfo: AppInfo;
      readonly analyzeConversationImage: (
        request: ConversationImageRequest,
      ) => Promise<ConversationAnalysisResult>;
      readonly getProviderConfiguration: () => Promise<ProviderConfiguration>;
      readonly requestConversationCapture: () => Promise<ConversationCaptureResult>;
    };
  }
}

export {};
