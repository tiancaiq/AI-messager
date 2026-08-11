import { describe, expect, it } from "vitest";

import {
  AgentActionSchema,
  CoachResultSchema,
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

const confidences = {
  identity: 0.1,
  relationship: 0.8,
  situation: 0.9,
  userIntent: 0.7,
  otherIntent: 0.6,
  language: 1,
  skillSelection: 0.75,
};

describe("foundational contracts", () => {
  it.each(actions)("accepts the %s action", (action) => {
    expect(AgentActionSchema.parse(action)).toBe(action);
  });

  it("rejects confidence outside the calibrated range", () => {
    expect(ConfidenceSchema.safeParse(-0.01).success).toBe(false);
    expect(ConfidenceSchema.safeParse(1.01).success).toBe(false);
  });

  it("validates a minimal coach result envelope", () => {
    expect(
      CoachResultSchema.parse({
        action: "SUGGEST_REPLY",
        confidences,
      }),
    ).toEqual({ action: "SUGGEST_REPLY", confidences });
  });

  it("rejects a coach result with a missing confidence dimension", () => {
    const incompleteConfidences = {
      identity: 0.1,
      relationship: 0.8,
      situation: 0.9,
      userIntent: 0.7,
      otherIntent: 0.6,
      skillSelection: 0.75,
    };

    expect(
      CoachResultSchema.safeParse({
        action: "SUGGEST_REPLY",
        confidences: incompleteConfidences,
      }).success,
    ).toBe(false);
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
