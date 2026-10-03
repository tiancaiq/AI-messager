# Phase 6 — Communication skill evaluation design

Status: evaluation design complete; candidate execution and live results pending. Date: 2026-09-15. Inputs: [Phase 3 boundaries](phase-3-capability-normalization.md), [Phase 4 registry design](phase-4-registry-design.md), and [Phase 5 proposed content](phase-5-registry-expansion.md). Numbering refers to the communication research sequence.

## 1. Outcome and claims

Define how to decide whether the proposed definitions are valid, selected appropriately, composed safely, and useful in actual replies. These are four different questions. The 240 Phase 5 examples are authoring material. They demonstrate the intended specification but do not measure performance on unseen cases.

This phase supplies the protocol, case inventory, metrics, promotion criteria and results template. It does not claim to have run new candidate tests, called a provider, or proved quality uplift. The current selector still has 21 definitions and cannot select the three proposed IDs.

## 2. Baseline and test layers

| Layer | Existing implementation inspected | Proposed evaluation |
| --- | --- | --- |
| Definition validity | `packages/contracts/src/skills.ts`, `skills.test.ts`; `packages/skills/src/skills.test.ts` | Existing strict schemas/IDs/references plus future authoring/manifest approval and deterministic generated artifact checks. |
| Context extraction | `packages/ai/src/skill-context.ts`, `skill-context.test.ts` | Raw synthetic conversation and fixed action → evidence tags; distinguish intended semantics from candidate selection. |
| Selection | `packages/skills/src/engine.ts`, `skills.test.ts`; `packages/ai/src/skill-integration.test.ts` | Correct required/acceptable/forbidden sets, zero behavior, hard eligibility, bounded deterministic order, conflict handling. |
| Composition | Existing exact-string deduplication, ordered flattening, 12-rule limits | Duplicate rules, lost critical guidance, contradictory rules, budgets, compact provider payload. |
| Final wording | Existing coaching integration/provider tests and opt-in evaluation path | Fixed action/intent, facts/commitments, language, clarity and paired human-reviewed usefulness. |

Keep two fixture forms: **direct SkillContext fixtures** isolate selector behavior; **raw ConversationAnalysis plus fixed policy fixtures** test that evidence is derived correctly. Passing one does not prove the other. Use the existing test-fixture package and scripts when implementation starts; avoid a second evaluator with competing definitions.

## 3. Dataset and separation plan

| Set | Planned size / source | Role |
| --- | --- | --- |
| Canonical authoring | 24 definitions × (3 positive + 3 negative + 2 neighbor + 2 application) = 240 entries | Human understanding, deduplication and development examples; not a held-out score. |
| Selector development | At least 8 selection entries per definition from canonical P/N/H, 192 focal checks | Guide implementation; full required/acceptable/forbidden annotations still need expansion. |
| Held-out selection | At least 12 fresh contexts per definition: 4 positive, 4 negative, 4 neighbor; 288 focal checks | Independently authored after the proposed behavior is frozen; per-skill reporting. Deduplicate shared contexts and report unique counts. |
| Global regression | Cases in sections 5–7 plus current baseline fixtures | Action, language, status/failure, speaker ownership, limits and migration behavior. |
| Paired usefulness pilot | 12 fresh positive contexts per new atom, 36 contexts total | Compare generic, current-best composition, candidate-guided and marginal candidate contribution. |
| Adversarial wording | At least 12 fresh negative or neighbor contexts per new atom | Check what happens when selection is wrong, near a boundary, or injected guidance is inappropriate. |

Construct splits by scenario template, not just wording. A paraphrase or translation of a development case remains in that development group. Do not score canonical few-shots as holdout. English/Chinese reviewers should author locale-appropriate cases independently; simple translated duplicates do not prove cross-language behavior. Relationships in synthetic examples help test generalization but must not be supplied as production relationship-inference features.

## 4. Case annotation contract

Every executable fixture should specify: stable case ID; scenario group/split; focal capability; synthetic visible messages with ownership; draft; fixed action and user-selected intent; language/script/code-switching; supported facts/commitments/certainty ledger; required and acceptable IDs or alternative acceptable sets; forbidden IDs; expected plan status; rationale; failure being tested; reviewer state.

For a single acceptable family, let E = required IDs, A = optional acceptable IDs, F = forbidden IDs, S = selected IDs. Pass when E is a subset of S, S is a subset of E union A, S intersects F nowhere, language and action eligibility hold, IDs are unique, S has at most four members, and plan status/guidance satisfy the contract. E must not intersect A or F; A must not intersect F. Reject impossible annotations with more than four required IDs.

