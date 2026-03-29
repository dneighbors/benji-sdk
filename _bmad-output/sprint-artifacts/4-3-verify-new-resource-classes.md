# Story 4.3: Verify new resource classes

Status: done

## Story

As a developer,
I want to verify all expected new classes exist and are exported,
so that MCP/CLI can consume them.

## Acceptance Criteria

1. **AC-1: All expected new classes exist in sdk.gen.ts**
   - **Given** the regenerated `sdk.gen.ts` (from Story 4-2)
   - **When** I grep for `export class` declarations
   - **Then** the following 23 new classes exist: `Activities`, `BloodPressureLogs`, `Contacts`, `Countdowns`, `Dashboards`, `Food`, `FoodTemplates`, `Goals`, `Homes`, `HydrationTemplates`, `IngredientLists`, `Ingredients`, `Locations`, `MacroGoals`, `MealPlans`, `PlannerEventLists`, `PlannerEvents`, `Problems`, `ProjectSections`, `TodoListSections`, `TodoViews`, `WeightGoals`, `WeightLogs`
   - **And** the 17 existing classes are also still present (40 total classes)

2. **AC-2: All classes are re-exported from src/client/index.ts**
   - **Given** the generated barrel file `src/client/index.ts`
   - **When** I inspect its export statement
   - **Then** all 40 classes appear in the `export { ... } from './sdk.gen.js'` line

3. **AC-3: All classes are accessible from the top-level benji-sdk package**
   - **Given** `src/index.ts` has `export * from "./client/index.js"`
   - **When** I verify the top-level barrel re-export chain
   - **Then** every class in `src/client/index.ts` is transitively exported from the package root
   - **And** `import { ClassName } from "benji-sdk"` would resolve for all 40 classes

4. **AC-4: Each new class has at least one static method**
   - **Given** each of the 23 new classes in `sdk.gen.ts`
   - **When** I inspect their method declarations
   - **Then** every class has at least one `public static` method (confirming it is a real service class, not an empty stub)

5. **AC-5: Epic discrepancies are documented**
   - **Given** the epic's expected class list includes `HydrationGoals`
   - **When** I compare the epic list to the actual generated classes
   - **Then** the discrepancy is documented: `HydrationGoals` does not exist as a separate class; hydration goal operations are methods on the `Hydration` class; the actual additional class is `WeightGoals`

6. **AC-6: Verification report is complete**
   - **Given** all checks above have been performed
   - **When** the verification report is produced
   - **Then** it lists all 40 classes, their method counts, export status, and any discrepancies

## Tasks / Subtasks

### Task 1: Verify all 23 new classes exist in sdk.gen.ts (AC: #1)

- [x] **Grep `sdk.gen.ts` for all `export class` declarations**
  - File: `packages/benji-sdk/src/client/sdk.gen.ts`
  - Run: `grep "^export class" packages/benji-sdk/src/client/sdk.gen.ts`
  - Expected: 40 classes total (17 existing + 23 new)

- [x] **Check each expected new class against the list**
  - Confirm each of these 23 classes is present:

  | # | Class Name | Expected | Line |
  |---|-----------|----------|------|
  | 1 | Activities | Yes | 4208 |
  | 2 | BloodPressureLogs | Yes | 3393 |
  | 3 | Contacts | Yes | 3873 |
  | 4 | Countdowns | Yes | 3134 |
  | 5 | Dashboards | Yes | 4601 |
  | 6 | Food | Yes | 2174 |
  | 7 | FoodTemplates | Yes | 3593 |
  | 8 | Goals | Yes | 3288 |
  | 9 | Homes | Yes | 4454 |
  | 10 | HydrationTemplates | Yes | 3497 |
  | 11 | IngredientLists | Yes | 3689 |
  | 12 | Ingredients | Yes | 4454 |
  | 13 | Locations | Yes | 3209 |
  | 14 | MacroGoals | Yes | 4287 |
  | 15 | MealPlans | Yes | 3781 |
  | 16 | PlannerEventLists | Yes | 2895 |
  | 17 | PlannerEvents | Yes | 835 |
  | 18 | Problems | Yes | 4086 |
  | 19 | ProjectSections | Yes | 3070 |
  | 20 | TodoListSections | Yes | 3102 |
  | 21 | TodoViews | Yes | 2983 |
  | 22 | WeightGoals | Yes | 3977 |
  | 23 | WeightLogs | Yes | 2321 |

  - **Note**: The epic listed `HydrationGoals` but no such class exists. Instead, `WeightGoals` is the 23rd new class. Hydration goal methods live on the existing `Hydration` class. See Task 5 for full discrepancy documentation.

