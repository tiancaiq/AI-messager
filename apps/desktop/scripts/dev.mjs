import { spawn } from "node:child_process";

const packageManager = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const rendererUrl = "http://127.0.0.1:5173";
const children = new Set();

function spawnProcess(args, options = {}) {
  const child = spawn(packageManager, args, {
    cwd: import.meta.dirname.replace(/[/\\]scripts$/, ""),
    stdio: "inherit",
    ...options,
  });

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

async function waitForRenderer() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
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

  spawnProcess(["exec", "vite", "--host", "127.0.0.1", "--port", "5173", "--strictPort"]);
  await waitForRenderer();

  const electron = spawnProcess(["exec", "electron", "."], {
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
