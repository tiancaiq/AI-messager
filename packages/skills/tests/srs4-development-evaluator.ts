import type { AgentAction } from "@ai-message-coach/contracts";
import type { SkillSelection } from "./srs4-supervisor.js";

// Annotation joins happen after raw observations. Unlisted IDs stay UNLABELED.
export interface DevelopmentLabel {
  key: string;
  action: AgentAction;
  required: readonly string[];
  acceptable: readonly string[];
  forbidden: readonly string[];
  strictNone: boolean;
}
export interface DevelopmentObservation {
  key: string;
  candidateIds: readonly string[];
  semanticRanks: Readonly<Record<string, number>>;
  hardEligibility: Readonly<Record<string, boolean>>;
  provenanceGrounded: Readonly<Record<string, boolean>>;
  selection: SkillSelection | null;
  stage: "SUPERVISOR" | "STRUCTURAL_EMPTY" | "UNSUPPORTED_LANGUAGE" | "EMPTY_QUERY";
}

export interface DevelopmentMetrics {
  scenarios: number;
  positive: number;
  requiredTotal: number;
  requiredAvailable: number;
  requiredProvenanceBlocked: number;
  requiredGroundedAvailable: number;
  requiredGroundedSelected: number;
  requiredSelected: number;
  fullyRetrievablePositive: number;
  fullyGroundedRetrievablePositive: number;
  allRequiredSelectedWhenFullyGrounded: number;
  allRequiredSelectedPositive: number;
  allRequiredSelectedWhenFullyRetrievable: number;
  atLeastOneRequiredSelectedPositive: number;
  positiveReturnedNone: number;
  multiPositive: number;
  multiFullyRetrievable: number;
  multiFullyGroundedRetrievable: number;
  multiAllSelectedWhenFullyGrounded: number;
  multiAllSelectedWhenFullyRetrievable: number;
  multiAtLeastOneAvailableSelected: number;
  wordingNoneTotal: number;
  wordingNoneCorrect: number;
  structuralTotal: number;
  structuralCorrect: number;
  forbiddenAvailable: number;
  forbiddenSelected: number;
  forbiddenRank1Selected: number;
  supportedLabeledSelected: number;
  forbiddenLabeledSelected: number;
  unlabeledSelected: number;
  unlabeledSelectionIds: string[];
  failed: number;
  selectedCountDistribution: Record<"0" | "1" | "2" | "3" | "4", number>;
  perSkill: Record<
    string,
    { requiredAvailable: number; requiredSelected: number; forbiddenRejected: number }
  >;
  byAction: Record<
    string,
    {
      scenarios: number;
      requiredTotal: number;
      requiredAvailable: number;
      requiredProvenanceBlocked: number;
      requiredGroundedAvailable: number;
      requiredGroundedSelected: number;
      requiredSelected: number;
      wordingNoneTotal: number;
      wordingNoneCorrect: number;
    }
  >;
  requiredDiagnostics: Array<{
    key: string;
    skillId: string;
    rank: number | null;
    stage:
      | "HARD_ELIGIBILITY"
      | "RETRIEVAL_TOP10_MISS"
      | "PROVENANCE_GROUNDING_BLOCKED"
      | "SUPERVISOR_REQUIRED_MISS"
      | "FOUND";
  }>;
}

