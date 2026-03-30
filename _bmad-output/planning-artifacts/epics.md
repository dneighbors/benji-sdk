# benji-sdk - Epic Breakdown

**Author:** Derek
**Date:** 2026-03-26
**Project Level:** Medium Complexity (Brownfield)
**Target Scale:** Developer SDK + MCP Server + CLI

---

## Overview

Epic breakdown for adding MCP server and CLI packages to the existing Benji TypeScript SDK. The SDK (auto-generated via `@hey-api/openapi-ts`) is already functional for core resources. This work adds AI-usable tool interfaces (MCP first) and a CLI, both consuming the SDK. Resources already in the SDK are implemented first; resources only in the alpha API require an SDK update before MCP/CLI exposure.

**Phasing strategy:** Simple (already in SDK) first, SDK update for missing resources later.

---

## Functional Requirements Inventory

### Core Infrastructure (FR1-FR3)
| FR | Description | Scope |
|----|-------------|-------|
| FR1 | Repository supports pnpm workspace monorepo with SDK, MCP, and CLI packages | MVP |
| FR2 | All packages share auth configuration via `BENJI_API_KEY` env var | MVP |
| FR3 | Errors from Benji API are normalized into actionable, structured messages | MVP |

### MCP Server (FR4-FR10)
| FR | Description | Scope |
|----|-------------|-------|
| FR4 | MCP server runs locally via stdio transport | MVP |
| FR5 | MCP tools expose all CRUD operations for Todos, Tags, Projects, Todo Lists, Habits, Mood | MVP |
| FR6 | MCP tools expose Hydration, Fasting, Workouts, Journal, Pain Events | Phase 2 |
| FR7 | MCP tools expose Todo Views (done/paused/recurring/sharing/trash) | Phase 3 |
| FR8 | MCP tools expose Weight Logs, Project Sections, Todo List Sections | Phase 3 |
| FR9 | MCP tools expose Goals, Contacts, Food, Blood Pressure | Phase 3 |
| FR10 | All MCP tools have clear JSON schemas, structured outputs, actionable errors | MVP |

### SDK Update (FR11-FR12)
| FR | Description | Scope |
|----|-------------|-------|
| FR11 | SDK regenerated from alpha API openapi.json with all new resource classes | Phase 3 |
| FR12 | New classes verified: WeightLogs, TodoViews, ProjectSections, TodoListSections, Goals, Contacts, Food, BloodPressureLogs, etc. | Phase 3 |

### CLI (FR13-FR15)
| FR | Description | Scope |
|----|-------------|-------|
| FR13 | CLI commands mirror MCP tool surface | Post-MVP |
| FR14 | CLI supports JSON and human-readable output | Post-MVP |
| FR15 | CLI reads auth from env vars | Post-MVP |

### Documentation (FR16-FR18)
| FR | Description | Scope |
|----|-------------|-------|
| FR16 | README documents SDK, MCP, and CLI usage | MVP |
| FR17 | MCP config snippets provided for Cursor/Claude setup | MVP |
| FR18 | Environment variable and troubleshooting docs | MVP |

### MCP Optimization (FR19-FR20)
| FR | Description | Scope |
|----|-------------|-------|
| FR19 | MCP tools expose single-item get endpoints for all resource domains | Post-MVP |
| FR20 | MCP list responses are summarized to reduce token usage for AI consumers | Post-MVP |

---

## FR Coverage Map

| Epic | FRs Covered |
|------|-------------|
| Epic 1 | FR1, FR2, FR3 |
| Epic 2 | FR4, FR5, FR10 |
| Epic 3 | FR6, FR10 |
| Epic 4 | FR11, FR12 |
| Epic 5 | FR7, FR8, FR9, FR10 |
| Epic 6 | FR13, FR14, FR15 |
| Epic 7 | FR16, FR17, FR18 |
| Epic 8 | FR19, FR20 |

---

## Epic 1: Monorepo + Core Infrastructure

**Goal:** Convert to pnpm workspace monorepo with shared auth and error handling, scaffold MCP and CLI packages.

### Story 1.1: Convert to pnpm workspace monorepo

As a developer,
I want the repo structured as a monorepo with `packages/benji-sdk`, `packages/benji-mcp`, and `packages/benji-cli`,
So that packages share dependencies and build together.

**Acceptance Criteria:**

**Given** the repo root
**When** I run `pnpm install`
**Then** all workspace packages install correctly

**Given** benji-sdk source in `packages/benji-sdk/`
**When** I run `pnpm build`
**Then** the SDK builds with no changes to its public API

