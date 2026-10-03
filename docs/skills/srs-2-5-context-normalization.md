# SRS-2.5 context-normalization results

Status: complete shadow evaluation; awaiting user review  
Evidence: exposed development diagnostics only  
Production profile: `CURRENT`  
Proposed profile: `SRS_2_5_PROPOSED` (private, evaluation only)

## Decision summary

The proposed normalizer resolves all six priority context failures without losing a
previously found required capability or newly enabling a forbidden capability in
Top 10. Under `SIGNAL_ONLY`, required-skill recall at K=5 and K=10 increases from
18/23 to 23/23, both strict-`NONE` cases pass, and the mean positive-signal pool
decreases from 3.1111 to 2.6667.

This is a shadow result, not a production-cutover approval. The production
`deriveSkillContext()` caller remains on `CURRENT`; the proposed profile has no
package-index export, runtime flag, or production caller. SRS-3 ranking and any
production activation require separate approval.

## Evidence boundary

- 18 synthetic T1-T18 exposed-development cases were evaluated.
- Raw requests are stored separately from normalization and retrieval annotations;
  normalization runs before annotations are joined.
- Machine output contains no message, draft, selected-intent, prompt, provider
  payload, or free-text rationale fields.
- The 210 canonical authoring examples remain `PENDING_HUMAN_REVIEW` and contribute
  zero routing-metric scenarios.
- Held-out evidence remains `NOT_AUTHORED`, unread, and unscored.
- No provider, network, screenshot, memory, identity, database, or real-message data
  was used.

Digests:

| Evidence | SHA-256 |
| --- | --- |
| Raw T1-T18 scenarios | `9399e49ca4dce51c691bf4017c314002bb6d74a5d113251b8711d98639f5c497` |
| Separate annotations | `79aeb9bf4a20661ec65d515b21b853b1d4b65fceeb715162e12a0820aa15dcaf` |
| Production catalog | `c96fc9c9a5b26909ecf635bbae3ebef28abf15ed4729216cc28caf7698ad1ee3` |
| Evaluation overlay | `d955865b4df118cc88935512d307687437500b91ada4fcfca10f7bd0baa40a8f` |

## Normalization rules

The proposed path emits existing tags only. Each signal records one or more of
`OTHER_MESSAGE`, `USER_DRAFT`, `SELECTED_INTENT`, `CONVERSATION_HISTORY`, and
`STRUCTURED_CONTEXT`.

| Rule | General boundary |
| --- | --- |
| Ownership and mistake | Requires first-person user-owned mistake evidence and rejects negated ownership; other-person mistakes do not transfer to the user. |
| Boundary | Requires a continuing or repeated user-owned limit; uncertain delivery or a one-time inability is not enough. |
| Request and clarification | Separates action requests from questions seeking a missing detail. Selected request intent emits `make_request` but does not manufacture a request situation or clarification. |
| Planning | Requires active coordination. A settled notice or an acknowledgement of a settled notice does not emit planning. |
| Status and expectation | Separates a current state from uncertain or future timing. Status requests may support current status evidence. |
| Follow-up | Requires both a follow-up operation and a visible prior open thread. |
| Candidate signals | Perspective acknowledgement and constructive feedback stay behind the existing explicit evaluation option; neither candidate enters production. |

The CURRENT overgeneration came from broad lexical triggers that treated settled
times as planning, uncertain delivery as decline, and status words as current user
status. Its misses came from ignoring user-owned mistake wording, explicit selected
request intent, current-state wording, and continuing limits. The proposed rules
apply source, ownership, polarity, temporal role, and communication-operation
conditions instead of case IDs or complete fixture strings.

## Context metrics

Normalization and retrieval are reported separately. Counts below use 24 required
intent annotations, 17 required situation annotations, 26 forbidden intent
annotations, 17 forbidden situation annotations, and two strict-`NONE` cases.

| Metric | CURRENT | SRS_2_5_PROPOSED |
| --- | ---: | ---: |
| Required intents found | 17/24 | 24/24 |
| Required situations found | 13/17 | 17/17 |
| Forbidden intents emitted | 7/26 | 0/26 |
| Forbidden situations emitted | 6/17 | 0/17 |
| Cases missing a required signal | 6/18 | 0/18 |
| False intent signals | 7 | 0 |
| False situation signals | 6 | 0 |
| Strict `NONE` | 1/2 | 2/2 |

Valid changes comprise seven added intents, four added situations, seven removed
intents, and six removed situations. There are zero newly missing required signals
and zero newly false signals. All six priority cases are resolved.

## Per-scenario normalized context

Notation: `I` = intent, `S` = situation, `O` = `OTHER_MESSAGE`, `D` =
`USER_DRAFT`, `E` = `SELECTED_INTENT`, `H` = `CONVERSATION_HISTORY`.
Signals with multiple sources list them with `+`. Empty brackets mean no tags.

