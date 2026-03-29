# Story 7.3: Env var docs and troubleshooting

**Story key:** `7-3-env-var-docs-and-troubleshooting`
**Epic:** 7 (Documentation & Polish)
**Status:** done

## Story

As a developer,
I want documentation for all env vars and common error troubleshooting,
so that I can debug setup issues.

## Prerequisites

- **Epic 2** -- MCP Server Phase 1 (`done`)
- **Epic 3** -- MCP Server Phase 2 (`done`)
- **Story 7.1** -- README and MCP usage docs (`done`): Root README.md has a basic env vars table (`BENJI_API_KEY`, `BENJI_BASE_URL`) and MCP config snippets.
- **Story 7.2** -- CLAUDE.md and config snippets (`done`): CLAUDE.md documents error hierarchy, architecture constraints, and key file locations.

## Background

The project has two existing documentation files at the root:

- **README.md** (Story 7.1) -- Contains a two-row environment variables table (BENJI_API_KEY required, BENJI_BASE_URL optional) and MCP/CLI setup instructions. Adequate for getting started, but provides no guidance when things go wrong.
- **CLAUDE.md** (Story 7.2) -- Documents the error class hierarchy (`BenjiError` -> `BenjiConfigError`, `BenjiApiError`) and `wrapSdkCall()` behavior for AI assistants. Not intended for human troubleshooting.

What is missing is a dedicated troubleshooting guide that covers:
1. Detailed env var documentation beyond the basic table (how they flow through the system, validation, edge cases)
2. Common error scenarios and their solutions mapped to each package
3. How error codes and messages map to root causes
4. Debug techniques specific to MCP stdio, CLI output modes, and SDK wrapper errors

The actual error handling code reveals these key error paths:

| Error Class | Code / Pattern | Trigger |
|---|---|---|
| `BenjiConfigError` | Missing `BENJI_API_KEY` | `initializeFromEnv()` called without env var set |
| `BenjiApiError` (status 401) | `HTTP_401` | Invalid or expired API key |
| `BenjiApiError` (status 400) | `HTTP_400` + `issues[]` | Validation failures (missing required fields, bad formats) |
| `BenjiApiError` (status 404) | `HTTP_404` | Resource ID does not exist |
| `BenjiApiError` (status 500) | `HTTP_500` | Benji server-side error |
| `BenjiApiError` (status 0) | `NETWORK_ERROR` | DNS failure, connection refused, timeout |
| `BenjiApiError` | `EMPTY_RESPONSE` | API returned 2xx but no data body |
| (generic Error) | `UNKNOWN_ERROR` / `UNEXPECTED_ERROR` | Unrecognized exception types |

In the MCP server, all errors are returned as `isError: true` JSON via `handleToolError()`. In the CLI, errors go to stderr with exit code 1 via `handleCommandError()`, with JSON or human-readable formatting depending on `--json` flag.

## Acceptance Criteria

1. **AC-1: TROUBLESHOOTING.md exists at project root**
   Given a developer encountering an error in any package (SDK, MCP, CLI),
   When they look for troubleshooting help,
   Then they find `/TROUBLESHOOTING.md` at the project root with organized, searchable error documentation.

2. **AC-2: Detailed environment variable documentation**
   Given a developer reading the env var section,
   When they need to understand how environment variables work,
   Then they find documentation covering:
   - `BENJI_API_KEY`: required, how to obtain it, how it flows through the system (`initializeFromEnv()` -> `configure()` -> `x-api-key` header), what happens when missing or invalid
   - `BENJI_BASE_URL`: optional, default value (`https://app.benji.so/api/rest`), when to override (self-hosted, development), format requirements (must be a valid URL, no trailing slash)
   - Which packages read which env vars (all three via `initializeFromEnv()` or `configure()`)

3. **AC-3: Authentication errors documented**
   Given a developer seeing auth-related errors,
   When they search the troubleshooting guide,
   Then they find:
   - Missing API key scenario: the exact error message from `BenjiConfigError` ("BENJI_API_KEY environment variable is required..."), how it manifests in MCP (stderr message + exit 1) vs CLI (stderr + "Example: BENJI_API_KEY=your-key benji todos list")
   - Invalid API key scenario: `HTTP_401` error, how it manifests in each package
   - Steps to resolve: where to get a key, how to set it (export, .env file, MCP config `env` block)

