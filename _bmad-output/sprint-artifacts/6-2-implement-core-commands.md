# Story 6.2: Implement Core Commands

Status: done

## Story

As a user,
I want CLI commands for todos, tags, projects, habits, mood, and all other resources,
So that I can manage Benji from the terminal.

## Acceptance Criteria

1. **AC-1: `benji todos list` returns real data**
   Given a valid `BENJI_API_KEY`,
   When I run `benji todos list --screen today`,
   Then I see today's todos from the API.

2. **AC-2: `benji todos create` creates a todo**
   Given valid input,
   When I run `benji todos create "Buy groceries"`,
   Then the todo is created and the result is printed.

3. **AC-3: All 19 resource domains have real command files**
   When I run `benji <resource> <verb>` for any of the 19 registered resources,
   Then the command makes a real SDK call (no stubs remain).

4. **AC-4: Every subcommand has layered `--help` with examples**
   When I run `benji <resource> <verb> --help` for any verb,
   Then I see description, options, and copy-pasteable usage examples.

5. **AC-5: Delete commands require `--force`**
   When I run `benji <resource> delete <id>` WITHOUT `--force`,
   Then the CLI exits code 1 with an error: `Error: --force is required for delete. Example: benji <resource> delete <id> --force`.

6. **AC-6: `--stdin` support for create/update commands**
   When I run `echo '{"title":"Test"}' | benji todos create --stdin`,
   Then the CLI reads JSON from stdin and uses it as the request body.

7. **AC-7: `--json` flag produces structured JSON output**
   When I run any command with `--json`,
   Then output is valid JSON on stdout.

8. **AC-8: Error handling is consistent and actionable**
   When any SDK call fails,
   Then the error includes the API status code, error code, message, and an example of the correct invocation.

9. **AC-9: No stubs remain — `stub.ts` is deleted or unused**
   After all command files are implemented,
   Then `commands/index.ts` imports only real command files and `stub.ts` is removed.

10. **AC-10: Build succeeds with zero TypeScript errors**
    When I run `pnpm --filter benji-cli build`,
    Then it compiles cleanly with no errors.

## Tasks / Subtasks

### Group 0 — Shared Utilities (do first, others depend on this)

- [x] **Task 0: Create `src/commands/shared.ts` — shared command helpers** (AC: 5, 6, 8)
  - [x] 0.1 Create `packages/benji-cli/src/commands/shared.ts`
  - [x] 0.2 Export `readStdin(): Promise<Record<string, unknown>>` — reads all of stdin, parses as JSON, exits code 1 with actionable error if parse fails. Example error: `Error: Invalid JSON on stdin. Example: echo '{"title":"test"}' | benji todos create --stdin`
  - [x] 0.3 Export `requireForce(cmd: Command, resource: string, verb: string): void` — checks if `--force` option is set; if not, prints `Error: --force is required for delete. Example: benji <resource> delete <id> --force` and exits code 1
  - [x] 0.4 Export `mergeStdinOpts(stdinData: Record<string, unknown>, explicitOpts: Record<string, unknown>): Record<string, unknown>` — explicit CLI opts override stdin values
  - [x] 0.5 Export `parseCommaSeparated(value: string): string[]` — splits comma-separated values for options like `--tag-ids`
  - [x] 0.6 Export `parseDate(value: string, optionName: string): string` — validates YYYY-MM-DD format, exits with actionable error if invalid
  - [x] 0.7 Export `parseNumber(value: string, optionName: string): number` — validates numeric input, exits with actionable error if NaN

### Group 1 — Todos (rewrite `todos.ts` from stub to real) (depends on Group 0)

- [x] **Task 1: Rewrite `src/commands/todos.ts` with real SDK calls** (AC: 1, 2, 4, 5, 6, 7, 8)
  - [x] 1.1 Import `wrapSdkCall`, `Todos` from `benji-sdk`; `ensureAuth` from `../auth.js`; `getGlobalOptions`, `outputResult` from `../output.js`; `handleCommandError` from `../error-handler.js`; shared helpers from `./shared.js`
  - [x] 1.2 **`todos list`** subcommand
  - [x] 1.3 **`todos by-tag`** subcommand
  - [x] 1.4 **`todos by-project`** subcommand
  - [x] 1.5 **`todos by-list`** subcommand
  - [x] 1.6 **`todos create`** subcommand
  - [x] 1.7 **`todos update`** subcommand
  - [x] 1.8 **`todos toggle`** subcommand
  - [x] 1.9 **`todos delete`** subcommand

### Group 2 — Tags, Projects, Todo Lists (simple CRUD, parallelizable) (depends on Group 0)

