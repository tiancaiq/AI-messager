# SRS-3B fresh corpus audit after remediation

Date: 2026-09-28  
Verdict: **PASS_WITH_NONBLOCKING_FINDINGS**  
Scope: exact exposed-development English revisions bound below; no SRS-3C run or production change

## Method and independence limit

I read the current raw R01–R41 scenarios and the 14 ACTIVE atomic capability definitions before reopening the annotation and authoring-metadata files. I independently assessed the communication jobs, primary operations, and possible ordering, then compared those judgments with the annotations. I recomputed counts and SHA-256 bindings from repository files, inspected source triage and the frozen SRS-3A manifest, exercised the raw-only observer, and ran the validation commands below. I did not edit corpus inputs, labels, metadata, definitions, retrieval, or production.

This is an artifact-independent, raw-first review, **not a blinded review by a different person**: the same Codex chat performed the preceding remediation. That limits reviewer independence and must not be described as human or native-language approval. The case-level judgments below are based on current artifacts rather than accepting the remediation report's conclusions.

## English case audit

All **29 accepted English cases PASS** on their exact current revisions. There are **0 REVISE, 0 QUARANTINE, and 0 REJECT** among the English cases. `REWRITE_DRAFT` has an existing user draft, `SUGGEST_REPLY` has an empty draft and selected goal, and R29's fixed action is `NO_REPLY_NEEDED`. No accepted case changes the user's supplied decision, timing, uncertainty, responsibility, or commitment.

| ID | Decision | Independent judgment after reading raw input |
| --- | --- | --- |
| R01 | PASS | The export and format-report actions are requests. There is no material missing detail to clarify; `request` alone and no edge are correct. |
| R02 | PASS | Basic versus plus is decision-critical ambiguity. Asking the agent to identify the plan is also a supported information request, but clarification is central because renewal should wait for that distinction. |
| R03 | PASS | The photo send is the main request; help identifying the back row is conditional and secondary. |
| R04 | PASS | Removing recording hum is an assistance request; a sample of the original track is an instrumental, conditional request. |
| R05 | PASS | The earlier reservation question is visible and unresolved; the renewed confirmation ask is primarily a follow-up. |
| R06 | PASS | The old delivery ticket is closed. A new month's invoice is a first request, not follow-up. |
| R07 | PASS | Today's lunch-meeting refusal and a continuing lunch-break limit are both present; repeated scheduling makes the limit central. |
| R08 | PASS | One bicycle sale offer is declined; the selected goal rules out a standing boundary. |
| R09 | PASS | Repeated immediate-reply pressure grounds an ongoing work-hours limit; calm phrasing is useful but secondary. |
| R10 | PASS | Anger and accusation call for de-escalation; no user-chosen limit is supplied. |
| R11 | PASS | Choosing and booking Wednesday at 3 is central coordination; 2:50 arrival is a user-supplied timing commitment. |
| R12 | PASS | The technician has no confirmed finish time. Communicating that uncertainty and an update after confirmation is expectation setting, not meeting coordination. |
| R13 | PASS | Completed screen-reader work is current status; Thursday comparison before assigning fixes is planning. Neither dominates. |
| R14 | PASS | The user supplies arrival/unopened state only and explicitly excludes a plan. |
| R15 | PASS | The revised draft apologizes, owns the forgotten calendar entry, and names the visible consequence of waiting; it claims no unobserved feeling. Regret and ownership are co-central. |
| R16 | PASS | Correcting the user's outdated link is central ownership; the selected brief apology is supported but secondary. |
| R17 | PASS | The other's embarrassment is explicit; the draft validates it and offers effort-grounded, non-guaranteed reassurance second. |
| R18 | PASS | Week-to-week walking progress supports reassurance without a recovery prediction; expressed worry also permits validation. |
| R19 | PASS | The question explicitly asks present count and future timing. The draft gives both, preserves “might,” and commits only to later window confirmation. No order is justified. |
| R20 | PASS | The practical decision is whether to promise an afternoon release. Unconfirmed timing is central; ongoing verification is supporting status. |
| R21 | PASS | The 3:30 microphone test is the central plan; bringing the HDMI adapter is a separate supported request, with no forced pair edge. |
| R22 | PASS | Sunday visit coordination and “should be free after lunch” are both material; train-dependent final timing remains conditional. |
| R23 | PASS | The user-supplied “refund pending” account state and absent payment date answer separate current/future questions without a justified order. |
| R24 | PASS | The repeated music conflict supports a quiet-hours limit and the draft explicitly avoids arguing; neither job dominates. |
| R25 | PASS | The selected goal explicitly owns the late upload and apologizes for the delay. Neither operation is merely incidental. |
| R26 | PASS | Brief receipt thanks calls for generic wording, not a catalog communication strategy. |
| R27 | PASS | Ordinary pleasant-weather small talk has no meaningful catalog capability despite a visible rewrite draft. |
| R28 | PASS | Acknowledging supplied museum hours needs no request, plan, or other catalog operation. |
| R29 | PASS | The conversation is closed and the fixed action is non-wording; no capability is appropriate. |

