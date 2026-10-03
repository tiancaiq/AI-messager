# SRS-3C current shadow-ordering baseline

Date: 2026-09-28  
Scope: frozen exposed-development English corpus only  
Evidence: [`baseline-report.json`](../../packages/skills/tests/fixtures/srs3/baseline-report.json)  
Evidence SHA-256: `ffa306ca87866313d58e670775ded8bad91a4dcc99cb23efe5fb35839b9dbcac`

## Run boundary

The `SRS-3B-ENGLISH-1` freeze file, its own SHA-256 (`0667d3ae16dbfe0132bb2a62ca7bc6c63e0324bf6a331e05538d6983d0f0c03e`), seven bound artifact digests, review report digest, exact ID/revision/state pairs, and labelled denominators passed before any baseline observation. The evaluator ran 29 accepted English scenarios in frozen ID order. R30–R41 remain 12 quarantined Chinese/code-switch scenarios, unscored pending native-language review. The 29 rows have 29 distinct authoring families.

This is the current `SRS_2_5_PROPOSED` normalizer followed by existing production-only `SIGNAL_ONLY` shadow retrieval at Top 10. Hard eligibility, positive-signal admission, intent `+12`, situation `+10`, and skill-ID tie break were unchanged. The SRS-1 `rerank` trace slot is only an identity copy; no reranker, final skill set, message generation, or provider call ran. The fixed action is fixture input. `retrievalScore` is a relevance signal, not a probability.

## Main results

| Measure | Result | Denominator meaning |
| --- | ---: | --- |
| Primary@1 | 5/18 (27.8%) | Scenarios with reviewed primary labels |
| Primary@3 | 9/18 (50.0%) | Same 18 scenarios |
| MRR@10 | 7.25/18 (0.403) | Missing primary contributes zero |
| Pairwise end-to-end@10 | 3/11 (27.3%) | All reviewed edges; missing endpoint fails |
| Pairwise conditional ordering@10 | 3/6 (50.0%) | Six edges with both endpoints present; five edges lack an endpoint |
| Required Recall@3 | 18/32 (56.3%) | Secondary diagnostic |
| Required Recall@5 | 19/32 (59.4%) | Required `(scenario, skill)` occurrences only |
| Required Recall@10 | 19/32 (59.4%) | Same 32 occurrences |
| Required macro coverage@5/@10 | 14.5/25 (58.0%) | Mean within each of 25 required scenarios |
| All required found@5/@10 | 13/25 (52.0%) | All required IDs present in each scenario |
| Acceptable present@3/@5/@10 | 6/12, 7/12, 7/12 | Diagnostic only; excluded from required recall |
| Explicitly forbidden present@3/@5/@10 | 1/5 at each K | R10 `boundary_setting`; one affected scenario of five labelled-forbidden scenarios |
| Strict `NONE` | 4/4 | Positive capability pool empty; R29 also has zero hard-eligible capabilities |

Across 29 scenarios, hard-eligible capability counts have min/max/mean/p50/p90 `0/14/13.52/14/14`; positive-pool and Top-10 counts are both `0/5/1.59/2/4`. The largest positive pool is five, so Top-5 and Top-10 required recall coincide here. This does not establish behavior when pools grow. Full positive-pool ranks and Top-10 ranks remain separate in the machine evidence.

The seven no-order scenarios R13, R15, R19, R22, R23, R24, and R25 have `1/2`, `2/2`, `1/2`, `0/2`, `2/2`, `2/2`, and `1/2` required IDs in Top 10 respectively. They have no primary winner or pair edge. Their candidate pools have 2, 4, 1, 0, 2, 2, and 3 capabilities, respectively; none has an explicitly forbidden hit. All contribute to required recall and within-scenario coverage.

## Per-scenario diagnosis

`Primary` is Top-10 rank, or `—` when missing/not labelled. `Pair` is correct/present reversed/missing endpoints, or `—` where no reviewed edge exists. Required column gives found/labelled count. A missing required skill is traced as a retrieval-cutoff with `NO_SUPPORTING_EVIDENCE`; the raw-input audit found a corresponding communication operation that the proposed normalizer did not tag. These are adjudicated `CONTEXT_NORMALIZATION_ISSUE` findings, not automatic consequences of a low score.

