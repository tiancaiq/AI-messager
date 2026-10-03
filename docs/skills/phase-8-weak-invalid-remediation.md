# Phase 8A — WEAK / INVALID example remediation

Date: 2026-09-19. Reviewer: CODEX_SEMANTIC_REVIEW. Revision: 1.

## Scope and status

Exactly the original 28 WEAK and 7 INVALID rows receive full proposed replacements. The other 175 examples and proposals are reserved for the user's review. Six are repairs to the output with identical supplied inputs; 29 are explicitly new synthetic variants. All four rejected and all six quarantined target rows have replacements.

These are authoring proposals only. No canonical YAML, definitions, schema, registry, old fixtures or test code changed. All 172 pre-existing non-ignored files, including the entire prior review JSON and Markdown, remain byte-identical. No Phase 8B, candidate activation, routing change, live provider call or publication occurred.

Runtime approval and example approval remain separate: existing runtime approval is inherited only on exact semantic parity with the frozen baseline. Canonical examples remain pending human review and cannot affect runtime selection, composition or generation. New synthetic evidence does not retrospectively approve the original example or adopt a proposed taxonomy.

## Review files and bindings

- [Full replacement JSON](../../packages/skills/tests/fixtures/phase8/weak-invalid-remediation.json) contains all 35 originals, full replacements, exact field changes, prior proposals, source bindings, revision digests, fresh judgments and the 172-file starting snapshot.
- [Unchanged historical semantic review](phase-8-codex-semantic-review.md) retains all 210 original judgments and proposals.
- [Unchanged historical review JSON](../../packages/skills/tests/fixtures/phase8/codex-semantic-review.json) SHA-256: 16b6a2606b7b6f3724a0c3f4fce899b261709c6f88ceab4a303fdbc3efc58dec.
- Historical report SHA-256: 224b788f47a26ee29461adb4fe2d39e8900d5fc17a59b0d85530a7b35f040dc6.

The fresh assessment judges each replacement on its own supplied evidence. It does not assert preservation between the old scenario and a newly synthetic one. Selection examples are authoring expectations, not measured generated replies. Application pairs were checked for intent, facts, commitment, certainty and responsibility. Three modest expression improvements are ACCEPTABLE; the other 32 are STRONG. These ratings are CODEX judgments, not human signoff or measured uplift.

Across every category, classify supported focal and other skills using expected plus acceptable. BOTH_VALID permits both; only expected requires co-selection. Forbidden sets are scenario-specific exclusions, not global registry conflicts. These are semantic judgments, not measured routing.

## Index

| Key                            | Original          | Replacement type         | Fresh quality | Neighbor judgment |
| ------------------------------ | ----------------- | ------------------------ | ------------- | ----------------- |
| apology/P2                     | WEAK / REVISE     | NEW_SYNTHETIC_VARIANT    | STRONG        | BOTH_VALID        |
| apology/N3                     | WEAK / REJECT     | NEW_SYNTHETIC_VARIANT    | STRONG        | NEIGHBOR_ONLY     |
| acknowledge_mistake/H1         | WEAK / QUARANTINE | NEW_SYNTHETIC_VARIANT    | STRONG        | NEIGHBOR_ONLY     |
| acknowledge_mistake/A2         | WEAK / REVISE     | SAME_INPUT_OUTPUT_REPAIR | STRONG        | FOCAL_ONLY        |
| emotional_validation/H1        | WEAK / QUARANTINE | NEW_SYNTHETIC_VARIANT    | STRONG        | NEIGHBOR_ONLY     |
| emotional_validation/A1        | INVALID / REVISE  | NEW_SYNTHETIC_VARIANT    | ACCEPTABLE    | FOCAL_ONLY        |
| reassurance/N2                 | WEAK / REJECT     | NEW_SYNTHETIC_VARIANT    | STRONG        | NEIGHBOR_ONLY     |
| reassurance/A1                 | INVALID / REVISE  | NEW_SYNTHETIC_VARIANT    | ACCEPTABLE    | FOCAL_ONLY        |
| reassurance/A2                 | INVALID / REVISE  | NEW_SYNTHETIC_VARIANT    | STRONG        | FOCAL_ONLY        |
| boundary_setting/N3            | WEAK / REJECT     | NEW_SYNTHETIC_VARIANT    | STRONG        | NEIGHBOR_ONLY     |
| boundary_setting/A1            | WEAK / REVISE     | NEW_SYNTHETIC_VARIANT    | STRONG        | BOTH_VALID        |
| boundary_setting/A2            | INVALID / REVISE  | SAME_INPUT_OUTPUT_REPAIR | STRONG        | BOTH_VALID        |
| de_escalation/H1               | WEAK / QUARANTINE | NEW_SYNTHETIC_VARIANT    | STRONG        | NEIGHBOR_ONLY     |
| de_escalation/H2               | WEAK / REJECT     | NEW_SYNTHETIC_VARIANT    | STRONG        | NEIGHBOR_ONLY     |
| de_escalation/A1               | INVALID / REVISE  | SAME_INPUT_OUTPUT_REPAIR | STRONG        | BOTH_VALID        |
| de_escalation/A2               | INVALID / REVISE  | SAME_INPUT_OUTPUT_REPAIR | STRONG        | BOTH_VALID        |
| follow_up/A1                   | WEAK / REVISE     | NEW_SYNTHETIC_VARIANT    | STRONG        | BOTH_VALID        |
| status_update/A1               | WEAK / REVISE     | NEW_SYNTHETIC_VARIANT    | STRONG        | FOCAL_ONLY        |
| expectation_setting/H2         | WEAK / QUARANTINE | NEW_SYNTHETIC_VARIANT    | STRONG        | BOTH_VALID        |
| expectation_setting/A2         | WEAK / REVISE     | SAME_INPUT_OUTPUT_REPAIR | STRONG        | FOCAL_ONLY        |
| planning/H2                    | WEAK / QUARANTINE | NEW_SYNTHETIC_VARIANT    | STRONG        | FOCAL_ONLY        |
| clarification/H1               | WEAK / QUARANTINE | NEW_SYNTHETIC_VARIANT    | STRONG        | BOTH_VALID        |
| clarification/A1               | WEAK / REVISE     | NEW_SYNTHETIC_VARIANT    | ACCEPTABLE    | FOCAL_ONLY        |
| en.professional_conciseness/P3 | WEAK / REVISE     | NEW_SYNTHETIC_VARIANT    | STRONG        | BOTH_VALID        |
| en.casual_naturalness/P3       | WEAK / REVISE     | NEW_SYNTHETIC_VARIANT    | STRONG        | BOTH_VALID        |
| en.direct_but_polite/P2        | WEAK / REVISE     | NEW_SYNTHETIC_VARIANT    | STRONG        | BOTH_VALID        |
| en.direct_but_polite/H1        | WEAK / REVISE     | NEW_SYNTHETIC_VARIANT    | STRONG        | NEIGHBOR_ONLY     |
| en.direct_but_polite/A1        | INVALID / REVISE  | SAME_INPUT_OUTPUT_REPAIR | STRONG        | BOTH_VALID        |
| zh.politeness_calibration/H1   | WEAK / REVISE     | NEW_SYNTHETIC_VARIANT    | STRONG        | NEIGHBOR_ONLY     |
| zh.professional_formality/P1   | WEAK / REVISE     | NEW_SYNTHETIC_VARIANT    | STRONG        | BOTH_VALID        |
| zh.professional_formality/P2   | WEAK / REVISE     | NEW_SYNTHETIC_VARIANT    | STRONG        | BOTH_VALID        |
| zh.professional_formality/H2   | WEAK / REVISE     | NEW_SYNTHETIC_VARIANT    | STRONG        | NEIGHBOR_ONLY     |
| zh.natural_conciseness/P2      | WEAK / REVISE     | NEW_SYNTHETIC_VARIANT    | STRONG        | BOTH_VALID        |
| zh.natural_conciseness/H2      | WEAK / REVISE     | NEW_SYNTHETIC_VARIANT    | STRONG        | BOTH_VALID        |
| zh.code_switching/H1           | WEAK / REVISE     | NEW_SYNTHETIC_VARIANT    | STRONG        | NEIGHBOR_ONLY     |

## Full replacements

The original remains in the immutable historical review and is also copied into the new JSON. The sourceText below describes this replacement's actual scenario and wording. Changed field lists compare against the original, not a prior proposal.

### apology/P2

- Original: WEAK / REVISE.
- Type: NEW_SYNTHETIC_VARIANT. Changed input fields: visibleContext, userIntent.
- Exact changed fields (before/after values in JSON): sourceText, visibleContext, userIntent, acceptable, rationale.
- Why: Make responsibility and the bounded impact explicit instead of repeating a generic wish to apologize.
- Skill effect: Regret concerns the supported wait only; ownership may complement it without inventing further fault.
- Fresh assessment: KEEP / STRONG / HIGH confidence; BOTH_VALID. CODEX only.
- Replacement digest: sha256:d5905dcab8dfd83188b36167f38258903b4391e4bf3a0c679b1471d100335d74.

```json
{
  "id": "P2",
  "sourceText": "New synthetic variant: The user arrived late to a friend's dinner. The friend explicitly says they waited for the user. The user accepts responsibility for that wait, but no other dinner problem has been attributed to them. Intent: Apologize for arriving late and keeping the friend waiting, without taking broader blame or promising a repair.",
  "visibleContext": "The user arrived late to a friend's dinner. The friend explicitly says they waited for the user. The user accepts responsibility for that wait, but no other dinner problem has been attributed to them.",
  "userIntent": "Apologize for arriving late and keeping the friend waiting, without taking broader blame or promising a repair.",
  "action": "SUGGEST_REPLY",
  "language": {
    "primary": "en",
    "secondary": null,
    "codeSwitching": false
  },
  "expected": ["apology"],
  "acceptable": ["acknowledge_mistake"],
  "forbidden": [],
  "rationale": "Make responsibility and the bounded impact explicit instead of repeating a generic wish to apologize. Regret concerns the supported wait only; ownership may complement it without inventing further fault. Authoring-only proposed replacement; not measured model output.",
  "category": "POSITIVE"
}
```

### apology/N3

