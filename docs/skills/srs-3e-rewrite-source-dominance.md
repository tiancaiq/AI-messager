# SRS-3E-v2 exposed rewrite source-dominance diagnostic

Status: **complete — stop SRS-3E query/admission iteration; frozen challenge untouched** (2026-09-30).

## Scope and binding

This one-pass diagnostic used the 29 accepted English SRS-3B cases and 24 corrected SRS-3E exposed controls only (53 scenarios). The pinned MiniLM, 14 atomic skill profiles, frozen positive vectors, cosine similarity, source fragment serializer, structural eligibility, and production selector were unchanged. The [plan](../../.agent/plans/skills-srs-3e-rewrite-source-dominance.md) predeclared four rewrite-only source policies and fixed the previous P087 admission rule (floor 0.40, within 0.15 of top score, max-minus-median spread ≥0.20, Top 10). No threshold grid or skill-specific weight was searched. The source scores were computed from the existing raw-only retriever; labels were joined for metrics afterward. No frozen-challenge row was read, embedded, or scored.

The corrected content-free machine result is [rewrite-source-dominance-v2.json](../../packages/skills/tests/fixtures/srs3e-semantic/rewrite-source-dominance-v2.json), SHA-256 `3e5f3ea4581564e91563c27a18839090be1680c4cfa115f381b87c0ffed9243b`. It binds the exposed calibration freeze `bcb55ca5ee19973e974550c75a06892e58cfa8f0bc9380efcfce790eb25e0f8a`, positive vectors `b02d4664585c29d3a0ac33e41c6827d2bd4d5d065fd7eb289182084c6dc05588`, and prior retest `f340f5862fedfad72dc32be58dc5e5f174cf89a51ce25b4171c8ae0d957b6c5c`. A preliminary `v1` artifact was retained; `v2` corrects the diagnostic `TOP_K_CUTOFF` stage accounting without changing any candidate score, admission, or aggregate result.

## Findings

| Rewrite source policy | Required admitted, all | Required admitted, rewrite | Strict NONE | Explicit forbidden admitted | Positive pool mean / p90 / max |
| --- | ---: | ---: | ---: | ---: | ---: |
| A — draft only | 8/46 | 0/27 | 16/16 | 2/14 | 0.26 / 1 / 2 |
| B — draft + capped context boost | 8/46 | 0/27 | 16/16 | 2/14 | 0.26 / 1 / 2 |
| C — primary floor + partial context gap | 8/46 | 0/27 | 16/16 | 2/14 | 0.26 / 1 / 2 |
| D — user-goal max + gated context | 8/46 | 0/27 | 16/16 | 2/14 | 0.26 / 1 / 2 |

For the 27 rewrite requirements, draft-only semantic ranks recovered **10/27 @3, 13/27 @5, 20/27 @10** before admission. Context-only ranks were **13/27 @3, 17/27 @5, 24/27 @10**; context-only was diagnostic and **never** an admission policy. All four combined policies had the same 10/13/20 pre-admission rewrite ranks. Only **4/27** required skills had draft cosine ≥0.25, and **0/27** reached the fixed 0.40 admission floor. Even the best observed combined required-skill cosine was approximately **0.333**. Thus 20 rewrite requirements were already in Top 10 but rejected by admission; seven were below Top 10. None was lost because OTHER context demoted a good draft rank in the earlier alpha-zero run.

The OTHER/history fragments often carry relevant topic information, which explains the stronger *context-only rank*. But substituting their score for the short user draft could promote a capability based on the other person's intent or emotional tone. The bounded, draft-gated variants respected that invariant; they did not recover rewrite skills under fixed P087. This is an inference from these exposed cases, not proof that every future rewrite has weak draft signal. Scores are relevance, not probabilities or confidence.

## Decision

**No variant passed the predeclared exposed viability gates** of ≥6/27 rewrite and ≥14/46 overall required recovery; all remained at 0/27 and 8/46. NONE, forbidden, and pool guards passed only because admission stayed very sparse. Do not freeze an SRS-3E-v2 challenge config, open the one-shot challenge, relax P087, or start an SRS-3E-v3/v4 search. Return to the separately planned [SRS-3F communication-operations and admission-free Top-K architecture](../../.agent/plans/skills-srs-3f-communication-operations.md), starting with its independently evaluated operation increment under approval. SRS-3F must report candidate-rank quality and leave wording `NONE` to the later Supervisor; it is not authorized for production by this result.

## Validation and limits

The focused source-policy tests assert that OTHER cannot rescue a weak draft, source boosts are bounded, non-rewrite scoring is unchanged, the fixed baseline reproduces 8/46, 0/27, 16/16 and 2/14, and the script has no challenge import/path. The script verifies exposed freeze, model/vector and SRS-3B bindings before scoring. This is synthetic, English-only, exposed-development evidence; it is not held-out generalization or human-approved production behavior. All output traces contain IDs/scores/ranks and no raw message or draft text.

Exact validation commands and outcomes are recorded in the [execution plan](../../.agent/plans/skills-srs-3e-rewrite-source-dominance.md).
