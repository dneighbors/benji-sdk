# Story 4.2: Regenerate SDK and fix build

Status: done

## Story

As a developer,
I want the SDK regenerated from the updated spec,
so that new resource classes are available.

## Acceptance Criteria

1. **AC-1: Code generation succeeds**
   - **Given** the updated `openapi.json` (244 paths, OpenAPI 3.1.0, from Story 4-1)
   - **When** I run `pnpm --filter benji-sdk generate` (which runs `openapi-ts`)
   - **Then** the code generator completes without fatal errors
   - **And** the generated files exist: `src/client/sdk.gen.ts`, `src/client/types.gen.ts`, `src/client/index.ts`

2. **AC-2: ESM import fix works**
   - **Given** the regenerated TypeScript files in `src/client/`
   - **When** I run `pnpm --filter benji-sdk fix-imports` (which runs `node fix-imports.mjs`)
   - **Then** all relative imports in `src/` have `.js` extensions for ESM compatibility
   - **And** the script completes without errors

3. **AC-3: TypeScript compilation succeeds**
   - **Given** the regenerated and import-fixed source files
   - **When** I run `tsc` (via the build pipeline)
   - **Then** compilation succeeds with zero errors
   - **And** output is written to `dist/`

4. **AC-4: Full SDK build passes end-to-end**
   - **Given** a clean state
   - **When** I run `pnpm --filter benji-sdk build` (which runs `generate && fix-imports && tsc`)
   - **Then** the entire pipeline completes successfully

5. **AC-5: Existing SDK classes preserved**
   - **Given** the regenerated `src/client/sdk.gen.ts`
   - **When** I inspect the exported classes
   - **Then** all 17 existing classes are still present: `Mood`, `PainEvents`, `Trips`, `PackingActivities`, `PackingItems`, `Transports`, `Stays`, `Todos`, `Assignments`, `Tags`, `Projects`, `TodoLists`, `Habits`, `Hydration`, `Fasting`, `Workouts`, `Journal`
   - **And** their method signatures have not been removed (methods may have been added or updated, but not deleted)

6. **AC-6: New resource classes generated**
   - **Given** the regenerated `src/client/sdk.gen.ts`
   - **When** I inspect the exported classes
   - **Then** new classes exist for alpha resources (exact names determined by code generator from the 23 new resource prefixes discovered in Story 4-1)

7. **AC-7: Hand-written files untouched**
   - **Given** the regeneration process
   - **Then** these hand-written files are NOT modified by the generator:
     - `src/errors.ts`
     - `src/wrapper.ts`
     - `src/env.ts`
     - `src/index.ts` (top-level re-export file)
   - **And** `src/index.ts` still exports: `BenjiError`, `BenjiConfigError`, `BenjiApiError`, `initializeFromEnv`, `wrapSdkCall`, `configure`, `client`

8. **AC-8: Downstream packages build**
   - **Given** the rebuilt `benji-sdk`
   - **When** I run `pnpm build` (root-level recursive build)
   - **Then** `benji-mcp` compiles successfully
   - **And** all existing MCP tool imports still resolve: `Todos`, `Tags`, `Projects`, `TodoLists`, `Habits`, `Mood`, `Hydration`, `Fasting`, `Workouts`, `Journal`, `PainEvents`, `wrapSdkCall`, `BenjiApiError`, `initializeFromEnv`, `BenjiConfigError`

## Tasks / Subtasks

### Task 1: Run SDK code generation (AC: #1)