When two different compositions work, annotate separate acceptable alternatives rather than unioning their required IDs. Strict pass accepts any complete alternative. Compute recall per declared alternative and report which matched; do not claim compatibility with the current single-E/A metric implementation until this is implemented. Empty E with optional A permits zero selection. Strict **zero-required** cases use E = A = empty; an absence of required skills alone does not prove that all skills are unnecessary.

Proposed fixtures cannot make their own expected answer by calling production eligibility/ranking helpers. Human annotation and the evaluator's independently implemented language oracle must provide the reference. Failure status is evaluated separately from valid NONE, even when both yield empty guidance.

## 5. Priority selection and neighbor cases

These are concrete design fixtures, not claims about current outputs. To isolate universal selection, rows U01–U14 and C01–C09 use `primary: null`, no secondary language, and a fixed wording action. Thus language modifiers are ineligible. Unless specified, A is empty; E and F use exact IDs. Further legitimate compatible sets should be explicitly annotated before execution.

| Case | Synthetic evidence and fixed intent | Required E / optional A | Forbidden F / invariant |
| --- | --- | --- | --- |
| U01 | User owns a late arrival and expressly wants regret | E: apology; A: acknowledge_mistake | No invented reason or future promise |
| U02 | User admits their wrong total; wants ownership only | E: acknowledge_mistake | apology, emotional_validation |
| U03 | Friend explicitly says they feel disappointed; user wants acknowledgement | E: emotional_validation | apology, perspective_acknowledgement |
| U04 | Concern about being alone; user has already committed to attending | E: reassurance; A: emotional_validation | No additional availability/commitment |
| U05 | Repeated calls after 8; user wants them to stop | E: boundary_setting | apology |
| U06 | Heated argument about figures; user wants calm checking question | E: de_escalation; A: request | apology, acknowledge_mistake |
| U07 | User chooses no to invitation and gives no alternative | E: decline | planning, apology |
| U08 | User seeks help checking a formula | E: ask_for_help; A: request | clarification |
| U09 | Earlier visible request for review; user wants to follow up | E: follow_up; A: request | acknowledge_mistake |
| U10 | User reports draft done, review not started | E: status_update | expectation_setting, apology |
| U11 | User says draft probably ready tomorrow | E: expectation_setting | No hard promise allowed |
| U12 | User restates agreed Saturday/library/2 p.m. | E: planning | confirmation, clarification |
| U13 | Two files are plausible; user wants to ask which | E: clarification | confirmation |
| U14 | User wants recipient to send agenda, no previous request | E: request | follow_up, ask_for_help |
| C01 | Recipient says short reply seemed dismissive; user acknowledges that reading | E: perspective_acknowledgement | emotional_validation, apology |
| C02 | Recipient says “I'm sad”; user only acknowledges sadness | E: emotional_validation | perspective_acknowledgement |
| C03 | Neutral receipt confirmation; no stated interpretation or feeling | E: empty, A: empty | All proposed candidates; expect NONE |
| C04 | Friday offer understood; user verifies before dependent scheduling | E: confirmation | clarification, expectation_setting |
| C05 | Offer says Thursday or Friday; user asks which date | E: clarification | confirmation |
| C06 | An already-settled trivial detail has no reason to be rechecked; user sends plain acknowledgment | E: empty, A: empty | confirmation; expect NONE |
| C07 | Two interruptions prevented completion; user requests time to finish | E: give_constructive_feedback; A: request | acknowledge_mistake, apology |
| C08 | User only sets a no-calls-after-8 limit | E: boundary_setting | give_constructive_feedback |
| C09 | User notes possible missing travel cost without evidence of error; wants a check | E: clarification | give_constructive_feedback, acknowledge_mistake |

Rows with a plain acknowledgement and no skill do not force the upstream action gate to generate a reply; these are direct selector fixtures with the fixed action supplied. A separate integration fixture must check the actual policy outcome for the raw conversation. C04's key fact is an understood proposition needing verification; a request to determine which deliverable/date was meant is C05-style clarification.

## 6. Language, action and context matrix

