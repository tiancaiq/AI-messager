# Agent architecture Phase B3.5 — Skill Pipeline Validation

Status: complete; full human expertise signoff received
Owner: Codex
Started: 2026-10-04
Updated: 2026-10-04
Roadmap milestone: Phase B3.5 in `docs/roadmap.md`

## Outcome and scope

Validate the existing shadow-only Skill pipeline as one unit: `CommunicationProblem` → bounded evidence → communication assessment → approved selection → deterministic `SkillPlan`. Compare it structurally with the production flat selector and prepare synthetic human-review material. This milestone is test/evaluation/documentation only; it cannot make the new plan production-authoritative or claim better final wording.

Out of scope: runtime behavior changes, B4/B5, Composer A/B or cutover, Supervisor/specialist agents, model-assisted Skill behavior, new provider calls, authoring/SRS integration, memory, UI/IPC, persistence, and live-provider evaluation.

## Frozen baseline and current state

- Agent B3 freeze commit: `fed2d0f3c1d7134b6ca8ceade1bbf22e319cb342`, tag `agent-architecture-b3-freeze`. B3 focused gate was rerun before freeze: four files / 42 tests passed; staged whitespace check passed.
- Skills committed baseline: `dcc52eb15b578a4dbc65e4c74b64dbf9806cc899`. Its untracked SRS work is out of scope and untouched.
- Approved runtime registry SHA-256: `d3bd95cd2fe91c999f0331e25c4f68438954ed21804d43f35616a7f7239497ca`. Validated snapshot: `approved-fnv128:f292695be12e86102468e1fa9f7d27f5`. The observed active count is 21, not an invariant.
- `packages/ai/src/communication-problem.ts`, `skill-evidence.ts` and `skill-context.ts` own normalized Agent input and bounded projection. `packages/skills/src/communication-signals.ts`, `evidence-aware-selector.ts` and `deterministic-skill-plan-compiler.ts` own the three Skill stages. `packages/ai/src/skill-shadow.ts` has a request-local structural comparator; `coaching-engine.ts` still sends only the legacy `CommunicationPlan` to Composer.
- Existing 21 approved synthetic skill-selection fixtures live in `packages/test-fixtures/src/index.ts`; B3's fixture integration test reported 21/21 structural matches. The test-only adversarial set will add coverage, not modify production semantics or the canonical registry.

## Decisions, assumptions and comparison rules

1. The harness lives in test/evaluation-only files under `packages/ai/tests/` and `scripts/`; it imports the real stage implementations and an injected approved snapshot. It does not duplicate production algorithms, persist private inputs, call a provider, invoke Composer or export a runtime service.
2. Existing fixtures run unchanged. New adversarial fixtures are synthetic and source-attributed; intentional case-specific user context may be passed to Phase A normalization only in the test harness. The policy still fixes `AgentAction`. No test can treat a visible contact label as confirmed identity/relationship.
3. Compare fixed action, exact ID/version references and ordering, `NONE`/`FAILED`, counts, conflicts, language/action eligibility, guidance text/order and bounds. Raw guidance strings may be compared in test memory or synthetic review artifacts; the structural result and production-style trace expose only status, refs, counts, booleans, category and bounded codes.
4. `MATCH`: exact selected refs/status and guidance text/order parity. `EXPECTED_DIFFERENCE`: validated, explained difference without evidence of benefit/harm. `POTENTIAL_IMPROVEMENT`: new path adds supported expertise where legacy has none. `POTENTIAL_REGRESSION`: old path has supported expertise lost or forbidden/unsupported expertise appears in new path. `NOT_COMPARABLE`: either path fails or validation cannot be completed. These labels are diagnostics, not prose-quality judgments. Every non-match gets a concise structural reason and explicit review disposition.
5. Property-style tests will rerun identical inputs; reverse a validated synthetic registry; vary catalog size/status; check exact refs, citations, bounds, authority fields, unknown preservation and no private trace content. A small synthetic catalog variant tests an added eligible skill and an inactive skill without introducing a second production registry.
6. Performance uses local `performance.now()` over repeated synthetic fixtures after warm-up, reporting median and worst observed stage/full runtimes on this host. It is a baseline, not a pass/fail latency SLA. No external timing or optimization work is implied.

## Contracts, data flow and privacy

```text
synthetic CoachingRequest → policy-fixed AgentAction
  ├→ SkillContext → legacy flat selector → CommunicationPlan
  └→ CommunicationProblem → bounded structural SkillEvidence[]
       → CommunicationAssessment → SkillSelectionResult
       → deterministic SkillPlanCompiler → SkillPlan → structural comparison
```

The test-only runner may retain synthetic stage objects in memory for assertions and human review; its structural comparison output excludes raw messages/drafts, names, relationship claims, evidence values and full SkillPlan prose. No screenshot, real conversation, credential, provider payload or generated final message is introduced. The optional B2/B3 production trace remains non-persistent and content-free. Human-review documents are explicitly synthetic and may show approved generic guidance, not private user content.

## Implementation steps

1. Freeze B3 separately and record exact Agent/Skills/snapshot baselines (done before this plan).
2. Add a test-only end-to-end runner and adversarial fixtures; reuse real Phase A/B2/B3 stages and compare with the real legacy selector.
3. Add cross-stage, evidence, failure, scale and production-isolation tests at the lowest useful layer. Any actual safety/authority regression becomes a documented signoff blocker; do not silently change runtime in this validation-only milestone.
4. Run deterministic comparison over all existing and adversarial cases; record totals and every non-match reason/disposition.
5. Produce a 15–30-case synthetic review set with fixed action, supported evidence summary, signals, exact selected refs, full approved SkillPlan/legacy guidance, category and reviewer questions. Do not judge final messages.
6. Measure local stage/full overhead; run focused/full tests, lint/typecheck/build, Phase 4 evaluation and formatting/whitespace gates. Record acceptance status and stop before B4/B5 or Composer integration.

