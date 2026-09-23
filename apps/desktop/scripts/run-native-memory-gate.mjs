import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readdir, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { createRequire } from "node:module";

const nativeGateRunId = randomUUID();
const nativeGateScript = resolve(import.meta.dirname, "native-memory-gate.cjs");
const electronExecutable = createRequire(import.meta.url)("electron");
const nativeGateChild = spawn(electronExecutable, [nativeGateScript], {
  stdio: "inherit",
  windowsHide: true,
  env: { ...process.env, AI_MESSAGE_COACH_NATIVE_GATE_RUN_ID: nativeGateRunId },
});

const exitCode = await new Promise((resolveExit, reject) => {
  nativeGateChild.once("error", reject);
  nativeGateChild.once("exit", (code) => resolveExit(code ?? 1));
});

// Electron releases Windows profile handles only after it exits. The parent
// removes only this run's random synthetic test directories, never live app data.
const temporaryRoot = await realpath(tmpdir());
const expectedNames = [
  `ai-message-coach-native-gate-${nativeGateRunId}-`,
  `ai-message-coach-native-profile-${nativeGateRunId}-`,
];
let cleanupFailed = false;
for (const entry of await readdir(temporaryRoot, { withFileTypes: true })) {
  if (!entry.isDirectory() || !expectedNames.some((prefix) => entry.name.startsWith(prefix)))
    continue;
  const target = await realpath(join(temporaryRoot, entry.name));
  if (
    dirname(target).toLowerCase() !== temporaryRoot.toLowerCase() ||
    basename(target) !== entry.name
  ) {
    cleanupFailed = true;
    continue;
  }
  try {
    await rm(target, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  } catch {
    cleanupFailed = true;
  }
}
if (cleanupFailed) process.stderr.write("Synthetic native-memory fixture cleanup failed.\n");
process.exitCode = exitCode === 0 && !cleanupFailed ? 0 : 1;
