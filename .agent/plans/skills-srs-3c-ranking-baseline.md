# SRS-3C — Current shadow-ordering baseline

Status: complete — approved current-ordering baseline recorded; SRS-3D gate closed  
Owner: Codex  
Created: 2026-09-28  
Updated: 2026-09-28  
Parent: [SRS-3 ranking](skills-srs-3-ranking.md)  
Predecessor: [SRS-3B corpus](skills-srs-3b-ranking-corpus.md) and its [fresh review](../../docs/skills/srs-3b-ranking-corpus-fresh-independent-review.md)  
Next gate: separately approved SRS-3D ranking improvement

## Outcome and approval boundary

SRS-3C measures the **existing** SRS-2/SRS-2.5 shadow candidate ordering on the exact reviewed SRS-3B English exposed-development corpus, before any ordering change. It produces deterministic, content-free per-scenario traces and aggregate baseline metrics, then stops. It does not recommend or implement a scorer in the metric section; a short failure-pattern handoff may inform SRS-3D later. This plan alone authorizes no baseline execution. Approval of this plan would authorize only the private evaluation artifacts and checks below, not SRS-3D, production cutover, live calls, held-out authorship, candidate activation, or final message generation.

The parent SRS-3 plan contains a historical all-in-one reranker design. For this increment its ranking-feature, relationship-sidecar, and before/after work is deferred to SRS-3D/SRS-3E. No SRS-3C implementer may use that broader parent scope as permission to alter the current ordering.

## Inspected current state and assumptions

The worktree is `C:\Users\b\Documents\ChatGPT\AI messager-skills` on branch `skills`, with retained uncommitted work. Current production has 21 ACTIVE definitions (14 universal capabilities and seven language modifiers), 153 frozen plans, `deriveSkillContext()`/`CURRENT` in `packages/ai/src/coaching-engine.ts`, and unchanged `SkillEngine.select()`. The shadow evaluator in `packages/skills/tests/srs2-shadow-retrieval.ts` applies ACTIVE/catalog/fixed-action/language/code-switch hard gates, admits positive-signal candidates in `SIGNAL_ONLY`, scores intent `+12` and situation `+10`, breaks ties by skill ID, and returns separate capability/modifier lanes. Its trace's historical `rerank` object is an **identity copy** of retrieval rank/score, not an actual reranker. `TOP_K_CUTOFF` already exists; `RERANK_CUTOFF` must not appear in this baseline.

The private `SRS_2_5_PROPOSED` normalizer in `packages/ai/src/skill-context-normalization.ts` returns both `SkillContext` and enum-valued signal provenance (`OTHER_MESSAGE`, `USER_DRAFT`, `SELECTED_INTENT`, `CONVERSATION_HISTORY`, `STRUCTURED_CONTEXT`). `observeSrs3RawOnly()` in `packages/skills/tests/srs3-ranking-corpus.ts` currently fixes `SIGNAL_ONLY`, production catalog, and Top 10, but exposes only context/result. An SRS-3C private wrapper may retain the normalization result's source codes without changing normalization or the observer's result. It must keep annotations and authoring metadata outside the normalization/retrieval call.

The frozen candidate is 41 raw scenarios in `packages/test-fixtures/src/srs3-ranking-development.ts`: 29 accepted English (14 rewrite, 14 empty-draft suggest, one no-reply), and 12 quarantined Simplified Chinese/Traditional Chinese/code-switch cases. The 29 English rows in `packages/skills/tests/fixtures/srs3/development-annotations.json` contain 18 primary-labelled scenarios, 11 pairwise edges, seven multi-required/no-order scenarios, four strict `NONE`, **32 required capability occurrences across 25 scenarios**, 12 acceptable occurrences, and five explicitly forbidden occurrences. These are corpus-denominator facts, **not measured baseline results**. Fixture-only `authoring-metadata.json` has explicitness, realism, and no runtime inputs. `source-triage.json` binds all 69 eligible SRS-3A records; the frozen SRS-3A manifest excludes the 21 matrix-overlapping lineages. The [SRS-3B fresh review](../../docs/skills/srs-3b-ranking-corpus-fresh-independent-review.md) is `PASS_WITH_NONBLOCKING_FINDINGS`, not native-language or different-human approval.

