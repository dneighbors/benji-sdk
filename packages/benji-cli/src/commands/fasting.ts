import { Command } from "commander";
import { wrapSdkCall, Fasting } from "@dneighbors/benji-sdk";
import { ensureAuth } from "../auth.js";
import { getGlobalOptions, outputResult } from "../output.js";
import { handleCommandError } from "../error-handler.js";
import { readStdin, requireForce, parseNumber } from "./shared.js";

export function registerFastingCommand(program: Command): void {
  const cmd = program
    .command("fasting")
    .description("Manage fasting sessions");

  cmd
    .command("start")
    .description("Start a new fast")
    .option("--hours <n>", "Goal duration in hours (e.g. 16)")
    .option("--start-time <iso>", "When the fast started (ISO datetime)")
    .addHelpText("after", `\nExamples:\n  $ benji fasting start\n  $ benji fasting start --hours 16\n  $ benji fasting start --hours 18 --start-time "2026-03-29T20:00:00Z"`)
    .action(async (options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const body: Record<string, unknown> = {};
        if (options.hours !== undefined) body.hours = parseNumber(options.hours, "hours");
        if (options.startTime !== undefined) {
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          body.startTime = { timezone, dateInUsersTimezone: options.startTime };
        }

        const result = await wrapSdkCall(
          Fasting.fastingStart({ body } as Parameters<typeof Fasting.fastingStart>[0]),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("end")
    .description("End an active fast")
    .argument("<fast-id>", "Fast ID to end")
    .option("--time-ago-minutes <n>", "Minutes ago the fast ended")
    .addHelpText("after", `\nExamples:\n  $ benji fasting end abc123\n  $ benji fasting end abc123 --time-ago-minutes 30`)
    .action(async (fastId, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const body: Record<string, unknown> = { fastId };
        if (options.timeAgoMinutes !== undefined) body.timeAgoMinutes = parseNumber(options.timeAgoMinutes, "time-ago-minutes");

        const result = await wrapSdkCall(
          Fasting.fastingEnd({ body } as Parameters<typeof Fasting.fastingEnd>[0]),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("active")
    .description("Get the currently active fast")
    .addHelpText("after", `\nExamples:\n  $ benji fasting active\n  $ benji fasting active --json`)
    .action(async (options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(Fasting.fastingGetActive());
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("stats")
    .description("Get fasting statistics")
    .addHelpText("after", `\nExamples:\n  $ benji fasting stats\n  $ benji fasting stats --json`)
    .action(async (options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(Fasting.fastingGetStats());
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("list")
    .description("List fasts")
    .option("--date-from <date>", "Start of date range (YYYY-MM-DD)")
    .option("--date-to <date>", "End of date range (YYYY-MM-DD)")
    .addHelpText("after", `\nExamples:\n  $ benji fasting list\n  $ benji fasting list --date-from 2026-03-01 --date-to 2026-03-31\n  $ benji fasting list --json`)
    .action(async (options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const body: Record<string, unknown> = {};
        if (options.dateFrom !== undefined) body.dateFrom = options.dateFrom;
        if (options.dateTo !== undefined) body.dateTo = options.dateTo;

        const result = await wrapSdkCall(
          Fasting.fastingList({ body } as Parameters<typeof Fasting.fastingList>[0]),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("get")
    .description("Get a fast by ID")
    .argument("<id>", "Fast ID")
    .addHelpText("after", `\nExamples:\n  $ benji fasting get abc123\n  $ benji fasting get abc123 --json`)
    .action(async (id, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          Fasting.fastingGet({ path: { id } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("update")
    .description("Update a fast")
    .argument("<id>", "Fast ID")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText("after", `\nExamples:\n  $ echo '{"goal":18}' | benji fasting update abc123 --stdin`)
    .action(async (id, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        let data: Record<string, unknown> = {};
        if (options.stdin) {
          data = await readStdin();
        }

        const result = await wrapSdkCall(
          Fasting.fastingUpdate({ path: { id }, body: { data } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("delete")
    .description("Delete a fast")
    .argument("<id>", "Fast ID")
    .option("--force", "Confirm deletion")
    .addHelpText("after", `\nExamples:\n  $ benji fasting delete abc123 --force\n  $ benji fasting delete abc123 --force --json`)
    .action(async (id, options, command) => {
      requireForce(command, "fasting", "delete");
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          Fasting.fastingDelete({ path: { id } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
