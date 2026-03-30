import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Fasting, wrapSdkCall } from "@dneighbors/benji-sdk";
import { toolResult, handleToolError, tzDateSchema } from "./util.js";

/**
 * Register all 8 fasting MCP tools on the given server.
 */
export function registerFastingTools(server: McpServer): void {
  // -- start_fast -------------------------------------------------------------
  server.registerTool(
    "start_fast",
    {
      description:
        "Start a new fast. Optionally specify a goal duration in hours and a start time.",
      inputSchema: {
        hours: z
          .number()
          .positive()
          .nullable()
          .optional()
          .describe(
            "Goal duration in hours (e.g. 16 for 16:8 intermittent fasting)",
          ),
        startTime: tzDateSchema
          .nullable()
          .optional()
          .describe("When the fast started. If omitted, starts now."),
      },
    },
    async ({ hours, startTime }) => {
      try {
        const result = await wrapSdkCall(
          Fasting.fastingStart({ body: { hours, startTime } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- end_fast ---------------------------------------------------------------
  server.registerTool(
    "end_fast",
    {
      description:
        "End an active fast. Provide the fast ID. Optionally specify how many minutes ago the fast ended.",
      inputSchema: {
        fastId: z.string().min(1).describe("The ID of the active fast to end"),
        timeAgoMinutes: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe(
            "How many minutes ago the fast actually ended (if not ending right now)",
          ),
      },
    },
    async ({ fastId, timeAgoMinutes }) => {
      try {
        const result = await wrapSdkCall(
          Fasting.fastingEnd({ body: { fastId, timeAgoMinutes } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- get_active_fast --------------------------------------------------------
  server.registerTool(
    "get_active_fast",
    {
      description:
        "Get the currently active fast, if any. Returns the fast details and progress stats, or null if no fast is active.",
    },
    async () => {
      try {
        const result = await wrapSdkCall(Fasting.fastingGetActive());
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- get_fasting_stats ------------------------------------------------------
  server.registerTool(
    "get_fasting_stats",
    {
      description:
        "Get fasting statistics. Returns overall percentage, fasted hours, goal hours, and whether a fast is active.",
    },
    async () => {
      try {
        const result = await wrapSdkCall(Fasting.fastingGetStats());
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- list_fasts -------------------------------------------------------------
  server.registerTool(
    "list_fasts",
    {
      description:
        "List fasts. Optionally filter by date range using dateFrom and dateTo (ISO date strings, e.g. 2026-03-01).",
      inputSchema: {
        dateFrom: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be ISO date format YYYY-MM-DD")
          .optional()
          .describe("Start of date range (ISO date string, e.g. 2026-03-01)"),
        dateTo: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be ISO date format YYYY-MM-DD")
          .optional()
          .describe("End of date range (ISO date string, e.g. 2026-03-31)"),
      },
    },
    async ({ dateFrom, dateTo }) => {
      try {
        const result = await wrapSdkCall(
          Fasting.fastingList({ body: { dateFrom, dateTo } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- get_fast ---------------------------------------------------------------
  server.registerTool(
    "get_fast",
    {
      description: "Get a single fast by ID.",
      inputSchema: {
        id: z.string().min(1).describe("The fast ID to retrieve"),
      },
    },
    async ({ id }) => {
      try {
        const result = await wrapSdkCall(
          Fasting.fastingGet({ path: { id } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- update_fast ------------------------------------------------------------
  server.registerTool(
    "update_fast",
    {
      description:
        "Update an existing fast. Provide the fast ID and the fields to update.",
      inputSchema: {
        id: z.string().min(1).describe("The fast ID to update"),
        data: z
          .object({
            goal: z
              .number()
              .positive()
              .nullable()
              .optional()
              .describe("Goal duration in hours"),
            startTime: tzDateSchema
              .nullable()
              .optional()
              .describe("Start time of the fast"),
            endTime: tzDateSchema
              .nullable()
              .optional()
              .describe("End time of the fast"),
          })
          .refine(
            (d) =>
              d.goal !== undefined ||
              d.startTime !== undefined ||
              d.endTime !== undefined,
            {
              message:
                "At least one field (goal, startTime, or endTime) must be provided",
            },
          )
          .describe("Fields to update"),
      },
    },
    async ({ id, data }) => {
      try {
        const result = await wrapSdkCall(
          Fasting.fastingUpdate({ path: { id }, body: { data } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- delete_fast ------------------------------------------------------------
  server.registerTool(
    "delete_fast",
    {
      description: "Delete a fast by ID.",
      inputSchema: {
        id: z.string().min(1).describe("The fast ID to delete"),
      },
    },
    async ({ id }) => {
      try {
        const result = await wrapSdkCall(
          Fasting.fastingDelete({ path: { id } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
}
