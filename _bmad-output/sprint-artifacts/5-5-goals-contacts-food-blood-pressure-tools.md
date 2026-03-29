# Story 5.5: Goals, Contacts, Food, Blood Pressure tools

Status: done

## Story

As an AI assistant,
I want MCP tools for managing Benji goals, contacts, food logs, and blood pressure logs,
so that I can list, create, update, delete and access resource-specific operations (food stats, public goals, etc.).

## Acceptance Criteria

1. **AC-1: Goal tools**
   - **Given** a valid API key, **When** `list_goals` is called, **Then** returns all goals
   - **Given** valid input, **When** `create_goal` is called with name and optional fields, **Then** creates and returns the goal
   - **Given** a valid goal ID, **When** `get_goal` is called, **Then** returns the goal
   - **Given** a valid goal ID and update data, **When** `update_goal` is called, **Then** updates and returns the goal
   - **Given** a valid goal ID, **When** `delete_goal` is called, **Then** deletes the goal
   - **Given** an array of goal IDs, **When** `delete_many_goals` is called, **Then** deletes them all
   - **Given** a username, **When** `list_public_goals` is called, **Then** returns that user's public goals

2. **AC-2: Contact tools**
   - **Given** a valid API key, **When** `list_contacts` is called, **Then** returns all contact relationships
   - **Given** valid input, **When** `create_contact` is called with name and optional fields, **Then** creates the contact
   - **Given** a valid contact ID, **When** `get_contact` is called, **Then** returns the contact
   - **Given** a valid contact ID and update data, **When** `update_contact` is called, **Then** updates and returns the contact
   - **Given** a valid contact ID, **When** `delete_contact` is called, **Then** deletes the contact

3. **AC-3: Food tools**
   - **Given** a valid API key, **When** `list_food_logs` is called with optional date filter, **Then** returns food logs
   - **Given** valid input, **When** `create_food_log` is called, **Then** creates and returns the food log
   - **Given** a valid food log ID, **When** `get_food_log` is called, **Then** returns the food log
   - **Given** a valid food log ID and update data, **When** `update_food_log` is called, **Then** updates and returns the food log
   - **Given** a valid food log ID, **When** `delete_food_log` is called, **Then** deletes the food log
   - **Given** an array of food log IDs, **When** `delete_many_food_logs` is called, **Then** deletes them all
   - **Given** an optional date, **When** `get_food_calories_stats` is called, **Then** returns calorie stats
   - **Given** an optional date, **When** `get_food_protein_stats` is called, **Then** returns protein stats
   - **Given** an optional date, **When** `get_food_carbs_stats` is called, **Then** returns carbs stats

4. **AC-4: Blood pressure tools**
   - **Given** a valid API key, **When** `list_blood_pressure_logs` is called with optional date range, **Then** returns logs
   - **Given** valid input, **When** `create_blood_pressure_log` is called with systolic/diastolic, **Then** creates the log
   - **Given** a valid log ID, **When** `get_blood_pressure_log` is called, **Then** returns the log
   - **Given** a valid log ID and update data, **When** `update_blood_pressure_log` is called, **Then** updates the log
   - **Given** a valid log ID, **When** `delete_blood_pressure_log` is called, **Then** deletes the log

5. **AC-5: JSON schema validation on all tools**
   - **And** every tool has a zod-based input schema that validates parameters before calling the SDK
   - **And** invalid input returns a structured MCP error (isError: true) without hitting the API

6. **AC-6: Consistent structured responses**
   - **And** all successful responses use `{ content: [{ type: "text", text: JSON.stringify(result) }] }`
   - **And** all error responses use `{ content: [{ type: "text", text: JSON.stringify(errorObject) }], isError: true }`
   - **And** error objects include `code`, `message`, and optional `issues` array

7. **AC-7: Build succeeds**
   - **Given** the new tool registration files
   - **When** I run `pnpm --filter benji-mcp build`
   - **Then** the build succeeds with no TypeScript errors

8. **AC-8: Tools appear in tools/list**
   - **Given** the server is running
   - **When** a client sends `tools/list`
   - **Then** all 26 new tools appear with their names, descriptions, and input schemas

## Tasks / Subtasks

### Task Group A: File setup and wiring

- [x] **Task 1: Create `packages/benji-mcp/src/tools/goals.ts`** -- 7 tools: list_goals, create_goal, get_goal, update_goal, delete_goal, delete_many_goals, list_public_goals
- [x] **Task 2: Create `packages/benji-mcp/src/tools/contacts.ts`** -- 5 tools: list_contacts, create_contact, get_contact, update_contact, delete_contact
- [x] **Task 3: Create `packages/benji-mcp/src/tools/food.ts`** -- 9 tools: list_food_logs, create_food_log, get_food_log, update_food_log, delete_food_log, delete_many_food_logs, get_food_calories_stats, get_food_protein_stats, get_food_carbs_stats
- [x] **Task 4: Create `packages/benji-mcp/src/tools/blood-pressure.ts`** -- 5 tools: list_blood_pressure_logs, create_blood_pressure_log, get_blood_pressure_log, update_blood_pressure_log, delete_blood_pressure_log
- [x] **Task 5: Wire all 4 into server.ts** -- import and call registerGoalTools, registerContactTools, registerFoodTools, registerBloodPressureTools

