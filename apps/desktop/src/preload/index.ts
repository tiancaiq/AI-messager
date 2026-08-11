import {
  APP_NAME,
  AppInfoSchema,
  CONVERSATION_CAPTURE_CHANNEL,
  ConversationCaptureResultSchema,
  type ConversationCaptureResult,
} from "@ai-message-coach/contracts";
import { contextBridge, ipcRenderer } from "electron";

const invalidCaptureResponse: ConversationCaptureResult = {
  ok: false,
  error: {
    code: "CAPTURE_FAILED",
    message: "The capture response could not be validated. Please try again.",
  },
};

async function requestConversationCapture(): Promise<ConversationCaptureResult> {
  const result = ConversationCaptureResultSchema.safeParse(
    await ipcRenderer.invoke(CONVERSATION_CAPTURE_CHANNEL),
  );

  return result.success ? result.data : invalidCaptureResponse;
}

const bridge = Object.freeze({
  appInfo: AppInfoSchema.parse({ name: APP_NAME }),
  requestConversationCapture,
});

contextBridge.exposeInMainWorld("messageCoach", bridge);
