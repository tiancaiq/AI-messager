# Architecture

## Purpose and constraints

AI Message Coach must answer one MVP question: can it look at the conversation currently visible on a user's screen and help them say the right thing without first making them explain everything?

The architecture optimizes for that proof, sensitive-data minimization, and clear future seams. It does not optimize yet for many services, thousands of skills, durable personal memory, or multiple client platforms.

Key constraints:

- Windows desktop is first; iOS is a future client.
- An explicitly triggered conversation-capture capability is the universal context interface; screen capture is an internal implementation detail.
- The Generate button is the primary user-facing trigger. Shortcuts and future quick actions are optional callers of the same capability.
- The MVP uses a small number of model calls: normally one, at most a second after necessary clarification.
- Users bring credentials for a supported provider and pay that provider directly; provider costs are not bundled with Message Coach.
- Core coaching logic is provider-neutral. Model eligibility is determined by capabilities, not provider names.
- Direct encrypted communication from the trusted desktop process to the selected provider is preferred when practical so private conversations do not unnecessarily cross application-operated infrastructure.
- Raw screenshots are ephemeral by default.
- Model output is untrusted until it passes a shared runtime schema.
- The user remains in control; the system never sends a message.

## Logical engines, not microservices

The long-term system has five logical engines:

1. **Context Engine** — extracts visible conversation observations. Phase 2 stops at messages/order/ownership, draft, visible contact signals, language, warnings, and extraction confidence; later inference work requires its own approved scope.
2. **Memory Engine** — retrieves relevant trusted history, assesses freshness, and proposes evidence-backed memory candidates.
3. **Skill Engine** — Phase 4 deterministically filters, ranks, and composes a small approved communication-skill registry; large-catalog retrieval/reranking remains future work.
4. **Response Engine** — chooses an agent action, creates a communication plan, and produces replies or action choices.
5. **Skill Factory** — an offline, governed workflow for proposing and evaluating skills.

For the MVP these are modules, not separate deployments and not separate autonomous agents. The desktop client and a selected model provider form the potential coaching path. The Fastify service remains available for HTTP functionality but is not required to proxy every provider request.

## Runtime boundaries

### Desktop application

`apps/desktop` contains three security boundaries:

- **Electron main process:** the reusable conversation-capture capability, window hide/show behavior, screen-capture permission and acquisition, trusted Phase 2/3 provider request execution, coaching orchestration, optional future shortcut registration, explicit clipboard writes, and future OS-protected credential access.
- **Preload bridge:** narrow, typed capture, provider-status, analysis, coaching, and clipboard methods. Context isolation stays enabled; the renderer gets no general Node.js access, channel selection, provider request shape, or credential value.
- **React renderer:** the primary Generate control, crop setup/correction, progress/error/retry states, safe provider/model status, extraction-verification details, action/clarification/no-reply flows, generated results, and explicit Copy.

The desktop determines and crops the relevant region locally and sends only that crop beyond the device. Phase 1 passes the full capture through the trusted main → sandboxed preload/renderer IPC path solely so the user can select it locally. Phase 2 sends the selected crop through one fixed preload method to trusted main and directly over TLS to OpenAI; it does not route the image through `apps/api`. The desktop owns ephemeral image memory and releases it after success, cancellation, recapture, reload, or unmount, retaining a crop only for an explicit retry in the active UI session. Product prompts and provider-neutral orchestration remain in `packages/ai`; Electron main is only the trusted composition root.

### Conversation-capture capability

Capture must be modeled as one reusable application capability, conceptually similar to:

```ts
requestConversationCapture();
```

The exact contract should be defined only when a capture milestone has concrete producers and consumers. Its architectural role is already fixed:

```text
Generate button ─┐
Global shortcut ─┼─→ Conversation capture workflow
Future quick UI ─┘
```

