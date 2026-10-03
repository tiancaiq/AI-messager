# SRS-3E shadow semantic retrieval: calibration stop report

Status: **STOP_ZERO_RECALL — frozen challenge not run** (2026-09-29). This is exposed-development calibration, not held-out or production evidence.

## Implemented boundary

The evaluation-only retriever uses the pinned local English MiniLM encoder, 14 ATOMIC profiles, and separate vectors for `job`, each `useWhen`, and each `semanticTriggers` statement. It keeps `whenNotUse` and neighbor text out of positive similarity. The query retains draft, explicit goal, recent OTHER turns, and USER history as distinct sources. Production-only catalog, ACTIVE status, fixed action, language, code-switch prerequisite, and ATOMIC lane remain hard gates; intent/situation tags are not admission gates. The trace records per-source scores, hard-eligible counts, pre-threshold ranks, threshold admission, Top-K ranks, and disappearance stages. Modifier eligibility is separate. `SkillEngine.select()` and production routing were not changed.

The corrected 24-case synthetic calibration freeze is `SRS-3E-SEMANTIC-CALIBRATION-2`. The earlier `-1` draft is retained but superseded because K01 reused wording from the frozen challenge. The corrected freeze is SHA-256 `bcb55ca5ee19973e974550c75a06892e58cfa8f0bc9380efcfce790eb25e0f8a`. Codex semantic review is recorded; this is **not** human approval.

## Exact frozen inputs and result

| Artifact / measure | Result |
| --- | --- |
| Model | `Xenova/all-MiniLM-L6-v2` commit `751bff37182d3f1213fa05d7196b954e230abad9`, `@huggingface/transformers@3.8.1`, CPU/int8, local offline, 384-dim, mean pooling and L2 normalization |
| ONNX SHA-256 | `afdb6f1a0e45b715d0bb9b11772f032c399babd23bfc31fed1c170afc848bdb1` |
| Semantic profile artifact SHA-256 | `b061bf17a04e696ad78af45016e6803a96f79f0e617fcb2800a4a591fbc33d1c` |
| Frozen positive-vector artifact SHA-256 | `b02d4664585c29d3a0ac33e41c6827d2bd4d5d065fd7eb289182084c6dc05588` |
| Calibration grid SHA-256 | `d5cb69af28b6cf4d51611c58b5ee42d43ba91feea6404f43036d815a595b8a33` |
| Provisional config SHA-256 | `e790268530108775e34cbae0d8c7b7489d5c96939d5ac490cc7ff81fca1f54d5`; **not authorized for challenge use** |
| Stop-disposition SHA-256 | `a551e0cf771d336c0c7b6c86ac1a960da23bedb100589dacc565b2c85b89b36e` |

The predeclared search evaluated 57 `(α, τ)` pairs over 29 accepted English SRS-3B rows and 24 new controls. Twenty-nine pairs formally satisfy 100% strict NONE, forbidden-admission ≤20%, pool mean ≤5, and p90 ≤8. **Every such pair has zero positive-case recall.** The deterministic tie rule selects `α=0`, `τ=0.75`, but its pool is empty on all 53 calibration scenarios: required hits `0/32` on SRS-3B and `0/14` on new controls; strict NONE `16/16`; explicit forbidden admissions `0/14`. D01–D68 target-specific diagnostics are kept separate and at that pair admit `0/48` positive targets. This is a degenerate solution, not a successful retrieval configuration.

Pre-threshold rank still shows a signal: on SRS-3B, required skills rank within 3/5/10 at `18/32`, `21/32`, `27/32`; on new controls, `4/14`, `5/14`, `11/14`. Thus the immediate failure is **calibrated admission/abstention**, with additional representation/ranking weakness on new controls. For comparison, `α=0, τ=0.30` yields macro required recall `0.223` but strict NONE only `9/16`, forbidden admissions `7/14`, and pool max 14. At `τ=0.425`, macro recall is `0.163`, strict NONE `14/16`, forbidden `1/14`. No predeclared pair preserves both a nonempty positive hit and all NONE controls.

## Decision required before challenge

The provisional config has `challengeRunAuthorized: false`, and the machine stop disposition is `STOP_ZERO_RECALL`. **Do not run or tune on the frozen SRS-3E challenge.** The approved v1 threshold-only admission rule cannot meet its abstention guards and recover any calibration positives. A separate plan revision/approval should decide whether to (a) change the admission design while keeping the same frozen encoder/profile vectors, or (b) change the model/profile representation as a new version. Any revised calibration must remain on exposed development and receive a new immutable config ID before a one-shot challenge run. Merely relaxing strict NONE or choosing the attractive low threshold after seeing these results changes the approved acceptance logic and must be explicit.

No BM25, supervisor, SkillPlan, prompt compilation, vector database, provider call, candidate activation, Chinese efficacy claim, or production cutover was added.

## Validation and acceptance status

`pnpm skills:check` passed; `pnpm skills:verify-production` confirmed **21 exact production definitions and 153 frozen plans**. `pnpm lint`, `pnpm typecheck`, `pnpm test` (42 files, 508 tests), `pnpm build`, `pnpm format:check`, and `git -c core.safecrlf=false diff --check` passed. The focused SRS-3E suite has seven passing tests across retrieval boundaries and calibration freeze/stop status. `freeze-srs3e-semantic-calibration.ts --check` and `calibrate-srs3e-semantic.ts --check` passed; two offline regeneration runs produced byte-identical artifact hashes. The local int8 model was verified against pinned file digests with remote loading disabled. No provider or paid call was made.

The implementation/calibration stage is complete, but the **SRS-3E retrieval acceptance criteria are not met or assessed on the frozen challenge**. The only safe next step is an approved revised calibration/admission plan and a new immutable experiment/config version; the existing provisional config must not be promoted.
