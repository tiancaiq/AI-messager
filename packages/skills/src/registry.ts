import { validateSkillRegistry } from "./engine.js";
import { approvedSkillDefinitions } from "./generated/approved-registry.js";

// Preserve the public boundary, runtime validation and deep immutability.
export const initialSkillRegistry = validateSkillRegistry(approvedSkillDefinitions);
