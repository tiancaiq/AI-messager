import { describe, expect, it } from "vitest";

import {
  MemoryAssertionRequestSchema,
  MemoryEvidenceInputSchema,
  MemoryTemporalValueSchema,
} from "./memory-assertion.js";

const generation = "00000000-0000-4000-8000-000000000001";
const contactId = "00000000-0000-4000-8000-000000000002";
const evidence = {
  source: "SYNTHETIC_FIXTURE" as const,
  sourceReference: "synthetic-observation-1",
  sourceTime: { precision: "CALENDAR_MONTH" as const, value: "2026-09" },
  confidence: { extraction: 0.8, attribution: 0.7, predicate: 0.9 },
  association: null,
};

describe("memory assertion contracts", () => {
  it("accepts only the bounded predicate and typed value family", () => {
    expect(
      MemoryAssertionRequestSchema.safeParse({
        operation: "PROPOSE",
        generation,
        memoryRevision: 0,
        subject: { kind: "CONTACT", contactId },
        contactRevision: 1,
        value: "CONCISE",
        applicability: "CURRENT",
        validTime: { precision: "UNKNOWN" },
        evidence,
      }).success,
    ).toBe(true);
    expect(
      MemoryAssertionRequestSchema.safeParse({
        operation: "PROPOSE",
        generation,
        memoryRevision: 0,
        subject: { kind: "LOCAL_USER" },
        contactRevision: null,
        predicate: "ARBITRARY_FACT",
        value: { text: "raw conversation" },
        applicability: "CURRENT",
        validTime: { precision: "UNKNOWN" },
        evidence,
      }).success,
    ).toBe(false);
  });

  it("retains declared time precision and rejects invented or malformed instants", () => {
    expect(MemoryTemporalValueSchema.parse({ precision: "UNKNOWN" })).toEqual({
      precision: "UNKNOWN",
    });
    expect(
      MemoryTemporalValueSchema.parse({ precision: "CALENDAR_DATE", value: "2026-09-15" }),
    ).toEqual({ precision: "CALENDAR_DATE", value: "2026-09-15" });
    expect(
      MemoryTemporalValueSchema.safeParse({
        precision: "CALENDAR_MONTH",
        value: "2026-09",
        endExclusive: "2026-12",
      }).success,
    ).toBe(true);
    expect(
      MemoryTemporalValueSchema.safeParse({
        precision: "CALENDAR_MONTH",
        value: "2026-09",
        endExclusive: "2026-09",
      }).success,
    ).toBe(false);
    expect(
      MemoryTemporalValueSchema.safeParse({ precision: "INSTANT", value: "2026-09-15" }).success,
    ).toBe(false);
    expect(
      MemoryTemporalValueSchema.safeParse({
        precision: "CALENDAR_DATE",
        value: "2026-02-30",
      }).success,
    ).toBe(false);
  });

  it("rejects raw payloads, SQL, and mismatched contact revision shape", () => {
    expect(
      MemoryEvidenceInputSchema.safeParse({ ...evidence, rawText: "private message" }).success,
    ).toBe(false);
    expect(
      MemoryAssertionRequestSchema.safeParse({
        operation: "ADD_EVIDENCE",
        generation,
        memoryRevision: 0,
        assertionId: contactId,
        assertionRevision: 1,
        evidenceValue: "DETAILED",
        role: "OVERWRITE",
        evidence,
      }).success,
    ).toBe(false);
    expect(
      MemoryAssertionRequestSchema.safeParse({
        operation: "PROPOSE",
        generation,
        memoryRevision: 0,
        subject: { kind: "LOCAL_USER" },
        contactRevision: 1,
        value: "BALANCED",
        applicability: "UNKNOWN",
        validTime: { precision: "UNKNOWN" },
        evidence,
      }).success,
    ).toBe(false);
    expect(
      MemoryAssertionRequestSchema.safeParse({
        operation: "LIST",
        generation,
        memoryRevision: 0,
        recordType: "MEMORY_ASSERTION",
        limit: 21,
        sql: "SELECT * FROM memory_assertion",
      }).success,
    ).toBe(false);
  });
});
