# Phase 8A draft and empty-draft coverage proposal

**Policy update (2026-09-19):** The user's full Codex semantic-review task supersedes this preparation document's requirement for manual review of every example. See [the semantic review](phase-8-codex-semantic-review.md) for actual Codex decisions, exact proposed revisions and focused human escalation/audit. This document remains the historical preparation record; pending human fields do not mean the later Codex review is unperformed. Runtime/YAML approvals remain unchanged.

Status: proposed, unexecuted, unreviewed. Updated: 2026-09-19.

[Master review](phase-8-example-review.md) · [Machine packet](../../packages/skills/tests/fixtures/phase8/mode-coverage-proposals.json).

Eleven semantic families produce **22 correlated proposed variants** and **11 separate information-loss controls**. Eight families refer to existing skills; three refer to candidate hypotheses only. Each rewrite uses a complete synthetic draft. Its empty-draft counterpart retains the same visible evidence plus an explicit synthetic user choice. Focal IDs, modifier hypotheses and ledgers are oracle metadata, not application input. No skill tags are injected.

The unchanged Phase 3 action gate owns the actual action. Proposed REWRITE_DRAFT/SUGGEST_REPLY values are expectations for review, not observed results; all observed actions and human decisions remain null. Information-loss controls are descriptions to be turned into separate raw inputs after authorization, not executed cases. Removing the only fact or choice does not justify preserving the old action.

These exposed planning seeds cannot become held-out evidence. Already-polished drafts can test preservation and selection; later uplift needs fresh, representative drafts and independently reviewed outputs. No candidate dossier, candidate catalog, routing repair, provider call or uplift study is implemented here.

## apology

References: `apology/P1`, `apology/A1`. Language: English. Focal expectation: `apology`. Optional modifier hypotheses: `en.professional_conciseness`.

**Evidence to verify in both modes**

- User forgot the promised attachment.

**Shared visible messages**

- OTHER: The attachment was missing.
- USER: I forgot the promised attachment.

**Rewrite variant**

Draft: I'm sorry I forgot the attachment.

Selection: null. Proposed action: REWRITE_DRAFT. Observed action: null.

**Empty-draft variant**

Draft: null. Explicit synthetic user choice: Apologize for forgetting the promised attachment; do not add an excuse or repair promise.

Proposed action: SUGGEST_REPLY. Observed action: null.

**Separate information-loss control**

Remove the draft and apology selection, retaining only the missing attachment report. Do not infer that the user chose regret or committed to resending.

Let the unchanged Phase 3 policy decide; do not force SUGGEST_REPLY or preserve a focal skill when its only support was removed. Observed action: null.

**Coverage gap:** No paired raw empty-draft input or measured generation result. An explicit selection can supply apology intent, but lexical/context eligibility must later be measured.

**Human decision / reviewer:** null / unassigned.

## emotional_validation

References: `emotional_validation/P1`, `emotional_validation/A1`. Language: English. Focal expectation: `emotional_validation`. Optional modifier hypotheses: none.

**Evidence to verify in both modes**

- Other person explicitly states sadness after not getting the role.

**Shared visible messages**

- OTHER: I'm sad that I didn't get the role.

**Rewrite variant**

Draft: That sounds sad and disappointing.

Selection: null. Proposed action: REWRITE_DRAFT. Observed action: null.

**Empty-draft variant**

Draft: null. Explicit synthetic user choice: Acknowledge the sadness they explicitly expressed without advice or predictions.

Proposed action: SUGGEST_REPLY. Observed action: null.

**Separate information-loss control**

Remove the user's draft/selection. Visible sadness supports a possible response, but does not authorize invented shared experience, responsibility or advice.

Let the unchanged Phase 3 policy decide; do not force SUGGEST_REPLY or preserve a focal skill when its only support was removed. Observed action: null.

**Coverage gap:** Canonical feeling cases do not establish both-mode usefulness or avoid deriving an unspoken interpretation.

**Human decision / reviewer:** null / unassigned.

## boundary_setting

References: `boundary_setting/P2`, `boundary_setting/A2`. Language: English. Focal expectation: `boundary_setting`. Optional modifier hypotheses: `en.direct_but_polite`.

**Evidence to verify in both modes**

- Repeated lending request is visible.
- User has chosen not to lend more.

