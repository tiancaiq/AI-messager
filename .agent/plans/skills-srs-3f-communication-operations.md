# SRS-3F — CommunicationOperation evidence and admission-free semantic Top-K

Status: **SRS-3F-A implemented; exposed quality FAIL; SRS-3F-B not approved**  
Owner: Codex  
Started: 2026-09-30  
Updated: 2026-09-30  
Roadmap: [skills retrieval/selection direction](skills-retrieval-selection-direction.md), SRS-3 shadow retrieval; follows [SRS-3E](skills-srs-3e-semantic-retrieval.md)

## Outcome and stop point

Design two **sequential, separately reviewable** shadow increments:

- **SRS-3F-A:** infer zero or more communication operations from raw product-shaped evidence, independently of skill retrieval and skill labels; prove the operation signal has useful multi-label quality before it can influence candidates.
- **SRS-3F-B:** return hard-eligible atomic skills in a bounded semantic Top-K **without semantic admission/abstention** for wording actions; compare pure ranking with one small, positive-only operation-support experiment if A passes.

The separation is `AgentAction` (fixed upstream decision) → `CommunicationOperation[]` (what the user is trying to communicate; soft, possibly empty, multi-label) plus semantic skill retrieval → Top-K skills (expertise that might improve *how*) → **future** Supervisor (0–N / `NONE`) → **future** `SkillPlan` and generation. SRS-3F stops at traces and candidate lists. An operation is neither a skill ID nor an instruction to generate content. No Supervisor, final selection, composition, reply, or production cutover is authorized by this plan.

The prior planning turn created only this Markdown plan. On 2026-09-30 the user approved implementation of **SRS-3F-A only**. The frozen challenge, provider, production runtime and SRS-3F-B remain out of scope.

## Current state and architectural boundary

The 21 ACTIVE approved definitions comprise 14 universal atomic skills and seven language modifiers. Production [`SkillEngine.select()`](../../packages/skills/src/engine.ts) and `CURRENT` context derivation still use deterministic metadata and produce 0–4 selected skills; they stay unchanged, as do `SRS_2_5_PROPOSED`, `SRS_3D_RECALL_PROPOSED`, the provider/prompt boundary, and 153 frozen plans. SRS-3D-B provides 14 ATOMIC and seven modifier authoring-only semantic profiles with independent digests. The private [SRS-3E retriever](../../packages/skills/tests/srs3e-semantic-retrieval.ts) already has source-aware query fragments, pinned local MiniLM positive vectors, structural hard gates, per-skill cosine scores, and pre-threshold ranks. It currently adds a threshold that SRS-3F-B must bypass in a **new versioned shadow mode**, not mutate in place.

The [SRS-3E calibration](../../docs/skills/srs-3e-semantic-calibration-report.md) found useful pre-threshold ranking but no nonempty global-threshold solution under 16/16 exposed strict-NONE. The [exposed admission retest](../../docs/skills/srs-3e-admission-retest.md) obtained only 8/46 required hits and 0/27 rewrite hits while preserving NONE. That is evidence that asking **candidate retrieval** to decide wording `NONE` is the wrong bottleneck, not evidence that arbitrary Top-K candidates are selected skills. The frozen challenge remains reserved: its freeze SHA-256 is `4cd2a78487b0d59c67d97bfe672219f9ff19c9913d079372b2324dbb80a87b84`. The SRS-3D-B profile SHA-256 is `b061bf17a04e696ad78af45016e6803a96f79f0e617fcb2800a4a591fbc33d1c`; SRS-3E positive vectors are `b02d4664585c29d3a0ac33e41c6827d2bd4d5d065fd7eb289182084c6dc05588`.

A final [exposed rewrite source-dominance pass](../../docs/skills/srs-3e-rewrite-source-dominance.md) held admission fixed and compared four draft-dominant query combinations. All stayed at 0/27 rewrite and 8/46 overall required admissions. It found that 20/27 rewrite requirements ranked in draft-only Top 10 before admission, but none reached the fixed 0.40 score floor. The result stops SRS-3E query/admission iteration and strengthens the case for SRS-3F's separate candidate ranking and later `NONE` ownership; it is not SRS-3F implementation approval.

