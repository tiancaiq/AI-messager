# Phase 8A — Second semantic review of the 35 replacements

Date: 2026-09-19. Reviewer type: CODEX_SEMANTIC_REVIEW. Worktree/branch: AI messager-skills / skills.

## Outcome

All **35 current replacements are KEEP**: **28 STRONG and 7 ACCEPTABLE**. No replacement requires another revision, rejection or quarantine in this pass. All judgments have HIGH confidence within the stated supplied-input scope; none is human approval.

The previous remediation pass rated 32 STRONG / 3 ACCEPTABLE. This review lowers four quality ratings to ACCEPTABLE without identifying a meaning-preservation failure: acknowledge_mistake/A2, reassurance/A2, planning/H2 and en.casual_naturalness/P3. A usable example need not be strong evidence of skill-specific benefit.

| Decision   | Count |
| ---------- | ----: |
| KEEP       |    35 |
| REVISE     |     0 |
| REJECT     |     0 |
| QUARANTINE |     0 |

| Quality    | Count |
| ---------- | ----: |
| STRONG     |    28 |
| ACCEPTABLE |     7 |
| WEAK       |     0 |
| INVALID    |     0 |

## Scope, method and provenance

Reviewed the complete replacement object for every row in [the remediation ledger](../../packages/skills/tests/fixtures/phase8/weak-invalid-remediation.json), not its original example or its author's rating. The [remediation document](phase-8-weak-invalid-remediation.md) supplies the full scenarios and before/after pairs. [The second-review machine ledger](../../packages/skills/tests/fixtures/phase8/weak-invalid-rereview.json) records each judgment, all preservation checks, neighbor sets, observations and revision bindings.

Source artifact revision: 1. Source SHA-256: `16d5a358a1cd747428dd0f2574cf9707584a23de3a9b07625abe38947c9d9fd5`. Each decision also binds the exact replacement and full remediation row, plus its frozen definition. If any source row changes, this review must be treated as stale for that revision.

The same rubric covers skill relevance, neighbor separation, intent, facts, commitments, certainty, responsibility, minimality and natural communication. All replacement fields were read, including expected/acceptable/forbidden IDs and application fact ledgers. Judgments use the existing 21 definitions and the boundaries in [the full semantic review](phase-8-codex-semantic-review.md); none is redefined here.

This is a separate second pass by the supervising task, which participated in earlier supervision. It is **not blind review or independent human approval**. Selection examples contain no generated answer; preservation checks do not claim measured model behavior. Application checks evaluate the authored pair. New synthetic scenarios are assessed on their own evidence, not misrepresented as preserving all facts of the old scenario.

Only two new review artifacts are written. The remediation files, historical 210-example review, other 175 examples, canonical YAML, runtime, schemas, selectors and tests remain unchanged. No candidate activation, routing repair, provider call or Phase 8B work is included.

## Material observations

- **acknowledge_mistake/A2:** the supplied commitment ledger says the call was due yesterday, so the output is grounded. The visibleContext sentence alone can instead be read as saying the promise was made yesterday. Keep the ledger with the case; do not export that sentence alone as complete evidence. This packaging limitation lowers quality, not confidence in the reviewed full record.
- **emotional_validation/A1, reassurance/A1, reassurance/A2 and clarification/A1:** the resulting messages are grounded and preserve meaning. Their visible gains are modest, or the rough draft is deliberately contrived. They are preservation examples, not proof of substantial incremental skill benefit.
- **planning/H2 and en.casual_naturalness/P3:** both reuse the agreed Saturday / 2 p.m. / library scenario. They test different focal choices but are not independent semantic trials. The settled-plan example does not answer the old consequential-verification question.
- **zh.politeness_calibration/H1 and zh.professional_formality/P1:** the same completed-draft / pending-review professional report is useful as a per-modifier contrast. Group these as related evidence rather than count them as independent evidence of uplift.
- **Chinese modifiers:** the supplied script, register preference and existing English terms ground the decisions. No ethnicity-based or universal cultural preference is inferred. Selection-only cases do not establish native-speaker output preference.

No new runtime recommendation is needed. The original six quarantine questions and the original first-time-limit boundary question remain open; all earlier review history stays intact. A clearer replacement is not approval of a taxonomy expansion or proof that any candidate is necessary.

## Per-example decisions

All rows have no identified violation of supplied-input intent, fact, commitment, certainty or responsibility preservation. The application/selection distinction above limits what that statement means. Explicit required, acceptable and forbidden skill sets are in the JSON. FOCAL_ONLY, NEIGHBOR_ONLY and BOTH_VALID describe the supported sets; acceptable co-use is not a requirement or a global conflict.

