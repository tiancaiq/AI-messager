export type ChallengeReviewDecision = "PASS" | "REVISE" | "QUARANTINE" | "REJECT";
export interface ChallengeReviewRow {
  id: `C${number}` | `M${number}`;
  reviewedRevision: "R1";
  decision: ChallengeReviewDecision;
  reviewerType: "CODEX_SEMANTIC_REVIEW" | "CODEX_STRUCTURAL_REVIEW";
  nativeLanguageGate: "NOT_REQUIRED" | "NATIVE_LANGUAGE_REVIEW_REQUIRED";
  checks: {
    groundingAndNeighbor: boolean;
    intentFactsResponsibility: boolean;
    commitmentsAndCertainty: boolean;
    modeAndDraftRealism: boolean;
    duplicateLineage: boolean;
    primaryAndPairwise: boolean;
  };
  rationale: string;
}

function review(
  id: ChallengeReviewRow["id"],
  decision: "PASS" | "QUARANTINE",
  rationale: string,
): ChallengeReviewRow {
  const nativeLanguageGate =
    decision === "QUARANTINE" ? "NATIVE_LANGUAGE_REVIEW_REQUIRED" : "NOT_REQUIRED";
  return {
    id,
    reviewedRevision: "R1",
    decision,
    reviewerType: decision === "QUARANTINE" ? "CODEX_STRUCTURAL_REVIEW" : "CODEX_SEMANTIC_REVIEW",
    nativeLanguageGate,
    checks: {
      groundingAndNeighbor: true,
      intentFactsResponsibility: true,
      commitmentsAndCertainty: true,
      modeAndDraftRealism: true,
      duplicateLineage: true,
      primaryAndPairwise: true,
    },
    rationale,
  };
}

