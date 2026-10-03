# SRS-3F-B — pure admission-free semantic Top-K candidate retrieval

Status: **exposed implementation/evaluation complete — predeclared forbidden@3 gate FAIL; stopped before challenge**  
Owner: Codex  
Started: 2026-09-30  
Updated: 2026-09-30  
Roadmap: [skills retrieval/selection direction](skills-retrieval-selection-direction.md), SRS-3 shadow retrieval; follows the [SRS-3F-A failed operation experiment](../../docs/skills/srs-3f-a-operation-layer.md)

## Outcome, scope, and stop point

Answer one question in **evaluation-only shadow mode**: with semantic admission removed, do the frozen positive skill profiles place required **ATOMIC** skills in a bounded Top 3/5/10 often enough to justify a later Supervisor experiment? B produces candidates and content-free traces, **not** `NONE`, final skills, a `SkillPlan`, guidance composition, or a reply. It does not implement or consume CommunicationOperation detection or support mappings. It does not revise A, retune SRS-3E, run the frozen challenge in this increment, change production, call a provider, add BM25/ANN/vector DB, or implement SRS-4.

The stop point is an exposed-development B report plus an immutable **proposed** B config, followed by human review and separate approval before any one-shot frozen challenge. The 2026-09-30 approval authorized implementation of this B slice only; it did not authorize opening the challenge or production changes.

## Current state and frozen dependencies

The approved production package has 21 ACTIVE definitions: 14 atomic capabilities and seven language modifiers; [`SkillEngine.select()`](../../packages/skills/src/engine.ts) still selects 0–4 after deterministic metadata filters, and 153 frozen plans remain unchanged. The historical [SRS-3E scorer](../../packages/skills/tests/srs3e-semantic-retrieval.ts) validates `alpha ∈ {0, .2, .35}` and a 0.30–0.75 admission threshold, and exposes **pre-threshold** scores/ranks for every hard-eligible atom. Its query builder keeps USER_DRAFT, SELECTED_GOAL, recent OTHER_MESSAGE and USER_HISTORY separate. The selected local MiniLM model, profile source and positive vectors are already frozen; the [SRS-3E-v2 exposed diagnostic](../../docs/skills/srs-3e-rewrite-source-dominance.md) established that bounded rewrite source boosts did not help while P087 remained fixed. The [SRS-3F-A audit](../../docs/skills/srs-3f-a-operation-layer.md) failed quality/ownership gates, so all operation artifacts are excluded from B's imports and inputs.

Inspect-and-reverify baseline bindings before B scoring:

| Evidence/component | Existing SHA-256 or fixed value | B treatment |
| --- | --- | --- |
| Skill semantic-profile artifact | `b061bf17a04e696ad78af45016e6803a96f79f0e617fcb2800a4a591fbc33d1c` | Read-only, 14 ATOMIC profiles; seven modifiers remain separate. |
| Positive-profile vectors | `b02d4664585c29d3a0ac33e41c6827d2bd4d5d065fd7eb289182084c6dc05588` | Reuse exact bytes, dimensions, profile/definition digests. |
| Corrected exposed-control freeze | `bcb55ca5ee19973e974550c75a06892e58cfa8f0bc9380efcfce790eb25e0f8a` | Read-only exposed development, not challenge. |
| SRS-3E source-aware scorer/serializer file | `f436123a66faf591c8b88263d8b5d790528b1ceb61c79c0db64cedd433cde6a5` | Recompute actual file digest at implementation; bind exact serializer/scoring revision. |
| Pinned model | `Xenova/all-MiniLM-L6-v2`, revision `751bff37182d3f1213fa05d7196b954e230abad9`, local int8 CPU/384D, file hashes in [`srs3e-semantic-model.ts`](../../packages/skills/tests/srs3e-semantic-model.ts) | No model download, replacement, profile re-embedding, or paid call. |
| Frozen SRS-3E challenge | `4cd2a78487b0d59c67d97bfe672219f9ff19c9913d079372b2324dbb80a87b84` | Preserve binding without reading, embedding, scoring, or joining rows now. |

