import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TodoLists, wrapSdkCall, BenjiApiError } from "benji-sdk";

/**
 * Return a structured MCP success result.
 */
function toolResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data) }],
  };
}

/**
 * Return a structured MCP error result.
 */
function handleToolError(error: unknown) {
  if (error instanceof BenjiApiError) {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            code: error.code,
            message: error.message,
            ...(error.issues && { issues: error.issues }),
          }),
        },
      ],
      isError: true,
    };
  }
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          code: "UNKNOWN_ERROR",
          message: error instanceof Error ? error.message : String(error),
        }),
      },
    ],
    isError: true,
  };
}

/** Shared todo list fields used by both create and update. */
const todoListFieldsSchema = {
  emoji: z
    .string()
    .nullable()
    .optional()
    .describe("Emoji icon for the list"),
  description: z
    .string()
    .nullable()
    .optional()
    .describe("Description of the list"),
  parentListId: z
    .string()
    .nullable()
    .optional()
    .describe("ID of a parent list for nesting"),
  taskType: z
    .enum(["work", "personal", "both"])
    .optional()
    .describe("Task type for the list"),
  showInOverview: z
    .boolean()
    .optional()
    .describe("Whether to show this list in the overview"),
  showInSidebar: z
    .boolean()
    .optional()
    .describe("Whether to show this list in the sidebar"),
  paused: z
    .boolean()
    .optional()
    .describe("Whether the list is paused"),
  priority: z
    .enum(["low", "medium", "high"])
    .optional()
    .describe("Priority level of the list"),
  tagIds: z
    .array(z.string())
    .nullable()
    .optional()
    .describe("Tag IDs to associate with this list"),
  defaultAssigneeId: z
    .string()
    .nullable()
    .optional()
    .describe("Default assignee ID for todos in this list"),
};

/**
 * Register all 4 todo list MCP tools on the given server.
 */
export function registerTodoListTools(server: McpServer): void {
  // -- Task 3: list_todo_lists --------------------------------------------
  server.registerTool(
    "list_todo_lists",
    {
      description:
        "List all todo lists for the current user. Optionally filter by task type.",
      inputSchema: {
        taskType: z
          .enum(["personal", "work", "both"])
          .optional()
          .describe("Filter lists by task type"),
      },
    },
    async ({ taskType }) => {
      try {
        const result = await wrapSdkCall(
          TodoLists.todoListsList({ body: { taskType } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- Task 4: create_todo_list -------------------------------------------
  server.registerTool(
    "create_todo_list",
    {
      description:
        "Create a new todo list. Only name is required; all other fields are optional.",
      inputSchema: {
        name: z.string().describe("The todo list name (required)"),
        ...todoListFieldsSchema,
      },
    },
    async (args) => {
      try {
        const result = await wrapSdkCall(
          TodoLists.todoListsCreate({
            body: args as Parameters<
              typeof TodoLists.todoListsCreate
            >[0]["body"],
          }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- Task 5: update_todo_list -------------------------------------------
  server.registerTool(
    "update_todo_list",
    {
      description:
        "Update an existing todo list. Provide the list ID and the fields to update.",
      inputSchema: {
        id: z.string().describe("The todo list ID to update"),
        data: z
          .object({
            name: z.string().optional().describe("New list name"),
            ...todoListFieldsSchema,
          })
          .describe("Fields to update"),
      },
    },
    async ({ id, data }) => {
      try {
        const result = await wrapSdkCall(
          TodoLists.todoListsUpdate({
            body: { id, data } as Parameters<
              typeof TodoLists.todoListsUpdate
            >[0]["body"],
          }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- Task 6: delete_todo_list -------------------------------------------
  server.registerTool(
    "delete_todo_list",
    {
      description: "Delete a todo list by ID",
      inputSchema: {
        id: z.string().describe("The todo list ID to delete"),
      },
    },
    async ({ id }) => {
      try {
        const result = await wrapSdkCall(
          TodoLists.todoListsDelete({ body: { id } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
}
