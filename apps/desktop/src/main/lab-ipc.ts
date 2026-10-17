import {
  LAB_RUN_CHANNEL,
  LAB_CONFIGURATION_CHANNEL,
  LabRequestSchema,
  isDesktopDevelopmentRendererUrl,
  type LabResult,
} from "@ai-message-coach/contracts";
import { ipcMain } from "electron";

import type { LabService } from "./lab.js";

export function registerLabHandlers(
  service: LabService,
  environment: { packaged: boolean; defaultApp: boolean; rendererUrl: string | undefined },
  authorized: (event: Electron.IpcMainInvokeEvent) => boolean,
): void {
  if (
    environment.packaged ||
    !environment.defaultApp ||
    !isDesktopDevelopmentRendererUrl(environment.rendererUrl)
  )
    return;
  ipcMain.handle(LAB_CONFIGURATION_CHANNEL, (event, ...args: unknown[]) =>
    authorized(event) && args.length === 0 ? service.configuration : null,
  );
  ipcMain.handle(LAB_RUN_CHANNEL, async (event, ...args: unknown[]): Promise<LabResult> => {
    if (!authorized(event)) return { ok: false, code: "UNAVAILABLE", action: null };
    const request = args.length === 1 ? LabRequestSchema.safeParse(args[0]) : null;
    if (!request?.success) return { ok: false, code: "INVALID_REQUEST", action: null };
    return service.run(request.data);
  });
}