The 53 fully labeled **exposed** English rows (29 accepted SRS-3B plus 24 corrected controls) contain 37 positive scenarios, 46 required occurrences, 14 explicitly forbidden occurrences, and 16 strict-NONE rows. Of the NONE rows, 13 are wording actions and three `NO_REPLY_NEEDED` structural empties. Existing alpha-zero pre-admission diagnostics—not a new B result—show required rank coverage of **22/46 @3, 26/46 @5, 38/46 @10**, including rewrite **10/27 @3, 13/27 @5, 20/27 @10**. All 14 atomic skills have at least one exposed required hit at rank ≤10, but some have only one or two required examples. Nine exposed scenarios have multiple required skills; six have all inside rank 10, and all nine have at least one. There is no qualified **positive** `COMPLETE_DRAFT` requirement in these 53 rows; report that slice as untested, not zero recall.

These exposed ranks explain the proposed viability floor below; they are not a claim that B improves the underlying MiniLM ordering. Older 18/52 and 19/52 deterministic counts are from the **different protected challenge** and must not be treated as comparable exposed baselines or used to set B's exposed thresholds.

## Architecture decisions, query, and hard gates

Use the smallest previously supported query representation: **existing `sourceAwareQuery()` with `alpha=0` primary-max scoring**. For `REWRITE_DRAFT`/`COMPLETE_DRAFT`, a nonempty USER_DRAFT is primary; an explicit selected goal, if present, is also primary, and the best primary match wins per skill. The last two OTHER turns and last two USER-history turns remain ordered, separately attributable **context traces**, but contribute zero to the B score. For `SUGGEST_REPLY`, an explicit SELECTED_GOAL is primary; without one, the existing serializer treats the latest OTHER turn as a **retrieval fallback**, recorded as OTHER-sourced rather than as a user-declared intent. This fallback may surface candidate expertise, but cannot authorize a factual claim, refusal, apology, or commitment. No concatenation, paraphrase, new weighting grid, source-dominance revision, or intent-tag translation is introduced.

For each positive profile fragment (`job`, individual `useWhen`, individual `semanticTriggers`), compute the existing normalized cosine score against each query fragment; take the best positive-profile match per primary source, then the best primary score per eligible skill. Keep winning field/ordinal/source and all per-source maxima. `whenNotUse`/neighbor text are **not** positive vectors, and no negative-profile penalty exists. A raw score may be low or negative and still gets ranked; it is relevance, **not confidence**.

Hard eligibility is exactly structural: catalog must be `PRODUCTION`, definition `ACTIVE`, fixed upstream `AgentAction` supported, language supported under current universal/primary/eligible code-switch rule, and definition kind `ATOMIC` for the capability lane. Existing structured code-switch prerequisite remains for modifiers in their separate lane. Do **not** hard-filter by intent, situation, operation, score, relative spread, or a generated label. `SUGGEST_ACTIONS`, `ASK_CLARIFICATION`, and `NO_REPLY_NEEDED` return structurally empty capability lists. The frozen English-only model's unsupported-language/code-switch and empty-query outcomes remain explicit **unscored** statuses, never semantic `NONE` successes.

The SRS-3E API always computes threshold admission, so B should add a small **separate private shadow scorer** under `packages/skills/tests/`, reusing its serializer, pinned model adapter, production-catalog loader, frozen vectors and score formula; it must not call v1's admitted pool or pass a fake threshold. Duplicate no registry or profile source. Prove exact score/source/rank/eligibility parity against SRS-3E **pre-admission** traces on exposed rows and focused fixtures before treating B output as valid. If exact parity would require changing frozen SRS-3E behavior or vector bytes, stop for a design review rather than silently refactor historical evidence.

## Ranking, Top-K, and future-Supervisor candidate contract

