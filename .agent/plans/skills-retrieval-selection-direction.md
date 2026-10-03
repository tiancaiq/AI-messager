# Skill retrieval, selection, and planning direction

Status: proposed — plan review required before implementation  
Owner: Codex  
Started: 2026-09-24  
Updated: 2026-09-24  
Roadmap milestone: proposed skills direction after the Phase 7 migration and bounded Phase 8 study; related application baseline: [Phase 4](phase-4.md)

## 1. Outcome

Recenter the `skills` branch on one product responsibility:

> Given the current conversation and an already-decided `AgentAction`, retrieve the most relevant approved communication capabilities, rank them, select the useful subset, resolve conflicts, and compile them into concise provider-neutral communication guidance.

The long-term success condition is that, over a large and diverse scenario set, required capabilities reliably appear in Top-K, rank near the top, are correctly selected or rejected, and produce useful non-contradictory `SkillPlan` guidance. Subjective final-sentence preference, broad UX quality, and provider-versus-provider comparisons belong to a separate evaluation project.

This document is the direction-reset and staged implementation/evaluation plan. It preserves completed Phase 3–8 work as evidence. It authorizes no implementation, candidate activation, provider call, commit, merge, or push.

For forward work on the `skills` branch, this plan supersedes the unfinished Phase 8 sequence as the active direction. The Phase 8 plan and results remain historical evidence; 8E activation decisions and expanded final-wording comparisons do not proceed automatically.

## 2. Scope

### In scope for this direction

- Preserve the Phase 3 action boundary: the Skill System consumes an `AgentAction`; it never chooses one.
- Separate hard eligibility, capability retrieval, capability ranking, supervisor selection, modifier selection, conflict/dependency handling, planning, and prompt compilation into inspectable stages.
- Make a configurable capability Top-K list, approximately Top 10 in evaluation/debug mode, a first-class development interface.
- Keep atomic capabilities/playbooks and language/delivery modifiers in separate competitions and typed budgets. Preserve `NONE`; do not freeze one permanent total-definition limit before evaluation.
- Support both `REWRITE_DRAFT` and empty-draft `SUGGEST_REPLY` with the same capability definitions.
- Add stage-specific evaluation, structured reason codes, and privacy-safe traces.
- Introduce a small provider-neutral `SkillPlan` and deterministic `DIRECT` versus `PLANNED` behavior only after the contract is reviewed.
- Reclassify existing Phase 8 evidence under retrieval, ranking, selection, content/plan, generation, or evaluation-harness failures.
- Stage technology according to measured catalog size and failure evidence.

### Out of scope

- Deciding `AgentAction`, whether a draft exists, or whether the product should rewrite versus generate.
- Activating `perspective_acknowledgement`, `give_constructive_feedback`, `confirmation`, or any other candidate.
- Detailed final-wording preference, aesthetic ranking, provider/model comparisons, or full end-to-end UX benchmarking.
- A full Skill Factory, ReAct loop, vector database, graph database, fine-tuned reranker, or multi-agent framework.
- Relationship/identity inference, durable memory, automatic insertion/sending, database work, UI expansion, or mobile work.
- Calling relevance scores probabilities or calibrated confidence.

## 3. Direction change

| Earlier Phase 8 emphasis                                                      | New primary emphasis                                                                                               |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Candidate guidance → generate four conditions → heavily compare final wording | Scenario → retrieve candidates → measure rank → select/reject subset → produce `SkillPlan` → sanity-check response |
| A/B wording uplift was a promotion gate                                       | Retrieval, ranking, selection, and plan quality are the owned gates; wording is only a bounded sanity check        |
| Selection was mostly observed as a final set                                  | Every stage receives its own result, trace, metric, and failure classification                                     |
| The current 21-skill scale shaped the interface                               | The interface must scale toward 1,000+ skills without prematurely adding large-catalog infrastructure              |

The bounded Phase 8 live study remains valid evidence. It is not the template for most future work on this branch.

## 4. Current state found in the repository

### Approved content and packaging

- `packages/skills/definitions/` contains 21 approved YAML records: 14 universal atomic capabilities, three English modifiers, and four Chinese modifiers.
- `packages/skills/definitions/approved-manifest.yaml` and the Phase 7 generator produce `packages/skills/src/generated/approved-registry.ts` with exact baseline parity.
- Canonical authoring examples, Phase 8 semantic review/remediation, focused human approval, candidate dossiers, and experiment results are versioned research/evaluation evidence. They are not normal prompt input.
- Production still exposes the original 21 approved definitions. Phase 8 candidate definitions are private/inactive fixtures; `confirmation` remains wholly deferred.

### Runtime behavior

- `packages/contracts/src/skills.ts` defines `SkillDefinition`, `SkillContext`, `SelectedSkill`, `CommunicationGuidance`, and a flat `CommunicationPlan` with `SELECTED | NONE | FAILED`, at most four selected skills, and deduplicated `principles`/`avoid` arrays.
- `packages/skills/src/engine.ts` currently collapses the full process into `SkillEngine.select(context)`:
  1. validate context;
  2. return `NONE` for non-wording actions;
  3. filter by active status, language, action, code-switch requirement, and intent/situation overlap;
  4. score intent, situation, and language matches;
  5. sort deterministically;
  6. greedily select up to four non-conflicting definitions;
  7. flatten their guidance.
