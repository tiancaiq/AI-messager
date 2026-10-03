# SRS-2/SRS-3 additional exposed-development diagnostics

Date: 2026-09-27  
Status: diagnostic evidence only  
Split: exposed development, not held out  
Top-K: 10  
Catalog: `PRODUCTION_PLUS_EVALUATION`

## Method and boundaries

These 18 supplied cases were run through the existing SRS-2 shadow retriever. The
supplied `AgentAction` was held fixed. Intent and situation tags came from the
current `deriveSkillContext()` path, with Phase 8 candidate normalization enabled
for the evaluation-only candidates. No tags were manually repaired before the run.

The catalog contains the 21 production definitions plus the revision-bound
`perspective_acknowledgement` and `give_constructive_feedback` evaluation overlays.
The candidate definitions remain outside production. `confirmation` is not present
in this catalog and is reported as `NOT_IN_CATALOG` rather than silently ignored.

This report changes no production behavior, retrieval logic, threshold, metadata,
skill definition, schema, or generated registry. Scores remain coarse ranking
signals, not confidence or probability.

Notation:

- `I` = `INTENT_MATCH`; `S` = `SITUATION_MATCH`.
- Pool = `hard-eligible / positive-signal / returned Top-K`.
- Expected trace is shown as legacy / signal-only.
- `#N` = retained at rank N.
- `RC[LI,LS,NSE]` = `RETRIEVAL_CUTOFF` with
  `LEGACY_INTENT_ADMISSION_FAILED`,
  `LEGACY_SITUATION_ADMISSION_FAILED`, and `NO_SUPPORTING_EVIDENCE`.
- `RC[NSE]` = `RETRIEVAL_CUTOFF` with `NO_SUPPORTING_EVIDENCE`.
- `NIC` = `NOT_IN_CATALOG`.

The diagnostic question is: **Did retrieval expose the capabilities that a later
supervisor should reasonably consider?**

## Summary

| Measure | `LEGACY_METADATA_GATE` | `SIGNAL_ONLY` |
| --- | ---: | ---: |
| Required labels retrieved | 16/23 (69.6%) | 18/23 (78.3%) |
| Scenarios with all required labels | 9/15 (60.0%) | 10/15 (66.7%) |
| Mean positive-signal pool | 1.56 | 3.11 |
| Strict `NONE` preserved | 1/2 | 1/2 |
| Maximum positive-signal pool | 5 | 7 |

No pool reached 10, so no expected capability disappeared at `TOP_K_CUTOFF`.
Observed misses are retrieval-evidence or upstream-normalization failures, not Top-K
ranking failures.

## Per-case diagnostics

### T1 — Missed deadline with several legitimate capabilities

- Fixed action: `REWRITE_DRAFT`
- Normalized tags: intents `decline`, `provide_status`, `set_expectation`, `plan`;
  situations `status_request`, `planning`, `invitation`
- Expected: required `acknowledge_mistake`, `status_update`,
  `expectation_setting`; acceptable `apology`, `follow_up`; forbidden `reassurance`
- Eligible modifiers: `en.casual_naturalness`, `en.direct_but_polite`,
  `en.professional_conciseness`
- Legacy pool `16 / 4 / 4`; Top 10: #1 `decline` 22 (I+S), #2
  `expectation_setting` 22 (I+S), #3 `planning` 22 (I+S), #4 `status_update`
  22 (I+S)
- Signal-only pool `16 / 4 / 4`; Top 10: identical to legacy
- Expected trace (legacy / signal):
  - required `acknowledge_mistake`: `RC[LI,LS,NSE]` / `RC[NSE]`
  - required `status_update`: #4 / #4
  - required `expectation_setting`: #2 / #2
  - acceptable `apology`: `RC[LI,LS,NSE]` / `RC[NSE]`
  - acceptable `follow_up`: `RC[LI,LS,NSE]` / `RC[NSE]`
  - forbidden `reassurance`: `RC[LI,LS,NSE]` / `RC[NSE]`
- Neighbor observation: `decline` and `planning` tie the valid status capabilities,
  while ownership and follow-up signals are absent.
- Verdict: **Partial.** Two of three required capabilities are exposed; a supervisor
  cannot recover `acknowledge_mistake` from this pool.

### T2 — Boundary vs decline vs de-escalation

