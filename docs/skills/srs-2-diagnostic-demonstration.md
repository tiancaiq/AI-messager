# SRS-2 diagnostic demonstration

Date: 2026-09-27  
Mode: evaluation/shadow only  
Top-K: 10  
Catalog: 21 production definitions plus the two revision-bound Phase 8 candidate overlays

## Boundary and method

This report runs the existing SRS-2 shadow retriever over 12 hand-picked, exposed
synthetic scenarios. It does not change `SkillEngine.select()`, production routing,
retrieval logic, thresholds, skill metadata, schemas, or generated registry bytes.
The candidate capabilities `perspective_acknowledgement` and
`give_constructive_feedback` remain evaluation-only overlays and are not activated
in production.

The fixed `AgentAction` and normalized context are inputs to retrieval, not outputs.
Capability scores are coarse relevance signals (`12` for an intent match and `10`
for a situation match); they are not probabilities or confidence. Language modifiers
are shown in a separate hard-eligibility lane and never consume capability Top-K
positions.

Ranking shorthand:

- `I` = `INTENT_MATCH`
- `S` = `SITUATION_MATCH`
- Pool counts are `hard-eligible / positive-signal / returned Top-K`.
- `retained #N` means the expected capability was present at rank N.

## Coverage summary

| # | Scenario | Assistance mode | Setting | Language | Special coverage |
| -: | --- | --- | --- | --- | --- |
| 1 | Missed commitment | Rewrite | Work | English | Multi-capability |
| 2 | Status request | Empty-draft suggest | Work | English | Partial-signal neighbors |
| 3 | Pressure and boundary | Rewrite | Work | English | Boundary/de-escalation neighbor |
| 4 | Emotional support | Empty-draft suggest | Personal | English | Validation/reassurance neighbor |
| 5 | Planning | Empty-draft suggest | Personal | English | Planning neighbor |
| 6 | Status update | Rewrite | Work | Simplified Chinese | Chinese modifiers |
| 7 | Status update | Empty-draft suggest | Service | Traditional Chinese | Regional language tag |
| 8 | Planning | Rewrite | Personal | Chinese + English | Code-switch modifier |
| 9 | Perspective acknowledgement | Rewrite | Work | English | Evaluation-only candidate |
| 10 | Constructive feedback | Empty-draft suggest | Service | Traditional Chinese | Evaluation-only candidate |
| 11 | Invitation choice | Non-wording action | Personal | English | Strict `NONE` |
| 12 | Request | Empty-draft suggest | Service | English | Request/feedback hard neighbor |

## Per-message diagnostics

### 1. Missed commitment rewrite

> Other: Can you finish today?  
> Draft: sry testing taking longer probably tomorrow

- Fixed `AgentAction`: `REWRITE_DRAFT`
- Context: work; English; intents `apologize`, `acknowledge_mistake`,
  `provide_status`, `set_expectation`; situations `mistake`,
  `missed_commitment`, `status_request`, `request`
- Expected capabilities: required `acknowledge_mistake`, `status_update`,
  `expectation_setting`; acceptable `apology`; forbidden `emotional_validation`
- Eligible modifiers, both modes: `en.casual_naturalness`,
  `en.direct_but_polite`, `en.professional_conciseness`
- Pools: legacy `16 / 4 / 4`; signal-only `16 / 8 / 8`

| Rank | `LEGACY_METADATA_GATE` | `SIGNAL_ONLY` |
| -: | --- | --- |
| 1 | `acknowledge_mistake` — 22 (I+S) | `acknowledge_mistake` — 22 (I+S) |
| 2 | `apology` — 22 (I+S) | `apology` — 22 (I+S) |
| 3 | `expectation_setting` — 22 (I+S) | `expectation_setting` — 22 (I+S) |
| 4 | `status_update` — 22 (I+S) | `status_update` — 22 (I+S) |
| 5 | — | `ask_for_help` — 10 (S) |
| 6 | — | `clarification` — 10 (S) |
| 7 | — | `decline` — 10 (S) |
| 8 | — | `request` — 10 (S) |

Expected-capability trace:

| Expectation | Capability | Legacy | Signal-only |
| --- | --- | --- | --- |
| Required | `acknowledge_mistake` | retained #1 | retained #1 |
| Required | `status_update` | retained #4 | retained #4 |
| Required | `expectation_setting` | retained #3 | retained #3 |
| Acceptable | `apology` | retained #2 | retained #2 |
| Forbidden | `emotional_validation` | `RETRIEVAL_CUTOFF`: legacy intent + situation admission failed; no supporting evidence | `RETRIEVAL_CUTOFF`: no supporting evidence |

Strict `NONE`: not expected; not returned in either mode.

### 2. Empty-draft status reply

> Other: Can you share a progress update?  
> Draft: empty

- Fixed `AgentAction`: `SUGGEST_REPLY`
- Context: work; English; intent `provide_status`; situations `status_request`,
  `request`
- Expected capabilities: required `status_update`; acceptable none; forbidden
  `apology`, `emotional_validation`
- Eligible modifiers, both modes: `en.casual_naturalness`,
  `en.direct_but_polite`, `en.professional_conciseness`
- Pools: legacy `16 / 1 / 1`; signal-only `16 / 6 / 6`

| Rank | `LEGACY_METADATA_GATE` | `SIGNAL_ONLY` |
| -: | --- | --- |
| 1 | `status_update` — 22 (I+S) | `status_update` — 22 (I+S) |
| 2 | — | `ask_for_help` — 10 (S) |
| 3 | — | `clarification` — 10 (S) |
| 4 | — | `decline` — 10 (S) |
| 5 | — | `expectation_setting` — 10 (S) |
| 6 | — | `request` — 10 (S) |

Expected-capability trace:

| Expectation | Capability | Legacy | Signal-only |
| --- | --- | --- | --- |
| Required | `status_update` | retained #1 | retained #1 |
| Forbidden | `apology` | `RETRIEVAL_CUTOFF`: legacy intent + situation admission failed; no supporting evidence | `RETRIEVAL_CUTOFF`: no supporting evidence |
| Forbidden | `emotional_validation` | `RETRIEVAL_CUTOFF`: legacy intent + situation admission failed; no supporting evidence | `RETRIEVAL_CUTOFF`: no supporting evidence |

Strict `NONE`: not expected; not returned in either mode.

### 3. Pressure and boundary neighbor

> Other: I already asked twice. You need to do this now.  
> Draft: I can't keep taking on extra work.

- Fixed `AgentAction`: `REWRITE_DRAFT`
- Context: work; English; intents `set_boundary`, `decline`; situation `pressure`
- Expected capabilities: required `boundary_setting`; acceptable `de_escalation`;
  forbidden `apology`, `give_constructive_feedback`
- Eligible modifiers, both modes: `en.casual_naturalness`,
  `en.direct_but_polite`, `en.professional_conciseness`
- Pools: legacy `16 / 1 / 1`; signal-only `16 / 3 / 3`

| Rank | `LEGACY_METADATA_GATE` | `SIGNAL_ONLY` |
| -: | --- | --- |
| 1 | `boundary_setting` — 22 (I+S) | `boundary_setting` — 22 (I+S) |
| 2 | — | `decline` — 12 (I) |
| 3 | — | `de_escalation` — 10 (S) |

Expected-capability trace:

| Expectation | Capability | Legacy | Signal-only |
| --- | --- | --- | --- |
| Required | `boundary_setting` | retained #1 | retained #1 |
| Acceptable | `de_escalation` | `RETRIEVAL_CUTOFF`: legacy intent admission failed | retained #3 |
| Forbidden | `apology` | `RETRIEVAL_CUTOFF`: legacy intent + situation admission failed; no supporting evidence | `RETRIEVAL_CUTOFF`: no supporting evidence |
| Forbidden | `give_constructive_feedback` | `RETRIEVAL_CUTOFF`: legacy intent admission failed; no supporting evidence | `RETRIEVAL_CUTOFF`: no supporting evidence |

Strict `NONE`: not expected; not returned in either mode.

### 4. Emotional support neighbor

> Other: I got terrible news and feel really upset.  
> Draft: empty

- Fixed `AgentAction`: `SUGGEST_REPLY`
- Context: personal; English; intent `validate_emotion`; situation
  `emotional_support`
- Expected capabilities: required `emotional_validation`; acceptable
  `reassurance`; forbidden `planning`, `perspective_acknowledgement`