4. **AC-4: Network errors documented**
   Given a developer seeing network-related errors,
   When they search the troubleshooting guide,
   Then they find:
   - `NETWORK_ERROR` (status 0): DNS failure, connection refused, timeout explanations
   - Wrong `BENJI_BASE_URL` scenario: connection refused or DNS errors from a misconfigured base URL
   - Steps to resolve: check internet, verify URL, test with curl

5. **AC-5: Validation errors documented**
   Given a developer seeing validation errors,
   When they search the troubleshooting guide,
   Then they find:
   - `HTTP_400` with `issues[]`: explanation of the issues array and how to read it
   - Common validation failures: missing required fields (e.g., `title` for todos, `screen` for list_todos), invalid date formats (expected YYYY-MM-DD), invalid enum values
   - How validation errors appear in MCP (JSON with code + message + issues) vs CLI (human-readable with bullet list of issues, or JSON with `--json`)

6. **AC-6: Not-found and server errors documented**
   Given a developer seeing 404 or 500 errors,
   When they search the troubleshooting guide,
   Then they find:
   - `HTTP_404`: resource ID does not exist, common cause (stale IDs, typos), how to list resources first to find valid IDs
   - `HTTP_500`: Benji server-side error, check https://benji.so status, retry later
   - `EMPTY_RESPONSE`: API returned success but no data, possible API version mismatch

7. **AC-7: MCP-specific troubleshooting section**
   Given a developer having trouble with the MCP server,
   When they search the troubleshooting guide,
   Then they find:
   - MCP server won't start: missing `BENJI_API_KEY`, wrong path in config, Node.js not found, package not built
   - MCP server starts but tools fail: valid config but invalid API key, stderr messages from the MCP server
   - Cursor/Claude Code/Claude Desktop connection issues: config file locations, how to verify the server path, how to check stderr output
   - How to test the MCP server manually (run `node packages/benji-mcp/dist/index.js` and check stderr)

8. **AC-8: CLI-specific troubleshooting section**
   Given a developer having trouble with the CLI,
   When they search the troubleshooting guide,
   Then they find:
   - `benji: command not found`: package not built, not using `node packages/benji-cli/dist/index.js` directly, or not linked
   - Auth errors: `BENJI_API_KEY` not exported in current shell session
   - Output mode issues: `--json` and `--compact` flags must appear after the subcommand (fixed in epic-6 but good to document)
   - Delete safety: `--force` flag required for all delete operations
   - Error output format: human-readable by default to stderr, JSON to stderr with `--json`

9. **AC-9: Error code reference table**
   Given a developer who sees an error code,
   When they look it up in the troubleshooting guide,
   Then they find a reference table mapping every error code to its meaning and resolution:
   - `CONFIG_ERROR` -- Missing `BENJI_API_KEY`
   - `NETWORK_ERROR` -- Cannot reach the Benji API
   - `HTTP_400` -- Validation failure (check `issues` array)
   - `HTTP_401` -- Invalid or expired API key
   - `HTTP_404` -- Resource not found
   - `HTTP_500` -- Server error
   - `EMPTY_RESPONSE` -- Unexpected empty response from API
   - `UNKNOWN_ERROR` / `UNEXPECTED_ERROR` -- Unhandled error type

10. **AC-10: No placeholder text or inaccuracies**
    Given the completed TROUBLESHOOTING.md,
    When a reviewer inspects the document,
    Then there are zero placeholder strings (`TODO`, `TBD`, `{{variable}}`), all error messages match the actual source code, and all referenced file paths exist in the repo.

## Tasks / Subtasks

### Task Group A: Create TROUBLESHOOTING.md scaffold (AC: #1)

- [x] **A.1** Create `/TROUBLESHOOTING.md` at the project root with the following top-level sections as headers:
  - Title and intro paragraph
  - Table of Contents
  - Environment Variables (detailed)
  - Error Code Reference
  - Authentication Errors
  - Network Errors
  - Validation Errors
  - Not Found and Server Errors
  - MCP Server Troubleshooting
  - CLI Troubleshooting
  - Getting Help

