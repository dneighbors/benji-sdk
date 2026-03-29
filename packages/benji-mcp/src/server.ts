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
import { registerPainEventTools } from "./tools/pain-events.js";
import { registerWeightLogTools } from "./tools/weight-logs.js";
import { registerTodoViewTools } from "./tools/todo-views.js";
import { registerProjectSectionTools } from "./tools/project-sections.js";
import { registerTodoListSectionTools } from "./tools/todo-list-sections.js";
import { registerGoalTools } from "./tools/goals.js";
import { registerContactTools } from "./tools/contacts.js";
import { registerFoodTools } from "./tools/food.js";
import { registerBloodPressureTools } from "./tools/blood-pressure.js";

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
  registerPainEventTools(mcpServer);
  registerWeightLogTools(mcpServer);
  registerTodoViewTools(mcpServer);
  registerProjectSectionTools(mcpServer);
  registerTodoListSectionTools(mcpServer);
  registerGoalTools(mcpServer);
  registerContactTools(mcpServer);
  registerFoodTools(mcpServer);
  registerBloodPressureTools(mcpServer);

  return mcpServer;
}