**And** root `pnpm-workspace.yaml` defines `packages/*`
**And** existing SDK is moved to `packages/benji-sdk/` preserving all files
**And** root package.json has workspace-level build/test scripts

**Prerequisites:** None
**Technical Notes:** ESM-only (`"type": "module"`), TypeScript 5.5+, bundler moduleResolution

### Story 1.2: Scaffold MCP and CLI packages

As a developer,
I want `packages/benji-mcp/` and `packages/benji-cli/` initialized with package.json and tsconfig,
So that I can start adding tools and commands.

**Acceptance Criteria:**

**Given** `packages/benji-mcp/`
**When** I run `pnpm --filter benji-mcp build`
**Then** it compiles an empty entry point successfully

**Given** `packages/benji-cli/`
**When** I run `pnpm --filter benji-cli build`
**Then** it compiles an empty entry point successfully

**And** both packages depend on `benji-sdk` as a workspace dependency
**And** both use ESM and TypeScript

**Prerequisites:** Story 1.1

### Story 1.3: Shared error handling and auth configuration

As a developer,
I want a shared auth configuration pattern using `BENJI_API_KEY` and normalized error types,
So that MCP and CLI don't duplicate auth/error logic.

**Acceptance Criteria:**

**Given** `BENJI_API_KEY` is set in the environment
**When** either MCP or CLI initializes
**Then** the SDK client is configured with that key

**Given** `BENJI_API_KEY` is NOT set
**When** either MCP or CLI initializes
**Then** a clear error message explains the missing key

**And** normalized error types exist for: auth (401), validation (400), not-found (404), server (500)
**And** errors include the original API message when available

**Prerequisites:** Story 1.2

---

## Epic 2: MCP Server — Existing SDK Resources (Phase 1)

**Goal:** Working local stdio MCP server exposing tools for the most-used Benji resources that already exist in the SDK.

### Story 2.1: Scaffold MCP server with stdio transport

As a developer,
I want `packages/benji-mcp/` running as a stdio MCP server with `@modelcontextprotocol/sdk`,
So that AI assistants can connect to it.

**Acceptance Criteria:**

**Given** `BENJI_API_KEY` is set
**When** I run `pnpm --filter benji-mcp dev`
**Then** the MCP server starts on stdio and responds to `initialize`

**And** server name is `benji-mcp`
**And** optional `BENJI_BASE_URL` overrides default API base
**And** server validates API key presence before starting

**Prerequisites:** Story 1.3

### Story 2.2: Todo tools

As an AI assistant,
I want MCP tools for managing Benji todos,
So that I can list, create, update, toggle, and delete todos.

**Acceptance Criteria:**

**Given** valid API key, **When** `list_todos` is called with screen param (today/overview/inbox), **Then** returns structured todo list
**Given** valid input, **When** `create_todo` is called with title and optional fields, **Then** creates and returns the todo
**Given** valid todo ID, **When** `update_todo` is called, **Then** updates and returns the todo
**Given** valid todo ID, **When** `toggle_todo` is called, **Then** toggles completion status
**Given** valid todo ID, **When** `delete_todo` is called, **Then** deletes the todo
**Given** valid tag/project/list ID, **When** `list_todos_by_tag`/`list_todos_by_project`/`list_todos_by_list` is called, **Then** returns filtered todos

**And** all tools have JSON schema input validation
**And** all responses are structured JSON with consistent shape

**Prerequisites:** Story 2.1
**Technical Notes:** SDK classes: `Todos.todosList`, `Todos.todosCreate`, `Todos.todosUpdate`, `Todos.todosToggle`, `Todos.todosDelete`, `Todos.todosByTag`, `Todos.todosByProject`, `Todos.todosByList`

### Story 2.3: Tag tools

As an AI assistant,
I want MCP tools for managing Benji tags,
So that I can list, create, update, and delete tags.

**Acceptance Criteria:**

**Given** valid API key, **When** `list_tags` is called, **Then** returns all tags
**Given** valid input, **When** `create_tag` is called, **Then** creates and returns the tag
**Given** valid tag ID, **When** `update_tag` is called, **Then** updates and returns the tag
**Given** valid tag ID, **When** `delete_tag` is called, **Then** deletes the tag

**Prerequisites:** Story 2.1
**Technical Notes:** SDK classes: `Tags.tagsList`, `Tags.tagsCreate`, `Tags.tagsUpdate`, `Tags.tagsDelete`

### Story 2.4: Project tools

As an AI assistant,
I want MCP tools for managing Benji projects,
So that I can list, create, update, and delete projects.

**Acceptance Criteria:**

