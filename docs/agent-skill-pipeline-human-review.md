# B3.5 synthetic Skill expertise review pack

Status: all 21 synthetic cases have human dispositions. Four `FIX_ASSESSMENT` corrections have been implemented and deterministically rechecked; the human reviewer granted **B3.5 FULL SIGNOFF** after the post-fix results. This is not a review of final generated messages.

Run from the Agent worktree:

```powershell
& .\node_modules\.bin\tsx.cmd scripts/evaluate-skill-pipeline.ts --review
```

The command presents the 21 explicit synthetic cases below. For **each** case it prints the fixed action, supported evidence summary, assessment signals, exact selected ID/version references, the complete compiled SkillPlan principles/avoidances, the complete legacy CommunicationPlan principles/avoidances, and the comparison category. It reads only the committed approved runtime snapshot and synthetic fixtures; it makes no provider call, invokes no Composer and saves no conversation content. Generating the guidance directly from the frozen code avoids copying a second, easily stale skill catalog into this review document. If a later catalog commit is approved, revalidate its fingerprint and regenerate this pack before review.

| Case | Expertise focus | Reviewer verdict |
| --- | --- | --- |
| `apology-mistake` | Repair without invented excuse | ACCEPT |
| `status-request` | Coordination and truthful status | ACCEPT |
| `missed-commitment` | Repair plus uncertain timing | ACCEPT |
| `invitation-before-choice` | Local action / no forced skill | ACCEPT |
| `simplified-status` | Simplified Chinese and certainty | ACCEPT |
| `mixed-planning` | English/Chinese code-switching | FIX_ASSESSMENT; corrected and signed off |
| `clear-refusal` | Refusal preservation | ACCEPT |
| `repeated-pressure-boundary` | Assertive limit without apology | ACCEPT |
| `emotional-support` | Empathy without diagnosis | ACCEPT |
| `simple-planning` | Logistics without invented time | ACCEPT |
| `sparse-nicer` | Abstention with sparse evidence | ACCEPT with Agent-side tone-path caveat |
| `uncertain-availability` | “Might” stays uncertain | FIX_ASSESSMENT; corrected and signed off |
| `direct-refusal` | No negotiation or acceptance | ACCEPT |
| `less-confrontational-no-apology` | De-escalation with explicit no-apology | ACCEPT |
| `manager-recipient-unproven` | Manager reference without confirmed recipient identity | ACCEPT |
| `disagree-relationship` | Conflict, clarity, empathy; inspect `decline` relevance | Reject `decline`; shadow selection corrected |
| `cap-pressure-multi-need` | Four-skill cap; inspect omitted timing/status expertise | Blocking omission corrected in shadow ranking; all 33 cases rechecked |
| `chinese-boundary-traditional` | Traditional Chinese boundary; inspect `request` relevance | Accept `request` as secondary; cap-priority caveat tested |
| `english-chinese-code-switch` | Mixed-language coordination and approximate time | FIX_ASSESSMENT; corrected and signed off |
| `ambiguous-speaker-empty-draft` | Unknown speaker/goal; no forced skill | ACCEPT |
| `repair-and-empathy` | Supported apology plus visible emotion | FIX_ASSESSMENT; corrected and signed off |

## Human dispositions for the remaining 18 cases

The reviewer accepted 13 cases, accepted `sparse-nicer` with a future Agent-side tone-path caveat, and directed four assessment corrections. `ACCEPT` means the selected references and compiled guidance are relevant and source-supported for this synthetic case; it does not establish final-message quality. After all four corrections and full deterministic gates passed, the reviewer explicitly granted post-fix **B3.5 FULL SIGNOFF**.

