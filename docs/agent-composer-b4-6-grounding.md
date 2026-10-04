# Phase B4.6 Composer grounding contract and propagation audit

Status: design prepared before B4.6 implementation; B4.5 baseline frozen at `af6e9e3` (`agent-architecture-b4-5-freeze`). The later [targeted evaluation](agent-composer-b4-6-targeted-evaluation.md) found one unresolved alternative-level boundary-weakening failure.

## Authority and priority

The Agent's validated action, explicit selection and user-owned evidence define **what may be asserted**. The Skill System supplies approved communication technique, not facts or authority to commit the user. The Composer writes wording within those bounds and never changes the action. Internally, the task to the Composer orders `MUST PRESERVE > MUST NOT INVENT > CORE COMMUNICATION GUIDANCE > OPTIONAL STYLE`. The first two classes constrain *every* primary and alternative. This is a request-local provider-neutral contract, not another SkillPlan, public IPC schema, memory record or model reasoning trace.

`CommunicationProblem.meaningToPreserve` already chooses explicit selected intent or the observed draft; its source/provenance are suitable starting points. For `SUGGEST_REPLY` without either, there is no user-owned answer fact. The other person's message can establish that a question was asked, but not that the user lacks an update, is checking, will follow up, can send a file, or is available. A Skill principle such as “state known status clearly” remains technique-only. Identity, relationship and emotional inference from weak context never become confirmed facts.

## Existing propagation audit

| Meaning or control | Current source | Current Composer payload | B4/B4.5 failure or conclusion | B4.6 treatment |
| --- | --- | --- | --- | --- |
| Fixed action and explicit selection | `coaching-policy.ts`; `CoachingRequest.selection` | `fixedDecision`, `selectedIntent` in adapter JSON | Action stable; no Skill-stage authority leak | Keep policy unchanged and validate exact action on task and output. |
| User-owned draft/intent | `CommunicationProblem.sourceDraft` / `meaningToPreserve` | Raw `draft` and `selectedIntent`; no separate anchor class | `missed-commitment` once lost “tomorrow” in an alternative despite visible draft | Derive bounded source-qualified timing/refusal/uncertainty anchors and put them above guidance; guard every candidate. |
| Other-speaker request | `ConversationAnalysis.messages` with `speaker: OTHER` | Message text/order/speaker but no explicit ownership rule | Status replies inferred user's knowledge state; Korean request became send promise | Mark requests as *not* user commitments or status facts; add narrow generation mode and candidate backstops. |
| User-owned status/checking/follow-up | High-confidence USER message, draft, or explicit selection | Present only as ordinary text when available | B4.5 high-signal guard catches some claims, misses “I lack information” | Distinguish supported from unsupported claim categories. If status is unknown, fixed `SUGGEST_REPLY` may ask the other person which update/scope they mean; it may not assert the user's internal state. |
| Language/script | Validated `ConversationAnalysis.language` | `language` JSON and system instruction | B4.5 bilingual 3 PM false positive repaired; Korean case still made unsupported promise | Preserve output language/script when required and keep 3 PM equivalence guard. No new language-specific Skill. |
| Skill guidance | Production `CommunicationPlan.principles/avoid`; evaluation-only approved `SkillPlan` projection | Flat `communicationGuidance` arrays | B4.5 audit found no proven adapter truncation or content distortion | Carry exact technique arrays in the lower-priority core-guidance class; do not copy IDs, evidence refs, registry or control fields into prompt. |
| Explicit tone | Validated `UserSuppliedCommunicationContext.instruction` | No production producer/Composer port | `sparse-nicer` repaired only as test seam | Pass independent Agent-owned style in a deterministic test of task/payload; do not claim production UI support or force a Skill. |
| Returned alternatives | Structured output schema, up to three variants | B4.5 guards loop over all candidates | Invalid “again,” lost tomorrow, hardened proposal appeared in alternatives | Every candidate obeys the same preservation/non-invention contract; valid primary plus invalid alternative fails the package. |

The B4.5 15-case root-cause matrix found ten primary Composer generation causes, four shared-system status limitations and one selection hypothesis. The B4.5 focused rerun improved win parity but left three both-fail status cases and a new-arm unsupported Korean send commitment. No case proves a Skill assessment, selector, compiler or compatibility-adapter defect that merits a B4.6 Skill change. The single `ordinary-clear-next-step` selection hypothesis remains a monitored quality difference, not permission to revise B3.5.

## Bounded internal task design

The Composer task should contain:

- exact fixed action from policy, never a Skill output;
- bounded `mustPreserve` anchors with `concept`, normalized or concise `value`, `certainty`, `owner`, and source reference, derived only from explicit selected intent, reliable user-owned draft/message or validated language observation;
- bounded `mustNotInvent` categories covering unsupported status/no-progress, ongoing checking, follow-up, send/review commitment, availability, deadline, identity, relationship, emotion, fault/admission, prior action and reason/excuse;
- exact approved technique strings as core communication guidance, separated from optional Agent-owned style/tone;
- a conservative `statusReplyMode` when a fixed reply is requested but no user-owned status exists. This is a content constraint, not a new action. It requires a grounded scope question to the other person or safe failure, never a claim that the user has no information.

`MUST NOT INVENT` means *unsupported* claims. It does not ban a status or commitment that the user actually stated. A bounded deterministic derivation may abstain when source ownership/confidence is unclear; it may not treat OTHER text as a user fact. Structural task validation rejects action mismatch, unbounded anchors/categories, contradictory requirements and promotion of visible contact cues into confirmed identity/relationship. The adapter remains provider-specific only for serialization/structured output; the task and guards remain provider-neutral.

## Guard and generation responsibility

The Composer instruction should be short and source-specific: requests/questions from OTHER do not prove USER facts; use the four task priorities; alternatives vary wording rather than meaning; unknown status must not become an assertion of no update, checking, lack of information or promised follow-up. The task conveys the source/anchor separation, while narrow post-provider guards reject high-signal unsupported claims and check each candidate. These checks cannot prove all paraphrases or emotional nuances, so fresh human review is required for live output.

For `Any update?` with no user status, a safe suggested *message* can ask “Which project do you mean?” when scope is not specified. It is still `SUGGEST_REPLY` because the output is a suggested reply to the other person, not an Agent-side `ASK_CLARIFICATION` action or a new user goal. If the source already identifies a project but contains no actual status, a similarly bounded question about the requested aspect may be possible; otherwise fail safely. Do not answer with the application's own lack of context, which is not the user's asserted state.

## Privacy and test boundary

Task/anchor text exists only in memory for the active request and may reach the selected provider alongside the already-approved minimized source. It is not logged, persisted as user history, sent to `apps/api`, or exposed to the renderer as reasoning. Synthetic deterministic fixtures are committed; normalized live candidates and blind worksheets stay under ignored `.local-eval/b4-6/`. No raw provider response, key, screenshot, private conversation or Skill registry is stored. The production renderer has no free-form instruction producer; the zero-skill tone example remains a test-only integration seam.