### Task Group B: Environment variable documentation (AC: #2)

- [x] **B.1** Write the **Environment Variables** section with a detailed subsection for each variable:

  **`BENJI_API_KEY`** (required):
  - Purpose: authenticates all API requests
  - Where to get it: https://app.benji.so/settings
  - How it flows: `initializeFromEnv()` reads `process.env.BENJI_API_KEY` -> calls `configure({ apiKey })` -> sets `x-api-key` header on all requests
  - How to set it: `export BENJI_API_KEY=your-key` in shell, or `env` block in MCP config JSON
  - What happens when missing: `BenjiConfigError` thrown with message "BENJI_API_KEY environment variable is required. Get your API key from https://app.benji.so/settings"
  - What happens when invalid: API returns 401 on first request (not at startup)

  **`BENJI_BASE_URL`** (optional):
  - Purpose: override the API base URL
  - Default: `https://app.benji.so/api/rest`
  - When to use: self-hosted Benji instances, development/staging environments
  - Format: full URL with protocol, no trailing slash (e.g., `https://my-instance.com/api/rest`)
  - How it flows: `initializeFromEnv()` reads `process.env.BENJI_BASE_URL` -> passes to `configure({ apiKey, baseUrl })` -> used as base for all API request URLs

- [x] **B.2** Document which packages read env vars: all three packages use `initializeFromEnv()` from `benji-sdk`. The MCP server calls it at startup in `packages/benji-mcp/src/index.ts`. The CLI calls it via `ensureAuth()` in `packages/benji-cli/src/auth.ts` before each command. The SDK itself exports `initializeFromEnv()` but can also be configured directly via `configure()`.

### Task Group C: Error code reference table (AC: #9)

- [x] **C.1** Write the **Error Code Reference** section as a table with columns: Code, HTTP Status, Meaning, Common Causes, Resolution. Include every code found in the source:

  | Code | HTTP Status | Meaning | Common Causes | Resolution |
  |------|-------------|---------|---------------|------------|
  | `CONFIG_ERROR` | N/A | Missing required configuration | `BENJI_API_KEY` not set | Set the env var |
  | `NETWORK_ERROR` | 0 | Cannot reach the Benji API | DNS failure, no internet, wrong `BENJI_BASE_URL`, firewall | Check connectivity, verify URL |
  | `HTTP_400` | 400 | Request validation failed | Missing required fields, invalid formats, bad enum values | Check `issues` array for specifics |
  | `HTTP_401` | 401 | Authentication failed | Invalid, expired, or revoked API key | Get a new key from app.benji.so/settings |
  | `HTTP_404` | 404 | Resource not found | Invalid ID, resource deleted, typo in ID | List resources to find valid IDs |
  | `HTTP_500` | 500 | Benji server error | Server-side issue | Retry later, check benji.so status |
  | `EMPTY_RESPONSE` | 2xx | No data in response | Possible API version mismatch | Rebuild SDK, check API spec |
  | `UNKNOWN_ERROR` | N/A | Unrecognized error | Bug in error handling | Report as issue with full error output |
  | `UNEXPECTED_ERROR` | N/A | Unrecognized error (CLI) | Bug in error handling | Report as issue with full error output |

### Task Group D: Authentication error scenarios (AC: #3)

- [x] **D.1** Write the **Authentication Errors** section with two subsections:

  **Missing API Key** -- show exact error messages as they appear in each package:
  - SDK: throws `BenjiConfigError` with message "BENJI_API_KEY environment variable is required. Get your API key from https://app.benji.so/settings"
  - MCP server: prints the error message to stderr and exits with code 1. The MCP client (Cursor/Claude Code) will show a connection failure.
  - CLI (human mode): `Error: BENJI_API_KEY environment variable is required. Get your API key from https://app.benji.so/settings` followed by `Example: BENJI_API_KEY=your-key benji todos list`
  - CLI (JSON mode): `{"error":{"code":"CONFIG_ERROR","message":"BENJI_API_KEY environment variable is required. Get your API key from https://app.benji.so/settings"}}`
  - Resolution steps: get key from https://app.benji.so/settings, set via `export BENJI_API_KEY=...` or in MCP config `env` block

  **Invalid API Key** -- explain that invalid keys are NOT caught at startup; the error occurs on the first API call:
  - MCP: tool returns `{"code":"HTTP_401","message":"..."}` with `isError: true`
  - CLI (human mode): `Error [401] HTTP_401: <message>`
  - CLI (JSON mode): `{"error":{"code":"HTTP_401","status":401,"message":"..."}}`
  - Resolution: verify key at app.benji.so/settings, generate a new one if needed

