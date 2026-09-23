import { randomUUID } from "node:crypto";

import {
  MEMORY_ASSERTION_RESPONSE_BYTES,
  MEMORY_ASSERTION_VERSION_LIMIT,
  MEMORY_DECISION_LIMIT,
  MEMORY_EVIDENCE_LINK_LIMIT,
  RELATIONSHIP_EPISODE_LIMIT,
  MemoryAssertionResultSchema,
  MemoryPageSchema,
  MemoryPageFilterSchema,
  type MemoryAssertionRecord,
  type MemoryAssertionRequest,
  type MemoryAssertionResult,
  type MemoryDecisionRecord,
  type MemoryEvidenceInput,
  type MemoryEvidenceLinkRecord,
  type MemoryEvidenceRecord,
  type MemoryEvidenceRole,
  type MemoryInspectorRecord,
  type MemoryInspectorRecordType,
  type MemoryMutation,
  type MemoryPageFilter,
  type MemorySubject,
  type MessageLengthPreference,
  type RelationshipClaim,
  type RelationshipContextRecord,
  type RelationshipValue,
  type RelationshipValidity,
  RelationshipValiditySchema,
} from "@ai-message-coach/contracts";

import { canReconsider, decideCandidate, supersede } from "./assertion-policy.js";
import { classifyRelationshipAt, relationshipIntervalsMayOverlap } from "./relationship-policy.js";

export interface MemoryDatabase {
  all(sql: string, ...values: unknown[]): Promise<Record<string, unknown>[]>;
  exec(sql: string): Promise<void>;
  get(sql: string, ...values: unknown[]): Promise<Record<string, unknown> | undefined>;
  run(sql: string, ...values: unknown[]): Promise<unknown>;
}

class MemoryConflict extends Error {}
class MemoryInvalid extends Error {}

interface MemoryContext {
  contextId: string;
  generation: string;
  memoryRevision: number;
}

const safeError = (
  code: "CONFLICT" | "INVALID_REQUEST" | "STORE_UNAVAILABLE",
): MemoryAssertionResult => ({
  ok: false,
  error: {
    code,
    message:
      code === "CONFLICT"
        ? "Local memory changed. Refresh and try again."
        : code === "INVALID_REQUEST"
          ? "The memory assertion request was not accepted."
          : "Local memory is unavailable. Coaching still works without it.",
  },
});

