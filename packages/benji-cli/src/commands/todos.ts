import { Command } from "commander";
import { wrapSdkCall, Todos } from "benji-sdk";
import { ensureAuth } from "../auth.js";
import { getGlobalOptions, outputResult } from "../output.js";
import { handleCommandError } from "../error-handler.js";
import { readStdin, requireForce, parseCommaSeparated, toTzDate } from "./shared.js";

export function registerTodosCommand(program: Command): void {
  const cmd = program
    .command("todos")
    .description("Manage todos");

  cmd
    .command("list")
    .description("List todos")
    .option("--screen <screen>", "Screen filter (today, overview, inbox)")
    .option("--date <date>", "Filter by date (YYYY-MM-DD)")
    .option("--search <query>", "Search todos by text")
    .option("--show-completed", "Include completed todos")
    .option("--task-type <type>", "Filter by task type (personal, work, both)")
    .option("--only-mandatory", "Show only mandatory todos")
    .option("--time-of-day <time>", "Filter by time of day (Any, Auto, Morning, Afternoon, Evening, Night)")
    .addHelpText("after", `\nExamples:\n  $ benji todos list\n  $ benji todos list --screen today\n  $ benji todos list --search "groceries" --json\n  $ benji todos list --show-completed --task-type personal\n  $ benji todos list --only-mandatory --time-of-day Morning`)
    .action(async (options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const filters: Record<string, unknown> = {};
        if (options.showCompleted) filters.showCompleted = true;
        if (options.taskType !== undefined) filters.taskType = options.taskType;
        if (options.onlyMandatory) filters.onlyMandatory = true;
        if (options.timeOfDay !== undefined) filters.timeOfDay = options.timeOfDay;

        const body: Record<string, unknown> = {};
        if (options.screen !== undefined) body.screen = options.screen;
        if (options.date !== undefined) body.date = options.date;
        if (options.search !== undefined) body.search = options.search;
        if (Object.keys(filters).length > 0) body.filters = filters;

        const result = await wrapSdkCall(
          Todos.todosList({ body } as Parameters<typeof Todos.todosList>[0]),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("by-tag")
    .description("List todos by tag")
    .argument("<tag-id>", "Tag ID")
    .option("--task-type <type>", "Filter by task type (personal, work, both)")
    .addHelpText("after", `\nExamples:\n  $ benji todos by-tag abc123\n  $ benji todos by-tag abc123 --task-type work --json`)
    .action(async (tagId, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          Todos.todosByTag({ body: { tagId, taskType: options.taskType } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("by-project")
    .description("List todos by project")
    .argument("<project-id>", "Project ID")
    .option("--task-type <type>", "Filter by task type (personal, work, both)")
    .addHelpText("after", `\nExamples:\n  $ benji todos by-project abc123\n  $ benji todos by-project abc123 --task-type personal --json`)
    .action(async (projectId, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          Todos.todosByProject({ body: { projectId, taskType: options.taskType } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("by-list")
    .description("List todos by todo list")
    .argument("<list-id>", "Todo list ID")
    .option("--task-type <type>", "Filter by task type (personal, work, both)")
    .addHelpText("after", `\nExamples:\n  $ benji todos by-list abc123\n  $ benji todos by-list abc123 --task-type work --json`)
    .action(async (listId, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          Todos.todosByList({ body: { listId, taskType: options.taskType } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("create")
    .description("Create a todo")
    .argument("[title]", "Title of the todo")
    .option("--priority <level>", "Priority level (low, medium, high)")
    .option("--due-date <date>", "Due date (YYYY-MM-DD)")
    .option("--project-id <id>", "Project ID to assign")
    .option("--tag-ids <ids>", "Comma-separated tag IDs")
    .option("--list-id <id>", "Todo list ID to assign")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText("after", `\nExamples:\n  $ benji todos create "Buy groceries"\n  $ benji todos create "Ship feature" --priority high --due-date 2026-12-31\n  $ benji todos create "Call dentist" --project-id abc123 --json\n  $ echo '{"title":"Test","priority":"high"}' | benji todos create --stdin`)
    .action(async (title, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        let body: Record<string, unknown> = {};
        if (options.stdin) {
          body = await readStdin();
        }
        if (title) body.title = title;
        if (options.priority !== undefined) body.priority = options.priority;
        if (options.dueDate !== undefined) body.dueDate = toTzDate(options.dueDate);
        if (options.projectId !== undefined) body.projectId = options.projectId;
        if (options.tagIds !== undefined) body.tagIds = parseCommaSeparated(options.tagIds);
        if (options.listId !== undefined) body.listId = options.listId;

        const result = await wrapSdkCall(
          Todos.todosCreate({ body } as Parameters<typeof Todos.todosCreate>[0]),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("update")
    .description("Update a todo")
    .argument("<id>", "Todo ID")
    .option("--title <title>", "New title")
    .option("--priority <level>", "Priority level (low, medium, high)")
    .option("--due-date <date>", "Due date (YYYY-MM-DD)")
    .option("--project-id <id>", "Project ID")
    .option("--tag-ids <ids>", "Comma-separated tag IDs")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText("after", `\nExamples:\n  $ benji todos update abc123 --title "Updated title"\n  $ benji todos update abc123 --priority high --due-date 2026-12-31\n  $ echo '{"title":"Updated"}' | benji todos update abc123 --stdin`)
    .action(async (id, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        let data: Record<string, unknown> = {};
        if (options.stdin) {
          data = await readStdin();
        }
        if (options.title !== undefined) data.title = options.title;
        if (options.priority !== undefined) data.priority = options.priority;
        if (options.dueDate !== undefined) data.dueDate = toTzDate(options.dueDate);
        if (options.projectId !== undefined) data.projectId = options.projectId;
        if (options.tagIds !== undefined) data.tagIds = parseCommaSeparated(options.tagIds);

        const result = await wrapSdkCall(
          Todos.todosUpdate({ body: { id, data } } as Parameters<typeof Todos.todosUpdate>[0]),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("toggle")
    .description("Toggle todo completion")
    .argument("<id>", "Todo ID")
    .addHelpText("after", `\nExamples:\n  $ benji todos toggle abc123\n  $ benji todos toggle abc123 --json`)
    .action(async (id, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          Todos.todosToggle({ body: { id } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("delete")
    .description("Delete a todo")
    .argument("<id>", "Todo ID")
    .option("--force", "Confirm deletion")
    .addHelpText("after", `\nExamples:\n  $ benji todos delete abc123 --force\n  $ benji todos delete abc123 --force --json`)
    .action(async (id, options, command) => {
      requireForce(command, "todos", "delete");
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          Todos.todosDelete({ body: { id } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
