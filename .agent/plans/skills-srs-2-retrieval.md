# SRS-2 — Hard eligibility and shadow capability retrieval

Status: complete — SRS-3 not authorized  
Owner: skills implem (implementation), Codex (audit)  
Updated: 2026-09-27  
Parent direction: [Skill retrieval, selection, and planning](skills-retrieval-selection-direction.md)  
Depends on: [approved SRS-1](skills-srs-1-foundation.md)

## Approval boundary

This document plans SRS-2 only. It does not authorize implementation by itself.
No retrieval code, fixture, runtime behavior, registry definition, schema, script,
test, or report is changed until the user approves this plan.

SRS-2 ends at a shadow Top-K diagnostic. It does not authorize SRS-3 selection,
production cutover, candidate activation, provider calls, commits, merges, or pushes.

## Outcome

Add a deterministic, evaluation-only path that:

1. applies inspectable hard eligibility;
2. keeps capabilities and language modifiers in separate lanes;
3. ranks eligible capabilities into a configurable Top-K, defaulting to 10;
4. populates the private SRS-1 trace through the retrieval boundary;
5. compares the current intent/situation admission rule with a signal-only alternative;
6. measures whether every required capability is retrieved and where it ranks; and
7. compares those results with unchanged production `SkillEngine.select()` output.

The result is evidence for the SRS-3 selection design, not a replacement selector.

## Scope

### In scope

- Hard gates for effective `ACTIVE` status, the fixed `AgentAction`, supported
  language family, the existing `zh.code_switching` requirement, and explicit
  production/evaluation catalog scope.
- Authoring-kind partitioning: `ATOMIC` and future `PLAYBOOK` definitions may enter
  capability retrieval; `LANGUAGE_MODIFIER` definitions use a separate eligibility
  lane and never consume capability Top-K positions.
- Deterministic metadata scoring, stable ID tie-breaking, identity/no-op reranking,
  and configurable `K` with an evaluation default of 10. Rank is diagnostic in
  SRS-2; ranking improvement belongs to SRS-3.
- Two shadow configurations over the same scenarios:
  `LEGACY_METADATA_GATE` and `SIGNAL_ONLY`.
- Private traces containing eligibility result/reasons, retrieval score/rank,
  matched-feature reason codes, identity-rerank rank, and disappearance stage.
- Development-only metrics at K=5, K=10, and the configured K.
- A per-scenario comparison of production selection versus shadow retrieval, with
  eligibility, retrieval, and ranking failures classified separately.

### Out of scope

- Any change to `packages/skills/src/engine.ts`, `SkillEngine.select()`, production
  exports, generated registry bytes, approved YAML, shared contracts, AI routing,
  prompt construction, or provider behavior.
- Supervisor selection, modifier selection, conflict/dependency resolution,
  `SkillPlan`, prompt compilation, generation, or production cutover.
- Embeddings, lexical search dependencies, vector databases, model reranking,
  model judges, live-provider calls, or additional services.
- Executing free-text `useWhen` or `doNotUseWhen` as logic.
- Activating Phase 8 candidates in production or adding `confirmation`.
- Authoring, inspecting, unsealing, or scoring a held-out corpus.

## Current state

- Production exposes 21 active definitions: 14 atomic capabilities and seven
  language modifiers. SRS-1 binds their exact bytes, 210 authoring examples, and
  153 frozen Phase 7 plans.
- `packages/skills/src/engine.ts` currently validates context, returns `NONE` for
  non-wording actions, applies active/language/action/code-switch/intent/situation
  filters, scores matches, resolves conflicts, selects at most four total
  definitions, and composes guidance in one method.
- Current intent and situation rules require every non-empty metadata dimension to
  intersect. They therefore act as irreversible pre-ranking filters as well as score
  inputs.
- Current scores are `+12` for an intent match, `+10` for a situation match, `+3`
  for a language-specific definition, and `+8` for applicable code switching.
  SRS-2 capability ranking will use only capability-relevant intent/situation signals;
  modifiers remain outside that ranking.
- SRS-1 provides private strict trace and scenario schemas but retrieval stages do
  not yet carry matched-feature reason codes.