### Task Group B: Build and verification

- [x] **Task 6: Verify build** -- `pnpm --filter benji-mcp build` succeeds
- [x] **Task 7: Verify tools appear in tools/list** -- all 26 new tools present

## Dev Notes

### SDK Method Reference

**Goals** (7 methods):
| MCP Tool | SDK Method | Path | Body |
|----------|-----------|------|------|
| `list_goals` | `Goals.goalsList()` | None | None |
| `create_goal` | `Goals.goalsCreate({ body })` | None | `{ name, dueDate?, emoji?, public?, done? }` |
| `get_goal` | `Goals.goalsGet({ path: { id } })` | `{ id }` | None |
| `update_goal` | `Goals.goalsUpdate({ path: { id }, body })` | `{ id }` | `{ data: { name?, dueDate?, emoji?, public?, done? } }` |
| `delete_goal` | `Goals.goalsDelete({ path: { id } })` | `{ id }` | None |
| `delete_many_goals` | `Goals.goalsDeleteMany({ body })` | None | `{ ids }` |
| `list_public_goals` | `Goals.goalsPublicList({ path: { username } })` | `{ username }` | None |

**Contacts** (5 methods -- all body-based):
| MCP Tool | SDK Method | Body |
|----------|-----------|------|
| `list_contacts` | `Contacts.contactsList()` | optional `{}` |
| `create_contact` | `Contacts.contactsCreate({ body })` | `{ name, contactId?, email?, phone?, birthday?, address?, avatarUrl?, showInWeeksOfLife?, relationshipType? }` |
| `get_contact` | `Contacts.contactsGet({ body })` | `{ id }` |
| `update_contact` | `Contacts.contactsUpdate({ body })` | `{ id, data: { ... } }` |
| `delete_contact` | `Contacts.contactsDelete({ body })` | `{ id }` |

**Food** (9 methods):
| MCP Tool | SDK Method | Path | Body |
|----------|-----------|------|------|
| `list_food_logs` | `Food.foodLogsList({ body })` | None | `{ date?: { year, month, day } }` |
| `create_food_log` | `Food.foodLogsCreate({ body })` | None | `{ portionSize, healthiness, title?, reasons?, mealType?, protein?, carbs?, fat?, calories?, onPath?, date? }` |
| `get_food_log` | `Food.foodLogsGet({ path: { id } })` | `{ id }` | None |
| `update_food_log` | `Food.foodLogsUpdate({ path: { id }, body })` | `{ id }` | `{ data: { ... } }` |
| `delete_food_log` | `Food.foodLogsDelete({ path: { id } })` | `{ id }` | None |
| `delete_many_food_logs` | `Food.foodLogsDeleteMany({ body })` | None | `{ ids }` |
| `get_food_calories_stats` | `Food.foodLogsGetCaloriesStats({ body })` | None | `{ date?: { year, month, day } }` |
| `get_food_protein_stats` | `Food.foodLogsGetProteinStats({ body })` | None | `{ date?: { year, month, day } }` |
| `get_food_carbs_stats` | `Food.foodLogsGetCarbsStats({ body })` | None | `{ date?: { year, month, day } }` |

**BloodPressureLogs** (5 methods -- all body-based):
| MCP Tool | SDK Method | Body |
|----------|-----------|------|
| `list_blood_pressure_logs` | `BloodPressureLogs.bloodPressureLogsList({ body })` | `{ dateFrom?, dateTo? }` |
| `create_blood_pressure_log` | `BloodPressureLogs.bloodPressureLogsCreate({ body })` | `{ systolic, diastolic, note?, date? }` |
| `get_blood_pressure_log` | `BloodPressureLogs.bloodPressureLogsGet({ body })` | `{ id }` |
| `update_blood_pressure_log` | `BloodPressureLogs.bloodPressureLogsUpdate({ body })` | `{ id, data: { systolic?, diastolic?, note?, date? } }` |
| `delete_blood_pressure_log` | `BloodPressureLogs.bloodPressureLogsDelete({ body })` | `{ id }` |

### Total: 26 tools (7 + 5 + 9 + 5)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Completion Notes List

- 26 total MCP tools implemented across 4 resource files
- Goals: 7 tools (list, create, get, update, delete, delete_many, list_public)
- Contacts: 5 tools (list, create, get, update, delete) with relationship type enum
- Food: 9 tools (list, create, get, update, delete, delete_many, calories_stats, protein_stats, carbs_stats)
- Blood Pressure: 5 tools (list, create, get, update, delete)
- All tools use shared helpers from ./util.js
- Build verified with pnpm --filter benji-mcp build

### File List

- `packages/benji-mcp/src/tools/goals.ts` -- NEW: 7 goal tool registrations
- `packages/benji-mcp/src/tools/contacts.ts` -- NEW: 5 contact tool registrations
- `packages/benji-mcp/src/tools/food.ts` -- NEW: 9 food tool registrations
- `packages/benji-mcp/src/tools/blood-pressure.ts` -- NEW: 5 blood pressure tool registrations
- `packages/benji-mcp/src/server.ts` -- MODIFIED: import and call all 4 register functions
