import {
  CoachingDecisionSchema,
  RewriteOrCompletionOutputJsonSchema,
  RewriteOrCompletionOutputSchema,
  SuggestedReplyOutputJsonSchema,
  SuggestedReplyOutputSchema,
  type AgentAction,
  type CoachingDecisionResult,
  type CoachingErrorCode,
  type CoachingRequest,
  type CommunicationGuidance,
  type ProviderConfiguration,
} from "@ai-message-coach/contracts";

import type { CoachingTextGenerator } from "./coaching-engine.js";
import type { CoachingPolicyDecision } from "./coaching-policy.js";
import { COACHING_INSTRUCTIONS } from "./coaching-prompt.js";

const DEFAULT_MODEL = "gpt-5.6-luna";
const DEFAULT_TIMEOUT_MS = 45_000;
const RESPONSES_URL = "https://api.openai.com/v1/responses";

type FetchImplementation = typeof fetch;

export interface OpenAiCoachingAdapterOptions {
  apiKey?: string;
  modelId?: string;
  fetchImplementation?: FetchImplementation;
  timeoutMs?: number;
}

function failure(code: CoachingErrorCode, message: string): CoachingDecisionResult {
  return { ok: false, error: { code, message } };
}

function schema(value: unknown): Record<string, unknown> {
  const schemaValue = { ...(value as Record<string, unknown>) };
  delete schemaValue.$schema;
  return schemaValue;
}

function isProviderGeneratedAction(
  action: AgentAction,
): action is "REWRITE_DRAFT" | "COMPLETE_DRAFT" | "SUGGEST_REPLY" {
  return action === "REWRITE_DRAFT" || action === "COMPLETE_DRAFT" || action === "SUGGEST_REPLY";
}

function outputFormat(action: AgentAction): { name: string; schema: Record<string, unknown> } {
  if (action === "REWRITE_DRAFT" || action === "COMPLETE_DRAFT") {
    return {
      name: "coaching_message",
      schema: schema(RewriteOrCompletionOutputJsonSchema),
    };
  }
  if (action === "SUGGEST_REPLY") {
    return {
      name: "coaching_replies",
      schema: schema(SuggestedReplyOutputJsonSchema),
    };
  }
  throw new Error("The fixed coaching action does not require provider generation.");
}

function decisionFromModelOutput(
  output: unknown,
  policy: CoachingPolicyDecision,
): CoachingDecisionResult {
  const fixedDecision = {
    action: policy.action,
    userIntent: policy.userIntent,
    actionConfidence: policy.actionConfidence,
    ambiguity: policy.ambiguity,
  };
  const candidate =
    policy.action === "REWRITE_DRAFT" || policy.action === "COMPLETE_DRAFT"
      ? RewriteOrCompletionOutputSchema.safeParse(output)
      : policy.action === "SUGGEST_REPLY"
        ? SuggestedReplyOutputSchema.safeParse(output)
        : undefined;

  if (candidate === undefined || !candidate.success)
    return failure("INVALID_RESPONSE", "The provider returned an invalid coaching result.");

  const decision = CoachingDecisionSchema.safeParse({ ...fixedDecision, ...candidate.data });
  return decision.success
    ? { ok: true, decision: decision.data }
    : failure("INVALID_RESPONSE", "The provider returned an invalid coaching result.");
}

function safeConversation(
  request: CoachingRequest,
  policy: CoachingPolicyDecision,
  communicationGuidance: CommunicationGuidance,
): string {
  return JSON.stringify({
    fixedDecision: {
      action: policy.action,
      userIntent: policy.userIntent,
      actionConfidence: policy.actionConfidence,
      ambiguity: policy.ambiguity,
    },
    selectedIntent:
      request.selection === null
        ? null
        : request.selection.kind === "ACTION"
          ? request.selection.intent
          : request.selection.answer,
    messages: request.analysis.messages.map(({ order, speaker, text }) => ({
      order,
      speaker,
      text,
    })),
    draft: request.analysis.draft.text,
    language: request.analysis.language,
    warnings: request.analysis.warnings,
    communicationGuidance,
  });
}

