# Development Lab — rewrite inspection

Status: complete — deterministic gates and native no-key smoke passed; live generation remains user-run
Owner: UI & UX
Started: 2026-10-16
Updated: 2026-10-16
Roadmap: developer inspection of the existing Phase 3/4 and Agent Phase B pipeline; no production cutover.

## Outcome

An unpackaged Electron development Lab lets the user type a draft, optional incoming message and user-owned context, run the current rewrite pipeline, and inspect the real result and structural diagnostics without an architecture-chat intermediary.

## Scope

One rewrite flow, existing provider adapter, bounded typed IPC, request-local diagnostics, primary/alternatives and exact first guard rejection. No history, memory retrieval, tool routing, multi-agent runtime, model-only comparison, new credential settings, sending or policy repair.

## Current state

UI&UX was at a77f476; the shared DB checkout contains concurrent uncommitted skill work. A dedicated attached UI worktree fast-forwards UI&UX to architecture checkpoint bd39266. It does not edit DB, the architecture worktree or the skills worktree. Production still uses the legacy CommunicationPlan; B3 assessment/selection/SkillPlan remains shadow-only. B4.7 human quality review remains pending. Existing inspection callbacks omit candidate ranks, shadow evidence and exact guard result.

## Assumptions and decisions

- Reuse coachConversation and the existing adapter; no change to decision, selection, Composer prompts, or guard policy.
- Manual input is an explicitly labelled simulation of the screenshot-analysis input contract. No screenshot or extraction occurs. Input confidence is an authored-fixture assumption, not model confidence. Internal observed-source labels describe the simulated contract, not an actual capture; the Lab envelope always states MANUAL_SIMULATION.
- Complete drafts use the real action gate. If it selects completion or another action, report the action and decline provider generation in this first slice.
- Production candidate diagnostics originate inside the existing selector. Shadow evidence/assessment/selection/plan originate inside the actual shadow stages. Shadow detailed ranking is unavailable in this slice and is labelled as such.
- Only validated normalized candidates may be inspected, including rejected packages. Raw provider payloads, private reasoning and schema error values never cross IPC.
- Keep the existing desktop visual language: navy #05091c canvas, #111b35 panels, #d9e5ff text, #91a4c7 secondary text, #7cb6ff focus/accent, #ffc78a rejection accent. Segoe UI body, restrained Segoe UI Semibold titles, Consolas structural codes. Draft followed by result and expandable trace sections; the distinctive element is the explicit production-to-Composer versus shadow-only branch marker. Optional evidence starts collapsed so Run fits the initial window; the Lab owns its scrolling because the existing body hides overflow.
- Native verification found sandboxed preload lacks main's defaultApp/environment flags. Main now supplies a dedicated argv marker only in the allowlisted unpackaged development session; preload enables only Lab methods from that marker and main independently gates registration/authorization. Existing memory inspector behavior is unchanged.
- Native Windows startup required invoking pnpm's JS entry through Node instead of spawning a .cmd directly. Long-lived Vite/Electron processes are launched directly for reliable cleanup. A busy renderer port fails closed. SQLite's installer script is explicitly disabled, retaining the reviewed SQLCipher artifact.

## Contracts and data flow

Zod-first Lab request/result schemas in packages/contracts. Main validates bounded manual text, constructs the existing CoachingRequest, runs the shared coaching service with request-local inspection hooks and returns a validated Lab result. Preload exposes fixed Lab operations only in the existing allowlisted development mode; main independently rejects packaged/non-development and unauthorized frames. Renderer stores only the active input/result in component memory. Clear, close, reload and unmount discard references; late results cannot repopulate cleared state. Main retains no completed run. Provider receives typed draft/context only on Run and bills normally.

## Implementation steps

1. Add bounded contracts and structural selector/validation diagnostics.
2. Extend optional inspection hooks without affecting production outputs; expose real shadow stage details.
3. Add development-gated main/preload service using the existing adapter and shared single-flight guard.
4. Add accessible Lab entry, input, result and expandable trace UI; clear/stale-run handling.
5. Add synthetic tests for contract bounds, production parity, rejection trace, no-key operation, gates and rendering.
6. Run repository gates and document launch/use and limitations.

## Tests and evaluation

Deterministic fake-provider tests compare traced and ordinary production results and call counts; exercise invalid response, exact guard rejection and missing key. IPC tests reject packaged/unauthorized/malformed/concurrent calls. UI tests verify diagnostic labels and rejected-result handling. No real private input or live provider calls during automated verification.

## Acceptance criteria

