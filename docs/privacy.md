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

The default capture/raw-content policy is no disk persistence on the desktop or application API. Future explicitly enabled structured memory follows the separate local-memory policy below; it does not archive captures. The full screen should not leave the device when a relevant region can be determined locally. Early versions may require manual crop selection; later versions may reuse a confirmed region or infer one, while retaining manual selection as a fallback and correction. Temporary retry state may exist only for the active UI session, with a short bound and explicit release.

In Phase 1, the full-screen PNG crosses only the local trusted Electron main → sandboxed preload/renderer IPC boundary so the renderer can present manual selection. It is never written to a file, sent to `apps/api`, uploaded, or logged. The renderer wraps copied bytes in an in-memory `Blob`, zeroes the temporary copy, and keeps only revocable object URLs. Creating a preview releases the full-screen URL.

In Phase 2, Continue sends only that selected crop through a fixed validated preload method to trusted Electron main and directly over TLS to OpenAI. `apps/api` receives neither the crop nor credential. The provider request sets `store: false`, but provider retention/data-use configuration still requires production review. Temporary IPC bytes are zeroed after completion. Success releases the crop URL/reference; Retake, Cancel, Escape, reload, and unmount also release it. A normalized provider failure retains the crop only for explicit retry during the active UI session. Nothing persists to disk or application storage.

In Phase 3, trusted Electron main sends only the validated structured `ConversationAnalysis`—never screenshot bytes—to the selected provider when basic wording is required. Suggested-action and clarification continuations reuse that same in-memory context without recapture. The context and generated messages are not persisted or routed through `apps/api`, and Copy occurs only after an explicit click through a narrow clipboard IPC command.

Agent R1's legacy optional new-reply-goal contract remains for compatibility, but the separate renderer input has been removed. A reliable compose draft suspected of mixing message text and a coach instruction may cause one additional structured interpretation call from trusted desktop main directly to the selected provider, with `store: false`, before action and Skill selection. The call sends bounded draft text and recent labeled messages, never screenshots or credentials to the renderer or `apps/api`. Validated exact source spans are request-local; only message content enters user-owned factual support, and the instruction enters optional Composer style. Neither original draft nor split, provider response, or generated text is persisted or logged. Ordinary drafts and local no-draft decisions do not gain this call. Provider retention/data-use settings still require production review.

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

### Local memory storage (DATA-00)

The [memory contract](memory.md) specifies the full direction. DATA-01 implements protected SQLCipher persistence, DATA-02 adds internal contact/identity lifecycle APIs, MEM-00 adds typed assertion/evidence/decision lifecycle, and DATA-03 adds relationship-history specializations to the same schema-v6 local store owned by one random local context. The existing message-length setting is the only production assertion writer. Production exposes no directory or generic-assertion mutation IPC/preload method and no Contacts/Identities/Relationship or database-management UI. Its random 32-byte database key is wrapped by Windows safeStorage and passed only from trusted main to the dedicated utility process. No account/login, cloud storage, synchronization, multi-profile authentication, or application API content route is involved.

