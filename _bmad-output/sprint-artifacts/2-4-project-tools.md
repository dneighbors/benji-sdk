# Story 2.4: Project tools

Status: dev-complete

## Story

As an AI assistant,
I want MCP tools for managing Benji projects,
so that I can list, create, update, and delete projects.

## Acceptance Criteria

1. **AC-1: list_projects tool**
   - **Given** a valid API key
   - **When** `list_projects` is called with optional `taskType` param (`personal`, `work`, `both`)
   - **Then** returns a structured JSON array of projects
   - **And** returns an error with structured message on API failure

2. **AC-2: create_project tool**
   - **Given** valid input with at minimum a `name`
   - **When** `create_project` is called with name and optional fields (description, emoji, genericStatus, dueDate, plannedDate, startDate, isTemplate, completionType, showInSidebar, showInOverview, points, priority, taskType, sip, tripId, tagIds)
   - **Then** creates and returns the project with its `id`
   - **And** returns an error with structured message on API failure

3. **AC-3: update_project tool**
   - **Given** a valid project ID and at least one field to update
   - **When** `update_project` is called with `id` and a `data` object of updatable fields
   - **Then** updates and returns the project
   - **And** returns an error with structured message on API failure

4. **AC-4: delete_project tool**
   - **Given** a valid project ID
   - **When** `delete_project` is called with the ID
   - **Then** deletes the project and returns `{ success: true, deletedCount: number }`
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
   - **Then** all 4 project tools appear with their names, descriptions, and input schemas

## Tasks / Subtasks

### Task Group A: File setup and wiring (AC: #5, #6, #7)