**Shared visible messages**

- OTHER: I'm asking again: please lend me money.
- USER: I have decided not to lend any more money.

**Rewrite variant**

Draft: I won't lend you any more money. Please stop asking.

Selection: null. Proposed action: REWRITE_DRAFT. Observed action: null.

**Empty-draft variant**

Draft: null. Explicit synthetic user choice: State my chosen no-more-lending limit and ask them to stop asking; do not claim I lack the means.

Proposed action: SUGGEST_REPLY. Observed action: null.

**Separate information-loss control**

Remove both user-owned choice and selection, leaving the request alone. Do not invent refusal or inability.

Let the unchanged Phase 3 policy decide; do not force SUGGEST_REPLY or preserve a focal skill when its only support was removed. Observed action: null.

**Coverage gap:** Current A2 has a choice/inability review flag; both-mode inputs must retain the actual choice.

**Human decision / reviewer:** null / unassigned.

## decline

References: `decline/P1`, `decline/A1`. Language: English. Focal expectation: `decline`. Optional modifier hypotheses: `en.direct_but_polite`, `en.casual_naturalness`.

**Evidence to verify in both modes**

- An invitation is visible.
- User has chosen not to attend.

**Shared visible messages**

- OTHER: Would you like to join us tonight?
- USER: I have decided not to attend.

**Rewrite variant**

Draft: Thanks for inviting me, but I won't attend.

Selection: null. Proposed action: REWRITE_DRAFT. Observed action: null.

**Empty-draft variant**

Draft: null. Explicit synthetic user choice: Decline the invitation without inventing a reason or future commitment.

Proposed action: SUGGEST_REPLY. Observed action: null.

**Separate information-loss control**

Remove the only user choice, draft and selection. Invitation remains; choices are appropriate, not a forced refusal or acceptance.

Let the unchanged Phase 3 policy decide; do not force SUGGEST_REPLY or preserve a focal skill when its only support was removed. Observed action: null.

**Coverage gap:** Existing rewrite and chosen-decline regressions are useful historical coverage; a reviewed matched pair and within-mode uplift are still absent.

**Human decision / reviewer:** null / unassigned.

## request

References: `request/P1`, `request/A1`. Language: English. Focal expectation: `request`. Optional modifier hypotheses: `en.professional_conciseness`, `en.direct_but_polite`.

**Evidence to verify in both modes**

- User wants the agenda.
- No deadline is supplied.

**Shared visible messages**

- OTHER: We are preparing for the meeting.
- USER: I need the agenda and want to ask for it.

**Rewrite variant**

Draft: Could you send me the agenda?

Selection: null. Proposed action: REWRITE_DRAFT. Observed action: null.

**Empty-draft variant**

Draft: null. Explicit synthetic user choice: Could you send me the agenda? Ask for that file without adding a deadline.

Proposed action: SUGGEST_REPLY. Observed action: null.

**Separate information-loss control**

Remove the draft and user-owned request/selection. Meeting preparation alone does not establish a request, recipient obligation or deadline.

Let the unchanged Phase 3 policy decide; do not force SUGGEST_REPLY or preserve a focal skill when its only support was removed. Observed action: null.

**Coverage gap:** Source audit: make_request tests only analysis.draft.text. Empty-draft selected intent is not checked by that predicate. This is an existing extraction hypothesis, not a new capability or authorized repair.

**Human decision / reviewer:** null / unassigned.

## status_update

References: `status_update/P1`, `status_update/A1`. Language: English. Focal expectation: `status_update`. Optional modifier hypotheses: `en.professional_conciseness`.

**Evidence to verify in both modes**

- Draft complete.
- Review not started.

**Shared visible messages**

- OTHER: Any progress update?
- USER: The draft is complete. Review has not started.

**Rewrite variant**

Draft: The draft is complete; review hasn't started.

Selection: null. Proposed action: REWRITE_DRAFT. Observed action: null.

**Empty-draft variant**

Draft: null. Explicit synthetic user choice: Report the completed draft and pending review using only the visible facts.

Proposed action: SUGGEST_REPLY. Observed action: null.

**Separate information-loss control**

Remove the user's factual status, draft and selection. A progress request alone cannot supply progress facts.

Let the unchanged Phase 3 policy decide; do not force SUGGEST_REPLY or preserve a focal skill when its only support was removed. Observed action: null.

