# Agent architecture Phase B4.7 — Boundary scope preservation

Status: in progress; targeted dataset and gate precommitted before live calls
Owner: Codex
Started: 2026-10-05
Updated: 2026-10-05
Roadmap milestone: [Agent architecture Phase B](../../docs/roadmap.md#agent-architecture-phase-b--agentskill-integration), following the [failed B4.6 targeted gate](../../docs/agent-composer-b4-6-targeted-evaluation.md)

## Outcome and scope

Preserve the source-supported scope of a user boundary in every Composer candidate. A durable/unqualified boundary must not acquire a temporary qualifier, and an explicitly temporary boundary must not be silently strengthened into an unqualified one. B4.7 may extend the existing internal Composer task's `MUST PRESERVE` anchors, add a narrow source-aware candidate backstop and prompt sentence, deterministic paired tests, and one small synthetic live generation gate. The fixed Agent action, production legacy `CommunicationPlan`, provider adapter configuration, and approved Skill pipeline remain unchanged. No comparative A/B, full B4 rerun, B5, cutover, agent runtime, Skill taxonomy, model-backed Skill stages, memory, UI, or automatic sending.

## Frozen baseline and current state

- B4.6 is committed at `b1d5024` and locally tagged `agent-architecture-b4-6-freeze`. The targeted outcome stays 12 human-acceptable packages, one human-rejected `chinese-boundary-traditional` package (`MATERIAL_MEANING_WEAKENING` in an alternative), 13 calls, zero deterministic rejections, and `NEEDS_COMPOSER_REFINEMENT`. Do not reinterpret or rerun its artifacts. B4.5 remains frozen at `af6e9e3`.
- Skills baseline is `dcc52eb15b578a4dbc65e4c74b64dbf9806cc899`; approved catalog fingerprint `approved-fnv128:f292695be12e86102468e1fa9f7d27f5`; registry SHA-256 `d3bd95cd2fe91c999f0331e25c4f68438954ed21804d43f35616a7f7239497ca`. Production is legacy-authoritative; the approved SkillPlan path is evaluation-only.
- Ignored B4.6 targeted artifacts are immutable: `results.json` SHA-256 `e7519df8bb23a068501ab14a7f128c683eb8e5defab986047e1c714d8e46f7f7`; `review.md` `6f8ee2d9d85b9947ebe332f37c91cb88a95401dfa190285b02078fe569d7c498`; `recommendations.md` `95f8c52d437d3343d5aa85a7a692fb1fa74884ea0b323c643be06e88f847aea1`; `human-decisions.json` `180642e515a9869c0beaf4748f73fc977486c72eba413ed4a11ed13e9171afa3`.
- `packages/ai/src/composer-task.ts` derives bounded, source-qualified `mustPreserve` anchors from explicit selection or reliable draft, but has no boundary-scope anchor. `coaching-engine.ts` checks each primary/alternative with high-signal guards. Four B4.6 `it.fails` cases in `composer-task.test.ts` show temporal weakening is still missed. `openai-coaching-adapter.ts` serializes the task through the existing provider-neutral boundary with `store: false`, strict structured output and a 3,000-token cap. The B4.6 runner already proves a one-arm, no-retry, ignored-artifact pattern.

## Assumptions and decisions

1. `DURABLE_OR_UNQUALIFIED` means only that the source boundary lacks a temporary qualifier; it does not claim a permanent philosophical commitment. Explicitly temporary → unqualified is a material strengthening and is guarded symmetrically.
2. Scope is attached to a recognized boundary clause/kind, not to every occurrence of `先`, `暫時`, `for now`, or another time word. A separate sequence instruction such as `先確認時間，再回覆他` is not a boundary. Unrelated dates/timing elsewhere in a message do not determine boundary scope.
3. A bounded classifier may return `UNKNOWN` or abstain when the boundary kind or modifier attachment is unclear. It must not convert ambiguous evidence into a durable or temporary claim. The guard covers only recognized English/Simplified/Traditional Chinese high-signal patterns; human review remains authoritative for paraphrases and scope ambiguity.
4. Extend the existing internal `mustPreserve` anchor structure, not public contracts or a second semantic subsystem. Store a bounded boundary kind plus scope and source reference; do not send skill IDs/reasons or a registry to the provider.
5. The user's request explicitly authorizes reuse of the existing ignored local key for the small synthetic live gate; key presence was checked without disclosure. No new credential or provider topology. Use `openai` / `gpt-5.6-luna`, the existing direct adapter, unchanged schema/token limit and `store: false`.

## Contracts and data flow

```text
validated request + fixed Agent action + reliable USER draft/selection
  -> CommunicationProblem -> ComposerTask.mustPreserve boundary-scope anchor
  -> existing provider-neutral generator / isolated adapter
  -> each candidate independently compared with source-supported scope
  -> package rejected if any candidate drifts
```

Priority stays `MUST PRESERVE > MUST NOT INVENT > CORE COMMUNICATION GUIDANCE > OPTIONAL STYLE`. Tone/de-escalation guidance cannot qualify a durable boundary or erase temporary scope. Candidate validation is a backstop, not a general entailment engine. The exact source and output remain request-local except for synthetic ignored evaluation artifacts; no raw screenshot, private conversation, identity, credential, provider payload, history or analytics persistence is added.

## Ordered work

1. Write the [boundary-scope design and propagation audit](../../docs/agent-composer-b4-7-boundary-scope.md) against the current task, prompt, guard and B4.6 failure; confirm no Skill-layer cause.
2. Extend `packages/ai/src/composer-task.ts` with a bounded boundary-scope `MUST PRESERVE` anchor and source-aware clause/kind classifier. Add one narrow prompt sentence in `coaching-prompt.ts`; keep action, guidance, output schema, adapter and production selector unchanged.
3. Compare each generated candidate's recognized boundary scope with its source anchor in the existing `coaching-engine.ts` guard path. Reject durable→temporary and temporary→unqualified; avoid global keyword bans and unrelated temporal false positives. Preserve the existing B4.6 guards.
4. Convert the four B4.6 expected failures to ordinary passing regressions. Add paired Traditional/Simplified Chinese and English durable/temporary tests, source-supported temporary counterexamples, unrelated `先`/date controls, combined pressure/refusal/de-escalation cases, task/payload propagation and full-package invalid-alternative tests.
5. Add a locked ten-case/ten-call synthetic fixture set and one-arm opt-in runner under `.local-eval/b4-7/targeted/`. Run all deterministic gates before any provider call. Then run exactly once, prepare a candidate-level worksheet, and request human dispositions. Do not self-sign human review.
6. Record the targeted gate, full regressions, frozen artifact hashes and final recommendation. Stop after B4.7; no A/B or later milestone implementation.

## Precommitted targeted set, budget and gate

Exactly **10 synthetic cases / 10 maximum provider calls**, one new-guidance arm, fixed order, no retries or model judge:

1. `chinese-boundary-traditional` — frozen B4.6 failure.
2. `chinese-boundary-simplified-b4-7` — durable Simplified Chinese pressure boundary.
3. `english-boundary-asking-b4-7` — durable request to stop asking.
4. `chinese-temporary-boundary-b4-7` — source-supported temporary Chinese boundary.
5. `english-temporary-boundary-b4-7` — source-supported temporary work limit.
6. `pressure-empathy-durable-b4-7` — urgency/empathy plus durable extra-work limit.
7. `refusal-pressure-durable-b4-7` — refusal plus durable pressure boundary.
8. `unrelated-xian-sequence-b4-7` — `先` means sequence, not boundary scope.
9. `status-request` — unknown-status grounding control.
10. `uncertain-availability` — uncertainty/timing control.

Every fixture must have a provider-generated fixed action before live use; otherwise stop and revise **before** any call. Readiness mode invokes no provider. The runner reserves each call before invoking the provider and refuses to overwrite existing results. Normalized candidates and worksheet are ignored/local; stdout contains only case ID, rule/result code and timing.

Pass requires **all**: 10 schema-valid packages; every package human-acceptable; zero durable→temporary weakening; zero temporary→unqualified strengthening; every alternative scope-correct; no unsupported status, checking, follow-up, send/review, availability, prior-event or other factual/commitment regression; no uncertainty/timing, refusal or polite-modal regression; no unrelated temporal false positive; B4.6 deterministic tests and B3.5 33-case category counts unchanged; all repository gates pass; and guard/human disagreements explicitly dispositioned. One meaning-critical failure fails the gate. Do not change sample, threshold or rules after outputs. If human review has not arrived, hold the final quality decision and do not claim a pass.

If all pass, recommend `READY_FOR_COMPOSER_COMPARATIVE_RERUN` and stop. Otherwise recommend `NEEDS_COMPOSER_REFINEMENT` with exact source/candidate drift and whether task or guard missed it. A passing B4.7 does **not** authorize comparative A/B, full B4 rerun, B5 or cutover.

## Regression commands and acceptance criteria

- [x] B4.6 commit/tag and artifact hashes recorded before B4.7 implementation; production legacy-authoritative.
- [ ] Boundary-scope anchor, prompt and source-aware guard preserve both directions for recognized clauses without unrelated temporal false positives.
- [ ] Positive/negative paired deterministic tests pass; four B4.6 expected failures become ordinary passing tests; B4.6 grounding regressions remain green.
- [ ] Ten fixtures/call cap and human-review dimensions precommitted before live calls; no default-CI provider use.
- [ ] Targeted generation and human review completed; gate recorded without post-hoc threshold changes.
- [ ] Full `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`; Phase 4 21-case evaluation; B3.5 33-case validation; B4/B4.5/B4.6/B4.7 tests and evaluation TypeScript checks; Windows-safe Prettier check; `git diff --check`; `git ls-files --eol` indexed LF; frozen hashes pass or exceptions are documented.
- [ ] No comparative A/B, full B4 rerun, B5, production cutover, Skill change or multi-agent runtime.

## Privacy, risk, rollback and limitations

Only synthetic fixtures enter the live provider. The existing ignored local key is loaded into the trusted evaluation process, never printed, saved to committed files or sent to renderer/API. The adapter uses direct TLS with `store: false`; no real screenshots/conversations, raw provider HTTP payloads, stable identity, telemetry, history or analytics. Results/review remain ignored in `.local-eval/b4-7/targeted/`; B4/B4.5/B4.6 artifacts are immutable. Provider failures are normalized and stop without retry. Revert only B4.7 source/docs to roll back; the B4.6 tag and artifacts remain recoverable. Lexical source/candidate matching may abstain on unfamiliar paraphrases; it must not be described as semantic completeness. Human evaluation of ten single samples cannot establish a general failure rate or comparative SkillPlan advantage. Exact monetary cost may remain unavailable if the adapter does not expose token usage.

## Progress log

- 2026-10-05: Read repository instructions, B4.6 plan/report, Composer task/adapter/guard, existing fixtures/tests and privacy rules. Confirmed a clean `b1d5024` baseline, created local `agent-architecture-b4-6-freeze` tag and recorded four B4.6 targeted artifact hashes. Safely verified the user-requested ignored key without printing it. No B4.7 source change or provider call yet.

## Completion record

Pending implementation, deterministic validation, targeted generation, human review and final gate decision.