**Given** valid API key, **When** `list_projects` is called, **Then** returns all projects
**Given** valid input, **When** `create_project` is called, **Then** creates and returns the project
**Given** valid project ID, **When** `update_project` is called, **Then** updates and returns the project
**Given** valid project ID, **When** `delete_project` is called, **Then** deletes the project

**Prerequisites:** Story 2.1
**Technical Notes:** SDK classes: `Projects.projectsList`, `Projects.projectsCreate`, `Projects.projectsUpdate`, `Projects.projectsDelete`

### Story 2.5: Todo List tools

As an AI assistant,
I want MCP tools for managing Benji todo lists,
So that I can list, create, update, and delete todo lists.

**Acceptance Criteria:**

**Given** valid API key, **When** `list_todo_lists` is called, **Then** returns all todo lists
**Given** valid input, **When** `create_todo_list` is called, **Then** creates and returns the list
**Given** valid list ID, **When** `update_todo_list` is called, **Then** updates and returns the list
**Given** valid list ID, **When** `delete_todo_list` is called, **Then** deletes the list

**Prerequisites:** Story 2.1
**Technical Notes:** SDK classes: `TodoLists.todoListsList`, `TodoLists.todoListsCreate`, `TodoLists.todoListsUpdate`, `TodoLists.todoListsDelete`

### Story 2.6: Habit tools

As an AI assistant,
I want MCP tools for managing Benji habits,
So that I can list, create, update, delete, and log habits.

**Acceptance Criteria:**

**Given** valid API key, **When** `list_habits` is called, **Then** returns all habits with completions
**Given** valid input, **When** `create_habit` is called, **Then** creates and returns the habit
**Given** valid habit ID, **When** `update_habit` is called, **Then** updates and returns the habit
**Given** valid habit ID, **When** `delete_habit` is called, **Then** deletes the habit
**Given** valid habit ID and date, **When** `log_habit` is called, **Then** logs the habit for that day
**Given** valid habit IDs and date, **When** `log_many_habits` is called, **Then** logs multiple habits

**Prerequisites:** Story 2.1
**Technical Notes:** SDK classes: `Habits.habitsGetHabitsAndCompletions`, `Habits.habitsCreate`, `Habits.habitsUpdate`, `Habits.habitsDelete`, `Habits.habitsLogHabitOnDay`, `Habits.habitsLogManyHabitsOnDay`

### Story 2.7: Mood tools

As an AI assistant,
I want MCP tools for managing Benji mood logs,
So that I can list, create, update, and delete mood entries.

**Acceptance Criteria:**

**Given** valid API key, **When** `list_mood` is called with date range, **Then** returns mood logs
**Given** valid input, **When** `create_mood` is called, **Then** creates and returns the mood log
**Given** valid mood ID, **When** `update_mood` is called, **Then** updates and returns the mood log
**Given** valid mood ID, **When** `delete_mood` is called, **Then** deletes the mood log

**Prerequisites:** Story 2.1
**Technical Notes:** SDK classes: `Mood.moodList`, `Mood.moodCreate`, `Mood.moodUpdate`, `Mood.moodDelete`

---

## Epic 3: MCP Server — Existing SDK Resources (Phase 2)

**Goal:** Extend MCP server with remaining health/wellness resources already in the SDK.

### Story 3.1: Hydration tools

As an AI assistant,
I want MCP tools for Benji hydration tracking,
So that I can log water intake and view stats.

**Acceptance Criteria:**

**Given** valid API key, **When** `list_hydration_logs` is called, **Then** returns hydration logs
**Given** valid input, **When** `create_hydration_log` is called, **Then** creates the log
**Given** valid log ID, **When** `delete_hydration_log` is called, **Then** deletes the log
**Given** valid date range, **When** `get_hydration_stats` is called, **Then** returns aggregated stats

**Prerequisites:** Epic 2 complete
**Technical Notes:** SDK: `Hydration` class

### Story 3.2: Fasting tools

As an AI assistant,
I want MCP tools for Benji fasting tracking,
So that I can start/end fasts and view stats.

**Acceptance Criteria:**

**Given** valid API key, **When** `start_fast` is called, **Then** starts a new fast
**Given** an active fast, **When** `end_fast` is called, **Then** ends the current fast
**Given** valid API key, **When** `get_active_fast` is called, **Then** returns active fast or null
**Given** valid date range, **When** `get_fasting_stats` is called, **Then** returns fasting statistics

**Prerequisites:** Epic 2 complete
**Technical Notes:** SDK: `Fasting` class

### Story 3.3: Workout tools

As an AI assistant,
I want MCP tools for Benji workout tracking,
So that I can list, create, start, and end workouts.

