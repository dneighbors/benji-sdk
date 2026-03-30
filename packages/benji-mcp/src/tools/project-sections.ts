import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ProjectSections, wrapSdkCall } from "@dneighbors/benji-sdk";
import { toolResult, handleToolError } from "./util.js";

/**
 * Register all project section MCP tools on the given server.
 */
export function registerProjectSectionTools(server: McpServer): void {
  // -- update_project_section ---------------------------------------------------
  server.registerTool(
    "update_project_section",
    {
      description:
        "Update a project section. Provide the section ID and the new name.",
      inputSchema: {
        id: z
          .string()
          .min(1)
          .describe("The project section ID to update"),
        data: z
          .object({
            name: z
              .string()
              .min(1)
              .optional()
              .describe("New section name"),
          })
          .refine((d) => d.name !== undefined, {
            message: "At least one field (name) must be provided",
          })
          .describe("Fields to update"),
      },
    },
    async ({ id, data }) => {
      try {
        const result = await wrapSdkCall(
          ProjectSections.projectSectionsUpdate({
            path: { id },
            body: { data },
          }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- delete_project_section ---------------------------------------------------
  server.registerTool(
    "delete_project_section",
    {
      description:
        "Delete a project section. Optionally delete its todos as well.",
      inputSchema: {
        id: z
          .string()
          .min(1)
          .describe("The project section ID to delete"),
        deleteTodos: z
          .boolean()
          .optional()
          .describe(
            "If true, also delete all todos in this section. If false or omitted, todos are moved out of the section.",
          ),
      },
    },
    async ({ id, deleteTodos }) => {
      try {
        const result = await wrapSdkCall(
          ProjectSections.projectSectionsDelete({
            path: { id },
            query: { deleteTodos },
          }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
}
