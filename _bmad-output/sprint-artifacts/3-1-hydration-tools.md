# Story 3.1: Hydration tools

Status: done

## Story

As an AI assistant,
I want MCP tools for Benji hydration tracking,
so that I can log water intake, view hydration logs, update and delete entries, and check hydration stats.

## Acceptance Criteria

1. **AC-1: list_hydration_logs tool**
   - **Given** a valid API key
   - **When** `list_hydration_logs` is called with an optional date object (`year`, `month`, `day`)
   - **Then** returns a structured JSON array of hydration logs
   - **And** returns an error with structured message on API failure

2. **AC-2: create_hydration_log tool**
   - **Given** valid input with an `amount` number (required)
   - **When** `create_hydration_log` is called with amount and optional fields (name, date, countsTowardGoal, type)
   - **Then** creates and returns the hydration log with its `id`
   - **And** returns an error with structured message on API failure

3. **AC-3: update_hydration_log tool**
   - **Given** a valid hydration log ID and at least one field to update
   - **When** `update_hydration_log` is called with `id` and a `data` object of updatable fields
   - **Then** updates and returns the hydration log
   - **And** returns an error with structured message on API failure

4. **AC-4: delete_hydration_log tool**
   - **Given** a valid hydration log ID
   - **When** `delete_hydration_log` is called with the ID
   - **Then** deletes the hydration log and returns a success response
   - **And** returns an error with structured message on API failure

5. **AC-5: get_hydration_stats tool**
   - **Given** a valid API key
   - **When** `get_hydration_stats` is called with an optional date object (`year`, `month`, `day`)
   - **Then** returns aggregated hydration stats (totalAmountMl, goalAmountMl, percentage, unit, hydrationUnit)
   - **And** returns an error with structured message on API failure

6. **AC-6: JSON schema validation on all tools**
   - **And** every tool has a zod-based input schema that validates parameters before calling the SDK
   - **And** invalid input returns a structured MCP error (isError: true) without hitting the API

7. **AC-7: Consistent structured responses**
   - **And** all successful responses use `{ content: [{ type: "text", text: JSON.stringify(result) }] }`
   - **And** all error responses use `{ content: [{ type: "text", text: JSON.stringify(errorObject) }], isError: true }`
   - **And** error objects include `code`, `message`, and optional `issues` array

8. **AC-8: Build succeeds**
   - **Given** the new tool registration files
   - **When** I run `pnpm --filter benji-mcp build`
   - **Then** the build succeeds with no TypeScript errors
   - **And** `pnpm build` (root-level recursive build) still succeeds for all packages

9. **AC-9: Tools appear in tools/list**
   - **Given** the server is running
   - **When** a client sends `tools/list`
   - **Then** all 5 hydration tools appear with their names, descriptions, and input schemas

## Tasks / Subtasks

### Task Group A: File setup and wiring (AC: #6, #7, #8)

