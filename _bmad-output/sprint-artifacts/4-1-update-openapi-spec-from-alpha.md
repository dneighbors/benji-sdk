# Story 4.1: Update OpenAPI spec from alpha

Status: done

## Story

As a developer,
I want the local `openapi.json` replaced with the alpha API's spec,
so that code generation picks up all new resources.

## Acceptance Criteria

1. **AC-1: Alpha spec downloaded**
   - **Given** the alpha API endpoint `https://alpha.benji.so/api/openapi.json`
   - **When** I download the spec
   - **Then** the file is saved to `packages/benji-sdk/openapi.json`, replacing the existing file

2. **AC-2: Valid OpenAPI document**
   - **Given** the downloaded file
   - **When** I parse it as JSON
   - **Then** it is valid JSON
   - **And** it has `"openapi"` key with a `"3.x"` version string
   - **And** it has `"info"`, `"paths"`, and `"components"` top-level keys

3. **AC-3: New resources present**
   - **Given** the downloaded spec
   - **When** I inspect the `paths` object
   - **Then** the following new resource path prefixes are present (not in the current spec):
     - `/weight-logs/` (WeightLogs)
     - `/todo-views/` or todo view endpoints (TodoViews -- done/paused/recurring/sharing/trash)
     - `/project-sections/` (ProjectSections)
     - `/todo-list-sections/` (TodoListSections)
     - `/goals/` (Goals)
     - `/contacts/` (Contacts)
     - `/food/` (Food)
     - `/food-templates/` (FoodTemplates)
     - `/blood-pressure/` (BloodPressureLogs)
   - **And** optionally other new resources such as: Countdowns, Dashboards, Homes, HydrationGoals, HydrationTemplates, IngredientLists, Ingredients, Locations, MacroGoals, MealPlans, PlannerEvents, PlannerEventLists, Problems, Activities

4. **AC-4: Existing resources preserved**
   - **Given** the downloaded spec
   - **When** I inspect the `paths` object
   - **Then** all existing resource path prefixes are still present:
     - `/mood/`
     - `/todos/`
     - `/tags/`
     - `/projects/`
     - `/todo-lists/`
     - `/habits/`
     - `/hydration/`
     - `/fasting/`
     - `/workouts/`
     - `/journal/`
     - `/pain-events/`

5. **AC-5: No build step executed**
   - **And** the SDK is NOT regenerated or built as part of this story
   - **And** no files other than `packages/benji-sdk/openapi.json` are modified

## Tasks / Subtasks

### Task 1: Download the alpha OpenAPI spec (AC: #1, #2)

- [x] **Download `https://alpha.benji.so/api/openapi.json`**
  - Use `curl` or equivalent to fetch the spec:
    ```bash
    curl -o packages/benji-sdk/openapi.json https://alpha.benji.so/api/openapi.json
    ```
  - This overwrites the existing `packages/benji-sdk/openapi.json`

### Task 2: Validate the downloaded spec is valid JSON with OpenAPI structure (AC: #2)

- [x] **Verify valid JSON and OpenAPI structure**
  - Parse the file with `python3 -c "import json; ..."` or `jq` to confirm:
    - File is valid JSON (no parse errors)
    - Top-level key `"openapi"` exists and starts with `"3."`
    - Top-level keys `"info"`, `"paths"`, and `"components"` exist
    - `"info"."title"` is present (should be something like `"Benji API"`)
  - If validation fails, the download may have returned an error page -- retry or investigate

### Task 3: Verify new resources are present in the spec (AC: #3)

- [x] **Check for expected new resource path prefixes**
  - Extract all unique path prefixes from the `paths` object
  - Confirm at minimum these new prefixes appear (not present in the current spec):
    - `weight-logs`
    - `project-sections`
    - `todo-list-sections`
    - `goals`
    - `contacts`
    - `food`
    - `blood-pressure`
  - Note: The exact path structure may vary (e.g., `/food/list` vs `/food-templates/list`). The key verification is that the new resource endpoints exist.
  - Print the full list of resource prefixes for the dev record