- Original: WEAK / REJECT.
- Type: NEW_SYNTHETIC_VARIANT. Changed input fields: visibleContext, userIntent.
- Exact changed fields (before/after values in JSON): sourceText, visibleContext, userIntent, expected, acceptable, forbidden, rationale.
- Why: Replace an unrelated easy negative with a venue-confusion case that tempts false user responsibility.
- Skill effect: Require a missing-location question, not regret for another person's change.
- Fresh assessment: KEEP / STRONG / HIGH confidence; NEIGHBOR_ONLY. CODEX only.
- Replacement digest: sha256:00c927a7f44fe302a1e93ad7e107cf8dc2a1a0c02e15afb308279169c3c1042b.

```json
{
  "id": "N3",
  "sourceText": "New synthetic variant: The organizer says, 'I changed the meeting venue after you left.' The user followed the original directions, caused no venue error, and has not been told the new location. Intent: Ask for the new meeting location, without apologizing or accepting responsibility for the organizer's change.",
  "visibleContext": "The organizer says, 'I changed the meeting venue after you left.' The user followed the original directions, caused no venue error, and has not been told the new location.",
  "userIntent": "Ask for the new meeting location, without apologizing or accepting responsibility for the organizer's change.",
  "action": "SUGGEST_REPLY",
  "language": {
    "primary": "en",
    "secondary": null,
    "codeSwitching": false
  },
  "expected": ["clarification"],
  "acceptable": ["request"],
  "forbidden": ["apology", "acknowledge_mistake"],
  "rationale": "Replace an unrelated easy negative with a venue-confusion case that tempts false user responsibility. Require a missing-location question, not regret for another person's change. Authoring-only proposed replacement; not measured model output.",
  "category": "NEGATIVE"
}
```

### acknowledge_mistake/H1

- Original: WEAK / QUARANTINE.
- Type: NEW_SYNTHETIC_VARIANT. Changed input fields: visibleContext, userIntent.
- Exact changed fields (before/after values in JSON): sourceText, visibleContext, userIntent, expected, acceptable, forbidden, rationale.
- Why: Replace ambiguous impact ownership with explicit recipient-owned error and a chosen user status report.
- Skill effect: Separate speaker ownership from the presence of apology words in the conversation.
- Fresh assessment: KEEP / STRONG / HIGH confidence; NEIGHBOR_ONLY. CODEX only.
- Replacement digest: sha256:d0875f83528f831c61f0743d0c30a364d6971ee1b8c5804eb59a31c279a44e3f.
- Original question remains open: The original sympathy-versus-user-owned-apology boundary remains quarantined; this new ownership contrast does not adjudicate it.

```json
{
  "id": "H1",
  "sourceText": "New synthetic variant: The recipient says, 'Sorry, I gave you the wrong address.' The user is at the library and has explicitly chosen only to report that current location. The user did not supply the wrong address. Intent: Report that I am at the library; do not take responsibility for the recipient's address error or add an apology.",
  "visibleContext": "The recipient says, 'Sorry, I gave you the wrong address.' The user is at the library and has explicitly chosen only to report that current location. The user did not supply the wrong address.",
  "userIntent": "Report that I am at the library; do not take responsibility for the recipient's address error or add an apology.",
  "action": "SUGGEST_REPLY",
  "language": {
    "primary": "en",
    "secondary": null,
    "codeSwitching": false
  },
  "expected": ["status_update"],
  "acceptable": [],
  "forbidden": ["acknowledge_mistake", "apology"],
  "rationale": "Replace ambiguous impact ownership with explicit recipient-owned error and a chosen user status report. Separate speaker ownership from the presence of apology words in the conversation. Authoring-only proposed replacement; not measured model output.",
  "category": "NEIGHBOR"
}
```

### acknowledge_mistake/A2

- Original: WEAK / REVISE.
- Type: SAME_INPUT_OUTPUT_REPAIR. Changed input fields: none.
- Exact changed fields (before/after values in JSON): sourceText, expected, rationale, improved.
- Why: Place yesterday on the missed call, as the original source and commitment ledger specify, rather than on when the promise was made.
- Skill effect: Direct ownership replaces shorthand and preserves the existing missed commitment without promising another call.
- Fresh assessment: KEEP / STRONG / HIGH confidence; FOCAL_ONLY. CODEX only.
- Replacement digest: sha256:8b624b8183d4211308da6a9ad33db2465777e705f237e677b1545fd9886a13c1.

```json
{
  "id": "A2",
  "sourceText": "Corrected application: User promised a call yesterday and forgot it. Intent: Own forgetting the promised call. Draft: \"didn't call, forgot\" → Improved: \"I forgot to call yesterday as promised.\"",
  "visibleContext": "User promised a call yesterday and forgot it.",
  "userIntent": "Own forgetting the promised call.",
  "action": "REWRITE_DRAFT",
  "language": {
    "primary": "en",
    "secondary": null,
    "codeSwitching": false
  },
  "expected": ["acknowledge_mistake"],
  "acceptable": [],
  "forbidden": [],
  "rationale": "Place yesterday on the missed call, as the original source and commitment ledger specify, rather than on when the promise was made. Direct ownership replaces shorthand and preserves the existing missed commitment without promising another call. Authoring-only proposed replacement; not measured model output.",
  "category": "APPLICATION",
  "draft": "didn't call, forgot",
  "improved": "I forgot to call yesterday as promised.",
  "ledger": {
    "facts": ["User promised a call yesterday and forgot it."],
    "commitments": ["The call was promised for yesterday; no new call is promised."],
    "uncertainty": []
  }
}
```

### emotional_validation/H1

- Original: WEAK / QUARANTINE.
- Type: NEW_SYNTHETIC_VARIANT. Changed input fields: visibleContext, userIntent.
- Exact changed fields (before/after values in JSON): sourceText, visibleContext, userIntent, expected, acceptable, forbidden, rationale.
- Why: Replace an abstract candidate-only interpretation with a concrete material unknown and no supplied distress.
- Skill effect: A reference question solves the present job; a perspective candidate is neither required nor assumed available.
- Fresh assessment: KEEP / STRONG / HIGH confidence; NEIGHBOR_ONLY. CODEX only.
- Replacement digest: sha256:05fd944bd39f4ba0497a3b15da67099da4be68ee81faf10e324479b51e415774.
- Original question remains open: Whether recognizing a difficult stated interpretation merits a separate perspective skill remains open in the original review.

```json
{
  "id": "H1",
  "sourceText": "New synthetic variant: In a neutral file exchange, the recipient says, 'I took version two to mean the second attachment.' No feeling or upsetting experience is expressed. The user does not know which named file the recipient opened. Intent: Ask which file the recipient opened so we can resolve the reference; do not infer an emotion or endorse the interpretation.",
  "visibleContext": "In a neutral file exchange, the recipient says, 'I took version two to mean the second attachment.' No feeling or upsetting experience is expressed. The user does not know which named file the recipient opened.",
  "userIntent": "Ask which file the recipient opened so we can resolve the reference; do not infer an emotion or endorse the interpretation.",
  "action": "SUGGEST_REPLY",
  "language": {
    "primary": "en",
    "secondary": null,
    "codeSwitching": false
  },
  "expected": ["clarification"],
  "acceptable": ["request"],
  "forbidden": ["emotional_validation", "reassurance"],
  "rationale": "Replace an abstract candidate-only interpretation with a concrete material unknown and no supplied distress. A reference question solves the present job; a perspective candidate is neither required nor assumed available. Authoring-only proposed replacement; not measured model output.",
  "category": "NEIGHBOR"
}
```

### emotional_validation/A1

- Original: INVALID / REVISE.
- Type: NEW_SYNTHETIC_VARIANT. Changed input fields: draft.
- Exact changed fields (before/after values in JSON): sourceText, expected, rationale, draft, improved.
- Why: Use an acknowledgement draft from the outset, avoiding a switch from suppressing sadness to validating it.
- Skill effect: Replace mechanical repetition with proportionate recognition of the same expressed disappointment; add no advice, diagnosis or reassurance.
- Fresh assessment: KEEP / ACCEPTABLE / HIGH confidence; FOCAL_ONLY. CODEX only.
- Replacement digest: sha256:555b3d003646e03753b195d106b69a88682bb56f5951071a27fddadafc9a4000.

```json
{
  "id": "A1",
  "sourceText": "New synthetic variant: Other person said: I'm disappointed I didn't get it. Intent: Acknowledge expressed disappointment. Draft: \"Your disappointment about not getting it sounds disappointing.\" → Improved: \"Not getting it sounds disappointing.\"",
  "visibleContext": "Other person said: I'm disappointed I didn't get it.",
  "userIntent": "Acknowledge expressed disappointment.",
  "action": "REWRITE_DRAFT",
  "language": {
    "primary": "en",
    "secondary": null,
    "codeSwitching": false
  },
  "expected": ["emotional_validation"],
  "acceptable": [],
  "forbidden": [],
  "rationale": "Use an acknowledgement draft from the outset, avoiding a switch from suppressing sadness to validating it. Replace mechanical repetition with proportionate recognition of the same expressed disappointment; add no advice, diagnosis or reassurance. Authoring-only proposed replacement; not measured model output.",
  "category": "APPLICATION",
  "draft": "Your disappointment about not getting it sounds disappointing.",
  "improved": "Not getting it sounds disappointing.",
  "ledger": {
    "facts": ["Other person said: I'm disappointed I didn't get it."],
    "commitments": [],
    "uncertainty": []
  }
}
```

### reassurance/N2

- Original: WEAK / REJECT.
- Type: NEW_SYNTHETIC_VARIANT. Changed input fields: visibleContext, userIntent.
- Exact changed fields (before/after values in JSON): sourceText, visibleContext, userIntent, expected, rationale.
- Why: Use a backup fact that could tempt reassurance but supplies only a neutral status-reporting need.
- Skill effect: A support-relevant keyword alone does not establish a concern; select status.
- Fresh assessment: KEEP / STRONG / HIGH confidence; NEIGHBOR_ONLY. CODEX only.
- Replacement digest: sha256:b6d8d6cc8598da4c11442a44e2684b70664a789ab2b1b4202de01880aba349e4.

