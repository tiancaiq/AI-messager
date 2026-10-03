# SRS-3 Phase 8A evidence-reuse audit

Status: audit gate complete; awaiting independent review  
Date: 2026-09-28  
Scope: existing Phase 8A provenance and reuse eligibility only

## Result

The Phase 8A evidence set is usable as a provenance-bound source inventory, but it is
not a ready-made SRS-3 ranking corpus. The audit accounts for every original row,
proposal, approved replacement, boundary record, neighbor matrix, and focused human
approval binding without changing any source artifact.

Of 143 semantically resolved or exactly approved source records, 53 are modifier-lane
material and 21 capability row lineages cannot be proven independent of the eight
capability matrices. Those records are restricted to modifier separation or
regression/failure use. The remaining 69 capability records are eligible only as
sources for later, separately validated annotations. This audit authors **zero**
primary labels and **zero** pairwise labels.

No ranking scenario, ranking annotation, relationship sidecar, reranker, production
change, or gap-filling case was created.

## Immutable source bindings

| Source                                                                | Raw SHA-256                                                        |
| --------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `packages/skills/tests/fixtures/phase8/codex-semantic-review.json`    | `16b6a2606b7b6f3724a0c3f4fce899b261709c6f88ceab4a303fdbc3efc58dec` |
| `packages/skills/tests/fixtures/phase8/focused-human-approval.json`   | `a755dba45b4e522981de9246672d4b37f49b38316d564ec4e475b87d294c8c2a` |
| `packages/skills/tests/fixtures/phase8/weak-invalid-remediation.json` | `16d5a358a1cd747428dd0f2574cf9707584a23de3a9b07625abe38947c9d9fd5` |
| `packages/skills/tests/fixtures/phase8/weak-invalid-rereview.json`    | `262cf217be3e8d06feb0b8c0a24e1057607698623f70f2ea32dbde05e7ed63bc` |
| `docs/skills/phase-8-codex-semantic-review.md`                        | `224b788f47a26ee29461adb4fe2d39e8900d5fc17a59b0d85530a7b35f040dc6` |

The validator also checks every recorded definition file raw hash, definition digest,
record digest, original example digest, remediation row digest, second-review row
digest, approval digest, and approval-set digest. A missing file, duplicate key,
unknown decision, stale definition, or mismatched replacement chain fails the audit.

## Source inventory

| Item                                                            |            Count |
| --------------------------------------------------------------- | ---------------: |
| Original semantic-review rows                                   |              210 |
| Original decisions: `KEEP` / `REVISE` / `REJECT` / `QUARANTINE` | 129 / 71 / 4 / 6 |
| Ledger proposals attached to `REVISE` rows                      |               71 |
| Remediation replacements                                        |               35 |
| Focused human approval bindings                                 |               34 |
| Exact approved originals                                        |               20 |
| Exact approved replacement revisions                            |               14 |
| Original keys without individual human review                   |              176 |
| Skill-boundary records                                          |               21 |
| Neighbor matrices                                               |               13 |
| Capability matrices / modifier-containing matrices              |            8 / 5 |
| Total conversion records                                        |              350 |

The 34 human decisions do not approve all 210 originals. Approval attaches to the
exact reviewed revision and digest. The 14 approved replacements do not retroactively
approve their original `REVISE`, `REJECT`, or `QUARANTINE` rows.

## Conversion accounting

| Conversion outcome             | Records | Permitted use                                                                                                    |
| ------------------------------ | ------: | ---------------------------------------------------------------------------------------------------------------- |
| `BOUNDARY_RELATIONSHIP_SOURCE` |      22 | Fourteen capability boundaries plus eight capability matrices; structural relationship design only               |
| `EVALUATION_LABEL_SOURCE`      |      69 | Capability source material eligible for later annotation; no primary or pairwise truth is authored here          |
| `MODIFIER_SEPARATION_ONLY`     |      65 | Seven modifier boundaries, five modifier matrices, and 53 resolved modifier examples; separation/regression only |
| `FAILURE_ANALYSIS_ONLY`        |     102 | 81 rejected, quarantined, revised, invalid, or unresolved originals plus 21 matrix-overlap lineages              |
| `UNAPPROVED_PROPOSAL_EXCLUDED` |      92 | All 71 ledger proposals plus 21 remediation replacements lacking exact human approval                            |

Approval-state counts across the 350 records are 34 exact human approvals, 109
Codex-resolved development records, 173 unapproved records, and 34 boundary/matrix
records for which item-level approval is not applicable.

The manifest contains the exact key, source artifact and digest, reviewed revision,
item/content digest, reviewer type, decision, confidence, approval state and digest,
definition bindings, closed outcome, lineage, role, reviewed
required/acceptable/forbidden sets, and closed exclusion codes for every record. It
contains no message text, drafts, proposed wording, rationales, or hidden reasoning.

## Non-circular lineage assignment

Direct duplicate/paraphrase groups from the Phase 8A ledger share one lineage. An
original and every proposal or replacement for the same source key also share one
lineage.

