import { z } from "zod";

import { DatasetGenerationSchema, LocalMemoryErrorSchema } from "./local-memory-core.js";
import {
  RelationshipAssertionMetadataSchema,
  RelationshipClaimSchema,
  RelationshipContextRecordSchema,
  RelationshipCorrectionReachSchema,
  RelationshipEndBoundarySchema,
  RelationshipEvidenceMetadataSchema,
  RelationshipValiditySchema,
  RelationshipValueSchema,
} from "./relationship.js";

export const MEMORY_ASSERTION_PAGE_LIMIT = 20;
export const MEMORY_ASSERTION_RESPONSE_BYTES = 16 * 1024;
export const MEMORY_EVIDENCE_LINK_LIMIT = 8;
export const MEMORY_ASSERTION_VERSION_LIMIT = 100;
export const MEMORY_DECISION_LIMIT = 100;

export const MemoryRevisionSchema = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const MessageLengthPreferenceSchema = z.enum(["CONCISE", "BALANCED", "DETAILED"]);
export const MemoryPredicateSchema = z.enum([
  "REPLY_LENGTH_PREFERENCE",
  "RELATIONSHIP_CATEGORY",
  "RELATIONSHIP_ROLE",
]);
export const MemoryAcceptanceSchema = z.enum(["CANDIDATE", "CONFIRMED", "REJECTED"]);
export const MemoryLifecycleSchema = z.enum(["ACTIVE", "SUPERSEDED"]);
export const MemoryApplicabilitySchema = z.enum(["CURRENT", "HISTORICAL", "UNKNOWN"]);
export const MemoryEvidenceSourceSchema = z.enum([
  "USER_SETTING",
  "LEGACY_SETTING_MIGRATION",
  "SYNTHETIC_FIXTURE",
]);
export const MemoryEvidenceRoleSchema = z.enum(["SUPPORTS", "CONTRADICTS", "CONTEXTUALIZES"]);
export const MemoryDecisionAuthoritySchema = z.enum([
  "USER_SETTING",
  "TRUSTED_USER_DECISION",
  "LEGACY_MIGRATION",
  "SYNTHETIC_FIXTURE",
]);

export const MemorySubjectSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("LOCAL_USER") }).strict(),
  z.object({ kind: z.literal("CONTACT"), contactId: z.uuid() }).strict(),
]);

const CalendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/u)
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const parsed = new Date(Date.UTC(year!, month! - 1, day!));
    return (
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month! - 1 &&
      parsed.getUTCDate() === day
    );
  }, "Invalid date.");
const CalendarMonthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/u);
export const MemoryTemporalValueSchema = z
  .discriminatedUnion("precision", [
    z.object({ precision: z.literal("UNKNOWN") }).strict(),
    z
      .object({
        precision: z.literal("INSTANT"),
        value: z.iso.datetime({ offset: true }),
        endExclusive: z.iso.datetime({ offset: true }).nullable().optional(),
      })
      .strict(),
    z
      .object({
        precision: z.literal("CALENDAR_DATE"),
        value: CalendarDateSchema,
        endExclusive: CalendarDateSchema.nullable().optional(),
      })
      .strict(),
    z
      .object({
        precision: z.literal("CALENDAR_MONTH"),
        value: CalendarMonthSchema,
        endExclusive: CalendarMonthSchema.nullable().optional(),
      })
      .strict(),
  ])
  .superRefine((value, context) => {
    if (value.precision === "UNKNOWN" || !value.endExclusive) return;
    const start = value.precision === "INSTANT" ? Date.parse(value.value) : value.value;
    const end = value.precision === "INSTANT" ? Date.parse(value.endExclusive) : value.endExclusive;
    if (end <= start)
      context.addIssue({
        code: "custom",
        message: "The end must be exclusive and after the start.",
      });
  });

export const MemoryAssociationDependencySchema = z
  .object({ associationId: z.uuid(), associationRevision: z.number().int().positive() })
  .strict();