- The score is an internal ordering heuristic, not a probability or calibrated confidence.
- `packages/ai/src/skill-context.ts` deterministically derives routing tags from the request and fixed policy decision. The two Phase 8 experiment tags require an explicit `experimentalCandidateRouting` opt-in; default production derivation is unchanged.
- `packages/ai/src/coaching-engine.ts` invokes the selector after the action gate, converts the flat plan to compact guidance, and keeps the normal generation path to one provider call.
- `packages/ai/src/coaching-prompt.ts` receives only bounded provider-neutral principles and avoidances, not the registry or skill IDs.

### Evaluation behavior

- `packages/skills/src/evaluation.ts` measures final-selection recall/precision, forbidden/unnecessary/conflict/language/bound rates, and a strict scenario pass. It does not measure retrieval recall, rank, MRR, supervisor rejection, or plan-step provenance separately.
- Phase 4 regression fixtures protect action, language, selection, composition, `NONE`, conflicts, and bounded guidance.
- Phase 6 already distinguishes definition validity, context extraction, selection, composition, and final wording. Its canonical/held-out separation, required/acceptable/forbidden labels, preservation ledgers, and privacy rules remain useful.
- Phase 8B produced three revision-bound candidate dossiers. The evidence supported continued experiments for `perspective_acknowledgement` and `give_constructive_feedback` and deferred `confirmation` as insufficiently distinct from `request`.
- The bounded Phase 8C/8D experiment found correct deterministic selection in its exposed synthetic corpus. It did not provide independent held-out evidence or human uplift scores. Eight `give_constructive_feedback` rewrite arms failed shared response validation across all conditions; that is a generation/verifier-harness finding, not a candidate-selection result.

### Main gap

The code can report the final selected set, but it cannot answer these questions with a stable contract:

- Which skills failed hard eligibility, and why?
- What were the Top-K capability candidates and their scores/ranks?
- Which modifiers were separately eligible and selected?
- Did retrieval find a required skill but rank it poorly?
- Did the supervisor reject a well-ranked skill, and why?
- Did conflict resolution remove a candidate?
- Which selected skills contributed each plan instruction?
- Was a weak result caused by retrieval, ranking, selection, skill content, planning, compilation, generation, or a bad label?

## 5. Existing work disposition

### Retain unchanged as authoritative evidence

- Phase 3 atomicity, neighbor, composition-before-proliferation, action-preservation, and `NONE` rules.
- Phase 4 authoring/runtime separation, YAML source of truth, strict validation, provider neutrality, and bounded prompt payload.
- Phase 5 candidate cards and canonical examples as exposed development material, not held-out scores.
- Phase 6 fixture contracts, required/acceptable/forbidden labeling, preservation ledgers, multilingual requirements, and split discipline.
- Phase 7 manifest, generator, approval/provenance controls, frozen parity evidence, and 21-skill production boundary.
- Phase 8 semantic review, remediation, focused user approval, candidate dossiers, isolation tests, and bounded experiment results.
- Existing action/language gates, deterministic ordering, strict schemas, failure normalization, and explicit `NONE`/`FAILED` distinction.

### Reduce or stop on this branch

- Do not expand the four-condition `G/E/N/E+N` live comparison into the branch’s default development loop.
- Do not spend most skill work choosing between small stylistic wording variants.
- Do not require broad provider-based response uplift before retrieval/ranking/selection diagnostics exist.
- Do not use a broad aesthetic verifier as the primary judge of skill quality.
- Do not create a new skill merely because one generated response was weak.

### Move to the separate final-message evaluation project

- Elegant/warm/natural wording preferences beyond basic reasonableness.
- Provider/model comparisons and overall response-quality benchmarks.
- Full UX preference studies and end-to-end product scoring.
- Large blinded output-review programs whose main question is final prose preference.

### Preserve but reclassify Phase 8 findings

| Existing finding                                    | New failure stage                                |
| --------------------------------------------------- | ------------------------------------------------ |
| Candidate missing from an eligible list             | Retrieval or upstream context-derivation failure |
| Candidate present but low-ranked                    | Ranking failure                                  |
| Candidate high-ranked but wrongly included/excluded | Supervisor-selection failure                     |
| Correct candidate with vague or unsafe principles   | Skill-content or `SkillPlan` failure             |
| Numeric rewrite anchor rejects all comparison arms  | Generation/verifier-harness failure              |
| `confirmation` cannot separate from `request`       | Skill-boundary ambiguity or duplicate-skill risk |
| Incorrect expected labels                           | Bad-evaluation-label failure                     |

## 6. Product and architecture boundaries

The stable flow remains:

```text
ConversationAnalysis
        ↓
Phase 3 action policy
        ↓ fixed AgentAction and user intent
Skill System
        ↓ provider-neutral guidance
Generation
```

The Skill System may influence how the fixed action is communicated. It must not:

- choose or change `AgentAction`;
- convert refusal into acceptance;
- add a reason, fact, date, deadline, commitment, identity claim, motive, or certainty not supported by the draft/context;
- force a clarification when the upstream action chose generation;
- infer confirmed identity or relationship facts;
- send or insert a message.

`REWRITE_DRAFT` treats facts, decisions, commitments, and uncertainty in the draft as source evidence unless contradicted by stronger visible context. `SUGGEST_REPLY` has no draft evidence and must ground content in visible context and explicit user intent. The same communication capability should normally serve both modes; mode differences belong in application context, preservation requirements, examples, and plan compilation rather than duplicate `*_rewrite` and `*_generate` definitions.

## 7. Target runtime architecture

