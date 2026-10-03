# SRS-5 — Integrated shadow evaluation

Status: proposed — blocked on accepted SRS-4  
Owner: unassigned  
Updated: 2026-09-24  
Parent direction: [Skill retrieval, selection, and planning](skills-retrieval-selection-direction.md)  
Depends on: [SRS-4](skills-srs-4-planning.md)

## Outcome

Evaluate the complete shadow pipeline by stage and issue an evidence-backed `READY`, `REVISE`, or `DEFER` recommendation for production integration. Production remains unchanged.

## Scope

In scope:

- Join accepted SRS-1–SRS-4 stages in one deterministic debug harness.
- Run reviewed development and sealed/fresh held-out scenario groups.
- Cover paired `REWRITE_DRAFT` and empty-draft `SUGGEST_REPLY`, English, Simplified/Traditional Chinese, code-switching, unsupported languages, hard neighbors, conflicts, and strict `NONE`.
- Report eligibility, retrieval, ranking, supervisor, modifier, resolution, plan, preservation, latency, and disappearance-stage metrics.
- Reuse Phase 8 evidence as development evidence and classify the numeric-anchor issue as generation/verifier-harness evidence.
- Perform only basic response reasonableness/preservation checks; detailed wording preference remains external.

Out of scope:

- Production switching, candidate activation, threshold tuning after holdout inspection, broad live A/B judging, or a blocking response verifier.

## Current state and decisions

- Canonical Phase 5/8 cases are exposed development data.
- Fresh held-out cases must be grouped by scenario family; translations/paraphrases cannot cross splits.
- Empty suites are invalid, and every metric reports counts/denominators.
- Any live provider use requires separate provider/model/budget/retention authorization; default SRS-5 is offline.

## Data flow

```text
Reviewed scenario
  → eligibility trace
  → capability Top-K/ranks
  → capability and modifier decisions
  → final resolution
  → SkillPlan
  → compiled guidance
  → stage metrics and failure classification
```

## Implementation steps

1. Freeze algorithms, thresholds, catalog digests, and split membership before held-out evaluation.
2. Integrate the deterministic harness and privacy-safe Markdown/JSON report.
3. Run development cases; fix only classified stage-local defects and add regressions.
4. Seal the implementation, run held-out once, and preserve failures.
5. Audit production isolation and basic generation preservation evidence.
6. Issue `READY`, `REVISE`, or `DEFER` with limitations and stop.

## Tests and acceptance criteria

- [ ] Every scenario shows where each expected capability disappeared or that it was retained.
- [ ] Core retrieval metrics include Recall@5/10, required coverage/all-found, every required rank, and forbidden Top-K presence.
- [ ] Supervisor, modifier, resolution, `NONE`, and plan metrics are reported separately.
- [ ] No aggregate hides a weak skill, language, assistance mode, or strict-`NONE` slice.
- [ ] No held-out leakage or post-result threshold change occurs.
- [ ] The response verifier is not a completion blocker.
- [ ] Exact production behavior and the 21-skill boundary remain unchanged.
- [ ] The readiness recommendation identifies every failed/unrun gate.

## Validation

Run the deterministic harness, focused stage tests, all workspace/production/Phase 4 checks, formatting, whitespace, and a read-only scope audit. Live commands are absent unless separately authorized.

## Risks, rollback, and gate

Risk: exposed scenarios masquerade as generalization. Report development and held-out separately. Risk: one headline metric hides multi-skill failures. Require per-stage/per-slice counts. Rollback removes only the integrated harness/report wiring.

SRS-6 begins only after explicit user acceptance of a `READY` revision and a production-integration plan. `REVISE` or `DEFER` returns work to the named owning phase.

## Progress and completion record

- 2026-09-24: Plan created; blocked on SRS-4.
