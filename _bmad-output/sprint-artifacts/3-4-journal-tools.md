# Story 3.4: Journal tools

Status: done

## Story

As an AI assistant,
I want MCP tools for Benji journal entries,
so that I can list journal entries, create entries, get a single entry, update entries, delete entries, bulk-delete entries, and view journal stats.

## Acceptance Criteria

1. **AC-1: list_journal_entries tool**
   - **Given** a valid API key
   - **When** `list_journal_entries` is called with optional `dateFrom` and `dateTo` (ISO date strings, e.g. 2026-03-01)
   - **Then** returns a structured JSON array of journal entry objects with `id`, `title`, `content`, `date`, `encrypted`, `wordCount`
   - **And** the `encryptionKey` parameter is NOT exposed to the MCP tool
   - **And** returns an error with structured message on API failure

2. **AC-2: create_journal_entry tool**
   - **Given** valid input
   - **When** `create_journal_entry` is called with required `content` and optional `title`, `date` (ISO date string)
   - **Then** creates and returns the journal entry object
   - **And** the `encryptionKey` parameter is NOT exposed to the MCP tool
   - **And** returns an error with structured message on API failure

3. **AC-3: get_journal_entry tool**
   - **Given** a valid journal entry ID
   - **When** `get_journal_entry` is called with `id`
   - **Then** returns the journal entry object with `id`, `title`, `content`, `date`, `encrypted`, `userId`, `wordCount`
   - **And** the `encryptionKey` body parameter is NOT exposed to the MCP tool
   - **And** returns an error with structured message on API failure

4. **AC-4: update_journal_entry tool**
   - **Given** a valid journal entry ID and at least one field to update
   - **When** `update_journal_entry` is called with `id` and a `data` object of updatable fields (title, content, date)
   - **Then** updates the journal entry and returns the updated entry object
   - **And** the `encrypted` field and `encryptionKey` parameter are NOT exposed to the MCP tool
   - **And** returns an error with structured message on API failure

5. **AC-5: delete_journal_entry tool**
   - **Given** a valid journal entry ID
   - **When** `delete_journal_entry` is called with `id`
   - **Then** deletes the journal entry and returns a success response
   - **And** returns an error with structured message on API failure

6. **AC-6: delete_many_journal_entries tool**
   - **Given** an array of valid journal entry IDs
   - **When** `delete_many_journal_entries` is called with `ids` (non-empty array of strings)
   - **Then** deletes all specified journal entries and returns a success response
   - **And** returns an error with structured message on API failure

7. **AC-7: get_journal_stats tool**
   - **Given** a valid API key
   - **When** `get_journal_stats` is called with no parameters
   - **Then** returns journal statistics with `totalEntries`, `totalWords`, `currentStreak`
   - **And** the `encryptionKey` body parameter is NOT exposed to the MCP tool
   - **And** returns an error with structured message on API failure

8. **AC-8: Encryption operations NOT exposed**
   - **And** the following SDK methods are NOT exposed as MCP tools: `journalEntriesEncrypt`, `journalEntriesDecrypt`, `journalEntriesToggleEncryption`, `journalEntriesEncryptMany`, `journalEntriesUpdateManyEncryption`, `journalEntriesGetForDecrypting`
   - **And** the `encryptionKey` parameter is NOT included in any MCP tool input schema
   - **And** the `encrypted` field is NOT included in the update tool's `data` input schema

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
    - **Then** all 7 journal tools appear with their names, descriptions, and input schemas

## Tasks / Subtasks

### Task Group A: File setup and wiring (AC: #9, #10, #11)

