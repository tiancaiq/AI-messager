# SRS-3B — Exposed ranking development corpus

Status: remediation implemented; fresh independent and language review pending  
Owner: Codex  
Created: 2026-09-28  
Updated: 2026-09-28  
Parent: [SRS-3 capability ranking](skills-srs-3-ranking.md)  
Predecessor: [SRS-3A audit](../../docs/skills/srs-3-phase8a-evidence-audit.md) and its completed independent re-review  
Next gate: SRS-3C baseline evaluation, separately authorized

## Outcome and scope

SRS-3B produces a small, reviewed, synthetic, exposed-development corpus that can
later answer whether an already retrieved capability should rank above a plausible
neighbor. It delivers runnable raw inputs, separate ranking annotations, provenance,
duplicate-family records, and a coverage report. SRS-3C will measure the existing
ordering; SRS-3D may change it. This phase calculates no ranking improvement.

No SRS-3B work may alter production definitions, metadata, generated registry,
`SkillEngine.select()`, `deriveSkillContext()`, shared contracts, providers, prompts,
apps, candidate status, or the `CURRENT` production context profile. It creates no
true held-out corpus, ranking feature, weight, relationship sidecar, reranker,
supervisor, final selection, or `SkillPlan`. A proposed relationship sidecar in the
parent SRS-3 plan belongs to SRS-3D, after this corpus and SRS-3C baseline are
frozen. The older all-in-one implementation sequence yields to this phase split.

## Inspected baseline and evidence boundary

The `skills` branch uses the separate `AI messager-skills` worktree, which already
contains retained uncommitted work. The authoring catalog has 21 ACTIVE production
definitions: 14 universal atomic capabilities and seven language modifiers. The
production behavior matrix has 153 frozen plans. SRS-2's private shadow retriever
returns separate capability and modifier lanes, a configurable Top-K (default 10),
12/10 coarse relevance scores, and an identity rerank. SRS-2.5's private
`SRS_2_5_PROPOSED` profile derives source-aware context without changing the
production `CURRENT` profile. The 53 SRS-2 cases and T1–T18 SRS-2.5 diagnostics
remain regression/diagnostic seeds, not newly approved ranking gold.

The SRS-3A manifest
`packages/skills/tests/fixtures/srs3/phase8a-evidence-manifest.json` contains 350
records and 237 lineages: 22 relationship, 69 evaluation-source, and 146
regression/failure; relationship/evaluation overlap is zero. Its source inventory
and approval counts remain 210 original examples, 71 proposals, 35 remediation
replacements, and 34 exact human approvals. The 69 evaluation-source records are
65 resolved originals and four exactly approved replacements, all English; 37 are
focal-only, 12 both-valid, 20 neither/strict-NONE, and none neighbor-only. They are
source material, not executable ranking cases or approved primary/pairwise labels.
The Phase 8A YAML remains authoring-only.

The earlier independent review document records the historical SRS-3A **FAIL**.
The subsequent remediation and independent re-review in this task passed: all eight
structural capability matrices were checked, 21 overlapping lineages were excluded,
and the manifest regenerated twice at SHA-256
`0700162fd5b7c656c1d6134cdd3d69baa9a824eb4a01a598b7ea6d4b4c666362`.
Keep the historical review intact. At SRS-3B implementation start, recheck this
binding and the SRS-3A audit tests; stop if it drifts.

Relevant existing shapes were inspected in
`packages/test-fixtures/src/srs2-5-context-normalization.ts`,
`packages/skills/tests/srs1-foundation.ts`,
`packages/skills/tests/srs2-shadow-retrieval.ts`,
`packages/skills/tests/srs2-5-context-normalization.ts`,
`packages/contracts/src/skills.ts`, and the current atomic YAML. The current
`Srs25RawScenario` has a validated `CoachingRequest`, fixed `AgentAction`, family,
development split, and catalog scope. `SrsScenarioAnnotationSchema` already checks
required/acceptable/forbidden disjointness, action/mode agreement, strict-NONE,
and preservation flags. Neither `CoachingRequest` nor `SkillContext` has a
structured work/personal/service field. SRS-3B should add a **fixture-only**
setting enum; it must not feed a new production or shadow context field or become a
ranking feature. A later setting-aware signal proposal needs its own review.

## Corpus size and coverage decision

