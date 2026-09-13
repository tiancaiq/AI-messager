# AI Message Coach

AI Message Coach is a desktop-first assistant that reads the conversation visible on a user's screen and helps them say the right thing with minimal explanation. It is not merely a text rewriter: it considers the visible conversation, the current draft, language, and communication goal before proposing a response.

The governing behavior is:

> **Infer first → generate when confident → offer choices when uncertain → ask only when necessary.**

The first product target is a Windows desktop application built with Electron, React, TypeScript, and Vite, with a provider-neutral AI layer, shared Zod contracts, and a Fastify service for HTTP functionality that genuinely requires a backend. No application-specific messaging integration is required for the MVP; an explicitly triggered, application-owned conversation-capture capability provides the universal context input. The product never sends messages automatically.

## Current status

Phase 0 and Phase 1 are complete. Phase 2 and Phase 3 are **implemented — representative live quality evaluation pending**. Authenticated OpenAI access and one production screenshot-analysis path succeeded through the user's existing local proxy. Phase 3 is committed at `a67a36ff3202a2ee1c790b9da8ad66f2f47f624e`: validated Phase 2 observations enter a draft-aware deterministic action gate and provider-neutral basic message generator. It can rewrite or complete a draft, suggest replies or action choices, ask one material clarification, say no reply is needed, and explicitly copy generated text.

Phase 4 is implemented locally and intentionally uncommitted while it is finalized. It adds a deterministic Communication Skill Engine after the Phase 3 action gate: 21 manually approved, source-controlled atomic skills are filtered by active status, action, normalized situation/intent tags, and universal/English/Chinese language eligibility; zero to four non-conflicting skills become compact provider-neutral principles and avoidances for generation. Skills can change how an already selected action is worded, never the action or the user's intent. A live coaching attempt exposed and prompted fixes for an OpenAI-incompatible root-union response schema and a retry path that discarded the user's selection. Deterministic verification passes; post-fix live final-reply generation and human-reviewed generic-versus-skill-guided quality evaluation remain pending. The local proxy must be configured and running for this host to reach OpenAI.

Phase 1 is complete. Automated checks, synthetic UI checks, and the real Electron capture/exclusion/restoration workflow pass on the current macOS host at 2× display scale. Controlled Windows DPI and multi-monitor verification remains a documented target-platform follow-up before Windows release signoff.

## Documentation

- [Architecture](docs/architecture.md): boundaries, request flow, contracts, and proposed monorepo.
- [Product behavior](docs/product-behavior.md): action policy, confidence rules, and UX behavior.
- [Skills](docs/skills.md): the initial atomic registry, deterministic selection/composition, evaluation, and future scalability boundary.
- [Memory](docs/memory.md): memory categories, evidence lifecycle, identity, and temporal decay.
- [Privacy](docs/privacy.md): sensitive-data lifecycle, logging, trust boundaries, and safeguards.
- [LLM providers and BYOK](docs/llm-providers.md): provider abstraction, capabilities, credentials, topology, and future settings.
- [Roadmap](docs/roadmap.md): strict milestones and acceptance criteria.
- [Execution plans](.agent/PLANS.md): how Codex should plan and report milestone work.
- [Phase 0 plan](.agent/plans/phase-0.md): implementation decisions, acceptance evidence, and completion record.
- [Phase 1 plan](.agent/plans/phase-1.md): capture decisions, progress, validation evidence, and remaining native gates.
- [Phase 2 plan](.agent/plans/phase-2.md): screenshot-understanding boundary, provider decision, evaluation, and acceptance evidence.
- [Phase 3 plan](.agent/plans/phase-3.md): draft-aware decision/generation boundary, evaluation, and acceptance tracking.
- [Phase 4 plan](.agent/plans/phase-4.md): initial skill contract, deterministic selection/composition, evaluation, and acceptance tracking.

## Repository layout

