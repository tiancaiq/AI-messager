import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { packageRoot } from "../authoring/generator.js";
import { prepareSrs4Development } from "./srs4-development.js";
import { diagnoseSupervisorOutputV2 } from "./srs4-output-contract-diagnostic-v2.js";
import { createSupervisorV2Payload } from "./srs4-supervisor-prompt-v2.js";
import {
  SkillSelectionV2Schema,
  validateSupervisorJudgmentV2,
  type WireJudgmentV2,
} from "./srs4-supervisor-v2.js";
import type { SupervisorInput } from "./srs4-supervisor.js";

interface Recipe {
  id: string;
  exposedKey: string;
  selected: string[];
  rejections: Record<string, string>;
  expectedStatus: "SELECTED" | "NONE";
}
const recipesPath = resolve(packageRoot, "tests/fixtures/srs4/d4-valid-judgment-recipes-v1.json");
async function fixtures(): Promise<
  Array<{ recipe: Recipe; input: SupervisorInput; wire: WireJudgmentV2 }>
> {
  const manifest = JSON.parse(await readFile(recipesPath, "utf8")) as { recipes: Recipe[] };
  const { cases } = await prepareSrs4Development();
  return manifest.recipes.map((recipe) => {
    const row = cases.find((item) => item.key === recipe.exposedKey);
    if (!row || "stage" in row.input) throw Error(`Missing D4 exposed input ${recipe.exposedKey}`);
    const input = row.input;
    const objective = input.evidence.find(
      (item) => item.source === "SELECTED_GOAL" || item.source === "USER_DRAFT",
    );
    const userFact = input.evidence.find(
      (item) => item.source === "USER_DRAFT" || item.source === "USER_HISTORY",
    );
    const wire: WireJudgmentV2 = {
      candidateDecisions: input.candidates.map((candidate) => {
        const isSelect = recipe.selected.includes(candidate.skillId);
        const reason = recipe.rejections[candidate.skillId];
        const negated = reason === "EXPLICITLY_NEGATED";
        const factGated = new Set([
          "acknowledge_mistake",
          "apology",
          "boundary_setting",
          "expectation_setting",
          "follow_up",
          "planning",
          "reassurance",
          "status_update",
        ]).has(candidate.skillId);
        return {
          skillId: candidate.skillId,
          decision: isSelect ? "SELECT" : "REJECT",
          reasonCodes: [
            isSelect ? "DIRECTLY_SUPPORTED" : (reason ?? "NO_MATERIAL_JOB"),
          ] as WireJudgmentV2["candidateDecisions"][number]["reasonCodes"],
          evidence: isSelect
            ? factGated && userFact
              ? [{ ref: userFact.ref, use: "USER_FACT" as const }]
              : objective
                ? [{ ref: objective.ref, use: "OBJECTIVE" as const }]
                : []
            : negated && objective
              ? [{ ref: objective.ref, use: "OBJECTIVE" as const }]
              : [],
        };
      }),
    };
    return { recipe, input, wire };
  });
}

