# Phase 3 — Communication capability normalization, taxonomy, and gap analysis

Status: research/design input for Phase 4; **not** a runtime registry proposal. Scope: the 14 current universal skills and five Phase 2 research sources. No production IDs, definitions, schemas, selection behavior, or language rules change here.

## Reading rule and decision method

An **atomic capability** is a reusable, independently selectable communication function: “Help the user _do a communication job_ without changing _the user's intent, facts, certainty, commitments, or upstream `AgentAction`_.” A tactic changes wording within that function; a playbook sequences functions; style changes expression; situation metadata describes evidence for selection. A source's use of “skill” does not determine our classification. Current visible conversation evidence outranks relationship/situation context, which outranks any historical prior. Compose before proliferating. Selecting zero skills (`NONE`) remains correct.

Each crosswalk row has exactly one **primary** classification. `EXISTING_ATOMIC` denotes a current capability or its exact external equivalent; `EXTEND_EXISTING_ATOMIC` denotes coverage best added to an existing capability; `NEW_ATOMIC_CANDIDATE` denotes a distinct function awaiting approval. Other classes used below are `PLAYBOOK_CANDIDATE`, `LANGUAGE_MODIFIER`, `PRINCIPLE_OR_TACTIC`, `STYLE_OR_PERSONA`, `STYLE_OR_PROFILE`, `SITUATION_OR_ROUTING_TAG`, `PRODUCT_CONSTRAINT`, `PHASE3_ACTION_CONCERN`, `OUT_OF_SCOPE`, `REJECT_DUPLICATE`, and `DEFER`. “Rejected as an atom” does not mean useful behavior is rejected.

The new-candidate review-aid score sums seven 0–2 judgments: cross-relationship reuse, cross-situation reuse, single-function clarity, distinctness from existing, non-composability, independent routing value, and negative-case clarity (maximum 14). Scores are not acceptance thresholds: 12–14 suggests strong review, 9–11 requires judgment, and lower scores usually favor extension, tactic, playbook, or deferral. The final proliferation audit asks: one job; distinct from current skills; not cleanly composable; not playbook/tactic/style/scenario/constraint; reused across relationships and situations; positive, negative, and hard-negative cases; separable nearest neighbor; material routing value; no change to intent or evidence.

## A. Executive decisions

1. Retain all 14 existing universal IDs unchanged in this phase; their boundaries, not their implementation, are reviewed below.
2. Use eight human-facing communication-function families. These are conceptual navigation labels, not routing fields or services.
3. Three **strong candidates for human review**, not approved additions, are `perspective_acknowledgement`, `confirmation`, and `give_constructive_feedback`.
4. Validation acknowledges a visible emotional experience; perspective acknowledgement recognizes a visible interpretation or concern without asserting the emotion behind it; reassurance offers grounded support, not predicted success.
5. Clarification asks for a material missing/ambiguous detail; confirmation verifies an apparently understood detail. Asking remains subordinate to Phase 3's “ask only when necessary” policy.
6. Active/reflective listening, mirroring, echoing, rephrasing, labeling, and summarizing are framework/tactic-level behaviors, not six extra atoms.
7. Conflict resolution, relationship repair, negotiation, and difficult-conversation sequences are playbooks because they combine distinct communication functions.
8. Face-saving/给台阶 and preserving dignity are shared principles, never permission to invent a pretext or steer someone deceptively.
9. Directly stating a need rather than testing someone is an extension of clear request/boundary guidance; a “relationship test” capability is rejected.
10. Solution-focus in conflict is guidance for de-escalation plus planning/request, not a new conflict atom.
11. Encouragement, alternatives, tradeoff framing, and constraint exploration are plausible gaps, but current composition and routing evidence need human review before promotion.
12. Persuasion/influence tactics are not neutral skill identities. Truthful rationale and options may be useful; pressure, manipulation, and false urgency are excluded.
13. Humor, high-certainty interpersonal guesses, conclusion-first delivery, and persona imitation from a single person's style are not universal communication capabilities.
14. No new English, Simplified Chinese, or Traditional Chinese modifier follows from these sources. Persona evidence cannot establish a cultural rule.
15. Phase 4 should represent conceptual family, explicit neighbor exclusions, negative examples, and provenance where useful, without precommitting a final schema, retrieval graph, or 45–55-skill count.

## Evidence and provenance boundary

The current implementation is the authoritative baseline: 21 active definitions in `packages/skills/src/registry.ts` (14 universal, three English, four Chinese). Selection is deterministic and bounded at 0–4, with `NONE` valid. `AgentAction` is fixed upstream; `useWhen`/`doNotUseWhen` are descriptive rather than executable conditions; compatibility references exist but no dependency model is in use; compact composed principles/avoidance reach generation rather than the full registry. The five sources are evidence of terminology, method, or evaluation dimensions—not authoritative product instructions:

| Source | Useful contribution | Boundary |
| --- | --- | --- |
| [Thanos / Multifaceted Skill-of-Mind](https://arxiv.org/abs/2411.04496) | Conversational-function vocabulary, including understanding, empathy, conflict, and coordination | Do not import its full taxonomy, conversations, research-only data, or model artifacts. Memory, knowledge, reasoning, and task execution are not communication atoms. |
| [Wondel negotiation](https://github.com/wondelai/skills/blob/main/negotiation/SKILL.md) and [influence psychology](https://github.com/wondelai/skills/blob/main/influence-psychology/SKILL.md) | Packaged strategy/framework and tactics such as mirroring, labeling, calibrated questions, summaries | Named techniques do not automatically become independently routed skills; scrutinize influence for manipulation. |
| [EQ-Bench 3 rubric](https://github.com/EQ-bench/eqbench3/blob/main/data/rubric_scoring_criteria.txt) | Evaluation dimensions and negative quality signals | Rubric dimensions are quality measures, not registry labels. |
| [METRO](https://arxiv.org/abs/2604.11427) | Distinguishes strategy actions, micro-principles, and sequence/tree structure | Strategy-induction/retrieval architecture is not justified for this small approved catalog; do not copy artifacts. |
| [tong-jincheng-skill](https://github.com/hotcoffeeshake/tong-jincheng-skill/blob/main/SKILL.md), especially [research notes](https://github.com/hotcoffeeshake/tong-jincheng-skill/tree/main/references/research) and [expression analysis](https://github.com/hotcoffeeshake/tong-jincheng-skill/blob/main/references/research/03-expression-dna.md) | Knowledge-distillation structure: observations, heuristics, style, limitations, provenance | Its MIT repository does not settle rights to underlying transcripts, quotes, videos, or likeness. Do not imitate a person, import worldview claims, or copy dialogue/examples. |

All future definitions, principles, positive/negative examples, and few-shots should be independently written. Thanos dataset/model licensing was flagged as research-only in Phase 2; METRO reuse permissions should be rechecked before any artifact use. No source-derived dialogue is quoted below.

## B. Canonical capability crosswalk

Rows with multiple closely related terms share one primary classification **per listed term**; no term is counted as an additional skill merely because it has another label. `Current` means unchanged production ID. `Candidate` means conceptual only.

| Origin / term(s) | Canonical home | Primary classification | Reason / boundary |
| --- | --- | --- | --- |
| Current `apology` | Accountability & repair | `EXISTING_ATOMIC` | Express regret for supported impact; no invented fault. |
| Current `acknowledge_mistake` | Accountability & repair | `EXISTING_ATOMIC` | Name user-owned error/delay without requiring apology. |
| Current `emotional_validation` | Recognition & support | `EXISTING_ATOMIC` | Recognize visible feeling/difficulty without mind-reading. |
| Current `reassurance` | Recognition & support | `EXISTING_ATOMIC` | Ground support in evidence; never guarantee outcome. |
| Current `boundary_setting` | Decisions & limits | `EXISTING_ATOMIC` | Express the user's limit; do not alter it. |
| Current `de_escalation` | Conflict & feedback | `EXISTING_ATOMIC` | Lower unnecessary heat without conceding position. |
| Current `decline` | Decisions & limits | `EXISTING_ATOMIC` | Communicate fixed refusal; not a future promise. |
| Current `ask_for_help` | Requests & options | `EXISTING_ATOMIC` | Request assistance without fabricating obligation. |
| Current `follow_up` | Coordination | `EXISTING_ATOMIC` | Revisit supported earlier request; silence is not blame. |
| Current `status_update` | Coordination | `EXISTING_ATOMIC` | Report known progress/current state. |
| Current `expectation_setting` | Coordination | `EXISTING_ATOMIC` | Communicate realistic timing/limits at supported certainty. |
| Current `planning` | Coordination | `EXISTING_ATOMIC` | Coordinate known time/place/next step. |
| Current `clarification` | Understanding & inquiry | `EXISTING_ATOMIC` | Ask for one material missing detail. |
| Current `request` | Requests & options | `EXISTING_ATOMIC` | Make supported requested action explicit. |
| Thanos clarification | `clarification` | `EXISTING_ATOMIC` | Same job, alternate source label. |
| Thanos confirmation | `confirmation` candidate | `NEW_ATOMIC_CANDIDATE` | Verify apparently known detail; different negative case. |
| Thanos empathy | Validation/perspective/reassurance | `PLAYBOOK_CANDIDATE` | Umbrella disposition, not one job. |
| Thanos self-disclosure | Supported self-disclosure | `DEFER` | Only with user-supplied autobiographical facts and consent. |
| Thanos negotiation | Negotiation playbook | `PLAYBOOK_CANDIDATE` | Inquiry, limits, options, tradeoffs, coordination. |
| Thanos conflict resolution | Conflict-resolution playbook | `PLAYBOOK_CANDIDATE` | Repair, validation, limits, planning in context-dependent order. |
| Thanos conflict avoidance | Non-escalating delivery | `PRINCIPLE_OR_TACTIC` | Avoiding a needed boundary may be harmful. |
| Thanos persuasion | Ethical explanation/options only | `PRODUCT_CONSTRAINT` | No covert compliance optimization or intent reversal. |
| Thanos cultural sensitivity | Respectful locale fit | `PRODUCT_CONSTRAINT` | Source does not justify a new language rule. |
| Thanos active listening | Understanding playbook | `PLAYBOOK_CANDIDATE` | Composes inquiry, acknowledgement, verification, brevity. |
| Thanos reflective listening | Validation/perspective guidance | `PRINCIPLE_OR_TACTIC` | A way of showing understanding, not a separate job. |
| Thanos echoing; rephrasing | Clarification/validation guidance | `PRINCIPLE_OR_TACTIC` | Mechanical repetition can sound false. |
| Thanos topic transition | Conversation sequencing | `PRINCIPLE_OR_TACTIC` | Bridge/timing within playbook. |
| Thanos preference elicitation | Necessary preference inquiry | `DEFER` | Over-asking risk and overlap with clarification/planning. |
| Wondel tactical empathy | Validation/perspective guidance | `EXTEND_EXISTING_ATOMIC` | Useful acknowledgement guidance; no branded atom. |
| Wondel mirroring; labeling | Validation/inquiry tactics | `PRINCIPLE_OR_TACTIC` | Technique-specific, with caricature/mind-reading risk. |
| Wondel calibrated questions | Clarification/constraint inquiry | `PRINCIPLE_OR_TACTIC` | Question shape, not communication purpose. |
| Wondel summarization | Confirmation/coordination guidance | `PRINCIPLE_OR_TACTIC` | Useful only to verify or organize known content. |
| Wondel negotiation frameworks; difficult-conversation methods | Contextual sequences | `PLAYBOOK_CANDIDATE` | Multiple functions, not atomic IDs. |
| EQ demonstrated empathy; validation; warmth | Quality rubric | `PRODUCT_CONSTRAINT` | Evaluate visible acknowledgement and fit; do not route to rubric label. |
| EQ social dexterity; message tailoring; humanlike communication | Quality rubric | `PRODUCT_CONSTRAINT` | Quality dimensions across skills/style. |
| EQ boundary appropriateness | Global guard | `PRODUCT_CONSTRAINT` | Skill must not override supported boundary. |
| EQ moralising; sycophancy | Global negative signals | `PRODUCT_CONSTRAINT` | Avoid moral lectures and unearned agreement. |
| METRO strategy action | Atomic-function review unit | `PRINCIPLE_OR_TACTIC` | Methodological analogy, not imported skill. |
| METRO micro-principle; should-do; should-not-do | Principle/avoidance authoring | `PRINCIPLE_OR_TACTIC` | Rules inside approved skills, independently authored. |
| METRO dialogue state | Situation evidence | `SITUATION_OR_ROUTING_TAG` | State is context, not capability. |
| METRO strategy sequence; strategy tree | Playbook/factory design | `PLAYBOOK_CANDIDATE` | Order/branching among actions, not one atom. |
| Tong face-saving/给台阶; preserve dignity | Respectful framing | `PRINCIPLE_OR_TACTIC` | Across refusal/request/correction/feedback/conflict; no fake excuse. |
| Tong directly expressing needs instead of testing | `request`/`boundary_setting` guidance | `EXTEND_EXISTING_ATOMIC` | State need/limit rather than induce a test. |
| Tong solution-focus during conflict | `de_escalation` + planning | `EXTEND_EXISTING_ATOMIC` | Supported actionable step, not forced reconciliation. |
| Tong encouragement over harmful criticism | Encouragement candidate | `DEFER` | Distinct support job plausible; negative-case calibration needed. |
| Tong humor to reduce awkwardness | Optional tone | `STYLE_OR_PERSONA` | Preference/context dependent; never force levity. |
| Tong directness; conclusion-first delivery | Profile/style and existing modifiers | `STYLE_OR_PROFILE` | Not universal skill; `en.direct_but_polite` overlaps. |
| Tong self-deprecation; distinctive phrasing/catchphrases | Persona expression | `STYLE_OR_PERSONA` | Do not imitate or invent autobiography. |
| Tong acknowledging one's uncertainty | Evidence/certainty guard | `PRODUCT_CONSTRAINT` | Global, not conditional on skill match. |
| Tong high-certainty guesses about another's feelings; celebrity worldview | Unsupported persona inference | `OUT_OF_SCOPE` | No mind-reading, cultural extrapolation, or roleplay. |

## C. Synonym and related-term map

Strong aliases mean the **same communication job**; related terms can coexist but must not silently merge. Tactics are not aliases.

| Canonical job | Strong aliases / equivalent terms | Related, not equivalent | Tactics or quality terms, not aliases |
| --- | --- | --- | --- |
| `emotional_validation` | Feeling acknowledgement; emotional acknowledgement | Empathy; reassurance; perspective acknowledgement | Reflective paraphrase; cautious emotion labeling; warmth |
| `perspective_acknowledgement` (candidate) | Viewpoint acknowledgement; interpretation acknowledgement | Validation; clarification; agreement | Rephrasing; tentative framing |
| `reassurance` | Grounded reassurance; supportive reassurance | Encouragement; validation | Optimistic tone; warmth |
| `clarification` | Ask for missing detail; disambiguation | Confirmation; preference inquiry; request | Calibrated/open question; mirroring |
| `confirmation` (candidate) | Understanding check; verify understood detail | Clarification; status check | Short summary; echoing |
| `request` | Clear request; state a need | Ask for help; preference inquiry; boundary | Directness; question form |
| `boundary_setting` | State a limit; communicate a boundary | Decline; expectation setting | Firm wording; face-saving |
| `de_escalation` | Non-escalating conflict wording | Conflict resolution; repair; feedback | Calm phrasing; solution-focus |
| `give_constructive_feedback` (candidate) | Behavior-focused feedback; actionable feedback | Raise concern; boundary; acknowledgement | Concrete example; dignity-preserving correction |
| `status_update` | Progress update; current-state report | Expectation setting; follow-up | Conclusion-first ordering |
| `planning` | Logistical coordination; next-step coordination | Alternative proposal; request | Concise option presentation |
| `apology` | Supported expression of regret | Acknowledge mistake; repair | Concise ownership language |

Do not normalize “empathy,” “negotiation,” “active listening,” or “social intelligence” as strong aliases for a single atom. They are umbrellas. Labeling a feeling does not validate it; the feeling must be visible and wording appropriately tentative.

## D. Communication-function taxonomy

Families organize **what guidance does**, not relationship type (dating/work/family) or emotion. Candidate members are conceptual; only current IDs are approved at baseline.

| Family | Definition and members | Excluded concepts | Nearest family; organizational reason |
| --- | --- | --- | --- |
| Accountability & repair | Own supported impact: `acknowledge_mistake`, `apology`; repair playbook | Generic self-blame, excuse fabrication | Recognition & support; owning one's action differs from recognizing another's experience. |
| Recognition & support | Acknowledge visible experience/interpretation, offer grounded support: `emotional_validation`, `reassurance`, candidate `perspective_acknowledgement`, possible encouragement | Mind-reading, guaranteed outcomes, umbrella “empathy” | Understanding & inquiry; recognition responds to known content rather than asks for it. |
| Understanding & inquiry | Resolve material ambiguity or verify understanding: `clarification`, candidate `confirmation`, possible preference/constraint inquiry | Questioning for its own sake, mirroring as ID | Requests & options; inquiry obtains information, request seeks action. |
| Requests & options | Clearly seek supported action/help or present feasible choice: `request`, `ask_for_help`, possible alternative | Persuasion pressure, unapproved user decision | Decisions & limits; requests seek, limits refuse or constrain. |
| Decisions & limits | Communicate fixed refusal or user limit: `decline`, `boundary_setting` | Forced concessions, invented reasons | Conflict & feedback; a limit can be calm without implying conflict. |
| Conflict & feedback | Reduce heat and deliver supported behavior-focused concerns: `de_escalation`, candidate `give_constructive_feedback`, possible raise/receive feedback | Conflict resolution as one atom, humiliation | Accountability & repair; feedback about another's behavior is not admission of user fault. |
| Coordination | Report status, timing, earlier request, logistics: `status_update`, `expectation_setting`, `follow_up`, `planning`, possible tradeoff framing | Invented deadlines/availability | Requests & options; coordination organizes supported action rather than manufacturing demand. |
| Explanation & connection | Explain supported rationale, address stated concern, express supported appreciation (possible candidates) | Covert influence, autobiography invention | Recognition & support; explanation communicates reasons, not emotion verification. |

## E. Placement of the 14 current universal skills

| Family | Current production IDs (unchanged) | Coverage boundary to retain |
| --- | --- | --- |
| Accountability & repair | `apology`, `acknowledge_mistake` | Regret versus admission; supported user ownership only. |
| Recognition & support | `emotional_validation`, `reassurance` | Recognition versus grounded support. |
| Understanding & inquiry | `clarification` | One necessary missing detail; not confirmation of known information. |
| Requests & options | `request`, `ask_for_help` | Generic requested action versus assistance specifically. |
| Decisions & limits | `decline`, `boundary_setting` | One refusal versus ongoing/user-defined limit. |
| Conflict & feedback | `de_escalation` | Heat reduction, not relationship outcome. |
| Coordination | `follow_up`, `status_update`, `expectation_setting`, `planning` | Earlier ask, present state, future certainty, logistics respectively. |
| Explanation & connection | None | A family may have no approved atom; this is not a count target. |

## F. Neighbor distinction matrix

“Select” below is conceptual, conditional on supported user intent and upstream action. A hard negative is a deceptively similar case where selecting the first capability would be wrong.

| Neighbors | Distinguishing evidence / appropriate job | Hard negative or composition boundary |
| --- | --- | --- |
| Apology ↔ acknowledge mistake | Regret for impact ↔ factual ownership of error/delay. Both if supported and intended. | User reports another person's mistake: neither owns it for the user. |
| Apology ↔ validation | User-owned regret ↔ other person's visible experience. | Upset alone does not prove user fault. |
| Apology ↔ relationship repair | One expression of regret ↔ multi-step restoration plan. | No forced “we're fine now” claim after apology. |
| Validation ↔ reassurance | Recognize an experience ↔ offer grounded support about concern. | Concern without outcome evidence: no guaranteed reassurance. |
| Validation ↔ perspective acknowledgement | Visible feeling/difficulty ↔ stated interpretation/viewpoint. | “This seems unfair” is not proof the person feels angry. |
| Perspective acknowledgement ↔ agreement | Recognize why a view was formed ↔ endorse its truth. | Acknowledge concern without conceding disputed facts. |
| Perspective acknowledgement ↔ reflective listening | Communication job ↔ paraphrasing tactic to perform it. | Repeating words without visible interpretation is not an atom. |
| Reflective listening ↔ labeling | Paraphrase visible content ↔ cautiously name visible feeling. | Do not assign unspoken emotion by formula. |
| Reassurance ↔ encouragement | Grounded support for concern ↔ support agency/effort without predicting success. | “You'll certainly win” fits neither. |
| Clarification ↔ confirmation | Missing/ambiguous detail ↔ understood detail needing verification. | Do not confirm when answer is explicit and no verification needed. |
| Clarification ↔ request | Ask for information needed to proceed ↔ ask someone to act. | Request phrased as question is still request. |
| Clarification ↔ explore constraints | One concrete unknown ↔ inquiry into limits/preferences before options. | No exploratory interview when one known detail suffices. |
| Confirmation ↔ status update | Verify another's meaning/commitment ↔ report user's current state. | “Did I understand Friday?” must not become “I will deliver Friday.” |
| Preference elicitation ↔ planning | Learn needed preference ↔ coordinate known option/time/place. | Do not solicit preferences when plan is settled or user has not chosen to ask. |
| Decline ↔ boundary setting | Refuse specific invitation/request ↔ state continuing or repeated-pressure limit. | One polite no need not assert ongoing relationship boundary. |
| Boundary setting ↔ expectation setting | User limit on engagement/behavior ↔ realistic delivery/time constraint. | “I can't tonight” may be logistical, not relational. |
| Decline ↔ de-escalation | Preserve fixed no ↔ reduce heated framing. | Calm wording cannot convert refusal into maybe/yes. |
| Status update ↔ expectation setting | Present progress ↔ supported future timing/limits. | No status evidence cannot be filled with deadline. |
| Status update ↔ planning | Report what exists ↔ coordinate next action. | Next step is not evidence of completed progress. |
| Planning ↔ request | Organize agreed logistics ↔ solicit new action/choice. | “Meet at six” must not become invitation if user hasn't chosen it. |
| Planning ↔ propose alternative | Coordinate selected option ↔ offer feasible different option after obstacle. | Don't introduce alternatives reversing fixed refusal. |
| Follow-up ↔ request | Revisit earlier visible ask ↔ make new ask. | No recent observed messaging evidence is not proof of no response; no implied neglect. |
| Follow-up ↔ status update | Ask/check on earlier request ↔ communicate user's progress. | Earlier task mention alone is not status. |
| De-escalation ↔ conflict resolution | Tone/heat function ↔ multi-function playbook toward outcome. | Calm message can maintain disagreement; no forced settlement. |
| De-escalation ↔ constructive feedback | Reduce intensity ↔ communicate supported behavior, impact, request. | Avoiding accusation does not erase necessary feedback. |
| Face-saving ↔ de-escalation | Shared dignity framing ↔ independently routed heat reduction. | Face-saving can matter without conflict; fake excuses invalid. |
| Face-saving ↔ politeness modifier | Cross-capability dignity rule ↔ language-specific surface convention. | No Chinese cultural rule inferred from persona source. |
| Encouragement ↔ reassurance | Agency/effort support ↔ grounded concern support. | Praise/certainty unsupported by evidence is sycophancy. |
| Propose alternative ↔ tradeoff framing | Offer supported option ↔ explain known costs/benefits among options. | Tradeoffs cannot fabricate options, prices, commitments. |
| Ask for help ↔ request | Assistance specifically ↔ any supported requested action. | Calling every request “help” can imply vulnerability/obligation not intended. |
| Give feedback ↔ raise concern | Behavior-focused actionable feedback ↔ flag risk/discomfort not necessarily about other's behavior. | No proven misconduct: frame concern as concern, not accusation. |

These boundaries should become Phase 4 hard-negative fixtures before any candidate is promoted. Pairwise confusion is often resolved by **no skill** or two compatible skills, not an umbrella atom.

## G. Existing skills that should probably be extended

These are **design recommendations only**; changes to principles/examples/metadata wait for an approved later phase.

| Current skill | Missing conceptual coverage / safe guidance | Why extension beats new atom |
| --- | --- | --- |
| `emotional_validation` | Tentative reflection of a visible feeling/impact; distinguish from agreement and reassurance. | Reflective wording and tactical empathy perform the same recognition job. |
| `reassurance` | Calibrate support to known evidence; avoid unsupported optimism. | Warmth is quality/style, not a separate function. |
| `clarification` | One material ambiguity, not curiosity or a broad interview; recognize necessary preference questions when they are concrete. | Most preference elicitation is asking a missing detail. |
| `request` | Express needs directly rather than test another person's intuition; leave room for a truthful no. | Same action-seeking job, no special relationship atom. |
| `boundary_setting` | State limit without attacks; dignity-preserving framing with no concession. | Face-saving is a shared rule, not independently routed. |
| `decline` | Preserve a fixed refusal without fabricated excuse; consider truthful face-saving. | Respectful refusal is its current job. |
| `de_escalation` | Move from accusation to supported issue/next step while maintaining decision; no conflict avoidance mandate. | Solution-focus is guidance; conflict resolution is composed. |
| `apology` | Proportionate regret for supported impact; no false fault or performative over-apology. | Repair is a multi-function sequence. |
| `acknowledge_mistake` | Speaker-owned evidence, concrete ownership, no blame-shift or invented explanation. | No new “accountability” umbrella needed. |
| `status_update` | Separate observed progress from next step and uncertainty. | Ordering/tone is guidance within current job. |
| `expectation_setting` | Preserve probability/limits rather than turn them into promises. | Truthful uncertainty is a global constraint plus this skill's case. |
| `planning` | Present supported options concisely; ask only if logistics materially missing. | Simple alternatives are often planning/request composition. |
| `follow_up` | Never infer blame from absent visible reply; distinguish reminder from a new request. | Same earlier-request job. |
| `ask_for_help` | State assistance sought without pressure or invented urgency. | Existing narrower form of request. |

## H. Strong new atomic candidates — review, not approval

Score vector order: relationship / situation / one job / distinct / non-composable / routing / negative cases. Every example is independently written; **positive** means the function is supported and useful, **negative** means it should not route, and **hard negative** is a confusing near match.

| Candidate | Communication job; positive / negative / hard negative | Why not existing or composition; cross-context evidence | Neighbors, score, safety, inspiration |
| --- | --- | --- | --- |
| `perspective_acknowledgement` | Help the user recognize another person's **stated interpretation or concern** without adopting disputed facts or inventing emotion. Positive: a colleague says they read a delay as deprioritization and user wants to acknowledge that reading. Negative: no interpretation is visible. Hard negative: a person's explicit sadness calls for validation, not an inferred perspective. | Validation is about visible emotional experience; clarification seeks unknown information; reassurance supports a concern. Combining these does not reliably yield “recognize interpretation without agreeing.” Reusable in work, family, friendship, and service exchanges; in disagreement, misunderstanding, and feedback. | Neighbors: validation, agreement, clarification. **14** (2/2/2/2/2/2/2). Safety: visible evidence, tentative wording, no mind-reading or factual concession. Inspired by Thanos empathy/reflective listening, Wondel tactical empathy, EQ empathy rubric. |
| `confirmation` | Help the user verify an **apparently understood, material detail** without adding a commitment or needless question. Positive: a project handoff appears to specify Friday; user wants to verify which deliverable Friday applies to. Negative: detail is explicit and immaterial. Hard negative: two possible dates are unresolved—use clarification, not confirmation. | Clarification guidance targets missing information and one question; confirmation targets a known interpretation and short check, with distinct over-questioning risk. Composition with status/planning can accidentally assert the detail rather than verify it. Reusable in personal plans, work tasks, and customer coordination; in handoffs, requests, and commitments. | Neighbors: clarification, planning, status. **13** (2/2/2/2/1/2/2). Safety: ask only when material; preserve user's uncertainty and fixed action. Inspired by Thanos confirmation and Wondel summaries. |
| `give_constructive_feedback` | Help the user communicate **supported behavior and impact plus a proportionate actionable request**, without attacking identity or assuming motive. Positive: user has direct evidence of repeated interruption and wants to discuss it. Negative: no user intent to give feedback. Hard negative: a single scheduling limit calls for boundary/expectation, not a critique of the person. | `request` asks for action, `de_escalation` lowers heat, `boundary_setting` expresses limit; their composition lacks the independently routed “observed behavior + impact + actionable change” structure and its evidence guard. Reusable across coworkers, friends, family, and service contexts; in recurring friction, review, and correction. | Neighbors: raise concern, boundary, de-escalation. **13** (2/2/2/2/1/2/2). Safety: observed behavior only, no diagnosis, humiliation, coercion, or fabricated incident. Inspired by Wondel difficult conversations, EQ social dexterity, Tong dignity/encouragement observations. |

The two 13-point scores reflect residual composition overlap; even these strong candidates may be rejected after Phase 4 fixtures or product review. All three can be phrased as HOW-functions, but none may decide WHAT the user says or cause a new question when Phase 3 has fixed a different action.

## I. Possible atomic candidates — unresolved

These are **not** Phase 4 additions. Scores are provisional review aids, not evidence of unmet product need.

| Possible function | Provisional score | Distinctive job and nearest overlap | Decisive review question |
| --- | --- | --- | --- |
| Encouragement | 10 | Support a person's agency/effort without promising success; overlaps reassurance and validation. | Does it produce different useful guidance in positive cases, without empty praise? |
| Propose alternative | 10 | Offer a feasible, supported option after an obstacle; overlaps planning/request/decline. | Would routing it matter when no change to user's choice is authorized? |
| Tradeoff framing | 9 | Explain known advantages/limits of supported options; overlaps planning and rationale. | Does the user have facts and intent to compare, not merely coordinate? |
| Explore constraints | 9 | Ask about material limits before options; overlaps clarification/preference elicitation. | Does it violate “ask only when necessary” in routine cases? |
| Raise concern | 10 | State supported worry/risk without imputing fault; overlaps constructive feedback and boundary. | Is there a stable positive class not about another's behavior? |
| Receive feedback | 9 | Acknowledge, clarify, and respond to feedback without automatic concession; overlaps validation/clarification. | Is this a single job or a response playbook? |
| Explain rationale | 10 | Communicate a user-supported reason clearly without persuasion pressure; overlaps request/decline/status. | Does independent selection improve wording when reasons are already known? |
| Address stated concern | 9 | Respond to another's explicit objection with supported information; overlaps perspective acknowledgement and rationale. | Is this one function or a negotiation sequence? |
| Express appreciation | 9 | Name a supported contribution and gratitude without flattery; overlaps encouragement. | Is appreciation needed as independently selectable strategy or simple wording? |
| Supported self-disclosure | 8 | Share only user-supplied personal experience when user chooses to do so; overlaps connection/style. | Can provenance/consent be verified without inventing autobiographical content? |
| Necessary preference elicitation | 8 | Ask a preference required for response/coordination; overlaps clarification/planning. | Are positive cases materially different from one missing detail? |

The feedback/concern candidates are not interchangeable: constructive feedback is specifically about **supported behavior and actionable change**; a concern can express risk without alleging misconduct. A receiving-feedback sequence may require multiple atoms in order. The Tong source is inspiration for encouragement and self-disclosure questions, not evidence that its persona behavior generalizes.

## J. Rejected atomic candidates

| Proposed atom / source concept | Primary classification | Why not an atom; safe home or rejection |
| --- | --- | --- |
| `active_listening`, `empathy`, `social_intelligence` | `PLAYBOOK_CANDIDATE` | Umbrellas combining acknowledgement, inquiry, verification, support; no precise independent job. |
| `conflict_resolution`, `negotiation`, `relationship_repair` | `PLAYBOOK_CANDIDATE` | Contextual sequences of existing/possible capabilities, not one selectable operation. |
| `mirror_last_words`, `echoing`, `rephrase`, `summarize`, `label_emotion` | `PRINCIPLE_OR_TACTIC` | Surface techniques; can be artificial or falsely infer emotion. |
| `calibrated_questions`, `topic_transition` | `PRINCIPLE_OR_TACTIC` | Question/transition form rather than communication purpose. |
| `give_face_saving_excuse` | `OUT_OF_SCOPE` | Manufacturing a false pretext violates truthfulness; dignity can be preserved without deceit. |
| `preserve_dignity` as standalone | `PRINCIPLE_OR_TACTIC` | Important across several atoms, but no distinct routing need apart from those jobs. |
| `avoid_conflict` | `PRINCIPLE_OR_TACTIC` | Non-escalation may help; blanket avoidance can suppress needed refusal/boundary. |
| `solution_focus` | `EXTEND_EXISTING_ATOMIC` | De-escalation plus supported planning/request, not independent conflict intent. |
| `direct_expression_instead_of_testing` | `EXTEND_EXISTING_ATOMIC` | A request/boundary principle, not a new relationship skill. |
| `relationship_test` | `OUT_OF_SCOPE` | Inducing proof of care by silence or manipulation is not communication coaching. |
| `use_humor`, `self_deprecate`, `imitate_tong_persona` | `STYLE_OR_PERSONA` | User preference/identity-specific; unsupported autobiographical claims and likeness risk. |
| `directness`, `conclusion_first` | `STYLE_OR_PROFILE` | Ordering/tone profiles and current language guidance; not a universal function. |
| `workplace_boundary`, `romantic_apology`, `customer_negotiation` | `SITUATION_OR_ROUTING_TAG` | Domains/scenarios; atoms must work across them. |
| `be_warm`, `avoid_sycophancy`, `humanlike_message` | `PRODUCT_CONSTRAINT` | Global quality/evaluation requirements, not selective strategy IDs. |
| Thanos memory/knowledge/reasoning/task execution | `OUT_OF_SCOPE` | Different system functions and later milestones. |
| High-certainty guesses about another's feelings | `OUT_OF_SCOPE` | Unsupported mind-reading and persona-specific worldview. |
| Extra `clarification` or `apology` alias skill | `REJECT_DUPLICATE` | Existing job already has stable production ID. |
| A skill for choosing accept/refuse/ask/close | `PHASE3_ACTION_CONCERN` | `AgentAction` and user choice are fixed upstream; skills only change HOW. |

## K. Playbook candidates

Order is illustrative, **not** implemented routing or an instruction to force every step. Omit steps unsupported by current evidence or user intent.

| Playbook | Possible component capabilities and order | Why not atomic |
| --- | --- | --- |
| Active listening / understanding | Visible acknowledgement → necessary clarification → optional confirmation → concise response | Several distinct jobs; mechanical mirroring adds no independent selection. |
| Conflict resolution | Perspective/validation if visible → de-escalation → necessary clarification → limit/feedback → supported planning | Outcome and order vary; calm disagreement may be the right result. |
| Relationship repair | Acknowledge supported mistake → apology if intended → validate impact → realistic next step | Repair cannot assert forgiveness or reconciliation. |
| Difficult feedback conversation | Perspective acknowledgement → constructive feedback → request/limit → clarify response if necessary | Feedback delivery is a candidate atom; conversation management remains a sequence. |
| Negotiation | Clarify constraints → state request/limit → offer supported alternatives → explain known tradeoffs → confirm chosen next step | Multi-party choices and facts cannot be decided by a skill. |
| Supportive response | Validation → grounded reassurance or possible encouragement → question only if necessary | “Empathy” is broad; not all cases warrant advice or questions. |
| Missed commitment | Acknowledge supported delay → apology if warranted → status update → realistic expectation | Existing coordination/repair atoms compose; no “missed commitment” skill. |

## L. Principle / tactic candidates

These belong inside approved atoms or global guards, with specific limits—not as standalone skill identities.

| Principle/tactic | Likely parent capabilities | Risk / limitation |
| --- | --- | --- |
| Tentatively reflect visible content | Validation, perspective acknowledgement, clarification | No formulaic echo or unspoken emotion label. |
| Name a visible concern before response | Validation, perspective acknowledgement, feedback | Recognition is not factual agreement. |
| Summarize only to verify/organize | Confirmation, status, planning | Avoid needless repetition or invented interpretation. |
| One material, calibrated question | Clarification, possible constraint inquiry | Phase 3 may already have fixed no question; no question inflation. |
| Preserve dignity / give a truthful way to disagree | Decline, request, boundary, feedback, de-escalation | No fake reason, deception, or pressure. |
| State a need rather than test for mind-reading | Request, boundary | Do not infer unmet relationship needs absent user evidence. |
| Redirect conflict toward supported next step | De-escalation, planning/request | Do not suppress legitimate anger or impose reconciliation. |
| Concrete behavior rather than identity attack | Constructive feedback, de-escalation | Require user-owned observations; no diagnosis/motive claim. |
| Support effort and agency | Reassurance, possible encouragement | No empty praise or outcome certainty. |
| Brief conclusion-first ordering | Status, request, decline, language/style modifiers | Never turn uncertain/conditional content into a fixed promise. |
| Optional humor | Style/profile only, possibly de-escalation | Avoid in distress, power imbalance, or when user did not prefer it. |

## M. Situation / routing metadata

Keep these outside skill identity: invitation, request, earlier visible ask, status request, missed commitment, mistake (with speaker ownership), conflict, repeated pressure, emotional support, feedback delivery/receipt, visible misunderstanding, material ambiguity, apparent shared understanding, supported option, time/place coordination, stated concern, relationship context, language of visible chat, and user-stated tone preference. A metadata label is **evidence**, not an instruction to fabricate content or guarantee selection. “No recent observed messaging evidence” is not proof that there was no interaction. Current visible evidence normally outranks old memory; inferred identity is never confirmed identity.

## N. Style / persona concepts

The Tong repository distinguishes expression characteristics from advice. Directness, conclusion-first structure, humor, self-deprecation, distinctive catchphrases, and first-person voice belong to style/profile/persona review, not universal capability identity. Existing `en.professional_conciseness`, `en.casual_naturalness`, `en.direct_but_polite`, `zh.politeness_calibration`, `zh.professional_formality`, `zh.natural_conciseness`, and `zh.code_switching` remain the baseline language modifiers; this document does not expand them. User-supported tone may shape wording, but should not cause celebrity imitation, invented life history, unapproved roleplay, or a worldview treated as fact. Humor is especially unsuitable as default handling of distress or a power imbalance.

## O. Global product constraints and manipulation review

These apply whether **zero, one, or several** skills are selected:

| Constraint | Consequence for normalization |
| --- | --- |
| `AgentAction` and user decision are upstream | Skills alter HOW, not WHAT: no acceptance/refusal reversal, extra question, unsupported no-reply decision, or automatic sending. |
| Preserve facts, commitments, reasons, and certainty | No invented deadlines, excuses, progress, user experiences, promises, fault, or false confidence. |
| Current evidence dominates history | Never turn remembered preference or inferred relationship pattern into proof against visible conversation. |
| Ask only when necessary | Clarification, confirmation, or preference inquiry is not a reason to always ask. |
| No manipulation | Reject covert influence, false scarcity/authority/urgency, guilt, forced reciprocity, relationship tests, deceptive face-saving, and compliance optimization. |
| Appropriate boundaries | Calmness, empathy, or negotiation cannot erase a user's supported limit or refusal. |
| Privacy and autonomy | Sensitive screenshots/messages are not research artifacts; coach presents/copies drafts and never sends for the user. |
| Quality calibration | Use EQ rubric concepts as checks for warmth, tailoring, boundary fit, moralising, and sycophancy—not as invented selectable IDs. |

Persuasion is especially ambiguous: explaining a **user-supplied reason** or a **supported alternative** can be ethical communication; converting an uncertain request into a pressure tactic cannot. Source examples, including persona-specific opinions, are not permission to infer another person's motive or mental state.

## P. Language conclusion

**No new conceptual language modifier is justified.** English, Simplified Chinese, and Traditional Chinese need language-appropriate expression with existing approved modifiers; mixed-language context should preserve intentional code-switching where supported. Other languages may use universal capabilities only under the current boundary. Face-saving is a cross-capability dignity principle, not proof that Chinese speakers require one cultural style. None of the five sources establishes a general English/Chinese rule from a single person's expressions. Any later modifier needs independent multilingual evidence, locale-specific positive/hard-negative cases, and proof it preserves the user's decision and certainty.

## Q. Genuine capability gaps after normalization

| Bucket | Concept(s) | Gap judgment |
| --- | --- | --- |
| `STRONG_GAPS` | Perspective acknowledgement | Missing recognition of a stated **interpretation**, which is not emotion validation, agreement, or a request for missing information. Composition lacks the no-concession boundary. Cross-context in disagreements, misunderstandings, feedback; nearest neighbor validation. Safety: no mind-reading/disputed-fact endorsement. |
| `STRONG_GAPS` | Confirmation | Missing verification of an apparently understood **material detail** rather than retrieval of unknown detail. Clarification/planning composition can assert an unsupported commitment. Cross-context in handoffs, plans, requests; nearest neighbor clarification. Safety: only necessary checks, no invented certainty. |
| `STRONG_GAPS` | Constructive feedback delivery | Missing supported behavior–impact–action structure; de-escalation + request can be calm yet fail to identify the observed behavior. Cross-context in family, peer, workplace, and service correction; nearest neighbor raise concern/boundary. Safety: no motive/identity attack or manufactured evidence. |
| `POSSIBLE_GAPS` | Encouragement, alternative proposal, tradeoff framing, constraint/preference inquiry, raise/receive feedback, rationale, stated-concern response, appreciation, supported self-disclosure | Potential independent jobs, but each overlaps one or more existing atoms, depends on user-supplied facts/choice, or lacks demonstrated routing value. See I; test composition first. |
| `NO_GAP_AFTER_NORMALIZATION` | Reflective listening, mirroring, labeling, echoing, rephrasing, summaries, tactical empathy | Techniques or refinements to existing validation/clarification and possible perspective/confirmation. |
| `NO_GAP_AFTER_NORMALIZATION` | Conflict resolution, relationship repair, negotiation, active listening, generic empathy | Playbooks/frameworks composed of separate jobs. |
| `NO_GAP_AFTER_NORMALIZATION` | Face-saving, dignity, direct expression, solution-focus, conflict avoidance | Cross-cutting principles or current-skill extensions, bounded against deception and boundary suppression. |
| `NO_GAP_AFTER_NORMALIZATION` | Humor, directness, conclusion-first, persona voice, extra English/Chinese cultural rule | Style/profile or unsupported generalization; existing modifiers remain. |

Three strong gaps would mean **17 conceptual universal atoms if all were approved**, not an automatic target or Phase 3 registry change. This deliberately leaves the requested later ~45–55 expansion undecided: no count pressure may override atomicity.

## R. Phase 4 conceptual requirements — not a final schema

| Priority | Conceptual need | Why / boundary |
| --- | --- | --- |
| `CLEARLY_NEEDED` | Stable approved identity and lifecycle; explicit universal/language eligibility | Keep current IDs/version/status semantics; draft/generated skills must not enter runtime. |
| `CLEARLY_NEEDED` | One-job description, positive use case, negative and hard-negative exclusions | Neighbor matrix is otherwise only prose; avoid over-selection and duplicates. |
| `CLEARLY_NEEDED` | Immutable upstream action and intent-preserving composition; 0–4 bounded selection with `NONE` | Core product invariant and current baseline. Selection cannot decide acceptance, refusal, commitments, or questions. |
| `CLEARLY_NEEDED` | Compact independently authored principles and “avoid” rules, validated before model use | Preserve safe output without copying source artifacts; normal path should not become multi-call. |
| `CLEARLY_NEEDED` | Deterministic fixtures covering speaker ownership, current evidence, near-neighbor exclusion, unsupported facts, certainty, and zero-skill cases | These are real decision boundaries, not just happy-path prose. |
| `LIKELY_USEFUL` | Human-facing capability family and alias/neighbor review metadata | Help catalog navigation, deduplication, and factory review; not necessarily runtime routing fields. |
| `LIKELY_USEFUL` | Source/provenance, limitations, counterexamples, approval rationale for **drafts** | Future factory can trace evidence while keeping runtime approved-only. |
| `LIKELY_USEFUL` | Composition compatibility and exclusions where measured confusion warrants them | Current compatibility refs are not a dependency graph; do not create one speculatively. |
| `CAN_WAIT` | Playbook DSL, skill dependencies/strategy trees, semantic retrieval/vector search, long-term memory-driven selection, generated registry ingestion | No current caller or measured scale need; later approved milestones/privacy review required. |

Phase 4 should decide representation after inspecting existing `packages/contracts`, `packages/skills`, `packages/ai`, and deterministic tests; this document is not a parallel schema or prompt pipeline. A hard-negative fixture is evidence of a **selection boundary**, not a source quotation or a model few-shot by default. If model-facing examples are added later, they must be short, independently authored, privacy-safe, and checked against the user's decision.

## S. Skill Factory observations for later phases

| Research lesson | Future review record / gate | Limitation |
| --- | --- | --- |
| Thanos reveals overlapping conversational terminology | Record source term, proposed one-job definition, aliases, and nearest existing neighbors before proposing a new atom. | Dataset taxonomy is not our product taxonomy; no research-only dialogue reuse. |
| Wondel packages tactics in larger methods | Extract the communication purpose separately from tactic name; test whether existing atoms can express it. | A named technique or framework is not a skill ID; influence needs manipulation review. |
| EQ-Bench offers quality/negative dimensions | Record intended benefit plus counterexamples for unsupported warmth, moralising, sycophancy, poor tailoring, or boundary violation. | Rubric score alone cannot validate selection or user-intent preservation. |
| METRO separates strategy action, micro-rule, sequence | Store candidate capability, should/should-not principles, and possible playbook order **separately** in a draft review. | Do not import a strategy tree or retrieval architecture at current catalog scale. |
| Tong separates raw observations, expressions, heuristics, applications, limitations, external views, decisions, chronology | Preserve evidence type, source URL/version/date, confidence, limits, contradictory observations, and whether a claim is persona-specific. | MIT repo license does not license underlying transcript, likeness, or secondary content; one person's behavior is not universal rule. |
| All five require deduplication | Compare aliases, job, positive/negative/hard-negative cases, composition alternatives, and nearest neighbor before approval. | Factory-generated prose must remain draft; human approval is necessary before runtime use. |

A future factory should preserve **observations and candidates separately from confirmed/approved skills**; extract principles only after provenance and rights review; use independently written examples; mark unsupported relationship assumptions; and require a product/privacy reviewer to sign off on atomicity, manipulation risk, language generalization, and source rights. Capability discovery can be empirical without making model-generated skill text executable.

## T. Human product decisions still required

| Decision | Options and evidence needed | Safe default until decided |
| --- | --- | --- |
| Perspective acknowledgement versus validation extension | Compare exact positive/hard-negative fixtures: stated interpretation without visible emotion, emotion without interpretation, disputed fact. Review whether independently routed guidance changes outputs. | Keep conceptual candidate, do not route. |
| Confirmation versus clarification mode | Test verification of known-but-material detail against missing/ambiguous detail and needless-question cases; measure confusion and answer quality. | Treat confirmation as candidate, never force a question. |
| Constructive feedback versus concern/limit composition | Test behavior–impact–request cases and allegation/identity-attack negatives across relationships. | Do not add feedback ID without evidence ownership guard. |
| Encouragement and appreciation | Human review of genuine support versus unsupported praise/sycophancy; compare reassurance composition. | Possible candidates only. |
| Alternatives/tradeoffs/negotiation | Determine how to represent user-approved options and whether independently selected framing helps without changing decisions. | Compose approved current skills when supported; no negotiation atom. |
| Self-disclosure | Decide what consent and user-supplied autobiographical provenance are sufficient. | Do not invent personal history; defer. |
| Face-saving and cultural expression | Multilingual/user testing of truthful dignity framing, including disagreement and refusal, without stereotyping. | Shared principle, no new locale rule. |
| Phase 4 metadata depth | Measure whether family/aliases/conflicts improve human review or deterministic selection enough to justify fields. | Keep conceptual labels in design documentation. |

## Completion and proliferation audit

All 14 current universal skills have a canonical family; external terms are mapped with one primary classification; synonyms are not counted as additions; broad frameworks, tactics, style/persona, situations, and global constraints are separated. Each strong candidate has one job, composition test, cross-context claim, nearest neighbor, seven-part score, safety rule, positive/negative/hard-negative case, and source inspiration. The matrix provides more than 20 difficult neighbor pairs. Tong observations are normalized without copying examples or universalizing an individual's style. The 15-question proliferation audit rejects the weak atoms in J and retains I as undecided. `AgentAction` remains upstream; `NONE` remains valid. No final ~50 registry, YAML files, routing, playbooks, dependencies, provider changes, or tests are proposed as Phase 3 implementation.
