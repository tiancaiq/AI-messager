# R1 incoming-message decision review

Status: **11 of 12 deterministic dispositions accepted; explicit boundary-question case pending** (2026-10-17). Generated wording remains unreviewed; no full R1 signoff.

R1 fixes the Agent's reply decision before the existing wording path. These are synthetic, deterministic action/goal cases, not generated-message quality results. The implementation began after approval of the R1 plan and boundary direction, but these exact dispositions were **not locked before code changes**. Review them as current behavior, not as a precommitted evaluation. No live provider calls were run for this worksheet. On 2026-10-17, the reviewer agreed to the ten non-boundary cases “for now,” then requested a general “sorry” reply for the empty-draft no-contact case. That approved a brief, non-persuading default suggestion, not any actual generated wording or the separate explicit “ask what happened” case.

| Visible input (no compose draft unless stated) | Coach direction | Current R1 decision | Human disposition |
| --- | --- | --- | --- |
| “I don't want to speak with you, we are done” | None | `SUGGEST_REPLY`; brief general regret/acknowledgment, without fault admission, questions, persuasion, or continued-contact invitation | **Accepted direction after correction; generated text pending human review.** |
| Same boundary | “Ask what happened.” | `SUGGEST_REPLY`; explicit goal, with no-contact constraint in Composer | **Pending:** whether and how to draft this user-directed question across the boundary remains unapproved. |
| “Can you send me the file when you get home?” | None | `SUGGEST_ACTIONS`: accept, decline, ask details | Accepted for now. |
| “Want to come tonight?” | None | `SUGGEST_ACTIONS`: accept, decline, maybe, ask details | Accepted for now. |
| “What happened?” | None | `ASK_CLARIFICATION` about the user's answer | Accepted for now. |
| “I submitted the review.” | None | `SUGGEST_REPLY`; acknowledge without new facts or commitments | Accepted for now. |
| “Okay.” in isolation | None | `ASK_CLARIFICATION` about next step | Accepted for now. |
| “Thanks, looks good.” | None | `NO_REPLY_NEEDED`; optional short acknowledgment | Accepted for now. |
| Incoming request followed by a visible user reply | None | `NO_REPLY_NEEDED`; latest turn is already the user's | Accepted for now. |
| Latest visible speaker uncertain | None | `ASK_CLARIFICATION` | Accepted for now. |
| Korean request “자료를 보내 주세요” with unsupported language-specific skill eligibility | None | `ASK_CLARIFICATION`; no direct commitment | Accepted for now. |
| Visible compose draft “Thanks for asking.” | “Ask for more detail instead.” | `SUGGEST_REPLY`; explicit new-reply goal overrides observed draft in wording | Accepted for now. |

The current implementation uses the existing production skill selector after the fixed Agent action, then one normal wording call only for a wording action. Choice, clarification, and no-reply paths make no wording call. The shadow SkillPlan remains comparison-only. The desktop labels new-reply direction separately from captured draft and never sends the result automatically.

Review the action/goal judgments above separately from generated text. A later, separately authorized synthetic live run must inspect the primary **and alternatives** for factual/meaning validity, especially the general boundary acknowledgment, the explicit question after that boundary, and the draft-override case. A fluent response does not establish correctness. Record any changed disposition before full R1 signoff; do not reinterpret the earlier B4/B4.7 decisions.
