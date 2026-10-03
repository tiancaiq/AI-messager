# Phase 8B — Candidate definition and atomicity review

Date: 2026-09-23. Reviewer: CODEX_SEMANTIC_REVIEW. Branch: skills. Revision: 1.

## Decision packet — human experiment gate

The [scoped 8A approval](phase-8a-focused-human-approval.md) records the user's exact 34-item approval and conservative resolutions. This report completes the bounded 8B definition/atomicity review. Full Phase 8 is incomplete. **No candidate experiment is authorized yet.**

| Candidate                   | CODEX recommendation | Reason                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| perspective_acknowledgement | CONTINUE             | A calm attributed interpretation with no stated emotion, support fact, missing detail or heat leaves a plausible recognition job beyond current eligible single skills. CONTINUE means a reviewed hypothesis merits an experiment, not that incremental benefit is proven. The 8A quarantined perspective original proves no new atom.                                                                                                                                                          |
| confirmation                | DEFER                | Defer a separate atom before selection work: every surviving positive is already a supported request to verify a proposition. request preserves the selected action and leaves room for a truthful answer; global fact/commitment preservation supplies much of the rest. No canonical A-only/request-forbidden case exists. This is a redundancy concern, not measured equality or proof that confirmation can never add value. The two 8A quarantines did not establish a distinct candidate. |
| give_constructive_feedback  | CONTINUE             | The narrow feedback message has a coherent communicative purpose across work, friendship and service/review contexts. Status is not generally the same as past behavioral evidence, and calm feedback does not always require de-escalation. The explicit behavior-impact-change relation could add value beyond request plus generic preservation. CONTINUE is provisional: request overlap is substantial and later failure to beat the strongest valid composition should reject the atom.   |

Requested human decisions:

1. Does the revised perspective_acknowledgement hypothesis merit an experiment against generic wording and the strongest supported existing skills?
2. Accept DEFER for confirmation as a separate atom, or request a revised distinctness argument before any experiment?
3. Does the narrow give_constructive_feedback hypothesis merit an experiment against request and the strongest valid compositions?

Approval here would mean permission to investigate a frozen candidate revision, not production approval. Stop at this gate. 8C corpus work, selector repair, held-out evaluation, providers, activation, commits and pushes have not occurred.

## Evidence, architecture and limits

The [revision-bound dossier JSON](../../packages/skills/tests/fixtures/phase8/candidate-dossiers.json) contains three dossiers, all 30 original Phase 5 excerpts, every proposed canonical expansion/revision, exact guidance, 12 neighbor analyses and all source/definition/approval bindings. Dossier-set digest: `sha256:b128bee62053be1856076f4a0d82695efba8074f8ecced3dcf22db73dfa401b9`. The [176-file starting snapshot](../../packages/skills/tests/fixtures/phase8/phase8b-baseline.json) captures the dirty working-tree baseline; HEAD alone cannot reproduce it.

Sources: [Phase 3 rationale and score table](phase-3-capability-normalization.md), [Phase 5 candidate cards](phase-5-registry-expansion.md), actual frozen runtime definitions, and accepted 8A findings. Phase 3 scores (14/14, 13/14, 13/14) are historical prioritization judgments, not proof of distinctness or quality. All review prose is CODEX-authored. Candidate permissions remain PENDING.

Runtime SkillDefinition accepts ACTIVE/INACTIVE, not research DRAFT, and candidate intents are absent. Dossiers deliberately are not SkillDefinition objects or AuthoringRecords; no enum/schema/routing extension or misleading alias is needed for 8B. Private tests only. No manifest, package export, production build, engine, context derivation or prompt import. Exact compact guidance is checked with the existing CommunicationGuidanceSchema; private dossiers are not runtime SkillDefinition or AuthoringRecord objects. No public/private production schema change or candidate YAML was necessary. No alternative registry, prompt path, selector or intent alias was created.

Every proposed context is an exposed canonical clarification/expansion, not an 8C case corpus or executable routing annotation. REVISE additions are new synthetic inputs and never retroactively ground the source. KEEP means original purpose survives review; the structured expansion still has its own revision. Expected/acceptable/forbidden describe hypothetical semantic applicability within each supplied intent, not measured runtime selection or candidate availability.

Only the 30 exposed canonical examples are reviewed/expanded here. The 12 × 5 matrix entries below are schematic boundary contrasts, not 60 new executable cases, independent trials or an 8C development/holdout set. Ambiguous and nested cases explicitly avoid forced exclusive labels.

- No candidate is human-approved for experiment or activation.
- English canonical examples only; no Simplified/Traditional Chinese, mixed or unsupported-language empirical quality inference.
- Canonical scenarios repeat: three families per candidate, ten rows each. Thirty rows are not thirty independent contexts.
- No 8C corpus, routing repair, held-out labels, model calls, selection metrics or uplift measurements.
- Hypothesized modifier compatibility does not bypass the existing four-skill/12-rule budgets or language eligibility.

## perspective_acknowledgement

Research state: DRAFT. CODEX decision: **CONTINUE**. Human experiment permission: PENDING. Revision: 1. Digest: `sha256:8bdfb837e2f40c81dee1304d36bf8b4ebc8b78fb23e3e66d7ed7f6f22937642c`.

### One job and evidence prerequisites

Acknowledge a recipient's explicitly stated interpretation as their interpretation, without endorsing its truth.

- A visible statement attributes a specific reading to the recipient; do not infer it from emotion, brevity or silence.
- The user chooses recognition of that reading; rewrite input must already express or explicitly authorize that goal.
- Enough visible content identifies what was interpreted, without inventing causal explanations or motives.

### Ownership, preservation and action constraints

- **ownership:** Attribute the reading to its actual speaker. The user's wording acknowledges that reading, not user-owned wrongdoing.
- **facts:** Do not assert that the interpretation is true or explain why it arose unless the reason is supplied.
- **commitments:** No apology, concession, corrective promise or checking step without separate user intent/evidence.
- **certainty:** Keep attributed perception separate from factual endorsement. Preserve explicit denial or uncertainty if present.
- **action:** Only word the already-selected action and intent. Never infer a need for acknowledgment from a closed exchange.

### Exact proposed compact guidance

```json
{
  "principles": [
    "Recognize the other person's stated reading in plain attributed language.",
    "Separate acknowledging that reading from endorsing disputed facts or motives.",
    "Preserve the user's position and any separately supplied uncertainty or denial."
  ],
  "avoid": [
    "Do not invent feelings, intentions, explanations or fault.",
    "Do not turn a denial into agreement, apology or a promise.",
    "Avoid formulaic validation, unnecessary paraphrase and unchosen questions."
  ]
}
```

Changes from historical guidance:

- Narrow Phase 3 'interpretation or concern' to an explicitly stated interpretation; concern alone is insufficient.
- Replace 'I can see why/how' as a default with attributed recognition; causal plausibility is not assumed.
- Rewrite A1/A2 as openly synthetic, semantically aligned before/after pairs; retain the stance-changing historical pairs as rejected evidence.

### Rewrite and empty-draft applicability

- **REWRITE_DRAFT:** Preserve the supplied stance. Improve an already intended recognition; a hostile denial is not permission to change the communication goal. If denial and recognition are both intended, retain both without inventing a motive.
- **SUGGEST_REPLY:** Require explicit or independently reliable recognition intent plus the recipient's stated interpretation. An empty draft supplies no denial, apology or checking commitment. If the user's choice remains material and unknown, return control to the existing upstream action policy.
- **COMPLETE_DRAFT:** Not evaluated in 8B; no extra completion capability or eligibility is inferred.

These are applicability/preservation arguments, not measured paired-mode results. No rewrite/generate duplicate skills are proposed. The same communication job applies only when the already-selected action and evidence support it.