| Lineage role                        | Deduplicated lineages |
| ----------------------------------- | --------------------: |
| Relationship source                 |                    22 |
| Evaluation-label source eligibility |                    69 |
| Regression/failure only             |                   146 |
| Total                               |                   237 |
| Relationship/evaluation overlap     |                     0 |

The source artifacts do not prove that row families describing a capability matrix
were authored independently of that matrix. The audit therefore excludes 21 such
row lineages from efficacy use with
`MATRIX_LINEAGE_INDEPENDENCE_UNPROVEN`. They remain regression/failure evidence.
Structural checks over the eight capability matrices must not enter later Primary@K,
MRR, pairwise-uplift, or threshold denominators.

The 143 resolved-or-approved records reduce to 137 lineages before role separation.
After modifier separation and the conservative matrix-overlap exclusion, 69 raw
records in 69 lineages remain eligible as later evaluation-label sources.

### Circularity-remediation root cause

The original overlap classifier derived each row's comparable pairs through the
12-pair future ranking-target list. That list intentionally omits the structural
`planning` ↔ `request` matrix, so `planning/A2` never reached the eight-matrix overlap
test even though its focal capability is `planning` and its reviewed neighbor set
contains `request`. This was a deterministic matrix-pair matching bug, not a lineage,
approval, or source-role exception.

The corrected classifier compares every eligible capability row's focal capability
and complete neighbor set directly with all eight structural capability-matrix pairs.
The ranking-target list remains limited to coverage reporting. Under the general
rule, `phase8a-row-planning/A2` is now `FAILURE_ANALYSIS_ONLY`, carries
`MATRIX_LINEAGE_INDEPENDENCE_UNPROVEN`, and has the
`REGRESSION_FAILURE_ONLY` lineage role. No literal-key exclusion was added.

## Capability and modifier matrices

Capability relationship sources:

| Matrix                                  | Lane                    |
| --------------------------------------- | ----------------------- |
| `apology` ↔ `acknowledge_mistake`       | capability relationship |
| `emotional_validation` ↔ `reassurance`  | capability relationship |
| `boundary_setting` ↔ `decline`          | capability relationship |
| `boundary_setting` ↔ `de_escalation`    | capability relationship |
| `status_update` ↔ `expectation_setting` | capability relationship |
| `planning` ↔ `request`                  | capability relationship |
| `follow_up` ↔ `request`                 | capability relationship |
| `clarification` ↔ `request`             | capability relationship |

Modifier separation sources:

| Matrix                                                    | Lane                |
| --------------------------------------------------------- | ------------------- |
| `en.direct_but_polite` ↔ `boundary_setting`               | modifier separation |
| `en.direct_but_polite` ↔ `request`                        | modifier separation |
| `zh.politeness_calibration` ↔ `zh.professional_formality` | modifier separation |
| `zh.politeness_calibration` ↔ `zh.natural_conciseness`    | modifier separation |
| `zh.professional_formality` ↔ `zh.natural_conciseness`    | modifier separation |

No modifier row or matrix is eligible for capability ranking relationships or
capability efficacy metrics.

## Coverage after deduplication and role separation

Coverage below uses only the 69 non-circular capability source records. `Raw` and
`deduplicated` are equal because every remaining eligible record has a distinct
lineage.

### Boundary shape

| Shape                | Raw | Deduplicated |
| -------------------- | --: | -----------: |
| `FOCAL_ONLY`         |  37 |           37 |
| `BOTH_VALID`         |  12 |           12 |
| `NEITHER`            |  20 |           20 |
| `NEIGHBOR_ONLY`      |   0 |            0 |
| Strict `NONE` subset |  20 |           20 |

Required, acceptable, and forbidden sets remain exactly as reviewed. A resolved row
does not acquire a primary label or pairwise order merely because it is eligible as
a source. Multi-required and no-primary cases remain permitted.

### Assistance mode and action

| Dimension       | Value                       | Raw | Deduplicated |
| --------------- | --------------------------- | --: | -----------: |
| Assistance mode | Empty-draft `SUGGEST_REPLY` |  53 |           53 |
| Assistance mode | `REWRITE_DRAFT`             |  15 |           15 |
| Assistance mode | Non-wording                 |   1 |            1 |
| Assistance mode | `COMPLETE_DRAFT`            |   0 |            0 |
| Action          | `SUGGEST_REPLY`             |  53 |           53 |
| Action          | `REWRITE_DRAFT`             |  15 |           15 |
| Action          | `ASK_CLARIFICATION`         |   1 |            1 |

Rewrite and empty-draft suggestion are present. Complete-draft capability evidence is
absent.

### Language and setting

| Dimension | Value                                      | Raw | Deduplicated |
| --------- | ------------------------------------------ | --: | -----------: |
| Language  | English                                    |  69 |           69 |
| Language  | Simplified Chinese                         |   0 |            0 |
| Language  | Traditional Chinese                        |   0 |            0 |
| Language  | Code switching                             |   0 |            0 |
| Setting   | Structurally labeled work/personal/service |   0 |            0 |
| Setting   | Unavailable in source schema               |  69 |           69 |

