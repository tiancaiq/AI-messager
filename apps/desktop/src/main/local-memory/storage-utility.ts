import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import {
  ContactDirectoryResultSchema,
  LocalMemoryDebugSnapshotResultSchema,
  LocalMemoryInspectorSnapshotSchema,
  LocalMemoryResultSchema,
  LocalMemorySnapshotSchema,
  MemoryAssertionResultSchema,
  StorageWorkerRequestSchema,
  StorageWorkerResponseSchema,
  type LocalMemoryInspectorResult,
  type LocalMemoryInspectorSnapshot,
  type LocalMemoryResult,
  type LocalMemorySnapshot,
  type MemoryAssertionResult,
  type MemoryInspectorRecordType,
  type ContactDirectoryResult,
  type LocalMemoryDebugSnapshotResult,
  type StorageWorkerRequest,
} from "@ai-message-coach/contracts";

import { createDirectorySchema, executeDirectory, listDirectory } from "./directory-store.js";
import {
  createAssertionSchema,
  deletePreference,
  executeMemory,
  listMemory,
  migrateLegacyPreference,
  readPreferenceProjection,
  savePreference,
} from "./assertion-store.js";
import { resolveAsarUnpackedPath } from "./native-path.js";
import { upgradeAssertionSchemaV5 } from "./assertion-v5.js";
import { upgradeAssertionSchemaV6 } from "./assertion-v6.js";

interface Database {
  all(sql: string, ...values: unknown[]): Promise<Record<string, unknown>[]>;
  close(): Promise<void>;
  exec(sql: string): Promise<void>;
  get(sql: string, ...values: unknown[]): Promise<Record<string, unknown> | undefined>;
  run(sql: string, ...values: unknown[]): Promise<unknown>;
}

interface SqliteModule {
  open(path: string): Promise<Database>;
}

let database: Database | undefined;
let openedDatabasePath: string | undefined;

type WorkerResult =
  | LocalMemoryResult
  | LocalMemoryInspectorResult
  | LocalMemoryDebugSnapshotResult
  | ContactDirectoryResult
  | MemoryAssertionResult;

const unavailable = (): LocalMemoryResult => ({
  ok: false,
  error: { code: "STORE_UNAVAILABLE", message: "Local memory is unavailable." },
});

const debugSnapshotUnavailable = (): LocalMemoryDebugSnapshotResult => ({
  ok: false,
  error: { code: "STORE_UNAVAILABLE", message: "Local memory is unavailable." },
});

async function loadSqlite(): Promise<SqliteModule> {
  const stagedEntry = join(
    __dirname,
    "../../native/sqlcipher/node_modules/@appthreat/sqlite3/lib/sqlite3.js",
  );
  const entry = resolveAsarUnpackedPath(stagedEntry);
  const loaded = (await import(/* @vite-ignore */ pathToFileURL(entry).href)) as {
    default: SqliteModule;
  };
  return loaded.default;
}

