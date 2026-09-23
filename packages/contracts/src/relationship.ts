import { z } from "zod";

export const RELATIONSHIP_EPISODE_LIMIT = 100;
export const RelationshipCategorySchema = z.enum(["PROFESSIONAL", "PERSONAL"]);
export const RelationshipRoleSchema = z.enum([
  "MANAGER",
  "COWORKER",
  "TEAMMATE",
  "CLIENT",
  "PROFESSOR",
  "FRIEND",
  "ROMANTIC_PARTNER",
  "SPOUSE",
  "FAMILY",
  "ACQUAINTANCE",
]);
export const RelationshipDirectionSchema = z.enum(["LOCAL_USER", "CONTACT", "SYMMETRIC"]);
export const RelationshipContextKindSchema = z.enum([
  "GENERAL",
  "UNKNOWN",
  "ORGANIZATION",
  "PROJECT",
]);
const utf8Bytes = (value: string): number => {
  try {
    return encodeURIComponent(value).replace(/%[0-9A-F]{2}/gi, "x").length;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
};
export const RelationshipLabelSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => Array.from(value).length <= 120, "Label exceeds 120 Unicode characters.")
  .refine((value) => utf8Bytes(value) <= 480, "Label is too large.");
export const RelationshipContextInputSchema = z
  .object({
    kind: RelationshipContextKindSchema,
    organizationLabel: RelationshipLabelSchema.nullable(),
    projectLabel: RelationshipLabelSchema.nullable(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      ((value.kind === "GENERAL" || value.kind === "UNKNOWN") &&
        (value.organizationLabel !== null || value.projectLabel !== null)) ||
      (value.kind === "ORGANIZATION" &&
        (value.organizationLabel === null || value.projectLabel !== null)) ||
      (value.kind === "PROJECT" && value.projectLabel === null)
    )
      context.addIssue({ code: "custom", message: "Context labels do not match its kind." });
    if (
      utf8Bytes(
        JSON.stringify({
          recordType: "RELATIONSHIP_CONTEXT",
          id: "00000000-0000-4000-8000-000000000000",
          contactId: "00000000-0000-4000-8000-000000000000",
          ...value,
          createdAt: "2026-09-15T00:00:00.000Z",
        }),
      ) > 1024
    )
      context.addIssue({ code: "custom", message: "Context metadata exceeds 1 KiB." });
  });
export const RelationshipContextRecordSchema = RelationshipContextInputSchema.safeExtend({
  recordType: z.literal("RELATIONSHIP_CONTEXT"),
  id: z.uuid(),
  contactId: z.uuid(),
  createdAt: z.iso.datetime({ offset: true }),
});
export const RelationshipContextSelectorSchema = z.discriminatedUnion("selection", [
  z.object({ selection: z.literal("NEW"), context: RelationshipContextInputSchema }).strict(),
  z.object({ selection: z.literal("EXISTING"), contextId: z.uuid() }).strict(),
]);

export const RelationshipValueSchema = z.discriminatedUnion("predicate", [
  z
    .object({
      predicate: z.literal("RELATIONSHIP_CATEGORY"),
      category: RelationshipCategorySchema,
      direction: z.literal("SYMMETRIC"),
    })
    .strict(),
  z
    .object({
      predicate: z.literal("RELATIONSHIP_ROLE"),
      role: RelationshipRoleSchema,
      direction: RelationshipDirectionSchema,
    })
    .strict()
    .superRefine((value, context) => {
      const directional = ["MANAGER", "CLIENT", "PROFESSOR"].includes(value.role);
      if (directional === (value.direction === "SYMMETRIC"))
        context.addIssue({ code: "custom", message: "Role direction is invalid." });
    }),
]);

