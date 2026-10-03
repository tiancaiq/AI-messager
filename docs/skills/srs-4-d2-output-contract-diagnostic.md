# SRS-4-D2 — offline output-contract diagnostic

Status: **offline diagnostic implemented; no provider call**. This is instrumentation for a future, separately authorized canary. It does not change the Supervisor prompt, provider JSON schema, V1 validator acceptance, retrieval, skill definitions, production routing, or the R2 audit.

## V1 forensic finding and limit

The immutable V1 [content-free trace](../../packages/skills/tests/fixtures/srs4/development-live-v1/content-free-trace.json) records **50/50** `HTTP 200`, provider `completed`, and `MODEL_OUTPUT_INVALID`. In the frozen [V1 runner](../../scripts/evaluate-srs4-development-live.ts), missing output text is separately marked `NO_OUTPUT_TEXT`, and `JSON.parse` failure is separately marked `INVALID_JSON` before the validator returns `MODEL_OUTPUT_INVALID`. Thus V1 supports **output text present and JSON parse succeeded**, followed by a failure in wire-schema or application validation. It does **not** record the returned judgment or a validator clause. Every case-specific clause is `NOT_RECOVERABLE_FROM_V1_TRACE`; neither schema success nor candidate omission can be asserted retrospectively. The 0/50 result does not establish poor semantic Supervisor reasoning.

## Diagnostic implementation

The private [D2 wrapper](../../packages/skills/tests/srs4-output-contract-diagnostic.ts) inspects a transient provider envelope or fake output, records a closed stage/code and safe counts, and invokes the unchanged V1 `validateSupervisorJudgment` as final authority. It throws on diagnostic/V1 acceptance parity drift. The output schema permits only a bounded scenario ID, enums, booleans and numeric counts; no raw request, message, prompt, provider response or free-form reason can enter the diagnostic. The static [10-candidate fake judgment](../../packages/skills/tests/fixtures/srs4/d2-valid-judgment-v1.json) selects `request` for exposed case `SRS3B:R06` and passes both V1 and D2. No model call was made.

The first failed stage is chosen in this order:

1. `PROVIDER_RESPONSE_PRESENT`
2. `OUTPUT_TEXT_OR_OBJECT_PRESENT`
3. `JSON_PARSE_VALID`
4. `WIRE_SCHEMA_VALID`
5. `CANDIDATE_DECISION_COUNT_VALID`
6. `NO_DUPLICATE_CANDIDATES`
7. `CANDIDATE_ID_SET_VALID`
8. `SELECTION_BUDGET_VALID`
9. `REASON_POLARITY_VALID`
10. `EVIDENCE_REF_UNIQUE`
11. `EVIDENCE_REF_EXISTS`
12. `OWNERSHIP_VALID`
13. `NEGATION_PREREQUISITE_EVIDENCE_VALID`
14. `FACT_GROUNDING_VALID`
15. `RELATION_CONSTRAINTS_VALID`
16. `FINAL_SELECTION_DERIVATION_VALID`
17. `VALID`

Closed failure codes, grouped by contract clause:

| Clause | Codes |
| --- | --- |
| Provider / parse / wire | `MISSING_PROVIDER_OUTPUT`, `JSON_PARSE_FAILED`, `WIRE_SCHEMA_FAILED`, `INVALID_DECISION_VALUE`, `INVALID_REASON_CODE`, `INVALID_EVIDENCE_REF_FORMAT`, `INVALID_EVIDENCE_USE` |
| Candidate coverage | `MISSING_CANDIDATE_DECISION`, `EXTRA_CANDIDATE_DECISION`, `CANDIDATE_COUNT_MISMATCH`, `DUPLICATE_CANDIDATE_ID`, `UNKNOWN_CANDIDATE_ID` |
| Reasons | `DUPLICATE_REASON_CODE`, `REASON_POLARITY_MISMATCH`, `SELECT_WITHOUT_POSITIVE_REASON`, `REJECT_WITHOUT_REJECTION_REASON` |
| Evidence | `EVIDENCE_REF_USE_DUPLICATE`, `UNKNOWN_EVIDENCE_REF`, `INVALID_OBJECTIVE_SOURCE` |
| Ownership | `OTHER_USED_AS_USER_FACT`, `UNKNOWN_USED_AS_USER_FACT`, `SELECTED_GOAL_USED_AS_FACT` |
| Prerequisites / grounding | `NEGATION_EVIDENCE_INVALID`, `PREREQUISITE_EVIDENCE_INVALID`, `SELECT_WITHOUT_EVIDENCE`, `SELECT_WITH_CONTEXT_ONLY`, `FACT_GROUNDING_MISSING` |
| Budget / relationships / instrumentation | `OVER_SELECTION_BUDGET`, `UNSUPPORTED_CONFLICT_REASON`, `MULTI_SKILL_REASON_WITHOUT_PAIR`, `SELECTED_CONFLICT`, `DIAGNOSTIC_PARITY_DRIFT` |

The wrapper records all applicable codes it can safely establish after parsing, while `firstFailedStage` follows the fixed order. Schema-owned enum, ref-format and evidence-use violations are subcodes of `WIRE_SCHEMA_VALID`, not falsely counted as application-stage failures. An 11th decision also violates the frozen schema's `maxItems:10`, so its first stage is `WIRE_SCHEMA_VALID`; a missing decision is schema-valid and fails at candidate count.

