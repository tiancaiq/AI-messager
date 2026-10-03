# Phase 5 — Proposed communication registry and canonical examples

Status: research content complete; all changes/additions below await implementation review. Date: 2026-09-15. Input: [Phase 3 normalization](phase-3-capability-normalization.md) and completed [Phase 4 registry design](phase-4-registry-design.md). Next: [Phase 6 evaluation design](phase-6-evaluation-design.md). Numbering refers to the communication research sequence.

## 1. Outcome and count decision

Recommend a first content increment of **24 definition records: 17 universal atoms and seven existing language modifiers**, conditional on validating the three additions. Baseline runtime remains 21. Seven playbook specifications are separate design records: 24 definitions plus seven playbooks equals 31 reviewed concepts, not 31 runtime skills. No claim of a 45–55-entry production catalog is made.

The larger target is intentionally unmet because Phase 3 found only three defensible strong gaps. Encouragement, options, tradeoffs and other possible capabilities stay in review; techniques, aliases, persona styles and scenarios do not supply filler entries. This is the smaller expansion justified by the current evidence. More entries require observed coverage gaps and the same atomicity test.

| Group | Current | Proposed content | Decision |
| --- | --- | --- | --- |
| Universal | 14 | 14 retained IDs with richer boundaries/examples, plus three draft atoms | 17 conditional on candidate approval |
| English modifiers | 3 | Retain IDs/guidance; add canonical examples | 3 |
| Chinese modifiers | 4 | Retain IDs/guidance; add canonical examples | 4 |
| Playbooks | 0 runtime | Seven review-only compositions | Separate catalog, no current runtime loader |
| Merges/renames | 0 | None | Aliases map to existing jobs |
| Additional language rules | 0 | None | Requires independent language evidence |

All 14 current universal cards recommend documentation/example refinement. Their proposed principles may justify a later behavioral revision; migrating files alone must preserve version 1 and original runtime fields. Existing modifiers remain version 1 unless their actual guidance/eligibility changes. Each new candidate would start at runtime version 1 only after approval. A research draft is never `ACTIVE` merely because its specification is complete.

## 2. Example conventions and provenance

Each universal card supplies three positive cases (P1–P3), three negatives (N1–N3), two confusing neighbors (H1–H2), and two application examples (A1–A2). The pair `skill ID + case label` identifies the canonical case. These examples are independently authored synthetic demonstrations, not observed conversations or measured model outputs.

Unless stated otherwise: language is English; fixed action is `SUGGEST_REPLY`; the user has already chosen the stated intent. For application rewrites, action is `REWRITE_DRAFT`. Positives mean the focal skill is useful; negatives forbid it; hard negatives identify the correct neighboring operation. Full multi-skill gold sets belong to Phase 6. A user wishing to ask another person a question can receive wording guidance; the coach's own `ASK_CLARIFICATION`, `SUGGEST_ACTIONS`, and `NO_REPLY_NEEDED` actions still select zero.

Every improvement must preserve all supported facts, uncertainty, decisions and commitments in the example. “Before → after” is an authoring demonstration, not evidence of model uplift. The 21 retained definitions originate from the internal registry. External inspiration for the three additions and playbooks comes from the sources linked in Phase 3; no external example, transcript, catchphrase or dataset is copied. Rights conclusions from Phase 2 remain subject to review before reusing any artifact; these documents use concepts and independent writing only.

## 3. Retained universal definitions

### apology

Family: accountability_repair. Job: express proportionate regret for supported user-owned action or impact. Proposed principles: say what the apology concerns; keep regret proportional; separate apology from future repair commitments. Avoid invented fault, excuses, excessive self-blame and demands for forgiveness. Useful combinations: `acknowledge_mistake`, `expectation_setting`; no intrinsic conflict/dependency.

- P1: User forgot a promised attachment and wants to apologize to a coworker. P2: User arrived late to a friend's dinner and wants to apologize. P3: User supplied incorrect event directions and wants to apologize to attendees.
- N1: Another participant forgot the attachment; user only reports status. N2: User declines an invitation never accepted. N3: User asks the location of a meeting.
- H1: User wants only to correct their own wrong figure without expressing regret → `acknowledge_mistake`. H2: Friend reports an upsetting event unrelated to user → `emotional_validation`.
- A1: Fact: user forgot the attachment; intent: apologize. “sorry forgot file” → “I'm sorry I forgot the attachment.”
- A2: Fact: user arrived late; intent: acknowledge impact and apologize. “sorry you waited” → “I'm sorry I was late and kept you waiting.”

### acknowledge_mistake

