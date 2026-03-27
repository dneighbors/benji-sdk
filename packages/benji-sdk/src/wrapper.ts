import { BenjiApiError } from "./errors.js";

/**
 * Wraps an SDK call and normalizes errors into BenjiApiError.
 *
 * The @hey-api/openapi-ts client returns { data, error, response } in non-throw mode.
 * This function extracts data on success or throws a BenjiApiError on failure.
 * Network-level errors (DNS failure, connection refused, timeout) are also
 * caught and wrapped as BenjiApiError with status 0.
 *
 * @example
 * ```ts
 * const todos = await wrapSdkCall(Todos.todosList({ body: { screen: "today" } }));
 * // todos is the data, or throws BenjiApiError
 * ```
 */
export async function wrapSdkCall<T>(
  promise: Promise<{ data?: T; error?: unknown; response: Response }>
): Promise<T> {
  let result: { data?: T; error?: unknown; response: Response };

  try {
    result = await promise;
  } catch (networkError) {
    const message = networkError instanceof Error
      ? networkError.message
      : "Network request failed";
    throw new BenjiApiError({
      status: 0,
      code: "NETWORK_ERROR",
      message,
    });
  }

  if (result.error) {
    const status = result.response.status;
    const err = result.error as { message?: string; code?: string; issues?: Array<{ message: string }> };
    throw new BenjiApiError({
      status,
      code: err.code ?? `HTTP_${status}`,
      message: err.message ?? `API request failed with status ${status}`,
      issues: err.issues,
    });
  }

  if (result.data === undefined) {
    throw new BenjiApiError({
      status: result.response.status,
      code: "EMPTY_RESPONSE",
      message: "API returned no data and no error",
    });
  }

  return result.data;
}
