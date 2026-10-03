# SRS-3D-B — semantic skill profiles

Status: complete  
Owner: Codex  
Started: 2026-09-29  
Updated: 2026-09-29  
Roadmap: SRS-3 shadow ranking direction; authoring-only profile increment

## Outcome

Give each of the 21 approved communication definitions an explicit, versioned semantic job, eligibility and exclusion boundaries, conceptual triggers, and useful neighbor distinctions. Produce a deterministic private artifact for a separately approved semantic-retrieval experiment. No runtime behavior changes.

## Scope

In scope: 14 universal capability profiles, seven language-modifier profiles, private schema/loader, consistency review, tests, artifact and report. Out of scope: retrieval, normalizer, ranking, supervisor, production selection, prompt/provider surfaces, candidates, held-out evidence and skill-tree routing.

## Current state

The 21 individual YAML records and approved manifest are digest-bound Phase 7 authoring evidence. The SRS-3B freeze and SRS-3C baseline bind source bytes/digests; the runtime generator projects only `definition`. Existing record `neighbors` and `conceptualNotes` contain useful distinctions, but runtime `useWhen`/`doNotUseWhen` are generic. Phase 8A supplies eight structural boundary matrices. SRS-3D-A recovered recall but exposed two expectation-setting metadata precision controls, D31/D32. All 210 canonical examples remain authoring-only with their existing review state.

## Assumptions and decisions

Keep the frozen records byte-stable. Add a single private YAML overlay keyed by exact approved skill IDs, rather than changing authoring-record digests, the approval manifest or runtime schema. This is an authoring model extension, not a second registry: the loader requires a one-to-one match to the approved manifest and calculates a definition digest and independent profile digest for every entry. A single source file keeps validation and all 21 profiles co-located; each profile still has its own revision and digest. No profile is promoted to human-approved status by Codex review.

## Contracts and data flow

`authoring/semantic-profiles.yaml` → private strict Zod schema and checked loader → approved-record ID/lane/digest validation → content-only deterministic JSON artifact in `tests/fixtures/srs3`. Capability projection explicitly excludes all modifier IDs; modifier profiles may describe expression or capability dependencies without entering capability retrieval. Only synthetic/authoring prose is stored; no conversations, drafts, credentials or runtime payloads are copied.

## Implementation steps

1. Author the overlay against all approved definitions, Phase 8A boundaries and reviewed examples. Preserve the repeated-pressure boundary and flag its broader-policy question.
2. Add strict private validation for completeness, exact 21-ID coverage, lane and neighbor integrity, closed relationships and coexistence, revision, and review state. Bind artifact rows to current definition and profile digests.
3. Generate the deterministic private artifact and test each known boundary, lane separation, digest stability, runtime exclusion and frozen-evidence parity.
4. Perform per-profile semantic consistency review and lexical-hardcoding review, document review states and unresolved boundaries, then run all requested validation.

## Tests and evaluation

Focused schema/loader tests cover malformed or missing fields, missing/extra skills, unknown/self/duplicate neighbors, modifier leakage, closed enums, determinism and known distinctions. Full suite and the SRS-3A/B/C/D-A checks protect frozen evidence. This phase runs no live model/provider evaluation.

## Acceptance criteria

- All 14 ACTIVE universal capabilities and seven language modifiers have complete profiles and exact definition bindings.
- Capability projection has 14 entries, no modifier and no candidate.
- Known Phase 8A pair boundaries and D31/D32 expectation distinctions are explicit without invented conflicts.
- Artifact regenerates byte-identically twice; each entry has profile revision, profile digest, definition digest and truthful review state.
- Approved YAML, manifest, generated runtime registry, production selector, normalizer, provider prompt and frozen SRS-3 evidence remain unchanged.

## Validation commands

