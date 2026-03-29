# Story 5.3: Project Section tools

Status: done

## Story

As an AI assistant,
I want MCP tools for managing Benji project sections,
so that I can update and delete project sections within projects.

## Acceptance Criteria

1. **AC-1: update_project_section tool**
   - **Given** a valid API key and a project section ID
   - **When** `update_project_section` is called with the section ID and a data object containing the new name
   - **Then** updates and returns the project section
   - **And** returns an error with structured message on API failure

2. **AC-2: delete_project_section tool**
   - **Given** a valid API key and a project section ID
   - **When** `delete_project_section` is called with the section ID and optional `deleteTodos` flag
   - **Then** deletes the project section (and optionally its todos) and returns a success confirmation
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
   - **Then** both project section tools appear with their names, descriptions, and input schemas

## Tasks / Subtasks

### Task Group A: File setup and wiring (AC: #3, #4, #5)

- [x] **Task 1: Create `packages/benji-mcp/src/tools/project-sections.ts` with tool registration function** (AC: #3, #4, #5)
  - Create `project-sections.ts` that exports a `registerProjectSectionTools(server: McpServer)` function
  - Import `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js`
  - Import `z` from `zod`
  - Import `ProjectSections`, `wrapSdkCall` from `benji-sdk`
  - Import `toolResult`, `handleToolError` from `./util.js` (shared helpers)
  - Do NOT re-declare toolResult/handleToolError locally -- use the shared util module

- [x] **Task 2: Wire tool registration into server.ts** (AC: #5, #6)
  - In `packages/benji-mcp/src/server.ts`:
    - Import `registerProjectSectionTools` from `./tools/project-sections.js`
    - Call `registerProjectSectionTools(mcpServer)` after `registerTodoViewTools(mcpServer)`

### Task Group B: Tool implementations (AC: #1, #2) -- parallelizable

- [x] **Task 3: Implement `update_project_section` tool** (AC: #1, #3, #4)
  - Register tool via `server.registerTool("update_project_section", { ... }, callback)`
  - Description: `"Update a project section. Provide the section ID and the new name."`
  - Input schema (zod):
    ```
    id: z.string().min(1).describe("The project section ID to update")
    data: z.object({ name: z.string().min(1).optional().describe("New section name") })
      .refine(d => d.name !== undefined, { message: "At least one field (name) must be provided" })
      .describe("Fields to update")
    ```
  - Callback: `wrapSdkCall(ProjectSections.projectSectionsUpdate({ path: { id }, body: { data } }))`
  - **IMPORTANT**: Uses `path` for ID and `body` for data (not all-body pattern)
  - Wrap in try/catch, catch returns `handleToolError(error)`

- [x] **Task 4: Implement `delete_project_section` tool** (AC: #2, #3, #4)
  - Description: `"Delete a project section. Optionally delete its todos as well."`
  - Input schema (zod):
    ```
    id: z.string().min(1).describe("The project section ID to delete")
    deleteTodos: z.boolean().optional().describe("If true, also delete all todos in this section. If false or omitted, todos are moved out of the section.")
    ```
  - Callback: `wrapSdkCall(ProjectSections.projectSectionsDelete({ path: { id }, query: { deleteTodos } }))`
  - **IMPORTANT**: Uses `path` for ID and `query` for deleteTodos (not body)

### Task Group C: Build and verification (AC: #5, #6)

- [x] **Task 5: Verify build** (AC: #5)
  - Run `pnpm --filter benji-mcp build` -- must succeed with no TypeScript errors
  - Run `pnpm build` (root recursive) -- must succeed for all three packages
  - Verify `packages/benji-mcp/dist/tools/project-sections.js` exists in compiled output

- [x] **Task 6: Verify tools appear in tools/list** (AC: #6)
  - Start the server with `BENJI_API_KEY=test-key`
  - Send `initialize` and `notifications/initialized` followed by `tools/list`
  - Verify both tools appear: `update_project_section`, `delete_project_section`
  - Verify each tool has a `name`, `description`, and `inputSchema` with correct properties

- [ ] **Task 7: Verify tool invocation with real API** (AC: #1, #2) -- OPTIONAL (requires real API key) -- SKIPPED (no real API key available)

## Dev Notes

### SDK Method Reference (Exact Signatures)

All methods are on the `ProjectSections` class exported from `benji-sdk`. The Project Sections API uses a **path-based pattern**: the section ID is in the URL path, with optional query or body parameters.

| MCP Tool | SDK Method | Path | Query/Body | Required Fields |
|----------|-----------|------|------------|-----------------|
| `update_project_section` | `ProjectSections.projectSectionsUpdate(options)` | `{ id: string }` | body: `{ data: { name?: string } }` | `id` (path), `data` (body) |
| `delete_project_section` | `ProjectSections.projectSectionsDelete(options)` | `{ id: string }` | query: `{ deleteTodos?: boolean }` | `id` (path) |

### Path-Based Parameter Pattern

```typescript
// Update uses path + body:
ProjectSections.projectSectionsUpdate({ path: { id }, body: { data } })

// Delete uses path + optional query:
ProjectSections.projectSectionsDelete({ path: { id }, query: { deleteTodos } })
```

### Response Shapes

**Update**: `{ [key: string]: unknown }` (generic project section object)

**Delete**: `{ success: true }`

### MCP Tool Registration Pattern

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ProjectSections, wrapSdkCall } from "benji-sdk";
import { toolResult, handleToolError } from "./util.js";

export function registerProjectSectionTools(server: McpServer): void {
  server.registerTool("update_project_section", { ... }, async ({ id, data }) => {
    try {
      const result = await wrapSdkCall(
        ProjectSections.projectSectionsUpdate({ path: { id }, body: { data } }),
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

- All relative imports MUST use `.js` extensions: `./tools/project-sections.js`
- Package imports use bare specifiers: `benji-sdk`, `zod`
- MCP SDK imports use deep paths: `@modelcontextprotocol/sdk/server/mcp.js`

### Key Characteristics

1. **Only 2 methods in SDK**: ProjectSections only exposes `update` and `delete`. There are no list, create, or get methods.
2. **Path-based IDs**: Unlike some other resources, the section ID is passed via `path`, not `body`.
3. **Delete has optional query param**: `deleteTodos` controls whether todos in the section are also deleted.
4. **Update body is nested**: The update body wraps fields inside a `data` object: `{ data: { name?: string } }`.
5. **No date schemas needed**: No `tzDateSchema` or `ymdDateSchema` imports required.

### File Structure After This Story

```
packages/benji-mcp/
  src/
    index.ts              (UNCHANGED)
    server.ts             (MODIFIED -- imports and calls registerProjectSectionTools)
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
      project-sections.ts (NEW -- 2 tool registrations)
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 5, Story 5.3 -- acceptance criteria and tool list]
- [Source: _bmad-output/sprint-artifacts/5-2-todo-view-tools.md -- reference story format and patterns]
- [Source: packages/benji-mcp/src/tools/weight-logs.ts -- reference implementation for tool registration pattern]
- [Source: packages/benji-mcp/src/tools/util.ts -- shared toolResult, handleToolError helpers]
- [Source: packages/benji-mcp/src/server.ts -- createServer() factory function, tool wiring]
- [Source: packages/benji-sdk/src/client/sdk.gen.ts lines 3070-3100 -- ProjectSections class with 2 static methods]
- [Source: packages/benji-sdk/src/client/types.gen.ts lines 14374-14468 -- ProjectSectionsDeleteData through ProjectSectionsUpdateResponse types]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

None.

### Completion Notes List

- Both project section MCP tools implemented following the path-based parameter pattern
- Shared helpers (toolResult, handleToolError) imported from ./util.js -- no local re-declarations
- update_project_section uses path for ID and body for data (nested data object with name field)
- delete_project_section uses path for ID and query for optional deleteTodos flag
- No date schemas needed -- these are simple CRUD operations on sections
- pnpm --filter benji-mcp build: PASS (zero errors)
- pnpm build (root recursive): PASS (all 3 packages)
- tools/list verification: both tools present with correct names, descriptions, and input schemas
- Task 7 (real API verification) skipped -- optional, requires real API key

### File List

- `packages/benji-mcp/src/tools/project-sections.ts` -- NEW: 2 project section tool registrations
- `packages/benji-mcp/src/server.ts` -- MODIFIED: import and call registerProjectSectionTools
