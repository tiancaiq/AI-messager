import { describe, expect, it } from "vitest";

import {
  CommunicationGuidanceSchema,
  CommunicationPlanSchema,
  SkillDefinitionSchema,
} from "./skills.js";

const validSkill = {
  id: "status_update",
  name: "Status update",
  description: "State current progress without inventing facts.",
  languages: ["universal"],
  situations: ["status_request"],
  intents: ["provide_status"],
  actions: ["REWRITE_DRAFT", "SUGGEST_REPLY"],
  useWhen: ["Visible context asks for current progress."],
  doNotUseWhen: ["No status information is visible."],
  principles: ["State only the known current status."],
  avoid: ["Do not invent progress or timing."],
  compatibleSkills: ["expectation_setting"],
  conflictingSkills: [],
  version: 1,
  status: "ACTIVE",
} as const;

describe("Phase 4 skill contracts", () => {
  it("keeps generator guidance compact and rejects selection metadata", () => {
    expect(
      CommunicationGuidanceSchema.parse({
        principles: ["State known facts clearly."],
        avoid: ["Do not invent dates."],
      }),
    ).toEqual({
      principles: ["State known facts clearly."],
      avoid: ["Do not invent dates."],
    });
    expect(
      CommunicationGuidanceSchema.safeParse({
        principles: [],
        avoid: [],
        selectedSkills: [{ id: "status_update", version: 1, reasons: ["Matched status."] }],
      }).success,
    ).toBe(false);
  });

  it("accepts a strict atomic versioned definition", () => {
    expect(SkillDefinitionSchema.parse(validSkill)).toEqual(validSkill);
  });

  it.each(["SUGGEST_ACTIONS", "ASK_CLARIFICATION", "NO_REPLY_NEEDED"])(
    "rejects a communication skill targeting the non-wording action %s",
    (action) => {
      expect(SkillDefinitionSchema.safeParse({ ...validSkill, actions: [action] }).success).toBe(
        false,
      );
    },
  );

  it("rejects speculative relationship metadata and invalid versions", () => {
    expect(
      SkillDefinitionSchema.safeParse({ ...validSkill, relationship: "manager" }).success,
    ).toBe(false);
    expect(SkillDefinitionSchema.safeParse({ ...validSkill, version: 0 }).success).toBe(false);
  });

  it("rejects duplicate metadata, self references, and mixed compatibility", () => {
    expect(
      SkillDefinitionSchema.safeParse({
        ...validSkill,
        languages: ["universal", "universal"],
      }).success,
    ).toBe(false);
    expect(
      SkillDefinitionSchema.safeParse({
        ...validSkill,
        compatibleSkills: [validSkill.id],
      }).success,
    ).toBe(false);
    expect(
      SkillDefinitionSchema.safeParse({
        ...validSkill,
        compatibleSkills: ["expectation_setting"],
        conflictingSkills: ["expectation_setting"],
      }).success,
    ).toBe(false);
  });

  it("distinguishes selected, empty, and failed communication plans", () => {
    expect(
      CommunicationPlanSchema.safeParse({
        status: "SELECTED",
        selectedSkills: [],
        principles: [],
        avoid: [],
      }).success,
    ).toBe(false);
    for (const status of ["NONE", "FAILED"] as const) {
      expect(
        CommunicationPlanSchema.parse({
          status,
          selectedSkills: [],
          principles: [],
          avoid: [],
        }).status,
      ).toBe(status);
    }
    expect(
      CommunicationPlanSchema.safeParse({
        status: "FAILED",
        selectedSkills: [],
        principles: ["Hidden stale guidance."],
        avoid: [],
      }).success,
    ).toBe(false);
  });
});