| Example                        | Decision | Quality    | Confidence | Neighbor judgment | Evidence and rationale                                                                                                                                                                                                                                                                               |
| ------------------------------ | -------- | ---------- | ---------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| apology/P2                     | KEEP     | STRONG     | HIGH       | BOTH_VALID        | The late arrival and the friend's stated wait independently support the user's chosen regret. Ownership is compatible; neither broader dinner blame nor a repair promise is supplied.                                                                                                                |
| apology/N3                     | KEEP     | STRONG     | HIGH       | NEIGHBOR_ONLY     | The organizer explicitly owns the venue change. Asking for the missing location selects clarification, with request compatible; apology or ownership by the user would transfer responsibility.                                                                                                      |
| acknowledge_mistake/H1         | KEEP     | STRONG     | HIGH       | NEIGHBOR_ONLY     | Speaker attribution is explicit: the recipient supplied the wrong address, while the user's sole goal is to report being at the library. Status is the useful neighbor; apology words in quoted context do not create user fault.                                                                    |
| acknowledge_mistake/A2         | KEEP     | ACCEPTABLE | HIGH       | FOCAL_ONLY        | The commitment ledger explicitly puts the call due yesterday, so the output preserves the supplied commitment and adds no replacement call. The visibleContext wording alone is ambiguous about when the promise was made; retain as acceptable only with the ledger, not as a context-only fixture. |
| emotional_validation/H1        | KEEP     | STRONG     | HIGH       | NEIGHBOR_ONLY     | The named file remains unknown despite the recipient's ordinal interpretation. A focused reference question is supported; no distress, emotional recognition goal or reassuring fact warrants validation or reassurance.                                                                             |
| emotional_validation/A1        | KEEP     | ACCEPTABLE | HIGH       | FOCAL_ONLY        | The output recognizes the disappointment the recipient actually expressed, without advice or a new claim. Meaning is sound, but the deliberately tautological draft makes this a modest naturalness example rather than strong evidence of validation-specific uplift.                               |
| reassurance/N2                 | KEEP     | STRONG     | HIGH       | NEIGHBOR_ONLY     | Confirmed backup completion is a status fact, not a concern. The explicit status-only goal and absence of worry make reassurance a genuine near-negative despite the support-associated backup keyword.                                                                                              |
| reassurance/A1                 | KEEP     | ACCEPTABLE | HIGH       | FOCAL_ONLY        | The rewrite preserves co-attendance only and does not promise travel together or companionship throughout the event. It is safe grounded support for the stated worry; the transformation mainly removes repetition.                                                                                 |
| reassurance/A2                 | KEEP     | ACCEPTABLE | HIGH       | FOCAL_ONLY        | The repaired input now explicitly supplies the recipient's worry. The output retains both the backup and unknown recovery, adding no check, deadline or guarantee. Because the draft already contains all reassurance guidance, the visible improvement is mainly shortening.                        |
| boundary_setting/N3            | KEEP     | STRONG     | HIGH       | NEIGHBOR_ONLY     | A one-time capacity question and a one-chapter cap support expectation setting. Repeated pressure is explicitly absent, so the frozen boundary definition is not eligible; this does not decide whether that definition should later broaden.                                                        |
| boundary_setting/A1            | KEEP     | STRONG     | HIGH       | BOTH_VALID        | Repeated calls despite the stated limit independently satisfy the frozen boundary restriction. The rewrite keeps nonurgent work and after 8 p.m. exactly, without shifting the cutoff or adding consequences.                                                                                        |
| boundary_setting/A2            | KEEP     | STRONG     | HIGH       | BOTH_VALID        | The chosen no-more-lending decision and stop request are independently present in context and intent. Won't preserves choice; no inability, excuse or later lending commitment appears.                                                                                                              |
| de_escalation/H1               | KEEP     | STRONG     | HIGH       | NEIGHBOR_ONLY     | Three renewed loan requests establish repeated pressure, but the present exchange and desired wording are explicitly civil. Boundary setting is supported; a separate heat-reduction operation is not needed in this scenario.                                                                       |
| de_escalation/H2               | KEEP     | STRONG     | HIGH       | NEIGHBOR_ONLY     | Earlier conflict is expressly resolved. Restating agreed sender/reviewer roles is planning, not current de-escalation, and supplies no authority to invent timing or reopen disagreement.                                                                                                            |
| de_escalation/A1               | KEEP     | STRONG     | HIGH       | BOTH_VALID        | The concrete disputed total and independently chosen joint check survive. Replacing the personal attack with firm disagreement introduces neither multiple mismatching totals nor a new uncertainty hedge.                                                                                           |
| de_escalation/A2               | KEEP     | STRONG     | HIGH       | BOTH_VALID        | The rewrite removes the insult while keeping the already-stated refusal. It does not infer the recipient's difficulty, fabricate inability, or introduce a concession.                                                                                                                               |
| follow_up/A1                   | KEEP     | STRONG     | HIGH       | BOTH_VALID        | Both draft and output ask for an update on the same visible earlier review request. The rewrite makes that anchor concise without changing the question into a reason-for-silence demand or alleging lateness.                                                                                       |
| status_update/A1               | KEEP     | STRONG     | HIGH       | FOCAL_ONLY        | The synthetic draft now states completion and not-started review explicitly. Both facts survive; no later-review plan is silently deleted and no estimate is introduced.                                                                                                                             |
| expectation_setting/H2         | KEEP     | STRONG     | HIGH       | BOTH_VALID        | Repeated after-8 requests support the boundary, and the separately supplied 9-to-5 availability supports expectation setting. Both jobs are grounded; the example must not infer availability outside that window.                                                                                   |
| expectation_setting/A2         | KEEP     | STRONG     | HIGH       | FOCAL_ONLY        | Only remains attached to the one-chapter maximum this week. The rewrite retains the user's scope limit rather than turning it into a minimum offer or promising more work.                                                                                                                           |
| planning/H2                    | KEEP     | ACCEPTABLE | HIGH       | FOCAL_ONLY        | The time, place and mutual agreement are explicit, and no unknown remains. Planning fits and another clarification does not. This is a valid settled-plan control, but it reuses the Saturday/library scenario and does not test consequential verification.                                         |
| clarification/H1               | KEEP     | STRONG     | HIGH       | BOTH_VALID        | Soon supplies no due date, and the dependent review makes the missing date material. Clarification is useful, with generic request compatible; a confirmation candidate is unnecessary for this variant.                                                                                             |
| clarification/A1               | KEEP     | ACCEPTABLE | HIGH       | FOCAL_ONLY        | The two-report ambiguity is explicit and the question introduces no names. The original draft was already sufficient, so this is acceptable preservation evidence with little demonstrated additional benefit.                                                                                       |
| en.professional_conciseness/P3 | KEEP     | STRONG     | HIGH       | BOTH_VALID        | An actual earlier ask, an English work chat and an explicit concise-professional preference ground the modifier. Follow-up/request can supply the underlying job; no missed deadline or blame is inferred.                                                                                           |
| en.casual_naturalness/P3       | KEEP     | ACCEPTABLE | HIGH       | BOTH_VALID        | An explicit conversational preference, not weekend timing alone, grounds casual wording. All logistics are already agreed. The selection example is valid but shares its scenario with planning/H2 and has no output demonstrating style improvement.                                                |
| en.direct_but_polite/P2        | KEEP     | STRONG     | HIGH       | BOTH_VALID        | The agenda file, chosen send request and respectful expression goal are supplied independently. Directness shapes that existing request without adding urgency, authority or entitlement.                                                                                                            |
| en.direct_but_polite/H1        | KEEP     | STRONG     | HIGH       | NEIGHBOR_ONLY     | Known two-complete/one-unfinished progress and an explicit professional preference support professional conciseness and status. No request, refusal or limit gives direct-but-polite a separate job.                                                                                                 |
| en.direct_but_polite/A1        | KEEP     | STRONG     | HIGH       | BOTH_VALID        | Won't preserves the user's refusal without claiming inability. The sentence is complete and civil; a refusal atom may complement the expression modifier without changing the decision.                                                                                                              |
| zh.politeness_calibration/H1   | KEEP     | STRONG     | HIGH       | NEIGHBOR_ONLY     | The Chinese input explicitly requests a professional progress report and supplies both status facts. Professional formality fits; no request, refusal or boundary calls for politeness calibration.                                                                                                  |
| zh.professional_formality/P1   | KEEP     | STRONG     | HIGH       | BOTH_VALID        | Simplified script, professional register and both progress facts are explicitly supplied. The modifier must not create a completion date. This shares a useful contrast family with zh.politeness_calibration/H1, not an independent semantic trial.                                                 |
| zh.professional_formality/P2   | KEEP     | STRONG     | HIGH       | BOTH_VALID        | Traditional script, the user's missed delivery, one-of-two completed sections and the ownership goal are explicit. Professional wording may preserve all of them without an excuse or replacement deadline; native preference is not measured by this selection-only case.                           |
| zh.professional_formality/H2   | KEEP     | STRONG     | HIGH       | NEIGHBOR_ONLY     | A single chosen file request in a personal chat supports request and calibrated politeness. The input expressly rejects work-report style, so excluding professional formality is scenario-specific, not a global modifier conflict.                                                                 |
| zh.natural_conciseness/P2      | KEEP     | STRONG     | HIGH       | BOTH_VALID        | The Traditional Chinese invitation and refusal choice are fixed before style selection. Brief natural expression must retain the no without a reason or alternative date; the modifier does not choose the decision.                                                                                 |
| zh.natural_conciseness/H2      | KEEP     | STRONG     | HIGH       | BOTH_VALID        | The input supplies actual repeated request wording and an English term already used by both parties. Concision and code-switch preservation each have visible work; neither invents jargon or changes the requested minutes into a request to perform a review.                                      |
| zh.code_switching/H1           | KEEP     | STRONG     | HIGH       | NEIGHBOR_ONLY     | The purely Chinese intended restatement contains real repetition and fully agreed logistics. Natural concision is supported, but there is no mixed term for code-switching to preserve; adding English would be unsupported.                                                                         |

