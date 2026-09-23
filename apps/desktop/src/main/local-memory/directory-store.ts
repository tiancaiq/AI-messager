import { randomUUID } from "node:crypto";

import {
  CONTACT_ASSOCIATION_LIMIT,
  CONTACT_DIRECTORY_RESPONSE_BYTES,
  ContactDirectoryResultSchema,
  DirectoryCursorSchema,
  type ContactDirectoryRequest,
  type ContactDirectoryResult,
  type ContactRecord,
  type DirectoryMutation,
  type DirectoryPage,
  type DirectoryRecord,
  type DirectoryRecordType,
  type IdentityAssociationRecord,
  type PlatformIdentityRecord,
} from "@ai-message-coach/contracts";

import {
  invalidateAssociationEvidence,
  invalidateContactMemory,
  invalidateIdentityMemory,
} from "./assertion-store.js";

export interface DirectoryDatabase {
  all(sql: string, ...values: unknown[]): Promise<Record<string, unknown>[]>;
  exec(sql: string): Promise<void>;
  get(sql: string, ...values: unknown[]): Promise<Record<string, unknown> | undefined>;
  run(sql: string, ...values: unknown[]): Promise<unknown>;
}

class DirectoryConflict extends Error {}
class DirectoryInvalid extends Error {}

const safeError = (
  code: "CONFLICT" | "INVALID_REQUEST" | "STORE_UNAVAILABLE",
): ContactDirectoryResult => ({
  ok: false,
  error: {
    code,
    message:
      code === "CONFLICT"
        ? "The contact directory changed. Refresh and try again."
        : code === "INVALID_REQUEST"
          ? "The contact directory request was not accepted."
          : "The contact directory is unavailable. Coaching still works without it.",
  },
});

export async function createDirectorySchema(database: DirectoryDatabase): Promise<void> {
  await database.exec(`
    CREATE TABLE contact (
      id TEXT PRIMARY KEY,
      context_id TEXT NOT NULL,
      label TEXT NOT NULL,
      revision INTEGER NOT NULL CHECK (revision > 0),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(context_id, id)
    );
    CREATE TABLE platform_identity (
      id TEXT PRIMARY KEY,
      context_id TEXT NOT NULL,
      platform TEXT,
      account_namespace TEXT,
      identifier_kind TEXT,
      identifier_value TEXT,
      display_label TEXT,
      origin TEXT NOT NULL CHECK (origin = 'USER_ENTERED'),
      revision INTEGER NOT NULL CHECK (revision > 0),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      CHECK (display_label IS NOT NULL OR identifier_value IS NOT NULL),
      UNIQUE(context_id, id)
    );
    CREATE TABLE identity_association (
      id TEXT PRIMARY KEY,
      context_id TEXT NOT NULL,
      identity_id TEXT NOT NULL,
      contact_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('CANDIDATE','CONFIRMED','REJECTED','REVOKED')),
      authority TEXT NOT NULL CHECK (authority = 'USER_DECISION'),
      revision INTEGER NOT NULL CHECK (revision > 0),
      created_at TEXT NOT NULL,
      decided_at TEXT,
      revoked_at TEXT,
      CHECK (
        (status = 'CANDIDATE' AND decided_at IS NULL AND revoked_at IS NULL) OR
        (status IN ('CONFIRMED','REJECTED') AND decided_at IS NOT NULL AND revoked_at IS NULL) OR
        (status = 'REVOKED' AND decided_at IS NOT NULL AND revoked_at IS NOT NULL)
      ),
      FOREIGN KEY(context_id, identity_id) REFERENCES platform_identity(context_id, id) ON DELETE CASCADE,
      FOREIGN KEY(context_id, contact_id) REFERENCES contact(context_id, id) ON DELETE CASCADE
    );
    CREATE INDEX contact_directory_order ON contact(context_id, id);
    CREATE INDEX identity_directory_order ON platform_identity(context_id, id);
    CREATE INDEX association_directory_order ON identity_association(context_id, id);
    CREATE INDEX association_by_identity ON identity_association(context_id, identity_id, id);
    CREATE INDEX association_by_contact ON identity_association(context_id, contact_id, id);
    CREATE UNIQUE INDEX one_confirmed_contact_per_identity
      ON identity_association(context_id, identity_id)
      WHERE status = 'CONFIRMED';
  `);
}

