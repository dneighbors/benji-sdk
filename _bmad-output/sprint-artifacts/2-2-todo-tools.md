# Story 2.2: Todo tools

Status: dev-complete

## Story

As an AI assistant,
I want MCP tools for managing Benji todos,
so that I can list, create, update, toggle, and delete todos, and filter them by tag, project, or list.

## Acceptance Criteria

1. **AC-1: list_todos tool**
   - **Given** a valid API key
   - **When** `list_todos` is called with optional `screen` param (`today`, `overview`, `inbox`)
   - **Then** returns a structured JSON array of todos
   - **And** supports optional `date`, `search`, and `filters` parameters
   - **And** returns an error with structured message on API failure

2. **AC-2: create_todo tool**
   - **Given** valid input with at minimum a `title`
   - **When** `create_todo` is called with title and optional fields (description, emoji, dueDate, plannedDate, startDate, priority, taskType, recurring fields, annoyingLevel, mandatory, private, pinned, waiting, waitingReason, location, link, durationInSeconds, timeOfDay, timeBlockId, completed, isInInbox, tagIds, listId, listSectionId, projectId, projectSectionId, assigneeId)
   - **Then** creates and returns the todo with its `id`
   - **And** returns an error with structured message on API failure

3. **AC-3: update_todo tool**
   - **Given** a valid todo ID and at least one field to update
   - **When** `update_todo` is called with `id` and a `data` object of updatable fields
   - **Then** updates and returns the todo
   - **And** returns an error with structured message on API failure

4. **AC-4: toggle_todo tool**
   - **Given** a valid todo ID
   - **When** `toggle_todo` is called with the ID
   - **Then** toggles the completion status and returns the updated todo
   - **And** returns an error with structured message on API failure

5. **AC-5: delete_todo tool**
   - **Given** a valid todo ID
   - **When** `delete_todo` is called with the ID
   - **Then** deletes the todo and returns `{ success: true, deletedCount: number }`
   - **And** returns an error with structured message on API failure

6. **AC-6: list_todos_by_tag tool**
   - **Given** a valid tag ID
   - **When** `list_todos_by_tag` is called with `tagId` and optional `taskType`
   - **Then** returns the filtered list of todos
   - **And** returns an error with structured message on API failure

7. **AC-7: list_todos_by_project tool**
   - **Given** a valid project ID
   - **When** `list_todos_by_project` is called with `projectId` and optional `taskType`
   - **Then** returns the filtered list of todos
   - **And** returns an error with structured message on API failure

8. **AC-8: list_todos_by_list tool**
   - **Given** a valid list ID
   - **When** `list_todos_by_list` is called with `listId` and optional `taskType`
   - **Then** returns the filtered list of todos
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
    - **Then** all 8 todo tools appear with their names, descriptions, and input schemas

## Tasks / Subtasks

### Task Group A: Tool infrastructure setup (AC: #9, #10, #11)

