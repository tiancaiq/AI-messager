# Product behavior

## Product promise

AI Message Coach should make a useful first move from visible context. It serves users who have a rough draft, an incomplete thought, or no idea what to say. It must not turn a common messaging moment into an interview.

The product rule is:

> Infer first → generate when confident → offer choices when uncertain → ask only when necessary.

The coach assists with wording and communication strategy. It does not impersonate the user, make commitments without signaling them, or send anything automatically.

## Invocation and context capture

The primary interaction is **Generate**. Clicking it is an explicit request to capture and analyze the conversation context the user is currently viewing. Message Coach should temporarily hide itself, request context through one reusable conversation-capture capability, restore itself, and show the result.

A global shortcut and future quick-action UI may call the same capability as optional conveniences. They must not create separate behavior or make the shortcut the architectural center of capture.

Manual region selection is acceptable for initial setup and remains available as a fallback or correction when automatic context selection is unavailable or wrong. The long-term common case should not require the user to think about screenshots: “I press Generate and Message Coach understands what conversation I am looking at.” Capture occurs only after an explicit trigger; continuous or background screen recording is prohibited.

## Inputs the coach may use

Within the explicitly captured and locally selected conversation region, the coach may analyze:

- visible message text, order, timestamps, and grouping;
- likely ownership of visible messages;
- text currently typed in the compose box;
- visible username/display name and avatar as weak identity signals;
- conversation and draft language, including English/Chinese code-switching;
- likely relationship, situation, intentions, and emotional cues.

The capture should include both visible conversation history and text currently typed in the compose box whenever they are visible. The draft is a high-value direct signal for choosing between rewriting, completing, suggesting a reply, offering actions, or asking one necessary question.

The coach may later use trusted, relevant, fresh local memory only after the applicable identity and relevance gates pass. Absence from captured context is not proof of absence in the relationship.

## Actions

```ts
type AgentAction =
  | "REWRITE_DRAFT"
  | "COMPLETE_DRAFT"
  | "SUGGEST_REPLY"
  | "SUGGEST_ACTIONS"
  | "ASK_CLARIFICATION"
  | "NO_REPLY_NEEDED";
```

### Decision order

1. Determine whether a visible draft exists and whether it expresses a usable intent.
2. Determine whether the conversation creates a clear need or opportunity to reply.
3. Estimate whether the user's likely goal is clear enough to generate safely.
4. If several likely goals remain, decide whether bounded choices can represent them.
5. Ask one clarification only if choosing wrongly would materially change the meaning, commitment, relationship impact, or safety of the response.

| Condition | Preferred action | Expected UI |
|---|---|---|
| Draft exists; intent is clear | `REWRITE_DRAFT` | Improved draft, optionally concise/natural variants |
| Draft exists; thought is clearly unfinished | `COMPLETE_DRAFT` | One completion plus limited variants when useful |
| No draft; response intent is clear | `SUGGEST_REPLY` | One recommended reply and up to a few useful alternatives |
| Situation is clear; user goal is uncertain | `SUGGEST_ACTIONS` | Two to four concrete choices such as Accept, Decline, Maybe, Ask details |
| Low confidence; plausible paths materially diverge | `ASK_CLARIFICATION` | One high-value, easy-to-answer question |
| Conversation does not reasonably call for a reply | `NO_REPLY_NEEDED` | Brief explanation; optional low-pressure acknowledgment if useful |

Do not ask “What do you want to say?” when the captured context or draft already supplies the answer.

## Draft handling

The current draft is the strongest direct intent signal, but not an unconditional instruction. The coach should preserve its intended meaning, factual claims, commitments, language, and appropriate level of formality unless the user selects a different direction.

A rewrite may improve clarity, tone, grammar, concision, empathy, or structure. It should not invent dates, causes, promises, feelings, or authority. If the draft is ambiguous only in a low-impact way, choose the most conservative natural wording instead of asking.

A completion should distinguish a clearly unfinished sentence from a short but complete message. It should not expand brevity merely to sound “AI-polished.”

## Empty-draft handling

When the visible conversation makes the reply obvious, respond directly. When several common goals are plausible, show action choices rather than an open-ended prompt. Each action should be meaningfully distinct, not superficial tone variations.

Example: “Are you coming tonight?” can yield Accept, Decline, Maybe, and Ask for details. Choosing one can produce a ready-to-copy reply without another questionnaire.

## Clarification gate

`ASK_CLARIFICATION` requires both conditions:

1. confidence is low in information needed for the response; and
2. getting it wrong would materially change the outcome.

Material differences include accepting versus rejecting a commitment, affectionate versus formal framing, admitting fault versus disputing a claim, disclosing sensitive information, or escalating a conflict. Minor tone uncertainty is not material.

