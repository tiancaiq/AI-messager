# SRS-4R — Skill Assessment + Deterministic Combination

Status: **SRS-4R-A offline implementation complete; live evaluation, B and later stages unapproved**  
Owner: Codex  
Started: 2026-10-03  
Updated: 2026-10-03  
Roadmap milestone: SRS-4 evaluation-only skill selection; [roadmap](../../docs/roadmap.md), [SRS-4 history](skills-srs-4-supervisor.md)

## Outcome and stop point

Prove, in separate increments, whether each retrieved atomic skill can independently assess its applicability and whether deterministic code can combine those assessments into zero to four compatible skills or `NONE`. SRS-4R ends at selected skill IDs. It does not compile a SkillPlan, generate wording, or alter production. **Only SRS-4R-A offline contracts, fake assessment, diagnostics, development plumbing and freeze are currently approved. No live provider call or SRS-4R-B implementation is authorized.**

The governing correction is: **the model evaluates each skill; deterministic code decides the combination.** D5 under the old global-selector contract is superseded as a proposed next step. Preserve all V1/D2/D3/D4 artifacts, hashes, reports, and historical verdicts; do not delete, rewrite, or relabel them as SRS-4R results.

## Architecture-decision record: replace the global selector

| | Prior SRS-4 | Revised SRS-4R |
| --- | --- | --- |
| Model task | Read all Top-10 candidates, compare them and decide final 0–4/`NONE` | Assess each candidate's own communication job and evidence; no final set or pairwise winner |
| `Supervisor` | Global model final selector | Deterministic assessment validator and subset optimizer; no LLM call |
| Output | Cross-candidate SELECT/REJECT judgment | One self-contained `SkillAssessment` per candidate, then separately computed selection |
| `NONE` | Model's global decision | No valid supported assessment after deterministic combination |
| Debugging | Retrieval versus one opaque model decision | Retrieval → provenance → assessor → combination stages |

**Earlier mistake.** One model had to interpret ten jobs, prerequisites, negation, neighbors, ownership, `NONE`, final set size and a cross-candidate output contract. D3 exposed rejection-evidence incompatibility even when JSON and ten-candidate coverage were valid. D4 fixed that contract offline, but did not demonstrate the global architecture was the right decomposition. This coupling obscured which atomic skill failed and made `NONE` depend on a global model judgment.

**Decision.** A `SkillAssessor` may use model reasoning for one candidate's applicability. A deterministic `CombinationSupervisor` owns all cross-candidate choices. “Each skill produces an assessment” is a **logical** requirement, not necessarily ten network calls. The old experiments remain useful evidence about wire validation, evidence ownership, missing prerequisites and failure attribution. This ADR is a planning correction, not a retrospective reinterpretation of D3's 0/5 or SRS-3F-B's historical FAIL.

No separate CommunicationOperation/intent classifier is proposed. The 14 atomic skills already represent communication-job hypotheses. SRS-3F-A's separate operation detector failed its exposed gates and stays excluded. Upstream `AgentAction` remains independent: `REWRITE_DRAFT`, `COMPLETE_DRAFT`, `SUGGEST_REPLY`, `SUGGEST_ACTIONS`, `ASK_CLARIFICATION`, and `NO_REPLY_NEEDED` answer *what the coach does*; skills answer *what communication expertise helps*. Non-wording actions keep structural bypass, not assessor-generated `NONE`.

## Current repository state and immutable dependencies