- The exposed development evidence consists of 21 Phase 4 routing scenarios, 210
  canonical **authoring** examples, and 32 Phase 8 candidate-selection scenarios.
  The 210 canonical authoring examples do not contain normalized `SkillContext`
  situation and intent tags and remain `PENDING_HUMAN_REVIEW` unless their approval
  state is explicitly changed through its governed review process.
- Phase 8 candidate definitions are revision-bound, `INACTIVE`, evaluation-only
  fixtures. They are not in the production registry.

## Assumptions and decisions

### 1. Shadow code remains private

Implement the retriever under `packages/skills/tests/`, covered by
`tsconfig.authoring.json`, and invoke it from a TypeScript evaluation script. Do not
export it from `packages/skills/src/index.ts` or compile it into the production
package. Production has no caller for the new path.

### 2. Hard eligibility is narrow

The following are true hard gates:

| Gate | Pass rule | Failure reason |
| --- | --- | --- |
| Status | Entry is effectively `ACTIVE` in its explicitly selected catalog | `STATUS_INACTIVE` |
| Catalog | Production entries are always allowed; evaluation entries require an explicit revision-bound evaluation scope | `CATALOG_ISOLATED` |
| Action | Definition declares the already-fixed `AgentAction` | `ACTION_INELIGIBLE` |
| Language | At least one declared language is in the existing eligible-language set | `LANGUAGE_INELIGIBLE` |
| Code switch | `zh.code_switching` requires `context.language.codeSwitching === true` | `MISSING_STRUCTURED_PREREQUISITE` |

Hard-gate evaluation order is status → catalog → action → language → code-switch.
All applicable failures may be recorded, but the first failure determines the
candidate's disappearance at `HARD_ELIGIBILITY`. The fixed action is consumed, never
predicted or changed.

Intent and situation metadata are deliberately excluded from this true-hard-gate
table. SRS-2 evaluates them as competing retrieval admission policies.

### 3. Evaluation-only candidates require an explicit overlay

The default catalog scope is `PRODUCTION`; it can never see Phase 8 candidates.
Candidate scenarios may explicitly request `PRODUCTION_PLUS_EVALUATION`. The harness
then constructs an ephemeral, revision-bound evaluation overlay for
`perspective_acknowledgement` and `give_constructive_feedback`, marking those copies
active only inside that overlay. Source fixtures remain `INACTIVE`, production bytes
remain unchanged, and traces retain `catalog: EVALUATION_ONLY` provenance.

The overlay is allowlisted by ID and source digest. It is not a runtime activation
or evidence that either candidate should be promoted. `confirmation` is absent.

### 4. Intent/situation policy is an experiment, not a migration

Run every eligible development scenario through both modes:

- `LEGACY_METADATA_GATE`: reproduce the current admission rule. A definition with a
  non-empty intent list must have an intent intersection, and a definition with a
  non-empty situation list must have a situation intersection. Failure is recorded
  at `RETRIEVAL_CUTOFF`, not misrepresented as immutable hard ineligibility.
- `SIGNAL_ONLY`: intent and situation intersections add ranking evidence but absence
  does not independently exclude a definition. A capability still needs at least one
  positive retrieval signal; zero-signal definitions are not used to fill Top-K and
  disappear at `RETRIEVAL_CUTOFF` with `NO_SUPPORTING_EVIDENCE`.

Both modes use the same score: intent match `+12`, situation match `+10`. Scores are
scenario-local ordering signals, never probabilities, confidence, or comparable
calibration across scenarios. This deliberately coarse score and resulting rank are
diagnostic only in SRS-2. SRS-3 owns any ranking-quality improvement. Ties resolve by
stable skill ID ascending.

SRS-2 reports both modes without choosing a production winner. Any production rule
change requires a later explicit decision based on the report and regressions.

### 5. Top-K and reranking semantics

- `topK` is a positive integer, defaults to 10, and is clamped only by the number of
  ranked capabilities.
- The retriever computes the full positive-signal ordering so required skills beyond
  K still receive a diagnostic rank.
- The reranker is an explicit identity/no-op stage. It copies retrieval score and
  rank and must not manufacture a second scoring algorithm or cause a cutoff.
