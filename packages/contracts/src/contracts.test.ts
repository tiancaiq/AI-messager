import { describe, expect, it } from "vitest";

import {
  AgentActionSchema,
  ConfidenceSchema,
  HealthResponseSchema,
  SkillDefinitionSchema,
} from "./index.js";

const actions = [
  "REWRITE_DRAFT",
  "COMPLETE_DRAFT",
  "SUGGEST_REPLY",
  "SUGGEST_ACTIONS",
  "ASK_CLARIFICATION",
  "NO_REPLY_NEEDED",
] as const;

describe("foundational contracts", () => {
  it.each(actions)("accepts the %s action", (action) => {
    expect(AgentActionSchema.parse(action)).toBe(action);
  });

  it("rejects confidence outside the model-estimate range", () => {
    expect(ConfidenceSchema.safeParse(-0.01).success).toBe(false);
    expect(ConfidenceSchema.safeParse(1.01).success).toBe(false);
  });

  it("validates only the public health payload", () => {
    expect(HealthResponseSchema.parse({ status: "ok" })).toEqual({ status: "ok" });
    expect(HealthResponseSchema.safeParse({ status: "ok", detail: "internal" }).success).toBe(
      false,
    );
  });

  it("rejects malformed foundational skill definitions", () => {
    expect(
      SkillDefinitionSchema.safeParse({
        id: "Not Valid",
        name: "Invalid",
        description: "Missing required metadata",
      }).success,
    ).toBe(false);
  });
});
