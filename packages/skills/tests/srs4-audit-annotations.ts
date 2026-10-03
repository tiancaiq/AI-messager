import type { Srs4AuditRaw } from "../../test-fixtures/src/srs4-audit-raw.js";

export interface Srs4AuditAnnotation {
  id: Srs4AuditRaw["id"];
  reviewedRevision: "R1";
  required: readonly string[];
  acceptable: readonly string[];
  forbidden: readonly string[];
  strictNone: boolean;
}

type Seed = [Srs4AuditRaw["id"], readonly string[], readonly string[], readonly string[]];

// Authored from raw user/OTHER evidence before any SRS-4 model observation. The
// forbidden column is explicit and never inferred from absent labels.
const seeds: readonly Seed[] = [
  ["A01", ["apology"], [], ["acknowledge_mistake"]],
  ["A02", ["acknowledge_mistake"], [], ["apology", "reassurance"]],
  ["A03", ["ask_for_help"], ["request"], ["follow_up"]],
  ["A04", ["boundary_setting"], ["decline"], ["de_escalation"]],
  ["A05", ["clarification"], [], ["request", "planning"]],
  ["A06", ["de_escalation"], ["emotional_validation"], ["boundary_setting"]],
  ["A07", ["decline"], [], ["boundary_setting"]],
  ["A08", ["emotional_validation"], [], ["reassurance"]],
  ["A09", ["expectation_setting"], [], ["status_update", "planning"]],
  ["A10", ["follow_up"], [], ["request"]],
  ["A11", ["planning"], ["request"], ["expectation_setting", "status_update"]],
  ["A12", ["reassurance"], [], ["emotional_validation", "expectation_setting"]],
  ["A13", ["request"], [], ["follow_up", "clarification"]],
  ["A14", ["status_update"], [], ["planning", "expectation_setting"]],
  ["A15", ["apology"], ["acknowledge_mistake"], ["planning"]],
  ["A16", ["acknowledge_mistake"], [], ["apology", "expectation_setting"]],
  ["A17", ["ask_for_help"], ["request"], ["follow_up"]],
  ["A18", ["boundary_setting"], ["decline"], ["de_escalation"]],
  ["A19", ["clarification"], [], ["request", "planning"]],
  ["A20", ["de_escalation"], ["emotional_validation"], ["boundary_setting"]],
  ["A21", ["decline"], [], ["boundary_setting"]],
  ["A22", ["emotional_validation"], [], ["reassurance"]],
  ["A23", ["expectation_setting"], [], ["status_update", "planning"]],
  ["A24", ["follow_up"], [], ["request"]],
  ["A25", ["apology", "acknowledge_mistake"], [], ["reassurance"]],
  ["A26", ["request", "clarification"], [], ["follow_up"]],
  ["A27", ["status_update", "expectation_setting"], [], ["planning"]],
  ["A28", ["de_escalation", "emotional_validation"], [], ["boundary_setting"]],
  ["A29", ["planning", "request"], [], ["follow_up", "expectation_setting"]],
  ["A30", ["decline", "boundary_setting"], [], ["de_escalation"]],
  ["A31", ["apology", "status_update"], ["acknowledge_mistake"], ["planning"]],
  ["A32", ["acknowledge_mistake", "planning"], [], ["apology", "status_update"]],
  ["A33", ["ask_for_help", "request"], [], ["follow_up"]],
  ["A34", ["emotional_validation", "reassurance"], [], ["expectation_setting"]],
  ["A35", ["follow_up", "expectation_setting"], [], ["request", "status_update"]],
  ["A36", ["request", "planning"], [], ["follow_up", "status_update"]],
  ["A37", ["boundary_setting", "de_escalation"], ["decline"], []],
  ["A38", ["status_update", "planning"], [], ["expectation_setting"]],
  ["A39", ["reassurance", "expectation_setting"], [], ["planning", "status_update"]],
  ["A40", ["request", "clarification"], [], ["follow_up"]],
  ["A41", [], [], ["follow_up"]],
  ["A42", [], [], ["status_update"]],
  ["A43", [], [], ["reassurance"]],
  ["A44", [], [], ["status_update"]],
  ["A45", [], [], ["emotional_validation"]],
  ["A46", [], [], ["status_update"]],
  ["A47", [], [], ["apology"]],
  ["A48", [], [], ["status_update"]],
  ["A49", [], [], ["follow_up"]],
  ["A50", [], [], ["request"]],
  ["A51", [], [], ["emotional_validation"]],
  ["A52", [], [], ["planning"]],
  ["A53", [], [], ["status_update"]],
  ["A54", [], [], ["reassurance"]],
  ["A55", [], [], ["follow_up"]],
  ["A56", [], [], ["de_escalation"]],
  ["A57", [], [], []],
  ["A58", [], [], []],
  ["A59", [], [], []],
  ["A60", [], [], []],
  ["A61", [], [], []],
  ["A62", [], [], []],
  ["A63", [], [], []],
  ["A64", [], [], []],
];

export const srs4AuditAnnotations: readonly Srs4AuditAnnotation[] = seeds.map(
  ([id, required, acceptable, forbidden]) => ({
    id,
    reviewedRevision: "R1",
    required,
    acceptable,
    forbidden,
    strictNone: required.length === 0 && acceptable.length === 0,
  }),
);
