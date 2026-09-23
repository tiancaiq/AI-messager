# MEM-00 — Assertion and evidence foundation

Status: complete
Owner: Codex
Started: 2026-09-15
Updated: 2026-09-15
Working branch: `DB`
Roadmap milestone: [MEM-00](../../docs/roadmap.md#data--memory-roadmap)
Prerequisites: [DATA-01](data-01.md) and [DATA-02](data-02.md)

## Outcome

Give stored knowledge a precise meaning: what is claimed, whom it concerns, where it came from, whether it is only a candidate or explicitly accepted/rejected, and whether it still applies. Corrections must beat guesses, and deletion must remove exclusive evidence and dependent influence.

The first real application path remains the existing message-length preference. Its current save/read/edit/delete behavior will run through the assertion/evidence foundation without changing the UI or coaching. Synthetic contact-scoped cases prove the remaining lifecycle operations before a future observation pipeline can populate them.

This milestone does not make the app learn from screenshots, add a manual fact-entry screen, or personalize replies. The current user request is to review this plan, not to implement it.

## Scope

In scope:

- Strict assertion, evidence, evidence-link, and decision contracts with one small typed predicate family.
- User/global and contact-scoped ownership, nullable/qualified time, separate acceptance and applicability, and explicit correction precedence.
- Internal candidate creation, support linking, confirmation/rejection, correction/supersession, reconsideration, inspection, and deletion operations.
- Migration of the existing explicit preference into one canonical source of truth, preserving its public API and controls.
- Extension of schema v3, the existing protected utility/coordinator, bounded development inspection, encrypted debug snapshots, and contact/reset deletion behavior.
- Deterministic and real encrypted migration/lifecycle tests; no model evaluation.

Out of scope: capture ingestion, automatic identity population, OCR schema expansion, raw-text evidence storage, arbitrary facts/free-form notes, relationship roles/history (DATA-03), episodes/queues/processing receipts (MEM-01), summaries, model extraction or memory skills, learned profiles, embeddings, coaching retrieval (MEM-05), contact-entry UI, a natural-language memory manager, cloud/sync/accounts, new providers, and sending.

The latest DATA-02 scope explicitly removed production contact-directory entry/IPC/UI. Preserve that decision. Internal lifecycle commands and synthetic fixtures do not authorize real-world automatic acquisition or impersonate a user confirmation. Before a later milestone persists real acquired candidates, it must ship enablement and user-facing review/correction/delete controls; a development inspector is not a substitute for those controls.

## Current state

- `DB` is active. The working tree contains uncommitted DATA-00–02, native/debug tooling, and communication-skill changes. Preserve all existing work and recheck shared files before implementation.
- README, DATA-02's completion record, and the current docs describe schema v3 as complete. Its latest recorded validation is 34 test files / 218 tests plus canonical and Windows native checks. This planning turn inspected that evidence; it does not claim a fresh full DATA-02 audit or rerun.
- `packages/contracts/src/local-memory-core.ts` owns shared generation/revision/error primitives. `contact-directory.ts` owns strict directory records and operations. `local-memory.ts` composes worker/inspector/result schemas and preference IPC.
- `apps/desktop/src/main/local-memory/storage-utility.ts` owns cipher verification, migrations, preference SQL, directory dispatch, clear-all, and debug export. `directory-store.ts` implements the relational directory and transactional association lifecycle. Extend this store, not another database/service/package.
- Existing tables include `local_context`, `explicit_preference`, `contact`, `platform_identity`, and `identity_association`. There are no assertion/evidence/decision tables or implemented coaching memory reader.
- The existing preference is `messageLength = CONCISE | BALANCED | DETAILED`, with `USER_SETTING` origin and created/updated times. The renderer can manage only that preference, not general contact records.
- Directory identity origin and association authority still use `USER_ENTERED`/`USER_DECISION` literals. DATA-02 records that they need truthful provenance migration before automated producers use them. MEM-00 must not turn those records into observed/verified evidence or reuse their authority labels for synthetic or future machine-generated facts.
- `coordinator.ts` provides one bounded trusted worker, cancellation/retirement, queue limits, and unknown-write reconciliation. `ipc.ts` and preload expose narrow authorized operations; the inspector is development-only.
- `LocalMemoryInspector.tsx`, `debug-snapshot.ts`, and the Letos wrapper inspect existing records read-only; debug copies have independent encryption keys. Their schema-version handling must evolve with the store, without opening the live database externally.
- Shared-contract tests, coordinator/key/IPC tests, and `apps/desktop/scripts/native-memory-gate.cjs` provide reusable patterns. Native tests currently exercise schema-v1/v2→v3, relational constraints, production directory absence, and encrypted snapshots.

Governing semantics: [memory contract](../../docs/memory.md), [architecture](../../docs/architecture.md#data--memory-boundaries-data-00), [privacy](../../docs/privacy.md#local-memory-storage-data-00), and [product behavior](../../docs/product-behavior.md).

## Assumptions and decisions

### 1. Prove the foundation with a current caller

Start with `REPLY_LENGTH_PREFERENCE`, using the existing three enum values. It means the user's preferred length for coach drafts globally or when addressing a specified contact; it is not a psychological fact about the contact and not a measured habit. The subject/scope union is global local user or one existing contact, with no arbitrary nested context object.

Global scope has the existing preference UI as a real caller. Contact scope and candidate/correction transitions are exercised through internal APIs and synthetic tests only in this milestone. Do not introduce relationship predicates, employer facts, custom predicate strings, generic JSON values, or free-text evidence just to demonstrate extensibility. New predicate families later require their own value schema, multiplicity, conflict, time, and deletion rules.

### 2. One canonical preference truth

Plan schema **v4**, provided v3 remains current at implementation start. Transactionally move any saved global preference into a confirmed assertion with migration-labelled evidence. Rewire existing preference read/save/delete operations to that canonical record set. Remove the old writable `explicit_preference` table after verified migration; the inspector's existing preference representation becomes a bounded projection, not a second independently mutable source.

Preserve store ID, context, generation, settings/directory revisions, value, and existing timestamps. An empty preference table creates no default assertion. Migration is not new evidence of a user action: record migration time separately, retain known source timestamps, and do not invent the original confirmation time or historical settings values.

Saving the same current value is not additional independent evidence. A changed value supersedes the old accepted version and records a distinct explicit setting decision. Deleting the preference removes all retained global assertions/evidence/decisions for this predicate, including rejected and superseded values, so Refresh or future reconsideration cannot restore a deleted preference. Existing Save/Delete/Clear controls remain sufficient for the only production-write category.

### 3. Minimal records, explicit authority

| Record | Required meaning |
|---|---|
| Memory assertion | Local ownership, UUID, typed scope/predicate/value, candidate/confirmed/rejected acceptance, active/superseded lifecycle, current/historical/unknown applicability, revision, replacement reference, and qualified time fields |
| Evidence record | A bounded typed source fact and provenance, source-local deduplication reference, implicated subjects, optional association ID/revision, source/recorded times, and supported confidence dimensions where applicable |
| Assertion–evidence link | Same-context assertion/evidence pair and SUPPORTS, CONTRADICTS, or CONTEXTUALIZES role; duplicate pairs cannot multiply support |
| Memory decision | Target assertion/revision, explicit operation and scope, authority/source, recorded decision time, and optional replacement/reconsideration reference; no raw prose audit log |

Evidence payloads for this slice contain only the typed preference value/scope and source metadata, never a quote, screenshot, transcript, prompt, draft, reply, or arbitrary content blob. Every evidence record must be retained for a known assertion/decision; do not introduce an orphan raw-observation bucket.

Production evidence sources are actual `USER_SETTING` actions and labelled legacy-setting migration. Synthetic tests supply clearly labelled fixture provenance through the trusted test path, not a renderer-accessible fixture command. Future observation producers need their own real provenance contract and approval before they can submit records. No string in captured conversation content can assert `USER_CONFIRMED` authority.

Explicit decisions are authority, not confidence 1.0. Unknown confidence/time is null or an explicit unknown variant, not zero or today. Keep extraction/attribution/predicate confidence separate when present in test-supported evidence; confidence never promotes acceptance by itself. No model-derived calibration is claimed.

### 4. State and correction rules

- New non-user-confirmed evidence creates a candidate, never a confirmed assertion.
- Confirm/reject is a separate trusted decision operation. No production generic confirmation IPC is exposed yet; only the existing explicit preference Save produces production confirmation.
- At most one active confirmed reply-length preference exists per exact subject/predicate scope. Conflicting candidates can remain reviewable without changing that preference.
- Rejection records a minimal scoped correction constraint. Repeated or duplicated supporting evidence does not reactivate the rejected proposition. Explicit reconsideration may create a new candidate linked to that decision; it does not itself confirm it.
- Replacement is atomic: create the replacement evidence/assertion/decision and supersede the prior accepted assertion together. A failed transaction changes neither.
- Historical/superseded does not mean false or deleted. A change made today does not prove when a previous real-world preference stopped applying. No blanket 30/90-day purge.
- A narrow deterministic policy module validates transitions and returns internal eligibility reasons. It does not rank memories, build prompts, implement a general MemoryReader, or add coaching personalization.

Temporal representation supports unknown, exact instant with offset, and calendar date/month precision without converting a month into its first day. Reject impossible ranges; known end is exclusive. `recordedAt`/`updatedAt`, original decision time, and source applicability are distinct. Present-day processing never refreshes an old source time. The initial preference path needs only the known metadata; historical fixtures verify that missing precision is preserved.

### 5. Ownership, deletion, and attribution dependencies

Use enforced same-context foreign keys and indexed subject references. Main/utility assigns ownership and IDs. Add a separate memory revision to the context; retain settings and directory revisions for their current callers. Each memory write checks generation, expected memory revision, and referenced record/association revisions inside its transaction. Existing preference writes advance both settings and memory revisions atomically; directory operations that invalidate memory advance the necessary revisions in the same transaction.

Evidence may be shared by a bounded number of assertions. Deleting an assertion removes its links/decisions and evidence that has no remaining owner; shared evidence survives only if it remains permissible for other retained assertions. Deleting evidence removes its links and makes solely supported assertions ineligible. A separately confirmed assertion may survive only through independently retained explicit-confirmation evidence, not through a boolean left over from deleted support.

Contact deletion must include contact-scoped assertions, their decisions, exclusive evidence, and any evidence record naming that contact, even if another assertion also referenced it. Reevaluate remaining support and remove/suppress assertions that lose it. For this slice, bound evidence to one subject; mixed-subject prose/summary evidence is rejected rather than silently losing deletion provenance.

If fixture evidence depends on an identity association, retain its exact ID/revision. Revoking/reassigning/deleting that association invalidates its dependent attribution in the same transaction; never transfer old facts to the new contact. Independently supported facts remain intact. An old association cannot be treated as current because its contact row still exists.

Clear-all deletes assertions, decisions, links, evidence, directory records, and the preference projection, changes the dataset generation, and preserves provider configuration/store-key binding. No hidden identity/content fingerprints or deleted-value tombstones remain. Stale requests cannot recreate deleted values. Extend existing explicit deletion paths; do not rely on foreign-key cascade alone to recompute support validity.

### 6. Finite budgets and real-data admission

Initial contract limits:

- 4 KiB encoded request and 16 KiB encoded response, using the existing worker transport ceilings.
- At most 20 complete records per revision-bound keyset page; return fewer complete records to fit bytes, never truncate meaning. Cursor at most 512 bytes and bound to section, subject/filter, generation, and memory revision.
- One assertion decision per command; at most eight evidence links per assertion and eight assertion references per evidence record.
- At most 100 retained assertion versions per subject/predicate and 100 decisions per assertion. At the cap, reject new persistence with a safe explicit capacity result; never silently delete meaningful history or override rejection. Existing preference UI must show a failed save truthfully, with existing deletion available. These are proposed small-store ceilings to validate, not an automatic pruning policy.
- Reuse the existing one-worker/eight-waiting-command queue, 250 ms lock wait, two-second ordinary-operation deadline, and bounded open/reset lifecycle; no new retry loop or background work queue.

Exercise deletion and migration against maximum local scopes and large synthetic directories. Indexed atomic deletion must fit the applicable bounded operation. If it cannot, revise the plan before implementation to define logically immediate, resumable deletion; do not silently add an unbounded transaction or deferred cleanup service. Disk pressure fails closed without dropping retained knowledge.

General production acquisition stays absent. User-facing candidate review/confirmation/rejection and independent acquisition/use settings are release prerequisites for the first real automatic memory producer. Do not quietly defer those controls beyond the milestone that introduces that producer.

## Contracts and data flow

Add `packages/contracts/src/memory-assertion.ts` and colocated tests for typed values/scopes, provenance, temporal values, transitions, bounded internal requests/results, and inspector pages. Reuse `local-memory-core.ts` for generation/error vocabulary and `local-memory.ts` for the private worker union. Keep type inference Zod-first.

An existing preference action follows its unchanged fixed preload method → authorized main handler → coordinator → utility → atomic assertion/evidence/decision transaction → existing validated preference snapshot. Generic assertion commands are trusted internal operations only, like DATA-02 directory methods. No renderer authority, SQL, keys, paths, or arbitrary source payload is accepted.

Development inspection extends the existing fixed section/page schema with assertions, evidence, links, and decisions. Reads are bounded and read-only; later roadmap sections remain absent. Update schema-version checks and independently keyed encrypted debug export together. Do not run a debug snapshot against real user data merely to validate the migration.

Keep state-transition policy independent of Electron and the SQLite wrapper; place the small pure policy module beside its current persistence caller and inject it in tests. SQL, migrations, and transaction orchestration stay in the desktop adapter. No new workspace package, provider adapter, skill registry, or service is needed.

## Implementation steps

1. **Confirm scope.** Approve this plan, especially canonical preference migration and internal-only generic memory operations. Recheck `DB`, latest schema, current DATA-02 completion evidence, and overlapping files. Record a baseline before changing code.
2. **Define contracts and policy tests.** Add `packages/contracts/src/memory-assertion.ts` and tests. Define predicate rules, temporal precision, provenance, decision authority, limits, and legal/illegal transitions before SQL or producers.
3. **Implement schema-v4 migration.** Add focused `assertion-store.ts` and a pure `assertion-policy.ts` under `apps/desktop/src/main/local-memory/`; extend the existing migration chain in `storage-utility.ts`. Migrate the global preference without duplicating writable truth, preserve directory data and key binding, and verify foreign keys plus migration rollback.
4. **Implement bounded lifecycle commands.** Add candidate/support/decision/correction/reconsider/delete/page operations through the existing coordinator/private utility protocol. Extend directory revocation/deletion and clear-all to handle actual assertion/evidence dependencies atomically. Add revision, cap, queue, timeout, and late-result regressions.
5. **Connect only approved callers.** Rewire the existing preference SQL/handlers to the canonical assertion store while keeping its visible behavior and bridge contracts compatible. Extend the development-only inspector and debug-snapshot version handling. Do not add a generic production fact-entry or directory management API.
6. **Prove the slice.** Extend contract/policy/coordinator/IPC tests and `apps/desktop/scripts/native-memory-gate.cjs` for v1/v2/v3→v4 migration, restart, evidence/correction lifecycles, deleted support, association invalidation, cap boundaries, and unchanged production surface. Use synthetic records only.
7. **Review and hand off.** Run canonical/native checks, document acceptance evidence, update README/architecture/memory/privacy/roadmap and this record. Preserve unrelated edits; no commit without request. Keep future real-acquisition UI and provenance gates explicit.

## Tests and evaluation

| Case | Expected result |
|---|---|
| Saved global preference or empty v3 store | Same setting or unset state after migration; no fabricated history or duplicate source of truth |
| Concise/Balanced/Detailed save, edit, delete, reopen | Existing UI behavior preserved, including initially saving Balanced; delete removes retained global preference history |
| Candidate with strong confidence or repeated support | Still candidate; no fabricated user decision or automatic trust |
| Explicit rejection followed by ten proposals | Rejection wins in its scope; no silent reactivation (bounded MEM-00 part of M05) |
| Correction/replacement with injected transaction failure | No partial supersession, orphan evidence, or contradictory effective preference |
| Same evidence linked repeatedly | Unique link, no extra independent support or updated source time |
| Old/date-only/month-only/unknown source | Original precision retained; no invented instant or freshness; historical records survive age |
| Delete one assertion sharing evidence | Exclusive evidence/decisions deleted; permissible shared evidence retained |
| Delete sole evidence versus independently confirmed support | Unsupported assertion excluded; independently supported claim survives with explicit lineage |
| Delete contact or revoke/reassign association | Dependent attribution invalidated; no fact moves to another contact; unrelated support preserved |
| Cross-context/dangling references and stale generation/revisions | Transaction rejected, no partial state or resurrection |
| Clear/reset, migration crash, wrong/no key, corrupt/future schema | Existing fail-closed behavior preserved; all newly stored categories covered |
| Limits at/over thresholds, multibyte input, stale cursor | Bounded complete output or safe rejection; no automatic history deletion |
| Production/development boundary and failure logs | Generic mutation/inspector absent from production; no raw content, IDs, or secrets in errors/logs |
| Native migration/export and foreground regressions | Correct schema in separately keyed snapshots; preference/capture/coaching/Copy remain independent; no new provider calls |

Default tests remain credential-free. Test fixtures simulate proposals and user decisions honestly; they do not demonstrate live extraction, identity accuracy, or improved coaching. Actual encrypted integration is required for migration/constraints/deletion; mocks alone cannot close those criteria.

## Acceptance criteria

- [x] AC1: Approved scope stays internal for generic assertions; no manual contact/fact-entry UI, acquisition pipeline, or coaching integration is added.
- [x] AC2: Shared strict schemas distinguish claims, evidence, acceptance, authority, applicability, precision, and revisions; arbitrary predicate/value/content payloads are rejected.
- [x] AC3: Schema-v4 migration preserves all existing preference/directory/key-binding state; one canonical preference truth and the existing UI behavior survive restart.
- [x] AC4: Evidence alone never confirms a candidate; explicit scoped correction/rejection defeats repeated proposals; reconsideration is distinct from confirmation.
- [x] AC5: Atomic replacement and separate historical/superseded state preserve meaningful history without invented timestamps or age-based purges.
- [x] AC6: Same-context references, revision/generation checks, and exact association dependencies prevent stale writes, misattribution, and resurrection.
- [x] AC7: Assertion/evidence/contact deletion, association revocation/reassignment, and clear-all remove exclusive data and suppress unsupported influence while preserving independently supported unrelated knowledge.
- [x] AC8: Bounded internal inspection and existing preference controls cover all real production writes; generic real-data acquisition remains gated on future user review/correction/deletion controls.
- [x] AC9: Transport, pagination, link/history caps, operation/lifecycle timeouts, and capacity failures are enforced without silently truncating or deleting useful knowledge.
- [x] AC10: Assertion/evidence payloads contain no raw capture/text, prompts, generated replies, provider credentials, or key values. Operational logs contain no evidence values, stable subject IDs, or secrets; encrypted debug snapshots remain isolated.
- [x] AC11: Canonical checks, native encrypted migration/restart/lifecycle tests, privacy review, and production-surface regressions pass with evidence recorded on `DB`.

## Validation commands

During implementation, run from the repository root:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm --filter @ai-message-coach/desktop test:native-memory`
- `git diff --check`
- `git status --short`
- `git branch --show-current`

Use existing development/production launches only with isolated synthetic storage for UI checks. No live model call is needed. Record native sandbox-startup failures separately from actual tests. Do not claim existing DATA-02 test results as MEM-00 evidence. Markdown links/sections require separate checks because documentation is excluded from the current formatter configuration; leave the unrelated repository formatting baseline untouched.

## Risks, rollback, and limitations

- Canonical preference migration touches working production behavior. Validate both old-version migrations and unchanged current settings IPC before enabling schema v4; do not keep dual-write compatibility tables.
- Generic internal confirmation is not authorization for an automatic producer. A future producer needs truthful observed provenance, enablement, source attribution, and real user controls before writing sensitive data. Existing directory provenance must not be repurposed silently.
- A small predicate family proves architecture but is not a general personal knowledge system. Roles/relationships, observations, summaries, habits, and retrieval remain separately scoped.
- Evidence deletion and association revocation can invalidate more than the directly targeted row. This is why dependency-aware transactions and support revalidation belong here, before production learned memory.
- Initial history caps may reject further saves until explicit deletion; no silent retention policy is implied. Bounds and atomic-deletion feasibility must be tested and reviewed before rollout.
- Rollback preserves the encrypted newer store and disables incompatible functionality; older code fails closed on schema v4. No destructive downgrade or plaintext backup. Native encryption dependencies/artifact should remain unchanged.
- SQLCipher/Windows OS-user protections, external debug-copy limitations, signing/installer gates, and existing live-quality obligations remain those already documented in DATA-01/02.

## Progress log

- 2026-09-15: User requested the plan first. Confirmed `DB`, inspected current source/contracts/tests and governing documentation, and found the recorded DATA-02 scope correction removing production contact-entry UI.
- 2026-09-15: Drafted MEM-00 as an internal assertion/evidence foundation with the existing preference as its concrete production caller, synthetic contact lifecycle coverage, and no general production memory-entry surface. No implementation or dependency change made.
- 2026-09-15: User authorized implementation. Added strict typed contracts and pure transition policy, schema-v4 assertion/evidence/link/decision storage, canonical preference migration, internal coordinator lifecycle calls, dependency-aware contact/association deletion, and bounded development inspection. No dependency, automatic producer, production generic-memory IPC, model call, or coaching reader was added.
- 2026-09-15: Extended the Windows native gate with v1/v2/v3 migration, restart, correction/reconsideration/rejection, evidence-role/link constraints, contact and association invalidation, capacity limits, encrypted snapshot, and production-surface checks. Updated README, architecture, privacy, memory, and roadmap status.

## Completion record

MEM-00 is complete on `DB`. The encrypted local store is schema v4. `explicit_preference` is removed after a transactional migration into one canonical confirmed reply-length assertion with migration-labelled evidence; the existing preference renderer/preload contract remains fixed. Generic assertion commands are trusted coordinator/utility internals only. They implement typed subjects/values, source and valid-time precision with end-exclusive ranges, separate nullable confidence dimensions, support/contradiction/context evidence roles, candidate/confirmation/rejection/reconsideration/replacement history, revision-bound pages, and explicit capacity failures.

Deletion is dependency-aware in the same transaction as directory lifecycle changes: deleting contacts or identities and revoking/reassigning associations removes attributable evidence and assertions that lose all support, while clear-all removes assertion/directory state and changes generation. The development-only inspector reads the new sections through the same coordinator; production has no inspector or generic directory/assertion mutation bridge. The separately passphrased SQLCipher debug snapshot remains encrypted and read-only.

Verification on 2026-09-15: `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` pass; the unit suite reports 36 files / 226 tests. `pnpm --filter @ai-message-coach/desktop test:native-memory` passes on Windows x64 with Electron 43.3.0, Node 24.18.1, N-API 10, SQLCipher Community 4.17.0, and explicit v1/v2/v3→v4 migration, lifecycle, invalidation, cap, encrypted-at-rest, and production-surface evidence. The expected wrong-key SQLCipher HMAC diagnostic appears during that negative test. `git diff --check` passes with only the repository's existing LF-to-CRLF advisories, and `git branch --show-current` returns `DB`.

Known limits are intentional: the only predicate family is reply-length preference; contact-scoped lifecycle callers are synthetic/internal; no raw conversation evidence, automatic acquisition, relationship records, summaries, profiles, retrieval, or coaching influence exists. Durable memory remains supported only on the reviewed Windows x64 artifact. The next dependency-ordered data milestone is DATA-03; MEM-01 separately introduces bounded observation handoff, and MEM-05 introduces coaching use.
