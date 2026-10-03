# SRS-2.5 — Skill context signal normalization

Status: complete shadow evaluation — awaiting user review  
Owner: Codex  
Created: 2026-09-27  
Updated: 2026-09-27  
Parent direction: [Skill retrieval, selection, and planning](skills-retrieval-selection-direction.md)  
Depends on: [completed SRS-1](skills-srs-1-foundation.md) and
[completed SRS-2](skills-srs-2-retrieval.md)  
Blocks: [SRS-3](skills-srs-3-selection.md)

## Approval boundary

The user approved this SRS-2.5 shadow implementation on 2026-09-27. That approval
covered only the shadow-first work described here. It did not authorize a production
cutover, SRS-3 ranking, candidate activation, held-out work, provider calls, commits,
merges, or pushes. Those boundaries remain in force after completion.

## Outcome

Create a deterministic, evaluation-only proposed context-normalization path that
produces enough accurate semantic evidence for SRS-2 retrieval to expose relevant
capabilities, while preserving strict `NONE` and speaker/intent boundaries.

The milestone compares:

```text
CURRENT deriveSkillContext()
            versus
SRS_2_5_PROPOSED normalization
```

over exposed development evidence. It reports signal differences and their retrieval
effects without changing the production caller of `deriveSkillContext()`.

SRS-2.5 answers:

> Does normalized `SkillContext` describe enough of the observable communication
> function for retrieval to form a useful candidate pool?

It does not answer:

> Which capability should win, which combination should be selected, or how the
> final message should be composed?

## Scope

### In scope

- Deterministic normalization of existing intent and situation tags from synthetic
  conversation evidence, draft evidence, explicit selected intent, fixed action, and
  existing language fields.
- General semantic distinctions for ownership/mistake, boundary, request,
  clarification, planning, status, expectation, and follow-up evidence.
- Speaker ownership, clause polarity/negation, assistance mode, and evidence-source
  precedence.
- A private current-versus-proposed shadow comparison with closed normalization
  issue codes.
- Machine-readable exposed-development fixtures for the 18 T1–T18 cases, separated
  so expected capability labels are never inputs to normalization.
- Context-level metrics plus SRS-2 retrieval reruns at K=5 and K=10 under both
  `LEGACY_METADATA_GATE` and `SIGNAL_ONLY`.
- Preservation of all SRS-1/SRS-2 evidence boundaries, production registry parity,
  language-modifier separation, fixed `AgentAction`, and candidate isolation.

### Out of scope

- Production cutover to the proposed signals or any default behavior change in
  `deriveSkillContext()` or `CoachingEngine`.
- Changes to `SkillEngine.select()`, SRS-2 hard gates, the 12/10 score, Top-K logic,
  thresholds, tie-breaking, candidate metadata, or approved YAML.
- SRS-3 reranking, supervisor selection, modifier selection, final resolution,
  budgets, `SkillPlan`, prompt compilation, or production integration.
- New embeddings, vector databases, lexical-search dependencies, model reranking,
  model judges, provider calls, or services.
- Candidate-specific fixes or activation of `perspective_acknowledgement`,
  `give_constructive_feedback`, or `confirmation`.
- Authoring, inspecting, unsealing, or scoring a held-out corpus.
- Treating the 210 canonical authoring examples as routing metrics or changing their
  `PENDING_HUMAN_REVIEW` state.
- Skill metadata edits. A discovered metadata mismatch is recorded as
  `SKILL_METADATA_GAP` and deferred for separate review.

## Current normalization architecture

The production flow is:

```text
ConversationAnalysis + optional user selection
        ↓
decideCoachingAction()
        ↓ fixed CoachingPolicyDecision / AgentAction
deriveSkillContext()
        ↓ SkillContextSchema
SkillEngine.select() or private SRS-2 shadow retriever
```

`packages/ai/src/skill-context.ts` currently builds these evidence sets:

- `otherEvidence`: messages whose speaker is `OTHER`;
- `userMessages`: messages whose speaker is `USER`;
- `currentUserIntent`: draft plus explicit selected intent, when present;
- `userOwnedEvidence`: user messages plus current-user-intent evidence;
- `visible`: all visible messages, draft, and selected intent;
- `intentEvidence`: policy intent, draft, and selected intent.

It then applies regular-expression predicates and writes existing
`SkillSituationTag` and `SkillIntentTag` values. Useful safeguards already present
and to be preserved include:

- mistake/apology and boundary/decline negation filters;
- user-owned evidence for mistake, apology, and status intent;
- `OTHER` pressure not being treated as a user boundary by itself;
- fixed action and language copied from upstream analysis/policy;
- optional Phase 8 candidate routing guarded by
  `experimentalCandidateRouting: true`;
- no skill ID or selected production plan used as normalization input.

The current shallow points are concrete:

