# Story 1.1: Convert to pnpm workspace monorepo

Status: review

## Story

As a developer,
I want the repo structured as a monorepo with `packages/benji-sdk`, `packages/benji-mcp`, and `packages/benji-cli`,
so that packages share dependencies and build together.

## Acceptance Criteria

1. **AC-1: Workspace installs correctly**
   - **Given** the repo root
   - **When** I run `pnpm install`
   - **Then** all workspace packages install correctly with no errors

2. **AC-2: SDK builds with no API changes**
   - **Given** benji-sdk source in `packages/benji-sdk/`
   - **When** I run `pnpm build` (or `pnpm --filter benji-sdk build`)
   - **Then** the SDK builds successfully with no changes to its public API (all existing exports from `src/index.ts` remain identical)

3. **AC-3: Root workspace config exists**
   - **And** root `pnpm-workspace.yaml` defines `packages/*`

4. **AC-4: SDK files preserved**
   - **And** existing SDK is moved to `packages/benji-sdk/` preserving all files: `src/`, `openapi.json`, `openapi-ts.config.ts`, `fix-imports.mjs`, `tsconfig.json`, `package.json`, `README.md`, `LICENSE`

5. **AC-5: Root scripts work**
   - **And** root `package.json` has workspace-level scripts: `build`, `clean`, `generate` that operate across all packages

## Tasks / Subtasks

### Task Group A: Root workspace setup (AC: #3, #5)

