# Story 7.1: README and MCP usage docs

**Story key:** `7-1-readme-and-mcp-usage-docs`
**Epic:** 7 (Documentation & Polish)
**Status:** done

## Story

As a developer,
I want README sections documenting MCP setup with config snippets for Cursor and Claude Code,
so that I can get started quickly with the Benji MCP server and understand the full SDK/CLI/MCP surface.

## Prerequisites

- **Epic 2** — MCP Server Phase 1 (`done`): Core resource tools (todos, tags, projects, todo-lists, habits, mood)
- **Epic 3** — MCP Server Phase 2 (`done`): Health/wellness resource tools (hydration, fasting, workouts, journal, pain-events)
- **Epic 5** — MCP Server Phase 3 (`done`): Alpha API resource tools (weight-logs, todo-views, project-sections, todo-list-sections, goals, contacts, food, blood-pressure)
- **Epic 6** — CLI (`done`): All 19 resource command domains with `--json` and `--compact` output

## Background

The project currently has **no root-level README.md** and **no root-level CLAUDE.md**. The only existing README is `packages/benji-sdk/README.md`, which documents the TypeScript SDK only (installation, quick start, available modules, examples). The monorepo contains three packages:

| Package | Path | Entry point | Description |
|---------|------|-------------|-------------|
| `benji-sdk` | `packages/benji-sdk/` | `dist/index.js` | Auto-generated TypeScript SDK from OpenAPI spec |
| `benji-mcp` | `packages/benji-mcp/` | `dist/index.js` (bin: `benji-mcp`) | MCP server, stdio transport, 19 resource tool domains |
| `benji-cli` | `packages/benji-cli/` | `dist/index.js` (bin: `benji`) | CLI with Commander.js, 19 resource command domains |

Auth is via `BENJI_API_KEY` env var (required) and optional `BENJI_BASE_URL` override. The MCP server name is `benji-mcp`. The CLI binary is `benji`.

**19 MCP tool domains** (each in `packages/benji-mcp/src/tools/<domain>.ts`): todos, tags, projects, todo-lists, habits, mood, hydration, fasting, workouts, journal, pain-events, weight-logs, todo-views, project-sections, todo-list-sections, goals, contacts, food, blood-pressure.

## Acceptance Criteria

1. **AC-1: Root README exists with project overview**
   Given a new developer visiting the repository,
   When they open `README.md` at the project root,
   Then they see a clear project overview explaining the monorepo structure (SDK, MCP, CLI), what Benji is, and how the three packages relate.

2. **AC-2: MCP setup section with Cursor config snippet**
   Given a developer using Cursor IDE,
   When they read the MCP setup section in the root README,
   Then they find a copy-paste-ready `~/.cursor/mcp.json` config snippet that:
   - Specifies the `benji-mcp` server command and args
   - Shows where to set `BENJI_API_KEY`
   - Works with the built `dist/index.js` entry point

3. **AC-3: MCP setup section with Claude Code config snippet**
   Given a developer using Claude Code,
   When they read the MCP setup section in the root README,
   Then they find a copy-paste-ready MCP configuration snippet for Claude Code (`.claude/settings.json` or `claude_desktop_config.json` format) that:
   - Specifies the `benji-mcp` server via stdio transport
   - Shows where to set `BENJI_API_KEY`
   - Works with the built `dist/index.js` entry point

4. **AC-4: Example tool calls and expected responses**
   Given a developer who has configured the MCP server,
   When they read the examples section,
   Then they see at least 3 concrete example MCP tool calls (e.g., `list_todos`, `create_todo`, `list_habits`) with:
   - The tool name as registered in the MCP server
   - Example input parameters (JSON)
   - A representative expected response shape (JSON)

5. **AC-5: CLI quick-start section**
   Given a developer who wants to use the CLI,
   When they read the CLI section in the root README,
   Then they see:
   - Installation/build instructions
   - Auth setup (`export BENJI_API_KEY=...`)
   - At least 3 example commands (e.g., `benji todos list`, `benji habits list`, `benji tags list`)
   - Explanation of `--json` and `--compact` global flags

6. **AC-6: SDK section references existing SDK README**
   Given a developer who wants to use the SDK directly,
   When they read the SDK section in the root README,
   Then they find a brief summary of SDK capabilities and a link/reference to `packages/benji-sdk/README.md` for full documentation.