## Draft-state and evaluation limits

Application rows remain REWRITE_DRAFT. Selection rows retain their existing actions; quoted intended wording in context is not proof that an application compose box contains a draft. The upstream draft-state/action gate is not tested or changed here.

For later paired-mode evaluation, hold intent and independently visible facts fixed outside the draft. In particular preserve the due-yesterday commitment, attendance-only support, unknown recovery, after-8 cutoff, refusal and one-chapter cap. If the draft is the only source of a fact or choice, an empty-draft version must not invent it. No rewrite/generate skill split is needed.

All 35 replacements are exposed AUTHORING_ONLY material, not held-out evidence. This review neither runs current routing nor measures generic-versus-skill-guided uplift. Shared scenario families must remain together in future development/held-out assignment.

## Focused human audit

No new replacement requires mandatory ambiguity/safety escalation. Following the same method, the proposed clean-KEEP audit is **7 of 35 (20%)**. It covers P/N/H/A, universal/English/Chinese modifier groups, and explicit Simplified and Traditional Chinese.

Seed: `phase8a-remediation-second-review-2026-09-19-v1`. Order keys by raw SHA-256(seed + newline + key), with key as tie-break. Select one per category in P/N/H/A order, then add missing English/Chinese modifier groups, then missing zh-Hans/zh-Hant; fill remaining slots by rank to seven. This is marginal coverage, not a claim that every category-by-language combination is sampled.

