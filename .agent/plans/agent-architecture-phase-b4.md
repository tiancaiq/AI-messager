# Agent architecture Phase B4 — Composer A/B quality evaluation

Status: complete; BLOCKED_BY_REGRESSION, no cutover
Owner: Codex
Started: 2026-10-04
Updated: 2026-10-04
Roadmap milestone: Agent architecture B4 quality experiment; this plan supersedes the older roadmap shorthand that described B4 as optional metadata

## Outcome

Produce controlled, human-reviewable evidence about whether the signed-off shadow `SkillPlan` improves final message quality over the legacy `CommunicationPlan`. End with a B4 recommendation, not a production cutover.

## Scope

In scope: evaluation-only A/B adapter and harness, synthetic/reviewed case selection, fixed-action and prompt-isolation tests, equal deterministic output guards, bounded opt-in live Composer generation, blinded human quality review, per-case reasons and a recommendation. Out of scope: production SkillPlan authority, legacy-selector removal, new Composer prompt, model-assisted Skill stages, Supervisor/specialist runtime, memory/personalization, UI/IPC, new persistence, automatic sending and B5.

## Frozen baseline and current state

- Signed-off Agent B3.5 freeze: `b9eef8a171782973104189a1bf804b6b1432c657`, tag `agent-architecture-b3-5-freeze`; clean worktree before this plan.
- Committed Skills baseline: `dcc52eb15b578a4dbc65e4c74b64dbf9806cc899`. Approved runtime registry JSON SHA-256: `d3bd95cd2fe91c999f0331e25c4f68438954ed21804d43f35616a7f7239497ca`; validated snapshot: `approved-fnv128:f292695be12e86102468e1fa9f7d27f5`. Observed 21 active definitions are not a fixed assumption.
- `coachConversation` in `packages/ai/src/coaching-engine.ts` fixes action, calls a pluggable `CommunicationSkillPlanner`, sends only `CommunicationGuidance` to `CoachingTextGenerator`, and applies strict result validation plus conservative refusal/uncertainty/anchor guards. `OpenAiCoachingAdapter` in `packages/ai/src/openai-coaching-adapter.ts` uses the same `COACHING_INSTRUCTIONS`, request schema, strict output schema, `store: false`, 3,000 maximum output tokens, 45-second timeout and default `gpt-5.6-luna` model. It specifies no temperature, reasoning level or seed; those provider defaults and residual nondeterminism must be reported.
- B3.5's test-only harness already yields the legacy `CommunicationPlan` and exact shadow `SkillPlan` from the same validated synthetic `CoachingRequest`, fixed action and approved catalog. Production still sends only the legacy guidance.

## Assumptions and decisions

1. The user authorized reusing the existing local OpenAI credential. Read it only in process from the ignored primary checkout `.env.local` at opt-in execution; never copy it into this worktree, print it, commit it or expose it in an artifact. The script itself accepts an environment variable and does not know an absolute credential path.
2. Use the existing `OpenAiCoachingAdapter` and `coachConversation` for both arms. The only intended provider-facing difference is the `communicationGuidance` payload. Adapt `SkillPlan` to the existing validated `CommunicationPlan` shape in evaluation code; never alter production selection or Composer source. The same fixed `CoachingRequest`, policy, model, provider, prompt, output schema, max tokens, and default generation settings apply to each pair.
3. The initial set is 30 synthetic/reviewed provider-generation cases: 26 eligible cases from the 33-case B3.5 set after excluding fixed local actions, plus four ordinary synthetic cases. Verify the exact count and category balance in code before live execution. Keep a separate deterministic-only synthetic catalog-conflict probe because the frozen approved registry has no declared active conflict pair; do not silently change catalog snapshot in an A/B arm.
4. Maximum initial live budget: 30 pairs / 60 provider calls, no automatic retries. Run a small pilot within that same cap to verify schema, credential, connection and prompt isolation. No repeated-generation subset unless separately approved after first-pass results. Record actual attempts and coarse latency/token usage if returned, but do not claim exact monetary cost when unavailable.
5. Review order is deterministic but concealed: pair ordering and blind `Candidate A/B` assignment derive from an evaluation seed stored separately from the review sheet. The reviewer sees no arm labels until judgments are recorded. A/B call order is balanced to reduce temporal effects; provider nondeterminism remains a limitation.
6. Guard failures are blocking regardless of preferred prose. Use the same existing `coachConversation` schema/action/refusal/uncertainty/anchor guards in both arms and record candidate-level validity before preference review. Human review remains authoritative for semantics the lexical guards cannot detect. No model judge is the sole arbiter.
7. The existing `CoachingRequest` has no production Composer input for the optional Phase A user-supplied instruction seam. The reviewer-approved `sparse-nicer` caveat remains a B4 limitation: zero Skill selection must not be interpreted as permission to ignore an explicit future tone instruction, but B4 cannot claim to validate that missing end-to-end input path by fabricating one.

