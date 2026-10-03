# Agent architecture Phase B3 — deterministic SkillPlan compilation

Status: complete — ready for review
Owner: Codex
Started: 2026-10-04
Updated: 2026-10-04
Roadmap milestone: Phase B3 in `docs/roadmap.md`

## Outcome and scope

Compile a bounded, evidence-linked `SkillPlan` from the *exact* B2 selected approved skill references. Run it only in the existing request-local shadow path and compare its structure with the production `CommunicationPlan`. The production selector, Composer input, provider calls, IPC, public result, and user-visible wording remain unchanged.

Out of scope: B4 metadata, B5 cutover, Agent/Supervisor/specialist runtime, model-assisted Skill behavior, new provider calls, Composer/Evaluator migration, authoring examples/candidates/research, semantic retrieval, memory, persistence, and automatic sending.

## Frozen current state and catalog gate

- Agent baseline: B2 freeze commit `60e2e9ccf7640368b770d1201737ba1127045921`, tag `agent-architecture-b2-freeze`. B1 remains separately frozen at `0b32f9ec4236d1649fb8772edd13f8e6cce0bd08`.
- Skill catalog baseline: committed Skills revision `dcc52eb15b578a4dbc65e4c74b64dbf9806cc899`; its untracked SRS work is excluded.
- Approved catalog snapshot: `approved-fnv128:f292695be12e86102468e1fa9f7d27f5`. Both worktrees expose the same approved runtime definitions, SHA-256 `d3bd95cd2fe91c999f0331e25c4f68438954ed21804d43f35616a7f7239497ca`, and the same sorted active ID/version/status references. The observed count is 21, not a contract or routing assumption.
- `packages/skills/src/registry.ts` is the runtime registry in this Agent worktree; the Skills revision uses an equal generated approved projection. `createApprovedSkillCatalogSnapshot` validates/fingerprints it. `packages/skills` must not import `packages/ai`.
- B2's `runB2SkillShadow` projects structural source-attributed evidence, assesses needs, selects approved references, and reports a content-free trace. The existing flat selector's `CommunicationPlan` alone enters Composer. B2 signoff: 44 files / 287 deterministic tests passed again before its separate commit; staged diff whitespace check passed.

If the committed Skills revision or approved runtime definitions change, stop B3 integration, recompute the fingerprint and ID/version/status parity, rerun shadow comparisons, and review compatibility. Never compile against uncommitted authoring work or a silently moving catalog.

## Assumptions and decisions

1. The Agent owns the fixed `AgentAction`; the Skill compiler receives it only for eligibility validation, never returns an action or loop directive. `taskPurpose` is not needed at compilation.
2. Evolve the B1 compilation request to carry the validated `SkillSelectionResult` instead of a separate duplicate `selectedSkills` array, plus the bounded context projection already used by B2. Selected references come only from that result. Keep existing `SkillPlan` output fields, strict schemas and bounds. B1 was frozen separately; this is an explicit B3 contract evolution.
3. The compiler validates the supplied selection's shape, snapshot, reason references, exact active ID/version, action/language/context eligibility and symmetric conflicts, but does not rank, add, remove, replace, alias or upgrade skills. Invalid boundary input throws or returns a bounded `FAILED` plan; it never broadens selection.
4. Deterministic guidance is copied verbatim from approved runtime `principles` and `avoid` only, in selected-reference order then definition-array order. Exact duplicate text is emitted once, with selected contributor references and the selection reason's valid evidence references. No raw evidence text is interpolated, so no new user goal, relationship claim, apology, fact, or language translation is invented. `recommendations` and `tradeoffs` remain empty until approved runtime metadata supports them. Evidence citations explain selected-skill applicability, not proof of every word of general skill guidance.
5. `NONE` yields an empty `NONE` plan; selection `FAILED` yields empty `FAILED`; unresolved, inactive, version, snapshot, eligibility or conflict problems fail closed with a bounded code and no partial guidance. Invalid malformed request/output schemas are rejected, not repaired.
6. Shadow comparison may compare strings in memory, but its optional trace contains only statuses, exact refs, counts, equality/ordering booleans, bounded failure code and category. No guidance text, evidence value, message, draft, identity, screenshot or provider payload enters the trace, logging, analytics or history.

