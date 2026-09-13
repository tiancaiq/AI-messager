import { existsSync } from "node:fs";
import { resolve } from "node:path";

export function loadPhase4LiveEnvironment(
  runLiveComparison,
  {
    environmentPath = resolve(import.meta.dirname, "../.env.local"),
    environmentExists = existsSync,
    loadEnvironmentFile = process.loadEnvFile.bind(process),
  } = {},
) {
  if (!runLiveComparison || !environmentExists(environmentPath)) return false;
  loadEnvironmentFile(environmentPath);
  return true;
}
