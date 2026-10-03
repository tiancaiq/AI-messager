export interface SemanticCalibrationAnnotation {
  id: `K${number}`;
  required: string[];
  acceptable: string[];
  forbidden: string[];
  strictNone: boolean;
}

function label(
  id: SemanticCalibrationAnnotation["id"],
  required: string[] = [],
  acceptable: string[] = [],
  forbidden: string[] = [],
): SemanticCalibrationAnnotation {
  return { id, required, acceptable, forbidden, strictNone: required.length === 0 };
}

// Independently joined only after raw observation; never imported by a retriever.
export const srs3eSemanticCalibrationAnnotations: readonly SemanticCalibrationAnnotation[] = [
  label("K01"),
  label("K02"),
  label("K03"),
  label("K04"),
  label("K05"),
  label("K06"),
  label("K07"),
  label("K08"),
  label("K09"),
  label("K10"),
  label("K11"),
  label("K12"),
  label("K13", ["acknowledge_mistake"], [], ["apology"]),
  label("K14", ["apology"], ["acknowledge_mistake"]),
  label("K15", ["emotional_validation"], [], ["reassurance"]),
  label("K16", ["reassurance"], ["emotional_validation"]),
  label("K17", ["decline"], [], ["boundary_setting"]),
  label("K18", ["boundary_setting", "decline"], [], ["de_escalation"]),
  label("K19", ["follow_up", "request"]),
  label("K20", ["request"], [], ["follow_up"]),
  label("K21", ["planning"], [], ["expectation_setting"]),
  label("K22", ["expectation_setting"], [], ["planning", "status_update"]),
  label("K23", ["clarification"], ["request"]),
  label("K24", ["status_update"], [], ["expectation_setting"]),
];
