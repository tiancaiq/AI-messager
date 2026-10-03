# SRS-3D-B — semantic skill profiles

Date: 2026-09-29  
Scope: authoring-only semantic descriptions of the existing 21 ACTIVE definitions  
Source: [`semantic-profiles.yaml`](../../packages/skills/authoring/semantic-profiles.yaml)  
Machine artifact: [`semantic-skill-profiles.json`](../../packages/skills/tests/fixtures/srs3/semantic-skill-profiles.json)

## Purpose and boundary

These profiles explain each communication job, its supporting and excluding evidence, conceptual triggers, and nearest-neighbor distinctions. They are structured source material for a **separately approved** semantic-retrieval experiment, not an operating retriever. No lexical detector, shadow retrieval, production selector, normalizer, prompt, provider payload, public contract, candidate status, or skill-tree router consumes them. Existing `definition.useWhen` and `definition.doNotUseWhen` remain runtime descriptive fields and are not duplicated or edited here.

The approved 21 YAML records, manifest and Phase 8A/SRS-3A/B/C/D-A evidence are digest-bound. Changing those records for this phase would invalidate frozen provenance. A private authoring overlay therefore binds one profile per approved ID and keeps an independently versioned profile digest next to the current definition digest. This is not a second production registry. The artifact is deterministic, has no conversation text, draft, example, rationale ledger or hidden reasoning, and is outside the production package build.

## Schema and validation

Each profile has `id`, `lane` (`ATOMIC` or `LANGUAGE_MODIFIER`), positive integer `profileRevision`, concise `job`, nonempty `useWhen`, `whenNotUse`, and conceptual `semanticTriggers`, useful `neighbors` with closed relationship/coexistence values, optional `knownBoundaryIssue`, and `reviewState`. Relationship values are `NEAR_NEIGHBOR`, `MORE_SPECIFIC_THAN`, `MORE_GENERAL_THAN`, `OVERLAPPING`, and `COMPLEMENTARY`; coexistence is `COMPATIBLE`, `CONDITIONAL`, or `USUALLY_ALTERNATIVE`. These describe semantic relationships, **not** global ranking weights or runtime conflicts.

The private loader requires exact coverage of the 21 ACTIVE approved records; rejects duplicate/unknown/self neighbors, duplicate IDs, invalid lanes and closed values; and prevents capability neighbors from pointing into the modifier lane. It rejects lexical trigger recipes such as “contains keyword.” `capabilitySemanticProfiles()` explicitly projects only the 14 atomic profiles. Profile wording, order and revision contribute to `profileDigest`; the matching approved runtime definition contributes to `sourceDefinitionDigest`. Neither digest is a human approval signature. Review states below are Codex semantic checks, not human approval.

## Profile coverage and consistency review

Counts are the number of positive conditions, exclusions, conceptual triggers and outgoing directed neighbor edges. Every profile passed the eight-question semantic audit (job match, no broadened use, no invalid suppression, conceptual rather than lexical triggers, known neighbors, Phase 8A consistency, no hidden ranking rule, no blanket composition conflict), except the explicitly pending boundary-policy decision noted below. All 21 profiles are version 1.

