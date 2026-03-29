import { Command } from "commander";
import { wrapSdkCall, Journal } from "benji-sdk";
import { ensureAuth } from "../auth.js";
import { getGlobalOptions, outputResult } from "../output.js";
import { handleCommandError } from "../error-handler.js";
import { readStdin, requireForce } from "./shared.js";

// TODO(future-story): Missing MCP subcommands to add:
// - delete-many (journalEntriesDeleteMany) — bulk delete journal entries
// - stats (journalEntriesStats) — get journal statistics (entries, words, streak)
export function registerJournalCommand(program: Command): void {
  const cmd = program
    .command("journal")
    .description("Manage journal entries");

  cmd
    .command("list")
    .description("List journal entries")
    .option("--date-from <date>", "Start of date range (YYYY-MM-DD)")
    .option("--date-to <date>", "End of date range (YYYY-MM-DD)")
    .addHelpText("after", `\nExamples:\n  $ benji journal list\n  $ benji journal list --date-from 2026-03-01 --date-to 2026-03-31\n  $ benji journal list --json`)
    .action(async (options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const body: Record<string, unknown> = {};
        if (options.dateFrom !== undefined) body.dateFrom = options.dateFrom;
        if (options.dateTo !== undefined) body.dateTo = options.dateTo;

        const result = await wrapSdkCall(
          Journal.journalEntriesList({ body } as Parameters<typeof Journal.journalEntriesList>[0]),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("create")
    .description("Create a journal entry")
    .argument("[content]", "Journal entry content")
    .option("--title <title>", "Entry title")
    .option("--date <date>", "Date (YYYY-MM-DD)")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText("after", `\nExamples:\n  $ benji journal create "Today was productive"\n  $ benji journal create "Great meeting" --title "Work Notes" --date 2026-03-29\n  $ echo '{"content":"My entry","title":"Day 1"}' | benji journal create --stdin`)
    .action(async (content, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        let body: Record<string, unknown> = {};
        if (options.stdin) {
          body = await readStdin();
        }
        if (content) body.content = content;
        if (options.title !== undefined) body.title = options.title;
        if (options.date !== undefined) body.date = options.date;

        const result = await wrapSdkCall(
          Journal.journalEntriesCreate({ body } as Parameters<typeof Journal.journalEntriesCreate>[0]),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("get")
    .description("Get a journal entry by ID")
    .argument("<id>", "Journal entry ID")
    .addHelpText("after", `\nExamples:\n  $ benji journal get abc123\n  $ benji journal get abc123 --json`)
    .action(async (id, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          Journal.journalEntriesGet({ path: { id }, body: {} }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("update")
    .description("Update a journal entry")
    .argument("<id>", "Journal entry ID")
    .option("--content <text>", "New content")
    .option("--title <title>", "New title")
    .option("--date <date>", "New date (YYYY-MM-DD)")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText("after", `\nExamples:\n  $ benji journal update abc123 --title "Updated Title"\n  $ benji journal update abc123 --content "New content"\n  $ echo '{"title":"New"}' | benji journal update abc123 --stdin`)
    .action(async (id, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        let data: Record<string, unknown> = {};
        if (options.stdin) {
          data = await readStdin();
        }
        if (options.content !== undefined) data.content = options.content;
        if (options.title !== undefined) data.title = options.title;
        if (options.date !== undefined) data.date = options.date;

        const result = await wrapSdkCall(
          Journal.journalEntriesUpdate({ path: { id }, body: { data } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("delete")
    .description("Delete a journal entry")
    .argument("<id>", "Journal entry ID")
    .option("--force", "Confirm deletion")
    .addHelpText("after", `\nExamples:\n  $ benji journal delete abc123 --force\n  $ benji journal delete abc123 --force --json`)
    .action(async (id, options, command) => {
      requireForce(command, "journal", "delete");
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          Journal.journalEntriesDelete({ path: { id } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
