import { initializeFromEnv } from "@dneighbors/benji-sdk";
import { handleCommandError } from "./error-handler.js";

export function ensureAuth(): void {
  try {
    initializeFromEnv();
  } catch (error: unknown) {
    handleCommandError(error);
  }
}