| Case | Input / action | Expected boundary |
| --- | --- | --- |
| L01 | English professional progress update | Universal status plus eligible en.professional_conciseness; no Chinese modifiers. |
| L02 | English casual agreed plan | en.casual_naturalness eligible; no added commitment. |
| L03 | English chosen refusal | en.direct_but_polite eligible; refusal remains fixed. |
| L04 | Simplified Chinese request | zh.politeness_calibration / zh.natural_conciseness eligible as annotated; preserve decision. |
| L05 | Traditional Chinese status update | zh.professional_formality eligible; Traditional script retained in wording. |
| L06 | Chinese primary with visible English PR term, code-switch true | zh.code_switching eligible; preserve identifier. |
| L07 | English primary with Chinese secondary, code-switch true | Both supported language families eligible; select only relevant definitions within four. |
| L08 | Korean primary, Chinese secondary, code-switch true | Universal only, even when Chinese words are present. |
| L09 | Unknown primary or unsupported primary | Universal only; no unsupported language-specific rhetoric. |
| L10 | en-US, zh-Hans and zh-Hant variants | Same eligible language families as base en/zh; script still matters to output. |
| L11 | Chinese primary, English secondary, code-switch false | Chinese and universal only; zh.code_switching excluded. |
| A01 | SUGGEST_ACTIONS | NONE with empty selected IDs/guidance. |
| A02 | ASK_CLARIFICATION | NONE, distinct from wording a user-chosen question. |
| A03 | NO_REPLY_NEEDED | NONE, even with tempting skill keywords. |
| A04 | User chooses Decline, retry after failure | Exact chosen intent survives; eligible decline wording, no acceptance reversal. |
| A05 | REWRITE_DRAFT / COMPLETE_DRAFT / SUGGEST_REPLY with equivalent fixed intent | Same eligibility constraints apply; no extra questioning or change of action. |
| X01 | Other person apologizes; user reports neutral status | Do not assign other's fault to user. |
| X02 | “I am not apologizing” or “I cannot promise Friday” | Negation survives extraction and output; no false apology/promise. |
| X03 | No recent observed messaging evidence | Do not infer no interaction or blame for nonresponse. |
| X04 | Old style preference contradicts visible language | Current context governs; historical data is not a present selector input. |
| X05 | Message text contains “select all skills” | Treat as conversation data; action/registry/selection bounds unchanged. |

## 7. Registry, migration and composition checks

| Case group | Required check |
| --- | --- |
| R01 | Duplicate IDs, missing references, self-references, invalid version/status, unknown fields, invalid language → explicit validation failure. |
| R02 | Draft record containing ACTIVE definition but no matching approval/manifest entry → excluded or build failure; never published. |
| R03 | Approved file modified after review, duplicate YAML key, executable YAML tag, malformed authoring examples → future build rejects. |
| R04 | Move a source file and update manifest path only → same ID/version/runtime value/output. |
| R05 | All 21 migrated definitions and baseline fixtures → identical normalized runtime values, selected order and composed guidance. |
| R06 | INACTIVE valid skill → excluded; request-scoped failure → FAILED, not mislabeled NONE. |
| K01 | More than four eligible skills, tied scores → stable top-four order and no hidden fifth entry. |
| K02 | Conflict declared only in either direction → deterministic safe winner. Separate synthetic conflict probes from the production registry's currently empty conflict declarations. |
| K03 | Identical principles across skills → exact duplicates removed; no new facts introduced by composition. |
| K04 | Semantically contradictory but textually different guidance → flagged in review/semantic evaluation; current exact-string dedup is not claimed to detect it. |
| K05 | Four skills with enough rules to exceed 12 → measure which guidance drops and whether core usefulness survives. Never assume every selected skill's rule reaches the model. |
| K06 | Provider payload capture in deterministic tests → only bounded principles/avoid plus existing minimized context; no registry, provenance, case corpus or review details. |

## 8. Metrics and denominator rules