Hard gates remain **only structural**: production catalog and ACTIVE status, fixed `AgentAction`, definition-supported language and code-switch prerequisite, and ATOMIC versus LANGUAGE_MODIFIER lane. The English-only encoder's `MODEL_UNSUPPORTED_LANGUAGE` and `EMPTY_QUERY` are separate feasibility outcomes, never semantic `NONE`. Intent/situation tags and operation presence/absence are not hard gates. For `SUGGEST_ACTIONS`, `ASK_CLARIFICATION`, and `NO_REPLY_NEEDED`, deterministic empty capability output remains required; for `REWRITE_DRAFT`, `COMPLETE_DRAFT`, and `SUGGEST_REPLY`, the retriever may return candidates even when the future Supervisor should choose `NONE`.

## Decisions and alternatives

| Question | Recommendation and rationale |
| --- | --- |
| Why operations rather than simply 14 skill aliases? | Use **11 broader communication jobs**, not 14 one-to-one names. `SEEK_ACTION` spans request/help, `COORDINATE_FUTURE` spans expectation/planning, and `RESPOND_TO_CONCERN` spans validation/reassurance; several skills can share a job and some skills can support more than one. Keep distinct operations only where user meaning can coexist or diverge materially (own error versus chosen regret; refusal versus continuing limit; present status versus future coordination). At ~1,000 skills these stable jobs can organize families/supervisor evidence without renaming skill IDs. The layer is justified only if its independent labels and soft signal measurably add interpretability or ranking value; otherwise retain pure semantic Top-K and do not promote an unused classifier. |
| Detector choice | Compare (A) handcrafted rules, (B) positive semantic operation profiles with the already pinned local English encoder, (C) a local multi-label classifier, (D) LLM extraction. **B** is the smallest inspectable first experiment: reuse the evaluation-only encoder/query serializer, but author operation profiles and labels independently. A recreates the failed expanding normalizer; C needs more independently reviewed data; D adds cost/privacy/opacity and approaches a Supervisor. No regex operation recipes or LLM supervisor in A. |
| Authoring location | New private `packages/skills/authoring/operation-profiles.yaml` plus schema/loader, and a separate private `operation-skill-support.yaml` mapping. Reuse the semantic-profile generator/validation patterns, **not** the frozen skill-profile file or public `packages/contracts`/runtime registry. Independent digests prevent a skill profile score from being recycled as an operation score. |
| NONE ownership | Wording `NONE` moves to the future Supervisor. A zero-operation result is **not** proof that no skill is useful; operation false negatives must not suppress semantic candidates. Non-wording action emptiness stays deterministic. |
| Scale | Flat exact scan for 11 operations and 14 skills. No skill tree, ANN/vector DB, per-skill threshold, or new service now. Later operation→family routing must retain a measured flat fallback and stable skill IDs. |

## SRS-3F-A — operation vocabulary and independent detector

### Proposed v1 vocabulary

These are **operation IDs**, not new skill definitions or aliases for existing intent tags. Each describes observable user communication, not the recipient's hidden motive. Final wording requires raw-first review before freeze.

