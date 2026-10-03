# SRS-3E fresh semantic-retrieval challenge corpus

Status: **frozen for exposed-development evaluation**, not held-out evidence. Freeze ID: `SRS-3E-FRESH-CHALLENGE-1`. This phase authored and reviewed the exam only; it did not implement or tune semantic retrieval.

## Scope and disposition

The corpus has **68 new synthetic scenarios**: 52 capability-lane and 16 modifier-lane. Of the capability cases, 48 English cases are accepted for an initial efficacy denominator (42 positive/neighbor cases and six strict `NONE` controls). Seven English modifier cases are accepted for their *separate* modifier denominator. Thirteen Simplified Chinese, Traditional Chinese, or code-switching cases are structurally reviewed but **quarantined** pending qualified native-language review; they are not accepted language-efficacy evidence. The review ledger records 55 `PASS`, 13 `QUARANTINE`, and no unresolved `REVISE` or `REJECT` cases. Held-out evidence remains `NOT_AUTHORED`.

The product-shaped [raw scenarios](../../packages/test-fixtures/src/srs3e-semantic-challenge.ts) contain conversation, user draft, selected goal, fixed action, and language observations. Fixture-only ID/family/setting fields are outside the request. [Annotations](../../packages/skills/tests/srs3e-challenge-annotations.ts), [authoring metadata](../../packages/skills/tests/srs3e-challenge-authoring.ts), and the [per-case raw-first review ledger](../../packages/skills/tests/srs3e-challenge-review.ts) are separate and joined only by scenario ID and revision. Modifier labels never become atomic-capability ranking gold. The serialized artifacts and coverage manifest are in [fixtures/srs3e](../../packages/skills/tests/fixtures/srs3e/).

## Coverage

Counts below are scenario counts, not independent-quality weights. An `H` case is a deliberately difficult neighbor boundary, while `N` is an explicit exclusion for that skill. Chinese/code-switching positives are shown in the counts but remain quarantined; the manifest identifies every case ID, mode, language, setting, and draft-realism classification.

| Atomic capability | Positive | Hard neighbor | Negative | Multi-skill |
| --- | ---: | ---: | ---: | ---: |
| apology | 3 | 1 | 3 | 1 |
| acknowledge_mistake | 4 | 1 | 2 | 1 |
| emotional_validation | 3 | 1 | 1 | 1 |
| reassurance | 4 | 1 | 2 | 1 |
| boundary_setting | 4 | 2 | 7 | 3 |
| de_escalation | 4 | 1 | 3 | 1 |
| decline | 5 | 1 | 1 | 2 |
| ask_for_help | 2 | 1 | 3 | 0 |
| follow_up | 2 | 1 | 2 | 1 |
| status_update | 5 | 1 | 2 | 1 |
| expectation_setting | 4 | 2 | 5 | 2 |
| planning | 4 | 2 | 5 | 3 |
| clarification | 4 | 1 | 3 | 0 |
| request | 8 | 1 | 1 | 3 |

Every atomic capability meets the minimum of two accepted English positives, one accepted English hard neighbor, and one accepted English exclusion. The thinnest positive coverage is `ask_for_help` and `follow_up` (two each); `emotional_validation`, `decline`, and `request` have only one explicit exclusion each. `ask_for_help` and `clarification` have no multi-skill case. These are limitations for interpreting future per-skill metrics, not reasons to synthesize extra cases after freeze.

| Language modifier | Positive | Negative/neighbor | Initial efficacy status |
| --- | ---: | ---: | --- |
| en.professional_conciseness | 3 | 2 | Accepted English lane |
| en.casual_naturalness | 2 | 2 | Accepted English lane |
| en.direct_but_polite | 2 | 1 | Accepted English lane |
| zh.politeness_calibration | 2 | 1 | Native review required |
| zh.professional_formality | 2 | 4 | Native review required |
| zh.natural_conciseness | 3 | 3 | Native review required |
| zh.code_switching | 2 | 1 | Native review required |

The 10 multi-skill cases are `C02`, `C05`, `C09`, `C10`, `C17`, `C19`, `C23`, `C24`, `C35`, and `C39`. They include the eight requested compositions: apology + ownership, validation + reassurance, boundary + de-escalation, boundary + decline, follow-up + request, status + expectation, planning + request, and planning + expectation. The first eight do not force an unjustified primary ordering. Optional primary/pairwise judgments exist only where the separate review found a defensible ordering. Strict `NONE` cases are `C47`–`C52`: ordinary acknowledgement, social chatter, neutral information, a complete thread, a trivial response, and a non-wording action.