Plan for **41 distinct scenario families**. The reviewed gap ledger requires 20
pair-inverse anchors, one additional English wording case, four both-valid cases,
four distinct NONE cases (including one non-wording action), and 12 Chinese/script
cases. That yields 29 English cases, including 14 rewrite and 14 empty-draft
suggest wording cases, plus the non-wording NONE. This one-case increase above 40
is recorded before authoring; Chinese cases remain excluded from efficacy until
qualified language review. This is a bounded
authoring count, not a per-skill quota. Ten priority pair distinctions need an
A-central and B-central inverse where both meanings are defensible (up to 20
anchors). Aim for six to eight both-valid cases that test composition without a
forced order, four distinct strict-NONE situations, and approximately six to eight
additional cases for mode, language, setting, multi-required, and difficult inverse
gaps. One scenario may test multiple pairs, but it receives one family ID and one
weight in aggregate metrics. The case count may fall below 36 if independent
coverage is complete, or rise above 40 only after a documented gap and plan update.

The initial coverage ledger should distinguish a scenario's _pair shape_ from its
ranking label. Neither-valid cases can serve multiple pairs, but four distinct
semantic NONE situations are required: ordinary acknowledgement, ordinary social
exchange, neutral information, and one non-wording action/eligibility regression.
At least four reviewed cases must be multi-required, including both-valid/no-order
examples. Do not give every case a primary or pairwise target.

| Priority pair                       | Planned independent coverage and semantic boundary                                  |
| ----------------------------------- | ----------------------------------------------------------------------------------- |
| request ↔ clarification             | First request versus one missing detail; both only when both operations are visible |
| request ↔ ask_for_help              | Ask for an item/action versus ask for help performing work                          |
| follow_up ↔ request                 | Visible prior ask versus first ask; both when a renewed request is explicit         |
| boundary_setting ↔ decline          | Repeated/ongoing limit versus a discrete refusal                                    |
| boundary_setting ↔ de_escalation    | Supported limit versus reducing conflict heat                                       |
| planning ↔ expectation_setting      | Coordination of next steps versus a grounded forecast or availability bound         |
| planning ↔ status_update            | Next-step coordination versus current-state information                             |
| apology ↔ acknowledge_mistake       | Regret versus supported ownership; no invented fault                                |
| emotional_validation ↔ reassurance  | Name a supported feeling versus grounded encouragement                              |
| status_update ↔ expectation_setting | Current state versus future expectation; include an equal multi-required case       |

Each pair gets an A-central and B-central case where the definitions permit both.
Both-valid and neither shapes are added when meaningful, not manufactured for a
four-cell quota. For every explicit A>B pair, seek a genuine B>A inverse; an absent
inverse is a documented coverage gap, never permission to assert a false label.
Case prose must not copy the eight structural matrices or their paraphrases. The
matrices identify boundaries to test but never enter efficacy denominators.
All eight matrix-backed priority pairs therefore need wholly new independent
efficacy cases. `planning`/`expectation_setting` and `planning`/`status_update`
also lack independent pair coverage and need new cases. For `request`/
`ask_for_help`, the six eligible Phase 8A source records can be considered for
both-valid or neither coverage after triage, but its A/B inverse cases still need
new independent evidence. No existing SRS-2/SRS-2.5 diagnostic is automatically
promoted to ranking gold.

Assess four secondary pairs during corpus review: request ↔ planning,
clarification ↔ ask_for_help, decline ↔ planning, and boundary_setting ↔
expectation_setting. Promote one into scored coverage only if the current YAML
distinctions and independent cases support both inverse directions. Otherwise record
the reason for deferral. The unresolved `give_constructive_feedback` and
`perspective_acknowledgement` candidates are **excluded from SRS-3B efficacy gold**;
their T3/T4 diagnostic cases stay exploratory outside main metrics until a separate
boundary decision. `confirmation` is absent and gets no label.

### Mode, language, and setting

- Include both `REWRITE_DRAFT` with an existing draft and `SUGGEST_REPLY` with an
  empty draft in substantial numbers: target at least 14 of each among the scored
  wording cases. Reuse the same capability across modes when evidence permits;
  avoid skill variants by mode. A non-wording action is included only for NONE/action
  eligibility. `COMPLETE_DRAFT` has no eligible Phase 8A capability source and is
  recorded as a later ranking-development gap; it cannot be treated as covered by a
  rewrite case.
