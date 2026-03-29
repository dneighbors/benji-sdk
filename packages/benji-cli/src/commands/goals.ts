import { Command } from "commander";
import { wrapSdkCall, Goals } from "benji-sdk";
import { ensureAuth } from "../auth.js";
import { getGlobalOptions, outputResult } from "../output.js";
import { handleCommandError } from "../error-handler.js";
import { readStdin, requireForce, toTzDate } from "./shared.js";

// TODO(future-story): Missing MCP subcommands to add:
// - delete-many (goalsDeleteMany) — bulk delete goals
// - public-list (goalsPublicList) — list public goals by username
export function registerGoalsCommand(program: Command): void {
  const cmd = program
    .command("goals")
    .description("Manage goals");

  cmd
    .command("list")
    .description("List all goals")
    .addHelpText("after", `\nExamples:\n  $ benji goals list\n  $ benji goals list --json`)
    .action(async (options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(Goals.goalsList());
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("create")
    .description("Create a goal")
    .argument("[name]", "Goal name")
    .option("--due-date <date>", "Due date (YYYY-MM-DD)")
    .option("--emoji <emoji>", "Emoji icon")
    .option("--public", "Make goal publicly visible")
    .option("--done", "Mark as completed")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText("after", `\nExamples:\n  $ benji goals create "Run a marathon"\n  $ benji goals create "Learn piano" --emoji "🎹" --due-date 2026-12-31\n  $ echo '{"name":"Write a book","emoji":"📚"}' | benji goals create --stdin`)
    .action(async (name, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        let body: Record<string, unknown> = {};
        if (options.stdin) {
          body = await readStdin();
        }
        if (name) body.name = name;
        if (options.dueDate !== undefined) body.dueDate = toTzDate(options.dueDate, "due-date");
        if (options.emoji !== undefined) body.emoji = options.emoji;
        if (options.public) body.public = true;
        if (options.done) body.done = true;

        const result = await wrapSdkCall(
          Goals.goalsCreate({ body } as Parameters<typeof Goals.goalsCreate>[0]),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("get")
    .description("Get a goal by ID")
    .argument("<id>", "Goal ID")
    .addHelpText("after", `\nExamples:\n  $ benji goals get abc123\n  $ benji goals get abc123 --json`)
    .action(async (id, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          Goals.goalsGet({ path: { id } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("update")
    .description("Update a goal")
    .argument("<id>", "Goal ID")
    .option("--name <name>", "Goal name")
    .option("--due-date <date>", "Due date (YYYY-MM-DD)")
    .option("--emoji <emoji>", "Emoji icon")
    .option("--public", "Make publicly visible")
    .option("--no-public", "Make private")
    .option("--done", "Mark as completed")
    .option("--no-done", "Mark as incomplete")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText("after", `\nExamples:\n  $ benji goals update abc123 --name "Updated goal"\n  $ benji goals update abc123 --done\n  $ benji goals update abc123 --no-public\n  $ echo '{"name":"New name"}' | benji goals update abc123 --stdin`)
    .action(async (id, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        let data: Record<string, unknown> = {};
        if (options.stdin) {
          data = await readStdin();
        }
        if (options.name !== undefined) data.name = options.name;
        if (options.dueDate !== undefined) data.dueDate = toTzDate(options.dueDate, "due-date");
        if (options.emoji !== undefined) data.emoji = options.emoji;
        if (command.getOptionValueSource("public") === "cli") data.public = options.public;
        if (command.getOptionValueSource("done") === "cli") data.done = options.done;

        const result = await wrapSdkCall(
          Goals.goalsUpdate({ path: { id }, body: { data } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("delete")
    .description("Delete a goal")
    .argument("<id>", "Goal ID")
    .option("--force", "Confirm deletion")
    .addHelpText("after", `\nExamples:\n  $ benji goals delete abc123 --force\n  $ benji goals delete abc123 --force --json`)
    .action(async (id, options, command) => {
      requireForce(command, "goals", "delete");
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          Goals.goalsDelete({ path: { id } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
