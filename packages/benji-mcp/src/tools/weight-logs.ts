import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { WeightLogs, wrapSdkCall } from "@dneighbors/benji-sdk";
import { toolResult, handleToolError, tzDateSchema } from "./util.js";

/**
 * Register all 10 weight log MCP tools on the given server.
 */
export function registerWeightLogTools(server: McpServer): void {
  // -- list_weight_logs ---------------------------------------------------------
  server.registerTool(
    "list_weight_logs",
    {
      description:
        "List weight logs. Optionally filter by a specific date, or a date range using dateFrom/dateTo. All dates are ISO strings (YYYY-MM-DD).",
      inputSchema: {
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format")
          .optional()
          .describe("Filter by exact date (YYYY-MM-DD)"),
        dateFrom: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format")
          .optional()
          .describe("Start of date range (YYYY-MM-DD)"),
        dateTo: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format")
          .optional()
          .describe("End of date range (YYYY-MM-DD)"),
      },
    },
    async ({ date, dateFrom, dateTo }) => {
      try {
        const result = await wrapSdkCall(
          WeightLogs.weightLogsList({ body: { date, dateFrom, dateTo } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- create_weight_log --------------------------------------------------------
  server.registerTool(
    "create_weight_log",
    {
      description:
        "Create a new weight log entry. Requires weight value. Optionally include body composition percentages and a timezone-aware date.",
      inputSchema: {
        weight: z
          .number()
          .positive()
          .describe("Weight value in user's preferred unit (kg or lbs)"),
        fatPercentage: z
          .number()
          .min(0)
          .max(100)
          .nullable()
          .optional()
          .describe("Body fat percentage (0-100)"),
        musclePercentage: z
          .number()
          .min(0)
          .max(100)
          .nullable()
          .optional()
          .describe("Muscle mass percentage (0-100)"),
        bonePercentage: z
          .number()
          .min(0)
          .max(100)
          .nullable()
          .optional()
          .describe("Bone mass percentage (0-100)"),
        date: tzDateSchema
          .nullable()
          .optional()
          .describe(
            "When the weight was recorded (timezone and dateInUsersTimezone). Defaults to now if omitted.",
          ),
      },
    },
    async ({ weight, fatPercentage, musclePercentage, bonePercentage, date }) => {
      try {
        const result = await wrapSdkCall(
          WeightLogs.weightLogsCreate({
            body: {
              weight,
              fatPercentage: fatPercentage ?? null,
              musclePercentage: musclePercentage ?? null,
              bonePercentage: bonePercentage ?? null,
              date,
            },
          }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- get_weight_log -----------------------------------------------------------
  server.registerTool(
    "get_weight_log",
    {
      description: "Get a single weight log by ID.",
      inputSchema: {
        id: z
          .string()
          .min(1)
          .describe("The weight log ID to retrieve"),
      },
    },
    async ({ id }) => {
      try {
        const result = await wrapSdkCall(
          WeightLogs.weightLogsGet({ body: { id } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- update_weight_log --------------------------------------------------------
  server.registerTool(
    "update_weight_log",
    {
      description:
        "Update an existing weight log. Provide the log ID and the fields to update.",
      inputSchema: {
        id: z
          .string()
          .min(1)
          .describe("The weight log ID to update"),
        data: z
          .object({
            weight: z
              .number()
              .positive()
              .optional()
              .describe("Updated weight value"),
            fatPercentage: z
              .number()
              .min(0)
              .max(100)
              .nullable()
              .optional()
              .describe("Updated body fat percentage"),
            musclePercentage: z
              .number()
              .min(0)
              .max(100)
              .nullable()
              .optional()
              .describe("Updated muscle mass percentage"),
            bonePercentage: z
              .number()
              .min(0)
              .max(100)
              .nullable()
              .optional()
              .describe("Updated bone mass percentage"),
            date: tzDateSchema
              .nullable()
              .optional()
              .describe("Updated date (timezone and dateInUsersTimezone)"),
          })
          .refine(
            (d) =>
              d.weight !== undefined ||
              d.fatPercentage !== undefined ||
              d.musclePercentage !== undefined ||
              d.bonePercentage !== undefined ||
              d.date !== undefined,
            {
              message:
                "At least one field (weight, fatPercentage, musclePercentage, bonePercentage, or date) must be provided",
            },
          )
          .describe("Fields to update"),
      },
    },
    async ({ id, data }) => {
      try {
        const result = await wrapSdkCall(
          WeightLogs.weightLogsUpdate({ body: { id, data } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- delete_weight_log --------------------------------------------------------
  server.registerTool(
    "delete_weight_log",
    {
      description: "Delete a weight log by ID.",
      inputSchema: {
        id: z
          .string()
          .min(1)
          .describe("The weight log ID to delete"),
      },
    },
    async ({ id }) => {
      try {
        const result = await wrapSdkCall(
          WeightLogs.weightLogsDelete({ body: { id } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- delete_many_weight_logs --------------------------------------------------
  server.registerTool(
    "delete_many_weight_logs",
    {
      description: "Delete multiple weight logs by their IDs.",
      inputSchema: {
        ids: z
          .array(z.string().min(1))
          .min(1)
          .describe("Array of weight log IDs to delete"),
      },
    },
    async ({ ids }) => {
      try {
        const result = await wrapSdkCall(
          WeightLogs.weightLogsDeleteMany({ body: { ids } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- get_weight_settings ------------------------------------------------------
  server.registerTool(
    "get_weight_settings",
    {
      description: "Get the user's weight unit preference (kg or lbs).",
    },
    async () => {
      try {
        const result = await wrapSdkCall(
          WeightLogs.weightLogsGetSettings(),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- update_weight_unit -------------------------------------------------------
  server.registerTool(
    "update_weight_unit",
    {
      description: "Update the user's weight unit preference.",
      inputSchema: {
        weightUnit: z
          .enum(["kg", "lbs"])
          .describe(
            "Weight unit preference: 'kg' for kilograms or 'lbs' for pounds",
          ),
      },
    },
    async ({ weightUnit }) => {
      try {
        const result = await wrapSdkCall(
          WeightLogs.weightLogsUpdateWeightUnit({ body: { weightUnit } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- get_weight_widget --------------------------------------------------------
  server.registerTool(
    "get_weight_widget",
    {
      description: "Get recent weight data points for widget charts.",
    },
    async () => {
      try {
        const result = await wrapSdkCall(
          WeightLogs.weightLogsGetWeightsForWidget(),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- get_current_weight_goal --------------------------------------------------
  server.registerTool(
    "get_current_weight_goal",
    {
      description:
        "Get the current active weight goal with start and current weight context.",
    },
    async () => {
      try {
        const result = await wrapSdkCall(
          WeightLogs.weightLogsGetCurrentActiveGoal(),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
}