- [x] Development-only in-app entry; production has no Lab bridge/handler.
- [x] Draft and optional source-qualified evidence run the current rewrite path once.
- [x] Fixed action, production eligibility/ranks/exclusions/cap and exact guidance visible.
- [x] Actual shadow assessment/evidence/selection/SkillPlan clearly distinguished from Composer input.
- [x] Validated primary/alternatives and first guard rule or adapter/schema status plus safe error code visible.
- [x] No credentials/raw provider payload/private reasoning/content persistence or logging.
- [x] Clear/close discard visible state and ignore late completion; keyboard labels/focus/status present.
- [x] Required verification passes and use instructions recorded.

## Validation commands

pnpm.cmd lint; pnpm.cmd typecheck; pnpm.cmd test; pnpm.cmd build; focused Vitest tests; git diff --check. Any environmental blockage is recorded separately from code failures.

## Risks, rollback and limitations

Manual analysis bypasses screenshot extraction and cannot assess its accuracy. Existing heuristic guards are not semantic proof. Shadow ranks are not yet exposed. Missing provider configuration still permits structural inspection but no generation. No persistence migration. Rollback removes Lab UI/IPC and optional observer hooks; baseline policies remain intact.

## Progress log

- 2026-10-16: Inspected repository, active architecture checkpoint, contracts, selector, Composer guard, Electron/preload and tests. Isolated worktree and pinned architecture baseline. Concurrent skill edits excluded.
- 2026-10-16: Implemented strict Lab transport, source-labelled manual adapter, actual production ranking/guard observers and shadow-stage inspection. Added development-gated IPC/preload and scrollable accessible renderer with collapsed optional evidence. Production action, catalog, selection order, Composer prompts and guard rules retained.
- 2026-10-16: Deterministic parity, observer isolation, exact rejected-alternative guard, malformed output, no-key, manual ownership, concurrency, packaged/unauthorized IPC, sandboxed-preload and UI rendering tests pass. Added exact ranking/tie/conflict/cap diagnostic regression. Final suite: 57 files / 412 tests.
- 2026-10-16: Native Electron QA on Windows verified home Lab entry, visible draft focus, compact layout, real IPC Run with synthetic refusal, all 21 catalog eligibility outcomes, REWRITE_DRAFT / NOT_CONFIGURED / NOT_REACHED, no falsely sent guidance, Clear removes input/result, Escape returns home. Closed the app and confirmed no remaining UI-worktree Node server processes. No provider calls or credential copying.

## Completion record

Implemented in the attached `C:\Users\b\.codex\worktrees\ui-ux-lab\AI messager` worktree on `UI&UX`, based on `bd39266`. The shared DB checkout and concurrent Skills/architecture files were not edited. Changes remain local and uncommitted.

Commands and results:

- `git switch 'UI&UX'` and `git merge --ff-only bd39266` in the new worktree — passed after sandbox Git access escalation; fast-forward only.
- `pnpm.cmd install --frozen-lockfile` — first stopped on unreviewed SQLite install scripts; passed after explicit `allowBuilds: { '@appthreat/sqlite3': false }`. No unreviewed native build enabled and no dependency versions changed.
- `pnpm.cmd typecheck` — initial new diagnostic version type/lib errors corrected; subsequent full workspace checks passed.
- `pnpm.cmd lint` — passed, zero warnings.
- `pnpm.cmd test` — final 57 files / 412 tests passed, no provider calls.
- `pnpm.cmd build` — final packages/API/Electron main/preload/renderer build passed and reviewed SQLCipher artifact staged.
- `pnpm.cmd dev:desktop` — initially failed with Windows spawn EINVAL; corrected JS launcher then native smoke passed. An intermediate rebuild while Electron was open encountered its native DLL lock; closing the test app resolved it. The final direct-child launcher starts successfully and cleans up on exit.
- `pnpm.cmd build:packages`, `pnpm.cmd --filter @ai-message-coach/desktop run build:main`, `pnpm.cmd --filter @ai-message-coach/desktop run build:preload` — successful in final startup/build; intermediate open-app native-lock failure recorded above.
- `pnpm.cmd exec prettier --write` with the explicit changed source/config file list — passed. Markdown is excluded by repository formatting configuration.
- `git diff --check` — passed (host autocrlf warnings only).

Acceptance is complete for this development inspection slice. Real-provider generation, semantic quality, multi-monitor/large-text/screen-reader audits and pending B4.7 human signoff are not claimed. Deterministic providers cover accepted and rejected packages; native smoke covers the actual no-key boundary. Shadow detailed ranking, model-only comparison, run persistence and future history/memory remain absent and labelled. Manual simulation retains existing internal screenshot-shaped source labels with explicit Lab qualification; it does not assert that a screenshot occurred.

See [launch/use documentation](../../docs/development-lab.md). Next recommended work: user review of representative drafts in the Lab, then separately scoped shadow-rank inspection if useful, without promoting the shadow plan or changing guards based on presentation needs.