### Existing single skills and strongest compositions

| Existing skill(s)                    | When actually supported                                                                         | Comparison                                                                                                                                                          |
| ------------------------------------ | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Generic wording (zero skills)        | Calm interpretation only, explicit recognition intent, no emotion or unknown.                   | Generic generation with preservation constraints is the strongest uncontaminated baseline, not a deliberately weak validation-only condition.                       |
| emotional_validation                 | A clearly upsetting experience/feeling is actually supplied and user intends to acknowledge it. | Frozen validation covers difficulty as well as emotion. Many Phase 5 examples overlap; candidate must add interpretation attribution beyond that existing coverage. |
| emotional_validation + de_escalation | Both upset and actual conflict are supplied and acknowledged.                                   | Valid strong composition. Do not force either skill into a calm neutral interpretation case.                                                                        |
| clarification + request              | There is a separate material unknown and a chosen request to resolve it.                        | May accompany recognition but inquiry cannot be substituted for the user's recognition-only intent.                                                                 |
| reassurance                          | A visible concern and supporting fact exist with chosen support intent.                         | Support is a different job; reassurance must not dismiss the interpretation.                                                                                        |

Other relevant neighbors:

- **apology:** Requires user-intended regret for supported impact; recipient interpretation alone proves no fault.
- **acknowledge_mistake:** Recipient reading does not establish a user-owned mistake.
- **planning:** Known logistics can be restated without interpreting a viewpoint.

**Modifier risk:** Professional/casual/polite phrasing is optional only with its existing language and intent evidence. Attributed recognition is not an English or Chinese style preference. Seven existing modifiers remain unchanged; Chinese, mixed and unsupported-language quality is unmeasured.

**Duplicate/context risk:** P1/A2 repeat schedule/deprioritization; P2/A1 repeat brief-reply/dismissive. P3 is the third context, not five independent contexts. The 8A replacement emotional_validation/H1 is a missing-file clarification, not evidence of a perspective atom.

### Canonical example review — all ten

#### perspective_acknowledgement/P1 — REVISE

**Original Phase 5 text (line 191):** Coworker says a silent schedule change looked like deprioritization; user wants to acknowledge how it appeared without agreeing about motive.

**Finding:** Source supplies attribution/recognition but its silent change may already be a clearly upsetting experience; preserve overlap and omit invented motive.

**Proposed evidence type:** NEW_SYNTHETIC_REVISION. The full proposed input is below; additions do not retrospectively ground the original.

```json
{
  "context": "Coworker says, 'The schedule change without a message looked like my task had been deprioritized.' User wants to acknowledge that reading; the reason for the change is not established.",
  "intent": "Acknowledge how the coworker read the schedule change, without conceding a motive.",
  "expected": ["perspective_acknowledgement"],
  "acceptable": ["emotional_validation"],
  "forbidden": []
}
```

#### perspective_acknowledgement/P2 — REVISE

**Original Phase 5 text (line 191):** Friend says a short reply seemed dismissive; user wants to recognize that interpretation.

**Finding:** A dismissive reading does not license an apology or an admission of intended dismissal.

**Proposed evidence type:** NEW_SYNTHETIC_REVISION. The full proposed input is below; additions do not retrospectively ground the original.

```json
{
  "context": "Friend says, 'I read your short reply as dismissive.' User explicitly wants to acknowledge that interpretation without saying it was the intended meaning.",
  "intent": "Recognize the friend's stated reading without agreeing about intent.",
  "expected": ["perspective_acknowledgement"],
  "acceptable": ["emotional_validation"],
  "forbidden": []
}
```

#### perspective_acknowledgement/P3 — REVISE

**Original Phase 5 text (line 191):** Customer says the two listed prices make the offer look inconsistent; user wants to acknowledge the reading while checking facts.

**Finding:** Separate recognition from the selected checking action; do not fabricate which price is correct.

**Proposed evidence type:** NEW_SYNTHETIC_REVISION. The full proposed input is below; additions do not retrospectively ground the original.

```json
{
  "context": "Customer says, 'The two listed prices make the offer look inconsistent.' User wants to acknowledge this reading and asks which listing the customer means; the correct price is unknown.",
  "intent": "Recognize the stated inconsistency and ask which listing is meant.",
  "expected": ["perspective_acknowledgement", "clarification"],
  "acceptable": ["request"],
  "forbidden": []
}
```

#### perspective_acknowledgement/N1 — KEEP

**Original Phase 5 text (line 192):** Only “I'm sad” is visible.

**Finding:** Feeling-only evidence does not supply an interpretation.

**Proposed evidence type:** STRUCTURED_CANONICAL_EXPANSION. The full proposed input is below; additions do not retrospectively ground the original.

```json
{
  "context": "Recipient says only, 'I'm sad.' User chooses to acknowledge the expressed sadness.",
  "intent": "Acknowledge sadness without explaining its cause.",
  "expected": ["emotional_validation"],
  "acceptable": [],
  "forbidden": ["perspective_acknowledgement"]
}
```

#### perspective_acknowledgement/N2 — KEEP

**Original Phase 5 text (line 192):** User is asked to claim “They secretly dislike you” without evidence.

**Finding:** Unsupported secret-dislike assertion fails attribution/fact constraints; no skill can manufacture it.

**Proposed evidence type:** STRUCTURED_CANONICAL_EXPANSION. The full proposed input is below; additions do not retrospectively ground the original.

```json
{
  "context": "Someone asks the user to claim a third person secretly dislikes the recipient. No supporting statement or observation is visible.",
  "intent": "Do not assert the unsupported motive.",
  "expected": [],
  "acceptable": [],
  "forbidden": ["perspective_acknowledgement"]
}
```

#### perspective_acknowledgement/N3 — REVISE

**Original Phase 5 text (line 192):** A neutral time confirmation contains no interpretation.

**Finding:** Make neutral logistics and fixed restatement intent explicit; no new verification question.

**Proposed evidence type:** NEW_SYNTHETIC_REVISION. The full proposed input is below; additions do not retrospectively ground the original.

```json
{
  "context": "Both people have agreed to meet at 3 p.m. User only restates that settled time; no interpretation is expressed.",
  "intent": "Restate the agreed 3 p.m. meeting.",
  "expected": ["planning"],
  "acceptable": [],
  "forbidden": ["perspective_acknowledgement"]
}
```

#### perspective_acknowledgement/H1 — KEEP

**Original Phase 5 text (line 193):** “The cancellations made me frustrated” with intent only to recognize feeling → emotional_validation.

**Finding:** The source has an upsetting experience and explicit feeling; user wants only emotional recognition.

**Proposed evidence type:** STRUCTURED_CANONICAL_EXPANSION. The full proposed input is below; additions do not retrospectively ground the original.

```json
{
  "context": "Recipient says, 'The cancellations made me frustrated.' User chooses only to acknowledge that feeling.",
  "intent": "Recognize the stated frustration.",
  "expected": ["emotional_validation"],
  "acceptable": [],
  "forbidden": ["perspective_acknowledgement"]
}
```

#### perspective_acknowledgement/H2 — REVISE

**Original Phase 5 text (line 193):** “Which price is correct?” with no interpretation to recognize → clarification or a factual answer, as supported.

**Finding:** The original mixes asking a question with answering one; disambiguate speaker and intent in a new synthetic variant.

**Proposed evidence type:** NEW_SYNTHETIC_REVISION. The full proposed input is below; additions do not retrospectively ground the original.

```json
{
  "context": "Two different prices are visible. The user does not know which applies and has chosen to ask the seller. No recipient interpretation is stated.",
  "intent": "Ask which price applies.",
  "expected": ["clarification"],
  "acceptable": ["request"],
  "forbidden": ["perspective_acknowledgement"]
}
```

