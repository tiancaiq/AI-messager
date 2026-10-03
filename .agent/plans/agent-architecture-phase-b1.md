# Agent architecture Phase B1 — Agent–Skill contract

Status: complete — contract-only boundary; production selection unchanged

Owner: Codex

Started: 2026-10-04

Updated: 2026-10-04
Roadmap milestone: [Agent architecture Phase B](../../docs/roadmap.md#agent-architecture-phase-b--agentskill-integration)

## Outcome

Define a strict, provider-neutral boundary through which the existing Agent-owned fixed action and bounded, source-attributed evidence can eventually reach the shared Skill System. B1 delivers validated contracts and a deterministic-default assessment-port seam without changing production skill selection, generation, provider calls, IPC, or user-visible behavior.

## Scope

In scope after the entry gate: Zod-first shared evidence, assessment, selection and SkillPlan input/output contracts with distinct stage seams; exact approved catalog-reference validation; a provider-neutral Skill-facing assessment interface with a deterministic default or inert contract-level implementation; tests for action immutability, provenance, reference resolution, strict output shape and privacy; compatibility with the existing `SkillContext`/`CommunicationPlan` types. B1 defines the stages but does not implement B2 selection or B3 compilation behavior.

Out of scope: evidence-aware selection algorithms (B2), SkillPlan compilation behavior (B3), capability/domain metadata (B4), shadow cutover (B5), Supervisor or specialist runtime (C/D), a model call, provider adapter, new IPC/UI, memory integration, catalog migration, draft/generated skill activation, and production behavior changes.

## Current state and entry gate

- Phase A provides request-scoped `CommunicationProblem` normalization in `packages/ai/src/communication-problem.ts`. It is shadow data; `coaching-engine.ts` does not use it for the policy, skill planner, provider request or result.
- `AgentActionSchema` is shared in `packages/contracts/src/coaching.ts`; `decideCoachingAction` remains the sole policy authority. `DECLINE` is an intent, not an `AgentAction` value.
- `packages/contracts/src/skills.ts` currently defines `SkillDefinition`, `SkillContext`, `SelectedSkill` and combined `CommunicationPlan` schemas. `packages/skills/src/engine.ts` exposes `createSkillEngine(input).select(context)`, with the current flat selector and at most four selected skills. `packages/ai/src/skill-context.ts` defines the narrow `CommunicationSkillPlanner.plan(context)` boundary.
- The separate `skills` worktree was inspected read-only on 2026-10-04. It still has substantial uncommitted manifest-backed catalog and schema work. Its proposed SRS-5 shadow evaluation is blocked on SRS-4; SRS-6 production integration is blocked on an accepted SRS-5 `READY` decision. Its 21 active version-1 definitions are a dated observation, not an integration invariant or frozen approved revision.
- The user authorized B1 implementation on 2026-10-04. The agent worktree's committed, validated `initialSkillRegistry` is the current approved runtime baseline. B1 contracts and validators will accept a supplied validated registry snapshot rather than copy or hardcode that baseline. The separate uncommitted skill migration remains a reconciliation gate before B2 or production cutover. Do not build an ownership table.

## Assumptions and decisions to review

1. The Agent sends its policy-fixed `AgentAction` unchanged. Skill outputs contain **no `action` field at all** and cannot alter user intent, assign an agent task, request a model call, or control the loop. An unavoidable compatibility echo would require a separate reviewed exception; B1 does not assume one.
2. Evidence is a bounded projection of validated observations and explicit user input, with stable request-local references and preserved source/provenance. Phase A's `OBSERVED_SCREENSHOT`, `USER_SUPPLIED`, `DETERMINISTIC_DERIVATION`, `ANALYSIS_INFERENCE` and `UNKNOWN` vocabulary is the starting point; any policy-owned fact needs an explicit distinguishable source. Exact enum, excerpt limits and whether confidence belongs per kind require review.
3. A request binds to one approved runtime catalog snapshot; selected references must resolve to exact ID/version in that snapshot. Decide the snapshot identifier/reference mechanism with skill work rather than deriving it from file paths, authoring families or a fixed catalog count.
4. Shared cross-package values belong in `packages/contracts`; `CommunicationProblem` and execution planning stay in `packages/ai`; assessment interfaces and future algorithms belong in `packages/skills`. No `packages/skills → packages/ai` import.
5. Existing `SkillContext` and `CommunicationPlan` remain the production seam. B1 must not introduce a competing registry, alter their current runtime behavior, or anticipate B2/B3 logic under the name of contract plumbing.
6. A future model-backed implementation is permitted only behind a provider-neutral port and later Agent-granted budget/privacy approval. B1 makes no provider call.
7. `taskPurpose` is descriptive execution scope only. It cannot introduce a new user goal, override the fixed action, or act as an orchestration directive. Any goal-bearing purpose must be grounded in validated user input; prefer a bounded structured description over unconstrained persuasive instructions.
8. For B1, `taskPurpose` is a closed structured `PRIMARY_COACHING` scope with no free-text instruction. A later approved Agent-task milestone may extend the enum. The catalog snapshot ID is an opaque, bounded caller-supplied reference paired with a validated approved registry; B1 validators compare it and resolve exact ID/version/status in that registry. B1 does not infer snapshot identity from file paths, count or taxonomy.
9. Communication signal IDs are bounded but not hardcoded to today's provisional taxonomy. Skill-side assessment validation requires an injected allowed-signal set; the B1 default has no signals. B2 must review and supply that set before a nonempty assessment can pass.

## Contracts and data flow

```text
validated CoachingRequest → existing deterministic policy → fixed AgentAction
             │
             └→ Phase A CommunicationProblem → bounded evidence projection
fixed action + evidence + language/context + approved snapshot
             → SkillAssessmentPort → CommunicationAssessment
             → SkillSelector → SkillSelectionResult
             → SkillPlanCompiler (B3) → SkillPlan

Production remains: existing SkillContext → flat selector → CommunicationPlan → Composer.
```

Assessment answers **which communication needs/signals are present**, with evidence references and uncertainty; selection answers **which approved skills fit those needs**; compilation answers **what bounded guidance those selected skills produce**. B1 defines `SkillAssessmentRequest → CommunicationAssessment`, `SkillSelectionRequest → SkillSelectionResult`, and SkillPlan compiler input/output as separate contract seams. The assessment port returns only `CommunicationAssessment`, never a selection result. B2 implements evidence-aware selection; B3 implements compilation.

The B1 schemas should cover bounded evidence ID/kind/source/value-or-structured-fact, optional qualified confidence and source reference; fixed action in Skill **inputs**; bounded descriptive `taskPurpose` with no new intent or agent-control semantics; language/eligibility context; selection cap; approved snapshot binding; assessment signals and uncertainty; selected exact ID/version references with evidence-backed reasons; distinct `SELECTED`, `NONE` and `FAILED` with closed failure/uncertainty codes; and bounded SkillPlan input/output whose references can be checked before B3 compiles guidance. Skill **outputs** (`CommunicationAssessment`, `SkillSelectionResult`, `SkillPlan`) must omit `action`, `nextAction`, `agent`, `nextAgent`, `shouldContinue`, `shouldStop`, `shouldRevise`, `callModel`, `executionDepth`, `callBudget` and equivalent orchestration fields. Strict schemas reject those fields, dangling evidence/skill references and any result that invents user intent. Define each schema only once, extending existing types where practical.

The Agent never sends a whole screenshot, unbounded transcript, hidden memory, identity profile, provider payload, or loop state through this seam. B1 validation is request-scoped and does not persist private text or selected-skill history. Any structural debug trace excludes content, drafts, full findings, private reasoning and provider payloads.

## Implementation steps after approval and entry gate

1. Record the exact reviewed catalog revision/projection, schema and selector API; document status/version, active eligibility, conflicts and snapshot identity. Recheck that this branch's skill package and the concurrent branch have one reconciled canonical registry, not two.
2. Add or extend Zod-first shared contracts in `packages/contracts/src/skills.ts` or a focused adjacent contract module, reusing `AgentActionSchema` for inputs and canonical skill ID/version values. Define separate assessment, selection and compiler seams; output schemas contain no action or orchestration fields. Add strict cross-field/reference validation at the boundary that has the approved snapshot.
3. Define the provider-neutral Skill assessment interface in `packages/skills` so it returns `CommunicationAssessment`, not selected skills, with a deterministic default/inert implementation appropriate to B1. Do not add a model adapter or change `createSkillEngine(...).select` behavior.
4. Add a bounded Agent-side evidence projection in `packages/ai` only if a current B1 caller requires it; otherwise keep producer wiring for B2. The projection must use the exact policy action and never promote contact observations to confirmed identity/relationship.
5. Add focused contract/boundary tests and an integration parity assertion that the existing coaching path, skill plan, provider call count and public result are unchanged.
6. Update docs for finalized B1 contracts and limits. Stop before B2 selection logic.

## Tests and evaluation

Use synthetic fixtures and deterministic fake ports only. Test strict bounds and unknown fields; duplicate/dangling evidence IDs; preserved provenance and explicit unknowns; fixed input action, absent output action and rejected action/orchestration fields; `taskPurpose` that attempts to add an unsupported goal or directive; distinct assessment/selection/compiler shapes; active exact-version catalog resolution and snapshot mismatch; `NONE` versus `FAILED`; no selected guidance on failure; unsupported language; and no private content in structural traces. Verify existing policy/skill fixtures and coaching-engine output/call-count parity. No live-provider evaluation belongs to B1.

## Acceptance criteria

- [x] B1 validators use the current committed approved registry as a test baseline and accept an injected validated snapshot without hardcoded catalog count, paths or taxonomy. Reconcile the concurrent skill migration before B2/production use.
- [x] Fixed policy action enters the Skill boundary unchanged; Skill outputs have no action or orchestration fields and cannot add intent or command Agent execution.
- [x] Assessment, selection and SkillPlan compilation have distinct contract seams; B1 defines them without implementing B2/B3 algorithms.
- [x] `taskPurpose` is bounded, descriptive and grounded in the fixed task/validated user input; it cannot smuggle a new goal or execution directive.
- [x] Bounded evidence retains source/provenance and request-local references; unknown identity/relationship stays unknown.
- [x] Nonempty assessment signals must belong to an explicitly allowed Skill-owned vocabulary and cite supplied evidence; an unapproved goal-like signal is rejected.
- [x] All selected skill references resolve to approved active exact ID/version values in the bound snapshot; invalid or mismatched references fail closed.
- [x] Assessment, selection and SkillPlan contract shapes are independently validatable without implementing B2/B3 behavior.
- [x] The deterministic assessment seam is provider-neutral; no provider SDK, Electron or `packages/ai` import enters `packages/skills`, and no model call occurs.
- [x] Current policy, flat selection, Composer input, call count, result, IPC and privacy behavior are unchanged.
- [x] Relevant tests plus repository lint, typecheck, test, build and `git diff --check` pass; formatting is verified under the documented Windows checkout exception where applicable.

## Validation commands

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm eval:phase4
git diff --check
```

Run focused contract/boundary tests and targeted Prettier checks for changed files. Do not run a live provider by default. Avoid commands that rewrite unrelated files or the concurrent skill worktree.

## Risks, rollback and limitations

The main risks are freezing a moving catalog, duplicating skill identities/contracts, smuggling unbounded private text across the boundary, or accidentally routing production through unfinished B1 contracts. B1 uses the current committed approved registry only as an injected validation baseline and leaves the old selector untouched and authoritative; reconcile the concurrent catalog before B2. The opaque snapshot ID must be paired with the correct approved registry by its future caller, because B1 does not compute a content digest. Any B1-only contracts can be removed without user-data migration because no new persistence or production cutover occurs. Evidence and snapshot shapes may require a reviewed compatibility update when skill work is reconciled.

## Progress log

- 2026-10-04: Read README, milestone rules, revised architecture/integration plans, Phase A implementation and tests, product/privacy rules, existing contracts/engine, and the concurrent skill worktree. Confirmed the catalog migration is still uncommitted and SRS-5/SRS-6 are not approved for production. Drafted this proposed B1 plan without runtime edits.
- 2026-10-04: Applied the user's conditional approval edits: separate assessment, selection and compilation seams; constrained descriptive `taskPurpose`; and prohibited action/orchestration fields in every Skill output. The revised plan is approved; catalog/contract entry gates and the user's plan-only scope still prohibit runtime implementation.
- 2026-10-04: User authorized B1 implementation. Narrowed B1 to generic contract/validation seams against the current committed approved runtime registry, with the concurrent uncommitted skill work still requiring reconciliation before B2 or production cutover. No catalog copy, provider call or production wiring is authorized.
- 2026-10-04: Added adjacent shared Zod contracts, strict output/evidence bounds, Skill-side reference/evidence/snapshot validators and an offline deterministic `UNASSESSED` assessment port. The existing flat selector and AI coaching path were not edited. Added focused contract and Skill-boundary tests; full deterministic test/evaluation and workspace checks are in progress.
- 2026-10-04: Added a Skill-owned allowed-signal validation argument so nonempty assessments cannot introduce arbitrary goal-like signal IDs while the communication vocabulary is provisional. Focused and full deterministic tests, full lint/typecheck, production compilation/bundling, Phase 4 evaluation, alternative Windows-safe formatting and whitespace checks passed.

## Completion record

B1 is complete as a **contract-only** milestone. New strict schemas live in `packages/contracts/src/agent-skill.ts`; `packages/skills/src/agent-skill-boundary.ts` defines separate assessment/selection/compiler ports, an offline deterministic `UNASSESSED` default, and validators for approved active exact skill references, snapshot equality, evidence citations, selected-skill citations and allowed communication signals. New contract and Skill-boundary test files add nine deterministic tests. No production caller, Agent-side evidence projection, selector algorithm, SkillPlan compiler, provider adapter, IPC, persistence or model call was added. The current flat selector remains authoritative.

Validation commands and results:

- `vitest run packages/contracts/src/agent-skill.test.ts packages/skills/src/agent-skill-boundary.test.ts` — 2 files/9 tests passed.
- `vitest run` — 42 files/272 tests passed after final changes.
- `eslint . --max-warnings 0` — passed.
- `tsc -p <package-or-app>/tsconfig.json --noEmit` — passed for contracts, skills, test-fixtures, AI, API and desktop.
- `tsc -p <package-or-app>/tsconfig.build.json` — passed for contracts, test-fixtures, skills, AI and API; final skills/AI builds also passed after the allowed-signal change.
- `vite build` for desktop main, preload and renderer — passed; the final pass used `--emptyOutDir false` to preserve existing build artifacts.
- `node scripts/evaluate-phase-4.mjs` — 21/21 scenarios passed, with unchanged strict metrics.
- `prettier --check . --end-of-line auto` and `git diff --check` — passed. The latter emitted only existing Windows LF/CRLF conversion notices. No unrelated files were normalized.

The root `pnpm` wrappers and canonical `format:check` were not run: this host's pnpm has previously rewritten unrelated workspace configuration, and the approved Windows CRLF worktree exception remains in force. Direct underlying checks and builds were used instead. No credential or live-provider test was needed for this provider-neutral slice.

Limitations: the snapshot ID is opaque and must be paired with the correct canonical approved registry by its future caller; B1 does not compute a catalog digest. The assessment signal vocabulary is injected and currently empty for the default assessor. Phase A `CommunicationProblem` remains shadow data; evidence projection and real deterministic assessment/selection belong to B2 after the concurrent skill catalog is reconciled. No user-visible behavior or data migration exists to roll back.

The next recommended milestone is **B2 — evidence-aware deterministic selection**, only after catalog/schema/API/status/version reconciliation and a separate reviewed execution plan. B3 SkillPlan compilation and B5 cutover remain later gates.
