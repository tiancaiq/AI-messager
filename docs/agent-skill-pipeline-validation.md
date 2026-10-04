# Phase B3.5 Skill pipeline validation report

Status: all 21 synthetic expertise cases have human dispositions, the four follow-up assessment corrections pass deterministic validation, and the human reviewer granted **B3.5 FULL SIGNOFF**. Production cutover remains a separate decision.

## Frozen inputs and method

- Agent baseline: B3 freeze commit `fed2d0f3c1d7134b6ca8ceade1bbf22e319cb342` (`agent-architecture-b3-freeze`).
- Skills baseline: committed `dcc52eb15b578a4dbc65e4c74b64dbf9806cc899`; concurrent untracked Skills/SRS work was not consumed or changed.
- Approved runtime SHA-256: `d3bd95cd2fe91c999f0331e25c4f68438954ed21804d43f35616a7f7239497ca`; validated snapshot `approved-fnv128:f292695be12e86102468e1fa9f7d27f5`.
- The test-only runner in `packages/ai/tests/skill-pipeline-harness.ts` executes the real Phase A normalization, bounded evidence projection, six-signal assessment, evidence-aware selection and deterministic compiler. It separately executes the real flat selector on the same fixed action/context. No provider or Composer is involved. `scripts/evaluate-skill-pipeline.ts` prints only structural comparison data by default; `--review` prints approved guidance for synthetic review cases only.

## Structural comparison

| Source | Fixtures | MATCH | EXPECTED_DIFFERENCE | POTENTIAL_IMPROVEMENT | POTENTIAL_REGRESSION | NOT_COMPARABLE |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Frozen skill fixtures | 21 | 17 | 3 | 0 | 1 | 0 |
| New adversarial fixtures | 12 | 7 | 0 | 1 | 4 | 0 |
| Total | 33 | 24 | 3 | 1 | 5 | 0 |

`MATCH` requires the same selected exact ID/version references in the same order, compatible `NONE`/compiled statuses, and equal principle/avoidance strings in order. `EXPECTED_DIFFERENCE` means a validated structural change with no clear benefit/harm. `POTENTIAL_IMPROVEMENT` means the new path adds selected expertise where legacy has none. `POTENTIAL_REGRESSION` conservatively means it loses a legacy selected reference; it is not itself a judgment that the loss is harmful. `NOT_COMPARABLE` means a stage failed. Separate fixture assertions catch forbidden or missing expected skills; category labels are structural diagnostics, not final-message quality judgments. Before the reviewer-directed corrections the same 33 cases were all `MATCH`; the nine differences below are expected after intentionally changing only the shadow path. Re-run after any catalog revision.

| Non-MATCH case | Structural reason | Disposition |
| --- | --- | --- |
| `missed-commitment` | Same four references; meaning-critical expectation/status move earlier, changing guidance order only. | Expected ordering difference; all approved guidance retained. |
| `professional-status` | Same four references; expectation/status move earlier, changing guidance order only. | Expected ordering difference; all approved guidance retained. |
| `mixed-planning` | `expectation_setting@1` enters for “大概 3 点” and displaces `zh.natural_conciseness@1` under the four-skill cap. | Human-directed assessment correction. Planning and code-switching remain, while the tentative time now gets explicit no-promise guidance. The mechanical legacy-reference loss is labeled `POTENTIAL_REGRESSION`, not judged harmful. |
| `uncertain-availability` | Legacy selects none; shadow selects `expectation_setting@1` plus secondary `en.casual_naturalness@1` for “might be available tomorrow.” | Human-directed assessment correction; `POTENTIAL_IMPROVEMENT` means supported expertise was added, not proven final-message improvement. |
| `less-confrontational-no-apology` | Same four references; boundary/de-escalation/refusal move before the English style modifier. | Expected ordering difference; no apology or guidance loss. |
| `disagree-relationship` | `decline@1` is removed and the supported explanation request enters; selected set and guidance change. The comparator labels any legacy-reference loss `POTENTIAL_REGRESSION`. | Reviewer rejected `decline`: disagreement is not refusal. The shadow correction resolves that false relevance; the production legacy path is intentionally unchanged. |
| `cap-pressure-multi-need` | Style and a duplicate repair slot are removed; `expectation_setting@1` and `status_update@1` enter, changing selected set and guidance. | Reviewer required meaning/commitment priority. The shadow result now retains uncertain timing/status guidance and one repair skill plus help; the production legacy path is intentionally unchanged. |
| `english-chinese-code-switch` | `expectation_setting@1` enters for “Maybe 下午三點; I need to check first” and displaces `zh.natural_conciseness@1` under the cap. | Human-directed assessment correction. Planning and code-switching remain; the tentative time receives explicit no-promise guidance. `POTENTIAL_REGRESSION` is the conservative legacy-reference-loss label. |
| `repair-and-empathy` | Unsupported `status_update@1` is removed from a missed-review event; the three supported repair/empathy skills remain. | Human-directed assessment correction. No progress/status meaning was present; genuine review-progress counterexamples still select status guidance. `POTENTIAL_REGRESSION` is mechanical, not an expertise judgment. |

