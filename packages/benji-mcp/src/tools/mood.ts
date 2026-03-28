import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Mood, wrapSdkCall } from "benji-sdk";
import { toolResult, handleToolError } from "./util.js";

/**
 * Register all 4 mood MCP tools on the given server.
 */
export function registerMoodTools(server: McpServer): void {
  // -- Task 3: list_mood --------------------------------------------------
  server.registerTool(
    "list_mood",
    {
      description:
        "List mood logs. Optionally filter by date (year, month, day).",
      inputSchema: {
        date: z
          .object({
            year: z.number().describe("Year (e.g. 2026)"),
            month: z.number().describe("Month (1-12)"),
            day: z.number().describe("Day of month (1-31)"),
          })
          .optional()
          .describe("Filter mood logs by date"),
      },
    },
    async ({ date }) => {
      try {
        const result = await wrapSdkCall(
          Mood.moodList({ body: { date } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- Task 4: create_mood ------------------------------------------------
  server.registerTool(
    "create_mood",
    {
      description:
        "Create a new mood log. Mood is required (1=awful, 2=bad, 3=meh, 4=good, 5=rad).",
      inputSchema: {
        mood: z
          .number()
          .describe("Mood value: 1=awful, 2=bad, 3=meh, 4=good, 5=rad"),
        note: z
          .string()
          .nullable()
          .optional()
          .describe("Optional note about your mood"),
        date: z
          .object({
            timezone: z
              .string()
              .describe("IANA timezone, e.g. America/New_York"),
            dateInUsersTimezone: z
              .string()
              .describe(
                "ISO date string in user's timezone, e.g. 2026-03-27",
              ),
          })
          .nullable()
          .optional()
          .describe("Date of the mood log"),
      },
    },
    async ({ mood, note, date }) => {
      try {
        const result = await wrapSdkCall(
          Mood.moodCreate({ body: { mood, note, date } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- Task 5: update_mood ------------------------------------------------
  server.registerTool(
    "update_mood",
    {
      description:
        "Update an existing mood log. Provide the mood ID and the fields to update.",
      inputSchema: {
        id: z.string().describe("The mood log ID to update"),
        data: z
          .object({
            mood: z
              .number()
              .optional()
              .describe(
                "Mood value: 1=awful, 2=bad, 3=meh, 4=good, 5=rad",
              ),
            note: z
              .string()
              .nullable()
              .optional()
              .describe("Note about your mood"),
            date: z
              .object({
                timezone: z
                  .string()
                  .describe("IANA timezone, e.g. America/New_York"),
                dateInUsersTimezone: z
                  .string()
                  .describe("ISO date string in user's timezone"),
              })
              .nullable()
              .optional()
              .describe("Date of the mood log"),
          })
          .describe("Fields to update"),
      },
    },
    async ({ id, data }) => {
      try {
        const result = await wrapSdkCall(
          Mood.moodUpdate({
            body: { id, data } as Parameters<
              typeof Mood.moodUpdate
            >[0]["body"],
          }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- Task 6: delete_mood ------------------------------------------------
  server.registerTool(
    "delete_mood",
    {
      description: "Delete a mood log by ID",
      inputSchema: {
        id: z.string().describe("The mood log ID to delete"),
      },
    },
    async ({ id }) => {
      try {
        const result = await wrapSdkCall(
          Mood.moodDelete({ body: { id } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
}