- Target at least 24 English, four Simplified Chinese, four Traditional Chinese,
  and four Chinese/English code-switch cases across the approximately 38 cases.
  Language/script/code-switch fields live in the raw request. Chinese cases test
  universal capability ranking; modifier IDs remain in a separate diagnostic lane
  and never appear as primary, pairwise, or capability labels. Native-language
  semantic review is required before those cases become gold; pending cases remain
  quarantined from metric denominators.
- Mark each new raw scenario with fixture-only `setting: WORK | PERSONAL |
SERVICE | UNSPECIFIED`; ensure at least three reviewed cases per named setting.
  The setting is authoring/coverage metadata only because current request/context
  contracts cannot consume a structured setting. Do not infer a missing setting
  from message prose or claim the shadow ranker received this enum.

## Phase 8A source triage and provenance

Before authoring cases, produce a decision for **each of the 69** manifest
`EVALUATION_LABEL_SOURCE` records in a separate triage artifact keyed by exact
lineage, source revision, source artifact digest, item digest, and manifest hash.
This plan does not predetermine that any of the 69 becomes a ranking case. The
`request`/`ask_for_help` audit coverage (five both-valid, one neither) merits first
inspection; it supplies no inverse or pairwise order by itself. The eight
matrix-overlapping groups stay excluded even if their examples seem useful.

Use one exclusive disposition per source: `ADAPT_TO_RANKING_CASE`,
`REGRESSION_ONLY`, `DUPLICATIVE`, or `INSUFFICIENT_FOR_RANKING`. Record independent
utility flags `MULTI_REQUIRED_NO_ORDER`, `USEFUL_FOR_NONE`, `USEFUL_FOR_PRIMARY`,
and `USEFUL_FOR_PAIRWISE` only after semantic review; these are not mutually
exclusive dispositions and are not auto-labels. The triage records the reason,
duplicate-family ID, proposed scenario ID if adapted, and whether the source has
enough visible conversation, draft state, intent, and action to run faithfully.

`PHASE8A_ADAPTED` means the new runnable fixture faithfully transcribes the
reviewed semantic situation without new material facts, commitments, actors,
timing, or capability relationship. Bind its original or approved replacement
revision and digest. If making the case runnable adds or changes material evidence,
mark it `NEW_INDEPENDENT_SRS3`, preserve only a non-scoring inspiration reference,
and review it as a new synthetic case. Translation or paraphrase of the same source
shares a family and does not count as an independent inverse. Completely new
boundary cases must have no Phase 8A efficacy lineage and must be checked for
semantic overlap with matrix prose and the 21 excluded lineages. Any doubtful
independence goes to `QUARANTINE`.

## Raw input, annotation, and review contracts

Keep the raw runnable input in `packages/test-fixtures/src/srs3-ranking-development.ts`
and the labels in `packages/skills/tests/fixtures/srs3/development-annotations.json`.
Define private strict Zod schemas under `packages/skills/tests/srs3-ranking-corpus.ts`;
reuse `CoachingRequestSchema`, `AgentActionSchema`, `SkillContextSchema` fields,
`SrsScenarioAnnotationSchema` label constraints, and catalog-kind validation rather
than adding public contracts. The implementation may create a separate JSON triage
ledger and content-free coverage report. Illustrative shape only (no case is
authored by this plan):

```ts
type Raw = {
  id: string;
  scenarioFamily: string;
  split: "EXPOSED_DEVELOPMENT";
  request: CoachingRequest;
  fixedAction: AgentAction;
  catalogScope: "PRODUCTION";
  setting: "WORK" | "PERSONAL" | "SERVICE" | "UNSPECIFIED";
};

type Annotation = {
  id: string;
  sourceKind: "PHASE8A_ADAPTED" | "NEW_INDEPENDENT_SRS3";
  sourceLineage: string | null;
  sourceRevision: string | null;
  sourceItemDigest: string | null;
  evidenceRole: "EVALUATION_LABEL_SOURCE" | "NEW_INDEPENDENT_SOURCE";
  capabilities: {
    required: string[];
    acceptable: string[];
    forbidden: string[];
  };
  strictNone: boolean;
  primary: string[];
  shouldRankAbove: Array<{ higher: string; lower: string }>;
  reviewState: "PENDING_REVIEW" | "ACCEPTED" | "QUARANTINE";
};
```