The SRS-1 private trace and SRS-2 metric schemas live in `packages/skills/tests/srs1-foundation.ts`. Reuse their validated result/trace, rank and pool-statistic conventions where appropriate; add only private SRS-3C evidence shapes. The SRS-2 `rankObservation()` currently calls a Top-K miss `RANKING_FAILURE` for some diagnostic purposes; SRS-3C needs a more precise **Top-K versus pairwise-order** taxonomy and must not silently reuse that coarse outcome name.

## Immutable SRS-3B freeze binding and pre-baseline gate

The explicit, content-addressed freeze record now exists at `packages/skills/tests/fixtures/srs3/srs3b-english-freeze.json`. Its SHA-256 is `0667d3ae16dbfe0132bb2a62ca7bc6c63e0324bf6a331e05538d6983d0f0c03e`. It binds the reviewed report digest, seven source/catalog/SRS-3A digests, the **exact 29 accepted English ID:revision pairs**, the 12 quarantined ID:revision pairs, and the labelled-denominator counts. Its policy is `NEW_REVIEW_AND_NEW_FREEZE_ID_REQUIRED`; it explicitly says baseline execution needs separate approval. This record is not a baseline report and must not be updated in place to accommodate later corpus drift. A different corpus requires a new freeze ID and review.

Before **any baseline observation or score**, recompute the freeze file's own SHA-256 and every bound artifact digest, compare exact ID/revision/state/count bindings, and stop on any mismatch. `loadSrs3Corpus()` validates several chains already; the future SRS-3C gate must additionally assert the freeze record's exact bytes/hash. If anything drifted, **STOP; do not silently regenerate the binding, redefine denominators, or evaluate**. Approval to run SRS-3C does not modify the freeze record's `SEPARATE_APPROVAL_REQUIRED` policy; authorization comes from the user's distinct approval, not a mutable field in the freeze file.

| Artifact | Required SHA-256 |
| --- | --- |
| Raw source `packages/test-fixtures/src/srs3-ranking-development.ts` | `a185d8f050e6f8dca583254ba9b0211fd843fbc24d22e4fac12354a2eb8adbe7` |
| Serialized imported raw set (`JSON.stringify` in fixture order) | `efce60f7eef73609fcdf1c4080d21e93dba43c57c1d59873c0549306bf3cbdcf` |
| `packages/skills/tests/fixtures/srs3/development-annotations.json` | `b4b8920b27c1f025c8027f785ab6c9e3b79b07af3fea05c1af4ac810529b60d6` |
| `packages/skills/tests/fixtures/srs3/authoring-metadata.json` | `08597a038d350c50580cde3addb7eef14f19f8bc97257e70b4e140dab849f3b6` |
| `packages/skills/tests/fixtures/srs3/source-triage.json` | `e513ec03da3c4cada5bdf3248224b72eba5385f16174ce8358063625886a3267` |
| `packages/skills/definitions/approved-manifest.yaml` | `f53d78d4866a386fd544e0cf3a9e3b76373e49e265c7fc9a180b866871a8eb72` |
| `packages/skills/tests/fixtures/srs3/phase8a-evidence-manifest.json` | `0700162fd5b7c656c1d6134cdd3d69baa9a824eb4a01a598b7ea6d4b4c666362` |

These values matched read-only recomputation while drafting this plan; they are not a baseline run. Also verify 29 accepted English exact reviewed revisions, 12 quarantined language rows, disjoint labels, 41 unique IDs/families, production-only capability IDs, and no candidate/modifier/absent `confirmation` label. Do not change SRS-3B files to make the gate pass. Freeze is a **revision/hash binding**, not a claim that the Chinese rows or held-out data are approved.

## Evaluation path and rank semantics

For each accepted English scenario, in stable ID order:

```text
raw CoachingRequest + fixed AgentAction
  -> SRS_2_5_PROPOSED normalization (retain enum signal-source evidence)
  -> existing hard eligibility, production catalog only
  -> existing SIGNAL_ONLY positive-signal admission
  -> existing score: intent +12, situation +10, skill-ID tie break
  -> existing capability Top 10; modifiers remain separate
  -> join labels and fixture-only metadata for measurement/reporting
```

