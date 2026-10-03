# SRS-3 — Capability ranking and candidate discrimination

Status: proposed — awaiting approval; implementation not started  
Owner: Codex (planning); implementation owner unassigned  
Created: 2026-09-27  
Updated: 2026-09-27  
Parent direction: [Skill retrieval, selection, and planning](skills-retrieval-selection-direction.md)  
Depends on: [completed SRS-2](skills-srs-2-retrieval.md) and
[completed SRS-2.5](skills-srs-2-5-context-normalization.md)

## Approval boundary

This document plans SRS-3 only. It does not authorize implementation.

No ranking code, fixture, schema, authoring metadata, skill definition, generated
registry, runtime selector, package export, script, test, report, production behavior,
candidate status, commit, merge, or push may change until the user approves this plan.
Approval would authorize only the deterministic shadow-ranking work described here.
It would not authorize production cutover, a supervisor, final skill selection,
modifier selection, conflict/dependency resolution, `SkillPlan`, prompt compilation,
provider calls, embeddings, a vector database, held-out authorship, or SRS-4.

This plan supersedes the scope of
[`skills-srs-3-selection.md`](skills-srs-3-selection.md). That older document planned
supervision, modifier selection, and final resolution. Those concerns are now later,
separately approved work. The historical file is not an implementation authority for
this milestone and is not modified by this planning turn.

## Outcome

Given the capability candidates returned by the existing shadow retriever, produce a
deterministic, inspectable ordering that distinguishes the primary communication
operation from merely related or generic neighbors.

SRS-3 answers:

> Among already retrieved capabilities, which capabilities are most central to the
> communication operation?

SRS-3 does not answer:

> Which exact zero-to-five capabilities should be selected, combined, or compiled
> into final guidance?

The milestone ends with an ordered capability list and diagnostic trace. It does not
produce a final selected set.

## Scope

### In scope

- Evaluation-only use of `SRS_2_5_PROPOSED` context, `SIGNAL_ONLY` capability
  retrieval, and the existing configurable Top-K, default 10.
- A deterministic capability reranker that preserves `retrievalScore` and
  `retrievalRank` and adds separate `rankingScore` and `rankingRank` fields.
- Source-aware, closed ranking features derived from normalized intent/situation
  signals and their evidence provenance.
- A narrow, revision-bound, evaluation-only relationship sidecar for independently
  reviewed specific/generic capability relationships that the current tag vocabulary
  cannot express by itself.
- A mandatory audit and provenance-preserving conversion of the Phase 8A semantic
  review ledger, its 21 skill-boundary records, and its 13 neighbor matrices before
  any new ranking scenario is authored.
- Separate raw scenarios, retrieval expectations, ranking labels, and ranking
  relationship inputs so expected labels never enter scoring.
- Explicit primary and pairwise labels only where semantic primacy is defensible.
- Reuse of only semantically resolved, non-quarantined Phase 8A material as exposed
  development evidence, followed by the smallest gap-driven synthetic expansion
  needed for uncovered ranking boundaries, modes, languages, and inverse cases.
- The existing T1–T18 diagnostic seeds and unchanged SRS-2/SRS-2.5 regression sets.
- Retrieval-regression, ranking-quality, traceability, privacy, determinism, and
  production-isolation metrics.

### Out of scope

- Any change to `packages/skills/src/engine.ts`, `SkillEngine.select()`, production
  `deriveSkillContext()`, the production `CURRENT` profile, generated registry,
  approved YAML, public contracts, production exports, prompts, API, desktop, UI,
  database, memory, or provider boundary.
- Deleting plausible candidates to improve ranking. SRS-3 reranks the retrieved
  Top-K; it does not turn ranking into a hidden retrieval gate.
- Final zero-to-five selection, `NONE` selection by a supervisor, modifier ranking or
  selection, conflict/dependency resolution, composition, `SkillPlan`, or prompt
  compilation.
- Embeddings, vector search, lexical-search libraries, model reranking, LLM judges,
  provider calls, final-message evaluation, or human preference evaluation of prose.
- Production activation of `perspective_acknowledgement` or
  `give_constructive_feedback`; addition of `confirmation`; or silent repair of the
  T11 legacy metadata gap.
- Authoring, inspecting, unsealing, or scoring a true held-out corpus.
- Treating all 210 Phase 8A examples, any unapproved proposed revision, or any
  quarantined/rejected original as approved ranking gold.

## Baseline

### Repository state

| Item                       | Planning baseline                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------------- |
| Worktree                   | `C:\Users\b\Documents\ChatGPT\AI messager-skills`                                                         |
| Branch / HEAD              | `skills` / `a77f476b532c6ddd81eadbca835b312425fd4f1c`                                                     |
| Worktree state             | Dirty with retained Phase 7, Phase 8, SRS-1, SRS-2, and SRS-2.5 work; unrelated changes must be preserved |
| Production definitions     | 21 ACTIVE: 14 atomic capabilities and 7 language modifiers                                                |
| Frozen Phase 7 plans       | 153 exact plans                                                                                           |
| Production context profile | `CURRENT`                                                                                                 |
| Production selector        | Existing mixed deterministic `SkillEngine.select()` path, maximum four definitions                        |
| Candidate overlay          | `perspective_acknowledgement` and `give_constructive_feedback`, revision-bound and evaluation-only        |
| `confirmation`             | Not in the production or evaluation catalog                                                               |

### Retrieval and normalization baseline

- SRS-2 hard eligibility is status → catalog → fixed action → language → structured
  code-switch prerequisite.
- Capability and modifier lanes are separate in the shadow path. Modifiers never
  consume capability Top-K positions.
- `SIGNAL_ONLY` admits hard-eligible capabilities with at least one positive intent or
  situation signal.
- Retrieval score is intentionally coarse: intent match `+12`, situation match
  `+10`, then stable skill-ID ordering.
- The current rerank stage is identity-only: it copies retrieval score and rank.
- Top-K defaults to 10. Candidates below it use `TOP_K_CUTOFF`; SRS-2 does not emit
  `RERANK_CUTOFF`.
- `SRS_2_5_PROPOSED` is private and evaluation-only. It supplies source-aware signals
  from `OTHER_MESSAGE`, `USER_DRAFT`, `SELECTED_INTENT`,
  `CONVERSATION_HISTORY`, and `STRUCTURED_CONTEXT`.
- Production remains pinned to `CURRENT`; SRS-3 must not change that fact.

### SRS-2.5 exposed-diagnostic baseline