The 12 adversarial cases cover sparse input, uncertainty, refusal, explicit no-apology, unproven manager identity, disagreement with relationship concern, >4-skill cap pressure, Traditional Chinese boundary wording, English/Chinese code-switching, ambiguous speaker/no draft, visible identity label alone, and repair plus empathy. The conflict matrix uses an additional local synthetic catalog variant because the committed approved runtime currently declares no conflict pair among its active definitions; the test confirms the selector resolves the synthetic conflict and a conflicting set forged into B3 compilation fails closed. A separate local variant adds one eligible active and one inactive skill, reverses registry order, and checks snapshot change, exact refs and bounded output. No fixed 21-skill assumption is used.

## Invariants and evidence audit

Across all 33 cases, tests assert fixed policy action, exact selection-to-plan ID/version identity, active status, action/language eligibility, four-skill cap, deterministic order, 12+12 guidance bounds, approved-definition-only guidance, no duplicate principles/avoidances, no exact principle/avoidance collision, no unselected-skill citation, and no output control fields. Every assessment need, selection reason and compiled guidance citation resolves to supplied bounded evidence. `NONE` is distinct from `FAILED`; sparse or local-action cases do not invent a fallback skill. Unknown identity and relationship remain explicit unknowns even when a synthetic display label or manager-directed instruction is present.

Fault probes reject duplicate evidence IDs, dangling refs, unsupported signals, malformed stage outputs, overlong guidance, orchestration fields, wrong fingerprint, unresolved/inactive/version-mismatched skills, invalid language and conflicting selected sets. Repeating identical inputs gives identical assessment, selection and plan. Reversing catalog definition order changes the fingerprint but not semantic output; an authoring-path field is rejected by the strict runtime definition schema. Existing coaching tests and a B3.5 fake-provider probe confirm that only the legacy plan reaches Composer, with unchanged public result and provider-call count. Structural traces contain no synthetic message/draft/contact/instruction text, full guidance or provider payload.

These deterministic checks establish schema, provenance-reference and approved-text fidelity. They do not prove semantic relevance of each selected skill or that two differently worded principles could never contradict each other. The human-review set addresses those judgments without a model judge or Composer A/B.

## Reviewer dispositions and correction

The reviewer rejected `decline@1` for `disagree-relationship`: “I disagree” and “don't want to argue” do not refuse a request. Agent-side shadow normalization now removes a broad legacy `decline` tag unless the request-local meaning-to-preserve text contains explicit refusal evidence. The Skill System receives only the refined structural tag, not the raw text. Focused tests cover the rejected phrasing, a related non-refusal phrase, direct refusal, Traditional Chinese refusal and negated-refusal behavior.

