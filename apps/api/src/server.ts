import { buildApp } from "./app.js";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 3000;

function readPort(value: string | undefined): number {
  if (value === undefined) {
    return DEFAULT_PORT;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("API_PORT must be an integer between 1 and 65535.");
  }

  return port;
}

const host = process.env.API_HOST?.trim() || DEFAULT_HOST;
const port = readPort(process.env.API_PORT);
const app = buildApp();

try {
  await app.listen({ host, port });
  process.stdout.write(`AI Message Coach API listening on http://${host}:${port}\n`);
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown startup error";
  process.stderr.write(`Unable to start API: ${message}\n`);
  process.exitCode = 1;
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    void app.close();
  });
}
