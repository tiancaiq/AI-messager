import { LAB_DEVELOPMENT_ARGUMENT, LAB_RUN_CHANNEL } from "@ai-message-coach/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";

const electron = vi.hoisted(() => ({ exposeInMainWorld: vi.fn(), invoke: vi.fn() }));
vi.mock("electron", () => ({
  contextBridge: { exposeInMainWorld: electron.exposeInMainWorld },
  ipcRenderer: { invoke: electron.invoke },
}));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

async function bridge(argv: string[]) {
  vi.resetModules();
  vi.stubGlobal("process", { ...process, argv, defaultApp: undefined, env: {} });
  await import("./index.js");
  return electron.exposeInMainWorld.mock.calls[0]?.[1];
}

describe("sandboxed Lab preload", () => {
  it("does not expose Lab methods without the main-owned dev marker", async () => {
    const api = await bridge([]);
    expect(api.runLab).toBeUndefined();
    expect(api.getLabConfiguration).toBeUndefined();
  });
  it("uses argv in a sandbox without defaultApp/env flags and validates both directions", async () => {
    const api = await bridge([LAB_DEVELOPMENT_ARGUMENT]);
    expect(Object.isFrozen(api)).toBe(true);
    expect(await api.runLab({ apiKey: "synthetic" })).toMatchObject({
      ok: false,
      code: "INVALID_REQUEST",
    });
    expect(electron.invoke).not.toHaveBeenCalled();
    const request = {
      draft: "",
      incoming: "Hello!",
      userContext: "",
      language: "en",
      selection: { kind: "CLARIFICATION", answer: "Acknowledge" },
    };
    electron.invoke.mockResolvedValueOnce({ providerPayload: "must-not-cross" });
    expect(await api.runLab(request)).toEqual({ ok: false, code: "LAB_FAILED", action: null });
    expect(electron.invoke).toHaveBeenCalledExactlyOnceWith(LAB_RUN_CHANNEL, request);
    electron.invoke.mockRejectedValueOnce(new Error("secret upstream error"));
    expect(await api.runLab(request)).toEqual({ ok: false, code: "UNAVAILABLE", action: null });
  });
});
