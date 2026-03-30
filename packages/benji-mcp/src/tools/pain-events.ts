import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PainEvents, wrapSdkCall } from "@dneighbors/benji-sdk";
import {
  toolResult,
  handleToolError,
  ymdDateSchema,
  tzDateSchema,
} from "./util.js";

/**
 * Register all 8 pain event MCP tools on the given server.
 */
export function registerPainEventTools(server: McpServer): void {
  // -- list_pain_events ---------------------------------------------------------
  server.registerTool(
    "list_pain_events",
    {
      description:
        "List pain events. Optionally filter by date using a year/month/day object.",
      inputSchema: {
        date: ymdDateSchema
          .optional()
          .describe("Filter by date (year, month, day)"),
      },
    },
    async ({ date }) => {
      try {
        const result = await wrapSdkCall(
          PainEvents.painEventsList({ body: { date } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- create_pain_event --------------------------------------------------------
  server.registerTool(
    "create_pain_event",
    {
      description:
        "Create a new pain event. Requires date (timezone-aware), pain level (1-10), and body part ID. Optionally add notes.",
      inputSchema: {
        date: tzDateSchema.describe(
          "When the pain event occurred (timezone and dateInUsersTimezone)",
        ),
        painLevel: z
          .number()
          .int()
          .min(1)
          .max(10)
          .describe("Pain intensity level from 1 (mild) to 10 (severe)"),
        bodyPartId: z
          .string()
          .min(1)
          .describe(
            "ID of the body part where pain occurred. Use list_body_parts to get valid IDs.",
          ),
        notes: z
          .string()
          .nullable()
          .optional()
          .describe("Additional notes about the pain event"),
      },
    },
    async ({ date, painLevel, bodyPartId, notes }) => {
      try {
        const result = await wrapSdkCall(
          PainEvents.painEventsCreate({
            body: { date, painLevel, bodyPartId, notes },
          }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- get_pain_event -----------------------------------------------------------
  server.registerTool(
    "get_pain_event",
    {
      description: "Get a single pain event by ID.",
      inputSchema: {
        id: z
          .string()
          .min(1)
          .describe("The pain event ID to retrieve"),
      },
    },
    async ({ id }) => {
      try {
        const result = await wrapSdkCall(
          PainEvents.painEventsGet({ body: { id } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- update_pain_event --------------------------------------------------------
  server.registerTool(
    "update_pain_event",
    {
      description:
        "Update an existing pain event. Provide the event ID and the fields to update.",
      inputSchema: {
        id: z
          .string()
          .min(1)
          .describe("The pain event ID to update"),
        data: z
          .object({
            date: tzDateSchema
              .optional()
              .describe("Updated date (timezone and dateInUsersTimezone)"),
            painLevel: z
              .number()
              .int()
              .min(1)
              .max(10)
              .optional()
              .describe("Updated pain level (1-10)"),
            bodyPartId: z
              .string()
              .min(1)
              .optional()
              .describe("Updated body part ID"),
            notes: z
              .string()
              .nullable()
              .optional()
              .describe("Updated notes"),
          })
          .refine(
            (d) =>
              d.date !== undefined ||
              d.painLevel !== undefined ||
              d.bodyPartId !== undefined ||
              d.notes !== undefined,
            {
              message:
                "At least one field (date, painLevel, bodyPartId, or notes) must be provided",
            },
          )
          .describe("Fields to update"),
      },
    },
    async ({ id, data }) => {
      try {
        const result = await wrapSdkCall(
          PainEvents.painEventsUpdate({ body: { id, data } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- delete_pain_event --------------------------------------------------------
  server.registerTool(
    "delete_pain_event",
    {
      description: "Delete a pain event by ID.",
      inputSchema: {
        id: z
          .string()
          .min(1)
          .describe("The pain event ID to delete"),
      },
    },
    async ({ id }) => {
      try {
        const result = await wrapSdkCall(
          PainEvents.painEventsDelete({ body: { id } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- delete_many_pain_events --------------------------------------------------
  server.registerTool(
    "delete_many_pain_events",
    {
      description: "Delete multiple pain events by their IDs.",
      inputSchema: {
        ids: z
          .array(z.string().min(1))
          .min(1)
          .describe("Array of pain event IDs to delete"),
      },
    },
    async ({ ids }) => {
      try {
        const result = await wrapSdkCall(
          PainEvents.painEventsDeleteMany({ body: { ids } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- list_body_parts ----------------------------------------------------------
  server.registerTool(
    "list_body_parts",
    {
      description: "List all available body parts for pain events.",
    },
    async () => {
      try {
        const result = await wrapSdkCall(
          PainEvents.painEventsBodyParts(),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- list_recent_body_parts ---------------------------------------------------
  server.registerTool(
    "list_recent_body_parts",
    {
      description:
        "List recently used body parts for pain events, sorted by frequency.",
    },
    async () => {
      try {
        const result = await wrapSdkCall(
          PainEvents.painEventsRecentBodyParts(),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
}