- Production `packages/skills/src/engine.ts` remains the 21-ACTIVE-definition, 153-frozen-plan selector; 14 skills are atomic and seven are language modifiers. SRS-4R is private shadow tooling under `packages/skills/tests/`, with no new public export or runtime import.
- SRS-3F-B remains the frozen MiniLM, vectors, profile, `alpha=0`, source policy and hard-eligibility Top-10 ATOMIC retriever. Its proposed config SHA-256 is `4f3f94e0b2089c9bb7a8e8c3a83c697b7df3d9f3c4c0c14b4c00ac0d4518327b`; the semantic-profile artifact is `b061bf17a04e696ad78af45016e6803a96f79f0e617fcb2800a4a591fbc33d1c`. B's forbidden@3 exposed gate remains **FAIL (7/14)**. Its job here is candidate recall, not final selection; no re-ranking, admission change, vector DB, profile edit, or modifier mixing is permitted.
- `srs4-supervisor.ts` already provides validated source-attributed evidence, fixed action, and a neutral skill-ID-sorted projection of B Top 10 with job/useWhen/whenNotUse/neighbor metadata and no semantic score/rank. Reuse or copy only under a new revision binding; do not mutate V1 bytes.
- D4 V2 freeze SHA-256 `beb27af30f72d99fd1c04879e4a5fd1d3957cac795253a696eed45a5a741afb7` records an offline satisfiable rejection-evidence contract. It is not a live assessor result.
- The approved profile schema allows `NEAR_NEIGHBOR`, `MORE_SPECIFIC_THAN`, `MORE_GENERAL_THAN`, `OVERLAPPING`, `COMPLEMENTARY` and coexistence `COMPATIBLE`, `CONDITIONAL`, `USUALLY_ALTERNATIVE`; the current artifact actually uses only `COMPATIBLE` and `CONDITIONAL`. `boundary_setting` remains `BOUNDARY_REVIEW_REQUIRED`. No neighbor is automatically a hard conflict.
- The exposed development set has 53 English cases (50 wording, three structural), 46 required occurrences, 38 in B Top 10, 13 of those provenance-blocked, and 25 retrieved/grounded required occurrences. It includes 13 wording strict-`NONE` cases and seven high-rank forbidden-neighbor regressions. The fresh 64-case R2 audit is frozen and model-semantically reviewed, **UNSCORED**, with no human approval claimed. The protected challenge remains untouched.

## Proposed data flow and contracts

```text
validated request + fixed AgentAction
  → frozen B hard eligibility and Top-10 ATOMIC retrieval
  → bounded source-attributed evidence + neutral candidate projection
  → SkillAssessor: one independent result per candidate
  → exact-set/schema/provenance validation → SkillAssessment[]
  → deterministic CombinationSupervisor: enumerate valid subsets of size 0–4
  → selected IDs / NONE (or explicit FAILED on invalid observation)
  → future SRS-5 only after separate acceptance
```

The proposed private Zod-first shape below is a design input, not an implemented schema:

```ts
type SkillAssessment = {
  skillId: string;                 // exactly one supplied ATOMIC candidate
  definitionVersion: number;      // exact input binding, never a model choice
  profileRevision: number;        // exact input binding
  applicability: "CORE" | "SUPPORTING" | "UNSUPPORTED" | "UNCERTAIN";
  evidence: Array<{ ref: EvidenceRef; use: EvidenceUse }>;
  supportedProfileRefs: Array<"JOB" | `USE_WHEN:${number}`>; // bounded clause refs, no prose
  supportReasonCodes: SupportReasonCode[];
  blockingReasonCodes: BlockingReasonCode[];
};
```

`CORE` means a direct substantive job that the outgoing message should perform. `SUPPORTING` means the candidate's **own** job is materially useful as a secondary contribution to the outgoing communication even when assessed in isolation. It is **not** a low-confidence CORE, decorative style, “maybe useful,” or a claim that another named skill has been selected. Both require positive evidence and non-context-only support; fact-gated skills require appropriate USER-authored factual evidence. `UNSUPPORTED` means current bounded evidence does not justify using the skill, including a real prerequisite not established in the visible evidence. It does **not** assert the prerequisite never existed. `UNCERTAIN` means material source ambiguity, incomplete context or conflicting observations prevent a safe applicability judgment. Neither `UNSUPPORTED` nor `UNCERTAIN` may be selected. They are distinct from transport/schema `FAILED`. No numeric confidence or free-form generated message is part of the contract.

Candidate-specific support codes should be a small closed vocabulary, provisionally `DIRECT_JOB_SUPPORTED` and `SECONDARY_JOB_SUPPORTED`; cross-candidate V1 codes such as `DISTINCT_SUPPORTED_JOB` and `COMPLEMENTS_SELECTED` do **not** belong in individual assessments. Keep blocking codes `PREREQUISITE_NOT_ESTABLISHED`, `PREREQUISITE_CONTRADICTED`, `EXPLICITLY_NEGATED`, `OWNERSHIP_MISMATCH`, `WRONG_TEMPORAL_ROLE`, `NO_MATERIAL_JOB`, and `INSUFFICIENT_EVIDENCE`. Exact Zod enumerations and code-to-applicability rules must be fixed before the first scored exposed run. A bounded `supportedProfileRefs` trace can point to the candidate's own profile clauses; it cannot author a new operation taxonomy or final wording.