```text
Approved Skill Registry
        ↓
Hard Eligibility Filter
        ↓
Split by definition type
        ↓
Capability Retriever
        ↓ broad atomic/playbook candidate pool
Optional Reranker
        ↓ evaluation/debug capability Top-K (about 10)
Capability Supervisor
  sees relevance, type, conflicts, dependencies
        ↓ proposed 0–N capabilities, including NONE
Modifier Eligibility / Selection
        ↓ proposed 0–M language/delivery modifiers
Deterministic Conflict / Dependency Resolution
        ↓
Skill Planner
        ↓ SkillPlan (DIRECT or PLANNED)
Prompt Compiler
        ↓ compact provider-neutral guidance
Generator
```

At the current scale, retrieval, reranking, supervision, and planning should remain deterministic unless evaluation demonstrates that a model materially improves a measured failure stage. Interfaces should be separable now; extra services, calls, or infrastructure should not be.

Capabilities and modifiers must not compete for the same Top-K positions or the same undifferentiated selection slots. Conceptually, a useful starting budget is zero to four communication capabilities plus zero to two modifiers, but those numbers are evaluation settings rather than permanent contracts. The existing production selector remains capped at four total definitions until a later reviewed migration.

### 7.1 Hard eligibility

Hard gates should be limited to rules that truly make a definition unavailable:

- approved/active runtime status;
- fixed `AgentAction` eligibility;
- supported language family and code-switch requirements;
- explicit evaluation-only catalog isolation;
- genuinely missing required context, but only when that prerequisite is represented as reviewed structured metadata;
- future truly mandatory prerequisites, if introduced and reviewed.

Intent and situation metadata currently act as both filters and scores. The immediate harness must expose the effect of that choice. It should compare current exact behavior with a shadow configuration where intent/situation metadata are retrieval signals rather than irreversible gates. Production behavior does not change until recall/precision evidence and regression review justify it.

The current free-text `doNotUseWhen` field remains authoring guidance. SRS-1 must not turn it into executable exclusion logic. Any future runtime exclusion requires a separate structured condition, schema validation, examples, and boundary tests.

### 7.2 Capability retrieval and ranking

- Retrieve atomic capabilities and any future approved playbooks, not modifiers, into an ordered candidate list with stable IDs, versions, `retrievalScore`, rank, and compact matched-feature reason codes.
- Scores are scenario-local ordering evidence, never probabilities. Equal numeric scores across different conversations do not imply equal confidence or relevance.
- Keep K configurable. Evaluation/debug output defaults to approximately 10; production K is decided from measured recall/latency, not embedded as a permanent constant.
- At 21 skills, deterministic metadata scoring is sufficient. No embeddings are needed to prove the interface.
- Reranking may initially be identity/no-op while retaining a separate result field. Do not manufacture a second algorithm solely to populate the stage.

### 7.3 Skill Supervisor

The supervisor consumes fixed action/context plus Top-K capability summaries and evidence. Each summary includes definition type, relevance evidence, declared conflicts, and declared dependencies when that mechanism exists. It outputs a bounded proposed capability decision:

```ts
type SkillSelectionDecision = {
  selectedCapabilities: Array<{ id: string; reasonCode: string }>;
  rejectedCapabilities: Array<{ id: string; reasonCode: string }>;
};
```

This is conceptual, not a final schema. The first implementation should use deterministic rules and concise enumerated reason codes. It must support an empty capability set, consider structural conflicts before proposing a set, and never request hidden chain-of-thought. A model-based supervisor is a later evidence-driven option, not the default architecture.

### 7.4 Modifier selection

- Language/delivery modifiers use their own eligibility and selection path; they do not consume capability Top-K positions.
- Modifier selection may consider fixed action/context and the proposed capabilities, but cannot alter the underlying user decision or add a communication job.
- Use a separate configurable modifier budget. Zero modifiers is valid.
- Avoid redundant or mutually inconsistent modifiers and record concise selection/rejection reason codes.

### 7.5 Conflict and dependency resolution

- Preserve bilateral conflict checks and deterministic winners.
- Give the supervisor conflict/dependency metadata before it proposes a set, then enforce the rules again in a deterministic final resolver.
- Record whether a candidate was rejected for conflict, selection limit, missing prerequisite, redundancy, or lack of incremental value.
- Do not add a dependency graph while the approved registry has no measured dependency need.
- If dependencies are introduced later, validate references and cycles at build time and report dependency accuracy only when the mechanism exists.

### 7.6 Skill Planner and `SkillPlan`

The current flat `CommunicationPlan` is a useful compatibility baseline, not the final planner representation. The reviewed contract should minimally express:

```ts
type SkillPlan = {
  status: "SELECTED" | "NONE" | "FAILED";
  mode: "DIRECT" | "PLANNED" | null;
  capabilities: Array<{ id: string; version: number; reasonCode: string }>;
  modifiers: Array<{ id: string; version: number; reasonCode: string }>;
  objective: string | null;
  steps: Array<{
    instruction: string;
    sourceSkills: string[];
    priority: number;
  }>;
  avoid: Array<{
    instruction: string;
    sourceSkills: string[];
  }>;
  preserve: {
    intent: true;
    facts: true;
    commitments: true;
    uncertainty: true;
  };
};
```

The exact schema remains a design gate. Requirements are more important than field names:

- every instruction is attributable to one or more selected skills or a global preservation invariant;
- no hidden free-form rationale or chain-of-thought;
- `NONE` and `FAILED` contain no stale guidance;
- duplicate and contradictory instructions are rejected or deterministically resolved;
- plan budgets are explicit;
- preservation applies in both assistance modes, with stricter draft-source checks for rewrites.

