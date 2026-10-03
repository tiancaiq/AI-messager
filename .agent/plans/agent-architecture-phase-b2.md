# Agent architecture Phase B2 — deterministic shadow assessment and selection

Status: complete — shadow-only; ready for review/signoff; B3 and cutover on hold

Owner: Codex

Started: 2026-10-04

Updated: 2026-10-04

Roadmap milestone: [Agent architecture Phase B](../../docs/roadmap.md#agent-architecture-phase-b--agentskill-integration)

## Outcome

Project bounded structural evidence from Phase A, assess supported communication needs deterministically, and select approved exact skill references through the B1 boundary. Run this path beside the production flat selector for structural comparison only. The B2 output stops at `SkillSelectionResult`; it never compiles a new `SkillPlan` or changes user-visible coaching.

## Baselines and catalog entry gate

- Agent baseline: `0b32f9ec4236d1649fb8772edd13f8e6cce0bd08` (`agent-architecture-b1-freeze`). Its clean worktree passed 42 files / 272 deterministic tests before B2 edits.
- Skills baseline: committed `skills` revision `dcc52eb15b578a4dbc65e4c74b64dbf9806cc899`. Only its committed approved runtime projection is in scope. Subsequent untracked SRS-4R live-proof files are not used or modified.
- At the committed Skills revision, `packages/skills/src/generated/approved-registry.ts` is the generated static projection of the reviewed allowlist; `packages/skills/src/registry.ts` validates and deeply freezes it behind `initialSkillRegistry`. Authoring YAML, paths, families, examples, candidates and SRS research are excluded from B2 runtime. The number 21 is an observed count, not an invariant.
- Approval is revision-bound: `INHERITED` requires an unchanged definition digest against the frozen approved baseline; a changed runtime definition requires explicit `APPROVED` review metadata/evidence. `DRAFT` is excluded from the approved projection, and pending example review is separate from runtime approval. A path/example-only authoring change does not bump a runtime definition version. B2 consumes only the generated approved `definition` values, never approval envelopes or examples.
- The committed migration test checks definition-by-definition and 153-plan parity with the pre-migration approved runtime. Independently, `JSON.stringify(initialSkillRegistry)` at the Agent baseline and Skills baseline has the same SHA-256 `d3bd95cd2fe91c999f0331e25c4f68438954ed21804d43f35616a7f7239497ca`. The Agent branch still holds the old inline projection; it remains the one canonical approved runtime registry in this worktree and has identical runtime values. Do not copy another registry or merge experimental authoring files into B2. A later Skills-branch merge can replace its representation without changing the B2 caller.
- `SkillDefinition` remains strict Zod with stable ID, positive version, `ACTIVE | INACTIVE`, language/action/situation/intent eligibility, principles/avoidances, compatibility/conflict references. The Skills commit only adds two public intent-tag enum values (`acknowledge_perspective`, `give_feedback`), not active definitions or runtime fields; mirror the enum for compatibility without enabling experimental candidate routing.
- `createSkillEngine(input).select(context): CommunicationPlan` remains the production API. It validates/freezes its registry, excludes inactive/action/language/tag-ineligible skills, requires positive metadata score, applies symmetric conflicts, caps at four, and returns `NONE` for no match or local non-wording action. `FAILED` remains an explicit plan status for invalid orchestration, not a no-match. Compatibility references are informative, not eligibility or ranking bonuses. English and Chinese families are eligible only for matching primary/allowed code-switched language; universal skills remain eligible. IDs/versions are exact; no aliasing or implicit version upgrade exists.

## Scope and non-goals

In scope: minimal B1 compatibility adjustment; deterministic approved-catalog fingerprint; Agent-owned evidence projection; a small Skill-owned communication signal vocabulary; deterministic `CommunicationAssessment`; deterministic evidence-aware `SkillSelector`; shadow-only in-process comparison/trace; focused boundary and parity tests; documentation and gates.

Out of scope: B3 SkillPlan compiler, B4 metadata expansion, B5 authoritative cutover, model-backed assessment or selection, provider call, Supervisor/specialist runtime, domain ownership, candidate/research metadata, semantic retrieval, memory personalization, IPC/UI/public-result changes, persistence, Composer/Evaluator redesign, and any change to the production flat selector's outputs.

Affected areas: `packages/contracts/src/agent-skill.ts` and `skills.ts`; `packages/skills/src/agent-skill-boundary.ts` plus focused B2 module/tests; `packages/ai/src/communication-problem.ts` consumer-side evidence projection and `coaching-engine.ts` shadow hook/comparison/tests; package exports; this plan and affected architecture/roadmap documentation. Production `engine.ts` and generated/inline approved definitions remain unchanged unless a proved compatibility need appears.

## Decisions and assumptions

1. The Agent policy fixes `AgentAction`; the B2 Skill request includes it, and strict Skill outputs omit action, intent and all orchestration fields. No Skill output may direct a model call, revision, next agent, stop condition or Composer behavior.
2. The approved-catalog identity becomes a deterministic, non-cryptographic 128-bit FNV fingerprint of the validated approved runtime definitions, using sorted object keys, preserved array order and UTF-8. This catches accidental ID/registry mismatch; it is not an approval signature or tamper-resistant security boundary. The runtime Skill package stays platform-neutral without a Node crypto dependency. B2 creates a snapshot from `initialSkillRegistry` in memory. Validation recomputes the fingerprint to reject an ID paired with different registry values. No authoring path or persistence is involved.
3. Evidence is a request-local, bounded **structural** projection of `CommunicationProblem` and the already-derived production `SkillContext`: language, draft/message presence, existing context tags, material ambiguity, selected Phase A warning codes, user-supplied direction/constraint/style presence where available, and explicit unknown identity/relationship. It does not re-infer facts, truncate private text into misleading claims, or include raw message/draft text, names, relationship claims, screenshots or provider payloads. A `CONTEXT_TAG` evidence kind is a minimal B1 schema extension; the input list bound is raised only enough to cover the existing bounded tag contract.
4. Initial Skill-owned signals are broad needs, not atomic skill names, Agent goals, relationship assertions or hard eligibility permissions. Each signal has positive exact context-tag evidence; absence of that evidence means no signal. The vocabulary and mappings are documented below and tested. Assessment may abstain; no confidence probability is invented.
5. The new selector uses the approved registry's current hard eligibility and symmetric conflict rules, exact ID/version, positive score and cap. Evidence-backed signals may only rank candidates already eligible; a candidate still needs a matching context/language evidence reason. `NONE` is a valid no-match; invalid assessment/snapshot yields `FAILED`, never a broadened fallback. B2 does not use private authoring or SRS metadata.
6. Shadow comparison is synchronous/deterministic local work within the existing async coaching call. Any B2 failure is caught and isolated from the production `CommunicationPlan`, provider invocation and result. Only an optional in-process structural callback exposes the comparison. There is no logging, analytics or user-history persistence.
7. Signal support adds at most one small ranking bonus per already-eligible skill, regardless of how many broad signals overlap its metadata. This avoids a language/style modifier collecting several incidental bonuses and displacing a substantive skill merely because it has broad situation tags. The shadow comparator still records differences for review; it does not assume parity proves quality.

## Signal vocabulary V1

| ID | Meaning | Positive evidence | Negative boundary / must not imply |
| --- | --- | --- | --- |
| `clarity` | Make a supported request/question easier to understand. | Existing `request` situation or `clarify` / `make_request` intent tag. | No assumption that the user is confused or wants a different action. |
| `coordination` | Organize supported status, follow-up, expectation or logistics. | Existing `status_request`, `planning`, `follow_up` situation or `provide_status`, `set_expectation`, `plan`, `follow_up` intent. | No invented deadline, promise, availability or recipient goal. |
| `empathy` | Acknowledge supported feeling/need for reassurance. | Existing `emotional_support` situation or `validate_emotion` / `reassure` intent. | No diagnosis or claim to know unspoken feelings. |
| `conflict_management` | Reduce visible tension without conceding the user's decision. | Existing `conflict` / `pressure` situation or `de_escalate` intent. | No inferred relationship, apology or forced reconciliation. |
| `assertive_limits` | Communicate a supported refusal or limit clearly. | Existing `set_boundary` / `decline` intent. | No new refusal or limit from pressure alone. |
| `repair` | Communicate supported accountability for a mistake. | Existing `mistake` / `missed_commitment` situation or `apologize` / `acknowledge_mistake` intent. | No admission of unsupported fault or automatic apology. |

Signal mappings refer to the stable shared runtime tag enum, not skill IDs, file paths, family labels or exclusive owners. A signal can support multiple skills; a skill can relate to multiple signals. No signal activates an otherwise ineligible skill.

## Contracts, projection and flow

```text
validated CoachingRequest → policy fixes AgentAction
              ├→ existing SkillContext → flat selector → CommunicationPlan → Composer
              └→ Phase A CommunicationProblem + existing SkillContext
                    → structural SkillEvidence[] → SkillAssessmentPort
                    → CommunicationAssessment → SkillSelector
                    → SkillSelectionResult → non-persistent structural comparison only
```

The projection assigns deterministic `E1…` references in stable order and preserves source categories. `CONTEXT_TAG` values use closed `SITUATION:<tag>` / `INTENT:<tag>` codes, `DETERMINISTIC_DERIVATION` and a request-local source reference. Language and draft/message presence retain observed provenance. Unknown identity/relationship remain explicit `UNKNOWN` entries; no visible contact cue becomes confirmed identity. Explicit user-supplied fields are not synthesized when the current IPC has no producer. Evidence and assessment are never sent to the wording provider.

Selection validates its assessment and all evidence references, binds to the fingerprinted approved snapshot, filters ACTIVE/action/language/intent/situation eligibility, scores only eligible candidates, applies symmetric conflicts and the request cap, then returns exact ID/version references and one bounded evidence-backed reason per selection. The B1 SkillPlan compiler seam stays unimplemented.

The structural `SkillShadowTrace` contains only fixed action, production/shadow status and ID/version refs, signal IDs, counts, language eligibility outcome, conflict outcome, snapshot ID, bounded failure code and deterministic comparison category (`MATCH`, `EXPECTED_DIFFERENCE`, `POTENTIAL_IMPROVEMENT`, `POTENTIAL_REGRESSION`, `NOT_COMPARABLE`). No text, snippets, drafts, full evidence, provider payloads or private reasoning enter it. It is an optional request-local debug result, not persisted history or default analytics.

## Implementation steps

1. Preserve and verify the B1 commit/tag and committed Skills catalog parity. Record this plan before B2 code.
2. Add the minimal shared schema extension and fingerprint factory/validation; test registry-value mismatch, ID/version/status and strict output authority.
3. Add pure Agent-side evidence projection from Phase A plus already-valid SkillContext. Test provenance, bounds, stable references, unknowns and no raw content.
4. Add the closed six-signal vocabulary and deterministic assessor behind `SkillAssessmentPort`. Test positive/negative evidence, abstention, stable output, references and unknowns.
5. Add deterministic evidence-aware selector through `SkillSelector`. Test every hard eligibility, conflicts, cap, exact snapshot and `NONE`/`FAILED` distinction.
6. Add an in-process shadow runner/comparison callback after the production flat plan is computed; never feed its output to Composer. Test action/call/result parity, failure isolation and content-free trace.
7. Run focused/full deterministic tests, lint, typecheck, build, Phase 4 evaluation, formatting/whitespace gates; update docs and completion record. Stop before B3.

## Tests and acceptance criteria

- [x] Both committed baselines and exact approved runtime snapshot are recorded; newer uncommitted Skills work is excluded.
- [x] Evidence is bounded, source-attributed and referenceable; unknown relationship/identity remain unknown; no raw content enters structural traces.
- [x] The six approved signal IDs have tested positive/negative boundaries; assessment is deterministic, evidence-backed and unable to add action/intent/orchestration fields.
- [x] Selection returns only approved ACTIVE exact ID/version references; fingerprint mismatch fails closed; action, language, supplied context-tag eligibility, conflicts and cap are enforced.
- [x] `NONE` and `FAILED` stay distinct, and B2 returns no compiled new SkillPlan.
- [x] Shadow comparison is deterministic and structural; production flat plan and Composer input/result/provider-call count remain unchanged, including failure cases and local non-wording actions.
- [x] Existing Phase A/B1/Phase 4 tests and evaluation, full tests/lint/typecheck/build, formatting under the documented Windows exception, and `git diff --check` pass.

## Validation commands

Run focused and full `vitest run`, `eslint . --max-warnings 0`, package/app `tsc -p ... --noEmit`, production `tsc -p .../tsconfig.build.json`, desktop `vite build`, `node scripts/evaluate-phase-4.mjs`, `prettier --check . --end-of-line auto`, and `git diff --check`. Use direct underlying tools if this host's pnpm wrapper would rewrite unrelated workspace files. No live provider call is required.

## Privacy, rollback and limitations

All B2 values are request-scoped and in-memory. No screenshot, raw transcript, draft, contact identity, inferred relationship, provider payload, output text, key or model reasoning is logged or persisted. Fingerprints contain only approved skill definitions. Rollback removes the B2 shadow call and B2-only modules while retaining the B1 tag/commit; no data migration or user-visible behavior rollback is needed. Catalog evolution requires a new validated snapshot and comparison review, not aliases or a second registry. This first deterministic signal mapping and shadow selection do not prove improved wording quality; human-reviewed B5 evidence remains a separate gate.

## Progress log

- 2026-10-04: B1 frozen at `0b32f9e`; full baseline suite passed (42 files / 272 tests). Inspected committed Skills checkpoint `dcc52eb`, its approved generated projection, runtime schema/selector and migration parity tests. Compared the two exported runtime registry JSON hashes, which match. Newer SRS-4R live-proof files are untracked and out of scope. Wrote this B2 plan before implementation.
- 2026-10-04: Added the minimal shared `CONTEXT_TAG`/intent-enum compatibility changes, validated in-memory approved-catalog fingerprint, Agent-side structural evidence projection, six Skill-owned signals, deterministic assessor/selector and shadow-only comparison hook. Extracted existing hard eligibility and conflict helpers for shared use without changing production selector outputs. No Skills-worktree files were modified.
- 2026-10-04: The first structural fixture comparison flagged a possible regression: a language-style skill displaced `apology` at the four-skill cap because multiple broad signal bonuses stacked. Capped the boost at one per already-eligible skill. Rerun comparison: 21/21 `MATCH`, no differences on the current frozen fixtures. This is parity evidence, not a claim of wording-quality improvement.
- 2026-10-04: Focused and full deterministic tests, lint, all package/app typechecks, package and desktop builds, Phase 4 evaluation, Windows-safe formatting and whitespace checks passed. The initial renderer build was invoked from the repository root and could not find its package-relative `index.html`; it passed when rerun from `apps/desktop`. An initial B2 test expected `NONE` after removing context supporting a still-cited need; corrected it to require `FAILED` and reran the full suite.

## Completion record

B2 is complete as a **shadow-only deterministic** milestone and is ready for review/signoff. Agent baseline: `0b32f9ec4236d1649fb8772edd13f8e6cce0bd08`. Skills baseline: `dcc52eb15b578a4dbc65e4c74b64dbf9806cc899`. The approved runtime projection observed at both baselines has 21 active version-1 definitions (informational only), equal normalized values, raw JSON SHA-256 `d3bd95cd2fe91c999f0331e25c4f68438954ed21804d43f35616a7f7239497ca`, and B2 runtime snapshot ID `approved-fnv128:f292695be12e86102468e1fa9f7d27f5`. The latter is a deterministic accidental-mismatch check, not an approval signature.

New code lives in `packages/ai/src/skill-evidence.ts`, `packages/ai/src/skill-shadow.ts`, `packages/skills/src/catalog-snapshot.ts`, `packages/skills/src/communication-signals.ts` and `packages/skills/src/evidence-aware-selector.ts`, with focused tests. Shared contracts gained only `CONTEXT_TAG`, a bounded 32-item structural evidence allowance, and the Skills baseline's two additional intent enum values. The existing production selector uses the same extracted eligibility/conflict helpers but still produces the same `CommunicationPlan`; only that plan reaches Composer. B2's assessment and selected references stay in memory and are visible solely through an optional content-free in-process trace. No new provider/model call, IPC, persistence, SkillPlan compiler or authoritative cutover exists.

Validation results:

- `vitest run` — 44 files / 287 tests passed after final code and six-signal boundary tests; focused B2/B1/coaching run — 5 files / 41 tests passed before the final ranking refinement.
- `eslint . --max-warnings 0` — passed.
- `tsc -p <package-or-app>/tsconfig.json --noEmit` — passed for contracts, skills, test-fixtures, AI, API and desktop.
- `tsc -p <package-or-app>/tsconfig.build.json` — passed for contracts, test-fixtures, skills, AI and API.
- `vite build` — passed for desktop main, preload and renderer with `--emptyOutDir false`; renderer was run from `apps/desktop` so its package-relative entry resolved.
- `node scripts/evaluate-phase-4.mjs` — 21/21 strict scenarios passed; expected-skill recall, precision, language eligibility and bounded-set rate remain 1, with zero forbidden/unnecessary/conflicting selections.
- `prettier --check . --end-of-line auto` and `git diff --check` — passed. Only B2-touched files were formatted; the documented Windows CRLF worktree exception remains and repository/index LF policy is unchanged.
- Structural comparison of the current 21 skill-selection fixtures — `MATCH: 21`, all other categories: 0. No raw content was emitted in this comparison.

Limitations: this Agent branch still uses the inline approved runtime representation while the committed Skills branch uses an equivalent generated representation; the values were verified equal, but a future branch integration must preserve that parity. The six-signal mapping is intentionally conservative and does not establish improved message quality. The first shadow comparator does not compare future B3 guidance because no B3 compiler exists. New Skills catalog revisions require a fresh fingerprint and review; uncommitted SRS research and candidate skills were not used. The root pnpm wrappers were not invoked because this host previously rewrote unrelated workspace configuration; direct underlying commands provided the equivalent gates. No live-provider test was needed.

Recommended B3 entry gate: obtain B2 review/signoff, recheck the exact approved catalog/fingerprint after any Skills-branch update, review shadow categories and signal boundaries on refreshed fixtures, then approve a separate B3 SkillPlan compilation plan. Do not begin B3 automatically.