The assessor receives the fixed action, bounded evidence and **one** candidate's profile/projection plus its boundary description where relevant. It does not receive expected labels, B score/rank, other candidates' assessments, a request to compare neighbors, or an instruction to choose `NONE`. In a batch transport, it may see all candidate projections, but each output row must satisfy the same candidate-local contract. Check each returned ID/revision against the exact supplied candidate and exactly one assessment per candidate; verify profile/definition digests in the frozen input-construction chain rather than asking the model to echo them. Do not silently accept partial batches: a missing/duplicate/invalid row makes the observation `FAILED`, while diagnostics identify the row. `FAILED` is not counted as `NONE` or as correct rejection.

### Evidence and ownership semantics carried from D4

| Claim/use | Permitted support | Rule |
| --- | --- | --- |
| Communication objective, including explicit “do not plan/set a limit” | USER_DRAFT, relevant USER_HISTORY, SELECTED_GOAL | `EXPLICITLY_NEGATED` requires a concrete objective ref; selected goal proves objective only. |
| USER-owned fact, error, responsibility, commitment, deadline, promise or continuing limit | Appropriate USER_DRAFT or USER_HISTORY | OTHER/UNKNOWN/SELECTED_GOAL cannot prove it; `CORE`/`SUPPORTING` factual skills are fact-gated. |
| Prerequisite absent from *bounded* support | Zero refs permitted | `PREREQUISITE_NOT_ESTABLISHED`; never infer “never happened.” |
| Positive resolved/false prerequisite | Concrete source-appropriate ref | `PREREQUISITE_CONTRADICTED`; OTHER context remains OTHER-reported, not USER-owned. |
| Materially uncertain ownership/history | Explicit `UNCERTAIN` / `INSUFFICIENT_EVIDENCE` | No invented fact; upstream oversized/truncated input is `FAILED`, not negative evidence. |

Keep USER / OTHER / UNKNOWN ownership and current-visible-evidence priority. Preserve the current hard input bound and privacy-safe failure handling. The deterministic validator can prove source/ref membership and category compatibility, not semantic entailment; independently review claimed support/contradiction on exposed boundary cases.

## Model-call alternatives and recommended first experiment

| Option | Isolation | Requests for Top 10 / 50 wording development cases | Runtime latency and tradeoff |
| --- | --- | ---: | --- |
| A. One `gpt-5.6-luna` call per candidate | Strongest prompt isolation; simplest one-row schema | Up to 10 / 500 | Sequentially up to ten round trips; parallelism lowers wall time but raises burst/rate and repeats private context ten times. |
| B. One batched call, independent rows | Logical independence, not physical isolation | 1 / 50 | One round trip and shared context; candidate cross-talk is a measurable risk. Never ask for final set or pairwise winners. |
| C. Local deterministic/NLI assessor | No external call; deterministic/possibly low latency | 0 / 0 | Needs independently demonstrated semantic ownership/negation/prerequisite quality; no current evidence that handcrafted rules or MiniLM can satisfy it. |

**Recommendation:** first implement A-increment contracts, fake assessor and evaluation plumbing offline; for a separately approved live experiment, try **B**, a single batch returning candidate-local rows, because it preserves the logical architecture with one request-scoped model call. **Singleton-vs-batch independence is a mandatory gate, not an optional diagnostic.** The offline implementation must provide a closed comparison record and a fail-closed `NOT_RUN` state until a separately approved, exposed-only, paired singleton/batch run has been scored. Predeclare fixed cases/order permutations, denominator and acceptance before any live call. Require identical CORE/SUPPORTING versus non-supported decisions for every compared candidate and zero ownership/negation/prerequisite-critical applicability flips; report full applicability/reason agreement separately. If the gate is `FAIL` or `NOT_RUN`, batch architecture cannot be accepted or used for audit. If candidate assessments materially change when irrelevant candidates are added/reordered, stop and propose A or C under a new config rather than hiding the interference. No provider call is part of this approval.

