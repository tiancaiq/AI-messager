# Agent architecture Phase B3.5 — reviewer-directed selection remediation

Status: complete; B3.5 quality signoff remains separate
Owner: Codex
Started: 2026-10-04
Updated: 2026-10-04
Roadmap milestone: Phase B3.5 validation follow-up in `docs/roadmap.md`

## Outcome and scope

Correct two human-reviewed Skill selection defects before B3.5 signoff: disagreement must not be treated as refusal without refusal evidence, and under four-skill-cap pressure meaning/commitment/status guidance must outrank incidental style and redundant repair guidance. Accept the Traditional Chinese `request` match as secondary only, without allowing it to displace a stronger boundary/refusal function. Rerun all 33 B3.5 cases and repository gates.

This is a narrow correction to the existing shadow-only Agent–Skill pipeline. The production flat selector, Composer input, provider-call count, user-visible result, approved registry, and B3 freeze remain unchanged. No B4/B5, model-assisted Skill behavior, new metadata contract, specialist runtime, or cutover is included.

## Current state

The frozen B3 commit is `fed2d0f3c1d7134b6ca8ceade1bbf22e319cb342`; the Skills committed baseline is `dcc52eb15b578a4dbc65e4c74b64dbf9806cc899`; the approved catalog snapshot is `approved-fnv128:f292695be12e86102468e1fa9f7d27f5`. B3.5 test/evaluation files and reports are uncommitted review work. The production `deriveSkillContext` tags a broad “don't want to” phrase as `decline`, including “don't want to argue.” The B2 shadow selector then ranks eligible skills by independent metadata scores plus a signal match and applies a four-skill cap. Both paths presently match structurally in 33/33 synthetic cases, which did not establish relevance.

## Assumptions and decisions

1. The user's latest review authorizes correcting B3.5 selection behavior, but not making the shadow SkillPlan authoritative. Keep the legacy production context/selector unchanged; divergence is expected and must be reported, not hidden as a regression.
2. Agent-side normalization may inspect the bounded request-local meaning-to-preserve text to determine whether a `decline` tag is warranted. The Skill System still receives only bounded structural evidence and tags. A conservative explicit-refusal recognizer may underselect on ambiguous wording; it must not fabricate refusal from disagreement, emotion avoidance, or a negated decline.
3. Cap ranking uses the existing validated intent and language metadata, not skill IDs, file paths, name prefixes, fixed catalog count, or a second registry. Explicit `set_expectation`/`provide_status` meaning carries top priority; other core matched intents outrank generic language style. A repair-function overlap penalty applies when `apologize` and `acknowledge_mistake` compete for scarce slots. An explicit request that expresses a boundary is supporting, not co-primary. Hard eligibility and conflict rules remain unchanged.
4. The new policy applies when eligible candidates exceed `maxSkills`; otherwise keep established deterministic ordering. This minimizes unrelated movement. Existing fixture expectations remain the review oracle, but any explained new-vs-legacy difference must be categorized and audited.

## Contracts, data flow and privacy

No shared schema changes. `CommunicationProblem` plus the existing `SkillContext` yield a shadow-only refined context before `projectSkillEvidence`, assessment, selection and compilation. `packages/skills` sees only approved source-attributed `SkillEvidence` and the refined tags. The selector's cap-aware ranking chooses from the same validated snapshot and returns the existing strict `SkillSelectionResult`. No raw text enters structural traces, persistence, analytics, or provider calls.

## Implementation steps

1. Add shadow-only context refinement in `packages/ai/src/`, called by `skill-shadow.ts` and the B3.5 harness; add focused refusal/disagreement/negation tests. Do not modify the legacy `deriveSkillContext` production result.
2. Add deterministic cap-aware marginal ranking in `packages/skills/src/evidence-aware-selector.ts` using existing intent/language metadata and conflict filtering. Add selector tests for meaning priority, repair redundancy, boundary-request hierarchy, stable ordering, and catalog-order independence.
3. Update B3.5 adversarial assertions so the two rejected selections fail before correction and pass after it. Regenerate all 33 comparison categories and review output. Record every non-MATCH structural reason, expected improvement, and any unexpected regression.
4. Update B3.5 report, human-review dispositions, README/roadmap and completion record. Run focused/full tests, lint, typecheck, package/desktop builds, Phase 4 evaluation, formatting and whitespace gates. Stop before any cutover.

## Acceptance criteria

