# Phase 4 — Communication skill registry design

Status: design complete; implementation and activation pending. Date: 2026-09-15. This is Phase 4 of the communication research sequence. The existing application milestone `.agent/plans/phase-4.md` describes the initial Skill Engine and uses separate numbering.

## 1. Outcome, scope, and sequence

Provide a concrete authoring, validation, packaging, and migration design for the findings in [Phase 3](phase-3-capability-normalization.md). [Phase 5](phase-5-registry-expansion.md) supplies proposed content; [Phase 6](phase-6-evaluation-design.md) supplies the evaluation protocol. These research deliverables do not activate candidates. The original research brief requires production implementation to wait.

The sequence is: finish this design, use it to author Phase 5, then design Phase 6 against the resulting inventory. Acceptance for this phase means a reviewer can identify every current skill's proposed file, distinguish authoring from runtime data, and understand how a later migration preserves behavior.

## 2. Inspected baseline

| Area | Existing source | Observed behavior |
| --- | --- | --- |
| Shared contracts | `packages/contracts/src/skills.ts` | Strict Zod definition/context/plan schemas; inferred TypeScript types; IDs accept optional `en.` or `zh.` prefix; runtime status `ACTIVE` or `INACTIVE`. |
| Definitions | `packages/skills/src/registry.ts` | One TypeScript registry with 14 universal and seven language entries, all version 1 and ACTIVE. |
| Validation and selection | `packages/skills/src/engine.ts` | Validate IDs/references; freeze registry; require matching action/language and each nonempty intent/situation filter; stable score order; greedy conflicts in either direction; at most four skills. |
| Context production | `packages/ai/src/skill-context.ts` | Derives a small vocabulary from visible context and fixed policy; no general execution of descriptive use/exclusion prose. |
| Generation boundary | `packages/ai/src/coaching-prompt.ts`, `packages/contracts/src/skills.ts` | Compact principles and avoidance only; no full registry/examples in the normal prompt. |
| Tests | `packages/contracts/src/skills.test.ts`, `packages/skills/src/skills.test.ts`, `packages/ai/src/skill-integration.test.ts` | Contracts, immutability, action and language eligibility, ranking, conflicts, bounds, integration and exact-ID fixtures. |
| Metrics | `packages/skills/src/evaluation.ts` | Expected recall, allowed precision, forbidden/unnecessary/conflict rates, language, bounds, strict scenario pass. |

Selection currently scores a situation match +10, an intent match +12, a language-specific definition +3, and eligible `zh.code_switching` +8 when code-switching is visible. Equal scores use ID ordering. Compatibility does not affect score. Composition deduplicates exact strings and truncates principles/avoidance separately to 12. Descriptive exclusions do not constitute enforced negative predicates. A design must not claim that adding richer documentation changes these behaviors.

## 3. Decisions

1. Keep `packages/skills` as the package owner and `packages/contracts` as the runtime contract owner.
2. Recommend one YAML authoring record per definition. YAML makes examples and explanatory metadata readable; a later implementation must select a maintained parser and reject duplicate keys/custom executable tags. TypeScript remains the runtime packaging format.
3. Keep existing IDs exactly; folder movement never changes identity. Family is authoring metadata, not encoded in a new ID prefix.
4. Wrap the existing runtime definition in an authoring record with review metadata and examples. Do not duplicate its fields in a competing runtime schema.
5. Distinguish `ATOMIC` and `LANGUAGE_MODIFIER` in authoring. Playbooks remain research records until separately supported; do not feed them to the current atomic selector.
6. Compile only explicitly approved records from an allowlist. A file's existence, folder, or `ACTIVE` string cannot grant approval.
7. Keep authoring examples out of production bundles and provider prompts. Larger hidden evaluation suites are separate from canonical examples.
8. First migrate the current 21 definitions with byte-equivalent field values and equal selection output. Apply behavior changes in subsequent reviewed revisions.
9. Keep the three proposed additions in draft review until evidence extraction, routing, hard negatives, and usefulness checks support promotion.

## 4. Proposed file organization

All paths below are proposals; this research phase creates only Markdown documents.

