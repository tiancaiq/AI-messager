import { z } from "zod";

export const ApiErrorCodeSchema = z.enum([
  "VALIDATION_ERROR",
  "SERVICE_UNAVAILABLE",
  "INTERNAL_ERROR",
]);

export const ApiErrorSchema = z
  .object({
    code: ApiErrorCodeSchema,
    message: z.string().min(1),
  })
  .strict();

export type ApiError = z.infer<typeof ApiErrorSchema>;
