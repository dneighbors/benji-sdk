import { Command } from "commander";
import { ensureAuth } from "../auth.js";

export function registerTodosCommand(program: Command): void {
  const todos = program
    .command("todos")
    .description("Manage todos")
    .addHelpText(
      "after",
      `
Examples:
  $ benji todos list
  $ benji todos list --screen today --json
  $ benji todos create "Buy groceries"
  $ benji todos toggle <id>
  $ benji todos delete <id> --force`
    );

  todos
    .command("list")
    .description("List todos")
    .option("--screen <screen>", "Screen filter (today, upcoming, etc.)")
    .option("--search <query>", "Search todos by text")
    .option("--show-completed", "Include completed todos")
    .option("--task-type <type>", "Filter by task type")
    .addHelpText(
      "after",
      `
Examples:
  $ benji todos list
  $ benji todos list --screen today
  $ benji todos list --search "groceries" --json
  $ benji todos list --show-completed --task-type task`
    )
    .action(() => {
      ensureAuth();
      console.error("Not yet implemented. Coming in Story 6.2.");
      process.exit(2);
    });

  todos
    .command("create")
    .description("Create a todo")
    .argument("<title>", "Title of the todo")
    .option("--priority <level>", "Priority level (0-3)")
    .option("--due-date <date>", "Due date (YYYY-MM-DD)")
    .option("--project-id <id>", "Project ID to assign")
    .option("--tag-ids <ids>", "Comma-separated tag IDs")
    .addHelpText(
      "after",
      `
Examples:
  $ benji todos create "Buy groceries"
  $ benji todos create "Ship feature" --priority 3 --due-date 2026-12-31
  $ benji todos create "Call dentist" --project-id abc123 --json`
    )
    .action(() => {
      ensureAuth();
      console.error("Not yet implemented. Coming in Story 6.2.");
      process.exit(2);
    });

  todos
    .command("update")
    .description("Update a todo")
    .argument("<id>", "Todo ID")
    .addHelpText(
      "after",
      `
Examples:
  $ benji todos update <id>`
    )
    .action(() => {
      ensureAuth();
      console.error("Not yet implemented. Coming in Story 6.2.");
      process.exit(2);
    });

  todos
    .command("toggle")
    .description("Toggle todo completion")
    .argument("<id>", "Todo ID")
    .addHelpText(
      "after",
      `
Examples:
  $ benji todos toggle <id>
  $ benji todos toggle abc123 --json`
    )
    .action(() => {
      ensureAuth();
      console.error("Not yet implemented. Coming in Story 6.2.");
      process.exit(2);
    });

  todos
    .command("delete")
    .description("Delete a todo")
    .argument("<id>", "Todo ID")
    .option("--force", "Skip confirmation (required for non-interactive use)")
    .addHelpText(
      "after",
      `
Examples:
  $ benji todos delete <id> --force
  $ benji todos delete abc123 --force --json`
    )
    .action(() => {
      ensureAuth();
      console.error("Not yet implemented. Coming in Story 6.2.");
      process.exit(2);
    });

  todos
    .command("by-tag")
    .description("List todos by tag")
    .argument("<tag-id>", "Tag ID")
    .addHelpText(
      "after",
      `
Examples:
  $ benji todos by-tag <tag-id>
  $ benji todos by-tag abc123 --json`
    )
    .action(() => {
      ensureAuth();
      console.error("Not yet implemented. Coming in Story 6.2.");
      process.exit(2);
    });

  todos
    .command("by-project")
    .description("List todos by project")
    .argument("<project-id>", "Project ID")
    .addHelpText(
      "after",
      `
Examples:
  $ benji todos by-project <project-id>
  $ benji todos by-project abc123 --json`
    )
    .action(() => {
      ensureAuth();
      console.error("Not yet implemented. Coming in Story 6.2.");
      process.exit(2);
    });

  todos
    .command("by-list")
    .description("List todos by todo list")
    .argument("<list-id>", "Todo list ID")
    .addHelpText(
      "after",
      `
Examples:
  $ benji todos by-list <list-id>
  $ benji todos by-list abc123 --json`
    )
    .action(() => {
      ensureAuth();
      console.error("Not yet implemented. Coming in Story 6.2.");
      process.exit(2);
    });
}
