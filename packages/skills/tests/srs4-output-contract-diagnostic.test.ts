import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { packageRoot } from "../authoring/generator.js";
import { prepareSrs4Development } from "./srs4-development.js";
import {
  SRS4_D2_STAGE_ORDER,
  Srs4D2DiagnosticSchema,
  aggregateD2Stages,
  diagnoseSupervisorOutput,
  diagnoseSupervisorProviderResponse,
  type Srs4D2FailureCode,
  type Srs4D2Stage,
} from "./srs4-output-contract-diagnostic.js";
import {
  SkillSelectionSchema,
  validateSupervisorJudgment,
  type SupervisorInput,
  type WireJudgment,
} from "./srs4-supervisor.js";

async function canonical(): Promise<{ input: SupervisorInput; wire: WireJudgment }> {
  const { cases } = await prepareSrs4Development();
  const row = cases.find((item) => item.key === "SRS3B:R06");
  if (!row || "stage" in row.input) throw Error("D2 canonical development case missing");
  const fixture = JSON.parse(
    await readFile(resolve(packageRoot, "tests/fixtures/srs4/d2-valid-judgment-v1.json"), "utf8"),
  ) as { caseKey: string; expectedSelection: string[]; judgment: WireJudgment };
  expect(fixture.caseKey).toBe(row.key);
  expect(fixture.expectedSelection).toEqual(["request"]);
  expect(fixture.judgment.candidateDecisions.map((item) => item.skillId)).toEqual(
    row.input.candidates.map((item) => item.skillId),
  );
  return { input: row.input, wire: fixture.judgment };
}

function changed(wire: WireJudgment, edit: (copy: WireJudgment) => void): WireJudgment {
  const copy = structuredClone(wire);
  edit(copy);
  return copy;
}

function expectInvalid(
  input: SupervisorInput,
  wire: unknown,
  stage: Srs4D2Stage,
  code: Srs4D2FailureCode,
): void {
  const { diagnostic, selection } = diagnoseSupervisorOutput(input, wire);
  expect(diagnostic.validatorStatus).toBe("INVALID");
  expect(diagnostic.firstFailedStage).toBe(stage);
  expect(diagnostic.failureCodes).toContain(code);
  expect(selection?.status).toBe("FAILED");
  expect(validateSupervisorJudgment(input, wire).status).toBe("FAILED");
  expect(Srs4D2DiagnosticSchema.safeParse(diagnostic).success).toBe(true);
  for (const fragment of input.evidence)
    expect(JSON.stringify(diagnostic)).not.toContain(fragment.text);
}