## Contract and data flow

```text
Production: SkillContext → flat selector → CommunicationPlan → Composer
Shadow: fixed action + CommunicationProblem → bounded evidence
        → CommunicationAssessment → SkillSelectionResult
        → SkillPlanCompiler → SkillPlan → structural comparison only
```

`SkillPlanCompilationRequest` contains fixed action, validated selection result (including exact refs/reasons/status/snapshot), bounded allowed evidence, bounded context projection, up to eight existing hard/soft constraint evidence references, and approved catalog snapshot ID. It has no Agent loop state. The compiler uses the existing provider-neutral `SkillPlanCompiler.compile(request): Promise<SkillPlan>` interface and the supplied in-memory approved snapshot. The output remains strict, with `COMPILED | NONE | FAILED`, exact selected refs for a compiled plan, and no action or orchestration fields. Cross-field validation binds selection/result/snapshot, evidence citations and selected references.

Input bounds remain four selected skills, 32 evidence items, four evidence refs per selection reason/guidance item, eight constraints. Output bounds remain 12 principles, 12 avoidances, eight recommendations and eight tradeoffs; B3 emits zero of the latter two. Each guidance string is at most 300 characters. Add a total cap of 24 guidance items and 32,768 serialized JSON code units for `SkillPlan`; fail rather than silently truncate an invalid plan. Approved definitions are already schema-bounded; selected-item aggregation truncates at field caps in stable order, as the production engine does.

For a duplicate principle/avoidance, merge its exact selected skill citations in selection order and stable evidence references, within the four-reference cap. If a selected skill lacks a validated evidence-backed selection reason, fail closed. A `CONTEXT_MATCH` reason must cite a supplied context tag matching the selected skill and context; a `NEED_MATCH` must cite supplied context-tag evidence still present in context; a `LANGUAGE_MATCH` must cite the observed primary language. A free-text user direction alone cannot masquerade as a selection reason. Unknown relationship/identity evidence is never promoted to a fact or used to synthesize guidance.

## Implementation steps

1. Update shared B1 compilation request/plan validation and focused boundary tests before adding compiler producers/consumers.
2. Add `packages/skills/src/deterministic-skill-plan-compiler.ts` using only approved runtime definitions and pure eligibility/conflict helpers; export it through the Skill package. Keep the interface provider-neutral and add no SDK.
3. Extend B2 shadow execution to compile the actual validated selection and compare with the production plan. Keep the existing `onShadowComparison` callback structural and catch/isolate every shadow/observer failure.
4. Add unit tests for exact references, failures, bounds, dedup/order, evidence/unknowns, languages, immutability and deterministic repeatability; integration tests for shadow/production parity and no provider/result change.
5. Run focused/full tests, lint, all typechecks, package/desktop builds, Phase 4 evaluation, format under the approved Windows worktree exception, and `git diff --check`. Update affected architecture docs and completion record, then stop before B4/B5.

## Comparison and acceptance

Compare selected refs/status, principle/avoidance counts, exact strings and order *inside the request-local comparator*. Emit only structural equality/counts/category. `MATCH` means deterministic structural parity, not improved wording. An intentional difference may be `EXPECTED_DIFFERENCE`; failure or incomparable states are `NOT_COMPARABLE`; potential regression/improvement labels are diagnostic hypotheses only. Test current frozen fixtures without asserting all future catalogs must match.

