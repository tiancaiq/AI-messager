import { describe, expect, it } from "vitest";

import {
  RelationshipClaimSchema,
  RelationshipContextInputSchema,
  RelationshipValiditySchema,
  RelationshipValueSchema,
} from "./relationship.js";

const contactId = "00000000-0000-4000-8000-000000000001";

describe("relationship contracts", () => {
  it("distinguishes directed and symmetric roles with a fixed vocabulary", () => {
    expect(
      RelationshipValueSchema.safeParse({
        predicate: "RELATIONSHIP_ROLE",
        role: "MANAGER",
        direction: "CONTACT",
      }).success,
    ).toBe(true);
    expect(
      RelationshipValueSchema.safeParse({
        predicate: "RELATIONSHIP_ROLE",
        role: "MANAGER",
        direction: "SYMMETRIC",
      }).success,
    ).toBe(false);
    expect(
      RelationshipValueSchema.safeParse({
        predicate: "RELATIONSHIP_ROLE",
        role: "FRIEND",
        direction: "SYMMETRIC",
      }).success,
    ).toBe(true);
    expect(
      RelationshipValueSchema.safeParse({
        predicate: "RELATIONSHIP_ROLE",
        role: "PARTNER",
        direction: "SYMMETRIC",
      }).success,
    ).toBe(false);
    for (const role of ["ROMANTIC_PARTNER", "SPOUSE", "FAMILY"])
      expect(
        RelationshipValueSchema.safeParse({
          predicate: "RELATIONSHIP_ROLE",
          role,
          direction: "SYMMETRIC",
        }).success,
      ).toBe(true);
    expect(
      RelationshipValueSchema.safeParse({
        predicate: "RELATIONSHIP_CATEGORY",
        category: "PERSONAL",
        direction: "SYMMETRIC",
      }).success,
    ).toBe(true);
  });

  it("requires exact context labels without guessing scope", () => {
    expect(
      RelationshipContextInputSchema.safeParse({
        kind: "GENERAL",
        organizationLabel: null,
        projectLabel: null,
      }).success,
    ).toBe(true);
    expect(
      RelationshipContextInputSchema.safeParse({
        kind: "PROJECT",
        organizationLabel: "A",
        projectLabel: null,
      }).success,
    ).toBe(false);
    expect(
      RelationshipContextInputSchema.safeParse({
        kind: "UNKNOWN",
        organizationLabel: "A",
        projectLabel: null,
      }).success,
    ).toBe(false);
    expect(
      RelationshipContextInputSchema.safeParse({
        kind: "ORGANIZATION",
        organizationLabel: "😀".repeat(121),
        projectLabel: null,
      }).success,
    ).toBe(false);
    expect(
      RelationshipContextInputSchema.safeParse({
        kind: "ORGANIZATION",
        organizationLabel: "😀".repeat(120),
        projectLabel: null,
      }).success,
    ).toBe(true);
    expect(
      RelationshipContextInputSchema.safeParse({
        kind: "PROJECT",
        organizationLabel: "😀".repeat(120),
        projectLabel: "😀".repeat(120),
      }).success,
    ).toBe(false);
  });

  it("keeps unknown and within-year boundaries without inventing dates", () => {
    const validity = {
      start: { precision: "UNKNOWN" },
      end: { certainty: "WITHIN", bound: { precision: "YEAR", value: "2023" } },
    };
    expect(RelationshipValiditySchema.parse(validity)).toEqual(validity);
    expect(
      RelationshipValiditySchema.safeParse({
        start: { precision: "INSTANT", value: "2024-06-01T00:00:00+08:00" },
        end: {
          certainty: "EXACT",
          bound: { precision: "INSTANT", value: "2024-06-01T00:00:00+08:00" },
        },
      }).success,
    ).toBe(false);
    expect(
      RelationshipValiditySchema.safeParse({
        start: { precision: "YEAR", value: "2024" },
        end: { certainty: "EXACT", bound: { precision: "CALENDAR_MONTH", value: "2024-01" } },
      }).success,
    ).toBe(false);
  });

  it("validates one contact and explicit episode intent", () => {
    expect(
      RelationshipClaimSchema.safeParse({
        value: { predicate: "RELATIONSHIP_ROLE", role: "FRIEND", direction: "SYMMETRIC" },
        contactId,
        contactRevision: 1,
        context: {
          selection: "NEW",
          context: { kind: "GENERAL", organizationLabel: null, projectLabel: null },
        },
        episodeId: null,
        validity: {
          start: { precision: "UNKNOWN" },
          end: { certainty: "UNKNOWN", bound: { precision: "UNKNOWN" } },
        },
      }).success,
    ).toBe(true);
  });
});
