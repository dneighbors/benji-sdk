import { Command } from "commander";
import { wrapSdkCall, Workouts } from "@dneighbors/benji-sdk";
import { ensureAuth } from "../auth.js";
import { getGlobalOptions, outputResult } from "../output.js";
import { handleCommandError } from "../error-handler.js";
import { readStdin, requireForce } from "./shared.js";

// TODO(future-story): Missing MCP subcommands to add:
// - get-with-details (workoutsGetWithDetails) — get workout with exercises and sets
export function registerWorkoutsCommand(program: Command): void {
  const cmd = program
    .command("workouts")
    .description("Manage workouts");

  cmd
    .command("start")
    .description("Start a new workout")
    .option("--name <name>", "Workout name (e.g. 'Push Day')")
    .addHelpText("after", `\nExamples:\n  $ benji workouts start\n  $ benji workouts start --name "Morning Run"`)
    .action(async (options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          Workouts.workoutsStart({ body: { name: options.name } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("end")
    .description("End an in-progress workout")
    .argument("<id>", "Workout ID")
    .option("--ended-at <iso>", "ISO datetime when the workout ended")
    .addHelpText("after", `\nExamples:\n  $ benji workouts end abc123\n  $ benji workouts end abc123 --ended-at "2026-03-29T18:00:00Z"`)
    .action(async (id, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const body: Record<string, unknown> = { id };
        if (options.endedAt !== undefined) body.endedAt = options.endedAt;

        const result = await wrapSdkCall(
          Workouts.workoutsEnd({ body } as Parameters<typeof Workouts.workoutsEnd>[0]),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("in-progress")
    .description("Get the currently in-progress workout")
    .addHelpText("after", `\nExamples:\n  $ benji workouts in-progress\n  $ benji workouts in-progress --json`)
    .action(async (options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(Workouts.workoutsInProgress());
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("list")
    .description("List workouts")
    .option("--date-from <date>", "Start of date range (YYYY-MM-DD)")
    .option("--date-to <date>", "End of date range (YYYY-MM-DD)")
    .addHelpText("after", `\nExamples:\n  $ benji workouts list\n  $ benji workouts list --date-from 2026-03-01 --date-to 2026-03-31\n  $ benji workouts list --json`)
    .action(async (options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const body: Record<string, unknown> = {};
        if (options.dateFrom !== undefined) body.dateFrom = options.dateFrom;
        if (options.dateTo !== undefined) body.dateTo = options.dateTo;

        const result = await wrapSdkCall(
          Workouts.workoutsList({ body } as Parameters<typeof Workouts.workoutsList>[0]),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("create")
    .description("Create a workout")
    .option("--name <name>", "Workout name")
    .option("--started-at <iso>", "Start time (ISO datetime)")
    .option("--ended-at <iso>", "End time (ISO datetime)")
    .option("--notes <text>", "Notes about the workout")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText("after", `\nExamples:\n  $ benji workouts create --name "Push Day"\n  $ benji workouts create --name "Run" --notes "5k in 25min"\n  $ echo '{"name":"Yoga","notes":"60min session"}' | benji workouts create --stdin`)
    .action(async (options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        let body: Record<string, unknown> = {};
        if (options.stdin) {
          body = await readStdin();
        }
        if (options.name !== undefined) body.name = options.name;
        if (options.startedAt !== undefined) {
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          body.startedAt = { timezone, dateInUsersTimezone: options.startedAt };
        }
        if (options.endedAt !== undefined) {
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          body.endedAt = { timezone, dateInUsersTimezone: options.endedAt };
        }
        if (options.notes !== undefined) body.notes = options.notes;

        const result = await wrapSdkCall(
          Workouts.workoutsCreate({ body } as Parameters<typeof Workouts.workoutsCreate>[0]),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("get")
    .description("Get a workout by ID")
    .argument("<id>", "Workout ID")
    .addHelpText("after", `\nExamples:\n  $ benji workouts get abc123\n  $ benji workouts get abc123 --json`)
    .action(async (id, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          Workouts.workoutsGet({ path: { id } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("update")
    .description("Update a workout")
    .argument("<id>", "Workout ID")
    .option("--name <name>", "Workout name")
    .option("--notes <text>", "Notes")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText("after", `\nExamples:\n  $ benji workouts update abc123 --name "Leg Day"\n  $ benji workouts update abc123 --notes "Great session"\n  $ echo '{"name":"Updated"}' | benji workouts update abc123 --stdin`)
    .action(async (id, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        let data: Record<string, unknown> = {};
        if (options.stdin) {
          data = await readStdin();
        }
        if (options.name !== undefined) data.name = options.name;
        if (options.notes !== undefined) data.notes = options.notes;

        const result = await wrapSdkCall(
          Workouts.workoutsUpdate({ path: { id }, body: { data } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("delete")
    .description("Delete a workout")
    .argument("<id>", "Workout ID")
    .option("--force", "Confirm deletion")
    .addHelpText("after", `\nExamples:\n  $ benji workouts delete abc123 --force\n  $ benji workouts delete abc123 --force --json`)
    .action(async (id, options, command) => {
      requireForce(command, "workouts", "delete");
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          Workouts.workoutsDelete({ path: { id } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("duplicate")
    .description("Duplicate a workout")
    .argument("<id>", "Workout ID to duplicate")
    .addHelpText("after", `\nExamples:\n  $ benji workouts duplicate abc123\n  $ benji workouts duplicate abc123 --json`)
    .action(async (id, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          Workouts.workoutsDuplicate({ path: { id } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