| Measure | Definition / interpretation |
| --- | --- |
| Required-skill recall at final K ≤ 4 | Total required selected IDs / total required IDs, with alternative-set handling declared. Report N/A when no required IDs exist. |
| Allowed precision | Selected IDs in annotated required-or-acceptable set / all selected IDs. Current evaluator returns 1 on no selections; accompany it with selected count and recall to prevent an empty selector appearing perfect. |
| Forbidden-skill rate | Cases selecting any forbidden ID / evaluated cases. Also report per-skill counts. |
| Unnecessary-skill rate | Strict zero-required cases with nonempty selection / strict zero-required cases. Optional permitted skills do not count as unnecessary. |
| Zero-skill accuracy | Strict zero-required cases returning valid NONE / those cases. Report separately from empty FAILED. |
| Conflict rate | Cases with declared conflict among selected IDs / cases; also report declared-pair count and synthetic probe results. |
| Language eligibility accuracy | Cases with every selected ID language-eligible under independent oracle / cases. Pair with positive modifier coverage so all-empty output cannot hide failures. |
| Bound and repeatability | Fraction with unique ≤4 IDs; fraction with identical ordered result on repeat input. |
| Dependency failure | N/A while no dependencies exist; never report 100% dependency success for an absent mechanism. |
| Exact duplicate-rule rate | Repeated guidance entries / guidance entries; require zero after current dedup. |
| Contradiction / critical omission | Cases with incompatible guidance or a materially lost constraint / evaluated compositions, with human labels where semantic judgment is needed. |
| Strict scenario pass | Required/allowed/forbidden, language, conflict, bound, status and action constraints all pass. Current metric covers only a subset; supplemental assertions must make the distinction explicit. |

Report denominators, unique contexts, focal checks, definitions/version/hash, language and per-skill slices. Current metric code returns apparently perfect values on some empty inputs; an empty evaluation suite is **invalid**, not a passing run. Unknown or duplicate selected IDs must fail contract checks before metrics. Distinguish fixture validation error, provider failure, abstention and genuine quality failure.

## 9. Counterfactual usefulness protocol

For each of the 36 fresh positive candidate contexts, hold the conversation, fixed action, user intent, evidence ledger, provider/model/version and generation settings constant. Compare:

- G: generic generation without skill guidance.
- E: best human-reviewed composition of existing approved skills only.
- N: proposed new skill guidance under the same budget.
- E+N: existing composition plus new guidance, with at most four definitions and the same 12-rule bounds.

If E already uses four definitions, predeclare which least-relevant optional member is replaced; record both plans. Do not let E+N silently gain a larger prompt budget. This comparison tests the specific claim that a candidate adds value beyond composition. A candidate that beats G but not E may be an existing-skill extension rather than a new atom.

One generation per condition across 36 contexts means 144 outputs for a pilot. A second independently sampled repetition means 288 outputs; decide budget before running and record failures rather than silently rerolling. This research phase makes no paid calls. Order outputs randomly and hide condition/skill names from reviewers; do not let a model judge inspect the expected skill label. Use two reviewers for each language and adjudicate material disagreements. If only one reviewer is available, disclose that limitation and avoid a strong generalization.

For each candidate's 12 positive pilot contexts, allocate four English, four Simplified Chinese, and four Traditional Chinese contexts across at least three relationship settings. Include intentional code-switching in one context from each Chinese group. These are controlled guidance conditions supplied to a future evaluation harness; they isolate guidance usefulness and do not imply the current router can select a draft candidate. Measure automatic end-to-end selection separately.

### Human rubric

First apply critical failure flags: action/intent reversal, unsupported fact or commitment, certainty hardening, wrong speaker responsibility, manipulation, and unjustified disclosure. Any critical failure overrides a pleasant tone score. Then rate each dimension 1–5 with anchors 1 = materially poor, 3 = acceptable, 5 = clearly effective:

| Dimension | What the reviewer checks |
| --- | --- |
| Communication goal | Helps communicate the fixed goal without replacing it. |
| Appropriateness | Fits visible evidence; no moral lecture, fake agreement or unnecessary escalation. |
| Clarity | Decision, known information and next step are easy to understand. |
| Naturalness | English/Chinese script, idiom, formality and code-switching fit the message. |
| Proportionality | No over-apology, inflated reassurance, verbose ritual or forced warmth. |
| Interaction burden | No unnecessary question, new negotiation or extra commitment. |

Record paired preference as win/tie/loss and a short evidence-based reason; do not conflate more words with improvement. Report N versus E, E+N versus E and each versus G, including critical-failure counts. Analyze at context level, not as independent observations for every rating dimension/repeated sample. Report uncertainty intervals if sample size permits; a small pilot guides revisions rather than proving broad superiority. Useful source ideas are EQ-style quality dimensions and the composition/induction questions in Phase 3; rubric wording here is independently authored.

## 10. Proposed gates and failure decisions

These are initial review criteria, not measured outcomes or universal thresholds. Freeze them before a held-out run; revise only with an explicit reason and a fresh validation set.