- [x] `disagree-relationship` retains disagreement/de-escalation/clarification evidence but does not select `decline@1`; explicit refusals and negated refusals behave correctly.
- [x] `cap-pressure-multi-need` selects `status_update@1` and `expectation_setting@1` under four slots, excludes incidental style, and does not spend both repair slots while a distinct supported function is displaced.
- [x] `chinese-boundary-traditional` keeps boundary/refusal primary; `request@1` remains eligible as supporting and cannot outrank a stronger core function under cap pressure.
- [x] All 33 B3.5 cases rerun; every structural difference is explained, and no unexpected safety/authority/eligibility regression remains.
- [x] Fixed action, intent, unknown provenance, exact active catalog references, evidence citation, conflicts, language/action eligibility, cap, `NONE`/`FAILED`, compilation identity/bounds and content-free trace remain valid.
- [x] Production flat selector, Composer guidance, provider-call count and user-visible result are unchanged; no catalog or shared-contract mutation.
- [x] Focused/full tests, lint, typecheck, package/desktop builds, Phase 4 evaluation, Windows-safe formatting and whitespace checks pass, with the documented Windows checkout exception.

## Validation commands

Run direct `vitest run` focused and full; `eslint . --max-warnings 0`; package/API plus B3.5 test-harness `tsc -p`; package/API build `tsc -p .../tsconfig.build.json`; desktop main/preload/renderer Vite builds; `node scripts/evaluate-phase-4.mjs`; `tsx scripts/evaluate-skill-pipeline.ts`; `prettier --check . --end-of-line auto`; `git diff --check`; and untracked-file whitespace checks. The documented Windows CRLF checkout exception does not alter the LF repository policy. No live provider call.

## Risks, rollback and limitations

Conservative lexical refusal recognition may miss some paraphrases; fixtures must show that it does not create false refusal. Intent-tag priority is an interim policy over the committed baseline, not a frozen future taxonomy; a changed catalog requires checkpoint review. Shadow-only differences are expected but cannot establish better final wording. Rollback removes these post-B3 shadow changes without changing the frozen B3 commit or production path.

## Progress log

- 2026-10-04: Recorded the reviewer's three dispositions; inspected repository instructions, plans, docs, Agent context derivation, Skill selection, registry and tests before editing implementation.
- 2026-10-04: Added shadow-only refusal refinement, cap-aware priority with repair overlap, focused selector and cross-stage tests, and updated structural comparison/human-review/architecture documents. Final 33-case result: 27 `MATCH`, four reviewed order-only `EXPECTED_DIFFERENCE`, two reviewer-directed `POTENTIAL_REGRESSION` labels for intentional legacy-reference removal, no `NOT_COMPARABLE` or unexplained difference.
- 2026-10-04: Focused B3.5 tests 9/9; full Vitest suite 46 files / 305 tests; ESLint; six TypeScript checks; five package/API builds; desktop main/preload/renderer builds; Phase 4 evaluation 21/21; Windows-safe Prettier all passed. The comparator's 330-sample local timing baseline is in `docs/agent-skill-pipeline-validation.md`.

## Completion record

The two blocking shadow-selection defects are corrected and all 33 cases rechecked. `disagree-relationship` no longer selects `decline`; `cap-pressure-multi-need` now selects `expectation_setting`, `status_update`, `acknowledge_mistake` and `ask_for_help`; the Traditional Chinese boundary retains its supported secondary `request`, which drops under stronger crowded needs. Four other cases changed order only, retaining exact selected references and guidance content. The two `POTENTIAL_REGRESSION` comparator labels are mechanical legacy-reference-loss labels and are resolved by the reviewer's explicit correction decisions, not unexpected regressions. No production selector, registry, shared schema, Composer, provider, IPC or user-visible behavior changed.

Commands: `vitest run packages/ai/tests/skill-pipeline-validation.test.ts` (9/9); `vitest run packages/skills/src/evidence-aware-selector.test.ts` (12/12); `vitest run` (46 files / 305 tests); `eslint . --max-warnings 0`; five package/API `tsc -p .../tsconfig.json` plus `tsc -p packages/ai/tsconfig.skill-pipeline-validation.json`; five package/API `tsc -p .../tsconfig.build.json`; desktop `vite build` main/preload/renderer with native staging; `node scripts/evaluate-phase-4.mjs` (21/21); `tsx scripts/evaluate-skill-pipeline.ts` (33/33 categorized, all explained); and `prettier --check . --end-of-line auto` passed. `git diff --check` passed with only Git's known LF-to-CRLF worktree warning; the tracked index remains LF and no unrelated files were normalized. No live provider test was run.

The remediation is complete, but the remaining synthetic review cases and any decision to make SkillPlan production-authoritative require separate human signoff. The recommended next step is review of the updated 21-case expertise pack and six documented differences—not B4/B5 or Composer cutover.
