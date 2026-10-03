import { describe, expect, it } from "vitest";
import { prepareSrs4Development } from "./srs4-development.js";
import { diagnoseSkillAssessorBatchOutput } from "./srs4r-assessment-diagnostic.js";
import {
  FakeSkillAssessorJudge,
  observeSkillAssessments,
  validateSkillAssessmentBatch,
  validateSkillAssessmentSingleton,
  type SkillAssessment,
} from "./srs4r-assessment.js";
import {
  createSkillAssessorBatchPayload,
  createSkillAssessorSingletonPayload,
} from "./srs4r-assessor-prompt.js";
import {
  contentFreeAssessorObservation,
  evaluateAssessorDevelopment,
} from "./srs4r-development.js";
import {
  SRS4R_A_INDEPENDENCE_CASE_KEYS,
  evaluateSingletonBatchIndependence,
  unrunIndependenceGate,
} from "./srs4r-independence.js";
import type { CandidateProjection, SupervisorInput } from "./srs4-supervisor.js";

function reject(candidate: CandidateProjection): SkillAssessment {
  return {
    skillId: candidate.skillId,
    definitionVersion: candidate.definitionVersion,
    profileRevision: candidate.profileRevision,
    applicability: "UNSUPPORTED",
    evidence: [],
    supportedProfileRefs: [],
    supportReasonCodes: [],
    blockingReasonCodes: ["NO_MATERIAL_JOB"],
  };
}

function wire(input: SupervisorInput, override: Record<string, SkillAssessment> = {}) {
  return {
    assessments: input.candidates.map(
      (candidate) => override[candidate.skillId] ?? reject(candidate),
    ),
  };
}

async function exposed(key: string): Promise<SupervisorInput> {
  const { cases } = await prepareSrs4Development();
  const row = cases.find((item) => item.key === key);
  if (!row || "stage" in row.input) throw Error(`Missing wording row ${key}`);
  return row.input;
}