## Contracts and data flow

```text
one synthetic CoachingRequest + fixed AgentAction
  ├─ legacy SkillContext → flat selector → CommunicationPlan
  └─ CommunicationProblem → bounded evidence → assessment → selection → SkillPlan
       ↓ evaluation-only, strict guidance adapter
same coachConversation + OpenAiCoachingAdapter + model/configuration
       ↓ two strict CoachingDecisionResults + identical deterministic guards
blind candidate pair + structural case summary → human review → sealed mapping/recommendation
```

No cross-process schema change. Guidance adapter copies only bounded principles/avoidances into the existing `CommunicationGuidance`; no Skill IDs, source references, registry entries, private findings or arm labels enter the provider prompt. Production output is not switched. No screenshot, private conversation, stable identity or memory data is used. The provider receives only synthetic fixture text. Local evaluation artifacts containing synthetic candidate messages and human judgments live in an ignored, explicit evaluation directory and are never normal telemetry or user history. Provider payloads, keys and raw responses are not saved or logged. Structural summary may be checked in only after review, without private content or credential material.

## Implementation steps

1. Add evaluation-only fixture selection under `packages/ai/tests/` or `scripts/`, reusing the B3.5 harness and four ordinary synthetic requests. Assert 30 provider-generated fixed actions, case coverage and the frozen snapshot.
2. Add a minimal evaluation-only `SkillPlan` → validated legacy guidance adapter. Test selected-reference/guidance fidelity, `NONE`/`FAILED` handling, and absence of action/orchestration fields.
3. Add a paired runner with an injected fake generator/fetch to prove both arms have equal fixed action, request/context, Composer instructions, model/settings/schema and provider call count, differing only in guidance. Assert production `coachConversation` defaults remain legacy.
4. Add an opt-in live runner with 60-call hard cap, per-arm sanitized status/guard result, balanced arm order, no automatic retry, and blind review artifact with mapping separate. Pilot first; stop on configuration/provider failures rather than falling back to another model or topology.
5. Apply deterministic guards to both candidates; prepare blind human-review instructions and record per-dimension judgments. Do not use a model judge as sole authority.
6. After human review, unblind, tally `NEW_WIN`, `LEGACY_WIN`, `TIE`, `BOTH_FAIL`, `NOT_COMPARABLE`, record blocking meaning/unsupported-inference issues, latency/cost limitations, and issue one of the five requested B4 recommendations. Stop; do not cut over.

## Tests and evaluation

Default CI uses synthetic fake generators only. Test exact prompt-payload equality except guidance, same model and output schema, deterministic arm assignment, budget enforcement, no provider on local-action cases, schema/error handling, refusal/uncertainty/anchor guard application, and content-free operational summaries. Live evaluation is explicit opt-in and cannot run as part of `pnpm test`. Blind human review uses meaning/factual validity first, then instruction fit, communication effectiveness, naturalness, relevance, concision and tone. Each pair offers A better, B better, tie, both unacceptable or cannot determine, plus reasons. A meaning failure cannot win on style.

## Acceptance criteria

- [x] B3.5 freeze, Skills baseline and snapshot are recorded and revalidated.
- [x] 30 synthetic/reviewed provider-generation cases cover ordinary and adversarial needs, English/Chinese and sparse/boundary situations without private data.
- [x] Guidance source is the only intended A/B prompt variable; fixed action, Composer implementation, provider/model/configuration/schema and deterministic guards are identical.
- [x] Live calls remained at 60 with no automatic retry; actual count/model/status are reported.
- [x] Human reviewer supplied 30 blind case-level dispositions and reasons before arm mapping; factual/meaning failures override lexical guard PASS. File transcription followed map opening; this sequence deviation is documented.
- [x] Win/tie/loss/failure counts and B4 decision are reported: 4 new wins, 10 legacy wins, 10 ties, 5 both fail, 1 not comparable; `BLOCKED_BY_REGRESSION`. B5/cutover planning is not justified by this result.
- [x] Full repository tests/lint/typecheck/build, B4/B3.5 TypeScript checks, Phase 4 and B3.5 evaluations, Windows-safe formatting and whitespace checks pass; production stays legacy-authoritative with unchanged user-visible behavior. Four executable refusal tests are marked expected-failure pending a later guard repair.

## Validation commands

Use focused B4 Vitest tests; full `vitest run`; `eslint . --max-warnings 0`; workspace and B4 harness `tsc -p ... --noEmit`; package/API and desktop builds; `node scripts/evaluate-phase-4.mjs`; `tsx scripts/evaluate-skill-pipeline.ts`; `prettier --check . --end-of-line auto`; `git diff --check`. Live runner requires explicit flag, key in process, and a caller-set review-output path under the ignored evaluation directory. No network call in default tests.