Family: accountability_repair. Job: name a supported user-owned error or missed commitment without changing responsibility. Principles: state the concrete error; distinguish observation from explanation; preserve correction commitments only if supplied. Avoid blame shifting and invented causes. Combinations: apology/status/expectation; no dependency.

- P1: User confirms they entered 42 instead of 24 in a report. P2: User forgot a friend's request and wants to acknowledge it. P3: User gave a sibling the wrong address and wants to correct the record.
- N1: A customer made the error. N2: Fault is disputed and user denies responsibility. N3: User gives an ordinary progress report with no error.
- H1: User expresses regret without any identified mistake, for a supported impact → apology may fit. H2: User merely reports an externally caused delay → `status_update`.
- A1: Fact: user entered the wrong total. “the total got mixed up by me” → “I entered the wrong total.”
- A2: Fact: user promised yesterday's call and forgot. “didn't call, forgot” → “I forgot the call I promised yesterday.”

### emotional_validation

Family: recognition_support. Job: acknowledge a visible feeling or difficulty without mind-reading or endorsing disputed facts. Principles: reflect what was expressed; allow the feeling; keep acknowledgement proportional. Avoid diagnosis, minimization, unsolicited solutions and fabricated user fault. Combinations: reassurance; perspective acknowledgement if independently supported.

- P1: Friend explicitly says they are sad after a rejection; user wants to acknowledge it. P2: Coworker says repeated cancellations are frustrating. P3: Family member says a long wait was exhausting.
- N1: Neutral scheduling message has no emotional content. N2: User only wants to confirm a number. N3: User is asked to endorse an unsupported accusation as fact.
- H1: Person states an interpretation without emotion → `perspective_acknowledgement`. H2: User offers a known available source of help to address worry → `reassurance`.
- A1: Visible: “I'm disappointed I didn't get it.” “don't be sad” → “That sounds disappointing.”
- A2: Visible: “The repeated changes have been frustrating.” “ok” → “I can see why those repeated changes were frustrating.”

### reassurance

Family: recognition_support. Job: reduce a visible concern with grounded support while preserving uncertainty. Principles: connect support to known facts; preserve agency; distinguish support from predicting outcomes. Avoid guarantees, dismissal and unapproved commitments. Combination: emotional validation; no dependency.

- P1: Friend worries about attending alone; user confirms they will accompany them and wants to reassure. P2: Coworker worries about lost work; a verified backup exists. P3: Family member worries about a form; user has already offered to review it together.
- N1: User has no evidence to promise success. N2: Neutral message has no concern. N3: Reassurance would contradict user's refusal to help.
- H1: Only acknowledge sadness, with no support fact → validation. H2: Support another's effort without a worry or evidential reassurance → possible encouragement, not automatic reassurance.
- A1: Facts: friend is worried; user has committed to attending too. “don't worry” → “You won't have to go alone—I'll be there with you.”
- A2: Fact: backup exists, recovery outcome unknown. “everything is fine” → “We have a backup to work from, although we still need to check what can be restored.”

### boundary_setting

Family: decisions_limits. Job: state the user's supported limit clearly. Principles: name limit and scope; use user-controlled actions; preserve firmness under pressure. Avoid identity attacks, invented consequences, appeasement and unnecessary apology. Combinations: decline/de-escalation; no dependency.

- P1: User wants repeated late-night nonurgent work calls to stop. P2: Friend repeatedly asks for money; user has decided not to lend. P3: Family member keeps sharing user photos; user wants prior consent.
- N1: User has made no choice about the limit. N2: User asks which time a task is due. N3: User wants only a neutral progress update.
- H1: One invitation refused without an ongoing limit → decline. H2: Known delivery estimate without a behavioral limit → expectation setting.
- A1: User's limit: no nonurgent work calls after 8 p.m. “stop calling late” → “Please keep nonurgent work calls before 8 p.m.”
- A2: User's choice: no more lending. “quit asking me for cash” → “I'm not able to lend you money. Please stop asking.”

### de_escalation

Family: conflict_feedback. Job: reduce unnecessary intensity while preserving the supported position. Principles: replace accusations with the issue; keep limits explicit; use a next step only if supplied. Avoid forced concessions, moral lectures and silencing justified concerns. Combinations: boundary/feedback/clarification; no dependency.

- P1: Coworker conflict; user wants to disagree calmly about recorded figures. P2: Heated family discussion; user wants a calm restatement of their limit. P3: Friend dispute over plans; user wants to ask about a discrepancy without accusation.
- N1: Calm neutral coordination. N2: User wants the model to force agreement through guilt. N3: Supposed conflict is inferred solely from punctuation.
- H1: Civil statement of a limit → boundary, no need to invent conflict. H2: Resolving a multi-step dispute → a playbook, not just de-escalation.
- A1: User disputes a total and wants joint checking. “your numbers are nonsense, check them” → “I don't think these totals match. Can we check the figures together?”
- A2: User declines an extra shift despite pressure. “stop being ridiculous, I said no” → “I understand this is difficult, but I can't take the extra shift.”

