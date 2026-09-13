# Phase 4 — Initial Communication Skill Engine

Status: complete locally — post-fix live generation and quality evaluation pending
Owner: Codex
Started: 2026-08-12
Updated: 2026-08-23
Roadmap milestone: Phase 4 — initial Communication Skill Engine

## Outcome

Insert a small, source-controlled, manually approved Communication Skill Engine between the explicit Phase 3 action and basic response generation. The engine deterministically selects zero to four relevant universal/English/Chinese skills, resolves conflicts, composes compact provider-neutral guidance, and improves the inputs to the existing generator without changing the user’s action or intent.

## Scope

In scope: a strict Zod-first atomic `SkillDefinition`; approximately twenty manually reviewed active skills; deterministic `SkillContext`; language/situation/intent/action eligibility; bounded ranking; conflicts and compatibility metadata; normalized composition; integration with the provider-neutral Phase 3 generator; development-only structured skill visibility; deterministic fixtures/metrics and a later live comparison harness.

Out of scope: relationship or identity inference, memory/history, persistence, playbook graph infrastructure, embeddings/vector search/PostgreSQL/RAG, model-generated or mutable runtime skills, Skill Factory, 1,000+ catalog scale, multi-agent runtime architecture, additional providers, iOS, insertion, sending, and the next milestone.

## Current state

- Phase 3 was independently audited, reverified, and committed at `a67a36ff3202a2ee1c790b9da8ad66f2f47f624e`; Phase 4 starts from a clean tree.
- The Phase 0 placeholder has been replaced by strict atomic definition, context, selected-reference, and communication-plan schemas.
- `packages/skills` now owns the 21-skill immutable registry, registry validation, deterministic eligibility/ranking/conflict filtering/composition, and selection metrics.
- `packages/ai` derives a deterministic request-scoped skill context only after Phase 3 fixes the `AgentAction`; `OpenAiCoachingAdapter` receives only compact principles/avoidances.
- Synthetic exact-ID skill-selection fixtures and tests exercise apology, status, missed commitment, boundary, support, decline, planning, no-skill, language, uncertainty, and conflict behavior.
- Authenticated OpenAI access and one production screenshot analysis succeeded through the user's existing local proxy. A live coaching attempt reached OpenAI and exposed the root-union schema and retry-selection defects now fixed locally. Post-fix final-reply generation and human-reviewed quality comparison remain pending; the proxy must be configured and running. Windows capture validation also remains pending.

## Assumptions and decisions

- Use twenty-one atomic skills: fourteen universal communication operations, three English modifiers, and four Chinese modifiers. No playbooks or near-duplicate translations.
- Runtime status is `ACTIVE | INACTIVE`. Source-controlled `ACTIVE` means manually approved for this milestone; there is no runtime authoring path.
- Skill IDs use underscore namespaces such as `status_update`, `en.professional_conciseness`, and `zh.code_switching`; every definition has version `1`.
- Context tags are deterministic, normalized, and deliberately small. They derive only from the explicit action, selected intent, visible messages/draft, language, warnings, and material ambiguity—not relationship or identity.
- Eligibility filters active status, language, action, situations, and intents before deterministic scoring. Selection returns at most four skills and may return zero.
- Higher-ranked skills win conflicts; score then skill ID provides a stable final tie-break. Compatibility is validated lightweight metadata, not a scoring signal or graph traversal.
- `SUGGEST_ACTIONS`, `ASK_CLARIFICATION`, and `NO_REPLY_NEEDED` select zero skills before intent is known. A selected action re-enters Phase 3 as `SUGGEST_REPLY` and can then select skills.
- Composition sends only a strict `{ principles, avoid }` guidance value across the generator boundary. Selected IDs, versions, reasons, and plan status remain inspection-only; full registry definitions never enter a provider prompt.
- Provider-facing generation uses strict action-specific root-object schemas containing wording only. The adapter parses that wording, reattaches the policy-owned action, intent, confidence, and ambiguity locally, and validates the complete internal discriminated union. Conservative lexical guards reject high-signal refusal reversals, hardened uncertainty, negative-to-positive commitments, and unsupported or dropped date/number anchors in every copyable option. These guards do not claim general semantic equivalence or complete hallucination detection; paraphrases and unbounded facts still require live human review.
- Skill engine validation failure is explicit in tests/startup. A legitimate zero-skill result safely uses Phase 3 generic generation.

## Contracts and data flow

`packages/contracts` owns strict skill definitions, context, selected references/reasons, and a bounded communication plan. `packages/skills` owns the immutable registry, referential validation, eligibility, selection, conflict handling, and composition.

