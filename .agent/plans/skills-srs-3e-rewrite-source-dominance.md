# SRS-3E-v2 — exposed rewrite source-dominance diagnostic

Status: **complete — exposed diagnostic only; no challenge configuration approved**  
Owner: Codex  
Started: 2026-09-30  
Updated: 2026-09-30  
Roadmap: [SRS-3E shadow semantic retrieval](skills-srs-3e-semantic-retrieval.md); precedes [SRS-3F](skills-srs-3f-communication-operations.md)

## Outcome and scope

Determine whether a user-draft-dominant combination of existing source similarities materially improves `REWRITE_DRAFT` recovery on **exposed calibration only**, without letting longer OTHER messages redefine the user's intent. This is one bounded experiment, not another admission-threshold search. Keep the 21 ACTIVE production definitions, action, skill profiles, pinned MiniLM files, profile vectors, cosine calculation, structural gates, existing SRS-3E and SRS-3E admission-retest artifacts, and the frozen challenge unchanged. No production selector, new model, skill/profile text, labels, Supervisor, or provider calls. Do not inspect, embed, score, or join frozen challenge rows.

## Current state and key correction

The [admission retest](../../docs/skills/srs-3e-admission-retest.md) selected diagnostic P087 on 29 accepted English SRS-3B rows plus 24 corrected SRS-3E controls: 8/46 required, **0/27 rewrite**, 16/16 strict NONE, 2/14 explicit forbiddens, and 38/46 required skills ranked in pre-admission Top 10. Crucially, its scorer used `alpha=0`; context did **not** push draft scores down in that result. The diagnostic must distinguish (1) poor draft-only semantic rank/score, (2) rank change from source combination, and (3) rejection by the *unchanged* P087 admission rule. A query-source experiment cannot be called a threshold fix.

## Assumptions and fixed variants

Reuse the existing source-aware query serializer and each skill's best positive-field cosine for every fragment. Do not concatenate, paraphrase, or re-embed source text. For rewrite only, define `d = max(USER_DRAFT scores)`, `g = max(SELECTED_GOAL scores, if present)`, and `c = max(OTHER_MESSAGE, USER_HISTORY scores, if present)` per skill. The selected goal is explicitly user-owned; OTHER/history are context, never substitute draft evidence. The four variants below are **predeclared before scoring**. `SUGGEST_REPLY` and `COMPLETE_DRAFT` keep the prior alpha-zero primary score for aggregate comparison.

| ID | Rewrite combined score | Boundary |
| --- | --- | --- |
| A `DRAFT_ONLY` | `d` | Direct draft semantic baseline. |
| B `DRAFT_CONTEXT_BOOST` | `d + min(0.05, 0.10 × max(0,c))` only when `d ≥ 0.25`; otherwise `d` | Context can help a nontrivial draft, never replace it; 0.25 is a fixed boost-eligibility guard, **not** a searched admission threshold. |
| C `PRIMARY_FLOOR` | `d + 0.20 × max(0,c-d)` only when `d ≥ 0.25`; otherwise `d` | Context can close at most 20% of a positive gap; a weak draft remains draft-only. |
| D `SOURCE_MAX_DOMINANCE` | `p + min(0.05, 0.10 × max(0,c))` only when `d ≥ 0.25`, otherwise `d`, where `p=max(d,g)` if goal exists | Explicit user goal may raise primary score, but context still requires a nontrivial draft. |

For `REWRITE_DRAFT`, every scored row must have a nonempty draft; reject malformed evidence. For diagnostics only, compute `DRAFT_ONLY`, `CONTEXT_ONLY` (if context exists), and each combined ranking among all hard-eligible atomic skills **before** admission. Context-only is never a candidate policy. Scores are relevance signals, not confidence. Keep the original P087 `PEAK_SPREAD` admission fixed: score floor `0.40`, within `0.15` of maximum, and maximum-minus-median spread at least `0.20`; stable score/ID ordering, Top 10. Recompute P087's max/median over each variant's score vector, because that is how the fixed rule operates; do not adjust its parameters. No other admission rules are tried.

## Contracts, data, and implementation steps

Add a standalone evaluation-only source-combination function and one focused script/test under `packages/skills/tests/` and `scripts/`. Load only the prior accepted exposed raw/annotation/review sets and frozen vectors through verified digests; score raw inputs first, join labels only for metrics. Record no raw text or embedding vectors in the output. Per required skill record draft/context/goal score and rank, combined pre-admission rank, admitted rank, and exactly one loss stage (`HARD_ELIGIBILITY`, `DRAFT_REPRESENTATION`, `CONTEXT_RERANK`, `ADMISSION_REJECTED`, `TOP_K_CUTOFF`, `FOUND`). Also report acceptable/forbidden presence, strict NONE, pool distribution, action slices, and cases where OTHER causes a wrong-neighbor admission. Preserve user/OTHER ownership and capability/modifier lanes.