### Task 2: Verify all classes are re-exported from src/client/index.ts (AC: #2)

- [x] **Inspect the barrel export line in `src/client/index.ts`**
  - File: `packages/benji-sdk/src/client/index.ts`
  - The file is auto-generated and contains: `export { Activities, Assignments, BloodPressureLogs, Contacts, Countdowns, Dashboards, Fasting, Food, FoodTemplates, Goals, Habits, Homes, Hydration, HydrationTemplates, IngredientLists, Ingredients, Journal, Locations, MacroGoals, MealPlans, Mood, ... PackingActivities, PackingItems, PainEvents, PlannerEventLists, PlannerEvents, Problems, Projects, ProjectSections, Stays, Tags, TodoLists, TodoListSections, Todos, TodoViews, Transports, Trips, WeightGoals, WeightLogs, Workouts } from './sdk.gen.js'`
  - Verify all 40 class names appear in this export statement

- [x] **Cross-check: for each class in sdk.gen.ts, confirm it appears in client/index.ts**
  - Extract class names from both files and diff
  - They should match exactly

### Task 3: Verify top-level package export chain (AC: #3)

- [x] **Confirm `src/index.ts` has the wildcard re-export**
  - File: `packages/benji-sdk/src/index.ts`
  - Must contain: `export * from "./client/index.js"`
  - This line ensures all classes from the generated barrel are transitively exported from the package root

- [x] **Confirm `package.json` main/exports point to the right entry**
  - File: `packages/benji-sdk/package.json`
  - The `"main"` or `"exports"` field should resolve to `dist/index.js` (the compiled version of `src/index.ts`)
  - This ensures `import { ClassName } from "benji-sdk"` resolves correctly

### Task 4: Verify each new class has at least one static method (AC: #4)

