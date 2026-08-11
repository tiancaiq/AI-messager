# Phase 0 — Repository Foundation

Status: complete
Owner: Codex
Started: 2026-08-10
Updated: 2026-08-10
Roadmap milestone: [Phase 0 — repository and contract skeleton](../../docs/roadmap.md#phase-0--repository-and-contract-skeleton)

## Outcome

Deliver a reproducible TypeScript monorepo in which a secure Electron/React placeholder launches, a Fastify API serves `GET /health`, shared Zod contracts cross workspace boundaries, and canonical quality commands pass. The milestone establishes boundaries only; it does not implement coaching behavior.

## Scope

In scope:

- pnpm workspace configuration, a pinned package manager, Node.js support policy, and lockfile;
- strict shared TypeScript configuration, ESLint, Prettier, Vitest, and canonical root commands;
- a minimal Electron main process, sandboxed preload bridge, React/Vite renderer, and placeholder screen;
- a minimal Fastify application with `GET /health`;
- foundational shared contracts for app metadata, health, actions, confidence, observations, coach result envelopes, errors, and skill definitions;
- minimal `ai`, `skills`, and synthetic `test-fixtures` package boundaries;
- deterministic schema, workspace import, API injection, and renderer component tests;
- environment-file ignore conventions without credentials.

Out of scope:

- screenshot capture, cropping, OCR, multimodal or OpenAI calls, prompts, response policy, and model output repair;
- skill retrieval, reranking, composition, production skill content, or Skill Factory workflows;
- memory, storage, identity/avatar recognition, PostgreSQL, pgvector, telemetry, authentication, deployment, packaging installers, and iOS;
- message insertion or sending.

## Current state

The repository contains only the architecture-foundation documents in the root, `docs/`, and `.agent/PLANS.md`. There are no package manifests, source modules, tests, build outputs, or active milestone plans. Node.js 24.14.1 and Corepack 0.34.6 are available in the development environment. All existing files are uncommitted, and a pre-existing `.DS_Store` is unrelated to this milestone.

## Assumptions and decisions

- Support Node.js 24 LTS and pin pnpm 11.21.0 in `packageManager` for reproducible installs.
- Use ECMAScript modules for API and shared packages. Build Electron main/preload as CommonJS bundles with Vite so sandboxed preload loading is predictable while the React renderer remains an ESM Vite application.
- Keep package tools at the root and runtime dependencies in their owning workspace package.
- Keep the API composition root testable through Fastify `inject`; `server.ts` owns listening, while `app.ts` owns construction.
- Bind API development to `127.0.0.1` by default.
- Use no desktop IPC in Phase 0. The preload bridge exposes only frozen, schema-validated application metadata, proving isolation without inventing a capability.
- Keep `packages/ai` intentionally empty except for its valid module boundary. Do not invent an interface without a caller.
- Put the foundational skill schema in `packages/contracts`; `packages/skills` only validates definitions. Synthetic examples live in `packages/test-fixtures`, not the runtime registry.
- Validate the Electron launch on the available macOS host. Windows-specific capture and packaging verification remain Phase 3 concerns.
- The visual placeholder follows the generated concept: deep navy canvas, restrained blue-violet ambient glow, and only the centered `AI Message Coach` title.

## Contracts and data flow

`packages/contracts` is the single runtime-schema source. Types are inferred with Zod and exported with their schemas. Phase 0 contracts are deliberately shallow:

- `AppInfo` crosses the sandboxed preload boundary as immutable metadata;
- `HealthResponse` crosses the HTTP boundary for `GET /health`;
- `AgentAction`, per-dimension confidence, a minimal observed-conversation shape, a minimal coach result envelope, and safe API errors establish future contract vocabulary without response-generation behavior;
- `SkillDefinition` establishes the skill package boundary with lifecycle, language eligibility, and version metadata, without implementing retrieval.

Only synthetic strings appear in tests. This milestone accepts no screenshots, message payloads, drafts, identities, memories, model prompts, or credentials, so there is no sensitive-content retention path.

## Implementation steps

1. Add root workspace, toolchain, environment, ignore, formatting, linting, testing, and TypeScript configuration.
2. Add `packages/contracts` schemas and inferred types first, with boundary-focused unit tests.
3. Add `packages/test-fixtures`, then the minimal `packages/skills` validator and empty `packages/ai` boundary.
4. Add the Fastify app/server split and `/health` injection test.
5. Add Electron main/preload/renderer boundaries, Vite builds, the placeholder React screen, and a renderer unit test.
6. Install dependencies and commit the generated pnpm lockfile.
7. Run format, lint, typecheck, tests, production builds, API health verification, Electron launch smoke test, and browser-based renderer QA.
8. Update README, architecture, roadmap status, and this plan's completion record.

## Tests and evaluation

- Contract unit tests cover every `AgentAction`, confidence bounds, valid/invalid coach result envelopes, health response validation, and skill-definition validation.
- Skills tests prove the package consumes the shared contract rather than defining a parallel type.
- Root integration tests import contracts, skills, and fixtures through workspace package names.
- API tests use Fastify injection to verify status, payload, and contract conformance without opening a port.
- Renderer tests verify the placeholder heading. Browser QA verifies the real Vite-rendered page, console health, and responsive layout.
- API and Electron process smoke checks verify the runnable entrypoints. No live model or network-dependent application test is permitted.

## Acceptance criteria

- [x] Dependencies install successfully from the committed lockfile.
- [x] The Electron desktop application launches with context isolation enabled, renderer Node integration disabled, and sandboxing enabled.
- [x] The React renderer displays `AI Message Coach`.
- [x] The Fastify API starts on loopback by default.
- [x] `GET /health` returns status 200 with `{ "status": "ok" }`.
- [x] Workspace package imports resolve in typecheck, tests, and builds.
- [x] Root `lint`, `typecheck`, `test`, and `build` commands pass.
- [x] Shared cross-boundary values are Zod-validated and TypeScript types are inferred.
- [x] No real user data, secret, OpenAI call, database, or future-milestone feature is present.

## Validation commands

```text
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev:api
pnpm dev:desktop
```

The running API is additionally checked with `curl http://127.0.0.1:3000/health`. The renderer is checked through the in-app Browser at its local Vite URL. The Electron smoke check records successful window creation and absence of startup errors before terminating the process.

## Risks, rollback, and limitations

- Newly released tool majors may expose compatibility issues; exact resolved versions remain locked and every canonical command is a gate.
- Electron can be launched on the current macOS environment, but Windows installer and OS-specific behavior are not verified in Phase 0.
- The desktop development script intentionally favors a small dependency surface over sophisticated main/preload hot restart behavior.
- Foundational contracts may evolve in Phase 1; their narrow Phase 0 shape minimizes migration cost.
- Rollback is deletion of the new manifests/source/configuration and restoration of documentation status; no data migration or external state exists.

## Progress log

- 2026-08-10: Foundation documents reread; repository confirmed documentation-only.
- 2026-08-10: Phase 0 scope confirmed by the user; assumptions and acceptance criteria recorded before implementation.
- 2026-08-10: Minimal placeholder visual concept generated with no features or extra copy.
- 2026-08-10: Direct registry verification corrected the pnpm and ESLint tool pins before lockfile generation.
- 2026-08-10: Added shared contracts and synthetic fixtures before their API, desktop, and skills consumers.
- 2026-08-10: Frozen-lockfile install passed with a 24-hour release maturity gate and only Electron/esbuild install scripts allowlisted.
- 2026-08-10: Corrected Electron's main-process Vite build after bundle inspection caught `node:path` being browser-externalized.
- 2026-08-10: All 17 deterministic tests, formatting, lint, typecheck, and production build gates passed.
- 2026-08-10: Fastify served the exact health contract; Browser QA passed at 1200×800 and 375×667; Electron main and sandboxed renderer processes launched successfully.

## Completion record

Phase 0 completed on 2026-08-10 with no scope expansion.

Delivered:

- pnpm workspace and lockfile, Node/pnpm policy, strict TypeScript, ESLint, Prettier, Vitest, environment/ignore conventions, and deterministic clean builds;
- secure Electron main/preload boundaries and a React/Vite placeholder matching the approved minimal concept;
- Fastify construction/server separation with `GET /health`;
- Zod-first foundational contracts and inferred types;
- empty AI boundary, validation-only skills boundary, and synthetic fixture package;
- five test files containing 17 deterministic tests.

Validation results:

- `corepack pnpm install --frozen-lockfile` — passed with 285 lockfile entries verified against supply-chain policies;
- `corepack pnpm format:check` — passed;
- `corepack pnpm lint` — passed with zero warnings;
- `corepack pnpm typecheck` — passed in all six non-root workspaces;
- `corepack pnpm test` — passed, 5 files and 17 tests;
- `corepack pnpm build` — passed for every workspace; production artifacts exclude test modules;
- built API startup plus `curl http://127.0.0.1:3000/health` — passed with `{"status":"ok"}`;
- Browser renderer QA — passed at 1200×800 and 375×667 with the expected title/heading, no overflow, and no console warnings/errors;
- built Electron launch — passed on macOS with live main, GPU, utility, and sandboxed renderer processes and no startup errors.

Implementation deviations and corrections:

- `packages/test-fixtures` was added because the milestone requires a concrete synthetic cross-package fixture consumer.
- Root `tests/` directories were not created because all current tests have a lower, concrete owning boundary.
- The local Electron verification binary used Electron's published checksum manifest and a faster regional transfer mirror after the official host stalled; no mirror configuration is stored in the repository.

Known limitations:

- Windows installer/package generation and Windows-native launch were not tested on the macOS development host; Windows capture behavior belongs to Phase 3.
- The desktop development helper provides renderer HMR but intentionally does not implement sophisticated main/preload process hot restart.
- Foundational result and observation contracts are deliberately shallow and will evolve only with Phase 1 callers.
- There is no coaching behavior, screenshot handling, external model, skill registry/retrieval, memory, identity recognition, storage, or iOS implementation.

Next recommended milestone: prepare and approve `.agent/plans/phase-1.md`, then implement only deterministic coaching policy and fixture-driven decision boundaries.
