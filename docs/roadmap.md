# Roadmap

## Milestone discipline

This roadmap is sequential. Begin a milestone only when the previous milestone's acceptance criteria pass and the next milestone has an approved execution plan where `.agent/PLANS.md` requires one.

The user authorized and completed DATA-00 through DATA-02 on `DB` on 2026-09-14, selecting the free SQLCipher Community route after rejecting an AGPL binding, and authorized MEM-00 and DATA-03 on 2026-09-15. This does not close pending Phase 2–4 live-quality or Windows capture checks or authorize later memory milestones. The bounded local Data + Memory sequence below replaces the former unspecified memory direction.

Do not pull future infrastructure into an earlier phase for convenience. A small interface at a real call site is enough to preserve a future seam. Each milestone ends with lint, typecheck, tests, build, acceptance review, documentation updates, and a completion report.

## Capture UX direction

Generate-triggered context capture is the primary product flow. A global shortcut is an optional alternative trigger, not the architectural owner of capture. Every trigger must call one reusable conversation-capture capability.

The capability should evolve only through approved milestones and validated needs:

```text
Capture foundation
→ Generate-triggered capture
→ manual crop setup/fallback
→ remembered confirmed region
→ active-window awareness
→ automatic conversation-region detection
→ one-click Generate experience
```

This sequence records product direction, not permission to implement later stages early. Manual crop is acceptable for the first working capture flow but is not the intended long-term central workflow. Region coordinates may eventually be stored as resettable local configuration; screenshot pixels and conversation content remain ephemeral by default.

## LLM provider direction

AI Message Coach uses a bring-your-own-key product model. Core coaching behavior depends on provider-neutral contracts, each provider integration lives behind an adapter, and model support is determined by capabilities rather than provider name. Users select a supported provider/model, supply their own credential, and pay that provider directly.

Provider work should evolve through approved milestones:

```text
provider-neutral contracts and capability requirements at real call sites
→ first vision-capable provider adapter with capability checks
→ minimal BYOK settings and secure credential storage
→ second major provider
→ third major provider
→ optional compatible/local endpoints
```

The first user experience may use one provider/model for supported tasks. Per-task vision/text/embedding configuration remains deferred until measured need. Direct encrypted desktop-to-provider requests are preferred for private conversation analysis when practical; a server-mediated path must justify the additional trust boundary. See `docs/llm-providers.md`.

## Foundation — architecture documentation (complete)

**Outcome:** establish shared product rules, architecture boundaries, privacy posture, and implementation gates before application code.

**Deliverables:** `AGENTS.md`, `README.md`, `.agent/PLANS.md`, and the product, architecture, skills, memory, privacy, and roadmap documents.

**Acceptance criteria:**

- The central infer/generate/choices/ask policy is unambiguous.
- MVP and deferred scope are explicit.
- Desktop, API, contract, AI, skill, memory, and Skill Factory responsibilities do not overlap.
- Confidence, language, identity, temporal-memory, and screenshot-lifecycle rules are recorded.
- BYOK, provider-neutral contracts, capability checks, credential security, and request-topology principles are recorded.
- A minimal monorepo is proposed without application scaffolding.
- Phase 0 has observable acceptance criteria.

This milestone stops before Phase 0 implementation.

## Phase 0 — repository and contract skeleton (complete)

**Outcome:** a minimal, reproducible TypeScript monorepo with enforceable boundaries and shared domain contracts, but no product feature implementation.

**In scope:**

- choose and document the workspace package manager and supported Node.js version;
- root workspace configuration with canonical `lint`, `typecheck`, `test`, and `build` commands;
- minimal `apps/desktop`, `apps/api`, `packages/contracts`, `packages/ai`, and `packages/skills` packages only where required to prove dependency direction;
- strict TypeScript configuration and formatting/lint policy;
- Zod schemas for `AgentAction`, observations, independent confidence hypotheses, coach results, errors, and initial skill definitions;
- a tiny synthetic contract fixture and schema tests;
- ignored local environment-file convention, with placeholders only.

**Out of scope:** Electron capture UI, Fastify coaching routes, LLM provider calls/adapters, prompts, production skills, storage, memory, databases, and deployment.

**Acceptance criteria:**

