import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Workouts, wrapSdkCall } from "@dneighbors/benji-sdk";
import { toolResult, handleToolError, tzDateSchema } from "./util.js";

/**
 * Register all 10 workout MCP tools on the given server.
 */
export function registerWorkoutTools(server: McpServer): void {
  // -- start_workout ------------------------------------------------------------
  server.registerTool(
    "start_workout",
    {
      description:
        "Start a new workout. Optionally specify a name for the workout.",
      inputSchema: {
        name: z
          .string()
          .nullable()
          .optional()
          .describe(
            "Name for the workout (e.g. 'Push Day', 'Morning Run')",
          ),
      },
    },
    async ({ name }) => {
      try {
        const result = await wrapSdkCall(
          Workouts.workoutsStart({ body: { name } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- end_workout --------------------------------------------------------------
  server.registerTool(
    "end_workout",
    {
      description:
        "End an in-progress workout. Provide the workout ID. Optionally specify when it ended.",
      inputSchema: {
        id: z.string().min(1).describe("The ID of the workout to end"),
        endedAt: z
          .string()
          .datetime({ message: "Must be an ISO datetime string" })
          .nullable()
          .optional()
          .describe(
            "ISO datetime string for when the workout ended. If omitted, ends now.",
          ),
      },
    },
    async ({ id, endedAt }) => {
      try {
        const result = await wrapSdkCall(
          Workouts.workoutsEnd({ body: { id, endedAt } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- get_in_progress_workout --------------------------------------------------
  server.registerTool(
    "get_in_progress_workout",
    {
      description:
        "Get the currently in-progress workout, if any. Returns the workout details or null if no workout is active.",
    },
    async () => {
      try {
        const result = await wrapSdkCall(Workouts.workoutsInProgress());
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- list_workouts ------------------------------------------------------------
  server.registerTool(
    "list_workouts",
    {
      description:
        "List workouts. Optionally filter by date range using dateFrom and dateTo (ISO date strings, e.g. 2026-03-01).",
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
          Workouts.workoutsList({ body: { dateFrom, dateTo } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- create_workout -----------------------------------------------------------
  server.registerTool(
    "create_workout",
    {
      description:
        "Create a new workout. Optionally specify name, start time, end time, and notes.",
      inputSchema: {
        name: z
          .string()
          .nullable()
          .optional()
          .describe(
            "Name for the workout (e.g. 'Push Day', 'Morning Run')",
          ),
        startedAt: tzDateSchema
          .nullable()
          .optional()
          .describe("When the workout started"),
        endedAt: tzDateSchema
          .nullable()
          .optional()
          .describe("When the workout ended"),
        notes: z
          .string()
          .nullable()
          .optional()
          .describe("Notes about the workout"),
      },
    },
    async ({ name, startedAt, endedAt, notes }) => {
      try {
        const result = await wrapSdkCall(
          Workouts.workoutsCreate({ body: { name, startedAt, endedAt, notes } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- get_workout --------------------------------------------------------------
  server.registerTool(
    "get_workout",
    {
      description: "Get a single workout by ID.",
      inputSchema: {
        id: z.string().min(1).describe("The workout ID to retrieve"),
      },
    },
    async ({ id }) => {
      try {
        const result = await wrapSdkCall(
          Workouts.workoutsGet({ path: { id } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- get_workout_with_details -------------------------------------------------
  server.registerTool(
    "get_workout_with_details",
    {
      description:
        "Get a workout with full details including exercises and sets.",
      inputSchema: {
        id: z
          .string()
          .min(1)
          .describe("The workout ID to retrieve with details"),
      },
    },
    async ({ id }) => {
      try {
        const result = await wrapSdkCall(
          Workouts.workoutsGetWithDetails({ path: { id } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- update_workout -----------------------------------------------------------
  server.registerTool(
    "update_workout",
    {
      description:
        "Update an existing workout. Provide the workout ID and the fields to update.",
      inputSchema: {
        id: z.string().min(1).describe("The workout ID to update"),
        data: z
          .object({
            name: z
              .string()
              .nullable()
              .optional()
              .describe("Name for the workout"),
            startedAt: tzDateSchema
              .nullable()
              .optional()
              .describe("Start time of the workout"),
            endedAt: tzDateSchema
              .nullable()
              .optional()
              .describe("End time of the workout"),
            notes: z
              .string()
              .nullable()
              .optional()
              .describe("Notes about the workout"),
          })
          .refine(
            (d) =>
              d.name !== undefined ||
              d.startedAt !== undefined ||
              d.endedAt !== undefined ||
              d.notes !== undefined,
            {
              message:
                "At least one field (name, startedAt, endedAt, or notes) must be provided",
            },
          )
          .describe("Fields to update"),
      },
    },
    async ({ id, data }) => {
      try {
        const result = await wrapSdkCall(
          Workouts.workoutsUpdate({ path: { id }, body: { data } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- delete_workout -----------------------------------------------------------
  server.registerTool(
    "delete_workout",
    {
      description: "Delete a workout by ID.",
      inputSchema: {
        id: z.string().min(1).describe("The workout ID to delete"),
      },
    },
    async ({ id }) => {
      try {
        const result = await wrapSdkCall(
          Workouts.workoutsDelete({ path: { id } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- duplicate_workout --------------------------------------------------------
  server.registerTool(
    "duplicate_workout",
    {
      description:
        "Duplicate an existing workout. Creates a copy of the workout with a new ID.",
      inputSchema: {
        id: z.string().min(1).describe("The workout ID to duplicate"),
      },
    },
    async ({ id }) => {
      try {
        const result = await wrapSdkCall(
          Workouts.workoutsDuplicate({ path: { id } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
}