The finalized schemas must also bind raw-set digest, annotation-set digest,
catalog revision, duplicate-family ID, action/mode/language agreement, preservation
checks, and closed review issue codes. Source bindings must resolve through the
frozen SRS-3A manifest; any non-eligible lineage, stale digest, matrix lineage,
modifier, candidate, absent skill, or unknown ID fails closed. Provenance metadata
may be joined for audit after raw processing but never enter `CoachingRequest`,
`SkillContext`, retrieval, or ranking feature inputs.

`required` means the capability should be available to a later supervisor;
`acceptable` means useful but not necessary; `forbidden` means semantically
inappropriate. These sets are disjoint and are not an order. `strictNone` requires
no required or acceptable capability and no primary or pairwise target. A `primary`
ID is allowed only when the central operation is independently defensible from
visible evidence; it must also be required or acceptable. Multiple equally central
operations may remain multi-required with `primary: []`. If more than one primary
is truly co-central, later Primary@K is an any-of metric with an explicit denominator
and the case is excluded from pairwise ordering unless a separate order is proven.

`shouldRankAbove` is authored only for a context-dependent order between two
plausible capability candidates. Both endpoints must be capability IDs, be eligible
for the fixed action/catalog, and be in required or acceptable sets. Distinct,
acyclic pairs are required. No pair is inferred from `required` versus
`acceptable`, and a forbidden capability does not create a pairwise target. A
both-valid/no-order case has both skills in `required` or `acceptable`,
`primary: []`, and `shouldRankAbove: []`. Record a concise reviewer justification in
the review ledger only; it is excluded from scorer input and content-free reports.

## Leakage, duplicate, and semantic review gates

The evaluation loader exposes only `request`, fixed `AgentAction`, catalog scope,
and existing structured inputs to SRS-2.5 normalization and SRS-2 retrieval.
It validates and joins annotations **after** that path returns. At SRS-3B there is
no reranker to call; a unit test should run the existing shadow path with labels
removed, permuted, and reversed and compare result bytes. Future SRS-3C/D callers
must keep the same raw-only interface. Tests also scan serialized raw fixtures,
traces, and context for required/acceptable/forbidden IDs, primary/pairwise fields,
review rationale, and expected ranks; matching ordinary message words alone is not
a leakage failure. Reports may contain IDs, counts, digests, review states, and
closed codes, never raw messages or drafts.

Every scenario gets a family ID. The reviewer compares exact normalized text and
meaning-level paraphrases across new cases, T1–T18, the 69 eligible sources, the
eight matrices, and excluded row lineages. Same facts/intent with changed names,
language, or surface wording belongs to one family. Count unique families in
coverage and later metrics; retain raw variants only for language/mode invariance
diagnostics. A potential duplicate is `DUPLICATE_SCENARIO` until resolved.

Author raw cases first, with neither scoring IDs nor ranking-rule knowledge in the
input artifact. A separate semantic review then checks every case and annotation
for label correctness, independent evidence, primary/pairwise justification,
preserved intent/facts/commitments/certainty/responsibility, action/draft agreement,
neighbor distinction, multi-required handling, strict NONE, and language quality.
Use `ACCEPTED` only after that review; ambiguous, insufficient, or circular cases
become `QUARANTINE` with `BAD_RANKING_LABEL`, `SKILL_BOUNDARY_AMBIGUITY`,
`DUPLICATE_SCENARIO`, or `INSUFFICIENT_EVIDENCE` as appropriate. Quarantined cases
stay visible in an audit ledger but outside efficacy denominators. Do not treat
`PENDING_REVIEW` as accepted. Preserve reviewer type and exact reviewed revision;
do not claim human review when only Codex has reviewed a case.

## Expected implementation files and sequence

| Path                                                                 | SRS-3B use                                                                  |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `.agent/plans/skills-srs-3b-ranking-corpus.md`                       | Living plan and completion record                                           |
| `packages/skills/tests/fixtures/srs3/phase8a-evidence-manifest.json` | Read-only provenance gate                                                   |
| `packages/skills/tests/fixtures/srs3/source-triage.json`             | All 69 source decisions, reasons, bindings, and family IDs                  |
| `packages/test-fixtures/src/srs3-ranking-development.ts`             | Synthetic raw exposed-development inputs only                               |
| `packages/test-fixtures/src/index.ts`                                | Test-only raw fixture export if needed by the current pattern               |
| `packages/skills/tests/fixtures/srs3/development-annotations.json`   | Separate reviewed labels and provenance; no input text                      |
| `packages/skills/tests/srs3-ranking-corpus.ts`                       | Private validators, joins, and content-free coverage accounting only        |
| `packages/skills/tests/srs3-ranking-corpus.test.ts`                  | Provenance, non-circularity, label, deduplication, and leakage gates        |
| `docs/skills/srs-3-ranking-corpus.md`                                | Counts, pair/mode/language/setting coverage, exclusions, and review results |