Initial `DIRECT` eligibility should be conservative: a simple, non-conflicting set whose guidance can be compiled without ordering, normally one atomic capability plus optional compatible delivery modifiers. Use `PLANNED` when multiple atomic jobs require ordering, overlap resolution, or a supported communication sequence. Do not infer mode only from prose length. The decision rule must be deterministic, tested, and revisable before runtime adoption.

`DIRECT` and `PLANNED` are modes of the same `SkillPlan` contract, planner, compiler, and execution path. `DIRECT` is a lightweight plan with fewer steps, not a second composition system.

### 7.7 Prompt Compiler

The compiler transforms `SkillPlan` into the existing compact provider-neutral guidance boundary. It must:

- preserve source ordering and priority deterministically;
- remove exact duplicates and detect tested contradictions;
- enforce prompt budgets;
- include preservation rules appropriate to the fixed action/mode;
- omit registry metadata, scores, ranks, expected labels, review evidence, and reason codes from provider prompts;
- remain provider-neutral and keep the normal generation path to one model call.

The first integration should prove that compiling an equivalent plan reproduces the current Phase 4 guidance bytes or an explicitly reviewed minimal diff. Provider adapters remain unchanged unless the compiler’s validated output contract requires a narrow update.

### 7.8 Optional verifier

A future post-generation verifier may check intent, facts, commitments, uncertainty, and forbidden claims. It is outside the SRS-1 critical path and cannot block retrieval/selection/planning progress. It must not become an aesthetic judge, expose hidden reasoning, or add a second normal-path call without measured need and separate approval. Generation in this branch receives only basic preservation and reasonableness checks.

## 8. Structured trace and privacy

Evaluation/debug traces should contain only inspectable metadata:

- registry and definition revision/digest;
- candidate ID/version and definition type;
- eligibility result and reason codes;
- retrieval/rerank scores and ranks;
- supervisor selected/rejected result and reason code;
- final conflict/dependency resolution outcome;
- the explicit stage where the candidate disappeared, if it did;
- plan-step source IDs;
- coarse failure category;
- action/language/mode enums where allowed.

Each capability trace should preserve the stage transitions rather than only the final answer:

```json
{
  "id": "perspective_acknowledgement",
  "type": "ATOMIC",
  "eligibility": { "passed": true, "reasonCodes": [] },
  "retrieval": { "score": 18, "rank": 4 },
  "rerank": { "score": 18, "rank": 2 },
  "supervisor": {
    "selected": false,
    "reasonCode": "REDUNDANT_WITH_EMOTIONAL_VALIDATION"
  },
  "finalResolution": { "included": false, "reasonCode": null },
  "disappearedAt": "SUPERVISOR"
}
```

Allowed disappearance stages should be enumerated, for example `HARD_ELIGIBILITY`, `RETRIEVAL_CUTOFF`, `RERANK_CUTOFF`, `SUPERVISOR`, `FINAL_RESOLUTION`, or `RETAINED`. Modifier traces use their own eligibility/selection stages rather than pretending they participated in capability retrieval.

Expected/acceptable/forbidden labels belong to evaluation observations, not runtime traces. Ordinary logs must not retain conversation text, drafts, generated replies, prompt text, identity/contact data, or credentials. Development fixtures remain synthetic. Debug traces may be returned request-locally or written only to an explicit user-approved artifact path; they are not durable user/contact history.

## 9. Evaluation architecture

### 9.1 Stage-specific failure taxonomy

Every failed scenario receives one primary stage and optional contributing stages before a fix is proposed:

- `AGENT_ACTION_UPSTREAM_ISSUE`
- `CONTEXT_DERIVATION_FAILURE`
- `RETRIEVAL_FAILURE`
- `RANKING_FAILURE`
- `SUPERVISOR_SELECTION_FAILURE`
- `CONFLICT_OR_DEPENDENCY_FAILURE`
- `SKILL_CONTENT_FAILURE`
- `SKILL_PLAN_FAILURE`
- `PROMPT_COMPILATION_FAILURE`
- `GENERATION_ISSUE`
- `SKILL_BOUNDARY_AMBIGUITY`
- `MISSING_SKILL`
- `DUPLICATE_SKILL`
- `BAD_EVAL_LABEL`
- `EVALUATION_HARNESS_FAILURE`

A failed generated message does not automatically justify a new skill or a retrieval change.

### 9.2 Metrics owned by this branch

| Stage                | Required measures                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Eligibility          | action/language/status/type eligibility accuracy; experiment-catalog isolation                                                                                                          |
| Capability retrieval | Recall@5; Recall@10; `RequiredSkillCoverage@K` (required IDs found / required IDs); `AllRequiredFound@K`; missing-required count; forbidden-capability presence in Top-K                |
| Capability ranking   | rank of every required capability; rank distribution by skill/language/mode; reciprocal rank and MRR as supplementary single-target summaries, never the only multi-skill metric        |
| Supervisor           | required capabilities selected; acceptable capabilities selected; forbidden capabilities selected; unnecessary capabilities selected; capability-`NONE` accuracy; selected-set size     |
| Modifier selection   | eligible modifier coverage; unnecessary/ineligible modifier rate; modifier-free accuracy when no modifier is useful; modifier count                                                     |
| Resolution           | conflict rate, deterministic-winner accuracy, disappearance-at-resolution count, dependency accuracy only if dependencies exist                                                         |
| Plan                 | required-capability coverage, modifier separation, source attribution, contradictory-guidance rate, duplicate-guidance rate, critical omission rate, `DIRECT`/`PLANNED` appropriateness |
| Preservation         | intent, fact, commitment, uncertainty, speaker ownership, and language preservation                                                                                                     |
| Operations           | deterministic repeatability, invalid result rate, latency, candidate-count denominators, and disappearance-stage distribution                                                           |