### Task Group E: Network and server error scenarios (AC: #4, #5, #6)

- [x] **E.1** Write the **Network Errors** section covering:
  - Symptom: error with code `NETWORK_ERROR` and status 0
  - Common causes: no internet connection, DNS resolution failure, `BENJI_BASE_URL` pointing to wrong host, firewall blocking outbound HTTPS
  - How `wrapSdkCall()` catches these: the promise throws (not the `{ data, error, response }` path) and gets wrapped with status 0 and code `NETWORK_ERROR`
  - Diagnostic steps: `curl -I https://app.benji.so/api/rest` to check connectivity, verify `BENJI_BASE_URL` if set, check DNS resolution
  - MCP vs CLI manifestation: same error code, different formatting

- [x] **E.2** Write the **Validation Errors** section covering:
  - Symptom: error with code `HTTP_400` and an `issues` array
  - How to read the issues array: each entry has a `message` field explaining what's wrong
  - Common validation failures with examples:
    - Missing `screen` parameter in `list_todos` / `benji todos list`
    - Invalid date format (expected `YYYY-MM-DD`)
    - Missing required field (e.g., `title` when creating a todo)
    - Invalid enum value (e.g., wrong priority value)
  - How issues appear in MCP: `{"code":"HTTP_400","message":"...","issues":[{"message":"..."}]}`
  - How issues appear in CLI: `Error [400] HTTP_400: <message>` followed by `  - <issue message>` for each issue

- [x] **E.3** Write the **Not Found and Server Errors** section covering:
  - `HTTP_404`: resource does not exist. Common causes: stale ID from a previous session, typo, resource was deleted. Resolution: use the list command/tool first to find valid IDs.
  - `HTTP_500`: Benji server-side error. Resolution: wait and retry, check Benji service status.
  - `EMPTY_RESPONSE`: API returned 2xx but no data body. This is rare and may indicate an API version mismatch. Resolution: rebuild the SDK (`pnpm --filter benji-sdk build`), check if the OpenAPI spec is up to date.

### Task Group F: Package-specific troubleshooting (AC: #7, #8)