export function evaluateSupervisorDevelopment(
  observations: readonly DevelopmentObservation[],
  labels: readonly DevelopmentLabel[],
): DevelopmentMetrics {
  const byKey = new Map(observations.map((row) => [row.key, row]));
  if (byKey.size !== observations.length || labels.length !== observations.length)
    throw Error("SRS-4 development observation/label count mismatch");
  const result: DevelopmentMetrics = {
    scenarios: observations.length,
    positive: 0,
    requiredTotal: 0,
    requiredAvailable: 0,
    requiredProvenanceBlocked: 0,
    requiredGroundedAvailable: 0,
    requiredGroundedSelected: 0,
    requiredSelected: 0,
    fullyRetrievablePositive: 0,
    fullyGroundedRetrievablePositive: 0,
    allRequiredSelectedWhenFullyGrounded: 0,
    allRequiredSelectedPositive: 0,
    allRequiredSelectedWhenFullyRetrievable: 0,
    atLeastOneRequiredSelectedPositive: 0,
    positiveReturnedNone: 0,
    multiPositive: 0,
    multiFullyRetrievable: 0,
    multiFullyGroundedRetrievable: 0,
    multiAllSelectedWhenFullyGrounded: 0,
    multiAllSelectedWhenFullyRetrievable: 0,
    multiAtLeastOneAvailableSelected: 0,
    wordingNoneTotal: 0,
    wordingNoneCorrect: 0,
    structuralTotal: 0,
    structuralCorrect: 0,
    forbiddenAvailable: 0,
    forbiddenSelected: 0,
    forbiddenRank1Selected: 0,
    supportedLabeledSelected: 0,
    forbiddenLabeledSelected: 0,
    unlabeledSelected: 0,
    unlabeledSelectionIds: [],
    failed: 0,
    selectedCountDistribution: { "0": 0, "1": 0, "2": 0, "3": 0, "4": 0 },
    perSkill: {},
    byAction: {},
    requiredDiagnostics: [],
  };
  const seenLabels = new Set<string>();
  for (const label of labels) {
    if (seenLabels.has(label.key)) throw Error("Duplicate SRS-4 development label");
    seenLabels.add(label.key);
    const observation = byKey.get(label.key);
    if (!observation) throw Error("Missing SRS-4 development observation");
    const candidates = new Set(observation.candidateIds);
    const mode = (result.byAction[label.action] ??= {
      scenarios: 0,
      requiredTotal: 0,
      requiredAvailable: 0,
      requiredProvenanceBlocked: 0,
      requiredGroundedAvailable: 0,
      requiredGroundedSelected: 0,
      requiredSelected: 0,
      wordingNoneTotal: 0,
      wordingNoneCorrect: 0,
    });
    mode.scenarios++;
    const selected = new Set(
      observation.selection?.status === "SELECTED"
        ? observation.selection.selectedCapabilities.map((row) => row.skillId)
        : [],
    );
    if (observation.selection?.status === "FAILED") result.failed++;
    if (selected.size > 4) throw Error("Invalid SRS-4 selected count");
    result.selectedCountDistribution[
      String(selected.size) as keyof typeof result.selectedCountDistribution
    ]++;
    const supported = new Set([...label.required, ...label.acceptable]);
    const forbidden = new Set(label.forbidden);
    for (const id of selected) {
      if (!candidates.has(id)) throw Error("SRS-4 selected ID outside candidates");
      if (supported.has(id)) result.supportedLabeledSelected++;
      else if (forbidden.has(id)) result.forbiddenLabeledSelected++;
      else {
        result.unlabeledSelected++;
        result.unlabeledSelectionIds.push(`${label.key}:${id}`);
      }
    }
    if (
      label.action === "NO_REPLY_NEEDED" ||
      label.action === "SUGGEST_ACTIONS" ||
      label.action === "ASK_CLARIFICATION"
    ) {
      result.structuralTotal++;
      if (observation.stage === "STRUCTURAL_EMPTY" && selected.size === 0)
        result.structuralCorrect++;
      continue;
    }
    if (label.strictNone) {
      result.wordingNoneTotal++;
      mode.wordingNoneTotal++;
      if (observation.selection?.status === "NONE") {
        result.wordingNoneCorrect++;
        mode.wordingNoneCorrect++;
      }
    }
    if (label.required.length) {
      result.positive++;
      result.requiredTotal += label.required.length;
      mode.requiredTotal += label.required.length;
      const fullyAvailable = label.required.every((id) => candidates.has(id));
      const fullyGrounded = label.required.every(
        (id) => candidates.has(id) && observation.provenanceGrounded[id] !== false,
      );
      const allSelected = label.required.every((id) => selected.has(id));
      if (fullyAvailable) result.fullyRetrievablePositive++;
      if (fullyGrounded) result.fullyGroundedRetrievablePositive++;
      if (allSelected) result.allRequiredSelectedPositive++;
      if (fullyAvailable && allSelected) result.allRequiredSelectedWhenFullyRetrievable++;
      if (fullyGrounded && allSelected) result.allRequiredSelectedWhenFullyGrounded++;
      if (label.required.some((id) => selected.has(id)))
        result.atLeastOneRequiredSelectedPositive++;
      if (observation.selection?.status === "NONE") result.positiveReturnedNone++;
      if (label.required.length > 1) {
        result.multiPositive++;
        if (fullyAvailable) result.multiFullyRetrievable++;
        if (fullyGrounded) result.multiFullyGroundedRetrievable++;
        if (fullyAvailable && allSelected) result.multiAllSelectedWhenFullyRetrievable++;
        if (fullyGrounded && allSelected) result.multiAllSelectedWhenFullyGrounded++;
        if (label.required.some((id) => candidates.has(id) && selected.has(id)))
          result.multiAtLeastOneAvailableSelected++;
      }
    }
    for (const id of label.required) {
      const skill = (result.perSkill[id] ??= {
        requiredAvailable: 0,
        requiredSelected: 0,
        forbiddenRejected: 0,
      });
      if (candidates.has(id)) {
        result.requiredAvailable++;
        skill.requiredAvailable++;
        mode.requiredAvailable++;
        if (observation.provenanceGrounded[id] === false) {
          result.requiredProvenanceBlocked++;
          mode.requiredProvenanceBlocked++;
        } else {
          result.requiredGroundedAvailable++;
          mode.requiredGroundedAvailable++;
        }
      }
      if (selected.has(id)) {
        if (observation.provenanceGrounded[id] === false)
          throw Error("SRS-4 provenance-blocked required selected");
        result.requiredSelected++;
        skill.requiredSelected++;
        mode.requiredSelected++;
        result.requiredGroundedSelected++;
        mode.requiredGroundedSelected++;
      }
      result.requiredDiagnostics.push({
        key: label.key,
        skillId: id,
        rank: observation.semanticRanks[id] ?? null,
        stage: !observation.hardEligibility[id]
          ? "HARD_ELIGIBILITY"
          : !candidates.has(id)
            ? "RETRIEVAL_TOP10_MISS"
            : observation.provenanceGrounded[id] === false
              ? "PROVENANCE_GROUNDING_BLOCKED"
              : !selected.has(id)
                ? "SUPERVISOR_REQUIRED_MISS"
                : "FOUND",
      });
    }
    for (const id of label.forbidden) {
      const skill = (result.perSkill[id] ??= {
        requiredAvailable: 0,
        requiredSelected: 0,
        forbiddenRejected: 0,
      });
      if (candidates.has(id)) {
        result.forbiddenAvailable++;
        if (selected.has(id)) {
          result.forbiddenSelected++;
          if (observation.semanticRanks[id] === 1) result.forbiddenRank1Selected++;
        } else skill.forbiddenRejected++;
      }
    }
  }
  return result;
}
