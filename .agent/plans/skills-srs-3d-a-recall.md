# SRS-3D-A — shadow recall and candidate recovery

Status: complete — evaluation-only experiment; metadata precision review open  
Owner: Codex  
Started: 2026-09-29  
Roadmap: SRS-3 ranking direction, recall-only increment

## Outcome and scope

Recover semantically supported required capabilities in the evaluation-only positive-signal candidate pool without changing ordering, production behavior, or the frozen SRS-3B/SRS-3C evidence. The before baseline is the immutable 29-case English SRS-3C report: required Recall@10 19/32, strict NONE 4/4, positive-pool mean 1.59 and maximum 5. The 12 quarantined language rows are not scored. SRS-3D-B ranking, metadata edits, supervisor/composition, providers, held-out evidence, and production cutover are out of scope.

## Current state and decisions

`packages/ai/src/skill-context-normalization.ts` contains `CURRENT` and `SRS_2_5_PROPOSED`; the latter uses source-aware lexical evidence but misses 13 frozen required occurrences. `packages/skills/tests/srs2-shadow-retrieval.ts` owns immutable hard gates and `SIGNAL_ONLY` intent +12/situation +10 retrieval. `packages/skills/tests/srs3-ranking-baseline.ts` verifies the SRS-3B freeze and generates source-bound SRS-3C evidence. It hashes the old normalizer, so this increment adds a separate private `SRS_3D_RECALL_PROPOSED` implementation and AFTER evaluator; it does not mutate the old module or report. Fixed AgentAction and raw request supply signals; labels enter metrics only after observation. Scores remain relevance signals, not confidence.

## Contracts, flow, and privacy

New private profile: raw request + fixed policy → source-aware communication-operation evidence → `SkillContext` and evidence sources → existing production-only hard eligibility and `SIGNAL_ONLY` Top 10 → content-free AFTER traces and metrics. No public runtime schema or registry change. Synthetic raw messages stay in fixture/test memory; machine evidence stores IDs, closed tags/codes, ranks, counts and hashes, never text, drafts, selected-intent prose or rationales. The new exposed-development regression set is separate from both the frozen corpus and any held-out set.

## Implementation steps

1. Verify the exact SRS-3B freeze and SRS-3C report hashes and classify each of the 13 misses from raw evidence, old tags and earliest trace stage before editing normalization.
2. Add an evaluation-only versioned recall profile using general, source-aware semantic operations and neighbor/negative controls. Keep `SRS_2_5_PROPOSED` byte-reproducible; do not edit metadata, retrieval weights, tie break or Top-K.
3. Add fresh, independent exposed-development phrasing variants for request, clarification, planning, boundary, mistake ownership, validation, status and expectation. Include positives, hard neighbors and negatives; cover rewrite and empty-draft suggest where meaningful. Keep labels out of the normalizer.
4. Add focused profile and leakage tests. Evaluate frozen BEFORE versus AFTER, separately evaluate fresh variants, and record miss causes, newly enabled forbidden capabilities, pool breadth, NONE and any incidental rank effects. Preserve frozen denominators.
5. Generate deterministic content-free AFTER evidence twice and write a human-readable report with root cause for every miss, remaining gaps and production parity.

## Acceptance and validation

General non-ID-specific rules materially improve frozen required recall without losing previously found skills; strict NONE remains 4/4; forbidden hits do not materially worsen; pool growth is explainable and controlled; fresh variants demonstrate improvement rather than memorization. A metadata gap or ambiguous label is reported, not silently repaired. SRS-3C `--check`, SRS-3B/SRS-3A and SRS-2/SRS-2.5 tests, focused recall tests, skills:check, skills:verify-production, lint, typecheck, full test, build, format:check and diff --check pass. New evidence is byte-identical across two generations. Production remains 21 ACTIVE definitions and 153 frozen plans.

## Risks, rollback, limitations

Recall can raise false positives or candidate breadth; exact neighbor and NONE controls gate it. Cross-clause attribution and speaker ownership are higher-risk than spelling variants. Rollback removes only the new profile, fixtures, evaluator, tests and report; old artifacts are immutable. Exposed development cannot establish held-out or live quality. Stop after this increment; SRS-3D-B requires separate approval.

## Progress log

