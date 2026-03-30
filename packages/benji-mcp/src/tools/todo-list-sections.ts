import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TodoListSections, wrapSdkCall } from "@dneighbors/benji-sdk";
import { toolResult, handleToolError } from "./util.js";

/**
 * Register all 2 todo list section MCP tools on the given server.
 */
export function registerTodoListSectionTools(server: McpServer): void {
  // -- update_todo_list_section ---------------------------------------------------
  server.registerTool(
    "update_todo_list_section",
    {
      description:
        "Update a todo list section. Provide the section ID and the fields to update.",
      inputSchema: {
        id: z
          .string()
          .min(1)
          .describe("The todo list section ID to update"),
        data: z
          .object({
            name: z
              .string()
              .min(1)
              .optional()
              .describe("New name for the section"),
          })
          .describe("Fields to update"),
      },
    },
    async ({ id, data }) => {
      try {
        const result = await wrapSdkCall(
          TodoListSections.todoListSectionsUpdate({
            path: { id },
            body: { data },
          }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- delete_todo_list_section ---------------------------------------------------
  server.registerTool(
    "delete_todo_list_section",
    {
      description:
        "Delete a todo list section by ID. Optionally delete its todos as well.",
      inputSchema: {
        id: z
          .string()
          .min(1)
          .describe("The todo list section ID to delete"),
        deleteTodos: z
          .boolean()
          .optional()
          .describe(
            "If true, also delete all todos in this section. Defaults to false.",
          ),
      },
    },
    async ({ id, deleteTodos }) => {
      try {
        const result = await wrapSdkCall(
          TodoListSections.todoListSectionsDelete({
            path: { id },
            query: { deleteTodos },
          }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
}