| Skill | Communication job summary | Use | Exclude | Triggers | Neighbors | Codex review |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| `apology` | Express supported, chosen regret. | 2 | 2 | 2 | 2 | PASS |
| `acknowledge_mistake` | Own a supported user error or omission. | 2 | 2 | 2 | 2 | PASS |
| `emotional_validation` | Recognize an expressed difficulty or feeling. | 2 | 2 | 2 | 1 | PASS |
| `reassurance` | Offer grounded support for a visible concern. | 2 | 2 | 2 | 1 | PASS |
| `boundary_setting` | State a continuing limit under repeated pressure. | 2 | 3 | 2 | 3 | BOUNDARY_REVIEW_REQUIRED |
| `de_escalation` | Reduce visible heat while retaining the user's position. | 2 | 2 | 2 | 2 | PASS |
| `decline` | Convey a chosen refusal of a specific proposal. | 2 | 2 | 2 | 2 | PASS |
| `ask_for_help` | Seek assistance with a supported need. | 2 | 2 | 2 | 2 | PASS |
| `follow_up` | Revisit a supported unresolved prior ask. | 2 | 3 | 2 | 2 | PASS |
| `status_update` | Report known present state or progress. | 2 | 2 | 2 | 2 | PASS |
| `expectation_setting` | State supported future timing, capacity, scope or uncertainty. | 2 | 3 | 2 | 3 | PASS; metadata limitation noted |
| `planning` | Coordinate known logistics or next steps. | 2 | 2 | 2 | 3 | PASS |
| `clarification` | Resolve one material unknown in a user message. | 2 | 3 | 2 | 2 | PASS |
| `request` | Seek a chosen concrete recipient action. | 2 | 2 | 2 | 4 | PASS |
| `en.professional_conciseness` | Make eligible English work-chat wording concise. | 1 | 2 | 1 | 2 | PASS |
| `en.casual_naturalness` | Keep eligible informal English wording natural. | 1 | 2 | 1 | 2 | PASS |
| `en.direct_but_polite` | Make an eligible English ask/no direct and respectful. | 1 | 2 | 1 | 2 | PASS |
| `zh.politeness_calibration` | Calibrate eligible Chinese request/refusal politeness. | 1 | 2 | 1 | 2 | PASS |
| `zh.professional_formality` | Use concise professional Chinese for work updates. | 1 | 2 | 1 | 2 | PASS |
| `zh.natural_conciseness` | Remove redundant eligible Chinese chat wording. | 1 | 2 | 1 | 2 | PASS |
| `zh.code_switching` | Preserve intentional English terms in eligible Chinese. | 1 | 2 | 1 | 1 | PASS |

The seven modifier profiles describe expression and language eligibility only. Modifier-to-capability edges document that a modifier cannot supply a communication decision; they are never capability-ranking evidence. The three inactive candidates (`perspective_acknowledgement`, `confirmation`, `give_constructive_feedback`) have no profile and remain outside production.

## Directed neighbor coverage

There are **44 directed edges**: 31 from capabilities and 13 from modifiers. Direction is authored, not inferred; no inverse edge is synthesized. Abbreviations: `N` near neighbor, `S` more specific, `G` more general, `O` overlapping, `C` complementary; `+` compatible and `?` conditional coexistence. No edge asserts blanket mutual exclusion. The source file carries each actual distinction sentence.

| Source | Outgoing `target (relationship, coexistence)` |
| --- | --- |
| `apology` | `acknowledge_mistake (O,+)`, `emotional_validation (N,?)` |
| `acknowledge_mistake` | `apology (O,+)`, `status_update (N,?)` |
| `emotional_validation` | `reassurance (O,+)` |
| `reassurance` | `emotional_validation (O,+)` |
| `boundary_setting` | `decline (O,+)`, `de_escalation (O,?)`, `expectation_setting (N,?)` |
| `de_escalation` | `boundary_setting (O,?)`, `decline (C,?)` |
| `decline` | `boundary_setting (O,+)`, `planning (C,?)` |
| `ask_for_help` | `request (S,+)`, `clarification (N,?)` |
| `follow_up` | `request (S,+)`, `status_update (N,?)` |
| `status_update` | `expectation_setting (O,+)`, `planning (N,?)` |
| `expectation_setting` | `status_update (O,+)`, `planning (N,?)`, `boundary_setting (N,?)` |
| `planning` | `request (O,+)`, `status_update (N,?)`, `expectation_setting (N,?)` |
| `clarification` | `request (O,?)`, `ask_for_help (N,?)` |
| `request` | `clarification (O,?)`, `ask_for_help (G,+)`, `follow_up (G,+)`, `planning (O,+)` |
| `en.professional_conciseness` | `en.casual_naturalness (N,?)`, `en.direct_but_polite (O,?)` |
| `en.casual_naturalness` | `en.professional_conciseness (N,?)`, `en.direct_but_polite (C,?)` |
| `en.direct_but_polite` | `en.professional_conciseness (N,?)`, `decline (C,+)` |
| `zh.politeness_calibration` | `zh.professional_formality (N,?)`, `decline (C,+)` |
| `zh.professional_formality` | `zh.natural_conciseness (N,?)`, `zh.politeness_calibration (N,?)` |
| `zh.natural_conciseness` | `zh.professional_formality (N,?)`, `zh.code_switching (C,+)` |
| `zh.code_switching` | `zh.natural_conciseness (C,+)` |