The workflow owns hide-before-capture, permission handling, capture acquisition, local region selection, restoration of the coach window, cancellation, and buffer disposal. UI triggers request the workflow; they do not implement their own capture logic. Generate is the primary product flow, while the shortcut is an optional convenience.

Capture should evolve incrementally:

1. Generate hides the coach, captures the relevant display, restores the coach, and lets the user select a conversation region.
2. A later version may remember a user-confirmed region and apply it on subsequent Generate actions, with controls to change or reset it.
3. Later evidence may justify active-window awareness, window/display bounds, or visual conversation-region detection.
4. The common-case target is Generate → automatic context capture → understanding → response, with manual crop retained as setup, fallback, and correction.

Persisting bounded region metadata such as `x`, `y`, `width`, and `height` may be acceptable in a separately approved milestone. It is not permission to retain screenshot pixels, conversation text, drafts, or inferred identity, and it must not be implemented before there is a validated caller and reset policy.

### Implemented Phase 1 capture lifecycle

The Phase 1 implementation keeps capture behind `requestConversationCapture()` in Electron main. Generate invokes one fixed preload method; the renderer cannot choose an IPC channel or pass native arguments. Main validates the owned `BrowserWindow` and its main frame, rejects overlapping requests, records the display containing the coach window, hides every visible coach window, waits one encapsulated 100 ms compositor-settle interval, captures that screen source, and restores/focuses the prior UI in `finally` on both success and failure.

The capture target baseline is one display, selected from the coach window bounds before hiding. Its DIP size and Electron `scaleFactor` request a native-sized thumbnail. `DesktopCapturerSource.display_id` must match `Display.id`; the only fallback is an unambiguous single source. The actual returned `NativeImage` dimensions are authoritative because Electron does not guarantee the requested thumbnail size. Ambiguous multi-display mapping fails safely instead of guessing.

Main converts the `NativeImage` to PNG bytes in memory. Strict Zod schemas validate the result in main and again in preload. The renderer copies the bytes into a `Blob`, zeroes that temporary copy, and uses a revocable `blob:` URL. Pointer coordinates are measured against the screenshot's actual rendered content box, normalized in every drag direction, clamped to its bounds, and converted by the intrinsic-pixel/rendered-CSS ratio. The ratio already incorporates display scaling; `window.devicePixelRatio` is deliberately not multiplied again. Near crop edges are floored, far edges are ceiled, and selections below eight CSS pixels on either dimension remain in selection mode.

Canvas produces the crop locally. Completing a crop releases the full-capture URL. In Phase 2, Continue reuses that exact crop for analysis rather than capturing again. Success, Retake, Cancel, Escape, reload, and unmount release remaining URLs/references; a normalized provider failure retains only the crop preview for explicit retry. No capture file, screenshot history, application-API request, or persisted region exists.

### API service

`apps/api` is the Fastify composition root. It owns:

- transport limits and request validation for routes that have a justified server-side role;
- request-scoped server orchestration where required;
- health and future non-provider application services;
- optional invocation of AI, skill, and memory interfaces only when an approved topology calls for server mediation;
- response serialization;
- privacy-safe metrics, request identifiers, and errors.

The API does not automatically own BYOK credentials or proxy screenshots to providers. A server-mediated model path requires an explicit technical need and privacy review covering credential flow, content retention, logging, authentication, and deployment boundaries. Route handlers should be thin. They must not embed prompts, duplicate contract types, or log sensitive payloads.

### Shared contracts

`packages/contracts` owns versioned, provider-neutral Zod schemas for IPC, HTTP, AI tasks and structured output, skills, future model metadata, normalized provider errors, and future memory records. TypeScript types are inferred from schemas so runtime and compile-time contracts cannot drift.

Phase 0 establishes:

- immutable desktop app metadata and the `/health` response;
- the `AgentAction` vocabulary and independent confidence dimensions;
- a shallow observed conversation and draft shape;
- a shallow coach result envelope without generation payloads or policy;
- error codes safe to show to users;
- the reviewed skill-definition metadata shape.

