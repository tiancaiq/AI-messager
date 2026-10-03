import type { OperationId } from "../authoring/operation-profiles.js";

export interface OperationAnnotation {
  id: string;
  revision: "R1";
  reviewerType: "CODEX_SELF_REVIEW_PROVISIONAL";
  operations: readonly OperationId[];
  rationale: string;
}

// Authored from the raw product-shaped exchange and fixed action, without skill labels.
// These are provisional Codex-authored annotations, not independent human approval.
const labels: readonly [string, readonly OperationId[], string][] = [
  ["O01", ["SEEK_ACTION"], "The draft asks the recipient to share the source spreadsheet."],
  ["O02", ["SEEK_ACTION"], "The draft asks the recipient to enable access."],
  ["O03", ["SEEK_ACTION"], "The explicit selected goal asks support to send the missing item."],
  ["O04", ["SEEK_ACTION"], "The draft asks the recipient to pick up groceries."],
  ["O05", ["SEEK_INFORMATION"], "The draft asks which of two entrances was intended."],
  ["O06", ["SEEK_INFORMATION"], "The draft seeks the missing revised estimate."],
  ["O07", ["SEEK_INFORMATION"], "The selected goal asks what the charge covers."],
  ["O08", ["SEEK_INFORMATION"], "The draft asks which Saturday was meant."],
  [
    "O09",
    ["REVISIT_OPEN_THREAD"],
    "The visible earlier photo request is unresolved and the draft checks back.",
  ],
  ["O10", ["REVISIT_OPEN_THREAD"], "The draft follows up on the still-unsigned form."],
  ["O11", ["REVISIT_OPEN_THREAD"], "The selected goal revisits a visibly unresolved key handover."],
  [
    "O12",
    ["REVISIT_OPEN_THREAD"],
    "The incomplete draft checks on an earlier unanswered map request.",
  ],
  ["O13", ["REPORT_CURRENT_STATE"], "The draft reports a completed first review pass."],
  ["O14", ["REPORT_CURRENT_STATE"], "The draft reports current waiting status, not a new promise."],
  ["O15", ["REPORT_CURRENT_STATE"], "The goal states a supported current parcel location."],
  ["O16", ["REPORT_CURRENT_STATE"], "The draft states that the check is complete now."],
  ["O17", ["COORDINATE_FUTURE"], "The draft offers a specific later call time."],
  ["O18", ["COORDINATE_FUTURE"], "The draft names the user's next review step."],
  [
    "O19",
    ["COORDINATE_FUTURE"],
    "The draft sets a tentative Friday expectation without certainty.",
  ],
  ["O20", ["COORDINATE_FUTURE"], "The selected goal offers two possible future meeting times."],
  ["O21", ["REFUSE_OPTION"], "The draft declines the gallery invitation."],
  ["O22", ["REFUSE_OPTION"], "The draft declines a specific Sunday shift."],
  ["O23", ["REFUSE_OPTION"], "The selected goal explicitly declines the paid trial."],
  ["O24", ["REFUSE_OPTION"], "The incomplete draft declines one weekend trip."],
  ["O25", ["STATE_CONTINUING_LIMIT"], "The draft sets a continuing no-weekend-shifts limit."],
  ["O26", ["STATE_CONTINUING_LIMIT"], "The draft asks that late calls stop going forward."],
  ["O27", ["STATE_CONTINUING_LIMIT"], "The draft refuses repeated revisiting of the same topic."],
  [
    "O28",
    ["STATE_CONTINUING_LIMIT"],
    "The selected goal states an ongoing unpaid-revisions limit.",
  ],
  ["O29", ["OWN_ERROR"], "The draft names the user's own mistaken upload."],
  ["O30", ["OWN_ERROR"], "The draft owns a mix-up in participant names."],
  ["O31", ["OWN_ERROR"], "The draft owns a forgotten booking confirmation."],
  ["O32", ["OWN_ERROR"], "The draft corrects the user's wrong serial number."],
  [
    "O33",
    ["OWN_ERROR", "EXPRESS_REGRET"],
    "The draft both owns sending the old deck and explicitly apologizes.",
  ],
  ["O34", ["OWN_ERROR", "EXPRESS_REGRET"], "The draft owns the missed call and expresses regret."],
  [
    "O35",
    ["OWN_ERROR", "EXPRESS_REGRET"],
    "The draft takes responsibility for a late reply and apologizes.",
  ],
  [
    "O36",
    ["OWN_ERROR", "EXPRESS_REGRET"],
    "The selected goal apologizes for the user's wrong room number.",
  ],
  ["O37", ["RESPOND_TO_CONCERN"], "The draft recognizes an explicitly difficult week."],
  ["O38", ["RESPOND_TO_CONCERN"], "The selected goal acknowledges an explicitly stated worry."],
  ["O39", ["RESPOND_TO_CONCERN"], "The draft recognizes visible disappointment."],
  ["O40", ["RESPOND_TO_CONCERN"], "The draft recognizes the recipient's stated frustration."],
  ["O41", ["REDUCE_TENSION"], "The draft slows an explicitly hostile discussion."],
  ["O42", ["REDUCE_TENSION"], "The selected goal resets an escalating argument."],
  ["O43", ["REDUCE_TENSION"], "The draft avoids repeating an explicit argument."],
  ["O44", ["REDUCE_TENSION"], "The draft redirects a heated accusation to the issue."],
  [
    "O45",
    ["SEEK_ACTION", "REVISIT_OPEN_THREAD"],
    "The draft revisits an earlier report request and asks the recipient to send it.",
  ],
  [
    "O46",
    ["SEEK_ACTION", "COORDINATE_FUTURE"],
    "The selected goal requests a ride and proposes a future time.",
  ],
  [
    "O47",
    ["SEEK_ACTION", "SEEK_INFORMATION"],
    "The draft asks for a file and a missing version detail.",
  ],
  [
    "O48",
    ["SEEK_ACTION", "OWN_ERROR"],
    "The draft owns the old upload and asks the recipient to replace it.",
  ],
  [
    "O49",
    ["SEEK_INFORMATION", "REVISIT_OPEN_THREAD"],
    "The draft follows up on an open quote and seeks a shipping detail.",
  ],
  [
    "O50",
    ["SEEK_INFORMATION", "REPORT_CURRENT_STATE"],
    "The draft reports completed setup and asks which account to use.",
  ],
  [
    "O51",
    ["SEEK_INFORMATION", "RESPOND_TO_CONCERN"],
    "The goal acknowledges stated worry and asks which charge is unfamiliar.",
  ],
  [
    "O52",
    ["REVISIT_OPEN_THREAD", "REPORT_CURRENT_STATE"],
    "The draft follows up on an open form and reports its current missing state.",
  ],
  [
    "O53",
    ["REVISIT_OPEN_THREAD", "COORDINATE_FUTURE"],
    "The draft revisits the unresolved booking and proposes a next-week step.",
  ],
  [
    "O54",
    ["REPORT_CURRENT_STATE", "COORDINATE_FUTURE"],
    "The draft reports a ready version and a planned send time.",
  ],
  [
    "O55",
    ["REPORT_CURRENT_STATE", "OWN_ERROR"],
    "The draft owns the prior wrong upload and reports the corrected current folder.",
  ],
  [
    "O56",
    ["COORDINATE_FUTURE", "OWN_ERROR", "EXPRESS_REGRET"],
    "The draft apologizes for a missed call and proposes a later call.",
  ],
  [
    "O57",
    ["REFUSE_OPTION", "STATE_CONTINUING_LIMIT"],
    "The draft declines this weekend and sets a continuing weekend limit.",
  ],
  [
    "O58",
    ["REFUSE_OPTION", "REDUCE_TENSION"],
    "The draft declines the shift while trying to calm a heated exchange.",
  ],
  [
    "O59",
    ["REFUSE_OPTION", "RESPOND_TO_CONCERN"],
    "The goal acknowledges stated stress but declines the shift.",
  ],
  [
    "O60",
    ["REFUSE_OPTION", "OWN_ERROR", "EXPRESS_REGRET"],
    "The draft owns and apologizes for the missed deadline, then declines a task.",
  ],
  [
    "O61",
    ["STATE_CONTINUING_LIMIT", "REDUCE_TENSION"],
    "The draft sets a late-message limit and asks to keep the exchange calm.",
  ],
  [
    "O62",
    ["STATE_CONTINUING_LIMIT", "RESPOND_TO_CONCERN"],
    "The draft recognizes stress while setting a continuing overnight-call limit.",
  ],
  [
    "O63",
    ["STATE_CONTINUING_LIMIT", "OWN_ERROR", "EXPRESS_REGRET"],
    "The draft apologizes for user-caused confusion and sets a continuing call limit.",
  ],
  [
    "O64",
    ["OWN_ERROR", "EXPRESS_REGRET"],
    "The draft explicitly owns the wrong attachment and apologizes.",
  ],
  [
    "O65",
    ["OWN_ERROR", "REDUCE_TENSION"],
    "The draft owns a wrong figure and redirects an argument toward correction.",
  ],
  [
    "O66",
    ["RESPOND_TO_CONCERN", "REDUCE_TENSION"],
    "The goal recognizes stated upset and slows an escalating discussion.",
  ],
  [
    "O67",
    [],
    "The draft merely reacts to an image; it asks for nothing and makes no relevant claim.",
  ],
  [
    "O68",
    [],
    "A light reaction to a trail-marker detail is not a communication operation in this vocabulary.",
  ],
  ["O69", [], "A simple factual answer does not ask, report progress, or arrange a future step."],
  ["O70", [], "The exchange is visibly closed and the fixed action needs no wording operation."],
  ["O71", [], "Receipt and thanks are acknowledgments, not a status update about a task."],
  ["O72", [], "Accepting an offer is not a refusal, boundary, request, or plan here."],
  ["O73", [], "The other person owns the wrong link; the user only acknowledges the correction."],
  ["O74", [], "The refusal belongs to the other person, not the user's reply."],
  [
    "O75",
    [],
    "The date belongs to the other person's exhibition; the user makes no new commitment.",
  ],
  ["O76", [], "A neutral receipt acknowledgment does not itself address the stated worry."],
  ["O77", [], "A polite acknowledgment of chair location is not conflict de-escalation."],
  ["O78", [], "Answering which scarf is theirs does not seek new information."],
  ["O79", [], "Routine thanks do not request action or express regret."],
  ["O80", [], "A joke reaction is not a conflict response or supported concern."],
  ["O81", [], "The user acknowledges a reservation without proposing a new future arrangement."],
  ["O82", [], "Receipt of a list is not a request or present-progress report."],
  ["O83", [], "A photo reaction goal does not require one of the 11 operations."],
  ["O84", [], "A minimal location answer is not a request or plan."],
  ["O85", [], "The visible conversation closes and the fixed action is no reply."],
  ["O86", [], "A brief puzzle reaction is outside the operation vocabulary."],
];

export const srs3fOperationAnnotations: readonly OperationAnnotation[] = labels.map(
  ([id, operations, rationale]) => ({
    id,
    revision: "R1",
    reviewerType: "CODEX_SELF_REVIEW_PROVISIONAL",
    operations,
    rationale,
  }),
);
