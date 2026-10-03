# SRS-1 — Baseline and trace foundation

Status: complete  
Completed: 2026-09-24  
Scope: private evaluation foundation only; SRS-2 is not authorized

## Outcome

SRS-1 freezes the evidence needed to evaluate later retrieval and selection work
without changing current behavior. It adds private, strict schemas for scenario
annotations and per-candidate stage traces; records the current production and
dirty-worktree baseline; inventories exposed development evidence; and leaves the
held-out set unauthored.

No production code, approved skill definition, generated registry, shared schema,
routing rule, prompt, provider path, or runtime behavior changed.

## Frozen baseline

| Evidence | Frozen value |
| --- | ---: |
| Branch / starting HEAD | `skills` / `a77f476b532c6ddd81eadbca835b312425fd4f1c` |
| Active production definitions | 21 |
| Atomic capabilities | 14 |
| Language modifiers | 7 |
| Approved canonical examples | 210 |
| Phase 7 frozen plans | 153 (21 integration + 132 direct) |
| Phase 4 regression scenarios | 21 |
| Pre-existing files outside SRS-1 paths | 194 |
| Pre-existing content-map digest | `sha256:463abb977f91ba1216fbef656f9a240a3b9051a7efd7c2af89418f7325a008a9` |
| Held-out set | `NOT_AUTHORED`; not sealed |

The content-map digest was recomputed after implementation, excluding only the
declared SRS-1 paths plus worktree metadata and `.env.local`. It remained exactly
equal to the captured value. This proves that SRS-1 did not alter any pre-existing
file; it is completion evidence, not a rule that freezes future phases.

Revision-bound raw hashes for the approved manifest, generated registry, Phase 7
pre-migration fixture, Phase 8 evidence, and authoring approvals are stored in
`baseline.json` and checked by the SRS-1 test.

## Added artifacts

| Artifact | Purpose |
| --- | --- |
| `packages/skills/tests/srs1-foundation.ts` | Private Zod schemas and capability/modifier kind validation |
| `packages/skills/tests/srs1-foundation.test.ts` | Baseline, isolation, and invalid-state integrity tests |
| `packages/skills/tests/fixtures/srs1/baseline.json` | Exact revision-bound baseline evidence |
| `packages/skills/tests/fixtures/srs1/development-inventory.json` | Exposed development sources and representative annotations |
| `.agent/plans/skills-srs-1-foundation.md` | Executed phase plan and acceptance record |

## Trace and annotation decisions

- The schemas are private to skills tests. They do not create a competing public
  contract before a runtime caller exists.
- Capabilities (`ATOMIC` and future `PLAYBOOK`) and `LANGUAGE_MODIFIER` definitions
  use separate expectation and trace lanes.
- Candidate disappearance is represented with closed stages:
  `HARD_ELIGIBILITY`, `RETRIEVAL_CUTOFF`, `RERANK_CUTOFF`, `SUPERVISOR`,
  `FINAL_RESOLUTION`, and `RETAINED`.
- Stage decisions use closed, observable reason codes. Strict objects reject a
  hidden-rationale field rather than storing model reasoning.
- Scenario annotations bind a fixed `AgentAction` to its assistance mode, keep
  required/acceptable/forbidden labels disjoint, support strict `NONE`, and require
  intent, facts, commitments, and uncertainty preservation.
- Phase 8 candidates can appear only as evaluation-only development labels. They
  remain absent from the active 21-definition registry.

## Proposed SRS-2 development corpus

| Source | Exposed cases | Groups | Intended use |
| --- | ---: | ---: | --- |
| Phase 4 regression fixtures | 21 | 21 | Production parity and decision boundaries |
| Approved canonical examples | 210 | 21 | Authoring-boundary evidence |
| Phase 8 candidate fixtures | 32 | 16 | Evaluation-only candidate development evidence |

The inventory includes representative English, Simplified Chinese, code-switching,
strict-`NONE`, rewrite, and evaluation-only candidate annotations. SRS-2 may refine
the grouping and label coverage after explicit approval. No retrieval quality,
ranking uplift, latency, or production-readiness claim is made from this inventory.

The later held-out set must use fresh scenario families authored only after SRS-2
behavior and thresholds are frozen. Translations and paraphrases stay grouped with
their originating development family to prevent leakage.

## Verification

| Command | Result |
| --- | --- |
| `pnpm exec vitest run packages/skills/tests/srs1-foundation.test.ts` | Passed: 1 file, 8 tests |
| `pnpm --filter @ai-message-coach/skills typecheck` | Passed |
| `pnpm skills:check` | Passed; generated registry fresh |
| `pnpm lint` | Passed; generated registry fresh |
| `pnpm typecheck` | Passed: all 6 projects |
| `pnpm format:check` | Passed |
| `pnpm test` | Passed: 31 files, 402 tests |
| `pnpm build` | Passed: all 6 workspace projects |
| `pnpm skills:verify-production` | Passed: 21 exact definitions and 153 ordered plans |
| `pnpm eval:phase4` | Passed: 21/21 action preservation and no-invention; all deterministic metrics `1` |
| `git -c core.safecrlf=false diff --check` | Passed |
| Content-map scope audit | Passed: 194 files and exact baseline digest |

## Acceptance status

All SRS-1 acceptance criteria pass:

- Exact 21-definition, 210-example, and 153-plan evidence is bound and verified.
- Capability and modifier labels cannot be mixed.
- Trace stages and reason codes are closed; hidden rationale is rejected.
- Overlapping, mismatched, strict-`NONE`, and lane-invalid states fail explicitly.
- Phase 8 candidates remain isolated and inactive.
- The dirty pre-existing worktree is byte-for-byte unchanged outside SRS-1 paths.
- The proposed development corpus is documented without performance claims.

## Known limitations and next gate

SRS-1 records trace structure but does not populate live retrieval traces. It does
not implement hard eligibility, Top-K retrieval, reranking, supervision, modifier
selection, final resolution, `SkillPlan`, prompt compilation, or provider calls.
The held-out corpus intentionally does not exist yet.

Stop here. SRS-2 may begin only after the user separately approves the frozen
baseline, private trace representation, and proposed development grouping.
