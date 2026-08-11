import {
  CoachResultSchema,
  ConversationObservationSchema,
  SkillDefinitionSchema,
} from "@ai-message-coach/contracts";
import { describe, expect, it } from "vitest";

import {
  invalidCoachResultFixture,
  syntheticObservationFixture,
  validCoachResultFixture,
  validSkillFixture,
} from "./index.js";

describe("synthetic workspace fixtures", () => {
  it("keeps valid fixtures aligned with shared schemas", () => {
    expect(CoachResultSchema.safeParse(validCoachResultFixture).success).toBe(true);
    expect(ConversationObservationSchema.safeParse(syntheticObservationFixture).success).toBe(true);
    expect(SkillDefinitionSchema.safeParse(validSkillFixture).success).toBe(true);
  });

  it("provides an intentionally invalid result boundary fixture", () => {
    expect(CoachResultSchema.safeParse(invalidCoachResultFixture).success).toBe(false);
  });
});