- A clean checkout can install dependencies using the committed lockfile and documented tool versions.
- Root lint, typecheck, test, and build commands pass.
- Package dependencies follow the implemented Phase 0 direction, and future provider composition is not coupled exclusively to the API service.
- All cross-boundary domain values are validated by Zod; TypeScript types are inferred rather than duplicated.
- Tests prove valid and invalid action/confidence/result examples.
- No real user data, credential, model call, or speculative database exists.

Completed on 2026-08-10. See the [Phase 0 execution plan](../.agent/plans/phase-0.md) for implementation decisions and acceptance evidence.

## Phase 1 — Generate-triggered desktop capture foundation

**Outcome:** the user clicks Generate, Message Coach hides, captures the display containing its window, restores itself, lets the user drag-select the conversation region, previews the crop, and can Retake, Cancel, press Escape, or Continue to a local placeholder without any AI or network request.

**In scope:** one reusable conversation-capture capability; primary Generate trigger; main-process single-flight protection; hide/settle/capture/finally-restore lifecycle; current-display metadata; one allowlisted typed IPC method; local four-direction selection; pure scaling/clamping geometry; in-memory Canvas crop; preview and recoverable errors; buffer/object-URL disposal; deterministic and native runtime checks.

**Out of scope:** provider/model integration, screenshot understanding, OCR, coaching policy, skills, memory, region persistence, active-window semantics, automatic region detection, global shortcuts, insertion, sending, app-specific integrations, iOS, and native capture-exclusion modules.

**Acceptance criteria:**

- Generate and Retake request the same internal capture workflow; overlapping requests are rejected.
- Every visible coach window is hidden before capture and restored after success or failure.
- The coach is absent from the captured image on supported/tested native platforms.
- All four drag directions, boundary clamping, actual CSS-to-pixel scaling, invalid selections, exact preview, Retake, Cancel, Escape, and Continue work.
- Continue shows `Capture ready for analysis.` and performs no provider or application-network request.
- Screenshots are never persisted or logged; all image references are released at the end of the active flow.
- Renderer Node integration remains disabled; context isolation/sandboxing remain enabled; the narrow bridge and IPC results are runtime validated.
- Formatting, lint, typecheck, deterministic tests, build, API health, production renderer startup, and native capture checks pass.
- Windows 100%/125% scaling and a second-monitor baseline are documented and controlled-test verified before Windows release signoff.

Implementation landed on 2026-08-10 and native macOS signoff completed on 2026-08-11. Automated tests, the synthetic production-renderer flow, the real permission-failure/restoration path, and three real 2×-scale capture/exclusion/restoration cycles pass. Windows DPI and multi-monitor acceptance remains a target-platform follow-up before Windows release signoff. See the [Phase 1 execution plan](../.agent/plans/phase-1.md).

## Phase 2 — screenshot conversation understanding

**Outcome:** pass the existing selected crop to one provider-neutral, vision-capable analysis task and return a validated observation-only conversation context.

**In scope:** visible message text and order; `USER`/`OTHER`/`UNKNOWN` ownership; compose-box draft/no-draft; visible contact and participant signals; language, Chinese script, and code-switching; independent extraction confidence and warnings; bounded PNG validation; provider capability preflight; one isolated OpenAI Responses adapter; direct trusted desktop-to-provider transport; safe provider status; loading/result/retry/cancel/recapture UI; synthetic fixtures; and opt-in live evaluation.

**Out of scope:** relationship prediction or roles; situation, intent, emotion, coaching actions, clarification, reply generation, rewriting, completion, skills, memory, identity matching, persistent provider settings/credential storage, additional adapters, multi-model routing, automatic region detection, insertion, and sending.

**Acceptance criteria:**

- The selected Phase 1 crop reaches analysis without recapture, while the full-display capture never crosses the provider boundary.
- Provider-neutral schemas validate visible messages/order/ownership, draft, contact signals, language/script/code-switching, warnings, and independent confidence values.
- Relationship-like, decision, skill, and response fields are absent and rejected by strict schemas.
- The first adapter is isolated; provider wire types and credentials never enter renderer or core contracts.
- Screenshot tasks require vision, text-generation, and structured-output capabilities and fail before transmission when unsupported.
- Invalid output and provider failures are normalized into safe recoverable states; overlapping requests are suppressed.
- Screenshots are not persisted or logged, temporary bytes are zeroed, and crop URLs/references are released after success, cancel, recapture, reload, or unmount.
- Default tests require no credential and cover at least 50 synthetic scenarios; live evaluation is explicit and reports limitations.

