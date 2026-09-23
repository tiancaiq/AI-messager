# DATA-02 — Contacts and reversible identity associations

Status: complete
Owner: Codex
Started: 2026-09-14
Updated: 2026-09-15
Roadmap milestone: [DATA-02](../../docs/roadmap.md#data--memory-roadmap)
Working branch: `DB`
Prerequisite: [DATA-01](data-01.md), subject to the verification findings below

## Outcome

The encrypted local store provides contact, platform-identity, and reversible association persistence, lifecycle behavior, and strict trusted-process APIs. Same-name people remain separate, records survive restart, and deletion/versioning controls exist before any future observation pipeline begins populating them.

DATA-02 has no normal user-facing Contacts/Identities entry UI and exposes no directory mutation capability to the renderer. It is an internal identity-storage foundation, not automatic recognition or personalization; no record affects coaching yet.

The user subsequently authorized implementation of this plan. No later DATA/MEM milestone is authorized by that request.

## Scope

In scope:

- Trusted-internal contact create/read/rename/delete and bounded paginated inspection.
- Platform identities, including unknown namespace/identifier information, kept separate from confirmed person associations.
- Candidate, confirmed, rejected, and revoked identity-association lifecycle operations for future trusted internal producers.
- A transactional extension of the existing encrypted schema, strict cross-process contracts, referential integrity, and revision/generation conflict checks.
- Extension of the existing coordinator/utility path and development-only inspector; no directory preload/renderer API, second database, or second storage worker.
- Synthetic privacy, migration, same-name, correction, deletion, restart, and race tests.

Out of scope: normal user-facing contact/identity data entry or database management; automatic capture ingestion; screenshot-derived identity persistence; contact import or platform API integration; avatar/image embeddings; fuzzy matching; automated identity scoring; automatic cross-platform association; destructive contact merge; shared-account person attribution; self-account modeling; relationship assertions; generalized evidence/decision tables; conversation history; summaries; learned profiles; background acquisition; memory retrieval in coaching; new model calls; cloud/sync/accounts; or sending. Those remain later milestones in the [roadmap](../../docs/roadmap.md#data--memory-roadmap).

## Current state

### DATA-01 verification before implementation on 2026-09-14

DATA-01 is recorded as complete in its plan and README. Inspection and fresh validation confirm the encrypted preference implementation exists, but two reproduced gaps prevent an unconditional completion sign-off:

1. **Initial Balanced preference cannot be saved directly (AC3/AC9).** In `apps/desktop/src/renderer/LocalMemorySettings.tsx`, the dirty-state calculation substitutes `BALANCED` for an absent preference. On an empty store, selecting Balanced leaves Save disabled. Unset and an explicitly saved Balanced preference are different states. The native UI smoke chooses Concise and Detailed and misses this case.
2. **Lifecycle deadlines do not cover key loading or erasure (AC8).** In `apps/desktop/src/main/local-memory/coordinator.ts`, `start()` awaits `loadKey()` before installing the worker OPEN deadline. A never-settling key load leaves initialization/status pending without a timeout. `resetUnavailable()` also awaits `eraseStore()` without an enclosing deadline. The existing hung-open test covers a worker that never answers, not a key service that never returns. Coaching is independent, but the promised bounded settings operation is not satisfied.

Read-only diagnostics transpiled the current coordinator in memory with injected collaborators: a pending key load left initialization pending with zero deadline timers registered. A separate check of the exact UI predicate reproduced `dirty=false` for an unset preference and Balanced selection. No production store or source file was changed by these diagnostics.

Before DATA-02 schema work began, the authorized implementation closed these DATA-01 prerequisites separately: unset and explicitly saved Balanced now differ; key loading and unavailable-store erasure have abortable ten-second lifecycle deadlines; parallel resets coalesce; stale initialization cannot publish a worker; and key-envelope publication has abort checkpoints and temporary-file cleanup. Focused unit and production UI regressions pass.

Fresh verification results:

| Check | Result |
|---|---|
| `git branch --show-current` | `DB` |
| `pnpm lint` | PASS, exit 0 |
| `pnpm typecheck` | PASS, exit 0, six workspace projects |
| `pnpm test` | PASS, exit 0, 30 files / 203 tests |
| `pnpm build` | PASS, exit 0, reviewed Windows native artifact staged |
| `pnpm --filter @ai-message-coach/desktop test:native-memory` | Initial restricted-sandbox run failed during Electron page/GPU/cache startup; not counted as a storage failure. Approved rerun outside that sandbox passed, exit 0 |
| Native rerun matrix | Electron 43.3.0, Node 24.18.1, Node-API 10, Windows x64; encrypted CRUD/restart, wrong/no key, store binding, v1 migration, corrupt/future-store preservation, generation conflicts, relocated loading, safeStorage, production settings UI, and inspector isolation passed |
| In-memory boundary diagnostics | Reproduced the two uncovered conditions above; no new tests or application fixes committed |

The prior DATA-01 record also reports a repository-wide formatting failure. No formatting-baseline cleanup is included here. Installer signing and actual packaged-ASAR distribution remain release work, not newly discovered DATA-01 blockers.

### Existing implementation to extend

- `packages/contracts/src/local-memory.ts` owns strict snapshots, commands, errors, generation/settings revisions, the private worker protocol, and a schema-v2 inspector snapshot.
- `apps/desktop/src/main/local-memory/storage-utility.ts` owns encrypted open/configuration, v1-to-v2 migration, the `local_context` and `explicit_preference` tables, CRUD transactions, and read-only inspection. It currently has no foreign-key-dependent entities.
- `coordinator.ts` serializes worker commands with queue limits, operation deadlines, worker retirement, and response correlation; response types currently cover only preferences and the inspector.
- `ipc.ts`, main `index.ts`, preload `index.ts`, and renderer `env.d.ts` own authorized fixed-channel integration. Main starts storage without awaiting it before showing the coaching window.
- `LocalMemorySettings.tsx` and `LocalMemoryInspector.tsx` provide the existing UI patterns. The inspector is development-only and stays fixed/read-only; DATA-02 does not add a production contact-management UI.
- `apps/desktop/scripts/native-memory-gate.cjs` exercises real encrypted utility storage and production renderer interaction with synthetic IPC handlers. Extend it rather than replacing native coverage with mocks.
- Existing analysis lacks verified platform account IDs, reliable account namespaces, and per-message group participant identities. No recognition or attribution may be inferred from `OTHER`, a name, or an OCR handle.
- The working tree includes uncommitted DATA-01, documentation, and communication-skill changes. Preserve them and recheck overlapping files before implementation.

## Assumptions and decisions

### Internal identity storage, future observation

DATA-02 creates storage and lifecycle primitives only. No current renderer or production acquisition path invokes them. Future conversation-observation or memory milestones may populate contacts and unresolved identities through the trusted main-owned API after adding their own provenance, evidence, confidence, correction, and privacy acceptance criteria; that later work must not obtain direct SQLite access.

Unknown values stay null/unknown. Require at least a nonempty display label or identifier when creating an identity; do not save a wholly blank placeholder. Do not substitute the app's local context for a missing platform account namespace or treat observed text as a verified provider account. The current schema's `USER_ENTERED`/`USER_DECISION` provenance values are inactive compatibility placeholders with no production caller; an observation milestone must migrate them to truthful source semantics before automated writes are enabled.

Display names and platform names are not uniqueness keys. Two contacts named Alex are valid. Matching handles are not proof of one account across platforms, workspaces, owners, or time. Use literal identifiers for inspection and optional duplicate warnings only; no automatic merge, Unicode/case-based identity collapse, or permanent name-derived fingerprint. Even a confirmed user association does not authorize automatic reuse against screenshot hints.

Shared accounts remain unresolved for person attribution. A single contact may have multiple explicitly confirmed platform identities, but an individual identity has at most one current confirmed contact target. Self links are deferred until they have an actual caller.

### Minimal schema extension

Plan schema version **3**, provided version 2 is still current when implementation begins. Use one transactional migration and retain the existing store ID, context ID, dataset generation, explicit preference, and settings revision. Add a separate directory revision to the singleton context rather than overloading preference edits.

Only three new logical record categories are required:

| Record | Minimal content and invariant |
|---|---|
| Contact | Main/utility-generated UUID, local-context ownership, user label, row revision, created/updated times. Duplicate labels allowed; no inferred role, language, or style fields |
| Platform identity | UUID, ownership, optional platform/namespace/identifier kind/value and display label, `USER_ENTERED` origin, revision, created/updated times. Identity-defining fields are immutable after linking; changing them creates a new identity and an explicit reassociation workflow |
| Identity association | UUID, identity/contact references, candidate/confirmed/rejected/revoked state, revision, creation/decision/revocation times, and minimal structured UI-decision provenance. No raw transcript or free-text evidence narrative |

Enable and verify foreign keys on every connection before migrations/transactions. Enforce same-context parent references and at most one currently confirmed target per identity through database constraints, not only UI validation. Add indexes for owned directory listing, identity links, contact links, and current confirmation checks.

An unresolved identity has no effective confirmed association; it is not another competing boolean that can drift from link state. Keep provenance in this narrow association record until MEM-00 supplies shared evidence/decision infrastructure. A future migration must preserve authority, not duplicate the same writable claim in two stores.

Recorded decision times describe when a trusted decision operation occurred, not when a real-world account changed hands. Do not infer historical ownership start/end dates from creation or revocation timestamps. Retain meaningful rejected/revoked link history until scoped deletion; no age-only cleanup.

### Explicit transitions and correction

- New identity → unresolved. Selecting a potential contact may create a candidate; saving that candidate is not confirmation.
- Candidate → confirmed or rejected only through a future separately approved trusted decision path; DATA-02 has no caller for that transition.
- Confirmed → revoked through the trusted lifecycle API. Keep both contact records and the identity; remove the effective link immediately.
- Reassign → atomically revoke the old link and confirm a new one. No interval has two effective confirmed targets.
- Reconsider a rejected/revoked pair → a new explicit candidate decision/version preserving the prior record, not silent reactivation. Ordinary repeated create/propose requests cannot override rejection.
- A display-label rename does not reassign identity. Identifier/namespace changes must not rewrite the identity behind an existing attribution reference.

Every relevant change advances directory revision and the affected row/association revision. Any future caller or memoized association view must discard older revisions. DATA-02 has no message attributions, summaries, or model jobs to rebuild; test link-version invalidation now and leave downstream provenance-aware rebuilds to their owning milestones.

### Deletion and retention

Deleting a contact removes its association records. Delete an identity only if it was exclusively associated with that contact; preserve independently unresolved identities and identities referenced by another contact's candidate/history. Compute ownership/dependencies across all association states in the transaction, not just the effective link.

Deleting an identity removes all its associations but keeps the contacts. Revoke is not delete: it retains a correction/history record and removes current authority. Future callers must preserve these distinctions. No hidden tombstone with identity strings survives deletion merely to recognize the person again.

Clear all local memory must delete all new directory records as well as preferences, change dataset/context generation, and reset revisions atomically while preserving the wrapped-key/store binding and separate provider configuration. Unavailable-store recovery continues to use the existing enumerated file cleanup; do not add a second reset mechanism.

No later feature may add derived contact data without extending the same deletion contract. DATA-02 does not pre-build dependency graphs or claim to remove future summary/profile influence that does not exist yet.

### Bounds and failure behavior

Keep the existing 4 KiB request, eight-waiting-command, 250 ms lock-wait, and two-second ordinary-operation ceilings. Enforce an explicit 16 KiB response budget for new directory responses. Label max 120 characters, platform max 64, namespace max 128, identifier max 256; additionally enforce encoded byte limits. Reject overlong data with safe errors, never truncate an identifier.

List requests use keyset pagination, a requested maximum of 20 records, and a schema-validated cursor bounded to 512 bytes and bound to dataset/directory revision. Return fewer complete records if needed to fit the response budget, with a continuation cursor; do not drop fields or fetch the whole directory first. Changes invalidate stale cursors and require refresh. Use stable IDs for ordering; display labels need not be unique.

Each mutation targets one contact, identity, or association decision, with fixed SQL and no arbitrary batch input. Explicitly cap a single contact/identity's association set at 100 retained link records for this slice; reject additions safely at the cap without deleting history. Validate indexed deletion/reset under synthetic larger datasets and the inherited deadlines. If bounded atomic deletion cannot meet the gate, revise the design before implementation rather than add an unplanned job queue or erase history silently.

Storage being unavailable, busy, timed out, or in conflict must not affect Generate/Copy or add an AI call. Internal caller success requires a committed acknowledgement; uncertain writes use the existing retire/reopen/refresh path, not blind replay.

## Contracts and data flow

Add strict Zod schemas in a focused `packages/contracts/src/contact-directory.ts` and export through the existing index. Extend, rather than duplicate, the `local-memory.ts` worker request/result union and inspector version. Share existing error and dataset-generation vocabulary; keep directory revision distinct from settings revision.

Fixed operations: list/create/rename/delete contacts; list/create/delete identities; list/propose/confirm/reject/revoke/reassign associations; explicit reconsideration. Identity creation plus an optional candidate is one atomic internal operation; confirmation remains separate and currently has no production caller. Read operations return only bounded requested records. Mutations return only affected state and the new directory version, not the entire database.

Internal requests include dataset generation and expected directory revision; updates also identify the target record/version. Main/utility supplies context, UUIDs, decision authority, and timestamps. Unknown properties, verified-status overrides, SQL, paths, keys, source-analysis payloads, and arbitrary time/owner overrides are rejected. Errors must not echo names, handles, request payloads, native exceptions, or stable IDs into logs.

Flow: future trusted main-owned producer → typed coordinator method → existing keyed utility → checked transaction → validated bounded response → trusted caller. No contact-directory IPC handler or preload bridge exists. Every association decision compares versions inside the transaction. Deleted IDs are never reused; old generations/cursors/requests fail instead of recreating deleted records.

Keep the developer inspector limited to paginated read-only views of implemented records; retain the exact development authorization gate, no production inspector capability, no arbitrary query facility, and no unbounded join/snapshot. External inspection uses only a separately keyed encrypted temporary snapshot, never the live database or application key.

No route is added to `apps/api`; no change to `ConversationAnalysis`, coaching prompts, output guards, provider adapters, or skill selection is required. No API credentials or live model calls are needed.

## Implementation steps

1. **Close prerequisites separately.** Resolve the two DATA-01 findings under its own authorized repair, add regression evidence, and update its completion record. Reconfirm `DB`, current schema version, and overlapping work. DATA-02 code does not start merely because this plan exists.
2. **Contracts first.** Add `packages/contracts/src/contact-directory.ts` and colocated tests; minimally extend `local-memory.ts` and `index.ts`. Define bounds, operations, record/state shapes, revisioned cursors, and forbidden authority fields before consumers.
3. **Migration and persistence.** Extend `apps/desktop/src/main/local-memory/storage-utility.ts`; extract a focused directory SQL module in that same folder only as needed. Add schema-v3 migration, verified foreign keys, constrained association transitions, prepared statements, indexes, bounded reads, and atomic deletion/clear behavior. Preserve v1→v2 migration compatibility.
4. **Trusted integration.** Extend `coordinator.ts` and the private utility protocol with typed directory operations and tests. Do not register a directory IPC channel or expose these methods through preload/renderer types. Retain one worker, lifecycle reconciliation, queue limits, and sanitized errors.
5. **No user-facing slice.** Verify the production renderer contains no Contacts/Identities data-entry or lifecycle controls and the production preload has no directory method.
6. **Inspection and regression gates.** Keep the development-only inspector bounded/read-only and update schema-version tests. Add an external-tool workflow that exports a separately keyed encrypted temporary snapshot through the same coordinator/utility path. Extend `apps/desktop/scripts/native-memory-gate.cjs` for migration, CRUD, association constraints, deletion, restart, snapshot re-keying, and production UI absence, using synthetic names/identifiers only.
7. **Verification and handoff.** Run canonical/native checks, assess privacy and every acceptance criterion, and update README, architecture, memory, privacy, roadmap, and this record. No new dependency/native rebuild is expected; any change to the encryption artifact requires a fresh gate. No commit without request.

## Tests and evaluation

| Scenario | Required result |
|---|---|
| Two Alex contacts, same display label | Separate UUIDs and separately editable/deletable records; no implicit merge (DATA-00 M01) |
| Same handle on different platforms/namespaces; unknown namespace | Separate/unresolved records; no assumed verified account or person |
| Candidate saved, dialog dismissed, or pair rejected | No confirmed link; dismissal is not rejection; repeat proposal cannot override rejection |
| Two concurrent confirmations to different contacts | At most one current confirmed target; stale request conflicts without partial state |
| Revoke then reassign or explicitly reconsider | Old decision history preserved; old association revision unusable; new confirmation explicit |
| Edit identifier on a linked identity | No silent retargeting; new record/reassociation required |
| Group/shared-account hints or hostile text in labels | No message attribution or management instruction execution; UI renders text safely |
| Delete contact with exclusive and shared identity history | Exclusive records removed; unrelated contacts/identities preserved; no dangling links |
| Delete identity / clear-all / unavailable reset | Defined records removed, stale work rejected, no resurrection after restart; provider configuration preserved |
| v2 store with saved preference; fresh store; v1 fixture | Transactional migration to v3 preserves existing binding/data; version-chain and foreign-key checks pass |
| Failed migration, corrupt/future store, injected mutation failure | Existing data preserved, no partial records, safe unavailable result |
| Page size/bytes/cursor/revision and 100-link cap boundaries | Bounded complete rows; overflow rejected or paginated; stale cursor requires refresh; no silent history loss |
| Unauthorized IPC, forged ownership/verification, malformed response | Rejected/sanitized; no key, SQL, path, or general inspector exposed in production |
| Native persistence and production UI smoke | Save/restart/read and internal directory lifecycle work with actual encrypted storage; production preload/renderer expose no contact-directory management; inspector remains development-only |
| External encrypted inspection | Temporary snapshot opens with its separate passphrase, rejects the live key, preserves schema version, and never targets the live store for mutation |
| Slow/failing directory operations | Foreground coaching independent; no extra provider calls or raw conversation persistence |

Use deterministic unit tests for contract/state transitions and coordinator authorization; real SQLCipher tests must prove relational constraints and transactional migrations rather than simulate successful answers. Native UI tests must cover all meaningful selections and empty states, incorporating the DATA-01 Balanced regression. No live provider evaluation is required.

## Acceptance criteria

- [x] AC1: DATA-01 closure findings are resolved and independently verified before DATA-02 implementation proceeds.
- [x] AC2: Schema migration preserves existing preferences/store binding and creates only the scoped contact/identity/association structures with enforced ownership and foreign keys.
- [x] AC3: Contact and unresolved identity CRUD work offline and survive restart; identical labels/handles do not merge people or confer verified status.
- [x] AC4: DATA-02 exposes no production caller that can confirm associations; candidates, rejected/revoked links, and unknown/shared accounts never imply current person attribution.
- [x] AC5: At most one effective confirmed target per identity; revocation/reassignment is atomic and reversible through explicit decisions with preserved meaningful history.
- [x] AC6: Version checks invalidate stale association views, mutations, and paginated cursors; deleted or cleared records cannot return through late work.
- [x] AC7: Contact/identity deletion and clear-all remove the documented dependents while preserving unrelated data and separate provider configuration.
- [x] AC8: Every persisted category has bounded trusted-internal lifecycle operations; the development inspector remains read-only and absent in production, and no renderer directory mutation API exists.
- [x] AC9: Request/response/page/association/time limits and sanitized errors are verified; directory failures do not block coaching or add provider calls.
- [x] AC10: No screenshots/messages/avatars/transcripts, inferred relationship/habit data, keys, or content-bearing logs enter the new path; identity confirmation is not advertised as screenshot recognition.
- [x] AC11: Canonical checks, native encrypted migration/restart/constraints, production UI absence, temporary snapshot re-keying, privacy review, and all synthetic scenarios pass with recorded evidence on `DB`.

## Validation commands

Run from the repository root during implementation:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm --filter @ai-message-coach/desktop test:native-memory`
- `git diff --check`
- `git status --short`
- `git branch --show-current`

The existing `pnpm dev:desktop` and `pnpm --filter @ai-message-coach/desktop start` provide development/production-bundle launch checks if needed. Keep tests isolated from the user's store and do not load credentials or call providers. Record sandbox launch failures separately from actual test failures; skipped/unrun native checks are not passes. Review Markdown section structure and relative links separately from the ignored Prettier documentation paths.

## Risks, rollback, and limitations

- **Prerequisite gaps:** passing current suites does not close untested DATA-01 edge cases. This plan is ready for review, not a declaration that DATA-02 may start.
- **Misidentification:** no DATA-02 production caller confirms an association or identifies a future observed speaker. Future automated population must keep observation separate from confirmation.
- **Correction versus erasure:** revocation retains history; deletion erases it. Future callers must preserve that distinction.
- **Migration and relationship constraints:** SQLite foreign-key enforcement must be enabled and checked; generic schema declarations alone do not prove it. Test the complete old-to-new migration chain and clear-all with nonempty new tables.
- **Growth:** bounded pages and indexed operations are mandatory. The initial link cap can prevent further history recording and needs explicit internal handling, not hidden deletion. Any future raised limit needs new deletion/latency evidence.
- **Rollback:** keep schema-v3 files encrypted and intact. Older DATA-01 builds reject newer stores; do not implement destructive downgrade or plaintext export. Disable directory functionality if needed while preserving data.
- **Privacy:** identity strings become new sensitive durable content. Windows x64 encryption/key limitations remain those of DATA-01; OS backups and compromised sessions are not solved here.
- **Deferred influence:** downstream attributions do not yet exist. Their invalidation/rebuild and any coaching use require MEM-01/MEM-05 and their own approval/tests.

## Progress log

- 2026-09-14: User requested a DATA-01 completion check and DATA-02 plan. Confirmed `DB`, inspected relevant docs, contracts, utility/coordinator/key/IPC/UI implementation and tests, preserved existing uncommitted work, and reran canonical/native verification.
- 2026-09-14: Reproduced initial-Balanced saving and pre-worker key-loading timeout gaps. Recorded DATA-01 repair prerequisites without changing application code or rewriting its historical completion record.
- 2026-09-14: Drafted this bounded manual-contact/identity plan. No DATA-02 implementation, SQL migration, new dependency, provider request, or commit was made.
- 2026-09-14: User authorized implementation. Closed the two DATA-01 prerequisites, added Zod-first directory contracts, schema-v3 migration and relational constraints, fixed trusted IPC/coordinator integration, user controls, paginated development inspection, and deterministic/native tests without adding a dependency or provider call.
- 2026-09-14: User corrected DATA-02 product scope. Removed the normal Contacts/Identities UI, production directory IPC handler, preload bridge, renderer type, styles, and UI smoke. Retained only the coordinator/utility internal API and read-only development inspector. Added a no-dependency development command that creates a separately passphrased, SQLCipher-v4 encrypted temporary snapshot through `sqlcipher_export()`, marks the copy read-only, and deletes it on confirmation; the live key and live database are never provided to the external tool.
- 2026-09-15: Added the requested development-only Letos 4.0.3 wrapper. It detects the installed executable, verifies the official SQLite3MultipleCiphers plugin, registers only a separately keyed snapshot in a disposable portable profile, forces SQLCipher compatibility 4 plus `query_only`, launches Letos without path/key arguments, and deletes the profile/password/snapshot after exit. The lower-level snapshot command remains available; production IPC, encryption, renderer access, and the live store are unchanged.
- 2026-09-15: Verified the wrapper against installed Letos 4.0.3 and `libDbSqliteMc.dll` on Windows x64. Letos held the re-keyed snapshot open through the disposable connection while the normal Letos settings file remained unchanged; closing only the verification instance returned exit 0 and removed the snapshot/profile directory. Canonical lint, typecheck, tests (34 files / 218 tests), build, native encrypted gate, and `git diff --check` passed.

## Completion record

DATA-02 is complete on `DB` as an internal storage milestone. The encrypted store is schema v3 and preserves v1/v2 preferences and store binding. Contacts, platform identities, and association history share the existing protected utility-process path. Composite foreign keys enforce local-context ownership; a partial unique index and checked transactions enforce one current confirmed target, explicit transitions, atomic reassignment, scoped deletion, and generation/revision invalidation. Production exposes no contact-directory IPC/preload/UI capability. The development inspector remains fixed and read-only, while external inspection uses only a separately keyed encrypted temporary snapshot.

Verification on 2026-09-14:

- `pnpm lint`: exit 0.
- `pnpm typecheck`: exit 0 across six workspace projects.
- `pnpm test`: exit 0; 33 files and 215 tests passed.
- `pnpm build`: exit 0; all workspace builds passed and the reviewed Windows x64 artifact was staged.
- `pnpm format:check`: exit 1 against the existing 83-file repository-wide formatting baseline. All files added or changed for this scope correction pass a focused Prettier write/check; no repository-wide rewrite was performed.
- `pnpm --filter @ai-message-coach/desktop test:native-memory`: exit 0 outside the restricted process sandbox. Electron 43.3.0 / Node 24.18.1 / Node-API 10 on Windows x64 passed production directory-preload/UI absence, read-only inspector isolation, v1→v3 and v2→v3 migration, duplicate-name/handle separation, internal association transitions, one-confirmed-target enforcement, stale view/cursor rejection, bounded paging, the 100-link cap, deletion/restart/clear, wrong/no-key, wrong-store, corrupt/future preservation, relocation, encryption, safeStorage, and independently re-keyed debug-snapshot checks.
- `pnpm --filter @ai-message-coach/desktop debug:memory-snapshot`: exit 0 outside the restricted process sandbox against the development store. It produced a no-window SQLCipher-v4 temporary snapshot with a separate passphrase; the generated test snapshot directory was deleted immediately afterward.
- Privacy review found no new renderer database/key access, plaintext store/export, content-bearing log, screenshot/message persistence, automatic recognition/merge, model call, or application API route.
- No dependency, native artifact, provider configuration, or coaching behavior changed. No commit was made.

Known limitations: no observation pipeline populates the directory yet; the inactive `USER_ENTERED`/`USER_DECISION` provenance vocabulary must be migrated before future automated producers write records; editing identity-defining fields requires delete/recreate and explicit reassociation; SQLiteStudio/Letos with SQLite3MultipleCiphers is not bundled or installed by the application; other operating systems/architectures, installer signing, and packaged-ASAR distribution remain separately gated; no association affects screenshot attribution or coaching until its later milestones exist.

Next recommended milestone: prepare and approve MEM-00 (assertion/evidence foundation). DATA-03 relationships, observation processing, summaries, profiles, and coaching retrieval remain out of scope.