Phase 1 adds strict capture bounds/display metadata, in-memory PNG bytes, safe capture errors, a discriminated capture result, and the one allowlisted IPC channel. It does not add AI task or provider contracts.

Phase 2 adds the bounded PNG analysis request, safe provider/model/capability metadata, observation-only conversation analysis, normalized provider errors/results, and fixed provider-status/analysis IPC channels. Strict schemas reject relationship, situation, intent, skill, action, and reply fields.

Phase 3 adds strict coaching request/selection/result, action-specific payload, coaching error, clipboard, and IPC contracts. Its internal `CoachingDecision` remains a discriminated union, while provider-facing generation uses action-specific strict root-object schemas containing wording only. Phase 4 adds strict atomic skill definitions, a bounded normalized `SkillContext`, selected skill references/reasons, and a `CommunicationPlan` whose status distinguishes `SELECTED`, legitimate `NONE`, and request-scoped `FAILED`. The plan contains at most four selected references and bounded principles/avoidances. Future memory records remain absent until an approved milestone has a producer and consumer.

Do not expose chain-of-thought. Evidence should be concise, observable references such as “draft contains an apology” or message indices, not hidden reasoning transcripts.

### AI logic

`packages/ai` owns provider-neutral conversation analysis and coaching orchestration. Its current responsibilities are:

- provider-neutral task interfaces and model capability descriptors;
- an observation-only multimodal prompt;
- one bounded, strict structured extraction call;
- validation and safe failure for invalid/refused/incomplete model output;
- normalized provider failure handling;
- deterministic Phase 3 draft-aware action policy;
- deterministic Phase 4 skill-context derivation after the action is fixed;
- provider-neutral wording generation with compact composed skill guidance;
- isolated OpenAI vision and coaching adapters.

Phase 2 remains observation-only. Phase 3 chooses the action; Phase 4 chooses communication expertise for actions that need wording. The skill engine never changes the action, and relationship/identity/memory remain absent.

Core Context, Memory, Skill, and Response logic must not import provider SDKs or branch on provider name for product behavior. The Phase 2 task-specific port is `ConversationImageAnalyzer`; `OpenAiVisionAdapter` alone translates the request, authenticates, calls the Responses API with native `fetch`, extracts output, and validates it against shared schemas. No general unused provider interface or SDK was added.

Each model eventually advertises capabilities such as text generation, vision, structured output, streaming, tool calling, and embeddings. Task code declares requirements. Screenshot understanding, for example, requires vision and text generation; an incompatible model should produce a normalized unsupported-capability result before any request is sent. A provider's name is never a substitute for capability checking.

The initial experience may use one selected provider/model for every task it supports. Later evidence may justify separate vision, text, embedding, or evaluation models. Do not build complex multi-model configuration preemptively.

Business policy should be testable without a live model. For example, choosing action choices over clarification can be a deterministic decision over validated analysis rather than prompt prose alone. See `docs/llm-providers.md` for BYOK, adapter, capability, error, and topology requirements.

### BYOK credential and settings boundary

Users supply credentials for their selected provider and pay that provider's usage charges directly. Phase 2 exposes only safe provider/model/configured/capability status and a billing notice. Full settings should later add selection, connection testing, replacement, and deletion.

New credentials may pass from a settings form through a narrow validated preload write operation to Electron main, then into OS-protected credential storage where practical. Stored keys must never be readable by the React renderer. Renderer-visible state is limited to safe metadata such as provider/model identifiers, capabilities, and `configured: true | false`.

Credentials must not be committed, hard-coded, logged, included in analytics/crash reports, or attached to provider-neutral error details. Current development loads an ignored `.env.local` key into Electron main only; this is not production credential storage. OS-protected storage, deletion, replacement, and connection testing remain a separately approved production milestone.

### Skill library

