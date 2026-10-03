# Skills Phase 7 — Registry migration

Status: complete
Owner: Codex
Started: 2026-09-17
Updated: 2026-09-17
Milestone: communication research Phase 7, [handoff](../../docs/skills/phase-7-registry-migration.md). This refactors the existing application Phase 4 registry within the [roadmap](../../docs/roadmap.md); it does not start the application's later milestones.

## Outcome

One readable YAML authoring record per existing skill, validated and projected to a static runtime registry, preserving all 21 definitions and observable selection/composition behavior.

## Scope

Implement 7A infrastructure/baseline, 7B existing-21 migration, and 7C parity/cutover/retirement. Keep all three candidates, seven playbooks, semantic retrieval, memory, providers and UI outside this change. Work only in the skills worktree.

## Current state

HEAD a77f476b532c6ddd81eadbca835b312425fd4f1c, branch skills. Only docs/skills research documents were untracked. registry.ts contains 21 helper-normalized frozen definitions (14 universal, 3 en, 4 zh). engine.ts already validates references, freezes values, and selects/composes deterministically. Public contracts and exports are suitable unchanged. No worktree node_modules existed; pnpm install --frozen-lockfile succeeded with Node 24.14.0 and pnpm 11.21.0.

## Assumptions and decisions

- Production normalized objects, including helper defaults and ordering, are the migration oracle; Phase 5 prose is authoring material, not replacement guidance.
- Build-only TypeScript modules live under packages/skills/authoring; run with the existing tsx loader and development condition so a clean checkout does not need stale dist files.
- Keep generated TypeScript committed. Build and root lint check freshness without repairing stale output. Explicit generation is separate.
- Reuse SkillDefinitionSchema and validateSkillRegistry, with private wrapper/manifest/taxonomy schemas. No new public or cross-process contract is needed.
- Use a direct development dependency on maintained yaml 2.x; reject duplicate keys, tags, aliases/anchors, directives and multiple documents. Exact version is recorded after package inspection.
- Preserve canonical P/N/H/A labels and synthetic source text; candidate distinctions remain explanatory notes/document references, never unresolved machine IDs.
- The user approved policy 1 on 2026-09-17: inherit approval only for runtime definitions exactly equal to the frozen original baseline; examples remain PENDING_HUMAN_REVIEW and have no runtime effect. Baseline approval fingerprints are frozen separately from the manifest's full-record digest. No human approver is invented.
- Use yaml 2.9.1 (current stable release verified against the maintainer's release notes and package registry) and the existing Zod 4.4.3 as private development dependencies. Prettier/tsx remain existing root tooling.

## Contracts and data flow

Manifest -> strict YAML parser -> wrapper/revision approval -> existing runtime schema/reference validator -> deterministic TypeScript -> stable registry.ts export. Authoring examples, taxonomy and review metadata never enter production exports or provider payloads. Only synthetic research examples and synthetic test fixtures are written; no conversation content, captures, credentials or provider calls are involved.

## Implementation steps

1. Capture historical normalized definitions and complete ordered plans before editing runtime sources.
2. Add private schemas, parser, digest, projector/emitter and explicit generation/check scripts. Prove invalid inputs fail atomically.
3. Structure the 210 examples from the 21 retained Phase 5 cards; migrate exact definitions, taxonomy and approval manifest.
4. Compare all definitions, then cut over the stable export only when approval and parity gates permit.
5. Verify frozen old outputs, cross-package invariants, packaging and clean build; remove inline seeds.
6. Update handoff, architecture/skills docs and this record with measured evidence.

## Tests and evaluation

Frozen historical fixture (revision/hash, normalized objects, context/plan pairs, synthetic conflict/dedup/cap/rank cases), parser/schema/reference/manifest/revision tests, deterministic generation and non-mutating freshness tests, path/family independence, public export and production packaging smoke, existing policy/context/provider integration suite and deterministic Phase 4 evaluator.

## Acceptance criteria

- [x] Exactly 21 ACTIVE records, 14/3/4 split; identical IDs, versions, strings, arrays and order.
- [x] One source per definition, validated authoring examples, taxonomy, manifest and exact revision approvals; examples remain pending human review under policy 1.
- [x] No draft, candidate or playbook activates; invalid input cannot produce a partial catalog.
- [x] Ordered selection/reasons/guidance match frozen pre-migration outputs; NONE, language, AND filters, greedy conflicts, dedup, 0–4 and both 12-rule caps preserved.
- [x] Stable public exports, runtime validation/deep freezing, and provider guidance boundaries preserved.
- [x] Deterministic generated artifact is fresh; clean builds need no old dist; runtime contains no authoring data/parser.
- [x] Existing and new tests, format, lint, typecheck, build and deterministic evaluation pass.
- [x] Inline production seeds retired after verified cutover; historical test data clearly labeled and not regenerated.
- [x] Documentation records actual evidence, unresolved gates and next milestone.

## Validation commands

pnpm format:check; pnpm lint; pnpm typecheck; pnpm test; pnpm build; pnpm eval:phase4; git diff --check. Add actual generation/check and focused verification commands when implemented.

## Risks, rollback, and limitations

Approval of baseline behavior does not imply review of newly structured examples. Canonical examples describe intended semantics and may differ from current routing; parity is not quality uplift. Rollback restores registry.ts and removes build integration from version control; no user-data migration. Real provider and Windows capture release follow-ups remain separate.

## Progress log

- 2026-09-17: User explicitly authorized Phase 7 implementation, superseding the documentation-only handoff. Read contributor instructions, README, plans, research designs, relevant product/privacy/architecture docs and implementation/tests.
- 2026-09-17: Installed worktree dependencies with frozen lockfile; no DB checkout edits.
- [x] 7A infrastructure and baseline: 21 normalized definitions, 21 integration plans and 132 direct/synthetic plans captured before runtime edits. The 28 infrastructure tests pass. Private tooling typecheck passes after adding its required Node types.
- [x] 7B migration: 21 YAML records and 210 source-grounded examples validate. Pre-cutover parity passed (3 files, 189 tests). Fixed test bootstrap issues (undeclared Zod import in AI tests and Windows loader URL). Cut over only after exact equality; retired inline seed/helper data.
- [x] 7C final verification/documentation: final full run passed 27 files/362 tests, format, lint and workspace typecheck. Build succeeded initially with no preexisting contracts/skills dist and again after final tooling fixes; compiled exports match all 21 definitions and 153 plans. Explicit provider payload regression passes. Deterministic evaluation rebuilt all four packages and passed 21/21.
- 2026-09-17: Windows checkout used CRLF although Prettier requires LF; initial formatting check reported 95 existing files. Ran pnpm format; Git's normalized content diff contains only intended changes. Added a narrowly scoped generated-artifact LF attribute; git check-attr confirms text=set, eol=lf.
- 2026-09-17: Initial lint found a missing error cause in the generator's missing-file diagnostic; preserved the cause. The first deterministic evaluation passed 21/21 but its prebuild filter matched no projects on Windows because single quotes were passed literally. Corrected build:packages to portable double quotes plus --fail-if-no-match; rerun required.

## Completion record

Completed all Phase 7 acceptance criteria. Added 21 YAML records, 210 review-pending canonical examples, strict private validation/approval tooling, a deterministic generated static registry and a stable validated/frozen export. Runtime definition equality is exact; 153 captured plans match in source and production. Added 190 tests (28 infrastructure, 160 migration, two cross-package/provider tests) to the existing 172, totaling 362.

Successful final commands: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (27 files/362 tests), `pnpm build`, `pnpm skills:verify-production` (21 definitions/153 plans), `pnpm eval:phase4` (21/21), and generated LF attribute verification. Exact setup/focused commands, initial corrected failures and documentation checks are recorded in [Phase 7 section 8](../../docs/skills/phase-7-registry-migration.md#8-exact-verification-commands-and-results).

The supervising task independently verified original-commit equality and reproduced checks. The source-controlled diff contains only Phase 7 code/tooling/docs: 95 formatter-normalized files were byte-identical to their index blobs, and refreshing their stat entries left staged content unchanged. No DB checkout edits, commits, merges, pushes or live provider calls occurred.

Remaining review is the 210 canonical examples, as explicitly permitted by the user's separate approval policy. Migration parity is not evidence of improved generated prose or ideal routing. The next recommended milestone is example review and separately authorized candidate/content evaluation; no next-phase implementation was started.
