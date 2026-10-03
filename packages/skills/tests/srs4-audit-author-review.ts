import type { Srs4AuditRaw } from "../../test-fixtures/src/srs4-audit-raw.js";

export interface Srs4AuditAuthorReview {
  id: Srs4AuditRaw["id"];
  reviewedRevision: "R1";
  reviewerType: "CODEX_AUTHOR_SELF_REVIEW";
  independentReview: "PENDING";
  decision: "PROVISIONAL_PASS" | "QUARANTINE";
  rationale: string;
}

// This checks authoring semantics separately from retrieval/model output. It is
// explicitly NOT an independent or human approval and cannot unlock live calls.
const rationales: readonly [Srs4AuditRaw["id"], string][] = [
  [
    "A01",
    "User-hosted noise caused visible inconvenience; regret is supported, but no user error is identified.",
  ],
  ["A02", "The draft names the user's wrong attachment and correction without chosen regret."],
  ["A03", "The user asks for assistance finding an index rather than checking a prior thread."],
  [
    "A04",
    "User history establishes a continuing late-night call limit; a specific refusal may coexist.",
  ],
  ["A05", "The word final has two material referents; the user asks which one was meant."],
  [
    "A06",
    "The OTHER message is visibly heated and the user draft aims to lower heat without a limit.",
  ],
  ["A07", "The draft refuses one supper invitation, with no chosen standing participation rule."],
  [
    "A08",
    "OTHER explicitly reports disappointment; the user recognizes it without predicting an outcome.",
  ],
  ["A09", "The user draft states a possible Thursday estimate and preserves lack of confirmation."],
  [
    "A10",
    "The visible USER request and OTHER promise to look support a check-back on that matter.",
  ],
  [
    "A11",
    "The draft proposes a concrete practice time rather than merely estimating future capacity.",
  ],
  [
    "A12",
    "OTHER asks whether the user is listening; the draft truthfully affirms present attention.",
  ],
  ["A13", "USER says this dataset was not requested before; the selected goal asks for its copy."],
  [
    "A14",
    "USER-authored history gives the gauge reading; the goal asks to report it without a plan.",
  ],
  ["A15", "USER explicitly reports the spill, so chosen regret has grounded user responsibility."],
  [
    "A16",
    "USER admits the form-entry typo; the objective owns it without adding regret or a new date.",
  ],
  [
    "A17",
    "USER describes a phrase they cannot understand; the objective asks another person for help.",
  ],
  ["A18", "USER history states a recurring weekend-work limit before OTHER repeats a weekend ask."],
  [
    "A19",
    "Two packet meanings remain open, so the chosen message seeks the material disambiguation.",
  ],
  ["A20", "OTHER's accusation is visibly heated; the chosen goal lowers heat and adds no limit."],
  ["A21", "The user chooses not to join one race; no continuing no-race boundary is stated."],
  [
    "A22",
    "OTHER explicitly names recital nerves; the chosen response acknowledges them without a promise.",
  ],
  [
    "A23",
    "The USER draft itself supplies Friday as tentative, so goal text is not sole timing proof.",
  ],
  [
    "A24",
    "A prior USER manual request and OTHER search are visible; the unfinished draft checks back.",
  ],
  ["A25", "The USER draft owns a signup reading mistake and explicitly expresses regret."],
  ["A26", "The draft asks for a file and separately clarifies which of two formats is final."],
  ["A27", "The USER draft separates completed first pass from uncertain second-pass timing."],
  [
    "A28",
    "OTHER expresses upset; USER draft recognizes it and deliberately cools a tense exchange.",
  ],
  [
    "A29",
    "The draft requests studio use and proposes arranging a time, two distinct communication jobs.",
  ],
  [
    "A30",
    "USER history states an ongoing no-overnight limit; draft also refuses tonight's specific shift.",
  ],
  [
    "A31",
    "USER history grounds the wrong upload and corrected current state; regret is explicitly chosen.",
  ],
  [
    "A32",
    "USER admits missed booking and an ability to check rooms today, supporting ownership and plan.",
  ],
  [
    "A33",
    "The objective asks for assistance reviewing and a separate editable file; no prior thread exists.",
  ],
  [
    "A34",
    "OTHER visibly feels worried and alone; USER says they can listen tonight, grounding reassurance.",
  ],
  [
    "A35",
    "USER's earlier request remains pending and their tentative review start is USER-authored.",
  ],
  [
    "A36",
    "The user-authored availability supports time coordination while the goal asks to reserve the hall.",
  ],
  [
    "A37",
    "USER's ongoing late-night limit survives an angry OTHER message; calm wording is also useful.",
  ],
  [
    "A38",
    "USER states current inventory completion; the goal separately coordinates a review slot.",
  ],
  [
    "A39",
    "OTHER explicitly worries about future contact; USER draft offers support and tentative timing.",
  ],
  ["A40", "The goal seeks a folder and clarifies which of two visible folder types was meant."],
  [
    "A41",
    "The draft is a brief receipt acknowledgment, not a renewed request or distinct skill job.",
  ],
  ["A42", "The draft supplies a simple color answer, not progress or a current-project update."],
  ["A43", "A direct congratulations needs no listed capability or unsupported reassurance."],
  [
    "A44",
    "A one-word receipt confirmation is already sufficient; adding strategy would over-select.",
  ],
  ["A45", "A brief cat-photo reaction is not recognition of a difficult emotional experience."],
  ["A46", "A casual weather answer is not the skill's progress-reporting communication job."],
  ["A47", "Simple thanks for a reset does not imply the user made an error or owes regret."],
  ["A48", "The draft answers a book-title question without a material skill-selection need."],
  ["A49", "The goal is only to thank for a receipt, with no earlier unresolved request to pursue."],
  ["A50", "A hello-back objective carries no concrete request or other material capability."],
  ["A51", "A sunset reaction does not call for interpreting an unspoken emotional difficulty."],
  ["A52", "Thanks for an address already supplied is not future coordination or planning."],
  ["A53", "USER history grounds the color answer; no status/progress framing materially helps."],
  ["A54", "A reciprocal goodnight does not require reassurance or a future promise."],
  ["A55", "The goal acknowledges receipt of a number; no unresolved matter is revisited."],
  ["A56", "A brief laugh at a pun is not conflict de-escalation."],
  ["A57", "USER and OTHER close the ticket exchange; upstream non-wording action bypasses skills."],
  ["A58", "Replacement arrival and acknowledgment close the service thread without new wording."],
  ["A59", "Both sides confirm the meeting; no additional reply is needed."],
  ["A60", "The recipe exchange ends with a thank-you and you're welcome."],
  ["A61", "The invitation leaves material accept/decline/maybe choices to upstream action policy."],
  ["A62", "The offer permits materially different acceptance or negotiation choices upstream."],
  [
    "A63",
    "Charging a card is material and the missing user decision requires upstream clarification.",
  ],
  ["A64", "Public photo sharing is material and requires a user decision upstream."],
];

export const srs4AuditAuthorReview: readonly Srs4AuditAuthorReview[] = rationales.map(
  ([id, rationale]) => ({
    id,
    reviewedRevision: "R1",
    reviewerType: "CODEX_AUTHOR_SELF_REVIEW",
    independentReview: "PENDING",
    decision: "PROVISIONAL_PASS",
    rationale,
  }),
);
