import type {
  AppInfo,
  ConversationAnalysisResult,
  ConversationCaptureResult,
  ConversationImageRequest,
  CoachingDecisionResult,
  CoachingRequest,
  CopyCoachingTextResult,
  ProviderConfiguration,
} from "@ai-message-coach/contracts";

declare global {
  interface Window {
    readonly messageCoach?: {
      readonly appInfo: AppInfo;
      readonly analyzeConversationImage: (
        request: ConversationImageRequest,
      ) => Promise<ConversationAnalysisResult>;
      readonly copyCoachingText: (text: string) => Promise<CopyCoachingTextResult>;
      readonly getProviderConfiguration: () => Promise<ProviderConfiguration>;
      readonly requestConversationCapture: () => Promise<ConversationCaptureResult>;
      readonly requestCoaching: (request: CoachingRequest) => Promise<CoachingDecisionResult>;
    };
  }
}

export {};