```text
packages/skills/
  definitions/
    atomic/
      accountability_repair/{apology,acknowledge_mistake}.yaml
      recognition_support/{emotional_validation,reassurance}.yaml
      understanding_inquiry/clarification.yaml
      requests_options/{request,ask_for_help}.yaml
      decisions_limits/{decline,boundary_setting}.yaml
      conflict_feedback/de_escalation.yaml
      coordination/{follow_up,status_update,expectation_setting,planning}.yaml
    modifiers/
      en/{professional_conciseness,casual_naturalness,direct_but_polite}.yaml
      zh/{politeness_calibration,professional_formality,natural_conciseness,code_switching}.yaml
    drafts/
      perspective_acknowledgement.yaml
      confirmation.yaml
      give_constructive_feedback.yaml
    taxonomy.yaml
    approved-manifest.yaml
  src/
    registry.ts                 # stable existing export boundary
    generated/approved-registry.ts
    engine.ts                   # existing selection/composition
    evaluation.ts               # existing metrics
docs/skills/
  phase-3-capability-normalization.md
  phase-4-registry-design.md
  phase-5-registry-expansion.md
  phase-6-evaluation-design.md
```

Brace notation abbreviates individual files. No directory is created for an empty family. `explanation_connection` can be added only when a justified member exists. Drafts and playbook documents are excluded from the production dependency graph. Do not create a second top-level `skills` package or a Codex `SKILL.md` plugin: these are application data definitions.

### Stable ID to file mapping

| Existing ID | Proposed path below `definitions/` |
| --- | --- |
| `apology` | `atomic/accountability_repair/apology.yaml` |
| `acknowledge_mistake` | `atomic/accountability_repair/acknowledge_mistake.yaml` |
| `emotional_validation` | `atomic/recognition_support/emotional_validation.yaml` |
| `reassurance` | `atomic/recognition_support/reassurance.yaml` |
| `clarification` | `atomic/understanding_inquiry/clarification.yaml` |
| `request` | `atomic/requests_options/request.yaml` |
| `ask_for_help` | `atomic/requests_options/ask_for_help.yaml` |
| `decline` | `atomic/decisions_limits/decline.yaml` |
| `boundary_setting` | `atomic/decisions_limits/boundary_setting.yaml` |
| `de_escalation` | `atomic/conflict_feedback/de_escalation.yaml` |
| `follow_up` | `atomic/coordination/follow_up.yaml` |
| `status_update` | `atomic/coordination/status_update.yaml` |
| `expectation_setting` | `atomic/coordination/expectation_setting.yaml` |
| `planning` | `atomic/coordination/planning.yaml` |
| `en.professional_conciseness` | `modifiers/en/professional_conciseness.yaml` |
| `en.casual_naturalness` | `modifiers/en/casual_naturalness.yaml` |
| `en.direct_but_polite` | `modifiers/en/direct_but_polite.yaml` |
| `zh.politeness_calibration` | `modifiers/zh/politeness_calibration.yaml` |
| `zh.professional_formality` | `modifiers/zh/professional_formality.yaml` |
| `zh.natural_conciseness` | `modifiers/zh/natural_conciseness.yaml` |
| `zh.code_switching` | `modifiers/zh/code_switching.yaml` |

## 5. Authoring record and runtime projection

The proposed authoring record is a strict object. `definition` must validate with the existing `SkillDefinitionSchema`; metadata is validated separately. Runtime output is its approved `definition` projection. File path and human notes cannot modify eligibility.

| Authoring field | Purpose and validation | Runtime destination |
| --- | --- | --- |
| `recordVersion` | Positive integer authoring-format version, initially 1 | None |
| `kind` | `ATOMIC` or `LANGUAGE_MODIFIER`; atomic uses universal language, modifier uses exactly its supported language | None initially |
| `capabilityFamily` | One of the eight Phase 3 family keys for atoms; `language_expression` for modifiers | None |
| `definition` | Existing strict runtime object, including stable ID/version/status, eligibility and guidance | Entire validated object |
| `aliases` | Bounded distinct strings meaning the same job; never aliases for a tactic or neighboring skill | None; potential retrieval metadata later |
| `neighbors` | Referenced ID, explicit distinction, linked counterexample; allow named conceptual candidates only in draft records | None |
| `examples` | Positive, negative, confusing-neighbor, and application examples with stable local case IDs | None |
| `provenance` | Internal authorship, source URLs/locator when applicable, rights limitations, original-example declaration | None |
| `review` | Draft/reviewed/approved state, human approver and reviewed revision, evidence references; no invented approval | None |
| `evaluationRefs` | References to independent suite IDs; no embedded large generated corpus | None |

