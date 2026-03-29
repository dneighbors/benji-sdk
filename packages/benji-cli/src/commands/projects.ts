import { Command } from "commander";
import { wrapSdkCall, Projects } from "benji-sdk";
import { ensureAuth } from "../auth.js";
import { getGlobalOptions, outputResult } from "../output.js";
import { handleCommandError } from "../error-handler.js";
import { readStdin, requireForce } from "./shared.js";

export function registerProjectsCommand(program: Command): void {
  const cmd = program
    .command("projects")
    .description("Manage projects");

  cmd
    .command("list")
    .description("List projects")
    .option("--task-type <type>", "Filter by task type (personal, work, both)")
    .addHelpText("after", `\nExamples:\n  $ benji projects list\n  $ benji projects list --task-type work\n  $ benji projects list --json`)
    .action(async (options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          Projects.projectsList({ body: { taskType: options.taskType } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("create")
    .description("Create a project")
    .argument("[name]", "Project name")
    .option("--emoji <emoji>", "Emoji icon")
    .option("--color <color>", "Color")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText("after", `\nExamples:\n  $ benji projects create "Q2 Launch"\n  $ benji projects create "Side Project" --emoji "🚀"\n  $ echo '{"name":"Test"}' | benji projects create --stdin`)
    .action(async (name, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        let body: Record<string, unknown> = {};
        if (options.stdin) {
          body = await readStdin();
        }
        if (name) body.name = name;
        if (options.emoji !== undefined) body.emoji = options.emoji;
        if (options.color !== undefined) body.color = options.color;

        const result = await wrapSdkCall(
          Projects.projectsCreate({ body } as Parameters<typeof Projects.projectsCreate>[0]),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("update")
    .description("Update a project")
    .argument("<id>", "Project ID")
    .option("--name <name>", "New project name")
    .option("--emoji <emoji>", "Emoji icon")
    .option("--color <color>", "Color")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText("after", `\nExamples:\n  $ benji projects update abc123 --name "Updated"\n  $ benji projects update abc123 --emoji "🎯"\n  $ echo '{"name":"New Name"}' | benji projects update abc123 --stdin`)
    .action(async (id, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        let data: Record<string, unknown> = {};
        if (options.stdin) {
          data = await readStdin();
        }
        if (options.name !== undefined) data.name = options.name;
        if (options.emoji !== undefined) data.emoji = options.emoji;
        if (options.color !== undefined) data.color = options.color;

        const result = await wrapSdkCall(
          Projects.projectsUpdate({ body: { id, data } } as Parameters<typeof Projects.projectsUpdate>[0]),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("delete")
    .description("Delete a project")
    .argument("<id>", "Project ID")
    .option("--force", "Confirm deletion")
    .addHelpText("after", `\nExamples:\n  $ benji projects delete abc123 --force\n  $ benji projects delete abc123 --force --json`)
    .action(async (id, options, command) => {
      requireForce(command, "projects", "delete");
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          Projects.projectsDelete({ body: { id } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