The four previous blockers are resolved exactly as intended: R01 has no `clarification` or edge; R13, R15, and R19 each have two required skills with empty primary/order lists. R15's earlier inferred emotional impact is absent. Their reviewer bindings point to R2.

## Pairwise and primary audits

Every pair below has two supported endpoints. Each order reflects the local goal and visible evidence rather than a global “more specific skill always wins” rule. **11 VALID, 0 AMBIGUOUS, 0 INVALID**:

| Case | Edge | Verdict and local basis |
| --- | --- | --- |
| R02 | clarification > request | VALID — resolve which account plan before any renewal decision; the generic information ask is less central. |
| R03 | request > ask_for_help | VALID — photo delivery is unconditional; identification help is conditional. |
| R04 | ask_for_help > request | VALID — audio cleanup is the goal; track sample is instrumental. |
| R05 | follow_up > request | VALID — the prior unanswered reservation ask changes the renewed request's job. |
| R07 | boundary_setting > decline | VALID — ongoing lunch protection governs more than today's refusal. |
| R09 | boundary_setting > de_escalation | VALID — a sustainable reply limit is the main point; calm tone supports it. |
| R11 | planning > expectation_setting | VALID — booking an offered slot is central; early arrival is supporting timing. |
| R16 | acknowledge_mistake > apology | VALID — owned link correction is the goal; brief regret is secondary. |
| R17 | emotional_validation > reassurance | VALID — explicit embarrassment is addressed before grounded encouragement. |
| R18 | reassurance > emotional_validation | VALID — the selected goal is evidence-grounded encouragement, with worry recognition secondary. |
| R20 | expectation_setting > status_update | VALID — the question asks whether an afternoon release can be promised; verification status supports the answer. |

All **18 primary labels are DEFENSIBLE**; **0 AMBIGUOUS, 0 UNSUPPORTED**. Their central operations are: R01 request; R02 clarification; R03 request; R04 ask_for_help; R05 follow_up; R06 request; R07 boundary_setting; R08 decline; R09 boundary_setting; R10 de_escalation; R11 planning; R12 expectation_setting; R14 status_update; R16 acknowledge_mistake; R17 emotional_validation; R18 reassurance; R20 expectation_setting; R21 planning. R13, R15, R19, R22–R25 properly have no primary. R26–R29 properly have no primary because they are strict `NONE`.

## Multi-required, strict NONE, and draft realism

All **seven** multi-required/no-order cases pass: R13 (status + planning), R15 (apology + owned mistake), R19 (status + uncertain timing), R22 (visit plan + availability), R23 (account state + missing refund date), R24 (quiet-hours limit + conflict de-escalation), and R25 (owned late upload + regret). In each, both required operations are substantive, no obvious third required operation is omitted, and neither a primary nor pairwise order is established by the raw input.

All **four** strict `NONE` cases pass and cover distinct jobs: R26 receipt thanks; R27 ordinary social small talk; R28 neutral-hours acknowledgement; R29 closed exchange/no-reply action. Their `NONE` label is based on absence of useful catalog guidance, not merely short text.