- [x] **F.1** Write the **MCP Server Troubleshooting** section with these scenarios:

  **"Server won't start"**:
  - Check 1: Is `BENJI_API_KEY` set? The server calls `initializeFromEnv()` at startup and exits immediately if the key is missing.
  - Check 2: Is the path correct? Verify the `args` array in your MCP config points to the actual built file: `packages/benji-mcp/dist/index.js` (relative to repo root). Use an absolute path.
  - Check 3: Is the package built? Run `pnpm --filter benji-mcp build` (or `pnpm build` for all packages). Check that `packages/benji-mcp/dist/index.js` exists.
  - Check 4: Is Node.js available? The `command` in MCP config should be `node` (not `npx`, not `pnpm`). Make sure Node.js >= 20.19.0 is on the PATH.

  **"Server starts but tools return errors"**:
  - The API key is present but may be invalid. The server starts successfully (you'll see "benji-mcp server started" on stderr) but every tool call returns an auth error.
  - Check the tool response for `HTTP_401` code.
  - Generate a fresh API key at https://app.benji.so/settings.

  **"MCP client can't connect"**:
  - Cursor IDE: check `~/.cursor/mcp.json` syntax (must be valid JSON). Restart Cursor after config changes.
  - Claude Code: check `.claude/settings.json` or `~/.claude/settings.json`. The `mcpServers` key must be at the top level.
  - Claude Desktop: check `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS).
  - Verify manually: run `BENJI_API_KEY=your-key node /absolute/path/to/packages/benji-mcp/dist/index.js` in a terminal. You should see "benji-mcp server started" on stderr. Press Ctrl+C to stop.

  **"Stdio communication issues"**:
  - The MCP server uses stdio transport. It reads JSON-RPC from stdin and writes responses to stdout. The "benji-mcp server started" message goes to stderr specifically to avoid corrupting the stdio channel.
  - If you see garbled output, ensure nothing else is writing to stdout in the server process (no `console.log` in tool code -- use `console.error` for debug logging).

- [x] **F.2** Write the **CLI Troubleshooting** section with these scenarios:

  **"`benji: command not found`"**:
  - The CLI binary is `benji` but it requires either: (a) global linking (`pnpm link --global` from `packages/benji-cli`), or (b) running directly via `node packages/benji-cli/dist/index.js`.
  - Make sure the CLI is built: `pnpm --filter benji-cli build`.
  - For development, use `pnpm --filter benji-cli dev -- todos list --screen today` (the `--` separates pnpm args from CLI args).

  **"Auth errors on every command"**:
  - `BENJI_API_KEY` must be exported in the current shell session. Setting it in a different terminal or in a file that hasn't been sourced won't work.
  - Quick test: `BENJI_API_KEY=your-key benji todos list --screen today`
  - Permanent: add `export BENJI_API_KEY=your-key` to your shell profile (`~/.bashrc`, `~/.zshrc`).

  **"--json and --compact flags not working"**:
  - Global flags (`--json`, `--compact`) must appear after the full subcommand, not before: `benji todos list --screen today --json` (correct) vs `benji --json todos list` (may not work as expected).
  - These flags are added to all leaf commands automatically by `addGlobalOptionsToLeaves()`.

  **"Delete commands fail without --force"**:
  - All delete operations require `--force` as a safety measure: `benji todos delete <id> --force`.
  - Without `--force`, the CLI prints a confirmation prompt message and exits.

  **"Error output goes to stderr, not stdout"**:
  - By design, all error output goes to stderr and the process exits with code 1.
  - In human mode: `Error [<status>] <code>: <message>` with issue bullet points.
  - In JSON mode: `{"error":{"code":"...","status":...,"message":"..."}}` on stderr.
  - Successful output goes to stdout. This separation allows `benji todos list --json 2>/dev/null | jq .` to process only successful results.

### Task Group G: Cross-references and final review (AC: #10)

- [x] **G.1** Add a **Getting Help** section at the end with:
  - Link back to README.md for setup and configuration
  - Link to CLAUDE.md for AI assistant conventions
  - Link to the error classes source (`packages/benji-sdk/src/errors.ts`) for developers who want to understand the error hierarchy
  - GitHub issues link for bugs

- [x] **G.2** Add a link from the existing README.md's environment variables section to TROUBLESHOOTING.md (a single line: "For detailed troubleshooting, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md)."). This is the only modification to README.md.

- [x] **G.3** Review the complete TROUBLESHOOTING.md for:
  - Placeholder text (`TODO`, `TBD`, `{{`)
  - Error messages that don't match the actual source code in `errors.ts`, `wrapper.ts`, `env.ts`, `error-handler.ts`, `util.ts`
  - File paths that don't exist in the repo
  - Consistency in formatting (all code blocks use correct language tags, all error codes in backticks)

- [x] **G.4** Verify `pnpm build` still succeeds (markdown files don't affect build, but confirm no accidental changes to source files).

## Parallelizable Work Groups

| Group | Tasks | Depends on | Notes |
|-------|-------|------------|-------|
| **GA** | A.1 (scaffold) | Nothing | Creates the file; must go first. |
| **GB** | B.1, B.2 | GA | Env var details. |
| **GC** | C.1 | GA | Error code reference table. |
| **GD** | D.1 | GA | Auth error scenarios. |
| **GE** | E.1, E.2, E.3 | GA | Network, validation, server errors. |
| **GF** | F.1, F.2 | GA | Package-specific troubleshooting. |
| **GG** | G.1, G.2, G.3, G.4 | GB, GC, GD, GE, GF | Cross-references and final validation. |

**Key parallelization opportunity:** After GA creates the file, groups GB through GF are fully independent and can be implemented simultaneously. GG is the final validation gate.

## Dev Notes

### This is a documentation-only story

No application code is written or modified. The primary deliverable is a new file: `/TROUBLESHOOTING.md` at the project root. A single line is added to `/README.md` linking to it.

### What NOT to duplicate

The README.md already has:
- Basic env var table (two rows)
- MCP config snippets for Cursor/Claude Code/Claude Desktop
- CLI example commands and global flags

The CLAUDE.md already has:
- Error class hierarchy description
- `wrapSdkCall()` behavior
- Key file locations

TROUBLESHOOTING.md should reference these files, not duplicate their content. Its focus is: "something went wrong, how do I fix it?"

### Error message accuracy

All error messages in the troubleshooting guide MUST be verified against the actual source code:

| Source file | Error messages to verify |
|---|---|
| `packages/benji-sdk/src/env.ts` | "BENJI_API_KEY environment variable is required. Get your API key from https://app.benji.so/settings" |
| `packages/benji-sdk/src/wrapper.ts` | "Network request failed", "API returned no data and no error" |
| `packages/benji-sdk/src/errors.ts` | Error class names: `BenjiError`, `BenjiConfigError`, `BenjiApiError` |
| `packages/benji-mcp/src/index.ts` | "benji-mcp server started", "Failed to initialize from environment:" |
| `packages/benji-mcp/src/tools/util.ts` | `UNKNOWN_ERROR` code for non-BenjiApiError errors |
| `packages/benji-cli/src/error-handler.ts` | `CONFIG_ERROR` code, `UNEXPECTED_ERROR` code, "Example: BENJI_API_KEY=your-key benji todos list" |

### File map

| File | Action | Purpose |
|------|--------|---------|
| `/TROUBLESHOOTING.md` | **Create** | Dedicated troubleshooting and env var guide |
| `/README.md` | **Modify** (one line) | Add link to TROUBLESHOOTING.md in env vars section |
| `packages/benji-sdk/src/errors.ts` | Read-only reference | Error class hierarchy |
| `packages/benji-sdk/src/wrapper.ts` | Read-only reference | Error wrapping logic and codes |
| `packages/benji-sdk/src/env.ts` | Read-only reference | Env var reading and validation |
| `packages/benji-mcp/src/index.ts` | Read-only reference | MCP startup error handling |
| `packages/benji-mcp/src/tools/util.ts` | Read-only reference | MCP tool error formatting |
| `packages/benji-cli/src/error-handler.ts` | Read-only reference | CLI error formatting |
| `packages/benji-cli/src/auth.ts` | Read-only reference | CLI auth initialization |

### Project Structure Notes

- Monorepo uses pnpm workspaces defined in `pnpm-workspace.yaml` with `packages/*` glob
- Root `package.json` has workspace-level scripts: `build` (recursive), `clean` (recursive), `generate` (SDK only)
- ESM-only throughout (`"type": "module"` in all package.json files)
- TypeScript 5.5+ with bundler moduleResolution
- Node.js >=20.19.0, pnpm >=9

### Learnings from Stories 7.1 and 7.2

- Story 7.1 review caught 4 inaccuracies (wrong URL defaults, wrong clone URL). Every error message and file path in TROUBLESHOOTING.md must be verified against actual source code.
- Story 7.2 established that CLAUDE.md and README.md serve different audiences. TROUBLESHOOTING.md serves yet a third purpose: helping developers diagnose and fix problems. It should be organized by symptom/error, not by architecture.
- Both stories completed in single-pass implementations. This story should follow the same pattern.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 7.3] -- Epic definition: "documentation for all env vars and common error troubleshooting"
- [Source: _bmad-output/planning-artifacts/epics.md#FR18] -- FR18: "Environment variable and troubleshooting docs"
- [Source: _bmad-output/sprint-artifacts/7-1-readme-and-mcp-usage-docs.md] -- Story 7.1 (README with basic env var table)
- [Source: _bmad-output/sprint-artifacts/7-2-claude-md-and-config-snippets.md] -- Story 7.2 (CLAUDE.md with error hierarchy)
- [Source: packages/benji-sdk/src/errors.ts] -- `BenjiError`, `BenjiConfigError`, `BenjiApiError` class definitions
- [Source: packages/benji-sdk/src/wrapper.ts] -- `wrapSdkCall()` error normalization: network errors (status 0), API errors (status from response), empty responses
- [Source: packages/benji-sdk/src/env.ts] -- `initializeFromEnv()` reads `BENJI_API_KEY` (required) and `BENJI_BASE_URL` (optional)
- [Source: packages/benji-sdk/src/index.ts] -- `configure()` sets `x-api-key` header and `baseUrl` (default: `https://app.benji.so/api/rest`)
- [Source: packages/benji-mcp/src/index.ts] -- MCP startup: `initializeFromEnv()` -> `createServer()` -> stdio transport, stderr "benji-mcp server started"
- [Source: packages/benji-mcp/src/tools/util.ts] -- `handleToolError()`: `BenjiApiError` -> `{code, message, issues}` with `isError: true`; other errors -> `{code: "UNKNOWN_ERROR", message}`
- [Source: packages/benji-cli/src/error-handler.ts] -- `handleCommandError()`: `BenjiConfigError` -> `CONFIG_ERROR`, `BenjiApiError` -> formatted with status/code/message/issues, other -> `UNEXPECTED_ERROR`
- [Source: packages/benji-cli/src/auth.ts] -- `ensureAuth()` wraps `initializeFromEnv()` and delegates errors to `handleCommandError()`

## Definition of Done

- [x] All acceptance criteria (AC-1 through AC-10) satisfied
- [x] `/TROUBLESHOOTING.md` exists at project root with all required sections
- [x] `/README.md` has a link to TROUBLESHOOTING.md in the env vars section
- [x] All error messages in the guide match the actual source code
- [x] No placeholder text or broken file references in the document
- [x] `pnpm build` still passes
- [x] Story status advanced via team workflow (`in-progress` -> `review` -> `done`)
- [x] `sprint-status.yaml` updated when story completes

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

None required (documentation-only story).

### Completion Notes List

- All error messages verified against source: `env.ts`, `wrapper.ts`, `errors.ts`, `error-handler.ts`, `util.ts`, MCP `index.ts`, CLI `auth.ts`
- Zero placeholder text (grep for TODO/TBD/{{ returned no matches)
- All referenced file paths verified to exist on disk
- `pnpm build` passes cleanly
- README.md modified with exactly one line linking to TROUBLESHOOTING.md

### Senior Developer Review (AI)

**Review result:** CHANGES_REQUESTED (6 findings, all resolved)

| ID | Severity | Category | Fix Applied |
|----|----------|----------|-------------|
| F1 | HIGH | ACCURACY | Fixed error code derivation — API code used first, fallback to HTTP_${status} (AC-9) |
| F2 | HIGH | ACCURACY | Added "Unexpected error:" human-mode format for UNEXPECTED_ERROR (AC-8) |
| F3 | MEDIUM | ACCURACY | Added "Failed to initialize from environment:" error path to MCP troubleshooting (AC-7) |
| F4 | MEDIUM | PROCESS | Sprint status sync handled during final update |
| F5 | MEDIUM | ACCURACY | Added "API request failed with status N" fallback message docs (AC-10) |
| F6 | LOW | FORMATTING | Renamed ToC anchor to avoid leading dashes (AC-1) |

### Review Follow-ups (AI)

- [x] F1: Fix error code derivation description
- [x] F2: Add UNEXPECTED_ERROR human format
- [x] F3: Add MCP init failure error path
- [x] F4: Sprint status synced
- [x] F5: Add API fallback message docs
- [x] F6: Fix ToC anchor

### File List

| File | Action | Notes |
|------|--------|-------|
| `/TROUBLESHOOTING.md` | Created | Full troubleshooting guide with all sections per AC-1 through AC-9 |
| `/README.md` | Modified | Added one line linking to TROUBLESHOOTING.md in Environment Variables section |
| `_bmad-output/sprint-artifacts/sprint-status.yaml` | Modified | Story status updates |

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-03-29 | Initial implementation — all 14 tasks completed | Dev Agent |
| 2026-03-29 | Review fixes — 6 corrections applied (F1-F6) | Orchestrator |