### decline

Family: decisions_limits. Job: communicate a fixed refusal without adding an excuse or future commitment. Principles: make the no clear; keep any supplied reason truthful; do not offer an alternative unless intended. Avoid false hope and refusal reversal. Combinations: boundary; de-escalation when visibly useful.

- P1: User chooses not to attend a friend's party. P2: User refuses an extra work assignment. P3: User declines a service upgrade.
- N1: User chose accept. N2: User is still deciding. N3: User wants details before choosing.
- H1: Repeated request plus ongoing limit → boundary may also apply. H2: User cannot do Tuesday but explicitly offers Friday → planning/alternative wording must preserve that conditional choice.
- A1: User refuses; no reason given. “nah not going” → “Thanks for inviting me, but I won't be coming.”
- A2: User cannot accept another task. “can't take this” → “I can't take on this additional task.”

### ask_for_help

Family: requests_options. Job: ask for a specific form of assistance without creating an obligation. Principles: identify help needed and relevant known context; make scope answerable; preserve a truthful opportunity to decline. Avoid invented urgency/authority. Neighbor: generic request; no dependency.

- P1: User wants a coworker's help checking a formula. P2: User wants a friend's help carrying a table. P3: User asks a tutor for help understanding a proof.
- N1: User only reports a finished task. N2: Help was explicitly refused and user intends to pressure the recipient. N3: User wants to give assistance, not request it.
- H1: Asking someone to send a document without assistance framing → request. H2: Asking what “tomorrow” refers to → clarification.
- A1: User seeks help checking one formula. “help spreadsheet” → “Could you help me check this formula?”
- A2: User seeks help carrying a table; no date or urgency supplied. “need you carry table” → “Would you be able to help me carry the table?”

### follow_up

Family: coordination. Job: revisit a visible earlier request without assuming neglect. Principles: reference earlier ask briefly; state the next needed response; preserve known timing. Avoid implying blame from silence or manufacturing a prior agreement. No dependency on request, though its wording may help.

- P1: Earlier draft review request is visible; user wants a status check. P2: Earlier invitation is visible; user wants to check attendance. P3: Earlier repair appointment request is visible; user asks for an update.
- N1: No earlier request is visible or user-supplied. N2: Earlier request was answered fully. N3: Recipient declined and user wants to guilt them into changing their mind.
- H1: First request for the report → request. H2: User shares their own review progress → status update.
- A1: Visible earlier report-review request. “why haven't you replied” → “Following up on my report-review request—have you had a chance to look?”
- A2: Visible earlier appointment request. “any news” → “Is there an update on the appointment I requested?”

### status_update

Family: coordination. Job: communicate the known present state without inventing progress or timing. Principles: lead with current status; distinguish completed from pending; include only supported blockers/next steps. Avoid interpreting plans as completed work. Combinations: acknowledgement/expectation.

- P1: User reports two sections finished and one pending. P2: User tells a friend their train is delayed. P3: User tells a customer an item has shipped, supported by visible confirmation.
- N1: Status is unknown and user wants to ask for it. N2: User wants to invent progress to reassure a manager. N3: Message only sets a future availability limit.
- H1: “Probably tomorrow” is a future estimate → expectation setting. H2: Arranging who does the next step → planning.
- A1: Facts: draft complete, review not started. “done draft review later” → “The draft is complete; the review hasn't started yet.”
- A2: Fact: train delayed; arrival unknown. “train late dunno arrival” → “The train is delayed, and I don't have a new arrival time yet.”

### expectation_setting

Family: coordination. Job: communicate supported future timing or limits with the user's certainty intact. Principles: separate estimate from promise; identify scope; state uncertainty plainly. Avoid hardening probability, adding dates or hiding a known limit. Combinations: status/acknowledgement/planning.

- P1: User estimates a draft will probably be ready tomorrow. P2: User says a visit can last only one hour. P3: User can review one chapter this week, not the full manuscript.
- N1: User has no timing or scope information. N2: Task is already completed and only completion is reported. N3: User asks what another person expects without offering their own expectation.
- H1: Present progress without future timing → status update. H2: Ongoing rule against unwanted contact → boundary.
- A1: User says probably tomorrow. “will finish tomorrow probably” → “I expect to finish tomorrow, but that isn't certain yet.”
- A2: User can review one chapter this week. “can review it, one chapter only this week” → “I can review one chapter this week.”

