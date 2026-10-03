import { describe, expect, it } from "vitest";
import { packageRoot } from "../authoring/generator.js";
import { evaluateSupervisorDevelopment } from "./srs4-development-evaluator.js";
import {
  contentFreeDevelopmentObservation,
  exposedDevelopmentProvenanceGaps,
  prepareSrs4Development,
} from "./srs4-development.js";
import { createOfflineSupervisorPayload } from "./srs4-supervisor-prompt.js";
import {
  FakeSupervisorJudge,
  observeSupervisor,
  serializeSupervisorEvidence,
  SkillSelectionSchema,
  supervisorInputDigest,
  validateSupervisorJudgment,
  verifySrs4FrozenFiles,
  type SupervisorInput,
  type WireJudgment,
} from "./srs4-supervisor.js";

function wire(input: SupervisorInput, selectedIds: readonly string[] = []): WireJudgment {
  const objective = input.evidence.find(
    (item) => item.source === "USER_DRAFT" || item.source === "SELECTED_GOAL",
  );
  const userFact = input.evidence.find(
    (item) => item.source === "USER_DRAFT" || item.source === "USER_HISTORY",
  );
  return {
    candidateDecisions: input.candidates.map((candidate) => ({
      skillId: candidate.skillId,
      decision: selectedIds.includes(candidate.skillId) ? "SELECT" : "REJECT",
      reasonCodes: selectedIds.includes(candidate.skillId)
        ? ["DIRECTLY_SUPPORTED"]
        : ["NO_MATERIAL_JOB"],
      evidence:
        selectedIds.includes(candidate.skillId) && (objective || userFact)
          ? [{ ref: (userFact ?? objective)!.ref, use: userFact ? "USER_FACT" : "OBJECTIVE" }]
          : [],
    })),
  };
}

