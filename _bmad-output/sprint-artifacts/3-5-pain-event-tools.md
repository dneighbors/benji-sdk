# Story 3.5: Pain Event tools

Status: done

## Story

As an AI assistant,
I want MCP tools for Benji pain event tracking,
so that I can list pain events, create events, get a single event, update events, delete events, bulk-delete events, list available body parts, and list recently used body parts.

## Acceptance Criteria

1. **AC-1: list_pain_events tool**
   - **Given** a valid API key
   - **When** `list_pain_events` is called with optional `date` object (`{ year, month, day }`)
   - **Then** returns a structured JSON array of pain event objects with `id`, `date`, `painLevel`, `bodyPartId`, `notes`, `bodyPart`
   - **And** returns an error with structured message on API failure

2. **AC-2: create_pain_event tool**
   - **Given** valid input
   - **When** `create_pain_event` is called with required `date` (timezone-aware object), `painLevel` (1-10), `bodyPartId`, and optional `notes`
   - **Then** creates and returns the pain event object
   - **And** returns an error with structured message on API failure

3. **AC-3: get_pain_event tool**
   - **Given** a valid pain event ID
   - **When** `get_pain_event` is called with `id`
   - **Then** returns the pain event object with `id`, `date`, `painLevel`, `bodyPartId`, `notes`, `bodyPart`
   - **And** returns an error with structured message on API failure

4. **AC-4: update_pain_event tool**
   - **Given** a valid pain event ID and at least one field to update
   - **When** `update_pain_event` is called with `id` and a `data` object of updatable fields (date, painLevel, bodyPartId, notes)
   - **Then** updates the pain event and returns the updated event object
   - **And** returns an error with structured message on API failure

5. **AC-5: delete_pain_event tool**
   - **Given** a valid pain event ID
   - **When** `delete_pain_event` is called with `id`
   - **Then** deletes the pain event and returns a success response with `{ success: true, deletedCount }`
   - **And** returns an error with structured message on API failure

6. **AC-6: delete_many_pain_events tool**
   - **Given** an array of valid pain event IDs
   - **When** `delete_many_pain_events` is called with `ids` (non-empty array of strings)
   - **Then** deletes all specified pain events and returns a success response with `{ success: true, deletedCount }`
   - **And** returns an error with structured message on API failure

7. **AC-7: list_body_parts tool**
   - **Given** a valid API key
   - **When** `list_body_parts` is called with no parameters
   - **Then** returns a JSON array of body part objects with `id`, `name`, `parentId`, `parent`
   - **And** returns an error with structured message on API failure

8. **AC-8: list_recent_body_parts tool**
   - **Given** a valid API key
   - **When** `list_recent_body_parts` is called with no parameters
   - **Then** returns a JSON array of recently used body parts with `id`, `name`, `count`
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
    - **Then** all 8 pain event tools appear with their names, descriptions, and input schemas

## Tasks / Subtasks

### Task Group A: File setup and wiring (AC: #9, #10, #11)

