# Phase 8A calibration packet

**Policy update (2026-09-19):** The user's full Codex semantic-review task supersedes this preparation document's requirement for manual review of every example. See [the semantic review](phase-8-codex-semantic-review.md) for actual Codex decisions, exact proposed revisions and focused human escalation/audit. This document remains the historical preparation record; pending human fields do not mean the later Codex review is unperformed. Runtime/YAML approvals remain unchanged.

Status: proposed for human review; no human decisions. Updated: 2026-09-19.

Read the [review workflow and rubric proposal](phase-8-example-review.md) first. This packet exposes N1, H1 and A1 from all 21 definitions: **63 original cases**, not 63 approved examples. Consult each linked YAML definition and its neighbors before judging the case. Full digests in the [machine ledger](../../packages/skills/tests/fixtures/phase8/example-review-ledger.json) bind the excerpt, definition, entire record and source bytes.

For each case record evidence validity, focal/neighbor boundary, authoring-specification versus actual routing, disposition, rationale and allowed future use. Record real reviewer identity, competence, date and independent second review/adjudication where required. The fields below remain pending. Do not infer a global NONE label from empty expected/acceptable arrays, or use an answer-derived fact ledger as independent evidence.

Review the extra flagged `boundary_setting/A2` and `de_escalation/A2` alongside this pilot; they remain additional original cases in the 210-row ledger, not extra pilot slots. All five potential unsupported-meaning questions and the cutoff question appear in the master report. No canonical YAML is edited by this packet.

## emotional_validation/N1

