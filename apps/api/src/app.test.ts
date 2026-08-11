import { HealthResponseSchema } from "@ai-message-coach/contracts";
import { afterEach, describe, expect, it } from "vitest";

import { buildApp } from "./app.js";

const apps = new Set<ReturnType<typeof buildApp>>();

afterEach(async () => {
  await Promise.all([...apps].map(async (app) => app.close()));
  apps.clear();
});

describe("GET /health", () => {
  it("returns the shared health contract", async () => {
    const app = buildApp();
    apps.add(app);

    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(HealthResponseSchema.parse(response.json())).toEqual({ status: "ok" });
  });
});