- [x] **Task 1: Create `packages/benji-mcp/src/tools/pain-events.ts` with tool registration function** (AC: #9, #10, #11)
  - Create `pain-events.ts` that exports a `registerPainEventTools(server: McpServer)` function
  - Import `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js`
  - Import `z` from `zod`
  - Import `PainEvents`, `wrapSdkCall` from `benji-sdk`
  - Import `toolResult`, `handleToolError`, `ymdDateSchema`, `tzDateSchema` from `./util.js` (shared helpers)
  - Do NOT re-declare toolResult/handleToolError locally -- use the shared util module

- [x] **Task 2: Wire tool registration into server.ts** (AC: #11, #12)
  - In `packages/benji-mcp/src/server.ts`:
    - Import `registerPainEventTools` from `./tools/pain-events.js`
    - Call `registerPainEventTools(mcpServer)` after `registerJournalTools(mcpServer)`

### Task Group B: Tool implementations (AC: #1 through #8) -- parallelizable

- [x] **Task 3: Implement `list_pain_events` tool** (AC: #1, #9, #10)
  - Register tool via `server.registerTool("list_pain_events", { ... }, callback)`
  - Description: `"List pain events. Optionally filter by date using a year/month/day object."`
  - Input schema (zod):
    ```
    date: ymdDateSchema.optional().describe("Filter by date (year, month, day)")
    ```
  - **IMPORTANT:** Uses body-based parameters: `PainEvents.painEventsList({ body: { date } })`
  - Callback: `wrapSdkCall(PainEvents.painEventsList({ body: { date } }))`
  - Wrap in try/catch, catch returns `handleToolError(error)`
  - **Note:** `PainEventsListData` has `body: { date?: { year: number, month: number, day: number } }` -- body-based, uses `ymdDateSchema` from util.ts

- [x] **Task 4: Implement `create_pain_event` tool** (AC: #2, #9, #10)
  - Description: `"Create a new pain event. Requires date (timezone-aware), pain level (1-10), and body part ID. Optionally add notes."`
  - Input schema (zod):
    ```
    date: tzDateSchema.describe("When the pain event occurred (timezone and dateInUsersTimezone)")
    painLevel: z.number().int().min(1).max(10).describe("Pain intensity level from 1 (mild) to 10 (severe)")
    bodyPartId: z.string().min(1).describe("ID of the body part where pain occurred. Use list_body_parts to get valid IDs.")
    notes: z.string().nullable().optional().describe("Additional notes about the pain event")
    ```
  - **IMPORTANT:** Create uses body-based parameters: `PainEvents.painEventsCreate({ body: { date, painLevel, bodyPartId, notes } })`
  - Callback: `wrapSdkCall(PainEvents.painEventsCreate({ body: { date, painLevel, bodyPartId, notes } }))`

- [x] **Task 5: Implement `get_pain_event` tool** (AC: #3, #9, #10)
  - Description: `"Get a single pain event by ID."`
  - Input schema (zod):
    ```
    id: z.string().min(1).describe("The pain event ID to retrieve")
    ```
  - **IMPORTANT:** Get uses body-based ID: `PainEvents.painEventsGet({ body: { id } })`
  - Callback: `wrapSdkCall(PainEvents.painEventsGet({ body: { id } }))`
  - **Note:** `PainEventsGetData` has `body: { id: string }` -- id is in the body, NOT path

- [x] **Task 6: Implement `update_pain_event` tool** (AC: #4, #9, #10)
  - Description: `"Update an existing pain event. Provide the event ID and the fields to update."`
  - Input schema (zod):
    ```
    id: z.string().min(1).describe("The pain event ID to update")
    data: z.object({
      date: tzDateSchema.optional().describe("Updated date (timezone and dateInUsersTimezone)"),
      painLevel: z.number().int().min(1).max(10).optional().describe("Updated pain level (1-10)"),
      bodyPartId: z.string().min(1).optional().describe("Updated body part ID"),
      notes: z.string().nullable().optional().describe("Updated notes"),
    }).refine(
      (d) => d.date !== undefined || d.painLevel !== undefined || d.bodyPartId !== undefined || d.notes !== undefined,
      { message: "At least one field (date, painLevel, bodyPartId, or notes) must be provided" }
    ).describe("Fields to update")
    ```
  - **IMPORTANT:** Update uses body-based ID + data: `PainEvents.painEventsUpdate({ body: { id, data } })`
  - Callback: `wrapSdkCall(PainEvents.painEventsUpdate({ body: { id, data } }))`
  - **Note:** `PainEventsUpdateData` has `body: { id: string, data: { ... } }` -- both id and data are in the body

- [x] **Task 7: Implement `delete_pain_event` tool** (AC: #5, #9, #10)
  - Description: `"Delete a pain event by ID."`
  - Input schema (zod):
    ```
    id: z.string().min(1).describe("The pain event ID to delete")
    ```
  - **IMPORTANT:** Delete uses body-based ID: `PainEvents.painEventsDelete({ body: { id } })`
  - Callback: `wrapSdkCall(PainEvents.painEventsDelete({ body: { id } }))`

- [x] **Task 8: Implement `delete_many_pain_events` tool** (AC: #6, #9, #10)
  - Description: `"Delete multiple pain events by their IDs."`
  - Input schema (zod):
    ```
    ids: z.array(z.string().min(1)).min(1).describe("Array of pain event IDs to delete")
    ```
  - **IMPORTANT:** DeleteMany uses body-based IDs: `PainEvents.painEventsDeleteMany({ body: { ids } })`
  - Callback: `wrapSdkCall(PainEvents.painEventsDeleteMany({ body: { ids } }))`

- [x] **Task 9: Implement `list_body_parts` tool** (AC: #7, #9, #10)
  - Description: `"List all available body parts for pain events."`
  - Input schema (zod): `{}` (no parameters)
  - Callback: `wrapSdkCall(PainEvents.painEventsBodyParts())`
  - **Note:** `PainEventsBodyPartsData` has `body?: never` -- no parameters required

- [x] **Task 10: Implement `list_recent_body_parts` tool** (AC: #8, #9, #10)
  - Description: `"List recently used body parts for pain events, sorted by frequency."`
  - Input schema (zod): `{}` (no parameters)
  - Callback: `wrapSdkCall(PainEvents.painEventsRecentBodyParts())`
  - **Note:** `PainEventsRecentBodyPartsData` has `body?: never` -- no parameters required

### Task Group C: Build and verification (AC: #11, #12)

- [x] **Task 11: Verify build** (AC: #11)
  - Run `pnpm --filter benji-mcp build` -- must succeed with no TypeScript errors
  - Run `pnpm build` (root recursive) -- must succeed for all three packages
  - Verify `packages/benji-mcp/dist/tools/pain-events.js` exists in compiled output

- [x] **Task 12: Verify tools appear in tools/list** (AC: #12)
  - Start the server with `BENJI_API_KEY=test-key`
  - Send `initialize` and `notifications/initialized` followed by `tools/list`
  - Verify all 8 tools appear: `list_pain_events`, `create_pain_event`, `get_pain_event`, `update_pain_event`, `delete_pain_event`, `delete_many_pain_events`, `list_body_parts`, `list_recent_body_parts`
  - Verify each tool has a `name`, `description`, and `inputSchema` with correct properties

- [ ] **Task 13: Verify tool invocation with real API** (AC: #1 through #8) -- OPTIONAL (requires real API key)
  - Set real `BENJI_API_KEY` in environment
  - Test `list_body_parts` with `{}` -- verify returns array of body part objects with `id`, `name`
  - Test `create_pain_event` with valid body part ID and pain level -- verify returns event object with `id`
  - Test `list_pain_events` with `{}` -- verify structured response with array of event objects
  - Test `get_pain_event` with the created event ID -- verify returns event object
  - Test `update_pain_event` with `{ "id": "<id>", "data": { "painLevel": 5 } }` -- verify returns success
  - Test `delete_pain_event` with the event ID -- verify returns success response with `{ success: true, deletedCount }`
  - Test error handling: call `delete_pain_event` with invalid ID -- verify structured error response with `isError: true`

## Dev Notes

### SDK Method Reference (Exact Signatures)

All methods are on the `PainEvents` class exported from `benji-sdk`. The Pain Events API uses a **fully body-based pattern**: all operations pass parameters in the request body (no path params). This differs from workouts/fasting/journal which use path-based IDs for individual operations.

| MCP Tool | SDK Method | Body Type | Required Fields |
|----------|-----------|-----------|-----------------|
| `list_pain_events` | `PainEvents.painEventsList(options)` | `{ date?: { year, month, day } }` | Body required (date optional) |
| `create_pain_event` | `PainEvents.painEventsCreate(options)` | `{ date: { timezone, dateInUsersTimezone }, painLevel, bodyPartId, notes? }` | `date`, `painLevel`, `bodyPartId` (body) |
| `get_pain_event` | `PainEvents.painEventsGet(options)` | `{ id }` | `id` (body) |
| `update_pain_event` | `PainEvents.painEventsUpdate(options)` | `{ id, data: { date?, painLevel?, bodyPartId?, notes? } }` | `id`, `data` (body) |
| `delete_pain_event` | `PainEvents.painEventsDelete(options)` | `{ id }` | `id` (body) |
| `delete_many_pain_events` | `PainEvents.painEventsDeleteMany(options)` | `{ ids: string[] }` | `ids` (body) |
| `list_body_parts` | `PainEvents.painEventsBodyParts()` | `body?: never` | None |
| `list_recent_body_parts` | `PainEvents.painEventsRecentBodyParts()` | `body?: never` | None |

### All-Body-Based Parameter Pattern (NO path params)

```typescript
// Body-based ID operations (different from workouts/journal which use path):
PainEvents.painEventsGet({ body: { id } })
PainEvents.painEventsDelete({ body: { id } })
PainEvents.painEventsUpdate({ body: { id, data } })

// Body-based list/create/bulk operations:
PainEvents.painEventsList({ body: { date } })
PainEvents.painEventsCreate({ body: { date, painLevel, bodyPartId, notes } })
PainEvents.painEventsDeleteMany({ body: { ids } })

// No-param operations:
PainEvents.painEventsBodyParts()
PainEvents.painEventsRecentBodyParts()
```

### Date Handling: Two Different Schemas

Pain events use TWO different date schemas:

1. **List filtering** uses `ymdDateSchema` (year/month/day object) from `util.ts`:
   ```typescript
   // PainEventsListData.body.date
   { year: number, month: number, day: number }
   ```

2. **Create/Update** uses `tzDateSchema` (timezone-aware) from `util.ts`:
   ```typescript
   // PainEventsCreateData.body.date / PainEventsUpdateData.body.data.date
   { timezone: string, dateInUsersTimezone: string }
   ```

Both schemas are already defined in `util.ts` and should be imported from there.

### Pain Event Response Shape

From `PainEventsGetResponses` / `PainEventsListResponses` / `PainEventsCreateResponses`:
```typescript
{
  id: string;
  createdAt: string;
  updatedAt: string;
  date: string;
  userId: string;
  painLevel: number;
  bodyPartId: string;
  notes: string | null;
  bodyPart?: Schema0 | null;  // Schema0 = { id, name, parentId, parent? }
}
```

### Update Response Shape

From `PainEventsUpdateResponses`:
```typescript
// Returns either the updated event object OR a count object:
{
  id: string;
  createdAt: string;
  updatedAt: string;
  date: string;
  userId: string;
  painLevel: number;
  bodyPartId: string;
  notes: string | null;
  bodyPart?: Schema0 | null;
} | {
  count: number;
}
```

### Delete Response Shape

From `PainEventsDeleteResponses` / `PainEventsDeleteManyResponses`:
```typescript
{
  success: true;
  deletedCount: number;
}
```

### Body Part Response Shape (Schema0)

From `PainEventsBodyPartsResponses`:
```typescript
Array<{
  id: string;
  name: string;
  parentId: string | null;
  parent?: Schema0 | null;  // recursive parent reference
}>
```

### Recent Body Parts Response Shape

From `PainEventsRecentBodyPartsResponses`:
```typescript
Array<{
  id: string;
  name: string;
  count: number;
}>
```

### MCP Tool Registration Pattern

Follow the exact same pattern from `workouts.ts`, `fasting.ts`, and `journal.ts`, importing shared helpers and schemas from `util.ts`:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PainEvents, wrapSdkCall } from "benji-sdk";
import { toolResult, handleToolError, ymdDateSchema, tzDateSchema } from "./util.js";

export function registerPainEventTools(server: McpServer): void {
  // list_pain_events -- body-based, optional ymd date
  server.registerTool("list_pain_events", { ... }, async ({ date }) => {
    try {
      const result = await wrapSdkCall(PainEvents.painEventsList({ body: { date } }));
      return toolResult(result);
    } catch (error) {
      return handleToolError(error);
    }
  });

  // create_pain_event -- body-based, required date/painLevel/bodyPartId
  server.registerTool("create_pain_event", { ... }, async ({ date, painLevel, bodyPartId, notes }) => {
    try {
      const result = await wrapSdkCall(PainEvents.painEventsCreate({ body: { date, painLevel, bodyPartId, notes } }));
      return toolResult(result);
    } catch (error) {
      return handleToolError(error);
    }
  });

  // get_pain_event -- body-based ID
  server.registerTool("get_pain_event", { ... }, async ({ id }) => {
    try {
      const result = await wrapSdkCall(PainEvents.painEventsGet({ body: { id } }));
      return toolResult(result);
    } catch (error) {
      return handleToolError(error);
    }
  });

  // update_pain_event -- body-based ID + data
  server.registerTool("update_pain_event", { ... }, async ({ id, data }) => {
    try {
      const result = await wrapSdkCall(PainEvents.painEventsUpdate({ body: { id, data } }));
      return toolResult(result);
    } catch (error) {
      return handleToolError(error);
    }
  });

  // delete_pain_event -- body-based ID
  server.registerTool("delete_pain_event", { ... }, async ({ id }) => {
    try {
      const result = await wrapSdkCall(PainEvents.painEventsDelete({ body: { id } }));
      return toolResult(result);
    } catch (error) {
      return handleToolError(error);
    }
  });

  // delete_many_pain_events -- body-based IDs array
  server.registerTool("delete_many_pain_events", { ... }, async ({ ids }) => {
    try {
      const result = await wrapSdkCall(PainEvents.painEventsDeleteMany({ body: { ids } }));
      return toolResult(result);
    } catch (error) {
      return handleToolError(error);
    }
  });

  // list_body_parts -- no params
  server.registerTool("list_body_parts", { ... }, async () => {
    try {
      const result = await wrapSdkCall(PainEvents.painEventsBodyParts());
      return toolResult(result);
    } catch (error) {
      return handleToolError(error);
    }
  });

  // list_recent_body_parts -- no params
  server.registerTool("list_recent_body_parts", { ... }, async () => {
    try {
      const result = await wrapSdkCall(PainEvents.painEventsRecentBodyParts());
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

- All relative imports MUST use `.js` extensions: `./tools/pain-events.js`
- Package imports use bare specifiers: `benji-sdk`, `zod`
- MCP SDK imports use deep paths: `@modelcontextprotocol/sdk/server/mcp.js`

### Key Differences from Journal (Story 3-4)

1. **All body-based**: Pain events use body-based IDs for get/update/delete (not path-based). The SDK types confirm `path?: never` for all methods.
2. **Two date schemas**: List uses `ymdDateSchema` (year/month/day object), create/update use `tzDateSchema` (timezone-aware).
3. **No encryption concerns**: Unlike journal, pain events have no encryption-related fields to exclude.
4. **Pain level validation**: `painLevel` must be validated as integer 1-10.
5. **Body part reference**: Create/update require a `bodyPartId` that references a body part from `list_body_parts`.

### File Structure After This Story

```
packages/benji-mcp/
  src/
    index.ts          (UNCHANGED)
    server.ts         (MODIFIED -- imports and calls registerPainEventTools)
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
      pain-events.ts  (NEW -- 8 tool registrations)
```

### Project Structure Notes

- Alignment: follows the exact same module structure established in Epic 2 (one file per resource in `tools/`, exported register function, wired in `server.ts`)
- Shared `toolResult`/`handleToolError` imported from `./util.js` (no local re-declarations)
- `ymdDateSchema` imported from `./util.js` for list filtering (year/month/day date object)
- `tzDateSchema` imported from `./util.js` for create/update (timezone-aware date)
- No conflicts or variances expected
- `.min(1)` on all string ID params and `bodyPartId`, `.min(1).max(10)` on `painLevel`, `.refine()` on update data object
- Array validation: `z.array(z.string().min(1)).min(1)` for `ids` in delete_many ensures at least one valid ID
- This is the LAST story in Epic 3 -- completing it finishes the "Existing SDK Resources (Phase 2)" epic

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 3, Story 3.5 -- acceptance criteria and tool list]
- [Source: _bmad-output/sprint-artifacts/3-4-journal-tools.md -- reference story format and patterns]
- [Source: _bmad-output/sprint-artifacts/3-3-workout-tools.md -- reference for tzDateSchema and ymdDateSchema usage]
- [Source: packages/benji-mcp/src/tools/workouts.ts -- reference implementation for tool registration pattern with tzDateSchema]
- [Source: packages/benji-mcp/src/tools/fasting.ts -- reference implementation for body-based and tzDateSchema pattern]
- [Source: packages/benji-mcp/src/tools/journal.ts -- reference implementation for body-based get/delete/deleteMany]
- [Source: packages/benji-mcp/src/tools/util.ts -- shared toolResult, handleToolError, ymdDateSchema, tzDateSchema helpers]
- [Source: packages/benji-mcp/src/server.ts -- createServer() factory function, tool wiring]
- [Source: packages/benji-sdk/src/client/sdk.gen.ts lines 159-287 -- PainEvents class with all 8 static methods]
- [Source: packages/benji-sdk/src/client/types.gen.ts lines 514-895 -- PainEventsBodyPartsData through PainEventsDeleteManyResponse types]
- [Source: packages/benji-sdk/src/client/types.gen.ts lines 117-123 -- Schema0 (body part) type definition]
- [Source: packages/benji-sdk/src/client/index.ts line 3 -- PainEvents class exported from SDK]
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

- All 8 pain event MCP tools implemented in a single file following established patterns
- All SDK calls use body-based parameters (no path IDs) as specified by the PainEvents API
- `ymdDateSchema` used for list filtering (year/month/day), `tzDateSchema` used for create/update (timezone-aware)
- Shared `toolResult` and `handleToolError` helpers imported from `./util.js` (no local re-declarations)
- `.min(1)` applied to all string ID params, `.int().min(1).max(10)` on painLevel, `.refine()` on update data object
- `pnpm --filter benji-mcp build` passes with zero TypeScript errors
- `pnpm build` (root recursive) passes for all three packages (benji-sdk, benji-mcp, benji-cli)
- All 8 tools verified present in `tools/list` MCP response (total tool count: 68)
- Task 13 (real API invocation) skipped as OPTIONAL -- requires real API key
- This is the LAST story in Epic 3, completing the "Existing SDK Resources (Phase 2)" epic

### File List

- `packages/benji-mcp/src/tools/pain-events.ts` (NEW) -- 8 pain event tool registrations
- `packages/benji-mcp/src/server.ts` (MODIFIED) -- import and call registerPainEventTools
