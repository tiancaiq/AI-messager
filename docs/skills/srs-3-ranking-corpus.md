# SRS-3B exposed ranking development corpus

Status: **remediated and internally re-reviewed; fresh independent corpus review pending**. This
is an exposed development inventory. It contains no SRS-3C baseline measurement or
ranking result. The 12 Chinese and code-switching cases remain quarantined until a
qualified native-language reviewer evaluates their wording and skill boundaries.

## Provenance and source triage

The frozen SRS-3A manifest has SHA-256
`0700162fd5b7c656c1d6134cdd3d69baa9a824eb4a01a598b7ea6d4b4c666362`.
Its 69 `EVALUATION_LABEL_SOURCE` records each have one decision in
`packages/skills/tests/fixtures/srs3/source-triage.json`:

| Disposition                | Records | Reason                                                                                            |
| -------------------------- | ------: | ------------------------------------------------------------------------------------------------- |
| `INSUFFICIENT_FOR_RANKING` |      37 | Focal-only authoring sketches lack a complete runnable input or independent inverse.              |
| `REGRESSION_ONLY`          |      32 | Twelve both-valid and 20 NONE sketches have no reviewed primary/order or complete runnable input. |
| `ADAPT_TO_RANKING_CASE`    |       0 | No faithful direct transcription was established.                                                 |
| `DUPLICATIVE`              |       0 | No duplicate disposition was needed for this conservative triage.                                 |

The eight capability matrices are relationship evidence only. Their 21 overlapping
row lineages remain excluded from efficacy. No Phase 8A source was promoted to a
ranking label. All 41 runnable scenarios have `NEW_INDEPENDENT_SRS3` provenance,
and the 69 source lineages retain their SRS-3A dispositions. The SRS-2 and SRS-2.5
diagnostics remain outside this corpus. Exact normalized text comparison against
the Phase 8A row sketches, matrix text, and T1–T18 inputs found no copied input;
semantic independence remains subject to the separate corpus review.

## Corpus and review status

Raw `CoachingRequest` inputs, fixed actions, language observations, and fixture-only
settings are in `packages/test-fixtures/src/srs3-ranking-development.ts`. Capability
sets, primary and pairwise labels, provenance, family IDs, and reviewer rationale
are in `packages/skills/tests/fixtures/srs3/development-annotations.json`. Each
scenario has an exact revision and one family ID. R23 was reviewed at `R2` after
its selected intent gained a user-supplied current account state; the other party
only asks for status and timing. Private validation checks the raw
file, raw set, annotation file, triage file, catalog manifest, and SRS-3A manifest
digests. The annotation file has no conversation or draft text. Separate fixture-only
`authoring-metadata.json` classifies boundary explicitness for every case and draft
realism for every rewrite. It binds all 41 raw revisions and the serialized raw-set
hash, but is never passed to `CoachingRequest`, `SkillContext`, normalization, or
retrieval.

| Binding                     | SHA-256                                                            |
| --------------------------- | ------------------------------------------------------------------ |
| Raw source file             | `a185d8f050e6f8dca583254ba9b0211fd843fbc24d22e4fac12354a2eb8adbe7` |
| Serialized raw set          | `efce60f7eef73609fcdf1c4080d21e93dba43c57c1d59873c0549306bf3cbdcf` |
| Annotation file             | `b4b8920b27c1f025c8027f785ab6c9e3b79b07af3fea05c1af4ac810529b60d6` |
| Authoring metadata          | `08597a038d350c50580cde3addb7eef14f19f8bc97257e70b4e140dab849f3b6` |
| Triage file                 | `e513ec03da3c4cada5bdf3248224b72eba5385f16174ce8358063625886a3267` |
| Production catalog manifest | `f53d78d4866a386fd544e0cf3a9e3b76373e49e265c7fc9a180b866871a8eb72` |

| Measure                                | Count |
| -------------------------------------- | ----: |
| Raw synthetic scenarios/families       |    41 |
| Accepted English cases/families        |    29 |
| Quarantined language cases             |    12 |
| Accepted `REWRITE_DRAFT`               |    14 |
| Accepted empty-draft `SUGGEST_REPLY`   |    14 |
| Accepted non-wording `NO_REPLY_NEEDED` |     1 |
| Accepted strict `NONE`                 |     4 |
| Accepted multi-required, no-order      |     7 |
| Accepted primary labels                |    18 |
| Authored pairwise order edges          |    11 |

