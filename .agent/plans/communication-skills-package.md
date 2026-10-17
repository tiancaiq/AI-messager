# Communication Skills Package Boundary

Status: complete
Owner: Codex
Started: 2026-09-14
Updated: 2026-09-14
Roadmap milestone: Phase 4 follow-up — package-boundary hardening

## Outcome

Formalize the existing `@ai-message-coach/skills` workspace package as the exclusive home of approved communication-strategy skills and prevent registry definitions from targeting Phase 3 actions that do not generate wording.

## Scope

In scope: package documentation and metadata; a shared schema for wording-producing skill actions; registry validation; focused contract and registry tests; and a portable workspace filter so package builds and evaluation use fresh artifacts on Windows.

Out of scope: new skills, playbooks, language expansion, relationship or memory inputs, Skill Factory, lifecycle redesign, semantic retrieval, embeddings, persistence, provider changes, UI work, insertion, and sending.

## Current state

- `packages/skills` already contains the 21-entry communication registry, deterministic selector/composer, and evaluation helpers.
- `packages/contracts/src/skills.ts` currently allows any `AgentAction` in a skill definition even though selection deliberately returns no skills for `SUGGEST_ACTIONS`, `ASK_CLARIFICATION`, and `NO_REPLY_NEEDED`.
- The package has no local README or package description that distinguishes communication strategy from general agent/tool skills.
- Root package scripts use POSIX-style single quotes around pnpm path filters; Windows passes those quotes literally, causing `build:packages` to match no projects.

## Assumptions and decisions

- Reuse `packages/skills`; creating a second registry package would violate the repository's single-source-of-truth boundary.
- “Communication only” describes the package's domain. Selection, validation, composition, and evaluation remain here because the established architecture assigns them to `packages/skills`.
- A communication skill may influence only `REWRITE_DRAFT`, `COMPLETE_DRAFT`, or `SUGGEST_REPLY`. It cannot select or override a Phase 3 action.
- Keep existing public names and registry IDs to avoid an unnecessary migration.

## Contracts and data flow

Add a strict `CommunicationSkillActionSchema` derived from the three wording-producing `AgentAction` values. `SkillDefinition.actions` uses that schema, while `SkillContext.action` continues to accept every Phase 3 action so valid `NONE` plans remain possible.

## Implementation steps

1. Add package metadata and a concise boundary README.
2. Add and export the communication-skill action schema/type.
3. Update registry typing to use the narrowed action type.
4. Add tests proving non-wording actions cannot be stored in skill definitions and current definitions remain valid.
5. Make the root package/app path filters portable so validation does not reuse stale output on Windows.
6. Run formatting, lint, typecheck, tests, build, and deterministic Phase 4 evaluation.

## Tests and evaluation

- Contract test rejects a definition targeting `SUGGEST_ACTIONS`, `ASK_CLARIFICATION`, or `NO_REPLY_NEEDED`.
- Existing registry and selection suites prove all 21 definitions remain valid and behavior is unchanged.
- Deterministic Phase 4 evaluation confirms action preservation and selection metrics.

## Acceptance criteria

- [x] `@ai-message-coach/skills` explicitly documents its communication-strategy-only purpose.
- [x] Skill definitions accept only wording-producing Phase 3 actions.
- [x] Skill context still accepts all six Phase 3 actions and returns `NONE` where appropriate.
- [x] No new registry, provider coupling, action-selection logic, or future-milestone infrastructure is introduced.
- [x] Functional validation commands pass; the repository-wide format check retains a documented pre-existing exception.

## Validation commands

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm eval:phase4`

## Risks, rollback, and limitations

The narrowed schema intentionally rejects any future attempt to attach a communication skill directly to a non-wording action. If a future milestone identifies a legitimate need, it must change the boundary explicitly rather than silently widening it. This increment does not redesign the broader skill schema.

## Progress log

- 2026-09-14: Inspected the existing package, contracts, registry, engine, tests, and Phase 4 documentation. Confirmed that the package already exists and that duplicating it is unnecessary.
- 2026-09-14: Added the communication-only package boundary, narrowed stored skill actions, added three negative contract cases, and fixed Windows pnpm path filters so skill evaluation rebuilds current packages.
- 2026-09-14: Lint, typecheck, 175 deterministic tests, package build, full build, and the 21-case Phase 4 evaluation passed. `pnpm format:check` still reports 90 pre-existing formatting warnings across the repository; edited source/config files were formatted directly and are not among those warnings.

## Completion record

The existing `@ai-message-coach/skills` package is now explicitly communication-strategy-only. Its definitions can target only rewrite, completion, and suggested-reply wording, preserving the Phase 3 decision boundary at schema validation time. No registry content, selection behavior, provider boundary, or future-milestone infrastructure changed. The next recommended increment is capability-first schema design and evaluation hardening before adding more skills.