7. **AC-7: Environment variables documented**
   Given a developer setting up any package,
   When they read the environment variables section,
   Then they find a table listing:
   - `BENJI_API_KEY` (required) with description and how to obtain it
   - `BENJI_BASE_URL` (optional) with description and default value

8. **AC-8: Available MCP tools reference table**
   Given a developer evaluating which tools are available,
   When they read the MCP tools reference section,
   Then they find a table or list organized by domain (todos, tags, projects, etc.) showing all registered tool names across the 19 domains.

9. **AC-9: Build instructions**
   Given a developer cloning the repo for the first time,
   When they read the getting started section,
   Then they find step-by-step instructions for:
   - Cloning the repo
   - Running `pnpm install`
   - Running `pnpm build` (builds all packages)
   - Verifying the build succeeded

10. **AC-10: No broken links or placeholder text**
    Given the completed README,
    When a reviewer inspects the document,
    Then there are zero placeholder strings (e.g., `TODO`, `TBD`, `{{variable}}`), and all referenced file paths exist in the repo.

## Tasks / Subtasks

### Task Group A: Root README scaffolding and overview (AC: #1, #9)

- [x] **A.1** Create `/README.md` at the project root with the following top-level sections (headers only as scaffold):
  - Project title and one-line description
  - Table of contents
  - Overview / What is Benji
  - Monorepo structure table
  - Getting Started (prerequisites, clone, install, build)
  - MCP Server Setup
  - CLI Usage
  - SDK
  - Environment Variables
  - Available MCP Tools
  - License

