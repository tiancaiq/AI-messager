# Memory

## Purpose and status

Memory should reduce repeated explanation without turning uncertain model inference into a permanent profile. Long-term memory is not required for the first MVP proof and must remain behind an interface until an approved milestone adds it.

Memory acquisition, extraction, and retrieval policy are provider-independent. If a future extraction step uses a model, it must call a provider-neutral AI task interface; memory code must not import a provider SDK or treat provider output as trusted memory.

The guiding distinction is:

> Observation is evidence; inference is a candidate; confirmation is trusted memory.

## Categories

### User memory

Preferences about the user's own communication, such as preferred brevity, emoji use, naturalness, formality, or explicitly stated boundaries.

### Contact memory

Information associated with a high-confidence contact, such as relationship, role, communication preferences, and stable identity signals. Contact memory cannot be loaded on weak identity evidence.

### Interaction memory

Relevant shared context, such as an active project, requested update, promise, disagreement, or pending decision. This tends to decay faster than identity or family relationship information.

These categories have different retention and relevance rules; they should not be collapsed into a transcript archive.

## Evidence and memory lifecycle

The acquisition lifecycle is:

```text
OBSERVED → CANDIDATE → CONFIRMED → STALE / SUPERSEDED
```

- **OBSERVED:** a bounded, sourced observation from a current interaction. It is not automatically durable.
- **CANDIDATE:** a potentially useful inferred fact with evidence, confidence, source time, and proposed memory category.
- **CONFIRMED:** accepted by explicit user confirmation or a future, deliberately conservative evidence policy. User confirmation has the greatest weight.
- **STALE:** once-useful information whose age or contradictory evidence makes current use unsafe without qualification.
- **SUPERSEDED:** a newer trusted fact replaces it; the old record is retained only if audit/history policy requires it.

`CANDIDATE` must never be silently presented to later reasoning as confirmed truth. Repeated consistent evidence can strengthen a candidate, but confirmation behavior and thresholds require evaluation before implementation.

Example: “Alex may be a classmate” at 0.72 remains a candidate. A future UI may ask, “Alex seems to be your classmate—correct?” rather than save `relationship = classmate` as fact.

## Suggested record shape

The eventual contract should support:

```ts
interface MemoryRecord<T> {
  id: string;
  category: "USER" | "CONTACT" | "INTERACTION";
  state: "CANDIDATE" | "CONFIRMED" | "STALE" | "SUPERSEDED";
  value: T;
  confidence: number;
  sourceKind: "USER_EXPLICIT" | "MODEL_INFERENCE" | "REPEATED_EVIDENCE";
  observedAt: string;
  confirmedAt?: string;
  lastSupportedAt: string;
  validFrom?: string;
  validUntil?: string;
  supersedesId?: string;
  evidenceRefs: string[];
}
```

This is conceptual. The production schema must minimize stored evidence, avoid raw message bodies where a structured claim suffices, and support deletion.

## Identity gate

Identity matching may combine platform, username, display name, avatar similarity, prior conversation evidence, and local contact history. Each signal should retain provenance and confidence.

Rules:

- require very high combined confidence before attaching a screenshot to an existing contact;
- never use avatar alone;
- treat ambiguous contacts as unknown rather than choosing the nearest match;
- do not merge candidates across contacts without explicit resolution;
- keep identity, relationship, situation, and intent confidence separate;
- prefer local matching for identity/avatar signals when practical.

A relationship inference does not prove identity, and an identity match does not prove that an old relationship role is current.

## Temporal reasoning

Every memory has an observation time, a freshness profile, and possibly a validity interval. Decay is fact-type dependent:

| Stability | Examples | Default reasoning behavior |
|---|---|---|
| Very stable | confirmed identity, family relationship | Slow decay; still yield to explicit correction |
| Semi-stable | manager, coworker, professor, partner, communication style | Reassess over time; qualify or mark stale when old/conflicted |
| Temporary | current project, deadline, active disagreement | Decay quickly after the event window |
| Ephemeral | busy now, today's meeting, temporary location | Expire automatically after a short relevant window |

Exact durations must be learned and configured by fact type; do not use one global time-to-live.

The last observed digital message is not the last interaction. People may have met, called, used another app, or deleted messages. Therefore the system may say “we have no recent observed messaging evidence,” but must not infer “they have not spoken for five years.”

Current visible evidence normally outranks old memory. A contradiction should lower confidence, suppress the old fact, and potentially mark it stale or propose a superseding candidate; it should not be averaged into a misleading certainty.

## Retrieval policy

Future memory retrieval should be request-scoped and least-necessary:

1. Establish an identity above the contact-memory gate, or retrieve only non-contact user preferences.
2. Filter by category, relevance to the current situation, freshness, and state.
3. Exclude unconfirmed contact/interaction candidates from trusted context.
4. Pass only compact structured facts needed for the current decision.
5. Label age and confidence so the response engine can favor current evidence.
6. Do not let historically successful wording or skills override current language, draft, or situation.

The initial `MemoryReader` should return no durable memory. This keeps reasoning code compatible with a future implementation without implying that storage already exists.

## Acquisition and user control

After ephemeral screenshot analysis, a future acquisition process may extract a small candidate fact. It should not store the full screenshot by default. The user must eventually be able to review, correct, confirm, and delete durable memory.

Sensitive or surprising categories require explicit confirmation even if repeated evidence seems strong. Memory acquisition must be independently disableable. Product behavior must remain useful when memory is off.

## Prohibited shortcuts

- no raw screenshot archive as “memory”;
- no permanent storage of every conversation or response;
- no confirmed fact created from a single model inference;
- no contact association below the identity gate;
- no timeless relationship labels;
- no assumption that missing observed messages mean missing real-world interaction;
- no vector database before durable memory and retrieval requirements are approved.
