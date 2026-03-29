import { BenjiApiError } from "benji-sdk";
import { z } from "zod";

/** Year/month/day date schema with range validation. */
export const ymdDateSchema = z.object({
  year: z.number().int().min(1900).max(2100).describe("Year (e.g. 2026)"),
  month: z.number().int().min(1).max(12).describe("Month (1-12)"),
  day: z.number().int().min(1).max(31).describe("Day of month (1-31)"),
});

/** Timezone-aware date schema for create/update operations. */
export const tzDateSchema = z.object({
  timezone: z.string().describe("IANA timezone, e.g. America/New_York"),
  dateInUsersTimezone: z
    .string()
    .describe("ISO date string in user's timezone, e.g. 2026-03-28"),
});

/**
 * Return a structured MCP success result.
 */
export function toolResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data) }],
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