#### perspective_acknowledgement/A1 — REVISE

**Original Phase 5 text (line 194):** Visible: friend read the brief reply as dismissive; user wants to acknowledge that reading. “you read it wrong” → “I can see how my short reply came across as dismissive.” No concession about intention is added.

**Finding:** Original denial→recognition changes stance. New synthetic draft below already expresses the chosen recognition; it does not approve the original rewrite.

**Proposed evidence type:** NEW_SYNTHETIC_REVISION. The full proposed input is below; additions do not retrospectively ground the original.

```json
{
  "context": "Friend says, 'I read your brief reply as dismissive.' User chooses to recognize that reading; the user's intent behind the brief reply is not established.",
  "intent": "Acknowledge the friend's interpretation without a motive claim.",
  "expected": ["perspective_acknowledgement"],
  "acceptable": [],
  "forbidden": [],
  "draft": "I understand that dismissive is how you read my brief reply, that was your reading of it.",
  "improved": "I understand you read my brief reply as dismissive.",
  "ledger": {
    "facts": ["Friend explicitly read the user's brief reply as dismissive."],
    "commitments": [],
    "uncertainty": [
      "The user's original intent is not established; no denial or agreement about it is added."
    ]
  }
}
```

#### perspective_acknowledgement/A2 — REVISE

**Original Phase 5 text (line 195):** Visible: changed schedule looked like deprioritization; no motive conceded. “not what it meant” → “I can see why the schedule change looked like your task had been deprioritized.” No promise or invented explanation follows.

**Finding:** Original 'not what it meant' loses denial and adds 'why'. New synthetic pair retains the denial explicitly and acknowledges only the stated reading.

**Proposed evidence type:** NEW_SYNTHETIC_REVISION. The full proposed input is below; additions do not retrospectively ground the original.

```json
{
  "context": "Recipient says the changed schedule looked like their task had been deprioritized. User explicitly states that was not what they meant and also chooses to acknowledge the reading.",
  "intent": "Acknowledge the stated reading while retaining the supplied denial of intended meaning.",
  "expected": ["perspective_acknowledgement"],
  "acceptable": [],
  "forbidden": [],
  "draft": "I understand you read the schedule change as your task being deprioritized. I didn't mean that. That was not my meaning.",
  "improved": "I understand you read the schedule change as deprioritizing your task. That wasn't what I meant.",
  "ledger": {
    "facts": [
      "Recipient read the schedule change as deprioritization.",
      "User explicitly denies that intended meaning."
    ],
    "commitments": [],
    "uncertainty": ["Actual priority change is not established by the user's denial of intent."]
  }
}
```

### Falsification and disposition

- Reject or merge if current emotional_validation legitimately covers the same cases without inferring upset, or generic generation plus eligible modifiers consistently matches the benefit.
- Reject if reviewers cannot distinguish mere recognition from agreement, or if the candidate increases false agreement, inferred emotion or unrequested questions.
- Reject as tactic/modifier if useful cases reduce to generic paraphrase or politeness rather than recognition of an attributed interpretation.

A calm attributed interpretation with no stated emotion, support fact, missing detail or heat leaves a plausible recognition job beyond current eligible single skills. CONTINUE means a reviewed hypothesis merits an experiment, not that incremental benefit is proven. The 8A quarantined perspective original proves no new atom.

## confirmation

Research state: DRAFT. CODEX decision: **DEFER**. Human experiment permission: PENDING. Revision: 1. Digest: `sha256:ed6d5725fe177c3301e0bad0a69891ee864df8a92b3bd1d9a7af2cbdd244740b`.

### One job and evidence prerequisites

Word the user's chosen check of one apparently understood material proposition without asserting acceptance or commitment.

- One proposition and its speaker are already visible; alternatives or missing scope are clarification.
- User has chosen verification and gives a material reason to verify before reliance.
- The upstream action is a wording action, not the coach deciding whether to ask or close.

### Ownership, preservation and action constraints

- **ownership:** Keep the offer/statement with its actual speaker. Do not turn the recipient's offer into the user's promise.
- **facts:** Repeat only the proposition supplied; no invented date, quantity, deliverable or interpretation.
- **commitments:** An offer is not an accepted agreement. A conditional plan to book is not a completed booking.
- **certainty:** A request for confirmation retains tentative status; cannot assert what is still being checked.
- **action:** No new question on a settled acknowledgment or NO_REPLY_NEEDED; never replace the existing ASK_CLARIFICATION policy.

### Exact proposed compact guidance

```json
{
  "principles": [
    "Name the one supplied proposition the user has chosen to verify.",
    "Keep its speaker and tentative status clear.",
    "Ask only the selected material check before the stated reliance."
  ],
  "avoid": [
    "Do not turn an offer or interpretation into an accepted commitment.",
    "Do not invent a proposed answer for missing alternatives or scope.",
    "Do not repeat settled trivia or add a verification question the user did not choose."
  ]
}
```

Changes from historical guidance:

- Exclude Phase 3 'which deliverable Friday applies to': the scope is unknown and belongs to existing clarification.
- Retain narrow Phase 5 material-known-proposition framing only as a proposed request tactic pending distinctness evidence.
- Do not introduce confirm_understanding into the shared contract, alias it to clarify, or widen current clarification to hide overlap.

### Rewrite and empty-draft applicability

- **REWRITE_DRAFT:** Can preserve and clarify an already chosen verification question. Keep the exact proposition, speaker and tentative status. Do not change an assertion into a question unless the user explicitly chose verification.
- **SUGGEST_REPLY:** Needs the visible proposition, chosen check and material reliance reason. An empty draft is not permission to query every offer; settled answers may need no reply. All scoped examples remain possible with request and generic preservation.
- **COMPLETE_DRAFT:** Not evaluated in 8B. No independent completion skill or candidate eligibility is created.

These are applicability/preservation arguments, not measured paired-mode results. No rewrite/generate duplicate skills are proposed. The same communication job applies only when the already-selected action and evidence support it.

### Existing single skills and strongest compositions

| Existing skill(s)             | When actually supported                                                    | Comparison                                                                                                                                                                              |
| ----------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| request                       | User asks the recipient to verify one visible proposition.                 | Best single-skill comparator: the requested action is verification, and the current principle leaves room for a truthful response. Candidate positives are nested under this broad job. |
| clarification                 | A date, quantity, meaning or scope is actually missing.                    | Use the existing missing-detail job. Do not assert an imagined Friday proposition to make a confirmation positive.                                                                      |
| request + planning            | Verification and separately intended known logistics are both supplied.    | Two grounded operations may compose. Do not add planning merely because the question mentions a date.                                                                                   |
| request + expectation_setting | User separately communicates their own supported conditional timing/limit. | Preserve whose timing is being checked versus whose expectation is being stated.                                                                                                        |
| request + follow_up           | A visible earlier request is deliberately revisited.                       | Use only with actual earlier-request evidence; confirming is not inherently following up.                                                                                               |
| status_update                 | User only reports current known progress.                                  | Not a substitute for verification; never treat a status assertion as the same job.                                                                                                      |

Other relevant neighbors:

- **ask_for_help:** A verification request need not be assistance; use only when assistance intent is independently supplied.

**Modifier risk:** Question concision, politeness and professional register are expression choices. Their apparent improvement is insufficient evidence for a universal confirmation atom. No new rewrite/generate versions or language rules.

**Duplicate/context risk:** P1/A1 share Friday delivery and P2/A2 share seats-before-booking. P3 supplies a third domain but not a distinct operation. N1/H1 are both missing-alternative controls and cannot be counted as independent boundary discoveries.

### Canonical example review — all ten

