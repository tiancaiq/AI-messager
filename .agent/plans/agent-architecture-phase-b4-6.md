# Agent architecture Phase B4.6 — Composer grounding and candidate meaning preservation

Status: in progress; pre-implementation plan
Owner: Codex
Started: 2026-10-04
Updated: 2026-10-04
Roadmap milestone: [Agent architecture Phase B](../../docs/roadmap.md#agent-architecture-phase-b--agentskill-integration), following the [B4.5 result](../../docs/agent-composer-b4-5-evaluation.md)

## Outcome and scope

Make the existing Composer respect source-supported meaning when it applies communication guidance. The fixed Agent action and production legacy `CommunicationPlan` remain authoritative. B4.6 may add a bounded internal Composer task/meaning contract, narrow prompt/task wording, candidate-level backstop guards, deterministic fixtures, and opt-in synthetic evaluation. It does not authorize SkillPlan cutover, a new public schema, a new Skill taxonomy, model-backed Skill stages, B5, agent runtime, memory, UI, or automatic sending.

## Frozen state and baseline

- B4.5 is committed at `af6e9e3c56ec660d25319976a2209b4eee3d7111` and tagged `agent-architecture-b4-5-freeze`. Its result stays 6 new wins, 6 legacy wins, 8 ties, 3 both-fail, 0 not comparable; recommendation `NEEDS_COMPOSER_REFINEMENT`. Do not reinterpret it.
- Skills baseline remains `dcc52eb15b578a4dbc65e4c74b64dbf9806cc899`; approved catalog fingerprint `approved-fnv128:f292695be12e86102468e1fa9f7d27f5`; runtime registry SHA-256 `d3bd95cd2fe91c999f0331e25c4f68438954ed21804d43f35616a7f7239497ca`.
- Historical B4.5 artifacts in ignored `.local-eval/b4-5/` are immutable. Their pre-B4.6 SHA-256 values are: `results.json` `9f59887e0c1d47862dc87018c5206cb946072bc5162b44d4a7be6815c7cb39e8`; `blind-review.md` `2e2d8345c29e7991ad849fddbca49d9f04ca556f05a6d5e0c199f717035d6dd5`; `blind-recommendations.md` `2aff14462fa3d0d9be7bd4c513bb241a8b887ce3390fc2db60645bea01c79cf4`; `arm-map.json` `c176fa960b11ca1f5cfbe8dec44ff7e0b5ba635a6920fddf406eb389b3f0e354`; `human-decisions.json` `c2ff26d59ce8d4e8258173bb385eccdf374a5c3ad7dc97ac54eb36a92f0c9eab`.
- `packages/ai/src/coaching-engine.ts` currently fixes policy, selects a legacy plan, passes `CommunicationGuidance` to one provider-neutral generator, and validates every candidate. `openai-coaching-adapter.ts` builds the structured Responses payload with `store: false`, 3,000 output tokens and strict JSON schema. `communication-problem.ts` already separates observed draft/selected intent from other-speaker text and has a test-only explicit-instruction seam. B4.5 guards catch high-signal status/follow-up/prior-thanks claims but miss unsupported user information state and send commitment. The B4 evaluation-only adapter did not demonstrably distort guidance.

## Assumptions and architecture decisions

1. The user's B4.6 instruction explicitly chooses the existing local credential for opt-in live evaluation. It was found without revealing its value. The provider remains `openai` / `gpt-5.6-luna` with the existing direct trusted-process request path; no API proxy, key write or model upgrade.
2. A request/question from `OTHER` is not evidence that `USER` knows a status, has checked, is available, or agrees to send/review something. For a fixed `SUGGEST_REPLY` status request with no user-owned status fact, a reply asking the other person to identify the relevant status scope is an allowed wording strategy; it is **not** an Agent action change or a claim that the user lacks information. If the Composer cannot produce such a grounded reply, it fails safely.
3. Add one internal, provider-neutral, request-scoped Composer task representation in `packages/ai`, not a public cross-process schema or second Skill plan. It separates `MUST PRESERVE`, `MUST NOT INVENT`, core communication guidance and optional style, and records bounded concept/value/certainty/source references for high-signal user-owned anchors. Existing `CommunicationProblem` and `CommunicationGuidance` remain the sources; no semantic graph or raw-text logging.
4. Validate the task before provider invocation. The task cannot alter policy action, introduce an unsupported commitment, promote observed contact identity/relationship, or contain contradictory hard requirements. The production Composer still consumes the legacy selected plan; the new SkillPlan path remains evaluation-only.
5. Both generation and post-provider candidate guards are necessary. Guard rules are intentionally incomplete and must be tested with supported/unsupported counterexamples; a good primary cannot excuse an invalid alternative. A guard rejection is a failed returned package, not a silent rewrite.
6. Agent-supplied free-form tone remains test-only because no production instruction producer exists. Zero skills must not erase a separately validated tone request. No Skill is fabricated to carry style.

## Contracts and data flow

```text
validated CoachingRequest + fixed policy + CommunicationProblem
  + production legacy CommunicationPlan (or evaluation-only SkillPlan projection)
  -> internal ComposerTask: fixed action; source-qualified MUST PRESERVE anchors;
     bounded MUST NOT INVENT categories; core technique guidance; optional Agent style
  -> one provider-neutral generator / isolated OpenAI adapter
  -> structured package -> guard every primary/alternative -> reviewed result
```

Priority is strict: `MUST PRESERVE > MUST NOT INVENT > CORE COMMUNICATION GUIDANCE > OPTIONAL STYLE`. This order means a Skill technique never supplies factual authority. The task's source references point to validated request-local evidence; neither user text nor model findings enter persistent history, analytics or default logs. Provider payloads retain the already-approved minimal synthetic request plus the bounded task; skill IDs/reasons and the registry do not enter the prompt.

## Ordered work

1. Document the [grounding contract and anchor-propagation audit](../../docs/agent-composer-b4-6-grounding.md) against actual `CommunicationProblem`, engine, adapter and B4/B4.5 cases before source changes. Confirm no Skill-stage cause.
2. Implement the smallest internal Zod-validated Composer task and deterministic derivation in `packages/ai`. Represent explicit high-signal anchor concept/value/qualification/owner/source; reject unbounded/contradictory task inputs before provider invocation. Keep existing public request/result and policy unchanged.
3. Pass the task through the provider-neutral generator boundary and serialize its four priority classes explicitly in `openai-coaching-adapter.ts`. Keep a narrow prompt amendment: other-speaker requests do not establish user facts/commitments, and every alternative has the same semantic obligations. Audit the compatibility adapter but change it only on demonstrated distortion.
4. Add conservative candidate-level backstops for unsupported user information-state/status, send/review/availability commitments, and high-signal unsupported emotion where reliable. Preserve the B4.5 refusal, modal and bilingual-time repairs. Do not claim complete semantic entailment.
5. Add at least 18 deterministic synthetic scenarios plus package-level, pre-provider, payload-isolation and test-only tone-path checks. Include English/Chinese where supported, positive/negative status/checking/follow-up, request versus commitment, tentative tomorrow/approximate time, refusal, prior thanks, emotion, and invalid alternatives.
6. Run all deterministic gates before any live call. Then execute the locked targeted set below, prepare a blinded candidate worksheet and obtain human meaning/factual dispositions. Do not self-sign human review.
7. Only if the targeted gate passes, run a separately recorded 23-pair/46-call focused A/B on the frozen B4.5 fixture set with the same model/config and fresh blind review. Do not run the original full B4 benchmark. Stop with an allowed B4.6 recommendation.

## Precommitted targeted dataset, budget, and gates

First stage: **13 synthetic cases / 13 maximum provider calls**, one *new-guidance* arm each, no retries or model judge: `status-request`, `regional-english-status`, `regional-traditional-status`, `unsupported-primary-code-switching`, `korean-universal`, `missed-commitment`, `ordinary-appreciation`, `clear-refusal`, `uncertain-availability`, `chinese-boundary-traditional`, `cap-pressure-multi-need`, one added supported-status case, and `ordinary-ask-for-help`. The first seven are known B4/B4.5 failures; the rest are meaning/skill controls. One arm is sufficient to test grounding before comparative quality. The old B4.5 dataset/artifacts remain unchanged. Run order is fixed in the fixture list. `sparse-nicer-repaired` stays deterministic-only while production has no instruction producer.

Targeted success requires **all**: 13 schema-valid packages; zero guard-rejected packages (strictly below the B4.5 sampled 4/46 arm rejection rate); zero unsupported status/user-information-state, checking, follow-up, send/review, availability, prior-event, emotional or causal assertions in any candidate; tentative time/uncertainty and refusal retained in every candidate; no unsupported alternative even when the primary is valid; all six control packages acceptable; human review accepts all 13 packages on meaning/factual/commitment/instruction fit; B3.5 33-case category counts unchanged; all deterministic repository gates pass. Naturalness/tone may be noted separately but cannot rescue invalid meaning. If any condition fails, stop the experiment and report `NEEDS_COMPOSER_REFINEMENT`; do **not** expand the set to chase a favorable result.

Conditional second stage, only after targeted human signoff: 23 frozen B4.5 synthetic cases / **46 maximum calls**, two balanced A/B arms, fresh sealed mapping and independent ignored artifacts. Both arms use the same B4.6 shared Composer/guard/model/schema/token limit; only legacy versus approved SkillPlan-derived communication guidance differs. Human review of primary and every alternative is blinded before unblinding. `READY_FOR_FULL_B4_RERUN` requires zero unresolved meaning-critical failures or both-fail factual cases, no control regression, and no decisive-loss deficit (`LEGACY_WIN - NEW_WIN ≤ 0`), with unchanged B3.5. Otherwise choose the evidenced refinement/blocking category. This does not itself authorize the full B4 rerun or B5.

## Regression commands and acceptance criteria

- [x] B4.5 commit/tag and all five artifact hashes remain unchanged; production legacy-authoritative.
- [x] Grounding design and audit distinguish user-owned assertion evidence from other-speaker requests and Skill technique.
- [x] Internal task validates fixed action, bounded source-qualified anchors/categories, guidance/style separation and contradictions before provider call.
- [x] Every generated candidate obeys candidate-level guard checks; supported facts remain expressible and unsupported commitments/status/prior events are rejected within the explicitly bounded patterns.
- [x] At least 18 synthetic deterministic scenarios pass, including explicit test-only tone and all B4.5 guard regressions.
- [ ] Targeted set/cap locked before live calls, then run only after all deterministic gates pass; human review and precommitted gate recorded.
- [ ] Conditional A/B occurs only after targeted signoff; no automatic full B4 rerun, B5 or cutover.
- [ ] Full `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`; Phase 4 21-case evaluation; B3.5 33-case evaluation; B4/B4.5/B4.6 tests and evaluation TypeScript checks; Windows-safe `pnpm exec prettier --check . --end-of-line auto`; `git diff --check`; `git ls-files --eol` index LF; frozen artifact hashes all pass or an explicit exception is documented.

## Privacy, risk, rollback, limitations

Only synthetic fixtures and the approved local B4/B4.5 artifacts are used. The existing ignored local key enters the trusted process only; `store: false` and the current direct provider topology remain. The provider receives minimized synthetic fixture text, fixed action and bounded task, not screenshot pixels, real conversations, contact identity, skill registry/IDs or memory. New evaluation artifacts (normalized candidates, blind sheet, mapping/decisions) stay ignored under `.local-eval/b4-6/`; no raw provider payload, credential, telemetry or user history is persisted. Operational output contains only case ID, structural result and timing. Provider failures are normalized. Roll back only B4.6 files; the B4/B4.5 tags and artifacts remain recoverable and immutable. Lexical/structural grounding cannot prove general semantic validity; human review stays authoritative. One sample per case limits causal conclusions. Exact provider cost may be unavailable if token usage is not surfaced.

## Progress log

- 2026-10-04: Read repository instructions, product/privacy rules, B4.5 plan/report and Composer code. Confirmed clean B4.5 commit `af6e9e3`, created local `agent-architecture-b4-5-freeze` tag, recorded five ignored artifact hashes, and safely confirmed the user-requested existing key without revealing it. No B4.6 source change or provider call yet.
- 2026-10-05: Documented the source-to-Composer audit before source changes, then added an internal bounded task and explicit prompt priority/ownership rules, source-qualified anchors, unknown-status scope-question mode, and candidate-level information-state/commitment/emotion backstops. The exact production action and legacy plan remain authoritative; B4.5 refusal/modal/anchor guards remain active. One older desktop synthetic case showed an explicit user draft “Yes I can” answering a review request, so the task now permits that supported acceptance while still rejecting a bare incoming request as commitment. Added 28 task/grounding tests and two targeted-fixture tests (30 new B4.6 tests). The target set is locked at 13 fixtures/13 calls with no retries; readiness invokes no provider.
- 2026-10-05: Pre-live gates passed: `pnpm test` (51 files/376 tests), `pnpm lint`, `pnpm typecheck`, `pnpm build` (packages/API/desktop main/preload/renderer), B3.5/B4/B4.5/B4.6 evaluation TypeScript checks, Phase 4 21/21, B3.5 33 cases with unchanged 24/3/1/5 categories, Windows-safe `prettier --check . --end-of-line auto`, and `git diff --check`. Tracked/index representations checked with `git ls-files --eol` remain `i/lf`; no unrelated normalization. All five B4.5 artifact hashes remain unchanged. No live B4.6 call yet.

## Completion record

Pending implementation, deterministic gates, targeted generation, human review, and the conditional focused A/B decision.
