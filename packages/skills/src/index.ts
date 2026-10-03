export {
  createSkillEngine,
  eligibleSkillLanguages,
  validateSkillRegistry,
  type SkillEngine,
} from "./engine.js";
export { initialSkillRegistry } from "./registry.js";
export {
  approvedCatalogFingerprint,
  createApprovedSkillCatalogSnapshot,
  validateApprovedSkillCatalogSnapshot,
} from "./catalog-snapshot.js";
export {
  communicationSignalIds,
  assessCommunicationNeeds,
  createEvidenceAwareSkillAssessor,
} from "./communication-signals.js";
export {
  createEvidenceAwareSkillSelector,
  selectEvidenceAwareSkills,
} from "./evidence-aware-selector.js";
export {
  createDeterministicSkillAssessor,
  validateCommunicationAssessment,
  validateSkillPlan,
  validateSkillSelectionResult,
  type ApprovedSkillCatalogSnapshot,
  type SkillAssessmentPort,
  type SkillPlanCompiler,
  type SkillSelector,
} from "./agent-skill-boundary.js";
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
