# SRS-3F-A — evaluation-only CommunicationOperation layer

Status: **implemented in shadow tooling; exposed quality FAIL; not approved for SRS-3F-B fusion** (2026-09-30).

## Boundary and artifacts

The A increment adds a private, multi-label 11-operation vocabulary, Zod-validated YAML profiles, and a separate many-to-many support mapping for the 14 approved atomic skills. The detector reads **only** validated request fragments, fixed `AgentAction`, operation profiles and their positive vectors; it has no skill IDs, skill-label input, support-map import, runtime registry export, or provider call. `job` and individual `positiveEvidence` entries form 33 positive documents; exclusion and neighbor guidance is never embedded as positive evidence. Scores are cosine relevance signals, not probabilities or final selection. English-only pinned local MiniLM is reused in evaluation mode, with Chinese/code-switching and non-wording actions returning explicit empty/unsupported statuses. No SRS-3F-B Top-K, fusion, Supervisor or production behavior was added.

The source-and-evidence chain is:

| Artifact | SHA-256 / qualification |
| --- | --- |
| [Operation profiles](../../packages/skills/tests/fixtures/srs3f/operation-profiles-v1.json) | `834ad277fdb684f47d5d09f6765113661cb1b409c43bcf52c185cbfcde640426` |
| [Skill-support mapping](../../packages/skills/tests/fixtures/srs3f/operation-skill-support-v1.json) | `b96b7e899e085f7f705dcf231fde5411460b6ca3d6b99cd545a59385e691a17f`; authoring-only, not detector input |
| [Positive vectors](../../packages/skills/tests/fixtures/srs3f/operation-vectors-v1.json) | `342c65c0be3dc9a0356dcb54cb2c8619476b15cca2c968a544ad2cd5344c630c` |
| [Corrected corpus freeze](../../packages/skills/tests/fixtures/srs3f/operation-corpus-freeze-v2.json) | `94a6d6c4b7477ad555873857ddab8c1fcbd535c463505d93d0736599366d6fdd` |
| [Frozen exposed configuration](../../packages/skills/tests/fixtures/srs3f/operation-config-v2.json) | `3054b1dba560bc0b1bb3027dd3cc20fdc5074d4f548d15653e3fda6b1ea42028` |
| [Content-free exposed audit](../../packages/skills/tests/fixtures/srs3f/operation-audit-v2.json) | `d463fde6ed7dd68cc25c8cd320b5ce9034175a493db5c3bd2f62afad9975c8f6` |

The 86 new synthetic raw scenarios are separate from their operation annotations and split into 43 calibration/43 audit cases with distinct scenario families. Coverage: at least eight positive and eight designated boundary-negative observations for each operation, 26 multi-label cases, 20 zero-operation cases, 65 rewrites, 16 empty-draft suggestions, three completions and two non-wording controls. The annotations were made from raw inputs and fixed action, **not skill labels**, but the qualification is `CODEX_SELF_REVIEW_PROVISIONAL`. There is no independent or human approval. We did not inspect the frozen challenge to establish semantic non-overlap; the corpus freeze says this explicitly. The original `v1` corpus/config/audit files are retained as preliminary records; `v2` corrects the provenance wording without changing the detector scores or metrics.

## Frozen calibration and exposed audit

The predeclared global grid crossed thresholds `0.20–0.50` in 0.05 steps with `PRIMARY_ONLY` and a gated ≤0.05 context boost. Calibration-only micro-F1 selected **`PRIMARY_ONLY`, threshold `0.30`**. No operation-specific threshold or post-audit tuning was attempted.

| Metric | Calibration | Family-disjoint exposed audit | A gate |
| --- | ---: | ---: | ---: |
| Required operation recall | 10/47 = 21.3% | **12/48 = 25.0%** | ≥75% |
| Precision | 10/21 = 47.6% | **12/43 = 27.9%** | ≥70% |
| Multi-operation all-required | 1/13 | **1/13** | ≥60% |
| Zero-operation cases with any signal | 0/10 | **1/10** | ≤20% |
| Critical ownership/intent proxy | 0 | **1** | 0 |

Audit per-operation required hits were: `SEEK_ACTION` 0/4, `SEEK_INFORMATION` 0/3, `REVISIT_OPEN_THREAD` 1/3, `REPORT_CURRENT_STATE` 2/5, `COORDINATE_FUTURE` 0/5, `REFUSE_OPTION` 2/4, `STATE_CONTINUING_LIMIT` 1/3, `OWN_ERROR` 0/8, `EXPRESS_REGRET` 0/5, `RESPOND_TO_CONCERN` 2/4, and `REDUCE_TENSION` 4/4. Five operation types had **no required hit**. Rewrite recovered 4/35 required operations; empty-draft suggest recovered 5/10. Completion recovered 3/3 but produced 11 operation signals, so that recall does not imply precision. Non-wording actions stayed empty.

Case `O74` is a serious false positive: the OTHER participant declines, the user merely acknowledges, but the detector emits `STATE_CONTINUING_LIMIT` from the user's short draft. Some longer selected goals also generate several unrelated operation matches (for example `O16` and `O38`). These observations are consistent with a sentence-embedding/profile mismatch and poor ownership/negation discrimination; that diagnosis is an **inference**, not proof of a single causal defect. The per-case artifact records operation IDs, scores, ranks, source types, misses and extras without raw message text.

## Decision and limits

**FAIL.** The layer is implemented as an inspectable shadow experiment, but the frozen exposed audit misses the recall, precision, per-operation, multi-label and critical-error gates. Do not feed its signals into skill retrieval, implement B fusion, run the frozen challenge, tune on these audit misses, or promote the provisional labels to approved gold. A revised detector/profile/corpus would need a new experiment ID and separate plan review; alternatively, SRS-3F-B's pure admission-free semantic Top-K can be proposed independently under the existing plan, with **no operation fusion**.

This is synthetic, English-only exposed evidence. It is not a human-reviewed quality approval, native-language result, production privacy approval, or estimate of live-user performance. No real conversation, screenshot, draft, identity, API key, or provider payload was recorded.

Validation commands and outcomes are recorded in the [SRS-3F execution plan](../../.agent/plans/skills-srs-3f-communication-operations.md).