const RelationshipYearSchema = z.string().regex(/^\d{4}$/u);
const RelationshipMonthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/u);
const RelationshipDateSchema = z.iso.date();
export const RelationshipTimeBoundSchema = z.discriminatedUnion("precision", [
  z.object({ precision: z.literal("UNKNOWN") }).strict(),
  z.object({ precision: z.literal("YEAR"), value: RelationshipYearSchema }).strict(),
  z.object({ precision: z.literal("CALENDAR_MONTH"), value: RelationshipMonthSchema }).strict(),
  z.object({ precision: z.literal("CALENDAR_DATE"), value: RelationshipDateSchema }).strict(),
  z.object({ precision: z.literal("INSTANT"), value: z.iso.datetime({ offset: true }) }).strict(),
]);
export const RelationshipEndBoundarySchema = z
  .discriminatedUnion("certainty", [
    z
      .object({
        certainty: z.literal("UNKNOWN"),
        bound: z.object({ precision: z.literal("UNKNOWN") }).strict(),
      })
      .strict(),
    z.object({ certainty: z.literal("EXACT"), bound: RelationshipTimeBoundSchema }).strict(),
    z.object({ certainty: z.literal("WITHIN"), bound: RelationshipTimeBoundSchema }).strict(),
  ])
  .superRefine((value, context) => {
    if (value.certainty !== "UNKNOWN" && value.bound.precision === "UNKNOWN")
      context.addIssue({ code: "custom", message: "A stated end needs a time bound." });
    if (value.certainty === "WITHIN" && value.bound.precision === "INSTANT")
      context.addIssue({
        code: "custom",
        message: "An instant end is exact, not within a period.",
      });
  });
function utcStart(year: number, monthIndex: number, day: number): number {
  const date = new Date(0);
  date.setUTCFullYear(year, monthIndex, day);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
}
export function relationshipTimePeriod(
  bound: z.infer<typeof RelationshipTimeBoundSchema>,
): { first: number; after: number } | null {
  if (bound.precision === "UNKNOWN") return null;
  if (bound.precision === "INSTANT") {
    const at = Date.parse(bound.value);
    return { first: at, after: at };
  }
  if (bound.precision === "YEAR") {
    const year = Number(bound.value);
    return { first: utcStart(year, 0, 1), after: utcStart(year + 1, 0, 1) };
  }
  if (bound.precision === "CALENDAR_MONTH") {
    const [year, month] = bound.value.split("-").map(Number);
    return { first: utcStart(year!, month! - 1, 1), after: utcStart(year!, month!, 1) };
  }
  const [year, month, day] = bound.value.split("-").map(Number);
  return { first: utcStart(year!, month! - 1, day!), after: utcStart(year!, month! - 1, day! + 1) };
}
export const RelationshipValiditySchema = z
  .object({ start: RelationshipTimeBoundSchema, end: RelationshipEndBoundarySchema })
  .strict()
  .superRefine((value, context) => {
    const start = relationshipTimePeriod(value.start);
    const end = relationshipTimePeriod(value.end.bound);
    if (!start || !end) return;
    const latestEnd = value.end.certainty === "WITHIN" ? end.after : end.first;
    if (latestEnd <= start.first)
      context.addIssue({ code: "custom", message: "Range is provably empty or reversed." });
  });

export const RelationshipClaimSchema = z
  .object({
    value: RelationshipValueSchema,
    contactId: z.uuid(),
    contactRevision: z.number().int().positive(),
    context: RelationshipContextSelectorSchema,
    episodeId: z.uuid().nullable(),
    validity: RelationshipValiditySchema,
  })
  .strict();

export const RelationshipAssertionMetadataSchema = z
  .object({
    contextId: z.uuid(),
    episodeId: z.uuid(),
    validity: RelationshipValiditySchema,
  })
  .strict();
export const RelationshipEvidenceMetadataSchema = z
  .object({
    contextId: z.uuid(),
    episodeId: z.uuid(),
    polarity: z.enum(["POSITIVE", "NEGATIVE"]),
  })
  .strict();
export const RelationshipCorrectionReachSchema = z.enum(["CURRENT", "INTERVAL", "ALL_HISTORY"]);

export type RelationshipValue = z.infer<typeof RelationshipValueSchema>;
export type RelationshipClaim = z.infer<typeof RelationshipClaimSchema>;
export type RelationshipValidity = z.infer<typeof RelationshipValiditySchema>;
export type RelationshipContextRecord = z.infer<typeof RelationshipContextRecordSchema>;