- [x] **For each of the 23 new classes, count `public static` methods**
  - Extract method signatures from each class body in `sdk.gen.ts`
  - All classes must have >= 1 method to confirm they are real service classes

  | # | Class Name | Method Count | Methods |
  |---|-----------|-------------|---------|
  | 1 | Activities | 5 | activitiesGet, activitiesList, activitiesCreate, activitiesUpdate, activitiesDelete |
  | 2 | BloodPressureLogs | 6 | bloodPressureLogsList, bloodPressureLogsGet, bloodPressureLogsCreate, bloodPressureLogsUpdate, bloodPressureLogsDelete, bloodPressureLogsDeleteMany |
  | 3 | Contacts | 6 | contactsList, contactsGet, contactsCreate, contactsUpdate, contactsDelete, contactsDeleteMany |
  | 4 | Countdowns | 5 | countdownsList, countdownsDelete, countdownsUpdate, countdownsGet, countdownsCreate |
  | 5 | Dashboards | 5 | dashboardsList, dashboardsDelete, dashboardsUpdate, dashboardsGet, dashboardsCreate |
  | 6 | Food | 9 | foodLogsDelete, foodLogsUpdate, foodLogsGet, foodLogsList, foodLogsCreate, foodLogsDeleteMany, foodLogsGetCaloriesStats, foodLogsGetProteinStats, foodLogsGetCarbsStats |
  | 7 | FoodTemplates | 6 | foodTemplatesGet, foodTemplatesList, foodTemplatesCreate, foodTemplatesUpdate, foodTemplatesDelete, foodTemplatesDeleteMany |
  | 8 | Goals | 7 | goalsDelete, goalsUpdate, goalsGet, goalsList, goalsPublicList, goalsCreate, goalsDeleteMany |
  | 9 | Homes | 5 | homesList, homesCreate, homesDelete, homesGet, homesUpdate |
  | 10 | HydrationTemplates | 6 | hydrationTemplatesGet, hydrationTemplatesList, hydrationTemplatesCreate, hydrationTemplatesUpdate, hydrationTemplatesDelete, hydrationTemplatesDeleteMany |
  | 11 | IngredientLists | 6 | ingredientListsList, ingredientListsDelete, ingredientListsUpdate, ingredientListsGet, ingredientListsCreate, ingredientListsDeleteMany |
  | 12 | Ingredients | 9 | ingredientsList, ingredientsGet, ingredientsCreate, ingredientsUpdate, ingredientsDelete, ingredientsDeleteMany, ingredientsListOrphans, ingredientsUpdateMany, ingredientsAddToShoppingList |
  | 13 | Locations | 5 | locationsDelete, locationsUpdate, locationsGet, locationsList, locationsCreate |
  | 14 | MacroGoals | 6 | macroGoalsDelete, macroGoalsUpdate, macroGoalsGet, macroGoalsList, macroGoalsGetForDate, macroGoalsCreate |
  | 15 | MealPlans | 6 | mealPlansDelete, mealPlansUpdate, mealPlansGet, mealPlansList, mealPlansCreate, mealPlansDeleteMany |
  | 16 | PlannerEventLists | 6 | plannerEventListsList, plannerEventListsHasSharedLists, plannerEventListsDelete, plannerEventListsUpdate, plannerEventListsGet, plannerEventListsCreate |
  | 17 | PlannerEvents | 6 | plannerEventsGet, plannerEventsList, plannerEventsCreate, plannerEventsUpdate, plannerEventsDelete, plannerEventsDeleteMany |
  | 18 | Problems | 8 | problemsList, problemsCreate, problemsDelete, problemsGet, problemsUpdate, problemsDeleteMany, problemsListLogs, problemsCreateLog |
  | 19 | ProjectSections | 2 | projectSectionsDelete, projectSectionsUpdate |
  | 20 | TodoListSections | 2 | todoListSectionsDelete, todoListSectionsUpdate |
  | 21 | TodoViews | 5 | todoViewsDone, todoViewsTrash, todoViewsPaused, todoViewsRecurring, todoViewsSharing |
  | 22 | WeightGoals | 7 | weightGoalsDelete, weightGoalsUpdate, weightGoalsGet, weightGoalsList, weightGoalsCreate, weightGoalsDeleteMany, weightGoalsGetForDate |
  | 23 | WeightLogs | 10 | weightLogsGet, weightLogsList, weightLogsCreate, weightLogsUpdate, weightLogsDelete, weightLogsDeleteMany, weightLogsGetSettings, weightLogsUpdateWeightUnit, weightLogsGetWeightsForWidget, weightLogsGetCurrentActiveGoal |

  - All 23 new classes have between 2 and 10 methods -- none are empty stubs

### Task 5: Document epic discrepancies (AC: #5)

- [x] **Compare epic's expected list to actual classes**

  **Epic expected (23 classes):**
  WeightLogs, TodoViews, ProjectSections, TodoListSections, Goals, Contacts, Food, FoodTemplates, BloodPressureLogs, Countdowns, Dashboards, Homes, **HydrationGoals**, HydrationTemplates, IngredientLists, Ingredients, Locations, MacroGoals, MealPlans, PlannerEvents, PlannerEventLists, Problems, Activities

  **Actual new classes (23 classes):**
  Activities, BloodPressureLogs, Contacts, Countdowns, Dashboards, Food, FoodTemplates, Goals, Homes, HydrationTemplates, IngredientLists, Ingredients, Locations, MacroGoals, MealPlans, PlannerEventLists, PlannerEvents, Problems, ProjectSections, TodoListSections, TodoViews, **WeightGoals**, WeightLogs

  **Discrepancies:**

  | Issue | Details |
  |-------|---------|
  | `HydrationGoals` missing | The epic listed `HydrationGoals` as an expected class, but no such standalone class exists. Hydration goal operations (`hydrationGoalsCreate`, `hydrationGoalsGet`, `hydrationGoalsList`, `hydrationGoalsUpdate`, `hydrationGoalsDelete`, `hydrationGoalsGetForDate`) are methods on the existing `Hydration` class (6 of its 13 methods). |
  | `WeightGoals` unexpected | `WeightGoals` is a new class with 7 methods that was NOT listed in the epic. It provides weight goal CRUD operations (`weightGoalsCreate`, `weightGoalsList`, etc.) -- distinct from `WeightLogs` which handles weight log entries. |
  | Net effect | The total count is still 23 new classes. The epic's `HydrationGoals` slot is effectively filled by `WeightGoals`. |

  **Impact on Epic 5 (MCP tools):** Story 5-5 references "Goals, Contacts, Food, Blood Pressure tools." The `WeightGoals` class may need its own MCP tools in addition to or instead of `HydrationGoals` tools. The `Hydration` class already has hydration goal methods covered by Story 3-1.

