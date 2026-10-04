# Phase B4.7 boundary-scope grounding design

Status: pre-implementation design; B4.6 frozen at `b1d5024` (`agent-architecture-b4-6-freeze`)

## Failure and authority

The B4.6 source draft `我不能再這樣做了，請不要再催。` expressed an unqualified limit and request to stop pressure. A softer alternative `這件事我沒辦法再繼續了，請先不要再催我。` added `先` to the pressure boundary. The human reviewer found `MATERIAL_MEANING_WEAKENING`; the whole package failed despite a valid primary and deterministic guard PASS. The Skill System's `boundary_setting`/`decline`/secondary `request` selection did not supply the temporal word and is not the demonstrated cause. The Composer changed meaning while applying communication technique.

The validated user-owned draft or explicit selection supplies the boundary's scope. OTHER messages may explain pressure but cannot redefine that scope. The fixed Agent action remains authoritative. Skill guidance and style can soften wording, not duration. The scope belongs in `ComposerTask.mustPreserve` above `mustNotInvent`, core guidance and optional style; it applies independently to every candidate.

## Minimal representation and comparison

Extend the existing bounded, source-qualified anchor with a `BOUNDARY_SCOPE` concept. Its value encodes a small recognized boundary kind and one of `DURABLE_OR_UNQUALIFIED`, `TEMPORARY`, or `UNKNOWN`; `owner` is `USER` and `sourceRef` is the existing reliable draft/selection reference. `DURABLE_OR_UNQUALIFIED` means only “the source did not qualify this boundary as temporary,” not an assertion of permanence. `TEMPORARY` requires a qualifier attached to that boundary, not merely a time word elsewhere. `UNKNOWN` is for recognized boundaries whose duration cannot be classified confidently. This stays internal/request-local and does not become a public contract or semantic graph.

The bounded source-aware backstop recognizes high-signal English and Simplified/Traditional Chinese boundary clauses, such as a request to stop ongoing asking/pressure or a limit on continuing/taking extra work. It detects temporary modifiers only when syntactically adjacent to the recognized boundary clause. Compare each candidate's corresponding recognized boundary kind to the source anchor:

| Source scope | Candidate scope | Result |
| --- | --- | --- |
| Durable/unqualified | Durable/unqualified | Allow, subject to other guards and human review. |
| Durable/unqualified | Temporary | Reject: introduced temporariness. |
| Temporary | Temporary | Allow, subject to semantic and tone review. |
| Temporary | Durable/unqualified | Reject: stronger boundary than source. |
| Unknown | Explicitly temporary | Reject unsupported qualifier; otherwise preserve neutral wording and existing uncertainty. |
| Any | Unrecognized paraphrase | Do not fabricate a classification; existing guards and human review remain necessary. |

This is not a global ban on `先`, `暫時`, `暂时`, “for now,” “at the moment” or “for the time being.” `先確認時間，再回覆他` is sequence, not a boundary. “Tomorrow” elsewhere in a sentence is a factual timing anchor, not automatic boundary temporariness. An explicit source `請先不要催我` can become `暫時請不要催我` where meaning is preserved. A source “For now, I can't take on more work” cannot silently become “I can't take on more work.”

When the same recognized source boundary kind carries conflicting scopes in different clauses, derivation abstains instead of placing a contradictory hard anchor. When wording such as “maybe” leaves a recognized boundary's duration unclear, the anchor can be `UNKNOWN`; the backstop rejects an added explicit temporary qualifier, while the existing uncertainty guard handles loss of uncertainty. These cases still require semantic review.

The guard should abstain outside the recognized clause/kind patterns rather than reject all unfamiliar phrasing. Tests must expose this limited coverage; no claim of full entailment. All generated primary and alternative candidates use the same task/guard. The existing adapter's action, strict output schema, model, `store: false` and output budget do not change.

## Regression and live gate

Convert B4.6's four expected-failing examples into ordinary tests; add Traditional/Simplified Chinese and English durable→temporary, source-supported temporary→temporary, temporary→unqualified, unrelated time/sequence, and combined pressure/refusal/empathy controls. Propagate the anchor into the provider payload and add one precise candidate instruction. Re-run B4.6 status, commitment, uncertainty, prior-thanks, refusal, polite-modal and bilingual-time tests and the B3.5 Skill comparison. The [B4.7 plan](../.agent/plans/agent-architecture-phase-b4-7.md) locks the ten synthetic cases and ten-call maximum before live use. Human review of every candidate determines whether the small gate passes; a deterministic PASS alone does not.

## Privacy and limitations

Source text and candidates are request-local except for deliberately synthetic ignored evaluation artifacts. The anchor contains bounded structural scope, kind and existing source reference. No screenshot, real conversation, provider raw payload, key, registry, Skill ID, analytics, history or new persistence path is added. Human judgment remains authoritative for whether `先` or an English qualifier actually changes the boundary's duration in context.
