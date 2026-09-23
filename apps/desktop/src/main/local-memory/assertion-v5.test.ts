import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

import { describe, expect, it } from "vitest";

import {
  MemoryAssertionRequestSchema,
  type MemoryAssertionRequest,
} from "@ai-message-coach/contracts";

import { createDirectorySchema } from "./directory-store.js";
import {
  createAssertionSchema,
  invalidateAssociationEvidence,
  listMemory,
  mutateMemory,
  readPreferenceProjection,
  savePreference,
  type MemoryDatabase,
} from "./assertion-store.js";
import { upgradeAssertionSchemaV5 } from "./assertion-v5.js";
import { upgradeAssertionSchemaV6 } from "./assertion-v6.js";

function adapter(sqlite: DatabaseSync): MemoryDatabase {
  return {
    exec: async (sql) => {
      sqlite.exec(sql);
    },
    run: async (sql, ...values) =>
      sqlite.prepare(sql).run(...(values as (string | number | null)[])),
    get: async (sql, ...values) =>
      sqlite.prepare(sql).get(...(values as (string | number | null)[])) as
        Record<string, unknown> | undefined,
    all: async (sql, ...values) =>
      sqlite.prepare(sql).all(...(values as (string | number | null)[])) as Record<
        string,
        unknown
      >[],
  };
}

const evidence = () => ({
  source: "SYNTHETIC_FIXTURE" as const,
  sourceReference: randomUUID(),
  sourceTime: { precision: "UNKNOWN" as const },
  confidence: { extraction: null, attribution: null, predicate: 0.76 },
  association: null,
});

async function v4Fixture() {
  const sqlite = new DatabaseSync(":memory:");
  const db = adapter(sqlite);
  const contextId = randomUUID();
  const contactId = randomUUID();
  const generation = randomUUID();
  sqlite.exec("PRAGMA foreign_keys=ON;");
  sqlite.exec(`CREATE TABLE local_context(singleton INTEGER PRIMARY KEY,store_id TEXT,context_id TEXT,generation TEXT,
    settings_revision INTEGER,directory_revision INTEGER,memory_revision INTEGER);`);
  await db.run(
    "INSERT INTO local_context VALUES(1,?,?,?,?,0,0)",
    randomUUID(),
    contextId,
    generation,
    0,
  );
  await createDirectorySchema(db);
  await createAssertionSchema(db);
  await db.run(
    "INSERT INTO contact VALUES(?,?,?,?,?,?)",
    contactId,
    contextId,
    "Synthetic contact",
    1,
    "2024-01-01T00:00:00.000Z",
    "2024-01-01T00:00:00.000Z",
  );
  await savePreference(db, contextId, "BALANCED");
  const before = await readPreferenceProjection(db);
  sqlite.exec("PRAGMA user_version=4;");
  return { sqlite, db, contextId, contactId, generation, before };
}

async function fixture() {
  const { sqlite, db, contextId, contactId, generation, before } = await v4Fixture();
  sqlite.exec("PRAGMA foreign_keys=OFF; BEGIN IMMEDIATE;");
  try {
    await upgradeAssertionSchemaV5(db);
    expect((await db.all("PRAGMA foreign_key_check;")).length).toBe(0);
    sqlite.exec("PRAGMA user_version=5; COMMIT; PRAGMA foreign_keys=ON;");
    sqlite.exec("BEGIN IMMEDIATE;");
    await upgradeAssertionSchemaV6(db);
    expect((await db.all("PRAGMA foreign_key_check;")).length).toBe(0);
    sqlite.exec("PRAGMA user_version=6; COMMIT;");
  } catch (error) {
    sqlite.exec("ROLLBACK; PRAGMA foreign_keys=ON;");
    throw error;
  }
  return { sqlite, db, contextId, contactId, generation, before };
}

async function memory(db: MemoryDatabase, request: unknown) {
  const parsed = MemoryAssertionRequestSchema.parse(request) as Exclude<
    MemoryAssertionRequest,
    { operation: "LIST" }
  >;
  return await mutateMemory(db, parsed);
}

