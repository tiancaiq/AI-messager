import {
  CoachingDecisionResultSchema,
  CoachingRequestSchema,
  ProviderConfigurationSchema,
  type CoachingDecision,
  type CoachingDecisionResult,
  type CoachingRequest,
  type ProviderConfiguration,
} from "@ai-message-coach/contracts";

import { decideCoachingAction, type CoachingPolicyDecision } from "./coaching-policy.js";

export interface CoachingTextGenerator {
  readonly configuration: ProviderConfiguration;
  generateCoachingDecision(
    request: CoachingRequest,
    policy: CoachingPolicyDecision,
  ): Promise<CoachingDecisionResult>;
}

const safeFailure: CoachingDecisionResult = {
  ok: false,
  error: { code: "PROVIDER_ERROR", message: "A message could not be generated. Please try again." },
};

function localDecision(policy: CoachingPolicyDecision): CoachingDecision | undefined {
  const base = {
    userIntent: policy.userIntent,
    actionConfidence: policy.actionConfidence,
    ambiguity: policy.ambiguity,
  };

  if (policy.action === "SUGGEST_ACTIONS" && policy.actions) {
    return { ...base, action: policy.action, actions: policy.actions };
  }
  if (policy.action === "ASK_CLARIFICATION" && policy.clarification) {
    return { ...base, action: policy.action, ...policy.clarification };
  }
  if (policy.action === "NO_REPLY_NEEDED" && policy.noReply) {
    return { ...base, action: policy.action, ...policy.noReply };
  }
  return undefined;
}

export async function coachConversation(
  generator: CoachingTextGenerator,
  request: CoachingRequest,
): Promise<CoachingDecisionResult> {
  const parsedRequest = CoachingRequestSchema.safeParse(request);
  const parsedConfiguration = ProviderConfigurationSchema.safeParse(generator.configuration);
  if (!parsedRequest.success || !parsedConfiguration.success) return safeFailure;

  const policy = decideCoachingAction(parsedRequest.data);
  const deterministic = localDecision(policy);
  if (deterministic) return { ok: true, decision: deterministic };

  if (!parsedConfiguration.data.configured) {
    return {
      ok: false,
      error: { code: "NOT_CONFIGURED", message: "Configure an API key, then try again." },
    };
  }
  if (
    !parsedConfiguration.data.capabilities.textGeneration ||
    !parsedConfiguration.data.capabilities.structuredOutput
  ) {
    return {
      ok: false,
      error: {
        code: "MODEL_UNAVAILABLE",
        message: "The selected model cannot generate structured coaching.",
      },
    };
  }

  try {
    const result = await generator.generateCoachingDecision(parsedRequest.data, policy);
    const parsed = CoachingDecisionResultSchema.safeParse(result);
    if (!parsed.success || (parsed.data.ok && parsed.data.decision.action !== policy.action))
      return {
        ok: false,
        error: {
          code: "INVALID_RESPONSE",
          message: "The provider returned an invalid coaching result.",
        },
      };
    return parsed.data;
  } catch {
    return safeFailure;
  }
}