Use `topK: 10` as the **single configured retrieval run**, preserving current behavior. Top 3 and Top 5 metrics use prefixes of its stable ordered result; a focused test should show those prefixes equal native Top-3/Top-5 outputs without making them separate baseline algorithms. `retrievalScore` is a relevance signal, never confidence or probability. `retrievalRank` is the full positive-pool rank in capability traces; `topKRank` is present only within Top 10. The evidence should project `rankingStatus: NOT_RUN` and `rankingRank: null`. It may retain the underlying SRS-1 `rerank` identity-copy trace for provenance, but may **not** present it as a measured SRS-3 ranking stage or introduce `rankingScore`.

No annotated skill IDs, explicitness, realism, setting, family/cluster, expected ranks, or review rationale may enter the normalizer, context, hard gates, retrieval scorer, or tie break. The fixed action is an evaluation input, not an action predicted by this phase. No final reply, supervisor selection, final zero-to-five set, or prompt compilation is performed.

## Metric definitions and exact denominator policy

Let `S` be the 29 accepted English scenarios; `P` the 18 scenarios with nonempty reviewed primary labels; `E` the 11 reviewed directed edges; `R` the 32 required `(scenario, skill)` occurrences; `S_R` the 25 scenarios with at least one required skill; `N` the four strict-`NONE` scenarios. Counts must be revalidated from the freeze candidate before evaluation. A missing rank is a miss, never a score of zero confidence. Report integer numerator/denominator beside every rate; `0` denominator is `N/A`, not a fabricated zero rate.

| Metric | Formula / rule |
| --- | --- |
| Primary@1 and Primary@3 | Over `P=18`, success if **any** reviewed primary ID has `topKRank <= 1` or `<= 3`. Missing primary counts failure. Future co-primary labels use any-of success. |
| MRR@10 | Over `P=18`, mean `1 / min(topKRank of primary IDs)`, or `0` if no primary in Top 10. Future co-primaries use the best valid rank. Do not include seven no-primary multi-required cases or strict `NONE`. |
| Pairwise end-to-end success@10 | Over all `E=11` edges, success iff **both** endpoints are in Top 10 and `rank(higher) < rank(lower)`. Missing endpoint is failure, not implicit order success. |
| Pairwise conditional ordering accuracy@10 | Numerator: successful edges. Denominator: edges where **both** endpoints are in Top 10; report that denominator and the missing-endpoint count separately. A wrong order with both present is `PAIRWISE_ORDER_FAILURE`/`RANKING_FAILURE`; a missing endpoint is `PAIRWISE_RETRIEVAL_FAILURE` with its actual earlier disappearance cause. |
| Recall@5 / Recall@10 | Required occurrences found in Top K divided by `R=32`. Do not include acceptable skills. Include a Top-3 diagnostic, clearly marked secondary. |
| Required coverage@K | Macro mean over `S_R=25` of `# required in Top K / # required for that scenario`, for K=5,10 (optionally 3 diagnostic). |
| All-required-found@K | Count of `S_R=25` whose every required skill is Top K, divided by 25. |
| Required rank distribution | For each required occurrence, report full positive-pool rank, Top-3/5/10 membership, or hard-eligibility/retrieval absence and disappearance code. |
| Acceptable diagnostics | For 12 acceptable occurrences, report retrieved count, full ranks and Top-3/5/10 counts. They never enlarge required denominators, and returning every acceptable neighbor is not automatically rewarded. |
| Forbidden diagnostics | For five explicitly forbidden occurrences, report Top-3/5/10 hit counts and denominator 5; also list scenarios with any **labelled** forbidden present, and highest-ranked forbidden per affected scenario. Do not assume every unlabeled capability is forbidden or make forbidden-vs-required pairwise edges. |
| Strict `NONE` | Over `N=4`, pass if the **positive-signal capability pool and Top 10 are empty**. For R26–R28 wording actions, any positive candidate is a false positive; for R29 `NO_REPLY_NEEDED`, hard eligibility must also keep capability count at zero. Record false-positive ID(s) and earliest admission stage; later truncation cannot erase a failure. |
| Pool breadth | For all 29, record hard-eligible capability count, positive-signal pool count, Top-10 count, and min/max/mean/p50/p90 using existing `calculatePoolStatistics` conventions. Add counts of candidates above each required and **unlabeled** candidates above each primary as diagnostics. “Unlabeled” means neither required, acceptable, nor explicitly forbidden for that scenario; it is **not** a judgment of support, genericness, or error. Only separately adjudicated evidence may reclassify one. |