- [x] **Task 1: Create `pnpm-workspace.yaml`** (AC: #3)
  - Create file at repo root with content:
    ```yaml
    packages:
      - "packages/*"
    ```

- [x] **Task 2: Create root `package.json`** (AC: #5)
  - Replace current root `package.json` with a workspace root version:
    - `"name": "benji-monorepo"` (private, not published)
    - `"private": true`
    - `"type": "module"`
    - `"scripts"`:
      - `"build": "pnpm -r build"` (recursive build across all packages)
      - `"clean": "pnpm -r clean"` (recursive clean)
      - `"generate": "pnpm --filter benji-sdk generate"` (SDK-specific codegen)
    - `"engines": { "node": ">=18", "pnpm": ">=9" }`
    - No `dependencies` or `devDependencies` at root (all deps go in packages)
  - **Important:** The current root `package.json` content becomes the basis for `packages/benji-sdk/package.json` (see Task 4)

- [x] **Task 3: Create root `.npmrc`** (AC: #1)
  - Create `.npmrc` at repo root with:
    ```
    link-workspace-packages=true
    prefer-workspace-packages=true
    ```

### Task Group B: Move SDK to `packages/benji-sdk/` (AC: #2, #4)

- [x] **Task 4: Create `packages/benji-sdk/` directory and move SDK files** (AC: #4)
  - Create directory: `packages/benji-sdk/`
  - Move these files from repo root into `packages/benji-sdk/`:
    - `src/` (entire directory)
    - `openapi.json`
    - `openapi-ts.config.ts`
    - `fix-imports.mjs`
    - `README.md`
    - `LICENSE`
  - **Do NOT move:** `pnpm-lock.yaml` (stays at root), `.gitignore` (stays at root), `_bmad/`, `_bmad-output/`, `.claude/`, `.git/`

- [x] **Task 5: Create `packages/benji-sdk/package.json`** (AC: #2, #4)
  - Based on the current root `package.json` with these adjustments:
    ```json
    {
      "name": "benji-sdk",
      "version": "0.1.1",
      "description": "Official TypeScript SDK for the Benji API - Your personal life operating system",
      "type": "module",
      "main": "./dist/index.js",
      "module": "./dist/index.js",
      "types": "./dist/index.d.ts",
      "exports": {
        ".": {
          "import": "./dist/index.js",
          "types": "./dist/index.d.ts"
        }
      },
      "files": ["dist"],
      "scripts": {
        "generate": "openapi-ts",
        "fix-imports": "node fix-imports.mjs",
        "build": "pnpm generate && pnpm fix-imports && tsc",
        "clean": "rm -rf dist",
        "prepublishOnly": "pnpm build"
      },
      "keywords": ["benji", "api", "sdk", "typescript"],
      "author": "Kitze",
      "license": "MIT",
      "repository": {
        "type": "git",
        "url": "git+https://github.com/kitze/benji-sdk.git",
        "directory": "packages/benji-sdk"
      },
      "devDependencies": {
        "@hey-api/openapi-ts": "0.90.0",
        "typescript": "^5.5.0"
      }
    }
    ```
  - Key change: added `"directory"` to repository, added `"clean"` script
  - All existing fields preserved exactly

- [x] **Task 6: Create `packages/benji-sdk/tsconfig.json`** (AC: #2)
  - Identical to the current root `tsconfig.json`:
    ```json
    {
      "compilerOptions": {
        "target": "ES2020",
        "module": "ESNext",
        "moduleResolution": "bundler",
        "declaration": true,
        "declarationMap": true,
        "outDir": "./dist",
        "rootDir": "./src",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true
      },
      "include": ["src/**/*"],
      "exclude": ["node_modules", "dist"]
    }
    ```
  - No changes needed since all paths are relative and already correct

### Task Group C: Scaffold empty MCP and CLI packages (AC: #1)

- [x] **Task 7: Create `packages/benji-mcp/` scaffold** (AC: #1)
  - Create `packages/benji-mcp/package.json`:
    ```json
    {
      "name": "benji-mcp",
      "version": "0.1.0",
      "description": "MCP server for Benji API",
      "type": "module",
      "private": true,
      "main": "./dist/index.js",
      "types": "./dist/index.d.ts",
      "scripts": {
        "build": "tsc",
        "clean": "rm -rf dist",
        "dev": "node --loader ts-node/esm src/index.ts"
      },
      "dependencies": {
        "benji-sdk": "workspace:*"
      },
      "devDependencies": {
        "typescript": "^5.5.0"
      }
    }
    ```
  - Create `packages/benji-mcp/tsconfig.json`:
    ```json
    {
      "compilerOptions": {
        "target": "ES2020",
        "module": "ESNext",
        "moduleResolution": "bundler",
        "declaration": true,
        "outDir": "./dist",
        "rootDir": "./src",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true
      },
      "include": ["src/**/*"],
      "exclude": ["node_modules", "dist"]
    }
    ```
  - Create `packages/benji-mcp/src/index.ts`:
    ```ts
    // benji-mcp - MCP server for Benji API
    // This is a placeholder entry point. Implementation in Story 2.1.
    export {};
    ```

- [x] **Task 8: Create `packages/benji-cli/` scaffold** (AC: #1)
  - Create `packages/benji-cli/package.json`:
    ```json
    {
      "name": "benji-cli",
      "version": "0.1.0",
      "description": "CLI for Benji API",
      "type": "module",
      "private": true,
      "main": "./dist/index.js",
      "types": "./dist/index.d.ts",
      "bin": {
        "benji": "./dist/index.js"
      },
      "scripts": {
        "build": "tsc",
        "clean": "rm -rf dist"
      },
      "dependencies": {
        "benji-sdk": "workspace:*"
      },
      "devDependencies": {
        "typescript": "^5.5.0"
      }
    }
    ```
  - Create `packages/benji-cli/tsconfig.json`:
    ```json
    {
      "compilerOptions": {
        "target": "ES2020",
        "module": "ESNext",
        "moduleResolution": "bundler",
        "declaration": true,
        "outDir": "./dist",
        "rootDir": "./src",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true
      },
      "include": ["src/**/*"],
      "exclude": ["node_modules", "dist"]
    }
    ```
  - Create `packages/benji-cli/src/index.ts`:
    ```ts
    // benji-cli - CLI for Benji API
    // This is a placeholder entry point. Implementation in Story 6.1.
    export {};
    ```

### Task Group D: Cleanup and validation (AC: #1, #2, #5)

- [x] **Task 9: Update root `.gitignore`** (AC: #4)
  - Update `.gitignore` to include:
    ```
    node_modules/
    dist/
    *.log
    .DS_Store
    ```
  - The `dist/` entry ensures all package `dist/` directories are ignored
  - Remove the existing `dist/` directory from the repo root if present (it was the old SDK build output)

- [x] **Task 10: Delete stale root files** (AC: #4)
  - Remove from repo root (they have been moved to `packages/benji-sdk/`):
    - `src/` directory
    - `openapi.json`
    - `openapi-ts.config.ts`
    - `fix-imports.mjs`
    - `tsconfig.json` (root no longer needs one; each package has its own)
  - Keep at root: `pnpm-lock.yaml`, `.gitignore`, `pnpm-workspace.yaml`, `.npmrc`, root `package.json`

- [x] **Task 11: Run `pnpm install` and verify** (AC: #1)
  - Delete existing `node_modules/` and `pnpm-lock.yaml`
  - Run `pnpm install` from repo root
  - Verify: no errors, `node_modules/` created at root, workspace symlinks created for `benji-sdk` in `benji-mcp` and `benji-cli` node_modules

- [x] **Task 12: Run `pnpm build` and verify SDK output** (AC: #2, #5)
  - Run `pnpm build` from repo root (executes recursive build)
  - Verify: `packages/benji-sdk/dist/` is created with `index.js`, `index.d.ts`, and all generated files
  - Verify: `packages/benji-mcp/dist/` is created with `index.js`
  - Verify: `packages/benji-cli/dist/` is created with `index.js`
  - Verify: SDK public API unchanged by checking exports in `packages/benji-sdk/dist/index.d.ts` match the original `dist/index.d.ts`

- [x] **Task 13: Verify `pnpm --filter` commands work** (AC: #2)
  - Run `pnpm --filter benji-sdk build` — should succeed
  - Run `pnpm --filter benji-mcp build` — should succeed
  - Run `pnpm --filter benji-cli build` — should succeed
  - Run `pnpm --filter benji-sdk generate` — should succeed (runs openapi-ts codegen)

## Dev Notes

### Architecture Constraints

- **ESM-only:** All packages use `"type": "module"`. No CommonJS.
- **TypeScript 5.5+:** Using `"module": "ESNext"` and `"moduleResolution": "bundler"`.
- **Target:** `ES2020` across all packages.
- **Code generation:** The SDK uses `@hey-api/openapi-ts` v0.90.0 to generate client code from `openapi.json`. The `fix-imports.mjs` script patches generated imports to add `.js` extensions for ESM compatibility. This build pipeline (`generate` -> `fix-imports` -> `tsc`) must remain intact.
- **No root tsconfig.json:** Each package owns its own `tsconfig.json`. A root `tsconfig.json` is not needed and could cause confusion. If project references are desired later, that is a separate concern.
- **pnpm workspace protocol:** MCP and CLI packages reference the SDK via `"benji-sdk": "workspace:*"`. This creates symlinks during `pnpm install` so imports resolve locally.

### Key Files Being Relocated

| File | From (root) | To (packages/benji-sdk/) |
|------|-------------|--------------------------|
| `src/` | `./src/` | `./packages/benji-sdk/src/` |
| `openapi.json` | `./openapi.json` | `./packages/benji-sdk/openapi.json` |
| `openapi-ts.config.ts` | `./openapi-ts.config.ts` | `./packages/benji-sdk/openapi-ts.config.ts` |
| `fix-imports.mjs` | `./fix-imports.mjs` | `./packages/benji-sdk/fix-imports.mjs` |
| `tsconfig.json` | `./tsconfig.json` | `./packages/benji-sdk/tsconfig.json` |
| `README.md` | `./README.md` | `./packages/benji-sdk/README.md` |
| `LICENSE` | `./LICENSE` | `./packages/benji-sdk/LICENSE` |

### Potential Pitfalls

1. **`openapi-ts.config.ts` paths:** The config references `"./openapi.json"` and outputs to `"src/client"`. Both are relative paths that will work correctly from `packages/benji-sdk/` without modification.
2. **`fix-imports.mjs` hardcoded path:** It uses `const srcDir = './src'` which is relative and will work correctly from `packages/benji-sdk/`.
3. **pnpm-lock.yaml:** Must stay at the repo root. Deleting and regenerating it is the cleanest approach when restructuring workspaces.
4. **`dist/` at root:** The old build output `dist/` at the repo root should be deleted. Each package will have its own `dist/`.
5. **Build order:** pnpm resolves workspace dependency topology automatically. Since `benji-mcp` and `benji-cli` depend on `benji-sdk`, pnpm will build `benji-sdk` first when running `pnpm -r build`.

### Dependency Versions (Current as of 2026-03-27)

| Package | Version | Notes |
|---------|---------|-------|
| `@hey-api/openapi-ts` | 0.90.0 | Pinned in current SDK, keep as-is |
| `typescript` | ^5.5.0 | Shared across all packages |
| `@modelcontextprotocol/sdk` | 1.28.0 | Latest — NOT needed in this story, added in Story 2.1 |
| `commander` | 14.0.3 | Latest — NOT needed in this story, added in Story 6.1 |

### Project Structure Notes

**Target directory layout after this story:**

```
benji-sdk/                          (repo root)
├── .gitignore
├── .npmrc                          (NEW)
├── package.json                    (workspace root, private)
├── pnpm-workspace.yaml             (NEW)
├── pnpm-lock.yaml
├── _bmad/                          (unchanged)
├── _bmad-output/                   (unchanged)
├── .claude/                        (unchanged)
└── packages/
    ├── benji-sdk/                  (MOVED from root)
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── openapi.json
    │   ├── openapi-ts.config.ts
    │   ├── fix-imports.mjs
    │   ├── README.md
    │   ├── LICENSE
    │   └── src/
    │       ├── index.ts
    │       ├── client.gen.ts
    │       ├── sdk.gen.ts
    │       ├── types.gen.ts
    │       ├── client/
    │       │   ├── index.ts
    │       │   ├── sdk.gen.ts
    │       │   ├── types.gen.ts
    │       │   └── client.gen.ts
    │       └── core/
    ├── benji-mcp/                  (NEW scaffold)
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── src/
    │       └── index.ts
    └── benji-cli/                  (NEW scaffold)
        ├── package.json
        ├── tsconfig.json
        └── src/
            └── index.ts
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 1, Story 1.1]
- [Source: package.json (root) — current SDK package config]
- [Source: tsconfig.json (root) — current TypeScript config]
- [Source: openapi-ts.config.ts — codegen config with relative paths]
- [Source: fix-imports.mjs — ESM import fixer with relative `./src` path]
- [Source: src/index.ts — SDK entry point with `configure()` and re-exports]
- [Source: pnpm.io/workspaces — pnpm workspace documentation]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List

- All 13 tasks completed successfully
- `pnpm install` succeeds with workspace resolution for all 4 projects
- `pnpm build` succeeds: SDK runs generate -> fix-imports -> tsc pipeline; MCP and CLI build with tsc
- `pnpm --filter benji-sdk build`, `pnpm --filter benji-mcp build`, `pnpm --filter benji-cli build` all succeed
- `pnpm --filter benji-sdk generate` succeeds (openapi-ts codegen)
- SDK public API preserved unchanged in packages/benji-sdk/dist/

### File List

- pnpm-workspace.yaml (NEW - workspace config)
- .npmrc (NEW - workspace link settings)
- package.json (REPLACED - workspace root, private)
- .gitignore (UPDATED - added dist/ pattern)
- packages/benji-sdk/package.json (NEW - SDK package config)
- packages/benji-sdk/tsconfig.json (MOVED from root)
- packages/benji-sdk/openapi.json (MOVED from root)
- packages/benji-sdk/openapi-ts.config.ts (MOVED from root)
- packages/benji-sdk/fix-imports.mjs (MOVED from root)
- packages/benji-sdk/README.md (MOVED from root)
- packages/benji-sdk/LICENSE (MOVED from root)
- packages/benji-sdk/src/ (MOVED from root)
- packages/benji-mcp/package.json (NEW - MCP scaffold)
- packages/benji-mcp/tsconfig.json (NEW - MCP scaffold)
- packages/benji-mcp/src/index.ts (NEW - MCP placeholder)
- packages/benji-cli/package.json (NEW - CLI scaffold)
- packages/benji-cli/tsconfig.json (NEW - CLI scaffold)
- packages/benji-cli/src/index.ts (NEW - CLI placeholder)
- DELETED: root src/, openapi.json, openapi-ts.config.ts, fix-imports.mjs, tsconfig.json, dist/