Every report includes numerators, denominators, unique scenario groups, catalog revision, split, assistance mode, language slice, and per-skill results. Empty suites are invalid. `NONE` and `FAILED` remain distinct. A score of `0.80` must be described as ranking evidence within one scenario's candidate set, not 80% confidence and not directly comparable with `0.80` from another scenario.

### 9.3 Scenario contract

Reuse the Phase 6 annotation model and add stage expectations:

- scenario ID/group/split and synthetic source;
- fixed `AgentAction` and assistance mode;
- visible context/draft and supported fact/commitment/certainty ledger;
- required, acceptable, forbidden, and strict-`NONE` capability labels;
- required/acceptable/forbidden modifier labels, kept separate from capability labels;
- expected hard eligibility;
- acceptable capability-retrieval rank range where meaningful;
- allowed final selection alternatives;
- expected plan requirements and forbidden guidance;
- language/script/code-switch expectations;
- primary failure category if the case fails;
- reviewer state and revision binding.

Canonical examples and prior Phase 8 cases are development evidence. Fresh held-out cases must be grouped by scenario family so translations and paraphrases do not leak across splits.

### 9.4 Development loop

```text
Scenario and expected capabilities
        ↓
Hard eligibility correct?
        ↓
Required capability in Top-K?
        ↓
Rank sufficiently high?
        ↓
Supervisor selected the right subset or NONE?
        ↓
Modifier selector added only useful delivery guidance?
        ↓
Conflicts/dependencies resolved?
        ↓
SkillPlan useful and non-contradictory?
        ↓
Compiled guidance preserves invariants?
        ↓
Basic response sanity check
        ↓
Classify failure, make smallest stage-local fix, add regression
```

Detailed final-message preference stops after the basic sanity boundary and moves to the other evaluation project.

## 10. Technology staging

### NOW — current catalog through approximately 50 skills

- Deterministic hard eligibility and metadata retrieval.
- Configurable capability Top-K debug harness, defaulting to approximately 10.
- Separate capability retrieval/ranking/supervisor, modifier-selection, resolution, and plan traces even if some implementations remain simple.
- Deterministic capability supervisor with `NONE`, structural metadata, and reason codes, followed by separate deterministic modifier selection.
- Typed evaluation budgets for capabilities and modifiers; no permanent combined 0–5 rule.
- Minimal reviewed `SkillPlan` plus deterministic compiler.
- Existing approved registry and synthetic fixtures; no vector or external index.
- Shadow/evaluation mode before any production behavior switch.
- One model call on the normal generation path.

### BEFORE 100 SKILLS

- Expand independently reviewed aliases, neighbor metadata, negative evidence, and retrieval text only when regressions show a gap.
- Add lightweight lexical retrieval if metadata scoring no longer meets frozen Recall@K targets.
- Grow multilingual, multi-mode, hard-negative, and strict-`NONE` held-out sets.
- Evaluate whether reranking materially improves multi-skill coverage, per-required-skill ranks, and precision without hurting recall or latency. Treat MRR as supplementary.
- Add explicit dependency semantics only if real compositions cannot be represented safely without them.
- Decide production capability and modifier budgets separately from measured plan quality and prompt budget.

### 100–300 SKILLS

- Evaluate precomputed embeddings and hybrid lexical/metadata retrieval against the deterministic baseline.
- Prefer an in-memory index and offline build artifacts; retain exact registry revision binding.
- Evaluate a model-assisted reranker or supervisor only if deterministic methods show a measured, persistent error class that the model fixes safely.
- Add recall/latency/load-size budgets and shadow comparison before production adoption.

### 300+ SKILLS

- Use broad capability retrieval (for example 30–50) followed by measured reranking to a debug capability Top-K around 10, then typed capability and modifier selection budgets.
- Consider hybrid retrieval, incremental index builds, caching, and more formal conflict/dependency resolution.
- Consider an external vector service only if in-memory latency, memory, update, or deployment evidence requires it and privacy/operations review approves it.
- Calibrate confidence only after enough representative labeled data exists; keep relevance scores otherwise.

### DEFER

- Full Skill Factory and automatic promotion.
- Vector database, graph database, fine-tuned reranker, or agent framework without measured need.
- ReAct for normal message generation.
- Broad aesthetic response verifier or judge.
- Candidate activation, playbook runtime, relationship/memory-driven retrieval, or production telemetry containing conversation content.
- Manufacturing skills to reach a catalog-size target.

## 11. Sequential phase breakdown

The direction is divided into seven independently authorized phases. Complete, report, and review each phase before starting the next; approval never rolls forward automatically.