| Operation | Job / discriminating boundary | Example skill support (not a gate) |
| --- | --- | --- |
| `SEEK_ACTION` | Ask a recipient to do/provide/change something; can include seeking assistance. Not a mere factual report. | `request`, `ask_for_help`; sometimes `follow_up` |
| `SEEK_INFORMATION` | Resolve a material unknown or ambiguous detail. Not verification of an already-set detail merely to ask another question. | `clarification`; sometimes `request` |
| `REVISIT_OPEN_THREAD` | Return to a visible unresolved earlier ask or task. A first request or resolved thread is not this operation. | `follow_up`, sometimes `request` |
| `REPORT_CURRENT_STATE` | Convey supported present state/progress. Do not convert it to a future promise. | `status_update` |
| `COORDINATE_FUTURE` | State supported future timing/capacity or organize next steps. Includes both expectations and plans; the skill layer distinguishes them. | `expectation_setting`, `planning`; sometimes `request` |
| `REFUSE_OPTION` | Communicate a chosen refusal of a concrete proposal. Not inferred refusal from ambiguity. | `decline`; sometimes `boundary_setting` |
| `STATE_CONTINUING_LIMIT` | State a chosen ongoing limit; current `boundary_setting` skill remains narrowly scoped to repeated pressure until separately changed. | `boundary_setting`; sometimes `decline` |
| `OWN_ERROR` | Name a supported user-owned mistake/omission. Not assign responsibility to the other person. | `acknowledge_mistake`; sometimes `apology` |
| `EXPRESS_REGRET` | Communicate user-chosen regret for supported impact. Not infer an apology from mere ownership. | `apology`; sometimes `acknowledge_mistake` |
| `RESPOND_TO_CONCERN` | Recognize a visible feeling/difficulty or offer grounded support for a stated concern. Skill retrieval separates validation from reassurance. | `emotional_validation`, `reassurance` |
| `REDUCE_TENSION` | Lower visible conversational heat while preserving the user's position. Calm wording alone is not evidence of a conflict. | `de_escalation`; sometimes `boundary_setting` |

The examples in the brief remain multi-label: an old-deck apology can be `OWN_ERROR + EXPRESS_REGRET + COORDINATE_FUTURE`; a contract reminder can be `REVISIT_OPEN_THREAD + SEEK_ACTION`; a declined recurring lunch request can be `REFUSE_OPTION + STATE_CONTINUING_LIMIT`. `[]`, `[one]`, and `[many]` are all valid. This deliberate partial overlap with skills is acceptable because operations are **evidence about the raw communication**, independently evaluated, while skills are approved expertise with separate boundary guidance. The operation layer must never be used to manufacture a regret, deadline, reason, limit, or commitment absent from the user's evidence.

### Private contracts and data flow

Proposed private Zod-first shapes (names illustrative; no public schema change in this phase):

```ts
type CommunicationOperationId = /* closed 11-ID vocabulary above */ string;
type OperationProfile = {
  id: CommunicationOperationId;
  revision: number;
  job: string;
  positiveEvidence: string[];
  whenNotUse: string[];
  neighbors: { id: CommunicationOperationId; distinction: string }[];
};
type OperationSignal = {
  id: CommunicationOperationId;
  relevanceScore: number; // not probability/confidence
  rank: number;
  sourceContributions: { source: "USER_DRAFT" | "SELECTED_GOAL" | "OTHER_MESSAGE" | "USER_HISTORY"; ordinal: number; score: number }[];
  operationProfileDigest: string;
};
type OperationObservation = {
  fixedAction: AgentAction;
  signals: OperationSignal[]; // zero, one, many; deterministic order
  modelAndConfigDigest: string;
  diagnostics: string[];
};
```

The detector consumes only validated `CoachingRequest` raw fragments and the fixed action for structural gating. It **cannot** import or receive skill IDs, retrieved skill scores, `SkillContext` intent/situation tags, expected labels, ranking annotations, or the operation↔skill mapping. Encode draft/explicit goal separately from recent OTHER and USER history; preserve ownership and order. A concern in an OTHER turn alone is not the user's decision to apologize/refuse/promise. Use `job` and individual positive-evidence fragments for positive vectors; `whenNotUse`/neighbors are review context, not positive similarity or an unreviewed negative penalty. Reuse the pinned MiniLM only for English synthetic evaluation; Chinese/code-switching produces an explicit unsupported outcome, not a negative operation assertion. Scores are relevance signals, not confidence.

