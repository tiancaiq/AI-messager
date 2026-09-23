import { randomBytes } from "node:crypto";
import { chmod, mkdtemp, rm } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";

import type { LocalMemoryCoordinator } from "./coordinator.js";

const SNAPSHOT_DIRECTORY_PREFIX = "ai-message-coach-memory-";
const SNAPSHOT_FILENAME = "memory-debug.db";

export interface DevelopmentMemoryDebugSnapshot {
  directoryPath: string;
  databasePath: string;
  passphrase: string;
  schemaVersion: 6;
}

function isOwnedTemporaryDirectory(directoryPath: string): boolean {
  const resolvedDirectory = resolve(directoryPath);
  return (
    dirname(resolvedDirectory) === resolve(tmpdir()) &&
    basename(resolvedDirectory).startsWith(SNAPSHOT_DIRECTORY_PREFIX)
  );
}

export async function removeDevelopmentMemoryDebugSnapshot(
  snapshot: DevelopmentMemoryDebugSnapshot,
): Promise<void> {
  if (!isOwnedTemporaryDirectory(snapshot.directoryPath)) {
    throw new Error("Refusing to remove an unrecognized debug snapshot directory.");
  }
  await chmod(snapshot.databasePath, 0o600).catch(() => undefined);
  await rm(snapshot.directoryPath, { recursive: true, force: true });
}

export async function createDevelopmentMemoryDebugSnapshot(
  coordinator: LocalMemoryCoordinator,
): Promise<DevelopmentMemoryDebugSnapshot> {
  const directoryPath = await mkdtemp(join(tmpdir(), SNAPSHOT_DIRECTORY_PREFIX));
  const databasePath = join(directoryPath, SNAPSHOT_FILENAME);
  const passphrase = randomBytes(32).toString("base64url");
  try {
    const ready = await coordinator.initialize();
    if (!ready.ok) throw new Error(ready.error.message);
    const exported = await coordinator.exportDebugSnapshot({
      snapshotPath: databasePath,
      passphrase,
    });
    if (!exported.ok) throw new Error(exported.error.message);
    await chmod(databasePath, 0o400);
    return {
      directoryPath,
      databasePath: exported.snapshot.databasePath,
      passphrase,
      schemaVersion: exported.snapshot.schemaVersion,
    };
  } catch (error) {
    await removeDevelopmentMemoryDebugSnapshot({
      directoryPath,
      databasePath,
      passphrase,
      schemaVersion: 6,
    });
    throw error;
  }
}