Illustrative cost envelope, **not a budget or measured usage**: assume 1,800 shared evidence/instruction input tokens, 200 call overhead, 250 profile tokens and 120 output tokens per skill, ten skills, uncached standard text rates. Batch ≈4,500 input +1,200 output tokens, **$0.00234 per wording case** or **$0.117 for 50**. Per-candidate ≈22,500 input +1,200 output tokens, **$0.00594 per wording case** or **$0.297 for 50**. The three structural cases make no call; future runtime has the same approximate **1 versus up-to-10 call** comparison per wording request. An assessor call would be *additional* to final generation if ever promoted to production; the product's preference for one normal-path model call therefore requires separate measured quality/latency/privacy justification at integration, not an assumption in SRS-4R. Formula: `(inputTokens × $0.20 + outputTokens × $1.20) / 1,000,000`. These assumptions omit extra reasoning tokens, retries, caching differences, variable profile lengths, rate limits and provider retention; measure actual bounded tokens and set a conservative spend cap before any live use. [Official OpenAI documentation](https://developers.openai.com/api/docs/models/gpt-5.6-luna) currently lists `gpt-5.6-luna` at those rates with Responses and Structured Outputs support. Account/project access and the exact concrete model/config still need preflight verification before a later approved call. Do not substitute 6.1 Sol or a newer model silently.

## Deterministic CombinationSupervisor design (SRS-4R-B)

Inputs are validated, frozen `SkillAssessment[]`, exact candidate/profile/relationship bindings and the fixed action. No LLM, retrieval score/rank, operation signal, generated text or evaluation label enters combination. Filter to `CORE`/`SUPPORTING` with positive valid evidence; `UNSUPPORTED`/`UNCERTAIN` cannot be selected. Enumerate every subset of size 0–4 of at most ten candidates: `1 + 10 + 45 + 120 + 210 = 386`. Reject subsets containing non-atomic/out-of-pool IDs, an explicit approved skill conflict, an unsupported/uncertain assessment, or an invalid evidence binding. A mere neighbor, `CONDITIONAL` coexistence, or profile `whenNotUse` prose is **not** an automatic conflict; applicability has already considered it.

**Preferred objective: deterministic lexicographic, not numeric probability.** Among valid subsets, compare in order: (1) coverage of validated non-dominated `CORE` jobs; (2) coverage of demonstrably distinct **marginal** communication contributions from `SUPPORTING` jobs; (3) fewer conservatively proven redundant additions; (4) fewer selected skills; (5) stable sorted skill-ID tie-break. A `SUPPORTING` row earns **zero utility merely for existing** or for being included in the subset; if its distinct incremental contribution cannot be established from approved relationship metadata and evidence-use structure, size minimization excludes it and records an unresolved-contribution diagnostic. This is a future B design constraint, **not an A implementation**. No uncalibrated 93% scores, learned weights, large grid, or audit tuning. A fixed small-integer utility is an alternative only if the lexicographic rule demonstrably fails exposed development and a new reviewed config predeclares each weight. More than four genuinely distinct CORE jobs triggers a recorded `CAPACITY_CORE_OVERFLOW` diagnostic; a stable four-ID outcome must not be described as complete coverage and is a stop/review gate before audit.

Conservative, general redundancy rule for the first experiment: a `SUPPORTING` assessment contributes no *additional* job when a selected `CORE` or `SUPPORTING` assessment is explicitly **more specific** in approved profile metadata and every supporting `(evidence ref, use)` pair of the less-specific assessment is contained in the more-specific one's support. The clause-reference trace is diagnostic, not a claim that two profiles' prose is semantically equivalent. If specificity direction, evidence-use subset or a distinct contribution cannot be established mechanically, do not declare the row redundant or invent a named-pair exception: leave it eligible, record `REDUNDANCY_UNRESOLVED`, but give it no marginal utility merely for being present. Size minimization may therefore leave it unselected until distinct value is demonstrated. Never suppress a supported `CORE` merely because it shares evidence with another CORE. `OVERLAPPING`, `NEAR_NEIGHBOR` and `USUALLY_ALTERNATIVE` alone are review signals, not hard exclusions; `COMPLEMENTARY` and `COMPATIBLE` allow coexistence but do not manufacture support. A conditional pair survives when both have independently supported jobs. This preserves potential follow_up+request, apology+acknowledge_mistake, status_update+expectation_setting, boundary_setting+decline and de_escalation+boundary_setting combinations without hard-coded pair rules.

If all assessments are `UNSUPPORTED`/`UNCERTAIN` and the batch itself is valid, the empty subset wins and yields `NONE`. A non-wording structural bypass, unsupported language, empty B query, invalid batch, provider failure or binding drift remains a **separate** status; none is a successful wording `NONE`. No model is asked to classify `NONE`.

