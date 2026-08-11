# AI Message Coach

AI Message Coach is a desktop-first assistant that reads the conversation visible on a user's screen and helps them say the right thing with minimal explanation. It is not merely a text rewriter: it considers the conversation, the current draft, likely relationship and situation, language, and communication goals before proposing a response.

The governing behavior is:

> **Infer first → generate when confident → offer choices when uncertain → ask only when necessary.**

The first product target is a Windows desktop application built with Electron, React, TypeScript, and Vite, with a provider-neutral AI layer, shared Zod contracts, and a Fastify service for HTTP functionality that genuinely requires a backend. No application-specific messaging integration is required for the MVP; an explicitly triggered, application-owned conversation-capture capability provides the universal context input. The product never sends messages automatically.

## Current status

Phase 0 is complete, and the Phase 1 Generate-triggered capture foundation is implemented. The desktop now has a reusable hide/capture/restore capability, a narrow validated preload bridge, local four-direction crop selection, preview, Retake/Cancel/Escape/Continue flows, and in-memory image disposal. There is still no LLM provider integration, screenshot understanding, OCR, coaching policy, skill retrieval, memory, identity recognition, storage, or iOS code.

Phase 1 is complete. Automated checks, synthetic UI checks, and the real Electron capture/exclusion/restoration workflow pass on the current macOS host at 2× display scale. Controlled Windows DPI and multi-monitor verification remains a documented target-platform follow-up before Windows release signoff.

## Documentation

- [Architecture](docs/architecture.md): boundaries, request flow, contracts, and proposed monorepo.
- [Product behavior](docs/product-behavior.md): action policy, confidence rules, and UX behavior.
- [Skills](docs/skills.md): modular skills, retrieval, composition, and the future Skill Factory.
- [Memory](docs/memory.md): memory categories, evidence lifecycle, identity, and temporal decay.
- [Privacy](docs/privacy.md): sensitive-data lifecycle, logging, trust boundaries, and safeguards.
- [LLM providers and BYOK](docs/llm-providers.md): provider abstraction, capabilities, credentials, topology, and future settings.
- [Roadmap](docs/roadmap.md): strict milestones and acceptance criteria.
- [Execution plans](.agent/PLANS.md): how Codex should plan and report milestone work.
- [Phase 0 plan](.agent/plans/phase-0.md): implementation decisions, acceptance evidence, and completion record.
- [Phase 1 plan](.agent/plans/phase-1.md): capture decisions, progress, validation evidence, and remaining native gates.

## Repository layout

```text
ai-message-coach/
├── apps/
│   ├── desktop/              # Electron main/preload + React/Vite renderer
│   └── api/                  # Fastify app, server entrypoint, health test
├── packages/
│   ├── contracts/            # Zod schemas and inferred shared types
│   ├── ai/                   # intentionally empty Phase 0 boundary
│   ├── skills/               # shared-schema validation boundary only
│   └── test-fixtures/        # synthetic cross-package fixtures
├── scripts/                  # dependency-free workspace build helpers
├── docs/                     # product and architecture documentation
├── .agent/                   # milestone planning conventions and plans
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

Tests stay beside the package or application boundary they exercise. Root-level `tests/` directories will be added only when a later milestone has a genuine cross-boundary or end-to-end caller.

## Requirements

- Node.js 24 LTS (`.nvmrc` is provided)
- Corepack with pnpm 11.21.0, as pinned in `package.json`

Install from the committed lockfile:

```sh
corepack enable
pnpm install --frozen-lockfile
```

No API key or external service is required in Phase 0 or Phase 1. `.env.example` documents the optional loopback API host and port variables; the process environment is read directly.

## Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Build shared packages, then run API and desktop development processes |
| `pnpm dev:desktop` | Build shared packages and launch the Electron/Vite desktop shell |
| `pnpm dev:api` | Build shared packages and run the Fastify API in watch mode |
| `pnpm format` | Format workspace source and configuration files |
| `pnpm format:check` | Verify formatting without edits |
| `pnpm lint` | Run ESLint with zero warnings allowed |
| `pnpm typecheck` | Typecheck every workspace package |
| `pnpm test` | Run deterministic Vitest tests |
| `pnpm build` | Produce clean production artifacts for every workspace package |

The production API can be started after a build with:

```sh
pnpm --filter @ai-message-coach/api start
```

`GET http://127.0.0.1:3000/health` returns:

```json
{
  "status": "ok"
}
```

## Implemented architecture

- `apps/desktop` imports only shared contracts. Its renderer has no Node.js access; the preload exposes immutable validated app metadata through `contextBridge`; the window enables context isolation and sandboxing and disables renderer Node integration.
- `apps/api` imports shared contracts and keeps construction separate from listening so the health route can be tested with Fastify injection.
- `packages/contracts` defines Zod schemas first and infers TypeScript types from them.
- `packages/skills` validates a definition through the shared schema but contains no runtime catalog or retrieval engine.
- `packages/ai` is a real buildable package boundary with no invented interface or model dependency yet.
- `packages/test-fixtures` contains synthetic examples only. No real conversations or credentials belong in the repository.
- Phase 1 adds a main-process single-flight capture service, one allowlisted IPC command, shared strict capture-result schemas, pure crop geometry/state logic, and a browser-only selection/preview renderer. Captures are never written to disk or sent to the API.

PostgreSQL, pgvector, provider SDKs/adapters, durable memory, iOS, the Skill Factory runtime, and messaging-platform integrations remain intentionally absent.

## Future LLM provider model

AI Message Coach will use a bring-your-own-key model: the user selects a supported provider and model, supplies that provider's credential, and pays the provider directly for usage. Core coaching logic will depend on provider-neutral contracts, while OpenAI, Anthropic, Gemini, and later integrations remain isolated behind adapters.

Model eligibility is capability-based. For example, screenshot understanding requires vision plus text generation; the UI must explain when a selected model cannot perform a task rather than silently trying it. The initial integration may keep one provider/model selection simple, while later versions may allow different models for vision, text, embeddings, or evaluation.

Credentials will eventually be held behind the trusted Electron main/preload boundary using OS-protected storage where practical. The renderer should receive only safe state such as “provider configured,” never a stored key. Because conversations are sensitive, direct encrypted communication from the trusted desktop process to the selected provider is preferred when practical; the Fastify service does not automatically proxy every AI request. See [LLM providers and BYOK](docs/llm-providers.md).

## MVP user flow

1. The user views a conversation in another application and clicks **Generate** in AI Message Coach.
2. The desktop client calls its reusable conversation-capture capability, temporarily hides itself, captures the relevant display context, and restores itself.
3. During early implementations or when automatic selection is wrong, the user selects, adjusts, or resets the conversation region locally.
4. The provider-neutral coaching runtime temporarily analyzes only the selected context for visible messages, ownership/order, the current compose-box draft, language, relationship, situation, and intent through a capable user-selected model.
5. A small approved skill set is selected.
6. The coach rewrites or completes the draft, suggests replies/actions, asks at most one necessary question, or says that no reply is needed.
7. The user reviews and copies the result. Captured image data is discarded.

The Generate button is the primary product trigger. A global shortcut or future quick action may invoke the same capture capability as an optional convenience; it must not create a parallel capture workflow. Manual screenshot selection is an initial setup mechanism, fallback, and correction tool rather than the intended long-term center of the experience.

Phase 1 implements steps 1–3 and stops at the local `Capture ready for analysis.` placeholder. The provider-neutral analysis and coaching steps begin only in the separately approved Phase 2. See [the roadmap](docs/roadmap.md); each milestone is deliberately narrow.
