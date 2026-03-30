import { Command } from "commander";
import { wrapSdkCall, Tags } from "@dneighbors/benji-sdk";
import { ensureAuth } from "../auth.js";
import { getGlobalOptions, outputResult } from "../output.js";
import { handleCommandError } from "../error-handler.js";
import { readStdin, requireForce, parseNumber } from "./shared.js";

export function registerTagsCommand(program: Command): void {
  const cmd = program
    .command("tags")
    .description("Manage tags");

  cmd
    .command("list")
    .description("List tags")
    .option("--task-type <type>", "Filter by task type (personal, work, both)")
    .addHelpText("after", `\nExamples:\n  $ benji tags list\n  $ benji tags list --task-type work\n  $ benji tags list --json`)
    .action(async (options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          Tags.tagsList({ body: { taskType: options.taskType } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("create")
    .description("Create a tag")
    .argument("[name]", "Tag name")
    .option("--points <n>", "Points value")
    .option("--emoji <emoji>", "Emoji icon")
    .option("--paused", "Create as paused")
    .option("--tag-group-id <id>", "Tag group ID")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText("after", `\nExamples:\n  $ benji tags create "Exercise"\n  $ benji tags create "Reading" --points 5 --emoji "📖"\n  $ echo '{"name":"Test","points":3}' | benji tags create --stdin`)
    .action(async (name, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        let body: Record<string, unknown> = {};
        if (options.stdin) {
          body = await readStdin();
        }
        if (name) body.name = name;
        if (options.points !== undefined) body.points = parseNumber(options.points, "points");
        if (options.emoji !== undefined) body.emoji = options.emoji;
        if (options.paused) body.paused = true;
        if (options.tagGroupId !== undefined) body.tagGroupId = options.tagGroupId;

        const result = await wrapSdkCall(
          Tags.tagsCreate({ body } as Parameters<typeof Tags.tagsCreate>[0]),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("update")
    .description("Update a tag")
    .argument("<id>", "Tag ID")
    .option("--name <name>", "New tag name")
    .option("--points <n>", "Points value")
    .option("--emoji <emoji>", "Emoji icon")
    .option("--paused", "Set paused")
    .option("--no-paused", "Unset paused")
    .option("--tag-group-id <id>", "Tag group ID")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText("after", `\nExamples:\n  $ benji tags update abc123 --name "Fitness"\n  $ benji tags update abc123 --points 10 --emoji "💪"\n  $ benji tags update abc123 --no-paused\n  $ echo '{"name":"Updated"}' | benji tags update abc123 --stdin`)
    .action(async (id, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        let data: Record<string, unknown> = {};
        if (options.stdin) {
          data = await readStdin();
        }
        if (options.name !== undefined) data.name = options.name;
        if (options.points !== undefined) data.points = parseNumber(options.points, "points");
        if (options.emoji !== undefined) data.emoji = options.emoji;
        if (command.getOptionValueSource("paused") === "cli") data.paused = options.paused;
        if (options.tagGroupId !== undefined) data.tagGroupId = options.tagGroupId;

        const result = await wrapSdkCall(
          Tags.tagsUpdate({ body: { id, data } } as Parameters<typeof Tags.tagsUpdate>[0]),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("delete")
    .description("Delete a tag")
    .argument("<id>", "Tag ID")
    .option("--force", "Confirm deletion")
    .addHelpText("after", `\nExamples:\n  $ benji tags delete abc123 --force\n  $ benji tags delete abc123 --force --json`)
    .action(async (id, options, command) => {
      requireForce(command, "tags", "delete");
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          Tags.tagsDelete({ body: { id } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