- Rank `<= K` appears in `capabilityTopK` and keeps `disappearedAt: null`; SRS-1's
  `RETAINED` value remains reserved for a later final-resolution stage. Rank `> K`
  produces the new private `TOP_K_CUTOFF` stage with `BELOW_TOP_K`.
- A legacy metadata-admission failure or zero-signal result produces
  `RETRIEVAL_CUTOFF`.
- `RERANK_CUTOFF` remains reserved for a future phase that introduces a real reranker;
  SRS-2 must not describe identity-rerank truncation as reranker rejection.
- Supervisor, modifier-selection, and final-resolution fields stay `null`/not run.

### 6. Development corpus boundary

Retrieval metrics use only exposed, already-versioned development evidence:

- 21 Phase 4 scenarios, with fixed action and `SkillContext` derived through the
  existing deterministic Phase 3/4 policy;
- 32 Phase 8 selection scenarios, which already contain fixed `SkillContext` values
  and explicit evaluation catalog provenance.

This produces 53 runnable development cases before deduplication/group accounting.
Scenario-family IDs remain attached so translated/paraphrased variants cannot later
be mistaken for independent held-out evidence.

The 210 examples remain canonical **authoring** evidence with
`PENDING_HUMAN_REVIEW` status unless an explicit governed approval changes that state.
They are audited for IDs, kinds, action/language, review status, and
required/acceptable/forbidden label integrity, but are not included in retrieval
metrics in SRS-2 because they lack normalized situation/intent tags. The harness must
not infer those tags from expected skill IDs—that would leak labels into retrieval.
Adding independently reviewed routing annotations for those examples would require a
separate plan update and approval. No held-out file is created or read.

## Private contracts and data flow

The exact names may adjust during implementation, but the private structure must
preserve this information:

```ts
type Srs2ShadowConfig = {
  mode: "LEGACY_METADATA_GATE" | "SIGNAL_ONLY";
  topK: number; // default 10
  catalogScope: "PRODUCTION" | "PRODUCTION_PLUS_EVALUATION";
};

type Srs2TopKEntry = {
  id: string;
  version: number;
  definitionType: "ATOMIC" | "PLAYBOOK";
  retrievalScore: number;
  rank: number;
  matchedFeatureReasonCodes: Array<"INTENT_MATCH" | "SITUATION_MATCH">;
};

type Srs2ShadowResult = {
  config: Srs2ShadowConfig;
  capabilityTopK: Srs2TopKEntry[];
  capabilityTraces: SrsCandidateTrace[];
  modifierEligibilityTraces: SrsCandidateTrace[];
};
```

Data flow:

```text
Exposed development scenario + fixed AgentAction
        ↓
Explicit production/evaluation catalog scope
        ↓
Private catalog entries with authoring definition kind
        ↓
Hard eligibility (all entries traced)
        ↓
Separate capability and modifier lanes
        ↓
Legacy metadata gate OR signal-only admission
        ↓
Capability score + stable full rank
        ↓
Identity rerank + configurable Top-K (default 10)
        ↓
Metrics, per-required rank, production comparison, failure classification
```

Extend the private SRS-1 ranked-stage schema to include matched-feature reason codes
and add only the closed reason codes needed for observable SRS-2 decisions, including
`INTENT_MATCH`, `SITUATION_MATCH`, legacy intent/situation admission failure, and
`BELOW_TOP_K`. Extend the private disappearance-stage enum with `TOP_K_CUTOFF`.
Do not add free-text rationale or hidden reasoning.

Eligible modifier traces stop after eligibility. Their retrieval/rerank fields remain
`null`, and their disappearance remains unset until a later modifier-selection phase;
ineligible modifiers disappear at `HARD_ELIGIBILITY`. This makes “not selected yet”
distinct from “failed eligibility.”

## Metrics and failure taxonomy

Report metrics independently for each retrieval mode and for K=5, K=10, and the
configured K. Partition expectation labels by authoring kind before scoring; modifiers
never count toward capability metrics.

Let `R_s` be required capabilities for scenario `s`, and `T_s(K)` its capability
Top-K.

