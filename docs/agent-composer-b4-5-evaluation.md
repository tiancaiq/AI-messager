# Phase B4.5 focused Composer A/B evaluation

Status: **human-reviewed; `NEEDS_COMPOSER_REFINEMENT`**. The focused result does not authorize a full B4 rerun or B5.

## Frozen baseline and changes

B4 remains frozen at `be935923967862e9a65af669c7ca1ec7784125fa` (`agent-architecture-b4-freeze`): 4 new wins, 10 legacy wins, 10 ties, 5 both fail, 1 not comparable, `BLOCKED_BY_REGRESSION`. The original ignored `.local-eval/b4/` artifacts and their recorded hashes are unchanged. Skills remain at `dcc52eb15b578a4dbc65e4c74b64dbf9806cc899`, approved snapshot `approved-fnv128:f292695be12e86102468e1fa9f7d27f5`, runtime registry SHA-256 `d3bd95cd2fe91c999f0331e25c4f68438954ed21804d43f35616a7f7239497ca`. The [15-case root-cause audit](agent-composer-b4-5-root-causes.md) was written before remediation: ten primary `COMPOSER_PROMPT_OR_GENERATION`, four `SHARED_SYSTEM_LIMITATION`, one `SELECTION`; no proven primary assessment/compiler/compatibility-adapter fault. The single selection quality hypothesis did not justify changing the B3.5-signed pipeline.

B4.5 changed the **shared production Composer prompt** narrowly: each primary and alternative must independently preserve meaning/factual support, and a status request without status evidence must not become an assertion of no update/checking/future follow-up. This affects both A/B arms equally and is an experiment difference from historical B4. The provider-neutral guard now returns an internal structural rule code, compares high-signal status claim classes with bounded user-owned source evidence, rejects unsupported “thanks again,” accepts known conventional English/Chinese refusals, and stops treating recipient-directed “Could you” as uncertainty about the user. It still validates every candidate. The user-facing invalid-response shape is unchanged. The B3.5 assessment, selection, SkillPlan compiler, approved registry and B4 compatibility adapter were not changed.

The repaired `sparse-nicer-repaired` fixture has an actual draft plus separately validated Agent-side `Make this nicer.` instruction. Its deterministic probe proves zero selected skills need not erase the Agent instruction; it is **test-only**, not part of the live 23-case set. Today's production `CoachingRequest` has no free-form instruction producer/Composer port, so B4.5 does not claim an end-to-end production tone path.

## Precommitted design and live generation

The [B4.5 plan](../.agent/plans/agent-architecture-phase-b4-5.md) locked 23 cases and a 46-call cap before generation: all ten prior legacy wins, all five prior both-fail cases, two additional guard cases (with `ordinary-ask-for-help` already in the ten), and six clean-tie/new-win controls. The precommitted directional gate requires zero unresolved new-arm meaning-critical failures; at most one of four status cases still both-fail for unsupported status/follow-up and no unsupported prior-thanks alternative in an acceptable appreciation package; repaired refusal/modals without new contradiction; stable control meaning; `LEGACY_WIN - NEW_WIN ≤ 2`; and unchanged B3.5 evaluation. No threshold was set after seeing outputs.

The opt-in run completed **23 pairs / 46 calls**, no retries, no model judge, no full B4 rerun. Provider `openai`, model `gpt-5.6-luna`, same fixed action/source fixtures, current shared Composer core, strict output schemas, `store: false`, 3,000 output-token limit, adapter defaults and evaluation-only guidance projection for both arms. The two shared prompt sentences and guard repairs are the only intentional B4→B4.5 runtime differences; between B4.5 arms, guidance source/content remains the intended variable. No temperature, seed or reasoning setting was explicitly sent. Order alternated with a fixed local seed (12 first calls from one arm, 11 from the other), concealed in ignored `.local-eval/b4-5/arm-map.json`. Only synthetic fixture text was sent; the reused credential was loaded in process from the ignored local environment file, never copied or printed.

The 46 provider results were schema-valid. The repaired deterministic guard passed **42/46 arms**, with one rejected arm each in four cases:

| Case | Internal rule code | Meaning audit before human disposition |
| --- | --- | --- |
| `less-confrontational-no-apology` | `REFUSAL_PRESERVATION` | Human-confirmed false positive: “I'm not willing to continue” is a refusal. The reviewer accepted B as valid but preferred A. A narrow post-review guard regression now accepts this exact construction without accepting contradictory assent. |
| `english-chinese-code-switch` | `FACTUAL_ANCHOR` | Human-confirmed false positive: “下午三點” and “3 PM” are equivalent here; final quality verdict is Tie. A narrow post-review anchor normalization covers this exact equivalence, not arbitrary afternoon times (`GUARD-ANCHOR-06`). |
| `regional-traditional-status` | `STATUS_GROUNDING` | The rejected package asserts the user lacks progress information, unsupported by the source. The other package asks which project is meant. Human assessment remains necessary. |
| `ordinary-appreciation` | `PRIOR_APPRECIATION` | One alternative says “Thanks again” without any prior user thank-you. The other package does not. This is a real package-level factual failure. |

The four earlier English/Chinese refusal examples and the B4 polite-request modal examples now pass deterministic tests and the corresponding live cases `decline-after-action`, `ordinary-polite-follow-up`, and `ordinary-ask-for-help` pass both arms. Both arms of `missed-commitment` preserve tentative tomorrow in every returned candidate and pass the anchor guard. Those are encouraging *candidate-level* observations, not final human quality judgments.

