import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const packageDirectory = resolve(import.meta.dirname, "..");
const localEnvironmentPath = resolve(packageDirectory, "../..", ".env.local");
const electronExecutable = process.platform === "win32" ? "electron.cmd" : "electron";

if (existsSync(localEnvironmentPath)) {
  process.loadEnvFile(localEnvironmentPath);
}

const electron = spawn(electronExecutable, ["."], {
  cwd: packageDirectory,
  env: process.env,
  stdio: "inherit",
});

electron.once("exit", (code) => {
  process.exitCode = code ?? 0;
});
