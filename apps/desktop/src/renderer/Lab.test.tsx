import { renderToStaticMarkup } from "react-dom/server";
import { LabRequestSchema } from "@ai-message-coach/contracts";
import { describe, expect, it } from "vitest";
import { Lab, LabResultView } from "./Lab.js";
import { App } from "./App.js";
import { createLabService } from "../main/lab.js";
import { createCoachingService } from "../main/coaching.js";

describe("Lab presentation", () => {
  it("offers optional bounded recipient fields with an explicit UI-only disclosure", () => {
    const markup = renderToStaticMarkup(<Lab onClose={() => undefined} />);
    for (const label of [
      "Talking to (optional)",
      "UI preview",
      "Name or nickname",
      "Relationship to you",
      "Not used for generation yet",
      "not sent to the AI provider",
      "Clear or Close removes both",
    ])
      expect(markup.replace(/\s+/g, " ")).toContain(label);
    for (const id of ["lab-recipient-name", "lab-recipient-relationship"]) {
      const field = markup.match(new RegExp(`<input[^>]*id="${id}"[^>]*>`))?.[0];
      expect(field).toBeDefined();
      expect(field).toContain('maxLength="120"');
      expect(field).toContain('autoComplete="off"');
      expect(field).toContain('aria-describedby="lab-recipient-note"');
      expect(field).not.toContain("required");
    }
  });
  it("does not allow preview recipient data through the strict Lab request", () => {
    const input = { draft: "I cannot attend.", incoming: "", userContext: "", language: "en" };
    expect(LabRequestSchema.safeParse(input).success).toBe(true);
    expect(
      LabRequestSchema.safeParse({
        ...input,
        recipient: { name: "Alex", relationship: "coworker" },
      }).success,
    ).toBe(false);
    expect(
      LabRequestSchema.safeParse({ ...input, name: "Alex", relationship: "coworker" }).success,
    ).toBe(false);
  });
  it("has labelled inputs, clear/close and provider disclosure without a send action", () => {
    const markup = renderToStaticMarkup(<Lab onClose={() => undefined} />);
    for (const label of [
      "Your draft",
      "Incoming message",
      "Your earlier message",
      "Input language",
      "Generate response",
      "Close Lab",
      "Clear",
      "billed by that provider",
      "does not save",
      "Manual simulation",
    ])
      expect(markup).toContain(label);
    expect(markup).not.toContain(">Send</button>");
    expect(markup.match(/<textarea[^>]*id="lab-draft"[^>]*>/)?.[0]).not.toContain("required");
    expect(markup).toMatch(/<button[^>]*type="submit"[^>]*>Generate response<\/button>/);
    expect(markup.match(/<button[^>]*type="submit"[^>]*>/)?.[0]).not.toContain("disabled");
    expect(renderToStaticMarkup(<App />)).not.toContain("Open Lab");
  });
  it.each([
    ["", "What would you like to communicate?", "Acknowledge"],
    ["Want to join us tomorrow?", "What would you like to do?", "Decline"],
    ["Thanks!", "No reply needed", "Optional acknowledgment"],
  ])(
    "renders no-draft local outcomes without claiming model validation: %s",
    async (incoming, heading, option) => {
      const configuration = {
        providerId: "fixture",
        modelId: "fixture",
        configured: false,
        capabilities: { vision: false, textGeneration: true, structuredOutput: true },
      };
      const run = await createLabService(
        createCoachingService({
          configuration,
          generateCoachingDecision: async () => {
            throw new Error("No provider call expected");
          },
        }),
        configuration,
      ).run({ draft: "", incoming, userContext: "", language: "en" });
      const markup = renderToStaticMarkup(<LabResultView run={run} onSelect={() => undefined} />);
      expect(markup).toContain(heading);
      expect(markup).toContain(option);
      expect(markup).toContain("Local policy decision");
      expect(markup).not.toContain("Accepted by current guards");
      expect(markup).not.toContain("Run stopped");
    },
  );
  it("shows no-key local traces with explicit production/shadow and unavailable-data labels", async () => {
    const configuration = {
      providerId: "fixture",
      modelId: "fixture",
      configured: false,
      capabilities: { vision: false, textGeneration: true, structuredOutput: true },
    };
    const run = await createLabService(
      createCoachingService({
        configuration,
        generateCoachingDecision: async () => {
          throw new Error("Must not call provider");
        },
      }),
      configuration,
    ).run({ draft: "I cannot attend.", incoming: "", userContext: "", language: "en" });
    const markup = renderToStaticMarkup(<LabResultView run={run} />);
    for (const label of [
      "NOT_CONFIGURED",
      "NOT_REACHED",
      "REWRITE_DRAFT",
      "top-k cap 4",
      "not sent to Composer",
      "Composer was not invoked",
      "OBSERVED_SCREENSHOT",
      "manual simulation",
      "Detailed shadow candidate ranks and exclusions are not currently exposed",
    ])
      expect(markup).toContain(label);
  });
});
