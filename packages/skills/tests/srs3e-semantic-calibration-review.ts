export interface SemanticCalibrationReview {
  id: `K${number}`;
  reviewedRevision: "R1";
  decision: "PASS";
  reviewerType: "CODEX_SEMANTIC_REVIEW";
  rationale: string;
}

const review = (
  id: SemanticCalibrationReview["id"],
  rationale: string,
): SemanticCalibrationReview => ({
  id,
  reviewedRevision: "R1",
  decision: "PASS",
  reviewerType: "CODEX_SEMANTIC_REVIEW",
  rationale,
});

// Raw-first judgments on synthetic CALIBRATION_ONLY material; not human approval.
export const srs3eSemanticCalibrationReview: readonly SemanticCalibrationReview[] = [
  review(
    "K01",
    "Receipt of a promised mural photo is already acknowledged; no catalog communication job is needed.",
  ),
  review(
    "K02",
    "A simple photo reaction is social chatter, not emotional validation or reassurance.",
  ),
  review(
    "K03",
    "The draft gives a known color fact and carries no selected request, estimate, or planning action.",
  ),
  review(
    "K04",
    "The other party confirmed receiving the ticket and thanked the user; the thread is complete.",
  ),
  review(
    "K05",
    "The short reaction to a book title is ordinary conversation without a supported strategy skill.",
  ),
  review(
    "K06",
    "The score was reported, thanked, and acknowledged; a further reply is unnecessary.",
  ),
  review(
    "K07",
    "The picnic time is already settled; this is a simple acknowledgment, not active planning.",
  ),
  review(
    "K08",
    "A birthday wish is not a request, commitment, emotional difficulty, or catalog modifier target.",
  ),
  review(
    "K09",
    "The draft states a known swatch color without a future estimate or recipient action.",
  ),
  review(
    "K10",
    "The visibly unfinished prefix completes to the already-set fountain meeting; no new coordination or commitment is needed.",
  ),
  review(
    "K11",
    "Accepting a cup of tea is a trivial response, not a refusal or a planning operation.",
  ),
  review(
    "K12",
    "Acknowledging receipt of a fabric sample is complete; it is not a follow-up or request.",
  ),
  review(
    "K13",
    "The user owns putting badges in the wrong place and says they will correct it; no regret is chosen.",
  ),
  review(
    "K14",
    "The user explicitly chooses to apologize for their own delay; ownership wording may coexist but is not separately required.",
  ),
  review(
    "K15",
    "The other person explicitly expresses feeling overwhelmed and the draft recognizes the difficulty; no support fact justifies reassurance.",
  ),
  review(
    "K16",
    "The concern has a known packed spare lantern; it supports reassurance without promising the lamp will work.",
  ),
  review(
    "K17",
    "One Saturday coverage request receives a decided refusal, with no repeated pressure or continuing rule.",
  ),
  review(
    "K18",
    "The other party admits repeated late-visit asks; the user refuses tonight and sets a continuing after-ten limit. No visible heat requires de-escalation.",
  ),
  review(
    "K19",
    "The earlier request is unresolved after a caretaker check was promised; a status ask both follows up and requests a recipient answer.",
  ),
  review(
    "K20",
    "This is a first-time ask for a blueprint copy, with no earlier unresolved request.",
  ),
  review(
    "K21",
    "The draft proposes a specific rehearsal choice; it does not forecast uncertain timing or capacity.",
  ),
  review(
    "K22",
    "The user chooses a qualified future repair estimate and no active scheduling or known present progress.",
  ),
  review(
    "K23",
    "Two trailheads share a name and are materially ambiguous; the user asks which one was intended. A general request remains acceptable, not required.",
  ),
  review(
    "K24",
    "The chosen message reports a known present count of catalogued boxes, not an uncertain future expectation.",
  ),
];