| Order | Phase                                         | Outcome                                                                                                                                     | Production behavior               | Plan                                                 |
| ----- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ---------------------------------------------------- |
| 1     | SRS-1 — Baseline and trace foundation         | Freeze current behavior, define typed stage traces, disappearance stages, scenario contract, and exact baseline evidence.                   | Unchanged                         | [SRS-1 plan](skills-srs-1-foundation.md)             |
| 2     | SRS-2 — Capability retrieval and ranking      | Build shadow hard eligibility, capability-only Top-K, ranking metrics, and the intent/situation signal experiment.                          | Unchanged                         | [SRS-2 plan](skills-srs-2-retrieval.md)              |
| 3     | SRS-3 — Supervisor, modifiers, and resolution | Add capability supervision, separate modifier selection, typed budgets, and deterministic final resolution.                                 | Unchanged                         | [SRS-3 plan](skills-srs-3-selection.md)              |
| 4     | SRS-4 — SkillPlan and Prompt Compiler         | Add one shadow planner/compiler pipeline with `DIRECT` and `PLANNED` modes and source attribution.                                          | Unchanged                         | [SRS-4 plan](skills-srs-4-planning.md)               |
| 5     | SRS-5 — Integrated shadow evaluation          | Evaluate the complete shadow pipeline on reviewed development/held-out scenarios and issue a production-readiness decision.                 | Unchanged                         | [SRS-5 plan](skills-srs-5-shadow-evaluation.md)      |
| 6     | SRS-6 — Production integration                | Integrate the reviewed pipeline behind a reversible flag, prove preservation/privacy, and decide migration from the compatibility selector. | Flagged until separately approved | [SRS-6 plan](skills-srs-6-production-integration.md) |
| 7     | SRS-7 — Catalog growth and scale              | Establish the evidence-driven growth loop and introduce lexical/embedding/hybrid retrieval only at measured thresholds.                     | Separately authorized increments  | [SRS-7 plan](skills-srs-7-scaling.md)                |

**Immediate next phase:** SRS-1 only. SRS-1 does not implement retrieval, supervision, modifier selection, planning, compilation, or production routing. It establishes the contracts and baseline that later phases must use.

### Integrated target delivered across SRS-1 through SRS-5

### Outcome

For a synthetic scenario and fixed `AgentAction`, produce a reproducible debug/evaluation result that shows hard eligibility, capability Top-K, scores/ranks, capability-supervisor decisions, separate modifier decisions, final conflict/dependency outcomes, disappearance stages, and one provisional `SkillPlan`, without changing default production behavior.

### Aggregate in scope

- Refactor the current deterministic algorithm behind internal stage interfaces while preserving `SkillEngine.select()` compatibility and exact Phase 4 production outputs.
- Add strict schemas for debug/evaluation results, definition types, and disappearance stages. Keep expected labels outside runtime records.
- Implement configurable deterministic capability retrieval and a no-op/identity rerank stage. Modifiers do not enter this Top-K.
- Implement deterministic capability-supervisor decisions with structural metadata and zero-selection support, followed by separate modifier selection and deterministic final resolution.
- Produce a provisional planner/compiler result through one pipeline for both `DIRECT` and `PLANNED`; do not route production generation through it in SRS-1.
- Extend metrics with Recall@5/10, `RequiredSkillCoverage@K`, `AllRequiredFound@K`, every required capability's rank, forbidden Top-K presence, supplementary MRR, supervisor/modifier metrics, `NONE`, disappearance stages, and plan integrity.
- Add a local CLI/report using synthetic current fixtures plus explicitly isolated Phase 8 candidate catalogs.
- Reclassify existing Phase 8 cases by failure stage and retain the numeric-anchor failure as a generation/verifier-harness regression.

### Aggregate out of scope

- Production selector replacement or prompt-path changes.
- New candidates, candidate activation, schema aliases for deferred candidates, or changes to approved YAML guidance.
- Embeddings, lexical search libraries, network calls, provider calls, UI, database, or live data.
- A model-based supervisor, paid evaluation, or detailed final-message review.

### Mapping the integrated work to phases

1. **SRS-1:** freeze baseline/fixtures and add the minimum typed trace/scenario foundation without stage behavior.
2. **SRS-2:** implement hard eligibility, type partitioning, capability retrieval/ranking, and retrieval metrics in shadow mode.
3. **SRS-3:** implement deterministic capability supervision, separate modifier selection, structural visibility, and final resolution.
4. **SRS-4:** implement one provisional `SkillPlan`/compiler pipeline for both modes and assert compiled-guidance parity.
5. **SRS-5:** integrate the debug harness, exercise both assistance modes/languages/neighbors/`NONE`, classify failures, and stop with a readiness decision.
6. **SRS-6:** only after separate approval, integrate the reviewed path behind a reversible production flag.
7. **SRS-7:** grow the catalog and retrieval technology only from measured gaps.

### Illustrative debug result

```text
Scenario: sr1-feedback-rewrite-01
AgentAction: REWRITE_DRAFT
Expected: give_constructive_feedback

Top 10:
1. request                         retrievalScore=22
2. give_constructive_feedback     retrievalScore=20
3. de_escalation                   retrievalScore=10

Supervisor selected:
- give_constructive_feedback — SUPPORTED_BEHAVIOR_IMPACT_CHANGE
- request — SUPPORTED_ACTION_REQUEST

Rejected:
- de_escalation — NO_ESCALATION_EVIDENCE

Modifier selection:
- en.professional_conciseness — PROFESSIONAL_CONTEXT

Final resolution:
- request — retained
- give_constructive_feedback — retained
- en.professional_conciseness — retained

SkillPlan: PLANNED
1. Describe only the observable behavior.
2. Explain the supported concrete impact.
3. Request the supported change.
Avoid guessing motive, character, frequency, or consequences.
```

The concrete score scale and reason-code names are implementation decisions to review; the output must not imply probability.

## 12. Integrated contracts and data flow target for SRS-1 through SRS-5

```text
Synthetic ConversationAnalysis + fixed AgentAction
        ↓ derive existing SkillContext
Approved or explicitly isolated evaluation catalog
        ↓ hard eligibility
EligibilityTrace[]
        ↓ split by definition type
Capability definitions             Modifier definitions
        ↓ deterministic retrieval          ↓ eligibility/selection
RankedCapability[]                  ModifierDecision[]
        ↓ identity rerank for SRS-1
Capability Top-K
        ↓ deterministic supervisor
Proposed capabilities (typed evaluation budget)
        ↓ combine with modifier decisions
Deterministic final resolution
        ↓ resolved capabilities + modifiers
One private provisional planner
SkillPlan
        ↓ compiler
Existing CommunicationGuidance
```

