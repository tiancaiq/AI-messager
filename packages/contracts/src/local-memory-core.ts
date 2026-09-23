import { z } from "zod";

export const DatasetGenerationSchema = z.uuid();
export const SettingsRevisionSchema = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const LocalMemoryErrorCodeSchema = z.enum([
  "BUSY",
  "CONFLICT",
  "INVALID_REQUEST",
  "KEY_UNAVAILABLE",
  "STORE_UNAVAILABLE",
  "UNKNOWN_WRITE_OUTCOME",
]);
export const LocalMemoryErrorSchema = z
  .object({
    code: LocalMemoryErrorCodeSchema,
    message: z.string().min(1).max(240),
  })
  .strict();

export type LocalMemoryErrorCode = z.infer<typeof LocalMemoryErrorCodeSchema>;
