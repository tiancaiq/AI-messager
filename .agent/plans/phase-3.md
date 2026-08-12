# Phase 3 — Draft-Aware Coaching Decision Engine

Status: implemented — live provider evaluation pending
Owner: Codex
Started: 2026-08-12
Updated: 2026-08-12
Roadmap milestone: [Phase 3 — deterministic coaching policy and secure BYOK MVP](../../docs/roadmap.md#phase-3--deterministic-coaching-policy-and-secure-byok-mvp)

## Outcome

Consume the validated Phase 2 `ConversationAnalysis` directly, choose one explicit coaching action, and present a basic copyable message, action choice, single clarification, or no-reply result. Phase 3 makes the capture flow useful end to end without relationship reasoning, memory, skill retrieval, persistence, insertion, or sending.

## Scope

In scope: a strict `CoachingDecision` contract; deterministic draft-aware action selection; provider-neutral basic text generation; one isolated OpenAI text adapter; action and clarification continuation using the same in-memory analysis; recoverable Electron IPC and renderer states; safe clipboard copy; deterministic fixtures/evaluation; focused documentation.

Out of scope: screenshot re-analysis, relationship prediction, identity resolution, contact/temporal memory, skills or Skill Factory, vector/database storage, automatic insertion/sending, additional providers, iOS, and Phase 4.

## Current state

- Phase 2 is committed at `2a08c39`; the worktree was clean at milestone start.
- `ConversationAnalysis` is strict, observation-only, and already reaches the renderer after the selected crop is analyzed once.
- The foundational `AgentAction` enum already contains the six approved actions, but the unused Phase 0 result placeholder has relationship and skill confidence fields and must not become the Phase 3 boundary.
- Trusted Electron main owns provider access; the sandboxed renderer receives only fixed validated IPC methods and never receives credentials.
- Default deterministic verification has 14 test files/71 tests. Live OpenAI calls remain blocked because this host cannot reach `api.openai.com:443`.

## Assumptions and decisions

- Action selection is deterministic and draft-aware. Draft presence/completeness is the strongest signal; low confidence causes clarification only when the uncertainty changes the response materially.
- Relationship certainty is never an input. Neutral wording handles non-material social uncertainty.
- A provider-neutral text generator supplies wording for actions that need a message. The normal path is one coaching provider call after the one Phase 2 analysis call; the action is explicit and validated.
- Action and clarification selections send the original in-memory `ConversationAnalysis` plus one bounded selection to coaching. They do not require a screenshot, recapture, or repeat Phase 2 call.
- Model confidence is an uncalibrated estimate. Separate user-intent and action confidence values are retained.
- Basic generation uses general communication constraints only. No skill registry, prompt library, relationship prompt, or hidden memory is introduced.
- Generated text is copied only after an explicit user click through a narrow main-process clipboard command.

## Contracts and data flow

`packages/contracts` owns strict schemas for coaching requests, selections, decisions, generated alternatives, action/clarification choices, safe errors, IPC results, and clipboard results. Every decision is a discriminated union keyed by `AgentAction`.

```text
selected crop → Phase 2 ConversationAnalysis (once)
→ deterministic Phase 3 action policy
→ provider-neutral coaching generator (when wording is needed)
→ strict CoachingDecision
→ renderer result / action choices / one clarification / no reply
→ optional action or clarification selection reuses ConversationAnalysis
→ explicit Copy invokes fixed clipboard IPC
```

Conversation analyses and generated messages remain session-only. They are not logged, persisted, sent through `apps/api`, or exposed to analytics. Only the structured Phase 2 context—not image bytes—is sent to the coaching provider.

## Implementation steps

1. Create this plan and replace the unused Phase 0 coaching placeholder with strict Phase 3 schemas and tests.
2. Add deterministic decision policy, provider-neutral coaching orchestration, a compact basic-generation prompt, and an isolated OpenAI text adapter with strict output validation.
3. Add representative synthetic decision fixtures and an opt-in live evaluation harness that reports only scenario IDs and aggregate checks.
4. Add single-flight coaching and clipboard services plus authorized fixed IPC/preload methods.
5. Extend the explicit renderer reducer and UI through DECIDING, choices, clarification, result, no-reply, retry, and copy states while retaining a collapsible Phase 2 inspection view.
6. Update architecture, product, privacy, provider, roadmap, and README only where Phase 3 changes implemented behavior.
7. Run formatting, lint, typecheck, deterministic tests, production build, API health, Browser QA, Electron startup, privacy/source review, and acceptance review. Keep live evaluation pending while the network blocker remains.

## Tests and evaluation

Deterministic coverage includes all six actions; complete/incomplete/casual/professional/English/Simplified/Traditional/mixed drafts; obvious reply, choice, ambiguity, and closed-conversation cases; UNKNOWN/low-confidence boundaries; non-material uncertainty that does not ask; selection continuation; intent preservation constraints; forbidden invented facts/relationship fields; schema/provider/error normalization; single-flight IPC; reducer recovery; copy success/failure; and Phase 0–2 regression.

Evaluation fixtures declare expected/acceptable/forbidden actions and important constraints. The harness reports action accuracy, unnecessary clarification, missed clarification, intent preservation, hallucinated-fact, and language-match checks. Live quality is not claimed until a reachable host runs the provider evaluation.

## Acceptance criteria

- [x] Phase 2 `ConversationAnalysis` is consumed directly with no screenshot re-analysis.
- [x] Every result has one validated `AgentAction`; all six actions have deterministic coverage.
- [x] Draft intent is prioritized and uncertainty triggers clarification only when material.
- [x] Action/clarification continuation reuses current context without recapture.
- [x] Basic responses are instructed and fixture-constrained to preserve uncertainty/refusal and not intentionally invent facts; live wording review remains pending.
- [x] English, Simplified Chinese, Traditional Chinese, mixed English/Chinese, and other-language fixtures exist.
- [x] Provider-neutral core and one isolated OpenAI text adapter pass deterministic tests.
- [x] Generated messages can be explicitly copied; insertion/sending remain absent.
- [x] Relationship, identity, memory, skills, Skill Factory, persistence, and Phase 4 work remain absent.
- [x] Errors are normalized, private content is not logged, and the UI is recoverable.
- [x] Formatting, lint, typecheck, tests, production build, API health, Browser QA, and practical Electron startup pass.
- [x] Live provider coaching evaluation and Windows validation remain explicitly pending.

## Validation commands

```text
pnpm format
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --filter @ai-message-coach/api start
curl --fail http://127.0.0.1:3000/health
pnpm --filter @ai-message-coach/desktop start
pnpm eval:phase3 -- --limit 6
git diff --check
```

## Risks, rollback, and limitations

- Heuristic action selection is intentionally narrow and requires evaluation; provider wording can still be semantically wrong despite strict shape validation.
- Contract constraints cannot prove intent preservation or absence of invented facts. Deterministic fixtures and later live review remain necessary.
- A second provider call is required only after a user choice or clarification; ordinary Phase 3 uses one coaching call.
- Development `.env.local` remains temporary credential handling; production OS-protected credential lifecycle is not expanded unless separately approved.
- Rollback removes the Phase 3 contracts/AI/service/UI/evaluation additions and restores the Phase 2 extraction result without data migration.

## Progress log

- 2026-08-12: Read the Phase 3 brief, repository instructions, completed Phase 2 plan, relevant docs, current contracts/AI/Electron/renderer/tests, and confirmed a clean Phase 2 baseline at `2a08c39`.
- 2026-08-12: Chose deterministic action gating plus provider-neutral validated wording, with relationship and skills explicitly excluded.
- 2026-08-12: Added strict action-discriminated coaching/request/error/copy contracts, deterministic action policy, provider-neutral generation orchestration, one isolated OpenAI text adapter, single-flight main service, fixed IPC/preload methods, explicit renderer states, and explicit clipboard copy.
- 2026-08-12: Added 14 coaching evaluation scenarios and deterministic coverage for all six actions, unnecessary-question and missed-question boundaries, draft preservation risks, language variants, continuation without recapture, provider normalization, state recovery, and copy failure.
- 2026-08-12: Final local verification passes: Prettier, ESLint, all workspace typechecks, 19 test files/110 tests, production build, `git diff --check`, API health, production Electron startup, desktop/mobile Browser QA, safe capture failure recovery, and privacy/source review. The Browser console had no warnings or errors.

## Completion record

Phase 3 is implemented as a draft-aware basic coaching baseline. It consumes Phase 2 structured analysis directly, chooses one explicit validated action, generates basic wording only when needed, reuses in-memory context for choices/clarification, and supports explicit Copy without insertion or sending. Deterministic/unit/integration and local runtime verification pass. Live coaching wording quality, intent preservation, hallucinated-fact rate, and language match are not verified because this host cannot reach `api.openai.com:443`; rerun `pnpm eval:phase3 -- --limit 6` from a reachable host and review generated wording before marking live provider evaluation complete. Windows DPI/multi-monitor capture validation also remains pending. Phase 4 was not started.