1. mistake ownership relies on a narrow error/apology word list;
2. boundary detection recognizes a few fixed constructions such as “can't keep”;
3. request intent mainly recognizes `can/could/please/would` surface forms;
4. clarification intent is inferred from request-shaped policy text rather than the
   communication function of the draft or selected intent;
5. planning situation and intent scan broad visible text for words such as
   `meeting`, `when`, `schedule`, or a time expression;
6. status intent depends on a narrow progress/status lexicon and excludes some
   current-state descriptions;
7. generic negation such as “don't want to promise” or “won't finish” can create a
   `decline` intent even when the function is expectation setting;
8. the same lexical hit is not consistently conditioned on evidence source,
   ownership, clause role, or assistance mode.

The shared tag vocabulary already contains the signals needed for the six priority
failures: `acknowledge_mistake`, `make_request`, `provide_status`, `set_boundary`,
`plan`, `clarify`, `set_expectation`, `follow_up`, and their existing situation
neighbors. SRS-2.5 therefore plans no shared schema/tag addition. If implementation
proves a new tag is essential, work stops for a plan amendment before contracts or
metadata change.

## Observed failures and earliest stage

The source is the 18-case exposed-development report at
`docs/skills/srs-2-srs-3-additional-exposed-diagnostics.md`. Expected capability
labels identify evaluation outcomes only; they are not evidence supplied to the
normalizer.

| Case | Current signal result | Earliest normalization failure | Required effect |
| --- | --- | --- | --- |
| T1 | No mistake/ownership signal for “I should have updated you earlier”; false `decline`, `plan`, and `invitation` signals also appear | `DRAFT_EVIDENCE_IGNORED`, `MISSING_INTENT_SIGNAL`, with over-broad lexical evidence recorded separately | Add supported user ownership so `acknowledge_mistake` enters the positive-signal pool; do not force its rank |
| T6 | No intent or situation tags for “I used the old figures” | `DRAFT_EVIDENCE_IGNORED`, `MISSING_INTENT_SIGNAL`, `MISSING_SITUATION_SIGNAL` | Recognize first-person admission of an incorrect action without requiring apology words |
| T11 | Explicit selected intent “Ask them to send it to you” produces no tags | `SELECTED_INTENT_NOT_NORMALIZED`, `MISSING_INTENT_SIGNAL` | Emit request evidence from semantic selected intent, not only polite-question syntax |
| T15 | “I haven't received the confirmed time yet” produces planning but no status intent | `DRAFT_EVIDENCE_IGNORED`, `MISSING_INTENT_SIGNAL` | Recognize a current unresolved state so `status_update` receives positive evidence while code-switching remains a modifier |
| T17 | “Meeting moved to 3 PM. / Thanks, got it.” emits intent `plan` and situation `planning` | `OVER_BROAD_LEXICAL_TRIGGER`, `FALSE_INTENT_SIGNAL`, `FALSE_SITUATION_SIGNAL` | Treat a settled notification plus acknowledgement as strict `NONE` capability evidence |
| T18 | “I can't stay late tonight” under deadline pressure does not emit `set_boundary` | `DRAFT_EVIDENCE_IGNORED`, `MISSING_INTENT_SIGNAL` | Recognize a user-stated participation/work limit so `boundary_setting` enters the pool |

Secondary context issues are measured but are not allowed to become rank-tuning
proxies. T10 lacks a `clarify` intent even though signal-only retrieves
`clarification` from its broad request situation. T8/T14 can produce a false
`decline` intent from future uncertainty. T3, T4, T9, and T12 already expose their
focal capabilities; their ordering and broad-neighbor discrimination remain SRS-3
work. A general semantic rule may change their tags, but no rule is accepted merely
because it improves their rank.

## Assumptions and decisions

### 1. Production remains on the current profile

Introduce an internal profile boundary:

```ts
type SkillContextSignalProfile = "CURRENT" | "SRS_2_5_PROPOSED";
```

The public production `deriveSkillContext()` entry point continues to use `CURRENT`
unconditionally. The proposed profile is callable only by direct internal tests and
the evaluation script; it is not exported from `packages/ai/src/index.ts`, wired into
`CoachingEngine`, or selectable through a runtime request/configuration flag.

Implementation may use one internal pure core with two reviewed profiles rather than
copying the entire function. The refactor is acceptable only if current-profile
contexts and all 153 frozen production plans remain exact. If that cannot be proven,
use a separate private shadow helper even at the cost of limited duplication.

Production cutover, profile removal, or making the proposed profile the default is a
separate explicit user decision after the report.

### 2. Existing semantic vocabulary first

The priority failures can be represented with existing tags. Do not add a tag merely
to make a capability retrieve. Normalization describes observable communication
evidence; skill definitions decide which tags provide retrieval evidence.

### 3. Clause role outranks keyword presence