```text
ConversationAnalysis + fixed Phase 3 policy
→ deterministic SkillContext
→ ACTIVE + language + action + situation + intent eligibility
→ deterministic score/order
→ conflict-free 0–4 SelectedSkill references
→ compact CommunicationPlan principles/avoid list
→ action-specific provider root-object wording schema
→ locally reattach exact policy metadata
→ unchanged validated AgentAction result
```

No screenshot, raw conversation, draft, or selected-skill history is persisted or logged. Provider generation already receives minimized structured context; Phase 4 adds only the bounded composed plan.

## Implementation steps

1. Freeze Phase 3 as a clean verified commit and create this plan.
2. Replace the unused Phase 0 skill placeholder with the approved atomic Phase 4 schemas and migrate its synthetic fixture.
3. Add the immutable initial registry plus registry validation for duplicate IDs, versions, references, active status, and self/conflict errors.
4. Add deterministic context derivation, language eligibility, candidate scoring, zero-to-four selection, conflict resolution, and normalized composition.
5. Integrate selection/composition after Phase 3 action selection and before provider wording; expose only selected IDs/versions/reasons in development inspection.
6. Add separate skill-selection fixtures, deterministic metrics, provider prompt tests, action/intent preservation tests, and live comparison readiness.
7. Update focused skills/architecture/product/privacy/provider/roadmap/README documentation and run all repository/runtime/UI checks.

## Tests and evaluation

Deterministic tests cover schema strictness/version/status; 21 valid source-controlled skills; duplicates and broken references; inactive/language/action/situation/intent filters; English/Chinese/mixed/other-language policy; zero skills; four-skill bound; deterministic repeatability; conflicts/compatibility; normalized composition; all Phase 3 actions unchanged; selections after user action; no skills for choice/clarification/no-reply; no skill invention; intent preservation; and prompt minimization.

Separate Phase 4 fixtures cover apology/mistake, status, missed commitment, boundary, emotional support, decline after selection, planning, close/no-skill, clarification/no-skill, invitation-before-choice/no-skill, Simplified/Traditional/mixed/Korean, neutral zero-skill, refusal, uncertainty, and conflicts. Metrics: expected-skill recall, allowed-skill precision, forbidden/unnecessary/conflict rates, language eligibility accuracy, bounded-set rate, and strict scenario pass rate. Live comparison additionally requires human review for intent preservation, appropriateness, clarity, unsupported facts, and tone fit.

## Acceptance criteria

- [x] Phase 3 baseline is committed and Phase 4 begins cleanly.
- [x] Strict shared skill/context/selection/plan contracts validate all runtime data.
- [x] Between 15 and 30 manually approved atomic skills exist with stable IDs and versions.
- [x] Active, universal, English, Chinese, mixed, and other-language eligibility behave as specified.
- [x] Deterministic action/situation/intent filtering selects zero to four skills repeatably.
- [x] Inactive, conflicting, forbidden, and ineligible skills are excluded.
- [x] Composition produces compact provider-neutral principles and avoidance guidance.
- [x] The explicit Phase 3 action and user intent cannot be changed by skill selection.
- [x] The existing coaching/copy UI remains functional, and retry after a user choice preserves that exact selection; structured selections are inspectable in tests/evaluation without exposing hidden reasoning.
- [x] Relationship, identity, memory, persistence, embeddings/vector DB, Skill Factory, insertion, sending, and later milestones remain absent.
- [x] Evaluation fixtures and all requested skill-selection metrics exist without claiming live quality improvement.
- [x] Formatting, lint, typecheck, deterministic tests, production build, API health, Browser QA, and practical Electron startup pass.
- [x] Post-fix live final-reply confirmation, human-reviewed provider evaluation, and Windows validation remain explicitly pending rather than being claimed as complete.

## Validation commands

```text
pnpm format
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --filter @ai-message-coach/api start
curl --fail http://127.0.0.1:3000/health
pnpm --filter @ai-message-coach/desktop start
pnpm eval:phase4
pnpm eval:phase4 -- --live --limit 6 --review-output /tmp/phase4-review.json
git diff --check
```

## Risks, rollback, and limitations

- Deterministic keywords/tags are intentionally narrow; false negatives return generic Phase 3 generation rather than forcing a skill.
- Skill metadata, prompt guidance, and bounded lexical output guards do not prove prose quality, general intent preservation, or absence of hallucinated facts. Live human-reviewed comparison remains required.
- Compatibility metadata is not a full dependency/skill graph. Catalog scale beyond this reviewed registry will require measured retrieval design.
- Rollback removes Phase 4 contracts/registry/engine/integration/evaluation additions and restores generic Phase 3 generation; there is no data migration.

## Progress log