**Coverage gap:** Existing status-request cases cover some raw routing; no blinded paired-mode quality result or independently reviewed equivalent pair exists.

**Human decision / reviewer:** null / unassigned.

## expectation_setting

References: `expectation_setting/P1`, `expectation_setting/A1`. Language: English. Focal expectation: `expectation_setting`. Optional modifier hypotheses: `en.professional_conciseness`.

**Evidence to verify in both modes**

- User estimates probably tomorrow.
- Estimate remains uncertain.

**Shared visible messages**

- OTHER: When will the draft be ready?
- USER: I think it will probably be ready tomorrow, but I am not certain.

**Rewrite variant**

Draft: The draft will probably be ready tomorrow, but I'm not certain.

Selection: null. Proposed action: REWRITE_DRAFT. Observed action: null.

**Empty-draft variant**

Draft: null. Explicit synthetic user choice: Communicate that the draft will probably be ready tomorrow, retaining uncertainty.

Proposed action: SUGGEST_REPLY. Observed action: null.

**Separate information-loss control**

Remove the estimate-bearing draft and user statement/selection. A timing question cannot create a tomorrow estimate.

Let the unchanged Phase 3 policy decide; do not force SUGGEST_REPLY or preserve a focal skill when its only support was removed. Observed action: null.

**Coverage gap:** Timing evidence must survive outside the draft. Later test whether selected intent plus visible status evidence yields set_expectation in both modes without certainty hardening.

**Human decision / reviewer:** null / unassigned.

## clarification

References: `clarification/P1`, `clarification/A1`. Language: English. Focal expectation: `clarification`. Optional modifier hypotheses: `en.professional_conciseness`, `en.direct_but_polite`.

**Evidence to verify in both modes**

- Sales and budget reports are independently named in user-owned context.
- Intended report is unknown.

**Shared visible messages**

- OTHER: Please send the report.
- USER: I have a sales report and a budget report, and I do not know which one you mean.

**Rewrite variant**

Draft: Do you mean the sales report or the budget report?

Selection: null. Proposed action: REWRITE_DRAFT. Observed action: null.

**Empty-draft variant**

Draft: null. Explicit synthetic user choice: Ask which of the two explicitly visible reports is meant; do not assume either is selected.

Proposed action: SUGGEST_REPLY. Observed action: null.

**Separate information-loss control**

Remove the user-owned alternatives. Do not invent named reports or turn missing information into an understood proposition.

Let the unchanged Phase 3 policy decide; do not force SUGGEST_REPLY or preserve a focal skill when its only support was removed. Observed action: null.

**Coverage gap:** Pair proposal repairs evidence completeness only in exposed development planning material, not YAML. The current clarify predicate depends on requestPattern(policy intent); actual derivation remains unmeasured.

**Human decision / reviewer:** null / unassigned.

## perspective_acknowledgement (candidate hypothesis)

References: `phase-5:perspective_acknowledgement/P2`, `phase-5:perspective_acknowledgement/A1`. Language: English. Focal expectation: `perspective_acknowledgement`. Optional modifier hypotheses: none.

**Evidence to verify in both modes**

- Recipient explicitly interprets short reply as dismissive.
- User wants recognition without motive concession.

**Shared visible messages**

- OTHER: Your short reply came across as dismissive to me.
- USER: I want to acknowledge how it came across without saying I intended to dismiss you.

**Rewrite variant**

Draft: I can see how my short reply came across as dismissive to you.

Selection: null. Proposed action: REWRITE_DRAFT. Observed action: null.

**Empty-draft variant**

Draft: null. Explicit synthetic user choice: Acknowledge their stated interpretation without agreeing that dismissal was intended.

Proposed action: SUGGEST_REPLY. Observed action: null.

**Separate information-loss control**

Remove user's recognition intent and any visible interpretation. Do not infer feeling, motive, guilt or agreement.

Let the unchanged Phase 3 policy decide; do not force SUGGEST_REPLY or preserve a focal skill when its only support was removed. Observed action: null.

**Coverage gap:** Candidate is absent and acknowledge_perspective is not a supported intent tag. Both-mode candidate selection/uplift are NOT RUN; no simulation or schema cast.

**Human decision / reviewer:** null / unassigned.