See the [Phase 2 execution plan](../.agent/plans/phase-2.md).

Implementation, deterministic verification, local UI/runtime verification, API health, and production startup are complete. Authenticated OpenAI access and one user-authorized production screenshot analysis succeeded through the current user-controlled local proxy. Representative synthetic live extraction evaluation and extraction-quality review remain pending; Windows DPI, multi-monitor, and capture-exclusion validation remains a separate release follow-up.

## Phase 3 — deterministic coaching policy and secure BYOK MVP (implemented)

**Outcome:** consume the validated Phase 2 context to decide whether to rewrite, complete, suggest a reply, offer action choices, ask one necessary clarification, or recommend no reply, then present an editable result without automatic sending.

Implementation is complete and committed at `a67a36ff3202a2ee1c790b9da8ad66f2f47f624e`; see the [Phase 3 execution plan](../.agent/plans/phase-3.md). The delivered boundary is basic draft-aware decision and generation only: relationship reasoning, identity/memory, and the Communication Skill Engine are absent from the Phase 3 baseline. A live coaching request reached OpenAI and exposed an incompatible root-union output schema; the local Phase 4 work replaces it with action-specific root-object wording schemas. Post-fix final-reply generation and coaching-quality review remain pending.

**In scope:** observation/inference/decision separation; draft-aware deterministic action policy; clarification gate; provider-neutral response task; one-call normal path; response/action/clarification/no-reply UI; editable result and copy; representative English/Chinese deterministic evaluation; and end-to-end privacy/failure review.

**Out of scope:** communication skills, relationship prediction, additional providers, multiple simultaneous task models, custom/local endpoints, durable personal/contact memory, identity recognition, production credential storage/settings, insertion/sending, app-specific integrations, vector databases, iOS, and Skill Factory.

**Acceptance criteria:**

- Validated Phase 2 context drives every `AgentAction` and its material decision boundaries without re-extracting the screenshot.
- Clear contexts do not ask unnecessary questions; at most one clarification is reserved for materially divergent low-confidence paths.
- Draft-aware, empty-draft, action-choice, clarification, and no-reply flows satisfy the behavior matrix.
- Development provider configuration remains in trusted Electron main; only safe configured/model/capability status reaches the renderer and no credential appears in logs or tracked settings.
- A user can review, edit, and copy a result; no screenshot is persisted and the coach never sends automatically.
- Lint, typecheck, deterministic unit/integration tests, production build, API health, Browser QA, and practical Electron startup pass on the current macOS host.

Phase 3's deterministic/unit/integration and local runtime verification pass. Provider transport and authentication work through the existing local proxy, but post-fix final-reply generation and live review of wording quality, intent preservation, hallucinated-fact rate, and language match remain pending. Controlled Windows DPI/multi-monitor capture validation remains pending.

## Phase 4 — initial Communication Skill Engine

**Outcome:** preserve the explicit Phase 3 action, then deterministically select and compose a small set of approved communication skills that can guide provider-neutral wording.

Phase 4 is implemented and committed at `a77f476` under the [Phase 4 execution plan](../.agent/plans/phase-4.md). That plan preserves its historical local completion record. The implementation proves a small reviewed registry and deterministic selection; it does not claim live response-quality improvement or implement large-catalog infrastructure.

**In scope:** strict Zod-first skill/context/selection/plan contracts; 21 source-controlled `ACTIVE` atomic skills (14 universal, 3 English, 4 Chinese); deterministic context tags from visible Phase 2/3 evidence; status/language/action/situation/intent eligibility; zero-to-four bounded selection; stable ordering; lightweight compatibility and deterministic conflict filtering; compact provider-neutral principles/avoidances; integration after Phase 3 action selection; exact-ID synthetic fixtures; selection metrics; and generic generation fallback for request-scoped skill failure.

**Out of scope:** relationship prediction, relationship memory, identity/avatar recognition, contact/user history, persistence, playbooks/skill graphs, 1,000+ skills, model-authored or runtime-mutated skills, embeddings, vector search, PostgreSQL, RAG, Skill Factory, extra provider adapters, multi-agent runtime architecture, insertion/sending, app-specific integrations, and iOS.

**Acceptance criteria:**

