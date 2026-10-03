# Phase 7 — Registry migration implementation record

Status: complete. Implemented: 2026-09-17. Branch: `skills`. Worktree: `C:\Users\b\Documents\ChatGPT\AI messager-skills`.

**21 / 21 existing definitions migrated**, with exact normalized runtime value parity and complete ordered selection/composition parity. Runtime approval is inherited only from the unchanged frozen baseline. **210 / 210 canonical examples remain pending human review** and are excluded from runtime and provider prompts.

## 1. Authority and scope

The original documentation-only handoff was superseded by the user's explicit instruction to implement Phase 7. The user subsequently approved policy 1: carry forward existing runtime approval only on exact baseline parity, while canonical examples remain separate authoring/evaluation evidence awaiting human review. The Skills planning task supervised the implementation and independently verified the original committed registry, current registry and test evidence.

This is Phase 7 of the communication research sequence, not a new application roadmap milestone. It refactors the existing application Phase 4 registry. There are still exactly 21 ACTIVE version-1 definitions: 14 universal, three English modifiers and four Chinese modifiers.

| Input                                                                                        | Authority                                                                                     |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| [Phase 3 normalization](phase-3-capability-normalization.md)                                 | Capability boundaries and the eight atomic families.                                          |
| [Phase 4 registry design](phase-4-registry-design.md)                                        | YAML wrapper, explicit approval manifest, static runtime projection and stable public export. |
| [Phase 5 canonical material](phase-5-registry-expansion.md)                                  | Retained P/N/H/A examples; proposed revised runtime wording was not adopted.                  |
| [Phase 6 evaluation design](phase-6-evaluation-design.md)                                    | Migration, negative-input, language and composition verification.                             |
| [Product behavior](../product-behavior.md), [privacy](../privacy.md), [skills](../skills.md) | Fixed action/intent, language, provider and privacy invariants.                               |
| [Execution plan](../../.agent/plans/skills-phase-7-registry-migration.md)                    | Implementation decisions, acceptance and progress.                                            |

No candidate, playbook, new intent/situation tag, retrieval, embedding, memory, relationship-routing, Skill Factory, provider transport, desktop UI or sending behavior was added. No live provider calls, commits, merges or pushes were performed.

## 2. Baseline and historical evidence

Starting revision: `a77f476b532c6ddd81eadbca835b312425fd4f1c`. The worktree initially contained only untracked research documents under `docs/skills/`; the separate DB checkout was not changed.

Before any runtime edits, the running original modules produced the immutable historical fixture at `packages/skills/tests/fixtures/pre-migration.json`:

- 21 normalized definition objects, including helper-injected defaults and original registry order.
- 21 integration contexts and full plans from the existing fixture suite.
- 132 direct/synthetic context-plan probes for action/language/filter/bound/conflict/deduplication/cap behavior.
- Baseline revision, source-file SHA-256 values and an explicit historical-only notice.

The fixture is test evidence, never a runtime data source. No automatic baseline-regeneration script is retained. Its exact captured bytes are excluded from formatting. Source-file hashes describe the original Windows working files, including their line endings; later formatter normalization did not change the Git-normalized engine/contracts/context source.

The supervising task independently evaluated the original registry from the starting commit and confirmed equality with both the frozen fixture and the migrated public registry.

## 3. Implemented architecture

```text
packages/skills/
  definitions/
    atomic/<family>/<id>.yaml       # 14 existing universal definitions
    modifiers/en/<name>.yaml        # 3 existing English modifiers
    modifiers/zh/<name>.yaml        # 4 existing Chinese modifiers
    taxonomy.yaml
    approved-manifest.yaml
  authoring/
    schema.ts                      # private Zod authoring/manifest/taxonomy contracts
    generator.ts                   # parser, approval checks, projection/emission
    cli.ts                         # --write / --check
    baseline-approvals.json         # frozen revision + 21 approval fingerprints
    authoring.test.ts
  src/
    registry.ts                    # stable export; validate and deeply freeze
    generated/approved-registry.ts  # committed static runtime fields only
    engine.ts                      # existing algorithm unchanged
    index.ts                       # public export surface unchanged
  tests/
    fixtures/pre-migration.json
    fixtures/README.md
    migration.test.ts
  tsconfig.authoring.json
```

The build-only flow reads the manifest, parses and validates every allowlisted record, checks exact record/runtime revisions and baseline approval, validates all runtime/authoring references, then emits only `definition` objects. Validation of all inputs completes before output is written. Runtime imports do not traverse directories, parse YAML, or load examples.