async function configureAndMigrate(request: Extract<StorageWorkerRequest, { operation: "OPEN" }>) {
  const sqlite = await loadSqlite();
  const opened = await sqlite.open(request.databasePath);
  try {
    await opened.exec(`PRAGMA key = "x'${request.keyHex}'";`);
    await opened.exec(
      "PRAGMA cipher_memory_security=ON; PRAGMA temp_store=MEMORY; PRAGMA journal_mode=DELETE; PRAGMA secure_delete=ON; PRAGMA busy_timeout=250; PRAGMA foreign_keys=ON;",
    );
    const cipher = await opened.get("PRAGMA cipher_version;");
    const provider = await opened.get("PRAGMA cipher_provider;");
    const options = await opened.all("PRAGMA compile_options;");
    const integrity = await opened.all("PRAGMA cipher_integrity_check;");
    if (
      cipher?.cipher_version !== "4.17.0 community" ||
      provider?.cipher_provider !== "openssl" ||
      !options.some((row) => row.compile_options === "TEMP_STORE=2") ||
      integrity.length !== 0
    ) {
      throw new Error("cipher verification failed");
    }

    const version = await opened.get("PRAGMA user_version;");
    const userVersion = Number(version?.user_version ?? 0);
    if (userVersion > 6) throw new Error("unsupported schema");
    if (userVersion === 0) {
      await opened.exec("BEGIN IMMEDIATE;");
      try {
        await opened.exec(`
          CREATE TABLE local_context (
            singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
            store_id TEXT NOT NULL,
            context_id TEXT NOT NULL,
            generation TEXT NOT NULL,
            settings_revision INTEGER NOT NULL CHECK (settings_revision >= 0),
            directory_revision INTEGER NOT NULL CHECK (directory_revision >= 0),
            memory_revision INTEGER NOT NULL CHECK (memory_revision >= 0)
          );
        `);
        await opened.run(
          "INSERT INTO local_context(singleton, store_id, context_id, generation, settings_revision, directory_revision, memory_revision) VALUES (1, ?, ?, ?, 0, 0, 0)",
          request.storeId,
          randomUUID(),
          randomUUID(),
        );
        await createDirectorySchema(opened);
        await createAssertionSchema(opened);
        await opened.exec("PRAGMA user_version=4; COMMIT;");
      } catch (error) {
        await opened.exec("ROLLBACK;");
        throw error;
      }
    }
    if (userVersion === 1) {
      await opened.exec("BEGIN IMMEDIATE;");
      try {
        await opened.exec("ALTER TABLE local_context ADD COLUMN store_id TEXT;");
        await opened.run(
          "UPDATE local_context SET store_id=? WHERE singleton=1 AND store_id IS NULL",
          request.storeId,
        );
        await opened.exec("PRAGMA user_version=2; COMMIT;");
      } catch (error) {
        await opened.exec("ROLLBACK;");
        throw error;
      }
    }
    if (userVersion === 1 || userVersion === 2) {
      await opened.exec("BEGIN IMMEDIATE;");
      try {
        await opened.exec(
          "ALTER TABLE local_context ADD COLUMN directory_revision INTEGER NOT NULL DEFAULT 0 CHECK (directory_revision >= 0);",
        );
        await createDirectorySchema(opened);
        await opened.exec("PRAGMA user_version=3; COMMIT;");
      } catch (error) {
        await opened.exec("ROLLBACK;");
        throw error;
      }
    }
    if (userVersion === 1 || userVersion === 2 || userVersion === 3) {
      await opened.exec("BEGIN IMMEDIATE;");
      try {
        await opened.exec(
          "ALTER TABLE local_context ADD COLUMN memory_revision INTEGER NOT NULL DEFAULT 0 CHECK (memory_revision >= 0);",
        );
        await createAssertionSchema(opened);
        const migrationContext = await opened.get(
          "SELECT context_id FROM local_context WHERE singleton=1",
        );
        if (!migrationContext) throw new Error("missing context");
        await migrateLegacyPreference(opened, String(migrationContext.context_id));
        await opened.exec("DROP TABLE explicit_preference; PRAGMA user_version=4; COMMIT;");
      } catch (error) {
        await opened.exec("ROLLBACK;");
        throw error;
      }
    }
    if (userVersion <= 4) {
      await opened.exec("PRAGMA foreign_keys=OFF; BEGIN IMMEDIATE;");
      try {
        await upgradeAssertionSchemaV5(opened);
        const violations = await opened.all("PRAGMA foreign_key_check;");
        if (violations.length !== 0) throw new Error("schema migration reference check failed");
        await opened.exec("PRAGMA user_version=5; COMMIT; PRAGMA foreign_keys=ON;");
      } catch (error) {
        await opened.exec("ROLLBACK; PRAGMA foreign_keys=ON;").catch(() => undefined);
        throw error;
      }
    }
    if (userVersion <= 5) {
      await opened.exec("BEGIN IMMEDIATE;");
      try {
        await upgradeAssertionSchemaV6(opened);
        const violations = await opened.all("PRAGMA foreign_key_check;");
        if (violations.length !== 0) throw new Error("schema migration reference check failed");
        await opened.exec("PRAGMA user_version=6; COMMIT;");
      } catch (error) {
        await opened.exec("ROLLBACK;").catch(() => undefined);
        throw error;
      }
    }
    const foreignKeys = await opened.get("PRAGMA foreign_keys;");
    if (Number(foreignKeys?.foreign_keys) !== 1) throw new Error("foreign keys unavailable");
    const binding = await opened.get("SELECT store_id FROM local_context WHERE singleton=1");
    if (binding?.store_id !== request.storeId) throw new Error("store binding mismatch");
    database = opened;
    openedDatabasePath = request.databasePath;
    return await readSnapshot();
  } catch (error) {
    await opened.close();
    throw error;
  }
}