- [x] **Run `pnpm --filter benji-sdk generate`**
  - This executes `openapi-ts` which reads `packages/benji-sdk/openapi.json` and generates:
    - `src/client/sdk.gen.ts` -- SDK service classes with static methods
    - `src/client/types.gen.ts` -- TypeScript types for all request/response shapes
    - `src/client/index.ts` -- barrel export file
    - `src/client/client.gen.ts` -- client configuration (may be regenerated)
  - The generator config is in `packages/benji-sdk/openapi-ts.config.ts`:
    ```typescript
    defineConfig({
      input: "./openapi.json",
      output: { path: "src/client", format: "prettier" },
      plugins: ["@hey-api/typescript", { name: "@hey-api/sdk", asClass: true }],
    })
    ```
  - **If the generator fails**: check for OpenAPI 3.1.0 compatibility issues with `@hey-api/openapi-ts` v0.90.0. The spec went from 131 to 244 paths; warnings are expected but should not be fatal.
  - **If warnings appear about duplicate operationIds or schema conflicts**: note them but proceed unless they are fatal errors.

- [x] **Verify generated files exist**
  - Confirm these files were created/updated:
    - `packages/benji-sdk/src/client/sdk.gen.ts`
    - `packages/benji-sdk/src/client/types.gen.ts`
    - `packages/benji-sdk/src/client/index.ts`
    - `packages/benji-sdk/src/client/client.gen.ts`
  - Check that `sdk.gen.ts` contains `export class` declarations (not an empty or error file)

### Task 2: Run ESM import fix (AC: #2)

- [x] **Run `pnpm --filter benji-sdk fix-imports`**
  - This executes `node fix-imports.mjs` which walks `src/` and adds `.js` extensions to relative imports
  - The script handles both file imports (adds `.js`) and directory imports (adds `/index.js`)
  - **Expected behavior**: The script should report the number of files fixed
  - **If the script fails**: Check whether the generated code structure has changed (e.g., new subdirectories under `src/client/`). The script walks all `.ts` files in `src/` recursively, so new files should be covered automatically.

- [x] **Spot-check a few generated files for `.js` extensions**
  - Open `src/client/sdk.gen.ts` and verify relative imports end with `.js`
  - Open `src/client/index.ts` and verify relative imports end with `.js`

### Task 3: Run TypeScript compilation (AC: #3)

- [x] **Run `tsc` from `packages/benji-sdk/`**
  - The tsconfig uses: `target: ES2020`, `module: ESNext`, `moduleResolution: bundler`, `strict: true`
  - Output goes to `dist/`
  - **If compilation fails with type errors in generated code**:
    - Common issue: The new spec may introduce types that conflict or use patterns the generator handles differently
    - Check if errors are in `sdk.gen.ts` or `types.gen.ts` (generated) vs hand-written files
    - If errors are in generated files: may need to adjust `openapi-ts.config.ts` plugins or add type workarounds
    - If errors are in hand-written files: the `src/index.ts` re-exports from `./client/index.js` which auto-includes new exports; this should just work
  - **If the generated `index.ts` export list has changed**: This is expected -- the barrel file will include new class exports for the new resources. The hand-written `src/index.ts` uses `export * from "./client/index.js"` so it automatically picks up new exports.

### Task 4: Run full end-to-end SDK build (AC: #4)

- [x] **Run `pnpm --filter benji-sdk build`**
  - This runs all three steps in sequence: `generate && fix-imports && tsc`
  - This verifies the complete pipeline works as a single command
  - **If this succeeds**, the SDK is ready for downstream consumers

### Task 5: Verify existing classes are preserved (AC: #5, #6)

- [x] **Check that all 17 existing classes still exist in `sdk.gen.ts`**
  - Search for `export class` in `src/client/sdk.gen.ts`
  - Confirm these classes are present:
    - `Mood`, `PainEvents`, `Trips`, `PackingActivities`, `PackingItems`
    - `Transports`, `Stays`, `Todos`, `Assignments`, `Tags`
    - `Projects`, `TodoLists`, `Habits`, `Hydration` (or `HydrationLogs`)
    - `Fasting`, `Workouts`, `Journal` (or `JournalEntries`)
  - **Note**: Class names may change slightly if the generator derives them differently from the new spec (e.g., `Hydration` vs `HydrationLogs`). If a class is renamed, document the change -- it will require updates in `benji-mcp` tools.

