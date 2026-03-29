# Story 3.3: Workout tools

Status: done

## Story

As an AI assistant,
I want MCP tools for Benji workout tracking,
so that I can list workouts, create workouts, start and end workouts, view in-progress workouts, get workout details, update, delete, and duplicate workouts.

## Acceptance Criteria

1. **AC-1: start_workout tool**
   - **Given** a valid API key
   - **When** `start_workout` is called with optional `name`
   - **Then** starts a new workout and returns the workout object with `id`, `name`, `startedAt`, `endedAt`, `date`, `muscleGroupsString`
   - **And** returns an error with structured message on API failure

2. **AC-2: end_workout tool**
   - **Given** a valid workout ID of an in-progress workout
   - **When** `end_workout` is called with `id` (required) and optional `endedAt` (ISO datetime string)
   - **Then** ends the workout and returns the updated workout object
   - **And** returns an error with structured message on API failure

3. **AC-3: get_in_progress_workout tool**
   - **Given** a valid API key
   - **When** `get_in_progress_workout` is called with no parameters
   - **Then** returns the in-progress workout object (or null if none is active) with `muscleGroupsString`
   - **And** returns an error with structured message on API failure

4. **AC-4: list_workouts tool**
   - **Given** a valid API key
   - **When** `list_workouts` is called with optional `dateFrom` and `dateTo` strings
   - **Then** returns a structured JSON array of workout objects
   - **And** returns an error with structured message on API failure

5. **AC-5: create_workout tool**
   - **Given** valid input
   - **When** `create_workout` is called with optional `name`, `startedAt`, `endedAt`, `notes`
   - **Then** creates and returns the workout object
   - **And** returns an error with structured message on API failure

6. **AC-6: get_workout tool**
   - **Given** a valid workout ID
   - **When** `get_workout` is called with the ID
   - **Then** returns the workout object with `id`, `name`, `notes`, `startedAt`, `endedAt`, `date`, `userId`
   - **And** returns an error with structured message on API failure

7. **AC-7: get_workout_with_details tool**
   - **Given** a valid workout ID
   - **When** `get_workout_with_details` is called with the ID
   - **Then** returns the workout object with full details (exercises, sets) and `muscleGroupsString`
   - **And** returns an error with structured message on API failure

8. **AC-8: update_workout tool**
   - **Given** a valid workout ID and at least one field to update
   - **When** `update_workout` is called with `id` and a `data` object of updatable fields (name, startedAt, endedAt, notes)
   - **Then** updates the workout and returns the updated workout object (or null)
   - **And** returns an error with structured message on API failure

9. **AC-9: delete_workout tool**
   - **Given** a valid workout ID
   - **When** `delete_workout` is called with the ID
   - **Then** deletes the workout and returns a success response
   - **And** returns an error with structured message on API failure

10. **AC-10: duplicate_workout tool**
    - **Given** a valid workout ID
    - **When** `duplicate_workout` is called with the ID
    - **Then** duplicates the workout and returns the new workout object
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
    - **Then** all 10 workout tools appear with their names, descriptions, and input schemas

## Tasks / Subtasks

### Task Group A: File setup and wiring (AC: #11, #12, #13)

