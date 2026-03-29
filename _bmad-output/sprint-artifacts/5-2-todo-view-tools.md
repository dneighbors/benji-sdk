# Story 5.2: Todo View tools

Status: done

## Story

As an AI assistant,
I want MCP tools for viewing special todo lists in Benji (done, paused, recurring, shared, trash),
so that I can retrieve completed todos, paused todos, recurring todos, shared todo list info, and trashed todos.

## Acceptance Criteria

1. **AC-1: list_done_todos tool**
   - **Given** a valid API key
   - **When** `list_done_todos` is called with optional `taskType` filter ('personal', 'work', or 'both')
   - **Then** returns a structured JSON array of completed todo objects
   - **And** returns an error with structured message on API failure

2. **AC-2: list_paused_todos tool**
   - **Given** a valid API key
   - **When** `list_paused_todos` is called with optional `taskType` filter ('personal', 'work', or 'both')
   - **Then** returns a structured JSON array of paused todo objects
   - **And** returns an error with structured message on API failure

3. **AC-3: list_recurring_todos tool**
   - **Given** a valid API key
   - **When** `list_recurring_todos` is called with optional `taskType` filter ('personal', 'work', or 'both')
   - **Then** returns a structured JSON array of recurring todo objects
   - **And** returns an error with structured message on API failure

4. **AC-4: list_shared_todos tool**
   - **Given** a valid API key and a todo list ID
   - **When** `list_shared_todos` is called with required `listId`
   - **Then** returns a structured JSON object with sharing details (id, name, user, sharedWith, invites) or null
   - **And** returns an error with structured message on API failure

5. **AC-5: list_trash_todos tool**
   - **Given** a valid API key
   - **When** `list_trash_todos` is called with optional `skip` and `take` pagination params
   - **Then** returns a structured JSON array of trashed todo objects
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
   - **Then** all 5 todo view tools appear with their names, descriptions, and input schemas

## Tasks / Subtasks

### Task Group A: File setup and wiring (AC: #6, #7, #8)