| Metric                               |                                   Baseline |
| ------------------------------------ | -----------------------------------------: |
| Proposed `SIGNAL_ONLY` Recall@5      |                                      23/23 |
| Proposed `SIGNAL_ONLY` Recall@10     |                                      23/23 |
| All required found                   |                                      15/15 |
| Strict `NONE`                        |                                        2/2 |
| Forbidden in Top-K                   | 2/32; neither was newly enabled by SRS-2.5 |
| Mean positive-signal pool            |                                     2.6667 |
| Lost required capabilities           |                                          0 |
| Newly enabled forbidden capabilities |                                          0 |

T11 is normalized correctly and retrieves `request` in `SIGNAL_ONLY`, but remains a
`SKILL_METADATA_GAP` in `LEGACY_METADATA_GATE`. SRS-3 consumes `SIGNAL_ONLY` and
records this issue without changing metadata.

### Development evidence

- 53 SRS-2 runnable exposed scenarios remain the retrieval-regression corpus.
- T1–T18 are the source-aware SRS-2.5 diagnostic set and initial SRS-3 seeds.
- T3, T9, T10, and T12 are the principal current ranking cases; T13 is an important
  inverse/easy case.
- The Phase 8A semantic ledger contains 210 authoring examples: 129 `KEEP`, 71
  `REVISE`, four `REJECT`, and six `QUARANTINE`. These are not one uniformly approved
  corpus and must not be imported wholesale.
- The same ledger contains 21 skill-boundary records and 13 explicit neighbor
  matrices. Eight matrices are capability-to-capability boundaries relevant to the
  SRS-3 ranking lane; five contain language modifiers and remain modifier-lane or
  separation evidence only.
- The separate focused-approval ledger records 34 exact decisions: 20 approved
  originals and 14 approved replacement revisions. Approval is revision- and
  digest-specific; it does not approve the remaining originals or proposals.
- Held-out evidence remains `NOT_AUTHORED`, unread, and unscored.

## Phase 8A evidence-reuse gate

This gate runs before creating any SRS-3 ranking fixture. Its output is an audit and
conversion manifest, not a claim that Phase 8A is production gold.

### Source set and binding

Audit these existing artifacts without modifying them:

- `packages/skills/tests/fixtures/phase8/codex-semantic-review.json`;
- `packages/skills/tests/fixtures/phase8/focused-human-approval.json`;
- `packages/skills/tests/fixtures/phase8/weak-invalid-remediation.json` and
  `weak-invalid-rereview.json`, used only to resolve the identity and status of a
  later replacement;
- `docs/skills/phase-8-codex-semantic-review.md` for the human-readable boundary and
  neighbor rationale; and
- the exact skill-definition and artifact digests already recorded by those ledgers.

The audit must fail closed on missing files, digest drift, duplicate keys, unknown
decisions, mismatched replacement digests, or stale definition bindings. It records
the source artifact, row or matrix key, source digest, reviewed revision, reviewer
type, decision, confidence, approval state, and conversion outcome for every item it
considers.

### Conversion policy

Use these closed outcomes:

| Outcome                        | Rule and permitted SRS-3 use                                                                                                                                                             |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RESOLVED_ORIGINAL_DEV`        | Original `KEEP`, non-quarantined, boundary-valid, non-low-confidence, with Phase 8A development use allowed. May become exposed development evidence, never production or held-out gold. |
| `APPROVED_REVISION_DEV`        | A full replacement whose exact revision and digest have explicit later approval. May become exposed development evidence under that approval provenance.                                 |
| `BOUNDARY_RELATIONSHIP_SOURCE` | A resolved capability-only boundary/matrix assertion assigned to scorer relationship design. It cannot also count as independent efficacy evidence.                                      |
| `EVALUATION_LABEL_SOURCE`      | A resolved row or matrix assertion assigned to primary/pairwise evaluation labels. It cannot also train/configure the relationship feature for the same lineage.                         |
| `MODIFIER_SEPARATION_ONLY`     | A matrix with a modifier endpoint. Use only to verify lane separation or modifier eligibility; never as a capability-ranking pair.                                                       |
| `FAILURE_ANALYSIS_ONLY`        | Rejected, quarantined, context-insufficient, stale, ambiguous, or unresolved material. It may document a gap/failure but contributes no positive ranking target.                         |
| `UNAPPROVED_PROPOSAL_EXCLUDED` | A `REVISE` proposal or remediation replacement without an exact later approval binding. It is not gold and cannot supply raw scenarios, labels, or relationships.                        |

Additional rules:

- Never infer approval from `reviewerType: CODEX_SEMANTIC_REVIEW`, a second Codex
  review, a strong quality rating, a proposed replacement, or absence of quarantine.
- Never mutate a Phase 8A row during conversion. Preserve its source key and digest;
  transformations create new SRS-3 IDs linked back to the source.
- A `REVISE` original is not converted merely because its proposal looks usable.
  Only a separately approved full replacement with an exact digest match is eligible.
- `REJECT` and `QUARANTINE` originals remain failure-analysis evidence even when a
  separately approved replacement exists; approval attaches to the replacement, not
  retroactively to the original.
- `CONTEXT_INSUFFICIENT`, genuinely ambiguous, candidate-boundary, or unresolved
  human-escalation material receives no primary or pairwise truth.
- Deduplicate exact and semantic paraphrase families before metric construction so
  the ten examples per skill do not overweight one boundary. Preserve family IDs and
  report raw versus deduplicated counts.

### Non-circular reuse

Each Phase 8A lineage group must be assigned exactly one scoring role:

1. relationship-source material may define the evaluation-only sidecar;
2. evaluation-label material may contribute to ranking metrics; or
3. regression/failure-only material may exercise isolation and traces.

The same row, replacement, matrix cell, or direct paraphrase family cannot both
configure the reranker and score its efficacy. Structural self-checks over
relationship-source material are reported separately and excluded from Primary@K,
MRR, pairwise uplift, and threshold denominators.

### Audit deliverable and authoring gate

Before any new raw scenario is created, publish:

- counts by source decision, approval state, conversion outcome, capability/modifier
  lane, language, action, assistance mode, and neighbor pair;
- an exact included/excluded key manifest with reason codes;
- a coverage matrix for focal-only, neighbor-only, both-valid, neither-valid or
  strict-`NONE`, rewrite, empty-draft suggest, language, and setting; and
- the remaining evidence gaps after deduplication and role separation.

Only those measured gaps authorize new exposed synthetic scenarios. If the audit
cannot establish semantic resolution or non-circular role assignment, stop for review
instead of manufacturing labels.

## Current ranking architecture

### Production

`packages/skills/src/engine.ts` currently performs filtering, the same metadata
score, ordering, conflict-aware greedy selection, and composition inside
`select()`. That production behavior is frozen for SRS-3.

### Shadow evaluation

`packages/skills/tests/srs2-shadow-retrieval.ts` currently:

1. applies hard eligibility;
2. separates capabilities from modifiers;
3. assigns the coarse 12/10 retrieval score;
4. orders by score and stable ID;
5. copies that order through an identity rerank field; and
6. returns configurable capability Top-K plus full traces.

There is no semantic ranking abstraction today. “Ranking” currently means retrieval
ordering, and `rerank` is an identity copy. SRS-3 adds the first real ranking stage
only in the evaluation boundary.

The authoring schema already contains prose neighbor distinctions, but those records
are not executable ranking metadata. Runtime `SkillDefinition` has intent,
situation, action, language, compatibility, and conflict fields only. SRS-3 must not
parse free-text `neighbors`, `useWhen`, or `doNotUseWhen` into logic.

## Problem statement and stage ownership

| Failure                       | Meaning                                                                                                                | SRS-3 treatment                                           |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `HARD_ELIGIBILITY_FAILURE`    | Candidate cannot enter the capability lane because of status, catalog, action, language, or structured prerequisite    | Observe existing trace; do not repair in ranking          |
| `CONTEXT_NORMALIZATION_ISSUE` | Required communication evidence is absent or false before retrieval                                                    | Attribute upstream; do not compensate with ranking labels |
| `RETRIEVAL_FAILURE`           | Candidate is eligible but has no positive signal or falls outside retrieval Top-K                                      | Attribute upstream; no ranking rank exists                |
| `SKILL_METADATA_GAP`          | Context is correct but definition/admission metadata prevents expected retrieval                                       | Record separately; T11 legacy is the current example      |
| `RANKING_FAILURE`             | Candidate is in retrieval Top-K but violates an independently authored primary or pairwise expectation after reranking | Owned by SRS-3                                            |
| Future supervisor failure     | Ordered candidates are reasonable but a future selector chooses the wrong final subset                                 | Not observable or owned in SRS-3                          |

This separation is mandatory. Expected labels may classify output after ranking but
may never create a missing context signal, retrieval candidate, feature, or score.

## Design question: smallest defensible ranking model

| Option                                        | Evidence fit                                                                                                             | Complexity / inspectability                            | Decision                                       |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ | ---------------------------------------------- |
| A. Keep coarse retrieval score only           | Already succeeds at recall but fails semantic primacy, notably T3                                                        | Smallest, but cannot solve the milestone               | Baseline only                                  |
| B. Deterministic feature reranker             | Can use exact operation tags, provenance, and co-present candidates already available from SRS-2.5                       | Small, provider-neutral, fully traceable               | **Recommended core**                           |
| C. Registry relationship/specificity metadata | Needed for cases such as feedback vs request where both have exact intent support and 12/10 favors the generic component | Useful but risky if made production metadata too early | **Use a narrow evaluation-only sidecar first** |
| D. Semantic/embedding reranker                | No measured need at 16 evaluation capabilities; adds model/index, threshold, privacy, and determinism costs              | Premature and harder to inspect                        | Reject for SRS-3                               |
| E. LLM supervisor/reranker                    | Blurs ranking with future final selection, adds calls and hidden reasoning risk                                          | Outside scope and unnecessary for current scale        | Reject for SRS-3                               |

The smallest model supported by current evidence is a deterministic feature
reranker plus a narrow, independently reviewed relationship sidecar. Features alone
correct cases where the focal capability has stronger exact-intent or provenance
support. The sidecar handles only explicit specific-operation versus generic-component
relationships, and only when the specific capability’s trigger intent is present.

This is not a global rule such as “feedback always outranks request.” In a plain
request, `give_constructive_feedback` has no `give_feedback` intent support, so the
relationship does not activate and `request` remains primary.

## Ranking input and data flow

```text
Synthetic raw scenario + fixed AgentAction
        ↓ SRS_2_5_PROPOSED normalization (evaluation only)