Write a new content-free JSON artifact and concise Markdown report; never overwrite v1/v3 artifacts. Two identical regenerations and `--check` must verify deterministic bytes/hash. A dedicated test should assert that weak draft similarity cannot be rescued by OTHER alone in B/C/D, and that the original alpha-zero baseline reproduces P087's 8/46, 0/27, 16/16 and 2/14. The script must not import or read challenge modules/artifacts. The only project edits are this plan and new SRS-3E-v2 evaluation artifacts/tests/report.

## Predeclared decision gates

On the same 53 exposed rows, a variant is **promising for a new immutable v2 config review** only if all hold: rewrite required recovery **≥6/27**, overall required **≥14/46**, strict NONE **≥15/16**, explicit forbidden admissions **≤3/14**, positive-pool mean **≤5**, p90 **≤8**, max **≤10**, and no reviewed case where OTHER-only content flips a low-draft-signal skill into admission. Report draft/context/combined pre-admission Recall@3/5/10 regardless of gate. These are diagnostic viability gates, not statistical proof or frozen-challenge acceptance. Select at most one passing variant by rewrite required hits, then overall required hits, then fewer forbidden admissions, smaller pool, and A/B/C/D order. If none passes, **STOP SRS-3E query/admission iteration** and return to the SRS-3F architecture. Do not invent SRS-3E-v3/v4.

If one passes, freeze a **new** model/profile/vector/query/P087/corpus binding and source policy under an immutable SRS-3E-v2 ID, obtain human review of evidence and config, then request separate approval for a one-shot frozen challenge observation. This pass itself **never runs the challenge** and never activates production. A promising exposed result does not waive independent review or repair known challenge labels.

## Validation, risk, rollback, completion

Run focused source-dominance and existing semantic/admission tests, `pnpm skills:check`, `pnpm skills:verify-production`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm format:check`, and `git -c core.safecrlf=false diff --check`. Check the frozen model/profile/vector/calibration hashes and production parity. Failure risks include very short drafts lacking semantic signal, high cosine context false neighbors, small/overexposed calibration, and fixed P087 rejecting even correctly ranked skills. Report these separately. Roll back only new v2 artifacts; never rewrite frozen sources. This plan is complete when the exposed experiment and decision are documented or a concrete environment gate is reported. SRS-3F remains proposed until that decision.

## Progress log

- 2026-09-30: Inspected repository guidance, current SRS-3E retriever, admission script/test and exposed report. Confirmed P087 used `alpha=0`, so the rewrite failure cannot be attributed to context reranking in the prior run. Predeclared four source policies, fixed P087, and numeric stop/go gates before experiment scoring.
- 2026-09-30: Scored the same 53 exposed scenarios with all four policies. Every arm recovered 8/46 required overall, 0/27 rewrite, 16/16 strict NONE, and admitted 2/14 explicit forbiddens; no arm passed viability. The draft-only pre-admission rewrite ranks were 10/27 @3, 13/27 @5, 20/27 @10, but 0/27 required draft scores reached the unchanged P087 0.40 floor. The preliminary `v1` diagnostic was preserved; `v2` corrects a stage-accounting branch without changing scores or metrics. The corrected artifact SHA-256 is `3e5f3ea4581564e91563c27a18839090be1680c4cfa115f381b87c0ffed9243b`; two `--check` regenerations matched.

## Completion record

**FAIL against the predeclared improvement gates; stop SRS-3E source/admission iteration.** The exposed-only [report](../../docs/skills/srs-3e-rewrite-source-dominance.md) records the comparisons and evidence binding. No v2 challenge config was frozen or approved; the one-shot challenge was not opened. The next proposal is SRS-3F increment A under separate implementation approval, rather than another MiniLM query/threshold variation.

Focused semantic tests: 3 files/10 tests passed. `pnpm skills:check`, `pnpm skills:verify-production` (21 definitions, 153 plans), `pnpm lint`, `pnpm typecheck`, `pnpm test` (44 files/513 tests), `pnpm build`, `pnpm format:check`, and `git -c core.safecrlf=false diff --check` passed. The diagnostic script's `--check` passed twice with identical output hash. Limits: English synthetic exposed data, small corpus, no challenge or live-provider/generalization claim, and no final skill selection quality claim. Production selector, canonical YAML, existing SRS-3E evidence, model and vector bytes were not changed.
