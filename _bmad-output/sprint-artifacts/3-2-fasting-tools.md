# Story 3.2: Fasting tools

Status: done

## Story

As an AI assistant,
I want MCP tools for Benji fasting tracking,
so that I can start and end fasts, view active fasts, list fasting history, update or delete fasts, and check fasting stats.

## Acceptance Criteria

1. **AC-1: start_fast tool**
   - **Given** a valid API key
   - **When** `start_fast` is called with optional `hours` (goal) and optional `startTime` object (`timezone`, `dateInUsersTimezone`)
   - **Then** starts a new fast and returns the fast object with its `id`, `goal`, `startTime`, `endTime`
   - **And** returns an error with structured message on API failure

2. **AC-2: end_fast tool**
   - **Given** a valid fast ID of an active fast
   - **When** `end_fast` is called with `fastId` (required) and optional `timeAgoMinutes`
   - **Then** ends the fast and returns a success response
   - **And** returns an error with structured message on API failure

3. **AC-3: get_active_fast tool**
   - **Given** a valid API key
   - **When** `get_active_fast` is called with no parameters
   - **Then** returns the active fast object (or null if no fast is active) along with optional progress stats
   - **And** returns an error with structured message on API failure

4. **AC-4: get_fasting_stats tool**
   - **Given** a valid API key
   - **When** `get_fasting_stats` is called with no parameters
   - **Then** returns fasting statistics (percentage, fastedHours, goalHours, hasActiveFast)
   - **And** returns an error with structured message on API failure

5. **AC-5: list_fasts tool**
   - **Given** a valid API key
   - **When** `list_fasts` is called with optional `dateFrom` and `dateTo` strings
   - **Then** returns a structured JSON array of fast objects
   - **And** returns an error with structured message on API failure

6. **AC-6: get_fast tool**
   - **Given** a valid fast ID
   - **When** `get_fast` is called with the ID
   - **Then** returns the fast object with `id`, `goal`, `startTime`, `endTime`, `userId`
   - **And** returns an error with structured message on API failure

7. **AC-7: update_fast tool**
   - **Given** a valid fast ID and at least one field to update
   - **When** `update_fast` is called with `id` and a `data` object of updatable fields (goal, startTime, endTime)
   - **Then** updates the fast and returns a success response
   - **And** returns an error with structured message on API failure

8. **AC-8: delete_fast tool**
   - **Given** a valid fast ID
   - **When** `delete_fast` is called with the ID
   - **Then** deletes the fast and returns a success response
   - **And** returns an error with structured message on API failure

9. **AC-9: JSON schema validation on all tools**
   - **And** every tool has a zod-based input schema that validates parameters before calling the SDK
   - **And** invalid input returns a structured MCP error (isError: true) without hitting the API

10. **AC-10: Consistent structured responses**
    - **And** all successful responses use `{ content: [{ type: "text", text: JSON.stringify(result) }] }`
    - **And** all error responses use `{ content: [{ type: "text", text: JSON.stringify(errorObject) }], isError: true }`
    - **And** error objects include `code`, `message`, and optional `issues` array

11. **AC-11: Build succeeds**
    - **Given** the new tool registration files
    - **When** I run `pnpm --filter benji-mcp build`
    - **Then** the build succeeds with no TypeScript errors
    - **And** `pnpm build` (root-level recursive build) still succeeds for all packages

12. **AC-12: Tools appear in tools/list**
    - **Given** the server is running
    - **When** a client sends `tools/list`
    - **Then** all 8 fasting tools appear with their names, descriptions, and input schemas

## Tasks / Subtasks

### Task Group A: File setup and wiring (AC: #9, #10, #11)

