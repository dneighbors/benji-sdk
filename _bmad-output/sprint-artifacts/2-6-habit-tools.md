# Story 2.6: Habit tools

Status: dev-complete

## Story

As an AI assistant,
I want MCP tools for managing Benji habits,
so that I can list, create, update, delete, and log habits.

## Acceptance Criteria

1. **AC-1: list_habits tool**
   - **Given** a valid API key
   - **When** `list_habits` is called with `dateFrom` and `dateTo` params, and optional `habitIds` array
   - **Then** returns a structured JSON array of habits with completions
   - **And** returns an error with structured message on API failure

2. **AC-2: create_habit tool**
   - **Given** valid input with at minimum a `name`
   - **When** `create_habit` is called with name and optional fields (emoji, timeOfDay, durationInSeconds, type, description, privacySetting, habitListId, daysOfWeek, customPoints, punshingPoints)
   - **Then** creates and returns the habit with its `id`
   - **And** returns an error with structured message on API failure

3. **AC-3: update_habit tool**
   - **Given** a valid habit ID and at least one field to update
   - **When** `update_habit` is called with `id` and a `data` object of updatable fields
   - **Then** updates and returns the habit
   - **And** returns an error with structured message on API failure

4. **AC-4: delete_habit tool**
   - **Given** a valid habit ID
   - **When** `delete_habit` is called with the ID
   - **Then** deletes the habit and returns the deleted habit object
   - **And** returns an error with structured message on API failure

5. **AC-5: log_habit tool**
   - **Given** a valid habit ID
   - **When** `log_habit` is called with `habitId`, optional `date` (timezone + dateInUsersTimezone), and optional `completionType` (Done/Skipped/NotCompleted)
   - **Then** logs the habit for that day and returns `{ success: true }`
   - **And** returns an error with structured message on API failure

6. **AC-6: log_many_habits tool**
   - **Given** valid habit IDs
   - **When** `log_many_habits` is called with `habitIds` array, `completionType`, and optional `date` (dateInUsersTimezone)
   - **Then** logs multiple habits and returns `{ success: true, processedCount: number }`
   - **And** returns an error with structured message on API failure

7. **AC-7: JSON schema validation on all tools**
   - **And** every tool has a zod-based input schema that validates parameters before calling the SDK
   - **And** invalid input returns a structured MCP error (isError: true) without hitting the API

8. **AC-8: Consistent structured responses**
   - **And** all successful responses use `{ content: [{ type: "text", text: JSON.stringify(result) }] }`
   - **And** all error responses use `{ content: [{ type: "text", text: JSON.stringify(errorObject) }], isError: true }`
   - **And** error objects include `code`, `message`, and optional `issues` array

9. **AC-9: Build succeeds**
   - **Given** the new tool registration files
   - **When** I run `pnpm --filter benji-mcp build`
   - **Then** the build succeeds with no TypeScript errors
   - **And** `pnpm build` (root-level recursive build) still succeeds for all packages

10. **AC-10: Tools appear in tools/list**
    - **Given** the server is running
    - **When** a client sends `tools/list`
    - **Then** all 6 habit tools appear with their names, descriptions, and input schemas

## Tasks / Subtasks

### Task Group A: File setup and wiring (AC: #7, #8, #9, #10)