- Fixed action: `REWRITE_DRAFT`
- Normalized tags: intents `set_boundary`, `decline`, `provide_status`; situations
  `status_request`, `pressure`
- Expected: required `boundary_setting`; acceptable `decline`, `de_escalation`;
  forbidden `apology`, `reassurance`
- Eligible modifiers: English modifier trio
- Legacy pool `16 / 2 / 2`; Top 10: #1 `boundary_setting` 22 (I+S), #2
  `status_update` 22 (I+S)
- Signal-only pool `16 / 5 / 5`; Top 10: #1 `boundary_setting` 22 (I+S), #2
  `status_update` 22 (I+S), #3 `decline` 12 (I), #4 `de_escalation` 10 (S),
  #5 `expectation_setting` 10 (S)
- Expected trace (legacy / signal): required `boundary_setting` #1 / #1;
  acceptable `decline` `RC[LS]` / #3; acceptable `de_escalation` `RC[LI]` / #4;
  forbidden `apology` and `reassurance` each `RC[LI,LS,NSE]` / `RC[NSE]`.
- Neighbor observation: signal-only exposes the intended three-way decision, but
  `status_update` is a tied false neighbor caused by the normalized status tags.
- Verdict: **Yes, in signal-only.** Boundary remains first and both legitimate
  alternatives are available to a supervisor.

### T3 — Constructive feedback vs request vs boundary

- Fixed action: `REWRITE_DRAFT`
- Normalized tags: intents `make_request`, `give_feedback`; situation `request`
- Expected: required `give_constructive_feedback`; acceptable `request`,
  `boundary_setting`; forbidden `apology`, `reassurance`
- Eligible modifiers: English modifier trio
- Legacy pool `16 / 2 / 2`; Top 10: #1 `request` 22 (I+S), #2
  `give_constructive_feedback` 12 (I)
- Signal-only pool `16 / 5 / 5`; Top 10: #1 `request` 22 (I+S), #2
  `give_constructive_feedback` 12 (I), #3 `ask_for_help` 10 (S), #4
  `clarification` 10 (S), #5 `decline` 10 (S)
- Expected trace (legacy / signal): required `give_constructive_feedback` #2 / #2;
  acceptable `request` #1 / #1; acceptable `boundary_setting` `RC[LI,LS,NSE]` /
  `RC[NSE]`; forbidden `apology` and `reassurance` each `RC[LI,LS,NSE]` /
  `RC[NSE]`.
- Neighbor observation: the request formulation outranks the feedback operation;
  signal-only also admits three generic request-situation neighbors.
- Verdict: **Partial.** The required candidate is visible, but later supervision
  must distinguish it from the stronger coarse `request` score.

### T4 — Perspective acknowledgement vs emotional validation

- Fixed action: `REWRITE_DRAFT`
- Normalized tags: intents `plan`, `acknowledge_perspective`; situation `planning`
- Expected: required `perspective_acknowledgement`; acceptable `de_escalation`;
  forbidden `emotional_validation`, `apology`
- Eligible modifiers: English modifier trio
- Legacy pool `16 / 2 / 2`; Top 10: #1 `planning` 22 (I+S), #2
  `perspective_acknowledgement` 12 (I)
- Signal-only pool `16 / 3 / 3`; Top 10: #1 `planning` 22 (I+S), #2
  `perspective_acknowledgement` 12 (I), #3 `expectation_setting` 10 (S)
- Expected trace (legacy / signal): required `perspective_acknowledgement` #2 / #2;
  acceptable `de_escalation` `RC[LI,LS,NSE]` / `RC[NSE]`; forbidden
  `emotional_validation` and `apology` each `RC[LI,LS,NSE]` / `RC[NSE]`.
- Neighbor observation: the emotional-validation boundary holds, but the word
  “schedule” creates an unrelated planning concept that outranks the candidate.
- Verdict: **Partial.** The candidate is exposed and the critical forbidden neighbor
  is absent, but ranking evidence is noisy.

### T5 — Emotion vs perspective

- Fixed action: `SUGGEST_REPLY`
- Normalized tags: intent `validate_emotion`; situation `emotional_support`
- Expected: required `emotional_validation`; acceptable `reassurance`; forbidden
  `perspective_acknowledgement`, `planning`