interface DirectoryContext {
  contextId: string;
  generation: string;
  directoryRevision: number;
}

async function readContext(database: DirectoryDatabase): Promise<DirectoryContext> {
  const row = await database.get(
    "SELECT context_id, generation, directory_revision FROM local_context WHERE singleton=1",
  );
  if (!row) throw new DirectoryInvalid();
  return {
    contextId: String(row.context_id),
    generation: String(row.generation),
    directoryRevision: Number(row.directory_revision),
  };
}

function checkExpected(context: DirectoryContext, request: ContactDirectoryRequest): void {
  if (
    request.generation !== context.generation ||
    request.directoryRevision !== context.directoryRevision
  ) {
    throw new DirectoryConflict();
  }
}

function contact(row: Record<string, unknown>): ContactRecord {
  return {
    recordType: "CONTACT",
    id: String(row.id),
    label: String(row.label),
    revision: Number(row.revision),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function identity(row: Record<string, unknown>): PlatformIdentityRecord {
  const optional = (value: unknown) => (typeof value === "string" ? value : null);
  return {
    recordType: "PLATFORM_IDENTITY",
    id: String(row.id),
    platform: optional(row.platform),
    namespace: optional(row.account_namespace),
    identifierKind: optional(row.identifier_kind),
    identifierValue: optional(row.identifier_value),
    displayLabel: optional(row.display_label),
    origin: "USER_ENTERED",
    revision: Number(row.revision),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function association(row: Record<string, unknown>): IdentityAssociationRecord {
  const optional = (value: unknown) => (typeof value === "string" ? value : null);
  return {
    recordType: "IDENTITY_ASSOCIATION",
    id: String(row.id),
    identityId: String(row.identity_id),
    contactId: String(row.contact_id),
    status: row.status as IdentityAssociationRecord["status"],
    authority: "USER_DECISION",
    revision: Number(row.revision),
    createdAt: String(row.created_at),
    decidedAt: optional(row.decided_at),
    revokedAt: optional(row.revoked_at),
  };
}

interface CursorValue {
  generation: string;
  directoryRevision: number;
  recordType: DirectoryRecordType;
  lastId: string;
}

function encodeCursor(value: CursorValue): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function decodeCursor(value: string | null | undefined): CursorValue | undefined {
  if (!value) return undefined;
  if (!DirectoryCursorSchema.safeParse(value).success) throw new DirectoryConflict();
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error();
    const record = parsed as Record<string, unknown>;
    if (
      Object.keys(record).sort().join(",") !== "directoryRevision,generation,lastId,recordType" ||
      typeof record.generation !== "string" ||
      typeof record.directoryRevision !== "number" ||
      !["CONTACT", "PLATFORM_IDENTITY", "IDENTITY_ASSOCIATION"].includes(
        String(record.recordType),
      ) ||
      typeof record.lastId !== "string"
    ) {
      throw new Error();
    }
    return record as unknown as CursorValue;
  } catch {
    throw new DirectoryConflict();
  }
}

export async function listDirectory(
  database: DirectoryDatabase,
  request: Extract<ContactDirectoryRequest, { operation: "LIST" }>,
): Promise<ContactDirectoryResult> {
  try {
    const context = await readContext(database);
    checkExpected(context, request);
    const cursor = decodeCursor(request.cursor);
    if (
      cursor &&
      (cursor.generation !== context.generation ||
        cursor.directoryRevision !== context.directoryRevision ||
        cursor.recordType !== request.recordType)
    ) {
      throw new DirectoryConflict();
    }
    const lastId = cursor?.lastId ?? "";
    const table =
      request.recordType === "CONTACT"
        ? "contact"
        : request.recordType === "PLATFORM_IDENTITY"
          ? "platform_identity"
          : "identity_association";
    const rows = await database.all(
      `SELECT * FROM ${table} WHERE context_id=? AND id>? ORDER BY id LIMIT ?`,
      context.contextId,
      lastId,
      request.limit + 1,
    );
    const mapper =
      request.recordType === "CONTACT"
        ? contact
        : request.recordType === "PLATFORM_IDENTITY"
          ? identity
          : association;
    const mapped = rows.map(mapper as (row: Record<string, unknown>) => DirectoryRecord);
    let records = mapped.slice(0, request.limit);
    let hasMore = mapped.length > request.limit;
    let page: DirectoryPage;
    for (;;) {
      const nextCursor =
        (hasMore || records.length < mapped.length) && records.length > 0
          ? encodeCursor({
              generation: context.generation,
              directoryRevision: context.directoryRevision,
              recordType: request.recordType,
              lastId: records.at(-1)?.id ?? "",
            })
          : null;
      page = {
        kind: "PAGE",
        generation: context.generation,
        directoryRevision: context.directoryRevision,
        recordType: request.recordType,
        records,
        nextCursor,
      };
      if (
        Buffer.byteLength(JSON.stringify({ ok: true, result: page }), "utf8") <=
        CONTACT_DIRECTORY_RESPONSE_BYTES
      )
        break;
      if (records.length === 0) throw new DirectoryInvalid();
      records = records.slice(0, -1);
      hasMore = true;
    }
    return ContactDirectoryResultSchema.parse({ ok: true, result: page });
  } catch (error) {
    return error instanceof DirectoryConflict
      ? safeError("CONFLICT")
      : error instanceof DirectoryInvalid
        ? safeError("INVALID_REQUEST")
        : safeError("STORE_UNAVAILABLE");
  }
}

async function requireRow(
  database: DirectoryDatabase,
  table: "contact" | "platform_identity" | "identity_association",
  contextId: string,
  id: string,
  revision: number,
): Promise<Record<string, unknown>> {
  const row = await database.get(
    `SELECT * FROM ${table} WHERE context_id=? AND id=? AND revision=?`,
    contextId,
    id,
    revision,
  );
  if (!row) throw new DirectoryConflict();
  return row;
}

async function requireAssociationCapacity(
  database: DirectoryDatabase,
  contextId: string,
  identityId: string,
): Promise<void> {
  const row = await database.get(
    "SELECT COUNT(*) AS count FROM identity_association WHERE context_id=? AND identity_id=?",
    contextId,
    identityId,
  );
  if (Number(row?.count) >= CONTACT_ASSOCIATION_LIMIT) throw new DirectoryInvalid();
}

export async function mutateDirectory(
  database: DirectoryDatabase,
  request: Exclude<ContactDirectoryRequest, { operation: "LIST" }>,
): Promise<ContactDirectoryResult> {
  await database.exec("BEGIN IMMEDIATE;");
  try {
    const context = await readContext(database);
    checkExpected(context, request);
    const changed: DirectoryMutation = {
      kind: "MUTATION",
      generation: context.generation,
      directoryRevision: context.directoryRevision + 1,
      contacts: [],
      identities: [],
      associations: [],
    };
    const now = new Date().toISOString();
    let memoryChanged = false;

    if (request.operation === "CREATE_CONTACT") {
      const id = randomUUID();
      await database.run(
        "INSERT INTO contact(id,context_id,label,revision,created_at,updated_at) VALUES (?,?,?,1,?,?)",
        id,
        context.contextId,
        request.label,
        now,
        now,
      );
      changed.contacts.push(contact((await database.get("SELECT * FROM contact WHERE id=?", id))!));
    } else if (request.operation === "RENAME_CONTACT") {
      await requireRow(
        database,
        "contact",
        context.contextId,
        request.contactId,
        request.contactRevision,
      );
      await database.run(
        "UPDATE contact SET label=?, revision=revision+1, updated_at=? WHERE id=?",
        request.label,
        now,
        request.contactId,
      );
      changed.contacts.push(
        contact((await database.get("SELECT * FROM contact WHERE id=?", request.contactId))!),
      );
    } else if (request.operation === "DELETE_CONTACT") {
      await requireRow(
        database,
        "contact",
        context.contextId,
        request.contactId,
        request.contactRevision,
      );
      const exclusive = await database.all(
        `SELECT DISTINCT a.identity_id FROM identity_association a
         WHERE a.context_id=? AND a.contact_id=?
           AND NOT EXISTS (
             SELECT 1 FROM identity_association other
             WHERE other.context_id=a.context_id AND other.identity_id=a.identity_id
               AND other.contact_id<>a.contact_id
           )`,
        context.contextId,
        request.contactId,
      );
      memoryChanged = await invalidateContactMemory(database, context.contextId, request.contactId);
      await database.run("DELETE FROM contact WHERE id=?", request.contactId);
      for (const row of exclusive)
        await database.run("DELETE FROM platform_identity WHERE id=?", row.identity_id);
    } else if (request.operation === "CREATE_IDENTITY") {
      if (request.candidateContactId) {
        const target = await database.get(
          "SELECT * FROM contact WHERE context_id=? AND id=?",
          context.contextId,
          request.candidateContactId,
        );
        if (!target) throw new DirectoryConflict();
      }
      const id = randomUUID();
      await database.run(
        `INSERT INTO platform_identity(
          id,context_id,platform,account_namespace,identifier_kind,identifier_value,display_label,
          origin,revision,created_at,updated_at
        ) VALUES (?,?,?,?,?,?,?,'USER_ENTERED',1,?,?)`,
        id,
        context.contextId,
        request.platform ?? null,
        request.namespace ?? null,
        request.identifierKind ?? null,
        request.identifierValue ?? null,
        request.displayLabel ?? null,
        now,
        now,
      );
      changed.identities.push(
        identity((await database.get("SELECT * FROM platform_identity WHERE id=?", id))!),
      );
      if (request.candidateContactId) {
        const associationId = randomUUID();
        await database.run(
          `INSERT INTO identity_association(
            id,context_id,identity_id,contact_id,status,authority,revision,created_at,decided_at,revoked_at
          ) VALUES (?,?,?,?,'CANDIDATE','USER_DECISION',1,?,NULL,NULL)`,
          associationId,
          context.contextId,
          id,
          request.candidateContactId,
          now,
        );
        changed.associations.push(
          association(
            (await database.get("SELECT * FROM identity_association WHERE id=?", associationId))!,
          ),
        );
      }
    } else if (request.operation === "DELETE_IDENTITY") {
      await requireRow(
        database,
        "platform_identity",
        context.contextId,
        request.identityId,
        request.identityRevision,
      );
      memoryChanged = await invalidateIdentityMemory(
        database,
        context.contextId,
        request.identityId,
      );
      await database.run("DELETE FROM platform_identity WHERE id=?", request.identityId);
    } else if (request.operation === "PROPOSE_ASSOCIATION") {
      await requireRow(
        database,
        "platform_identity",
        context.contextId,
        request.identityId,
        request.identityRevision,
      );
      await requireRow(
        database,
        "contact",
        context.contextId,
        request.contactId,
        request.contactRevision,
      );
      await requireAssociationCapacity(database, context.contextId, request.identityId);
      const prior = await database.get(
        `SELECT status FROM identity_association
         WHERE context_id=? AND identity_id=? AND contact_id=?
         ORDER BY created_at DESC, id DESC LIMIT 1`,
        context.contextId,
        request.identityId,
        request.contactId,
      );
      if (prior) throw new DirectoryConflict();
      const id = randomUUID();
      await database.run(
        `INSERT INTO identity_association(
          id,context_id,identity_id,contact_id,status,authority,revision,created_at,decided_at,revoked_at
        ) VALUES (?,?,?,?,'CANDIDATE','USER_DECISION',1,?,NULL,NULL)`,
        id,
        context.contextId,
        request.identityId,
        request.contactId,
        now,
      );
      changed.associations.push(
        association((await database.get("SELECT * FROM identity_association WHERE id=?", id))!),
      );
    } else if (request.operation === "DECIDE_ASSOCIATION") {
      const row = await requireRow(
        database,
        "identity_association",
        context.contextId,
        request.associationId,
        request.associationRevision,
      );
      if (row.status !== "CANDIDATE") throw new DirectoryConflict();
      if (request.decision === "CONFIRM") {
        const current = await database.get(
          "SELECT id FROM identity_association WHERE context_id=? AND identity_id=? AND status='CONFIRMED'",
          context.contextId,
          row.identity_id,
        );
        if (current) throw new DirectoryConflict();
      }
      await database.run(
        "UPDATE identity_association SET status=?,revision=revision+1,decided_at=? WHERE id=?",
        request.decision === "CONFIRM" ? "CONFIRMED" : "REJECTED",
        now,
        request.associationId,
      );
      changed.associations.push(
        association(
          (await database.get(
            "SELECT * FROM identity_association WHERE id=?",
            request.associationId,
          ))!,
        ),
      );
    } else if (request.operation === "REVOKE_ASSOCIATION") {
      const row = await requireRow(
        database,
        "identity_association",
        context.contextId,
        request.associationId,
        request.associationRevision,
      );
      if (row.status !== "CONFIRMED") throw new DirectoryConflict();
      memoryChanged = await invalidateAssociationEvidence(
        database,
        context.contextId,
        request.associationId,
        request.associationRevision,
      );
      await database.run(
        "UPDATE identity_association SET status='REVOKED',revision=revision+1,revoked_at=? WHERE id=?",
        now,
        request.associationId,
      );
      changed.associations.push(
        association(
          (await database.get(
            "SELECT * FROM identity_association WHERE id=?",
            request.associationId,
          ))!,
        ),
      );
    } else if (request.operation === "REASSIGN_ASSOCIATION") {
      const old = await requireRow(
        database,
        "identity_association",
        context.contextId,
        request.associationId,
        request.associationRevision,
      );
      if (old.status !== "CONFIRMED" || old.contact_id === request.newContactId)
        throw new DirectoryConflict();
      memoryChanged = await invalidateAssociationEvidence(
        database,
        context.contextId,
        request.associationId,
        request.associationRevision,
      );
      await requireRow(
        database,
        "contact",
        context.contextId,
        request.newContactId,
        request.newContactRevision,
      );
      await requireAssociationCapacity(database, context.contextId, String(old.identity_id));
      await database.run(
        "UPDATE identity_association SET status='REVOKED',revision=revision+1,revoked_at=? WHERE id=?",
        now,
        request.associationId,
      );
      const id = randomUUID();
      await database.run(
        `INSERT INTO identity_association(
          id,context_id,identity_id,contact_id,status,authority,revision,created_at,decided_at,revoked_at
        ) VALUES (?,?,?,?,'CONFIRMED','USER_DECISION',1,?,?,NULL)`,
        id,
        context.contextId,
        old.identity_id,
        request.newContactId,
        now,
        now,
      );
      changed.associations.push(
        association(
          (await database.get(
            "SELECT * FROM identity_association WHERE id=?",
            request.associationId,
          ))!,
        ),
        association((await database.get("SELECT * FROM identity_association WHERE id=?", id))!),
      );
    } else if (request.operation === "RECONSIDER_ASSOCIATION") {
      const old = await requireRow(
        database,
        "identity_association",
        context.contextId,
        request.associationId,
        request.associationRevision,
      );
      if (old.status !== "REJECTED" && old.status !== "REVOKED") throw new DirectoryConflict();
      await requireAssociationCapacity(database, context.contextId, String(old.identity_id));
      const id = randomUUID();
      await database.run(
        `INSERT INTO identity_association(
          id,context_id,identity_id,contact_id,status,authority,revision,created_at,decided_at,revoked_at
        ) VALUES (?,?,?,?,'CANDIDATE','USER_DECISION',1,?,NULL,NULL)`,
        id,
        context.contextId,
        old.identity_id,
        old.contact_id,
        now,
      );
      changed.associations.push(
        association((await database.get("SELECT * FROM identity_association WHERE id=?", id))!),
      );
    }

    await database.run(
      "UPDATE local_context SET directory_revision=directory_revision+1 WHERE singleton=1",
    );
    if (memoryChanged)
      await database.run(
        "UPDATE local_context SET memory_revision=memory_revision+1 WHERE singleton=1",
      );
    await database.exec("COMMIT;");
    return ContactDirectoryResultSchema.parse({ ok: true, result: changed });
  } catch (error) {
    await database.exec("ROLLBACK;").catch(() => undefined);
    return error instanceof DirectoryConflict
      ? safeError("CONFLICT")
      : error instanceof DirectoryInvalid
        ? safeError("INVALID_REQUEST")
        : safeError("STORE_UNAVAILABLE");
  }
}

export async function executeDirectory(
  database: DirectoryDatabase,
  request: ContactDirectoryRequest,
): Promise<ContactDirectoryResult> {
  return request.operation === "LIST"
    ? await listDirectory(database, request)
    : await mutateDirectory(database, request);
}
