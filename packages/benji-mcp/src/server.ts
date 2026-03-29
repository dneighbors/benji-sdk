import { createRequire } from "node:module";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTodoTools } from "./tools/todos.js";
import { registerTagTools } from "./tools/tags.js";
import { registerProjectTools } from "./tools/projects.js";
import { registerTodoListTools } from "./tools/todo-lists.js";
import { registerHabitTools } from "./tools/habits.js";
import { registerMoodTools } from "./tools/mood.js";
import { registerHydrationTools } from "./tools/hydration.js";
import { registerFastingTools } from "./tools/fasting.js";
import { registerWorkoutTools } from "./tools/workouts.js";
import { registerJournalTools } from "./tools/journal.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

/**
 * Create and return the MCP server instance.
 *
 * Declares tool capabilities and registers all tool modules.
 */
export function createServer(): McpServer {
  const mcpServer = new McpServer(
    {
      name: "benji-mcp",
      version,
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  registerTodoTools(mcpServer);
  registerTagTools(mcpServer);
  registerProjectTools(mcpServer);
  registerTodoListTools(mcpServer);
  registerHabitTools(mcpServer);
  registerMoodTools(mcpServer);
  registerHydrationTools(mcpServer);
  registerFastingTools(mcpServer);
  registerWorkoutTools(mcpServer);
  registerJournalTools(mcpServer);

  return mcpServer;
}