export async function createAssertionSchema(database: MemoryDatabase): Promise<void> {
  await database.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS association_context_id
      ON identity_association(context_id, id);
    CREATE TABLE memory_assertion (
      id TEXT PRIMARY KEY,
      context_id TEXT NOT NULL,
      subject_kind TEXT NOT NULL CHECK (subject_kind IN ('LOCAL_USER','CONTACT')),
      subject_key TEXT NOT NULL,
      contact_id TEXT,
      predicate TEXT NOT NULL CHECK (predicate = 'REPLY_LENGTH_PREFERENCE'),
      preference_value TEXT NOT NULL CHECK (preference_value IN ('CONCISE','BALANCED','DETAILED')),
      acceptance TEXT NOT NULL CHECK (acceptance IN ('CANDIDATE','CONFIRMED','REJECTED')),
      lifecycle TEXT NOT NULL CHECK (lifecycle IN ('ACTIVE','SUPERSEDED')),
      applicability TEXT NOT NULL CHECK (applicability IN ('CURRENT','HISTORICAL','UNKNOWN')),
      valid_time_precision TEXT NOT NULL CHECK (valid_time_precision IN ('UNKNOWN','INSTANT','CALENDAR_DATE','CALENDAR_MONTH')),
      valid_time_value TEXT,
      valid_time_end_exclusive TEXT,
      revision INTEGER NOT NULL CHECK (revision > 0),
      replaces_assertion_id TEXT,
      reconsidered_decision_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      CHECK (
        (subject_kind='LOCAL_USER' AND subject_key='LOCAL_USER' AND contact_id IS NULL) OR
        (subject_kind='CONTACT' AND subject_key=contact_id AND contact_id IS NOT NULL)
      ),
      CHECK (
        (valid_time_precision='UNKNOWN' AND valid_time_value IS NULL AND valid_time_end_exclusive IS NULL) OR
        (valid_time_precision<>'UNKNOWN' AND valid_time_value IS NOT NULL)
      ),
      UNIQUE(context_id, id),
      FOREIGN KEY(context_id, contact_id) REFERENCES contact(context_id, id) ON DELETE CASCADE,
      FOREIGN KEY(replaces_assertion_id) REFERENCES memory_assertion(id) ON DELETE SET NULL,
      FOREIGN KEY(reconsidered_decision_id) REFERENCES memory_decision(id) ON DELETE SET NULL
    );
    CREATE TABLE memory_evidence (
      id TEXT PRIMARY KEY,
      context_id TEXT NOT NULL,
      subject_kind TEXT NOT NULL CHECK (subject_kind IN ('LOCAL_USER','CONTACT')),
      subject_key TEXT NOT NULL,
      contact_id TEXT,
      predicate TEXT NOT NULL CHECK (predicate = 'REPLY_LENGTH_PREFERENCE'),
      preference_value TEXT NOT NULL CHECK (preference_value IN ('CONCISE','BALANCED','DETAILED')),
      source TEXT NOT NULL CHECK (source IN ('USER_SETTING','LEGACY_SETTING_MIGRATION','SYNTHETIC_FIXTURE')),
      source_reference TEXT NOT NULL,
      source_time_precision TEXT NOT NULL CHECK (source_time_precision IN ('UNKNOWN','INSTANT','CALENDAR_DATE','CALENDAR_MONTH')),
      source_time_value TEXT,
      source_time_end_exclusive TEXT,
      confidence_extraction REAL,
      confidence_attribution REAL,
      confidence_predicate REAL,
      association_id TEXT,
      association_revision INTEGER,
      recorded_at TEXT NOT NULL,
      CHECK (
        (subject_kind='LOCAL_USER' AND subject_key='LOCAL_USER' AND contact_id IS NULL) OR
        (subject_kind='CONTACT' AND subject_key=contact_id AND contact_id IS NOT NULL)
      ),
      CHECK (
        (source_time_precision='UNKNOWN' AND source_time_value IS NULL AND source_time_end_exclusive IS NULL) OR
        (source_time_precision<>'UNKNOWN' AND source_time_value IS NOT NULL)
      ),
      CHECK (
        (association_id IS NULL AND association_revision IS NULL) OR
        (association_id IS NOT NULL AND association_revision > 0)
      ),
      UNIQUE(context_id, id),
      UNIQUE(context_id, source, source_reference),
      FOREIGN KEY(context_id, contact_id) REFERENCES contact(context_id, id) ON DELETE CASCADE,
      FOREIGN KEY(context_id, association_id) REFERENCES identity_association(context_id, id) ON DELETE CASCADE
    );
    CREATE TABLE assertion_evidence_link (
      context_id TEXT NOT NULL,
      assertion_id TEXT NOT NULL,
      evidence_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('SUPPORTS','CONTRADICTS','CONTEXTUALIZES')),
      created_at TEXT NOT NULL,
      PRIMARY KEY(context_id, assertion_id, evidence_id),
      FOREIGN KEY(context_id, assertion_id) REFERENCES memory_assertion(context_id, id) ON DELETE CASCADE,
      FOREIGN KEY(context_id, evidence_id) REFERENCES memory_evidence(context_id, id) ON DELETE CASCADE
    );
    CREATE TABLE memory_decision (
      id TEXT PRIMARY KEY,
      context_id TEXT NOT NULL,
      assertion_id TEXT NOT NULL,
      assertion_revision INTEGER NOT NULL CHECK (assertion_revision > 0),
      operation TEXT NOT NULL CHECK (operation IN ('CONFIRM','REJECT','REPLACE','RECONSIDER')),
      authority TEXT NOT NULL CHECK (authority IN ('USER_SETTING','TRUSTED_USER_DECISION','LEGACY_MIGRATION','SYNTHETIC_FIXTURE')),
      replacement_assertion_id TEXT,
      reconsidered_decision_id TEXT,
      created_at TEXT NOT NULL,
      UNIQUE(context_id, id),
      FOREIGN KEY(context_id, assertion_id) REFERENCES memory_assertion(context_id, id) ON DELETE CASCADE,
      FOREIGN KEY(replacement_assertion_id) REFERENCES memory_assertion(id) ON DELETE SET NULL,
      FOREIGN KEY(reconsidered_decision_id) REFERENCES memory_decision(id) ON DELETE SET NULL
    );
    CREATE TRIGGER assertion_reference_context_insert
      BEFORE INSERT ON memory_assertion
      WHEN (NEW.replaces_assertion_id IS NOT NULL AND NOT EXISTS(
        SELECT 1 FROM memory_assertion WHERE context_id=NEW.context_id AND id=NEW.replaces_assertion_id
      )) OR (NEW.reconsidered_decision_id IS NOT NULL AND NOT EXISTS(
        SELECT 1 FROM memory_decision WHERE context_id=NEW.context_id AND id=NEW.reconsidered_decision_id
      ))
      BEGIN SELECT RAISE(ABORT,'invalid assertion reference'); END;
    CREATE TRIGGER decision_reference_context_insert
      BEFORE INSERT ON memory_decision
      WHEN (NEW.replacement_assertion_id IS NOT NULL AND NOT EXISTS(
        SELECT 1 FROM memory_assertion WHERE context_id=NEW.context_id AND id=NEW.replacement_assertion_id
      )) OR (NEW.reconsidered_decision_id IS NOT NULL AND NOT EXISTS(
        SELECT 1 FROM memory_decision WHERE context_id=NEW.context_id AND id=NEW.reconsidered_decision_id
      ))
      BEGIN SELECT RAISE(ABORT,'invalid decision reference'); END;
    CREATE INDEX assertion_page_order ON memory_assertion(context_id, id);
    CREATE INDEX evidence_page_order ON memory_evidence(context_id, id);
    CREATE INDEX link_page_order ON assertion_evidence_link(context_id, assertion_id, evidence_id);
    CREATE INDEX decision_page_order ON memory_decision(context_id, id);
    CREATE INDEX assertion_subject_history ON memory_assertion(context_id, subject_key, predicate, created_at);
    CREATE INDEX evidence_association_dependency ON memory_evidence(context_id, association_id, association_revision);
    CREATE UNIQUE INDEX one_current_confirmed_assertion
      ON memory_assertion(context_id, subject_key, predicate)
      WHERE acceptance='CONFIRMED' AND lifecycle='ACTIVE' AND applicability='CURRENT';
  `);
}

async function context(database: MemoryDatabase): Promise<MemoryContext> {
  const row = await database.get(
    "SELECT context_id,generation,memory_revision FROM local_context WHERE singleton=1",
  );
  if (!row) throw new MemoryInvalid();
  return {
    contextId: String(row.context_id),
    generation: String(row.generation),
    memoryRevision: Number(row.memory_revision),
  };
}

function expected(current: MemoryContext, request: MemoryAssertionRequest): void {
  if (
    request.generation !== current.generation ||
    request.memoryRevision !== current.memoryRevision
  )
    throw new MemoryConflict();
}

const optional = (value: unknown): string | null => (typeof value === "string" ? value : null);
const subjectFromRow = (row: Record<string, unknown>): MemorySubject =>
  row.subject_kind === "CONTACT"
    ? { kind: "CONTACT", contactId: String(row.contact_id) }
    : { kind: "LOCAL_USER" };
const temporalFromRow = (precision: unknown, value: unknown, endExclusive: unknown) =>
  precision === "UNKNOWN"
    ? ({ precision: "UNKNOWN" } as const)
    : ({
        precision,
        value,
        ...(typeof endExclusive === "string" ? { endExclusive } : {}),
      } as {
        precision: "INSTANT" | "CALENDAR_DATE" | "CALENDAR_MONTH";
        value: string;
        endExclusive?: string;
      });

function assertion(row: Record<string, unknown>): MemoryAssertionRecord {
  return {
    recordType: "MEMORY_ASSERTION",
    id: String(row.id),
    subject: subjectFromRow(row),
    predicate: row.predicate as MemoryAssertionRecord["predicate"],
    value: relationshipValueFromRow(row) ?? (row.preference_value as MessageLengthPreference),
    relationship:
      row.predicate === "REPLY_LENGTH_PREFERENCE"
        ? null
        : {
            contextId: String(row.context_ref),
            episodeId: String(row.episode_id),
            validity: relationshipValidityFromRow(row),
          },
    acceptance: row.acceptance as MemoryAssertionRecord["acceptance"],
    lifecycle: row.lifecycle as MemoryAssertionRecord["lifecycle"],
    applicability: row.applicability as MemoryAssertionRecord["applicability"],
    validTime: temporalFromRow(
      row.valid_time_precision,
      row.valid_time_value,
      row.valid_time_end_exclusive,
    ),
    revision: Number(row.revision),
    replacesAssertionId: optional(row.replaces_assertion_id),
    reconsideredDecisionId: optional(row.reconsidered_decision_id),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function evidence(row: Record<string, unknown>): MemoryEvidenceRecord {
  return {
    recordType: "MEMORY_EVIDENCE",
    id: String(row.id),
    subject: subjectFromRow(row),
    predicate: row.predicate as MemoryEvidenceRecord["predicate"],
    value: relationshipValueFromRow(row) ?? (row.preference_value as MessageLengthPreference),
    relationship:
      row.predicate === "REPLY_LENGTH_PREFERENCE"
        ? null
        : {
            contextId: String(row.context_ref),
            episodeId: String(row.episode_id),
            polarity: row.polarity as "POSITIVE" | "NEGATIVE",
          },
    source: row.source as MemoryEvidenceRecord["source"],
    sourceReference: String(row.source_reference),
    sourceTime: temporalFromRow(
      row.source_time_precision,
      row.source_time_value,
      row.source_time_end_exclusive,
    ),
    confidence: {
      extraction: typeof row.confidence_extraction === "number" ? row.confidence_extraction : null,
      attribution:
        typeof row.confidence_attribution === "number" ? row.confidence_attribution : null,
      predicate: typeof row.confidence_predicate === "number" ? row.confidence_predicate : null,
    },
    association:
      typeof row.association_id === "string"
        ? {
            associationId: row.association_id,
            associationRevision: Number(row.association_revision),
          }
        : null,
    recordedAt: String(row.recorded_at),
  };
}

function link(row: Record<string, unknown>): MemoryEvidenceLinkRecord {
  return {
    recordType: "MEMORY_EVIDENCE_LINK",
    assertionId: String(row.assertion_id),
    evidenceId: String(row.evidence_id),
    role: row.role as MemoryEvidenceRole,
    createdAt: String(row.created_at),
  };
}

function decision(row: Record<string, unknown>): MemoryDecisionRecord {
  return {
    recordType: "MEMORY_DECISION",
    id: String(row.id),
    assertionId: String(row.assertion_id),
    assertionRevision: Number(row.assertion_revision),
    operation: row.operation as MemoryDecisionRecord["operation"],
    authority: row.authority as MemoryDecisionRecord["authority"],
    replacementAssertionId: optional(row.replacement_assertion_id),
    reconsideredDecisionId: optional(row.reconsidered_decision_id),
    relationshipReach: (row.reach as "CURRENT" | "INTERVAL" | "ALL_HISTORY" | null) ?? null,
    relationshipInterval: row.reach === "INTERVAL" ? relationshipValidityFromRow(row) : null,
    createdAt: String(row.created_at),
  };
}

function relationshipValueFromRow(row: Record<string, unknown>): RelationshipValue | null {
  if (row.predicate === "RELATIONSHIP_CATEGORY")
    return {
      predicate: "RELATIONSHIP_CATEGORY",
      category: row.category as "PROFESSIONAL" | "PERSONAL",
      direction: "SYMMETRIC",
    };
  if (row.predicate === "RELATIONSHIP_ROLE")
    return {
      predicate: "RELATIONSHIP_ROLE",
      role: row.role as Extract<RelationshipValue, { predicate: "RELATIONSHIP_ROLE" }>["role"],
      direction: row.direction as "LOCAL_USER" | "CONTACT" | "SYMMETRIC",
    };
  return null;
}

function relationshipValidityFromRow(row: Record<string, unknown>): RelationshipValidity {
  const start =
    row.start_precision === "UNKNOWN"
      ? { precision: "UNKNOWN" as const }
      : { precision: row.start_precision, value: row.start_value };
  const end =
    row.end_certainty === "UNKNOWN"
      ? { certainty: "UNKNOWN" as const, bound: { precision: "UNKNOWN" as const } }
      : {
          certainty: row.end_certainty,
          bound: { precision: row.end_precision, value: row.end_value },
        };
  return { start, end } as RelationshipValidity;
}

function relationshipContext(row: Record<string, unknown>): RelationshipContextRecord {
  return {
    recordType: "RELATIONSHIP_CONTEXT",
    id: String(row.id),
    contactId: String(row.contact_id),
    kind: row.kind as RelationshipContextRecord["kind"],
    organizationLabel: optional(row.organization_label),
    projectLabel: optional(row.project_label),
    createdAt: String(row.created_at),
  };
}

async function requireContact(
  database: MemoryDatabase,
  contextId: string,
  subject: MemorySubject,
  contactRevision: number | null,
): Promise<void> {
  if (subject.kind === "LOCAL_USER") {
    if (contactRevision !== null) throw new MemoryInvalid();
    return;
  }
  const row = await database.get(
    "SELECT id FROM contact WHERE context_id=? AND id=? AND revision=?",
    contextId,
    subject.contactId,
    contactRevision,
  );
  if (!row) throw new MemoryConflict();
}

async function requireAssociation(
  database: MemoryDatabase,
  contextId: string,
  input: MemoryEvidenceInput,
): Promise<void> {
  if (!input.association) return;
  const row = await database.get(
    "SELECT id FROM identity_association WHERE context_id=? AND id=? AND revision=? AND status='CONFIRMED'",
    contextId,
    input.association.associationId,
    input.association.associationRevision,
  );
  if (!row) throw new MemoryConflict();
}

const subjectColumns = (subject: MemorySubject) =>
  subject.kind === "CONTACT"
    ? ["CONTACT", subject.contactId, subject.contactId]
    : ["LOCAL_USER", "LOCAL_USER", null];

async function requireVersionCapacity(
  database: MemoryDatabase,
  contextId: string,
  subject: MemorySubject,
): Promise<void> {
  const [, subjectKey] = subjectColumns(subject);
  const row = await database.get(
    "SELECT COUNT(*) AS count FROM memory_assertion WHERE context_id=? AND subject_key=? AND predicate='REPLY_LENGTH_PREFERENCE'",
    contextId,
    subjectKey,
  );
  if (Number(row?.count) >= MEMORY_ASSERTION_VERSION_LIMIT) throw new MemoryInvalid();
}

async function insertAssertion(
  database: MemoryDatabase,
  contextId: string,
  values: {
    subject: MemorySubject;
    value: MessageLengthPreference;
    acceptance: MemoryAssertionRecord["acceptance"];
    applicability: MemoryAssertionRecord["applicability"];
    validTime: MemoryAssertionRecord["validTime"];
    replacesAssertionId?: string;
    reconsideredDecisionId?: string;
    now: string;
  },
): Promise<MemoryAssertionRecord> {
  await requireVersionCapacity(database, contextId, values.subject);
  const id = randomUUID();
  const [subjectKind, subjectKey, contactId] = subjectColumns(values.subject);
  await database.run(
    `INSERT INTO memory_assertion(
      id,context_id,subject_kind,subject_key,contact_id,predicate,preference_value,acceptance,
      lifecycle,applicability,valid_time_precision,valid_time_value,valid_time_end_exclusive,revision,replaces_assertion_id,
      reconsidered_decision_id,created_at,updated_at
    ) VALUES (?,?,?,?,?,'REPLY_LENGTH_PREFERENCE',?,?,'ACTIVE',?,?,?,?,?,?,?,?,?)`,
    id,
    contextId,
    subjectKind,
    subjectKey,
    contactId,
    values.value,
    values.acceptance,
    values.applicability,
    values.validTime.precision,
    "value" in values.validTime ? values.validTime.value : null,
    "endExclusive" in values.validTime ? (values.validTime.endExclusive ?? null) : null,
    1,
    values.replacesAssertionId ?? null,
    values.reconsideredDecisionId ?? null,
    values.now,
    values.now,
  );
  return assertion((await database.get("SELECT * FROM memory_assertion WHERE id=?", id))!);
}

async function insertOrFindEvidence(
  database: MemoryDatabase,
  contextId: string,
  subject: MemorySubject,
  value: MessageLengthPreference,
  input: MemoryEvidenceInput,
  now: string,
): Promise<MemoryEvidenceRecord> {
  const found = await database.get(
    "SELECT * FROM memory_evidence WHERE context_id=? AND source=? AND source_reference=?",
    contextId,
    input.source,
    input.sourceReference,
  );
  if (found) {
    const existing = evidence(found);
    if (
      JSON.stringify(existing.subject) !== JSON.stringify(subject) ||
      existing.value !== value ||
      JSON.stringify(existing.sourceTime) !== JSON.stringify(input.sourceTime) ||
      JSON.stringify(existing.confidence) !== JSON.stringify(input.confidence) ||
      JSON.stringify(existing.association) !== JSON.stringify(input.association)
    )
      throw new MemoryConflict();
    return existing;
  }
  await requireAssociation(database, contextId, input);
  const id = randomUUID();
  const [subjectKind, subjectKey, contactId] = subjectColumns(subject);
  await database.run(
    `INSERT INTO memory_evidence(
      id,context_id,subject_kind,subject_key,contact_id,predicate,preference_value,source,
      source_reference,source_time_precision,source_time_value,source_time_end_exclusive,confidence_extraction,
      confidence_attribution,confidence_predicate,association_id,association_revision,recorded_at
    ) VALUES (?,?,?,?,?,'REPLY_LENGTH_PREFERENCE',?,?,?,?,?,?,?,?,?,?,?,?)`,
    id,
    contextId,
    subjectKind,
    subjectKey,
    contactId,
    value,
    input.source,
    input.sourceReference,
    input.sourceTime.precision,
    "value" in input.sourceTime ? input.sourceTime.value : null,
    "endExclusive" in input.sourceTime ? (input.sourceTime.endExclusive ?? null) : null,
    input.confidence.extraction,
    input.confidence.attribution,
    input.confidence.predicate,
    input.association?.associationId ?? null,
    input.association?.associationRevision ?? null,
    now,
  );
  return evidence((await database.get("SELECT * FROM memory_evidence WHERE id=?", id))!);
}

async function linkEvidence(
  database: MemoryDatabase,
  contextId: string,
  assertionId: string,
  evidenceId: string,
  role: MemoryEvidenceRole,
  now: string,
): Promise<void> {
  const found = await database.get(
    "SELECT role FROM assertion_evidence_link WHERE context_id=? AND assertion_id=? AND evidence_id=?",
    contextId,
    assertionId,
    evidenceId,
  );
  if (found) {
    if (found.role !== role) throw new MemoryConflict();
    return;
  }
  const assertionCount = await database.get(
    "SELECT COUNT(*) AS count FROM assertion_evidence_link WHERE context_id=? AND assertion_id=?",
    contextId,
    assertionId,
  );
  const evidenceCount = await database.get(
    "SELECT COUNT(*) AS count FROM assertion_evidence_link WHERE context_id=? AND evidence_id=?",
    contextId,
    evidenceId,
  );
  if (
    Number(assertionCount?.count) >= MEMORY_EVIDENCE_LINK_LIMIT ||
    Number(evidenceCount?.count) >= MEMORY_EVIDENCE_LINK_LIMIT
  )
    throw new MemoryInvalid();
  await database.run(
    "INSERT INTO assertion_evidence_link(context_id,assertion_id,evidence_id,role,created_at) VALUES (?,?,?,?,?)",
    contextId,
    assertionId,
    evidenceId,
    role,
    now,
  );
}

async function insertDecision(
  database: MemoryDatabase,
  contextId: string,
  values: {
    assertionId: string;
    assertionRevision: number;
    operation: MemoryDecisionRecord["operation"];
    authority: MemoryDecisionRecord["authority"];
    replacementAssertionId?: string;
    reconsideredDecisionId?: string;
    now: string;
  },
): Promise<MemoryDecisionRecord> {
  const count = await database.get(
    "SELECT COUNT(*) AS count FROM memory_decision WHERE context_id=? AND assertion_id=?",
    contextId,
    values.assertionId,
  );
  if (Number(count?.count) >= MEMORY_DECISION_LIMIT) throw new MemoryInvalid();
  const id = randomUUID();
  await database.run(
    `INSERT INTO memory_decision(
      id,context_id,assertion_id,assertion_revision,operation,authority,replacement_assertion_id,
      reconsidered_decision_id,created_at
    ) VALUES (?,?,?,?,?,?,?,?,?)`,
    id,
    contextId,
    values.assertionId,
    values.assertionRevision,
    values.operation,
    values.authority,
    values.replacementAssertionId ?? null,
    values.reconsideredDecisionId ?? null,
    values.now,
  );
  return decision((await database.get("SELECT * FROM memory_decision WHERE id=?", id))!);
}

async function requireAssertion(
  database: MemoryDatabase,
  contextId: string,
  id: string,
  revision: number,
): Promise<MemoryAssertionRecord> {
  const row = await database.get(
    `SELECT a.*,s.context_ref,s.episode_id,s.category,s.role,s.direction,s.start_precision,s.start_value,
            s.end_certainty,s.end_precision,s.end_value
     FROM memory_assertion a LEFT JOIN relationship_assertion_scope s ON s.assertion_id=a.id
     WHERE a.context_id=? AND a.id=? AND a.revision=?`,
    contextId,
    id,
    revision,
  );
  if (!row) throw new MemoryConflict();
  return assertion(row);
}

async function currentRow(database: MemoryDatabase, id: string): Promise<MemoryAssertionRecord> {
  return assertion(
    (await database.get(
      `SELECT a.*,s.context_ref,s.episode_id,s.category,s.role,s.direction,s.start_precision,s.start_value,
            s.end_certainty,s.end_precision,s.end_value
     FROM memory_assertion a LEFT JOIN relationship_assertion_scope s ON s.assertion_id=a.id WHERE a.id=?`,
      id,
    ))!,
  );
}

async function supersedeRow(
  database: MemoryDatabase,
  current: MemoryAssertionRecord,
  now: string,
): Promise<MemoryAssertionRecord> {
  const next = supersede(current);
  if (!next) throw new MemoryConflict();
  await database.run(
    "UPDATE memory_assertion SET lifecycle=?,applicability=?,revision=revision+1,updated_at=? WHERE id=?",
    next.lifecycle,
    next.applicability,
    now,
    current.id,
  );
  return await currentRow(database, current.id);
}

export async function deleteUnsupported(
  database: MemoryDatabase,
  contextId: string,
): Promise<void> {
  // A scoped correction must survive loss of its former positive support, but
  // the unsupported proposition itself must no longer be accepted truth.
  await database.run(
    `UPDATE memory_assertion SET acceptance='REJECTED',applicability='UNKNOWN',
       revision=revision+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
     WHERE context_id=? AND predicate IN ('RELATIONSHIP_CATEGORY','RELATIONSHIP_ROLE')
       AND acceptance<>'REJECTED'
       AND EXISTS(SELECT 1 FROM memory_decision d JOIN relationship_decision_scope s
         ON s.decision_id=d.id WHERE d.assertion_id=memory_assertion.id
           AND d.operation IN ('REJECT','FACT_CORRECT'))
       AND NOT EXISTS(SELECT 1 FROM assertion_evidence_link l
         WHERE l.context_id=memory_assertion.context_id AND l.assertion_id=memory_assertion.id
           AND l.role='SUPPORTS')`,
    contextId,
  );
  await database.run(
    `DELETE FROM memory_assertion
     WHERE context_id=? AND NOT (
       predicate IN ('RELATIONSHIP_CATEGORY','RELATIONSHIP_ROLE') AND acceptance='REJECTED'
       AND EXISTS(SELECT 1 FROM memory_decision d JOIN relationship_decision_scope s
                  ON s.decision_id=d.id WHERE d.assertion_id=memory_assertion.id
                    AND d.operation IN ('REJECT','FACT_CORRECT'))
     ) AND NOT EXISTS (
       SELECT 1 FROM assertion_evidence_link l
       WHERE l.context_id=memory_assertion.context_id AND l.assertion_id=memory_assertion.id
         AND l.role='SUPPORTS'
     )`,
    contextId,
  );
  await database.run(
    `DELETE FROM memory_evidence
     WHERE context_id=? AND NOT EXISTS (
       SELECT 1 FROM assertion_evidence_link l
       WHERE l.context_id=memory_evidence.context_id AND l.evidence_id=memory_evidence.id
     )`,
    contextId,
  );
  await purgeUnreferencedRelationshipContexts(database, contextId);
}

async function temporalAssertionsForEvidence(
  database: MemoryDatabase,
  contextId: string,
  evidenceFilter: string,
  ...values: (string | number)[]
): Promise<string[]> {
  const rows = await database.all(
    `SELECT DISTINCT t.assertion_id FROM relationship_temporal_support t
     JOIN memory_evidence e ON e.context_id=t.context_id AND e.id=t.evidence_id
     WHERE t.context_id=? AND ${evidenceFilter}`,
    contextId,
    ...values,
  );
  return rows.map((row) => String(row.assertion_id));
}

async function reconcileTemporalAssertions(
  database: MemoryDatabase,
  contextId: string,
  assertionIds: string[],
): Promise<void> {
  for (const assertionId of assertionIds) {
    const surviving = await database.get(
      `SELECT end_certainty,end_precision,end_value FROM relationship_temporal_support
       WHERE context_id=? AND assertion_id=? ORDER BY sequence DESC LIMIT 1`,
      contextId,
      assertionId,
    );
    const found = await database.get(
      "SELECT 1 AS found FROM relationship_assertion_scope WHERE context_id=? AND assertion_id=?",
      contextId,
      assertionId,
    );
    if (!found) continue;
    await database.run(
      `UPDATE relationship_assertion_scope SET end_certainty=?,end_precision=?,end_value=?
       WHERE context_id=? AND assertion_id=?`,
      surviving?.end_certainty ?? "UNKNOWN",
      surviving?.end_precision ?? "UNKNOWN",
      surviving?.end_value ?? null,
      contextId,
      assertionId,
    );
    await database.run(
      `UPDATE memory_assertion SET applicability=?,revision=revision+1,
         updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE context_id=? AND id=?`,
      surviving ? "HISTORICAL" : "UNKNOWN",
      contextId,
      assertionId,
    );
  }
}

async function purgeUnreferencedRelationshipContexts(
  database: MemoryDatabase,
  contextId: string,
): Promise<void> {
  await database.run(
    `DELETE FROM relationship_context WHERE context_id=?
     AND NOT EXISTS(SELECT 1 FROM relationship_assertion_scope s WHERE s.context_ref=relationship_context.id)
     AND NOT EXISTS(SELECT 1 FROM relationship_evidence_scope s WHERE s.context_ref=relationship_context.id)`,
    contextId,
  );
}

export async function invalidateAssociationEvidence(
  database: MemoryDatabase,
  contextId: string,
  associationId: string,
  associationRevision: number,
): Promise<boolean> {
  const found = await database.get(
    "SELECT 1 AS found FROM memory_evidence WHERE context_id=? AND association_id=? AND association_revision=? LIMIT 1",
    contextId,
    associationId,
    associationRevision,
  );
  if (!found) return false;
  const temporalAssertions = await temporalAssertionsForEvidence(
    database,
    contextId,
    "e.association_id=? AND e.association_revision=?",
    associationId,
    associationRevision,
  );
  await database.run(
    "DELETE FROM memory_evidence WHERE context_id=? AND association_id=? AND association_revision=?",
    contextId,
    associationId,
    associationRevision,
  );
  await reconcileTemporalAssertions(database, contextId, temporalAssertions);
  await deleteUnsupported(database, contextId);
  return true;
}

export async function invalidateContactMemory(
  database: MemoryDatabase,
  contextId: string,
  contactId: string,
): Promise<boolean> {
  const found = await database.get(
    `SELECT 1 AS found FROM memory_assertion WHERE context_id=? AND contact_id=?
     UNION SELECT 1 FROM memory_evidence WHERE context_id=? AND contact_id=?
     UNION SELECT 1 FROM memory_evidence e JOIN identity_association a
       ON a.context_id=e.context_id AND a.id=e.association_id
       WHERE a.context_id=? AND a.contact_id=? LIMIT 1`,
    contextId,
    contactId,
    contextId,
    contactId,
    contextId,
    contactId,
  );
  if (!found) return false;
  await database.run(
    "DELETE FROM memory_assertion WHERE context_id=? AND contact_id=?",
    contextId,
    contactId,
  );
  await database.run(
    "DELETE FROM memory_evidence WHERE context_id=? AND contact_id=?",
    contextId,
    contactId,
  );
  await database.run(
    `DELETE FROM memory_evidence WHERE context_id=? AND association_id IN (
       SELECT id FROM identity_association WHERE context_id=? AND contact_id=?
     )`,
    contextId,
    contextId,
    contactId,
  );
  await deleteUnsupported(database, contextId);
  return true;
}

export async function invalidateIdentityMemory(
  database: MemoryDatabase,
  contextId: string,
  identityId: string,
): Promise<boolean> {
  const rows = await database.all(
    "SELECT id,revision FROM identity_association WHERE context_id=? AND identity_id=?",
    contextId,
    identityId,
  );
  let changed = false;
  for (const row of rows) {
    changed =
      (await invalidateAssociationEvidence(
        database,
        contextId,
        String(row.id),
        Number(row.revision),
      )) || changed;
  }
  return changed;
}

export async function migrateLegacyPreference(
  database: MemoryDatabase,
  contextId: string,
): Promise<void> {
  const row = await database.get(
    "SELECT preference_value,created_at,updated_at FROM explicit_preference WHERE preference_key='messageLength'",
  );
  if (!row) return;
  const now = new Date().toISOString();
  const value = row.preference_value as MessageLengthPreference;
  const createdAt = String(row.created_at);
  const updatedAt = String(row.updated_at);
  const record = await insertAssertion(database, contextId, {
    subject: { kind: "LOCAL_USER" },
    value,
    acceptance: "CONFIRMED",
    applicability: "CURRENT",
    validTime: { precision: "INSTANT", value: updatedAt },
    now: createdAt,
  });
  if (updatedAt !== createdAt) {
    await database.run("UPDATE memory_assertion SET updated_at=? WHERE id=?", updatedAt, record.id);
  }
  const item = await insertOrFindEvidence(
    database,
    contextId,
    { kind: "LOCAL_USER" },
    value,
    {
      source: "LEGACY_SETTING_MIGRATION",
      sourceReference: "messageLength-v3",
      sourceTime: { precision: "INSTANT", value: updatedAt },
      confidence: { extraction: null, attribution: null, predicate: null },
      association: null,
    },
    now,
  );
  await linkEvidence(database, contextId, record.id, item.id, "SUPPORTS", now);
  await insertDecision(database, contextId, {
    assertionId: record.id,
    assertionRevision: record.revision,
    operation: "CONFIRM",
    authority: "LEGACY_MIGRATION",
    now,
  });
}

export async function readPreferenceProjection(database: MemoryDatabase): Promise<{
  value: MessageLengthPreference;
  source: "USER_SETTING" | "LEGACY_SETTING_MIGRATION";
  createdAt: string;
  updatedAt: string;
} | null> {
  const row = await database.get(`
    SELECT a.preference_value,a.created_at,a.updated_at,e.source
    FROM memory_assertion a
    JOIN assertion_evidence_link l ON l.context_id=a.context_id AND l.assertion_id=a.id
    JOIN memory_evidence e ON e.context_id=l.context_id AND e.id=l.evidence_id
    WHERE a.subject_kind='LOCAL_USER' AND a.predicate='REPLY_LENGTH_PREFERENCE'
      AND a.acceptance='CONFIRMED' AND a.lifecycle='ACTIVE' AND a.applicability='CURRENT'
      AND l.role='SUPPORTS'
    ORDER BY e.recorded_at DESC,e.id DESC LIMIT 1
  `);
  return row
    ? {
        value: row.preference_value as MessageLengthPreference,
        source:
          row.source === "LEGACY_SETTING_MIGRATION" ? "LEGACY_SETTING_MIGRATION" : "USER_SETTING",
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
      }
    : null;
}

export async function savePreference(
  database: MemoryDatabase,
  contextId: string,
  value: MessageLengthPreference,
): Promise<boolean> {
  const existingRow = await database.get(
    `
    SELECT * FROM memory_assertion WHERE context_id=? AND subject_key='LOCAL_USER'
      AND predicate='REPLY_LENGTH_PREFERENCE' AND acceptance='CONFIRMED'
      AND lifecycle='ACTIVE' AND applicability='CURRENT'
  `,
    contextId,
  );
  const existing = existingRow ? assertion(existingRow) : undefined;
  if (existing?.value === value) return false;
  const now = new Date().toISOString();
  if (existing) await supersedeRow(database, existing, now);
  const created = await insertAssertion(database, contextId, {
    subject: { kind: "LOCAL_USER" },
    value,
    acceptance: "CONFIRMED",
    applicability: "CURRENT",
    validTime: { precision: "INSTANT", value: now },
    ...(existing ? { replacesAssertionId: existing.id } : {}),
    now,
  });
  const item = await insertOrFindEvidence(
    database,
    contextId,
    created.subject,
    value,
    {
      source: "USER_SETTING",
      sourceReference: randomUUID(),
      sourceTime: { precision: "INSTANT", value: now },
      confidence: { extraction: null, attribution: null, predicate: null },
      association: null,
    },
    now,
  );
  await linkEvidence(database, contextId, created.id, item.id, "SUPPORTS", now);
  await insertDecision(
    database,
    contextId,
    existing
      ? {
          assertionId: existing.id,
          assertionRevision: existing.revision + 1,
          operation: "REPLACE",
          authority: "USER_SETTING",
          replacementAssertionId: created.id,
          now,
        }
      : {
          assertionId: created.id,
          assertionRevision: created.revision,
          operation: "CONFIRM",
          authority: "USER_SETTING",
          now,
        },
  );
  return true;
}

export async function deletePreference(database: MemoryDatabase, contextId: string): Promise<void> {
  await database.run(
    "DELETE FROM memory_assertion WHERE context_id=? AND subject_key='LOCAL_USER' AND predicate='REPLY_LENGTH_PREFERENCE'",
    contextId,
  );
  await deleteUnsupported(database, contextId);
}

interface CursorValue {
  generation: string;
  memoryRevision: number;
  recordType: MemoryInspectorRecordType;
  lastId: string;
  filter: MemoryPageFilter | null;
}
const encodeCursor = (value: CursorValue) =>
  Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
function decodeCursor(value: string | null | undefined): CursorValue | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as CursorValue;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Object.keys(parsed).sort().join(",") !==
        "filter,generation,lastId,memoryRevision,recordType" ||
      typeof parsed.generation !== "string" ||
      typeof parsed.memoryRevision !== "number" ||
      typeof parsed.lastId !== "string" ||
      ![
        "MEMORY_ASSERTION",
        "MEMORY_EVIDENCE",
        "MEMORY_EVIDENCE_LINK",
        "MEMORY_DECISION",
        "RELATIONSHIP_CONTEXT",
      ].includes(parsed.recordType)
    )
      throw new Error();
    if (parsed.filter !== null && !MemoryPageFilterSchema.safeParse(parsed.filter).success)
      throw new Error();
    return parsed;
  } catch {
    throw new MemoryConflict();
  }
}

export async function listMemory(
  database: MemoryDatabase,
  request: Extract<MemoryAssertionRequest, { operation: "LIST" }>,
): Promise<MemoryAssertionResult> {
  try {
    const current = await context(database);
    expected(current, request);
    const cursor = decodeCursor(request.cursor);
    if (
      cursor &&
      (cursor.generation !== current.generation ||
        cursor.memoryRevision !== current.memoryRevision ||
        cursor.recordType !== request.recordType ||
        JSON.stringify(cursor.filter) !== JSON.stringify(request.filter))
    )
      throw new MemoryConflict();
    const lastId = cursor?.lastId ?? "";
    const config = {
      MEMORY_ASSERTION: [
        "memory_assertion a LEFT JOIN relationship_assertion_scope s ON s.assertion_id=a.id",
        "a.id",
        "a.*,s.context_ref,s.episode_id,s.category,s.role,s.direction,s.start_precision,s.start_value,s.end_certainty,s.end_precision,s.end_value",
        assertion,
      ],
      MEMORY_EVIDENCE: [
        "memory_evidence e LEFT JOIN relationship_evidence_scope s ON s.evidence_id=e.id",
        "e.id",
        "e.*,s.context_ref,s.episode_id,s.category,s.role,s.direction,s.polarity",
        evidence,
      ],
      MEMORY_EVIDENCE_LINK: [
        "assertion_evidence_link l JOIN memory_assertion a ON a.id=l.assertion_id LEFT JOIN relationship_assertion_scope s ON s.assertion_id=a.id",
        "l.assertion_id || ':' || l.evidence_id",
        "l.*",
        link,
      ],
      MEMORY_DECISION: [
        "memory_decision d JOIN memory_assertion a ON a.id=d.assertion_id LEFT JOIN relationship_assertion_scope rs ON rs.assertion_id=a.id LEFT JOIN relationship_decision_scope s ON s.decision_id=d.id",
        "d.id",
        "d.*,s.reach,s.start_precision,s.start_value,s.end_certainty,s.end_precision,s.end_value",
        decision,
      ],
      RELATIONSHIP_CONTEXT: ["relationship_context r", "r.id", "r.*", relationshipContext],
    }[request.recordType] as [
      string,
      string,
      string,
      (row: Record<string, unknown>) => MemoryInspectorRecord,
    ];
    const alias = {
      MEMORY_ASSERTION: "a",
      MEMORY_EVIDENCE: "e",
      MEMORY_EVIDENCE_LINK: "l",
      MEMORY_DECISION: "d",
      RELATIONSHIP_CONTEXT: "r",
    }[request.recordType];
    const conditions = [`${alias}.context_id=?`, `${config[1]}>?`];
    const values: unknown[] = [current.contextId, lastId];
    const filter = request.filter;
    const claimAlias =
      request.recordType === "MEMORY_ASSERTION"
        ? "a"
        : request.recordType === "MEMORY_EVIDENCE"
          ? "e"
          : request.recordType === "MEMORY_EVIDENCE_LINK" ||
              request.recordType === "MEMORY_DECISION"
            ? "a"
            : null;
    const scopeAlias = request.recordType === "MEMORY_DECISION" ? "rs" : "s";
    if (filter?.contactId) {
      conditions.push(`${claimAlias ?? "r"}.contact_id=?`);
      values.push(filter.contactId);
    }
    if (filter?.predicate) {
      if (!claimAlias) throw new MemoryInvalid();
      conditions.push(`${claimAlias}.predicate=?`);
      values.push(filter.predicate);
    }
    if (filter?.relationshipContextId) {
      conditions.push(`${claimAlias ? scopeAlias : "r"}.${claimAlias ? "context_ref" : "id"}=?`);
      values.push(filter.relationshipContextId);
    }
    const rows = await database.all(
      `SELECT ${config[2]},${config[1]} AS page_id FROM ${config[0]} WHERE ${conditions.join(" AND ")} ORDER BY ${config[1]} LIMIT ?`,
      ...values,
      request.limit + 1,
    );
    const mapped: MemoryInspectorRecord[] = [];
    for (const row of rows) {
      const record = config[3](row);
      if (
        record.recordType === "MEMORY_ASSERTION" &&
        record.relationship &&
        filter?.asOf &&
        record.subject.kind === "CONTACT" &&
        typeof record.value !== "string"
      ) {
        const correction = await relationshipCorrectionAt(
          database,
          current.contextId,
          record.subject.contactId,
          record.relationship.contextId,
          record.value,
          filter.asOf,
        );
        mapped.push({
          ...record,
          effectiveApplicability:
            record.acceptance === "REJECTED"
              ? "UNKNOWN"
              : correction === "HISTORICAL" &&
                  (record.acceptance !== "CONFIRMED" || record.applicability === "UNKNOWN")
                ? "UNKNOWN"
                : (correction ??
                  classifyRelationshipAt(
                    record.relationship.validity,
                    record.applicability,
                    filter.asOf,
                  )),
        });
      } else mapped.push(record);
    }
    let records = mapped.slice(0, request.limit);
    let hasMore = mapped.length > request.limit;
    for (;;) {
      const page = {
        kind: "PAGE" as const,
        generation: current.generation,
        memoryRevision: current.memoryRevision,
        recordType: request.recordType,
        records,
        nextCursor:
          hasMore && records.length > 0
            ? encodeCursor({
                generation: current.generation,
                memoryRevision: current.memoryRevision,
                recordType: request.recordType,
                lastId: String(rows[records.length - 1]?.page_id ?? ""),
                filter: filter ?? null,
              })
            : null,
      };
      if (
        Buffer.byteLength(JSON.stringify({ ok: true, result: page }), "utf8") <=
        MEMORY_ASSERTION_RESPONSE_BYTES
      )
        return MemoryAssertionResultSchema.parse({
          ok: true,
          result: MemoryPageSchema.parse(page),
        });
      if (records.length === 0) throw new MemoryInvalid();
      records = records.slice(0, -1);
      hasMore = true;
    }
  } catch (error) {
    return error instanceof MemoryConflict
      ? safeError("CONFLICT")
      : error instanceof MemoryInvalid
        ? safeError("INVALID_REQUEST")
        : safeError("STORE_UNAVAILABLE");
  }
}

const relationshipValueKey = (value: RelationshipValue) =>
  value.predicate === "RELATIONSHIP_CATEGORY" ? value.category : value.role;

async function resolveRelationshipContext(
  database: MemoryDatabase,
  contextId: string,
  contactId: string,
  selector: RelationshipClaim["context"],
  now: string,
): Promise<string> {
  if (selector.selection === "EXISTING") {
    const row = await database.get(
      "SELECT id FROM relationship_context WHERE context_id=? AND contact_id=? AND id=?",
      contextId,
      contactId,
      selector.contextId,
    );
    if (!row) throw new MemoryConflict();
    return selector.contextId;
  }
  const id = randomUUID();
  await database.run(
    `INSERT INTO relationship_context(id,context_id,contact_id,kind,organization_label,project_label,created_at)
     VALUES (?,?,?,?,?,?,?)`,
    id,
    contextId,
    contactId,
    selector.context.kind,
    selector.context.organizationLabel,
    selector.context.projectLabel,
    now,
  );
  return id;
}

async function requireRelationshipCapacity(
  database: MemoryDatabase,
  contextId: string,
  contactId: string,
  contextRef: string,
  episodeId: string,
  value: RelationshipValue,
): Promise<void> {
  const episode = await database.get(
    `SELECT 1 AS found FROM relationship_assertion_scope s
     JOIN memory_assertion a ON a.id=s.assertion_id WHERE a.context_id=? AND a.contact_id=? AND s.episode_id=? LIMIT 1`,
    contextId,
    contactId,
    episodeId,
  );
  if (!episode) {
    const count = await database.get(
      `SELECT COUNT(DISTINCT s.episode_id) AS count FROM relationship_assertion_scope s
       JOIN memory_assertion a ON a.id=s.assertion_id WHERE a.context_id=? AND a.contact_id=?`,
      contextId,
      contactId,
    );
    if (Number(count?.count) >= RELATIONSHIP_EPISODE_LIMIT) throw new MemoryInvalid();
  }
  const versions = await database.get(
    `SELECT COUNT(*) AS count FROM relationship_assertion_scope s
     JOIN memory_assertion a ON a.id=s.assertion_id WHERE a.context_id=? AND a.contact_id=?
     AND s.context_ref=? AND s.episode_id=? AND a.predicate=?
     AND coalesce(s.category,s.role)=? AND s.direction=?`,
    contextId,
    contactId,
    contextRef,
    episodeId,
    value.predicate,
    relationshipValueKey(value),
    value.direction,
  );
  if (Number(versions?.count) >= MEMORY_ASSERTION_VERSION_LIMIT) throw new MemoryInvalid();
}

async function blockedByRelationshipCorrection(
  database: MemoryDatabase,
  contextId: string,
  contactId: string,
  contextRef: string,
  value: RelationshipValue,
  applicability: MemoryAssertionRecord["applicability"],
  validity: RelationshipValidity,
): Promise<boolean> {
  const rows = await database.all(
    `SELECT ds.reach,ds.start_precision,ds.start_value,ds.end_certainty,ds.end_precision,ds.end_value
     FROM memory_decision d
     JOIN relationship_decision_scope ds ON ds.decision_id=d.id
     JOIN memory_assertion a ON a.id=d.assertion_id
     JOIN relationship_assertion_scope s ON s.assertion_id=a.id
     WHERE d.context_id=? AND a.contact_id=? AND a.lifecycle='ACTIVE'
       AND d.operation IN ('REJECT','FACT_CORRECT') AND s.context_ref=? AND a.predicate=?
       AND coalesce(s.category,s.role)=? AND s.direction=?
       AND NOT EXISTS(SELECT 1 FROM memory_decision r WHERE r.reconsidered_decision_id=d.id
                      AND r.operation='RECONSIDER') LIMIT 101`,
    contextId,
    contactId,
    contextRef,
    value.predicate,
    relationshipValueKey(value),
    value.direction,
  );
  if (rows.length > 100) return true;
  return rows.some(
    (row) =>
      row.reach === "ALL_HISTORY" ||
      (row.reach === "CURRENT" && applicability !== "HISTORICAL") ||
      (row.reach === "INTERVAL" &&
        relationshipIntervalsMayOverlap(validity, relationshipValidityFromRow(row))),
  );
}

async function relationshipCorrectionAt(
  database: MemoryDatabase,
  contextId: string,
  contactId: string,
  contextRef: string,
  value: RelationshipValue,
  asOf: string,
): Promise<"HISTORICAL" | "UNKNOWN" | null> {
  const at = Date.parse(asOf);
  if (!Number.isFinite(at)) return "UNKNOWN";
  const rows = await database.all(
    `SELECT d.created_at,ds.reach,ds.start_precision,ds.start_value,
            ds.end_certainty,ds.end_precision,ds.end_value
     FROM memory_decision d JOIN relationship_decision_scope ds ON ds.decision_id=d.id
     JOIN memory_assertion a ON a.id=d.assertion_id
     JOIN relationship_assertion_scope s ON s.assertion_id=a.id
     WHERE d.context_id=? AND a.contact_id=? AND a.lifecycle='ACTIVE'
       AND d.operation IN ('REJECT','FACT_CORRECT') AND s.context_ref=? AND a.predicate=?
       AND coalesce(s.category,s.role)=? AND s.direction=?
       AND NOT EXISTS(SELECT 1 FROM memory_decision r WHERE r.reconsidered_decision_id=d.id
                      AND r.operation='RECONSIDER') LIMIT 101`,
    contextId,
    contactId,
    contextRef,
    value.predicate,
    relationshipValueKey(value),
    value.direction,
  );
  if (rows.length > 100) return "UNKNOWN";
  let currentRejected = false;
  if (!Number.isFinite(new Date(at + 1).getTime())) return "UNKNOWN";
  const instant = new Date(at).toISOString();
  const oneMillisecondLater = new Date(at + 1).toISOString();
  const queryInterval: RelationshipValidity = {
    start: { precision: "INSTANT", value: instant },
    end: { certainty: "EXACT", bound: { precision: "INSTANT", value: oneMillisecondLater } },
  };
  for (const row of rows) {
    if (row.reach === "ALL_HISTORY") return "UNKNOWN";
    if (
      row.reach === "INTERVAL" &&
      relationshipIntervalsMayOverlap(queryInterval, relationshipValidityFromRow(row))
    )
      return "UNKNOWN";
    if (row.reach === "CURRENT" && at >= Date.parse(String(row.created_at))) currentRejected = true;
  }
  return currentRejected ? "HISTORICAL" : null;
}

async function insertRelationshipAssertion(
  database: MemoryDatabase,
  contextId: string,
  values: {
    contactId: string;
    contextRef: string;
    episodeId: string;
    value: RelationshipValue;
    validity: RelationshipValidity;
    acceptance: MemoryAssertionRecord["acceptance"];
    applicability: MemoryAssertionRecord["applicability"];
    replacesAssertionId?: string;
    reconsideredDecisionId?: string;
    now: string;
  },
): Promise<MemoryAssertionRecord> {
  await requireRelationshipCapacity(
    database,
    contextId,
    values.contactId,
    values.contextRef,
    values.episodeId,
    values.value,
  );
  if (values.acceptance === "CONFIRMED") {
    const accepted = await database.get(
      `SELECT 1 AS found FROM relationship_assertion_scope s JOIN memory_assertion a ON a.id=s.assertion_id
       WHERE a.context_id=? AND a.contact_id=? AND s.context_ref=? AND s.episode_id=?
         AND a.predicate=? AND coalesce(s.category,s.role)=? AND s.direction=?
         AND a.acceptance='CONFIRMED' AND a.lifecycle='ACTIVE' LIMIT 1`,
      contextId,
      values.contactId,
      values.contextRef,
      values.episodeId,
      values.value.predicate,
      relationshipValueKey(values.value),
      values.value.direction,
    );
    if (accepted) throw new MemoryConflict();
  }
  const id = randomUUID();
  await database.run(
    `INSERT INTO memory_assertion(
       id,context_id,subject_kind,subject_key,contact_id,predicate,preference_value,acceptance,
       lifecycle,applicability,valid_time_precision,valid_time_value,valid_time_end_exclusive,
       revision,replaces_assertion_id,reconsidered_decision_id,created_at,updated_at)
     VALUES (?,?,?,?,?,?,NULL,?,'ACTIVE',?,'UNKNOWN',NULL,NULL,1,?,?,?,?)`,
    id,
    contextId,
    "CONTACT",
    values.contactId,
    values.contactId,
    values.value.predicate,
    values.acceptance,
    values.applicability,
    values.replacesAssertionId ?? null,
    values.reconsideredDecisionId ?? null,
    values.now,
    values.now,
  );
  const end = values.validity.end;
  await database.run(
    `INSERT INTO relationship_assertion_scope(
       assertion_id,context_id,contact_id,context_ref,episode_id,category,role,direction,
       start_precision,start_value,end_certainty,end_precision,end_value)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    id,
    contextId,
    values.contactId,
    values.contextRef,
    values.episodeId,
    values.value.predicate === "RELATIONSHIP_CATEGORY" ? values.value.category : null,
    values.value.predicate === "RELATIONSHIP_ROLE" ? values.value.role : null,
    values.value.direction,
    values.validity.start.precision,
    "value" in values.validity.start ? values.validity.start.value : null,
    end.certainty,
    end.bound.precision,
    "value" in end.bound ? end.bound.value : null,
  );
  return await currentRow(database, id);
}