```json
{
  "id": "N2",
  "sourceText": "New synthetic variant: A coworker asks, 'Did the nightly backup complete?' The visible log confirms that it completed. Nobody expresses worry or lost work. The user chooses only to report the completed backup. Intent: Report the confirmed backup completion without adding reassurance, recovery predictions or promises.",
  "visibleContext": "A coworker asks, 'Did the nightly backup complete?' The visible log confirms that it completed. Nobody expresses worry or lost work. The user chooses only to report the completed backup.",
  "userIntent": "Report the confirmed backup completion without adding reassurance, recovery predictions or promises.",
  "action": "SUGGEST_REPLY",
  "language": {
    "primary": "en",
    "secondary": null,
    "codeSwitching": false
  },
  "expected": ["status_update"],
  "acceptable": [],
  "forbidden": ["reassurance"],
  "rationale": "Use a backup fact that could tempt reassurance but supplies only a neutral status-reporting need. A support-relevant keyword alone does not establish a concern; select status. Authoring-only proposed replacement; not measured model output.",
  "category": "NEGATIVE"
}
```

### reassurance/A1

- Original: INVALID / REVISE.
- Type: NEW_SYNTHETIC_VARIANT. Changed input fields: draft, ledger.
- Exact changed fields (before/after values in JSON): sourceText, expected, rationale, draft, improved, ledger.
- Why: Start with the existing attendance fact rather than an instruction not to worry, and remove the unsupported accompaniment commitment.
- Skill effect: Make the actual support fact easy to hear, without promising travel or company throughout the event.
- Fresh assessment: KEEP / ACCEPTABLE / HIGH confidence; FOCAL_ONLY. CODEX only.
- Replacement digest: sha256:b9b0dfad868b1ce12ca3810517b9c98d5410dfb232571a2bc23a20d4e4b4f7dc.

```json
{
  "id": "A1",
  "sourceText": "New synthetic variant: Friend is worried about attending alone. User has committed to attending too. Intent: Reassure using the existing attendance commitment. Draft: \"I'm also going to attend; I will be there at the event too.\" → Improved: \"I'll be attending too.\"",
  "visibleContext": "Friend is worried about attending alone. User has committed to attending too.",
  "userIntent": "Reassure using the existing attendance commitment.",
  "action": "REWRITE_DRAFT",
  "language": {
    "primary": "en",
    "secondary": null,
    "codeSwitching": false
  },
  "expected": ["reassurance"],
  "acceptable": [],
  "forbidden": [],
  "rationale": "Start with the existing attendance fact rather than an instruction not to worry, and remove the unsupported accompaniment commitment. Make the actual support fact easy to hear, without promising travel or company throughout the event. Authoring-only proposed replacement; not measured model output.",
  "category": "APPLICATION",
  "draft": "I'm also going to attend; I will be there at the event too.",
  "improved": "I'll be attending too.",
  "ledger": {
    "facts": ["Friend is worried about attending alone.", "User has committed to attending too."],
    "commitments": [
      "User will attend; traveling together or staying with the friend is not promised."
    ],
    "uncertainty": []
  }
}
```

### reassurance/A2

- Original: INVALID / REVISE.
- Type: NEW_SYNTHETIC_VARIANT. Changed input fields: visibleContext, draft, ledger.
- Exact changed fields (before/after values in JSON): sourceText, visibleContext, expected, rationale, draft, improved, ledger.
- Why: Supply an explicit recipient concern, replace the unsupported everything-is-fine draft with a genuinely uncertain pair, and remove the unchosen checking step.
- Skill effect: Remove repeated reassurance and lead with the one known supporting fact, retaining exactly the same unknown recovery outcome.
- Fresh assessment: KEEP / STRONG / HIGH confidence; FOCAL_ONLY. CODEX only.
- Replacement digest: sha256:ee9d1cdf8d0ab92caa57f2ac1297387d002f69b1d5345eee5326e3d2a2c84f63.

```json
{
  "id": "A2",
  "sourceText": "New synthetic variant: The recipient says, 'I'm worried my work was lost.' A backup exists. Recovery outcome has not been established. Intent: Reassure using the known backup without guaranteeing recovery. Draft: \"There is a backup. What can be restored isn't known yet. So, there is a backup, but we don't know what can be restored.\" → Improved: \"There's a backup, though we don't yet know what can be restored.\"",
  "visibleContext": "The recipient says, 'I'm worried my work was lost.' A backup exists. Recovery outcome has not been established.",
  "userIntent": "Reassure using the known backup without guaranteeing recovery.",
  "action": "REWRITE_DRAFT",
  "language": {
    "primary": "en",
    "secondary": null,
    "codeSwitching": false
  },
  "expected": ["reassurance"],
  "acceptable": [],
  "forbidden": [],
  "rationale": "Supply an explicit recipient concern, replace the unsupported everything-is-fine draft with a genuinely uncertain pair, and remove the unchosen checking step. Remove repeated reassurance and lead with the one known supporting fact, retaining exactly the same unknown recovery outcome. Authoring-only proposed replacement; not measured model output.",
  "category": "APPLICATION",
  "draft": "There is a backup. What can be restored isn't known yet. So, there is a backup, but we don't know what can be restored.",
  "improved": "There's a backup, though we don't yet know what can be restored.",
  "ledger": {
    "facts": [
      "The recipient is worried their work was lost.",
      "A backup exists.",
      "Recovery outcome has not been established."
    ],
    "commitments": [],
    "uncertainty": ["What can be restored is unknown."]
  }
}
```

### boundary_setting/N3

- Original: WEAK / REJECT.
- Type: NEW_SYNTHETIC_VARIANT. Changed input fields: visibleContext, userIntent.
- Exact changed fields (before/after values in JSON): sourceText, visibleContext, userIntent, expected, rationale.
- Why: Replace a distant neutral-status negative with a capacity limit that closely resembles a boundary but lacks repeated pressure.
- Skill effect: State supported scope through expectation setting under the frozen definition.
- Fresh assessment: KEEP / STRONG / HIGH confidence; NEIGHBOR_ONLY. CODEX only.
- Replacement digest: sha256:b6a8e7ceae2041be20761140ca6184c7b528e1722fa6643430f2a61b9265818c.

```json
{
  "id": "N3",
  "sourceText": "New synthetic variant: A colleague asks once how much of a manuscript the user can review this week. The user can review only one chapter. There is no repeated pressure or unwanted-contact issue. Intent: Communicate the one-chapter review capacity for this week, without stating an ongoing behavioral rule.",
  "visibleContext": "A colleague asks once how much of a manuscript the user can review this week. The user can review only one chapter. There is no repeated pressure or unwanted-contact issue.",
  "userIntent": "Communicate the one-chapter review capacity for this week, without stating an ongoing behavioral rule.",
  "action": "SUGGEST_REPLY",
  "language": {
    "primary": "en",
    "secondary": null,
    "codeSwitching": false
  },
  "expected": ["expectation_setting"],
  "acceptable": [],
  "forbidden": ["boundary_setting"],
  "rationale": "Replace a distant neutral-status negative with a capacity limit that closely resembles a boundary but lacks repeated pressure. State supported scope through expectation setting under the frozen definition. Authoring-only proposed replacement; not measured model output.",
  "category": "NEGATIVE"
}
```

### boundary_setting/A1

- Original: WEAK / REVISE.
- Type: NEW_SYNTHETIC_VARIANT. Changed input fields: visibleContext, ledger.
- Exact changed fields (before/after values in JSON): sourceText, visibleContext, expected, acceptable, rationale, improved, ledger.
- Why: Supply repeated pressure explicitly in a new scenario and keep the exact after-8 cutoff.
- Skill effect: Restate the actual limit clearly without shifting the cutoff, apologizing or adding a penalty.
- Fresh assessment: KEEP / STRONG / HIGH confidence; BOTH_VALID. CODEX only.
- Replacement digest: sha256:0ef41d23ce55c3486934da86237b28bf80e7ca1e5df28202f4d316ef28ec9168.
- Original question remains open: The original first-time/civil-limit runtime-boundary question remains open; the new repeated-pressure evidence is not retroactively attributed to the original.

```json
{
  "id": "A1",
  "sourceText": "New synthetic variant: The recipient has repeatedly made nonurgent work calls after 8 p.m., despite the user previously stating a no-calls-after-8 limit. The user wants that same limit restated; no consequence is authorized. Intent: State the no-calls-after-8 limit. Draft: \"stop calling late\" → Improved: \"Please don't call about nonurgent work after 8 p.m.\"",
  "visibleContext": "The recipient has repeatedly made nonurgent work calls after 8 p.m., despite the user previously stating a no-calls-after-8 limit. The user wants that same limit restated; no consequence is authorized.",
  "userIntent": "State the no-calls-after-8 limit.",
  "action": "REWRITE_DRAFT",
  "language": {
    "primary": "en",
    "secondary": null,
    "codeSwitching": false
  },
  "expected": ["boundary_setting"],
  "acceptable": ["request"],
  "forbidden": [],
  "rationale": "Supply repeated pressure explicitly in a new scenario and keep the exact after-8 cutoff. Restate the actual limit clearly without shifting the cutoff, apologizing or adding a penalty. Authoring-only proposed replacement; not measured model output.",
  "category": "APPLICATION",
  "draft": "stop calling late",
  "improved": "Please don't call about nonurgent work after 8 p.m.",
  "ledger": {
    "facts": [
      "The recipient repeatedly makes nonurgent work calls after 8 p.m. despite the stated limit.",
      "The user's limit is no nonurgent work calls after 8 p.m."
    ],
    "commitments": [],
    "uncertainty": []
  }
}
```

### boundary_setting/A2

- Original: INVALID / REVISE.
- Type: SAME_INPUT_OUTPUT_REPAIR. Changed input fields: none.
- Exact changed fields (before/after values in JSON): sourceText, expected, acceptable, rationale, improved.
- Why: Remove invented inability and retain the independently chosen no-more-lending decision and stop request.
- Skill effect: State choice and scope directly while eliminating an unsupported excuse.
- Fresh assessment: KEEP / STRONG / HIGH confidence; BOTH_VALID. CODEX only.
- Replacement digest: sha256:3ee731db750abcd91cb9394ce1ed4d2b9a41b4cc64659ce3b1f5b1c94912fec1.

```json
{
  "id": "A2",
  "sourceText": "Corrected application: User has decided not to lend more money. User wants the repeated requests to stop. Intent: State no more lending and ask the recipient to stop requesting money. Draft: \"quit asking me for cash\" → Improved: \"I won't lend you any more money. Please stop asking.\"",
  "visibleContext": "User has decided not to lend more money. User wants the repeated requests to stop.",
  "userIntent": "State no more lending and ask the recipient to stop requesting money.",
  "action": "REWRITE_DRAFT",
  "language": {
    "primary": "en",
    "secondary": null,
    "codeSwitching": false
  },
  "expected": ["boundary_setting"],
  "acceptable": ["decline"],
  "forbidden": [],
  "rationale": "Remove invented inability and retain the independently chosen no-more-lending decision and stop request. State choice and scope directly while eliminating an unsupported excuse. Authoring-only proposed replacement; not measured model output.",
  "category": "APPLICATION",
  "draft": "quit asking me for cash",
  "improved": "I won't lend you any more money. Please stop asking.",
  "ledger": {
    "facts": [
      "User has decided not to lend more money.",
      "User wants the repeated requests to stop."
    ],
    "commitments": [],
    "uncertainty": []
  }
}
```

