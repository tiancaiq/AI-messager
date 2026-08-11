import { validSkillFixture } from "@ai-message-coach/test-fixtures";
import { describe, expect, it } from "vitest";

import { parseSkillDefinition } from "./index.js";

describe("skills package boundary", () => {
  it("uses the shared contract to validate a synthetic definition", () => {
    expect(parseSkillDefinition(validSkillFixture)).toEqual(validSkillFixture);
  });

  it("does not accept a draft definition with missing metadata", () => {
    expect(() => parseSkillDefinition({ id: "draft" })).toThrow();
  });
});