#### confirmation/P1 — REVISE

**Original Phase 5 text (line 212):** A colleague offered Friday delivery; user wants to verify that offer before scheduling dependent work.

**Finding:** Material selected verification is grounded, but existing request is a viable full comparator.

**Proposed evidence type:** NEW_SYNTHETIC_REVISION. The full proposed input is below; additions do not retrospectively ground the original.

```json
{
  "context": "Colleague says, 'I can deliver Friday.' User chooses to verify that offer before scheduling dependent work; no acceptance is stated.",
  "intent": "Ask whether the colleague is offering Friday delivery.",
  "expected": ["request"],
  "acceptable": ["confirmation"],
  "forbidden": []
}
```

#### confirmation/P2 — REVISE

**Original Phase 5 text (line 212):** Friend proposed two seats; user wants to confirm the quantity before booking.

**Finding:** Keep quantity with friend, and booking only as the user's conditional plan.

**Proposed evidence type:** NEW_SYNTHETIC_REVISION. The full proposed input is below; additions do not retrospectively ground the original.

```json
{
  "context": "Friend proposes two seats. User chooses to verify the quantity before booking; nothing is booked yet.",
  "intent": "Ask the friend to verify the proposed two seats before booking.",
  "expected": ["request"],
  "acceptable": ["confirmation"],
  "forbidden": []
}
```

#### confirmation/P3 — REVISE

**Original Phase 5 text (line 212):** Customer appears to have chosen collection; user wants to verify before arranging it.

**Finding:** Original 'appears to have chosen' lacks the actual proposition. New synthetic variant quotes the message without treating it as commitment.

**Proposed evidence type:** NEW_SYNTHETIC_REVISION. The full proposed input is below; additions do not retrospectively ground the original.

```json
{
  "context": "Customer says, 'Collection should work for me.' User chooses to verify that tentative collection preference before arranging collection.",
  "intent": "Check whether collection is the customer's intended option.",
  "expected": ["request"],
  "acceptable": ["confirmation"],
  "forbidden": []
}
```

#### confirmation/N1 — KEEP

**Original Phase 5 text (line 213):** “Thursday or Friday” remains unresolved; user needs the date.

**Finding:** Unresolved alternatives mean no single proposition is available to confirm.

**Proposed evidence type:** STRUCTURED_CANONICAL_EXPANSION. The full proposed input is below; additions do not retrospectively ground the original.

```json
{
  "context": "Recipient says, 'Thursday or Friday.' User needs the actual delivery date; neither has been chosen.",
  "intent": "Ask which delivery date applies.",
  "expected": ["clarification"],
  "acceptable": ["request"],
  "forbidden": ["confirmation"]
}
```

#### confirmation/N2 — KEEP

**Original Phase 5 text (line 213):** A trivial “thanks” requires no response.

**Finding:** Trivial thanks is an upstream closing control, not a wording opportunity.

**Proposed evidence type:** STRUCTURED_CANONICAL_EXPANSION. The full proposed input is below; additions do not retrospectively ground the original.

```json
{
  "context": "The exchange ends with 'Thanks, that answers it.' No unresolved matter or chosen question is supplied.",
  "intent": "No further reply is needed.",
  "expected": [],
  "acceptable": [],
  "forbidden": ["confirmation"]
}
```

#### confirmation/N3 — KEEP

**Original Phase 5 text (line 213):** The coach is choosing whether to ask clarification rather than wording the user's selected check.

**Finding:** The candidate cannot decide the upstream action; this source is a policy negative rather than a runnable wording case.

**Proposed evidence type:** STRUCTURED_CANONICAL_EXPANSION. The full proposed input is below; additions do not retrospectively ground the original.

```json
{
  "context": "The coach lacks the user's response intent and is still choosing whether one material clarification is necessary.",
  "intent": "Do not select a wording skill to make that upstream decision.",
  "expected": [],
  "acceptable": [],
  "forbidden": ["confirmation"]
}
```

#### confirmation/H1 — KEEP

**Original Phase 5 text (line 214):** Two possible meeting rooms, no understood choice → clarification.

**Finding:** Two possible rooms with no choice is clarification, not a known-proposition check.

**Proposed evidence type:** STRUCTURED_CANONICAL_EXPANSION. The full proposed input is below; additions do not retrospectively ground the original.

```json
{
  "context": "Room A and Room B are possible. No chosen room is visible. User needs the room before going.",
  "intent": "Ask which room to use.",
  "expected": ["clarification"],
  "acceptable": ["request"],
  "forbidden": ["confirmation"]
}
```

#### confirmation/H2 — KEEP

**Original Phase 5 text (line 214):** Confirmed Saturday meeting simply restated as agreed → planning, not a new confirmation question.

**Finding:** Do not turn settled logistics into redundant verification.

**Proposed evidence type:** STRUCTURED_CANONICAL_EXPANSION. The full proposed input is below; additions do not retrospectively ground the original.

```json
{
  "context": "Both people explicitly agreed to meet Saturday at 2 p.m. User chooses only to restate the agreed arrangement.",
  "intent": "Restate Saturday at 2 p.m.",
  "expected": ["planning"],
  "acceptable": [],
  "forbidden": ["confirmation"]
}
```

#### confirmation/A1 — REVISE

**Original Phase 5 text (line 215):** Visible offer: “I can deliver Friday”; user intends verification. “Friday is the delivery right?” → “Just confirming: you're offering delivery on Friday, correct?”

**Finding:** The offer's modal force matters: 'can deliver' is not delivery acceptance. Make the material reliance reason explicit in a synthetic expansion.

**Proposed evidence type:** NEW_SYNTHETIC_REVISION. The full proposed input is below; additions do not retrospectively ground the original.

```json
{
  "context": "Colleague says, 'I can deliver Friday.' User chooses to verify the offer before scheduling dependent work; no acceptance has occurred.",
  "intent": "Verify the colleague's Friday delivery offer.",
  "expected": ["request"],
  "acceptable": ["confirmation"],
  "forbidden": [],
  "draft": "Friday is the delivery you're offering, right? That's the offer, Friday?",
  "improved": "Are you offering delivery on Friday?",
  "ledger": {
    "facts": [
      "Colleague offered Friday delivery.",
      "User intends to verify before scheduling dependent work."
    ],
    "commitments": [],
    "uncertainty": ["The offer is being checked; it is not an accepted commitment."]
  }
}
```

#### confirmation/A2 — REVISE

**Original Phase 5 text (line 216):** Visible proposal: two seats; user wants verification before booking. “two seats?” → “Before I book, can you confirm that you need two seats?” Booking is user-stated conditional intent, not a new completed action.

**Finding:** A useful preserved check, but the natural gain may be request clarity, not a new atom.

**Proposed evidence type:** NEW_SYNTHETIC_REVISION. The full proposed input is below; additions do not retrospectively ground the original.

```json
{
  "context": "Friend proposes two seats. User wants to verify before booking; the booking is conditional and not completed.",
  "intent": "Verify the quantity of two seats before booking.",
  "expected": ["request"],
  "acceptable": ["confirmation"],
  "forbidden": [],
  "draft": "Before I book, two seats, is two seats what you need?",
  "improved": "Before I book, can you confirm that you need two seats?",
  "ledger": {
    "facts": ["Friend proposed two seats.", "User intends to verify quantity before booking."],
    "commitments": [
      "Booking remains a user-stated conditional plan; no booking is promised or completed by this message."
    ],
    "uncertainty": ["Quantity still requires the selected confirmation."]
  }
}
```

### Falsification and disposition

