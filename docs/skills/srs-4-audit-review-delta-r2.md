# SRS-4 audit R2 — independent review delta

The original [R1 review packet](srs-4-audit-review-packet.md) and R1 freeze remain unchanged. A user-relayed **ChatGPT/model semantic review**, not human or qualified-human approval, approved 58 R1 cases and requested six revisions. The same review provenance approved all six R2 revisions. The audit corpus is now **64/64 model-semantically approved, 0 REVISE, 0 QUARANTINE**, but remains **unscored**. The original reviewer transcript and detailed rationales were not supplied; these reported decisions are bound to source hashes, not independently authenticated as a human review.

R2 freeze SHA-256: `3297a3577ed7110e01a2629e023bf2371238559543c3c49350dbc28c727fa319`. R1 review is bound to the R1 freeze; the six R2 decisions bind the R2 raw and annotation source hashes.

| Case | R1 decision | R2 model decision | R2 change | R2 required | R2 acceptable | R2 forbidden |
| --- | --- | --- | --- | --- | --- | --- |
| A05 | REVISE | APPROVE | Removed request from forbidden; request remains unlabeled. | clarification | — | planning |
| A10 | REVISE | APPROVE | Removed request from forbidden; request remains unlabeled. | follow_up | — | — |
| A19 | REVISE | APPROVE | Removed request from forbidden; request remains unlabeled. | clarification | — | planning |
| A24 | REVISE | APPROVE | Removed request from forbidden; request remains unlabeled. | follow_up | — | — |
| A30 | REVISE | APPROVE | New raw revision R2: OTHER: Could you cover Monday's overnight shift? / USER: No, I no longer take overnight shifts. / OTHER: Could you cover tonight's overnight shift anyway?; USER_DRAFT: i can't cover tonight and i won't take overnight shifts going forward | decline, boundary_setting | — | de_escalation |
| A35 | REVISE | APPROVE | Removed request from forbidden; request remains unlabeled. | follow_up, expectation_setting | — | status_update |

All other 58 R1 rows retain their original raw input and labels. In A30, the earlier refusal and continuing limit are USER-authored, followed by a renewed OTHER request; the unchanged draft declines tonight and restates the limit. This is authoring evidence only, not a Supervisor result.

**Gate:** this is model semantic approval only, not a Supervisor quality result or qualified-human signoff. Human boundary review and separate provider/key/budget approval remain open under the SRS-4 plan. No live Supervisor call, audit scoring, protected challenge or production change is authorized.
