# SRS-3E frozen-challenge recall diagnostic

Status: complete  
Owner: Codex  
Started: 2026-09-29  
Updated: 2026-09-29  
Roadmap: SRS-3 evaluation-only shadow selection; this is a diagnostic run, not semantic-retrieval implementation

## Outcome

Run the existing SRS-2.5 and SRS-3D-A shadow recall profiles on the exact frozen SRS-3E challenge corpus and give a reproducible, SRS-3D-A-style recall report.

## Scope

In: freeze verification, raw-only observation, label-after-observation metrics, content-free per-case traces, before/after comparison, tests, and a Markdown report. Out: changing the challenge corpus, normalizer, retriever, ranking, metadata, production SkillEngine, profiles, held-out evidence, candidate activation, providers, or native-language approval.

## Current state

The SRS-3E freeze has 68 exposed-development scenarios: 48 accepted English capability cases (including six strict NONE), seven accepted English modifier cases, and 13 native-language quarantines. SRS-3D-A already exposes a fixed raw-only observer and the SRS-2 shadow retriever; its earlier 32/32 recall is on a different frozen set. No recall is yet measured on the SRS-3E challenge.

## Assumptions and decisions

Compare `SRS_2_5_PROPOSED` and `SRS_3D_RECALL_PROPOSED` with `SIGNAL_ONLY`, production catalog, Top 10 and fixed AgentAction. Score only 48 English capability cases for atomic recall and NONE. English modifier cases receive a separate eligibility diagnostic, never an atomic recall denominator. Quarantined Chinese/code-switching cases are excluded from efficacy. `CURRENT` production is not run or changed. Scores remain coarse ranking signals, not probabilities.

## Contracts and data flow

Before observation, verify the exact SRS-3E freeze file and all bound source/artifact digests. Load only serialized raw requests into each profile/retriever; join annotations after retrieval to compute required, forbidden, acceptable, NONE, primary/pairwise diagnostics, disappearance stage, pool size and mode slices. Persist no raw text in the result. The synthetic raw content remains only in its already frozen fixture.

## Implementation steps

1. Add an evaluation-only loader/evaluator that verifies the freeze and observes each accepted English raw capability case with both existing profiles.
2. Compute aggregate and per-case content-free metrics, separate modifier eligibility, quarantine counts, and deterministic report bytes.
3. Add focused tests for freeze binding, denominator isolation, no raw text in output, deterministic bytes, and honest failure accounting.
4. Generate the machine artifact twice, compare bytes, write a human-readable SRS-3D-A-style report, and run repository validation.

## Tests and evaluation

Measure required Recall@3/5/10, per-scenario coverage and all-required found, strict NONE, explicit forbidden admissions, pool breadth, primary/pairwise only where annotated, and per-case required disappearance reasons. Compare both profiles on the same frozen inputs. Report English modifier eligibility separately. No generated replies or live calls.

## Acceptance criteria

- Exact challenge freeze and native-language quarantine are verified before any observation.
- The evaluator reports all 48 accepted English capability cases and seven English modifiers without mixing lanes or including 13 quarantined cases in efficacy.
- Every required miss and strict-NONE violation is traceable to a content-free case ID and retrieval stage; aggregate denominators are explicit.
- Two generations are byte-identical and `--check` passes; existing frozen evidence and production remain unchanged.
- The report distinguishes recall from precision/ranking, exposed development from held-out, and shadow from production.

## Validation commands

Focused evaluator tests; evaluator `--generate` twice and `--check`; SRS-3E freeze `--check`; SRS-3D-A and SRS-3C `--check`; `pnpm skills:check`; `pnpm skills:verify-production`; `pnpm lint`; `pnpm typecheck`; `pnpm test`; `pnpm build`; `pnpm format:check`; `git -c core.safecrlf=false diff --check`.

## Risks, rollback and limitations

The lexical recall profile can over-admit neighbors or miss unseen wording; a Top-10 hit is not a correct final selection. Modifier eligibility has no modifier ranking. Quarantined languages are structurally present but unscored. This is exposed development and cannot establish held-out generalization. Rollback removes only the new evaluator, tests, artifact, report and this plan; frozen sources are untouched.

## Progress log

- 2026-09-29: Read repository behavior/privacy and plan rules, the SRS-3E freeze/report, the SRS-3D-A evaluator/report, and SRS-2 shadow-retriever contracts. Set comparison and denominator boundaries before implementation.
- 2026-09-29: Verified the existing freeze before observing raw-only requests with both unchanged shadow profiles. Added a content-free diagnostic, three focused tests, and a Markdown report. The fresh challenge revealed required Recall@10 of 18/52 → 19/52, all 33 remaining misses at `RETRIEVAL_CUTOFF`/`NO_SUPPORTING_EVIDENCE`, six of six strict NONE passes, and forbidden admissions of 5/39 → 7/39. Chinese/code-switching cases remained unscored; modifier eligibility stayed separate.
- 2026-09-29: Generated the diagnostic twice with identical SHA-256 `756aa7add371a17ac9e9717c9280aaf920ca275526fd637cd6f7c07c3821eda2`; `--check` passed. SRS-3E freeze, SRS-3D-A, and SRS-3C `--check` passed. No frozen corpus, profile, retriever, normalizer or production file was edited.

## Completion record

The reproducible [diagnostic report](../../docs/skills/srs-3e-frozen-challenge-recall-diagnostic.md) and [machine evidence](../../packages/skills/tests/fixtures/srs3e/challenge-recall-diagnostic.json) are complete. Focused evaluator tests: 3/3 passed. `pnpm skills:check`, `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm test` (40 files, 501 tests), `pnpm build`, and `pnpm skills:verify-production` (21 exact definitions, 153 plans) passed. Final `diff --check` was run after the last edit. The next separately approved step is to design/evaluate semantic retrieval against this unchanged freeze, with both recovery and forbidden-neighbor controls; this diagnostic itself neither implements nor approves that path. The 13 language-quarantined cases still need qualified native review before language efficacy scoring.
