import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Hydration, wrapSdkCall } from "benji-sdk";
import { toolResult, handleToolError } from "./util.js";

// NOTE: Hydration (and other Epic 3 resources) uses path: { id } for
// update/delete operations (RESTful URL params), unlike Epic 2 tools
// (Tags, Mood, etc.) which use body: { id }.

// Shared date schemas to avoid duplication across tools
const ymdDateSchema = z.object({
  year: z.number().int().min(1900).max(2100).describe("Year (e.g. 2026)"),
  month: z.number().int().min(1).max(12).describe("Month (1-12)"),
  day: z.number().int().min(1).max(31).describe("Day of month (1-31)"),
});

const tzDateSchema = z.object({
  timezone: z.string().describe("IANA timezone, e.g. America/New_York"),
  dateInUsersTimezone: z
    .string()
    .describe("ISO date string in user's timezone, e.g. 2026-03-28"),
});

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