The seven no-order scenarios are exactly R13, R15, R19, R22, R23, R24, and R25. For each, report all-required-found, per-required rank, within-set coverage, forbidden hits, and candidate breadth. Their empty primary/edge arrays are **correct labels**, not missing data; they contribute to required metrics but not Primary@K, MRR, or pairwise denominators. The four strict `NONE` cases are R26–R29, with R29 non-wording. `COMPLETE_DRAFT` has no accepted case and is a stated coverage gap, not a silently imputed mode.

Candidate-state reporting must be four-way: `REQUIRED`, `ACCEPTABLE`, `FORBIDDEN`, or `UNLABELED`. Do not convert an `UNLABELED` candidate above a primary into a false neighbor, forbidden hit, unsupported/generic candidate, or failure. Report its count/rank neutrally; if it matters to failure interpretation, queue it for separate semantic adjudication without changing SRS-3C gold labels.

## Trace and failure attribution

The private per-scenario machine row should include: scenario ID/revision/family (no raw text), fixed `AgentAction`, language/mode/fixture-only reporting groups; normalized intent/situation **enum tags** and source-code evidence; each capability's eligibility result/reasons, matched-feature reason codes, `retrievalScore`, full positive-pool rank, Top-10 rank or null, and disappearance stage; separate modifier eligibility summary; hard-eligible/positive/Top-K counts; joined expected required/acceptable/forbidden/primary/edge IDs; per-K metric booleans; and failure objects. For every required, primary, and pair endpoint, ensure an explicit trace exists even when hard-ineligible. Do not serialize messages, drafts, selected-intent prose, reviewer rationale, stable identity, provider payload, or generated text. The report may show capability IDs and diagnostic reason codes.

Use the existing closed disappearance stages `HARD_ELIGIBILITY`, `RETRIEVAL_CUTOFF`, and `TOP_K_CUTOFF`; `RERANK_CUTOFF`, supervisor, and final-resolution stages are forbidden in SRS-3C output. Preserve the actual source-reason codes from the normalizer and the retrieval trace. For each miss, record its **observed stage** separately from an adjudicated **root-cause code**. Do not rename an existing SRS-2 trace stage just to fit SRS-3C prose.

Root-cause taxonomy for the evaluator/review report:

| Code | Use only when supported by evidence |
| --- | --- |
| `AGENT_ACTION_UPSTREAM_ISSUE` | The fixed action/label combination is inconsistent with the intended upstream policy; diagnose, do not silently change action. |
| `CONTEXT_NORMALIZATION_ISSUE` | Raw-visible or selected-intent evidence supports a skill but the proposed normalized tags omit it. A semantic check is needed; do not infer this solely from low score. |
| `SKILL_METADATA_GAP` | Relevant normalized evidence exists but frozen definition intents/situations/actions/languages cannot express it. Do not edit metadata here. |
| `RETRIEVAL_FAILURE` | Hard-eligible skill with valid normalized/metadata signal unexpectedly fails positive-pool admission; keep exact trace reason. |
| `TOP_K_FAILURE` | Skill has a positive-pool rank but falls below 10 (or below diagnostic K=3/5); distinguish the main Top-10 failure from prefix-only diagnostics. |
| `PAIRWISE_RETRIEVAL_FAILURE` | One/both reviewed edge endpoints are absent from the compared Top-10 list; attach each endpoint's earlier cause. |
| `RANKING_FAILURE` / `PAIRWISE_ORDER_FAILURE` | Relevant capabilities are present, but retrieval ordering misses a reviewed primary position or reverses a supported edge. Do not use for absence. |
| `FORBIDDEN_RANKING_FAILURE` | A labelled forbidden capability appears high; retain its earlier normalization/metadata cause separately if identifiable. |
| `STRICT_NONE_FAILURE` | Any capability enters the positive pool for a strict-`NONE` wording case, or hard eligibility admits one for R29. |
| `BAD_EVAL_LABEL` | Evidence contradicts a reviewed label; stop and request corpus adjudication rather than patching it inside SRS-3C. |
| `SKILL_BOUNDARY_AMBIGUITY` | The current approved definition cannot settle the interpretation; flag for separate review. |

