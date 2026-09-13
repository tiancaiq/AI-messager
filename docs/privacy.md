# Privacy and security

## Data classification

Conversation screenshots, crops, extracted message text, drafts, contact names, avatars, relationship inferences, generated replies, and memory evidence are **highly sensitive content**. API credentials, encryption keys, and provider tokens are **secrets**. Operational metrics should be designed so they remain non-content metadata.

Privacy is an architecture constraint, not only a disclosure in the UI.

## Default capture lifecycle

```text
explicit Generate or equivalent user trigger
→ hide Message Coach
→ capture in desktop memory
→ restore Message Coach
→ locally select a previously confirmed, automatically inferred, or user-corrected region
→ trusted provider-neutral request boundary
→ encrypted transport directly to the selected provider when practical
  or through an explicitly justified application service
→ request-scoped provider processing
→ structured result
→ release crop buffers after completion/cancel/timeout
```

The default is no disk persistence on the desktop or application API. The full screen should not leave the device when a relevant region can be determined locally. Early versions may require manual crop selection; later versions may reuse a confirmed region or infer one, while retaining manual selection as a fallback and correction. Temporary retry state may exist only for the active UI session, with a short bound and explicit release.

In Phase 1, the full-screen PNG crosses only the local trusted Electron main → sandboxed preload/renderer IPC boundary so the renderer can present manual selection. It is never written to a file, sent to `apps/api`, uploaded, or logged. The renderer wraps copied bytes in an in-memory `Blob`, zeroes the temporary copy, and keeps only revocable object URLs. Creating a preview releases the full-screen URL.

In Phase 2, Continue sends only that selected crop through a fixed validated preload method to trusted Electron main and directly over TLS to OpenAI. `apps/api` receives neither the crop nor credential. The provider request sets `store: false`, but provider retention/data-use configuration still requires production review. Temporary IPC bytes are zeroed after completion. Success releases the crop URL/reference; Retake, Cancel, Escape, reload, and unmount also release it. A normalized provider failure retains the crop only for explicit retry during the active UI session. Nothing persists to disk or application storage.

In Phase 3, trusted Electron main sends only the validated structured `ConversationAnalysis`—never screenshot bytes—to the selected provider when basic wording is required. Suggested-action and clarification continuations reuse that same in-memory context without recapture. The context and generated messages are not persisted or routed through `apps/api`, and Copy occurs only after an explicit click through a narrow clipboard IPC command.

In Phase 4, the Skill Engine consumes that same request-scoped structured context in memory after Phase 3 has fixed the action. It derives normalized tags, selects zero to four source-controlled skills, and adds only bounded communication principles/avoidances to the provider-facing coaching payload. It does not add screenshots, identity, relationship, memory, or history. Full definitions, selected skill IDs/versions/reasons, and the registry do not enter the provider prompt. No raw conversation, draft, or selected-skill history is persisted.

Resettable local region metadata such as `x`, `y`, `width`, and `height` is configuration, not conversation content, and may be considered in a separately approved milestone. That distinction does not permit retaining screenshot pixels, extracted text, drafts, or identity evidence.

Direct provider communication is the preferred topology when practical because it avoids an unnecessary Message Coach-operated content hop. It does not make the request local: the selected provider still receives the minimized content. If a provider or an application-operated service retains inputs under its configuration, that fact and retention must be verified and documented before production. “Deleted by our API” must not be used to imply deletion from systems we do not control.

## Data minimization

- Capture only after the user explicitly clicks Generate or invokes an equivalent capture trigger.
- Hide the assistant before capture so it does not contaminate the conversation image.
- Determine the smallest useful region locally, and let the user select, correct, change, or reset it.
- Do not continuously record or capture in the background.
- Do not add OCR, analytics, backups, object storage, or queues that duplicate content without a milestone need.
- Send only context required by the selected model and response task.
- Prefer direct encrypted provider requests from the trusted desktop process; add server mediation only for a documented requirement.
- Store structured candidate facts instead of screenshots or transcript excerpts when future memory is enabled.
- Use synthetic, generated, or deliberately redacted fixtures in the repository.

## Logging and observability

Never log:

- image bytes, base64 payloads, or data URLs;
- extracted messages or compose-box drafts;
- generated reply text;
- usernames, display names, avatar features, or memory values;
- prompts containing user content;
- authorization headers, provider keys, or full upstream responses.

Allowed operational fields may include a random request ID, timestamps, coarse duration, byte-size buckets, schema version, selected action enum, skill IDs/versions, plan status (`SELECTED`, `NONE`, or `FAILED`), provider/model identifier, token counts, and coarse error codes—provided none can reconstruct content or become a stable cross-context user identifier. Phase 4 development/evaluation may inspect exact skill IDs, versions, and concise metadata-derived reasons, but must not join them to raw messages/drafts or retain them as user/contact history.

Central error handling must sanitize validation errors and upstream failures. Development logging must follow the same content rules; “debug mode” is not permission to leak conversations.

## Trust boundaries and safeguards

