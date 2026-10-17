# SRS-4R-A live assessor proof V1 — FAIL

Date: 2026-10-03  
Scope: exposed development only, `gpt-5.6-luna`, $2 cap, at most 138 requests  
Frozen config SHA-256: `1fa4019d91e53c5d0746f99f91614ecbfa2e40b16324f48504ef2e1ba537db2e`

## Result

The real lightweight assessor is **not yet proven** to assess individual skills correctly or independently. The first ID-order batch for exposed case `SRS3B:R06` returned a complete, application-valid ten-candidate assessment. It marked `request` `CORE` (the case's required capability) and `follow_up` `UNSUPPORTED` (its explicit forbidden neighbor). This is one correct synthetic case, not a quality estimate.

The same case with candidate order reversed returned HTTP 200 and a completed response from the exact requested model, but failed application validation with `EXPLICIT_NEGATION_EVIDENCE_INVALID`. At least one `EXPLICITLY_NEGATED` rejection lacked a valid USER/goal objective evidence reference. The validator correctly refused to treat that output as a safe assessment. The raw provider response was not retained, so the offending candidate and any category differences cannot be reconstructed from this V1 trace.

The predeclared stop rule halted the run after **2/138 calls**. No singleton assessment was requested. The mandatory eight-case, 160-comparison independence gate remains **`NOT_RUN`**, not PASS or a measured mismatch rate. The remaining 51 exposed cases were not assessed; the 25-grounded-required, 12-forbidden and 13-wording-`NONE` gates are therefore **not evaluated**. This run cannot establish assessor correctness or batch independence, and it does not authorize SRS-4R-B.

| View | HTTP / provider | Application result | Relevant observation |
| --- | --- | --- | --- |
| R06 ID-order batch | 200 / completed / `gpt-5.6-luna` | VALID | `request=CORE`, `follow_up=UNSUPPORTED`; 10 candidates present. |
| R06 reverse-order batch | 200 / completed / `gpt-5.6-luna` | FAILED | `EXPLICIT_NEGATION_EVIDENCE_INVALID`; no safe assessment accepted. |

Known usage was 7,542 input tokens and 1,385 output tokens. Calculated known spend was **$0.00317** at the published standard text rates; the pre-request conservative reservation was **$0.027026**, well below the approved $2 cap. These are evaluation accounting values, not an invoice. No retries, fallback model or extra calls were made.

## Integrity and boundaries

- [Content-free trace](../../packages/skills/tests/fixtures/srs4r/live-development-v1/content-free-trace.json) stores IDs, enums, closed failure codes, usage and cost, without raw prompt, draft, provider response or key.
- The [frozen live config](../../packages/skills/tests/fixtures/srs4r/live-development-config-v1.json) binds the offline A freeze, exposed development source/payloads, eight fixed independence cases, model settings and per-request budget envelope. It was checked byte-for-byte before live use.
- Before the first call, `pnpm lint`, `pnpm typecheck`, `pnpm test` (59 files / 557 tests), `pnpm build`, `pnpm skills:verify-production`, `pnpm format:check`, the live-config freeze check, and `git -c core.safecrlf=false diff --check` passed. The opt-in runner was separately typechecked and its no-flags refusal was checked. Production parity remained 21 definitions and 153 plans.
- The frozen 64-case R2 audit remains UNSCORED; the protected challenge was not used. SRS-3F-B, profiles, production routing and provider/generation code were unchanged. No SRS-4R-B optimizer was implemented.

## Interpretation and next gate

The failure demonstrates that a valid singleton-independent contract is not guaranteed just because structured JSON was returned. It does **not** prove the model changed its applicability judgment with candidate order: the reversed view was invalid, and no singleton views exist. The evidence supports a narrower conclusion: this V1 batch prompt/output contract is not robust under the first order permutation.

Stop here. A revised experiment would need a new frozen ID, a content-free per-row invalidity diagnostic that identifies the offending skill without retaining raw content, a reviewed adjustment or a singleton-first transport, and separate authorization for any additional live calls. Do not retune V1, declare the independence gate passed, score the audit or proceed to B from this result.
