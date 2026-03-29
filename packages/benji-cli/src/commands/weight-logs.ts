import { Command } from "commander";
import { wrapSdkCall, WeightLogs } from "benji-sdk";
import { ensureAuth } from "../auth.js";
import { getGlobalOptions, outputResult } from "../output.js";
import { handleCommandError } from "../error-handler.js";
import { readStdin, requireForce, parseNumber, toTzDate } from "./shared.js";

// TODO(future-story): Missing MCP subcommands to add:
// - delete-many (weightLogsDeleteMany) — bulk delete weight logs
// - update-unit (weightLogsUpdateWeightUnit) — change weight unit preference (kg/lbs)
// - weight-goal (weightLogsGetCurrentActiveGoal) — get current active weight goal
export function registerWeightLogsCommand(program: Command): void {
  const cmd = program
    .command("weight-logs")
    .description("Track weight logs");

  cmd
    .command("list")
    .description("List weight logs")
    .option("--date <date>", "Filter by exact date (YYYY-MM-DD)")
    .option("--date-from <date>", "Start of date range (YYYY-MM-DD)")
    .option("--date-to <date>", "End of date range (YYYY-MM-DD)")
    .addHelpText("after", `\nExamples:\n  $ benji weight-logs list\n  $ benji weight-logs list --date 2026-03-29\n  $ benji weight-logs list --date-from 2026-03-01 --date-to 2026-03-31 --json`)
    .action(async (options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const body: Record<string, unknown> = {};
        if (options.date !== undefined) body.date = options.date;
        if (options.dateFrom !== undefined) body.dateFrom = options.dateFrom;
        if (options.dateTo !== undefined) body.dateTo = options.dateTo;

        const result = await wrapSdkCall(
          WeightLogs.weightLogsList({ body } as Parameters<typeof WeightLogs.weightLogsList>[0]),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("create")
    .description("Create a weight log")
    .argument("[weight]", "Weight value")
    .option("--fat-percentage <n>", "Body fat percentage")
    .option("--muscle-percentage <n>", "Muscle mass percentage")
    .option("--bone-percentage <n>", "Bone mass percentage")
    .option("--date <date>", "Date (YYYY-MM-DD)")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText("after", `\nExamples:\n  $ benji weight-logs create 185.5\n  $ benji weight-logs create 80 --fat-percentage 15 --muscle-percentage 40\n  $ echo '{"weight":82,"fatPercentage":14}' | benji weight-logs create --stdin`)
    .action(async (weight, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        let body: Record<string, unknown> = {};
        if (options.stdin) {
          body = await readStdin();
        }
        if (weight) body.weight = parseNumber(weight, "weight");
        if (options.fatPercentage !== undefined) body.fatPercentage = parseNumber(options.fatPercentage, "fat-percentage");
        if (options.musclePercentage !== undefined) body.musclePercentage = parseNumber(options.musclePercentage, "muscle-percentage");
        if (options.bonePercentage !== undefined) body.bonePercentage = parseNumber(options.bonePercentage, "bone-percentage");
        if (options.date !== undefined) body.date = toTzDate(options.date);

        const result = await wrapSdkCall(
          WeightLogs.weightLogsCreate({ body } as Parameters<typeof WeightLogs.weightLogsCreate>[0]),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("get")
    .description("Get a weight log by ID")
    .argument("<id>", "Weight log ID")
    .addHelpText("after", `\nExamples:\n  $ benji weight-logs get abc123\n  $ benji weight-logs get abc123 --json`)
    .action(async (id, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          WeightLogs.weightLogsGet({ body: { id } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("update")
    .description("Update a weight log")
    .argument("<id>", "Weight log ID")
    .option("--weight <n>", "Weight value")
    .option("--fat-percentage <n>", "Body fat percentage")
    .option("--muscle-percentage <n>", "Muscle mass percentage")
    .option("--bone-percentage <n>", "Bone mass percentage")
    .option("--date <date>", "Date (YYYY-MM-DD)")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText("after", `\nExamples:\n  $ benji weight-logs update abc123 --weight 82\n  $ benji weight-logs update abc123 --fat-percentage 14\n  $ echo '{"weight":81}' | benji weight-logs update abc123 --stdin`)
    .action(async (id, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        let data: Record<string, unknown> = {};
        if (options.stdin) {
          data = await readStdin();
        }
        if (options.weight !== undefined) data.weight = parseNumber(options.weight, "weight");
        if (options.fatPercentage !== undefined) data.fatPercentage = parseNumber(options.fatPercentage, "fat-percentage");
        if (options.musclePercentage !== undefined) data.musclePercentage = parseNumber(options.musclePercentage, "muscle-percentage");
        if (options.bonePercentage !== undefined) data.bonePercentage = parseNumber(options.bonePercentage, "bone-percentage");
        if (options.date !== undefined) data.date = toTzDate(options.date);

        const result = await wrapSdkCall(
          WeightLogs.weightLogsUpdate({ body: { id, data } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("delete")
    .description("Delete a weight log")
    .argument("<id>", "Weight log ID")
    .option("--force", "Confirm deletion")
    .addHelpText("after", `\nExamples:\n  $ benji weight-logs delete abc123 --force\n  $ benji weight-logs delete abc123 --force --json`)
    .action(async (id, options, command) => {
      requireForce(command, "weight-logs", "delete");
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          WeightLogs.weightLogsDelete({ body: { id } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("settings")
    .description("Get weight unit settings")
    .addHelpText("after", `\nExamples:\n  $ benji weight-logs settings\n  $ benji weight-logs settings --json`)
    .action(async (options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(WeightLogs.weightLogsGetSettings());
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("widget")
    .description("Get recent weight data for widget")
    .addHelpText("after", `\nExamples:\n  $ benji weight-logs widget\n  $ benji weight-logs widget --json`)
    .action(async (options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(WeightLogs.weightLogsGetWeightsForWidget());
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