- [x] **Check that new classes were generated**
  - Count the total number of `export class` declarations
  - The old spec generated 17 classes; the new spec (with 23 new resource prefixes) should produce significantly more
  - Document the full list of new classes

### Task 6: Verify hand-written files are intact (AC: #7)

- [x] **Verify `src/errors.ts` is unchanged**
  - Should still export: `BenjiError`, `BenjiConfigError`, `BenjiApiError`
  - The code generator outputs only to `src/client/` so this file should be untouched

- [x] **Verify `src/wrapper.ts` is unchanged**
  - Should still export: `wrapSdkCall`

- [x] **Verify `src/env.ts` is unchanged**
  - Should still export: `initializeFromEnv`

- [x] **Verify `src/index.ts` is unchanged**
  - Should still have: `export * from "./client/index.js"`
  - Should still export: `configure`, `client`, `BenjiError`, `BenjiConfigError`, `BenjiApiError`, `initializeFromEnv`, `wrapSdkCall`

### Task 7: Verify downstream packages build (AC: #8)

- [x] **Run `pnpm build` from the repo root**
  - This runs `pnpm -r build` which builds all packages in dependency order:
    1. `benji-sdk` builds first
    2. `benji-mcp` builds second (depends on `benji-sdk`)
    3. `benji-cli` builds third (depends on `benji-sdk`)
  - **If `benji-mcp` fails to build**: The most likely cause is a renamed or removed SDK class. Check the error messages against the import list:
    - `src/tools/todos.ts` imports `Todos, wrapSdkCall`
    - `src/tools/tags.ts` imports `Tags, wrapSdkCall`
    - `src/tools/projects.ts` imports `Projects, wrapSdkCall`
    - `src/tools/todo-lists.ts` imports `TodoLists, wrapSdkCall`
    - `src/tools/habits.ts` imports `Habits, wrapSdkCall`
    - `src/tools/mood.ts` imports `Mood, wrapSdkCall`
    - `src/tools/hydration.ts` imports `Hydration, wrapSdkCall`
    - `src/tools/fasting.ts` imports `Fasting, wrapSdkCall`
    - `src/tools/workouts.ts` imports `Workouts, wrapSdkCall`
    - `src/tools/journal.ts` imports `Journal, wrapSdkCall`
    - `src/tools/pain-events.ts` imports `PainEvents, wrapSdkCall`
    - `src/tools/util.ts` imports `BenjiApiError`
    - `src/index.ts` imports `initializeFromEnv, BenjiConfigError`
  - **If a class was renamed** (e.g., `Hydration` to `HydrationLogs`): Update the benji-mcp import to match. This is an acceptable fix within this story's scope since the goal is to restore a working build.

## Dev Notes

### Build pipeline reference

```bash
# The full SDK build pipeline (packages/benji-sdk/package.json):
"build": "pnpm generate && pnpm fix-imports && tsc"

# Individual steps:
"generate": "openapi-ts"               # reads openapi.json -> src/client/
"fix-imports": "node fix-imports.mjs"   # adds .js extensions for ESM
# tsc                                   # compiles src/ -> dist/
```

### Code generation config

```typescript
// packages/benji-sdk/openapi-ts.config.ts
import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "./openapi.json",
  output: {
    path: "src/client",
    format: "prettier",
  },
  plugins: [
    "@hey-api/typescript",
    {
      name: "@hey-api/sdk",
      asClass: true,
    },
  ],
});
```

### Key version: `@hey-api/openapi-ts` v0.90.0

The generator is pinned at v0.90.0. Do NOT upgrade the generator version as part of this story. If the generator has issues with the larger spec, troubleshoot within the current version. A version upgrade would be a separate story.

### Files the generator creates vs. hand-written files