Score **every** hard-eligible ATOMIC skill for a supported wording query; sort descending by score with the existing stable skill-ID tie-break. Retain the full eligible rank (currently at most 14) for diagnostics, then expose its Top 3, Top 5, and Top 10 prefixes; if fewer than K are eligible, return only those present, never pad. At 14 atoms, Top 10 is a broad **bounded retrieval pool**, not an assertion that ten skills should be used. Language modifiers cannot occupy these slots; retain separate eligibility traces only, without starting modifier-semantic ranking.

Proposed **private Zod-first** candidate/result shapes; names are illustrative, but the fields and semantics are required:

```ts
type Candidate = {
  skillId: string; lane: "ATOMIC";
  semanticScore: number; semanticRank: number; // rank among all hard-eligible atoms
  winningProfileField: "job" | "useWhen" | "semanticTriggers";
  winningProfileOrdinal: number;
  winningSourceType: "USER_DRAFT" | "SELECTED_GOAL" | "OTHER_MESSAGE" | "USER_HISTORY";
  perSourceScores: { source: string; ordinal: number; role: "PRIMARY" | "CONTEXT"; score: number }[];
  eligibilityTrace: { hardEligible: true; reasonCodes: string[] };
  definitionRevision: number; semanticProfileRevision: number;
  definitionDigest: string; profileDigest: string; vectorArtifactDigest: string;
};
type Observation = {
  fixedAction: AgentAction;
  status: "RANKED" | "STRUCTURAL_EMPTY" | "EMPTY_QUERY" | "MODEL_UNSUPPORTED_LANGUAGE";
  fullEligibleRanking: Candidate[]; top3: Candidate[]; top5: Candidate[]; top10: Candidate[];
  hardEligibilityTraces: { skillId: string; eligible: boolean; reasonCodes: string[] }[];
  eligibleModifiers: { skillId: string; eligibilityReasons: string[] }[];
  hardEligibleCount: number; configAndSourceDigests: string[];
};
```

No `confidence`, `selected=true`, `NONE`, operation support, final weight, composed guidance, or generated text. The later Supervisor will also need request-scoped validated evidence to judge user intent, ownership and factual certainty; candidate IDs/scores alone are insufficient. B neither persists real-user raw text nor defines the Supervisor API/algorithm.

For every required skill, join labels **after raw scoring** and record structural eligibility, raw score (or null with explicit unscored status), full eligible rank, membership in Top 3/5/10, and a view-specific missing reason. `HARD_ELIGIBILITY` and `EMPTY_QUERY`/`MODEL_UNSUPPORTED_LANGUAGE` are objective pre-ranking outcomes. Among scored skills, rank >3, >5, or >10 yields `TOP_3_CUTOFF`, `TOP_5_CUTOFF`, or `TOP_10_CUTOFF`; rank >10 is also a `SEMANTIC_RANK_MISS` audit diagnosis. `PROFILE_BOUNDARY_GAP`, `SKILL_BOUNDARY_AMBIGUITY`, `BAD_EVAL_LABEL`, and `MODEL_LIMITATION` require reviewed interpretation, never automatic blame. **No `ADMISSION_REJECTED` or semantic-threshold stage exists in B.**

## Evidence, metrics, NONE interpretation, and comparison

Start with the same exact 53 exposed English raw/annotation/review bindings and revision qualifications used by SRS-3E-v2. Do not import the 210 authoring examples as approved ranking gold, promote SRS-3F-A provisional operation labels, or use target-only D01–D68 negatives as full-catalog forbidden judgments. D01–D68 may be a **separate** target-specific diagnostic; do not pool denominators. If implementation adds independently reviewed exposed completion cases, assign a new corpus ID and report them separately; they must not silently change the original 46-occurrence denominator or serve as new skill-profile text.

