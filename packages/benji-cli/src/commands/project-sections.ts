import { Command } from "commander";
import { wrapSdkCall, ProjectSections } from "benji-sdk";
import { ensureAuth } from "../auth.js";
import { getGlobalOptions, outputResult } from "../output.js";
import { handleCommandError } from "../error-handler.js";
import { readStdin, requireForce } from "./shared.js";

export function registerProjectSectionsCommand(program: Command): void {
  const cmd = program
    .command("project-sections")
    .description("Manage project sections");

  cmd
    .command("update")
    .description("Update a project section")
    .argument("<id>", "Project section ID")
    .option("--name <name>", "New section name")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText("after", `\nExamples:\n  $ benji project-sections update abc123 --name "In Progress"\n  $ echo '{"name":"Done"}' | benji project-sections update abc123 --stdin`)
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
          ProjectSections.projectSectionsUpdate({ path: { id }, body: { data } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("delete")
    .description("Delete a project section")
    .argument("<id>", "Project section ID")
    .option("--force", "Confirm deletion")
    .option("--delete-todos", "Also delete todos in this section")
    .addHelpText("after", `\nExamples:\n  $ benji project-sections delete abc123 --force\n  $ benji project-sections delete abc123 --force --delete-todos`)
    .action(async (id, options, command) => {
      requireForce(command, "project-sections", "delete");
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          ProjectSections.projectSectionsDelete({
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