- [x] **Task 1: Create `packages/benji-mcp/src/tools/todo-views.ts` with tool registration function** (AC: #6, #7, #8)
  - Create `todo-views.ts` that exports a `registerTodoViewTools(server: McpServer)` function
  - Import `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js`
  - Import `z` from `zod`
  - Import `TodoViews`, `wrapSdkCall` from `benji-sdk`
  - Import `toolResult`, `handleToolError` from `./util.js` (shared helpers)
  - Do NOT re-declare toolResult/handleToolError locally -- use the shared util module

- [x] **Task 2: Wire tool registration into server.ts** (AC: #8, #9)
  - In `packages/benji-mcp/src/server.ts`:
    - Import `registerTodoViewTools` from `./tools/todo-views.js`
    - Call `registerTodoViewTools(mcpServer)` after `registerWeightLogTools(mcpServer)`

### Task Group B: Tool implementations (AC: #1 through #5) -- parallelizable

- [x] **Task 3: Implement `list_done_todos` tool** (AC: #1, #6, #7)
  - Register tool via `server.registerTool("list_done_todos", { ... }, callback)`
  - Description: `"List completed (done) todos. Optionally filter by task type."`
  - Input schema (zod):
    ```
    taskType: z.enum(["personal", "work", "both"]).optional().describe("Filter by task type: 'personal', 'work', or 'both'. Defaults to all if omitted.")
    ```
  - Callback: `wrapSdkCall(TodoViews.todoViewsDone({ body: { taskType } }))`
  - Wrap in try/catch, catch returns `handleToolError(error)`

- [x] **Task 4: Implement `list_paused_todos` tool** (AC: #2, #6, #7)
  - Description: `"List paused todos. Optionally filter by task type."`
  - Input schema (zod):
    ```
    taskType: z.enum(["personal", "work", "both"]).optional().describe("Filter by task type: 'personal', 'work', or 'both'. Defaults to all if omitted.")
    ```
  - Callback: `wrapSdkCall(TodoViews.todoViewsPaused({ body: { taskType } }))`

- [x] **Task 5: Implement `list_recurring_todos` tool** (AC: #3, #6, #7)
  - Description: `"List recurring todos. Optionally filter by task type."`
  - Input schema (zod):
    ```
    taskType: z.enum(["personal", "work", "both"]).optional().describe("Filter by task type: 'personal', 'work', or 'both'. Defaults to all if omitted.")
    ```
  - Callback: `wrapSdkCall(TodoViews.todoViewsRecurring({ body: { taskType } }))`

- [x] **Task 6: Implement `list_shared_todos` tool** (AC: #4, #6, #7)
  - Description: `"Get sharing details for a todo list. Returns shared users and pending invites."`
  - Input schema (zod):
    ```
    listId: z.string().min(1).describe("The todo list ID to get sharing info for")
    ```
  - Callback: `wrapSdkCall(TodoViews.todoViewsSharing({ body: { listId } }))`
  - **Note:** `listId` is required (not optional) per `TodoViewsSharingData`

- [x] **Task 7: Implement `list_trash_todos` tool** (AC: #5, #6, #7)
  - Description: `"List trashed (deleted) todos with optional pagination."`
  - Input schema (zod):
    ```
    skip: z.number().int().min(0).optional().describe("Number of items to skip for pagination")
    take: z.number().int().min(1).max(100).optional().describe("Number of items to return (1-100)")
    ```
  - Callback: `wrapSdkCall(TodoViews.todoViewsTrash({ body: { skip, take } }))`

### Task Group C: Build and verification (AC: #8, #9)

- [x] **Task 8: Verify build** (AC: #8)
  - Run `pnpm --filter benji-mcp build` -- must succeed with no TypeScript errors
  - Run `pnpm build` (root recursive) -- must succeed for all three packages
  - Verify `packages/benji-mcp/dist/tools/todo-views.js` exists in compiled output

- [x] **Task 9: Verify tools appear in tools/list** (AC: #9)
  - Start the server with `BENJI_API_KEY=test-key`
  - Send `initialize` and `notifications/initialized` followed by `tools/list`
  - Verify all 5 tools appear: `list_done_todos`, `list_paused_todos`, `list_recurring_todos`, `list_shared_todos`, `list_trash_todos`
  - Verify each tool has a `name`, `description`, and `inputSchema` with correct properties

- [ ] **Task 10: Verify tool invocation with real API** (AC: #1 through #5) -- OPTIONAL (requires real API key) -- SKIPPED (no real API key available)

## Dev Notes

### SDK Method Reference (Exact Signatures)

All methods are on the `TodoViews` class exported from `benji-sdk`. The Todo Views API uses a **fully body-based pattern**: all operations pass parameters in the request body (POST endpoints). These are all read-only list/view operations.

| MCP Tool | SDK Method | Body Type | Required Fields |
|----------|-----------|-----------|-----------------|
| `list_done_todos` | `TodoViews.todoViewsDone(options?)` | `{ taskType?: 'personal' \| 'work' \| 'both' }` | None (all optional) |
| `list_paused_todos` | `TodoViews.todoViewsPaused(options?)` | `{ taskType?: 'personal' \| 'work' \| 'both' }` | None (all optional) |
| `list_recurring_todos` | `TodoViews.todoViewsRecurring(options?)` | `{ taskType?: 'personal' \| 'work' \| 'both' }` | None (all optional) |
| `list_shared_todos` | `TodoViews.todoViewsSharing(options)` | `{ listId: string }` | `listId` (body, required) |
| `list_trash_todos` | `TodoViews.todoViewsTrash(options?)` | `{ skip?: number, take?: number }` | None (all optional) |

### Body-Based Parameter Pattern

```typescript
// Optional body params:
TodoViews.todoViewsDone({ body: { taskType } })
TodoViews.todoViewsPaused({ body: { taskType } })
TodoViews.todoViewsRecurring({ body: { taskType } })
TodoViews.todoViewsTrash({ body: { skip, take } })

// Required body params:
TodoViews.todoViewsSharing({ body: { listId } })
```

### Response Shapes

**Done/Paused/Recurring/Trash**: `Array<{ [key: string]: unknown }>` (generic todo objects)

**Sharing** (`TodoViewsSharingResponses`):
```typescript
{
  id: string;
  name?: string | null;
  user?: { [key: string]: unknown } | null;
  sharedWith: Array<{ [key: string]: unknown }>;
  invites: Array<{ [key: string]: unknown }>;
} | null
```

### MCP Tool Registration Pattern

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TodoViews, wrapSdkCall } from "benji-sdk";
import { toolResult, handleToolError } from "./util.js";

export function registerTodoViewTools(server: McpServer): void {
  server.registerTool("list_done_todos", { ... }, async ({ taskType }) => {
    try {
      const result = await wrapSdkCall(
        TodoViews.todoViewsDone({ body: { taskType } }),
      );
      return toolResult(result);
    } catch (error) {
      return handleToolError(error);
    }
  });
  // ... etc
}
```

### ESM Import Requirements

- All relative imports MUST use `.js` extensions: `./tools/todo-views.js`
- Package imports use bare specifiers: `benji-sdk`, `zod`
- MCP SDK imports use deep paths: `@modelcontextprotocol/sdk/server/mcp.js`

### Key Characteristics

1. **All read-only**: No create/update/delete operations. All 5 tools are list/view operations.
2. **POST endpoints**: Despite being read-only, all use POST (body-based params), not GET.
3. **taskType filter**: Done, Paused, and Recurring share the same `taskType` enum filter.
4. **Pagination on Trash only**: Only `list_trash_todos` has `skip`/`take` pagination.
5. **Sharing requires listId**: Only `list_shared_todos` has a required parameter.
6. **No date schemas needed**: No `tzDateSchema` or `ymdDateSchema` imports required.

### File Structure After This Story

```
packages/benji-mcp/
  src/
    index.ts          (UNCHANGED)
    server.ts         (MODIFIED -- imports and calls registerTodoViewTools)
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
      weight-logs.ts  (UNCHANGED)
      todo-views.ts   (NEW -- 5 tool registrations)
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 5, Story 5.2 -- acceptance criteria and tool list]
- [Source: _bmad-output/sprint-artifacts/5-1-weight-log-tools.md -- reference story format and patterns]
- [Source: packages/benji-mcp/src/tools/weight-logs.ts -- reference implementation for body-based tool registration pattern]
- [Source: packages/benji-mcp/src/tools/util.ts -- shared toolResult, handleToolError helpers]
- [Source: packages/benji-mcp/src/server.ts -- createServer() factory function, tool wiring]
- [Source: packages/benji-sdk/src/client/sdk.gen.ts lines 2983-3067 -- TodoViews class with all 5 static methods]
- [Source: packages/benji-sdk/src/client/types.gen.ts lines 14151-14372 -- TodoViewsDoneData through TodoViewsSharingResponse types]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

None.

### Completion Notes List

- All 5 todo view MCP tools implemented following the body-based parameter pattern
- Shared helpers (toolResult, handleToolError) imported from ./util.js -- no local re-declarations
- taskType enum filter (personal/work/both) used for done, paused, and recurring views
- Pagination (skip/take) for trash view only
- Required listId parameter for sharing view
- No date schemas needed -- these are simple read-only list endpoints
- pnpm --filter benji-mcp build: PASS (zero errors)
- pnpm build (root recursive): PASS (all 3 packages)
- tools/list verification: all 5 tools present with correct names, descriptions, and input schemas
- Task 10 (real API verification) skipped -- optional, requires real API key

### File List

- `packages/benji-mcp/src/tools/todo-views.ts` -- NEW: 5 todo view tool registrations
- `packages/benji-mcp/src/server.ts` -- MODIFIED: import and call registerTodoViewTools