Deterministic normalization may still use bounded lexical patterns, but a match is
valid only in a reviewed semantic frame that considers:

- speaker/evidence owner;
- whether evidence is in the user's draft, selected intent, user message, or other
  person's message;
- negation and polarity;
- current state versus future expectation versus action request;
- unresolved coordination versus a settled notification;
- first request versus an already-existing thread;
- fixed assistance mode and presence/absence of a draft.

No literal phrase from T1–T18 may be used as a one-case branch. Every new predicate
requires positive, negative, and hard-neighbor tests with different wording.

### 4. Evidence precedence is explicit

For `REWRITE_DRAFT` and `COMPLETE_DRAFT`, the user's draft is first-class evidence
for user intent, ownership, limits, current state, commitments, and uncertainty. It
does not override contradictory visible facts or authorize invented information.

For `SUGGEST_REPLY`, there is no draft evidence. Explicit selected intent is the
strongest user-intent evidence. Visible conversation may support a response function
or situation, but another speaker's action/fault/commitment is never reassigned to
the user.

The normalizer consumes the fixed `AgentAction`; it never changes it. A mismatch
between a raw scenario and the supplied action is recorded as
`UPSTREAM_ACTION_POLICY_ISSUE` and is not silently repaired.

### 5. Context normalization and ranking stay separate

The proposed profile emits tags only. It does not inspect scores, ranks, Top-K,
selected skills, compatibility, conflicts, or expected labels. Retrieval is run
after normalization as an unchanged observer. A capability that has valid evidence
but poor ordering remains an SRS-3 case.

## General semantic normalization rules

These are implementation requirements, not permission to hard-code the example
phrases.

| Function | General evidence rule | Required negative/hard-neighbor boundary |
| --- | --- | --- |
| Mistake/ownership | Emit ownership evidence when user-owned clauses explicitly admit a performed/omitted action was incorrect, used an invalid/old input, or failed a stated communication obligation. Counterfactual ownership (“I should have …”) counts when it clearly refers to the user's omitted action. | Another person caused the error; passive “the figures are wrong”; user reports a problem without accepting responsibility; negated fault/apology |
| Boundary | Emit `set_boundary` when user-owned evidence states a limit on participation, workload, availability, repeated contact, or acceptable behavior, especially in visible pressure/demand context. | Ordinary inability or uncertain completion belongs to status/expectation; generic `can't`, `won't`, and `not` do not suffice |
| Request | Emit `make_request` when the draft or selected intent asks another person to do, provide, stop, or change something, regardless of whether it uses a modal polite phrase. | A question resolving ambiguity is clarification; a first request is not follow-up; a status report is not a request |
| Clarification | Emit `clarify` when user-owned evidence seeks resolution of a concrete missing/ambiguous referent, choice, date, or meaning. | Known action request, settled detail, curiosity, and active scheduling are not clarification |
| Planning | Emit `plan`/`planning` only for active coordination or proposal of a future time/place/action with an unresolved or chosen next step. Mere mention of a meeting, schedule, tomorrow, or time is insufficient. | Settled notification plus acknowledgement; timing used as background to feedback, status, or follow-up; a deadline constraint alone |
| Status update | Emit `provide_status` for user-owned current progress/state, including blocked/pending/not-yet/awaiting/received/not-received states, without requiring the word “status.” | Recipient asks a question but user supplies no status; future proposal alone; another person's state does not become the user's status |
| Expectation setting | Emit `set_expectation` for user-owned realistic future timing, uncertainty, limit, or probability grounded in visible current evidence. Preserve uncertainty. | Simple planning/coordination; unsupported promise; fixed refusal/boundary without a delivery expectation |
| Follow-up | Emit `follow_up` only when the visible thread contains an earlier unresolved request/commitment and the user's current evidence re-engages it. | First request, current status report, or mere earlier topic mention |

Candidate intents already guarded by `experimentalCandidateRouting` keep their
existing evaluation-only boundary. SRS-2.5 may share general clause/source utilities
with them, but must not add a candidate-ID branch or activate their definitions.

## Private contracts and failure taxonomy

Keep normalization evaluation contracts private. Exact names may adjust during
implementation, but the information boundary is:

