import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Habits, wrapSdkCall } from "@dneighbors/benji-sdk";
import { toolResult, handleToolError } from "./util.js";

/** Shared habit fields used by both create and update. */
const habitFieldsSchema = {
  emoji: z.string().nullable().optional().describe("Emoji icon for the habit"),
  timeOfDay: z
    .enum(["Morning", "Afternoon", "Evening", "Night", "Any"])
    .optional()
    .describe("Preferred time of day"),
  durationInSeconds: z
    .number()
    .nullable()
    .optional()
    .describe("Duration in seconds"),
  type: z
    .enum(["personal", "work", "both"])
    .optional()
    .describe("Habit type"),
  description: z
    .string()
    .nullable()
    .optional()
    .describe("Description of the habit"),
  privacySetting: z
    .enum(["NotSet", "Private", "Following", "Public"])
    .optional()
    .describe("Privacy setting"),
  habitListId: z
    .string()
    .nullable()
    .optional()
    .describe("ID of habit list to assign to"),
  daysOfWeek: z
    .array(
      z.enum([
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ]),
    )
    .optional()
    .describe("Days of the week for the habit"),
  customPoints: z
    .union([z.string(), z.number()])
    .nullable()
    .optional()
    .describe("Custom points for completion"),
  punshingPoints: z
    .union([z.string(), z.number()])
    .nullable()
    .optional()
    .describe("Punishing points for missing"),
};

/**
 * Register all 6 habit MCP tools on the given server.
 */
export function registerHabitTools(server: McpServer): void {
  // ── Task 3: list_habits ─────────────────────────────────────────────
  server.registerTool(
    "list_habits",
    {
      description:
        "List habits with completions for a date range. Returns habits and their completion status.",
      inputSchema: {
        dateFrom: z
          .string()
          .describe("Start date (ISO format, e.g. 2026-03-01)"),
        dateTo: z
          .string()
          .describe("End date (ISO format, e.g. 2026-03-31)"),
        habitIds: z
          .array(z.string())
          .optional()
          .describe("Optional array of habit IDs to filter by"),
      },
    },
    async ({ dateFrom, dateTo, habitIds }) => {
      try {
        const result = await wrapSdkCall(
          Habits.habitsGetHabitsAndCompletions({
            body: { dateFrom, dateTo, habitIds },
          }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // ── Task 4: create_habit ────────────────────────────────────────────
  server.registerTool(
    "create_habit",
    {
      description:
        "Create a new habit. Only name is required; all other fields are optional.",
      inputSchema: {
        name: z.string().describe("The habit name (required)"),
        ...habitFieldsSchema,
      },
    },
    async (args) => {
      try {
        const result = await wrapSdkCall(
          Habits.habitsCreate({
            body: args as Parameters<typeof Habits.habitsCreate>[0]["body"],
          }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // ── Task 5: update_habit ────────────────────────────────────────────
  server.registerTool(
    "update_habit",
    {
      description:
        "Update an existing habit. Provide the habit ID and the fields to update.",
      inputSchema: {
        id: z.string().describe("The habit ID to update"),
        data: z
          .object({
            name: z.string().optional(),
            ...habitFieldsSchema,
          })
          .describe("Fields to update"),
      },
    },
    async ({ id, data }) => {
      try {
        const result = await wrapSdkCall(
          Habits.habitsUpdate({
            body: { id, data } as Parameters<
              typeof Habits.habitsUpdate
            >[0]["body"],
          }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // ── Task 6: delete_habit ────────────────────────────────────────────
  server.registerTool(
    "delete_habit",
    {
      description: "Delete a habit by ID",
      inputSchema: {
        id: z.string().describe("The habit ID to delete"),
      },
    },
    async ({ id }) => {
      try {
        const result = await wrapSdkCall(
          Habits.habitsDelete({ body: { id } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // ── Task 7: log_habit ───────────────────────────────────────────────
  server.registerTool(
    "log_habit",
    {
      description:
        "Log a habit completion or failure for a specific day. If no date is provided, logs for today.",
      inputSchema: {
        habitId: z.string().describe("The habit ID to log"),
        date: z
          .object({
            timezone: z
              .string()
              .describe("IANA timezone, e.g. America/New_York"),
            dateInUsersTimezone: z
              .string()
              .describe("Date in user's timezone, e.g. 2026-03-27"),
          })
          .nullable()
          .optional()
          .describe("Date to log for. If omitted, logs for today."),
        completionType: z
          .enum(["Done", "Skipped", "NotCompleted"])
          .optional()
          .describe("Completion status. Defaults to Done if omitted."),
      },
    },
    async ({ habitId, date, completionType }) => {
      try {
        const result = await wrapSdkCall(
          Habits.habitsLogHabitOnDay({
            body: { habitId, date, completionType },
          }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // ── Task 8: log_many_habits ─────────────────────────────────────────
  server.registerTool(
    "log_many_habits",
    {
      description:
        "Log multiple habits for a specific day with the same completion type.",
      inputSchema: {
        habitIds: z
          .array(z.string())
          .describe("Array of habit IDs to log"),
        completionType: z
          .enum(["Done", "Skipped", "NotCompleted"])
          .describe("Completion status for all habits"),
        date: z
          .object({
            dateInUsersTimezone: z
              .string()
              .describe("Date in user's timezone, e.g. 2026-03-27"),
          })
          .optional()
          .describe("Date to log for. If omitted, logs for today."),
      },
    },
    async ({ habitIds, completionType, date }) => {
      try {
        const result = await wrapSdkCall(
          Habits.habitsLogManyHabitsOnDay({
            body: { habitIds, completionType, date },
          }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
}
