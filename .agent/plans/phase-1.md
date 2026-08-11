# Phase 1 — Generate-Triggered Desktop Capture Foundation

Status: complete
Owner: Codex
Started: 2026-08-10
Updated: 2026-08-11
Roadmap milestone: [Phase 1 — Generate-triggered desktop capture foundation](../../docs/roadmap.md#phase-1--generate-triggered-desktop-capture-foundation), explicitly resequenced by the approved milestone request.
Platform note: native acceptance passed on the available macOS 26.5.1 host at 2× display scale. Controlled Windows scaling/multi-monitor verification remains a documented target-platform follow-up because no Windows host is available in this environment.

## Outcome

Deliver the first real desktop workflow: the user clicks **Generate**, Message Coach hides, captures the display containing the coach window, restores itself, lets the user drag-select a conversation region, previews the crop, and can retake, cancel, or continue to the local placeholder `Capture ready for analysis.` No AI or network request is made.

## Scope

In scope:

- one reusable Electron conversation-capture capability called by Generate;
- duplicate-request protection in both the renderer flow and trusted main process;
- hide-before-capture, a single encapsulated compositor-settle delay, capture, and finally-style restoration;
- a narrow typed preload bridge and Zod-validated IPC results;
- current coach-display selection and preservation of source/display metadata;
- in-memory PNG handoff, local drag selection, pure coordinate conversion, canvas crop, preview, retake, cancel, Escape, ready, and recoverable error states;
- deterministic contract, geometry, state-transition, and renderer-shell tests;
- native Electron/runtime, renderer, API-health, privacy, and Phase 0 regression verification;
- focused documentation of lifecycle, scaling, limitations, and future remembered-region compatibility.

Out of scope:

- every AI provider, model call, prompt, OCR, screenshot understanding, conversation extraction, coaching policy, skills, memory, identity, language analysis, persistence, automatic region detection, active-window semantics, remembered regions, keyboard/global shortcuts, insertion, sending, app-specific integration, iOS, and platform-native capture-exclusion modules.

This milestone supersedes the old roadmap label “Phase 1 — deterministic coaching policy.” The approved next milestone is provider-neutral screenshot understanding/AI integration, but none of that work is included here.

## Current state

- Phase 0 is complete and all 17 existing tests, formatting, lint, and typecheck pass before Phase 1 edits.
- `apps/desktop/src/main/index.ts` creates one sandboxed `BrowserWindow` with `contextIsolation: true`, `nodeIntegration: false`, navigation denial, and no capture IPC.
- `apps/desktop/src/preload/index.ts` exposes only schema-validated immutable app metadata through `contextBridge`.
- `apps/desktop/src/renderer/App.tsx` renders only the product heading; renderer tests use deterministic server rendering with no DOM-test dependency.
- `packages/contracts` is the Zod-first cross-process contract source.
- The repository has no commits on `main`; every Phase 0 file is currently untracked. This milestone will not commit, push, or restructure Git.
- No Playwright dependency/configuration exists in the repository, and Playwright Interactive's unrestricted runtime precondition is unavailable. The in-app Browser verified the Vite renderer; local Chrome DevTools Protocol input drove the production Electron renderer and a temporary synthetic-image harness without adding a project dependency.

## Assumptions and decisions

- The explicit milestone request is authoritative over the older roadmap sequence. Relevant roadmap/README/architecture status text will be aligned without implementing later work.
- “Current display” means the Electron display that contains the coach window when Generate is clicked. This is deterministic and matches the primary same-display workflow; active-window/chat-app discovery is deferred.
- The main process requests only screen sources, matches `DesktopCapturerSource.display_id` to `Display.id`, and uses the sole source only when exactly one exists. With multiple unmatched sources it fails safely rather than capture the wrong display.
- Capture resolution is requested from the display’s device-independent size multiplied by `scaleFactor`, but the returned `NativeImage` pixel size is authoritative because Electron does not guarantee the requested thumbnail size.
- All currently visible Message Coach windows are hidden. One private helper owns the short compositor-settle delay so timing is documented and not scattered. Previously visible windows are restored in `finally`, including failures.
- Main returns an allowlisted discriminated result instead of exposing raw Electron errors. IPC sender validation limits requests to the known main frame.
- PNG bytes cross only the trusted main → preload → renderer boundary, never disk/network. The renderer immediately converts bytes to a `Blob` URL. Full-capture and crop URLs are revoked and references cleared on crop completion, cancel, continue, retry, error replacement, reload, or unmount where applicable.
- Cropping uses the browser canvas already present in Chromium; no image-processing dependency is necessary.
- A reducer owns the explicit capture state. Pure geometry owns normalization, four-direction drag behavior, image-contain offsets, clamping, minimum size, and CSS-to-source-pixel scaling; React handlers only collect interaction input.
- A valid selection crops immediately on pointer release. An invalid/small selection remains in selection mode with a user-safe prompt.
- Windows is the target product platform, but this environment is macOS. Native behavior will be verified on the available host and the missing Windows/mixed-DPI acceptance pass will be documented, not guessed.

## Contracts and data flow

`packages/contracts` will add strict schemas and inferred types for:

- capture display/source metadata: string display/source identifiers, DIP bounds, display scale factor, and actual image pixel size;
- an in-memory PNG capture with byte payload and dimensions;
- safe capture error codes/messages;
- a success/failure capture result envelope;
- the single allowlisted IPC channel name shared by main and preload.

Flow:

```text
Generate
→ renderer reducer enters CAPTURING
→ preload invokes one fixed IPC channel with no renderer-controlled arguments
→ main validates sender and rejects overlap
→ remember target display + visible coach windows
→ hide visible coach windows
→ wait one encapsulated compositor-settle interval
→ capture/match current screen source in memory
→ restore visible coach windows in finally
→ preload validates the returned result schema
→ renderer creates a revocable Blob URL and enters SELECTING
→ pointer selection is normalized/clamped/scaled by pure geometry
→ canvas produces an in-memory crop Blob and original URL is revoked
→ PREVIEW → Retake, Cancel, or Continue
→ Continue revokes the crop and shows READY placeholder
```

No screenshot, data URL, transcript, or draft is logged, persisted, uploaded, sent to `apps/api`, or included in telemetry. There is no temporary-file path.

## Implementation steps

1. Add capture schemas/types/channel constant and boundary tests in `packages/contracts`.
2. Add `apps/desktop/src/main/conversation-capture.ts` for source selection, hide/settle/capture/restore, overlap protection, safe results, and display metadata; register only its allowlisted handler from `main/index.ts` and validate the sender.
3. Extend `preload/index.ts` and `renderer/env.d.ts` with exactly one typed `requestConversationCapture()` method that validates results and does not expose `ipcRenderer`.
4. Add pure renderer `capture-geometry.ts` and `capture-state.ts` modules with exhaustive deterministic tests.
5. Replace the placeholder renderer with the smallest Generate/select/preview/error/ready vertical slice, using object-URL cleanup and canvas cropping; update styles/CSP only as needed.
6. Add/adjust renderer shell tests without adding a new test framework unless a real coverage gap requires it.
7. Align `README.md`, `docs/architecture.md`, `docs/privacy.md`, `docs/roadmap.md`, and this plan with implemented lifecycle and milestone sequence where materially affected.
8. Run format, lint, typecheck, deterministic tests, clean build, API health, renderer QA, repeated native Electron capture flows, failure/restoration checks where safely inducible, security checks, and artifact/privacy inspection.

## Tests and evaluation

Deterministic tests will cover:

- capture contract success/failure validation, strictness, byte payloads, dimensions, scale factor, and safe errors;
- top-left→bottom-right, bottom-right→top-left, bottom-left→top-right, and top-right→bottom-left drag normalization;
- bounds/letterbox clamping, source-pixel scaling, 2× device-pixel conversion, and invalid/too-small selection rejection;
- IDLE→CAPTURING→SELECTING→PREVIEW→READY;
- PREVIEW→CAPTURING retake;
- SELECTING/PREVIEW→IDLE cancel;
- capture failure→ERROR and ERROR→CAPTURING/IDLE recovery;
- duplicate Generate while capturing is a no-op;
- initial renderer shell still exposes the product name and Generate control.

Runtime QA inventory:

- initial window identity/layout/security settings;
- Generate hide/capture/restore/select flow and absence of coach pixels in the captured image;
- four drag directions, exact preview, invalid selection, Retake, Cancel, Escape, Continue;
- repeat/duplicate requests, app responsiveness, and safe restoration on a practical failure path;
- no renderer console errors/framework overlay, no viewport clipping, and no unexpected network request;
- API `/health` and complete Phase 0 regression suite.

Exploratory cases include rapid repeated Generate clicks and selections beginning/ending outside the contained image bounds.

## Acceptance criteria

- [x] Generate triggers capture through the reusable capability.
- [x] Duplicate Generate clicks cannot start overlapping capture workflows.
- [x] Message Coach hides before capture and is absent from the captured image.
- [x] Previously visible Message Coach UI restores after success.
- [x] Previously visible Message Coach UI restores after failure.
- [x] The user can select a rectangular region in all four drag directions.
- [x] Coordinates are normalized, clamped, and correct for the tested display/scaling configuration.
- [x] Invalid/too-small selections are rejected without leaving selection mode.
- [x] Preview matches the selected pixels.
- [x] Retake performs a fresh capture request cycle.
- [x] Cancel works from selection and preview.
- [x] Escape cancels the active capture flow.
- [x] Continue shows `Capture ready for analysis.` and makes no AI/network call.
- [x] Screenshots remain ephemeral and are not written to disk or logged.
- [x] Main, preload, renderer, and contract responsibilities remain separated.
- [x] Renderer imports no Electron/Node API and receives no unrestricted IPC primitive.
- [x] Context isolation, disabled Node integration, and sandboxing remain enabled.
- [x] Capture contracts and relevant IPC results are runtime validated.
- [x] Relevant automated tests pass without weakening the 17 Phase 0 tests.
- [x] Formatting, lint, typecheck, and build pass.
- [x] API health and desktop startup regressions pass.
- [x] Native runtime verification is completed on the available macOS host.
- [x] Windows and mixed-DPI/multi-monitor gaps are explicitly documented if unavailable.
- [x] No Phase 2 AI/provider behavior is present.

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
```

Milestone-specific checks will also inspect built bundles/source for forbidden renderer Electron imports, screenshot logging/persistence, and unexpected provider/network code.

## Risks, rollback, and limitations

- Desktop compositor timing is platform/window-manager dependent. The delay is isolated and can be tuned or replaced without changing callers.
- Electron may return no `display_id`; single-display fallback is safe, while ambiguous multi-display capture returns an error. Linux PipeWire may expose one user-selected source.
- Requested thumbnail dimensions are not guaranteed. Actual returned image dimensions drive every crop calculation.
- A large full-screen PNG temporarily exists in main, IPC serialization, preload, and renderer memory. Phase 1 minimizes lifetime but does not yet move crop rendering to a dedicated trusted native surface.
- macOS screen-recording permission and capture behavior differ from Windows. This host cannot close the Windows acceptance gap.
- On this development host, macOS presented a separate one-time ChatGPT/Codex prompt to bypass the system window picker after Screen Recording was enabled. Until the user approves it, that visible OS prompt can legitimately appear in a later screen capture; it is not coach UI and does not bypass the app's privacy lifecycle.
- Renderer reload destroys the process and its object URLs; main has no retained screenshot state. Abrupt process termination relies on OS memory reclamation.
- Rollback is removal of the capture contract/modules/UI/docs and restoration of the Phase 0 placeholder. There is no data migration, persistent screenshot, credential, or external state.

## Progress log

- 2026-08-10: Read repository instructions, required product/privacy/architecture/roadmap documents, Phase 0 plan, implementation, tests, and current Git state.
- 2026-08-10: Confirmed explicit milestone request conflicts with and supersedes the old Phase 1 roadmap label; no Phase 0 baseline commit exists.
- 2026-08-10: Baseline `format:check`, lint, typecheck, and all 17 Phase 0 tests passed.
- 2026-08-10: Chose a current-window display baseline, safe ambiguous-source failure, Zod-validated byte IPC, renderer canvas crop, reducer state, and object-URL lifecycle without new runtime dependencies.
- 2026-08-10: Added the reusable main capture service, sender-validated fixed IPC, narrow preload method, pure reducer/geometry, local selector/crop/preview UI, lifecycle/source/contract tests, and focused documentation.
- 2026-08-10: Production Electron QA found and fixed root-relative Vite asset URLs by setting `base: "./"`; the built `file://` renderer now loads normally.
- 2026-08-10: In-app Browser QA passed at 1280×720 and 640×480 with no console problems, overflow, or framework overlay; the renderer error/recovery path also passed.
- 2026-08-10: The real macOS Electron app invoked Generate, hid/restored, and reached the sanitized permission error. Successful capture was blocked because Electron has denied Screen Recording access.
- 2026-08-10: A temporary synthetic PNG harness around the production renderer exercised all four drag directions. Each observed 673×449 selection produced an exactly matching 673×449 preview; invalid selection, Retake, selection/preview Cancel, Escape, Continue, bridge shape, renderer isolation, viewport fit, and console health passed. Only local `blob:` image loads occurred.
- 2026-08-10: Final gates passed: format/check, lint, typecheck, 10 test files/45 tests, clean build, API `{"status":"ok"}`, production renderer startup, and source/bundle privacy inspection.
- 2026-08-11: The user enabled Screen Recording for Codex, and a fresh Electron process reported `granted`. Real production capture then passed on macOS 26.5.1 x86_64 at 2× scale: three native 2880×1800 captures had distinct hashes, including rapid double-click and Retake cycles; the raw frame showed the full high-contrast background where the coach had been with no coach pixels; the coach restored into selection after every capture; crop/preview/Continue passed; and renderer `require`/`process` remained unavailable.

## Completion record

Phase 1 is complete and signed off on the available native macOS host. Windows target-platform verification remains documented rather than inferred.

Delivered:

- reused the Phase 0 sandboxed main/preload/renderer architecture and Zod-first contracts;
- one reusable main-process capture service with target-display metadata, single-flight protection, hide/settle/capture/finally-restore, safe source matching, permission handling, and no persistence;
- one sender-authorized IPC command and one validated preload method, with no raw Electron API exposed;
- explicit reducer states for idle/capturing/selecting/preview/ready/error;
- exact content-box crop geometry, pointer capture, minimum selection, in-memory Canvas crop, revocable object URLs, preview, Retake, Cancel, Escape, Continue, and safe errors;
- focused architecture/privacy/roadmap/README updates and a production `file://` asset-base fix.

Validation results:

- `pnpm format` — passed;
- `pnpm format:check` — passed;
- `pnpm lint` — passed with zero warnings;
- `pnpm typecheck` — passed in all six non-root workspaces;
- `pnpm test` — passed, 10 files and 45 tests (the original 17 remain intact);
- `pnpm build` — passed in every workspace;
- built API plus `curl http://127.0.0.1:3000/health` — passed with `{"status":"ok"}`;
- in-app Browser renderer QA — passed at 1280×720 and 640×480;
- production Electron synthetic renderer QA — passed at 1200×757 with all controls and four exact crop directions;
- real Electron permission-failure/restoration path — passed on macOS 26.5.1 x86_64;
- real Electron success/exclusion/restoration path — passed on macOS 26.5.1 x86_64 at 2× scale with three fresh 2880×1800 captures, rapid duplicate input, Retake, exact grid inspection, preview, and Continue;
- repository inspection — no renderer Electron imports, AI/provider code, screenshot files, capture logging, or persistence calls; built assets use relative paths.

Target-platform follow-up:

1. Run controlled Windows acceptance at supported versions/scales (at least 100% and 125%) and a second-monitor scenario before Windows release signoff; calibrate the encapsulated 100 ms compositor delay only if evidence requires it.

No Phase 2 work has begun. The next milestone is a separate approved Phase 2 plan for provider-neutral screenshot understanding and coaching.
