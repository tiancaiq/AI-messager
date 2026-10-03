# SRS-3A independent Phase 8A evidence-reuse audit review

Status: complete independent review  
Date: 2026-09-28  
Verdict: **FAIL**

## Verdict

The Phase 8A manifest is provenance-preserving and correctly separates modifiers,
unapproved proposals, rejected/quarantined originals, and exact human approvals.
However, it is not yet a trustworthy non-circular source inventory for ranking-corpus
authoring.

One capability lineage, `phase8a-row-planning/A2`, remains eligible for efficacy use
even though it directly overlaps the structural `planning` ↔ `request` neighbor
matrix. This violates the audit's own relationship/evaluation separation rule. The
manifest therefore overstates the eligible evaluation-source population by one.

Do not begin SRS-3 ranking-corpus authoring or annotation until this finding is fixed
and independently rechecked.

## Review scope and method

This review inspected the Phase 8A semantic ledger, focused approval ledger,
remediation and second-review ledgers, all referenced definition YAML, the
[audit report](srs-3-phase8a-evidence-audit.md), the
[manifest](../../packages/skills/tests/fixtures/srs3/phase8a-evidence-manifest.json),
its builder/tests, and the relevant SRS-1, SRS-2, and SRS-2.5 plans and reports.

Independent checks did not rely on the audit report's totals. They:

- recomputed raw SHA-256 and canonical content digests from the source files;
- parsed the actual definition YAML and checked record, definition, and example
  digests for all 210 original rows;
- checked every one of the 34 approval chains against its exact original or
  replacement revision and digest;
- resolved all 350 manifest records back to their source objects and recomputed their
  item digests;
- checked every declared lineage role and all 70 claimed eligible records;
- independently compared every resolved/approved capability lineage against all
  eight capability matrix pairs; and
- searched the machine evidence and builder for ranking-label or raw-content leakage.

No production, source-evidence, manifest, builder, test, ranking, or skill file was
modified by this review. This document is the only review deliverable.

## Verified counts

The source inventory counts are correct:

| Source item                                     | Independently verified |
| ----------------------------------------------- | ---------------------: |
| Original semantic-review rows                   |                    210 |
| Ledger proposals                                |                     71 |
| Remediation replacements                        |                     35 |
| Focused human approval bindings                 |                     34 |
| Exactly approved originals                      |                     20 |
| Exactly approved replacement revisions          |                     14 |
| Original keys without individual human approval |                    176 |
| Skill-boundary records                          |                     21 |
| Neighbor matrices                               |                     13 |
| Capability / modifier-containing matrices       |                  8 / 5 |
| Manifest records                                |                    350 |

The serialized manifest currently contains the claimed conversion totals:

| Conversion outcome             | Manifest count | Independent disposition                                               |
| ------------------------------ | -------------: | --------------------------------------------------------------------- |
| `BOUNDARY_RELATIONSHIP_SOURCE` |             22 | Correct: 14 capability boundaries + 8 capability matrices             |
| `EVALUATION_LABEL_SOURCE`      |             70 | **Incorrect by one after the non-circularity rule is applied**        |
| `MODIFIER_SEPARATION_ONLY`     |             65 | Correct: 7 boundaries + 5 matrices + 53 resolved modifier examples    |
| `FAILURE_ANALYSIS_ONLY`        |            101 | **Should increase by one**                                            |
| `UNAPPROVED_PROPOSAL_EXCLUDED` |             92 | Correct: 71 ledger proposals + 21 unapproved remediation replacements |

The corrected non-circular totals should be 69 evaluation-label-source records and
102 failure-analysis-only records. Source counts and approval counts do not change.

## Provenance findings

**Pass.** All checked source files exist and match the manifest's raw hashes. Every
original row resolves to the referenced YAML and matches its record, definition, and
example digests. Every manifest item digest matches its source object.

All 34 human approval records bind to their exact reviewed content:

- 20 `ORIGINAL_CANONICAL` approvals match the corresponding original example digest;
- 14 `REPLACEMENT_REVISION_1` approvals match the remediation replacement, second
  review, and approval digest chain; and
- no replacement approval is transferred to its original row.

The other 176 originals remain without individual human approval. The 71 ledger
proposals and 21 unapproved remediation replacements remain excluded. No evidence
supports interpreting the focused approval as approval of all 210 examples.

## Circularity findings

### Blocking finding: `planning/A2` is missed by the matrix-overlap detector

The Phase 8A ledger contains the structural capability matrix:

```text
planning ↔ request
```

The resolved original `planning/A2` has:

```text
required:   [planning]
acceptable: [request]
```

Its manifest record is:

| Field                   | Value                                                                     |
| ----------------------- | ------------------------------------------------------------------------- |
| Source key              | `planning/A2`                                                             |
| Source revision         | `ORIGINAL_CANONICAL`                                                      |
| Lineage                 | `phase8a-row-planning/A2`                                                 |
| Item digest             | `sha256:d248694675522eaf10122a65e1c7678e45deccddea066009ab71c68b7a4731e2` |
| Reviewed-content digest | `sha256:4dddb14ff05d22357739e70cd748f7e8f0e689788fde068f36a0694c95a3a8b0` |
| Current outcome / role  | `EVALUATION_LABEL_SOURCE` / `EVALUATION_LABEL_SOURCE`                     |
| Currently eligible      | `true`                                                                    |

The builder first recognizes all eight capability matrices, but its row-to-pair
references are restricted to the separate SRS-3 target-pair list. That target list
does not include `planning` ↔ `request`. Consequently the later overlap check never
sees `planning/A2`, even though the matrix is present and the reviewed selection
explicitly names both endpoints.

An independent comparison against all eight matrix pairs finds 21 overlapping
lineages, not 20. The missing lineage is exactly:

```text
phase8a-row-planning/A2
```

No other extra or missing overlap lineage was found.

### Smallest recommended correction

1. Derive circularity comparisons from every capability matrix pair, independently
   of the ranking-development target-pair list.
2. Reclassify `phase8a-row-planning/A2` as `FAILURE_ANALYSIS_ONLY`, set its role to
   `REGRESSION_FAILURE_ONLY`, make it ineligible for later efficacy annotation, and
   attach `MATRIX_LINEAGE_INDEPENDENCE_UNPROVEN`.
3. Regenerate the manifest and audit report with 21 excluded matrix-overlap lineages,
   69 eligible evaluation sources, 69 evaluation-source lineages, and 146
   regression/failure-only lineages.
4. Add a test that independently iterates all capability matrices and proves no
   resolved/approved row lineage naming either matrix endpoint remains eligible.

Do not change the Phase 8A source ledgers or matrix content.

## Capability and modifier separation findings

**Pass, apart from the capability circularity issue above.** The eight capability
matrices are correctly represented as structural relationship inputs, and the five
modifier-containing matrices remain outside capability efficacy evidence.

The modifier total is exactly 65 records:

- seven modifier boundary records;
- five modifier matrix records; and
- 53 resolved or approved modifier example records.

Every modifier record is in the modifier lane, cannot consume a capability ranking
position, and is excluded from capability Primary@K or pairwise denominators. No
modifier-to-capability leakage was found.

## Label and content leakage findings

**Pass.** The manifest contains no authored primary labels, no `shouldRankAbove`
pairs, no ranking score, and no reranker result. `required`, `acceptable`, and
`forbidden` remain reviewed source classifications and are not converted into a
primary or pairwise order.

The machine manifest contains no raw message, draft, proposed response, free-text
rationale, provider payload, identity, or hidden-reasoning fields. The audit builder
does not call retrieval or ranking code and does not use expected IDs to influence a
runtime path.

## Gap findings

The documented gaps are substantively correct. Phase 8A does not provide a complete
ranking corpus. In particular, it has:

- no independent efficacy coverage for the capability-matrix pairs;
- only both-valid and neither coverage for `request` versus `ask_for_help`;
- no independent coverage for either candidate boundary;
- no `COMPLETE_DRAFT` capability source;
- no Chinese or code-switch capability efficacy source after modifier separation;
- no structured work/personal/service setting field;
- no non-circular `NEIGHBOR_ONLY` source; and
- no `confirmation` capability.

After the required circularity correction, the eligible-source coverage should be:

| Dimension                              | Current manifest |   Corrected |
| -------------------------------------- | ---------------: | ----------: |
| Eligible records / lineages            |          70 / 70 | **69 / 69** |
| `FOCAL_ONLY`                           |               37 |          37 |
| `BOTH_VALID`                           |               13 |      **12** |
| `NEITHER` / strict `NONE`              |          20 / 20 |     20 / 20 |
| `NEIGHBOR_ONLY`                        |                0 |           0 |
| Empty-draft `SUGGEST_REPLY`            |               53 |          53 |
| `REWRITE_DRAFT`                        |               16 |      **15** |
| Non-wording                            |                1 |           1 |
| `COMPLETE_DRAFT`                       |                0 |           0 |
| English                                |               70 |      **69** |
| Simplified / Traditional / code-switch |        0 / 0 / 0 |   0 / 0 / 0 |

These corrected counts are review findings only; this turn did not edit the manifest.

## Production parity

Production verification passes:

- 21 exact ACTIVE definitions;
- 153 ordered frozen plans;
- production context remains `CURRENT`;
- no SRS-3 reranker or relationship sidecar is used at runtime;
- no ranking annotation, provider, prompt, candidate, held-out, database, UI, memory,
  or persistence change was introduced; and
- `confirmation` remains absent.

## Validation results

| Validation                                                      | Result                                                                                                    |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Independent raw/content/definition/example digest recomputation | Pass for all source and manifest records                                                                  |
| Independent 34-approval revision-chain recomputation            | Pass                                                                                                      |
| Independent all-eight-matrix circularity recomputation          | **Fail: 21 overlaps found; manifest excludes 20**                                                         |
| Focused SRS-1/SRS-2/SRS-2.5/Phase 8/SRS-3A tests                | 8 files, 113 tests passed                                                                                 |
| `pnpm skills:check`                                             | Pass; registry fresh                                                                                      |
| `pnpm lint`                                                     | Pass; zero warnings                                                                                       |
| `pnpm typecheck`                                                | Pass; all six projects                                                                                    |
| `pnpm test`                                                     | Pass; 34 files, 465 tests                                                                                 |
| `pnpm build`                                                    | Pass; all six projects                                                                                    |
| `pnpm skills:verify-production`                                 | Pass; 21 definitions / 153 plans                                                                          |
| Manifest regeneration twice                                     | Byte-equivalent object output; SHA-256 `e6be26da8cac8e7f4c22b22e25530f805352a797aa506bd59f76e4451d612bee` |

The passing repository tests do not clear the blocker: the audit test derives its
non-circularity result from the same incomplete target-pair constraint as the builder,
so it does not independently exercise all eight matrix pairs.

## Blocking issues

One blocking issue exists: `planning/A2` is incorrectly eligible for evaluation-source
use despite its direct overlap with the structural `planning` ↔ `request` matrix.

## Nonblocking observations

- The audit is deliberately conservative elsewhere; no evidence was found of broad
  approval transfer, modifier leakage, raw-content leakage, or invented ranking gold.
- The structured-setting gap is represented honestly instead of being inferred from
  prose.
- Separating closed conversion outcomes from closed eligibility bases is internally
  consistent after the prior correction.

## Authorization recommendation

**Do not authorize ranking-corpus authoring or annotation yet.** Apply the smallest
correction above, regenerate the audit artifacts, and repeat this independent review.
This review does not authorize a reranker, relationship sidecar, production cutover,
candidate activation, held-out work, or SRS-4.
