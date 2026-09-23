import {
  LOCAL_MEMORY_CLEAR_CHANNEL,
  LOCAL_MEMORY_INSPECT_CHANNEL,
  LOCAL_MEMORY_READ_CHANNEL,
  LOCAL_MEMORY_RESET_UNAVAILABLE_CHANNEL,
  LOCAL_MEMORY_SAVE_CHANNEL,
  LOCAL_MEMORY_STATUS_CHANNEL,
} from "@ai-message-coach/contracts";
import { beforeEach, describe, expect, it, vi } from "vitest";

const handlers = vi.hoisted(
  () => new Map<string, (event: unknown, ...arguments_: unknown[]) => unknown>(),
);

vi.mock("electron", () => ({
  ipcMain: {
    handle: vi.fn(
      (channel: string, handler: (event: unknown, ...arguments_: unknown[]) => unknown) => {
        handlers.set(channel, handler);
      },
    ),
  },
}));

import { registerLocalMemoryHandlers, registerLocalMemoryInspectorHandler } from "./ipc.js";

const generation = "00000000-0000-4000-8000-000000000001";
const success = {
  ok: true as const,
  snapshot: {
    generation,
    revision: 0,
    directoryRevision: 0,
    memoryRevision: 0,
    messageLength: null,
    updatedAt: null,
  },
};

function createStore() {
  return {
    status: vi.fn(async () => ({ available: true as const, snapshot: success.snapshot })),
    read: vi.fn(async () => success),
    save: vi.fn(async () => success),
    delete: vi.fn(async () => success),
    clear: vi.fn(async () => success),
    resetUnavailable: vi.fn(async () => success),
    inspect: vi.fn(async () => ({
      ok: false as const,
      error: { code: "STORE_UNAVAILABLE" as const, message: "Unavailable." },
    })),
  };
}

beforeEach(() => handlers.clear());

describe("local-memory IPC", () => {
  it("rejects every production operation from an unauthorized renderer", async () => {
    const store = createStore();
    registerLocalMemoryHandlers(store as never, () => false);
    const event = {};

    await expect(handlers.get(LOCAL_MEMORY_STATUS_CHANNEL)?.(event)).resolves.toMatchObject({
      available: false,
    });
    await expect(handlers.get(LOCAL_MEMORY_READ_CHANNEL)?.(event)).resolves.toMatchObject({
      ok: false,
    });
    await expect(
      handlers.get(LOCAL_MEMORY_SAVE_CHANNEL)?.(event, {
        generation,
        revision: 0,
        value: "CONCISE",
      }),
    ).resolves.toMatchObject({ ok: false, error: { code: "INVALID_REQUEST" } });
    await expect(
      handlers.get(LOCAL_MEMORY_CLEAR_CHANNEL)?.(event, {
        generation,
        confirmation: "CLEAR_LOCAL_MEMORY",
      }),
    ).resolves.toMatchObject({ ok: false });
    await expect(
      handlers.get(LOCAL_MEMORY_RESET_UNAVAILABLE_CHANNEL)?.(event, {
        confirmation: "ERASE_UNAVAILABLE_LOCAL_MEMORY",
      }),
    ).resolves.toMatchObject({ ok: false });
    expect(store.status).not.toHaveBeenCalled();
    expect(store.save).not.toHaveBeenCalled();
    expect(store.clear).not.toHaveBeenCalled();
    expect(store.resetUnavailable).not.toHaveBeenCalled();
  });

  it("does not register a production renderer contact-directory channel", () => {
    const store = createStore();
    registerLocalMemoryHandlers(store as never, () => true);
    expect(handlers.has("local-memory:contact-directory")).toBe(false);
  });

  it("accepts only strict authorized reset and save requests", async () => {
    const store = createStore();
    registerLocalMemoryHandlers(store as never, () => true);
    const event = {};

    await handlers.get(LOCAL_MEMORY_SAVE_CHANNEL)?.(event, {
      generation,
      revision: 0,
      value: "CONCISE",
      sql: "SELECT 1",
    });
    await handlers.get(LOCAL_MEMORY_RESET_UNAVAILABLE_CHANNEL)?.(event, {
      confirmation: "erase",
    });
    expect(store.save).not.toHaveBeenCalled();
    expect(store.resetUnavailable).not.toHaveBeenCalled();

    await handlers.get(LOCAL_MEMORY_SAVE_CHANNEL)?.(event, {
      generation,
      revision: 0,
      value: "CONCISE",
    });
    await handlers.get(LOCAL_MEMORY_RESET_UNAVAILABLE_CHANNEL)?.(event, {
      confirmation: "ERASE_UNAVAILABLE_LOCAL_MEMORY",
    });
    expect(store.save).toHaveBeenCalledOnce();
    expect(store.resetUnavailable).toHaveBeenCalledOnce();
  });

  it("keeps development inspection bounded and authorized", async () => {
    const store = createStore();
    registerLocalMemoryInspectorHandler(store as never, () => true);
    const handler = handlers.get(LOCAL_MEMORY_INSPECT_CHANNEL);

    await expect(handler?.({}, { sql: "SELECT 1" })).resolves.toMatchObject({ ok: false });
    expect(store.inspect).not.toHaveBeenCalled();
    await handler?.({}, { section: "CONTACT", limit: 20, cursor: null });
    expect(store.inspect).toHaveBeenCalledOnce();
  });
});