### planning

Family: coordination. Job: make supported logistics and next steps clear. Principles: preserve agreed time/place; distinguish proposed from confirmed; ask for only necessary missing logistics. Avoid invented availability and unchosen alternatives. Combinations: request/expectation; no dependency.

- P1: Friends have agreed to Saturday at 2 p.m.; user summarizes the plan. P2: Coworkers have agreed who sends and who reviews a draft. P3: Family members coordinate a pickup with supplied place/time.
- N1: User has not decided whether to attend. N2: User only reports completed work. N3: User explicitly refuses all offered times.
- H1: Ask someone to start a new task → request. H2: Check whether an apparent agreement is accurate → confirmation candidate.
- A1: Agreed plan: Saturday, 2 p.m., library. “sat 2 library then” → “See you at the library on Saturday at 2 p.m.”
- A2: User proposes, not commits to, 3 p.m. “maybe meet 3?” → “Would 3 p.m. work for you?”

### clarification

Family: understanding_inquiry. Job: ask one question resolving a material missing or ambiguous detail in the user's intended message. Principles: pinpoint the unknown; avoid re-asking known content; keep focus narrow. Avoid optional interviews and unsupported assumptions. Neighbor: confirmation; no dependency.

- P1: “Send the file” refers to two files; user wants to ask which. P2: A friend says “the café,” with two plausible locations. P3: A tutor mentions “chapter three” without specifying which of two books.
- N1: The requested detail is explicit and already understood. N2: User seeks an unrelated curiosity question. N3: Fixed action is the coach's own ASK_CLARIFICATION; skills remain NONE.
- H1: Apparently understood Friday deadline needs final verification → confirmation. H2: Asking recipient to send a known file → request.
- A1: Two reports are plausible. “which report do you mean” → “Do you mean the sales report or the budget report?”
- A2: Two café branches are plausible. “which café” → “Which café location do you mean?”

### request

Family: requests_options. Job: state a supported desired action clearly without assuming agreement. Principles: name action and known scope; express a need directly; leave room for truthful response. Avoid manufactured urgency, consequences, authority and relationship tests. Combinations: planning/decline alternatives only if user intends them.

- P1: User wants a coworker to send the agenda. P2: User asks a friend to return a book. P3: User asks a service provider to email a receipt.
- N1: User has no chosen requested action. N2: User wants to test whether silence makes someone reach out. N3: User is reporting, not requesting, a completed action.
- H1: Explicit need for assistance carrying something → ask for help. H2: Visible earlier unanswered agenda request → follow-up.
- A1: User wants the agenda; no deadline supplied. “send agenda” → “Could you send me the agenda?”
- A2: User wants more frequent calls and has chosen to ask. “you should know I want calls” → “I'd like us to call more often. Would you be open to that?”

## 4. New universal candidate specifications

All three are `ATOMIC`, universal-language, research state DRAFT; initial proposed runtime version 1. Fixed eligible wording actions remain REWRITE_DRAFT, COMPLETE_DRAFT and SUGGEST_REPLY. No dependencies, blanket suppression rules or new production conflict declarations are proposed. Each source note refers to conceptual inspiration only; all guidance and examples here are original.

### perspective_acknowledgement — Acknowledge a stated perspective

| Field | Specification |
| --- | --- |
| Family / definition | recognition_support. Help the user recognize another person's stated interpretation without agreeing with disputed facts or inventing their feelings. |
| Why existing skills cannot cover it | Validation names an emotional experience; clarification asks for unknown detail; reassurance offers grounded support. None explicitly recognizes an interpretation while withholding factual agreement. Composing them can add emotion, a question or reassurance absent from the user's goal. |
| Relationships / situations | Coworker, friend, family, customer; misunderstanding, disagreement, explanation of a concern. |
| Should trigger | A visible interpretation is attributed to the other person, user intends to acknowledge it, and recognition adds useful framing. Proposed semantic intent: acknowledge_perspective. |
| Should not trigger | No expressed interpretation; only a feeling; user wants the model to assert the interpretation is true; question action fixed upstream. |
| Principles | Identify the stated reading; tie it only to visible information; distinguish understanding from endorsement. |
| Avoid | Invented motives, false agreement, emotion diagnosis, insincere formulaic validation. |
| Neighbors | emotional_validation: feeling rather than interpretation. clarification: resolving missing information rather than recognizing known perspective. |
| Compatible / potential tension | Validation when a feeling is separately stated; clarification for a separate material unknown; de-escalation for real conflict. Reassurance must not contradict a legitimate concern. No pair is inherently conflicting. |
| Score / provenance | Phase 3 score 14/14. Thanos listening/empathy vocabulary, Wondel tactical empathy and EQ acknowledgement dimensions; independently authored, no source dialogue reuse. |