- [x] **Task 1: Create `packages/benji-mcp/src/tools/habits.ts` with tool registration function** (AC: #7, #8, #9)
  - Create `habits.ts` that exports a `registerHabitTools(server: McpServer)` function
  - Import `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js`
  - Import `z` from `zod`
  - Import `Habits`, `wrapSdkCall`, `BenjiApiError` from `benji-sdk`
  - Reuse the same `toolResult()` and `handleToolError()` helper pattern from `todos.ts`

- [x] **Task 2: Wire tool registration into server.ts** (AC: #9, #10)
  - In `packages/benji-mcp/src/server.ts`:
    - Import `registerHabitTools` from `./tools/habits.js`
    - Call `registerHabitTools(mcpServer)` after existing tool registration calls

### Task Group B: Tool implementations (AC: #1, #2, #3, #4, #5, #6) -- parallelizable

- [x] **Task 3: Implement `list_habits` tool** (AC: #1, #7, #8)
  - Register tool via `server.registerTool("list_habits", { ... }, callback)`
  - Description: `"List habits with completions for a date range. Returns habits and their completion status."`
  - Input schema (zod):
    ```
    dateFrom: z.string().describe("Start date (ISO format, e.g. 2026-03-01)")
    dateTo: z.string().describe("End date (ISO format, e.g. 2026-03-31)")
    habitIds: z.array(z.string()).optional().describe("Optional array of habit IDs to filter by")
    ```
  - Callback: calls `wrapSdkCall(Habits.habitsGetHabitsAndCompletions({ body: { dateFrom, dateTo, habitIds } }))`, returns `toolResult(result)`
  - Wrap in try/catch, catch returns `handleToolError(error)`

- [x] **Task 4: Implement `create_habit` tool** (AC: #2, #7, #8)
  - Description: `"Create a new habit. Only name is required; all other fields are optional."`
  - Input schema (zod):
    ```
    name: z.string().describe("The habit name (required)")
    emoji: z.string().nullable().optional().describe("Emoji icon for the habit")
    timeOfDay: z.enum(["Morning", "Afternoon", "Evening", "Night", "Any"]).optional()
    durationInSeconds: z.number().nullable().optional()
    type: z.enum(["personal", "work", "both"]).optional()
    description: z.string().nullable().optional()
    privacySetting: z.enum(["NotSet", "Private", "Following", "Public"]).optional()
    habitListId: z.string().nullable().optional()
    daysOfWeek: z.array(z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"])).optional()
    customPoints: z.union([z.string(), z.number()]).nullable().optional()
    punshingPoints: z.union([z.string(), z.number()]).nullable().optional()
    ```
  - Callback: pass all fields as the `body` to `Habits.habitsCreate({ body: args })`

- [x] **Task 5: Implement `update_habit` tool** (AC: #3, #7, #8)
  - Description: `"Update an existing habit. Provide the habit ID and the fields to update."`
  - Input schema (zod):
    ```
    id: z.string().describe("The habit ID to update")
    data: z.object({
      name: z.string().optional(),
      emoji: z.string().nullable().optional(),
      timeOfDay: z.enum(["Morning", "Afternoon", "Evening", "Night", "Any"]).optional(),
      durationInSeconds: z.number().nullable().optional(),
      type: z.enum(["personal", "work", "both"]).optional(),
      description: z.string().nullable().optional(),
      privacySetting: z.enum(["NotSet", "Private", "Following", "Public"]).optional(),
      habitListId: z.string().nullable().optional(),
      daysOfWeek: z.array(z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"])).optional(),
      customPoints: z.union([z.string(), z.number()]).nullable().optional(),
      punshingPoints: z.union([z.string(), z.number()]).nullable().optional(),
    }).describe("Fields to update")
    ```
  - Callback: `wrapSdkCall(Habits.habitsUpdate({ body: { id, data } }))`

- [x] **Task 6: Implement `delete_habit` tool** (AC: #4, #7, #8)
  - Description: `"Delete a habit by ID"`
  - Input schema (zod):
    ```
    id: z.string().describe("The habit ID to delete")
    ```
  - Callback: `wrapSdkCall(Habits.habitsDelete({ body: { id } }))`

- [x] **Task 7: Implement `log_habit` tool** (AC: #5, #7, #8)
  - Description: `"Log a habit completion or failure for a specific day. If no date is provided, logs for today."`
  - Input schema (zod):
    ```
    habitId: z.string().describe("The habit ID to log")
    date: z.object({
      timezone: z.string().describe("IANA timezone, e.g. America/New_York"),
      dateInUsersTimezone: z.string().describe("Date in user's timezone, e.g. 2026-03-27"),
    }).nullable().optional().describe("Date to log for. If omitted, logs for today.")
    completionType: z.enum(["Done", "Skipped", "NotCompleted"]).optional().describe("Completion status. Defaults to Done if omitted.")
    ```
  - Callback: `wrapSdkCall(Habits.habitsLogHabitOnDay({ body: { habitId, date, completionType } }))`

- [x] **Task 8: Implement `log_many_habits` tool** (AC: #6, #7, #8)
  - Description: `"Log multiple habits for a specific day with the same completion type."`
  - Input schema (zod):
    ```
    habitIds: z.array(z.string()).describe("Array of habit IDs to log")
    completionType: z.enum(["Done", "Skipped", "NotCompleted"]).describe("Completion status for all habits")
    date: z.object({
      dateInUsersTimezone: z.string().describe("Date in user's timezone, e.g. 2026-03-27"),
    }).optional().describe("Date to log for. If omitted, logs for today.")
    ```
  - Callback: `wrapSdkCall(Habits.habitsLogManyHabitsOnDay({ body: { habitIds, completionType, date } }))`

### Task Group C: Build and verification (AC: #9, #10)

- [x] **Task 9: Verify build** (AC: #9)
  - Run `pnpm --filter benji-mcp build` -- must succeed with no TypeScript errors
  - Run `pnpm build` (root recursive) -- must succeed for all three packages
  - Verify `packages/benji-mcp/dist/tools/habits.js` exists in compiled output

- [x] **Task 10: Verify tools appear in tools/list** (AC: #10)
  - Start the server with `BENJI_API_KEY=test-key`
  - Send `initialize` and `notifications/initialized` followed by `tools/list`
  - Verify all 6 tools appear: `list_habits`, `create_habit`, `update_habit`, `delete_habit`, `log_habit`, `log_many_habits`
  - Verify each tool has a `name`, `description`, and `inputSchema` with correct properties

- [ ] **Task 11: Verify tool invocation with real API** (AC: #1 through #6) -- SKIPPED: no real API key available
  - Set real `BENJI_API_KEY` in environment
  - Test `list_habits` with date range -- verify structured response
  - Test `create_habit` with `{ "name": "Test Habit from MCP" }` -- verify returns habit with `id`
  - Test `update_habit` with the created habit ID -- verify returns updated habit
  - Test `delete_habit` with the created habit ID -- verify returns deleted habit
  - Test `log_habit` with a habit ID -- verify returns `{ success: true }`
  - Test `log_many_habits` with habit IDs -- verify returns `{ success: true, processedCount: number }`

## Dev Notes

### SDK Method Reference (Exact Signatures)

All methods are on the `Habits` class exported from `benji-sdk`. Each takes an `options` object with a `body` property.

| MCP Tool | SDK Method | Body Type | Required Body Fields |
|----------|-----------|-----------|---------------------|
| `list_habits` | `Habits.habitsGetHabitsAndCompletions(options)` | `{ dateFrom, dateTo, habitIds? }` | `dateFrom`, `dateTo` |
| `create_habit` | `Habits.habitsCreate(options)` | `{ name, ...optionalFields }` | `name` |
| `update_habit` | `Habits.habitsUpdate(options)` | `{ id, data: { ...fields } }` | `id`, `data` |
| `delete_habit` | `Habits.habitsDelete(options)` | `{ id }` | `id` |
| `log_habit` | `Habits.habitsLogHabitOnDay(options)` | `{ habitId, date?, completionType? }` | `habitId` |
| `log_many_habits` | `Habits.habitsLogManyHabitsOnDay(options)` | `{ habitIds, completionType, date? }` | `habitIds`, `completionType` |

### MCP Tool Registration Pattern

Follows the exact same pattern established in `todos.ts` (Story 2.2):

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Habits, wrapSdkCall, BenjiApiError } from "benji-sdk";

// Success helper
function toolResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data) }],
  };
}

// Error helper
function handleToolError(error: unknown) {
  if (error instanceof BenjiApiError) {
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          code: error.code,
          message: error.message,
          ...(error.issues && { issues: error.issues }),
        }),
      }],
      isError: true,
    };
  }
  return {
    content: [{
      type: "text" as const,
      text: JSON.stringify({
        code: "UNKNOWN_ERROR",
        message: error instanceof Error ? error.message : String(error),
      }),
    }],
    isError: true,
  };
}
```

### Shared Habit Fields Schema

The create and update tools share the same updatable fields. Extract a `habitFieldsSchema` object:

```typescript
const habitFieldsSchema = {
  emoji: z.string().nullable().optional().describe("Emoji icon for the habit"),
  timeOfDay: z.enum(["Morning", "Afternoon", "Evening", "Night", "Any"]).optional().describe("Preferred time of day"),
  durationInSeconds: z.number().nullable().optional().describe("Duration in seconds"),
  type: z.enum(["personal", "work", "both"]).optional().describe("Habit type"),
  description: z.string().nullable().optional().describe("Description of the habit"),
  privacySetting: z.enum(["NotSet", "Private", "Following", "Public"]).optional().describe("Privacy setting"),
  habitListId: z.string().nullable().optional().describe("ID of habit list to assign to"),
  daysOfWeek: z.array(z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"])).optional().describe("Days of the week for the habit"),
  customPoints: z.union([z.string(), z.number()]).nullable().optional().describe("Custom points for completion"),
  punshingPoints: z.union([z.string(), z.number()]).nullable().optional().describe("Punishing points for missing"),
};
```

### Key Body Shape Differences

- **list_habits** (`habitsGetHabitsAndCompletions`): requires `dateFrom` + `dateTo` (string dates), optional `habitIds` array
- **log_habit** (`habitsLogHabitOnDay`): body has `habitId` (not `id`), optional `date` object with `{ timezone, dateInUsersTimezone }`, optional `completionType`
- **log_many_habits** (`habitsLogManyHabitsOnDay`): body has `habitIds` array, **required** `completionType`, optional `date` object with only `{ dateInUsersTimezone }` (no timezone field)
- **update_habit**: uses the standard `{ id, data: { ...fields } }` pattern

### wrapSdkCall Error Handling Pattern

The `wrapSdkCall<T>(promise)` function from `benji-sdk`:
- Takes the raw SDK call promise (which returns `{ data?, error?, response }`)
- On success: extracts and returns `data` as type `T`
- On API error (4xx/5xx): throws `BenjiApiError` with `status`, `code`, `message`, `issues`
- On network error: throws `BenjiApiError` with `status: 0`, `code: "NETWORK_ERROR"`
- On empty response: throws `BenjiApiError` with `code: "EMPTY_RESPONSE"`

### ESM Import Requirements

- All relative imports MUST use `.js` extensions: `./tools/habits.js`
- Package imports use bare specifiers: `benji-sdk`, `zod`
- MCP SDK imports use deep paths: `@modelcontextprotocol/sdk/server/mcp.js`

### File Structure After This Story

```
packages/benji-mcp/
  src/
    index.ts          (UNCHANGED)
    server.ts         (MODIFIED -- imports and calls registerHabitTools)
    tools/
      todos.ts        (UNCHANGED -- from Story 2.2)
      tags.ts         (UNCHANGED -- from Story 2.3)
      projects.ts     (UNCHANGED -- from Story 2.4)
      todo-lists.ts   (UNCHANGED -- from Story 2.5)
      habits.ts       (NEW -- 6 tool registrations)
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 2, Story 2.6 -- acceptance criteria and technical notes]
- [Source: _bmad-output/sprint-artifacts/2-2-todo-tools.md -- todo tools story pattern and dev notes]
- [Source: packages/benji-mcp/src/tools/todos.ts -- reference implementation for tool registration pattern]
- [Source: packages/benji-mcp/src/server.ts -- createServer() factory function]
- [Source: packages/benji-sdk/src/client/sdk.gen.ts lines 1568-1730 -- Habits class with all static methods]
- [Source: packages/benji-sdk/src/client/types.gen.ts lines 9828-10388 -- HabitsGetHabitsAndCompletionsData through HabitsGetHabitScoreForWidgetResponse types]
- [Source: packages/benji-sdk/src/index.ts -- Habits exported from SDK via re-export]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used
Claude Opus 4.6 (1M context)

### Debug Log References
N/A

### Completion Notes List
- Created `habits.ts` following the exact same pattern as `todos.ts`, `tags.ts`, `projects.ts`, and `todo-lists.ts`
- Used shared `habitFieldsSchema` object to avoid duplication between create and update tools
- `log_habit` body uses `habitId` (not `id`) and has a date object with both `timezone` and `dateInUsersTimezone`
- `log_many_habits` body uses `habitIds` array, required `completionType`, and date object with only `dateInUsersTimezone`
- `pnpm --filter benji-mcp build` passes with zero errors
- All 6 tools confirmed in `tools/list` stdio test with correct names, descriptions, and input schemas
- Task 11 (live API test) skipped -- no real API key available

### File List
- `packages/benji-mcp/src/tools/habits.ts` -- NEW: 6 habit tool registrations
- `packages/benji-mcp/src/server.ts` -- MODIFIED: added import and call for `registerHabitTools`
- `_bmad-output/sprint-artifacts/2-6-habit-tools.md` -- NEW: story file with task checkboxes and dev agent record
