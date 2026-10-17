import {
  coachConversation,
  type CoachingTextGenerator,
  type CoachingEngineOptions,
} from "@ai-message-coach/ai";
import type {
  CoachingDecisionResult,
  CoachingRequest,
  CopyCoachingTextResult,
} from "@ai-message-coach/contracts";

const inProgress: CoachingDecisionResult = {
  ok: false,
  error: { code: "COACHING_IN_PROGRESS", message: "Coaching is already in progress." },
};

export interface CoachingService {
  requestCoaching(
    request: CoachingRequest,
    inspection?: CoachingEngineOptions,
  ): Promise<CoachingDecisionResult>;
}

export function createCoachingService(generator: CoachingTextGenerator): CoachingService {
  let inFlight = false;
  return {
    async requestCoaching(request, inspection) {
      if (inFlight) return inProgress;
      inFlight = true;
      try {
        return await coachConversation(generator, request, inspection);
      } finally {
        inFlight = false;
      }
    },
  };
}

export interface ClipboardWriter {
  writeText(text: string): void;
}

export function copyCoachingText(writer: ClipboardWriter, text: string): CopyCoachingTextResult {
  try {
    writer.writeText(text);
    return { ok: true };
  } catch {
    return { ok: false, error: { message: "The message could not be copied. Please try again." } };
  }
}