- P1: Coworker says a silent schedule change looked like deprioritization; user wants to acknowledge how it appeared without agreeing about motive. P2: Friend says a short reply seemed dismissive; user wants to recognize that interpretation. P3: Customer says the two listed prices make the offer look inconsistent; user wants to acknowledge the reading while checking facts.
- N1: Only “I'm sad” is visible. N2: User is asked to claim “They secretly dislike you” without evidence. N3: A neutral time confirmation contains no interpretation.
- H1: “The cancellations made me frustrated” with intent only to recognize feeling → emotional_validation. H2: “Which price is correct?” with no interpretation to recognize → clarification or a factual answer, as supported.
- A1: Visible: friend read the brief reply as dismissive; user wants to acknowledge that reading. “you read it wrong” → “I can see how my short reply came across as dismissive.” No concession about intention is added.
- A2: Visible: changed schedule looked like deprioritization; no motive conceded. “not what it meant” → “I can see why the schedule change looked like your task had been deprioritized.” No promise or invented explanation follows.

### confirmation — Verify understood information

| Field | Specification |
| --- | --- |
| Family / definition | understanding_inquiry. Help the user verify an apparently understood, material proposition before relying on it. |
| Why existing skills cannot cover it | Current clarification targets a missing detail; planning/status tend to state known information. Confirmation needs a tentative proposition and bounded check without converting it into a promise. Its unnecessary-question negative cases justify separate review. |
| Relationships / situations | Coworker, friend, customer, family; handoff, booking, coordination, consequential request. |
| Should trigger | User intends verification, one interpretation is available, and relying on it matters; proposed semantic intent confirm_understanding. |
| Should not trigger | Information is missing between alternatives; verification is needless; user did not choose to ask; upstream ASK_CLARIFICATION/NO_REPLY_NEEDED. |
| Principles | State the interpretation being checked; preserve tentative status; verify one material point. |
| Avoid | Asserting an unaccepted commitment, repeating settled trivialities, adding new terms. |
| Neighbors | clarification: uncertain/missing information. planning: arrange or state agreed logistics. |
| Compatible / potential tension | Planning or expectation setting if separately supported; summaries are tactics. A conflicting asserted date is an evidence error, not reason for a blanket planning conflict. |
| Score / provenance | Phase 3 score 13/14, with composition overlap acknowledged. Thanos confirmation and Wondel summarization concepts; independent examples. |

- P1: A colleague offered Friday delivery; user wants to verify that offer before scheduling dependent work. P2: Friend proposed two seats; user wants to confirm the quantity before booking. P3: Customer appears to have chosen collection; user wants to verify before arranging it.
- N1: “Thursday or Friday” remains unresolved; user needs the date. N2: A trivial “thanks” requires no response. N3: The coach is choosing whether to ask clarification rather than wording the user's selected check.
- H1: Two possible meeting rooms, no understood choice → clarification. H2: Confirmed Saturday meeting simply restated as agreed → planning, not a new confirmation question.
- A1: Visible offer: “I can deliver Friday”; user intends verification. “Friday is the delivery right?” → “Just confirming: you're offering delivery on Friday, correct?”
- A2: Visible proposal: two seats; user wants verification before booking. “two seats?” → “Before I book, can you confirm that you need two seats?” Booking is user-stated conditional intent, not a new completed action.

### give_constructive_feedback — Give behavior-focused feedback

| Field | Specification |
| --- | --- |
| Family / definition | conflict_feedback. Help the user communicate an observed behavior, supported impact and desired change without attacking identity or assuming motives. |
| Why existing skills cannot cover it | Request + de-escalation + boundary can ask calmly for a limit yet omit the observed behavior/impact that makes feedback specific. The distinct evidence check and behavioral structure warrant a candidate; later uplift must beat composition. |
| Relationships / situations | Coworker, friend, family, service contact; repeated interruption, review, correction, friction. |
| Should trigger | User wants feedback, observations/impact are supported, and a concrete desired change is supplied or unambiguously expressed. Proposed semantic intent give_feedback. |
| Should not trigger | Motive speculation, unsupported allegation, ordinary scheduling limit, no user intent to critique. |
| Principles | Name specific observed behavior; describe supported impact without diagnosis; express the supplied actionable change respectfully. |
| Avoid | Identity labels, humiliation, fabricated incidents, false authority, invented corrective commitments, exaggerating frequency. |
| Neighbors | boundary_setting: communicate a limit. raise_concern: provisional risk without a behavior allegation. acknowledge_mistake: user's own fault. |
| Compatible / potential tension | Request, boundary, de-escalation if separately needed. Apology only for independently supported user responsibility. Do not blanket-conflict feedback with validation. |
| Score / provenance | Phase 3 score 13/14, composition overlap still to test. Wondel difficult conversations, EQ social dexterity, Tong dignity observations; concepts only, original text. |