The mapping is a **separate, authoring-only many-to-many support overlay**, keyed by stable atomic skill ID and operation ID with a short rationale and optional `DIRECT`/`CONDITIONAL` link class. It covers all 14 atomic skills and no modifiers/candidates. `CONDITIONAL` links are review metadata; v1 fusion uses only independently justified direct links unless evaluation supports a conditional link. Missing operation support never forbids a skill. Neither mapping nor operations alter the approved skill YAML, public Zod contracts, generator output, or current normalizers.

### Independent evidence and calibration

Create operation annotations **from raw inputs before viewing skill labels**. The annotator sees draft, explicit goal, visible speaker/order, and fixed action only; a separate reviewer checks revision-bound rationale, ownership, uncertainty, and hard neighbors. Source raw inputs may include the 29 accepted English SRS-3B and 24 corrected SRS-3E calibration cases, but their required/acceptable/forbidden **skill labels are not operation gold**. Add operation-specific, independently authored exposed scenarios to cover each operation, multi-operation combinations, zero-operation chatter, rough versus already-decent drafts, and first-ask/resolved-thread/ownership/future-certainty hard negatives. Bind source digests, family deduplication, raw/annotation isolation, reviewer type, quarantines, and language/action coverage. No Phase 8A 210-example bulk import or unreviewed proposed revision becomes gold.

Before threshold search, form two **family-disjoint exposed** sets: operation calibration and operation audit. Minimum before an A acceptance claim: each operation has ≥8 positive and ≥8 pertinent negative observations across the sets; ≥20 multi-operation, ≥20 zero-operation, ≥12 each rewrite and empty-draft suggest, plus explicit complete-draft and non-wording controls. If coverage fails, report insufficient evidence rather than borrowing SRS-3E challenge rows. Predeclare a compact global threshold grid and source-combination variants on calibration only; choose once, freeze model/profile/query/threshold/corpus hashes, then run the exposed audit once. No per-operation threshold in v1 without a separate approved design.

For this implementation, the predeclared A grid is `threshold ∈ {0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50}` crossed with `PRIMARY_ONLY` and `PRIMARY_WITH_CONTEXT`. The latter adds at most `min(0.05, 0.1 × positiveContextScore)` only when primary score ≥0.20; context cannot substitute for weak primary evidence. Score each raw calibration case without labels first, then join provisional operation labels. Choose the global configuration by maximum calibration micro-F1; ties prefer fewer zero-operation false-positive cases, higher micro precision, higher threshold, then `PRIMARY_ONLY`. Freeze the selected config and vectors before one audit pass. There is **no per-operation threshold** and no post-audit retuning. The corpus labels are Codex self-reviewed/provisional, not independent human approvals; report their reviewer qualification honestly and do not mark A accepted solely from the numeric gate.

Primary independent metrics: micro operation recall and precision/false-positive rate, macro and per-operation recall, multi-operation all-required coverage, zero-operation noise, rewrite versus suggest and rough/normal/already-decent slices, and hard-neighbor confusion. Exact-set accuracy is secondary. A provisional detector may proceed to B fusion only if the exposed audit has micro recall ≥0.75, micro precision ≥0.70, every operation recall ≥0.50, multi-operation all-label coverage ≥0.60, zero-operation false-positive cases ≤20%, and **zero** intent/ownership/unsupported-commitment critical errors in reviewed cases. Report counts and wide uncertainty from small samples; a borderline failure triggers review, not threshold tuning on the challenge. Pure semantic B can still be measured if A fails, but fusion stops.

### Increment A implementation and verification (active)

