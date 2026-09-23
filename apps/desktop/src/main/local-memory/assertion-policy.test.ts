import { describe, expect, it } from "vitest";

import { addSupport, canReconsider, decideCandidate, supersede } from "./assertion-policy.js";

describe("memory assertion policy", () => {
  const candidate = {
    acceptance: "CANDIDATE" as const,
    lifecycle: "ACTIVE" as const,
    applicability: "CURRENT" as const,
  };

  it("does not promote candidates merely because evidence was added", () => {
    expect(addSupport(candidate)).toEqual(candidate);
  });

  it("requires an explicit candidate decision and keeps rejection distinct", () => {
    expect(decideCandidate(candidate, "CONFIRM")?.acceptance).toBe("CONFIRMED");
    const rejected = decideCandidate(candidate, "REJECT");
    expect(rejected?.acceptance).toBe("REJECTED");
    expect(decideCandidate(rejected!, "CONFIRM")).toBeUndefined();
    expect(canReconsider(rejected!)).toBe(true);
  });

  it("marks replaced claims historical without deleting them", () => {
    expect(supersede(candidate)).toEqual({
      acceptance: "CANDIDATE",
      lifecycle: "SUPERSEDED",
      applicability: "HISTORICAL",
    });
  });
});