- To reopen the atom, show a material selected-verification job not adequately expressed by the current supported request baseline plus global preservation, without redefining existing skills or manufacturing uncertainty.
- Reject if its only benefit is concise question phrasing/tentative language that belongs in request guidance or product preservation.
- Reject if a confirmation label causes unnecessary checks, silently accepts an offer, reverses speaker ownership, or cannot be distinguished from an actual missing detail.

Defer a separate atom before selection work: every surviving positive is already a supported request to verify a proposition. request preserves the selected action and leaves room for a truthful answer; global fact/commitment preservation supplies much of the rest. No canonical A-only/request-forbidden case exists. This is a redundancy concern, not measured equality or proof that confirmation can never add value. The two 8A quarantines did not establish a distinct candidate.

## give_constructive_feedback

Research state: DRAFT. CODEX decision: **CONTINUE**. Human experiment permission: PENDING. Revision: 1. Digest: `sha256:71569642d70e5a2876e6289153fb28ebaf11a25da481cc94ae3919012b4ec350`.

### One job and evidence prerequisites

Deliver one user-chosen piece of corrective feedback linking a supported behavior to its supported impact and the user's supplied desired change.

- The user's evidence identifies specific behavior and its actor; quoted or reported observations retain their source, not invented certainty.
- The impact is supplied by the user or visible evidence; do not infer inconvenience, hurt or frequency.
- A concrete proportionate change is already chosen by the user; the skill cannot choose discipline, demands or concessions.
- The user actually intends feedback. A bare request, ordinary limit, uncertain concern or report of their own fault is insufficient.

### Ownership, preservation and action constraints

- **ownership:** Retain who acted and who experienced impact. Do not transfer another person's behavior or allegation to the user.
- **facts:** Keep exact supplied frequency and evidence level. A possible omission remains possible; no motive, diagnosis or character claim.
- **commitments:** Use only the supplied desired change. No invented deadline, punishment, authority, corrective promise or future concession.
- **certainty:** Do not turn a report/suspicion into established misconduct, or a subjective difficulty into a universal objective judgment.
- **action:** One feedback message, not the multi-turn difficult-feedback playbook. No new goal selection, required apology, negotiation or response management.

### Exact proposed compact guidance

```json
{
  "principles": [
    "Describe the specific supported behavior, keeping its actor and evidence level clear.",
    "Connect it to the supplied impact without diagnosing motives or identity.",
    "Express the user's chosen actionable change proportionately; keep their decision and certainty."
  ],
  "avoid": [
    "Do not invent incidents, frequency, impact, corrective demands or authority.",
    "Do not convert a suspicion into an accusation or assign another person's fault to the user.",
    "Avoid character attacks, humiliation, forced reconciliation and unsupported promises."
  ]
}
```

Changes from historical guidance:

- Make the behavior/impact/change evidence prerequisite explicit rather than treating any criticism as feedback.
- Reject the original H1 boundary label as gold under the frozen repeated-pressure rule; a first after-8 request can be request/expectation without boundary.
- Keep H2 as a provisional-concern control; raise_concern is not a fourth candidate or an available skill ID.
- Expose request and conditional de_escalation/current-status compositions as strong comparators; do not claim the canonical pairs prove non-composability.

### Rewrite and empty-draft applicability

- **REWRITE_DRAFT:** Rough wording may be made civil and specific only when the full supplied context already grounds behavior, impact and desired change. Remove insults without deleting the user's correction or adding new facts.
- **SUGGEST_REPLY:** Require the user's selected feedback goal and all three evidence parts. Empty draft never authorizes choosing a corrective demand, inferring harm or creating an incident. Ambiguous response goals stay with the upstream policy.
- **COMPLETE_DRAFT:** Not evaluated in 8B; no separate completion skill or expanded action policy.

These are applicability/preservation arguments, not measured paired-mode results. No rewrite/generate duplicate skills are proposed. The same communication job applies only when the already-selected action and evidence support it.

### Existing single skills and strongest compositions

| Existing skill(s)                       | When actually supported                                                            | Comparison                                                                                                                                                                                         |
| --------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| request                                 | Desired change is supplied and the user asks for it.                               | Always a strong nested comparator for corrective asks. Generic generation already preserves the supplied behavior and impact; the candidate must demonstrate incremental value over that baseline. |
| request + de_escalation                 | Rough draft/visible conflict contains actual accusatory heat.                      | Strong comparator for A1/A2. Calm feedback must not be weakened by forcing irrelevant de-escalation, and heated cases must not hide this overlap.                                                  |
| request + status_update                 | User also intentionally reports a currently observable problem or progress.        | Valid for current unlabeled figures when status reporting is intended; not automatically applicable to every historical interruption or wasted trip.                                               |
| request + status_update + de_escalation | Current status and heat are both independently present.                            | Use as the strongest three-skill comparator only with those evidence conditions; fits the four-skill bound without inventing a dependency.                                                         |
| boundary_setting + request              | Repeated pressure plus a chosen ongoing limit and requested behavior change exist. | Valid subset; first-time limits cannot silently broaden the frozen boundary definition.                                                                                                            |
| acknowledge_mistake + apology           | The user's own mistake and independently chosen regret are supplied.               | A different ownership/job comparison, not feedback about the other person's conduct.                                                                                                               |

Other relevant neighbors:

- **expectation_setting:** Supported future timing/capacity limit, not necessarily critique of another's behavior.
- **clarification:** A possible omitted cost remains a missing-fact check, not proven error.
- **decline:** A chosen refusal requires neither criticism nor a fabricated reason.
- **emotional_validation:** A separately expressed feeling can be acknowledged without proving the other person's fault.
- **apology:** No apology is implied merely by courteous corrective feedback.

**Modifier risk:** Directness, dignity and concise professional wording already cross many skills. The candidate must help preserve a specific behavior-impact-change relation, not merely provide nicer wording. Chinese script/register/mixed-term handling stays with the existing modifiers; no culture-based feedback rules.

**Duplicate/context risk:** P1/A1 reuse two interruptions; P3/A2 reuse unlabeled figures. P2 is a third context. They are three canonical scenario families, not five independent quality trials. The two rough applications are especially confounded with de-escalation.

### Canonical example review — all ten

#### give_constructive_feedback/P1 — KEEP

**Original Phase 5 text (line 233):** User was interrupted twice and says they could not finish; wants colleague to let them finish.

**Finding:** All three parts and actor are supplied. Nested request remains a fair comparator.

**Proposed evidence type:** STRUCTURED_CANONICAL_EXPANSION. The full proposed input is below; additions do not retrospectively ground the original.

```json
{
  "context": "User reports that the colleague interrupted them twice and they could not finish their point. User wants to ask the colleague to let them finish.",
  "intent": "Give feedback on the two interruptions and ask to finish before a response.",
  "expected": ["give_constructive_feedback"],
  "acceptable": ["request"],
  "forbidden": []
}
```

#### give_constructive_feedback/P2 — KEEP

**Original Phase 5 text (line 233):** Friend changed agreed plans without telling user, causing a wasted trip; user wants earlier notice.

**Finding:** Keep the supplied causal impact; do not add frequency or motives.

**Proposed evidence type:** STRUCTURED_CANONICAL_EXPANSION. The full proposed input is below; additions do not retrospectively ground the original.

```json
{
  "context": "Friend changed agreed plans without telling the user, which caused the user's wasted trip. User wants earlier notice of plan changes.",
  "intent": "Explain the unannounced change's impact and ask for earlier notice.",
  "expected": ["give_constructive_feedback"],
  "acceptable": ["request"],
  "forbidden": []
}
```

#### give_constructive_feedback/P3 — KEEP

**Original Phase 5 text (line 233):** User found unlabeled figures hard to review and wants labels added by the author.

**Finding:** Preserve subjective difficulty, not an absolute claim that the author's work is bad.

