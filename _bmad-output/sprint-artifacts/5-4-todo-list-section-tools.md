# Story 5.4: Todo List Section tools

Status: done

## Story

As an AI assistant,
I want MCP tools for managing Benji todo list sections,
so that I can update and delete sections within todo lists.

## Acceptance Criteria

1. **AC-1: update_todo_list_section tool**
   - **Given** a valid API key and a todo list section ID
   - **When** `update_todo_list_section` is called with the section ID and a data object containing an optional `name` field
   - **Then** updates and returns the updated todo list section as structured JSON
   - **And** returns an error with structured message on API failure

2. **AC-2: delete_todo_list_section tool**
   - **Given** a valid API key and a todo list section ID
   - **When** `delete_todo_list_section` is called with the section ID and optional `deleteTodos` flag
   - **Then** deletes the todo list section (and optionally its todos) and returns `{ success: true }`
   - **And** returns an error with structured message on API failure

3. **AC-3: JSON schema validation on all tools**
   - **And** every tool has a zod-based input schema that validates parameters before calling the SDK
   - **And** invalid input returns a structured MCP error (isError: true) without hitting the API

4. **AC-4: Consistent structured responses**
   - **And** all successful responses use `{ content: [{ type: "text", text: JSON.stringify(result) }] }`
   - **And** all error responses use `{ content: [{ type: "text", text: JSON.stringify(errorObject) }], isError: true }`
   - **And** error objects include `code`, `message`, and optional `issues` array

5. **AC-5: Build succeeds**
   - **Given** the new tool registration files
   - **When** I run `pnpm --filter benji-mcp build`
   - **Then** the build succeeds with no TypeScript errors
   - **And** `pnpm build` (root-level recursive build) still succeeds for all packages

6. **AC-6: Tools appear in tools/list**
   - **Given** the server is running
   - **When** a client sends `tools/list`
   - **Then** all 2 todo list section tools appear with their names, descriptions, and input schemas

## Tasks / Subtasks

### Task Group A: File setup and wiring (AC: #3, #4, #5)