| Case | Action | CURRENT context and sources | PROPOSED context and sources | Exact context delta |
| --- | --- | --- | --- | --- |
| T1 | `REWRITE_DRAFT` | I: `decline@D`, `provide_status@O+D`, `set_expectation@D`, `plan@O+D`; S: `status_request@O+D`, `planning@O+D`, `invitation@D` | I: `acknowledge_mistake@D`, `provide_status@O+D`, `set_expectation@D`; S: `mistake@D`, `missed_commitment@O+D`, `status_request@O+D` | +I `acknowledge_mistake`; -I `decline`, `plan`; +S `mistake`, `missed_commitment`; -S `planning`, `invitation` |
| T2 | `REWRITE_DRAFT` | I: `set_boundary@D`, `decline@D`, `provide_status@D`; S: `status_request@D`, `pressure@O+D` | I: `set_boundary@D`, `decline@D`; S: `pressure@O+D` | -I `provide_status`; -S `status_request` |
| T3 | `REWRITE_DRAFT` | I: `make_request@D`, `give_feedback@D`; S: `request@D` | I: `de_escalate@D`, `make_request@D`, `give_feedback@D`; S: `conflict@D`, `request@D` | +I `de_escalate`; +S `conflict` |
| T4 | `REWRITE_DRAFT` | I: `plan@O`, `acknowledge_perspective@O+D`; S: `planning@O` | I: `acknowledge_perspective@O+D`; S: [] | -I `plan`; -S `planning` |
| T5 | `SUGGEST_REPLY` | I: `validate_emotion@O`; S: `emotional_support@O` | Same | none |
| T6 | `REWRITE_DRAFT` | I: []; S: [] | I: `acknowledge_mistake@D`; S: `mistake@D` | +I `acknowledge_mistake`; +S `mistake` |
| T7 | `REWRITE_DRAFT` | I: `plan@O`; S: `planning@O` | I: []; S: [] | -I `plan`; -S `planning` |
| T8 | `REWRITE_DRAFT` | I: `decline@D`, `provide_status@D`, `set_expectation@D`; S: `status_request@D` | I: `provide_status@D`, `set_expectation@D`; S: `status_request@D` | -I `decline` |
| T9 | `SUGGEST_REPLY` | I: `plan@O`; S: `planning@O` | Same | none |
| T10 | `REWRITE_DRAFT` | I: `plan@O`; S: `planning@O`, `request@D` | I: `clarify@D`; S: `request@D` | +I `clarify`; -I `plan`; -S `planning` |
| T11 | `SUGGEST_REPLY` | I: []; S: [] | I: `make_request@E`; S: [] | +I `make_request` |
| T12 | `REWRITE_DRAFT` | I: `follow_up@O+D+H`, `plan@D`; S: `planning@D`, `follow_up@O+D+H`, `request@O+H` | I: `follow_up@O+D+H`; S: `follow_up@O+D+H`, `request@O+H` | -I `plan`; -S `planning` |
| T13 | `REWRITE_DRAFT` | I: `make_request@D`; S: `request@D` | Same | none |
| T14 | `REWRITE_DRAFT` | I: `decline@D`, `provide_status@O+D`, `set_expectation@D`; S: `status_request@O+D` | I: `provide_status@O+D`, `set_expectation@D`; S: `status_request@O+D` | -I `decline` |
| T15 | `REWRITE_DRAFT` | I: `plan@O`; S: `planning@O` | I: `provide_status@D`, `set_expectation@D`; S: `status_request@D` | +I `provide_status`, `set_expectation`; -I `plan`; +S `status_request`; -S `planning` |
| T16 | `REWRITE_DRAFT` | I: []; S: [] | Same | none |
| T17 | `REWRITE_DRAFT` | I: `plan@O`; S: `planning@O` | I: []; S: [] | -I `plan`; -S `planning` |
| T18 | `REWRITE_DRAFT` | I: `apologize@D`, `acknowledge_mistake@D`, `decline@D`, `provide_status@O+D`, `set_expectation@D`; S: `mistake@D`, `missed_commitment@O+D`, `status_request@O+D`, `invitation@D` | I: `apologize@D`, `acknowledge_mistake@D`, `set_boundary@D`, `decline@D`, `provide_status@O+D`, `set_expectation@D`; S: `mistake@D`, `missed_commitment@O+D`, `status_request@O+D`, `pressure@D` | +I `set_boundary`; +S `pressure`; -S `invitation` |

## Retrieval metrics

The retriever is unchanged: intent match = 12, situation match = 10, stable skill-ID
tie break, identity rerank, and the existing K cutoff. Recall has denominator 23
required capability labels. Coverage averages per-case required coverage across the
15 cases with required capabilities. `all required` has denominator 15. Strict
`NONE` has denominator 2. Forbidden rate is measured over 32 forbidden-capability
annotations.

