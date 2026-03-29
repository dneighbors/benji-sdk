# Story 6.3: Output formatting

**Story key:** `6-3-output-formatting`  
**Epic:** 6 (CLI)  
**Status:** done

## Story

As a user,  
I want a `--json` flag for JSON output and default human-readable output,  
So that I can use the CLI in scripts and interactively.

## Prerequisites

- **Story 6.2** — Implement core commands (`done`): all 19 resource command domains call the real SDK and use `getGlobalOptions` + `outputResult`.

## Background (from 6.1 / 6.2)

| Location | Role |
|----------|------|
| `packages/benji-cli/src/index.ts` | Root program defines global `--json`. |
| `packages/benji-cli/src/output.ts` | `getGlobalOptions(cmd)` walks to root for `{ json }`; `outputResult(data, opts)` currently prints **pretty JSON for both modes** (non-JSON path is the gap). |
| `packages/benji-cli/src/error-handler.ts` | Already branches on JSON vs human text for errors (`process.argv.includes("--json")`). Out of scope unless aligning flag detection with `getGlobalOptions` for consistency. |

**Nineteen resource domains** (each `src/commands/<domain>.ts`): `todos`, `tags`, `projects`, `todo-lists`, `habits`, `mood`, `hydration`, `fasting`, `workouts`, `journal`, `pain-events`, `weight-logs`, `food`, `blood-pressure`, `goals`, `contacts`, `todo-views`, `todo-list-sections`, `project-sections`.

## CLI-for-agents principles (mandatory)

1. **`--json`** — Machine-parseable JSON on stdout (current behavior must remain unchanged: `JSON.stringify(data, null, 2)` or equivalent single JSON document).
2. **Default (no `--json`)** — Human-readable tables and summaries, not raw JSON blobs.
3. **Pipe-friendly** — No ANSI color codes or other decorative terminal sequences that break `|`, `xargs`, or log capture. Plain UTF-8 text only.
4. **Success output** — In both modes, responses must expose **IDs and other key fields** needed for scripting and follow-up commands (`--json` already does; human mode must not hide them).

## Acceptance criteria

1. **AC-1: JSON mode unchanged**  
   Given any successful command,  
   When I pass `--json`,  
   Then stdout is the same structured JSON as today (pretty-printed object/array).

2. **AC-2: Default list output is tabular**  
   Given a command that returns an **array of objects** (e.g. list endpoints),  
   When I omit `--json`,  
   Then stdout is a **fixed-width column table** (header + rows) using spaces/padding only, with columns chosen from common keys (`id`, `title`, `name`, `status`, dates, etc.) up to a reasonable width; overflow may truncate with ellipsis or wrap policy documented in code comments.

3. **AC-3: Default single-object output is key-value**  
   Given a command that returns a **single plain object** (create / update / get),  
   When I omit `--json`,  
   Then stdout is readable **key: value** lines (flat or shallow nested handling defined in implementation).

4. **AC-4: Delete / toggle / minimal success shapes**  
   Given a result that is clearly a **success-with-id** shape (e.g. small object with `id`, or API-specific delete/toggle payload),  
   When I omit `--json`,  
   Then stdout includes an explicit **success line and the resource ID** (and other critical fields if present).

5. **AC-5: Edge cases**  
   Given `null`, empty array, non-object array items, or deeply nested / unknown shapes,  
   When I omit `--json`,  
   Then the CLI still prints a **deterministic, readable** representation (fallback: indented key-value or single-line `String()` policy — avoid throwing).

6. **AC-6: No heavy formatting dependencies**  
   Implementation uses **stdlib only** for layout (e.g. `padEnd`, string concat). Do **not** add `chalk`, `cli-table3`, `columnify`, etc.

7. **AC-7: Optional minimal output flag**  
   Given a new global flag **`--compact`** (or `--quiet` — pick one name and use it consistently),  
   When I use it **without** `--json`,  
   Then success output is **minimal** (e.g. primary `id` only, or `id` + one label), suitable for `xargs` and scripts.  
   When I use `--json`,  
   Then `--compact` is **ignored** or documented as no-op for JSON mode (full JSON remains full JSON).

8. **AC-8: Global wiring**  
   `getGlobalOptions(cmd)` returns `{ json, compact }` (or equivalent), root `index.ts` registers the new option, and **all** `outputResult` call sites continue to work via the expanded options type.

9. **AC-9: Spot-check all 19 domains**  
   For each resource domain, at least one **list** and one **non-list** path (where applicable) is manually or script-checked in default mode for readable output without runtime errors.

10. **AC-10: Build clean**  
    `pnpm --filter benji-cli build` completes with zero TypeScript errors.

## Tasks / subtasks

### Task 1: Create `packages/benji-cli/src/formatters.ts`

- [x] **1.1** Export `formatTable(rows: Record<string, unknown>[], columnKeys: string[]): string`  
  - Compute column widths from header + cell stringification (primitives only; objects → `JSON.stringify` single-line or `[object]` policy).  
  - Header row + separator row optional but readable (e.g. spaces or `-` under header only — no box-drawing if it complicates piping; simple dashes are OK).

