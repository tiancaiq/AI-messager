import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);

// Windows cannot spawn a .cmd shim without a shell. Use the current pnpm JS entry
// through Node instead, preserving argument boundaries (including paths with spaces).
const packageManagerEntry = process.env.npm_execpath;
const packageManager = process.platform === "win32" ? process.execPath : "pnpm";
const rendererUrl = "http://127.0.0.1:5173";
const children = new Set();
const packageDirectory = resolve(import.meta.dirname, "..");
const localEnvironmentPath = resolve(packageDirectory, "../..", ".env.local");

if (existsSync(localEnvironmentPath)) {
  process.loadEnvFile(localEnvironmentPath);
}

function spawnProcess(args, options = {}) {
  if (process.platform === "win32" && (!packageManagerEntry || !existsSync(packageManagerEntry))) {
    throw new Error("Start desktop development through pnpm dev:desktop.");
  }
  return spawnChild(
    packageManager,
    process.platform === "win32" ? [packageManagerEntry, ...args] : args,
    options,
  );
}

function spawnChild(command, args, options = {}) {
  const child = spawn(command, args, { cwd: packageDirectory, stdio: "inherit", ...options });
  children.add(child);
  child.once("exit", () => children.delete(child));
  return child;
}

async function runOnce(args) {
  const child = spawnProcess(args);
  const exitCode = await new Promise((resolve) => child.once("exit", resolve));

  if (exitCode !== 0) {
    throw new Error(`Command failed: pnpm ${args.join(" ")}`);
  }
}

async function waitForRenderer(renderer) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (renderer.exitCode !== null)
      throw new Error("The development renderer exited before startup.");
    try {
      const response = await fetch(rendererUrl);

      if (response.ok) {
        return;
      }
    } catch {
      // The renderer is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`Renderer did not start at ${rendererUrl}.`);
}

function stopChildren() {
  for (const child of children) {
    child.kill();
  }
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, stopChildren);
}

try {
  await runOnce(["run", "build:main"]);
  await runOnce(["run", "build:preload"]);

  const alreadyRunning = await fetch(rendererUrl).then(
    () => true,
    () => false,
  );
  if (alreadyRunning)
    throw new Error("Port 5173 is already in use. Close the other development server first.");
  const viteEntry = resolve(dirname(require.resolve("vite/package.json")), "bin/vite.js");
  const renderer = spawnChild(process.execPath, [
    viteEntry,
    "--host",
    "127.0.0.1",
    "--port",
    "5173",
    "--strictPort",
  ]);
  await waitForRenderer(renderer);

  const electron = spawnChild(require("electron"), ["."], {
    env: {
      ...process.env,
      VITE_DEV_SERVER_URL: rendererUrl,
    },
  });

  const exitCode = await new Promise((resolve) => electron.once("exit", resolve));
  stopChildren();
  process.exitCode = typeof exitCode === "number" ? exitCode : 0;
} catch (error) {
  stopChildren();
  const message = error instanceof Error ? error.message : "Unknown desktop startup error";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}
