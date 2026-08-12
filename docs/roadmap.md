# Roadmap

## Milestone discipline

This roadmap is sequential. Begin a milestone only when the previous milestone's acceptance criteria pass and the next milestone has an approved execution plan where `.agent/PLANS.md` requires one.

Do not pull future infrastructure into an earlier phase for convenience. A small interface at a real call site is enough to preserve a future seam. Each milestone ends with lint, typecheck, tests, build, acceptance review, documentation updates, and a completion report.

## Capture UX direction

Generate-triggered context capture is the primary product flow. A global shortcut is an optional alternative trigger, not the architectural owner of capture. Every trigger must call one reusable conversation-capture capability.

The capability should evolve only through approved milestones and validated needs:

```text
Capture foundation
→ Generate-triggered capture
→ manual crop setup/fallback
→ remembered confirmed region
→ active-window awareness
→ automatic conversation-region detection
→ one-click Generate experience
```

This sequence records product direction, not permission to implement later stages early. Manual crop is acceptable for the first working capture flow but is not the intended long-term central workflow. Region coordinates may eventually be stored as resettable local configuration; screenshot pixels and conversation content remain ephemeral by default.

## LLM provider direction

AI Message Coach uses a bring-your-own-key product model. Core coaching behavior depends on provider-neutral contracts, each provider integration lives behind an adapter, and model support is determined by capabilities rather than provider name. Users select a supported provider/model, supply their own credential, and pay that provider directly.

Provider work should evolve through approved milestones:

```text
provider-neutral contracts and capability requirements at real call sites
→ first vision-capable provider adapter with capability checks
→ minimal BYOK settings and secure credential storage
→ second major provider
→ third major provider
→ optional compatible/local endpoints
```

The first user experience may use one provider/model for supported tasks. Per-task vision/text/embedding configuration remains deferred until measured need. Direct encrypted desktop-to-provider requests are preferred for private conversation analysis when practical; a server-mediated path must justify the additional trust boundary. See `docs/llm-providers.md`.

## Foundation — architecture documentation (complete)

**Outcome:** establish shared product rules, architecture boundaries, privacy posture, and implementation gates before application code.

**Deliverables:** `AGENTS.md`, `README.md`, `.agent/PLANS.md`, and the product, architecture, skills, memory, privacy, and roadmap documents.

**Acceptance criteria:**

- The central infer/generate/choices/ask policy is unambiguous.
- MVP and deferred scope are explicit.
- Desktop, API, contract, AI, skill, memory, and Skill Factory responsibilities do not overlap.
- Confidence, language, identity, temporal-memory, and screenshot-lifecycle rules are recorded.
- BYOK, provider-neutral contracts, capability checks, credential security, and request-topology principles are recorded.
- A minimal monorepo is proposed without application scaffolding.
- Phase 0 has observable acceptance criteria.

This milestone stops before Phase 0 implementation.

## Phase 0 — repository and contract skeleton (complete)

**Outcome:** a minimal, reproducible TypeScript monorepo with enforceable boundaries and shared domain contracts, but no product feature implementation.

**In scope:**

- choose and document the workspace package manager and supported Node.js version;
- root workspace configuration with canonical `lint`, `typecheck`, `test`, and `build` commands;
- minimal `apps/desktop`, `apps/api`, `packages/contracts`, `packages/ai`, and `packages/skills` packages only where required to prove dependency direction;
- strict TypeScript configuration and formatting/lint policy;
- Zod schemas for `AgentAction`, observations, independent confidence hypotheses, coach results, errors, and initial skill definitions;
- a tiny synthetic contract fixture and schema tests;
- ignored local environment-file convention, with placeholders only.

**Out of scope:** Electron capture UI, Fastify coaching routes, LLM provider calls/adapters, prompts, production skills, storage, memory, databases, and deployment.

**Acceptance criteria:**

- A clean checkout can install dependencies using the committed lockfile and documented tool versions.
- Root lint, typecheck, test, and build commands pass.
- Package dependencies follow the implemented Phase 0 direction, and future provider composition is not coupled exclusively to the API service.
- All cross-boundary domain values are validated by Zod; TypeScript types are inferred rather than duplicated.
- Tests prove valid and invalid action/confidence/result examples.
- No real user data, credential, model call, or speculative database exists.