1. Review the 11 jobs and mapping against [Phase 3 taxonomy](../../docs/skills/phase-3-capability-normalization.md), all 14 [semantic skill profiles](../../packages/skills/authoring/semantic-profiles.yaml), and neighbor matrices; freeze vocabulary/revision before detector scoring.
2. Add private operation-profile/mapping source, strict schema/loader, deterministic artifact/digest builder and focused validation tests under `packages/skills/authoring/` and `packages/skills/tests/`; keep profile source independent of skill profiles and production exports.
3. Author raw-first operation corpus in `packages/test-fixtures/src/` and separate labels/reviews/manifests in `packages/skills/tests/fixtures/srs3f/`; independently verify no skill-label derivation and no overlap with the frozen challenge.
4. Add a local operation-profile embedding adapter using the existing offline encoder, source-aware detector, content-free trace and independent evaluator. Calibrate on the exposed calibration split, freeze a proposed A config, evaluate the family-disjoint exposed audit, and stop for semantic/human review of boundary or critical errors. No capability boost in A.
5. Run focused schema/source/freeze/metric tests, then canonical checks listed below. Deliver A report with per-operation and mode results, failed cases, digests, and `PASS`/`PARTIAL`/`FAIL`. **Do not begin B fusion automatically** if A fails or needs human boundary judgment.

## SRS-3F-B — admission-free Top-K, then optional soft fusion

### Candidate result and NONE semantics

Add a new **evaluation-only** result/config version; preserve the SRS-3E thresholded function and artifacts as historical comparators. For a supported wording action with usable query fragments, score every structurally hard-eligible ATOMIC definition against frozen positive profile vectors, sort by relevance then stable skill ID, return Top 10 and its Top 5/Top 3 prefixes. There is **no semantic threshold, margin, operation prerequisite, forced winner, or `NONE` gate** in candidate retrieval. At 14 atoms a flat exact scan is sufficient. Return all eligible count and bounded Top-K count; modifier eligibility remains separate. A wording semantic-NONE case can have ten nearest candidates. Its nearest IDs, scores, score spread, operation signals, and forbidden/neighbor ranks are **noise diagnostics for a future Supervisor**, not a retrieval failure. `SUGGEST_ACTIONS`, `ASK_CLARIFICATION`, and `NO_REPLY_NEEDED` remain structural empty results. `EMPTY_QUERY`/`MODEL_UNSUPPORTED_LANGUAGE` remain explicit unscored outcomes, never successful NONE predictions.

Proposed private candidate object, designed as the future Supervisor input rather than a final plan:

```ts
type CapabilityCandidate = {
  skillId: string;
  version: number;
  rank: number; // 1..10 in the capability lane
  semanticScore: number; // relevance only
  operationSupport: number; // >=0, zero if no mapped detected operation
  combinedRelevance: number; // never confidence
  winningSource: "USER_DRAFT" | "SELECTED_GOAL" | "OTHER_MESSAGE" | "USER_HISTORY";
  winningPositiveField: "job" | "useWhen" | "semanticTriggers";
  sourceDefinitionDigest: string;
  profileDigest: string;
  operationMappingDigest: string | null;
  reasonCodes: string[]; // closed, observable, no hidden reasoning
};
type CandidateBundle = {
  fixedAction: AgentAction;
  operationSignals: OperationSignal[];
  capabilityTopK: CapabilityCandidate[];
  eligibleModifiers: { skillId: string; eligibilityReasons: string[] }[];
  hardEligibleCount: number;
  status: "RANKED" | "STRUCTURAL_EMPTY" | "EMPTY_QUERY" | "MODEL_UNSUPPORTED_LANGUAGE";
  configAndEvidenceDigests: string[];
};
```

The future Supervisor also needs the **request-scoped validated communication evidence** (or a separately reviewed, sufficiently faithful ephemeral representation) to decide `NONE`, redundancy, safety and composition. Scores/operation IDs alone cannot establish facts, speaker ownership, intent, or certainty. That evidence stays in trusted memory for the active request, is not persisted in content-free traces, and is not sent to any provider by SRS-3F. Neighbor/conflict/dependency metadata may be referenced by digest and resolved only in the later Supervisor; this phase does not infer a new dependency graph. The Supervisor may later choose `NONE`, one skill, or several compatible skills, and keep the modifier lane separate. Its algorithm and `SkillPlan` remain out of scope.

### Soft operation support, only after A passes