| Case | Human disposition | Evidence and reasoning |
| --- | --- | --- |
| `apology-mistake` | `ACCEPT` | The incomplete user-owned apology and visible missed commitment support both `acknowledge_mistake` and `apology`; guidance forbids invented excuses and fault. |
| `status-request` | `ACCEPT` | The other person's direct progress request supports `status_update`; the English conciseness modifier is secondary and the plan forbids invented progress. |
| `missed-commitment` | `ACCEPT` | User-owned apology, delayed testing, and “probably tomorrow” support repair, status, and expectation setting. Both repair skills fit because no distinct supported function is displaced; uncertainty avoidance is explicit. |
| `invitation-before-choice` | `ACCEPT` | The fixed `SUGGEST_ACTIONS` action rightly yields no SkillPlan before the user chooses accept or decline. |
| `simplified-status` | `ACCEPT` | The Chinese draft says “possibly tomorrow”; expectation/status and Simplified Chinese guidance preserve that uncertainty without inventing a date. |
| `mixed-planning` | `FIX_ASSESSMENT` | “大概 3 点” is an approximate, not firm, arrival time. Coordination is detected, but the structural intent lacks `set_expectation`, so `expectation_setting` cannot compete with three language/style slots. Review whether the uncertainty-preservation skill should displace a style modifier. |
| `clear-refusal` | `ACCEPT` | “I don't want to go” is an actual refusal. `decline` and respectful directness preserve it; casual style is secondary and no acceptance or reason is invented. |
| `repeated-pressure-boundary` | `ACCEPT` | “I can't keep taking on extra work” establishes a limit under visible pressure. Boundary plus respectful directness are relevant; apology is not selected. |
| `emotional-support` | `ACCEPT` | The other person explicitly says they feel upset; emotional validation is supported, with no diagnosis or guaranteed outcome in the plan. |
| `simple-planning` | `ACCEPT` | A meeting-time question supports planning; the plan forbids unsupported time, place, or availability. Casual English is secondary. |
| `sparse-nicer` | `ACCEPT` with caveat | “Make this nicer” supplies no specific communication need. Zero selected skills avoids unsupported repair or relationship assumptions. If SkillPlan later becomes the only Skill guidance, the Agent-side explicit tone instruction must still reach Composer independently. |
| `uncertain-availability` | `FIX_ASSESSMENT` | “I might be available tomorrow” states uncertain availability in response to coordination. Neither planning nor `set_expectation` reaches assessment, leaving no SkillPlan uncertainty avoidance. Review whether `expectation_setting` should apply without a status request. |
| `direct-refusal` | `ACCEPT` | “No, I can't take this on” is a supported refusal; `decline` and directness preserve it. Professional conciseness is only a secondary modifier and its avoidance explicitly rejects email-like formality. |
| `less-confrontational-no-apology` | `ACCEPT` | The user-owned limit/refusal plus visible pressure support boundary, de-escalation, decline, and directness. The plan neither concedes the boundary nor adds an apology. The new/legacy difference is ordering, not content. |
| `manager-recipient-unproven` | `ACCEPT` | A user-supplied manager instruction can guide professional tone without treating the visible contact label as verified identity. Status guidance forbids invented progress. |
| `english-chinese-code-switch` | `FIX_ASSESSMENT` | “Maybe 下午三點; I need to check first” is explicitly tentative. Planning and code-switching are right, but absent `set_expectation` lets style fill the cap while the approved uncertainty-specific skill is omitted. |
| `ambiguous-speaker-empty-draft` | `ACCEPT` | Speaker ownership is unknown and there is no draft or user direction; the fixed clarification action produces no SkillPlan despite a broad clarity signal. No identity or request intent is inferred. |
| `repair-and-empathy` | `FIX_ASSESSMENT` | “Review was late” and “I missed the review” establish repair/empathy, not a progress update. A broad `review` keyword creates a status tag, causing `status_update` to ask for a current status/next step unsupported by this fixture. Remove that false status need in the shadow path. |

The four corrections are in the Agent-to-Skill shadow context/assessment projection, not the approved Skill registry or compiler. `mixed-planning`, `uncertain-availability`, and `english-chinese-code-switch` now select `expectation_setting@1` and include its uncertainty-preservation avoidance; an incidental style slot drops under the cap where needed. `repair-and-empathy` no longer selects `status_update@1`, while three counterexamples with genuine review-progress wording retain it. All 33 cases were rerun, and the three earlier priority cases remain correct. Existing production selection and Composer input remain authoritative and unchanged.

For each case, record answers to these questions before signoff:

1. Is each selected skill relevant to the fixed action and supported evidence? Which skill, if any, is unnecessary?
2. Did the pipeline miss an important approved skill or protective avoidance? If so, identify the exact ID and evidence.
3. Does the compiled SkillPlan faithfully represent *only* its selected approved skills, without added intent, facts, relationship or action?
4. Do any principle and avoidance conflict semantically, despite passing exact-string checks?
5. Is legacy or new guidance structurally stronger for this case, and why? Do **not** rate final wording or assume structural `MATCH` proves quality.

Suggested per-case record: `case ID | relevant? | missing? | unnecessary? | invention? | plan fidelity? | stronger path? | reason | reviewer/date`. The three flagged cases have explicit reviewer dispositions in the [comparison report](agent-skill-pipeline-validation.md). The correction applies only to the shadow path under the [remediation plan](../.agent/plans/agent-architecture-phase-b3-5-remediation.md); production selection and Composer remain unchanged. The remaining cases are still available for broader expertise review, and a catalog revision would require revalidation.