Source-aware intent/situation signals
        ↓ unchanged SRS-2 hard eligibility
        ↓ unchanged SIGNAL_ONLY retrieval (12/10, K=10)
Capability retrieval Top-K                   Eligible modifiers
        ↓                                           ↓
SRS-3 deterministic capability reranker       unchanged separate lane
        ↓
Ordered capability candidates + structured trace
        ↓
Join independent ranking annotations for metrics only
```

The reranker receives only the retrieved capability list, fixed action, normalized
signals and their sources, catalog-bound capability metadata, and the separately
reviewed ranking-relationship sidecar. It receives no required, acceptable,
forbidden, primary, pairwise, observed-rank, or expected-skill fields.

## Initial deterministic ranking model

### Feature set

The first implementation should use this deliberately small, closed feature set:

| Feature code                    | Contribution | Rule                                                                                                                                                             |
| ------------------------------- | -----------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EXACT_INTENT_SUPPORT`          |          +40 | Candidate has at least one definition intent matched by normalized intent evidence; apply once, not per tag                                                      |
| `ASSISTANCE_ALIGNED_SOURCE`     |          +20 | Strongest matched intent evidence is `USER_DRAFT` for rewrite/complete or `SELECTED_INTENT` for suggest-reply                                                    |
| `CONVERSATION_OPERATION_SOURCE` |          +12 | In suggest-reply, strongest matched operation evidence comes from `OTHER_MESSAGE` or `CONVERSATION_HISTORY`; mutually exclusive with the +20 source contribution |
| `STRUCTURED_FALLBACK_SOURCE`    |           +5 | Strongest operation evidence is structured fallback only; mutually exclusive with other source contributions                                                     |
| `SITUATION_SUPPORT`             |          +10 | Candidate has one or more matched situation tags; apply once                                                                                                     |
| `MULTI_SOURCE_SUPPORT`          |           +5 | Matched evidence spans at least two distinct approved source categories; apply once                                                                              |
| `SPECIFIC_OPERATION_RELATION`   |          +30 | Co-present specific candidate has its declared trigger intent and a reviewed relation to a generic component                                                     |
| `GENERIC_NEIGHBOR_RELATION`     |          -15 | Co-present generic candidate is the component of that supported specific operation                                                                               |

No feature is a probability or confidence. Contributions are scenario-local ranking
evidence. Counts are capped as shown so verbose metadata or repeated evidence cannot
inflate a score.

`rankingScore` is the signed sum of these contributions. Ordering is:

1. `rankingScore` descending;
2. unchanged `retrievalScore` descending;
3. unchanged `retrievalRank` ascending; and
4. stable skill ID ascending.

Retrieval score is a tie-breaker, not a ranking feature contribution. The trace keeps
the two scores visibly separate.

### Provenance boundary