export const MemoryConfidenceSchema = z
  .object({
    extraction: z.number().min(0).max(1).nullable(),
    attribution: z.number().min(0).max(1).nullable(),
    predicate: z.number().min(0).max(1).nullable(),
  })
  .strict();

export const MemoryEvidenceInputSchema = z
  .object({
    source: MemoryEvidenceSourceSchema,
    sourceReference: z.string().min(1).max(256),
    sourceTime: MemoryTemporalValueSchema,
    confidence: MemoryConfidenceSchema,
    association: MemoryAssociationDependencySchema.nullable(),
  })
  .strict();

export const MemoryAssertionRecordSchema = z
  .object({
    recordType: z.literal("MEMORY_ASSERTION"),
    id: z.uuid(),
    subject: MemorySubjectSchema,
    predicate: MemoryPredicateSchema,
    value: z.union([MessageLengthPreferenceSchema, RelationshipValueSchema]),
    relationship: RelationshipAssertionMetadataSchema.nullable().optional(),
    effectiveApplicability: MemoryApplicabilitySchema.nullable().optional(),
    acceptance: MemoryAcceptanceSchema,
    lifecycle: MemoryLifecycleSchema,
    applicability: MemoryApplicabilitySchema,
    validTime: MemoryTemporalValueSchema,
    revision: z.number().int().positive(),
    replacesAssertionId: z.uuid().nullable(),
    reconsideredDecisionId: z.uuid().nullable(),
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.predicate === "REPLY_LENGTH_PREFERENCE") {
      if (value.relationship || typeof value.value !== "string")
        context.addIssue({ code: "custom", message: "Invalid preference assertion." });
    } else if (
      !value.relationship ||
      typeof value.value === "string" ||
      value.value.predicate !== value.predicate ||
      value.subject.kind !== "CONTACT" ||
      value.validTime.precision !== "UNKNOWN"
    )
      context.addIssue({ code: "custom", message: "Invalid relationship assertion." });
  });

export const MemoryEvidenceRecordSchema = z
  .object({
    recordType: z.literal("MEMORY_EVIDENCE"),
    id: z.uuid(),
    subject: MemorySubjectSchema,
    predicate: MemoryPredicateSchema,
    value: z.union([MessageLengthPreferenceSchema, RelationshipValueSchema]),
    relationship: RelationshipEvidenceMetadataSchema.nullable().optional(),
    source: MemoryEvidenceSourceSchema,
    sourceReference: z.string().min(1).max(256),
    sourceTime: MemoryTemporalValueSchema,
    confidence: MemoryConfidenceSchema,
    association: MemoryAssociationDependencySchema.nullable(),
    recordedAt: z.iso.datetime({ offset: true }),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.predicate === "REPLY_LENGTH_PREFERENCE") {
      if (value.relationship || typeof value.value !== "string")
        context.addIssue({ code: "custom", message: "Invalid preference evidence." });
    } else if (
      !value.relationship ||
      typeof value.value === "string" ||
      value.value.predicate !== value.predicate ||
      value.subject.kind !== "CONTACT"
    )
      context.addIssue({ code: "custom", message: "Invalid relationship evidence." });
  });

export const MemoryEvidenceLinkRecordSchema = z
  .object({
    recordType: z.literal("MEMORY_EVIDENCE_LINK"),
    assertionId: z.uuid(),
    evidenceId: z.uuid(),
    role: MemoryEvidenceRoleSchema,
    createdAt: z.iso.datetime({ offset: true }),
  })
  .strict();

export const MemoryDecisionOperationSchema = z.enum([
  "CONFIRM",
  "REJECT",
  "REPLACE",
  "RECONSIDER",
  "TRANSITION",
  "FACT_CORRECT",
]);
export const MemoryDecisionRecordSchema = z
  .object({
    recordType: z.literal("MEMORY_DECISION"),
    id: z.uuid(),
    assertionId: z.uuid(),
    assertionRevision: z.number().int().positive(),
    operation: MemoryDecisionOperationSchema,
    authority: MemoryDecisionAuthoritySchema,
    replacementAssertionId: z.uuid().nullable(),
    reconsideredDecisionId: z.uuid().nullable(),
    relationshipReach: RelationshipCorrectionReachSchema.nullable().optional(),
    relationshipInterval: RelationshipValiditySchema.nullable().optional(),
    createdAt: z.iso.datetime({ offset: true }),
  })
  .strict();