Completed on 2026-08-10. See the [Phase 0 execution plan](../.agent/plans/phase-0.md) for implementation decisions and acceptance evidence.

## Phase 1 — Generate-triggered desktop capture foundation

**Outcome:** the user clicks Generate, Message Coach hides, captures the display containing its window, restores itself, lets the user drag-select the conversation region, previews the crop, and can Retake, Cancel, press Escape, or Continue to a local placeholder without any AI or network request.

**In scope:** one reusable conversation-capture capability; primary Generate trigger; main-process single-flight protection; hide/settle/capture/finally-restore lifecycle; current-display metadata; one allowlisted typed IPC method; local four-direction selection; pure scaling/clamping geometry; in-memory Canvas crop; preview and recoverable errors; buffer/object-URL disposal; deterministic and native runtime checks.

**Out of scope:** provider/model integration, screenshot understanding, OCR, coaching policy, skills, memory, region persistence, active-window semantics, automatic region detection, global shortcuts, insertion, sending, app-specific integrations, iOS, and native capture-exclusion modules.

**Acceptance criteria:**

- Generate and Retake request the same internal capture workflow; overlapping requests are rejected.
- Every visible coach window is hidden before capture and restored after success or failure.
- The coach is absent from the captured image on supported/tested native platforms.
- All four drag directions, boundary clamping, actual CSS-to-pixel scaling, invalid selections, exact preview, Retake, Cancel, Escape, and Continue work.
- Continue shows `Capture ready for analysis.` and performs no provider or application-network request.
- Screenshots are never persisted or logged; all image references are released at the end of the active flow.
- Renderer Node integration remains disabled; context isolation/sandboxing remain enabled; the narrow bridge and IPC results are runtime validated.
- Formatting, lint, typecheck, deterministic tests, build, API health, production renderer startup, and native capture checks pass.
- Windows 100%/125% scaling and a second-monitor baseline are documented and controlled-test verified before Windows release signoff.

Implementation landed on 2026-08-10 and native macOS signoff completed on 2026-08-11. Automated tests, the synthetic production-renderer flow, the real permission-failure/restoration path, and three real 2×-scale capture/exclusion/restoration cycles pass. Windows DPI and multi-monitor acceptance remains a target-platform follow-up before Windows release signoff. See the [Phase 1 execution plan](../.agent/plans/phase-1.md).

## Phase 2 — screenshot conversation understanding

**Outcome:** pass the existing selected crop to one provider-neutral, vision-capable analysis task and return a validated observation-only conversation context.

**In scope:** visible message text and order; `USER`/`OTHER`/`UNKNOWN` ownership; compose-box draft/no-draft; visible contact and participant signals; language, Chinese script, and code-switching; independent extraction confidence and warnings; bounded PNG validation; provider capability preflight; one isolated OpenAI Responses adapter; direct trusted desktop-to-provider transport; safe provider status; loading/result/retry/cancel/recapture UI; synthetic fixtures; and opt-in live evaluation.

**Out of scope:** relationship prediction or roles; situation, intent, emotion, coaching actions, clarification, reply generation, rewriting, completion, skills, memory, identity matching, persistent provider settings/credential storage, additional adapters, multi-model routing, automatic region detection, insertion, and sending.

**Acceptance criteria:**

- The selected Phase 1 crop reaches analysis without recapture, while the full-display capture never crosses the provider boundary.
- Provider-neutral schemas validate visible messages/order/ownership, draft, contact signals, language/script/code-switching, warnings, and independent confidence values.
- Relationship-like, decision, skill, and response fields are absent and rejected by strict schemas.
- The first adapter is isolated; provider wire types and credentials never enter renderer or core contracts.
- Screenshot tasks require vision, text-generation, and structured-output capabilities and fail before transmission when unsupported.
- Invalid output and provider failures are normalized into safe recoverable states; overlapping requests are suppressed.
- Screenshots are not persisted or logged, temporary bytes are zeroed, and crop URLs/references are released after success, cancel, recapture, reload, or unmount.
- Default tests require no credential and cover at least 50 synthetic scenarios; live evaluation is explicit and reports limitations.

