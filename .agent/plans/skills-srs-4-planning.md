# SRS-4 — SkillPlan and Prompt Compiler

Status: proposed — blocked on accepted SRS-3  
Owner: unassigned  
Updated: 2026-09-24  
Parent direction: [Skill retrieval, selection, and planning](skills-retrieval-selection-direction.md)  
Depends on: [SRS-3](skills-srs-3-selection.md)

## Outcome

Convert resolved capabilities/modifiers into one private shadow `SkillPlan` representation and compile it into compact provider-neutral guidance without changing the production prompt path.

## Scope

In scope:

- Define one plan representation with `DIRECT` and `PLANNED` modes.
- Attribute every step/avoidance to selected capabilities, modifiers, or global preservation invariants.
- Preserve intent, facts, commitments, uncertainty, ownership, language, and fixed `AgentAction`.
- Deterministically order, deduplicate, resolve tested contradictions, and enforce budgets.
- Compile equivalent plans back to the existing `CommunicationGuidance` shape for parity checks.

Out of scope:

- Two planner implementations, production prompt wiring, provider changes/calls, aesthetic judging, response-verifier dependency, playbooks, or candidate activation.

## Current state and decisions

- Current `CommunicationPlan` is flat selected skills plus `principles`/`avoid`.
- `DIRECT` is a smaller plan, not a separate pipeline.
- The provisional schema stays private until SRS-5 evidence supports a public contract.
- Scores, ranks, IDs, reason codes, registry content, and expected labels never enter provider guidance.

## Contracts and data flow

```text
Resolved capabilities + modifiers + fixed action/mode
        ↓ one deterministic planner
SkillPlan(mode DIRECT or PLANNED)
        ↓ one prompt compiler
Existing compact CommunicationGuidance
```

## Implementation steps

1. Freeze accepted SRS-3 resolved sets and preservation ledgers.
2. Define the private strict `SkillPlan` schema and one mode-decision rule.
3. Implement source-attributed steps/avoidances, ordering, budgets, and contradiction checks.
4. Implement one compiler for both modes.
5. Compare compiled bytes/semantics with the Phase 4 baseline where equivalent.
6. Report plan-quality results and stop.

## Tests and acceptance criteria

- [ ] `DIRECT` and `PLANNED` use one schema, planner, and compiler.
- [ ] `NONE`/`FAILED` cannot contain stale guidance.
- [ ] Every instruction has valid source attribution.
- [ ] Exact duplicates are removed and tested contradictions are resolved or rejected.
- [ ] Rewrite and empty-draft plans preserve their different evidence boundaries.
- [ ] Provider guidance excludes internal metadata.
- [ ] Equivalent baseline scenarios retain reviewed guidance; deviations are explicit.
- [ ] Production prompt/runtime remains unchanged.

## Validation

Run focused plan/compiler/parity tests and the complete parent-plan validation set.

## Risks, rollback, and gate

Risk: a second planner persists indefinitely. The SRS-5 decision must either recommend promotion to one public contract or removal/revision; do not maintain two production planners. Rollback removes the private plan/compiler.

SRS-5 starts only after the user approves the provisional schema, mode rule, budgets, and parity report.

## Progress and completion record

- 2026-09-24: Plan created; blocked on SRS-3.
