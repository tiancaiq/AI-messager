# SRS-4R-A — One-shot live exposed-development proof

Status: complete — one-shot proof failed at reverse-order validation  
Owner: Codex  
Started: 2026-10-03  
Roadmap milestone: evaluation-only SRS-4R-A, after [offline freeze](../../docs/skills/srs-4r-a-offline-assessor.md)

## Outcome and approval

Test whether the frozen candidate-local assessor, using the user's preferred `gpt-5.6-luna`, (1) makes correct individual skill-applicability judgments on the existing 53 exposed development cases and (2) gives materially identical assessments when the same eight predeclared cases are presented as ID-order batches, reverse-order batches, and ten singleton calls. The user approved a **$2 total cap and at most 138 requests** on 2026-10-03. Reuse the already chosen existing `OPENAI_API_KEY` from ignored `.env.local`; never print or persist it.

This approval is for exposed-development proof only. Keep R2 64-case audit UNSCORED, protected challenge untouched, SRS-4R-B unimplemented, and production unchanged. Preserve SRS-3F-B FAIL and all previous SRS-4 history.

## Frozen inputs and design

- Bind the byte-frozen SRS-4R-A offline artifact SHA-256 `76cab0f8b3391c132b17bd5e1c53ff6f4447a168f26f7e9398d33049516cdfc0`, the 53-case B exposed trace, semantic profiles, raw/annotation sources, candidate-local prompt/schema and evaluator code. Verify source digests before any call.
- Fixed model `gpt-5.6-luna`, Responses API, `store:false`, `reasoning.effort:"low"`, zero automatic retries, 45-second timeout, max 8,192 output tokens for batches and 1,024 for singletons. A strict structured-output schema is used, followed by application Zod/grounding validation. No fallback model or prompt repair within this experiment.
- Request topology: direct TLS from the trusted local evaluation process to the provider. Only synthetic exposed-development text and bounded skill profiles are transmitted. Do not log or persist raw drafts, prompts, full responses or secrets. Persist skill IDs, evidence refs, closed codes, statuses, token counts and costs only.
- The eight fixed independence cases are `R06`, `R10`, `R14`, `R19`, `R24`, `R26`, `K21`, and `K22` per the offline independence plan. For each, run ID-order batch, reverse-order batch and ten singleton assessments. The eight ID-order batches count toward the 50 wording-case development batches: 8 + 8 + 80 + 42 = **138 maximum requests**; three structural cases are local bypasses.
- Reserve an upper cost bound *before* every request from UTF-8 payload bytes plus 1,024 overhead tokens and the configured maximum output tokens at [published GPT-5.6 Luna standard text rates](https://developers.openai.com/api/docs/models/gpt-5.6-luna). Stop before any request that could cross $2. Count timed-out/unknown-usage calls at their full reserved bound. Record actual usage separately and never claim a lower hard bound from missing usage.

## Gates and stop rules (predeclared)

1. **Contract canary:** The first ID-order batch must return the exact requested model and a complete valid ten-row assessment. On authentication/model/schema/transport error or invalid assessment, stop and preserve a content-free failure trace; do not tune and rerun under this experiment ID.
2. **Mandatory independence:** All eight cases and 160 candidate-view comparisons must validate. Require 100% exact applicability-category agreement and zero supported-vs-nonsupported flips. Report reason-code agreement separately. If failed, batch transport is not accepted; stop before the remaining 42 batches.
3. **Individual quality on full development, only if gate 2 passes:** required support ≥23/25 grounded B-available occurrences; explicit forbidden falsely supported 0/12 including seven known regressions; wording `NONE` with no supported candidate 13/13; all 12 skills with grounded required positives supported at least once; zero confirmed ownership/intent-critical false support. Report CORE/SUPPORTING separately, by skill/action, uncertain rate, invalid-output rate, retrieval 38/46 and provenance 13/38. Unlabeled candidates remain unlabeled, not errors by default. The R14/K22 goal-only positives stay NOT_EVALUABLE; check ownership safety and forbidden rejection.
4. **Failure attribution:** Model/app-validation failure is `FAILED`, never `NONE`. A failed independence or quality gate is a real FAIL, not a reason to modify the frozen prompt, labels, audit, retrieval or production in this run.

## Implementation and validation

1. Create a deterministic live config freezer with exact source/payload hashes and preflight cost envelope; write once before calling the provider.
2. Add a private opt-in live evaluator with `--live --approved-cap-usd=2`, direct API call, no retries, runtime budget guard, content-free incremental trace and partial-run persistence.
3. Unit-test the budget guard, config binding, gate completeness, and no-call default. Run focused and canonical repository checks before the first request.
4. Execute the one-shot run, inspect the returned closed assessments against exposed labels and semantic boundaries, and write a concise report. Stop even on PASS; do not begin B or score audit.

## Risk, rollback and completion record

API account access and model output quality are unknown until the first request. Schema rejection, output truncation, semantic errors, and batch cross-talk are legitimate negative results. A $2 cap limits spend, not all provider-side retention; `store:false` is set but production privacy review remains separate. No production code is changed. Generated live observations can be removed from evaluation tooling without altering runtime; preserve evidence of any failed one-shot run for review.

- [x] 2026-10-03: User approved up to $2 and 138 exposed-only requests; existing key reuse was chosen previously. Official model page confirms Responses and Structured Outputs support and lists $0.20/M input, $1.20/M output standard text prices.
- [x] 2026-10-03: Froze exact config SHA-256 `1fa4019d91e53c5d0746f99f91614ecbfa2e40b16324f48504ef2e1ba537db2e`; the 138-request conservative upper bound was $0.9868192. Focused tests, lint, typecheck, 557-test suite, build, production parity, formatting and freeze check passed before live use.
- [x] 2026-10-03: Ran the one-shot proof and stopped after two calls. The ID-order R06 batch was valid; its reverse-order batch failed application validation with `EXPLICIT_NEGATION_EVIDENCE_INVALID`. The mandatory 8-case independence gate remains `NOT_RUN`, and no full 53-case quality result exists. Known billed cost $0.00317; conservative reserved upper bound $0.027026. No retry or prompt repair under this experiment ID.
- [x] 2026-10-03: Reviewed content-free evidence and recorded a **FAIL: individual correctness and independence are not proven**. See [live-proof report](../../docs/skills/srs-4r-a-live-proof-v1.md). Stop before B, audit, challenge or production.
