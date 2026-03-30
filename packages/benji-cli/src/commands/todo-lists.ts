import { Command } from "commander";
import { wrapSdkCall, TodoLists } from "@dneighbors/benji-sdk";
import { ensureAuth } from "../auth.js";
import { getGlobalOptions, outputResult } from "../output.js";
import { handleCommandError } from "../error-handler.js";
import { readStdin, requireForce } from "./shared.js";

export function registerTodoListsCommand(program: Command): void {
  const cmd = program
    .command("todo-lists")
    .description("Manage todo lists");

  cmd
    .command("list")
    .description("List todo lists")
    .option("--task-type <type>", "Filter by task type (personal, work, both)")
    .addHelpText("after", `\nExamples:\n  $ benji todo-lists list\n  $ benji todo-lists list --task-type personal\n  $ benji todo-lists list --json`)
    .action(async (options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          TodoLists.todoListsList({ body: { taskType: options.taskType } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("create")
    .description("Create a todo list")
    .argument("[name]", "List name")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText("after", `\nExamples:\n  $ benji todo-lists create "Shopping"\n  $ echo '{"name":"Groceries"}' | benji todo-lists create --stdin`)
    .action(async (name, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        let body: Record<string, unknown> = {};
        if (options.stdin) {
          body = await readStdin();
        }
        if (name) body.name = name;

        const result = await wrapSdkCall(
          TodoLists.todoListsCreate({ body } as Parameters<typeof TodoLists.todoListsCreate>[0]),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("update")
    .description("Update a todo list")
    .argument("<id>", "Todo list ID")
    .option("--name <name>", "New list name")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText("after", `\nExamples:\n  $ benji todo-lists update abc123 --name "Updated List"\n  $ echo '{"name":"New Name"}' | benji todo-lists update abc123 --stdin`)
    .action(async (id, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        let data: Record<string, unknown> = {};
        if (options.stdin) {
          data = await readStdin();
        }
        if (options.name !== undefined) data.name = options.name;

        const result = await wrapSdkCall(
          TodoLists.todoListsUpdate({ body: { id, data } } as Parameters<typeof TodoLists.todoListsUpdate>[0]),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("delete")
    .description("Delete a todo list")
    .argument("<id>", "Todo list ID")
    .option("--force", "Confirm deletion")
    .addHelpText("after", `\nExamples:\n  $ benji todo-lists delete abc123 --force\n  $ benji todo-lists delete abc123 --force --json`)
    .action(async (id, options, command) => {
      requireForce(command, "todo-lists", "delete");
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          TodoLists.todoListsDelete({ body: { id } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