- apology/P2 — POSITIVE, UNIVERSAL, en.
- apology/N3 — NEGATIVE, UNIVERSAL, en.
- zh.code_switching/H1 — NEIGHBOR, ZH_MODIFIER, zh.
- acknowledge_mistake/A2 — APPLICATION, UNIVERSAL, en.
- en.direct_but_polite/A1 — APPLICATION, EN_MODIFIER, en.
- zh.professional_formality/P1 — POSITIVE, ZH_MODIFIER, zh-Hans.
- zh.professional_formality/P2 — POSITIVE, ZH_MODIFIER, zh-Hant.

This list proposes focused human checking; no human review has been performed or signed off. It does not reopen the obsolete all-210-human blocker or close the earlier outstanding human review.

## Verification

Artifact verification passed: exactly 35 source keys; source, row, replacement and definition digests; all decisions and quality totals; reproducible seven-case audit; matching Markdown/JSON judgments; all 174 pre-existing non-ignored files byte-identical; exactly two new review files.

Commands and results:

- `node node_modules/prettier/bin/prettier.cjs --write --ignore-path .gitignore docs/skills/phase-8-weak-invalid-rereview.md packages/skills/tests/fixtures/phase8/weak-invalid-rereview.json` — passed with authorized worktree access after the initial sandbox denied writes.
- Inline Node integrity audit via `node --conditions=development --import tsx --input-type=module` with `TSX_DISABLE_CACHE=1` — passed all artifact checks listed above; assertions reconstructed counts, bindings and audit selection from the source files.
- `pnpm skills:verify-production` — passed: 21 exact definitions, 153 ordered plans, public exports, deep freezing and authoring exclusion.
- `node node_modules/prettier/bin/prettier.cjs --check --ignore-path .gitignore docs/skills/phase-8-weak-invalid-rereview.md packages/skills/tests/fixtures/phase8/weak-invalid-rereview.json` — passed.
- `git -c core.safecrlf=false diff --check` — passed; new-file formatting and content were checked separately above.

No test code was added. The full lint/typecheck/test/build suite is not rerun for this review-only increment; no executable source changed. These integrity checks do not independently prove semantic truth or human approval. All 35 current replacements were read and judged separately as recorded above.

## Stop condition

Deliver this review only. Do not apply replacements to canonical YAML, change approval state, begin Phase 8B or restart recurring monitoring.
