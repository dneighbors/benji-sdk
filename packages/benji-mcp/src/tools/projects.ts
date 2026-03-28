import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Projects, wrapSdkCall } from "benji-sdk";
import { toolResult, handleToolError } from "./util.js";

/** Date sub-schema used by create/update project fields. */
const dateSchema = z
  .object({ timezone: z.string(), dateInUsersTimezone: z.string() })
  .nullable()
  .optional();

/** Shared project-body fields used by both create and update. */
const projectFieldsSchema = {
  description: z.string().nullable().optional(),
  emoji: z.string().nullable().optional(),
  genericStatus: z.enum(["Todo", "InProgress", "Done"]).optional()
    .describe("Project status"),
  dueDate: dateSchema,
  plannedDate: dateSchema,
  startDate: dateSchema,
  isTemplate: z.boolean().optional()
    .describe("Whether this project is a template"),
  completionType: z.enum(["Linear", "Parallel"]).nullable().optional()
    .describe("How tasks in this project are completed"),
  showInSidebar: z.boolean().optional(),
  showInOverview: z.boolean().optional(),
  points: z.number().nullable().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  taskType: z.enum(["work", "personal", "both"]).optional(),
  sip: z.boolean().optional()
    .describe("Whether this is a small, incremental project"),
  tripId: z.string().nullable().optional(),
  tagIds: z.array(z.string()).nullable().optional(),
};

/**
 * Register all 4 project MCP tools on the given server.
 */
export function registerProjectTools(server: McpServer): void {
  // ── list_projects ───────────────────────────────────────────────────
  server.registerTool(
    "list_projects",
    {
      description:
        "List all projects for the current user. Optionally filter by task type.",
      inputSchema: {
        taskType: z.enum(["personal", "work", "both"]).optional()
          .describe("Filter by personal, work, or both task types"),
      },
    },
    async ({ taskType }) => {
      try {
        const result = await wrapSdkCall(
          Projects.projectsList({ body: { taskType } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // ── create_project ──────────────────────────────────────────────────
  server.registerTool(
    "create_project",
    {
      description:
        "Create a new project. Only name is required; all other fields are optional.",
      inputSchema: {
        name: z.string().describe("The project name (required)"),
        ...projectFieldsSchema,
      },
    },
    async (args) => {
      try {
        const result = await wrapSdkCall(
          Projects.projectsCreate({ body: args as Parameters<typeof Projects.projectsCreate>[0]["body"] }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // ── update_project ──────────────────────────────────────────────────
  server.registerTool(
    "update_project",
    {
      description:
        "Update an existing project. Provide the project ID and the fields to update.",
      inputSchema: {
        id: z.string().describe("The project ID to update"),
        data: z
          .object({
            name: z.string().optional(),
            ...projectFieldsSchema,
          })
          .describe("Fields to update"),
      },
    },
    async ({ id, data }) => {
      try {
        const result = await wrapSdkCall(
          Projects.projectsUpdate({ body: { id, data } as Parameters<typeof Projects.projectsUpdate>[0]["body"] }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // ── delete_project ──────────────────────────────────────────────────
  server.registerTool(
    "delete_project",
    {
      description: "Delete a project by ID",
      inputSchema: {
        id: z.string().describe("The project ID to delete"),
      },
    },
    async ({ id }) => {
      try {
        const result = await wrapSdkCall(
          Projects.projectsDelete({ body: { id } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
}
