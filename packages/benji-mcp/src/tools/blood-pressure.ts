import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { BloodPressureLogs, wrapSdkCall } from "@dneighbors/benji-sdk";
import { toolResult, handleToolError, tzDateSchema } from "./util.js";

/**
 * Register all 5 blood pressure MCP tools on the given server.
 */
export function registerBloodPressureTools(server: McpServer): void {
  // -- list_blood_pressure_logs -------------------------------------------------
  server.registerTool(
    "list_blood_pressure_logs",
    {
      description:
        "List blood pressure logs for the current user. Optionally filter by date range using ISO date strings (YYYY-MM-DD).",
      inputSchema: {
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
    async ({ dateFrom, dateTo }) => {
      try {
        const result = await wrapSdkCall(
          BloodPressureLogs.bloodPressureLogsList({
            body: { dateFrom, dateTo },
          }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- create_blood_pressure_log ------------------------------------------------
  server.registerTool(
    "create_blood_pressure_log",
    {
      description:
        "Create a new blood pressure log entry. Requires systolic and diastolic values. Optionally include a note and date.",
      inputSchema: {
        systolic: z
          .number()
          .positive()
          .describe("Systolic blood pressure value (mmHg)"),
        diastolic: z
          .number()
          .positive()
          .describe("Diastolic blood pressure value (mmHg)"),
        note: z
          .string()
          .nullable()
          .optional()
          .describe("Optional note about the reading"),
        date: tzDateSchema
          .nullable()
          .optional()
          .describe(
            "When the reading was taken (timezone and dateInUsersTimezone). Defaults to now if omitted.",
          ),
      },
    },
    async ({ systolic, diastolic, note, date }) => {
      try {
        const result = await wrapSdkCall(
          BloodPressureLogs.bloodPressureLogsCreate({
            body: { systolic, diastolic, note, date },
          }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- get_blood_pressure_log ---------------------------------------------------
  server.registerTool(
    "get_blood_pressure_log",
    {
      description: "Get a single blood pressure log by ID.",
      inputSchema: {
        id: z
          .string()
          .min(1)
          .describe("The blood pressure log ID to retrieve"),
      },
    },
    async ({ id }) => {
      try {
        const result = await wrapSdkCall(
          BloodPressureLogs.bloodPressureLogsGet({ body: { id } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- update_blood_pressure_log ------------------------------------------------
  server.registerTool(
    "update_blood_pressure_log",
    {
      description:
        "Update an existing blood pressure log. Provide the log ID and the fields to update.",
      inputSchema: {
        id: z
          .string()
          .min(1)
          .describe("The blood pressure log ID to update"),
        data: z
          .object({
            systolic: z
              .number()
              .positive()
              .optional()
              .describe("Updated systolic value (mmHg)"),
            diastolic: z
              .number()
              .positive()
              .optional()
              .describe("Updated diastolic value (mmHg)"),
            note: z
              .string()
              .nullable()
              .optional()
              .describe("Updated note"),
            date: tzDateSchema
              .nullable()
              .optional()
              .describe("Updated date"),
          })
          .refine(
            (d) =>
              d.systolic !== undefined ||
              d.diastolic !== undefined ||
              d.note !== undefined ||
              d.date !== undefined,
            {
              message:
                "At least one field (systolic, diastolic, note, or date) must be provided",
            },
          )
          .describe("Fields to update"),
      },
    },
    async ({ id, data }) => {
      try {
        const result = await wrapSdkCall(
          BloodPressureLogs.bloodPressureLogsUpdate({ body: { id, data } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- delete_blood_pressure_log ------------------------------------------------
  server.registerTool(
    "delete_blood_pressure_log",
    {
      description: "Delete a blood pressure log by ID.",
      inputSchema: {
        id: z
          .string()
          .min(1)
          .describe("The blood pressure log ID to delete"),
      },
    },
    async ({ id }) => {
      try {
        const result = await wrapSdkCall(
          BloodPressureLogs.bloodPressureLogsDelete({ body: { id } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
}