describe("DATA-03 canonical relationship schema and lifecycle", () => {
  it("preserves v4 preference IDs and links through the v5 and v6 rebuilds", async () => {
    const { sqlite, db, before } = await fixture();
    try {
      expect(before?.value).toBe("BALANCED");
      expect(await readPreferenceProjection(db)).toEqual(before);
      expect(Number((await db.get("PRAGMA user_version"))?.user_version)).toBe(6);
      expect((await db.all("SELECT * FROM relationship_context")).length).toBe(0);
      expect((await db.all("PRAGMA foreign_key_check")).length).toBe(0);
    } finally {
      sqlite.close();
    }
  });

  it("rolls back a failed v4-to-v5 rebuild without changing durable v4 rows", async () => {
    const { sqlite, db, before } = await v4Fixture();
    try {
      const assertionBefore = await db.all(
        "SELECT id,preference_value,created_at,updated_at FROM memory_assertion",
      );
      sqlite.exec(
        "PRAGMA foreign_keys=OFF; BEGIN IMMEDIATE; CREATE TABLE memory_assertion_v5(id TEXT);",
      );
      await expect(upgradeAssertionSchemaV5(db)).rejects.toThrow();
      sqlite.exec("ROLLBACK; PRAGMA foreign_keys=ON;");
      expect(
        await db.all("SELECT id,preference_value,created_at,updated_at FROM memory_assertion"),
      ).toEqual(assertionBefore);
      expect(await readPreferenceProjection(db)).toEqual(before);
      expect(Number((await db.get("PRAGMA user_version"))?.user_version)).toBe(4);
      expect((await db.all("PRAGMA foreign_key_check")).length).toBe(0);
    } finally {
      sqlite.close();
    }
  });

  it("keeps directed manager and friend as separate candidates, then preserves historical truth", async () => {
    const { sqlite, db, contactId, generation } = await fixture();
    try {
      const context = {
        selection: "NEW" as const,
        context: {
          kind: "ORGANIZATION" as const,
          organizationLabel: "Company A",
          projectLabel: null,
        },
      };
      const manager = await memory(db, {
        operation: "PROPOSE_RELATIONSHIP",
        generation,
        memoryRevision: 0,
        contactId,
        contactRevision: 1,
        context,
        episodeId: null,
        value: { predicate: "RELATIONSHIP_ROLE", role: "MANAGER", direction: "CONTACT" },
        validity: {
          start: { precision: "UNKNOWN" },
          end: { certainty: "UNKNOWN", bound: { precision: "UNKNOWN" } },
        },
        applicability: "CURRENT",
        evidence: evidence(),
      });
      expect(manager.ok).toBe(true);
      if (!manager.ok || manager.result.kind !== "MUTATION") return;
      expect(manager.result.assertions[0]?.acceptance).toBe("CANDIDATE");
      const contextRef = manager.result.assertions[0]?.relationship?.contextId;
      const friend = await memory(db, {
        operation: "PROPOSE_RELATIONSHIP",
        generation,
        memoryRevision: 1,
        contactId,
        contactRevision: 1,
        context: { selection: "EXISTING", contextId: contextRef },
        episodeId: null,
        value: { predicate: "RELATIONSHIP_ROLE", role: "FRIEND", direction: "SYMMETRIC" },
        validity: {
          start: { precision: "CALENDAR_MONTH", value: "2020-05" },
          end: { certainty: "UNKNOWN", bound: { precision: "UNKNOWN" } },
        },
        applicability: "CURRENT",
        evidence: evidence(),
      });
      expect(friend.ok).toBe(true);
      expect(
        (await db.all("SELECT role,direction FROM relationship_assertion_scope ORDER BY role"))
          .length,
      ).toBe(2);
      const decided = await memory(db, {
        operation: "DECIDE_RELATIONSHIP",
        generation,
        memoryRevision: 2,
        assertionId: manager.result.assertions[0]?.id,
        assertionRevision: 1,
        decision: "CONFIRM",
        reach: "CURRENT",
        authority: "SYNTHETIC_FIXTURE",
      });
      expect(decided.ok).toBe(true);
      const historical = await memory(db, {
        operation: "TRANSITION_RELATIONSHIP",
        generation,
        memoryRevision: 3,
        assertionId: manager.result.assertions[0]?.id,
        assertionRevision: 2,
        end: { certainty: "WITHIN", bound: { precision: "YEAR", value: "2023" } },
        evidence: evidence(),
        authority: "SYNTHETIC_FIXTURE",
      });
      expect(historical.ok).toBe(true);
      if (historical.ok && historical.result.kind === "MUTATION") {
        expect(historical.result.assertions[0]?.acceptance).toBe("CONFIRMED");
        expect(historical.result.assertions[0]?.applicability).toBe("HISTORICAL");
        expect(historical.result.assertions[0]?.relationship?.validity.end).toEqual({
          certainty: "WITHIN",
          bound: { precision: "YEAR", value: "2023" },
        });
      }
      expect((await db.all("PRAGMA foreign_key_check")).length).toBe(0);
    } finally {
      sqlite.close();
    }
  });

  it("rejects false scoped claims without turning them into true history or allowing a fresh ID to bypass correction", async () => {
    const { sqlite, db, contactId, generation } = await fixture();
    try {
      const claim = {
        contactId,
        contactRevision: 1,
        context: {
          selection: "NEW" as const,
          context: { kind: "GENERAL" as const, organizationLabel: null, projectLabel: null },
        },
        episodeId: null,
        value: {
          predicate: "RELATIONSHIP_ROLE" as const,
          role: "MANAGER" as const,
          direction: "CONTACT" as const,
        },
        validity: {
          start: { precision: "UNKNOWN" as const },
          end: { certainty: "UNKNOWN" as const, bound: { precision: "UNKNOWN" as const } },
        },
        applicability: "CURRENT" as const,
      };
      const proposed = await memory(db, {
        operation: "PROPOSE_RELATIONSHIP",
        generation,
        memoryRevision: 0,
        ...claim,
        evidence: evidence(),
      });
      expect(proposed.ok).toBe(true);
      if (!proposed.ok || proposed.result.kind !== "MUTATION") return;
      const original = proposed.result.assertions[0]!;
      const rejected = await memory(db, {
        operation: "DECIDE_RELATIONSHIP",
        generation,
        memoryRevision: 1,
        assertionId: original.id,
        assertionRevision: original.revision,
        decision: "REJECT",
        reach: "CURRENT",
        authority: "SYNTHETIC_FIXTURE",
      });
      expect(rejected.ok).toBe(true);
      if (!rejected.ok || rejected.result.kind !== "MUTATION") return;
      expect(rejected.result.assertions[0]?.acceptance).toBe("REJECTED");
      expect(rejected.result.assertions[0]?.applicability).toBe("UNKNOWN");
      const repeat = await memory(db, {
        operation: "PROPOSE_RELATIONSHIP",
        generation,
        memoryRevision: 2,
        ...claim,
        context: { selection: "EXISTING", contextId: original.relationship?.contextId },
        episodeId: null,
        evidence: evidence(),
      });
      expect(repeat).toMatchObject({ ok: false, error: { code: "CONFLICT" } });
      expect((await db.all("SELECT * FROM relationship_assertion_scope")).length).toBe(1);
      const badContradiction = await memory(db, {
        operation: "ADD_RELATIONSHIP_EVIDENCE",
        generation,
        memoryRevision: 2,
        assertionId: original.id,
        assertionRevision: 2,
        evidenceValue: { predicate: "RELATIONSHIP_ROLE", role: "FRIEND", direction: "SYMMETRIC" },
        polarity: "NEGATIVE",
        role: "CONTRADICTS",
        evidence: evidence(),
      });
      expect(badContradiction).toMatchObject({ ok: false, error: { code: "INVALID_REQUEST" } });
      const reconsidered = await memory(db, {
        operation: "RECONSIDER_RELATIONSHIP",
        generation,
        memoryRevision: 2,
        assertionId: original.id,
        assertionRevision: 2,
        decisionId: rejected.result.decisions[0]?.id,
        evidence: evidence(),
      });
      expect(reconsidered.ok).toBe(true);
      if (reconsidered.ok && reconsidered.result.kind === "MUTATION") {
        expect(reconsidered.result.assertions[0]?.acceptance).toBe("REJECTED");
        expect(reconsidered.result.assertions[0]?.applicability).toBe("UNKNOWN");
        expect(reconsidered.result.assertions[1]?.acceptance).toBe("CANDIDATE");
      }
      expect((await db.all("PRAGMA foreign_key_check")).length).toBe(0);
    } finally {
      sqlite.close();
    }
  });

  it("retains a current-only correction after the corrected role loses its sole support", async () => {
    const { sqlite, db, contactId, generation } = await fixture();
    try {
      const validity = {
        start: { precision: "UNKNOWN" },
        end: { certainty: "UNKNOWN", bound: { precision: "UNKNOWN" } },
      };
      const managerValue = {
        predicate: "RELATIONSHIP_ROLE",
        role: "MANAGER",
        direction: "CONTACT",
      };
      const manager = await memory(db, {
        operation: "PROPOSE_RELATIONSHIP",
        generation,
        memoryRevision: 0,
        contactId,
        contactRevision: 1,
        context: {
          selection: "NEW",
          context: { kind: "GENERAL", organizationLabel: null, projectLabel: null },
        },
        episodeId: null,
        value: managerValue,
        validity,
        applicability: "CURRENT",
        evidence: evidence(),
      });
      expect(manager.ok).toBe(true);
      if (!manager.ok || manager.result.kind !== "MUTATION") return;
      const assertion = manager.result.assertions[0]!;
      const sourceId = manager.result.evidence[0]!.id;
      const contextRef = assertion.relationship!.contextId;
      const friend = await memory(db, {
        operation: "PROPOSE_RELATIONSHIP",
        generation,
        memoryRevision: 1,
        contactId,
        contactRevision: 1,
        context: { selection: "EXISTING", contextId: contextRef },
        episodeId: null,
        value: { predicate: "RELATIONSHIP_ROLE", role: "FRIEND", direction: "SYMMETRIC" },
        validity,
        applicability: "CURRENT",
        evidence: evidence(),
      });
      expect(friend.ok).toBe(true);
      const confirmed = await memory(db, {
        operation: "DECIDE_RELATIONSHIP",
        generation,
        memoryRevision: 2,
        assertionId: assertion.id,
        assertionRevision: 1,
        decision: "CONFIRM",
        reach: "CURRENT",
        authority: "SYNTHETIC_FIXTURE",
      });
      expect(confirmed.ok).toBe(true);
      const corrected = await memory(db, {
        operation: "DECIDE_RELATIONSHIP",
        generation,
        memoryRevision: 3,
        assertionId: assertion.id,
        assertionRevision: 2,
        decision: "REJECT",
        reach: "CURRENT",
        authority: "SYNTHETIC_FIXTURE",
      });
      expect(corrected.ok).toBe(true);
      const deleted = await memory(db, {
        operation: "DELETE_EVIDENCE",
        generation,
        memoryRevision: 4,
        evidenceId: sourceId,
      });
      expect(deleted.ok).toBe(true);
      expect(
        await db.get(
          "SELECT acceptance,applicability FROM memory_assertion WHERE id=?",
          assertion.id,
        ),
      ).toMatchObject({ acceptance: "REJECTED", applicability: "UNKNOWN" });
      expect(
        Number(
          (
            await db.get(
              "SELECT COUNT(*) AS count FROM memory_decision WHERE assertion_id=? AND operation='REJECT'",
              assertion.id,
            )
          )?.count,
        ),
      ).toBe(1);
      const fresh = await memory(db, {
        operation: "PROPOSE_RELATIONSHIP",
        generation,
        memoryRevision: 5,
        contactId,
        contactRevision: 1,
        context: { selection: "EXISTING", contextId: contextRef },
        episodeId: null,
        value: managerValue,
        validity,
        applicability: "CURRENT",
        evidence: evidence(),
      });
      expect(fresh).toMatchObject({ ok: false, error: { code: "CONFLICT" } });
      expect((await db.all("PRAGMA foreign_key_check")).length).toBe(0);
    } finally {
      sqlite.close();
    }
  });

  it("does not present a current-only rejected role as current in an as-of LIST", async () => {
    const { sqlite, db, contactId, generation } = await fixture();
    try {
      const proposed = await memory(db, {
        operation: "PROPOSE_RELATIONSHIP",
        generation,
        memoryRevision: 0,
        contactId,
        contactRevision: 1,
        context: {
          selection: "NEW",
          context: { kind: "GENERAL", organizationLabel: null, projectLabel: null },
        },
        episodeId: null,
        value: { predicate: "RELATIONSHIP_ROLE", role: "MANAGER", direction: "CONTACT" },
        validity: {
          start: { precision: "INSTANT", value: "2024-01-01T00:00:00Z" },
          end: {
            certainty: "EXACT",
            bound: { precision: "INSTANT", value: "2027-01-01T00:00:00Z" },
          },
        },
        applicability: "CURRENT",
        evidence: evidence(),
      });
      expect(proposed.ok).toBe(true);
      if (!proposed.ok || proposed.result.kind !== "MUTATION") return;
      const assertion = proposed.result.assertions[0]!;
      const confirmed = await memory(db, {
        operation: "DECIDE_RELATIONSHIP",
        generation,
        memoryRevision: 1,
        assertionId: assertion.id,
        assertionRevision: 1,
        decision: "CONFIRM",
        reach: "CURRENT",
        authority: "SYNTHETIC_FIXTURE",
      });
      expect(confirmed.ok).toBe(true);
      const rejected = await memory(db, {
        operation: "DECIDE_RELATIONSHIP",
        generation,
        memoryRevision: 2,
        assertionId: assertion.id,
        assertionRevision: 2,
        decision: "REJECT",
        reach: "CURRENT",
        authority: "SYNTHETIC_FIXTURE",
      });
      expect(rejected.ok).toBe(true);
      const readAt = async (asOf: string) => {
        const request = MemoryAssertionRequestSchema.parse({
          operation: "LIST",
          generation,
          memoryRevision: 3,
          recordType: "MEMORY_ASSERTION",
          cursor: null,
          limit: 20,
          filter: {
            contactId,
            predicate: "RELATIONSHIP_ROLE",
            relationshipContextId: assertion.relationship!.contextId,
            asOf,
          },
        });
        if (request.operation !== "LIST") throw new Error("invalid fixture");
        const result = await listMemory(db, request);
        expect(result.ok).toBe(true);
        if (!result.ok || result.result.kind !== "PAGE") throw new Error("invalid page");
        return result.result.records.find(
          (record) => record.recordType === "MEMORY_ASSERTION" && record.id === assertion.id,
        );
      };
      const earlier = await readAt("2025-01-01T00:00:00Z");
      if (!rejected.ok || rejected.result.kind !== "MUTATION") throw new Error("invalid rejection");
      const current = await readAt(rejected.result.decisions[0]!.createdAt);
      expect(earlier?.recordType === "MEMORY_ASSERTION" && earlier.effectiveApplicability).toBe(
        "CURRENT",
      );
      expect(current?.recordType === "MEMORY_ASSERTION" && current.effectiveApplicability).not.toBe(
        "CURRENT",
      );
    } finally {
      sqlite.close();
    }
  });

  it("invalidates only an unsupported temporal end when transition evidence is deleted", async () => {
    const { sqlite, db, contactId, generation } = await fixture();
    try {
      const proposed = await memory(db, {
        operation: "PROPOSE_RELATIONSHIP",
        generation,
        memoryRevision: 0,
        contactId,
        contactRevision: 1,
        context: {
          selection: "NEW",
          context: { kind: "GENERAL", organizationLabel: null, projectLabel: null },
        },
        episodeId: null,
        value: { predicate: "RELATIONSHIP_ROLE", role: "MANAGER", direction: "CONTACT" },
        validity: {
          start: { precision: "YEAR", value: "2024" },
          end: { certainty: "UNKNOWN", bound: { precision: "UNKNOWN" } },
        },
        applicability: "CURRENT",
        evidence: evidence(),
      });
      expect(proposed.ok).toBe(true);
      if (!proposed.ok || proposed.result.kind !== "MUTATION") return;
      const assertion = proposed.result.assertions[0]!;
      const confirmed = await memory(db, {
        operation: "DECIDE_RELATIONSHIP",
        generation,
        memoryRevision: 1,
        assertionId: assertion.id,
        assertionRevision: 1,
        decision: "CONFIRM",
        reach: "CURRENT",
        authority: "SYNTHETIC_FIXTURE",
      });
      expect(confirmed.ok).toBe(true);
      const transition = await memory(db, {
        operation: "TRANSITION_RELATIONSHIP",
        generation,
        memoryRevision: 2,
        assertionId: assertion.id,
        assertionRevision: 2,
        end: { certainty: "EXACT", bound: { precision: "YEAR", value: "2026" } },
        evidence: evidence(),
        authority: "SYNTHETIC_FIXTURE",
      });
      expect(transition.ok).toBe(true);
      if (!transition.ok || transition.result.kind !== "MUTATION") return;
      const transitionEvidence = transition.result.evidence[0]!.id;
      expect(
        await db.get(
          "SELECT role FROM assertion_evidence_link WHERE assertion_id=? AND evidence_id=?",
          assertion.id,
          transitionEvidence,
        ),
      ).toMatchObject({ role: "CONTEXTUALIZES" });
      const deleted = await memory(db, {
        operation: "DELETE_EVIDENCE",
        generation,
        memoryRevision: 3,
        evidenceId: transitionEvidence,
      });
      expect(deleted.ok).toBe(true);
      expect(
        await db.get(
          "SELECT acceptance,applicability FROM memory_assertion WHERE id=?",
          assertion.id,
        ),
      ).toMatchObject({ acceptance: "CONFIRMED", applicability: "UNKNOWN" });
      expect(
        await db.get(
          "SELECT end_certainty,end_precision,end_value FROM relationship_assertion_scope WHERE assertion_id=?",
          assertion.id,
        ),
      ).toMatchObject({ end_certainty: "UNKNOWN", end_precision: "UNKNOWN", end_value: null });
      expect(
        Number(
          (
            await db.get(
              "SELECT COUNT(*) AS count FROM relationship_temporal_support WHERE assertion_id=?",
              assertion.id,
            )
          )?.count,
        ),
      ).toBe(0);
      expect((await db.all("PRAGMA foreign_key_check")).length).toBe(0);
    } finally {
      sqlite.close();
    }
  });

  it("migrates an unambiguously sourced v5 transition without losing its end", async () => {
    const { sqlite, db, contactId, generation } = await fixture();
    try {
      const proposed = await memory(db, {
        operation: "PROPOSE_RELATIONSHIP",
        generation,
        memoryRevision: 0,
        contactId,
        contactRevision: 1,
        context: {
          selection: "NEW",
          context: { kind: "GENERAL", organizationLabel: null, projectLabel: null },
        },
        episodeId: null,
        value: { predicate: "RELATIONSHIP_ROLE", role: "MANAGER", direction: "CONTACT" },
        validity: {
          start: { precision: "YEAR", value: "2024" },
          end: { certainty: "UNKNOWN", bound: { precision: "UNKNOWN" } },
        },
        applicability: "CURRENT",
        evidence: evidence(),
      });
      expect(proposed.ok).toBe(true);
      if (!proposed.ok || proposed.result.kind !== "MUTATION") return;
      const assertion = proposed.result.assertions[0]!;
      await db.run(
        "UPDATE memory_evidence SET recorded_at=? WHERE id=?",
        "2024-01-01T00:00:00.000Z",
        proposed.result.evidence[0]!.id,
      );
      const transition = await memory(db, {
        operation: "TRANSITION_RELATIONSHIP",
        generation,
        memoryRevision: 1,
        assertionId: assertion.id,
        assertionRevision: 1,
        end: { certainty: "EXACT", bound: { precision: "YEAR", value: "2026" } },
        evidence: evidence(),
        authority: "SYNTHETIC_FIXTURE",
      });
      expect(transition.ok).toBe(true);
      if (!transition.ok || transition.result.kind !== "MUTATION") return;
      // Recreate the v5 edge shape while retaining the same encrypted-store
      // table layout; v5 labelled transition evidence as generic SUPPORTS.
      await db.run(
        "UPDATE assertion_evidence_link SET role='SUPPORTS' WHERE assertion_id=? AND evidence_id=?",
        assertion.id,
        transition.result.evidence[0]!.id,
      );
      sqlite.exec(
        "DROP TABLE relationship_temporal_support; PRAGMA user_version=5; BEGIN IMMEDIATE;",
      );
      await upgradeAssertionSchemaV6(db);
      expect((await db.all("PRAGMA foreign_key_check")).length).toBe(0);
      sqlite.exec("PRAGMA user_version=6; COMMIT;");
      expect(
        await db.get(
          "SELECT end_certainty,end_value FROM relationship_assertion_scope WHERE assertion_id=?",
          assertion.id,
        ),
      ).toMatchObject({ end_certainty: "EXACT", end_value: "2026" });
      expect(
        Number(
          (
            await db.get(
              "SELECT COUNT(*) AS count FROM relationship_temporal_support WHERE assertion_id=?",
              assertion.id,
            )
          )?.count,
        ),
      ).toBe(1);
      expect(
        await db.get(
          "SELECT role FROM assertion_evidence_link WHERE assertion_id=? AND evidence_id=?",
          assertion.id,
          transition.result.evidence[0]!.id,
        ),
      ).toMatchObject({ role: "CONTEXTUALIZES" });
      const originalDeleted = await memory(db, {
        operation: "DELETE_EVIDENCE",
        generation,
        memoryRevision: 2,
        evidenceId: proposed.result.evidence[0]!.id,
      });
      expect(originalDeleted.ok).toBe(true);
      expect(
        (await db.all("SELECT id FROM memory_assertion WHERE id=?", assertion.id)).length,
      ).toBe(0);
    } finally {
      sqlite.close();
    }
  });

  it("does not preserve an unattributable legacy temporal end as known truth", async () => {
    const { sqlite, db, contactId, generation } = await fixture();
    try {
      const proposed = await memory(db, {
        operation: "PROPOSE_RELATIONSHIP",
        generation,
        memoryRevision: 0,
        contactId,
        contactRevision: 1,
        context: {
          selection: "NEW",
          context: { kind: "GENERAL", organizationLabel: null, projectLabel: null },
        },
        episodeId: null,
        value: { predicate: "RELATIONSHIP_ROLE", role: "MANAGER", direction: "CONTACT" },
        validity: {
          start: { precision: "UNKNOWN" },
          end: { certainty: "UNKNOWN", bound: { precision: "UNKNOWN" } },
        },
        applicability: "CURRENT",
        evidence: evidence(),
      });
      expect(proposed.ok).toBe(true);
      if (!proposed.ok || proposed.result.kind !== "MUTATION") return;
      const assertion = proposed.result.assertions[0]!;
      const transition = await memory(db, {
        operation: "TRANSITION_RELATIONSHIP",
        generation,
        memoryRevision: 1,
        assertionId: assertion.id,
        assertionRevision: 1,
        end: { certainty: "EXACT", bound: { precision: "YEAR", value: "2026" } },
        evidence: evidence(),
        authority: "SYNTHETIC_FIXTURE",
      });
      expect(transition.ok).toBe(true);
      if (!transition.ok || transition.result.kind !== "MUTATION") return;
      await db.run(
        "UPDATE assertion_evidence_link SET role='SUPPORTS' WHERE assertion_id=? AND evidence_id=?",
        assertion.id,
        transition.result.evidence[0]!.id,
      );
      await db.run(
        "UPDATE memory_evidence SET recorded_at=? WHERE id=?",
        "2024-01-01T00:00:00.000Z",
        transition.result.evidence[0]!.id,
      );
      sqlite.exec(
        "DROP TABLE relationship_temporal_support; PRAGMA user_version=5; BEGIN IMMEDIATE;",
      );
      await upgradeAssertionSchemaV6(db);
      expect((await db.all("PRAGMA foreign_key_check")).length).toBe(0);
      sqlite.exec("PRAGMA user_version=6; COMMIT;");
      expect(
        await db.get("SELECT applicability FROM memory_assertion WHERE id=?", assertion.id),
      ).toMatchObject({ applicability: "UNKNOWN" });
      expect(
        await db.get(
          "SELECT end_certainty,end_value FROM relationship_assertion_scope WHERE assertion_id=?",
          assertion.id,
        ),
      ).toMatchObject({ end_certainty: "UNKNOWN", end_value: null });
    } finally {
      sqlite.close();
    }
  });

  it("atomically removes relationship subtypes and contexts on contact deletion", async () => {
    const { sqlite, db, contactId, generation } = await fixture();
    try {
      const proposed = await memory(db, {
        operation: "PROPOSE_RELATIONSHIP",
        generation,
        memoryRevision: 0,
        contactId,
        contactRevision: 1,
        context: {
          selection: "NEW",
          context: { kind: "PROJECT", organizationLabel: "Company A", projectLabel: "Project B" },
        },
        episodeId: null,
        value: { predicate: "RELATIONSHIP_ROLE", role: "TEAMMATE", direction: "SYMMETRIC" },
        validity: {
          start: { precision: "YEAR", value: "2022" },
          end: { certainty: "UNKNOWN", bound: { precision: "UNKNOWN" } },
        },
        applicability: "UNKNOWN",
        evidence: evidence(),
      });
      expect(proposed.ok).toBe(true);
      await db.run("DELETE FROM contact WHERE id=?", contactId);
      expect((await db.all("SELECT * FROM relationship_context")).length).toBe(0);
      expect((await db.all("SELECT * FROM relationship_assertion_scope")).length).toBe(0);
      expect((await db.all("SELECT * FROM relationship_evidence_scope")).length).toBe(0);
      expect((await db.all("PRAGMA foreign_key_check")).length).toBe(0);
    } finally {
      sqlite.close();
    }
  });

  it("keeps interval corrections scoped while conservatively blocking unknown overlap", async () => {
    const { sqlite, db, contactId, generation } = await fixture();
    try {
      const value = { predicate: "RELATIONSHIP_ROLE", role: "MANAGER", direction: "CONTACT" };
      const correctionInterval = {
        start: { precision: "YEAR", value: "2020" },
        end: { certainty: "EXACT", bound: { precision: "YEAR", value: "2023" } },
      };
      const original = await memory(db, {
        operation: "PROPOSE_RELATIONSHIP",
        generation,
        memoryRevision: 0,
        contactId,
        contactRevision: 1,
        context: {
          selection: "NEW",
          context: { kind: "GENERAL", organizationLabel: null, projectLabel: null },
        },
        episodeId: null,
        value,
        validity: correctionInterval,
        applicability: "HISTORICAL",
        evidence: evidence(),
      });
      expect(original.ok).toBe(true);
      if (!original.ok || original.result.kind !== "MUTATION") return;
      const target = original.result.assertions[0]!;
      const rejected = await memory(db, {
        operation: "DECIDE_RELATIONSHIP",
        generation,
        memoryRevision: 1,
        assertionId: target.id,
        assertionRevision: 1,
        decision: "REJECT",
        reach: "INTERVAL",
        correctionInterval,
        authority: "SYNTHETIC_FIXTURE",
      });
      expect(rejected.ok).toBe(true);
      if (rejected.ok && rejected.result.kind === "MUTATION")
        expect(rejected.result.decisions[0]?.relationshipInterval).toEqual(correctionInterval);
      const selector = { selection: "EXISTING", contextId: target.relationship?.contextId };
      const unknownOverlap = await memory(db, {
        operation: "PROPOSE_RELATIONSHIP",
        generation,
        memoryRevision: 2,
        contactId,
        contactRevision: 1,
        context: selector,
        episodeId: null,
        value,
        validity: {
          start: { precision: "UNKNOWN" },
          end: { certainty: "UNKNOWN", bound: { precision: "UNKNOWN" } },
        },
        applicability: "UNKNOWN",
        evidence: evidence(),
      });
      expect(unknownOverlap).toMatchObject({ ok: false, error: { code: "CONFLICT" } });
      const laterEpisode = await memory(db, {
        operation: "PROPOSE_RELATIONSHIP",
        generation,
        memoryRevision: 2,
        contactId,
        contactRevision: 1,
        context: selector,
        episodeId: null,
        value,
        validity: {
          start: { precision: "YEAR", value: "2024" },
          end: { certainty: "UNKNOWN", bound: { precision: "UNKNOWN" } },
        },
        applicability: "CURRENT",
        evidence: evidence(),
      });
      expect(laterEpisode.ok).toBe(true);
      expect((await db.all("PRAGMA foreign_key_check")).length).toBe(0);
    } finally {
      sqlite.close();
    }
  });

  it("binds bounded relationship pages to contact, predicate, context, as-of, generation and revision", async () => {
    const { sqlite, db, contactId, generation } = await fixture();
    try {
      const validity = {
        start: { precision: "YEAR", value: "2020" },
        end: { certainty: "UNKNOWN", bound: { precision: "UNKNOWN" } },
      };
      const first = await memory(db, {
        operation: "PROPOSE_RELATIONSHIP",
        generation,
        memoryRevision: 0,
        contactId,
        contactRevision: 1,
        context: {
          selection: "NEW",
          context: { kind: "GENERAL", organizationLabel: null, projectLabel: null },
        },
        episodeId: null,
        value: { predicate: "RELATIONSHIP_ROLE", role: "FRIEND", direction: "SYMMETRIC" },
        validity,
        applicability: "CURRENT",
        evidence: evidence(),
      });
      expect(first.ok).toBe(true);
      if (!first.ok || first.result.kind !== "MUTATION") return;
      const contextRef = first.result.assertions[0]?.relationship?.contextId;
      const second = await memory(db, {
        operation: "PROPOSE_RELATIONSHIP",
        generation,
        memoryRevision: 1,
        contactId,
        contactRevision: 1,
        context: { selection: "EXISTING", contextId: contextRef },
        episodeId: null,
        value: { predicate: "RELATIONSHIP_ROLE", role: "TEAMMATE", direction: "SYMMETRIC" },
        validity,
        applicability: "CURRENT",
        evidence: evidence(),
      });
      expect(second.ok).toBe(true);
      const filter = {
        contactId,
        predicate: "RELATIONSHIP_ROLE",
        relationshipContextId: contextRef,
        asOf: "2026-01-01T00:00:00Z",
      };
      const request = MemoryAssertionRequestSchema.parse({
        operation: "LIST",
        generation,
        memoryRevision: 2,
        recordType: "MEMORY_ASSERTION",
        cursor: null,
        limit: 1,
        filter,
      });
      if (request.operation !== "LIST") return;
      const firstPage = await listMemory(db, request);
      expect(firstPage.ok).toBe(true);
      if (!firstPage.ok || firstPage.result.kind !== "PAGE") return;
      expect(firstPage.result.records).toHaveLength(1);
      expect(
        firstPage.result.records[0]?.recordType === "MEMORY_ASSERTION" &&
          firstPage.result.records[0].effectiveApplicability,
      ).toBe("CURRENT");
      expect(firstPage.result.nextCursor).not.toBeNull();
      const nextPage = await listMemory(db, { ...request, cursor: firstPage.result.nextCursor });
      expect(nextPage.ok).toBe(true);
      if (nextPage.ok && nextPage.result.kind === "PAGE")
        expect(nextPage.result.records).toHaveLength(1);
      const changedFilter = await listMemory(db, {
        ...request,
        cursor: firstPage.result.nextCursor,
        filter: { ...request.filter!, predicate: "RELATIONSHIP_CATEGORY" },
      });
      expect(changedFilter).toMatchObject({ ok: false, error: { code: "CONFLICT" } });
    } finally {
      sqlite.close();
    }
  });

  it("treats a matching explicit negative as unresolved, not a different compatible role", async () => {
    const { sqlite, db, contactId, generation } = await fixture();
    try {
      const value = { predicate: "RELATIONSHIP_ROLE", role: "FRIEND", direction: "SYMMETRIC" };
      const proposed = await memory(db, {
        operation: "PROPOSE_RELATIONSHIP",
        generation,
        memoryRevision: 0,
        contactId,
        contactRevision: 1,
        context: {
          selection: "NEW",
          context: { kind: "GENERAL", organizationLabel: null, projectLabel: null },
        },
        episodeId: null,
        value,
        validity: {
          start: { precision: "UNKNOWN" },
          end: { certainty: "UNKNOWN", bound: { precision: "UNKNOWN" } },
        },
        applicability: "CURRENT",
        evidence: evidence(),
      });
      expect(proposed.ok).toBe(true);
      if (!proposed.ok || proposed.result.kind !== "MUTATION") return;
      const candidate = proposed.result.assertions[0]!;
      const negated = await memory(db, {
        operation: "ADD_RELATIONSHIP_EVIDENCE",
        generation,
        memoryRevision: 1,
        assertionId: candidate.id,
        assertionRevision: candidate.revision,
        evidenceValue: value,
        polarity: "NEGATIVE",
        role: "CONTRADICTS",
        evidence: evidence(),
      });
      expect(negated.ok).toBe(true);
      const confirmation = await memory(db, {
        operation: "DECIDE_RELATIONSHIP",
        generation,
        memoryRevision: 2,
        assertionId: candidate.id,
        assertionRevision: candidate.revision,
        decision: "CONFIRM",
        reach: "CURRENT",
        authority: "SYNTHETIC_FIXTURE",
      });
      expect(confirmation).toMatchObject({ ok: false, error: { code: "CONFLICT" } });
    } finally {
      sqlite.close();
    }
  });

  it("enforces 100 distinct episodes per contact without dropping existing history", async () => {
    const { sqlite, db, contactId, generation } = await fixture();
    try {
      let memoryRevision = 0;
      let contextRef: string | undefined;
      for (let index = 0; index < 100; index++) {
        const proposal = await memory(db, {
          operation: "PROPOSE_RELATIONSHIP",
          generation,
          memoryRevision,
          contactId,
          contactRevision: 1,
          context: contextRef
            ? { selection: "EXISTING", contextId: contextRef }
            : {
                selection: "NEW",
                context: { kind: "GENERAL", organizationLabel: null, projectLabel: null },
              },
          episodeId: null,
          value: { predicate: "RELATIONSHIP_ROLE", role: "TEAMMATE", direction: "SYMMETRIC" },
          validity: {
            start: { precision: "UNKNOWN" },
            end: { certainty: "UNKNOWN", bound: { precision: "UNKNOWN" } },
          },
          applicability: "UNKNOWN",
          evidence: evidence(),
        });
        expect(proposal.ok).toBe(true);
        if (!proposal.ok || proposal.result.kind !== "MUTATION") return;
        contextRef = proposal.result.assertions[0]?.relationship?.contextId;
        memoryRevision = proposal.result.memoryRevision;
      }
      const over = await memory(db, {
        operation: "PROPOSE_RELATIONSHIP",
        generation,
        memoryRevision,
        contactId,
        contactRevision: 1,
        context: { selection: "EXISTING", contextId: contextRef },
        episodeId: null,
        value: { predicate: "RELATIONSHIP_ROLE", role: "TEAMMATE", direction: "SYMMETRIC" },
        validity: {
          start: { precision: "UNKNOWN" },
          end: { certainty: "UNKNOWN", bound: { precision: "UNKNOWN" } },
        },
        applicability: "UNKNOWN",
        evidence: evidence(),
      });
      expect(over).toMatchObject({ ok: false, error: { code: "INVALID_REQUEST" } });
      expect(
        Number(
          (
            await db.get(
              "SELECT COUNT(DISTINCT episode_id) AS count FROM relationship_assertion_scope",
            )
          )?.count,
        ),
      ).toBe(100);
      expect((await db.all("PRAGMA foreign_key_check")).length).toBe(0);
    } finally {
      sqlite.close();
    }
  });

  it("caps retained versions for an exact relationship scope without capping compatible roles", async () => {
    const { sqlite, db, contactId, generation } = await fixture();
    try {
      const first = await memory(db, {
        operation: "PROPOSE_RELATIONSHIP",
        generation,
        memoryRevision: 0,
        contactId,
        contactRevision: 1,
        context: {
          selection: "NEW",
          context: { kind: "GENERAL", organizationLabel: null, projectLabel: null },
        },
        episodeId: null,
        value: { predicate: "RELATIONSHIP_ROLE", role: "FRIEND", direction: "SYMMETRIC" },
        validity: {
          start: { precision: "UNKNOWN" },
          end: { certainty: "UNKNOWN", bound: { precision: "UNKNOWN" } },
        },
        applicability: "UNKNOWN",
        evidence: evidence(),
      });
      expect(first.ok).toBe(true);
      if (!first.ok || first.result.kind !== "MUTATION") return;
      const source = first.result.assertions[0]!;
      await db.run("UPDATE memory_assertion SET lifecycle='SUPERSEDED' WHERE id=?", source.id);
      sqlite.exec("BEGIN IMMEDIATE;");
      for (let index = 0; index < 99; index++) {
        const id = randomUUID();
        await db.run(
          `INSERT INTO memory_assertion
           SELECT ?,context_id,subject_kind,subject_key,contact_id,predicate,preference_value,
                  acceptance,'SUPERSEDED',applicability,valid_time_precision,valid_time_value,
                  valid_time_end_exclusive,revision,replaces_assertion_id,reconsidered_decision_id,
                  created_at,updated_at FROM memory_assertion WHERE id=?`,
          id,
          source.id,
        );
        await db.run(
          "INSERT INTO relationship_assertion_scope SELECT ?,context_id,contact_id,context_ref,episode_id,category,role,direction,start_precision,start_value,end_certainty,end_precision,end_value FROM relationship_assertion_scope WHERE assertion_id=?",
          id,
          source.id,
        );
      }
      sqlite.exec("COMMIT;");
      const capped = await memory(db, {
        operation: "PROPOSE_RELATIONSHIP",
        generation,
        memoryRevision: 1,
        contactId,
        contactRevision: 1,
        context: { selection: "EXISTING", contextId: source.relationship?.contextId },
        episodeId: source.relationship?.episodeId,
        value: source.value,
        validity: source.relationship?.validity,
        applicability: "UNKNOWN",
        evidence: evidence(),
      });
      expect(capped).toMatchObject({ ok: false, error: { code: "INVALID_REQUEST" } });
      expect(
        Number((await db.get("SELECT COUNT(*) AS count FROM relationship_assertion_scope"))?.count),
      ).toBe(100);
      expect((await db.all("PRAGMA foreign_key_check")).length).toBe(0);
    } finally {
      sqlite.close();
    }
  });

  it("removes dependent relationship influence but retains independent support until its own deletion", async () => {
    const { sqlite, db, contextId, contactId, generation } = await fixture();
    try {
      const identityId = randomUUID();
      const associationId = randomUUID();
      const at = "2024-01-01T00:00:00Z";
      await db.run(
        "INSERT INTO platform_identity VALUES (?,?,?,?,?,?,?,?,?,?,?)",
        identityId,
        contextId,
        "synthetic",
        null,
        null,
        null,
        "Synthetic identity",
        "USER_ENTERED",
        1,
        at,
        at,
      );
      await db.run(
        "INSERT INTO identity_association VALUES (?,?,?,?,?,?,?,?,?,?)",
        associationId,
        contextId,
        identityId,
        contactId,
        "CONFIRMED",
        "USER_DECISION",
        1,
        at,
        at,
        null,
      );
      const value = { predicate: "RELATIONSHIP_ROLE", role: "COWORKER", direction: "SYMMETRIC" };
      const dependentInput = {
        ...evidence(),
        association: { associationId, associationRevision: 1 },
      };
      const proposed = await memory(db, {
        operation: "PROPOSE_RELATIONSHIP",
        generation,
        memoryRevision: 0,
        contactId,
        contactRevision: 1,
        context: {
          selection: "NEW",
          context: { kind: "GENERAL", organizationLabel: null, projectLabel: null },
        },
        episodeId: null,
        value,
        validity: {
          start: { precision: "UNKNOWN" },
          end: { certainty: "UNKNOWN", bound: { precision: "UNKNOWN" } },
        },
        applicability: "UNKNOWN",
        evidence: dependentInput,
      });
      expect(proposed.ok).toBe(true);
      if (!proposed.ok || proposed.result.kind !== "MUTATION") return;
      const claim = proposed.result.assertions[0]!;
      const independent = await memory(db, {
        operation: "ADD_RELATIONSHIP_EVIDENCE",
        generation,
        memoryRevision: 1,
        assertionId: claim.id,
        assertionRevision: claim.revision,
        evidenceValue: value,
        polarity: "POSITIVE",
        role: "SUPPORTS",
        evidence: evidence(),
      });
      expect(independent.ok).toBe(true);
      if (!independent.ok || independent.result.kind !== "MUTATION") return;
      const ended = await memory(db, {
        operation: "TRANSITION_RELATIONSHIP",
        generation,
        memoryRevision: 2,
        assertionId: claim.id,
        assertionRevision: claim.revision,
        end: { certainty: "EXACT", bound: { precision: "YEAR", value: "2026" } },
        evidence: { ...evidence(), association: { associationId, associationRevision: 1 } },
        authority: "SYNTHETIC_FIXTURE",
      });
      expect(ended.ok).toBe(true);
      expect(await invalidateAssociationEvidence(db, contextId, associationId, 1)).toBe(true);
      expect((await db.all("SELECT id FROM memory_assertion WHERE id=?", claim.id)).length).toBe(1);
      expect(
        (await db.all("SELECT id FROM memory_evidence WHERE association_id=?", associationId))
          .length,
      ).toBe(0);
      expect(
        await db.get(
          "SELECT end_certainty,end_value FROM relationship_assertion_scope WHERE assertion_id=?",
          claim.id,
        ),
      ).toMatchObject({ end_certainty: "UNKNOWN", end_value: null });
      expect(
        await db.get("SELECT applicability FROM memory_assertion WHERE id=?", claim.id),
      ).toMatchObject({ applicability: "UNKNOWN" });
      await db.run("UPDATE local_context SET memory_revision=memory_revision+1 WHERE singleton=1");
      const finalSupport = independent.result.evidence[0]!;
      const deleted = await memory(db, {
        operation: "DELETE_EVIDENCE",
        generation,
        memoryRevision: 4,
        evidenceId: finalSupport.id,
      });
      expect(deleted.ok).toBe(true);
      expect((await db.all("SELECT id FROM memory_assertion WHERE id=?", claim.id)).length).toBe(0);
      expect(
        (await db.all("SELECT id FROM relationship_context WHERE contact_id=?", contactId)).length,
      ).toBe(0);
      expect((await db.all("PRAGMA foreign_key_check")).length).toBe(0);
    } finally {
      sqlite.close();
    }
  });

  it("distinguishes a factual role correction from a real-world end, then permits a later new episode", async () => {
    const { sqlite, db, contactId, generation } = await fixture();
    try {
      const oldValue = { predicate: "RELATIONSHIP_ROLE", role: "MANAGER", direction: "CONTACT" };
      const validity = {
        start: { precision: "YEAR", value: "2020" },
        end: { certainty: "UNKNOWN", bound: { precision: "UNKNOWN" } },
      };
      const oldProposal = await memory(db, {
        operation: "PROPOSE_RELATIONSHIP",
        generation,
        memoryRevision: 0,
        contactId,
        contactRevision: 1,
        context: {
          selection: "NEW",
          context: { kind: "ORGANIZATION", organizationLabel: "Company A", projectLabel: null },
        },
        episodeId: null,
        value: oldValue,
        validity,
        applicability: "CURRENT",
        evidence: evidence(),
      });
      expect(oldProposal.ok).toBe(true);
      if (!oldProposal.ok || oldProposal.result.kind !== "MUTATION") return;
      const old = oldProposal.result.assertions[0]!;
      const correct = await memory(db, {
        operation: "CORRECT_RELATIONSHIP",
        generation,
        memoryRevision: 1,
        assertionId: old.id,
        assertionRevision: old.revision,
        contactId,
        contactRevision: 1,
        context: { selection: "EXISTING", contextId: old.relationship?.contextId },
        episodeId: old.relationship?.episodeId,
        value: { predicate: "RELATIONSHIP_ROLE", role: "COWORKER", direction: "SYMMETRIC" },
        validity,
        reach: "ALL_HISTORY",
        evidence: evidence(),
        authority: "SYNTHETIC_FIXTURE",
      });
      expect(correct.ok).toBe(true);
      if (!correct.ok || correct.result.kind !== "MUTATION") return;
      expect(correct.result.assertions[0]?.acceptance).toBe("REJECTED");
      expect(correct.result.assertions[0]?.applicability).toBe("UNKNOWN");
      expect(correct.result.assertions[1]?.acceptance).toBe("CONFIRMED");
      expect(correct.result.assertions[1]?.value).toMatchObject({ role: "COWORKER" });
      expect(correct.result.decisions[0]?.operation).toBe("FACT_CORRECT");
      const oldBypass = await memory(db, {
        operation: "PROPOSE_RELATIONSHIP",
        generation,
        memoryRevision: 2,
        contactId,
        contactRevision: 1,
        context: { selection: "EXISTING", contextId: old.relationship?.contextId },
        episodeId: null,
        value: oldValue,
        validity,
        applicability: "CURRENT",
        evidence: evidence(),
      });
      expect(oldBypass).toMatchObject({ ok: false, error: { code: "CONFLICT" } });
      const coworker = correct.result.assertions[1]!;
      const ended = await memory(db, {
        operation: "TRANSITION_RELATIONSHIP",
        generation,
        memoryRevision: 2,
        assertionId: coworker.id,
        assertionRevision: coworker.revision,
        end: { certainty: "WITHIN", bound: { precision: "YEAR", value: "2023" } },
        evidence: evidence(),
        authority: "SYNTHETIC_FIXTURE",
      });
      expect(ended.ok).toBe(true);
      const returned = await memory(db, {
        operation: "PROPOSE_RELATIONSHIP",
        generation,
        memoryRevision: 3,
        contactId,
        contactRevision: 1,
        context: { selection: "EXISTING", contextId: old.relationship?.contextId },
        episodeId: null,
        value: { predicate: "RELATIONSHIP_ROLE", role: "COWORKER", direction: "SYMMETRIC" },
        validity: {
          start: { precision: "YEAR", value: "2024" },
          end: { certainty: "UNKNOWN", bound: { precision: "UNKNOWN" } },
        },
        applicability: "CURRENT",
        evidence: evidence(),
      });
      expect(returned.ok).toBe(true);
      if (returned.ok && returned.result.kind === "MUTATION")
        expect(returned.result.assertions[0]?.relationship?.episodeId).not.toBe(
          coworker.relationship?.episodeId,
        );
      expect((await db.all("PRAGMA foreign_key_check")).length).toBe(0);
    } finally {
      sqlite.close();
    }
  });

  it("keeps broad category confidence and acceptance separate from specific role review", async () => {
    const { sqlite, db, contactId, generation } = await fixture();
    try {
      const validity = {
        start: { precision: "UNKNOWN" },
        end: { certainty: "UNKNOWN", bound: { precision: "UNKNOWN" } },
      };
      const broad = await memory(db, {
        operation: "PROPOSE_RELATIONSHIP",
        generation,
        memoryRevision: 0,
        contactId,
        contactRevision: 1,
        context: {
          selection: "NEW",
          context: { kind: "GENERAL", organizationLabel: null, projectLabel: null },
        },
        episodeId: null,
        value: {
          predicate: "RELATIONSHIP_CATEGORY",
          category: "PROFESSIONAL",
          direction: "SYMMETRIC",
        },
        validity,
        applicability: "UNKNOWN",
        evidence: {
          ...evidence(),
          confidence: { extraction: null, attribution: null, predicate: 0.96 },
        },
      });
      expect(broad.ok).toBe(true);
      if (!broad.ok || broad.result.kind !== "MUTATION") return;
      const specific = await memory(db, {
        operation: "PROPOSE_RELATIONSHIP",
        generation,
        memoryRevision: 1,
        contactId,
        contactRevision: 1,
        context: {
          selection: "EXISTING",
          contextId: broad.result.assertions[0]?.relationship?.contextId,
        },
        episodeId: null,
        value: { predicate: "RELATIONSHIP_ROLE", role: "MANAGER", direction: "CONTACT" },
        validity,
        applicability: "UNKNOWN",
        evidence: {
          ...evidence(),
          confidence: { extraction: null, attribution: null, predicate: 0.68 },
        },
      });
      expect(specific.ok).toBe(true);
      if (!specific.ok || specific.result.kind !== "MUTATION") return;
      expect(broad.result.evidence[0]?.confidence.predicate).toBe(0.96);
      expect(specific.result.evidence[0]?.confidence.predicate).toBe(0.68);
      const confirmedRole = await memory(db, {
        operation: "DECIDE_RELATIONSHIP",
        generation,
        memoryRevision: 2,
        assertionId: specific.result.assertions[0]?.id,
        assertionRevision: 1,
        decision: "CONFIRM",
        reach: "CURRENT",
        authority: "SYNTHETIC_FIXTURE",
      });
      expect(confirmedRole.ok).toBe(true);
      expect(
        (
          await db.get(
            "SELECT acceptance FROM memory_assertion WHERE id=?",
            broad.result.assertions[0]?.id,
          )
        )?.acceptance,
      ).toBe("CANDIDATE");
      expect(
        (
          await db.get(
            "SELECT acceptance FROM memory_assertion WHERE id=?",
            specific.result.assertions[0]?.id,
          )
        )?.acceptance,
      ).toBe("CONFIRMED");
    } finally {
      sqlite.close();
    }
  });

  it("retains friend, coworker and teammate simultaneously with no main role", async () => {
    const { sqlite, db, contactId, generation } = await fixture();
    try {
      let contextRef: string | undefined;
      for (const [index, role] of ["FRIEND", "COWORKER", "TEAMMATE"].entries()) {
        const proposed = await memory(db, {
          operation: "PROPOSE_RELATIONSHIP",
          generation,
          memoryRevision: index,
          contactId,
          contactRevision: 1,
          context: contextRef
            ? { selection: "EXISTING", contextId: contextRef }
            : {
                selection: "NEW",
                context: { kind: "GENERAL", organizationLabel: null, projectLabel: null },
              },
          episodeId: null,
          value: { predicate: "RELATIONSHIP_ROLE", role, direction: "SYMMETRIC" },
          validity: {
            start: { precision: "UNKNOWN" },
            end: { certainty: "UNKNOWN", bound: { precision: "UNKNOWN" } },
          },
          applicability: "UNKNOWN",
          evidence: evidence(),
        });
        expect(proposed.ok).toBe(true);
        if (!proposed.ok || proposed.result.kind !== "MUTATION") return;
        expect(proposed.result.assertions[0]?.acceptance).toBe("CANDIDATE");
        contextRef = proposed.result.assertions[0]?.relationship?.contextId;
      }
      expect(
        (
          await db.all(
            "SELECT role FROM relationship_assertion_scope WHERE context_ref=? ORDER BY role",
            contextRef,
          )
        ).map((row) => row.role),
      ).toEqual(["COWORKER", "FRIEND", "TEAMMATE"]);
    } finally {
      sqlite.close();
    }
  });

  it("distinguishes 'not now' from 'never' without fabricating a historical end", async () => {
    const { sqlite, db, contactId, generation } = await fixture();
    try {
      const value = { predicate: "RELATIONSHIP_ROLE", role: "MANAGER", direction: "CONTACT" };
      const validity = {
        start: { precision: "UNKNOWN" },
        end: { certainty: "UNKNOWN", bound: { precision: "UNKNOWN" } },
      };
      const proposed = await memory(db, {
        operation: "PROPOSE_RELATIONSHIP",
        generation,
        memoryRevision: 0,
        contactId,
        contactRevision: 1,
        context: {
          selection: "NEW",
          context: { kind: "GENERAL", organizationLabel: null, projectLabel: null },
        },
        episodeId: null,
        value,
        validity,
        applicability: "CURRENT",
        evidence: evidence(),
      });
      expect(proposed.ok).toBe(true);
      if (!proposed.ok || proposed.result.kind !== "MUTATION") return;
      const candidate = proposed.result.assertions[0]!;
      const accepted = await memory(db, {
        operation: "DECIDE_RELATIONSHIP",
        generation,
        memoryRevision: 1,
        assertionId: candidate.id,
        assertionRevision: 1,
        decision: "CONFIRM",
        reach: "CURRENT",
        authority: "SYNTHETIC_FIXTURE",
      });
      expect(accepted.ok).toBe(true);
      const notNow = await memory(db, {
        operation: "DECIDE_RELATIONSHIP",
        generation,
        memoryRevision: 2,
        assertionId: candidate.id,
        assertionRevision: 2,
        decision: "REJECT",
        reach: "CURRENT",
        authority: "SYNTHETIC_FIXTURE",
      });
      expect(notNow.ok).toBe(true);
      if (!notNow.ok || notNow.result.kind !== "MUTATION") return;
      expect(notNow.result.assertions[0]?.acceptance).toBe("CONFIRMED");
      expect(notNow.result.assertions[0]?.applicability).toBe("HISTORICAL");
      expect(notNow.result.assertions[0]?.relationship?.validity.end).toEqual({
        certainty: "UNKNOWN",
        bound: { precision: "UNKNOWN" },
      });
      const currentBypass = await memory(db, {
        operation: "PROPOSE_RELATIONSHIP",
        generation,
        memoryRevision: 3,
        contactId,
        contactRevision: 1,
        context: { selection: "EXISTING", contextId: candidate.relationship?.contextId },
        episodeId: null,
        value,
        validity,
        applicability: "CURRENT",
        evidence: evidence(),
      });
      expect(currentBypass).toMatchObject({ ok: false, error: { code: "CONFLICT" } });
      const never = await memory(db, {
        operation: "DECIDE_RELATIONSHIP",
        generation,
        memoryRevision: 3,
        assertionId: candidate.id,
        assertionRevision: 3,
        decision: "REJECT",
        reach: "ALL_HISTORY",
        authority: "SYNTHETIC_FIXTURE",
      });
      expect(never.ok).toBe(true);
      if (never.ok && never.result.kind === "MUTATION") {
        expect(never.result.assertions[0]?.acceptance).toBe("REJECTED");
        expect(never.result.assertions[0]?.applicability).toBe("UNKNOWN");
      }
    } finally {
      sqlite.close();
    }
  });

  it("reconsiders a current-only correction as a new candidate without reconfirming it or erasing accepted history", async () => {
    const { sqlite, db, contactId, generation } = await fixture();
    try {
      const proposed = await memory(db, {
        operation: "PROPOSE_RELATIONSHIP",
        generation,
        memoryRevision: 0,
        contactId,
        contactRevision: 1,
        context: {
          selection: "NEW",
          context: { kind: "GENERAL", organizationLabel: null, projectLabel: null },
        },
        episodeId: null,
        value: { predicate: "RELATIONSHIP_ROLE", role: "CLIENT", direction: "LOCAL_USER" },
        validity: {
          start: { precision: "UNKNOWN" },
          end: { certainty: "UNKNOWN", bound: { precision: "UNKNOWN" } },
        },
        applicability: "CURRENT",
        evidence: evidence(),
      });
      expect(proposed.ok).toBe(true);
      if (!proposed.ok || proposed.result.kind !== "MUTATION") return;
      const first = proposed.result.assertions[0]!;
      const confirmed = await memory(db, {
        operation: "DECIDE_RELATIONSHIP",
        generation,
        memoryRevision: 1,
        assertionId: first.id,
        assertionRevision: 1,
        decision: "CONFIRM",
        reach: "CURRENT",
        authority: "SYNTHETIC_FIXTURE",
      });
      expect(confirmed.ok).toBe(true);
      const notNow = await memory(db, {
        operation: "DECIDE_RELATIONSHIP",
        generation,
        memoryRevision: 2,
        assertionId: first.id,
        assertionRevision: 2,
        decision: "REJECT",
        reach: "CURRENT",
        authority: "SYNTHETIC_FIXTURE",
      });
      expect(notNow.ok).toBe(true);
      if (!notNow.ok || notNow.result.kind !== "MUTATION") return;
      const reconsidered = await memory(db, {
        operation: "RECONSIDER_RELATIONSHIP",
        generation,
        memoryRevision: 3,
        assertionId: first.id,
        assertionRevision: 3,
        decisionId: notNow.result.decisions[0]?.id,
        evidence: evidence(),
      });
      expect(reconsidered.ok).toBe(true);
      if (!reconsidered.ok || reconsidered.result.kind !== "MUTATION") return;
      expect(reconsidered.result.assertions).toHaveLength(1);
      expect(reconsidered.result.assertions[0]?.acceptance).toBe("CANDIDATE");
      expect(reconsidered.result.assertions[0]?.relationship?.episodeId).not.toBe(
        first.relationship?.episodeId,
      );
      expect(
        await db.get("SELECT acceptance,applicability FROM memory_assertion WHERE id=?", first.id),
      ).toMatchObject({
        acceptance: "CONFIRMED",
        applicability: "HISTORICAL",
      });
    } finally {
      sqlite.close();
    }
  });
});