For a scenario with multiple misses, retain **one record per target/symptom** plus a scenario-level earliest meaningful stage; do not force unrelated failures into one generic `RANKING_FAILURE`. Closed codes should be validated. If root cause cannot be assigned deterministically, mark it `NEEDS_REVIEW` in a private review queue and resolve before claiming a complete failure taxonomy; do not manufacture certainty. `PAIRWISE_RETRIEVAL_FAILURE`, `FORBIDDEN_RANKING_FAILURE`, and `STRICT_NONE_FAILURE` describe symptoms and can coexist with earlier causal stages. The metric report may identify best/worst boundaries and common **explicitly forbidden or separately adjudicated** false neighbors; otherwise candidates stay `UNLABELED`. It must not contain tuning instructions masquerading as baseline facts.

## Subgroups, dependence, and interpretation

Join `boundaryExplicitness`, `draftRealism`, and `setting` **only after raw observation**. Report subgroup numerator/denominator and `N/A` for empty denominators; do not infer population quality from tiny groups.

- Explicitness: 5 accepted `EXPLICIT` (all suggest, none pairwise) versus 24 `IMPLICIT`. At minimum break out required recall, strict `NONE`, and labelled forbidden Top-K. Primary/pairwise explicit subgroup is `N/A` if it has no eligible labels.
- Rewrite realism: among accepted rewrites, seven `ROUGH`, four `NORMAL`, three `ALREADY_DECENT`. Show required recall, primary rank distribution, and pool breadth by group; `OVER_POLISHED` has zero accepted cases and must be `N/A`. Never use the label to tune or score candidates.
- Assistance mode: 14 rewrite, 14 empty-draft suggest, one no-reply; show applicable required/primary/pairwise/pool measures with exact mode-specific denominators. Do not compare the one-case non-wording group as if it generalizes.
- Setting: WORK/PERSONAL/SERVICE are authoring-only and may have descriptive counts/metrics; no setting signal enters `SkillContext`.
- Dependence: publish both 29 scenario IDs/29 unique authoring families and a **diagnostic cluster caveat** for R19/R23, R15/R25, and R07/R09/R24. Do not silently reweight the primary baseline, present cluster examples as statistically independent generalization, or invent a new family mapping as a scoring input.
- Language gap: list R30–R41 as 12 quarantined, unscored/native review pending. Do not call them a failed baseline or include them in a main denominator, even if separately displayed as an unscored inventory.

## Implementation artifacts and sequence

| Path | Future SRS-3C responsibility |
| --- | --- |
| `.agent/plans/skills-srs-3c-ranking-baseline.md` | This plan, then progress/completion record; no scope expansion. |
| `packages/skills/tests/fixtures/srs3/srs3b-english-freeze.json` | **Already created, immutable** reviewed SRS-3B content/revision/denominator binding. Future evaluator reads and verifies it; no SRS-3C generation step rewrites it. |
| `packages/skills/tests/srs3-ranking-baseline.ts` | Private raw-only observation wrapper, exact freeze gate, private Zod machine-evidence schema, metric/failure calculation. Reuse SRS-2 trace and pool helpers. |
| `packages/skills/tests/srs3-ranking-baseline.test.ts` | Denominator, stage, absence/order, NONE, subgroup, leakage, deterministic tie and freeze-drift tests. |
| `scripts/evaluate-srs-3-baseline.ts` | Credential-free CLI consistent with `scripts/evaluate-srs-2.ts` and `scripts/evaluate-srs-2-5.ts`; explicit `--check` versus generation behavior. |
| `packages/skills/tests/fixtures/srs3/baseline-report.json` | Deterministic, content-free machine evidence. No raw message or draft. |
| `docs/skills/srs-3-ranking-baseline.md` | Human-readable aggregate, per-scenario diagnosis, limitations, evidence hash and SRS-3D handoff patterns only. |

Implementation order: (1) verify the already-created immutable freeze record, its own hash, all bound artifacts/revisions/counts **before baseline observation**, then add the fail-closed gate and evidence schema; (2) raw-only observation with retained source codes and Top-10 result; (3) per-scenario ranks/stages and metrics with unit tests; (4) aggregate/subgroups and manual cause adjudication without modifying labels or scorer; (5) deterministic machine evidence and concise report; (6) full validation and production-parity audit; (7) stop. The CLI or tests must not import draft/generated skill definitions into the scored catalog. No public contract or production export is needed. Adding a root `eval:srs3-baseline` convenience script is optional and requires approval within SRS-3C, not a reason to alter runtime packages.