Across all 68 scenarios, fixed modes are `REWRITE_DRAFT` 34, `SUGGEST_REPLY` 30, `COMPLETE_DRAFT` 3, and `NO_REPLY_NEEDED` 1 (the last is a `NONE` eligibility control). Of the 37 draft-bearing cases, 17 are rough, 17 normal, and three already decent. Settings are personal 29, service 16, and work 23. Language groups are English 55, Simplified Chinese 7, Traditional Chinese 3, and code-switching 3. Settings are fixture-only coverage metadata and must not enter retrieval.

## Freshness and review limits

Every new case was compared against Phase 8 authoring evidence, SRS-2 diagnostics, SRS-2.5 T1–T18, the frozen SRS-3B corpus, and SRS-3D-A recall variants. The deterministic checks found **zero exact normalized raw-input duplicates** and **zero exact selected-goal duplicates**. All 42 accepted English positive/neighbor cases passed the lexical surface-novelty guard; the maximum measured full-input trigram Jaccard was 0.091, and the maximum selected-goal bigram Jaccard was 0.286. The case-specific authoring/review notes separately address fact-pattern dependence and chosen neighbor boundaries. Lexical distance is a guard, **not proof of semantic independence**; abstract communication jobs inevitably recur. No case was retained as a regression-only copy.

The Codex review checked grounding, neighbor distinction, facts, intent, responsibility, commitments, certainty, action validity, draft realism, duplicate lineage, and any primary/pairwise labels. Chinese and code-switching rows have `NATIVE_LANGUAGE_REVIEW_REQUIRED` and `CODEX_STRUCTURAL_REVIEW`, not native or human approval. They are frozen for later review without entering the initial scored denominator.

## Freeze and handoff

The [freeze binding](../../packages/skills/tests/fixtures/srs3e/challenge-freeze.json) requires a **new review and freeze ID for any change** to bound sources or artifacts. The generator was run twice and produced byte-identical output; `--check` confirmed all serialized artifacts. SHA-256 bindings are:

| Bound item | SHA-256 |
| --- | --- |
| Raw source | `3151689c9a75fb97f551369a5ee11c790ba833ff84ceb723b5a0c94224ff00c1` |
| Serialized raw set | `9923916d2537bfb7c4d6cdea563d78d33b7e1862377e6a31005181284b1da48a` |
| Annotation source | `51691b110c093612e5000643b1cd688536fdbc6095da45cad5b7067ce3b8e060` |
| Serialized annotations | `470e905a523a9036fe233c168501b9fcf3314371cf2b9fd8b127b49ec41ff6c2` |
| Authoring source | `ec7808d72a353956851811ab7bca3eb9fecb2adb37c1520a585d4768da665569` |
| Serialized authoring metadata | `a16be226a5d926c489efb0d8c7419a397568283f16086e1ccfaff298e07c7379` |
| Review source | `1ff49dae29145efaca0e8898f0f9d0f30a597bc474a581c9b7b20151c9245052` |
| Serialized review ledger | `32dbb392654921455bc4549929bd0744023ffe683ff3176e47498c342d7312c1` |
| Coverage manifest | `19cca29c22e9f92c7dbe3a74b4ed9aa673c151ab77fa4410c544646c56444e84` |
| Approved production catalog | `f53d78d4866a386fd544e0cf3a9e3b76373e49e265c7fc9a180b866871a8eb72` |
| SRS-3D-B semantic profiles | `b061bf17a04e696ad78af45016e6803a96f79f0e617fcb2800a4a591fbc33d1c` |
| Freeze file itself | `4cd2a78487b0d59c67d97bfe672219f9ff19c9913d079372b2324dbb80a87b84` |

SRS-3E can consume this exact exposed-development freeze without editing it. Production remains at 21 ACTIVE definitions and 153 frozen plans, with the CURRENT normalizer, current SkillEngine, provider boundary, and no candidate activation or profile runtime consumption. No semantic retriever, embedding, reranker, or final-reply generator was added in this phase.
