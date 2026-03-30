import { Command } from "commander";
import { wrapSdkCall, Food } from "@dneighbors/benji-sdk";
import { ensureAuth } from "../auth.js";
import { getGlobalOptions, outputResult } from "../output.js";
import { handleCommandError } from "../error-handler.js";
import { readStdin, requireForce, parseNumber, toTzDate, toYmdDate } from "./shared.js";

// TODO(future-story): Missing MCP subcommands to add:
// - delete-many (foodLogsDeleteMany) — bulk delete food logs
// - calories-stats (foodLogsGetCaloriesStats) — get calorie stats for a date
// - protein-stats (foodLogsGetProteinStats) — get protein stats for a date
// - carbs-stats (foodLogsGetCarbsStats) — get carbs stats for a date
export function registerFoodCommand(program: Command): void {
  const cmd = program
    .command("food")
    .description("Track food entries");

  cmd
    .command("list")
    .description("List food logs")
    .option("--date <date>", "Filter by date (YYYY-MM-DD)")
    .addHelpText("after", `\nExamples:\n  $ benji food list\n  $ benji food list --date 2026-03-29\n  $ benji food list --json`)
    .action(async (options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const body: Record<string, unknown> = {};
        if (options.date !== undefined) body.date = toYmdDate(options.date);

        const result = await wrapSdkCall(
          Food.foodLogsList({ body } as Parameters<typeof Food.foodLogsList>[0]),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("create")
    .description("Create a food log")
    .option("--portion-size <size>", "Portion size rating (required)")
    .option("--healthiness <n>", "Healthiness rating (required)")
    .option("--title <title>", "Food title/description")
    .option("--reasons <text>", "Eating reasons (comma-separated)")
    .option("--meal-type <type>", "Meal type (Meal, Snack, Drink, Other)")
    .option("--protein <n>", "Protein in grams")
    .option("--carbs <n>", "Carbs in grams")
    .option("--fat <n>", "Fat in grams")
    .option("--calories <n>", "Calorie count")
    .option("--on-path", "Meal was on dietary path")
    .option("--no-on-path", "Meal was not on dietary path")
    .option("--date <date>", "Date (YYYY-MM-DD)")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText("after", `\nExamples:\n  $ benji food create --portion-size 3 --healthiness 4 --title "Grilled chicken"\n  $ benji food create --portion-size 2 --healthiness 3 --calories 500 --protein 30\n  $ echo '{"portionSize":3,"healthiness":4,"title":"Salad"}' | benji food create --stdin`)
    .action(async (options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        let body: Record<string, unknown> = {};
        if (options.stdin) {
          body = await readStdin();
        }
        if (options.portionSize !== undefined) body.portionSize = parseNumber(options.portionSize, "portion-size");
        if (options.healthiness !== undefined) body.healthiness = parseNumber(options.healthiness, "healthiness");
        if (options.title !== undefined) body.title = options.title;
        if (options.reasons !== undefined) body.reasons = options.reasons;
        if (options.mealType !== undefined) body.mealType = options.mealType;
        if (options.protein !== undefined) body.protein = parseNumber(options.protein, "protein");
        if (options.carbs !== undefined) body.carbs = parseNumber(options.carbs, "carbs");
        if (options.fat !== undefined) body.fat = parseNumber(options.fat, "fat");
        if (options.calories !== undefined) body.calories = parseNumber(options.calories, "calories");
        if (command.getOptionValueSource("onPath") === "cli") body.onPath = options.onPath;
        if (options.date !== undefined) body.date = toTzDate(options.date);

        const result = await wrapSdkCall(
          Food.foodLogsCreate({ body } as Parameters<typeof Food.foodLogsCreate>[0]),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("get")
    .description("Get a food log by ID")
    .argument("<id>", "Food log ID")
    .addHelpText("after", `\nExamples:\n  $ benji food get abc123\n  $ benji food get abc123 --json`)
    .action(async (id, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          Food.foodLogsGet({ path: { id } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("update")
    .description("Update a food log")
    .argument("<id>", "Food log ID")
    .option("--portion-size <size>", "Portion size rating")
    .option("--healthiness <n>", "Healthiness rating")
    .option("--title <title>", "Food title")
    .option("--reasons <text>", "Eating reasons")
    .option("--meal-type <type>", "Meal type (Meal, Snack, Drink, Other)")
    .option("--protein <n>", "Protein in grams")
    .option("--carbs <n>", "Carbs in grams")
    .option("--fat <n>", "Fat in grams")
    .option("--calories <n>", "Calorie count")
    .option("--on-path", "Meal was on dietary path")
    .option("--no-on-path", "Meal was not on dietary path")
    .option("--date <date>", "Date (YYYY-MM-DD)")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText("after", `\nExamples:\n  $ benji food update abc123 --title "Updated meal"\n  $ benji food update abc123 --calories 600 --protein 35\n  $ echo '{"title":"Better name"}' | benji food update abc123 --stdin`)
    .action(async (id, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        let data: Record<string, unknown> = {};
        if (options.stdin) {
          data = await readStdin();
        }
        if (options.portionSize !== undefined) data.portionSize = parseNumber(options.portionSize, "portion-size");
        if (options.healthiness !== undefined) data.healthiness = parseNumber(options.healthiness, "healthiness");
        if (options.title !== undefined) data.title = options.title;
        if (options.reasons !== undefined) data.reasons = options.reasons;
        if (options.mealType !== undefined) data.mealType = options.mealType;
        if (options.protein !== undefined) data.protein = parseNumber(options.protein, "protein");
        if (options.carbs !== undefined) data.carbs = parseNumber(options.carbs, "carbs");
        if (options.fat !== undefined) data.fat = parseNumber(options.fat, "fat");
        if (options.calories !== undefined) data.calories = parseNumber(options.calories, "calories");
        if (command.getOptionValueSource("onPath") === "cli") data.onPath = options.onPath;
        if (options.date !== undefined) data.date = toTzDate(options.date);

        const result = await wrapSdkCall(
          Food.foodLogsUpdate({ path: { id }, body: { data } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("delete")
    .description("Delete a food log")
    .argument("<id>", "Food log ID")
    .option("--force", "Confirm deletion")
    .addHelpText("after", `\nExamples:\n  $ benji food delete abc123 --force\n  $ benji food delete abc123 --force --json`)
    .action(async (id, options, command) => {
      requireForce(command, "food", "delete");
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          Food.foodLogsDelete({ path: { id } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
