# Story 2.5: Todo List tools

Status: dev-complete

## Story

As an AI assistant,
I want MCP tools for managing Benji todo lists,
so that I can list, create, update, and delete todo lists.

## Acceptance Criteria

1. **AC-1: list_todo_lists tool**
   - **Given** a valid API key
   - **When** `list_todo_lists` is called with optional `taskType` param (`personal`, `work`, `both`)
   - **Then** returns a structured JSON array of todo lists
   - **And** returns an error with structured message on API failure

2. **AC-2: create_todo_list tool**
   - **Given** valid input with at minimum a `name`
   - **When** `create_todo_list` is called with name and optional fields (emoji, description, parentListId, taskType, showInOverview, showInSidebar, paused, priority, tagIds, defaultAssigneeId)
   - **Then** creates and returns the todo list with its `id`
   - **And** returns an error with structured message on API failure

3. **AC-3: update_todo_list tool**
   - **Given** a valid todo list ID and at least one field to update
   - **When** `update_todo_list` is called with `id` and a `data` object of updatable fields
   - **Then** updates and returns the todo list
   - **And** returns an error with structured message on API failure

4. **AC-4: delete_todo_list tool**
   - **Given** a valid todo list ID
   - **When** `delete_todo_list` is called with the ID
   - **Then** deletes the todo list and returns `{ success: true, deletedCount: number }`
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
   - **Then** all 4 todo list tools appear with their names, descriptions, and input schemas

## Tasks / Subtasks

### Task Group A: File setup and wiring (AC: #5, #6, #7, #8)

