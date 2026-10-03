# SRS-2 shadow retrieval report

Status: complete for exposed development evaluation; production unchanged  
Date: 2026-09-27  
Plan: [SRS-2 hard eligibility and shadow capability retrieval](../../.agent/plans/skills-srs-2-retrieval.md)  
Machine-readable evidence: [development-report.json](../../packages/skills/tests/fixtures/srs2/development-report.json)

## Decision boundary

SRS-2 adds a private, evaluation-only retriever under `packages/skills/tests/`. It
does not change `SkillEngine.select()`, production exports, shared contracts,
approved definitions, the generated registry, prompts, or provider behavior.

The retriever consumes the already-fixed `AgentAction`, validates `SkillContext`,
applies hard eligibility, separates capability and language-modifier lanes, and
produces a diagnostic capability Top-K. It compares the current intent/situation
admission rule with a signal-only alternative. The comparison does not activate a
candidate or choose a production policy.

## Evidence boundary

| Evidence | Count | Use |
| --- | ---: | --- |
| Phase 4 regression scenarios | 21 | Production comparison and shadow retrieval |
| Phase 8 candidate scenarios | 32 | Explicit revision-bound evaluation overlay |
| Total runnable scenarios | 53 | Exposed development metrics |
| Scenarios with required capabilities | 38 | Required-skill metrics |
| Required capability occurrences | 41 | Recall denominator |
| Acceptable capability occurrences | 7 | Rank diagnostics only |
| Strict `NONE` scenarios | 10 | Empty-pool boundary metric |
| Forbidden capability occurrences | 34 | Forbidden-in-Top-K metric |
| Canonical authoring examples | 210 | Authoring audit only; zero routing metrics |

All 210 canonical examples remain `PENDING_HUMAN_REVIEW`. No situation or intent
tags were inferred from their expected labels. The held-out corpus remains
`NOT_AUTHORED`, unsealed, unread, and unscored.

Catalog bindings:

- Production: `sha256:c96fc9c9a5b26909ecf635bbae3ebef28abf15ed4729216cc28caf7698ad1ee3`
- Evaluation overlay: `sha256:d955865b4df118cc88935512d307687437500b91ada4fcfca10f7bd0baa40a8f`
- Scenario set: `sha256:a80a73e65a20e17aeb85e6188a9cea3cbb75460d94ea360c6921fd5850ed1897`

The evaluation overlay contains only the revision-bound
`perspective_acknowledgement` and `give_constructive_feedback` candidates.
`confirmation` remains absent. Default production scope cannot observe evaluation
definitions.

## Retrieval results

The score is deliberately coarse: an intent match adds 12 and a situation match
adds 10. Ties use stable skill ID order. The identity reranker copies score and rank
without changing either. Rank is a diagnostic signal for SRS-2; SRS-3 owns ranking
quality changes.

| Mode | K | Recall@K | Required coverage@K | All required found | Strict `NONE` pass | Forbidden in Top-K | Required outcomes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Legacy metadata gate | 5 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 0.0000 | 41 found; 0 eligibility, retrieval, or ranking failures |
| Legacy metadata gate | 10 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 0.0000 | 41 found; 0 eligibility, retrieval, or ranking failures |
| Signal only | 5 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 0.0000 | 41 found; 0 eligibility, retrieval, or ranking failures |
| Signal only | 10 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 0.0000 | 41 found; 0 eligibility, retrieval, or ranking failures |

The required-rank distribution is identical in all four runs: rank 1 has 36
occurrences, rank 2 has two, rank 3 has two, and rank 4 has one. No required
capability fell below K=5.

Perfect results here describe a small, exposed, synthetic, label-aligned development
set. They do not establish confidence calibration, production thresholds, or
generalization.

## Pool breadth

Each cell is `min / max / mean / p50 / p90` over 53 scenarios.

| Mode | K | Hard eligible | Positive-signal pool | Returned Top-K |
| --- | ---: | --- | --- | --- |
| Legacy metadata gate | 5 | 0 / 16 / 13.623 / 16 / 16 | 0 / 4 / 0.925 / 1 / 1 | 0 / 4 / 0.925 / 1 / 1 |
| Legacy metadata gate | 10 | 0 / 16 / 13.623 / 16 / 16 | 0 / 4 / 0.925 / 1 / 1 | 0 / 4 / 0.925 / 1 / 1 |
| Signal only | 5 | 0 / 16 / 13.623 / 16 / 16 | 0 / 8 / 1.792 / 1 / 4 | 0 / 5 / 1.679 / 1 / 4 |
| Signal only | 10 | 0 / 16 / 13.623 / 16 / 16 | 0 / 8 / 1.792 / 1 / 4 | 0 / 8 / 1.792 / 1 / 4 |

