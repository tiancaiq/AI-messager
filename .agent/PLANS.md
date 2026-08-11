# Milestone execution plans

Use an execution plan for any milestone that spans multiple packages, changes a public contract, handles sensitive data, or is expected to take more than one working session. Small documentation corrections and isolated fixes do not require one.

Plans are living implementation documents. Store an active plan in `.agent/plans/<milestone-id>.md`; create that directory only when the first implementation plan is approved.

## Required plan sections

Each plan must be understandable without relying on chat history and include:

1. **Outcome** — the user-visible capability delivered by this milestone.
2. **Scope** — explicit in-scope and out-of-scope work, linked to `docs/roadmap.md`.
3. **Current state** — relevant files, components, behavior, and constraints found by repository inspection.
4. **Assumptions and decisions** — important choices, alternatives, and why the selected option is appropriate now.
5. **Contracts and data flow** — schemas or boundaries being added or changed, including sensitive-data handling.
6. **Implementation steps** — ordered, independently verifiable increments with exact file areas, not vague tasks.
7. **Tests and evaluation** — unit, integration, fixture, manual, and live-model checks as applicable.
8. **Acceptance criteria** — observable pass/fail statements copied or refined from the roadmap.
9. **Validation commands** — canonical lint, typecheck, test, and build commands plus milestone-specific checks.
10. **Risks, rollback, and limitations** — failure modes, reversible steps, deferred work, and any migration impact.
11. **Progress log** — dated checklist updates and newly discovered facts.
12. **Completion record** — results, deviations, commands run, remaining limitations, and the recommended next milestone.

## Planning rules

- One plan covers one active milestone. Do not hide future-milestone implementation inside “cleanup.”
- Write acceptance criteria before implementation begins.
- Name concrete modules and boundaries after inspecting the repository; do not guess paths from this document.
- Prefer the smallest end-to-end slice that proves the milestone outcome.
- If implementation reveals a material product or architecture change, update the plan before proceeding.
- Separate deterministic tests from live-provider calls. Default CI must not require API credentials.
- A provider-integration plan must identify capability requirements, adapter boundaries, credential flow, request topology, output validation, normalized errors, and whether private content touches application-operated infrastructure.
- Plans must state how screenshots, message text, drafts, identity evidence, and model payloads are retained or discarded.
- A milestone is complete only after acceptance criteria and validation gates pass, or exceptions are explicitly documented and approved.

## Suggested status header

```md
Status: proposed | approved | in progress | blocked | complete
Owner: <name or agent>
Started: YYYY-MM-DD
Updated: YYYY-MM-DD
Roadmap milestone: <id and link>
```

The architecture-foundation work predates Phase 0 and is represented by the repository's root and `docs/` files rather than a Phase 0 execution plan.