### de_escalation/H1

- Original: WEAK / QUARANTINE.
- Type: NEW_SYNTHETIC_VARIANT. Changed input fields: visibleContext, userIntent.
- Exact changed fields (before/after values in JSON): sourceText, visibleContext, userIntent, expected, acceptable, forbidden, rationale.
- Why: Add actual repetition while specifying that the chosen wording is already civil and has no unnecessary heat to reduce.
- Skill effect: Repeated pressure supports the boundary; it does not automatically require a second heat-reduction operation.
- Fresh assessment: KEEP / STRONG / HIGH confidence; NEIGHBOR_ONLY. CODEX only.
- Replacement digest: sha256:7595b62d07db0fee5c7e896a9054396d830d230d9ae6834732b063ff3ff4829a.
- Original question remains open: The original civil-limit case still lacks repetition; this variant does not broaden boundary_setting.

```json
{
  "id": "H1",
  "sourceText": "New synthetic variant: The recipient has made three polite requests for another loan after the user explicitly declined further lending. There are no insults or heated wording. The user wants only a concise, civil restatement of the continuing no-lending limit. Intent: Restate that I will not lend more money and ask for the repeated requests to stop; do not imply inability or add a concession.",
  "visibleContext": "The recipient has made three polite requests for another loan after the user explicitly declined further lending. There are no insults or heated wording. The user wants only a concise, civil restatement of the continuing no-lending limit.",
  "userIntent": "Restate that I will not lend more money and ask for the repeated requests to stop; do not imply inability or add a concession.",
  "action": "SUGGEST_REPLY",
  "language": {
    "primary": "en",
    "secondary": null,
    "codeSwitching": false
  },
  "expected": ["boundary_setting"],
  "acceptable": ["decline"],
  "forbidden": ["de_escalation"],
  "rationale": "Add actual repetition while specifying that the chosen wording is already civil and has no unnecessary heat to reduce. Repeated pressure supports the boundary; it does not automatically require a second heat-reduction operation. Authoring-only proposed replacement; not measured model output.",
  "category": "NEIGHBOR"
}
```

### de_escalation/H2

- Original: WEAK / REJECT.
- Type: NEW_SYNTHETIC_VARIANT. Changed input fields: visibleContext, userIntent.
- Exact changed fields (before/after values in JSON): sourceText, visibleContext, userIntent, expected, forbidden, rationale.
- Why: Replace an abstract multi-step playbook claim with a concrete settled-dispute coordination step.
- Skill effect: Earlier conflict alone does not justify de-escalation when the present job is agreed logistics.
- Fresh assessment: KEEP / STRONG / HIGH confidence; NEIGHBOR_ONLY. CODEX only.
- Replacement digest: sha256:3ce197514e6d7f3c763a1b3408d816424ca3b0480db6ac149d01b53907a35807.

```json
{
  "id": "H2",
  "sourceText": "New synthetic variant: Coworkers have resolved their earlier argument. They now explicitly agree that the user will send the corrected table and the coworker will review it. The current exchange is calm and the user only wants to restate those agreed roles. Intent: Restate who sends and who reviews the table, without reopening the disagreement or adding timing.",
  "visibleContext": "Coworkers have resolved their earlier argument. They now explicitly agree that the user will send the corrected table and the coworker will review it. The current exchange is calm and the user only wants to restate those agreed roles.",
  "userIntent": "Restate who sends and who reviews the table, without reopening the disagreement or adding timing.",
  "action": "SUGGEST_REPLY",
  "language": {
    "primary": "en",
    "secondary": null,
    "codeSwitching": false
  },
  "expected": ["planning"],
  "acceptable": [],
  "forbidden": ["de_escalation"],
  "rationale": "Replace an abstract multi-step playbook claim with a concrete settled-dispute coordination step. Earlier conflict alone does not justify de-escalation when the present job is agreed logistics. Authoring-only proposed replacement; not measured model output.",
  "category": "NEIGHBOR"
}
```

### de_escalation/A1

- Original: INVALID / REVISE.
- Type: SAME_INPUT_OUTPUT_REPAIR. Changed input fields: none.
- Exact changed fields (before/after values in JSON): sourceText, expected, acceptable, rationale, improved.
- Why: Remove the unsupported comparison of multiple totals while preserving the user's disputed-total stance and independently chosen joint check.
- Skill effect: Replace an accusation with the concrete disagreement and the same checking request.
- Fresh assessment: KEEP / STRONG / HIGH confidence; BOTH_VALID. CODEX only.
- Replacement digest: sha256:3e0b74966e1f457cafa019f46b1c228b60cc143c9a88127b9755bfb9c4d06a48.

```json
{
  "id": "A1",
  "sourceText": "Corrected application: User disputes the total. User wants to check the figures together. Intent: Dispute the total and request joint checking. Draft: \"your numbers are nonsense, check them\" → Improved: \"I disagree with this total. Can we check the figures together?\"",
  "visibleContext": "User disputes the total. User wants to check the figures together.",
  "userIntent": "Dispute the total and request joint checking.",
  "action": "REWRITE_DRAFT",
  "language": {
    "primary": "en",
    "secondary": null,
    "codeSwitching": false
  },
  "expected": ["de_escalation"],
  "acceptable": ["request"],
  "forbidden": [],
  "rationale": "Remove the unsupported comparison of multiple totals while preserving the user's disputed-total stance and independently chosen joint check. Replace an accusation with the concrete disagreement and the same checking request. Authoring-only proposed replacement; not measured model output.",
  "category": "APPLICATION",
  "draft": "your numbers are nonsense, check them",
  "improved": "I disagree with this total. Can we check the figures together?",
  "ledger": {
    "facts": ["User disputes the total.", "User wants to check the figures together."],
    "commitments": [],
    "uncertainty": []
  }
}
```

### de_escalation/A2

- Original: INVALID / REVISE.
- Type: SAME_INPUT_OUTPUT_REPAIR. Changed input fields: none.
- Exact changed fields (before/after values in JSON): sourceText, expected, acceptable, rationale, improved.
- Why: Remove invented difficulty and inability without changing the fixed refusal.
- Skill effect: Replace the personal attack with a calm restatement of the same no; no concession or explanation is added.
- Fresh assessment: KEEP / STRONG / HIGH confidence; BOTH_VALID. CODEX only.
- Replacement digest: sha256:e7626f2aeb46c561eaffdd2fb48e79754e1ace46c1d7369fe43054bb2f21933a.

```json
{
  "id": "A2",
  "sourceText": "Corrected application: User has refused the extra shift. The recipient is applying pressure. Intent: Maintain refusal of the extra shift despite pressure. Draft: \"stop being ridiculous, I said no\" → Improved: \"I've already said no. I won't take the extra shift.\"",
  "visibleContext": "User has refused the extra shift. The recipient is applying pressure.",
  "userIntent": "Maintain refusal of the extra shift despite pressure.",
  "action": "REWRITE_DRAFT",
  "language": {
    "primary": "en",
    "secondary": null,
    "codeSwitching": false
  },
  "expected": ["de_escalation"],
  "acceptable": ["decline"],
  "forbidden": [],
  "rationale": "Remove invented difficulty and inability without changing the fixed refusal. Replace the personal attack with a calm restatement of the same no; no concession or explanation is added. Authoring-only proposed replacement; not measured model output.",
  "category": "APPLICATION",
  "draft": "stop being ridiculous, I said no",
  "improved": "I've already said no. I won't take the extra shift.",
  "ledger": {
    "facts": ["User has refused the extra shift.", "The recipient is applying pressure."],
    "commitments": [],
    "uncertainty": []
  }
}
```

### follow_up/A1

- Original: WEAK / REVISE.
- Type: NEW_SYNTHETIC_VARIANT. Changed input fields: draft.
- Exact changed fields (before/after values in JSON): sourceText, expected, acceptable, rationale, draft, improved.
- Why: Use an update question in both draft and improvement instead of changing a request for an explanation into a progress check.
- Skill effect: Anchor the existing earlier request concisely without blame or invented overdue status.
- Fresh assessment: KEEP / STRONG / HIGH confidence; BOTH_VALID. CODEX only.
- Replacement digest: sha256:e7f231680b2497b86514e4ac397a6694fc6f53cd62f17d86cbb3c49faaad0b00.

```json
{
  "id": "A1",
  "sourceText": "New synthetic variant: An earlier request to review the report is visible. There is no evidence that silence means blame or neglect. Intent: Follow up on the report-review request. Draft: \"About the report I asked you to review, any update on that review request?\" → Improved: \"Is there an update on my report-review request?\"",
  "visibleContext": "An earlier request to review the report is visible. There is no evidence that silence means blame or neglect.",
  "userIntent": "Follow up on the report-review request.",
  "action": "REWRITE_DRAFT",
  "language": {
    "primary": "en",
    "secondary": null,
    "codeSwitching": false
  },
  "expected": ["follow_up"],
  "acceptable": ["request"],
  "forbidden": [],
  "rationale": "Use an update question in both draft and improvement instead of changing a request for an explanation into a progress check. Anchor the existing earlier request concisely without blame or invented overdue status. Authoring-only proposed replacement; not measured model output.",
  "category": "APPLICATION",
  "draft": "About the report I asked you to review, any update on that review request?",
  "improved": "Is there an update on my report-review request?",
  "ledger": {
    "facts": [
      "An earlier request to review the report is visible.",
      "There is no evidence that silence means blame or neglect."
    ],
    "commitments": [],
    "uncertainty": []
  }
}
```

### status_update/A1

- Original: WEAK / REVISE.
- Type: NEW_SYNTHETIC_VARIANT. Changed input fields: draft.
- Exact changed fields (before/after values in JSON): sourceText, expected, rationale, draft.
- Why: Replace the ambiguous review-later draft with explicit not-started status so no future plan disappears during rewriting.
- Skill effect: Separate completed drafting from pending review in a readable statement without inventing timing.
- Fresh assessment: KEEP / STRONG / HIGH confidence; FOCAL_ONLY. CODEX only.
- Replacement digest: sha256:61fbc39748bec001dc1ddafe90bcdfa65660573d2dd618d90f8b2ced22403659.

