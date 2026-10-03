# SRS-4-D4 — Offline Supervisor rejection-evidence contract V2

**Verdict:** offline V2 contract and diagnostics pass. This is not a live Supervisor quality result or authorization for D5. No provider call, 53-case rerun, R2 audit scoring, protected-challenge access, retrieval change, profile change, or production change occurred. Historical V1 = FAIL (exact 50-case clause unknown), D2 = offline diagnostic PASS, D3 = FAIL (0/5 V1-valid) remain unchanged.

## Problem and minimal contract change

D3's five responses all passed provider completion, JSON, wire schema and exact ten-candidate coverage, then failed V1's shared rejection rule. V1 required positive `USER_*` factual evidence for both `PREREQUISITE_UNSUPPORTED` and `EXPLICITLY_NEGATED`. That made “no visible unresolved prior ask” difficult to express without inventing evidence that no prior ask ever occurred. It also disallowed a goal's explicit “do not plan” instruction from serving as **objective** negation.

| Topic | V1 | V2 |
| --- | --- | --- |
| Missing prerequisite support | `PREREQUISITE_UNSUPPORTED` required USER factual evidence | Replaced by `PREREQUISITE_NOT_ESTABLISHED`; zero refs allowed, but any supplied refs must be valid. This asserts only insufficient bounded support. |
| Positive contradiction | Conflated with missing support | `PREREQUISITE_CONTRADICTED` requires a valid USER factual or OTHER-reported context ref. OTHER context never proves a USER-owned fact. Missing/contradictory reasons cannot coexist. |
| Explicit objective negation | `EXPLICITLY_NEGATED` required USER factual use | Retained, but requires `OBJECTIVE` ref from USER_DRAFT, relevant USER_HISTORY, or SELECTED_GOAL. The goal can rule out a communication objective, not establish a factual event. |
| General unsupported job | `INSUFFICIENT_EVIDENCE` / `NO_MATERIAL_JOB` | Retained; zero refs allowed. No new generic reason. |
| Evidence-use vocabulary | `OBJECTIVE`, `CONTEXT`, five `USER_*` uses | Unchanged enum. `OBJECTIVE` now permits relevant USER_HISTORY. All `USER_*` uses remain USER_DRAFT/USER_HISTORY only. |
| SELECT, coverage, budget | Positive support; fact-gated USER evidence; exact B Top 10; 0–4 | Unchanged. Invalid output is FAILED, not NONE. |

The unchanged source-attributed serializer rejects oversized input rather than truncating it into apparent negative evidence. Within a complete bounded input, `PREREQUISITE_NOT_ESTABLISHED` reports only non-establishment; source uncertainty can use `INSUFFICIENT_EVIDENCE`. The validator checks closed codes, refs, source/use and structural constraints, not semantic entailment. An unrelated USER ref would still require semantic review before claiming a real contradiction. No V1 evidence was reinterpreted as V2 success.

## Offline artifacts and results

- [V2 schema and validator](../../packages/skills/tests/srs4-supervisor-v2.ts), [V2 prompt/wire schema](../../packages/skills/tests/srs4-supervisor-prompt-v2.ts), and [V2 content-free diagnostic](../../packages/skills/tests/srs4-output-contract-diagnostic-v2.ts) are private evaluation tooling. The existing serializer, candidate projection and B Top-10 order are reused without modification.
- [Six canonical fixture recipes](../../packages/skills/tests/fixtures/srs4/d4-valid-judgment-recipes-v1.json) materialize full ten-candidate judgments: first request/follow-up absence, wording NONE, grounded multi-selection, provenance-blocked factual positive, selected-goal no-next-step negation, and explicit no-boundary objective. **6/6 validate offline**. They test representability, not live-model reliability or an audit score.
- [Focused regressions](../../packages/skills/tests/srs4-supervisor-v2.test.ts) reject evidence-free contradiction/negation, contradictory prerequisite reasons, SELECTED_GOAL/OTHER as USER facts, nonexistent refs, out-of-pool/duplicate/missing decisions, >4 selections, invalid polarity, unsupported SELECT, fact-gated SELECT without USER grounding, and invalid NONE/FAILED derivation. A positive, visibly closed USER_HISTORY prerequisite contradiction is valid; objective negation from SELECTED_GOAL is valid. Provider/JSON/wire/application failures have separate V2 diagnostic stages and closed codes, with no raw content in records.

These offline structures cover all *classes* observed in D3: absent prerequisite support, explicit objective negation, and ordinary exact-coverage judgments. They do not reconstruct or validate the five discarded raw D3 responses. The next live canary must test whether the model actually emits the V2 contract.

## Freeze and boundary

[V2 freeze](../../packages/skills/tests/fixtures/srs4/supervisor-contract-v2-freeze.json) SHA-256: `beb27af30f72d99fd1c04879e4a5fd1d3957cac795253a696eed45a5a741afb7`. It binds prompt `2c20ab22…bddcc6`, wire schema `3ab1c9e1…dd7c`, V2 validator source `9724dd55…5a0d`, diagnostic schema, reason/evidence-use schemas, serializer/projection functions, fixture recipes/tests, and immutable V1/D2/D3/B/profile/R2 sources. D2 freeze remains `504503dc…b540`; R2 audit freeze remains `3297a357…319`. Two independent renders matched the stored bytes. The R2 audit remains UNSCORED. Production verification found 21 exact definitions and 153 ordered plans.

## Validation

All commands passed in the `skills` worktree on 2026-10-03:

| Command | Result |
| --- | --- |
| Focused D4 + V1/D2/D3 offline regressions | 6 files, 19 tests passed |
| `pnpm skills:check` | Registry fresh |
| `pnpm lint` | Passed, zero warnings |
| `pnpm typecheck` | All workspace packages passed |
| `pnpm test` | 56 files, 548 tests passed |
| `pnpm build` | All workspace packages passed |
| `pnpm skills:verify-production` | 21 definitions / 153 plans passed |
| `pnpm format:check` | Passed |
| `node --conditions=development --import tsx scripts/freeze-srs4-d4.ts --check` | Passed; byte-identical freeze |
| `git -c core.safecrlf=false diff --check` | Passed |

## Next gate, not executed

Plan a new **D5** five-case, contract-validity-first live canary under a fresh ID and **separate provider/key/budget approval**. The user-designated next model is `gpt-5.6-luna`, not historical `gpt-6.1-sol`; verify and freeze the exact Responses/structured-output configuration before a call. Primary metric: V2_VALID/5; 5/5 permits consideration of the exposed 53-case run, 1–4/5 requires failure review, and 0/5 stops for contract repair. D5 does not itself authorize audit scoring or the protected challenge.
