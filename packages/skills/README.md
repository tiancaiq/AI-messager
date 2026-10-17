# `@ai-message-coach/skills`

This package is the single source of truth for AI Message Coach's approved communication-strategy skills. Its skills answer:

> What communication expertise should influence the wording of the action Phase 3 already selected?

It owns the source-controlled registry plus deterministic validation, selection, composition, and evaluation needed to use that registry. Stored skills may guide only wording-producing actions:

- `REWRITE_DRAFT`
- `COMPLETE_DRAFT`
- `SUGGEST_REPLY`

This package does not contain general agent skills, tools, provider prompts or adapters, memory, relationship inference, UI behavior, or Phase 3 action-selection logic. A communication skill cannot change the user's intent or choose `SUGGEST_ACTIONS`, `ASK_CLARIFICATION`, or `NO_REPLY_NEEDED`.

Runtime uses only validated `ACTIVE` definitions from the approved registry. Candidate generation, approval workflows, and Skill Factory behavior remain outside the runtime package until a separately approved milestone.