Canonical selection examples contain visible synthetic context, user intent, fixed action, language, expected/acceptable/forbidden IDs, and rationale. Application examples add a supported fact/commitment ledger plus draft and improved wording. Review-only phrases are never interpreted as executable routing predicates.

### Schema addition priorities

| Priority | Recommendation |
| --- | --- |
| REQUIRED NOW, when implementing authoring migration | `kind`, family, canonical examples, neighbor distinctions, provenance/review envelope, manifest approval validation; reuse existing runtime object. |
| USEFUL BEFORE 100 SKILLS | Small alias lists, evaluation references, explicit evidence needs documented per candidate; only add runtime condition fields when a current consumer can enforce them. |
| USEFUL AT 300+ | Consider retrieval-specific synonyms/tags and measured lexical or semantic indexes after benchmark evidence; size alone is insufficient. |
| DO NOT ADD YET | General condition language, relationship/domain inference, historical scoring, `REQUIRES` graph, `SUPPRESSES` rules, automatic approvals, model planner, playbook runtime union, vector database. |

### Example authoring file fragment

This excerpt shows the proposed wrapper around one existing definition. The complete canonical case set is supplied in Phase 5; this fragment is intentionally not a schema-valid file or a claim of human approval.

```yaml
recordVersion: 1
kind: ATOMIC
capabilityFamily: accountability_repair
definition:
  id: apology
  version: 1
  status: ACTIVE
  # All existing runtime fields are preserved during the initial migration.
aliases:
  - expression of regret
neighbors:
  - id: acknowledge_mistake
    distinction: Ownership can be stated without expressing regret.
review:
  state: DRAFT
  approvedBy: null
provenance:
  authorship: internal
  examples: independently-authored-synthetic
```

The example has `ACTIVE` under the legacy definition but `DRAFT` under review to illustrate why runtime status alone must not publish a file. The manifest/approval gate rejects that combination from the compiled registry.

## 6. Candidate routing and semantic decisions

| Candidate | Design recommendation | Evidence needed before later activation |
| --- | --- | --- |
| `perspective_acknowledgement` | Draft separate atom: recognizing a stated interpretation differs from naming a feeling or endorsing a claim. | Supported visible perspective plus user intent to acknowledge; dedicated proposed intent `acknowledge_perspective`; distinguish emotional validation and factual agreement. |
| `confirmation` | Draft separate atom: user wants to verify an understood material proposition. | Supported proposition, reason to verify, explicit/clear intent; proposed intent `confirm_understanding`; ambiguity requiring new information stays clarification. |
| `give_constructive_feedback` | Draft separate atom for communicating observed behavior, supported impact and desired change. | Ownership/evidence of behavior and impact, intent to give feedback; proposed intent `give_feedback`; no inferred motive or fabricated complaint. |

These proposed tags are absent from current enums. Phase 5 uses semantic conditions, not runnable routing values. During later implementation, change shared contracts before context producers and selection consumers; add only necessary situations after fixtures show a need. Never make a candidate eligible merely by setting empty filters or reusing a broad `conflict` tag. `confirmation` means wording a user-intended question within `REWRITE_DRAFT`, `COMPLETE_DRAFT`, or `SUGGEST_REPLY`; it cannot cause the coach's upstream `ASK_CLARIFICATION` action.

## 7. Relations, composition, and failure behavior

