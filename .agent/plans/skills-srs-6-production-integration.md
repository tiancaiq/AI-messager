# SRS-6 — Production integration

Status: proposed — blocked on an accepted SRS-5 `READY` decision  
Owner: unassigned  
Updated: 2026-09-24  
Parent direction: [Skill retrieval, selection, and planning](skills-retrieval-selection-direction.md)  
Depends on: [SRS-5](skills-srs-5-shadow-evaluation.md)

## Outcome

Integrate the reviewed retrieval/selection/planning path behind a reversible production flag while preserving the fixed `AgentAction`, privacy boundary, one-call normal generation path, and safe fallback.

## Scope

In scope:

- Finalize only contracts proven by SRS-5 to have production callers.
- Wire the reviewed pipeline into `packages/skills` and `packages/ai` behind an explicit flag/default decision.
- Keep the compatibility selector available for rollback during the bounded migration.
- Compile `SkillPlan` to the existing provider-neutral guidance boundary.
- Add production observability using IDs/codes/counts only, never conversation content.

Out of scope:

- New candidates or skill content, database/UI work, second model call, aesthetic verifier, embeddings, external indexes, or automatic sending.

## Current state and decisions

- SRS-6 may begin only from an exact SRS-5 `READY` revision.
- Candidate activation remains a separate per-candidate authorization.
- The renderer must not receive private traces or provider secrets.
- Failure falls back safely without changing action/intent; `FAILED` remains distinct from `NONE`.

## Data flow

```text
Fixed AgentAction + request-scoped context
        ↓ reviewed skill pipeline (flagged)
SkillPlan
        ↓ prompt compiler
Compact provider-neutral guidance
        ↓ existing generator (one normal call)
Reviewable response
```

## Implementation steps

1. Bind integration to the exact accepted SRS-5 catalog/contracts/digests.
2. Promote only necessary private contracts and remove duplicate private representations.
3. Add flagged production wiring and compatibility fallback.
4. Validate privacy-safe inspection hooks and prompt minimization.
5. Run regression, migration, failure, retry, and rollback checks.
6. Request explicit enablement/default-switch authorization and stop.

## Tests and acceptance criteria

- [ ] Fixed action, selected intent, facts, commitments, uncertainty, ownership, and language survive.
- [ ] One normal provider call remains the default.
- [ ] Capabilities/modifiers retain typed budgets and no crowd-out.
- [ ] Internal IDs/scores/reasons/registry never enter provider prompts.
- [ ] Safe fallback preserves user selection and distinguishes `NONE`/`FAILED`.
- [ ] Compatibility and reviewed-path comparisons are revision-bound and explain every intended difference.
- [ ] Rollback can restore the compatibility path without data migration.
- [ ] No candidate activation is bundled with integration.

## Validation

Run full workspace and production checks, targeted integration/prompt/privacy/retry/fallback tests, Phase 4 and SRS-5 regressions, packaging checks, and an explicit manual gate before changing the default flag.

## Risks, rollback, and gate

Risk: the compatibility path becomes permanent duplicated architecture. Set a reviewed removal gate after the bounded rollout. Rollback flips the reviewed path off and restores the unchanged compatibility selector; no user data migration exists.

SRS-7 and any default switch require separate authorization after production evidence is reviewed.

## Progress and completion record

- 2026-09-24: Plan created; blocked on SRS-5.
