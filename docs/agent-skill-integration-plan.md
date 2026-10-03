# Agent–Skill System integration plan

Status: B1/B2 frozen; B3 shadow-only complete pending review; production Skill flow unchanged; B4/B5 hold.

Updated: 2026-10-04
Related: [agent architecture plan](agent-architecture-plan.md), [Phase B checkpoint](agent-architecture-phase-b-checkpoint.md), [product behavior](product-behavior.md), [privacy](privacy.md).

## 1. Governing rule

> The Agent System owns the fixed action, orchestration, execution plan, agent selection, model-call budget, revision decisions and stop conditions. The Skill System receives the fixed action plus bounded source-attributed validated evidence and returns communication expertise. It may assess communication needs, select approved skills and compile guidance, but cannot change the action, invent user intent or control the agent loop.

The Agent decides **what work happens and what happens next**. The Skill System decides **which approved communication techniques support the fixed task and how they should guide communication**. Skills are shared communication capabilities, not exclusive property of specialist agents. This replaces the earlier Agent-side capability/domain router, exactly-one `SkillOwnershipMap` and domain-scoped selection proposal; none was implemented. The current production flat selector remains authoritative until a separate shadow/parity decision.

## 2. Current code and safe starting seam

`AgentActionSchema` in `packages/contracts/src/coaching.ts` includes `REWRITE_DRAFT`, `COMPLETE_DRAFT`, `SUGGEST_REPLY`, `SUGGEST_ACTIONS`, `ASK_CLARIFICATION` and `NO_REPLY_NEEDED`. `DECLINE` is **not** an `AgentAction`; it is an intent tag/skill or explicit user direction inside a fixed wording action. `decideCoachingAction` in `packages/ai` remains sole action authority. Phase A's validated `CommunicationProblem` now feeds only a bounded B2 shadow projection; it does not affect production selection or wording.

Today `deriveSkillContext` in `packages/ai` turns the validated coaching request and policy result into action, bounded tags, language and draft/ambiguity flags. `CommunicationSkillPlanner.plan(context)` delegates to the flat `createSkillEngine(...).select(context)` in `packages/skills`. That engine filters the canonical approved registry by `ACTIVE`, action, language and tags, ranks candidates, handles declared conflicts, then composes at most four skills into one `CommunicationPlan` with principles/avoidances. It returns `NONE` for the three non-wording actions. `coaching-engine.ts` bypasses skill/generation work for local policy results, parses returned plan shape and sends only compact guidance to the provider. A planner failure becomes `FAILED`; the Agent-owned coaching path chooses the current safe generic-guidance fallback.

This does **not** give the Skill System action or loop authority. The production `SkillContext`/`CommunicationPlan` path still combines selection and composition; B2's distinct evidence, assessment and selection path exists only for comparison. The current selector's bounded free-text `intent` remains unused. The committed Skills runtime projection at `dcc52eb` is definition-for-definition equal to this branch's approved registry; newer untracked Skills work is excluded. No second registry was added.

## 3. Authority matrix

| Runtime decision or value | Authority | Invariant |
| --- | --- | --- |
| Fixed action | Agent System owns | Policy fixes it before any Skill request; Skill cannot revise it. |
| User intent and validated goal | Agent System owns | Skill cannot infer an alternate user decision. |
| Evidence qualification/projection | Agent System owns | Agent chooses bounded permitted sources; Skill may assess them but not fabricate a new source. |
| Bounded evidence content | Shared input only | Skill receives read-only, source-attributed values/unknowns. |
| Execution depth and task plan | Agent System owns | Skill assessment cannot escalate depth. |
| Agent selection/assignment/topology | Agent System owns | Supervisor chooses which roles run and their tasks. |
| Communication-need assessment | Skill System owns | Skill assesses expertise needed for the fixed task, not Agent topology. |
| Skill eligibility/ranking | Skill System owns | Only canonical approved active, action/language-applicable skills may be selected. |
| Skill conflicts/compatibility | Skill System owns | Apply approved relationships across the selected set. |
| SkillPlan compilation | Skill System owns | Bounded guidance cites only selected skills and allowed evidence. |
| Communication metadata | Skill System owns | Optional capability/domain labels are non-exclusive and do not command agents. |
| Model-call budget/authorization | Agent System owns | A future Skill model port can use only an explicit Agent-granted allowance. |
| Composer and Evaluator invocation | Agent System owns | Skill may supply guidance but cannot invoke or override either. |
| Revision, retry and stop | Agent System owns | `NONE`/`FAILED`/uncertainty are data outcomes, not workflow commands. |
| Final output | Agent System owns | One coherent result remains reviewable; never send automatically. |