### Task 6: Produce verification report (AC: #6)

- [x] **Generate the full class inventory table**

  Complete list of all 40 SDK classes with method counts and export status:

  | # | Class | Type | Methods | Exported (client/index.ts) | Exported (package root) |
  |---|-------|------|---------|---------------------------|------------------------|
  | 1 | Mood | existing | 8 | Yes | Yes |
  | 2 | PainEvents | existing | 8 | Yes | Yes |
  | 3 | Trips | existing | 6 | Yes | Yes |
  | 4 | PackingActivities | existing | 7 | Yes | Yes |
  | 5 | PackingItems | existing | 6 | Yes | Yes |
  | 6 | Transports | existing | 7 | Yes | Yes |
  | 7 | Stays | existing | 6 | Yes | Yes |
  | 8 | Todos | existing | 16 | Yes | Yes |
  | 9 | Assignments | existing | 4 | Yes | Yes |
  | 10 | Tags | existing | 8 | Yes | Yes |
  | 11 | Projects | existing | 7 | Yes | Yes |
  | 12 | TodoLists | existing | 8 | Yes | Yes |
  | 13 | Habits | existing | 10 | Yes | Yes |
  | 14 | Hydration | existing | 13 | Yes | Yes |
  | 15 | Fasting | existing | 9 | Yes | Yes |
  | 16 | Workouts | existing | 13 | Yes | Yes |
  | 17 | Journal | existing | 13 | Yes | Yes |
  | 18 | PlannerEvents | new | 6 | Yes | Yes |
  | 19 | Food | new | 9 | Yes | Yes |
  | 20 | WeightLogs | new | 10 | Yes | Yes |
  | 21 | PlannerEventLists | new | 6 | Yes | Yes |
  | 22 | TodoViews | new | 5 | Yes | Yes |
  | 23 | ProjectSections | new | 2 | Yes | Yes |
  | 24 | TodoListSections | new | 2 | Yes | Yes |
  | 25 | Countdowns | new | 5 | Yes | Yes |
  | 26 | Locations | new | 5 | Yes | Yes |
  | 27 | Goals | new | 7 | Yes | Yes |
  | 28 | BloodPressureLogs | new | 6 | Yes | Yes |
  | 29 | HydrationTemplates | new | 6 | Yes | Yes |
  | 30 | FoodTemplates | new | 6 | Yes | Yes |
  | 31 | IngredientLists | new | 6 | Yes | Yes |
  | 32 | MealPlans | new | 6 | Yes | Yes |
  | 33 | Contacts | new | 6 | Yes | Yes |
  | 34 | WeightGoals | new | 7 | Yes | Yes |
  | 35 | Problems | new | 8 | Yes | Yes |
  | 36 | Activities | new | 5 | Yes | Yes |
  | 37 | MacroGoals | new | 6 | Yes | Yes |
  | 38 | Homes | new | 5 | Yes | Yes |
  | 39 | Ingredients | new | 9 | Yes | Yes |
  | 40 | Dashboards | new | 5 | Yes | Yes |

  **Summary:** 40 classes, 287 total methods, all exported at both levels. Zero empty stubs. One discrepancy: `HydrationGoals` (epic) vs `WeightGoals` (actual).

## Dev Notes

### Verification approach

This is a verification-only story -- no code changes are expected. The dev should run the checks described in the tasks and confirm all pass. If any check fails, the resolution depends on the failure:
- Missing class: likely a code generation issue -- re-run `pnpm --filter benji-sdk build` or investigate the OpenAPI spec
- Missing export: the barrel file `src/client/index.ts` is auto-generated; re-running generation should fix it
- Empty class (no methods): indicates the operationIds in the spec did not map to this class prefix; investigate the spec

### Key files

| File | Purpose |
|------|---------|
| `packages/benji-sdk/src/client/sdk.gen.ts` | Generated SDK classes with static methods |
| `packages/benji-sdk/src/client/index.ts` | Auto-generated barrel re-export |
| `packages/benji-sdk/src/index.ts` | Hand-written top-level barrel (`export *` from client) |
| `packages/benji-sdk/package.json` | Package entry point configuration |

