import { z } from "zod";

import {
  ContactDirectoryRequestSchema,
  ContactDirectoryResultSchema,
  DirectoryPageSchema,
  DirectoryRevisionSchema,
} from "./contact-directory.js";
import {
  DatasetGenerationSchema,
  LocalMemoryErrorCodeSchema,
  LocalMemoryErrorSchema,
  SettingsRevisionSchema,
} from "./local-memory-core.js";
import {
  MemoryAssertionRequestSchema,
  MemoryAssertionResultSchema,
  MemoryInspectorRecordTypeSchema,
  MemoryPageSchema,
  MemoryPageFilterSchema,
  MemoryRevisionSchema,
  MessageLengthPreferenceSchema,
} from "./memory-assertion.js";

export {
  DatasetGenerationSchema,
  LocalMemoryErrorCodeSchema,
  LocalMemoryErrorSchema,
  SettingsRevisionSchema,
} from "./local-memory-core.js";

export const LOCAL_MEMORY_STATUS_CHANNEL = "local-memory:status" as const;
export const LOCAL_MEMORY_READ_CHANNEL = "local-memory:read" as const;
export const LOCAL_MEMORY_SAVE_CHANNEL = "local-memory:save" as const;
export const LOCAL_MEMORY_DELETE_CHANNEL = "local-memory:delete" as const;
export const LOCAL_MEMORY_CLEAR_CHANNEL = "local-memory:clear" as const;
export const LOCAL_MEMORY_RESET_UNAVAILABLE_CHANNEL = "local-memory:reset-unavailable" as const;
export const LOCAL_MEMORY_INSPECT_CHANNEL = "local-memory:inspect-development" as const;
export const DESKTOP_DEVELOPMENT_RENDERER_URL = "http://127.0.0.1:5173" as const;

export { MessageLengthPreferenceSchema } from "./memory-assertion.js";

export const LocalMemorySnapshotSchema = z
  .object({
    generation: DatasetGenerationSchema,
    revision: SettingsRevisionSchema,
    directoryRevision: DirectoryRevisionSchema,
    memoryRevision: MemoryRevisionSchema,
    messageLength: MessageLengthPreferenceSchema.nullable(),
    updatedAt: z.iso.datetime({ offset: true }).nullable(),
  })
  .strict();

export const LocalMemoryResultSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true), snapshot: LocalMemorySnapshotSchema }).strict(),
  z.object({ ok: z.literal(false), error: LocalMemoryErrorSchema }).strict(),
]);

export const LocalMemoryStatusSchema = z.discriminatedUnion("available", [
  z.object({ available: z.literal(true), snapshot: LocalMemorySnapshotSchema }).strict(),
  z
    .object({
      available: z.literal(false),
      error: LocalMemoryErrorSchema,
    })
    .strict(),
]);

export const LocalMemoryInspectorContextSchema = z
  .object({
    storeId: z.uuid(),
    contextId: z.uuid(),
    generation: DatasetGenerationSchema,
    settingsRevision: SettingsRevisionSchema,
    directoryRevision: DirectoryRevisionSchema,
    memoryRevision: MemoryRevisionSchema,
  })
  .strict();

export const LocalMemoryInspectorPreferenceSchema = z
  .object({
    id: z.literal("messageLength"),
    value: MessageLengthPreferenceSchema,
    source: z.enum(["USER_SETTING", "LEGACY_SETTING_MIGRATION"]),
    settingsRevision: SettingsRevisionSchema,
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }),
  })
  .strict();

export const LocalMemoryInspectorRequestSchema = z
  .object({
    section: z.union([
      z.enum(["CONTACT", "PLATFORM_IDENTITY", "IDENTITY_ASSOCIATION"]),
      MemoryInspectorRecordTypeSchema,
    ]),
    filter: MemoryPageFilterSchema.nullable().default(null),
    cursor: z
      .string()
      .min(1)
      .max(512)
      .regex(/^[A-Za-z0-9_-]+$/u)
      .nullable()
      .optional(),
    limit: z.number().int().min(1).max(20).default(20),
  })
  .strict();

export const LocalMemoryInspectorSnapshotSchema = z
  .object({
    status: z.literal("READY"),
    schemaVersion: z.literal(6),
    databasePath: z.string().min(1).max(1_024),
    context: LocalMemoryInspectorContextSchema,
    explicitPreferences: z.array(LocalMemoryInspectorPreferenceSchema).max(1),
    page: z.union([DirectoryPageSchema, MemoryPageSchema]),
  })
  .strict();

export const LocalMemoryInspectorResultSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true), snapshot: LocalMemoryInspectorSnapshotSchema }).strict(),
  z.object({ ok: z.literal(false), error: LocalMemoryErrorSchema }).strict(),
]);

export const LocalMemoryDebugSnapshotExportSchema = z
  .object({
    snapshotPath: z.string().min(1).max(1_024),
    passphrase: z
      .string()
      .min(32)
      .max(128)
      .regex(/^[A-Za-z0-9_-]+$/u),
  })
  .strict();

