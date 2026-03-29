import { Command } from "commander";
import {
  formatTable,
  pickTableColumns,
  formatKeyValue,
  formatSuccessMessage,
  formatHumanUnknown,
} from "./formatters.js";

/**
 * Extract global options from process.argv so they work regardless of
 * position (before or after the subcommand).  Commander only parses
 * options defined on the command that owns them, so root-level options
 * like --json and --compact are invisible to leaf commands.
 */
export function getGlobalOptions(_cmd: Command): {
  json: boolean;
  compact: boolean;
} {
  return {
    json: process.argv.includes("--json"),
    compact: process.argv.includes("--compact"),
  };
}

function extractId(obj: Record<string, unknown>): string | undefined {
  if ("id" in obj) return String(obj.id);
  return undefined;
}

/** Print result to stdout with mode-appropriate formatting. */
export function outputResult(
  data: unknown,
  opts: { json: boolean; compact: boolean },
): void {
  if (opts.json) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (opts.compact) {
    if (Array.isArray(data)) {
      const ids = data
        .filter((item) => typeof item === "object" && item !== null && "id" in item)
        .map((item) => String((item as Record<string, unknown>).id));
      console.log(ids.join("\n"));
    } else if (typeof data === "object" && data !== null) {
      const id = extractId(data as Record<string, unknown>);
      console.log(id ?? "");
    } else {
      console.log(String(data ?? ""));
    }
    return;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      console.log("(no results)");
      return;
    }
    if (typeof data[0] === "object" && data[0] !== null) {
      const cols = pickTableColumns(data[0] as Record<string, unknown>);
      console.log(
        formatTable(data as Record<string, unknown>[], cols),
      );
      return;
    }
    console.log(formatHumanUnknown(data));
    return;
  }

  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    const success = formatSuccessMessage(obj);
    if (success) {
      console.log(success);
    } else {
      console.log(formatKeyValue(obj));
    }
    return;
  }

  console.log(formatHumanUnknown(data));
}
