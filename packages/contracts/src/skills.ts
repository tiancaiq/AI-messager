import { z } from "zod";

import { AgentActionSchema } from "./coaching.js";

export const SkillStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);
export const SkillLanguageSchema = z.enum(["universal", "en", "zh"]);
export const SkillSituationTagSchema = z.enum([
  "mistake",
  "missed_commitment",
  "status_request",
  "emotional_support",
  "pressure",
  "conflict",
  "planning",
  "invitation",
  "follow_up",
  "request",
]);
export const SkillIntentTagSchema = z.enum([
  "apologize",
  "acknowledge_mistake",
  "validate_emotion",
  "reassure",
  "set_boundary",
  "de_escalate",
  "decline",
  "ask_for_help",
  "follow_up",
  "provide_status",
  "set_expectation",
  "plan",
  "clarify",
  "make_request",
  "acknowledge_perspective",
  "give_feedback",
]);

const SkillIdSchema = z
  .string()
  .trim()
  .regex(/^(?:(?:en|zh)\.)?[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/)
  .max(80);
const unique = <T>(values: readonly T[]): boolean => new Set(values).size === values.length;

export const SkillDefinitionSchema = z
  .object({
    id: SkillIdSchema,
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().min(1).max(500),
    languages: z.array(SkillLanguageSchema).min(1).max(3),
    situations: z.array(SkillSituationTagSchema).max(10),
    intents: z.array(SkillIntentTagSchema).max(10),
    actions: z.array(AgentActionSchema).min(1).max(6),
    useWhen: z.array(z.string().trim().min(1).max(300)).min(1).max(6),
    doNotUseWhen: z.array(z.string().trim().min(1).max(300)).max(6),
    principles: z.array(z.string().trim().min(1).max(300)).min(1).max(6),
    avoid: z.array(z.string().trim().min(1).max(300)).max(6),
    compatibleSkills: z.array(SkillIdSchema).max(12),
    conflictingSkills: z.array(SkillIdSchema).max(12),
    version: z.number().int().positive().max(10_000),
    status: SkillStatusSchema,
  })
  .strict()
  .superRefine((skill, context) => {
    const uniqueFields: [string, readonly unknown[]][] = [
      ["languages", skill.languages],
      ["situations", skill.situations],
      ["intents", skill.intents],
      ["actions", skill.actions],
      ["compatibleSkills", skill.compatibleSkills],
      ["conflictingSkills", skill.conflictingSkills],
    ];
    for (const [field, values] of uniqueFields) {
      if (!unique(values))
        context.addIssue({ code: "custom", message: `${field} must be unique.`, path: [field] });
    }
    if (skill.compatibleSkills.includes(skill.id) || skill.conflictingSkills.includes(skill.id))
      context.addIssue({
        code: "custom",
        message: "A skill cannot reference itself.",
        path: ["id"],
      });
    if (skill.compatibleSkills.some((id) => skill.conflictingSkills.includes(id)))
      context.addIssue({
        code: "custom",
        message: "Compatibility and conflicts cannot overlap.",
        path: ["conflictingSkills"],
      });
  });

export const SkillContextSchema = z
  .object({
    action: AgentActionSchema,
    intent: z.string().trim().min(1).max(500).nullable(),
    situationTags: z.array(SkillSituationTagSchema).max(10),
    intentTags: z.array(SkillIntentTagSchema).max(10),
    language: z
      .object({
        primary: z.string().trim().min(2).max(35).nullable(),
        secondary: z.string().trim().min(2).max(35).nullable(),
        codeSwitching: z.boolean(),
      })
      .strict(),
    draftPresent: z.boolean(),
    ambiguityMaterial: z.boolean(),
  })
  .strict();

export const SelectedSkillSchema = z
  .object({
    id: SkillIdSchema,
    version: z.number().int().positive().max(10_000),
    reasons: z.array(z.string().trim().min(1).max(240)).min(1).max(4),
  })
  .strict();

const CommunicationPrinciplesSchema = z.array(z.string().trim().min(1).max(300)).max(12);

export const CommunicationGuidanceSchema = z
  .object({
    principles: CommunicationPrinciplesSchema,
    avoid: CommunicationPrinciplesSchema,
  })
  .strict()
  .superRefine((guidance, context) => {
    for (const [field, values] of [
      ["principles", guidance.principles],
      ["avoid", guidance.avoid],
    ] as const) {
      if (!unique(values))
        context.addIssue({ code: "custom", message: `${field} must be unique.`, path: [field] });
    }
  });

export const CommunicationPlanSchema = z
  .object({
    status: z.enum(["SELECTED", "NONE", "FAILED"]),
    selectedSkills: z.array(SelectedSkillSchema).max(4),
    principles: CommunicationPrinciplesSchema,
    avoid: CommunicationPrinciplesSchema,
  })
  .strict()
  .superRefine((plan, context) => {
    if ((plan.status === "SELECTED") !== plan.selectedSkills.length > 0) {
      context.addIssue({
        code: "custom",
        message: "SELECTED requires skills and NONE/FAILED require none.",
        path: ["status"],
      });
    }
    if (plan.status !== "SELECTED" && (plan.principles.length > 0 || plan.avoid.length > 0)) {
      context.addIssue({
        code: "custom",
        message: "NONE/FAILED plans cannot contain communication guidance.",
        path: ["status"],
      });
    }
    for (const [field, values] of [
      ["selectedSkills", plan.selectedSkills.map((skill) => skill.id)],
      ["principles", plan.principles],
      ["avoid", plan.avoid],
    ] as const) {
      if (!unique(values))
        context.addIssue({ code: "custom", message: `${field} must be unique.`, path: [field] });
    }
  });

export type SkillStatus = z.infer<typeof SkillStatusSchema>;
export type SkillLanguage = z.infer<typeof SkillLanguageSchema>;
export type SkillSituationTag = z.infer<typeof SkillSituationTagSchema>;
export type SkillIntentTag = z.infer<typeof SkillIntentTagSchema>;
export type SkillDefinition = z.infer<typeof SkillDefinitionSchema>;
export type SkillContext = z.infer<typeof SkillContextSchema>;
export type SelectedSkill = z.infer<typeof SelectedSkillSchema>;
export type CommunicationGuidance = z.infer<typeof CommunicationGuidanceSchema>;
export type CommunicationPlan = z.infer<typeof CommunicationPlanSchema>;
