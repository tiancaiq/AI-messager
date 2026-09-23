import { z } from "zod";

import { DatasetGenerationSchema, LocalMemoryErrorSchema } from "./local-memory-core.js";

export const CONTACT_PAGE_LIMIT = 20;
export const CONTACT_ASSOCIATION_LIMIT = 100;
export const CONTACT_DIRECTORY_RESPONSE_BYTES = 16 * 1024;

export const DirectoryRevisionSchema = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const DirectoryRecordRevisionSchema = z
  .number()
  .int()
  .positive()
  .max(Number.MAX_SAFE_INTEGER);
export const DirectoryCursorSchema = z
  .string()
  .min(1)
  .max(512)
  .regex(/^[A-Za-z0-9_-]+$/u);
export const DirectoryRecordTypeSchema = z.enum([
  "CONTACT",
  "PLATFORM_IDENTITY",
  "IDENTITY_ASSOCIATION",
]);
export const IdentityOriginSchema = z.literal("USER_ENTERED");
export const IdentityAssociationStatusSchema = z.enum([
  "CANDIDATE",
  "CONFIRMED",
  "REJECTED",
  "REVOKED",
]);
export const IdentityDecisionAuthoritySchema = z.literal("USER_DECISION");

const TimestampSchema = z.iso.datetime({ offset: true });
const OptionalTimestampSchema = TimestampSchema.nullable();

function boundedText(maxCharacters: number, maxBytes: number) {
  return z
    .string()
    .trim()
    .min(1)
    .refine((value) => [...value].length <= maxCharacters, "Value is too long.")
    .refine((value) => utf8ByteLength(value) <= maxBytes, "Encoded value is too long.");
}

function utf8ByteLength(value: string): number {
  let bytes = 0;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code < 0x80) bytes += 1;
    else if (code < 0x800) bytes += 2;
    else if (code >= 0xd800 && code <= 0xdbff && index + 1 < value.length) {
      const next = value.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        bytes += 4;
        index += 1;
      } else bytes += 3;
    } else bytes += 3;
  }
  return bytes;
}

export const ContactLabelSchema = boundedText(120, 480);
export const IdentityPlatformSchema = boundedText(64, 256);
export const IdentityNamespaceSchema = boundedText(128, 512);
export const IdentityIdentifierKindSchema = boundedText(64, 256);
export const IdentityIdentifierValueSchema = boundedText(256, 1_024);
export const IdentityDisplayLabelSchema = boundedText(120, 480);

export const ContactRecordSchema = z
  .object({
    recordType: z.literal("CONTACT"),
    id: z.uuid(),
    label: ContactLabelSchema,
    revision: DirectoryRecordRevisionSchema,
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
  })
  .strict();

export const PlatformIdentityRecordSchema = z
  .object({
    recordType: z.literal("PLATFORM_IDENTITY"),
    id: z.uuid(),
    platform: IdentityPlatformSchema.nullable(),
    namespace: IdentityNamespaceSchema.nullable(),
    identifierKind: IdentityIdentifierKindSchema.nullable(),
    identifierValue: IdentityIdentifierValueSchema.nullable(),
    displayLabel: IdentityDisplayLabelSchema.nullable(),
    origin: IdentityOriginSchema,
    revision: DirectoryRecordRevisionSchema,
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
  })
  .strict();

export const IdentityAssociationRecordSchema = z
  .object({
    recordType: z.literal("IDENTITY_ASSOCIATION"),
    id: z.uuid(),
    identityId: z.uuid(),
    contactId: z.uuid(),
    status: IdentityAssociationStatusSchema,
    authority: IdentityDecisionAuthoritySchema,
    revision: DirectoryRecordRevisionSchema,
    createdAt: TimestampSchema,
    decidedAt: OptionalTimestampSchema,
    revokedAt: OptionalTimestampSchema,
  })
  .strict();

export const DirectoryRecordSchema = z.discriminatedUnion("recordType", [
  ContactRecordSchema,
  PlatformIdentityRecordSchema,
  IdentityAssociationRecordSchema,
]);

const ExpectedDirectorySchema = z
  .object({
    generation: DatasetGenerationSchema,
    directoryRevision: DirectoryRevisionSchema,
  })
  .strict();

export const ListDirectoryRequestSchema = ExpectedDirectorySchema.extend({
  operation: z.literal("LIST"),
  recordType: DirectoryRecordTypeSchema,
  cursor: DirectoryCursorSchema.nullable().optional(),
  limit: z.number().int().min(1).max(CONTACT_PAGE_LIMIT).default(CONTACT_PAGE_LIMIT),
}).strict();

export const CreateContactRequestSchema = ExpectedDirectorySchema.extend({
  operation: z.literal("CREATE_CONTACT"),
  label: ContactLabelSchema,
}).strict();

export const RenameContactRequestSchema = ExpectedDirectorySchema.extend({
  operation: z.literal("RENAME_CONTACT"),
  contactId: z.uuid(),
  contactRevision: DirectoryRecordRevisionSchema,
  label: ContactLabelSchema,
}).strict();

export const DeleteContactRequestSchema = ExpectedDirectorySchema.extend({
  operation: z.literal("DELETE_CONTACT"),
  contactId: z.uuid(),
  contactRevision: DirectoryRecordRevisionSchema,
  confirmation: z.literal("DELETE_CONTACT"),
}).strict();