- The Phase 3 baseline remains a clean commit and its six explicit actions are unchanged.
- Strict shared schemas validate skill definitions, context, selections, versions, states, and composed plans.
- The 21-skill registry is manually approved, atomic, source-controlled, and provider-independent.
- `ACTIVE` status, language, action, situation, and intent filters are deterministic and repeatable.
- English uses universal + `en`; Chinese uses universal + `zh`; mixed English/Chinese may use both supported families; other languages use universal only.
- Runtime supports legitimate zero-skill results and never selects more than four skills.
- Conflicting skills are not composed, while compatible combinations remain lightweight metadata.
- Only bounded principles/avoidances reach generation; full definitions and skill IDs do not enter provider prompts.
- Skills cannot change the Phase 3 action or user's visible intent, refusal, uncertainty, facts, or commitments.
- Selection evaluation reports expected recall, relevance precision, forbidden/unnecessary/conflict rates, language eligibility, bounded-set rate, and strict scenario pass rate.
- The existing coaching/copy UI remains functional without manual user skill selection, and retry after a user choice preserves that exact selection.
- Deterministic verification, build, API health, practical Electron startup, and Browser QA pass.
- Post-fix live final-reply confirmation, live model comparison, and controlled Windows validation remain explicitly pending.

## Agent architecture Phase A — communication problem foundation