export const MemoryInspectorRecordTypeSchema = z.enum([
  "MEMORY_ASSERTION",
  "MEMORY_EVIDENCE",
  "MEMORY_EVIDENCE_LINK",
  "MEMORY_DECISION",
  "RELATIONSHIP_CONTEXT",
]);
export const MemoryInspectorRecordSchema = z.discriminatedUnion("recordType", [
  MemoryAssertionRecordSchema,
  MemoryEvidenceRecordSchema,
  MemoryEvidenceLinkRecordSchema,
  MemoryDecisionRecordSchema,
  RelationshipContextRecordSchema,
]);

const ExpectedMemoryStateSchema = z
  .object({ generation: DatasetGenerationSchema, memoryRevision: MemoryRevisionSchema })
  .strict();
export const MemoryPageFilterSchema = z
  .object({
    contactId: z.uuid().nullable(),
    predicate: MemoryPredicateSchema.nullable(),
    relationshipContextId: z.uuid().nullable(),
    asOf: z.iso.datetime({ offset: true }).nullable(),
  })
  .strict();
const SubjectWriteSchema = z
  .object({
    subject: MemorySubjectSchema,
    contactRevision: z.number().int().positive().nullable(),
  })
  .strict();

const NewClaimSchema = SubjectWriteSchema.extend({
  value: MessageLengthPreferenceSchema,
  applicability: MemoryApplicabilitySchema,
  validTime: MemoryTemporalValueSchema,
  evidence: MemoryEvidenceInputSchema,
}).strict();

