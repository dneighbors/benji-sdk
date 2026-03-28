# Story 2.1: Scaffold MCP server with stdio transport

Status: done

## Story

As a developer,
I want `packages/benji-mcp/` running as a stdio MCP server with `@modelcontextprotocol/sdk`,
so that AI assistants can connect to it and invoke tools against the Benji API.

## Acceptance Criteria

1. **AC-1: Server starts and responds to initialize**
   - **Given** `BENJI_API_KEY` is set in the environment
   - **When** I run `pnpm --filter benji-mcp dev`
   - **Then** the MCP server starts on stdio and responds to the MCP `initialize` handshake

2. **AC-2: Server name is `benji-mcp`**
   - **And** the server identifies itself as `benji-mcp` in the `initialize` response
   - **And** the server version matches `package.json` version (`0.1.0`)

3. **AC-3: Optional base URL override**
   - **Given** `BENJI_BASE_URL` is set in the environment
   - **When** the server initializes
   - **Then** the SDK client uses that base URL instead of the default (`https://app.benji.so/api/rest`)

4. **AC-4: API key validation before starting**
   - **Given** `BENJI_API_KEY` is NOT set in the environment
   - **When** the server process is started
   - **Then** it exits with a clear error message: `"BENJI_API_KEY environment variable is required. Get your API key from https://app.benji.so/settings"`
   - **And** the exit code is non-zero

5. **AC-5: MCP protocol compliance**
   - **And** the server declares its capabilities (tools) in the `initialize` response
   - **And** the server responds to `tools/list` with an empty tool list (tools are added in subsequent stories)
   - **And** the server responds to `ping` requests

6. **AC-6: Build succeeds**
   - **Given** the new dependencies and source files
   - **When** I run `pnpm --filter benji-mcp build`
   - **Then** the build succeeds with no TypeScript errors
   - **And** the compiled output is in `packages/benji-mcp/dist/`

7. **AC-7: Workspace integrity**
   - **And** `pnpm build` (root-level recursive build) still succeeds for all packages
   - **And** the SDK package (`benji-sdk`) is unchanged

## Tasks / Subtasks

### Task Group A: Dependencies and configuration (AC: #6, #7)