Evaluate on **exposed development**: (A) semantic-only ranking, (B) one fixed positive mapping bonus, and (C) mapping used only to break exact semantic ties. Recommend (B) as the smallest meaningful fusion if independent A quality passes: `combinedRelevance = semanticScore + b` **once** when at least one independently detected operation has a DIRECT mapping to the skill, otherwise `semanticScore`; `b ∈ {0, 0.02, 0.05}` is predeclared and selected on exposed calibration before freeze. Do not sum per operation, apply per-skill weights, subtract for missing/mismatched operations, or let operation output change eligibility. An erroneous or absent operation must still leave the semantic Top-K path intact. A no-bonus semantic baseline and tie-only comparator reveal whether the extra layer genuinely helps. Record `semanticScore`, `operationSupport` (0 or `b`), `combinedRelevance`, mapped operation IDs and profile/mapping digests separately. No score is probability or confidence.

The operation detector is independently evaluated **before** B uses its signals. For B calibration, use family-disjoint exposed scenarios with independent skill labels already approved for efficacy; keep SRS-3B full labels, corrected SRS-3E controls, D01–D68 target-specific evidence and new operation corpus roles separate. Unlabeled skills stay **unlabeled**, not forbidden. Never tune `b`, source serialization, model, profiles, or K against the frozen SRS-3E challenge. Freeze pure and fusion configs, mapping/profile vectors, exact corpus provenance, thresholds and tie rule under new SRS-3F IDs; obtain explicit human review of the binding **before** a single frozen challenge observation that runs all pre-frozen comparators together. No human reviewer is assigned by this plan; if unavailable, stop at the gate.

### Metrics, proposed frozen challenge gates and interpretation

Compare on the **same frozen accepted English challenge rows** only after separate implementation/freeze/review: historical `SRS_2_5_PROPOSED` (18/52) and `SRS_3D_RECALL_PROPOSED` (19/52), pure admission-free semantic Top-K, and pre-frozen operation-support Top-K if A passed. The historical baseline numbers are read-only references, not a reason to inspect semantic challenge outcomes while planning/calibrating. This is a protected one-shot comparison, **not a claim of untouched general-purpose held-out data**; older deterministic results on these rows are already known.

Candidate recall is primary: required Recall@3/@5/@10, per-capability recovery, rank distribution, all-required scenarios and both-found multi-required cases. Report acceptable ranks, explicitly forbidden ranks at 3/5/10, closest-neighbor confusions, operation misses/false positives, mode slices, and candidate breadth. `Primary@1`/pairwise order is secondary. On wording semantic-NONE rows, report nearest candidate IDs/scores/spread and operations, **not** empty-pool pass/fail. On structural non-wording rows, empty capability output remains mandatory. Do not compare historical strict-NONE empty-pool rates directly with the new wording-NONE diagnostic.

Proposed pre-challenge gates for the **pure semantic** candidate arm (to be approved/frozen before any challenge run): required Recall@10 ≥40/52; Recall@5 ≥30/52; Recall@3 ≥22/52; 14/14 atomic skills with ≥1 required hit for `PASS` (12–13/14 `PARTIAL`, ≤11 `FAIL`); both required skills found at Top10 in ≥6/10 multi-required cases; all required found at Top10 in ≥30/42 positive scenarios; Top-K length ≤10 and exact stable ordering; structurally non-wording capability pool empty on **every** applicable case. Report explicit forbidden Top3/5/10 counts and semantic-NONE noise even if recall gates pass; a critical intent/ownership/boundary violation in reviewed candidate explanations is a failure. These are candidate-retrieval gates, **not** Supervisor precision, final selection, or production acceptance.