```ts
type Srs25NormalizationReason =
  | "MISSING_INTENT_SIGNAL"
  | "MISSING_SITUATION_SIGNAL"
  | "FALSE_INTENT_SIGNAL"
  | "FALSE_SITUATION_SIGNAL"
  | "OVER_BROAD_LEXICAL_TRIGGER"
  | "DRAFT_EVIDENCE_IGNORED"
  | "CONVERSATION_EVIDENCE_IGNORED"
  | "SELECTED_INTENT_NOT_NORMALIZED"
  | "AMBIGUOUS_CONTEXT"
  | "UPSTREAM_ACTION_POLICY_ISSUE"
  | "SKILL_METADATA_GAP";

type Srs25SignalExpectation = {
  requiredIntentTags: SkillIntentTag[];
  allowedIntentTags: SkillIntentTag[];
  forbiddenIntentTags: SkillIntentTag[];
  requiredSituationTags: SkillSituationTag[];
  allowedSituationTags: SkillSituationTag[];
  forbiddenSituationTags: SkillSituationTag[];
};

type Srs25Scenario = {
  id: string;
  scenarioFamily: string;
  split: "DEVELOPMENT";
  request: CoachingRequest;
  fixedAction: AgentAction;
  normalizationExpectation: Srs25SignalExpectation;
  retrievalExpectation: {
    required: string[];
    acceptable: string[];
    forbidden: string[];
    strictNone: boolean;
  };
};

type Srs25Comparison = {
  scenarioId: string;
  current: SkillContext;
  proposed: SkillContext;
  addedIntentTags: SkillIntentTag[];
  removedIntentTags: SkillIntentTag[];
  addedSituationTags: SkillSituationTag[];
  removedSituationTags: SkillSituationTag[];
  issues: Array<{
    signalKind: "INTENT" | "SITUATION" | "ACTION" | "METADATA";
    tag: SkillIntentTag | SkillSituationTag | null;
    reasonCode: Srs25NormalizationReason;
  }>;
};
```

Machine artifacts contain fixture IDs, actions, language categories, tags, skill IDs,
scores, ranks, pool counts, and closed reason codes. They contain no raw messages,
drafts, prompts, free-text rationale, or hidden chain of thought.

## Shadow-comparison design

For every raw exposed-development scenario:

```text
synthetic request + fixed policy/action
        ├── CURRENT profile ───────→ current SkillContext
        └── SRS_2_5_PROPOSED ─────→ proposed SkillContext
                                         │
             closed signal diff/oracle ──┤
                                         ↓
       unchanged SRS-2 hard eligibility and both retrieval modes
                                         ↓
       current/proposed K=5 and K=10 metrics + pool deltas
```

Each scenario reports:

- old and new intent tags;
- old and new situation tags;
- valid signal additions/removals;
- newly missing or newly false signals;
- required capabilities newly recoverable;
- previously found required capabilities lost;
- forbidden capabilities newly enabled;
- strict-`NONE` result;
- candidate-pool breadth change;
- per-required rank, while explicitly treating rank as diagnostic only.

Attribution is counterfactual and mechanical: a required capability is “recovered
because of a new signal” only when it had no positive signal under current context,
has a positive signal under proposed context, and its matched-feature reason code
corresponds to a tag added by the proposed profile. Do not infer causal prose.

The production selector may be run read-only against `CURRENT` to reconfirm parity.
Do not run it with `SRS_2_5_PROPOSED` as a production claim; proposed-context
retrieval remains in the private shadow harness.

## Leakage protections

1. The normalizer API accepts only `CoachingRequest`, fixed policy/action, language,
   and the explicit evaluation options already approved. It has no field for
   required, acceptable, or forbidden skill IDs.
2. Fixture construction keeps raw request/action in one object and context/retrieval
   expectations in a separately passed annotation. The evaluator calls the
   normalizer before reading retrieval labels.
3. No expected capability ID, candidate ID, score, rank, production selection, or
   metadata definition is imported into the proposed normalizer.
4. Expected signal tags are evaluation oracles only. They are not copied into the
   output context and may not be used to fill missing tags.
5. Tests include deliberate label permutation/removal proving normalized output is
   byte-equal when only retrieval annotations change.
6. The 210 canonical authoring examples remain unactionable for routing metrics;
   tags are never inferred from their expected IDs.
7. Candidate definitions remain reachable only through the existing revision-bound
   `PRODUCTION_PLUS_EVALUATION` catalog overlay.

## Regression corpus

### Scored exposed development

- The supplied T1–T18 batch becomes a versioned raw-context fixture group named
  `srs2-5-additional-diagnostics`, with its current published report as the baseline.
- The 21 Phase 4 raw request fixtures rerun through both profiles.
- The previous 12-case diagnostic report is mapped to existing scenario families and
  deduplicated where it reuses Phase 4 or Phase 8 cases.
- The 32 Phase 8 selection fixtures remain SRS-2 direct-`SkillContext` retrieval
  regressions. They do not count as context-normalization trials because their tags
  are already supplied.

### Rule-level counterfactual probes

Every changed semantic rule requires at least one positive, one negative, and one
hard neighbor with wording different from T1–T18. Minimum probes include:

| Rule | Positive | Negative | Hard neighbor |
| --- | --- | --- | --- |
| Ownership | First-person admission of using an incorrect input | Named other person used it | Problem exists but actor is unspecified |
| Boundary | User refuses an added burden under pressure | User reports uncertain completion | One-time logistical inability without a continuing limit |
| Request | Selected intent asks recipient to provide an item | User reports that item exists | Two plausible items require clarification |
| Clarification | User asks which of two referents is meant | Recipient action is already known | User asks recipient to send known item |
| Planning | User proposes or asks an unresolved meeting time | Settled time notification acknowledged | Time mention inside status/feedback context |
| Status | User reports pending/current state | Recipient asks but user gives no state | Future plan without current progress evidence |
| Expectation | User states uncertain delivery window grounded in current state | Agreed logistical time | Refusal/boundary with no delivery expectation |
| Follow-up | Visible earlier ask remains unresolved and user re-engages | First request | User reports own progress on the earlier topic |

English probes are mandatory for all eight rules. Simplified or Traditional Chinese
probes are mandatory for ownership, request, planning, status, and expectation, the
areas exercised by current multilingual definitions and T14/T15. Code-switch probes
must prove language modifiers remain independent of capability normalization.

T2–T5, T8–T10, T12–T14, and T16 are explicit regression cases. T3/T4/T9/T12 rank
order is observed but is not an SRS-2.5 pass/fail target unless a capability becomes
unretrievable or a forbidden/strict-`NONE` boundary regresses.

The held-out corpus remains `NOT_AUTHORED`. No fresh held-out cases are created or
peeked at during this phase.

## Metrics

### Context-normalization metrics

Report current and proposed values with explicit numerators/denominators:

- required intent tags found;
- required situation tags found;
- forbidden intent tags emitted;
- forbidden situation tags emitted;
- valid intent/situation additions;
- valid intent/situation removals;
- newly missing required signals;
- newly false signals;
- priority failures resolved, one row each for T1, T6, T11, T15, T17, T18;
- strict-`NONE` signal accuracy;
- issue counts by closed normalization reason code, evidence source, action, and
  language family.

Do not collapse these into a single “context accuracy” score without preserving the
underlying counts.

### Retrieval-effect metrics

For both current and proposed contexts, both retrieval modes, and K=5/K=10, rerun:

- Recall@K;
- required-skill coverage@K;
- all-required-found@K;
- per-required and per-acceptable rank;
- strict-`NONE` pass rate;
- forbidden-in-Top-K rate;
- hard-eligible, positive-signal-pool, and returned-Top-K counts plus aggregate
  min/max/mean/p50/p90;
- required capability recovered because of a new valid signal;
- previously found required capability lost;
- false/forbidden capability newly enabled;
- pool breadth delta by scenario.

Context improvements and ranking quality appear in separate tables. A capability
entering the positive-signal pool satisfies the SRS-2.5 target even if it is not rank
1. Poor relative order among positively supported candidates remains SRS-3 work.

## Expected implementation files

Plan only; no file below changes in this turn.

| Path | Planned change |
| --- | --- |
| `packages/ai/src/skill-context.ts` | Preserve current public behavior; factor a private profile-aware core or delegate to it |
| `packages/ai/src/skill-context-normalization.ts` | New internal deterministic evidence/source helpers and proposed profile; not exported from package index |
| `packages/ai/src/skill-context.test.ts` | Current-profile parity plus positive/negative/hard-neighbor normalization tests |
| `packages/test-fixtures/src/srs2-5-context-normalization.ts` | Synthetic T1–T18 requests, fixed actions, separate signal/retrieval annotations |
| `packages/test-fixtures/src/index.ts` | Test-fixture export only |
| `packages/skills/tests/srs2-5-context-normalization.ts` | Private shadow comparison, closed issue schema, retrieval attribution, metrics |
| `packages/skills/tests/srs2-5-context-normalization.test.ts` | Leakage, diff, metric, priority-target, regression, and isolation tests |
| `scripts/evaluate-srs-2-5.ts` | Credential-free deterministic report generation |
| `packages/skills/tests/fixtures/srs2-5/development-report.json` | Content-free machine evidence with current/proposed results |
| `docs/skills/srs-2-5-context-normalization.md` | Human-readable results, limitations, and cutover decision input |
| `package.json` | Add one explicit evaluation script, proposed name `eval:srs2-5` |
| `.agent/plans/skills-srs-2-5-context-normalization.md` | Progress and completion record |

No shared contract, skill definition, metadata, generated registry, runtime selector,
provider, API, desktop, database, or UI file is expected to change. If the proposed
implementation cannot stay within this list, update the plan and obtain approval
before expanding scope.

## Implementation steps

1. **Reconfirm and freeze the baseline.**
   - Record dirty-worktree status without touching unrelated changes.
   - Re-run SRS-1/SRS-2 focused tests, the 21-definition/153-plan production check,
     Phase 4 evaluation, and current SRS-2 report.
   - Bind the current 18-case normalized contexts and retrieval outputs as the
     before-state; do not regenerate expected labels from code.