The question must:

- be the single highest-value missing fact;
- offer concise choices when possible;
- avoid asking for information already visible;
- avoid requesting sensitive information unless necessary;
- lead directly to a result after one answer.

## Confidence dimensions

Track independent confidence for:

- identity;
- broad and specific relationship;
- situation;
- user intent;
- other person's intent/emotional state;
- language;
- skill selection.

Confidence should be calibrated through fixtures and evaluations. It should not be displayed as fake precision to users. Product copy can communicate uncertainty naturally (“This looks like a professional update”) while internal records retain numeric values.

Use what is confidently known without forcing certainty everywhere. For example, `professional = 0.96` and `manager = 0.68` supports professional wording without asserting that the recipient is the user's manager.

## Identity behavior

Identity may use platform, username, display name, avatar similarity, conversation evidence, and local contact history. No single weak signal is sufficient. Avatar alone is never sufficient.

If the automatic association threshold is not met, treat the contact as unknown. Do not merge memory or personalize based on a guessed person. Relationship and situation inference can still operate independently.

## Relationship behavior

Represent relationship at two levels so useful tone decisions do not depend on an overconfident role guess:

- broad categories such as `professional` and `personal`;
- specific roles such as `manager`, `coworker`, `client`, `professor`, `friend`, `partner`, `family`, and `acquaintance`.

Track confidence for the broad category separately from confidence for the specific role. For example, `professional = 0.96` and `manager = 0.68` is enough to use professional communication behavior, but not enough to assert that the recipient is the user's manager. Prefer the narrowest relationship claim that the evidence supports, and treat old role memory as historical when current evidence conflicts with it.

## Language behavior

Detect separately:

- dominant conversation language;
- draft language;
- script variant for Chinese when discernible;
- code-switching.

Policy:

- English uses universal and English-specific skills.
- Simplified or Traditional Chinese uses universal and Chinese-specific skills.
- Other languages use universal skills only.
- Mixed English/Chinese may use both supported language modules where relevant.
- The current conversation normally outranks an old contact language preference.
- Preserve natural code-switching when it appears intentional; do not mechanically translate everything.

Unsupported does not mean forbidden: the model may reply in another language, but must not apply English- or Chinese-specific rhetoric as if it were universal.

## Provider selection and capabilities

AI Message Coach follows a bring-your-own-key model. The user eventually chooses a supported provider and model, supplies that provider's credential, and pays the provider directly. Product copy must not imply that Message Coach includes model-token usage.

Future settings should show the selected provider and model, safe credential-configuration status, relevant capabilities, screenshot-analysis eligibility, connection-test results, and the provider-billing disclosure. A stored key must never be displayed back to the renderer.

Task availability depends on model capabilities rather than provider name. Screenshot understanding requires vision and text generation. If the selected model cannot perform it, the UI should explain the limitation before sending private content. Provider-specific errors should become useful internal states such as invalid credentials, rate limiting, insufficient provider credits, model unavailable, unsupported vision, request too large, timeout, or generic provider failure; raw provider errors must not appear in product UI.

The first provider experience may use one provider/model for all supported tasks. Later versions may allow different vision, text, embedding, or evaluation models, but that complexity should not weaken the simple Generate flow.

Provider abstraction does not change language or skill behavior. A model understanding additional languages does not expand the set of validated language-specific communication skills.

## Result presentation

The floating panel should lead with a recommended result and make alternatives easy to compare. It should reveal enough context to catch a misread—such as an inferred “professional update” label—without exposing internal reasoning.

Every generated message remains editable and reviewable. Copying is explicit. Automatic sending is prohibited. If a future approved milestone supports insertion, insertion must still be an explicit user action and must not trigger send.

## Behavior examples

- Draft: “sry testing taking longer probably tomorrow”; professional project context → rewrite immediately with accountability, current status, and a cautious tomorrow estimate. Do not ask who the recipient is if professional framing is already clear.
- No draft; “Are you coming tonight?” → show action choices or a direct reply if prior visible text makes the answer obvious.
- Other person closes with “Thanks, that answers it” → `NO_REPLY_NEEDED`, perhaps with an optional brief acknowledgment.
- Ambiguous “Can you take care of it?” where the captured context does not reveal what “it” is → ask what task they mean only if a response would otherwise make a commitment with unknown scope.

## Evaluation targets

Fixture-based evaluation should measure:

- correct action selection;
- unnecessary-question rate;
- invented-fact or commitment rate;
- preservation of draft intent;
- useful action diversity;
- speaker/message-order extraction;
- language and code-switch detection;
- relationship granularity without overclaiming;
- no-reply precision;
- schema validity and privacy-safe failures.

Quality is not just eloquence. A polished response based on the wrong person, goal, or commitment is a failure.