- [x] **1.2** Export `pickTableColumns(firstRow: Record<string, unknown>): string[]`  
  - Heuristic: prefer `id`, `title`, `name`, `status`, `completed`, `dueDate`, `createdAt`, `updatedAt`, etc., capped at N columns (e.g. 5–7).  
  - Fallback: first K keys of object in stable order.

- [x] **1.3** Export `formatKeyValue(obj: Record<string, unknown>, depth?: number): string`  
  - One key per line; nested objects indented or JSON single-line for deep values.

- [x] **1.4** Export `formatSuccessMessage(obj: Record<string, unknown>): string | null`  
  - Detect small “operation result” objects (e.g. has `id` and few keys, or known patterns); return `null` if not a match so caller can fall back.

- [x] **1.5** Export `formatHumanUnknown(data: unknown): string`  
  - Last-resort formatting for primitives, arrays of non-objects, etc.

- [x] **1.6** Add **unit tests** under `packages/benji-cli` (e.g. `src/formatters.test.ts` with `node:test` or project test runner) for table padding, column pick, and edge cases — **if** the repo already has a test pattern; otherwise document manual verification in dev notes.

### Task 2: Update `packages/benji-cli/src/output.ts`

- [x] **2.1** Extend `getGlobalOptions` return type and root options parsing for **`--compact`** (or chosen name).

- [x] **2.2** Implement `outputResult(data, opts: { json: boolean; compact: boolean })`  
  - If `opts.json` → existing `JSON.stringify(data, null, 2)`.  
  - Else if `opts.compact` → print minimal line(s) (e.g. extract `id` from object or first element of array).  
  - Else → branch on `data` shape:  
    - `Array.isArray` + non-empty + objects → `formatTable` with `pickTableColumns`.  
    - `Array.isArray` + empty → single line e.g. `(empty)` or `0 items`.  
    - `typeof data === "object" && data !== null` && not Array → try `formatSuccessMessage`, else `formatKeyValue`.  
    - Otherwise → `formatHumanUnknown`.

- [x] **2.3** Remove the TODO / duplicate JSON branch in the non-JSON path.

- [x] **2.4** Ensure **no ANSI** in any code path.

### Task 3: Verify all 19 command domains

- [x] **3.1** Run representative commands per domain (with valid auth / mock if available) without `--json` and confirm no throws and sensible layout.  
- [x] **3.2** Run the same with `--json` and confirm output unchanged from pre-story behavior (spot-check).  
- [x] **3.3** Run with `--compact` on create/list/delete where applicable; confirm minimal stdout.

**Domain checklist (19):**  
`todos`, `tags`, `projects`, `todo-lists`, `habits`, `mood`, `hydration`, `fasting`, `workouts`, `journal`, `pain-events`, `weight-logs`, `food`, `blood-pressure`, `goals`, `contacts`, `todo-views`, `todo-list-sections`, `project-sections`.

### Task 4: Build and verify

- [x] **4.1** `pnpm --filter benji-cli build`  
- [x] **4.2** `benji --help` shows new global flag description alongside `--json`  
- [x] **4.3** Update examples in at least one command’s `--help` “Examples” block to mention human default + `--json` + `--compact` (light touch — match 6.2 style).

## Parallelizable work groups

| Group | Tasks | Depends on | Notes |
|-------|-------|------------|--------|
| **G1** | Task 1 (all subtasks) | Nothing | Pure module + optional tests; can merge before output integration. |
| **G2** | Task 2 | G1 | Single owner; sequential subtasks inside `output.ts`. |
| **G3** | Task 3 | G2 | **19 domains can be verified in parallel** (separate terminals / checklist rows) — no code conflicts. |
| **G4** | Task 4 | G2 (build); G3 (logical) | Final gate. |

**Suggested parallelization:** After G1 lands, one developer does G2; then **split Task 3** across reviewers or a script matrix (19 commands × 2–3 verbs) in parallel.

## Dev notes

- **File map:** `formatters.ts` (new), `output.ts` (update), `index.ts` (new global option), optional tests.
- **`outputResult` signature change:** Update TypeScript types so all call sites type-check (they pass `opts` from `getGlobalOptions` only — one central change).
- **Consistency with errors:** `error-handler.ts` uses argv scanning for `--json`. Consider a follow-up story to use the same mechanism as `getGlobalOptions` if Commander exposes a cleaner pattern; not required for 6.3 acceptance.
- **SDK shapes:** Responses are OpenAPI-generated; heuristics must be **generic**, not per-resource switches, unless a single shared helper maps “list” payloads (e.g. wrapped `{ data: [] }` — confirm actual `wrapSdkCall` return shape and adjust detection accordingly).

## Definition of done

- [x] All acceptance criteria satisfied  
- [x] Story status advanced via team workflow (`in-progress` → `review` → `done`)  
- [x] `sprint-status.yaml` updated when story completes