```text
ai-message-coach/
├── apps/
│   ├── desktop/              # Electron main/preload + React/Vite renderer
│   └── api/                  # Fastify app, server entrypoint, health test
├── packages/
│   ├── contracts/            # Zod schemas and inferred shared types
│   ├── ai/                   # provider-neutral analysis + isolated provider adapter
│   ├── skills/               # approved registry, deterministic selection, composition, evaluation
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

No API key or external service is required for default tests. Phase 2 live use reads `OPENAI_API_KEY` from ignored `.env.local` into Electron main only; `.env.example` contains placeholders and the optional model override. This is a development credential path, not production OS-protected storage.

## Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Build shared packages, then run API and desktop development processes |
| `pnpm dev:desktop` | Build shared packages and launch the Electron/Vite desktop shell |
| `pnpm dev:api` | Build shared packages and run the Fastify API in watch mode |
| `pnpm eval:phase2 -- --limit 6` | Run the opt-in synthetic live-provider evaluation |
| `pnpm eval:phase3 -- --limit 6` | Run the opt-in coaching live-provider evaluation |
| `pnpm eval:phase4` | Run deterministic Phase 4 skill-selection evaluation |
| `pnpm eval:phase4 -- --live --limit 6 --review-output /tmp/phase4-review.json` | Opt in to paired generic/guided provider calls and create a private synthetic human-review artifact |
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

- `apps/desktop` composes capture, analysis, and coaching in trusted Electron main. Its renderer has no Node.js access; preload exposes fixed validated capture, provider-status, analysis, coaching, and clipboard methods through `contextBridge`; the window enables context isolation and sandboxing and disables renderer Node integration.
- `apps/api` imports shared contracts and keeps construction separate from listening so the health route can be tested with Fastify injection.
- `packages/contracts` defines Zod schemas first and infers TypeScript types from them.
- `packages/skills` owns the validated 21-skill atomic registry, deterministic eligibility/ranking, zero-to-four conflict-safe selection, compact composition, and privacy-safe evaluation metrics.
- `packages/ai` owns provider-neutral conversation analysis and coaching contracts, the deterministic draft-aware action gate, deterministic skill-context derivation, compact model-facing prompts, and isolated OpenAI vision/text adapters. It uses native `fetch`; no provider SDK leaks into core or skill logic.
- `packages/test-fixtures` contains 52 renderable synthetic conversation-understanding scenarios plus deterministic coaching and exact-ID skill-selection cases. No real conversations or credentials belong in the repository.
- Phase 1 adds a main-process single-flight capture service, one allowlisted IPC command, shared strict capture-result schemas, pure crop geometry/state logic, and a browser-only selection/preview renderer. Captures are never written to disk or sent to the API.

PostgreSQL, pgvector, semantic or large-catalog skill retrieval, durable memory, relationship prediction, identity resolution, the Skill Factory, automatic insertion/sending, iOS, and messaging-platform integrations remain intentionally absent.

## Future LLM provider model

AI Message Coach will use a bring-your-own-key model: the user selects a supported provider and model, supplies that provider's credential, and pays the provider directly for usage. Core coaching logic will depend on provider-neutral contracts, while OpenAI, Anthropic, Gemini, and later integrations remain isolated behind adapters.

Model eligibility is capability-based. For example, screenshot understanding requires vision plus text generation; the UI must explain when a selected model cannot perform a task rather than silently trying it. The initial integration may keep one provider/model selection simple, while later versions may allow different models for vision, text, embeddings, or evaluation.

Credentials will eventually be held behind the trusted Electron main/preload boundary using OS-protected storage where practical. The renderer should receive only safe state such as “provider configured,” never a stored key. Because conversations are sensitive, direct encrypted communication from the trusted desktop process to the selected provider is preferred when practical; the Fastify service does not automatically proxy every AI request. See [LLM providers and BYOK](docs/llm-providers.md).

## MVP user flow

1. The user views a conversation in another application and clicks **Generate** in AI Message Coach.
2. The desktop client calls its reusable conversation-capture capability, temporarily hides itself, captures the relevant display context, and restores itself.
3. During early implementations or when automatic selection is wrong, the user selects, adjusts, or resets the conversation region locally.
4. Phase 2 temporarily analyzes only the selected context for visible messages, ownership/order, the current compose-box draft, visible contact signals, language, warnings, and extraction confidence through a capable model.
5. Phase 3 consumes that validated context directly through a draft-aware action gate; it does not re-extract the screenshot.
6. For actions that require wording, Phase 4 derives a small skill context, deterministically selects zero to four eligible skills, and composes only their principles/avoidances for generation. Choice, clarification, and no-reply actions are not forced through skill selection.
7. The coach may then rewrite or complete the draft, suggest replies/actions, ask at most one necessary question, or say that no reply is needed.
8. The user reviews and copies the result. Captured image data is discarded.

The Generate button is the primary product trigger. A global shortcut or future quick action may invoke the same capture capability as an optional convenience; it must not create a parallel capture workflow. Manual screenshot selection is an initial setup mechanism, fallback, and correction tool rather than the intended long-term center of the experience.

Phase 1 implements steps 1–3. Phase 2 implements step 4 only. Phase 3 owns the explicit action and basic generation in steps 5, 7, and 8. Phase 4 adds the skill-guidance step 6 without relationship, identity, or memory reasoning. See [the roadmap](docs/roadmap.md); each milestone is deliberately narrow.
