import {
  SkillPlanCompilationRequestSchema,
  SkillPlanSchema,
  type SkillDefinition,
  type SkillPlan,
  type SkillPlanCompilationRequest,
  type SkillReference,
  type SkillSelectionResult,
} from "@ai-message-coach/contracts";

import type { ApprovedSkillCatalogSnapshot } from "./catalog-snapshot.js";
import { validateApprovedSkillCatalogSnapshot } from "./catalog-snapshot.js";
import { validateSkillPlan, type SkillPlanCompiler } from "./agent-skill-boundary.js";
import { conflictsWithSelected, isEligibleSkillForContext } from "./engine.js";

type FailureCode = NonNullable<SkillPlan["failureCode"]>;
type GuidanceItem = SkillPlan["principles"][number];

function emptyPlan(
  status: "NONE" | "FAILED",
  snapshotId: string,
  failureCode?: FailureCode,
): SkillPlan {
  return SkillPlanSchema.parse({
    status,
    selectedSkills: [],
    principles: [],
    avoid: [],
    tradeoffs: [],
    recommendations: [],
    catalogSnapshotId: snapshotId,
    ...(failureCode ? { failureCode } : {}),
  });
}

function appendUnique<T>(target: T[], values: readonly T[], limit: number): void {
  for (const value of values) {
    if (!target.includes(value) && target.length < limit) target.push(value);
  }
}

function composeItems(
  skills: readonly SkillDefinition[],
  references: readonly SkillReference[],
  reasons: ReadonlyMap<string, readonly string[]>,
  field: "principles" | "avoid",
): GuidanceItem[] {
  const items = new Map<string, GuidanceItem>();
  for (let index = 0; index < skills.length; index += 1) {
    const skill = skills[index]!;
    const reference = references[index]!;
    const evidenceRefs = reasons.get(skill.id)!;
    for (const text of skill[field]) {
      const existing = items.get(text);
      if (existing) {
        if (!existing.skillRefs.some((ref) => ref.id === reference.id))
          existing.skillRefs.push(reference);
        appendUnique(existing.evidenceRefs, evidenceRefs, 4);
      } else if (items.size < 12) {
        items.set(text, { text, skillRefs: [reference], evidenceRefs: [...evidenceRefs] });
      }
    }
  }
  return [...items.values()];
}

function reasonIsSupported(
  reason: SkillSelectionResult["reasons"][number],
  skill: SkillDefinition,
  request: SkillPlanCompilationRequest,
): boolean {
  const cited = reason.evidenceRefs.map((id) => request.evidence.find((item) => item.id === id));
  if (cited.some((item) => !item)) return false;
  if (reason.code === "LANGUAGE_MATCH") {
    const primary = request.context.language.primary;
    const family = primary?.split("-", 1)[0]?.toLowerCase();
    return cited.every(
      (item) =>
        item?.kind === "LANGUAGE" &&
        item.value.format === "CODE" &&
        item.value.code === `PRIMARY:${primary}` &&
        skill.languages.some((language) => language !== "universal" && language === family),
    );
  }
  return cited.every((item) => {
    if (item?.kind !== "CONTEXT_TAG" || item.value.format !== "CODE") return false;
    const code = item.value.code;
    const inContext =
      (code.startsWith("SITUATION:") &&
        request.context.situationTags.some((tag) => tag === code.slice(10))) ||
      (code.startsWith("INTENT:") &&
        request.context.intentTags.some((tag) => tag === code.slice(7)));
    if (!inContext) return false;
    return (
      reason.code === "NEED_MATCH" ||
      (code.startsWith("SITUATION:") && skill.situations.some((tag) => tag === code.slice(10))) ||
      (code.startsWith("INTENT:") && skill.intents.some((tag) => tag === code.slice(7)))
    );
  });
}

/** Uses only selected approved runtime definitions; it never selects or calls a provider. */
export function createDeterministicSkillPlanCompiler(
  snapshot: ApprovedSkillCatalogSnapshot,
): SkillPlanCompiler {
  const registry = validateApprovedSkillCatalogSnapshot(snapshot);
  const byId = new Map(registry.map((skill) => [skill.id, skill]));

  return {
    async compile(rawRequest: SkillPlanCompilationRequest): Promise<SkillPlan> {
      const request = SkillPlanCompilationRequestSchema.parse(rawRequest);
      if (
        request.catalogSnapshotId !== snapshot.id ||
        request.selection.catalogSnapshotId !== snapshot.id
      )
        return emptyPlan("FAILED", snapshot.id, "CATALOG_MISMATCH");
      if (request.selection.status === "FAILED")
        return emptyPlan("FAILED", snapshot.id, "SELECTION_FAILED");
      if (request.selection.status === "NONE") return emptyPlan("NONE", snapshot.id);

      const evidenceIds = new Set(request.evidence.map(({ id }) => id));
      if (
        request.constraints.some(({ evidenceRef }) => !evidenceIds.has(evidenceRef)) ||
        request.selection.reasons.some(({ evidenceRefs }) =>
          evidenceRefs.some((reference) => !evidenceIds.has(reference)),
        )
      )
        return emptyPlan("FAILED", snapshot.id, "INVALID_INPUT");

      const context = { ...request.context, action: request.action, intent: null };
      const selected: SkillDefinition[] = [];
      for (const reference of request.selection.selectedSkills) {
        const skill = byId.get(reference.id);
        if (
          !skill ||
          skill.version !== reference.version ||
          !isEligibleSkillForContext(skill, context)
        )
          return emptyPlan("FAILED", snapshot.id, "UNRESOLVED_SKILL");
        const reason = request.selection.reasons.find((item) => item.skillId === skill.id);
        if (!reason || !reasonIsSupported(reason, skill, request))
          return emptyPlan("FAILED", snapshot.id, "INVALID_INPUT");
        if (conflictsWithSelected(skill, selected))
          return emptyPlan("FAILED", snapshot.id, "COMPILATION_FAILED");
        selected.push(skill);
      }

      const reasons = new Map(
        request.selection.reasons.map(({ skillId, evidenceRefs }) => [skillId, evidenceRefs]),
      );
      const plan = SkillPlanSchema.parse({
        status: "COMPILED",
        selectedSkills: request.selection.selectedSkills,
        principles: composeItems(selected, request.selection.selectedSkills, reasons, "principles"),
        avoid: composeItems(selected, request.selection.selectedSkills, reasons, "avoid"),
        tradeoffs: [],
        recommendations: [],
        catalogSnapshotId: snapshot.id,
      });
      return validateSkillPlan(request, plan, snapshot);
    },
  };
}