Phase 4 makes `packages/skills` a first-class runtime package. It owns 21 manually approved, source-controlled atomic definitions; registry/referential validation; deterministic active/language/action/situation/intent eligibility; stable bounded ranking; bidirectional conflict checks; compact composition; and selection metrics. `packages/contracts` remains the Zod-first schema owner, while `packages/ai` derives the request-scoped context and consumes the resulting provider-neutral plan.

The engine selects zero to four skills. English can use universal + `en`; Chinese can use universal + `zh`; mixed English/Chinese may use both supported families; other languages use universal only. `SUGGEST_ACTIONS`, `ASK_CLARIFICATION`, and `NO_REPLY_NEEDED` return no skill plan. A user action selection re-enters Phase 3 first, then skills may guide the resulting reply.

Only selected `principles` and `avoid` guidance crosses into the provider request. Full definitions, selection reasons, and skill IDs stay out of the prompt. Registry validation defects fail explicitly; a request-scoped selection failure is marked `FAILED` and can fall back to generic Phase 3 generation. No provider SDK or OpenAI-specific content appears in the skill package. See `docs/skills.md`.

## Implemented monorepo

```text
apps/
├── desktop/
│   └── src/
│       ├── main/             # Electron lifecycle and secure BrowserWindow
│       │   ├── conversation-capture.ts # reusable capture service
│       │   └── capture-lifecycle.ts    # hide/capture/restore single flight
│       ├── preload/          # metadata + one typed capture command
│       └── renderer/         # Generate, local crop, preview, ready/error UI
└── api/
    └── src/
        ├── app.ts            # testable Fastify construction and health route
        └── server.ts         # loopback listening and lifecycle
packages/
├── contracts/src/            # Zod schemas + inferred types
├── ai/src/                   # provider-neutral analysis, action policy, skill context, generation
├── skills/src/               # approved registry, deterministic selection/composition/evaluation
└── test-fixtures/src/        # synthetic cross-package fixtures
```

Tests that concern one package stay next to that package. Root `tests/` is reserved for future cross-boundary and end-to-end tests with concrete callers.

The implemented Phase 4 dependency direction is:

```text
apps/desktop → packages/ai → packages/skills → packages/contracts
packages/ai → packages/contracts
apps/desktop → packages/contracts
apps/api     → packages/contracts
packages/skills → packages/contracts
packages/test-fixtures → packages/contracts
```

Trusted Electron main composes the AI task for the approved direct-provider topology. The React renderer imports only shared types and must not import provider adapters, SDKs, prompts, Fastify, or the skill registry. The credential is injected into the adapter; `packages/ai` imports neither Electron nor Fastify. `packages/ai` calls the narrow `CommunicationSkillPlanner` boundary backed by `packages/skills`; it does not absorb registry ownership. Future memory must enter through a similarly narrow approved interface, not an application composition root or storage adapter.

## Phase 0 toolchain and build

- Node.js 24 LTS and pnpm 11 are declared and the exact package manager is pinned.
- Shared packages and the API compile as ESM. Electron main and preload are bundled as CommonJS with Electron and Node built-ins externalized; the renderer is an ESM Vite build.
- The renderer build uses a relative asset base so the production `file://` entrypoint loads its bundled JavaScript and CSS.
- The Electron window enables `contextIsolation` and sandboxing, disables renderer Node integration, denies new windows and navigation, and loads no remote content in production.
- ESLint, Prettier, strict TypeScript, and Vitest are root-owned tools with canonical commands.
- Package builds clean their own `dist` directories and exclude test modules from production artifacts.
- pnpm permits install scripts only for the explicitly allowlisted Electron and esbuild dependencies and applies a 24-hour package-release maturity gate.

## Phase 2 request flow

