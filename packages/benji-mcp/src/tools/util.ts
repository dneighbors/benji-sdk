import { BenjiApiError } from "benji-sdk";

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