Provenance bonuses apply only to evidence that actually supports a matched operation
tag. Merely having a draft never gives every candidate a draft bonus. `USER_DRAFT`
does not always win; for suggest-reply, visible conversation evidence can be the
correct operation source. If several source categories support a candidate, use the
single strongest mode-aligned source contribution plus the capped multi-source
contribution.

### Relationship sidecar

The initial sidecar is private, evaluation-only, strict, revision-bound to the
production and evaluation catalogs, and reviewed independently from ranking labels.
Each relation has this shape:

```ts
type Srs3RankingRelation = {
  specificCapabilityId: string;
  genericCapabilityId: string;
  triggerIntentTag: SkillIntentTag;
  relation: "SPECIFIC_OPERATION_HAS_GENERIC_COMPONENT";
  sourceDefinitionDigests: [string, string];
};
```

A relation activates only when both candidates are in retrieval Top-K and the
specific candidate has exact support for `triggerIntentTag`. It changes ordering,
not membership. Reverse duplicates, cycles for the same trigger, unknown IDs,
modifier IDs, stale digests, and relations derived from evaluation labels fail
validation.

Seed relationships may cover reviewed boundaries such as feedback→request,
follow-up→request, boundary→decline, clarification→request,
validation→reassurance, perspective→validation, and planning→expectation. They must
be justified from reviewed skill boundaries before any score is run. Status and
expectation remain co-equal unless an individual scenario has an independent primary
or pairwise label; no global relation is inferred.

Do not change `packages/skills/authoring/schema.ts` or approved YAML in the initial
implementation. The SRS-3 report should decide whether successful, stable relations
deserve a separately reviewed authoring-schema proposal later.

## Private ranking contracts

Keep SRS-3 contracts under the test/evaluation boundary; do not add shared runtime
contracts.

```ts
type Srs3FeatureContribution = {
  code:
    | "EXACT_INTENT_SUPPORT"
    | "ASSISTANCE_ALIGNED_SOURCE"
    | "CONVERSATION_OPERATION_SOURCE"
    | "STRUCTURED_FALLBACK_SOURCE"
    | "SITUATION_SUPPORT"
    | "MULTI_SOURCE_SUPPORT"
    | "SPECIFIC_OPERATION_RELATION"
    | "GENERIC_NEIGHBOR_RELATION";
  value: 40 | 20 | 12 | 10 | 5 | 30 | -15;
};

type Srs3RankedCapability = {
  skillId: string;
  hardEligibility: "PASSED";
  matchedIntentTags: Array<{
    tag: SkillIntentTag;
    sources: SkillContextEvidenceSource[];
  }>;
  matchedSituationTags: Array<{
    tag: SkillSituationTag;
    sources: SkillContextEvidenceSource[];
  }>;
  retrievalScore: number;
  retrievalRank: number;
  rankingFeatureContributions: Srs3FeatureContribution[];
  rankingScore: number;
  rankingRank: number;
  status: "RANKED";
};

type Srs3RankingResult = {
  config: {
    contextProfile: "SRS_2_5_PROPOSED";
    retrievalMode: "SIGNAL_ONLY";
    retrievalTopK: number;
    rankingCutoff: null;
  };
  rankedCapabilities: Srs3RankedCapability[];
  upstreamCapabilityTraces: SrsCandidateTrace[];
  eligibleModifierIds: string[];
};
```

The full trace must make upstream failures visible. A hard-ineligible or
unretrieved capability has no ranking score/rank and retains its existing earliest
disappearance stage. Every capability passed to SRS-3 has both retrieval and ranking
fields.

## Ranking annotations and leakage boundary

Raw scenarios and ranking labels must live in separate artifacts. A proposed strict
annotation extension is:

```ts
type Srs3RankingExpectations = {
  evidenceProvenance: {
    sourceKind: "PHASE_8A_RESOLVED" | "NEW_GAP_FILL";
    sourceKey: string;
    sourceDigest: string;
    reviewedRevision: string;
    conversionOutcome:
      "RESOLVED_ORIGINAL_DEV" | "APPROVED_REVISION_DEV" | "EVALUATION_LABEL_SOURCE";
  };
  primary: string[];
  shouldRankAbove: Array<{
    higher: string;
    lower: string;
  }>;
};
```

Rules:

- `primary` is optional in meaning and represented by an empty array when no
  defensible primary exists.
- Primary IDs must be capability labels already marked required or acceptable, but
  required does not imply primary.
- Pairwise endpoints must be distinct, catalog-valid capability IDs. Reverse pairs,
  duplicates, cycles, and modifier IDs fail validation.
- Multi-required scenarios may have no primary or pairwise label. Their incidental
  deterministic order is not scored as semantic truth.
- Raw scenarios are normalized, retrieved, and ranked before annotations are loaded
  and joined.
- Every converted Phase 8A annotation must resolve through the frozen audit manifest;
  an unknown, excluded, quarantined, rejected, stale, or proposal-only source fails
  validation.
- A test must permute, reverse, and remove primary/pairwise labels and prove ranking
  output bytes are unchanged.
- Ranking relationships are scorer inputs but are not expected labels. They are kept
  in their own revision-bound artifact and must be frozen before ranking metrics run.
- Direct lineage overlap between relationship inputs and scored evaluation labels is
  rejected. Any allowed structural self-check is tagged and excluded from efficacy
  denominators.
- Reports contain IDs, sources, feature codes, scores, ranks, and closed failure
  codes only—no raw messages, drafts, free-text rationale, or hidden reasoning.

## Exposed ranking-development corpus

### Existing seeds

- T3: `give_constructive_feedback` versus `request` and `de_escalation`.
- T9: `planning` versus `expectation_setting`.
- T10: `clarification` versus request-family neighbors.
- T12: `follow_up` versus request-family neighbors.
- T13: first-request inverse case that must keep `request` primary.
- T1, T2, T4–T8, T11, and T14–T18 remain regression, multi-required, candidate,
  and strict-`NONE` evidence.

### Phase 8A reuse and gap-driven development

Do not start by authoring a fixed batch. First convert the eligible Phase 8A material
under the evidence-reuse gate, deduplicate its families, assign non-circular scoring
roles, and measure the resulting coverage.

The following are coverage targets, not automatic new-case quotas:

| Boundary                                            | Required case shapes to seek first in resolved Phase 8A evidence         |
| --------------------------------------------------- | ------------------------------------------------------------------------ |
| Request vs clarification                            | request-primary, clarification-primary, both-relevant, hard neighbor     |
| Request vs ask-for-help                             | each side primary plus ambiguous/both-relevant                           |
| Request vs constructive feedback                    | each side primary, both-relevant, plain-request inverse                  |
| Follow-up vs request                                | follow-up, first request, resolved-thread negative, both-relevant        |
| Boundary vs decline                                 | ongoing limit, one-time decline, both-relevant, uncertainty negative     |
| Boundary vs de-escalation                           | limit-primary, conflict-repair primary, both-relevant                    |
| Planning vs expectation setting                     | active coordination, estimate, both-relevant, settled-notice negative    |
| Planning vs status update                           | coordination, present status, both-relevant                              |
| Apology vs acknowledge mistake                      | regret-primary, ownership-primary, both-relevant                         |
| Emotional validation vs reassurance                 | validation-primary, supported reassurance, both-relevant                 |
| Emotional validation vs perspective acknowledgement | emotion, interpretation, both-relevant, hard neighbor                    |
| Status update vs expectation setting                | present state, future expectation, multi-required without forced primary |

The Phase 8A ledger directly covers eight production capability-neighbor matrices.
Those matrices and eligible rows are the first source for the relevant targets above.
Candidate boundaries not resolved in Phase 8A—especially
`perspective_acknowledgement`, `give_constructive_feedback`, and absent
`confirmation`—remain candidate/failure evidence unless a separately authorized,
revision-bound source establishes their labels.

After the audit, author only the minimum number of exposed synthetic cases needed to
close documented gaps. The combined reused-plus-new corpus should:

- cover both `REWRITE_DRAFT` and empty-draft `SUGGEST_REPLY` across representative
  boundaries rather than satisfying an arbitrary raw-count quota;
- cover work, personal, and service settings;
- cover English, Simplified Chinese, Traditional Chinese, and code-switching while
  preserving capability/modifier lane separation;
- include negative and strict-`NONE` cases where no primary is authored;
- include inverse, focal-only, neighbor-only, both-valid, and genuinely ambiguous
  cases where each is semantically defensible;
- group translations, direct transforms, and paraphrases under their Phase 8A lineage
  or new scenario family; and
- keep candidate cases in the explicit evaluation overlay.

Record the post-audit new-case count and a gap-to-case justification before authoring.
The combined corpus is exposed development evidence, not held-out evidence, and
cannot support a production-readiness claim.

Evidence sequence:

1. bind and audit Phase 8A sources, then freeze the audit manifest;
2. convert eligible raw evidence and labels into separate revision-bound artifacts;
3. assign every lineage one non-circular scoring role and freeze those assignments;
4. publish the deduplicated coverage gaps;
5. author only gap-filling raw synthetic scenarios and freeze their digest;
6. independently author their required/acceptable/forbidden and primary/pairwise
   labels, validate them, and freeze their digest;
7. freeze the separate relationship sidecar from its assigned boundary sources;
8. only then run the baseline and proposed rankers; and
9. do not tune feature weights after viewing aggregate metrics without revising this
   plan and versioning the development evidence.

Do not author or inspect true held-out evidence in SRS-3.

## Metrics

### Retrieval-regression metrics

Report unchanged retrieval output before ranking:

- Recall@5 and Recall@10;
- required-skill coverage@K;
- all-required-found@K;
- strict `NONE`;
- forbidden-in-Top-K;
- hard-eligible, positive-signal-pool, and Top-K counts and aggregate statistics;
- every required and acceptable retrieval rank; and
- no modifier in capability Top-K.

### Ranking metrics

Report both the coarse retrieval order and the SRS-3 order:

- `Primary@1`: scenarios whose best-ranked explicitly authored primary is rank 1 /
  scenarios with one or more primary labels;
- `Primary@3`: the same denominator, with best primary rank ≤3;
- primary MRR: reciprocal rank of the best explicit primary, only for scenarios with
  a defensible primary label;
- conditional pairwise accuracy: satisfied authored pairs / pairs where both
  endpoints were retrieved;
- end-to-end pairwise accuracy: satisfied authored pairs / all authored pairs, with
  missing endpoints separately attributed to eligibility/retrieval;
- required-before-forbidden rate: correctly ordered co-retrieved
  required/forbidden pairs / all such co-retrieved pairs;
- primary-before-generic-neighbor rate: satisfied explicitly authored
  primary/generic pairs / applicable co-retrieved pairs;
- required and acceptable ranking-rank distributions; and
- per-action, assistance-mode, language, setting, candidate/production-catalog, and
  scenario-family slices where denominators are nonzero.

For scenarios with multiple required capabilities and no primary label, report
required coverage in Top 3/5/10 and rank-set distribution. Do not compute a fake MRR
or pairwise truth from list order.

Every metric must print its numerator and denominator. Empty denominators are `N/A`,
not zero. Scores are scenario-local and never called confidence or probability.

Report efficacy metrics separately for Phase 8A-derived evaluation lineages,
independently authored gap-fill lineages, and the deduplicated combined set. Report
relationship-source structural self-checks in a separate non-efficacy section. Never
pool direct paraphrases as independent observations or count a scorer-configuration
lineage toward uplift.

### Initial implementation thresholds

The SRS-3 implementation may be called complete only if the frozen exposed corpus
meets all of these:

- existing T1–T18 proposed `SIGNAL_ONLY` Recall@5 and Recall@10 remain 23/23;
- strict `NONE` remains 2/2 on T1–T18 and all new strict-`NONE` cases pass;
- no previously retrieved required capability loses a ranking record or falls below
  K=5 on the T1–T18 regression set;
- Primary@1 is at least 0.85 and strictly exceeds coarse retrieval ordering;
- Primary@3 is at least 0.95;
- conditional pairwise accuracy is at least 0.90 and improves by at least 0.15 over
  coarse retrieval ordering;
- required-before-forbidden rate is at least 0.95;
- the explicit T3, T9, T10, and T12 ordering expectations pass, and T13 keeps
  `request` ahead of follow-up/clarification neighbors; and
- no ranking change alters candidate-pool membership, hard eligibility, modifier
  eligibility, or the production selector.

Failure to meet a threshold is a valid SRS-3 result but blocks completion and any
cutover claim. It must be classified and reported rather than repaired by leaking
labels or deleting candidates.

## Traceability and final SRS-3 status

For every catalog capability, the report must expose:

- `skillId` and catalog provenance;
- hard-eligibility result and reason codes;
- matched intent tags and evidence sources;
- matched situation tags and evidence sources;
- `retrievalScore` and `retrievalRank` when retrieved;
- closed ranking feature contributions;
- `rankingScore` and `rankingRank` when ranked; and
- one status from `HARD_INELIGIBLE`, `RETRIEVAL_CUTOFF`, `TOP_K_CUTOFF`, or
  `RANKED`.

Diagnosis is mechanical:

- expected candidate has no retrieval rank → eligibility, context, retrieval, or
  metadata failure using existing traces;
- expected candidate has retrieval rank but violates primary/pairwise order →
  `RANKING_FAILURE`;
