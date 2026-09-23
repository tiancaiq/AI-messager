import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { describe, expect, it, vi } from "vitest";

import {
  createLetosLaunchPlan,
  openDevelopmentMemorySnapshotInLetos,
  serializeLetosConnectionOptions,
} from "./letos-debug-gui.js";
import {
  createDevelopmentMemoryDebugSnapshot,
  removeDevelopmentMemoryDebugSnapshot,
} from "./debug-snapshot.js";

describe("Letos encrypted memory GUI", () => {
  it("serializes Letos string connection options without shell interpolation", () => {
    const bytes = serializeLetosConnectionOptions({ cipher: "sqlcipher", plugin: "DbSqliteMc" });
    expect(bytes.readUInt32BE(0)).toBe(28);
    expect(bytes.includes(Buffer.from("sqlcipher", "utf16le").swap16())).toBe(true);
  });

  it("registers only the encrypted snapshot in an isolated query-only profile", async () => {
    const coordinator = {
      initialize: vi.fn(async () => ({ ok: true as const, snapshot: {} })),
      exportDebugSnapshot: vi.fn(async ({ snapshotPath }: { snapshotPath: string }) => {
        await writeFile(snapshotPath, "encrypted synthetic snapshot");
        return {
          ok: true as const,
          snapshot: { schemaVersion: 6 as const, databasePath: snapshotPath },
        };
      }),
    };
    const snapshot = await createDevelopmentMemoryDebugSnapshot(coordinator as never);
    const fakeInstall = join(snapshot.directoryPath, "fake-letos");
    const executablePath = join(fakeInstall, "Letos.exe");
    await mkdir(fakeInstall, { recursive: true });
    await writeFile(executablePath, "fake executable");
    await writeFile(join(snapshot.directoryPath, "live-key-never-share"), "sentinel");
    const pluginDirectory = join(fakeInstall, "plugins");
    await mkdir(pluginDirectory, { recursive: true });
    await writeFile(
      join(pluginDirectory, "libDbSqliteMc.dll"),
      "SQLite3MultipleCiphers DbSqliteMc",
    );

    const plan = await createLetosLaunchPlan(snapshot, executablePath);
    const config = new DatabaseSync(plan.configDatabasePath, { readOnly: true });
    const entry = config.prepare("SELECT path, options FROM dblist").get() as {
      path: string;
      options: Uint8Array;
    };
    config.close();

    expect(entry.path).toBe(snapshot.databasePath);
    expect(entry.path).not.toContain("live-key-never-share");
    expect(
      Buffer.from(entry.options).includes(Buffer.from(snapshot.passphrase, "utf16le").swap16()),
    ).toBe(true);
    expect(
      Buffer.from(entry.options).includes(
        Buffer.from("PRAGMA query_only = ON", "utf16le").swap16(),
      ),
    ).toBe(true);
    expect(plan.arguments).toEqual(["--safe-mode"]);
    expect(plan.arguments.join(" ")).not.toContain(snapshot.databasePath);
    expect(plan.arguments.join(" ")).not.toContain(snapshot.passphrase);

    await removeDevelopmentMemoryDebugSnapshot(snapshot);
  });

  it("removes the temporary Letos profile after the GUI exits", async () => {
    const coordinator = {
      initialize: vi.fn(async () => ({ ok: true as const, snapshot: {} })),
      exportDebugSnapshot: vi.fn(async ({ snapshotPath }: { snapshotPath: string }) => {
        await writeFile(snapshotPath, "encrypted synthetic snapshot");
        return {
          ok: true as const,
          snapshot: { schemaVersion: 6 as const, databasePath: snapshotPath },
        };
      }),
    };
    const snapshot = await createDevelopmentMemoryDebugSnapshot(coordinator as never);
    const fakeInstall = join(snapshot.directoryPath, "fake-letos");
    const executablePath = join(fakeInstall, "Letos.exe");
    const pluginPath = join(fakeInstall, "plugins", "libDbSqliteMc.dll");
    await mkdir(join(fakeInstall, "plugins"), { recursive: true });
    await writeFile(executablePath, "fake executable");
    await writeFile(pluginPath, "SQLite3MultipleCiphers DbSqliteMc");

    let profileDirectory = "";
    await openDevelopmentMemorySnapshotInLetos(snapshot, {
      findExecutable: async () => executablePath,
      launch: async (plan) => {
        profileDirectory = plan.profileDirectory;
        await expect(access(plan.configDatabasePath)).resolves.toBeUndefined();
        expect(plan.arguments).toEqual(["--safe-mode"]);
        expect(await readFile(snapshot.databasePath, "utf8")).toBe("encrypted synthetic snapshot");
        return 0;
      },
    });

    await expect(access(profileDirectory)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(snapshot.databasePath)).resolves.toBeUndefined();
    await removeDevelopmentMemoryDebugSnapshot(snapshot);
    await expect(access(snapshot.databasePath)).rejects.toMatchObject({ code: "ENOENT" });
  });
});
