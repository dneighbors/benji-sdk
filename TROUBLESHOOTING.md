# Troubleshooting Guide

This guide covers environment variable configuration, error codes, and common problems across all three Benji SDK packages (SDK, MCP server, CLI). It is organized by symptom so you can find solutions quickly.

For setup instructions, see [README.md](README.md). For AI assistant conventions, see [CLAUDE.md](CLAUDE.md).

## Table of Contents

- [Environment Variables](#environment-variables)
  - [BENJI_API_KEY (required)](#benji_api_key-required)
  - [BENJI_BASE_URL (optional)](#benji_base_url-optional)
  - [Which Packages Read Which Variables](#which-packages-read-which-variables)
- [Error Code Reference](#error-code-reference)
- [Authentication Errors](#authentication-errors)
  - [Missing API Key](#missing-api-key)
  - [Invalid API Key](#invalid-api-key)
- [Network Errors](#network-errors)
- [Validation Errors](#validation-errors)
- [Not Found and Server Errors](#not-found-and-server-errors)
- [MCP Server Troubleshooting](#mcp-server-troubleshooting)
  - [Server Won't Start](#server-wont-start)
  - [Server Starts but Tools Return Errors](#server-starts-but-tools-return-errors)
  - [MCP Client Can't Connect](#mcp-client-cant-connect)
  - [Stdio Communication Issues](#stdio-communication-issues)
- [CLI Troubleshooting](#cli-troubleshooting)
  - [benji: command not found](#benji-command-not-found)
  - [Auth Errors on Every Command](#auth-errors-on-every-command)
  - [JSON and Compact Flags Not Working](#json-and-compact-flags-not-working)
  - [Delete Commands Fail Without --force](#delete-commands-fail-without---force)
  - [Error Output Goes to stderr, Not stdout](#error-output-goes-to-stderr-not-stdout)
- [Getting Help](#getting-help)

## Environment Variables

### BENJI_API_KEY (required)

**Purpose:** Authenticates all API requests to the Benji API.

**Where to get it:** <https://app.benji.so/settings>

**How it flows through the system:**

1. `initializeFromEnv()` reads `process.env.BENJI_API_KEY`
2. Calls `configure({ apiKey })` (defined in `packages/benji-sdk/src/index.ts`)
3. `configure()` sets the `x-api-key` header on all outgoing HTTP requests

**How to set it:**

```bash
# In your shell (temporary, current session only)
export BENJI_API_KEY=your-key

# In your shell profile (permanent)
echo 'export BENJI_API_KEY=your-key' >> ~/.bashrc  # or ~/.zshrc

# In MCP config (Cursor, Claude Code, Claude Desktop)
{
  "mcpServers": {
    "benji": {
      "command": "node",
      "args": ["/path/to/packages/benji-mcp/dist/index.js"],
      "env": {
        "BENJI_API_KEY": "your-key"
      }
    }
  }
}

# Inline for a single CLI command
BENJI_API_KEY=your-key benji todos list --screen today
```

**What happens when missing:** `initializeFromEnv()` throws a `BenjiConfigError` with this exact message:

```text
BENJI_API_KEY environment variable is required. Get your API key from https://app.benji.so/settings
```

**What happens when invalid:** No error at startup. The API key is not validated until the first API request, which returns a `401` status with error code `HTTP_401`.

### BENJI_BASE_URL (optional)

**Purpose:** Override the API base URL for self-hosted Benji instances or development/staging environments.

**Default:** `https://alpha.benji.so/api/rest`

**When to use:** Only set this if you are running a self-hosted Benji instance or connecting to a development/staging environment. Most users do not need this.

**Format:** Full URL with protocol, no trailing slash.

```bash
# Correct
export BENJI_BASE_URL="https://my-instance.com/api/rest"

# Wrong -- missing protocol
export BENJI_BASE_URL="my-instance.com/api/rest"

# Wrong -- trailing slash
export BENJI_BASE_URL="https://my-instance.com/api/rest/"
```

**How it flows through the system:**

1. `initializeFromEnv()` reads `process.env.BENJI_BASE_URL` (may be `undefined`)
2. Passes it to `configure({ apiKey, baseUrl })`
3. `configure()` uses `options.baseUrl ?? "https://alpha.benji.so/api/rest"` as the base for all API request URLs

If `BENJI_BASE_URL` is not set, the default `https://alpha.benji.so/api/rest` is used automatically.

### Which Packages Read Which Variables

All three packages use the same environment variables through the same code path:

| Package | How it reads env vars | When |
|---------|----------------------|------|
| **benji-sdk** | Exports `initializeFromEnv()` from `packages/benji-sdk/src/env.ts`. Can also be configured directly via `configure()` without env vars. | When the consumer calls `initializeFromEnv()` |
| **benji-mcp** | Calls `initializeFromEnv()` at startup in `packages/benji-mcp/src/index.ts`. Exits immediately if `BENJI_API_KEY` is missing. | At process startup, before the MCP server connects |
| **benji-cli** | Calls `initializeFromEnv()` via `ensureAuth()` in `packages/benji-cli/src/auth.ts` before each command. | Before every CLI command executes |

## Error Code Reference

Every error thrown by the SDK is a `BenjiApiError` (for API/network errors) or `BenjiConfigError` (for missing configuration). Each carries a `code` field. The CLI also uses `CONFIG_ERROR` and `UNEXPECTED_ERROR` codes in its error handler.

| Code | HTTP Status | Meaning | Common Causes | Resolution |
|------|-------------|---------|---------------|------------|
| `CONFIG_ERROR` | N/A | Missing required configuration | `BENJI_API_KEY` not set in the environment | Set the environment variable (see [BENJI_API_KEY](#benji_api_key-required)) |
| `NETWORK_ERROR` | 0 | Cannot reach the Benji API | DNS failure, no internet, wrong `BENJI_BASE_URL`, firewall blocking HTTPS | Check connectivity, verify URL (see [Network Errors](#network-errors)) |
| `HTTP_400` | 400 | Request validation failed | Missing required fields, invalid date formats, bad enum values | Check the `issues` array for specifics (see [Validation Errors](#validation-errors)) |
| `HTTP_401` | 401 | Authentication failed | Invalid, expired, or revoked API key | Get a new key from [app.benji.so/settings](https://app.benji.so/settings) |
| `HTTP_404` | 404 | Resource not found | Invalid ID, deleted resource, typo in ID | List resources first to find valid IDs |
| `HTTP_500` | 500 | Benji server error | Server-side issue | Retry later, check [benji.so](https://benji.so) status |
| `EMPTY_RESPONSE` | 2xx | No data in response body | Possible API version mismatch | Rebuild the SDK (`pnpm --filter benji-sdk build`), check API spec |
| `UNKNOWN_ERROR` | N/A | Unrecognized error (MCP) | Bug in error handling or unexpected exception type | Report as issue with full error output |
| `UNEXPECTED_ERROR` | N/A | Unrecognized error (CLI) | Bug in error handling or unexpected exception type | Report as issue with full error output |

**Where these codes come from in source:**

- `CONFIG_ERROR` -- assigned by `handleCommandError()` in `packages/benji-cli/src/error-handler.ts` when the error is a `BenjiConfigError`
- `NETWORK_ERROR` -- assigned by `wrapSdkCall()` in `packages/benji-sdk/src/wrapper.ts` when the network request promise rejects (status 0)
- `HTTP_400`, `HTTP_401`, `HTTP_404`, `HTTP_500` -- the API response's own `code` field is used if present; otherwise `wrapSdkCall()` in `packages/benji-sdk/src/wrapper.ts` derives the code from the HTTP status using the pattern `` `HTTP_${status}` ``
- `EMPTY_RESPONSE` -- assigned by `wrapSdkCall()` when `data` is `undefined` and there is no error
- `UNKNOWN_ERROR` -- assigned by `handleToolError()` in `packages/benji-mcp/src/tools/util.ts` for non-`BenjiApiError` exceptions
- `UNEXPECTED_ERROR` -- assigned by `handleCommandError()` in `packages/benji-cli/src/error-handler.ts` for non-`BenjiConfigError`, non-`BenjiApiError` exceptions

## Authentication Errors

### Missing API Key

This is the most common error. It means `BENJI_API_KEY` is not set in the current environment.

**How it appears in each package:**

**SDK** -- throws `BenjiConfigError`:

```text
BenjiConfigError: BENJI_API_KEY environment variable is required. Get your API key from https://app.benji.so/settings
```

**MCP server** -- prints the error message to stderr and exits with code 1:

```text
BENJI_API_KEY environment variable is required. Get your API key from https://app.benji.so/settings
```

The MCP client (Cursor, Claude Code, Claude Desktop) will show a connection failure because the server process exited.

**CLI (human mode)** -- prints to stderr and exits with code 1:

```text
Error: BENJI_API_KEY environment variable is required. Get your API key from https://app.benji.so/settings
Example: BENJI_API_KEY=your-key benji todos list
```

**CLI (JSON mode with `--json`)** -- prints to stderr and exits with code 1:

```json
{"error":{"code":"CONFIG_ERROR","message":"BENJI_API_KEY environment variable is required. Get your API key from https://app.benji.so/settings"}}
```

**Resolution:**

1. Get your API key from <https://app.benji.so/settings>
2. Set it using one of these methods:
   - Shell: `export BENJI_API_KEY=your-key`
   - Shell profile: add `export BENJI_API_KEY=your-key` to `~/.bashrc` or `~/.zshrc`
   - MCP config: add it in the `env` block of your MCP server configuration (see [README.md](README.md#mcp-server-setup))

### Invalid API Key

An invalid API key is **not** caught at startup. The `initializeFromEnv()` function only checks whether the variable is set, not whether the value is valid. The error occurs on the first API call, when the server returns HTTP 401.

**How it appears in each package:**

**MCP server** -- the tool returns an error response with `isError: true`:

```json
{"code":"HTTP_401","message":"..."}
```

**CLI (human mode)**:

```text
Error [401] HTTP_401: <message from API>
```

**CLI (JSON mode with `--json`)**:

```json
{"error":{"code":"HTTP_401","status":401,"message":"..."}}
```

**Resolution:**

1. Verify your key at <https://app.benji.so/settings>
2. If the key has been revoked or expired, generate a new one
3. Make sure you copied the full key without extra whitespace

## Network Errors

**Symptom:** Error with code `NETWORK_ERROR` and status `0`.

This means the HTTP request never reached the Benji API or no response was received.

**How it happens in the code:**

In `wrapSdkCall()` (`packages/benji-sdk/src/wrapper.ts`), when the SDK promise rejects (as opposed to returning `{ data, error, response }`), the error is caught and wrapped:

```text
BenjiApiError { status: 0, code: "NETWORK_ERROR", message: "<original error message>" }
```

If the original error has no message, the fallback is `"Network request failed"`. For non-network API errors with no message, the fallback is `"API request failed with status <N>"`.

**Common causes:**

- No internet connection
- DNS resolution failure (cannot resolve `app.benji.so`)
- `BENJI_BASE_URL` set to a wrong host or unreachable URL
- Firewall or proxy blocking outbound HTTPS connections
- The Benji API is temporarily down

**Diagnostic steps:**

```bash
# Test connectivity to the default API endpoint
curl -I https://alpha.benji.so/api/rest

# If using a custom base URL, test that instead
curl -I $BENJI_BASE_URL

# Check DNS resolution
nslookup app.benji.so
```

**How it appears in MCP vs CLI:**

The error code is the same (`NETWORK_ERROR`) in both packages. The formatting differs:

- MCP: `{"code":"NETWORK_ERROR","message":"..."}`
- CLI (human): `Error [0] NETWORK_ERROR: <message>`
- CLI (JSON): `{"error":{"code":"NETWORK_ERROR","status":0,"message":"..."}}`

## Validation Errors

**Symptom:** Error with code `HTTP_400` and an `issues` array.

This means the API rejected the request because one or more fields failed validation.

**How to read the issues array:**

Each entry in the `issues` array has a `message` field that explains what is wrong. For example:

```json
{
  "code": "HTTP_400",
  "message": "Validation failed",
  "issues": [
    { "message": "screen is required" },
    { "message": "Invalid date format, expected YYYY-MM-DD" }
  ]
}
```

**Common validation failures:**

| Scenario | Cause | Fix |
|----------|-------|-----|
| Missing `screen` in `list_todos` / `benji todos list` | The `screen` parameter is required for listing todos | Add `--screen today` (CLI) or `"screen": "today"` (MCP) |
| Invalid date format | Expected `YYYY-MM-DD` but got something else | Use dates like `2026-03-29` |
| Missing required field | A required field like `title` was omitted when creating a resource | Check the tool/command help for required parameters |
| Invalid enum value | A field like `priority` received a value that is not in the allowed set | Check the API spec or tool description for valid values |

**How issues appear in MCP:**

```json
{"code":"HTTP_400","message":"Validation failed","issues":[{"message":"screen is required"}]}
```

The response has `isError: true`.

**How issues appear in CLI (human mode):**

```text
Error [400] HTTP_400: Validation failed
  - screen is required
```

Each issue is printed as a bullet point below the main error message.

**How issues appear in CLI (JSON mode):**

```json
{"error":{"code":"HTTP_400","status":400,"message":"Validation failed","issues":[{"message":"screen is required"}]}}
```

## Not Found and Server Errors

### HTTP 404 -- Resource Not Found

**Symptom:** Error with code `HTTP_404` and status `404`.

This means the resource ID you specified does not exist.

**Common causes:**

- Stale ID from a previous session (the resource was deleted or the ID changed)
- Typo in the ID string
- The resource was deleted by another client

**Resolution:** Use the list command/tool first to find valid IDs:

```bash
# CLI: list resources to find valid IDs
benji todos list --screen today
benji habits list --date-from 2026-03-01 --date-to 2026-03-31

# Then use a valid ID
benji todos update <valid-id> --title "Updated title"
```

### HTTP 500 -- Server Error

**Symptom:** Error with code `HTTP_500` and status `500`.

This is a Benji server-side error, not a problem with your code or configuration.

**Resolution:**

1. Wait a moment and retry the request
2. Check [benji.so](https://benji.so) for service status
3. If the error persists, report it as a bug

### EMPTY_RESPONSE -- No Data

**Symptom:** Error with code `EMPTY_RESPONSE`.

This means the API returned a 2xx success status but the response body contained no data. This is rare and may indicate an API version mismatch between the SDK and the server.

**Resolution:**

1. Rebuild the SDK: `pnpm --filter benji-sdk build`
2. Rebuild dependent packages: `pnpm build`
3. If the problem persists, the OpenAPI spec may need regenerating: `pnpm --filter benji-sdk generate`

## MCP Server Troubleshooting

### Server Won't Start

**Check 1: Is `BENJI_API_KEY` set?**

The MCP server calls `initializeFromEnv()` at startup (`packages/benji-mcp/src/index.ts`). If `BENJI_API_KEY` is not set, it prints the error to stderr and exits with code 1:

```text
BENJI_API_KEY environment variable is required. Get your API key from https://app.benji.so/settings
```

Make sure the `env` block in your MCP config includes `BENJI_API_KEY`.

If you see `Failed to initialize from environment: ...` on stderr, this indicates an unexpected error during SDK initialization. Check the message for details.

**Check 2: Is the path correct?**

The `args` array in your MCP config must point to the built file. Use an absolute path:

```json
"args": ["/absolute/path/to/benji-sdk/packages/benji-mcp/dist/index.js"]
```

A relative path or wrong path will cause a "module not found" error.

**Check 3: Is the package built?**

Run the build and verify the output file exists:

```bash
pnpm --filter benji-mcp build
ls packages/benji-mcp/dist/index.js
```

If `dist/index.js` does not exist, the build failed. Run `pnpm build` from the repo root to build all packages in the correct order.

**Check 4: Is Node.js available?**

The `command` in your MCP config should be `node` (not `npx`, not `pnpm`). Make sure Node.js >= 20.19.0 is on the system PATH that the MCP client uses.

### Server Starts but Tools Return Errors

If the server starts successfully (you see `benji-mcp server started` on stderr) but every tool call returns an error, the API key is likely invalid.

- Look for `HTTP_401` in the tool response
- Generate a fresh API key at <https://app.benji.so/settings>
- Update the `env` block in your MCP config and restart the server

### MCP Client Can't Connect

**Cursor IDE:**

- Config file: `~/.cursor/mcp.json`
- Must be valid JSON (check for trailing commas, missing quotes)
- Restart Cursor after changing the config

**Claude Code:**

- Config file: `.claude/settings.json` (project-level) or `~/.claude/settings.json` (global)
- The `mcpServers` key must be at the top level of the JSON object

**Claude Desktop:**

- Config file: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)

**Manual verification:**

Run the server directly in a terminal to check if it starts:

```bash
BENJI_API_KEY=your-key node /absolute/path/to/packages/benji-mcp/dist/index.js
```

You should see `benji-mcp server started` on stderr. Press Ctrl+C to stop.

If it prints an error instead, fix that error first before troubleshooting the MCP client connection.

### Stdio Communication Issues

The MCP server uses stdio transport. It reads JSON-RPC messages from stdin and writes responses to stdout. The startup message `benji-mcp server started` goes to stderr specifically to avoid corrupting the stdio channel.

If you see garbled output or the client reports protocol errors:

- Make sure nothing else is writing to stdout in the server process
- Use `console.error` (not `console.log`) for any debug logging in tool code
- Check that no shell startup scripts (`.bashrc`, `.zshrc`) print output that could interfere with stdio

## CLI Troubleshooting

### benji: command not found

The CLI binary is `benji` but it requires either:

1. **Direct execution** (recommended for development):
   ```bash
   node packages/benji-cli/dist/index.js todos list --screen today
   ```

2. **pnpm dev mode**:
   ```bash
   pnpm --filter benji-cli dev -- todos list --screen today
   ```
   Note: the `--` separates pnpm args from CLI args.

3. **Global linking** (makes `benji` available system-wide):
   ```bash
   cd packages/benji-cli && pnpm link --global
   ```

Make sure the CLI is built first:

```bash
pnpm --filter benji-cli build
```

### Auth Errors on Every Command

`BENJI_API_KEY` must be exported in the current shell session. Setting it in a different terminal window or in a file that has not been sourced will not work.

**Quick test:**

```bash
BENJI_API_KEY=your-key benji todos list --screen today
```

**Permanent setup:**

Add `export BENJI_API_KEY=your-key` to your shell profile (`~/.bashrc` or `~/.zshrc`), then reload:

```bash
source ~/.bashrc  # or source ~/.zshrc
```

### JSON and Compact Flags Not Working

The `--json` and `--compact` flags must appear **after** the full subcommand, not before it:

```bash
# Correct
benji todos list --screen today --json

# May not work as expected
benji --json todos list --screen today
```

These flags are added to all leaf commands automatically by `addGlobalOptionsToLeaves()` in `packages/benji-cli/src/commands/index.ts`.

### Delete Commands Fail Without --force

All delete operations require `--force` as a safety measure:

```bash
# This will fail
benji todos delete abc123

# This works
benji todos delete abc123 --force
```

Without `--force`, the CLI prints an error and exits with code 1:

```text
Error: --force is required for delete. Example: benji todos delete <id> --force
```

### Error Output Goes to stderr, Not stdout

By design, all error output goes to stderr and the process exits with code 1. Successful output goes to stdout. This separation allows you to process only successful results:

```bash
# Pipe only successful output to jq, errors still visible on terminal
benji todos list --screen today --json 2>/dev/null | jq .
```

**Error formats:**

In human mode (default):

```text
Error [<status>] <code>: <message>
  - <issue message>
  - <issue message>
```

In JSON mode (`--json`):

```json
{"error":{"code":"...","status":...,"message":"..."}}
```

For config errors in human mode:

```text
Error: <message>
Example: BENJI_API_KEY=your-key benji todos list
```

For config errors in JSON mode:

```json
{"error":{"code":"CONFIG_ERROR","message":"..."}}
```

For unexpected errors (non-Benji exceptions) in human mode:

```text
Unexpected error: <message>
```

For unexpected errors in JSON mode:

```json
{"error":{"code":"UNEXPECTED_ERROR","message":"..."}}
```

## Getting Help

- **Setup and configuration:** [README.md](README.md) -- installation, build steps, MCP config snippets, CLI usage examples
- **AI assistant conventions:** [CLAUDE.md](CLAUDE.md) -- error class hierarchy, `wrapSdkCall()` behavior, architecture constraints, key file locations
- **Error class source code:** [`packages/benji-sdk/src/errors.ts`](packages/benji-sdk/src/errors.ts) -- `BenjiError`, `BenjiConfigError`, `BenjiApiError` class definitions
- **Bug reports:** [GitHub Issues](https://github.com/dneighbors/benji-sdk/issues)