## Increment A — independent SkillAssessor, then STOP

1. Bind read-only B config/trace, profiles, 53 exposed raw/annotation sources, D4 freeze and R2 audit freeze; verify exact 21/14/7/153 parity and no operation import. Keep raw evidence and labels separate.
2. Add private Zod-first `SkillAssessment`/batch schemas, candidate-local prompt draft, reference/source validator, fake judge, content-free diagnostic records and exact-set binding under new `packages/skills/tests/srs4r-*` files. Reuse the existing serializer/projection without modifying historical source; no selected-set field or reply prose.
3. Test each candidate in isolation with deterministic synthetic and existing exposed boundary fixtures: first versus unresolved/closed follow-up; objective-negated planning/boundary; USER versus OTHER mistake; present status versus future estimate/planning; uncertainty and missing history; CORE versus SUPPORTING; valid/invalid refs, duplicate/missing/unknown IDs, profile revision drift, schema/refusal/timeout/oversized-input normalization, raw/label leakage and modifier exclusion.
4. Freeze the assessor prompt/schema/validator/serializer bindings and predeclare development gates **before** any live exposed run. Offline tests and static checks can proceed under a later implementation approval; live `gpt-5.6-luna` requests still require a separate provider/key/privacy/token/spend approval. Do not run the R2 audit in A.
5. Evaluate only the 53 exposed cases (50 wording, three structural) with raw-only inputs; join labels afterward. Report per-candidate assessments and assessor-only metrics. **Stop at `SkillAssessment[]`; do not implement or score final combination in A.** Review and freeze A results before B begins.

Assessor-only exposed metrics: 25 grounded B-available required occurrences supported (`CORE` or `SUPPORTING`), with raw totals 46 required → 38 B Top-10 → 13 provenance-blocked → 25 grounded; separate CORE/SUPPORTING counts and per-skill breadth. Report explicit forbidden `UNSUPPORTED`/`UNCERTAIN` versus falsely supported (all 12 B-available, including the seven named high-rank regressions); confirmed ownership-critical false support; prerequisite, negation and temporal-role errors; by-action and rewrite/suggest slices; 13 wording-NONE cases with any supported candidate; UNCERTAIN frequency; schema/failure rate. `UNCERTAIN` is not a successful required support and must not silently satisfy a forbidden-negative semantic claim. Unlabeled candidates remain unlabeled, never automatically incorrect.

**Proposed A development gate before B:** ≥23/25 grounded B-available required supported; 12/12 B-available explicit forbidden not positively supported (including 7/7 named regressions); zero confirmed ownership/intent-critical false support; 13/13 wording-NONE cases with zero positively supported candidates; 12/12 skills with a grounded available required example supported at least once; zero invalid assessments accepted, no label leakage and no material batch-order/interference failure. Report failures as FAIL/PARTIAL rather than changing raw cases, skill profiles or gates. Positive `COMPLETE_DRAFT` remains N/A in the original 53 rows. The R14/K22 goal-only positives remain `NOT_EVALUABLE` for grounded positive support, but ownership safety and forbidden-neighbor rejection remain mandatory.

## Increment B — deterministic combination, then STOP

1. Consume a frozen A assessment artifact; do not revise assessor results in B. Define closed combination diagnostics and the lexicographic policy before scoring the 53 cases. Implement the exhaustive subset enumerator in private shadow tooling only.
2. Unit-test all 386-subset search bounds, permutation determinism, stable ties, hard conflicts, no blanket neighbor conflict, conservative specificity redundancy, two distinct same-evidence CORE jobs, compatible/coexisting pairs, >4 CORE overflow, invalid/partial assessment failure, structural bypass and `NONE` versus `FAILED`.
3. Evaluate the same 53 exposed cases without feeding labels to the combiner. Record for each required occurrence: `HARD_ELIGIBILITY`, `RETRIEVAL_TOP10_MISS`, `PROVENANCE_GROUNDING_BLOCKED`, `ASSESSOR_REQUIRED_MISS`, `COMBINATION_DROPPED_REQUIRED`, or `SELECTED`; preserve separate `FAILED` and review diagnoses. A skill supported by A but dropped by B is a B error, not an assessor miss.
4. Report selected-required/46 end-to-end and selected/25 grounded conditional, labeled supported precision (only required-or-acceptable among **labeled** selected), unlabeled selection count/review, forbidden selected, all-required and multi-required completeness, wording-NONE accuracy, selected-count distribution, redundant extras, per-skill breadth and action slices. No retrieval rank is a combination utility.
5. Freeze exact A inputs, relationship metadata, algorithm/code, tie-breaks, labels and content-free B observations twice byte-identically. **Stop for independent review and separate audit authorization.**

