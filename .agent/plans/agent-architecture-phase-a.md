# Agent architecture Phase A — communication problem foundation

Status: complete; formatting gate PASS WITH DOCUMENTED WORKTREE EXCEPTION

Owner: Codex

Started: 2026-10-01

Updated: 2026-10-01
Roadmap milestone: [Agent architecture Phase A](../../docs/roadmap.md#agent-architecture-phase-a--communication-problem-foundation)

## Outcome

Introduce one validated, request-scoped `CommunicationProblem` normalization boundary after `ConversationAnalysis`. The existing deterministic action policy, flat skill selector, provider wording request count, renderer/IPC shape, and user-visible result must behave exactly as before.

## Scope

In scope: a bounded internal Zod schema and deterministic normalizer in `packages/ai`, optional internal user-supplied input for a future instruction/recipient/relationship seam, a structural-only normalization status hook for tests, parity and privacy tests, and focused documentation. The normalizer is computed alongside the production coaching path; the policy and skill selector remain authoritative over their current inputs.

Out of scope: a new renderer control or IPC field, capability/domain routing, specialist ownership/selection, supervisor, composer replacement, evaluator revision, memory or identity lookup, provider request/prompt change, additional model call, persistence, and Phase B work.

## Current state

- `packages/contracts/src/conversation-analysis.ts` validates screenshot observations, including messages, draft, visible contact cues, language, summary, warnings and confidence. It is observation-only.
- `packages/contracts/src/coaching.ts` carries `{ analysis, selection }`; the renderer in `apps/desktop/src/renderer/App.tsx` has no free-form rewrite instruction producer.
- `packages/ai/src/coaching-policy.ts` fixes the action deterministically. `packages/ai/src/coaching-engine.ts` uses the policy, derives current `SkillContext`, calls the existing skill planner, and uses one wording call when needed. Local choice/clarification/no-reply branches use none.
- `packages/skills` owns the current approved catalog and flat selector. Concurrent skill work may change catalog size, metadata and layout; Phase A does not modify it.
- Existing `coachingEvaluationFixtures`, policy tests, skill integration tests, and generator-adapter tests provide parity baselines.

## Assumptions and decisions

- A `CommunicationProblem` is internal to `packages/ai` in Phase A. It does not cross IPC or become renderer-visible. Add a direct `zod` dependency to that package because its runtime schema belongs with its sole caller; do not add a competing cross-process contract.
- Normalize only validated existing observations and optional explicitly supplied internal context. Production supplies no free-form instruction, recipient, or relationship. Their absence is explicit; a visible contact name stays an observation, never confirmed identity or relationship.
- Keep hard constraints and soft style priorities as separate bounded lists. Do not parse free-form text into obligations or infer a relationship, emotional state, or hidden intent. Current product-wide preservation rules and output guards stay authoritative.
- Represent meaning conservatively with exact draft or selected-intent source text and provenance, not a semantic paraphrase or newly inferred facts. Keep the existing factual-anchor guard unchanged.
- The normalizer runs after `CoachingRequestSchema` validation and before the existing policy decision, but its result is not used to decide action, select skills, or build the provider request. If normalization unexpectedly fails, retain the existing path and report only a structural failure status to an optional in-process test/debug hook.
- The hook reports no message text, draft, contact label, instruction, provider payload, or model reasoning. It is not persisted, logged, sent over IPC, or included in analytics.

## Contracts and data flow

Internal `CommunicationProblem` fields are bounded and strict: current source draft and limited visible context references with observed provenance; optional user instruction, recipient and relationship with user-supplied provenance; a conservative goal (`WORK_WITH_DRAFT`, `FOLLOW_SELECTION`, `FOLLOW_INSTRUCTION`, or `UNKNOWN`); exact meaning source when available; copied language observation; separate hard-constraint and style-priority lists; observed warnings/concerns; and explicit unknowns. Each substantive value carries source classification (`OBSERVED_SCREENSHOT`, `USER_SUPPLIED`, `DETERMINISTIC_DERIVATION`, `ANALYSIS_INFERENCE`, or `UNKNOWN`) appropriate to its origin. Visible contact cues may be retained as observations but never populate the user-supplied recipient or relationship fields.

```text
validated CoachingRequest ──→ existing policy ──→ existing skill selection ──→ existing generation
          │
          └──→ deterministic CommunicationProblem normalization ──→ structural status only
```

The optional internal supplied-context input is for legitimate future callers and direct unit tests only. No production caller or IPC schema is added now. Existing screenshots, analysis, draft and provider payload lifetimes remain unchanged.

## Implementation steps

1. Add this plan and the Phase A roadmap entry with acceptance criteria.
2. Add `packages/ai/src/communication-problem.ts`: strict bounded Zod schemas, inferred types, and `normalizeCommunicationProblem` over validated `CoachingRequest` plus optional validated internal supplied context. Export the normalizer/type through `packages/ai/src/index.ts`.
3. Add `zod` as a direct `packages/ai` dependency and update the lockfile.
4. In `packages/ai/src/coaching-engine.ts`, compute normalization alongside the unchanged policy path and optionally emit a content-free normalization status to an in-process hook. Do not pass the problem to the policy, skill planner, prompt, adapter, or renderer.
5. Add focused normalizer and coaching-engine parity tests. Update the architecture/roadmap documentation only for the Phase A behavior and limitations.

## Tests and evaluation

Normalizing tests cover valid construction, schema bounds/strictness, absent and explicitly supplied instruction, recipient/relationship provenance, visible-contact non-promotion, supported language/script/code switching, separate hard and soft inputs, source-only preservation, deterministic repeatability, unknowns, and warnings. Policy parity tests compare complete decisions across all current coaching fixtures. Engine integration tests compare current skill plan outputs and generator call counts for rewrite, completion, reply, choice, clarification, and no-reply paths; validate no IPC/result change. The structural hook test rejects private content. Use only synthetic fixtures; no live provider call is required or authorized by this milestone.

## Acceptance criteria

- [x] The bounded internal `CommunicationProblem` validates deterministic output from existing observations and optional explicit internal input.
- [x] Missing instruction, recipient, relationship, and unsupported identity remain explicit unknowns; screenshot contact cues never become confirmed claims.
- [x] Language and provenance are accurate; preservation text is copied only from supported source; hard constraints and style priorities remain separate.
- [x] Existing policy decisions match all current coaching fixtures, including local choice, clarification, and no-reply.
- [x] Existing skill-selection inputs/results, provider request count, renderer/IPC/result shape, and privacy boundaries remain unchanged.
- [x] No new provider call, memory access, routing, specialist runtime, persistence, or content logging exists.
- [x] Lint, typecheck, tests, build, deterministic skill evaluation, and `git diff --check` pass. Formatting gate: **PASS WITH DOCUMENTED WORKTREE EXCEPTION**. The user approved the non-blocking Windows checkout exception after LF index verification; the alternate full-tree Prettier check passes.

## Validation commands

```text
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm eval:phase4
git diff --check
```

## Risks, rollback, and limitations

The normalizer may initially duplicate some observation references in memory, but it does not send or persist them and is not a second screenshot extractor. Its goal and preservation fields are conservative, not semantic understanding or calibrated confidence. A debug hook containing private content would violate this plan; tests inspect its exact structural shape. Rollback removes the Phase A normalizer and engine hook without data migration or provider/IPC changes. Catalog evolution may require refreshing tests, not changes to this normalizer.

## Progress log

- 2026-10-01: User approved Phase A. Inspected the approved overall plan, repository milestone rules, existing coaching request/UI, policy, engine, fixtures, and skill boundary. Confirmed there is no current free-form instruction producer and no need to edit the skill registry.
- 2026-10-01: Added internal strict normalization, optional internal supplied-context seam, exact source/provenance and unknown-state fields, and a structural-only status hook. Kept policy, skill and provider inputs untouched. Added nine focused normalizer tests and an engine integration test across skill fixtures.
- 2026-10-01: Dependency installation from the frozen lockfile succeeded with `--ignore-scripts` after ordinary install reported an unapproved `@appthreat/sqlite3` build script. The already reviewed Windows native artifact staged during the production build. No allowlist or tracked `pnpm-workspace.yaml` change was retained.
- 2026-10-01: Focused tests passed (3 files, 35 tests); full deterministic tests passed (40 files, 263 tests); lint, workspace typecheck, production build, and Phase 4 deterministic evaluation passed (21/21 scenarios, strict metrics 1.0). `git diff --check` reported no whitespace errors. Canonical `pnpm format:check` failed on 135 pre-existing checkout files because of CRLF line endings; changed source files passed targeted Prettier, and the whole repository passed `prettier --check . --end-of-line auto`.
- 2026-10-01: User approved a non-blocking formatting exception subject to `git ls-files --eol`. Every tracked Phase A file reports `i/lf`; the Windows worktree reports `w/crlf` for README, architecture, roadmap, and lockfile, while edited AI source/package files report `w/lf`. New untracked Phase A files have no index representation and currently report `w/lf`. No unrelated files were normalized. Phase A is complete; Phase B remains unstarted pending review of the concurrent skill-catalog checkpoint.

## Completion record

The Phase A runtime slice is implemented and verified for behavior, call count, skill selection, and privacy boundaries. `CommunicationProblem` is intentionally shadow data: it does not drive the policy, skill engine, prompt, or renderer. The current UI does not supply a free-form instruction; the optional internal seam is exercised only in synthetic tests. The normalizer does not claim semantic understanding, relationship identity, or new factual anchors.

Exact validation commands and outcomes:

- `corepack pnpm lint` — passed after removing one unused test import.
- `corepack pnpm typecheck` — passed for all workspace packages; final `tsc -p packages/ai/tsconfig.json --noEmit` also passed after the last structural name change.
- `corepack pnpm test` — passed, 40 files/263 tests; final direct `vitest run` passed the same 40 files/263 tests.
- `corepack pnpm build` — passed, including desktop production bundles.
- `corepack pnpm eval:phase4` — passed, 21/21 cases and unchanged strict selection metrics.
- `corepack pnpm exec vitest run packages/ai/src/communication-problem.test.ts packages/ai/src/coaching-engine.test.ts packages/ai/src/skill-integration.test.ts` — passed after test parity correction; final direct focused run passed 3 files/35 tests.
- `git diff --check` — passed with Windows line-ending conversion notices but no whitespace errors.
- `corepack pnpm format:check` — failed on 135 checkout files outside the Phase A changes because the Windows checkout materializes CRLF; `prettier --check . --end-of-line auto` passed the full tree, and targeted changed-source formatting passed. Formatting gate: **PASS WITH DOCUMENTED WORKTREE EXCEPTION**. Repository policy and the tracked/index representation remain LF, `git diff --check` passes, no unrelated files were normalized, and this exception does not change repository formatting policy.

There is no data migration or provider change to roll back. **Phase A — Foundation is complete.** The next recommended increment is Phase B routing metadata only after the concurrent skill-catalog integration checkpoint has been reviewed; do not turn the new router authoritative before the later shadow/parity stage.