```json
{
  "id": "A1",
  "sourceText": "New synthetic variant: The draft is complete. The review has not started. Intent: Report the completed draft and pending review. Draft: \"draft done, review not started\" → Improved: \"The draft is complete; the review hasn't started yet.\"",
  "visibleContext": "The draft is complete. The review has not started.",
  "userIntent": "Report the completed draft and pending review.",
  "action": "REWRITE_DRAFT",
  "language": {
    "primary": "en",
    "secondary": null,
    "codeSwitching": false
  },
  "expected": ["status_update"],
  "acceptable": [],
  "forbidden": [],
  "rationale": "Replace the ambiguous review-later draft with explicit not-started status so no future plan disappears during rewriting. Separate completed drafting from pending review in a readable statement without inventing timing. Authoring-only proposed replacement; not measured model output.",
  "category": "APPLICATION",
  "draft": "draft done, review not started",
  "improved": "The draft is complete; the review hasn't started yet.",
  "ledger": {
    "facts": ["The draft is complete.", "The review has not started."],
    "commitments": [],
    "uncertainty": []
  }
}
```

### expectation_setting/H2

- Original: WEAK / QUARANTINE.
- Type: NEW_SYNTHETIC_VARIANT. Changed input fields: visibleContext, userIntent.
- Exact changed fields (before/after values in JSON): sourceText, visibleContext, userIntent, expected, acceptable, rationale.
- Why: Supply repeated pressure and a separate availability fact instead of claiming an exclusive boundary from an abstract contact rule.
- Skill effect: Both jobs are independently supported: protect the existing limit and state future availability.
- Fresh assessment: KEEP / STRONG / HIGH confidence; BOTH_VALID. CODEX only.
- Replacement digest: sha256:48dc30297346860b8cc3e0c048cf09015398103cedda9566e71bbb715c66adec.
- Original question remains open: The original generic ongoing-contact rule does not settle the boundary/expectation overlap; it remains quarantined.

```json
{
  "id": "H2",
  "sourceText": "New synthetic variant: A colleague has repeatedly requested nonurgent work calls after 8 p.m. despite the user's stated limit. The user will restate that limit and separately states availability for work calls from 9 a.m. to 5 p.m. Intent: Restate no nonurgent work calls after 8 p.m. and communicate availability from 9 a.m. to 5 p.m.",
  "visibleContext": "A colleague has repeatedly requested nonurgent work calls after 8 p.m. despite the user's stated limit. The user will restate that limit and separately states availability for work calls from 9 a.m. to 5 p.m.",
  "userIntent": "Restate no nonurgent work calls after 8 p.m. and communicate availability from 9 a.m. to 5 p.m.",
  "action": "SUGGEST_REPLY",
  "language": {
    "primary": "en",
    "secondary": null,
    "codeSwitching": false
  },
  "expected": ["boundary_setting", "expectation_setting"],
  "acceptable": [],
  "forbidden": [],
  "rationale": "Supply repeated pressure and a separate availability fact instead of claiming an exclusive boundary from an abstract contact rule. Both jobs are independently supported: protect the existing limit and state future availability. Authoring-only proposed replacement; not measured model output.",
  "category": "NEIGHBOR"
}
```

### expectation_setting/A2

- Original: WEAK / REVISE.
- Type: SAME_INPUT_OUTPUT_REPAIR. Changed input fields: none.
- Exact changed fields (before/after values in JSON): sourceText, expected, rationale, improved.
- Why: Restore the explicit maximum lost in the old improvement.
- Skill effect: Keep only attached to the one-chapter scope cap.
- Fresh assessment: KEEP / STRONG / HIGH confidence; FOCAL_ONLY. CODEX only.
- Replacement digest: sha256:0c642054ab583a3348fc2b1935d3121b52ebafe900b85f08b14f34bcd2d9b1da.

```json
{
  "id": "A2",
  "sourceText": "Corrected application: User can review one chapter this week. Intent: Limit this week's review to one chapter. Draft: \"can review it, one chapter only this week\" → Improved: \"I can review only one chapter this week.\"",
  "visibleContext": "User can review one chapter this week.",
  "userIntent": "Limit this week's review to one chapter.",
  "action": "REWRITE_DRAFT",
  "language": {
    "primary": "en",
    "secondary": null,
    "codeSwitching": false
  },
  "expected": ["expectation_setting"],
  "acceptable": [],
  "forbidden": [],
  "rationale": "Restore the explicit maximum lost in the old improvement. Keep only attached to the one-chapter scope cap. Authoring-only proposed replacement; not measured model output.",
  "category": "APPLICATION",
  "draft": "can review it, one chapter only this week",
  "improved": "I can review only one chapter this week.",
  "ledger": {
    "facts": ["User can review one chapter this week."],
    "commitments": ["Review is limited to one chapter this week."],
    "uncertainty": []
  }
}
```

### planning/H2

- Original: WEAK / QUARANTINE.
- Type: NEW_SYNTHETIC_VARIANT. Changed input fields: visibleContext, userIntent.
- Exact changed fields (before/after values in JSON): sourceText, visibleContext, userIntent, expected, forbidden, rationale.
- Why: Replace an underspecified verification case with a settled plan and explicit restatement intent.
- Skill effect: Restate supplied coordination details without creating a verification question.
- Fresh assessment: KEEP / STRONG / HIGH confidence; FOCAL_ONLY. CODEX only.
- Replacement digest: sha256:6785dce2448d35e07524abc9453da14e5abea371748f91dce4735407730df303.
- Original question remains open: The original consequential-verification versus planning distinction remains open; this settled-plan variant does not approve a confirmation candidate.

```json
{
  "id": "H2",
  "sourceText": "New synthetic variant: The recipient writes, \"Confirmed: Saturday at 2 p.m. at the library.\" The user accepts these agreed details and only wants to restate the plan; no detail remains uncertain. Intent: Restate the agreed Saturday 2 p.m. library meeting.",
  "visibleContext": "The recipient writes, \"Confirmed: Saturday at 2 p.m. at the library.\" The user accepts these agreed details and only wants to restate the plan; no detail remains uncertain.",
  "userIntent": "Restate the agreed Saturday 2 p.m. library meeting.",
  "action": "SUGGEST_REPLY",
  "language": {
    "primary": "en",
    "secondary": null,
    "codeSwitching": false
  },
  "expected": ["planning"],
  "acceptable": [],
  "forbidden": ["clarification"],
  "rationale": "Replace an underspecified verification case with a settled plan and explicit restatement intent. Restate supplied coordination details without creating a verification question. Authoring-only proposed replacement; not measured model output.",
  "category": "NEIGHBOR"
}
```

### clarification/H1

- Original: WEAK / QUARANTINE.
- Type: NEW_SYNTHETIC_VARIANT. Changed input fields: visibleContext, userIntent.
- Exact changed fields (before/after values in JSON): sourceText, visibleContext, userIntent, expected, acceptable, rationale.
- Why: Use an actually missing date instead of an apparently known Friday proposition.
- Skill effect: Ask for the missing detail without pretending Friday was supplied.
- Fresh assessment: KEEP / STRONG / HIGH confidence; BOTH_VALID. CODEX only.
- Replacement digest: sha256:fd9b39d5fe1b43e4acf80f3bd98f973b21d7968527ff5a1bfa07461034269993.
- Original question remains open: The original known-proposition verification boundary remains quarantined; this missing-information variant does not resolve it.

```json
{
  "id": "H1",
  "sourceText": "New synthetic variant: The recipient asks, \"Please finish the report soon.\" No due date is given. The user needs that date before arranging the dependent review and has chosen to ask for it. Intent: Ask for the report's exact due date.",
  "visibleContext": "The recipient asks, \"Please finish the report soon.\" No due date is given. The user needs that date before arranging the dependent review and has chosen to ask for it.",
  "userIntent": "Ask for the report's exact due date.",
  "action": "SUGGEST_REPLY",
  "language": {
    "primary": "en",
    "secondary": null,
    "codeSwitching": false
  },
  "expected": ["clarification"],
  "acceptable": ["request"],
  "forbidden": [],
  "rationale": "Use an actually missing date instead of an apparently known Friday proposition. Ask for the missing detail without pretending Friday was supplied. Authoring-only proposed replacement; not measured model output.",
  "category": "NEIGHBOR"
}
```

### clarification/A1

- Original: WEAK / REVISE.
- Type: NEW_SYNTHETIC_VARIANT. Changed input fields: visibleContext, ledger.
- Exact changed fields (before/after values in JSON): sourceText, visibleContext, expected, rationale, improved, ledger.
- Why: Use a separately labeled generic two-report scenario. Sales/budget are grounded in the original visibleContext, but the new scenario avoids its sourceText expansion concern.
- Skill effect: Make the two-way ambiguity explicit without inventing report names.
- Fresh assessment: KEEP / ACCEPTABLE / HIGH confidence; FOCAL_ONLY. CODEX only.
- Replacement digest: sha256:7fc2fe97cb4411821c81f3d7194330d914a7e7f567339d5152e39825c89db52c.

```json
{
  "id": "A1",
  "sourceText": "New synthetic variant: Two reports are plausible. The intended report is unknown. Intent: Ask which of two reports is meant. Draft: \"which report do you mean\" → Improved: \"Which of the two reports do you mean?\"",
  "visibleContext": "Two reports are plausible. The intended report is unknown.",
  "userIntent": "Ask which of two reports is meant.",
  "action": "REWRITE_DRAFT",
  "language": {
    "primary": "en",
    "secondary": null,
    "codeSwitching": false
  },
  "expected": ["clarification"],
  "acceptable": [],
  "forbidden": [],
  "rationale": "Use a separately labeled generic two-report scenario. Sales/budget are grounded in the original visibleContext, but the new scenario avoids its sourceText expansion concern. Make the two-way ambiguity explicit without inventing report names. Authoring-only proposed replacement; not measured model output.",
  "category": "APPLICATION",
  "draft": "which report do you mean",
  "improved": "Which of the two reports do you mean?",
  "ledger": {
    "facts": ["Two reports are plausible.", "The intended report is unknown."],
    "commitments": [],
    "uncertainty": ["Which report is intended is unresolved."]
  }
}
```