| Metric | Definition |
| --- | --- |
| Recall@K | Micro recall: `sum_s |R_s ∩ T_s(K)| / sum_s |R_s|`, over scenarios with required capabilities |
| Required-skill coverage@K | Macro mean of `|R_s ∩ T_s(K)| / |R_s|` across scenarios with required capabilities |
| All-required-found@K | Fraction of scenarios with non-empty `R_s` where `R_s ⊆ T_s(K)` |
| Per-required-skill rank | One row per required occurrence: full rank or `null`, plus disappearance stage and reason code |
| Per-acceptable-skill rank | One diagnostic row per acceptable capability occurrence: full rank or `null`, plus disappearance stage and reason code; never included in recall denominators |
| Strict NONE pass rate | Fraction of `strictNone` scenarios whose capability Top-K is empty |
| Forbidden-in-Top-K rate | Forbidden capability occurrences found in Top-K divided by all forbidden capability occurrences |

For every scenario and retrieval mode, also record:

- `hardEligibleCount`: capabilities that pass all true hard gates;
- `positiveSignalCandidatePoolCount`: hard-eligible capabilities admitted to the
  positive-signal ranked pool after the selected intent/situation policy; and
- `topKCount`: returned capabilities, equal to
  `min(K, positiveSignalCandidatePoolCount)`.

Aggregate each pool count with scenario count, minimum, maximum, arithmetic mean,
median (p50), and p90 for each retrieval mode and K. Also report diagnostic counts by
language, action, scenario family, catalog, and assistance mode. Small cells are
descriptive only; no statistical significance or generalization claim is made from
this exposed synthetic development set.

For each missing required capability, assign exactly one earliest failure class:

1. `ELIGIBILITY_FAILURE`: failed a true hard gate;
2. `RETRIEVAL_FAILURE`: passed hard gates but was rejected by legacy metadata
   admission or had no positive retrieval signal;
3. `RANKING_FAILURE`: received a positive score/rank but fell below K at
   `TOP_K_CUTOFF`;
4. `FOUND`: present in Top-K.

If a required capability is in shadow Top-K but absent from production's selected
set, report `DOWNSTREAM_SELECTION_DIFFERENCE`; do not call it a retrieval failure and
do not implement the downstream stage in SRS-2.

## Production comparison

For every Phase 4 production scenario, run the unchanged
`createSkillEngine(initialSkillRegistry).select(context)` alongside both shadow modes.
Record separately:

- production-selected capabilities;
- production-selected modifiers;
- shadow capability Top-K;
- eligible modifier IDs (diagnostic only);
- required IDs found/missed and their failure class;
- production-required misses recovered by shadow retrieval; and
- shadow-retrieved required IDs not selected by production.

Top-K is a broad candidate pool, so extra Top-K items are not automatically production
false positives. Forbidden-in-Top-K and strict `NONE` diagnostics provide the relevant
boundary signal. The report must not compare the four-item production selection and
ten-item shadow pool as though they served the same purpose.

Phase 8 scenarios run only in the explicit evaluation overlay and are excluded from
claims about current production behavior.

## Implementation steps

1. **Reconfirm and guard the baseline.**
   - Re-run SRS-1, 21-definition, 210-example, 153-plan, candidate-isolation, Phase 4,
     and dirty-worktree evidence checks before editing.
   - Record the pre-SRS-2 status so unrelated existing changes remain untouched.

2. **Extend private trace contracts.**
   - Update `packages/skills/tests/srs1-foundation.ts` only where necessary for ranked
     matched-feature codes and SRS-2 result/config/metric schemas.
   - Add invalid-state tests without moving these types into shared contracts.

3. **Build a typed shadow catalog adapter.**
   - Add an SRS-2 private helper under `packages/skills/tests/`.
   - Load production definition kinds from validated authoring records.
   - Construct the revision-bound Phase 8 evaluation overlay only on explicit scope.
   - Prove default scope cannot observe evaluation definitions.

4. **Implement hard eligibility and lane partitioning.**
   - Reuse the existing language-family rule without importing production selection
     results as an oracle.
   - Trace every catalog entry and keep capability/modifier arrays disjoint.
   - Do not execute free-text authoring guidance.

5. **Implement both retrieval modes and Top-K.**
   - Add the fixed coarse `12/10` intent/situation score, stable ID ties,
     positive-signal floor, diagnostic full rank, identity rerank, configurable K,
     and `TOP_K_CUTOFF` disappearance semantics.
   - Verify repeated inputs and reordered catalog input produce identical results.

