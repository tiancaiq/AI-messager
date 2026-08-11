# LLM providers and bring your own key

## Purpose and status

AI Message Coach should let users choose the AI provider they trust and want to pay for. Message Coach supplies the communication-intelligence layer; it must not depend for its product value or architecture on one hard-coded provider.

This document records future product and architecture direction only. Phase 0 contains no provider interface, adapter, SDK, credential storage, settings UI, or model call. Exact contracts should be added only when an approved milestone has concrete callers.

## Product model

```text
AI Message Coach
→ provider-neutral AI boundary
→ user-selected provider and model
→ user's API credential
→ usage billed directly by that provider
```

OpenAI, Anthropic, Google Gemini, other major providers, and later OpenAI-compatible or local inference endpoints are possible adapters, not assumptions embedded in core coaching logic.

User-facing provider settings should eventually make clear:

- which provider and model are selected;
- which relevant capabilities the model advertises;
- whether screenshot understanding is supported;
- whether the credential is configured, without redisplaying a stored key;
- that usage charges come from the selected provider, not Message Coach.

## Provider-neutral core and isolated adapters

Context analysis, response planning, skill selection, memory extraction, and evaluation must consume internal contracts. They must not import a provider SDK or branch on provider names to decide product behavior.

A future abstraction may resemble:

```ts
interface LlmProvider {
  id: string;
  listModels(): Promise<ModelInfo[]>;
  analyzeImage?(request: ImageAnalysisRequest): Promise<ImageAnalysisResult>;
  generate(request: GenerationRequest): Promise<GenerationResult>;
  stream?(request: GenerationRequest): AsyncIterable<GenerationChunk>;
}
```

This shape is illustrative, not a contract to implement now. Implementation experience may favor task-specific ports, a smaller request executor, or a different streaming boundary. The invariant is that core logic targets provider-neutral interfaces and provider-specific SDKs, request formats, authentication, and response handling stay inside adapters.

The conceptual ownership is:

```text
packages/ai/
├── provider-neutral policy, task contracts, and validation
└── isolated provider adapters
    ├── first supported provider
    ├── second supported provider
    └── later compatible/local endpoints
```

Folders and adapter packages should be created only when they have real callers. No empty provider directories are required to preserve this boundary.

## Capability-based model support

Runtime eligibility must depend on declared capabilities, not provider identity. A future model descriptor may include:

```ts
type ModelCapabilities = {
  textGeneration: boolean;
  vision: boolean;
  structuredOutput: boolean;
  streaming: boolean;
  toolCalling: boolean;
  embeddings: boolean;
};
```

The exact schema may evolve. Task requirements are the stable idea:

- screenshot understanding requires vision and text generation;
- response generation requires text generation;
- embeddings require an embeddings capability;
- streaming UI requires streaming support;
- structured tasks require either native structured output or an adapter strategy that still produces a validated internal schema.

If the selected model lacks a required capability, the application should stop before sending the request and present a provider-neutral explanation such as “The selected model does not support screenshot analysis.” It must not silently attempt unsupported behavior.

The first implementation may use one selected provider/model for every task it supports. Later configuration may choose separate vision, text, embedding, or evaluation models, but complex multi-model routing should wait for measured need.

## Structured output and errors

Conversation extraction, relationship and intent hypotheses, confidence dimensions, skill selection, memory candidates, and agent actions remain provider-neutral Zod-backed contracts. An API call succeeding does not make its output trusted.

Each adapter is responsible for:

1. converting internal requests to its provider's API format;
2. using native schema features where useful without leaking them into core contracts;
3. converting the response into the internal result shape;
4. validating that result before returning it to core logic;
5. applying only bounded, documented repair behavior;
6. mapping provider failures to safe internal errors.

The future error vocabulary should cover at least:

```text
INVALID_CREDENTIALS
RATE_LIMITED
INSUFFICIENT_PROVIDER_CREDITS
MODEL_UNAVAILABLE
MODEL_DOES_NOT_SUPPORT_VISION
REQUEST_TOO_LARGE
PROVIDER_TIMEOUT
PROVIDER_ERROR
```

Exact error schemas belong in `packages/contracts` only when a producer and consumer exist. Raw provider responses, stack traces, credentials, and sensitive request content must not reach the renderer or logs.

## BYOK credential boundary

The user owns the credential. Future desktop credential flow should be:

```text
React settings UI
→ narrow, validated preload IPC
→ Electron main process
→ OS-protected credential storage where practical
→ selected provider adapter at request time
```

The renderer may submit a newly entered key through a narrowly scoped write operation, but it must not be able to read a stored key back. Safe renderer-visible state includes provider/model identifiers, capability metadata, and `configured: true | false`.

Never commit, hard-code, log, analyze, or place keys in plaintext application configuration. Exclude them from analytics, crash reports, error details, screenshots, backups, and test fixtures. Credential deletion, replacement, and connection testing need explicit future UX and failure handling.

## Sensitive-request topology

For screenshot and conversation analysis, the preferred long-term topology is:

```text
user device
→ trusted Electron process
→ user-selected provider
```

This avoids sending private conversation content through Message Coach-operated infrastructure when no product requirement justifies that extra trust boundary. The existing Fastify service may support health, coordination, updates, or other future functions; its existence does not require it to proxy provider requests.

A server-mediated provider path remains possible if later technical requirements justify it. Before choosing it, the milestone plan must document why direct communication is insufficient, what sensitive content and credential material cross the server, retention and logging controls, authentication, deployment boundaries, and how the user is informed. The decision should remain reversible until tested requirements make one topology necessary.

Direct provider communication does not eliminate third-party disclosure: the selected provider receives the minimized request. Provider retention, data-use terms, regional routing, capability claims, pricing, and account status must be presented and verified appropriately.

## Provider-independent skills, memory, and language

Skills describe communication behavior and operate on internal contracts. They must not claim compatibility with only a named provider/model. Model-assisted reranking, memory extraction, and the Skill Factory must call provider-neutral task interfaces.

Provider choice does not expand the validated skill-language policy:

- English may use universal and English-specific skills.
- Simplified and Traditional Chinese may use universal and Chinese-specific skills.
- Mixed English/Chinese may use both supported families where relevant.
- Other languages use universal skills only.

A model supporting another language does not mean Message Coach has validated language-specific communication skills for it.

## Incremental roadmap direction

Provider work should progress through separately approved milestones:

```text
provider-neutral contracts and capability requirements at real call sites
→ first vision-capable provider adapter with capability checks
→ minimal BYOK provider/model settings
→ second major provider adapter
→ third major provider adapter
→ optional compatible/local endpoints
```

Capability description should begin with the first adapter because unsupported tasks must fail safely. The first user experience can still expose one provider/model selection and avoid premature per-task routing. Additional adapters should share conformance tests so provider growth does not fork product behavior.