- [x] **Task 1: Create `packages/benji-mcp/src/tools/projects.ts` with tool registration function** (AC: #5, #6, #7)
  - Create `projects.ts` that exports a `registerProjectTools(server: McpServer)` function
  - Import `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js`
  - Import `z` from `zod`
  - Import `Projects`, `wrapSdkCall`, `BenjiApiError` from `benji-sdk`
  - Reuse the same `toolResult(data)` and `handleToolError(error)` helpers from `todos.ts` (copy the pattern; they will be extracted to a shared util in a future story)

- [x] **Task 2: Wire tool registration into server.ts** (AC: #7, #8)
  - In `packages/benji-mcp/src/server.ts`:
    - Import `registerProjectTools` from `./tools/projects.js`
    - Call `registerProjectTools(mcpServer)` after `registerTodoTools(mcpServer)`

### Task Group B: Tool implementations (AC: #1, #2, #3, #4) -- parallelizable

- [x] **Task 3: Implement `list_projects` tool** (AC: #1, #5, #6)
  - Register tool via `server.registerTool("list_projects", { ... }, callback)`
  - Description: `"List all projects for the current user. Optionally filter by task type."`
  - Input schema (zod):
    ```
    taskType: z.enum(["personal", "work", "both"]).optional().describe("Filter by personal, work, or both task types")
    ```
  - Callback: calls `wrapSdkCall(Projects.projectsList({ body: { taskType } }))`, returns `toolResult(result)`
  - Wrap in try/catch, catch returns `handleToolError(error)`

- [x] **Task 4: Implement `create_project` tool** (AC: #2, #5, #6)
  - Description: `"Create a new project. Only name is required; all other fields are optional."`
  - Input schema (zod):
    ```
    name: z.string().describe("The project name (required)")
    description: z.string().nullable().optional()
    emoji: z.string().nullable().optional()
    genericStatus: z.enum(["Todo", "InProgress", "Done"]).optional().describe("Project status")
    dueDate: z.object({ timezone: z.string(), dateInUsersTimezone: z.string() }).nullable().optional()
    plannedDate: z.object({ timezone: z.string(), dateInUsersTimezone: z.string() }).nullable().optional()
    startDate: z.object({ timezone: z.string(), dateInUsersTimezone: z.string() }).nullable().optional()
    isTemplate: z.boolean().optional().describe("Whether this project is a template")
    completionType: z.enum(["Linear", "Parallel"]).nullable().optional().describe("How tasks in this project are completed")
    showInSidebar: z.boolean().optional()
    showInOverview: z.boolean().optional()
    points: z.number().nullable().optional()
    priority: z.enum(["low", "medium", "high"]).optional()
    taskType: z.enum(["work", "personal", "both"]).optional()
    sip: z.boolean().optional().describe("Whether this is a small, incremental project")
    tripId: z.string().nullable().optional()
    tagIds: z.array(z.string()).nullable().optional()
    ```
  - Callback: pass all fields as the `body` to `Projects.projectsCreate({ body: { ...args } })`

- [x] **Task 5: Implement `update_project` tool** (AC: #3, #5, #6)
  - Description: `"Update an existing project. Provide the project ID and the fields to update."`
  - Input schema (zod):
    ```
    id: z.string().describe("The project ID to update")
    data: z.object({
      name: z.string().optional(),
      description: z.string().nullable().optional(),
      emoji: z.string().nullable().optional(),
      genericStatus: z.enum(["Todo", "InProgress", "Done"]).optional(),
      dueDate: z.object({ timezone: z.string(), dateInUsersTimezone: z.string() }).nullable().optional(),
      plannedDate: z.object({ timezone: z.string(), dateInUsersTimezone: z.string() }).nullable().optional(),
      startDate: z.object({ timezone: z.string(), dateInUsersTimezone: z.string() }).nullable().optional(),
      isTemplate: z.boolean().optional(),
      completionType: z.enum(["Linear", "Parallel"]).nullable().optional(),
      showInSidebar: z.boolean().optional(),
      showInOverview: z.boolean().optional(),
      points: z.number().nullable().optional(),
      priority: z.enum(["low", "medium", "high"]).optional(),
      taskType: z.enum(["work", "personal", "both"]).optional(),
      sip: z.boolean().optional(),
      tripId: z.string().nullable().optional(),
      tagIds: z.array(z.string()).nullable().optional(),
    }).describe("Fields to update")
    ```
  - Callback: `wrapSdkCall(Projects.projectsUpdate({ body: { id, data } }))`

- [x] **Task 6: Implement `delete_project` tool** (AC: #4, #5, #6)
  - Description: `"Delete a project by ID"`
  - Input schema (zod):
    ```
    id: z.string().describe("The project ID to delete")
    ```
  - Callback: `wrapSdkCall(Projects.projectsDelete({ body: { id } }))`

### Task Group C: Build and verification (AC: #7, #8)

- [x] **Task 7: Verify build** (AC: #7)
  - Run `pnpm --filter benji-mcp build` -- must succeed with no TypeScript errors
  - Run `pnpm build` (root recursive) -- must succeed for all three packages
  - Verify `packages/benji-mcp/dist/tools/projects.js` exists in compiled output

- [x] **Task 8: Verify tools appear in tools/list** (AC: #8)
  - Start the server with `BENJI_API_KEY=test-key`
  - Send `initialize` and `notifications/initialized` followed by `tools/list`
  - Verify all 4 tools appear: `list_projects`, `create_project`, `update_project`, `delete_project`
  - Verify each tool has a `name`, `description`, and `inputSchema` with correct properties

- [ ] **Task 9: Verify tool invocation with real API** (AC: #1 through #4) -- SKIPPED: no real API key available
  - Set real `BENJI_API_KEY` in environment
  - Test `list_projects` with `{}` -- verify structured response
  - Test `create_project` with `{ "name": "Test from MCP" }` -- verify returns `{ id: "..." }`
  - Test `update_project` with the created project ID -- verify returns updated project
  - Test `delete_project` with the created project ID -- verify returns `{ success: true }`
  - Test error handling: call `delete_project` with invalid ID -- verify structured error response with `isError: true`

## Dev Notes

### SDK Method Reference (Exact Signatures)

All methods are on the `Projects` class exported from `benji-sdk`. Each takes an `options` object with a `body` property.

| MCP Tool | SDK Method | Body Type | Required Body Fields |
|----------|-----------|-----------|---------------------|
| `list_projects` | `Projects.projectsList(options)` | `{ taskType? }` | None (all optional) |
| `create_project` | `Projects.projectsCreate(options)` | `{ name, ...optionalFields }` | `name` |
| `update_project` | `Projects.projectsUpdate(options)` | `{ id, data: { ...fields } }` | `id`, `data` |
| `delete_project` | `Projects.projectsDelete(options)` | `{ id }` | `id` |

### MCP Tool Registration Pattern

Use `McpServer.registerTool()` (the non-deprecated API in @modelcontextprotocol/sdk v1.28.0). Follow the exact same pattern as `todos.ts`:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Projects, wrapSdkCall, BenjiApiError } from "benji-sdk";

// Success helper (same as todos.ts)
function toolResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data) }],
  };
}

// Error helper (same as todos.ts)
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

// Example: list_projects
server.registerTool(
  "list_projects",
  {
    description: "List all projects for the current user. Optionally filter by task type.",
    inputSchema: {
      taskType: z.enum(["personal", "work", "both"]).optional()
        .describe("Filter by personal, work, or both task types"),
    },
  },
  async ({ taskType }) => {
    try {
      const result = await wrapSdkCall(
        Projects.projectsList({ body: { taskType } }),
      );
      return toolResult(result);
    } catch (error) {
      return handleToolError(error);
    }
  }
);
```

### Shared Project Fields Schema

Extract a `projectFieldsSchema` constant (same pattern as `todoFieldsSchema` in `todos.ts`) to share between `create_project` and `update_project`:

```typescript
const dateSchema = z
  .object({ timezone: z.string(), dateInUsersTimezone: z.string() })
  .nullable()
  .optional();

const projectFieldsSchema = {
  description: z.string().nullable().optional(),
  emoji: z.string().nullable().optional(),
  genericStatus: z.enum(["Todo", "InProgress", "Done"]).optional()
    .describe("Project status"),
  dueDate: dateSchema,
  plannedDate: dateSchema,
  startDate: dateSchema,
  isTemplate: z.boolean().optional()
    .describe("Whether this project is a template"),
  completionType: z.enum(["Linear", "Parallel"]).nullable().optional()
    .describe("How tasks in this project are completed"),
  showInSidebar: z.boolean().optional(),
  showInOverview: z.boolean().optional(),
  points: z.number().nullable().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  taskType: z.enum(["work", "personal", "both"]).optional(),
  sip: z.boolean().optional()
    .describe("Whether this is a small, incremental project"),
  tripId: z.string().nullable().optional(),
  tagIds: z.array(z.string()).nullable().optional(),
};
```

### wrapSdkCall Error Handling Pattern

The `wrapSdkCall<T>(promise)` function from `benji-sdk`:
- Takes the raw SDK call promise (which returns `{ data?, error?, response }`)
- On success: extracts and returns `data` as type `T`
- On API error (4xx/5xx): throws `BenjiApiError` with `status`, `code`, `message`, `issues`
- On network error: throws `BenjiApiError` with `status: 0`, `code: "NETWORK_ERROR"`
- On empty response: throws `BenjiApiError` with `code: "EMPTY_RESPONSE"`

### ESM Import Requirements

- All relative imports MUST use `.js` extensions: `./tools/projects.js`
- Package imports use bare specifiers: `benji-sdk`, `zod`
- MCP SDK imports use deep paths: `@modelcontextprotocol/sdk/server/mcp.js`

### File Structure After This Story

```
packages/benji-mcp/
  src/
    index.ts          (UNCHANGED)
    server.ts         (MODIFIED -- imports and calls registerProjectTools)
    tools/
      todos.ts        (UNCHANGED)
      projects.ts     (NEW -- 4 tool registrations)
```

### Key Type Details

**Date objects in create/update:** Date fields (`dueDate`, `plannedDate`, `startDate`) use a structured object format, not plain strings:
```typescript
{ timezone: string; dateInUsersTimezone: string }  // e.g. { timezone: "America/Chicago", dateInUsersTimezone: "2026-03-28" }
```

**genericStatus in create/update:** Enum values are `"Todo"`, `"InProgress"`, `"Done"` (PascalCase).

**completionType in create/update:** Enum values are `"Linear"`, `"Parallel"` (PascalCase), or `null`.

**Response shapes:**
- List endpoint returns an array of project objects (each with `id`, `name`, `description`, `emoji`, `sections`, `tags`, etc.)
- Create/update return a project object with `id`, `name`, and all project fields
- Delete returns `{ success: true, deletedCount: number }`

### Completion Notes from Story 2.2

- `registerTool()` will automatically handle `tools` capability declaration and `tools/list` responses
- All console output MUST go to `stderr`. `stdout` is reserved for MCP protocol messages
- The server factory pattern in `server.ts` makes it straightforward to add tool registration calls

### Project Structure Notes

- This story adds one new file (`src/tools/projects.ts`) and modifies one existing file (`src/server.ts`)
- The `tools/` directory pattern is established by Story 2.2 (todos.ts)
- `handleToolError()` and `toolResult()` helpers are duplicated from `todos.ts` for now; they will be extracted to a shared utility if the pattern proves stable

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 2, Story 2.4 -- acceptance criteria and technical notes]
- [Source: _bmad-output/sprint-artifacts/2-2-todo-tools.md -- todo tools pattern, completion notes]
- [Source: packages/benji-mcp/src/tools/todos.ts -- reference implementation for tool registration pattern]
- [Source: packages/benji-mcp/src/server.ts -- createServer() factory function, registerTodoTools call]
- [Source: packages/benji-sdk/src/client/sdk.gen.ts lines 1309-1389 -- Projects class with all static methods]
- [Source: packages/benji-sdk/src/client/types.gen.ts lines 8531-9052 -- ProjectsListData through ProjectsDeleteResponse types]
- [Source: packages/benji-sdk/src/client/index.ts -- confirms Projects is exported]
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

- All 4 project tools implemented: list_projects, create_project, update_project, delete_project
- Follows exact same pattern as todos.ts (duplicated toolResult/handleToolError helpers, shared projectFieldsSchema)
- `pnpm --filter benji-mcp build` passes with zero TypeScript errors
- `pnpm build` (root recursive) passes for all 3 packages
- All 4 tools verified present in tools/list response via stdio test
- Each tool has correct name, description, inputSchema with proper required fields and types
- Task 9 (live API verification) skipped per instructions -- no real API key available

### File List

- `packages/benji-mcp/src/tools/projects.ts` -- NEW: 4 project tool registrations (list, create, update, delete)
- `packages/benji-mcp/src/server.ts` -- MODIFIED: added import and registerProjectTools(mcpServer) call