## 4. Agent → Skill: fixed task and source-attributed evidence

The Agent validates `CommunicationProblem` and the deterministic policy decision first, then sends only the fixed `AgentAction`, a bounded assigned task scope, language/eligibility context, approved snapshot binding, selection bound and **minimal source-attributed `SkillEvidence`**. `taskPurpose` describes the assigned execution scope only: it cannot introduce a new user goal, override the fixed action or direct orchestration. Any goal-bearing purpose must be supported by validated user input; prefer bounded structure over an unconstrained persuasive instruction. The Agent does not send the entire problem, screenshot, unbounded transcript, stable identity, relationship profile, hidden memory, provider payload or loop state. The Skill System treats action as a hard eligibility constraint, not a suggestion. The Agent checks that any projected context action equals the policy action before invocation.

Each evidence item needs a bounded ID, kind, source/provenance, bounded structured fact or excerpt, source reference and confidence where appropriate. Reuse Phase A provenance conventions where possible: user-supplied instruction or statement, observed screenshot conversation, deterministic derivation, analysis inference and explicit unknown; policy-owned action/facts need a distinguishable policy source if included. Exact enum names wait for B1 schema review. Evidence references permit a selection reason like “E2 + E5” without creating an unsupported premise. Unknown identity/relationship remains unknown; a visible contact label or avatar is not proof. The Skill System may make cautious communication-need assessments but cannot convert uncertainty into fact, invent a user goal, personalize from hidden memory or reinterpret action.

For example, current action `SUGGEST_REPLY` with explicit refusal evidence may support `decline`, `boundary_setting`, `de_escalation` or another approved skill. It cannot turn that task into acceptance/negotiation or ask the user to reconsider. `ASK_CLARIFICATION` and `NO_REPLY_NEEDED` cannot be reopened as wording generation. The Agent normally bypasses skills for non-wording actions; a defensive Skill call returns `NONE`. If evidence is inadequate, return bounded uncertainty, `NONE` or `FAILED` rather than fabricating context.

## 5. Skill-internal stages and Skill → Agent result

**Stage A — communication assessment:** from the fixed action and allowed evidence, identify bounded communication needs/signals with evidence references and uncertainty. `CommunicationAssessment` contains no skill selection, composed advice, action echo or Agent command. It cannot add user intent beyond validated inputs or choose agents.

**Stage B — skill selection:** from the assessment, fixed action, allowed evidence, language/context, bounds and approved snapshot, choose canonical approved active skill ID/version references with evidence-backed reasons. `SkillSelectionResult` returns `SELECTED`, valid `NONE` or `FAILED`, with an explicit uncertainty code or state where useful. It contains no composed advice.

**Stage C — SkillPlan compilation:** from the exact selected references, same fixed action, allowed evidence and applicable constraints, compile bounded principles, avoidances, tradeoffs, recommendations and optional wording guidance. Each claim/recommendation has appropriate evidence references; no selected reference may be silently added or substituted. A `SkillPlan` is communication expertise, not a final reply or workflow instruction. Assessment, selection and guidance quality are tested separately. A compatibility adapter may reconstruct today's `CommunicationPlan` principles/avoidances until a reviewed cutover. B1 defines these seams; B2 implements selection and B3 compilation.

All three output schemas are strict. `CommunicationAssessment`, `SkillSelectionResult` and `SkillPlan` **must not contain** `action`, `nextAction`, `agent`, `nextAgent`, `shouldContinue`, `shouldStop`, `shouldRevise`, `callModel`, `executionDepth`, `callBudget` or equivalent orchestration fields. The fixed action exists only in Agent → Skill inputs; no compatibility echo is assumed. Even if a future model produces Skill assessment, its output is normalized and validated before it enters the later stages. Only the Agent decides whether another selection, specialist, Composer, Evaluator or revision runs.

