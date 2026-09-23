# DATA-03 — Contextual relationship history

Status: complete — corrected internal encrypted relationship-history slice verified
Owner: Codex
Started: 2026-09-15
Updated: 2026-09-15
Working branch: `DB`
Roadmap milestone: [DATA-03](../../docs/roadmap.md#data--memory-roadmap)
Prerequisites: [DATA-02](data-02.md) and [MEM-00](mem-00.md)

## Outcome

The encrypted memory store can represent a relationship between the local user and a contact, including its direction, broad category, specific role, organization/project context, and meaningful history. A person can be a friend and a manager simultaneously, or a former manager at one company and a current colleague elsewhere.

Relationship records remain typed assertions supported by the existing evidence and decision system. They are not a new independently writable relationship database. Corrections distinguish “this was incorrect” from “this used to be true,” preserve supported history, and never invent an end date.

This is an internal data milestone, following the revised DATA-02/MEM-00 scope. Its immediate visible surface is read-only development inspection using synthetic fixtures. It adds no production relationship-entry UI, automatic inference, screenshot attribution, or coaching personalization. The user subsequently authorized implementation on `DB`.

## Scope

In scope:

- Typed broad-category and specific-role assertions between the local user and one existing contact, with explicit direction where meaningful.
- Minimal organization/project scoping, simultaneous roles, distinct historical episodes, partial/unknown dates, and scoped corrections.
- Reuse of evidence, decisions, acceptance, revisions, pagination, deletion, encryption, and the existing coordinator/utility boundary.
- A schema-v5 relationship migration followed by a schema-v6 temporal-dependency migration, bounded internal lifecycle operations, filtered development inspection, and encrypted snapshot compatibility.
- Deterministic policy fixtures plus native encrypted migration/history/deletion tests.

Out of scope: contact-to-contact social graphs; organization accounts or company/project management systems; automatic relationship extraction; new observation producers or provenance claims; capture/OCR changes; source transcripts; relationship scoring models; profile learning; summaries; background scheduling; vectors; a new memory reader for coaching; production generic-memory IPC/forms; model/provider calls; API routes; cloud/sync; and sending.

Before any later real-data relationship producer is enabled, that milestone must provide truthful provenance, acquisition controls, and user review/correction/deletion. Internal confirmation methods and a developer inspector do not satisfy that future production gate.

## Baseline inspected before implementation

- `DB` is active. Existing uncommitted DATA/MEM, native/debug tooling, and communication-skill edits must be preserved. No cleanup, staging, or commits are part of this planning request.
- README and MEM-00's completion record report schema v4 and passing lint/typecheck/build, 36 files / 226 unit tests, and Windows native checks. These are recorded baseline results, not tests rerun in this planning turn.
- `packages/contracts/src/memory-assertion.ts` currently permits only `REPLY_LENGTH_PREFERENCE` and its three enum values. Assertions/evidence, internal requests, confidence, acceptance, applicability, time, decisions, and paged responses are already defined there.
- `apps/desktop/src/main/local-memory/assertion-store.ts` embeds preference-only predicates/value columns, subject/value deduplication, and one current confirmed assertion per subject/predicate. Those rules cannot simply be reused for multiple simultaneous relationship roles.
- `assertion-policy.ts` currently decides candidates, supersedes records as historical, and reconsiders rejected assertions. A correction of an erroneous role must not blindly use its “superseded means historical” behavior, which would imply the erroneous claim used to be true.
- The current temporal value supports unknown, instant, date, and month with an optional same-precision end. It cannot represent an unknown start with a known end, year-only evidence, or the distinction between an uncertain end within a month and an exact boundary. Relationship history needs that narrow extension.
- `directory-store.ts` already invokes assertion cleanup on contact/identity deletion and association revocation/reassignment. Relationship dependencies must join that same transaction path.
- `storage-utility.ts` owns migrations, cipher checks, preference projection, shared memory dispatch, clear-all, and encrypted debug export. `coordinator.ts` owns bounded transport and lifecycle/reconciliation.
- `packages/contracts/src/local-memory.ts`, `debug-snapshot.ts`, and native tests contain schema-v4 literals. Update them together if the schema changes; SQLCipher compatibility version 4 is a different concept and must not change with application schema version.
- `LocalMemoryInspector.tsx` already pages assertions/evidence/links/decisions through a development-only bridge. Production has neither generic memory mutation nor inspector access. Existing preference controls remain the sole production memory writer.

Inspected governing sources: [memory](../../docs/memory.md), [architecture](../../docs/architecture.md#data--memory-boundaries-data-00), [privacy](../../docs/privacy.md#local-memory-storage-data-00), [product behavior](../../docs/product-behavior.md), and the [roadmap](../../docs/roadmap.md#data--memory-roadmap). In particular, relationship history is an assertion specialization, retention is not freshness, and current evidence can make an old role inapplicable without proving it was always false.

## Assumptions and decisions

### 1. Relationships extend assertions

Add two discriminated predicate families alongside the existing preference:

- `RELATIONSHIP_CATEGORY`: `PROFESSIONAL` or `PERSONAL`, for the local-user/contact pair in an explicit context.
- `RELATIONSHIP_ROLE`: a bounded role plus direction for that same pair/context.

The proposed initial role vocabulary is `MANAGER`, `COWORKER`, `TEAMMATE`, `CLIENT`, `PROFESSOR`, `FRIEND`, `ROMANTIC_PARTNER`, `SPOUSE`, `FAMILY`, and `ACQUAINTANCE`. Keep these ten roles bounded and fixed, not free text or a larger taxonomy. `ROMANTIC_PARTNER` replaces the ambiguous `PARTNER` and means a romantic/couple relationship; `SPOUSE` means a marriage/spousal relationship. Neither role infers the other. `PROFESSOR` describes the relationship to the counterpart, not merely an occupation; `FAMILY` is deliberately broad and does not infer any specific kinship subtype.

For directional roles (`MANAGER`, `CLIENT`, `PROFESSOR`), explicitly name the role-holder as local user or contact. For symmetric roles use one canonical symmetric representation, not two inverse records. Examples: contact is manager of user differs from user is manager of contact; a friend edge has no directional owner. Neither endpoint can be missing or guessed from `OTHER` in an analysis result.

Broad category and specific role have separate assertion IDs, acceptance, evidence, and predicate confidence. A strong professional-category candidate does not confirm manager; confirming manager does not create a second professional assertion as independent evidence. Both personal and professional can coexist. No aggregate identity/relationship confidence replaces these distinctions.

`RelationshipRecord` is a typed projection of these canonical assertions and their scoped values. Do not duplicate acceptance, dates, evidence, decisions, or mutable role truth in a separate relationship store.

### 2. Context is explicit, small, and local

Use a minimal immutable relationship-context reference shared by its assertions/evidence: context UUID, kind, and bounded organization/project labels. This is scope metadata, not a company/project entity platform. A project context may carry an organization label when explicitly supplied; neither is inferred from role or contact name.

Distinguish deliberately unscoped `GENERAL` from `UNKNOWN` context. Unknown does not match every company/project and cannot silently replace an explicit scope. Separately created contexts with the same labels remain distinct until a trusted caller explicitly selects reuse; no fuzzy matching, global identifier claim, or automatic context merge.

Persist a small context metadata table only because relationship assertions and scoped corrections need a stable shared reference. Give it enforced local ownership, referenced-only retention, and bounded read-only inspection. Create a new context atomically with its first candidate or select an existing context; do not provide an orphan context registry. Context changes create a replacement scoped claim, not a rename that reinterprets old evidence.

### 3. Multiplicity and episodes replace preference-only uniqueness

Keep the existing current-preference uniqueness rule scoped to `REPLY_LENGTH_PREFERENCE`.

For relationships, include contact, category/role, direction, context reference, and episode in semantic identity. Multiple different roles/categories or contexts may be confirmed at once. Returning to the same role after leaving creates a distinct episode; it must not rewrite the earlier period.

Relationships are multi-valued, never a single current contact enum such as `contact.relationship = FRIEND`. Alex can simultaneously have separate `FRIEND`, `COWORKER`, and `TEAMMATE` assertions; these compatible roles must not replace each other. Neither accepted assertions nor candidates require one “main relationship.”

Future relationship-detection skills may propose a `COWORKER` assertion with predicate confidence `0.76` and acceptance `CANDIDATE`, then a `FRIEND` assertion with predicate confidence `0.82` and acceptance `CANDIDATE`. Both may coexist, retaining their separate confidence, evidence, and temporal scope. A higher confidence or later proposal does not automatically confirm a claim, overwrite/remove a compatible relationship, or end its episode. These are synthetic planning/test examples only: relationship detection, memory skills, automatic inference, and runtime producers remain deferred.

Within one episode, only one active accepted revision of the exact proposition may exist. Deduplicate repeated proposals/support for that episode without merging unrelated dates or contexts. Require explicit reuse or new-episode intent from trusted callers; do not infer episode identity from equal text.

Overlapping relationships are not automatically contradictions: matrix managers, personal/professional overlap, or concurrent projects are valid. Conversely, an explicit scoped negation and a positive claim for the same role/time cannot both be treated as applicable. Unknown time/context prevents a confident resolution and must be surfaced as unresolved, not discarded in favor of the last write.

The existing rule “different value means contradictory evidence” is not valid for roles. A friend value does not contradict manager. Define support/contradiction rules by predicate, pair, direction, context, episode/time, and explicit assertion content before accepting an evidence link.

### 4. Time preserves uncertainty

Keep source time, application recording/decision time, and relationship validity separate. A capture recorded today must not make an old manager current. Historical knowledge survives age; absence of observations is only “no recent observed messaging evidence.”

Both predicted candidates and accepted relationships can change applicability over time without collapsing acceptance and validity. For example, a `COWORKER` assertion accepted/current in 2024 may be accepted/historical in 2026 while a separate `FRIEND` assertion is current. Preserve the supported coworker history; the friend assertion alone is not evidence that the coworker role ended. A supported end/transition, not a new compatible role or the passage of time alone, justifies that change. Returning to coworker after the ended period creates a distinct episode where appropriate; historical candidates remain candidates, not accepted history.

Extend shared temporal primitives only as needed for relationship validity: independently unknown start/end, year/date/month/instant precision, and a distinction between a known boundary and a boundary only known to fall within a calendar period. Preserve existing preference/source-time payloads and their semantics during migration.

Examples:

- “Former manager,” dates absent: accepted historical relationship, both boundaries unknown.
- “Stopped managing me in 2023”: historical relationship with an end somewhere in 2023, not a fabricated January 1 or December 31 timestamp.
- “Ended at 2024-06-01T00:00:00+08:00”: known end-exclusive instant, preserving its offset semantics.
- “Friend since May 2020”: month-precision start, end unknown; no invented day.

Reject provably reversed/empty exact ranges. Mixed precision and uncertain bounds use conservative comparison: CURRENT, HISTORICAL, or UNKNOWN/inapplicable-at-query-time must not claim more than the bounds support. Unknown end alone is not proof of current status. A pure, injected-as-of-time helper is enough for lifecycle tests and filtered inspection; do not add a background expiration scheduler or coaching retrieval engine.

### 5. Corrections do not erase or invent history

Extend the existing decision lifecycle with explicit scoped operations:

| Meaning | Required effect |
|---|---|
| This was incorrect | Reject the selected assertion/scope; do not mark it as a true historical relationship |
| This used to be true | Retain acceptance and evidence, stop current applicability, and preserve unknown end when no date is supplied |
| Ended at/in this time | Add a sourced temporal decision, preserve stated precision, and retain the earlier relationship episode |
| Replace/correct this role or context | Atomically create the corrected assertion and link the prior record; explicitly distinguish factual correction from real-world transition |
| Reconsider | Create a reviewable candidate linked to the prior correction, never automatic confirmation |
| Dismiss/not now | No rejection or acceptance change |

A correction selector identifies the pair, role/category, direction, context, and its explicit temporal reach: current applicability, a supplied interval, or all retained history. “Not my manager” does not default to “never my manager.” A correction timestamp records the decision, not an inferred relationship end.

Repeated evidence cannot bypass a scoped rejection through a fresh assertion/episode ID. New circumstances may produce a candidate only when the correction's scope is known not to cover them or an explicit reconsideration is supplied. If overlap cannot be resolved from partial time/context, retain uncertainty and require review; do not silently reactivate the claim.

Candidate creation and temporal proposals never confirm themselves. Existing `USER_SETTING` and migration authority apply only to preference paths, not new relationship claims. DATA-03 fixtures remain explicitly synthetic; no runtime relationship producer is enabled and no stored source is relabelled as an observed conversation.

### 6. Storage migration, revision, and deletion

Plan application schema **v5** if v4 is still current when implementation starts. Extend the existing assertion/evidence/decision tables with constrained predicate-specific relationship fields, context/episode references, and temporal-decision scope. Retain the preference enum column for preference rows and require it null for relationship rows; use checks to reject mixed/invalid payloads. Use the same discriminated contract for evidence values. No unconstrained JSON fact bucket.

SQLite table rebuilds may be necessary to replace preference-only CHECK constraints and indexes. Run them through the existing bounded migration path with foreign-key verification, preserving IDs, values, acceptance, evidence/decision links, timestamps, key/store binding, and revision semantics. Do not seed relationships from contacts or existing preferences. Test the complete v1/v2/v3/v4→v5 chain, fresh stores, and fault-injected rollback.

Reuse dataset generation, memory revision, per-record revision, contact revision, and exact association dependencies. One serialized worker owns each transaction. A temporal correction, role replacement, and scope/episode update commits its evidence/decision/invalidation together; failures and stale requests cannot leave half a transition.

Extend existing cleanup so deleting a contact or identity, revoking/reassigning its association, deleting supporting evidence, and clearing the store cover all relationship assertions and history. A relationship never transfers to a newly associated contact. Independent valid support can preserve a claim; source-less positive claims cannot remain eligible. Rejected correction records must not be reinterpreted as positive historical evidence by generic cleanup.

Delete unreferenced context metadata only after checking all surviving assertions, evidence, and scoped decisions, including historical records. Deleting a particular relationship episode must not erase independent friend/colleague history; deleting a contact removes all of its scoped relationship data. Shared context metadata does not entitle one contact's deletion to erase another contact's facts. No hidden role/identity fingerprint remains after complete deletion.

### 7. Bounded interfaces and preserved product behavior

Reuse the current 4 KiB request / 16 KiB response ceilings, 20-record keyset pages, 512-byte cursor limit, eight evidence links, 100 decisions per assertion, one worker/eight waiting commands, 250 ms lock wait, and two-second ordinary-operation deadline.

Refine the 100-version cap to a relationship scope/role/direction/episode family without imposing a one-role-per-person rule. Add an explicit ceiling of 100 relationship episodes per contact across all scopes for this initial internal slice. Organization/project labels are at most 120 Unicode characters and 480 UTF-8 bytes each; context metadata is at most 1 KiB. An operation changes at most two assertions and one scoped decision, reusing the bounded mutation envelope.

At capacity, return a safe explicit failure; do not delete old relationships or shrink a correction's scope. Pages bind their cursor to contact, predicate/filter, context/time selection, generation, and memory revision. Return fewer complete records to fit bytes, never partial context or omitted negation. Use indexes before pagination, not whole-store fetches.

Validate deletion/correction at these limits. If bounded atomic cleanup cannot meet the lifecycle gate, stop and revise the implementation plan rather than add an unplanned job queue or unsafe partial deletion.

No new production bridge or form is required. The developer inspector can filter the existing assertion view to relationship predicates and show context, direction, validity, uncertainty, acceptance, and provenance. Encrypted debug snapshots remain separately keyed/read-only. Existing preference Save/Edit/Delete/Reset, Generate, coaching, and Copy remain unchanged.

## Contracts and data flow

Add focused `packages/contracts/src/relationship.ts` value/scope/role/temporal definitions and tests. Extend `memory-assertion.ts` into predicate-discriminated assertions, evidence, and internal commands; retain one shared evidence/decision vocabulary rather than parallel relationship registries. Extract common temporal primitives if necessary to avoid circular imports.

The current implicit preference-only PROPOSE/ADD_EVIDENCE/REPLACE commands must become predicate-aware internally. Update all trusted callers and reject mismatched predicate/value/subject/context combinations. Preserve the narrow external preference IPC format by translating it in the trusted boundary. Filter preference projections explicitly so a relationship row can never become a message-length setting.

Internal caller or synthetic fixture → shared validated request → existing coordinator/private worker → predicate-aware policy → atomic assertion/evidence/decision transaction → validated bounded result. Main/utility assigns ownership, IDs, and recording times; source validity must be explicitly supplied and labelled, not inferred from those timestamps.

Development-only inspection uses the existing allowlisted IPC and validated page schemas. General relationship commands remain inaccessible from production preload/renderer. No changes to conversation analysis, AI prompts/adapters, skill registry, application API, or model call budgets are required.

## Implementation steps

1. **Confirm scope and baseline.** Obtain approval, recheck `DB`, schema version and overlapping changes, and record baseline verification. Preserve internal-only population and the current production UI restrictions.
2. **Contracts and deterministic policy first.** Add relationship schema/tests, extend predicate unions and shared temporal primitives, and extend `assertion-policy.ts` with scoped correction/transition semantics. Use exact fixtures for coexistence, direction, unknown end, partial dates, and rejection reach before writing SQL.
3. **Migrate the canonical store.** Extend `assertion-store.ts` and `storage-utility.ts` for schema v5, context metadata, constrained values, revised indexes, episode identity, and preference-compatible reads. No independent relationship truth or new dependency.
4. **Implement internal history operations.** Extend existing assertion commands for historical transition, temporal correction, factual correction, and filtered history reads. Reuse `coordinator.ts` lifecycle handling. Add same-transaction cleanup in the current directory/evidence deletion paths.
5. **Extend read-only inspection/export.** Update `local-memory.ts`, `LocalMemoryInspector.tsx`, `debug-snapshot.ts`, and related tests for the new schema and typed display. Preserve SQLCipher compatibility 4 while increasing application schema version. Do not open or export real user data for validation.
6. **Verify encrypted behavior.** Extend `apps/desktop/scripts/native-memory-gate.cjs` for migration chains, direction/coexistence, temporal corrections, scoped rejection, evidence deletion, association invalidation, caps, restart, and production-surface absence. Keep fixtures synthetic and run existing preference regressions.
7. **Review and hand off.** Run canonical/native validation, verify every criterion, and update README, architecture, memory, privacy, roadmap, and this plan. No unrelated formatter rewrite or commit without request.

## Tests and evaluation

| Synthetic scenario | Pass condition |
|---|---|
| Contact is user's manager versus user is contact's manager | Distinct directed claims; neither direction inferred from the other |
| Same person is friend and manager at Company A | Both coexist; neither replaces or contradicts the other |
| Alex is friend, coworker, and teammate simultaneously | Three separate compatible assertions persist; no single contact enum or required main relationship |
| Coworker candidate at 0.76 followed by friend candidate at 0.82 | Both retain candidate acceptance and separate confidence/evidence; neither auto-confirms, replaces, removes, or ends compatible candidate/accepted roles |
| Accepted/current coworker in 2024, supported historical coworker and current friend in 2026 | Coworker history is preserved; friendship alone does not end coworker; temporal changes to candidates never imply acceptance |
| Fixed ten-role vocabulary; romantic partner, spouse, and broad family claims | Accept only the planned roles, reject legacy `PARTNER` and unlisted roles; `ROMANTIC_PARTNER` means romantic/couple, `SPOUSE` means marriage/spousal, neither creates the other, and `FAMILY` creates no kinship subtype |
| Former manager at A and current coworker at B | Correct contextual history/current separation, preserved after restart |
| Professional confidence high, manager confidence lower | Separate assertions/confidences/acceptance; no automatic role promotion |
| Former manager with no dates | Historical accepted claim; no fabricated start/end (M04 data-policy portion) |
| Stopped during 2023; month/date/instant and unknown boundaries | Precision and uncertainty retained; exact ends exclusive; impossible ranges rejected |
| “Not my manager now” versus “never my manager” | Different correction reach; historical truth preserved only where supported |
| Rejected manager followed by repeated proposals/new IDs | Scoped correction cannot be bypassed; unresolved temporal overlap stays reviewable |
| Leaves a role and later returns | Separate episodes; prior history not rewritten or deduplicated away |
| Same organization/project labels, distinct context IDs; unknown context | No implicit context merge or wildcard correction/replacement |
| Friend evidence linked as contradiction of manager | Invalid contradiction rejected; ordinary coexistence preserved |
| Replace erroneous role versus end a true role | Former is rejected/corrected, latter historical; no false historical truth from supersession |
| Five years without new evidence; history older than 90 days | History retained; no inference of no interaction or automatic end (M06/M18) |
| Evidence/contact/identity deletion; association revocation/reassignment | Dependent influence removed, independent support retained, no transfer to wrong contact |
| Stale correction, capacity overflow, transaction/migration failure, clear race | No partial transition, dropped history, or resurrection; existing bounds respected |
| Fresh/v1/v2/v3/v4 encrypted stores, native restart and debug snapshot | Safe v5 migration, unchanged preference data/controls, correct versioned encrypted copy |
| Production bridge/UI, logging, and coaching regression | No relationship-entry/lookup capability or provider calls; no sensitive content in logs |

The “since I left the company” example is represented as a structured fixture about the correct subject/company, not processed by a live model in DATA-03. Natural-language interpretation and ambiguous speaker resolution remain MEM-03/observation work. Default tests use no credentials. Native SQLCipher tests, not mocks alone, prove constraints/migration/deletion.

## Acceptance criteria

- [x] AC1: Relationships are separate typed canonical assertion specializations with shared evidence/decisions, never a single current contact relationship enum or duplicate independently writable relationship truth. The fixed ten-role vocabulary in decision 1 uses `ROMANTIC_PARTNER` and `SPOUSE`, not `PARTNER`; their romantic/couple and marriage/spousal meanings remain distinct, neither infers the other, and `FAMILY` infers no kinship subtype.
- [x] AC2: Broad categories and specific roles retain independent confidence/acceptance; future AI predictions enter as candidates, with no inference or confidence threshold silently confirming a role. Compatible candidates such as coworker at 0.76 and friend at 0.82 coexist without selecting a main relationship or automatically overwriting/removing/ending compatible candidate or accepted assertions.
- [x] AC3: Direction, organization/project scope, simultaneous roles (including friend/coworker/teammate), and distinct returning-role episodes are represented without destructive replacement or label-based merging.
- [x] AC4: Historical/current/unknown validity, year/month/date/instant precision, independently unknown boundaries, and exact end-exclusive semantics work without invented dates or age-only deletion. As-of reads apply scoped corrections before effective applicability. Supported transitions preserve history independently of acceptance: a 2024 accepted/current coworker can become historical in 2026 alongside a current friend; the friend claim alone cannot end coworker, and historical candidates do not become accepted facts.
- [x] AC5: Factual rejection, ending a true role, scoped correction, replacement, and reconsideration are distinct; repeated proposals cannot override an applicable correction.
- [x] AC6: Predicate-aware support/contradiction, deduplication, uniqueness, and capacity rules allow legitimate coexistence and reject invalid combinations.
- [x] AC7: Schema-v5 and v5-to-v6 migrations preserve independently supported preference/directory/assertion/evidence/decision state, references, timestamps, encryption, and store binding. Unattributable v5 ends become unknown; uniquely attributed old transition links become contextual, and any resulting source-less positive role is removed by the existing cleanup rather than preserved as a false confirmed fact. Failed migration preserves recoverable data.
- [x] AC8: Atomic revision/generation checks and dependency-aware deletion cover relationship history/context; late writes and identity reassignment cannot resurrect or misattribute it.
- [x] AC9: Internal history reads and development inspection remain bounded/read-only where appropriate; production has no generic relationship IPC/UI/reader, and debug snapshots remain independently encrypted.
- [x] AC10: No raw screenshots/messages, new providers/model calls, automatic producer, coaching changes, plaintext export, or content-bearing logs are introduced; future real-data review controls remain an explicit gate.
- [x] AC11: Canonical checks, deterministic scenarios, native encrypted migration/history/restart/deletion tests, and privacy review pass with recorded evidence on `DB`.

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

Use isolated synthetic app-data paths for native or development UI checks. Test encrypted snapshot compatibility through the existing native harness, not a real-store export. The sandbox Electron GPU launch failed before storage, so the same synthetic gate was run with host permissions; its final run passed. Markdown link/section checks are separate because docs/plans are excluded from the existing formatter configuration.

## Risks, rollback, and limitations

- Preference-specific assumptions occur throughout contracts, SQL, evidence matching, uniqueness, projections, and policy. Changing only the predicate enum is insufficient and risks losing simultaneous roles or breaking settings.
- Temporal supersession can accidentally assert that a false relationship used to be true. Predicate-aware correction modes and explicit history fixtures are required before implementation is considered complete.
- Unknown context/time cannot safely be treated as a wildcard or exact boundary. Conservative unresolved outcomes are preferable to fabricated certainty.
- Context metadata must stay minimal and reference-owned. No company directory, organizational hierarchy, role taxonomy engine, or social graph is justified by this milestone.
- Partial unique indexes cannot alone enforce all overlapping temporal/correction constraints. Checked transactions under the existing single writer and native race tests remain necessary.
- If migration or bounded cleanup cannot meet its acceptance gate, revise the plan before shipping; no silent data dropping or unbounded fallback.
- Rollback preserves the encrypted v6 store and disables incompatible functionality; older builds reject newer schemas. No destructive downgrade or plaintext backup. Native crypto artifact, keys, provider configuration, and installer obligations remain unchanged.
- The first relationship producer is still absent. This milestone demonstrates internal data/lifecycle behavior, not live relationship accuracy, user-visible personalization, or production memory readiness.

## Progress log

- 2026-09-23: Prepared the DB-only commit at the user's request. Formatted DB source/test/tooling files and made the unit/native current-rejection fixtures query their actual decision timestamp instead of a hard-coded September 15 date. Runtime behavior is unchanged. Fresh `pnpm lint`, `pnpm typecheck`, `pnpm test` (39 files/256 tests), `pnpm build`, and the Windows Electron/SQLCipher native gate passed. Staged whitespace and credential-pattern checks passed; the reviewed native binary matches its recorded SHA-256. Unrelated Communication Skills work, including its two shared-contract exports, is deliberately excluded and remains in the working tree as requested.
- 2026-09-15: Follow-up recheck reproduced two further P2 acceptance gaps after the first v6 signoff: a current-only rejection can be shown as CURRENT by an as-of LIST query over known old bounds (AC4/AC5), and an attributed migrated v5 transition source remains a generic SUPPORTS role link (AC7/AC8). Reopened full signoff. Fix in the existing bounded trusted read and v5→v6 migration paths; no production UI, key, SQLCipher, or acquisition scope change.
- 2026-09-15: Reproduced three acceptance gaps after prior signoff: historical applicability shadows a known earlier as-of interval (AC4); removing the sole positive support can cascade-delete a current-only correction and allow a fresh blocked manager proposal (AC5/AC8); deleting transition evidence leaves an unsupported exact end (AC8). Reopened those criteria. Correction anchors will be retained without positive influence; temporal-end provenance requires transactional application schema v6, with old v5 exact ends retained only when their source can be identified unambiguously. This changes no production acquisition/UI or SQLCipher security boundary.
- 2026-09-15: Fixed all three gaps. The as-of classifier recognizes a provable earlier interval despite current historical status. Source-less accepted relationship assertions with scoped rejection/factual correction are downgraded to rejected/unknown anchors, preserving the correction decision without positive truth. V6 records each transition decision's end and evidence dependency; deleting transition or association evidence recomputes a surviving temporal end or invalidates end/applicability while independent role support remains. V5 migration links only a unique timestamp-matched latest transition source; unattributable ends become unknown. Added deterministic regression, v5 populated migration, association invalidation, and encrypted Windows native deletion/migration cases.
- 2026-09-15: Intermediate v6 rerun passed `pnpm lint`, `pnpm typecheck`, `pnpm test` (39 files/255 tests), `pnpm build`, `pnpm --filter @ai-message-coach/desktop test:native-memory` (Windows x64 Electron 43.3.0/Node 24.18.1, fresh/v1–v5→v6, temporal/correction dependency deletion), and `git diff --check`. Existing dirty/untracked user work remained unstaged/uncommitted. No production UI/IPC, real producer, plaintext export, new dependency, or changed SQLCipher compatibility/key custody.
- 2026-09-15: Fixed the two follow-up gaps with a bounded correction-aware internal as-of LIST and migration-time normalization of uniquely identified v5 transition links to `CONTEXTUALIZES`, followed by the existing unsupported-assertion cleanup. Added the store-level as-of regression and populated v5 migration/deletion regression; both failed before their fixes and pass afterward. Expanded native encrypted gate to cover both on Windows x64. Final `pnpm lint`, `pnpm typecheck`, `pnpm test` (39 files/256 tests), `pnpm build`, `pnpm --filter @ai-message-coach/desktop test:native-memory`, and `git diff --check` all passed; `git branch --show-current` returned `DB`, and `git status --short` showed the pre-existing dirty/untracked work preserved. No production surface/security or dependency changed.
- 2026-09-15: User requested DATA-03 planning first. Confirmed `DB`, read governing docs and MEM-00 completion evidence, and inspected predicate-only contracts, SQL/indexes, temporal representation, policy/tests, cleanup, and inspector/export version boundaries.
- 2026-09-15: Drafted the relationship specialization, contextual coexistence, scoped corrections, historical time semantics, migration, tests, and production restrictions. No implementation or user-data mutation performed.
- 2026-09-15: Planning-only clarification requested by the user: replaced `PARTNER` with `ROMANTIC_PARTNER`, added `SPOUSE`, fixed the ten-role vocabulary and distinct romantic/spousal/broad-family semantics, and made multi-valued candidate/accepted coexistence and temporal history explicit. Added synthetic scenario wording and refined AC1–AC4; no runtime code, executable tests, skills, UI, migration, producer, or model calls added.
- 2026-09-15: User authorized implementation on `DB`. Reconfirmed schema-v4 preference-only constraints and the internal coordinator/utility boundary; schema-v5 work must preserve canonical preference migration, avoid one-role-per-contact uniqueness, and keep production generic memory entry absent.
- 2026-09-15: User authorized implementation. Added predicate-discriminated contracts, schema-v5 canonical assertion/evidence/decision rebuild and subtype scopes, contact-owned immutable contexts, episodes, bounded relationship lifecycle commands, scoped current/interval/all-history corrections, conservative as-of policy, and read-only predicate-filtered inspection. No new dependency, production form/IPC, real-data producer, or coaching reader.
- 2026-09-15: Verified `pnpm lint` (pass), `pnpm typecheck` (pass), `pnpm test` (39 files/250 tests pass), `pnpm build` (pass), `pnpm --filter @ai-message-coach/desktop test:native-memory` (pass on Windows x64, Electron 43.3.0/Node 24.18.1), `git diff --check` (pass; Git line-ending warnings only), and `git branch --show-current` (`DB`). Native gate covers encrypted fresh/v1/v2/v3/v4→v5, historical/directed coexistence, rejection-bypass prevention, restart, separately keyed snapshot, deletion, production-surface absence, and prior DATA/MEM regressions. SQLite-level tests cover rollback, sourced corrections, interval uncertainty, evidence/association cleanup, filtered cursors, and 100 episode/version caps.
- 2026-09-15: Privacy review confirmed the real OS-protected key remains main/utility-only, SQLCipher compatibility 4 unchanged, no raw screenshot/message or plaintext database/export, and no renderer SQLite or generic relationship IPC. Added a post-exit cleanup wrapper for synthetic Electron fixture directories and removed 15 verified test-only temporary directories from this turn. Future real relationship acquisition still requires its own truthful provenance, enablement, user review, and source-schema change; DATA-03 does not authorize it.
## Completion record

DATA-03 is implemented on `DB` with application schema v6. AC1–AC11 pass for the internal synthetic-only milestone after fixing AC4/AC5/AC8 regressions. The v4 canonical assertion/evidence/link/decision rows migrate transactionally into relaxed predicate-constrained v5 parents; v6 adds a constrained relationship temporal decision/evidence dependency. Relationship context and scope child tables carry only the typed relationship fields, while evidence links and decisions continue to reference canonical parent IDs. Production preference controls and IPC remain fixed, and the production renderer has no relationship management or database access. The development inspector adds only read-only context pages and predicate filtering.

Initial v5 verification on 2026-09-15 (superseded by the regression repair): `pnpm lint`, `pnpm typecheck`, `pnpm test` (39 files, 250 tests), `pnpm build`, and `pnpm --filter @ai-message-coach/desktop test:native-memory` all passed. The native gate ran on Windows x64 with Electron 43.3.0/Node 24.18.1 using isolated encrypted synthetic databases, including fresh/v1/v2/v3/v4→v5 migration, restart, historical and directional claims, correction-bypass rejection, snapshot re-keying, deletion, wrong/no-key behavior, and production-surface absence. `git diff --check` passed with Git LF-to-CRLF advisories only; `git branch --show-current` returned `DB`. `git status --short` still shows the pre-existing dirty/untracked DATA/MEM/skill work, preserved without staging, commit, reset, or cleanup.

Intermediate v6 verification on 2026-09-15: `pnpm lint`, `pnpm typecheck`, `pnpm test` (39 files, 255 tests), `pnpm build`, the encrypted Windows native gate, and `git diff --check` passed. The new deterministic cases reproduce and fix the first three reopened acceptance gaps, test attributed/unattributed populated v5 migrations, and test temporal deletion through association invalidation. The native gate covers v5→v6, transition-evidence removal without loss of independently supported role acceptance, and last-role-support removal without correction bypass.

Final v6 verification on 2026-09-15: `pnpm lint`, `pnpm typecheck`, `pnpm test` (39 files, 256 tests), `pnpm build`, the Windows x64 Electron/SQLCipher native gate, and `git diff --check` passed. The last two P2 cases are covered by store-level deterministic tests and native encrypted fixtures: current-only rejection defeats a misleading as-of CURRENT projection while an earlier known interval remains CURRENT, and a populated legacy v5 transition source becomes contextual so removing the original role source cannot leave false confirmed role truth. All AC1–AC11 are closed for this synthetic-only internal milestone. `git branch --show-current` returned `DB`; existing unrelated dirty/untracked work remains unstaged and uncommitted.

Architecture assumptions: relationship truth is an assertion specialization, context UUIDs require explicit reuse and never merge by label, unknown time stays unknown, and supported historical truth is preserved by a current-only correction. Removing that last support keeps the correction constraint but not unsupported accepted positive history; removing a transition source invalidates only its temporal claim. No real relationship evidence producer is enabled; v6 deliberately permits only synthetic relationship provenance until a separately approved observation milestone changes the source contract with truthful acquisition/review controls. No coaching retrieval, provider calls, installer changes, new dependency, or production UI was added. The next recommended milestone is MEM-01 observation/handoff, not automatic relationship inference or personalization.
