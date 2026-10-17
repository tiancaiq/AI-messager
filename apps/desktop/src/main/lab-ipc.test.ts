import { LAB_RUN_CHANNEL, LAB_CONFIGURATION_CHANNEL } from "@ai-message-coach/contracts";
import { beforeEach, describe, expect, it, vi } from "vitest";

const handlers = vi.hoisted(
  () => new Map<string, (event: unknown, ...args: unknown[]) => unknown>(),
);
vi.mock("electron", () => ({
  ipcMain: { handle: vi.fn((channel, handler) => handlers.set(channel, handler)) },
}));
import { registerLabHandlers } from "./lab-ipc.js";

const development = { packaged: false, defaultApp: true, rendererUrl: "http://127.0.0.1:5173" };
const service = () => ({
  configuration: {
    providerId: "fixture",
    modelId: "fixture",
    configured: false,
    capabilities: { textGeneration: true, structuredOutput: true, vision: false },
  },
  run: vi.fn(async () => ({ ok: false as const, code: "LAB_FAILED" as const, action: null })),
});
beforeEach(() => handlers.clear());
describe("Lab IPC gates", () => {
  it.each([
    { ...development, packaged: true },
    { ...development, defaultApp: false },
    { ...development, rendererUrl: undefined },
    { ...development, rendererUrl: "https://untrusted.invalid" },
  ])("registers no handlers outside the allowlisted development mode", (environment) => {
    registerLabHandlers(service(), environment, () => true);
    expect(handlers.size).toBe(0);
  });
  it("rejects unauthorized frames, wrong arity and malformed input before the service", async () => {
    const lab = service();
    registerLabHandlers(lab, development, (event) => event === ("authorized" as unknown));
    expect(handlers.get(LAB_CONFIGURATION_CHANNEL)?.("unauthorized")).toBeNull();
    expect(handlers.get(LAB_CONFIGURATION_CHANNEL)?.("authorized", "extra")).toBeNull();
    expect(handlers.get(LAB_CONFIGURATION_CHANNEL)?.("authorized")).toEqual(lab.configuration);
    const request = {
      draft: "",
      incoming: "Hello!",
      userContext: "",
      language: "en",
      selection: { kind: "CLARIFICATION", answer: "Acknowledge" },
    };
    for (const [event, args] of [
      ["unauthorized", [request]],
      ["authorized", []],
      ["authorized", [request, request]],
      ["authorized", [{ ...request, credential: "synthetic" }]],
    ] as const) {
      expect(await handlers.get(LAB_RUN_CHANNEL)?.(event, ...args)).toMatchObject({ ok: false });
    }
    expect(lab.run).not.toHaveBeenCalled();
    await handlers.get(LAB_RUN_CHANNEL)?.("authorized", request);
    expect(lab.run).toHaveBeenCalledExactlyOnceWith(request);
  });
});