No screenshot or real conversation enters this harness. The default production path continues to call the compatibility selector and current compiler behavior until a later milestone is approved.

## 13. Integrated tests and evaluation target for SRS-1 through SRS-5

### Lowest useful layer

- Schema tests for definition types, uniqueness, rank continuity, nullable stage values, score finiteness, typed budgets, `NONE`/`FAILED`, disappearance-stage validity, reason codes, source-skill references, and stale guidance rejection.
- Eligibility tests for status, action, language family, code-switching, unsupported primary language, structured prerequisite absence, experiment catalog isolation, and proof that free-text `doNotUseWhen` is not executed.
- Capability-retrieval tests for stable tie-breaking, configurable K, no modifier crowd-out, no probability/cross-scenario-confidence naming, every-required-rank calculation, and repeatability.
- Capability-supervisor tests for required/acceptable/forbidden sets, strict `NONE`, conflicts visible before selection, typed selection limits, and rejection codes.
- Modifier tests for separate eligibility/budget, zero-modifier cases, unnecessary/ineligible modifiers, and decision-preserving delivery changes.
- Final-resolution tests for deterministic conflict winners, missing prerequisites, and correct `disappearedAt` values.
- Planner/compiler tests proving one pipeline for `DIRECT` and `PLANNED`, source attribution, deterministic ordering, typed rule budgets, exact duplicates, known contradictions, preservation flags, and current-guidance parity.

### Integration/regression

- Every existing Phase 4 fixture returns the same production `CommunicationPlan` and guidance in the same order.
- All 21 approved definitions and 153 frozen Phase 7 plans remain exact.
- Default context derivation does not route Phase 8 candidates.
- Evaluation-only catalogs cannot enter manifest, generated registry, public imports, production build, or prompts.
- Both `REWRITE_DRAFT` and empty-draft `SUGGEST_REPLY` have representative expected, neighbor, and `NONE` cases.
- English, Simplified Chinese, Traditional Chinese, mixed language, and unsupported-language behavior are sliced separately.

### Initial report gates

SRS-1 is a foundation/parity milestone, not a ranking claim. SRS-2–SRS-5 progressively deliver and assess the harness. Do not tune thresholds after seeing a held-out result. Performance targets must be frozen from earlier-phase evidence and reviewed before the phase that uses them.

## 14. Integrated SRS-5 acceptance criteria

- [ ] A single scenario result exposes eligibility, ordered capability Top-K, score/rank, capability-supervisor decisions, separate modifier decisions, final conflict/dependency outcome, `disappearedAt`, and provisional `SkillPlan`.
- [ ] Capabilities and modifiers use separate candidate paths and typed configurable budgets; modifiers cannot crowd capabilities out of Top-K or their selection budget.
- [ ] Retrieval scores are named and documented as scenario-local, non-probabilistic, and not comparable as confidence across conversations.
- [ ] Capability Top-K defaults to approximately 10 in evaluation/debug mode; final capability and modifier budgets are separate and allow zero; default production output remains exactly current mixed 0–4 behavior.
- [ ] `NONE` is a first-class successful result and is distinguishable from `FAILED`.
- [ ] Failures can be assigned to the stage taxonomy without reading hidden chain-of-thought.
- [ ] Retrieval reports include Recall@5/10, `RequiredSkillCoverage@K`, `AllRequiredFound@K`, every required capability's rank, forbidden-capability Top-K presence, and denominators; MRR is not used alone for multi-skill cases.
- [ ] Existing Phase 4 selected IDs, ordering, guidance, action behavior, and retry behavior remain unchanged.
- [ ] All original 21 runtime definitions, 153 frozen plans, manifest, approval bindings, and generated registry remain production-authoritative.
- [ ] Phase 8 candidates remain isolated and inactive; `confirmation` gains no runtime route.
- [ ] The supervisor receives type/conflict/dependency metadata, and a deterministic final resolver still enforces structural validity.
- [ ] `DIRECT` and `PLANNED` use one plan schema, planner, compiler, and execution path.
- [ ] Plan instructions identify their source capabilities/modifiers and preserve intent, facts, commitments, and uncertainty.
- [ ] The compiler never sends IDs, scores, ranks, reasons, expected labels, or the registry to the provider prompt.
- [ ] The response verifier remains outside the SRS-1 critical path; only basic generation preservation/reasonableness checks are required.
- [ ] Fixtures are synthetic; default tests and harness require no network or credential.
- [ ] Reports include denominators, catalog revision, split, language, action/mode, and known limitations.
- [ ] Lint, typecheck, deterministic tests, build, production verification, Phase 4 regression, formatting, and whitespace checks pass.
- [ ] No production integration begins until the SRS-1 report and the next plan are reviewed.

## 15. Validation commands for future phase implementation

Run from `C:\Users\b\Documents\ChatGPT\AI messager-skills` on branch `skills`. Exact focused test paths may be added only after the files exist.

```powershell
pnpm skills:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm skills:verify-production
pnpm eval:phase4
pnpm format:check
git -c core.safecrlf=false diff --check
```

The eventual shadow-harness command is introduced only in its owning phase, documented, deterministic by default, and run without `--live`. Do not invent its final command name in this planning turn.

## 16. Per-phase authority

