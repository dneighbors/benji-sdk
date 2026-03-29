import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Goals, wrapSdkCall } from "benji-sdk";
import { toolResult, handleToolError, tzDateSchema } from "./util.js";

/**
 * Register all 7 goal MCP tools on the given server.
 */
export function registerGoalTools(server: McpServer): void {
  // -- list_goals ---------------------------------------------------------------
  server.registerTool(
    "list_goals",
    {
      description: "List all goals for the current user.",
    },
    async () => {
      try {
        const result = await wrapSdkCall(Goals.goalsList());
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- create_goal --------------------------------------------------------------
  server.registerTool(
    "create_goal",
    {
      description:
        "Create a new goal. Requires a name. Optionally include a due date, emoji, public flag, and done status.",
      inputSchema: {
        name: z.string().min(1).describe("Name of the goal"),
        dueDate: tzDateSchema
          .nullable()
          .optional()
          .describe(
            "Due date (timezone and dateInUsersTimezone). Null to clear.",
          ),
        emoji: z
          .string()
          .nullable()
          .optional()
          .describe("Emoji icon for the goal"),
        public: z
          .boolean()
          .optional()
          .describe("Whether the goal is publicly visible"),
        done: z
          .boolean()
          .nullable()
          .optional()
          .describe("Whether the goal is completed"),
      },
    },
    async ({ name, dueDate, emoji, public: isPublic, done }) => {
      try {
        const result = await wrapSdkCall(
          Goals.goalsCreate({
            body: {
              name,
              dueDate,
              emoji,
              public: isPublic,
              done,
            },
          }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- get_goal -----------------------------------------------------------------
  server.registerTool(
    "get_goal",
    {
      description: "Get a single goal by ID.",
      inputSchema: {
        id: z.string().min(1).describe("The goal ID to retrieve"),
      },
    },
    async ({ id }) => {
      try {
        const result = await wrapSdkCall(
          Goals.goalsGet({ path: { id } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- update_goal --------------------------------------------------------------
  server.registerTool(
    "update_goal",
    {
      description:
        "Update an existing goal. Provide the goal ID and the fields to update.",
      inputSchema: {
        id: z.string().min(1).describe("The goal ID to update"),
        data: z
          .object({
            name: z.string().min(1).optional().describe("Updated goal name"),
            dueDate: tzDateSchema
              .nullable()
              .optional()
              .describe("Updated due date. Null to clear."),
            emoji: z
              .string()
              .nullable()
              .optional()
              .describe("Updated emoji icon"),
            public: z
              .boolean()
              .optional()
              .describe("Updated public visibility"),
            done: z
              .boolean()
              .nullable()
              .optional()
              .describe("Updated completion status"),
          })
          .refine(
            (d) =>
              d.name !== undefined ||
              d.dueDate !== undefined ||
              d.emoji !== undefined ||
              d.public !== undefined ||
              d.done !== undefined,
            {
              message:
                "At least one field (name, dueDate, emoji, public, or done) must be provided",
            },
          )
          .describe("Fields to update"),
      },
    },
    async ({ id, data }) => {
      try {
        const result = await wrapSdkCall(
          Goals.goalsUpdate({ path: { id }, body: { data } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- delete_goal --------------------------------------------------------------
  server.registerTool(
    "delete_goal",
    {
      description: "Delete a goal by ID.",
      inputSchema: {
        id: z.string().min(1).describe("The goal ID to delete"),
      },
    },
    async ({ id }) => {
      try {
        const result = await wrapSdkCall(
          Goals.goalsDelete({ path: { id } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- delete_many_goals --------------------------------------------------------
  server.registerTool(
    "delete_many_goals",
    {
      description: "Delete multiple goals by their IDs.",
      inputSchema: {
        ids: z
          .array(z.string().min(1))
          .min(1)
          .describe("Array of goal IDs to delete"),
      },
    },
    async ({ ids }) => {
      try {
        const result = await wrapSdkCall(
          Goals.goalsDeleteMany({ body: { ids } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- list_public_goals --------------------------------------------------------
  server.registerTool(
    "list_public_goals",
    {
      description: "List public goals for a user by their username.",
      inputSchema: {
        username: z
          .string()
          .min(1)
          .describe("The username whose public goals to list"),
      },
    },
    async ({ username }) => {
      try {
        const result = await wrapSdkCall(
          Goals.goalsPublicList({ path: { username } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
}