describe("SRS-4-D4 offline V2 contract", () => {
  it("validates all canonical ten-candidate fixtures and binds neutral payloads", async () => {
    for (const { recipe, input, wire } of await fixtures()) {
      expect(input.candidates).toHaveLength(10);
      const selection = validateSupervisorJudgmentV2(input, wire);
      expect(selection.status, recipe.id).toBe(recipe.expectedStatus);
      const diagnostic = diagnoseSupervisorOutputV2(input, wire, recipe.id).diagnostic;
      expect(diagnostic.validatorStatus, recipe.id).toBe("VALID");
      expect(diagnostic.firstFailedStage).toBeNull();
      expect(diagnostic.counts.returnedCandidateCount).toBe(10);
      const payload = createSupervisorV2Payload(input);
      expect(payload.system).toContain("PREREQUISITE_NOT_ESTABLISHED");
      expect(payload.schema).toHaveProperty("type", "object");
      expect(payload.userJson).not.toMatch(/semanticRank|semanticScore|strictNone|forbidden/u);
      if (recipe.id === "OBJECTIVE_NEGATION" || recipe.id === "EXPLICIT_NO_BOUNDARY")
        expect(diagnostic.counts.validObjectiveNegations).toBe(1);
      if (recipe.id === "FIRST_REQUEST_PREREQUISITE_ABSENT")
        expect(diagnostic.counts.prerequisiteNotEstablishedRejections).toBe(1);
    }
  });

  it("preserves closed negative evidence, coverage, budget and provenance rules", async () => {
    const all = await fixtures();
    const base = all.find((item) => item.recipe.id === "FIRST_REQUEST_PREREQUISITE_ABSENT")!;
    const closedThread = structuredClone(base.wire);
    const closedFollowUp = closedThread.candidateDecisions.find(
      (item) => item.skillId === "follow_up",
    )!;
    closedFollowUp.reasonCodes = ["PREREQUISITE_CONTRADICTED"];
    closedFollowUp.evidence = [{ ref: "USER_HISTORY:0", use: "USER_FACT" }];
    const closedDiagnostic = diagnoseSupervisorOutputV2(base.input, closedThread).diagnostic;
    expect(closedDiagnostic.validatorStatus).toBe("VALID");
    expect(closedDiagnostic.counts.prerequisiteContradictedRejections).toBe(1);
    const check = (
      input: SupervisorInput,
      mutate: (wire: WireJudgmentV2) => void,
      code: string,
    ) => {
      const wire = structuredClone(base.wire);
      mutate(wire);
      const result = diagnoseSupervisorOutputV2(input, wire);
      expect(result.selection.status, code).toBe("FAILED");
      expect(result.diagnostic.failureCodes, code).toContain(code);
    };
    check(
      base.input,
      (wire) => {
        const decision = wire.candidateDecisions.find((item) => item.skillId === "follow_up")!;
        decision.reasonCodes = ["PREREQUISITE_CONTRADICTED"];
      },
      "CONTRADICTION_EVIDENCE_MISSING",
    );
    check(
      base.input,
      (wire) => {
        const decision = wire.candidateDecisions.find((item) => item.skillId === "follow_up")!;
        decision.reasonCodes = ["PREREQUISITE_NOT_ESTABLISHED", "PREREQUISITE_CONTRADICTED"];
      },
      "INCOMPATIBLE_PREREQUISITE_REASONS",
    );
    check(
      base.input,
      (wire) => {
        wire.candidateDecisions[0]!.reasonCodes = ["EXPLICITLY_NEGATED"];
      },
      "EXPLICIT_NEGATION_EVIDENCE_INVALID",
    );
    check(
      base.input,
      (wire) => {
        wire.candidateDecisions.find((item) => item.skillId === "request")!.evidence = [
          { ref: "SELECTED_GOAL:0", use: "USER_FACT" },
        ];
      },
      "FACTUAL_SOURCE_INVALID",
    );
    check(
      base.input,
      (wire) => {
        wire.candidateDecisions.find((item) => item.skillId === "request")!.evidence = [
          { ref: "OTHER_MESSAGE:0", use: "USER_RESPONSIBILITY" },
        ];
      },
      "FACTUAL_SOURCE_INVALID",
    );
    check(
      base.input,
      (wire) => {
        wire.candidateDecisions[0]!.evidence = [{ ref: "USER_DRAFT:99", use: "OBJECTIVE" }];
      },
      "UNKNOWN_EVIDENCE_REF",
    );
    check(
      base.input,
      (wire) => {
        wire.candidateDecisions[0]!.skillId = "en.casual_naturalness";
      },
      "UNKNOWN_CANDIDATE_ID",
    );
    check(
      base.input,
      (wire) => {
        for (const item of wire.candidateDecisions.slice(0, 5)) {
          item.decision = "SELECT";
          item.reasonCodes = ["DIRECTLY_SUPPORTED"];
          item.evidence = [{ ref: "SELECTED_GOAL:0", use: "OBJECTIVE" }];
        }
      },
      "OVER_SELECTION_BUDGET",
    );
    check(
      base.input,
      (wire) => {
        wire.candidateDecisions[0]!.reasonCodes = ["DIRECTLY_SUPPORTED"];
      },
      "REASON_POLARITY_MISMATCH",
    );
    check(
      base.input,
      (wire) => {
        wire.candidateDecisions.find((item) => item.skillId === "request")!.evidence = [];
      },
      "SELECT_EVIDENCE_MISSING",
    );
    const blocked = all.find((item) => item.recipe.id === "PROVENANCE_BLOCKED_POSITIVE")!;
    const unsafe = structuredClone(blocked.wire);
    const candidate = unsafe.candidateDecisions.find(
      (item) => item.skillId === "expectation_setting",
    )!;
    candidate.decision = "SELECT";
    candidate.reasonCodes = ["DIRECTLY_SUPPORTED"];
    candidate.evidence = [{ ref: "SELECTED_GOAL:0", use: "OBJECTIVE" }];
    expect(diagnoseSupervisorOutputV2(blocked.input, unsafe).diagnostic.failureCodes).toContain(
      "SELECT_FACT_GROUNDING_MISSING",
    );
    check(
      base.input,
      (wire) => {
        wire.candidateDecisions[1] = structuredClone(wire.candidateDecisions[0]!);
      },
      "DUPLICATE_CANDIDATE_ID",
    );
    check(
      base.input,
      (wire) => {
        wire.candidateDecisions.pop();
      },
      "CANDIDATE_COUNT_MISMATCH",
    );
    expect(
      SkillSelectionV2Schema.safeParse({
        ...validateSupervisorJudgmentV2(base.input, base.wire),
        status: "NONE",
      }).success,
    ).toBe(false);
    expect(
      SkillSelectionV2Schema.safeParse({
        ...validateSupervisorJudgmentV2(base.input, base.wire),
        status: "FAILED",
      }).success,
    ).toBe(false);
  });

  it("keeps malformed response failures separate and content-free", async () => {
    const { input, wire } = (await fixtures())[0]!;
    expect(diagnoseSupervisorOutputV2(input, null).diagnostic.failureCodes).toEqual([
      "MISSING_PROVIDER_OUTPUT",
    ]);
    expect(diagnoseSupervisorOutputV2(input, "{not json").diagnostic.failureCodes).toEqual([
      "JSON_PARSE_FAILED",
    ]);
    expect(diagnoseSupervisorOutputV2(input, JSON.stringify(wire)).diagnostic.validatorStatus).toBe(
      "VALID",
    );
    expect(JSON.stringify(diagnoseSupervisorOutputV2(input, wire).diagnostic)).not.toContain(
      "invoice",
    );
  });
});
