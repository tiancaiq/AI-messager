# SRS-4-D3 — five-case live output-contract canary

Status: **FAIL — 0/5 complete V1 validator acceptance**. This is an exposed-development output-contract diagnostic, **not** a Supervisor-quality evaluation. The 64-case R2 audit is still unscored, the protected challenge untouched, and production unchanged.

## Frozen experiment and controlled variables

The user separately approved up to **$1** for five `gpt-6.1-sol` Responses API requests on 2026-10-03. This D3 brief specifically restored the V1 model for a controlled comparison; it did not authorize another full development run. A new immutable config, [`SRS-4-DEV-CANARY-1`](../../packages/skills/tests/fixtures/srs4/development-canary-config-v1.json), kept the V1 medium reasoning, prompt, strict wire JSON schema, evidence serialization, neutral candidate projection/order, profile projection, 0–4 bound, ownership rules, validator, `store:false`, no tools, 8192 output-token cap, 60-second timeout, and zero automatic retries. Only the D2 privacy-safe diagnostic was added. The five existing exposed cases and raw revisions were bound before request 1:

| Case | Raw revision | Purpose |
| --- | --- | --- |
| `SRS3B:R06` | R1 | First request versus follow-up neighbor |
| `SRS3B:R10` | R1 | De-escalation versus boundary-setting neighbor |
| `SRS3B:R14` | R1 | Provenance-blocked positive; forbidden planning diagnostic |
| `SRS3B:R26` | R1 | Wording `NONE`, all-REJECT contract |
| `SRS3B:R13` | R2 | Grounded multi-required development row |

All five payload bytes, candidate counts and SHA-256s reproduced the frozen V1 bindings; each had ten candidates. The config was rendered twice byte-identically. The V1/D2/B/profile/R2 source and contract chains passed before any request. No response was used to alter later requests.

## Observations

All five intended one-shot requests returned **HTTP 200**, provider status `completed`, and model metadata `gpt-6.1-sol`. All five had output present, parseable JSON, and a valid wire schema with exactly ten unique expected candidate decisions. No candidate omission, extra/unknown/duplicate candidate, invalid reason-code polarity, unknown evidence ref, ownership violation or SELECT fact-grounding violation was diagnosed. Yet all five failed the same later application-contract stage, and the unchanged V1 validator accepted **none**.

| Case | First failed D2 stage | All safely established failure codes | SELECT count before validation | V1 accepted? |
| --- | --- | --- | ---: | --- |
| R06 | `NEGATION_PREREQUISITE_EVIDENCE_VALID` | `PREREQUISITE_EVIDENCE_INVALID` | 1 | No |
| R10 | `NEGATION_PREREQUISITE_EVIDENCE_VALID` | `PREREQUISITE_EVIDENCE_INVALID`, `NEGATION_EVIDENCE_INVALID` | 2 | No |
| R14 | `NEGATION_PREREQUISITE_EVIDENCE_VALID` | `PREREQUISITE_EVIDENCE_INVALID`, `NEGATION_EVIDENCE_INVALID` | 0 | No |
| R26 | `NEGATION_PREREQUISITE_EVIDENCE_VALID` | `PREREQUISITE_EVIDENCE_INVALID`, `NEGATION_EVIDENCE_INVALID` | 0 | No |
| R13 | `NEGATION_PREREQUISITE_EVIDENCE_VALID` | `PREREQUISITE_EVIDENCE_INVALID` | 1 | No |

Aggregate first-failure stages: **5** at `NEGATION_PREREQUISITE_EVIDENCE_VALID`; **0** at every other stage. Code occurrences: `PREREQUISITE_EVIDENCE_INVALID` **5**, `NEGATION_EVIDENCE_INVALID` **3**. D2 records all safely established codes, while the first-stage count follows its frozen order. There were **0 wire-schema failures** and **0 candidate omissions**. Rejection-evidence/provenance constraints failed in **5/5**; the separate source-ownership and SELECT fact-grounding counters remained zero. R14's required-positive selection remains `NOT_EVALUABLE`; R26's invalid all-REJECT output cannot be counted as a correct `NONE`.