2. **Encode the exposed raw-context corpus safely.**
   - Add T1–T18 as synthetic development fixtures with fixed actions.
   - Store semantic-signal and retrieval annotations separately from request data.
   - Validate disjoint required/allowed/forbidden signal and capability sets.
   - Prove changing labels does not change normalized output.

3. **Create the private profile boundary.**
   - Introduce `CURRENT` and `SRS_2_5_PROPOSED` internally.
   - Keep `deriveSkillContext()` and all production callers pinned to `CURRENT`.
   - Add exact current-context and frozen-plan parity tests before changing any
     semantic predicate.

4. **Implement source-aware semantic evidence.**
   - Add small pure helpers for evidence source, speaker ownership, clause polarity,
     current-state versus future expectation, action request versus information
     clarification, active coordination, and continuing/repeated limits.
   - Implement one semantic rule group at a time, accompanied by positive, negative,
     and hard-neighbor tests.
   - Avoid a general NLP framework, third-party parser, or case-specific map.

5. **Add normalization comparison contracts and taxonomy.**
   - Validate current/proposed contexts and ordered signal diffs.
   - Classify issues with closed reason codes only.
   - Keep raw content and free-text rationale out of machine artifacts.

6. **Run unchanged retrieval counterfactually.**
   - Feed both contexts to the existing SRS-2 retriever under both modes and K values.
   - Record newly recovered/lost required capabilities, newly enabled forbidden
     capabilities, strict `NONE`, matched signals, ranks, and pool breadth.
   - Do not change SRS-2 scoring or interpret rank as confidence.

7. **Evaluate the full regression set.**
   - Confirm T1/T6/T11/T15/T18 recovery and T17 strict `NONE`.
   - Rerun T2–T5, T8–T10, T12–T14, T16, Phase 4 raw fixtures, SRS-2 direct-context
     scenarios, multilingual/code-switching cases, and rule-level probes.
   - Record any semantic disagreement or regression rather than modifying metadata or
     expected labels to make the run pass.

8. **Publish the deterministic report and stop.**
   - Emit content-free machine evidence and concise Markdown results.
   - Reconfirm production parity, candidate isolation, 210-example status, and no
     held-out access.
   - Update this plan's progress/completion record and stop for review. Do not start
     SRS-3 or switch the production profile.

## Tests and evaluation

Focused tests must cover:

- exact current-profile context output and unchanged production plans;
- each proposed semantic rule's positive, negative, hard-neighbor, negation, and
  speaker-ownership boundaries;
- rewrite/complete/suggest modes and explicit selected intent;
- fixed action consumption and `UPSTREAM_ACTION_POLICY_ISSUE` reporting;
- English, Simplified Chinese, Traditional Chinese, regional tags, intentional code
  switching, and unsupported primary language behavior;
- T1/T6 ownership recovery without T7 false ownership;
- T11 selected-intent request recovery without turning T10 clarification into a
  plain request;
- T15 current-state recovery with `zh.code_switching` remaining modifier-only;
- T17 no planning intent/situation and empty capability pools in both modes;
- T18 boundary recovery without treating every inability or uncertain delivery as a
  boundary;
- T16 ordinary-social strict `NONE` preservation;
- no candidate-specific branch and unchanged evaluation-overlay digests/isolation;
- label-permutation leakage test;
- exact closed issue-code validation and rejection of free-form rationale;
- deterministic tag ordering, report bytes, and repeated-run equality;
- context metrics and retrieval attribution on hand-computed probes;
- unchanged SRS-2 hard gates, modifier lane, scores, ranks, and cutoff semantics.

Default tests and evaluation use no credentials, provider, network, screenshots, or
real messages.

## Acceptance criteria

Implementation is acceptable only when all of the following are true:

- [x] The production `deriveSkillContext()` path and `SkillEngine.select()` behavior
      remain unchanged; all 21 definitions and 153 frozen plans retain exact parity.
- [x] The proposed profile has no production caller, package-index export, runtime
      flag, provider path, or automatic cutover.
- [x] Normalization receives no required/acceptable/forbidden skill labels, ranks,
      scores, selected plans, or candidate IDs.
- [x] No literal one-case branch exists; every changed rule has positive, negative,
      and hard-neighbor tests with distinct wording.
- [x] T1 and T6 produce valid ownership evidence sufficient for
      `acknowledge_mistake` to enter the `SIGNAL_ONLY` positive-signal pool.
- [x] T11 converts explicit selected request intent into valid request evidence and
      retrieves `request` without enabling `clarification` solely from that intent.
- [x] T15 produces valid current-state evidence sufficient for `status_update` to
      enter the `SIGNAL_ONLY` positive-signal pool; `zh.code_switching` stays outside
      capability Top-K.
- [x] T18 produces valid limit evidence sufficient for `boundary_setting` to enter
      the `SIGNAL_ONLY` positive-signal pool without converting ordinary uncertainty
      or one-time inability into boundaries.