## confirmation (candidate hypothesis)

References: `phase-5:confirmation/P1`, `phase-5:confirmation/A1`. Language: English. Focal expectation: `confirmation`. Optional modifier hypotheses: none.

**Evidence to verify in both modes**

- Other person offered Friday delivery.
- User wants to verify before dependent scheduling.

**Shared visible messages**

- OTHER: I can deliver on Friday.
- USER: Before I schedule the dependent work, I want to verify that Friday is the delivery offer.

**Rewrite variant**

Draft: Before I schedule the dependent work, can you confirm you're offering Friday delivery?

Selection: null. Proposed action: REWRITE_DRAFT. Observed action: null.

**Empty-draft variant**

Draft: null. Explicit synthetic user choice: Verify the other person's understood Friday offer before dependent scheduling; do not accept it or promise delivery yourself.

Proposed action: SUGGEST_REPLY. Observed action: null.

**Separate information-loss control**

Replace Friday offer with toward the end of the week and remove verification selection. Friday is no longer supported; ask for missing date if warranted, never invent it.

Let the unchanged Phase 3 policy decide; do not force SUGGEST_REPLY or preserve a focal skill when its only support was removed. Observed action: null.

**Coverage gap:** Candidate/confirm_understanding tag absent. Distinguish the Phase 3 which-deliverable seed from one-understood-proposition verification before 8B; neither is tested here.

**Human decision / reviewer:** null / unassigned.

## give_constructive_feedback (candidate hypothesis)

References: `phase-5:give_constructive_feedback/P1`, `phase-5:give_constructive_feedback/A1`. Language: English. Focal expectation: `give_constructive_feedback`. Optional modifier hypotheses: none.

**Evidence to verify in both modes**

- User reports two interruptions.
- User could not finish.
- User chooses to request a chance to finish.

**Shared visible messages**

- OTHER: What did you want to discuss about our conversation?
- USER: You interrupted me twice and I could not finish. I want to ask you to let me finish before responding.

**Rewrite variant**

Draft: I was interrupted twice and couldn't finish my point. Please let me finish before responding.

Selection: null. Proposed action: REWRITE_DRAFT. Observed action: null.

**Empty-draft variant**

Draft: null. Explicit synthetic user choice: Give feedback about the two observed interruptions and supported impact, requesting time to finish without an identity attack.

Proposed action: SUGGEST_REPLY. Observed action: null.

**Separate information-loss control**

Remove user-owned observations/impact/change request. The recipient's question alone does not establish an incident, frequency, motive or desired correction.

Let the unchanged Phase 3 policy decide; do not force SUGGEST_REPLY or preserve a focal skill when its only support was removed. Observed action: null.

**Coverage gap:** Candidate/give_feedback tag absent. Both-mode feasibility and benefit beyond request/de-escalation/status need later gated study.

**Human decision / reviewer:** null / unassigned.

## Expansion and action coverage still missing

- Independent Simplified Chinese pairs
- Independent Traditional Chinese pairs
- Intentional mixed en/zh
- Unsupported primary with supported secondary
- Unknown primary
- Switching false and regional/script variants

All seven language modifiers remain review targets: `en.professional_conciseness`, `en.casual_naturalness`, `en.direct_but_polite`, `zh.politeness_calibration`, `zh.professional_formality`, `zh.natural_conciseness`, `zh.code_switching`. Translations alone do not count as independent contexts.

For every applicable family, later work still needs focal negative permitting appropriate neighbor; hard-neighbor with independently supplied evidence; legitimate global NONE with no required or optional skills. Regression actions: `COMPLETE_DRAFT`, `SUGGEST_ACTIONS`, `ASK_CLARIFICATION`, `NO_REPLY_NEEDED`. Existing canonical narratives and these positive pair proposals do not satisfy Phase 8C selection or Phase 8D uplift gates.

The three candidate intent tags are absent from the current contract. That is recorded as an unrun eligibility gap; no unsupported enum cast, synthetic selection result or duplicate rewrite/generate skill is introduced.

## Validation scope

Preparation tests verify packet counts, paired visible inputs, valid explicit-choice shape, null observed results, candidate-tag absence and stated coverage gaps. These are structural checks, not measured semantic equivalence, routing accuracy, language validity or uplift. Real reviewers must judge each proposed family before execution.
