# Development Message Lab

The Lab is an in-app inspection surface for the current coaching pipeline, with or without a draft. It runs `coachConversation` through trusted Electron main and the existing configured text provider. It neither sends messages nor changes skill/Composer/guard policy.

## Launch and use

Run from the UI&UX worktree, not the shared DB checkout:

```powershell
Set-Location 'C:\Users\b\.codex\worktrees\ui-ux-lab\AI messager'
pnpm.cmd install --frozen-lockfile
pnpm.cmd dev:desktop
```

Choose **Open Lab · development** on the home screen. Select the input language, optionally enter a draft or expand **Add conversation evidence**, and choose **Generate response**. The draft can be empty: an incoming message can lead to replies, choices, a clarification or no reply needed. With no message context at all, the existing policy asks what you want to communicate without calling the provider. Incoming message is attributed to OTHER; Your earlier message is attributed to USER and precedes the incoming message. It must contain words you already said, not instructions, inferred relationships or unsent facts. Each field is limited to 10,000 characters. Other/unknown language applies universal skills only.

The current policy gate chooses the fixed action; the Lab never forces a rewrite. Rewrite, completion and suggested replies use the normal generation path. Action choices, clarification questions and no-reply decisions are local and require no provider call or key. Choosing an offered action or clarification answer continues with that explicit intent. **Generate again with this choice** retains it for retries; editing message/language input or Clear resets it. Each configured generation uses one normal provider call; there is no automatic retry or model-only comparison.

Use the existing development `.env.local` configuration in this worktree for live generation. This file is ignored and is loaded only into main by the development launcher; the worktree does not copy another checkout's credentials. The Lab uses the text adapter's actual safe configuration, including `OPENAI_TEXT_MODEL` with the existing vision-model fallback. Never paste a key into a Lab input. A missing key still allows local selection/shadow inspection, with `NOT_CONFIGURED`, no generated candidate and no claim that guidance was sent. The provider receives the supplied text on Run and bills normally; retention follows provider settings.

## Temporary recipient preview

Expand **Talking to (optional)** to enter a name/nickname and relationship to you (for example, friend, coworker or client). Both are free-form, optional and limited to 120 characters. This is a **UI preview only**: these fields do not affect generation, are not sent through IPC or to the provider, and do not create a saved contact or confirmed relationship. Clear or Close discards them; reopening starts empty. Editing them does not invalidate an existing run because they are not generation inputs. Actual recipient-aware guidance requires a separately scoped backend integration.

## Reading a run

- **Fixed action and validator:** the actual decision, normalized-result validation stage, first failing guard rule and safe public error code. A schema-valid candidate rejected by a guard remains visible as inspection-only content; a failed alternative rejects the package. Malformed output and raw provider responses are withheld. Adapter failures expose their safe error code, not unavailable upstream schema details.
- **Production selection → Composer:** all 21 catalog skills, eligible ranking scores, selected reasons, hard-filter exclusions, encountered conflicts and the four-skill cap. Ties use skill ID. Cap-excluded candidates are not claimed to have undergone conflict evaluation after the cap filled. The exact principles/avoidances handed to the generator are displayed separately from the selected plan; a pre-provider failure leaves sent guidance null.
- **Shadow assessment & SkillPlan:** actual source-coded evidence, needs/signals, selected references/reasons and compiled SkillPlan from the existing B3 stages. This path does not reach Composer. Detailed shadow candidate rankings/exclusions are not exposed in this slice; the production table must not be used as a substitute.

Manual input is explicitly a simulation of the existing screenshot-shaped analysis contract. No capture, extraction or language detection occurs. The existing internal `OBSERVED_SCREENSHOT` labels describe that simulated contract, not a real observation. Confidence 1 is a fixture assumption about typed text/ownership. No identity or relationship is inferred or confirmed. Tool rankings, relationship/history retrieval and multi-agent behavior are unavailable. Guard PASS is bounded lexical validation, not proof of semantic correctness or human quality signoff; the B4.7 quality gate remains unchanged.

## Lifetime and boundaries

Input and the latest result live only in component/request memory. Editing input clears the displayed result. Clear, Close, Escape, reload and unmount discard view references. Late completions cannot repopulate a cleared or closed view. Clear/Close do not revoke an already submitted provider request; it can finish and incur usage, and the shared single-flight service remains occupied until completion/timeout. There is no save, export, run history, persistent trace, content logging, capture or memory access. JavaScript reference release is not a claim of forensic RAM erasure.

Main registers the Lab only when unpackaged, `process.defaultApp` is true and the development URL is allowlisted. It adds a dedicated preload argv marker only in that mode. Sandboxed preload checks that marker rather than relying on main-only environment/defaultApp fields. Every request still requires an owned window's main frame, strict shared schemas and the existing single-flight coaching guard. Production does not expose the Lab bridge or handlers. The renderer receives safe provider status, never a key, general IPC access or provider request control.

The Windows launcher invokes pnpm's JS entry through Node for build commands and launches long-lived Vite/Electron children directly, so closing Electron releases its renderer server. A busy port fails instead of connecting to an unrelated renderer. SQLite install scripts are explicitly disabled; builds continue staging the repository's reviewed SQLCipher artifact. Close the app before rebuilding main to avoid Windows native-library file locks.

## Baseline and next work

This work is isolated on `UI&UX` at architecture baseline `bd39266`, fast-forwarded from `a77f476`. The approved registry is the committed architecture snapshot; concurrent DB/skills worktrees and their uncommitted edits were not imported or modified. The new optional inspection hooks preserve production selection, guidance, outputs and call counts under deterministic parity tests. No architecture quality gate or production cutover is implied.

The next useful slice is user review of representative conversations with and without drafts in this Lab, followed by separately scoped shadow-ranking diagnostics if needed. History/relationship inspection remains unavailable until its own approved source-qualified integration. The original rewrite-only scope is superseded by the [optional-draft extension](../.agent/plans/lab-optional-draft.md); core policy and quality gates remain unchanged.
