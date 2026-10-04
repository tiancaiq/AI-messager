# Phase B4 Composer A/B quality evaluation

Status: controlled generation and human review complete. Decision: **BLOCKED_BY_REGRESSION**. Production remains legacy-authoritative; no B5/cutover is authorized.

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
| `decline-after-action` | Both arms rejected by the lexical guard | The human reviewer accepted “I'll pass tonight” as a conventional refusal. For this B4 comparison only: `guard_result = false_positive`, `human_override = accepted`, final judgment Tie. The production guard was not weakened. |
| `ordinary-polite-follow-up` | Legacy arm rejected; new passed | The guard appears to treat the polite request modal “Could you” as uncertainty; a “Please let me know” alternative then lacks an uncertainty marker. This may be a lexical false positive. |
| `ordinary-ask-for-help` | New arm rejected; legacy passed | The same “Could you” request-modal issue appears when an alternative says “Can you help.” This may be a lexical false positive. |

The guard result applies to the whole returned package, including alternatives. The blind review artifact shows all primary and alternative messages, not only the primary. A prettier primary cannot erase a true alternative-level meaning failure. The evaluator itself was not changed in B4; any false-positive override requires explicit reviewer justification and would be a separate evaluated decision.

Observed per-arm wall-clock time (including the same request-local coaching/shadow work as well as provider latency) was median 2,567 ms, worst 6,612 ms for legacy and median 2,491 ms, worst 4,062 ms for new. One run and different call order cannot support a latency advantage claim. The adapter does not expose provider token usage, so exact monetary cost is not asserted; the exposure is bounded by 60 calls and the same 3,000 maximum output tokens per call.

## Human dispositions and unblinded outcome

The human reviewer supplied 30 case-level A/B/Tie/failure decisions before the mapping was read. They accepted four unsupported-status cases as factual failures despite guard PASS; accepted the `decline-after-action` guard false positive and Tie; rejected `sparse-nicer` as a misconstructed tone-path fixture; and conditioned `ordinary-appreciation` on source evidence. The source has only the **other person** thanking the user and a user draft expressing appreciation. It does not establish a prior **user** thank-you, so both packages' “again” alternatives are unsupported: **Both unacceptable** at package level even though the primaries are fine. The complete human decisions and source-check note are in ignored local `.local-eval/b4/human-decisions.json`; the candidate worksheet remains private local evaluation material, not history or analytics.

Audit sequence: the human decisions were already supplied in chat before unblinding. The arm map was opened before those decisions were transcribed into `human-decisions.json`. No decisions were changed based on the mapping, but the file itself must **not** be described as sealed before unblinding. This is a process deviation from the B4 plan's stricter file-write order.

| Outcome | Count | Cases |
| --- | ---: | --- |
| `NEW_WIN` | 4 | `apology-mistake`, `manager-recipient-unproven`, `chinese-boundary-traditional`, `ordinary-polite-follow-up` |
| `LEGACY_WIN` | 10 | `missed-commitment`, `korean-universal`, `emotional-support`, `simple-planning`, `direct-refusal`, `less-confrontational-no-apology`, `english-chinese-code-switch`, `repair-and-empathy`, `ordinary-clear-next-step`, `ordinary-ask-for-help` |
| `TIE` | 10 | `professional-status`, `simplified-status`, `mixed-planning`, `clear-refusal`, `repeated-pressure-boundary`, `decline-after-action`, `uncertain-availability`, `disagree-relationship`, `cap-pressure-multi-need`, `identity-label-only` |
| `BOTH_FAIL` | 5 | `status-request`, `regional-english-status`, `regional-traditional-status`, `unsupported-primary-code-switching`, `ordinary-appreciation` |
| `NOT_COMPARABLE` | 1 | `sparse-nicer` |

The four status failures have the same human reason code: `unsupported_status_or_followup_fact`. Their source material establishes a request for status, not “no update,” “no progress,” ongoing checking, or a future follow-up commitment. This is a **meaning/factual-validity failure**, regardless of deterministic guard PASS, language correctness or prose quality. In `ordinary-appreciation`, `unsupported_prior_thanks_in_alternative` is likewise package-level: an unsupported alternative cannot be ignored because its primary is acceptable. Among 24 comparable, non-failing cases, the new arm won four and the legacy arm ten; ten tied. These are exploratory, single-generation judgments, not a statistical population estimate.

