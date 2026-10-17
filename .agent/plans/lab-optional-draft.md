# Optional drafts in the Lab

Status: complete — deterministic verification passed; native end-to-end follow-up deferred
Owner: UI & UX
Started: 2026-10-16
Roadmap: expose existing [Phase 3/4 behavior](../../docs/roadmap.md) in the development Lab.

## Outcome

Run coaching without a draft, using the existing action gate and conversation evidence.

## Scope

Remove the Lab-only rewrite restriction; present existing reply, action, clarification and no-reply results, including selected continuations. No new policy, provider, memory or recipient personalization.

## Current state

LabRequest requires a nonempty draft and main rejects non-rewrite actions. Core coaching already handles all six actions and explicit selections. LabResult already transports the complete decision union. The Lab uses ephemeral state and strict gated IPC.

## Assumptions and decisions

Empty draft is valid. Entirely empty input is also valid for the existing local clarification path, without a provider call. Label the primary action Generate response; label the draft optional. Preserve existing navy tokens and Segoe UI typography; show choices beside their actual policy result, never label local decisions as model-guard passes. Keep generation retries bound to the selected intent until input changes or Clear.

## Contracts and data flow

LabRequest permits blank draft and an optional nullable existing CoachingSelection. Main maps blank draft to null and forwards selection to the unchanged pipeline. No recipient data crosses IPC. Inputs/results/selections remain request/component-local; edit/Clear/close invalidate stale results and selections. No logging or persistence.

## Implementation steps

1. Update shared request schema, manual adapter and remove rewrite-only gate.
2. Render all existing decisions, wire bounded choices, retain selected intent for retry.
3. Cover empty/whitespace draft, no-context, no-reply, choices, selected continuation, completion and existing rewrite parity.
4. Update documentation and run canonical checks.

## Tests and evaluation

Deterministic synthetic service/transport/rendering tests, no live provider requests. Existing guard and single-flight tests remain unchanged. Native verification where possible; do not discard user-authored input to rebuild.

## Acceptance criteria

- [x] Empty draft passes contract, UI and main; no fabricated draft.
- [x] No-draft outcomes and choices render and continue through the real pipeline.
- [x] Existing policy/guards and recipient privacy remain unchanged.
- [x] Verification commands pass and limitations are documented.

## Validation commands

pnpm.cmd lint; pnpm.cmd typecheck; pnpm.cmd test; pnpm.cmd build; git diff --check.

## Risks, rollback, and limitations

Existing no-draft heuristics and live quality limitations remain. Choice is a user intent, not observed conversation evidence. No architecture quality gate or shadow cutover. Revert this slice to restore the Lab-only limitation; no migration.

## Progress log

- 2026-10-16: Inspected contracts, Lab service, core policy, existing decision UI, privacy/product instructions and tests. User requested optional draft.

## Completion record

Updated the strict Lab request, manual adapter and renderer; core coaching policy, provider adapter, guards, memory and recipient preview are unchanged. Blank input maps to absent draft; optional selections reuse the existing shared type. Local outcomes are clearly distinguished from generated-output validation. The frontend-design skill guided optional-draft labels and existing choice styling. The computer-use skill was used to inspect the app and perform the user-approved restart.

Added nine net tests covering whitespace/empty drafts, direct replies, local clarification/no-reply/actions without a key, selected continuation/retry, enabled empty-form submission and local result rendering. Updated completion, preload and IPC regression tests. Existing rewrite parity and guards continue to pass.

Commands and outcomes:

- `pnpm.cmd exec prettier --write packages/contracts/src/lab.ts apps/desktop/src/main/lab.ts apps/desktop/src/main/lab.test.ts apps/desktop/src/main/lab-ipc.test.ts apps/desktop/src/preload/lab.test.ts apps/desktop/src/renderer/Lab.tsx apps/desktop/src/renderer/Lab.test.tsx` — passed.
- `pnpm.cmd exec vitest run apps/desktop/src/main/lab.test.ts apps/desktop/src/main/lab-ipc.test.ts apps/desktop/src/preload/lab.test.ts apps/desktop/src/renderer/Lab.test.tsx` — 29 tests passed.
- `pnpm.cmd lint` — passed.
- `pnpm.cmd typecheck` — an exact-optional callback type error was corrected; full rerun passed.
- `pnpm.cmd test` — 57 files / 423 tests passed, no provider calls.
- `pnpm.cmd build` — passed after the approved app shutdown.
- `git diff --check` — passed with host line-ending warnings only.
- `pnpm.cmd dev:desktop` — successfully restarted with rebuilt main/preload and renderer.

Native inspection confirmed the optional draft and enabled Generate response control. The user approved discarding the pre-restart Lab fields. Restart succeeded; further native click-through was deferred after window automation reported user activity and unavailable input geometry. Do not claim a post-restart native no-draft run or live-provider quality check. Deterministic service, IPC, preload and rendering coverage passed. The app was left running.

Changes are local and uncommitted in the isolated UI&UX worktree. Acceptance is verified deterministically. Next: user smoke-test an incoming message without a draft; live generated wording still requires the existing provider configuration. No new backend relationship behavior or architecture quality signoff is implied.
