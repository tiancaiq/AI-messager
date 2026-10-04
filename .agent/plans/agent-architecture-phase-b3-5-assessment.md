# Agent architecture Phase B3.5 — human-reviewed assessment corrections

Status: complete; full human signoff received
Owner: Codex
Started: 2026-10-04
Updated: 2026-10-04
Roadmap milestone: Phase B3.5 validation follow-up in `docs/roadmap.md`

## Outcome

Resolve the four `FIX_ASSESSMENT` cases approved by the human reviewer, then rerun all 33 synthetic pipeline cases and full deterministic gates before B3.5 signoff. Preserve the existing production-authoritative flat selector and Composer path.

## Scope

In scope: narrow Agent-side shadow context/evidence refinement, case-specific and counterexample tests, comparison report and review record. Out of scope: approved Skill catalog or contracts changes, production selector changes, Composer A/B, B4/B5 implementation, provider calls, memory, IPC, UI, persistence or analytics.

## Current state

The B3 freeze is `fed2d0f3c1d7134b6ca8ceade1bbf22e319cb342`. The approved Skill baseline is `dcc52eb15b578a4dbc65e4c74b64dbf9806cc899`, runtime SHA-256 `d3bd95cd2fe91c999f0331e25c4f68438954ed21804d43f35616a7f7239497ca`, snapshot `approved-fnv128:f292695be12e86102468e1fa9f7d27f5`. The previous B3.5 correction is still uncommitted. `packages/ai/src/skill-context.ts` derives production tags; `skill-shadow-context.ts` is the shadow-only refinement seam; the test harness mirrors that seam. Current 33-case comparison is 27 `MATCH`, four order-only `EXPECTED_DIFFERENCE`, and two reviewer-directed `POTENTIAL_REGRESSION` labels. Three planning/availability cases lack an uncertainty/expectation tag, and a repair-only review event falsely receives a status tag.

## Assumptions and decisions

1. Human dispositions are authoritative: 13 `ACCEPT`, one `ACCEPT` with tone-path caveat, four `FIX_ASSESSMENT`, plus the three priority cases previously reviewed. The four fixes are not yet signed off.
2. Explicit tentative future timing, availability or completion in user-owned draft/selection may support `set_expectation`; planning/availability context must be grounded in visible communication, not an inferred promise. Keep tentative language tentative. Under cap pressure, expectation guidance outranks an incidental style slot using the existing selector priority policy.
3. A past review event alone is not a progress/status update. Remove false status tags only where neither the other person's message nor user-owned current text supplies status/progress semantics. Preserve genuine review-progress requests and statements.
4. Keep the correction in the Agent-side shadow projection. Do not mutate the canonical registry, static skill guidance, production context derivation, or Skill System authority.

## Contracts and data flow

No schema change. Validated `CommunicationProblem` and legacy `SkillContext` enter `refineShadowSkillContext`; bounded shadow tags then enter the existing `projectSkillEvidence` → `SkillAssessmentPort` → selector → compiler pipeline. Raw text remains Agent-side and request-local. Structural traces contain only bounded codes, references and counts; no raw conversation, draft, provider payload or full findings are persisted or logged. The existing user instruction path to Composer stays independent of zero-skill selection.

## Implementation steps

1. Add focused synthetic tests for tentative timing/availability, true versus false review status, negated/quoted uncertainty, and the four approved cases.
2. Refine `packages/ai/src/skill-shadow-context.ts` narrowly; avoid duplicate catalog metadata or provider inference.
3. Rerun all 33 cases, inspect every new/legacy difference, and revise `docs/agent-skill-pipeline-validation.md` and `docs/agent-skill-pipeline-human-review.md` with current outcomes and remaining caveats.
4. Run the full deterministic quality gates. Record results and stop for B3.5 full-signoff decision before any B4 implementation.

## Tests and evaluation

