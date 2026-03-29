# Story 5.1: Weight Log tools

Status: complete

## Story

As an AI assistant,
I want MCP tools for Benji weight log tracking,
so that I can list weight logs, create entries, get a single entry, update entries, delete entries, bulk-delete entries, get weight settings, update weight unit, get widget data, and get the current active weight goal.

## Acceptance Criteria

1. **AC-1: list_weight_logs tool**
   - **Given** a valid API key
   - **When** `list_weight_logs` is called with optional `date`, `dateFrom`, `dateTo` (ISO date strings)
   - **Then** returns a structured JSON array of weight log objects with `id`, `date`, `weight`, `fatPercentage`, `musclePercentage`, `bonePercentage`, `createdAt`, `updatedAt`
   - **And** returns an error with structured message on API failure

2. **AC-2: create_weight_log tool**
   - **Given** valid input
   - **When** `create_weight_log` is called with required `weight` and nullable `fatPercentage`, `musclePercentage`, `bonePercentage`, and optional `date` (timezone-aware object)
   - **Then** creates and returns the weight log object
   - **And** returns an error with structured message on API failure

3. **AC-3: get_weight_log tool**
   - **Given** a valid weight log ID
   - **When** `get_weight_log` is called with `id`
   - **Then** returns the weight log object with `id`, `date`, `weight`, `fatPercentage`, `musclePercentage`, `bonePercentage`, `createdAt`, `updatedAt`
   - **And** returns an error with structured message on API failure

4. **AC-4: update_weight_log tool**
   - **Given** a valid weight log ID and at least one field to update
   - **When** `update_weight_log` is called with `id` and a `data` object of updatable fields (weight, fatPercentage, musclePercentage, bonePercentage, date)
   - **Then** updates the weight log and returns the updated object
   - **And** returns an error with structured message on API failure

5. **AC-5: delete_weight_log tool**
   - **Given** a valid weight log ID
   - **When** `delete_weight_log` is called with `id`
   - **Then** deletes the weight log and returns a success response with `{ success: true }`
   - **And** returns an error with structured message on API failure

6. **AC-6: delete_many_weight_logs tool**
   - **Given** an array of valid weight log IDs
   - **When** `delete_many_weight_logs` is called with `ids` (non-empty array of strings)
   - **Then** deletes all specified weight logs and returns a success response with `{ success: true }`
   - **And** returns an error with structured message on API failure

7. **AC-7: get_weight_settings tool**
   - **Given** a valid API key
   - **When** `get_weight_settings` is called with no parameters
   - **Then** returns a JSON object with `weightUnit` (`"kg"` or `"lbs"`)
   - **And** returns an error with structured message on API failure

8. **AC-8: update_weight_unit tool**
   - **Given** a valid weight unit value
   - **When** `update_weight_unit` is called with `weightUnit` (`"kg"` or `"lbs"`)
   - **Then** updates the user's weight unit preference and returns `{ success: true }`
   - **And** returns an error with structured message on API failure

9. **AC-9: get_weight_widget tool**
   - **Given** a valid API key
   - **When** `get_weight_widget` is called with no parameters
   - **Then** returns a JSON array of recent weight data points with `id`, `date`, `weight`
   - **And** returns an error with structured message on API failure

10. **AC-10: get_current_weight_goal tool**
    - **Given** a valid API key
    - **When** `get_current_weight_goal` is called with no parameters
    - **Then** returns a JSON object with `goal` (object or null), `startWeight`, `currentWeight`
    - **And** returns an error with structured message on API failure

11. **AC-11: JSON schema validation on all tools**
    - **And** every tool has a zod-based input schema that validates parameters before calling the SDK
    - **And** invalid input returns a structured MCP error (isError: true) without hitting the API

12. **AC-12: Consistent structured responses**
    - **And** all successful responses use `{ content: [{ type: "text", text: JSON.stringify(result) }] }`
    - **And** all error responses use `{ content: [{ type: "text", text: JSON.stringify(errorObject) }], isError: true }`
    - **And** error objects include `code`, `message`, and optional `issues` array

