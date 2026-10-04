# Phase B4 Composer A/B quality evaluation

Status: controlled generation and deterministic gates complete; blind human quality review pending. No final win/loss recommendation or production cutover is authorized yet.

## Frozen inputs and isolation

- Signed-off Agent B3.5 freeze: `b9eef8a171782973104189a1bf804b6b1432c657` (`agent-architecture-b3-5-freeze`). Skills committed baseline: `dcc52eb15b578a4dbc65e4c74b64dbf9806cc899`. Approved runtime registry JSON SHA-256: `d3bd95cd2fe91c999f0331e25c4f68438954ed21804d43f35616a7f7239497ca`; snapshot: `approved-fnv128:f292695be12e86102468e1fa9f7d27f5`.
- Thirty synthetic provider-generation cases: 26 from the signed-off 33-case B3.5 set after excluding fixed local actions, plus four ordinary synthetic drafts. The set includes refusal, uncertainty, pressure/cap, repair/empathy, unknown identity/relationship, unsupported-primary-language and English/Chinese boundary cases. The approved active catalog has no declared conflict pair; its synthetic conflict test remains deterministic-only and does not change either live arm's snapshot.
- Variant A uses the legacy flat `CommunicationPlan`; Variant B uses the B3.5 assessment/selection/`SkillPlan` projected through an evaluation-only compatibility adapter. Both call the existing `coachConversation` and `OpenAiCoachingAdapter` with the same `CoachingRequest`, fixed policy/action, `COACHING_INSTRUCTIONS`, provider, model, output schema, `store: false`, 3,000 maximum output tokens and adapter defaults for other generation settings. The only intended provider-payload difference is the bounded `communicationGuidance` content. The model received no arm label or claim that one guidance source is newer.
- Provider: OpenAI; model: `gpt-5.6-luna` (the adapter's default, with no `OPENAI_TEXT_MODEL` override). Temperature, reasoning setting and seed are not explicitly sent by the existing adapter. Call order was balanced, 15 pairs legacy-first and 15 new-first, using a fixed evaluation seed. Provider nondeterminism remains; this is exploratory evidence, not a perfectly controlled causal estimate.
- The user authorized reuse of the existing local credential. It was loaded in process from an ignored local environment file without copying it into the worktree, printing it or storing it in artifacts. Only synthetic text was sent. The private local `blind-review.md`, `arm-map.json`, and `results.json` are under ignored `.local-eval/b4/`, not production telemetry or user history. No provider payloads, authorization headers or raw upstream responses were saved.

## Live generation and deterministic guards

The opt-in runner made exactly **60 calls** for 30 pairs, with no retry, additional model judge or production call. All 60 provider results passed the strict output schema. The same production action/refusal/uncertainty/factual-anchor guard accepted 55 arms: 28/30 legacy and 27/30 new. At the pair level, 26 had both arms guard-valid, three had one guard rejection, and one had both rejected.

| Case | Candidate-level guard result | Initial technical audit, not a human quality verdict |
| --- | --- | --- |
| `missed-commitment` | New arm rejected; legacy passed | One new-arm alternative omits the draft's “tomorrow” anchor, although its primary keeps tentative tomorrow. This is a real candidate-package meaning-preservation failure under the current guard. |
| `decline-after-action` | Both arms rejected | Both packages contain “I'll pass tonight,” an ordinary refusal form apparently not recognized by the lexical refusal guard. This may be a guard false positive; it needs explicit human review rather than automatic override. |
| `ordinary-polite-follow-up` | Legacy arm rejected; new passed | The guard appears to treat the polite request modal “Could you” as uncertainty; a “Please let me know” alternative then lacks an uncertainty marker. This may be a lexical false positive. |
| `ordinary-ask-for-help` | New arm rejected; legacy passed | The same “Could you” request-modal issue appears when an alternative says “Can you help.” This may be a lexical false positive. |

The guard result applies to the whole returned package, including alternatives. The blind review artifact shows all primary and alternative messages, not only the primary. A prettier primary cannot erase a true alternative-level meaning failure. The evaluator itself was not changed in B4; any false-positive override requires explicit reviewer justification and would be a separate evaluated decision.

Observed per-arm wall-clock time (including the same request-local coaching/shadow work as well as provider latency) was median 2,567 ms, worst 6,612 ms for legacy and median 2,491 ms, worst 4,062 ms for new. One run and different call order cannot support a latency advantage claim. The adapter does not expose provider token usage, so exact monetary cost is not asserted; the exposure is bounded by 60 calls and the same 3,000 maximum output tokens per call.

## Blind review gate

The generated private blind review worksheet at `.local-eval/b4/blind-review.md` labels candidates A/B without indicating legacy/new. A separate ignored `blind-recommendations.md` proposes 30 case-level judgments for the human reviewer to approve or correct; it was drafted without opening the arm map and is not itself signoff. The mapping is in a separate ignored artifact and must remain sealed until judgments are recorded. For every case, the reviewer should choose A better, B better, tie, both unacceptable or cannot determine, and explain meaning/factual validity first, followed by instruction fit, communication effectiveness, naturalness, relevance, concision, unsupported inference and tone. The four guard-affected cases require particular attention. Deterministic guard failures remain blocking unless the reviewer explicitly finds and documents a false positive.

The `sparse-nicer` case tests Skill abstention but does **not** prove end-to-end handling of an explicit “nicer” instruction: today's production `CoachingRequest` lacks a Composer input for the optional Phase A instruction seam. The previously reviewed caveat remains open for a later integration decision. Some synthetic prompts may lead both arms to make unsupported commitments despite passing lexical guards; human review must identify these. No model judge is a substitute for that review.

No `NEW_WIN`, `LEGACY_WIN`, `TIE`, `BOTH_FAIL` or `NOT_COMPARABLE` counts, per-dimension conclusions or B4 recommendation are assigned before the blind human decisions. The decision must be one of `READY_FOR_CUTOVER_PLANNING`, `NEEDS_SKILL_PIPELINE_REFINEMENT`, `NEEDS_COMPOSER_ADAPTER_REFINEMENT`, `NO_MEANINGFUL_QUALITY_GAIN`, or `BLOCKED_BY_REGRESSION`. Even a favorable decision cannot make the new SkillPlan production-authoritative without a separate B5/cutover approval.

## Validation status

Evaluation-only tests verify 30 distinct provider-generation cases, equal request/action/Composer payload except guidance, same guards, no provider on local actions, balanced call order and 60-call cap. The full deterministic suite passes 47 files / 313 tests; ESLint, eight TypeScript checks, five package/API builds, desktop main/native-staging/preload/renderer builds, Phase 4 evaluation 21/21, and B3.5 33-case evaluation pass. Windows-safe Prettier, `git diff --check` and untracked-file trailing-whitespace checks pass; the approved runtime JSON fingerprint was independently rechecked. The live run used only the ignored private synthetic artifact directory, and the production legacy path remains unchanged.