- [x] **Task 1: Create `packages/benji-mcp/src/tools/journal.ts` with tool registration function** (AC: #9, #10, #11)
  - Create `journal.ts` that exports a `registerJournalTools(server: McpServer)` function
  - Import `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js`
  - Import `z` from `zod`
  - Import `Journal`, `wrapSdkCall` from `benji-sdk`
  - Import `toolResult`, `handleToolError` from `./util.js` (shared helpers from Epic 2)
  - Do NOT re-declare toolResult/handleToolError locally -- use the shared util module
  - Do NOT import `tzDateSchema` -- journal dates use simple ISO date strings, not timezone-aware objects

- [x] **Task 2: Wire tool registration into server.ts** (AC: #11, #12)
  - In `packages/benji-mcp/src/server.ts`:
    - Import `registerJournalTools` from `./tools/journal.js`
    - Call `registerJournalTools(mcpServer)` after `registerWorkoutTools(mcpServer)`

### Task Group B: Tool implementations (AC: #1 through #7) -- parallelizable

- [x] **Task 3: Implement `list_journal_entries` tool** (AC: #1, #8, #9, #10)
  - Register tool via `server.registerTool("list_journal_entries", { ... }, callback)`
  - Description: `"List journal entries. Optionally filter by date range using dateFrom and dateTo (ISO date strings, e.g. 2026-03-01)."`
  - Input schema (zod):
    ```
    dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be ISO date format YYYY-MM-DD").optional().describe("Start of date range (ISO date string, e.g. 2026-03-01)")
    dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be ISO date format YYYY-MM-DD").optional().describe("End of date range (ISO date string, e.g. 2026-03-31)")
    ```
  - **CRITICAL:** Do NOT include `encryptionKey` in the input schema (AC-8)
  - Callback: `wrapSdkCall(Journal.journalEntriesList({ body: { dateFrom, dateTo } }))`
  - Wrap in try/catch, catch returns `handleToolError(error)`
  - **Note:** `JournalEntriesListData` has `body: { encryptionKey?: string | null, dateFrom?: string, dateTo?: string }` -- body-based, omit encryptionKey

- [x] **Task 4: Implement `create_journal_entry` tool** (AC: #2, #8, #9, #10)
  - Description: `"Create a new journal entry. Content is required. Optionally specify a title and date."`
  - Input schema (zod):
    ```
    content: z.string().min(1).describe("The journal entry content/body text")
    title: z.string().nullable().optional().describe("Title for the journal entry")
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be ISO date format YYYY-MM-DD").nullable().optional().describe("Date for the entry (ISO date string, e.g. 2026-03-28). Defaults to today if omitted.")
    ```
  - **CRITICAL:** Do NOT include `encryptionKey` in the input schema (AC-8)
  - **IMPORTANT:** Create uses body-based parameters: `Journal.journalEntriesCreate({ body: { content, title, date } })`
  - Callback: `wrapSdkCall(Journal.journalEntriesCreate({ body: { content, title, date } }))`

- [x] **Task 5: Implement `get_journal_entry` tool** (AC: #3, #8, #9, #10)
  - Description: `"Get a single journal entry by ID."`
  - Input schema (zod):
    ```
    id: z.string().min(1).describe("The journal entry ID to retrieve")
    ```
  - **CRITICAL:** Do NOT include `encryptionKey` in the body (AC-8). Pass an empty body or omit it.
  - **IMPORTANT:** Get uses path-based ID + body: `Journal.journalEntriesGet({ path: { id }, body: {} })`
  - Callback: `wrapSdkCall(Journal.journalEntriesGet({ path: { id }, body: {} }))`
  - **Note:** `JournalEntriesGetData` has `path: { id: string }` and `body: { encryptionKey?: string | null }` -- pass empty body object

- [x] **Task 6: Implement `update_journal_entry` tool** (AC: #4, #8, #9, #10)
  - Description: `"Update an existing journal entry. Provide the entry ID and the fields to update."`
  - Input schema (zod):
    ```
    id: z.string().min(1).describe("The journal entry ID to update")
    data: z.object({
      title: z.string().nullable().optional().describe("Title for the journal entry"),
      content: z.string().optional().describe("The journal entry content/body text"),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be ISO date format YYYY-MM-DD").nullable().optional().describe("Date for the entry (ISO date string, e.g. 2026-03-28)"),
    }).refine(
      (d) => d.title !== undefined || d.content !== undefined || d.date !== undefined,
      { message: "At least one field (title, content, or date) must be provided" }
    ).describe("Fields to update")
    ```
  - **CRITICAL:** Do NOT include `encrypted` in the data schema or `encryptionKey` in the body (AC-8)
  - **IMPORTANT:** Update uses path-based ID + body data: `Journal.journalEntriesUpdate({ path: { id }, body: { data } })`
  - Callback: `wrapSdkCall(Journal.journalEntriesUpdate({ path: { id }, body: { data } }))`

- [x] **Task 7: Implement `delete_journal_entry` tool** (AC: #5, #9, #10)
  - Description: `"Delete a journal entry by ID."`
  - Input schema (zod):
    ```
    id: z.string().min(1).describe("The journal entry ID to delete")
    ```
  - **IMPORTANT:** Delete uses path-based ID: `Journal.journalEntriesDelete({ path: { id } })`
  - Callback: `wrapSdkCall(Journal.journalEntriesDelete({ path: { id } }))`

- [x] **Task 8: Implement `delete_many_journal_entries` tool** (AC: #6, #9, #10)
  - Description: `"Delete multiple journal entries by their IDs."`
  - Input schema (zod):
    ```
    ids: z.array(z.string().min(1)).min(1).describe("Array of journal entry IDs to delete")
    ```
  - **IMPORTANT:** DeleteMany uses body-based parameters: `Journal.journalEntriesDeleteMany({ body: { ids } })`
  - Callback: `wrapSdkCall(Journal.journalEntriesDeleteMany({ body: { ids } }))`

- [x] **Task 9: Implement `get_journal_stats` tool** (AC: #7, #8, #9, #10)
  - Description: `"Get journal statistics including total entries, total words, and current streak."`
  - Input schema (zod): `{}` (no parameters)
  - **CRITICAL:** Do NOT include `encryptionKey` in the body (AC-8). Pass an empty body or omit it.
  - Callback: `wrapSdkCall(Journal.journalEntriesStats({ body: {} }))`
  - **Note:** `JournalEntriesStatsData` has `body: { encryptionKey?: string | null }` -- pass empty body object

### Task Group C: Build and verification (AC: #11, #12)

- [x] **Task 10: Verify build** (AC: #11)
  - Run `pnpm --filter benji-mcp build` -- must succeed with no TypeScript errors
  - Run `pnpm build` (root recursive) -- must succeed for all three packages
  - Verify `packages/benji-mcp/dist/tools/journal.js` exists in compiled output

- [x] **Task 11: Verify tools appear in tools/list** (AC: #12)
  - Start the server with `BENJI_API_KEY=test-key`
  - Send `initialize` and `notifications/initialized` followed by `tools/list`
  - Verify all 7 tools appear: `list_journal_entries`, `create_journal_entry`, `get_journal_entry`, `update_journal_entry`, `delete_journal_entry`, `delete_many_journal_entries`, `get_journal_stats`
  - Verify each tool has a `name`, `description`, and `inputSchema` with correct properties

- [ ] **Task 12: Verify tool invocation with real API** (AC: #1 through #7) -- OPTIONAL (requires real API key)
  - Set real `BENJI_API_KEY` in environment
  - Test `create_journal_entry` with `{ "content": "Test entry" }` -- verify returns entry object with `id`
  - Test `list_journal_entries` with `{}` -- verify structured response with array of entry objects
  - Test `get_journal_entry` with the created entry ID -- verify returns entry object
  - Test `update_journal_entry` with `{ "id": "<id>", "data": { "title": "Updated Title" } }` -- verify returns success
  - Test `get_journal_stats` with `{}` -- verify returns stats object with `totalEntries`, `totalWords`, `currentStreak`
  - Test `delete_journal_entry` with the entry ID -- verify returns success response
  - Test `delete_many_journal_entries` with `{ "ids": ["<id1>", "<id2>"] }` -- verify returns success response
  - Test error handling: call `delete_journal_entry` with invalid ID -- verify structured error response with `isError: true`

## Dev Notes

### SDK Method Reference (Exact Signatures)

All methods are on the `Journal` class exported from `benji-sdk`. The Journal API uses a **mixed pattern**: CRUD operations on individual entries use path-based IDs, while list/create/bulk operations use body-based parameters.

| MCP Tool | SDK Method | Path Params | Body Type | Required Fields |
|----------|-----------|-------------|-----------|-----------------|
| `list_journal_entries` | `Journal.journalEntriesList(options)` | None | `{ encryptionKey?, dateFrom?, dateTo? }` | Body required (all fields optional) |
| `create_journal_entry` | `Journal.journalEntriesCreate(options)` | None | `{ title?, content, date?, encryptionKey? }` | `content` (body) |
| `get_journal_entry` | `Journal.journalEntriesGet(options)` | `{ id }` | `{ encryptionKey? }` | `id` (path) |
| `update_journal_entry` | `Journal.journalEntriesUpdate(options)` | `{ id }` | `{ data: { title?, content?, date?, encrypted? }, encryptionKey? }` | `id` (path), `data` (body) |
| `delete_journal_entry` | `Journal.journalEntriesDelete(options)` | `{ id }` | `body?: never` | `id` (path) |
| `delete_many_journal_entries` | `Journal.journalEntriesDeleteMany(options)` | None | `{ ids: string[] }` | `ids` (body) |
| `get_journal_stats` | `Journal.journalEntriesStats(options)` | None | `{ encryptionKey? }` | Body required (all fields optional) |

### Mixed Path vs Body Parameter Pattern

```typescript
// Path-based (CRUD on individual entries):
Journal.journalEntriesDelete({ path: { id } })
Journal.journalEntriesUpdate({ path: { id }, body: { data } })
Journal.journalEntriesGet({ path: { id }, body: {} })

// Body-based (list/create/bulk operations):
Journal.journalEntriesList({ body: { dateFrom, dateTo } })
Journal.journalEntriesCreate({ body: { content, title, date } })
Journal.journalEntriesDeleteMany({ body: { ids } })
Journal.journalEntriesStats({ body: {} })
```

### Encryption Parameters: Deliberate Omission

The `encryptionKey` parameter appears in multiple SDK methods (`journalEntriesList`, `journalEntriesGet`, `journalEntriesCreate`, `journalEntriesUpdate`, `journalEntriesStats`) but is **deliberately omitted** from all MCP tool input schemas per the epic requirement: "encryption-related operations are NOT exposed (private/complex)."

Similarly, the `encrypted` field in `JournalEntriesUpdateData.body.data` is omitted from the update tool's `data` schema. This means:
- Entries cannot be created as encrypted via MCP
- The encryption flag cannot be toggled via MCP
- Encrypted entries will still appear in list/get results (with their `encrypted: boolean` field visible in responses), but the content may be unreadable if encrypted

### Journal Entry Response Shape

From `JournalEntriesGetResponses` / `JournalEntriesListResponses` / `JournalEntriesCreateResponses` / `JournalEntriesUpdateResponses`:
```typescript
{
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string | null;
  content: string;
  date: string;
  encrypted: boolean;
  userId: string;
  wordCount?: number;
}
```

### Delete Response Shape

From `JournalEntriesDeleteResponses` / `JournalEntriesDeleteManyResponses`:
```typescript
{
  success: boolean;
}
```

### Stats Response Shape

From `JournalEntriesStatsResponses`:
```typescript
{
  totalEntries: number;
  totalWords: number;
  currentStreak: number;
}
```

### Encryption-Related Methods NOT Exposed

The following 6 SDK methods on the `Journal` class are intentionally NOT exposed as MCP tools:
- `journalEntriesEncrypt` -- Encrypt a single entry (requires encryptionKey)
- `journalEntriesDecrypt` -- Decrypt a single entry (requires encryptionKey)
- `journalEntriesToggleEncryption` -- Toggle encryption flag
- `journalEntriesEncryptMany` -- Encrypt multiple entries (requires encryptionKey)
- `journalEntriesUpdateManyEncryption` -- Update encryption status for multiple entries
- `journalEntriesGetForDecrypting` -- Get entry for decrypting without persisting

### Note on `journalEntriesGet` Using POST

Unlike most GET-by-ID patterns, `journalEntriesGet` uses HTTP POST (not GET) because it accepts an optional `encryptionKey` in the body. The SDK method signature requires an `options` object with `path: { id }` and `body: { encryptionKey? }`. When calling without encryption, pass `body: {}` (empty object).

### MCP Tool Registration Pattern

Follow the exact same pattern from `workouts.ts` and `fasting.ts`, importing shared helpers from `util.ts`:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Journal, wrapSdkCall } from "benji-sdk";
import { toolResult, handleToolError } from "./util.js";

export function registerJournalTools(server: McpServer): void {
  // list_journal_entries -- body-based, optional date range
  server.registerTool("list_journal_entries", { ... }, async ({ dateFrom, dateTo }) => {
    try {
      const result = await wrapSdkCall(Journal.journalEntriesList({ body: { dateFrom, dateTo } }));
      return toolResult(result);
    } catch (error) {
      return handleToolError(error);
    }
  });

  // create_journal_entry -- body-based, content required
  server.registerTool("create_journal_entry", { ... }, async ({ content, title, date }) => {
    try {
      const result = await wrapSdkCall(Journal.journalEntriesCreate({ body: { content, title, date } }));
      return toolResult(result);
    } catch (error) {
      return handleToolError(error);
    }
  });

  // get_journal_entry -- path-based ID + empty body
  server.registerTool("get_journal_entry", { ... }, async ({ id }) => {
    try {
      const result = await wrapSdkCall(Journal.journalEntriesGet({ path: { id }, body: {} }));
      return toolResult(result);
    } catch (error) {
      return handleToolError(error);
    }
  });

  // update_journal_entry -- path + body (no encrypted/encryptionKey)
  server.registerTool("update_journal_entry", { ... }, async ({ id, data }) => {
    try {
      const result = await wrapSdkCall(Journal.journalEntriesUpdate({ path: { id }, body: { data } }));
      return toolResult(result);
    } catch (error) {
      return handleToolError(error);
    }
  });

  // delete_journal_entry -- path-based ID
  server.registerTool("delete_journal_entry", { ... }, async ({ id }) => {
    try {
      const result = await wrapSdkCall(Journal.journalEntriesDelete({ path: { id } }));
      return toolResult(result);
    } catch (error) {
      return handleToolError(error);
    }
  });

  // delete_many_journal_entries -- body-based IDs array
  server.registerTool("delete_many_journal_entries", { ... }, async ({ ids }) => {
    try {
      const result = await wrapSdkCall(Journal.journalEntriesDeleteMany({ body: { ids } }));
      return toolResult(result);
    } catch (error) {
      return handleToolError(error);
    }
  });

  // get_journal_stats -- no user-facing params, empty body
  server.registerTool("get_journal_stats", { ... }, async () => {
    try {
      const result = await wrapSdkCall(Journal.journalEntriesStats({ body: {} }));
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

- All relative imports MUST use `.js` extensions: `./tools/journal.js`
- Package imports use bare specifiers: `benji-sdk`, `zod`
- MCP SDK imports use deep paths: `@modelcontextprotocol/sdk/server/mcp.js`

### File Structure After This Story

```
packages/benji-mcp/
  src/
    index.ts          (UNCHANGED)
    server.ts         (MODIFIED -- imports and calls registerJournalTools)
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
      journal.ts      (NEW -- 7 tool registrations)
```

### Project Structure Notes

- Alignment: follows the exact same module structure established in Epic 2 (one file per resource in `tools/`, exported register function, wired in `server.ts`)
- Shared `toolResult`/`handleToolError` imported from `./util.js` (no local re-declarations)
- `tzDateSchema` is NOT needed for journal -- journal dates use simple ISO date strings (`YYYY-MM-DD`), not timezone-aware objects. This differs from workouts/fasting which use `tzDateSchema` for datetime fields.
- No conflicts or variances expected
- The path vs body pattern is consistent with prior stories: delete/get/update use path-based IDs, list/create/deleteMany/stats use body-based parameters
- `.min(1)` on all string ID params, `.min(1)` on content, `.refine()` on update data object, ISO date regex on date strings -- all patterns from stories 3-1 through 3-3 applied
- Array validation: `z.array(z.string().min(1)).min(1)` for `ids` in delete_many ensures at least one valid ID

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 3, Story 3.4 -- acceptance criteria and encryption exclusion note]
- [Source: _bmad-output/sprint-artifacts/3-3-workout-tools.md -- reference story format and pattern]
- [Source: packages/benji-mcp/src/tools/workouts.ts -- reference implementation for tool registration pattern]
- [Source: packages/benji-mcp/src/tools/fasting.ts -- reference implementation for mixed path/body pattern]
- [Source: packages/benji-mcp/src/tools/util.ts -- shared toolResult, handleToolError helpers]
- [Source: packages/benji-mcp/src/server.ts -- createServer() factory function, tool wiring]
- [Source: packages/benji-sdk/src/client/sdk.gen.ts lines 2179-2392 -- Journal class with all 12 static methods]
- [Source: packages/benji-sdk/src/client/types.gen.ts lines 11926-12559 -- JournalEntriesDeleteData through JournalEntriesToggleEncryptionResponse types]
- [Source: packages/benji-sdk/src/client/index.ts line 3 -- Journal class exported from SDK]
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

- All 7 journal tools implemented: list_journal_entries, create_journal_entry, get_journal_entry, update_journal_entry, delete_journal_entry, delete_many_journal_entries, get_journal_stats
- Encryption operations deliberately NOT exposed (AC-8): no encryptionKey in any input schema, no encrypted field in update data schema, no encrypt/decrypt/toggle tools
- Shared helpers (toolResult, handleToolError) imported from ./util.js -- no local re-declarations
- ISO date regex validation on dateFrom, dateTo, and date fields (YYYY-MM-DD format)
- .min(1) on all string ID params and content; .refine() on update data to require at least one field
- z.array(z.string().min(1)).min(1) on ids for delete_many
- journalEntriesGet and journalEntriesStats pass body: {} to satisfy POST-based endpoints without exposing encryptionKey
- pnpm --filter benji-mcp build: passed (0 TypeScript errors)
- pnpm build (root): passed for all 3 packages
- tools/list verification: all 7 journal tools present (60 total tools registered)
- Task 12 (real API verification) skipped -- optional, requires real API key

### File List

- `packages/benji-mcp/src/tools/journal.ts` (NEW) -- 7 journal tool registrations
- `packages/benji-mcp/src/server.ts` (MODIFIED) -- import and call registerJournalTools