- Eligible modifiers: English modifier trio
- Legacy pool `16 / 1 / 1`; Top 10: #1 `emotional_validation` 22 (I+S)
- Signal-only pool `16 / 2 / 2`; Top 10: #1 `emotional_validation` 22 (I+S), #2
  `reassurance` 10 (S)
- Expected trace (legacy / signal): required `emotional_validation` #1 / #1;
  acceptable `reassurance` `RC[LI]` / #2; forbidden
  `perspective_acknowledgement` `RC[LI,NSE]` / `RC[NSE]`; forbidden `planning`
  `RC[LI,LS,NSE]` / `RC[NSE]`.
- Neighbor observation: the inverse candidate boundary works; signal-only adds the
  reasonable reassurance neighbor without admitting perspective acknowledgement.
- Verdict: **Yes.** Signal-only exposes the appropriate supervisory choice set.

### T6 — Apology vs acknowledge mistake

- Fixed action: `REWRITE_DRAFT`
- Normalized tags: no intents; no situations
- Expected: required `acknowledge_mistake`; acceptable `apology`; forbidden
  `emotional_validation`
- Eligible modifiers: English modifier trio
- Legacy pool `16 / 0 / 0`; Top 10: none
- Signal-only pool `16 / 0 / 0`; Top 10: none
- Expected trace (legacy / signal): required `acknowledge_mistake`, acceptable
  `apology`, and forbidden `emotional_validation` each `RC[LI,LS,NSE]` /
  `RC[NSE]`.
- Neighbor observation: this is not a ranking failure. “Wrong numbers” and “used the
  old figures” produce no current mistake/ownership tag.
- Verdict: **No.** The supervisor receives no capability evidence.

### T7 — Apology without unsupported responsibility

- Fixed action: `REWRITE_DRAFT`
- Normalized tags: intent `plan`; situation `planning`
- Expected: required none; acceptable `follow_up`; forbidden `apology`,
  `acknowledge_mistake`
- Eligible modifiers: English modifier trio
- Legacy pool `16 / 1 / 1`; Top 10: #1 `planning` 22 (I+S)
- Signal-only pool `16 / 2 / 2`; Top 10: #1 `planning` 22 (I+S), #2
  `expectation_setting` 10 (S)
- Expected trace (legacy / signal): acceptable `follow_up` `RC[LI,LS,NSE]` /
  `RC[NSE]`; forbidden `apology` and `acknowledge_mistake` each
  `RC[LI,LS,NSE]` / `RC[NSE]`.
- Neighbor observation: ownership safety holds, but “meeting” causes an unrelated
  planning pool and the acceptable follow-up is not exposed.
- Verdict: **Partial.** It avoids the dangerous ownership capabilities, but the pool
  is not semantically useful for the intended follow-up option.

### T8 — Status vs expectation vs planning

- Fixed action: `REWRITE_DRAFT`
- Normalized tags: intents `decline`, `provide_status`, `set_expectation`; situation
  `status_request`
- Expected: required `status_update`, `expectation_setting`; acceptable `follow_up`;
  forbidden `planning`, `reassurance`
- Eligible modifiers: English modifier trio
- Legacy pool `16 / 2 / 2`; Top 10: #1 `expectation_setting` 22 (I+S), #2
  `status_update` 22 (I+S)
- Signal-only pool `16 / 3 / 3`; Top 10: #1 `expectation_setting` 22 (I+S), #2
  `status_update` 22 (I+S), #3 `decline` 12 (I)
- Expected trace (legacy / signal): required `status_update` #2 / #2; required
  `expectation_setting` #1 / #1; acceptable `follow_up` `RC[LI,LS,NSE]` /
  `RC[NSE]`; forbidden `planning` and `reassurance` each `RC[LI,LS,NSE]` /
  `RC[NSE]`.
- Neighbor observation: both required capabilities are strong and planning remains
  absent. Signal-only exposes a false `decline` neighbor from “won't finish.”
- Verdict: **Yes.** The primary supervisory choices are present and highly ranked.

### T9 — Planning vs expectation setting

- Fixed action: `SUGGEST_REPLY`
- Normalized tags: intent `plan`; situation `planning`
- Expected: required `planning`; acceptable none; forbidden `expectation_setting`,
  `status_update`
