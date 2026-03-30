import { BenjiApiError } from "@dneighbors/benji-sdk";
import { z } from "zod";

/** Year/month/day date schema with range validation. */
export const ymdDateSchema = z.object({
  year: z.number().int().min(1900).max(2100).describe("Year (e.g. 2026)"),
  month: z.number().int().min(1).max(12).describe("Month (1-12)"),
  day: z.number().int().min(1).max(31).describe("Day of month (1-31)"),
});

/** Timezone-aware date schema for create/update operations. */
export const tzDateSchema = z.object({
  timezone: z.string().min(1).describe("IANA timezone, e.g. America/New_York"),
  dateInUsersTimezone: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}/, "Must start with YYYY-MM-DD date format")
    .describe("ISO date string in user's timezone, e.g. 2026-03-28"),
});

/**
 * Recursively strip null, undefined, empty strings, and empty arrays
 * from an object tree. Preserves false, 0, and non-empty values.
 */
function compact(data: unknown): unknown {
  if (data === null || data === undefined) return undefined;

  if (Array.isArray(data)) {
    const compacted = data.map(compact).filter((v) => v !== undefined);
    return compacted.length > 0 ? compacted : undefined;
  }

  if (typeof data === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      const compacted = compact(value);
      if (
        compacted !== undefined &&
        compacted !== "" &&
        !(Array.isArray(compacted) && compacted.length === 0)
      ) {
        result[key] = compacted;
      }
    }
    return Object.keys(result).length > 0 ? result : undefined;
  }

  return data;
}

/**
 * Return a structured MCP success result.
 * Strips null/empty values to reduce token usage for AI consumers.
 */
export function toolResult(data: unknown) {
  const compacted = compact(data) ?? { success: true };
  return {
    content: [{ type: "text" as const, text: JSON.stringify(compacted) }],
  };
}

/**
 * Return a structured MCP error result.
 */
export function handleToolError(error: unknown) {
  if (error instanceof BenjiApiError) {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            code: error.code,
            message: error.message,
            ...(error.issues && { issues: error.issues }),
          }),
        },
      ],
      isError: true,
    };
  }
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          code: "UNKNOWN_ERROR",
          message: error instanceof Error ? error.message : String(error),
        }),
      },
    ],
    isError: true,
  };
}