### Verification commands

```bash
# Count all exported classes
grep "^export class" packages/benji-sdk/src/client/sdk.gen.ts | wc -l
# Expected: 40

# List all class names
grep "^export class" packages/benji-sdk/src/client/sdk.gen.ts | sed 's/export class \(\w\+\).*/\1/'

# Check a specific class exists
grep "^export class WeightGoals" packages/benji-sdk/src/client/sdk.gen.ts

# Verify client/index.ts exports a class
grep "WeightGoals" packages/benji-sdk/src/client/index.ts

# Verify top-level re-export chain
grep "export \* from" packages/benji-sdk/src/index.ts
# Expected: export * from "./client/index.js"

# Full build (confirms everything compiles and links)
pnpm --filter benji-sdk build
```

### HydrationGoals vs WeightGoals discrepancy

The epic (in `_bmad-output/planning-artifacts/epics.md`, Story 4.3 acceptance criteria) lists `HydrationGoals` as an expected class. This class was never generated because the OpenAPI spec groups hydration goal endpoints under the `hydration` prefix, so `@hey-api/openapi-ts` placed those operations as methods on the `Hydration` class:

- `Hydration.hydrationGoalsCreate`
- `Hydration.hydrationGoalsGet`
- `Hydration.hydrationGoalsList`
- `Hydration.hydrationGoalsGetForDate`
- `Hydration.hydrationGoalsUpdate`
- `Hydration.hydrationGoalsDelete`

Meanwhile, `WeightGoals` IS a separate class because the spec uses a distinct `weight-goals` prefix for those endpoints.

This does not block downstream work. Epic 5 stories that reference hydration goals can use `Hydration.hydrationGoals*()` methods. The `WeightGoals` class should be added to the Epic 5 MCP tools plan.

### Export chain diagram

```
import { WeightLogs } from "benji-sdk"
  -> packages/benji-sdk/src/index.ts
     -> export * from "./client/index.js"
        -> packages/benji-sdk/src/client/index.ts
           -> export { ..., WeightLogs, ... } from './sdk.gen.js'
              -> packages/benji-sdk/src/client/sdk.gen.ts
                 -> export class WeightLogs { ... }
```

### Prerequisites

- Story 4-2 (done): SDK regenerated with 40 classes, full build passing

### Out of scope

- Writing MCP tools for new resources (Epic 5)
- Fixing the HydrationGoals discrepancy in the epic file (documentation-only note)
- Testing new class methods against the live API (would require API key + alpha environment)
- Performance testing or load testing of the SDK

### References

- [Story 4-2 completion notes](./_bmad-output/sprint-artifacts/4-2-regenerate-sdk-and-fix-build.md)
- [Epics file](./_bmad-output/planning-artifacts/epics.md) -- Epic 4, Story 4.3
- [SDK source](./packages/benji-sdk/src/client/sdk.gen.ts) -- generated classes
- [Client barrel](./packages/benji-sdk/src/client/index.ts) -- generated re-exports
- [Package barrel](./packages/benji-sdk/src/index.ts) -- hand-written re-export

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

None.

### Completion Notes List

All 6 acceptance criteria verified and passing:

- **AC-1 PASS**: 40 `export class` declarations found in `sdk.gen.ts` (17 existing + 23 new). All 23 expected new classes present.
- **AC-2 PASS**: All 40 classes appear in the `export { ... } from './sdk.gen.js'` statement in `src/client/index.ts`. Cross-check confirms exact match between sdk.gen.ts classes and barrel exports.
- **AC-3 PASS**: `src/index.ts` contains `export * from "./client/index.js"`. `package.json` has `"main": "./dist/index.js"` and `"exports": { ".": { "import": "./dist/index.js" } }`, confirming the full resolution chain works.
- **AC-4 PASS**: All 23 new classes have between 2 and 10 `public static` methods each. Zero empty stubs. Total: 287 methods across all 40 classes.
- **AC-5 PASS**: Discrepancy documented -- epic listed `HydrationGoals` but actual generation produced `WeightGoals`. Hydration goal methods are on the existing `Hydration` class (6 of its 13 methods). Net class count remains 23.
- **AC-6 PASS**: Full verification report table produced with all 40 classes, method counts, and export status at both barrel levels.

No code changes required -- this was a verification-only story. All checks passed on first run.