describe("SRS-4-D2 offline output-contract diagnostics", () => {
  it("passes a static fully valid 10-candidate fake judgment through V1 and D2", async () => {
    const { input, wire } = await canonical();
    const original = validateSupervisorJudgment(input, wire);
    const { diagnostic, selection } = diagnoseSupervisorOutput(input, wire, "SRS3B:R06");
    expect(original.status).toBe("SELECTED");
    expect(original.selectedCapabilities.map((item) => item.skillId)).toEqual(["request"]);
    expect(selection).toEqual(original);
    expect(diagnostic.validatorStatus).toBe("VALID");
    expect(diagnostic.scenarioId).toBe("SRS3B:R06");
    expect(diagnostic.firstFailedStage).toBeNull();
    expect(diagnostic.failureCodes).toEqual([]);
    expect(diagnostic.wireSchemaValid).toBe(true);
    expect(diagnostic.applicationValid).toBe(true);
    expect(diagnostic.counts.expectedCandidateCount).toBe(10);
    expect(diagnostic.counts.selectedCountBeforeValidation).toBe(1);
    const aggregate = aggregateD2Stages([diagnostic]);
    expect(aggregate.valid).toBe(1);
    expect(aggregate.passedThroughCounts.VALID).toBe(1);
    expect(SRS4_D2_STAGE_ORDER).toContain("FACT_GROUNDING_VALID");
  });

  it("separates provider, parse, and wire-schema failures", async () => {
    const { input, wire } = await canonical();
    const missing = diagnoseSupervisorProviderResponse(input, null).diagnostic;
    expect(missing.firstFailedStage).toBe("PROVIDER_RESPONSE_PRESENT");
    expect(missing.failureCodes).toContain("MISSING_PROVIDER_OUTPUT");
    const noText = diagnoseSupervisorProviderResponse(input, {
      status: "completed",
      output: [],
    }).diagnostic;
    expect(noText.firstFailedStage).toBe("OUTPUT_TEXT_OR_OBJECT_PRESENT");
    const incomplete = diagnoseSupervisorProviderResponse(input, {
      status: "incomplete",
      output: [{ content: [{ type: "output_text", text: JSON.stringify(wire) }] }],
    }).diagnostic;
    expect(incomplete.firstFailedStage).toBe("OUTPUT_TEXT_OR_OBJECT_PRESENT");
    const badJson = diagnoseSupervisorOutput(input, "{").diagnostic;
    expect(badJson.firstFailedStage).toBe("JSON_PARSE_VALID");
    expect(badJson.failureCodes).toContain("JSON_PARSE_FAILED");
    const provider = diagnoseSupervisorProviderResponse(input, {
      status: "completed",
      output: [{ content: [{ type: "output_text", text: JSON.stringify(wire) }] }],
    });
    expect(provider.diagnostic.validatorStatus).toBe("VALID");
    const invalidDecision = changed(wire, (copy) => {
      (copy.candidateDecisions[0] as { decision: string }).decision = "MAYBE";
    });
    expectInvalid(input, invalidDecision, "WIRE_SCHEMA_VALID", "INVALID_DECISION_VALUE");
    const invalidReason = changed(wire, (copy) => {
      (copy.candidateDecisions[0] as { reasonCodes: string[] }).reasonCodes = ["NOT_A_REASON"];
    });
    expectInvalid(input, invalidReason, "WIRE_SCHEMA_VALID", "INVALID_REASON_CODE");
    const malformedRef = changed(wire, (copy) => {
      copy.candidateDecisions[8]!.evidence = [{ ref: "bad-ref", use: "USER_FACT" }];
    });
    expectInvalid(input, malformedRef, "WIRE_SCHEMA_VALID", "INVALID_EVIDENCE_REF_FORMAT");
    const invalidUse = changed(wire, (copy) => {
      (copy.candidateDecisions[8]!.evidence[0] as { use: string }).use = "UNSAFE";
    });
    expectInvalid(input, invalidUse, "WIRE_SCHEMA_VALID", "INVALID_EVIDENCE_USE");
  });

  it("attributes candidate count, duplicate, unknown and out-of-pool decisions", async () => {
    const { input, wire } = await canonical();
    expectInvalid(
      input,
      changed(wire, (copy) => {
        copy.candidateDecisions.pop();
      }),
      "CANDIDATE_DECISION_COUNT_VALID",
      "MISSING_CANDIDATE_DECISION",
    );
    expectInvalid(
      input,
      changed(wire, (copy) => {
        copy.candidateDecisions.push(structuredClone(copy.candidateDecisions[0]!));
      }),
      "WIRE_SCHEMA_VALID",
      "EXTRA_CANDIDATE_DECISION",
    );
    expectInvalid(
      input,
      changed(wire, (copy) => {
        copy.candidateDecisions[9]!.skillId = copy.candidateDecisions[0]!.skillId;
      }),
      "NO_DUPLICATE_CANDIDATES",
      "DUPLICATE_CANDIDATE_ID",
    );
    expectInvalid(
      input,
      changed(wire, (copy) => {
        copy.candidateDecisions[8]!.skillId = "en.casual_naturalness";
      }),
      "CANDIDATE_ID_SET_VALID",
      "UNKNOWN_CANDIDATE_ID",
    );
  });

  it("attributes reason polarity and evidence-reference failures", async () => {
    const { input, wire } = await canonical();
    expectInvalid(
      input,
      changed(wire, (copy) => {
        copy.candidateDecisions[8]!.reasonCodes = ["NO_MATERIAL_JOB"];
      }),
      "REASON_POLARITY_VALID",
      "SELECT_WITHOUT_POSITIVE_REASON",
    );
    expectInvalid(
      input,
      changed(wire, (copy) => {
        copy.candidateDecisions[0]!.reasonCodes = ["DIRECTLY_SUPPORTED"];
      }),
      "REASON_POLARITY_VALID",
      "REJECT_WITHOUT_REJECTION_REASON",
    );
    expectInvalid(
      input,
      changed(wire, (copy) => {
        copy.candidateDecisions[0]!.reasonCodes = ["NO_MATERIAL_JOB", "NO_MATERIAL_JOB"];
      }),
      "REASON_POLARITY_VALID",
      "DUPLICATE_REASON_CODE",
    );
    expectInvalid(
      input,
      changed(wire, (copy) => {
        copy.candidateDecisions[8]!.evidence.push(
          structuredClone(copy.candidateDecisions[8]!.evidence[0]!),
        );
      }),
      "EVIDENCE_REF_UNIQUE",
      "EVIDENCE_REF_USE_DUPLICATE",
    );
    expectInvalid(
      input,
      changed(wire, (copy) => {
        copy.candidateDecisions[8]!.evidence[0]!.ref = "USER_HISTORY:99";
      }),
      "EVIDENCE_REF_EXISTS",
      "UNKNOWN_EVIDENCE_REF",
    );
  });

  it("attributes ownership, negation/prerequisite, and factual grounding", async () => {
    const { input, wire } = await canonical();
    expectInvalid(
      input,
      changed(wire, (copy) => {
        copy.candidateDecisions[8]!.evidence = [{ ref: "OTHER_MESSAGE:0", use: "USER_FACT" }];
      }),
      "OWNERSHIP_VALID",
      "OTHER_USED_AS_USER_FACT",
    );
    expectInvalid(
      input,
      changed(wire, (copy) => {
        copy.candidateDecisions[8]!.evidence = [{ ref: "SELECTED_GOAL:0", use: "USER_FACT" }];
      }),
      "OWNERSHIP_VALID",
      "SELECTED_GOAL_USED_AS_FACT",
    );
    const unknownInput = structuredClone(input);
    unknownInput.evidence.push({
      ref: "UNKNOWN_MESSAGE:0",
      source: "UNKNOWN_MESSAGE",
      ordinal: 0,
      text: "synthetic unknown",
      speakerConfidence: null,
      textConfidence: null,
    });
    expectInvalid(
      unknownInput,
      changed(wire, (copy) => {
        copy.candidateDecisions[8]!.evidence = [{ ref: "UNKNOWN_MESSAGE:0", use: "USER_FACT" }];
      }),
      "OWNERSHIP_VALID",
      "UNKNOWN_USED_AS_USER_FACT",
    );
    expectInvalid(
      input,
      changed(wire, (copy) => {
        copy.candidateDecisions[0]!.reasonCodes = ["EXPLICITLY_NEGATED"];
      }),
      "NEGATION_PREREQUISITE_EVIDENCE_VALID",
      "NEGATION_EVIDENCE_INVALID",
    );
    expectInvalid(
      input,
      changed(wire, (copy) => {
        copy.candidateDecisions[0]!.reasonCodes = ["PREREQUISITE_UNSUPPORTED"];
      }),
      "NEGATION_PREREQUISITE_EVIDENCE_VALID",
      "PREREQUISITE_EVIDENCE_INVALID",
    );
    expectInvalid(
      input,
      changed(wire, (copy) => {
        copy.candidateDecisions[8]!.decision = "REJECT";
        copy.candidateDecisions[8]!.reasonCodes = ["NO_MATERIAL_JOB"];
        copy.candidateDecisions[8]!.evidence = [];
        copy.candidateDecisions[5]!.decision = "SELECT";
        copy.candidateDecisions[5]!.reasonCodes = ["DIRECTLY_SUPPORTED"];
        copy.candidateDecisions[5]!.evidence = [{ ref: "SELECTED_GOAL:0", use: "OBJECTIVE" }];
      }),
      "FACT_GROUNDING_VALID",
      "FACT_GROUNDING_MISSING",
    );
    expectInvalid(
      input,
      changed(wire, (copy) => {
        copy.candidateDecisions[8]!.evidence = [];
      }),
      "FACT_GROUNDING_VALID",
      "SELECT_WITHOUT_EVIDENCE",
    );
  });

  it("attributes selection budget and relationship rules; status is derived, not model-supplied", async () => {
    const { input, wire } = await canonical();
    const over = changed(wire, (copy) => {
      for (const item of copy.candidateDecisions.slice(0, 5)) {
        item.decision = "SELECT";
        item.reasonCodes = ["DIRECTLY_SUPPORTED"];
        item.evidence = [{ ref: "USER_HISTORY:0", use: "USER_FACT" }];
      }
      copy.candidateDecisions[8]!.decision = "REJECT";
      copy.candidateDecisions[8]!.reasonCodes = ["NO_MATERIAL_JOB"];
      copy.candidateDecisions[8]!.evidence = [];
    });
    expectInvalid(input, over, "SELECTION_BUDGET_VALID", "OVER_SELECTION_BUDGET");
    expectInvalid(
      input,
      changed(wire, (copy) => {
        copy.candidateDecisions[0]!.reasonCodes = ["CONFLICTS_WITH_SELECTED"];
      }),
      "RELATION_CONSTRAINTS_VALID",
      "UNSUPPORTED_CONFLICT_REASON",
    );
    expectInvalid(
      input,
      changed(wire, (copy) => {
        copy.candidateDecisions[8]!.reasonCodes = ["COMPLEMENTS_SELECTED"];
      }),
      "RELATION_CONSTRAINTS_VALID",
      "MULTI_SKILL_REASON_WITHOUT_PAIR",
    );
    const conflictInput = structuredClone(input);
    conflictInput.candidates[8]!.conflictingSkills.push(conflictInput.candidates[0]!.skillId);
    const conflict = changed(wire, (copy) => {
      copy.candidateDecisions[0]!.decision = "SELECT";
      copy.candidateDecisions[0]!.reasonCodes = ["DIRECTLY_SUPPORTED"];
      copy.candidateDecisions[0]!.evidence = [{ ref: "USER_HISTORY:0", use: "USER_FACT" }];
    });
    expectInvalid(conflictInput, conflict, "RELATION_CONSTRAINTS_VALID", "SELECTED_CONFLICT");
    const original = validateSupervisorJudgment(input, wire);
    expect(SkillSelectionSchema.safeParse({ ...original, status: "NONE" }).success).toBe(false);
    // The wire schema has no status/selectedCapabilities field. A status mismatch
    // is a local derivation-schema defect, not a possible model-supplied clause.
  });
});
