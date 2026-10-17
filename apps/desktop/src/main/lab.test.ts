import { coachConversation, type CoachingTextGenerator } from "@ai-message-coach/ai";
import {
  LabRequestSchema,
  LabResultSchema,
  type CoachingDecisionResult,
  type LabRequest,
} from "@ai-message-coach/contracts";
import { describe, expect, it, vi } from "vitest";

import { createCoachingService } from "./coaching.js";
import { createLabService, labCoachingRequest } from "./lab.js";

const input: LabRequest = {
  draft: "I cannot attend tomorrow.",
  incoming: "Want to join us tomorrow?",
  userContext: "",
  language: "en",
};
function generator(primary = input.draft, alternatives: { label: string; text: string }[] = []) {
  const generateCoachingDecision = vi.fn<CoachingTextGenerator["generateCoachingDecision"]>(
    async (_request, policy) => ({
      ok: true,
      decision:
        policy.action === "SUGGEST_REPLY"
          ? { ...policy, action: "SUGGEST_REPLY", replies: [{ label: "Reply", text: primary }] }
          : {
              ...policy,
              action: policy.action === "COMPLETE_DRAFT" ? "COMPLETE_DRAFT" : "REWRITE_DRAFT",
              primary,
              alternatives,
            },
    }),
  );
  return {
    configuration: {
      providerId: "fixture",
      modelId: "synthetic",
      configured: true,
      capabilities: { textGeneration: true, structuredOutput: true, vision: false },
    },
    generateCoachingDecision,
  };
}

