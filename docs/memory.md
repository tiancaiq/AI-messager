# Local Data + Memory contract

## Status and locked direction

DATA-00 defines the architecture contract. DATA-01 completes protected local SQLCipher persistence; DATA-02 adds internal contacts, platform identities, and reversible identity associations; MEM-00 adds typed assertions/evidence/decisions; and DATA-03 migrates the store through schema v6 for internal relationship history. The message-length setting remains the only production writer and projects from one canonical confirmed assertion. Relationship categories and roles are separate assertion specializations with their own evidence, acceptance, context, direction, episode, validity, and correction history—not a contact enum or independently writable relationship database. All general lifecycle APIs remain trusted-main/utility internals with synthetic-only relationship fixtures. Production exposes no contact/identity/relationship entry UI, generic memory IPC, or renderer database access. Future observation milestones must add truthful provenance, enablement, and review controls before invoking these APIs with real data. The development-only inspector pages implemented records through the same coordinator; production has no inspector. Screenshots, messages, summaries, automatic acquisition, and coaching influence remain absent. See the [DATA-03 execution plan](../.agent/plans/data-03.md), [architecture](architecture.md#data--memory-boundaries-data-00), [privacy](privacy.md#local-memory-storage-data-00), and [roadmap](roadmap.md#data--memory-roadmap).

DATA-03 fixes ten role values (`MANAGER`, `COWORKER`, `TEAMMATE`, `CLIENT`, `PROFESSOR`, `FRIEND`, `ROMANTIC_PARTNER`, `SPOUSE`, `FAMILY`, `ACQUAINTANCE`). Manager, client, and professor explicitly identify which endpoint holds that role; symmetric roles do not invent a direction. Organization/project labels are bounded metadata on immutable, contact-owned context UUIDs, not company accounts or merge keys. Broad category never confirms a specific role; compatible roles and separate episodes coexist. A correction may reject only current reach, a supplied interval, or all retained history. Rejection does not imply the role used to be true; a sourced transition retains acceptance and can mark history with an unknown, exact, or within-period end. Schema v6 separately links each temporal-end decision to its evidence: removing that source invalidates the end and historical applicability while retaining independently supported role acceptance. Removing the last positive role source downgrades a scoped correction's anchor to rejected/unknown instead of deleting its constraint. Source/recorded/validity times remain separate, and old records are not removed for age alone. A bounded as-of helper returns unknown when partial time cannot prove applicability, but recognizes a known earlier interval even after the record becomes historical.

An as-of relationship page applies active scoped corrections before reporting effective applicability. A current-only rejection can therefore preserve a provable earlier interval without showing the rejected role as current after the decision. During v5→v6 upgrade, a uniquely attributed legacy transition source is relabelled as contextual temporal support, not positive role support. If it was the only apparent support for a positive role assertion, the existing unsupported-assertion cleanup removes that claim; it is not retained as trusted history merely because the old link was misclassified.

### External development inspection

SQLiteStudio (renamed Letos in the current upstream project) can inspect SQLCipher databases through its [SQLite3MultipleCiphers plugin](https://github.com/pawelsalawa/letos/wiki/Official_plugins). Do not point it at the application's live database or key envelope. On the supported Windows development host, close the desktop app, then run:

```powershell
pnpm --filter @ai-message-coach/desktop debug:memory-gui
```

The GUI command detects Letos, verifies that SQLite3MultipleCiphers loads, creates a separately keyed encrypted snapshot, and pre-registers it as SQLCipher compatibility 4 in a disposable portable Letos profile. The connection runs with `PRAGMA query_only = ON`. The snapshot password exists only in that temporary profile—not in process arguments, the clipboard, the repository, or the normal Letos profile. Close Letos to remove the portable profile, password, and snapshot.

The lower-level workflow remains available when manual or another-tool inspection is needed:

```powershell
pnpm --filter @ai-message-coach/desktop debug:memory-snapshot
```

The command starts the normal unpackaged Electron entry without a window, loads the OS-protected key through main, and asks the existing utility process to export an encrypted copy into a random OS-temporary directory using the documented SQLCipher [`ATTACH ... KEY` and `sqlcipher_export()` flow](https://www.zetetic.net/sqlcipher/sqlcipher-api/). It prints only the snapshot path and a newly generated snapshot-specific passphrase. In SQLiteStudio/Letos, use the SQLite3MultipleCiphers database plugin, select SQLCipher, and choose [SQLCipher compatibility/legacy version 4](https://utelle.github.io/SQLite3MultipleCiphers/docs/ciphers/cipher_sqlcipher/); open the generated copy read-only. Press Enter in the command terminal when finished to delete the snapshot. If the command is run without an interactive terminal, delete the printed containing temporary directory manually.

Neither workflow produces plaintext, passes the application key to the external tool, or permits the external tool to mutate the live store. The application does not install or bundle SQLiteStudio/Letos. If Letos or its official SQLite3MultipleCiphers plugin is absent, the GUI command stops with an installation instruction instead of modifying the machine.

The Data + Memory MVP is local, single-user, SQLite-oriented, offline-capable, asynchronous, incremental, and bounded-context. One installed app has one local user context and one store. There is no Message Coach account, login, authentication service, multi-profile system, cloud storage, sync, or PostgreSQL requirement.

Useful structured knowledge may remain indefinitely. Storage lifetime is separate from freshness, temporal validity, relevance, and retrieval priority. There is no blanket 30-day or 90-day deletion rule. Raw screenshots and raw conversations remain temporary by default.

Management uses application settings, inspection, edit/correct, and delete controls, not a conversational agent. Acquisition starts disabled until enabled; use of retained memory can be disabled independently. Disabling acquisition invalidates outstanding acquisition work but does not delete stored knowledge. The coach remains useful without memory and never sends messages.

Storage, inspection, correction, deletion, retrieval, and deterministic processing work offline. Existing remote-provider coaching and later model-assisted memory tasks need connectivity; local storage does not imply local model processing. Such tasks require capability checks, disclosure, minimized input, and bounded usage. No application-operated content service is added.

## Repository integration constraints

- The existing conversation analysis schema is observation-only. Message IDs are analysis-local, not platform IDs. Stable account namespaces, source timestamps, and per-message participant IDs are absent.
- USER, OTHER, and UNKNOWN cannot identify every group participant. Never assign all OTHER messages to one contact.
- Main must create acquisition provenance from its validated analysis result. Renderer-submitted analysis is not durable observation authority; UI corrections use a separately labeled command.
- The coaching prompt currently excludes memory; output guards check factual anchors against current messages, draft, and selection. MEM-05 must update both boundaries together without weakening action/intent/commitment protection.
- MemoryReader is conceptual, not implemented. Add a narrow port only at its first real consumer; do not scaffold unused adapters or services.
- Existing SkillDefinition is coaching-action-specific. Future memory tasks share packages/skills approval, validation, and composition ownership through a task-specific contract. They are not new AgentAction values or a parallel registry/prompt system.

## Ownership and conceptual entities

LocalUserContext is a singleton, not an account. A random localContextId gives preferences a subject and supports consistent local migration/export. Main selects it; the renderer cannot nominate another owner. Independently addressable records carry this context; dependent records inherit it through enforced parent references. Every link stays within the same store/context. No tenant middleware or login is needed.

Use random UUIDs, database schema versions, and integer revisions on mutable records. Record revision, extraction/derivation version, and dataset generation are distinct. Dataset generation changes on clear/reset; narrower scope generations/revisions invalidate contact/category work on deletion or correction. These are local race controls, not sync infrastructure.

| Entity | Purpose and relationships | Durability and origin |
|---|---|---|
| LocalUserContext | Local root, memory settings, preference subject; no email/login/secret fields | Durable application/user state until reset |
| Contact | Person represented by this user, label and minimal metadata, links to identities/assertions | Durable accepted organization; no timeless relationship/language/style |
| PlatformIdentity | Refines ContactIdentity: platform account or unresolved identity, identifier kind and namespace; observed handles distinguished from verified IDs | Selected source observations; no automatic person proof |
| IdentityAssociation | Candidate/confirmed/rejected/revoked identity-to-contact or self link, evidence, interval, authority, revision; subsumes IdentityLinkCandidate | Durable reversible resolution/history |
| EvidenceRecord | Shared MemoryEvidence/IdentityEvidence provenance: bounded observation, attribution, subjects, source time, quality, lineage | Selected structured source or explicitly labeled derived evidence; raw source need not remain |
| InteractionObservation | Bounded observed episode, coverage limits, optional event time | Minimal source envelope retained when supporting useful knowledge, never complete interaction history |
| InteractionParticipant | Speaker with optional identity/contact and association revision | Retained attribution assessment; unresolved is valid |
| MemoryAssertion | Typed category/subject/predicate/value/context, evidence, acceptance, confidence dimensions, time | Inferred or explicitly supplied proposition, potentially indefinite |
| RelationshipRecord | Typed assertion specialization: direction, broad category or specific role, organization/project, interval | Current/historical knowledge; no duplicate independently writable relationship record |
| AssertionEvidenceLink | Supports, contradicts, or contextualizes an assertion/aspect/time | Provenance; shared source does not multiply independence |
| MemoryDecision | UI confirmation/rejection/correction or approved policy decision, target, time, replacement | Authority record retained with relevant knowledge; deletable, not a perpetual content audit |
| InteractionSummary | Bounded episode items with subjects, coverage, uncertainty, source references | Derived; useful history may remain indefinitely |
| ContextSummary | Compact current contact/topic/project/relationship state referencing assertions/evidence | Replaceable projection; meaningful history retained separately |
| CommunicationObservation | Features of attributable user messages, context/language, source-time coverage, duplicate group | Derived compact evidence; no default raw text retention |
| CommunicationContribution | Sufficient statistics per contact/context/period with source coverage and removable contributions | Derived compact support; must preserve deletion capability |
| CommunicationProfile | Dimension estimates, samples/diversity, confidence, freshness, input revision, derivation version | Disposable projection of retained support |
| UserCommunicationProfile | USER scope of the shared profile model | Derived global fallback |
| RelationshipCommunicationProfile | RELATIONSHIP_TYPE/context scope, using relationship at sample time | Derived |
| ContactCommunicationProfile | CONTACT scope, optionally language/context-qualified | Derived |
| DerivationDependency | All sources and subjects contributing to summaries/profiles | Retained correction/deletion metadata |
| ProcessingReceipt | Observation/task identity, committed versions/result references; no raw text | Minimal replay metadata, removed with applicable deleted data |

Entities do not mandate separate tables, packages, or services. Typed predicates define value shape, subject, multiplicity, scope, contradiction rules, and temporal policy; no unconstrained arbitrary-fact graph. Friend, manager at Organization A, and teammate on Project B may coexist. Broad professional/personal confidence is separate from specific-role confidence. Explicit preferences are accepted assertions, not learned averages.

~~~text
LocalUserContext (one store)
  +--< Contact
  +--< PlatformIdentity --< IdentityAssociation >-- Contact or self
  +--< InteractionObservation --< InteractionParticipant
  |           +--< EvidenceRecord
  |           +--< InteractionSummary
  |           +--< CommunicationObservation
  +--< MemoryAssertion --< AssertionEvidenceLink >-- EvidenceRecord
  |           +-- RelationshipRecord (typed specialization)
  |           +--< MemoryDecision / replacement links
  +--< ContextSummary --< DerivationDependency >-- sources/subjects
  +--< CommunicationProfile --< contributions/dependencies
~~~

Less-than denotes many. Multiple candidate identity associations are valid, but at most one effective confirmed person/self target exists for an interval. Mixed-subject records retain all implicated subject references.

## Evidence, acceptance, and authority

Observation is acquisition; evidence is a sourced observation bearing on a proposition; inference proposes interpretation; assertion records a proposition; confirmation accepts it in a scope. A visible statement supports that someone said something, not automatically that it is true or current.

Separate acceptance (CANDIDATE, CONFIRMED, REJECTED), freshness (supported, STALE, unknown), applicability (current, historical, future, inactive, unknown), replacement (active, SUPERSEDED), and data lifecycle (retained, unavailable during deletion, removed). DELETED is not a belief state.

| Transition | Cause and effect |
|---|---|
| Evidence to candidate | Useful allowed proposition, attributed source, bounded admission, acquisition enabled; no trusted factual use |
| Candidate to confirmed | Explicit UI acceptance initially; future automatic promotion needs a separately evaluated predicate policy |
| Candidate/confirmed to rejected | Explicit correction or decisive applicable contradiction; remove positive influence, retain minimal correction constraint |
| Confirmed to stale | Insufficient current support, predicate review horizon, unresolved conflict; preserve acceptance/history, invent no end date |
| Stale to supported | New qualifying independent support or explicit reconfirmation |
| Active to superseded | Accepted linked replacement; preserve meaningful historical facts |
| Rejected to reconsideration | Explicit revisit or genuinely changed time/context creates a new reviewable candidate; never silent reactivation |

Dismiss/snooze is not rejection. Historical validity is not staleness. A confirmed historical relationship may remain reliable history indefinitely.

Authority is claim-specific: explicit UI correction outranks conflicting inference; confirmation outranks guesses; verified identifiers support account recognition, not roles; observed communication supports attributed statements; repeated independent evidence may strengthen support; summaries inherit source limitations. Avatar/style/topic similarity is weak candidate evidence only.

Apply ownership, attribution, temporal/context scope, authority, corrections, and dependency checks before numeric ranking. Ten weak guesses never override explicit correction. Extraction, speaker, identity, predicate, and temporal confidence stay separate; current model estimates are not calibrated probabilities.

Repeated extraction, summary plus originating text, generated/copied draft, or a model repeating its own inference adds no independent evidence. Instructions inside conversation text cannot invoke application management commands. Models cannot directly confirm, delete, or link records.

## Temporal and retention contract

| Field/concept | Exact meaning |
|---|---|
| observedAt | Main-owned acquisition time |
| occurredAt / source-time range | Supported message/event time; nullable with precision/timezone provenance |
| firstObservedAt | Earliest acquisition in support lineage; derived/cacheable, not universal |
| lastSupportedAt | Latest known effective source time of qualifying support; rereading old text never advances it to today |
| confirmedAt | Acceptance decision time; reconfirmations are separate decisions, not validity starts |
| validFrom / validUntil | Source-supported applicability interval; exact end exclusive; unknown is not forever |
| expiresAt | Semantic cutoff for current influence where supported; not a storage deadline |
| createdAt / updatedAt | Record timestamps, not evidence freshness |
| processingDeadline | Temporary input/job lifetime, unrelated to durable memory age |

Support exact instants, calendar dates/months, approximate ranges, and unknown time. Do not turn January into January 1 or undated Friday into an invented deadline. Last observed message is not last real-world interaction; say “no recent observed messaging evidence.”

STABLE, SEMI_STABLE, TEMPORARY, and EPHEMERAL are predicate-policy defaults, not one TTL. Sibling history may remain useful while an old manager claim needs current support and past “busy now” context expires. Account reassignment risk differs from family stability.

| Data | Storage policy | Retrieval/disposal |
|---|---|---|
| Screenshots/crops | Temporary memory only | Existing capture cleanup; never enqueue pixels for memory |
| Raw messages/full ConversationAnalysis | Active-session/task memory only | Finite processing deadline; no raw-content disk queue/archive |
| Draft/generated replies | Current coaching session by default | Not evidence of sending, completed promises, or habits |
| Selected assertions/identity evidence/corrections | May remain indefinitely | Identity, acceptance, time, relevance filters; no age-only purge |
| Relationship/useful interaction history | May remain indefinitely | Historical retrieval when relevant; inactivity is not deletion |
| Stale/rejected/superseded knowledge | Preserve meaningful history/corrections | No unqualified current positive use; correction constraints prevent relearning |
| Temporary context | May remain as useful history | Semantic expiration permits disposal only if no retained historical/evidence dependency needs it |
| Summaries/features/contributions | Retain useful compact knowledge | Compact redundant detail with provenance/deletion capability |
| Profiles/redundant projections | Disposable from retained inputs | Invalidate/rebuild; disclose inability to re-derive from discarded detail |
| Operational logs | Bounded rotation, content-free | No memory values, identity, prompts, subject identifiers, or keys |

Retrieval exclusion never itself deletes data. Supersession preserves history by default; mechanical versions without unique value may be discarded. Indefinite retention is not infinite capacity: admit useful propositions, deduplicate, bound candidates, compact disposable data, show local usage, and pause acquisition under disk pressure instead of silently deleting history.

## Local flow and async boundary

~~~text
Capture -> validated main-owned ConversationAnalysis
                         |
              +----------+-------------------+
              |                              | bounded non-waiting handoff
              v                              v
        Main coaching                  MemoryObservation
              ^                              |
              |                              v
 Optional bounded read              Deduplicate / attribute
 of committed memory                         |
              |                              v
 Action -> skills -> wording        Read bounded relevant state
              |                              |
              v                              v
       Present response             Deterministic task and/or
       [response ends]              approved memory skill
                                             |
                                             v
                                    Validated update proposal
                                             |
                                             v
                                    Revision/deletion checks
                                             |
                                             v
                                    Atomic local persistence
~~~

Foreground coaching never waits for this observation's extraction/write. A committed-memory read has a deadline and distinguishes context, disabled, empty, identity-unresolved, unavailable, and deadline-exceeded. Missing memory falls back to current context. Background completion never silently replaces a displayed reply.

### MemoryObservation conceptual input

| Group | Allowed contents |
|---|---|
| Envelope | Main-generated ID, contract version, local context, acquisition time |
| Provenance | Opaque main-owned analysis-session reference, source kind, extraction version, warnings |
| Identity | Observed platform/name/handle/namespace hints with confidence; optional association reference/revision, never guessed confirmed contact |
| Fragment | Bounded messages/structured observations, local references/order, speaker uncertainty, source references |
| Language/time | Language/script/code switching/confidence; event time only when supported |
| Coverage | Cropped/truncated/ambiguous/overlapping/omitted context flags |
| Validity | Dataset generation, acquisition-policy revision, association/correction/scope revisions |

Exclude application state, images/avatars, provider wire objects, credentials, hidden reasoning, unrelated history, and generated replies. The analysis reference is not a permanent transcript locator. Drafts are excluded initially; a later caller needing them must label them unsent and cannot treat them as durable behavior.

Admission performs bounded validation/selection and an in-memory handoff without waiting on disk/network. Queue count AND bytes are finite. Raw-text-bearing inputs have deadlines. Loss before commit on crash/shutdown is acceptable and disclosed. No persistent raw dead-letter queue or replay after restart. Recoverable work may later reference already permitted compact records only in an approved milestone.

Foreground CPU/database/provider work takes priority. A promise does not make synchronous CPU/SQLite work non-blocking: choose a trusted desktop execution mechanism that passes responsiveness tests when implemented. No broker/service is required.

Queue overflow coalesces known duplicates/safe compatible work or rejects new work with safe status. Never truncate negation or necessary correction constraints to proceed. Offline model work expires with temporary input; deterministic work continues. Cancellation, acquisition disable, and shutdown release transient input within bounded time.

### Commit and replay contract

Read bounded state and its revisions, compute outside a transaction, validate the proposal, then atomically commit effects plus processing receipt. No write transaction spans a provider call.

- Same observation/task replay has at most one committed effect. Changing skill version is not new independent evidence.
- Analysis-local message IDs do not deduplicate screenshots. Supported source identity/bounded overlap can help; uncertain duplicates must not inflate counts. No global raw-content fingerprint index.
- Conflicting revisions serialize or reject stale updates. Bounded re-read/re-evaluation or discard/defer replaces last-write-wins.
- Dataset reset, contact/category deletion, acquisition disable, identity correction, and applicable UI correction invalidate outstanding jobs. Check generations/revisions inside commit.
- Late results cannot recreate deleted subjects or bypass corrections. Invalidated cached projections cannot be served.
- Failure rolls back updates and receipt together. Retry attempts/deadlines are finite. Invalid output produces no partial write.

## Incremental tasks and bounded retrieval

Each task gets new fragment + small relevant prior state + applicable correction constraints. Application code selects state; a skill cannot query arbitrary SQL, browse contacts, recursively fetch more, or paginate until satisfied.

Allowed state: relevant association, applicable relationships, matching predicate/topic assertions, compact context summary, relevant habit dimensions, correction constraints. Output proposes candidates, evidence links, temporal changes, summary items, or features. Application policy owns acceptance/deletion/identity.

For Project Phoenix's testing-date change, retrieve its active deadline and compact project context, not 200 conversations with Alex. Unknown dates stay unknown; “probably Monday” cannot become a commitment.

Deduplication, no-op detection, and mechanical feature extraction precede model use. Normally zero or one background model call serves a meaningful bounded batch. Before enabling it, the owning milestone needs capability/privacy/usage review and evaluation. No extra foreground call, automatic repair loop, or full-history fallback.

### Required resource budgets

These are conceptual policy fields, not configuration added by DATA-00. Implementing milestones select finite values and test each limit, limit-plus-one, and failure before enabling a caller. No default means unlimited. Counts AND byte/token ceilings apply, including references/metadata/output.

| Budget | Required limits | Overflow |
|---|---|---|
| Observation | Item count, per-item/total bytes, input lifetime | Select complete bounded fragments with coverage flags or skip |
| Scheduling | Pending count/bytes, concurrency, deadline, attempts | Coalesce safe work, reject/defer/expire; foreground unaffected |
| Coaching read | Identity/relationship/assertion/profile/summary counts, total bytes/tokens, deadline | Omit low-priority eligible context or no-memory fallback |
| Memory update read | Subject/predicate/topic scope, counts/bytes/tokens/deadline | Reduce optional state or defer; required correction controls cannot be dropped |
| Model task | Input/output tokens, calls per batch, accumulated usage allowance | Skip/defer with safe status, no expanding context/repair loop |
| Update/compaction | Output count/bytes, source batch size, dependency traversal depth | Reject unsafe proposal or separately schedule bounded maintenance |

Illustrative evaluation inputs: one identity, up to three relationships, six active memories, eight dimensions, two summaries, under a 1–2k-token memory-context cap. These are fixture starting points, not production constants. Required correction constraints must fit or the task falls back/defers. Maintenance runs only for changed scopes/size thresholds with its own usage allowance, never an automatic full-history model sweep.

Hard filters precede ranking: context/subject ownership, use setting, current identity gate, acceptance, applicable time, no rejected/superseded/deleted/invalidated positive fact, provenance, sensitivity, and unresolved contradictions. Historical queries select historical scope explicitly. Candidates stay in review/acquisition context, not trusted response facts.

Rank by relevance, contact/context specificity, authority, temporal support, explicit importance, and bounded diversity. Importance cannot bypass identity/corrections. Recent windows apply to temporary context, not a global age cutoff. Inspection/history UI pagination is independent of model retrieval.

## Summaries, compaction, and habits

Temporary fragment -> selected evidence/episode summary -> compact topic projection and assertion proposals is progressive compression, not a confidence-promotion ladder.

- Evidence is append-oriented while retained but remains correctable/deletable.
- Episode summaries are bounded/source-linked; context summaries are replaceable input-versioned projections.
- Assertions, meaningful historical outcomes/intervals, and corrections survive removal from current context.
- Summary items name subjects, time, reported/inferred/confirmed/disputed/historical status, and sources. They inherit authority and do not become extra evidence.
- Preserve negation, uncertainty, speaker, dates, and conflicts. Prefer structured items to repeatedly rewriting a growing paragraph.
- Remove redundant projections without losing unique history. Rebuilding uses only retained inputs; do not promise recovery of discarded messages or re-estimation from absent text.

Learn only from attributable observed user messages, excluding other/unknown speakers, generated suggestions, copy events, and unsent drafts. One message updates supported dimensions, not an entire profile.

Dimensions include length distributions, emoji/punctuation, language/script/code switching, and qualified formality/directness/warmth estimates. Each has sample count, distinct episodes, confidence, source-time coverage, context, language, derivation version. Unknown is not zero. Repeated captures/one long episode do not become many independent samples.

Resolve per dimension using current explicit direction/intent and standing constraints, strong current conversation evidence, applicable explicit preferences, contact behavior, relationship-context behavior, then global fallback. Habits never alter intent/refusal/commitments. A standing “no emojis” instruction survives statistical observations unless changed. Draft language may win while contact habit informs brevity.

Relationship samples use the role applicable at sample time. Global/relationship profiles aggregate separable contact contributions. If source removal cannot be subtracted after compaction, invalidate that contribution and rebuild from remaining inputs or drop it; never preserve uncontrolled influence.

English, Simplified/Traditional Chinese and intentional code switching retain supported language-aware behavior. Other languages use universal skills only. Habits never prove identity.

## Identity and UI correction

Observed identity -> unresolved -> candidate association -> strong evidence/explicit confirmation -> confirmed link. Name/avatar/style/topic similarity, even combined, never automatically merges people. OCR handles are not verified account IDs. New cross-platform links require explicit UI confirmation initially.

Automatic reuse requires reliable recognition of the same confirmed account/namespace, effective association, and no reassignment/conflict. Current extraction often cannot meet this gate. Unknown identity retrieves user preferences only. Session-only selection need not authorize permanent association. Shared accounts remain unresolved for person memory.

Undo a bad association by revoking it, finding attributions through its revision, preserving independently confirmed knowledge, quarantining uncertainty, and rebuilding projections. Never destructively merge contacts or guess how to redistribute history.

| UI meaning | Treatment |
|---|---|
| This was incorrect | REJECT in specified time/context; retain minimal correction constraint |
| This used to be true | Preserve supported history, stop current use, invent no end date |
| Replace with this | Accept replacement and SUPERSEDE old representation, preserving meaningful history |
| Dismiss/not now | Snooze, not rejection |

“Alex is not my manager” corrects current applicability by default, not every historical interval. “Never my manager” rejects history too. “Stopped managing me in 2023” supplies an end with stated precision. Store the UI decision separately. Future work loads relevant subject/predicate/context/time constraints; weak guesses never override them. Truly new circumstances yield a new reviewable candidate.

## Deletion operations and dependencies

UI/system controls initiate operations, never conversation text. Make the scope unavailable for retrieval first. Commit removal and generation/revision changes atomically where possible. Large cleanup may be chunked only after logical unavailability, with bounded resumable cleanup; late jobs/caches still honor invalidation.

| Operation | Scope |
|---|---|
| Delete contact | Contact, exclusive identities/associations, relationships, knowledge/evidence, episodes/summaries, habits, all derived influence; remove/rebuild mixed-subject data |
| Delete contact memory | Keep contact/confirmed identity organization; remove knowledge, roles, learned context/evidence/habit contributions |
| Delete interaction history | Selected episodes/summaries/features and claims solely supported by them; independently UI-confirmed facts may remain on separate confirmation evidence |
| Reset communication profile | Remove applicable learned observations/contributions and affected projections, not merely a cache that immediately regenerates |
| Delete individual memory | Claim and exclusive evidence/history/correction records in scope plus derived influence; preserve independent unrelated knowledge |
| Clear all local memory | Entire memory dataset/queue/cache, new dataset generation; explicitly preserve separate app/provider configuration |

Track all subjects, including contacts mentioned inside another contact's summary. Remove structured items when provable; otherwise remove the containing summary/contribution and rebuild. Missing provenance means suppress/delete the derivation, not assume it is unrelated.

Delete-existing and prevent-future-acquisition are different controls. Do not retain a hidden permanent identity fingerprint after deleting all contact data. A later per-contact acquisition switch can retain minimal disclosed scope. Complete erasure cannot simultaneously promise recognition forever. User exports/OS backups and previous provider transmissions lie outside local erasure guarantees.

## Deterministic implementation acceptance scenarios

These are design cases, not executable tests added in DATA-00. Each owner adds synthetic tests and boundary integration coverage.

| ID | Scenario | Required result | Owner |
|---|---|---|---|
| M01 | Two Alex identities share name/avatar/style | Separate/unresolved; no wrong-contact disclosure | DATA-02 |
| M02 | Old message captured today | Event time stays old/unknown, no false freshness | MEM-01 |
| M03 | Multiple OTHER speakers | No guessed contact attribution or user habit | MEM-01 |
| M04 | Old manager plus “since I left the company” | Check speaker/company/time; suppress unsafe current role, propose change, preserve history | DATA-03/MEM-03 |
| M05 | UI rejects classmate; ten guesses recur | Correction wins; no promotion/positive retrieval | MEM-00/MEM-03 |
| M06 | Five years without observations | Only “no recent observed messaging evidence” | DATA-03/MEM-05 |
| M07 | Same observation/task twice | One committed effect/receipt, no added evidence weight | MEM-01 |
| M08 | Overlapping captures without stable IDs | No unjustified independent sample count | MEM-01/MEM-04 |
| M09 | Out-of-order summary updates | Revision blocks overwrite, bounded retry/defer | MEM-01/MEM-02 |
| M10 | Correct/delete during provider work | Late result cannot overwrite/recreate | MEM-01/MEM-03 |
| M11 | Reset then old job completes | Dataset generation rejects resurrection | DATA-01/MEM-01 |
| M12 | Queue/disk full, offline, hung worker | Bounded failure; coaching never waits; no raw spool | MEM-01 |
| M13 | Each retrieval budget exceeded | Enforce bound, preserve correction controls or fall back/defer | MEM-03/MEM-05 |
| M14 | Invalid/oversized/unauthorized model patch | No partial write, confirmation, arbitrary query, repair loop | MEM-03 |
| M15 | One emoji-heavy message/copied suggestion | No profile replacement; copy is not sending/behavior | MEM-04 |
| M16 | Delete Alex from blended profile/summary | Remove all dependent influence | MEM-04/MEM-07 |
| M17 | Compact “possibly Monday” and manager history | Uncertainty/history survive; no authority inflation | MEM-06 |
| M18 | Historical fact older than 90 days | Stored; current use requires relevance/applicability | DATA-03/MEM-06 |
| M19 | Memory disabled/unavailable/unresolved | Safe current-context coaching, no extra foreground call | MEM-05 |
| M20 | Wrong/unavailable key, crash/reopen | No plaintext fallback, partial update, content logs | DATA-01 |
| M21 | Growing stored history, same query | Fixed context/call bounds; disk pressure pauses acquisition | MEM-05/MEM-07 |

## Deferred implementation choices

DATA-01 verifies encryption binding/build compatibility, key lifecycle, and temporary/journal behavior with synthetic data before real persistence. Implementing milestones choose finite numeric budgets and a responsive execution mechanism; none may default to unlimited.

Cloud sync, PostgreSQL, accounts, multi-device state, vectors, aggressive identity merging, archives, unbounded ingestion, full-history prompts, conversational deletion, large autonomous agents, runtime-generated skills, messaging integrations, and sending are outside this roadmap. Local revisions and provenance require none of them.