### en.professional_conciseness/P3

- Original: WEAK / REVISE.
- Type: NEW_SYNTHETIC_VARIANT. Changed input fields: visibleContext, userIntent.
- Exact changed fields (before/after values in JSON): sourceText, visibleContext, userIntent, acceptable, rationale.
- Why: Supply a concrete earlier request and an explicit register preference.
- Skill effect: Use compact professional wording without ceremonial opening or invented lateness.
- Fresh assessment: KEEP / STRONG / HIGH confidence; BOTH_VALID. CODEX only.
- Replacement digest: sha256:78463f6ff2108addd6295191004cdbb9cdc6f4e5ed515ef34d66773acb6d3c47.

```json
{
  "id": "P3",
  "sourceText": "New synthetic variant: In an English work chat, the user previously wrote, \"Could you review the report?\" No review update is visible. The user requests a concise professional follow-up without an email-style opening; no missed deadline is stated. Intent: Ask for an update on the report-review request in concise professional chat wording.",
  "visibleContext": "In an English work chat, the user previously wrote, \"Could you review the report?\" No review update is visible. The user requests a concise professional follow-up without an email-style opening; no missed deadline is stated.",
  "userIntent": "Ask for an update on the report-review request in concise professional chat wording.",
  "action": "SUGGEST_REPLY",
  "language": {
    "primary": "en",
    "secondary": null,
    "codeSwitching": false
  },
  "expected": ["en.professional_conciseness"],
  "acceptable": ["follow_up", "request"],
  "forbidden": [],
  "rationale": "Supply a concrete earlier request and an explicit register preference. Use compact professional wording without ceremonial opening or invented lateness. Authoring-only proposed replacement; not measured model output.",
  "category": "POSITIVE"
}
```

### en.casual_naturalness/P3

- Original: WEAK / REVISE.
- Type: NEW_SYNTHETIC_VARIANT. Changed input fields: visibleContext, userIntent.
- Exact changed fields (before/after values in JSON): sourceText, visibleContext, userIntent, acceptable, rationale.
- Why: Make the casual preference explicit rather than infer it from weekend timing.
- Skill effect: Express the fixed meeting details naturally without adding familiarity or facts.
- Fresh assessment: KEEP / STRONG / HIGH confidence; BOTH_VALID. CODEX only.
- Replacement digest: sha256:79398e9da9cc0405c6eaf98a5c7845d233080ad687a22f77e0e0e6dd4f60fb85.

```json
{
  "id": "P3",
  "sourceText": "New synthetic variant: In an English chat, both people agreed to meet Saturday at 2 p.m. at the library. The user explicitly wants a brief conversational restatement with no formal greeting. Intent: Restate the agreed meeting in brief conversational wording.",
  "visibleContext": "In an English chat, both people agreed to meet Saturday at 2 p.m. at the library. The user explicitly wants a brief conversational restatement with no formal greeting.",
  "userIntent": "Restate the agreed meeting in brief conversational wording.",
  "action": "SUGGEST_REPLY",
  "language": {
    "primary": "en",
    "secondary": null,
    "codeSwitching": false
  },
  "expected": ["en.casual_naturalness"],
  "acceptable": ["planning"],
  "forbidden": [],
  "rationale": "Make the casual preference explicit rather than infer it from weekend timing. Express the fixed meeting details naturally without adding familiarity or facts. Authoring-only proposed replacement; not measured model output.",
  "category": "POSITIVE"
}
```

### en.direct_but_polite/P2

- Original: WEAK / REVISE.
- Type: NEW_SYNTHETIC_VARIANT. Changed input fields: visibleContext, userIntent.
- Exact changed fields (before/after values in JSON): sourceText, visibleContext, userIntent, acceptable, rationale.
- Why: Fix a concrete requested action and explicit expression goal.
- Skill effect: Make the ask direct while preserving respectful wording and the absence of urgency.
- Fresh assessment: KEEP / STRONG / HIGH confidence; BOTH_VALID. CODEX only.
- Replacement digest: sha256:df52036dfa389cec852057e4ac5f593badbea20e2b5df36229cf90654a023f99.

```json
{
  "id": "P2",
  "sourceText": "New synthetic variant: The recipient says, \"I have the meeting agenda file.\" The user has chosen to ask them to send it and wants an explicit, respectful request rather than an order. No deadline or urgency is supplied. Intent: Ask for the agenda file clearly and respectfully, without adding urgency.",
  "visibleContext": "The recipient says, \"I have the meeting agenda file.\" The user has chosen to ask them to send it and wants an explicit, respectful request rather than an order. No deadline or urgency is supplied.",
  "userIntent": "Ask for the agenda file clearly and respectfully, without adding urgency.",
  "action": "SUGGEST_REPLY",
  "language": {
    "primary": "en",
    "secondary": null,
    "codeSwitching": false
  },
  "expected": ["en.direct_but_polite"],
  "acceptable": ["request"],
  "forbidden": [],
  "rationale": "Fix a concrete requested action and explicit expression goal. Make the ask direct while preserving respectful wording and the absence of urgency. Authoring-only proposed replacement; not measured model output.",
  "category": "POSITIVE"
}
```

### en.direct_but_polite/H1

- Original: WEAK / REVISE.
- Type: NEW_SYNTHETIC_VARIANT. Changed input fields: visibleContext, userIntent.
- Exact changed fields (before/after values in JSON): sourceText, visibleContext, userIntent, expected, acceptable, forbidden, rationale.
- Why: Supply actual progress and explicit professional register.
- Skill effect: Professional concision has useful work; direct-but-polite has no request, refusal or limit to shape.
- Fresh assessment: KEEP / STRONG / HIGH confidence; NEIGHBOR_ONLY. CODEX only.
- Replacement digest: sha256:06b8d96137e247da394e72ea5c084a8a6f53b0565e77a8a1bf944c1949409276.

```json
{
  "id": "H1",
  "sourceText": "New synthetic variant: In an English work chat, two report sections are complete and one remains unfinished. The user explicitly wants a concise professional progress report only, with no request, refusal or limit. Intent: Report the supplied progress in concise professional wording.",
  "visibleContext": "In an English work chat, two report sections are complete and one remains unfinished. The user explicitly wants a concise professional progress report only, with no request, refusal or limit.",
  "userIntent": "Report the supplied progress in concise professional wording.",
  "action": "SUGGEST_REPLY",
  "language": {
    "primary": "en",
    "secondary": null,
    "codeSwitching": false
  },
  "expected": ["en.professional_conciseness"],
  "acceptable": ["status_update"],
  "forbidden": ["en.direct_but_polite"],
  "rationale": "Supply actual progress and explicit professional register. Professional concision has useful work; direct-but-polite has no request, refusal or limit to shape. Authoring-only proposed replacement; not measured model output.",
  "category": "NEIGHBOR"
}
```

### en.direct_but_polite/A1

- Original: INVALID / REVISE.
- Type: SAME_INPUT_OUTPUT_REPAIR. Changed input fields: none.
- Exact changed fields (before/after values in JSON): sourceText, expected, acceptable, rationale, improved.
- Why: Remove invented inability while retaining the chosen refusal.
- Skill effect: Make the refusal complete and civil without replacing will not with cannot.
- Fresh assessment: KEEP / STRONG / HIGH confidence; BOTH_VALID. CODEX only.
- Replacement digest: sha256:156e2c12639efb63ec4b361bc4b8f5bbb2bebbed482e89f1f5135bb322c319ba.

```json
{
  "id": "A1",
  "sourceText": "Corrected application: User will not take the extra task. Intent: Refuse the extra task. Draft: \"No, not doing that extra task\" → Improved: \"No, I won't take on that extra task.\"",
  "visibleContext": "User will not take the extra task.",
  "userIntent": "Refuse the extra task.",
  "action": "REWRITE_DRAFT",
  "language": {
    "primary": "en",
    "secondary": null,
    "codeSwitching": false
  },
  "expected": ["en.direct_but_polite"],
  "acceptable": ["decline"],
  "forbidden": [],
  "rationale": "Remove invented inability while retaining the chosen refusal. Make the refusal complete and civil without replacing will not with cannot. Authoring-only proposed replacement; not measured model output.",
  "category": "APPLICATION",
  "draft": "No, not doing that extra task",
  "improved": "No, I won't take on that extra task.",
  "ledger": {
    "facts": ["User will not take the extra task."],
    "commitments": [],
    "uncertainty": []
  }
}
```

### zh.politeness_calibration/H1

- Original: WEAK / REVISE.
- Type: NEW_SYNTHETIC_VARIANT. Changed input fields: visibleContext, userIntent.
- Exact changed fields (before/after values in JSON): sourceText, visibleContext, userIntent, expected, acceptable, forbidden, rationale.
- Why: Ground the professional modifier in an explicit preference, not in Chinese or progress alone.
- Skill effect: Use concise work-chat register; there is no request, refusal or limit requiring politeness calibration.
- Fresh assessment: KEEP / STRONG / HIGH confidence; NEIGHBOR_ONLY. CODEX only.
- Replacement digest: sha256:7367a8b2e77791be135201fdcec29df906e212f5c5ac4fab9058daa1390aa9fc.

```json
{
  "id": "H1",
  "sourceText": "New synthetic variant: 中文工作聊天中，已知初稿完成、复核尚未开始。用户明确要求简洁、专业地汇报进展，不提出请求、拒绝或界限。 Intent: 用简洁专业的中文汇报初稿完成、复核尚未开始。",
  "visibleContext": "中文工作聊天中，已知初稿完成、复核尚未开始。用户明确要求简洁、专业地汇报进展，不提出请求、拒绝或界限。",
  "userIntent": "用简洁专业的中文汇报初稿完成、复核尚未开始。",
  "action": "SUGGEST_REPLY",
  "language": {
    "primary": "zh",
    "secondary": null,
    "codeSwitching": false
  },
  "expected": ["zh.professional_formality"],
  "acceptable": ["status_update"],
  "forbidden": ["zh.politeness_calibration"],
  "rationale": "Ground the professional modifier in an explicit preference, not in Chinese or progress alone. Use concise work-chat register; there is no request, refusal or limit requiring politeness calibration. Authoring-only proposed replacement; not measured model output.",
  "category": "NEIGHBOR"
}
```

### zh.professional_formality/P1