- P1: User was interrupted twice and says they could not finish; wants colleague to let them finish. P2: Friend changed agreed plans without telling user, causing a wasted trip; user wants earlier notice. P3: User found unlabeled figures hard to review and wants labels added by the author.
- N1: User merely guesses a coworker is sabotaging them. N2: User only says they cannot attend tonight. N3: User wants to acknowledge their own incorrect figures.
- H1: “Please don't call after 8 p.m.” without a feedback explanation → boundary_setting. H2: “I'm worried this estimate may omit travel” without a proven mistake → raise-concern draft or clarification, not an accusation.
- A1: Facts: two interruptions prevented user finishing; change desired: let user finish. “you're rude, stop it” → “I was interrupted twice and couldn't finish my point. Please let me finish before responding.”
- A2: Facts: unlabeled figures made review difficult; requested change: labels. “this is a mess, label it” → “I found the unlabeled figures difficult to review. Could you add labels?”

## 5. Retained language modifiers

Kind: LANGUAGE_MODIFIER; family: language_expression; internal provenance; existing guidance/IDs remain the baseline. These examples illustrate expression and eligibility, not cultural inference. All application actions are REWRITE_DRAFT. English/Chinese eligibility is determined by current visible primary language and supported code-switching, not recipient ethnicity or contact history. Unsupported primary languages remain universal-only. No modifier depends on a universal atom being selected, although combinations can be useful.

### en.professional_conciseness

Job: concise professional English for status, request and follow-up. Principle: lead with relevant information in natural chat form. Avoid ceremonial greetings, corporate filler or deleting material qualifications. Neighbors: casual naturalness and direct-but-polite; no declared conflict.

- P1: English progress update to a coworker. P2: English document request in a professional chat. P3: English follow-up on a visible review request.
- N1: Unsupported primary language. N2: Chinese-only message. N3: Upstream NO_REPLY_NEEDED.
- H1: Brief personal weekend planning → en.casual_naturalness. H2: Preserving refusal clarity → en.direct_but_polite, possibly both only when supported.
- A1: “I would like to take this opportunity to inform you that the draft is ready” → “The draft is ready.”
- A2: “I was just wondering if it would be possible for you to send the agenda” → “Could you send the agenda?”

### en.casual_naturalness

Job: natural concise English for casual replies and planning. Principle: use conversational wording at the user's level of familiarity. Avoid stiff email framing, invented affection and forced slang. Neighbor: professional conciseness.

- P1: Friends coordinate lunch in English. P2: User accepts an informal invitation. P3: User restates an agreed weekend meeting.
- N1: Unsupported primary language. N2: Chinese-only chat. N3: No chosen reply intent and action is SUGGEST_ACTIONS.
- H1: Professional progress report → professional_conciseness. H2: Refusal needs explicit clarity → direct_but_polite; casual tone must retain the no.
- A1: Confirmed 6 p.m. plan. “I shall see you at six o'clock” → “See you at six.”
- A2: User proposes Saturday. “Would Saturday be an agreeable day for you?” → “Does Saturday work for you?”

### en.direct_but_polite

Job: express an English request, refusal or limit clearly and respectfully. Principle: preserve the decision and use proportionate politeness. Avoid ambiguous softening and invented excuses. Neighbors: decline/boundary are universal jobs; this is expression.

- P1: User declines an English invitation. P2: User makes a clear English request. P3: User states a limit in English under repeated pressure.
- N1: Unsupported primary language. N2: Chinese-only reply. N3: User's accept/refuse decision remains unknown.
- H1: Current progress report without request/decision → professional_conciseness. H2: Providing an actual refusal → decline supplies job; modifier alone cannot decide refusal.
- A1: “No, not doing that extra task” → “I can't take on that extra task.”
- A2: “Send me the file” → “Please send me the file.”

### zh.politeness_calibration

Job: natural Chinese politeness for a request, refusal or boundary. Principle: match visible register while preserving meaning. Avoid excessive honorifics and evasiveness. Applies to Simplified and Traditional Chinese; no culture/persona assumption.

- P1: Simplified Chinese request for a document. P2: Traditional Chinese invitation refusal. P3: Chinese boundary wording under pressure.
- N1: English-only chat. N2: Unsupported primary language even with a Chinese secondary term. N3: Upstream ASK_CLARIFICATION.
- H1: Chinese progress report → professional_formality. H2: User refuses an invitation → decline handles decision; politeness cannot invent a reason.
- A1: “把文件发来” → “请把文件发给我。”
- A2: “我不去了” → “謝謝邀請，不過我不去了。” Script changes here follow the stated Traditional Chinese target, not the modifier inferring a locale.

