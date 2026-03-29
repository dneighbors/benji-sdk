# Story 6.1: Scaffold CLI Package

Status: done

## Story

As a developer,
I want `packages/benji-cli/` set up with Commander.js and auth from env,
so that I can add commands incrementally.

## Acceptance Criteria

1. **AC-1: `benji --help` shows layered command groups**
   Given `BENJI_API_KEY` is set,
   When I run `benji --help`,
   Then I see a top-level help listing available command groups (e.g. `todos`, `tags`, `projects`) with brief descriptions, plus global options `--json` and `--version`.

2. **AC-2: `benji --version` prints the version**
   When I run `benji --version`,
   Then I see the version string read from `package.json` (e.g. `0.1.0`).

3. **AC-3: Auth via BENJI_API_KEY with actionable error**
   Given `BENJI_API_KEY` is NOT set,
   When I run any command (e.g. `benji todos list`),
   Then the CLI exits with code 1 and prints an actionable error:
   `Error: BENJI_API_KEY environment variable is required. Get your API key from https://app.benji.so/settings`
   `Example: BENJI_API_KEY=your-key benji todos list`

4. **AC-4: Global `--json` flag propagated to commands**
   When I run `benji --json todos list` (or any future command with `--json`),
   Then the global `--json` option is accessible to all subcommand handlers for machine-readable output.

5. **AC-5: Per-resource command stubs with placeholder help**
   When I run `benji todos --help`,
   Then I see resource-specific help with stub subcommands (e.g. `list`, `create`, `update`, `delete`, `toggle`) and copy-pasteable examples.
   This must work for at least `todos` as the proof-of-concept resource; other resources are stubs with `--help` text only.

6. **AC-6: `resource verb` pattern enforced**
   All command stubs follow the predictable `benji <resource> <verb>` pattern (e.g. `benji todos list`, `benji tags list`).

7. **AC-7: Package builds and binary executes**
   When I run `pnpm --filter benji-cli build`,
   Then `dist/index.js` is produced with `#!/usr/bin/env node` shebang, and `node dist/index.js --help` works.

8. **AC-8: Unknown commands produce actionable errors**
   When I run `benji foobar`,
   Then the CLI exits with code 1 and prints an error indicating `foobar` is not a known command, plus suggests running `benji --help`.

9. **AC-9: Non-interactive, no prompts**
   The CLI never presents interactive prompts, arrow-key menus, or timed inputs. All inputs are expressed as flags/arguments. Missing required flags produce immediate error with example invocation.

## Tasks / Subtasks

### Group A — Package Setup (independent, do first)

- [x] **Task 1: Update package.json with dependencies** (AC: 7)
  - [x] 1.1 Add `commander` `^14.0.0` to `dependencies`
  - [x] 1.2 Add `@types/node` `^22.0.0` to `devDependencies`
  - [x] 1.3 Add `tsx` `^4.19.0` to `devDependencies`
  - [x] 1.4 Add scripts: `"dev": "npx tsx src/index.ts"`, `"start": "node dist/index.js"`, `"postbuild": "chmod +x dist/index.js"`
  - [x] 1.5 Run `pnpm install` from workspace root to resolve dependencies

### Group B — Core CLI Framework (sequential, depends on Group A)

- [x] **Task 2: Create `src/index.ts` — entry point** (AC: 1, 2, 3, 4, 7, 8, 9)
  - [x] 2.1 Add `#!/usr/bin/env node` shebang as first line
  - [x] 2.2 Import `Command` from `commander`
  - [x] 2.3 Read version from `package.json` using `createRequire` (same pattern as benji-mcp `server.ts`)
  - [x] 2.4 Create root `program = new Command("benji")` with `.version(version)` and `.description("CLI for the Benji API — manage todos, habits, health tracking, and more")`
  - [x] 2.5 Add global option: `.option("--json", "Output results as JSON")` on the root program
  - [x] 2.6 Call `registerCommands(program)` to attach all command groups (from `src/commands/index.ts`)
  - [x] 2.7 Configure `.showHelpAfterError("Run 'benji --help' for available commands")` for unknown-command handling
  - [x] 2.8 Call `program.parseAsync(process.argv)` wrapped in error handler
  - [x] 2.9 Top-level `.catch()` on main that prints errors and exits with code 1

- [x] **Task 3: Create `src/auth.ts` — authentication helper** (AC: 3)
  - [x] 3.1 Export function `ensureAuth(): void` that calls `initializeFromEnv()` from `benji-sdk`
  - [x] 3.2 Catch `BenjiConfigError` and print actionable error with example invocation to stderr, then `process.exit(1)`
  - [x] 3.3 Catch unexpected errors, print them to stderr, and `process.exit(1)`