- Eligible modifiers: English modifier trio
- Legacy pool `16 / 1 / 1`; Top 10: #1 `planning` 22 (I+S)
- Signal-only pool `16 / 2 / 2`; Top 10: #1 `planning` 22 (I+S), #2
  `expectation_setting` 10 (S)
- Expected trace (legacy / signal): required `planning` #1 / #1; forbidden
  `expectation_setting` `RC[LI]` / #2; forbidden `status_update`
  `RC[LI,LS,NSE]` / `RC[NSE]`.
- Neighbor observation: signal-only exposes a forbidden neighbor solely from shared
  planning-situation metadata.
- Verdict: **Partial.** The required capability is clear, but SRS-3 must reject the
  situation-only expectation-setting neighbor.

### T10 — Clarification vs request

- Fixed action: `REWRITE_DRAFT`
- Normalized tags: intent `plan`; situations `planning`, `request`
- Expected: required `clarification`; acceptable none; forbidden `request`,
  `planning`
- Eligible modifiers: English modifier trio
- Legacy pool `16 / 1 / 1`; Top 10: #1 `planning` 22 (I+S)
- Signal-only pool `16 / 6 / 6`; Top 10: #1 `planning` 22 (I+S), #2
  `ask_for_help` 10 (S), #3 `clarification` 10 (S), #4 `decline` 10 (S), #5
  `expectation_setting` 10 (S), #6 `request` 10 (S)
- Expected trace (legacy / signal): required `clarification` `RC[LI]` / #3;
  forbidden `request` `RC[LI]` / #6; forbidden `planning` #1 / #1.
- Neighbor observation: signal-only rescues clarification from situation evidence,
  but a forbidden planning capability dominates and the actual `clarify` intent is
  absent.
- Verdict: **Partial.** Only signal-only gives a supervisor the required option, and
  the pool is substantially confused.

### T11 — Request vs clarification hard neighbor

- Fixed action: `SUGGEST_REPLY`
- Selected intent: “Ask them to send it to you.”
- Normalized tags: no intents; no situations
- Expected: required `request`; acceptable none; forbidden `clarification`
- Eligible modifiers: English modifier trio
- Legacy pool `16 / 0 / 0`; Top 10: none
- Signal-only pool `16 / 0 / 0`; Top 10: none
- Expected trace (legacy / signal): required `request` `RC[LI,LS,NSE]` /
  `RC[NSE]`; forbidden `clarification` `RC[LI,LS,NSE]` / `RC[NSE]`.
- Neighbor observation: the selected intent does not match the current narrow
  request-expression pattern, so neither retrieval policy has evidence to rank.
- Verdict: **No.** The supervisor cannot select `request` because it is absent.

### T12 — Follow-up vs request

- Fixed action: `REWRITE_DRAFT`
- Normalized tags: intents `follow_up`, `plan`; situations `planning`, `follow_up`,
  `request`
- Expected: required `follow_up`; acceptable `request`; forbidden `status_update`
- Eligible modifiers: English modifier trio
- Legacy pool `16 / 2 / 2`; Top 10: #1 `follow_up` 22 (I+S), #2 `planning` 22
  (I+S)
- Signal-only pool `16 / 7 / 7`; Top 10: #1 `follow_up` 22 (I+S), #2
  `planning` 22 (I+S), #3 `ask_for_help` 10 (S), #4 `clarification` 10 (S), #5
  `decline` 10 (S), #6 `expectation_setting` 10 (S), #7 `request` 10 (S)
- Expected trace (legacy / signal): required `follow_up` #1 / #1; acceptable
  `request` `RC[LI]` / #7; forbidden `status_update` `RC[LI,LS,NSE]` /
  `RC[NSE]`.
- Neighbor observation: follow-up is correctly strongest. Signal-only exposes the
  acceptable request but also five coarse neighbors, including a tied planning
  capability caused by “when.”
- Verdict: **Yes, with noise.** A supervisor can choose follow-up and consider
  request, but must suppress unrelated situation-only candidates.

### T13 — Pure request, not follow-up

- Fixed action: `REWRITE_DRAFT`
- Normalized tags: intent `make_request`; situation `request`
- Expected: required `request`; acceptable none; forbidden `follow_up`
- Eligible modifiers: English modifier trio
- Legacy pool `16 / 1 / 1`; Top 10: #1 `request` 22 (I+S)
- Signal-only pool `16 / 4 / 4`; Top 10: #1 `request` 22 (I+S), #2
  `ask_for_help` 10 (S), #3 `clarification` 10 (S), #4 `decline` 10 (S)
