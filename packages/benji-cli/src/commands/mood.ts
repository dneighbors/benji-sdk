import { Command } from "commander";
import { wrapSdkCall, Mood } from "@dneighbors/benji-sdk";
import { ensureAuth } from "../auth.js";
import { getGlobalOptions, outputResult } from "../output.js";
import { handleCommandError } from "../error-handler.js";
import { readStdin, requireForce, parseNumber, toTzDate, toYmdDate } from "./shared.js";

export function registerMoodCommand(program: Command): void {
  const cmd = program
    .command("mood")
    .description("Track mood entries");

  cmd
    .command("list")
    .description("List mood entries")
    .option("--date <date>", "Filter by date (YYYY-MM-DD)")
    .addHelpText("after", `\nExamples:\n  $ benji mood list\n  $ benji mood list --date 2026-03-29\n  $ benji mood list --json`)
    .action(async (options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const body: Record<string, unknown> = {};
        if (options.date !== undefined) body.date = toYmdDate(options.date);

        const result = await wrapSdkCall(
          Mood.moodList({ body } as Parameters<typeof Mood.moodList>[0]),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("create")
    .description("Create a mood entry")
    .argument("[mood]", "Mood level (1=awful, 2=bad, 3=meh, 4=good, 5=rad)")
    .option("--note <text>", "Note about your mood")
    .option("--date <date>", "Date (YYYY-MM-DD)")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText("after", `\nExamples:\n  $ benji mood create 4\n  $ benji mood create 5 --note "Great day!"\n  $ echo '{"mood":3,"note":"okay"}' | benji mood create --stdin`)
    .action(async (mood, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        let body: Record<string, unknown> = {};
        if (options.stdin) {
          body = await readStdin();
        }
        if (mood) body.mood = parseNumber(mood, "mood");
        if (options.note !== undefined) body.note = options.note;
        if (options.date !== undefined) body.date = toTzDate(options.date);

        const result = await wrapSdkCall(
          Mood.moodCreate({ body } as Parameters<typeof Mood.moodCreate>[0]),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("update")
    .description("Update a mood entry")
    .argument("<id>", "Mood entry ID")
    .option("--mood <level>", "Mood level (1-5)")
    .option("--note <text>", "Note about your mood")
    .option("--date <date>", "Date (YYYY-MM-DD)")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText("after", `\nExamples:\n  $ benji mood update abc123 --mood 5\n  $ benji mood update abc123 --note "Actually great"\n  $ echo '{"mood":4}' | benji mood update abc123 --stdin`)
    .action(async (id, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        let data: Record<string, unknown> = {};
        if (options.stdin) {
          data = await readStdin();
        }
        if (options.mood !== undefined) data.mood = parseNumber(options.mood, "mood");
        if (options.note !== undefined) data.note = options.note;
        if (options.date !== undefined) data.date = toTzDate(options.date);

        const result = await wrapSdkCall(
          Mood.moodUpdate({ body: { id, data } } as Parameters<typeof Mood.moodUpdate>[0]),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("delete")
    .description("Delete a mood entry")
    .argument("<id>", "Mood entry ID")
    .option("--force", "Confirm deletion")
    .addHelpText("after", `\nExamples:\n  $ benji mood delete abc123 --force\n  $ benji mood delete abc123 --force --json`)
    .action(async (id, options, command) => {
      requireForce(command, "mood", "delete");
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          Mood.moodDelete({ body: { id } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