**Acceptance Criteria:**

**Given** valid API key, **When** `list_workouts` is called, **Then** returns workouts
**Given** valid input, **When** `create_workout` is called, **Then** creates and returns the workout
**Given** valid workout ID, **When** `start_workout` is called, **Then** starts the workout
**Given** valid workout ID, **When** `end_workout` is called, **Then** ends the workout

**Prerequisites:** Epic 2 complete
**Technical Notes:** SDK: `Workouts` class

### Story 3.4: Journal tools

As an AI assistant,
I want MCP tools for Benji journal entries,
So that I can list, create, and update journal entries.

**Acceptance Criteria:**

**Given** valid API key, **When** `list_journal_entries` is called, **Then** returns entries
**Given** valid input, **When** `create_journal_entry` is called, **Then** creates and returns the entry
**Given** valid entry ID, **When** `update_journal_entry` is called, **Then** updates the entry
**Given** valid entry ID, **When** `delete_journal_entry` is called, **Then** deletes the entry

**And** encryption-related operations are NOT exposed (private/complex)

**Prerequisites:** Epic 2 complete
**Technical Notes:** SDK: `Journal` class — skip encrypt/decrypt/toggleEncryption operations

### Story 3.5: Pain Event tools

As an AI assistant,
I want MCP tools for Benji pain event tracking,
So that I can log and review pain events.

**Acceptance Criteria:**

**Given** valid API key, **When** `list_pain_events` is called, **Then** returns pain events
**Given** valid input, **When** `create_pain_event` is called, **Then** creates the event
**Given** valid event ID, **When** `update_pain_event` is called, **Then** updates the event
**Given** valid event ID, **When** `delete_pain_event` is called, **Then** deletes the event
**Given** valid API key, **When** `list_body_parts` is called, **Then** returns available body parts

**Prerequisites:** Epic 2 complete
**Technical Notes:** SDK: `PainEvents` class

---

## Epic 4: SDK Update — New Alpha API Resources

**Goal:** Update the SDK to include all resources available in the alpha Benji API.

### Story 4.1: Update OpenAPI spec from alpha

As a developer,
I want the local `openapi.json` replaced with the alpha API's spec,
So that code generation picks up all new resources.

**Acceptance Criteria:**

**Given** `alpha.benji.so/api/openapi.json`
**When** I download it to replace the local `openapi.json`
**Then** the new spec includes all alpha resources (WeightLogs, TodoViews, ProjectSections, etc.)

**Prerequisites:** None (can run independently)

### Story 4.2: Regenerate SDK and fix build

As a developer,
I want the SDK regenerated from the updated spec,
So that new resource classes are available.

**Acceptance Criteria:**

**Given** the updated `openapi.json`
**When** I run `pnpm --filter benji-sdk build`
**Then** the SDK compiles with new classes for all alpha resources

**And** existing classes (Todos, Tags, etc.) remain unchanged
**And** `fix-imports.mjs` still works for ESM `.js` extensions

**Prerequisites:** Story 4.1

### Story 4.3: Verify new resource classes

As a developer,
I want to verify all expected new classes exist and are exported,
So that MCP/CLI can consume them.

**Acceptance Criteria:**

**Given** the regenerated SDK
**When** I check `sdk.gen.ts`
**Then** these classes exist: WeightLogs, TodoViews, ProjectSections, TodoListSections, Goals, Contacts, Food, FoodTemplates, BloodPressureLogs, Countdowns, Dashboards, Homes, HydrationGoals, HydrationTemplates, IngredientLists, Ingredients, Locations, MacroGoals, MealPlans, PlannerEvents, PlannerEventLists, Problems, Activities

**Prerequisites:** Story 4.2

---

## Epic 5: MCP Server — Newly Added Resources

**Goal:** Expose new alpha API resources via MCP tools.

### Story 5.1: Weight Log tools

Tools: `list_weight_logs`, `create_weight_log`, `update_weight_log`, `delete_weight_log`, `get_weight_widget`

**Prerequisites:** Epic 4 complete

### Story 5.2: Todo View tools

Tools: `list_done_todos`, `list_paused_todos`, `list_recurring_todos`, `list_shared_todos`, `list_trash_todos`

**Prerequisites:** Epic 4 complete

### Story 5.3: Project Section tools

Tools: `update_project_section`, `delete_project_section`

**Prerequisites:** Epic 4 complete

### Story 5.4: Todo List Section tools

Tools: `update_todo_list_section`, `delete_todo_list_section`

**Prerequisites:** Epic 4 complete

### Story 5.5: Goals, Contacts, Food, Blood Pressure tools