6. **Adapt the exposed runnable development cases.**
   - Derive Phase 4 contexts through existing deterministic policy code in the root
     evaluation harness, then partition expected labels using the authoring kind map.
   - Adapt Phase 8 selection fixtures with explicit evaluation scope.
   - Audit—but do not infer missing routing tags for—the 210 canonical authoring
     examples, and preserve their pending-review classification.

7. **Add metrics and comparison reporting.**
   - Add a credential-free `scripts/evaluate-srs-2.ts` and root `eval:srs2` command.
   - Emit concise content-free console summaries and a deterministic machine-readable
     development report fixture, including per-scenario pool counts, aggregate
     pool-size statistics, and required/acceptable ranks. Do not log conversation
     text, drafts, or rationale.
   - Write `docs/skills/srs-2-shadow-retrieval.md` with both-mode tables, per-required
     failures, strict `NONE`, corpus limitations, and the production comparison.

8. **Verify scope and stop.**
   - Run focused and full validation.
   - Confirm production files/exports/registry behavior remain byte-for-byte or
     behaviorally frozen as appropriate.
   - Update this plan's completion record and stop for SRS-3 approval.

## Tests and evaluation

Focused deterministic tests must cover:

- each hard gate independently and multiple simultaneous failures;
- non-wording actions yielding an empty capability pool;
- English, Simplified Chinese, Traditional Chinese, regional tags, unsupported
  primary language, and valid/invalid code switching;
- catalog isolation in both directions and explicit evaluation-overlay activation;
- capability/modifier lane separation;
- legacy two-dimension admission versus partial-match signal-only admission;
- zero-signal exclusion and strict `NONE` in wording and non-wording scenarios;
- exact `12/10` scores, matched-feature codes, stable tie order, and input-order
  independence;
- K=1, K=5, default K=10, K greater than catalog size, and invalid K;
- full ranks beyond K, null disappearance for Top-K entries, correct
  `RETRIEVAL_CUTOFF`/`TOP_K_CUTOFF` stages, and no SRS-2 `RERANK_CUTOFF`;
- identity rerank preserving score/rank exactly;
- micro Recall@K, macro coverage@K, all-required-found@K, per-required rank,
  per-acceptable diagnostic rank, forbidden-in-Top-K, and strict `NONE` formulas on
  hand-computed probes;
- per-scenario hard-eligible, positive-signal-pool, and Top-K counts plus exact
  aggregate min/max/mean/p50/p90 calculations;
- required, acceptable, and forbidden modifier labels never affecting capability
  metrics;
- no hidden rationale field and no raw message/draft in traces or reports;
- unchanged 21/153 production parity and inactive candidate isolation.

The deterministic development evaluation must report both retrieval modes over the
same revision-bound cases. No live or manual provider evaluation is part of SRS-2.

## Acceptance criteria

- [x] `SkillEngine.select()` output remains exact for all 153 frozen plans and the 21
      Phase 4 regression scenarios.
- [x] No production source, public export, shared contract, generated registry, or
      provider prompt changes.
- [x] Every catalog entry receives an eligibility trace; each failure has a closed
      reason code and earliest disappearance stage.
- [x] No modifier appears in capability retrieval, Top-K, ranks, or capability metrics.
- [x] Evaluation-only definitions are unreachable in default production scope and
      available only through the explicit revision-bound overlay.
- [x] Capability Top-K is configurable and defaults to 10; scores are documented and
      emitted only as deliberately coarse diagnostic ranking signals. SRS-3 owns
      ranking improvement.
- [x] Every ranked capability has score, full rank, matched-feature codes, identity
      rerank rank, Top-K membership, and correct null/cutoff disappearance state.
- [x] Recall@5, Recall@10, required-skill coverage@K, all-required-found@K,
      per-required-skill rank, strict `NONE`, and forbidden-in-Top-K are reported for
      both modes.
- [x] Acceptable-skill ranks are reported diagnostically but never added to required
      recall denominators.
- [x] Each scenario records hard-eligible, positive-signal candidate-pool, and Top-K
      counts; each mode reports min/max/mean/p50/p90 pool-size statistics.