async function inspectSnapshot(
  request: Extract<StorageWorkerRequest, { operation: "INSPECT" }>,
): Promise<LocalMemoryInspectorSnapshot> {
  if (!database || !openedDatabasePath) throw new Error("not open");
  const version = await database.get("PRAGMA user_version;");
  const context = await database.get(`
    SELECT store_id, context_id, generation, settings_revision, directory_revision, memory_revision
    FROM local_context
    WHERE singleton = 1
  `);
  const preference = await readPreferenceProjection(database);
  const memorySection =
    request.section.startsWith("MEMORY_") || request.section === "RELATIONSHIP_CONTEXT";
  const pageResult = memorySection
    ? await listMemory(database, {
        operation: "LIST",
        generation: String(context?.generation),
        memoryRevision: Number(context?.memory_revision),
        recordType: request.section as MemoryInspectorRecordType,
        filter: request.filter,
        cursor: request.cursor,
        limit: request.limit,
      })
    : await listDirectory(database, {
        operation: "LIST",
        generation: String(context?.generation),
        directoryRevision: Number(context?.directory_revision),
        recordType: request.section as "CONTACT" | "PLATFORM_IDENTITY" | "IDENTITY_ASSOCIATION",
        cursor: request.cursor,
        limit: request.limit,
      });
  if (!pageResult.ok || pageResult.result.kind !== "PAGE")
    throw new Error("inspection unavailable");
  return LocalMemoryInspectorSnapshotSchema.parse({
    status: "READY",
    schemaVersion: Number(version?.user_version),
    databasePath: openedDatabasePath,
    context: {
      storeId: context?.store_id,
      contextId: context?.context_id,
      generation: context?.generation,
      settingsRevision: context?.settings_revision,
      directoryRevision: context?.directory_revision,
      memoryRevision: context?.memory_revision,
    },
    explicitPreferences: preference
      ? [
          {
            id: "messageLength",
            value: preference.value,
            source: preference.source,
            settingsRevision: context?.settings_revision,
            createdAt: preference.createdAt,
            updatedAt: preference.updatedAt,
          },
        ]
      : [],
    page: pageResult.result,
  });
}

async function readSnapshot(): Promise<LocalMemorySnapshot> {
  if (!database) throw new Error("not open");
  const row = await database.get(
    "SELECT generation,settings_revision AS revision,directory_revision,memory_revision FROM local_context WHERE singleton=1",
  );
  const preference = await readPreferenceProjection(database);
  return LocalMemorySnapshotSchema.parse({
    generation: String(row?.generation),
    revision: Number(row?.revision),
    directoryRevision: Number(row?.directory_revision),
    memoryRevision: Number(row?.memory_revision),
    messageLength: preference?.value ?? null,
    updatedAt: preference?.updatedAt ?? null,
  });
}

async function exportDebugSnapshot(
  request: Extract<StorageWorkerRequest, { operation: "EXPORT_DEBUG_SNAPSHOT" }>,
): Promise<LocalMemoryDebugSnapshotResult> {
  if (!database) return debugSnapshotUnavailable();
  let attached = false;
  try {
    await database.run(
      "ATTACH DATABASE ? AS debug_snapshot KEY ?",
      request.snapshotPath,
      request.passphrase,
    );
    attached = true;
    await database.exec("BEGIN;");
    await database.get("SELECT sqlcipher_export('debug_snapshot') AS exported;");
    await database.exec("PRAGMA debug_snapshot.user_version=6; COMMIT;");
    const integrity = await database.all("PRAGMA debug_snapshot.cipher_integrity_check;");
    if (integrity.length !== 0) throw new Error("debug snapshot integrity check failed");
    await database.exec("DETACH DATABASE debug_snapshot;");
    attached = false;
    return LocalMemoryDebugSnapshotResultSchema.parse({
      ok: true,
      snapshot: { schemaVersion: 6, databasePath: request.snapshotPath },
    });
  } catch {
    await database.exec("ROLLBACK;").catch(() => undefined);
    if (attached) {
      await database.exec("DETACH DATABASE debug_snapshot;").catch(() => undefined);
    }
    return debugSnapshotUnavailable();
  }
}

