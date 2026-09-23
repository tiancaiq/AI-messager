import { access, writeFile } from "node:fs/promises";

import { describe, expect, it, vi } from "vitest";

import {
  createDevelopmentMemoryDebugSnapshot,
  removeDevelopmentMemoryDebugSnapshot,
} from "./debug-snapshot.js";

describe("development encrypted memory snapshot", () => {
  it("uses a separate passphrase and a removable OS-temporary copy", async () => {
    const coordinator = {
      initialize: vi.fn(async () => ({
        ok: true as const,
        snapshot: {
          generation: "00000000-0000-4000-8000-000000000001",
          revision: 0,
          directoryRevision: 0,
          memoryRevision: 0,
          messageLength: null,
          updatedAt: null,
        },
      })),
      exportDebugSnapshot: vi.fn(async ({ snapshotPath }: { snapshotPath: string }) => {
        await writeFile(snapshotPath, "encrypted synthetic snapshot");
        return {
          ok: true as const,
          snapshot: { schemaVersion: 6 as const, databasePath: snapshotPath },
        };
      }),
    };

    const snapshot = await createDevelopmentMemoryDebugSnapshot(coordinator as never);
    expect(snapshot.passphrase).toMatch(/^[A-Za-z0-9_-]{43}$/u);
    expect(snapshot.databasePath).toContain("ai-message-coach-memory-");
    await expect(access(snapshot.databasePath)).resolves.toBeUndefined();

    await removeDevelopmentMemoryDebugSnapshot(snapshot);
    await expect(access(snapshot.databasePath)).rejects.toMatchObject({ code: "ENOENT" });
  });
});