**Proposed evidence type:** STRUCTURED_CANONICAL_EXPANSION. The full proposed input is below; additions do not retrospectively ground the original.

```json
{
  "context": "User found the author's unlabeled figures difficult to review and wants the author to add labels.",
  "intent": "Explain the review difficulty and ask for labels.",
  "expected": ["give_constructive_feedback"],
  "acceptable": ["request", "status_update"],
  "forbidden": []
}
```

#### give_constructive_feedback/N1 — KEEP

**Original Phase 5 text (line 234):** User merely guesses a coworker is sabotaging them.

**Finding:** An unsupported sabotage guess is not observed behavior evidence.

**Proposed evidence type:** STRUCTURED_CANONICAL_EXPANSION. The full proposed input is below; additions do not retrospectively ground the original.

```json
{
  "context": "User guesses a coworker is sabotaging them; no supporting incident or impact is visible.",
  "intent": "Do not turn a suspicion into an accusation or corrective demand.",
  "expected": [],
  "acceptable": [],
  "forbidden": ["give_constructive_feedback"]
}
```

#### give_constructive_feedback/N2 — KEEP

**Original Phase 5 text (line 234):** User only says they cannot attend tonight.

**Finding:** Declining is not criticism; no behavior/impact evidence is supplied.

**Proposed evidence type:** STRUCTURED_CANONICAL_EXPANSION. The full proposed input is below; additions do not retrospectively ground the original.

```json
{
  "context": "User has chosen not to attend tonight and wants to state that refusal. No critique or reason is supplied.",
  "intent": "Decline tonight without inventing a reason.",
  "expected": ["decline"],
  "acceptable": [],
  "forbidden": ["give_constructive_feedback"]
}
```

#### give_constructive_feedback/N3 — KEEP

**Original Phase 5 text (line 234):** User wants to acknowledge their own incorrect figures.

**Finding:** Actor ownership distinguishes self-accountability from feedback.

**Proposed evidence type:** STRUCTURED_CANONICAL_EXPANSION. The full proposed input is below; additions do not retrospectively ground the original.

```json
{
  "context": "User entered incorrect figures and wants to acknowledge their own error. No other person's error is alleged.",
  "intent": "Own the user's incorrect figures.",
  "expected": ["acknowledge_mistake"],
  "acceptable": [],
  "forbidden": ["give_constructive_feedback"]
}
```

#### give_constructive_feedback/H1 — REVISE

**Original Phase 5 text (line 235):** “Please don't call after 8 p.m.” without a feedback explanation → boundary_setting.

**Finding:** Original first-limit boundary label contradicts frozen repeated-pressure eligibility. Keep it as a first-limit request/expectation contrast, not approved boundary evidence.

**Proposed evidence type:** NEW_SYNTHETIC_REVISION. The full proposed input is below; additions do not retrospectively ground the original.

```json
{
  "context": "User wants to ask for no calls after 8 p.m. No repeated pressure, feedback explanation, incident or impact is supplied.",
  "intent": "State the after-8 limit without inventing a feedback explanation.",
  "expected": ["request"],
  "acceptable": ["expectation_setting"],
  "forbidden": ["give_constructive_feedback", "boundary_setting"]
}
```

#### give_constructive_feedback/H2 — REVISE

**Original Phase 5 text (line 235):** “I'm worried this estimate may omit travel” without a proven mistake → raise-concern draft or clarification, not an accusation.

**Finding:** Do not route a nonexistent raise_concern atom or claim the omission is proven. Specify a chosen missing-detail question.

**Proposed evidence type:** NEW_SYNTHETIC_REVISION. The full proposed input is below; additions do not retrospectively ground the original.

```json
{
  "context": "User says, 'I'm worried this estimate may omit travel.' Travel inclusion is unknown, and the user chooses to ask whether it is included.",
  "intent": "Ask whether the estimate includes travel, preserving that an omission is only possible.",
  "expected": ["clarification"],
  "acceptable": ["request"],
  "forbidden": ["give_constructive_feedback"]
}
```

#### give_constructive_feedback/A1 — KEEP

**Original Phase 5 text (line 236):** Facts: two interruptions prevented user finishing; change desired: let user finish. “you're rude, stop it” → “I was interrupted twice and couldn't finish my point. Please let me finish before responding.”

**Finding:** Original concrete ledger supports civil specific feedback. Heat also supports de_escalation; not proof of candidate-only uplift.

**Proposed evidence type:** STRUCTURED_CANONICAL_EXPANSION. The full proposed input is below; additions do not retrospectively ground the original.

```json
{
  "context": "User reports that the recipient interrupted them twice and they could not finish their point. User has chosen to ask to finish before the recipient responds.",
  "intent": "Give the supplied feedback and ask to finish before a response.",
  "expected": ["give_constructive_feedback"],
  "acceptable": ["request", "de_escalation"],
  "forbidden": [],
  "draft": "you're rude, stop it",
  "improved": "I was interrupted twice and couldn't finish my point. Please let me finish before responding.",
  "ledger": {
    "facts": ["Recipient interrupted user twice.", "User could not finish their point."],
    "commitments": [],
    "uncertainty": []
  }
}
```

#### give_constructive_feedback/A2 — KEEP

**Original Phase 5 text (line 237):** Facts: unlabeled figures made review difficult; requested change: labels. “this is a mess, label it” → “I found the unlabeled figures difficult to review. Could you add labels?”

**Finding:** The original subjective impact and requested labels are grounded; request/de_escalation remains a strong comparator.

**Proposed evidence type:** STRUCTURED_CANONICAL_EXPANSION. The full proposed input is below; additions do not retrospectively ground the original.

```json
{
  "context": "User found the recipient's unlabeled figures difficult to review and has chosen to request labels.",
  "intent": "Explain the supplied review difficulty and ask for labels.",
  "expected": ["give_constructive_feedback"],
  "acceptable": ["request", "de_escalation", "status_update"],
  "forbidden": [],
  "draft": "this is a mess, label it",
  "improved": "I found the unlabeled figures difficult to review. Could you add labels?",
  "ledger": {
    "facts": ["Figures lack labels.", "User found them difficult to review."],
    "commitments": [],
    "uncertainty": []
  }
}
```

### Falsification and disposition

- Reject or merge if request plus generic preservation (and de_escalation/status only when independently applicable) provides the same specificity and safety.
- Reject if feedback only works as an ordered multi-turn sequence of acknowledgment, inquiry, demand and negotiation.
- Reject if desired changes or impacts are repeatedly invented, ownership/frequency is distorted, or the candidate erases a user's supported refusal or uncertainty.
- Reject as stylistic if the only improvement is removing insults or making English/Chinese more polite.

The narrow feedback message has a coherent communicative purpose across work, friendship and service/review contexts. Status is not generally the same as past behavioral evidence, and calm feedback does not always require de-escalation. The explicit behavior-impact-change relation could add value beyond request plus generic preservation. CONTINUE is provisional: request overlap is substantial and later failure to beat the strongest valid composition should reject the atom.

## Explicit nearest-neighbor matrix

All classifications below describe proposed semantic boundaries. Required/acceptable/forbidden labels in the canonical JSON are hypothetical authoring judgments; no candidate is selectable or active. A-only separation is explicitly unavailable for the two nested request comparisons.

### perspective_acknowledgement ↔ emotional_validation

| Contrast      | Evidence and interpretation                                                                                                             |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| candidateOnly | A calm recipient explicitly reads 'version two' as the second attachment; user only recognizes that reading, no upset/feeling supplied. |
| existingOnly  | Only explicit sadness is recognized; no interpretation is supplied.                                                                     |
| ambiguous     | 'That seems unfair' may be a reading and an upsetting experience; user intent/evidence must separate or retain overlap.                 |
| bothValid     | Recipient explicitly states a reading and frustration; user independently chooses to acknowledge both.                                  |
| neitherValid  | Neutral agreed pickup time, user only restates logistics.                                                                               |