- Eligible modifiers, both modes: `en.casual_naturalness`,
  `en.direct_but_polite`, `en.professional_conciseness`
- Pools: legacy `16 / 1 / 1`; signal-only `16 / 2 / 2`

| Rank | `LEGACY_METADATA_GATE` | `SIGNAL_ONLY` |
| -: | --- | --- |
| 1 | `emotional_validation` — 22 (I+S) | `emotional_validation` — 22 (I+S) |
| 2 | — | `reassurance` — 10 (S) |

Expected-capability trace:

| Expectation | Capability | Legacy | Signal-only |
| --- | --- | --- | --- |
| Required | `emotional_validation` | retained #1 | retained #1 |
| Acceptable | `reassurance` | `RETRIEVAL_CUTOFF`: legacy intent admission failed | retained #2 |
| Forbidden | `planning` | `RETRIEVAL_CUTOFF`: legacy intent + situation admission failed; no supporting evidence | `RETRIEVAL_CUTOFF`: no supporting evidence |
| Forbidden | `perspective_acknowledgement` | `RETRIEVAL_CUTOFF`: legacy intent admission failed; no supporting evidence | `RETRIEVAL_CUTOFF`: no supporting evidence |

Strict `NONE`: not expected; not returned in either mode.

### 5. Empty-draft personal planning

> Other: What time should we meet tomorrow?  
> Draft: empty

- Fixed `AgentAction`: `SUGGEST_REPLY`
- Context: personal; English; intent `plan`; situation `planning`
- Expected capabilities: required `planning`; acceptable none; forbidden
  `emotional_validation`, `de_escalation`
- Eligible modifiers, both modes: `en.casual_naturalness`,
  `en.direct_but_polite`, `en.professional_conciseness`
- Pools: legacy `16 / 1 / 1`; signal-only `16 / 2 / 2`

| Rank | `LEGACY_METADATA_GATE` | `SIGNAL_ONLY` |
| -: | --- | --- |
| 1 | `planning` — 22 (I+S) | `planning` — 22 (I+S) |
| 2 | — | `expectation_setting` — 10 (S) |

Expected-capability trace:

| Expectation | Capability | Legacy | Signal-only |
| --- | --- | --- | --- |
| Required | `planning` | retained #1 | retained #1 |
| Forbidden | `emotional_validation` | `RETRIEVAL_CUTOFF`: legacy intent + situation admission failed; no supporting evidence | `RETRIEVAL_CUTOFF`: no supporting evidence |
| Forbidden | `de_escalation` | `RETRIEVAL_CUTOFF`: legacy intent + situation admission failed; no supporting evidence | `RETRIEVAL_CUTOFF`: no supporting evidence |

Strict `NONE`: not expected; not returned in either mode.

### 6. Simplified Chinese status rewrite

> Other: 今天能发吗？  
> Draft: 可能明天

- Fixed `AgentAction`: `REWRITE_DRAFT`
- Context: work; Simplified Chinese family; intents `provide_status`,
  `set_expectation`; situation `status_request`
- Expected capabilities: required `status_update`; acceptable
  `expectation_setting`; forbidden none
- Eligible modifiers, both modes: `zh.natural_conciseness`,
  `zh.politeness_calibration`, `zh.professional_formality`
- Pools: legacy `16 / 2 / 2`; signal-only `16 / 2 / 2`

| Rank | `LEGACY_METADATA_GATE` | `SIGNAL_ONLY` |
| -: | --- | --- |
| 1 | `expectation_setting` — 22 (I+S) | `expectation_setting` — 22 (I+S) |
| 2 | `status_update` — 22 (I+S) | `status_update` — 22 (I+S) |

Expected-capability trace: `status_update` retained #2 and
`expectation_setting` retained #1 in both modes; no expected capability
disappeared.

Strict `NONE`: not expected; not returned in either mode.

### 7. Traditional Chinese empty-draft status reply

> Other: 進度呢？  
> Draft: empty

- Fixed `AgentAction`: `SUGGEST_REPLY`
- Context: service; Traditional Chinese (`zh-Hant`); intent `provide_status`;
  situation `status_request`