async function insertRelationshipEvidence(
  database: MemoryDatabase,
  contextId: string,
  values: {
    contactId: string;
    contextRef: string;
    episodeId: string;
    value: RelationshipValue;
    polarity: "POSITIVE" | "NEGATIVE";
    input: MemoryEvidenceInput;
    now: string;
  },
): Promise<MemoryEvidenceRecord> {
  if (values.input.source !== "SYNTHETIC_FIXTURE") throw new MemoryInvalid();
  const found = await database.get(
    `SELECT e.*,s.context_ref,s.episode_id,s.category,s.role,s.direction,s.polarity
     FROM memory_evidence e LEFT JOIN relationship_evidence_scope s ON s.evidence_id=e.id
     WHERE e.context_id=? AND e.source=? AND e.source_reference=?`,
    contextId,
    values.input.source,
    values.input.sourceReference,
  );
  if (found) {
    const existing = evidence(found);
    if (
      JSON.stringify(existing.value) !== JSON.stringify(values.value) ||
      existing.subject.kind !== "CONTACT" ||
      existing.subject.contactId !== values.contactId ||
      existing.relationship?.contextId !== values.contextRef ||
      existing.relationship.episodeId !== values.episodeId ||
      existing.relationship.polarity !== values.polarity ||
      JSON.stringify(existing.sourceTime) !== JSON.stringify(values.input.sourceTime) ||
      JSON.stringify(existing.confidence) !== JSON.stringify(values.input.confidence) ||
      JSON.stringify(existing.association) !== JSON.stringify(values.input.association)
    )
      throw new MemoryConflict();
    return existing;
  }
  if (values.input.association) {
    const associated = await database.get(
      `SELECT id FROM identity_association WHERE context_id=? AND id=? AND revision=?
       AND status='CONFIRMED' AND contact_id=?`,
      contextId,
      values.input.association.associationId,
      values.input.association.associationRevision,
      values.contactId,
    );
    if (!associated) throw new MemoryConflict();
  }
  const id = randomUUID();
  const input = values.input;
  await database.run(
    `INSERT INTO memory_evidence(
       id,context_id,subject_kind,subject_key,contact_id,predicate,preference_value,source,
       source_reference,source_time_precision,source_time_value,source_time_end_exclusive,
       confidence_extraction,confidence_attribution,confidence_predicate,association_id,
       association_revision,recorded_at)
     VALUES (?,?,?,?,?,?,NULL,?,?,?,?,?,?,?,?,?,?,?)`,
    id,
    contextId,
    "CONTACT",
    values.contactId,
    values.contactId,
    values.value.predicate,
    input.source,
    input.sourceReference,
    input.sourceTime.precision,
    "value" in input.sourceTime ? input.sourceTime.value : null,
    "endExclusive" in input.sourceTime ? (input.sourceTime.endExclusive ?? null) : null,
    input.confidence.extraction,
    input.confidence.attribution,
    input.confidence.predicate,
    input.association?.associationId ?? null,
    input.association?.associationRevision ?? null,
    values.now,
  );
  await database.run(
    `INSERT INTO relationship_evidence_scope(
       evidence_id,context_id,contact_id,context_ref,episode_id,category,role,direction,polarity)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    id,
    contextId,
    values.contactId,
    values.contextRef,
    values.episodeId,
    values.value.predicate === "RELATIONSHIP_CATEGORY" ? values.value.category : null,
    values.value.predicate === "RELATIONSHIP_ROLE" ? values.value.role : null,
    values.value.direction,
    values.polarity,
  );
  return evidence(
    (await database.get(
      `SELECT e.*,s.context_ref,s.episode_id,s.category,s.role,s.direction,s.polarity
     FROM memory_evidence e JOIN relationship_evidence_scope s ON s.evidence_id=e.id WHERE e.id=?`,
      id,
    ))!,
  );
}

async function insertRelationshipDecision(
  database: MemoryDatabase,
  contextId: string,
  values: Parameters<typeof insertDecision>[2] & {
    reach?: "CURRENT" | "INTERVAL" | "ALL_HISTORY";
    correctionInterval?: RelationshipValidity | null;
  },
): Promise<MemoryDecisionRecord> {
  const created = await insertDecision(database, contextId, values);
  if (values.reach) {
    const interval = values.correctionInterval;
    await database.run(
      `INSERT INTO relationship_decision_scope(
         decision_id,reach,start_precision,start_value,end_certainty,end_precision,end_value)
       VALUES (?,?,?,?,?,?,?)`,
      created.id,
      values.reach,
      interval?.start.precision ?? "UNKNOWN",
      interval?.start && "value" in interval.start ? interval.start.value : null,
      interval?.end.certainty ?? "UNKNOWN",
      interval?.end.bound.precision ?? "UNKNOWN",
      interval?.end.bound && "value" in interval.end.bound ? interval.end.bound.value : null,
    );
    return { ...created, relationshipReach: values.reach, relationshipInterval: interval ?? null };
  }
  return created;
}

type RelationshipMutationRequest = Extract<
  MemoryAssertionRequest,
  {
    operation:
      | "PROPOSE_RELATIONSHIP"
      | "ADD_RELATIONSHIP_EVIDENCE"
      | "DECIDE_RELATIONSHIP"
      | "TRANSITION_RELATIONSHIP"
      | "CORRECT_RELATIONSHIP"
      | "RECONSIDER_RELATIONSHIP";
  }
>;

async function applyRelationshipMutation(
  database: MemoryDatabase,
  current: MemoryContext,
  request: RelationshipMutationRequest,
  changed: MemoryMutation,
  now: string,
): Promise<void> {
  if (request.operation === "PROPOSE_RELATIONSHIP") {
    const contact = { kind: "CONTACT" as const, contactId: request.contactId };
    await requireContact(database, current.contextId, contact, request.contactRevision);
    const contextRef = await resolveRelationshipContext(
      database,
      current.contextId,
      request.contactId,
      request.context,
      now,
    );
    const episodeId = request.episodeId ?? randomUUID();
    if (
      await blockedByRelationshipCorrection(
        database,
        current.contextId,
        request.contactId,
        contextRef,
        request.value,
        request.applicability,
        request.validity,
      )
    )
      throw new MemoryConflict();
    const same = await database.get(
      `SELECT a.*,s.context_ref,s.episode_id,s.category,s.role,s.direction,s.start_precision,s.start_value,
              s.end_certainty,s.end_precision,s.end_value
       FROM memory_assertion a JOIN relationship_assertion_scope s ON s.assertion_id=a.id
       WHERE a.context_id=? AND a.contact_id=? AND s.context_ref=? AND s.episode_id=?
         AND a.predicate=? AND coalesce(s.category,s.role)=? AND s.direction=? AND a.lifecycle='ACTIVE'
       ORDER BY a.created_at DESC,a.id DESC LIMIT 1`,
      current.contextId,
      request.contactId,
      contextRef,
      episodeId,
      request.value.predicate,
      relationshipValueKey(request.value),
      request.value.direction,
    );
    const target = same
      ? assertion(same)
      : await insertRelationshipAssertion(database, current.contextId, {
          contactId: request.contactId,
          contextRef,
          episodeId,
          value: request.value,
          validity: request.validity,
          acceptance: "CANDIDATE",
          applicability: request.applicability,
          now,
        });
    if (
      same &&
      (JSON.stringify(target.relationship?.validity) !== JSON.stringify(request.validity) ||
        target.applicability !== request.applicability ||
        target.acceptance === "REJECTED")
    )
      throw new MemoryConflict();
    const item = await insertRelationshipEvidence(database, current.contextId, {
      contactId: request.contactId,
      contextRef,
      episodeId,
      value: request.value,
      polarity: "POSITIVE",
      input: request.evidence,
      now,
    });
    await linkEvidence(database, current.contextId, target.id, item.id, "SUPPORTS", now);
    changed.assertions.push(target);
    changed.evidence.push(item);
  } else if (request.operation === "ADD_RELATIONSHIP_EVIDENCE") {
    const target = await requireAssertion(
      database,
      current.contextId,
      request.assertionId,
      request.assertionRevision,
    );
    if (
      !target.relationship ||
      target.subject.kind !== "CONTACT" ||
      typeof target.value === "string" ||
      JSON.stringify(target.value) !== JSON.stringify(request.evidenceValue) ||
      (request.role === "SUPPORTS" && request.polarity !== "POSITIVE") ||
      (request.role === "CONTRADICTS" && request.polarity !== "NEGATIVE") ||
      (request.role === "CONTEXTUALIZES" && request.polarity !== "POSITIVE")
    )
      throw new MemoryInvalid();
    const item = await insertRelationshipEvidence(database, current.contextId, {
      contactId: target.subject.contactId,
      contextRef: target.relationship.contextId,
      episodeId: target.relationship.episodeId,
      value: request.evidenceValue,
      polarity: request.polarity,
      input: request.evidence,
      now,
    });
    await linkEvidence(database, current.contextId, target.id, item.id, request.role, now);
    if (request.role === "CONTRADICTS" && target.acceptance === "CONFIRMED") {
      await database.run(
        "UPDATE memory_assertion SET applicability='UNKNOWN',revision=revision+1,updated_at=? WHERE id=?",
        now,
        target.id,
      );
      changed.assertions.push(await currentRow(database, target.id));
    } else changed.assertions.push(target);
    changed.evidence.push(item);
  } else if (request.operation === "DECIDE_RELATIONSHIP") {
    const target = await requireAssertion(
      database,
      current.contextId,
      request.assertionId,
      request.assertionRevision,
    );
    if (
      !target.relationship ||
      target.subject.kind !== "CONTACT" ||
      typeof target.value === "string" ||
      target.lifecycle !== "ACTIVE"
    )
      throw new MemoryInvalid();
    if (request.decision === "CONFIRM") {
      if (target.acceptance !== "CANDIDATE") throw new MemoryConflict();
      const support = await database.get(
        "SELECT 1 AS found FROM assertion_evidence_link WHERE context_id=? AND assertion_id=? AND role='SUPPORTS' LIMIT 1",
        current.contextId,
        target.id,
      );
      if (!support) throw new MemoryConflict();
      const contradictory = await database.get(
        "SELECT 1 AS found FROM assertion_evidence_link WHERE context_id=? AND assertion_id=? AND role='CONTRADICTS' LIMIT 1",
        current.contextId,
        target.id,
      );
      if (
        contradictory ||
        (await blockedByRelationshipCorrection(
          database,
          current.contextId,
          target.subject.contactId,
          target.relationship.contextId,
          target.value,
          target.applicability,
          target.relationship.validity,
        ))
      )
        throw new MemoryConflict();
      const other = await database.get(
        `SELECT 1 AS found FROM memory_assertion a JOIN relationship_assertion_scope s ON s.assertion_id=a.id
         WHERE a.context_id=? AND a.contact_id=? AND s.context_ref=? AND s.episode_id=?
           AND a.predicate=? AND coalesce(s.category,s.role)=? AND s.direction=?
           AND a.acceptance='CONFIRMED' AND a.lifecycle='ACTIVE' AND a.id<>? LIMIT 1`,
        current.contextId,
        target.subject.contactId,
        target.relationship.contextId,
        target.relationship.episodeId,
        target.value.predicate,
        relationshipValueKey(target.value),
        target.value.direction,
        target.id,
      );
      if (other) throw new MemoryConflict();
    } else if (
      target.acceptance === "REJECTED" ||
      (request.reach === "CURRENT" &&
        target.acceptance === "CONFIRMED" &&
        target.applicability !== "CURRENT")
    )
      throw new MemoryConflict();
    const retainAcceptedHistory =
      request.decision === "REJECT" &&
      target.acceptance === "CONFIRMED" &&
      request.reach !== "ALL_HISTORY";
    await database.run(
      "UPDATE memory_assertion SET acceptance=?,applicability=?,revision=revision+1,updated_at=? WHERE id=?",
      request.decision === "CONFIRM" || retainAcceptedHistory ? "CONFIRMED" : "REJECTED",
      request.decision === "CONFIRM"
        ? target.applicability
        : retainAcceptedHistory && request.reach === "CURRENT"
          ? "HISTORICAL"
          : "UNKNOWN",
      now,
      target.id,
    );
    const updated = await currentRow(database, target.id);
    changed.assertions.push(updated);
    changed.decisions.push(
      await insertRelationshipDecision(database, current.contextId, {
        assertionId: updated.id,
        assertionRevision: updated.revision,
        operation: request.decision,
        authority: request.authority,
        ...(request.decision === "REJECT"
          ? { reach: request.reach, correctionInterval: request.correctionInterval }
          : {}),
        now,
      }),
    );
  } else if (request.operation === "TRANSITION_RELATIONSHIP") {
    const target = await requireAssertion(
      database,
      current.contextId,
      request.assertionId,
      request.assertionRevision,
    );
    if (
      !target.relationship ||
      target.subject.kind !== "CONTACT" ||
      typeof target.value === "string" ||
      target.acceptance === "REJECTED" ||
      target.lifecycle !== "ACTIVE"
    )
      throw new MemoryConflict();
    const validity = { ...target.relationship.validity, end: request.end };
    if (!RelationshipValiditySchema.safeParse(validity).success) throw new MemoryInvalid();
    await database.run(
      `UPDATE relationship_assertion_scope SET end_certainty=?,end_precision=?,end_value=? WHERE assertion_id=?`,
      request.end.certainty,
      request.end.bound.precision,
      "value" in request.end.bound ? request.end.bound.value : null,
      target.id,
    );
    await database.run(
      "UPDATE memory_assertion SET applicability='HISTORICAL',revision=revision+1,updated_at=? WHERE id=?",
      now,
      target.id,
    );
    const updated = await currentRow(database, target.id);
    const item = await insertRelationshipEvidence(database, current.contextId, {
      contactId: target.subject.contactId,
      contextRef: target.relationship.contextId,
      episodeId: target.relationship.episodeId,
      value: target.value,
      polarity: "POSITIVE",
      input: request.evidence,
      now,
    });
    await linkEvidence(database, current.contextId, updated.id, item.id, "CONTEXTUALIZES", now);
    changed.assertions.push(updated);
    changed.evidence.push(item);
    const transitionDecision = await insertRelationshipDecision(database, current.contextId, {
      assertionId: updated.id,
      assertionRevision: updated.revision,
      operation: "TRANSITION",
      authority: request.authority,
      now,
    });
    await database.run(
      `INSERT INTO relationship_temporal_support(
         context_id,assertion_id,evidence_id,decision_id,end_certainty,end_precision,end_value)
       VALUES (?,?,?,?,?,?,?)`,
      current.contextId,
      updated.id,
      item.id,
      transitionDecision.id,
      request.end.certainty,
      request.end.bound.precision,
      "value" in request.end.bound ? request.end.bound.value : null,
    );
    changed.decisions.push(transitionDecision);
  } else if (request.operation === "CORRECT_RELATIONSHIP") {
    const old = await requireAssertion(
      database,
      current.contextId,
      request.assertionId,
      request.assertionRevision,
    );
    if (
      !old.relationship ||
      old.subject.kind !== "CONTACT" ||
      old.subject.contactId !== request.contactId ||
      old.acceptance === "REJECTED" ||
      old.lifecycle !== "ACTIVE"
    )
      throw new MemoryConflict();
    if (
      old.acceptance === "CONFIRMED" &&
      request.reach === "CURRENT" &&
      old.applicability !== "CURRENT"
    )
      throw new MemoryConflict();
    await requireContact(database, current.contextId, old.subject, request.contactRevision);
    const contextRef = await resolveRelationshipContext(
      database,
      current.contextId,
      request.contactId,
      request.context,
      now,
    );
    const episodeId = request.episodeId ?? randomUUID();
    if (
      contextRef === old.relationship.contextId &&
      episodeId === old.relationship.episodeId &&
      JSON.stringify(old.value) === JSON.stringify(request.value) &&
      JSON.stringify(old.relationship.validity) === JSON.stringify(request.validity)
    )
      throw new MemoryInvalid();
    if (
      await blockedByRelationshipCorrection(
        database,
        current.contextId,
        request.contactId,
        contextRef,
        request.value,
        "CURRENT",
        request.validity,
      )
    )
      throw new MemoryConflict();
    const retainOldHistory = old.acceptance === "CONFIRMED" && request.reach !== "ALL_HISTORY";
    await database.run(
      "UPDATE memory_assertion SET acceptance=?,applicability=?,revision=revision+1,updated_at=? WHERE id=?",
      retainOldHistory ? "CONFIRMED" : "REJECTED",
      retainOldHistory && request.reach === "CURRENT" ? "HISTORICAL" : "UNKNOWN",
      now,
      old.id,
    );
    const correctedOld = await currentRow(database, old.id);
    const replacement = await insertRelationshipAssertion(database, current.contextId, {
      contactId: request.contactId,
      contextRef,
      episodeId,
      value: request.value,
      validity: request.validity,
      acceptance: "CONFIRMED",
      applicability: "UNKNOWN",
      replacesAssertionId: old.id,
      now,
    });
    const item = await insertRelationshipEvidence(database, current.contextId, {
      contactId: request.contactId,
      contextRef,
      episodeId,
      value: request.value,
      polarity: "POSITIVE",
      input: request.evidence,
      now,
    });
    await linkEvidence(database, current.contextId, replacement.id, item.id, "SUPPORTS", now);
    changed.assertions.push(correctedOld, replacement);
    changed.evidence.push(item);
    changed.decisions.push(
      await insertRelationshipDecision(database, current.contextId, {
        assertionId: correctedOld.id,
        assertionRevision: correctedOld.revision,
        operation: "FACT_CORRECT",
        authority: request.authority,
        replacementAssertionId: replacement.id,
        reach: request.reach,
        correctionInterval: request.correctionInterval,
        now,
      }),
    );
  } else if (request.operation === "RECONSIDER_RELATIONSHIP") {
    const old = await requireAssertion(
      database,
      current.contextId,
      request.assertionId,
      request.assertionRevision,
    );
    if (
      !old.relationship ||
      old.subject.kind !== "CONTACT" ||
      typeof old.value === "string" ||
      old.lifecycle !== "ACTIVE"
    )
      throw new MemoryConflict();
    const prior = await database.get(
      `SELECT d.id,s.reach FROM memory_decision d JOIN relationship_decision_scope s ON s.decision_id=d.id
       WHERE d.context_id=? AND d.id=? AND d.assertion_id=? AND d.operation IN ('REJECT','FACT_CORRECT')`,
      current.contextId,
      request.decisionId,
      old.id,
    );
    if (
      !prior ||
      (old.acceptance !== "REJECTED" &&
        !(old.acceptance === "CONFIRMED" && prior.reach !== "ALL_HISTORY"))
    )
      throw new MemoryConflict();
    const fullyRejected = old.acceptance === "REJECTED";
    if (fullyRejected) {
      await database.run(
        "UPDATE memory_assertion SET lifecycle='SUPERSEDED',applicability='UNKNOWN',revision=revision+1,updated_at=? WHERE id=?",
        now,
        old.id,
      );
      changed.assertions.push(await currentRow(database, old.id));
    }
    const candidate = await insertRelationshipAssertion(database, current.contextId, {
      contactId: old.subject.contactId,
      contextRef: old.relationship.contextId,
      episodeId: fullyRejected ? old.relationship.episodeId : randomUUID(),
      value: old.value,
      validity: old.relationship.validity,
      acceptance: "CANDIDATE",
      applicability: "UNKNOWN",
      replacesAssertionId: old.id,
      reconsideredDecisionId: request.decisionId,
      now,
    });
    const item = await insertRelationshipEvidence(database, current.contextId, {
      contactId: old.subject.contactId,
      contextRef: old.relationship.contextId,
      episodeId: candidate.relationship!.episodeId,
      value: old.value,
      polarity: "POSITIVE",
      input: request.evidence,
      now,
    });
    await linkEvidence(database, current.contextId, candidate.id, item.id, "SUPPORTS", now);
    changed.assertions.push(candidate);
    changed.evidence.push(item);
    changed.decisions.push(
      await insertRelationshipDecision(database, current.contextId, {
        assertionId: candidate.id,
        assertionRevision: candidate.revision,
        operation: "RECONSIDER",
        authority: "TRUSTED_USER_DECISION",
        reconsideredDecisionId: request.decisionId,
        now,
      }),
    );
  }
}

export async function mutateMemory(
  database: MemoryDatabase,
  request: Exclude<MemoryAssertionRequest, { operation: "LIST" }>,
): Promise<MemoryAssertionResult> {
  await database.exec("BEGIN IMMEDIATE;");
  try {
    const current = await context(database);
    expected(current, request);
    const changed: MemoryMutation = {
      kind: "MUTATION",
      generation: current.generation,
      memoryRevision: current.memoryRevision + 1,
      assertions: [],
      evidence: [],
      decisions: [],
    };
    const now = new Date().toISOString();

    if (
      request.operation === "PROPOSE_RELATIONSHIP" ||
      request.operation === "ADD_RELATIONSHIP_EVIDENCE" ||
      request.operation === "DECIDE_RELATIONSHIP" ||
      request.operation === "TRANSITION_RELATIONSHIP" ||
      request.operation === "CORRECT_RELATIONSHIP" ||
      request.operation === "RECONSIDER_RELATIONSHIP"
    ) {
      await applyRelationshipMutation(database, current, request, changed, now);
    } else if (request.operation === "PROPOSE") {
      await requireContact(database, current.contextId, request.subject, request.contactRevision);
      const [, subjectKey] = subjectColumns(request.subject);
      const sameRow = await database.get(
        `SELECT * FROM memory_assertion WHERE context_id=? AND subject_key=?
         AND predicate='REPLY_LENGTH_PREFERENCE' AND preference_value=? AND lifecycle='ACTIVE'
         ORDER BY created_at DESC,id DESC LIMIT 1`,
        current.contextId,
        subjectKey,
        request.value,
      );
      const target = sameRow
        ? assertion(sameRow)
        : await insertAssertion(database, current.contextId, {
            subject: request.subject,
            value: request.value,
            acceptance: "CANDIDATE",
            applicability: request.applicability,
            validTime: request.validTime,
            now,
          });
      const item = await insertOrFindEvidence(
        database,
        current.contextId,
        request.subject,
        request.value,
        request.evidence,
        now,
      );
      await linkEvidence(database, current.contextId, target.id, item.id, "SUPPORTS", now);
      changed.assertions.push(target);
      changed.evidence.push(item);
    } else if (request.operation === "ADD_EVIDENCE") {
      const target = await requireAssertion(
        database,
        current.contextId,
        request.assertionId,
        request.assertionRevision,
      );
      if (target.predicate !== "REPLY_LENGTH_PREFERENCE") throw new MemoryInvalid();
      const item = await insertOrFindEvidence(
        database,
        current.contextId,
        target.subject,
        request.evidenceValue,
        request.evidence,
        now,
      );
      if (
        (request.role === "SUPPORTS" && request.evidenceValue !== target.value) ||
        (request.role === "CONTRADICTS" && request.evidenceValue === target.value)
      )
        throw new MemoryInvalid();
      await linkEvidence(database, current.contextId, target.id, item.id, request.role, now);
      changed.assertions.push(target);
      changed.evidence.push(item);
    } else if (request.operation === "DECIDE") {
      const target = await requireAssertion(
        database,
        current.contextId,
        request.assertionId,
        request.assertionRevision,
      );
      if (target.predicate !== "REPLY_LENGTH_PREFERENCE") throw new MemoryInvalid();
      const next = decideCandidate(target, request.decision);
      if (!next) throw new MemoryConflict();
      if (request.decision === "CONFIRM") {
        const [, subjectKey] = subjectColumns(target.subject);
        const existing = await database.get(
          `SELECT id FROM memory_assertion WHERE context_id=? AND subject_key=?
           AND predicate='REPLY_LENGTH_PREFERENCE' AND acceptance='CONFIRMED'
           AND lifecycle='ACTIVE' AND applicability='CURRENT' AND id<>?`,
          current.contextId,
          subjectKey,
          target.id,
        );
        if (existing) throw new MemoryConflict();
      }
      await database.run(
        "UPDATE memory_assertion SET acceptance=?,revision=revision+1,updated_at=? WHERE id=?",
        next.acceptance,
        now,
        target.id,
      );
      const updated = await currentRow(database, target.id);
      changed.assertions.push(updated);
      changed.decisions.push(
        await insertDecision(database, current.contextId, {
          assertionId: updated.id,
          assertionRevision: updated.revision,
          operation: request.decision,
          authority: request.authority,
          now,
        }),
      );
    } else if (request.operation === "REPLACE") {
      const old = await requireAssertion(
        database,
        current.contextId,
        request.assertionId,
        request.assertionRevision,
      );
      if (old.predicate !== "REPLY_LENGTH_PREFERENCE") throw new MemoryInvalid();
      if (JSON.stringify(old.subject) !== JSON.stringify(request.subject))
        throw new MemoryInvalid();
      await requireContact(database, current.contextId, request.subject, request.contactRevision);
      const historical = await supersedeRow(database, old, now);
      const replacement = await insertAssertion(database, current.contextId, {
        subject: request.subject,
        value: request.value,
        acceptance: "CONFIRMED",
        applicability: request.applicability,
        validTime: request.validTime,
        replacesAssertionId: old.id,
        now,
      });
      const item = await insertOrFindEvidence(
        database,
        current.contextId,
        request.subject,
        request.value,
        request.evidence,
        now,
      );
      await linkEvidence(database, current.contextId, replacement.id, item.id, "SUPPORTS", now);
      changed.assertions.push(historical, replacement);
      changed.evidence.push(item);
      changed.decisions.push(
        await insertDecision(database, current.contextId, {
          assertionId: old.id,
          assertionRevision: historical.revision,
          operation: "REPLACE",
          authority: request.authority,
          replacementAssertionId: replacement.id,
          now,
        }),
      );
    } else if (request.operation === "RECONSIDER") {
      const old = await requireAssertion(
        database,
        current.contextId,
        request.assertionId,
        request.assertionRevision,
      );
      if (old.predicate !== "REPLY_LENGTH_PREFERENCE" || typeof old.value !== "string")
        throw new MemoryInvalid();
      if (!canReconsider(old)) throw new MemoryConflict();
      const prior = await database.get(
        "SELECT id FROM memory_decision WHERE context_id=? AND id=? AND assertion_id=? AND operation='REJECT'",
        current.contextId,
        request.decisionId,
        old.id,
      );
      if (!prior) throw new MemoryConflict();
      const historical = await supersedeRow(database, old, now);
      const reconsidered = await insertAssertion(database, current.contextId, {
        subject: old.subject,
        value: old.value,
        acceptance: "CANDIDATE",
        applicability: old.applicability === "HISTORICAL" ? "UNKNOWN" : old.applicability,
        validTime: old.validTime,
        replacesAssertionId: old.id,
        reconsideredDecisionId: request.decisionId,
        now,
      });
      const item = await insertOrFindEvidence(
        database,
        current.contextId,
        old.subject,
        old.value,
        request.evidence,
        now,
      );
      await linkEvidence(database, current.contextId, reconsidered.id, item.id, "SUPPORTS", now);
      changed.assertions.push(historical, reconsidered);
      changed.evidence.push(item);
      changed.decisions.push(
        await insertDecision(database, current.contextId, {
          assertionId: reconsidered.id,
          assertionRevision: reconsidered.revision,
          operation: "RECONSIDER",
          authority: "TRUSTED_USER_DECISION",
          reconsideredDecisionId: request.decisionId,
          now,
        }),
      );
    } else if (request.operation === "DELETE_ASSERTION") {
      await requireAssertion(
        database,
        current.contextId,
        request.assertionId,
        request.assertionRevision,
      );
      await database.run("DELETE FROM memory_assertion WHERE id=?", request.assertionId);
      await deleteUnsupported(database, current.contextId);
    } else if (request.operation === "DELETE_EVIDENCE") {
      const found = await database.get(
        "SELECT id FROM memory_evidence WHERE context_id=? AND id=?",
        current.contextId,
        request.evidenceId,
      );
      if (!found) throw new MemoryConflict();
      const temporalAssertions = await temporalAssertionsForEvidence(
        database,
        current.contextId,
        "e.id=?",
        request.evidenceId,
      );
      await database.run("DELETE FROM memory_evidence WHERE id=?", request.evidenceId);
      await reconcileTemporalAssertions(database, current.contextId, temporalAssertions);
      await deleteUnsupported(database, current.contextId);
    }
    await database.run(
      "UPDATE local_context SET memory_revision=memory_revision+1 WHERE singleton=1",
    );
    await database.exec("COMMIT;");
    return MemoryAssertionResultSchema.parse({ ok: true, result: changed });
  } catch (error) {
    await database.exec("ROLLBACK;").catch(() => undefined);
    return error instanceof MemoryConflict
      ? safeError("CONFLICT")
      : error instanceof MemoryInvalid
        ? safeError("INVALID_REQUEST")
        : safeError("STORE_UNAVAILABLE");
  }
}

export async function executeMemory(
  database: MemoryDatabase,
  request: MemoryAssertionRequest,
): Promise<MemoryAssertionResult> {
  return request.operation === "LIST"
    ? await listMemory(database, request)
    : await mutateMemory(database, request);
}
