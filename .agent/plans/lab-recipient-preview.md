# Lab temporary recipient preview

Status: complete
Owner: UI & UX
Started: 2026-10-16
Updated: 2026-10-16
Roadmap: bounded development-Lab UX extension; no [memory roadmap](../../docs/roadmap.md) enablement.

## Outcome

The user can enter a temporary name and relationship for the person they are talking to in the Lab.

## Scope

Optional renderer-only fields. No saved contacts, identity confirmation, inference, backend integration, persistence or generation changes.

## Current state

Lab.tsx owns ephemeral draft state and sends only the strict LabRequest through runLab. No recipient field or approved coaching relationship reader exists. Work stays in the isolated UI&UX worktree and preserves the completed Lab implementation.

## Assumptions and decisions

The user chose temporary name and relationship. Treat this as an explicitly labelled UI preview, not a working personalization feature. Keep both optional, bounded to 120 characters, free-form to avoid implying a confirmed role taxonomy. Use a collapsed Talking to section below the draft to preserve the primary Run flow. Retain existing navy/panel/text/muted/accent tokens (#05091c, #111b35, #d9e5ff, #91a4c7, #7cb6ff), Segoe UI labels/body and Consolas diagnostics. The preview badge communicates a real capability boundary, not decoration.

## Contracts and data flow

No shared contract changes: recipient state is separate from LabRequest and never enters IPC, provider input, memory, logs or browser storage. Clear resets both fields; close/unmount/reload discards them. Editing these unused fields does not invalidate a generation result.

## Implementation steps

1. Add separate local recipient state and accessible optional fields in Lab.tsx.
2. Extend existing input styles; add concise UI-only disclosure.
3. Test markup/bounds and strict request exclusion; check temporary-field lifecycle interactively if available.
4. Update Lab/privacy documentation and run canonical gates.

## Tests and evaluation

Synthetic data only. SSR checks labels, limits, optional fields and disclosure; contract regression rejects recipient extensions. Native smoke checks edits and Clear/close reset without provider calls. No live quality evaluation applies because generation is unchanged.

## Acceptance criteria

- [x] Optional temporary name and relationship appear with clear labels.
- [x] UI explicitly says they are not used for generation yet.
- [x] Recipient values remain separate from transport and persistence.
- [x] Clear/close discard the fields; normal rewrite remains available without them.
- [x] Lint, typecheck, tests and build pass; documentation updated.

## Validation commands

pnpm.cmd lint; pnpm.cmd typecheck; pnpm.cmd test; pnpm.cmd build; git diff --check.

## Risks, rollback, and limitations

Main risk is implying personalization works: explicit adjacent disclosure prevents that claim. Remove the local fields/styles to roll back; no migration or API changes. Saved contacts and actual source-qualified recipient guidance require separate work.

## Progress log

- 2026-10-16: User selected temporary name and relationship. Inspected current Lab, strict request, product/privacy boundaries and repository verification commands.

## Completion record

Implemented renderer-only state, bounded accessible free-form inputs, a UI-preview badge and adjacent transmission/generation disclosure. The frontend-design skill guided reuse of the existing visual language and optional disclosure layout; computer-use verified the actual Windows UI with synthetic values. No shared contracts, provider behavior or storage changed.

Added two deterministic tests for optional labels/bounds/disclosure and strict transport rejection of recipient fields. Native inspection verified expanded layout, editable values and Escape/reopen resetting both fields. Clear reset was verified by source inspection, not an additional native click. Existing tests cover unchanged rewrite/no-key behavior. No live provider request was made.

Commands:

- `pnpm.cmd exec prettier --write apps/desktop/src/renderer/Lab.tsx apps/desktop/src/renderer/Lab.test.tsx apps/desktop/src/renderer/lab.css` — passed.
- `pnpm.cmd exec vitest run apps/desktop/src/renderer/Lab.test.tsx` — 4 tests passed.
- `pnpm.cmd lint` — passed.
- `pnpm.cmd typecheck` — passed across the workspace.
- `pnpm.cmd test` — 57 files / 414 tests passed.
- `pnpm.cmd build` — initial Windows native-library lock while the development app was open; passed after closing the empty app.
- `git diff --check` — passed, host line-ending warnings only.
- `pnpm.cmd dev:desktop` — first blocked by the same open-app native lock; restarted after successful build.

All acceptance criteria met for the UI-only preview. Fields intentionally do not personalize generation or save a contact. Changes remain local and uncommitted on UI&UX. Next recommended work is user review of the recipient UX, followed by a separately scoped source-qualified backend integration if desired.