Machine evidence to preserve for SRS-3D/SRS-3E comparison: schema version; **freeze ID and freeze-file SHA-256**; ordered scenario ID/revision list and accepted/quarantine counts; all seven corpus/catalog/SRS-3A digests above; SHA-256 of the exact normalizer, shadow retriever, observer/evaluator, and trace-schema source files used to produce the baseline; profile/mode/catalog/Top-K/tie-policy identifiers; per-scenario normalized tags/source codes, trace/rank/score/pool counts, expected-label references, neutral `UNLABELED` candidate counts, failures; aggregate metric numerators/denominators and subgroup slices; deterministic report SHA-256 recorded **outside** the JSON to avoid a self-hash. No timestamp, absolute path, unstable iteration order, model call, or privacy-sensitive content in the machine report. On future implementation, generate twice from unchanged inputs and compare bytes/hash. Once accepted, keep that artifact immutable for SRS-3D comparison; do not recompute the old baseline after scorer changes and call it the same baseline.

## Tests, validation, and acceptance gate

Focused tests should cover: freeze-file own-hash and seven-bound-artifact drift refusal (including ID/revision/count mismatch); 29/12 inclusion; 18/11/7/4 and 32/25 denominators; co-primary any-of and missing-primary MRR zero; pair endpoint absent versus reversed order; full-pool rank versus Top-K rank; Top-3/5 prefix equivalence to native K; all-required macro versus micro denominators; acceptable exclusion from recall; forbidden occurrence versus scenario counts; `UNLABELED` candidates staying neutral without semantic adjudication; `NONE` positive-pool and R29 hard-gate failures; zero-denominator `N/A`; metadata-label permutations leave observations byte-identical; modifier/candidate exclusion; no `RERANK_CUTOFF`; no raw text in evidence; source-hash binding; two-generation byte identity. Preserve the current SRS-3B/SRS-3A/SRS-2/SRS-2.5 tests.

Validation command set: focused `vitest run` over SRS-3C, SRS-3B, SRS-3A, SRS-2, SRS-2.5 and relevant skill-context suites; `pnpm skills:check`; `pnpm skills:verify-production`; `pnpm lint`; `pnpm typecheck`; `pnpm test`; `pnpm build`; `pnpm format:check`; `git -c core.safecrlf=false diff --check`; and two identical SRS-3C evidence-generation runs. Keep provider/live tests outside this milestone. Reverify 21 exact definitions and 153 plans **after** build.

Acceptance requires: the immutable freeze file and its own hash plus all bound artifacts match before baseline observation; only 29 English in scored denominators and 12 quarantined unscored; current `SRS_2_5_PROPOSED`/`SIGNAL_ONLY` production-catalog Top-10 path unchanged; Primary@1/@3/MRR over 18; pair end-to-end over 11 and conditional accuracy over both-present edges; required Recall@5/@10 over 32 occurrences plus coverage/all-found over 25 scenarios; acceptable/forbidden/NONE/pool diagnostics while unlabeled candidates remain neutral; no invented winner for seven no-order cases; explicitness/realism/mode/setting diagnostics with honest denominators; earliest-stage failure evidence and no `RERANK_CUTOFF`; deterministic, privacy-safe frozen evidence; full checks passing; and production parity. Poor baseline scores are findings, **not** permission to fix ranking in SRS-3C. Stop after the baseline report; SRS-3D requires separate approval.

## Risks, rollback, and unresolved decisions for approval

- **Sparse subgroup inference:** explicit primaries/pairs may have zero denominator and `NO_REPLY_NEEDED` has one case. Report `N/A` and counts, not sweeping conclusions.
- **Source-label disagreement:** if evaluation reveals a `BAD_EVAL_LABEL` or material boundary ambiguity, quarantine that metric claim and seek separate corpus adjudication; do not mutate SRS-3B or silently adjust denominators.
- **Identity-rerank naming:** SRS-1's trace slot can mislead reviewers. Project it as `rankingStatus: NOT_RUN`, use retrieval ranks only, and test this invariant.
- **Causal attribution:** trace stage is deterministic; semantic root cause may require review. Keep stage and cause separate, with `NEEDS_REVIEW` blocking a “fully classified” claim.
- **Dirty worktree:** preserve all pre-existing changes and generated output; rollback only SRS-3C-owned artifacts if approved, never reset shared work.