For fusion, require no loss of any pure-semantic required hit at Top10, ≥2 additional required hits or rank promotions into Top3 on the same frozen rows, no reduction of multi-required both-found@10, and at most one additional explicitly forbidden Top3 admission versus pure semantic. If it fails, label `FUSION_NOT_JUSTIFIED` and retain the pure semantic arm; do not retune the bonus after challenge. A pure semantic arm may pass even if operation fusion does not. If any gate fails, report `PARTIAL`/`FAIL` honestly and stop; no downstream Supervisor implementation follows automatically. Before running the challenge, a reviewer must approve these exact thresholds or an amended plan, source bindings, operation-label qualifications, model/config/vector hashes, and the one-shot protocol.

### Increment B implementation and verification (future, not this turn)

1. Add a private admission-free ranking mode under `packages/skills/tests/`, reusing the SRS-3E model/profile/query/hard-gate code without changing `SkillEngine.select()` or the frozen v1 scorer. Test Top3/5/10 prefixes, deterministic ties, source attribution, hard gates, lane separation, structural emptiness, unsupported language and wording semantic-NONE candidate behavior.
2. Run pure semantic Top-K on exposed development first. Diagnose rewrite versus suggest, short-draft representation, operation-independent recall and neighbor noise. Do not change skill profile wording or query ownership to fit the frozen challenge. Freeze the pure arm.
3. Only if A passed, add a separate pure fusion function over `OperationObservation` plus semantic candidates and the authoring-only mapping. Assert operations cannot remove a hard-eligible candidate, absent/mismatched operations give zero bonus, and every contribution is traceable. Compare 0/fixed-small/tie-only on exposed calibration, freeze one fusion arm or record `NO_FUSION`.
4. Before any challenge run, independently verify every provenance/digest chain, prior freeze, model/vector bytes, source/label isolation, thresholds and reviewer qualifications; obtain the real human config review. Then execute one raw-only challenge observation with all frozen arms, join labels afterward, write content-free traces and report the proposed gates. Do not inspect challenge rows/labels before this gate.
5. Run separate SRS-3B and D01–D68 regression reporting; never pool target-specific D labels into full-catalog precision. Run focused and canonical checks. Stop before Supervisor, selection, `SkillPlan`, provider prompt, or runtime integration.

## Failure taxonomy and safety

Operation layer: `OPERATION_MISS`, `OPERATION_FALSE_POSITIVE`, `OPERATION_BOUNDARY_AMBIGUITY`, `OPERATION_LABEL_ISSUE`, plus `UNSUPPORTED_LANGUAGE`/`INSUFFICIENT_EVIDENCE` as abstentions rather than negative labels. Skill candidate layer: `HARD_ELIGIBILITY`, `SEMANTIC_RETRIEVAL_MISS` (required skill ranked poorly despite eligibility), `TOP_K_CUTOFF`, `OPERATION_SUPPORT_MISSING`, `OPERATION_SUPPORT_WRONG`, `SEMANTIC_FALSE_NEIGHBOR`, `SKILL_BOUNDARY_AMBIGUITY`, `PROFILE_BOUNDARY_GAP`. A missing operation signal is **not** a skill miss when semantic Top-K still finds the skill. `NONE` is not a candidate disappearance stage for wording actions.

The only retained evaluation raw text is synthetic, repository-private and versioned; real screenshots, conversations, drafts, identities, user history and embeddings are not logged, sent to an API, or persisted by this phase. Future request-scoped use requires a separate privacy/placement review. Every trace stored for metrics is content-free (IDs, source types, ranks, scores, digests, closed reasons); selected-goal and draft text do not enter report files. No live provider, paid model, app service, or browser is used.

## Validation, risks and rollback