Primary metrics on fully labeled exposed rows: micro required Recall@3/5/10; per-skill required occurrences and hits at each K for all 14 atoms; macro within-scenario required coverage; all-required-found@K; for the nine multi-required cases, at-least-one, exact required found count, all/both found, and maximum required rank. Report rewrite, suggest and complete separately, with **complete positive coverage marked N/A** until qualified cases exist. Secondary: MRR, required-rank distribution, primary-skill rank and pairwise order only where label lineage explicitly supports it. Do not optimize rank #1 as final skill selection.

For every explicitly forbidden and acceptable skill, report full rank and Top 3/5/10 membership, including highest-ranked forbidden neighbor. Unlabeled skills remain **unlabeled**, not unsupported. A forbidden skill appearing low in a broad pool is a risk signal, not an observed final-selection failure; a safety/ownership-critical forbidden skill at rank 1 still requires explicit review.

On the 13 **wording** strict-NONE rows, report nearest Top 3/5 IDs, scores/spread, source ownership and labeled forbidden/acceptable presence. Candidate non-emptiness is **expected and not an error**; no empty-pool target is imposed. On the three existing `NO_REPLY_NEEDED` rows, require structural empty capability output; apply the same rule to any other qualified non-wording rows. An unsupported-language/empty-query result is an abstention/error-state diagnostic, not a correct semantic NONE. Never rewrite historical SRS-3E NONE metrics to match this new contract.

For historical comparison, rerun SRS-2.5 and SRS-3D-A **read-only** on the exact same qualified exposed raw rows/fixed actions and apply the same required/acceptable/forbidden labels **only if** their evaluators can do so without altering their algorithms or labels. Otherwise show `NOT_COMPARABLE` with precise lineage reason. Separately show SRS-3E alpha-zero **pre-admission** ranks and require B parity; do not compare B's full Top 10 to SRS-3E's sparse admitted pool as if both decide NONE. Known challenge aggregate baselines (18/52, 19/52) remain background context, not same-corpus exposed comparisons.

## Predeclared exposed viability and STOP gates

The exposed corpus has 46 required occurrences, 27 rewrite requirements, 37 positive scenarios, nine multi-required scenarios, 14 explicitly forbidden occurrences, and 14 atomic skills with at least one required row. The following thresholds are **predeclared from that exposed evidence and candidate-recall purpose**, not from unseen semantic challenge outcomes:

| Gate | PASS on original 53 exposed rows | If missed |
| --- | --- | --- |
| Overall required presence | Recall@10 **≥38/46**, @5 **≥26/46**, @3 **≥22/46** | STOP; B regressed below the already observed frozen alpha-zero ranking signal. |
| Rewrite presence | `REWRITE_DRAFT` @10 **≥20/27**; always report @3/@5 and all rank>10 misses | STOP; aggregate success cannot mask rewrite failure. |
| Capability breadth | **14/14** with ≥1 required hit @10; **12–13/14** is `PARTIAL`; ≤11 is `FAIL` | No challenge on PARTIAL/FAIL without a separately approved exception. |
| Multi-required | ≥**6/9** all/both found @10 and **9/9** at least one found | STOP; a later Supervisor cannot recover absent second skills. |
| Positive-scenario completeness | ≥**29/37** all required found @10 | STOP; prevents high micro recall hiding many half-recovered cases. |
| Severe forbidden neighbors | Explicitly forbidden at rank 1 **≤2/14**, forbidden@3 **≤6/14**, and **zero independently confirmed intent/ownership-critical rank-1 errors**; report @5/@10 without an empty-pool target | STOP for review if exceeded; broad Top 10 alone is not a final-selection verdict. |
| Structural/correctness isolation | Every applicable non-wording case empty; no unsupported-language case silently scored; exact parity with SRS-3E pre-admission scores/ranks; deterministic Top-K/ties; zero operation-artifact dependency; no production diff | STOP and repair B without opening challenge. |