### zh.professional_formality

Job: concise professional Chinese for status, delay and follow-up. Principle: preserve facts and certainty in a practical work-chat register. Avoid bureaucratic filler and stronger promises. Neighbors: natural_conciseness and politeness_calibration.

- P1: Simplified Chinese draft progress update. P2: Traditional Chinese update about a missed commitment. P3: Chinese follow-up on visible work review.
- N1: English-only chat. N2: Unsupported primary language. N3: No wording action is required.
- H1: Casual Chinese weekend plan → natural_conciseness. H2: Chinese refusal/request → politeness_calibration as appropriate.
- A1: “关于这个报告目前的情况呢就是初稿已经完成了” → “报告初稿已完成。”
- A2: “應該可能明天可以完成吧” → “預計明天可以完成，但還不確定。”

### zh.natural_conciseness

Job: concise natural Chinese chat wording for planning, invitations and requests. Principle: remove redundant wording while preserving constraints. Avoid literal translation patterns, unnecessary subjects and loss of uncertainty. Neighbor: professional_formality.

- P1: Simplified Chinese friend planning. P2: Traditional Chinese casual invitation response. P3: Chinese request containing redundant wording.
- N1: English-only context. N2: Unsupported primary language. N3: Upstream NO_REPLY_NEEDED.
- H1: Formal work progress report → professional_formality. H2: Intentional mixed terms → code_switching may additionally fit.
- A1: Agreed Saturday meeting. “那我们就按照我们说好的在周六见面吧” → “那就周六见。”
- A2: User asks for a time. “請問你可不可以告訴我一下時間是幾點呢” → “請問是幾點？”

### zh.code_switching

Job: preserve intentional English terms in supported Chinese/mixed chat. Principle: retain meaningful terms already visible without adding jargon. Avoid forced monolingual conversion, mistranslating identifiers, or applying a Chinese convention to unsupported-primary language.

- P1: Chinese primary status chat uses “PR.” P2: Chinese planning chat uses “demo.” P3: Supported mixed request already uses “design review.”
- N1: Pure Chinese without intentional English terms. N2: English-only context without code-switching. N3: Korean primary with Chinese secondary, even when mixed.
- H1: Natural short Chinese without mixed terms → natural_conciseness. H2: Quoted identifier in otherwise unsupported language → preserve identifier generally, but do not select Chinese modifier.
- A1: “这个 PR 我已经看过了，没发现问题” → “这个 PR 我看过了，没发现问题。”
- A2: “我們的 demo 時間還沒有確認下來” → “demo 時間還沒確認。”

## 6. Playbook specifications

All IDs below are design identifiers outside the existing skill ID schema. They are neither runtime atoms nor instructions to select every component. Order is conditional on visible evidence and user intent. A request can need only one useful step. No dependency graph is proposed. Language modifiers can shape wording independently, within the existing four-definition bound for any eventual runtime plan.

