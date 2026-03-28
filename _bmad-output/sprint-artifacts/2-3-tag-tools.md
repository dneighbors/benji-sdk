# Story 2.3: Tag tools

Status: done

## Story

As an AI assistant,
I want MCP tools for managing Benji tags,
so that I can list, create, update, and delete tags.

## Acceptance Criteria

1. **AC-1: list_tags tool**
   - **Given** a valid API key
   - **When** `list_tags` is called with optional `taskType` param (`personal`, `work`, `both`)
   - **Then** returns a structured JSON array of tags
   - **And** returns an error with structured message on API failure

2. **AC-2: create_tag tool**
   - **Given** valid input with at minimum a `name`
   - **When** `create_tag` is called with name and optional fields (points, emoji, paused, tagGroupId)
   - **Then** creates and returns the tag with its `id`
   - **And** returns an error with structured message on API failure

3. **AC-3: update_tag tool**
   - **Given** a valid tag ID and at least one field to update
   - **When** `update_tag` is called with `id` and a `data` object of updatable fields
   - **Then** updates and returns the tag
   - **And** returns an error with structured message on API failure

4. **AC-4: delete_tag tool**
   - **Given** a valid tag ID
   - **When** `delete_tag` is called with the ID
   - **Then** deletes the tag and returns a success response
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
   - **Then** all 4 tag tools appear with their names, descriptions, and input schemas

## Tasks / Subtasks

### Task Group A: File setup and wiring (AC: #5, #6, #7)

