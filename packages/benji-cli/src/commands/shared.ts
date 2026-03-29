import { Command } from "commander";

// Known limitation: CLI commands use `as Parameters<...>` casts when calling SDK
// functions with dynamically-built body objects. This is pragmatic for a CLI where
// the body is assembled piecemeal from flags/stdin, but means TypeScript won't
// catch shape mismatches at compile time. The toTzDate/toYmdDate helpers below
// address the most critical cast-through issue (date format mismatch).

/**
 * Read all of stdin and parse as JSON.
 * Exits with code 1 and actionable error if stdin is empty or invalid JSON.
 */
export async function readStdin(): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  const raw = Buffer.concat(chunks).toString("utf-8").trim();
  if (!raw) {
    console.error(
      "Error: No data on stdin. Example: echo '{\"title\":\"test\"}' | benji todos create --stdin"
    );
    process.exit(1);
  }
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      console.error(
        "Error: stdin must be a JSON object. Example: echo '{\"title\":\"test\"}' | benji todos create --stdin"
      );
      process.exit(1);
    }
    return parsed as Record<string, unknown>;
  } catch {
    console.error(
      "Error: Invalid JSON on stdin. Example: echo '{\"title\":\"test\"}' | benji todos create --stdin"
    );
    process.exit(1);
  }
}

/**
 * Require --force on destructive commands. Exits code 1 with actionable error if missing.
 */
export function requireForce(
  cmd: Command,
  resource: string,
  verb: string
): void {
  const opts = cmd.opts();
  if (!opts.force) {
    console.error(
      `Error: --force is required for ${verb}. Example: benji ${resource} ${verb} <id> --force`
    );
    process.exit(1);
  }
}

/**
 * Merge stdin data with explicit CLI options. Explicit opts override stdin values.
 */
export function mergeStdinOpts(
  stdinData: Record<string, unknown>,
  explicitOpts: Record<string, unknown>
): Record<string, unknown> {
  const merged = { ...stdinData };
  for (const [key, value] of Object.entries(explicitOpts)) {
    if (value !== undefined) {
      merged[key] = value;
    }
  }
  return merged;
}

/** Split comma-separated string into trimmed array. */
export function parseCommaSeparated(value: string): string[] {
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

/**
 * Validate YYYY-MM-DD date format. Exits with actionable error if invalid.
 */
export function parseDate(value: string, optionName: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    console.error(
      `Error: Invalid date for ${optionName}. Expected YYYY-MM-DD format. Example: --${optionName} 2026-03-29`
    );
    process.exit(1);
  }
  return value;
}

/** Convert YYYY-MM-DD to tzDate object for create/update operations. */
export function toTzDate(dateStr: string): { timezone: string; dateInUsersTimezone: string } {
  parseDate(dateStr, "date");
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return { timezone, dateInUsersTimezone: dateStr };
}

/** Convert YYYY-MM-DD to ymd object for list/query operations. */
export function toYmdDate(dateStr: string): { year: number; month: number; day: number } {
  parseDate(dateStr, "date");
  const [year, month, day] = dateStr.split("-").map(Number);
  return { year, month, day };
}

/**
 * Parse a numeric string. Exits with actionable error if NaN.
 */
export function parseNumber(value: string, optionName: string): number {
  const n = Number(value);
  if (Number.isNaN(n)) {
    console.error(
      `Error: Invalid number for ${optionName}. Expected a numeric value. Example: --${optionName} 5`
    );
    process.exit(1);
  }
  return n;
}
