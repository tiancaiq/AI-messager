import { randomUUID } from "node:crypto";
import { join } from "node:path";

import {
  ContactDirectoryResultSchema,
  LocalMemoryDebugSnapshotResultSchema,
  LocalMemoryInspectorResultSchema,
  LocalMemoryResultSchema,
  MemoryAssertionResultSchema,
  StorageWorkerResponseSchema,
  type ClearLocalMemoryRequest,
  type ContactDirectoryRequest,
  type ContactDirectoryResult,
  type DeleteMessageLengthRequest,
  type LocalMemoryInspectorResult,
  type LocalMemoryInspectorRequest,
  type LocalMemoryResult,
  type MemoryAssertionRequest,
  type MemoryAssertionResult,
  type LocalMemoryDebugSnapshotExport,
  type LocalMemoryDebugSnapshotResult,
  type LocalMemoryStatus,
  type ResetUnavailableLocalMemoryRequest,
  type SaveMessageLengthRequest,
  type StorageWorkerRequest,
} from "@ai-message-coach/contracts";
import { app, safeStorage, utilityProcess } from "electron";

import {
  KeyUnavailableError,
  eraseUnavailableLocalMemory,
  loadOrCreateLocalMemoryKey,
  type LocalMemoryKey,
} from "./key-custody.js";

const MAX_WAITING_COMMANDS = 8;
const MAX_REQUEST_BYTES = 4 * 1024;
const OPERATION_TIMEOUT_MS = 2_000;
const OPEN_TIMEOUT_MS = 10_000;
const LIFECYCLE_TIMEOUT_MS = 10_000;
const DEBUG_SNAPSHOT_TIMEOUT_MS = 10_000;
const RETIREMENT_WAIT_MS = 2_000;

type WorkerResult =
  | LocalMemoryResult
  | LocalMemoryInspectorResult
  | LocalMemoryDebugSnapshotResult
  | ContactDirectoryResult
  | MemoryAssertionResult;

interface UtilityProcessPort {
  kill(): boolean;
  on(event: "message", listener: (message: unknown) => void): unknown;
  once(event: "exit", listener: () => void): unknown;
  postMessage(message: unknown): void;
}

export interface LocalMemoryCoordinatorDependencies {
  eraseStore(userDataPath: string, signal?: AbortSignal): Promise<void>;
  forkWorker(utilityPath: string, environment: Record<string, string>): UtilityProcessPort;
  getUserDataPath(): string;
  loadKey(userDataPath: string, signal?: AbortSignal): Promise<LocalMemoryKey>;
  now(): number;
}

const defaultDependencies: LocalMemoryCoordinatorDependencies = {
  eraseStore: eraseUnavailableLocalMemory,
  forkWorker: (utilityPath, environment) =>
    utilityProcess.fork(utilityPath, [], {
      env: environment,
      serviceName: "AI Message Coach protected local memory",
      stdio: "ignore",
    }),
  getUserDataPath: () => app.getPath("userData"),
  loadKey: (userDataPath, signal) => loadOrCreateLocalMemoryKey(userDataPath, safeStorage, signal),
  now: () => Date.now(),
};

const unavailable = (code: "KEY_UNAVAILABLE" | "STORE_UNAVAILABLE" = "STORE_UNAVAILABLE") =>
  ({
    ok: false,
    error: {
      code,
      message:
        code === "KEY_UNAVAILABLE"
          ? "OS-protected local memory is unavailable."
          : "Local memory is unavailable. Coaching still works without it.",
    },
  }) satisfies LocalMemoryResult;

const invalid = (): LocalMemoryResult => ({
  ok: false,
  error: { code: "INVALID_REQUEST", message: "The local memory request was not accepted." },
});

interface QueuedCommand {
  deadlineAt: number;
  request: StorageWorkerRequest;
  resolve: (result: WorkerResult) => void;
}