The four `NONE` families cover receipt acknowledgement, ordinary social exchange,
neutral information, and a closed conversation with no reply action. R13, R15,
R19, and R22–R25 have two required capabilities and no primary or pairwise order.
The 29 English annotations have `CODEX_SEMANTIC_REVIEW` bound to their exact revisions, a separate
case-specific rationale, and recorded checks for intent, facts, commitments,
certainty, and responsibility. This is **Codex review**, not human approval or a
claim of independent review. The 12 Chinese annotations have reviewer `NONE`, no
preservation attestation, and `INSUFFICIENT_EVIDENCE`; they are excluded from every
accepted denominator.

## Remediation and fresh semantic review

The four blocking accepted cases were re-read against their revised raw input and
the frozen capability boundaries. None retains an unsupported neighbor order:

| Case | Before | After and rationale |
| ---- | ------ | ------------------- |
| R01 | `request` required; `clarification` acceptable; `request > clarification` | `request` only; reporting which export format was used is a request, not resolution of a material ambiguity. Rough draft keeps both requested actions. |
| R13 | `planning` required and primary; `status_update` acceptable; `planning > status_update` | Both required, no primary/order; the question asks status, while the draft also coordinates Thursday's comparison. Rough wording preserves completed screen-reader work, keyboard issues, and sequencing before assigning fixes. |
| R15 | Apology primary over acceptable mistake acknowledgment; draft asserted “I know that hurt you” | Both required, no primary/order; R2 preserves apology, owned calendar omission, and the visible consequence that the recipient waited, but removes the inferred feeling. |
| R19 | Status primary over acceptable expectation setting | Both required, no primary/order; the question and R2 draft address both current count and uncertain future timing, including the later confirmation commitment. |

The exact pre-coaching draft changes for the four blocking cases are:

| Case | R1 draft | R2 draft |
| ---- | -------- | -------- |
| R01 | “Please run the weekly inventory export, and tell me whether you used the CSV or JSON format.” | “pls run the weekly inventory export and lmk if u used csv or json” |
| R13 | “The screen reader pass is done. Let's compare the remaining keyboard issues on Thursday before assigning fixes.” | “screen reader pass done. lets compare the remaining keyboard issues thurs before assigning fixes” |
| R15 | “I'm sorry I missed your recital. I forgot to put it on my calendar, and I know that hurt you.” | “sorry i missed your recital. forgot to put it in my calendar. you ended up waiting for me” |
| R19 | “We have counted three of five aisles. The remaining count may take until tomorrow; I'll confirm a delivery window after the last aisle.” | “3 of 5 aisles counted. rest might take till tomorrow, ill confirm the delivery window after the last one” |

The other realism revisions are R03 (photo/help request), R05 (reservation
follow-up), R07 (lunch limit), R09 (reply limit/calm tone), R21 (3:30 microphone
test/adapter request), R22 (Sunday visit/train-dependent time), and R24 (music
conflict/10 p.m. limit). All seven are raw/review R2; their wording changed but
their capability labels did not.

The other changed English rewrites were freshly checked against the same intent,
fact, responsibility, commitment, certainty, decision, timing, and capability
ledger. R03 retains the photo request and conditional identification help; R05
retains the prior unanswered reservation follow-up; R07 retains today's refusal
and ongoing lunch limit; R09 retains work-hours availability, lack of immediate
reply guarantee, and calm tone; R21 retains the 3:30 after-demo test and adapter
ask; R22 retains Sunday, after-lunch uncertainty, and train-dependent scheduling;
R24 retains de-escalation and the 10 p.m. quiet limit. Their existing labels and
pairwise claims remain supported. R11, R17, and R27 were intentionally left as
plausible already-decent user drafts. Chinese/code-switch rewrites R31, R33, R34,
R36, R38, and R40 were classified but not altered without qualified language
review. No scenario was added solely to restore an inverse or count.

The 20 rewrite drafts are classified as **7 ROUGH, 7 NORMAL, 6 ALREADY_DECENT,
0 OVER_POLISHED**; the accepted English subset is 7/4/3/0. This authoring judgment
is not a ranking feature or a claim about real-user frequency. Of the 29 accepted
cases, **5 are EXPLICIT** (all `SUGGEST_REPLY`) and **24 IMPLICIT**: rewrite 0/14,
suggest 5/9, no-reply 0/1. The explicit/implicit split remains available for
later subgroup reporting; no subgroup ranking metric was calculated here.