Frozen validation includes upsetting experience/difficulty, so perspective is not distinct merely because no emotion word appears.

### perspective_acknowledgement ↔ reassurance

| Contrast      | Evidence and interpretation                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------------- |
| candidateOnly | Known reading with chosen recognition but no concern/support fact.                                                |
| existingOnly  | Concern about attending alone plus user-supplied attendance support; no interpretation.                           |
| ambiguous     | 'You will be there, right?' could be concern or verification; do not infer recognition intent.                    |
| bothValid     | Recipient states a reading and a separate worry with grounded support; user chooses both recognition and support. |
| neitherValid  | Settled logistics, no reading or concern.                                                                         |

Recognition cannot manufacture a support fact or dismiss a concern.

### perspective_acknowledgement ↔ clarification

| Contrast      | Evidence and interpretation                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------- |
| candidateOnly | Explicit known reading, recognition-only intent, no missing detail.                            |
| existingOnly  | Two report names plausible; user asks which, no recipient reading.                             |
| ambiguous     | 'You mean version two?' lacks enough speaker/intent context to classify.                       |
| bothValid     | Acknowledge supplied reading, then ask a separate unknown file name, only if both user-chosen. |
| neitherValid  | Known progress report only.                                                                    |

Do not append a question to make recognition useful.

### perspective_acknowledgement ↔ de_escalation

| Contrast      | Evidence and interpretation                                                                                     |
| ------------- | --------------------------------------------------------------------------------------------------------------- |
| candidateOnly | Calm interpretation is explicitly recognized without heat.                                                      |
| existingOnly  | Heated numerical disagreement; user only wants a civil disagreement and joint check.                            |
| ambiguous     | A terse accusation may express both a reading and heat; do not invent intent to acknowledge.                    |
| bothValid     | Stated interpretation plus independently supplied heated wording; user chooses recognition and calmer delivery. |
| neitherValid  | Neutral completed-task status.                                                                                  |

Reducing heat need not agree with a viewpoint; recognizing a viewpoint need not reduce heat.

### confirmation ↔ clarification

| Contrast      | Evidence and interpretation                                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| candidateOnly | One stated Friday offer, selected verification before reliance; under the narrow frozen missing-detail definition no actual missing alternative. |
| existingOnly  | Thursday/Friday unresolved; no candidate proposition may be invented.                                                                            |
| ambiguous     | Friday mentioned but deliverable scope unknown: clarification, not positive confirmation; missing evidence can remain unclassified.              |
| bothValid     | Check supplied Friday offer and ask a separate missing pickup address if both are explicitly chosen.                                             |
| neitherValid  | Settled receipt of thanks.                                                                                                                       |

Phase 3's which-deliverable positive is not clean confirmation; accepted 8A replacements leave this original distinction unproven.

### confirmation ↔ request

| Contrast      | Evidence and interpretation                                                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| candidateOnly | Not established: a selected request to verify a proposition is already a supported request. Do not invent an exclusive A-positive/B-forbidden label. |
| existingOnly  | Ask to send a known file; no proposition is checked.                                                                                                 |
| ambiguous     | 'Confirm it' lacks a visible proposition and material reason; could mean commit rather than verify.                                                  |
| bothValid     | Verify the supplied Friday offer and separately request the packing list; no extra ask is inferred.                                                  |
| neitherValid  | No reply after settled thanks.                                                                                                                       |

Strong nested duplication is the primary DEFER reason. The two-job contrast does not prove a new atom.

### confirmation ↔ planning

| Contrast      | Evidence and interpretation                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------- |
| candidateOnly | Selected check of an offer before reliance, with no arrangement being made by that message.       |
| existingOnly  | Restate settled Saturday/library agreement without a check.                                       |
| ambiguous     | An apparent agreement with unclear settledness cannot be labeled exclusive from date words alone. |
| bothValid     | Check a supplied offer and separately state a previously agreed next step.                        |
| neitherValid  | Only an emotional acknowledgment.                                                                 |

A date in a question is not enough to add planning or convert an offer to agreement.

### give_constructive_feedback ↔ request

| Contrast      | Evidence and interpretation                                                                                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| candidateOnly | Not established for a corrective ask: its chosen actionable change is a supported request. The hypothesized extra value is the behavior-impact relation, not exclusion of request. |
| existingOnly  | Ask for a file without critique, incident or impact.                                                                                                                               |
| ambiguous     | 'Fix this' lacks incident, impact and chosen scope; do not fabricate them.                                                                                                         |
| bothValid     | Give evidence-grounded feedback and separately request a copy of an existing record, only if both intended.                                                                        |
| neitherValid  | No reply to a closing.                                                                                                                                                             |

Nested request overlap is substantial; compare the strongest request baseline before any later approval.

### give_constructive_feedback ↔ de_escalation

| Contrast      | Evidence and interpretation                                                                   |
| ------------- | --------------------------------------------------------------------------------------------- |
| candidateOnly | Calm supported behavior-impact-change feedback; no heat.                                      |
| existingOnly  | Heated refusal with no feedback incident/impact; user wants civil wording while retaining no. |
| ambiguous     | Angry adjective alone supplies heat but no factual incident; cannot become feedback.          |
| bothValid     | Supported corrective feedback in an accusatory draft with chosen calmer delivery.             |
| neitherValid  | Neutral agreed logistics.                                                                     |

Both rough canonical applications are confounded with de-escalation; later distinctness needs calm cases.

### give_constructive_feedback ↔ boundary_setting

| Contrast      | Evidence and interpretation                                                                                            |
| ------------- | ---------------------------------------------------------------------------------------------------------------------- |
| candidateOnly | One supported unannounced plan change, impact and desired notice; no repeated-pressure limit.                          |
| existingOnly  | Repeated loan requests after a clear no; user only restates no lending, no feedback explanation.                       |
| ambiguous     | First after-8 limit with no repetition fails the frozen boundary prerequisite; use request/expectation if intended.    |
| bothValid     | Repeated interruptions after a limit plus supported impact, selected feedback and restatement of the continuing limit. |
| neitherValid  | Simple progress report.                                                                                                |

Do not inherit the Phase 5 H1 boundary shortcut; first-limit acceptance was explicitly withheld in 8A.

### give_constructive_feedback ↔ acknowledge_mistake

| Contrast      | Evidence and interpretation                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| candidateOnly | Recipient's supported conduct, user impact and desired change.                                                |
| existingOnly  | User owns their incorrect figures and wants to acknowledge that error.                                        |
| ambiguous     | Actor of 'wrong figures' is unknown: no transfer of fault.                                                    |
| bothValid     | User owns a distinct missed deadline and separately gives evidence-grounded feedback about recipient conduct. |
| neitherValid  | No fault in a neutral scheduling exchange.                                                                    |

Preserve separate actors; politeness is not permission to take blame.

### give_constructive_feedback ↔ status_update

| Contrast      | Evidence and interpretation                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------------ |
| candidateOnly | Past interruption impact and chosen correction, with no current-progress reporting goal.                     |
| existingOnly  | Draft completed/review pending, report only.                                                                 |
| ambiguous     | Current missing labels can support both feedback and status if both intended; do not force exclusivity.      |
| bothValid     | Report current unlabeled figures and give supported review-impact feedback with selected request for labels. |
| neitherValid  | Known invitation declined without explanation.                                                               |

Status may cover current-state examples; it is not a compulsory proxy for every historical behavior.

## Acceptance and verification

