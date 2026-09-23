import { describe, expect, it } from "vitest";

import {
  ContactDirectoryRequestSchema,
  ContactDirectoryResultSchema,
  ContactLabelSchema,
  CreateContactRequestSchema,
  CreateIdentityRequestSchema,
  ListDirectoryRequestSchema,
} from "./contact-directory.js";

const generation = "00000000-0000-4000-8000-000000000001";
const version = { generation, directoryRevision: 0 };

describe("contact directory contracts", () => {
  it("permits duplicate labels as independent strict contact requests", () => {
    const first = CreateContactRequestSchema.parse({
      operation: "CREATE_CONTACT",
      ...version,
      label: "Alex",
    });
    const second = CreateContactRequestSchema.parse({
      operation: "CREATE_CONTACT",
      ...version,
      label: "Alex",
    });
    expect(first.label).toBe(second.label);
  });

  it("requires an identity label or identifier and rejects renderer authority", () => {
    expect(
      CreateIdentityRequestSchema.safeParse({
        operation: "CREATE_IDENTITY",
        ...version,
        platform: "OTHER",
      }).success,
    ).toBe(false);
    expect(
      CreateIdentityRequestSchema.safeParse({
        operation: "CREATE_IDENTITY",
        ...version,
        displayLabel: "Synthetic person",
        verified: true,
        origin: "VERIFIED_ACCOUNT",
      }).success,
    ).toBe(false);
  });

  it("enforces character, byte, page, cursor, and unknown-field bounds", () => {
    expect(ContactLabelSchema.safeParse("😀".repeat(120)).success).toBe(true);
    expect(ContactLabelSchema.safeParse("界".repeat(120)).success).toBe(true);
    expect(ContactLabelSchema.safeParse("界".repeat(121)).success).toBe(false);
    expect(
      ListDirectoryRequestSchema.safeParse({
        operation: "LIST",
        ...version,
        recordType: "CONTACT",
        limit: 21,
      }).success,
    ).toBe(false);
    expect(
      ListDirectoryRequestSchema.safeParse({
        operation: "LIST",
        ...version,
        recordType: "CONTACT",
        cursor: "x".repeat(513),
      }).success,
    ).toBe(false);
    expect(
      ContactDirectoryRequestSchema.safeParse({
        operation: "CREATE_CONTACT",
        ...version,
        label: "Alex",
        sql: "SELECT * FROM contact",
      }).success,
    ).toBe(false);
  });

  it("accepts only explicit association transitions and bounded response shapes", () => {
    expect(
      ContactDirectoryRequestSchema.safeParse({
        operation: "DECIDE_ASSOCIATION",
        ...version,
        associationId: "00000000-0000-4000-8000-000000000010",
        associationRevision: 1,
        decision: "CONFIRM",
      }).success,
    ).toBe(true);
    expect(
      ContactDirectoryRequestSchema.safeParse({
        operation: "DECIDE_ASSOCIATION",
        ...version,
        associationId: "00000000-0000-4000-8000-000000000010",
        associationRevision: 1,
        decision: "AUTO_MERGE",
      }).success,
    ).toBe(false);
    expect(
      ContactDirectoryResultSchema.safeParse({
        ok: true,
        result: {
          kind: "PAGE",
          ...version,
          recordType: "CONTACT",
          records: [],
          nextCursor: null,
          keyHex: "11".repeat(32),
        },
      }).success,
    ).toBe(false);
    expect(
      ContactDirectoryResultSchema.safeParse({
        ok: true,
        result: {
          kind: "PAGE",
          ...version,
          recordType: "CONTACT",
          records: [
            {
              recordType: "PLATFORM_IDENTITY",
              id: "00000000-0000-4000-8000-000000000011",
              platform: null,
              namespace: null,
              identifierKind: null,
              identifierValue: "alex",
              displayLabel: null,
              origin: "USER_ENTERED",
              revision: 1,
              createdAt: "2026-09-14T10:00:00.000Z",
              updatedAt: "2026-09-14T10:00:00.000Z",
            },
          ],
          nextCursor: null,
        },
      }).success,
    ).toBe(false);
  });
});
