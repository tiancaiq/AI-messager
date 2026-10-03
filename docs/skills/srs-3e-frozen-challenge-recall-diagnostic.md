# SRS-3E frozen challenge — shadow recall diagnostic

Date: 2026-09-29  
Scope: **exposed-development English only**, evaluation/shadow mode; fixed `AgentAction`, `SIGNAL_ONLY`, production catalog, Top 10  
Input: immutable [`SRS-3E-FRESH-CHALLENGE-1`](../../packages/skills/tests/fixtures/srs3e/challenge-freeze.json)  
Machine evidence: [`challenge-recall-diagnostic.json`](../../packages/skills/tests/fixtures/srs3e/challenge-recall-diagnostic.json)

## Verdict and boundary

The earlier SRS-3D-A result **did not generalize to the new wording**. On this independently frozen challenge set, required capability Recall@10 is only **19/52 (36.5%)** with `SRS_3D_RECALL_PROPOSED`, versus **18/52 (34.6%)** with `SRS_2_5_PROPOSED`. The only newly recovered required occurrence is `C36` `request`. Six of six strict `NONE` controls remain empty. Explicit forbidden admissions worsen from 5/39 to 7/39; `C15` `clarification` and `C36` `ask_for_help` are newly admitted neighbors.

This is a diagnostic failure of the **existing deterministic shadow candidate-recovery path** on fresh exposed-development wording. It is not a semantic retriever evaluation: no embeddings, semantic Top-K, reranking, profile edits, metadata repairs, or production changes were made. The previous 32/32 result was on the different SRS-3B frozen set, and its 48/48 variant result came from cases authored alongside SRS-3D-A. Neither is a substitute for this challenge result.

The six `NONE` passes do not erase the positive-case misses. Scores in this retriever are coarse relevance signals, not probabilities. A Top-10 hit is candidate recovery, not correct final skill selection or generated-reply quality.

## A. Fresh challenge BEFORE versus AFTER

The denominator is **48 accepted English capability scenarios**: 42 with at least one required capability (52 required occurrences) and six strict `NONE`. Acceptable skills are tracked separately and never added to required recall. Seven English modifier scenarios have a separate eligibility diagnostic. Thirteen Chinese/code-switching scenarios remain `NATIVE_LANGUAGE_REVIEW_REQUIRED` and unscored.

| Diagnostic | SRS-2.5 shadow | SRS-3D-A shadow |
| --- | ---: | ---: |
| Required Recall@3 | 17/52 (32.7%) | 18/52 (34.6%) |
| Required Recall@5 | 18/52 (34.6%) | 19/52 (36.5%) |
| Required Recall@10 | 18/52 (34.6%) | 19/52 (36.5%) |
| Mean within-scenario required coverage@10 | 13/42 (31.0%) | 14/42 (33.3%) |
| All required found@10 | 10/42 (23.8%) | 11/42 (26.2%) |
| Strict `NONE` | 6/6 | 6/6 |
| Explicitly forbidden in Top 10 | 5/39 | 7/39 |
| Acceptable present in Top 10, diagnostic only | 1/10 | 2/10 |
| Incidental Primary@1 | 0/2 | 0/2 |
| Incidental pairwise end-to-end | 0/2 | 0/2 |
| Positive pool mean / p50 / p90 / max | 0.94 / 0 / 3 / 6 | 1.08 / 0 / 4 / 6 |

The pool maximum is six, so these cases show **no Top-K truncation effect**: Recall@5 and Recall@10 are equal. The 33 remaining required misses all passed hard eligibility and then disappeared at `RETRIEVAL_CUTOFF` with `NO_SUPPORTING_EVIDENCE`. None is a `HARD_ELIGIBILITY` or `TOP_K_CUTOFF` miss. The positive-pool median of zero shows that the main failure is signal coverage, not rank ordering. Hard-eligible pool means are 13.71 for both profiles.

## B. Misses by capability

