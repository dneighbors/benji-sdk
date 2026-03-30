import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TodoViews, wrapSdkCall } from "@dneighbors/benji-sdk";
import { toolResult, handleToolError } from "./util.js";

/**
 * Register all 5 todo view MCP tools on the given server.
 */
export function registerTodoViewTools(server: McpServer): void {
  // -- list_done_todos ------------------------------------------------------------
  server.registerTool(
    "list_done_todos",
    {
      description:
        "List completed (done) todos. Optionally filter by task type.",
      inputSchema: {
        taskType: z
          .enum(["personal", "work", "both"])
          .optional()
          .describe(
            "Filter by task type: 'personal', 'work', or 'both'. Defaults to all if omitted.",
          ),
      },
    },
    async ({ taskType }) => {
      try {
        const result = await wrapSdkCall(
          TodoViews.todoViewsDone({ body: { taskType } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- list_paused_todos ----------------------------------------------------------
  server.registerTool(
    "list_paused_todos",
    {
      description: "List paused todos. Optionally filter by task type.",
      inputSchema: {
        taskType: z
          .enum(["personal", "work", "both"])
          .optional()
          .describe(
            "Filter by task type: 'personal', 'work', or 'both'. Defaults to all if omitted.",
          ),
      },
    },
    async ({ taskType }) => {
      try {
        const result = await wrapSdkCall(
          TodoViews.todoViewsPaused({ body: { taskType } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- list_recurring_todos -------------------------------------------------------
  server.registerTool(
    "list_recurring_todos",
    {
      description: "List recurring todos. Optionally filter by task type.",
      inputSchema: {
        taskType: z
          .enum(["personal", "work", "both"])
          .optional()
          .describe(
            "Filter by task type: 'personal', 'work', or 'both'. Defaults to all if omitted.",
          ),
      },
    },
    async ({ taskType }) => {
      try {
        const result = await wrapSdkCall(
          TodoViews.todoViewsRecurring({ body: { taskType } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- list_shared_todos ----------------------------------------------------------
  server.registerTool(
    "list_shared_todos",
    {
      description:
        "Get sharing details for a todo list. Returns shared users and pending invites.",
      inputSchema: {
        listId: z
          .string()
          .min(1)
          .describe("The todo list ID to get sharing info for"),
      },
    },
    async ({ listId }) => {
      try {
        const result = await wrapSdkCall(
          TodoViews.todoViewsSharing({ body: { listId } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- list_trash_todos -----------------------------------------------------------
  server.registerTool(
    "list_trash_todos",
    {
      description: "List trashed (deleted) todos with optional pagination.",
      inputSchema: {
        skip: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe("Number of items to skip for pagination"),
        take: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("Number of items to return (1-100)"),
      },
    },
    async ({ skip, take }) => {
      try {
        const result = await wrapSdkCall(
          TodoViews.todoViewsTrash({ body: { skip, take } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
}
