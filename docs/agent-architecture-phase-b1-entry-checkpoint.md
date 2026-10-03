# Agent architecture B1 — current skill-catalog entry checkpoint

Status: **B1 CONTRACT-ONLY COMPLETE; B2/PRODUCTION HOLD**. This checkpoint's catalog observations remain dated; no routing cutover is implemented.

Observed: 2026-10-04, read-only comparison of the `codex/agent-architecture` worktree and the concurrent `skills` worktree at `C:\Users\b\Documents\ChatGPT\AI messager-skills`.
Related: [revised architecture](agent-architecture-plan.md), [Agent–Skill boundary](agent-skill-integration-plan.md), [approved B1 execution plan](../.agent/plans/agent-architecture-phase-b1.md), [historical 2026-10-01 catalog checkpoint](agent-architecture-phase-b-checkpoint.md).

## Current catalog, schema and selector

- The `skills` branch is still based on `a77f476` and contains substantial uncommitted manifest-backed authoring, generated-registry, contract, AI-context and evaluation changes. It is not a merged or frozen integration revision. The agent worktree retains the earlier inline registry; copying either registry into the other would create competing sources.
- The observed approved manifest has 21 entries; its generated approved projection is validated/frozen as `initialSkillRegistry` in `packages/skills/src/registry.ts`. These are 21 `ACTIVE`, version-1 definitions at this observation, **not** a Phase B count or version invariant. Runtime reads the generated projection, not YAML, examples or private authoring metadata. Candidate and draft skills are excluded.
- `packages/contracts/src/skills.ts` remains the shared strict Zod schema for `SkillDefinition`, `SkillContext`, selected skill references and combined `CommunicationPlan`. A definition has canonical ID, positive integer version, `ACTIVE | INACTIVE` status, language/action/situation/intent eligibility, principles/avoidances and compatibility/conflict references. `SkillContext` carries fixed action, language, tags, draft and ambiguity flags but no source-attributed evidence. `CommunicationPlan` combines `SELECTED | NONE | FAILED`, up to four selected ID/version references and composed principles/avoidances.
- The public selector is still `createSkillEngine(input).select(context): CommunicationPlan`; it validates/freezes its supplied registry, filters active/action/language/tag eligibility, ranks deterministically, excludes conflicts and caps the selected set at four. `packages/ai` calls it through `CommunicationSkillPlanner.plan(context)`. `NONE` is a valid no-match result; local non-wording actions do not gain a wording call. No approved production evidence-aware selector, separate SkillPlan compiler or model assessor exists.
- Authoring approval and runtime status differ. In the observed skill work, `INHERITED` is valid only for an unchanged approved definition digest; changed definitions require reviewed `APPROVED` metadata, while `DRAFT` does not enter the generated runtime registry. Examples remain pending human review and outside runtime. A path or example-only change does not itself change a runtime skill version. Renaming/deprecation aliases and a general migration policy are not yet established.

## Taxonomy and relationship changes

The concurrent work organizes authoring records into eight atomic families plus `language_expression` modifiers, with neighbor distinctions and conceptual notes. This is private authoring organization, not Agent topology or approved communication-domain metadata. Runtime `compatibleSkills` and `conflictingSkills` remain explicit references; compatibility is not an automatic dependency or ranking bonus, and the current conflict behavior remains. Experimental SRS retrieval, semantic profiles, operation-support relationships, supervisor/assessment research, candidate skills and pending examples are not Phase B production inputs.

The skill-side SRS-4 planning file is still proposed/blocked on SRS-3. SRS-5 integrated shadow evaluation is proposed/blocked on accepted SRS-4, and SRS-6 production integration is proposed/blocked on an accepted SRS-5 `READY` decision. This does not prevent designing B1 contracts, but it prevents treating those experimental stages or the moving catalog as a finalized production seam.

## Boundary fit and B1 gate disposition

The revised seam still fits: Agent-owned fixed `AgentAction` plus a bounded source-attributed projection from Phase A `CommunicationProblem` enters a shared Skill System; the Skill System resolves approved exact ID/version references and later compiles communication guidance; the Agent alone controls execution. `packages/ai → packages/skills → packages/contracts` remains the dependency direction. No exactly-one skill owner, hard domain gate or catalog copy is required.

The user authorized contract-only B1 on 2026-10-04. The current agent worktree's committed approved `initialSkillRegistry` is the B1 validation baseline, supplied to generic validators rather than copied or hardcoded. The following disposition limits that authorization:

1. B1 adds adjacent Zod-first contracts and Skill-side validators. It does not edit the moving catalog, create an ownership map, implement assessment/selection/compilation algorithms, or change production selection.
2. B1 evidence has request-local IDs, source/provenance, closed kinds, small text/code values and qualified confidence. `taskPurpose` is the closed descriptive `PRIMARY_COACHING` scope, not a free-text goal. No Agent-side projection is wired yet; that awaits an actual B2 caller.
3. B1 uses an opaque bounded snapshot ID paired with a caller-supplied validated approved registry. Validators compare the ID and resolve active exact ID/version/action references. They do not derive a catalog content digest or alias renamed skills. The canonical registry provider remains responsible for the ID-to-snapshot pairing.
4. The [B1 plan](../.agent/plans/agent-architecture-phase-b1.md) preserves distinct assessment/selection/compilation seams and forbids action/orchestration fields in Skill outputs. A deterministic default returns `UNASSESSED`, not selected skills or advice; a nonempty assessment requires an injected allowed-signal set, deferred for B2 review.
5. Before B2, reconcile the concurrent manifest-backed catalog, public schema/selector exports, status/version semantics and snapshot identity with the agent branch. Resolve overlap in `packages/contracts/src/skills.ts`, `packages/skills/src/registry.ts`/exports and `packages/ai/src/skill-context.ts` without merging two registries. The existing flat selector and combined `CommunicationPlan` remain production-authoritative through shadow review.

## Decision

The revised B1 contract-only implementation is complete against the current committed approved registry seam; see the [completion record](../.agent/plans/agent-architecture-phase-b1.md#completion-record). The concurrent skill migration is **not** reconciled, so B2 evidence-aware selection and all production cutover remain on hold. There is no need for a complete ownership table. The next implementation milestone is B2 only after a separate review and authorization.