describe("SRS-4R-A candidate-local offline assessor", () => {
  it("allows a materially useful SUPPORTING job without another skill or a final set", async () => {
    const input = await exposed("SRS3B:R06");
    const candidate = input.candidates.find((item) => item.skillId === "request")!;
    const supporting: SkillAssessment = {
      ...reject(candidate),
      applicability: "SUPPORTING",
      evidence: [{ ref: "SELECTED_GOAL:0", use: "OBJECTIVE" }],
      supportedProfileRefs: ["JOB"],
      supportReasonCodes: ["SECONDARY_JOB_SUPPORTED"],
      blockingReasonCodes: [],
    };
    expect(
      validateSkillAssessmentSingleton(input, "request", { assessment: supporting }).status,
    ).toBe("VALID");
    const all = validateSkillAssessmentBatch(input, wire(input, { request: supporting }));
    expect(all.status).toBe("VALID");
    expect(all.assessments.find((item) => item.skillId === "request")?.applicability).toBe(
      "SUPPORTING",
    );
    expect(JSON.stringify(all)).not.toMatch(
      /selectedCapabilities|semanticRank|confidence|finalReply/u,
    );
    const singletonPayload = createSkillAssessorSingletonPayload(input, "request");
    const serialized = JSON.parse(singletonPayload.userJson) as Record<string, unknown>;
    expect(serialized).toHaveProperty("candidate");
    expect(serialized).not.toHaveProperty("candidates");
    expect(singletonPayload.system).toContain("SUPPORTING is not low confidence");
    expect(singletonPayload.system).toContain("Do not compare it with");
    expect(singletonPayload.userJson).not.toMatch(
      /semanticScore|semanticRank|strictNone|forbidden|expected/u,
    );
    const batchPayload = createSkillAssessorBatchPayload(input);
    expect(
      (JSON.parse(batchPayload.userJson) as { candidates: unknown[] }).candidates,
    ).toHaveLength(10);
    expect(batchPayload.userJson).not.toMatch(
      /semanticScore|semanticRank|strictNone|forbidden|expected/u,
    );
    const reverse = [...input.candidates.map((item) => item.skillId)].reverse();
    const reversePayload = createSkillAssessorBatchPayload(input, reverse);
    expect(
      (JSON.parse(reversePayload.userJson) as { candidates: Array<{ skillId: string }> })
        .candidates[0]?.skillId,
    ).toBe(reverse[0]);
    expect(() => createSkillAssessorBatchPayload(input, ["request"])).toThrow();
  });

  it("preserves D4 absence, contradiction, objective-negation and uncertainty semantics", async () => {
    const input = await exposed("SRS3B:R06");
    const followUp = input.candidates.find((item) => item.skillId === "follow_up")!;
    const absent = {
      ...reject(followUp),
      blockingReasonCodes: [
        "PREREQUISITE_NOT_ESTABLISHED",
      ] as SkillAssessment["blockingReasonCodes"],
    };
    expect(validateSkillAssessmentBatch(input, wire(input, { follow_up: absent })).status).toBe(
      "VALID",
    );
    const contradicted = {
      ...absent,
      blockingReasonCodes: ["PREREQUISITE_CONTRADICTED"] as SkillAssessment["blockingReasonCodes"],
    };
    expect(
      validateSkillAssessmentBatch(input, wire(input, { follow_up: contradicted })).failureCodes,
    ).toContain("CONTRADICTION_EVIDENCE_MISSING");
    contradicted.evidence = [{ ref: "USER_HISTORY:0", use: "USER_FACT" }];
    expect(
      validateSkillAssessmentBatch(input, wire(input, { follow_up: contradicted })).status,
    ).toBe("VALID");
    const uncertain = {
      ...reject(followUp),
      applicability: "UNCERTAIN" as const,
      blockingReasonCodes: ["INSUFFICIENT_EVIDENCE"] as SkillAssessment["blockingReasonCodes"],
    };
    expect(validateSkillAssessmentBatch(input, wire(input, { follow_up: uncertain })).status).toBe(
      "VALID",
    );
    const falseUncertain = {
      ...uncertain,
      blockingReasonCodes: [
        "INSUFFICIENT_EVIDENCE",
        "EXPLICITLY_NEGATED",
      ] as SkillAssessment["blockingReasonCodes"],
    };
    expect(
      validateSkillAssessmentBatch(input, wire(input, { follow_up: falseUncertain })).failureCodes,
    ).toContain("APPLICABILITY_REASON_MISMATCH");
    const noNextSteps = await exposed("SRS3B:R14");
    const planning = noNextSteps.candidates.find((item) => item.skillId === "planning")!;
    const negated = {
      ...reject(planning),
      blockingReasonCodes: ["EXPLICITLY_NEGATED"] as SkillAssessment["blockingReasonCodes"],
      evidence: [{ ref: "SELECTED_GOAL:0", use: "OBJECTIVE" as const }],
    };
    expect(
      validateSkillAssessmentBatch(noNextSteps, wire(noNextSteps, { planning: negated })).status,
    ).toBe("VALID");
    negated.evidence = [];
    expect(
      validateSkillAssessmentBatch(noNextSteps, wire(noNextSteps, { planning: negated }))
        .failureCodes,
    ).toContain("EXPLICIT_NEGATION_EVIDENCE_INVALID");
    negated.evidence = [{ ref: "OTHER_MESSAGE:0", use: "OBJECTIVE" }];
    expect(
      validateSkillAssessmentBatch(noNextSteps, wire(noNextSteps, { planning: negated }))
        .failureCodes,
    ).toContain("OBJECTIVE_SOURCE_INVALID");
  });

  it("fails closed on unsupported factual support, ownership, refs, IDs and reasons", async () => {
    const input = await exposed("SRS3B:R14");
    const candidate = input.candidates.find((item) => item.skillId === "expectation_setting")!;
    const supported: SkillAssessment = {
      ...reject(candidate),
      applicability: "CORE",
      evidence: [{ ref: "SELECTED_GOAL:0", use: "OBJECTIVE" }],
      supportedProfileRefs: ["JOB"],
      supportReasonCodes: ["DIRECT_JOB_SUPPORTED"],
      blockingReasonCodes: [],
    };
    const check = (row: SkillAssessment, code: string) =>
      expect(
        validateSkillAssessmentBatch(input, wire(input, { expectation_setting: row })).failureCodes,
      ).toContain(code);
    check(supported, "FACT_GROUNDING_MISSING");
    check(
      { ...supported, evidence: [{ ref: "SELECTED_GOAL:0", use: "USER_FACT" }] },
      "FACTUAL_SOURCE_INVALID",
    );
    check(
      { ...supported, evidence: [{ ref: "OTHER_MESSAGE:0", use: "USER_RESPONSIBILITY" }] },
      "FACTUAL_SOURCE_INVALID",
    );
    check({ ...supported, evidence: [] }, "SUPPORTED_EVIDENCE_MISSING");
    check(
      { ...supported, evidence: [{ ref: "OTHER_MESSAGE:0", use: "CONTEXT" }] },
      "SUPPORTED_CONTEXT_ONLY",
    );
    check(
      { ...supported, evidence: [{ ref: "USER_DRAFT:99", use: "OBJECTIVE" }] },
      "EVIDENCE_REF_UNKNOWN",
    );
    check({ ...supported, profileRevision: supported.profileRevision + 1 }, "REVISION_MISMATCH");
    check({ ...supported, supportedProfileRefs: ["USE_WHEN:7"] }, "PROFILE_REF_INVALID");
    check(
      { ...supported, supportReasonCodes: ["SECONDARY_JOB_SUPPORTED"] },
      "APPLICABILITY_REASON_MISMATCH",
    );
    const missing = wire(input);
    missing.assessments.pop();
    expect(validateSkillAssessmentBatch(input, missing).failureCodes).toContain(
      "CANDIDATE_SET_MISMATCH",
    );
    const duplicate = wire(input);
    duplicate.assessments[1] = duplicate.assessments[0]!;
    expect(validateSkillAssessmentBatch(input, duplicate).failureCodes).toContain(
      "DUPLICATE_CANDIDATE",
    );
    const unknown = wire(input);
    unknown.assessments[0] = { ...unknown.assessments[0]!, skillId: "en.casual_naturalness" };
    expect(validateSkillAssessmentBatch(input, unknown).failureCodes).toContain(
      "UNKNOWN_CANDIDATE",
    );
    const positiveOnOther = {
      ...reject(candidate),
      applicability: "SUPPORTING" as const,
      evidence: [{ ref: "OTHER_MESSAGE:0", use: "USER_FACT" as const }],
      supportedProfileRefs: ["JOB" as const],
      supportReasonCodes: ["SECONDARY_JOB_SUPPORTED" as const],
      blockingReasonCodes: [],
    };
    check(positiveOnOther, "FACTUAL_SOURCE_INVALID");
  });

  it("sanitizes provider/JSON/wire failures and distinguishes structural bypass", async () => {
    const input = await exposed("SRS3B:R06");
    expect(diagnoseSkillAssessorBatchOutput(input, null).diagnostic.failureCodes).toEqual([
      "MISSING_OUTPUT",
    ]);
    expect(diagnoseSkillAssessorBatchOutput(input, "{not json").diagnostic.failureCodes).toEqual([
      "JSON_PARSE_FAILED",
    ]);
    const diagnostic = diagnoseSkillAssessorBatchOutput(
      input,
      JSON.stringify(wire(input)),
      "SRS3B:R06",
    ).diagnostic;
    expect(diagnostic.validatorStatus).toBe("VALID");
    expect(JSON.stringify(diagnostic)).not.toContain("invoice");
    const failure = await observeSkillAssessments(
      input,
      new FakeSkillAssessorJudge(() => {
        throw Error("secret provider response");
      }),
      "BATCH",
    );
    expect(failure.status).toBe("FAILED");
    expect(JSON.stringify(failure)).not.toContain("secret provider response");
    const { cases } = await prepareSrs4Development();
    const structural = cases.find((row) => row.action === "NO_REPLY_NEEDED")!;
    let invoked = false;
    const bypass = await observeSkillAssessments(
      structural.input,
      new FakeSkillAssessorJudge(() => {
        invoked = true;
        return {};
      }),
      "BATCH",
    );
    expect(bypass.stage).toBe("STRUCTURAL_EMPTY");
    expect(bypass.status).toBe("BYPASSED");
    expect(invoked).toBe(false);
  });

  it("makes singleton/batch comparison mandatory without calling a provider", async () => {
    const { cases } = await prepareSrs4Development();
    const fake = new FakeSkillAssessorJudge((localInput, candidate) => {
      expect(localInput.candidates.map((item) => item.skillId)).toEqual([candidate.skillId]);
      return reject(candidate);
    });
    const records = [];
    for (const key of SRS4R_A_INDEPENDENCE_CASE_KEYS) {
      const row = cases.find((item) => item.key === key)!;
      if ("stage" in row.input) throw Error("Expected wording input");
      const input = row.input;
      const batchIdOrder = validateSkillAssessmentBatch(input, await fake.assessBatch(input));
      const reversed = { ...input, candidates: [...input.candidates].reverse() };
      const batchReverseOrder = validateSkillAssessmentBatch(
        input,
        await fake.assessBatch(reversed),
      );
      const allSingletons = await observeSkillAssessments(input, fake, "SINGLETONS");
      expect(allSingletons.status).toBe("VALID");
      records.push({
        key,
        batchIdOrder,
        batchReverseOrder,
        allSingletons: validateSkillAssessmentBatch(input, {
          assessments: allSingletons.assessments,
        }),
      });
    }
    const gate = evaluateSingletonBatchIndependence(records, "OFFLINE_FAKE");
    expect(gate.parityStatus).toBe("PASS");
    expect(gate.gateStatus).toBe("NOT_RUN");
    expect(gate.comparedCandidateCount).toBe(160);
    expect(unrunIndependenceGate().gateStatus).toBe("NOT_RUN");
    const drift = structuredClone(records);
    const first = drift[0]!.batchReverseOrder.assessments[0]!;
    first.applicability = "UNCERTAIN";
    first.blockingReasonCodes = ["INSUFFICIENT_EVIDENCE"];
    expect(evaluateSingletonBatchIndependence(drift, "OFFLINE_FAKE").parityStatus).toBe("FAIL");
  });

  it("keeps exposed labels outside fake observations and preserves 46→38→25 denominators", async () => {
    const { cases, labels } = await prepareSrs4Development();
    const fake = new FakeSkillAssessorJudge((_input, candidate) => reject(candidate));
    const observations = [];
    for (const row of cases) {
      const outcome = await observeSkillAssessments(row.input, fake, "BATCH");
      observations.push(contentFreeAssessorObservation(row, outcome));
    }
    const serialized = JSON.stringify(observations);
    expect(serialized).not.toMatch(
      /invoice|mural|USER_DRAFT:|SELECTED_GOAL:|semanticScore|strictNone/u,
    );
    const original = JSON.stringify(observations);
    const mutatedLabels = labels.map((label) => ({ ...label, required: [...label.required] }));
    mutatedLabels[0]!.required.splice(0, 0, "fictional_label");
    expect(JSON.stringify(observations)).toBe(original);
    const metrics = evaluateAssessorDevelopment(observations, labels);
    expect(metrics.scenarios).toBe(53);
    expect(metrics.wordingScenarios).toBe(50);
    expect(metrics.structuralScenarios).toBe(3);
    expect(metrics.requiredTotal).toBe(46);
    expect(metrics.requiredTop10).toBe(38);
    expect(metrics.requiredProvenanceBlocked).toBe(13);
    expect(metrics.requiredGroundedAvailable).toBe(25);
    expect(metrics.wordingNoneTotal).toBe(13);
    expect(metrics.forbiddenAvailable).toBe(12);
    expect(metrics.requiredGroundedSupported).toBe(0); // fake-only, not a quality result
  });
});
