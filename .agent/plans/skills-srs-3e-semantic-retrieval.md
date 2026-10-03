# SRS-3E — shadow semantic skill retrieval

Status: calibration stopped: no non-degenerate guard-satisfying configuration; challenge not run  
Owner: Codex  
Started: 2026-09-29  
Updated: 2026-09-29  
Roadmap: SRS-3 shadow selection, after SRS-3D-B profiles and the SRS-3E challenge freeze

## Outcome, scope, and stop point

Build a private, reproducible **candidate-retrieval** experiment that compares raw communication with the 14 approved atomic semantic profiles. It ends at an admitted capability pool and Top-K trace. It does **not** choose a final 0–N set, compose a `SkillPlan`, generate text, call a supervisor, or change production. The user approved implementation on 2026-09-29 with the amendments below; the separate pre-challenge configuration-review gate remains in force.

In a later approved implementation, preserve the CURRENT normalizer, `SkillEngine.select()`, 21 ACTIVE definitions, 153 frozen plans, provider/prompt boundaries, existing shadow baselines, profile source/artifact, and frozen challenge. No candidate promotion, vector DB, skill tree, schema/public-contract change, or live user data belongs to SRS-3E.

## A. Baseline evidence and actual repository boundaries

The [frozen challenge diagnostic](../../docs/skills/srs-3e-frozen-challenge-recall-diagnostic.md) compared unchanged SRS-2.5 and SRS-3D-A shadow profiles on 48 accepted English capability cases: required Recall@10 was **18/52** and **19/52**, respectively; strict `NONE` was 6/6; SRS-3D-A admitted 7/39 explicit forbiddens. Its 33 required misses all passed hard eligibility but had `RETRIEVAL_CUTOFF` / `NO_SUPPORTING_EVIDENCE`, with a positive-pool median of zero. The earlier SRS-3B 32/32 result therefore did not generalize to new wording. The baseline is exposed development, not held-out evidence.

The current [SRS-2 shadow retriever](../../packages/skills/tests/srs2-shadow-retrieval.ts) already has production/evaluation catalog isolation, ACTIVE/action/language/code-switch gates, separate capability Top-K and modifier eligibility, `SIGNAL_ONLY` vs legacy metadata modes, Top-K traces, and `+12` intent / `+10` situation relevance signals. `CURRENT` [production selection](../../packages/skills/src/engine.ts) still filters by status, action, language, and intent/situation metadata, then composes at most four skills; it must remain untouched. `CURRENT` derives tags in [skill-context.ts](../../packages/ai/src/skill-context.ts); `SRS_2_5_PROPOSED` is in [skill-context-normalization.ts](../../packages/ai/src/skill-context-normalization.ts); `SRS_3D_RECALL_PROPOSED` extends it in [skill-context-recall.ts](../../packages/ai/src/skill-context-recall.ts). The new branch must bypass *semantic* tag admission, not bypass structural gates.

The private [semantic-profile source](../../packages/skills/authoring/semantic-profiles.yaml), [schema/loader](../../packages/skills/authoring/semantic-profiles.ts), [tests](../../packages/skills/authoring/semantic-profiles.test.ts), and [generated artifact](../../packages/skills/tests/fixtures/srs3/semantic-skill-profiles.json) provide exactly 14 ATOMIC and seven LANGUAGE_MODIFIER profiles. Each has `job`, `useWhen`, `whenNotUse`, `semanticTriggers`, neighbor distinctions, lane, review state, `profileDigest`, and `sourceDefinitionDigest`. These are authoring-only, not a second runtime registry. The existing [SRS-3B freeze](../../packages/skills/tests/fixtures/srs3/srs3b-english-freeze.json) and [SRS-3C baseline](../../packages/skills/tests/fixtures/srs3/baseline-report.json) remain separate regression evidence. The [SRS-3D-A 68-case variants](../../packages/skills/tests/srs3d-recall-regression.ts) are exposed, partly target-specific diagnostics rather than complete gold labels for every skill.

## B–C. Options and recommended first architecture