Chinese and code-switching rows are modifier-oriented in this source set and remain
separation evidence. The source schema has no structured setting field, so the audit
does not infer work, personal, or service labels from prose.

## Pair coverage and remaining gaps

The relationship-matrix column identifies structural inputs. Evaluation shapes use
only the non-circular eligible row lineages. `A`, `B`, `Both`, and `Neither` are
deduplicated counts.

| Pair                                               | Matrix |   A |   B | Both | Neither | Missing evaluation shapes      |
| -------------------------------------------------- | ------ | --: | --: | ---: | ------: | ------------------------------ |
| request / clarification                            | yes    |   0 |   0 |    0 |       0 | all four                       |
| request / ask-for-help                             | no     |   0 |   0 |    5 |       1 | A-only, B-only                 |
| request / constructive feedback                    | no     |   0 |   0 |    0 |       0 | all four; candidate unresolved |
| follow-up / request                                | yes    |   0 |   0 |    0 |       0 | all four                       |
| boundary / decline                                 | yes    |   0 |   0 |    0 |       0 | all four                       |
| boundary / de-escalation                           | yes    |   0 |   0 |    0 |       0 | all four                       |
| planning / expectation                             | no     |   0 |   0 |    0 |       0 | all four                       |
| planning / status                                  | no     |   0 |   0 |    0 |       0 | all four                       |
| apology / acknowledge mistake                      | yes    |   0 |   0 |    0 |       0 | all four                       |
| emotional validation / reassurance                 | yes    |   0 |   0 |    0 |       0 | all four                       |
| emotional validation / perspective acknowledgement | no     |   0 |   0 |    0 |       0 | all four; candidate unresolved |
| status / expectation                               | yes    |   0 |   0 |    0 |       0 | all four                       |

The zeroes beside existing matrices are intentional. Their potentially related row
lineages are excluded from efficacy until independence can be established or new
independent cases are separately authorized.

Remaining audit gaps are:

- no structured work, personal, or service setting labels;
- no complete-draft capability source;
- no Simplified Chinese, Traditional Chinese, or code-switching capability efficacy
  source after modifier separation;
- no non-circular `NEIGHBOR_ONLY` source;
- the pair-shape gaps listed above;
- unresolved candidate boundaries for `give_constructive_feedback` and
  `perspective_acknowledgement`; and
- absent `confirmation`, which remains neither a production nor evaluation catalog
  capability.

These gaps are findings only. They do not authorize scenario creation in this audit
increment.

## Production and privacy boundary

- Production remains on `CURRENT` with 21 ACTIVE definitions and 153 frozen plans.
- Runtime definitions, schemas, metadata, generated registry, selection, composition,
  prompts, providers, apps, and persistence are unchanged.
- No ranking relationship, annotation, scenario, reranker, provider call, held-out
  artifact, commit, merge, or push was created.
- Held-out evidence remains `NOT_AUTHORED`, unread, and unscored.
- The machine manifest contains no raw message, draft, proposed response, rationale,
  identity, provider payload, real-user data, or hidden reasoning.

## Validation

Commands and final results:

1. `vitest run` over the focused SRS-3A audit, independent Phase 8 integrity,
   Phase 8 review/candidate, SRS-1, SRS-2, SRS-2.5, and skill-context suites — 8
   files and 113 tests passed. The general regression derives all eight structural
   capability pairs from matrix records, finds every overlapping eligible row
   lineage, and requires all 21 lineages to be failure-only and ineligible.
2. The manifest builder and repository formatter wrote the manifest twice. Both
   outputs were byte-identical with SHA-256
   `0700162fd5b7c656c1d6134cdd3d69baa9a824eb4a01a598b7ea6d4b4c666362`.
   A separate in-memory rebuild matched the checked-in object and had canonical
   object SHA-256
   `176dc3054ee6ff218eeeb8ccc4c24364a0e3fe1238a8feb0e7d67c332068dc4f`.
3. The independent lineage recomputation checked all eight capability matrices,
   found 21 overlap lineages, zero evaluation-eligible overlap records, and
   relationship/evaluation overlap `0`.
4. `pnpm skills:check` — generated registry fresh.
5. `pnpm skills:verify-production` — 21 exact definitions, 153 ordered plans,
   public exports, deep freezing, and authoring exclusion passed.
6. `pnpm lint` — passed with zero warnings.
7. `pnpm typecheck` — all six workspace projects passed.
8. `pnpm test` — 34 files and 465 tests passed.
9. `pnpm build` — all six workspace projects built successfully.
10. `pnpm format:check` — all matched files passed.
11. `git -c core.safecrlf=false diff --check` — passed.

## Review gate

The exact included/excluded key manifest is
`packages/skills/tests/fixtures/srs3/phase8a-evidence-manifest.json`. Independent
review is required before any gap-filling case, ranking annotation, relationship
sidecar, or reranker work begins.