```mermaid
sequenceDiagram
    actor User
    participant Desktop
    participant Capture as Conversation Capture
    participant AI as Provider-neutral AI
    participant Provider as OpenAI adapter/API

    User->>Desktop: Click Generate
    Desktop->>Capture: Request conversation context
    Capture->>Desktop: Hide coach
    Capture->>Capture: Capture relevant display context
    Capture->>Desktop: Restore coach
    opt First use, fallback, or correction
        User->>Capture: Select or adjust conversation region
    end
    Capture->>AI: Selected crop + observation task
    AI->>AI: Validate bounds and capabilities
    AI->>Provider: One store:false image + strict schema request
    Provider-->>AI: Provider-specific structured response
    AI->>AI: Normalize and validate shared schema
    AI-->>Desktop: Visible observations + confidence/warnings
    Capture->>Capture: Release crop bytes
    Desktop-->>User: Show extraction-verification result
```

An optional shortcut follows the same sequence by requesting the same capture capability; it is not the primary flow and does not own a separate pipeline.

Phase 2 selects the direct path: renderer → authorized preload/main IPC → provider-neutral task → isolated OpenAI adapter. `apps/api` receives neither crop nor credential. A future server path must justify the additional trust boundary; the desktop path preserves adapter isolation, trusted key access, request bounds, output validation, and safe errors.

The Phase 2 path makes one understanding call and no repair, coaching, skill, or response call. Invalid, refused, or incomplete output becomes a recoverable error. Phase 3 consumes the validated observation contract without re-extracting the screenshot. A deterministic draft-aware policy fixes one `AgentAction`; local choice, clarification, and no-reply decisions need no wording call. For rewrite/complete/reply actions, Phase 4 derives a bounded skill context from already visible evidence, deterministically selects zero to four skills, and supplies only the composed principles/avoidances to the provider-neutral text-generation call through an isolated OpenAI adapter. The adapter asks for an action-specific root-object wording payload, reattaches the policy-owned action, intent, confidence, and ambiguity locally, then validates the complete internal decision. A user choice can require one follow-up wording call using the same in-memory context after its explicit intent is selected; a retry after failure preserves and reuses that exact selection instead of returning to pre-choice policy.

Phase 3 adds fixed authorized coaching and clipboard IPC methods. The sandboxed renderer sends strict `ConversationAnalysis` plus at most one bounded selection; Electron main retains credentials, prevents overlapping coaching calls, validates every provider result, and writes clipboard text only after an explicit user action. No screenshot, conversation, generated message, or key enters `apps/api`, logs, or persistent storage.

## Phase 4 skill-guided coaching flow

```mermaid
flowchart TD
    A["Validated Phase 2 ConversationAnalysis"] --> B["Phase 3 deterministic AgentAction"]
    B -->|"SUGGEST_ACTIONS / ASK_CLARIFICATION / NO_REPLY_NEEDED"| C["Local Phase 3 result; no skills"]
    B -->|"REWRITE_DRAFT / COMPLETE_DRAFT / SUGGEST_REPLY"| D["Deterministic SkillContext"]
    D --> E["ACTIVE + language + action + situation + intent filters"]
    E --> F["Stable score/order + conflict filtering"]
    F --> G["0–4 selected skill references"]
    G --> H["Bounded principles + avoid CommunicationPlan"]
    H --> I["Provider action-specific root-object wording schema"]
    I --> J["Locally reattach policy action, intent, confidence, ambiguity"]
    J --> K["Validate complete internal CoachingDecision"]
```

`SkillContext` uses the fixed action, visible messages/draft, selected intent, normalized situation/intent tags, language/code-switching, and material ambiguity. It contains no relationship, identity, avatar, contact history, temporal history, or memory input. Selection and composition are deterministic and in-memory; selected skills are not written as user history. Development inspection may expose only structured IDs, versions, and concise reasons, never hidden reasoning or conversation content.

## Core domain shape

The action vocabulary below is implemented. The broader confidence shape illustrates later domains and does not authorize relationship, identity, or memory work in Phase 4.

