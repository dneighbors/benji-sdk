# CLAUDE.md

## Project Overview

pnpm monorepo with three packages:
- **benji-sdk** -- Auto-generated TypeScript SDK for the Benji API (personal life OS). Generated from an OpenAPI spec via `@hey-api/openapi-ts`.
- **benji-mcp** -- MCP server exposing 19 resource domains (113 tools) over stdio transport.
- **benji-cli** -- Commander.js CLI mirroring all 19 domains with `benji <resource> <action> [options]` structure.

Both `benji-mcp` and `benji-cli` depend on `benji-sdk` via `workspace:*`.

## Commands

```
pnpm install                         # Install all dependencies
pnpm build                           # Build all packages (SDK generate + compile, then MCP + CLI)
pnpm --filter benji-sdk build        # Rebuild SDK only (generate + fix-imports + tsc)
pnpm --filter benji-mcp build        # Rebuild MCP server only (tsc)
pnpm --filter benji-cli build        # Rebuild CLI only (tsc)
pnpm --filter benji-mcp dev          # Run MCP server in dev mode (tsx, no build needed)
pnpm --filter benji-cli dev          # Run CLI in dev mode (tsx, no build needed)
pnpm generate                        # Regenerate SDK from openapi.json (runs in benji-sdk)
```

## Code Generation (Do Not Edit)

The SDK at `packages/benji-sdk/` uses `@hey-api/openapi-ts` to auto-generate TypeScript client code from `packages/benji-sdk/openapi.json`.

**Never hand-edit any file under `packages/benji-sdk/src/client/`** -- the entire directory tree is auto-generated (both `*.gen.ts` files and `index.ts` barrel re-exports).

After generation, `fix-imports.mjs` adds `.js` extensions to relative imports for ESM compatibility.

**To regenerate:** update `openapi.json`, then run `pnpm --filter benji-sdk build` (runs `generate` -> `fix-imports` -> `tsc`).

**Generation config:** `packages/benji-sdk/openapi-ts.config.ts`

**Hand-maintained SDK files (safe to edit):**
- `packages/benji-sdk/src/index.ts` -- public API entry, `configure()`, re-exports
- `packages/benji-sdk/src/env.ts` -- `initializeFromEnv()` reads `BENJI_API_KEY` and `BENJI_BASE_URL`
- `packages/benji-sdk/src/errors.ts` -- `BenjiError`, `BenjiConfigError`, `BenjiApiError`
- `packages/benji-sdk/src/wrapper.ts` -- `wrapSdkCall()` normalizes `{ data, error, response }` into data or throws
- `packages/benji-sdk/fix-imports.mjs` -- post-generation ESM import fixer
- `packages/benji-sdk/openapi-ts.config.ts` -- `@hey-api/openapi-ts` config

## Architecture Constraints

- **pnpm workspace monorepo:** `packages/*` defined in `pnpm-workspace.yaml`
- **Dependency direction:** `benji-mcp` and `benji-cli` depend on `benji-sdk` via `workspace:*`. Import public exports only -- never reach into `src/client/` internals.
- **Auth:** always via `BENJI_API_KEY` env var. Both MCP and CLI call `initializeFromEnv()` from `benji-sdk`, which reads the env var and calls `configure()`.
- **Optional `BENJI_BASE_URL`** env var overrides the default API base (`https://alpha.benji.so/api/rest`).
- **All API calls go through `wrapSdkCall()`** which normalizes the `{ data, error, response }` tuple from `@hey-api/openapi-ts` into data on success or throws `BenjiApiError` on failure. Network errors are also caught and wrapped with status 0.
- **Error hierarchy:** `BenjiError` (base) -> `BenjiConfigError` (missing API key), `BenjiApiError` (API errors with `status`, `code`, `message`, `issues`).
- **MCP server:** stdio transport exclusively. No HTTP, no SSE.
- **CLI:** Commander.js with two-level commands: `benji <resource> <action> [options]`. Global `--json` and `--compact` flags on all leaf commands.

## TypeScript & Module Conventions

- **ESM-only:** all `package.json` files have `"type": "module"`
- **All local imports require `.js` extension:** `import { foo } from "./bar.js"` (not `./bar` or `./bar.ts`)
- **TypeScript strict mode** enabled in all packages
- **Compiler target:** ES2020, **module:** ESNext, **moduleResolution:** bundler
- **Each package has its own `tsconfig.json`** -- no root tsconfig
- **Node.js >= 20.19.0, pnpm >= 9**

## Key File Locations

**Root:**
- `package.json` -- workspace scripts (`build`, `clean`, `generate`)
- `pnpm-workspace.yaml` -- workspace config (`packages/*`)
- `README.md` -- human-facing docs
- `CLAUDE.md` -- this file