| Option | Strength | Limitation for this problem | First-run disposition |
| --- | --- | --- | --- |
| Lexical/BM25 over profile text | Local, cheap, deterministic, inspectable; handles exact shorthand overlap | New synonyms, indirect goals, and rough drafts caused the present failure; token overlap also misreads negative profile text | **Optional** comparator; do not implement if it delays the first embedding experiment |
| One positive vector per skill (`job + useWhen + semanticTriggers`) | Smallest embedding index: 14 vectors | Long concatenation dilutes distinct uses and hides which positive field matched | Predeclared calibration ablation |
| **Several positive vectors per skill** | A short `job`, each `useWhen`, and each `semanticTriggers` item can match independently; field/source trace remains inspectable | Max similarity can admit generic neighbors; needs calibrated admission and guard metrics | **Recommended primary first experiment** |
| Positive embeddings plus `whenNotUse`/neighbor penalty | Could separate hard neighbors | Negative text similarity is not reliable evidence of an actual exclusion; a penalty may destroy recall | Later revision or calibration-only ablation; **no penalty in first challenge run** |
| Hybrid lexical + embedding | May recover literal shorthand missed by embeddings | Extra weights, two failure surfaces, more tuning opportunities on a tiny corpus | Defer unless the first frozen experiment fails |
| LLM classifier/reranker | Can reason about ownership, prior asks, and multiple operations | A second model decision stage, cost/privacy/provider dependence, opaque reproducibility; risks acting as the future supervisor | Out of scope |

Use a **flat, local, CPU embedding comparison over positive profile fragments**, with deterministic hard gates and a calibrated absolute admission threshold. No ANN/vector database is justified for 14 capabilities. The model is an encoder, not an LLM supervisor; its cosine score is relevance only, **not probability, confidence, or final selection**. The existing lexical shadow profiles remain fixed comparators.

## D. Source-aware query representation

The semantic adapter receives a validated `CoachingRequest` and the **already fixed** `AgentAction`, not `SkillContext` intent/situation tags. No expected IDs, annotations, review rationale, scenario family/setting, semantic-profile IDs, or current normalized tags enter the query. The action is a deterministic gate and trace field, **not embedded text**. Preserve speaker/source and order; do not have an LLM summarize the exchange.

Construct separately encoded, trimmed text fragments, without invented paraphrases:

| Source | Exact first-run rule |
| --- | --- |
| `USER_DRAFT` | Visible draft text, if nonempty; primary for `REWRITE_DRAFT` and `COMPLETE_DRAFT` |
| `SELECTED_GOAL` | `selection.intent` only for an explicit `ACTION` selection; primary for `SUGGEST_REPLY`, additional primary for draft modes when present |
| `OTHER_MESSAGE` | Most recent two visible OTHER turns, separately encoded in chronological order; support/context, or primary fallback for `SUGGEST_REPLY` with no selected goal |
| `USER_HISTORY` | Most recent two visible USER turns *before* the draft, separately encoded; support/context for prior asks and commitments |

`REWRITE_DRAFT`: compare draft and any explicit goal as distinct primary fragments; OTHER/USER history can support but cannot silently rewrite intent. `SUGGEST_REPLY`: compare explicit goal as primary, with OTHER/history support; if no goal, the latest OTHER message is the primary fallback. `COMPLETE_DRAFT`: same as rewrite, but the draft is an incomplete prefix; no completion is generated by retrieval. For `SUGGEST_ACTIONS`, `ASK_CLARIFICATION`, or `NO_REPLY_NEEDED`, return an empty pool **before embedding**. If a wording action has no usable fragment, abstain and trace `EMPTY_QUERY`.

Hard eligibility is independent of semantic scores: read the approved **production-only** catalog; require `ACTIVE`, a definition-supported fixed action and language, the code-switch prerequisite where relevant, and ATOMIC lane for capability Top-K. Evaluation-only candidates and LANGUAGE_MODIFIER rows never enter that Top-K even with a high cosine score. Non-wording actions return empty. The first English encoder also abstains with `MODEL_UNSUPPORTED_LANGUAGE` for Chinese/code-switching input rather than treating a universal definition as evidence that the model can evaluate that language; the 13 quarantined rows are not scored. Intent and situation tags are **not** hard gates in this branch.

Do not concatenate all messages into one vector: speaker ownership, an expressed OTHER concern, an old USER ask, and the user's current draft have different evidentiary roles. Use at most the six source fragments above. Specify stable Unicode normalization, whitespace handling, tokenizer cap (the chosen model truncates beyond 256 word pieces), and a `QUERY_TRUNCATED` diagnostic before any calibration. No hidden semantic tags are added. All current challenge texts are synthetic; future real content must not be used in this phase.