export function buildOpenAiCoachingRequest(
  request: CoachingRequest,
  policy: CoachingPolicyDecision,
  communicationGuidance: CommunicationGuidance,
  modelId: string,
): Record<string, unknown> {
  const format = outputFormat(policy.action);
  return {
    model: modelId,
    store: false,
    instructions: COACHING_INSTRUCTIONS,
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: safeConversation(request, policy, communicationGuidance) },
        ],
      },
    ],
    max_output_tokens: 3_000,
    text: {
      format: {
        type: "json_schema",
        name: format.name,
        strict: true,
        schema: format.schema,
      },
    },
  };
}

function outputText(payload: unknown): string | undefined {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("status" in payload) ||
    payload.status !== "completed" ||
    !("output" in payload) ||
    !Array.isArray(payload.output)
  )
    return undefined;
  for (const item of payload.output) {
    if (
      typeof item !== "object" ||
      item === null ||
      !("content" in item) ||
      !Array.isArray(item.content)
    )
      continue;
    for (const part of item.content) {
      if (
        typeof part === "object" &&
        part !== null &&
        "type" in part &&
        part.type === "output_text" &&
        "text" in part &&
        typeof part.text === "string"
      )
        return part.text;
    }
  }
  return undefined;
}

function httpFailure(status: number, payload: unknown): CoachingDecisionResult {
  const error =
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "object" &&
    payload.error !== null
      ? (payload.error as Record<string, unknown>)
      : {};
  if (status === 401 || status === 403)
    return failure("INVALID_CREDENTIALS", "Check the configured provider key and try again.");
  if (error.code === "insufficient_quota" || error.code === "billing_hard_limit_reached")
    return failure(
      "INSUFFICIENT_CREDITS",
      "The provider account does not have enough available credits.",
    );
  if (status === 429)
    return failure("RATE_LIMITED", "The provider is busy. Wait briefly, then try again.");
  if (status === 404 || error.code === "model_not_found")
    return failure("MODEL_UNAVAILABLE", "The selected coaching model is unavailable.");
  if (status === 408 || status === 504)
    return failure("TIMEOUT", "The provider request timed out. Please try again.");
  return failure("PROVIDER_ERROR", "A message could not be generated. Please try again.");
}

export class OpenAiCoachingAdapter implements CoachingTextGenerator {
  readonly configuration: ProviderConfiguration;
  readonly #apiKey: string | undefined;
  readonly #fetch: FetchImplementation;
  readonly #timeoutMs: number;

  constructor(options: OpenAiCoachingAdapterOptions = {}) {
    this.#apiKey = options.apiKey?.trim() || undefined;
    this.#fetch = options.fetchImplementation ?? fetch;
    this.#timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.configuration = {
      providerId: "openai",
      modelId: options.modelId?.trim() || DEFAULT_MODEL,
      configured: this.#apiKey !== undefined,
      capabilities: { textGeneration: true, vision: true, structuredOutput: true },
    };
  }

  async generateCoachingDecision(
    request: CoachingRequest,
    policy: CoachingPolicyDecision,
    communicationGuidance: CommunicationGuidance,
  ): Promise<CoachingDecisionResult> {
    if (!this.#apiKey) return failure("NOT_CONFIGURED", "Configure an API key, then try again.");
    if (!isProviderGeneratedAction(policy.action))
      return failure("INVALID_RESPONSE", "The coaching action did not require provider output.");
    let response: Response;
    try {
      response = await this.#fetch(RESPONSES_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.#apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(
          buildOpenAiCoachingRequest(
            request,
            policy,
            communicationGuidance,
            this.configuration.modelId,
          ),
        ),
        signal: AbortSignal.timeout(this.#timeoutMs),
      });
    } catch (error) {
      return error instanceof Error &&
        (error.name === "AbortError" || error.name === "TimeoutError")
        ? failure("TIMEOUT", "The provider request timed out. Please try again.")
        : failure("PROVIDER_ERROR", "A message could not be generated. Please try again.");
    }
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      payload = undefined;
    }
    if (!response.ok) return httpFailure(response.status, payload);
    const text = outputText(payload);
    if (!text)
      return failure("INVALID_RESPONSE", "The provider returned an incomplete coaching result.");
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return failure("INVALID_RESPONSE", "The provider returned an invalid coaching result.");
    }
    return decisionFromModelOutput(json, policy);
  }
}