- [x] T17 emits neither `plan` nor `planning` and preserves strict `NONE` in both
      retrieval modes. T16 remains strict `NONE`.
- [x] No previously found required capability in the exposed regression corpus
      becomes a zero-signal retrieval miss under the proposed profile; any disputed
      annotation blocks acceptance rather than being silently rewritten.
- [x] No forbidden capability is newly enabled in Top 10 by a false proposed signal
      across T1–T18. Valid broad neighbors already present remain SRS-3 evidence.
- [x] Previously useful T2–T5, T8–T10, T12–T14 behavior is preserved or any semantic
      signal change is explicitly reviewed and documented; rank order is not used as
      an SRS-2.5 pass criterion.
- [x] Context-level improvements and retrieval/ranking metrics are reported in
      separate tables with exact denominators and pool deltas.
- [x] SRS-2 hard gates, both retrieval modes, the 12/10 score, stable ties,
      configurable Top-K, modifier separation, and cutoff reason codes remain
      unchanged.
- [x] The 210 canonical examples remain authoring-only and
      `PENDING_HUMAN_REVIEW`; the held-out corpus remains `NOT_AUTHORED`, unread, and
      unscored.
- [x] The production catalog remains exactly 21 ACTIVE definitions; neither Phase 8
      candidate nor `confirmation` is activated.
- [x] No SRS-3 ranking/supervisor, `SkillPlan`, prompt, provider, database, UI,
      memory, retrieval service, commit, merge, or push work is included.
- [x] The report ends at a user review gate. Production cutover and SRS-3 each require
      separate approval.

## Validation commands

Use only repository-declared commands plus the approved new evaluation command. Run
in this order after implementation:

```text
pnpm test -- packages/ai/src/skill-context.test.ts packages/skills/tests/srs1-foundation.test.ts packages/skills/tests/srs2-shadow-retrieval.test.ts packages/skills/tests/srs2-5-context-normalization.test.ts
pnpm eval:srs2
pnpm eval:srs2-5
pnpm skills:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm skills:verify-production
pnpm eval:phase4
pnpm format:check
git -c core.safecrlf=false diff --check
```

The completion report must record exact commands, exit results, scenario counts,
profile/configuration identifiers, corpus and catalog digests, tag-diff counts,
priority-case outcomes, retrieval metrics, pool statistics, and limitations.

## Privacy and data handling

- Use only synthetic, checked-in exposed-development messages.
- Do not place real chats, screenshots, identity evidence, credentials, or external
  restricted dialogue in fixtures.
- Raw synthetic text may live in source fixtures needed to reproduce normalization,
  but machine reports contain no raw message, draft, selected-intent, prompt, or
  rationale text.
- No provider or network call is needed. No ordinary telemetry receives fixture or
  report content.
- No historical memory, relationship inference, identity inference, or user profile
  becomes a signal source.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Overfitting T1–T18 | Require distinct positive/negative/hard-neighbor probes and rerun the full exposed corpus as one batch |
| False-positive signal expansion | Track newly false tags, forbidden-in-Top-K, pool deltas, and strict `NONE` before recall claims |
| `NONE` degradation | Treat T16/T17 and additional settled-acknowledgement probes as blocking gates |
| Keyword hacks | Require clause source, ownership, polarity, temporal role, and semantic-operation conditions; reject case-ID or literal-sentence branches |
| Skill-label leakage | Separate request/action from annotations by type and call order; label-permutation test |
| Candidate-specific routing hacks | Preserve the existing opt-in candidate option and prohibit candidate IDs/definitions in the normalizer |
| Hidden selector inside normalization | Normalizer emits existing tags only and cannot access catalog, scores, ranks, conflicts, or budgets |
| Production drift during refactor | Keep default pinned to `CURRENT`; exact context and 153-plan parity before and after every rule group |
| Multilingual regression | Add independently written Chinese and code-switch hard neighbors; do not translate English keywords mechanically |
| Metadata mismatch mistaken for context failure | Emit `SKILL_METADATA_GAP`; do not edit YAML or tags silently |
| Parallel-profile divergence | Keep a small pure shared evidence core, document the difference, and remove the proposed profile cleanly if rejected |
| Exposed-set optimism | Make descriptive claims only; held-out work remains forbidden in this phase |

## Rollback

Before production cutover, rollback removes the private proposed profile, SRS-2.5
fixtures/helper/tests, evaluation script/command, machine report, and results document.
`deriveSkillContext()` remains pinned to the current profile throughout, so rollback
does not require a user-data migration, registry regeneration, or restoration of
production behavior.

If internal factoring was introduced, restore the pre-SRS-2.5 implementation only
after exact current-context and 153-plan parity is demonstrated. Do not use destructive
Git commands or overwrite unrelated dirty-worktree changes.