- 2026-08-12: Read the Phase 4 brief, repository instructions, skill/architecture/product/privacy/provider/roadmap docs, Phase 2/3 plans, and existing contracts/skills/AI/fixtures.
- 2026-08-12: Re-reviewed and reverified Phase 3 at 19 files/110 tests, independently audited its 36 paths, and committed the clean baseline at `a67a36ff3202a2ee1c790b9da8ad66f2f47f624e`.
- 2026-08-12: Selected a small deterministic atomic registry design with separate Phase 4 evaluation fixtures and no relationship/identity/memory/semantic retrieval.
- 2026-08-12: Added 21 versioned `ACTIVE` atomic skills (14 universal, 3 English, 4 Chinese), deterministic zero-to-four selection/composition, conflict and no-skill behavior, compact provider guidance, and explicit `NONE` versus `FAILED` plan status.
- 2026-08-12: Added exact-ID synthetic evaluation cases and metrics for expected recall, relevance precision, forbidden/unnecessary/conflict rates, language eligibility, bounded selection, and strict scenario pass rate. Live prose-quality comparison remains pending.
- 2026-08-12: Reconciled README, architecture, product, privacy, provider, skills, roadmap, and this plan with the implemented Phase 4 boundary and explicit later-scope exclusions.
- 2026-08-12: Initial verification passed: Prettier, ESLint, workspace typecheck, 23 Vitest files/135 tests, production build, 18-case deterministic evaluation, API health, desktop/mobile Browser QA, and sustained production Electron startup. The cached Electron archive was restored into ignored `node_modules` after the package launcher attempted a blocked redownload; no tracked dependency or source changed.
- 2026-08-12: Independent final audits found and verification closed two edge cases: user-mistake tags now use speaker-owned evidence so another participant's apology is not attributed to the user, and unnecessary-skill metrics no longer penalize explicitly acceptable optional skills. Negative metric and ownership regression tests pass.
- 2026-08-12: Independent walkthrough follow-up narrowed the generator boundary to compact principles/avoid guidance and added provider-neutral deterministic guards for fixed policy metadata, explicit refusal/choice reversal, uncertainty hardening, negative commitments, and bounded date/number anchors. The guard is intentionally lexical and does not replace pending live human semantic review.
- 2026-08-12: Independent test-report fixes normalized `en-US`/`zh-Hant` routing, kept unsupported-primary code switching universal-only, deeply froze the exported approved registry, expanded the exact-ID matrix to 21 cases, gave the evaluator an independent language oracle and explicit synthetic conflict probe, and restricted `.env.local` loading to opt-in live mode.
- 2026-08-13: Post-remediation verification passed: Prettier, ESLint, workspace typecheck, 24 Vitest files/167 tests, production build, and all 21 deterministic evaluation cases with perfect strict metrics. Adversarial regressions cover negated intent phrases, speaker-owned evidence, fixed provider metadata, actual versus negated refusals, contradictory hard acceptance, polite declines, uncertainty hardening, and bounded factual anchors. API health and native UI behavior were unchanged by this non-renderer remediation.
- 2026-08-23: The user's existing local proxy enabled an authenticated API check and one successful production screenshot analysis. A subsequent live coaching request exposed two release defects: OpenAI rejected the root `oneOf` coaching schema, and retry after “Acknowledge” discarded that selection. The adapter now requests action-specific wording-only root objects and reconstructs policy metadata locally; renderer state now carries the exact selection through failure and retry. Focused and full deterministic regression coverage passes.
- 2026-08-23: Verification after the hotfix passed formatting, lint, all workspace typechecks, 24 Vitest files/172 tests, production build, all 21 deterministic Phase 4 evaluation cases, loopback API health, production-renderer Browser smoke, sustained production Electron startup, and `git diff --check`. A post-fix live paired call was attempted but failed before HTTP because the user-controlled local proxy was not running, so provider acceptance of the new schema and final-reply generation remain pending rather than claimed.

## Completion record

Phase 4 is complete locally and intentionally remains uncommitted for review. It adds a strict 21-skill registry and deterministic provider-neutral selection/composition after the committed Phase 3 action gate, without relationship, identity, memory, persistence, semantic retrieval, or Skill Factory work. The provider boundary now uses action-specific root-object wording schemas and locally owned policy metadata, and retry preserves the user's exact selected intent. Deterministic/unit/integration checks, build, API health, existing UI interaction, and practical macOS Electron startup pass. Authenticated access and one production screenshot analysis succeeded through the existing local proxy, but the post-fix final-reply call could not reach OpenAI when that proxy was no longer running. Final live generation, human-reviewed Phase 3-generic-versus-Phase 4-skill-guided calibration, and Windows DPI/multi-monitor capture validation remain pending; no generation-quality improvement is claimed.