Phase 8A's eight structural capability matrices are represented: apology/ownership, validation/reassurance, boundary/refusal, boundary/de-escalation, present status/future expectation, planning/request, follow-up/request and clarification/request. The corpus's additional planning/status and request/help distinctions are also explicit. Compatible or conditional coexistence retains valid combinations such as apology + ownership, status + expectation, and follow-up + request.

## Known boundaries and source reconciliation

- `boundary_setting`: the frozen definition requires a chosen continuing limit **under repeated pressure**. This profile preserves that narrower scope. A broader first-time personal-limit policy remains a product decision; the profile is `BOUNDARY_REVIEW_REQUIRED`, not silently broadened.
- `expectation_setting`: SRS-3D-A D31/D32 show existing `planning` and `status_request` situation metadata can admit this skill without a supported future estimate. The profile explicitly excludes pure active coordination and pure current/completed status. This does **not** change governed metadata or claim to fix those retrieval false positives.
- `clarification`: this is a user-facing communication capability, not the coach's upstream `ASK_CLARIFICATION` action. The latter remains a zero-skill action.
- Phase 8A human approval is focused and exact; it did not approve all 210 canonical examples. This phase does not change those examples, their `PENDING_HUMAN_REVIEW` record state, or the Phase 8A ledger. The new profile reviews are Codex-only.

No contradiction requiring a changed current definition was found. The profile-level boundary issue and metadata precision issue are recorded separately rather than patched. No hierarchical family routing, pairwise ranking rule, or candidate promotion was inferred.

## Isolation, reproducibility and handoff

The generated approved runtime registry remains byte-identical (SHA-256 `69308570286570725609e80bcd961932da1092db2d68bad157e815616cef275d`). The semantic artifact contains 14 `ATOMIC` and seven `LANGUAGE_MODIFIER` rows, each with `profileRevision`, `profileDigest`, `sourceDefinitionDigest`, `reviewState` and the same structured profile fields. Its SHA-256 is `b061bf17a04e696ad78af45016e6803a96f79f0e617fcb2800a4a591fbc33d1c`; two generations and `--check` confirmed byte equality. Neither source nor artifact is imported by `src/`, public contracts, desktop, API, provider prompts or the renderer.

The next step, only on separate approval, is **SRS-3E**: design a private, exposed-development semantic Top-K retrieval experiment that binds both the frozen definition digest and this profile digest; keeps capability/modifier lanes and hard eligibility separate; compares against the current shadow baseline; and reports recall, precision, NONE, neighbor discrimination and pool breadth without production cutover.

## Validation record

The final focused run passed eight files and 87 tests: semantic profiles, authoring, SRS-3D-A, SRS-3C, SRS-3B, SRS-3A and SRS-2/2.5. The full suite passed 38 files and 492 tests. `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm skills:check`, `pnpm skills:verify-production`, `pnpm format:check`, and `git -c core.safecrlf=false diff --check` passed. The SRS-3C `--check` retained SHA-256 `ffa306ca87866313d58e670775ded8bad91a4dcc99cb23efe5fb35839b9dbcac`; the SRS-3D-A `--check` retained SHA-256 `8c25faac2ebe2e9260fad121907c325c428c2d9288688468cf1a6e46b03d8895`.

An initial full test run executed concurrently with lint/typecheck/format exceeded two pre-existing 5-second test timeouts; both passed in the focused run, and the full suite passed when rerun alone. No timeout settings or production logic were changed. The final artifact was generated twice with identical SHA-256 and independently checked from source. `skills:verify-production` confirmed 21 exact ACTIVE definitions, 153 ordered plans, public exports, deep freezing and authoring exclusion.
