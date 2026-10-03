# SRS-4-D2 — offline Supervisor output-contract diagnostic

Status: **complete — offline only; live canary requires separate approval**  
Owner: Codex  
Started: 2026-10-02  
Updated: 2026-10-02  
Roadmap: SRS-4 shadow Supervisor, after the failed [DEV-LIVE-1](../../docs/skills/srs-4-live-development.md); no SRS-5 work.

## Outcome and scope

Produce a content-free, closed-stage explanation for every future SRS-4 `MODEL_OUTPUT_INVALID` observation and prove the existing contract is satisfiable offline. Do not call a provider, alter prompts/schema/validator acceptance, score the 64-case R2 audit, inspect the protected challenge, retune retrieval, or change production. The next model direction remains `gpt-5.6-luna`, but D2 performs no model experiment.

## Current state and decisions

`packages/skills/tests/srs4-supervisor.ts` owns the V1 wire schema, post-validator, and fake judge. `scripts/evaluate-srs4-development-live.ts` owns the completed V1 provider path. The V1 config binds those source bytes; editing either would invalidate historical replay. D2 therefore adds an evaluation-only diagnostic wrapper that mirrors each existing validation clause, invokes the original validator as the final authority, and asserts valid/invalid parity. It never persists the returned object or input evidence. A separate pure provider-envelope classifier distinguishes missing output and JSON parse failures from wire/application failures. The V1 raw responses were intentionally not retained; exact per-case clauses are not recoverable.

## Contracts and data flow

Provider envelope or fake output (transient) → output presence/JSON parse stage → existing `WireJudgmentSchema` → closed application-stage checks → original `validateSupervisorJudgment` parity check → content-free diagnostic `{firstFailedStage, failureCodes, numeric counts}`. Successful fake selection remains the original `SkillSelection`. The diagnostic object contains no conversation text, prompt, provider response, or free-form error message.

## Implementation and acceptance

1. Add private D2 diagnostic stages/codes and schema, with deterministic first-failure order and all applicable closed codes for that stage. Keep the V1 validator and runner unmodified.
2. Add synthetic tests for a fully valid 10-candidate judgment and each major invalid clause, including provider/parse, schema, candidate coverage, reasons, evidence, ownership, grounding, selection budget, and relationship constraints. Assert parity with the V1 validator for all wire objects that reach it.
3. Add a schema-vs-validator gap report and a privacy-safe V1 forensic finding. Never assert a per-case V1 cause absent persisted evidence.
4. Freeze a new `SRS-4-OUTPUT-CONTRACT-DIAG-1` binding to the V1 validator, wire schema, serializer/prompt/projection, diagnostic source/stages/codes and fixture, B config, semantic profiles, and R2 audit freeze. Regenerate twice byte-identically.
5. Run focused and full checks: `pnpm skills:check`, `pnpm skills:verify-production`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm format:check`, and `git -c core.safecrlf=false diff --check`.

Acceptance requires the valid fixture to pass the original validator, each invalid fixture to fail at the intended closed stage/code, no diagnostic leakage, V1 hashes unchanged, 21 ACTIVE production definitions and 153 plans unchanged, and the audit/challenge unscored. Stop after offline completion. A later 3–5 case exposed-development canary requires a new experiment ID and separate spend approval.

## Risks and rollback

Mirroring the validator may drift. The wrapper must check final parity and tests must cover every current branch; a mismatch is a diagnostic failure, not permission to relax acceptance. Keep D2 under evaluation-only files so rollback removes only the wrapper, tests, fixture and report. The V1 run and production are untouched.

## Progress and completion

- [x] 2026-10-02: Read repository boundaries and V1 validator/runner. V1 trace can establish output-text presence and JSON parse success through the recorded failure path, but not the rejected clause.
- [x] 2026-10-02: Implemented a separate 17-stage/32-code diagnostic wrapper and static fully valid 10-candidate fake judgment. Six focused D2 tests and V1 regression tests pass; the V1 validator/prompt/schema and live runner source remain unchanged.
- [x] 2026-10-02: Documented the schema-versus-validator gaps and V1 forensic limit. Froze `SRS-4-OUTPUT-CONTRACT-DIAG-1` twice byte-identically, SHA-256 `504503dc937f425d090dfab231f6919379b2a1d70a4d3747911ab7a712c5b540`.
- [x] 2026-10-02: Focused SRS-4 tests 15/15; full `pnpm test` 542/542; `pnpm skills:check`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm skills:verify-production` (21 definitions, 153 plans), `pnpm format:check`, `git -c core.safecrlf=false diff --check`, and D2 freeze `--check` passed. No provider call or audit/challenge evaluation.

## Completion record

Acceptance criteria pass offline. The diagnostic is a wrapper around, not a replacement for, the V1 validator. The only V1 narrowing supported by stored evidence is provider completion plus output text and JSON parse success; the exact 50 rejected clauses remain `NOT_RECOVERABLE_FROM_V1_TRACE`. A separate 3–5-case exposed-development canary with a newly frozen `gpt-5.6-luna` configuration, this diagnostic, and explicit spend approval is the next possible step; do not run it under this milestone.
