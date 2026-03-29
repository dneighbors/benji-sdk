# Story 2.7: Mood tools

Status: done

## Story

As an AI assistant,
I want MCP tools for managing Benji mood logs,
so that I can list, create, update, and delete mood entries.

## Acceptance Criteria

1. **AC-1: list_mood tool**
   - **Given** a valid API key
   - **When** `list_mood` is called with an optional date object (`year`, `month`, `day`)
   - **Then** returns a structured JSON array of mood logs
   - **And** returns an error with structured message on API failure

2. **AC-2: create_mood tool**
   - **Given** valid input with a `mood` number (1-5)
   - **When** `create_mood` is called with mood and optional fields (note, date)
   - **Then** creates and returns the mood log with its `id`
   - **And** returns an error with structured message on API failure

3. **AC-3: update_mood tool**
   - **Given** a valid mood ID and at least one field to update
   - **When** `update_mood` is called with `id` and a `data` object of updatable fields
   - **Then** updates and returns the mood log
   - **And** returns an error with structured message on API failure

4. **AC-4: delete_mood tool**
   - **Given** a valid mood ID
   - **When** `delete_mood` is called with the ID
   - **Then** deletes the mood log and returns a success response
   - **And** returns an error with structured message on API failure

5. **AC-5: JSON schema validation on all tools**
   - **And** every tool has a zod-based input schema that validates parameters before calling the SDK
   - **And** invalid input returns a structured MCP error (isError: true) without hitting the API

6. **AC-6: Consistent structured responses**
   - **And** all successful responses use `{ content: [{ type: "text", text: JSON.stringify(result) }] }`
   - **And** all error responses use `{ content: [{ type: "text", text: JSON.stringify(errorObject) }], isError: true }`
   - **And** error objects include `code`, `message`, and optional `issues` array

7. **AC-7: Build succeeds**
   - **Given** the new tool registration files
   - **When** I run `pnpm --filter benji-mcp build`
   - **Then** the build succeeds with no TypeScript errors
   - **And** `pnpm build` (root-level recursive build) still succeeds for all packages

8. **AC-8: Tools appear in tools/list**
   - **Given** the server is running
   - **When** a client sends `tools/list`
   - **Then** all 4 mood tools appear with their names, descriptions, and input schemas

## Tasks / Subtasks

### Task Group A: File setup and wiring (AC: #5, #6, #7)

