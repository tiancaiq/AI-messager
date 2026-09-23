import { describe, expect, it } from "vitest";

import { classifyRelationshipAt, relationshipIntervalsMayOverlap } from "./relationship-policy.js";

describe("relationship as-of policy", () => {
  it("does not turn an unknown end or partial start into a proven current role", () => {
    const validity = {
      start: { precision: "CALENDAR_MONTH" as const, value: "2020-05" },
      end: { certainty: "UNKNOWN" as const, bound: { precision: "UNKNOWN" as const } },
    };
    expect(classifyRelationshipAt(validity, "UNKNOWN", "2026-01-01T00:00:00Z")).toBe("UNKNOWN");
    expect(classifyRelationshipAt(validity, "CURRENT", "2020-05-15T00:00:00Z")).toBe("UNKNOWN");
    expect(classifyRelationshipAt(validity, "CURRENT", "2026-01-01T00:00:00Z")).toBe("CURRENT");
  });

  it("keeps a within-year end uncertain until the whole year has passed", () => {
    const validity = {
      start: { precision: "YEAR" as const, value: "2020" },
      end: { certainty: "WITHIN" as const, bound: { precision: "YEAR" as const, value: "2023" } },
    };
    expect(classifyRelationshipAt(validity, "CURRENT", "2023-06-01T00:00:00Z")).toBe("UNKNOWN");
    expect(classifyRelationshipAt(validity, "CURRENT", "2024-01-01T00:00:00Z")).toBe("HISTORICAL");
  });

  it("treats exact end instants as exclusive and retains explicit date-less history", () => {
    const instant = {
      start: { precision: "INSTANT" as const, value: "2024-01-01T00:00:00+08:00" },
      end: {
        certainty: "EXACT" as const,
        bound: { precision: "INSTANT" as const, value: "2024-06-01T00:00:00+08:00" },
      },
    };
    expect(classifyRelationshipAt(instant, "CURRENT", "2024-05-31T15:59:59Z")).toBe("CURRENT");
    expect(classifyRelationshipAt(instant, "CURRENT", "2024-05-31T16:00:00Z")).toBe("HISTORICAL");
    expect(
      classifyRelationshipAt(
        {
          start: { precision: "UNKNOWN" },
          end: { certainty: "UNKNOWN", bound: { precision: "UNKNOWN" } },
        },
        "HISTORICAL",
        "2026-01-01T00:00:00Z",
      ),
    ).toBe("HISTORICAL");
  });
  it("resolves a known historical interval at an earlier as-of time", () => {
    const validity = {
      start: { precision: "YEAR" as const, value: "2024" },
      end: { certainty: "EXACT" as const, bound: { precision: "YEAR" as const, value: "2026" } },
    };
    expect(classifyRelationshipAt(validity, "HISTORICAL", "2025-06-01T00:00:00Z")).toBe("CURRENT");
    expect(classifyRelationshipAt(validity, "HISTORICAL", "2026-01-01T00:00:00Z")).toBe(
      "HISTORICAL",
    );
    expect(classifyRelationshipAt(validity, "UNKNOWN", "2025-06-01T00:00:00Z")).toBe("UNKNOWN");
    expect(
      classifyRelationshipAt(
        {
          start: { precision: "UNKNOWN" },
          end: validity.end,
        },
        "HISTORICAL",
        "2025-06-01T00:00:00Z",
      ),
    ).toBe("UNKNOWN");
  });
  it("treats partial-time overlap conservatively for scoped corrections", () => {
    const during2023 = {
      start: { precision: "YEAR" as const, value: "2023" },
      end: { certainty: "WITHIN" as const, bound: { precision: "YEAR" as const, value: "2023" } },
    };
    const from2024 = {
      start: { precision: "YEAR" as const, value: "2024" },
      end: { certainty: "UNKNOWN" as const, bound: { precision: "UNKNOWN" as const } },
    };
    expect(relationshipIntervalsMayOverlap(during2023, from2024)).toBe(false);
    expect(
      relationshipIntervalsMayOverlap(during2023, {
        start: { precision: "UNKNOWN" },
        end: { certainty: "UNKNOWN", bound: { precision: "UNKNOWN" } },
      }),
    ).toBe(true);
  });
});