- ordered candidates are correct but a later final selector fails → future
  supervisor failure, not SRS-3.

The reranker only reorders the retrieval Top-K. It has no ranking cutoff, so it emits
no `RERANK_CUTOFF` or `BELOW_RERANK_CUTOFF`. All reranked candidates remain present.
`TOP_K_CUTOFF` continues to belong to retrieval.

## Failure taxonomy

Use a closed enum with at least:

- `HARD_ELIGIBILITY_FAILURE`
- `RETRIEVAL_FAILURE`
- `RANKING_FAILURE`
- `BAD_RANKING_LABEL`
- `SKILL_CONTENT_FAILURE`
- `SKILL_BOUNDARY_AMBIGUITY`
- `MISSING_SKILL`
- `DUPLICATE_SKILL`
- `AGENT_ACTION_UPSTREAM_ISSUE`
- `CONTEXT_NORMALIZATION_ISSUE`
- `SKILL_METADATA_GAP`

`BAD_RANKING_LABEL` covers invalid, circular, contradictory, stale, or
catalog-incompatible primary/pairwise annotations. `SKILL_BOUNDARY_AMBIGUITY` covers
a genuine case where reviewed definitions do not support a defensible order. It is
not silently converted to a ranking failure.

## Expected implementation files

| Path                                                                 | Planned role                                                                             |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `.agent/plans/skills-srs-3-ranking.md`                               | Living SRS-3 execution and acceptance record                                             |
| `docs/skills/srs-3-phase8a-evidence-audit.md`                        | Phase 8A reuse decisions, counts, exclusions, coverage gaps, and non-circular role audit |
| `packages/skills/tests/fixtures/srs3/phase8a-evidence-manifest.json` | Digest-bound source-key conversion outcomes and role assignments; no raw message text    |
| `packages/test-fixtures/src/srs3-ranking-development.ts`             | Eligible converted and gap-filling raw development scenarios only; no ranking labels     |
| `packages/test-fixtures/src/index.ts`                                | Test-only export of raw SRS-3 scenarios                                                  |
| `packages/skills/tests/fixtures/srs3/development-annotations.json`   | Required/acceptable/forbidden plus independent primary/pairwise labels                   |
| `packages/skills/tests/fixtures/srs3/ranking-relationships.json`     | Strict revision-bound specific/generic relationship sidecar; no expected ranks           |
| `packages/skills/tests/srs3-capability-ranking.ts`                   | Private schemas, feature extraction, deterministic reranker, metrics, and report builder |
| `packages/skills/tests/srs3-capability-ranking.test.ts`              | Unit, leakage, regression, metric, and isolation tests                                   |
| `packages/skills/tests/fixtures/srs3/development-report.json`        | Deterministic content-free machine report                                                |
| `scripts/evaluate-srs-3.ts`                                          | Credential-free exposed-development evaluation CLI                                       |
| `package.json`                                                       | Add only the `eval:srs3` command                                                         |
| `docs/skills/srs-3-capability-ranking.md`                            | Human-readable results, failures, limitations, and next gate                             |

Expected unchanged files include `packages/skills/src/engine.ts`, all shared
contracts, `packages/skills/authoring/schema.ts`, approved YAML, generated registry,
AI production exports/callers, prompts, providers, apps, database, and UI.

If implementation proves that any expected-unchanged file must change, stop and
amend this plan before editing it.

## Implementation steps

1. **Reconfirm the frozen baseline.**
   - Verify branch/worktree, 21 definitions, 153 plans, candidate isolation,
     production `CURRENT`, SRS-2 metrics, SRS-2.5 metrics, and dirty-worktree scope.
   - Record hashes for raw T1–T18, annotations, production catalog, and candidate
     overlay.

2. **Audit and reuse Phase 8A before authoring.**
   - Verify all Phase 8A source and definition digests and classify every considered
     row/matrix under the closed conversion outcomes.
   - Exclude quarantines, rejects, unresolved/ambiguous rows, and unapproved proposals
     from positive ranking evidence.
   - Split capability matrices from modifier-only separation evidence, deduplicate
     scenario families, and assign non-circular scorer/metric/regression roles.
   - Publish and freeze the evidence manifest, audit report, and measured coverage
     gaps before creating a new raw scenario.

3. **Freeze ranking data before scoring.**
   - Convert only eligible Phase 8A evidence, preserving source/revision/digest
     provenance.
   - Add only the raw exposed-development scenarios justified by the frozen gap list.
   - Add strict ranking annotations separately and validate all IDs/kinds/catalogs.
   - Add and review the relationship sidecar independently from expected ranking
     labels.
   - Record separate digests and prove labels are not scorer inputs.

4. **Add private SRS-3 contracts.**
   - Define ranking configuration, feature contribution, ranked candidate, result,
     annotation, relationship, metric, and failure schemas under
     `packages/skills/tests/`.
   - Reject unknown fields and free-text rationale.

5. **Implement the deterministic reranker.**
   - Consume `SRS_2_5_PROPOSED` source-aware signals and unchanged SRS-2
     `SIGNAL_ONLY` Top-K.
   - Calculate capped feature contributions and the fixed score above.
   - Apply relationship features only under their trigger conditions.
   - Preserve membership, retrieval fields, and separate modifier lane.
   - Apply deterministic tie-breaking and emit no rerank cutoff.

6. **Add metrics and attribution.**
   - Compute baseline versus proposed ordering metrics with exact denominators.
   - Separate missing candidates from misranked candidates using existing stage
     traces.
   - Report T11 metadata gap, candidate overlay cases, multi-required cases, and
     ambiguous labels separately.

7. **Generate reports and validate.**
   - Add `eval:srs3`, deterministic JSON evidence, and concise Markdown results.
   - Verify repeated runs, reordered catalog input, and permuted labels produce the
     same ranking bytes.
   - Run all focused and repository-wide gates.

8. **Stop at the review gate.**
   - Record completion or failed thresholds honestly.
   - Do not begin supervisor design, production cutover, held-out authorship, or
     SRS-4.

## Tests

### Unit and contract tests

- Phase 8A source hashes, row keys, decisions, replacement revisions, approval
  digests, and definition bindings fail closed on drift or mismatch;
- all `REJECT`, `QUARANTINE`, unresolved, context-insufficient, and unapproved
  proposal material is excluded from positive ranking fixtures and labels;
- eligible converted records preserve source/revision/digest provenance, and no
  approval is inferred from Codex review status alone;
- each lineage has exactly one of relationship-source, evaluation-label, or
  regression/failure-only scoring roles; direct role overlap and paraphrase leakage
  fail validation;
- modifier neighbor matrices cannot enter capability ranking relationships or
  capability-ranking metric denominators;
