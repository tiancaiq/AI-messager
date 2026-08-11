import { z } from "zod";

export const APP_NAME = "AI Message Coach" as const;

export const AppInfoSchema = z
  .object({
    name: z.literal(APP_NAME),
  })
  .strict();

export type AppInfo = z.infer<typeof AppInfoSchema>;