describe("development coaching Lab", () => {
  it("bounds inputs and rejects extra credential or routing fields", () => {
    for (const bad of [
      { ...input, draft: "x".repeat(10001) },
      { ...input, incoming: "x".repeat(10001) },
      { ...input, apiKey: "synthetic-secret" },
      { ...input, action: "SUGGEST_REPLY" },
      { ...input, selection: { kind: "CLARIFICATION", answer: " " } },
    ]) {
      expect(LabRequestSchema.safeParse(bad).success).toBe(false);
    }
  });

  it("runs the actual pipeline once, preserving production result, guidance and shadow isolation", async () => {
    const provider = generator();
    const baseline = await coachConversation(provider, labCoachingRequest(input));
    provider.generateCoachingDecision.mockClear();
    const lab = createLabService(createCoachingService(provider), provider.configuration);
    const run = await lab.run(input);
    expect(LabResultSchema.safeParse(run).success).toBe(true);
    expect(run.ok).toBe(true);
    if (!run.ok) throw new Error("Expected run");
    expect(run.result).toEqual(baseline);
    expect(provider.generateCoachingDecision).toHaveBeenCalledOnce();
    expect(run.trace.validation.stage).toBe("PASSED");
    expect(run.trace.composerGuidance).toEqual(
      provider.generateCoachingDecision.mock.calls[0]?.[2],
    );
    expect(run.trace.composerGuidance).toEqual({
      principles: run.trace.productionPlan?.principles,
      avoid: run.trace.productionPlan?.avoid,
    });
    expect(run.trace.shadow?.request?.assessment.status).toBe("ASSESSED");
    expect(run.trace.shadow?.plan).not.toBeNull();
    expect(run.trace.ranking?.candidates.length).toBe(21);
    expect(
      run.trace.ranking?.candidates
        .filter((item) => item.outcome === "SELECTED")
        .map((item) => item.id),
    ).toEqual(run.trace.productionPlan?.selectedSkills.map((item) => item.id));
    expect(run.trace.ranking?.candidates.some((item) => item.outcome === "INELIGIBLE")).toBe(true);
  });

  it("shows the exact first guard failure and the rejected alternatives without changing rejection", async () => {
    const provider = generator(input.draft, [
      { label: "Invalid acceptance", text: "I will attend tomorrow." },
    ]);
    const run = await createLabService(createCoachingService(provider), provider.configuration).run(
      input,
    );
    expect(run).toMatchObject({
      ok: true,
      result: { ok: false, error: { code: "INVALID_RESPONSE" } },
      trace: {
        validation: {
          stage: "GUARD_REJECTED",
          guardRule: "REFUSAL_PRESERVATION",
          candidate: { alternatives: [{ text: "I will attend tomorrow." }] },
        },
      },
    });
    expect(await coachConversation(provider, labCoachingRequest(input))).toEqual(
      run.ok ? run.result : null,
    );
  });

  it("distinguishes adapter rejection from normalized-schema rejection and withholds raw values", async () => {
    const provider = generator();
    const lab = createLabService(createCoachingService(provider), provider.configuration);
    provider.generateCoachingDecision.mockResolvedValueOnce({
      ok: false,
      error: { code: "INVALID_RESPONSE", message: "Invalid provider output." },
    });
    expect(await lab.run(input)).toMatchObject({
      trace: { validation: { stage: "ADAPTER_FAILURE", candidate: null, guardRule: null } },
    });
    provider.generateCoachingDecision.mockResolvedValueOnce({
      privatePayload: "must-not-cross",
    } as unknown as CoachingDecisionResult);
    const invalid = await lab.run(input);
    expect(invalid).toMatchObject({
      trace: { validation: { stage: "RESULT_SCHEMA_REJECTED", candidate: null } },
    });
    expect(JSON.stringify(invalid)).not.toContain("must-not-cross");
  });

  it("permits local inspection without a key but does not claim guidance was sent", async () => {
    const provider = generator();
    provider.configuration.configured = false;
    const run = await createLabService(createCoachingService(provider), provider.configuration).run(
      input,
    );
    expect(run).toMatchObject({
      result: { ok: false, error: { code: "NOT_CONFIGURED" } },
      trace: { composerGuidance: null, validation: { stage: "NOT_REACHED" } },
    });
    expect(run.ok && run.trace.productionPlan).toBeTruthy();
    expect(provider.generateCoachingDecision).not.toHaveBeenCalled();
  });

  it("keeps the real completion action instead of forcing a rewrite", async () => {
    const provider = generator();
    const run = await createLabService(createCoachingService(provider), provider.configuration).run(
      { ...input, draft: "Sorry I" },
    );
    expect(run).toMatchObject({
      ok: true,
      result: { ok: true, decision: { action: "COMPLETE_DRAFT" } },
      trace: { fixedAction: "COMPLETE_DRAFT" },
    });
    expect(provider.generateCoachingDecision).toHaveBeenCalledOnce();
  });

  it("accepts whitespace draft, maps it to absent, and generates replies from incoming evidence", async () => {
    const provider = generator("Hello!");
    const noDraft = LabRequestSchema.parse({ ...input, draft: "  ", incoming: "Hello there!" });
    expect(noDraft.draft).toBe("");
    expect(labCoachingRequest(noDraft).analysis.draft.text).toBeNull();
    const run = await createLabService(createCoachingService(provider), provider.configuration).run(
      noDraft,
    );
    expect(run).toMatchObject({
      ok: true,
      result: { ok: true, decision: { action: "SUGGEST_REPLY", replies: [{ text: "Hello!" }] } },
      trace: { validation: { stage: "PASSED" } },
    });
    expect(provider.generateCoachingDecision).toHaveBeenCalledOnce();
  });

  it.each([
    ["", "ASK_CLARIFICATION"],
    ["Thanks!", "NO_REPLY_NEEDED"],
    ["Want to join us tomorrow?", "SUGGEST_ACTIONS"],
  ])("handles no-draft context %s locally as %s, even without a key", async (incoming, action) => {
    const provider = generator();
    provider.configuration.configured = false;
    const run = await createLabService(createCoachingService(provider), provider.configuration).run(
      { ...input, draft: "", incoming },
    );
    expect(run).toMatchObject({
      ok: true,
      result: { ok: true, decision: { action } },
      trace: { fixedAction: action, composerGuidance: null, validation: { stage: "NOT_REACHED" } },
    });
    expect(provider.generateCoachingDecision).not.toHaveBeenCalled();
  });

  it("continues an offered action with its explicit intent and preserves it on retry", async () => {
    const provider = generator("I cannot attend tomorrow.");
    const lab = createLabService(createCoachingService(provider), provider.configuration);
    const noDraft = { ...input, draft: "" };
    const first = await lab.run(noDraft);
    if (!first.ok || !first.result.ok || first.result.decision.action !== "SUGGEST_ACTIONS")
      throw new Error("Expected choices");
    const action = first.result.decision.actions.find((item) => item.id === "decline")!;
    const continued = { ...noDraft, selection: { kind: "ACTION" as const, ...action } };
    provider.generateCoachingDecision.mockResolvedValueOnce({
      ok: false,
      error: { code: "TIMEOUT", message: "Timed out." },
    });
    expect(await lab.run(continued)).toMatchObject({
      result: { ok: false, error: { code: "TIMEOUT" } },
    });
    expect(await lab.run(continued)).toMatchObject({
      result: { ok: true, decision: { action: "SUGGEST_REPLY" } },
    });
    expect(provider.generateCoachingDecision).toHaveBeenCalledTimes(2);
    for (const [request] of provider.generateCoachingDecision.mock.calls)
      expect(request.selection).toEqual(continued.selection);
  });

  it("continues a clarification using the same no-draft policy path", async () => {
    const provider = generator("Hello!");
    const selection = { kind: "CLARIFICATION" as const, answer: "Acknowledge" };
    const run = await createLabService(createCoachingService(provider), provider.configuration).run(
      { ...input, draft: "", incoming: "", selection },
    );
    expect(run).toMatchObject({ result: { ok: true, decision: { action: "SUGGEST_REPLY" } } });
    expect(provider.generateCoachingDecision.mock.calls[0]?.[0].selection).toEqual(selection);
  });

  it("qualifies manual context ownership and language without inferred contact or memory", () => {
    const request = labCoachingRequest({
      ...input,
      userContext: "I am checking the notes.",
      language: "zh-Hant",
    });
    expect(request.analysis.messages.map((item) => item.speaker)).toEqual(["USER", "OTHER"]);
    expect(request.analysis.language).toMatchObject({ primary: "zh", script: "TRADITIONAL" });
    expect(request.analysis.visibleContact.displayName).toBeNull();
    expect(request.selection).toBeNull();
    expect(
      labCoachingRequest({ ...input, language: "other" }).analysis.language
        .supportedForLanguageSpecificSkills,
    ).toBe(false);
  });

  it("shares the existing single-flight limit with normal coaching and releases it", async () => {
    const provider = generator();
    let resolve!: (result: CoachingDecisionResult) => void;
    provider.generateCoachingDecision.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const service = createCoachingService(provider);
    const lab = createLabService(service, provider.configuration);
    const first = lab.run(input);
    await vi.waitFor(() => expect(provider.generateCoachingDecision).toHaveBeenCalledOnce());
    expect(await lab.run(input)).toMatchObject({ ok: false, code: "COACHING_IN_PROGRESS" });
    expect(await service.requestCoaching(labCoachingRequest(input))).toMatchObject({
      ok: false,
      error: { code: "COACHING_IN_PROGRESS" },
    });
    resolve({ ok: false, error: { code: "TIMEOUT", message: "Timed out." } });
    await first;
    expect(await lab.run(input)).toMatchObject({ ok: true, result: { ok: true } });
  });

  it("observer throws and mutations cannot change production guidance or output", async () => {
    const provider = generator();
    const request = labCoachingRequest(input);
    const baseline = await coachConversation(provider, request);
    const result = await coachConversation(provider, request, {
      onSkillContext: (context) => {
        context.intentTags.length = 0;
      },
      onSkillRanking: () => {
        throw new Error("synthetic observer failure");
      },
      onShadowDetails: (details) => {
        details.selection.selectedSkills.length = 0;
      },
      onComposerGuidance: (guidance) => {
        guidance.principles.length = 0;
      },
      onValidation: () => {
        throw new Error("synthetic observer failure");
      },
    });
    expect(result).toEqual(baseline);
    expect(provider.generateCoachingDecision.mock.calls[1]?.[2]).toEqual(
      provider.generateCoachingDecision.mock.calls[0]?.[2],
    );
  });
});