Preference reasons are in the blind worksheet and approved decision record. The decisive pattern is not a general new-guidance advantage: legacy better preserved the tentative “tomorrow” anchor in `missed-commitment`, avoided an unsupported send commitment in `korean-universal`, avoided invented indecision in `simple-planning`, and often produced more faithful/natural alternatives. New guidance improved the direct apology in `apology-mistake`, the supported boundary in `chinese-boundary-traditional`, and the request wording in `ordinary-polite-follow-up`. `manager-recipient-unproven` favored new wording without treating the recipient label as verified identity. Meaning validity took priority over style throughout.

`sparse-nicer` is `NOT_COMPARABLE` / `FIX_FIXTURE`: “Make this nicer” was placed in the compose draft, not carried as an Agent-side explicit tone instruction attached to actual content. It counts in none of the win/tie/failure categories. Zero selected communication skills must not erase a validated explicit user tone instruction; the Agent → Composer instruction path needs its own future fixture and implementation review.

## B4 decision and follow-up issues

**BLOCKED_BY_REGRESSION.** The new arm loses more decisive comparisons than it wins (10 to 4), and its `missed-commitment` package loses a meaning-critical time anchor in an alternative while the legacy package retains it. Five both-fail cases reveal shared Composer factual-validity problems, not evidence for cutting over either arm. The current lexical guard also misses unsupported status/follow-up facts and rejects valid refusal phrasing. The B3.5 Skill pipeline remains signed off as shadow expertise, but this B4 result does **not** justify production SkillPlan authority or B5 cutover planning. A later, separately approved refinement/evaluation milestone should address these issues and rerun representative cases before reconsidering cutover.

Durable follow-up issue record (all deferred; no B4 production behavior change):

1. `GUARD-STATUS-01` — add source-grounded checks/evaluation for unsupported “no update,” “no progress,” ongoing-checking and future-follow-up facts. Cover all four `unsupported_status_or_followup_fact` cases; do not reduce this to a keyword-only patch that falsely rejects supported status content.
2. `GUARD-REFUSAL-02` — recognize conventional refusals such as “I'll pass,” “I'll pass tonight,” “I think I'll pass,” and “我还是不参加了” without accepting contradictory invitations. Four executable `it.fails` regression cases document current false positives; convert them to normal passing tests when repaired. Preserve the existing negated-refusal/acceptance tests.
3. `GUARD-MODAL-03` — distinguish polite request “Could you” from uncertain commitment in `ordinary-polite-follow-up` and `ordinary-ask-for-help`; review the guard's package-level false positives without silently overriding them in production.
4. `COMPOSER-MEANING-04` — investigate SkillPlan-derived guidance and Composer alternatives that drop “tomorrow” in `missed-commitment`; require package-level meaning preservation.
5. `FIXTURE-TONE-05` — replace `sparse-nicer` with content plus a validated Agent-side tone instruction; test the instruction path independently of skill count before reuse.

No model judge, prompt revision, production guard change, additional provider call, automatic sending, B5 work or runtime cutover was performed in B4.

## Validation status

Evaluation-only tests verify 30 distinct provider-generation cases, equal request/action/Composer payload except guidance, same guards, no provider on local actions, balanced call order and 60-call cap. Post-review validation passes: `pnpm test` (47 files; 313 ordinary passes and four expected-failure guard regressions), `pnpm lint`, `pnpm typecheck`, `pnpm build`, B3.5 and B4 evaluation TypeScript checks, Phase 4 evaluation 21/21, B3.5 33-case evaluation, and Windows-safe Prettier. The focused coaching-engine test has 25 normal passes and four expected failures. Final Git whitespace/state checks are recorded in the B4 plan. The live run used only the ignored private synthetic artifact directory, and the production legacy path remains unchanged.