No SRS-3 evaluator CLI or `eval:srs3` command is needed in this phase; the parent
plan's ranking evaluator belongs to SRS-3C/D. The report is a corpus inventory, not
a ranking result. No public contract/schema, package runtime export, YAML,
generated registry, or production caller should change.

Implementation order after approval:

1. Recheck branch, source hashes, frozen manifest, source approval bindings, 21
   definitions, 153 plans, candidate isolation, and SRS-3A PASS status.
2. Produce and review the 69-row triage ledger; record source reuse decisions and
   measured pair/mode/language/setting gaps. Keep the eight matrices separate.
3. Freeze a short gap-to-case checklist. Author raw synthetic scenarios for only
   those gaps, using fixed actions, visible evidence, and fixture-only setting.
4. Add separate annotations, exact provenance and family bindings, then perform
   semantic review. Quarantine doubtful cases and revise before acceptance.
5. Validate strict schemas, source chains, matrix independence, label semantics,
   catalog/lane isolation, raw-only evaluation input, and deduplicated coverage.
6. Publish a content-free coverage report with accepted/quarantined counts and
   explicit deferred gaps. Stop before SRS-3C.

## Metrics enabled, tests, and acceptance criteria

The accepted corpus will later support Primary@1, Primary@3, MRR (only where a
primary exists), conditional pairwise ordering accuracy, primary-before-generic
neighbor, required-before-forbidden, required and acceptable rank distributions,
Recall@5/10, required coverage@K, all-required-found@K, forbidden Top-K, and strict
NONE. SRS-3B validates only that denominators and labels are well formed; SRS-3C
owns the first current-ranking baseline. The later failure taxonomy may distinguish
`RETRIEVAL_FAILURE`, `CONTEXT_NORMALIZATION_ISSUE`, `SKILL_METADATA_GAP`,
`RANKING_FAILURE`, `BAD_RANKING_LABEL`, `SKILL_BOUNDARY_AMBIGUITY`,
`MISSING_SKILL`, `DUPLICATE_SKILL`, and `AGENT_ACTION_UPSTREAM_ISSUE`. SRS-3B's
quality report uses the four review issue codes above, including
`DUPLICATE_SCENARIO` and `INSUFFICIENT_EVIDENCE`.

Acceptance before SRS-3C:

- [x] Every one of the 69 source records has one bound triage disposition; no
      structural matrix or excluded Phase 8A lineage supplies efficacy labels.
- [x] Raw inputs and annotation/review/provenance artifacts are separate; changing
      or removing annotations leaves the existing shadow retrieval bytes unchanged.
- [x] Accepted cases are synthetic, exposed development only; held-out is
      `NOT_AUTHORED`, and scenario families prevent duplicate metric weighting.
- [ ] All ten priority pairs have independently reviewed A/B inverse coverage or a
      specific documented semantic exception. Both-valid, multi-required/no-order,
      and strict-NONE cases are represented without forced primary/pairwise truth.
- [ ] At least 14 accepted rewrite and 14 accepted empty-draft suggest cases; at
      least four accepted cases each in Simplified Chinese, Traditional Chinese,
      and Chinese/English code-switching, subject to qualified language review.
      Each named setting has at least three accepted fixture-only cases.
- [ ] Every accepted primary/pairwise label has an independent reviewer rationale;
      no order is inferred solely from required/acceptable/forbidden categories.
      Ambiguous and unreviewed cases are excluded from efficacy.
- [x] Capability labels contain no modifier IDs or unresolved candidate IDs; no
      production, corpus baseline, ranking algorithm, or held-out behavior changes.
- [x] `skills:verify-production` still reports 21 exact definitions and 153 plans.