- [x] **A.2** Write the **Overview** section: explain Benji as a personal life OS, explain that this monorepo provides a TypeScript SDK (auto-generated from OpenAPI), an MCP server for AI assistants, and a CLI for terminal usage. (AC: #1)

- [x] **A.3** Write the **Monorepo Structure** section: table with columns for Package, Path, Description. Three rows for `benji-sdk`, `benji-mcp`, `benji-cli`. (AC: #1)

- [x] **A.4** Write the **Getting Started** section: prerequisites (Node.js >=20.19.0, pnpm >=9), clone, `pnpm install`, `pnpm build`, verify with `pnpm --filter benji-mcp dev` or `benji --help`. (AC: #9)

### Task Group B: MCP Server documentation (AC: #2, #3, #4, #8)

- [x] **B.1** Write the **MCP Server Setup** section intro: explain stdio transport, what `benji-mcp` does, and that `BENJI_API_KEY` must be set. (AC: #2, #3)

- [x] **B.2** Write the **Cursor IDE** config snippet subsection: provide a complete `~/.cursor/mcp.json` example:
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
  Include a note about replacing the absolute path and API key. (AC: #2)

- [x] **B.3** Write the **Claude Code** config snippet subsection: provide the Claude Code MCP config format (`.claude/settings.json` or `claude_desktop_config.json`):
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
  Include note about the stdio transport being automatic. (AC: #3)

- [x] **B.4** Write the **Example Tool Calls** subsection with at least 3 examples. Each example must show the tool name, input JSON, and a representative response JSON shape. Suggested examples:
  - `list_todos` with `{ "screen": "today" }` input
  - `create_todo` with `{ "title": "Buy groceries", "priority": "high" }` input
  - `list_habits` with `{}` input
  Include a note that responses are structured JSON with consistent shapes. (AC: #4)

- [x] **B.5** Write the **Available MCP Tools** reference section: a table or grouped list organized by domain. For each of the 19 domains, list the tool names as registered in the MCP server. Source tool names from `packages/benji-mcp/src/tools/*.ts` files. (AC: #8)

### Task Group C: CLI documentation (AC: #5)

- [x] **C.1** Write the **CLI Usage** section: build instructions (`pnpm --filter benji-cli build`), auth setup (`export BENJI_API_KEY=...`), basic usage pattern (`benji <resource> <action> [options]`). (AC: #5)

- [x] **C.2** Write CLI example commands subsection with at least 3 examples:
  - `benji todos list --screen today`
  - `benji habits list`
  - `benji tags create --name "urgent"`
  Show example with `--json` flag and `--compact` flag. (AC: #5)

- [x] **C.3** Document the `--json` and `--compact` global flags: explain that `--json` outputs machine-parseable JSON, default output is human-readable tables, and `--compact` gives minimal output (IDs only) suitable for scripting. (AC: #5)

### Task Group D: SDK and environment sections (AC: #6, #7)

- [x] **D.1** Write the **SDK** section: brief summary (auto-generated from OpenAPI, TypeScript-first, ESM-only), link to `packages/benji-sdk/README.md` for full documentation including quick start, available modules, and examples. (AC: #6)

- [x] **D.2** Write the **Environment Variables** section as a table:
  | Variable | Required | Description | Default |
  |----------|----------|-------------|---------|
  | `BENJI_API_KEY` | Yes | API key from https://app.benji.so/settings | (none) |
  | `BENJI_BASE_URL` | No | Override API base URL for self-hosted instances | `https://api.benji.so/api/rest` |
  (AC: #7)

### Task Group E: Final review and validation (AC: #10)

- [x] **E.1** Review the complete README for placeholder text (`TODO`, `TBD`, `{{`), broken internal links, and consistency in formatting. (AC: #10)

- [x] **E.2** Verify all referenced file paths exist in the repo (e.g., `packages/benji-sdk/README.md`, `packages/benji-mcp/dist/index.js` after build, `packages/benji-cli/dist/index.js` after build). (AC: #10)

- [x] **E.3** Verify `pnpm build` still succeeds with the new README in place (no build interference). (AC: #10)

## Parallelizable Work Groups

| Group | Tasks | Depends on | Notes |
|-------|-------|------------|-------|
| **GA** | A.1 (scaffold) | Nothing | Creates the file structure; must go first. |
| **GB** | A.2, A.3, A.4 | GA | Overview and getting-started sections; can be written in parallel with each other. |
| **GC** | B.1, B.2, B.3, B.4, B.5 | GA | MCP docs; all subtasks can be written in parallel, then assembled. |
| **GD** | C.1, C.2, C.3 | GA | CLI docs; all subtasks can be written in parallel, then assembled. |
| **GE** | D.1, D.2 | GA | SDK and env var docs; can be written in parallel. |
| **GF** | E.1, E.2, E.3 | GB, GC, GD, GE | Final validation pass after all content is in place. |

**Key parallelization opportunity:** After GA lands the scaffold, groups GB, GC, GD, and GE are fully independent and can be implemented simultaneously by different agents or in any order. GF is the final gate.

## Dev Notes

### This is a documentation-only story

No application code is written or modified. The deliverable is a single file: `/README.md` at the project root. The existing `packages/benji-sdk/README.md` must NOT be modified (it is the published SDK README).

### File map

| File | Action | Purpose |
|------|--------|---------|
| `/README.md` | **Create** | Root monorepo README with all sections |
| `/packages/benji-sdk/README.md` | Read-only reference | Existing SDK docs to link to |
| `/packages/benji-mcp/src/tools/*.ts` | Read-only reference | Source of truth for MCP tool names |
| `/packages/benji-mcp/package.json` | Read-only reference | MCP server metadata (name, bin, version) |
| `/packages/benji-cli/package.json` | Read-only reference | CLI metadata (name, bin, version) |
| `/packages/benji-cli/src/index.ts` | Read-only reference | CLI global options (`--json`, `--compact`) |
| `/packages/benji-sdk/src/env.ts` | Read-only reference | Environment variable handling logic |

### MCP tool naming convention

Tools are registered as snake_case names in the MCP server (e.g., `list_todos`, `create_todo`, `update_tag`, `delete_project`). The pattern is `<action>_<resource>` or `<action>_<resource>_<qualifier>`. Extract exact names from the `server.registerTool()` calls in each tool file.

### MCP config format notes

- **Cursor IDE**: Config lives at `~/.cursor/mcp.json`. The format uses `"mcpServers"` key with named server entries containing `command`, `args`, and `env`.
- **Claude Code**: MCP servers can be configured in `.claude/settings.json` (project-level) or `~/.claude/settings.json` (global). The format uses `"mcpServers"` key similarly.
- **Claude Desktop**: Config lives at `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or equivalent. Same `"mcpServers"` format.
- All configs use stdio transport implicitly when specifying `command` + `args`.

### CLI global options

The CLI supports two global flags registered in `packages/benji-cli/src/index.ts`:
- `--json` — outputs results as structured JSON (pretty-printed)
- `--compact` — minimal output (IDs only), suitable for piping to `xargs` or scripts

### Previous learnings from Epic 6

- The CLI uses `getGlobalOptions(cmd)` to detect `--json` and `--compact` flags by walking up the Commander chain to the root program.
- Error handling branches on JSON vs. human text output via `process.argv.includes("--json")` in `error-handler.ts`.
- All 19 resource domains share the same output formatting pipeline via `outputResult(data, opts)`.

### Project Structure Notes

- Monorepo uses pnpm workspaces defined in `pnpm-workspace.yaml` with `packages/*` glob
- Root `package.json` has workspace-level scripts: `build` (recursive), `clean` (recursive), `generate` (SDK only)
- ESM-only throughout (`"type": "module"` in all package.json files)
- TypeScript 5.5+ with bundler moduleResolution
- Node.js >=20.19.0, pnpm >=9
- No existing root README.md or CLAUDE.md files

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 7] — Epic 7 stories and acceptance criteria
- [Source: _bmad-output/planning-artifacts/epics.md#FR16-FR18] — Documentation functional requirements
- [Source: packages/benji-sdk/README.md] — Existing SDK documentation
- [Source: packages/benji-mcp/src/server.ts] — MCP server creation with all 19 tool registrations
- [Source: packages/benji-mcp/src/index.ts] — MCP entry point with env initialization
- [Source: packages/benji-mcp/package.json] — MCP package metadata (bin: `benji-mcp`)
- [Source: packages/benji-cli/src/index.ts] — CLI entry point with `--json` and `--compact` global flags
- [Source: packages/benji-cli/package.json] — CLI package metadata (bin: `benji`)
- [Source: packages/benji-sdk/src/env.ts] — `initializeFromEnv()` reads `BENJI_API_KEY` and `BENJI_BASE_URL`
- [Source: package.json] — Root monorepo package with workspace scripts
- [Source: pnpm-workspace.yaml] — Workspace configuration

## Definition of Done

- [x] All acceptance criteria (AC-1 through AC-10) satisfied
- [x] `/README.md` exists at project root with all required sections
- [x] No placeholder text or broken references in the document
- [x] `pnpm build` still passes
- [x] Story status advanced via team workflow (`in-progress` -> `review` -> `done`)
- [x] `sprint-status.yaml` updated when story completes

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List

- All 17 tasks (A.1-A.4, B.1-B.5, C.1-C.3, D.1-D.2, E.1-E.3) completed in a single pass.
- README contains 101 tool names across 19 domains, all sourced from `server.registerTool()` calls in the actual source files.
- 4 example tool calls provided (list_todos, create_todo, list_habits, start_fast) -- exceeds the AC-4 minimum of 3.
- MCP config snippets provided for Cursor IDE, Claude Code, and Claude Desktop.
- CLI section includes 8 example commands with --json and --compact flag demonstrations.
- E.1: grep for TODO/TBD/{{ found zero matches.
- E.2: All three referenced dist files confirmed to exist after build.
- E.3: `pnpm build` succeeds cleanly (all 3 packages).

### Senior Developer Review (AI)

**Review result:** CHANGES_REQUESTED (5 findings, all resolved)

| ID | Severity | Category | Fix Applied |
|----|----------|----------|-------------|
| F1 | HIGH | ACCURACY | Fixed BENJI_BASE_URL default from `api.benji.so` to `app.benji.so` (AC-7) |
| F2 | MEDIUM | DOCUMENTATION | Added merge note for Claude Code config snippet (AC-3) |
| F3 | MEDIUM | DOCUMENTATION | Updated License section to reference `packages/benji-sdk/LICENSE` (AC-10) |
| F4 | MEDIUM | ACCURACY | Fixed clone URL from `kitze/benji-sdk` to `dneighbors/benji-sdk` (AC-9) |
| F5 | LOW | FORMATTING | No change — subtitle already covers scope (AC-1) |

### Review Follow-ups (AI)

- [x] F1: Fix BENJI_BASE_URL default value
- [x] F2: Add merge note for Claude Code config
- [x] F3: Fix License section
- [x] F4: Fix clone URL
- [x] F5: Assessed, no change needed

### File List

- `/README.md` -- **Created** -- Root monorepo README (all sections)
- `_bmad-output/sprint-artifacts/7-1-readme-and-mcp-usage-docs.md` -- **Modified** -- Task checkboxes marked, Dev Agent Record updated
- `_bmad-output/sprint-artifacts/sprint-status.yaml` -- **Modified** -- Story status updates

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-03-29 | Initial implementation — all 17 tasks completed | Dev Agent |
| 2026-03-29 | Review fixes — 4 corrections applied (F1-F4) | Orchestrator |
