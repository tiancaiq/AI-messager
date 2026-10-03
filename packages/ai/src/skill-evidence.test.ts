import { coachingEvaluationFixtures } from "@ai-message-coach/test-fixtures";
import { describe, expect, it } from "vitest";

import { normalizeCommunicationProblem } from "./communication-problem.js";
import { decideCoachingAction } from "./coaching-policy.js";
import { deriveSkillContext } from "./skill-context.js";
import { projectSkillEvidence } from "./skill-evidence.js";

const fixture = coachingEvaluationFixtures.find(
  (candidate) => candidate.id === "clear-draft-uncertain-tomorrow",
)!;
const request = { analysis: fixture.input, selection: null };
const policy = decideCoachingAction(request);
const context = deriveSkillContext(request, policy);

describe("B2 Agent-side evidence projection", () => {
  it("preserves bounded provenance and request-local references without copying private text", () => {
    const problem = normalizeCommunicationProblem(request);
    const evidence = projectSkillEvidence(problem, context, policy.action);
    expect(projectSkillEvidence(problem, context, policy.action)).toEqual(evidence);
    expect(evidence.map(({ id }) => id)).toEqual(evidence.map((_, index) => `E${index + 1}`));
    expect(
      evidence.some(
        (item) => item.kind === "SOURCE_DRAFT" && item.source === "OBSERVED_SCREENSHOT",
      ),
    ).toBe(true);
    expect(
      evidence.some(
        (item) => item.kind === "CONTEXT_TAG" && item.source === "DETERMINISTIC_DERIVATION",
      ),
    ).toBe(true);
    expect(evidence).toContainEqual(
      expect.objectContaining({
        kind: "UNKNOWN_IDENTITY",
        source: "UNKNOWN",
        value: { format: "UNKNOWN" },
      }),
    );
    expect(evidence).toContainEqual(
      expect.objectContaining({
        kind: "UNKNOWN_RELATIONSHIP",
        source: "UNKNOWN",
        value: { format: "UNKNOWN" },
      }),
    );
    const serialized = JSON.stringify(evidence);
    expect(serialized).not.toContain(problem.sourceDraft?.text ?? "private-draft");
    expect(serialized).not.toContain(problem.latestOtherMessage?.text ?? "private-message");
    expect(serialized).not.toContain(problem.visibleContact.displayName ?? "private-name");
  });

  it("keeps explicit user-supplied scope distinct and rejects an action or context mismatch", () => {
    const problem = normalizeCommunicationProblem(request, {
      instruction: "Make it warmer.",
      relationship: "Colleague",
      hardConstraints: ["Do not promise a date."],
      stylisticPriorities: ["Concise"],
    });
    const evidence = projectSkillEvidence(problem, context, policy.action);
    expect(
      evidence.some((item) => item.kind === "USER_DIRECTION" && item.source === "USER_SUPPLIED"),
    ).toBe(true);
    expect(
      evidence.some((item) => item.kind === "HARD_CONSTRAINT" && item.source === "USER_SUPPLIED"),
    ).toBe(true);
    expect(
      evidence.some((item) => item.kind === "STYLE_PRIORITY" && item.source === "USER_SUPPLIED"),
    ).toBe(true);
    expect(evidence.some((item) => item.kind === "UNKNOWN_IDENTITY")).toBe(true);
    expect(evidence.some((item) => item.kind === "UNKNOWN_RELATIONSHIP")).toBe(false);
    expect(JSON.stringify(evidence)).not.toContain("Colleague");
    expect(() => projectSkillEvidence(problem, context, "SUGGEST_REPLY")).toThrow(
      "FIXED_ACTION_MISMATCH",
    );
    expect(() =>
      projectSkillEvidence(problem, { ...context, draftPresent: false }, policy.action),
    ).toThrow("PROJECTION_CONTEXT_MISMATCH");
  });
});