Test exact selected IDs for all four corrected cases, uncertainty avoidance, style displacement under four-skill cap, genuine review-progress preservation, and no false repair status. Recheck the three earlier priority cases, all frozen/adversarial fixtures, deterministic ordering/catalog variation, evidence bounds, and production isolation. No live-provider or Composer test in B3.5.

## Acceptance criteria

- [x] All 21 expertise cases carry a human disposition; the four corrected outcomes received post-fix full human signoff.
- [x] Three tentative timing/availability cases select approved `expectation_setting` with uncertainty-preserving avoidance; no promise is invented by SkillPlan.
- [x] Repair-only review event no longer selects `status_update`; genuine review-progress examples retain it.
- [x] All 33 B3.5 cases rerun with every difference explained and no new authority/safety regression.
- [x] Three earlier reviewed priority cases remain correct; sparse `nicer` still selects zero skills. Its explicit tone-path caveat is documented for later Composer integration, not implemented in B3.5.
- [x] Full tests, lint, typecheck, build, Phase 4 evaluation, Windows-safe format and whitespace gates pass; production selector and Composer inputs remain unchanged.

## Validation commands

Use direct `vitest run` focused and full, `eslint . --max-warnings 0`, package/API and B3.5-harness `tsc -p`, package/API and desktop builds, `node scripts/evaluate-phase-4.mjs`, `tsx scripts/evaluate-skill-pipeline.ts --review`, `prettier --check . --end-of-line auto`, `git diff --check`, and a whitespace check for untracked files. Inspect `git ls-files --eol` for touched tracked files as needed; repository/index LF policy remains unchanged.

## Risks, rollback, and limitations

Deterministic language patterns can under- or over-tag unsupported paraphrases; conservative abstention is preferable to invented commitment. A catalog revision requires fingerprint revalidation. Rollback removes only the post-B3 shadow corrections. B3.5 structural quality cannot prove final Composer wording; B4 owns that evaluation. No production cutover is authorized.

## Progress log

- 2026-10-04: Read the human dispositions, inspected the existing B3.5 plan, shadow projection, fixture harness, selector and tests, and recorded this narrow correction plan before implementation.
- 2026-10-04: Added narrow tentative-expectation and review-status refinements in the Agent-side shadow context only, plus positive/negative counterexamples. The first focused run failed in exactly the three intended old-behavior assertions. After correction, the focused B3.5 harness passed 11/11, and the production-isolation plus harness subset passed 36/36.
- 2026-10-04: All 33 fixtures reran: 24 `MATCH`, three order-only `EXPECTED_DIFFERENCE`, one `POTENTIAL_IMPROVEMENT`, five conservative `POTENTIAL_REGRESSION`, zero `NOT_COMPARABLE`. Each difference is documented in the comparison report. The three earlier human-priority cases still pass.
- 2026-10-04: Full deterministic suite passed 46 files / 307 tests; ESLint, seven TypeScript checks (six workspace plus B3.5 harness), five package/API builds, desktop main/native staging/preload/renderer builds, Phase 4 evaluation 21/21, Windows-safe Prettier, `git diff --check`, and untracked trailing-whitespace scan passed. A first renderer build from the repository root failed to find `index.html`; rerunning the canonical steps from `apps/desktop` passed. The tracked index remains LF (`git ls-files --eol`); no unrelated files were normalized. No provider call was made.
- 2026-10-04: The human reviewer explicitly confirmed **B3.5 FULL SIGNOFF** after seeing the corrected outcomes and gate results. Freeze commit/tag is the next step; B4 remains a separate milestone.

## Completion record

Implementation, deterministic verification, and full human signoff are complete. The shadow path now includes approved expectation guidance for three tentative timing/availability cases, and omits unsupported status guidance for the repair-only review event; genuine review-progress counterexamples retain status guidance. Production remains unchanged. The B3.5 freeze commit/tag will be recorded separately; B4 requires its own plan and cannot change production authority.