## Risks, rollback and limitations

Provider variability can affect outputs even when guidance is the only intended changed field; balanced ordering and optional later repeats mitigate but do not eliminate it. Thirty pairs are exploratory, not a statistical proof. Lexical guards can miss paraphrased meaning changes; human review is required. Existing tone-instruction input limitations and no active approved conflict pair limit generality. If provider/model/key/proxy fails, preserve synthetic harness and report B4 live review blocked rather than silently substituting a model. Rollback removes the B4-only harness and artifacts; B3.5 tag and production path remain unchanged.

## Progress log

- 2026-10-04: Confirmed explicit human B3.5 signoff, froze it at `b9eef8a171782973104189a1bf804b6b1432c657`, verified clean worktree and tag, inspected Composer/adapter/policy, privacy/product behavior and existing fixtures, and wrote this separate B4 plan before experiment code.
- 2026-10-04: Added 30-case evaluation-only fixture set, strict SkillPlan compatibility adapter, paired production Composer/guard harness, balanced-order/budget policy and opt-in live runner. Focused isolation tests prove equal request/action/model/prompt/schema outside communication guidance; no production source or registry changed.
- 2026-10-04: Reused the approved local credential in process for 30 synthetic pairs/60 OpenAI calls on `gpt-5.6-luna`, with `store: false`, no retry and no private conversation. All 60 provider results were schema-valid. The same production guard passed 55 arms: 26 pairs both valid, three pairs one invalid, one pair both invalid. Synthetic candidates and sealed arm map are in ignored `.local-eval/b4/`; blind human review remains pending. See the [evaluation report](../../docs/agent-composer-b4-evaluation.md).
- 2026-10-04: Full deterministic suite passed 47 files / 313 tests after adding explicit balanced-order and 60-call budget assertions; ESLint, eight TypeScript checks, five package/API builds, desktop main/native staging/preload/renderer builds, Phase 4 21/21 and B3.5 33-case evaluation passed. Formatting and whitespace are to be rechecked after final documentation edits.
- 2026-10-04: Windows-safe Prettier, `git diff --check` and untracked-file trailing-whitespace checks passed after documentation updates; tracked-index LF policy is unchanged. Independently recomputed approved runtime JSON SHA-256 and confirmed the frozen value. Prepared 30 blinded Codex recommendations in the ignored evaluation directory without opening the arm map; human approval is pending.
- 2026-10-04: Human reviewer approved/corrected all 30 case-level dispositions before unblinding. The `ordinary-appreciation` source check found no prior user thank-you, so both packages' “again” alternatives fail factual validity. Human decisions were transcribed into the ignored record after the arm map was opened; no decisions changed, but this departed from the stricter file-write order. Unblinded tally: 4 new wins, 10 legacy wins, 10 ties, 5 both fail, 1 not comparable. Recorded the accepted `decline-after-action` false-positive override only for B4 scoring, four executable expected-failure refusal regression tests, and a durable guard/Composer/fixture follow-up list in the evaluation report. No production guard or runtime change.
- 2026-10-04: Post-review validation passed `pnpm test` (47 files; 313 ordinary passes and four expected-failure guard regressions), `pnpm lint`, `pnpm typecheck`, `pnpm build`, the B3.5 and B4 evaluation TypeScript checks, `node scripts/evaluate-phase-4.mjs` (21/21), `pnpm exec tsx scripts/evaluate-skill-pipeline.ts` (33 cases), `pnpm exec prettier --check . --end-of-line auto`, and `git diff --check`. Git index remains LF for all changed files; Windows worktree line endings vary, so the repository LF policy is unchanged. No further provider calls.

## Completion record

The B4 harness, bounded generation and human review are complete. Decision: `BLOCKED_BY_REGRESSION`; the new arm has a real package-level meaning failure in `missed-commitment`, loses 10 versus four decisive non-failing cases, and shares five factual-validity failures with legacy. The deterministic guard also has documented false positives/negatives. The signed-off B3.5 shadow pipeline remains intact and production remains on the legacy `CommunicationPlan`. Do not start B5 or cut over. Recommend a separate, approved Composer/guard refinement and controlled re-evaluation milestone after resolving `GUARD-STATUS-01`, `GUARD-REFUSAL-02`, `GUARD-MODAL-03`, `COMPOSER-MEANING-04` and `FIXTURE-TONE-05` in the report. Tests added: four executable expected-failure refusal regressions; no production behavior changes. Commands/results are recorded in the progress log. Limitations: single provider generation per arm, synthetic-only context, no exact token-cost data, one invalid tone fixture, and the review-file transcription-order deviation.