Approval resolution: the user separately authorized the SRS-3C current shadow-ordering baseline, the frozen 29 English cases, the content-free private artifact set, and an adjudication stop for any material label issue. No label issue required changing the freeze. The original planning text above records the pre-approval boundary; this completion record closes only SRS-3C.

## Progress log

- 2026-09-28: Recomputed the freeze file's own SHA-256, all seven bound corpus/catalog/SRS-3A digests, the review-report digest, serialized raw-set digest, exact accepted/quarantined ID:revision pairs, and all frozen denominators before any baseline observation. All passed; the freeze file was not edited.
- 2026-09-28: Added the private fail-closed evaluator, retained normalization source codes in the existing raw-only observer, measured the frozen Top-10 run, reviewed raw evidence for 13 required misses and secondary pair endpoints, and recorded exact stages and causes without changing normalizer/retrieval/production code.
- 2026-09-28: Added content-free machine evidence, a credential-free `--generate`/`--check` CLI, focused decision-boundary tests, and the human report. Repeated generation produced identical bytes and SHA-256.
- 2026-09-28: Ran the full validation and post-build production parity gate; all passed.

## Completion record

The [baseline report](../../docs/skills/srs-3-ranking-baseline.md) and [machine evidence](../../packages/skills/tests/fixtures/srs3/baseline-report.json) complete this milestone. Evidence SHA-256: `ffa306ca87866313d58e670775ded8bad91a4dcc99cb23efe5fb35839b9dbcac`. The evaluator stores normalized enum tags and source codes, 14 production capability traces and separate modifier summaries per case, full positive-pool and Top-10 ranks, four-way candidate labels, failures, exact denominators, and subgroup slices. It stores no messages, drafts, provider content, or timestamp. The fresh artifact-independent SRS-3B audit accepted the exact frozen English labels for exposed development; this is not different-human, native-language, or held-out approval.

Observed results: Primary@1 `5/18`, Primary@3 `9/18`, MRR@10 `7.25/18`; pairwise end-to-end `3/11`, conditional `3/6` with five missing-endpoint edges; required Recall@5/@10 `19/32`, all-required-found `13/25`; explicitly forbidden Top-10 hits `1/5`; strict `NONE` `4/4`. The review queue is empty after semantic inspection. Weak baseline scores remain findings; no tuning was done.

Tests added: eight SRS-3C tests covering freeze/artifact drift refusal, deterministic source-bound evidence, exact denominators, candidate-label separation, co-primary/missing-primary, pair absence versus reversal, full-pool versus Top-K, Top-K prefix equivalence, forbidden occurrence/scenario counts, strict `NONE`, zero-denominator `N/A`, raw-only label/metadata independence, and content leakage. Existing SRS-3B/SRS-3A/SRS-2/SRS-2.5 tests remain in the full suite.

Commands and results:

- `pnpm exec vitest run packages/skills/tests/srs3-ranking-baseline.test.ts packages/skills/tests/srs3-ranking-corpus.test.ts packages/skills/tests/srs3-phase8a-evidence-audit.test.ts packages/skills/tests/srs2-shadow-retrieval.test.ts packages/skills/tests/srs2-5-context-normalization.test.ts packages/ai/src/skill-context.test.ts` — 6 files, 91 tests passed.
- `pnpm skills:check` — passed, registry fresh.
- `pnpm lint` — passed, zero ESLint warnings.
- `pnpm typecheck` — passed, all workspace projects.
- `pnpm test` — 36 files, 482 tests passed.
- `pnpm build` — passed, all workspace packages and desktop bundles.
- `pnpm format:check` — passed after making report generation use repository formatting.
- `pnpm skills:verify-production` — passed after build: 21 exact definitions, 153 ordered plans, public exports, deep freezing, and authoring exclusion.
- `git -c core.safecrlf=false diff --check` — passed.
- `node --conditions=development --import tsx scripts/evaluate-srs-3-baseline.ts --generate` (twice) and `--check` — passed with identical SHA-256 `ffa306ca87866313d58e670775ded8bad91a4dcc99cb23efe5fb35839b9dbcac`.

Acceptance criteria: all SRS-3C criteria above pass. Known limits: 29 exposed-development English cases, sparse subgroups, three diagnostic dependence clusters, no accepted `COMPLETE_DRAFT`, 12 quarantined language cases unscored, and no held-out or live-provider evidence. Next recommended milestone is a separately approved SRS-3D design and evaluation of ranking improvements against this immutable baseline; stop here until that approval.
