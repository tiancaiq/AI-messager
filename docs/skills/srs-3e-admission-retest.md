# SRS-3E admission retest on exposed calibration

Status: **diagnostic only; do not run the frozen challenge** (2026-09-29).

## Scope and binding

This retest held the pinned local MiniLM encoder, 14 approved ATOMIC positive-profile vectors, source-aware raw query, deterministic hard gates, `α=0`, and Top 10 constant. It scored only 29 accepted English SRS-3B rows and 24 corrected calibration controls. Labels were joined after raw scoring. No model/profile text, production selector, canonical skill definition, frozen first-run config, or challenge input was changed. The machine artifact is [admission-retest-v3.json](../../packages/skills/tests/fixtures/srs3e-semantic/admission-retest-v3.json), SHA-256 `f340f5862fedfad72dc32be58dc5e5f174cf89a51ce25b4171c8ae0d957b6c5c`. The earlier `v2` output is preserved as a preliminary diagnostic; `v3` makes admission rejection and Top-K cutoff distinct.

The retest bound the corrected calibration freeze (`bcb55ca5ee19973e974550c75a06892e58cfa8f0bc9380efcfce790eb25e0f8a`), frozen positive vectors (`b02d4664585c29d3a0ac33e41c6827d2bd4d5d065fd7eb289182084c6dc05588`), prior absolute-threshold grid (`d5cb69af28b6cf4d51611c58b5ee42d43ba91feea6404f43036d815a595b8a33`), and the SRS-3B lineage. The untouched challenge freeze still hashes to `4cd2a78487b0d59c67d97bfe672219f9ff19c9913d079372b2324dbb80a87b84`; its rows were not read or scored.

## Admission comparison

The [predeclared retest plan](../../.agent/plans/skills-srs-3e-admission-retest.md) compared 103 settings: 19 absolute thresholds, 15 median-centered thresholds, 60 peak/spread rules, and nine dual-source rules. The original guards remained visible: 100% strict NONE, ≤20% explicitly forbidden admissions, mean pool ≤5, p90 ≤8, max pool ≤10, and nonzero required recovery. These exposed-development counts are diagnostics, not a claim about future user traffic.

| Rule family | Guard-satisfying nonempty settings | Strongest observed result |
| --- | ---: | --- |
| Absolute threshold | 0 | Reproduces the all-empty v1 stop |
| Median-centered | 4 | Nonempty but below the peak/spread recall |
| Peak/spread | 16 | 8/46 required, 16/16 NONE, 2/14 forbidden |
| Dual-source | 2 | Nonempty but below the peak/spread recall |

The strongest guard-satisfying setting is `P087`: primary cosine floor `0.40`, candidate within `0.15` of the best skill, and best-minus-median spread at least `0.20`. It returned **6/32** required skills on SRS-3B and **2/14** on new controls (combined **8/46**), with strict NONE **16/16**, forbidden **2/14**, and positive-pool mean **0.26**, p90 **1**, max **2**. Only **7/37** positive scenarios have all required skills, and only **6/14** atomic capabilities receive any required hit. Scores remain relevance signals, not confidence or selection decisions.

The mode gap is decisive: `REWRITE_DRAFT` recovered **0/27** required skills, while `SUGGEST_REPLY` recovered **8/19**. Before admission, 38/46 required skills rank within the structurally eligible Top 10 (27/32 SRS-3B, 11/14 controls). The relative gate therefore restores some abstention-compatible recovery, but most ranked positives are still rejected. It is too sparse to justify opening the challenge.

Cross-corpus selection is also unstable. Choosing a rule on SRS-3B alone gives 6/32 training hits and 2/14 control hits, but misses one control NONE (`11/12`). Choosing on the new controls gives 2/14 training hits and 5/32 SRS-3B hits, but misses one SRS-3B NONE (`3/4`). Both corpora are exposed; this is only a transfer warning, not held-out validation.

## Decision

**Do not promote `P087` or run the frozen SRS-3E challenge.** The retest answers the immediate question: changing admission alone can avoid the degenerate all-empty solution on the exposed data, but the best tested rule still loses every rewrite positive and most capability types. A next version should diagnose why short user drafts score weakly relative to supportive context and design an abstention mechanism that transfers between exposed corpora, without letting OTHER-message content overwrite the user's draft intent. That needs a separately reviewed plan/config and a new immutable experiment ID. The one-shot challenge remains reserved for a configuration that passes its pre-challenge human review.

No supervisor, SkillPlan, BM25, negative-profile vector, vector database, modifier ranking, provider call, or production cutover was added.

## Validation

The exposed retest was regenerated twice with byte-identical SHA-256 and passed `--check`. The focused admission test passed (2/2); `pnpm test` passed **43 files / 510 tests**. `pnpm skills:check`, `pnpm skills:verify-production` (21 definitions, 153 plans), `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm format:check`, and `git -c core.safecrlf=false diff --check` all passed. The accepted outcome for this request is a completed exposed-only diagnostic; **SRS-3E challenge acceptance remains untested**.