- [x] **Task 1: Create `packages/benji-mcp/src/tools/hydration.ts` with tool registration function** (AC: #6, #7, #8)
  - Create `hydration.ts` that exports a `registerHydrationTools(server: McpServer)` function
  - Import `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js`
  - Import `z` from `zod`
  - Import `Hydration`, `wrapSdkCall` from `benji-sdk`
  - Import `toolResult`, `handleToolError` from `./util.js` (shared helpers from Epic 2)
  - Do NOT re-declare toolResult/handleToolError locally -- use the shared util module

- [x] **Task 2: Wire tool registration into server.ts** (AC: #8, #9)
  - In `packages/benji-mcp/src/server.ts`:
    - Import `registerHydrationTools` from `./tools/hydration.js`
    - Call `registerHydrationTools(mcpServer)` after `registerMoodTools(mcpServer)`

### Task Group B: Tool implementations (AC: #1, #2, #3, #4, #5) -- parallelizable

- [x] **Task 3: Implement `list_hydration_logs` tool** (AC: #1, #6, #7)
  - Register tool via `server.registerTool("list_hydration_logs", { ... }, callback)`
  - Description: `"List hydration logs. Optionally filter by date (year, month, day)."`
  - Input schema (zod):
    ```
    date: z.object({
      year: z.number().describe("Year (e.g. 2026)"),
      month: z.number().describe("Month (1-12)"),
      day: z.number().describe("Day of month (1-31)"),
    }).optional().describe("Filter hydration logs by date")
    ```
  - Callback: calls `wrapSdkCall(Hydration.hydrationLogsList({ body: { date } }))`, returns `toolResult(result)`
  - Wrap in try/catch, catch returns `handleToolError(error)`

- [x] **Task 4: Implement `create_hydration_log` tool** (AC: #2, #6, #7)
  - Description: `"Create a new hydration log. Amount is required. Type defaults to Water."`
  - Input schema (zod):
    ```
    amount: z.number().describe("Amount of liquid in user's preferred unit")
    name: z.string().nullable().optional().describe("Optional name/label for the log")
    date: z.object({
      timezone: z.string().describe("IANA timezone, e.g. America/New_York"),
      dateInUsersTimezone: z.string().describe("ISO date string in user's timezone, e.g. 2026-03-28"),
    }).nullable().optional().describe("Date of the hydration log. If omitted, uses server default.")
    countsTowardGoal: z.boolean().optional().describe("Whether this counts toward the daily hydration goal. Defaults to true.")
    type: z.enum(["Water", "Coffee", "Tea", "Other"]).optional().describe("Type of liquid. Defaults to Water.")
    ```
  - Callback: `wrapSdkCall(Hydration.hydrationLogsCreate({ body: { amount, name, date, countsTowardGoal, type } }))`

- [x] **Task 5: Implement `update_hydration_log` tool** (AC: #3, #6, #7)
  - Description: `"Update an existing hydration log. Provide the log ID and the fields to update."`
  - Input schema (zod):
    ```
    id: z.string().describe("The hydration log ID to update")
    data: z.object({
      name: z.string().nullable().optional().describe("Name/label for the log"),
      amount: z.number().optional().describe("Amount of liquid"),
      date: z.object({
        timezone: z.string().describe("IANA timezone"),
        dateInUsersTimezone: z.string().describe("ISO date string in user's timezone"),
      }).nullable().optional().describe("Date of the hydration log"),
      countsTowardGoal: z.boolean().optional().describe("Whether this counts toward the daily goal"),
      type: z.enum(["Water", "Coffee", "Tea", "Other"]).optional().describe("Type of liquid"),
    }).describe("Fields to update")
    ```
  - **IMPORTANT:** Hydration update uses `path: { id }` + `body: { data }`, NOT `body: { id, data }`
  - Callback: `wrapSdkCall(Hydration.hydrationLogsUpdate({ path: { id }, body: { data } }))`

- [x] **Task 6: Implement `delete_hydration_log` tool** (AC: #4, #6, #7)
  - Description: `"Delete a hydration log by ID"`
  - Input schema (zod):
    ```
    id: z.string().describe("The hydration log ID to delete")
    ```
  - **IMPORTANT:** Hydration delete uses `path: { id }`, NOT `body: { id }`
  - Callback: `wrapSdkCall(Hydration.hydrationLogsDelete({ path: { id } }))`

- [x] **Task 7: Implement `get_hydration_stats` tool** (AC: #5, #6, #7)
  - Description: `"Get hydration stats for a date. Returns total amount, goal, percentage, and unit info."`
  - Input schema (zod):
    ```
    date: z.object({
      year: z.number().describe("Year (e.g. 2026)"),
      month: z.number().describe("Month (1-12)"),
      day: z.number().describe("Day of month (1-31)"),
    }).optional().describe("Date to get stats for. If omitted, returns current day stats.")
    ```
  - Callback: `wrapSdkCall(Hydration.hydrationLogsGetStats({ body: { date } }))`

### Task Group C: Build and verification (AC: #8, #9)

- [x] **Task 8: Verify build** (AC: #8)
  - Run `pnpm --filter benji-mcp build` -- must succeed with no TypeScript errors
  - Run `pnpm build` (root recursive) -- must succeed for all three packages
  - Verify `packages/benji-mcp/dist/tools/hydration.js` exists in compiled output

- [x] **Task 9: Verify tools appear in tools/list** (AC: #9)
  - Start the server with `BENJI_API_KEY=test-key`
  - Send `initialize` and `notifications/initialized` followed by `tools/list`
  - Verify all 5 tools appear: `list_hydration_logs`, `create_hydration_log`, `update_hydration_log`, `delete_hydration_log`, `get_hydration_stats`
  - Verify each tool has a `name`, `description`, and `inputSchema` with correct properties

- [ ] **Task 10: Verify tool invocation with real API** (AC: #1 through #5) -- SKIPPED (no real API key)
  - Set real `BENJI_API_KEY` in environment
  - Test `list_hydration_logs` with `{}` -- verify structured response with array of hydration logs
  - Test `create_hydration_log` with `{ "amount": 250 }` -- verify returns hydration log with `id`
  - Test `update_hydration_log` with the created log ID and `{ "data": { "amount": 500 } }` -- verify returns updated log
  - Test `delete_hydration_log` with the created log ID -- verify returns success response
  - Test `get_hydration_stats` with `{}` -- verify returns stats with totalAmountMl, goalAmountMl, percentage
  - Test error handling: call `delete_hydration_log` with invalid ID -- verify structured error response with `isError: true`

## Dev Notes

### SDK Method Reference (Exact Signatures)

All methods are on the `Hydration` class exported from `benji-sdk`. **Critical difference from Epic 2 tools:** The Hydration API uses REST-style path parameters for delete, update, and get operations (i.e., `path: { id }`) rather than body-based IDs. List, create, and stats use `body` as in Epic 2.

| MCP Tool | SDK Method | Path Params | Body Type | Required Fields |
|----------|-----------|-------------|-----------|-----------------|
| `list_hydration_logs` | `Hydration.hydrationLogsList(options)` | None | `{ date?: { year, month, day } }` | None (all optional) |
| `create_hydration_log` | `Hydration.hydrationLogsCreate(options)` | None | `{ amount, name?, date?: { timezone, dateInUsersTimezone } \| null, countsTowardGoal?, type? }` | `amount` |
| `update_hydration_log` | `Hydration.hydrationLogsUpdate(options)` | `{ id }` | `{ data: { name?, amount?, date?, countsTowardGoal?, type? } }` | `id` (path), `data` (body) |
| `delete_hydration_log` | `Hydration.hydrationLogsDelete(options)` | `{ id }` | None (`body?: never`) | `id` (path) |
| `get_hydration_stats` | `Hydration.hydrationLogsGetStats(options)` | None | `{ date?: { year, month, day } }` | None (all optional) |

### Path vs Body Parameter Pattern (KEY DIFFERENCE)

The Hydration SDK class differs from Epic 2 tools (Tags, Mood, etc.) in that delete, update, and get operations use **path parameters** instead of body parameters:

```typescript
// Epic 2 pattern (Tags, Mood -- body-based IDs):
Tags.tagsDelete({ body: { id } })
Mood.moodDelete({ body: { id } })

// Epic 3 Hydration pattern (path-based IDs):
Hydration.hydrationLogsDelete({ path: { id } })
Hydration.hydrationLogsUpdate({ path: { id }, body: { data } })
```

This is because the Hydration API uses RESTful URL paths like `/hydration/logs/{id}` where the ID is in the URL. The type definitions confirm:
- `HydrationLogsDeleteData` has `body?: never` and `path: { id: string }`
- `HydrationLogsUpdateData` has `body: { data: { ... } }` and `path: { id: string }`

### Hydration Log Response Shape

All hydration log objects share this shape (from `HydrationLogsListResponses` / `HydrationLogsCreateResponses` / `HydrationLogsUpdateResponses`):
```typescript
{
  id: string;
  createdAt: string;
  updatedAt: string;
  date: string;
  amount: number;
  name: string | null;
  type: string | null;       // "Water" | "Coffee" | "Tea" | "Other"
  userId: string;
  countsTowardGoal: boolean | null;
  fromGptMessageId: string | null;
}
```

### Hydration Stats Response Shape

From `HydrationLogsGetStatsResponses`:
```typescript
{
  totalAmountMl: number;
  goalAmountMl: number;
  percentage: number;
  unit: string;
  hydrationUnit: string;
}
```

### Delete Response Shape

From `HydrationLogsDeleteResponses`:
```typescript
{
  success: boolean;
}
```

### MCP Tool Registration Pattern

Follow the exact same pattern from `mood.ts` / `habits.ts`, importing shared helpers from `util.ts`:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Hydration, wrapSdkCall } from "benji-sdk";
import { toolResult, handleToolError } from "./util.js";

export function registerHydrationTools(server: McpServer): void {
  // list_hydration_logs -- body-based (same as mood list)
  server.registerTool("list_hydration_logs", { ... }, async ({ date }) => {
    try {
      const result = await wrapSdkCall(Hydration.hydrationLogsList({ body: { date } }));
      return toolResult(result);
    } catch (error) {
      return handleToolError(error);
    }
  });

  // delete_hydration_log -- path-based (DIFFERENT from mood delete!)
  server.registerTool("delete_hydration_log", { ... }, async ({ id }) => {
    try {
      const result = await wrapSdkCall(Hydration.hydrationLogsDelete({ path: { id } }));
      return toolResult(result);
    } catch (error) {
      return handleToolError(error);
    }
  });

  // update_hydration_log -- path + body (DIFFERENT from mood update!)
  server.registerTool("update_hydration_log", { ... }, async ({ id, data }) => {
    try {
      const result = await wrapSdkCall(Hydration.hydrationLogsUpdate({ path: { id }, body: { data } }));
      return toolResult(result);
    } catch (error) {
      return handleToolError(error);
    }
  });
}
```

### wrapSdkCall Error Handling Pattern

The `wrapSdkCall<T>(promise)` function from `benji-sdk`:
- Takes the raw SDK call promise (which returns `{ data?, error?, response }`)
- On success: extracts and returns `data` as type `T`
- On API error (4xx/5xx): throws `BenjiApiError` with `status`, `code`, `message`, `issues`
- On network error: throws `BenjiApiError` with `status: 0`, `code: "NETWORK_ERROR"`
- On empty response: throws `BenjiApiError` with `code: "EMPTY_RESPONSE"`

### ESM Import Requirements

- All relative imports MUST use `.js` extensions: `./tools/hydration.js`
- Package imports use bare specifiers: `benji-sdk`, `zod`
- MCP SDK imports use deep paths: `@modelcontextprotocol/sdk/server/mcp.js`

### File Structure After This Story

```
packages/benji-mcp/
  src/
    index.ts          (UNCHANGED)
    server.ts         (MODIFIED -- imports and calls registerHydrationTools)
    tools/
      todos.ts        (UNCHANGED)
      tags.ts         (UNCHANGED)
      projects.ts     (UNCHANGED)
      todo-lists.ts   (UNCHANGED)
      habits.ts       (UNCHANGED)
      mood.ts         (UNCHANGED)
      util.ts         (UNCHANGED)
      hydration.ts    (NEW -- 5 tool registrations)
```

### Additional SDK Methods Not Exposed

The `Hydration` class also has `hydrationLogsGet` (get single by ID) and `hydrationLogsDeleteMany` (bulk delete) methods. These are not exposed as MCP tools per the Story 3.1 requirements which only requires list, create, update, delete, and stats.

### Project Structure Notes

- Alignment: follows the exact same module structure established in Epic 2 (one file per resource in `tools/`, exported register function, wired in `server.ts`)
- Shared `toolResult`/`handleToolError` from `./util.js` (extracted in Epic 2 final PR)
- No conflicts or variances expected
- The path-based ID pattern for Hydration is the first instance of this in the MCP tools -- it will likely apply to other Epic 3 resources (Fasting, Workouts, Journal, PainEvents) as well, so this story establishes the pattern

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 3, Story 3.1 -- acceptance criteria and technical notes]
- [Source: _bmad-output/sprint-artifacts/2-7-mood-tools.md -- reference story format and pattern]
- [Source: packages/benji-mcp/src/tools/mood.ts -- reference implementation for tool registration pattern]
- [Source: packages/benji-mcp/src/tools/habits.ts -- reference for shared schema patterns]
- [Source: packages/benji-mcp/src/tools/util.ts -- shared toolResult and handleToolError helpers]
- [Source: packages/benji-mcp/src/server.ts -- createServer() factory function, tool wiring]
- [Source: packages/benji-sdk/src/client/sdk.gen.ts lines 1732-1843 -- Hydration class with all 7 static methods]
- [Source: packages/benji-sdk/src/client/types.gen.ts lines 10390-10756 -- HydrationLogsDeleteData through HydrationLogsGetStatsResponse types]
- [Source: packages/benji-sdk/src/client/index.ts line 3 -- Hydration class exported from SDK]
- [Source: packages/benji-sdk/src/wrapper.ts -- wrapSdkCall() implementation]
- [Source: packages/benji-sdk/src/errors.ts -- BenjiError, BenjiConfigError, BenjiApiError classes]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

None.

### Completion Notes List

- Tasks 1-9 completed successfully, all [x] marked
- Task 10 skipped (no real API key available)
- `pnpm --filter benji-mcp build` passes with 0 errors
- `pnpm build` (root recursive) passes for all 3 packages
- All 5 hydration tools verified in tools/list via stdio
- Path-based ID pattern used correctly for delete (`path: { id }`) and update (`path: { id }, body: { data }`)
- Shared `toolResult`/`handleToolError` imported from `./util.js` (no duplication)

### File List

- `packages/benji-mcp/src/tools/hydration.ts` (NEW) -- 5 tool registrations
- `packages/benji-mcp/src/server.ts` (MODIFIED) -- import + call registerHydrationTools
- `_bmad-output/sprint-artifacts/3-1-hydration-tools.md` (MODIFIED) -- task checkboxes + dev record