- Original: WEAK / REVISE.
- Type: NEW_SYNTHETIC_VARIANT. Changed input fields: visibleContext, userIntent.
- Exact changed fields (before/after values in JSON): sourceText, visibleContext, userIntent, acceptable, rationale.
- Why: Supply concrete progress and a visible register goal.
- Skill effect: Professional Chinese keeps both status facts without bureaucratic filler or new dates.
- Fresh assessment: KEEP / STRONG / HIGH confidence; BOTH_VALID. CODEX only.
- Replacement digest: sha256:99876f3a0b260cb41cf3936862a2ccc8957144a2b6e2b7f04ac20e76ff2bae60.

```json
{
  "id": "P1",
  "sourceText": "New synthetic variant: 简体中文工作聊天中，初稿已完成，复核尚未开始。用户明确要求简洁专业的进度汇报，不使用公文套话，也不承诺完成日期。 Intent: 用简洁专业的简体中文汇报已知进展。",
  "visibleContext": "简体中文工作聊天中，初稿已完成，复核尚未开始。用户明确要求简洁专业的进度汇报，不使用公文套话，也不承诺完成日期。",
  "userIntent": "用简洁专业的简体中文汇报已知进展。",
  "action": "SUGGEST_REPLY",
  "language": {
    "primary": "zh-Hans",
    "secondary": null,
    "codeSwitching": false
  },
  "expected": ["zh.professional_formality"],
  "acceptable": ["status_update"],
  "forbidden": [],
  "rationale": "Supply concrete progress and a visible register goal. Professional Chinese keeps both status facts without bureaucratic filler or new dates. Authoring-only proposed replacement; not measured model output.",
  "category": "POSITIVE"
}
```

### zh.professional_formality/P2

- Original: WEAK / REVISE.
- Type: NEW_SYNTHETIC_VARIANT. Changed input fields: visibleContext, userIntent.
- Exact changed fields (before/after values in JSON): sourceText, visibleContext, userIntent, acceptable, rationale.
- Why: Replace the vague accountability cue with explicit responsibility, status and register.
- Skill effect: Keep ownership and supplied progress in professional chat wording without adding an excuse or promise.
- Fresh assessment: KEEP / STRONG / HIGH confidence; BOTH_VALID. CODEX only.
- Replacement digest: sha256:fb4b83ed9cfa27fb746b396aa7bca3e22b3b363de4f12958b715370f5bd6cb68.

```json
{
  "id": "P2",
  "sourceText": "New synthetic variant: 繁體中文工作聊天中，使用者昨天未交付已承諾的初稿。目前兩節中完成了一節。使用者要承認未履約並交代現況，明確要求簡潔專業，不提供藉口或新的交付日期。 Intent: 以簡潔專業的繁體中文承認昨天未交付已承諾的初稿，並說明兩節中完成一節。",
  "visibleContext": "繁體中文工作聊天中，使用者昨天未交付已承諾的初稿。目前兩節中完成了一節。使用者要承認未履約並交代現況，明確要求簡潔專業，不提供藉口或新的交付日期。",
  "userIntent": "以簡潔專業的繁體中文承認昨天未交付已承諾的初稿，並說明兩節中完成一節。",
  "action": "SUGGEST_REPLY",
  "language": {
    "primary": "zh-Hant",
    "secondary": null,
    "codeSwitching": false
  },
  "expected": ["zh.professional_formality"],
  "acceptable": ["acknowledge_mistake", "status_update"],
  "forbidden": [],
  "rationale": "Replace the vague accountability cue with explicit responsibility, status and register. Keep ownership and supplied progress in professional chat wording without adding an excuse or promise. Authoring-only proposed replacement; not measured model output.",
  "category": "POSITIVE"
}
```

### zh.professional_formality/H2

- Original: WEAK / REVISE.
- Type: NEW_SYNTHETIC_VARIANT. Changed input fields: visibleContext, userIntent.
- Exact changed fields (before/after values in JSON): sourceText, visibleContext, userIntent, expected, acceptable, forbidden, rationale.
- Why: Choose a single concrete request rather than a generic request-or-refusal alternative.
- Skill effect: Calibrate a personal request's politeness without imposing professional register.
- Fresh assessment: KEEP / STRONG / HIGH confidence; NEIGHBOR_ONLY. CODEX only.
- Replacement digest: sha256:6bc69f3f595278025a2c7cb834cdc3540af3c79d85b564a4e593944261de76a5.

```json
{
  "id": "H2",
  "sourceText": "New synthetic variant: 中文私人聊天中，朋友说「文件在我这里」。用户已决定请朋友把文件发来，要求礼貌但不使用工作汇报或公文语气，没有提出期限。 Intent: 礼貌地请朋友把文件发来，不添加期限。",
  "visibleContext": "中文私人聊天中，朋友说「文件在我这里」。用户已决定请朋友把文件发来，要求礼貌但不使用工作汇报或公文语气，没有提出期限。",
  "userIntent": "礼貌地请朋友把文件发来，不添加期限。",
  "action": "SUGGEST_REPLY",
  "language": {
    "primary": "zh",
    "secondary": null,
    "codeSwitching": false
  },
  "expected": ["zh.politeness_calibration", "request"],
  "acceptable": [],
  "forbidden": ["zh.professional_formality"],
  "rationale": "Choose a single concrete request rather than a generic request-or-refusal alternative. Calibrate a personal request's politeness without imposing professional register. Authoring-only proposed replacement; not measured model output.",
  "category": "NEIGHBOR"
}
```

### zh.natural_conciseness/P2

- Original: WEAK / REVISE.
- Type: NEW_SYNTHETIC_VARIANT. Changed input fields: visibleContext, userIntent.
- Exact changed fields (before/after values in JSON): sourceText, visibleContext, userIntent, acceptable, rationale.
- Why: Fix the invitation decision before applying the expression modifier.
- Skill effect: Keep the chosen refusal brief and natural without inventing reasons or an alternative.
- Fresh assessment: KEEP / STRONG / HIGH confidence; BOTH_VALID. CODEX only.
- Replacement digest: sha256:105b68c6b373217623e83def1bf4bfbd10d2e14572b1d9e5ff9b512779450e09.

```json
{
  "id": "P2",
  "sourceText": "New synthetic variant: 繁體中文私人聊天中，朋友問「週六要一起吃晚餐嗎？」使用者已決定婉拒，明確要求簡短自然的回覆，不提供理由，也不提出另一個時間。 Intent: 以簡短自然的繁體中文婉拒週六晚餐邀請，不添加理由或改期。",
  "visibleContext": "繁體中文私人聊天中，朋友問「週六要一起吃晚餐嗎？」使用者已決定婉拒，明確要求簡短自然的回覆，不提供理由，也不提出另一個時間。",
  "userIntent": "以簡短自然的繁體中文婉拒週六晚餐邀請，不添加理由或改期。",
  "action": "SUGGEST_REPLY",
  "language": {
    "primary": "zh-Hant",
    "secondary": null,
    "codeSwitching": false
  },
  "expected": ["zh.natural_conciseness"],
  "acceptable": ["decline"],
  "forbidden": [],
  "rationale": "Fix the invitation decision before applying the expression modifier. Keep the chosen refusal brief and natural without inventing reasons or an alternative. Authoring-only proposed replacement; not measured model output.",
  "category": "POSITIVE"
}
```

### zh.natural_conciseness/H2

- Original: WEAK / REVISE.
- Type: NEW_SYNTHETIC_VARIANT. Changed input fields: visibleContext, userIntent.
- Exact changed fields (before/after values in JSON): sourceText, visibleContext, userIntent, expected, acceptable, rationale.
- Why: Supply both actual redundant request content and a term already used in the conversation.
- Skill effect: Remove duplicated request wording while preserving the intentional mixed term; both modifiers have independent work.
- Fresh assessment: KEEP / STRONG / HIGH confidence; BOTH_VALID. CODEX only.
- Replacement digest: sha256:504a00e89efba737f3ed4106e417c721115ca0cc7096b8d4456b6524f3cd4e63.

```json
{
  "id": "H2",
  "sourceText": "New synthetic variant: 中文聊天中，对方说「design review 纪要已整理好」。用户已决定索取纪要，要表达「请把 design review 纪要发来，就是想请你发一下这份纪要」，并要求去掉重复，保留双方已经使用的 design review。 Intent: 简洁地请求对方发送 design review 纪要，保留已有英文术语，不重复请求。",
  "visibleContext": "中文聊天中，对方说「design review 纪要已整理好」。用户已决定索取纪要，要表达「请把 design review 纪要发来，就是想请你发一下这份纪要」，并要求去掉重复，保留双方已经使用的 design review。",
  "userIntent": "简洁地请求对方发送 design review 纪要，保留已有英文术语，不重复请求。",
  "action": "SUGGEST_REPLY",
  "language": {
    "primary": "zh",
    "secondary": "en",
    "codeSwitching": true
  },
  "expected": ["zh.natural_conciseness", "zh.code_switching"],
  "acceptable": ["request"],
  "forbidden": [],
  "rationale": "Supply both actual redundant request content and a term already used in the conversation. Remove duplicated request wording while preserving the intentional mixed term; both modifiers have independent work. Authoring-only proposed replacement; not measured model output.",
  "category": "NEIGHBOR"
}
```

### zh.code_switching/H1

- Original: WEAK / REVISE.
- Type: NEW_SYNTHETIC_VARIANT. Changed input fields: visibleContext, userIntent.
- Exact changed fields (before/after values in JSON): sourceText, visibleContext, userIntent, expected, acceptable, forbidden, rationale.
- Why: Supply real repetition in a purely Chinese chosen response instead of an already-short example.
- Skill effect: Concision removes redundant framing; no mixed term exists to preserve.
- Fresh assessment: KEEP / STRONG / HIGH confidence; NEIGHBOR_ONLY. CODEX only.
- Replacement digest: sha256:4bf537a8109468bbb8cf0e79e3c727d690d8e14051bdbfabf41ac2ada41a066b.