- [x] B2 is independently committed/frozen and Skills snapshot revalidated.
- [x] Contract separates selection from compilation; output cannot echo action or orchestrate.
- [x] Exact active ID/version refs, language/action eligibility, snapshot and conflicts are validated; selected set never mutates.
- [x] `SELECTED`, `NONE`, `FAILED` compile deterministically with bounded, evidence-linked guidance or no guidance.
- [x] No unsupported goal/fact/relationship is introduced; no evidence prose is copied into guidance.
- [x] B3 runs shadow-only; Composer input, public result and provider-call count are unchanged, including failure paths.
- [x] Structural comparison and trace contain no private content.
- [x] Focused/full deterministic tests, lint/typecheck/build, Phase 4 evaluation and formatting/whitespace gates pass.

## Risks, rollback and limitations

The Agent worktree's inline registry and Skills branch's generated projection must remain value-identical until integration. B3 does not consume the Skills branch's uncommitted SRS work. Generic approved guidance plus selection-level citations may be less context-specific than a future reviewed compiler; B3 makes no wording-quality claim. If shadow compilation fails, production continues unchanged and the trace records only a bounded failure. Roll back B3 by removing its compiler and shadow invocation; B2 commit/tag remains intact, with no persisted data or user-facing migration.

## Progress log

- 2026-10-04: Read the governing architecture/product/privacy and execution-plan documents, B2 code/tests, and current registry. Reviewed B2 (44/287 tests green), committed/tagged it separately at `60e2e9c`, verified the Skills revision remains `dcc52eb`, and recomputed equal runtime hashes/snapshot. Wrote this plan before B3 code.
- 2026-10-04: Evolved the shared compiler request to carry the validated selection result and context, added exact-reference deterministic compiler and bounded evidence-backed guidance, and extended the B2 shadow runner with request-local structural plan comparison. The production `CommunicationPlan` still alone enters Composer.
- 2026-10-04: Tightened compilation to reject selection-reason citations that do not match supplied context/language evidence. A synthetic conflict test then needed a genuine second context-tag citation; after correcting the fixture, focused and full tests passed. No changes were made to the concurrent Skills worktree.
- 2026-10-04: Final gates passed: 45 files / 295 tests; zero-warning lint; all six typechecks; five package/API builds; desktop main, native staging, preload and renderer builds; Phase 4 evaluation 21/21; Windows-safe formatting and whitespace checks. Frozen fixture guidance content/order and selected refs matched the legacy plan in all 21 scenarios. This is deterministic parity evidence, not wording-quality proof.

## Completion record

B3 is implemented and ready for signoff, but intentionally uncommitted so its diff can be reviewed separately from the B2 freeze. The compiler uses only approved runtime principles/avoidances; it does not generate new recommendations or tradeoffs, infer private facts, or add a provider call. Its result is shadow-only and cannot affect policy, Composer, IPC, renderer, public output or user-visible wording. The request-local trace exposes statuses, refs, counts, equality flags and bounded codes only; it is not logged or persisted.

The final validation commands were direct `vitest run` (45/295 pass), `eslint . --max-warnings 0` (pass), `tsc -p <each of six package/app>/tsconfig.json --noEmit` (pass), `tsc -p <five package/API>/tsconfig.build.json` (pass), desktop `vite build` for main/preload/renderer plus native artifact staging (pass), `node scripts/evaluate-phase-4.mjs` (21/21 pass), `prettier --check . --end-of-line auto` (pass), and `git diff --check` (pass). Direct tools avoid the host pnpm wrapper's previously observed unrelated workspace rewrite. The repository index remains LF; Windows materializes some tracked files as CRLF. The approved worktree formatting exception does not change repository policy or normalize unrelated files.

Limitations: selection-level citations establish why a skill was chosen, not a semantic proof of each generic approved guideline. No prose-quality improvement, human review, live provider evaluation, catalog evolution, or production cutover is claimed. Revalidate the committed catalog and shadow comparisons if Skills advances beyond `dcc52eb`. Next recommended milestone is B3 review/signoff, then a separately approved B4 metadata decision or B5 cutover-readiness review; begin neither automatically.