| ID | Required | Primary | Pair | Observation |
| --- | ---: | ---: | --- | --- |
| R01 | 0/1 | — | — | `request` missed at positive-signal admission |
| R02 | 0/1 | — | missing | `clarification` and the acceptable `request` absent |
| R03 | 1/1 | 2 | reversed | `ask_for_help` precedes required `request` |
| R04 | 1/1 | 1 | correct | Both endpoints present |
| R05 | 1/1 | 1 | correct | Both endpoints present |
| R06 | 0/1 | — | — | `request` missed; forbidden `follow_up` absent |
| R07 | 0/1 | — | missing | `boundary_setting` and acceptable `decline` absent |
| R08 | 1/1 | 1 | — | Forbidden `boundary_setting` absent |
| R09 | 1/1 | 2 | correct | Required limit follows an unlabeled rank-1 candidate; unlabeled status stays neutral |
| R10 | 1/1 | 1 | — | Explicitly forbidden `boundary_setting` at rank 3 |
| R11 | 0/1 | — | missing | `planning` and acceptable `expectation_setting` absent |
| R12 | 1/1 | 2 | — | Required expectation follows an unlabeled candidate; forbidden `planning` absent |
| R13 | 1/2 | — | — | `planning` missed; no reviewed order |
| R14 | 1/1 | 1 | — | Forbidden `planning` absent |
| R15 | 2/2 | — | — | Both required skills present; no reviewed order |
| R16 | 0/1 | — | missing | `acknowledge_mistake` and acceptable `apology` absent |
| R17 | 0/1 | — | missing | `emotional_validation` and acceptable `reassurance` absent |
| R18 | 1/1 | 4 | reversed | `emotional_validation` precedes required `reassurance` |
| R19 | 1/2 | — | — | `status_update` missed; no reviewed order |
| R20 | 1/1 | 2 | reversed | `status_update` precedes required `expectation_setting` |
| R21 | 0/1 | — | — | `planning` missed; acceptable `request` present |
| R22 | 0/2 | — | — | `planning` and `expectation_setting` missed |
| R23 | 2/2 | — | — | Both required skills present; no reviewed order |
| R24 | 2/2 | — | — | Both required skills present; no reviewed order |
| R25 | 1/2 | — | — | `acknowledge_mistake` missed; no reviewed order |
| R26–R28 | 0/0 | — | — | Wording `NONE`: positive capability pool empty |
| R29 | 0/0 | — | — | Non-wording `NONE`: zero hard-eligible capabilities |

Five of 11 pair edges have missing endpoints (R02, R07, R11, R16, R17). Three more are reversed with both endpoints present (R03, R18, R20). Each miss retains its observed stage and endpoint-specific cause in the machine report. `RANKING_FAILURE` and `PAIRWISE_ORDER_FAILURE` are used only when the relevant skills are present. For R10, conflict situation alone admits forbidden `boundary_setting`; the trace records `FORBIDDEN_RANKING_FAILURE`, without asserting that every unlabeled candidate is wrong. The private semantic review queue is empty after inspecting the 13 missed required occurrences against raw fixture evidence. No SRS-3B labels were changed.

## Subgroups and limits

| Group | Scenarios | Required@10 | Primary@1 | Pair end-to-end | NONE pass | Forbidden@10 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Explicit boundary | 5 | 3/3 | 3/3 | N/A (0 edges) | 2/2 | 1/3 |
| Implicit boundary | 24 | 16/29 | 2/15 | 3/11 | 2/2 | 0/2 |
| Rough rewrite | 7 | 7/11 | 1/3 | 1/2 | N/A | N/A |
| Normal rewrite | 4 | 2/5 | 0/3 | 1/2 | N/A | N/A |
| Already-decent rewrite | 3 | 0/2 | 0/2 | 0/2 | 1/1 | N/A |
| Over-polished rewrite | 0 | N/A | N/A | N/A | N/A | N/A |
| Rewrite draft | 14 | 9/18 | 1/8 | 2/6 | 1/1 | N/A |
| Empty-draft suggest reply | 14 | 10/14 | 4/10 | 1/5 | 2/2 | 1/5 |
| Complete draft | 0 | N/A | N/A | N/A | N/A | N/A |
| No reply | 1 | N/A | N/A | N/A | 1/1 | N/A |

Setting is a reporting-only group: WORK has 11 scenarios and required recall `6/13`; PERSONAL has 10 and `8/11`; SERVICE has eight and `5/8`. Their primary/pairwise/pool figures and exact denominators are in the machine report. Group sizes are too small for population claims. Draft realism and explicitness never enter retrieval.

Among primary-labelled rewrites, ROUGH has ranks `missing, 1, missing` and positive-pool counts across its seven cases `0, 5, 0, 2, 4, 1, 2`; NORMAL has ranks `2, 2, missing` and pools `4, 3, 4, 0`; ALREADY_DECENT has ranks `missing, missing` and pools `0, 0, 0`. OVER_POLISHED has no accepted case, so its rank distribution is N/A. The pool statistics in the machine report use the same min/max/mean/p50/p90 convention for every subgroup.

R19/R23, R15/R25, and R07/R09/R24 are diagnostic dependence clusters. The main 29-row baseline is not reweighted. `COMPLETE_DRAFT` has no accepted case. The 12 quarantined language cases, any held-out set, live-provider generation, and production skill selection are outside this baseline. The result is an exposed-development observation, not an estimate of generalization.

## SRS-3D handoff gate

The largest observed loss is at normalization/positive-signal admission: 13 required occurrences across 12 cases are absent before ordering. Three of six both-present reviewed pairs are reversed, and one of five explicitly forbidden occurrences enters Top 3. These are patterns for a separately approved SRS-3D design review. This milestone changes no normalizer, retrieval score, tie break, catalog activation, or production path.