The original four status cases no longer all assert literal “no progress/no update” in their primaries, but three cases instead assert the user's lack of information or talk about absent progress information “in this conversation.” The reviewer judged all three **both unacceptable** under the fixed `SUGGEST_REPLY` action. The Traditional Chinese case has one acceptable clarifying package and one unsupported information-state package. Deterministic PASS did not establish source support. `GUARD-STATUS-01` is a bounded heuristic, not complete semantic verification. The Korean no-status commitment problem also remains outside the current high-signal claim patterns.

Across 46 calls, median observed request-local duration was approximately **2,486 ms** and worst approximately **6,849 ms**, including local planning/guard work and provider time. The adapter does not expose provider token usage; exact monetary cost cannot be computed. One generation per arm and alternating, non-simultaneous call order limit causal claims.

## Human review, unblinded tally, and gate

The ignored `.local-eval/b4-5/blind-review.md` showed source, fixed action, primary, alternatives and guard codes under A/B labels without arm identities. The human reviewer approved the 21 other provisional judgments, explicitly accepted two guard false positives, preferred A for `less-confrontational-no-apology`, and called `english-chinese-code-switch` a Tie. These 23 judgments were recorded in ignored `human-decisions.json` and checked against all 23 result case IDs **before** opening `arm-map.json`. No historical B4 judgment or artifact was changed. Candidate meaning/factual failures outranked style.

| Result | Focused B4.5 | Frozen full B4 (different dataset) |
| --- | ---: | ---: |
| `NEW_WIN` | 6 | 4 |
| `LEGACY_WIN` | 6 | 10 |
| `TIE` | 8 | 10 |
| `BOTH_FAIL` | 3 | 5 |
| `NOT_COMPARABLE` | 0 | 1 |

The 23-case dispositions, in fixture order, are:

| Cases | Unblinded result |
| --- | --- |
| `missed-commitment`, `korean-universal`, `emotional-support`, `less-confrontational-no-apology`, `repair-and-empathy`, `decline-after-action` | `LEGACY_WIN` |
| `simple-planning`, `direct-refusal`, `ordinary-clear-next-step`, `regional-traditional-status`, `ordinary-appreciation`, `chinese-boundary-traditional` | `NEW_WIN` |
| `english-chinese-code-switch`, `ordinary-ask-for-help`, `ordinary-polite-follow-up`, `professional-status`, `uncertain-availability`, `clear-refusal`, `apology-mistake`, `cap-pressure-multi-need` | `TIE` |
| `status-request`, `regional-english-status`, `unsupported-primary-code-switching` | `BOTH_FAIL` |

The sampled live run had **4 guard-rejected arms**. Human review confirmed **2 false positives**, recorded as accepted overrides for evaluation only; the other 2 were real unsupported claims (`regional-traditional-status`, `ordinary-appreciation`). After the review, deterministic tests of the exact rejected candidate packages pass under the narrow refusal/3 PM repairs. These tests do **not** retroactively edit the live run's original 42/46 guard count or its outputs. The unsupported-status and prior-thanks guard failures remain failures.

The meaning-critical outcome is mixed. The previous `missed-commitment` alternative anchor loss was absent from both fresh packages, and the decisive-loss difference improved from B4's 6 to **0**. Yet all three both-fail status packages still make unsupported assertions about the user's information state; one additional new-arm Korean package promises to send material without user-owned commitment. The new-arm `repair-and-empathy` alternative also strengthens causal attribution, and the legacy `ordinary-clear-next-step` alternative hardens a proposal into a commitment. These are human-observed candidate-level issues that lexical guard PASS did not settle. `ordinary-appreciation` is no longer both-fail: one package is grounded, while the other still has an unsupported “again” alternative and is guard-rejected.

The precommitted gate **fails**: three of four original status cases are still both-fail (allowed maximum one), and the new arm has an unresolved meaning-critical Korean promise (required zero). Parity, repaired tentative-tomorrow output, most refusal/modal cases and unchanged B3.5 results satisfy their respective directional checks, but do not cancel the factual failures. The primary remaining cause is shared Composer behavior on sparse status evidence, with a narrower guard-detection gap for user-information-state assertions and commitments. Recommendation: **`NEEDS_COMPOSER_REFINEMENT`**. Do not run full B4 or cut over SkillPlan; separately review a focused next refinement that handles unavailable user-owned status facts without drafting an unsupported user claim, plus bounded guard coverage. The current sampling cannot prove how often these failures occur.

## Deterministic validation

Before live generation: `pnpm test` passed 49 files / 343 tests; `pnpm lint`, `pnpm typecheck`, `pnpm build` passed across packages/API and desktop; B3.5/B4/B4.5 evaluation TypeScript checks passed; Phase 4 evaluation passed 21/21; B3.5 structural evaluation remained 33 cases with the same 24/3/1/5 category counts; Windows-safe Prettier and `git diff --check` passed after formatting only changed B4.5 files. After human review and two narrow guard repairs, the same gates passed again: 49 files / 346 tests; Phase 4 21/21; B3.5 33 cases with unchanged 24/3/1/5 counts; package/API/desktop build; all three evaluation TypeScript configs; formatting and diff checks. The B4.5 runner's readiness mode passed with **no provider call**. `git ls-files --eol` confirmed tracked/index LF on changed tracked files; some Windows worktree paths materialize CRLF, with no repository-policy change. All five frozen B4 artifact hashes remain unchanged. Exact commands are logged in the [milestone plan](../.agent/plans/agent-architecture-phase-b4-5.md).