- The reviewed DATA-01 Windows x64 artifact is SQLCipher Community 4.17.0 with OpenSSL 3.6.4 through a BSD wrapper. Build-time hash checks and runtime cipher checks reject missing or plaintext bindings. Database and rollback-journal canaries, wrong/no-key behavior, memory-only temp storage, restart persistence, and relocated loading passed with synthetic data; no plaintext fallback exists.
- Main owns storage and key access; renderer/preload expose only fixed validated controls and safe status. Provider keys remain outside ordinary memory records and memory reset/export payloads.
- If an encrypted store cannot be opened, the user may explicitly confirm an erase-and-recreate operation. Main first retires the storage worker, creates a restart marker, deletes only the enumerated database sidecars and wrapped-key files, removes the marker last, and creates a new encrypted store. Interrupted erasure remains unavailable and resumable; it never falls back to plaintext or recursively deletes application data. Provider configuration remains separate and is preserved.
- Development sessions may show the fixed local database path, context IDs/revisions, schema version, explicit-preference projection, and bounded pages of implemented directory/assertion/evidence/link/decision and relationship-context rows in a read-only Local Memory Inspector. Main requires an unpackaged app and preload requires Electron's default development-app mode; both also require the exact allowlisted development marker. Production and packaged sessions expose no inspector handler or bridge method. Inspection stays on the existing coordinator/utility path and never returns a database key, key envelope, database handle, SQL facility, mutation, or plaintext database.
- Deeper external inspection uses `debug:memory-snapshot`, an unpackaged no-window mode that passes a main-generated snapshot path and independent random passphrase to the same utility process. SQLCipher `ATTACH ... KEY` plus `sqlcipher_export()` creates an encrypted copy at SQLCipher compatibility 4, explicitly preserves application schema `user_version` 6, and never writes the application key or a plaintext export. Only the temporary copy and its separate passphrase reach SQLiteStudio/Letos. The copy is marked read-only and removed when the interactive command finishes; production encryption, the live database, and its OS-protected key envelope are unchanged.
- On Windows development hosts, `debug:memory-gui` wraps that same snapshot path with a disposable Letos portable profile. It verifies the installed SQLite3MultipleCiphers plugin, stores only the snapshot-specific password in the temporary profile, selects SQLCipher compatibility 4, and enforces `PRAGMA query_only = ON`; no password is placed in process arguments, shell history, clipboard, repository files, or the user's persistent Letos configuration. Letos receives only the snapshot path. Closing Letos deletes the profile and encrypted snapshot. The command is gated by Electron's unpackaged development marker and adds no renderer IPC or production code path.
- One OS-user boundary is the MVP scope. This does not promise protection from an already compromised OS session or forensic erasure of all RAM/storage remnants.
- Useful structured assertions, evidence, corrections, and historical relationships may remain indefinitely. No age-only 30/90-day purge; stale, inactive, superseded, or unranked does not automatically mean delete.
- Raw screenshots/messages/full analysis are temporary by default. Async MemoryObservation may carry a bounded raw fragment in memory only, under a finite deadline. No raw-content disk queue, dead-letter archive, or infinite offline backlog.
- MEM-00/DATA-03 have no acquisition, similarity matching, automatic merge, screenshot attribution, or coaching use. Relationship evidence is presently synthetic-fixture-only, bounded typed values/scope/time/confidence with positive/negative polarity; no real conversation source is relabelled as synthetic. Evidence cannot contain screenshots, conversation text, prompts, drafts, replies, or arbitrary blobs. No production caller confirms associations or relationship candidates. Later observation-driven population requires separate enablement, truthful provenance, correction, deletion, and review behavior.
- A future model-assisted task sends only bounded fragments and relevant compact state directly through the approved provider boundary. Local persistence does not mean provider processing is local; disclosure, retention verification, capability checks, and usage budgets still apply. DATA-00 authorizes no such call.
- Evidence remains source-linked and qualified, never hidden reasoning. Temporal relationship ends have explicit evidence dependencies; an unsupported end is invalidated without treating transition evidence as standalone positive role support. Scoped corrections remain enforceable after their former positive source disappears, while the unsupported proposition is downgraded to rejected/unknown. Explicit corrections outrank model inference. Conversation text cannot authorize application memory operations.
- The fixed as-of relationship read checks active scoped corrections before reporting effective applicability; a known old validity interval cannot reassert a role rejected for current use. V5 migration relabels only uniquely attributable transition evidence as contextual and applies the same unsupported-assertion cleanup as ordinary deletion. A legacy positive role with no independent support may therefore be removed rather than preserved as a false confirmed fact; no raw content, plaintext database, or key exposure is involved.
- Deletion removes direct data and contributions to mixed summaries, contact/relationship/global profiles, and caches. Track all implicated subjects; remove a whole derivation when safe separation is not provable.
- Dataset/scope generations and revision checks prevent late asynchronous work from undoing corrections or restoring deleted data. Logical retrieval exclusion precedes potentially chunked physical cleanup.
- Clear-all-memory deletes the memory dataset and pending work, but explicitly preserves separate app/provider configuration. Deleting data does not retain a hidden identity fingerprint for permanent recognition-based suppression.
- Disposable projections may be compacted/rebuilt; retained assertions and useful history are not silently sacrificed to a storage quota. Disk pressure pauses acquisition safely.
- No automatic cloud backup. The application cannot erase user exports, OS backups, or data previously transmitted to a provider it does not control. Recovery/export and stronger vault controls remain later features; key loss may make the local store inaccessible.

Structured logs remain allowlisted, content-free, and bounded. Background failures must not log event payloads, summary values, correction text, database parameters, stable subject IDs, or raw validation/provider output. Memory inspection is a private user feature, not operational telemetry.

## User control

The user chooses when to capture by clicking Generate or invoking an equivalent explicit trigger, can correct or reset the selected region, chooses the reply/action, and decides whether to copy it. The coach never sends automatically. A future insertion feature still requires explicit review and action.

Before durable memory is introduced, the product needs clear controls to:

- enable/disable memory acquisition and use through application settings;
- inspect confirmed memories and meaningful candidates;
- correct, confirm, or reject knowledge through explicit UI actions;
- delete individual memories, selected history, contact data, learned profiles, and all local memory with clear scopes;
- understand what is local versus sent to a provider.

Before production BYOK distribution, the product needs clear controls to select the provider/model, add or replace the credential, test the connection safely, delete the credential, understand relevant capabilities, and see that usage is billed directly by the selected provider. Phase 2's ignored local environment file is development-only and does not satisfy this release gate.

Consent to analyze one Generate-triggered capture is not blanket consent to capture continuously, archive the conversation, or enroll a contact in identity matching.

There is no natural-language memory-management agent. Statements inside captured conversations cannot act as deletion, retention, or confirmation commands.

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
