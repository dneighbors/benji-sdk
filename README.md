# Benji SDK Monorepo

TypeScript SDK, MCP server, and CLI for the [Benji](https://benji.so) API -- your personal life operating system.

## Table of Contents

- [Overview](#overview)
- [Monorepo Structure](#monorepo-structure)
- [Getting Started](#getting-started)
- [MCP Server Setup](#mcp-server-setup)
  - [Cursor IDE](#cursor-ide)
  - [Claude Code](#claude-code)
  - [Claude Desktop](#claude-desktop)
  - [Example Tool Calls](#example-tool-calls)
- [CLI Usage](#cli-usage)
  - [Example Commands](#example-commands)
  - [Global Flags](#global-flags)
- [SDK](#sdk)
- [Environment Variables](#environment-variables)
- [Available MCP Tools](#available-mcp-tools)
- [License](#license)

## Overview

[Benji](https://benji.so) is a personal life operating system that helps you manage todos, habits, health tracking, journaling, goals, and more. This monorepo provides three packages for interacting with the Benji API:

- **benji-sdk** -- An auto-generated TypeScript SDK built from the Benji OpenAPI spec. ESM-only with full type definitions for all endpoints.
- **benji-mcp** -- An MCP (Model Context Protocol) server that exposes 19 resource domains as tools, allowing AI assistants like Claude and Cursor to interact with your Benji data via stdio transport.
- **benji-cli** -- A command-line interface built with Commander.js, providing terminal access to all 19 resource domains with human-readable tables, JSON, and compact output modes.

## Monorepo Structure

| Package | Path | Description |
|---------|------|-------------|
| `benji-sdk` | [`packages/benji-sdk/`](packages/benji-sdk/) | Auto-generated TypeScript SDK from OpenAPI spec (v0.1.1) |
| `benji-mcp` | [`packages/benji-mcp/`](packages/benji-mcp/) | MCP server with stdio transport -- binary: `benji-mcp` (v0.1.0) |
| `benji-cli` | [`packages/benji-cli/`](packages/benji-cli/) | CLI for terminal usage -- binary: `benji` (v0.1.0) |

## Getting Started

### Prerequisites

- **Node.js** >= 20.19.0
- **pnpm** >= 9

### Clone and Build

```bash
git clone https://github.com/dneighbors/benji-sdk.git
cd benji-sdk
pnpm install
pnpm build
```

The `pnpm build` command runs recursively across all three packages, generating the SDK from the OpenAPI spec, then compiling benji-mcp and benji-cli.

### Verify the Build

```bash
# Check that the MCP server starts
node packages/benji-mcp/dist/index.js
# (It will exit with an error about BENJI_API_KEY -- that confirms the binary is built correctly)

# Check that the CLI is available
node packages/benji-cli/dist/index.js --help
```

## MCP Server Setup

The `benji-mcp` package provides an MCP server that communicates over stdio transport. AI assistants connect to it by launching the Node.js process and exchanging JSON-RPC messages over stdin/stdout.

Before configuring any client, make sure you have:

1. Built the project (`pnpm build`)
2. Your Benji API key (get one at [app.benji.so/settings](https://app.benji.so/settings))

### Cursor IDE

Add the following to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "benji": {
      "command": "node",
      "args": ["/absolute/path/to/benji-sdk/packages/benji-mcp/dist/index.js"],
      "env": {
        "BENJI_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

Replace `/absolute/path/to/benji-sdk` with the actual path where you cloned the repository, and `your-api-key-here` with your Benji API key.

### Claude Code

Add the following to `.claude/settings.json` (project-level) or `~/.claude/settings.json` (global):

```json
{
  "mcpServers": {
    "benji": {
      "command": "node",
      "args": ["/absolute/path/to/benji-sdk/packages/benji-mcp/dist/index.js"],
      "env": {
        "BENJI_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

Replace the path and API key as described above. The stdio transport is used automatically when specifying `command` and `args`.

> **Note:** If you already have a `.claude/settings.json` file, merge the `mcpServers` key into your existing config rather than replacing the entire file.

### Claude Desktop

Add the following to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "benji": {
      "command": "node",
      "args": ["/absolute/path/to/benji-sdk/packages/benji-mcp/dist/index.js"],
      "env": {
        "BENJI_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Example Tool Calls

Once the MCP server is connected, your AI assistant can call tools like these:

#### List today's todos

**Tool:** `list_todos`

**Input:**
```json
{
  "screen": "today"
}
```

**Response shape:**
```json
{
  "todos": [
    {
      "id": "abc123",
      "title": "Buy groceries",
      "completed": false,
      "priority": "high",
      "dueDate": null,
      "tags": []
    }
  ]
}
```

#### Create a todo

**Tool:** `create_todo`

**Input:**
```json
{
  "title": "Buy groceries",
  "priority": "high"
}
```

**Response shape:**
```json
{
  "id": "abc123",
  "title": "Buy groceries",
  "completed": false,
  "priority": "high"
}
```

#### List habits with completions

**Tool:** `list_habits`

**Input:**
```json
{
  "dateFrom": "2026-03-01",
  "dateTo": "2026-03-31"
}
```

**Response shape:**
```json
{
  "habits": [
    {
      "id": "hab456",
      "name": "Drink 8 glasses of water",
      "emoji": null,
      "completions": []
    }
  ]
}
```

#### Start a fast

**Tool:** `start_fast`

**Input:**
```json
{
  "hours": 16
}
```

**Response shape:**
```json
{
  "id": "fast789",
  "startTime": "2026-03-29T08:00:00Z",
  "goal": 16,
  "endTime": null
}
```

All tool responses are structured JSON. See the [Available MCP Tools](#available-mcp-tools) section for the complete list of tools.

## CLI Usage

### Build and Auth

```bash
# Build the CLI (included in the top-level pnpm build)
pnpm --filter benji-cli build

# Set your API key
export BENJI_API_KEY="your-api-key-here"

# Optionally override the base URL
export BENJI_BASE_URL="https://your-instance.com/api/rest"
```

The CLI follows the pattern `benji <resource> <action> [options]`.

### Example Commands

```bash
# List today's todos
benji todos list --screen today

# Create a todo
benji todos create --title "Buy groceries" --priority high

# List all habits
benji habits list --date-from 2026-03-01 --date-to 2026-03-31

# List all tags
benji tags list

# Create a tag
benji tags create --name "urgent"

# Log mood
benji mood create --mood 4 --note "Feeling great"

# JSON output
benji todos list --screen today --json

# Compact output (IDs only, suitable for scripting)
benji todos list --screen today --compact
```

### Global Flags

| Flag | Description |
|------|-------------|
| `--json` | Output results as structured JSON (pretty-printed). Useful for piping to `jq` or processing programmatically. |
| `--compact` | Minimal output showing IDs only. Suitable for scripting and piping to `xargs` or other tools. |

By default, the CLI outputs human-readable tables. Use `--json` for machine-parseable output or `--compact` for minimal output when scripting.

## SDK

The `benji-sdk` package is an auto-generated TypeScript SDK built from the Benji OpenAPI spec. It provides typed clients for all API endpoints, is ESM-only, and ships with full type definitions.

For complete documentation including installation, quick start, available modules, and code examples, see [`packages/benji-sdk/README.md`](packages/benji-sdk/README.md).

Quick example:

```typescript
import { configure, Todos } from "benji-sdk";

configure({ apiKey: "your-api-key" });

const { data } = await Todos.todosList({
  body: { screen: "today" }
});
```

## Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `BENJI_API_KEY` | Yes | API key for authenticating with the Benji API. Get yours at [app.benji.so/settings](https://app.benji.so/settings). | (none) |
| `BENJI_BASE_URL` | No | Override the API base URL for self-hosted instances or development. | `https://app.benji.so/api/rest` |

Both variables are read by all three packages (SDK via `configure()`, MCP server and CLI via `initializeFromEnv()`).

For detailed troubleshooting, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

## Available MCP Tools

The MCP server registers tools across 19 resource domains. Each tool name follows the pattern `action_resource`.

### Todos (8 tools)

| Tool | Description |
|------|-------------|
| `list_todos` | List todos with optional filters (screen, date, search, taskType) |
| `list_todos_by_tag` | List todos filtered by tag ID |
| `list_todos_by_project` | List todos filtered by project ID |
| `list_todos_by_list` | List todos filtered by todo list ID |
| `create_todo` | Create a new todo |
| `update_todo` | Update an existing todo |
| `toggle_todo` | Toggle the completion status of a todo |
| `delete_todo` | Delete a todo by ID |

### Tags (4 tools)

| Tool | Description |
|------|-------------|
| `list_tags` | List all tags, optionally filtered by task type |
| `create_tag` | Create a new tag |
| `update_tag` | Update an existing tag |
| `delete_tag` | Delete a tag by ID |

### Projects (4 tools)

| Tool | Description |
|------|-------------|
| `list_projects` | List all projects, optionally filtered by task type |
| `create_project` | Create a new project |
| `update_project` | Update an existing project |
| `delete_project` | Delete a project by ID |

### Todo Lists (4 tools)

| Tool | Description |
|------|-------------|
| `list_todo_lists` | List all todo lists, optionally filtered by task type |
| `create_todo_list` | Create a new todo list |
| `update_todo_list` | Update an existing todo list |
| `delete_todo_list` | Delete a todo list by ID |

### Habits (6 tools)

| Tool | Description |
|------|-------------|
| `list_habits` | List habits with completions for a date range |
| `create_habit` | Create a new habit |
| `update_habit` | Update an existing habit |
| `delete_habit` | Delete a habit by ID |
| `log_habit` | Log a habit completion or failure for a specific day |
| `log_many_habits` | Log multiple habits for a specific day |

### Mood (4 tools)

| Tool | Description |
|------|-------------|
| `list_mood` | List mood logs, optionally filtered by date |
| `create_mood` | Create a new mood log (1=awful to 5=rad) |
| `update_mood` | Update an existing mood log |
| `delete_mood` | Delete a mood log by ID |

### Hydration (5 tools)

| Tool | Description |
|------|-------------|
| `list_hydration_logs` | List hydration logs, optionally filtered by date |
| `create_hydration_log` | Create a new hydration log |
| `update_hydration_log` | Update an existing hydration log |
| `delete_hydration_log` | Delete a hydration log by ID |
| `get_hydration_stats` | Get hydration stats (total, goal, percentage) for a date |

### Fasting (8 tools)

| Tool | Description |
|------|-------------|
| `start_fast` | Start a new fast with optional goal duration |
| `end_fast` | End an active fast |
| `get_active_fast` | Get the currently active fast |
| `get_fasting_stats` | Get overall fasting statistics |
| `list_fasts` | List fasts, optionally filtered by date range |
| `get_fast` | Get a single fast by ID |
| `update_fast` | Update an existing fast |
| `delete_fast` | Delete a fast by ID |

### Workouts (10 tools)

| Tool | Description |
|------|-------------|
| `start_workout` | Start a new workout |
| `end_workout` | End an in-progress workout |
| `get_in_progress_workout` | Get the currently in-progress workout |
| `list_workouts` | List workouts, optionally filtered by date range |
| `create_workout` | Create a new workout with start/end times |
| `get_workout` | Get a single workout by ID |
| `get_workout_with_details` | Get a workout with exercises and sets |
| `update_workout` | Update an existing workout |
| `delete_workout` | Delete a workout by ID |
| `duplicate_workout` | Duplicate an existing workout |

### Journal (7 tools)

| Tool | Description |
|------|-------------|
| `list_journal_entries` | List journal entries, optionally filtered by date range |
| `create_journal_entry` | Create a new journal entry |
| `get_journal_entry` | Get a single journal entry by ID |
| `update_journal_entry` | Update an existing journal entry |
| `delete_journal_entry` | Delete a journal entry by ID |
| `delete_many_journal_entries` | Delete multiple journal entries by IDs |
| `get_journal_stats` | Get journal stats (total entries, words, streak) |

### Pain Events (8 tools)

| Tool | Description |
|------|-------------|
| `list_pain_events` | List pain events, optionally filtered by date |
| `create_pain_event` | Create a new pain event (level 1-10, body part) |
| `get_pain_event` | Get a single pain event by ID |
| `update_pain_event` | Update an existing pain event |
| `delete_pain_event` | Delete a pain event by ID |
| `delete_many_pain_events` | Delete multiple pain events by IDs |
| `list_body_parts` | List all available body parts |
| `list_recent_body_parts` | List recently used body parts by frequency |

### Weight Logs (10 tools)

| Tool | Description |
|------|-------------|
| `list_weight_logs` | List weight logs, optionally filtered by date or range |
| `create_weight_log` | Create a weight log with optional body composition |
| `get_weight_log` | Get a single weight log by ID |
| `update_weight_log` | Update an existing weight log |
| `delete_weight_log` | Delete a weight log by ID |
| `delete_many_weight_logs` | Delete multiple weight logs by IDs |
| `get_weight_settings` | Get weight unit preference (kg/lbs) |
| `update_weight_unit` | Update weight unit preference |
| `get_weight_widget` | Get recent weight data for charts |
| `get_current_weight_goal` | Get the current active weight goal |

### Todo Views (5 tools)

| Tool | Description |
|------|-------------|
| `list_done_todos` | List completed todos |
| `list_paused_todos` | List paused todos |
| `list_recurring_todos` | List recurring todos |
| `list_shared_todos` | Get sharing details for a todo list |
| `list_trash_todos` | List trashed todos with pagination |

### Project Sections (2 tools)

| Tool | Description |
|------|-------------|
| `update_project_section` | Update a project section name |
| `delete_project_section` | Delete a project section |

### Todo List Sections (2 tools)

| Tool | Description |
|------|-------------|
| `update_todo_list_section` | Update a todo list section name |
| `delete_todo_list_section` | Delete a todo list section |

### Goals (7 tools)

| Tool | Description |
|------|-------------|
| `list_goals` | List all goals |
| `create_goal` | Create a new goal |
| `get_goal` | Get a single goal by ID |
| `update_goal` | Update an existing goal |
| `delete_goal` | Delete a goal by ID |
| `delete_many_goals` | Delete multiple goals by IDs |
| `list_public_goals` | List public goals for a user by username |

### Contacts (5 tools)

| Tool | Description |
|------|-------------|
| `list_contacts` | List all contact relationships |
| `create_contact` | Create a new contact relationship |
| `get_contact` | Get a single contact by ID |
| `update_contact` | Update a contact relationship |
| `delete_contact` | Delete a contact by ID |

### Food (9 tools)

| Tool | Description |
|------|-------------|
| `list_food_logs` | List food logs, optionally filtered by date |
| `create_food_log` | Create a food log with nutrition info |
| `get_food_log` | Get a single food log by ID |
| `update_food_log` | Update an existing food log |
| `delete_food_log` | Delete a food log by ID |
| `delete_many_food_logs` | Delete multiple food logs by IDs |
| `get_food_calories_stats` | Get calorie stats for a date |
| `get_food_protein_stats` | Get protein stats for a date |
| `get_food_carbs_stats` | Get carbs stats for a date |

### Blood Pressure (5 tools)

| Tool | Description |
|------|-------------|
| `list_blood_pressure_logs` | List blood pressure logs, optionally filtered by date range |
| `create_blood_pressure_log` | Create a blood pressure log (systolic/diastolic) |
| `get_blood_pressure_log` | Get a single blood pressure log by ID |
| `update_blood_pressure_log` | Update an existing blood pressure log |
| `delete_blood_pressure_log` | Delete a blood pressure log by ID |

## License

See individual packages for license details. The SDK is licensed under MIT — see [`packages/benji-sdk/LICENSE`](packages/benji-sdk/LICENSE).
