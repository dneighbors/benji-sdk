import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Hydration, wrapSdkCall } from "benji-sdk";
import {
  toolResult,
  handleToolError,
  ymdDateSchema,
  tzDateSchema,
} from "./util.js";

// NOTE: Hydration (and other Epic 3 resources) uses path: { id } for
// update/delete operations (RESTful URL params), unlike Epic 2 tools
// (Tags, Mood, etc.) which use body: { id }.

/**
 * Register all 5 hydration MCP tools on the given server.
 */
export function registerHydrationTools(server: McpServer): void {
  // -- list_hydration_logs ---------------------------------------------------
  server.registerTool(
    "list_hydration_logs",
    {
      description:
        "List hydration logs. Optionally filter by date (year, month, day).",
      inputSchema: {
        date: ymdDateSchema
          .optional()
          .describe("Filter hydration logs by date"),
      },
    },
    async ({ date }) => {
      try {
        const result = await wrapSdkCall(
          Hydration.hydrationLogsList({ body: { date } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- create_hydration_log --------------------------------------------------
  server.registerTool(
    "create_hydration_log",
    {
      description:
        "Create a new hydration log. Amount is required. Type defaults to Water.",
      inputSchema: {
        amount: z
          .number()
          .positive()
          .describe("Amount of liquid in user's preferred unit"),
        name: z
          .string()
          .nullable()
          .optional()
          .describe("Optional name/label for the log"),
        date: tzDateSchema
          .nullable()
          .optional()
          .describe(
            "Date of the hydration log. If omitted, uses server default.",
          ),
        countsTowardGoal: z
          .boolean()
          .optional()
          .describe(
            "Whether this counts toward the daily hydration goal. Defaults to true.",
          ),
        type: z
          .enum(["Water", "Coffee", "Tea", "Other"])
          .optional()
          .describe("Type of liquid. Defaults to Water."),
      },
    },
    async ({ amount, name, date, countsTowardGoal, type }) => {
      try {
        const result = await wrapSdkCall(
          Hydration.hydrationLogsCreate({
            body: { amount, name, date, countsTowardGoal, type },
          }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- update_hydration_log --------------------------------------------------
  server.registerTool(
    "update_hydration_log",
    {
      description:
        "Update an existing hydration log. Provide the log ID and the fields to update.",
      inputSchema: {
        id: z.string().describe("The hydration log ID to update"),
        data: z
          .object({
            name: z
              .string()
              .nullable()
              .optional()
              .describe("Name/label for the log"),
            amount: z
              .number()
              .positive()
              .optional()
              .describe("Amount of liquid"),
            date: tzDateSchema
              .nullable()
              .optional()
              .describe("Date of the hydration log"),
            countsTowardGoal: z
              .boolean()
              .optional()
              .describe("Whether this counts toward the daily goal"),
            type: z
              .enum(["Water", "Coffee", "Tea", "Other"])
              .optional()
              .describe("Type of liquid"),
          })
          .describe("Fields to update"),
      },
    },
    async ({ id, data }) => {
      try {
        const result = await wrapSdkCall(
          Hydration.hydrationLogsUpdate({ path: { id }, body: { data } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- delete_hydration_log --------------------------------------------------
  server.registerTool(
    "delete_hydration_log",
    {
      description: "Delete a hydration log by ID",
      inputSchema: {
        id: z.string().describe("The hydration log ID to delete"),
      },
    },
    async ({ id }) => {
      try {
        const result = await wrapSdkCall(
          Hydration.hydrationLogsDelete({ path: { id } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- get_hydration_stats ---------------------------------------------------
  server.registerTool(
    "get_hydration_stats",
    {
      description:
        "Get hydration stats for a date. Returns total amount, goal, percentage, and unit info.",
      inputSchema: {
        date: ymdDateSchema
          .optional()
          .describe(
            "Date to get stats for. If omitted, returns current day stats.",
          ),
      },
    },
    async ({ date }) => {
      try {
        const result = await wrapSdkCall(
          Hydration.hydrationLogsGetStats({ body: { date } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
}
