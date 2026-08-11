# Communication skills

## Purpose

Skills encode reusable communication knowledge that can guide a response without stuffing every known technique into a model prompt. They are structured, versioned, language-aware, and selected for the current situation.

The current conversation dominates skill selection. Historical success may be a weak prior, never a reason to ignore visible evidence.

## Atomic skills and composite playbooks

**Atomic skills** express one reusable communication operation, such as apologizing, validating emotion, setting a boundary, giving status, declining, reassuring, de-escalating, negotiating, or resetting expectations.

**Composite playbooks** describe a recurring composition of atomic skills. For example:

- missed deadline with a manager: professional accountability + status update + expectation reset + deadline negotiation;
- friend upset about a cancellation: emotional validation + apology + relationship repair.

A playbook references and configures atomic skills; it should not copy their full content. Create a new atomic skill only when it adds a distinct principle or behavior. Do not multiply skills for every relationship/situation pairing when metadata and composition can express the difference.

## Registry contract

The registry's final Zod schema will live in `packages/contracts`. A skill should contain at least:

```ts
interface SkillDefinition {
  id: string;
  name: string;
  description: string;

  kind: "ATOMIC" | "PLAYBOOK";
  status: "APPROVED" | "ACTIVE" | "DEPRECATED";
  languages: ("universal" | "en" | "zh-Hans" | "zh-Hant")[];
  domains: string[];
  relationships: string[];
  situations: string[];

  useWhen: string[];
  doNotUseWhen: string[];
  principles: string[];
  avoid: string[];

  requiredContext: string[];
  optionalContext: string[];
  compatibleSkills: string[];
  conflictingSkills: string[];
  dependsOn: string[];

  version: number;
}
```

Production definitions will also need provenance/review metadata and evaluation references. Content should be concise enough for selected skills to fit comfortably in the response prompt.

IDs are stable across versions. A substantive behavior change increments `version`; deprecation preserves history rather than silently replacing the meaning of an existing version.

## Language policy

- `universal` skills may be used for every language.
- `en` skills require English relevance.
- `zh-Hans` and `zh-Hant` skills require Chinese relevance; shared Chinese guidance should not be duplicated merely for script conversion.
- Mixed English/Chinese conversations may select relevant supported skills from both families.
- Other languages receive universal skills only.

Language-specific skills capture genuinely language- or culture-dependent behavior, not translations of universal principles. Current conversation and draft language take priority over stored preferences.

## Provider independence

Skills describe communication behavior, not model-vendor behavior. Definitions, registry validation, selection, conflict resolution, composition, and the Skill Factory operate on internal contracts and must not encode assumptions such as “only works with provider/model X.”

If retrieval, reranking, composition, or evaluation uses a model, it calls a provider-neutral AI task interface. Provider adapters handle model-specific request formats and capabilities. Adding or replacing a provider must not require rewriting skill content or the language policy.

## Runtime retrieval

The long-term pipeline is:

```text
approved catalog
→ language and domain metadata filter
→ relationship and situation filter
→ semantic/hybrid retrieval
→ about 20 candidates
→ rerank
→ about 3–6 selected skills
→ dependency/conflict resolution
→ communication plan
→ response
```

For the MVP, the catalog is intentionally small. Deterministic metadata filtering plus model reranking or selection is sufficient. Do not add embeddings, pgvector, or a dedicated retrieval service until catalog scale and measured retrieval failures justify them.

Retrieval requirements:

1. Query from current observed/inferred context, not identity guesses presented as facts.
2. Filter out non-applicable language-specific skills before semantic ranking.
3. Exclude every skill not approved for runtime use.
4. Honor `doNotUseWhen`, required context, dependencies, and conflicts.
5. Prefer the smallest coherent composition that covers the communication plan.
6. Record skill IDs and versions in privacy-safe evaluation traces, without raw message content.

When skills conflict, explicit safety/avoidance constraints outrank preference, a more context-specific applicable rule outranks a generic one, and the planner should omit a nonessential skill rather than force an incoherent merge.

## Initial MVP registry

The first registry should be small enough to review manually and broad enough for evaluation fixtures. A reasonable initial set is:

- apology/accountability;
- concise status update;
- expectation reset and deadline negotiation;
- emotional validation;
- reassurance;
- polite decline;
- boundary setting;
- asking for details/help;
- conflict de-escalation;
- relationship repair;
- professional tone (English and Chinese where behavior differs);
- concise action/choice framing.

This is a proposed coverage set, not permission to implement it during the architecture-foundation milestone. Phase 2 should add only the skills needed by its approved fixtures.

## Skill quality and tests

Each active skill needs:

- schema validation and referential-integrity checks;
- positive and negative usage fixtures;
- conflict/dependency tests where applicable;
- language eligibility tests;
- evaluations for instruction adherence, usefulness, invented claims, and undesirable side effects;
- an accountable review/approval record.

Test skill selection separately from final prose quality. A good response produced through the wrong, ineligible skill can hide a retrieval defect.

## Skill Factory (future, offline)

The Skill Factory is a governed authoring and evaluation system, not part of normal response generation. Its lifecycle is:

```text
DRAFT → GENERATED → EVALUATING → APPROVED → ACTIVE → DEPRECATED
```

It may analyze scenario coverage, propose candidate skills, detect overlap, run evaluations, and recommend:

- `NEW`;
- `MERGE`;
- `EXTEND_EXISTING`;
- `REJECT_DUPLICATE`.

No generated skill may enter runtime merely because a model created it. Promotion requires schema validation, deduplication, evaluation thresholds, review, and an auditable version change. The factory should work on minimized or synthetic evaluation data where possible.

The factory is intentionally deferred until runtime behavior, registry schema, evaluation methodology, and real coverage gaps are understood. Building it before those inputs exist would automate an unstable target.