export const MemoryAssertionRequestSchema = z
  .discriminatedUnion("operation", [
    ExpectedMemoryStateSchema.extend({
      operation: z.literal("LIST"),
      recordType: MemoryInspectorRecordTypeSchema,
      filter: MemoryPageFilterSchema.nullable().default(null),
      cursor: z
        .string()
        .min(1)
        .max(512)
        .regex(/^[A-Za-z0-9_-]+$/u)
        .nullable()
        .optional(),
      limit: z.number().int().min(1).max(MEMORY_ASSERTION_PAGE_LIMIT).default(20),
    }).strict(),
    ExpectedMemoryStateSchema.merge(NewClaimSchema)
      .extend({ operation: z.literal("PROPOSE") })
      .strict(),
    ExpectedMemoryStateSchema.extend({
      operation: z.literal("ADD_EVIDENCE"),
      assertionId: z.uuid(),
      assertionRevision: z.number().int().positive(),
      evidenceValue: MessageLengthPreferenceSchema,
      role: MemoryEvidenceRoleSchema,
      evidence: MemoryEvidenceInputSchema,
    }).strict(),
    ExpectedMemoryStateSchema.extend({
      operation: z.literal("DECIDE"),
      assertionId: z.uuid(),
      assertionRevision: z.number().int().positive(),
      decision: z.enum(["CONFIRM", "REJECT"]),
      authority: MemoryDecisionAuthoritySchema,
    }).strict(),
    ExpectedMemoryStateSchema.merge(NewClaimSchema)
      .extend({
        operation: z.literal("REPLACE"),
        assertionId: z.uuid(),
        assertionRevision: z.number().int().positive(),
        authority: MemoryDecisionAuthoritySchema,
      })
      .strict(),
    ExpectedMemoryStateSchema.extend({
      operation: z.literal("RECONSIDER"),
      assertionId: z.uuid(),
      assertionRevision: z.number().int().positive(),
      decisionId: z.uuid(),
      evidence: MemoryEvidenceInputSchema,
    }).strict(),
    ExpectedMemoryStateSchema.extend({
      operation: z.literal("DELETE_ASSERTION"),
      assertionId: z.uuid(),
      assertionRevision: z.number().int().positive(),
    }).strict(),
    ExpectedMemoryStateSchema.extend({
      operation: z.literal("DELETE_EVIDENCE"),
      evidenceId: z.uuid(),
    }).strict(),
    ExpectedMemoryStateSchema.merge(RelationshipClaimSchema)
      .extend({
        operation: z.literal("PROPOSE_RELATIONSHIP"),
        applicability: MemoryApplicabilitySchema,
        evidence: MemoryEvidenceInputSchema,
      })
      .strict(),
    ExpectedMemoryStateSchema.extend({
      operation: z.literal("ADD_RELATIONSHIP_EVIDENCE"),
      assertionId: z.uuid(),
      assertionRevision: z.number().int().positive(),
      evidenceValue: RelationshipValueSchema,
      polarity: z.enum(["POSITIVE", "NEGATIVE"]),
      role: MemoryEvidenceRoleSchema,
      evidence: MemoryEvidenceInputSchema,
    }).strict(),
    ExpectedMemoryStateSchema.extend({
      operation: z.literal("DECIDE_RELATIONSHIP"),
      assertionId: z.uuid(),
      assertionRevision: z.number().int().positive(),
      decision: z.enum(["CONFIRM", "REJECT"]),
      reach: RelationshipCorrectionReachSchema,
      correctionInterval: RelationshipValiditySchema.nullable().default(null),
      authority: z.enum(["TRUSTED_USER_DECISION", "SYNTHETIC_FIXTURE"]),
    }).strict(),
    ExpectedMemoryStateSchema.extend({
      operation: z.literal("TRANSITION_RELATIONSHIP"),
      assertionId: z.uuid(),
      assertionRevision: z.number().int().positive(),
      end: RelationshipEndBoundarySchema,
      evidence: MemoryEvidenceInputSchema,
      authority: z.enum(["TRUSTED_USER_DECISION", "SYNTHETIC_FIXTURE"]),
    }).strict(),
    ExpectedMemoryStateSchema.merge(RelationshipClaimSchema)
      .extend({
        operation: z.literal("CORRECT_RELATIONSHIP"),
        assertionId: z.uuid(),
        assertionRevision: z.number().int().positive(),
        reach: RelationshipCorrectionReachSchema,
        correctionInterval: RelationshipValiditySchema.nullable().default(null),
        evidence: MemoryEvidenceInputSchema,
        authority: z.enum(["TRUSTED_USER_DECISION", "SYNTHETIC_FIXTURE"]),
      })
      .strict(),
    ExpectedMemoryStateSchema.extend({
      operation: z.literal("RECONSIDER_RELATIONSHIP"),
      assertionId: z.uuid(),
      assertionRevision: z.number().int().positive(),
      decisionId: z.uuid(),
      evidence: MemoryEvidenceInputSchema,
    }).strict(),
  ])
  .superRefine((value, context) => {
    if (
      (value.operation === "PROPOSE" || value.operation === "REPLACE") &&
      (value.subject.kind === "CONTACT") !== (value.contactRevision !== null)
    ) {
      context.addIssue({ code: "custom", message: "Contact subjects require a contact revision." });
    }
    if (
      (value.operation === "DECIDE_RELATIONSHIP" || value.operation === "CORRECT_RELATIONSHIP") &&
      (value.reach === "INTERVAL") !== (value.correctionInterval !== null)
    )
      context.addIssue({
        code: "custom",
        message: "Correction interval does not match its reach.",
      });
    if (
      (value.operation === "DECIDE_RELATIONSHIP" || value.operation === "CORRECT_RELATIONSHIP") &&
      value.reach === "INTERVAL" &&
      value.correctionInterval?.start.precision === "UNKNOWN" &&
      value.correctionInterval.end.certainty === "UNKNOWN"
    )
      context.addIssue({
        code: "custom",
        message: "An interval correction needs a stated boundary.",
      });
    if (
      value.operation === "LIST" &&
      value.filter &&
      (value.recordType === "RELATIONSHIP_CONTEXT" ||
        value.recordType === "MEMORY_EVIDENCE_LINK" ||
        value.recordType === "MEMORY_DECISION") &&
      value.filter.predicate === "REPLY_LENGTH_PREFERENCE"
    )
      context.addIssue({ code: "custom", message: "This section cannot use a preference filter." });
    if (
      (value.operation === "PROPOSE_RELATIONSHIP" ||
        value.operation === "ADD_RELATIONSHIP_EVIDENCE" ||
        value.operation === "TRANSITION_RELATIONSHIP" ||
        value.operation === "CORRECT_RELATIONSHIP" ||
        value.operation === "RECONSIDER_RELATIONSHIP") &&
      value.evidence.source !== "SYNTHETIC_FIXTURE"
    )
      context.addIssue({ code: "custom", message: "Relationship acquisition is not enabled." });
  });