I inspected all 20 rewrite drafts and their metadata. The **7 ROUGH / 7 NORMAL / 6 ALREADY_DECENT / 0 OVER_POLISHED** distribution is plausible; accepted English rewrites are **7 / 4 / 3 / 0**. R01, R05, R07, R13, R15, R19, and R24 are genuinely rough but readable. The other English rewrites range from conversational (R03, R09, R21, R22) to already decent (R11, R17, R27). Their revisions retain the user's request scope, can/cannot claims, timing, conditionality, and commitments. R15 deliberately removes an unsupported feeling claim while preserving regret, responsibility, and waiting. R19's passive fragment (“3 of 5 aisles counted”) does not assign a different actor, and its “might” remains uncertain. R31/R33/R34/R36/R38/R40 are only authoring classifications, not native-language approvals.

## Explicitness and supported pair coverage

The fixture-only `boundaryExplicitness` classification matches the narrow rule “selected intent directly excludes a neighboring communication job.” Accepted cases are **5 EXPLICIT / 24 IMPLICIT**: rewrite **0/14**, suggest **5/9**, no-reply **0/1**. The explicit cases are R08, R10, R14, R26, and R28; none carries a pairwise edge. Some other selected intents constrain facts or certainty, but do not directly exclude a neighboring operation. Explicit intents make those hard-negative/`NONE` examples easier than otherwise similar implicit inputs. This is acceptable development scaffolding, but later comparisons should expose the subgroup instead of treating all hard negatives as equally difficult. Neither the raw request nor the observer receives this metadata.

The independently recomputed priority-pair ledger is below. `A>B` and `B>A` are **valid supported-candidate orders**; a forbidden neighbor is counted only as a hard negative. Missing inverse edges are evidence gaps, not manufactured labels or freeze blockers.

| A / B | A>B | B>A | Both valid, no order | Hard-negative-only case |
| --- | ---: | ---: | ---: | --- |
| request / clarification | 0 | 1 | 0 | none; R01 is request-only without a forbidden label |
| request / ask_for_help | 1 | 1 | 0 | none |
| follow_up / request | 1 | 0 | 0 | R06, request central / follow_up forbidden |
| boundary_setting / decline | 1 | 0 | 0 | R08, decline central / boundary forbidden |
| boundary_setting / de_escalation | 1 | 0 | 1 | R10, de_escalation central / boundary forbidden |
| planning / expectation_setting | 1 | 0 | 1 | R12, expectation central / planning forbidden |
| planning / status_update | 0 | 0 | 1 | R14, status central / planning forbidden |
| apology / acknowledge_mistake | 0 | 1 | 2 | none |
| emotional_validation / reassurance | 1 | 1 | 0 | none |
| status_update / expectation_setting | 0 | 1 | 2 | none |

Only request/ask_for_help and emotional_validation/reassurance have two valid opposing ranking edges. The one-sided and no-order pairs must not be called bidirectionally ranked.

## Language structure, independence, and leakage

R30–R41 are all `QUARANTINE`, reviewer `NONE`, `reviewedRevision: null`, with no preservation attestation; none enters an accepted denominator. Structurally, R30 has an existing booking with an unclear morning/afternoon slot; R39 and R41 now visibly mix Chinese and English; R41 no longer labels a redundant status update. **R30–R41 are STRUCTURALLY_READY_FOR_NATIVE_REVIEW** at this limited level, but qualified native-language quality and boundary review is still required. This audit grants no such approval.

All 41 raw IDs and family IDs are unique. No accepted scenario is an exact text copy of Phase 8A inputs, T1–T18, or the eight capability matrices, and the new situations add domain-specific actors, goals, or consequences rather than simply substituting a noun into a matrix sentence. The decision-boundary clusters R19/R23 (status plus uncertain date), R15/R25 (apology plus ownership), and R07/R09/R24 (repeated-pressure limit with a second operation) are related but not duplicate scenarios. They remain separate families because their facts, modes, and secondary jobs differ; a future baseline must not present clustered cases as independent proof of broad generalization. This is a nonblocking exposed-development limitation, not a reason to silently alter family IDs.