**Proposed B development gate:** selected ≥23/25 grounded required; 0/12 B-available explicit forbidden selected and 7/7 named regressions rejected; ≥17/18 fully grounded positive scenarios all required selected and 4/4 fully grounded multi-required scenarios all selected; 13/13 wording-NONE correct; labeled supported precision ≥95% with unlabeled selections reported/reviewed; no confirmed critical forbidden selection, invalid accepted output, over-four selection, or unreviewed capacity overflow. Report selected/46 and the fixed 38/46 retrieval ceiling even when conditional quality passes. These are new *proposed* SRS-4R gates, to be approved and frozen before implementation/evaluation, not a retroactive D3 pass.

## Audit, challenge, and SRS-5 gates

The 64-case R2 audit is independent, frozen and model-semantically reviewed, but **UNSCORED**. No A or B design/tuning may inspect its outcomes, B candidates or model responses. After both exposed-development configs freeze, independently verify that R2 label semantics still fit per-skill assessment and combination without changing its bytes. Any mismatch requires a new, separately reviewed audit revision, not after-the-fact relabeling. Score R2 only under **separate approval** with predeclared assessor-only and final-combination metrics, denominators, stability, budget and stop rules; failures cannot be tuned and reported under the same ID. The old B forbidden@3 FAIL persists. A successful final selector could mitigate that exposed risk, but does not erase the historical retrieval gate or authorize challenge access automatically.

The protected challenge remains unopened until an additional explicit one-shot approval. Advancement toward SRS-5 requires independently reviewed assessor provenance/critical boundaries, A and B exposed gates, a separately approved untouched R2 audit that passes predeclared retrieval/assessment/combination gates, and a separately approved protected-challenge result or explicit limited-scope exception. SRS-5 alone will own selected-skill guidance merging, `SkillPlan`, prompt compilation and final-message generation; SRS-4R produces no reply.

## Privacy, provider gate, freeze, rollout and rollback

Only request-scoped validated text may enter a later approved assessor call. No screenshot, contact identity, raw request text, draft, goal, prompt, full provider response or key is persisted in machine traces/logs; retain only synthetic exposed content in existing authoring fixtures and content-free IDs, source refs, enums, revisions, digests, counts, token/latency/cost aggregates and closed errors. Keep `store:false` and direct encrypted trusted-desktop-to-provider topology as a proposed production review requirement, not an assumption that provider retention is zero. The desktop renderer never receives key values. No API service becomes a default proxy. These boundaries follow [privacy](../../docs/privacy.md).

Before **any** later live A call: verify exact `gpt-5.6-luna` API access and structured-output schema, account credential reuse decision, provider retention, model/reasoning/output caps, request topology, token/cost envelope and explicit spend approval. Freeze a new experiment ID and exact prompt/schema, model/config, B/profile/definition/evidence/assessor hashes, raw-vs-label separation, timeout/retry and content-free trace schema. Historical 6.1 Sol spend authority does not transfer. Default tests remain credential-free. Do not silently switch model or tune on R2.

Rollout is evaluation-only A → review/freeze → B → review/freeze → separately approved audit. Any failed gate stops that increment and preserves artifacts under their IDs. Rollback removes only new private SRS-4R tooling; V1/D2/D3/D4, B, semantic profiles, 21 ACTIVE definitions, 153 plans, production `SkillEngine.select()`, provider/generation and modifier behavior remain unchanged. Scaling to ~1,000 skills keeps hard eligibility/routing and semantic retrieval ahead of the bounded Top ~10 assessor; no skill tree, ANN/vector database, retrieval retune or per-skill reply generation is part of SRS-4R.

## Validation for later implementation (not run in this planning turn)

At each approved increment run focused SRS-4R and historical V1/D2/D3/D4 regressions; `pnpm skills:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm skills:verify-production` after build, `pnpm format:check`, and `git -c core.safecrlf=false diff --check`. Verify deterministic content-free artifacts twice, immutable source hashes, 21 definitions/153 plans, no production diff, audit UNSCORED and challenge untouched. Report exact command results and any waived gate. A model's structured JSON is not application validation; refusal, missing/duplicate candidate, bad source or incomplete output is explicit `FAILED`, never repaired to a success or `NONE`.