- [x] **Task 1: Add `@modelcontextprotocol/sdk` and `zod` dependencies** (AC: #6, #7)
  - Update `packages/benji-mcp/package.json`:
    - Add to `dependencies`:
      - `"@modelcontextprotocol/sdk": "^1.28.0"`
      - `"zod": "^3.25.0"` (peer dependency of `@modelcontextprotocol/sdk`; required for tool schema definitions in later stories)
    - Add `"dev"` script: `"dev": "npx tsx src/index.ts"`
    - Add `"start"` script: `"start": "node dist/index.js"`
    - Add `tsx` to `devDependencies`: `"tsx": "^4.19.0"` (for `dev` script — runs TypeScript directly without compilation)
  - Run `pnpm install` from repo root to resolve new dependencies

- [x] **Task 2: Add shebang and bin entry for direct execution** (AC: #6)
  - Update `packages/benji-mcp/package.json`:
    - Add `"bin": { "benji-mcp": "./dist/index.js" }` so MCP clients can reference the compiled server directly
  - The entry point `dist/index.js` will need a shebang (`#!/usr/bin/env node`) added at the top of `src/index.ts` (see Task 4)

### Task Group B: Server implementation (AC: #1, #2, #3, #4, #5) — parallelizable with Task Group A after dependency resolution

- [x] **Task 3: Create `packages/benji-mcp/src/server.ts` — server factory** (AC: #1, #2, #5)
  - Import `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js`
  - Create and export a `createServer()` function that:
    - Instantiates `new McpServer({ name: "benji-mcp", version: "0.1.0" })`
    - Returns the server instance
  - The server version should be read from a constant or hardcoded to match `package.json` version
  - No tools are registered at this stage (tools come in Stories 2.2-2.7)
  - The server will automatically declare tool capabilities and respond to `tools/list` with an empty list

- [x] **Task 4: Update `packages/benji-mcp/src/index.ts` — entry point** (AC: #1, #2, #3, #4, #5)
  - Replace the placeholder content with the actual MCP server entry point
  - Add shebang line: `#!/usr/bin/env node`
  - Import `StdioServerTransport` from `@modelcontextprotocol/sdk/server/stdio.js`
  - Import `initializeFromEnv` from `benji-sdk`
  - Import `createServer` from `./server.js`
  - Implement a `main()` async function that:
    1. Calls `initializeFromEnv()` inside a try/catch
       - On `BenjiConfigError`, log the error message to `stderr` and call `process.exit(1)`
    2. Calls `createServer()` to get the McpServer instance
    3. Creates a `new StdioServerTransport()`
    4. Calls `await server.connect(transport)` to start listening on stdio
    5. Logs `"benji-mcp server started"` to `stderr` (not stdout — stdout is reserved for MCP protocol messages)
  - Call `main()` at module level, with `.catch()` that logs to stderr and exits with code 1
  - **Important:** ALL logging must go to `stderr`. `stdout` is exclusively for MCP JSON-RPC messages over stdio transport.

### Task Group C: Build and verification (AC: #5, #6, #7)

- [x] **Task 5: Verify build** (AC: #6, #7)
  - Run `pnpm --filter benji-mcp build` — must succeed with no errors
  - Run `pnpm build` (root recursive) — must succeed for all three packages
  - Verify `packages/benji-mcp/dist/index.js` and `packages/benji-mcp/dist/server.js` exist
  - Verify `packages/benji-sdk/dist/` is unchanged

- [x] **Task 6: Verify server starts and responds to MCP initialize** (AC: #1, #2, #4, #5)
  - Set `BENJI_API_KEY=test-key` in environment
  - Run the server: `echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | BENJI_API_KEY=test-key npx tsx packages/benji-mcp/src/index.ts`
  - Verify stdout contains a JSON-RPC response with:
    - `"serverInfo": { "name": "benji-mcp", "version": "0.1.0" }`
    - `"capabilities"` object includes `"tools"` key
  - Test missing API key: run without `BENJI_API_KEY` and verify it exits with error message on stderr

- [x] **Task 7: Verify `tools/list` returns empty list** (AC: #5)
  - After `initialize`, send `{"jsonrpc":"2.0","id":2,"method":"notifications/initialized"}` followed by `{"jsonrpc":"2.0","id":3,"method":"tools/list"}`
  - Verify the response contains `"tools": []`

## Dev Notes

### Architecture Constraints

- **ESM-only:** All files must use `.js` extensions in relative imports (e.g., `./server.js`, not `./server`). The project uses `"type": "module"` and `"moduleResolution": "bundler"`.
- **TypeScript strict mode:** `"strict": true` in `tsconfig.json`. No implicit `any`.
- **stdout is sacred:** In stdio transport mode, `stdout` is exclusively for MCP JSON-RPC messages. All application logging (startup messages, errors, debug info) MUST use `console.error()` or `process.stderr.write()`. Using `console.log()` will corrupt the MCP protocol stream.
- **No test framework yet:** This story does not introduce a testing framework. Verification is manual via stdio piping. A test framework will be considered in a later story if needed.

### MCP SDK API Reference

The `@modelcontextprotocol/sdk` (v1.28.0) provides these key imports for server implementation:

```typescript
// High-level server class — manages tool/resource/prompt registration
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// Stdio transport — reads from stdin, writes to stdout
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
```

**McpServer constructor:**
```typescript
new McpServer({
  name: string,       // Server name — "benji-mcp"
  version: string,    // Server version — "0.1.0"
})
```

**Tool registration (for reference in future stories):**
```typescript
server.registerTool(
  "tool_name",
  {
    title: "Human-readable title",
    description: "What this tool does",
    inputSchema: { /* zod schema fields */ },
  },
  async (args) => {
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  }
);
```

### Dependency Notes

| Package | Version | Purpose |
|---------|---------|---------|
| `@modelcontextprotocol/sdk` | ^1.28.0 | MCP server framework (McpServer, StdioServerTransport) |
| `zod` | ^3.25.0 | Schema validation for tool inputs (peer dep of MCP SDK, used in Stories 2.2+) |
| `tsx` | ^4.19.0 | Dev dependency — runs TypeScript directly for `pnpm dev` script |
| `benji-sdk` | workspace:* | Already a dependency — provides `initializeFromEnv`, `wrapSdkCall`, error types |

### Shared Infrastructure from Story 1.3

This story builds on the auth/error infrastructure created in Story 1.3:

- **`initializeFromEnv()`** — Reads `BENJI_API_KEY` (required) and `BENJI_BASE_URL` (optional) from environment, calls `configure()` on the SDK client. Throws `BenjiConfigError` if API key is missing.
- **`BenjiConfigError`** — Thrown when configuration is invalid. The MCP entry point catches this and exits cleanly.
- **`wrapSdkCall()`** — Not used in this story, but will be used by every tool handler in Stories 2.2-2.7.
- **`BenjiApiError`** — Not used in this story, but tool handlers will catch these and return structured MCP error responses.

### Learnings from Epic 1

1. **ESM `.js` extensions required:** All hand-written import paths must use `.js` extensions. The `fix-imports.mjs` script only patches auto-generated SDK files.
2. **Build order is automatic:** pnpm resolves workspace dependency topology. `benji-sdk` builds before `benji-mcp` when running `pnpm -r build`.
3. **Circular import prevention:** The SDK's `env.ts` imports from `index.ts` (for `configure`). This is a known safe pattern with ES modules.
4. **Network error handling:** `wrapSdkCall()` already handles network-level errors (DNS failure, connection refused) by wrapping them as `BenjiApiError` with `status: 0`.

### Project Structure Notes

**Directory layout after this story:**

```
packages/benji-mcp/
  package.json          (MODIFIED — added deps, scripts, bin)
  tsconfig.json         (UNCHANGED)
  src/
    index.ts            (REPLACED — MCP server entry point with stdio transport)
    server.ts           (NEW — server factory, createServer())
  dist/
    index.js            (compiled entry point)
    server.js           (compiled server factory)
```

**Key integration points:**
- `src/index.ts` imports from `benji-sdk` (workspace dependency) and `./server.js` (local module)
- `src/server.ts` imports from `@modelcontextprotocol/sdk/server/mcp.js` (npm dependency)
- `src/index.ts` imports from `@modelcontextprotocol/sdk/server/stdio.js` (npm dependency)

### MCP Client Configuration (for testing)

After this story, the server can be configured in AI assistants:

**Claude Code (`~/.claude/claude_code_config.json`):**
```json
{
  "mcpServers": {
    "benji": {
      "command": "npx",
      "args": ["tsx", "/path/to/benji-sdk/packages/benji-mcp/src/index.ts"],
      "env": {
        "BENJI_API_KEY": "your-api-key"
      }
    }
  }
}
```

**Cursor (`~/.cursor/mcp.json`):**
```json
{
  "mcpServers": {
    "benji": {
      "command": "npx",
      "args": ["tsx", "/path/to/benji-sdk/packages/benji-mcp/src/index.ts"],
      "env": {
        "BENJI_API_KEY": "your-api-key"
      }
    }
  }
}
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 2, Story 2.1 — acceptance criteria and FR4]
- [Source: _bmad-output/sprint-artifacts/1-1-convert-to-pnpm-workspace-monorepo.md — monorepo structure and ESM learnings]
- [Source: _bmad-output/sprint-artifacts/1-3-shared-error-handling-and-auth.md — initializeFromEnv, error types, wrapSdkCall]
- [Source: packages/benji-mcp/package.json — current scaffold package.json]
- [Source: packages/benji-mcp/tsconfig.json — TypeScript config (ES2020, ESNext, bundler)]
- [Source: packages/benji-sdk/src/env.ts — initializeFromEnv() implementation]
- [Source: packages/benji-sdk/src/errors.ts — BenjiError, BenjiConfigError, BenjiApiError classes]
- [Source: packages/benji-sdk/src/index.ts — configure(), SDK re-exports]
- [Source: https://github.com/modelcontextprotocol/typescript-sdk — MCP TypeScript SDK v1.28.0]
- [Source: https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/server.md — MCP server documentation]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List

- All 7 tasks completed and verified.
- Added `@types/node` as devDependency (not in original story but required for `process.exit()` compilation under strict mode).
- McpServer does not auto-declare `tools` capability or register `tools/list` handler when no tools are registered. Fixed by passing `capabilities: { tools: {} }` in constructor options and manually registering a `tools/list` handler via `mcpServer.server.setRequestHandler(ListToolsRequestSchema, ...)`. When tools are registered in Stories 2.2-2.7 via `mcpServer.registerTool()`, the SDK will take over this handler automatically.
- `notifications/initialized` must be sent as a notification (no `id` field) per MCP spec. The story's Task 7 example had `"id":2` which is incorrect; verified with correct notification format.

### File List

- `packages/benji-mcp/package.json` (MODIFIED -- added dependencies, scripts, bin entry)
- `packages/benji-mcp/src/server.ts` (NEW -- server factory with createServer())
- `packages/benji-mcp/src/index.ts` (REPLACED -- MCP server entry point with stdio transport)
- `packages/benji-mcp/dist/index.js` (compiled output)
- `packages/benji-mcp/dist/index.d.ts` (compiled output)
- `packages/benji-mcp/dist/server.js` (compiled output)
- `packages/benji-mcp/dist/server.d.ts` (compiled output)
