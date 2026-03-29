import { Command } from "commander";
import { wrapSdkCall, PainEvents } from "benji-sdk";
import { ensureAuth } from "../auth.js";
import { getGlobalOptions, outputResult } from "../output.js";
import { handleCommandError } from "../error-handler.js";
import { readStdin, requireForce, parseNumber, toTzDate, toYmdDate } from "./shared.js";

// TODO(future-story): Missing MCP subcommands to add:
// - delete-many (painEventsDeleteMany) — bulk delete pain events
// - recent-body-parts (painEventsRecentBodyParts) — list recently used body parts
export function registerPainEventsCommand(program: Command): void {
  const cmd = program
    .command("pain-events")
    .description("Track pain events");

  cmd
    .command("list")
    .description("List pain events")
    .option("--date <date>", "Filter by date (YYYY-MM-DD)")
    .addHelpText("after", `\nExamples:\n  $ benji pain-events list\n  $ benji pain-events list --date 2026-03-29\n  $ benji pain-events list --json`)
    .action(async (options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const body: Record<string, unknown> = {};
        if (options.date !== undefined) body.date = toYmdDate(options.date);

        const result = await wrapSdkCall(
          PainEvents.painEventsList({ body } as Parameters<typeof PainEvents.painEventsList>[0]),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("create")
    .description("Create a pain event")
    .option("--date <date>", "Date (YYYY-MM-DD, required)")
    .option("--pain-level <n>", "Pain level 1-10 (required)")
    .option("--body-part-id <id>", "Body part ID (required, see body-parts)")
    .option("--notes <text>", "Notes about the pain")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText("after", `\nExamples:\n  $ benji pain-events create --date 2026-03-29 --pain-level 5 --body-part-id bp123\n  $ benji pain-events create --pain-level 3 --body-part-id bp456 --notes "After exercise" --date 2026-03-29\n  $ echo '{"date":"2026-03-29","painLevel":5,"bodyPartId":"bp123"}' | benji pain-events create --stdin`)
    .action(async (options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        let body: Record<string, unknown> = {};
        if (options.stdin) {
          body = await readStdin();
        }
        if (options.date !== undefined) body.date = toTzDate(options.date);
        if (options.painLevel !== undefined) body.painLevel = parseNumber(options.painLevel, "pain-level");
        if (options.bodyPartId !== undefined) body.bodyPartId = options.bodyPartId;
        if (options.notes !== undefined) body.notes = options.notes;

        const result = await wrapSdkCall(
          PainEvents.painEventsCreate({ body } as Parameters<typeof PainEvents.painEventsCreate>[0]),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("get")
    .description("Get a pain event by ID")
    .argument("<id>", "Pain event ID")
    .addHelpText("after", `\nExamples:\n  $ benji pain-events get abc123\n  $ benji pain-events get abc123 --json`)
    .action(async (id, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          PainEvents.painEventsGet({ body: { id } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("update")
    .description("Update a pain event")
    .argument("<id>", "Pain event ID")
    .option("--date <date>", "Date (YYYY-MM-DD)")
    .option("--pain-level <n>", "Pain level 1-10")
    .option("--body-part-id <id>", "Body part ID")
    .option("--notes <text>", "Notes")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText("after", `\nExamples:\n  $ benji pain-events update abc123 --pain-level 3\n  $ benji pain-events update abc123 --notes "Feeling better"\n  $ echo '{"painLevel":2}' | benji pain-events update abc123 --stdin`)
    .action(async (id, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        let data: Record<string, unknown> = {};
        if (options.stdin) {
          data = await readStdin();
        }
        if (options.date !== undefined) data.date = toTzDate(options.date);
        if (options.painLevel !== undefined) data.painLevel = parseNumber(options.painLevel, "pain-level");
        if (options.bodyPartId !== undefined) data.bodyPartId = options.bodyPartId;
        if (options.notes !== undefined) data.notes = options.notes;

        const result = await wrapSdkCall(
          PainEvents.painEventsUpdate({ body: { id, data } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("delete")
    .description("Delete a pain event")
    .argument("<id>", "Pain event ID")
    .option("--force", "Confirm deletion")
    .addHelpText("after", `\nExamples:\n  $ benji pain-events delete abc123 --force\n  $ benji pain-events delete abc123 --force --json`)
    .action(async (id, options, command) => {
      requireForce(command, "pain-events", "delete");
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          PainEvents.painEventsDelete({ body: { id } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("body-parts")
    .description("List available body parts")
    .addHelpText("after", `\nExamples:\n  $ benji pain-events body-parts\n  $ benji pain-events body-parts --json`)
    .action(async (options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(PainEvents.painEventsBodyParts());
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
