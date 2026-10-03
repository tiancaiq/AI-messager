# SRS-3D-A shadow recall / candidate recovery

Date: 2026-09-29  
Scope: exposed-development English only; evaluation-only `SRS_3D_RECALL_PROPOSED`  
BEFORE: immutable [SRS-3C baseline](srs-3-ranking-baseline.md)  
AFTER: [`recall-after.json`](../../packages/skills/tests/fixtures/srs3/recall-after.json)

## Verdict and boundary

The new profile recovers all 13 previously missing required occurrences in the frozen corpus without losing any previously found requirement. It changes neither the SRS-2.5 profile nor retrieval weights, Top-K, skill metadata, production `CURRENT`, or `SkillEngine.select()`. This is a candidate-recovery experiment, **not** a ranking-algorithm improvement or production authorization. The 12 quarantined Chinese/code-switch cases remain unscored.

The fresh controls expose two newly admitted *target skills* through existing broad situation metadata (`expectation_setting` from `planning` and `status_request`), although the new profile does **not** emit a false `set_expectation` intent. This is a precision limitation requiring a separate metadata/boundary decision; no metadata was changed. An additional status/expectation neighbor intent error existed in SRS-2.5 before this experiment. Do not treat 32/32 frozen recall as unconditional acceptance or generalization evidence.

## A. Root cause per original miss

Each required skill passed production-only hard eligibility. In the BEFORE trace, it disappeared at `RETRIEVAL_CUTOFF` with `NO_SUPPORTING_EVIDENCE`. The table cites synthetic raw-fixture evidence, the original normalized tags (all others were empty), the reason its metadata had no positive match, and the new evidence source. The diagnostic code describes the semantic failure, not a case-ID branch in normalization.

| Miss | Synthetic evidence supporting capability | BEFORE tags | Root-cause code | New signal/source |
| --- | --- | --- | --- | --- |
| R01 `request` | Draft asks recipient to run an export and report its format in shorthand. | none | `MISSING_SEMANTIC_PATTERN` | `make_request` / `USER_DRAFT` |
| R02 `clarification` | Selected goal asks which of two service plans is meant before deciding. | none | `SELECTED_INTENT_NOT_NORMALIZED` | `clarify` / `SELECTED_INTENT` |
| R06 `request` | Selected goal asks for a copy of a new invoice, not a follow-up on the old ticket. | none | `SELECTED_INTENT_NOT_NORMALIZED` | `make_request` / `SELECTED_INTENT` |
| R07 `boundary_setting` | Other person describes daily lunch meetings; draft sets an ongoing lunch-break limit. | none | `OVERLY_NARROW_PATTERN` | `set_boundary` / `USER_DRAFT` plus repeated-pressure check against `OTHER_MESSAGE` |
| R11 `planning` | Draft accepts one offered appointment slot and asks to put it on the calendar. | none | `COMMUNICATION_OPERATION_NOT_RECOGNIZED` | `plan` / `USER_DRAFT` |
| R13 `planning` | Draft proposes comparing remaining issues Thursday before assigning fixes. | `provide_status`, `status_request` from draft | `OVERLY_NARROW_PATTERN` | `plan` / `USER_DRAFT` |
| R16 `acknowledge_mistake` | Selected goal explicitly says the user pasted an outdated link. | none | `ACTOR_OWNERSHIP_NOT_RECOGNIZED` | `acknowledge_mistake` / `SELECTED_INTENT` |
| R17 `emotional_validation` | Other person explicitly says they are embarrassed; draft acknowledges it. | none | `MISSING_SEMANTIC_PATTERN` | `validate_emotion` / `OTHER_MESSAGE` |
| R19 `status_update` | Draft states a known count: three of five aisles counted. | `set_expectation` from draft | `MISSING_SEMANTIC_PATTERN` | `provide_status` / `USER_DRAFT` |
| R21 `planning` | Draft proposes a post-demo test time and separately asks for an adapter. | `make_request`, `request` from draft | `OVERLY_NARROW_PATTERN` | `plan` / `USER_DRAFT` |
| R22 `planning` | Draft accepts Sunday and proposes choosing a time after travel information arrives. | none | `OVERLY_NARROW_PATTERN` | `plan` / `USER_DRAFT` |
| R22 `expectation_setting` | Same draft says the user *should* be free after lunch, preserving uncertainty. | none | `MISSING_SEMANTIC_PATTERN` | `set_expectation` / `USER_DRAFT` |
| R25 `acknowledge_mistake` | Selected goal says to own the user's late upload rather than blame someone else. | `apologize`, `de_escalate`, `conflict` from selected goal | `ACTOR_OWNERSHIP_NOT_RECOGNIZED` | `acknowledge_mistake` / `SELECTED_INTENT` |

No original miss was caused by a hard eligibility or Top-K cutoff; no frozen label was changed. The new matcher receives only raw request/policy data, not IDs, labels, rationale, expected rank, or annotations. Labels join only after retrieval.