export class LocalMemoryCoordinator {
  private child: UtilityProcessPort | undefined;
  private childExit: Promise<void> | undefined;
  private initializing: Promise<LocalMemoryResult> | undefined;
  private retiring: Promise<void> | undefined;
  private lifecycle = 0;
  private ready = false;
  private keyUnavailable = false;
  private active: QueuedCommand | undefined;
  private queue: QueuedCommand[] = [];
  private timer: NodeJS.Timeout | undefined;
  private lifecycleController: AbortController | undefined;
  private resetting: Promise<LocalMemoryResult> | undefined;

  constructor(private readonly dependencies = defaultDependencies) {}

  initialize(): Promise<LocalMemoryResult> {
    if (!this.initializing) {
      const attempt = this.start(this.lifecycle);
      this.initializing = attempt;
      void attempt.then((result) => {
        if (!result.ok && this.initializing === attempt) this.initializing = undefined;
      });
    }
    return this.initializing;
  }

  async status(): Promise<LocalMemoryStatus> {
    const result = this.ready ? await this.read() : await this.initialize();
    return result.ok
      ? { available: true, snapshot: result.snapshot }
      : { available: false, error: result.error };
  }

  read(): Promise<LocalMemoryResult> {
    return this.dispatchLocal({ operation: "READ", requestId: randomUUID() });
  }

  save(request: SaveMessageLengthRequest): Promise<LocalMemoryResult> {
    return this.dispatchLocal({ operation: "SAVE", requestId: randomUUID(), ...request });
  }

  delete(request: DeleteMessageLengthRequest): Promise<LocalMemoryResult> {
    return this.dispatchLocal({ operation: "DELETE", requestId: randomUUID(), ...request });
  }

  clear(request: ClearLocalMemoryRequest): Promise<LocalMemoryResult> {
    return this.dispatchLocal({ operation: "CLEAR", requestId: randomUUID(), ...request });
  }

  async resetUnavailable(request: ResetUnavailableLocalMemoryRequest): Promise<LocalMemoryResult> {
    void request;
    if (this.ready) return invalid();
    if (this.resetting) return await this.resetting;
    const reset = this.performReset();
    this.resetting = reset;
    return await reset.finally(() => {
      if (this.resetting === reset) this.resetting = undefined;
    });
  }

  async inspect(request: LocalMemoryInspectorRequest): Promise<LocalMemoryInspectorResult> {
    const result = await this.dispatch({
      operation: "INSPECT",
      requestId: randomUUID(),
      ...request,
    });
    const parsed = LocalMemoryInspectorResultSchema.safeParse(result);
    return parsed.success ? parsed.data : unavailable();
  }

  async directory(request: ContactDirectoryRequest): Promise<ContactDirectoryResult> {
    const result = await this.dispatch({
      operation: "DIRECTORY",
      requestId: randomUUID(),
      request,
    });
    const parsed = ContactDirectoryResultSchema.safeParse(result);
    return parsed.success ? parsed.data : unavailable();
  }

  async memory(request: MemoryAssertionRequest): Promise<MemoryAssertionResult> {
    const result = await this.dispatch({
      operation: "MEMORY",
      requestId: randomUUID(),
      request,
    });
    const parsed = MemoryAssertionResultSchema.safeParse(result);
    return parsed.success ? parsed.data : unavailable();
  }

  async exportDebugSnapshot(
    request: LocalMemoryDebugSnapshotExport,
  ): Promise<LocalMemoryDebugSnapshotResult> {
    const result = await this.dispatch(
      {
        operation: "EXPORT_DEBUG_SNAPSHOT",
        requestId: randomUUID(),
        ...request,
      },
      DEBUG_SNAPSHOT_TIMEOUT_MS,
    );
    const parsed = LocalMemoryDebugSnapshotResultSchema.safeParse(result);
    return parsed.success ? parsed.data : unavailable();
  }

  close(): void {
    this.lifecycle += 1;
    this.lifecycleController?.abort();
    this.initializing = undefined;
    this.failAll(unavailable());
    void this.retireCurrentWorker();
  }