**Generated (in `src/client/`)** -- these get overwritten on every `pnpm generate`:
- `src/client/sdk.gen.ts` -- service classes with static methods
- `src/client/types.gen.ts` -- TypeScript types for all request/response data
- `src/client/index.ts` -- barrel re-export
- `src/client/client.gen.ts` -- client instance and createClient
- `src/client/client/` -- internal client utilities (directory)
- `src/client/core/` -- internal core utilities (directory)

**Hand-written (in `src/`)** -- must NOT be modified by the generator:
- `src/index.ts` -- top-level barrel that re-exports from `./client/index.js` plus hand-written modules
- `src/errors.ts` -- `BenjiError`, `BenjiConfigError`, `BenjiApiError`
- `src/wrapper.ts` -- `wrapSdkCall()` utility
- `src/env.ts` -- `initializeFromEnv()` utility

### Spec change summary (from Story 4-1)

| Property | Old Spec | New Spec |
|----------|----------|----------|
| OpenAPI version | 3.1.0 | 3.1.0 |
| Title | Benji API | Benji API |
| Server URL | `https://app.benji.so/api/rest` | `https://alpha.benji.so/api/rest` |
| Total paths | 131 | 244 |
| Resource prefixes | 16 | 39 |

23 new resource prefixes: `activities`, `blood-pressure-logs`, `contacts`, `countdowns`, `dashboards`, `food`, `food-templates`, `goals`, `homes`, `hydration-templates`, `ingredient-lists`, `ingredients`, `locations`, `macro`, `meal-plans`, `planner-event-lists`, `planner-events`, `problems`, `project-sections`, `todo-list-sections`, `todo-views`, `weight`, `weight-logs`

### Existing SDK classes (17 from the old spec)

These must still be present after regeneration (names may shift slightly based on new operationId patterns):

`Mood`, `PainEvents`, `Trips`, `PackingActivities`, `PackingItems`, `Transports`, `Stays`, `Todos`, `Assignments`, `Tags`, `Projects`, `TodoLists`, `Habits`, `Hydration` (or `HydrationLogs`), `Fasting`, `Workouts`, `Journal` (or `JournalEntries`)

### benji-mcp downstream imports

All current imports from `benji-sdk` used in `packages/benji-mcp/src/`:

| File | Imports |
|------|---------|
| `tools/todos.ts` | `Todos`, `wrapSdkCall` |
| `tools/tags.ts` | `Tags`, `wrapSdkCall` |
| `tools/projects.ts` | `Projects`, `wrapSdkCall` |
| `tools/todo-lists.ts` | `TodoLists`, `wrapSdkCall` |
| `tools/habits.ts` | `Habits`, `wrapSdkCall` |
| `tools/mood.ts` | `Mood`, `wrapSdkCall` |
| `tools/hydration.ts` | `Hydration`, `wrapSdkCall` |
| `tools/fasting.ts` | `Fasting`, `wrapSdkCall` |
| `tools/workouts.ts` | `Workouts`, `wrapSdkCall` |
| `tools/journal.ts` | `Journal`, `wrapSdkCall` |
| `tools/pain-events.ts` | `PainEvents`, `wrapSdkCall` |
| `tools/util.ts` | `BenjiApiError` |
| `index.ts` | `initializeFromEnv`, `BenjiConfigError` |

### Potential issues and mitigations

1. **Class name changes**: The generator derives class names from operationId prefixes. If the alpha spec changed operationId conventions, class names may shift (e.g., `Hydration` -> `HydrationLogs`). Fix: update benji-mcp imports to match.

2. **TypeScript compilation errors in generated code**: The much larger spec may produce types that cause TS issues (e.g., union types too complex, circular references). Fix: check if `skipLibCheck` handles it; if not, may need to adjust tsconfig or add `@ts-ignore` in generated files as a last resort.

3. **`fix-imports.mjs` edge cases**: If the generator creates new subdirectory structures, the import fixer should handle them (it walks recursively). But if new import patterns appear (e.g., `import type` syntax variations), verify the regex still catches them. The regex is: `/(from\s+['"])(\.\.?\/[^'"]+)(['"])/g`

