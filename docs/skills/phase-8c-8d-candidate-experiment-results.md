# Phase 8C/8D Candidate Experiment Results

Date: 2026-09-24  
Scope: evaluation only; no candidate activation

## Decision summary

| Candidate                     | Decision | Evidence summary                                                                                                                       |
| ----------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `perspective_acknowledgement` | DEFER    | Selection passed. All 16 live arms returned schema-valid outputs and passed bounded automated safety checks. Human uplift is unscored. |
| `give_constructive_feedback`  | DEFER    | Selection passed. Suggest-reply arms passed, but all eight rewrite arms failed shared response validation in every condition.          |
| `confirmation`                | DEFER    | The user explicitly deferred it. It was absent from contracts, fixtures, simulations, routing and provider calls.                      |

These are research dispositions. No candidate is approved or active in production.

## Authorization and controls

The user authorized evaluation experiments for `perspective_acknowledgement` and `give_constructive_feedback`, kept `confirmation` deferred and prohibited production activation. The run used only synthetic conversations.

- Provider/model: OpenAI `gpt-5.6-luna`, through the existing provider-neutral coaching entry point and OpenAI adapter.
- Conditions per live case: generic `G`, best existing `E`, candidate only `N`, and existing plus candidate `E+N`.
- One repetition, no retries, 32 total requests: eight synthetic cases × four conditions.
- Both `REWRITE_DRAFT` and empty-draft `SUGGEST_REPLY` were included for each candidate.
- Condition order was deterministic and blinded. The condition map is separate from the review packet.
- The private packet remains in the user's temp directory until review or user deletion. Generated messages were not printed or committed.
- The 21-skill production registry stayed unchanged. Candidate definitions are private `INACTIVE` fixtures; simulations switch them to `ACTIVE` only in memory.
- Candidate-aware derivation is behind `experimentalCandidateRouting: true`. Its default is false, and historical callers retain their previous behavior.

Machine-readable results: [`candidate-experiment-results.json`](../../packages/skills/tests/fixtures/phase8/candidate-experiment-results.json).

## Selection results

Each candidate had 16 direct cases: eight positives across English, regional English, Simplified Chinese and Traditional Chinese; two negatives; four hard-neighbor cases; and two strict `NONE` cases. Each category was split evenly across rewrite and empty-draft suggestion.

| Candidate                   | Positive | Negative | Hard neighbor | Strict `NONE` | Rewrite | Suggest | Raw opt-in | Default isolation |
| --------------------------- | -------- | -------- | ------------- | ------------- | ------- | ------- | ---------- | ----------------- |
| perspective acknowledgement | 8/8      | 2/2      | 4/4           | 2/2           | 8/8     | 8/8     | 4/4        | 4/4               |
| give constructive feedback  | 8/8      | 2/2      | 4/4           | 2/2           | 8/8     | 8/8     | 4/4        | 4/4               |

The candidates were also simulated together. No case selected the other candidate. Existing-neighbor cases retained their required neighbor and excluded the focal candidate.

The selection corpus is exposed, self-authored research material. It is useful development evidence but does not satisfy the plan's independently authored held-out gate.

## Live generation results

Automated checks cover fixed action, structured-output validity, bounded factual anchors and listed forbidden claims. They do not replace semantic or language-competent human review.

| Candidate                   | Mode            | Successful arms | Failed arms | Automated safety passes |
| --------------------------- | --------------- | --------------- | ----------- | ----------------------- |
| perspective acknowledgement | `REWRITE_DRAFT` | 8/8             | 0           | 8/8                     |
| perspective acknowledgement | `SUGGEST_REPLY` | 8/8             | 0           | 8/8                     |
| give constructive feedback  | `REWRITE_DRAFT` | 0/8             | 8           | 0/8                     |
| give constructive feedback  | `SUGGEST_REPLY` | 8/8             | 0           | 8/8                     |

The 16 successful perspective arms cover English rewrite/suggestion, Simplified Chinese rewrite and Traditional Chinese suggestion. The eight successful feedback arms cover English and Traditional Chinese empty-draft suggestion.

The packet enables blinded comparison of with-candidate (`N`, `E+N`) and without-candidate (`G`, `E`) outputs, but no genuine human win/tie/loss labels exist yet. Therefore no uplift claim is made.

## Feedback rewrite failure diagnosis

Both feedback rewrite families failed with `INVALID_RESPONSE` under all four conditions. The equal pattern across `G`, `E`, `N` and `E+N` means this run cannot attribute the failure to candidate guidance.

The likely cause is the shared deterministic factual-anchor guard: both rewrite sources use numeric repetition anchors (`2 times` / `2次`), while a semantically faithful model output may spell that count as “twice,” “两次” or “兩次.” The adapter intentionally collapses structured-output and downstream guard rejection into the same safe `INVALID_RESPONSE`, so the stored evidence does not prove which internal check rejected each output. This is a harness diagnosis, not a candidate quality finding.

