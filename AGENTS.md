# AI Message Coach contributor instructions

These instructions apply to the entire repository.

## Start here

Before changing code or architecture:

1. Read `README.md`.
2. Read the relevant files in `docs/`.
3. Check `.agent/PLANS.md` and the active milestone plan, if one exists.
4. Inspect the existing implementation and tests before proposing new modules.
5. Keep work inside the active milestone. Do not pre-build later roadmap items.

When product behavior and an implementation shortcut conflict, preserve the behavior described in `docs/product-behavior.md`. When privacy and convenience conflict, preserve `docs/privacy.md`.

## Product invariant

The central decision rule is:

> Infer first → generate when confident → offer choices when uncertain → ask only when necessary.

The coach never sends a message on the user's behalf. It may only present, copy, or—after a separately approved milestone—insert a draft for the user to review.

## Architecture boundaries

- `apps/desktop` owns operating-system and Electron concerns: shortcuts, window visibility, screen capture, crop UI, clipboard, presentation, and future OS-protected BYOK credential access. The React renderer must never receive stored API-key values.
- `apps/api` owns HTTP transport, request validation, server-side orchestration where justified, and privacy-safe operational telemetry. It is not automatically the proxy for every model request and must not become the default owner of user credentials.
- `packages/contracts` is the source of truth for cross-process schemas and shared types. Define runtime Zod schemas first and infer TypeScript types from them.
- `packages/ai` owns provider-neutral AI contracts, capability-aware model selection, model-facing prompts, structured analysis, confidence-aware decision policy, response planning, and isolated provider adapters. Provider SDKs may appear only inside their adapters. The package must not import Electron or Fastify.
- `packages/skills` owns approved skill definitions, validation, retrieval, and composition. Runtime code must not consume draft or generated skills.
- Memory must be accessed behind an interface. Do not couple reasoning code directly to a future database.
- The Context, Memory, Skill, Response, and Skill Factory engines are logical components, not a mandate for separate services or model agents.
- Prefer one model call on the normal MVP path. Add a second only for a material clarification or context update.
- Core Context, Memory, Skill, and Response logic must depend on internal provider-neutral interfaces, never a specific provider SDK.
- Select models by declared task capabilities rather than provider name. Normalize and validate every provider result before it enters core logic.
- Prefer direct encrypted requests from the trusted desktop process to the user's selected provider when practical. Routing private conversation content through application-operated infrastructure requires a documented technical need and privacy review.

Dependencies should point inward toward stable contracts and domain logic. Do not create parallel types, skill registries, prompt pipelines, or storage abstractions when an existing one can be extended.

## Scope and privacy rules

- Treat screenshots and message text as highly sensitive.
- Do not persist raw screenshots by default.
- Do not log screenshots, extracted message bodies, drafts, generated replies, credentials, or stable identity features.
- Never commit API keys, store them in plaintext configuration, expose them to the renderer, or include them in analytics or crash reports.
- Keep inferred identity separate from confirmed identity. Avatar similarity alone is never identity proof.
- Store observations and candidates separately from confirmed memory.
- Phrase missing history as “no recent observed messaging evidence,” never as proof that no interaction occurred.
- Current visible evidence normally outranks old memory.
- Support English, Simplified Chinese, and Traditional Chinese with language-specific skills. Other languages may use universal skills only.
- Do not add automatic sending, app-specific chat integrations, iOS work, vector search, or long-term memory before their approved milestones.

## Change workflow

For non-trivial milestones, create an execution plan as described in `.agent/PLANS.md`. Before editing, state assumptions that materially affect behavior or architecture.

Implementation order:

1. Confirm the milestone and acceptance criteria.
2. Inspect the relevant code, contracts, docs, and tests.
3. Add or update shared contracts before their producers and consumers.
4. Implement the smallest vertical slice that satisfies the milestone.
5. Add tests at the lowest useful layer, plus integration coverage for changed boundaries.
6. Run the repository's lint, typecheck, test, and build commands.
7. Verify every acceptance criterion and update affected documentation.

Until Phase 0 creates package scripts, do not invent command names. Once scripts exist, the root workspace must expose canonical `lint`, `typecheck`, `test`, and `build` commands.

## Quality rules

- Keep model output behind validated structured schemas; handle validation failures explicitly.
- Keep confidence values calibrated per dimension rather than collapsing them into one score.
- Test decision boundaries, not just happy-path prose.
- Prefer deterministic fixtures for policy and skill-selection tests. Keep live-provider evaluation separate from the default unit suite.
- Normalize provider failures into safe internal error codes; do not expose raw provider stack traces or responses.
- Record architectural decisions in `docs/architecture.md` or a focused ADR when a decision is costly to reverse.
- Avoid speculative infrastructure and abstractions without a current caller.

## Completion report

At the end of a milestone, report:

- what changed;
- architecture decisions and assumptions;
- tests added;
- exact commands run and their results;
- acceptance criteria status;
- known limitations;
- the next recommended milestone.