## 6. Proposed Zod-first seam

The following is a schematic view; the strict B1 schemas in `packages/contracts/src/agent-skill.ts` are authoritative for exact fields and bounds. They reuse `AgentActionSchema`, `SkillContextSchema`, `SkillDefinitionSchema`, canonical selected ID/version fields and existing guidance bounds. Shared cross-package values go in `packages/contracts`; Agent-only execution types stay in `packages/ai`; Skill algorithms and private authoring data stay in `packages/skills`.

```ts
type SkillEvidence = {
  id: string; // bounded and unique within the request
  kind: SkillEvidenceKind;
  source: SkillEvidenceSource; // source/provenance, including UNKNOWN
  sourceRef?: string; // bounded reference, not an identity key
  value?: BoundedStructuredFact | string;
  confidence?: Confidence;
};

type SkillAssessmentRequest = {
  action: AgentAction; // exactly the policy-owned action
  taskPurpose: BoundedDescriptivePurpose; // no new goal or orchestration directive
  evidence: SkillEvidence[];
  context: SkillContextProjection; // language/tags/draft/ambiguity; no conflicting action
};

type CommunicationAssessment = {
  needs: EvidenceBackedCommunicationNeed[];
  uncertaintyCodes: SkillUncertaintyCode[];
  // No action echo, skill selection, guidance or Agent command.
};

type SkillSelectionRequest = {
  action: AgentAction; // fixed Agent input, not a Skill output
  assessment: CommunicationAssessment;
  evidence: SkillEvidence[];
  context: SkillContextProjection;
  maxSkills: number; // bounded by the existing total cap
  catalogSnapshotId?: ApprovedCatalogSnapshotId;
};

type SkillSelectionResult = {
  status: "SELECTED" | "NONE" | "FAILED";
  selectedSkills: SelectedSkillReference[]; // canonical ID + exact version
  reasons: EvidenceBackedSelectionReason[];
  uncertaintyCodes: SkillUncertaintyCode[];
  failureCode?: SkillFailureCode; // only for FAILED
  catalogSnapshotId: ApprovedCatalogSnapshotId;
};

type SkillPlanCompilationRequest = {
  action: AgentAction; // fixed Agent input, not returned
  selection: SkillSelectionResult; // sole source of exact selected references
  evidence: SkillEvidence[];
  context: SkillContextProjection;
  constraints: BoundedCommunicationConstraints;
  catalogSnapshotId: ApprovedCatalogSnapshotId;
};

type SkillPlan = {
  status: "COMPILED" | "NONE" | "FAILED";
  selectedSkills: SelectedSkillReference[];
  principles: BoundedGuidance[];
  avoid: BoundedGuidance[];
  tradeoffs: BoundedGuidance[];
  recommendations: BoundedGuidance[];
  failureCode?: SkillFailureCode;
  catalogSnapshotId: ApprovedCatalogSnapshotId;
};

interface SkillAssessmentPort {
  assess(request: SkillAssessmentRequest): Promise<CommunicationAssessment>;
}

interface SkillSelector {
  select(request: SkillSelectionRequest): Promise<SkillSelectionResult>;
}

interface SkillPlanCompiler {
  compile(request: SkillPlanCompilationRequest): Promise<SkillPlan>;
}
```

The B1 names above correspond to strict Zod-first exports in `packages/contracts/src/agent-skill.ts` and Skill-side validators/ports in `packages/skills/src/agent-skill-boundary.ts`. The implemented `taskPurpose` is the closed `PRIMARY_COACHING` scope, with no free-text goal. B2 adds a validated `CONTEXT_TAG` evidence kind and permits up to 32 bounded structural evidence items so all existing context tags can be represented; no raw draft/message text is projected. B2 derives a deterministic, non-cryptographic approved-runtime fingerprint and validates the ID against the actual registry values, preventing accidental mismatched pairing. The six Skill-owned signal IDs and deterministic assessor/selector live in `packages/skills`; B1's inert `UNASSESSED` default remains available. The `SkillContext.intent` free-text field remains unused by the production selector and is omitted from the new projection. Strict assessment, selection and SkillPlan schemas verify references and reject action/orchestration fields. B3 evolves the compiler request to carry the validated selection result rather than duplicate selected references; its deterministic compiled guidance remains shadow-only.