Source: [emotional_validation/N1](../../packages/skills/definitions/atomic/recognition_support/emotional_validation.yaml#L94). Category: **NEGATIVE**.

- Example digest: `sha256:c117ca1e25820c732402fb3366fd5b59fdf17cecc51ee875642436d507ba30ea`.
- Definition digest: `sha256:5e5a186c00510fc7d58ddc9c23d6214e02f03a30a6d2595fe453a490d9f6441d`.
- Record/boundary digest: `sha256:35a63c098fd7f9e57ec5e67847a71130634b2c1c900acd6ee22c671d2e2f3be9`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: `emotional_validation`.

**Original source text**

Neutral scheduling message has no emotional content.

**Visible context**

Neutral scheduling message has no emotional content.

**User intent:** Coordinate a schedule.

**Authoring rationale:** Canonical exclusion: the stated evidence, intent, language or action does not support the focal definition. This is an authoring expectation, not a measured router result.

**Provisional flags:** FOCAL_NEGATIVE_NOT_NONE.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## emotional_validation/H1

Source: [emotional_validation/H1](../../packages/skills/definitions/atomic/recognition_support/emotional_validation.yaml#L145). Category: **NEIGHBOR**.

- Example digest: `sha256:a0052fc571bf19b1aabb982a2d224caacf1365cfff437a818a9ef3fc4f52c97a`.
- Definition digest: `sha256:5e5a186c00510fc7d58ddc9c23d6214e02f03a30a6d2595fe453a490d9f6441d`.
- Record/boundary digest: `sha256:35a63c098fd7f9e57ec5e67847a71130634b2c1c900acd6ee22c671d2e2f3be9`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: none.

**Original source text**

Person states an interpretation without emotion → `perspective_acknowledgement`.

**Visible context**

Person states an interpretation without emotion → `perspective_acknowledgement`.

**User intent:** Recognize a stated interpretation without adding emotion.

**Authoring rationale:** Person states an interpretation without emotion → `perspective_acknowledgement`.

**Boundary notes**

```json
[
  {
    "caseId": "H1",
    "distinction": "Person states an interpretation without emotion → `perspective_acknowledgement`.",
    "sourceRef": "docs/skills/phase-5-registry-expansion.md#emotional_validation"
  }
]
```

**Provisional flags:** CONCEPTUAL_NEIGHBOR.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## emotional_validation/A1

Source: [emotional_validation/A1](../../packages/skills/definitions/atomic/recognition_support/emotional_validation.yaml#L175). Category: **APPLICATION**.

- Example digest: `sha256:6545ee4397003176b78daf33f6b15eb92f414c632e3f3e2f51eb9ef246435bb5`.
- Definition digest: `sha256:5e5a186c00510fc7d58ddc9c23d6214e02f03a30a6d2595fe453a490d9f6441d`.
- Record/boundary digest: `sha256:35a63c098fd7f9e57ec5e67847a71130634b2c1c900acd6ee22c671d2e2f3be9`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `REWRITE_DRAFT`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: none.

**Original source text**

Visible: “I'm disappointed I didn't get it.” “don't be sad” → “That sounds disappointing.”

**Visible context**

Other person said: I'm disappointed I didn't get it.

**User intent:** Acknowledge expressed disappointment.

**Authoring rationale:** Canonical wording demonstration; preserve the supplied ledger. Not measured model output.

**Draft**

don't be sad

**Proposed improvement (not a model result)**

That sounds disappointing.

**Author-supplied ledger; review grounding independently**

```json
{
  "facts": ["Other person said: I'm disappointed I didn't get it."],
  "commitments": [],
  "uncertainty": []
}
```

**Provisional flags:** REWRITE_ONLY_EVIDENCE.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## clarification/N1

Source: [clarification/N1](../../packages/skills/definitions/atomic/understanding_inquiry/clarification.yaml#L93). Category: **NEGATIVE**.

- Example digest: `sha256:f7fa22f505bc13ea47b2d51c892c29082d81f7f3df1cc1d3fe981e2a5ad1c89f`.
- Definition digest: `sha256:c36a893beaccbaa708d46caea9970730824b33f40edd886d473859b085ca25bb`.
- Record/boundary digest: `sha256:8d04a20507bc23e20e8dc4445c99eace8e34ddc6c0b45bce46ae1f4c8697ce4a`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: `clarification`.

**Original source text**

The requested detail is explicit and already understood.

**Visible context**

The requested detail is explicit and already understood.

**User intent:** Absent (null); do not fill without evidence.

**Authoring rationale:** Canonical exclusion: the stated evidence, intent, language or action does not support the focal definition. This is an authoring expectation, not a measured router result.

**Provisional flags:** INTENT_UNSPECIFIED, FOCAL_NEGATIVE_NOT_NONE.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## clarification/H1

Source: [clarification/H1](../../packages/skills/definitions/atomic/understanding_inquiry/clarification.yaml#L144). Category: **NEIGHBOR**.

- Example digest: `sha256:1e4cda02a087ea49926d716e4b74cd5471c0714ab98fd690b733a556b1287c30`.
- Definition digest: `sha256:c36a893beaccbaa708d46caea9970730824b33f40edd886d473859b085ca25bb`.
- Record/boundary digest: `sha256:8d04a20507bc23e20e8dc4445c99eace8e34ddc6c0b45bce46ae1f4c8697ce4a`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: none.

**Original source text**

Apparently understood Friday deadline needs final verification → confirmation.

**Visible context**

Apparently understood Friday deadline needs final verification → confirmation.

**User intent:** Verify an apparently understood Friday deadline.

**Authoring rationale:** Apparently understood Friday deadline needs final verification → confirmation.

**Boundary notes**

```json
[
  {
    "caseId": "H1",
    "distinction": "Apparently understood Friday deadline needs final verification → confirmation.",
    "sourceRef": "docs/skills/phase-5-registry-expansion.md#clarification"
  }
]
```

**Provisional flags:** CONCEPTUAL_NEIGHBOR.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## clarification/A1

Source: [clarification/A1](../../packages/skills/definitions/atomic/understanding_inquiry/clarification.yaml#L174). Category: **APPLICATION**.

- Example digest: `sha256:8305ec77c7e0f6e8255e8c484845a883bd1e82e081b966a4157d48d0a88b2433`.
- Definition digest: `sha256:c36a893beaccbaa708d46caea9970730824b33f40edd886d473859b085ca25bb`.
- Record/boundary digest: `sha256:8d04a20507bc23e20e8dc4445c99eace8e34ddc6c0b45bce46ae1f4c8697ce4a`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `REWRITE_DRAFT`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: none.

**Original source text**

Two reports are plausible. “which report do you mean” → “Do you mean the sales report or the budget report?”

**Visible context**

The sales report and budget report are both plausible. The intended report is unknown.

**User intent:** Ask which of two reports is meant.

**Authoring rationale:** Canonical wording demonstration; preserve the supplied ledger. Not measured model output.

**Draft**

which report do you mean

**Proposed improvement (not a model result)**

Do you mean the sales report or the budget report?

**Author-supplied ledger; review grounding independently**

```json
{
  "facts": [
    "The sales report and budget report are both plausible.",
    "The intended report is unknown."
  ],
  "commitments": [],
  "uncertainty": ["Which report is intended is unresolved."]
}
```

**Provisional flags:** REWRITE_ONLY_EVIDENCE, SEMANTIC_REVIEW_SEED.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## request/N1

Source: [request/N1](../../packages/skills/definitions/atomic/requests_options/request.yaml#L93). Category: **NEGATIVE**.

- Example digest: `sha256:243ddf20775bdee74a5590b3f26802e4d719c6d2dd856bf41790f51e22bbfd44`.
- Definition digest: `sha256:1c95d6ca98d075a39d13cf8859f654e1b8b08d7c7a9d8fde5fc33fbfa59bc341`.
- Record/boundary digest: `sha256:d91c888bffd8b59a2c5ec1656e54adb177e202710612e285ba601b12339ed484`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: `request`.

**Original source text**

User has no chosen requested action.

**Visible context**

User has no chosen requested action.

**User intent:** Absent (null); do not fill without evidence.

**Authoring rationale:** Canonical exclusion: the stated evidence, intent, language or action does not support the focal definition. This is an authoring expectation, not a measured router result.

**Provisional flags:** INTENT_UNSPECIFIED, FOCAL_NEGATIVE_NOT_NONE.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## request/H1

Source: [request/H1](../../packages/skills/definitions/atomic/requests_options/request.yaml#L144). Category: **NEIGHBOR**.

- Example digest: `sha256:f5f9fbcd6207c99b207ea2c84fcb373f71b8b8ca170a6da0f2e31d2610aaf52a`.
- Definition digest: `sha256:1c95d6ca98d075a39d13cf8859f654e1b8b08d7c7a9d8fde5fc33fbfa59bc341`.
- Record/boundary digest: `sha256:d91c888bffd8b59a2c5ec1656e54adb177e202710612e285ba601b12339ed484`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: `ask_for_help`; forbidden: none.

**Original source text**

Explicit need for assistance carrying something → ask for help.

**Visible context**

Explicit need for assistance carrying something → ask for help.

**User intent:** Request assistance carrying an object.

**Authoring rationale:** Explicit need for assistance carrying something → ask for help.

**Boundary notes**

```json
[
  {
    "id": "ask_for_help",
    "distinction": "Explicit need for assistance carrying something → ask for help.",
    "caseId": "H1"
  }
]
```

**Provisional flags:** OPTIONAL_NEIGHBOR_LABEL.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## request/A1

Source: [request/A1](../../packages/skills/definitions/atomic/requests_options/request.yaml#L175). Category: **APPLICATION**.

- Example digest: `sha256:875d5988df0fc5497dc69102ae84b5a64dd60b3fbd4caf0a2957ea0d92bcddca`.
- Definition digest: `sha256:1c95d6ca98d075a39d13cf8859f654e1b8b08d7c7a9d8fde5fc33fbfa59bc341`.
- Record/boundary digest: `sha256:d91c888bffd8b59a2c5ec1656e54adb177e202710612e285ba601b12339ed484`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `REWRITE_DRAFT`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: none.

**Original source text**

User wants the agenda; no deadline supplied. “send agenda” → “Could you send me the agenda?”

**Visible context**

User wants the agenda. No deadline is supplied.

**User intent:** Ask for the agenda without adding a deadline.

**Authoring rationale:** Canonical wording demonstration; preserve the supplied ledger. Not measured model output.

**Draft**

send agenda

**Proposed improvement (not a model result)**

Could you send me the agenda?

**Author-supplied ledger; review grounding independently**

```json
{
  "facts": ["User wants the agenda.", "No deadline is supplied."],
  "commitments": [],
  "uncertainty": []
}
```

**Provisional flags:** REWRITE_ONLY_EVIDENCE.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## boundary_setting/N1

Source: [boundary_setting/N1](../../packages/skills/definitions/atomic/decisions_limits/boundary_setting.yaml#L97). Category: **NEGATIVE**.

- Example digest: `sha256:a5fe3611ff31d2f21e6f7e771112d60a23dfc7959920cae2df543cf9f32fad30`.
- Definition digest: `sha256:1a0f4f43e8748abea7927701881b2c953b3a0f79434d0d60bdc213d18eead59e`.
- Record/boundary digest: `sha256:8f1672bd98756fa6c238b1dc7644acd43b8ffc977c34f628c4b9bddf10609604`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: `boundary_setting`.

**Original source text**

User has made no choice about the limit.

**Visible context**

User has made no choice about the limit.

**User intent:** Absent (null); do not fill without evidence.

**Authoring rationale:** Canonical exclusion: the stated evidence, intent, language or action does not support the focal definition. This is an authoring expectation, not a measured router result.

**Provisional flags:** INTENT_UNSPECIFIED, FOCAL_NEGATIVE_NOT_NONE.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## boundary_setting/H1

Source: [boundary_setting/H1](../../packages/skills/definitions/atomic/decisions_limits/boundary_setting.yaml#L148). Category: **NEIGHBOR**.

- Example digest: `sha256:804ef13b6c499455587ce16468a7d153f1608562ee442d62c1832024773c4c05`.
- Definition digest: `sha256:1a0f4f43e8748abea7927701881b2c953b3a0f79434d0d60bdc213d18eead59e`.
- Record/boundary digest: `sha256:8f1672bd98756fa6c238b1dc7644acd43b8ffc977c34f628c4b9bddf10609604`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: `decline`; forbidden: none.

**Original source text**

One invitation refused without an ongoing limit → decline.

**Visible context**

One invitation refused without an ongoing limit → decline.

**User intent:** Refuse one invitation.

**Authoring rationale:** One invitation refused without an ongoing limit → decline.

**Boundary notes**

```json
[
  {
    "id": "decline",
    "distinction": "One invitation refused without an ongoing limit → decline.",
    "caseId": "H1"
  }
]
```

**Provisional flags:** OPTIONAL_NEIGHBOR_LABEL.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## boundary_setting/A1

Source: [boundary_setting/A1](../../packages/skills/definitions/atomic/decisions_limits/boundary_setting.yaml#L179). Category: **APPLICATION**.

- Example digest: `sha256:299c00538c997fa5b684cafeaf6b0c33350a493a874fdf300c6f3b8a25419d52`.
- Definition digest: `sha256:1a0f4f43e8748abea7927701881b2c953b3a0f79434d0d60bdc213d18eead59e`.
- Record/boundary digest: `sha256:8f1672bd98756fa6c238b1dc7644acd43b8ffc977c34f628c4b9bddf10609604`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `REWRITE_DRAFT`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: none.

**Original source text**

User's limit: no nonurgent work calls after 8 p.m. “stop calling late” → “Please keep nonurgent work calls before 8 p.m.”

**Visible context**

User's limit is no nonurgent work calls after 8 p.m.

**User intent:** State the no-calls-after-8 limit.

**Authoring rationale:** Canonical wording demonstration; preserve the supplied ledger. Not measured model output.

**Draft**

stop calling late

**Proposed improvement (not a model result)**

Please keep nonurgent work calls before 8 p.m.

**Author-supplied ledger; review grounding independently**

```json
{
  "facts": ["User's limit is no nonurgent work calls after 8 p.m."],
  "commitments": [],
  "uncertainty": []
}
```

**Provisional flags:** REWRITE_ONLY_EVIDENCE, CUTOFF_PRECISION_CHECK.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## de_escalation/N1

Source: [de_escalation/N1](../../packages/skills/definitions/atomic/conflict_feedback/de_escalation.yaml#L95). Category: **NEGATIVE**.

- Example digest: `sha256:c90776e71801912aa92923f83447ef23ec1bfbaac89a16e8b4b13f742a7a38ed`.
- Definition digest: `sha256:1c8bd46ae515a8cdca6a50238e5f0ba0e4a2f9c1b71ad4779a1566c594051168`.
- Record/boundary digest: `sha256:ff531cfbdedb91d8ab90def452a1b8b83f8cf2d17264abf60158f485b50b7e19`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: `de_escalation`.

**Original source text**

Calm neutral coordination.

**Visible context**

Calm neutral coordination.

**User intent:** Coordinate calmly.

**Authoring rationale:** Canonical exclusion: the stated evidence, intent, language or action does not support the focal definition. This is an authoring expectation, not a measured router result.

**Provisional flags:** FOCAL_NEGATIVE_NOT_NONE.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## de_escalation/H1

Source: [de_escalation/H1](../../packages/skills/definitions/atomic/conflict_feedback/de_escalation.yaml#L146). Category: **NEIGHBOR**.

- Example digest: `sha256:c87a0674459eb900106380d93297f56df6049fe5a6aa2727b06255b5a65cc15d`.
- Definition digest: `sha256:1c8bd46ae515a8cdca6a50238e5f0ba0e4a2f9c1b71ad4779a1566c594051168`.
- Record/boundary digest: `sha256:ff531cfbdedb91d8ab90def452a1b8b83f8cf2d17264abf60158f485b50b7e19`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: `boundary_setting`; forbidden: none.

**Original source text**

Civil statement of a limit → boundary, no need to invent conflict.

**Visible context**

Civil statement of a limit → boundary, no need to invent conflict.

**User intent:** State a limit civilly.

**Authoring rationale:** Civil statement of a limit → boundary, no need to invent conflict.

**Boundary notes**

```json
[
  {
    "id": "boundary_setting",
    "distinction": "Civil statement of a limit → boundary, no need to invent conflict.",
    "caseId": "H1"
  }
]
```

**Provisional flags:** OPTIONAL_NEIGHBOR_LABEL.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## de_escalation/A1

Source: [de_escalation/A1](../../packages/skills/definitions/atomic/conflict_feedback/de_escalation.yaml#L176). Category: **APPLICATION**.

- Example digest: `sha256:ac754dd0c35f8bd9eb163ae55057b3ba08a98dde30ff8d6d6c79fe9ce035e5c8`.
- Definition digest: `sha256:1c8bd46ae515a8cdca6a50238e5f0ba0e4a2f9c1b71ad4779a1566c594051168`.
- Record/boundary digest: `sha256:ff531cfbdedb91d8ab90def452a1b8b83f8cf2d17264abf60158f485b50b7e19`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `REWRITE_DRAFT`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: none.

**Original source text**

User disputes a total and wants joint checking. “your numbers are nonsense, check them” → “I don't think these totals match. Can we check the figures together?”

**Visible context**

User disputes the total. User wants to check the figures together.

**User intent:** Dispute the total and request joint checking.

**Authoring rationale:** Canonical wording demonstration; preserve the supplied ledger. Not measured model output.

**Draft**

your numbers are nonsense, check them

**Proposed improvement (not a model result)**

I don't think these totals match. Can we check the figures together?

**Author-supplied ledger; review grounding independently**

```json
{
  "facts": ["User disputes the total.", "User wants to check the figures together."],
  "commitments": [],
  "uncertainty": []
}
```

**Provisional flags:** REWRITE_ONLY_EVIDENCE.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## status_update/N1

Source: [status_update/N1](../../packages/skills/definitions/atomic/coordination/status_update.yaml#L96). Category: **NEGATIVE**.

- Example digest: `sha256:3fb351ced0584c1943169595b3fea0f4e968db0b45391896b6e29d1c39622ef7`.
- Definition digest: `sha256:0ca9ab17617c03dc373c61bed069b6f11c8b9ed6d56308dfb1dc494f00f820f9`.
- Record/boundary digest: `sha256:931f2b5503624ccb208469324c19afa3dcd7eda4ae28d8f60f6930fa61587552`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: `status_update`.

**Original source text**

Status is unknown and user wants to ask for it.

**Visible context**

Status is unknown and user wants to ask for it.

**User intent:** Ask for unknown status.

**Authoring rationale:** Canonical exclusion: the stated evidence, intent, language or action does not support the focal definition. This is an authoring expectation, not a measured router result.

**Provisional flags:** FOCAL_NEGATIVE_NOT_NONE.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## status_update/H1

Source: [status_update/H1](../../packages/skills/definitions/atomic/coordination/status_update.yaml#L147). Category: **NEIGHBOR**.

- Example digest: `sha256:09ddc84f1d101f83d104397b2036000701656feb3066f0149c239c6a0c3b9587`.
- Definition digest: `sha256:0ca9ab17617c03dc373c61bed069b6f11c8b9ed6d56308dfb1dc494f00f820f9`.
- Record/boundary digest: `sha256:931f2b5503624ccb208469324c19afa3dcd7eda4ae28d8f60f6930fa61587552`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: `expectation_setting`; forbidden: none.

**Original source text**

“Probably tomorrow” is a future estimate → expectation setting.

**Visible context**

“Probably tomorrow” is a future estimate → expectation setting.

**User intent:** Communicate a probable future estimate.

**Authoring rationale:** “Probably tomorrow” is a future estimate → expectation setting.

**Boundary notes**

```json
[
  {
    "id": "expectation_setting",
    "distinction": "“Probably tomorrow” is a future estimate → expectation setting.",
    "caseId": "H1"
  }
]
```

**Provisional flags:** OPTIONAL_NEIGHBOR_LABEL.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## status_update/A1

Source: [status_update/A1](../../packages/skills/definitions/atomic/coordination/status_update.yaml#L178). Category: **APPLICATION**.

- Example digest: `sha256:7a2f476cf4c9e17dba11e9718c6a0ce18f6be0b4aa6ba409b53308a6b1a6d0f8`.
- Definition digest: `sha256:0ca9ab17617c03dc373c61bed069b6f11c8b9ed6d56308dfb1dc494f00f820f9`.
- Record/boundary digest: `sha256:931f2b5503624ccb208469324c19afa3dcd7eda4ae28d8f60f6930fa61587552`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `REWRITE_DRAFT`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: none.

**Original source text**

Facts: draft complete, review not started. “done draft review later” → “The draft is complete; the review hasn't started yet.”

**Visible context**

The draft is complete. The review has not started.

**User intent:** Report the completed draft and pending review.

**Authoring rationale:** Canonical wording demonstration; preserve the supplied ledger. Not measured model output.

**Draft**

done draft review later

**Proposed improvement (not a model result)**

The draft is complete; the review hasn't started yet.

**Author-supplied ledger; review grounding independently**

```json
{
  "facts": ["The draft is complete.", "The review has not started."],
  "commitments": [],
  "uncertainty": []
}
```

**Provisional flags:** REWRITE_ONLY_EVIDENCE.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## acknowledge_mistake/N1

Source: [acknowledge_mistake/N1](../../packages/skills/definitions/atomic/accountability_repair/acknowledge_mistake.yaml#L98). Category: **NEGATIVE**.

- Example digest: `sha256:ea43e100e99c43015fd2064b3c4825a763c33ca2ac3cedae3176c8789a55372a`.
- Definition digest: `sha256:5b651416a95e3c48749ce4619e95e008970edcd9f389449df62b79c5c9ce12ac`.
- Record/boundary digest: `sha256:ffb29f9f090754579133b9786131a4d1e68324b9b0cbf53345120e348343fee0`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: `acknowledge_mistake`.

**Original source text**

A customer made the error.

**Visible context**

A customer made the error.

**User intent:** Absent (null); do not fill without evidence.

**Authoring rationale:** Canonical exclusion: the stated evidence, intent, language or action does not support the focal definition. This is an authoring expectation, not a measured router result.

**Provisional flags:** INTENT_UNSPECIFIED, FOCAL_NEGATIVE_NOT_NONE.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## acknowledge_mistake/H1

Source: [acknowledge_mistake/H1](../../packages/skills/definitions/atomic/accountability_repair/acknowledge_mistake.yaml#L149). Category: **NEIGHBOR**.

- Example digest: `sha256:07d13b1ec378c5b9a07607d6b303a139615849a1d7e63dd6c36bad240b348d2f`.
- Definition digest: `sha256:5b651416a95e3c48749ce4619e95e008970edcd9f389449df62b79c5c9ce12ac`.
- Record/boundary digest: `sha256:ffb29f9f090754579133b9786131a4d1e68324b9b0cbf53345120e348343fee0`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: `apology`; forbidden: none.

**Original source text**

User expresses regret without any identified mistake, for a supported impact → apology may fit.

**Visible context**

User expresses regret without any identified mistake, for a supported impact → apology may fit.

**User intent:** Express regret for a supported impact.

**Authoring rationale:** User expresses regret without any identified mistake, for a supported impact → apology may fit.

**Boundary notes**

```json
[
  {
    "id": "apology",
    "distinction": "User expresses regret without any identified mistake, for a supported impact → apology may fit.",
    "caseId": "H1"
  }
]
```

**Provisional flags:** OPTIONAL_NEIGHBOR_LABEL.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## acknowledge_mistake/A1

Source: [acknowledge_mistake/A1](../../packages/skills/definitions/atomic/accountability_repair/acknowledge_mistake.yaml#L183). Category: **APPLICATION**.

- Example digest: `sha256:c60eb2fcde573cd34a6e10f84d9992f400daacf9f56e0f0b64e4e7fdb66ac193`.
- Definition digest: `sha256:5b651416a95e3c48749ce4619e95e008970edcd9f389449df62b79c5c9ce12ac`.
- Record/boundary digest: `sha256:ffb29f9f090754579133b9786131a4d1e68324b9b0cbf53345120e348343fee0`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `REWRITE_DRAFT`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: none.

**Original source text**

Fact: user entered the wrong total. “the total got mixed up by me” → “I entered the wrong total.”

**Visible context**

User entered the wrong total.

**User intent:** Own the incorrect total.

**Authoring rationale:** Canonical wording demonstration; preserve the supplied ledger. Not measured model output.

**Draft**

the total got mixed up by me

**Proposed improvement (not a model result)**

I entered the wrong total.

**Author-supplied ledger; review grounding independently**

```json
{
  "facts": ["User entered the wrong total."],
  "commitments": [],
  "uncertainty": []
}
```

**Provisional flags:** REWRITE_ONLY_EVIDENCE.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## reassurance/N1

Source: [reassurance/N1](../../packages/skills/definitions/atomic/recognition_support/reassurance.yaml#L98). Category: **NEGATIVE**.

- Example digest: `sha256:dc7d36f8c6bdef5ba95eba623c6439bbfaa8aa7270d98d0e03c91261252300af`.
- Definition digest: `sha256:1a2712cefd5c7580782fb244375bdc7721dd17cee9026a68640013727486ff7e`.
- Record/boundary digest: `sha256:c8a95b7ace1c4676625e56050382fd2a551e56738ac90138238e7597dbf0461b`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: `reassurance`.

**Original source text**

User has no evidence to promise success.

**Visible context**

User has no evidence to promise success.

**User intent:** Promise success without evidence.

**Authoring rationale:** Canonical exclusion: the stated evidence, intent, language or action does not support the focal definition. This is an authoring expectation, not a measured router result.

**Provisional flags:** FOCAL_NEGATIVE_NOT_NONE.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## reassurance/H1

Source: [reassurance/H1](../../packages/skills/definitions/atomic/recognition_support/reassurance.yaml#L149). Category: **NEIGHBOR**.

- Example digest: `sha256:cd9befbdd10e79a06d0942abf7b94d89565ecd37161ca8c0dd07cf6995286e28`.
- Definition digest: `sha256:1a2712cefd5c7580782fb244375bdc7721dd17cee9026a68640013727486ff7e`.
- Record/boundary digest: `sha256:c8a95b7ace1c4676625e56050382fd2a551e56738ac90138238e7597dbf0461b`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: `emotional_validation`; forbidden: none.

**Original source text**

Only acknowledge sadness, with no support fact → validation.

**Visible context**

Only acknowledge sadness, with no support fact → validation.

**User intent:** Acknowledge sadness without adding a support fact.

**Authoring rationale:** Only acknowledge sadness, with no support fact → validation.

**Boundary notes**

```json
[
  {
    "id": "emotional_validation",
    "distinction": "Only acknowledge sadness, with no support fact → validation.",
    "caseId": "H1"
  }
]
```

**Provisional flags:** OPTIONAL_NEIGHBOR_LABEL.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## reassurance/A1

Source: [reassurance/A1](../../packages/skills/definitions/atomic/recognition_support/reassurance.yaml#L182). Category: **APPLICATION**.

- Example digest: `sha256:871da4e7cfb20a20f907025d7c5980e1d3283e6142bd98144921a37cf5f4b7f0`.
- Definition digest: `sha256:1a2712cefd5c7580782fb244375bdc7721dd17cee9026a68640013727486ff7e`.
- Record/boundary digest: `sha256:c8a95b7ace1c4676625e56050382fd2a551e56738ac90138238e7597dbf0461b`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `REWRITE_DRAFT`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: none.

**Original source text**

Facts: friend is worried; user has committed to attending too. “don't worry” → “You won't have to go alone—I'll be there with you.”

**Visible context**

Friend is worried about attending alone. User has committed to attending too.

**User intent:** Reassure using the existing attendance commitment.

**Authoring rationale:** Canonical wording demonstration; preserve the supplied ledger. Not measured model output.

**Draft**

don't worry

**Proposed improvement (not a model result)**

You won't have to go alone—I'll be there with you.

**Author-supplied ledger; review grounding independently**

```json
{
  "facts": ["Friend is worried about attending alone.", "User has committed to attending too."],
  "commitments": ["User will attend with the friend; this commitment already exists."],
  "uncertainty": []
}
```

**Provisional flags:** REWRITE_ONLY_EVIDENCE, CERTAINTY_COMMITMENT_CHECK, SEMANTIC_REVIEW_SEED.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## planning/N1

Source: [planning/N1](../../packages/skills/definitions/atomic/coordination/planning.yaml#L94). Category: **NEGATIVE**.

- Example digest: `sha256:6438e445d156e91ecb47dd2d1c37b46dbea4d48ef9025fbcd41d4eba2bac9942`.
- Definition digest: `sha256:f43aeda3624c08258657f4caedff9d0ee4e5d2ecf242fa1df9eb292fde631273`.
- Record/boundary digest: `sha256:1688f75f35005277924ae6b128ca77baa2d9f895c7e5d867601b6c8b6c5a5f22`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: `planning`.

**Original source text**

User has not decided whether to attend.

**Visible context**

User has not decided whether to attend.

**User intent:** Absent (null); do not fill without evidence.

**Authoring rationale:** Canonical exclusion: the stated evidence, intent, language or action does not support the focal definition. This is an authoring expectation, not a measured router result.

**Provisional flags:** INTENT_UNSPECIFIED, FOCAL_NEGATIVE_NOT_NONE.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## planning/H1

Source: [planning/H1](../../packages/skills/definitions/atomic/coordination/planning.yaml#L145). Category: **NEIGHBOR**.

- Example digest: `sha256:d097296a37186004c54a6da8e0dbee7a1f82af856c41cc3c4ee2fc2461ada585`.
- Definition digest: `sha256:f43aeda3624c08258657f4caedff9d0ee4e5d2ecf242fa1df9eb292fde631273`.
- Record/boundary digest: `sha256:1688f75f35005277924ae6b128ca77baa2d9f895c7e5d867601b6c8b6c5a5f22`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: `request`; forbidden: none.

**Original source text**

Ask someone to start a new task → request.

**Visible context**

Ask someone to start a new task → request.

**User intent:** Request a new task.

**Authoring rationale:** Ask someone to start a new task → request.

**Boundary notes**

```json
[
  {
    "id": "request",
    "distinction": "Ask someone to start a new task → request.",
    "caseId": "H1"
  }
]
```

**Provisional flags:** OPTIONAL_NEIGHBOR_LABEL.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## planning/A1

Source: [planning/A1](../../packages/skills/definitions/atomic/coordination/planning.yaml#L175). Category: **APPLICATION**.

- Example digest: `sha256:abb988ba3693074d38f2f50a9cce2e44dff11250662bfc08e2797ae38993d063`.
- Definition digest: `sha256:f43aeda3624c08258657f4caedff9d0ee4e5d2ecf242fa1df9eb292fde631273`.
- Record/boundary digest: `sha256:1688f75f35005277924ae6b128ca77baa2d9f895c7e5d867601b6c8b6c5a5f22`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `REWRITE_DRAFT`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: none.

**Original source text**

Agreed plan: Saturday, 2 p.m., library. “sat 2 library then” → “See you at the library on Saturday at 2 p.m.”

**Visible context**

Meeting is agreed for Saturday at 2 p.m. at the library.

**User intent:** Restate the agreed library meeting.

**Authoring rationale:** Canonical wording demonstration; preserve the supplied ledger. Not measured model output.

**Draft**

sat 2 library then

**Proposed improvement (not a model result)**

See you at the library on Saturday at 2 p.m.

**Author-supplied ledger; review grounding independently**

```json
{
  "facts": ["Meeting is agreed for Saturday at 2 p.m. at the library."],
  "commitments": ["The Saturday library meeting at 2 p.m. is already agreed."],
  "uncertainty": []
}
```

**Provisional flags:** REWRITE_ONLY_EVIDENCE.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## apology/N1

Source: [apology/N1](../../packages/skills/definitions/atomic/accountability_repair/apology.yaml#L97). Category: **NEGATIVE**.

- Example digest: `sha256:649e9c3bd6028ed799de14850912b56aade2203546d2955970d4668270483fae`.
- Definition digest: `sha256:8221402bcdfb866433c969297014c3fbbf5aa389ab79d4a628687de6516b5f46`.
- Record/boundary digest: `sha256:74bee81e6905fdb71ff810271d022f7d1882f1d155bed0034fb8d6d71c81c162`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: `apology`.

**Original source text**

Another participant forgot the attachment; user only reports status.

**Visible context**

Another participant forgot the attachment; user only reports status.

**User intent:** Report status without taking responsibility for another person's mistake.

**Authoring rationale:** Canonical exclusion: the stated evidence, intent, language or action does not support the focal definition. This is an authoring expectation, not a measured router result.

**Provisional flags:** FOCAL_NEGATIVE_NOT_NONE.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## apology/H1

Source: [apology/H1](../../packages/skills/definitions/atomic/accountability_repair/apology.yaml#L148). Category: **NEIGHBOR**.

- Example digest: `sha256:116d3e37900bc964f6d673de3616f9c74d512ae6408494c8eb82015e0b85df8a`.
- Definition digest: `sha256:8221402bcdfb866433c969297014c3fbbf5aa389ab79d4a628687de6516b5f46`.
- Record/boundary digest: `sha256:74bee81e6905fdb71ff810271d022f7d1882f1d155bed0034fb8d6d71c81c162`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: `acknowledge_mistake`; forbidden: none.

**Original source text**

User wants only to correct their own wrong figure without expressing regret → `acknowledge_mistake`.

**Visible context**

User wants only to correct their own wrong figure without expressing regret → `acknowledge_mistake`.

**User intent:** Correct the user's wrong figure without regret.

**Authoring rationale:** User wants only to correct their own wrong figure without expressing regret → `acknowledge_mistake`.

**Boundary notes**

```json
[
  {
    "id": "acknowledge_mistake",
    "distinction": "User wants only to correct their own wrong figure without expressing regret → `acknowledge_mistake`.",
    "caseId": "H1"
  }
]
```

**Provisional flags:** OPTIONAL_NEIGHBOR_LABEL.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## apology/A1

Source: [apology/A1](../../packages/skills/definitions/atomic/accountability_repair/apology.yaml#L182). Category: **APPLICATION**.

- Example digest: `sha256:d60d4a5c804542b05d23f583c2630cdbe4daec42ed90d68c49dea2d4a5aaf8c3`.
- Definition digest: `sha256:8221402bcdfb866433c969297014c3fbbf5aa389ab79d4a628687de6516b5f46`.
- Record/boundary digest: `sha256:74bee81e6905fdb71ff810271d022f7d1882f1d155bed0034fb8d6d71c81c162`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `REWRITE_DRAFT`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: none.

**Original source text**

Fact: user forgot the attachment; intent: apologize. “sorry forgot file” → “I'm sorry I forgot the attachment.”

**Visible context**

User forgot the attachment.

**User intent:** Apologize for the forgotten attachment.

**Authoring rationale:** Canonical wording demonstration; preserve the supplied ledger. Not measured model output.

**Draft**

sorry forgot file

**Proposed improvement (not a model result)**

I'm sorry I forgot the attachment.

**Author-supplied ledger; review grounding independently**

```json
{
  "facts": ["User forgot the attachment."],
  "commitments": [],
  "uncertainty": []
}
```

**Provisional flags:** REWRITE_ONLY_EVIDENCE.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## ask_for_help/N1

Source: [ask_for_help/N1](../../packages/skills/definitions/atomic/requests_options/ask_for_help.yaml#L93). Category: **NEGATIVE**.

- Example digest: `sha256:311500bd6de101d4206fe7c936be0d7c9e70f1c78f56c352496f42108e4f1711`.
- Definition digest: `sha256:6f02649adcc780b7ee1bea2a75ac8680bd807555b22b08aa8c7935a04a245945`.
- Record/boundary digest: `sha256:b51b4e3e6e414412f3458eadd5e650a951d18c4ff88fe69d56b5c3894f0cddfe`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: `ask_for_help`.

**Original source text**

User only reports a finished task.

**Visible context**

User only reports a finished task.

**User intent:** Report a finished task.

**Authoring rationale:** Canonical exclusion: the stated evidence, intent, language or action does not support the focal definition. This is an authoring expectation, not a measured router result.

**Provisional flags:** FOCAL_NEGATIVE_NOT_NONE.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## ask_for_help/H1

Source: [ask_for_help/H1](../../packages/skills/definitions/atomic/requests_options/ask_for_help.yaml#L144). Category: **NEIGHBOR**.

- Example digest: `sha256:1c27d04f89816bb88c196507bbca5764b26661531be9d236ccb4858ef93c926a`.
- Definition digest: `sha256:6f02649adcc780b7ee1bea2a75ac8680bd807555b22b08aa8c7935a04a245945`.
- Record/boundary digest: `sha256:b51b4e3e6e414412f3458eadd5e650a951d18c4ff88fe69d56b5c3894f0cddfe`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: `request`; forbidden: none.

**Original source text**

Asking someone to send a document without assistance framing → request.

**Visible context**

Asking someone to send a document without assistance framing → request.

**User intent:** Ask for a document without assistance framing.

**Authoring rationale:** Asking someone to send a document without assistance framing → request.

**Boundary notes**

```json
[
  {
    "id": "request",
    "distinction": "Asking someone to send a document without assistance framing → request.",
    "caseId": "H1"
  }
]
```

**Provisional flags:** OPTIONAL_NEIGHBOR_LABEL.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## ask_for_help/A1

Source: [ask_for_help/A1](../../packages/skills/definitions/atomic/requests_options/ask_for_help.yaml#L175). Category: **APPLICATION**.

- Example digest: `sha256:0d5cdcd26bc8ea11cddc8e3b5190ea42da1e59feaf4d424e3f370b18be493cea`.
- Definition digest: `sha256:6f02649adcc780b7ee1bea2a75ac8680bd807555b22b08aa8c7935a04a245945`.
- Record/boundary digest: `sha256:b51b4e3e6e414412f3458eadd5e650a951d18c4ff88fe69d56b5c3894f0cddfe`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `REWRITE_DRAFT`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: none.

**Original source text**

User seeks help checking one formula. “help spreadsheet” → “Could you help me check this formula?”

**Visible context**

User wants help checking one formula.

**User intent:** Ask for help checking one formula.

**Authoring rationale:** Canonical wording demonstration; preserve the supplied ledger. Not measured model output.

**Draft**

help spreadsheet

**Proposed improvement (not a model result)**

Could you help me check this formula?

**Author-supplied ledger; review grounding independently**

```json
{
  "facts": ["User wants help checking one formula."],
  "commitments": [],
  "uncertainty": []
}
```

**Provisional flags:** REWRITE_ONLY_EVIDENCE.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## decline/N1

Source: [decline/N1](../../packages/skills/definitions/atomic/decisions_limits/decline.yaml#L96). Category: **NEGATIVE**.

- Example digest: `sha256:9ad79e243b3538550407e3115a0034a7d00c896a354b5670587b6fb8af56ce6b`.
- Definition digest: `sha256:06ae122d785ae6ed915dd6fa57b3f4bec013276c53285b165cc16ed662e4bd0a`.
- Record/boundary digest: `sha256:123552ba65c5a0055db3843d644e0b080d823b4bcbe91c64a274e22a74f755ce`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: `decline`.

**Original source text**

User chose accept.

**Visible context**

User chose accept.

**User intent:** Accept.

**Authoring rationale:** Canonical exclusion: the stated evidence, intent, language or action does not support the focal definition. This is an authoring expectation, not a measured router result.

**Provisional flags:** FOCAL_NEGATIVE_NOT_NONE.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## decline/H1

Source: [decline/H1](../../packages/skills/definitions/atomic/decisions_limits/decline.yaml#L147). Category: **NEIGHBOR**.

- Example digest: `sha256:7d27f45070c5636caf7ea1e829fd9437025c51b3c51eda13b3d20d11fa2097e4`.
- Definition digest: `sha256:06ae122d785ae6ed915dd6fa57b3f4bec013276c53285b165cc16ed662e4bd0a`.
- Record/boundary digest: `sha256:123552ba65c5a0055db3843d644e0b080d823b4bcbe91c64a274e22a74f755ce`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: `boundary_setting`; forbidden: none.

**Original source text**

Repeated request plus ongoing limit → boundary may also apply.

**Visible context**

Repeated request plus ongoing limit → boundary may also apply.

**User intent:** State an ongoing limit on repeated requests.

**Authoring rationale:** Repeated request plus ongoing limit → boundary may also apply.

**Boundary notes**

```json
[
  {
    "id": "boundary_setting",
    "distinction": "Repeated request plus ongoing limit → boundary may also apply.",
    "caseId": "H1"
  }
]
```

**Provisional flags:** OPTIONAL_NEIGHBOR_LABEL.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## decline/A1

Source: [decline/A1](../../packages/skills/definitions/atomic/decisions_limits/decline.yaml#L181). Category: **APPLICATION**.

- Example digest: `sha256:6b63cb0240b427a11f07aa1c15ddf7907747a15f61d1e0bf70ba308e5b2dbecd`.
- Definition digest: `sha256:06ae122d785ae6ed915dd6fa57b3f4bec013276c53285b165cc16ed662e4bd0a`.
- Record/boundary digest: `sha256:123552ba65c5a0055db3843d644e0b080d823b4bcbe91c64a274e22a74f755ce`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `REWRITE_DRAFT`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: none.

**Original source text**

User refuses; no reason given. “nah not going” → “Thanks for inviting me, but I won't be coming.”

**Visible context**

User refuses the invitation. No reason or alternative is supplied.

**User intent:** Decline the invitation without supplying a reason.

**Authoring rationale:** Canonical wording demonstration; preserve the supplied ledger. Not measured model output.

**Draft**

nah not going

**Proposed improvement (not a model result)**

Thanks for inviting me, but I won't be coming.

**Author-supplied ledger; review grounding independently**

```json
{
  "facts": ["User refuses the invitation.", "No reason or alternative is supplied."],
  "commitments": [],
  "uncertainty": []
}
```

**Provisional flags:** REWRITE_ONLY_EVIDENCE, CERTAINTY_COMMITMENT_CHECK.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## en.casual_naturalness/N1

Source: [en.casual_naturalness/N1](../../packages/skills/definitions/modifiers/en/casual_naturalness.yaml#L93). Category: **NEGATIVE**.

- Example digest: `sha256:821dc29d035dcc92a426fa8406ee4b6c95eb25cacefb39554a0f940c98aceeaa`.
- Definition digest: `sha256:5f14e5051ba62067e21af4c02c136f9c8b3e24a0a28d6b5e348c2eef419d2d01`.
- Record/boundary digest: `sha256:9f5e61f97fb79e8c44726bc574351a133d7c4b1022a7cc719347f792af6e8fc5`.
- Language: `{"primary":"ko","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: `en.casual_naturalness`.

**Original source text**

Unsupported primary language.

**Visible context**

Unsupported primary language.

**User intent:** Absent (null); do not fill without evidence.

**Authoring rationale:** Canonical exclusion: the stated evidence, intent, language or action does not support the focal definition. This is an authoring expectation, not a measured router result.

**Provisional flags:** INTENT_UNSPECIFIED, FOCAL_NEGATIVE_NOT_NONE.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## en.casual_naturalness/H1

Source: [en.casual_naturalness/H1](../../packages/skills/definitions/modifiers/en/casual_naturalness.yaml#L144). Category: **NEIGHBOR**.

- Example digest: `sha256:01386f58aada56b07469f1d79fbf63c24a04e11017e57de80d7182798bd331c9`.
- Definition digest: `sha256:5f14e5051ba62067e21af4c02c136f9c8b3e24a0a28d6b5e348c2eef419d2d01`.
- Record/boundary digest: `sha256:9f5e61f97fb79e8c44726bc574351a133d7c4b1022a7cc719347f792af6e8fc5`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: `en.professional_conciseness`; forbidden: none.

**Original source text**

Professional progress report → professional_conciseness.

**Visible context**

Professional progress report → professional_conciseness.

**User intent:** Report professional progress.

**Authoring rationale:** Professional progress report → professional_conciseness.

**Boundary notes**

```json
[
  {
    "id": "en.professional_conciseness",
    "distinction": "Professional progress report → professional_conciseness.",
    "caseId": "H1"
  }
]
```

**Provisional flags:** OPTIONAL_NEIGHBOR_LABEL.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## en.casual_naturalness/A1

Source: [en.casual_naturalness/A1](../../packages/skills/definitions/modifiers/en/casual_naturalness.yaml#L175). Category: **APPLICATION**.

- Example digest: `sha256:689bc819675e957fe45b4c6e3cd5d07e7a346c119b96755b43b0701909f2dd1b`.
- Definition digest: `sha256:5f14e5051ba62067e21af4c02c136f9c8b3e24a0a28d6b5e348c2eef419d2d01`.
- Record/boundary digest: `sha256:9f5e61f97fb79e8c44726bc574351a133d7c4b1022a7cc719347f792af6e8fc5`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `REWRITE_DRAFT`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: none.

**Original source text**

Confirmed 6 p.m. plan. “I shall see you at six o'clock” → “See you at six.”

**Visible context**

A 6 p.m. plan is confirmed.

**User intent:** Restate the confirmed 6 p.m. plan.

**Authoring rationale:** Canonical wording demonstration; preserve the supplied ledger. Not measured model output.

**Draft**

I shall see you at six o'clock

**Proposed improvement (not a model result)**

See you at six.

**Author-supplied ledger; review grounding independently**

```json
{
  "facts": ["A 6 p.m. plan is confirmed."],
  "commitments": ["The 6 p.m. plan is already confirmed."],
  "uncertainty": []
}
```

**Provisional flags:** REWRITE_ONLY_EVIDENCE.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## en.direct_but_polite/N1

Source: [en.direct_but_polite/N1](../../packages/skills/definitions/modifiers/en/direct_but_polite.yaml#L98). Category: **NEGATIVE**.

- Example digest: `sha256:6611136691e468626c7981d19b944ae5daa6fcfa3f6c4a92acfa6a4438a55ea1`.
- Definition digest: `sha256:e4f5152ad6772c5d6624f4cd5f8a60c388854b53063d122971768aa826fefda4`.
- Record/boundary digest: `sha256:89355c43baf8284ef536144377061e6f3fa51f4762d1b3cfb3499139ff05709a`.
- Language: `{"primary":"ko","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: `en.direct_but_polite`.

**Original source text**

Unsupported primary language.

**Visible context**

Unsupported primary language.

**User intent:** Absent (null); do not fill without evidence.

**Authoring rationale:** Canonical exclusion: the stated evidence, intent, language or action does not support the focal definition. This is an authoring expectation, not a measured router result.

**Provisional flags:** INTENT_UNSPECIFIED, FOCAL_NEGATIVE_NOT_NONE.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## en.direct_but_polite/H1

Source: [en.direct_but_polite/H1](../../packages/skills/definitions/modifiers/en/direct_but_polite.yaml#L149). Category: **NEIGHBOR**.

- Example digest: `sha256:71376776757734059e174fc6fab2949e8cff0b5f13854a962e47bbd3719da021`.
- Definition digest: `sha256:e4f5152ad6772c5d6624f4cd5f8a60c388854b53063d122971768aa826fefda4`.
- Record/boundary digest: `sha256:89355c43baf8284ef536144377061e6f3fa51f4762d1b3cfb3499139ff05709a`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: `en.professional_conciseness`; forbidden: none.

**Original source text**

Current progress report without request/decision → professional_conciseness.

**Visible context**

Current progress report without request/decision → professional_conciseness.

**User intent:** Report current progress only.

**Authoring rationale:** Current progress report without request/decision → professional_conciseness.

**Boundary notes**

```json
[
  {
    "id": "en.professional_conciseness",
    "distinction": "Current progress report without request/decision → professional_conciseness.",
    "caseId": "H1"
  }
]
```

**Provisional flags:** OPTIONAL_NEIGHBOR_LABEL.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## en.direct_but_polite/A1

Source: [en.direct_but_polite/A1](../../packages/skills/definitions/modifiers/en/direct_but_polite.yaml#L180). Category: **APPLICATION**.

- Example digest: `sha256:bf15876a4cd44d5480148d222bf9ed3d8aa37fb4ee4413297754f94556388e78`.
- Definition digest: `sha256:e4f5152ad6772c5d6624f4cd5f8a60c388854b53063d122971768aa826fefda4`.
- Record/boundary digest: `sha256:89355c43baf8284ef536144377061e6f3fa51f4762d1b3cfb3499139ff05709a`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `REWRITE_DRAFT`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: none.

**Original source text**

“No, not doing that extra task” → “I can't take on that extra task.”

**Visible context**

User will not take the extra task.

**User intent:** Refuse the extra task.

**Authoring rationale:** Canonical wording demonstration; preserve the supplied ledger. Not measured model output.

**Draft**

No, not doing that extra task

**Proposed improvement (not a model result)**

I can't take on that extra task.

**Author-supplied ledger; review grounding independently**

```json
{
  "facts": ["User will not take the extra task."],
  "commitments": [],
  "uncertainty": []
}
```

**Provisional flags:** REWRITE_ONLY_EVIDENCE, CERTAINTY_COMMITMENT_CHECK, SEMANTIC_REVIEW_SEED.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## en.professional_conciseness/N1

Source: [en.professional_conciseness/N1](../../packages/skills/definitions/modifiers/en/professional_conciseness.yaml#L97). Category: **NEGATIVE**.

- Example digest: `sha256:86d1ead29e757a1015237c01805be475a362c50b10d1ee3fc7916e75ddbc8eb4`.
- Definition digest: `sha256:8e8866c920a71ac1370148cb9c80ad968104f03c389eee271899923c522072b2`.
- Record/boundary digest: `sha256:4f439a9bf774c79c7a7bd43a1ffd25c4e969384801f53567dc631c51fae71bdd`.
- Language: `{"primary":"ko","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: `en.professional_conciseness`.

**Original source text**

Unsupported primary language.

**Visible context**

Unsupported primary language.

**User intent:** Absent (null); do not fill without evidence.

**Authoring rationale:** Canonical exclusion: the stated evidence, intent, language or action does not support the focal definition. This is an authoring expectation, not a measured router result.

**Provisional flags:** INTENT_UNSPECIFIED, FOCAL_NEGATIVE_NOT_NONE.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## en.professional_conciseness/H1

Source: [en.professional_conciseness/H1](../../packages/skills/definitions/modifiers/en/professional_conciseness.yaml#L148). Category: **NEIGHBOR**.

- Example digest: `sha256:03a202efd06d84632cc50f31076603372086a5cce765c6b922faf4627ba0ac88`.
- Definition digest: `sha256:8e8866c920a71ac1370148cb9c80ad968104f03c389eee271899923c522072b2`.
- Record/boundary digest: `sha256:4f439a9bf774c79c7a7bd43a1ffd25c4e969384801f53567dc631c51fae71bdd`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: `en.casual_naturalness`; forbidden: none.

**Original source text**

Brief personal weekend planning → en.casual_naturalness.

**Visible context**

Brief personal weekend planning → en.casual_naturalness.

**User intent:** Coordinate a personal weekend plan.

**Authoring rationale:** Brief personal weekend planning → en.casual_naturalness.

**Boundary notes**

```json
[
  {
    "id": "en.casual_naturalness",
    "distinction": "Brief personal weekend planning → en.casual_naturalness.",
    "caseId": "H1"
  }
]
```

**Provisional flags:** OPTIONAL_NEIGHBOR_LABEL.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## en.professional_conciseness/A1

Source: [en.professional_conciseness/A1](../../packages/skills/definitions/modifiers/en/professional_conciseness.yaml#L179). Category: **APPLICATION**.

- Example digest: `sha256:622e569279ba1bafc9a75f2d5abd6270cf9d64232641741fc689057a32beb3ca`.
- Definition digest: `sha256:8e8866c920a71ac1370148cb9c80ad968104f03c389eee271899923c522072b2`.
- Record/boundary digest: `sha256:4f439a9bf774c79c7a7bd43a1ffd25c4e969384801f53567dc631c51fae71bdd`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `REWRITE_DRAFT`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: none.

**Original source text**

“I would like to take this opportunity to inform you that the draft is ready” → “The draft is ready.”

**Visible context**

The draft is ready.

**User intent:** Report that the draft is ready.

**Authoring rationale:** Canonical wording demonstration; preserve the supplied ledger. Not measured model output.

**Draft**

I would like to take this opportunity to inform you that the draft is ready

**Proposed improvement (not a model result)**

The draft is ready.

**Author-supplied ledger; review grounding independently**

```json
{
  "facts": ["The draft is ready."],
  "commitments": [],
  "uncertainty": []
}
```

**Provisional flags:** REWRITE_ONLY_EVIDENCE.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## expectation_setting/N1

Source: [expectation_setting/N1](../../packages/skills/definitions/atomic/coordination/expectation_setting.yaml#L97). Category: **NEGATIVE**.

- Example digest: `sha256:adb40b0e8b7373f134e7cde47ab7e2c7dddc24789ae3a70c465a5a9d67db59cb`.
- Definition digest: `sha256:8b14ec14f7c9efaed537fb736d4fafdd7d4721cbab3d756d1e5c7419e98d45b5`.
- Record/boundary digest: `sha256:ec6c1a83337d3b98de2df3703dc02caf998bd1479bf769a2a383380e721b7b9f`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: `expectation_setting`.

**Original source text**

User has no timing or scope information.

**Visible context**

User has no timing or scope information.

**User intent:** Absent (null); do not fill without evidence.

**Authoring rationale:** Canonical exclusion: the stated evidence, intent, language or action does not support the focal definition. This is an authoring expectation, not a measured router result.

**Provisional flags:** INTENT_UNSPECIFIED, FOCAL_NEGATIVE_NOT_NONE.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## expectation_setting/H1

Source: [expectation_setting/H1](../../packages/skills/definitions/atomic/coordination/expectation_setting.yaml#L148). Category: **NEIGHBOR**.

- Example digest: `sha256:58850c94ef880454d8ea3defd86473344cfdbec7e7fb75643432ca62b68ddb0b`.
- Definition digest: `sha256:8b14ec14f7c9efaed537fb736d4fafdd7d4721cbab3d756d1e5c7419e98d45b5`.
- Record/boundary digest: `sha256:ec6c1a83337d3b98de2df3703dc02caf998bd1479bf769a2a383380e721b7b9f`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: `status_update`; forbidden: none.

**Original source text**

Present progress without future timing → status update.

**Visible context**

Present progress without future timing → status update.

**User intent:** Report present progress only.

**Authoring rationale:** Present progress without future timing → status update.

**Boundary notes**

```json
[
  {
    "id": "status_update",
    "distinction": "Present progress without future timing → status update.",
    "caseId": "H1"
  }
]
```

**Provisional flags:** OPTIONAL_NEIGHBOR_LABEL.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## expectation_setting/A1

Source: [expectation_setting/A1](../../packages/skills/definitions/atomic/coordination/expectation_setting.yaml#L179). Category: **APPLICATION**.

- Example digest: `sha256:4421361e8398f581fedad14bebe497e01cafef3cd1327eb2ec0a8b90d3d4a220`.
- Definition digest: `sha256:8b14ec14f7c9efaed537fb736d4fafdd7d4721cbab3d756d1e5c7419e98d45b5`.
- Record/boundary digest: `sha256:ec6c1a83337d3b98de2df3703dc02caf998bd1479bf769a2a383380e721b7b9f`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `REWRITE_DRAFT`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: none.

**Original source text**

User says probably tomorrow. “will finish tomorrow probably” → “I expect to finish tomorrow, but that isn't certain yet.”

**Visible context**

User estimates completion probably tomorrow.

**User intent:** Communicate likely completion tomorrow without a promise.

**Authoring rationale:** Canonical wording demonstration; preserve the supplied ledger. Not measured model output.

**Draft**

will finish tomorrow probably

**Proposed improvement (not a model result)**

I expect to finish tomorrow, but that isn't certain yet.

**Author-supplied ledger; review grounding independently**

```json
{
  "facts": ["User estimates completion probably tomorrow."],
  "commitments": [],
  "uncertainty": ["Tomorrow is an estimate, not a firm commitment."]
}
```

**Provisional flags:** REWRITE_ONLY_EVIDENCE, CERTAINTY_COMMITMENT_CHECK.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## follow_up/N1

Source: [follow_up/N1](../../packages/skills/definitions/atomic/coordination/follow_up.yaml#L93). Category: **NEGATIVE**.

- Example digest: `sha256:9b0c828471ba7794292ee9ee860c4e596480097ecb3375fccd8bc32fa827c5cf`.
- Definition digest: `sha256:d48baec95cb149f23b14c4082a16bde90fcff16daa0ae397102d7e9efd1732ec`.
- Record/boundary digest: `sha256:2ad69924347ae157ceb8e6c860a0736bcfd13cce706f198d5caafbf41cc222f1`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: `follow_up`.

**Original source text**

No earlier request is visible or user-supplied.

**Visible context**

No earlier request is visible or user-supplied.

**User intent:** Absent (null); do not fill without evidence.

**Authoring rationale:** Canonical exclusion: the stated evidence, intent, language or action does not support the focal definition. This is an authoring expectation, not a measured router result.

**Provisional flags:** INTENT_UNSPECIFIED, FOCAL_NEGATIVE_NOT_NONE.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## follow_up/H1

Source: [follow_up/H1](../../packages/skills/definitions/atomic/coordination/follow_up.yaml#L144). Category: **NEIGHBOR**.

- Example digest: `sha256:b34fe80838510123a4b909cdbf1873edb8a563d1267111f16b4da15539db4916`.
- Definition digest: `sha256:d48baec95cb149f23b14c4082a16bde90fcff16daa0ae397102d7e9efd1732ec`.
- Record/boundary digest: `sha256:2ad69924347ae157ceb8e6c860a0736bcfd13cce706f198d5caafbf41cc222f1`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: `request`; forbidden: none.

**Original source text**

First request for the report → request.

**Visible context**

First request for the report → request.

**User intent:** Request the report for the first time.

**Authoring rationale:** First request for the report → request.

**Boundary notes**

```json
[
  {
    "id": "request",
    "distinction": "First request for the report → request.",
    "caseId": "H1"
  }
]
```

**Provisional flags:** OPTIONAL_NEIGHBOR_LABEL.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## follow_up/A1

Source: [follow_up/A1](../../packages/skills/definitions/atomic/coordination/follow_up.yaml#L175). Category: **APPLICATION**.

- Example digest: `sha256:e9730b35fa53720cabd44febc3b9b2427acaaaa0fd399e2c0f364038149a2ec8`.
- Definition digest: `sha256:d48baec95cb149f23b14c4082a16bde90fcff16daa0ae397102d7e9efd1732ec`.
- Record/boundary digest: `sha256:2ad69924347ae157ceb8e6c860a0736bcfd13cce706f198d5caafbf41cc222f1`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `REWRITE_DRAFT`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: none.

**Original source text**

Visible earlier report-review request. “why haven't you replied” → “Following up on my report-review request—have you had a chance to look?”

**Visible context**

An earlier request to review the report is visible. There is no evidence that silence means blame or neglect.

**User intent:** Follow up on the report-review request.

**Authoring rationale:** Canonical wording demonstration; preserve the supplied ledger. Not measured model output.

**Draft**

why haven't you replied

**Proposed improvement (not a model result)**

Following up on my report-review request—have you had a chance to look?

**Author-supplied ledger; review grounding independently**

```json
{
  "facts": [
    "An earlier request to review the report is visible.",
    "There is no evidence that silence means blame or neglect."
  ],
  "commitments": [],
  "uncertainty": []
}
```

**Provisional flags:** REWRITE_ONLY_EVIDENCE.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## zh.code_switching/N1

Source: [zh.code_switching/N1](../../packages/skills/definitions/modifiers/zh/code_switching.yaml#L95). Category: **NEGATIVE**.

- Example digest: `sha256:500d47245bc4ed082223bb366d95b35b172ef6cbb326f7363690c664c2cecea2`.
- Definition digest: `sha256:fd064e6bdde7fd1076e53d29cdd170688a302c3cbb7b9e97faf1758524deb624`.
- Record/boundary digest: `sha256:fd248a1ea380e7734fec22e58ab5c7cee5e3e44b013f89aaf8cad3a26cb0bf64`.
- Language: `{"primary":"zh","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: `zh.code_switching`.

**Original source text**

Pure Chinese without intentional English terms.

**Visible context**

Pure Chinese without intentional English terms.

**User intent:** Absent (null); do not fill without evidence.

**Authoring rationale:** Canonical exclusion: the stated evidence, intent, language or action does not support the focal definition. This is an authoring expectation, not a measured router result.

**Provisional flags:** INTENT_UNSPECIFIED, FOCAL_NEGATIVE_NOT_NONE.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## zh.code_switching/H1

Source: [zh.code_switching/H1](../../packages/skills/definitions/modifiers/zh/code_switching.yaml#L146). Category: **NEIGHBOR**.

- Example digest: `sha256:f7eec9b3011d6931fdbd9f2af9f57f16d47ed1e59a26f7c0a25cec6adf218b31`.
- Definition digest: `sha256:fd064e6bdde7fd1076e53d29cdd170688a302c3cbb7b9e97faf1758524deb624`.
- Record/boundary digest: `sha256:fd248a1ea380e7734fec22e58ab5c7cee5e3e44b013f89aaf8cad3a26cb0bf64`.
- Language: `{"primary":"zh","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: `zh.natural_conciseness`; forbidden: none.

**Original source text**

Natural short Chinese without mixed terms → natural_conciseness.

**Visible context**

Natural short Chinese without mixed terms → natural_conciseness.

**User intent:** Use natural concise Chinese.

**Authoring rationale:** Natural short Chinese without mixed terms → natural_conciseness.

**Boundary notes**

```json
[
  {
    "id": "zh.natural_conciseness",
    "distinction": "Natural short Chinese without mixed terms → natural_conciseness.",
    "caseId": "H1"
  }
]
```

**Provisional flags:** OPTIONAL_NEIGHBOR_LABEL.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## zh.code_switching/A1

Source: [zh.code_switching/A1](../../packages/skills/definitions/modifiers/zh/code_switching.yaml#L181). Category: **APPLICATION**.

- Example digest: `sha256:49a45f7e9ea5f0b6fb0f40b8291a1ee5ffff6a23f18fbe97f2222b55cd346b33`.
- Definition digest: `sha256:fd064e6bdde7fd1076e53d29cdd170688a302c3cbb7b9e97faf1758524deb624`.
- Record/boundary digest: `sha256:fd248a1ea380e7734fec22e58ab5c7cee5e3e44b013f89aaf8cad3a26cb0bf64`.
- Language: `{"primary":"zh-Hans","secondary":"en","codeSwitching":true}`.
- Proposed authoring action: `REWRITE_DRAFT`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: none.

**Original source text**

“这个 PR 我已经看过了，没发现问题” → “这个 PR 我看过了，没发现问题。”

**Visible context**

User reviewed the PR. User found no problems.

**User intent:** Report review of the PR and findings.

**Authoring rationale:** Canonical wording demonstration; preserve the supplied ledger. Not measured model output.

**Draft**

这个 PR 我已经看过了，没发现问题

**Proposed improvement (not a model result)**

这个 PR 我看过了，没发现问题。

**Author-supplied ledger; review grounding independently**

```json
{
  "facts": ["User reviewed the PR.", "User found no problems."],
  "commitments": [],
  "uncertainty": []
}
```

**Provisional flags:** REWRITE_ONLY_EVIDENCE.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## zh.natural_conciseness/N1

Source: [zh.natural_conciseness/N1](../../packages/skills/definitions/modifiers/zh/natural_conciseness.yaml#L94). Category: **NEGATIVE**.

- Example digest: `sha256:3404bc4b82972bd2deeb35ea817c0eae6c4e9454cffd57e993e3a1a276a3b1ab`.
- Definition digest: `sha256:4919bbe8c31bb790bf8bc0b077ad776d05daec6a060d020aaedca780b9484332`.
- Record/boundary digest: `sha256:07c3693fcb2683e645773928743697ea22824f66ddee5b1bf2358c5efa369f5d`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: `zh.natural_conciseness`.

**Original source text**

English-only context.

**Visible context**

English-only context.

**User intent:** Absent (null); do not fill without evidence.

**Authoring rationale:** Canonical exclusion: the stated evidence, intent, language or action does not support the focal definition. This is an authoring expectation, not a measured router result.

**Provisional flags:** INTENT_UNSPECIFIED, FOCAL_NEGATIVE_NOT_NONE.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## zh.natural_conciseness/H1

Source: [zh.natural_conciseness/H1](../../packages/skills/definitions/modifiers/zh/natural_conciseness.yaml#L145). Category: **NEIGHBOR**.

- Example digest: `sha256:19d711d4dcadef8df2117d74fb4b8690ca78b656cec98e3667df0fb005053d8c`.
- Definition digest: `sha256:4919bbe8c31bb790bf8bc0b077ad776d05daec6a060d020aaedca780b9484332`.
- Record/boundary digest: `sha256:07c3693fcb2683e645773928743697ea22824f66ddee5b1bf2358c5efa369f5d`.
- Language: `{"primary":"zh","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: `zh.professional_formality`; forbidden: none.

**Original source text**

Formal work progress report → professional_formality.

**Visible context**

Formal work progress report → professional_formality.

**User intent:** Report formal work progress.

**Authoring rationale:** Formal work progress report → professional_formality.

**Boundary notes**

```json
[
  {
    "id": "zh.professional_formality",
    "distinction": "Formal work progress report → professional_formality.",
    "caseId": "H1"
  }
]
```

**Provisional flags:** OPTIONAL_NEIGHBOR_LABEL.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## zh.natural_conciseness/A1

Source: [zh.natural_conciseness/A1](../../packages/skills/definitions/modifiers/zh/natural_conciseness.yaml#L176). Category: **APPLICATION**.

- Example digest: `sha256:32f1f922bd86a2180a68e79f6bfcdd6cace9aa94e151f615a8cd6830b684f0a8`.
- Definition digest: `sha256:4919bbe8c31bb790bf8bc0b077ad776d05daec6a060d020aaedca780b9484332`.
- Record/boundary digest: `sha256:07c3693fcb2683e645773928743697ea22824f66ddee5b1bf2358c5efa369f5d`.
- Language: `{"primary":"zh-Hans","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `REWRITE_DRAFT`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: none.

**Original source text**

Agreed Saturday meeting. “那我们就按照我们说好的在周六见面吧” → “那就周六见。”

**Visible context**

Meeting on Saturday is agreed.

**User intent:** Restate the agreed Saturday meeting.

**Authoring rationale:** Canonical wording demonstration; preserve the supplied ledger. Not measured model output.

**Draft**

那我们就按照我们说好的在周六见面吧

**Proposed improvement (not a model result)**

那就周六见。

**Author-supplied ledger; review grounding independently**

```json
{
  "facts": ["Meeting on Saturday is agreed."],
  "commitments": ["The Saturday meeting is already agreed."],
  "uncertainty": []
}
```

**Provisional flags:** REWRITE_ONLY_EVIDENCE.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## zh.politeness_calibration/N1

Source: [zh.politeness_calibration/N1](../../packages/skills/definitions/modifiers/zh/politeness_calibration.yaml#L95). Category: **NEGATIVE**.

- Example digest: `sha256:d42b50d6b3d72a3c3c0434891beda1dc5ffb661b1c501468731d41d42a1c8092`.
- Definition digest: `sha256:4d5484395f4e00eec44905ab5f2ac7be1ebc0277ac33bd9e6a78616e8949df96`.
- Record/boundary digest: `sha256:d20a9ce57f1c6e3d81cad6fc2fc0a292ccee5d4f3c39a974060405215d058f0a`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: `zh.politeness_calibration`.

**Original source text**

English-only chat.

**Visible context**

English-only chat.

**User intent:** Absent (null); do not fill without evidence.

**Authoring rationale:** Canonical exclusion: the stated evidence, intent, language or action does not support the focal definition. This is an authoring expectation, not a measured router result.

**Provisional flags:** INTENT_UNSPECIFIED, FOCAL_NEGATIVE_NOT_NONE.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## zh.politeness_calibration/H1

Source: [zh.politeness_calibration/H1](../../packages/skills/definitions/modifiers/zh/politeness_calibration.yaml#L146). Category: **NEIGHBOR**.

- Example digest: `sha256:0cbe94f57c53e70cfe2b4f7b3c766551dde04186e2bc1e9f1505b7ecbb622597`.
- Definition digest: `sha256:4d5484395f4e00eec44905ab5f2ac7be1ebc0277ac33bd9e6a78616e8949df96`.
- Record/boundary digest: `sha256:d20a9ce57f1c6e3d81cad6fc2fc0a292ccee5d4f3c39a974060405215d058f0a`.
- Language: `{"primary":"zh","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: `zh.professional_formality`; forbidden: none.

**Original source text**

Chinese progress report → professional_formality.

**Visible context**

Chinese progress report → professional_formality.

**User intent:** Report progress.

**Authoring rationale:** Chinese progress report → professional_formality.

**Boundary notes**

```json
[
  {
    "id": "zh.professional_formality",
    "distinction": "Chinese progress report → professional_formality.",
    "caseId": "H1"
  }
]
```

**Provisional flags:** OPTIONAL_NEIGHBOR_LABEL.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## zh.politeness_calibration/A1

Source: [zh.politeness_calibration/A1](../../packages/skills/definitions/modifiers/zh/politeness_calibration.yaml#L177). Category: **APPLICATION**.

- Example digest: `sha256:a72d6df2b19089d10bf2cdeffce3118525c9610f2e4d15d1d77829573df5f268`.
- Definition digest: `sha256:4d5484395f4e00eec44905ab5f2ac7be1ebc0277ac33bd9e6a78616e8949df96`.
- Record/boundary digest: `sha256:d20a9ce57f1c6e3d81cad6fc2fc0a292ccee5d4f3c39a974060405215d058f0a`.
- Language: `{"primary":"zh-Hans","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `REWRITE_DRAFT`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: none.

**Original source text**

“把文件发来” → “请把文件发给我。”

**Visible context**

User wants the file.

**User intent:** Request the file.

**Authoring rationale:** Canonical wording demonstration; preserve the supplied ledger. Not measured model output.

**Draft**

把文件发来

**Proposed improvement (not a model result)**

请把文件发给我。

**Author-supplied ledger; review grounding independently**

```json
{
  "facts": ["User wants the file."],
  "commitments": [],
  "uncertainty": []
}
```

**Provisional flags:** REWRITE_ONLY_EVIDENCE.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## zh.professional_formality/N1

Source: [zh.professional_formality/N1](../../packages/skills/definitions/modifiers/zh/professional_formality.yaml#L96). Category: **NEGATIVE**.

- Example digest: `sha256:ceb7fa315b0776341e42c7b4a6e12089b206837ccd5988f75c0f351250751923`.
- Definition digest: `sha256:d02f406cb4ed7fb871516e9a7100c161b089eca8e09deef0e6d55c7050f6cff4`.
- Record/boundary digest: `sha256:e2ffc97c096020838642ddf6109fde9291c32032ffbe9ebc1bb292b8d75eb369`.
- Language: `{"primary":"en","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: `zh.professional_formality`.

**Original source text**

English-only chat.

**Visible context**

English-only chat.

**User intent:** Absent (null); do not fill without evidence.

**Authoring rationale:** Canonical exclusion: the stated evidence, intent, language or action does not support the focal definition. This is an authoring expectation, not a measured router result.

**Provisional flags:** INTENT_UNSPECIFIED, FOCAL_NEGATIVE_NOT_NONE.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## zh.professional_formality/H1

Source: [zh.professional_formality/H1](../../packages/skills/definitions/modifiers/zh/professional_formality.yaml#L147). Category: **NEIGHBOR**.

- Example digest: `sha256:9b5d5557565855438dff4360999d75a2963c262ae70c79c4f6335cb653b8f974`.
- Definition digest: `sha256:d02f406cb4ed7fb871516e9a7100c161b089eca8e09deef0e6d55c7050f6cff4`.
- Record/boundary digest: `sha256:e2ffc97c096020838642ddf6109fde9291c32032ffbe9ebc1bb292b8d75eb369`.
- Language: `{"primary":"zh","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `SUGGEST_REPLY`; observed routing: **not run**.
- Expected: none; acceptable: `zh.natural_conciseness`; forbidden: none.

**Original source text**

Casual Chinese weekend plan → natural_conciseness.

**Visible context**

Casual Chinese weekend plan → natural_conciseness.

**User intent:** Coordinate a casual weekend plan.

**Authoring rationale:** Casual Chinese weekend plan → natural_conciseness.

**Boundary notes**

```json
[
  {
    "id": "zh.natural_conciseness",
    "distinction": "Casual Chinese weekend plan → natural_conciseness.",
    "caseId": "H1"
  }
]
```

**Provisional flags:** OPTIONAL_NEIGHBOR_LABEL.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.

## zh.professional_formality/A1

Source: [zh.professional_formality/A1](../../packages/skills/definitions/modifiers/zh/professional_formality.yaml#L178). Category: **APPLICATION**.

- Example digest: `sha256:6ca02e20a459b7b8243e15781f9478456b37c90ed16299ff78875ef0a353a8d2`.
- Definition digest: `sha256:d02f406cb4ed7fb871516e9a7100c161b089eca8e09deef0e6d55c7050f6cff4`.
- Record/boundary digest: `sha256:e2ffc97c096020838642ddf6109fde9291c32032ffbe9ebc1bb292b8d75eb369`.
- Language: `{"primary":"zh-Hans","secondary":null,"codeSwitching":false}`.
- Proposed authoring action: `REWRITE_DRAFT`; observed routing: **not run**.
- Expected: none; acceptable: none; forbidden: none.

**Original source text**

“关于这个报告目前的情况呢就是初稿已经完成了” → “报告初稿已完成。”

**Visible context**

The report's first draft is complete.

**User intent:** Report that the first draft is complete.

**Authoring rationale:** Canonical wording demonstration; preserve the supplied ledger. Not measured model output.

**Draft**

关于这个报告目前的情况呢就是初稿已经完成了

**Proposed improvement (not a model result)**

报告初稿已完成。

**Author-supplied ledger; review grounding independently**

```json
{
  "facts": ["The report's first draft is complete."],
  "commitments": [],
  "uncertainty": []
}
```

**Provisional flags:** REWRITE_ONLY_EVIDENCE.

**Human review:** PENDING. Reviewer / competence / date / decision / rationale / second review / adjudication: unassigned.
