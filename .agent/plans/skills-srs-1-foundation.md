# SRS-1 — Baseline and trace foundation

Status: complete — SRS-2 not authorized  
Owner: Codex  
Updated: 2026-09-24  
Parent direction: [Skill retrieval, selection, and planning](skills-retrieval-selection-direction.md)

## Outcome

Freeze the current 21-skill behavior and define the private, typed evidence contracts that later phases will populate. This phase makes no retrieval, ranking, selection, planning, prompt, or production-behavior change.

## Scope

In scope:

- Record exact approved-registry, generated-registry, Phase 7 parity, Phase 4 plan, and dirty-worktree baselines.
- Define private/evaluation schemas for definition type, stage names, reason codes, disappearance stage, trace records, and scenario annotations.
- Separate capability labels from modifier labels in fixtures.
- Inventory development cases and group them by scenario family; identify but do not author/unseal the later held-out set.
- Add integrity tests proving later traces cannot masquerade as approvals or production definitions.

Out of scope:

- Hard-eligibility implementation, Top-K, scores, reranking, supervision, modifier selection, resolution, `SkillPlan`, prompt compilation, provider calls, or UI.
- Changes to approved YAML, manifest, generated registry, runtime engine, shared intent tags, candidate activation, or default routing.

## Current state and decisions

- Production has 21 active definitions: 14 atomic capabilities and seven language modifiers.
- Current `select()` combines filtering, scoring, selection, conflict handling, and flat composition.
- Phase 7 freezes 153 production plans; Phase 8 candidates remain isolated.
- Trace schemas stay private until a runtime caller exists. Do not add speculative public contracts.
- `disappearedAt` is enumerated as `HARD_ELIGIBILITY`, `RETRIEVAL_CUTOFF`, `RERANK_CUTOFF`, `SUPERVISOR`, `FINAL_RESOLUTION`, or `RETAINED`.

## Contracts and data flow

```text
Existing synthetic fixture + fixed AgentAction
        ↓
Private scenario annotation
        ↓
Expected capability labels + separate modifier labels
        ↓
Empty typed trace envelope for later phases
```

No conversation content enters ordinary logs. Fixtures are synthetic and revision-bound. Expected labels remain evaluation-only.

## Implementation steps

1. Capture hashes/counts for the 21 definitions, manifest, generated registry, 153 frozen plans, and relevant Phase 8 evidence.
2. Define private strict schemas under the existing skills test/evaluation area; avoid a parallel production contract.
3. Add scenario-family, assistance-mode, language, required/acceptable/forbidden capability, modifier, preservation-ledger, and reviewer fields.
4. Add schema/integrity/staleness tests and document the baseline.
5. Run validation, publish the SRS-1 report, and stop for review.

## Tests and acceptance criteria

- [x] All 21 runtime definitions and 153 frozen plans match exactly.
- [x] Capability and modifier labels cannot be mixed accidentally.
- [x] Trace stages/reason codes are closed enums; no hidden rationale field exists.
- [x] Empty/duplicate/impossible annotations fail explicitly.
- [x] Phase 8 candidate evidence remains isolated and inactive.
- [x] Only SRS-1-owned private fixtures/tests/docs change; production code and behavior remain unchanged.
- [x] The report identifies the proposed SRS-2 development corpus without claiming retrieval performance.

## Validation

Run targeted schema/integrity tests plus `pnpm skills:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm skills:verify-production`, `pnpm eval:phase4`, `pnpm format:check`, and Git whitespace checks.

## Risks, rollback, and gate

Risk: a private evaluation schema becomes a second source of truth. Mitigation: bind every ID/revision to the approved registry and delete the private schema if SRS-2 cannot consume it. Rollback is removal of SRS-1-only artifacts; never reset unrelated dirty work.

Completion authorizes nothing beyond review. SRS-2 starts only after the user approves the exact baseline, trace representation, and development-case grouping.

## Progress and completion record

- 2026-09-24: Plan created and explicitly authorized as “implement SRS 1.”
- 2026-09-24: Captured the exact dirty-worktree, 21-definition, 210-example,
  153-plan, and Phase 8 evidence baselines.
- 2026-09-24: Added private strict scenario/trace schemas, a development-source
  inventory, representative annotations, and eight integrity tests. No production
  contract or runtime file changed.
- 2026-09-24: All required checks passed. Completion evidence is recorded in
  [the SRS-1 report](../../docs/skills/srs-1-baseline-trace-foundation.md).
- 2026-09-24: Stopped at the phase gate. SRS-2 requires separate user approval.