The seven linked phase plans are the implementation authority for their own scope. This overall plan supplies shared architecture and integrated acceptance targets, but it does not authorize combining phases. When a phase is approved, update only that phase plan to `approved`/`in progress`; keep later plans `proposed`. Each completion report must name the next gate and stop.

## 17. Risks, rollback, and limitations

| Risk                                                                     | Mitigation / rollback                                                                                                                                            |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stage refactor silently changes production selection                     | Keep `select()` compatibility assertions against all frozen Phase 7/Phase 4 plans; SRS-1 is shadow/evaluation-only. Revert stage wiring, not evidence artifacts. |
| Top-K exposes irrelevant nearest neighbors and encourages over-selection | Keep retrieval distinct from supervision; measure `NONE`, unnecessary-skill rate, and final precision.                                                           |
| Modifiers crowd out communication capabilities                           | Partition by definition type; use separate candidate paths, metrics, and typed budgets.                                                                          |
| Relevance scores are mistaken for confidence                             | Ban probability naming in contracts/docs/tests; document scale as algorithm-specific ordering evidence.                                                          |
| Intent/situation hard gates hide recall failures                         | Trace every gate; compare a shadow signal-only configuration before proposing production changes.                                                                |
| Deterministic reason codes become disguised free-form rationale          | Use short enums and observable matched-feature references; no chain-of-thought fields.                                                                           |
| `SkillPlan` duplicates current `CommunicationPlan` indefinitely          | Treat the private SRS-1 plan as a migration experiment; either finalize one public contract in SRS-4 or remove it. Do not maintain two production planners.      |
| `DIRECT` and `PLANNED` diverge into two planner implementations          | Require one schema, planner, compiler, and execution path; mode changes plan complexity only.                                                                    |
| Planner changes facts or decisions                                       | Preserve immutable action/intent and explicit preservation invariants; add rewrite/suggestion ledgers and critical-failure tests.                                |
| Evaluation overfits exposed Phase 5/8 scenarios                          | Group splits by scenario family; write fresh held-out cases after behavior freezes.                                                                              |
| Candidate research leaks into production                                 | Explicit catalog allowlists, default-off routes, build/export/import isolation, manifest checks, and exact21 verification.                                       |
| Trace persists sensitive content                                         | Store IDs/codes/scores only; use synthetic fixtures and explicit artifact paths; no ordinary content logging.                                                    |
| Premature infrastructure increases privacy/operations cost               | Require measured recall/latency/size evidence and a separate review before embeddings or external services.                                                      |

Known limitations of this plan:

- The correct production capability Top-K, capability/modifier budgets, score scale, and `DIRECT`/`PLANNED` rule are not yet empirically established.
- The approved registry is too small to justify or validate large-catalog infrastructure.
- The current Phase 8 corpus is exposed, partly self-authored, and insufficient for promotion claims.
- Human language review and fresh held-out authorship remain necessary for broad multilingual claims.
- No dependency mechanism exists, so dependency accuracy is currently not applicable.

## 18. Decisions and review gates

Before SRS-1 implementation, review and approve:

1. The stage boundaries, capability/modifier separation, and the rule that default production behavior remains unchanged.
2. Whether the SRS-1 provisional `SkillPlan` stays private/evaluation-only and uses one pipeline for both modes.
3. Initial trace fields, disappearance stages, and privacy treatment.
4. The deterministic supervisor/modifier reason-code approach and structural metadata visible before final resolution.
5. The multi-skill metrics and scenario inventory with development/held-out grouping.

Before later production integration, separately review:

1. Any change to hard eligibility or ranking semantics.
2. The final public `SkillPlan` schema and `DIRECT`/`PLANNED` rule.
3. Production capability and modifier budgets replacing the current mixed limit of four.
4. Prompt-compiler diffs and preservation evidence.
5. Any model-assisted supervisor/reranker, second call, embeddings, external index, candidate activation, or live provider budget.

## 19. Progress log

- 2026-09-24: Read the new direction-reset brief, repository instructions, `README.md`, `.agent/PLANS.md`, product/privacy/architecture guidance, Phase 3–8 skill documents, current contracts, selector, evaluator, AI integration, fixtures, and Phase 8 experiment result.
- 2026-09-24: Confirmed worktree `C:\Users\b\Documents\ChatGPT\AI messager-skills` is on branch `skills`; the implementation task was idle, so no concurrent edit was in progress.
- 2026-09-24: Classified completed Phase 7/8 work as retained evidence, narrowed final-message evaluation ownership, and selected SRS-1 as the smallest next milestone.
- 2026-09-24: Created this planning document only. No production code, skill definition, schema, routing, test, runtime, provider, or candidate activation change is authorized or made.
- 2026-09-24: Incorporated direction-review corrections: separate capability and modifier paths/budgets; supervisor visibility into structural constraints plus deterministic final enforcement; one planner pipeline for `DIRECT`/`PLANNED`; multi-skill retrieval metrics; scenario-local scores; explicit candidate disappearance stages; and verifier removal from the critical path.
- 2026-09-24: Split delivery into seven sequential SRS phase plans with independent approval and completion gates. Only SRS-1 is eligible to begin next; no later phase is implicitly authorized.

## 20. Planning completion record

Primary deliverable: this revised overall plan plus seven linked phase plans. Together they define the new objective, current-state gap, retained/reduced work, typed capability/modifier architecture, stage-level traces, target evaluation architecture, scale stages, sequential implementation ownership, contracts/data flow questions, tests, acceptance criteria, gates, and rollback.

Planning acceptance means the user agrees with the direction and authorizes a separately executed SRS-1 implementation. Until then, the next action is review of this document, not implementation.
