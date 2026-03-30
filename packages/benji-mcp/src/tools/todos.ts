import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Todos, wrapSdkCall } from "@dneighbors/benji-sdk";
import { toolResult, handleToolError } from "./util.js";

/** Date sub-schema used by create/update todo fields. */
const dateSchema = z
  .object({ timezone: z.string(), dateInUsersTimezone: z.string() })
  .nullable()
  .optional();

/** Shared todo-body fields used by both create and update. */
const todoFieldsSchema = {
  description: z.string().nullable().optional(),
  emoji: z.string().nullable().optional(),
  dueDate: dateSchema,
  plannedDate: dateSchema,
  startDate: dateSchema,
  priority: z.enum(["low", "medium", "high"]).optional(),
  taskType: z.enum(["work", "personal", "both"]).optional(),
  recurring: z.boolean().optional(),
  recurringInterval: z.number().nullable().optional(),
  recurringIntervalUnit: z
    .enum(["day", "week", "month", "year"])
    .nullable()
    .optional(),
  recurringCompletionType: z
    .enum(["FromCompletion", "FromDueDate"])
    .nullable()
    .optional()
    .describe("Whether next recurrence is based on completion date or due date"),
  annoyingLevel: z
    .enum([
      "fewTimesPerDay",
      "everyDay",
      "everyWeek",
      "everyMonth",
      "notAnnoying",
    ])
    .optional()
    .describe("How frequently Benji reminds you about this todo"),
  mandatory: z.boolean().optional(),
  private: z.boolean().optional(),
  pinned: z.boolean().optional(),
  waiting: z.boolean().optional(),
  waitingReason: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  link: z.string().nullable().optional(),
  durationInSeconds: z.number().nullable().optional(),
  timeOfDay: z
    .enum(["Morning", "Afternoon", "Evening", "Night", "Any"])
    .nullable()
    .optional(),
  timeBlockId: z.string().nullable().optional().describe("ID of a time block to assign this todo to"),
  completed: z.boolean().optional(),
  isInInbox: z.boolean().nullable().optional().describe("Whether this todo appears in the inbox"),
  tagIds: z.array(z.string()).optional(),
  listId: z.string().nullable().optional(),
  listSectionId: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
  projectSectionId: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
};

/**
 * Register all 8 todo MCP tools on the given server.
 */
export function registerTodoTools(server: McpServer): void {
  // ── Task 3: list_todos ──────────────────────────────────────────────
  server.registerTool(
    "list_todos",
    {
      description:
        "List todos with optional filters. Use screen param to get today's todos, overview, or inbox.",
      inputSchema: {
        screen: z.enum(["today", "overview", "inbox"]).optional(),
        date: z
          .string()
          .optional()
          .describe("ISO date string, e.g. 2026-03-27. Only string format supported."),
        search: z
          .string()
          .optional()
          .describe("Search query to filter todos by title"),
        taskType: z.enum(["personal", "work", "both"]).optional(),
        showCompleted: z.boolean().optional(),
        onlyMandatory: z.boolean().optional(),
        timeOfDay: z
          .enum(["Any", "Auto", "Morning", "Afternoon", "Evening", "Night"])
          .optional(),
      },
    },
    async ({
      screen,
      date,
      search,
      taskType,
      showCompleted,
      onlyMandatory,
      timeOfDay,
    }) => {
      try {
        const filters: Record<string, unknown> = {};
        if (taskType !== undefined) filters.taskType = taskType;
        if (showCompleted !== undefined) filters.showCompleted = showCompleted;
        if (onlyMandatory !== undefined) filters.onlyMandatory = onlyMandatory;
        if (timeOfDay !== undefined) filters.timeOfDay = timeOfDay;

        const body: Record<string, unknown> = {};
        if (screen !== undefined) body.screen = screen;
        if (date !== undefined) body.date = date;
        if (search !== undefined) body.search = search;
        if (Object.keys(filters).length > 0) body.filters = filters;

        const result = await wrapSdkCall(
          Todos.todosList({ body } as Parameters<typeof Todos.todosList>[0]),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // ── Task 4: list_todos_by_tag ───────────────────────────────────────
  server.registerTool(
    "list_todos_by_tag",
    {
      description: "List todos filtered by tag ID",
      inputSchema: {
        tagId: z.string().describe("The tag ID to filter by"),
        taskType: z.enum(["personal", "work", "both"]).optional(),
      },
    },
    async ({ tagId, taskType }) => {
      try {
        const result = await wrapSdkCall(
          Todos.todosByTag({ body: { tagId, taskType } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // ── Task 5: list_todos_by_project ───────────────────────────────────
  server.registerTool(
    "list_todos_by_project",
    {
      description: "List todos filtered by project ID",
      inputSchema: {
        projectId: z.string().describe("The project ID to filter by"),
        taskType: z.enum(["personal", "work", "both"]).optional(),
      },
    },
    async ({ projectId, taskType }) => {
      try {
        const result = await wrapSdkCall(
          Todos.todosByProject({ body: { projectId, taskType } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // ── Task 6: list_todos_by_list ──────────────────────────────────────
  server.registerTool(
    "list_todos_by_list",
    {
      description: "List todos filtered by todo list ID",
      inputSchema: {
        listId: z.string().describe("The todo list ID to filter by"),
        taskType: z.enum(["personal", "work", "both"]).optional(),
      },
    },
    async ({ listId, taskType }) => {
      try {
        const result = await wrapSdkCall(
          Todos.todosByList({ body: { listId, taskType } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // ── Task 7: create_todo ─────────────────────────────────────────────
  server.registerTool(
    "create_todo",
    {
      description:
        "Create a new todo. Only title is required; all other fields are optional.",
      inputSchema: {
        title: z.string().describe("The todo title (required)"),
        ...todoFieldsSchema,
      },
    },
    async (args) => {
      try {
        const result = await wrapSdkCall(
          Todos.todosCreate({ body: args as Parameters<typeof Todos.todosCreate>[0]["body"] }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // ── Task 8: update_todo ─────────────────────────────────────────────
  server.registerTool(
    "update_todo",
    {
      description:
        "Update an existing todo. Provide the todo ID and the fields to update.",
      inputSchema: {
        id: z.string().describe("The todo ID to update"),
        data: z
          .object({
            title: z.string().optional(),
            ...todoFieldsSchema,
          })
          .describe("Fields to update"),
      },
    },
    async ({ id, data }) => {
      try {
        const result = await wrapSdkCall(
          Todos.todosUpdate({ body: { id, data } as Parameters<typeof Todos.todosUpdate>[0]["body"] }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // ── Task 9: toggle_todo ─────────────────────────────────────────────
  server.registerTool(
    "toggle_todo",
    {
      description: "Toggle the completion status of a todo",
      inputSchema: {
        id: z.string().describe("The todo ID to toggle"),
      },
    },
    async ({ id }) => {
      try {
        const result = await wrapSdkCall(
          Todos.todosToggle({ body: { id } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // ── Task 10: delete_todo ────────────────────────────────────────────
  server.registerTool(
    "delete_todo",
    {
      description: "Delete a todo by ID",
      inputSchema: {
        id: z.string().describe("The todo ID to delete"),
      },
    },
    async ({ id }) => {
      try {
        const result = await wrapSdkCall(
          Todos.todosDelete({ body: { id } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
}