Counts are required occurrences found at Top 10 with the SRS-3D-A shadow profile. The right column names the frozen challenge cases that are still missing; case IDs and exact traces are in the machine evidence. These are *observed disappearance stages*, not an invitation to relabel or rewrite the exam.

| Capability | Found | Missing case IDs |
| --- | ---: | --- |
| apology | 3/3 | — |
| acknowledge_mistake | 1/4 | C03, C04, C29 |
| emotional_validation | 0/3 | C05, C06, C31 |
| reassurance | 1/4 | C05, C08, C32 |
| boundary_setting | 2/3 | C10 |
| de_escalation | 1/4 | C11, C12, C34 |
| decline | 1/5 | C10, C13, C14, C35 |
| ask_for_help | 2/2 | — |
| follow_up | 0/2 | C17, C18 |
| status_update | 2/4 | C19, C40 |
| expectation_setting | 2/4 | C21, C22 |
| planning | 0/3 | C23, C24, C39 |
| clarification | 0/3 | C25, C26, C41 |
| request | 4/8 | C27, C28, C37, C42 |

The strongest evidence of non-generalization is not one obscure boundary: the profile misses all accepted English positives for `emotional_validation`, `follow_up`, `planning`, and `clarification`, and four of five `decline` occurrences. Multi-skill composition suffers because one recovered member does not satisfy an all-required scenario: for example, `C17` retrieves `request` but misses `follow_up`; `C23` retrieves `request` but misses `planning`.

The observed proximate mechanism is absent positive intent/situation evidence for each missing definition under the current metadata. Determining a new general semantic rule, changing metadata, or adjudicating a case boundary is **future work**; this run does none of those. Earlier known broad-metadata precision limitations also remain. Five forbidden hits already existed under SRS-2.5 (`C20` `expectation_setting`, `C33` `boundary_setting`, `C35` `de_escalation`, `C38` `expectation_setting`, `C39` `decline`); two more appear with SRS-3D-A (`C15` `clarification`, `C36` `ask_for_help`).

## C. Assistance-mode and modifier separation

| Fixed action | Capability cases | Required Recall@10, SRS-2.5 → SRS-3D-A | Strict `NONE`, SRS-3D-A |
| --- | ---: | ---: | ---: |
| `REWRITE_DRAFT` | 23 | 11/27 → 12/27 | 2/2 |
| `SUGGEST_REPLY` | 21 | 6/22 → 6/22 | 2/2 |
| `COMPLETE_DRAFT` | 3 | 1/3 → 1/3 | 1/1 |
| `NO_REPLY_NEEDED` | 1 | N/A | 1/1 |

For the seven accepted English modifier cases, the required modifier is **hard-eligible in 7/7** under both profiles. Their five explicitly forbidden modifiers are also hard-eligible in **5/5**, because this stage checks language/action eligibility, not modifier relevance or ranking. It would be incorrect to call either ratio modifier-selection accuracy. The modifier cases do not enter the 52-occurrence atomic recall denominator, and the 13 quarantined language cases do not enter either efficacy result.

## D. Reproducibility, production and next decision

The evaluator checks the exact SRS-3E freeze SHA-256 `4cd2a78487b0d59c67d97bfe672219f9ff19c9913d079372b2324dbb80a87b84` and every bound source/serialized artifact before observation. It passes only product-shaped raw request, fixed action, and production catalog to each existing profile/retriever, then joins annotations. The machine result contains case IDs, labels, ranks, disappearance stages/reasons, pool counts, and modifier eligibility, but no conversation or draft text. Two generations produced identical bytes; the diagnostic SHA-256 is `756aa7add371a17ac9e9717c9280aaf920ca275526fd637cd6f7c07c3821eda2`.

The appropriate next decision is to use this **unchanged frozen challenge** when separately designing/evaluating SRS-3E semantic retrieval, while measuring both recovery and forbidden-neighbor behavior. Do not tune the challenge cases to the current profile's misses. This result is still exposed development, not held-out or native-language evidence. Production remains the CURRENT SkillEngine with 21 ACTIVE definitions and 153 frozen plans; no candidate activation, provider call, or generated final reply occurred.