## Acceptance criteria

- [x] B3 is separately frozen; committed Skills baseline and snapshot are recorded.
- [x] Full new pipeline runs deterministically on existing and adversarial synthetic fixtures without provider/Composer calls.
- [x] Action/intent/unknown provenance, exact approved active references, evidence citations, eligibility, conflict handling, cap and `NONE`/`FAILED` distinction hold across stages.
- [x] Compiled plan uses exactly selected refs, bounded deterministic guidance and no orchestration fields.
- [x] Legacy/new structural category totals and every non-match disposition are documented.
- [x] Twenty-one representative synthetic cases are prepared for human expertise review, not final-wording review.
- [x] Synthetic catalog-order/size/status variation and local performance baseline are recorded.
- [x] Structural trace remains content-free; production selector, Composer input, result and provider-call count remain unchanged.
- [x] Focused/full tests, lint, typecheck, package/desktop builds, Phase 4 evaluation, Windows-safe formatting and whitespace checks pass; any exception or regression is explicit.
- [x] Human review resolves or explicitly accepts the three flagged relevance/cap-pressure observations; reviewer-directed shadow corrections and all-case revalidation are tracked in the [B3.5 remediation plan](agent-architecture-phase-b3-5-remediation.md). Broader quality signoff and SkillPlan authority remain separate decisions.

## Validation commands

Use direct underlying `vitest run` (focused and full), `eslint . --max-warnings 0`, package/app `tsc -p ... --noEmit`, package/API `tsc -p .../tsconfig.build.json`, desktop `vite build` main/preload/renderer plus native staging, `node scripts/evaluate-phase-4.mjs`, the B3.5 local evaluation script, `prettier --check . --end-of-line auto`, `git diff --check`, and checks for untracked-file whitespace and forbidden Skill SDK imports. The Windows worktree CRLF exception remains documented; the repository/index LF policy is unchanged. No live provider call is required.

## Risks, rollback and limitations

The current Agent worktree uses the inline approved runtime representation while the Skills branch uses an equal generated projection; a newer committed catalog requires revalidation. Deterministic lexical tagging and generic approved guidance cannot establish semantic correctness or better final wording. Human review is a pending judgment step, not an automatically passing test. B3.5 adds no runtime path or stored data, so rollback removes only test/evaluation files and documentation, leaving the B3 freeze intact.

## Progress log

- 2026-10-04: Read the request, repository instructions, relevant architecture/product/privacy plans and implementation. Verified B3 focused tests (4 files / 42 tests), staged only B3 files, passed staged whitespace check, committed/tagged B3 at `fed2d0f`, and revalidated the unchanged Skills commit and approved snapshot before creating this plan.
- 2026-10-04: Added the test-only full-pipeline harness, 12 adversarial fixtures, cross-stage/fault/scale/trace tests, structural evaluator, 21-case synthetic review pack and comparison report. All 33 fixtures structurally match the legacy selector. Flagged shared relevance/cap-pressure cases for human judgment without changing production behavior.
- 2026-10-04: Focused B3.5 tests 8/8; full Vitest suite 46 files / 303 tests; ESLint; six TypeScript checks (five package/API plus dedicated B3.5 harness); five package/API builds; desktop main/preload/renderer builds; Phase 4 evaluation 21/21; Windows-safe Prettier check and `git diff --check` all passed. Local 330-sample timing baseline recorded in `docs/agent-skill-pipeline-validation.md`.
- 2026-10-04: Reviewer rejected disagreement-as-refusal and cap-pressure omission, accepted the Traditional Chinese request as secondary. A separate scoped [remediation plan](agent-architecture-phase-b3-5-remediation.md) records shadow-only corrections and the 33-case recheck; the original 33/33 parity baseline remains historical, not the corrected result.
- 2026-10-04: The human reviewer dispositioned the remaining 18 expertise cases (13 `ACCEPT`, one `ACCEPT` with the Agent-side tone-path caveat, four `FIX_ASSESSMENT`). The [assessment correction plan](agent-architecture-phase-b3-5-assessment.md) records narrow shadow-only implementation, positive/negative counterexamples and full validation. Final comparison: 24 `MATCH`, three `EXPECTED_DIFFERENCE`, one `POTENTIAL_IMPROVEMENT`, five conservative `POTENTIAL_REGRESSION`, zero `NOT_COMPARABLE` across all 33 fixtures. Full suite: 46 files / 307 tests, plus lint, seven typechecks, package/API and desktop builds, Phase 4 evaluation 21/21, Windows-safe formatting and whitespace gates all passed.
- 2026-10-04: After receiving the post-correction results, the human reviewer explicitly granted **B3.5 FULL SIGNOFF**. Production selection and Composer guidance remain unchanged. Commit/tag freeze and B4 planning are separate next steps.

## Completion record

The initial deterministic validation was not sufficient for expertise signoff: 33/33 legacy parity concealed selection defects. Human review then dispositioned all 21 cases and directed both [selection remediation](agent-architecture-phase-b3-5-remediation.md) and [assessment correction](agent-architecture-phase-b3-5-assessment.md). The final 33-case comparison and explicit rationale for every difference are in the [validation report](../../docs/agent-skill-pipeline-validation.md); no unresolved blocking expertise, authority or safety issue remains in the reviewed synthetic set. All deterministic repository gates passed and the reviewer granted **B3.5 FULL SIGNOFF**. The production selector and Composer remain authoritative. The freeze commit/tag is recorded after this plan update; B4 quality evaluation and any cutover decision remain separate.