```json
{
  "id": "H1",
  "sourceText": "New synthetic variant: 纯中文聊天中，双方已约定周六下午两点在图书馆见面。用户想表达「关于我们约好的见面，我想说的是周六下午两点在图书馆见，就按这个约好的时间地点见」，要求删去重复，自然简短地重述安排。对话中没有英文术语。 Intent: 用自然简短的中文重述周六下午两点在图书馆见面的约定，不添加英文。",
  "visibleContext": "纯中文聊天中，双方已约定周六下午两点在图书馆见面。用户想表达「关于我们约好的见面，我想说的是周六下午两点在图书馆见，就按这个约好的时间地点见」，要求删去重复，自然简短地重述安排。对话中没有英文术语。",
  "userIntent": "用自然简短的中文重述周六下午两点在图书馆见面的约定，不添加英文。",
  "action": "SUGGEST_REPLY",
  "language": {
    "primary": "zh",
    "secondary": null,
    "codeSwitching": false
  },
  "expected": ["zh.natural_conciseness"],
  "acceptable": ["planning"],
  "forbidden": ["zh.code_switching"],
  "rationale": "Supply real repetition in a purely Chinese chosen response instead of an already-short example. Concision removes redundant framing; no mixed term exists to preserve. Authoring-only proposed replacement; not measured model output.",
  "category": "NEIGHBOR"
}
```

## Verification

Artifact schema and integrity checks passed before delivery: exact 35-key coverage; all full replacements validated in the existing AuthoringRecordSchema; unchanged action/language/category/key; all skill IDs from the frozen 21; six identical-input repairs; 29 disclosed synthetic-input changes; all source, original-row and replacement digests; all six original quarantine questions retained; current sourceText matches each new scenario and application pair; all 172 starting files byte-identical. These automated checks validate structure and bindings; semantic ratings above are manual CODEX assessments.

### Commands and results

All commands ran in the `skills` worktree, `C:\Users\b\Documents\ChatGPT\AI messager-skills`.

| Command                                                                                                                                                                   | Result                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm exec prettier --write --ignore-path .gitignore docs/skills/phase-8-weak-invalid-remediation.md packages/skills/tests/fixtures/phase8/weak-invalid-remediation.json` | Pass; only the two new artifacts formatted.                                                                                                                      |
| `pnpm lint`                                                                                                                                                               | Pass; includes fresh-registry verification.                                                                                                                      |
| `pnpm typecheck`                                                                                                                                                          | Pass; all workspace packages.                                                                                                                                    |
| `pnpm test`                                                                                                                                                               | Initial sandbox invocation failed with EPERM creating Vitest's temporary config; exact retry with authorized worktree access passed: 28 files, 377 tests.        |
| `pnpm build`                                                                                                                                                              | Pass; all workspace packages and desktop bundles.                                                                                                                |
| `pnpm format:check`                                                                                                                                                       | Pass.                                                                                                                                                            |
| `pnpm exec prettier --check --ignore-path .gitignore docs/skills/phase-8-weak-invalid-remediation.md packages/skills/tests/fixtures/phase8/weak-invalid-remediation.json` | Pass; explicitly covers documentation excluded by the root formatter.                                                                                            |
| `git -c core.safecrlf=false diff --check`                                                                                                                                 | Pass.                                                                                                                                                            |
| PowerShell here-string audit below piped to `node --import tsx --input-type=module`                                                                                       | Pass: 35 replacements, all schemas/bindings, unchanged 172 files and 21 runtime definitions, only these two new files, matching full Markdown/JSON replacements. |

No test code was added: this is an artifact-only change. Existing tests check repository boundaries; the separate audit checks the new artifact's coverage, schema and provenance. The acceptance scope is complete for the 35 proposed replacements; publication, human example approval and original quarantine adjudication remain separate.

The targeted Prettier check initially could not resolve the worktree binary in the sandbox. The exact command succeeded with authorized worktree access. This was an environment invocation issue, not a formatting failure.

### Reproduce the artifact audit

Run the following in PowerShell from the skills worktree. It reads files only.

```powershell
@'
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { loadAuthoringRegistry, contentDigest } from "./packages/skills/authoring/generator.ts";
import { AuthoringRecordSchema } from "./packages/skills/authoring/schema.ts";
const artifactPath="packages/skills/tests/fixtures/phase8/weak-invalid-remediation.json";
const reportPath="docs/skills/phase-8-weak-invalid-remediation.md";
const data=JSON.parse(readFileSync(artifactPath,"utf8"));
const review=JSON.parse(readFileSync(data.sourceReview.path,"utf8"));
const {records,registry}=await loadAuthoringRegistry();
const raw=p=>createHash("sha256").update(readFileSync(p)).digest("hex");
assert.equal(registry.length,21);
assert.equal(contentDigest(registry),"sha256:c96fc9c9a5b26909ecf635bbae3ebef28abf15ed4729216cc28caf7698ad1ee3");
assert.equal(raw(data.sourceReview.path),data.sourceReview.rawSha256);
assert.equal(raw(data.sourceReview.reportPath),data.sourceReview.reportRawSha256);
assert.equal(Object.keys(data.startingFiles).length,172);
for(const [p,h] of Object.entries(data.startingFiles)) assert.equal(raw(p),h,p);
const current=execFileSync("git",["ls-files","--cached","--others","--exclude-standard","-z"],{encoding:"utf8"}).split("\0").filter(Boolean);
assert.deepEqual([...new Set(current)].filter(p=>!(p in data.startingFiles)).sort(),[artifactPath,reportPath].sort());
const targets=review.rows.filter(r=>["WEAK","INVALID"].includes(r.quality));
assert.equal(targets.length,35);
assert.equal(new Set(data.rows.map(r=>r.key)).size,35);
assert.deepEqual(data.rows.map(r=>r.key).sort(),targets.map(r=>r.key).sort());
assert.equal(data.rows.filter(r=>r.originalQuality==="WEAK").length,28);
assert.equal(data.rows.filter(r=>r.originalQuality==="INVALID").length,7);
assert.equal(data.rows.filter(r=>r.originalDecision==="REJECT").length,4);
assert.equal(data.rows.filter(r=>r.originalDecision==="QUARANTINE").length,6);
assert.equal(data.rows.filter(r=>r.remediationKind==="SAME_INPUT_OUTPUT_REPAIR").length,6);
assert.equal(data.rows.filter(r=>r.remediationKind==="NEW_SYNTHETIC_VARIANT").length,29);
const marker=String.fromCharCode(96).repeat(3);
const report=readFileSync(reportPath,"utf8");
const printed=[...report.matchAll(new RegExp(marker+"json\\s*([\\s\\S]*?)"+marker,"g"))].map(m=>JSON.parse(m[1]));
assert.equal(printed.length,35);
for(const [index,row] of data.rows.entries()){
 const old=targets.find(r=>r.key===row.key);
 const record=records.find(r=>r.definition.id===old.skillId);
 const example=row.replacement;
 assert.equal(row.originalQuality,old.quality);
 assert.equal(row.originalDecision,old.decision);
 assert.equal(contentDigest(old),row.originalBinding.reviewRowDigest);
 assert.equal(row.originalBinding.reviewRawSha256,data.sourceReview.rawSha256);
 for(const [k,v] of Object.entries(old.source)) assert.deepEqual(row.originalBinding[k],v);
 assert.deepEqual(row.originalExample,old.originalExample);
 assert.equal(contentDigest(row.originalExample),row.originalBinding.exampleDigest);
 assert.equal(contentDigest(record.definition),row.originalBinding.definitionDigest);
 assert.equal(contentDigest(record),row.originalBinding.recordDigest);
 assert.equal(raw(row.originalBinding.path),row.originalBinding.rawSha256);
 assert.equal(contentDigest(example),row.replacementDigest);
 assert.deepEqual(printed[index],example);
 assert.equal(row.key,old.skillId+"/"+example.id);
 for(const field of ["id","category","action","language"]) assert.deepEqual(example[field],row.originalExample[field]);
 const changed=Object.keys(example).filter(k=>JSON.stringify(example[k])!==JSON.stringify(row.originalExample[k]));
 assert.deepEqual(row.changes,Object.fromEntries(changed.map(k=>[k,{before:row.originalExample[k],after:example[k]}])));
 assert.deepEqual(row.changedInputFields,["visibleContext","userIntent","draft","ledger"].filter(k=>changed.includes(k)));
 if(row.remediationKind==="SAME_INPUT_OUTPUT_REPAIR") assert.equal(row.changedInputFields.length,0);
 else assert.ok(row.changedInputFields.length>0);
 assert.ok(example.sourceText.includes(example.visibleContext));
 assert.ok(example.sourceText.includes(example.userIntent));
 if(example.category==="APPLICATION"){
  assert.ok(example.sourceText.includes(JSON.stringify(example.draft)));
  assert.ok(example.sourceText.includes(JSON.stringify(example.improved)));
 }
 const copy=structuredClone(record);
 const list=example.category==="APPLICATION"?copy.examples.application:copy.examples.selection;
 list[list.findIndex(e=>e.id===example.id)]=example;
 AuthoringRecordSchema.parse(copy);
 for(const id of [...example.expected,...example.acceptable,...example.forbidden]) assert.ok(registry.some(s=>s.id===id));
 const supported=[...example.expected,...example.acceptable];
 const focal=supported.includes(old.skillId),other=supported.some(x=>x!==old.skillId);
 assert.equal(row.freshAssessment.neighborDecision,focal?(other?"BOTH_VALID":"FOCAL_ONLY"):(other?"NEIGHBOR_ONLY":"NEITHER"));
 assert.equal(row.freshAssessment.humanApproval,false);
 if(old.decision==="QUARANTINE") assert.ok(row.unresolvedOriginalQuestion);
}
const get=key=>data.rows.find(r=>r.key===key).replacement;
assert.equal(get("de_escalation/A1").improved,"I disagree with this total. Can we check the figures together?");
assert.equal(get("en.direct_but_polite/A1").improved,"No, I won't take on that extra task.");
assert.equal(get("boundary_setting/A2").improved,"I won't lend you any more money. Please stop asking.");
assert.equal(get("expectation_setting/A2").improved,"I can review only one chapter this week.");
assert.equal(get("reassurance/A1").improved,"I'll be attending too.");
assert.equal(get("reassurance/A2").improved,"There's a backup, though we don't yet know what can be restored.");
console.log("PASS: exact 35 targets; 35 valid/full/digest-bound replacements; 6 same-input + 29 synthetic; 172 existing files unchanged; only 2 new files; runtime 21 unchanged; Markdown/JSON agree.");
'@ | node --import tsx --input-type=module
```

## Limitations and next step

The six original quarantine questions remain unresolved. Their new concrete variants are usable proposals under the frozen definitions, not adjudication of the old cases. No replacement has been installed into canonical YAML. No new approval schema or test code was added. The next step is the user's review of these 35 proposals and the other 175 examples; Phase 8B remains outside this task.