- [x] **Task 1: Create `packages/benji-mcp/src/tools/todos.ts` with tool registration function** (AC: #9, #10, #11)
  - Create directory `packages/benji-mcp/src/tools/`
  - Create `todos.ts` that exports a `registerTodoTools(server: McpServer)` function
  - Import `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js`
  - Import `z` from `zod`
  - Import `Todos`, `wrapSdkCall`, `BenjiApiError` from `benji-sdk`
  - Define a shared error-handling helper: `handleToolError(error: unknown)` that:
    - If `error instanceof BenjiApiError`: returns `{ content: [{ type: "text", text: JSON.stringify({ code: error.code, message: error.message, issues: error.issues }) }], isError: true }`
    - Otherwise: returns `{ content: [{ type: "text", text: JSON.stringify({ code: "UNKNOWN_ERROR", message: String(error) }) }], isError: true }`
  - Define a shared success helper: `toolResult(data: unknown)` that returns `{ content: [{ type: "text", text: JSON.stringify(data) }] }`

- [x] **Task 2: Wire tool registration into server.ts** (AC: #11, #12)
  - In `packages/benji-mcp/src/server.ts`:
    - Import `registerTodoTools` from `./tools/todos.js`
    - Call `registerTodoTools(mcpServer)` after server creation, before returning
  - Remove the manual `tools/list` handler registration from Story 2.1 (if present) since `registerTool()` will auto-register the tools capability

### Task Group B: List tools (AC: #1, #6, #7, #8) -- parallelizable

- [x] **Task 3: Implement `list_todos` tool** (AC: #1, #9, #10)
  - Register tool via `server.registerTool("list_todos", { ... }, callback)`
  - Description: `"List todos with optional filters. Use screen param to get today's todos, overview, or inbox."`
  - Input schema (zod):
    ```
    screen: z.enum(["today", "overview", "inbox"]).optional()
    date: z.string().optional().describe("ISO date string, e.g. 2026-03-27")
    search: z.string().optional().describe("Search query to filter todos by title")
    taskType: z.enum(["personal", "work", "both"]).optional()
    showCompleted: z.boolean().optional()
    onlyMandatory: z.boolean().optional()
    timeOfDay: z.enum(["Any", "Auto", "Morning", "Afternoon", "Evening", "Night"]).optional()
    ```
  - Callback: calls `wrapSdkCall(Todos.todosList({ body: { screen, date, search, filters: { taskType, showCompleted, onlyMandatory, timeOfDay } } }))`, returns `toolResult(data)`
  - Wrap in try/catch, catch returns `handleToolError(error)`

- [x] **Task 4: Implement `list_todos_by_tag` tool** (AC: #6, #9, #10)
  - Description: `"List todos filtered by tag ID"`
  - Input schema:
    ```
    tagId: z.string().describe("The tag ID to filter by")
    taskType: z.enum(["personal", "work", "both"]).optional()
    ```
  - Callback: `wrapSdkCall(Todos.todosByTag({ body: { tagId, taskType } }))`

- [x] **Task 5: Implement `list_todos_by_project` tool** (AC: #7, #9, #10)
  - Description: `"List todos filtered by project ID"`
  - Input schema:
    ```
    projectId: z.string().describe("The project ID to filter by")
    taskType: z.enum(["personal", "work", "both"]).optional()
    ```
  - Callback: `wrapSdkCall(Todos.todosByProject({ body: { projectId, taskType } }))`

- [x] **Task 6: Implement `list_todos_by_list` tool** (AC: #8, #9, #10)
  - Description: `"List todos filtered by todo list ID"`
  - Input schema:
    ```
    listId: z.string().describe("The todo list ID to filter by")
    taskType: z.enum(["personal", "work", "both"]).optional()
    ```
  - Callback: `wrapSdkCall(Todos.todosByList({ body: { listId, taskType } }))`

### Task Group C: Mutation tools (AC: #2, #3, #4, #5) -- parallelizable

- [x] **Task 7: Implement `create_todo` tool** (AC: #2, #9, #10)
  - Description: `"Create a new todo. Only title is required; all other fields are optional."`
  - Input schema (zod):
    ```
    title: z.string().describe("The todo title (required)")
    description: z.string().nullable().optional()
    emoji: z.string().nullable().optional()
    dueDate: z.object({ timezone: z.string(), dateInUsersTimezone: z.string() }).nullable().optional()
    plannedDate: z.object({ timezone: z.string(), dateInUsersTimezone: z.string() }).nullable().optional()
    startDate: z.object({ timezone: z.string(), dateInUsersTimezone: z.string() }).nullable().optional()
    priority: z.enum(["low", "medium", "high"]).optional()
    taskType: z.enum(["work", "personal", "both"]).optional()
    recurring: z.boolean().optional()
    recurringInterval: z.number().nullable().optional()
    recurringIntervalUnit: z.enum(["day", "week", "month", "year"]).nullable().optional()
    recurringCompletionType: z.enum(["FromCompletion", "FromDueDate"]).nullable().optional()
    annoyingLevel: z.enum(["fewTimesPerDay", "everyDay", "everyWeek", "everyMonth", "notAnnoying"]).optional()
    mandatory: z.boolean().optional()
    private: z.boolean().optional()
    pinned: z.boolean().optional()
    waiting: z.boolean().optional()
    waitingReason: z.string().nullable().optional()
    location: z.string().nullable().optional()
    link: z.string().nullable().optional()
    durationInSeconds: z.number().nullable().optional()
    timeOfDay: z.enum(["Morning", "Afternoon", "Evening", "Night", "Any"]).nullable().optional()
    timeBlockId: z.string().nullable().optional()
    completed: z.boolean().optional()
    isInInbox: z.boolean().nullable().optional()
    tagIds: z.array(z.string()).optional()
    listId: z.string().nullable().optional()
    listSectionId: z.string().nullable().optional()
    projectId: z.string().nullable().optional()
    projectSectionId: z.string().nullable().optional()
    assigneeId: z.string().nullable().optional()
    ```
  - Callback: pass all fields as the `body` to `Todos.todosCreate({ body: { ...args } })`

- [x] **Task 8: Implement `update_todo` tool** (AC: #3, #9, #10)
  - Description: `"Update an existing todo. Provide the todo ID and the fields to update."`
  - Input schema:
    ```
    id: z.string().describe("The todo ID to update")
    data: z.object({
      title: z.string().optional(),
      description: z.string().nullable().optional(),
      emoji: z.string().nullable().optional(),
      dueDate: z.object({ timezone: z.string(), dateInUsersTimezone: z.string() }).nullable().optional(),
      plannedDate: z.object({ timezone: z.string(), dateInUsersTimezone: z.string() }).nullable().optional(),
      startDate: z.object({ timezone: z.string(), dateInUsersTimezone: z.string() }).nullable().optional(),
      priority: z.enum(["low", "medium", "high"]).optional(),
      taskType: z.enum(["work", "personal", "both"]).optional(),
      recurring: z.boolean().optional(),
      recurringInterval: z.number().nullable().optional(),
      recurringIntervalUnit: z.enum(["day", "week", "month", "year"]).nullable().optional(),
      recurringCompletionType: z.enum(["FromCompletion", "FromDueDate"]).nullable().optional(),
      annoyingLevel: z.enum(["fewTimesPerDay", "everyDay", "everyWeek", "everyMonth", "notAnnoying"]).optional(),
      mandatory: z.boolean().optional(),
      private: z.boolean().optional(),
      pinned: z.boolean().optional(),
      waiting: z.boolean().optional(),
      waitingReason: z.string().nullable().optional(),
      location: z.string().nullable().optional(),
      link: z.string().nullable().optional(),
      durationInSeconds: z.number().nullable().optional(),
      timeOfDay: z.enum(["Morning", "Afternoon", "Evening", "Night", "Any"]).nullable().optional(),
      timeBlockId: z.string().nullable().optional(),
      completed: z.boolean().optional(),
      isInInbox: z.boolean().nullable().optional(),
      tagIds: z.array(z.string()).optional(),
      listId: z.string().nullable().optional(),
      listSectionId: z.string().nullable().optional(),
      projectId: z.string().nullable().optional(),
      projectSectionId: z.string().nullable().optional(),
      assigneeId: z.string().nullable().optional(),
    }).describe("Fields to update")
    ```
  - Callback: `wrapSdkCall(Todos.todosUpdate({ body: { id, data } }))`

- [x] **Task 9: Implement `toggle_todo` tool** (AC: #4, #9, #10)
  - Description: `"Toggle the completion status of a todo"`
  - Input schema:
    ```
    id: z.string().describe("The todo ID to toggle")
    ```
  - Callback: `wrapSdkCall(Todos.todosToggle({ body: { id } }))`

- [x] **Task 10: Implement `delete_todo` tool** (AC: #5, #9, #10)
  - Description: `"Delete a todo by ID"`
  - Input schema:
    ```
    id: z.string().describe("The todo ID to delete")
    ```
  - Callback: `wrapSdkCall(Todos.todosDelete({ body: { id } }))`

### Task Group D: Build and verification (AC: #11, #12)

- [x] **Task 11: Verify build** (AC: #11)
  - Run `pnpm --filter benji-mcp build` -- must succeed with no TypeScript errors
  - Run `pnpm build` (root recursive) -- must succeed for all three packages
  - Verify `packages/benji-mcp/dist/tools/todos.js` exists in compiled output

- [x] **Task 12: Verify tools appear in tools/list** (AC: #12)
  - Start the server with `BENJI_API_KEY=test-key`
  - Send `initialize` and `notifications/initialized` followed by `tools/list`
  - Verify all 8 tools appear: `list_todos`, `create_todo`, `update_todo`, `toggle_todo`, `delete_todo`, `list_todos_by_tag`, `list_todos_by_project`, `list_todos_by_list`
  - Verify each tool has a `name`, `description`, and `inputSchema` with correct properties

- [ ] **Task 13: Verify tool invocation with real API** (AC: #1 through #8)
  - Set real `BENJI_API_KEY` in environment
  - Test `list_todos` with `{ "screen": "today" }` -- verify structured response
  - Test `create_todo` with `{ "title": "Test from MCP" }` -- verify returns `{ id: "..." }`
  - Test `toggle_todo` with the created todo ID -- verify returns updated todo
  - Test `delete_todo` with the created todo ID -- verify returns `{ success: true }`
  - Test error handling: call `toggle_todo` with invalid ID -- verify structured error response with `isError: true`

## Dev Notes

### SDK Method Reference (Exact Signatures)

All methods are on the `Todos` class exported from `benji-sdk`. Each takes an `options` object with a `body` property.

| MCP Tool | SDK Method | Body Type | Required Body Fields |
|----------|-----------|-----------|---------------------|
| `list_todos` | `Todos.todosList(options?)` | `{ screen?, date?, search?, filters? }` | None (all optional) |
| `list_todos_by_tag` | `Todos.todosByTag(options)` | `{ tagId, taskType? }` | `tagId` |
| `list_todos_by_project` | `Todos.todosByProject(options)` | `{ projectId, taskType? }` | `projectId` |
| `list_todos_by_list` | `Todos.todosByList(options)` | `{ listId, taskType? }` | `listId` |
| `create_todo` | `Todos.todosCreate(options)` | `{ title, ...optionalFields }` | `title` |
| `update_todo` | `Todos.todosUpdate(options)` | `{ id, data: { ...fields } }` | `id`, `data` |
| `toggle_todo` | `Todos.todosToggle(options)` | `{ id }` | `id` |
| `delete_todo` | `Todos.todosDelete(options)` | `{ id }` | `id` |

### MCP Tool Registration Pattern

Use `McpServer.registerTool()` (the non-deprecated API in @modelcontextprotocol/sdk v1.28.0):

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Todos, wrapSdkCall, BenjiApiError } from "benji-sdk";

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
  "toggle_todo",
  {
    description: "Toggle the completion status of a todo",
    inputSchema: {
      id: z.string().describe("The todo ID to toggle"),
    },
  },
  async ({ id }) => {
    try {
      const result = await wrapSdkCall(Todos.todosToggle({ body: { id } }));
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

- All relative imports MUST use `.js` extensions: `./tools/todos.js`
- Package imports use bare specifiers: `benji-sdk`, `zod`
- MCP SDK imports use deep paths: `@modelcontextprotocol/sdk/server/mcp.js`

### File Structure After This Story

```
packages/benji-mcp/
  src/
    index.ts          (UNCHANGED)
    server.ts         (MODIFIED -- imports and calls registerTodoTools)
    tools/
      todos.ts        (NEW -- 8 tool registrations)
```

### Key Type Details

**Date objects in create/update:** Date fields (`dueDate`, `plannedDate`, `startDate`) use a structured object format, not plain strings:
```typescript
{ timezone: string; dateInUsersTimezone: string }  // e.g. { timezone: "America/Chicago", dateInUsersTimezone: "2026-03-28" }
```

**Filters in list_todos:** The `filters` object is nested in the body:
```typescript
{ body: { screen, date, search, filters: { taskType, showCompleted, onlyMandatory, timeOfDay } } }
```
For cleaner MCP UX, flatten these into top-level tool params (screen, date, search, taskType, showCompleted, onlyMandatory, timeOfDay) and reconstruct the nested structure in the callback.

**Response shapes:**
- List endpoints return objects with a `todos` array (among other fields)
- Create/update/toggle return `{ id, title?, completed?, deleted?, ...additionalFields }`
- Delete returns `{ success: true, deletedCount: number }`

### Completion Notes from Story 2.1

- `registerTool()` will automatically handle `tools` capability declaration and `tools/list` responses. The manual `ListToolsRequestSchema` handler from Story 2.1 can be removed.
- All console output MUST go to `stderr`. `stdout` is reserved for MCP protocol messages.
- The server factory pattern in `server.ts` makes it straightforward to add tool registration calls.

### Project Structure Notes

- This story adds one new file (`src/tools/todos.ts`) and modifies one existing file (`src/server.ts`)
- The `tools/` directory pattern will be reused by Stories 2.3-2.7 for Tags, Projects, TodoLists, Habits, Mood
- `handleToolError()` and `toolResult()` helpers should be defined at the top of `todos.ts` for now; they will be extracted to a shared utility if the pattern proves stable across Stories 2.3-2.7

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 2, Story 2.2 -- acceptance criteria and technical notes]
- [Source: _bmad-output/sprint-artifacts/2-1-scaffold-mcp-server-with-stdio-transport.md -- server factory pattern, completion notes]
- [Source: packages/benji-mcp/src/server.ts -- createServer() factory function]
- [Source: packages/benji-mcp/src/index.ts -- entry point with stdio transport]
- [Source: packages/benji-sdk/src/client/sdk.gen.ts lines 835-1072 -- Todos class with all static methods]
- [Source: packages/benji-sdk/src/client/types.gen.ts lines 3557-7875 -- TodosGetData through TodosDeleteManyResponse types]
- [Source: packages/benji-sdk/src/wrapper.ts -- wrapSdkCall() implementation]
- [Source: packages/benji-sdk/src/errors.ts -- BenjiError, BenjiConfigError, BenjiApiError classes]
- [Source: node_modules/@modelcontextprotocol/sdk v1.28.0 -- registerTool() API signature]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List

- Tasks 1-12 complete. Task 13 skipped (no real API key available).
- All 8 tools registered via `server.registerTool()` with zod input schemas.
- Shared `todoFieldsSchema` extracted to avoid duplication between create and update.
- `list_todos` flattens filter params to top-level and reconstructs nested `filters` object in callback.
- `pnpm --filter benji-mcp build` and `pnpm build` both pass with zero errors.
- `tools/list` verified: all 8 tools returned with correct names, descriptions, and inputSchemas.

### File List

- `packages/benji-mcp/src/tools/todos.ts` (NEW) -- 8 tool registrations, handleToolError, toolResult helpers
- `packages/benji-mcp/src/server.ts` (MODIFIED) -- import + call registerTodoTools
