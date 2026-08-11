import { z } from "zod";

export const SkillKindSchema = z.enum(["ATOMIC", "PLAYBOOK"]);
export const SkillStatusSchema = z.enum(["APPROVED", "ACTIVE", "DEPRECATED"]);
export const SkillLanguageSchema = z.enum(["universal", "en", "zh-Hans", "zh-Hant"]);

export const SkillDefinitionSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    name: z.string().min(1),
    description: z.string().min(1),
    kind: SkillKindSchema,
    status: SkillStatusSchema,
    languages: z.array(SkillLanguageSchema).min(1),
    domains: z.array(z.string().min(1)),
    relationships: z.array(z.string().min(1)),
    situations: z.array(z.string().min(1)),
    useWhen: z.array(z.string().min(1)),
    doNotUseWhen: z.array(z.string().min(1)),
    principles: z.array(z.string().min(1)),
    avoid: z.array(z.string().min(1)),
    requiredContext: z.array(z.string().min(1)),
    optionalContext: z.array(z.string().min(1)),
    compatibleSkills: z.array(z.string().min(1)),
    conflictingSkills: z.array(z.string().min(1)),
    dependsOn: z.array(z.string().min(1)),
    version: z.number().int().positive(),
  })
  .strict();

export type SkillDefinition = z.infer<typeof SkillDefinitionSchema>;