## B. General rules added

The versioned profile adds source-aware operations for (1) direct, softened, shorthand and selected-goal requests; (2) a material missing detail or explicit alternatives; (3) active time/next-step coordination rather than mere future mention; (4) a continuing limit, with repeated pressure or explicit continuity; (5) explicit user-owned mistake, including selected goal and short user-draft fragments; (6) an emotion explicitly expressed by the other person; (7) known present progress, including fractional draft fragments; and (8) cautious future availability, capacity or timing. A mixed draft may legitimately contain both planning and expectation signals. Negatives guard one-off refusal, settled schedule notice, third-party/unknown ownership, neutral logistics and future estimate versus current status. No case ID appears in the normalizer.

This is a deterministic lexical/structural proposal, not a claim of general semantic understanding. Unseen phrasing and speaker attribution remain risks.

## C. Frozen English BEFORE versus AFTER

| Diagnostic | BEFORE SRS-3C | AFTER SRS-3D-A |
| --- | ---: | ---: |
| Required Recall@3 | 18/32 | 31/32 |
| Required Recall@5 | 19/32 | 32/32 |
| Required Recall@10 | 19/32 | 32/32 |
| Within-scenario required coverage@10 | 14.5/25 (58%) | 25/25 (100%) |
| All required found@10 | 13/25 | 25/25 |
| Strict `NONE` | 4/4 | 4/4 |
| Explicitly forbidden Top 3 / 5 / 10 | 1/5 each | 1/5 each |
| Positive pool mean | 1.59 | 2.55 |
| Positive pool maximum / p50 / p90 | 5 / 2 / 4 | 6 / 2 / 5 |

The positive pool grows from 46 to 74 total candidate-scenario occurrences (+28), without losing a previously recovered requirement or enabling a newly forbidden frozen capability. Hard-eligible counts are unchanged. Pool size remains below Top 10 in these 29 cases; this does not establish large-catalog behavior. The historical BEFORE file and all SRS-3B artifacts are unchanged.

## D. Separate fresh exposed-development regression

The 68 new cases are separate from the frozen 29 and held-out evidence. Each of eight affected capabilities has six positive variants plus a hard neighbor and negative control; four additional controls check negated selected goals. The variants cover formal, normal, rough, fragment, and multi-operation wording; both rewrite and empty-draft suggest actions appear where meaningful.

| Check | Result |
| --- | ---: |
| Positive target-intent signals | 48/48, versus 12/48 in SRS-2.5 |
| Positive target skills in Top 10 | 48/48 |
| Hard-neighbor/negative target-intent hits | 1/20; the one hit (`D27` status) was already present in SRS-2.5 |
| Newly added false target-intent signals in controls | 0/20 |
| Newly enabled control target skills | 2/20 (`D31`, `D32`, both `expectation_setting`) |

`D31` is active planning; its correct `planning` situation also matches `expectation_setting` metadata. `D32` states a completed draft after a status question; its correct `status_request` situation also matches that metadata. The controls contain no supported future estimate, and `set_expectation` is absent. This is metadata-driven neighbor admission, not a reason to suppress truthful situation evidence or silently modify governed skill definitions. The new set's positive-pool maximum is eight, mean 2.22, p50 two, p90 four. These are author-visible exposed variants, not an independently held-out test.

## E–G. Remaining issues, downstream ordering, parity

There are no remaining required misses among the 29 frozen English cases or 48 fresh positives. Remaining precision issues are the two metadata-driven control admissions above and the pre-existing `D27` status-intent neighbor hit. No skill metadata, primary/pairwise labels, or SRS-3B revision was changed. Any metadata repair needs separate approval and an independently reviewed boundary test.

With unchanged +12 intent / +10 situation scores and skill-ID tie break, the expanded pool incidentally moves Primary@1 from 5/18 to 13/18 and pairwise end-to-end from 3/11 to 7/11 (conditional 3/6 to 7/10). These are *downstream consequences of signal recovery*, not evidence of a better ranking algorithm. Remaining order failures belong to a later separately approved phase.

Production remains `CURRENT` with 21 ACTIVE definitions and 153 frozen plans. No provider call, final reply, supervisor, composition, live evaluation, candidate activation, commit, merge, or push occurred.

## Validation and reproducibility

The AFTER evaluator checks the SRS-3B freeze bindings and exact SRS-3C report SHA-256 `ffa306ca87866313d58e670775ded8bad91a4dcc99cb23efe5fb35839b9dbcac` before observation. It records source hashes and content-free per-row tags, ranks, failure stages, pool counts and separate regression diagnostics. The generated AFTER file is never substituted for the BEFORE file. Exact commands/results and AFTER SHA-256 are recorded in the [execution plan](../../.agent/plans/skills-srs-3d-a-recall.md) after final validation.