R30 now presents an ambiguous existing appointment instead of two selectable
slots. R39 and R41 now have visibly mixed Chinese/English messages consistent
with their code-switch observation. R41 no longer marks a redundant
`status_update` acceptable when the user's job is to communicate an unconfirmed
ETA. These are structural corrections only: all 12 language cases remain
`QUARANTINE`, reviewer `NONE`, outside efficacy denominators pending qualified
native-language review. R30/R39/R41 are raw R2 but have no approved reviewed
revision or preservation attestation.

## Priority pair coverage

The central columns count primary cases only when the opposing skill is also
supported. Hard-negative primary cases with a forbidden neighbor are separate;
they do not establish a pairwise order. The columns below report actual supported
pairwise edges and both-valid/no-order cases, not target quotas.

| A / B                               | A>B | B>A | Both-valid/no-order |
| ----------------------------------- | --: | --: | ------------------: |
| request / clarification             |   0 |   1 |                   0 |
| request / ask_for_help              |   1 |   1 |                   0 |
| follow_up / request                 |   1 |   0 |                   0 |
| boundary_setting / decline          |   1 |   0 |                   0 |
| boundary_setting / de_escalation    |   1 |   0 |                   1 |
| planning / expectation_setting      |   1 |   0 |                   1 |
| planning / status_update            |   0 |   0 |                   1 |
| apology / acknowledge_mistake       |   0 |   1 |                   2 |
| emotional_validation / reassurance  |   1 |   1 |                   0 |
| status_update / expectation_setting |   0 |   1 |                   2 |

One-sided coverage is retained where the other candidate is forbidden, absent,
or the two operations are co-central. No reverse edge was manufactured to replace
the four removed edges. The secondary request/planning, clarification/ask_for_help,
decline/planning, and boundary_setting/expectation_setting pairs remain deferred.

## Mode, language, and setting coverage

| Dimension                      | Raw | Accepted |
| ------------------------------ | --: | -------: |
| English                        |  29 |       29 |
| Simplified Chinese             |   4 |        0 |
| Traditional Chinese            |   4 |        0 |
| Chinese/English code switching |   4 |        0 |
| Work                           |  16 |       11 |
| Personal                       |  14 |       10 |
| Service                        |  11 |        8 |

Setting and the separate explicitness/draft-realism metadata are authoring-only.
They are never passed into `CoachingRequest`,
`SkillContext`, normalization, or retrieval. The raw-only observation path passes
the current private `SRS_2_5_PROPOSED` normalization profile and existing SRS-2
shadow retriever a production-only catalog. Annotation removal or reversal does
not change those raw observation bytes. Modifier and unresolved candidate IDs
cannot enter capability labels. Production remains on `CURRENT`.

## Validation and remaining gates

The private tests cover frozen provenance, all 69 triage bindings, 21 matrix
overlaps, catalog and action eligibility, draft/action/language agreement, strict
`NONE`, pair cycles, revision/family bindings, duplicate-family weighting, raw-only
label isolation, authoring-metadata revision and mode binding, and exact copied
input text. Focused SRS-3B/SRS-3A/SRS-2/SRS-2.5 checks passed 41 tests in four
files. Full `pnpm test` passed 474 tests in 35 files. `pnpm skills:check`,
`pnpm skills:verify-production`, `pnpm lint`, `pnpm typecheck`, `pnpm build`,
`pnpm format:check`, and `git -c core.safecrlf=false diff --check` passed.
Two independent raw-to-report loads yielded identical SHA-256
`7ecd4440e591c6b234ba9b37090709074fb856f59c2b52061da43c303a22d29e`.
Production verification confirmed 21 exact definitions and 153 frozen plans.

Qualified native-language review remains the explicit blocker for the three
Chinese coverage targets. `COMPLETE_DRAFT` has no scored case. A **fresh
independent corpus audit** must evaluate the revised English labels, realistic
drafts, and remaining one-sided distinctions before freeze or SRS-3C. Held-out
evidence is `NOT_AUTHORED`, unread, and unscored. No SRS-3C baseline was run.
