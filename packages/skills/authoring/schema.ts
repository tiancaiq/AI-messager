import {
  AgentActionSchema,
  SkillContextSchema,
  SkillDefinitionSchema,
} from "@ai-message-coach/contracts";
import { z } from "zod";

const text = z.string().trim().min(1).max(2000);
const id = SkillDefinitionSchema.shape.id;
const digest = z.string().regex(/^sha256:[a-f0-9]{64}$/);
const revision = z.string().regex(/^[a-f0-9]{40}$/);
const unique = <T>(values: readonly T[]) => new Set(values).size === values.length;
const ids = z.array(id).max(21).refine(unique, "IDs must be unique.");

export const atomicFamilies = [
  "accountability_repair",
  "recognition_support",
  "understanding_inquiry",
  "requests_options",
  "decisions_limits",
  "conflict_feedback",
  "coordination",
  "explanation_connection",
] as const;
export const FamilySchema = z.enum([...atomicFamilies, "language_expression"]);
const caseId = z.enum(["P1", "P2", "P3", "N1", "N2", "N3", "H1", "H2", "A1", "A2"]);

const exampleContext = {
  id: caseId,
  sourceText: text,
  visibleContext: text,
  userIntent: text.nullable(),
  action: AgentActionSchema,
  language: SkillContextSchema.shape.language,
  expected: ids.max(4),
  acceptable: ids,
  forbidden: ids,
  rationale: text,
};
const selectionExample = z
  .object({
    ...exampleContext,
    category: z.enum(["POSITIVE", "NEGATIVE", "NEIGHBOR"]),
  })
  .strict();
const applicationExample = z
  .object({
    ...exampleContext,
    category: z.literal("APPLICATION"),
    draft: text,
    improved: text,
    ledger: z
      .object({
        facts: z.array(text).min(1).max(12),
        commitments: z.array(text).max(12),
        uncertainty: z.array(text).max(12),
      })
      .strict(),
  })
  .strict();
const RuntimeReviewSchema = z.discriminatedUnion("state", [
  z.object({ state: z.literal("DRAFT") }).strict(),
  z
    .object({
      state: z.literal("INHERITED"),
      baselineRevision: revision,
      definitionDigest: digest,
      evidenceRefs: z.array(text).min(1).max(6),
    })
    .strict(),
  z
    .object({
      state: z.literal("APPROVED"),
      approvedBy: text,
      definitionDigest: digest,
      evidenceRefs: z.array(text).min(1).max(6),
    })
    .strict(),
]);

export const AuthoringRecordSchema = z
  .object({
    recordVersion: z.literal(1),
    kind: z.enum(["ATOMIC", "LANGUAGE_MODIFIER"]),
    capabilityFamily: FamilySchema,
    definition: SkillDefinitionSchema,
    neighbors: z
      .array(
        z
          .object({
            id,
            distinction: text,
            caseId: z.enum(["H1", "H2"]),
          })
          .strict(),
      )
      .max(12),
    // Conceptual candidates stay in review-only prose, never machine-resolved skill IDs.
    conceptualNotes: z
      .array(
        z
          .object({
            caseId: z.enum(["H1", "H2"]),
            distinction: text,
            sourceRef: text,
          })
          .strict(),
      )
      .max(4),
    examples: z
      .object({
        expectationScope: z.literal("AUTHORING_ONLY"),
        selection: z.array(selectionExample).length(8),
        application: z.array(applicationExample).length(2),
      })
      .strict(),
    provenance: z
      .object({
        authorship: z.literal("internal"),
        definitionSource: text,
        exampleSource: text,
        examples: z.literal("independently-authored-synthetic"),
        rights: text,
      })
      .strict(),
    review: z
      .object({
        runtime: RuntimeReviewSchema,
        examples: z.object({ state: z.literal("PENDING_HUMAN_REVIEW") }).strict(),
      })
      .strict(),
  })
  .strict()
  .superRefine((record, context) => {
    const report = (message: string) => context.addIssue({ code: "custom", message });
    const languages = record.definition.languages;
    if (record.kind === "ATOMIC") {
      if (
        languages.length !== 1 ||
        languages[0] !== "universal" ||
        record.capabilityFamily === "language_expression"
      )
        report("Atomic definitions require universal language and an atomic family.");
    } else if (
      languages.length !== 1 ||
      !["en", "zh"].includes(languages[0] ?? "") ||
      record.capabilityFamily !== "language_expression"
    ) {
      report("Language modifiers require exactly one supported language and language_expression.");
    }
    const examples = [...record.examples.selection, ...record.examples.application];
    if (
      !unique(examples.map((example) => example.id)) ||
      caseId.options.some((label) => !examples.some((example) => example.id === label))
    )
      report("Canonical examples require each P1–P3/N1–N3/H1–H2/A1–A2 exactly once.");
    for (const example of examples) {
      const prefix = { POSITIVE: "P", NEGATIVE: "N", NEIGHBOR: "H", APPLICATION: "A" }[
        example.category
      ];
      if (!example.id.startsWith(prefix)) report("Case labels and categories must agree.");
      if (!unique([...example.expected, ...example.acceptable, ...example.forbidden]))
        report("Example expectation sets cannot overlap.");
      if (example.category === "POSITIVE" && !example.expected.includes(record.definition.id))
        report("Positive examples require the focal definition.");
      if (example.category === "NEGATIVE" && !example.forbidden.includes(record.definition.id))
        report("Negative examples forbid the focal definition.");
      if (example.category === "APPLICATION" && example.action !== "REWRITE_DRAFT")
        report("Application examples require REWRITE_DRAFT.");
    }
    for (const neighbor of record.neighbors) {
      if (neighbor.id === record.definition.id) report("A definition cannot be its own neighbor.");
    }
  });

const sourcePath = z
  .string()
  .regex(/^(?:[a-z0-9_-]+\/)*[a-z0-9_.-]+\.yaml$/)
  .refine(
    (value) => !value.split("/").some((part) => part === "." || part === ".."),
    "Source must be a relative YAML path.",
  );
export const ManifestSchema = z
  .object({
    manifestVersion: z.literal(1),
    entries: z
      .array(
        z
          .object({
            id,
            source: sourcePath,
            recordDigest: digest,
          })
          .strict(),
      )
      .min(1)
      .max(100),
  })
  .strict()
  .superRefine((manifest, context) => {
    for (const field of ["id", "source"] as const) {
      if (!unique(manifest.entries.map((entry) => entry[field])))
        context.addIssue({ code: "custom", message: "Duplicate manifest " + field });
    }
  });
export const TaxonomySchema = z
  .object({
    taxonomyVersion: z.literal(1),
    families: z.array(z.object({ id: FamilySchema, description: text }).strict()).length(9),
  })
  .strict()
  .refine(
    (value) => unique(value.families.map((family) => family.id)),
    "Taxonomy families must be unique.",
  );
export const BaselineApprovalsSchema = z
  .object({
    notice: text,
    revision,
    evidenceRefs: z.array(text).min(1),
    definitions: z.array(z.object({ id, definitionDigest: digest }).strict()).length(21),
  })
  .strict()
  .refine(
    (value) => unique(value.definitions.map((entry) => entry.id)),
    "Baseline IDs must be unique.",
  );
export type AuthoringRecord = z.infer<typeof AuthoringRecordSchema>;
