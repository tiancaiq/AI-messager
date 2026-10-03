# Phase 8A — Full Codex semantic review

Status: semantic review delivered; focused human escalation/audit outstanding. Reviewer type: **CODEX_SEMANTIC_REVIEW**. Date: 2026-09-19. Branch/worktree: `skills` / `AI messager-skills`.

## Executive summary

Codex reviewed **all 210 original examples across all 21 current definitions**, using the eight named Phase 3–8 documents and the actual YAML as the source of truth. Every example has an individual decision, quality rating, confidence, preservation checks, explicit neighbor/negative interpretation and a specific rationale. Every REVISE has an exact proposed replacement. This is the complete first semantic review requested by the user, not another provisional flagging packet.

| Decision       | Count |
| -------------- | ----: |
| KEEP           |   129 |
| REVISE         |    71 |
| REJECT         |     4 |
| QUARANTINE     |     6 |
| Total reviewed |   210 |

| Quality of original example | Count |
| --------------------------- | ----: |
| STRONG                      |   134 |
| ACCEPTABLE                  |    41 |
| WEAK                        |    28 |
| INVALID                     |     7 |

Confidence: **196 HIGH, 8 MEDIUM, 6 LOW**. All six LOW decisions are quarantined. Quality and disposition are separate: a strong scenario can need annotation repair; plausible wording can be invalid when it changes meaning.

Human review is focused on **17 critical/boundary cases**, including all six quarantines, plus **20 of 129 clean KEEP cases (15.5%)**. That is **37 unique original cases (17.6% of 210)**, not a demand for manual review of all 210. Ordinary unambiguous revisions do not acquire a new human-every-case gate.

The authoritative [machine ledger](../../packages/skills/tests/fixtures/phase8/codex-semantic-review.json) contains the full original examples, bindings, proposed replacements and audit population. No proposal has been applied to canonical YAML. All 21 runtime definitions, selection/composition/AgentAction logic, generated registry, schemas, existing preparation fixtures and frozen Phase 7 evidence remain unchanged.

## Authority, method and limits

The user's 35-section **Full Semantic Review by Codex** instruction replaces the prior all-210-human-review requirement in the [execution plan](../../.agent/plans/skills-phase-8-candidate-evaluation.md). The [preparation report](phase-8-example-review.md), [calibration packet](phase-8-calibration-packet.md) and [mode packet](phase-8-mode-coverage.md) are retained as historical evidence with supersession notices. Their null human fields remain truthful. No human reviewer, approval or signature is fabricated.

Reviewed inputs: [Phase 3 normalization](phase-3-capability-normalization.md), [Phase 4 design](phase-4-registry-design.md), [Phase 5 canonical content](phase-5-registry-expansion.md), [Phase 6 evaluation design](phase-6-evaluation-design.md), [Phase 7 migration](phase-7-registry-migration.md), and the three Phase 8 preparation documents above. Each runtime definition, its neighbor/conceptual metadata and all ten P/N/H/A examples were inspected. No external research or provider calls were needed for this repository-source review.

Decisions assess relevance, neighbor distinction, intent, facts, commitments, certainty, responsibility, minimality and natural wording. A described wrong act in a correctly excluding negative is not itself an example defect. Selection examples contain no generated answer: preservation checks evaluate their supplied intent/evidence rather than pretending to measure output. KEEP means sound authoring evidence, not measured uplift, current router correctness or approval to publish examples into runtime.

For REVISE, `originalExample` and its digest remain intact; `proposedRevision.changes` lists exact edits and `proposedRevision.example` is the full replacement, bound to its own digest. The old `sourceText` stays verbatim as historical provenance and must not be interpreted as newly authored wording. Where a proposed scenario adds explicit register/intent or repairs a draft, it is labeled a **synthetic variant**, not an assertion that the original source contained the new fact. Original neighbor judgments are kept distinct from proposed annotations.

The sole extra issue code, `PROVENANCE_EXPANSION`, distinguishes a current grounded scenario from an unverified expansion of earlier source evidence. It avoids falsely classifying the current named reports in clarification/A1 as absent. No newly written case is held out: current use is AUTHORING_ONLY and NOT_HELD_OUT. Clean KEEP material is DEV_EVAL_ALLOWED only after executable annotation/fixture conversion; rejected/quarantined material is historical or failure-analysis evidence, not valid gold.

## All 21 skill boundaries

These statements interpret current fields and expose tensions; they do not rewrite runtime definitions.

### apology

- **Primary job:** Express proportionate regret for supported user-caused error or impact.
- **Select when:** The user chooses regret and responsibility/impact is independently supported.
- **Do not select when:** Another person's fault, a plain refusal, unsupported blame or sympathy mistaken for ownership.
- **Nearest neighbors:** acknowledge_mistake; emotional_validation.
- **Key distinction:** Regret differs from factual ownership; both may fit. An upsetting experience alone does not prove fault.

### acknowledge_mistake

- **Primary job:** Name the user's supported error or missed commitment.
- **Select when:** A concrete user-owned mistake/delay is visible and ownership is chosen.
- **Do not select when:** Disputed/denied fault, another person's error, or an external delay merely being reported.
- **Nearest neighbors:** apology; status_update.
- **Key distinction:** Ownership need not express regret; status need not imply fault. H1 lacks impact ownership.

### emotional_validation

- **Primary job:** Acknowledge a visible upsetting experience, feeling or difficulty.
- **Select when:** The other person expresses a feeling or clearly upsetting difficulty and recognition is the user's goal.
- **Do not select when:** Neutral logistics, unsupported accusations as fact, inferred emotions or forced advice.
- **Nearest neighbors:** reassurance; perspective_acknowledgement (candidate).
- **Key distinction:** Visible difficulty is broader than emotion in the current runtime; a separate perspective atom must beat this overlap.

### reassurance

- **Primary job:** Offer evidence-grounded support for a visible concern.
- **Select when:** A concern and a real supporting fact or already-chosen offer/commitment exist.
- **Do not select when:** Unsupported success predictions, no concern, or reassurance that reverses the user's refusal.
- **Nearest neighbors:** emotional_validation; encouragement (conceptual).
- **Key distinction:** Recognition needs no support promise; reassurance requires a grounded reason for support. Co-attendance is not accompaniment.

### boundary_setting

- **Primary job:** State the user's chosen limit under repeated pressure in the frozen definition.
- **Select when:** A chosen limit and repeated pressure are supported; preserve its exact scope.
- **Do not select when:** No chosen limit; a one-off refusal; mere timing inquiry. Civil first-time limits expose an unresolved definition restriction.
- **Nearest neighbors:** decline; de_escalation; expectation_setting.
- **Key distinction:** Repeated-pressure limits differ from one no and from timing/capacity estimates. Do not broaden the runtime description through examples.

### de_escalation

- **Primary job:** Reduce visible conflict's unnecessary heat while preserving the position.
- **Select when:** Conflict/pressure is independently visible and the user wants calm wording.
- **Do not select when:** Punctuation-only conflict inference, calm coordination, forced agreement or guilt.
- **Nearest neighbors:** boundary_setting; request; give_constructive_feedback (candidate).
- **Key distinction:** Removing accusations does not erase refusal or create concessions; a dispute-resolution playbook may include this atom.

### decline

- **Primary job:** Communicate the user's already chosen refusal.
- **Select when:** A specific request/invitation is refused, including the refused part of a conditional alternative.
- **Do not select when:** Acceptance, undecided intent, or a request for details before choosing.
- **Nearest neighbors:** boundary_setting; planning.
- **Key distinction:** A one-off no differs from an ongoing rule; refusing Tuesday and offering Friday supports both decline and planning.

### ask_for_help

- **Primary job:** Request a concrete form of assistance without creating obligation.
- **Select when:** The user chooses help with a supplied task or difficulty.
- **Do not select when:** Offering help, reporting completion, pressure after refusal, or a bare document request without help framing.
- **Nearest neighbors:** request; clarification.
- **Key distinction:** Assistance is a specific request; general request guidance may coexist. Missing-reference inquiry is not automatically asking for help.

### follow_up

- **Primary job:** Revisit a supported earlier request without presuming neglect.
- **Select when:** The earlier ask is visible/user-supplied and an unresolved follow-up goal exists.
- **Do not select when:** No observed earlier ask, fully answered request, or guilt aimed at overturning refusal.
- **Nearest neighbors:** request; status_update.
- **Key distinction:** A revisit remains a request; reporting one's own progress is different. No recent observed messaging evidence is not proof of no interaction.

### status_update

- **Primary job:** Report known current state or progress.
- **Select when:** The user supplies status or is answering a status request using known facts.
- **Do not select when:** Unknown status being requested, fabricated progress, or solely future timing/logistics.
- **Nearest neighbors:** expectation_setting; planning; follow_up.
- **Key distinction:** Reporting completed/pending state differs from estimates and coordination. Preserve any actual next-step content in rewrites.

### expectation_setting

- **Primary job:** Communicate supported timing, scope or capacity at the user's certainty.
- **Select when:** An estimate, duration, scope cap or availability limit is supplied.
- **Do not select when:** No timing/scope information, completion-only reporting, or asking another's requirements.
- **Nearest neighbors:** status_update; boundary_setting.
- **Key distinction:** Future estimate versus present report is clear; broad limits overlap with the narrower repeated-pressure boundary definition.

### planning

- **Primary job:** Clarify supported time, place, roles and coordination steps.
- **Select when:** Logistics are supplied as proposed or agreed; preserve that distinction.
- **Do not select when:** No attendance choice, completion-only report, or refusal of all options without an alternative.
- **Nearest neighbors:** request; expectation_setting; confirmation (candidate).
- **Key distinction:** A new ask can coexist with logistics; verification of apparent agreement may already be a coordination step.

### clarification

- **Primary job:** Word one question resolving a material missing or ambiguous detail.
- **Select when:** A specific unknown blocks the intended communication and the user intends to ask.
- **Do not select when:** Already understood detail without reason to verify, unrelated curiosity, or coach-level ASK_CLARIFICATION.
- **Nearest neighbors:** request; confirmation (candidate).
- **Key distinction:** Known-file transfer is a request; consequential verification may overlap this job and needs a product boundary decision.

### request

- **Primary job:** Express a chosen desired action clearly with room for a truthful response.
- **Select when:** The requested action and material scope are supported.
- **Do not select when:** No chosen ask, completed-action reporting, covert relationship tests or coercion.
- **Nearest neighbors:** ask_for_help; follow_up; clarification; planning.
- **Key distinction:** These can be more specific requests, not mutually exclusive alternatives; prefer useful specificity without invented exclusions.

### en.professional_conciseness

- **Primary job:** Use concise professional English in eligible work-chat operations.
- **Select when:** English professional register is observable/chosen for status, requests or follow-up.
- **Do not select when:** Unsupported/Chinese-only primary context, non-wording actions, or personal planning with no professional preference.
- **Nearest neighbors:** en.casual_naturalness; en.direct_but_polite.
- **Key distinction:** Register and brevity differ from clear refusal/request expression; professional does not mean email ceremony.

### en.casual_naturalness

- **Primary job:** Use brief conversational English for casual replies and planning.
- **Select when:** Supported English and an informal context or explicit conversational preference exist.
- **Do not select when:** Non-wording actions, unsupported language, or professional status with no casual preference.
- **Nearest neighbors:** en.professional_conciseness; en.direct_but_polite.
- **Key distinction:** Casual does not mean slang, affection or a softened no. Weekend alone does not establish register.

### en.direct_but_polite

- **Primary job:** Make an English request, refusal or limit explicit and respectful.
- **Select when:** The decision/request is already chosen and English is eligible.
- **Do not select when:** Unknown decision, unsupported language or a pure status report without request/limit.
- **Nearest neighbors:** request; decline; boundary_setting; en.professional_conciseness.
- **Key distinction:** This modifies expression; universal atoms express the job. Will not must not become cannot.

### zh.politeness_calibration

- **Primary job:** Calibrate Chinese request/refusal/limit politeness without changing meaning.
- **Select when:** Eligible Chinese, an actual chosen operation and observable expression needs.
- **Do not select when:** Non-wording/unsupported-primary context or a pure progress report with no request/refusal/limit.
- **Nearest neighbors:** zh.professional_formality; zh.natural_conciseness; decline; request.
- **Key distinction:** Politeness differs from professional register and concision; no nationality-based norm or invented excuse.

### zh.professional_formality

- **Primary job:** Use concise professional Chinese for status, delay and follow-up.
- **Select when:** Work-chat register or an explicit professional preference is supplied with eligible Chinese.
- **Do not select when:** English/unsupported primary, non-wording action, or casual coordination without professional need.
- **Nearest neighbors:** zh.natural_conciseness; zh.politeness_calibration.
- **Key distinction:** Professional is a contextual register, not a cultural default or permission to strengthen promises.

### zh.natural_conciseness

- **Primary job:** Remove redundant Chinese chat wording while preserving the message.
- **Select when:** Eligible Chinese planning/invitation/request context with concise natural expression useful.
- **Do not select when:** Non-wording/unsupported language or no demonstrated brevity need; formal status alone favors the register-specific modifier.
- **Nearest neighbors:** zh.professional_formality; zh.politeness_calibration; zh.code_switching.
- **Key distinction:** Concision can coexist with politeness or term preservation; do not delete uncertainty, limits or the chosen action.

### zh.code_switching

- **Primary job:** Preserve intentional English terms already used in supported Chinese/mixed chat.
- **Select when:** Chinese or supported mixed primary context, switching evidence and existing terms exist.
- **Do not select when:** Pure Chinese, English-only without switching, or unsupported primary even with Chinese secondary.
- **Nearest neighbors:** zh.natural_conciseness; general identifier fidelity.
- **Key distinction:** Term preservation is the distinct expression job; identifier fidelity in Korean does not authorize a Chinese modifier.

## Neighbor patterns

Patterns are semantic authoring guidance, not a claim that the current tag extractor can route them. “Only” identifies the distinct useful job in that scenario; it does not create blanket conflicts. Request/help/follow-up/clarification are partly nested, and some A-only distinctions are differences in useful specificity rather than logical exclusion.

### apology / acknowledge_mistake

| Dimension     | Pattern                                                                |
| ------------- | ---------------------------------------------------------------------- |
| A job         | Regret for supported impact.                                           |
| B job         | Factual ownership of a user error.                                     |
| A only        | Apologize for user-caused waiting without a discrete error to correct. |
| B only        | Correct 42 to 24, explicitly no regret.                                |
| Both valid    | Own a wrong address and express chosen regret.                         |
| Neither valid | Report another person's error without ownership.                       |

### emotional_validation / reassurance

| Dimension     | Pattern                                                                 |
| ------------- | ----------------------------------------------------------------------- |
| A job         | Recognize expressed experience.                                         |
| B job         | Support concern with known facts.                                       |
| A only        | Acknowledge explicitly stated sadness, no support fact.                 |
| B only        | Restate an already-committed accompaniment to address being alone.      |
| Both valid    | Acknowledge worry and restate a verified backup, with recovery unknown. |
| Neither valid | Neutral logistics with no feeling, difficulty or concern.               |

### boundary_setting / decline

| Dimension     | Pattern                                                                    |
| ------------- | -------------------------------------------------------------------------- |
| A job         | Repeated-pressure limit.                                                   |
| B job         | Specific chosen no.                                                        |
| A only        | Repeated unwanted photo sharing; require consent, no invitation to refuse. |
| B only        | One invitation refused, no ongoing rule.                                   |
| Both valid    | Repeated lending request; refuse this loan and further requests.           |
| Neither valid | No chosen limit or response to invitation.                                 |

### boundary_setting / de_escalation

| Dimension     | Pattern                                                       |
| ------------- | ------------------------------------------------------------- |
| A job         | Keep a chosen limit explicit.                                 |
| B job         | Reduce visible heat.                                          |
| A only        | Civil limit under independently visible repeated pressure.    |
| B only        | Heated disagreement over figures, no personal limit.          |
| Both valid    | Restate a chosen boundary calmly during an explicit argument. |
| Neither valid | Calm status report without pressure or chosen limit.          |

### status_update / expectation_setting

| Dimension     | Pattern                                                         |
| ------------- | --------------------------------------------------------------- |
| A job         | Known present state.                                            |
| B job         | Supported future timing/scope.                                  |
| A only        | Draft complete, review not started, no estimate.                |
| B only        | Probably tomorrow, no progress statement.                       |
| Both valid    | Draft complete; review probably tomorrow, uncertainty retained. |
| Neither valid | Ask for unknown status without a supplied estimate.             |

### planning / request

| Dimension     | Pattern                                                         |
| ------------- | --------------------------------------------------------------- |
| A job         | Coordinate supplied logistics.                                  |
| B job         | Seek chosen action.                                             |
| A only        | Restate already-agreed Saturday/library/2 p.m.                  |
| B only        | Ask for agenda without logistics.                               |
| Both valid    | Ask agreed sender to send the draft for the agreed review step. |
| Neither valid | Report yesterday's completed work with no next step.            |

### follow_up / request

| Dimension     | Pattern                                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------------------------- |
| A job         | Revisit an earlier supported ask.                                                                                 |
| B job         | Express a desired action.                                                                                         |
| A only        | Neutral check on the disposition of a prior ask, without a new requested action; conceptually still request-like. |
| B only        | First request for a file.                                                                                         |
| Both valid    | Revisit the agenda request and clearly ask for a response.                                                        |
| Neither valid | Plain completed-status acknowledgement, no ask.                                                                   |

### clarification / request

| Dimension     | Pattern                                                                                       |
| ------------- | --------------------------------------------------------------------------------------------- |
| A job         | Resolve a concrete unknown.                                                                   |
| B job         | Seek a supported action.                                                                      |
| A only        | Which of two files is meant; inquiry specificity is primary, generic request overlap remains. |
| B only        | Send the known file.                                                                          |
| Both valid    | Ask recipient to identify and then send the intended file only when both actions were chosen. |
| Neither valid | Already understood detail with no chosen action.                                              |

### en.direct_but_polite / boundary_setting

| Dimension     | Pattern                                                                        |
| ------------- | ------------------------------------------------------------------------------ |
| A job         | Respectful explicit English expression.                                        |
| B job         | Chosen limit under repeated pressure.                                          |
| A only        | Clear file request, no limit.                                                  |
| B only        | Supported non-English repeated-pressure boundary; English modifier ineligible. |
| Both valid    | An English no-more-lending limit under repeated pressure.                      |
| Neither valid | English status-only update.                                                    |

### en.direct_but_polite / request

| Dimension     | Pattern                                                          |
| ------------- | ---------------------------------------------------------------- |
| A job         | English expression convention.                                   |
| B job         | Underlying action-seeking job.                                   |
| A only        | English refusal without a requested action.                      |
| B only        | Supported non-English file request; English modifier ineligible. |
| Both valid    | English chosen file request made explicit and respectful.        |
| Neither valid | No chosen decision or requested action.                          |

### zh.politeness_calibration / zh.professional_formality

| Dimension     | Pattern                                                          |
| ------------- | ---------------------------------------------------------------- |
| A job         | Politeness for chosen request/no/limit.                          |
| B job         | Professional register for status/delay/follow-up.                |
| A only        | Personal Chinese file request with politeness preference.        |
| B only        | Concise professional Chinese progress report.                    |
| Both valid    | Professional follow-up that also explicitly asks for a response. |
| Neither valid | Non-wording action, or unsupported primary language.             |

### zh.politeness_calibration / zh.natural_conciseness

| Dimension     | Pattern                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------- |
| A job         | Proportionate politeness.                                                                |
| B job         | Natural brevity.                                                                         |
| A only        | An already brief blunt Chinese request needs 请, not further shortening.                 |
| B only        | Redundant restatement of an agreed Saturday plan, no politeness problem.                 |
| Both valid    | Verbose chosen Chinese request needing both shortening and politeness.                   |
| Neither valid | Already natural sufficient wording with no requested improvement, or non-wording action. |

### zh.professional_formality / zh.natural_conciseness

| Dimension     | Pattern                                                                                             |
| ------------- | --------------------------------------------------------------------------------------------------- |
| A job         | Professional register fit.                                                                          |
| B job         | Concise chat expression.                                                                            |
| A only        | Professional status report; no planning/invitation/request operation for the other modifier.        |
| B only        | Casual Chinese weekend plan.                                                                        |
| Both valid    | Concise professional Chinese follow-up that includes a chosen request and actual redundant wording. |
| Neither valid | No wording action or no eligible Chinese context.                                                   |

### What the neighbor review changed