- 2026-09-29: Read repository instructions, README, product/privacy/skills docs, planning rules, SRS-3C plan/report, normalizer, retrieval, frozen corpus and baseline builder. Confirmed the old normalizer is a source-hash-bound SRS-3C input and must remain untouched.
- 2026-09-29: Verified the SRS-3B freeze and exact SRS-3C baseline hash before changes. Diagnosed 13 misses as positive-signal retrieval cutoffs, then added a separate profile with source-aware request, clarification, planning, continuing-limit, user-ownership, other-person emotion, current-progress and future-estimate operations.
- 2026-09-29: Added 68 fresh exposed-development regression cases: 48 positive variants and 20 hard-neighbor/negative controls, including four negated selected goals. The AFTER evaluator joins labels only after raw-only observation and keeps the frozen BEFORE evidence intact.
- 2026-09-29: Recovered all 13 frozen misses with no lost required hit, NONE regression or newly forbidden frozen hit. Fresh positives were 48/48. Two fresh controls newly admit `expectation_setting` via its existing `planning`/`status_request` situation metadata without emitting `set_expectation`; no metadata change was made. A third control status-intent hit predates this profile. This is a precision/boundary review gate, not permission to suppress correct context or change metadata.
- 2026-09-29: Formatted sources, generated AFTER evidence twice with identical bytes, and ran focused/full validation and production parity.

## Completion record

Implemented only evaluation-only `SRS_3D_RECALL_PROPOSED`, the separate 68-case regression set, AFTER evaluator/tests/script/evidence and [report](../../docs/skills/srs-3d-a-recall-recovery.md). The immutable SRS-3C BEFORE report remains SHA-256 `ffa306ca87866313d58e670775ded8bad91a4dcc99cb23efe5fb35839b9dbcac`; the new AFTER evidence is SHA-256 `8c25faac2ebe2e9260fad121907c325c428c2d9288688468cf1a6e46b03d8895` across two generations. Frozen required Recall@10 rose 19/32 → 32/32; within-scenario coverage 14.5/25 → 25/25; all-required found 13/25 → 25/25; strict NONE stayed 4/4; forbidden stayed 1/5. Positive-pool mean 1.59 → 2.55, max 5 → 6, p50 2 → 2, p90 4 → 5. No previously found required capability was lost. Ranking scores/tie break were unchanged; incidental Primary@1 5/18 → 13/18 and pairwise end-to-end 3/11 → 7/11 are not ranking-algorithm claims.

Validation commands/results:

- `node --conditions=development --import tsx scripts/evaluate-srs-3-baseline.ts --check` — passed, exact frozen SHA-256 above.
- `node --conditions=development --import tsx scripts/evaluate-srs-3d-recall.ts --generate` (twice) and `--check` — passed, exact AFTER SHA-256 above.
- `pnpm test packages/skills/tests/srs3d-recall-evaluation.test.ts packages/skills/tests/srs3-ranking-baseline.test.ts packages/skills/tests/srs3-ranking-corpus.test.ts packages/skills/tests/srs3-phase8a-evidence-audit.test.ts packages/skills/tests/srs2-shadow-retrieval.test.ts packages/skills/tests/srs2-5-context-normalization.test.ts packages/ai/src/skill-context.test.ts` — seven files, 95 tests passed.
- `pnpm skills:check` — passed, generated registry fresh.
- `pnpm lint` — passed, zero warnings.
- `pnpm typecheck` — passed across the workspace.
- `pnpm test` — 37 files, 486 tests passed.
- `pnpm build` — passed across all workspace packages and desktop bundles.
- `pnpm skills:verify-production` — passed, 21 exact ACTIVE definitions and 153 ordered plans, public exports, deep freezing and authoring exclusion.
- `pnpm format:check` — passed after correcting the AFTER JSON formatter to use repository configuration.
- `git -c core.safecrlf=false diff --check` — passed.

Acceptance: recall, frozen NONE/forbidden, no-loss, bounded-pool, fresh-positive, reproducibility, privacy and production-parity checks pass. Precision promotion remains **unapproved** because two fresh controls newly admit `expectation_setting` through governed metadata and one inherited status-intent neighbor error remains. The 68 variants are exposed development authored during this increment, not independent human or held-out evidence. No metadata, production, ranking, supervisor, provider or frozen-source change was made. Next step is a separately approved metadata/boundary review, then SRS-3D-B ranking planning only if warranted. Stop here.