- The exact focused 34-item 8A approval is separately recorded; other 176 keys are not relabeled human-reviewed.
- Three revision-bound dossiers contain one-job claims, prerequisites, ownership/fact/commitment constraints, exact proposed guidance, mode limits and falsification criteria.
- All 30 source examples are reviewed. Phase 3's deliverable-scope confirmation, perspective denial-changing applications, and the first-limit feedback neighbor retain explicit corrective findings.
- Twelve nearest-neighbor pairs each include five schematic contrasts; relevant additional single skills and strongest valid compositions are documented per candidate.
- Seven private integrity tests cover scoped approval bindings/staleness, historical hashes, candidate/example/matrix digests, production21 parity and import/build/export isolation. They validate structure and isolation, not semantic superiority.
- Current production YAML, generated registry, public contracts, selector, prompts and Phase 7 evidence remain unchanged.

### Exact commands and results

All commands ran from `C:\Users\b\Documents\ChatGPT\AI messager-skills` on branch `skills`.

| Command                                                                | Result                                                                                                                                                                                                                                              |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `git branch --show-current` and `git rev-parse --show-toplevel`        | Exact expected branch and skills-worktree root.                                                                                                                                                                                                     |
| `pnpm exec vitest run packages/skills/tests/phase8b-integrity.test.ts` | Seven tests passed. Initial run had one test-call error: renderRegistry was passed a registry array instead of its optional manifest path. Correcting the test to use renderRegistry() fixed it; production code was unchanged.                     |
| `pnpm lint`                                                            | Pass; includes skills:check and zero-warning ESLint.                                                                                                                                                                                                |
| `pnpm typecheck`                                                       | Pass; all workspace packages and private authoring/tests.                                                                                                                                                                                           |
| `pnpm test`                                                            | Pass: 29 files / 384 tests.                                                                                                                                                                                                                         |
| `pnpm build`                                                           | Pass; all packages and desktop bundles.                                                                                                                                                                                                             |
| `pnpm skills:verify-production`                                        | Pass: 21 exact definitions, 153 ordered plans, unchanged exports, freezing and authoring exclusion.                                                                                                                                                 |
| `pnpm eval:phase4`                                                     | Pass: 21/21 deterministic scenarios; action preservation and no-invention checks 21/21, zero forbidden/unnecessary/conflicting selections. No live flag.                                                                                            |
| `pnpm format:check`                                                    | Pass.                                                                                                                                                                                                                                               |
| Targeted Prettier command below with `--check`                         | Pass; includes the plan/documents excluded by the root formatter.                                                                                                                                                                                   |
| `git -c core.safecrlf=false diff --check`                              | Pass.                                                                                                                                                                                                                                               |
| Read-only scope/report audit below                                     | Pass: 175/176 existing files unchanged; only living plan changed; six additions; 33 Markdown JSON blocks exactly match guidance + 30 proposals; all 34 approval keys and local links present; candidate IDs absent from compiled skills JavaScript. |

Exact targeted formatting command (first run with `--write`, final verification with `--check`):

```powershell
pnpm exec prettier --check --ignore-path .gitignore .agent/plans/skills-phase-8-candidate-evaluation.md docs/skills/phase-8a-focused-human-approval.md docs/skills/phase-8b-candidate-review.md packages/skills/tests/phase8b-integrity.test.ts packages/skills/tests/fixtures/phase8/phase8b-baseline.json packages/skills/tests/fixtures/phase8/focused-human-approval.json packages/skills/tests/fixtures/phase8/candidate-dossiers.json
```

Scope: six additions (two reports, three private JSON artifacts, one integrity test). The sole modified pre-existing file is the living Phase 8 plan. Canonical production YAML, all six historical review/remediation files, Phase 3/5 sources, Phase 7 evidence, schemas, runtime and prompts are byte-identical. Ignored build outputs were rebuilt by the required checks.

### Reproducible scope and report audit

The seven committed-style private tests provide source/digest/schema/isolation coverage. This additional read-only PowerShell audit verifies this delivery's exact working-tree scope, full document/JSON agreement, links and compiled candidate exclusion.

```powershell
@'
import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
import {resolve,dirname} from "node:path";
import {contentDigest} from "./packages/skills/authoring/generator.ts";
const dir="packages/skills/tests/fixtures/phase8/";
const read=p=>readFileSync(p,"utf8");
const baseline=JSON.parse(read(dir+"phase8b-baseline.json"));
const dossier=JSON.parse(read(dir+"candidate-dossiers.json"));
const approval=JSON.parse(read(dir+"focused-human-approval.json"));
assert.equal(execFileSync("git",["branch","--show-current"],{encoding:"utf8"}).trim(),"skills");
assert.equal(execFileSync("git",["rev-parse","--show-toplevel"],{encoding:"utf8"}).trim(),"C:/Users/b/Documents/ChatGPT/AI messager-skills");
const changed=Object.entries(baseline.startingFiles).filter(([p,h])=>createHash("sha256").update(readFileSync(p)).digest("hex")!==h).map(([p])=>p);
assert.deepEqual(changed,[".agent/plans/skills-phase-8-candidate-evaluation.md"]);
const files=[...new Set(execFileSync("git",["ls-files","--cached","--others","--exclude-standard","-z"],{encoding:"utf8"}).split("\0").filter(Boolean))];
const additions=files.filter(p=>!(p in baseline.startingFiles));
assert.deepEqual(additions.sort(),[
"docs/skills/phase-8a-focused-human-approval.md",
"docs/skills/phase-8b-candidate-review.md",
dir+"candidate-dossiers.json",
dir+"focused-human-approval.json",
dir+"phase8b-baseline.json",
"packages/skills/tests/phase8b-integrity.test.ts"
].sort());
const marker=String.fromCharCode(96).repeat(3);
const reportPath="docs/skills/phase-8b-candidate-review.md",report=read(reportPath);
const blocks=[...report.matchAll(new RegExp(marker+"json\\s*([\\s\\S]*?)"+marker,"g"))].map(m=>JSON.parse(m[1]));
assert.deepEqual(blocks,dossier.candidates.flatMap(c=>[c.guidance,...c.examples.map(e=>e.proposed)]));
for(const c of dossier.candidates){assert.ok(report.includes(c.revisionDigest));for(const e of c.examples)assert.ok(report.includes(e.source.text));}
assert.ok(read("docs/skills/phase-8a-focused-human-approval.md").includes(approval.approvalSetDigest));
for(const row of approval.rows)assert.ok(read("docs/skills/phase-8a-focused-human-approval.md").includes("| "+row.key+" "));
for(const doc of [reportPath,"docs/skills/phase-8a-focused-human-approval.md"]){
 for(const m of read(doc).matchAll(/\]\(([^)]+)\)/g)){
  if(!m[1].includes("://")&&!m[1].startsWith("#"))readFileSync(resolve(dirname(doc),m[1].split("#")[0]));
 }
}
for(const path of readdirSync("packages/skills/dist",{recursive:true}).filter(p=>p.endsWith(".js"))){
 const source=read("packages/skills/dist/"+path);
 for(const c of dossier.candidates)assert.ok(!source.includes(JSON.stringify(c.id)),path);
 assert.ok(!/candidate-dossiers|focused-human-approval|phase8b-baseline/.test(source),path);
}
assert.equal(contentDigest(dossier.candidates),dossier.dossierSetDigest);
console.log(JSON.stringify({startingFiles:176,unchanged:175,changed,additions:6,matchingReportBlocks:33,approvalKeys:34,compiledCandidateImports:0,links:"PASS"}));
'@ | node --conditions=development --import tsx --input-type=module
```

## Next step

The human decision packet at the top is the next gate. CONTINUE is a CODEX recommendation only. No candidate is approved or activated, and no later-phase work begins without the user's candidate-specific decision.