- Expected trace (legacy / signal): required `request` #1 / #1; forbidden
  `follow_up` `RC[LI,LS,NSE]` / `RC[NSE]`.
- Neighbor observation: the request/follow-up inverse is preserved; signal-only
  adds generic request-situation neighbors but not follow-up.
- Verdict: **Yes.** The required capability is first and the hard neighbor is absent.

### T14 — Chinese professional status and modifiers

- Fixed action: `REWRITE_DRAFT`
- Normalized tags: intents `decline`, `provide_status`, `set_expectation`; situation
  `status_request`
- Expected: required `status_update`, `expectation_setting`; acceptable `follow_up`;
  forbidden `reassurance`
- Eligible modifiers: `zh.natural_conciseness`, `zh.politeness_calibration`,
  `zh.professional_formality`
- Legacy pool `16 / 2 / 2`; Top 10: #1 `expectation_setting` 22 (I+S), #2
  `status_update` 22 (I+S)
- Signal-only pool `16 / 3 / 3`; Top 10: #1 `expectation_setting` 22 (I+S), #2
  `status_update` 22 (I+S), #3 `decline` 12 (I)
- Expected trace (legacy / signal): required `status_update` #2 / #2; required
  `expectation_setting` #1 / #1; acceptable `follow_up` `RC[LI,LS,NSE]` /
  `RC[NSE]`; forbidden `reassurance` `RC[LI,LS,NSE]` / `RC[NSE]`.
- Neighbor observation: capability retrieval and modifier eligibility remain
  separate. `不想` introduces a false `decline` intent in signal-only.
- Verdict: **Yes.** Both required capabilities are exposed, and all Chinese
  modifiers stay outside capability Top-K.

### T15 — Mixed Chinese and English

- Fixed action: `REWRITE_DRAFT`
- Normalized tags: intent `plan`; situation `planning`
- Expected: required `status_update`, `expectation_setting`; acceptable `follow_up`,
  `planning`; forbidden none
- Eligible modifiers: `en.casual_naturalness`, `en.direct_but_polite`,
  `en.professional_conciseness`, `zh.code_switching`,
  `zh.natural_conciseness`, `zh.politeness_calibration`,
  `zh.professional_formality`
- Legacy pool `16 / 1 / 1`; Top 10: #1 `planning` 22 (I+S)
- Signal-only pool `16 / 2 / 2`; Top 10: #1 `planning` 22 (I+S), #2
  `expectation_setting` 10 (S)
- Expected trace (legacy / signal): required `status_update` `RC[LI,LS,NSE]` /
  `RC[NSE]`; required `expectation_setting` `RC[LI]` / #2; acceptable `follow_up`
  `RC[LI,LS,NSE]` / `RC[NSE]`; acceptable `planning` #1 / #1.
- Neighbor observation: `zh.code_switching` remains correctly isolated in the
  modifier lane. Status evidence is not normalized, so the required status
  capability never enters either pool.
- Verdict: **Partial.** Signal-only exposes one required and one acceptable
  capability; it cannot recover `status_update`.

### T16 — Strict `NONE`: ordinary social exchange

- Fixed action: `REWRITE_DRAFT`
- Normalized tags: no intents; no situations
- Expected: required none; acceptable none; forbidden `emotional_validation`,
  `reassurance`, `clarification`, `planning`, `request`; strict `NONE` true
- Eligible modifiers: English modifier trio, kept in the modifier lane
- Legacy pool `16 / 0 / 0`; Top 10: none
- Signal-only pool `16 / 0 / 0`; Top 10: none
- Expected trace (legacy / signal): every forbidden capability
  `RC[LI,LS,NSE]` / `RC[NSE]`.
- Neighbor observation: no weak overlap manufactures a capability.
- Verdict: **Yes.** Strict `NONE` is preserved in both modes.

### T17 — Strict `NONE`: acknowledgement only

- Fixed action: `REWRITE_DRAFT`
- Normalized tags: intent `plan`; situation `planning`
- Expected: required none; acceptable none; forbidden `planning`, `confirmation`,
  `status_update`, `follow_up`; strict `NONE` true
