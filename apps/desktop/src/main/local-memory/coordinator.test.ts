import type {
  LocalMemorySnapshot,
  StorageWorkerRequest,
  StorageWorkerResponse,
} from "@ai-message-coach/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("electron", () => ({
  app: { getPath: vi.fn() },
  safeStorage: {},
  utilityProcess: { fork: vi.fn() },
}));

import { LocalMemoryCoordinator, type LocalMemoryCoordinatorDependencies } from "./coordinator.js";
import { KeyUnavailableError } from "./key-custody.js";

const generation = "00000000-0000-4000-8000-000000000001";
const nextGeneration = "00000000-0000-4000-8000-000000000002";
const snapshot = (revision = 0, messageLength: LocalMemorySnapshot["messageLength"] = null) => ({
  generation,
  revision,
  directoryRevision: 0,
  memoryRevision: 0,
  messageLength,
  updatedAt: messageLength ? "2026-09-14T10:00:00.000Z" : null,
});

class FakeWorker {
  readonly messages: StorageWorkerRequest[] = [];
  killed = false;
  exitOnKill = true;
  throwOnPost = false;
  private messageListeners: ((message: unknown) => void)[] = [];
  private exitListeners: (() => void)[] = [];

  on(event: "message", listener: (message: unknown) => void) {
    if (event === "message") this.messageListeners.push(listener);
  }

  once(event: "exit", listener: () => void) {
    if (event === "exit") this.exitListeners.push(listener);
  }

  postMessage(message: unknown) {
    if (this.throwOnPost) throw new Error("synthetic worker transport failure");
    this.messages.push(message as StorageWorkerRequest);
  }

  kill() {
    this.killed = true;
    if (this.exitOnKill) this.exit();
    return true;
  }

  exit() {
    for (const listener of this.exitListeners.splice(0)) listener();
  }

  respond(result: StorageWorkerResponse["result"], request = this.messages.at(-1)) {
    if (!request) throw new Error("No worker request to answer.");
    for (const listener of this.messageListeners) {
      listener({ requestId: request.requestId, result });
    }
  }
}

function createDependencies(overrides: Partial<LocalMemoryCoordinatorDependencies> = {}) {
  const workers: FakeWorker[] = [];
  const eraseStore = vi.fn(async () => undefined);
  const dependencies: LocalMemoryCoordinatorDependencies = {
    eraseStore,
    forkWorker: () => {
      const worker = new FakeWorker();
      workers.push(worker);
      return worker;
    },
    getUserDataPath: () => "C:\\synthetic-user-data",
    loadKey: async () => ({
      databasePath: "C:\\synthetic-user-data\\local-memory\\memory.db",
      storeId: "00000000-0000-4000-8000-000000000010",
      keyHex: "11".repeat(32),
    }),
    now: () => Date.now(),
    ...overrides,
  };
  return { dependencies, eraseStore, workers };
}

async function flush() {
  for (let index = 0; index < 10; index += 1) await Promise.resolve();
}

async function initialize(coordinator: LocalMemoryCoordinator, workers: FakeWorker[]) {
  const result = coordinator.initialize();
  await flush();
  workers[0]?.respond({ ok: true, snapshot: snapshot() });
  await expect(result).resolves.toEqual({ ok: true, snapshot: snapshot() });
}

afterEach(() => {
  vi.useRealTimers();
});