- [x] **Task 4: Create `src/output.ts` — output formatting helpers** (AC: 4)
  - [x] 4.1 Export function `getGlobalOptions(cmd: Command): { json: boolean }` that walks up the command chain to read the root program's `--json` option
  - [x] 4.2 Export function `outputResult(data: unknown, opts: { json: boolean }): void` — if `json` is true, `console.log(JSON.stringify(data, null, 2))`; otherwise `console.log(JSON.stringify(data, null, 2))` as default (table formatting is Story 6.3)
  - [x] 4.3 Export function `outputError(error: unknown): never` — formats `BenjiApiError` with status/code/message/issues to stderr, includes example invocation hint, and exits with code 1

- [x] **Task 5: Create `src/error-handler.ts` — global error handler** (AC: 3, 8, 9)
  - [x] 5.1 Export function `handleCommandError(error: unknown): never` that handles `BenjiConfigError`, `BenjiApiError`, and generic errors
  - [x] 5.2 For `BenjiConfigError`: print the error message + `Example: BENJI_API_KEY=your-key benji todos list` to stderr, exit 1
  - [x] 5.3 For `BenjiApiError`: print status, code, message, and issues array to stderr, exit 1
  - [x] 5.4 For unknown errors: print `Unexpected error:` + message to stderr, exit 1

### Group C — Command Registration (depends on Task 2 signature, parallelizable within group)

- [x] **Task 6: Create `src/commands/index.ts` — command registry** (AC: 1, 5, 6)
  - [x] 6.1 Export function `registerCommands(program: Command): void`
  - [x] 6.2 Import and call `registerTodosCommand(program)` from `./todos.js`
  - [x] 6.3 Import and register stub commands for all 19 resource domains: `todos`, `tags`, `projects`, `todo-lists`, `habits`, `mood`, `hydration`, `fasting`, `workouts`, `journal`, `pain-events`, `weight-logs`, `todo-views`, `project-sections`, `todo-list-sections`, `goals`, `contacts`, `food`, `blood-pressure`
  - [x] 6.4 Each stub that is NOT `todos` uses `registerStubCommand()` helper (Task 8) to create a placeholder with help text

- [x] **Task 7: Create `src/commands/todos.ts` — proof-of-concept resource** (AC: 1, 5, 6, 9)
  - [x] 7.1 Export function `registerTodosCommand(program: Command): void`
  - [x] 7.2 Create `todos` subcommand group with description `"Manage todos"`
  - [x] 7.3 Add stub subcommands: `list`, `create`, `update`, `toggle`, `delete`, `by-tag`, `by-project`, `by-list`
  - [x] 7.4 Each stub action calls `ensureAuth()` then prints `"Not yet implemented. Coming in Story 6.2."` to stderr and exits 0
  - [x] 7.5 Each subcommand `--help` includes copy-pasteable Examples section, e.g.:
        ```
        Examples:
          $ benji todos list
          $ benji todos list --screen today --json
          $ benji todos create "Buy groceries"
          $ benji todos toggle <id>
          $ benji todos delete <id> --force
        ```
  - [x] 7.6 `list` subcommand defines placeholder options: `--screen <screen>`, `--search <query>`, `--show-completed`, `--task-type <type>`
  - [x] 7.7 `create` subcommand accepts `<title>` argument and placeholder options: `--priority <level>`, `--due-date <date>`, `--project-id <id>`, `--tag-ids <ids>`
  - [x] 7.8 `delete` subcommand accepts `<id>` argument and `--force` flag for destructive action safety

- [x] **Task 8: Create `src/commands/stub.ts` — stub command helper** (AC: 5, 6)
  - [x] 8.1 Export function `registerStubCommand(program: Command, name: string, description: string, verbs: string[]): void`
  - [x] 8.2 Creates the resource subcommand group with given name/description
  - [x] 8.3 For each verb, registers a subcommand whose action prints `"Not yet implemented. Coming in Story 6.2."` and exits 0
  - [x] 8.4 Adds minimal help text with example: `benji <name> <verb>`

### Group D — Build & Verification (depends on all above)