- [x] **Task 1: Create `packages/benji-mcp/src/tools/tags.ts` with tool registration function** (AC: #5, #6, #7)
  - Create `tags.ts` that exports a `registerTagTools(server: McpServer)` function
  - Import `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js`
  - Import `z` from `zod`
  - Import `Tags`, `wrapSdkCall`, `BenjiApiError` from `benji-sdk`
  - Reuse the same `toolResult()` and `handleToolError()` helper pattern from `todos.ts`

- [x] **Task 2: Wire tool registration into server.ts** (AC: #7, #8)
  - In `packages/benji-mcp/src/server.ts`:
    - Import `registerTagTools` from `./tools/tags.js`
    - Call `registerTagTools(mcpServer)` after `registerTodoTools(mcpServer)`

### Task Group B: Tool implementations (AC: #1, #2, #3, #4) -- parallelizable

- [x] **Task 3: Implement `list_tags` tool** (AC: #1, #5, #6)
  - Register tool via `server.registerTool("list_tags", { ... }, callback)`
  - Description: `"List all tags for the current user. Optionally filter by task type."`
  - Input schema (zod):
    ```
    taskType: z.enum(["personal", "work", "both"]).optional().describe("Filter tags by task type")
    ```
  - Callback: calls `wrapSdkCall(Tags.tagsList({ body: { taskType } }))`, returns `toolResult(result)`
  - Wrap in try/catch, catch returns `handleToolError(error)`

- [x] **Task 4: Implement `create_tag` tool** (AC: #2, #5, #6)
  - Description: `"Create a new tag. Only name is required; all other fields are optional."`
  - Input schema (zod):
    ```
    name: z.string().describe("The tag name (required)")
    points: z.number().nullable().optional().describe("Points value for the tag")
    emoji: z.string().nullable().optional().describe("Emoji icon for the tag")
    paused: z.boolean().nullable().optional().describe("Whether the tag is paused")
    tagGroupId: z.string().nullable().optional().describe("ID of the tag group this tag belongs to")
    ```
  - Callback: `wrapSdkCall(Tags.tagsCreate({ body: { name, points, emoji, paused, tagGroupId } }))`

- [x] **Task 5: Implement `update_tag` tool** (AC: #3, #5, #6)
  - Description: `"Update an existing tag. Provide the tag ID and the fields to update."`
  - Input schema (zod):
    ```
    id: z.string().describe("The tag ID to update")
    data: z.object({
      name: z.string().optional().describe("New tag name"),
      points: z.number().nullable().optional().describe("Points value for the tag"),
      emoji: z.string().nullable().optional().describe("Emoji icon for the tag"),
      paused: z.boolean().nullable().optional().describe("Whether the tag is paused"),
      tagGroupId: z.string().nullable().optional().describe("ID of the tag group"),
    }).describe("Fields to update")
    ```
  - Callback: `wrapSdkCall(Tags.tagsUpdate({ body: { id, data } }))`

- [x] **Task 6: Implement `delete_tag` tool** (AC: #4, #5, #6)
  - Description: `"Delete a tag by ID"`
  - Input schema (zod):
    ```
    id: z.string().describe("The tag ID to delete")
    ```
  - Callback: `wrapSdkCall(Tags.tagsDelete({ body: { id } }))`

### Task Group C: Build and verification (AC: #7, #8)

- [x] **Task 7: Verify build** (AC: #7)
  - Run `pnpm --filter benji-mcp build` -- must succeed with no TypeScript errors
  - Run `pnpm build` (root recursive) -- must succeed for all three packages
  - Verify `packages/benji-mcp/dist/tools/tags.js` exists in compiled output

- [x] **Task 8: Verify tools appear in tools/list** (AC: #8)
  - Start the server with `BENJI_API_KEY=test-key`
  - Send `initialize` and `notifications/initialized` followed by `tools/list`
  - Verify all 4 tools appear: `list_tags`, `create_tag`, `update_tag`, `delete_tag`
  - Verify each tool has a `name`, `description`, and `inputSchema` with correct properties

- [ ] **Task 9: Verify tool invocation with real API** (AC: #1 through #4) -- SKIPPED (no real API key available)
  - Set real `BENJI_API_KEY` in environment
  - Test `list_tags` with `{}` -- verify structured response with array of tags
  - Test `create_tag` with `{ "name": "Test from MCP" }` -- verify returns tag with `id`
  - Test `update_tag` with the created tag ID and `{ "data": { "name": "Updated from MCP" } }` -- verify returns updated tag
  - Test `delete_tag` with the created tag ID -- verify returns success response
  - Test error handling: call `delete_tag` with invalid ID -- verify structured error response with `isError: true`

## Dev Notes

### SDK Method Reference (Exact Signatures)

All methods are on the `Tags` class exported from `benji-sdk`. Each takes an `options` object with a `body` property.

| MCP Tool | SDK Method | Body Type | Required Body Fields |
|----------|-----------|-----------|---------------------|
| `list_tags` | `Tags.tagsList(options)` | `{ taskType? }` | None (all optional) |
| `create_tag` | `Tags.tagsCreate(options)` | `{ name, points?, emoji?, paused?, tagGroupId? }` | `name` |
| `update_tag` | `Tags.tagsUpdate(options)` | `{ id, data: { name?, points?, emoji?, paused?, tagGroupId? } }` | `id`, `data` |
| `delete_tag` | `Tags.tagsDelete(options)` | `{ id }` | `id` |

### Tag Response Shape

All tag objects share this shape (from `TagsListResponses` / `TagsCreateResponses` / `TagsUpdateResponses`):
```typescript
{
  id: string;
  name: string;
  paused?: boolean;
  points?: number | null;
  userId?: string;
  tagGroupId?: string | null;
  emoji?: string | null;
}
```

### MCP Tool Registration Pattern

Reuse the exact same pattern from `todos.ts`:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Tags, wrapSdkCall, BenjiApiError } from "benji-sdk";

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
  "list_tags",
  {
    description: "List all tags for the current user. Optionally filter by task type.",
    inputSchema: {
      taskType: z.enum(["personal", "work", "both"]).optional().describe("Filter tags by task type"),
    },
  },
  async ({ taskType }) => {
    try {
      const result = await wrapSdkCall(Tags.tagsList({ body: { taskType } }));
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

- All relative imports MUST use `.js` extensions: `./tools/tags.js`
- Package imports use bare specifiers: `benji-sdk`, `zod`
- MCP SDK imports use deep paths: `@modelcontextprotocol/sdk/server/mcp.js`

### File Structure After This Story

```
packages/benji-mcp/
  src/
    index.ts          (UNCHANGED)
    server.ts         (MODIFIED -- imports and calls registerTagTools)
    tools/
      todos.ts        (UNCHANGED)
      tags.ts         (NEW -- 4 tool registrations)
```

### Key Type Details

**Create body fields:** `name` is required; `points`, `emoji`, `paused`, `tagGroupId` are all optional and nullable.

**Update body structure:** Uses the same `{ id, data: { ...fields } }` pattern as `update_todo`. The `data` object contains the fields to update, all optional.

**Delete response:** Returns a success indicator. Unlike todos which return `{ success: true, deletedCount: number }`, the tag delete response shape should be passed through as-is from the SDK.

**List response:** Returns an array of tag objects, not a wrapper object. This differs from `list_todos` which returns a wrapper with a `todos` array inside.

### Completion Notes from Story 2.2

- `registerTool()` automatically handles `tools` capability declaration and `tools/list` responses
- All console output MUST go to `stderr`. `stdout` is reserved for MCP protocol messages
- The server factory pattern in `server.ts` makes it straightforward to add tool registration calls
- `handleToolError()` and `toolResult()` helpers are defined per-file for now; they may be extracted to a shared utility once the pattern stabilizes

### Project Structure Notes

- This story adds one new file (`src/tools/tags.ts`) and modifies one existing file (`src/server.ts`)
- The `tools/` directory pattern follows the same convention established by Story 2.2
- Tags is the simplest CRUD resource in Epic 2 (4 tools vs 8 for todos), making it a good candidate for validating the pattern before Projects, TodoLists, Habits, and Mood

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 2, Story 2.3 -- acceptance criteria and technical notes]
- [Source: _bmad-output/sprint-artifacts/2-2-todo-tools.md -- tool pattern, helpers, registration approach]
- [Source: packages/benji-mcp/src/tools/todos.ts -- reference implementation for toolResult, handleToolError, registerTool pattern]
- [Source: packages/benji-mcp/src/server.ts -- createServer() factory function, tool wiring]
- [Source: packages/benji-sdk/src/client/sdk.gen.ts lines 1171-1305 -- Tags class with all static methods]
- [Source: packages/benji-sdk/src/client/types.gen.ts lines 8133-8376 -- TagsListData through TagsDeleteResponse types]
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

- All 4 tag tools (list_tags, create_tag, update_tag, delete_tag) implemented following the exact same pattern as todos.ts
- Build passes with zero TypeScript errors for both `pnpm --filter benji-mcp build` and `pnpm build` (root recursive)
- All 4 tools verified in tools/list via stdio with correct names, descriptions, and input schemas
- Task 9 (live API test) skipped -- no real API key available

### File List

- `packages/benji-mcp/src/tools/tags.ts` -- NEW -- 4 tag tool registrations (list_tags, create_tag, update_tag, delete_tag)
- `packages/benji-mcp/src/server.ts` -- MODIFIED -- added import and call for registerTagTools
