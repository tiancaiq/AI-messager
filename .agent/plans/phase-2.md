# Phase 2 — Screenshot Conversation Understanding

Status: implemented — live provider evaluation pending
Owner: Codex
Started: 2026-08-11
Updated: 2026-08-12
Roadmap milestone: [Phase 2 — Screenshot conversation understanding](../../docs/roadmap.md#phase-2--screenshot-conversation-understanding)

## Outcome

Continue from the Phase 1 crop preview into one provider-neutral, vision-capable analysis request that returns validated structured observations: visible messages and order, USER/OTHER/UNKNOWN ownership, compose-box draft, visible participant/contact signals, language/script/code-switching, warnings, and per-dimension model-estimated confidence. The renderer presents a simple extraction-verification result. Phase 2 does not generate, rewrite, complete, recommend, clarify, select skills, or predict relationships.

## Scope

In scope:

- strict Zod-first conversation-analysis, image-request, capability, provider-status, error, and IPC result contracts;
- a task-specific provider-neutral `ConversationImageAnalyzer` boundary in `packages/ai`;
- capability preflight for vision, text generation, and structured output;
- one isolated OpenAI Responses API adapter using image input and strict structured output;
- development-only BYOK access from trusted Electron main through `OPENAI_API_KEY`, with only configured/model/capability status exposed to the renderer;
- direct trusted desktop-to-provider requests; `apps/api` remains outside the screenshot path;
- the existing Phase 1 crop as the only image input, retained only through an active request/retry and then released;
- explicit analysis loading, result, sanitized error, retry, cancel, and recapture states;
- deterministic schemas, capability checks, request construction, provider normalization/error mapping, state transitions, cleanup boundaries, and fixture tests;
- a growable set of at least 50 synthetic renderable scenarios and an opt-in live-evaluation harness;
- focused documentation of the implemented boundary, confidence semantics, language behavior, privacy lifecycle, provider choice, and evaluation limits.

Out of scope:

- relationship prediction, relationship category/role output, relationship advice, relationship memory, or relationship confidence;
- situation/intent prediction, emotional-state advice, user-goal inference, coaching policy, `AgentAction`, response strategy, skill routing, Skill Factory, clarification questions, reply generation, rewriting, completion, actions, or no-reply decisions;
- identity resolution against contacts/history, avatar recognition, memory, storage, PostgreSQL, pgvector, screenshot history, automatic region detection, remembered regions, insertion, sending, iOS, keyboard integration, additional providers, multi-model routing, or Phase 3 work.

Relationship-like fields are forbidden at the contract boundary. Strict schemas and provider instructions must reject or omit `relationship`, role guesses such as manager/friend/partner, and advice derived from them.

## Current state

- Phase 0/1 are committed in `ae31aba`; the worktree is clean and tracks `origin/main`.
- All baseline gates pass: formatting, lint, typecheck, 10 test files/45 tests, and production build.
- Phase 1 capture now continues vertically into Phase 2: `CropPreviewResource` retains the selected crop Blob through analysis/retry, and Continue invokes the fixed analysis bridge without recapture.
- Electron main owns capture behind an authorized fixed IPC handler; preload exposes only frozen metadata and one fixed capture method; the sandboxed renderer has no Node/Electron access.
- `packages/contracts` owns the strict Phase 2 boundary. `packages/ai` now owns the provider-neutral analyzer, observation-only prompt, capability preflight, and isolated OpenAI adapter.
- `apps/api` exposes only loopback health and does not need to proxy provider traffic.
- No provider SDK is installed. Node/Electron provides `fetch`, so the first adapter can stay dependency-light and isolate the OpenAI wire shape without leaking SDK types.
- A user-approved OpenAI project key exists only in ignored local `.env.local`; no key is tracked or available to the renderer.
- Official OpenAI documentation confirms that current GPT models accept image input through the Responses API and that strict structured output is requested with `text.format.type = "json_schema"`.

## Assumptions and decisions

- The approved Phase 2 request supersedes the older roadmap text that bundled coaching, relationship inference, skills, and reply behavior into Phase 2. Documentation will be reconciled before completion.
- OpenAI is the sole development provider. The default model is `gpt-5.6-luna` because the current official model catalog declares vision and structured-output support and positions it for cost-sensitive workloads; `OPENAI_VISION_MODEL` may override the model for explicit evaluation without changing core behavior.
- Use direct HTTPS from trusted Electron main to `https://api.openai.com/v1/responses`. The Fastify API receives neither crop nor key.
- Use native `fetch` rather than an SDK. The adapter owns Authorization, OpenAI request/response types, response-text extraction, timeout, and error mapping; provider-neutral code imports no OpenAI type.
- Use one request with `store: false`, one PNG data URL, observation-only instructions, and strict JSON Schema. No repair call is made; malformed/refused/incomplete output becomes a recoverable normalized error.
- Confidence values are model estimates in `[0,1]`, not calibrated probabilities. Message text, speaker assignment, draft, visible contact, language, and overall extraction keep separate confidence values.
- The contract contains no relationship, situation, intent, skill, response, or action field. Strict additional-property rejection makes accidental provider expansion fail safely.
- The crop request is bounded to PNG, positive dimensions, and 20 MiB encoded bytes before transmission. Phase 1's full display image never crosses the provider boundary.
- The crop Blob remains available only during preview, an active analysis, or an explicit retry after failure. Success, Cancel, recapture, reload, and unmount revoke its URL and release the Blob reference. Temporary byte copies are zeroed after IPC resolves.
- `.env.local` is a development credential mechanism, not production storage. The development/start helpers load it into the Electron main environment. OS-protected save/replace/delete UI remains a Phase 3 requirement.
- Synthetic fixture definitions are source-controlled, but real conversations and captured user screenshots are prohibited. Live evaluation is opt-in, credentialed, and outside default tests.

## Contracts and data flow

`packages/contracts` will own:

- `ConversationAnalysisSchema`: ordered extracted messages; separate text/speaker confidence; draft; visible participants/contact; language/script/code-switching; summary; warnings; overall extraction confidence;
- `ConversationImageRequestSchema`: bounded PNG bytes and actual crop dimensions;
- `ModelCapabilitiesSchema` and safe `ProviderConfigurationSchema`;
- normalized `AiProviderErrorCodeSchema`, safe error, and discriminated analysis result;
- one fixed analysis IPC channel.

Flow:

```text
Phase 1 PREVIEW crop Blob
→ Continue / renderer enters ANALYZING
→ renderer copies crop to bounded Uint8Array
→ fixed preload method validates request and invokes one channel
→ main authorizes owned window + main frame and rejects overlap
→ main reads the development key without serializing it
→ provider-neutral capability preflight
→ isolated OpenAI adapter builds one store:false Responses request
→ selected crop only crosses TLS directly to OpenAI
→ adapter extracts response text and validates strict shared schema
→ main/preload validate the safe result envelope
→ renderer zeroes request bytes and releases crop after success
→ RESULT renders observations only
```

On normalized failure, the renderer keeps the crop only for explicit retry in the same UI session. Cancel, recapture, reload, or unmount releases it. No crop, base64 value, message, draft, contact value, prompt, response body, or credential is logged or persisted.

## Implementation steps

1. Reconcile the Phase 2 roadmap boundary and create this plan with relationship prediction explicitly prohibited.
2. Add strict observation-only analysis/request/provider/error schemas in `packages/contracts`, export them, and test valid, invalid, extra-field, confidence, order, language, and binary bounds.
3. Add 50+ synthetic renderable conversation-understanding scenarios in `packages/test-fixtures`, including English, Simplified/Traditional Chinese, mixed language, other languages, drafts/no drafts, ambiguous speakers, group chats, themes, emojis, and edge cases—without relationship labels.
4. Add provider-neutral capability preflight and analyzer orchestration in `packages/ai`, then one OpenAI adapter owning request construction, strict schema conversion, response parsing, timeout, refusal/incomplete handling, and safe error mapping.
5. Add a main-process analysis service, authorized single-flight IPC handler, dev credential/model loader, safe provider status, and narrow preload methods. Keep the key and provider wire types out of renderer/contracts.
6. Extend the Phase 1 reducer and renderer so preview retains the crop Blob through Continue, shows analyzing/result/error states, supports retry/cancel/recapture, renders structured observations, and deterministically releases image resources.
7. Add an opt-in Electron-based synthetic fixture renderer/live-evaluation harness and document metrics without placing credentials, raw outputs, or private images in the repository.
8. Update README, architecture, privacy, provider, product-behavior, and roadmap documents only where the Phase 2 boundary or implemented lifecycle materially changes them.
9. Run formatting, lint, typecheck, deterministic tests, build, API health, browser QA, production Electron QA, synthetic live-provider evaluation, privacy/source inspection, and acceptance review.

## Tests and evaluation

Deterministic tests cover:

- strict analysis schema validity, order, confidence bounds, nullable draft/contact fields, languages/scripts, warnings, and rejection of relationship/action/response fields;
- image MIME/byte/dimension limits and safe IPC envelopes;
- capability preflight before provider invocation;
- exact OpenAI request shape: one crop, observation-only prompt, `store: false`, strict JSON Schema, configured model, and no relationship field;
- output extraction and Zod validation; refusal, incomplete output, malformed JSON, timeout, HTTP status, and provider error mapping;
- analysis single-flight behavior and not-configured behavior;
- PREVIEW→ANALYZING→RESULT, retryable analysis error, duplicate Continue no-op, Cancel, recapture, and crop cleanup;
- at least 50 synthetic scenario definitions covering requested language/layout/draft/contact categories.

Live evaluation is opt-in and reports aggregate/scenario pass information for message text/order, speaker, draft, contact, language, and schema validity. It must not log image/base64 payloads, API keys, or unredacted provider bodies. A small representative subset is the completion gate; the harness can run the full fixture set later for calibration.

Runtime QA flow:

`Generate → capture → select → Preview → Continue → Analyzing conversation… → structured Conversation detected result`, plus credential error/retry, duplicate Continue, recapture, viewport/console/security inspection, and Phase 1 regression.

## Acceptance criteria

- [x] The existing Phase 1 crop is passed directly into analysis without recapture.
- [x] Core conversation-understanding logic is provider-neutral and imports no provider SDK/wire type.
- [ ] One OpenAI vision adapter works through direct trusted desktop-to-provider HTTPS. Deterministic wire tests pass; live verification is blocked by this host's outbound connection timeout before an HTTP response.
- [x] The key remains in trusted Electron main and only configured/model/capability status reaches the renderer.
- [x] Visible messages, explicit order, USER/OTHER/UNKNOWN, draft/no-draft, visible contact observations, language/script/code-switching, warnings, and independent confidence values are validated.
- [x] Relationship prediction, relationship advice, relationship memory, role labels, situation/intent, coaching actions, skills, and response generation are absent and rejected at strict boundaries.
- [x] Unsupported model capability fails before image transmission.
- [x] Invalid/refused/incomplete provider results and provider failures become safe recoverable errors.
- [x] Duplicate analysis requests cannot overlap and analysis failure returns to a usable retry/cancel state.
- [x] Only the selected crop crosses the provider boundary; screenshots are not persisted or logged.
- [x] Crop buffers/URLs are released on success, cancel, recapture, reload, unmount, and terminal failure as applicable.
- [x] A simple extraction/debug result UI exists and performs no coaching.
- [x] Default tests use no key/network and cover 52 synthetic scenarios.
- [ ] Representative synthetic live-provider evaluation is completed without claiming perfect extraction.
- [x] Phase 0/1 deterministic tests, API health, browser flow, production Electron startup, Electron security source review, formatting, lint, typecheck, tests, and production build pass.
- [x] Windows capture validation remains explicitly open rather than inferred.

## Validation commands

```text
pnpm format
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev:api
curl http://127.0.0.1:3000/health
pnpm dev:desktop
pnpm eval:phase2 -- --limit 6
```

Source/bundle review additionally checks for renderer Electron imports, provider calls outside the adapter, relationship fields in Phase 2 contracts/prompts/UI/fixtures, credential serialization/logging, screenshot persistence/logging, and accidental Fastify screenshot routing.

## Risks, rollback, and limitations

- Model-estimated confidence is not calibrated probability; future evaluation must measure reliability before confidence drives coaching decisions.
- Screenshot UI variation, low resolution, occlusion, unusual bubble layouts, and dense group chats can cause extraction errors. UNKNOWN and warnings are required instead of forced guesses.
- A strict schema prevents malformed downstream data but cannot prove extracted text is correct. Live evaluation remains necessary and results are model/version dependent.
- Base64 encoding temporarily amplifies the selected crop inside trusted main memory. It is request-scoped, never logged, and released after `fetch` completes.
- Development `.env.local` is not production credential storage. Phase 3 must add OS-protected lifecycle controls before distribution.
- OpenAI receives the selected crop directly and bills the user project. Provider retention/data controls must be reviewed before production use.
- Windows, mixed-DPI, multi-monitor, and packaged-app capture remain unverified release follow-ups from Phase 1.
- Rollback removes Phase 2 schemas/AI/service/UI/eval additions and restores PREVIEW→READY. There is no database, persisted screenshot, migration, or application-server content path.

## Progress log

- 2026-08-11: Read the approved Phase 2 request, repository instructions, README, architecture, product behavior, privacy, roadmap, provider document, Phase 0 plan, completed Phase 1 plan, implementation, tests, and clean Git state.
- 2026-08-11: User explicitly removed relationship prediction from Phase 2. Recorded relationship, situation, intent, coaching, skills, and response behavior as forbidden output rather than deferred optional fields.
- 2026-08-11: User approved secure creation of an OpenAI project key. The key was written only to ignored `.env.local` as `OPENAI_API_KEY` without appearing in tool output.
- 2026-08-11: Official OpenAI documentation verified Responses API image inputs and strict `text.format` JSON Schema. Selected direct trusted-main topology and a dependency-light isolated adapter.
- 2026-08-11: Baseline formatting, lint, typecheck, 10 files/45 tests, and production build pass on clean `main` at `ae31aba`.
- 2026-08-11: Added strict conversation-analysis/request/provider/error contracts, 52 synthetic renderable fixtures, provider-neutral capability preflight, one native-fetch OpenAI Responses adapter, and safe error normalization. Focused request/output tests include relationship-like extra-field rejection.
- 2026-08-11: Added authorized single-flight analysis IPC, safe provider-status IPC, main-only development key loading, exact-crop handoff, byte zeroing/object-URL cleanup, retry/error/result states, and an observation-only extraction UI.
- 2026-08-11: Reconciled roadmap, README, architecture, privacy, provider, and product behavior docs so Phase 2 ends at screenshot understanding and Phase 3 owns coaching. Relationship prediction is explicitly absent from Phase 2.
- 2026-08-11: Final local gates pass: Prettier, ESLint, all workspace typechecks, 14 test files/71 tests, production build, `git diff --check`, and loopback `/health`. Browser QA passed at desktop and 390×844 viewports with the safe missing-bridge error path and no console warnings/errors.
- 2026-08-11: Opt-in live evaluation rasterizes synthetic SVGs to temporary PNGs, removes the temporary directory, and logs only scenario IDs/aggregate checks. The current host timed out connecting to `api.openai.com:443` even in an approved unsandboxed credential-free curl check, so no HTTP response, authentication result, quota result, model-access result, or valid live extraction was obtained.
- 2026-08-11: Recovered the Electron 43.3.0 app bundle from its checksum-verified local cache after the network installer stalled, confirmed `electron --version`, and completed a clean production-shell startup smoke before stopping it with SIGINT.
- 2026-08-12: Re-reviewed the complete Phase 2 diff against `ae31abaa3470d13e3f31d0ac767d9f2d6e5a9e6b` and confirmed it remains observation-only. Re-ran formatting, lint, typecheck, 14 test files/71 tests, production build, API health, Electron 43.3.0 production startup, and desktop/mobile renderer QA; all local checks pass. Live OpenAI evaluation and controlled Windows validation remain pending as documented.

## Completion record

Phase 2 is implemented as the observation-only repository baseline. Deterministic/unit/integration verification, local UI/runtime verification, API health, and production startup pass. Live extraction quality is not verified because outbound `api.openai.com:443` times out before HTTP on this host. No key, image, prompt, extracted text, or provider response was logged; the attempted synthetic requests failed at transport. Re-run `pnpm eval:phase2 -- --limit 6` from a host that can reach the API and record the representative fixture results before marking live provider evaluation complete. Windows DPI/multi-monitor/capture-exclusion validation remains a separate pending release follow-up.
