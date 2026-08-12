import {
  CoachingDecisionJsonSchema,
  CoachingDecisionSchema,
  type CoachingDecisionResult,
  type CoachingErrorCode,
  type CoachingRequest,
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

function schema(): Record<string, unknown> {
  const value = { ...(CoachingDecisionJsonSchema as Record<string, unknown>) };
  delete value.$schema;
  return value;
}

function safeConversation(request: CoachingRequest, policy: CoachingPolicyDecision): string {
  return JSON.stringify({
    requestedAction: policy.action,
    userIntent: policy.userIntent.value,
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
  });
}

export function buildOpenAiCoachingRequest(
  request: CoachingRequest,
  policy: CoachingPolicyDecision,
  modelId: string,
): Record<string, unknown> {
  return {
    model: modelId,
    store: false,
    instructions: COACHING_INSTRUCTIONS,
    input: [
      { role: "user", content: [{ type: "input_text", text: safeConversation(request, policy) }] },
    ],
    max_output_tokens: 3_000,
    text: {
      format: {
        type: "json_schema",
        name: "coaching_decision",
        strict: true,
        schema: schema(),
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
  ): Promise<CoachingDecisionResult> {
    if (!this.#apiKey) return failure("NOT_CONFIGURED", "Configure an API key, then try again.");
    let response: Response;
    try {
      response = await this.#fetch(RESPONSES_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.#apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(
          buildOpenAiCoachingRequest(request, policy, this.configuration.modelId),
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
    const decision = CoachingDecisionSchema.safeParse(json);
    return decision.success
      ? { ok: true, decision: decision.data }
      : failure("INVALID_RESPONSE", "The provider returned an invalid coaching result.");
  }
}