Focused semantic-profile tests; authoring, SRS-3A/B/C/D-A, SRS-2/2.5 tests; SRS-3C `--check`; semantic-artifact generate twice/`--check`; `pnpm skills:check`; `pnpm lint`; `pnpm typecheck`; `pnpm test`; `pnpm build`; `pnpm skills:verify-production`; `pnpm format:check`; `git -c core.safecrlf=false diff --check`.

## Risks, rollback and limitations

The overlay could drift from approved definitions; exact one-to-one ID/lane checks plus definition digests fail closed. Neighbor prose could imply universal conflicts; audit coexistence as conditional/compatible where supported. Lexical trigger prose would merely move hardcoding into YAML; review and tests reject such entries. Rollback removes only new overlay, private loader, tests, artifact, report and this plan. These profiles are Codex-authored, not human-approved or retrieval-efficacy evidence.

## Progress log

- 2026-09-29: Read brief, repository instructions, README, product/privacy/skills docs, plan convention, all 21 approved records and canonical-example summaries, Phase 3/4, Phase 8A boundary matrices, focused approval state, SRS-3A/B/C and SRS-3D-A reports. Chose non-runtime overlay to preserve frozen source digests.
- 2026-09-29: Authored 14 capability and seven modifier profiles, 44 directed neighbor edges, strict private schema/loader, deterministic artifact, focused tests and report. Marked the repeated-pressure scope of `boundary_setting` for future product review; documented expectation-setting metadata precision without changing it.
- 2026-09-29: Generated the artifact twice with identical bytes, verified SRS-3C/D-A reproducibility, production registry parity and full validation. A resource-contended concurrent full run hit two pre-existing 5-second test timeouts; isolated focused and standalone full runs passed. No timeout or production code was changed.

## Completion record

The authoring source is `packages/skills/authoring/semantic-profiles.yaml`; its strict loader/renderer is `authoring/semantic-profiles.ts`. The private fixture `tests/fixtures/srs3/semantic-skill-profiles.json` is SHA-256 `b061bf17a04e696ad78af45016e6803a96f79f0e617fcb2800a4a591fbc33d1c` across two generations and `--check`. The human-readable [report](../../docs/skills/srs-3d-b-semantic-skill-profiles.md) includes all 21 summaries, directed neighbor coverage, consistency results and unresolved boundaries. One profile is `BOUNDARY_REVIEW_REQUIRED`; 20 are Codex-reviewed `PASS`, not human-approved. No fields were omitted from the required schema; `USUALLY_ALTERNATIVE` is available in the closed vocabulary but not used because no reviewed pair warranted a blanket alternative claim.

Validation results: focused semantic/authoring/SRS-3A/B/C/D-A/SRS-2/2.5 run 8 files/87 tests passed; full `pnpm test` 38 files/492 tests passed standalone. `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm skills:check`, `pnpm skills:verify-production`, `pnpm format:check`, and `git -c core.safecrlf=false diff --check` passed. `node --conditions=development --import tsx scripts/evaluate-srs-3-baseline.ts --check` retained SHA-256 `ffa306ca87866313d58e670775ded8bad91a4dcc99cb23efe5fb35839b9dbcac`; the SRS-3D-A `--check` retained `8c25faac2ebe2e9260fad121907c325c428c2d9288688468cf1a6e46b03d8895`. The generated runtime registry remains SHA-256 `69308570286570725609e80bcd961932da1092db2d68bad157e815616cef275d`; production verification found 21 exact definitions and 153 plans with authoring exclusion. No canonical example approval status, candidate, normalizer, selector, prompt or provider behavior changed.

Known limitations: the first-time personal-limit policy for `boundary_setting` needs separate approval; broad `expectation_setting` situation metadata still admits the exposed D31/D32 controls; profile quality is Codex-authored and has not been independently human-approved or tested for semantic retrieval efficacy. The next recommended milestone is separately approved SRS-3E semantic-retrieval experiment planning, binding both definition and profile digests and preserving shadow-only hard gates and lanes. Stop before implementation of that experiment.
