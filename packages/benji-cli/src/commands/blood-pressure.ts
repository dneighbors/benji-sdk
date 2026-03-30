import { Command } from "commander";
import { wrapSdkCall, BloodPressureLogs } from "@dneighbors/benji-sdk";
import { ensureAuth } from "../auth.js";
import { getGlobalOptions, outputResult } from "../output.js";
import { handleCommandError } from "../error-handler.js";
import { readStdin, requireForce, parseNumber, toTzDate } from "./shared.js";

export function registerBloodPressureCommand(program: Command): void {
  const cmd = program
    .command("blood-pressure")
    .description("Track blood pressure");

  cmd
    .command("list")
    .description("List blood pressure logs")
    .option("--date-from <date>", "Start of date range (YYYY-MM-DD)")
    .option("--date-to <date>", "End of date range (YYYY-MM-DD)")
    .addHelpText("after", `\nExamples:\n  $ benji blood-pressure list\n  $ benji blood-pressure list --date-from 2026-03-01 --date-to 2026-03-31\n  $ benji blood-pressure list --json`)
    .action(async (options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const body: Record<string, unknown> = {};
        if (options.dateFrom !== undefined) body.dateFrom = options.dateFrom;
        if (options.dateTo !== undefined) body.dateTo = options.dateTo;

        const result = await wrapSdkCall(
          BloodPressureLogs.bloodPressureLogsList({ body } as Parameters<typeof BloodPressureLogs.bloodPressureLogsList>[0]),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("create")
    .description("Create a blood pressure log")
    .argument("[systolic]", "Systolic value (mmHg)")
    .argument("[diastolic]", "Diastolic value (mmHg)")
    .option("--note <text>", "Note about the reading")
    .option("--date <date>", "Date (YYYY-MM-DD)")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText("after", `\nExamples:\n  $ benji blood-pressure create 120 80\n  $ benji blood-pressure create 130 85 --note "After exercise"\n  $ echo '{"systolic":120,"diastolic":80}' | benji blood-pressure create --stdin`)
    .action(async (systolic, diastolic, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        let body: Record<string, unknown> = {};
        if (options.stdin) {
          body = await readStdin();
        }
        if (systolic) body.systolic = parseNumber(systolic, "systolic");
        if (diastolic) body.diastolic = parseNumber(diastolic, "diastolic");
        if (options.note !== undefined) body.note = options.note;
        if (options.date !== undefined) body.date = toTzDate(options.date);

        const result = await wrapSdkCall(
          BloodPressureLogs.bloodPressureLogsCreate({ body } as Parameters<typeof BloodPressureLogs.bloodPressureLogsCreate>[0]),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("get")
    .description("Get a blood pressure log by ID")
    .argument("<id>", "Blood pressure log ID")
    .addHelpText("after", `\nExamples:\n  $ benji blood-pressure get abc123\n  $ benji blood-pressure get abc123 --json`)
    .action(async (id, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          BloodPressureLogs.bloodPressureLogsGet({ body: { id } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("update")
    .description("Update a blood pressure log")
    .argument("<id>", "Blood pressure log ID")
    .option("--systolic <n>", "Systolic value (mmHg)")
    .option("--diastolic <n>", "Diastolic value (mmHg)")
    .option("--note <text>", "Note about the reading")
    .option("--date <date>", "Date (YYYY-MM-DD)")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText("after", `\nExamples:\n  $ benji blood-pressure update abc123 --systolic 118\n  $ benji blood-pressure update abc123 --note "Normal reading"\n  $ echo '{"systolic":115,"diastolic":75}' | benji blood-pressure update abc123 --stdin`)
    .action(async (id, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        let data: Record<string, unknown> = {};
        if (options.stdin) {
          data = await readStdin();
        }
        if (options.systolic !== undefined) data.systolic = parseNumber(options.systolic, "systolic");
        if (options.diastolic !== undefined) data.diastolic = parseNumber(options.diastolic, "diastolic");
        if (options.note !== undefined) data.note = options.note;
        if (options.date !== undefined) data.date = toTzDate(options.date);

        const result = await wrapSdkCall(
          BloodPressureLogs.bloodPressureLogsUpdate({ body: { id, data } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("delete")
    .description("Delete a blood pressure log")
    .argument("<id>", "Blood pressure log ID")
    .option("--force", "Confirm deletion")
    .addHelpText("after", `\nExamples:\n  $ benji blood-pressure delete abc123 --force\n  $ benji blood-pressure delete abc123 --force --json`)
    .action(async (id, options, command) => {
      requireForce(command, "blood-pressure", "delete");
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          BloodPressureLogs.bloodPressureLogsDelete({ body: { id } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
