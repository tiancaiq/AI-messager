# SRS-3F-B exposed admission-free semantic Top-K

Status: **exposed gate FAIL (forbidden@3); proposed config frozen; human review pending; challenge not authorized**.

This evaluation reused the frozen SRS-3E MiniLM, positive profiles/vectors, source-aware query serializer and `alpha=0` score. It ranks every hard-eligible ATOMIC skill without a score threshold. CommunicationOperation signals and production routing were not used. The 53 exposed English cases comprise 29 revision-qualified SRS-3B cases and 24 reviewed calibration controls. No challenge row was read or scored.

## Results

| Measure                                   |                                 Exposed result |
| ----------------------------------------- | ---------------------------------------------: |
| Required Recall@3 / @5 / @10              |                          22/46 / 26/46 / 38/46 |
| Rewrite required @10                      |                                          20/27 |
| Per-skill breadth @10                     |                                          14/14 |
| Positive cases all-required @10           |                                          29/37 |
| Multi-required all / at-least-one @10     |                                      6/9 / 9/9 |
| Explicit forbidden rank 1 / @3 / @10      |                            2/14 / 7/14 / 12/14 |
| Wording NONE with nonempty candidate pool | 13/13 (expected; Supervisor decision deferred) |
| Structural no-reply empty                 |                                            3/3 |
| Positive COMPLETE_DRAFT cases             |                             0 (N/A for recall) |

## Predeclared automatic gates

| Gate           | Result |
| -------------- | ------ |
| requiredAt3    | PASS   |
| requiredAt5    | PASS   |
| requiredAt10   | PASS   |
| rewriteAt10    | PASS   |
| breadth        | PASS   |
| multiAll       | PASS   |
| multiOne       | PASS   |
| allRequired    | PASS   |
| forbiddenRank1 | PASS   |
| forbiddenAt3   | FAIL   |
| structuralNone | PASS   |
| parity         | PASS   |

The predeclared forbidden@3 limit is 6/14; the observed **7/14 fails**. The seven ranked forbidden occurrences are:

| Case        | Action        | Forbidden skill     | Rank |
| ----------- | ------------- | ------------------- | ---: |
| SRS3B:R06   | SUGGEST_REPLY | follow_up           |    1 |
| SRS3B:R10   | SUGGEST_REPLY | boundary_setting    |    2 |
| SRS3B:R14   | SUGGEST_REPLY | planning            |    1 |
| CONTROL:K20 | SUGGEST_REPLY | follow_up           |    2 |
| CONTROL:K21 | REWRITE_DRAFT | expectation_setting |    3 |
| CONTROL:K22 | SUGGEST_REPLY | planning            |    3 |
| CONTROL:K22 | SUGGEST_REPLY | status_update       |    2 |

The two rank-1 occurrences (R06 follow_up, R14 planning) require explicit ownership/intent review; the zero confirmed critical-error gate remains **PENDING HUMAN REVIEW**. Automated gates cannot approve it. The exposed gate failure blocks the challenge under the approved plan. Candidate retrieval does not decide `NONE` or final selection. Scores are relevance signals, not confidence. Unlabeled skills are unlabeled, not unsupported. Low-score/negative-score candidates remain in the bounded Top-K.

## Comparison and limits

B's full ranking/source scores were checked for exact parity with SRS-3E's frozen `alpha=0` **pre-admission** traces on every exposed case. B's rank coverage therefore preserves prior exposed pre-admission signal; removing admission does not improve MiniLM ordering. Historical SRS-2.5 and SRS-3D-A aggregate challenge denominators are **NOT_COMPARABLE** to this 53-row exposed corpus. Their current scripts do not expose an unchanged same-raw-input/fixed-action API, so no cross-corpus uplift claim is made. The 13 wording NONE rows are not required to have empty retrieval; three no-reply rows are structural empties. Positive COMPLETE_DRAFT and non-English embedding coverage are not evaluable here.

The [content-free machine trace](../../packages/skills/tests/fixtures/srs3f/semantic-topk-exposed-v1.json) is SHA-256 `3da194a50d46c33c26b5dcaa2f59ce7d33eb03d4352e5eefc706d9241e6ed214`; the [immutable proposed config](../../packages/skills/tests/fixtures/srs3f/semantic-topk-proposed-config-v1.json) is SHA-256 `4f3f94e0b2089c9bb7a8e8c3a83c697b7df3d9f3c4c0c14b4c00ac0d4518327b`. They bind the pinned model, catalog, scorer/query source, profiles/vectors, and exact exposed evidence. Do not run the challenge under this failed gate; any exception would need an explicit separate decision after human review. No Supervisor or operation fusion is included.
