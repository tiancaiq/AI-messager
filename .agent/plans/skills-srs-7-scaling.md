# SRS-7 — Catalog growth and scale-triggered retrieval

Status: proposed — future program; blocked on accepted production integration  
Owner: unassigned  
Updated: 2026-09-24  
Parent direction: [Skill retrieval, selection, and planning](skills-retrieval-selection-direction.md)  
Depends on: [SRS-6](skills-srs-6-production-integration.md)

## Outcome

Grow the approved catalog through measured capability gaps and evolve retrieval technology only when frozen metrics show the current approach no longer meets recall, rank, precision, latency, or operational needs.

## Scope

In scope:

- Repeated scenario → gap classification → compose-or-candidate → atomicity/duplicate review → retrieval/selection/plan evaluation → approval loop.
- Exact revision/manifest approval for each production addition.
- Scale gates: deterministic metadata now; lexical before 100 if needed; evaluate precomputed embeddings/hybrid retrieval around 100–300; broader retrieval/reranking at 300+.
- In-memory indexes before external vector services where practical.
- Per-skill/language/mode/neighbor/`NONE` regression growth.

Out of scope:

- Manufacturing skills to hit a number, automatic promotion, full Skill Factory, vector database by default, graph database, ReAct, hidden model reasoning, or unreviewed memory/relationship features.

## Decisions

- Compose before proliferating.
- A weak generated response is not proof of a missing skill.
- Relevance scores remain uncalibrated until representative labeled data supports calibration.
- Any model reranker/supervisor must beat the deterministic baseline on a frozen set without safety or privacy regression.
- External indexes require measured in-memory limits plus privacy/operations review.

## Staged data flow

```text
Observed classified gap
        ↓ existing composition sufficient?
yes → improve content/retrieval locally
no  → candidate atomicity/neighbor review
        ↓ isolated Top-K/selection/SkillPlan evaluation
        ↓ exact human approval
Approved manifest addition
        ↓ regression and scale metrics
Technology change only if thresholds fail
```

## Implementation increments

1. Establish catalog-growth dashboards/reports from privacy-safe aggregate metrics.
2. Process candidates one exact revision at a time through existing approval controls.
3. At each size threshold, benchmark the current method before proposing infrastructure.
4. Evaluate the smallest next retrieval method offline/shadow first.
5. Adopt only a reviewed winner with rollback and catalog-revision binding.

## Tests and acceptance criteria

- [ ] Every added skill has distinct job, neighbors, hard negatives, multilingual/mode evidence where eligible, and exact approval.
- [ ] Existing composition is the explicit comparator.
- [ ] Required capability recall/ranks, supervisor precision, modifiers, `NONE`, plan quality, preservation, latency, and index size remain visible.
- [ ] No candidate or generated definition enters runtime without manifest approval.
- [ ] Retrieval technology changes are justified by frozen before/after evidence.
- [ ] External infrastructure is absent unless a separate reviewed need is documented.

## Validation

Each increment runs the canonical workspace/production checks plus versioned catalog, retrieval, selection, plan, scale, privacy, and rollback tests appropriate to the selected technology.

## Risks, rollback, and gate

Primary risks are duplicate-skill growth, overfitting, index staleness, privacy expansion, and premature infrastructure. Roll back one catalog revision or retrieval implementation at a time while preserving evidence; never discard failed candidates merely to improve reported counts.

Every catalog addition and every retrieval-technology change is a separate authorization. This phase is not blanket permission for a 1,000-skill build or a Skill Factory.

## Progress and completion record

- 2026-09-24: Plan created; future work not started.