Focused tests should exercise digest drift, excluded lineage, candidate/modifier
labels, duplicate families, inconsistent action/draft/language/setting fields,
strict-NONE contradictions, pair cycles/reversals, multi-required/no-order,
annotation permutation/removal, and manifest matrix overlap. Run the SRS-3A audit
and relevant Phase 8/SRS-1/SRS-2/SRS-2.5 integrity tests as regressions. Run
`pnpm skills:check`, `pnpm skills:verify-production`, `pnpm lint`,
`pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm format:check`, and
`git -c core.safecrlf=false diff --check`. Default checks need no credentials or
provider calls.

## Risks, rollback, and limitations

- Generic template-like cases can teach fixed skill ordering. Use genuine A/B
  inverses, grounded context, and reviewer checks against skill-name wording.
- Phase 8A authoring examples are often short prose descriptions. If a runnable
  conversation would require material facts, mark it new independent material or
  exclude it; do not launder a source through an adaptation label.
- Chinese wording may admit different boundaries or an unnatural register. Require
  qualified review or quarantine and report the coverage shortfall honestly.
- Strict NONE can be made artificially easy. Use ordinary messages and action
  eligibility cases, then inspect false capability triggers later in SRS-3C.
- This exposed corpus can guide development but cannot prove final generalization
  or production readiness. `COMPLETE_DRAFT` and held-out evidence remain gaps.
- All proposed files are additive and private; rollback is removal of the SRS-3B
  artifacts, with the SRS-3A audit and production sources retained unchanged.

## Progress log and completion record

- 2026-09-28: Read the repository instructions, README, planning convention, current
  SRS-3 and SRS-3A artifacts, prior independent review, SRS-2/SRS-2.5 reports,
  Phase 8A semantic and focused-approval evidence, source ledgers, manifest,
  fixture/trace/context schemas, and representative atomic definitions. Confirmed
  the previous independent re-review PASS from the task and current manifest hash.
- 2026-09-28: Wrote this SRS-3B plan only. No case, annotation, triage decision,
  ranking code, baseline result, candidate activation, or production change was
  authored.
- 2026-09-28: Approval received. Rechecked the frozen SRS-3A manifest SHA-256 and
  its four focused tests. Triaged all 69 eligible records: 37 insufficient for
  faithful runnable ranking and 32 retained for regression only. The eight
  structural matrices and 21 overlapping row lineages remained excluded.
- 2026-09-28: Authored 41 new synthetic raw families and separate annotations.
  Codex semantic review accepted 29 English cases and quarantined 12 Chinese and
  code-switching cases because qualified native-language review has not occurred.
  Ten priority pairs have A/B central cases; five have pairwise orders in both
  directions and five deliberately lack an unsupported reverse order. Four
  multi-required cases have no forced primary/order, and four are strict NONE.
  The earlier six-to-eight both-valid target was reduced to four defensible cases;
  no additional case was added merely to meet the estimate.
- 2026-09-28: Added private source/digest, label, catalog/lane, duplicate-family,
  action/mode/language, and raw-only leakage checks. Published the content-free
  coverage report. No production or held-out source changed.
- 2026-09-28: Independent review found R23's `status_update` label lacked a
  distinct user-supplied current status. Revised its raw selected intent to state
  the user's account is `refund pending` and that no payment date is available;
  the other party now asks for both facts rather than supplying the status.
  Re-reviewed R23 at `R2`, retained the equal multi-required labels, added a
  focused source-of-status guard, and rebound raw/annotation digests.

Completion record: the SRS-3B authoring increment is complete and remains at its
review gate. The first three, seventh, and eighth acceptance checks passed. The
fourth and sixth await independent corpus review. The fifth met its English mode
and named-setting counts (14 rewrite, 14 empty-draft suggest; work 11, personal
10, service 8) but failed the qualified-language condition: Simplified Chinese,
Traditional Chinese, and code switching each have four raw cases and zero
accepted cases. `COMPLETE_DRAFT` remains uncovered. Secondary pairs have no
reviewed inverse/order sufficient for scoring. These gaps are visible in
`docs/skills/srs-3-ranking-corpus.md`; no exception is claimed as approved.

Validation on 2026-09-28:

1. `pnpm exec vitest run packages/skills/tests/srs3-ranking-corpus.test.ts packages/skills/tests/srs3-phase8a-evidence-audit.test.ts` — two files, 12 tests passed.
2. `pnpm skills:check` — generated registry fresh.
3. `pnpm lint` — passed with zero warnings.
4. `pnpm typecheck` — six workspace projects passed.
5. `pnpm test` — 35 files, 473 tests passed, including Phase 8, SRS-1, SRS-2, and SRS-2.5 regressions.
6. `pnpm build` — six workspace projects built.
7. `pnpm skills:verify-production` — 21 exact definitions and 153 ordered plans passed.
8. `pnpm format:check` — passed.
9. `node node_modules/prettier/bin/prettier.cjs --check --ignore-path .gitignore .agent/plans/skills-srs-3b-ranking-corpus.md docs/skills/srs-3-ranking-corpus.md packages/test-fixtures/src/srs3-ranking-development.ts packages/skills/tests/srs3-ranking-corpus.ts packages/skills/tests/srs3-ranking-corpus.test.ts packages/skills/tests/fixtures/srs3/source-triage.json packages/skills/tests/fixtures/srs3/development-annotations.json` — all scoped deliverables passed.
10. `git -c core.safecrlf=false diff --check` — passed.

The next action is independent review of the SRS-3B annotations and semantic
independence, followed by qualified language review or an explicit revised
acceptance decision. SRS-3C remains stopped and separately authorized.

## 2026-09-28 independent-audit remediation

The independent corpus audit found four blocking English cases (R01, R13, R15,
R19) and three structural issues in quarantined language cases (R30, R39, R41).
This remediation kept 41 families and did not invent replacement pairwise edges.
R01 now carries only `request`; R13, R15, and R19 each carry two required skills
with no primary or order. Eleven English rewrite drafts were revised for plausible
pre-coaching voice and bound to raw/review revision R2. R11, R17, and R27 remain
already-decent English user drafts. All six quarantined Chinese/code-switch
rewrites were classified but not rewritten without qualified native review.
R30/R39/R41 structural fixes are raw R2 and remain `QUARANTINE`, reviewer `NONE`.

Separate fixture-only authoring metadata now classifies every case as explicit
or implicit and every rewrite draft as rough, normal, already decent, or over
polished. Validation binds metadata to all 41 raw revisions and the raw-set
digest. No metadata is passed into runtime observation. Accepted counts after
remediation: 29 English, 12 language quarantine, 18 primary labels, 11 pairwise
edges, seven multi-required/no-order, four strict `NONE`. Draft realism is
7 rough / 7 normal / 6 already decent / 0 over polished across all 20 rewrites.
Accepted boundary explicitness is 5 explicit / 24 implicit, with explicit cases
only in the suggest lane. The corpus remains provisional; a new independent
audit is required before freeze or SRS-3C authorization.

Validation after remediation on 2026-09-28:

1. `node node_modules/vitest/vitest.mjs run packages/skills/tests/srs3-ranking-corpus.test.ts packages/skills/tests/srs3-phase8a-evidence-audit.test.ts packages/skills/tests/srs2-shadow-retrieval.test.ts packages/skills/tests/srs2-5-context-normalization.test.ts` — four files, 41 tests passed.
2. `pnpm skills:check` — registry fresh.
3. `pnpm skills:verify-production` — 21 exact definitions and 153 ordered plans passed.
4. `pnpm lint` — passed with zero warnings.
5. `pnpm typecheck` — six workspace projects passed.
6. `pnpm test` — 35 files, 474 tests passed.
7. `pnpm build` — six workspace projects passed.
8. `pnpm format:check` — passed.
9. `git -c core.safecrlf=false diff --check` — passed.
10. Two independent raw-to-report loads produced identical SHA-256 `7ecd4440e591c6b234ba9b37090709074fb856f59c2b52061da43c303a22d29e` and matched all source/catalog bindings.

The new raw source SHA-256 is
`a185d8f050e6f8dca583254ba9b0211fd843fbc24d22e4fac12354a2eb8adbe7`;
serialized raw set `efce60f7eef73609fcdf1c4080d21e93dba43c57c1d59873c0549306bf3cbdcf`;
annotation file `b4b8920b27c1f025c8027f785ab6c9e3b79b07af3fea05c1af4ac810529b60d6`;
authoring metadata `08597a038d350c50580cde3addb7eef14f19f8bc97257e70b4e140dab849f3b6`.
The triage, catalog, and SRS-3A manifest hashes are unchanged. These are
provisional bindings, **not a corpus freeze**. Stop before SRS-3C.
