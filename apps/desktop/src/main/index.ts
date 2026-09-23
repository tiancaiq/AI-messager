import { join } from "node:path";

import { OpenAiCoachingAdapter, OpenAiVisionAdapter } from "@ai-message-coach/ai";
import {
  APP_NAME,
  COACHING_REQUEST_CHANNEL,
  COPY_COACHING_TEXT_CHANNEL,
  CONVERSATION_ANALYSIS_CHANNEL,
  CONVERSATION_CAPTURE_CHANNEL,
  DESKTOP_DEVELOPMENT_RENDERER_URL,
  ConversationImageRequestSchema,
  CoachingRequestSchema,
  CopyCoachingTextRequestSchema,
  isDesktopDevelopmentRendererUrl,
  PROVIDER_CONFIGURATION_CHANNEL,
  type ConversationAnalysisResult,
  type CoachingDecisionResult,
  type CopyCoachingTextResult,
  type ConversationCaptureResult,
} from "@ai-message-coach/contracts";
import { app, BrowserWindow, clipboard, ipcMain } from "electron";

import { createConversationCaptureService } from "./conversation-capture.js";
import { createConversationAnalysisService } from "./conversation-analysis.js";
import { copyCoachingText, createCoachingService } from "./coaching.js";
import { LocalMemoryCoordinator } from "./local-memory/coordinator.js";
import {
  createDevelopmentMemoryDebugSnapshot,
  removeDevelopmentMemoryDebugSnapshot,
} from "./local-memory/debug-snapshot.js";
import { openDevelopmentMemorySnapshotInLetos } from "./local-memory/letos-debug-gui.js";
import {
  registerLocalMemoryHandlers,
  registerLocalMemoryInspectorHandler,
} from "./local-memory/ipc.js";

app.enableSandbox();

const coachWindows = new Set<BrowserWindow>();
const conversationCaptureService = createConversationCaptureService(() => [...coachWindows]);
const conversationAnalysisService = createConversationAnalysisService(
  new OpenAiVisionAdapter({
    ...(process.env.OPENAI_API_KEY === undefined ? {} : { apiKey: process.env.OPENAI_API_KEY }),
    ...(process.env.OPENAI_VISION_MODEL === undefined
      ? {}
      : { modelId: process.env.OPENAI_VISION_MODEL }),
  }),
);
const coachingService = createCoachingService(
  new OpenAiCoachingAdapter({
    ...(process.env.OPENAI_API_KEY === undefined ? {} : { apiKey: process.env.OPENAI_API_KEY }),
    ...(process.env.OPENAI_TEXT_MODEL === undefined
      ? process.env.OPENAI_VISION_MODEL === undefined
        ? {}
        : { modelId: process.env.OPENAI_VISION_MODEL }
      : { modelId: process.env.OPENAI_TEXT_MODEL }),
  }),
);
const localMemory = new LocalMemoryCoordinator();
const developmentMemoryDebugSnapshotMode =
  process.defaultApp && process.env.AI_MESSAGE_COACH_MEMORY_DEBUG_SNAPSHOT === "1";
const developmentMemoryDebugGuiMode =
  process.defaultApp && process.env.AI_MESSAGE_COACH_MEMORY_DEBUG_GUI === "1";

const invalidCaptureRequest: ConversationCaptureResult = {
  ok: false,
  error: {
    code: "CAPTURE_FAILED",
    message: "The capture request was not accepted.",
  },
};

const invalidAnalysisRequest: ConversationAnalysisResult = {
  ok: false,
  error: {
    code: "PROVIDER_ERROR",
    message: "The analysis request was not accepted.",
  },
};
const invalidCoachingRequest: CoachingDecisionResult = {
  ok: false,
  error: { code: "PROVIDER_ERROR", message: "The coaching request was not accepted." },
};
const invalidCopyRequest: CopyCoachingTextResult = {
  ok: false,
  error: { message: "The copy request was not accepted." },
};

function isAuthorizedRenderer(
  sender: Electron.WebContents,
  senderFrame: Electron.WebFrameMain | null,
): boolean {
  const requestingWindow = BrowserWindow.fromWebContents(sender);
  const isMainFrame = senderFrame?.frameTreeNodeId === sender.mainFrame.frameTreeNodeId;

  return requestingWindow !== null && coachWindows.has(requestingWindow) && isMainFrame;
}

function registerCaptureHandler(): void {
  ipcMain.handle(CONVERSATION_CAPTURE_CHANNEL, async (event, ...arguments_: unknown[]) => {
    const requestingWindow = BrowserWindow.fromWebContents(event.sender);

    if (
      arguments_.length !== 0 ||
      requestingWindow === null ||
      !isAuthorizedRenderer(event.sender, event.senderFrame)
    ) {
      return invalidCaptureRequest;
    }

    return await conversationCaptureService.requestConversationCapture(requestingWindow);
  });
}