describe("LocalMemoryCoordinator", () => {
  it("routes encrypted debug snapshot export only through the utility worker", async () => {
    const { dependencies, workers } = createDependencies();
    const coordinator = new LocalMemoryCoordinator(dependencies);
    await initialize(coordinator, workers);
    const worker = workers[0];
    if (!worker) throw new Error("Worker was not started.");

    const databasePath = "C:\\Temp\\memory-debug.db";
    const exported = coordinator.exportDebugSnapshot({
      snapshotPath: databasePath,
      passphrase: "a".repeat(32),
    });
    expect(worker.messages.at(-1)).toMatchObject({
      operation: "EXPORT_DEBUG_SNAPSHOT",
      snapshotPath: databasePath,
    });
    worker.respond({ ok: true, snapshot: { schemaVersion: 6, databasePath } });
    await expect(exported).resolves.toEqual({
      ok: true,
      snapshot: { schemaVersion: 6, databasePath },
    });
  });

  it("keeps bounded assertion operations on the private utility channel", async () => {
    const { dependencies, workers } = createDependencies();
    const coordinator = new LocalMemoryCoordinator(dependencies);
    await initialize(coordinator, workers);
    const worker = workers[0];
    if (!worker) throw new Error("Worker was not started.");

    const listed = coordinator.memory({
      operation: "LIST",
      generation,
      memoryRevision: 0,
      recordType: "MEMORY_ASSERTION",
      filter: null,
      cursor: null,
      limit: 20,
    });
    expect(worker.messages.at(-1)).toMatchObject({
      operation: "MEMORY",
      request: { operation: "LIST", recordType: "MEMORY_ASSERTION" },
    });
    worker.respond({
      ok: true,
      result: {
        kind: "PAGE",
        generation,
        memoryRevision: 0,
        recordType: "MEMORY_ASSERTION",
        records: [],
        nextCursor: null,
      },
    });
    await expect(listed).resolves.toMatchObject({ ok: true, result: { kind: "PAGE" } });
  });

  it("bounds the waiting queue while one worker command is active", async () => {
    const { dependencies, workers } = createDependencies();
    const coordinator = new LocalMemoryCoordinator(dependencies);
    await initialize(coordinator, workers);

    const active = coordinator.read();
    const waiting = Array.from({ length: 8 }, () => coordinator.read());
    await expect(coordinator.read()).resolves.toMatchObject({
      ok: false,
      error: { code: "BUSY" },
    });

    coordinator.close();
    await expect(active).resolves.toMatchObject({ ok: false });
    await Promise.all(waiting);
  });

  it("retires a timed-out writer and requires an authoritative reopen before another mutation", async () => {
    vi.useFakeTimers();
    const { dependencies, workers } = createDependencies();
    const coordinator = new LocalMemoryCoordinator(dependencies);
    await initialize(coordinator, workers);
    const firstWorker = workers[0];
    if (!firstWorker) throw new Error("Worker was not started.");

    const timedOut = coordinator.save({ generation, revision: 0, value: "CONCISE" });
    const timedRequest = firstWorker.messages.at(-1);
    await vi.advanceTimersByTimeAsync(2_000);
    await expect(timedOut).resolves.toMatchObject({
      ok: false,
      error: { code: "UNKNOWN_WRITE_OUTCOME" },
    });
    expect(firstWorker.killed).toBe(true);
    await expect(
      coordinator.save({ generation, revision: 0, value: "DETAILED" }),
    ).resolves.toMatchObject({ ok: false, error: { code: "STORE_UNAVAILABLE" } });

    firstWorker.respond({ ok: true, snapshot: snapshot(1, "CONCISE") }, timedRequest);
    const status = coordinator.status();
    await flush();
    expect(workers).toHaveLength(2);
    workers[1]?.respond({ ok: true, snapshot: snapshot(1, "CONCISE") });
    await expect(status).resolves.toEqual({
      available: true,
      snapshot: snapshot(1, "CONCISE"),
    });
  });

  it("does not start a replacement writer until the retired process has exited", async () => {
    vi.useFakeTimers();
    const { dependencies, workers } = createDependencies();
    const coordinator = new LocalMemoryCoordinator(dependencies);
    await initialize(coordinator, workers);
    const worker = workers[0];
    if (!worker) throw new Error("Worker was not started.");
    worker.exitOnKill = false;

    const timedOut = coordinator.save({ generation, revision: 0, value: "CONCISE" });
    await vi.advanceTimersByTimeAsync(2_000);
    await expect(timedOut).resolves.toMatchObject({
      ok: false,
      error: { code: "UNKNOWN_WRITE_OUTCOME" },
    });
    const statusBeforeExit = coordinator.status();
    await vi.advanceTimersByTimeAsync(2_000);
    await expect(statusBeforeExit).resolves.toMatchObject({ available: false });
    expect(workers).toHaveLength(1);

    worker.exit();
    await flush();
    const statusAfterExit = coordinator.status();
    await flush();
    expect(workers).toHaveLength(2);
    workers[1]?.respond({ ok: true, snapshot: snapshot(1, "CONCISE") });
    await expect(statusAfterExit).resolves.toMatchObject({ available: true });
  });

  it("serializes clear before a queued stale write so the old generation cannot return", async () => {
    const { dependencies, workers } = createDependencies();
    const coordinator = new LocalMemoryCoordinator(dependencies);
    await initialize(coordinator, workers);
    const worker = workers[0];
    if (!worker) throw new Error("Worker was not started.");

    const clear = coordinator.clear({ generation, confirmation: "CLEAR_LOCAL_MEMORY" });
    const staleSave = coordinator.save({ generation, revision: 0, value: "DETAILED" });
    worker.respond({
      ok: true,
      snapshot: {
        generation: nextGeneration,
        revision: 0,
        directoryRevision: 0,
        memoryRevision: 0,
        messageLength: null,
        updatedAt: null,
      },
    });
    await expect(clear).resolves.toMatchObject({
      ok: true,
      snapshot: { generation: nextGeneration },
    });
    expect(worker.messages.at(-1)?.operation).toBe("SAVE");
    worker.respond({
      ok: false,
      error: { code: "CONFLICT", message: "Local memory changed. Refresh and try again." },
    });
    await expect(staleSave).resolves.toMatchObject({ ok: false, error: { code: "CONFLICT" } });
  });

  it("keeps a hung open bounded and unavailable", async () => {
    vi.useFakeTimers();
    const { dependencies, workers } = createDependencies();
    const coordinator = new LocalMemoryCoordinator(dependencies);

    const result = coordinator.initialize();
    await flush();
    await vi.advanceTimersByTimeAsync(10_000);

    await expect(result).resolves.toMatchObject({
      ok: false,
      error: { code: "STORE_UNAVAILABLE" },
    });
    expect(workers[0]?.killed).toBe(true);
  });

  it("retires a worker that rejects open before allowing a retry", async () => {
    const { dependencies, workers } = createDependencies();
    const coordinator = new LocalMemoryCoordinator(dependencies);

    const firstOpen = coordinator.initialize();
    await flush();
    workers[0]?.respond({
      ok: false,
      error: { code: "STORE_UNAVAILABLE", message: "Local memory is unavailable." },
    });
    await expect(firstOpen).resolves.toMatchObject({ ok: false });
    expect(workers[0]?.killed).toBe(true);

    const retry = coordinator.status();
    await flush();
    expect(workers).toHaveLength(2);
    workers[1]?.respond({ ok: true, snapshot: snapshot() });
    await expect(retry).resolves.toEqual({ available: true, snapshot: snapshot() });
  });

  it("normalizes a worker transport failure and fails waiting work", async () => {
    const { dependencies, workers } = createDependencies();
    const coordinator = new LocalMemoryCoordinator(dependencies);
    await initialize(coordinator, workers);
    const worker = workers[0];
    if (!worker) throw new Error("Worker was not started.");
    worker.throwOnPost = true;

    await expect(coordinator.read()).resolves.toMatchObject({
      ok: false,
      error: { code: "STORE_UNAVAILABLE" },
    });
    expect(worker.killed).toBe(true);
  });

  it("erases and recreates only after key-unavailable initialization", async () => {
    let loadAttempt = 0;
    const { dependencies, eraseStore, workers } = createDependencies({
      loadKey: async () => {
        loadAttempt += 1;
        if (loadAttempt === 1) throw new KeyUnavailableError("unavailable");
        return {
          databasePath: "C:\\synthetic-user-data\\local-memory\\memory.db",
          storeId: "00000000-0000-4000-8000-000000000020",
          keyHex: "22".repeat(32),
        };
      },
    });
    const coordinator = new LocalMemoryCoordinator(dependencies);
    await expect(coordinator.initialize()).resolves.toMatchObject({
      ok: false,
      error: { code: "KEY_UNAVAILABLE" },
    });

    const reset = coordinator.resetUnavailable({
      confirmation: "ERASE_UNAVAILABLE_LOCAL_MEMORY",
    });
    await flush();
    expect(eraseStore).toHaveBeenCalledWith("C:\\synthetic-user-data", expect.any(AbortSignal));
    workers[0]?.respond({ ok: true, snapshot: snapshot() });
    await expect(reset).resolves.toEqual({ ok: true, snapshot: snapshot() });

    await expect(
      coordinator.resetUnavailable({ confirmation: "ERASE_UNAVAILABLE_LOCAL_MEMORY" }),
    ).resolves.toMatchObject({ ok: false, error: { code: "INVALID_REQUEST" } });
    expect(eraseStore).toHaveBeenCalledTimes(1);
  });

  it("prevents a pre-reset key load from starting a late worker", async () => {
    let resolveFirstKey:
      | ((value: Awaited<ReturnType<LocalMemoryCoordinatorDependencies["loadKey"]>>) => void)
      | undefined;
    let loadAttempt = 0;
    const key = {
      databasePath: "C:\\synthetic-user-data\\local-memory\\memory.db",
      storeId: "00000000-0000-4000-8000-000000000030",
      keyHex: "33".repeat(32),
    };
    const { dependencies, workers } = createDependencies({
      loadKey: async () => {
        loadAttempt += 1;
        if (loadAttempt === 1) {
          return await new Promise((resolve) => {
            resolveFirstKey = resolve;
          });
        }
        return key;
      },
    });
    const coordinator = new LocalMemoryCoordinator(dependencies);
    const staleInitialization = coordinator.initialize();
    await flush();

    const reset = coordinator.resetUnavailable({
      confirmation: "ERASE_UNAVAILABLE_LOCAL_MEMORY",
    });
    await flush();
    expect(workers).toHaveLength(1);
    workers[0]?.respond({ ok: true, snapshot: snapshot() });
    await expect(reset).resolves.toEqual({ ok: true, snapshot: snapshot() });

    resolveFirstKey?.(key);
    await expect(staleInitialization).resolves.toMatchObject({ ok: false });
    expect(workers).toHaveLength(1);

    const current = coordinator.read();
    workers[0]?.respond({ ok: true, snapshot: snapshot() });
    await expect(current).resolves.toEqual({ ok: true, snapshot: snapshot() });
  });

  it("bounds key loading and aborts the stale lifecycle", async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    const { dependencies, workers } = createDependencies({
      loadKey: async (_path, receivedSignal) => {
        signal = receivedSignal;
        return await new Promise(() => undefined);
      },
    });
    const coordinator = new LocalMemoryCoordinator(dependencies);
    const result = coordinator.initialize();
    await vi.advanceTimersByTimeAsync(10_000);
    await expect(result).resolves.toMatchObject({ ok: false, error: { code: "KEY_UNAVAILABLE" } });
    expect(signal?.aborted).toBe(true);
    expect(workers).toHaveLength(0);
  });

  it("bounds erase and coalesces parallel reset requests", async () => {
    vi.useFakeTimers();
    let eraseSignal: AbortSignal | undefined;
    const eraseStore = vi.fn(async (_path: string, signal?: AbortSignal) => {
      eraseSignal = signal;
      return await new Promise<void>(() => undefined);
    });
    const { dependencies } = createDependencies({
      loadKey: async () => {
        throw new KeyUnavailableError("unavailable");
      },
      eraseStore,
    });
    const coordinator = new LocalMemoryCoordinator(dependencies);
    await expect(coordinator.initialize()).resolves.toMatchObject({ ok: false });
    const first = coordinator.resetUnavailable({ confirmation: "ERASE_UNAVAILABLE_LOCAL_MEMORY" });
    const second = coordinator.resetUnavailable({ confirmation: "ERASE_UNAVAILABLE_LOCAL_MEMORY" });
    await flush();
    await vi.advanceTimersByTimeAsync(10_000);
    await expect(first).resolves.toMatchObject({ ok: false, error: { code: "KEY_UNAVAILABLE" } });
    await expect(second).resolves.toMatchObject({ ok: false, error: { code: "KEY_UNAVAILABLE" } });
    expect(eraseStore).toHaveBeenCalledOnce();
    expect(eraseSignal?.aborted).toBe(true);
  });
});