- Eligible modifiers: English modifier trio
- Legacy pool `16 / 1 / 1`; Top 10: #1 `planning` 22 (I+S)
- Signal-only pool `16 / 2 / 2`; Top 10: #1 `planning` 22 (I+S), #2
  `expectation_setting` 10 (S)
- Expected trace (legacy / signal): forbidden `planning` #1 / #1; forbidden
  `confirmation` NIC / NIC; forbidden `status_update` and `follow_up` each
  `RC[LI,LS,NSE]` / `RC[NSE]`.
- Neighbor observation: the word “Meeting” is enough for current normalization to
  manufacture a planning intent and situation from a simple acknowledgement.
- Verdict: **No.** Strict `NONE` fails in both modes. `confirmation` cannot be
  evaluated because it is not in the catalog.

### T18 — Maximum-confusion stress case

- Fixed action: `REWRITE_DRAFT`
- Normalized tags: intents `apologize`, `acknowledge_mistake`, `decline`,
  `provide_status`, `set_expectation`; situations `mistake`, `missed_commitment`,
  `status_request`, `invitation`
- Expected: required `acknowledge_mistake`, `status_update`,
  `expectation_setting`, `boundary_setting`; acceptable `apology`, `follow_up`,
  `de_escalation`; forbidden `reassurance`
- Eligible modifiers: English modifier trio
- Legacy pool `16 / 5 / 5`; Top 10: #1 `acknowledge_mistake` 22 (I+S), #2
  `apology` 22 (I+S), #3 `decline` 22 (I+S), #4 `expectation_setting` 22
  (I+S), #5 `status_update` 22 (I+S)
- Signal-only pool `16 / 6 / 6`; Top 10: the same first five, then #6 `planning`
  10 (S)
- Expected trace (legacy / signal): required `acknowledge_mistake` #1 / #1;
  required `status_update` #5 / #5; required `expectation_setting` #4 / #4;
  required `boundary_setting` `RC[LI,LS,NSE]` / `RC[NSE]`; acceptable `apology`
  #2 / #2; acceptable `follow_up` and `de_escalation` each `RC[LI,LS,NSE]` /
  `RC[NSE]`; forbidden `reassurance` `RC[LI,LS,NSE]` / `RC[NSE]`.
- Neighbor observation: Top 5 contains all three retrieved required capabilities,
  but not all four required capabilities because `boundary_setting` never enters
  the positive-signal pool. Signal-only adds planning rather than repairing the
  missing boundary evidence.
- Verdict: **Partial, and not sufficient for the stress case.** SRS-3 cannot select
  a capability that retrieval never exposes.

## Cross-case findings for SRS-3

1. **Signal-only improves recall but cannot repair missing normalized evidence.** It
   recovers `clarification` in T10 and `expectation_setting` in T15, but T1
   `acknowledge_mistake`, T6 `acknowledge_mistake`, T11 `request`, T15
   `status_update`, and T18 `boundary_setting` remain absent.
2. **Several failures occur before ranking.** Empty or incorrect normalized tags in
   T6, T11, and T17 determine the pool before any future supervisor runs. These
   should be classified separately from SRS-3 ranking/supervision failures.
3. **Situation-only expansion is useful but noisy.** It exposes legitimate
   `de_escalation`, `reassurance`, `clarification`, `request`, and
   `expectation_setting` neighbors, while also admitting forbidden or irrelevant
   capabilities in T9, T10, T12, and T17.
4. **The coarse 12/10 score cannot express semantic primacy.** `request` outranks
   `give_constructive_feedback` in T3, and planning outranks
   `perspective_acknowledgement` in T4. These are appropriate SRS-3 discrimination
   cases, not reasons to tune SRS-2 scores now.
5. **Strict `NONE` needs an explicit supervisory invariant.** T16 passes naturally;
   T17 demonstrates that weak lexical scheduling evidence can defeat strict `NONE`
   before supervision.
6. **Top 5 is not the limiting issue in T18.** Three required capabilities are in
   Top 5, but the fourth has no supporting evidence. Increasing K would not recover
   it.
7. **Modifier separation holds.** Chinese, English, and code-switching modifiers
   never consume capability positions, including T14 and T15.

The cases should remain together as a development diagnostic batch. They should not
be promoted to held-out evidence, and no single-case metadata edit should be made
from this report.
