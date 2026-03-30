import { Command } from "commander";
import { wrapSdkCall, TodoListSections } from "@dneighbors/benji-sdk";
import { ensureAuth } from "../auth.js";
import { getGlobalOptions, outputResult } from "../output.js";
import { handleCommandError } from "../error-handler.js";
import { readStdin, requireForce } from "./shared.js";

export function registerTodoListSectionsCommand(program: Command): void {
  const cmd = program
    .command("todo-list-sections")
    .description("Manage todo list sections");

  cmd
    .command("update")
    .description("Update a todo list section")
    .argument("<id>", "Todo list section ID")
    .option("--name <name>", "New section name")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText("after", `\nExamples:\n  $ benji todo-list-sections update abc123 --name "Priority"\n  $ echo '{"name":"Backlog"}' | benji todo-list-sections update abc123 --stdin`)
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
          TodoListSections.todoListSectionsUpdate({ path: { id }, body: { data } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("delete")
    .description("Delete a todo list section")
    .argument("<id>", "Todo list section ID")
    .option("--force", "Confirm deletion")
    .option("--delete-todos", "Also delete todos in this section")
    .addHelpText("after", `\nExamples:\n  $ benji todo-list-sections delete abc123 --force\n  $ benji todo-list-sections delete abc123 --force --delete-todos`)
    .action(async (id, options, command) => {
      requireForce(command, "todo-list-sections", "delete");
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          TodoListSections.todoListSectionsDelete({
            path: { id },
            query: { deleteTodos: options.deleteTodos },
          }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