function registerAnalysisHandlers(): void {
  ipcMain.handle(PROVIDER_CONFIGURATION_CHANNEL, (event, ...arguments_: unknown[]) => {
    if (arguments_.length !== 0 || !isAuthorizedRenderer(event.sender, event.senderFrame)) {
      return null;
    }

    return conversationAnalysisService.getProviderConfiguration();
  });

  ipcMain.handle(CONVERSATION_ANALYSIS_CHANNEL, async (event, ...arguments_: unknown[]) => {
    if (arguments_.length !== 1 || !isAuthorizedRenderer(event.sender, event.senderFrame)) {
      return invalidAnalysisRequest;
    }

    const request = ConversationImageRequestSchema.safeParse(arguments_[0]);

    if (!request.success) {
      return invalidAnalysisRequest;
    }

    return await conversationAnalysisService.requestAnalysis(request.data);
  });
}

function registerCoachingHandlers(): void {
  ipcMain.handle(COACHING_REQUEST_CHANNEL, async (event, ...arguments_: unknown[]) => {
    if (arguments_.length !== 1 || !isAuthorizedRenderer(event.sender, event.senderFrame))
      return invalidCoachingRequest;
    const request = CoachingRequestSchema.safeParse(arguments_[0]);
    return request.success
      ? await coachingService.requestCoaching(request.data)
      : invalidCoachingRequest;
  });
  ipcMain.handle(COPY_COACHING_TEXT_CHANNEL, (event, ...arguments_: unknown[]) => {
    if (arguments_.length !== 1 || !isAuthorizedRenderer(event.sender, event.senderFrame))
      return invalidCopyRequest;
    const request = CopyCoachingTextRequestSchema.safeParse(arguments_[0]);
    return request.success ? copyCoachingText(clipboard, request.data.text) : invalidCopyRequest;
  });
}

function getDevelopmentUrl(): string | undefined {
  const value = process.env.VITE_DEV_SERVER_URL;

  if (value === undefined) {
    return undefined;
  }

  if (!isDesktopDevelopmentRendererUrl(value)) {
    throw new Error("The desktop development renderer URL is not allowlisted.");
  }

  return DESKTOP_DEVELOPMENT_RENDERER_URL;
}

async function createWindow(developmentUrl: string | undefined): Promise<void> {
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

  if (developmentUrl !== undefined) {
    await window.loadURL(developmentUrl);
    return;
  }

  await window.loadFile(join(__dirname, "../renderer/index.html"));
}

async function runDevelopmentMemoryDebugSnapshot(): Promise<void> {
  const snapshot = await createDevelopmentMemoryDebugSnapshot(localMemory);
  localMemory.close();
  process.stdout.write(
    [
      "Encrypted local-memory debug snapshot created.",
      `Database: ${snapshot.databasePath}`,
      `Passphrase: ${snapshot.passphrase}`,
      `Schema version: ${snapshot.schemaVersion}`,
      "SQLiteStudio/SQLite3MultipleCiphers: choose SQLCipher compatibility 4 and open read-only.",
      "The passphrase belongs only to this temporary snapshot; it is not the application key.",
      process.stdin.isTTY
        ? "Press Enter when finished to delete the snapshot."
        : "Delete the containing temporary directory when finished.",
      "",
    ].join("\n"),
  );

  if (!process.stdin.isTTY) {
    app.quit();
    return;
  }

  process.stdin.resume();
  await new Promise<void>((resolve) => process.stdin.once("data", () => resolve()));
  await removeDevelopmentMemoryDebugSnapshot(snapshot);
  process.stdout.write("Temporary encrypted snapshot deleted.\n");
  app.quit();
}

async function runDevelopmentMemoryDebugGui(): Promise<void> {
  const snapshot = await createDevelopmentMemoryDebugSnapshot(localMemory);
  localMemory.close();
  try {
    await openDevelopmentMemorySnapshotInLetos(snapshot);
  } finally {
    await removeDevelopmentMemoryDebugSnapshot(snapshot);
    process.stdout.write("Temporary encrypted snapshot and Letos profile deleted.\n");
  }
  app.quit();
}

app
  .whenReady()
  .then(async () => {
    if (developmentMemoryDebugGuiMode) {
      await runDevelopmentMemoryDebugGui();
      return;
    }
    if (developmentMemoryDebugSnapshotMode) {
      await runDevelopmentMemoryDebugSnapshot();
      return;
    }
    const developmentUrl = getDevelopmentUrl();
    registerCaptureHandler();
    registerAnalysisHandlers();
    registerCoachingHandlers();
    registerLocalMemoryHandlers(localMemory, (event) =>
      isAuthorizedRenderer(event.sender, event.senderFrame),
    );
    if (developmentUrl !== undefined && !app.isPackaged) {
      registerLocalMemoryInspectorHandler(localMemory, (event) =>
        isAuthorizedRenderer(event.sender, event.senderFrame),
      );
    }
    await createWindow(developmentUrl);
    void localMemory.initialize();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        void createWindow(developmentUrl);
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

app.once("before-quit", () => localMemory.close());