- [x] **Task 1: Create `packages/benji-mcp/src/tools/todo-list-sections.ts` with tool registration function** (AC: #3, #4, #5)
  - Create `todo-list-sections.ts` that exports a `registerTodoListSectionTools(server: McpServer)` function
  - Import `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js`
  - Import `z` from `zod`
  - Import `TodoListSections`, `wrapSdkCall` from `benji-sdk`
  - Import `toolResult`, `handleToolError` from `./util.js` (shared helpers)
  - Do NOT re-declare toolResult/handleToolError locally -- use the shared util module

- [x] **Task 2: Wire tool registration into server.ts** (AC: #5, #6)
  - In `packages/benji-mcp/src/server.ts`:
    - Import `registerTodoListSectionTools` from `./tools/todo-list-sections.js`
    - Call `registerTodoListSectionTools(mcpServer)` after `registerTodoViewTools(mcpServer)`

### Task Group B: Tool implementations (AC: #1, #2) -- parallelizable

- [x] **Task 3: Implement `update_todo_list_section` tool** (AC: #1, #3, #4)
  - Register tool via `server.registerTool("update_todo_list_section", { ... }, callback)`
  - Description: `"Update a todo list section. Provide the section ID and the fields to update."`
  - Input schema (zod):
    ```
    id: z.string().min(1).describe("The todo list section ID to update")
    data: z.object({
      name: z.string().min(1).optional().describe("New name for the section")
    }).describe("Fields to update")
    ```
  - Callback: `wrapSdkCall(TodoListSections.todoListSectionsUpdate({ path: { id }, body: { data } }))`
  - Wrap in try/catch, catch returns `handleToolError(error)`

- [x] **Task 4: Implement `delete_todo_list_section` tool** (AC: #2, #3, #4)
  - Description: `"Delete a todo list section by ID. Optionally delete its todos as well."`
  - Input schema (zod):
    ```
    id: z.string().min(1).describe("The todo list section ID to delete")
    deleteTodos: z.boolean().optional().describe("If true, also delete all todos in this section. Defaults to false.")
    ```
  - Callback: `wrapSdkCall(TodoListSections.todoListSectionsDelete({ path: { id }, query: { deleteTodos } }))`

### Task Group C: Build and verification (AC: #5, #6)

- [x] **Task 5: Verify build** (AC: #5)
  - Run `pnpm --filter benji-mcp build` -- must succeed with no TypeScript errors
  - Run `pnpm build` (root recursive) -- must succeed for all three packages
  - Verify `packages/benji-mcp/dist/tools/todo-list-sections.js` exists in compiled output

- [x] **Task 6: Verify tools appear in tools/list** (AC: #6)
  - Start the server with `BENJI_API_KEY=test-key`
  - Send `initialize` and `notifications/initialized` followed by `tools/list`
  - Verify all 2 tools appear: `update_todo_list_section`, `delete_todo_list_section`
  - Verify each tool has a `name`, `description`, and `inputSchema` with correct properties

- [ ] **Task 7: Verify tool invocation with real API** (AC: #1, #2) -- OPTIONAL (requires real API key) -- SKIPPED (no real API key available)

## Dev Notes

### SDK Method Reference (Exact Signatures)

All methods are on the `TodoListSections` class exported from `benji-sdk`. The TodoListSections API uses a **path-based pattern**: the section ID is a URL path parameter (not in the body).

| MCP Tool | SDK Method | Path Params | Query Params | Body Params |
|----------|-----------|-------------|--------------|-------------|
| `update_todo_list_section` | `TodoListSections.todoListSectionsUpdate(options)` | `{ id: string }` | None | `{ data: { name?: string } }` |
| `delete_todo_list_section` | `TodoListSections.todoListSectionsDelete(options)` | `{ id: string }` | `{ deleteTodos?: boolean }` | None |

### Path + Query + Body Parameter Pattern

```typescript
// Update: path + body
TodoListSections.todoListSectionsUpdate({ path: { id }, body: { data } })

// Delete: path + optional query
TodoListSections.todoListSectionsDelete({ path: { id }, query: { deleteTodos } })
```

### Response Shapes

**Update** (`TodoListSectionsUpdateResponses`):
```typescript
200: { [key: string]: unknown }  // generic object with updated section data
```

**Delete** (`TodoListSectionsDeleteResponses`):
```typescript
200: { success: true }
```

### MCP Tool Registration Pattern

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TodoListSections, wrapSdkCall } from "benji-sdk";
import { toolResult, handleToolError } from "./util.js";

export function registerTodoListSectionTools(server: McpServer): void {
  server.registerTool("update_todo_list_section", { ... }, async ({ id, data }) => {
    try {
      const result = await wrapSdkCall(
        TodoListSections.todoListSectionsUpdate({ path: { id }, body: { data } }),
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

- All relative imports MUST use `.js` extensions: `./tools/todo-list-sections.js`
- Package imports use bare specifiers: `benji-sdk`, `zod`
- MCP SDK imports use deep paths: `@modelcontextprotocol/sdk/server/mcp.js`

### Key Characteristics

1. **Only 2 methods**: The TodoListSections SDK class exposes only `update` and `delete`. There is no `list` or `create` -- sections are created/listed via the parent TodoLists API.
2. **Path-based ID**: Unlike body-based patterns (TodoViews), the section ID is in the URL path.
3. **Query param for delete**: The `deleteTodos` flag is a query parameter, not a body field.
4. **No date schemas needed**: No `tzDateSchema` or `ymdDateSchema` imports required.
5. **Minimal body on update**: The update body only has `data.name` as an optional field.

### File Structure After This Story

```
packages/benji-mcp/
  src/
    index.ts              (UNCHANGED)
    server.ts             (MODIFIED -- imports and calls registerTodoListSectionTools)
    tools/
      todos.ts            (UNCHANGED)
      tags.ts             (UNCHANGED)
      projects.ts         (UNCHANGED)
      todo-lists.ts       (UNCHANGED)
      habits.ts           (UNCHANGED)
      mood.ts             (UNCHANGED)
      util.ts             (UNCHANGED)
      hydration.ts        (UNCHANGED)
      fasting.ts          (UNCHANGED)
      workouts.ts         (UNCHANGED)
      journal.ts          (UNCHANGED)
      pain-events.ts      (UNCHANGED)
      weight-logs.ts      (UNCHANGED)
      todo-views.ts       (UNCHANGED)
      todo-list-sections.ts (NEW -- 2 tool registrations)
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 5, Story 5.4 -- acceptance criteria and tool list]
- [Source: _bmad-output/sprint-artifacts/5-2-todo-view-tools.md -- reference story format and patterns]
- [Source: packages/benji-mcp/src/tools/weight-logs.ts -- reference implementation for path-based tool registration pattern]
- [Source: packages/benji-mcp/src/tools/util.ts -- shared toolResult, handleToolError helpers]
- [Source: packages/benji-mcp/src/server.ts -- createServer() factory function, tool wiring]
- [Source: packages/benji-sdk/src/client/sdk.gen.ts lines 3102-3132 -- TodoListSections class with 2 static methods]
- [Source: packages/benji-sdk/src/client/types.gen.ts lines 14470-14564 -- TodoListSectionsDeleteData through TodoListSectionsUpdateResponse types]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

None.

### Completion Notes List

- All 2 todo list section MCP tools implemented following the path+query/body parameter pattern
- Shared helpers (toolResult, handleToolError) imported from ./util.js -- no local re-declarations
- update uses path { id } + body { data: { name } }
- delete uses path { id } + query { deleteTodos } (optional boolean)
- No date schemas needed -- these are simple CRUD operations on sections
- pnpm --filter benji-mcp build: PASS (zero errors)
- pnpm build (root recursive): PASS (all 3 packages)
- tools/list verification: all 2 tools present with correct names, descriptions, and input schemas
- Task 7 (real API verification) skipped -- optional, requires real API key

### File List

- `packages/benji-mcp/src/tools/todo-list-sections.ts` -- NEW: 2 todo list section tool registrations
- `packages/benji-mcp/src/server.ts` -- MODIFIED: import and call registerTodoListSectionTools
