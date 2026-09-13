export {
  createSkillEngine,
  eligibleSkillLanguages,
  validateSkillRegistry,
  type SkillEngine,
} from "./engine.js";
export { initialSkillRegistry } from "./registry.js";
export {
  calculateSkillEvaluationMetrics,
  type SkillEvaluationMetrics,
  type SkillEvaluationObservation,
} from "./evaluation.js";

export { SkillDefinitionSchema, type SkillDefinition } from "@ai-message-coach/contracts";

import { SkillDefinitionSchema, type SkillDefinition } from "@ai-message-coach/contracts";

export function parseSkillDefinition(input: unknown): SkillDefinition {
  return SkillDefinitionSchema.parse(input);
}