- Expected capabilities: required `status_update`; acceptable none; forbidden none
- Eligible modifiers, both modes: `zh.natural_conciseness`,
  `zh.politeness_calibration`, `zh.professional_formality`
- Pools: legacy `16 / 1 / 1`; signal-only `16 / 2 / 2`

| Rank | `LEGACY_METADATA_GATE` | `SIGNAL_ONLY` |
| -: | --- | --- |
| 1 | `status_update` — 22 (I+S) | `status_update` — 22 (I+S) |
| 2 | — | `expectation_setting` — 10 (S) |

Expected-capability trace: `status_update` retained #1 in both modes; no
expected capability disappeared.

Strict `NONE`: not expected; not returned in either mode.

### 8. Code-switched planning rewrite

> Other: 明天 meeting 幾點？  
> Draft: ok，那我大概 3 点过去

- Fixed `AgentAction`: `REWRITE_DRAFT`
- Context: personal; Chinese primary + English secondary; code-switching true;
  intent `plan`; situation `planning`
- Expected capabilities: required `planning`; acceptable none; forbidden none
- Eligible modifiers, both modes: `en.casual_naturalness`,
  `en.direct_but_polite`, `en.professional_conciseness`, `zh.code_switching`,
  `zh.natural_conciseness`, `zh.politeness_calibration`,
  `zh.professional_formality`
- Pools: legacy `16 / 1 / 1`; signal-only `16 / 2 / 2`

| Rank | `LEGACY_METADATA_GATE` | `SIGNAL_ONLY` |
| -: | --- | --- |
| 1 | `planning` — 22 (I+S) | `planning` — 22 (I+S) |
| 2 | — | `expectation_setting` — 10 (S) |

Expected-capability trace: `planning` retained #1 in both modes; no expected
capability disappeared.

Strict `NONE`: not expected; not returned in either mode.

### 9. Perspective acknowledgement candidate

> Other: I read the unannounced schedule change as a sign that my input did not matter.  
> Draft: I understand how the change looked, but that was not my intention.

- Fixed `AgentAction`: `REWRITE_DRAFT`
- Context: work; English; intent `acknowledge_perspective`; no situation tag
- Expected capabilities: required `perspective_acknowledgement`; acceptable none;
  forbidden `emotional_validation`
- Eligible modifiers, both modes: `en.casual_naturalness`,
  `en.direct_but_polite`, `en.professional_conciseness`
- Pools: legacy `16 / 1 / 1`; signal-only `16 / 1 / 1`

| Rank | `LEGACY_METADATA_GATE` | `SIGNAL_ONLY` |
| -: | --- | --- |
| 1 | `perspective_acknowledgement` — 12 (I) | `perspective_acknowledgement` — 12 (I) |

Expected-capability trace:

| Expectation | Capability | Legacy | Signal-only |
| --- | --- | --- | --- |
| Required | `perspective_acknowledgement` | retained #1 | retained #1 |
| Forbidden | `emotional_validation` | `RETRIEVAL_CUTOFF`: legacy intent + situation admission failed; no supporting evidence | `RETRIEVAL_CUTOFF`: no supporting evidence |

Strict `NONE`: not expected; not returned in either mode.

### 10. Constructive feedback candidate

> Other: 這批圖表的標籤有問題嗎？  
> User: 其中3張圖缺少標籤，讓我很難核對內容。  
> Draft: empty

- Fixed `AgentAction`: `SUGGEST_REPLY`
- Context: service; Traditional Chinese; intent `give_feedback`; no situation tag
- Expected capabilities: required `give_constructive_feedback`; acceptable
  `request`; forbidden `boundary_setting`
- Eligible modifiers, both modes: `zh.natural_conciseness`,
  `zh.politeness_calibration`, `zh.professional_formality`
- Pools: legacy `16 / 1 / 1`; signal-only `16 / 1 / 1`

| Rank | `LEGACY_METADATA_GATE` | `SIGNAL_ONLY` |
| -: | --- | --- |
| 1 | `give_constructive_feedback` — 12 (I) | `give_constructive_feedback` — 12 (I) |

Expected-capability trace:

| Expectation | Capability | Legacy | Signal-only |
| --- | --- | --- | --- |
| Required | `give_constructive_feedback` | retained #1 | retained #1 |
| Acceptable | `request` | `RETRIEVAL_CUTOFF`: legacy intent + situation admission failed; no supporting evidence | `RETRIEVAL_CUTOFF`: no supporting evidence |
| Forbidden | `boundary_setting` | `RETRIEVAL_CUTOFF`: legacy intent + situation admission failed; no supporting evidence | `RETRIEVAL_CUTOFF`: no supporting evidence |

Strict `NONE`: not expected; not returned in either mode.

### 11. Non-wording strict `NONE`

> Other: Want to come tonight?  
> Draft: empty

- Fixed `AgentAction`: `SUGGEST_ACTIONS`
- Context: personal; English; no intent tag; situation `invitation`
- Expected capabilities: required none; acceptable none; forbidden `decline`,
  `planning`
- Eligible modifiers, both modes: none
- Pools: legacy `0 / 0 / 0`; signal-only `0 / 0 / 0`

| Rank | `LEGACY_METADATA_GATE` | `SIGNAL_ONLY` |
| -: | --- | --- |
| — | none | none |

Expected-capability trace: both forbidden neighbors disappear at
`HARD_ELIGIBILITY` with `ACTION_INELIGIBLE` in both modes.

Strict `NONE`: expected and preserved in both modes.

### 12. Request versus constructive-feedback neighbor

> Other: Could you send the revised file by Friday?  
> Draft: empty

- Fixed `AgentAction`: `SUGGEST_REPLY`
- Context: service; English; intent `make_request`; situation `request`
- Expected capabilities: required `request`; acceptable none; forbidden
  `give_constructive_feedback`
- Eligible modifiers, both modes: `en.casual_naturalness`,
  `en.direct_but_polite`, `en.professional_conciseness`
- Pools: legacy `16 / 1 / 1`; signal-only `16 / 4 / 4`

| Rank | `LEGACY_METADATA_GATE` | `SIGNAL_ONLY` |
| -: | --- | --- |
| 1 | `request` — 22 (I+S) | `request` — 22 (I+S) |
| 2 | — | `ask_for_help` — 10 (S) |
| 3 | — | `clarification` — 10 (S) |
| 4 | — | `decline` — 10 (S) |

Expected-capability trace:

| Expectation | Capability | Legacy | Signal-only |
| --- | --- | --- | --- |
| Required | `request` | retained #1 | retained #1 |
| Forbidden | `give_constructive_feedback` | `RETRIEVAL_CUTOFF`: legacy intent admission failed; no supporting evidence | `RETRIEVAL_CUTOFF`: no supporting evidence |

Strict `NONE`: not expected; not returned in either mode.

## Key differences and observations

- Both modes retrieved all 13 required-capability labels across the 11 wording
  scenarios: Recall@5 and Recall@10 are both 100% for this diagnostic set.
- The strict `NONE` scenario remained empty in both modes because the fixed
  non-wording action failed hard action eligibility before retrieval.
- `SIGNAL_ONLY` increased the mean positive-signal pool from 1.25 to 2.75
  capabilities. No pool exceeded 10, so this set produced no `TOP_K_CUTOFF`.
- The legacy gate removed two useful acceptable neighbors:
  `de_escalation` on pressure and `reassurance` on emotional support. Signal-only
  retained them from situation evidence alone.
- Signal-only also exposed coarse situation-only neighbors such as
  `ask_for_help`, `clarification`, `decline`, and `expectation_setting`. Their
  presence is diagnostic, not a selection recommendation; SRS-3 owns ranking and
  supervisor decisions.
- The acceptable `request` capability in the constructive-feedback candidate case
  disappeared in both modes because its current context had neither matching intent
  nor situation evidence. This is a retrieval-evidence gap, not a Top-K ranking
  failure.
- Both candidate capabilities were recovered at rank 1 in their positive cases and
  stayed absent in the selected hard-neighbor cases. They remain evaluation-only.
- Capability rankings and eligible modifier lists were identical across repeated
  runs because SRS-2 is deterministic. Modifier eligibility was unchanged between
  legacy and signal-only because the comparison changes metadata admission only.

These observations are evidence for later SRS-3 design. They do not authorize
threshold tuning, metadata edits, candidate activation, or production cutover.