  private async start(lifecycle: number): Promise<LocalMemoryResult> {
    if (!(await this.waitForRetirement())) return unavailable();
    try {
      const userDataPath = this.dependencies.getUserDataPath();
      const controller = new AbortController();
      this.lifecycleController = controller;
      const localKey = await this.withLifecycleDeadline(
        this.dependencies.loadKey(userDataPath, controller.signal),
        controller,
      );
      if (this.lifecycleController === controller) this.lifecycleController = undefined;
      if (lifecycle !== this.lifecycle) return unavailable();
      const utilityPath = join(__dirname, "local-memory", "storage-utility.cjs");
      const environment = Object.fromEntries(
        ["SystemRoot", "WINDIR", "TEMP", "TMP"].flatMap((name) =>
          process.env[name] === undefined ? [] : [[name, process.env[name]]],
        ),
      );
      const child = this.dependencies.forkWorker(utilityPath, environment);
      this.child = child;
      let resolveChildExit: () => void = () => undefined;
      this.childExit = new Promise((resolve) => {
        resolveChildExit = resolve;
      });
      child.on("message", (message) => {
        if (this.child === child) this.receive(message);
      });
      child.once("exit", () => {
        resolveChildExit();
        if (this.child !== child) return;
        this.ready = false;
        this.initializing = undefined;
        this.child = undefined;
        this.childExit = undefined;
        this.failAll(unavailable());
      });
      const result = await this.dispatchLocal(
        {
          operation: "OPEN",
          requestId: randomUUID(),
          databasePath: localKey.databasePath,
          storeId: localKey.storeId,
          keyHex: localKey.keyHex,
        },
        OPEN_TIMEOUT_MS,
        true,
      );
      if (lifecycle !== this.lifecycle) {
        await this.retireCurrentWorker();
        return unavailable();
      }
      this.ready = result.ok;
      if (result.ok) {
        this.keyUnavailable = false;
      } else {
        await this.retireCurrentWorker();
      }
      return result;
    } catch (error) {
      this.lifecycleController = undefined;
      await this.retireCurrentWorker();
      this.keyUnavailable = error instanceof KeyUnavailableError;
      return unavailable(this.keyUnavailable ? "KEY_UNAVAILABLE" : "STORE_UNAVAILABLE");
    }
  }

  private async performReset(): Promise<LocalMemoryResult> {
    this.lifecycle += 1;
    this.lifecycleController?.abort();
    this.initializing = undefined;
    this.failAll(unavailable());
    const retired = await this.retireCurrentWorker();
    if (!retired) return unavailable();
    const controller = new AbortController();
    this.lifecycleController = controller;
    try {
      await this.withLifecycleDeadline(
        this.dependencies.eraseStore(this.dependencies.getUserDataPath(), controller.signal),
        controller,
      );
      if (this.lifecycleController === controller) this.lifecycleController = undefined;
      this.keyUnavailable = false;
      return await this.initialize();
    } catch {
      if (this.lifecycleController === controller) this.lifecycleController = undefined;
      this.keyUnavailable = true;
      return unavailable("KEY_UNAVAILABLE");
    }
  }

