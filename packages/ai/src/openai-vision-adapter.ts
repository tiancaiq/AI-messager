import { Buffer } from "node:buffer";

import {
  ConversationAnalysisJsonSchema,
  ConversationAnalysisSchema,
  type AiProviderErrorCode,
  type ConversationAnalysisResult,
  type ConversationImageRequest,
  type ProviderConfiguration,
} from "@ai-message-coach/contracts";

import type { ConversationImageAnalyzer } from "./conversation-analyzer.js";
import {
  CONVERSATION_ANALYSIS_INSTRUCTIONS,
  CONVERSATION_ANALYSIS_USER_TEXT,
} from "./conversation-prompt.js";

const DEFAULT_MODEL = "gpt-5.6-luna";
const DEFAULT_TIMEOUT_MS = 45_000;
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

type FetchImplementation = typeof fetch;

export interface OpenAiVisionAdapterOptions {
  apiKey?: string;
  modelId?: string;
  fetchImplementation?: FetchImplementation;
  onDiagnostic?: (diagnostic: OpenAiAdapterDiagnostic) => void;
  timeoutMs?: number;
}

export interface OpenAiAdapterDiagnostic {
  kind: "HTTP_ERROR" | "TRANSPORT_ERROR";
  status?: number;
  providerCode?: string;
  providerType?: string;
}

interface OpenAiErrorPayload {
  error?: {
    code?: unknown;
    type?: unknown;
  };
}

interface OpenAiResponsePayload {
  status?: unknown;
  output?: unknown;
}

function safeError(code: AiProviderErrorCode, message: string): ConversationAnalysisResult {
  return { ok: false, error: { code, message } };
}

function responseSchema(): Record<string, unknown> {
  const schema = { ...(ConversationAnalysisJsonSchema as Record<string, unknown>) };
  delete schema.$schema;
  return schema;
}

export function buildOpenAiConversationRequest(
  request: ConversationImageRequest,
  modelId: string,
): Record<string, unknown> {
  const base64Image = Buffer.from(request.bytes).toString("base64");

  return {
    model: modelId,
    store: false,
    instructions: CONVERSATION_ANALYSIS_INSTRUCTIONS,
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: CONVERSATION_ANALYSIS_USER_TEXT },
          {
            type: "input_image",
            image_url: `data:${request.mimeType};base64,${base64Image}`,
            detail: "high",
          },
        ],
      },
    ],
    max_output_tokens: 6_000,
    text: {
      format: {
        type: "json_schema",
        name: "conversation_analysis",
        strict: true,
        schema: responseSchema(),
      },
    },
  };
}

function extractOutputText(payload: OpenAiResponsePayload): string | undefined {
  if (payload.status !== "completed" || !Array.isArray(payload.output)) {
    return undefined;
  }

  for (const item of payload.output) {
    if (typeof item !== "object" || item === null || !("content" in item)) {
      continue;
    }

    const content = item.content;

    if (!Array.isArray(content)) {
      continue;
    }

    for (const part of content) {
      if (
        typeof part === "object" &&
        part !== null &&
        "type" in part &&
        part.type === "output_text" &&
        "text" in part &&
        typeof part.text === "string"
      ) {
        return part.text;
      }
    }
  }

  return undefined;
}

