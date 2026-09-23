# DATA-01 — Protected local persistence foundation

Status: complete
Owner: Codex
Started: 2026-09-14
Updated: 2026-09-14
Roadmap milestone: [DATA-01](../../docs/roadmap.md#data--memory-roadmap)
Working branch: `DB`
Prerequisite: [completed DATA-00](data-00.md)

## Outcome

The user can explicitly save, view, change, and delete a communication preference in a protected local store, close the app, and find the committed preference after reopening it. They can clear all local memory without deleting separate provider configuration. Storage failures leave current-context coaching available.

This is the first persistence slice, not automatic memory learning. Saved preferences do not affect generated replies in DATA-01: retrieval, prompt integration, and matching output guards belong to MEM-05. The UI must disclose that limitation rather than imply personalization already works.

The user subsequently authorized implementation on `DB` and selected the free SQLCipher Community route. DATA-02 and later memory work remain unauthorized.

## Scope

In scope:

- A synthetic Windows/Electron encryption, native-loading, and packaging compatibility gate.
- One local context, encrypted SQLite lifecycle, OS-protected database-key custody, schema versioning, transactions, and revision/generation checks.
- One explicit preference category with save/read/edit/delete controls and clear-all-memory confirmation.
- Narrow validated IPC, a responsive trusted storage execution boundary, safe errors, and deterministic plus native integration tests.
- Documentation of the selected binding, security limitations, and tested runtime/platform matrix.
- A development-only, read-only Local Memory Inspector that uses the existing authorized IPC, coordinator, and utility-process path; it exposes no key or arbitrary SQL capability and is absent from production sessions.

Out of scope: accounts, authentication, multiple profiles, sync, cloud/API storage, contacts, identity matching, relationship records, inferred assertions, transcript/screenshot storage, summaries, habit profiles, observation queues, model-assisted processing, vector search, full-history prompts, provider-key settings, export/recovery tools, app vault passwords, installer signing/distribution, and automatic sending. No later-roadmap tables or unused memory-reader interfaces are pre-created.

## Current state

- The inspected checkout is `DB`. DATA-00 documentation and unrelated communication-skill changes are already uncommitted. Preserve them; do not stage, revert, or refactor them for this milestone. Recheck branch and overlapping files before edits.
- The root uses Node 24 and pnpm 11.21.0. `apps/desktop/package.json` declares Electron `^43.2.0`; record the exact lockfile-resolved/runtime version at the native gate rather than assuming the range proves compatibility.
- `apps/desktop/src/main/index.ts` owns window creation and IPC sender/main-frame authorization. It currently creates no database and must not await storage readiness before making the coaching window usable.
- `apps/desktop/src/preload/index.ts` exposes fixed methods with schema validation. `apps/desktop/src/renderer/env.d.ts` describes the bridge. Neither exposes files, SQL, or keys.
- `packages/contracts/src/index.ts` exports shared Zod-first contracts. There is no implemented persistence port to extend. Avoid overwriting concurrent skill-contract exports.
- `apps/desktop/vite.main.config.ts` builds one CJS main entry and externalizes Electron/Node imports. A storage utility entry and native dependency assets need explicit build handling. Existing `scripts/dev.mjs` and `scripts/start.mjs` launch Electron from the workspace; there is no distribution packaging gate today.
- Renderer tests use static React rendering; main-service tests use injected fakes. These are useful patterns but cannot prove native encryption, click behavior, or persistence across process restart.
- The governing sources are [memory](../../docs/memory.md), [architecture](../../docs/architecture.md#data--memory-boundaries-data-00), [privacy](../../docs/privacy.md#local-memory-storage-data-00), and [product behavior](../../docs/product-behavior.md). Existing coaching and skill behavior stays unchanged.

## Assumptions and decisions

### Encryption choice and gate A

Use SQLCipher Community as the encrypted SQLite engine. No plain SQLite fallback and no handwritten cryptography.

Read-only upstream review on 2026-09-14 found:

- `@journeyapps/sqlcipher` **6.0.0 is excluded** for this Windows-first milestone: its release explicitly removes Windows support. Do not silently pin its older Windows build to bypass that decision. See [maintainer release notes](https://github.com/journeyapps/node-sqlcipher/releases/tag/v6.0.0).
- `@signalapp/sqlcipher` **4.1.0 remains excluded**. The user explicitly rejected its `AGPL-3.0-only` license for the proprietary/commercial core application even after technical compatibility passed.
- The selected free stack is SQLCipher Community **4.17.0** (BSD-style license), OpenSSL **3.6.4** (Apache-2.0), and `@appthreat/sqlite3` **9.0.2** (BSD-3-Clause). These licenses permit proprietary/commercial distribution subject to their notice obligations; notices are staged with the native artifact. No commercial purchase is required.

Gate A passed on Windows x64 using Electron **43.3.0**, embedded Node **24.18.1**, and Node-API **10**. SQLCipher reported `4.17.0 community` with the OpenSSL provider. Development and relocated production-style utility-process launches passed correct-key create/reopen, wrong/no-key rejection, cipher integrity, encrypted-header/plaintext-canary checks, rollback-journal inspection, async safeStorage round-trip, and compile/runtime memory-only temporary storage. The repository stages only reviewed native artifact SHA-256 `535eac9ea27bb1e2d925eb055eb80e718896e06299f313587b911e36032fb6f4` and rechecks the cipher before schema access.

Artifact provenance, dependency integrity, exact source commits, rebuild steps, license notices, and runtime paths are recorded under `apps/desktop/native/`. Windows x64 is the only supported durable-memory target; other targets fail unavailable until individually verified. Installer signing and a final ASAR installer check remain release work. Consult [Electron native-module guidance](https://www.electronjs.org/docs/latest/tutorial/using-native-node-modules).

### Key and file lifecycle

- Main creates a cryptographically random 32-byte database key and wraps it using Electron OS-protected `safeStorage`, separate from provider credentials. Prefer its asynchronous API if supported by the exact Electron runtime; verify availability and latency at gate A. Never put a key in CLI arguments, environment variables, renderer state, SQL traces, or logs. See [safeStorage semantics](https://www.electronjs.org/docs/latest/api/safe-storage).
- Main owns fixed paths under private per-user application data, with a separate test directory override available only to the trusted test harness. No renderer-selected paths. Verify Windows access controls; POSIX file-mode flags alone are not Windows ACL validation.
- Store only the OS-wrapped key envelope outside the encrypted database. Atomically create/replace that envelope, bind it to a store identifier, and test interrupted initialization. Do not create a new key when an existing store's envelope is missing, corrupt, or cannot be unwrapped.
- Missing key, wrong key, unsupported schema, or database corruption enters a safe unavailable state. Preserve existing files, offer retry and explicitly confirmed erase/reset, and never auto-repair by overwriting data or opening plaintext. Key loss may make data unrecoverable; there is no export/recovery feature in this slice.
- Require the key before schema access or writes, verify the cipher is active, and keep temporary SQL data in memory. Use one serialized writer and initially rollback-journal mode to minimize sidecar complexity; WAL is not required for this tiny slice. Validate actual journal/temp behavior against [SQLCipher's design](https://www.zetetic.net/sqlcipher/design/), including crash paths. Failure to find a plaintext marker alone is not proof of encryption.
- No content-bearing diagnostic output, SQL debug logging, raw error forwarding, or automatic crash uploads. OS-user protection does not protect against a compromised signed-in session; no forensic-erasure guarantee is made.

### Execution and bounded operations

Use a main-owned Electron utility process for the database adapter, so native synchronous operations cannot block the renderer or Electron main's event loop. This is an internal desktop implementation detail, not a service or the future acquisition queue. Main owns OS-key wrapping and authorization; only its trusted child receives the unwrapped database key over private IPC. Do not inherit provider credentials into the child environment; suppress raw child stdout/stderr and normalize failures. See [utility-process API](https://www.electronjs.org/docs/latest/api/utility-process).

Proposed initial bounds, to implement and test as named constants:

| Boundary | Limit | Overflow/failure behavior |
|---|---|---|
| Preference data | One `messageLength` key; `CONCISE`, `BALANCED`, or `DETAILED`; absence means unset | Reject unknown keys/values; no free-text or arbitrary JSON |
| IPC request / response | 4 KiB / 16 KiB encoded payload | Reject before storage dispatch; sanitize invalid response |
| Store command concurrency | One executing command plus eight waiting; 32 KiB waiting payload total | Return `BUSY`; no persistent backlog |
| SQLite lock wait | 250 ms | Return bounded failure; no automatic retry loop |
| Read/write command | 2 seconds including queue wait | Expire undispatched work; mark uncertain dispatched writes for reconciliation |
| Open/migrate/reset | 10 seconds | Storage unavailable; foreground remains usable |
| Shutdown drain | 2 seconds | Stop worker if necessary; recover transaction on reopen |

These are small-store safety ceilings, not measured latency claims or global future-memory budgets. Validate boundary and over-bound cases. Do not expand limits silently to make tests pass.

Explicit Save waits for a committed acknowledgement before showing success; coaching never waits for Save or initialization. A timeout does not prove a write failed: stop admission, retire the old worker, reopen safely, and read authoritative state before permitting another mutation. Never let two workers write concurrently or show a retry as if a timed-out commit certainly did not happen.

### Minimal data and controls

Create only schema metadata, the singleton local context, and the explicit-preference record. The context contains a main-generated random ID, dataset generation, and monotonic settings revision. Preference ownership, value, revision, and main-generated created/updated timestamps are structured; source is explicitly `USER_SETTING`, not an inferred observation or learned profile.

Use one unique preference key per context. Retain a saved preference until the user changes/deletes it; no age-based expiry. Deleting the preference increments the context revision even when the row is removed, preventing delete/recreate stale-write races without retaining the deleted value. Future assertion/profile work must consume or deliberately migrate this source, not introduce a second writable preference truth.

Explicit saving is consent only to store that setting. Automatic acquisition and automatic use remain unavailable/off, with that status disclosed. Do not add inert toggles that imply either capability exists. No capture, message, draft, generated reply, stable contact feature, or provider payload enters this store.

### Development-only inspector

The inspector is a debugging surface, not a production user feature. Main enables it only for an unpackaged app running the exact allowlisted `VITE_DEV_SERVER_URL` session used by `pnpm dev:desktop`; packaged or production-bundle startup registers no inspector handler. Preload independently requires Electron's default development app mode plus that exact marker, and the renderer renders nothing without the bridge capability. This is defense in depth; renderer state never decides authorization.

Inspection is one fixed, payload-free, read-only command through the existing coordinator and utility process. The utility returns only schema version, the fixed database path, local-context identifiers/generation/revision, and current explicit preference rows with their key, value, source, and timestamps. No key/envelope bytes, SQL text, database handle, mutation, export, or plaintext copy is exposed. Future Contacts, Platform identities, Identity associations, Memory assertions, Evidence, Relationship history, Interaction summaries, Communication profiles, and Processing receipts sections remain unimplemented until their owning DATA/MEM milestones create real schemas.

## Contracts and data flow

Add `packages/contracts/src/local-memory.ts` and tests, exporting schemas through the existing index. Define strict runtime schemas before implementation, infer types, and reject unknown fields.

Renderer-facing production operations: get safe storage status, read the preference snapshot, save/change the preference, delete it, and explicitly confirm clear-all-memory. Mutation requests carry the previously read dataset generation and settings revision; main supplies ownership IDs and timestamps. Responses distinguish committed success, conflict, busy, unavailable/key-unavailable, invalid request, and an unknown write outcome requiring refresh. Production responses do not return SQL, filesystem paths, key envelopes, native errors, or arbitrary validation details. The development-only inspector may return the fixed database path and internal IDs under the stricter gate above.

Main's private utility protocol additionally validates lifecycle commands and fixed operation identifiers. Define shared cross-process schemas in contracts; keep key initialization in an internal trusted schema that is never registered as a renderer operation. The renderer cannot access the child port or choose SQL/migrations.

Flow: explicit UI action → fixed preload method → authorized main-frame check and schema validation → small desktop `LocalPreferenceStore` port → trusted utility process → keyed database transaction → validated committed snapshot → UI. No API, provider, capture, AI prompt, or skill-registry branch is added.

Within each mutation transaction, compare dataset generation and settings revision before changing records, then advance the revision. Concurrent edits fail with conflict rather than silently overwrite. Clear-all invalidates pending operations and changes dataset generation; stale UI requests cannot recreate deleted values. A late response from an older worker/session must not replace the cleared UI snapshot.

Normal clear-all transactionally deletes all DATA-01 memory records and replaces context metadata with a fresh empty generation. It leaves separate provider/app configuration untouched. Checkpoint/cleanup requirements must be verified for the chosen journal mode, and success means application data is removed, not guaranteed forensic erasure. For an inaccessible store, a separately confirmed destructive reset first terminates the worker, then removes only enumerated validated memory files and its wrapped database key; do not recursively remove the application-data directory. Interrupted reset must remain unavailable until safely completed, never silently reopen the old dataset.

## Implementation steps

1. **Completed — approve scope and resolve gate A.** Rechecked `DB`, preserved prior work, rejected the AGPL candidate, selected the free stack, and passed the synthetic development/relocated Electron gate before enabling preference persistence.
2. **Define contracts and tests.** Add `packages/contracts/src/local-memory.ts` and `local-memory.test.ts`; minimally extend existing exports. Define bounded snapshots, fixed requests/results, revisions/generations, safe status/errors, and the private child protocol. No generic query API or future entities.
3. **Implement key/lifecycle boundaries.** Add focused modules under `apps/desktop/src/main/local-memory/` for key custody, lifecycle/coordinator, the narrow store port, and IPC handling. Inject filesystem/key/worker collaborators for deterministic tests. Integrate lifecycle in main without making window creation or coaching depend on readiness.
4. **Implement the encrypted adapter.** Add the utility entry and SQLite adapter/migration under that same desktop-owned area. Use prepared statements and atomic revision checks. Reuse the exact dependency proven by gate A; its initial installation belongs to the authorized compatibility slice, after the license decision. Allow only its required reviewed install/build scripts, not blanket dependency-script enablement. Update desktop main build/dev/start handling to emit/load the child and preserve native assets.
5. **Deliver the UI slice.** Extend preload and `renderer/env.d.ts`; add a small `LocalMemorySettings.tsx` view and testable state controller alongside `App.tsx`, reusing current UI styles. Show status, saved versus unsaved state, Save/Edit/Delete, and confirmed Clear all local memory. Display local-only storage and not-yet-used-in-coaching disclosures. Conflict/unknown outcomes require refresh; failed writes must not show Saved.
6. **Prove failure and deletion behavior.** Test migrations, rollback, crash/reopen, key loss, worker hangs, queue overflow, stale edits, delete/recreate, clear-versus-write, late replies, and unchanged coaching. Perform the native and UI checks below using synthetic data only.
7. **Add the development-only inspector.** Extend strict contracts with a payload-free read-only snapshot, route it through the existing coordinator/utility, register/expose it only for the exact development session, and render only DATA-01 records. Prove production absence, strict response validation, and that no key/SQL/mutation capability crosses IPC.
8. **Close the milestone.** Run canonical validation, review privacy/acceptance evidence, and update README/architecture/privacy/roadmap and this record. Do not mark complete while native/license gates or acceptance criteria remain open. No commit without a user request.

## Tests and evaluation

| Layer | Required evidence |
|---|---|
| Contracts | Valid enum/unset state; unknown fields, oversize payloads, malformed revisions/generations, arbitrary path/query/key fields rejected; sanitized failures |
| Store/lifecycle units | First initialization; exactly one context; save/read/change/delete; no expiry; revision conflict; wrong/missing/unavailable key; interrupted initialization; future schema refused without mutation |
| Real encrypted integration | Commit survives process restart; correct key succeeds, wrong/no key and ordinary SQLite access fail; cipher version/integrity checks; journal/temp/crash fixtures contain no plaintext synthetic canary; transaction failure has no partial state |
| Concurrency/reset | Concurrent stale saves; delete/recreate; clear racing queued or dispatched writes; worker reply after reset; timed-out committed write reconciled; crash during reset; new generation persists |
| IPC/privacy | Unauthorized window/subframe blocked; production renderer has no inspector/path capability; development inspector accepts no payload and exposes no key/SQL/mutation/export; no secrets inherited by child; no values/keys/IDs/raw database errors in logs or renderer failures |
| Responsiveness | Hung worker, slow open, full queue, lock/disk-full/permission errors keep Generate and existing coaching available; no database await in coaching; no added provider calls |
| UI | Loading/unavailable/empty/saved/dirty/conflict states; explicit save/edit/delete; clear cancel and confirm; keyboard operation; truthful commit/unknown-state copy; persistence after relaunch |

Use existing Vitest patterns for schemas, injected services, and pure UI-state tests. Static markup tests supplement but do not replace an interactive Electron smoke check. A Windows native suite must use the actual accepted encrypted binding, not an in-memory fake; label it separately where the environment cannot run it, and never count a skip as passing gate A. Existing default tests must remain credential-free. No live model evaluation is needed.

## Acceptance criteria

- [x] AC1: A recorded exact binding/version and acceptable license decision pass synthetic Windows x64 Electron development and production-layout checks before real-data persistence.
- [x] AC2: One encrypted store/context exists; raw database keys stay within trusted processes and only an OS-protected key envelope persists outside it.
- [x] AC3: An explicitly saved preference survives app restart; viewing/editing/deleting works, and no age-based purge exists.
- [x] AC4: Missing/unavailable/wrong keys, corrupt/future schema, and interrupted initialization fail safely without plaintext fallback or silent data overwrite.
- [x] AC5: Transactions and revisions prevent partial/stale writes, including delete/recreate; timeout outcome is reconciled before new writes.
- [x] AC6: Confirmed clear-all removes the dataset, changes generation, rejects old work, survives restart, and preserves separate provider configuration. Cancel leaves data unchanged.
- [x] AC7: Screenshots/messages/drafts/replies are never persisted by this path; content, key material, stable IDs, and raw native errors do not leak through logs, IPC errors, or crash uploads.
- [x] AC8: Finite command/queue/time limits are enforced; storage failure cannot block window availability, capture/coaching, or Copy, and adds no model calls.
- [x] AC9: Strict authorized IPC and inspect/edit/delete/reset UI accompany the first stored category; the UI clearly says preferences are not yet applied to coaching.
- [x] AC10: Canonical checks, real encrypted integration, interactive UI/native smoke, and privacy review pass with evidence recorded. Changes remain DATA-01-scoped on `DB` and preserve unrelated edits.

These refine the roadmap and DATA-00 scenarios M11 and M20. M11 here concerns local settings commands; observation/model-job races are still MEM-01 work.

## Validation commands

Run from the repository root during implementation:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `git diff --check`
- `git status --short`
- `git branch --show-current`

After build, `pnpm --filter @ai-message-coach/desktop start` is the existing production-bundle launch command; `pnpm dev:desktop` verifies development entrypoints. Use synthetic isolated app-data paths in the native harness, never the user's real store. Record the exact native/production-layout smoke invocation after the harness exists; do not claim a nonexistent package script was run. Add local documentation-link and plan-section checks for this planning-only change. Do not use a repository-wide write formatter; `.agent/` is currently excluded from Prettier checks.

## Risks, rollback, and limitations

- **Free native stack has ongoing maintenance cost.** Gate A is closed, but the Community build is source-built and the permissive wrapper needs a small Windows external-library link patch. The reviewed artifact, exact hash, notices, and rebuild recipe are checked in; upgrades require a fresh gate and deliberate artifact review.
- **Native packaging is new to the repository.** Limit changes to proving and loading the storage module in development and a production layout; signing, installers, auto-update, and other platforms need separate release work.
- **Cross-file key initialization/reset is not one SQLite transaction.** The completed implementation uses atomic envelope replacement plus a reset-in-progress marker removed only after enumerated cleanup; deterministic interruption/resume tests cover the remaining cross-file boundary.
- **Timeouts have uncertain outcomes.** A successful commit may lose its acknowledgement. Reconcile authoritative state; do not blindly replay or race a second worker.
- **Schema rollback is conservative.** This is schema version 2 with a transactional v1 migration that binds the key-envelope store ID. An older app encountering a newer store fails closed rather than downgrading or replacing it. Prefer reverting code with memory disabled while preserving encrypted files over destructive down-migrations.
- **Key loss and erasure limitations are visible.** No recovery/export, OS-backup deletion, guaranteed RAM wipe, or same-OS-user app isolation is promised.
- **No intelligence improvement yet.** This proves safe persistence and controls; contacts are DATA-02, assertions MEM-00, acquisition MEM-01, and coaching integration MEM-05. Existing Phase 2–4 live-quality/native capture release gates remain open.

## Progress log

- 2026-09-14: User authorized finishing DATA-01. Closure audit found two implementation gaps: timed-out worker retirement could leave stale initialization/session state, and an inaccessible store had no explicit erase-and-recreate control. Closure work will add deterministic coordinator injection/session tests, bounded reconciliation before later mutation, a crash-resumable enumerated reset, store-ID binding with a versioned v1→v2 migration, production UI smoke coverage, and corrupt/future-schema native fixtures. Installer signing/distribution remains outside DATA-01 as already scoped; the existing relocated production-layout gate remains the packaging evidence.
- 2026-09-14: User requested the plan before implementation. Confirmed `DB`; inspected existing contracts, main/preload, renderer/test patterns, build scripts, and governing docs. Unrelated communication-skill changes are present and will be preserved.
- 2026-09-14: Wrote this proposed plan. Read-only upstream review excluded JourneyApps 6.0.0 for Windows and identified Signal 4.1.0 as a license-gated candidate. No dependencies installed, code changed, database created, native compatibility test run, or provider call made.
- 2026-09-14: User rejected `@signalapp/sqlcipher@4.1.0` because it is AGPL-3.0-only, accepted its technical result only, and required DATA-01 to remain blocked while permissive/commercial alternatives were investigated.
- 2026-09-14: User selected the free version. Built SQLCipher Community 4.17.0 with OpenSSL 3.6.4 and `@appthreat/sqlite3` 9.0.2 in an isolated Windows x64 gate. Electron 43.3.0 main/utility and relocated-layout checks passed; no repository implementation was changed until this gate succeeded.
- 2026-09-14: Implemented the DATA-01 explicit-preference slice: Zod contracts, safeStorage key envelope, bounded utility-process coordinator, SQLCipher schema/CRUD/revisions/generation reset, fixed preload IPC, UI controls/disclosure, reviewed native staging, notices, unit tests, and a repository native gate.
- 2026-09-14: Added the requested development-only Local Memory Inspector after finding no blocking boundary concern. Both main and preload require the exact development marker; inspection is a strict payload-free command through the existing coordinator/utility and exposes only schema/path/context/preference diagnostics. No future DATA/MEM sections, arbitrary SQL, mutation, export, plaintext database, or key material were added.
- 2026-09-14: Closed DATA-01 hardening. Added schema-v2 envelope/store binding with transactional v1 migration; crash-resumable enumerated unavailable-store recovery; worker-session retirement and bounded timeout reconciliation; strict IPC reset authorization; deterministic queue, late-reply, open-failure, transport-failure, reset, and key interruption tests; ASAR-unpacked path resolution; and an expanded Windows native/production-UI gate covering corruption, future schema, no/wrong key, store mismatch, delete/recreate, clear cancellation, and recovery.
- 2026-09-14: Before DATA-02 implementation, repaired two newly identified DATA-01 regressions: an unset preference can now be explicitly saved as Balanced, and key-load/erase lifecycle stages now have abortable deadlines, reset coalescing, stale-lifecycle protection, and key-envelope abort cleanup. Focused tests and the expanded native production UI gate pass.

## Completion record

DATA-01 is **complete** on `DB`. The protected preference vertical slice, encryption/key lifecycle, bounded worker coordinator, schema migration/store binding, strict IPC, user deletion/recovery controls, and development-only inspector satisfy AC1–AC10. Durable storage fails closed when its reviewed Windows artifact, key, schema, or database is unavailable; current-context coaching remains independent.

Verification on 2026-09-14:

- Isolated source-build gate: SQLCipher `4.17.0 community`, OpenSSL provider, Electron 43.3.0 / Node 24.18.1 / Node-API 10 / Windows x64. Correct key, wrong key, no key, `cipher_integrity_check`, encrypted database header, rollback-journal plaintext canary absence, `TEMP_STORE=2`, runtime memory temp storage, async safeStorage, utility process, and relocated layout passed.
- `pnpm --filter @ai-message-coach/desktop test:native-memory`: exit 0 outside the restricted process sandbox. Electron 43.3.0 / Node 24.18.1 / Node-API 10 on Windows x64 passed production settings interaction, clear cancellation/confirmation, unavailable-reset UI, production inspector absence, restart persistence, development inspection/key exclusion, v1→v2 migration, wrong/no-key and wrong-store rejection, corrupt/future-store preservation, stale and delete/recreate conflicts, generation invalidation, encrypted-at-rest inspection, relocated native loading, and async safeStorage. Earlier in-sandbox Electron starts failed before test execution because the GPU process could not start; they were not counted as storage results.
- A copy of the exact repository `dist` tree was relocated outside the workspace and the same Electron gate exited 0.
- `pnpm lint`: exit 0.
- `pnpm typecheck`: exit 0 across six workspace projects.
- `pnpm test`: exit 0; 30 files and 203 tests passed.
- `pnpm build`: exit 0; all workspace builds passed and the reviewed Windows x64 native artifact was staged.
- `pnpm format:check`: exit 1 against the existing repository-wide 92-file formatting baseline. No repository-wide rewrite was performed; only newly added DATA-01 source/text files were formatted, after which lint/typecheck/test/build still passed.
- `git diff --check`: exit 0; existing LF-to-CRLF advisories only.
- `git branch --show-current`: `DB`.
- `git status --short`: DATA-01 changes remain uncommitted alongside pre-existing documentation and communication-skill work; none of that prior work was reverted or staged.

Next recommended milestone: prepare a separately approved DATA-02 execution plan for contacts and identity associations. Installer creation/signing and an actual packaged-ASAR installer smoke remain release work outside DATA-01; DATA-01 already verifies relocated native loading and deterministic `app.asar` → `app.asar.unpacked` path routing, and documents the required `dist/native/**` unpack rule.
