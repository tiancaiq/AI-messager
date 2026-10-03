// Labels are deliberately separate from raw product input. No future retriever may import this file.
export interface CapabilityChallengeAnnotation {
  id: `C${number}`;
  lane: "CAPABILITY";
  required: string[];
  acceptable: string[];
  forbidden: string[];
  strictNone: boolean;
  primary: string[];
  shouldRankAbove: Array<[string, string]>;
}

export interface ModifierChallengeAnnotation {
  id: `M${number}`;
  lane: "MODIFIER";
  underlyingCapabilities: string[];
  requiredModifiers: string[];
  acceptableModifiers: string[];
  forbiddenModifiers: string[];
}

export type ChallengeAnnotation = CapabilityChallengeAnnotation | ModifierChallengeAnnotation;

function cap(
  id: CapabilityChallengeAnnotation["id"],
  required: string[],
  forbidden: string[] = [],
  acceptable: string[] = [],
  primary: string[] = [],
  shouldRankAbove: Array<[string, string]> = [],
): CapabilityChallengeAnnotation {
  return {
    id,
    lane: "CAPABILITY",
    required,
    acceptable,
    forbidden,
    strictNone: required.length === 0,
    primary,
    shouldRankAbove,
  };
}

function mod(
  id: ModifierChallengeAnnotation["id"],
  underlyingCapabilities: string[],
  requiredModifiers: string[],
  forbiddenModifiers: string[] = [],
  acceptableModifiers: string[] = [],
): ModifierChallengeAnnotation {
  return {
    id,
    lane: "MODIFIER",
    underlyingCapabilities,
    requiredModifiers,
    acceptableModifiers,
    forbiddenModifiers,
  };
}

export const srs3eChallengeAnnotations: readonly ChallengeAnnotation[] = [
  cap("C01", ["apology"], [], ["acknowledge_mistake"]),
  cap("C02", ["apology", "acknowledge_mistake"]),
  cap("C03", ["acknowledge_mistake"], ["apology"]),
  cap("C04", ["acknowledge_mistake"], ["apology"]),
  cap("C05", ["emotional_validation", "reassurance"]),
  cap("C06", ["emotional_validation"], ["reassurance"]),
  cap("C07", ["reassurance"], [], ["emotional_validation"]),
  cap("C08", ["reassurance"], [], ["emotional_validation"]),
  cap("C09", ["boundary_setting", "de_escalation"]),
  cap("C10", ["boundary_setting", "decline"], ["de_escalation"]),
  cap("C11", ["de_escalation"], ["boundary_setting"]),
  cap("C12", ["de_escalation"], ["boundary_setting"]),
  cap("C13", ["decline"], ["boundary_setting", "de_escalation"]),
  cap("C14", ["decline"], ["boundary_setting", "planning"]),
  cap("C15", ["ask_for_help"], ["clarification"], ["request"]),
  cap("C16", ["ask_for_help"], [], ["request"]),
  cap("C17", ["follow_up", "request"]),
  cap("C18", ["follow_up"], ["status_update"], ["request"]),
  cap("C19", ["status_update", "expectation_setting"]),
  cap(
    "C20",
    ["status_update"],
    ["expectation_setting", "planning", "request", "emotional_validation"],
  ),
  cap("C21", ["expectation_setting"], ["status_update", "planning"]),
  cap("C22", ["expectation_setting"], ["planning"]),
  cap("C23", ["planning", "request"]),
  cap("C24", ["planning", "expectation_setting"]),
  cap("C25", ["clarification"], [], ["request"]),
  cap("C26", ["clarification"], ["ask_for_help"], ["request"]),
  cap("C27", ["request"], ["ask_for_help", "follow_up", "clarification"]),
  cap("C28", ["request"], ["boundary_setting"]),
  cap("C29", ["acknowledge_mistake"], ["apology"]),
  cap("C30", ["apology"], ["acknowledge_mistake"]),
  cap("C31", ["emotional_validation"], ["reassurance"]),
  cap(
    "C32",
    ["reassurance"],
    [],
    ["emotional_validation"],
    ["reassurance"],
    [["reassurance", "emotional_validation"]],
  ),
  cap("C33", ["decline"], ["boundary_setting"]),
  cap("C34", ["de_escalation"], ["boundary_setting", "acknowledge_mistake"]),
  cap("C35", ["boundary_setting", "decline"], ["de_escalation"]),
  cap("C36", ["request"], ["ask_for_help"]),
  cap("C37", ["request"], ["follow_up"]),
  cap("C38", ["status_update"], ["expectation_setting"]),
  cap("C39", ["planning", "request"], ["expectation_setting", "decline"]),
  cap("C40", ["status_update"], ["planning", "expectation_setting"]),
  cap("C41", ["clarification"], [], ["request"], ["clarification"], [["clarification", "request"]]),
  cap("C42", ["request"], ["clarification"]),
  cap("C43", ["clarification"], [], ["request"]),
  cap("C44", ["boundary_setting"]),
  cap("C45", ["status_update"], ["expectation_setting"]),
  cap("C46", ["planning"]),
  cap("C47", []),
  cap("C48", []),
  cap("C49", []),
  cap("C50", []),
  cap("C51", []),
  cap("C52", []),
  mod("M01", ["status_update"], ["en.professional_conciseness"], ["en.casual_naturalness"]),
  mod("M02", ["planning"], ["en.casual_naturalness"], ["en.professional_conciseness"]),
  mod("M03", ["planning"], ["en.casual_naturalness"], ["en.professional_conciseness"]),
  mod("M04", ["status_update"], ["en.professional_conciseness"], ["en.casual_naturalness"]),
  mod("M05", ["decline"], ["en.direct_but_polite"]),
  mod("M06", ["status_update"], ["en.professional_conciseness"], ["en.direct_but_polite"]),
  mod("M07", ["request"], ["zh.politeness_calibration"], ["zh.professional_formality"]),
  mod("M08", ["status_update"], ["zh.professional_formality"], ["zh.politeness_calibration"]),
  mod("M09", ["status_update"], ["zh.professional_formality"], ["zh.natural_conciseness"]),
  mod("M10", ["planning"], ["zh.natural_conciseness"], ["zh.professional_formality"]),
  mod("M11", ["planning"], ["zh.natural_conciseness"], ["zh.professional_formality"]),
  mod("M12", ["planning"], ["zh.code_switching"], ["zh.natural_conciseness"]),
  mod("M13", ["request"], ["zh.code_switching"], ["zh.natural_conciseness"]),
  mod("M14", ["planning"], ["zh.natural_conciseness"], ["zh.code_switching"]),
  mod("M15", ["request"], ["en.direct_but_polite"]),
  mod("M16", ["decline"], ["zh.politeness_calibration"], ["zh.professional_formality"]),
];