- [x] **Task 1: Create `packages/benji-mcp/src/tools/mood.ts` with tool registration function** (AC: #5, #6, #7)
  - Create `mood.ts` that exports a `registerMoodTools(server: McpServer)` function
  - Import `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js`
  - Import `z` from `zod`
  - Import `Mood`, `wrapSdkCall`, `BenjiApiError` from `benji-sdk`
  - Reuse the same `toolResult()` and `handleToolError()` helper pattern from `todos.ts`

- [x] **Task 2: Wire tool registration into server.ts** (AC: #7, #8)
  - In `packages/benji-mcp/src/server.ts`:
    - Import `registerMoodTools` from `./tools/mood.js`
    - Call `registerMoodTools(mcpServer)` after existing tool registrations

### Task Group B: Tool implementations (AC: #1, #2, #3, #4) -- parallelizable

- [x] **Task 3: Implement `list_mood` tool** (AC: #1, #5, #6)
  - Register tool via `server.registerTool("list_mood", { ... }, callback)`
  - Description: `"List mood logs. Optionally filter by date (year, month, day)."`
  - Input schema (zod):
    ```
    date: z.object({
      year: z.number().describe("Year (e.g. 2026)"),
      month: z.number().describe("Month (1-12)"),
      day: z.number().describe("Day of month (1-31)"),
    }).optional().describe("Filter mood logs by date")
    ```
  - Callback: calls `wrapSdkCall(Mood.moodList({ body: { date } }))`, returns `toolResult(result)`
  - Wrap in try/catch, catch returns `handleToolError(error)`

- [x] **Task 4: Implement `create_mood` tool** (AC: #2, #5, #6)
  - Description: `"Create a new mood log. Mood is required (1=awful, 2=bad, 3=meh, 4=good, 5=rad)."`
  - Input schema (zod):
    ```
    mood: z.number().describe("Mood value: 1=awful, 2=bad, 3=meh, 4=good, 5=rad")
    note: z.string().nullable().optional().describe("Optional note about your mood")
    date: z.object({
      timezone: z.string().describe("IANA timezone, e.g. America/New_York"),
      dateInUsersTimezone: z.string().describe("ISO date string in user's timezone, e.g. 2026-03-27"),
    }).nullable().optional().describe("Date of the mood log")
    ```
  - Callback: `wrapSdkCall(Mood.moodCreate({ body: { mood, note, date } }))`

- [x] **Task 5: Implement `update_mood` tool** (AC: #3, #5, #6)
  - Description: `"Update an existing mood log. Provide the mood ID and the fields to update."`
  - Input schema (zod):
    ```
    id: z.string().describe("The mood log ID to update")
    data: z.object({
      mood: z.number().optional().describe("Mood value: 1=awful, 2=bad, 3=meh, 4=good, 5=rad"),
      note: z.string().nullable().optional().describe("Note about your mood"),
      date: z.object({
        timezone: z.string().describe("IANA timezone"),
        dateInUsersTimezone: z.string().describe("ISO date string in user's timezone"),
      }).nullable().optional().describe("Date of the mood log"),
    }).describe("Fields to update")
    ```
  - Callback: `wrapSdkCall(Mood.moodUpdate({ body: { id, data } }))`

- [x] **Task 6: Implement `delete_mood` tool** (AC: #4, #5, #6)
  - Description: `"Delete a mood log by ID"`
  - Input schema (zod):
    ```
    id: z.string().describe("The mood log ID to delete")
    ```
  - Callback: `wrapSdkCall(Mood.moodDelete({ body: { id } }))`

### Task Group C: Build and verification (AC: #7, #8)

- [x] **Task 7: Verify build** (AC: #7)
  - Run `pnpm --filter benji-mcp build` -- must succeed with no TypeScript errors
  - Run `pnpm build` (root recursive) -- must succeed for all three packages
  - Verify `packages/benji-mcp/dist/tools/mood.js` exists in compiled output

- [x] **Task 8: Verify tools appear in tools/list** (AC: #8)
  - Start the server with `BENJI_API_KEY=test-key`
  - Send `initialize` and `notifications/initialized` followed by `tools/list`
  - Verify all 4 tools appear: `list_mood`, `create_mood`, `update_mood`, `delete_mood`
  - Verify each tool has a `name`, `description`, and `inputSchema` with correct properties

- [ ] **Task 9: Verify tool invocation with real API** (AC: #1 through #4) -- SKIPPED (no real API key available)
  - Set real `BENJI_API_KEY` in environment
  - Test `list_mood` with `{}` -- verify structured response with array of mood logs
  - Test `create_mood` with `{ "mood": 4 }` -- verify returns mood log with `id`
  - Test `update_mood` with the created mood ID and `{ "data": { "mood": 5 } }` -- verify returns updated mood log
  - Test `delete_mood` with the created mood ID -- verify returns success response
  - Test error handling: call `delete_mood` with invalid ID -- verify structured error response with `isError: true`

## Dev Notes

### SDK Method Reference (Exact Signatures)

All methods are on the `Mood` class exported from `benji-sdk`. Each takes an `options` object with a `body` property.

| MCP Tool | SDK Method | Body Type | Required Body Fields |
|----------|-----------|-----------|---------------------|
| `list_mood` | `Mood.moodList(options)` | `{ date?: { year, month, day } }` | None (all optional) |
| `create_mood` | `Mood.moodCreate(options)` | `{ mood, note?, date?: { timezone, dateInUsersTimezone } \| null }` | `mood` |
| `update_mood` | `Mood.moodUpdate(options)` | `{ id, data: { mood?, note?, date?: { timezone, dateInUsersTimezone } \| null } }` | `id`, `data` |
| `delete_mood` | `Mood.moodDelete(options)` | `{ id }` | `id` |

### Mood Response Shape

All mood objects share this shape (from `MoodListResponses` / `MoodCreateResponses` / `MoodUpdateResponses`):
```typescript
{
  id: string;
  createdAt: string;
  updatedAt: string;
  mood: 'rad' | 'good' | 'meh' | 'bad' | 'awful';
  userId: string;
  note: string | null;
  emoji: string | null;
  date: string | null;
}
```

### MCP Tool Registration Pattern

Reuse the exact same pattern from `todos.ts`:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Mood, wrapSdkCall, BenjiApiError } from "benji-sdk";

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

// Example tool registration
server.registerTool(
  "list_mood",
  {
    description: "List mood logs. Optionally filter by date (year, month, day).",
    inputSchema: {
      date: z.object({
        year: z.number().describe("Year (e.g. 2026)"),
        month: z.number().describe("Month (1-12)"),
        day: z.number().describe("Day of month (1-31)"),
      }).optional().describe("Filter mood logs by date"),
    },
  },
  async ({ date }) => {
    try {
      const result = await wrapSdkCall(Mood.moodList({ body: { date } }));
      return toolResult(result);
    } catch (error) {
      return handleToolError(error);
    }
  }
);
```

### wrapSdkCall Error Handling Pattern

The `wrapSdkCall<T>(promise)` function from `benji-sdk`:
- Takes the raw SDK call promise (which returns `{ data?, error?, response }`)
- On success: extracts and returns `data` as type `T`
- On API error (4xx/5xx): throws `BenjiApiError` with `status`, `code`, `message`, `issues`
- On network error: throws `BenjiApiError` with `status: 0`, `code: "NETWORK_ERROR"`
- On empty response: throws `BenjiApiError` with `code: "EMPTY_RESPONSE"`

### ESM Import Requirements

- All relative imports MUST use `.js` extensions: `./tools/mood.js`
- Package imports use bare specifiers: `benji-sdk`, `zod`
- MCP SDK imports use deep paths: `@modelcontextprotocol/sdk/server/mcp.js`

### File Structure After This Story

```
packages/benji-mcp/
  src/
    index.ts          (UNCHANGED)
    server.ts         (MODIFIED -- imports and calls registerMoodTools)
    tools/
      todos.ts        (UNCHANGED)
      tags.ts         (UNCHANGED)
      projects.ts     (UNCHANGED)
      todo-lists.ts   (UNCHANGED)
      mood.ts         (NEW -- 4 tool registrations)
```

### Key Type Details

**Create body fields:** `mood` (number) is required; `note` (string|null) and `date` (timezone+dateInUsersTimezone object|null) are optional.

**Update body structure:** Uses the same `{ id, data: { ...fields } }` pattern as `update_tag`. The `data` object contains the fields to update, all optional.

**Delete response:** Returns `{ success: boolean, deletedCount: number }`.

**List body:** Takes an optional `date` object with `{ year: number, month: number, day: number }` -- note this is different from the create/update date schema which uses `{ timezone, dateInUsersTimezone }`.

### Additional SDK Methods Not Exposed

The `Mood` class also has `moodGet`, `moodGetForWidget`, `moodDeleteMany`, and `moodDeleteAll` methods. These are not exposed as MCP tools per the Story 2.7 requirements (which only requires list, create, update, delete).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 2, Story 2.7 -- acceptance criteria and technical notes]
- [Source: _bmad-output/sprint-artifacts/2-3-tag-tools.md -- tool pattern, helpers, registration approach]
- [Source: packages/benji-mcp/src/tools/tags.ts -- reference implementation for toolResult, handleToolError, registerTool pattern]
- [Source: packages/benji-mcp/src/server.ts -- createServer() factory function, tool wiring]
- [Source: packages/benji-sdk/src/client/sdk.gen.ts -- Mood class with all static methods]
- [Source: packages/benji-sdk/src/client/types.gen.ts -- MoodListData through MoodDeleteResponse types]
- [Source: packages/benji-sdk/src/wrapper.ts -- wrapSdkCall() implementation]
- [Source: packages/benji-sdk/src/errors.ts -- BenjiError, BenjiConfigError, BenjiApiError classes]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List

- All 4 mood tools (list_mood, create_mood, update_mood, delete_mood) implemented following the exact same pattern as tags.ts
- Build passes with zero TypeScript errors for both `pnpm --filter benji-mcp build` and `pnpm build` (root recursive)
- All 4 tools verified in tools/list via stdio with correct names, descriptions, and input schemas
- Task 9 (live API test) skipped -- no real API key available

### File List

- `packages/benji-mcp/src/tools/mood.ts` -- NEW -- 4 mood tool registrations (list_mood, create_mood, update_mood, delete_mood)
- `packages/benji-mcp/src/server.ts` -- MODIFIED -- added import and call for registerMoodTools