## 7. Shared multi-agent use and non-exclusive metadata

Specialist agents are reasoning/execution roles chosen by the Supervisor. They may receive an Agent-assigned task, fixed action, permitted evidence and a shared `SkillPlan`, or request a bounded SkillPlan through an orchestrator-approved boundary. They do not own private exclusive skill registries. The same `emotional_validation` reference may support a conflict-focused task and a relationship-focused task when justified by each task's permitted evidence. The Supervisor, not the Skill System, chooses/starts/stops those agents.

Communication capabilities (for example conflict management, empathy, clarity, relationship preservation, assertiveness and tone/style) may be assessed **inside** the Skill System. Optional domain/capability labels are non-exclusive metadata: a skill may have zero, one or many of either. A companion `SkillId → CommunicationMetadata` map is possible, validated against the canonical snapshot, but there is no `SkillId → exactly one SpecialistDomainId` invariant. Prior proposed domain IDs are not B1 owner contracts. Authoring families, paths and prefixes are not automatic routing signals. Agent task labels and Skill communication metadata are different axes.

## 8. Provider-neutral internal assessment

The initial implementation uses `DeterministicSkillAssessor` behind the proposed provider-neutral `SkillAssessmentPort`. An optional `ModelSkillAssessor` or model-assisted SkillPlan compiler is allowed **later**, not required for Phase B. `packages/skills` must not import OpenAI, Electron, Fastify or `packages/ai`; an outer adapter supplies any model capability. A future model receives the same fixed action and only allowed bounded evidence, returns schema-validated communication assessment/guidance and may reference only approved skills. It cannot change action, user intent, agent topology, Composer/Evaluator execution, revision or stop conditions.

An internal Skill model call is still a model call: only the Agent may authorize it under an explicit budget/lease, account for it and decide whether to continue after failure. A port does not create permission to spend calls. Production remains deterministic until a separately approved experiment demonstrates quality benefit and passes provider/privacy review. No additional model call is introduced in initial Phase B.

## 9. Failure, snapshot and privacy behavior

Fail closed on invalid action/context/evidence, unknown or unresolved catalog, malformed evidence reference, unapproved/inactive skill, missing exact ID/version, snapshot mismatch, invalid SkillPlan or attempted workflow field. Return `FAILED` with a closed internal code and no selected skills/guidance; `NONE` is a legitimate no-match result, not failure. Unknown/insufficient evidence may instead produce bounded uncertainty or `NONE`. Do not guess a domain, fabricate evidence, broaden context, activate all skills, silently switch catalogs or choose a new action. The Agent decides the user-facing fallback and flow after any result.

Bind assessment, selection and compilation to one validated approved runtime catalog snapshot. The Skill System resolves selected references to exact IDs/versions there; the Agent verifies the returned binding before consuming guidance. Newly active, inactive, changed-version, removed or renamed IDs affect only validated references and approved catalog semantics; Phase B invents no alias/migration mechanism and no Agent code assumes a fixed count, YAML path, prefix or authoring family. Non-exclusive metadata must reject unknown skill references but need not assign any domain to every skill.

Selection and SkillPlan run in memory. Do not persist screenshots, raw messages, drafts, identities, relationships, private model reasoning, provider payloads or selected-skill history. The shadow path may produce only bounded structural, non-persistent `ExecutionTrace` values (such as status, skill refs, call count and error codes), never content or default analytics. Existing direct trusted-desktop-to-provider topology is unchanged.

## 10. Package dependency boundary

```text
packages/ai ──→ packages/skills ──→ packages/contracts
          └──────────────────────→ packages/contracts
```

`packages/ai` projects fixed action and evidence from `CommunicationProblem`, owns Supervisor/task assignment, enforces budgets and validates returned Skill outputs before use. `packages/skills` owns assessment, approved selection, optional non-exclusive metadata and SkillPlan compilation behind provider-neutral ports. `packages/contracts` holds shared bounded schemas inferred into TypeScript types. No `packages/skills → packages/ai` dependency, second registry, new microservice, HTTP route, renderer IPC or mandatory provider call is justified.

## 11. Revised shadow-first Phase B