### Task 4: Verify existing resources are preserved (AC: #4)

- [x] **Check that all current resource path prefixes still exist**
  - Confirm these prefixes from the current spec are still present:
    - `mood`, `todos`, `tags`, `projects`, `todo-lists`, `habits`
    - `hydration`, `fasting`, `workouts`, `journal`, `pain-events`
  - If any are missing, this is a blocker -- do not proceed

### Task 5: Record results (AC: #5)

- [x] **Update this story file with completion notes**
  - Record the total path count (old vs new)
  - Record the full list of new resource prefixes discovered
  - Record any unexpected differences or observations
  - Do NOT run `pnpm generate`, `pnpm build`, or any SDK regeneration -- that is Story 4-2

## Dev Notes

### This is a spec replacement, NOT a code change

This story only replaces the `openapi.json` file. No TypeScript code is modified, no build is run, no SDK is regenerated. The build pipeline (`pnpm generate && pnpm fix-imports && tsc`) is explicitly deferred to Story 4-2.

### Alpha API URL

```
https://alpha.benji.so/api/openapi.json
```

### Current spec baseline

The current `packages/benji-sdk/openapi.json`:
- OpenAPI version: `3.1.0`
- Title: `Benji API`
- Server URL: `https://app.benji.so/api/rest`
- Total paths: **131**
- Resource prefixes (16): `fasting`, `habits`, `hydration`, `journal`, `mood`, `packing-activities`, `packing-items`, `pain-events`, `projects`, `stays`, `tags`, `todo-lists`, `todos`, `transports`, `trips`, `workouts`

### Expected new resources (from Epic 4 and Story 4.3)

Per the epics file, the alpha API should include these resources that are NOT in the current spec:

| Resource | Expected Path Prefix | Notes |
|----------|---------------------|-------|
| WeightLogs | `weight-logs` | Weight tracking |
| TodoViews | `todos` (sub-endpoints) | Done, paused, recurring, sharing, trash views |
| ProjectSections | `project-sections` | Sub-sections within projects |
| TodoListSections | `todo-list-sections` | Sub-sections within todo lists |
| Goals | `goals` | Goal tracking |
| Contacts | `contacts` | Contact management |
| Food | `food` | Food logging |
| FoodTemplates | `food-templates` | Reusable food templates |
| BloodPressureLogs | `blood-pressure` | Blood pressure tracking |
| Countdowns | `countdowns` | Countdown timers |
| Dashboards | `dashboards` | Dashboard configuration |
| Homes | `homes` | Home/location management |
| HydrationGoals | `hydration` (sub-endpoints) | Hydration goal configuration |
| HydrationTemplates | `hydration` (sub-endpoints) | Reusable hydration templates |
| IngredientLists | `ingredient-lists` | Ingredient list management |
| Ingredients | `ingredients` | Individual ingredients |
| Locations | `locations` | Location tracking |
| MacroGoals | `macro-goals` | Macro nutrition goals |
| MealPlans | `meal-plans` | Meal planning |
| PlannerEvents | `planner-events` | Calendar/planner events |
| PlannerEventLists | `planner-event-lists` | Planner event groupings |
| Problems | `problems` | Problem tracking |
| Activities | `activities` | Activity logging |

Note: Exact path prefixes may differ from the table above. The verification step should report what is actually present.

### SDK build pipeline (DO NOT RUN)