**Status:** complete (2026-10-01). Formatting gate: **PASS WITH DOCUMENTED WORKTREE EXCEPTION**; see the [Phase A completion record](../.agent/plans/agent-architecture-phase-a.md#completion-record). Phase B production routing has not started.

**Outcome:** add a deterministic, validated, request-scoped `CommunicationProblem` after existing screenshot observations while keeping the current policy, skill selection, provider call count, renderer flow, and privacy boundary unchanged. This is the first approved increment of the [overall agent architecture plan](agent-architecture-plan.md); see the [Phase A execution plan](../.agent/plans/agent-architecture-phase-a.md).

**In scope:** internal normalization and bounded provenance/unknown fields, an optional future user-supplied instruction seam with no current IPC producer, structural-only test/debug status, and policy/skill/call-count parity tests.

**Out of scope:** capability or domain routing, specialist runtime, supervisor, composer replacement, evaluator revisions, new provider calls, relationship/identity inference or memory lookup, renderer/IPC changes, and persistence.

**Acceptance criteria:** validated deterministic normalization; no promotion of visible contact cues into confirmed identity/relationship; exact supported preservation source and language propagation; separate hard constraints and style priorities; unchanged policy decisions, skill selection, call count and public result; no new sensitive-data persistence or logging; canonical validation commands pass. The new problem is shadow data until a later reviewed migration demonstrates parity.

## Agent architecture Phase B — Agent–Skill integration

**Entry status:** **B1 COMPLETE; B2 SHADOW-ONLY COMPLETE — READY FOR REVIEW; B3–B5 HOLD** (2026-10-04). The [historical skill-catalog checkpoint](agent-architecture-phase-b-checkpoint.md), [revised overall plan](agent-architecture-plan.md#13-migration-plan) and [Agent–Skill integration plan](agent-skill-integration-plan.md) define the boundary. The former exactly-one ownership/domain-router decision is superseded. B2 uses the committed Skills checkpoint `dcc52eb` and the matching approved runtime registry values; newer untracked Skills research is excluded. See the [B1 completion record](../.agent/plans/agent-architecture-phase-b1.md#completion-record) and [B2 execution plan](../.agent/plans/agent-architecture-phase-b2.md).

**Slices:** B1 shared Agent–Skill contracts and provider-neutral assessment port with no production change; B2 evidence-aware deterministic selection; B3 separate SkillPlan compilation; B4 optional validated non-exclusive communication metadata; B5 shadow parity/regression and human-reviewed cutover review. The current selector remains production-authoritative, and initial Phase B adds no provider call. A separate decision is required to make the new Skill boundary production-authoritative. Each implementation slice requires its own execution plan and acceptance criteria before code changes.

The [B1 entry checkpoint](agent-architecture-phase-b1-entry-checkpoint.md) and [B1 execution plan](../.agent/plans/agent-architecture-phase-b1.md) record the contract-only freeze. B2 adds a bounded structural evidence projection, six communication-need signals, deterministic assessment/selection and request-local structural comparison. The existing flat selector and Composer input remain production-authoritative; no new provider call, catalog copy or SkillPlan compiler is introduced.

## Data + Memory roadmap

DATA-00 through DATA-03 and MEM-00 are complete. Later rows remain proposed implementation milestones requiring their own execution plans and acceptance review. The [memory contract](memory.md) is the source of truth for domain semantics and acceptance scenarios M01–M21. [Architecture](architecture.md#data--memory-boundaries-data-00) and [privacy](privacy.md#local-memory-storage-data-00) specify module and security boundaries.

Locked direction: local, single-user, no Message Coach account, SQLite-oriented, offline-capable, asynchronous, incremental, bounded-context. Useful structured knowledge may remain indefinitely; raw capture/text remain temporary. Correction/deletion starts with the first real stored data, not at the end of the roadmap.

| Milestone | Goal and scope | Dependencies | Acceptance criteria | Out of scope |
|---|---|---|---|---|
| DATA-00 — final architecture contract | Documentation of local ownership, entities, time/evidence, bounded async flow, storage, correction/deletion, budgets, and phase sequence | User-approved local architecture direction | Explicit local scope; no age-only purge; named limits/overflow; deterministic race/history scenarios; documented DATA-01 gate; documentation-only verification recorded | Runtime schemas, source/config/dependency changes, SQL, database, commits |
| DATA-01 — protected local foundation | SQLite lifecycle, OS-protected database key, transactions/revisions/reset; explicit user-preference save/read/edit/delete vertical slice | DATA-00; synthetic native/encryption compatibility check before real-data persistence | Preference survives restart; unavailable/wrong key fails safely; no plaintext fallback/content logs; clear/delete works; storage failure preserves coaching | Contacts, inference, queues, provider settings expansion, background model calls |
| DATA-02 — contacts and identity associations | Internal contact/identity persistence and lifecycle APIs; unresolved/candidate/confirmed link states; bounded development inspection; no production data-entry UI | DATA-01 | Same-name identities stay separate; weak similarity never merges; production renderer has no directory mutation surface | Observation-driven population, avatar recognition, automatic cross-platform merge, messaging integrations |
| MEM-00 — assertion/evidence foundation | Typed propositions, provenance, acceptance/correction/rejection, temporal scope, basic inspection/delete | DATA-01; DATA-02 for contact records | Candidates never become trusted silently; correction outranks guesses; deletion removes exclusive evidence/derived influence | Model extraction, open-ended predicate graph |
| DATA-03 — relationship history | Broad/specific directed relationships, contextual coexistence, historical intervals | DATA-02, MEM-00 | Old manager remains historical; simultaneous friend/manager allowed; no invented end dates | Autonomous relationship prediction |
| MEM-01 — observation and async handoff | Main-owned bounded observation, in-memory scheduling, receipts, revision/generation checks, deterministic fixture processor | DATA-01, DATA-02, MEM-00 | Delayed work never blocks coaching; replay has one effect; correction/delete defeats late results; overflow/offline/shutdown bounded | Persistent raw queue, extra provider calls |
| MEM-02 — structured interaction summaries | Minimal episodes/participants, bounded summary items, coverage/provenance, correction/deletion | MEM-01 | Unknown time stays unknown; group ambiguity fails safely; summary authority inherited | Transcript archive, unbounded narratives |
| MEM-03 — incremental memory skills | Small approved task-specific skills; bounded relevant state; validated proposals; capability/usage limits | MEM-02, MEM-00; DATA-03 when affecting relationships | Limits enforced; no full-history prompt; invalid output writes nothing; no double-counting derived evidence | Autonomous retrieval agent, repair loops, automatic high-risk confirmation |
| MEM-04 — contextual communication habits | Features, separable contributions, dimension profiles and reset | MEM-01; DATA-03 for relationship scope | Single-message overfit prevented; other/generated/duplicate messages excluded; contact deletion removes broader profile influence | Personality inference, style-based identity matching |
| MEM-05 — bounded coaching retrieval | Committed-memory reader, identity/time/relevance gates, budgets/deadlines, prompt and output-guard integration | Relevant prior assertion/summary/profile slices | Fixed context/call limits as history grows; disabled/unavailable fallback; no candidate/stale-role leakage or invented commitments | Vectors, full-history context, habit-driven intent changes |
| MEM-06 — compaction and historical projections | Incremental context summaries, compact features, semantic expiration, inactive/stale handling | MEM-02–05 | Meaningful history/corrections/negation survive compaction; bounded input; no confidence laundering | Age-based mass deletion, full-history model recomputation |
| MEM-07 — lifecycle/resource audit | Cross-feature inspection, disk pressure, growth metrics, interruption/deletion/privacy audit | Implemented prior slices | Every record has controls; no resurrection/hidden derived influence; bounds preserve coaching; content-free logs | Cloud backup/sync, deferring basic deletion until this phase |

### DATA-00 deliverables

- [Execution plan](../.agent/plans/data-00.md) with assumptions, acceptance review, and exact verification results.
- [Memory specification](memory.md) with conceptual input/output/lifecycle boundaries, not runtime code.
- Aligned architecture, privacy, roadmap, and README documentation.

Completion means the architecture contract is recorded and reviewable, not that a database, encryption binding, memory model, or runtime skill has been implemented. Numerical ceilings must be finite and calibrated by the milestone enabling each caller; absence of a selected production value is never permission for unlimited behavior.

### DATA-01 first-slice implementation gate

The DATA-01 plan names SQLCipher Community 4.17.0, OpenSSL 3.6.4, and `@appthreat/sqlite3` 9.0.2 for Windows x64 Electron 43.3.0. The reviewed native artifact passed the synthetic development and relocated-layout gate before the real preference path was enabled. Main owns async safeStorage key custody; a bounded utility process owns SQL; runtime cipher verification fails closed. Other operating systems and architectures remain unsupported for durable memory until separately gated.

The first records are the singleton local context and explicit user preferences with UI save/read/edit/delete/reset. Do not pre-create contact, relationship, summary, profile, or queue tables. Future runtime contracts stay Zod-first in packages/contracts and are added only before their actual producers/consumers. No provider call is required for DATA-01.

Every implementation milestone runs `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`, plus focused synthetic boundary tests and the applicable privacy review. Live-provider evaluation is separate and opt-in. Existing Phase 2–4 quality and Windows release checks remain separate obligations.

### DATA-02 contact-directory slice

DATA-02 extends the encrypted store to schema v3 with internal contacts, platform identities, and reversible association lifecycle state. Composite foreign keys keep every reference inside the single local context, while a partial unique index permits at most one current confirmed contact for an identity. Display labels and identifiers are not uniqueness keys. Fixed coordinator/utility operations create, confirm, reject, revoke, reassign, or reconsider links, but production registers no contact-directory IPC/preload/UI surface and no current producer invokes them. Future observation/memory work owns automatic population and provenance. Identity-defining fields are immutable once saved and require a replacement identity rather than silent retargeting.

Directory requests retain the DATA-01 4 KiB request, eight-command queue, 250 ms lock, and two-second operation bounds. Responses are limited to 16 KiB; reads use revision-bound keyset pages of at most 20 complete records, and an identity retains at most 100 association records in this slice. Clear-all resets both settings and directory revisions with a new dataset generation. No screenshot recognition, message attribution, relationship assertion, model call, or coaching retrieval was added.

### MEM-00 assertion/evidence slice

MEM-00 migrates the encrypted store to schema v4 and replaces the old preference table with one canonical typed assertion/evidence/decision representation. The predicate family is intentionally limited to reply-length preference values. Assertions distinguish candidate/confirmed/rejected acceptance, active/superseded lifecycle, current/historical/unknown applicability, exact subject scope, and temporal precision including end-exclusive ranges. Evidence has allowlisted provenance, separate nullable extraction/attribution/predicate confidence, and no raw-content field. Adding evidence never confirms a candidate; confirmation, rejection, reconsideration, and replacement are distinct trusted internal transitions.

Generic lifecycle operations remain coordinator/utility internals with 4 KiB requests, 16 KiB pages, 20-record keyset pagination, eight links in either direction, and 100-version/decision capacity failures. The production renderer has no generic memory mutation capability. Preference save/read/delete keeps its existing fixed UI and IPC while writing the canonical tables. Contact deletion and association revocation/reassignment atomically remove dependent evidence and assertions that lose all support; clear-all removes memory and directory state and changes generation. The development inspector adds only read-only assertion/evidence/link/decision pages, and encrypted debug snapshots remain independently keyed. No automatic acquisition, relationship history, summaries, model call, or coaching retrieval was added.

### DATA-03 contextual relationship-history slice

DATA-03 migrates the same encrypted store through schema v6 and adds `RELATIONSHIP_CATEGORY` and `RELATIONSHIP_ROLE` assertion specializations. Broad professional/personal categories and ten bounded roles are independently proposed, evidenced, reviewed, and corrected. Directional manager/client/professor roles identify their holder; symmetric roles use one representation. Contact-owned immutable general/unknown/organization/project contexts and explicit episode IDs permit friend, coworker, teammate, and manager claims to coexist without name-based merging or one-role-per-contact uniqueness. Both validity boundaries may be unknown; year/month/date/instant precision, exact end-exclusive and within-period ends preserve uncertainty. Rejection, historical transition, factual correction, and reconsideration have distinct atomic effects and scoped current/interval/all-history correction reach. V6 binds temporal ends to transition evidence and retains scoped correction constraints when former positive role support is removed. Negative evidence of the exact proposition does not turn another compatible role into a contradiction. The fixed 4 KiB/16 KiB transport, 20-row revision/filter-bound pages, eight links, 100 decisions/versions per scope, and 100 episodes/contact remain enforced.

Fresh/v1/v2/v3/v4/v5 encrypted stores reach v6 without changing SQLCipher compatibility 4, key custody, or the production preference projection. The Windows x64 Electron/Node 24 native gate verifies encrypted migration, directed coexistence, historical retention, temporal-evidence deletion, correction bypass prevention after source deletion, separately re-keyed snapshots, restart, and deletion with synthetic fixtures; SQLite-level tests cover rollback, time overlap, evidence dependencies, and capacity. Old v5 temporal ends with ambiguous or missing evidence linkage become unknown rather than remaining unsupported known dates. The development inspector remains read-only with predicate filtering and context pages. Production has no relationship entry, generic memory IPC, automatic source, or coaching reader. See the [DATA-03 execution plan](../.agent/plans/data-03.md).

The final DATA-03 recheck also requires correction-aware as-of reads and migration of uniquely identified v5 transition links to contextual-only support. A current-only rejection must not be overridden by old exact bounds at the current query time, though a provably earlier interval may still read as applicable. Deleting an original role source after migration must not leave the transition source as the sole positive role evidence. The native gate covers both with synthetic encrypted fixtures.

## Other post-MVP milestones (not approved for implementation)

Order these only after MVP evidence identifies the need:

1. **Evaluation and calibration hardening** — larger reviewed datasets, confidence calibration, skill-selection calibration, regression tracking, and prompt/model version comparisons.
2. **Additional providers and advanced routing** — second and third major adapters, shared conformance tests, then optional compatible/local endpoints and per-task model selection only where measured needs justify them.
3. **Generate capture automation** — remembered confirmed regions with reset controls, followed by active-window awareness and automatic conversation-region detection only as evaluation justifies each step.
4. **User-controlled memory** — covered by the bounded DATA/MEM sequence above, beginning with explicit preferences and controls.
5. **Conservative contact identity and memory** — covered by DATA-02, MEM-00, and DATA-03, not a parallel subsystem.
6. **Large-catalog skill retrieval** — metadata plus hybrid/semantic retrieval, reranking, and pgvector only after measured scale or relevance failures warrant it.
7. **Skill Factory** — offline generation, deduplication, evaluation, approval, versioning, and deprecation workflow.
8. **Optional explicit insertion** — only after a separate safety review; still no automatic send.
9. **iOS client** — SwiftUI app and Share Extension, followed later by a UIKit custom keyboard if platform constraints and user value justify it.

App-specific messaging integrations and automatic sending remain outside the plan unless the product strategy is explicitly revised; automatic sending requires changing a foundational product invariant.

Cloud sync, PostgreSQL memory hosting, Message Coach accounts, multi-device storage, vector memory search, aggressive identity merging, unbounded ingestion, full-history prompts, natural-language deletion commands, and large autonomous memory agents are explicitly deferred. Indefinite retention does not authorize raw archives or unbounded resource use.

## Next recommended work

DATA-00 through DATA-03 and MEM-00 are complete on `DB`. The next dependency-ordered memory milestone is MEM-01 observation/handoff; it remains unapproved and requires its own execution plan and acceptance review. DATA-03 alone does not enable real conversation provenance, automatic relationship population, or coaching personalization.

In the existing coaching track, keep the user-controlled proxy configured for explicit live evaluation, rerun Phase 2/3 evaluations, and complete human-reviewed generic-versus-skill-guided comparison. Separately complete Windows 100%/125% DPI and second-monitor validation. These pending gates remain visible and are not closed by documentation work. Large-catalog retrieval and Skill Factory remain unapproved.
