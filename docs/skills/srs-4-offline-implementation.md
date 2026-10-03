# SRS-4 offline implementation and audit-authoring freeze

Status: **offline implementation validated; R2 audit authoring frozen and 64/64 model-semantically approved; audit unscored; live-call gate closed** (2026-10-01).

## Outcome and boundaries

The evaluation-only SRS-4 path now consumes the frozen SRS-3F-B Top-10 ATOMIC candidate set and produces private source-attributed Supervisor inputs. Candidates are presented by stable skill ID, without semantic score/rank, semantic triggers, full-registry text or operation signals. The private judgment schema, closed reason codes, 0–4 ATOMIC budget, deterministic validator, prompt draft, fake judge and content-free development metrics are offline only. No provider adapter was invoked, no live model was called, and no audit scenario was scored.

`SELECTED_GOAL` can establish an objective but cannot establish a user-owned fact, mistake, responsibility, commitment, deadline, continuing limit or promise. The wire judgment tags each evidence ref by use; factual uses require `USER_DRAFT` or `USER_HISTORY`. Eight fact-dependent capabilities additionally require USER-authored evidence to select. `OTHER` and `UNKNOWN` cannot prove user ownership. The validator rejects malformed or out-of-pool selections, wrong evidence sources, unsupported negation/prerequisite claims, fabricated explicit conflicts, over-budget sets and duplicate decisions. `NONE` stays distinct from `FAILED` and structural emptiness.

The existing production selector, 21 ACTIVE definitions, 153 frozen plans, B retriever/model/vectors/query/ranking, semantic profiles, modifier lane and provider/generation path remain unchanged. SRS-3F-B's forbidden@3 result remains **FAIL (7/14 against ≤6/14)**.

## Fresh audit authoring freeze — R1 retained, R2 unscored

The [R1 review packet](srs-4-audit-review-packet.md) shows all 64 synthetic raw cases, proposed labels and author rationale. Raw requests, annotations and author self-review are separate source files. They are byte-bound by [audit-authoring-freeze-v1.json](../../packages/skills/tests/fixtures/srs4/audit-authoring-freeze-v1.json), SHA-256 `232a7e5815fe44ecc51c40cef903590d89163e42be76bcab7995c434b4325844`. R1 remains unchanged.

| Coverage | Authored |
| --- | ---: |
| Total | 64 |
| Single-required / multi-required | 24 / 16 |
| Wording `NONE` / structural non-wording | 16 / 8 |
| Positive `REWRITE_DRAFT` / `SUGGEST_REPLY` / `COMPLETE_DRAFT` | 18 / 18 / 4 |
| Required / explicitly forbidden occurrences | 56 / 70 |
| Atomic skills with at least two required cases | 14 / 14 |
| R1 ChatGPT/model semantic review | **58 APPROVE / 6 REVISE / 0 QUARANTINE** |

The user relayed the independent **ChatGPT/model semantic review** decisions. This is not human or qualified-human approval; the original reviewer transcript and detailed rationales were not supplied. The [R2 review delta](srs-4-audit-review-delta-r2.md) shows the six changes: five explicit `request` forbidden labels withdrawn to **unlabeled**, and A30 given a new raw revision with visible renewed pressure after a USER-authored continuing limit. Its required `decline` and `boundary_setting` labels are unchanged. The 58 R1-approved cases preserve their original raw bytes and labels. All six R2 revisions were subsequently reported **APPROVE**, giving **64/64 model-semantic approvals, 0 REVISE, 0 QUARANTINE, 0 human approvals**. The [R2 authoring freeze](../../packages/skills/tests/fixtures/srs4/audit-authoring-freeze-v2.json) binds both source revisions and both reported review decisions to source hashes. Required occurrences remain **56**; explicitly forbidden occurrences become **65**.

Family-ID disjointness, near-copy screening, hard-neighbor coverage, input/action/mode validity, no goal-only factual required skill, per-skill breadth and source digests remain checked offline. No B retrieval or Supervisor scoring was run on the audit; its Top-10 ceiling is unknown.

## Development provenance decision and diagnostics

The unchanged 53-case exposed development set has 46 required occurrences, 38 in B Top 10. Under the newly approved provenance rule, **13 B-available required occurrences across 11 cases lack any USER draft/history grounding for their required factual skill**. Their factual content appears only in `SELECTED_GOAL`; all 13 are in B Top 10. They cannot be selected safely by the current validator:

| Case | Affected required skill(s) |
| --- | --- |
| SRS3B:R12 | `expectation_setting` |
| SRS3B:R14 | `status_update` |
| SRS3B:R16 | `acknowledge_mistake` |
| SRS3B:R18 | `reassurance` |
| SRS3B:R20 | `expectation_setting` |
| SRS3B:R23 | `status_update`, `expectation_setting` |
| SRS3B:R25 | `apology`, `acknowledge_mistake` |
| CONTROL:K14 | `apology` |
| CONTROL:K16 | `reassurance` |
| CONTROL:K22 | `expectation_setting` |
| CONTROL:K24 | `status_update` |

