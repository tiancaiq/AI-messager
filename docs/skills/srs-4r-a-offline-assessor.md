# SRS-4R-A — Offline Skill Assessor completion

Status: **offline contract complete; live quality and independence untested**  
Date: 2026-10-03  
Branch/worktree: `skills` / `AI messager-skills`

## Outcome

SRS-4R-A now has an evaluation-only, candidate-local `SkillAssessment` contract and deterministic validator. Each Top-10 atomic candidate can independently return `CORE`, `SUPPORTING`, `UNSUPPORTED`, or `UNCERTAIN`, with bounded source-attributed evidence and closed reason codes. This increment does **not** choose a final skill set. There is no production import, provider adapter, live request, audit score, protected-challenge run, or SRS-4R-B optimizer.

`SUPPORTING` means the candidate's **own** communication job makes a material secondary contribution when considered alone. It is neither low confidence nor a claim that another skill was selected. The planned B optimizer gives no utility to an extra `SUPPORTING` row merely because it exists; distinct marginal contribution must be demonstrated. B remains unimplemented.

## Offline artifacts and checks

| Artifact | Purpose |
| --- | --- |
| `packages/skills/tests/srs4r-assessment.ts` | Zod wire schemas, candidate-local validator, sanitized failures, fake judge, batch/singleton observation. |
| `packages/skills/tests/srs4r-assessor-prompt.ts` | Bounded, label-free candidate-local batch and singleton payload drafts; no provider call. |
| `packages/skills/tests/srs4r-assessment-diagnostic.ts` | Content-free output-contract diagnostics. |
| `packages/skills/tests/srs4r-independence.ts` | Mandatory ID-order/reverse-order/singleton comparison with fail-closed live status. |
| `packages/skills/tests/srs4r-development.ts` | Raw-only observations and later label-joined assessor metrics; no final-set scoring. |
| `packages/skills/tests/fixtures/srs4r/assessor-independence-plan-v1.json` | Eight predeclared exposed cases and three views. |
| `packages/skills/tests/fixtures/srs4r/assessor-offline-freeze-v1.json` | Immutable offline source, schema, prompt and gate binding. |

The offline fake judge yielded 160/160 candidate-view comparisons with matching applicability in the eight predeclared cases. This checks the comparison machinery **only**. The gate is still `NOT_RUN` because no paired live singleton/batch experiment has been authorized. A future `FAIL` or `NOT_RUN` cannot be called a batch-independence pass.

The 53 exposed development cases were exercised with a deliberately all-`UNSUPPORTED` fake judge to test label isolation and accounting, **not** to measure model quality. Accounting remained 46 required → 38 B Top-10 → 13 provenance-blocked → 25 grounded/available. The fake's 0/25 supported required is not an assessor result. The R2 64-case audit remains UNSCORED; the protected challenge was not read or run.

The freeze binds the unchanged V1 serializer, D4 freeze, SRS-3F-B config/trace, semantic profiles, exposed raw/annotations/control raw, R2 freeze, and all new A contract/prompt/test files. SHA-256: `76cab0f8b3391c132b17bd5e1c53ff6f4447a168f26f7e9398d33049516cdfc0`. Two renders matched byte-for-byte. Historical D4, B and R2 digests were checked before rendering.

## Validation

| Command | Result |
| --- | --- |
| `node --conditions=development --import tsx scripts/freeze-srs4r-a.ts --check` | PASS; freeze digest above. |
| `pnpm lint` (includes `skills:check`) | PASS after fixing one unused import. |
| `pnpm typecheck` | PASS, all workspace projects. |
| `pnpm test` | PASS, 58 files / 555 tests, including new A/freeze tests. |
| `pnpm build` | PASS, all workspace projects. |
| `pnpm skills:verify-production` | PASS: 21 exact production definitions, 153 ordered plans, public exports, deep-freeze and authoring exclusion. |
| `pnpm format:check` | PASS after final formatting. |
| `git -c core.safecrlf=false diff --check` | PASS after final documentation update. |

## Boundaries and next decision

The validator proves structural source/ref membership, owner category, exact candidate IDs/revisions, and fact-gated USER-source presence; it cannot prove semantic entailment. No real assessor quality, ownership error rate, required support recall, forbidden rejection, or batch cross-talk rate has been measured. The mandatory paired live gate remains `NOT_RUN`.

Stop here. A later live exposed-development experiment would require separate provider/key/privacy/spend approval and a frozen model/config, then a real singleton-vs-batch independence result before accepting batch transport. SRS-4R-B, the R2 audit, protected challenge, SRS-5 and production remain outside this approval.