13. **AC-13: Build succeeds**
    - **Given** the new tool registration files
    - **When** I run `pnpm --filter benji-mcp build`
    - **Then** the build succeeds with no TypeScript errors
    - **And** `pnpm build` (root-level recursive build) still succeeds for all packages

14. **AC-14: Tools appear in tools/list**
    - **Given** the server is running
    - **When** a client sends `tools/list`
    - **Then** all 10 weight log tools appear with their names, descriptions, and input schemas

## Tasks / Subtasks

### Task Group A: File setup and wiring (AC: #11, #12, #13)

- [x] **Task 1: Create `packages/benji-mcp/src/tools/weight-logs.ts` with tool registration function** (AC: #11, #12, #13)
  - Create `weight-logs.ts` that exports a `registerWeightLogTools(server: McpServer)` function
  - Import `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js`
  - Import `z` from `zod`
  - Import `WeightLogs`, `wrapSdkCall` from `benji-sdk`
  - Import `toolResult`, `handleToolError`, `tzDateSchema` from `./util.js` (shared helpers)
  - Do NOT re-declare toolResult/handleToolError locally -- use the shared util module

- [x] **Task 2: Wire tool registration into server.ts** (AC: #13, #14)
  - In `packages/benji-mcp/src/server.ts`:
    - Import `registerWeightLogTools` from `./tools/weight-logs.js`
    - Call `registerWeightLogTools(mcpServer)` after `registerPainEventTools(mcpServer)`

### Task Group B: Tool implementations (AC: #1 through #10) -- parallelizable

- [x] **Task 3: Implement `list_weight_logs` tool** (AC: #1, #11, #12)
  - Register tool via `server.registerTool("list_weight_logs", { ... }, callback)`
  - Description: `"List weight logs. Optionally filter by a specific date, or a date range using dateFrom/dateTo. All dates are ISO strings (YYYY-MM-DD)."`
  - Input schema (zod):
    ```
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format").optional().describe("Filter by exact date (YYYY-MM-DD)")
    dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format").optional().describe("Start of date range (YYYY-MM-DD)")
    dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format").optional().describe("End of date range (YYYY-MM-DD)")
    ```
  - **IMPORTANT:** Uses body-based parameters: `WeightLogs.weightLogsList({ body: { date, dateFrom, dateTo } })`
  - Callback: `wrapSdkCall(WeightLogs.weightLogsList({ body: { date, dateFrom, dateTo } }))`
  - Wrap in try/catch, catch returns `handleToolError(error)`
  - **Note:** `WeightLogsListData` has `body?: { date?: string, dateFrom?: string, dateTo?: string }` -- all optional ISO date strings, NOT ymdDateSchema

- [x] **Task 4: Implement `create_weight_log` tool** (AC: #2, #11, #12)
  - Description: `"Create a new weight log entry. Requires weight value. Optionally include body composition percentages and a timezone-aware date."`
  - Input schema (zod):
    ```
    weight: z.number().positive().describe("Weight value in user's preferred unit (kg or lbs)")
    fatPercentage: z.number().min(0).max(100).nullable().optional().describe("Body fat percentage (0-100)")
    musclePercentage: z.number().min(0).max(100).nullable().optional().describe("Muscle mass percentage (0-100)")
    bonePercentage: z.number().min(0).max(100).nullable().optional().describe("Bone mass percentage (0-100)")
    date: tzDateSchema.nullable().optional().describe("When the weight was recorded (timezone and dateInUsersTimezone). Defaults to now if omitted.")
    ```
  - **IMPORTANT:** Create uses body-based parameters: `WeightLogs.weightLogsCreate({ body: { weight, fatPercentage: fatPercentage ?? null, musclePercentage: musclePercentage ?? null, bonePercentage: bonePercentage ?? null, date } })`
  - **Note:** `fatPercentage`, `musclePercentage`, `bonePercentage` are `number | null` in the SDK type (not optional). Pass `null` for undefined values.
  - Callback: `wrapSdkCall(WeightLogs.weightLogsCreate({ body: { weight, fatPercentage: fatPercentage ?? null, musclePercentage: musclePercentage ?? null, bonePercentage: bonePercentage ?? null, date } }))`

- [x] **Task 5: Implement `get_weight_log` tool** (AC: #3, #11, #12)
  - Description: `"Get a single weight log by ID."`
  - Input schema (zod):
    ```
    id: z.string().min(1).describe("The weight log ID to retrieve")
    ```
  - **IMPORTANT:** Get uses body-based ID: `WeightLogs.weightLogsGet({ body: { id } })`
  - Callback: `wrapSdkCall(WeightLogs.weightLogsGet({ body: { id } }))`

- [x] **Task 6: Implement `update_weight_log` tool** (AC: #4, #11, #12)
  - Description: `"Update an existing weight log. Provide the log ID and the fields to update."`
  - Input schema (zod):
    ```
    id: z.string().min(1).describe("The weight log ID to update")
    data: z.object({
      weight: z.number().positive().optional().describe("Updated weight value"),
      fatPercentage: z.number().min(0).max(100).nullable().optional().describe("Updated body fat percentage"),
      musclePercentage: z.number().min(0).max(100).nullable().optional().describe("Updated muscle mass percentage"),
      bonePercentage: z.number().min(0).max(100).nullable().optional().describe("Updated bone mass percentage"),
      date: tzDateSchema.nullable().optional().describe("Updated date (timezone and dateInUsersTimezone)"),
    }).refine(
      (d) => d.weight !== undefined || d.fatPercentage !== undefined || d.musclePercentage !== undefined || d.bonePercentage !== undefined || d.date !== undefined,
      { message: "At least one field (weight, fatPercentage, musclePercentage, bonePercentage, or date) must be provided" }
    ).describe("Fields to update")
    ```
  - **IMPORTANT:** Update uses body-based ID + data: `WeightLogs.weightLogsUpdate({ body: { id, data } })`
  - Callback: `wrapSdkCall(WeightLogs.weightLogsUpdate({ body: { id, data } }))`

- [x] **Task 7: Implement `delete_weight_log` tool** (AC: #5, #11, #12)
  - Description: `"Delete a weight log by ID."`
  - Input schema (zod):
    ```
    id: z.string().min(1).describe("The weight log ID to delete")
    ```
  - **IMPORTANT:** Delete uses body-based ID: `WeightLogs.weightLogsDelete({ body: { id } })`
  - Callback: `wrapSdkCall(WeightLogs.weightLogsDelete({ body: { id } }))`

- [x] **Task 8: Implement `delete_many_weight_logs` tool** (AC: #6, #11, #12)
  - Description: `"Delete multiple weight logs by their IDs."`
  - Input schema (zod):
    ```
    ids: z.array(z.string().min(1)).min(1).describe("Array of weight log IDs to delete")
    ```
  - **IMPORTANT:** DeleteMany uses body-based IDs: `WeightLogs.weightLogsDeleteMany({ body: { ids } })`
  - Callback: `wrapSdkCall(WeightLogs.weightLogsDeleteMany({ body: { ids } }))`

- [x] **Task 9: Implement `get_weight_settings` tool** (AC: #7, #11, #12)
  - Description: `"Get the user's weight unit preference (kg or lbs)."`
  - Input schema (zod): `{}` (no parameters)
  - Callback: `wrapSdkCall(WeightLogs.weightLogsGetSettings())`

- [x] **Task 10: Implement `update_weight_unit` tool** (AC: #8, #11, #12)
  - Description: `"Update the user's weight unit preference."`
  - Input schema (zod):
    ```
    weightUnit: z.enum(["kg", "lbs"]).describe("Weight unit preference: 'kg' for kilograms or 'lbs' for pounds")
    ```
  - Callback: `wrapSdkCall(WeightLogs.weightLogsUpdateWeightUnit({ body: { weightUnit } }))`

- [x] **Task 11: Implement `get_weight_widget` tool** (AC: #9, #11, #12)
  - Description: `"Get recent weight data points for widget charts."`
  - Input schema (zod): `{}` (no parameters)
  - Callback: `wrapSdkCall(WeightLogs.weightLogsGetWeightsForWidget())`

- [x] **Task 12: Implement `get_current_weight_goal` tool** (AC: #10, #11, #12)
  - Description: `"Get the current active weight goal with start and current weight context."`
  - Input schema (zod): `{}` (no parameters)
  - Callback: `wrapSdkCall(WeightLogs.weightLogsGetCurrentActiveGoal())`

### Task Group C: Build and verification (AC: #13, #14)

- [x] **Task 13: Verify build** (AC: #13)
  - Run `pnpm --filter benji-mcp build` -- must succeed with no TypeScript errors
  - Run `pnpm build` (root recursive) -- must succeed for all three packages
  - Verify `packages/benji-mcp/dist/tools/weight-logs.js` exists in compiled output

- [x] **Task 14: Verify tools appear in tools/list** (AC: #14)
  - Start the server with `BENJI_API_KEY=test-key`
  - Send `initialize` and `notifications/initialized` followed by `tools/list`
  - Verify all 10 tools appear: `list_weight_logs`, `create_weight_log`, `get_weight_log`, `update_weight_log`, `delete_weight_log`, `delete_many_weight_logs`, `get_weight_settings`, `update_weight_unit`, `get_weight_widget`, `get_current_weight_goal`
  - Verify each tool has a `name`, `description`, and `inputSchema` with correct properties

- [ ] **Task 15: Verify tool invocation with real API** (AC: #1 through #10) -- OPTIONAL (requires real API key) -- SKIPPED (no real API key available)
  - Set real `BENJI_API_KEY` in environment
  - Test `get_weight_settings` with `{}` -- verify returns `{ weightUnit: "kg" | "lbs" }`
  - Test `create_weight_log` with `{ "weight": 75.5 }` -- verify returns weight log object with `id`
  - Test `list_weight_logs` with `{}` -- verify structured response with array of weight log objects
  - Test `get_weight_log` with the created log ID -- verify returns weight log object
  - Test `update_weight_log` with `{ "id": "<id>", "data": { "weight": 76.0 } }` -- verify returns updated object
  - Test `get_weight_widget` with `{}` -- verify returns array of data points
  - Test `get_current_weight_goal` with `{}` -- verify returns goal context object
  - Test `delete_weight_log` with the log ID -- verify returns `{ success: true }`
  - Test error handling: call `delete_weight_log` with invalid ID -- verify structured error response with `isError: true`

## Dev Notes

### SDK Method Reference (Exact Signatures)

All methods are on the `WeightLogs` class exported from `benji-sdk`. The Weight Logs API uses a **fully body-based pattern**: all operations pass parameters in the request body (no path params). This is the same pattern used by Pain Events in Epic 3.

| MCP Tool | SDK Method | Body Type | Required Fields |
|----------|-----------|-----------|-----------------|
| `list_weight_logs` | `WeightLogs.weightLogsList(options?)` | `{ date?: string, dateFrom?: string, dateTo?: string }` | None (all optional) |
| `create_weight_log` | `WeightLogs.weightLogsCreate(options)` | `{ weight, fatPercentage, musclePercentage, bonePercentage, date? }` | `weight`, `fatPercentage`, `musclePercentage`, `bonePercentage` (body) |
| `get_weight_log` | `WeightLogs.weightLogsGet(options)` | `{ id }` | `id` (body) |
| `update_weight_log` | `WeightLogs.weightLogsUpdate(options)` | `{ id, data: { weight?, fatPercentage?, musclePercentage?, bonePercentage?, date? } }` | `id`, `data` (body) |
| `delete_weight_log` | `WeightLogs.weightLogsDelete(options)` | `{ id }` | `id` (body) |
| `delete_many_weight_logs` | `WeightLogs.weightLogsDeleteMany(options)` | `{ ids: string[] }` | `ids` (body) |
| `get_weight_settings` | `WeightLogs.weightLogsGetSettings()` | `body?: never` | None |
| `update_weight_unit` | `WeightLogs.weightLogsUpdateWeightUnit(options)` | `{ weightUnit: 'kg' \| 'lbs' }` | `weightUnit` (body) |
| `get_weight_widget` | `WeightLogs.weightLogsGetWeightsForWidget()` | `body?: never` | None |
| `get_current_weight_goal` | `WeightLogs.weightLogsGetCurrentActiveGoal()` | `body?: never` | None |

### All-Body-Based Parameter Pattern (NO path params)

```typescript
// Body-based ID operations:
WeightLogs.weightLogsGet({ body: { id } })
WeightLogs.weightLogsDelete({ body: { id } })
WeightLogs.weightLogsUpdate({ body: { id, data } })

// Body-based list/create/bulk operations:
WeightLogs.weightLogsList({ body: { date, dateFrom, dateTo } })
WeightLogs.weightLogsCreate({ body: { weight, fatPercentage, musclePercentage, bonePercentage, date } })
WeightLogs.weightLogsDeleteMany({ body: { ids } })
WeightLogs.weightLogsUpdateWeightUnit({ body: { weightUnit } })

// No-param operations:
WeightLogs.weightLogsGetSettings()
WeightLogs.weightLogsGetWeightsForWidget()
WeightLogs.weightLogsGetCurrentActiveGoal()
```

### Date Handling: Two Different Patterns

Weight logs use TWO different date patterns:

1. **List filtering** uses plain ISO date strings (`YYYY-MM-DD`):
   ```typescript
   // WeightLogsListData.body
   { date?: string, dateFrom?: string, dateTo?: string }
   ```
   Validate with `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)` -- do NOT use `ymdDateSchema` (that is year/month/day objects for pain events).

2. **Create/Update** uses `tzDateSchema` (timezone-aware) from `util.ts`:
   ```typescript
   // WeightLogsCreateData.body.date / WeightLogsUpdateData.body.data.date
   { timezone: string, dateInUsersTimezone: string } | null
   ```
   Use `tzDateSchema.nullable().optional()` since the API accepts `null` as well.

### Body Composition Nullability

`fatPercentage`, `musclePercentage`, and `bonePercentage` are typed as `number | null` (NOT optional) in `WeightLogsCreateData`. The MCP tool should accept these as `.nullable().optional()` for convenience and default missing values to `null` before passing to the SDK:
```typescript
fatPercentage: fatPercentage ?? null,
musclePercentage: musclePercentage ?? null,
bonePercentage: bonePercentage ?? null,
```

### Weight Log Response Shape

From `WeightLogsGetResponses` / `WeightLogsListResponses` / `WeightLogsCreateResponses` / `WeightLogsUpdateResponses`:
```typescript
{
  id: string;
  userId: string;
  date: string;
  weight: number;
  fatPercentage: number | null;
  musclePercentage: number | null;
  bonePercentage: number | null;
  createdAt: string;
  updatedAt: string;
}
```

### Delete Response Shape

From `WeightLogsDeleteResponses` / `WeightLogsDeleteManyResponses`:
```typescript
{
  success: true;
}
```

### Settings Response Shape

From `WeightLogsGetSettingsResponses`:
```typescript
{
  weightUnit: 'kg' | 'lbs';
}
```

### Widget Response Shape

From `WeightLogsGetWeightsForWidgetResponses`:
```typescript
Array<{
  id: string;
  date: string;
  weight: number;
}>
```

### Current Active Goal Response Shape

From `WeightLogsGetCurrentActiveGoalResponses`:
```typescript
{
  goal: {
    id: string;
    createdAt: string;
    updatedAt: string;
    userId: string;
    amount: number;
  } | null;
  startWeight: number | null;
  currentWeight: number | null;
}
```

### MCP Tool Registration Pattern

Follow the exact same pattern from `pain-events.ts`, importing shared helpers from `util.ts`:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { WeightLogs, wrapSdkCall } from "benji-sdk";
import { toolResult, handleToolError, tzDateSchema } from "./util.js";

export function registerWeightLogTools(server: McpServer): void {
  // list_weight_logs -- body-based, optional ISO date strings
  server.registerTool("list_weight_logs", { ... }, async ({ date, dateFrom, dateTo }) => {
    try {
      const result = await wrapSdkCall(
        WeightLogs.weightLogsList({ body: { date, dateFrom, dateTo } }),
      );
      return toolResult(result);
    } catch (error) {
      return handleToolError(error);
    }
  });

  // create_weight_log -- body-based, required weight + nullable percentages
  server.registerTool("create_weight_log", { ... }, async ({ weight, fatPercentage, musclePercentage, bonePercentage, date }) => {
    try {
      const result = await wrapSdkCall(
        WeightLogs.weightLogsCreate({
          body: {
            weight,
            fatPercentage: fatPercentage ?? null,
            musclePercentage: musclePercentage ?? null,
            bonePercentage: bonePercentage ?? null,
            date,
          },
        }),
      );
      return toolResult(result);
    } catch (error) {
      return handleToolError(error);
    }
  });

  // get_weight_log -- body-based ID
  server.registerTool("get_weight_log", { ... }, async ({ id }) => {
    try {
      const result = await wrapSdkCall(WeightLogs.weightLogsGet({ body: { id } }));
      return toolResult(result);
    } catch (error) {
      return handleToolError(error);
    }
  });

  // update_weight_log -- body-based ID + data
  server.registerTool("update_weight_log", { ... }, async ({ id, data }) => {
    try {
      const result = await wrapSdkCall(WeightLogs.weightLogsUpdate({ body: { id, data } }));
      return toolResult(result);
    } catch (error) {
      return handleToolError(error);
    }
  });

  // delete_weight_log -- body-based ID
  server.registerTool("delete_weight_log", { ... }, async ({ id }) => {
    try {
      const result = await wrapSdkCall(WeightLogs.weightLogsDelete({ body: { id } }));
      return toolResult(result);
    } catch (error) {
      return handleToolError(error);
    }
  });

  // delete_many_weight_logs -- body-based IDs array
  server.registerTool("delete_many_weight_logs", { ... }, async ({ ids }) => {
    try {
      const result = await wrapSdkCall(WeightLogs.weightLogsDeleteMany({ body: { ids } }));
      return toolResult(result);
    } catch (error) {
      return handleToolError(error);
    }
  });

  // get_weight_settings -- no params
  server.registerTool("get_weight_settings", { ... }, async () => {
    try {
      const result = await wrapSdkCall(WeightLogs.weightLogsGetSettings());
      return toolResult(result);
    } catch (error) {
      return handleToolError(error);
    }
  });

  // update_weight_unit -- body-based weightUnit enum
  server.registerTool("update_weight_unit", { ... }, async ({ weightUnit }) => {
    try {
      const result = await wrapSdkCall(
        WeightLogs.weightLogsUpdateWeightUnit({ body: { weightUnit } }),
      );
      return toolResult(result);
    } catch (error) {
      return handleToolError(error);
    }
  });

  // get_weight_widget -- no params
  server.registerTool("get_weight_widget", { ... }, async () => {
    try {
      const result = await wrapSdkCall(WeightLogs.weightLogsGetWeightsForWidget());
      return toolResult(result);
    } catch (error) {
      return handleToolError(error);
    }
  });

  // get_current_weight_goal -- no params
  server.registerTool("get_current_weight_goal", { ... }, async () => {
    try {
      const result = await wrapSdkCall(WeightLogs.weightLogsGetCurrentActiveGoal());
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

- All relative imports MUST use `.js` extensions: `./tools/weight-logs.js`
- Package imports use bare specifiers: `benji-sdk`, `zod`
- MCP SDK imports use deep paths: `@modelcontextprotocol/sdk/server/mcp.js`

### Key Differences from Pain Events (Story 3-5)

1. **ISO date strings for list**: Weight log listing uses plain ISO date strings (`date`, `dateFrom`, `dateTo`) instead of `ymdDateSchema` objects. Use `z.string().regex(...)` not `ymdDateSchema`.
2. **Nullable body composition**: `fatPercentage`, `musclePercentage`, `bonePercentage` are `number | null` in the SDK type (required but nullable). MCP tool accepts them as `.nullable().optional()` and defaults to `null`.
3. **Settings/unit tools**: Weight logs include `get_weight_settings` and `update_weight_unit` tools not present in pain events.
4. **Widget + goal tools**: Weight logs include `get_weight_widget` and `get_current_weight_goal` read-only tools.
5. **No tzDateSchema import for list**: Only `tzDateSchema` is needed (for create/update date). Do NOT import `ymdDateSchema`.
6. **Weight validation**: `weight` must be validated as `.positive()` (greater than 0). Percentages use `.min(0).max(100)`.

### File Structure After This Story

```
packages/benji-mcp/
  src/
    index.ts          (UNCHANGED)
    server.ts         (MODIFIED -- imports and calls registerWeightLogTools)
    tools/
      todos.ts        (UNCHANGED)
      tags.ts         (UNCHANGED)
      projects.ts     (UNCHANGED)
      todo-lists.ts   (UNCHANGED)
      habits.ts       (UNCHANGED)
      mood.ts         (UNCHANGED)
      util.ts         (UNCHANGED)
      hydration.ts    (UNCHANGED)
      fasting.ts      (UNCHANGED)
      workouts.ts     (UNCHANGED)
      journal.ts      (UNCHANGED)
      pain-events.ts  (UNCHANGED)
      weight-logs.ts  (NEW -- 10 tool registrations)
```

### Project Structure Notes

- Alignment: follows the exact same module structure established in Epic 2 (one file per resource in `tools/`, exported register function, wired in `server.ts`)
- Shared `toolResult`/`handleToolError` imported from `./util.js` (no local re-declarations)
- `tzDateSchema` imported from `./util.js` for create/update (timezone-aware date)
- No conflicts or variances expected
- `.min(1)` on all string ID params, `.positive()` on weight, `.min(0).max(100)` on percentages, `.refine()` on update data object
- Array validation: `z.array(z.string().min(1)).min(1)` for `ids` in delete_many ensures at least one valid ID
- `z.enum(["kg", "lbs"])` for `weightUnit` in update_weight_unit
- This is the FIRST story in Epic 5 -- it begins the "Newly Added Resources" epic

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 5, Story 5.1 -- acceptance criteria and tool list]
- [Source: _bmad-output/sprint-artifacts/3-5-pain-event-tools.md -- reference story format and patterns]
- [Source: packages/benji-mcp/src/tools/pain-events.ts -- reference implementation for body-based tool registration pattern]
- [Source: packages/benji-mcp/src/tools/util.ts -- shared toolResult, handleToolError, tzDateSchema helpers]
- [Source: packages/benji-mcp/src/server.ts -- createServer() factory function, tool wiring]
- [Source: packages/benji-sdk/src/client/sdk.gen.ts lines 2321-2479 -- WeightLogs class with all 10 static methods]
- [Source: packages/benji-sdk/src/client/types.gen.ts lines 12311-12788 -- WeightLogsGetData through WeightLogsGetCurrentActiveGoalResponse types]
- [Source: packages/benji-sdk/src/client/index.ts -- WeightLogs class exported from SDK]
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

- All 10 weight log MCP tools implemented following the body-based parameter pattern from pain-events.ts
- Shared helpers (toolResult, handleToolError, tzDateSchema) imported from ./util.js -- no local re-declarations
- ISO date string validation with regex for list filtering (date, dateFrom, dateTo)
- tzDateSchema used for create/update timezone-aware date fields
- Body composition fields (fatPercentage, musclePercentage, bonePercentage) accept nullable/optional and default to null via ?? operator
- .positive() validation on weight, .min(0).max(100) on percentages, .min(1) on string IDs
- .refine() on update data object ensures at least one field provided
- z.enum(["kg", "lbs"]) for weightUnit in update_weight_unit
- z.array(z.string().min(1)).min(1) for ids in delete_many_weight_logs
- pnpm --filter benji-mcp build: PASS (zero errors)
- pnpm build (root recursive): PASS (all 3 packages)
- tools/list verification: all 10 tools present with correct names, descriptions, and input schemas
- Task 15 (real API verification) skipped -- optional, requires real API key

### File List

- `packages/benji-mcp/src/tools/weight-logs.ts` -- NEW: 10 weight log tool registrations
- `packages/benji-mcp/src/server.ts` -- MODIFIED: import and call registerWeightLogTools
