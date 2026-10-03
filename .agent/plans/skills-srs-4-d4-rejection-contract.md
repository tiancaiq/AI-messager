# SRS-4-D4 — offline rejection-evidence contract V2

Status: **complete — offline only; D5 unapproved**  
Owner: Codex  
Started: 2026-10-03  
Updated: 2026-10-03  
Roadmap milestone: SRS-4 shadow Supervisor; no SRS-5 work.

## Outcome and authority

Create and freeze a new evaluation-only Supervisor contract that distinguishes missing prerequisite support from positive contradiction and explicit objective negation. This turn authorizes **offline implementation only**: no OpenAI/provider calls, live canary, 53-case run, R2 audit scoring, protected challenge, production change, or SRS-5 work. The next separately approved live configuration should target `gpt-5.6-luna`, not the historical D3 `gpt-6.1-sol` model.

## Current state and decisions

V1's `PREREQUISITE_UNSUPPORTED` and `EXPLICITLY_NEGATED` both require a `USER_DRAFT`/`USER_HISTORY` `USER_*` factual evidence use. D3's five live outputs passed JSON/wire/candidate coverage but all failed this rejection-evidence clause. D2/V1 and D3 freezes are immutable historical inputs. V1 has `OBJECTIVE`, `CONTEXT`, and five `USER_*` evidence uses; no new evidence-use enum is needed. V2 will replace `PREREQUISITE_UNSUPPORTED` with `PREREQUISITE_NOT_ESTABLISHED` (zero refs allowed) and `PREREQUISITE_CONTRADICTED` (positive source-appropriate ref required). `EXPLICITLY_NEGATED` remains but requires `OBJECTIVE` evidence from USER_DRAFT, relevant USER_HISTORY, or SELECTED_GOAL. `INSUFFICIENT_EVIDENCE` and `NO_MATERIAL_JOB` remain and may have zero refs. SELECT rules, budget, exact candidate coverage, evidence ownership and relation checks stay strict.

## Scope, contracts, and privacy

Add V2 private schema, validator, prompt and diagnostic under `packages/skills/tests/srs4-*-v2.ts`; reuse the frozen V1 input serializer and neutral B Top-10 projection rather than changing them. Make the V2 validator the single acceptance authority and have V2 diagnostics expose only versioned closed stages/codes/counts derived from the same validation pass. Provide deterministic synthetic canonical judgments and negative tests, a V1→V2 report, and a new SHA-256 freeze binding V1/D2/D3 history, V2 source/schema/test fixtures, B config/profiles and R2 audit freeze. No raw provider output, message text, draft, goal, prompt payload, secret, or hidden reasoning goes into diagnostic artifacts. No provider adapter is changed or invoked.

For hard input bounds, the unchanged serializer returns `INPUT_TOO_LARGE`/FAILED; V2 must not silently truncate. Within a complete bounded input, absence of a visible prerequisite permits `PREREQUISITE_NOT_ESTABLISHED` without claiming the event never happened. If source uncertainty prevents a reliable applicability decision, `INSUFFICIENT_EVIDENCE` is available. `PREREQUISITE_CONTRADICTED` requires positive evidence; OTHER context may establish an OTHER-reported closure but not a USER-owned fact. UNKNOWN does not establish contradiction.

## Implementation and tests

1. Inspect V1 reason schema, wire schema, validator, prompt and D2 stages; record actual vocabulary mapping before code changes.
2. Add V2 Zod-first wire and selection schemas, prompt, validator, and versioned diagnostic. Reuse V1 serializer/projection and preserve strict SELECT/ownership/fact gates.
3. Add five canonical valid fake judgment families (single, NONE, multi, provenance-blocked, objective negation), each materialized over ten candidates, plus focused negative tests for contradiction/negation evidence, ownership, grounding, coverage, polarity, budget, relation and status invariants.
4. Add a deterministic D4 freeze, regenerate twice byte-identically, and write a concise contract-diff report plus future D5 Luna recommendation. No live configuration or model call is made.

## Acceptance and validation

Offline acceptance requires all canonical fixtures valid under V2, all negative regressions invalid, the V1/D2/D3 hashes unchanged, B/profiles/R2 unchanged, 21 production definitions/153 plans unchanged, audit unscored and challenge untouched. Run focused D4 and V1/D2/D3 tests, `pnpm skills:check`, `pnpm skills:verify-production`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm format:check`, and `git -c core.safecrlf=false diff --check`.

## Risks, rollback, and limitations

Deterministic checks can verify sources, evidence-use categories and reference membership, not semantic entailment. A model could still mislabel unrelated evidence as contradiction; a separately approved live canary and semantic review are needed. Keep V2 files isolated so rollback excludes them without touching V1/D2/D3. A future D5 canary needs its own frozen `gpt-5.6-luna` configuration, support check and spend authorization.

## Progress and completion

- [x] 2026-10-03: Read D4 brief, repository product/privacy/plan boundaries, V1 reason/wire/validator and D3 report. Official OpenAI documentation lists `gpt-5.6-luna` as Responses and Structured Outputs capable; no provider call was made.
- [x] Implement and test V2 contract/diagnostic. Six canonical ten-candidate judgments and negative regressions pass; V1/D2/D3 regressions remain green.
- [x] Freeze V2 evidence (`beb27af30f72d99fd1c04879e4a5fd1d3957cac795253a696eed45a5a741afb7`), validate full repository (56 files/548 tests; 21 production definitions/153 plans), and report in `docs/skills/srs-4-d4-rejection-evidence-contract.md`. No provider call; stop before D5.