async function mutate(request: StorageWorkerRequest): Promise<LocalMemoryResult> {
  if (!database) return unavailable();
  await database.exec("BEGIN IMMEDIATE;");
  try {
    const current = await readSnapshot();
    if (
      "generation" in request &&
      (request.generation !== current.generation ||
        ("revision" in request && request.revision !== current.revision))
    ) {
      await database.exec("ROLLBACK;");
      return {
        ok: false,
        error: { code: "CONFLICT", message: "Local memory changed. Refresh and try again." },
      };
    }

    if (request.operation === "SAVE") {
      const context = await database.get("SELECT context_id FROM local_context WHERE singleton=1");
      if (!context) throw new Error("missing context");
      const changed = await savePreference(database, String(context.context_id), request.value);
      if (changed)
        await database.run(
          "UPDATE local_context SET settings_revision=settings_revision+1,memory_revision=memory_revision+1 WHERE singleton=1",
        );
    } else if (request.operation === "DELETE") {
      const context = await database.get("SELECT context_id FROM local_context WHERE singleton=1");
      if (!context) throw new Error("missing context");
      await deletePreference(database, String(context.context_id));
      await database.run(
        "UPDATE local_context SET settings_revision=settings_revision+1,memory_revision=memory_revision+1 WHERE singleton=1",
      );
    } else if (request.operation === "CLEAR") {
      await database.run("DELETE FROM memory_decision");
      await database.run("DELETE FROM assertion_evidence_link");
      await database.run("DELETE FROM memory_evidence");
      await database.run("DELETE FROM memory_assertion");
      await database.run("DELETE FROM relationship_context");
      await database.run("DELETE FROM identity_association");
      await database.run("DELETE FROM platform_identity");
      await database.run("DELETE FROM contact");
      await database.run(
        "UPDATE local_context SET context_id=?,generation=?,settings_revision=0,directory_revision=0,memory_revision=0 WHERE singleton=1",
        randomUUID(),
        randomUUID(),
      );
    } else {
      await database.exec("ROLLBACK;");
      return unavailable();
    }
    await database.exec("COMMIT;");
    return LocalMemoryResultSchema.parse({ ok: true, snapshot: await readSnapshot() });
  } catch (error) {
    await database.exec("ROLLBACK;").catch(() => undefined);
    throw error;
  }
}

async function execute(request: StorageWorkerRequest): Promise<WorkerResult> {
  if (request.operation === "OPEN") {
    return { ok: true, snapshot: await configureAndMigrate(request) };
  }
  if (request.operation === "READ") {
    return { ok: true, snapshot: await readSnapshot() };
  }
  if (request.operation === "INSPECT") {
    return { ok: true, snapshot: await inspectSnapshot(request) };
  }
  if (request.operation === "DIRECTORY") {
    if (!database) {
      return {
        ok: false,
        error: { code: "STORE_UNAVAILABLE", message: "Local memory is unavailable." },
      };
    }
    return ContactDirectoryResultSchema.parse(await executeDirectory(database, request.request));
  }
  if (request.operation === "MEMORY") {
    if (!database) {
      return {
        ok: false,
        error: { code: "STORE_UNAVAILABLE", message: "Local memory is unavailable." },
      };
    }
    return MemoryAssertionResultSchema.parse(await executeMemory(database, request.request));
  }
  if (request.operation === "EXPORT_DEBUG_SNAPSHOT") {
    return await exportDebugSnapshot(request);
  }
  if (request.operation === "CLOSE") {
    await database?.close();
    database = undefined;
    openedDatabasePath = undefined;
    return unavailable();
  }
  return await mutate(request);
}

process.parentPort.on("message", (event) => {
  void (async () => {
    const parsed = StorageWorkerRequestSchema.safeParse(event.data);
    if (!parsed.success) return;
    let result: WorkerResult;
    try {
      result = await execute(parsed.data);
    } catch {
      result = unavailable();
    }
    process.parentPort.postMessage(
      StorageWorkerResponseSchema.parse({ requestId: parsed.data.requestId, result }),
    );
  })();
});