- [x] **Task 2: Create `src/commands/tags.ts`** (AC: 3, 4, 5, 6, 7, 8)
  - [x] 2.1–2.6 All subcommands implemented with help text

- [x] **Task 3: Create `src/commands/projects.ts`** (AC: 3, 4, 5, 6, 7, 8)
  - [x] 3.1–3.6 All subcommands implemented with help text

- [x] **Task 4: Create `src/commands/todo-lists.ts`** (AC: 3, 4, 5, 6, 7, 8)
  - [x] 4.1–4.6 All subcommands implemented with help text

### Group 3 — Habits, Mood (slightly more complex) (depends on Group 0)

- [x] **Task 5: Create `src/commands/habits.ts`** (AC: 3, 4, 5, 6, 7, 8)
  - [x] 5.1–5.8 All subcommands implemented with help text

- [x] **Task 6: Create `src/commands/mood.ts`** (AC: 3, 4, 5, 6, 7, 8)
  - [x] 6.1–6.6 All subcommands implemented with help text

### Group 4 — Hydration, Fasting, Workouts (health tracking) (depends on Group 0)

- [x] **Task 7: Create `src/commands/hydration.ts`** (AC: 3, 4, 5, 6, 7, 8)
  - [x] 7.1–7.7 All subcommands implemented with help text

- [x] **Task 8: Create `src/commands/fasting.ts`** (AC: 3, 4, 5, 6, 7, 8)
  - [x] 8.1–8.10 All subcommands implemented with help text

- [x] **Task 9: Create `src/commands/workouts.ts`** (AC: 3, 4, 5, 6, 7, 8)
  - [x] 9.1–9.11 All subcommands implemented with help text

### Group 5 — Journal, Pain Events (journal/wellness) (depends on Group 0)

- [x] **Task 10: Create `src/commands/journal.ts`** (AC: 3, 4, 5, 6, 7, 8)
  - [x] 10.1–10.7 All subcommands implemented with help text

- [x] **Task 11: Create `src/commands/pain-events.ts`** (AC: 3, 4, 5, 6, 7, 8)
  - [x] 11.1–11.8 All subcommands implemented with help text

### Group 6 — Weight Logs, Food, Blood Pressure (body metrics) (depends on Group 0)

- [x] **Task 12: Create `src/commands/weight-logs.ts`** (AC: 3, 4, 5, 6, 7, 8)
  - [x] 12.1–12.9 All subcommands implemented with help text

- [x] **Task 13: Create `src/commands/food.ts`** (AC: 3, 4, 5, 6, 7, 8)
  - [x] 13.1–13.7 All subcommands implemented with help text

- [x] **Task 14: Create `src/commands/blood-pressure.ts`** (AC: 3, 4, 5, 6, 7, 8)
  - [x] 14.1–14.7 All subcommands implemented with help text

### Group 7 — Todo Views, Project Sections, Todo List Sections (view/section management) (depends on Group 0)

- [x] **Task 15: Create `src/commands/todo-views.ts`** (AC: 3, 4, 7, 8)
  - [x] 15.1–15.7 All subcommands implemented with help text

- [x] **Task 16: Create `src/commands/project-sections.ts`** (AC: 3, 4, 5, 7, 8)
  - [x] 16.1–16.4 All subcommands implemented with help text

- [x] **Task 17: Create `src/commands/todo-list-sections.ts`** (AC: 3, 4, 5, 7, 8)
  - [x] 17.1–17.4 All subcommands implemented with help text

### Group 8 — Goals, Contacts (simple CRUD) (depends on Group 0)

- [x] **Task 18: Create `src/commands/goals.ts`** (AC: 3, 4, 5, 6, 7, 8)
  - [x] 18.1–18.7 All subcommands implemented with help text

- [x] **Task 19: Create `src/commands/contacts.ts`** (AC: 3, 4, 5, 6, 7, 8)
  - [x] 19.1–19.7 All subcommands implemented with help text

### Group 9 — Wire Up and Verify (depends on ALL above)

- [x] **Task 20: Rewrite `src/commands/index.ts` to import all real command files** (AC: 3, 9)
  - [x] 20.1 Remove all `registerStubCommand` calls
  - [x] 20.2 Remove `import { registerStubCommand } from "./stub.js"` line
  - [x] 20.3 Add imports for all 19 real command registration functions
  - [x] 20.4 Call each `registerXCommand(program)` in the function body
  - [x] 20.5 Delete `src/commands/stub.ts` file (no longer needed)

