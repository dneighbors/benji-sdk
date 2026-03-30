import { Command } from "commander";
import { wrapSdkCall, Habits } from "@dneighbors/benji-sdk";
import { ensureAuth } from "../auth.js";
import { getGlobalOptions, outputResult } from "../output.js";
import { handleCommandError } from "../error-handler.js";
import { readStdin, requireForce, parseCommaSeparated, toTzDate, parseDate } from "./shared.js";

export function registerHabitsCommand(program: Command): void {
  const cmd = program
    .command("habits")
    .description("Manage habits");

  cmd
    .command("list")
    .description("List habits with completions")
    .option("--date-from <date>", "Start date (YYYY-MM-DD)")
    .option("--date-to <date>", "End date (YYYY-MM-DD)")
    .option("--habit-ids <ids>", "Comma-separated habit IDs to filter")
    .addHelpText("after", `\nExamples:\n  $ benji habits list --date-from 2026-03-01 --date-to 2026-03-31\n  $ benji habits list --habit-ids id1,id2 --json`)
    .action(async (options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const body: Record<string, unknown> = {};
        if (options.dateFrom !== undefined) body.dateFrom = options.dateFrom;
        if (options.dateTo !== undefined) body.dateTo = options.dateTo;
        if (options.habitIds !== undefined) body.habitIds = parseCommaSeparated(options.habitIds);

        const result = await wrapSdkCall(
          Habits.habitsGetHabitsAndCompletions({ body } as Parameters<typeof Habits.habitsGetHabitsAndCompletions>[0]),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("create")
    .description("Create a habit")
    .argument("[name]", "Habit name")
    .option("--emoji <emoji>", "Emoji icon")
    .option("--frequency <freq>", "Frequency")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText("after", `\nExamples:\n  $ benji habits create "Meditate"\n  $ benji habits create "Exercise" --emoji "🏋️"\n  $ echo '{"name":"Read","emoji":"📖"}' | benji habits create --stdin`)
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
        if (options.frequency !== undefined) body.frequency = options.frequency;

        const result = await wrapSdkCall(
          Habits.habitsCreate({ body } as Parameters<typeof Habits.habitsCreate>[0]),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("update")
    .description("Update a habit")
    .argument("<id>", "Habit ID")
    .option("--name <name>", "New habit name")
    .option("--emoji <emoji>", "Emoji icon")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText("after", `\nExamples:\n  $ benji habits update abc123 --name "Daily Run"\n  $ echo '{"name":"Updated"}' | benji habits update abc123 --stdin`)
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

        const result = await wrapSdkCall(
          Habits.habitsUpdate({ body: { id, data } } as Parameters<typeof Habits.habitsUpdate>[0]),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("delete")
    .description("Delete a habit")
    .argument("<id>", "Habit ID")
    .option("--force", "Confirm deletion")
    .addHelpText("after", `\nExamples:\n  $ benji habits delete abc123 --force\n  $ benji habits delete abc123 --force --json`)
    .action(async (id, options, command) => {
      requireForce(command, "habits", "delete");
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          Habits.habitsDelete({ body: { id } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("log")
    .description("Log a habit completion for a day")
    .argument("<habit-id>", "Habit ID")
    .option("--date <date>", "Date (YYYY-MM-DD)")
    .option("--completion-type <type>", "Completion type (Done, Skipped, NotCompleted)")
    .addHelpText("after", `\nExamples:\n  $ benji habits log abc123\n  $ benji habits log abc123 --date 2026-03-29\n  $ benji habits log abc123 --completion-type Skipped`)
    .action(async (habitId, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const body: Record<string, unknown> = { habitId };
        if (options.date !== undefined) body.date = toTzDate(options.date);
        if (options.completionType !== undefined) body.completionType = options.completionType;

        const result = await wrapSdkCall(
          Habits.habitsLogHabitOnDay({ body } as Parameters<typeof Habits.habitsLogHabitOnDay>[0]),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("log-many")
    .description("Log multiple habits for a day")
    .requiredOption("--habit-ids <ids>", "Comma-separated habit IDs")
    .requiredOption("--completion-type <type>", "Completion type (Done, Skipped, NotCompleted)")
    .option("--date <date>", "Date (YYYY-MM-DD)")
    .addHelpText("after", `\nExamples:\n  $ benji habits log-many --habit-ids id1,id2 --completion-type Done\n  $ benji habits log-many --habit-ids id1,id2,id3 --completion-type Done --date 2026-03-29`)
    .action(async (options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const body: Record<string, unknown> = {
          habitIds: parseCommaSeparated(options.habitIds),
          completionType: options.completionType,
        };
        if (options.date !== undefined) {
          parseDate(options.date, "date");
          body.date = { dateInUsersTimezone: options.date };
        }

        const result = await wrapSdkCall(
          Habits.habitsLogManyHabitsOnDay({ body } as Parameters<typeof Habits.habitsLogManyHabitsOnDay>[0]),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