| Profile | Mode | K | Recall | Coverage | All required | Strict `NONE` | Forbidden in Top-K |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| CURRENT | `LEGACY_METADATA_GATE` | 5 | 16/23 (0.6957) | 0.6944 | 9/15 (0.6000) | 1/2 (0.5000) | 2/32 (0.0625) |
| CURRENT | `LEGACY_METADATA_GATE` | 10 | 16/23 (0.6957) | 0.6944 | 9/15 (0.6000) | 1/2 (0.5000) | 2/32 (0.0625) |
| CURRENT | `SIGNAL_ONLY` | 5 | 18/23 (0.7826) | 0.7944 | 10/15 (0.6667) | 1/2 (0.5000) | 3/32 (0.0938) |
| CURRENT | `SIGNAL_ONLY` | 10 | 18/23 (0.7826) | 0.7944 | 10/15 (0.6667) | 1/2 (0.5000) | 4/32 (0.1250) |
| PROPOSED | `LEGACY_METADATA_GATE` | 5 | 22/23 (0.9565) | 0.9333 | 14/15 (0.9333) | 2/2 (1.0000) | 0/32 (0.0000) |
| PROPOSED | `LEGACY_METADATA_GATE` | 10 | 22/23 (0.9565) | 0.9333 | 14/15 (0.9333) | 2/2 (1.0000) | 0/32 (0.0000) |
| PROPOSED | `SIGNAL_ONLY` | 5 | 23/23 (1.0000) | 1.0000 | 15/15 (1.0000) | 2/2 (1.0000) | 2/32 (0.0625) |
| PROPOSED | `SIGNAL_ONLY` | 10 | 23/23 (1.0000) | 1.0000 | 15/15 (1.0000) | 2/2 (1.0000) | 2/32 (0.0625) |

### Pool statistics

Values are `min / max / mean / p50 / p90` across 18 scenarios. Hard eligibility is
unchanged in every run.

| Profile | Mode | K | Hard eligible | Positive-signal pool | Top-K count |
| --- | --- | ---: | --- | --- | --- |
| CURRENT | Legacy | 5 | 14 / 16 / 14.2222 / 14 / 16 | 0 / 5 / 1.5556 / 1 / 4 | 0 / 5 / 1.5556 / 1 / 4 |
| CURRENT | Legacy | 10 | 14 / 16 / 14.2222 / 14 / 16 | 0 / 5 / 1.5556 / 1 / 4 | 0 / 5 / 1.5556 / 1 / 4 |
| CURRENT | Signal | 5 | 14 / 16 / 14.2222 / 14 / 16 | 0 / 7 / 3.1111 / 3 / 6 | 0 / 5 / 2.8889 / 3 / 5 |
| CURRENT | Signal | 10 | 14 / 16 / 14.2222 / 14 / 16 | 0 / 7 / 3.1111 / 3 / 6 | 0 / 7 / 3.1111 / 3 / 6 |
| PROPOSED | Legacy | 5 | 14 / 16 / 14.2222 / 14 / 16 | 0 / 5 / 1.3889 / 1 / 3 | 0 / 5 / 1.3889 / 1 / 3 |
| PROPOSED | Legacy | 10 | 14 / 16 / 14.2222 / 14 / 16 | 0 / 5 / 1.3889 / 1 / 3 | 0 / 5 / 1.3889 / 1 / 3 |
| PROPOSED | Signal | 5 | 14 / 16 / 14.2222 / 14 / 16 | 0 / 7 / 2.6667 / 2 / 7 | 0 / 5 / 2.4444 / 2 / 5 |
| PROPOSED | Signal | 10 | 14 / 16 / 14.2222 / 14 / 16 | 0 / 7 / 2.6667 / 2 / 7 | 0 / 7 / 2.6667 / 2 / 7 |

Mean positive-signal pool change is -0.1667 in legacy mode and -0.4444 in
signal-only mode.

## Per-scenario retrieval at K=10

Entries show `CURRENT pool → PROPOSED pool` and ordered capability IDs. `—` means
an empty pool. Across both modes there are no lost required capabilities and no
newly enabled forbidden capabilities.