| Gate | Proposed criterion | Failure action |
| --- | --- | --- |
| Authoring/migration | All 21 normalized records and existing selection/guidance fixtures identical after file-only migration | Fix migration; do not mix in candidate activation. |
| Contracts and invariants | Zero known action/intent/fact/commitment/ownership violations in reviewed cases; 100% bounds, language hard gates, draft exclusion and deterministic stability | Block affected content/implementation until fixed. Zero observed failures is not a proof of universal safety. |
| Canonical boundaries | All adjudicated P/N/H development cases pass their own assertions | Clarify specification or fix routing; do not delete inconvenient hard negatives. |
| Held-out selection | Initial per-candidate targets: allowed precision ≥0.90, required recall ≥0.85; zero critical forbidden selections | Diagnose context extraction versus selection. With only four cases per category, report counts and expand sample before confidence claims. |
| Useful contribution | Blind pilot shows a favorable pattern against E, with no critical regression and defensible case-level reasons | If composition performs as well, extend existing guidance or defer candidate; do not promote for count. |
| Final promotion | Human review of above evidence, source rights and exact content revision; registry approval points to evaluated revision | Keep candidate in draft; evaluation completion is not automatic activation. |

If a skill selects correctly but adds no useful guidance, first tighten its principles or compare an existing-skill extension. If positives and neighbors cannot be distinguished without invented context, defer or merge the concept. If two atoms are only useful together in a sequence, reconsider a playbook. Failed cases become versioned regressions in the development set; author fresh holdout cases after the fix to avoid repeated tuning on the test set.

## 11. Privacy, execution and report template

Use synthetic messages only. Do not copy external restricted dialogues or real user chats into fixtures. Provider calls remain opt-in; final wording artifacts may contain synthetic text but must not enter ordinary telemetry. The default test suite needs no credentials or network. Model judging is advisory and must not be the sole proof of intent preservation.

When implementation is separately undertaken, reuse root commands `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm eval:phase4`. The latter is the **existing application baseline** harness; it will not test new candidates until updated through reviewed implementation. The existing `--live` option evaluates its current fixture catalog and is not this full four-condition experiment by itself. No new executable command is invented in this design.

An eventual results Markdown should record:

| Field | Required report value |
| --- | --- |
| Evaluated build | Git revision, registry versions/content revision, corpus version, date |
| Coverage | Unique contexts and focal checks, split construction, per-skill/language/category counts |
| Conditions | Provider/model/settings and G/E/N/E+N plans for live runs; prompt/rule budgets |
| Results | Numerators/denominators for each metric, critical failures, per-skill slices, uncertainty |
| Review | Reviewers/languages, blinded ordering, disagreements, adjudication, limitations |
| Decision | Keep/extend/defer candidate; unresolved regressions; explicit approval status |
| Reproducibility | Exact commands, exit results, fixture IDs and synthetic artifacts; no secrets |

## 12. Completion record

- Design acceptance: baseline tests/metrics inspected; canonical versus held-out examples separated; all 24 proposed definitions have a coverage allocation; concrete universal/candidate, language/action/context, registry and composition matrices specified.
- Counterfactual experiment controls provider, action, context and budget; compares against the best existing composition; separates safety and selection from prose quality.
- Denominator handling, valid NONE versus FAILED, empty-suite pitfalls, absent dependencies, sparse conflicts, multilingual review, privacy and promotion gates are explicit.
- Execution status: no candidate evaluation or provider uplift result exists yet. No generated output is presented as empirical evidence.
- Next implementation milestone: migrate the current 21 records using Phase 4's parity checks, then review content/routing revisions and run this protocol before publishing additions.

### Documentation verification for Phases 4-6

Executed from the `AI messager-skills` worktree on 2026-09-15:

```powershell
node 'C:\Users\b\Documents\ChatGPT\AI messager\node_modules\prettier\bin\prettier.cjs' --check 'docs/skills/phase-4-registry-design.md' 'docs/skills/phase-5-registry-expansion.md' 'docs/skills/phase-6-evaluation-design.md'
git -c safe.directory='C:/Users/b/Documents/ChatGPT/AI messager-skills' status --porcelain=v1 --untracked-files=all
```

Formatting passed. A separate inline, read-only PowerShell audit checked all phase-document relative links, balanced code fences, all 21 baseline IDs in the migration table, and exactly 24 Phase 5 cards with ten labeled cases each; all checks passed. Git status showed only the pre-existing Phase 3 Markdown and the three new Phase 4–6 Markdown files. No production, schema, fixture, test or runtime files changed. No production test run or candidate performance result is claimed for this documentation work.