| Relation or concern | Decision |
| --- | --- |
| COMPLEMENTS | Keep current `compatibleSkills` informational. Author only useful combinations; do not award ranking bonuses during migration. |
| CONFLICTS | Keep existing either-direction check and stable winner ordering; do not declare neighbors incompatible just because they are similar. |
| REQUIRES | Defer. If a candidate cannot work independently, reconsider whether it belongs in a playbook. |
| SUPPRESSES | Defer. Fixed intent and hard eligibility should handle unsupported apology/refusal reversals before softer relevance. |
| Contradictory guidance | Human review plus evaluation must catch semantic contradiction; current exact-string deduplication cannot. A later composer change would be a separate behavior revision. |
| Guidance truncation | Current limit is 12 per list. Packing up to six rules from each of four skills can silently drop rules. Initial migration preserves current compact contents; expanded guidance needs explicit budget tests before activation. Global invariants must remain independent of per-skill truncation. |
| NONE versus FAILED | Preserve legitimate empty selection separately from request-scoped engine failure. Invalid approved registry should fail validation/build; it must not silently publish a partial catalog. |

Fixed action and intent form a joint non-negotiable boundary, followed by language/context eligibility, conflict handling, current relevance, and stable tie-breaking. Historical and inferred relationship signals remain absent. Do not send contradictory guidance to the generator expecting it to resolve the policy.

## 8. Packaging, approval, and versions

Proposed build sequence: parse allowlisted source records → reject malformed/duplicate fields → validate authoring records and runtime definitions → verify approval matches the exact reviewed content revision → validate IDs/references → project runtime fields → generate deterministic static TypeScript → import through existing `registry.ts` export. Sort artifact output deterministically while preserving IDs and selection tie-breaking. No runtime directory scans or YAML parsing are required.

The approval record should bind the reviewed record to a revision or content digest; a later edit must invalidate that approval. This is a review/build check, not a cryptographic identity system. A manifest entry must reference one stable ID and one source file; duplicate IDs, missing files, unreviewed edits, unknown taxonomy, or draft imports fail the build. Generated artifacts should carry an edit-source warning and be checked for freshness in CI if committed. Decide committed artifact versus build-only artifact with the actual bundler during implementation; recommend committed deterministic artifact initially for reviewable diffs.

Keep `definition.version` for behavior: eligibility, guidance, meaningful exclusions, or conflict semantics changes increase it. Example/alias/source-note edits update authoring review metadata; they increase runtime version only when they change behavior. `recordVersion` changes for authoring format changes. A folder rename changes none of these by itself. Keep drafts separate from inactive approved definitions: retirement and unreviewed content are different states.

## 9. Later implementation sequence and verification

1. Capture the current 21 normalized definitions and selection outputs as the migration reference.
2. Implement the authoring schema/parser and manifest validation in existing package boundaries; select dependencies after current-version review.
3. Move each current definition to one authoring record with identical runtime values and ID/version/status. No behavioral edits in this step.
4. Generate the approved projection and preserve the existing export/interface.
5. Compare all 21 runtime objects, current fixtures, selected order, compact guidance, action gates, language behavior, zero results and failures before/after.
6. Review Phase 5 content changes independently; update guidance/versions and routing only for candidates with accepted evidence.
7. Run the Phase 6 deterministic checks, then opt-in synthetic live evaluation when that implementation is authorized and ready.

For implementation, run the existing root commands `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm eval:phase4`, plus formatting. Do not invent a new generator command until it exists. Document-only validation for this research turn is recorded in the completion section.

Rollback for the later migration restores the original registry export and definitions from version control; there is no user-data migration. Keep content revision changes separately reviewable so a parser migration can be reverted without conflating evaluation results.

## 10. Completion record

- Design acceptance: all 21 IDs mapped; one-file-per-definition layout specified; authoring/runtime/example separation specified; schema priorities, publication gate, versioning, candidate evidence needs, compatibility/conflict behavior and migration checks documented.
- Production status: no migration, schema extension, runtime activation, or evaluation result is claimed by this document.
- Remaining review: candidate promotion, parser choice, actual build wiring, and measured routing/usefulness results.
- Next research phase: Phase 5 drafts the retained definitions, three proposed additions, language examples, and composed playbooks using these decisions.
- Documentation verification: formatting and the 21-ID path audit passed; exact verification commands and cross-document audit results are recorded in [Phase 6](phase-6-evaluation-design.md#documentation-verification-for-phases-4-6).