export const LocalMemoryDebugSnapshotResultSchema = z.discriminatedUnion("ok", [
  z
    .object({
      ok: z.literal(true),
      snapshot: z
        .object({
          schemaVersion: z.literal(6),
          databasePath: z.string().min(1).max(1_024),
        })
        .strict(),
    })
    .strict(),
  z.object({ ok: z.literal(false), error: LocalMemoryErrorSchema }).strict(),
]);

export function isDesktopDevelopmentRendererUrl(value: string | undefined): boolean {
  return value === DESKTOP_DEVELOPMENT_RENDERER_URL;
}

const ExpectedVersionSchema = z
  .object({
    generation: DatasetGenerationSchema,
    revision: SettingsRevisionSchema,
  })
  .strict();

export const SaveMessageLengthRequestSchema = ExpectedVersionSchema.extend({
  value: MessageLengthPreferenceSchema,
}).strict();

export const DeleteMessageLengthRequestSchema = ExpectedVersionSchema;

export const ClearLocalMemoryRequestSchema = z
  .object({
    generation: DatasetGenerationSchema,
    confirmation: z.literal("CLEAR_LOCAL_MEMORY"),
  })
  .strict();

export const ResetUnavailableLocalMemoryRequestSchema = z
  .object({
    confirmation: z.literal("ERASE_UNAVAILABLE_LOCAL_MEMORY"),
  })
  .strict();

export const StorageWorkerRequestSchema = z.discriminatedUnion("operation", [
  z
    .object({
      operation: z.literal("OPEN"),
      requestId: z.uuid(),
      databasePath: z.string().min(1).max(1_024),
      storeId: z.uuid(),
      keyHex: z.string().regex(/^[0-9a-f]{64}$/u),
    })
    .strict(),
  z.object({ operation: z.literal("READ"), requestId: z.uuid() }).strict(),
  LocalMemoryInspectorRequestSchema.extend({
    operation: z.literal("INSPECT"),
    requestId: z.uuid(),
  }).strict(),
  z
    .object({
      operation: z.literal("DIRECTORY"),
      requestId: z.uuid(),
      request: ContactDirectoryRequestSchema,
    })
    .strict(),
  z
    .object({
      operation: z.literal("MEMORY"),
      requestId: z.uuid(),
      request: MemoryAssertionRequestSchema,
    })
    .strict(),
  LocalMemoryDebugSnapshotExportSchema.extend({
    operation: z.literal("EXPORT_DEBUG_SNAPSHOT"),
    requestId: z.uuid(),
  }).strict(),
  SaveMessageLengthRequestSchema.extend({
    operation: z.literal("SAVE"),
    requestId: z.uuid(),
  }).strict(),
  DeleteMessageLengthRequestSchema.extend({
    operation: z.literal("DELETE"),
    requestId: z.uuid(),
  }).strict(),
  ClearLocalMemoryRequestSchema.extend({
    operation: z.literal("CLEAR"),
    requestId: z.uuid(),
  }).strict(),
  z.object({ operation: z.literal("CLOSE"), requestId: z.uuid() }).strict(),
]);

export const StorageWorkerResponseSchema = z
  .object({
    requestId: z.uuid(),
    result: z.union([
      LocalMemoryResultSchema,
      LocalMemoryInspectorResultSchema,
      LocalMemoryDebugSnapshotResultSchema,
      ContactDirectoryResultSchema,
      MemoryAssertionResultSchema,
    ]),
  })
  .strict();

export type MessageLengthPreference = z.infer<typeof MessageLengthPreferenceSchema>;
export type LocalMemorySnapshot = z.infer<typeof LocalMemorySnapshotSchema>;
export type LocalMemoryErrorCode = z.infer<typeof LocalMemoryErrorCodeSchema>;
export type LocalMemoryResult = z.infer<typeof LocalMemoryResultSchema>;
export type LocalMemoryStatus = z.infer<typeof LocalMemoryStatusSchema>;
export type LocalMemoryInspectorContext = z.infer<typeof LocalMemoryInspectorContextSchema>;
export type LocalMemoryInspectorPreference = z.infer<typeof LocalMemoryInspectorPreferenceSchema>;
export type LocalMemoryInspectorSnapshot = z.infer<typeof LocalMemoryInspectorSnapshotSchema>;
export type LocalMemoryInspectorResult = z.infer<typeof LocalMemoryInspectorResultSchema>;
export type LocalMemoryInspectorRequest = z.infer<typeof LocalMemoryInspectorRequestSchema>;
export type LocalMemoryDebugSnapshotExport = z.infer<typeof LocalMemoryDebugSnapshotExportSchema>;
export type LocalMemoryDebugSnapshotResult = z.infer<typeof LocalMemoryDebugSnapshotResultSchema>;
export type SaveMessageLengthRequest = z.infer<typeof SaveMessageLengthRequestSchema>;
export type DeleteMessageLengthRequest = z.infer<typeof DeleteMessageLengthRequestSchema>;
export type ClearLocalMemoryRequest = z.infer<typeof ClearLocalMemoryRequestSchema>;
export type ResetUnavailableLocalMemoryRequest = z.infer<
  typeof ResetUnavailableLocalMemoryRequestSchema
>;
export type StorageWorkerRequest = z.infer<typeof StorageWorkerRequestSchema>;
export type StorageWorkerResponse = z.infer<typeof StorageWorkerResponseSchema>;