Classification has the same meaning in P/N/H/A rows: FOCAL_ONLY supports only the focal skill in the reviewed set; NEIGHBOR_ONLY supports only named other skills; BOTH_VALID permits focal and other guidance, with co-selection mandatory only for IDs in required; NEITHER has no supported current skill; CONTEXT_INSUFFICIENT records an unresolved classification. Compatible does not mean mandatory or globally exclusive.

The supervisor's consistency pass removed an unsupported professional modifier from acknowledge_mistake/N3 and removed boundary_setting from de_escalation/P2: an ordinary progress report does not establish professional register, and a heated family discussion does not establish repeated pressure. The same pressure distinction is applied to zh.politeness_calibration/P3 and the boundary-setting A1 escalation. Review annotations use supplied evidence consistently; no source scenario or runtime restriction is silently broadened.

All 42 H cases received actual judgments: optional labels were replaced with clearer required/compatible/forbidden interpretations where supported; six cases were quarantined and the abstract multi-step dispute/playbook case was rejected. No empty required set is silently promoted to executable global NONE. In the ledger, every negative has explicit focal exclusion and otherSkills REQUIRED, ACCEPTABLE or NONE. NONE means either all skills are ineligible for the fixed non-wording action, or no other skill is supported by the supplied evidence; these are distinguished and are not measured router results.

Partial nesting matters. `request/H1` supports help-specific guidance plus compatible request wording; `request/H2` supports follow-up plus compatible request wording. `decline/H2` requires preserving both refusal of Tuesday and the explicitly offered Friday alternative. Style modifiers and universal jobs can also coexist: a clear English refusal does not exclude decline, and Chinese politeness cannot decide the refusal itself.

Some original H rows do not specify enough register, concrete operation or benefit to require a particular modifier. Their replacement scenarios add these inputs explicitly. They do not retroactively make the original evidence complete.

## High-risk findings and the five prior flags