- [x] **Task 1: Create `packages/benji-mcp/src/tools/todo-lists.ts` with tool registration function** (AC: #5, #6, #7)
  - Create `todo-lists.ts` that exports a `registerTodoListTools(server: McpServer)` function
  - Import `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js`
  - Import `z` from `zod`
  - Import `TodoLists`, `wrapSdkCall`, `BenjiApiError` from `benji-sdk`
  - Reuse the same `toolResult()` and `handleToolError()` helper pattern from `todos.ts`

- [x] **Task 2: Wire tool registration into server.ts** (AC: #7, #8)
  - In `packages/benji-mcp/src/server.ts`:
    - Import `registerTodoListTools` from `./tools/todo-lists.js`
    - Call `registerTodoListTools(mcpServer)` after existing `registerTodoTools(mcpServer)` call

### Task Group B: Tool implementations (AC: #1, #2, #3, #4) -- parallelizable

- [x] **Task 3: Implement `list_todo_lists` tool** (AC: #1, #5, #6)
  - Register tool via `server.registerTool("list_todo_lists", { ... }, callback)`
  - Description: `"List all todo lists for the current user. Optionally filter by task type."`
  - Input schema (zod):
    ```
    taskType: z.enum(["personal", "work", "both"]).optional().describe("Filter lists by task type")
    ```
  - Callback: calls `wrapSdkCall(TodoLists.todoListsList({ body: { taskType } }))`, returns `toolResult(result)`
  - Wrap in try/catch, catch returns `handleToolError(error)`

- [x] **Task 4: Implement `create_todo_list` tool** (AC: #2, #5, #6)
  - Description: `"Create a new todo list. Only name is required; all other fields are optional."`
  - Input schema (zod):
    ```
    name: z.string().describe("The todo list name (required)")
    emoji: z.string().nullable().optional().describe("Emoji icon for the list")
    description: z.string().nullable().optional().describe("Description of the list")
    parentListId: z.string().nullable().optional().describe("ID of a parent list for nesting")
    taskType: z.enum(["work", "personal", "both"]).optional().describe("Task type for the list")
    showInOverview: z.boolean().optional().describe("Whether to show this list in the overview")
    showInSidebar: z.boolean().optional().describe("Whether to show this list in the sidebar")
    paused: z.boolean().optional().describe("Whether the list is paused")
    priority: z.enum(["low", "medium", "high"]).optional().describe("Priority level of the list")
    tagIds: z.array(z.string()).nullable().optional().describe("Tag IDs to associate with this list")
    defaultAssigneeId: z.string().nullable().optional().describe("Default assignee ID for todos in this list")
    ```
  - Callback: pass all fields as the `body` to `TodoLists.todoListsCreate({ body: { ...args } })`

- [x] **Task 5: Implement `update_todo_list` tool** (AC: #3, #5, #6)
  - Description: `"Update an existing todo list. Provide the list ID and the fields to update."`
  - Input schema (zod):
    ```
    id: z.string().describe("The todo list ID to update")
    data: z.object({
      name: z.string().optional(),
      emoji: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
      parentListId: z.string().nullable().optional(),
      taskType: z.enum(["work", "personal", "both"]).optional(),
      showInOverview: z.boolean().optional(),
      showInSidebar: z.boolean().optional(),
      paused: z.boolean().optional(),
      priority: z.enum(["low", "medium", "high"]).optional(),
      tagIds: z.array(z.string()).nullable().optional(),
      defaultAssigneeId: z.string().nullable().optional(),
    }).describe("Fields to update")
    ```
  - Callback: `wrapSdkCall(TodoLists.todoListsUpdate({ body: { id, data } }))`

- [x] **Task 6: Implement `delete_todo_list` tool** (AC: #4, #5, #6)
  - Description: `"Delete a todo list by ID"`
  - Input schema (zod):
    ```
    id: z.string().describe("The todo list ID to delete")
    ```
  - Callback: `wrapSdkCall(TodoLists.todoListsDelete({ body: { id } }))`

### Task Group C: Build and verification (AC: #7, #8)

- [x] **Task 7: Verify build** (AC: #7)
  - Run `pnpm --filter benji-mcp build` -- must succeed with no TypeScript errors
  - Run `pnpm build` (root recursive) -- must succeed for all three packages
  - Verify `packages/benji-mcp/dist/tools/todo-lists.js` exists in compiled output

- [x] **Task 8: Verify tools appear in tools/list** (AC: #8)
  - Start the server with `BENJI_API_KEY=test-key`
  - Send `initialize` and `notifications/initialized` followed by `tools/list`
  - Verify all 4 tools appear: `list_todo_lists`, `create_todo_list`, `update_todo_list`, `delete_todo_list`
  - Verify each tool has a `name`, `description`, and `inputSchema` with correct properties

- [ ] **Task 9: Verify tool invocation with real API** (AC: #1 through #4) -- SKIPPED: no real API key available
  - Set real `BENJI_API_KEY` in environment
  - Test `list_todo_lists` with `{}` -- verify structured response
  - Test `create_todo_list` with `{ "name": "Test List from MCP" }` -- verify returns `{ id: "..." }`
  - Test `update_todo_list` with the created list ID and `{ "data": { "name": "Updated Test List" } }` -- verify returns updated list
  - Test `delete_todo_list` with the created list ID -- verify returns `{ success: true, deletedCount: ... }`
  - Test error handling: call `delete_todo_list` with invalid ID -- verify structured error response with `isError: true`

## Dev Notes

### SDK Method Reference (Exact Signatures)

All methods are on the `TodoLists` class exported from `benji-sdk`. Each takes an `options` object with a `body` property.

| MCP Tool | SDK Method | Body Type | Required Body Fields |
|----------|-----------|-----------|---------------------|
| `list_todo_lists` | `TodoLists.todoListsList(options)` | `{ taskType? }` | None (taskType optional) |
| `create_todo_list` | `TodoLists.todoListsCreate(options)` | `{ name, ...optionalFields }` | `name` |
| `update_todo_list` | `TodoLists.todoListsUpdate(options)` | `{ id, data: { ...fields } }` | `id`, `data` |
| `delete_todo_list` | `TodoLists.todoListsDelete(options)` | `{ id }` | `id` |

### MCP Tool Registration Pattern

Follows the exact same pattern established in `todos.ts` (Story 2.2):

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TodoLists, wrapSdkCall, BenjiApiError } from "benji-sdk";

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
  "list_todo_lists",
  {
    description: "List all todo lists for the current user. Optionally filter by task type.",
    inputSchema: {
      taskType: z.enum(["personal", "work", "both"]).optional().describe("Filter lists by task type"),
    },
  },
  async ({ taskType }) => {
    try {
      const result = await wrapSdkCall(TodoLists.todoListsList({ body: { taskType } }));
      return toolResult(result);
    } catch (error) {
      return handleToolError(error);
    }
  }
);
```

### Shared Todo List Fields Schema

The create and update tools share the same updatable fields. Extract a `todoListFieldsSchema` object to avoid duplication:

```typescript
const todoListFieldsSchema = {
  emoji: z.string().nullable().optional().describe("Emoji icon for the list"),
  description: z.string().nullable().optional().describe("Description of the list"),
  parentListId: z.string().nullable().optional().describe("ID of a parent list for nesting"),
  taskType: z.enum(["work", "personal", "both"]).optional().describe("Task type for the list"),
  showInOverview: z.boolean().optional().describe("Whether to show this list in the overview"),
  showInSidebar: z.boolean().optional().describe("Whether to show this list in the sidebar"),
  paused: z.boolean().optional().describe("Whether the list is paused"),
  priority: z.enum(["low", "medium", "high"]).optional().describe("Priority level of the list"),
  tagIds: z.array(z.string()).nullable().optional().describe("Tag IDs to associate with this list"),
  defaultAssigneeId: z.string().nullable().optional().describe("Default assignee ID for todos in this list"),
};
```

Use in create: `{ name: z.string().describe("..."), ...todoListFieldsSchema }`
Use in update: `{ id: z.string().describe("..."), data: z.object({ name: z.string().optional(), ...todoListFieldsSchema }).describe("Fields to update") }`

### wrapSdkCall Error Handling Pattern

The `wrapSdkCall<T>(promise)` function from `benji-sdk`:
- Takes the raw SDK call promise (which returns `{ data?, error?, response }`)
- On success: extracts and returns `data` as type `T`
- On API error (4xx/5xx): throws `BenjiApiError` with `status`, `code`, `message`, `issues`
- On network error: throws `BenjiApiError` with `status: 0`, `code: "NETWORK_ERROR"`
- On empty response: throws `BenjiApiError` with `code: "EMPTY_RESPONSE"`

### ESM Import Requirements

- All relative imports MUST use `.js` extensions: `./tools/todo-lists.js`
- Package imports use bare specifiers: `benji-sdk`, `zod`
- MCP SDK imports use deep paths: `@modelcontextprotocol/sdk/server/mcp.js`

### File Structure After This Story

```
packages/benji-mcp/
  src/
    index.ts          (UNCHANGED)
    server.ts         (MODIFIED -- imports and calls registerTodoListTools)
    tools/
      todos.ts        (UNCHANGED -- from Story 2.2)
      todo-lists.ts   (NEW -- 4 tool registrations)
```

### Key Type Details

**TodoListsListData body:** `{ taskType?: 'personal' | 'work' | 'both' }` -- single optional filter field.

**TodoListsCreateData body:** `{ name: string; emoji?: string | null; description?: string | null; parentListId?: string | null; taskType?: 'work' | 'personal' | 'both'; showInOverview?: boolean; showInSidebar?: boolean; paused?: boolean; priority?: 'low' | 'medium' | 'high'; tagIds?: Array<string> | null; defaultAssigneeId?: string | null }` -- `name` is the only required field.

**TodoListsUpdateData body:** `{ id: string; data: { name?: string; emoji?: string | null; description?: string | null; parentListId?: string | null; taskType?: 'work' | 'personal' | 'both'; showInOverview?: boolean; showInSidebar?: boolean; paused?: boolean; priority?: 'low' | 'medium' | 'high'; tagIds?: Array<string> | null; defaultAssigneeId?: string | null } }` -- `id` and `data` are required; all fields inside `data` are optional.

**TodoListsDeleteData body:** `{ id: string }` -- only the ID is needed.

**Response shapes:**
- List endpoint returns an array of todo list objects with `id`, `name`, `emoji`, `taskType`, `isTemplate`, `paused`, `priority`, `tags`, `sections`
- Create/update returns a single todo list object with `id`, `name`, and other fields
- Delete returns `{ success: true, deletedCount: number }`

### Completion Notes from Story 2.2

- `registerTool()` automatically handles `tools` capability declaration and `tools/list` responses.
- All console output MUST go to `stderr`. `stdout` is reserved for MCP protocol messages.
- The server factory pattern in `server.ts` makes it straightforward to add tool registration calls.
- `handleToolError()` and `toolResult()` helpers are duplicated per tool file for now; extraction to shared utility will happen if pattern proves stable.

### Project Structure Notes

- This story adds one new file (`src/tools/todo-lists.ts`) and modifies one existing file (`src/server.ts`)
- The `tools/` directory pattern is established by Story 2.2 and reused here
- Follows exact same conventions as `todos.ts` for consistency

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 2, Story 2.5 -- acceptance criteria and technical notes]
- [Source: _bmad-output/sprint-artifacts/2-2-todo-tools.md -- todo tools story pattern and dev notes]
- [Source: packages/benji-mcp/src/tools/todos.ts -- reference implementation for tool registration pattern]
- [Source: packages/benji-mcp/src/server.ts -- createServer() factory function]
- [Source: packages/benji-sdk/src/client/sdk.gen.ts lines 1430-1566 -- TodoLists class with all static methods]
- [Source: packages/benji-sdk/src/client/types.gen.ts lines 9202-9691 -- TodoListsListData through TodoListsDeleteResponse types]
- [Source: packages/benji-sdk/src/client/index.ts line 3 -- TodoLists exported from SDK]
- [Source: packages/benji-sdk/src/wrapper.ts -- wrapSdkCall() implementation]
- [Source: packages/benji-sdk/src/errors.ts -- BenjiError, BenjiConfigError, BenjiApiError classes]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used
Claude Opus 4.6 (1M context)

### Debug Log References
N/A

### Completion Notes List
- Created `todo-lists.ts` following the exact same pattern as `todos.ts` and `tags.ts`
- Used shared `todoListFieldsSchema` object to avoid duplication between create and update tools
- Used `as Parameters<typeof TodoLists.todoListsCreate>[0]["body"]` cast for create (matching todos.ts pattern)
- Used `as Parameters<typeof TodoLists.todoListsUpdate>[0]["body"]` cast for update (matching tags.ts pattern)
- `pnpm --filter benji-mcp build` passes with zero errors
- `pnpm build` (root recursive) passes for all 3 packages
- All 4 tools confirmed in `tools/list` stdio test with correct names, descriptions, and input schemas
- Task 9 (live API test) skipped -- no real API key available

### File List
- `packages/benji-mcp/src/tools/todo-lists.ts` -- NEW: 4 todo list tool registrations
- `packages/benji-mcp/src/server.ts` -- MODIFIED: added import and call for `registerTodoListTools`
- `_bmad-output/sprint-artifacts/2-5-todo-list-tools.md` -- MODIFIED: task checkboxes and dev agent record