The shared `SkillDefinitionSchema` and existing `validateSkillRegistry` remain authoritative. Private authoring contracts introduce no new public or cross-process schemas. `registry.ts` is now a thin bridge; the old inline seed objects/helper are retired. The generated artifact is a projection of the YAML sources, not a second editable catalog.

The direct build dependencies are `yaml@2.9.1` and the existing `zod@4.4.3` version, declared as skills development dependencies. Parser choice was checked against the [maintainer's documentation](https://eemeli.org/yaml/) and [stable release](https://github.com/eemeli/yaml/releases/tag/v2.9.1). Existing root tsx/Prettier tooling runs the generator from source with the development condition. No stale compiled package is needed to bootstrap it.

## 4. Exact migration inventory

All 21 rows preserve every normalized field and array order, version 1, ACTIVE status and original export order. Destinations are below `packages/skills/definitions/`.

| #   | Stable ID                     | Destination                                             | Migration result |
| --- | ----------------------------- | ------------------------------------------------------- | ---------------- |
| 1   | `apology`                     | `atomic/accountability_repair/apology.yaml`             | Exact parity     |
| 2   | `acknowledge_mistake`         | `atomic/accountability_repair/acknowledge_mistake.yaml` | Exact parity     |
| 3   | `emotional_validation`        | `atomic/recognition_support/emotional_validation.yaml`  | Exact parity     |
| 4   | `reassurance`                 | `atomic/recognition_support/reassurance.yaml`           | Exact parity     |
| 5   | `boundary_setting`            | `atomic/decisions_limits/boundary_setting.yaml`         | Exact parity     |
| 6   | `de_escalation`               | `atomic/conflict_feedback/de_escalation.yaml`           | Exact parity     |
| 7   | `decline`                     | `atomic/decisions_limits/decline.yaml`                  | Exact parity     |
| 8   | `ask_for_help`                | `atomic/requests_options/ask_for_help.yaml`             | Exact parity     |
| 9   | `follow_up`                   | `atomic/coordination/follow_up.yaml`                    | Exact parity     |
| 10  | `status_update`               | `atomic/coordination/status_update.yaml`                | Exact parity     |
| 11  | `expectation_setting`         | `atomic/coordination/expectation_setting.yaml`          | Exact parity     |
| 12  | `planning`                    | `atomic/coordination/planning.yaml`                     | Exact parity     |
| 13  | `clarification`               | `atomic/understanding_inquiry/clarification.yaml`       | Exact parity     |
| 14  | `request`                     | `atomic/requests_options/request.yaml`                  | Exact parity     |
| 15  | `en.professional_conciseness` | `modifiers/en/professional_conciseness.yaml`            | Exact parity     |
| 16  | `en.casual_naturalness`       | `modifiers/en/casual_naturalness.yaml`                  | Exact parity     |
| 17  | `en.direct_but_polite`        | `modifiers/en/direct_but_polite.yaml`                   | Exact parity     |
| 18  | `zh.politeness_calibration`   | `modifiers/zh/politeness_calibration.yaml`              | Exact parity     |
| 19  | `zh.professional_formality`   | `modifiers/zh/professional_formality.yaml`              | Exact parity     |
| 20  | `zh.natural_conciseness`      | `modifiers/zh/natural_conciseness.yaml`                 | Exact parity     |
| 21  | `zh.code_switching`           | `modifiers/zh/code_switching.yaml`                      | Exact parity     |

The taxonomy contains all eight atomic families plus `language_expression`. The unoccupied `explanation_connection` family needs no placeholder atom or directory.

## 5. Approval and example boundary

### Approval policy for implementation

The user's policy-1 decision is enforced as two separate states:

| Concern               | State and gate                                                                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime definition    | `INHERITED` only when its definition digest equals the frozen approved fingerprint for that ID and baseline revision.                                                     |
| Canonical examples    | `PENDING_HUMAN_REVIEW`; never included in selection, composition, runtime artifacts or provider prompts.                                                                  |
| Runtime edit          | Any changed field, string, array order/value, status or version fails inheritance even if a new manifest/digest is supplied. Explicit human review is required.           |
| New explicit approval | `APPROVED` requires a reviewer, evidence references and matching definition digest. Only synthetic tests exercise this branch; all 21 production records use inheritance. |
| Draft runtime record  | `DRAFT` is rejected when allowlisted, even if its embedded definition says ACTIVE. Unlisted files are never discovered or published.                                      |

No human name, signature or example approval was fabricated. The historical application Phase 4 plan and skills documentation supply baseline approval provenance; the user authorized only behavior-preserving carry-forward.

SHA-256 hashes cover validated semantic JSON: object keys sorted by code point, arrays preserved in order, exact string values, UTF-8 and no whitespace. The runtime approval hashes only `definition`. The manifest's `recordDigest` hashes the complete validated wrapper, including examples/provenance/review. Its digest lives outside the record, avoiding circularity. YAML whitespace, comments and mapping-key order do not alter those semantic digests.

An example-only edit requires updating the manifest's record revision but does not approve examples, change runtime output or consume runtime approval. A path move updates the manifest path without altering identity, version or projected bytes. Frozen baseline fingerprints must not be edited to approve changed behavior.

### Canonical examples

All 21 retained cards preserve P1–P3/N1–N3/H1–H2/A1–A2 identity and the exact Phase 5 source prose. The 210 structured cases add explicit synthetic context, fixed action, user intent, language, expected/acceptable/forbidden IDs and rationale. The 42 application cases also contain draft/improved wording and fact/commitment/uncertainty ledgers.

This is authoring evidence, not 210 executed quality trials. Phase 5 examples can describe intended semantics beyond today's keyword router; `expectationScope: AUTHORING_ONLY` states that boundary. Migration tests preserve current actual outputs instead of substituting normative example answers.

Candidate/playbook distinctions are preserved as explanatory `conceptualNotes` with document references. Machine-resolved neighbor/example IDs refer only to existing definitions. This implements the handoff's smallest authoring-only representation adjustment: pending examples may discuss unimplemented concepts without inventing approved runtime IDs.

## 6. Validation and packaging behavior

The parser rejects malformed YAML, duplicate mapping keys, explicit tags, anchors/aliases, directives, complex keys and multiple documents. Strict wrapper/manifest/taxonomy validation rejects unknown fields, incorrect example categories/labels/ledgers, duplicate IDs/paths, missing source files, mismatched IDs, stale record/runtime approvals and invalid references. Source paths resolve relative to the manifest and cannot escape its definitions directory.

The generator uses manifest order and preserves every behavioral array. It emits deterministic formatted TypeScript with UTF-8/LF, no timestamps and no host paths. `--check` compares exact bytes, fails on missing/stale output and never rewrites it. The generated file has a narrow `.gitattributes` entry `text eol=lf`; `git check-attr` confirms this even with Windows `core.autocrlf=true`.

Actual commands:

- `pnpm skills:generate` validates and writes the static projection.
- `pnpm skills:check` validates and checks freshness without mutation.
- Root `pnpm lint` and the skills package build enforce freshness.
- `pnpm skills:verify-production`, after a build, imports the compiled package through the actual production export and verifies definitions, complete plans, exports, freezing and authoring exclusion.

The existing `build:packages` filter used single quotes that Windows passed literally, reporting no matching projects. It now uses portable double quotes and `--fail-if-no-match`. This necessary build-wiring correction makes the evaluation/dev package prebuild use current sources.

## 7. Milestone gates and measured parity

| Gate                         | Evidence                                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 7A — infrastructure/baseline | Captured original normalized objects/plans before edits; 28 parser/schema/manifest/approval/emission tests passed; private tooling typecheck passed. Production still used original definitions at this gate. |
| 7B — migration               | 21 sources/210 examples validated and generated; pre-cutover test run passed 189 tests across 3 files; exact normalized object equality established before switching the public export.                       |
| 7C — retirement/parity       | Public export switched to generated data plus existing validation/freezing; inline seeds removed; final workspace suite passed 362 tests across 27 files, build/evaluation and production smoke passed.       |

| Area                         | Measured result                                                                                                                                                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Definitions                  | 21/21 exact normalized equality; IDs, names, descriptions, languages, actions, tags, use/exclusion prose, principles, avoidances, relations, versions/status and array order preserved.                             |
| Complete plans               | 153/153 captured ordered plans match in source and compiled production: status, selected IDs, versions, reasons, principles and avoidance arrays.                                                                   |
| Context derivation           | All 21 existing integration fixtures reproduce captured contexts and plans; action/context algorithm source is unchanged.                                                                                           |
| Actions / NONE               | All six actions covered; three non-wording actions and legitimate no-match results retain empty NONE. Existing failure tests keep FAILED distinct.                                                                  |
| Language                     | en, zh, regional/script variants, supported mixed switching true/false, unsupported primary with supported secondary, and null primary covered.                                                                     |
| Eligibility                  | Matching, absent/mismatched tags, existing negation/speaker-ownership regressions and intent/situation AND behavior pass.                                                                                           |
| Ranking / conflicts          | Stable score/ID ordering, more than four candidates, at most four selections, conflicts declared in either direction and compatibility without scoring pass.                                                        |
| Composition                  | Exact first-occurrence deduplication and exact first 12 principles/first 12 avoidances retained in synthetic saturation probes.                                                                                     |
| Immutability / exports       | Public source and compiled exports are unchanged; registry, each object and every nested runtime array are frozen.                                                                                                  |
| Authoring / approval         | 28 infrastructure tests cover strict parsing, schema/manifest/references, draft exclusion, stale revisions and unchanged-definition inheritance. All current records inherit; all examples remain pending.          |
| Determinism / path           | Repeated generation is byte-equal, check does not rewrite stale/missing output, source move/family/taxonomy descriptions do not affect projection, and CLI works from the system temp working directory.            |
| Provider boundary            | Existing integration tests plus the new actual-payload regression prove only bounded principles/avoidance accompany existing minimized context; no examples, taxonomy, review, provenance or selected IDs enter it. |
| Production exclusion         | Compiled skills output contains no authoring files/fixtures/YAML/parser import or authoring metadata. Desktop production build succeeds.                                                                            |
| Candidate/playbook exclusion | Exact baseline ID equality and explicit negative assertions exclude the three candidates and playbook IDs. No new tags, retrieval, memory or factory code exists.                                                   |

## 8. Exact verification commands and results

Run from the skills worktree with Node `v24.14.0` and pnpm `11.21.0`, on 2026-09-17. All final commands below exited 0.

| Command                                                                                                                                            | Result                                                                                                                                                                                                                |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile`                                                                                                                   | Worktree dependencies installed using its own lockfile.                                                                                                                                                               |
| `pnpm view yaml version`                                                                                                                           | Stable version 2.9.1; maintainer release cross-check completed.                                                                                                                                                       |
| `pnpm --filter @ai-message-coach/skills add -D -E yaml@2.9.1 zod@4.4.3`                                                                            | Build dependencies declared; lockfile changed only for these and YAML peer resolution.                                                                                                                                |
| `pnpm exec vitest run packages/skills/authoring/authoring.test.ts`                                                                                 | 28 infrastructure tests passed before migration.                                                                                                                                                                      |
| `pnpm --filter @ai-message-coach/skills typecheck`                                                                                                 | Runtime and private tooling typechecks passed.                                                                                                                                                                        |
| `pnpm exec vitest run packages/skills/authoring/authoring.test.ts packages/skills/tests/migration.test.ts packages/ai/src/skill-migration.test.ts` | 189 tests passed before cutover. One additional provider-boundary test was subsequently added.                                                                                                                        |
| `pnpm skills:generate`                                                                                                                             | All 21 records validate; static artifact generated.                                                                                                                                                                   |
| `pnpm format`                                                                                                                                      | Normalized initial CRLF checkout to the existing formatter policy; 95 byte-identical Git index entries refreshed without changing staged content.                                                                     |
| `pnpm format:check`                                                                                                                                | All matched files pass. Documentation is checked separately below because root formatting ignores docs/plans.                                                                                                         |
| `pnpm lint`                                                                                                                                        | Freshness and ESLint pass with zero warnings.                                                                                                                                                                         |
| `pnpm typecheck`                                                                                                                                   | All six workspace package typechecks plus authoring/tests pass.                                                                                                                                                       |
| `pnpm test`                                                                                                                                        | **27 files, 362 tests passed.**                                                                                                                                                                                       |
| `pnpm build`                                                                                                                                       | All six packages/apps build, including Electron main/preload and renderer. Initial build started with contracts/skills dist absent.                                                                                   |
| `pnpm skills:verify-production`                                                                                                                    | 21 exact definitions, 153 ordered plans, public exports, deep freezing and authoring exclusion pass.                                                                                                                  |
| `pnpm eval:phase4`                                                                                                                                 | Corrected prebuild rebuilds all four packages; **21/21** action preservation, no invention and strict scenario pass. All positive metrics 1, forbidden/unnecessary/conflict rates 0; synthetic conflict probe passes. |
| `git check-attr text eol -- packages/skills/src/generated/approved-registry.ts`                                                                    | `text: set`, `eol: lf`.                                                                                                                                                                                               |
| `git -c core.safecrlf=false diff --check`                                                                                                          | Final whitespace check passes after documentation update.                                                                                                                                                             |

Documentation formatting was explicitly checked (root formatting normally ignores docs/plans):

```powershell
pnpm exec prettier --check --ignore-path .gitignore README.md docs/architecture.md docs/skills.md docs/skills/phase-7-registry-migration.md .agent/plans/skills-phase-7-registry-migration.md packages/skills/tests/fixtures/README.md
```

Result: exit 0, all six selected files pass. The same invocation with `--write` formatted them first.

Initial failures were corrected, not waived: tooling tsconfig needed Node types; a test needed a file URL for the Windows tsx loader and removal of an undeclared Zod import; the temporary Markdown migration parser initially matched empty cards; ESLint required preserving an error cause; root formatting found preexisting CRLF files. The first evaluation used already-fresh build output after its quoted filter matched no packages; the corrected command rebuilt the packages and again passed 21/21.

The supervising task separately reproduced original-commit definition equality, freshness, production parity, 362 tests, lint, typecheck and formatting. Its initial test-launch sandbox restriction was resolved by authorized escalation without source changes.

## 9. Changed files and scope audit

Added the private authoring modules/tests/fingerprints, 21 definition YAML files plus taxonomy/manifest, generated TypeScript, historical fixture/README and migration tests, private tooling tsconfig, a production verification script, the narrow Git attribute and this execution record/plan. Added `packages/ai/src/skill-migration.test.ts` for cross-package derivation and provider payload coverage.

Modified the skills package manifest, root scripts/lockfile, thin runtime registry bridge, historical-fixture formatter exclusion, README, architecture and skills docs. The existing selector, contracts, context derivation, provider implementation, desktop and API source have **no Git content diff**. Formatting did not produce unrelated tracked content changes. The four Phase 3–6 research documents remain the preexisting untracked inputs; their content was not rewritten.

There is one editable runtime definition source per skill. Historical test objects and approval fingerprints are labeled frozen evidence; generated TypeScript carries an edit-source warning.

## 10. Acceptance checklist

- [x] Phase 4 architecture implemented with validated readable sources and a static runtime projection.
- [x] Exactly 21 definitions migrated: 14 universal, three English, four Chinese.
- [x] Each skill/modifier has one maintainable authoring source.
- [x] Stable IDs, versions/status, strings and metadata remain equivalent.
- [x] Selection parity measured against frozen pre-migration evidence.
- [x] Composition parity includes order, deduplication and both 12-rule caps.
- [x] Legitimate NONE remains valid and distinct from failure.
- [x] Zero-to-four bound remains enforced.
- [x] Language and mixed/unsupported eligibility remain equivalent.
- [x] Provider boundary and existing action/intent integrity remain intact.
- [x] No proposed candidate becomes ACTIVE.
- [x] No playbook influences runtime.
- [x] No embeddings, vector retrieval or reranking introduced.
- [x] Canonical examples validate and stay outside generation/runtime.
- [x] Runtime approval is inherited only on exact parity; example review remains explicitly pending under the user's policy.
- [x] Existing unit/integration tests pass.
- [x] New migration/parser/generator/validation tests pass.
- [x] Typecheck, lint, formatting, build and deterministic evaluation pass.
- [x] Inline monolithic definitions retired after parity verification.
- [x] One editable definition source; historical evidence labeled and immutable.
- [x] Actual changes, commands, results, limitations and remaining review are recorded.

## 11. Limitations and next milestone

The 210 canonical examples need human review; no example was promoted as approved or treated as a held-out quality result. Existing deterministic behavior is preserved, including any current routing gaps relative to the richer Phase 5 prose. Exact-string deduplication does not detect semantic contradictions, compatibility does not add a ranking bonus/dependency, and the existing 12-rule truncation is unchanged.

No live prose-quality improvement is claimed. The application's preexisting provider-quality and controlled Windows capture release checks remain separate. Approval metadata is a source-controlled review/build gate, not a cryptographic identity service.

Phase 7 stops here. Recommended next work is review of canonical examples and a separately authorized content/candidate evaluation using Phase 6. The three candidates and seven playbooks require their own review, evidence and implementation scope before activation.
