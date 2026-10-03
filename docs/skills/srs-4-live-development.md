# SRS-4 frozen live development observation

Status: **FAIL — stop before audit**. This is one untuned, exposed-development observation of the frozen `SRS-4-DEV-LIVE-1` configuration. The 64-case R2 audit remains **UNSCORED**; the protected challenge was not read. No production selector, profile, model vector, or skill definition was changed.

## Binding and authorization

| Item | Bound value |
| --- | --- |
| Development config | `packages/skills/tests/fixtures/srs4/development-live-config-v1.json`, SHA-256 `3b4ecfe80979486c454009d48bdba640becc8f59c642fff11b759dfd6168f93a` |
| Provider | OpenAI Responses, requested and returned `gpt-6.1-sol`, medium reasoning, strict JSON, `store:false`, no tools, no retries |
| Corpus | Existing 53 exposed English development cases: 50 model requests and three structural bypasses |
| Authorization | Reuse of the existing local key and up to **$8 total** for this 50-request run, explicitly confirmed by the user |
| Cost envelope | Frozen conservative maximum estimate $6.0251 at $2.50/M input-or-cache-write and $10/M output; not a provider-enforced billing cap |

The runner verified the exact config digest, source hashes, audit R2 freeze, every case payload digest, and the 50/3 split before the first call. It stripped only the JSON Schema `$schema` meta-key for the provider request, following the existing application adapter pattern; the model-visible candidate projection, order, evidence, prompt, and schema constraints were otherwise frozen. Labels were joined only after observations. No raw provider response or message text was persisted in the trace.

## Result

| Layer | Observation |
| --- | ---: |
| Required in frozen B Top 10 | 38/46 |
| B-available but provenance-blocked | 13/38 |
| Grounded and safely selectable | 25/38 |
| Supervisor selected grounded required | **0/25**, versus gate ≥23/25 |
| Raw end-to-end required selected | **0/46** |
| Wording `NONE` correct | **0/13** |
| Structural non-wording empty | **3/3** |
| Model requests | 50/50 HTTP 200, provider status `completed`, returned model `gpt-6.1-sol`, service tier `default` |
| Validated selections | **0/50**; every returned judgment became `FAILED: MODEL_OUTPUT_INVALID` |
| Explicit forbidden selected | 0/12 available, but **not a meaningful rejection pass** because all model judgments were invalid |
| Seven historical forbidden regressions | None selected, but **not evaluable as successful rejections** for the same reason |
| Unlabeled selections / precision | 0 / undefined: no validated model selections |

All 27 rewrite requirements and all 19 suggest-reply requirements remained unselected. The 13 provenance-blocked occurrences were not counted as Supervisor misses. R14 and K22 required-positive assertions remain `NOT_EVALUABLE` under their frozen raw evidence. Selected-count distribution was 53 zeroes: 50 failed model observations plus three legitimate structural bypasses, not 53 successful `NONE` decisions.

The current trace distinguishes HTTP/provider completion from deterministic validation, but does not retain raw responses or a finer-grained validator-rejection code. Therefore this run establishes a **systematic output-contract failure**, not its exact clause. It does not justify prompt tuning within this configuration, claiming the seven forbidden cases passed, or moving to the untouched audit. A separately reviewed SRS-4 development configuration should first add privacy-safe validation diagnostics and resolve the contract failure on exposed development evidence; any further paid requests need separate approval.

## Usage, latency, and artifacts

- Reported usage: 167,694 input tokens and 27,102 output tokens across 50 requests.
- Conservative usage-priced estimate: **$0.690255** using the frozen $2.50/M input-or-cache-write and $10/M output rates; actual billing may differ because cache/service accounting was not available. The sum of per-request pre-call upper bounds was **$6.02512**, below the approved $8 cap.
- Aggregate request latency: 455,842 ms; maximum single request: 12,580 ms. No retry or model substitution occurred.
- Content-free [trace](../../packages/skills/tests/fixtures/srs4/development-live-v1/content-free-trace.json) SHA-256 `edf22ea5cb29d6de824d1d2624d7f9cce9b67c3913d625a7725159c105c382ea` and [metrics](../../packages/skills/tests/fixtures/srs4/development-live-v1/metrics.json) SHA-256 `18d1ec344d4ea0b59c35975f4f1320d3f42f6473af89a89c3786f54665f67ae1`.

## Validation and frozen boundaries

Pre-live focused SRS-4 tests passed (3 files, 10 tests); post-run `pnpm skills:check`, `pnpm skills:verify-production`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (50 files, 535 tests), `pnpm build`, and `git -c core.safecrlf=false diff --check` passed. The initial `pnpm format:check` found only generated metrics JSON formatting; it was mechanically formatted, and the subsequent `pnpm format:check` passed. Production verification still reports **21 exact definitions and 153 ordered plans**. The R2 audit freeze remains SHA-256 `3297a3577ed7110e01a2629e023bf2371238559543c3c49350dbc28c727fa319`; the B config and semantic profiles retain their frozen hashes. No audit or protected-challenge score exists from this run.

Stop here. Do not score A01–A64, run the protected challenge, change production, or call the provider again under this experiment ID.
