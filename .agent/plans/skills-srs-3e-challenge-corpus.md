# SRS-3E preflight — fresh semantic-retrieval challenge corpus

Status: complete  
Owner: Codex  
Started: 2026-09-29  
Updated: 2026-09-29  
Roadmap: SRS-3 shadow skill-selection direction; corpus-only prerequisite to SRS-3E

## Outcome

Author, review and freeze a fresh exposed-development challenge set covering all 21 ACTIVE skills, without implementing or tuning any retriever.

## Scope

In: synthetic raw conversations, independent capability/modifier annotations, raw-first review ledger, authoring metadata, deterministic coverage/freshness diagnostics, immutable digest freeze, tests and report. Out: semantic/lexical retrieval, embeddings, model/provider calls, normalizer or production changes, candidate activation, held-out authoring and efficacy scoring.

## Current state

Phase 8 examples, SRS-2/2.5 diagnostics, the frozen SRS-3B corpus, SRS-3D-A variants, and 21 SRS-3D-B profiles already exist. The old corpus has 29 accepted English and 12 quarantined language rows; its hashes and SRS-3C baseline must remain reproducible. Existing raw-fixture builders use `CoachingRequest` with fixed `AgentAction`, setting and language metadata while labels live separately.

## Assumptions and decisions

Use a new `srs3e` namespace, never revise an old scenario. Target 52 capability scenarios (42 English boundary/positive, four unscored Chinese/code-switch, six strict NONE) and 16 separate modifier scenarios. Each atomic capability gets at least two accepted English positives, a hard neighbor and an English exclusion, allowing cases to serve multiple boundaries without inflating case counts. Chinese/code-switch rows receive structural Codex review only and remain quarantined pending qualified native-language review. `COMPLETE_DRAFT` is used only when a nonempty partial draft and fixed goal make completion semantically valid. Preserve `NOT_AUTHORED` held-out state.

## Contracts and data flow

Raw fixture source contains only product inputs plus coverage-only setting/language/family, no expected IDs or profile text. Separate capability and modifier annotation arrays describe required/acceptable/forbidden sets, strict NONE, and optional primary/pairwise order. A separate review ledger records per-case semantic/preservation decisions and native-language gate; authoring metadata records realistic draft class and novelty rationale. Private validation joins by ID/revision **after** raw loading, checks lane boundaries and coverage, computes duplication diagnostics against prior development inputs, and writes a deterministic coverage manifest. A freeze binds SHA-256 of raw source, serialized raw set, annotations, coverage, metadata, review, approved catalog manifest and SRS-3D-B profile artifact. All data is synthetic; no real conversation, credential or provider payload is persisted.

## Implementation steps

1. Inspect old scenario families and boundaries; write fresh product-shaped raw cases with distinct fact patterns and realistic modes/languages/settings.
2. Author separate capability/modifier labels and case-specific raw-first review and metadata; revise or quarantine unsupported cases rather than forcing labels.
3. Add closed schemas, exact ID/lane/mode gates, per-skill coverage, nearest-neighbor/composition/NONE checks, and old-corpus duplicate diagnostics. Generate content-free coverage artifact and exact freeze binding twice.
4. Run focused and full regression validation, report counts/limits, then stop before SRS-3E retrieval.

## Tests and evaluation

Test strict raw/label separation, 21-skill coverage, positive/neighbor/exclusion minima, modifier isolation, native quarantine, six NONE, mode/setting/language/draft-realism coverage, label preservation, novelty diagnostics and deterministic artifact bytes. No retrieval metrics or model calls occur.

## Acceptance criteria

- Approximately 64–76 distinct fresh scenarios cover all 21 skills with 14 atomic and seven modifier denominators kept separate.
- Each atomic capability has two accepted English positives, one accepted English hard neighbor and one accepted English exclusion, or a documented exception.
- Six fresh strict NONE cases and eight meaningful compatible multi-skill cases exist without forced primary rank.
- Chinese/code-switch cases are structurally reviewed but `NATIVE_LANGUAGE_REVIEW_REQUIRED` and excluded from accepted English efficacy denominators.
- At least half of accepted English positive cases have fresh surface patterns relative to old frozen/development evidence, with exact/near-duplicate findings reviewed manually.
- All required input/artifact/catalog/profile hashes are frozen and reproduce byte-for-byte twice; production and old frozen artifacts remain unchanged.

## Validation commands

Focused challenge/profile/SRS-3D-A/C/B/A/SRS-2/2.5 tests; challenge artifact `--generate` twice and `--check`; SRS-3C and SRS-3D-A `--check`; `pnpm skills:check`; `pnpm lint`; `pnpm typecheck`; `pnpm test`; `pnpm build`; `pnpm skills:verify-production`; `pnpm format:check`; `git -c core.safecrlf=false diff --check`.

## Risks, rollback and limitations

Shared operation types make superficial case independence easy to overclaim: combine normalized/n-gram checks with fact-pattern/intent-structure review, and classify dependent cases regression-only. Codex cannot grant native-language approval. A coverage count is not retrieval quality evidence. Rollback removes only new challenge files, plan and report; old frozen evidence is immutable.

## Progress log

- 2026-09-29: Read new brief, repository plan rules and boundaries, SRS-3D-B profiles, current raw fixture/schema/freeze conventions and prior scenario-family inventory. Chose a new isolated challenge namespace and separate lane annotations.
- 2026-09-29: Authored 52 capability and 16 separate modifier cases; completed case-specific raw-first review. Accepted 55 English cases, quarantined 13 Chinese/code-switching cases pending qualified native-language review. Zero exact normalized input or selected-goal duplicates were found against prior exposed-development sources; 42/42 accepted English positive/neighbor cases pass the lexical surface-novelty guard. The guard is not treated as proof of semantic independence.
- 2026-09-29: Generated freeze `SRS-3E-FRESH-CHALLENGE-1` twice with identical artifacts and passed `--check`. Recorded exact source, artifact, catalog and profile hashes in the freeze. Wrote the coverage and handoff report. No retriever, normalizer or production behavior changed.

## Completion record

Accepted for the SRS-3E exposed-development handoff, with native-language efficacy still quarantined. See [the corpus report](../../docs/skills/srs-3e-semantic-challenge-corpus.md) and [freeze binding](../../packages/skills/tests/fixtures/srs3e/challenge-freeze.json). Focused challenge tests: 6/6 passed; relevant profile/SRS-3D-A/SRS-3C/SRS-3B/SRS-3A/SRS-2/SRS-2.5/Phase 8 tests: 81/81 passed. SRS-3C baseline and SRS-3D-A recall `--check` passed. `pnpm skills:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (39 files, 498 tests), `pnpm build`, `pnpm skills:verify-production` (21 definitions, 153 plans), and `pnpm format:check` passed. The first lint run found an unused import in the new corpus validator; it was removed and lint passed. Final `diff --check` and post-report format check are recorded after the last edit.