const IdentityFieldsSchema = z
  .object({
    platform: IdentityPlatformSchema.nullable().optional(),
    namespace: IdentityNamespaceSchema.nullable().optional(),
    identifierKind: IdentityIdentifierKindSchema.nullable().optional(),
    identifierValue: IdentityIdentifierValueSchema.nullable().optional(),
    displayLabel: IdentityDisplayLabelSchema.nullable().optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.displayLabel == null && value.identifierValue == null) {
      context.addIssue({ code: "custom", message: "A display label or identifier is required." });
    }
  });

export const CreateIdentityRequestSchema = ExpectedDirectorySchema.extend({
  operation: z.literal("CREATE_IDENTITY"),
  ...IdentityFieldsSchema.shape,
  candidateContactId: z.uuid().nullable().optional(),
}).superRefine((value, context) => {
  if (value.displayLabel == null && value.identifierValue == null) {
    context.addIssue({ code: "custom", message: "A display label or identifier is required." });
  }
});

export const DeleteIdentityRequestSchema = ExpectedDirectorySchema.extend({
  operation: z.literal("DELETE_IDENTITY"),
  identityId: z.uuid(),
  identityRevision: DirectoryRecordRevisionSchema,
  confirmation: z.literal("DELETE_IDENTITY"),
}).strict();

export const ProposeAssociationRequestSchema = ExpectedDirectorySchema.extend({
  operation: z.literal("PROPOSE_ASSOCIATION"),
  identityId: z.uuid(),
  identityRevision: DirectoryRecordRevisionSchema,
  contactId: z.uuid(),
  contactRevision: DirectoryRecordRevisionSchema,
}).strict();

export const DecideAssociationRequestSchema = ExpectedDirectorySchema.extend({
  operation: z.literal("DECIDE_ASSOCIATION"),
  associationId: z.uuid(),
  associationRevision: DirectoryRecordRevisionSchema,
  decision: z.enum(["CONFIRM", "REJECT"]),
}).strict();

export const RevokeAssociationRequestSchema = ExpectedDirectorySchema.extend({
  operation: z.literal("REVOKE_ASSOCIATION"),
  associationId: z.uuid(),
  associationRevision: DirectoryRecordRevisionSchema,
  confirmation: z.literal("REVOKE_ASSOCIATION"),
}).strict();

export const ReassignAssociationRequestSchema = ExpectedDirectorySchema.extend({
  operation: z.literal("REASSIGN_ASSOCIATION"),
  associationId: z.uuid(),
  associationRevision: DirectoryRecordRevisionSchema,
  newContactId: z.uuid(),
  newContactRevision: DirectoryRecordRevisionSchema,
  confirmation: z.literal("REASSIGN_ASSOCIATION"),
}).strict();

export const ReconsiderAssociationRequestSchema = ExpectedDirectorySchema.extend({
  operation: z.literal("RECONSIDER_ASSOCIATION"),
  associationId: z.uuid(),
  associationRevision: DirectoryRecordRevisionSchema,
}).strict();

export const ContactDirectoryRequestSchema = z.discriminatedUnion("operation", [
  ListDirectoryRequestSchema,
  CreateContactRequestSchema,
  RenameContactRequestSchema,
  DeleteContactRequestSchema,
  CreateIdentityRequestSchema,
  DeleteIdentityRequestSchema,
  ProposeAssociationRequestSchema,
  DecideAssociationRequestSchema,
  RevokeAssociationRequestSchema,
  ReassignAssociationRequestSchema,
  ReconsiderAssociationRequestSchema,
]);

export const DirectoryPageSchema = z
  .object({
    kind: z.literal("PAGE"),
    generation: DatasetGenerationSchema,
    directoryRevision: DirectoryRevisionSchema,
    recordType: DirectoryRecordTypeSchema,
    records: z.array(DirectoryRecordSchema).max(CONTACT_PAGE_LIMIT),
    nextCursor: DirectoryCursorSchema.nullable(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.records.some((record) => record.recordType !== value.recordType)) {
      context.addIssue({ code: "custom", message: "Directory page record type mismatch." });
    }
  });

export const DirectoryMutationSchema = z
  .object({
    kind: z.literal("MUTATION"),
    generation: DatasetGenerationSchema,
    directoryRevision: DirectoryRevisionSchema,
    contacts: z.array(ContactRecordSchema).max(2),
    identities: z.array(PlatformIdentityRecordSchema).max(1),
    associations: z.array(IdentityAssociationRecordSchema).max(2),
  })
  .strict();

export const ContactDirectoryResultSchema = z.discriminatedUnion("ok", [
  z
    .object({
      ok: z.literal(true),
      result: z.union([DirectoryPageSchema, DirectoryMutationSchema]),
    })
    .strict(),
  z.object({ ok: z.literal(false), error: LocalMemoryErrorSchema }).strict(),
]);

export type DirectoryRevision = z.infer<typeof DirectoryRevisionSchema>;
export type DirectoryRecordType = z.infer<typeof DirectoryRecordTypeSchema>;
export type ContactRecord = z.infer<typeof ContactRecordSchema>;
export type PlatformIdentityRecord = z.infer<typeof PlatformIdentityRecordSchema>;
export type IdentityAssociationRecord = z.infer<typeof IdentityAssociationRecordSchema>;
export type DirectoryRecord = z.infer<typeof DirectoryRecordSchema>;
export type ListDirectoryRequest = z.infer<typeof ListDirectoryRequestSchema>;
export type ContactDirectoryRequest = z.infer<typeof ContactDirectoryRequestSchema>;
export type DirectoryPage = z.infer<typeof DirectoryPageSchema>;
export type DirectoryMutation = z.infer<typeof DirectoryMutationSchema>;
export type ContactDirectoryResult = z.infer<typeof ContactDirectoryResultSchema>;