Tools for each resource: list, create, update, delete + resource-specific operations (food stats, etc.)

**Prerequisites:** Epic 4 complete

---

## Epic 6: CLI

**Goal:** CLI commands matching MCP tool surface for script-friendly usage.

### Story 6.1: Scaffold CLI package

As a developer,
I want `packages/benji-cli/` set up with Commander.js and auth from env,
So that I can add commands incrementally.

**Acceptance Criteria:**

**Given** `BENJI_API_KEY` is set
**When** I run `benji --help`
**Then** I see available command groups

**Prerequisites:** Epic 1 complete

### Story 6.2: Implement core commands

As a user,
I want CLI commands for todos, tags, projects, habits, mood,
So that I can manage Benji from the terminal.

**Acceptance Criteria:**

**Given** valid API key, **When** I run `benji todos list --screen today`, **Then** I see today's todos
**Given** valid input, **When** I run `benji todos create "Buy groceries"`, **Then** the todo is created

**Prerequisites:** Story 6.1, Epics 2-3 complete

### Story 6.3: Output formatting

As a user,
I want `--json` flag for JSON output and default human-readable output,
So that I can use the CLI in scripts and interactively.

**Prerequisites:** Story 6.2

---

## Epic 7: Documentation & Polish

**Goal:** Comprehensive docs for SDK, MCP, and CLI usage.

### Story 7.1: README and MCP usage docs

As a developer,
I want README sections documenting MCP setup with config snippets for Cursor and Claude,
So that I can get started quickly.

**Acceptance Criteria:**

**And** includes `~/.cursor/mcp.json` config snippet
**And** includes Claude Code MCP config snippet
**And** includes example tool calls and expected responses

**Prerequisites:** Epics 2-3 complete

### Story 7.2: CLAUDE.md and config snippets

As a developer,
I want a CLAUDE.md documenting repo conventions for AI assistants,
So that Claude Code can work effectively in this repo.

**Prerequisites:** Epic 1 complete

### Story 7.3: Env var docs and troubleshooting

As a developer,
I want documentation for all env vars and common error troubleshooting,
So that I can debug setup issues.

**Prerequisites:** Epics 2-3 complete

---

## Epic 8: MCP Response Optimization & Missing Get Tools

**Goal:** Add single-item `get_*` tools for all domains missing them, then add list response summarization to reduce token usage for AI consumers.

**Background:** MCP list responses return full API objects with 30+ fields per item, producing 50-80K character responses that can exceed AI context limits. Story 8-1 adds missing `get_*` tools so individual items can be fetched with full detail. Story 8-2 then safely summarizes list responses (compact field sets) since the AI can drill into any item via `get_*`. Story 8-3 adds corresponding CLI `get` commands.

### Story 8.1: Add missing get_* MCP tools

As an AI assistant,
I want `get_*` tools for every domain that has a list tool,
So that I can fetch full detail for a specific item by ID.

**Domains missing get tools (SDK method exists):**
- `get_todo` — `Todos.todosGet({ body: { id } })`
- `get_tag` — `Tags.tagsGet({ body: { id } })`
- `get_project` — `Projects.projectsGet({ body: { id } })`
- `get_todo_list` — `TodoLists.todoListsGet({ body: { id } })`
- `get_habit` — `Habits.habitsGet({ body: { id } })`
- `get_mood` — `Mood.moodGet({ body: { id } })`

**Acceptance Criteria:**

**Given** a valid resource ID, **When** `get_<resource>` is called, **Then** returns the full resource object with all fields
**And** each tool has JSON schema input validation for the `id` parameter
**And** errors are handled via `handleToolError()`

**Prerequisites:** Epics 2-5 complete

### Story 8.2: Add list response summarization

As an AI assistant,
I want list tool responses to contain only essential fields,
So that I can work within context limits while still browsing resources.

**Acceptance Criteria:**

**Given** a list tool call (e.g., `list_todos`), **When** the response is generated, **Then** each item contains only key fields (id, title/name, status, priority, dates, tags) and a `count` of total items
**And** the AI can call the corresponding `get_*` tool to retrieve full detail for any item
**And** a summarizer registry in `packages/benji-mcp/src/tools/summarizers.ts` allows per-domain field selection
**And** domains without a registered summarizer still get null-stripping (compact) only

**Prerequisites:** Story 8.1

### Story 8.3: Add missing get CLI commands

As a user,
I want `benji <resource> get <id>` commands for domains that only have list/create/update/delete,
So that I can inspect a single resource from the terminal.

**Domains:** todos, tags, projects, todo-lists, habits, mood

**Prerequisites:** Story 8.1