## E–F. Profile representation and boundaries

For each ATOMIC skill, serialize a versioned positive document set: one `job` vector, one vector per `useWhen` item, and one per `semanticTriggers` item. Exclude `whenNotUse`, `neighbors`, `knownBoundaryIssue`, skill ID, and approval/review metadata from **positive vector text**. Keep each field label and ordinal in vector metadata; never concatenate positive and negative phrases. The existing `sourceDefinitionDigest` and `profileDigest` bind identity/content. `BOUNDARY_REVIEW_REQUIRED` on `boundary_setting` is not an automatic inactivation: retain the *currently approved narrow repeated-pressure definition* and record the pending policy issue.

For each query fragment, take maximum cosine similarity over that skill's positive fragments and retain the winning profile field/ordinal. Combine a primary-fragment maximum and a supporting-context maximum with one predeclared mixing coefficient `α`: `score = (1 − α) × primaryMax + α × contextMax`; when no context exists, use `primaryMax` alone. If there is no user primary and a permitted OTHER fallback exists, that fallback becomes primary and the remaining visible history is context. Candidate calibration may choose `α` only from `{0, 0.20, 0.35}`; ties resolve by higher score then stable skill ID. Do not invent a global `follow_up > request` or other neighbor ordering. `whenNotUse` and neighbor distinctions are **review/diagnostic context only** in the first run; they neither create positive vectors nor hard-eliminate or penalize a candidate. Explicit structural hard gates remain independent.

This deliberately tests whether short positive semantic descriptions improve *candidate recovery*. A high cosine against an exclusion sentence would be ambiguous; treating it as a hard negative would make already-poor recall worse. If forbidden admissions remain high, propose a separately frozen contrast/penalty revision, not a post-challenge patch to this experiment.

## G. Embedding/model decision and privacy