## Gate after SRS-2.5

Stop after the shadow report. The user must review:

- each priority recovery and its general-rule evidence;
- every newly added/removed tag;
- strict `NONE` and forbidden behavior;
- any previously correct required capability loss;
- pool-breadth changes;
- current versus proposed SRS-2 metrics in both modes;
- candidate and modifier isolation; and
- whether the proposed profile is suitable for a separately authorized production
  cutover.

SRS-3 may be replanned or resumed only after the context evidence boundary is
accepted. Acceptance of SRS-2.5 shadow results does not itself authorize cutover.

## Progress log

- 2026-09-27: SRS-1 and SRS-2 confirmed complete; production remains unchanged.
- 2026-09-27: Twelve-case diagnostic demonstration confirmed baseline shadow
  retrieval and modifier separation.
- 2026-09-27: Eighteen additional exposed-development cases identified priority
  upstream misses in T1, T6, T11, T15, and T18 plus false planning evidence in T17.
- 2026-09-27: This SRS-2.5 plan was created after inspecting the current normalizer,
  contracts, tests, SRS-2 retriever, registry/evaluation documents, and dirty
  worktree. No implementation was performed.
- 2026-09-27: User approval authorized the evaluation-only proposed profile and
  preserved all production, candidate, held-out, provider, Git, and SRS-3 freezes.
- 2026-09-27: Added source-aware normalization, separated T1-T18 fixtures and
  annotations, closed diagnostics, unchanged-retriever comparison, deterministic
  machine evidence, and the human-readable results report.
- 2026-09-27: Final validation passed. Production remains on `CURRENT` with 21 ACTIVE
  definitions and 153 exact frozen plans. Work stopped before SRS-3.

## Completion record

Completed on 2026-09-27 as an exposed-development shadow evaluation. The detailed
result, per-case evidence, metrics, limitations, and review gate are in
[`docs/skills/srs-2-5-context-normalization.md`](../../docs/skills/srs-2-5-context-normalization.md).

Final evidence:

- Context: required intents 17/24 → 24/24; required situations 13/17 → 17/17;
  false intents 7 → 0; false situations 6 → 0; strict `NONE` 1/2 → 2/2; priority
  cases 6/6.
- Proposed `SIGNAL_ONLY` at K=5 and K=10: recall 23/23, coverage 1.0, all-required
  15/15, strict `NONE` 2/2, forbidden 2/32. No lost required capability and no
  newly enabled forbidden capability.
- Proposed legacy mode: recall 22/23; T11/request is the sole
  `SKILL_METADATA_GAP`. T3 and T4 retain closed SRS-3 discrimination findings.
- Mean positive-signal pool: legacy 1.5556 → 1.3889; signal-only 3.1111 → 2.6667.
- Production catalog digest:
  `sha256:c96fc9c9a5b26909ecf635bbae3ebef28abf15ed4729216cc28caf7698ad1ee3`.
- Raw scenario digest:
  `sha256:9399e49ca4dce51c691bf4017c314002bb6d74a5d113251b8711d98639f5c497`;
  annotation digest:
  `sha256:79aeb9bf4a20661ec65d515b21b853b1d4b65fceeb715162e12a0820aa15dcaf`.
- Regenerating `development-report.json` produced the same Git object hash
  `acb48b8857231b966dd76e71e0aa74a1dbc7b1b4`.

Commands run successfully in the required order:

1. `pnpm test -- packages/ai/src/skill-context.test.ts packages/skills/tests/srs1-foundation.test.ts packages/skills/tests/srs2-shadow-retrieval.test.ts packages/skills/tests/srs2-5-context-normalization.test.ts` — 4 files, 78 tests passed.
2. `pnpm eval:srs2` — 53 scenarios; both modes at K=5/K=10 retained 1.0 recall, coverage, all-required, strict `NONE`, and zero forbidden rate.
3. `pnpm eval:srs2-5` — 18 scenarios and eight profile/mode/K runs generated deterministically.
4. `pnpm skills:check` — generated registry fresh.
5. `pnpm lint` — passed with zero warnings.
6. `pnpm typecheck` — all six workspace projects passed.
7. `pnpm test` — 33 files, 461 tests passed.
8. `pnpm build` — all six workspace projects built.
9. `pnpm skills:verify-production` — 21 exact definitions, 153 ordered plans, public exports, deep freezing, and authoring exclusion passed.
10. `pnpm eval:phase4` — 21/21 action preservation and no-invention; every reported metric 1.0.
11. `pnpm format:check` — all matched files passed.
12. `git -c core.safecrlf=false diff --check` — passed.

Known limitations: this is descriptive exposed-development evidence. The 210
canonical examples remain pending human review and the held-out corpus remains
unauthored. No provider comparison was run. Production cutover and SRS-3 remain
separate user review gates.
