import { SkillDefinitionSchema, type SkillDefinition } from "@ai-message-coach/contracts";

export function parseSkillDefinition(input: unknown): SkillDefinition {
  return SkillDefinitionSchema.parse(input);
}
