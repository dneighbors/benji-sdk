const MAX_COL_WIDTH = 40;
const MAX_COLUMNS = 6;

const PREFERRED_KEYS = [
  "id", "title", "name", "status", "completed", "mood", "weight",
  "dueDate", "createdAt", "updatedAt",
];

function stringify(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "[object]";
    }
  }
  return String(value);
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + "\u2026";
}

export function pickTableColumns(
  firstRow: Record<string, unknown>,
): string[] {
  const available = Object.keys(firstRow);
  const picked: string[] = [];
  for (const key of PREFERRED_KEYS) {
    if (available.includes(key) && picked.length < MAX_COLUMNS) {
      picked.push(key);
    }
  }
  for (const key of available) {
    if (!picked.includes(key) && picked.length < MAX_COLUMNS) {
      picked.push(key);
    }
  }
  return picked;
}

export function formatTable(
  rows: Record<string, unknown>[],
  columnKeys: string[],
): string {
  const widths = columnKeys.map((key) => key.length);

  const stringified = rows.map((row) =>
    columnKeys.map((key, i) => {
      const cell = truncate(stringify(row[key]), MAX_COL_WIDTH);
      widths[i] = Math.min(MAX_COL_WIDTH, Math.max(widths[i], cell.length));
      return cell;
    }),
  );

  const header = columnKeys
    .map((key, i) => key.padEnd(widths[i]))
    .join("  ");
  const separator = widths.map((w) => "-".repeat(w)).join("  ");
  const body = stringified
    .map((cells) =>
      cells.map((cell, i) => cell.padEnd(widths[i])).join("  "),
    )
    .join("\n");

  return `${header}\n${separator}\n${body}`;
}

export function formatKeyValue(
  obj: Record<string, unknown>,
  depth = 0,
): string {
  const indent = "  ".repeat(depth);
  const lines: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      depth < 2
    ) {
      lines.push(`${indent}${key}:`);
      lines.push(
        formatKeyValue(value as Record<string, unknown>, depth + 1),
      );
    } else {
      lines.push(`${indent}${key}: ${stringify(value)}`);
    }
  }
  return lines.join("\n");
}

const SUCCESS_MAX_KEYS = 5;

export function formatSuccessMessage(
  obj: Record<string, unknown>,
): string | null {
  const keys = Object.keys(obj);
  if (!keys.includes("id") || keys.length > SUCCESS_MAX_KEYS) return null;

  const parts = keys.map((k) => `${k}=${stringify(obj[k])}`);
  return `Success: ${parts.join(" ")}`;
}

export function formatHumanUnknown(data: unknown): string {
  if (data === null || data === undefined) return String(data);
  if (typeof data !== "object") return String(data);
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}
