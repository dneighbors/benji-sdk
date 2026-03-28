// Re-export everything from generated client
export * from "./client/index.js";

// Import client config
import { client } from "./client/client.gen.js";

export interface BenjiConfig {
  /** Your Benji API key */
  apiKey: string;
  /** Optional custom base URL (defaults to https://app.benji.so/api/rest) */
  baseUrl?: string;
}

/**
 * Configure the Benji SDK with your API key
 *
 * @example
 * ```ts
 * import { configure, Todos, Habits } from "benji-sdk";
 *
 * configure({ apiKey: "your-api-key" });
 *
 * // List today's todos
 * const { data } = await Todos.todosList({ body: { screen: "today" } });
 *
 * // Create a habit
 * await Habits.habitsCreate({ body: { name: "Drink water", emoji: "💧" } });
 * ```
 */
export function configure(options: BenjiConfig) {
  client.setConfig({
    baseUrl: options.baseUrl ?? "https://app.benji.so/api/rest",
    headers: {
      "x-api-key": options.apiKey,
    },
  });
}

export { client };

// Error types and utilities
export { BenjiError, BenjiConfigError, BenjiApiError } from "./errors.js";
export { initializeFromEnv } from "./env.js";
export { wrapSdkCall } from "./wrapper.js";