describe("SRS-4 offline Supervisor boundary", () => {
  it("binds frozen B bytes and prepares exactly 53 raw-only neutral inputs", async () => {
    await verifySrs4FrozenFiles(packageRoot);
    const { cases, labels } = await prepareSrs4Development();
    expect(cases).toHaveLength(53);
    expect(labels).toHaveLength(53);
    const row = cases.find((item) => item.key === "CONTROL:K21")!;
    if ("stage" in row.input) throw Error("Expected wording input");
    expect(row.input.candidates.map((candidate) => candidate.skillId)).toEqual(
      [...row.input.candidates.map((candidate) => candidate.skillId)].sort(),
    );
    expect(JSON.stringify(row.input)).not.toMatch(/semanticScore|semanticRank|semanticTriggers/u);
    expect(row.topK.top10[0]?.skillId).not.toBe(row.input.candidates[0]?.skillId);
    expect(row.input.candidates).toHaveLength(10);
    expect(row.input.candidates.every((candidate) => !candidate.skillId.includes("."))).toBe(true);
  });

  it("keeps labels outside serialized input and an in-memory input fingerprint", async () => {
    const { cases, labels } = await prepareSrs4Development();
    const row = cases.find((item) => item.key === "SRS3B:R06")!;
    if ("stage" in row.input) throw Error("Expected wording input");
    const before = supervisorInputDigest(row.input);
    const mutated = labels.map((label) => ({ ...label, required: [...label.required] }));
    mutated[0]!.required.splice(0, 1, "boundary_setting");
    expect(supervisorInputDigest(row.input)).toBe(before);
    expect(JSON.stringify(row.input)).not.toContain("strictNone");
    expect(JSON.stringify(row.input)).not.toContain("required");
    const payload = createOfflineSupervisorPayload(row.input);
    expect(payload.userJson).not.toMatch(/semanticScore|semanticRank|strictNone|forbidden/u);
    expect(payload.system).toContain(
      "A SELECTED_GOAL can establish a chosen communication objective only",
    );
    expect(payload.schema).toHaveProperty("type", "object");
  });

  it("keeps SELECTED_GOAL an objective, not fact or commitment evidence", async () => {
    const { cases } = await prepareSrs4Development();
    const row = cases.find((item) => item.key === "CONTROL:K20")!;
    if ("stage" in row.input) throw Error("Expected wording input");
    expect(row.input.evidence.some((fragment) => fragment.source === "SELECTED_GOAL")).toBe(true);
    const factGoal = wire(row.input, ["request"]);
    const select = factGoal.candidateDecisions.find((decision) => decision.skillId === "request")!;
    select.evidence = [{ ref: "SELECTED_GOAL:0", use: "USER_COMMITMENT" }];
    expect(validateSupervisorJudgment(row.input, factGoal).failureCode).toBe(
      "MODEL_OUTPUT_INVALID",
    );
    select.evidence = [{ ref: "SELECTED_GOAL:0", use: "OBJECTIVE" }];
    expect(validateSupervisorJudgment(row.input, factGoal).status).toBe("SELECTED");
    const estimate = cases.find((item) => item.key === "CONTROL:K22")!;
    if ("stage" in estimate.input) throw Error("Expected wording input");
    const unsupported = wire(estimate.input, ["expectation_setting"]);
    unsupported.candidateDecisions.find(
      (decision) => decision.skillId === "expectation_setting",
    )!.evidence = [{ ref: "SELECTED_GOAL:0", use: "OBJECTIVE" }];
    expect(validateSupervisorJudgment(estimate.input, unsupported).status).toBe("FAILED");
  });

  it("rejects missing, extra, duplicated, invalid-source, over-budget and conflicting decisions", async () => {
    const { cases } = await prepareSrs4Development();
    const row = cases.find((item) => item.key === "SRS3B:R06")!;
    if ("stage" in row.input) throw Error("Expected wording input");
    const valid = wire(row.input, ["request"]);
    expect(validateSupervisorJudgment(row.input, valid).status).toBe("SELECTED");
    expect(
      validateSupervisorJudgment(row.input, {
        candidateDecisions: valid.candidateDecisions.slice(1),
      }).status,
    ).toBe("FAILED");
    expect(
      validateSupervisorJudgment(row.input, {
        candidateDecisions: [...valid.candidateDecisions, valid.candidateDecisions[0]],
      }).status,
    ).toBe("FAILED");
    expect(
      validateSupervisorJudgment(row.input, {
        candidateDecisions: [
          { ...valid.candidateDecisions[0], skillId: "en.casual_naturalness" },
          ...valid.candidateDecisions.slice(1),
        ],
      }).status,
    ).toBe("FAILED");
    const wrongOwner = wire(row.input, ["request"]);
    wrongOwner.candidateDecisions.find((decision) => decision.skillId === "request")!.evidence = [
      { ref: "OTHER_MESSAGE:0", use: "USER_FACT" },
    ];
    expect(validateSupervisorJudgment(row.input, wrongOwner).status).toBe("FAILED");
    const over = wire(
      row.input,
      row.input.candidates.slice(0, 5).map((item) => item.skillId),
    );
    expect(validateSupervisorJudgment(row.input, over).status).toBe("FAILED");
    const candidates = structuredClone(row.input.candidates);
    const first = candidates[0]!;
    const second = candidates[1]!;
    first.conflictingSkills.push(second.skillId);
    const conflict = wire({ ...row.input, candidates }, [first.skillId, second.skillId]);
    expect(validateSupervisorJudgment({ ...row.input, candidates }, conflict).status).toBe(
      "FAILED",
    );
    const madeUpConflict = wire(row.input);
    madeUpConflict.candidateDecisions[0]!.reasonCodes = ["CONFLICTS_WITH_SELECTED"];
    expect(validateSupervisorJudgment(row.input, madeUpConflict).status).toBe("FAILED");
    const unsupportedNegation = wire(row.input);
    unsupportedNegation.candidateDecisions[0]!.reasonCodes = ["EXPLICITLY_NEGATED"];
    expect(validateSupervisorJudgment(row.input, unsupportedNegation).status).toBe("FAILED");
  });

  it("keeps failures separate from NONE, structural emptiness, and wrong-language scoring", async () => {
    const { cases } = await prepareSrs4Development();
    const wording = cases.find((item) => item.key === "CONTROL:K21")!;
    if ("stage" in wording.input) throw Error("Expected wording input");
    const none = await observeSupervisor(
      wording.input,
      new FakeSupervisorJudge((input) => wire(input)),
    );
    expect(none.selection?.status).toBe("NONE");
    expect(SkillSelectionSchema.safeParse({ ...none.selection, status: "SELECTED" }).success).toBe(
      false,
    );
    const failure = await observeSupervisor(
      wording.input,
      new FakeSupervisorJudge(() => {
        throw Error("secret provider payload");
      }),
    );
    expect(failure.selection?.status).toBe("FAILED");
    expect(JSON.stringify(failure)).not.toContain("secret provider payload");
    const structural = cases.find((item) => item.action === "NO_REPLY_NEEDED")!;
    let invoked = false;
    const skipped = await observeSupervisor(
      structural.input,
      new FakeSupervisorJudge(() => {
        invoked = true;
        return {};
      }),
    );
    expect(skipped.stage).toBe("STRUCTURAL_EMPTY");
    expect(invoked).toBe(false);
    const chinese = structuredClone(wording.request);
    chinese.analysis.language.primary = "zh";
    chinese.analysis.language.script = "SIMPLIFIED";
    const serialized = serializeSupervisorEvidence(chinese, wording.action);
    expect(serialized.language.primary).toBe("zh");
  });

  it("rejects all seven B forbidden occurrences; goal-only positives are NOT_EVALUABLE", async () => {
    const { cases, labels } = await prepareSrs4Development();
    const expected = [
      ["SRS3B:R06", "request", "follow_up"],
      ["SRS3B:R10", "de_escalation", "boundary_setting"],
      ["SRS3B:R14", "status_update", "planning"],
      ["CONTROL:K20", "request", "follow_up"],
      ["CONTROL:K21", "planning", "expectation_setting"],
      ["CONTROL:K22", "expectation_setting", "status_update"],
      ["CONTROL:K22", "expectation_setting", "planning"],
    ] as const;
    for (const [key, required, forbidden] of expected) {
      const row = cases.find((item) => item.key === key)!;
      const label = labels.find((item) => item.key === key)!;
      if ("stage" in row.input) throw Error("Expected wording input");
      expect(row.input.candidates.some((candidate) => candidate.skillId === required)).toBe(true);
      expect(row.input.candidates.some((candidate) => candidate.skillId === forbidden)).toBe(true);
      expect(label.required).toContain(required);
      expect(label.forbidden).toContain(forbidden);
      const positiveEvaluable = key !== "SRS3B:R14" && key !== "CONTROL:K22";
      const observed = await observeSupervisor(
        row.input,
        new FakeSupervisorJudge((input) => wire(input, positiveEvaluable ? [required] : [])),
      );
      expect(observed.selection?.status).not.toBe("FAILED");
      expect(observed.selection?.selectedCapabilities.map((item) => item.skillId)).not.toContain(
        forbidden,
      );
      if (!positiveEvaluable) {
        expect(observed.selection?.status).toBe("NONE");
        // R14/K22 are provenance-safety and forbidden-rejection tests only.
        expect(observed.selection?.selectedCapabilities.map((item) => item.skillId)).not.toContain(
          required,
        );
      } else {
        expect(observed.selection?.selectedCapabilities.map((item) => item.skillId)).toEqual([
          required,
        ]);
      }
    }
  });

  it("attributes metric ceilings and leaves unlabeled selections unlabeled", async () => {
    const { cases, labels } = await prepareSrs4Development();
    const observations = await Promise.all(
      cases.map(async (row) => {
        const result = await observeSupervisor(
          row.input,
          new FakeSupervisorJudge((input) => wire(input)),
        );
        return contentFreeDevelopmentObservation(row, result);
      }),
    );
    const metrics = evaluateSupervisorDevelopment(observations, labels);
    expect(metrics.scenarios).toBe(53);
    expect(metrics.requiredTotal).toBe(46);
    expect(metrics.requiredAvailable).toBe(38);
    expect(metrics.requiredProvenanceBlocked).toBe(13);
    expect(metrics.requiredGroundedAvailable).toBe(25);
    expect(metrics.requiredGroundedSelected).toBe(0);
    expect(metrics.positive).toBe(37);
    expect(metrics.fullyRetrievablePositive).toBe(29);
    expect(metrics.multiPositive).toBe(9);
    expect(metrics.multiFullyRetrievable).toBe(6);
    expect(metrics.wordingNoneTotal).toBe(13);
    expect(metrics.structuralTotal).toBe(3);
    expect(metrics.forbiddenAvailable).toBe(12);
    expect(metrics.requiredSelected).toBe(0);
    expect(metrics.wordingNoneCorrect).toBe(13);
    const gaps = exposedDevelopmentProvenanceGaps(cases, labels);
    expect(gaps).toHaveLength(13);
    expect(new Set(gaps.map((gap) => gap.key)).size).toBe(11);
    expect(gaps.every((gap) => gap.bTop10Available)).toBe(true);
    expect(metrics.requiredAvailable - gaps.length).toBe(25);
    expect(
      metrics.requiredDiagnostics.filter((item) => item.stage === "PROVENANCE_GROUNDING_BLOCKED"),
    ).toHaveLength(13);
    expect(
      metrics.requiredDiagnostics.filter((item) => item.stage === "RETRIEVAL_TOP10_MISS"),
    ).toHaveLength(8);
  });
});