| ID / name | Trigger and required core | Optional / conditional components and order | Do not use; examples and counterexamples; why composed |
| --- | --- | --- | --- |
| `playbook.understanding_check` / Understanding exchange | User wants to understand a material statement. Core: clarification for a missing detail OR candidate confirmation for an understood proposition. | Acknowledge a visible feeling/perspective first if helpful; summarize only as a tactic; ask at most the needed question. | Do not use for settled trivial information or upstream NO_REPLY_NEEDED. Example: verify agreed scope before relying on it. Counterexample: ordinary thanks. Inquiry and acknowledgement are distinct jobs. |
| `playbook.conflict_resolution` / Discuss a disagreement | Visible disagreement and user wants to discuss it. Core: supported request, limit or feedback corresponding to the actual goal. | Recognize stated perspective/feeling → de-escalate if heated → necessary clarification → core position → supported next step. | Do not impose reconciliation or concede refusal. Example: calmly discuss conflicting task figures. Counterexample: user simply declines a party invitation. Understanding, tone, limits and coordination have separate functions. |
| `playbook.relationship_repair` / Address supported relational impact | Supported user-caused impact and user wants repair. Core: apology or acknowledgement, as intended. | Validate visible impact → supported repair request/plan → grounded reassurance only when facts support it. Order may put acknowledgement before validation. | No invented fault or forgiveness. Example: apologize for cancelling and ask whether recipient wants to reschedule, only if user chose that. Counterexample: receiving an insult without user responsibility. Regret, recognition and planning are separable. |
| `playbook.difficult_feedback` / Discuss behavioral feedback | User intends supported behavior-focused feedback. Core: give_constructive_feedback candidate. | Perspective acknowledgement if visible → core feedback → request or boundary → clarification of response if material. De-escalation only when heated. | Do not accuse based on suspicion. Example: discuss interruptions and request time to finish. Counterexample: user reporting their own mistake. Feedback delivery is one job; the surrounding exchange has several. |
| `playbook.negotiation` / Discuss feasible options | User intends to negotiate and actual constraints/options are supplied. Core: supported request or limit. | Clarify necessary constraints → core request/limit → planning to present supplied options → explain user-supplied tradeoffs as guidance → confirmation if needed. Possible alternative/tradeoff atoms remain deferred. | No invented prices, concessions, authority or urgency. Example: user offers two available delivery slots. Counterexample: user has fixed refusal with no offer to negotiate. Several choices and messages make this a sequence. |
| `playbook.supportive_response` / Respond to visible distress | User wants to support a person who has expressed distress. Core: emotional_validation. | Grounded reassurance if support facts exist; no advice/question unless the user intends it and it materially helps. Encouragement remains possible future refinement. | No outcome guarantees or invented shared experiences. Example: acknowledge disappointment and repeat an already-offered source of help. Counterexample: neutral logistics message. Recognition and grounded support differ. |
| `playbook.missed_commitment` / Address a missed commitment | User owns a visible missed commitment and wants to explain current status. Core: acknowledge_mistake and/or status_update, depending on intent. | Apology when intended → present status → expectation_setting only with supported estimate → planning only with user-approved next step. | No invented delay cause or new deadline. Example: missed draft delivery, known progress, uncertain tomorrow estimate. Counterexample: recipient missed the task and user is only reporting it. Existing atoms already supply the separate jobs. |

## 7. Deferred candidates and proliferation audit

| Candidate | Phase 5 disposition | Evidence required to revisit |
| --- | --- | --- |
| encouragement | DEFER; reassurance extension may cover grounded support | Agency/effort cases with marginal usefulness beyond validation/reassurance, plus false-praise negatives. |
| propose_alternative | DEFER; present supplied options through planning/request | Cases needing independent option framing without changing refusal or commitments. |
| tradeoff_framing | DEFER; user-supported rationale within coordination | Demonstrate a single reusable job and reliable preservation of supplied tradeoffs. |
| explore_constraints / preference elicitation | DEFER; concrete unknown usually clarification | Necessary inquiry examples that do not expand questioning or duplicate clarification. |
| raise_concern | DEFER; distinguish provisional risk from feedback | Useful concern expression without unsupported allegation, across contexts. |
| receive_feedback | DEFER; likely a composed exchange | Evidence that acknowledgement/clarification/apology when supported are insufficient. |
| explain_rationale / address_stated_concern | DEFER | Independent routing/usefulness beyond current response generation and perspective acknowledgement. |
| express_appreciation | DEFER | Cross-context guidance benefit beyond ordinary wording without flattery. |
| supported self-disclosure | DEFER | User intent and autobiographical evidence; demonstrate added value without invented experience. |

No new atom is created for face-saving, humor, directness, mirroring, labeling, summarization, persona imitation, conflict avoidance, relationship domains, or a renamed existing capability. Their appropriate homes and exclusions remain in Phase 3. The three strong atoms pass the conceptual job/neighbor/example audit; empirical non-composability and useful output improvement remain hypotheses for Phase 6.

## 8. Completion record and handoff

- Inventory: 14 retained universal cards, three new draft universal cards, seven retained modifier cards, seven separate playbook specifications; no merged or renamed IDs.
- Canonical material: each of 24 definition cards contains P1–P3, N1–N3, H1–H2, A1–A2, totaling 240 authored case entries. These are authoring examples and can overlap semantically; they are not 240 held-out evaluation trials.
- Strong additions include the required why-not-existing/composition rationale, cross-context examples, principles/avoidance, neighbor/compatibility considerations, provenance, and unapproved status.
- Count exception: 24 proposed definitions falls below the approximate 45–55 target. The brief prioritizes defensible coverage; no padding is proposed. Seven playbooks are not added to the runtime count.
- Validation target for Phase 6: compare each candidate against generic generation and the best existing composition; test hard negatives, action/intent integrity, zero selection, language and prompt boundaries. No live quality result is asserted here.
- Documentation verification: formatting passed; a read-only structural audit confirmed 24 cards and one occurrence of each P1–P3/N1–N3/H1–H2/A1–A2 label per card. See the [verification record](phase-6-evaluation-design.md#documentation-verification-for-phases-4-6).
