import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const electronExecutable = require("electron");
const packageDirectory = resolve(import.meta.dirname, "..");

const electron = spawn(electronExecutable, ["."], {
  cwd: packageDirectory,
  env: { ...process.env, AI_MESSAGE_COACH_MEMORY_DEBUG_SNAPSHOT: "1" },
  stdio: "inherit",
});

electron.once("exit", (code) => {
  process.exitCode = code ?? 0;
});