## Planning answers and open approval decisions

| Question | Proposed answer |
| --- | --- |
| Q1 intent/operation layer? | No; skill candidates are communication-job hypotheses. |
| Q2 assessment? | One source-bound, version-bound candidate-local CORE/SUPPORTING/UNSUPPORTED/UNCERTAIN record; no wording. |
| Q3 transport? | Start with one batch of independent rows, verify interference; per-candidate calls are fallback, not assumed. |
| Q4 D4 reuse? | Keep source-attributed evidence, objective/fact split, absence versus contradiction, negation, ownership and grounding; retire cross-candidate selection wire. |
| Q5 CORE vs SUPPORTING? | Direct substantive job versus independently useful secondary job; not confidence levels. |
| Q6 UNSUPPORTED vs UNCERTAIN? | Bounded evidence fails to justify job versus material ambiguity prevents safe assessment. |
| Q7 missing prerequisite? | `PREREQUISITE_NOT_ESTABLISHED`, zero positive ref permitted; never claim no historical interaction. |
| Q8/Q9 combination? | Validate and enumerate ≤386 subsets; deterministic lexicographic distinct-job utility, not fake probabilities. |
| Q10/Q11 relationships/redundancy? | Explicit conflicts alone invalidate; conservative specificity plus shared support can dominate a supporting generic job; otherwise coexist/review. |
| Q12 NONE? | Valid batch with no supported candidate selects empty subset; invalid batch is FAILED. |
| Q13 miss attribution? | Separate Top-10, provenance, assessor, combination stages per required occurrence. |
| Q14 development gates? | Predeclared A and B gates above; both freeze before separately approved untouched R2 audit. |
| Q15 ~1,000 skills? | Narrow with frozen hard eligibility/retrieval to ~10 before assessment; no all-catalog model call. |
| Q16 move toward SRS-5? | Not from this plan or exposed-only success: independent review, A/B gates and separately approved untouched audit/challenge evidence first. |

## Progress and completion record

- [x] 2026-10-03: Read repository/product/privacy/planning instructions, SRS-3F-A/B evidence, SRS-4/D4 history, source-attributed serializer, profile relationship schema and development-evaluator boundaries. Confirmed branch `skills`, 14 ATOMIC/seven modifiers, current `boundary_setting` review flag, B historical FAIL and R2 audit UNSCORED.
- [x] 2026-10-03: Checked [official OpenAI documentation](https://developers.openai.com/api/docs/models/gpt-5.6-luna) for the user-specified future model's listed Responses/Structured Outputs support and published rates; no API request or credential use.
- [x] 2026-10-03: Wrote **plan only**. No schema, prompt, selector, fixture, retrieval, production or audit artifact was changed. No tests or provider calls were run for SRS-4R planning.
- [x] 2026-10-03: User approved **SRS-4R-A offline only** with candidate-local SUPPORTING semantics, mandatory singleton-vs-batch independence gate, and no utility for merely present SUPPORTING rows in future B. Existing key-reuse decision remains recorded; no provider call is authorized.
- [x] 2026-10-03: Implemented and byte-froze offline A contracts, candidate-local batch/singleton prompt drafts, fake judge, validation, diagnostics, exposed-development plumbing and tests. Freeze SHA-256 `76cab0f8b3391c132b17bd5e1c53ff6f4447a168f26f7e9398d33049516cdfc0`; live independence gate `NOT_RUN`. See [offline A report](../../docs/skills/srs-4r-a-offline-assessor.md).
- [x] 2026-10-03: A separate up-to-$2 exposed-development live proof was approved and run. It stopped after two calls because the reverse-order R06 batch was invalid. This is a failed proof, not an A quality pass or completed independence gate; see [one-shot result](../../docs/skills/srs-4r-a-live-proof-v1.md).
- [ ] Any revised live experiment requires a new reviewed configuration and authorization. B, audit, challenge and SRS-5 retain their separate gates.

**Current stop point:** the one-shot live A proof failed at reverse-order validation. Do not treat the valid first batch or fake-judge parity as having passed the mandatory live singleton-vs-batch independence gate. Do not begin B, audit or challenge.