### Desktop

- Electron context isolation enabled and sandboxing used where compatible.
- No renderer Node.js integration.
- Minimal allowlisted IPC methods with shared schema validation on both ends.
- Phase 2 development credentials are loaded from ignored `.env.local` into trusted Electron main only. Production provider credentials require OS-protected secure storage where practical.
- The renderer may submit a replacement credential through a narrow write operation but cannot read a stored credential back; it receives only safe configuration status.
- Restrictive Content Security Policy and no arbitrary remote renderer content.
- Explicit OS capture permission handling and visible capture state.
- Clipboard write only after a direct user action.

### Network and API

- TLS for every provider or application-service request.
- The Fastify service is not automatically a model proxy and must not persist BYOK credentials by default.
- A server-mediated provider path requires a documented technical need, minimized content and credential exposure, authentication, retention limits, log review, and clear user disclosure.
- Strict MIME type, image dimension, decoded-size, and request-size limits.
- Timeouts, bounded concurrency, and rate controls to reduce accidental data exposure and abuse.
- Authentication and origin/deployment controls must be defined before any non-local release.
- Model output treated as untrusted input and validated before use.

### Model provider

- Use the minimum capable request and avoid unrelated memory/context.
- Send only composed Phase 4 principles/avoidances for wording; do not send the skill registry, definitions, IDs, versions, selection reasons, or evaluation metadata.
- Select models by declared task capability rather than assuming support from the provider name.
- Do not grant tools that can send messages or access messaging apps.
- Scope, rotate, replace, and delete user-owned provider keys through the trusted credential boundary; never expose stored values to the renderer.
- Verify provider data-use and retention settings before external testing.
- Make clear that the provider receives the request and bills the user directly under the user's provider account.
- Do not expose hidden reasoning; keep returned evidence concise and observable.

### Credentials

- Never commit or hard-code provider keys.
- Never store them in plaintext settings, logs, analytics, crash reports, screenshots, backups, fixtures, or support bundles.
- Do not include credentials in URLs, provider-neutral errors, or serialized application state.
- Keep connection-test and authentication failures sanitized.
- Phase 2 may show provider, model, capability metadata, and configured/not-configured status, but never the saved secret.

### Future storage

- Encrypt durable memory in transit and at rest.
- Separate identity keys from content where practical.
- Enforce user-scoped access and deletion.
- Track provenance, confirmation, freshness, and supersession.
- Never use uncertain candidates as confirmed profile facts.

## User control

The user chooses when to capture by clicking Generate or invoking an equivalent explicit trigger, can correct or reset the selected region, chooses the reply/action, and decides whether to copy it. The coach never sends automatically. A future insertion feature still requires explicit review and action.

Before durable memory is introduced, the product needs clear controls to:

- enable/disable memory acquisition;
- inspect confirmed memories and meaningful candidates;
- correct or reject a candidate;
- delete individual memories and all stored data;
- understand what is local versus sent to a provider.

Before production BYOK distribution, the product needs clear controls to select the provider/model, add or replace the credential, test the connection safely, delete the credential, understand relevant capabilities, and see that usage is billed directly by the selected provider. Phase 2's ignored local environment file is development-only and does not satisfy this release gate.

Consent to analyze one Generate-triggered capture is not blanket consent to capture continuously, archive the conversation, or enroll a contact in identity matching.

## Repository and testing policy

- Do not commit real private conversations, screenshots, names, avatars, tokens, or production exports.
- Test fixtures must be synthetic or explicitly approved and irreversibly redacted.
- Live-model tests are opt-in, isolated from default CI, and clearly disclose what data is sent.
- Secrets belong in ignored environment files or a secret manager; commit only placeholder examples.
- Dependency and build choices should preserve reproducibility without introducing content telemetry.

## Security and privacy review gates

One user-authorized production smoke test sent a tightly cropped conversation screenshot directly to OpenAI on 2026-08-23 and confirmed renderer isolation, safe failure copy, and ephemeral cleanup. That one-off test does not satisfy the full production privacy gate. Before beta/production screenshot use or further real-data evaluation, verify:

1. local crop and full-screen disposal behavior;
2. request/image bounds and MIME validation;
3. log redaction under success, validation failure, and upstream failure;
4. provider retention/data-use configuration and billing disclosure;
5. OS-protected BYOK storage, renderer isolation, replacement, and deletion;
6. renderer/main-process isolation;
7. cancellation, timeout, and retry buffer disposal;
8. direct-versus-server request topology and every infrastructure trust boundary;
9. capability checks before transmission;
10. clear no-auto-send UX.

Before durable memory, identity matching, insertion, beta distribution, or telemetry launches, perform a focused threat/privacy review for that capability. These are milestone gates, not cleanup tasks.

## Incident posture

If sensitive content may have entered logs, artifacts, issue trackers, or version control, stop propagation, preserve only the minimal audit information, rotate exposed secrets, remove accessible copies through the relevant system's supported process, and document impact. Do not copy the sensitive value into a remediation report.
