import { analyzeConversationImage, type ConversationImageAnalyzer } from "@ai-message-coach/ai";
import type {
  ConversationAnalysisResult,
  ConversationImageRequest,
  ProviderConfiguration,
} from "@ai-message-coach/contracts";

const analysisInProgressResult: ConversationAnalysisResult = {
  ok: false,
  error: {
    code: "ANALYSIS_IN_PROGRESS",
    message: "Conversation analysis is already in progress.",
  },
};

export interface ConversationAnalysisService {
  getProviderConfiguration(): ProviderConfiguration;
  requestAnalysis(request: ConversationImageRequest): Promise<ConversationAnalysisResult>;
}

export function createConversationAnalysisService(
  analyzer: ConversationImageAnalyzer,
): ConversationAnalysisService {
  let inFlight = false;

  return {
    getProviderConfiguration(): ProviderConfiguration {
      return structuredClone(analyzer.configuration);
    },

    async requestAnalysis(request: ConversationImageRequest): Promise<ConversationAnalysisResult> {
      if (inFlight) {
        return analysisInProgressResult;
      }

      inFlight = true;

      try {
        return await analyzeConversationImage(analyzer, request);
      } finally {
        inFlight = false;
      }
    },
  };
}