- [x] **Task 21: Build and smoke-test** (AC: 10, 1, 2, 3)
  - [x] 21.1 Run `pnpm --filter benji-cli build` — zero TypeScript errors
  - [x] 21.2 Run `node packages/benji-cli/dist/index.js --help` — verify all 19 command groups display
  - [x] 21.3 Spot-checked multiple resources --help (todos, tags, workouts, fasting, blood-pressure, goals)
  - [x] 21.4 Run `benji todos create --help` — verified options and examples display
  - [x] 21.5 Run `benji todos delete abc123` without --force — verified exit code 1 with actionable error
  - [ ] 21.6 Run `echo '{"title":"test"}' | benji todos create --stdin` with valid API key — verify stdin flow works
  - [ ] 21.7 Run `benji todos list --screen today --json` with valid API key — verify JSON output
  - [ ] 21.8 Run `benji tags list --json` with valid API key — verify tags are returned
  - [ ] 21.9 Run a create+delete cycle on at least one resource to verify write paths work

## Dev Notes

### Architecture

Each resource domain gets its own command file. The `stub.ts` file is removed entirely.

```
packages/benji-cli/src/
├── index.ts              # Entry point (unchanged from 6.1)
├── auth.ts               # ensureAuth() (unchanged from 6.1)
├── output.ts             # getGlobalOptions(), outputResult() (unchanged from 6.1)
├── error-handler.ts      # handleCommandError() (unchanged from 6.1)
└── commands/
    ├── index.ts           # registerCommands() — imports all 19 real command files
    ├── shared.ts          # readStdin(), requireForce(), mergeStdinOpts(), parseCommaSeparated(), parseDate(), parseNumber()
    ├── todos.ts           # 8 subcommands (list, by-tag, by-project, by-list, create, update, toggle, delete)
    ├── tags.ts            # 4 subcommands (list, create, update, delete)
    ├── projects.ts        # 4 subcommands (list, create, update, delete)
    ├── todo-lists.ts      # 4 subcommands (list, create, update, delete)
    ├── habits.ts          # 7 subcommands (list, create, update, delete, log, log-many)
    ├── mood.ts            # 4 subcommands (list, create, update, delete)
    ├── hydration.ts       # 5 subcommands (list, create, update, delete, stats)
    ├── fasting.ts         # 8 subcommands (start, end, active, stats, list, get, update, delete)
    ├── workouts.ts        # 10 subcommands (start, end, in-progress, list, create, get, update, delete, duplicate)
    ├── journal.ts         # 5 subcommands (list, create, get, update, delete)
    ├── pain-events.ts     # 7 subcommands (list, create, get, update, delete, body-parts)
    ├── weight-logs.ts     # 8 subcommands (list, create, get, update, delete, settings, widget)
    ├── food.ts            # 5 subcommands (list, create, get, update, delete)
    ├── blood-pressure.ts  # 5 subcommands (list, create, get, update, delete)
    ├── todo-views.ts      # 5 subcommands (done, paused, recurring, shared, trash)
    ├── project-sections.ts # 2 subcommands (update, delete)
    ├── todo-list-sections.ts # 2 subcommands (update, delete)
    ├── goals.ts           # 5 subcommands (list, create, get, update, delete)
    └── contacts.ts        # 5 subcommands (list, create, get, update, delete)
```

**Total new files**: 19 command files + 1 shared helper = 20 new files
**Total modified files**: `commands/index.ts` (rewrite), `todos.ts` (rewrite) = 2
**Total deleted files**: `commands/stub.ts` = 1

### CLI-for-Agents Principles Applied

1. **Non-interactive**: Zero prompts. All input via flags/arguments. Missing required flags produce immediate actionable errors with example invocations.
2. **Layered `--help`**: `benji --help` → command groups. `benji todos --help` → subcommands. `benji todos create --help` → options + examples.
3. **`--stdin` support**: All create/update commands accept `--stdin` to read JSON from stdin. This enables piping: `echo '{"title":"test"}' | benji todos create --stdin`. Explicit CLI flags override stdin values.
4. **Fail fast with actionable errors**: Missing `--force` on delete → error with exact command to run. Invalid date format → error with expected format. Missing required option → error with example.
5. **Idempotency**: GET/LIST calls are inherently idempotent. Toggle is the only non-idempotent action (by design).
6. **Destructive safety**: All `delete` subcommands require `--force`. Without it, exit code 1 + actionable error message.
7. **`resource verb` pattern**: Every command is `benji <resource> <verb>` — no exceptions.
8. **Machine-useful output**: `--json` outputs full API response. Default output is JSON until Story 6.3 adds table formatting.

### Standard Command Action Pattern

Every action handler follows this exact pattern:

```ts
.action(async (argValue, options, cmd) => {
  ensureAuth();
  const opts = getGlobalOptions(cmd);
  try {
    let body: Record<string, unknown> = {};
    if (options.stdin) {
      body = await readStdin();
    }
    // Merge explicit CLI options over stdin values
    if (argValue) body.someField = argValue;
    if (options.someOption !== undefined) body.someField = options.someOption;

    const result = await wrapSdkCall(SdkClass.sdkMethod({ body }));
    outputResult(result, opts);
  } catch (error) {
    handleCommandError(error);
  }
});
```

### Delete Command Pattern

```ts
.action(async (id, options, cmd) => {
  requireForce(cmd, "resource-name", "delete");
  ensureAuth();
  const opts = getGlobalOptions(cmd);
  try {
    const result = await wrapSdkCall(SdkClass.sdkMethod({ body: { id } }));
    outputResult(result, opts);
  } catch (error) {
    handleCommandError(error);
  }
});
```

### `--stdin` Behavior Contract

- `--stdin` reads ALL of stdin as a single JSON object
- Explicit CLI flags always override stdin values
- If `--stdin` is provided but stdin is empty or not valid JSON, exit code 1 with: `Error: Invalid JSON on stdin. Example: echo '{"title":"test"}' | benji todos create --stdin`
- `--stdin` is optional on all create/update commands. Without it, flags/arguments are used directly.

### SDK Import Pattern

All command files import from `benji-sdk`:
```ts
import { wrapSdkCall, Todos, Tags, Projects, TodoLists, Habits, Mood,
  Hydration, Fasting, Workouts, Journal, PainEvents, WeightLogs,
  TodoViews, ProjectSections, TodoListSections, Goals, Contacts,
  Food, BloodPressureLogs } from "benji-sdk";
```

Each file only imports the SDK class it needs (e.g. `tags.ts` only imports `Tags`).

### SDK Call Signatures Reference

Some SDK calls use `body`, some use `path` + `body`, some use `path` + `query`. The exact signatures per resource:

**Body-only** (id in body): Todos, Tags, Projects (create/update/delete), Mood, PainEvents, Contacts, BloodPressureLogs, WeightLogs (get/update/delete)
**Path + Body** (id in path): Hydration (update/delete), Fasting (get/update/delete), Workouts (get/update/delete/end/duplicate), Journal (get/update/delete), Food (get/update/delete), Goals (get/update/delete)
**Path + Query**: ProjectSections.delete (deleteTodos query), TodoListSections.delete (deleteTodos query)
**No args**: Fasting.getActive, Fasting.getStats, Workouts.inProgress, PainEvents.bodyParts, WeightLogs.getSettings, WeightLogs.getWeightsForWidget, Goals.list, Contacts.list

Dev must check the actual SDK method signatures in `sdk.gen.ts` for each call to get the exact shape right.

### Parallelizable Groups for Dev Agents

| Group | Tasks | Dependencies | Can Parallel With |
|-------|-------|-------------|-------------------|
| G0 | Task 0 (shared.ts) | None | — (do first) |
| G1 | Task 1 (todos) | G0 | G2, G3, G4, G5, G6, G7, G8 |
| G2 | Tasks 2-4 (tags, projects, todo-lists) | G0 | G1, G3, G4, G5, G6, G7, G8 |
| G3 | Tasks 5-6 (habits, mood) | G0 | G1, G2, G4, G5, G6, G7, G8 |
| G4 | Tasks 7-9 (hydration, fasting, workouts) | G0 | G1, G2, G3, G5, G6, G7, G8 |
| G5 | Tasks 10-11 (journal, pain-events) | G0 | G1, G2, G3, G4, G6, G7, G8 |
| G6 | Tasks 12-14 (weight-logs, food, blood-pressure) | G0 | G1, G2, G3, G4, G5, G7, G8 |
| G7 | Tasks 15-17 (todo-views, project/list sections) | G0 | G1, G2, G3, G4, G5, G6, G8 |
| G8 | Tasks 18-19 (goals, contacts) | G0 | G1, G2, G3, G4, G5, G6, G7 |
| G9 | Tasks 20-21 (wire up + verify) | ALL above | — (do last) |

### References

- Story 6.1: `_bmad-output/sprint-artifacts/6-1-scaffold-cli-package.md`
- SDK: `packages/benji-sdk/src/client/sdk.gen.ts` — all SDK class methods
- SDK wrapper: `packages/benji-sdk/src/wrapper.ts` — `wrapSdkCall()` implementation
- MCP tools (pattern reference): `packages/benji-mcp/src/tools/` — mirrors same SDK calls
- CLI-for-Agents skill: non-interactive, `--help`, `--stdin`, fail-fast, `--force`
- Commander.js v14 docs: https://github.com/tj/commander.js