4. **Barrel export changes**: The generated `src/client/index.ts` will have a much larger export list with all new classes and types. The hand-written `src/index.ts` uses `export *` so it auto-includes everything.

5. **Server URL change**: The alpha spec uses `https://alpha.benji.so/api/rest` as the default server URL. This is fine -- the SDK's `configure()` function and `BENJI_BASE_URL` env var allow runtime override. No code change needed.

### Out of scope

- Upgrading `@hey-api/openapi-ts` version (keep v0.90.0)
- Verifying individual new class methods work (that is Story 4-3)
- Writing new MCP tools for new resources (that is Epic 5)
- Changing the server URL default in `src/index.ts` (users configure at runtime)

### References

- [Story 4-1 completion notes](./_bmad-output/sprint-artifacts/4-1-update-openapi-spec-from-alpha.md)
- [Epics file](./_bmad-output/planning-artifacts/epics.md) -- Epic 4, Stories 4.2 and 4.3
- [SDK package.json](./packages/benji-sdk/package.json) -- build scripts
- [Generator config](./packages/benji-sdk/openapi-ts.config.ts) -- openapi-ts configuration
- [ESM fix script](./packages/benji-sdk/fix-imports.mjs) -- import fixer
- [SDK tsconfig](./packages/benji-sdk/tsconfig.json) -- TypeScript compiler config

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

None.

### Completion Notes List

**All 7 tasks completed successfully. All 8 acceptance criteria met.**

1. **Code generation (AC-1)**: `openapi-ts` v0.90.0 completed without fatal errors. One deprecation warning about `asClass` (non-blocking). Generated files: `sdk.gen.ts` (188KB), `types.gen.ts` (572KB), `index.ts` (35KB), `client.gen.ts` (841B).

2. **ESM import fix (AC-2)**: `fix-imports.mjs` fixed 11 files, adding `.js` extensions to all relative imports. Spot-checked `sdk.gen.ts` and `index.ts` -- all imports have `.js` suffixes.

3. **TypeScript compilation (AC-3)**: `tsc` compiled with zero errors. Output written to `dist/`.

4. **Full SDK build (AC-4)**: `pnpm --filter benji-sdk build` (generate + fix-imports + tsc) completed successfully end-to-end.

5. **Existing classes preserved (AC-5)**: All 17 original classes confirmed present: `Mood`, `PainEvents`, `Trips`, `PackingActivities`, `PackingItems`, `Transports`, `Stays`, `Todos`, `Assignments`, `Tags`, `Projects`, `TodoLists`, `Habits`, `Hydration`, `Fasting`, `Workouts`, `Journal`. No class name changes -- `Hydration` remains `Hydration` (not `HydrationLogs`), `Journal` remains `Journal` (not `JournalEntries`).

6. **New classes generated (AC-6)**: 23 new classes for alpha resources: `Activities`, `BloodPressureLogs`, `Contacts`, `Countdowns`, `Dashboards`, `Food`, `FoodTemplates`, `Goals`, `Homes`, `HydrationTemplates`, `IngredientLists`, `Ingredients`, `Locations`, `MacroGoals`, `MealPlans`, `PlannerEventLists`, `PlannerEvents`, `Problems`, `ProjectSections`, `TodoListSections`, `TodoViews`, `WeightGoals`, `WeightLogs`. Total: 40 classes (17 existing + 23 new).

7. **Hand-written files untouched (AC-7)**: MD5 checksums verified identical before and after generation for: `src/index.ts`, `src/errors.ts`, `src/wrapper.ts`, `src/env.ts`.

8. **Downstream packages build (AC-8)**: `pnpm build` (root-level) built all 3 packages successfully: `benji-sdk`, `benji-mcp`, `benji-cli`. No import resolution failures. All existing MCP tool imports still resolve correctly.

**No errors encountered. No fixes required. No hand-written files modified.**
