import type { AppInfo, ConversationCaptureResult } from "@ai-message-coach/contracts";

declare global {
  interface Window {
    readonly messageCoach?: {
      readonly appInfo: AppInfo;
      readonly requestConversationCapture: () => Promise<ConversationCaptureResult>;
    };
  }
}

export {};