- [x] Every required miss is classified as eligibility, retrieval, or ranking failure;
      downstream production-selection differences remain separate.
- [x] The report explicitly compares legacy intent/situation admission with signal-only
      retrieval without changing production behavior or declaring a winner silently.
- [x] Only exposed development evidence is used; the held-out corpus remains
      `NOT_AUTHORED`, unsealed, unread, and unscored.
- [x] The 210 canonical examples are not converted into routing metrics through label
      leakage and remain labeled canonical authoring evidence/pending review unless
      their governed approval state explicitly changes.
- [x] The completion report states corpus limits and makes no production, confidence,
      probability, or generalization claim.

## Validation commands

Run, in this order:

```text
pnpm exec vitest run packages/skills/tests/srs1-foundation.test.ts packages/skills/tests/srs2-shadow-retrieval.test.ts
pnpm eval:srs2
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

The SRS-2 report must record exact commands, exit results, scenario counts, catalog
digests, K values, and metric outputs. Default validation requires no credential and
makes no network call.

## Privacy and data handling

- Use only synthetic, checked-in development fixtures.
- Do not log message bodies, drafts, improved wording, free-text rationales, prompts,
  or provider payloads.
- Machine-readable reports contain fixture/scenario IDs, catalog/revision IDs, action,
  language category, definition IDs/versions/types, scores, ranks, closed reason codes,
  stages, and aggregate metrics only.
- No data persists outside revision-bound repository artifacts, and no provider or
  application service receives content.

## Risks, rollback, and limitations

- **Label leakage:** deriving tags from expected skills would make metrics circular.
  Keep canonical examples out of routing metrics until independently annotated.
- **Shadow activation confusion:** evaluation-overlay activation could be mistaken for
  production promotion. Require explicit catalog scope, source digest, trace
  provenance, and isolation tests.
- **Top-K false-positive interpretation:** Top-K is retrieval breadth, not final
  selection. Report forbidden presence and strict `NONE`, but defer selection quality
  to SRS-3.
- **Small exposed corpus:** 53 runnable synthetic cases cannot establish generalization
  or production thresholds. Report descriptive results only.
- **Parallel-selector drift:** private shadow code may duplicate current logic. Limit it
  to eligibility/retrieval, freeze production parity, and remove it cleanly if SRS-3
  chooses a different reviewed boundary.

Rollback removes only SRS-2 private helpers, tests, fixtures, evaluation script/command,
report, and trace extensions. Never reset or overwrite unrelated dirty-worktree changes.

## Gate after SRS-2

Stop after the deterministic report. SRS-3 may begin only after the user reviews:

- both-mode Recall@5/10 and multi-required coverage;
- strict `NONE` and forbidden Top-K behavior;
- every required eligibility/retrieval/ranking failure;
- the production-versus-shadow comparison;
- evaluation-overlay isolation; and
- whether intent/situation metadata should remain admission gates or become ranking
  evidence.

## Progress and completion record

- 2026-09-24: Initial SRS-2 outline created, blocked on SRS-1.
- 2026-09-27: User approved SRS-1 and requested an implementation-ready SRS-2 plan
  limited to hard eligibility, shadow retrieval, and Top-K diagnostics.
- 2026-09-27: Plan refined after inspecting the current selector, private SRS-1 trace,
  authoring-kind metadata, exposed fixtures, package boundaries, and evaluation flow.
  Implementation had not started.
- 2026-09-27: User approved SRS-2 with five amendments: add `TOP_K_CUTOFF`, keep rank
  diagnostic and defer improvements to SRS-3, preserve the 210 examples as pending
  canonical authoring evidence, add pool-size diagnostics, and surface acceptable
  ranks outside required recall denominators. Implementation is authorized for SRS-2
  only.
- 2026-09-27: SRS-2 implementation completed in the private evaluation boundary. The
  deterministic 53-scenario report compares both retrieval modes at K=5 and K=10,
  preserves all 210 canonical examples as pending authoring evidence, records pool
  breadth and acceptable-skill ranks, confirms the unchanged 21-definition/153-plan
  production baseline and 21 Phase 4 scenarios, and leaves SRS-3 unstarted pending
  user review. See `docs/skills/srs-2-shadow-retrieval.md`.
