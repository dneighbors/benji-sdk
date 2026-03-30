import { Command } from "commander";
import { wrapSdkCall, TodoViews } from "@dneighbors/benji-sdk";
import { ensureAuth } from "../auth.js";
import { getGlobalOptions, outputResult } from "../output.js";
import { handleCommandError } from "../error-handler.js";
import { parseNumber } from "./shared.js";

export function registerTodoViewsCommand(program: Command): void {
  const cmd = program
    .command("todo-views")
    .description("Manage todo views");

  cmd
    .command("done")
    .description("List completed todos")
    .option("--task-type <type>", "Filter by task type (personal, work, both)")
    .addHelpText("after", `\nExamples:\n  $ benji todo-views done\n  $ benji todo-views done --task-type work\n  $ benji todo-views done --json`)
    .action(async (options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          TodoViews.todoViewsDone({ body: { taskType: options.taskType } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("paused")
    .description("List paused todos")
    .option("--task-type <type>", "Filter by task type (personal, work, both)")
    .addHelpText("after", `\nExamples:\n  $ benji todo-views paused\n  $ benji todo-views paused --task-type personal\n  $ benji todo-views paused --json`)
    .action(async (options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          TodoViews.todoViewsPaused({ body: { taskType: options.taskType } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("recurring")
    .description("List recurring todos")
    .option("--task-type <type>", "Filter by task type (personal, work, both)")
    .addHelpText("after", `\nExamples:\n  $ benji todo-views recurring\n  $ benji todo-views recurring --task-type work\n  $ benji todo-views recurring --json`)
    .action(async (options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          TodoViews.todoViewsRecurring({ body: { taskType: options.taskType } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("shared")
    .description("Get sharing details for a todo list")
    .requiredOption("--list-id <id>", "Todo list ID")
    .addHelpText("after", `\nExamples:\n  $ benji todo-views shared --list-id abc123\n  $ benji todo-views shared --list-id abc123 --json`)
    .action(async (options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          TodoViews.todoViewsSharing({ body: { listId: options.listId } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("trash")
    .description("List trashed todos")
    .option("--skip <n>", "Number of items to skip")
    .option("--take <n>", "Number of items to return")
    .addHelpText("after", `\nExamples:\n  $ benji todo-views trash\n  $ benji todo-views trash --skip 0 --take 20\n  $ benji todo-views trash --json`)
    .action(async (options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const body: Record<string, unknown> = {};
        if (options.skip !== undefined) body.skip = parseNumber(options.skip, "skip");
        if (options.take !== undefined) body.take = parseNumber(options.take, "take");

        const result = await wrapSdkCall(
          TodoViews.todoViewsTrash({ body } as Parameters<typeof TodoViews.todoViewsTrash>[0]),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