**benji-sdk:**
- `openapi.json` -- API spec (input to codegen)
- `openapi-ts.config.ts` -- codegen config
- `fix-imports.mjs` -- post-generation ESM import fixer
- `src/index.ts` -- public entry, `configure()`, re-exports all generated + hand-maintained code
- `src/env.ts` -- `initializeFromEnv()` reads env vars
- `src/errors.ts` -- `BenjiError`, `BenjiConfigError`, `BenjiApiError`
- `src/wrapper.ts` -- `wrapSdkCall()` normalizes SDK responses
- `src/client/` -- entirely generated (do not edit)

**benji-mcp:**
- `src/index.ts` -- entry point, stdio transport setup
- `src/server.ts` -- `createServer()`, registers all 19 tool domains
- `src/tools/util.ts` -- `toolResult()`, `handleToolError()`, shared Zod schemas (`ymdDateSchema`, `tzDateSchema`)
- `src/tools/<domain>.ts` -- one file per resource domain (kebab-case filenames)

**benji-cli:**
- `src/index.ts` -- entry point, Commander program setup
- `src/commands/index.ts` -- `registerCommands()`, `addGlobalOptionsToLeaves()` adds `--json`/`--compact` to all leaf commands
- `src/commands/<domain>.ts` -- one file per resource domain (kebab-case filenames)
- `src/commands/shared.ts` -- `readStdin()`, `requireForce()`, `parseNumber()`, `parseDate()`, `toTzDate()`, `toYmdDate()`, `parseCommaSeparated()`
- `src/output.ts` -- `getGlobalOptions()`, `outputResult()`, `isJsonMode()`
- `src/formatters.ts` -- table, key-value, and success message formatters
- `src/error-handler.ts` -- `handleCommandError()` with JSON/human output modes
- `src/auth.ts` -- `ensureAuth()` wraps `initializeFromEnv()`

## Adding a New MCP Tool Domain

1. Create `packages/benji-mcp/src/tools/<domain>.ts` (kebab-case filename).

2. Add imports:
```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { <SdkClass>, wrapSdkCall } from "benji-sdk";
import { toolResult, handleToolError } from "./util.js";
```

3. Export a registration function: `export function register<Domain>Tools(server: McpServer): void { ... }`

4. Register each tool:
```ts
server.registerTool(
  "<action>_<resource>",
  {
    description: "...",
    inputSchema: {
      fieldName: z.string().describe("..."),
    },
  },
  async ({ fieldName }) => {
    try {
      const result = await wrapSdkCall(
        SdkClass.sdkMethod({ body: { fieldName } }),
      );
      return toolResult(result);
    } catch (error) {
      return handleToolError(error);
    }
  },
);
```

`wrapSdkCall()` returns data directly on success and throws `BenjiApiError` on any failure (including network errors). The try/catch pattern shown above is the complete error handling.

5. Tool naming: `<action>_<resource>` in snake_case (e.g., `list_tags`, `create_todo`, `delete_weight_log`).

6. Register in `packages/benji-mcp/src/server.ts`: import the function and call it with the `mcpServer` instance.

7. For date inputs, use shared Zod schemas from `./util.js`:
   - `ymdDateSchema` -- for query/list operations (year, month, day numbers)
   - `tzDateSchema` -- for create/update operations (timezone + dateInUsersTimezone string)

## Adding a New CLI Command Domain

1. Create `packages/benji-cli/src/commands/<domain>.ts` (kebab-case filename).

2. Add imports:
```ts
import { Command } from "commander";
import { wrapSdkCall, <SdkClass> } from "benji-sdk";
import { ensureAuth } from "../auth.js";
import { getGlobalOptions, outputResult } from "../output.js";
import { handleCommandError } from "../error-handler.js";
import { readStdin, requireForce, parseNumber, parseDate, toTzDate, toYmdDate, parseCommaSeparated } from "./shared.js";
```

3. Export a registration function: `export function register<Domain>Command(program: Command): void { ... }`

4. Create a top-level command group:
```ts
const cmd = program.command("<domain>").description("Manage <domain>");
```

5. Add subcommands:
```ts
cmd
  .command("<action>")
  .description("...")
  .option("--flag <value>", "...")
  .action(async (options, command) => {
    ensureAuth();
    const opts = getGlobalOptions(command);
    try {
      const result = await wrapSdkCall(SdkClass.sdkMethod({ body: { ... } }));
      outputResult(result, opts);
    } catch (error) {
      handleCommandError(error);
    }
  });
```

When using `.argument("<id>", "...")`, the action receives the argument first: `.action(async (id, options, command) => { ... })`.

6. For delete commands, add `--force` option and call `requireForce(command, "<domain>", "delete")` before `ensureAuth()`.

7. For boolean fields, use `--flag` / `--no-flag` pairs and check `command.getOptionValueSource("flag") === "cli"` before including in the request body.

8. Support `--stdin` option for JSON input via `readStdin()`.

9. Register in `packages/benji-cli/src/commands/index.ts`: import and call the register function. The `addGlobalOptionsToLeaves` call at the end of `registerCommands` automatically adds `--json` and `--compact` to all leaf commands.

## Testing

No test framework or test scripts are configured. Build verification is the only check: run `pnpm build` and confirm zero TypeScript compilation errors.