  private async withLifecycleDeadline<T>(
    promise: Promise<T>,
    controller: AbortController,
  ): Promise<T> {
    return await new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        controller.abort();
        reject(new KeyUnavailableError("Local memory lifecycle timed out."));
      }, LIFECYCLE_TIMEOUT_MS);
      void promise.then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (error: unknown) => {
          clearTimeout(timer);
          reject(error);
        },
      );
    });
  }

  private dispatch(
    request: StorageWorkerRequest,
    timeoutMs = OPERATION_TIMEOUT_MS,
    allowBeforeReady = false,
  ): Promise<WorkerResult> {
    if ((!this.ready && !allowBeforeReady) || !this.child) {
      return Promise.resolve(unavailable(this.keyUnavailable ? "KEY_UNAVAILABLE" : undefined));
    }
    if (Buffer.byteLength(JSON.stringify(request), "utf8") > MAX_REQUEST_BYTES) {
      return Promise.resolve(invalid());
    }
    if (this.active && this.queue.length >= MAX_WAITING_COMMANDS) {
      return Promise.resolve({
        ok: false,
        error: { code: "BUSY", message: "Local memory is busy. Try again shortly." },
      });
    }
    return new Promise((resolve) => {
      this.queue.push({ request, resolve, deadlineAt: this.dependencies.now() + timeoutMs });
      this.pump();
    });
  }

  private async dispatchLocal(
    request: StorageWorkerRequest,
    timeoutMs = OPERATION_TIMEOUT_MS,
    allowBeforeReady = false,
  ): Promise<LocalMemoryResult> {
    const result = await this.dispatch(request, timeoutMs, allowBeforeReady);
    const parsed = LocalMemoryResultSchema.safeParse(result);
    return parsed.success ? parsed.data : unavailable();
  }

  private pump(): void {
    if (this.active || !this.child) return;
    const next = this.queue.shift();
    if (!next) return;
    const remaining = next.deadlineAt - this.dependencies.now();
    if (remaining <= 0) {
      next.resolve(unavailable());
      this.pump();
      return;
    }
    this.active = next;
    this.timer = setTimeout(() => this.handleTimeout(next), remaining);
    try {
      this.child.postMessage(next.request);
    } catch {
      if (this.timer) clearTimeout(this.timer);
      this.timer = undefined;
      this.active = undefined;
      next.resolve(unavailable());
      this.failAll(unavailable());
      void this.retireCurrentWorker();
    }
  }

  private handleTimeout(command: QueuedCommand): void {
    if (this.active !== command) return;
    this.active = undefined;
    this.timer = undefined;
    this.ready = false;
    this.lifecycle += 1;
    this.initializing = undefined;
    const mightHaveWritten =
      command.request.operation === "SAVE" ||
      command.request.operation === "DELETE" ||
      command.request.operation === "CLEAR" ||
      (command.request.operation === "DIRECTORY" && command.request.request.operation !== "LIST") ||
      (command.request.operation === "MEMORY" && command.request.request.operation !== "LIST");
    command.resolve(
      mightHaveWritten
        ? {
            ok: false,
            error: {
              code: "UNKNOWN_WRITE_OUTCOME",
              message:
                "Local memory did not confirm the operation. Refresh before changing it again.",
            },
          }
        : unavailable(),
    );
    this.failAll(unavailable());
    void this.retireCurrentWorker();
  }

  private receive(message: unknown): void {
    const parsed = StorageWorkerResponseSchema.safeParse(message);
    if (!parsed.success || parsed.data.requestId !== this.active?.request.requestId) return;
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    const active = this.active;
    this.active = undefined;
    active.resolve(parsed.data.result);
    this.pump();
  }

  private async retireCurrentWorker(): Promise<boolean> {
    const child = this.child;
    const childExit = this.childExit;
    if (!child || !childExit) return await this.waitForRetirement();
    this.child = undefined;
    this.childExit = undefined;
    this.ready = false;
    const retirement = childExit.finally(() => {
      if (this.retiring === retirement) this.retiring = undefined;
    });
    this.retiring = retirement;
    child.kill();
    return await this.waitForRetirement();
  }

  private async waitForRetirement(): Promise<boolean> {
    if (!this.retiring) return true;
    const retirement = this.retiring;
    return await new Promise((resolve) => {
      const timer = setTimeout(() => resolve(false), RETIREMENT_WAIT_MS);
      void retirement.then(() => {
        clearTimeout(timer);
        resolve(true);
      });
    });
  }

  private failAll(result: WorkerResult): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    this.active?.resolve(result);
    this.active = undefined;
    for (const queued of this.queue.splice(0)) queued.resolve(result);
  }
}
