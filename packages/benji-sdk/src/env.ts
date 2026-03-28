declare const process: { env: Record<string, string | undefined> };

import { configure } from "./index.js";
import { BenjiConfigError } from "./errors.js";

/**
 * Initialize the Benji SDK from environment variables.
 *
 * Reads `BENJI_API_KEY` (required) and `BENJI_BASE_URL` (optional) from
 * the environment and calls `configure()`.
 *
 * @throws {BenjiConfigError} if BENJI_API_KEY is not set
 */
export function initializeFromEnv(): void {
  const apiKey = process.env.BENJI_API_KEY;
  if (!apiKey) {
    throw new BenjiConfigError(
      'BENJI_API_KEY environment variable is required. Get your API key from https://app.benji.so/settings'
    );
  }
  const baseUrl = process.env.BENJI_BASE_URL;
  configure({ apiKey, baseUrl });
}