## JSON Schema versus post-response contract

The frozen wire schema is a strict root object with `candidateDecisions` (array, at most 10), required `skillId`, `decision`, `reasonCodes` and `evidence` fields, closed decision/reason/use enums, bounded arrays, and evidence-ref pattern. The [official OpenAI Structured Outputs documentation](https://developers.openai.com/api/docs/guides/structured-outputs) describes schema adherence for supported constraints; that is distinct from these request-specific checks.

| Requirement | Frozen JSON Schema | V1 post-validation |
| --- | --- | --- |
| `candidateDecisions` array and item fields exist | Yes | Yes, via `WireJudgmentSchema` |
| Decision/reason/evidence-use enum values | Yes | Yes, via `WireJudgmentSchema` |
| Evidence-ref syntax | Yes, regex | Yes, via `WireJudgmentSchema` |
| At most 10 decisions; 1–3 reasons; at most 3 refs | Yes | Yes, via `WireJudgmentSchema` |
| Exactly one decision for **each current Top-10 ID** | No: schema has no request-specific ID set or minimum of 10 | Yes: count, uniqueness and pool membership |
| No unknown or non-atomic selected ID | No: `skillId` is a free string | Yes: candidate ID set; the upstream projection supplies only ATOMIC IDs |
| Evidence ref belongs to the serialized evidence | No: regex checks syntax only | Yes |
| SELECT uses positive reasons; REJECT uses rejection reasons | No: reason enum is not conditioned on decision | Yes |
| OBJECTIVE/USER-fact use matches evidence source | No: ref/use enum is not joined to source | Yes |
| Fact-gated skill has USER-authored factual use | No | Yes |
| Negation/prerequisite rejection cites USER factual evidence | No | Yes |
| At most four selected capabilities | No: schema limits total decisions, not number marked SELECT | Yes |
| Conflict and multi-skill reason conditions | No | Yes |
| `SELECTED`/`NONE` status matches selected IDs | Not model-supplied in the wire output | Derived and checked locally by `SkillSelectionSchema` |

Consequently, a provider-schema-valid object **can omit candidates**, cite a syntactically valid but nonexistent ref, assign a positive reason to REJECT, or treat OTHER/SELECTED_GOAL as USER fact; V1 correctly rejects each. The current static schema cannot express exact membership of the dynamic Top-10 or evidence-ref set without becoming request-specific. D2 does not change that schema.

## Binding, tests and next gate

The new [diagnostic freeze](../../packages/skills/tests/fixtures/srs4/output-contract-diagnostic-v1.json) is `SRS-4-OUTPUT-CONTRACT-DIAG-1`. It binds the unchanged V1 validator, serializer, prompt, projection, wire/reason schemas, D2 diagnostic code/stage/code schemas, fake fixture, V1 config/trace/metrics, frozen B config, semantic profiles, and R2 audit freeze. Its generator reads no audit raw cases or protected challenge. The V1 audit remains **UNSCORED**.

Focused fake tests cover valid 10-candidate output, missing/extra/duplicate/unknown candidates, schema enums/ref format, reason polarity, evidence membership/ownership, SELECTED_GOAL factual misuse, missing USER grounding, >4 selections, relationship constraints, provider/parse absence and the locally derived status invariant. `OUT_OF_POOL_SELECTION` is diagnosed as `UNKNOWN_CANDIDATE_ID`; model-supplied `STATUS_SELECTION_MISMATCH` is inapplicable because status is not a wire field.

After full offline validation and deterministic freeze checks, a tiny canary may be proposed: **3–5 existing exposed development cases only**, new immutable experiment ID, same Supervisor prompt/schema and closed D2 diagnostics, but `gpt-5.6-luna` rather than `gpt-6.1-sol` per the user's later model direction. It needs separate model/config review, budget and spend authorization. It would test contract satisfiability in live outputs, not Supervisor quality. Do not rerun 53 cases or score the 64-case audit.

## Validation record and verdict

**Offline D2: PASS. Live canary: conditionally ready for a separate approval.** The fake judgment demonstrates satisfiability; it does not prove a live model will meet the contract. The 17-stage, 32-code manifest regenerated twice byte-identically and passed a subsequent `--check`; SHA-256 is `504503dc937f425d090dfab231f6919379b2a1d70a4d3747911ab7a712c5b540`. V1 config remains SHA-256 `3b4ecfe80979486c454009d48bdba640becc8f59c642fff11b759dfd6168f93a`; R2 audit freeze remains `3297a3577ed7110e01a2629e023bf2371238559543c3c49350dbc28c727fa319`.

Focused D2/V1 SRS-4 tests: **4 files, 15 tests passed**. Required full checks passed: `pnpm skills:check`; `pnpm lint`; `pnpm typecheck`; `pnpm test` (**52 files, 542 tests**); `pnpm build`; `pnpm skills:verify-production` (**21 exact definitions, 153 ordered plans**); `pnpm format:check`; `git -c core.safecrlf=false diff --check`; and `node --conditions=development --import tsx scripts/freeze-srs4-d2.ts --check`. No provider call, audit scoring, challenge access, or production change occurred.
