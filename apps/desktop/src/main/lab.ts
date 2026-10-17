import { decideCoachingAction } from "@ai-message-coach/ai";
import {
  CoachingRequestSchema,
  LabRequestSchema,
  LabResultSchema,
  ProviderConfigurationSchema,
  type CoachingRequest,
  type LabRequest,
  type LabResult,
  type LabTrace,
  type ProviderConfiguration,
} from "@ai-message-coach/contracts";

import type { CoachingService } from "./coaching.js";

/** Explicitly authored simulation of analysis input. No capture or extraction is performed. */
export function labCoachingRequest(input: LabRequest): CoachingRequest {
  const chinese = input.language === "zh-Hans" || input.language === "zh-Hant";
  const mixed = input.language === "mixed";
  const messages = [
    ...(input.userContext ? [{ speaker: "USER", text: input.userContext }] : []),
    ...(input.incoming ? [{ speaker: "OTHER", text: input.incoming }] : []),
  ].map((message, index) => ({
    ...message,
    id: `lab-${index + 1}`,
    order: index + 1,
    textConfidence: 1,
    speakerConfidence: 1,
  }));
  return CoachingRequestSchema.parse({
    selection: input.selection ?? null,
    analysis: {
      messages,
      draft: { text: input.draft.trim() || null, confidence: 1 },
      participants: [],
      visibleContact: {
        displayName: null,
        username: null,
        channelOrGroupName: null,
        platformHint: null,
        confidence: 0,
      },
      language: {
        primary: chinese ? "zh" : input.language === "other" ? null : "en",
        secondary: mixed ? "zh" : null,
        script:
          input.language === "zh-Hans"
            ? "SIMPLIFIED"
            : input.language === "zh-Hant"
              ? "TRADITIONAL"
              : mixed
                ? "MIXED"
                : "NOT_APPLICABLE",
        codeSwitching: mixed,
        supportedForLanguageSpecificSkills: input.language !== "other",
        confidence: input.language === "other" ? 0 : 1,
      },
      conversation: { summary: "", confidence: 1 },
      warnings: [],
      overallConfidence: 1,
    },
  });
}

export function createLabService(service: CoachingService, configuration: ProviderConfiguration) {
  return {
    configuration: ProviderConfigurationSchema.parse(configuration),
    async run(raw: unknown): Promise<LabResult> {
      const input = LabRequestSchema.safeParse(raw);
      if (!input.success) return { ok: false, code: "INVALID_REQUEST", action: null };
      try {
        const request = labCoachingRequest(input.data);
        const policy = decideCoachingAction(request);
        const trace: LabTrace = {
          inputSource: "MANUAL_SIMULATION",
          fixedAction: policy.action,
          context: null,
          productionPlan: null,
          ranking: null,
          shadow: null,
          composerGuidance: null,
          validation: { stage: "NOT_REACHED", guardRule: null, candidate: null },
        };
        const result = await service.requestCoaching(request, {
          onSkillContext: (context) => {
            trace.context = context;
          },
          onCommunicationPlan: (plan) => {
            trace.productionPlan = plan;
          },
          onSkillRanking: (ranking) => {
            trace.ranking = ranking;
          },
          onShadowDetails: (shadow) => {
            trace.shadow = shadow;
          },
          onComposerGuidance: (guidance) => {
            trace.composerGuidance = guidance;
          },
          onValidation: (validation) => {
            trace.validation = validation;
          },
        });
        if (!result.ok && result.error.code === "COACHING_IN_PROGRESS")
          return { ok: false, code: "COACHING_IN_PROGRESS", action: policy.action };
        return LabResultSchema.parse({ ok: true, provider: configuration, result, trace });
      } catch {
        return { ok: false, code: "LAB_FAILED", action: null };
      }
    },
  };
}

export type LabService = ReturnType<typeof createLabService>;