- strict schema validation, unknown-field rejection, finite integer scores, rank
  continuity, unique IDs, and stable ordering;
- each feature independently, mutually exclusive provenance bonuses, caps, signed
  contributions, exact score sums, and retrieval-score separation;
- action-aligned provenance for rewrite, complete-draft, suggest-reply, and
  conversation-derived suggest-reply cases;
- relationship activation only when both candidates and trigger intent are present;
- inverse/easy cases proving no global capability preference;
- stale/unknown/cyclic/reversed relationship rejection;
- no modifier accepted as a capability, ranking label, or relationship endpoint;
- every retrieved Top-K capability receives a ranking record; no candidate is added,
  removed, or marked `RERANK_CUTOFF`;
- stable ties under catalog/input reorder and repeated execution;
- raw scenarios contain no ranking labels; permuted/removed labels cannot change
  scores or ranks;
- expected labels, observed ranks, and metric results cannot enter feature extraction.

### Regression and integration tests

- T1–T18 proposed `SIGNAL_ONLY` retrieval remains 23/23 at K=5/K=10 and strict
  `NONE` remains 2/2;
- T3, T9, T10, T12, and inverse T13 explicit ordering checks;
- all 53 SRS-2 scenarios preserve eligibility, retrieval score/rank, Top-K,
  modifier eligibility, disappearance stage, and pool counts byte-for-byte;
- English, Simplified Chinese, Traditional Chinese, code-switching, unsupported
  primary language, all three settings, rewrite, suggest-reply, and non-wording
  actions;
- production and evaluation catalogs stay isolated; candidates never enter default
  scope; `confirmation` remains absent;
- 21 production definitions, 153 frozen plans, current production selection, Phase 4
  behavior, and prompt output remain exact;
- metric formulas use hand-computed probes for primary, MRR, conditional/end-to-end
  pairwise, required-before-forbidden, rank-set coverage, and empty denominators;
- machine reports are deterministic and contain no raw text, draft, prompt, provider
  payload, expected-label leakage, or free-text rationale.

Default tests require no credential, provider, network, screenshot, or real message.

## Acceptance criteria

- [ ] Production `SkillEngine.select()`, `deriveSkillContext()`, prompts, provider
      paths, and app behavior remain unchanged.
- [ ] Production remains exactly 21 ACTIVE definitions and 153 frozen plans on the
      `CURRENT` context profile.
- [ ] SRS-3 consumes only evaluation-only `SRS_2_5_PROPOSED` + `SIGNAL_ONLY` Top-K;
      it does not silently cut production over.
- [ ] Capability and language-modifier lanes remain structurally separate; modifiers
      never receive capability retrieval or ranking scores/ranks.
- [ ] Retrieval score/rank and ranking score/rank are separate fields with separate
      meanings; neither is described as probability or confidence.
- [ ] The reranker preserves every retrieval Top-K member and emits no
      `RERANK_CUTOFF` because SRS-3 defines no ranking cutoff.
- [ ] Raw scenarios, ranking labels, relationship inputs, and rank outputs are
      separate revision-bound artifacts; label permutation/removal cannot affect
      ranking output.
- [ ] Primary and pairwise metrics use only explicitly authored labels. Required does
      not imply primary, and multi-required cases without primacy are not forced into
      a scored total order.
- [ ] The Phase 8A audit manifest accounts for every considered row and neighbor
      matrix, preserves revision/digest provenance, and explicitly excludes rejected,
      quarantined, unresolved, and unapproved-proposal material from positive gold.
- [ ] Reused Phase 8A evidence and gap-driven new scenarios together satisfy the
      boundary, inverse, language, mode, setting, and strict-`NONE` coverage in this
      plan; every new case has a documented uncovered gap; held-out remains
      unauthored.
- [ ] Relationship-source and evaluation-label lineages do not overlap. Structural
      self-checks are excluded from ranking-efficacy threshold denominators.
- [ ] T1–T18 retrieval Recall@5/10 remains 23/23, strict `NONE` remains 2/2, and no
      previously retrieved required capability loses its ranking record or falls
      below K=5.
- [ ] Frozen-corpus Primary@1 ≥0.85 and improves over coarse retrieval;
      Primary@3 ≥0.95; conditional pairwise accuracy ≥0.90 and improves by ≥0.15;
      required-before-forbidden ≥0.95. Every metric includes an exact denominator.
- [ ] T3, T9, T10, and T12 pass their explicit ranking expectations; T13 remains a
      correct inverse request case.
- [ ] T11 remains classified as the existing legacy `SKILL_METADATA_GAP`; no metadata
      or admission repair is hidden inside ranking.
- [ ] Candidate definitions remain evaluation-only and inactive; `confirmation`
      remains absent.
- [ ] No supervisor, final selection, modifier selection, final resolution,
      `SkillPlan`, prompt compiler, embedding, LLM reranker, provider call, final-text
      evaluation, database, UI, memory, commit, merge, or push is included.
- [ ] Reports are deterministic, inspectable, content-free, explicit about exposed
      development limitations, and end at a user review gate.

## Validation commands

Implementation should run, in this order, from the `skills` worktree:

```text
pnpm exec vitest run packages/skills/tests/srs1-foundation.test.ts packages/skills/tests/srs2-shadow-retrieval.test.ts packages/ai/src/skill-context.test.ts packages/skills/tests/srs2-5-context-normalization.test.ts packages/skills/tests/srs3-capability-ranking.test.ts
pnpm eval:srs2
pnpm eval:srs2-5
pnpm eval:srs3
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

Run the SRS-3 evaluator twice and compare the generated report hash. No `--live`
option exists in this phase.

## Privacy and data handling

- Use only checked-in synthetic exposed-development fixtures.
- Do not persist raw screenshots or real messages.
- Do not log or include message bodies, drafts, selected-intent prose, prompts,
  provider payloads, identities, free-text rationales, or hidden reasoning in machine
  reports.
- Machine artifacts may contain scenario IDs/families, fixed action, assistance mode,
  language category, catalog/digest identifiers, skill IDs/versions/kinds, evidence
  source enums, matched tag enums, closed feature codes, numeric scores/ranks, closed
  failure codes, and aggregate metrics.
- Default tests and evaluation make no network or provider call and require no
  credential.

## Risks and mitigations

| Risk                                                    | Mitigation                                                                                                                           |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Phase 8A proposals are mistaken for approved gold       | Closed conversion outcomes, exact approval/digest binding, fail-closed exclusions, and an included/excluded audit manifest           |
| Reused matrices make evaluation circular                | Mutually exclusive lineage roles; scorer-source self-checks are separated from all efficacy denominators                             |
| Ten examples per skill overweight repeated patterns     | Group direct transforms/translations/paraphrases, report raw and deduplicated counts, and score deduplicated lineages                |
| Overfitting exposed diagnostics                         | Freeze raw cases, labels, relationships, and feature weights before scoring; version any later tuning; make no production claim      |
| Ranking becomes hidden gating                           | Preserve every retrieval Top-K member; no SRS-3 cutoff or membership change                                                          |
| Global preference for “specific” skills                 | Require co-presence plus exact trigger intent; retain inverse/easy and B-primary cases                                               |
| Circular label leakage                                  | Separate raw scenarios, relationships, labels, scorer, and metric join; prove permutation invariance                                 |
| Multi-required cases are forced into fake truth         | Allow empty primary/pairwise labels and score rank-set coverage instead                                                              |
| Strict `NONE` regresses                                 | Keep retrieval untouched and require all existing/new `NONE` cases to remain empty                                                   |
| Modifiers mix with capabilities                         | Consume only capability Top-K and retain modifier IDs as a separate untouched lane                                                   |
| Relationship sidecar becomes shadow production metadata | Keep it private, digest-bound, and evaluation-only; require a separate authoring-schema decision later                               |
| Arbitrary numeric scores look calibrated                | Use fixed closed contributions, print them, call scores scenario-local ordering evidence, and forbid confidence/probability language |
| Premature semantic-model complexity                     | No embeddings, model reranker, external index, provider call, or new service in SRS-3                                                |
| Candidate research leaks into production                | Explicit overlay scope, digest binding, public-export tests, and exact production verification                                       |

## Rollback

SRS-3 is additive and private. Rollback removes only:

- the SRS-3 Phase 8A audit report and conversion manifest, never the source Phase 8A
  ledgers or reports;
- the SRS-3 raw fixture export;
- ranking annotations and relationship sidecar;
- private ranker, tests, generated report, evaluation script/command, and results doc;
- SRS-3-specific progress/completion entries in this plan.

Rollback does not touch SRS-1 schemas/evidence, SRS-2 retrieval, SRS-2.5
normalization/evidence, approved definitions, generated registry, production engine,
or application code. Do not reset or overwrite unrelated dirty-worktree changes.

## Limitations and unresolved decisions

- The relationship sidecar is recommended for SRS-3 evaluation, but promotion into
  governed authoring metadata is explicitly deferred until results show stable value.
- Exact primary/pairwise denominators and the new-case count are unknown until the
  Phase 8A reuse audit, deduplication, non-circular role assignment, and gap analysis
  finish; the report must publish them before interpreting percentages.
- The exposed corpus can prove deterministic behavior and reveal regressions, not
  generalization or production readiness.
- No true held-out corpus exists. Its future authorship must happen only after SRS-3
  behavior and thresholds are frozen and separately approved.
- The old roadmap assigned supervision to SRS-3. This direction reset leaves the
  supervisor phase number/name unresolved. Do not assume it becomes SRS-4, because
  the existing SRS-4 plan already owns `SkillPlan`/compiler work; replan that sequence
  separately after SRS-3 review.
- If the approved feature model cannot meet thresholds without new semantic signals,
  report `CONTEXT_NORMALIZATION_ISSUE`, `SKILL_BOUNDARY_AMBIGUITY`, or
  `MISSING_SKILL` as appropriate. Do not add an embedding or LLM reranker without a
  new plan.

## Gate after SRS-3

Implementation ends with a deterministic exposed-development report and a user
review decision. Completion does not authorize production use of
`SRS_2_5_PROPOSED`, `SIGNAL_ONLY`, or the SRS-3 ranker.

The next planning decision must separately determine:

1. whether the feature weights and relationship sidecar are accepted;
2. whether relationships should move into governed authoring metadata;
3. whether a fresh held-out ranking corpus may be authored;
4. where supervisor/final-selection work belongs in the revised roadmap; and
5. whether any shadow-to-production cutover is even eligible for planning.

Until then, stop. Do not start SRS-4.

## Progress log

- 2026-09-27: Read the SRS-3 ranking brief, repository instructions, README,
  planning rules, completed SRS-1/SRS-2/SRS-2.5 plans and reports, diagnostic
  demonstrations, current production selector, private trace/retrieval/normalization
  code, authoring schema, and runtime skill contracts.
- 2026-09-27: Confirmed the `skills` worktree/branch, dirty retained evidence,
  21-definition/153-plan production boundary, 14/7 capability/modifier split, 36
  prose neighbor records, two evaluation-only candidates, and absent `confirmation`.
- 2026-09-27: Replaced the old SRS-3 supervisor direction with a ranking-only plan.
  No implementation, production, schema, metadata, fixture, test, script, runtime,
  candidate, provider, Git-history, or SRS-4 change was made.
- 2026-09-27: Audited the Phase 8A semantic ledger structure and amended SRS-3 to
  require evidence reuse before new authoring. Confirmed 210 rows split 129 KEEP / 71
  REVISE / four REJECT / six QUARANTINE, 21 boundary records, 13 neighbor matrices,
  and a separate digest-bound focused approval set. Added closed conversion outcomes,
  exclusion of proposal-only/quarantined/rejected material, non-circular lineage
  roles, deduplication, and gap-driven rather than quota-driven scenario authoring.
- 2026-09-28: Completed the SRS-3A evidence-reuse audit without authoring ranking
  labels or scenarios. An independent review found one circularity-classification
  defect: the overlap rule used the 12 ranking-target pairs instead of all eight
  structural capability matrices, allowing `phase8a-row-planning/A2` to remain
  evaluation-eligible.
- 2026-09-28: Repaired the general overlap rule, reclassified `planning/A2` as
  `FAILURE_ANALYSIS_ONLY` with `MATRIX_LINEAGE_INDEPENDENCE_UNPROVEN`, regenerated
  the manifest, and added regression coverage across all capability matrices.
  SRS-3A now awaits a fresh independent review; SRS-3B remains unauthorized.

## Completion record

Planning deliverable only. The proposed implementation is a deterministic,
evaluation-only capability reranker over `SRS_2_5_PROPOSED` + `SIGNAL_ONLY` Top-K,
using a small closed feature model and a revision-bound relationship sidecar. It adds
only justified gap-filling scenarios after auditing and reusing eligible Phase 8A
evidence, plus primary/pairwise metrics and stage-level attribution. It changes no
production behavior.

Only the SRS-3A evidence-reuse audit and its circularity remediation are implemented.
No ranking corpus, primary or pairwise labels, relationship sidecar, reranker, or
production behavior has been created. The next action is a fresh independent review
of SRS-3A. SRS-3B remains stopped pending that review and separate authorization.
