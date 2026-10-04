# Agent architecture Phase B4.5 — root-cause and meaning-preservation refinement

Status: focused evaluation and human review complete; `NEEDS_COMPOSER_REFINEMENT`
Owner: Codex
Started: 2026-10-04
Updated: 2026-10-04
Roadmap milestone: Agent architecture B4.5 refinement after [B4](../../docs/agent-composer-b4-evaluation.md); B5 remains on hold

## Outcome

Locate the layer responsible for each decisive B4 loss/factual failure, make only justified narrow corrections, then run a bounded focused Composer A/B evaluation. The deliverable is evidence for or against a *full B4 rerun*, not a production SkillPlan cutover.

## Frozen baseline and current state

- B4 Agent baseline: `be935923967862e9a65af669c7ca1ec7784125fa`, tag `agent-architecture-b4-freeze`. It includes the B4 harness and completed human review. Historical B4 report, counts and ignored artifacts are immutable for this milestone.
- Skills baseline: `dcc52eb15b578a4dbc65e4c74b64dbf9806cc899`; approved runtime registry SHA-256 `d3bd95cd2fe91c999f0331e25c4f68438954ed21804d43f35616a7f7239497ca`; catalog snapshot `approved-fnv128:f292695be12e86102468e1fa9f7d27f5`. B3.5 33-case validation is the Skill-pipeline regression gate.
- Original synthetic B4 artifacts: ignored `.local-eval/b4/{results.json,blind-review.md,blind-recommendations.md,arm-map.json,human-decisions.json}` in this worktree. Their SHA-256 values are recorded in the B4.5 root-cause report before any fix. Do not rewrite, regenerate or relabel them.
- B4 result: 4 new wins, 10 legacy wins, 10 ties, 5 both fail, 1 not comparable; decision `BLOCKED_BY_REGRESSION`. The new arm had one real package-level `tomorrow` loss; four shared unsupported-status/follow-up failures and a shared unsupported “again” alternative passed lexical guards. Refusal/request-modal false positives are documented.
- Existing `packages/ai/tests/composer-b4-harness.ts` runs the same `coachConversation` and provider adapter for each arm, projecting `SkillPlan` text to legacy `CommunicationGuidance` in evaluation only. `packages/ai/src/coaching-engine.ts` checks every primary/alternative via one conservative guard function, but does not report a rule code. Production still uses legacy `CommunicationPlan`.

## Scope and non-goals

In scope: immutable B4 baseline; per-case layer classification; narrow source-grounded guard/refusal/modal fixes with deterministic regressions; package-level meaning preservation; evaluation-only adapter correction only if diagnosis supports it; test-only tone-instruction seam if production has no producer; a 23-case/46-call maximum focused synthetic A/B; blind human review; full regression suite and recommendation.

Out of scope: B5, production SkillPlan authority, legacy-selector removal, Supervisor/specialist/autonomous runtime, model-backed Skill stages, new catalog/taxonomy, broad Composer prompt redesign, model upgrade, embeddings, memory, UI redesign, persistence, telemetry and automatic sending. Do not modify B4 baseline files or retroactively change its counts.

## Assumptions and decisions