The reviewer marked `cap-pressure-multi-need` blocking. Under cap pressure the shadow selector now prioritizes supported expectation/status meaning, then distinct core functions, before language-specific expression modifiers. It applies a marginal penalty when apology and mistake acknowledgment compete for scarce slots. This case now selects `expectation_setting@1`, `status_update@1`, `acknowledge_mistake@1` and `ask_for_help@1`; the approved avoidance “Do not convert maybe or probably into a promise” is present. The alternative of selecting `apology@1` instead of mistake acknowledgment remains a possible human preference, but the reviewer explicitly allowed either repair choice when source fault is supported.

The reviewer accepted `request@1` as a secondary function in `chinese-boundary-traditional`: “請不要再催” literally requests that the other person stop pressing. The existing four selections remain valid. A crowded synthetic variant adds supported conflict and empathy needs; boundary/refusal and those stronger functions fill the cap while `request@1` drops. Thus the secondary request does not displace the core boundary/refusal expertise.

The reviewer then dispositioned the remaining 18 cases: 13 `ACCEPT`, one `ACCEPT` with a later Agent-side tone-path caveat for `sparse-nicer`, and four `FIX_ASSESSMENT`. The three tentative timing/availability fixtures now expose `set_expectation` from user-owned draft evidence, allowing the existing approved `expectation_setting@1` to compete above an incidental style modifier. This does not turn tentative timing into a commitment; its compiled avoidance explicitly prohibits converting “maybe” or “probably” into a promise. The separate `repair-and-empathy` correction removes status tags caused only by the word “review” when neither the latest visible message nor user-owned meaning supplies actual progress/status semantics. Counterexamples for “status of the review,” “when will the review be done,” and a progress-update request retain `status_update@1`. These are Agent-side shadow refinements; no catalog or Skill compiler rule changed. See the [full human-review record](agent-skill-pipeline-human-review.md) and [assessment correction plan](../.agent/plans/agent-architecture-phase-b3-5-assessment.md).

No test demonstrated action/loop authority leakage, fabricated identity/relationship, invented factual text in SkillPlan, or an unexpected safety/eligibility regression across all 33 cases. The five `POTENTIAL_REGRESSION` labels are conservative structural labels for reviewer-directed replacement/removal of legacy references and are dispositioned above; they do not mean the corrected shadow path is worse. This remains **shadow-only**. All 21 cases have human dispositions, and the reviewer granted post-fix **B3.5 FULL SIGNOFF**. Do not cut over or claim better final wording without B4 quality evidence and a later cutover decision.

## Local performance baseline

One Windows host run after two warm-up passes, over 10 measured passes of all 33 synthetic fixtures (330 samples):

| Stage | Median | Worst observed |
| --- | ---: | ---: |
| Assessment | 0.161 ms | 0.838 ms |
| Selection | 5.053 ms | 11.428 ms |
| Compilation | 2.421 ms | 6.663 ms |
| Full local pipeline, including normalization/projection | 8.282 ms | 15.280 ms |

These timings are a local sanity baseline, not a service-level target or provider latency measure. The full sample includes deterministic policy/problem/context/projection work and the legacy comparison, so it is not simply the sum of the three stage medians.

## Validation gates

Focused production-isolation/B3.5 tests passed (2 files, 36 tests), including 11 B3.5 harness tests and counterexamples for the four human-directed corrections. The full suite passed (46 files, 307 tests), as did repository ESLint, six workspace typechecks plus the dedicated B3.5 test-harness typecheck, five package/API builds, desktop main/native-staging/preload/renderer builds, the existing Phase 4 evaluation (21/21 scenarios), and `prettier --check . --end-of-line auto`. `git diff --check` and an untracked-file trailing-whitespace scan found no whitespace error. The Windows checkout's documented CRLF materialization exception does not change the repository LF policy (`git ls-files --eol` shows `i/lf` for all touched tracked files); no unrelated files were normalized. No live-provider test was run or required.

## Scope and limitations

No live model, Composer A/B, generated-final-message comparison, private conversation, screenshot, persistence, analytics, SDK, runtime routing change or extra provider call was added. Guidance is approved generic text with selection-level citations; citations do not prove the wording of each guideline semantically. Reviewers should judge communication expertise only. B4/B5, model-assisted Skill behavior, Supervisor and specialist runtime remain separate future decisions.