- [x] **Task 9: Build and verify** (AC: 1, 2, 3, 7, 8)
  - [x] 9.1 Run `pnpm --filter benji-cli build` — confirm clean compilation, no TS errors
  - [x] 9.2 Verify `dist/index.js` exists and starts with `#!/usr/bin/env node`
  - [x] 9.3 Run `node packages/benji-cli/dist/index.js --version` — confirm version prints `0.1.0`
  - [x] 9.4 Run `node packages/benji-cli/dist/index.js --help` — confirm layered help with 19 command groups + global options
  - [x] 9.5 Run `node packages/benji-cli/dist/index.js todos --help` — confirm resource-specific help with examples
  - [x] 9.6 Run `node packages/benji-cli/dist/index.js foobar` — confirm unknown command error with hint
  - [x] 9.7 Run without `BENJI_API_KEY`: `unset BENJI_API_KEY && node packages/benji-cli/dist/index.js todos list` — confirm actionable auth error
  - [x] 9.8 Run `node packages/benji-cli/dist/index.js --json todos list` with `BENJI_API_KEY` unset — confirm auth error still fires (global option doesn't break auth flow)

## Dev Notes

### Architecture

The CLI follows the same structural pattern as `benji-mcp`:

```
packages/benji-cli/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts              # Entry point: shebang, Commander setup, parseAsync
    ├── auth.ts               # ensureAuth() wrapper around initializeFromEnv()
    ├── output.ts             # outputResult(), outputError(), getGlobalOptions()
    ├── error-handler.ts      # handleCommandError() for top-level error handling
    └── commands/
        ├── index.ts          # registerCommands() — imports + registers all domains
        ├── todos.ts          # Full proof-of-concept: todos resource with stub actions
        └── stub.ts           # registerStubCommand() helper for placeholder domains
```

### CLI-for-Agents Principles Applied

1. **Non-interactive first**: No prompts anywhere. All input via flags/args. `ensureAuth()` fails fast with actionable error, never prompts for key.
2. **Layered --help**: `benji --help` → command groups. `benji todos --help` → subcommands with examples. `benji todos create --help` → options for create.
3. **Predictable `resource verb`**: Every command is `benji <resource> <verb>` — no exceptions.
4. **Fail fast**: Missing `BENJI_API_KEY` → immediate exit with exact env var to set + example. Unknown command → exit with suggestion.
5. **`--json` global**: Available from day one on root program. Commands access it via `getGlobalOptions()`.
6. **Machine-useful output**: Even stubs return structured data. Default format is JSON until Story 6.3 adds table formatting.
7. **Destructive safety**: `delete` commands accept `--force` flag from the start (enforced in Story 6.2).

### Commander.js Version

Use `commander@^14.0.0` (latest stable: 14.0.3). This is the CJS+ESM dual version. Commander 15 (ESM-only) is in prerelease and ships May 2026 — do NOT use it yet. Commander 14 requires Node.js >= 20, which aligns with the monorepo's `engines.node >= 20.19.0`.

### Auth Pattern

Mirror `benji-mcp/src/index.ts` exactly:

```ts
import { initializeFromEnv, BenjiConfigError } from "benji-sdk";

export function ensureAuth(): void {
  try {
    initializeFromEnv();
  } catch (error: unknown) {
    if (error instanceof BenjiConfigError) {
      console.error(`Error: ${error.message}`);
      console.error("Example: BENJI_API_KEY=your-key benji todos list");
      process.exit(1);
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to initialize: ${message}`);
    process.exit(1);
  }
}
```

Auth is NOT called at program startup (unlike benji-mcp). It is called lazily inside each command action, so `benji --help` and `benji --version` work without `BENJI_API_KEY` set.

### Reading version from package.json

Use the same `createRequire` pattern as `benji-mcp/src/server.ts`:

```ts
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };
```

### Stub Commands for Story 6.2

All 19 resource domains get registered as command groups. Only `todos` has detailed subcommands with options. The others use `registerStubCommand()` which creates the group with basic `list`, `create`, `update`, `delete` verbs as stubs. This lets `benji --help` show the full command surface from day one, and Story 6.2 fills in the implementations.

### Resource-to-CLI Name Mapping

| SDK Domain | CLI Command | Description |
|---|---|---|
| Todos | `todos` | Manage todos |
| Tags | `tags` | Manage tags |
| Projects | `projects` | Manage projects |
| TodoLists | `todo-lists` | Manage todo lists |
| Habits | `habits` | Manage habits |
| Mood | `mood` | Track mood entries |
| Hydration | `hydration` | Track hydration |
| Fasting | `fasting` | Manage fasting sessions |
| Workouts | `workouts` | Manage workouts |
| Journal | `journal` | Manage journal entries |
| PainEvents | `pain-events` | Track pain events |
| WeightLogs | `weight-logs` | Track weight logs |
| TodoViews | `todo-views` | Manage todo views |
| ProjectSections | `project-sections` | Manage project sections |
| TodoListSections | `todo-list-sections` | Manage todo list sections |
| Goals | `goals` | Manage goals |
| Contacts | `contacts` | Manage contacts |
| Food | `food` | Track food entries |
| BloodPressure | `blood-pressure` | Track blood pressure |

### Project Structure Notes

- Monorepo: `pnpm-workspace.yaml` → `packages/*`
- Build: `pnpm --filter benji-cli build` (or `pnpm -r build` from root)
- Dev: `pnpm --filter benji-cli dev -- --help` (runs via tsx without build)
- The `bin.benji` field in `package.json` already points to `./dist/index.js`
- `postbuild` script ensures `chmod +x dist/index.js`

### References

- Commander.js docs: https://github.com/tj/commander.js
- `packages/benji-mcp/src/index.ts` — auth + entry point pattern
- `packages/benji-mcp/src/server.ts` — version reading + module registration pattern
- `packages/benji-mcp/src/tools/util.ts` — error handling pattern
- `packages/benji-sdk/src/env.ts` — `initializeFromEnv()` implementation
- `packages/benji-sdk/src/errors.ts` — `BenjiConfigError`, `BenjiApiError` types
- CLI-for-Agents skill: `~/.cursor/plugins/cache/cursor-public/cli-for-agent/*/skills/cli-for-agents/SKILL.md`

## Dev Agent Record

### Context Reference
- Story: `_bmad-output/sprint-artifacts/6-1-scaffold-cli-package.md`
- Epic: 6 (CLI)

### Agent Model Used
claude-4.6-opus (Cursor Agent)

### Debug Log References
None — clean build, all verifications passed on first attempt.

### Completion Notes List
- All 9 tasks completed, all subtasks [x] marked
- AC-1 through AC-9 verified via build + manual CLI invocations
- `pnpm install` required `--no-frozen-lockfile` (CI default frozen-lockfile blocked new deps)
- Commander v14 resolved cleanly; ESM imports work without `.js` extension issues
- `benji foobar` produces smart suggestion: "Did you mean food?" via Commander's built-in similarity matching

### Senior Developer Review (AI)

**Review findings: 7 total (1 critical, 2 high, 2 medium, 2 low) — ALL FIXED**

- F1 (CRITICAL): Stub commands bypassed `ensureAuth()` — 18/19 resources allowed execution without API key. **Fixed**: added `ensureAuth()` call + `process.exit(2)` to stub.ts.
- F2 (HIGH): Error output ignored `--json` flag — agents got unparseable stderr. **Fixed**: `handleCommandError` now detects `--json` via `process.argv` and outputs structured JSON errors.
- F3 (HIGH): Duplicate error formatting in `output.ts` and `error-handler.ts`. **Fixed**: removed `outputError()` from output.ts, `auth.ts` now delegates to `handleCommandError`.
- F4 (MEDIUM): Stub "not implemented" commands exited 0, misleading agents. **Fixed**: all stubs now exit with code 2 to distinguish from success (0) and error (1).
- F5 (MEDIUM): No test framework. **Deferred**: formal test suite appropriate for Story 6.2+ when real implementations exist.
- F6 (LOW): Stub verb descriptions were lowercase/inverted. **Fixed**: capitalized verb in stub descriptions.
- F7 (LOW): Example date `2025-12-31` was in the past. **Fixed**: changed to `2026-12-31`.

### Review Follow-ups (AI)
- [x] F1: Add ensureAuth() to stub commands
- [x] F2: Add JSON-aware error output to handleCommandError
- [x] F3: Remove duplicate outputError(), consolidate auth.ts to use handleCommandError
- [x] F4: Change stub exit code from 0 to 2
- [x] F5: Deferred — test framework for Story 6.2+
- [x] F6: Capitalize stub verb descriptions
- [x] F7: Fix past date in todos create example

### File List
- `packages/benji-cli/package.json` (modified — added commander, @types/node, tsx, scripts)
- `packages/benji-cli/src/index.ts` (rewritten — Commander entry point with shebang)
- `packages/benji-cli/src/auth.ts` (new — ensureAuth() delegating to handleCommandError)
- `packages/benji-cli/src/output.ts` (new — getGlobalOptions, outputResult)
- `packages/benji-cli/src/error-handler.ts` (new — handleCommandError with JSON-aware output)
- `packages/benji-cli/src/commands/index.ts` (new — registerCommands with 19 resource domains)
- `packages/benji-cli/src/commands/todos.ts` (new — full todos resource with 8 subcommands + options)
- `packages/benji-cli/src/commands/stub.ts` (new — registerStubCommand helper with ensureAuth)