The user directed us to preserve all 53 cases and add `PROVENANCE_GROUNDING_BLOCKED`, with no new USER facts to rescue the old gate. The fixed decomposition is **46 total required → 38 B Top-10 available → 13 provenance-blocked → 25 grounded and safely selectable**. Pre-live conditional recall is now **≥23/25**. Report raw selected/46, retrieved/46, grounded/38 and selected/25 separately; the 13 blocked occurrences are not Supervisor misses. Grounding diagnostics identify absence of USER-authored draft/history for fact-gated skills; they do not infer a skill-specific fact from a selected goal.

All seven known forbidden occurrences remain mandatory rejection regressions. R06/R10/K20/K21 retain their required-positive selection assertions. R14 and K22 are `NOT_EVALUABLE` for required-positive selection under the current raw evidence, but remain provenance-safety and forbidden-rejection tests. No original development raw case or label changed.

## Validation and current stop point

The corrected offline rerun in the `skills` worktree passed: `pnpm skills:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (**49 files / 534 tests**), `pnpm build`, `pnpm skills:verify-production` after build (**21 exact definitions / 153 ordered plans**), `pnpm format:check`, `git -c core.safecrlf=false diff --check`, focused SRS-4 tests (**3 files / 12 tests**), R1 review-packet regeneration check, and two identical R2 freeze/review-delta checks. The corrected R2 freeze SHA-256 is `3297a3577ed7110e01a2629e023bf2371238559543c3c49350dbc28c727fa319`; the previous `b5587824713b10778f3bd52f8e8364eba0b262eceb4a4ef31b2245d1a751936f` manifest was superseded because it incorrectly attributed model review to a human. R1 raw, annotations, author review and freeze retain their original hashes; the R1 freeze SHA-256 is `232a7e5815fe44ecc51c40cef903590d89163e42be76bcab7995c434b4325844`. R2 raw and annotation hashes also remain unchanged. No production code or runtime behavior was modified.

## Live development preflight — no provider request sent

The user approved **reuse** of an existing `OPENAI_API_KEY`. Presence was confirmed in the ignored `skills` worktree `.env.local` without printing its value. No explicit SRS-4 spend cap was found in the project instructions, so the first live request remains blocked. Account access to the exact model has not been tested.

The content-free [frozen development config](../../packages/skills/tests/fixtures/srs4/development-live-config-v1.json) binds the exact offline prompt/schema and serializer/evaluator source hashes, frozen B config/trace/profiles, corrected R2 audit-freeze hash, and all 53 exposed-development case payload digests. Its SHA-256 is `3b4ecfe80979486c454009d48bdba640becc8f59c642fff11b759dfd6168f93a`. No raw message, draft, label or model response text is stored in this artifact. It freezes `gpt-6.1-sol`, Responses API, standard/medium reasoning, strict JSON schema, stable skill-ID candidate order, no score exposure, `store:false`, no tools, omitted temperature/top-p/seed, 8,192 maximum output tokens, 60-second timeout and zero automatic retries. The requested configuration has not been live-validated.

Of **53** existing exposed cases, **50** require one model judgment and **3** structural cases bypass the model. Serialized system instructions, input and schema total **720,448 UTF-8 bytes** across the 50 requests. The conservative planning envelope is **771,648 estimated input tokens** (one token per UTF-8 byte plus 1,024 per request) and **409,600 maximum output tokens** (50 × 8,192). [Official OpenAI documentation](https://developers.openai.com/api/docs/models/gpt-6.1-sol) lists standard `gpt-6.1-sol` prices of $2.00 per million input tokens, $2.50 per million cache-write tokens and $10.00 per million output tokens. Charging the entire input envelope at the higher cache-write rate and the entire output ceiling gives an **estimated maximum of $6.0251**. This is an estimate, not an account-level hard cap or invoice; tokenization, provider-side overhead, tier/region and future pricing may differ. The proposed **$8 total spend cap** is not yet approved.

The original development split remains **46 required → 38 B Top-10 → 13 `PROVENANCE_GROUNDING_BLOCKED` → 25 grounded**, with conditional recall gate **≥23/25**. R14/K22 positive selection remains `NOT_EVALUABLE` while their provenance-safety and forbidden-rejection checks remain mandatory; all seven historical forbidden occurrences remain regressions. This preflight did not run B or the Supervisor against audit A01–A64, score the audit, access the protected challenge, or change production. There is no live development result, provider-returned model metadata, token usage, latency or actual cost yet.

Preflight offline validation passed: `pnpm skills:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (**50 files / 535 tests**), `pnpm build`, `pnpm skills:verify-production` (**21 exact definitions / 153 ordered plans**), `pnpm format:check`, `git -c core.safecrlf=false diff --check`, R1 review-packet check, and two byte-identical checks each for the R2 audit freeze and development config. The R2 audit freeze remains SHA-256 `3297a3577ed7110e01a2629e023bf2371238559543c3c49350dbc28c727fa319` and `auditScored:false`.

**STOP:** the 64 audit cases have model semantic approval only, not qualified-human approval. Explicit approval of a spend cap is required before any live development request. Human boundary review remains open under the SRS-4 plan. The audit, protected challenge and SRS-5 remain out of scope.