See the [Phase 2 execution plan](../.agent/plans/phase-2.md).

Implementation, deterministic verification, local UI/runtime verification, API health, and production startup are complete. Live OpenAI extraction evaluation remains pending because the current host cannot reach `api.openai.com:443`; Windows DPI, multi-monitor, and capture-exclusion validation remains a separate release follow-up. Live extraction quality is not yet verified.

## Phase 3 — deterministic coaching policy and secure BYOK MVP

**Outcome:** consume the validated Phase 2 context to decide whether to rewrite, complete, suggest a reply, offer action choices, ask one necessary clarification, or recommend no reply, then present an editable result without automatic sending.

**In scope:** observation/inference/decision separation; draft-aware deterministic action policy; clarification gate; provider-neutral response task; small approved skill registry; language eligibility; one-call normal path; minimal provider/model settings; OS-protected credentials where practical; connection testing; response/action/clarification/no-reply UI; editable result and copy; representative English/Chinese evaluation; packaging for controlled Windows testing; and end-to-end privacy/failure review.

**Out of scope:** relationship prediction unless separately proposed and approved, additional providers, multiple simultaneous task models, custom/local endpoints, durable personal/contact memory, identity recognition, insertion/sending, app-specific integrations, vector databases, iOS, and Skill Factory.

**Acceptance criteria:**

- Validated Phase 2 context drives every `AgentAction` and its material decision boundaries without re-extracting the screenshot.
- Clear contexts do not ask unnecessary questions; at most one clarification is reserved for materially divergent low-confidence paths.
- Draft-aware, empty-draft, action-choice, clarification, and no-reply flows satisfy the behavior matrix.
- The user can configure the supported provider/model with their own credential and understand capabilities and billing.
- Stored credentials remain OS-protected where practical, never return to the renderer, and never appear in logs or plaintext settings.
- A user can review, edit, and copy a result; no screenshot is persisted and the coach never sends automatically.
- Lint, typecheck, unit/integration/e2e tests, build, packaging, and controlled Windows acceptance checks pass.

Completion of Phase 3 is the MVP decision point: assess whether users can get context-aware help without explaining the conversation before expanding scope.

## Post-MVP milestones (not approved for implementation)

Order these only after MVP evidence identifies the need:

1. **Evaluation and calibration hardening** — larger reviewed datasets, confidence calibration, regression tracking, and prompt/model version comparisons.
2. **Additional providers and advanced routing** — second and third major adapters, shared conformance tests, then optional compatible/local endpoints and per-task model selection only where measured needs justify them.
3. **Generate capture automation** — remembered confirmed regions with reset controls, followed by active-window awareness and automatic conversation-region detection only as evaluation justifies each step.
4. **User-controlled memory** — user preferences first; candidate/confirmation/staleness controls; deletion; encrypted durable storage.
5. **Conservative contact identity and memory** — multi-signal local-first matching, very-high-confidence gate, ambiguity UI, and temporal role handling.
6. **Large-catalog skill retrieval** — hybrid/semantic retrieval and pgvector only after measured scale or relevance failures warrant it.
7. **Skill Factory** — offline generation, deduplication, evaluation, approval, versioning, and deprecation workflow.
8. **Optional explicit insertion** — only after a separate safety review; still no automatic send.
9. **iOS client** — SwiftUI app and Share Extension, followed later by a UIKit custom keyboard if platform constraints and user value justify it.

App-specific messaging integrations and automatic sending remain outside the plan unless the product strategy is explicitly revised; automatic sending requires changing a foundational product invariant.

## Next recommended work

Complete and evaluate Phase 2 screenshot conversation understanding without adding coaching or relationship prediction. Then prepare an approved Phase 3 plan for deterministic coaching policy and production-grade secure BYOK settings. Separately, run controlled Windows checks at 100% and 125% scaling with a second monitor where available before Windows release signoff.
