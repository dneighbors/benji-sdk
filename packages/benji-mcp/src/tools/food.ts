import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Food, wrapSdkCall } from "benji-sdk";
import {
  toolResult,
  handleToolError,
  ymdDateSchema,
  tzDateSchema,
} from "./util.js";

const foodReasonEnum = z.enum([
  "Hungry",
  "Social",
  "ItWasTime",
  "Bored",
  "Stressed",
  "Cravings",
  "Tired",
  "TheTaste",
  "WhyNot",
]);

const mealTypeEnum = z.enum(["Meal", "Snack", "Drink", "Other"]);

/**
 * Register all 9 food MCP tools on the given server.
 */
export function registerFoodTools(server: McpServer): void {
  // -- list_food_logs -----------------------------------------------------------
  server.registerTool(
    "list_food_logs",
    {
      description:
        "List food logs. Optionally filter by a specific date (year, month, day).",
      inputSchema: {
        date: ymdDateSchema
          .optional()
          .describe("Filter food logs by date (year, month, day)"),
      },
    },
    async ({ date }) => {
      try {
        const result = await wrapSdkCall(
          Food.foodLogsList({ body: { date } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- create_food_log ----------------------------------------------------------
  server.registerTool(
    "create_food_log",
    {
      description:
        "Create a new food log. Requires portionSize and healthiness. Optionally include title, reasons, meal type, macros, calorie info, and date.",
      inputSchema: {
        portionSize: z
          .number()
          .nullable()
          .describe("Portion size rating (nullable)"),
        healthiness: z
          .number()
          .nullable()
          .describe("Healthiness rating (nullable)"),
        title: z
          .string()
          .nullable()
          .optional()
          .describe("Title / description of the food"),
        reasons: z
          .array(foodReasonEnum)
          .optional()
          .describe(
            "Reasons for eating (e.g. Hungry, Social, Bored, Stressed, Cravings, Tired, TheTaste, WhyNot, ItWasTime)",
          ),
        mealType: mealTypeEnum
          .optional()
          .describe("Meal type: Meal, Snack, Drink, or Other"),
        protein: z
          .number()
          .nullable()
          .optional()
          .describe("Protein in grams"),
        carbs: z
          .number()
          .nullable()
          .optional()
          .describe("Carbs in grams"),
        fat: z
          .number()
          .nullable()
          .optional()
          .describe("Fat in grams"),
        calories: z
          .number()
          .nullable()
          .optional()
          .describe("Calorie count"),
        onPath: z
          .union([z.enum(["yes", "no"]), z.boolean()])
          .optional()
          .describe("Whether this meal was on the user's dietary path"),
        date: tzDateSchema
          .nullable()
          .optional()
          .describe(
            "When the food was logged (timezone and dateInUsersTimezone). Defaults to now if omitted.",
          ),
      },
    },
    async ({
      portionSize,
      healthiness,
      title,
      reasons,
      mealType,
      protein,
      carbs,
      fat,
      calories,
      onPath,
      date,
    }) => {
      try {
        const result = await wrapSdkCall(
          Food.foodLogsCreate({
            body: {
              portionSize,
              healthiness,
              title,
              reasons,
              mealType,
              protein,
              carbs,
              fat,
              calories,
              onPath,
              date,
            },
          }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- get_food_log -------------------------------------------------------------
  server.registerTool(
    "get_food_log",
    {
      description: "Get a single food log by ID.",
      inputSchema: {
        id: z.string().min(1).describe("The food log ID to retrieve"),
      },
    },
    async ({ id }) => {
      try {
        const result = await wrapSdkCall(
          Food.foodLogsGet({ path: { id } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- update_food_log ----------------------------------------------------------
  server.registerTool(
    "update_food_log",
    {
      description:
        "Update an existing food log. Provide the food log ID and the fields to update.",
      inputSchema: {
        id: z.string().min(1).describe("The food log ID to update"),
        data: z
          .object({
            title: z
              .string()
              .nullable()
              .optional()
              .describe("Updated food title"),
            reasons: z
              .array(foodReasonEnum)
              .optional()
              .describe("Updated eating reasons"),
            mealType: mealTypeEnum
              .optional()
              .describe("Updated meal type"),
            protein: z
              .number()
              .nullable()
              .optional()
              .describe("Updated protein grams"),
            carbs: z
              .number()
              .nullable()
              .optional()
              .describe("Updated carbs grams"),
            fat: z
              .number()
              .nullable()
              .optional()
              .describe("Updated fat grams"),
            calories: z
              .number()
              .nullable()
              .optional()
              .describe("Updated calories"),
            onPath: z
              .union([z.enum(["yes", "no"]), z.boolean()])
              .optional()
              .describe("Updated on-path status"),
            portionSize: z
              .number()
              .nullable()
              .optional()
              .describe("Updated portion size"),
            healthiness: z
              .number()
              .nullable()
              .optional()
              .describe("Updated healthiness rating"),
            date: tzDateSchema
              .nullable()
              .optional()
              .describe("Updated date"),
          })
          .refine(
            (d) =>
              d.title !== undefined ||
              d.reasons !== undefined ||
              d.mealType !== undefined ||
              d.protein !== undefined ||
              d.carbs !== undefined ||
              d.fat !== undefined ||
              d.calories !== undefined ||
              d.onPath !== undefined ||
              d.portionSize !== undefined ||
              d.healthiness !== undefined ||
              d.date !== undefined,
            {
              message: "At least one field must be provided to update",
            },
          )
          .describe("Fields to update"),
      },
    },
    async ({ id, data }) => {
      try {
        const result = await wrapSdkCall(
          Food.foodLogsUpdate({ path: { id }, body: { data } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- delete_food_log ----------------------------------------------------------
  server.registerTool(
    "delete_food_log",
    {
      description: "Delete a food log by ID.",
      inputSchema: {
        id: z.string().min(1).describe("The food log ID to delete"),
      },
    },
    async ({ id }) => {
      try {
        const result = await wrapSdkCall(
          Food.foodLogsDelete({ path: { id } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- delete_many_food_logs ----------------------------------------------------
  server.registerTool(
    "delete_many_food_logs",
    {
      description: "Delete multiple food logs by their IDs.",
      inputSchema: {
        ids: z
          .array(z.string().min(1))
          .min(1)
          .describe("Array of food log IDs to delete"),
      },
    },
    async ({ ids }) => {
      try {
        const result = await wrapSdkCall(
          Food.foodLogsDeleteMany({ body: { ids } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- get_food_calories_stats --------------------------------------------------
  server.registerTool(
    "get_food_calories_stats",
    {
      description:
        "Get total calories and calorie goal stats for a date. Omit date for today.",
      inputSchema: {
        date: ymdDateSchema
          .optional()
          .describe("Date to get calorie stats for (year, month, day)"),
      },
    },
    async ({ date }) => {
      try {
        const result = await wrapSdkCall(
          Food.foodLogsGetCaloriesStats({ body: { date } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- get_food_protein_stats ---------------------------------------------------
  server.registerTool(
    "get_food_protein_stats",
    {
      description:
        "Get total protein and protein goal stats for a date. Omit date for today.",
      inputSchema: {
        date: ymdDateSchema
          .optional()
          .describe("Date to get protein stats for (year, month, day)"),
      },
    },
    async ({ date }) => {
      try {
        const result = await wrapSdkCall(
          Food.foodLogsGetProteinStats({ body: { date } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- get_food_carbs_stats -----------------------------------------------------
  server.registerTool(
    "get_food_carbs_stats",
    {
      description:
        "Get total carbs and carbs goal stats for a date. Omit date for today.",
      inputSchema: {
        date: ymdDateSchema
          .optional()
          .describe("Date to get carbs stats for (year, month, day)"),
      },
    },
    async ({ date }) => {
      try {
        const result = await wrapSdkCall(
          Food.foodLogsGetCarbsStats({ body: { date } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
}
