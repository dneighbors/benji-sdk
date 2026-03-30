import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Tags, wrapSdkCall } from "@dneighbors/benji-sdk";
import { toolResult, handleToolError } from "./util.js";

/**
 * Register all 4 tag MCP tools on the given server.
 */
export function registerTagTools(server: McpServer): void {
  // -- Task 3: list_tags ------------------------------------------------
  server.registerTool(
    "list_tags",
    {
      description:
        "List all tags for the current user. Optionally filter by task type.",
      inputSchema: {
        taskType: z
          .enum(["personal", "work", "both"])
          .optional()
          .describe("Filter tags by task type"),
      },
    },
    async ({ taskType }) => {
      try {
        const result = await wrapSdkCall(
          Tags.tagsList({ body: { taskType } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- Task 4: create_tag -----------------------------------------------
  server.registerTool(
    "create_tag",
    {
      description:
        "Create a new tag. Only name is required; all other fields are optional.",
      inputSchema: {
        name: z.string().describe("The tag name (required)"),
        points: z
          .number()
          .nullable()
          .optional()
          .describe("Points value for the tag"),
        emoji: z
          .string()
          .nullable()
          .optional()
          .describe("Emoji icon for the tag"),
        paused: z
          .boolean()
          .nullable()
          .optional()
          .describe("Whether the tag is paused"),
        tagGroupId: z
          .string()
          .nullable()
          .optional()
          .describe("ID of the tag group this tag belongs to"),
      },
    },
    async ({ name, points, emoji, paused, tagGroupId }) => {
      try {
        const result = await wrapSdkCall(
          Tags.tagsCreate({
            body: { name, points, emoji, paused, tagGroupId },
          }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- Task 5: update_tag -----------------------------------------------
  server.registerTool(
    "update_tag",
    {
      description:
        "Update an existing tag. Provide the tag ID and the fields to update.",
      inputSchema: {
        id: z.string().min(1).describe("The tag ID to update"),
        data: z
          .object({
            name: z.string().optional().describe("New tag name"),
            points: z
              .number()
              .nullable()
              .optional()
              .describe("Points value for the tag"),
            emoji: z
              .string()
              .nullable()
              .optional()
              .describe("Emoji icon for the tag"),
            paused: z
              .boolean()
              .nullable()
              .optional()
              .describe("Whether the tag is paused"),
            tagGroupId: z
              .string()
              .nullable()
              .optional()
              .describe("ID of the tag group"),
          })
          .refine((obj) => Object.keys(obj).length > 0, { message: "At least one field must be provided to update" })
          .describe("Fields to update"),
      },
    },
    async ({ id, data }) => {
      try {
        const result = await wrapSdkCall(
          Tags.tagsUpdate({
            body: { id, data } as Parameters<
              typeof Tags.tagsUpdate
            >[0]["body"],
          }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- Task 6: delete_tag -----------------------------------------------
  server.registerTool(
    "delete_tag",
    {
      description: "Delete a tag by ID",
      inputSchema: {
        id: z.string().min(1).describe("The tag ID to delete"),
      },
    },
    async ({ id }) => {
      try {
        const result = await wrapSdkCall(
          Tags.tagsDelete({ body: { id } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
}
