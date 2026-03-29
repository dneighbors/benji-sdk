import { Command } from "commander";
import { wrapSdkCall, Hydration } from "benji-sdk";
import { ensureAuth } from "../auth.js";
import { getGlobalOptions, outputResult } from "../output.js";
import { handleCommandError } from "../error-handler.js";
import { readStdin, requireForce, parseNumber, toTzDate, toYmdDate } from "./shared.js";

export function registerHydrationCommand(program: Command): void {
  const cmd = program
    .command("hydration")
    .description("Track hydration");

  cmd
    .command("list")
    .description("List hydration logs")
    .option("--date <date>", "Filter by date (YYYY-MM-DD)")
    .addHelpText("after", `\nExamples:\n  $ benji hydration list\n  $ benji hydration list --date 2026-03-29\n  $ benji hydration list --json`)
    .action(async (options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const body: Record<string, unknown> = {};
        if (options.date !== undefined) body.date = toYmdDate(options.date);

        const result = await wrapSdkCall(
          Hydration.hydrationLogsList({ body } as Parameters<typeof Hydration.hydrationLogsList>[0]),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("create")
    .description("Create a hydration log")
    .argument("[amount]", "Amount of liquid")
    .option("--name <name>", "Name/label for the log")
    .option("--date <date>", "Date (YYYY-MM-DD)")
    .option("--counts-toward-goal", "Counts toward daily goal")
    .option("--no-counts-toward-goal", "Does not count toward daily goal")
    .option("--type <type>", "Liquid type (Water, Coffee, Tea, Other)")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText("after", `\nExamples:\n  $ benji hydration create 500\n  $ benji hydration create 250 --type Coffee --name "Morning coffee"\n  $ echo '{"amount":500,"type":"Water"}' | benji hydration create --stdin`)
    .action(async (amount, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        let body: Record<string, unknown> = {};
        if (options.stdin) {
          body = await readStdin();
        }
        if (amount) body.amount = parseNumber(amount, "amount");
        if (options.name !== undefined) body.name = options.name;
        if (options.date !== undefined) body.date = toTzDate(options.date);
        if (options.countsTowardGoal !== undefined) body.countsTowardGoal = options.countsTowardGoal;
        if (options.type !== undefined) body.type = options.type;

        const result = await wrapSdkCall(
          Hydration.hydrationLogsCreate({ body } as Parameters<typeof Hydration.hydrationLogsCreate>[0]),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("update")
    .description("Update a hydration log")
    .argument("<id>", "Hydration log ID")
    .option("--amount <n>", "Amount of liquid")
    .option("--name <name>", "Name/label")
    .option("--date <date>", "Date (YYYY-MM-DD)")
    .option("--counts-toward-goal", "Counts toward daily goal")
    .option("--no-counts-toward-goal", "Does not count toward daily goal")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText("after", `\nExamples:\n  $ benji hydration update abc123 --amount 750\n  $ benji hydration update abc123 --no-counts-toward-goal\n  $ echo '{"amount":600}' | benji hydration update abc123 --stdin`)
    .action(async (id, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        let data: Record<string, unknown> = {};
        if (options.stdin) {
          data = await readStdin();
        }
        if (options.amount !== undefined) data.amount = parseNumber(options.amount, "amount");
        if (options.name !== undefined) data.name = options.name;
        if (options.date !== undefined) data.date = toTzDate(options.date);
        if (options.countsTowardGoal !== undefined) data.countsTowardGoal = options.countsTowardGoal;

        const result = await wrapSdkCall(
          Hydration.hydrationLogsUpdate({ path: { id }, body: { data } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("delete")
    .description("Delete a hydration log")
    .argument("<id>", "Hydration log ID")
    .option("--force", "Confirm deletion")
    .addHelpText("after", `\nExamples:\n  $ benji hydration delete abc123 --force\n  $ benji hydration delete abc123 --force --json`)
    .action(async (id, options, command) => {
      requireForce(command, "hydration", "delete");
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          Hydration.hydrationLogsDelete({ path: { id } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("stats")
    .description("Get hydration stats for a date")
    .option("--date <date>", "Date (YYYY-MM-DD)")
    .addHelpText("after", `\nExamples:\n  $ benji hydration stats\n  $ benji hydration stats --date 2026-03-29\n  $ benji hydration stats --json`)
    .action(async (options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const body: Record<string, unknown> = {};
        if (options.date !== undefined) body.date = toYmdDate(options.date);

        const result = await wrapSdkCall(
          Hydration.hydrationLogsGetStats({ body } as Parameters<typeof Hydration.hydrationLogsGetStats>[0]),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