- [x] **Task 1: Create `packages/benji-mcp/src/tools/fasting.ts` with tool registration function** (AC: #9, #10, #11)
  - Create `fasting.ts` that exports a `registerFastingTools(server: McpServer)` function
  - Import `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js`
  - Import `z` from `zod`
  - Import `Fasting`, `wrapSdkCall` from `benji-sdk`
  - Import `toolResult`, `handleToolError` from `./util.js` (shared helpers from Epic 2)
  - Do NOT re-declare toolResult/handleToolError locally -- use the shared util module
  - Define shared `tzDateSchema` locally (same pattern as hydration.ts):
    ```
    const tzDateSchema = z.object({
      timezone: z.string().describe("IANA timezone, e.g. America/New_York"),
      dateInUsersTimezone: z.string().describe("ISO date string in user's timezone, e.g. 2026-03-28"),
    });
    ```

- [x] **Task 2: Wire tool registration into server.ts** (AC: #11, #12)
  - In `packages/benji-mcp/src/server.ts`:
    - Import `registerFastingTools` from `./tools/fasting.js`
    - Call `registerFastingTools(mcpServer)` after `registerHydrationTools(mcpServer)`

### Task Group B: Tool implementations (AC: #1 through #8) -- parallelizable

- [x] **Task 3: Implement `start_fast` tool** (AC: #1, #9, #10)
  - Register tool via `server.registerTool("start_fast", { ... }, callback)`
  - Description: `"Start a new fast. Optionally specify a goal duration in hours and a start time."`
  - Input schema (zod):
    ```
    hours: z.number().positive().nullable().optional().describe("Goal duration in hours (e.g. 16 for 16:8 intermittent fasting)")
    startTime: tzDateSchema.nullable().optional().describe("When the fast started. If omitted, starts now.")
    ```
  - Callback: `wrapSdkCall(Fasting.fastingStart({ body: { hours, startTime } }))`
  - Wrap in try/catch, catch returns `handleToolError(error)`

- [x] **Task 4: Implement `end_fast` tool** (AC: #2, #9, #10)
  - Description: `"End an active fast. Provide the fast ID. Optionally specify how many minutes ago the fast ended."`
  - Input schema (zod):
    ```
    fastId: z.string().describe("The ID of the active fast to end")
    timeAgoMinutes: z.number().int().min(0).optional().describe("How many minutes ago the fast actually ended (if not ending right now)")
    ```
  - **IMPORTANT:** End uses body-based parameters, NOT path-based: `Fasting.fastingEnd({ body: { fastId, timeAgoMinutes } })`
  - Callback: `wrapSdkCall(Fasting.fastingEnd({ body: { fastId, timeAgoMinutes } }))`

- [x] **Task 5: Implement `get_active_fast` tool** (AC: #3, #9, #10)
  - Description: `"Get the currently active fast, if any. Returns the fast details and progress stats, or null if no fast is active."`
  - Input schema (zod): `{}` (no parameters)
  - Callback: `wrapSdkCall(Fasting.fastingGetActive())`
  - Note: `FastingGetActiveData` has `body?: never`, `path?: never`, `query?: never` -- pass no options or empty options

- [x] **Task 6: Implement `get_fasting_stats` tool** (AC: #4, #9, #10)
  - Description: `"Get fasting statistics. Returns overall percentage, fasted hours, goal hours, and whether a fast is active."`
  - Input schema (zod): `{}` (no parameters)
  - Callback: `wrapSdkCall(Fasting.fastingGetStats())`
  - Note: `FastingGetStatsData` has `body?: never`, `path?: never`, `query?: never` -- pass no options or empty options

- [x] **Task 7: Implement `list_fasts` tool** (AC: #5, #9, #10)
  - Description: `"List fasts. Optionally filter by date range using dateFrom and dateTo (ISO date strings, e.g. 2026-03-01)."`
  - Input schema (zod):
    ```
    dateFrom: z.string().optional().describe("Start of date range (ISO date string, e.g. 2026-03-01)")
    dateTo: z.string().optional().describe("End of date range (ISO date string, e.g. 2026-03-31)")
    ```
  - Callback: `wrapSdkCall(Fasting.fastingList({ body: { dateFrom, dateTo } }))`

- [x] **Task 8: Implement `get_fast` tool** (AC: #6, #9, #10)
  - Description: `"Get a single fast by ID."`
  - Input schema (zod):
    ```
    id: z.string().describe("The fast ID to retrieve")
    ```
  - **IMPORTANT:** Get uses path-based ID: `Fasting.fastingGet({ path: { id } })`
  - Callback: `wrapSdkCall(Fasting.fastingGet({ path: { id } }))`

- [x] **Task 9: Implement `update_fast` tool** (AC: #7, #9, #10)
  - Description: `"Update an existing fast. Provide the fast ID and the fields to update."`
  - Input schema (zod):
    ```
    id: z.string().describe("The fast ID to update")
    data: z.object({
      goal: z.number().positive().nullable().optional().describe("Goal duration in hours"),
      startTime: tzDateSchema.nullable().optional().describe("Start time of the fast"),
      endTime: tzDateSchema.nullable().optional().describe("End time of the fast"),
    }).describe("Fields to update")
    ```
  - **IMPORTANT:** Update uses path-based ID + body data: `Fasting.fastingUpdate({ path: { id }, body: { data } })`
  - Callback: `wrapSdkCall(Fasting.fastingUpdate({ path: { id }, body: { data } }))`

- [x] **Task 10: Implement `delete_fast` tool** (AC: #8, #9, #10)
  - Description: `"Delete a fast by ID."`
  - Input schema (zod):
    ```
    id: z.string().describe("The fast ID to delete")
    ```
  - **IMPORTANT:** Delete uses path-based ID: `Fasting.fastingDelete({ path: { id } })`
  - Callback: `wrapSdkCall(Fasting.fastingDelete({ path: { id } }))`

### Task Group C: Build and verification (AC: #11, #12)

- [x] **Task 11: Verify build** (AC: #11)
  - Run `pnpm --filter benji-mcp build` -- must succeed with no TypeScript errors
  - Run `pnpm build` (root recursive) -- must succeed for all three packages
  - Verify `packages/benji-mcp/dist/tools/fasting.js` exists in compiled output

- [x] **Task 12: Verify tools appear in tools/list** (AC: #12)
  - Start the server with `BENJI_API_KEY=test-key`
  - Send `initialize` and `notifications/initialized` followed by `tools/list`
  - Verify all 8 tools appear: `start_fast`, `end_fast`, `get_active_fast`, `get_fasting_stats`, `list_fasts`, `get_fast`, `update_fast`, `delete_fast`
  - Verify each tool has a `name`, `description`, and `inputSchema` with correct properties

- [ ] **Task 13: Verify tool invocation with real API** (AC: #1 through #8) -- OPTIONAL (requires real API key)
  - Set real `BENJI_API_KEY` in environment
  - Test `start_fast` with `{ "hours": 16 }` -- verify returns fast object with `id`
  - Test `get_active_fast` with `{}` -- verify returns active fast with stats
  - Test `get_fasting_stats` with `{}` -- verify returns stats with percentage, fastedHours, goalHours
  - Test `list_fasts` with `{}` -- verify structured response with array of fast objects
  - Test `get_fast` with the started fast ID -- verify returns fast object
  - Test `update_fast` with `{ "id": "<id>", "data": { "goal": 18 } }` -- verify returns success
  - Test `end_fast` with `{ "fastId": "<id>" }` -- verify returns success response
  - Test `delete_fast` with the fast ID -- verify returns success response
  - Test error handling: call `delete_fast` with invalid ID -- verify structured error response with `isError: true`

## Dev Notes

### SDK Method Reference (Exact Signatures)

All methods are on the `Fasting` class exported from `benji-sdk`. The Fasting API uses a **mixed pattern**: CRUD operations on individual fasts use path-based IDs (like Hydration), while action endpoints (start, end, list, get-active, get-stats) use body-based parameters or no parameters.

| MCP Tool | SDK Method | Path Params | Body Type | Required Fields |
|----------|-----------|-------------|-----------|-----------------|
| `start_fast` | `Fasting.fastingStart(options?)` | None | `{ hours?: number \| null, startTime?: { timezone, dateInUsersTimezone } \| null }` | None (all optional) |
| `end_fast` | `Fasting.fastingEnd(options)` | None | `{ fastId: string, timeAgoMinutes?: number }` | `fastId` (body) |
| `get_active_fast` | `Fasting.fastingGetActive(options?)` | None | `body?: never` | None |
| `get_fasting_stats` | `Fasting.fastingGetStats(options?)` | None | `body?: never` | None |
| `list_fasts` | `Fasting.fastingList(options?)` | None | `{ dateFrom?: string, dateTo?: string }` | None (all optional) |
| `get_fast` | `Fasting.fastingGet(options)` | `{ id }` | `body?: never` | `id` (path) |
| `update_fast` | `Fasting.fastingUpdate(options)` | `{ id }` | `{ data: { goal?, startTime?, endTime? } }` | `id` (path), `data` (body) |
| `delete_fast` | `Fasting.fastingDelete(options)` | `{ id }` | `body?: never` | `id` (path) |

### Mixed Path vs Body Parameter Pattern

The Fasting SDK class uses **both** patterns depending on the operation type:

```typescript
// Path-based (CRUD on individual fasts -- same pattern as Hydration):
Fasting.fastingDelete({ path: { id } })
Fasting.fastingUpdate({ path: { id }, body: { data } })
Fasting.fastingGet({ path: { id } })

// Body-based (action endpoints):
Fasting.fastingStart({ body: { hours, startTime } })
Fasting.fastingEnd({ body: { fastId, timeAgoMinutes } })
Fasting.fastingList({ body: { dateFrom, dateTo } })

// No parameters:
Fasting.fastingGetActive()
Fasting.fastingGetStats()
```

This is confirmed by the type definitions:
- `FastingDeleteData` has `body?: never` and `path: { id: string }`
- `FastingGetData` has `body?: never` and `path: { id: string }`
- `FastingUpdateData` has `body: { data: { ... } }` and `path: { id: string }`
- `FastingEndData` has `body: { fastId: string, timeAgoMinutes?: number }` and `path?: never`
- `FastingStartData` has `body?: { hours?, startTime? }` and `path?: never`
- `FastingGetActiveData` has `body?: never` and `path?: never`
- `FastingGetStatsData` has `body?: never` and `path?: never`

### Fast Object Response Shape

From `FastingGetResponses` / `FastingListResponses` / `FastingStartResponses`:
```typescript
{
  id: string;
  goal: number;
  startTime: string;
  endTime: string | null;
  userId: string;
}
```

### Active Fast Response Shape

From `FastingGetActiveResponses`:
```typescript
{
  activeFast: {
    id: string;
    goal: number;
    startTime: string;
    endTime: string | null;
    userId: string;
  } | null;
  stats?: {
    fastedHoursFormattedToHrsAndMins: string;
    progress: number;
    predictedEndTime: string;
    roundedProgress: number;
    progressPercentage: string;
    timeLeft: string;
    isFastingDone: boolean;
  };
}
```

### Fasting Stats Response Shape

From `FastingGetStatsResponses`:
```typescript
{
  percentage: number;
  fastedHours: number;
  goalHours: number;
  hasActiveFast: boolean;
}
```

### Success Response Shape (Delete, Update, End)

From `FastingDeleteResponses` / `FastingUpdateResponses` / `FastingEndResponses`:
```typescript
{
  success: boolean;
}
```

### MCP Tool Registration Pattern

Follow the exact same pattern from `hydration.ts`, importing shared helpers from `util.ts`:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Fasting, wrapSdkCall } from "benji-sdk";
import { toolResult, handleToolError } from "./util.js";

const tzDateSchema = z.object({
  timezone: z.string().describe("IANA timezone, e.g. America/New_York"),
  dateInUsersTimezone: z.string().describe("ISO date string in user's timezone, e.g. 2026-03-28"),
});

export function registerFastingTools(server: McpServer): void {
  // start_fast -- body-based, optional params
  server.registerTool("start_fast", { ... }, async ({ hours, startTime }) => {
    try {
      const result = await wrapSdkCall(Fasting.fastingStart({ body: { hours, startTime } }));
      return toolResult(result);
    } catch (error) {
      return handleToolError(error);
    }
  });

  // end_fast -- body-based, fastId required
  server.registerTool("end_fast", { ... }, async ({ fastId, timeAgoMinutes }) => {
    try {
      const result = await wrapSdkCall(Fasting.fastingEnd({ body: { fastId, timeAgoMinutes } }));
      return toolResult(result);
    } catch (error) {
      return handleToolError(error);
    }
  });

  // get_active_fast -- no params
  server.registerTool("get_active_fast", { ... }, async () => {
    try {
      const result = await wrapSdkCall(Fasting.fastingGetActive());
      return toolResult(result);
    } catch (error) {
      return handleToolError(error);
    }
  });

  // delete_fast -- path-based ID (same pattern as hydration delete)
  server.registerTool("delete_fast", { ... }, async ({ id }) => {
    try {
      const result = await wrapSdkCall(Fasting.fastingDelete({ path: { id } }));
      return toolResult(result);
    } catch (error) {
      return handleToolError(error);
    }
  });

  // update_fast -- path + body (same pattern as hydration update)
  server.registerTool("update_fast", { ... }, async ({ id, data }) => {
    try {
      const result = await wrapSdkCall(Fasting.fastingUpdate({ path: { id }, body: { data } }));
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

- All relative imports MUST use `.js` extensions: `./tools/fasting.js`
- Package imports use bare specifiers: `benji-sdk`, `zod`
- MCP SDK imports use deep paths: `@modelcontextprotocol/sdk/server/mcp.js`

### Additional SDK Method Not Exposed

The `Fasting` class also has `fastingGetDashboardInfo` (get dashboard-specific info). This is not exposed as an MCP tool because it is dashboard/UI-specific and its data overlaps with `get_active_fast` and `get_fasting_stats`. If needed in the future, it can be added as a separate tool.

### File Structure After This Story

```
packages/benji-mcp/
  src/
    index.ts          (UNCHANGED)
    server.ts         (MODIFIED -- imports and calls registerFastingTools)
    tools/
      todos.ts        (UNCHANGED)
      tags.ts         (UNCHANGED)
      projects.ts     (UNCHANGED)
      todo-lists.ts   (UNCHANGED)
      habits.ts       (UNCHANGED)
      mood.ts         (UNCHANGED)
      util.ts         (UNCHANGED)
      hydration.ts    (UNCHANGED)
      fasting.ts      (NEW -- 8 tool registrations)
```

### Project Structure Notes

- Alignment: follows the exact same module structure established in Epic 2 (one file per resource in `tools/`, exported register function, wired in `server.ts`)
- Shared `toolResult`/`handleToolError` from `./util.js` (extracted in Epic 2 final PR)
- No conflicts or variances expected
- The mixed path-based + body-based pattern is a slight variation from Hydration (which was purely path-based for CRUD + body-based for list/stats) -- Fasting adds body-based `end` with `fastId` in body rather than path
- Shared `tzDateSchema` defined locally in fasting.ts (same pattern as hydration.ts)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 3, Story 3.2 -- acceptance criteria and technical notes]
- [Source: _bmad-output/sprint-artifacts/3-1-hydration-tools.md -- reference story format and pattern]
- [Source: packages/benji-mcp/src/tools/hydration.ts -- reference implementation for tool registration pattern, shared date schemas]
- [Source: packages/benji-mcp/src/tools/util.ts -- shared toolResult and handleToolError helpers]
- [Source: packages/benji-mcp/src/server.ts -- createServer() factory function, tool wiring]
- [Source: packages/benji-sdk/src/client/sdk.gen.ts lines 1845-1978 -- Fasting class with all 9 static methods]
- [Source: packages/benji-sdk/src/client/types.gen.ts lines 10758-11205 -- FastingDeleteData through FastingEndResponse types]
- [Source: packages/benji-sdk/src/client/index.ts line 3 -- Fasting class exported from SDK]
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

- All 13 tasks completed (Task 13 optional/skipped -- requires real API key)
- `pnpm --filter benji-mcp build` passes with zero TS errors
- `pnpm build` (root recursive) passes for all 3 packages
- All 8 fasting tools verified in tools/list: start_fast, end_fast, get_active_fast, get_fasting_stats, list_fasts, get_fast, update_fast, delete_fast
- Mixed path-based (get/update/delete) and body-based (start/end/list) parameter patterns implemented per SDK types
- Shared `toolResult`/`handleToolError` imported from `./util.js`; local `tzDateSchema` defined (same pattern as hydration.ts)

### File List

- `packages/benji-mcp/src/tools/fasting.ts` (NEW -- 8 tool registrations)
- `packages/benji-mcp/src/server.ts` (MODIFIED -- import + call registerFastingTools)
