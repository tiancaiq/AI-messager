import {
  LOCAL_MEMORY_CLEAR_CHANNEL,
  LOCAL_MEMORY_DELETE_CHANNEL,
  LOCAL_MEMORY_INSPECT_CHANNEL,
  LOCAL_MEMORY_READ_CHANNEL,
  LOCAL_MEMORY_RESET_UNAVAILABLE_CHANNEL,
  LOCAL_MEMORY_SAVE_CHANNEL,
  LOCAL_MEMORY_STATUS_CHANNEL,
  ClearLocalMemoryRequestSchema,
  DeleteMessageLengthRequestSchema,
  LocalMemoryInspectorRequestSchema,
  ResetUnavailableLocalMemoryRequestSchema,
  SaveMessageLengthRequestSchema,
  type LocalMemoryResult,
  type LocalMemoryInspectorResult,
  type LocalMemoryStatus,
} from "@ai-message-coach/contracts";
import { ipcMain } from "electron";

import type { LocalMemoryCoordinator } from "./coordinator.js";

const invalidResult: LocalMemoryResult = {
  ok: false,
  error: { code: "INVALID_REQUEST", message: "The local memory request was not accepted." },
};
const invalidStatus: LocalMemoryStatus = { available: false, error: invalidResult.error };
const invalidInspectorResult: LocalMemoryInspectorResult = invalidResult;

export function registerLocalMemoryHandlers(
  store: LocalMemoryCoordinator,
  isAuthorized: (event: Electron.IpcMainInvokeEvent) => boolean,
): void {
  ipcMain.handle(LOCAL_MEMORY_STATUS_CHANNEL, async (event, ...arguments_: unknown[]) =>
    arguments_.length === 0 && isAuthorized(event) ? await store.status() : invalidStatus,
  );
  ipcMain.handle(LOCAL_MEMORY_READ_CHANNEL, async (event, ...arguments_: unknown[]) =>
    arguments_.length === 0 && isAuthorized(event) ? await store.read() : invalidResult,
  );
  ipcMain.handle(LOCAL_MEMORY_SAVE_CHANNEL, async (event, ...arguments_: unknown[]) => {
    const parsed = SaveMessageLengthRequestSchema.safeParse(arguments_[0]);
    return arguments_.length === 1 && isAuthorized(event) && parsed.success
      ? await store.save(parsed.data)
      : invalidResult;
  });
  ipcMain.handle(LOCAL_MEMORY_DELETE_CHANNEL, async (event, ...arguments_: unknown[]) => {
    const parsed = DeleteMessageLengthRequestSchema.safeParse(arguments_[0]);
    return arguments_.length === 1 && isAuthorized(event) && parsed.success
      ? await store.delete(parsed.data)
      : invalidResult;
  });
  ipcMain.handle(LOCAL_MEMORY_CLEAR_CHANNEL, async (event, ...arguments_: unknown[]) => {
    const parsed = ClearLocalMemoryRequestSchema.safeParse(arguments_[0]);
    return arguments_.length === 1 && isAuthorized(event) && parsed.success
      ? await store.clear(parsed.data)
      : invalidResult;
  });
  ipcMain.handle(
    LOCAL_MEMORY_RESET_UNAVAILABLE_CHANNEL,
    async (event, ...arguments_: unknown[]) => {
      const parsed = ResetUnavailableLocalMemoryRequestSchema.safeParse(arguments_[0]);
      return arguments_.length === 1 && isAuthorized(event) && parsed.success
        ? await store.resetUnavailable(parsed.data)
        : invalidResult;
    },
  );
}

export function registerLocalMemoryInspectorHandler(
  store: LocalMemoryCoordinator,
  isAuthorized: (event: Electron.IpcMainInvokeEvent) => boolean,
): void {
  ipcMain.handle(LOCAL_MEMORY_INSPECT_CHANNEL, async (event, ...arguments_: unknown[]) => {
    const parsed = LocalMemoryInspectorRequestSchema.safeParse(arguments_[0]);
    return arguments_.length === 1 && isAuthorized(event) && parsed.success
      ? await store.inspect(parsed.data)
      : invalidInspectorResult;
  });
}
