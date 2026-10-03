# SRS-4-D3 — five-case live output-contract canary

Status: **complete — live contract canary FAIL, 0/5 valid; hard stop reached**  
Owner: Codex  
Started: 2026-10-03  
Updated: 2026-10-03  
Roadmap milestone: SRS-4 shadow Supervisor; no SRS-5 work.

## Outcome and authority

Determine whether the existing V1 Supervisor configuration can produce contract-valid live outputs on exactly five existing exposed-development cases. This is output-contract diagnosis, not Supervisor-quality evaluation. The user approved up to $1 total on 2026-10-03 for this new five-request canary. The new D3 brief explicitly keeps `gpt-6.1-sol`/medium for controlled comparison with V1, superseding the earlier lighter-model direction for this experiment only. The earlier $8 V1 approval is not reused.

## Scope and current state

The frozen V1 run was 50/50 HTTP 200/completed and 50/50 `MODEL_OUTPUT_INVALID`; its trace cannot identify the failing clause. D2 adds a 17-stage, content-free diagnostic wrapper around the unchanged V1 validator and has offline PASS. The R2 audit is unscored, the protected challenge untouched, and production unchanged. V1 and D2 artifacts are immutable inputs. This work creates only evaluation-side D3 config, runner, tests, trace/metrics, validation record, and report. No retrieval, profiles, prompt, schema, validator, provider model, production or audit changes.

## Assumptions, contracts, and privacy

Use the previously user-approved existing ignored worktree `OPENAI_API_KEY`, without displaying or persisting it. The approved budget is an estimated cap, not provider-enforced. Request body remains V1 Responses API, `gpt-6.1-sol`, medium reasoning, identical system instructions, JSON schema, candidate ordering, `store:false`, no tools, 8192 max output tokens, 60-second timeout, zero automatic retries. Keep the five cases in order R06, R10, R14, R26, R13. Bind exact raw revisions, payload bytes/digests, V1 and D2 source/contract digests, B, profiles and R2 freeze before request 1; abort on drift.

Provider response, request payload, raw message/draft/goal text, secret, hidden reasoning and free-form errors remain transient and are never written or printed. Persist only safe IDs, enums, booleans, numeric counts, usage, latency, conservative cost, and digests. D2 determines first-failure stage/codes; the unchanged V1 validator remains final acceptance authority. Treat a failure as failure, not `NONE`; do not retry or tune between calls.

## Implementation and evaluation steps

1. Add a deterministic D3 config builder/freezer using V1 settings and exactly five exposed-development bindings. Verify all historical hashes and case payloads before writing the config. Regenerate twice byte-identically.
2. Add a new opt-in canary runner with exact `--live` and `--approved-cap-usd=1` flags, a preflight gate over all five payloads/dependencies, and per-call upper-bound budget reservation. Never invoke the V1 50-case runner.
3. Send exactly one request per case unless a fatal provider/credential/model drift or cost guard requires an early stop. Record content-free D2 diagnostics, V1 result, usage/latency/cost; write a new immutable D3 artifact directory only, including SHA-256 bindings.
4. Aggregate fully valid/5, first-stage and code counts. Report secondary selected IDs only for validator-valid cases, not quality metrics. Stop after the canary; no 53-case rerun, audit scoring, protected challenge, model switch or production change.

## Acceptance and validation

The canary is complete when the five exact frozen cases use a single configuration, intended calls have no retries, artifacts contain no sensitive text or raw responses, each observation separates HTTP/completion/parse/wire/application/V1 acceptance, and the report gives the contract-validity verdict (READY 5/5; PARTIAL 1–4/5; FAIL 0/5). A fatal preflight or provider boundary failure is an explicit incomplete run, never silently scored as five.

Run focused SRS-4/D2 tests, `pnpm skills:check`, `pnpm skills:verify-production`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm format:check`, and `git -c core.safecrlf=false diff --check`. Verify 21 definitions/153 plans and frozen B/profiles/R2/D2/V1 digests.

## Risks and rollback

Network or provider errors may leave an incomplete sample; preserve each one-shot observation and stop on fatal model/credential/budget drift. Token-envelope cost is conservative but not a hard provider limit; the runner checks estimated worst-case spend before every request and stops on exceeded actual usage. D3 files are separate and can be excluded without changing V1, D2 or production.

## Progress and completion

- [x] 2026-10-03: Read the D3 authorization, repository boundaries and prior V1/D2 artifacts. Confirmed branch `skills`, existing ignored credential presence, five V1 payload bindings, and estimated five-call worst-case cost $0.601585 under the prior standard-rate method. User separately approved up to $1.
- [x] 2026-10-03: Froze and twice reproduced the config, SHA-256 `7d64661ccd0a1b35dc249ae890708c2ea9487cf8aa5f9002ca80f0639eec4e95`. Exact R06/R10/R14/R26/R13 revisions and five payload digests match V1; D2 freeze check passed.
- [x] 2026-10-03: Ran exactly five one-shot Responses requests, with no retries or configuration changes. All were HTTP 200/completed, returned `gpt-6.1-sol`, parsed as JSON and passed wire schema/candidate coverage. D2/V1 found 0/5 valid; all first failed at `NEGATION_PREREQUISITE_EVIDENCE_VALID`. Trace SHA-256 `34f2ba762019bddb6946abc25ab0b3fb458f690266a09ce874df1b6f1d5b6bb7`.
- [x] 2026-10-03: Added an artifact-integrity/privacy test and [report](../../docs/skills/srs-4-d3-live-output-contract-canary.md). Focused SRS-4/D2/D3 tests: 5 files/16 tests passed. `pnpm skills:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (54 files/544 tests), `pnpm build`, `pnpm skills:verify-production` (21 exact definitions/153 plans), `pnpm format:check`, `git -c core.safecrlf=false diff --check`, D2 freeze `--check`, and two D3 config `--check` runs passed. Generated hash-bound D3 JSON was specifically excluded from automatic formatting to preserve its immutable bytes.

## Completion record

The canary answered its narrow question: live outputs reached the request-specific validator but did not satisfy its rejection evidence-use rule. No candidate omission or wire-schema failure was observed. `PREREQUISITE_EVIDENCE_INVALID` occurred in all five cases and `NEGATION_EVIDENCE_INVALID` in three. Known usage was 16,692 input / 2,638 output tokens, about $0.068110 using the conservative published cache-write input rate for all input, with a $0.601585 reserved envelope under the $1 approval. Measured total latency was 49,466 ms. The result is **FAIL**, not a Supervisor-quality score or a retroactive attribution of V1's 50 cases. Next recommended work is an independent contract/prompt review under a separately approved experiment; no additional provider request, audit, challenge, SRS-5 or production work is authorized here.