Future implementation checks: operation schema/profile/mapping coverage and digest tests; raw/label independence and family-dedup tests; multi-label/zero-label, ownership, negation, resolved-versus-open, certainty, rewrite/suggest/complete and neighbor fixtures; model offline/file SHA checks; threshold search reproducibility; Top-K prefix and soft-only invariants; language/modifier isolation; no challenge access during calibration; one-shot freeze gate; production parity. Regenerate new artifacts twice and compare byte-for-byte; `--check` must reject drift. Run focused SRS-3F plus SRS-3E/D/C/B/A and SRS-2/2.5 tests, then `pnpm skills:check`, `pnpm skills:verify-production`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm format:check`, and `git -c core.safecrlf=false diff --check`. No provider test is part of CI.

Main risks: (1) operation IDs may be skill aliases despite the proposed consolidation—if so, remove fusion rather than preserve a redundant layer; (2) the current English sentence encoder may miss rough drafts or match topic words instead of speaker ownership; (3) operation errors can wrongly boost a neighbor, though never hard-block it; (4) Top10 of 14 may be noisy and expensive for a future Supervisor; (5) tiny exposed corpus estimates are unstable; (6) frozen challenge is not fully blind; (7) no qualified Chinese/code-switch operation evaluation exists. Rollback is removal/archival of **new SRS-3F shadow artifacts only**; do not rewrite earlier evidence. A profile/model/config change gets a new experiment ID and review. Existing production and SRS-3E artifacts remain intact.

## Progress log

- 2026-09-30: Read the SRS-3F brief, README, product/privacy and skills docs, plan convention and current skill-direction/SRS-3E plans. Inspected current 14-skill taxonomy, semantic profile schema/source, local encoder, SRS-3E retriever/test/evidence and production selector. Chose 11 partially shared operations, independent raw-first labels, semantic profile detection, and no-admission Top-K as the smallest reviewable design. No challenge run or implementation.
- 2026-09-30: User approved **A only**. Added private 11-operation YAML/profile validation and separate 14-atomic support mapping, plus a semantic detector consuming raw request fragments without skill scores/labels or mapping. Authored 86 synthetic raw scenarios first and separate provisional Codex self-reviewed labels: 43 calibration/43 audit, eight or more positives and eight designated boundary negatives per operation, 26 multi-label, 20 zero-operation, 65 rewrite, 16 empty-draft suggest, three complete, two non-wording. No human reviewer was assigned and no independent approval is claimed.
- 2026-09-30: Frozen a seven-threshold × two-source-policy grid before scoring. Exposed calibration selected `PRIMARY_ONLY` at 0.30. The family-disjoint exposed audit returned 12/48 required operations (25.0% recall), 12/43 predictions correct (27.9% precision), multi-label all-found 1/13, zero-operation false positives 1/10, and one critical ownership/intent proxy (`O74`). The `v1` corpus/config/audit artifacts are retained as preliminary; corrected `v2` provenance explicitly states that challenge overlap was not independently verified. Scores and metrics did not change. See [A report](../../docs/skills/srs-3f-a-operation-layer.md). Stop A tuning and do not start B fusion.

## Completion record

**A implementation complete, but its provisional exposed quality gates FAIL.** The content-free audit artifact SHA-256 is `d463fde6ed7dd68cc25c8cd320b5ce9034175a493db5c3bd2f62afad9975c8f6`; config SHA-256 is `3054b1dba560bc0b1bb3027dd3cc20fdc5074d4f548d15653e3fda6b1ea42028`. Two `--check` regenerations were identical. Focused SRS-3F-A/SRS-3E tests passed (3 files/14 tests). `pnpm lint`, `pnpm typecheck`, `pnpm test` (45 files/519 tests), `pnpm build`, `pnpm format:check`, `pnpm skills:check` (via lint), `pnpm skills:verify-production` (21 definitions/153 plans), and `git -c core.safecrlf=false diff --check` passed. Production catalog, selector, contracts, generated registry, model-facing prompts and previous frozen evidence were not changed. No frozen challenge or provider call was run.

Architecture decision: keep operations as a **soft, private, multi-label evidence layer** and the support map separate from the detector. This experiment does not justify using the layer for candidate fusion. Limits: English synthetic exposed data; provisional self-reviewed labels; no independent semantic review; no native-language or live-user validity; poor short-draft and selected-goal discrimination; one ownership false positive. Next step requires a separate decision: revise A under a new experiment/review plan, or approve B's **pure** admission-free semantic Top-K without operation fusion. Neither is automatically authorized here.