| Original case                                                                                               | Decision / quality / confidence | Resolved finding and exact proposed wording                                                                                                                                                                                                              |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [boundary_setting/A2](../../packages/skills/definitions/atomic/decisions_limits/boundary_setting.yaml#L201) | REVISE / INVALID / HIGH         | A chosen no became inability. Use: **I won't lend you any more money. Please stop asking.**                                                                                                                                                              |
| [en.direct_but_polite/A1](../../packages/skills/definitions/modifiers/en/direct_but_polite.yaml#L180)       | REVISE / INVALID / HIGH         | Will not became cannot. Use: **No, I won't take on that extra task.**                                                                                                                                                                                    |
| [de_escalation/A2](../../packages/skills/definitions/atomic/conflict_feedback/de_escalation.yaml#L199)      | REVISE / INVALID / HIGH         | Pressure did not establish difficulty or inability. Use: **I've already said no. I won't take the extra shift.**                                                                                                                                         |
| [clarification/A1](../../packages/skills/definitions/atomic/understanding_inquiry/clarification.yaml#L174)  | REVISE / WEAK / HIGH            | Current visibleContext explicitly names sales/budget and grounds the answer. Earlier source only named two reports; use provenance-conservative context and **Which of the two reports do you mean?** The full fact-ledger correction is recorded below. |
| [reassurance/A1](../../packages/skills/definitions/atomic/recognition_support/reassurance.yaml#L182)        | REVISE / INVALID / HIGH         | Co-attendance does not promise accompaniment. Use: **I'll be attending too.** Correct the derived commitment ledger to attendance only.                                                                                                                  |

Additional material findings:

- **emotional_validation/A1:** “don't be sad” → acknowledgement changes the draft's instruction. The explicit chosen intent supports a better response, but this is a poor preservation demonstration. Revise the draft to acknowledgement so the pair actually preserves intent.
- **reassurance/A2:** “everything is fine” → unknown recovery changes certainty, even though correcting unsupported certainty is responsible. The proposed pair starts uncertain and avoids the extra checking step. No unsupported guarantee becomes a preservation example.
- **de_escalation/A1:** disputed total does not establish a pair of mismatching totals. The proposed wording keeps disagreement and the independently chosen joint check without adding that comparison.
- **follow_up/A1:** asking why no reply differs from asking for review progress. A revised progress-check draft isolates non-accusatory follow-up from an unapproved change of question.
- **status_update/A1:** “review later” can contain a future plan; the replacement draft says review not started, matching the intended current-status example.
- **expectation_setting/A2:** preserve **only one chapter**, rather than weakening the cap to an apparently nonexclusive offer.
- **boundary_setting/A1:** preserve **after 8 p.m.** rather than shifting the exact cutoff to before 8.
- **acknowledge_mistake/A2:** put yesterday on the due call, not when the promise was made: **I forgot to make the call I'd promised for yesterday.**

The illustrative “Testing is taking longer than expected” in the user's instruction is valid only if testing delay is independently supplied. A probably-cannot-finish draft alone does not justify inventing that reason. This review applies the hard no-invention rule to examples as well as definitions.

## Language modifiers and contextual evidence

The seven modifiers concern expression, not communication decisions. Observable script, actual mixed terms, chosen register, redundancy and fixed intent are the evidence. Neither a person's ethnicity nor a generic English/Chinese label establishes preference for a style.

Chinese semantic/structural judgments were made directly; **no Chinese case was quarantined merely for being Chinese**. Traditional target script in zh.politeness_calibration/A2 is explicit; the invitation is grounded in the stated user intent. The refusal remains intact. zh.professional_formality/A2 is ACCEPTABLE/MEDIUM: explicit uncertainty remains, although native speakers may prefer different hedge choices. This is a style-confidence limitation, not evidence of a new promise.

Professional context is not inferred from every progress report. Several P/H replacements explicitly supply a professional preference. Likewise, weekend does not by itself mean casual, and mixed terms do not prove that shortening is needed. zh.natural_conciseness/H2's new synthetic request supplies both redundant wording and the existing term, making combined concision/code-switching meaningful.

No word-choice rule is universalized into “Chinese people prefer…” or “English speakers prefer…”. Native-style preference can be audited by a competent reviewer; the clear semantic decisions remain Codex judgments.

## Duplicate decisions

### Group 1: RETAIN_SHARED_ELIGIBILITY_CONTRAST

Cases: [en.professional_conciseness/N1](../../packages/skills/definitions/modifiers/en/professional_conciseness.yaml#L97), [en.casual_naturalness/N1](../../packages/skills/definitions/modifiers/en/casual_naturalness.yaml#L93), [en.direct_but_polite/N1](../../packages/skills/definitions/modifiers/en/direct_but_polite.yaml#L98), [zh.professional_formality/N2](../../packages/skills/definitions/modifiers/zh/professional_formality.yaml#L113), [zh.natural_conciseness/N2](../../packages/skills/definitions/modifiers/zh/natural_conciseness.yaml#L111).

Same Korean gate exercises five different focal modifier exclusions. Useful regression reuse, but one dependent semantic scenario; not independent evidence of five style benefits.

### Group 2: RETAIN_SHARED_ACTION_CONTRAST

Cases: [en.professional_conciseness/N3](../../packages/skills/definitions/modifiers/en/professional_conciseness.yaml#L131), [zh.natural_conciseness/N3](../../packages/skills/definitions/modifiers/zh/natural_conciseness.yaml#L128).

Same no-reply job across English and Chinese checks language-independent action precedence. Count as one action template, not independent quality observations.

### Group 3: RETAIN_SHARED_LANGUAGE_CONTRAST

Cases: [zh.politeness_calibration/N1](../../packages/skills/definitions/modifiers/zh/politeness_calibration.yaml#L95), [zh.professional_formality/N1](../../packages/skills/definitions/modifiers/zh/professional_formality.yaml#L96).

English-only excludes both Chinese modifiers; useful per-definition guard with shared scenario dependence.

### Group 4: REVISE_FIRST_RETAIN_DISTINCT_FOCAL_EXCLUSIONS

Cases: [zh.politeness_calibration/H1](../../packages/skills/definitions/modifiers/zh/politeness_calibration.yaml#L146), [zh.natural_conciseness/H1](../../packages/skills/definitions/modifiers/zh/natural_conciseness.yaml#L145).

The first lacks professional register and gets an explicit synthetic work-chat preference; the second already states formal work progress. Both contrast a different focal modifier against professional formality, and remain one related scenario family.

These decisions retain useful per-definition guards while grouping dependence. The repeated contexts are not five independent semantic trials, and no source row was deleted. Four REJECT decisions concern low-discrimination/ill-formed scenarios rather than automatic duplicate removal: [apology/N3](../../packages/skills/definitions/atomic/accountability_repair/apology.yaml#L131), [reassurance/N2](../../packages/skills/definitions/atomic/recognition_support/reassurance.yaml#L115), [boundary_setting/N3](../../packages/skills/definitions/atomic/decisions_limits/boundary_setting.yaml#L131), [de_escalation/H2](../../packages/skills/definitions/atomic/conflict_feedback/de_escalation.yaml#L161).

## Skill-boundary issues and runtime recommendations

### Repeated-pressure restriction versus ordinary limits

Evidence: boundary_setting/A1, de_escalation/H1, expectation_setting/H2. The frozen boundary definition says **under repeated pressure**, while some authoring claims label any civil/ongoing limit a boundary. Expectation_setting also broadly describes supported limits. This is a real specification mismatch; the review does not invent pressure to make it disappear.

**RUNTIME_CHANGE_RECOMMENDED — separately reviewed proposal only:** clarify whether a supported personal limit may be expressed before repetition. If the product wants that broader function, proposed description is “Use when the user intends to state a supported personal limit, including under repeated pressure.” Eligibility, negative cases, expectation-setting overlap and behavior/version implications must be evaluated together in a later authorized change. This review does not edit the field or implement new routing. The three cited cases are in the mandatory human boundary set.

### Supported impact and ownership

acknowledge_mistake/H1 does not identify who caused the supported impact. Sympathy and user-owned apology are different. QUARANTINE the current case until ownership is specified; do not require apology simply to force separation from acknowledgement. This needs source/intent judgment, not a runtime change now.

### Candidate-adjacent findings

| Candidate                   | Existing overlap and review conclusion                                                                                                                                                                                                                                           | Evidence needed before any later study                                                                                                                                    |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| perspective_acknowledgement | **CANDIDATE_MAY_BE_REDUNDANT.** Emotional validation already covers a visible difficulty, not only an emotion. Recognizing a stated interpretation without endorsing motive may fit an extension of that guidance. The categorical no-emotion H1 is insufficient to prove a gap. | Compare precise stated-interpretation cases with the existing visible-difficulty guidance and fixed intent; do not invent emotions or force a new atom.                   |
| confirmation                | **CANDIDATE_MAY_BE_REDUNDANT.** Clarification of remaining uncertainty and planning's next coordination step overlap checking an apparent agreement. Phase 3's “which deliverable Friday applies to” is actually missing-information clarification.                              | Separate one understood, consequential proposition from two unresolved alternatives and needless rechecking; test an existing-guidance variant before taxonomy expansion. |
| give_constructive_feedback  | **CANDIDATE_MAY_BE_REDUNDANT.** Request plus supported context can express a desired change, while de-escalation removes attacks when heat exists. Behavior–impact–change structure may help, but current prose does not prove an independently selected atom is needed.         | Compare supported observations/impact and a chosen action against the best existing composition; do not assert failure of composition without results.                    |

These are boundary findings, not 8B candidate dossiers or activation decisions. Existing skills are not narrowed artificially to make room for candidates. No candidate ID or intent tag is added.

## Paired draft-mode recommendations

All 42 canonical A examples are still REWRITE_DRAFT. That is an authoring-coverage gap, not a reason to create rewrite/generate skill pairs. The [existing mode packet](phase-8-mode-coverage.md) remains unexecuted exposed planning evidence.

| Representative capability | What must independently survive in empty-draft mode                                   | Review recommendation                                                                                                                                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| apology                   | User-caused lapse and chosen regret                                                   | Pair a terse apology draft with independently supplied lapse plus selected regret; no invented excuse or resend promise.                                                                                                                     |
| emotional_validation      | The other's explicit feeling/difficulty and acknowledgement goal                      | Use an acknowledgement-preserving draft, not a suppression-to-validation switch. In the proposed mode seed, replace “sad and disappointing” with **That sounds sad.** when only sadness is supplied, or independently supply disappointment. |
| boundary_setting          | Chosen limit, exact scope, supported pressure where the frozen definition requires it | Pair refusal wording with the same visible choice; removing it must not invent inability or a boundary.                                                                                                                                      |
| decline                   | Chosen no                                                                             | An invitation alone cannot supply refusal; keep choice in context/selection.                                                                                                                                                                 |
| request                   | Chosen requested action and scope                                                     | The current extraction's draft-text dependence is an unmeasured routing concern, not evidence for a new generate-only skill.                                                                                                                 |
| status_update             | Current progress facts                                                                | A status question is not progress evidence. Preserve material future-plan content if present in the rewrite.                                                                                                                                 |
| expectation_setting       | The user's estimate, uncertainty and scope cap                                        | Keep probably/only in both modes; no reason or deadline may be added.                                                                                                                                                                        |
| clarification             | A material unknown and independently supplied alternatives                            | The existing synthetic paired scenario explicitly supplies sales/budget names; it is distinct from source-provenance repair of canonical A1.                                                                                                 |

Additional priority pairs: reassurance with explicitly limited attendance support, follow_up with an independently visible earlier ask, and English/Chinese request/limit modifiers applied to the same fixed content. Preserve each mode's available evidence; deleting the only draft evidence should change the action/selection expectation when appropriate.

The three candidate mode seeds remain hypotheses. Perspective recognition must not infer motive denial from non-concession; confirmation must not invent a understood proposition; feedback must not invent incidents or impact. Chinese/Simplified/Traditional/mixed pairs, meaningful focal negatives/neighbor/NONE controls and COMPLETE_DRAFT/non-wording action regressions remain future coverage. Already-polished seeds are not fresh representative drafts for uplift. No tests of these hypotheses or generation runs occurred here.

## Exact proposed revisions

**71 replacements**, each separate from frozen YAML. The following JSON blocks are exact field replacements plus the row-specific rationale; all omitted fields retain the original value. Full proposed examples and their SHA-256 bindings are in the machine ledger. Revised scenario inputs are explicitly new synthetic authoring variants. No proposed correction is silently marked human-approved.

### apology/P2

Source: [apology/P2](../../packages/skills/definitions/atomic/accountability_repair/apology.yaml#L63). Original quality: WEAK. Confidence: HIGH. Issues: `WEAK_POSITIVE`.

A second bare wants-to-apologize scenario adds little discrimination; retain lateness but explicitly bound regret to its impact.

```json
{
  "visibleContext": "User arrived late to a friend's dinner. The friend says they waited; nothing establishes that the user caused the dinner's other problems.",
  "userIntent": "Apologize for arriving late and keeping the friend waiting, without accepting responsibility for other dinner problems.",
  "rationale": "A second bare wants-to-apologize scenario adds little discrimination; retain lateness but explicitly bound regret to its impact."
}
```

### apology/N1

Source: [apology/N1](../../packages/skills/definitions/atomic/accountability_repair/apology.yaml#L97). Original quality: STRONG. Confidence: HIGH. Issues: none.

The absent attachment belongs to another participant's error. Require reporting its status and forbid transferring fault to the user.

```json
{
  "expected": ["status_update"],
  "acceptable": [],
  "forbidden": ["apology", "acknowledge_mistake"],
  "rationale": "The absent attachment belongs to another participant's error. Require reporting its status and forbid transferring fault to the user."
}
```

### apology/N2

Source: [apology/N2](../../packages/skills/definitions/atomic/accountability_repair/apology.yaml#L114). Original quality: STRONG. Confidence: HIGH. Issues: none.

Refusing an invitation never accepted supplies no broken promise. Require decline; social thanks need not become an apology.

```json
{
  "expected": ["decline"],
  "acceptable": ["en.direct_but_polite"],
  "forbidden": ["apology"],
  "rationale": "Refusing an invitation never accepted supplies no broken promise. Require decline; social thanks need not become an apology."
}
```

### apology/H1

Source: [apology/H1](../../packages/skills/definitions/atomic/accountability_repair/apology.yaml#L148). Original quality: STRONG. Confidence: HIGH. Issues: `NEIGHBOR_AMBIGUITY`.

The user expressly wants ownership without regret. Optional acknowledgement fails to encode the decisive contrast.

```json
{
  "expected": ["acknowledge_mistake"],
  "acceptable": [],
  "forbidden": ["apology"],
  "rationale": "The user expressly wants ownership without regret. Optional acknowledgement fails to encode the decisive contrast."
}
```

### apology/H2

Source: [apology/H2](../../packages/skills/definitions/atomic/accountability_repair/apology.yaml#L166). Original quality: STRONG. Confidence: HIGH. Issues: `NEIGHBOR_AMBIGUITY`.

Recognizing a friend's upsetting experience does not establish user responsibility. Require validation and exclude regret for causing it.

```json
{
  "expected": ["emotional_validation"],
  "acceptable": [],
  "forbidden": ["apology", "acknowledge_mistake"],
  "rationale": "Recognizing a friend's upsetting experience does not establish user responsibility. Require validation and exclude regret for causing it."
}
```

### acknowledge_mistake/N3

Source: [acknowledge_mistake/N3](../../packages/skills/definitions/atomic/accountability_repair/acknowledge_mistake.yaml#L132). Original quality: ACCEPTABLE. Confidence: HIGH. Issues: none.

An error-free progress report needs status wording rather than ownership; name the positive alternative instead of leaving the set implicit.

```json
{
  "expected": ["status_update"],
  "acceptable": [],
  "forbidden": ["acknowledge_mistake"],
  "rationale": "An error-free progress report needs status wording rather than ownership; name the positive alternative instead of leaving the set implicit."
}
```

### acknowledge_mistake/H2

Source: [acknowledge_mistake/H2](../../packages/skills/definitions/atomic/accountability_repair/acknowledge_mistake.yaml#L167). Original quality: STRONG. Confidence: HIGH. Issues: `NEIGHBOR_AMBIGUITY`.

An externally caused delay is reportable status, not the user's mistake. Make status required and ownership forbidden.

```json
{
  "expected": ["status_update"],
  "acceptable": [],
  "forbidden": ["acknowledge_mistake"],
  "rationale": "An externally caused delay is reportable status, not the user's mistake. Make status required and ownership forbidden."
}
```

### acknowledge_mistake/A2

Source: [acknowledge_mistake/A2](../../packages/skills/definitions/atomic/accountability_repair/acknowledge_mistake.yaml#L206). Original quality: WEAK. Confidence: HIGH. Issues: none.

Promised yesterday can mean when the promise was made, while the ledger says the call was due yesterday. Put the time on the call.

```json
{
  "improved": "I forgot to make the call I'd promised for yesterday.",
  "rationale": "Promised yesterday can mean when the promise was made, while the ledger says the call was due yesterday. Put the time on the call."
}
```

### emotional_validation/N1

Source: [emotional_validation/N1](../../packages/skills/definitions/atomic/recognition_support/emotional_validation.yaml#L94). Original quality: ACCEPTABLE. Confidence: HIGH. Issues: none.

Neutral schedule coordination supports planning, not inferred distress. Record the supported alternative.

```json
{
  "expected": ["planning"],
  "acceptable": [],
  "forbidden": ["emotional_validation"],
  "rationale": "Neutral schedule coordination supports planning, not inferred distress. Record the supported alternative."
}
```

### emotional_validation/H2

Source: [emotional_validation/H2](../../packages/skills/definitions/atomic/recognition_support/emotional_validation.yaml#L159). Original quality: STRONG. Confidence: HIGH. Issues: `NEIGHBOR_AMBIGUITY`.

The stated aim is offering available help to address worry; grounded reassurance is required, and separate feeling recognition is compatible rather than mandatory.

```json
{
  "expected": ["reassurance"],
  "acceptable": ["emotional_validation"],
  "forbidden": [],
  "rationale": "The stated aim is offering available help to address worry; grounded reassurance is required, and separate feeling recognition is compatible rather than mandatory."
}
```

### emotional_validation/A1

Source: [emotional_validation/A1](../../packages/skills/definitions/atomic/recognition_support/emotional_validation.yaml#L175). Original quality: INVALID. Confidence: HIGH. Issues: `INTENT_DRIFT`.

Changing don't be sad to acknowledgement reverses the draft's instruction. Explicit selected intent permits a better message, but a rewrite preservation example should start with compatible acknowledgement.

```json
{
  "draft": "That sounds disappointing to hear.",
  "improved": "That sounds disappointing.",
  "rationale": "Changing don't be sad to acknowledgement reverses the draft's instruction. Explicit selected intent permits a better message, but a rewrite preservation example should start with compatible acknowledgement."
}
```

### reassurance/N3

Source: [reassurance/N3](../../packages/skills/definitions/atomic/recognition_support/reassurance.yaml#L132). Original quality: STRONG. Confidence: HIGH. Issues: none.

Preserving a refusal to help requires decline, not an offer disguised as comfort. Require the refusal operation.

```json
{
  "expected": ["decline"],
  "acceptable": [],
  "forbidden": ["reassurance"],
  "rationale": "Preserving a refusal to help requires decline, not an offer disguised as comfort. Require the refusal operation."
}
```

### reassurance/H1

Source: [reassurance/H1](../../packages/skills/definitions/atomic/recognition_support/reassurance.yaml#L149). Original quality: STRONG. Confidence: HIGH. Issues: `NEIGHBOR_AMBIGUITY`.

Only sadness acknowledgement is chosen and no support fact exists. Require validation and forbid an invented reassuring commitment.

```json
{
  "expected": ["emotional_validation"],
  "acceptable": [],
  "forbidden": ["reassurance"],
  "rationale": "Only sadness acknowledgement is chosen and no support fact exists. Require validation and forbid an invented reassuring commitment."
}
```

### reassurance/H2

Source: [reassurance/H2](../../packages/skills/definitions/atomic/recognition_support/reassurance.yaml#L164). Original quality: ACCEPTABLE. Confidence: HIGH. Issues: none.

Effort support without worry is not reassurance's visible-concern job. No current neighbor is required; encouragement remains conceptual, not a reason to force an ID.

```json
{
  "expected": [],
  "acceptable": [],
  "forbidden": ["reassurance"],
  "rationale": "Effort support without worry is not reassurance's visible-concern job. No current neighbor is required; encouragement remains conceptual, not a reason to force an ID."
}
```

### reassurance/A1

Source: [reassurance/A1](../../packages/skills/definitions/atomic/recognition_support/reassurance.yaml#L182). Original quality: INVALID. Confidence: HIGH. Issues: `UNSUPPORTED_COMMITMENT`, `UNSUPPORTED_FACT`.

Attending too establishes co-attendance, not traveling or staying together. The answer-derived commitment ledger overstates the independently supplied promise.

```json
{
  "improved": "I'll be attending too.",
  "ledger": {
    "facts": ["Friend is worried about attending alone.", "User has committed to attending too."],
    "commitments": ["User will attend; accompaniment or traveling together is not promised."],
    "uncertainty": []
  },
  "rationale": "Attending too establishes co-attendance, not traveling or staying together. The answer-derived commitment ledger overstates the independently supplied promise."
}
```

### reassurance/A2

Source: [reassurance/A2](../../packages/skills/definitions/atomic/recognition_support/reassurance.yaml#L207). Original quality: INVALID. Confidence: HIGH. Issues: `UNSUPPORTED_CERTAINTY`.

The rewrite responsibly reduces an unsupported everything-is-fine claim, but therefore is not certainty-preserving. Its checking next step is unnecessary; revise the pair to model uncertainty from the outset.

```json
{
  "draft": "We have a backup, but we don't know how much can be restored.",
  "improved": "There's a backup, though we don't yet know what can be restored.",
  "ledger": {
    "facts": ["A backup exists.", "Recovery outcome has not been established."],
    "commitments": [],
    "uncertainty": ["What can be restored is unknown."]
  },
  "rationale": "The rewrite responsibly reduces an unsupported everything-is-fine claim, but therefore is not certainty-preserving. Its checking next step is unnecessary; revise the pair to model uncertainty from the outset."
}
```

### boundary_setting/N2

Source: [boundary_setting/N2](../../packages/skills/definitions/atomic/decisions_limits/boundary_setting.yaml#L114). Original quality: ACCEPTABLE. Confidence: HIGH. Issues: none.

Asking an unknown due time seeks information, not a personal limit. Require the missing-detail operation.

```json
{
  "expected": ["clarification"],
  "acceptable": [],
  "forbidden": ["boundary_setting"],
  "rationale": "Asking an unknown due time seeks information, not a personal limit. Require the missing-detail operation."
}
```

### boundary_setting/H1

Source: [boundary_setting/H1](../../packages/skills/definitions/atomic/decisions_limits/boundary_setting.yaml#L148). Original quality: STRONG. Confidence: HIGH. Issues: `NEIGHBOR_AMBIGUITY`.

One refused invitation with no continuing rule selects decline. Explicitly exclude the repeated-pressure boundary operation.

```json
{
  "expected": ["decline"],
  "acceptable": [],
  "forbidden": ["boundary_setting"],
  "rationale": "One refused invitation with no continuing rule selects decline. Explicitly exclude the repeated-pressure boundary operation."
}
```

### boundary_setting/H2

Source: [boundary_setting/H2](../../packages/skills/definitions/atomic/decisions_limits/boundary_setting.yaml#L163). Original quality: STRONG. Confidence: HIGH. Issues: `NEIGHBOR_AMBIGUITY`.

A delivery estimate communicates future timing, with no behavioral limit or repeated pressure. Require expectation setting.

```json
{
  "expected": ["expectation_setting"],
  "acceptable": [],
  "forbidden": ["boundary_setting"],
  "rationale": "A delivery estimate communicates future timing, with no behavioral limit or repeated pressure. Require expectation setting."
}
```

### boundary_setting/A1

Source: [boundary_setting/A1](../../packages/skills/definitions/atomic/decisions_limits/boundary_setting.yaml#L179). Original quality: WEAK. Confidence: HIGH. Issues: `SKILL_BOUNDARY_ISSUE`.

Before 8 excludes exactly 8 whereas no calls after 8 does not. Preserve the explicit cutoff; a calm one-off statement also exposes the runtime description's repeated-pressure limitation.

```json
{
  "improved": "Please don't call about nonurgent work after 8 p.m.",
  "rationale": "Before 8 excludes exactly 8 whereas no calls after 8 does not. Preserve the explicit cutoff; a calm one-off statement also exposes the runtime description's repeated-pressure limitation."
}
```

### boundary_setting/A2

Source: [boundary_setting/A2](../../packages/skills/definitions/atomic/decisions_limits/boundary_setting.yaml#L201). Original quality: INVALID. Confidence: HIGH. Issues: `INTENT_DRIFT`, `UNSUPPORTED_FACT`.

The user chooses not to lend; inability is neither stated nor entailed. Express the chosen no and stop request directly.

```json
{
  "improved": "I won't lend you any more money. Please stop asking.",
  "rationale": "The user chooses not to lend; inability is neither stated nor entailed. Express the chosen no and stop request directly."
}
```

### de_escalation/N1

Source: [de_escalation/N1](../../packages/skills/definitions/atomic/conflict_feedback/de_escalation.yaml#L95). Original quality: ACCEPTABLE. Confidence: HIGH. Issues: none.

Calm coordination has no heat to reduce and instead supports planning. Make that alternative explicit.

```json
{
  "expected": ["planning"],
  "acceptable": [],
  "forbidden": ["de_escalation"],
  "rationale": "Calm coordination has no heat to reduce and instead supports planning. Make that alternative explicit."
}
```

### de_escalation/A1

Source: [de_escalation/A1](../../packages/skills/definitions/atomic/conflict_feedback/de_escalation.yaml#L176). Original quality: INVALID. Confidence: MEDIUM. Issues: `UNSUPPORTED_FACT`.

Disputing a total does not independently establish two totals that fail to match. Keep the existing doubt and user-chosen joint check without inventing a comparison.

```json
{
  "improved": "I don't think this total is right. Can we check the figures together?",
  "rationale": "Disputing a total does not independently establish two totals that fail to match. Keep the existing doubt and user-chosen joint check without inventing a comparison."
}
```

### de_escalation/A2

Source: [de_escalation/A2](../../packages/skills/definitions/atomic/conflict_feedback/de_escalation.yaml#L199). Original quality: INVALID. Confidence: HIGH. Issues: `UNSUPPORTED_FACT`, `INTENT_DRIFT`.

Pressure does not prove the recipient is struggling, and a refused shift does not establish inability. Remove both unsupported claims while preserving the fixed no.

```json
{
  "improved": "I've already said no. I won't take the extra shift.",
  "rationale": "Pressure does not prove the recipient is struggling, and a refused shift does not establish inability. Remove both unsupported claims while preserving the fixed no."
}
```

### decline/N3

Source: [decline/N3](../../packages/skills/definitions/atomic/decisions_limits/decline.yaml#L130). Original quality: STRONG. Confidence: HIGH. Issues: none.

The user chose to obtain details before deciding, so clarification is supported and decline would preempt the choice.

```json
{
  "expected": ["clarification"],
  "acceptable": [],
  "forbidden": ["decline"],
  "rationale": "The user chose to obtain details before deciding, so clarification is supported and decline would preempt the choice."
}
```

### decline/H1

Source: [decline/H1](../../packages/skills/definitions/atomic/decisions_limits/decline.yaml#L147). Original quality: STRONG. Confidence: MEDIUM. Issues: `NEIGHBOR_AMBIGUITY`.

The expressed goal is an ongoing limit under repeated requests. Require boundary setting; decline is compatible only insofar as that limit also rejects the current request.

```json
{
  "expected": ["boundary_setting"],
  "acceptable": ["decline"],
  "forbidden": [],
  "rationale": "The expressed goal is an ongoing limit under repeated requests. Require boundary setting; decline is compatible only insofar as that limit also rejects the current request."
}
```

### decline/H2

Source: [decline/H2](../../packages/skills/definitions/atomic/decisions_limits/decline.yaml#L162). Original quality: STRONG. Confidence: HIGH. Issues: `NEIGHBOR_AMBIGUITY`.

Cannot do Tuesday and offers Friday combines a specific refusal with proposed logistics. Neither skill should erase the other half or turn Friday into a confirmed plan.

```json
{
  "expected": ["decline", "planning"],
  "acceptable": [],
  "forbidden": [],
  "rationale": "Cannot do Tuesday and offers Friday combines a specific refusal with proposed logistics. Neither skill should erase the other half or turn Friday into a confirmed plan."
}
```

### ask_for_help/N1

Source: [ask_for_help/N1](../../packages/skills/definitions/atomic/requests_options/ask_for_help.yaml#L93). Original quality: ACCEPTABLE. Confidence: HIGH. Issues: none.

Reporting a finished task asks for no assistance. Require status rather than leaving the valid operation implicit.

```json
{
  "expected": ["status_update"],
  "acceptable": [],
  "forbidden": ["ask_for_help"],
  "rationale": "Reporting a finished task asks for no assistance. Require status rather than leaving the valid operation implicit."
}
```

### ask_for_help/H1

Source: [ask_for_help/H1](../../packages/skills/definitions/atomic/requests_options/ask_for_help.yaml#L144). Original quality: STRONG. Confidence: HIGH. Issues: `NEIGHBOR_AMBIGUITY`.

Sending a known document without help framing supports request; do not manufacture vulnerability or assistance merely because someone acts.

```json
{
  "expected": ["request"],
  "acceptable": [],
  "forbidden": ["ask_for_help"],
  "rationale": "Sending a known document without help framing supports request; do not manufacture vulnerability or assistance merely because someone acts."
}
```

### ask_for_help/H2

Source: [ask_for_help/H2](../../packages/skills/definitions/atomic/requests_options/ask_for_help.yaml#L159). Original quality: STRONG. Confidence: HIGH. Issues: `NEIGHBOR_AMBIGUITY`.

Resolving what tomorrow refers to is a material ambiguity. Require clarification, with generic request wording compatible but unnecessary.

```json
{
  "expected": ["clarification"],
  "acceptable": ["request"],
  "forbidden": ["ask_for_help"],
  "rationale": "Resolving what tomorrow refers to is a material ambiguity. Require clarification, with generic request wording compatible but unnecessary."
}
```

### follow_up/H1

Source: [follow_up/H1](../../packages/skills/definitions/atomic/coordination/follow_up.yaml#L144). Original quality: STRONG. Confidence: HIGH. Issues: `NEIGHBOR_AMBIGUITY`.

The request is expressly the first one. Require request and forbid invented reminder framing.

```json
{
  "expected": ["request"],
  "acceptable": [],
  "forbidden": ["follow_up"],
  "rationale": "The request is expressly the first one. Require request and forbid invented reminder framing."
}
```

### follow_up/H2

Source: [follow_up/H2](../../packages/skills/definitions/atomic/coordination/follow_up.yaml#L159). Original quality: STRONG. Confidence: HIGH. Issues: `NEIGHBOR_AMBIGUITY`.

Reporting one's own progress is outward status, not checking the other person's response to an ask.

```json
{
  "expected": ["status_update"],
  "acceptable": [],
  "forbidden": ["follow_up"],
  "rationale": "Reporting one's own progress is outward status, not checking the other person's response to an ask."
}
```

### follow_up/A1

Source: [follow_up/A1](../../packages/skills/definitions/atomic/coordination/follow_up.yaml#L175). Original quality: WEAK. Confidence: MEDIUM. Issues: `INTENT_DRIFT`.

Why no reply asks for a reason, while had a chance asks about review progress. The broader follow-up intent does not make these identical preservation targets; use a progress-check draft.

```json
{
  "draft": "Any update on my report-review request?",
  "improved": "Following up on my report-review request: have you had a chance to look?",
  "rationale": "Why no reply asks for a reason, while had a chance asks about review progress. The broader follow-up intent does not make these identical preservation targets; use a progress-check draft."
}
```

### status_update/N1

Source: [status_update/N1](../../packages/skills/definitions/atomic/coordination/status_update.yaml#L96). Original quality: STRONG. Confidence: HIGH. Issues: none.

Unknown status must be requested, not supplied as a report. Generic request and a focused missing-detail question are valid wording approaches.

```json
{
  "expected": ["request"],
  "acceptable": ["clarification"],
  "forbidden": ["status_update"],
  "rationale": "Unknown status must be requested, not supplied as a report. Generic request and a focused missing-detail question are valid wording approaches."
}
```

### status_update/N3

Source: [status_update/N3](../../packages/skills/definitions/atomic/coordination/status_update.yaml#L130). Original quality: STRONG. Confidence: HIGH. Issues: none.

A future availability limit is expectation setting, not current progress. Require the supported timing/scope operation.

```json
{
  "expected": ["expectation_setting"],
  "acceptable": [],
  "forbidden": ["status_update"],
  "rationale": "A future availability limit is expectation setting, not current progress. Require the supported timing/scope operation."
}
```

### status_update/H1

Source: [status_update/H1](../../packages/skills/definitions/atomic/coordination/status_update.yaml#L147). Original quality: STRONG. Confidence: HIGH. Issues: `NEIGHBOR_AMBIGUITY`.

Probably tomorrow expresses an uncertain estimate; expectation setting must preserve probability and status is not independently supplied.

```json
{
  "expected": ["expectation_setting"],
  "acceptable": [],
  "forbidden": ["status_update"],
  "rationale": "Probably tomorrow expresses an uncertain estimate; expectation setting must preserve probability and status is not independently supplied."
}
```

### status_update/H2

Source: [status_update/H2](../../packages/skills/definitions/atomic/coordination/status_update.yaml#L162). Original quality: STRONG. Confidence: HIGH. Issues: `NEIGHBOR_AMBIGUITY`.

Assigning the next step is prospective coordination, not evidence of completed progress. Require planning without claiming execution.

```json
{
  "expected": ["planning"],
  "acceptable": ["request"],
  "forbidden": ["status_update"],
  "rationale": "Assigning the next step is prospective coordination, not evidence of completed progress. Require planning without claiming execution."
}
```

### status_update/A1

Source: [status_update/A1](../../packages/skills/definitions/atomic/coordination/status_update.yaml#L178). Original quality: WEAK. Confidence: MEDIUM. Issues: `INTENT_DRIFT`.

Review later can express a future plan, which the improvement drops. Start with explicit not-started wording so the pair teaches status preservation rather than silent plan deletion.

```json
{
  "draft": "draft done, review not started",
  "rationale": "Review later can express a future plan, which the improvement drops. Start with explicit not-started wording so the pair teaches status preservation rather than silent plan deletion."
}
```

### expectation_setting/N2

Source: [expectation_setting/N2](../../packages/skills/definitions/atomic/coordination/expectation_setting.yaml#L114). Original quality: STRONG. Confidence: HIGH. Issues: none.

Already-completed work is present status. Require reporting completion and exclude an invented future estimate.

```json
{
  "expected": ["status_update"],
  "acceptable": [],
  "forbidden": ["expectation_setting"],
  "rationale": "Already-completed work is present status. Require reporting completion and exclude an invented future estimate."
}
```

### expectation_setting/N3

Source: [expectation_setting/N3](../../packages/skills/definitions/atomic/coordination/expectation_setting.yaml#L131). Original quality: STRONG. Confidence: HIGH. Issues: none.

The user seeks the other person's requirements rather than stating their own timing. A focused clarification is supported.

```json
{
  "expected": ["clarification"],
  "acceptable": ["request"],
  "forbidden": ["expectation_setting"],
  "rationale": "The user seeks the other person's requirements rather than stating their own timing. A focused clarification is supported."
}
```

### expectation_setting/H1

Source: [expectation_setting/H1](../../packages/skills/definitions/atomic/coordination/expectation_setting.yaml#L148). Original quality: STRONG. Confidence: HIGH. Issues: `NEIGHBOR_AMBIGUITY`.

Present progress without future timing requires status reporting; do not fabricate a schedule to justify expectation setting.

```json
{
  "expected": ["status_update"],
  "acceptable": [],
  "forbidden": ["expectation_setting"],
  "rationale": "Present progress without future timing requires status reporting; do not fabricate a schedule to justify expectation setting."
}
```

### expectation_setting/A2

Source: [expectation_setting/A2](../../packages/skills/definitions/atomic/coordination/expectation_setting.yaml#L202). Original quality: WEAK. Confidence: HIGH. Issues: `INTENT_DRIFT`.

Dropping only weakens the explicit maximum: can review one chapter can sound like a minimum offer. Keep the one-chapter cap visible.

```json
{
  "improved": "I can review only one chapter this week.",
  "rationale": "Dropping only weakens the explicit maximum: can review one chapter can sound like a minimum offer. Keep the one-chapter cap visible."
}
```

### planning/N2

Source: [planning/N2](../../packages/skills/definitions/atomic/coordination/planning.yaml#L111). Original quality: ACCEPTABLE. Confidence: HIGH. Issues: none.

Reporting completed work is status, not arranging future action. Make the reporting operation explicit.

```json
{
  "expected": ["status_update"],
  "acceptable": [],
  "forbidden": ["planning"],
  "rationale": "Reporting completed work is status, not arranging future action. Make the reporting operation explicit."
}
```

### planning/N3

Source: [planning/N3](../../packages/skills/definitions/atomic/coordination/planning.yaml#L128). Original quality: STRONG. Confidence: HIGH. Issues: none.

All offered times were refused. Require decline and do not invent a new time or reopen negotiation through planning.

```json
{
  "expected": ["decline"],
  "acceptable": [],
  "forbidden": ["planning"],
  "rationale": "All offered times were refused. Require decline and do not invent a new time or reopen negotiation through planning."
}
```

### planning/H1

Source: [planning/H1](../../packages/skills/definitions/atomic/coordination/planning.yaml#L145). Original quality: ACCEPTABLE. Confidence: MEDIUM. Issues: `NEIGHBOR_AMBIGUITY`.

Starting a new task is a request. With no supplied logistics, planning adds no separate value; it must not be forbidden universally for requests that later specify next steps.

```json
{
  "expected": ["request"],
  "acceptable": [],
  "forbidden": ["planning"],
  "rationale": "Starting a new task is a request. With no supplied logistics, planning adds no separate value; it must not be forbidden universally for requests that later specify next steps."
}
```

### clarification/H2

Source: [clarification/H2](../../packages/skills/definitions/atomic/understanding_inquiry/clarification.yaml#L158). Original quality: STRONG. Confidence: HIGH. Issues: `NEIGHBOR_AMBIGUITY`.

Sending a known file is an action request; no identity ambiguity needs resolving. Require request and exclude clarification.

```json
{
  "expected": ["request"],
  "acceptable": [],
  "forbidden": ["clarification"],
  "rationale": "Sending a known file is an action request; no identity ambiguity needs resolving. Require request and exclude clarification."
}
```

### clarification/A1

Source: [clarification/A1](../../packages/skills/definitions/atomic/understanding_inquiry/clarification.yaml#L174). Original quality: WEAK. Confidence: HIGH. Issues: `PROVENANCE_EXPANSION`.

Current visibleContext explicitly names sales/budget, so the answer is grounded in current YAML. Earlier sourceText only supplies two reports; remove answer-dependent elaboration from the replacement to preserve unambiguous provenance.

```json
{
  "visibleContext": "Two reports are plausible. The intended report is unknown.",
  "improved": "Which of the two reports do you mean?",
  "ledger": {
    "facts": ["Two reports are plausible.", "The intended report is unknown."],
    "commitments": [],
    "uncertainty": ["Which report is intended is unresolved."]
  },
  "rationale": "Current visibleContext explicitly names sales/budget, so the answer is grounded in current YAML. Earlier sourceText only supplies two reports; remove answer-dependent elaboration from the replacement to preserve unambiguous provenance."
}
```

### request/N3

Source: [request/N3](../../packages/skills/definitions/atomic/requests_options/request.yaml#L127). Original quality: STRONG. Confidence: HIGH. Issues: none.

A completed-action report asks nothing of the recipient. Require status and prohibit inventing a request.

```json
{
  "expected": ["status_update"],
  "acceptable": [],
  "forbidden": ["request"],
  "rationale": "A completed-action report asks nothing of the recipient. Require status and prohibit inventing a request."
}
```

### request/H1

Source: [request/H1](../../packages/skills/definitions/atomic/requests_options/request.yaml#L144). Original quality: STRONG. Confidence: HIGH. Issues: `NEIGHBOR_AMBIGUITY`.

Assistance carrying an object is a specific kind of request, not its opposite. Require the help-specific guidance while allowing compatible generic request wording.

```json
{
  "expected": ["ask_for_help"],
  "acceptable": ["request"],
  "forbidden": [],
  "rationale": "Assistance carrying an object is a specific kind of request, not its opposite. Require the help-specific guidance while allowing compatible generic request wording."
}
```

### request/H2

Source: [request/H2](../../packages/skills/definitions/atomic/requests_options/request.yaml#L159). Original quality: STRONG. Confidence: HIGH. Issues: `NEIGHBOR_AMBIGUITY`.

Revisiting an unanswered agenda request supplies follow-up context while retaining a requested action. Do not forbid request merely because the more specific neighbor fits.

```json
{
  "expected": ["follow_up"],
  "acceptable": ["request"],
  "forbidden": [],
  "rationale": "Revisiting an unanswered agenda request supplies follow-up context while retaining a requested action. Do not forbid request merely because the more specific neighbor fits."
}
```

### en.professional_conciseness/P3

Source: [en.professional_conciseness/P3](../../packages/skills/definitions/modifiers/en/professional_conciseness.yaml#L80). Original quality: WEAK. Confidence: HIGH. Issues: `WEAK_POSITIVE`.

A visible review request grounds follow-up but does not alone establish professional register. Supply an explicit work-chat preference in the proposed scenario.

```json
{
  "visibleContext": "In an English work chat, the user's earlier report-review request is visible. The user asks for a concise professional follow-up without an email-style opening.",
  "userIntent": "Follow up on the visible report-review request in concise professional chat wording.",
  "rationale": "A visible review request grounds follow-up but does not alone establish professional register. Supply an explicit work-chat preference in the proposed scenario."
}
```

### en.professional_conciseness/H1

Source: [en.professional_conciseness/H1](../../packages/skills/definitions/modifiers/en/professional_conciseness.yaml#L148). Original quality: STRONG. Confidence: HIGH. Issues: `NEIGHBOR_AMBIGUITY`.

Brief personal weekend planning supports casual rather than professional framing. Require the conversational modifier and retain the coordination job as compatible.

```json
{
  "expected": ["en.casual_naturalness"],
  "acceptable": ["planning"],
  "forbidden": ["en.professional_conciseness"],
  "rationale": "Brief personal weekend planning supports casual rather than professional framing. Require the conversational modifier and retain the coordination job as compatible."
}
```

### en.professional_conciseness/H2

Source: [en.professional_conciseness/H2](../../packages/skills/definitions/modifiers/en/professional_conciseness.yaml#L163). Original quality: STRONG. Confidence: HIGH. Issues: `NEIGHBOR_AMBIGUITY`.

The only register-relevant goal is clear refusal. Direct-but-polite is supported; professional style is not established by refusal alone.

```json
{
  "expected": ["en.direct_but_polite", "decline"],
  "acceptable": [],
  "forbidden": ["en.professional_conciseness"],
  "rationale": "The only register-relevant goal is clear refusal. Direct-but-polite is supported; professional style is not established by refusal alone."
}
```

### en.casual_naturalness/P3

Source: [en.casual_naturalness/P3](../../packages/skills/definitions/modifiers/en/casual_naturalness.yaml#L76). Original quality: WEAK. Confidence: HIGH. Issues: `WEAK_POSITIVE`.

An agreed weekend meeting does not itself establish casual register. Make the user preference observable rather than treating weekend as a style proxy.

```json
{
  "visibleContext": "The weekend meeting is already agreed. In the English chat, the user asks for a brief conversational restatement without a formal greeting.",
  "userIntent": "Restate the agreed weekend meeting in brief conversational wording.",
  "rationale": "An agreed weekend meeting does not itself establish casual register. Make the user preference observable rather than treating weekend as a style proxy."
}
```

### en.casual_naturalness/H1

Source: [en.casual_naturalness/H1](../../packages/skills/definitions/modifiers/en/casual_naturalness.yaml#L144). Original quality: STRONG. Confidence: HIGH. Issues: `NEIGHBOR_AMBIGUITY`.

Professional progress reporting explicitly supplies the contrasting register and status job. Require professional conciseness rather than an optional hint.

```json
{
  "expected": ["en.professional_conciseness"],
  "acceptable": ["status_update"],
  "forbidden": ["en.casual_naturalness"],
  "rationale": "Professional progress reporting explicitly supplies the contrasting register and status job. Require professional conciseness rather than an optional hint."
}
```

### en.casual_naturalness/H2

Source: [en.casual_naturalness/H2](../../packages/skills/definitions/modifiers/en/casual_naturalness.yaml#L159). Original quality: ACCEPTABLE. Confidence: MEDIUM. Issues: `NEIGHBOR_AMBIGUITY`.

The refusal needs clarity but no informal invitation or casual preference is supplied. Require direct refusal wording without assuming casual style; combined use needs its own context.

```json
{
  "expected": ["en.direct_but_polite", "decline"],
  "acceptable": [],
  "forbidden": ["en.casual_naturalness"],
  "rationale": "The refusal needs clarity but no informal invitation or casual preference is supplied. Require direct refusal wording without assuming casual style; combined use needs its own context."
}
```

### en.direct_but_polite/P2

Source: [en.direct_but_polite/P2](../../packages/skills/definitions/modifiers/en/direct_but_polite.yaml#L64). Original quality: WEAK. Confidence: HIGH. Issues: `WEAK_POSITIVE`.

Already clear English request is tautological and shows no benefit. Add an explicit expression goal without changing the requested action.

```json
{
  "visibleContext": "The user has chosen to ask for the file in English and wants the request to be explicit and respectful, without sounding like an order.",
  "userIntent": "Ask for the file clearly and respectfully, without adding urgency.",
  "rationale": "Already clear English request is tautological and shows no benefit. Add an explicit expression goal without changing the requested action."
}
```

### en.direct_but_polite/H1

Source: [en.direct_but_polite/H1](../../packages/skills/definitions/modifiers/en/direct_but_polite.yaml#L149). Original quality: WEAK. Confidence: HIGH. Issues: `NEIGHBOR_AMBIGUITY`.

A progress report without request or decision excludes this modifier, but does not alone establish professional register. Make the work-chat register explicit in the proposed contrast.

```json
{
  "visibleContext": "The user is giving an English progress report in an explicitly professional work chat, with no request, refusal or limit to express.",
  "expected": ["en.professional_conciseness"],
  "acceptable": ["status_update"],
  "forbidden": ["en.direct_but_polite"],
  "rationale": "A progress report without request or decision excludes this modifier, but does not alone establish professional register. Make the work-chat register explicit in the proposed contrast."
}
```

### en.direct_but_polite/H2

Source: [en.direct_but_polite/H2](../../packages/skills/definitions/modifiers/en/direct_but_polite.yaml#L164). Original quality: STRONG. Confidence: HIGH. Issues: `NEIGHBOR_AMBIGUITY`.

Decline supplies the already chosen refusal and the English modifier can improve its expression. These are complementary levels, not competing jobs.

```json
{
  "expected": ["decline"],
  "acceptable": ["en.direct_but_polite"],
  "forbidden": [],
  "rationale": "Decline supplies the already chosen refusal and the English modifier can improve its expression. These are complementary levels, not competing jobs."
}
```

### en.direct_but_polite/A1

Source: [en.direct_but_polite/A1](../../packages/skills/definitions/modifiers/en/direct_but_polite.yaml#L180). Original quality: INVALID. Confidence: HIGH. Issues: `UNSUPPORTED_FACT`, `INTENT_DRIFT`.

Will not take the task does not establish cannot take it. Respectful wording must preserve choice rather than fabricate inability.

```json
{
  "improved": "No, I won't take on that extra task.",
  "rationale": "Will not take the task does not establish cannot take it. Respectful wording must preserve choice rather than fabricate inability."
}
```

### zh.politeness_calibration/H1

Source: [zh.politeness_calibration/H1](../../packages/skills/definitions/modifiers/zh/politeness_calibration.yaml#L146). Original quality: WEAK. Confidence: HIGH. Issues: `NEIGHBOR_AMBIGUITY`.

Progress alone does not imply professional register. Supply an explicit work-chat preference and require the matching modifier rather than inferring formality from Chinese.

```json
{
  "visibleContext": "The user is giving a Chinese progress report in a work chat and explicitly wants concise professional wording, with no request, refusal or limit.",
  "expected": ["zh.professional_formality"],
  "acceptable": ["status_update"],
  "forbidden": ["zh.politeness_calibration"],
  "rationale": "Progress alone does not imply professional register. Supply an explicit work-chat preference and require the matching modifier rather than inferring formality from Chinese."
}
```

### zh.politeness_calibration/H2

Source: [zh.politeness_calibration/H2](../../packages/skills/definitions/modifiers/zh/politeness_calibration.yaml#L161). Original quality: STRONG. Confidence: HIGH. Issues: `NEIGHBOR_AMBIGUITY`.

Decline expresses the chosen no; Chinese politeness can shape that same refusal. They are complementary and neither authorizes an invented excuse.

```json
{
  "expected": ["decline"],
  "acceptable": ["zh.politeness_calibration"],
  "forbidden": [],
  "rationale": "Decline expresses the chosen no; Chinese politeness can shape that same refusal. They are complementary and neither authorizes an invented excuse."
}
```

### zh.professional_formality/P1

Source: [zh.professional_formality/P1](../../packages/skills/definitions/modifiers/zh/professional_formality.yaml#L45). Original quality: WEAK. Confidence: HIGH. Issues: `WEAK_POSITIVE`.

Draft progress and Simplified script do not establish a professional-register need. Add an observable work-chat preference rather than equating Chinese reporting with formality.

```json
{
  "visibleContext": "In a Simplified Chinese work chat, the user reports draft progress and explicitly requests concise professional wording without bureaucratic filler.",
  "userIntent": "Report draft progress in concise professional Chinese.",
  "rationale": "Draft progress and Simplified script do not establish a professional-register need. Add an observable work-chat preference rather than equating Chinese reporting with formality."
}
```

### zh.professional_formality/P2

Source: [zh.professional_formality/P2](../../packages/skills/definitions/modifiers/zh/professional_formality.yaml#L62). Original quality: WEAK. Confidence: HIGH. Issues: `WEAK_POSITIVE`.

A missed commitment can be personal or professional. Keep Traditional script but explicitly ground register, without inventing a cause or new date.

```json
{
  "visibleContext": "The user is updating a work chat in Traditional Chinese about their own missed commitment and asks for concise professional wording. No excuse or new deadline is supplied.",
  "userIntent": "Report the missed commitment in concise professional Chinese without adding an excuse or new deadline.",
  "rationale": "A missed commitment can be personal or professional. Keep Traditional script but explicitly ground register, without inventing a cause or new date."
}
```

### zh.professional_formality/H1

Source: [zh.professional_formality/H1](../../packages/skills/definitions/modifiers/zh/professional_formality.yaml#L147). Original quality: STRONG. Confidence: HIGH. Issues: `NEIGHBOR_AMBIGUITY`.

Explicitly casual weekend planning supports natural Chinese concision, not work-report framing. Keep planning as compatible underlying function.

```json
{
  "expected": ["zh.natural_conciseness"],
  "acceptable": ["planning"],
  "forbidden": ["zh.professional_formality"],
  "rationale": "Explicitly casual weekend planning supports natural Chinese concision, not work-report framing. Keep planning as compatible underlying function."
}
```

### zh.professional_formality/H2

Source: [zh.professional_formality/H2](../../packages/skills/definitions/modifiers/zh/professional_formality.yaml#L162). Original quality: WEAK. Confidence: HIGH. Issues: `NEIGHBOR_AMBIGUITY`.

Request-or-refusal is two different chosen actions, not one clear case. Use a concrete request to contrast politeness with unsupported professional status framing.

```json
{
  "visibleContext": "In a Chinese personal chat, the user has chosen to ask a friend to send a file and wants a polite, clear request.",
  "userIntent": "Ask the friend to send the file politely without a deadline.",
  "expected": ["zh.politeness_calibration", "request"],
  "acceptable": [],
  "forbidden": ["zh.professional_formality"],
  "rationale": "Request-or-refusal is two different chosen actions, not one clear case. Use a concrete request to contrast politeness with unsupported professional status framing."
}
```

### zh.natural_conciseness/P2

Source: [zh.natural_conciseness/P2](../../packages/skills/definitions/modifiers/zh/natural_conciseness.yaml#L60). Original quality: WEAK. Confidence: HIGH. Issues: `WEAK_POSITIVE`.

Respond to an invitation leaves the actual reply choice unspecified. A positive should hold that choice fixed before demonstrating concise expression.

```json
{
  "visibleContext": "In a casual Traditional Chinese chat, the user has chosen to decline an invitation and asks for a brief natural reply without giving a reason.",
  "userIntent": "Decline the invitation briefly in natural Traditional Chinese without adding a reason.",
  "rationale": "Respond to an invitation leaves the actual reply choice unspecified. A positive should hold that choice fixed before demonstrating concise expression."
}
```

### zh.natural_conciseness/H1

Source: [zh.natural_conciseness/H1](../../packages/skills/definitions/modifiers/zh/natural_conciseness.yaml#L145). Original quality: STRONG. Confidence: HIGH. Issues: `NEIGHBOR_AMBIGUITY`.

Formal work progress explicitly grounds professional Chinese register, unlike generic short chat. Require professional formality and keep the reporting job compatible.

```json
{
  "expected": ["zh.professional_formality"],
  "acceptable": ["status_update"],
  "forbidden": ["zh.natural_conciseness"],
  "rationale": "Formal work progress explicitly grounds professional Chinese register, unlike generic short chat. Require professional formality and keep the reporting job compatible."
}
```

### zh.natural_conciseness/H2

Source: [zh.natural_conciseness/H2](../../packages/skills/definitions/modifiers/zh/natural_conciseness.yaml#L160). Original quality: WEAK. Confidence: HIGH. Issues: `NEIGHBOR_AMBIGUITY`.

Mixed terms support preservation but do not establish a concision need. Add an explicit verbose request using a supplied term so both modifiers have independently visible work.

```json
{
  "visibleContext": "A Chinese chat intentionally uses design review. The user's chosen request contains redundant wording, and they ask to shorten it while keeping that existing English term.",
  "userIntent": "Request a design review concisely while preserving the already-used term.",
  "expected": ["zh.code_switching", "zh.natural_conciseness"],
  "acceptable": ["request"],
  "forbidden": [],
  "rationale": "Mixed terms support preservation but do not establish a concision need. Add an explicit verbose request using a supplied term so both modifiers have independently visible work."
}
```

### zh.code_switching/H1

Source: [zh.code_switching/H1](../../packages/skills/definitions/modifiers/zh/code_switching.yaml#L146). Original quality: WEAK. Confidence: HIGH. Issues: `WEAK_POSITIVE`, `NEIGHBOR_AMBIGUITY`.

Already short natural Chinese does not demonstrate a need for further concision. Use a verbose purely Chinese planning restatement to make the neighbor useful.

```json
{
  "visibleContext": "The user has a verbose purely Chinese restatement of an already agreed Saturday meeting and asks to remove repetition. No English terms occur.",
  "userIntent": "Restate the agreed Saturday meeting concisely in Chinese without adding English terms.",
  "expected": ["zh.natural_conciseness"],
  "acceptable": ["planning"],
  "forbidden": ["zh.code_switching"],
  "rationale": "Already short natural Chinese does not demonstrate a need for further concision. Use a verbose purely Chinese planning restatement to make the neighbor useful."
}
```

### zh.code_switching/H2

Source: [zh.code_switching/H2](../../packages/skills/definitions/modifiers/zh/code_switching.yaml#L161). Original quality: STRONG. Confidence: HIGH. Issues: none.

Preserving a quoted identifier is a general fidelity obligation even in Korean. No Chinese-specific skill is needed or eligible; encode the exclusion explicitly.

```json
{
  "expected": [],
  "acceptable": [],
  "forbidden": ["zh.code_switching"],
  "rationale": "Preserving a quoted identifier is a general fidelity obligation even in Korean. No Chinese-specific skill is needed or eligible; encode the exclusion explicitly."
}
```

## Human escalation list

Review these **17 original cases** and the linked grouped boundary/runtime recommendation. Straightforward proposed fixes are already supplied; the human's job is to assess critical preservation or choose the unresolved boundary, not perform the whole first pass again.

| Case                                                                                                                   | Codex decision   | Why human judgment remains valuable                                                                                                                       |
| ---------------------------------------------------------------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [acknowledge_mistake/H1](../../packages/skills/definitions/atomic/accountability_repair/acknowledge_mistake.yaml#L149) | QUARANTINE / LOW | Resolve whether impact is user-caused before endorsing an apology boundary.                                                                               |
| [emotional_validation/H1](../../packages/skills/definitions/atomic/recognition_support/emotional_validation.yaml#L145) | QUARANTINE / LOW | Decide whether recognition of a stated difficult interpretation already falls within visible-difficulty validation.                                       |
| [emotional_validation/A1](../../packages/skills/definitions/atomic/recognition_support/emotional_validation.yaml#L175) | REVISE / HIGH    | Audit the distinction between a user-authorized intent override and ordinary rewrite preservation.                                                        |
| [reassurance/A1](../../packages/skills/definitions/atomic/recognition_support/reassurance.yaml#L182)                   | REVISE / HIGH    | Audit the correction from co-attendance to a claim strictly limited to the existing attendance commitment.                                                |
| [reassurance/A2](../../packages/skills/definitions/atomic/recognition_support/reassurance.yaml#L207)                   | REVISE / HIGH    | Audit preservation versus correction of unsupported certainty; no future checking commitment should be introduced.                                        |
| [boundary_setting/A1](../../packages/skills/definitions/atomic/decisions_limits/boundary_setting.yaml#L179)            | REVISE / HIGH    | Resolve whether the existing repeated-pressure runtime boundary should cover a first explicit limit; wording cutoff correction itself is straightforward. |
| [boundary_setting/A2](../../packages/skills/definitions/atomic/decisions_limits/boundary_setting.yaml#L201)            | REVISE / HIGH    | Audit the choice-versus-capacity correction; refusal must not acquire an invented excuse.                                                                 |
| [de_escalation/H1](../../packages/skills/definitions/atomic/conflict_feedback/de_escalation.yaml#L146)                 | QUARANTINE / LOW | Choose whether to keep the repeated-pressure restriction or separately broaden the boundary definition; do not invent pressure in this case.              |
| [de_escalation/A1](../../packages/skills/definitions/atomic/conflict_feedback/de_escalation.yaml#L176)                 | REVISE / MEDIUM  | Spot-check the unsupported mismatch implication and preservation of the intended joint checking request.                                                  |
| [de_escalation/A2](../../packages/skills/definitions/atomic/conflict_feedback/de_escalation.yaml#L199)                 | REVISE / HIGH    | Audit removal of invented understanding and capacity claims while preserving refusal.                                                                     |
| [follow_up/A1](../../packages/skills/definitions/atomic/coordination/follow_up.yaml#L175)                              | REVISE / MEDIUM  | Audit whether removing a demand for an explanation was authorized; the proposed draft avoids that uncertainty.                                            |
| [status_update/A1](../../packages/skills/definitions/atomic/coordination/status_update.yaml#L178)                      | REVISE / MEDIUM  | Audit whether the original later plan was material; the revised draft makes the intended present-state contrast unambiguous.                              |
| [expectation_setting/H2](../../packages/skills/definitions/atomic/coordination/expectation_setting.yaml#L163)          | QUARANTINE / LOW | Resolve overlap between broad supported limits and the narrower repeated-pressure boundary definition.                                                    |
| [expectation_setting/A2](../../packages/skills/definitions/atomic/coordination/expectation_setting.yaml#L202)          | REVISE / HIGH    | Audit preservation of the explicit scope cap; no additional work may be implied.                                                                          |
| [planning/H2](../../packages/skills/definitions/atomic/coordination/planning.yaml#L160)                                | QUARANTINE / LOW | Resolve whether material agreement verification adds a separate capability beyond planning/clarification.                                                 |
| [clarification/H1](../../packages/skills/definitions/atomic/understanding_inquiry/clarification.yaml#L144)             | QUARANTINE / LOW | Decide whether consequential verification requires a new atom or application guidance within clarification.                                               |
| [en.direct_but_polite/A1](../../packages/skills/definitions/modifiers/en/direct_but_polite.yaml#L180)                  | REVISE / HIGH    | Audit will-not versus cannot: polite phrasing must not invent an excuse.                                                                                  |

All six quarantines and every recorded skill-boundary issue are included. Candidate identity/overlap and any proposed runtime field change require product review. No reviewer identities or human dates are assigned. Ordinary noncritical revisions stay Codex proposals and do not require a new per-case manual gate in this task.

## Stratified clean-KEEP audit

The reproducible sample is **20/129 = 15.5%** of clean KEEP decisions. Seed: `phase8a-semantic-clean-keep-audit-2026-09-19-v1`. Pool, allocations and selected keys are recorded in the ledger. Sort each stratum by SHA-256(seed + newline + key); allocate a 15% overall target rounded up, at least one per nonempty category × universal/English-modifier/Chinese-modifier stratum, then distribute remaining slots by largest fractional remainder with deterministic category/group tie-breaks.

| Category    | Family      | Clean KEEP pool | Audit |
| ----------- | ----------- | --------------: | ----: |
| POSITIVE    | UNIVERSAL   |              41 |     6 |
| POSITIVE    | EN_MODIFIER |               6 |     2 |
| POSITIVE    | ZH_MODIFIER |               9 |     1 |
| NEGATIVE    | UNIVERSAL   |              23 |     3 |
| NEGATIVE    | EN_MODIFIER |               9 |     1 |
| NEGATIVE    | ZH_MODIFIER |              12 |     2 |
| NEIGHBOR    | UNIVERSAL   |               0 |     0 |
| NEIGHBOR    | EN_MODIFIER |               0 |     0 |
| NEIGHBOR    | ZH_MODIFIER |               0 |     0 |
| APPLICATION | UNIVERSAL   |              16 |     2 |
| APPLICATION | EN_MODIFIER |               5 |     2 |
| APPLICATION | ZH_MODIFIER |               8 |     1 |

There are **no clean KEEP H cases**: they all needed actual annotation revision, rejection or quarantine. The empty neighbor audit stratum is disclosed rather than filled by changing decisions. Critical/boundary neighbors are already in the mandatory escalation set.

- [decline/P2](../../packages/skills/definitions/atomic/decisions_limits/decline.yaml#L62)
- [emotional_validation/P1](../../packages/skills/definitions/atomic/recognition_support/emotional_validation.yaml#L43)
- [acknowledge_mistake/P1](../../packages/skills/definitions/atomic/accountability_repair/acknowledge_mistake.yaml#L47)
- [planning/P2](../../packages/skills/definitions/atomic/coordination/planning.yaml#L60)
- [reassurance/P3](../../packages/skills/definitions/atomic/recognition_support/reassurance.yaml#L81)
- [reassurance/P2](../../packages/skills/definitions/atomic/recognition_support/reassurance.yaml#L64)
- [en.casual_naturalness/P1](../../packages/skills/definitions/modifiers/en/casual_naturalness.yaml#L42)
- [en.professional_conciseness/P1](../../packages/skills/definitions/modifiers/en/professional_conciseness.yaml#L46)
- [zh.code_switching/P1](../../packages/skills/definitions/modifiers/zh/code_switching.yaml#L44)
- [expectation_setting/N1](../../packages/skills/definitions/atomic/coordination/expectation_setting.yaml#L97)
- [follow_up/N2](../../packages/skills/definitions/atomic/coordination/follow_up.yaml#L110)
- [boundary_setting/N1](../../packages/skills/definitions/atomic/decisions_limits/boundary_setting.yaml#L97)
- [en.casual_naturalness/N2](../../packages/skills/definitions/modifiers/en/casual_naturalness.yaml#L110)
- [zh.professional_formality/N1](../../packages/skills/definitions/modifiers/zh/professional_formality.yaml#L96)
- [zh.politeness_calibration/N1](../../packages/skills/definitions/modifiers/zh/politeness_calibration.yaml#L95)
- [decline/A2](../../packages/skills/definitions/atomic/decisions_limits/decline.yaml#L204)
- [expectation_setting/A1](../../packages/skills/definitions/atomic/coordination/expectation_setting.yaml#L179)
- [en.casual_naturalness/A1](../../packages/skills/definitions/modifiers/en/casual_naturalness.yaml#L175)
- [en.casual_naturalness/A2](../../packages/skills/definitions/modifiers/en/casual_naturalness.yaml#L197)
- [zh.politeness_calibration/A1](../../packages/skills/definitions/modifiers/zh/politeness_calibration.yaml#L177)

The audit and 17 escalations are disjoint. Assign actual reviewer(s) with competence for the selected English and Chinese material; record their actual decisions later. A disagreement should revise the affected judgment and its provenance, not invalidate all 210 ordinary decisions automatically.

## Complete original-example decision index

Every row is CODEX_SEMANTIC_REVIEW, not human approval. Exact evidence and preservation checks are in the ledger.

| Key / original source                                                                                                  | Decision   | Quality    | Confidence | Specific rationale                                                                                                                                                                                                                          |
| ---------------------------------------------------------------------------------------------------------------------- | ---------- | ---------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [apology/P1](../../packages/skills/definitions/atomic/accountability_repair/apology.yaml#L46)                          | KEEP       | ACCEPTABLE | HIGH       | Forgetting a promised attachment is user-owned; direct regret usefully addresses that lapse without promising a resend.                                                                                                                     |
| [apology/P2](../../packages/skills/definitions/atomic/accountability_repair/apology.yaml#L63)                          | REVISE     | WEAK       | HIGH       | A second bare wants-to-apologize scenario adds little discrimination; retain lateness but explicitly bound regret to its impact.                                                                                                            |
| [apology/P3](../../packages/skills/definitions/atomic/accountability_repair/apology.yaml#L80)                          | KEEP       | STRONG     | HIGH       | Giving incorrect directions grounds responsibility for that error; regret to affected attendees is distinct from inventing travel damage or compensation.                                                                                   |
| [apology/N1](../../packages/skills/definitions/atomic/accountability_repair/apology.yaml#L97)                          | REVISE     | STRONG     | HIGH       | The absent attachment belongs to another participant's error. Require reporting its status and forbid transferring fault to the user.                                                                                                       |
| [apology/N2](../../packages/skills/definitions/atomic/accountability_repair/apology.yaml#L114)                         | REVISE     | STRONG     | HIGH       | Refusing an invitation never accepted supplies no broken promise. Require decline; social thanks need not become an apology.                                                                                                                |
| [apology/N3](../../packages/skills/definitions/atomic/accountability_repair/apology.yaml#L131)                         | REJECT     | WEAK       | HIGH       | A bare meeting-location question trivially excludes regret and repeats the inquiry contrast covered elsewhere; retain only as historical evidence.                                                                                          |
| [apology/H1](../../packages/skills/definitions/atomic/accountability_repair/apology.yaml#L148)                         | REVISE     | STRONG     | HIGH       | The user expressly wants ownership without regret. Optional acknowledgement fails to encode the decisive contrast.                                                                                                                          |
| [apology/H2](../../packages/skills/definitions/atomic/accountability_repair/apology.yaml#L166)                         | REVISE     | STRONG     | HIGH       | Recognizing a friend's upsetting experience does not establish user responsibility. Require validation and exclude regret for causing it.                                                                                                   |
| [apology/A1](../../packages/skills/definitions/atomic/accountability_repair/apology.yaml#L182)                         | KEEP       | ACCEPTABLE | HIGH       | The rewrite expands shorthand into direct regret for the same forgotten attachment; no reason, deadline or repair promise is added.                                                                                                         |
| [apology/A2](../../packages/skills/definitions/atomic/accountability_repair/apology.yaml#L204)                         | KEEP       | STRONG     | HIGH       | The source independently supplies late arrival and the draft supplies waiting. Owning that supported impact improves regret without broader blame.                                                                                          |
| [acknowledge_mistake/P1](../../packages/skills/definitions/atomic/accountability_repair/acknowledge_mistake.yaml#L47)  | KEEP       | STRONG     | HIGH       | The 42-versus-24 contrast identifies a precise user-owned error; acknowledgement must preserve both numbers and need not add regret.                                                                                                        |
| [acknowledge_mistake/P2](../../packages/skills/definitions/atomic/accountability_repair/acknowledge_mistake.yaml#L64)  | KEEP       | ACCEPTABLE | HIGH       | Forgetting the friend's request is explicitly owned and acknowledgement chosen; no excuse or renewed promise follows.                                                                                                                       |
| [acknowledge_mistake/P3](../../packages/skills/definitions/atomic/accountability_repair/acknowledge_mistake.yaml#L81)  | KEEP       | STRONG     | HIGH       | The user supplied the wrong address and wants a correction. Ownership is useful even without apology or an invented replacement address.                                                                                                    |
| [acknowledge_mistake/N1](../../packages/skills/definitions/atomic/accountability_repair/acknowledge_mistake.yaml#L98)  | KEEP       | STRONG     | HIGH       | A customer's error cannot be relabeled the user's mistake. With no user communication goal, no alternative skill is justified by the supplied evidence.                                                                                     |
| [acknowledge_mistake/N2](../../packages/skills/definitions/atomic/accountability_repair/acknowledge_mistake.yaml#L115) | KEEP       | STRONG     | HIGH       | Disputed fault plus explicit denial rules out owning the error; denial alone is not evidence of heat or a continuing boundary.                                                                                                              |
| [acknowledge_mistake/N3](../../packages/skills/definitions/atomic/accountability_repair/acknowledge_mistake.yaml#L132) | REVISE     | ACCEPTABLE | HIGH       | An error-free progress report needs status wording rather than ownership; name the positive alternative instead of leaving the set implicit.                                                                                                |
| [acknowledge_mistake/H1](../../packages/skills/definitions/atomic/accountability_repair/acknowledge_mistake.yaml#L149) | QUARANTINE | WEAK       | LOW        | Supported impact is not attributed to the user. Regret could be sympathy or an apology for user-caused harm; requiring apology before resolving ownership would teach false responsibility.                                                 |
| [acknowledge_mistake/H2](../../packages/skills/definitions/atomic/accountability_repair/acknowledge_mistake.yaml#L167) | REVISE     | STRONG     | HIGH       | An externally caused delay is reportable status, not the user's mistake. Make status required and ownership forbidden.                                                                                                                      |
| [acknowledge_mistake/A1](../../packages/skills/definitions/atomic/accountability_repair/acknowledge_mistake.yaml#L183) | KEEP       | STRONG     | HIGH       | Active voice makes the user's existing responsibility explicit without adding a cause, apology or correction promise.                                                                                                                       |
| [acknowledge_mistake/A2](../../packages/skills/definitions/atomic/accountability_repair/acknowledge_mistake.yaml#L206) | REVISE     | WEAK       | HIGH       | Promised yesterday can mean when the promise was made, while the ledger says the call was due yesterday. Put the time on the call.                                                                                                          |
| [emotional_validation/P1](../../packages/skills/definitions/atomic/recognition_support/emotional_validation.yaml#L43)  | KEEP       | STRONG     | HIGH       | Sadness is explicitly expressed after rejection; acknowledging it requires neither a success prediction nor responsibility.                                                                                                                 |
| [emotional_validation/P2](../../packages/skills/definitions/atomic/recognition_support/emotional_validation.yaml#L60)  | KEEP       | STRONG     | HIGH       | The coworker names frustration with cancellations. Recognition can preserve that account without endorsing who caused them.                                                                                                                 |
| [emotional_validation/P3](../../packages/skills/definitions/atomic/recognition_support/emotional_validation.yaml#L77)  | KEEP       | ACCEPTABLE | HIGH       | The family member explicitly describes exhaustion; proportional acknowledgement is grounded and does not need a diagnosis.                                                                                                                  |
| [emotional_validation/N1](../../packages/skills/definitions/atomic/recognition_support/emotional_validation.yaml#L94)  | REVISE     | ACCEPTABLE | HIGH       | Neutral schedule coordination supports planning, not inferred distress. Record the supported alternative.                                                                                                                                   |
| [emotional_validation/N2](../../packages/skills/definitions/atomic/recognition_support/emotional_validation.yaml#L111) | KEEP       | STRONG     | HIGH       | A number check has no emotional recognition job. No current atom is required until it is clear whether this is missing information or verification of an understood number.                                                                 |
| [emotional_validation/N3](../../packages/skills/definitions/atomic/recognition_support/emotional_validation.yaml#L128) | KEEP       | STRONG     | HIGH       | Endorsing an unsupported accusation is not validation. Do not turn a feeling-oriented skill into evidence that the accusation is true.                                                                                                      |
| [emotional_validation/H1](../../packages/skills/definitions/atomic/recognition_support/emotional_validation.yaml#L145) | QUARANTINE | WEAK       | LOW        | No actual interpretation or difficulty is supplied. The runtime definition covers visible difficulty as well as feeling, so emotion's absence alone cannot establish the proposed separate candidate boundary.                              |
| [emotional_validation/H2](../../packages/skills/definitions/atomic/recognition_support/emotional_validation.yaml#L159) | REVISE     | STRONG     | HIGH       | The stated aim is offering available help to address worry; grounded reassurance is required, and separate feeling recognition is compatible rather than mandatory.                                                                         |
| [emotional_validation/A1](../../packages/skills/definitions/atomic/recognition_support/emotional_validation.yaml#L175) | REVISE     | INVALID    | HIGH       | Changing don't be sad to acknowledgement reverses the draft's instruction. Explicit selected intent permits a better message, but a rewrite preservation example should start with compatible acknowledgement.                              |
| [emotional_validation/A2](../../packages/skills/definitions/atomic/recognition_support/emotional_validation.yaml#L197) | KEEP       | ACCEPTABLE | MEDIUM     | The explicit user intent, beyond the terse ok draft, authorizes acknowledging the stated frustration. The rewrite adds no motive or promise, though a shorter acknowledgement would also work.                                              |
| [reassurance/P1](../../packages/skills/definitions/atomic/recognition_support/reassurance.yaml#L44)                    | KEEP       | STRONG     | HIGH       | Accompaniment is explicitly committed before reassurance, so addressing fear of attending alone adds no new availability.                                                                                                                   |
| [reassurance/P2](../../packages/skills/definitions/atomic/recognition_support/reassurance.yaml#L64)                    | KEEP       | STRONG     | HIGH       | A verified backup is a concrete basis for support; its existence must not be inflated into certain complete recovery.                                                                                                                       |
| [reassurance/P3](../../packages/skills/definitions/atomic/recognition_support/reassurance.yaml#L81)                    | KEEP       | STRONG     | HIGH       | An already-offered joint form review can be restated as support without creating a new offer or promising acceptance of the form.                                                                                                           |
| [reassurance/N1](../../packages/skills/definitions/atomic/recognition_support/reassurance.yaml#L98)                    | KEEP       | STRONG     | HIGH       | The only proposed reassurance is an unsupported success promise. No grounded support fact or different selected goal exists to justify another skill.                                                                                       |
| [reassurance/N2](../../packages/skills/definitions/atomic/recognition_support/reassurance.yaml#L115)                   | REJECT     | WEAK       | HIGH       | Neutral message plus absent intent is too unspecified to test more than absence of all evidence; the concrete unsupported-success and refusal negatives are more instructive.                                                               |
| [reassurance/N3](../../packages/skills/definitions/atomic/recognition_support/reassurance.yaml#L132)                   | REVISE     | STRONG     | HIGH       | Preserving a refusal to help requires decline, not an offer disguised as comfort. Require the refusal operation.                                                                                                                            |
| [reassurance/H1](../../packages/skills/definitions/atomic/recognition_support/reassurance.yaml#L149)                   | REVISE     | STRONG     | HIGH       | Only sadness acknowledgement is chosen and no support fact exists. Require validation and forbid an invented reassuring commitment.                                                                                                         |
| [reassurance/H2](../../packages/skills/definitions/atomic/recognition_support/reassurance.yaml#L164)                   | REVISE     | ACCEPTABLE | HIGH       | Effort support without worry is not reassurance's visible-concern job. No current neighbor is required; encouragement remains conceptual, not a reason to force an ID.                                                                      |
| [reassurance/A1](../../packages/skills/definitions/atomic/recognition_support/reassurance.yaml#L182)                   | REVISE     | INVALID    | HIGH       | Attending too establishes co-attendance, not traveling or staying together. The answer-derived commitment ledger overstates the independently supplied promise.                                                                             |
| [reassurance/A2](../../packages/skills/definitions/atomic/recognition_support/reassurance.yaml#L207)                   | REVISE     | INVALID    | HIGH       | The rewrite responsibly reduces an unsupported everything-is-fine claim, but therefore is not certainty-preserving. Its checking next step is unnecessary; revise the pair to model uncertainty from the outset.                            |
| [boundary_setting/P1](../../packages/skills/definitions/atomic/decisions_limits/boundary_setting.yaml#L46)             | KEEP       | STRONG     | HIGH       | Repeated late nonurgent calls and the chosen stop request support an ongoing limit, rather than inventing one from a single call.                                                                                                           |
| [boundary_setting/P2](../../packages/skills/definitions/atomic/decisions_limits/boundary_setting.yaml#L63)             | KEEP       | STRONG     | HIGH       | Repeated borrowing requests plus an explicit no-lending choice establish pressure and a limit; refusal may complement the boundary without implying inability.                                                                              |
| [boundary_setting/P3](../../packages/skills/definitions/atomic/decisions_limits/boundary_setting.yaml#L80)             | KEEP       | STRONG     | HIGH       | Repeated photo sharing and an explicit prior-consent requirement establish a supported privacy limit; the skill must not invent penalties.                                                                                                  |
| [boundary_setting/N1](../../packages/skills/definitions/atomic/decisions_limits/boundary_setting.yaml#L97)             | KEEP       | STRONG     | HIGH       | No chosen limit means a wording skill cannot decide it. No substitute intent is supplied; fixed SUGGEST_REPLY is an authoring fixture, not proof the action gate should generate.                                                           |
| [boundary_setting/N2](../../packages/skills/definitions/atomic/decisions_limits/boundary_setting.yaml#L114)            | REVISE     | ACCEPTABLE | HIGH       | Asking an unknown due time seeks information, not a personal limit. Require the missing-detail operation.                                                                                                                                   |
| [boundary_setting/N3](../../packages/skills/definitions/atomic/decisions_limits/boundary_setting.yaml#L131)            | REJECT     | WEAK       | HIGH       | A neutral progress update is remote from repeated-pressure limit setting and duplicates status-only contrasts; it contributes little boundary discrimination.                                                                               |
| [boundary_setting/H1](../../packages/skills/definitions/atomic/decisions_limits/boundary_setting.yaml#L148)            | REVISE     | STRONG     | HIGH       | One refused invitation with no continuing rule selects decline. Explicitly exclude the repeated-pressure boundary operation.                                                                                                                |
| [boundary_setting/H2](../../packages/skills/definitions/atomic/decisions_limits/boundary_setting.yaml#L163)            | REVISE     | STRONG     | HIGH       | A delivery estimate communicates future timing, with no behavioral limit or repeated pressure. Require expectation setting.                                                                                                                 |
| [boundary_setting/A1](../../packages/skills/definitions/atomic/decisions_limits/boundary_setting.yaml#L179)            | REVISE     | WEAK       | HIGH       | Before 8 excludes exactly 8 whereas no calls after 8 does not. Preserve the explicit cutoff; a calm one-off statement also exposes the runtime description's repeated-pressure limitation.                                                  |
| [boundary_setting/A2](../../packages/skills/definitions/atomic/decisions_limits/boundary_setting.yaml#L201)            | REVISE     | INVALID    | HIGH       | The user chooses not to lend; inability is neither stated nor entailed. Express the chosen no and stop request directly.                                                                                                                    |
| [de_escalation/P1](../../packages/skills/definitions/atomic/conflict_feedback/de_escalation.yaml#L44)                  | KEEP       | STRONG     | HIGH       | Visible conflict over recorded figures plus a calm-disagreement goal supports reducing accusation while retaining disagreement.                                                                                                             |
| [de_escalation/P2](../../packages/skills/definitions/atomic/conflict_feedback/de_escalation.yaml#L61)                  | KEEP       | STRONG     | HIGH       | A heated discussion and chosen limit support calm delivery without weakening the limit. Repeated pressure is not supplied, so boundary_setting is not additionally recommended under its frozen description.                                |
| [de_escalation/P3](../../packages/skills/definitions/atomic/conflict_feedback/de_escalation.yaml#L78)                  | KEEP       | STRONG     | HIGH       | The dispute is explicit and the user wants a nonaccusatory discrepancy question; clarification may coexist without alleging dishonesty.                                                                                                     |
| [de_escalation/N1](../../packages/skills/definitions/atomic/conflict_feedback/de_escalation.yaml#L95)                  | REVISE     | ACCEPTABLE | HIGH       | Calm coordination has no heat to reduce and instead supports planning. Make that alternative explicit.                                                                                                                                      |
| [de_escalation/N2](../../packages/skills/definitions/atomic/conflict_feedback/de_escalation.yaml#L112)                 | KEEP       | STRONG     | HIGH       | Forcing agreement through guilt contradicts noncoercive conflict handling; the skill cannot launder that aim into an approved tactic.                                                                                                       |
| [de_escalation/N3](../../packages/skills/definitions/atomic/conflict_feedback/de_escalation.yaml#L129)                 | KEEP       | STRONG     | HIGH       | Punctuation alone does not establish conflict, pressure or the user's goal. No de-escalation or alternative skill is grounded.                                                                                                              |
| [de_escalation/H1](../../packages/skills/definitions/atomic/conflict_feedback/de_escalation.yaml#L146)                 | QUARANTINE | WEAK       | LOW        | A civil limit rules out heat reduction, but repeated pressure is absent while boundary_setting's current description requires it. The conceptual label is broader than the frozen definition.                                               |
| [de_escalation/H2](../../packages/skills/definitions/atomic/conflict_feedback/de_escalation.yaml#L161)                 | REJECT     | WEAK       | HIGH       | Multi-step dispute resolution is a playbook scope statement, not a discriminative atomic neighbor case. De-escalation can still be one component, so the purported contrast lacks concrete evidence.                                        |
| [de_escalation/A1](../../packages/skills/definitions/atomic/conflict_feedback/de_escalation.yaml#L176)                 | REVISE     | INVALID    | MEDIUM     | Disputing a total does not independently establish two totals that fail to match. Keep the existing doubt and user-chosen joint check without inventing a comparison.                                                                       |
| [de_escalation/A2](../../packages/skills/definitions/atomic/conflict_feedback/de_escalation.yaml#L199)                 | REVISE     | INVALID    | HIGH       | Pressure does not prove the recipient is struggling, and a refused shift does not establish inability. Remove both unsupported claims while preserving the fixed no.                                                                        |
| [decline/P1](../../packages/skills/definitions/atomic/decisions_limits/decline.yaml#L45)                               | KEEP       | ACCEPTABLE | HIGH       | A chosen party refusal is a useful plain case: make the no clear without generating an excuse or alternative date.                                                                                                                          |
| [decline/P2](../../packages/skills/definitions/atomic/decisions_limits/decline.yaml#L62)                               | KEEP       | STRONG     | HIGH       | Refusing extra work tests retention of a no in an obligation-adjacent setting without inferring lack of capacity.                                                                                                                           |
| [decline/P3](../../packages/skills/definitions/atomic/decisions_limits/decline.yaml#L79)                               | KEEP       | ACCEPTABLE | HIGH       | Declining an upgrade needs a clear commercial refusal; no dissatisfaction or future purchase promise is implied.                                                                                                                            |
| [decline/N1](../../packages/skills/definitions/atomic/decisions_limits/decline.yaml#L96)                               | KEEP       | STRONG     | HIGH       | An explicit acceptance forbids refusal. Without logistics or register evidence, no other skill is necessary merely because the answer is yes.                                                                                               |
| [decline/N2](../../packages/skills/definitions/atomic/decisions_limits/decline.yaml#L113)                              | KEEP       | STRONG     | HIGH       | An undecided user has not authorized no. No current skill can supply the missing decision; the actual action policy is a separate question.                                                                                                 |
| [decline/N3](../../packages/skills/definitions/atomic/decisions_limits/decline.yaml#L130)                              | REVISE     | STRONG     | HIGH       | The user chose to obtain details before deciding, so clarification is supported and decline would preempt the choice.                                                                                                                       |
| [decline/H1](../../packages/skills/definitions/atomic/decisions_limits/decline.yaml#L147)                              | REVISE     | STRONG     | MEDIUM     | The expressed goal is an ongoing limit under repeated requests. Require boundary setting; decline is compatible only insofar as that limit also rejects the current request.                                                                |
| [decline/H2](../../packages/skills/definitions/atomic/decisions_limits/decline.yaml#L162)                              | REVISE     | STRONG     | HIGH       | Cannot do Tuesday and offers Friday combines a specific refusal with proposed logistics. Neither skill should erase the other half or turn Friday into a confirmed plan.                                                                    |
| [decline/A1](../../packages/skills/definitions/atomic/decisions_limits/decline.yaml#L181)                              | KEEP       | STRONG     | HIGH       | The invitation is independently supplied; conventional thanks accompanies an unchanged refusal and adds no reason or future availability.                                                                                                   |
| [decline/A2](../../packages/skills/definitions/atomic/decisions_limits/decline.yaml#L204)                              | KEEP       | STRONG     | HIGH       | Unlike a bare will-not choice, the draft and context both explicitly state inability. The rewrite preserves that same capacity claim.                                                                                                       |
| [ask_for_help/P1](../../packages/skills/definitions/atomic/requests_options/ask_for_help.yaml#L42)                     | KEEP       | STRONG     | HIGH       | Checking a formula is a bounded assistance request, not merely asking for a file or an unknown datum.                                                                                                                                       |
| [ask_for_help/P2](../../packages/skills/definitions/atomic/requests_options/ask_for_help.yaml#L59)                     | KEEP       | ACCEPTABLE | HIGH       | Carrying a table supplies a concrete help task; the wording must leave time and availability open.                                                                                                                                          |
| [ask_for_help/P3](../../packages/skills/definitions/atomic/requests_options/ask_for_help.yaml#L76)                     | KEEP       | STRONG     | HIGH       | Understanding a proof requires instructional assistance; it is broader than disambiguating a missing reference and does not invent a specific difficulty.                                                                                   |
| [ask_for_help/N1](../../packages/skills/definitions/atomic/requests_options/ask_for_help.yaml#L93)                     | REVISE     | ACCEPTABLE | HIGH       | Reporting a finished task asks for no assistance. Require status rather than leaving the valid operation implicit.                                                                                                                          |
| [ask_for_help/N2](../../packages/skills/definitions/atomic/requests_options/ask_for_help.yaml#L110)                    | KEEP       | STRONG     | HIGH       | An explicit refusal plus intent to pressure is not a voluntary assistance request; polite phrasing cannot create an obligation.                                                                                                             |
| [ask_for_help/N3](../../packages/skills/definitions/atomic/requests_options/ask_for_help.yaml#L127)                    | KEEP       | STRONG     | HIGH       | Offering assistance reverses the direction of help. There is no visible concern to justify reassurance or request from this fact alone.                                                                                                     |
| [ask_for_help/H1](../../packages/skills/definitions/atomic/requests_options/ask_for_help.yaml#L144)                    | REVISE     | STRONG     | HIGH       | Sending a known document without help framing supports request; do not manufacture vulnerability or assistance merely because someone acts.                                                                                                 |
| [ask_for_help/H2](../../packages/skills/definitions/atomic/requests_options/ask_for_help.yaml#L159)                    | REVISE     | STRONG     | HIGH       | Resolving what tomorrow refers to is a material ambiguity. Require clarification, with generic request wording compatible but unnecessary.                                                                                                  |
| [ask_for_help/A1](../../packages/skills/definitions/atomic/requests_options/ask_for_help.yaml#L175)                    | KEEP       | STRONG     | HIGH       | The independently supplied one-formula scope licenses replacing vague spreadsheet shorthand with an answerable help request.                                                                                                                |
| [ask_for_help/A2](../../packages/skills/definitions/atomic/requests_options/ask_for_help.yaml#L198)                    | KEEP       | STRONG     | HIGH       | The rewrite asks willingness to assist with the supplied table and removes obligation framing without inventing urgency or a time.                                                                                                          |
| [follow_up/P1](../../packages/skills/definitions/atomic/coordination/follow_up.yaml#L42)                               | KEEP       | STRONG     | HIGH       | The visible earlier review request anchors a status check; it is not evidence the review is late or neglected.                                                                                                                              |
| [follow_up/P2](../../packages/skills/definitions/atomic/coordination/follow_up.yaml#L59)                               | KEEP       | ACCEPTABLE | HIGH       | A visible earlier invitation makes an attendance check a revisit, not a first invitation or assumed acceptance.                                                                                                                             |
| [follow_up/P3](../../packages/skills/definitions/atomic/coordination/follow_up.yaml#L76)                               | KEEP       | STRONG     | HIGH       | The earlier repair-appointment request supports asking for its update without inventing a confirmed appointment or deadline.                                                                                                                |
| [follow_up/N1](../../packages/skills/definitions/atomic/coordination/follow_up.yaml#L93)                               | KEEP       | STRONG     | HIGH       | No observed or supplied earlier ask means follow-up has no anchor; this does not prove there was no past interaction or authorize inventing one.                                                                                            |
| [follow_up/N2](../../packages/skills/definitions/atomic/coordination/follow_up.yaml#L110)                              | KEEP       | STRONG     | HIGH       | A fully answered earlier request supplies no unresolved follow-up goal. No new question should be generated merely from historical context.                                                                                                 |
| [follow_up/N3](../../packages/skills/definitions/atomic/coordination/follow_up.yaml#L127)                              | KEEP       | STRONG     | HIGH       | An explicit decline is not silence to chase. Guilt-based reversal is excluded rather than reframed as a courteous reminder.                                                                                                                 |
| [follow_up/H1](../../packages/skills/definitions/atomic/coordination/follow_up.yaml#L144)                              | REVISE     | STRONG     | HIGH       | The request is expressly the first one. Require request and forbid invented reminder framing.                                                                                                                                               |
| [follow_up/H2](../../packages/skills/definitions/atomic/coordination/follow_up.yaml#L159)                              | REVISE     | STRONG     | HIGH       | Reporting one's own progress is outward status, not checking the other person's response to an ask.                                                                                                                                         |
| [follow_up/A1](../../packages/skills/definitions/atomic/coordination/follow_up.yaml#L175)                              | REVISE     | WEAK       | MEDIUM     | Why no reply asks for a reason, while had a chance asks about review progress. The broader follow-up intent does not make these identical preservation targets; use a progress-check draft.                                                 |
| [follow_up/A2](../../packages/skills/definitions/atomic/coordination/follow_up.yaml#L200)                              | KEEP       | STRONG     | HIGH       | The visible appointment request resolves what any news refers to. The rewrite seeks an update without asserting booking or blame.                                                                                                           |
| [status_update/P1](../../packages/skills/definitions/atomic/coordination/status_update.yaml#L45)                       | KEEP       | STRONG     | HIGH       | Two completed and one pending section make a concrete present-state contrast without implying all work is done.                                                                                                                             |
| [status_update/P2](../../packages/skills/definitions/atomic/coordination/status_update.yaml#L62)                       | KEEP       | ACCEPTABLE | HIGH       | The supplied train delay is current status; no arrival estimate or user-caused fault is supported.                                                                                                                                          |
| [status_update/P3](../../packages/skills/definitions/atomic/coordination/status_update.yaml#L79)                       | KEEP       | STRONG     | HIGH       | Visible shipment confirmation independently grounds the shipped claim, distinguishing reporting from invented reassurance.                                                                                                                  |
| [status_update/N1](../../packages/skills/definitions/atomic/coordination/status_update.yaml#L96)                       | REVISE     | STRONG     | HIGH       | Unknown status must be requested, not supplied as a report. Generic request and a focused missing-detail question are valid wording approaches.                                                                                             |
| [status_update/N2](../../packages/skills/definitions/atomic/coordination/status_update.yaml#L113)                      | KEEP       | STRONG     | HIGH       | The goal explicitly requires fabricated progress; neither status nor reassurance can make that unsupported claim legitimate.                                                                                                                |
| [status_update/N3](../../packages/skills/definitions/atomic/coordination/status_update.yaml#L130)                      | REVISE     | STRONG     | HIGH       | A future availability limit is expectation setting, not current progress. Require the supported timing/scope operation.                                                                                                                     |
| [status_update/H1](../../packages/skills/definitions/atomic/coordination/status_update.yaml#L147)                      | REVISE     | STRONG     | HIGH       | Probably tomorrow expresses an uncertain estimate; expectation setting must preserve probability and status is not independently supplied.                                                                                                  |
| [status_update/H2](../../packages/skills/definitions/atomic/coordination/status_update.yaml#L162)                      | REVISE     | STRONG     | HIGH       | Assigning the next step is prospective coordination, not evidence of completed progress. Require planning without claiming execution.                                                                                                       |
| [status_update/A1](../../packages/skills/definitions/atomic/coordination/status_update.yaml#L178)                      | REVISE     | WEAK       | MEDIUM     | Review later can express a future plan, which the improvement drops. Start with explicit not-started wording so the pair teaches status preservation rather than silent plan deletion.                                                      |
| [status_update/A2](../../packages/skills/definitions/atomic/coordination/status_update.yaml#L201)                      | KEEP       | STRONG     | HIGH       | Both delay and unknown arrival time survive the rewrite. It neither predicts a time nor apologizes for an externally caused delay.                                                                                                          |
| [expectation_setting/P1](../../packages/skills/definitions/atomic/coordination/expectation_setting.yaml#L46)           | KEEP       | STRONG     | HIGH       | Probably tomorrow is a supplied estimate, so realistic expectation wording is useful only if it retains that uncertainty.                                                                                                                   |
| [expectation_setting/P2](../../packages/skills/definitions/atomic/coordination/expectation_setting.yaml#L63)           | KEEP       | STRONG     | HIGH       | The one-hour visit duration is a concrete capacity limit, not a refusal or assumed conflict. Expectation setting communicates its scope.                                                                                                    |
| [expectation_setting/P3](../../packages/skills/definitions/atomic/coordination/expectation_setting.yaml#L80)           | KEEP       | STRONG     | HIGH       | One chapter this week versus the whole manuscript tests a bounded offer; neither more work nor a stronger promise may be inferred.                                                                                                          |
| [expectation_setting/N1](../../packages/skills/definitions/atomic/coordination/expectation_setting.yaml#L97)           | KEEP       | STRONG     | HIGH       | No timing, scope or chosen communication goal exists from which to set an expectation. Unknown information cannot become an estimate.                                                                                                       |
| [expectation_setting/N2](../../packages/skills/definitions/atomic/coordination/expectation_setting.yaml#L114)          | REVISE     | STRONG     | HIGH       | Already-completed work is present status. Require reporting completion and exclude an invented future estimate.                                                                                                                             |
| [expectation_setting/N3](../../packages/skills/definitions/atomic/coordination/expectation_setting.yaml#L131)          | REVISE     | STRONG     | HIGH       | The user seeks the other person's requirements rather than stating their own timing. A focused clarification is supported.                                                                                                                  |
| [expectation_setting/H1](../../packages/skills/definitions/atomic/coordination/expectation_setting.yaml#L148)          | REVISE     | STRONG     | HIGH       | Present progress without future timing requires status reporting; do not fabricate a schedule to justify expectation setting.                                                                                                               |
| [expectation_setting/H2](../../packages/skills/definitions/atomic/coordination/expectation_setting.yaml#L163)          | QUARANTINE | WEAK       | LOW        | An ongoing contact rule resembles boundary setting, but repetition/pressure is unstated and the runtime expectation definition also broadly includes limits. The claimed exclusive neighbor boundary is unresolved.                         |
| [expectation_setting/A1](../../packages/skills/definitions/atomic/coordination/expectation_setting.yaml#L179)          | KEEP       | STRONG     | HIGH       | Expect with an explicit not-certain qualification preserves the probably estimate and tomorrow anchor without creating a deadline promise.                                                                                                  |
| [expectation_setting/A2](../../packages/skills/definitions/atomic/coordination/expectation_setting.yaml#L202)          | REVISE     | WEAK       | HIGH       | Dropping only weakens the explicit maximum: can review one chapter can sound like a minimum offer. Keep the one-chapter cap visible.                                                                                                        |
| [planning/P1](../../packages/skills/definitions/atomic/coordination/planning.yaml#L43)                                 | KEEP       | STRONG     | HIGH       | The time is already agreed; summarizing Saturday at 2 does not need another verification question or new commitment.                                                                                                                        |
| [planning/P2](../../packages/skills/definitions/atomic/coordination/planning.yaml#L60)                                 | KEEP       | STRONG     | HIGH       | Agreed sender/reviewer roles support coordination wording without treating those future roles as completed work.                                                                                                                            |
| [planning/P3](../../packages/skills/definitions/atomic/coordination/planning.yaml#L77)                                 | KEEP       | ACCEPTABLE | HIGH       | Supplied pickup place/time support logistical clarity; an example need not invent a new option to demonstrate planning.                                                                                                                     |
| [planning/N1](../../packages/skills/definitions/atomic/coordination/planning.yaml#L94)                                 | KEEP       | STRONG     | HIGH       | No attendance choice exists, so scheduling attendance would decide for the user. No alternative skill is supported yet.                                                                                                                     |
| [planning/N2](../../packages/skills/definitions/atomic/coordination/planning.yaml#L111)                                | REVISE     | ACCEPTABLE | HIGH       | Reporting completed work is status, not arranging future action. Make the reporting operation explicit.                                                                                                                                     |
| [planning/N3](../../packages/skills/definitions/atomic/coordination/planning.yaml#L128)                                | REVISE     | STRONG     | HIGH       | All offered times were refused. Require decline and do not invent a new time or reopen negotiation through planning.                                                                                                                        |
| [planning/H1](../../packages/skills/definitions/atomic/coordination/planning.yaml#L145)                                | REVISE     | ACCEPTABLE | MEDIUM     | Starting a new task is a request. With no supplied logistics, planning adds no separate value; it must not be forbidden universally for requests that later specify next steps.                                                             |
| [planning/H2](../../packages/skills/definitions/atomic/coordination/planning.yaml#L160)                                | QUARANTINE | WEAK       | LOW        | Verifying an apparent agreement may itself coordinate the next step. The generic scenario omits a material reason for checking and cannot prove confirmation is a distinct atomic job.                                                      |
| [planning/A1](../../packages/skills/definitions/atomic/coordination/planning.yaml#L175)                                | KEEP       | STRONG     | HIGH       | Saturday, 2 p.m. and library are independently agreed, so see you restates the existing meeting rather than inventing attendance.                                                                                                           |
| [planning/A2](../../packages/skills/definitions/atomic/coordination/planning.yaml#L198)                                | KEEP       | STRONG     | HIGH       | Would 3 p.m. work remains an offer for agreement, preserving the tentative time rather than declaring a confirmed meeting.                                                                                                                  |
| [clarification/P1](../../packages/skills/definitions/atomic/understanding_inquiry/clarification.yaml#L42)              | KEEP       | STRONG     | HIGH       | Two plausible files and an explicit which-file goal support one discriminating question, not a request to send an assumed file.                                                                                                             |
| [clarification/P2](../../packages/skills/definitions/atomic/understanding_inquiry/clarification.yaml#L59)              | KEEP       | STRONG     | HIGH       | Two plausible café locations leave one material unknown; the question should identify the location without choosing it.                                                                                                                     |
| [clarification/P3](../../packages/skills/definitions/atomic/understanding_inquiry/clarification.yaml#L76)              | KEEP       | STRONG     | HIGH       | Chapter three is known but the book is missing. A single book question resolves the ambiguity without asking unrelated details.                                                                                                             |
| [clarification/N1](../../packages/skills/definitions/atomic/understanding_inquiry/clarification.yaml#L93)              | KEEP       | STRONG     | HIGH       | An explicit, understood detail supplies no missing-information job. Re-asking it adds interaction burden without a stated verification need.                                                                                                |
| [clarification/N2](../../packages/skills/definitions/atomic/understanding_inquiry/clarification.yaml#L110)             | KEEP       | STRONG     | HIGH       | An unrelated curiosity question does not resolve a material unknown in the chosen response. Generic curiosity is not a reason to select this skill.                                                                                         |
| [clarification/N3](../../packages/skills/definitions/atomic/understanding_inquiry/clarification.yaml#L127)             | KEEP       | STRONG     | HIGH       | The coach's own ASK_CLARIFICATION is a non-wording action; all skills are ineligible, unlike wording a user's question.                                                                                                                     |
| [clarification/H1](../../packages/skills/definitions/atomic/understanding_inquiry/clarification.yaml#L144)             | QUARANTINE | WEAK       | LOW        | Friday is apparently understood, but final verification lacks an explicit material reason and overlaps checking a remaining uncertainty. The current example does not establish a distinct confirmation boundary.                           |
| [clarification/H2](../../packages/skills/definitions/atomic/understanding_inquiry/clarification.yaml#L158)             | REVISE     | STRONG     | HIGH       | Sending a known file is an action request; no identity ambiguity needs resolving. Require request and exclude clarification.                                                                                                                |
| [clarification/A1](../../packages/skills/definitions/atomic/understanding_inquiry/clarification.yaml#L174)             | REVISE     | WEAK       | HIGH       | Current visibleContext explicitly names sales/budget, so the answer is grounded in current YAML. Earlier sourceText only supplies two reports; remove answer-dependent elaboration from the replacement to preserve unambiguous provenance. |
| [clarification/A2](../../packages/skills/definitions/atomic/understanding_inquiry/clarification.yaml#L198)             | KEEP       | STRONG     | HIGH       | Two branches are independently supplied; asking which location identifies exactly the missing detail without naming an unsupported branch.                                                                                                  |
| [request/P1](../../packages/skills/definitions/atomic/requests_options/request.yaml#L42)                               | KEEP       | ACCEPTABLE | HIGH       | A chosen agenda request supplies a concrete action but no deadline; direct wording can make the ask answerable.                                                                                                                             |
| [request/P2](../../packages/skills/definitions/atomic/requests_options/request.yaml#L59)                               | KEEP       | STRONG     | HIGH       | Returning a book is a specific chosen action. The skill should not infer overdue status, blame or a return date.                                                                                                                            |
| [request/P3](../../packages/skills/definitions/atomic/requests_options/request.yaml#L76)                               | KEEP       | ACCEPTABLE | HIGH       | The receipt and email channel are supplied; a clear action request needs no invented entitlement or urgency.                                                                                                                                |
| [request/N1](../../packages/skills/definitions/atomic/requests_options/request.yaml#L93)                               | KEEP       | STRONG     | HIGH       | Without a chosen requested action the skill cannot invent what the recipient should do. No supported alternative communication goal is given.                                                                                               |
| [request/N2](../../packages/skills/definitions/atomic/requests_options/request.yaml#L110)                              | KEEP       | STRONG     | HIGH       | Testing someone through silence is not an explicit request and must not be turned into a covert influence technique.                                                                                                                        |
| [request/N3](../../packages/skills/definitions/atomic/requests_options/request.yaml#L127)                              | REVISE     | STRONG     | HIGH       | A completed-action report asks nothing of the recipient. Require status and prohibit inventing a request.                                                                                                                                   |
| [request/H1](../../packages/skills/definitions/atomic/requests_options/request.yaml#L144)                              | REVISE     | STRONG     | HIGH       | Assistance carrying an object is a specific kind of request, not its opposite. Require the help-specific guidance while allowing compatible generic request wording.                                                                        |
| [request/H2](../../packages/skills/definitions/atomic/requests_options/request.yaml#L159)                              | REVISE     | STRONG     | HIGH       | Revisiting an unanswered agenda request supplies follow-up context while retaining a requested action. Do not forbid request merely because the more specific neighbor fits.                                                                |
| [request/A1](../../packages/skills/definitions/atomic/requests_options/request.yaml#L175)                              | KEEP       | STRONG     | HIGH       | Could you send me the agenda preserves the chosen action and adds conventional request form, without urgency or deadline.                                                                                                                   |
| [request/A2](../../packages/skills/definitions/atomic/requests_options/request.yaml#L199)                              | KEEP       | STRONG     | HIGH       | More frequent calls and the choice to ask are independently explicit. Replacing a mind-reading demand with an open request communicates that same goal without promising a schedule.                                                        |
| [en.professional_conciseness/P1](../../packages/skills/definitions/modifiers/en/professional_conciseness.yaml#L46)     | KEEP       | ACCEPTABLE | HIGH       | The explicit professional-chat intent and English progress report support concise work wording; status remains the underlying job.                                                                                                          |
| [en.professional_conciseness/P2](../../packages/skills/definitions/modifiers/en/professional_conciseness.yaml#L63)     | KEEP       | ACCEPTABLE | HIGH       | A professional English document request benefits from avoiding ceremonial email framing; the modifier supplies expression, not the chosen ask.                                                                                              |
| [en.professional_conciseness/P3](../../packages/skills/definitions/modifiers/en/professional_conciseness.yaml#L80)     | REVISE     | WEAK       | HIGH       | A visible review request grounds follow-up but does not alone establish professional register. Supply an explicit work-chat preference in the proposed scenario.                                                                            |
| [en.professional_conciseness/N1](../../packages/skills/definitions/modifiers/en/professional_conciseness.yaml#L97)     | KEEP       | ACCEPTABLE | HIGH       | Korean primary excludes English-specific expression regardless of workplace assumptions. This shared gate remains a useful per-modifier regression, not independent semantic evidence.                                                      |
| [en.professional_conciseness/N2](../../packages/skills/definitions/modifiers/en/professional_conciseness.yaml#L114)    | KEEP       | ACCEPTABLE | HIGH       | Chinese-only context excludes this English modifier; no Chinese modifier is required without a chosen operation or register.                                                                                                                |
| [en.professional_conciseness/N3](../../packages/skills/definitions/modifiers/en/professional_conciseness.yaml#L131)    | KEEP       | STRONG     | HIGH       | NO_REPLY_NEEDED excludes every wording modifier even if professional English would otherwise match.                                                                                                                                         |
| [en.professional_conciseness/H1](../../packages/skills/definitions/modifiers/en/professional_conciseness.yaml#L148)    | REVISE     | STRONG     | HIGH       | Brief personal weekend planning supports casual rather than professional framing. Require the conversational modifier and retain the coordination job as compatible.                                                                        |
| [en.professional_conciseness/H2](../../packages/skills/definitions/modifiers/en/professional_conciseness.yaml#L163)    | REVISE     | STRONG     | HIGH       | The only register-relevant goal is clear refusal. Direct-but-polite is supported; professional style is not established by refusal alone.                                                                                                   |
| [en.professional_conciseness/A1](../../packages/skills/definitions/modifiers/en/professional_conciseness.yaml#L179)    | KEEP       | STRONG     | HIGH       | Removing take-this-opportunity filler preserves the single ready-draft fact and demonstrates a concrete reduction in work-chat verbosity.                                                                                                   |
| [en.professional_conciseness/A2](../../packages/skills/definitions/modifiers/en/professional_conciseness.yaml#L202)    | KEEP       | STRONG     | HIGH       | Could you retains the request's politeness and conditional form while removing hedging filler; no deadline or entitlement is added.                                                                                                         |
| [en.casual_naturalness/P1](../../packages/skills/definitions/modifiers/en/casual_naturalness.yaml#L42)                 | KEEP       | ACCEPTABLE | HIGH       | Friends coordinating lunch provides a natural conversational planning context; no slang or invented familiarity is needed.                                                                                                                  |
| [en.casual_naturalness/P2](../../packages/skills/definitions/modifiers/en/casual_naturalness.yaml#L59)                 | KEEP       | STRONG     | HIGH       | Informal invitation plus explicit acceptance grounds casual expression while protecting the user's yes.                                                                                                                                     |
| [en.casual_naturalness/P3](../../packages/skills/definitions/modifiers/en/casual_naturalness.yaml#L76)                 | REVISE     | WEAK       | HIGH       | An agreed weekend meeting does not itself establish casual register. Make the user preference observable rather than treating weekend as a style proxy.                                                                                     |
| [en.casual_naturalness/N1](../../packages/skills/definitions/modifiers/en/casual_naturalness.yaml#L93)                 | KEEP       | ACCEPTABLE | HIGH       | Korean primary excludes casual English conventions even when a future scenario might be informal; retain as a shared eligibility contrast.                                                                                                  |
| [en.casual_naturalness/N2](../../packages/skills/definitions/modifiers/en/casual_naturalness.yaml#L110)                | KEEP       | ACCEPTABLE | HIGH       | Chinese-only chat excludes the English modifier; brevity alone does not permit crossing the language gate.                                                                                                                                  |
| [en.casual_naturalness/N3](../../packages/skills/definitions/modifiers/en/casual_naturalness.yaml#L127)                | KEEP       | STRONG     | HIGH       | SUGGEST_ACTIONS precedes a chosen reply and is not a wording action. Casual style cannot generate a reply decision.                                                                                                                         |
| [en.casual_naturalness/H1](../../packages/skills/definitions/modifiers/en/casual_naturalness.yaml#L144)                | REVISE     | STRONG     | HIGH       | Professional progress reporting explicitly supplies the contrasting register and status job. Require professional conciseness rather than an optional hint.                                                                                 |
| [en.casual_naturalness/H2](../../packages/skills/definitions/modifiers/en/casual_naturalness.yaml#L159)                | REVISE     | ACCEPTABLE | MEDIUM     | The refusal needs clarity but no informal invitation or casual preference is supplied. Require direct refusal wording without assuming casual style; combined use needs its own context.                                                    |
| [en.casual_naturalness/A1](../../packages/skills/definitions/modifiers/en/casual_naturalness.yaml#L175)                | KEEP       | STRONG     | HIGH       | The 6 p.m. plan is confirmed, so see you at six preserves its commitment while removing unusually formal phrasing.                                                                                                                          |
| [en.casual_naturalness/A2](../../packages/skills/definitions/modifiers/en/casual_naturalness.yaml#L197)                | KEEP       | STRONG     | HIGH       | Does Saturday work keeps Saturday proposed and answerable; replacing agreeable changes register, not availability.                                                                                                                          |
| [en.direct_but_polite/P1](../../packages/skills/definitions/modifiers/en/direct_but_polite.yaml#L47)                   | KEEP       | ACCEPTABLE | HIGH       | A chosen English refusal is a valid directness use case; the modifier may clarify the no but does not make the decision.                                                                                                                    |
| [en.direct_but_polite/P2](../../packages/skills/definitions/modifiers/en/direct_but_polite.yaml#L64)                   | REVISE     | WEAK       | HIGH       | Already clear English request is tautological and shows no benefit. Add an explicit expression goal without changing the requested action.                                                                                                  |
| [en.direct_but_polite/P3](../../packages/skills/definitions/modifiers/en/direct_but_polite.yaml#L81)                   | KEEP       | STRONG     | HIGH       | Repeated pressure and a chosen English limit make clarity and respect jointly useful; politeness must not turn the limit into maybe.                                                                                                        |
| [en.direct_but_polite/N1](../../packages/skills/definitions/modifiers/en/direct_but_polite.yaml#L98)                   | KEEP       | ACCEPTABLE | HIGH       | Unsupported Korean primary excludes English expression rules; retain the shared gate but do not count it as independent evidence of directness quality.                                                                                     |
| [en.direct_but_polite/N2](../../packages/skills/definitions/modifiers/en/direct_but_polite.yaml#L115)                  | KEEP       | ACCEPTABLE | HIGH       | Chinese-only reply blocks the English modifier. No Chinese replacement is automatically selected without operation evidence.                                                                                                                |
| [en.direct_but_polite/N3](../../packages/skills/definitions/modifiers/en/direct_but_polite.yaml#L132)                  | KEEP       | STRONG     | HIGH       | Unknown accept/refuse choice leaves no fixed decision for directness to express; style cannot choose no.                                                                                                                                    |
| [en.direct_but_polite/H1](../../packages/skills/definitions/modifiers/en/direct_but_polite.yaml#L149)                  | REVISE     | WEAK       | HIGH       | A progress report without request or decision excludes this modifier, but does not alone establish professional register. Make the work-chat register explicit in the proposed contrast.                                                    |
| [en.direct_but_polite/H2](../../packages/skills/definitions/modifiers/en/direct_but_polite.yaml#L164)                  | REVISE     | STRONG     | HIGH       | Decline supplies the already chosen refusal and the English modifier can improve its expression. These are complementary levels, not competing jobs.                                                                                        |
| [en.direct_but_polite/A1](../../packages/skills/definitions/modifiers/en/direct_but_polite.yaml#L180)                  | REVISE     | INVALID    | HIGH       | Will not take the task does not establish cannot take it. Respectful wording must preserve choice rather than fabricate inability.                                                                                                          |
| [en.direct_but_polite/A2](../../packages/skills/definitions/modifiers/en/direct_but_polite.yaml#L201)                  | KEEP       | STRONG     | HIGH       | Please modifies the English imperative's politeness while preserving the same file request and adding no condition or deadline.                                                                                                             |
| [zh.politeness_calibration/P1](../../packages/skills/definitions/modifiers/zh/politeness_calibration.yaml#L44)         | KEEP       | ACCEPTABLE | HIGH       | A chosen Simplified Chinese document request supports proportionate politeness; the modifier cannot add a deadline or assume a cultural preference.                                                                                         |
| [zh.politeness_calibration/P2](../../packages/skills/definitions/modifiers/zh/politeness_calibration.yaml#L61)         | KEEP       | STRONG     | HIGH       | A Traditional Chinese refusal provides a clear test of politeness without erasing the no or inventing a reason.                                                                                                                             |
| [zh.politeness_calibration/P3](../../packages/skills/definitions/modifiers/zh/politeness_calibration.yaml#L78)         | KEEP       | STRONG     | HIGH       | A chosen boundary under pressure tests whether Chinese politeness preserves firmness; no ethnicity-based deference rule is needed.                                                                                                          |
| [zh.politeness_calibration/N1](../../packages/skills/definitions/modifiers/zh/politeness_calibration.yaml#L95)         | KEEP       | ACCEPTABLE | HIGH       | English-only chat excludes the Chinese modifier. Shared language-gate context is useful across different modifier identities but counts as one dependent scenario.                                                                          |
| [zh.politeness_calibration/N2](../../packages/skills/definitions/modifiers/zh/politeness_calibration.yaml#L112)        | KEEP       | STRONG     | HIGH       | Korean primary stays unsupported despite Chinese secondary and switching true; a secondary term cannot grant Chinese-style eligibility.                                                                                                     |
| [zh.politeness_calibration/N3](../../packages/skills/definitions/modifiers/zh/politeness_calibration.yaml#L129)        | KEEP       | STRONG     | HIGH       | The coach's ASK_CLARIFICATION action is outside wording guidance, even in Chinese. All skill selection remains NONE.                                                                                                                        |
| [zh.politeness_calibration/H1](../../packages/skills/definitions/modifiers/zh/politeness_calibration.yaml#L146)        | REVISE     | WEAK       | HIGH       | Progress alone does not imply professional register. Supply an explicit work-chat preference and require the matching modifier rather than inferring formality from Chinese.                                                                |
| [zh.politeness_calibration/H2](../../packages/skills/definitions/modifiers/zh/politeness_calibration.yaml#L161)        | REVISE     | STRONG     | HIGH       | Decline expresses the chosen no; Chinese politeness can shape that same refusal. They are complementary and neither authorizes an invented excuse.                                                                                          |
| [zh.politeness_calibration/A1](../../packages/skills/definitions/modifiers/zh/politeness_calibration.yaml#L177)        | KEEP       | STRONG     | HIGH       | Adding 请 and explicit recipient 我 gives ordinary request politeness while preserving the same file transfer and no new obligation.                                                                                                        |
| [zh.politeness_calibration/A2](../../packages/skills/definitions/modifiers/zh/politeness_calibration.yaml#L198)        | KEEP       | STRONG     | HIGH       | The invitation is supplied by explicit user intent and Traditional script is a stated target. 謝謝邀請 adds conventional courtesy while 我不去了 preserves refusal without a reason.                                                        |
| [zh.professional_formality/P1](../../packages/skills/definitions/modifiers/zh/professional_formality.yaml#L45)         | REVISE     | WEAK       | HIGH       | Draft progress and Simplified script do not establish a professional-register need. Add an observable work-chat preference rather than equating Chinese reporting with formality.                                                           |
| [zh.professional_formality/P2](../../packages/skills/definitions/modifiers/zh/professional_formality.yaml#L62)         | REVISE     | WEAK       | HIGH       | A missed commitment can be personal or professional. Keep Traditional script but explicitly ground register, without inventing a cause or new date.                                                                                         |
| [zh.professional_formality/P3](../../packages/skills/definitions/modifiers/zh/professional_formality.yaml#L79)         | KEEP       | ACCEPTABLE | HIGH       | Visible work-review follow-up supplies professional context and a concrete operation. Professional concision should not imply blame for delay.                                                                                              |
| [zh.professional_formality/N1](../../packages/skills/definitions/modifiers/zh/professional_formality.yaml#L96)         | KEEP       | ACCEPTABLE | HIGH       | English-only chat blocks professional Chinese wording even if the user later mentions work; keep the useful per-definition language gate.                                                                                                   |
| [zh.professional_formality/N2](../../packages/skills/definitions/modifiers/zh/professional_formality.yaml#L113)        | KEEP       | ACCEPTABLE | HIGH       | Korean primary excludes this Chinese modifier. The duplicate language scenario provides shared eligibility coverage, not another independent quality trial.                                                                                 |
| [zh.professional_formality/N3](../../packages/skills/definitions/modifiers/zh/professional_formality.yaml#L130)        | KEEP       | STRONG     | HIGH       | NO_REPLY_NEEDED has no wording stage; professional polish must not create a message or activate any skill.                                                                                                                                  |
| [zh.professional_formality/H1](../../packages/skills/definitions/modifiers/zh/professional_formality.yaml#L147)        | REVISE     | STRONG     | HIGH       | Explicitly casual weekend planning supports natural Chinese concision, not work-report framing. Keep planning as compatible underlying function.                                                                                            |
| [zh.professional_formality/H2](../../packages/skills/definitions/modifiers/zh/professional_formality.yaml#L162)        | REVISE     | WEAK       | HIGH       | Request-or-refusal is two different chosen actions, not one clear case. Use a concrete request to contrast politeness with unsupported professional status framing.                                                                         |
| [zh.professional_formality/A1](../../packages/skills/definitions/modifiers/zh/professional_formality.yaml#L178)        | KEEP       | STRONG     | HIGH       | Removing 关于…目前的情况呢就是 retains completion of the first draft, not the entire report, and demonstrates concise Chinese status wording.                                                                                               |
| [zh.professional_formality/A2](../../packages/skills/definitions/modifiers/zh/professional_formality.yaml#L199)        | KEEP       | ACCEPTABLE | MEDIUM     | 預計 plus 但還不確定 expresses the same tentative tomorrow estimate while removing stacked hedges. Exact stylistic preference may vary, but no promise or new date is introduced.                                                           |
| [zh.natural_conciseness/P1](../../packages/skills/definitions/modifiers/zh/natural_conciseness.yaml#L43)               | KEEP       | ACCEPTABLE | HIGH       | Friend planning in Simplified Chinese supports ordinary concise chat wording without inventing familiarity or specific logistics.                                                                                                           |
| [zh.natural_conciseness/P2](../../packages/skills/definitions/modifiers/zh/natural_conciseness.yaml#L60)               | REVISE     | WEAK       | HIGH       | Respond to an invitation leaves the actual reply choice unspecified. A positive should hold that choice fixed before demonstrating concise expression.                                                                                      |
| [zh.natural_conciseness/P3](../../packages/skills/definitions/modifiers/zh/natural_conciseness.yaml#L77)               | KEEP       | STRONG     | HIGH       | Redundant Chinese request wording and an explicit concision goal provide a concrete expression problem; removing repetition must retain the requested action.                                                                               |
| [zh.natural_conciseness/N1](../../packages/skills/definitions/modifiers/zh/natural_conciseness.yaml#L94)               | KEEP       | ACCEPTABLE | HIGH       | English-only context blocks this Chinese convention; natural brevity in general is not evidence for a Chinese-specific modifier.                                                                                                            |
| [zh.natural_conciseness/N2](../../packages/skills/definitions/modifiers/zh/natural_conciseness.yaml#L111)              | KEEP       | ACCEPTABLE | HIGH       | Unsupported Korean primary keeps this modifier ineligible. Retain as a shared language-gate check rather than count it as independent evidence.                                                                                             |
| [zh.natural_conciseness/N3](../../packages/skills/definitions/modifiers/zh/natural_conciseness.yaml#L128)              | KEEP       | STRONG     | HIGH       | NO_REPLY_NEEDED excludes wording assistance. Concision must not manufacture a short reply when the fixed action is no reply.                                                                                                                |
| [zh.natural_conciseness/H1](../../packages/skills/definitions/modifiers/zh/natural_conciseness.yaml#L145)              | REVISE     | STRONG     | HIGH       | Formal work progress explicitly grounds professional Chinese register, unlike generic short chat. Require professional formality and keep the reporting job compatible.                                                                     |
| [zh.natural_conciseness/H2](../../packages/skills/definitions/modifiers/zh/natural_conciseness.yaml#L160)              | REVISE     | WEAK       | HIGH       | Mixed terms support preservation but do not establish a concision need. Add an explicit verbose request using a supplied term so both modifiers have independently visible work.                                                            |
| [zh.natural_conciseness/A1](../../packages/skills/definitions/modifiers/zh/natural_conciseness.yaml#L176)              | KEEP       | STRONG     | HIGH       | The Saturday meeting is already agreed. 那就周六见 removes repetition while preserving the plan and conversational register.                                                                                                                |
| [zh.natural_conciseness/A2](../../packages/skills/definitions/modifiers/zh/natural_conciseness.yaml#L198)              | KEEP       | STRONG     | HIGH       | 請問是幾點 retains the single unknown time and polite inquiry, without turning the question into a chosen time or new invitation.                                                                                                           |
| [zh.code_switching/P1](../../packages/skills/definitions/modifiers/zh/code_switching.yaml#L44)                         | KEEP       | STRONG     | HIGH       | Chinese-primary status with intentionally retained PR supports term preservation; the modifier must not translate the identifier or add jargon.                                                                                             |
| [zh.code_switching/P2](../../packages/skills/definitions/modifiers/zh/code_switching.yaml#L61)                         | KEEP       | STRONG     | HIGH       | The visible Chinese planning chat already uses demo. Keeping that term preserves local expression while logistics remain grounded separately.                                                                                               |
| [zh.code_switching/P3](../../packages/skills/definitions/modifiers/zh/code_switching.yaml#L78)                         | KEEP       | STRONG     | HIGH       | The request already contains design review in supported mixed Chinese, so preserving it is expression work rather than inventing a new task.                                                                                                |
| [zh.code_switching/N1](../../packages/skills/definitions/modifiers/zh/code_switching.yaml#L95)                         | KEEP       | STRONG     | HIGH       | Pure Chinese with no intentional English terms provides nothing to preserve by code-switching. Do not add jargon to create eligibility.                                                                                                     |
| [zh.code_switching/N2](../../packages/skills/definitions/modifiers/zh/code_switching.yaml#L112)                        | KEEP       | STRONG     | HIGH       | English-only, switching-false content is not Chinese code-switching. English modifiers also need their own operation/context rather than automatic selection.                                                                               |
| [zh.code_switching/N3](../../packages/skills/definitions/modifiers/zh/code_switching.yaml#L129)                        | KEEP       | STRONG     | HIGH       | Korean primary remains unsupported even with Chinese secondary and switching true. This specifically tests precedence of the primary-language gate.                                                                                         |
| [zh.code_switching/H1](../../packages/skills/definitions/modifiers/zh/code_switching.yaml#L146)                        | REVISE     | WEAK       | HIGH       | Already short natural Chinese does not demonstrate a need for further concision. Use a verbose purely Chinese planning restatement to make the neighbor useful.                                                                             |
| [zh.code_switching/H2](../../packages/skills/definitions/modifiers/zh/code_switching.yaml#L161)                        | REVISE     | STRONG     | HIGH       | Preserving a quoted identifier is a general fidelity obligation even in Korean. No Chinese-specific skill is needed or eligible; encode the exclusion explicitly.                                                                           |
| [zh.code_switching/A1](../../packages/skills/definitions/modifiers/zh/code_switching.yaml#L181)                        | KEEP       | STRONG     | HIGH       | PR is preserved, 看过 retains completed review, and 没发现问题 reports findings rather than claiming the code is flawless.                                                                                                                  |
| [zh.code_switching/A2](../../packages/skills/definitions/modifiers/zh/code_switching.yaml#L203)                        | KEEP       | STRONG     | HIGH       | The existing demo term and unconfirmed time survive shortening; omitting 我們的 in this context does not create ownership or a confirmed appointment.                                                                                       |

## Verification and completion

The semantic review task is complete when the artifact integrity and unchanged-source checks below pass. This closes the requested Codex review deliverable, not human approval, candidate evaluation or the whole Phase 8 study.

All final commands below ran in the skills worktree on 2026-09-19 and exited 0.

| Exact command                                                                                                                                                                                                                                                               | Result                                                                                                                                                                            |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm exec prettier --write packages/skills/tests/fixtures/phase8/codex-semantic-review.json`                                                                                                                                                                               | Formatted only the new semantic ledger                                                                                                                                            |
| `pnpm exec prettier --write --ignore-path .gitignore docs/skills/phase-8-codex-semantic-review.md docs/skills/phase-8-example-review.md docs/skills/phase-8-calibration-packet.md docs/skills/phase-8-mode-coverage.md .agent/plans/skills-phase-8-candidate-evaluation.md` | Formatted the report and scoped policy notices                                                                                                                                    |
| `pnpm format:check`                                                                                                                                                                                                                                                         | Passed                                                                                                                                                                            |
| `pnpm lint`                                                                                                                                                                                                                                                                 | Passed; includes fresh-registry validation                                                                                                                                        |
| `pnpm typecheck`                                                                                                                                                                                                                                                            | All workspace and private authoring/test checks passed                                                                                                                            |
| `pnpm test`                                                                                                                                                                                                                                                                 | **28 files / 377 tests passed**; no new test module added                                                                                                                         |
| `pnpm build`                                                                                                                                                                                                                                                                | All workspace packages/apps built                                                                                                                                                 |
| `pnpm skills:verify-production`                                                                                                                                                                                                                                             | **21 exact definitions / 153 ordered plans**, exports, deep freezing and authoring exclusion passed                                                                               |
| `pnpm eval:phase4`                                                                                                                                                                                                                                                          | **21/21** deterministic scenarios, action preservation and no-invention checks passed; no live flag                                                                               |
| `git -c core.safecrlf=false diff --check`                                                                                                                                                                                                                                   | Passed                                                                                                                                                                            |
| Inline Node audit below                                                                                                                                                                                                                                                     | All 210 rows, 71 revisions, 63 negatives, 42 neighbors, 21 boundaries, 13 pair patterns, source/revision hashes, audit sample, document counts/links and unchanged runtime passed |

The source audit compared all **170 pre-existing non-ignored files** captured before this semantic-review increment: **166 were byte-identical**, with exactly four existing review/plan documents changed for supersession/delivery notes. Exactly two files were added: this report and the semantic JSON ledger. No source, schema, YAML, generated registry, old fixture or approval fingerprint changed; no staged changes. The 21 runtime definitions still have exact baseline parity.

These deterministic gates verify integrity and preservation, not the truth of every semantic judgment. The ledger is not imported by production or by the pending-only preparation helper. No canonical approval state changed.

The supervising review caught a pipe-escaping defect in the generated Markdown decision index. It was repaired without changing any semantic decision. The final audit additionally requires exactly five cells per original-example row and exact displayed decision/quality/confidence/rationale equality with the ledger. An initial document-format check failed during this repair; the final targeted check is the delivery result.

### Reproduce the read-only artifact audit

Run from the skills worktree. This inline check is documentation, not a new production module, command or automatic approval operation.

```powershell
$semanticVerify = @'
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {loadAuthoringRegistry,contentDigest,renderRegistry} from './packages/skills/authoring/generator.ts';
import {AuthoringRecordSchema} from './packages/skills/authoring/schema.ts';
const d=JSON.parse(await readFile('packages/skills/tests/fixtures/phase8/codex-semantic-review.json','utf8'));
const {records,registry}=await loadAuthoringRegistry();
const ids=new Set(records.map(r=>r.definition.id));
const all=records.flatMap(r=>[...r.examples.selection,...r.examples.application].map(e=>({record:r,example:e,key:r.definition.id+'/'+e.id})));
assert.equal(d.rows.length,210);assert.equal(new Set(d.rows.map(r=>r.key)).size,210);
assert.deepEqual(d.rows.map(r=>r.key).sort(),all.map(r=>r.key).sort());
const issues=new Set(['UNSUPPORTED_FACT','UNSUPPORTED_COMMITMENT','UNSUPPORTED_CERTAINTY','FALSE_RESPONSIBILITY','INTENT_DRIFT','WRONG_SKILL','NEIGHBOR_AMBIGUITY','WEAK_POSITIVE','WEAK_NEGATIVE','BAD_NONE_ASSUMPTION','DUPLICATE_LOW_VALUE','STYLE_MISMATCH','LANGUAGE_NUANCE','SKILL_BOUNDARY_ISSUE','CANDIDATE_MAY_BE_REDUNDANT','PROVENANCE_EXPANSION']);
const decisions={},quality={},confidence={};let revised=0,negative=0,neighbor=0;
for(const row of d.rows){
 const item=all.find(x=>x.key===row.key),record=item.record,example=item.example;
 assert.equal(row.skillId,record.definition.id);assert.equal(row.category,example.category);assert.deepEqual(row.originalExample,example);
 assert.equal(row.source.exampleDigest,contentDigest(example));assert.equal(row.source.definitionDigest,contentDigest(record.definition));assert.equal(row.source.recordDigest,contentDigest(record));
 assert.equal(row.source.reviewContextDigest,contentDigest({definition:record.definition,neighbors:record.neighbors,conceptualNotes:record.conceptualNotes}));
 assert.equal(createHash('sha256').update(await readFile(row.source.path)).digest('hex'),row.source.rawSha256);
 const lines=(await readFile(row.source.path,'utf8')).split(/\r?\n/u);assert.equal(lines[row.source.line-1].trim().replace(/^-\s+/u,''),'id: '+example.id);
 assert.equal(row.reviewerType,'CODEX_SEMANTIC_REVIEW');assert.equal(row.humanApproval,false);
 assert.ok(['KEEP','REVISE','REJECT','QUARANTINE'].includes(row.decision));assert.ok(['STRONG','ACCEPTABLE','WEAK','INVALID'].includes(row.quality));assert.ok(['HIGH','MEDIUM','LOW'].includes(row.confidence));
 for(const field of ['boundaryValid','intentPreserved','factsGrounded','commitmentsPreserved','certaintyPreserved'])assert.equal(typeof row[field],'boolean');
 assert.ok(row.rationale.length>45);assert.ok(row.issueCodes.every(i=>issues.has(i)));
 assert.ok(['FOCAL_ONLY','NEIGHBOR_ONLY','BOTH_VALID','NEITHER','CONTEXT_INSUFFICIENT'].includes(row.neighborDecision.classification));
 for(const field of ['required','acceptable','forbidden'])assert.ok(row.neighborDecision[field].every(id=>ids.has(id)));
 for(const id of row.neighborDecision.required){assert.ok(!row.neighborDecision.forbidden.includes(id));assert.ok(!row.neighborDecision.acceptable.includes(id));}
 if(row.confidence==='LOW')assert.equal(row.decision,'QUARANTINE');
 if(row.decision==='QUARANTINE'||row.issueCodes.some(i=>['SKILL_BOUNDARY_ISSUE','INTENT_DRIFT','UNSUPPORTED_FACT','UNSUPPORTED_COMMITMENT','UNSUPPORTED_CERTAINTY','FALSE_RESPONSIBILITY'].includes(i)))assert.equal(row.humanEscalation.required,true);
 if(row.category==='NEGATIVE'){negative++;assert.ok(['REQUIRED','ACCEPTABLE','NONE'].includes(row.otherSkills.state));assert.equal(row.skillRelevance.focalSkill,'DO_NOT_SELECT');assert.ok(row.neighborDecision.forbidden.includes(row.skillId));}
 if(row.category==='NEIGHBOR')neighbor++;
 if(row.decision==='REVISE'){
  revised++;const p=row.proposedRevision;assert.ok(p&&Object.keys(p.changes).length);assert.equal(p.status,'PROPOSED_NOT_APPLIED_NOT_APPROVED');
  assert.equal(p.replacesExampleDigest,contentDigest(example));assert.equal(p.proposedExampleDigest,contentDigest(p.example));assert.deepEqual(p.example,{...example,...p.changes});assert.equal(p.example.sourceText,example.sourceText);
  const copy=structuredClone(record),group=example.category==='APPLICATION'?'application':'selection';copy.examples[group]=copy.examples[group].map(e=>e.id===example.id?p.example:e);AuthoringRecordSchema.parse(copy);
 }else assert.equal(row.proposedRevision,null);
 decisions[row.decision]=(decisions[row.decision]||0)+1;quality[row.quality]=(quality[row.quality]||0)+1;confidence[row.confidence]=(confidence[row.confidence]||0)+1;
}
assert.equal(negative,63);assert.equal(neighbor,42);assert.equal(revised,71);
assert.deepEqual(decisions,d.counts.decisions);assert.deepEqual(quality,d.counts.quality);assert.deepEqual(confidence,d.counts.confidence);
assert.equal(d.boundaries.length,21);assert.deepEqual(d.boundaries.map(b=>b.skillId).sort(),[...ids].sort());assert.equal(d.neighborPatterns.length,13);
for(const p of d.neighborPatterns)for(const field of ['aJob','bJob','aOnly','bOnly','bothValid','neitherValid'])assert.ok(p[field].length>10);
const clean=d.rows.filter(r=>r.decision==='KEEP'&&!r.issueCodes.length&&!r.humanEscalation.required).map(r=>r.key).sort();
assert.deepEqual(d.audit.poolKeys,clean);assert.equal(d.audit.selectedKeys.length,20);assert.equal(new Set(d.audit.selectedKeys).size,20);assert.ok(20/clean.length>=0.1&&20/clean.length<=0.2);
for(const s of d.audit.strata){const sorted=[...s.poolKeys].sort((a,b)=>contentDigest(d.audit.seed+'\n'+a).localeCompare(contentDigest(d.audit.seed+'\n'+b)));assert.deepEqual(s.selectedKeys,sorted.slice(0,s.allocation));for(const key of s.selectedKeys)assert.ok(clean.includes(key));}
assert.deepEqual(d.audit.selectedKeys,d.audit.strata.flatMap(s=>s.selectedKeys));assert.equal(d.rows.filter(r=>r.humanEscalation.required).length,17);
const report=await readFile('docs/skills/phase-8-codex-semantic-review.md','utf8');
assert.equal((report.split('## Exact proposed revisions')[1].split('## Human escalation list')[0].match(/^### /gm)||[]).length,71);
const revisionBlocks=report.split('## Exact proposed revisions')[1].split('## Human escalation list')[0].split(/^### /m).slice(1);
for(const block of revisionBlocks){const key=block.split('\n')[0].trim();const fence=String.fromCharCode(96).repeat(3);const match=block.match(new RegExp(fence+'json\\n([\\s\\S]*?)\\n'+fence));assert.ok(match,key);assert.deepEqual(JSON.parse(match[1]),d.rows.find(r=>r.key===key).proposedRevision.changes,key);}
for(const row of d.rows){const n=row.neighborDecision;if(n.classification==='CONTEXT_INSUFFICIENT')continue;const focal=n.required.includes(row.skillId)||n.acceptable.includes(row.skillId),other=[...n.required,...n.acceptable].some(id=>id!==row.skillId);assert.equal(n.classification,focal?(other?'BOTH_VALID':'FOCAL_ONLY'):(other?'NEIGHBOR_ONLY':'NEITHER'),row.key);}
const index=report.split('## Complete original-example decision index')[1].split('## Verification and completion')[0];assert.equal(index.split('\n').filter(l=>/^\| \[/.test(l)).length,210);
for(const line of index.split('\n').filter(l=>/^\| \[/.test(l))){const cells=line.split(/(?<!\\)\|/u).slice(1,-1).map(s=>s.trim());assert.equal(cells.length,5);const key=cells[0].match(/^\[([^\]]+)\]/u)[1],row=d.rows.find(r=>r.key===key);assert.equal(cells[1],row.decision);assert.equal(cells[2],row.quality);assert.equal(cells[3],row.confidence);assert.equal(cells[4].split('\\|').join('|'),row.rationale);}
for(const file of ['docs/skills/phase-8-codex-semantic-review.md','docs/skills/phase-8-example-review.md','docs/skills/phase-8-calibration-packet.md','docs/skills/phase-8-mode-coverage.md','.agent/plans/skills-phase-8-candidate-evaluation.md']){
 const text=await readFile(file,'utf8');assert.equal((text.match(new RegExp('^'+String.fromCharCode(96).repeat(3),'gm'))||[]).length%2,0);
 for(const match of text.matchAll(/\]\(([^)]+)\)/g)){const target=match[1].split('#')[0];if(!target||/^(https?:|[A-Z]:)/i.test(target))continue;await readFile(resolve(dirname(file),target));}
}
const allowed=new Set(['.agent/plans/skills-phase-8-candidate-evaluation.md','docs/skills/phase-8-example-review.md','docs/skills/phase-8-calibration-packet.md','docs/skills/phase-8-mode-coverage.md']),changed=[];
for(const [file,hash] of Object.entries(d.startingFiles))if(createHash('sha256').update(await readFile(file)).digest('hex')!==hash){assert.ok(allowed.has(file),'Unexpected modification: '+file);changed.push(file);}
assert.equal(changed.length,4);assert.equal(await renderRegistry(),await readFile('packages/skills/src/generated/approved-registry.ts','utf8'));
const baseline=JSON.parse(await readFile('packages/skills/tests/fixtures/phase8/source-snapshot.json','utf8'));assert.equal(contentDigest(registry),baseline.runtimeRegistryDigest);
const current=[...new Set(execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(Boolean))],added=current.filter(p=>!Object.hasOwn(d.startingFiles,p)).sort();
assert.deepEqual(added,['docs/skills/phase-8-codex-semantic-review.md','packages/skills/tests/fixtures/phase8/codex-semantic-review.json']);assert.equal(execFileSync('git',['diff','--cached','--name-only'],{encoding:'utf8'}).trim(),'');
console.log(JSON.stringify({reviewed:210,decisions,quality,confidence,proposedRevisions:revised,negativeDecisions:negative,neighborDecisions:neighbor,boundaries:21,pairMatrices:13,humanEscalations:17,audit:20,originalFiles:Object.keys(d.startingFiles).length,unchangedFiles:Object.keys(d.startingFiles).length-changed.length,changed,added,runtimeParity:true,stagedChanges:false},null,2));
'@
$semanticVerify | node --conditions=development --import tsx --input-type=module
```

### Acceptance status

- All 210 individually judged: complete.
- Every REVISE has exact full replacement and original/proposed binding: complete.
- All 21 boundaries, required neighbor patterns, modifier distinctions, duplicates, candidate overlap and mode recommendations: complete.
- Focused human escalation/audit: selected and documented; actual human decisions remain unperformed.
- Runtime, YAML, schemas and historical evidence unchanged: verified.
- Candidate selection/uplift, provider execution and publication: not performed or authorized.

Limitations: one Codex first pass is not native-speaker preference consensus or empirical generation quality. Proposed contexts/labels remain authoring material, not executable current-router gold or independent holdout. Seventeen escalations and the 20-case audit remain human work. The next action is that focused review or a separately authorized adoption task. **Stop here: no 8B, candidate activation, routing change or uplift evaluation.**
