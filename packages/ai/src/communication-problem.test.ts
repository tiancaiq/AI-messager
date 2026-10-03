import { CoachingRequestSchema, type CoachingRequest } from "@ai-message-coach/contracts";
import { coachingEvaluationFixtures } from "@ai-message-coach/test-fixtures";
import { describe, expect, it } from "vitest";

import {
  CommunicationProblemSchema,
  normalizeCommunicationProblem,
} from "./communication-problem.js";
import { decideCoachingAction } from "./coaching-policy.js";

const fixture = coachingEvaluationFixtures.find(
  (candidate) => candidate.id === "clear-draft-uncertain-tomorrow",
)!;
const request: CoachingRequest = { analysis: fixture.input, selection: null };

describe("Phase A communication problem normalization", () => {
  it("constructs a bounded validated problem from observed draft and context", () => {
    const problem = normalizeCommunicationProblem(request);
    expect(CommunicationProblemSchema.parse(problem)).toEqual(problem);
    expect(problem.instruction).toBeNull();
    expect(problem.goal).toEqual({
      kind: "WORK_WITH_DRAFT",
      value: null,
      provenance: "DETERMINISTIC_DERIVATION",
    });
    expect(problem.sourceDraft).toEqual({
      text: fixture.input.draft.text,
      confidence: fixture.input.draft.confidence,
      provenance: "OBSERVED_SCREENSHOT",
    });
    expect(problem.latestOtherMessage?.id).toBe(fixture.input.messages[0]?.id);
    expect(problem.meaningToPreserve).toEqual({
      text: fixture.input.draft.text,
      provenance: "OBSERVED_SCREENSHOT",
    });
    expect(problem.hardConstraints).toEqual([]);
    expect(problem.stylisticPriorities).toEqual([]);
    expect(problem.unknowns).toEqual([
      "CONFIRMED_IDENTITY",
      "EXPLICIT_INSTRUCTION",
      "RECIPIENT",
      "RELATIONSHIP",
    ]);
  });

  it("accepts only explicitly supplied instruction and relationship fields", () => {
    const problem = normalizeCommunicationProblem(request, {
      instruction: "Make this friendlier.",
      recipient: "Alex",
      relationship: "Cofounder",
      hardConstraints: ["Keep the uncertainty about tomorrow."],
      stylisticPriorities: ["Warmer", "More concise"],
    });
    expect(problem.instruction).toEqual({
      value: "Make this friendlier.",
      provenance: "USER_SUPPLIED",
    });
    expect(problem.recipient).toEqual({ value: "Alex", provenance: "USER_SUPPLIED" });
    expect(problem.relationship).toEqual({ value: "Cofounder", provenance: "USER_SUPPLIED" });
    expect(problem.hardConstraints).toEqual([
      { value: "Keep the uncertainty about tomorrow.", provenance: "USER_SUPPLIED" },
    ]);
    expect(problem.stylisticPriorities).toEqual([
      { value: "Warmer", provenance: "USER_SUPPLIED" },
      { value: "More concise", provenance: "USER_SUPPLIED" },
    ]);
    expect(problem.meaningToPreserve?.text).toBe(fixture.input.draft.text);
  });

  it("uses an explicit instruction as the goal only without a draft or selection", () => {
    const withoutDraft: CoachingRequest = {
      analysis: { ...request.analysis, draft: { text: null, confidence: 0.9 } },
      selection: null,
    };
    const problem = normalizeCommunicationProblem(withoutDraft, {
      instruction: "Ask for a short status update.",
    });
    expect(problem.goal).toEqual({
      kind: "FOLLOW_INSTRUCTION",
      value: "Ask for a short status update.",
      provenance: "DETERMINISTIC_DERIVATION",
    });
    expect(problem.meaningToPreserve).toBeNull();
  });

  it("does not promote visible contact cues into confirmed identity or relationship", () => {
    const observed: CoachingRequest = {
      ...request,
      analysis: {
        ...request.analysis,
        visibleContact: {
          displayName: "Alex",
          username: "alex-visible",
          channelOrGroupName: null,
          platformHint: "Synthetic chat",
          confidence: 0.98,
        },
      },
    };
    const problem = normalizeCommunicationProblem(observed);
    expect(problem.visibleContact.displayName).toBe("Alex");
    expect(problem.visibleContact.provenance).toBe("OBSERVED_SCREENSHOT");
    expect(problem.recipient).toBeNull();
    expect(problem.relationship).toBeNull();
    expect(problem.unknowns).toContain("CONFIRMED_IDENTITY");
    expect(problem.unknowns).toContain("RELATIONSHIP");
  });

  it("propagates supported language, script, and code switching without translating", () => {
    for (const id of [
      "simplified-draft",
      "traditional-invitation",
      "mixed-draft",
      "other-language",
    ]) {
      const source = coachingEvaluationFixtures.find((candidate) => candidate.id === id)!;
      const problem = normalizeCommunicationProblem({ analysis: source.input, selection: null });
      expect(problem.language).toEqual(source.input.language);
    }
  });

  it("preserves only an exact selected intent and its user-selection provenance", () => {
    const selected: CoachingRequest = {
      analysis: request.analysis,
      selection: {
        kind: "ACTION",
        id: "decline",
        label: "Decline",
        intent: "Decline without inventing a reason.",
      },
    };
    const problem = normalizeCommunicationProblem(selected);
    expect(problem.goal.kind).toBe("FOLLOW_SELECTION");
    expect(problem.goal.value).toBe(
      selected.selection?.kind === "ACTION" ? selected.selection.intent : null,
    );
    expect(problem.meaningToPreserve).toEqual({
      text: "Decline without inventing a reason.",
      provenance: "USER_SUPPLIED",
    });
    expect(problem.meaningToPreserve?.text).not.toContain("tomorrow");
  });

  it("keeps unsupported goals unknown and copies only existing warnings", () => {
    const noDraft: CoachingRequest = {
      analysis: {
        ...request.analysis,
        draft: { text: null, confidence: 0.2 },
        warnings: ["AMBIGUOUS_SPEAKER"],
      },
      selection: null,
    };
    const problem = normalizeCommunicationProblem(noDraft);
    expect(problem.goal.kind).toBe("UNKNOWN");
    expect(problem.unknowns).toContain("COMMUNICATION_GOAL");
    expect(problem.unknowns).toContain("SOURCE_DRAFT");
    expect(problem.concerns).toEqual([
      { code: "AMBIGUOUS_SPEAKER", provenance: "ANALYSIS_INFERENCE" },
    ]);
    expect(problem.meaningToPreserve).toBeNull();
  });

  it("rejects oversized or unclassified internal input and unknown problem fields", () => {
    expect(() =>
      normalizeCommunicationProblem(request, { instruction: "x".repeat(501) }),
    ).toThrow();
    expect(() =>
      normalizeCommunicationProblem(request, { hardConstraints: Array(9).fill("Keep meaning") }),
    ).toThrow();
    expect(() =>
      normalizeCommunicationProblem(request, { stylisticPriorities: Array(7).fill("Warm") }),
    ).toThrow();
    expect(() =>
      normalizeCommunicationProblem(request, { recipient: "Alex", unsupported: true } as never),
    ).toThrow();
    expect(() =>
      CommunicationProblemSchema.parse({ ...normalizeCommunicationProblem(request), extra: true }),
    ).toThrow();
  });

  it("is deterministic and leaves every existing policy fixture unchanged", () => {
    for (const source of coachingEvaluationFixtures) {
      const currentRequest: CoachingRequest = { analysis: source.input, selection: null };
      const snapshot = structuredClone(currentRequest);
      const before = decideCoachingAction(currentRequest);
      expect(normalizeCommunicationProblem(currentRequest)).toEqual(
        normalizeCommunicationProblem(currentRequest),
      );
      expect(currentRequest, source.id).toEqual(snapshot);
      expect(decideCoachingAction(currentRequest), source.id).toEqual(before);
      expect([source.expectedAction, ...(source.acceptableActions ?? [])], source.id).toContain(
        before.action,
      );
    }
    expect(Object.keys(CoachingRequestSchema.shape)).toEqual(["analysis", "selection"]);
  });
});