The frozen V1 validator requires any `PREREQUISITE_UNSUPPORTED` or `EXPLICITLY_NEGATED` rejection reason to cite `USER_DRAFT` or `USER_HISTORY` with a `USER_*` factual use. D2 establishes that at least one such rejection in each output lacked that exact evidence-use condition. This is a **specific observed contract incompatibility** in these five live outputs, not proof that the validator rule itself is wrong or that all 50 historical V1 failures had the same cause. Because raw responses were intentionally not retained, D3 cannot adjudicate whether the model chose an inappropriate rejection reason, failed to cite an available USER fragment, or encountered a case where absence of a prerequisite cannot be evidenced under the current rule. That question belongs to a separately reviewed contract/prompt revision.

## Provider use, privacy and binding

| Measure | Result |
| --- | ---: |
| Provider / requested and returned model | OpenAI Responses API / `gpt-6.1-sol` |
| Intended / completed requests; automatic retries | 5 / 5; 0 |
| Input / output tokens | 16,692 / 2,638 |
| Measured latency, total / maximum | 49,466 ms / 11,904 ms |
| Known-usage conservative cost estimate | **$0.068110** |
| Conservative reserved cost envelope | **$0.601585**, under approved $1 |

The estimate applies the conservative **$2.50/M cache-write input rate** to all reported input tokens, plus $10/M output, from the [official OpenAI model rates](https://developers.openai.com/api/docs/models/gpt-6.1-sol); actual uncached input is listed at $2/M and cached input may be lower. This is not an invoice or a provider-enforced spend cap. The [content-free trace](../../packages/skills/tests/fixtures/srs4/development-canary-v1/content-free-trace.json) stores only fixed case IDs, revisions, hashes, provider status/model, numeric usage/latency/cost, D2 enums/counts, V1 status and valid-only selected IDs. It stores no raw draft/message/goal text, prompt, provider response, hidden reasoning or credential. Separate one-shot intent and observation records prevent silently replaying an interrupted run.

| Artifact | SHA-256 |
| --- | --- |
| [Frozen config](../../packages/skills/tests/fixtures/srs4/development-canary-config-v1.json) | `7d64661ccd0a1b35dc249ae890708c2ea9487cf8aa5f9002ca80f0639eec4e95` |
| [Content-free D2 trace](../../packages/skills/tests/fixtures/srs4/development-canary-v1/content-free-trace.json) | `34f2ba762019bddb6946abc25ab0b3fb458f690266a09ce874df1b6f1d5b6bb7` |
| [Aggregate metrics](../../packages/skills/tests/fixtures/srs4/development-canary-v1/metrics.json) | `33ebd0d359394b1c92df5c1e68fdb3eb23c7d5367415436c5b48647dec80188c` |
| [Validation record](../../packages/skills/tests/fixtures/srs4/development-canary-v1/validation-record.json) | `1821f3a685294eebf4f15ad9ddefcd72c2eaa1f86735968ba08711090353d367` |

The config binds the historical D2 freeze (`504503dc937f425d090dfab231f6919379b2a1d70a4d3747911ab7a712c5b540`), V1 config, serializer, projection, prompt/schema/validator, B config/trace, semantic profiles, R2 audit freeze, exact case revisions and payload digests. The validation record binds config, trace and metrics bytes.

## Verdict and next decision

**FAIL: 0/5 contract-valid.** Do not run the other 48/53 development cases, score the audit, run the protected challenge, infer Supervisor quality, or switch models under this experiment ID. First independently review the rejection-reason/evidence-use contract and prompt together, including whether `PREREQUISITE_UNSUPPORTED` is representable for absence-of-evidence cases such as an empty-draft `NONE`. Any change requires a **new** versioned config and separate approval before another live request. D3 itself makes no prompt, schema, validator, retrieval, profile or production change.

## Validation

Focused D3/D2/V1 tests, deterministic config and artifact-integrity checks, `pnpm skills:check`, `pnpm skills:verify-production`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm format:check`, and `git -c core.safecrlf=false diff --check` are recorded after the canary in the D3 execution plan. The production boundary remains 21 definitions and 153 frozen plans.