export const MemoryPageSchema = z
  .object({
    kind: z.literal("PAGE"),
    generation: DatasetGenerationSchema,
    memoryRevision: MemoryRevisionSchema,
    recordType: MemoryInspectorRecordTypeSchema,
    records: z.array(MemoryInspectorRecordSchema).max(MEMORY_ASSERTION_PAGE_LIMIT),
    nextCursor: z.string().max(512).nullable(),
  })
  .strict();
export const MemoryMutationSchema = z
  .object({
    kind: z.literal("MUTATION"),
    generation: DatasetGenerationSchema,
    memoryRevision: MemoryRevisionSchema,
    assertions: z.array(MemoryAssertionRecordSchema).max(2),
    evidence: z.array(MemoryEvidenceRecordSchema).max(MEMORY_EVIDENCE_LINK_LIMIT),
    decisions: z.array(MemoryDecisionRecordSchema).max(1),
  })
  .strict();
export const MemoryAssertionResultSchema = z.discriminatedUnion("ok", [
  z
    .object({ ok: z.literal(true), result: z.union([MemoryPageSchema, MemoryMutationSchema]) })
    .strict(),
  z
    .object({
      ok: z.literal(false),
      error: LocalMemoryErrorSchema,
    })
    .strict(),
]);

export type MessageLengthPreference = z.infer<typeof MessageLengthPreferenceSchema>;
export type MemoryRevision = z.infer<typeof MemoryRevisionSchema>;
export type MemorySubject = z.infer<typeof MemorySubjectSchema>;
export type MemoryEvidenceInput = z.infer<typeof MemoryEvidenceInputSchema>;
export type MemoryEvidenceRole = z.infer<typeof MemoryEvidenceRoleSchema>;
export type MemoryAssertionRecord = z.infer<typeof MemoryAssertionRecordSchema>;
export type MemoryEvidenceRecord = z.infer<typeof MemoryEvidenceRecordSchema>;
export type MemoryEvidenceLinkRecord = z.infer<typeof MemoryEvidenceLinkRecordSchema>;
export type MemoryDecisionRecord = z.infer<typeof MemoryDecisionRecordSchema>;
export type MemoryInspectorRecordType = z.infer<typeof MemoryInspectorRecordTypeSchema>;
export type MemoryInspectorRecord = z.infer<typeof MemoryInspectorRecordSchema>;
export type MemoryAssertionRequest = z.infer<typeof MemoryAssertionRequestSchema>;
export type MemoryPage = z.infer<typeof MemoryPageSchema>;
export type MemoryPageFilter = z.infer<typeof MemoryPageFilterSchema>;
export type MemoryMutation = z.infer<typeof MemoryMutationSchema>;
export type MemoryAssertionResult = z.infer<typeof MemoryAssertionResultSchema>;
export type RelationshipContextRecord = z.infer<typeof RelationshipContextRecordSchema>;
