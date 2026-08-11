import { HealthResponseSchema } from "@ai-message-coach/contracts";
import Fastify, { type FastifyInstance } from "fastify";

interface BuildAppOptions {
  logger?: boolean;
}

export function buildApp({ logger = false }: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({ logger });

  app.get("/health", async () => HealthResponseSchema.parse({ status: "ok" }));

  return app;
}