- [x] **Task 1: Create `packages/benji-mcp/src/tools/workouts.ts` with tool registration function** (AC: #11, #12, #13)
  - Create `workouts.ts` that exports a `registerWorkoutTools(server: McpServer)` function
  - Import `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js`
  - Import `z` from `zod`
  - Import `Workouts`, `wrapSdkCall` from `benji-sdk`
  - Import `toolResult`, `handleToolError`, `tzDateSchema` from `./util.js` (shared helpers from Epic 2)
  - Do NOT re-declare toolResult/handleToolError/tzDateSchema locally -- use the shared util module

- [x] **Task 2: Wire tool registration into server.ts** (AC: #13, #14)
  - In `packages/benji-mcp/src/server.ts`:
    - Import `registerWorkoutTools` from `./tools/workouts.js`
    - Call `registerWorkoutTools(mcpServer)` after `registerFastingTools(mcpServer)`

### Task Group B: Tool implementations (AC: #1 through #10) -- parallelizable

- [x] **Task 3: Implement `start_workout` tool** (AC: #1, #11, #12)
  - Register tool via `server.registerTool("start_workout", { ... }, callback)`
  - Description: `"Start a new workout. Optionally specify a name for the workout."`
  - Input schema (zod):
    ```
    name: z.string().nullable().optional().describe("Name for the workout (e.g. 'Push Day', 'Morning Run')")
    ```
  - Callback: `wrapSdkCall(Workouts.workoutsStart({ body: { name } }))`
  - Wrap in try/catch, catch returns `handleToolError(error)`
  - **Note:** `WorkoutsStartData` has `body?: { name?: string | null }` -- body-based, optional params

- [x] **Task 4: Implement `end_workout` tool** (AC: #2, #11, #12)
  - Description: `"End an in-progress workout. Provide the workout ID. Optionally specify when it ended."`
  - Input schema (zod):
    ```
    id: z.string().min(1).describe("The ID of the workout to end")
    endedAt: z.string().nullable().optional().describe("ISO datetime string for when the workout ended. If omitted, ends now.")
    ```
  - **IMPORTANT:** End uses body-based parameters, NOT path-based: `Workouts.workoutsEnd({ body: { id, endedAt } })`
  - Callback: `wrapSdkCall(Workouts.workoutsEnd({ body: { id, endedAt } }))`

- [x] **Task 5: Implement `get_in_progress_workout` tool** (AC: #3, #11, #12)
  - Description: `"Get the currently in-progress workout, if any. Returns the workout details or null if no workout is active."`
  - Input schema (zod): `{}` (no parameters)
  - Callback: `wrapSdkCall(Workouts.workoutsInProgress())`
  - Note: `WorkoutsInProgressData` has `body?: never`, `path?: never`, `query?: never` -- pass no options or empty options

- [x] **Task 6: Implement `list_workouts` tool** (AC: #4, #11, #12)
  - Description: `"List workouts. Optionally filter by date range using dateFrom and dateTo (ISO date strings, e.g. 2026-03-01)."`
  - Input schema (zod):
    ```
    dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be ISO date format YYYY-MM-DD").optional().describe("Start of date range (ISO date string, e.g. 2026-03-01)")
    dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be ISO date format YYYY-MM-DD").optional().describe("End of date range (ISO date string, e.g. 2026-03-31)")
    ```
  - Callback: `wrapSdkCall(Workouts.workoutsList({ body: { dateFrom, dateTo } }))`

- [x] **Task 7: Implement `create_workout` tool** (AC: #5, #11, #12)
  - Description: `"Create a new workout. Optionally specify name, start time, end time, and notes."`
  - Input schema (zod):
    ```
    name: z.string().nullable().optional().describe("Name for the workout (e.g. 'Push Day', 'Morning Run')")
    startedAt: tzDateSchema.nullable().optional().describe("When the workout started")
    endedAt: tzDateSchema.nullable().optional().describe("When the workout ended")
    notes: z.string().nullable().optional().describe("Notes about the workout")
    ```
  - **IMPORTANT:** Create uses body-based parameters: `Workouts.workoutsCreate({ body: { name, startedAt, endedAt, notes } })`
  - Callback: `wrapSdkCall(Workouts.workoutsCreate({ body: { name, startedAt, endedAt, notes } }))`

- [x] **Task 8: Implement `get_workout` tool** (AC: #6, #11, #12)
  - Description: `"Get a single workout by ID."`
  - Input schema (zod):
    ```
    id: z.string().min(1).describe("The workout ID to retrieve")
    ```
  - **IMPORTANT:** Get uses path-based ID: `Workouts.workoutsGet({ path: { id } })`
  - Callback: `wrapSdkCall(Workouts.workoutsGet({ path: { id } }))`

- [x] **Task 9: Implement `get_workout_with_details` tool** (AC: #7, #11, #12)
  - Description: `"Get a workout with full details including exercises and sets."`
  - Input schema (zod):
    ```
    id: z.string().min(1).describe("The workout ID to retrieve with details")
    ```
  - **IMPORTANT:** Uses path-based ID: `Workouts.workoutsGetWithDetails({ path: { id } })`
  - Callback: `wrapSdkCall(Workouts.workoutsGetWithDetails({ path: { id } }))`

- [x] **Task 10: Implement `update_workout` tool** (AC: #8, #11, #12)
  - Description: `"Update an existing workout. Provide the workout ID and the fields to update."`
  - Input schema (zod):
    ```
    id: z.string().min(1).describe("The workout ID to update")
    data: z.object({
      name: z.string().nullable().optional().describe("Name for the workout"),
      startedAt: tzDateSchema.nullable().optional().describe("Start time of the workout"),
      endedAt: tzDateSchema.nullable().optional().describe("End time of the workout"),
      notes: z.string().nullable().optional().describe("Notes about the workout"),
    }).refine(
      (d) => d.name !== undefined || d.startedAt !== undefined || d.endedAt !== undefined || d.notes !== undefined,
      { message: "At least one field (name, startedAt, endedAt, or notes) must be provided" }
    ).describe("Fields to update")
    ```
  - **IMPORTANT:** Update uses path-based ID + body data: `Workouts.workoutsUpdate({ path: { id }, body: { data } })`
  - Callback: `wrapSdkCall(Workouts.workoutsUpdate({ path: { id }, body: { data } }))`

- [x] **Task 11: Implement `delete_workout` tool** (AC: #9, #11, #12)
  - Description: `"Delete a workout by ID."`
  - Input schema (zod):
    ```
    id: z.string().min(1).describe("The workout ID to delete")
    ```
  - **IMPORTANT:** Delete uses path-based ID: `Workouts.workoutsDelete({ path: { id } })`
  - Callback: `wrapSdkCall(Workouts.workoutsDelete({ path: { id } }))`

- [x] **Task 12: Implement `duplicate_workout` tool** (AC: #10, #11, #12)
  - Description: `"Duplicate an existing workout. Creates a copy of the workout with a new ID."`
  - Input schema (zod):
    ```
    id: z.string().min(1).describe("The workout ID to duplicate")
    ```
  - **IMPORTANT:** Duplicate uses path-based ID: `Workouts.workoutsDuplicate({ path: { id } })`
  - Callback: `wrapSdkCall(Workouts.workoutsDuplicate({ path: { id } }))`

### Task Group C: Build and verification (AC: #13, #14)

- [x] **Task 13: Verify build** (AC: #13)
  - Run `pnpm --filter benji-mcp build` -- must succeed with no TypeScript errors
  - Run `pnpm build` (root recursive) -- must succeed for all three packages
  - Verify `packages/benji-mcp/dist/tools/workouts.js` exists in compiled output

- [x] **Task 14: Verify tools appear in tools/list** (AC: #14)
  - Start the server with `BENJI_API_KEY=test-key`
  - Send `initialize` and `notifications/initialized` followed by `tools/list`
  - Verify all 10 tools appear: `start_workout`, `end_workout`, `get_in_progress_workout`, `list_workouts`, `create_workout`, `get_workout`, `get_workout_with_details`, `update_workout`, `delete_workout`, `duplicate_workout`
  - Verify each tool has a `name`, `description`, and `inputSchema` with correct properties

- [ ] **Task 15: Verify tool invocation with real API** (AC: #1 through #10) -- OPTIONAL (requires real API key)
  - Set real `BENJI_API_KEY` in environment
  - Test `start_workout` with `{ "name": "Test Workout" }` -- verify returns workout object with `id`
  - Test `get_in_progress_workout` with `{}` -- verify returns active workout or null
  - Test `list_workouts` with `{}` -- verify structured response with array of workout objects
  - Test `get_workout` with the started workout ID -- verify returns workout object
  - Test `get_workout_with_details` with the workout ID -- verify returns workout with details
  - Test `update_workout` with `{ "id": "<id>", "data": { "name": "Updated Workout" } }` -- verify returns success
  - Test `create_workout` with `{ "name": "Manual Workout" }` -- verify returns new workout object
  - Test `duplicate_workout` with the workout ID -- verify returns new workout object
  - Test `end_workout` with `{ "id": "<id>" }` -- verify returns success response
  - Test `delete_workout` with the workout ID -- verify returns success response
  - Test error handling: call `delete_workout` with invalid ID -- verify structured error response with `isError: true`

## Dev Notes

### SDK Method Reference (Exact Signatures)

All methods are on the `Workouts` class exported from `benji-sdk`. The Workouts API uses a **mixed pattern**: CRUD operations on individual workouts use path-based IDs, while action endpoints (start, end, list, in-progress) use body-based parameters or no parameters.

| MCP Tool | SDK Method | Path Params | Body Type | Required Fields |
|----------|-----------|-------------|-----------|-----------------|
| `start_workout` | `Workouts.workoutsStart(options?)` | None | `{ name?: string \| null }` | None (all optional) |
| `end_workout` | `Workouts.workoutsEnd(options)` | None | `{ id: string, endedAt?: string \| null }` | `id` (body) |
| `get_in_progress_workout` | `Workouts.workoutsInProgress(options?)` | None | `body?: never` | None |
| `list_workouts` | `Workouts.workoutsList(options?)` | None | `{ dateFrom?: string, dateTo?: string }` | None (all optional) |
| `create_workout` | `Workouts.workoutsCreate(options)` | None | `{ name?, startedAt?, endedAt?, notes? }` | Body required (but all fields optional) |
| `get_workout` | `Workouts.workoutsGet(options)` | `{ id }` | `body?: never` | `id` (path) |
| `get_workout_with_details` | `Workouts.workoutsGetWithDetails(options)` | `{ id }` | `body?: never` | `id` (path) |
| `update_workout` | `Workouts.workoutsUpdate(options)` | `{ id }` | `{ data: { name?, startedAt?, endedAt?, notes? } }` | `id` (path), `data` (body) |
| `delete_workout` | `Workouts.workoutsDelete(options)` | `{ id }` | `body?: never` | `id` (path) |
| `duplicate_workout` | `Workouts.workoutsDuplicate(options)` | `{ id }` | `body?: never` | `id` (path) |

### Mixed Path vs Body Parameter Pattern

The Workouts SDK class uses **both** patterns depending on the operation type:

```typescript
// Path-based (CRUD on individual workouts):
Workouts.workoutsDelete({ path: { id } })
Workouts.workoutsUpdate({ path: { id }, body: { data } })
Workouts.workoutsGet({ path: { id } })
Workouts.workoutsGetWithDetails({ path: { id } })
Workouts.workoutsDuplicate({ path: { id } })

// Body-based (action endpoints):
Workouts.workoutsStart({ body: { name } })
Workouts.workoutsEnd({ body: { id, endedAt } })
Workouts.workoutsList({ body: { dateFrom, dateTo } })
Workouts.workoutsCreate({ body: { name, startedAt, endedAt, notes } })

// No parameters:
Workouts.workoutsInProgress()
```

This is confirmed by the type definitions:
- `WorkoutsDeleteData` has `body?: never` and `path: { id: string }`
- `WorkoutsGetData` has `body?: never` and `path: { id: string }`
- `WorkoutsGetWithDetailsData` has `body?: never` and `path: { id: string }`
- `WorkoutsDuplicateData` has `body?: never` and `path: { id: string }`
- `WorkoutsUpdateData` has `body: { data: { ... } }` and `path: { id: string }`
- `WorkoutsEndData` has `body: { id: string, endedAt?: string | null }` and `path?: never`
- `WorkoutsStartData` has `body?: { name?: string | null }` and `path?: never`
- `WorkoutsListData` has `body?: { dateFrom?, dateTo? }` and `path?: never`
- `WorkoutsCreateData` has `body: { name?, startedAt?, endedAt?, notes? }` and `path?: never`
- `WorkoutsInProgressData` has `body?: never` and `path?: never`

### Workout Object Response Shape

From `WorkoutsGetResponses` / `WorkoutsListResponses` / `WorkoutsCreateResponses`:
```typescript
{
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string | null;
  notes: string | null;
  startedAt: string | null;
  endedAt: string | null;
  date: string;
  userId: string;
}
```

### Start/End/InProgress/Duplicate/Details Response Shape (Extended)

From `WorkoutsStartResponses` / `WorkoutsEndResponses` / `WorkoutsInProgressResponses` / `WorkoutsDuplicateResponses` / `WorkoutsGetWithDetailsResponses`:
```typescript
{
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string | null;
  notes: string | null;
  startedAt: string | null;
  endedAt: string | null;
  date: string;
  userId: string;
  muscleGroupsString: string;
}
```

### InProgress Response (Nullable)

From `WorkoutsInProgressResponses`:
```typescript
{
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string | null;
  notes: string | null;
  startedAt: string | null;
  endedAt: string | null;
  date: string;
  userId: string;
  muscleGroupsString: string;
} | null
```

### Update Response Shape (Nullable)

From `WorkoutsUpdateResponses`:
```typescript
{
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string | null;
  notes: string | null;
  startedAt: string | null;
  endedAt: string | null;
  date: string;
  userId: string;
} | null
```

### Delete Response Shape

From `WorkoutsDeleteResponses`:
```typescript
{
  success: boolean;
}
```

### Key Difference from Fasting: `end_workout` uses `id` in body (not `fastId`)

The `WorkoutsEndData` body field is `id` (not a renamed field like `fastId` in Fasting):
```typescript
body: {
  id: string;          // The workout ID to end
  endedAt?: string | null;  // Optional ISO datetime for when it ended
}
```

### MCP Tool Registration Pattern

Follow the exact same pattern from `fasting.ts`, importing shared helpers from `util.ts`:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Workouts, wrapSdkCall } from "benji-sdk";
import { toolResult, handleToolError, tzDateSchema } from "./util.js";

export function registerWorkoutTools(server: McpServer): void {
  // start_workout -- body-based, optional params
  server.registerTool("start_workout", { ... }, async ({ name }) => {
    try {
      const result = await wrapSdkCall(Workouts.workoutsStart({ body: { name } }));
      return toolResult(result);
    } catch (error) {
      return handleToolError(error);
    }
  });

  // end_workout -- body-based, id required
  server.registerTool("end_workout", { ... }, async ({ id, endedAt }) => {
    try {
      const result = await wrapSdkCall(Workouts.workoutsEnd({ body: { id, endedAt } }));
      return toolResult(result);
    } catch (error) {
      return handleToolError(error);
    }
  });

  // get_in_progress_workout -- no params
  server.registerTool("get_in_progress_workout", { ... }, async () => {
    try {
      const result = await wrapSdkCall(Workouts.workoutsInProgress());
      return toolResult(result);
    } catch (error) {
      return handleToolError(error);
    }
  });

  // delete_workout -- path-based ID
  server.registerTool("delete_workout", { ... }, async ({ id }) => {
    try {
      const result = await wrapSdkCall(Workouts.workoutsDelete({ path: { id } }));
      return toolResult(result);
    } catch (error) {
      return handleToolError(error);
    }
  });

  // update_workout -- path + body
  server.registerTool("update_workout", { ... }, async ({ id, data }) => {
    try {
      const result = await wrapSdkCall(Workouts.workoutsUpdate({ path: { id }, body: { data } }));
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

- All relative imports MUST use `.js` extensions: `./tools/workouts.js`
- Package imports use bare specifiers: `benji-sdk`, `zod`
- MCP SDK imports use deep paths: `@modelcontextprotocol/sdk/server/mcp.js`

### Additional SDK Methods Not Exposed

The `Workouts` class also has:
- `workoutsUpdateName` -- updates only the workout name. Not exposed because `update_workout` already covers the `name` field within its `data` object.
- `workoutsActiveUsers` -- returns users currently working out. Not exposed because it is a social/UI-specific feature, not useful for personal workout management via MCP.
- `workoutsSubmitComplete` -- submits a complete workout with exercises and sets. Not exposed because its body is highly complex (nested exercises with sets containing weight/reps/rpe/type/duration) and more suited for programmatic/UI use. Future consideration for a dedicated workout-builder tool.

### File Structure After This Story

```
packages/benji-mcp/
  src/
    index.ts          (UNCHANGED)
    server.ts         (MODIFIED -- imports and calls registerWorkoutTools)
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
      workouts.ts     (NEW -- 10 tool registrations)
```

### Project Structure Notes

- Alignment: follows the exact same module structure established in Epic 2 (one file per resource in `tools/`, exported register function, wired in `server.ts`)
- Shared `toolResult`/`handleToolError`/`tzDateSchema` imported from `./util.js` (no local re-declarations)
- No conflicts or variances expected
- The mixed path-based + body-based pattern is similar to Fasting -- Workouts adds body-based `end` with `id` in body (not a renamed field like Fasting's `fastId`)
- `.min(1)` on all string ID params, `.refine()` on update data object, ISO date regex on date range strings -- all patterns from stories 3-1 and 3-2 applied

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 3, Story 3.3 -- acceptance criteria and technical notes]
- [Source: _bmad-output/sprint-artifacts/3-2-fasting-tools.md -- reference story format and pattern]
- [Source: packages/benji-mcp/src/tools/fasting.ts -- reference implementation for tool registration pattern, shared date schemas]
- [Source: packages/benji-mcp/src/tools/util.ts -- shared toolResult, handleToolError, tzDateSchema helpers]
- [Source: packages/benji-mcp/src/server.ts -- createServer() factory function, tool wiring]
- [Source: packages/benji-sdk/src/client/sdk.gen.ts lines 1980-2177 -- Workouts class with all 11 static methods]
- [Source: packages/benji-sdk/src/client/types.gen.ts lines 11207-11924 -- WorkoutsDeleteData through WorkoutsSubmitCompleteResponse types]
- [Source: packages/benji-sdk/src/client/index.ts line 3 -- Workouts class exported from SDK]
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

- All 15 tasks completed (Task 15 is OPTIONAL/skipped -- requires real API key)
- Tasks 1-2: Created workouts.ts with `registerWorkoutTools`, wired into server.ts
- Tasks 3-12: Implemented all 10 workout tools following fasting.ts pattern exactly
  - Body-based: start_workout, end_workout, list_workouts, create_workout
  - Path-based: get_workout, get_workout_with_details, delete_workout, duplicate_workout
  - Mixed (path+body): update_workout
  - No-params: get_in_progress_workout
- Task 13: `pnpm --filter benji-mcp build` and `pnpm build` both pass with zero errors
- Task 14: All 10 workout tools verified in tools/list response (53 total tools)

### File List

- **NEW**: `packages/benji-mcp/src/tools/workouts.ts` -- 10 workout tool registrations
- **MODIFIED**: `packages/benji-mcp/src/server.ts` -- import + call registerWorkoutTools
