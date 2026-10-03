# SRS-3E exposed-calibration admission retest

Status: exposed-calibration diagnostic complete (2026-09-29); no frozen-challenge run or first-run config approval.

## Boundary and assumptions

The user asked to retest admission before the next one-shot evaluation. Keep the existing 21 ACTIVE production definitions, 14 ATOMIC profiles, pinned MiniLM model, positive vectors, source-aware query serialization, hard eligibility, and v1 calibration artifacts byte-frozen. Work only on 29 accepted English SRS-3B rows and 24 `SRS-3E-SEMANTIC-CALIBRATION-2` controls; D01–D68 may be a separate target-specific reference. Do not import, inspect, embed, score, or modify the SRS-3E frozen challenge. Do not claim this exposed retest is held-out validation. No production/runtime change, supervisor, modifier ranking, provider call, or new profile/model vectors.

## Predeclared admission hypotheses

Hold `α=0` (the v1 selected setting) to isolate admission from source-mixing changes. Use the same per-skill cosine scores and source similarities. Test only these evaluation-only rules, with fixed Top 10 and stable score/ID ties:

1. `ABSOLUTE`: v1 `score ≥ τ` for `τ = 0.30..0.75` in 0.025 steps; control comparator.
2. `CENTERED`: `score ≥ floor` and `score − median(hard-eligible scores) ≥ lift`, with `floor ∈ {0.20,0.30,0.40}` and `lift ∈ {0.05,0.10,0.15,0.20,0.25}`. This tests whether generic high similarity can be subtracted without changing the embedding/profile.
3. `PEAK_SPREAD`: `score ≥ floor`, `score ≥ maxScore − width`, and `maxScore − medianScore ≥ spread`, with `floor ∈ {0.20,0.30,0.40}`, `width ∈ {0.05,0.10,0.15,0.20}`, `spread ∈ {0.10,0.15,0.20,0.25,0.30}`. This tests a relative no-skill gate while permitting multiple close capabilities.
4. `DUAL_SOURCE`: `primaryMax ≥ primaryFloor` and `contextMax ≥ contextFloor` for cases with both sources; cases without context require only primary. Grids are `primaryFloor ∈ {0.25,0.35,0.45}`, `contextFloor ∈ {0.20,0.30,0.40}`. This tests whether source agreement discriminates unsupported generic matching. No text rewriting or label-conditioned query change.

These are diagnostic proposals, not approved challenge configuration. Do not add per-skill thresholds, label-trained weights, negative-profile embeddings, or a model reranker. If a rule uses a relative statistic, compute it only over structurally hard-eligible atomic skills and record pre-admission ranks unchanged.

## Measurements and decision

For every rule/config report SRS-3B and control required hits and macro recall separately; strict NONE numerator/denominator; explicitly forbidden admissions; pool mean/p90/max; acceptable-skill presence; all-required cases; per-required pre-admission rank and disappearance reason. D01–D68 can provide separate target-positive/negative counts, never full-catalog forbidden precision. Compare 100% strict NONE, forbidden ≤20%, pool mean ≤5/p90 ≤8/max ≤10 as guard columns; do not silently relax them. Highlight all-pairs-empty solutions as nonviable. Inspect whether any nonzero-recall guard-satisfying candidate transfers across SRS-3B and new controls; rank/threshold diagnostics are not probability or final selection.

Write a deterministic, content-free machine artifact and a concise Markdown report. Verify source/model/vector/freeze digests, output hashes, isolated label join, focused tests, and canonical repository checks. Stop after the exposed retest and report the next choice. A promising rule still requires a new immutable config ID, explicit human review of its binding, and separate approval before the untouched one-shot challenge.

## Progress

- 2026-09-29: Read README, product/privacy docs, plan conventions, active SRS-3E plan/report and current retriever/tests. Assumption: “retest admission” authorizes comparative exposed-calibration diagnostics, not opening the challenge or promoting a rule.
- 2026-09-29: Ran 103 predeclared admission settings on 29 SRS-3B and 24 corrected calibration rows only. Twenty-two settings passed the combined exposed guards with nonzero recovery. The strongest, `PEAK_SPREAD` `P087`, recovered 8/46 required skills but 0/27 rewrite requirements; it preserved 16/16 strict NONE and admitted 2/14 explicit forbiddens. Cross-corpus rule selection failed one strict NONE in either direction. Preserved preliminary `v2` and produced corrected content-free `admission-retest-v3.json` with exact failure stages. No challenge row was read/scored; no rule was promoted. See [report](../../docs/skills/srs-3e-admission-retest.md).
- 2026-09-29: Two artifact regenerations were byte-identical; focused test passed, full suite passed 43 files/510 tests, and skills check, production parity, lint, typecheck, build, format check, and diff check passed. Diagnostic complete; no configuration is approved for the one-shot challenge.