1. The user explicitly chose to reuse the existing local OpenAI credential for this milestone. The provider topology remains direct trusted-process access, with `store: false`; the key is read only in process from the ignored local environment file. No plaintext key or provider payload enters committed files or logs. [Official OpenAI API documentation](https://developers.openai.com/api/docs/guides/migrate-to-responses) confirms `store: false` disables response storage by default; the existing adapter already sets it. The same existing provider/model/configuration are used for both arms.
2. Historical B4 human decisions are authoritative for *diagnosis*, not automatically transferable to fresh generations. The new focused run needs fresh blind or minimally biased human dispositions. Codex may prepare blinded recommendations but cannot self-grant human signoff.
3. A root-cause row must inspect source, fixed action, evidence, assessment, selection, SkillPlan, legacy plan, provider guidance, all generated candidates, guard and human decision before assigning exactly one primary layer from `ASSESSMENT`, `SELECTION`, `SKILLPLAN_COMPILATION`, `COMPOSER_ADAPTER`, `COMPOSER_PROMPT_OR_GENERATION`, `DETERMINISTIC_GUARD`, `FIXTURE`, `SHARED_SYSTEM_LIMITATION`. A secondary layer needs explicit evidence. No code fix precedes the 15-row classification.
4. A valid primary plus an invalid alternative is an invalid package. Retain product-supported alternatives; do not hide violations by removing them. Any guard amendment must be applied to every generated candidate and include supported/unsupported counterexamples, not a naive keyword ban.
5. The explicit “nicer” instruction belongs to Agent-owned task scope, not Skill signals. If no production free-form instruction producer exists, repair `sparse-nicer` as a test-only seam and record the integration gap; do not fabricate a production input or force Skill selection.

## Contracts and data flow

```text
fixed AgentAction + bounded source/intent evidence
  → assessment → selection → SkillPlan
  → evaluation-only guidance projection → existing Composer
  → validated package (primary AND every alternative)
  → source-grounded/refusal/uncertainty/anchor guards → human review
```

Preserve priority: `MUST PRESERVE` > `MUST NOT INVENT` > core communication guidance > optional style. A Skill principle is technique, not a new fact. Prefer existing contracts and bounded meaning anchors; add no parallel registry or cross-process schema unless a diagnosed layer requires it. Guard outcomes may acquire internal rule codes for deterministic evaluation/debug only, without exposing private content or changing user-facing error detail.

## Cases and issue mapping

| B4 group | Cases | Issues to test |
| --- | --- | --- |
| Ten `LEGACY_WIN` | `missed-commitment`, `korean-universal`, `emotional-support`, `simple-planning`, `direct-refusal`, `less-confrontational-no-apology`, `english-chinese-code-switch`, `repair-and-empathy`, `ordinary-clear-next-step`, `ordinary-ask-for-help` | `COMPOSER-MEANING-04`; `GUARD-MODAL-03` where applicable; classify before fix |
| Five `BOTH_FAIL` | `status-request`, `regional-english-status`, `regional-traditional-status`, `unsupported-primary-code-switching`, `ordinary-appreciation` | `GUARD-STATUS-01`; shared factual grounding; package-level “again” |
| Guard-focused | `decline-after-action`, `ordinary-polite-follow-up`, `ordinary-ask-for-help` | `GUARD-REFUSAL-02`, `GUARD-MODAL-03` |
| Fixture-only | `sparse-nicer` | `FIXTURE-TONE-05` (not a live quality-comparison case until a real Agent instruction path exists) |

## Diagnosis, then remediation

1. Write `docs/agent-composer-b4-5-root-causes.md` with 15 case rows and layer counts after inspecting the frozen artifacts and current pipeline. Record uncertainties explicitly. No source modification except plan/report until classification is complete.
2. For `GUARD-STATUS-01`, determine bounded source/intent claim support and add paired supported/unsupported no-update, ongoing-checking and follow-up fixtures. Scope heuristics to known high-signal claims and languages supported by the current system; do not claim full semantic entailment.
3. For `GUARD-REFUSAL-02`, repair conventional English/Chinese refusal detection without accepting negated refusals or contradictory acceptance. Convert four expected-failure tests to ordinary passes only when real behavior passes; retain existing anti-acceptance tests.
4. For `GUARD-MODAL-03`, distinguish recipient-directed polite “Could you/Can you” from user-owned uncertain “I could/I may”; preserve genuine uncertainty checks. Add positive and negative tests.
5. For `COMPOSER-MEANING-04`, trace whether the tentative time/commitment anchor reaches the prompt. Change the narrowest layer supported by the row: SkillPlan only for actual compilation loss, evaluation adapter only for projection loss, or a bounded Composer candidate instruction/guard if guidance is correct but generation ignores it. No general prompt rewrite.
6. Audit evaluation adapter length, duplicates, priority and principle-vs-content wording against all 15 rows. Change it only where it demonstrably distorts correct SkillPlan guidance. Preserve shared Composer core in A/B and report any targeted prompt/guard changes that affect both arms.
7. Repair `sparse-nicer` with actual message content plus test-only validated Agent tone scope. Assert zero skills does not erase the instruction; document the absent production producer instead of adding one in B4.5.
8. Run deterministic full gates before any live call; then a focused A/B with the precommitted dataset/gates below. Prepare blind worksheet and request human dispositions before unblinding. Stop after the focused recommendation.

## Focused rerun dataset and call budget

Exactly 23 provider-generated synthetic cases: all ten prior `LEGACY_WIN`; all five `BOTH_FAIL`; two additional guard cases (`decline-after-action`, `ordinary-polite-follow-up`; `ordinary-ask-for-help` is already in the ten); and six controls (`professional-status`, `uncertain-availability`, `clear-refusal`, `apology-mistake`, `chinese-boundary-traditional`, `cap-pressure-multi-need`). This covers clean ties, new wins, refusal, uncertainty, Chinese and cap pressure. `sparse-nicer` remains deterministic-only until the missing Agent instruction producer is addressed.

Maximum **46 provider calls**, exactly two arms per case, no retries or model judge. Same frozen synthetic source, action, provider `openai`, model `gpt-5.6-luna`, existing strict output schema, 3,000 output-token cap, `store: false`, Composer core and adapter defaults; balanced order with a fresh sealed seed. New B4.5 guard changes affect both arms equally. Any narrowly justified new-arm guidance projection is the only planned asymmetry beyond the guidance source; record exact prompt diffs and avoid multiple uncontrolled changes. Do not run the original 60-call set or an automatic full B4 rerun.

## Precommitted focused success gate

Human-reviewed results must satisfy **all** of: (a) zero unresolved new-arm meaning-critical failures, including all candidates in `missed-commitment`; (b) at most one of four original status cases still both-fail from unsupported status/follow-up assertions, and `ordinary-appreciation` has no unsupported “again” alternative in either acceptable package; (c) conventional refusal and request-modal guard cases pass without a new contradictory-acceptance/uncertainty regression; (d) no new meaning/safety failure among six controls; (e) among comparable decisive pairs, `LEGACY_WIN - NEW_WIN ≤ 2`, improving the prior six-win deficit; (f) no B3.5 33-case regression. Ties are allowed. If any gate fails, do not recommend a full rerun. Fresh human review is needed for meaning/factual validity; deterministic PASS alone does not satisfy it.

If all gates pass, recommend `READY_FOR_FULL_B4_RERUN` and stop. Otherwise choose `NEEDS_COMPOSER_REFINEMENT`, `NEEDS_GUARD_REFINEMENT`, `NEEDS_SKILLPLAN_ADAPTER_REFINEMENT`, `NEEDS_SKILL_PIPELINE_REFINEMENT`, or `BLOCKED_BY_REGRESSION` based on diagnosed cause. A full rerun or B5 needs a separate decision.

## Regression strategy and validation commands

Focused Phase A, B1, B2, B3, B3.5, B4 and new B4.5 tests plus root `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`; `pnpm exec tsc -p packages/ai/tsconfig.skill-pipeline-validation.json --noEmit`; `pnpm exec tsc -p packages/ai/tsconfig.composer-b4-evaluation.json --noEmit`; `node scripts/evaluate-phase-4.mjs`; `pnpm exec tsx scripts/evaluate-skill-pipeline.ts`; `pnpm exec prettier --check . --end-of-line auto` (Windows worktree exception); `git diff --check` and indexed LF verification. Default CI remains deterministic and never calls a provider. Test all candidates, supported and unsupported claim counterexamples, action immutability, fixed prompt isolation, budget and order.

## Privacy, risks and rollback

Only synthetic fixtures and explicitly approved local B4 artifacts are used. New generated candidates and blind mapping live in ignored `.local-eval/b4-5/`, not analytics/history. Do not persist raw provider payloads, credentials, user conversations, screenshots, drafts, identity or memory. Existing adapter sanitizes errors and validates strict structure. Provider variability and one sample per arm limit causal claims; no token accounting means no exact monetary claim. If provider is unavailable, stop live evaluation, preserve deterministic results and report blocked, not substitute a model. Revert only B4.5 changes if needed; frozen B4 tag/artifacts and production legacy path remain intact. Never overwrite B4 results.

## Acceptance criteria

- [x] B4 tag/baseline and untouched ignored artifacts identified; original counts are fixed.
- [x] Fifteen root-cause rows classify exactly one primary layer each before fixes, with source-to-output evidence and issue mapping.
- [x] Narrow fixes have supported/unsupported candidate-level regression tests; no Skill-pipeline change or broad prompt rewrite.
- [x] `sparse-nicer` is repaired as an actual-content plus explicit-tone **test-only** seam without a fake Skill signal; no production instruction producer exists.
- [x] Pre-live and post-review deterministic gates passed; production remains legacy-authoritative.
- [x] Exactly 23 focused pairs/46 calls were generated under fixed isolation and privacy controls.
- [x] Human reviewer disposed all 23 blinded pairs, and all precommitted gates were evaluated without retrospective threshold changes.
- [x] Final report includes root-cause counts, case-level results, call/guard/human-override/meaning metrics, model/config/latency/cost limits, and one allowed recommendation; stop before full B4 rerun/B5.

## Progress log

- 2026-10-04: Reused credential at explicit user direction; read current official OpenAI Responses/structured-output guidance. Verified clean B4 commit `be93592`, tagged `agent-architecture-b4-freeze`, and inspected existing B4 report, harness, Composer/guard, privacy and product behavior before writing this plan. No B4 artifact was modified.
- 2026-10-04: Audited all 15 decisive B4 rows before code changes, finding ten primary Composer generation, four shared-system, one selection, zero proven adapter/compiler faults. Added bounded, source-attributed high-signal guards with structural rule codes; converted the four known refusal false positives to passing tests; repaired polite request-modal handling; tightened candidate-level Composer instructions; added a separate test-only tone fixture and locked the 23-case/46-call runner. No Skill stage or compatibility-adapter change.
- 2026-10-04: Before live calls, full `pnpm test` (49 files/343 tests), `pnpm lint`, `pnpm typecheck`, `pnpm build`, B3.5/B4/B4.5 TypeScript checks, Phase 4 21/21, B3.5 33-case structural evaluation, Windows-safe Prettier and `git diff --check` passed. Rechecked all five frozen B4 artifact hashes. The focused `openai`/`gpt-5.6-luna` run then completed 23 synthetic pairs/46 calls without retry; 42 arms passed deterministic guards and four were rejected. The blinded review worksheet and provisional recommendations are in ignored `.local-eval/b4-5/`; human review and unblinding remain pending. See the [focused report](../../docs/agent-composer-b4-5-evaluation.md).
- 2026-10-04: Human reviewer approved 23 case judgments, including two explicit guard-false-positive overrides. Stored all 23 judgments and verified unique case-ID parity with the 23 live pairs before opening the sealed arm map. Unblinded tally: six new wins, six legacy wins, eight ties, three both-fail, zero not comparable. The status gate fails at three both-fail versus the precommitted maximum of one; an unsupported new-arm Korean send promise also fails the zero meaning-critical-regression gate. Applied only narrow post-review guard fixes for “not willing to continue/apologize” and the exact `下午三點` ↔ `3 PM` equivalence, with full-package positive and negative tests; did not regenerate or relabel live output. Recommendation is `NEEDS_COMPOSER_REFINEMENT`, not a full B4 rerun.
- 2026-10-04: Post-review verification passed: `pnpm test` (49 files/346 tests), `pnpm lint`, `pnpm typecheck`, `pnpm build` (packages, API, desktop main/preload/renderer), three evaluation `tsc -p ... --noEmit` configs, `node scripts/evaluate-phase-4.mjs` (21/21), `tsx scripts/evaluate-skill-pipeline.ts` (33 cases; 24/3/1/5 category counts unchanged), `tsx scripts/evaluate-composer-b4-5.ts` readiness (no provider), `pnpm exec prettier --check . --end-of-line auto`, and `git diff --check`. Only B4.5-changed source files were formatted; no unrelated normalization. Tracked/index files checked with `git ls-files --eol` remain `i/lf`; this Windows worktree has some `w/crlf` paths and some `w/lf`. All five frozen B4 artifact SHA-256 values still match the pre-remediation audit. The historical live run remains 23 pairs/46 calls; no extra live call was made.

## Completion record

Root-cause classification, narrow remediation, bounded generation, fresh human dispositions, unblinded tally, precommitted-gate evaluation, post-review deterministic validation and repository verification are complete. The B4.5 quality gate did **not** pass; no full B4 rerun or B5 work is authorized by this milestone. Final recommendation: `NEEDS_COMPOSER_REFINEMENT`.