For reference only (this is Story 4-2's scope):
```bash
# packages/benji-sdk/package.json scripts:
"generate": "openapi-ts"           # uses @hey-api/openapi-ts v0.90.0
"fix-imports": "node fix-imports.mjs"  # adds .js extensions for ESM
"build": "pnpm generate && pnpm fix-imports && tsc"
```

Config in `packages/benji-sdk/openapi-ts.config.ts`:
```typescript
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

### Potential issues

1. **Server URL change**: The alpha spec may use a different server URL (e.g., `https://alpha.benji.so/api/rest` instead of `https://app.benji.so/api/rest`). This is expected and fine -- the SDK client allows runtime URL override.
2. **Breaking schema changes**: Existing resource schemas may have changed in the alpha spec. This is acceptable for this story (we are just replacing the spec). Any resulting build issues are Story 4-2's concern.
3. **Download failure**: If `curl` returns an HTML error page instead of JSON, the validation step will catch it.

### References

- [Source: _bmad-output/planning-artifacts/epics.md -- Epic 4, Story 4.1 acceptance criteria]
- [Source: _bmad-output/planning-artifacts/epics.md -- Story 4.3 expected classes list]
- [Source: packages/benji-sdk/openapi.json -- current spec (131 paths, 16 resource prefixes)]
- [Source: packages/benji-sdk/openapi-ts.config.ts -- code generation config]
- [Source: packages/benji-sdk/package.json -- build scripts and @hey-api/openapi-ts v0.90.0]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

None.

### Completion Notes List

**Completed 2026-03-28**

#### Download Summary
- Source: `https://alpha.benji.so/api/openapi.json` (HTTP 200, 498,951 bytes)
- Destination: `packages/benji-sdk/openapi.json` (replaced)

#### Spec Comparison (Old vs New)
| Property | Old Spec | New Spec |
|----------|----------|----------|
| OpenAPI version | 3.1.0 | 3.1.0 |
| Title | Benji API | Benji API |
| Server URL | `https://app.benji.so/api/rest` | `https://alpha.benji.so/api/rest` |
| Total paths | 131 | 244 |
| Resource prefixes | 16 | 39 |

#### 23 New Resource Prefixes Discovered
`activities`, `blood-pressure-logs`, `contacts`, `countdowns`, `dashboards`, `food`, `food-templates`, `goals`, `homes`, `hydration-templates`, `ingredient-lists`, `ingredients`, `locations`, `macro`, `meal-plans`, `planner-event-lists`, `planner-events`, `problems`, `project-sections`, `todo-list-sections`, `todo-views`, `weight`, `weight-logs`

#### All 11 Required Existing Resources Preserved
`mood` (8), `todos` (16), `tags` (8), `projects` (7), `todo-lists` (8), `habits` (10), `hydration` (9), `fasting` (7), `workouts` (11), `journal` (11), `pain-events` (8)

#### All 9 Required New Resources Found (AC-3)
- `weight-logs`: 10 paths
- `todo-views`: present
- `project-sections`: 1 path
- `todo-list-sections`: 1 path
- `goals`: 18 paths
- `contacts`: 6 paths
- `food`: 13 paths
- `food-templates`: present
- `blood-pressure` (as `blood-pressure-logs`): 6 paths

#### All 13 Optional New Resources Found
`countdowns`, `dashboards`, `homes`, `hydration-templates`, `ingredient-lists`, `ingredients`, `locations`, `macro` (for macro-goals), `meal-plans`, `planner-events`, `planner-event-lists`, `problems`, `activities`

#### Observations
1. **Server URL changed** from `https://app.benji.so/api/rest` to `https://alpha.benji.so/api/rest` -- expected per dev notes; SDK client allows runtime URL override.
2. **Blood pressure prefix** is `blood-pressure-logs` (not `blood-pressure`) -- endpoints still found under this prefix.
3. **Macro goals prefix** is `macro` (not `macro-goals`) -- endpoints still found.
4. **Hydration templates** has its own top-level prefix `hydration-templates` rather than being sub-endpoints of `hydration`.
5. No build was executed (AC-5 satisfied). Only `openapi.json` was modified.

### File List

- `packages/benji-sdk/openapi.json` (MODIFIED -- replaced with alpha spec)
- `_bmad-output/sprint-artifacts/4-1-update-openapi-spec-from-alpha.md` (MODIFIED -- task checkboxes + dev record)