Signal-only retrieval admits partial intent/situation matches and therefore broadens
the candidate pool. At K=5, three scenarios have candidates below the Top-K cutoff;
none of those candidates is required or forbidden in this corpus. This breadth
difference is evidence for SRS-3 review, not a production recommendation.

## Acceptable-skill diagnostics

Acceptable skills never enter required recall denominators.

| Mode | Found | Retrieval failure | Detail |
| --- | ---: | ---: | --- |
| Legacy metadata gate, K=5 or K=10 | 4 | 3 | `request` has no supporting evidence; `de_escalation` and `reassurance` fail legacy intent admission |
| Signal only, K=5 or K=10 | 6 | 1 | `de_escalation` ranks 3 and `reassurance` ranks 2; `request` still has no supporting evidence |

The difference shows that the legacy rule suppresses two acceptable partial matches.
This observation remains diagnostic because acceptable labels express valid choices,
not mandatory selection.

## Production comparison

The unchanged production selector ran alongside both shadow modes for all 21 Phase 4
scenarios.

- Production registry: 21 definitions.
- Frozen Phase 7 plans: 153 exact plans.
- Production-required misses recovered by shadow retrieval: 0.
- Shadow-retrieved required capabilities absent from production selection: 0.
- Phase 4 regressions: 21 of 21 pass.

The shadow Top-K is a broad candidate pool, while production selects and composes a
small final set. Extra shadow candidates are therefore evaluated through the strict
`NONE` and forbidden metrics instead of being counted as production false positives.

## Trace and privacy properties

- Every catalog entry receives a closed eligibility result and reason codes.
- Hard-gate order is status, catalog, action, language, then code-switch prerequisite.
- Non-wording actions are excluded even when a synthetic definition declares that
  action.
- Modifiers stop after eligibility and never occupy capability ranks or Top-K slots.
- Legacy admission and zero-signal failures use `RETRIEVAL_CUTOFF`.
- Rank beyond K uses `TOP_K_CUTOFF` with `BELOW_TOP_K`.
- The generic SRS trace retains a valid future `RERANK_CUTOFF` state when a real
  reranker and `BELOW_RERANK_CUTOFF` are present. SRS-2 never emits that state.
- Reports contain IDs, categories, ranks, scores, stages, and closed reason codes.
  They contain no message text, draft, prompt, provider payload, or rationale.
- Evaluation makes no provider or network call and requires no credential.

## Tests added

Focused tests cover hard gates and failure ordering, strict context validation,
non-wording actions, supported and unsupported language families, code switching,
catalog isolation, candidate overlay binding, capability/modifier lane separation,
both retrieval modes, zero-signal exclusion, 12/10 scoring, stable ordering,
identity reranking, K boundaries, cutoff semantics, hand-computed metrics, pool
statistics, 53-case evidence loading, the 210-example audit, report privacy, and the
unchanged 21-definition production registry.

## Validation

All commands ran from `C:\Users\b\Documents\ChatGPT\AI messager-skills` in the
required order and exited 0:

1. `pnpm exec vitest run packages/skills/tests/srs1-foundation.test.ts packages/skills/tests/srs2-shadow-retrieval.test.ts`
2. `pnpm eval:srs2`
3. `pnpm skills:check`
4. `pnpm lint`
5. `pnpm typecheck`
6. `pnpm test`
7. `pnpm build`
8. `pnpm skills:verify-production`
9. `pnpm eval:phase4`
10. `pnpm format:check`
11. `git -c core.safecrlf=false diff --check`

The focused suite passes 25 tests. `skills:verify-production` confirms 21 exact
production definitions and 153 ordered frozen plans. `eval:phase4` confirms 21 of 21
scenarios with all reported metrics equal to 1. The deterministic `eval:srs2` output
matches the metrics and digests above.

## Limitations and SRS-3 gate

The corpus contains 53 exposed synthetic development cases. There is no independently
annotated held-out routing corpus. The 12/10 scorer cannot express semantic quality
or calibrated confidence, and signal-only pool growth needs selection-stage analysis.
No conclusion here authorizes production activation of either Phase 8 candidate.

SRS-3 remains blocked pending user review of both admission modes, pool breadth,
required and acceptable ranks, strict `NONE` and forbidden behavior, production
comparison, and evaluation-overlay isolation.