// Individual raw-first judgments. PASS is Codex review, never human or native-language approval.
export const srs3eChallengeReview: readonly ChallengeReviewRow[] = [
  review(
    "C01",
    "PASS",
    "The user admits taking the reserved table and chooses regret for displaced setup. Ownership may coexist; no separate ranked winner or invented feeling is asserted.",
  ),
  review(
    "C02",
    "PASS",
    "The wrong allergy-list column is explicitly user-sent and caused a held order. Owning that error and apologizing are both supported; neither outranks the other.",
  ),
  review(
    "C03",
    "PASS",
    "The user directly owns a roster omission and a correction. The draft expresses no regret, so apology is excluded without suppressing factual ownership.",
  ),
  review(
    "C04",
    "PASS",
    "The selected goal owns misfiling a permit form; the reviewer is not blamed. No regret was chosen and moving the file is an existing user intention, not a fabricated deadline.",
  ),
  review(
    "C05",
    "PASS",
    "The other person explicitly says they are anxious; an existing stay offer and working generator ground support. Both recognition and reassurance are useful with no guaranteed outcome.",
  ),
  review(
    "C06",
    "PASS",
    "The other person describes weeks of tiring noise. The goal acknowledges that difficulty, while no support fact or end date licenses reassurance.",
  ),
  review(
    "C07",
    "PASS",
    "A visible plant-care worry has a previously agreed watering arrangement. Reassurance can restate that agreement without promising plant survival; validation remains possible but not forced.",
  ),
  review(
    "C08",
    "PASS",
    "The alternate bus is already on the ticket. It supports reassurance about available transport, not a guarantee of arrival; visible concern could also be recognized.",
  ),
  review(
    "C09",
    "PASS",
    "The other party announces another unwanted doorway parcel after repeated discussion and speaks sharply. A continuing no-parcels rule and calmer delivery are both supported.",
  ),
  review(
    "C10",
    "PASS",
    "The other party acknowledges earlier caption requests and presses for an exception. Today's refusal and the future caption rule are chosen; the exchange is not visibly heated enough to require de-escalation.",
  ),
  review(
    "C11",
    "PASS",
    "An explicit parcel accusation creates heat but not proven user ownership or a continuing limit. Checking camera timing preserves the denial and calms delivery without conceding blame.",
  ),
  review(
    "C12",
    "PASS",
    "The bill contains two identical charges according to the selected goal, and the service response is accusatory. Calm factual correction is supported; no continuing boundary is chosen.",
  ),
  review(
    "C13",
    "PASS",
    "The user refuses this one petition signature clearly. No ongoing rule or conflict is visible, so boundary and de-escalation are excluded.",
  ),
  review(
    "C14",
    "PASS",
    "The user declines the offered delivery slot without choosing another slot. Adding planning or an ongoing limit would fabricate a user decision.",
  ),
  review(
    "C15",
    "PASS",
    "The user asks for help interpreting a bus-transfer platform, not a missing referent. Generic request is acceptable; assistance is the specific central job.",
  ),
  review(
    "C16",
    "PASS",
    "The other person has relevant printer experience and the user chooses to ask for help. No duty, urgency or unsupported repair result is inferred.",
  ),
  review(
    "C17",
    "PASS",
    "A visible earlier ramp-width ask remains unresolved after facilities referral. The draft revisits it and explicitly asks for the result, so follow-up and request coexist without blame.",
  ),
  review(
    "C18",
    "PASS",
    "The prior interpreter request was referred but not confirmed. The selected goal checks booking disposition; it does not report the user's own status or presume neglect.",
  ),
  review(
    "C19",
    "PASS",
    "Sprouting is known present state; transplanting is conditional on dry beds. Both status and uncertain future expectation are grounded and neither merits a forced primary.",
  ),
  review(
    "C20",
    "PASS",
    "Working lights and offline audio are current known states. Neither the visible question nor the user's goal supplies an estimate, plan or new request.",
  ),
  review(
    "C21",
    "PASS",
    "The supplier's earliest midweek tile window is supported and unconfirmed. It is future expectation rather than completed status or scheduling an arrangement.",
  ),
  review(
    "C22",
    "PASS",
    "A partial nonempty draft and explicit continuation goal support COMPLETE_DRAFT. A short pre-boarding call is chosen; longer discussion after landing has no invented exact time.",
  ),
  review(
    "C23",
    "PASS",
    "The user proposes an east-gate meeting and asks the helper to bring bags. Planning and request are distinct chosen operations with no justified pairwise winner.",
  ),
  review(
    "C24",
    "PASS",
    "The rehearsal slot is to be chosen only after venue confirmation, which may arrive Wednesday. Planning and cautious expectation coexist; no exact booking is fabricated.",
  ),
  review(
    "C25",
    "PASS",
    "B14 and B41 conflict in visible pickup information. Asking which locker applies resolves one material unknown; a generic request is merely acceptable.",
  ),
  review(
    "C26",
    "PASS",
    "The recurring transfer could mean rent or savings. The goal asks about that one ambiguity before action, not for assistance or unrelated curiosity.",
  ),
  review(
    "C27",
    "PASS",
    "The cabinet code is a known item the user wants from the recipient. No previous ask, assistance task or missing referent is supplied.",
  ),
  review(
    "C28",
    "PASS",
    "The user chooses a concrete buzzer-volume change from staff. No repeated personal pressure, deadline or coercive consequence is supplied.",
  ),
  review(
    "C29",
    "PASS",
    "The user mislabeled an archived guide and promises a tag correction, but does not express regret. This is ownership-only, not an apology inference.",
  ),
  review(
    "C30",
    "PASS",
    "The user asked someone to hold a door while packing and caused a wait. Chosen regret is supported, but no discrete error is stated for mistake acknowledgment.",
  ),
  review(
    "C31",
    "PASS",
    "Alarm tests are explicitly described as exhausting; the already-decent draft recognizes that. With no grounded support fact, reassurance would be invented.",
  ),
  review(
    "C32",
    "PASS",
    "The ride is confirmed, so reassurance is the stated operation. The recipient's nervousness also allows recognition, but the grounded support is the defensible primary distinction.",
  ),
  review(
    "C33",
    "PASS",
    "The ladder loan is a one-time Saturday request and the user refuses only that instance. It does not establish repeated pressure or a continuing rule.",
  ),
  review(
    "C34",
    "PASS",
    "An accusatory key dispute needs a calm evidence-based reply. Ownership is explicitly unresolved, and no continuing personal limit is chosen.",
  ),
  review(
    "C35",
    "PASS",
    "Repeated requests to drop captions are visible; the partial draft refuses this meeting and begins an ongoing rule. Both refusal and boundary are supported, without forced order.",
  ),
  review(
    "C36",
    "PASS",
    "The recipient already has an archive list and the user asks it to be forwarded. No collaborative help is requested; the rough draft preserves the chosen transfer.",
  ),
  review(
    "C37",
    "PASS",
    "The visible menu exchange contains no earlier sheet request. The user now seeks the allergen sheet before ordering, so follow-up is unsupported.",
  ),
  review(
    "C38",
    "PASS",
    "The projector powering on and sound remaining off are known current states. The draft makes no repair estimate or future commitment.",
  ),
  review(
    "C39",
    "PASS",
    "The draft proposes Wednesday and asks the other person to choose between two times. That is active planning plus a request, with no separate availability limit or forecast.",
  ),
  review(
    "C40",
    "PASS",
    "The signs are already installed and photographed. Reporting that state does not create a next-step plan or future estimate.",
  ),
  review(
    "C41",
    "PASS",
    "Two pass types under one name make the reference materially ambiguous. Clarification is primary over a generic request only for this specific inquiry; no separate pass action is asked.",
  ),
  review(
    "C42",
    "PASS",
    "The stairwell map is already identified and held by the other person. Asking for it is a request, not a clarification about which map.",
  ),
  review(
    "C43",
    "QUARANTINE",
    "Two contract return dates structurally support one clarification question, but Simplified Chinese wording and naturalness require qualified native-language review before scoring.",
  ),
  review(
    "C44",
    "QUARANTINE",
    "Repeated charger taking and prior consent requests structurally support the narrow continuing limit; Traditional Chinese wording remains unapproved for efficacy.",
  ),
  review(
    "C45",
    "QUARANTINE",
    "Uploaded webinar slides and captions still being checked are present-state facts with an intentional English term; code-switch naturalness needs native review.",
  ),
  review(
    "C46",
    "QUARANTINE",
    "The selected East Gate meeting answer structurally coordinates place and next movement; Simplified Chinese expression remains unapproved for scoring.",
  ),
  review(
    "C47",
    "PASS",
    "A simple receipt acknowledgement contains no request, status report, limit or other useful capability job; brevity alone was not used as the reason for NONE.",
  ),
  review(
    "C48",
    "PASS",
    "A quick reaction to the observed rainbow is social chatter. Neither the message nor the selected goal contains an ask or plan, so no catalog capability adds useful guidance.",
  ),
  review(
    "C49",
    "PASS",
    "The router sticker's location is neutral information, not progress on a task. A longer sentence would still lack a capability job.",
  ),
  review(
    "C50",
    "PASS",
    "The other person says the matter is fully settled and no further action remains. Brief closure acknowledgement has no unresolved follow-up or new task.",
  ),
  review(
    "C51",
    "PASS",
    "The incomplete fragment identifies the user's blue umbrella once finished; the referent is already clear. COMPLETE_DRAFT is valid but clarification would add an unnecessary question.",
  ),
  review(
    "C52",
    "PASS",
    "The system notice explicitly requires no response and the fixed action is NO_REPLY_NEEDED. Skill eligibility is zero independently of wording length.",
  ),
  review(
    "M01",
    "PASS",
    "The checklist is done but awaits sign-off. Professional English brevity can trim ordinary update filler while preserving both status facts; casual style is unsupported.",
  ),
  review(
    "M02",
    "PASS",
    "An informal noodles invitation supports casual English planning, not professional register. The selected yes does not invent a time or obligation.",
  ),
  review(
    "M03",
    "PASS",
    "The user accepts a Saturday night-market outing. Casual English can keep the normal but slightly stiff draft conversational without dropping the chosen plan.",
  ),
  review(
    "M04",
    "PASS",
    "Audit approval is still pending. A concise professional English status reply fits; casual style would not match the work context.",
  ),
  review(
    "M05",
    "PASS",
    "The user refuses optional installation. Direct respectful English expression changes tone only, while the underlying decline supplies the actual no.",
  ),
  review(
    "M06",
    "PASS",
    "Badge arrival is current status only. Professional concision may fit, but direct-but-polite decision framing would invent a request or refusal.",
  ),
  review(
    "M07",
    "QUARANTINE",
    "The selected repair-record transfer is a request and politeness can modify only its expression; Simplified Chinese quality requires native review.",
  ),
  review(
    "M08",
    "QUARANTINE",
    "Pending supervisor review is a work-status fact, not a request or refusal. Traditional Chinese professional register is structurally plausible but unapproved.",
  ),
  review(
    "M09",
    "QUARANTINE",
    "Equipment field checks are done while records remain unfinished. Concise professional Chinese may preserve that split; native language review is pending.",
  ),
  review(
    "M10",
    "QUARANTINE",
    "The user accepts a casual used-book outing. Natural Chinese expression should preserve the plan, not impose work formality; native review is pending.",
  ),
  review(
    "M11",
    "QUARANTINE",
    "The river meeting time is accepted in a wordy draft. Natural concision may trim redundancy without altering logistics; native review is pending.",
  ),
  review(
    "M12",
    "QUARANTINE",
    "The existing mixed spec-review term is intentionally supplied and the user postpones an invite until timing is known. Code-switch expression needs native review.",
  ),
  review(
    "M13",
    "QUARANTINE",
    "The recipient already uses sprint-board terminology and the user requests its link. Code-switch preservation cannot create the request; native review is pending.",
  ),
  review(
    "M14",
    "QUARANTINE",
    "The selected book-return plan is pure Chinese and calls for natural brevity, not invented English terms. Native review is pending.",
  ),
  review(
    "M15",
    "PASS",
    "The user chooses to ask for their helmet at the trailhead. Direct polite English can soften the rough imperative without adding a deadline or changing the requested action.",
  ),
  review(
    "M16",
    "QUARANTINE",
    "The user chooses to decline a Sunday craft workshop. Chinese politeness may shape expression but cannot invent an excuse; Traditional Chinese naturalness needs native review.",
  ),
];
