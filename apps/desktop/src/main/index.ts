import { join } from "node:path";

import {
  APP_NAME,
  CONVERSATION_CAPTURE_CHANNEL,
  type ConversationCaptureResult,
} from "@ai-message-coach/contracts";
import { app, BrowserWindow, ipcMain } from "electron";

import { createConversationCaptureService } from "./conversation-capture.js";

app.enableSandbox();

const coachWindows = new Set<BrowserWindow>();
const conversationCaptureService = createConversationCaptureService(() => [...coachWindows]);

const invalidCaptureRequest: ConversationCaptureResult = {
  ok: false,
  error: {
    code: "CAPTURE_FAILED",
    message: "The capture request was not accepted.",
  },
};

function registerCaptureHandler(): void {
  ipcMain.handle(CONVERSATION_CAPTURE_CHANNEL, async (event, ...arguments_: unknown[]) => {
    const requestingWindow = BrowserWindow.fromWebContents(event.sender);
    const isMainFrame =
      event.senderFrame?.frameTreeNodeId === event.sender.mainFrame.frameTreeNodeId;

    if (
      arguments_.length !== 0 ||
      requestingWindow === null ||
      !coachWindows.has(requestingWindow) ||
      !isMainFrame
    ) {
      return invalidCaptureRequest;
    }

    return await conversationCaptureService.requestConversationCapture(requestingWindow);
  });
}

function getDevelopmentUrl(): string | undefined {
  const value = process.env.VITE_DEV_SERVER_URL;

  if (value === undefined) {
    return undefined;
  }

  const url = new URL(value);

  if (url.href !== "http://127.0.0.1:5173/") {
    throw new Error("The desktop development renderer URL is not allowlisted.");
  }

  return url.href;
}

async function createWindow(): Promise<void> {
  const window = new BrowserWindow({
    backgroundColor: "#05091c",
    height: 800,
    minHeight: 480,
    minWidth: 640,
    show: false,
    title: APP_NAME,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(__dirname, "../preload/index.cjs"),
      sandbox: true,
    },
    width: 1200,
  });

  coachWindows.add(window);
  window.once("closed", () => coachWindows.delete(window));

  window.once("ready-to-show", () => window.show());
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event) => event.preventDefault());

  const developmentUrl = getDevelopmentUrl();

  if (developmentUrl !== undefined) {
    await window.loadURL(developmentUrl);
    return;
  }

  await window.loadFile(join(__dirname, "../renderer/index.html"));
}

app
  .whenReady()
  .then(async () => {
    registerCaptureHandler();
    await createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        void createWindow();
      }
    });
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown Electron startup error";
    process.stderr.write(`Unable to start desktop application: ${message}\n`);
    app.quit();
  });

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