A valid follow-up should preserve these failures, move the exposed families to development data, separate provider schema validation from bounded semantic guards in private evaluator telemetry and use fresh rewrite families after reviewing number-equivalence handling. No rerun occurred in this study.

## Preservation and safety

- Every successful arm preserved the fixed `AgentAction` and passed the existing coaching engine's structured schema and deterministic guards.
- The evaluator additionally checked required bounded anchors and candidate-specific forbidden claims for invented agreement, motive, fault, repetition, identity attack and new promises.
- All 24 successful outputs passed these checks.
- The eight feedback rewrite failures are failures, not safe passes.
- No generated output was logged to standard output or committed to the repository.

These checks are narrow. Human review is still required for semantic intent, nuanced facts, commitments, certainty, naturalness, proportionality and candidate-specific incremental benefit.

## Disposition rationale

### `perspective_acknowledgement`: DEFER

The selection hypothesis survived this bounded experiment, and both assistance modes produced valid outputs. Approval remains blocked by the missing blinded human comparison, missing independent case authorship, only four live cases rather than the preregistered 12-context floor, one repetition and incomplete Chinese mode balance. Resume after competent English, Simplified Chinese and Traditional Chinese reviewers rate the private packet and fresh held-out cases meet the frozen coverage gate.

### `give_constructive_feedback`: DEFER

Direct and opt-in raw selection passed, and empty-draft generation completed. The study has no usable rewrite comparison because all four conditions failed on both rewrite cases. Resume after the shared guard/evaluator boundary is diagnosed, the exposed numeric cases are retained as development evidence, fresh rewrite cases are sealed and the blinded human review is staffed.

### `confirmation`: DEFER

No experiment was performed. The candidate remains outside the shared intent enum and all evaluator/runtime paths.

## Production isolation

- Production registry: 21 definitions.
- Frozen Phase 7 registry digest: `sha256:c96fc9c9a5b26909ecf635bbae3ebef28abf15ed4729216cc28caf7698ad1ee3`.
- No manifest, approved YAML, generated registry, production prompt, default router or desktop/API behavior contains either candidate.
- No activation, commit, merge or push occurred.

## Private artifacts

The review packet is `C:\Users\b\AppData\Local\Temp\ai-message-coach-phase8-candidate-review.json` with SHA-256 `7c8320a147cd568c11c981090d5f4833ab26ec7371be3a4cc27528c6edacc4bb`.

The separate condition map is `C:\Users\b\AppData\Local\Temp\ai-message-coach-phase8-candidate-review.json.conditions.json` with SHA-256 `c7c415f11bf914db2a239a34e50873e4cc8e561ca813fd09e8f5132fdfa71e11`.

Review the first file while blinded. Open the condition map only after assigning ratings. Do not paste generated replies into committed notes.

## Commands and results

- `pnpm typecheck` — passed across six workspace projects.
- `pnpm exec vitest run packages/contracts/src/skills.test.ts packages/skills/tests/phase8-candidate-experiment.test.ts packages/ai/src/skill-context.test.ts` — 3 files / 26 tests passed after correcting two fixture-language routing patterns and adding the result-ledger assertion.
- `pnpm eval:phase8-candidates` — passed; production 21, both candidates 16/16 direct, 4/4 raw opt-in and 4/4 default isolation.
- `pnpm eval:phase8-candidates -- --live --review-output C:\Users\b\AppData\Local\Temp\ai-message-coach-phase8-candidate-review.json` — completed all 32 calls, wrote both private artifacts, then exited 1 because the evaluator treats any failed arm as a failed run. Result: 24 successes and eight preserved `INVALID_RESPONSE` failures.
- `pnpm lint` — passed, including the fresh generated-registry check.
- `pnpm test` — 30 files / 394 tests passed. The first full run correctly exposed two stale pre-experiment assertions that all three candidate intent tags were absent; the assertions now distinguish the two authorized experiment tags from deferred `confirm_understanding`.
- `pnpm build` — passed across contracts, skills, test fixtures, AI, API and desktop.
- `pnpm skills:verify-production` — passed: 21 exact definitions, 153 ordered plans, public exports, deep freezing and authoring exclusion.
- `pnpm eval:phase4` — passed 21/21 scenarios with exact action preservation, no invention, strict scenario pass and the synthetic conflict probe.
- `pnpm format:check` — passed after targeted formatting of the updated Phase 8B historical assertion.
- Targeted Prettier check for this report and the living plan — passed.
- `git -c core.safecrlf=false diff --check` — passed. `.env.local` remains ignored and untracked.