Use a **local English sentence encoder** for the first English-only scored experiment: `Xenova/all-MiniLM-L6-v2` ONNX at pinned repository commit `751bff37182d3f1213fa05d7196b954e230abad9`, 384 dimensions, CPU, mean pooling, L2 normalization, cosine comparison. The upstream model card describes 384-dimensional sentence embeddings, Apache-2.0 licensing, and 256-word-piece truncation; the ONNX model card documents Transformers.js mean-pooling/normalization and the same license ([upstream model](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2), [ONNX model](https://huggingface.co/Xenova/all-MiniLM-L6-v2), [pinned revision](https://huggingface.co/Xenova/all-MiniLM-L6-v2/commit/751bff37182d3f1213fa05d7196b954e230abad9)). This is a **design choice**, not a claim that its task accuracy is known. English-only is justified by the accepted efficacy denominator; Chinese/code-switching needs a separately reviewed multilingual model/configuration and qualified native-language labels.

At implementation preflight, select and pin an exact tested `@huggingface/transformers` version and ONNX dtype/model file, verify its license and all model/tokenizer file SHA-256s, document CPU/device and numeric serialization, and assess download size/startup latency. Prefer an explicitly acquired local cache with remote loading disabled for all evaluation runs; Transformers.js documents local cache paths and `env.allowRemoteModels = false` ([Node guide](https://huggingface.co/docs/transformers.js/en/tutorials/node), [environment API](https://huggingface.co/docs/transformers.js/api/env)). If the pinned model cannot be acquired, validated, or run reproducibly, **stop before calibration/challenge**; do not silently switch model. Model acquisition is a separate explicit implementation step, not part of this plan-only turn. Keep the library in evaluation/dev dependencies, not the production package export or Electron renderer.

The alternative remote `text-embedding-3-small` API could avoid a local model bundle but would add provider credentials, network dependency, per-token cost, and model-service variability; it is **not** recommended for the first experiment ([official model page](https://developers.openai.com/api/docs/models/text-embedding-3-small)). No real-user conversation is sent to any remote service here. No credential reuse, provider call, or production embedding path is authorized. A future production proposal must separately review trusted-desktop placement, privacy, licensing, bundle size, latency, and offline behavior.

## H–I. Admission calibration and separate corpus

An always-filled Top 10 would make strict `NONE` meaningless. After structural eligibility, admit an atomic candidate only when `positiveScore ≥ τ`; **then** sort and truncate to K=10. An empty admitted pool is a valid result. Calibration may choose `τ` only from `0.30, 0.325, …, 0.75` (inclusive); the grid and `α` values above are frozen by this plan, and the chosen pair must be recorded before challenge evaluation. Do not use score margins, skill-specific thresholds, learned weights, or negative penalties in the first run. If the measured calibration score range makes the grid inapplicable, stop for plan revision rather than expand it after challenge exposure.

Calibration evidence is **not** the SRS-3E challenge:

1. The exact accepted English `R01`–`R29` rows from frozen `SRS-3B-ENGLISH-1` provide complete required/acceptable/forbidden/NONE labels. Verify their existing freeze and source bindings.
2. `D01`–`D68` SRS-3D-A variants provide *target-specific* positives and controls only. Use their declared target labels; **unlabeled candidates are neither forbidden nor generic**. Keep their denominators separate from fully labeled rows.
3. Before embedding, author and review a new **CALIBRATION_ONLY** English control set of 24 synthetic cases: 12 varied strict-NONE and 12 hard-neighbor cases with complete required/acceptable/forbidden labels, covering rewrite and empty-draft suggest plus valid completion where feasible. Bind raw, annotations, review, provenance and independence checks in a separate calibration manifest. Do not copy or noun-swap SRS-3E challenge cases; the author may know the baseline aggregate but must not use challenge case misses to craft controls. If independent controls cannot be produced, stop and report insufficient abstention calibration rather than borrow challenge rows.

Choose the `(α, τ)` pair **once**, using this fixed rule: among grid pairs with 100% calibration strict-NONE, no more than 20% explicitly forbidden Top-10 admissions on *fully labelled calibration rows*, positive-pool mean ≤5 and p90 ≤8, maximize macro required Recall@10 over the two fully labelled calibration corpora (SRS-3B and new controls, equal corpus weight). Use D01–D68 as a separate target-signal/false-target guard, not full-catalog precision. Tie-break by fewer forbidden admissions, smaller pool mean, higher `τ`, then smaller `α`. If no pair satisfies every guard, stop before opening the challenge. These are calibration-selection rules, **not challenge acceptance gates**.

Freeze the chosen `(α, τ)`, K, cosine/aggregation formula, query/positive-document serialization versions, model package/revision/file hashes, exact calibration rows/hashes, profile/definition hashes, and deterministic tie rule into a new immutable experiment-config artifact **before the first SRS-3E semantic challenge run**. Preserve calibration search results and selected pair. No post-challenge threshold/model/weight search can be reported as the original first run.

## J. Frozen challenge and vector binding

The first challenge run must verify [`SRS-3E-FRESH-CHALLENGE-1`](../../packages/skills/tests/fixtures/srs3e/challenge-freeze.json) at SHA-256 `4cd2a78487b0d59c67d97bfe672219f9ff19c9913d079372b2324dbb80a87b84`, the semantic-profile artifact at SHA-256 `b061bf17a04e696ad78af45016e6803a96f79f0e617fcb2800a4a591fbc33d1c`, and **all** bound raw/annotation/authoring/review/coverage/catalog/profile digests before observing a row. It contains 48 accepted English capability rows (42 positive, 52 required occurrences, six strict NONE), seven accepted English modifier rows, and 13 quarantined Chinese/code-switching rows. If any binding drifts, **stop**; do not regenerate an expected digest. Never change a challenge input or annotation in this experiment.

Freeze each profile vector with skill ID, lane, profile field/ordinal, profile/definition digest, model repo/revision, file digests, pooling/normalization, serializer version, dimension, and vector digest. A later model/version/profile change gets a new experiment ID, not a silent vector replacement. The first run derives challenge query vectors from raw inputs with frozen config **without labels**, then records synthetic query-vector digests and content-free retrieval traces; labels join only after observation. Offline unit/verification runs consume frozen vectors, not a network download. A local model rebuild is a separately named reproducibility check; allow numerical tolerance only if predeclared, never to change Top-K or admission silently. Synthetic embeddings stay private, are not logged with raw text, and never enter a production provider payload.

Prior deterministic diagnostic results on this challenge are already known. Thus this is **not blind held-out evaluation**. Protect the remaining value by a one-shot config freeze and no semantic score peeking or threshold adjustment on these rows before that freeze; any subsequent tuned run is revision 2 and must be labelled exposed re-evaluation.

## K. Candidate trace and failure taxonomy

For each production-catalog ATOMIC skill, record `skillId`, version, `sourceDefinitionDigest`, `profileDigest`, model/config ID, structural eligibility and reasons, winning positive field/ordinal and source type, per-source positive similarity, combined relevance score, **rank among all hard-eligible atomic skills before threshold admission**, threshold/admitted state, positive-pool rank, Top-K rank, and disappearance stage/reason. Scores are **not confidence**. Store no hidden reasoning or raw messages in the machine trace. Preserve counts of hard eligible, positive admitted pool, and Top-K per case. Modifier eligibility traces remain separate.

Distinguish objective pipeline stages from audit explanations:

| Code | Meaning |
| --- | --- |
| `HARD_ELIGIBILITY` | Inactive/isolation/action/language/code-switch structural failure |
| `SEMANTIC_RETRIEVAL_MISS` | No meaningful positive semantic match under frozen representation/model; diagnose after observing score |
| `SEMANTIC_THRESHOLD_MISS` | Skill has a valid pre-threshold semantic rank but frozen `τ` rejects it; report that rank so this cannot be mistaken for an embedding-order failure |
| `TOP_K_CUTOFF` | Admitted, then ranked below K |
| `SEMANTIC_FALSE_POSITIVE` | Explicitly forbidden candidate admitted |
| `STRICT_NONE_FALSE_POSITIVE` | Any admitted capability on a strict-NONE row |
| `PROFILE_BOUNDARY_GAP` | Independently reviewed profile text insufficient/ambiguous; do not edit first-run profile |
| `SKILL_BOUNDARY_AMBIGUITY` / `BAD_EVAL_LABEL` | Requires separate semantic review; never silently reclassify frozen gold |
| `MODEL_LIMITATION` | Supported meaning missed despite adequate positive profile content; explain as inference from review, not a machine-proven cause |

Do not call every miss a profile defect, and do not treat unlabeled retrieved candidates as unsupported. Keep source/reviewer qualification truthful.

## L–M. Metrics and frozen first-run acceptance gates

Compare **on the same immutable SRS-3E rows**: (A) `SRS_2_5_PROPOSED + SIGNAL_ONLY`, (B) `SRS_3D_RECALL_PROPOSED + SIGNAL_ONLY`, and (C) the new semantic candidate retriever. A/B are read-only 18/52 and 19/52 references; verify their exact saved evidence before C. Report required Recall@3/5/10 **both before threshold across all hard-eligible skills and after threshold/Top-K**, per-capability required recovery and both ranks, macro within-scenario coverage, all-required-found@K, acceptable presence, strict NONE, explicitly forbidden Top3/5/10, hard-neighbor admissions, pool mean/p50/p90/max, every missing stage, and separate rewrite/suggest/complete slices. A required skill at pre-threshold rank 3 but absent after admission is a threshold failure; one at rank 13 is a representation/ordering failure even before admission. For the ten multi-required scenarios report both-found@K; **do not force a winner**. Primary@1 and pairwise order are secondary diagnostics only. Scores and ranks do not imply final skill choice.

Predeclared **challenge acceptance gates** for candidate retrieval, not production cutover:

| Gate | First-run threshold | Rationale |
| --- | --- | --- |
| Required Recall@10 | **≥40/52** (76.9%) | More than doubles 19/52 and tests material generalization |
| Strict NONE | **6/6** empty positive pool | No gain by returning every skill |
| Explicit forbidden Top 10 | **≤7/39** | No worse than the unchanged SRS-3D-A comparator; report Top3/5 too |
| Pool breadth | Mean ≤5, p90 ≤8, max ≤10 pre-TopK | Prevent broad flooding of a 14-skill catalog; K itself is not a fix |
| Breadth across skills | **14/14** capabilities with at least one required hit for `PASS`; **12–13/14** is `PARTIAL` even if other gates pass | Every atomic capability has fresh positive coverage; no complete skill-type failure may pass |
| Multi-required coverage | Both required skills in ≥6/10 designated cases | Candidate retrieval must support composition, not only one winner |
| All-required scenarios | ≥30/42 at Top10 | Guard against many half-recovered scenarios |

If recall rises but any guard fails, report `PARTIAL/NOT_ACCEPTED`; 12–13/14 per-skill breadth is explicitly `PARTIAL`, and ≤11/14 is `FAIL` on breadth. If recall misses, report `FAIL` with stage diagnosis. Even full `PASS` is only a shadow-candidate milestone and authorizes no production use. A label/boundary concern is quarantined for independent review; do not rewrite the freeze to improve a score.

## N. Modifier lane

Keep the seven LANGUAGE_MODIFIER profiles and seven accepted English modifier challenge cases **outside** atomic candidate Top-K and its 52-occurrence denominator. First SRS-3E run retains the current language/action/code-switch eligibility trace only; it may report required/forbidden modifier *eligibility* as a diagnostic, never modifier ranking accuracy. Do not make a modifier select or alter the underlying action/capability. A later separately frozen modifier-semantic experiment can compare register/language evidence with modifier positive profiles after its own calibration. Nine Chinese modifier and four Chinese/code-switch capability cases remain `NATIVE_LANGUAGE_REVIEW_REQUIRED` and unscored until qualified review.

## O. Scaling without a vector database or skill tree now

Flat comparison is trivial at 14 capabilities. At ~1,000 skills × roughly five 384-dimensional float32 positive vectors, the raw profile matrix is about 7.7 MB before metadata; exact scan remains a reasonable first benchmark, with latency measured rather than assumed. Cache vectors by stable skill ID/digest and add an ANN index only if measured latency requires it. A future family/tree router may sit *above* the same stable skill IDs, with family-level candidate recall measured and a flat fallback; it must not silently change definition identity or convert neighbor edges into universal rank rules. No hierarchy/router is implemented in SRS-3E.

## P–Q. Expected implementation files and verification

All paths below are **proposals**, not files created in this planning turn:

- `packages/skills/tests/srs3e-semantic-profile-documents.ts`: positive-field serialization and digest binding; no runtime export.
- `packages/skills/tests/srs3e-local-embedder.ts`: pinned local model adapter for synthetic evaluation, with remote loading disabled during runs.
- `packages/skills/tests/srs3e-semantic-retrieval.ts`: raw-only query builder, hard eligibility, score/admission/Top-K and traces; reuse catalog/eligibility logic without modifying production.
- `packages/test-fixtures/src/srs3e-semantic-calibration.ts` plus separate annotation/review files under `packages/skills/tests/fixtures/srs3e-semantic/`: new CALIBRATION_ONLY controls and manifest.
- `packages/skills/tests/fixtures/srs3e-semantic/`: frozen positive vectors, calibration vectors/results, model/config binding, first-run challenge query-vector digests, content-free challenge evidence, secondary SRS-3B and SRS-3D-A results. Do **not** write into the existing frozen `fixtures/srs3e/` files.
- `scripts/evaluate-srs3e-semantic.ts`, focused `packages/skills/tests/srs3e-semantic-retrieval.test.ts`, and `docs/skills/srs-3e-semantic-retrieval.md`.
- Exact dev dependency and `pnpm-lock.yaml` change only on implementation approval and after model feasibility/licensing preflight; no production dependency or export.

Implementation sequence: (1) verify all old freezes/profiles and model/licensing feasibility; (2) author/review/freeze calibration-only evidence; (3) implement pure deterministic query/score/trace code with a replaceable frozen-vector provider; (4) run calibration grid and freeze chosen config plus profile vectors; **human review of config/freeze before first challenge run**; (5) one raw-only frozen challenge observation, then label join and report; (6) run separate SRS-3B and D01–D68 regression/reference evaluations without pooling denominators; (7) run focused and full validation; stop before supervisor/composition.

Tests must cover freeze drift before observation, raw/label isolation, source attribution and truncation, deterministic vector/score/tie behavior, threshold abstention, non-wording empty result, all hard gates, code-switch prerequisite, lane separation, no profile negative-text contamination, no challenge access during calibration, model/network-offline behavior, pool breadth, failure-stage classification, 10 multi-required/6 NONE accounting, old-baseline parity, and production package exclusion. Standard commands: focused semantic/profile/challenge/SRS-3D-A/C/B/A/SRS-2/2.5 tests; vector/config/evidence generation twice and `--check`; `pnpm skills:check`, `pnpm skills:verify-production`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm format:check`, and `git -c core.safecrlf=false diff --check`. No live-provider test is part of the default suite.

## R–S. Risks, privacy, rollback, and limits

- A sentence encoder may match topic words instead of responsibility, intent, negation, temporal status, or repeated pressure. Inspect misses/forbidden neighbors **after** the frozen first run; do not repair them in place.
- A max over several profile vectors can broaden admission. Threshold calibration and explicit pool/forbidden/NONE gates counter this, but cannot prove future precision.
- The tiny calibration negatives and six challenge NONE cases yield noisy estimates. Report raw counts, not population confidence.
- The English encoder does not establish Chinese/code-switch efficacy. A multilingual revision must have new model/vectors, native review, and independent gates.
- Local model asset licensing, package/native-runtime support, disk/startup cost, and platform reproducibility are preflight questions. The model's 256-word-piece limit can truncate longer messages; trace it rather than silently claiming full-context understanding.
- Synthetic raw texts and vectors stay evaluation-private; do not log screenshots, drafts, messages, identities, or embeddings for real users. No application API/provider receives this corpus by default. A remote model variant requires separate privacy/credential/budget approval.
- Preserve every frozen input and baseline; rollback removes only new SRS-3E semantic experiment files and dependency changes. If any source/config/vector binding drifts, **stop** and create a new version only under new approval. Do not delete or overwrite earlier evidence.

## T. Completion/reporting boundary

An implementation report must state the exact frozen model/config/vector/calibration hashes, first-run challenge counts, per-skill and hard-neighbor failures, NONE/forbidden/pool costs, separate regression corpora, exact commands/results, production parity, limitations, and PASS/PARTIAL/FAIL against the gates above. It must not call a candidate score confidence or claim held-out/native-language validation. SRS-3E stops at capability candidate Top-K. A supervisor, conflict/dependency resolution, `SkillPlan`, prompt compilation, reply generation, modifier semantic selection, skill tree, and production cutover all require later separate plans and approval.

## Progress log

- 2026-09-29: Inspected README, product/privacy docs, plan conventions, profile source/schema/artifact/tests, challenge freeze/review/coverage/diagnostic, SRS-3B/C/D-A evidence, current/shadow normalizers, shadow hard eligibility and production selector. Reviewed primary model/library documentation. Chose a local positive multi-vector shadow design and separated calibration from the one-shot challenge.
- 2026-09-29: Applied the user's three approval amendments: pre-threshold required ranks/Recall@3/5/10, 14/14 breadth for PASS with 12–13/14 PARTIAL, and BM25 optional/non-blocking. Added exact `@huggingface/transformers@3.8.1` as a skills dev dependency and smoke-tested the pinned local ONNX model on a neutral sentence (384-dimensional output). The ignored local cache contains `onnx/model_int8.onnx` SHA-256 `afdb6f1a0e45b715d0bb9b11772f032c399babd23bfc31fed1c170afc848bdb1` plus config/tokenizer files; the initial pnpm install reported ignored optional build scripts, but this CPU inference smoke test succeeded. No challenge row was embedded or scored.
- 2026-09-29: Implemented the evaluation-only source-aware positive-vector retriever and 24-case calibration set. A copied K01 phrase was corrected before model scoring; the corrected calibration is frozen as `SRS-3E-SEMANTIC-CALIBRATION-2` with SHA-256 `bcb55ca5ee19973e974550c75a06892e58cfa8f0bc9380efcfce790eb25e0f8a`, retaining the superseded draft. The offline 57-pair calibration grid found that all 29 guard-satisfying pairs recover zero required positives. The generated `first-run-config-v1.json` is provisional and not authorized; `calibration-disposition-v1.json` records `STOP_ZERO_RECALL`. See [calibration report](../../docs/skills/srs-3e-semantic-calibration-report.md). No semantic challenge run occurred. A revised admission design and new freeze require separate approval before proceeding.

## Completion record

**Stopped at calibration viability, before challenge.** The user authorized implementation on 2026-09-29 and retained a separate human review of the frozen model/config/calibration binding before the first semantic challenge run. The approved absolute-threshold grid admits only empty-pool solutions under all guards; the generated provisional config must not be used for a challenge run. Amendment 1 is implemented in diagnostics, amendment 2 remains the untested challenge gate, and amendment 3 kept BM25 optional. No challenge input, production file, or frozen artifact was changed.