1. **B1 — Agent ↔ Skill contract:** frozen at `0b32f9e`; fixed action input, bounded source-attributed evidence, closed descriptive `taskPurpose`, distinct assessment/selection/SkillPlan seams, and a provider-neutral assessment port. Skill outputs omit action and orchestration fields.
2. **B2 — Evidence-aware deterministic selection:** frozen at `60e2e9c` against committed Skills baseline `dcc52eb` and its matching approved runtime values. It preserves eligibility, conflicts, cap and production output, and produces structural comparison without a model call. See the [B2 execution plan](../.agent/plans/agent-architecture-phase-b2.md).
3. **B3 — SkillPlan compiler:** deterministic compilation from the exact selected canonical references into bounded, evidence-linked approved principles/avoidances for shadow comparison. No extra model call or production guidance change. See the [B3 execution plan](../.agent/plans/agent-architecture-phase-b3.md).
4. **B4 — Communication metadata:** add validated non-exclusive capability/domain metadata only where it measurably improves selection/evaluation; no Agent-side hard domain router.
5. **B5 — Shadow comparison and cutover review:** compare current flat selection with evidence-aware selection, exact IDs/versions, `NONE`, conflicts, guidance, refreshed fixtures and human-reviewed cases. The current production selector/Composer input remain authoritative through this review. Only a separate later decision may authorize cutover.

Each implementation slice gets its own execution plan under `.agent/PLANS.md`. The committed approved runtime projection is reconciled for B2/B3; newer uncommitted Skills work remains outside this baseline. B4/B5 and all production cutover remain separate authorization gates. The old complete one-owner-per-skill table is no longer a gate. This document does not authorize later routing or provider work.

## 12. Boundary test plan

Use deterministic synthetic fixtures and fake ports by default, with separate opt-in live evaluation:

1. Fixed policy `AgentAction` reaches Skill unchanged; assessment, selection and SkillPlan outputs contain no `action` field and cannot change user goal.
2. Strict Skill outputs reject `nextAction`, `agent`, `nextAgent`, `shouldContinue`, `shouldStop`, `shouldRevise`, `callModel`, `executionDepth`, `callBudget` and equivalent loop commands; `taskPurpose` cannot smuggle unsupported intent or orchestration.
3. Evidence retains ID, source/provenance, kind and qualified confidence; all cited evidence refs resolve to supplied items.
4. Skill assessment cannot fabricate unsupported evidence, add user intent, convert uncertainty into fact or promote a contact cue into confirmed identity/relationship.
5. Only approved active skills from the bound snapshot may be selected; every reference resolves to its exact version.
6. Assessment, selection and SkillPlan compilation are independently testable; SkillPlan cites only selected skills and allowed evidence.
7. A skill may carry multiple communication-domain/capability labels or none; no exactly-one-owner test exists.
8. The deterministic assessor is default; a fake model assessor can be swapped behind the port, but no initial Phase B provider call occurs.
9. `NONE`, `FAILED` and uncertainty are distinct; action/language/tag eligibility, conflicts, stable ordering and four-skill cap match refreshed baselines.
10. Skill failure cannot decide Agent flow; only Supervisor selects agents/tasks, and only Agent continues, composes, evaluates, revises or stops.
11. Shadow results cannot change production selection, Composer input, user-choice retry or public result; provider call count does not increase.
12. Privacy tests reject raw screenshots/messages/drafts, memory/identity data, provider payloads and private reasoning from traces and default logs.

## 13. Non-goals and acceptance

No LLM supervisor in initial Phase B, autonomous loop, skill-driven agent spawning/model selection/revision, semantic/vector retrieval, SRS-4 production integration, memory personalization, second registry or new microservice. These limits do **not** remove the overall multi-agent architecture: Supervisor, specialist agents, one Composer and Evaluator remain Agent-owned roles in later approved phases. Model-assisted Skill assessment/compilation is permitted only after a separate quality/privacy/budget gate.

The B1 contract and B2 selection slices remain separate frozen rollback points. B3 is reviewable when exact-reference compilation, bounds, evidence citations, structural guidance comparison and production-parity gates pass. None claims wording-quality improvement or production routing acceptance. B4 metadata, model-assisted ports and B5 cutover remain separately gated.