The @3/@5/@10 floors intentionally preserve an already observed ranking baseline rather than pretending removal of admission changes MiniLM's ordering. They are a **minimum viability/no-regression gate** before risking the protected challenge, not evidence of generalization. The forbidden limits are conservative candidate-stage sentinels on 14 explicit labels; they must be approved **before** B scoring and cannot be adjusted after seeing B outcomes. If an exposed gate fails, or a required skill is systematically below rank 10, publish `PARTIAL`/`FAIL` and stop semantic retrieval work for review; do not retune K, profile text, source weights, model or admission against the challenge. If the corpus lacks qualified labels for a slice, state `NOT_EVALUABLE`, not a fabricated pass.

## Implementation increments, freeze, and later challenge gate

1. **Boundary and bindings.** Reverify hashes in the table, exact 21/14/7 production catalog and 153 frozen plans; load approved exposed raw/label/review manifests by revision. Freeze B's `alpha=0` source policy, field serialization, cosine and skill-ID tie rule. Write a new B implementation plan progress entry before scoring if any material boundary differs.
2. **Pure private scorer.** Add `packages/skills/tests/srs3f-semantic-topk.ts` (or a similarly named evaluation-only module) and focused tests. Score all structurally eligible atomic skills; return full rank and Top 3/5/10. Reuse existing profile vectors/model/catalog/query serializer without changing v1 SRS-3E, canonical YAML, production registry, contracts or operation code. Verify parity against v1 pre-admission traces; prove output is independent of v1's threshold/admission results.
3. **Exposed observation.** Add a versioned evaluator under `scripts/` and content-free evidence under `packages/skills/tests/fixtures/srs3f/`, with a Markdown report under `docs/skills/`. Score raw-only, then join qualified labels. Report exact per-skill counts, mode/multi/NONE/forbidden slices and `NOT_COMPARABLE` historical lanes as needed. Keep modifier eligibility separate.
4. **Freeze B proposal.** Regenerate artifacts twice and `--check`; bind model file hashes/revision, frozen positive vector/profile and definition digests, query serializer/scorer source digest, `alpha=0`, tie rule, K prefixes, hard-gate policy, catalog revision, exact exposed evidence provenance/reviewer status, metrics/thresholds and content-free trace hash into a new immutable **proposed** B config. Do not silently replace SRS-3E or A artifacts.
5. **Review and stop.** Obtain real human review of exposed failures, forbidden ranks, source ownership, labels/qualifications and the exact freeze. Even a B exposed PASS is **not** challenge authorization. A separate user approval is required for a one-shot frozen challenge comparison. No operation fusion or Supervisor follows automatically.

Only a later approved challenge turn may verify the unchanged challenge freeze, run **one** raw-only observation with pre-frozen B and read-only deterministic comparators, then join labels, report required Recall@3/5/10 and all the safety/breadth/multi slices. The previously proposed challenge targets (40/52 required @10, 14/14 breadth, multi 6/10, all-required 30/42, structural emptiness) must be accepted or amended **before** observation; forbidden/score-spread interpretation must likewise be predeclared. No post-challenge tuning may be presented as the first run. Passing candidate retrieval plus human review would justify **planning** SRS-4 Supervisor, not implementing or deploying it. A Supervisor then needs separate selection/NONE/conflict/composition and end-to-end preservation evaluation.

## Tests, validation, privacy, and rollback

Focused tests must cover all hard gates; action/language/code-switch and catalog isolation; ATOMIC/modifier separation; 14-score completeness and Top-K prefix/stable ties; low or negative scores retained; historical pre-admission parity; no `ADMISSION_REJECTED` or operation import/dependency (including an isolated run with A artifacts unavailable); query ownership and OTHER-only fallback attribution; unsupported/empty-query statuses; structural vs wording NONE; content-free traces; per-required disappearance stage; per-skill/multi/forbidden metric denominators; freeze-drift rejection and deterministic artifact bytes. No live-provider test is in CI. Run focused SRS-3F-B and existing SRS-3E/D/C/B/A/SRS-2/2.5 tests, then `pnpm skills:check`, `pnpm skills:verify-production` after `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm format:check`, and `git -c core.safecrlf=false diff --check`.