| Case | Legacy pool; CURRENT → PROPOSED Top-10 | Signal-only pool; CURRENT → PROPOSED Top-10 | Required/`NONE` outcome |
| --- | --- | --- | --- |
| T1 | 4→3; `decline, expectation_setting, planning, status_update` → `acknowledge_mistake, expectation_setting, status_update` | 4→4; `decline, expectation_setting, planning, status_update` → `acknowledge_mistake, expectation_setting, status_update, apology` | recovers `acknowledge_mistake` in both |
| T2 | 2→1; `boundary_setting, status_update` → `boundary_setting` | 5→3; `boundary_setting, status_update, decline, de_escalation, expectation_setting` → `boundary_setting, decline, de_escalation` | required preserved |
| T3 | 2→3; `request, give_constructive_feedback` → `de_escalation, request, give_constructive_feedback` | 5→7; `request, give_constructive_feedback, ask_for_help, clarification, decline` → `de_escalation, request, give_constructive_feedback, ask_for_help, boundary_setting, clarification, decline` | required preserved; ordering deferred |
| T4 | 2→1; `planning, perspective_acknowledgement` → `perspective_acknowledgement` | 3→1; `planning, perspective_acknowledgement, expectation_setting` → `perspective_acknowledgement` | required preserved; false planning removed |
| T5 | 1→1; `emotional_validation` → same | 2→2; `emotional_validation, reassurance` → same | required preserved |
| T6 | 0→1; — → `acknowledge_mistake` | 0→2; — → `acknowledge_mistake, apology` | recovers `acknowledge_mistake` in both |
| T7 | 1→0; `planning` → — | 2→0; `planning, expectation_setting` → — | false other-owned planning removed |
| T8 | 2→2; `expectation_setting, status_update` → same | 3→2; `expectation_setting, status_update, decline` → `expectation_setting, status_update` | required preserved |
| T9 | 1→1; `planning` → same | 2→2; `planning, expectation_setting` → same | required preserved; existing coarse neighbor remains |
| T10 | 1→1; `planning` → `clarification` | 6→4; `planning, ask_for_help, clarification, decline, expectation_setting, request` → `clarification, ask_for_help, decline, request` | recovers `clarification` in legacy; required preserved in signal-only |
| T11 | 0→0; — → — | 0→1; — → `request` | signal-only recovers `request`; legacy metadata gap; no `clarification` |
| T12 | 2→1; `follow_up, planning` → `follow_up` | 7→5; `follow_up, planning, ask_for_help, clarification, decline, expectation_setting, request` → `follow_up, ask_for_help, clarification, decline, request` | required preserved |
| T13 | 1→1; `request` → same | 4→4; `request, ask_for_help, clarification, decline` → same | required preserved |
| T14 | 2→2; `expectation_setting, status_update` → same | 3→2; `expectation_setting, status_update, decline` → `expectation_setting, status_update` | required preserved |
| T15 | 1→2; `planning` → `expectation_setting, status_update` | 2→2; `planning, expectation_setting` → `expectation_setting, status_update` | recovers `status_update`; `zh.code_switching` stays modifier-only |
| T16 | 0→0; — → — | 0→0; — → — | strict `NONE` remains pass |
| T17 | 1→0; `planning` → — | 2→0; `planning, expectation_setting` → — | strict `NONE` changes fail→pass in both |
| T18 | 5→5; `acknowledge_mistake, apology, decline, expectation_setting, status_update` → `acknowledge_mistake, apology, boundary_setting, expectation_setting, status_update` | 6→7; `acknowledge_mistake, apology, decline, expectation_setting, status_update, planning` → `acknowledge_mistake, apology, boundary_setting, expectation_setting, status_update, decline, de_escalation` | recovers `boundary_setting` in both |

## Findings and deferrals

- Remaining normalization failures: none.
- Metadata gap: T11 `request` is found by proposed `SIGNAL_ONLY` but remains absent
  under `LEGACY_METADATA_GATE`. This is classified `SKILL_METADATA_GAP`; SRS-2.5
  does not change approved metadata.
- Ranking discrimination: T3 still ranks `de_escalation` and `request` ahead of
  `give_constructive_feedback` under signal-only retrieval. T4's false planning
  signal is removed and perspective acknowledgement becomes the only signal-only
  result, while the pre-approved T4 discrimination observation remains recorded for
  SRS-3 review.
- Existing coarse neighbors remain visible in T9, T10, and T12. They were already
  enabled by valid broad signals and are not newly false signals. Ranking and final
  combination ownership remains with SRS-3.
- Candidates `perspective_acknowledgement` and `give_constructive_feedback` remain
  evaluation-only. `confirmation` remains absent from the catalog.

## Production boundary

- Production catalog: 21 ACTIVE definitions.
- Frozen behavior matrix: 153 exact plans.
- Production profile: `CURRENT`.
- Proposed-profile production callers: 0.
- Active candidate definitions in production: 0.
- Retrieval hard gates, scores, tie break, modifier lane, and cutoff reason codes are
  unchanged.
- No SRS-3 selector, `SkillPlan`, prompt, provider, database, UI, memory, commit,
  merge, or push work is included.

## Review gate

SRS-2.5 is complete as a shadow evaluation. Review and approval of these results is
required before any production cutover. SRS-3 remains stopped and requires separate
authorization.
