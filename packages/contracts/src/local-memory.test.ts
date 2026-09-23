import { describe, expect, it } from "vitest";

import {
  ClearLocalMemoryRequestSchema,
  LocalMemoryInspectorResultSchema,
  LocalMemoryDebugSnapshotExportSchema,
  LocalMemoryDebugSnapshotResultSchema,
  LocalMemorySnapshotSchema,
  ResetUnavailableLocalMemoryRequestSchema,
  SaveMessageLengthRequestSchema,
  StorageWorkerRequestSchema,
  isDesktopDevelopmentRendererUrl,
} from "./local-memory.js";

const generation = "00000000-0000-4000-8000-000000000001";

describe("local-memory contracts", () => {
  it("accepts the bounded message-length preference and unset snapshots", () => {
    expect(
      LocalMemorySnapshotSchema.parse({
        generation,
        revision: 0,
        directoryRevision: 0,
        memoryRevision: 0,
        messageLength: null,
        updatedAt: null,
      }),
    ).toEqual({
      generation,
      revision: 0,
      directoryRevision: 0,
      memoryRevision: 0,
      messageLength: null,
      updatedAt: null,
    });
    expect(
      SaveMessageLengthRequestSchema.parse({
        generation,
        revision: 0,
        value: "CONCISE",
      }).value,
    ).toBe("CONCISE");
  });

  it("rejects arbitrary values, unknown fields, and fake confirmations", () => {
    expect(
      SaveMessageLengthRequestSchema.safeParse({
        generation,
        revision: 0,
        value: "whatever",
      }).success,
    ).toBe(false);
    expect(
      SaveMessageLengthRequestSchema.safeParse({
        generation,
        revision: 0,
        value: "BALANCED",
        sql: "DROP TABLE preferences",
      }).success,
    ).toBe(false);
    expect(
      ClearLocalMemoryRequestSchema.safeParse({ generation, confirmation: "yes" }).success,
    ).toBe(false);
    expect(
      ResetUnavailableLocalMemoryRequestSchema.safeParse({ confirmation: "erase it" }).success,
    ).toBe(false);
    expect(
      ResetUnavailableLocalMemoryRequestSchema.safeParse({
        confirmation: "ERASE_UNAVAILABLE_LOCAL_MEMORY",
      }).success,
    ).toBe(true);
  });

  it("keeps key and path fields confined to the private OPEN command", () => {
    expect(
      StorageWorkerRequestSchema.safeParse({
        operation: "READ",
        requestId: "00000000-0000-4000-8000-000000000002",
        keyHex: "11".repeat(32),
      }).success,
    ).toBe(false);
    expect(
      StorageWorkerRequestSchema.safeParse({
        operation: "OPEN",
        requestId: "00000000-0000-4000-8000-000000000002",
        databasePath: "memory.db",
        storeId: "00000000-0000-4000-8000-000000000003",
        keyHex: "11".repeat(32),
      }).success,
    ).toBe(true);
  });

  it("validates the fixed encrypted debug-snapshot worker operation", () => {
    const snapshotPath = "C:\\Temp\\memory-debug.db";
    const passphrase = "a".repeat(32);
    expect(
      LocalMemoryDebugSnapshotExportSchema.safeParse({ snapshotPath, passphrase }).success,
    ).toBe(true);
    expect(
      LocalMemoryDebugSnapshotExportSchema.safeParse({
        snapshotPath,
        passphrase,
        keyHex: "11".repeat(32),
      }).success,
    ).toBe(false);
    expect(
      LocalMemoryDebugSnapshotResultSchema.safeParse({
        ok: true,
        snapshot: { schemaVersion: 6, databasePath: snapshotPath },
      }).success,
    ).toBe(true);
  });

  it("accepts only the exact desktop development renderer URL", () => {
    expect(isDesktopDevelopmentRendererUrl("http://127.0.0.1:5173")).toBe(true);
    expect(isDesktopDevelopmentRendererUrl("http://127.0.0.1:5173/")).toBe(false);
    expect(isDesktopDevelopmentRendererUrl("http://localhost:5173")).toBe(false);
    expect(isDesktopDevelopmentRendererUrl("https://127.0.0.1:5173")).toBe(false);
    expect(isDesktopDevelopmentRendererUrl(undefined)).toBe(false);
  });

  it("validates a read-only inspector snapshot and rejects key or SQL fields", () => {
    const result = {
      ok: true,
      snapshot: {
        status: "READY",
        schemaVersion: 6,
        databasePath: "C:\\synthetic\\memory.db",
        context: {
          storeId: "00000000-0000-4000-8000-000000000011",
          contextId: "00000000-0000-4000-8000-000000000010",
          generation,
          settingsRevision: 2,
          directoryRevision: 0,
          memoryRevision: 0,
        },
        explicitPreferences: [
          {
            id: "messageLength",
            value: "CONCISE",
            source: "USER_SETTING",
            settingsRevision: 2,
            createdAt: "2026-09-14T10:00:00.000Z",
            updatedAt: "2026-09-14T10:05:00.000Z",
          },
        ],
        page: {
          kind: "PAGE",
          generation,
          directoryRevision: 0,
          recordType: "CONTACT",
          records: [],
          nextCursor: null,
        },
      },
    };
    expect(LocalMemoryInspectorResultSchema.safeParse(result).success).toBe(true);
    expect(
      LocalMemoryInspectorResultSchema.safeParse({
        ...result,
        snapshot: { ...result.snapshot, keyHex: "11".repeat(32) },
      }).success,
    ).toBe(false);
    expect(
      LocalMemoryInspectorResultSchema.safeParse({
        ...result,
        snapshot: { ...result.snapshot, sql: "SELECT * FROM sqlite_master" },
      }).success,
    ).toBe(false);
  });
});