Only synthetic evaluation inputs and their revision-bound annotations may be stored. Real screenshots, messages, drafts, user history, identities and query embeddings are never persisted or logged. The B evidence artifact contains IDs, fixed action, source types/ordinals, eligibility, scores/ranks, digests and closed diagnostics—no raw text. The future Supervisor requires a separate privacy/placement review for request-scoped evidence. The rollback target is only newly added B shadow code/evidence; preserve prior SRS-3E/A frozen artifacts and the 21 ACTIVE runtime definitions. If source/model/vector binding drifts, stop and open a new experiment ID rather than overwriting.

At 14 atoms, flat exact scoring is trivial. The candidate schema preserves stable skill IDs and source/profile digests for a future 100/300/~1,000-skill benchmark. Measure latency and memory first; add caching or ANN/family routing only after measured need, with flat-fallback recall parity. No vector database or skill tree in B.

## Progress log and completion record

- 2026-09-30: Read the supplied SRS-3F-B plan-only brief, repository guidance, product/privacy docs, SRS-3E query/scorer and exposed rewrite diagnostic, and failed SRS-3F-A report. Recomputed **only exposed** 53-row pre-admission rank/breadth/multi/NONE counts from the prior admission-retest artifact; did not open or score the frozen challenge. Chose frozen `alpha=0`, a separate no-admission scorer, explicit candidate contract, same-corpus comparisons and exposed viability gates.
- 2026-09-30: User approved B implementation with `alpha=0`, frozen ranking, no admission, no operations, exposed-only evaluation and a stop before challenge. Added private Zod-validated shadow scorer, focused tests, exposed evaluator, content-free trace, proposed config, and [report](../../docs/skills/srs-3f-b-semantic-topk.md). Exact parity against SRS-3E pre-admission scores, sources and ranks held for all 53 exposed cases. Required coverage was 22/46 @3, 26/46 @5, 38/46 @10; rewrite 20/27 @10; breadth 14/14. The predeclared forbidden@3 limit **failed** at 7/14 versus ≤6/14. Both rank-1 forbidden occurrences require human ownership/intent review. No threshold, source policy, model, profile, vector, production registry or routing change was made.

## Completion record and stop decision

The B code and exposed evaluation are implemented, but **B acceptance is not achieved** because forbidden@3 exceeded its predeclared gate. The proposed config is frozen for audit, **not** approved for challenge or deployment. Machine trace SHA-256: `3da194a50d46c33c26b5dcaa2f59ce7d33eb03d4352e5eefc706d9241e6ed214`; proposed config SHA-256: `4f3f94e0b2089c9bb7a8e8c3a83c697b7df3d9f3c4c0c14b4c00ac0d4518327b`. The evaluator's `--check` reproduces both hashes. No frozen challenge was read or scored; no operation fusion, Supervisor, provider call, or production edit was made.

Validation: `pnpm test -- packages/skills/tests/srs3f-semantic-topk.test.ts` **3 passed**; `pnpm test` **46 files/522 tests passed**; `pnpm lint` (including `skills:check`), `pnpm typecheck`, `pnpm build`, `pnpm skills:verify-production`, `pnpm format:check`, `git -c core.safecrlf=false diff --check`, and `node --conditions=development --import tsx scripts/evaluate-srs3f-semantic-topk.ts --check` all passed. Production verification confirmed **21 exact definitions, 153 ordered plans**, and authoring exclusion. Existing unrelated working-tree changes were preserved.

Next decision: human review the seven forbidden Top-3 occurrences, especially R06 and R14 at rank 1, and decide whether to reject B or explicitly authorize a revised experiment/exception. Do not run the protected challenge or begin SRS-4 under the current failed gate. Positive `COMPLETE_DRAFT`, non-English embedding, and same-raw-corpus SRS-2.5/SRS-3D-A comparisons remain unevaluated/not comparable; do not call them passes.