```ts
type AgentAction =
  | "REWRITE_DRAFT"
  | "COMPLETE_DRAFT"
  | "SUGGEST_REPLY"
  | "SUGGEST_ACTIONS"
  | "ASK_CLARIFICATION"
  | "NO_REPLY_NEEDED";

type ConfidenceDimension =
  | "identity"
  | "relationship"
  | "situation"
  | "userIntent"
  | "otherIntent"
  | "language"
  | "skillSelection";

interface Hypothesis<T> {
  value: T;
  confidence: number; // 0..1, calibrated per dimension
  evidence: string[]; // concise references to visible observations
}
```

The system keeps these layers separate:

1. **Extracted observations (Phase 2):** visible text, message grouping/order, draft, names, UI cues, language, speaker assignment, warnings, and extraction confidence.
2. **Inferred/normalized for current approved behavior:** Phase 3 user intent/action uncertainty plus Phase 4 deterministic situation/intent tags derived from current visible evidence. Identity, memory, and any relationship hypothesis remain later approved work.
3. **Decided:** explicit Phase 3 action, then selected skill references/communication plan where wording is needed, followed by reply choices or clarification.

That separation prevents an inference such as “likely manager” from being stored or presented as an observed fact.

## Confidence policy

There is no single overall confidence that replaces dimension scores. A high-confidence professional category can safely affect tone even when the exact role (“manager”) is uncertain. A low identity score does not prevent using high-confidence situation and language evidence.

Thresholds are policy configuration to calibrate with evaluations, not universal facts. Initial implementation should:

- require very high identity confidence before retrieving contact-specific memory;
- use broad relationship categories when they are materially more certain than specific roles;
- prefer current captured-context evidence over conflicting historical data;
- generate when the intended communication outcome is clear;
- present two to four bounded actions when the situation is clear but the user's goal is not;
- ask one question only when confidence is low and plausible interpretations lead to materially different or harmful responses.

See `docs/product-behavior.md` for the decision policy.

## Failure and fallback behavior

- **Capture denied or unavailable:** explain how to grant permission or retry; do not silently capture a different source.
- **No usable conversation region:** let the user recrop; do not submit the full screen automatically.
- **Ambiguous display/source mapping:** stop with a recoverable error; do not capture a guessed monitor.
- **Network/provider failure:** retain the crop only long enough for an explicit retry in the current UI session, then release it.
- **Invalid credentials, insufficient provider credits, rate limits, unavailable models, timeouts, or unsupported capabilities:** map the provider-specific failure to a safe internal error with a useful provider-neutral user message.
- **Model lacks vision:** stop before transmission and explain that the selected model cannot analyze screenshots.
- **Invalid structured model output:** Phase 2 returns a retryable error without a repair call; never pass malformed data to the UI.
- **No applicable communication skill:** use generic Phase 3 generation with a `NONE` plan; do not force irrelevant guidance.
- **Request-scoped skill selection failure:** preserve the Phase 3 action, mark the plan `FAILED`, and use generic Phase 3 generation; registry validation defects remain explicit startup/test failures.
- **Unsupported/uncertain language:** use universal skills and preserve the visible language when possible.
- **Ambiguous speaker ownership:** avoid claims tied to identity and choose actions or one clarification if the difference is material.
- **Unsafe or impossible request:** return a safe alternative without leaking provider internals.

## Deferred architecture

The following have intentional seams but no MVP implementation:

- PostgreSQL-backed memory repositories;
- semantic/hybrid retrieval, reranking, and pgvector for a large skill catalog;
- local avatar/identity matching;
- durable encrypted user/contact/interaction memory;
- offline Skill Factory services and review tooling;
- iOS, Share Extension, and custom keyboard clients;
- application-specific messaging integrations;
- remembered capture-region metadata, active-window awareness, and automatic conversation-region detection until separately approved;
- production BYOK settings, secure credential storage, additional provider adapters, multi-provider routing, and custom/local endpoints until separately approved;
- insertion automation and automatic sending (automatic sending remains prohibited).

Adding a seam means defining a small interface at the point of use—not building unused adapters, services, or deployment infrastructure.
