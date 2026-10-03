# SRS-3 — Supervisor, modifier selection, and final resolution

Status: proposed — blocked on accepted SRS-2  
Owner: unassigned  
Updated: 2026-09-24  
Parent direction: [Skill retrieval, selection, and planning](skills-retrieval-selection-direction.md)  
Depends on: [SRS-2](skills-srs-2-retrieval.md)

## Outcome

Select the useful capability subset or `NONE`, select modifiers through a separate path, and deterministically enforce structural validity. Production behavior remains unchanged.

## Scope

In scope:

- Give the deterministic capability supervisor Top-K evidence, definition type, conflicts, and dependencies when they exist.
- Produce selected/rejected capabilities with concise reason codes.
- Select zero or more eligible language/delivery modifiers separately from capability retrieval.
- Use separate configurable capability and modifier budgets.
- Re-enforce conflicts/prerequisites in a deterministic final resolver and record `disappearedAt`.

Out of scope:

- `SkillPlan`, prompt compilation, production integration, model supervisor, new dependencies, candidate activation, or provider calls.

## Current state and decisions

- Current production greedily selects up to four mixed definitions.
- SRS-3 preserves that output through the compatibility path while measuring the typed shadow path.
- Conceptual starting budgets are zero to four capabilities plus zero to two modifiers; they are experimental settings, not permanent contracts.
- The supervisor may propose only structurally informed combinations; the resolver remains the final safety gate.

## Contracts and data flow

```text
Capability Top-K + conflict/dependency metadata
        ↓ deterministic supervisor
Proposed capabilities / rejected capabilities

Eligible modifiers + fixed context + proposed capabilities
        ↓ separate modifier selector
Modifier decisions

Both proposed sets
        ↓ deterministic resolver
Resolved capabilities + modifiers + disappearance traces
```

## Implementation steps

1. Freeze the accepted SRS-2 retrieval output for supervisor development cases.
2. Implement enumerated capability selection/rejection reasons.
3. Implement separate modifier eligibility/selection and typed budgets.
4. Implement deterministic final resolution and disappearance tracing.
5. Measure required/acceptable/forbidden/unnecessary/`NONE`, modifier, and conflict outcomes.
6. Report results and stop.

## Tests and acceptance criteria

- [ ] Capability and modifier selections use separate inputs, outputs, metrics, and budgets.
- [ ] `NONE` and zero-modifier results are valid.
- [ ] The supervisor sees structural constraints before proposing a set.
- [ ] The resolver catches invalid combinations even if proposed upstream.
- [ ] Required, acceptable, forbidden, unnecessary, and strict-`NONE` cases are measured separately.
- [ ] Modifiers never change refusal, intent, facts, commitments, or uncertainty.
- [ ] Exact production compatibility, candidate isolation, and language eligibility remain green.

## Validation

Run focused supervisor/modifier/resolver tests and the complete parent-plan validation set.

## Risks, rollback, and gate

Risk: reason codes encode free-form hidden rationale. Use closed observable codes only. Risk: modifiers crowd capabilities; prevent this structurally rather than with scoring tweaks. Rollback removes the shadow decision stages.

SRS-4 starts only after the user approves typed budgets, reason codes, `NONE` behavior, and resolution results.

## Progress and completion record

- 2026-09-24: Plan created; blocked on SRS-2.