The 69 triage entries match the 69 frozen evaluation-eligible manifest records by lineage, source key/revision/artifact and item/reviewed-content digests. Their dispositions are 37 `INSUFFICIENT_FOR_RANKING` and 32 `REGRESSION_ONLY`, with zero adaptations. All corpus annotations use `NEW_INDEPENDENT_SRS3` and null Phase 8A scoring lineage. The frozen manifest still excludes 21 matrix-overlapping lineages, so relationship-source rows have not been promoted to efficacy labels. Capability labels contain no language modifier, `perspective_acknowledgement`, `give_constructive_feedback`, or `confirmation`.

The serialized raw inputs contain no annotation sets, primary/order labels, expected rank, review rationale, provenance hints, realism class, or explicitness class. Removing annotations and reordering authoring metadata left the raw observer output at identical SHA-256 `b7d21672e4176b4fe5c53b5f9006c7e8c3a3977e8a22cd813b268e26741855fa`. Recursive key inspection found no `setting`, `draftRealism`, or `boundaryExplicitness` in `SkillContext` or retrieval output. The observer uses the private `SRS_2_5_PROPOSED` / `SIGNAL_ONLY` path; the production coaching call still invokes `deriveSkillContext` (`CURRENT`).

## Recomputed bindings and validation

| Artifact | SHA-256 |
| --- | --- |
| Raw source | `a185d8f050e6f8dca583254ba9b0211fd843fbc24d22e4fac12354a2eb8adbe7` |
| Serialized raw set | `efce60f7eef73609fcdf1c4080d21e93dba43c57c1d59873c0549306bf3cbdcf` |
| Development annotations | `b4b8920b27c1f025c8027f785ab6c9e3b79b07af3fea05c1af4ac810529b60d6` |
| Fixture-only authoring metadata | `08597a038d350c50580cde3addb7eef14f19f8bc97257e70b4e140dab849f3b6` |
| Source triage | `e513ec03da3c4cada5bdf3248224b72eba5385f16174ce8358063625886a3267` |
| Production catalog manifest | `f53d78d4866a386fd544e0cf3a9e3b76373e49e265c7fc9a180b866871a8eb72` |
| Frozen SRS-3A manifest | `0700162fd5b7c656c1d6134cdd3d69baa9a824eb4a01a598b7ea6d4b4c666362` |

Two separate raw-to-report loads yielded byte-equivalent JSON with SHA-256 `7ecd4440e591c6b234ba9b37090709074fb856f59c2b52061da43c303a22d29e`. Focused SRS-3B/SRS-3A/SRS-2/SRS-2.5 tests passed **41/41** in four files. `pnpm test` passed **474/474** in 35 files. `pnpm skills:check`, `pnpm skills:verify-production`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm format:check`, and `git -c core.safecrlf=false diff --check` passed. Production verification confirmed **21 exact ACTIVE definitions and 153 frozen plans**. No reranker, supervisor, `SkillPlan`, candidate activation, prompt/provider change, or SRS-3C baseline result was introduced by this review.

## Freeze decision

The exact English corpus identified by the raw-source, raw-set, annotation, authoring-metadata, triage, and catalog hashes above is **fit for a development freeze candidate**. The nonblocking findings permitted to carry into a separately authorized SRS-3C are: (1) selected-intent explicitness is concentrated in five suggest/negative cases, so subgroup reporting is needed; (2) a few same-boundary scenarios form related regression clusters and should not be overcounted as broad independent generalization; and (3) this review was raw-first but not conducted by a different human reviewer. None changes the correctness of the 29 current English labels, 11 orders, 18 primaries, seven no-order cases, or four strict `NONE` cases. Chinese/code-switching cases remain excluded.

This verdict does **not** run, approve, or tune SRS-3C. A separate authorization remains necessary before any baseline evaluation.