function providerErrorFromStatus(
  status: number,
  payload: OpenAiErrorPayload,
): ConversationAnalysisResult {
  const providerCode = typeof payload.error?.code === "string" ? payload.error.code : "";
  const providerType = typeof payload.error?.type === "string" ? payload.error.type : "";

  if (status === 401 || status === 403) {
    return safeError("INVALID_CREDENTIALS", "Check the configured provider key and try again.");
  }

  if (
    providerCode === "insufficient_quota" ||
    providerCode === "billing_hard_limit_reached" ||
    providerType === "insufficient_quota"
  ) {
    return safeError(
      "INSUFFICIENT_CREDITS",
      "The provider account does not have enough available credits.",
    );
  }

  if (status === 429) {
    return safeError("RATE_LIMITED", "The provider is busy. Wait briefly, then try again.");
  }

  if (status === 413 || providerCode === "context_length_exceeded") {
    return safeError("REQUEST_TOO_LARGE", "The selected conversation image is too large.");
  }

  if (status === 404 || providerCode === "model_not_found") {
    return safeError("MODEL_UNAVAILABLE", "The selected analysis model is unavailable.");
  }

  if (status === 408 || status === 504) {
    return safeError("TIMEOUT", "The provider request timed out. Please try again.");
  }

  return safeError("PROVIDER_ERROR", "The conversation could not be analyzed. Please try again.");
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

export class OpenAiVisionAdapter implements ConversationImageAnalyzer {
  readonly configuration: ProviderConfiguration;
  readonly #apiKey: string | undefined;
  readonly #fetch: FetchImplementation;
  readonly #onDiagnostic: ((diagnostic: OpenAiAdapterDiagnostic) => void) | undefined;
  readonly #timeoutMs: number;

  constructor(options: OpenAiVisionAdapterOptions = {}) {
    this.#apiKey = options.apiKey?.trim() || undefined;
    this.#fetch = options.fetchImplementation ?? fetch;
    this.#onDiagnostic = options.onDiagnostic;
    this.#timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.configuration = {
      providerId: "openai",
      modelId: options.modelId?.trim() || DEFAULT_MODEL,
      configured: this.#apiKey !== undefined,
      capabilities: {
        textGeneration: true,
        vision: true,
        structuredOutput: true,
      },
    };
  }

  async analyzeConversationImage(
    request: ConversationImageRequest,
  ): Promise<ConversationAnalysisResult> {
    if (this.#apiKey === undefined) {
      return safeError(
        "NOT_CONFIGURED",
        "Configure an API key for the selected provider, then try again.",
      );
    }

    let response: Response;

    try {
      response = await this.#fetch(OPENAI_RESPONSES_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.#apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildOpenAiConversationRequest(request, this.configuration.modelId)),
        signal: AbortSignal.timeout(this.#timeoutMs),
      });
    } catch (error) {
      this.#onDiagnostic?.({ kind: "TRANSPORT_ERROR" });

      if (
        error instanceof Error &&
        (error.name === "AbortError" || error.name === "TimeoutError")
      ) {
        return safeError("TIMEOUT", "The provider request timed out. Please try again.");
      }

      return safeError(
        "PROVIDER_ERROR",
        "The conversation could not be analyzed. Please try again.",
      );
    }

    const payload = await readJson(response);

    if (!response.ok) {
      const errorPayload =
        typeof payload === "object" && payload !== null ? (payload as OpenAiErrorPayload) : {};
      const providerCode =
        typeof errorPayload.error?.code === "string" ? errorPayload.error.code : undefined;
      const providerType =
        typeof errorPayload.error?.type === "string" ? errorPayload.error.type : undefined;
      this.#onDiagnostic?.({
        kind: "HTTP_ERROR",
        status: response.status,
        ...(providerCode === undefined ? {} : { providerCode }),
        ...(providerType === undefined ? {} : { providerType }),
      });
      return providerErrorFromStatus(response.status, errorPayload);
    }

    if (typeof payload !== "object" || payload === null) {
      return safeError("INVALID_RESPONSE", "The provider returned an invalid analysis.");
    }

    const outputText = extractOutputText(payload as OpenAiResponsePayload);

    if (outputText === undefined) {
      return safeError("INVALID_RESPONSE", "The provider returned an incomplete analysis.");
    }

    let parsedJson: unknown;

    try {
      parsedJson = JSON.parse(outputText);
    } catch {
      return safeError("INVALID_RESPONSE", "The provider returned an invalid analysis.");
    }

    const analysis = ConversationAnalysisSchema.safeParse(parsedJson);

    if (!analysis.success) {
      return safeError("INVALID_RESPONSE", "The provider returned an invalid analysis.");
    }

    return {
      ok: true,
      analysis: analysis.data,
      provider: {
        providerId: this.configuration.providerId,
        modelId: this.configuration.modelId,
      },
    };
  }
}
