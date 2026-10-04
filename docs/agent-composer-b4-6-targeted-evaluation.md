# Phase B4.6 targeted Composer grounding evaluation

Status: targeted evaluation complete; **12 human-acceptable packages, one human-rejected package; targeted gate FAIL**. Decision: `NEEDS_COMPOSER_REFINEMENT`. The conditional 23-pair A/B was not run.

## Frozen baseline and change under test

B4.5 remains frozen at `af6e9e3c56ec660d25319976a2209b4eee3d7111` (`agent-architecture-b4-5-freeze`): 6 new wins, 6 legacy wins, 8 ties, 3 both-fail, 0 not comparable; `NEEDS_COMPOSER_REFINEMENT`. Its five ignored artifacts retained the hashes recorded in the [B4.6 plan](../.agent/plans/agent-architecture-phase-b4-6.md) before and after the targeted run. Skills remain at `dcc52eb15b578a4dbc65e4c74b64dbf9806cc899`, catalog `approved-fnv128:f292695be12e86102468e1fa9f7d27f5` and registry SHA-256 `d3bd95cd2fe91c999f0331e25c4f68438954ed21804d43f35616a7f7239497ca`.

The [grounding design](agent-composer-b4-6-grounding.md) was written before source changes. B4.6 added an internal Zod-validated Composer task: fixed policy action; bounded, source-qualified meaning anchors; unsupported-claim categories; core Skill technique; and separate Agent-owned optional style. Unknown status with a fixed reply action receives a scope-question constraint, not a fabricated user information state. The provider-neutral boundary carries this task into the existing OpenAI adapter; the structured output schema/model/token limit and production legacy selector are unchanged. A few narrow high-signal candidate guards now check unsupported user information-state, send/review/availability commitment and explicit emotion claims. B4.5 status, prior-thanks, uncertainty, refusal and bilingual-time guards still run on every candidate. No Skill assessment, ranking, cap, compiler, catalog, taxonomy or evaluation compatibility-adapter change was made.

## Precommitted design and execution

The plan locked 13 synthetic cases/13 maximum calls before any live request: four unknown-status variants, the Korean unsupported-send case, missed commitment, appreciation, six meaning/Skill controls including one new user-supported no-update fixture, and a help request. One new-guidance arm per case tests grounding first; no A/B identity is exposed in the local worksheet. There were no retries, model judges, real user conversations, screenshots or full B4 reruns.

Provider `openai`, model `gpt-5.6-luna`, same existing adapter with `store: false`, strict root-object structured output, 3,000 output-token limit, no explicit temperature/seed/reasoning setting, and the approved Skills snapshot. The existing ignored local credential was loaded in process and not printed or stored in a committed file. The provider received only synthetic fixture text and bounded task/guidance. Normalized candidates and review artifacts remain ignored under `.local-eval/b4-6/targeted/`, not analytics, history or telemetry; no raw HTTP/provider payload is saved. Content-free operational output reported case IDs, rule codes and timings only.

The run completed **13/13 calls**; all 13 provider results were schema-valid and **0/13 packages were deterministically rejected**. Median request-local duration was approximately **2,529 ms**, worst **4,687 ms**. The adapter does not expose token usage, so exact monetary cost is unavailable. One sample per case cannot establish a failure rate.

## Candidate-level human review

The ignored local [worksheet](../.local-eval/b4-6/targeted/review.md) shows source, fixed action, primary/alternatives and guard result for every case. The separate ignored [recommendations](../.local-eval/b4-6/targeted/recommendations.md) were Codex's provisional analysis; the [human-decision record](../.local-eval/b4-6/targeted/human-decisions.json) records the subsequent approval of 12 packages and rejection of one.

| Cases | Human meaning/factual disposition |
| --- | --- |
| `status-request`, `regional-english-status`, `regional-traditional-status` | Acceptable scope questions; no invented no-update, no-progress, checking, user-information-state or follow-up. |
| `unsupported-primary-code-switching` | Acceptable Korean scope questions under the human review, with the previously noted weak presupposition caveat. |
| `korean-universal` | Acceptable acknowledgments without an explicit send promise under the human review. |
| `missed-commitment` | All candidates retain tentative tomorrow and testing delay. |
| `ordinary-appreciation` | All candidates avoid unsupported “again.” |
| `clear-refusal`, `uncertain-availability`, `cap-pressure-multi-need`, `ordinary-ask-for-help` | Acceptable controls preserving meaning, commitment and uncertainty. |
| `supported-status-b4-6` | Both candidates repeat the user-owned “No update yet” without adding checking/follow-up. |
| `chinese-boundary-traditional` | **Unacceptable control**: one alternative adds `先` (“for now/first”) to the unqualified “do not press me” boundary. The human reviewer judged this `MATERIAL_MEANING_WEAKENING`: it implies the pressure might be acceptable later. Guard PASS missed it; the valid primary cannot rescue the package. |

The precommitted **13/13 human-acceptable**, **zero unsupported alternatives**, and **all six controls acceptable** gates therefore fail. There were **zero unsupported-status, unsupported-commitment, and uncertainty/timing failures** in this targeted sample, but **one alternative-level meaning failure**. Five of six control packages are acceptable. The zero deterministic rejection rate is not a pass substitute: the new boundary failure is an observed guard blind spot. Per the locked plan, **no conditional A/B, full B4 rerun, B5 or cutover** follows this failed gate. No threshold or sample count was changed after the outputs.

Four expected-failing deterministic regression examples now document the unfixed temporal-softening class: `先`, `暫時`, “for now” and “at the moment” introduced into a durable pressure boundary. These are future Composer/guard refinement targets, not claims that B4.6 fixed the class. A later refinement should also test source-supported temporary boundaries as positive counterexamples and avoid broad false positives on unrelated temporal language.

## Deterministic validation and limitations

Before live calls: `pnpm test` passed 51 files/376 tests; `pnpm lint`, `pnpm typecheck`, `pnpm build` passed across packages/API/desktop; B3.5/B4/B4.5/B4.6 evaluation TypeScript checks passed; Phase 4 evaluation remained 21/21; B3.5 comparison remained 33 cases with category counts 24 MATCH / 3 EXPECTED_DIFFERENCE / 1 POTENTIAL_IMPROVEMENT / 5 POTENTIAL_REGRESSION. Windows-safe `prettier --check . --end-of-line auto`, `git diff --check`, `git ls-files --eol` tracked/index LF checks, the B4.6 runner's no-provider readiness mode and all five frozen B4.5 artifact hashes passed. The task/guard tests covered 28 deterministic grounding scenarios plus two target-set controls; the human-reviewed failure added four expected-failing boundary regressions. Default CI made no provider call.

The new task cannot prove semantic entailment or compare all cross-language paraphrases. Temporal softening of a boundary passes current lexical guards, and a fluent scope question may still presuppose a user capability. Human review remains authoritative for these cases. Production has no free-form tone-instruction producer; its zero-skill tone-path proof remains test-only. No production SkillPlan cutover or Agent action change occurred. The next recommended work is a **separately planned narrow Composer refinement** that preserves durable-boundary scope in every candidate, with source-supported-temporariness counterexamples and a new small targeted gate before any comparative A/B. It is not B5.
