# DATA-00 — Final local Data + Memory architecture contract

Status: complete — documentation only
Owner: Codex
Started: 2026-09-14
Updated: 2026-09-14
Roadmap milestone: [DATA-00](../../docs/roadmap.md#data--memory-roadmap)
Working branch: `DB`

## Outcome

Turn the user's approved local Data + Memory decisions into a repository-backed specification and bounded implementation roadmap. This milestone changes documentation only. It does not implement persistence, runtime schemas, memory skills, or database tables.

## Scope

In scope: local ownership; conceptual entities and contracts; evidence/acceptance/time semantics; bounded asynchronous acquisition and retrieval; incremental summaries and habit learning; encrypted local storage direction; UI correction/deletion; race and replay safeguards; milestone acceptance scenarios; alignment of README, architecture, memory, privacy, and roadmap documentation.

Out of scope: source/configuration/dependency changes, SQL, migrations, SQLite implementation, installed encryption libraries, branches other than `DB`, commits, accounts, sync, PostgreSQL, embeddings, full-history prompts, natural-language memory management, provider calls, and DATA-01 implementation.

The user explicitly authorized starting DATA-00 after approving the architecture direction. This permits documentation work despite the earlier architecture-review-only restriction. Outstanding Phase 2–4 live-quality and Windows capture gates remain tracked; this milestone does not claim to satisfy them or authorize another implementation milestone.

## Current state

- Baseline: `a77f476` (`feat: add initial communication skill engine`). Initial working tree was clean. The shared checkout was on `skills`; switched to existing `DB` at the same commit before edits, following the user's branch instruction.
- `README.md`, `docs/architecture.md`, `docs/memory.md`, `docs/privacy.md`, `docs/product-behavior.md`, `docs/roadmap.md`, `.agent/PLANS.md`, and the Phase 4 plan were inspected, along with relevant source and tests.
- `packages/contracts/src/conversation-analysis.ts` provides observation-only extraction, capture-local message IDs, speaker classes, draft, contact hints, language, and confidence. It lacks stable platform IDs, message timestamps, and per-message participant IDs.
- `apps/desktop/src/main/index.ts` composes analysis/coaching behind authorized IPC. Renderer-submitted analysis is not a suitable durable observation authority; later acquisition needs a main-owned session boundary.
- `packages/ai/src/coaching-prompt.ts` excludes memory; `coaching-engine.ts` validates output anchors against current messages/draft/selection. Both require deliberate later integration, not an extra prompt field alone.
- `packages/contracts/src/skills.ts` is coaching-action-specific. Later memory tasks should share approved-skill ownership without pretending memory extraction is an `AgentAction`.
- No account model, SQLite adapter, or implemented `MemoryReader` exists. Existing strict-contract and coaching tests provide regression boundaries, not memory acceptance evidence.
- README/roadmap still described Phase 4 as uncommitted; the inspected baseline proves it is committed. Historical execution logs are preserved.

## Assumptions and decisions

1. One local user context and store; no accounts, authentication, multi-profile, or cloud infrastructure.
2. Useful structured memory may be retained indefinitely; retrieval exclusion and staleness do not imply deletion.
3. Encrypted SQLite with OS-protected database-key custody is the selected storage architecture. SQLCipher is the preferred engine; binding/build compatibility must be proven with synthetic data at the start of DATA-01 before real-data persistence. No plaintext fallback.
4. Acquisition is disabled until enabled through settings. Use and acquisition are distinct controls; stopping acquisition does not silently delete existing knowledge.
5. Background observation delivery is bounded and best-effort initially; no persistent raw-content queue. Loss before commit is acceptable and must be disclosed.
6. Background processing cannot block coaching or resurrect corrected/deleted data. Revisions, dataset/scope generations, and atomic processing receipts enforce this locally.
7. Initial inferred personal/contact propositions require explicit confirmation. Later automatic promotion needs a separately evaluated predicate-specific policy.
8. Current-context reasoning stays useful without memory. No extra foreground model call is introduced by retrieval.
9. Numeric resource ceilings are mandatory configuration owned by the implementing milestone, not production constants invented in this documentation. Named limits, overflow rules, and limit-boundary acceptance tests are specified now.

## Contracts and data flow

[docs/memory.md](../../docs/memory.md) is the canonical conceptual contract: local entities, `MemoryObservation`, bounded read/update operations, lifecycle, time, provenance, incremental processing, and deletion. [docs/architecture.md](../../docs/architecture.md#data--memory-boundaries-data-00) assigns module ownership and storage/key responsibilities. No runtime contract or schema is added in DATA-00.

Validated main-owned analysis branches into foreground coaching and a non-waiting bounded observation handoff. Coaching can read already committed relevant memory within a deadline; it never awaits the current observation's extraction/write. Raw images never enter the memory boundary. Selected raw text is temporary in-memory task input; only permitted structured knowledge and minimized provenance become durable.

## Implementation steps

1. Confirm clean baseline and `DB`; inspect current docs, contracts, implementation, and tests.
2. Create this execution plan before substantive documentation edits.
3. Replace the earlier conceptual memory sketch with the agreed local architecture specification and deterministic acceptance scenarios.
4. Align architecture/privacy boundaries and README navigation/status without changing source behavior.
5. Add the bounded DATA/MEM roadmap, with DATA-00 authorized and later implementation still separately scoped.
6. Review links, contradictory guidance, diff scope, and branch; run canonical verification and record exact outcomes.

## Tests and evaluation

No automated tests are added because no runtime behavior changes. The memory specification defines future synthetic acceptance scenarios for uncertain identity, historical roles, explicit corrections, duplicate input, out-of-order work, deletion during processing, resource overflow, profile attribution, compaction, and memory-off fallback.

Documentation review verifies all five user decisions and the token-cost rule against concrete sections. Existing deterministic lint/typecheck/test/build commands are baseline regression checks only; no live-provider evaluation, real screenshots, database fixtures, or credentials are used.

## Acceptance criteria

- [x] AC1: Local single-user ownership and no account/sync infrastructure are explicit.
- [x] AC2: Source observations, evidence, assertions, profiles, authority, and temporal states are distinct.
- [x] AC3: Useful structured retention is indefinite; historical/stale/superseded data is not deleted merely for age or retrieval exclusion.
- [x] AC4: Bounded main-owned asynchronous observation, replay/race protection, and foreground fallback are specified.
- [x] AC5: Incremental tasks and named resource budgets forbid full-history model input and unbounded retrieval.
- [x] AC6: Conservative identity, contextual habits, and current-evidence precedence have observable scenarios.
- [x] AC7: Encrypted local storage, OS key custody, UI corrections, and complete deletion dependencies are specified.
- [x] AC8: Every future milestone has goal/scope/dependencies/acceptance/out-of-scope boundaries; basic user controls ship with storage.
- [x] AC9: Only documentation changes on `DB`; no source, configuration, dependency, SQL, database, or commit changes.
- [x] AC10: Documentation review and exact canonical verification outcomes are recorded without claiming runtime memory implementation.

## Validation commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `git diff --check`
- `git diff --stat`
- `git status --short`
- `git branch --show-current`

README, `docs/`, and `.agent/` are excluded by the existing `.prettierignore`. Review documentation layout and links directly; do not change formatter configuration or run a repository-wide write formatter for this milestone.

## Risks, rollback, and limitations

- This contract specifies behavior, not proof of a compatible encryption binding, calibrated confidence, or model-quality improvement. DATA-01 must validate native packaging/key lifecycle before real-data storage; later model tasks must validate budgets and quality.
- Best-effort memory acquisition may lose uncommitted observations; no complete interaction-history claim is allowed.
- Indefinite retention needs admission/resource controls. Disk pressure pauses acquisition rather than deleting historical knowledge without authority.
- Pending Phase 2–4 live evaluations and Windows capture checks remain open.
- Rollback is a reviewed documentation-only patch restoring the prior text; there is no database migration or user-data impact.

## Progress log

- 2026-09-14: Read baseline and user decisions, confirmed clean tree, returned shared checkout from `skills` to `DB`, and created this documentation-only execution plan.
- 2026-09-14: Replaced the earlier memory sketch with the local contract and 21 implementation acceptance scenarios; aligned architecture, privacy, roadmap, and README. Historical Phase 4 records and outstanding live/native gates were preserved.
- 2026-09-14: All canonical checks passed; 39 local documentation links/anchors passed read-only validation. Reviewed acceptance criteria, branch, whitespace, and documentation-only scope; marked DATA-00 complete.

## Completion record

Completed DATA-00 on DB without a commit. Five existing documentation files changed and this execution plan was added. No source/configuration/dependency/runtime-schema/SQL/database change was made. Canonical build regenerated ordinary ignored production artifacts only.

### Acceptance evidence

| Criteria | Evidence |
|---|---|
| AC1–AC3 | memory.md status, ownership/entities, evidence/acceptance, temporal/retention sections; privacy local-storage policy |
| AC4–AC5 | MemoryObservation, commit/replay, and named budget/overflow contracts; architecture module/foreground/background boundaries |
| AC6 | memory.md identity, habits, correction, and 21 scenarios M01–M21 |
| AC7 | Architecture storage/key decision and DATA-01 gate; privacy/deletion/source-dependency rules |
| AC8 | Roadmap DATA/MEM table and first-slice gate |
| AC9–AC10 | Git scope/branch review, link check, and verification results below |

### Exact verification results

Commands ran from the repository root with Node v24.14.0 and pnpm 11.21.0.

| Command/check | Result |
|---|---|
| pnpm lint | PASS, exit 0; zero warnings allowed |
| pnpm typecheck | PASS, exit 0; all six workspace projects |
| pnpm test | PASS, exit 0; 24 files / 172 tests |
| pnpm build | PASS, exit 0; all packages and desktop main/preload/renderer |
| git diff --check | PASS, exit 0; only Windows LF-to-CRLF advisory warnings |
| git diff --stat and git status --short | Five modified Markdown docs and one new Markdown plan; no implementation files |
| git diff --name-only -- apps packages scripts package.json pnpm-lock.yaml | Empty; no source/config/dependency diff in these areas |
| git branch --show-current | DB |
| Read-only inline Node checker piped through PowerShell, using filesystem/path modules | 39 relative Markdown file/heading links across six deliverables; zero failures; no checker file created |

No automated tests added: the 21 memory cases are implementation acceptance specifications, not passing memory tests. No formatting write, live-provider call, real-data evaluation, dependency installation, database creation, or commit occurred. Documentation is excluded by the formatter ignore file, so layout/links were reviewed directly.

### Limitations and next milestone

SQLCipher is the preferred engine, not an installed or compatibility-tested binding. DATA-01 selects and verifies its maintained Windows/Electron binding and key/journal/temp behavior with synthetic data before real persistence. Numeric budgets and the responsive execution mechanism are selected and tested when their callers are implemented; unlimited defaults are prohibited. Best-effort acquisition can lose uncommitted inputs. Existing live-quality and Windows release checks remain open.

Next recommended milestone: **DATA-01 — protected local foundation**, with its own execution plan, compatibility gate, and explicit preference save/read/edit/delete/reset slice. No contacts, inference, queues, or background model calls are included.
