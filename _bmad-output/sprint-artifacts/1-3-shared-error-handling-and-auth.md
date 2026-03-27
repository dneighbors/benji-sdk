# Story 1.3: Shared error handling and auth configuration

Status: review

## Story

As a developer,
I want a shared auth configuration pattern using `BENJI_API_KEY` and normalized error types,
so that MCP and CLI don't duplicate auth/error logic.

## Acceptance Criteria

1. **AC-1: Auth initialization from env var**
   - **Given** `BENJI_API_KEY` is set in the environment
   - **When** either MCP or CLI calls `initializeFromEnv()`
   - **Then** the SDK client is configured with that key via `configure({ apiKey })`

2. **AC-2: Missing API key produces clear error**
   - **Given** `BENJI_API_KEY` is NOT set in the environment
   - **When** either MCP or CLI calls `initializeFromEnv()`
   - **Then** a `BenjiConfigError` is thrown with message: `"BENJI_API_KEY environment variable is required. Get your API key from https://app.benji.so/settings"`

3. **AC-3: Optional base URL override**
   - **Given** `BENJI_BASE_URL` is set in the environment
   - **When** `initializeFromEnv()` is called
   - **Then** the SDK client uses that base URL instead of the default

4. **AC-4: Normalized error types exist**
   - **And** a `BenjiApiError` class exists with properties: `status`, `code`, `message`, `issues` (optional)
   - **And** a `BenjiConfigError` class exists for configuration-related errors
   - **And** a `BenjiError` base class exists that both extend
   - **And** all error classes extend `Error` and have proper `name` properties

5. **AC-5: Error wrapper normalizes SDK responses**
   - **Given** an SDK call returns `{ error }` (non-throw mode)
   - **When** passed through `wrapSdkCall()`
   - **Then** 401 errors produce a `BenjiApiError` with `status: 401` and the original API message
   - **And** 400 errors produce a `BenjiApiError` with `status: 400`, the message, and any validation `issues`
   - **And** 404 errors produce a `BenjiApiError` with `status: 404` and the original message
   - **And** 500 errors produce a `BenjiApiError` with `status: 500` and the original message
   - **And** 403 errors produce a `BenjiApiError` with `status: 403` and the original message
   - **And** successful responses return `{ data }` unwrapped

6. **AC-6: Exports are accessible from SDK package**
   - **And** all new types and functions are exported from `benji-sdk` package root
   - **And** `import { initializeFromEnv, BenjiApiError, BenjiConfigError, wrapSdkCall } from "benji-sdk"` works

7. **AC-7: Build succeeds**
   - **Given** the new files are added
   - **When** I run `pnpm --filter benji-sdk build`
   - **Then** the build succeeds with no errors
   - **And** existing SDK public API (all generated exports) remains unchanged

## Tasks / Subtasks

### Task Group A: Error types (AC: #4)

- [x] **Task 1: Create `packages/benji-sdk/src/errors.ts`** (AC: #4)
  - Create a `BenjiError` base class extending `Error`:
    ```ts
    export class BenjiError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'BenjiError';
      }
    }
    ```
  - Create a `BenjiConfigError` class extending `BenjiError`:
    ```ts
    export class BenjiConfigError extends BenjiError {
      constructor(message: string) {
        super(message);
        this.name = 'BenjiConfigError';
      }
    }
    ```
  - Create a `BenjiApiError` class extending `BenjiError`:
    ```ts
    export class BenjiApiError extends BenjiError {
      public readonly status: number;
      public readonly code: string;
      public readonly issues?: Array<{ message: string }>;

      constructor(options: {
        status: number;
        code: string;
        message: string;
        issues?: Array<{ message: string }>;
      }) {
        super(options.message);
        this.name = 'BenjiApiError';
        this.status = options.status;
        this.code = options.code;
        this.issues = options.issues;
      }
    }
    ```
  - The `BenjiApiError` shape matches the common shape of `ErrorBadRequest`, `ErrorUnauthorized`, `ErrorForbidden`, `ErrorNotFound`, `ErrorInternalServerError` from `types.gen.ts` (all share `message`, `code`, `issues?`)

### Task Group B: Auth initialization (AC: #1, #2, #3)

- [x] **Task 2: Create `packages/benji-sdk/src/env.ts`** (AC: #1, #2, #3)
  - Import `configure` from `./index.js` (the existing SDK entry point)
  - Import `BenjiConfigError` from `./errors.js`
  - Implement `initializeFromEnv()`:
    ```ts
    export function initializeFromEnv(): void {
      const apiKey = process.env.BENJI_API_KEY;
      if (!apiKey) {
        throw new BenjiConfigError(
          'BENJI_API_KEY environment variable is required. Get your API key from https://app.benji.so/settings'
        );
      }
      const baseUrl = process.env.BENJI_BASE_URL;
      configure({ apiKey, baseUrl });
    }
    ```
  - **Important:** This function is intentionally synchronous. It reads env vars and calls `configure()`. No async needed.

### Task Group C: SDK call wrapper (AC: #5)

- [x] **Task 3: Create `packages/benji-sdk/src/wrapper.ts`** (AC: #5)
  - Import `BenjiApiError` from `./errors.js`
  - Implement `wrapSdkCall<T>()` that takes an SDK response promise and normalizes it:
    ```ts
    /**
     * Wraps an SDK call and normalizes errors into BenjiApiError.
     *
     * The @hey-api/openapi-ts client returns { data, error, response } in non-throw mode.
     * This function extracts data on success or throws a BenjiApiError on failure.
     *
     * @example
     * ```ts
     * const todos = await wrapSdkCall(Todos.todosList({ body: { screen: "today" } }));
     * // todos is the data, or throws BenjiApiError
     * ```
     */
    export async function wrapSdkCall<T>(
      promise: Promise<{ data?: T; error?: unknown; response: Response }>
    ): Promise<T> {
      const result = await promise;

      if (result.error) {
        const status = result.response.status;
        const err = result.error as { message?: string; code?: string; issues?: Array<{ message: string }> };
        throw new BenjiApiError({
          status,
          code: err.code ?? `HTTP_${status}`,
          message: err.message ?? `API request failed with status ${status}`,
          issues: err.issues,
        });
      }

      return result.data as T;
    }
    ```
  - **Design rationale:** The `@hey-api/openapi-ts` client defaults to `ThrowOnError = false`, returning `{ data, error, response }`. The wrapper pattern lets MCP/CLI call SDK methods in their default mode and get clean typed data or a structured error. This is preferable to setting `ThrowOnError = true` globally because it preserves access to the response object and keeps error handling explicit.

### Task Group D: Wire up exports (AC: #6, #7)

- [x] **Task 4: Update `packages/benji-sdk/src/index.ts` to re-export new modules** (AC: #6)
  - Add to the bottom of the existing `index.ts`:
    ```ts
    // Error types and utilities
    export { BenjiError, BenjiConfigError, BenjiApiError } from "./errors.js";
    export { initializeFromEnv } from "./env.js";
    export { wrapSdkCall } from "./wrapper.js";
    ```
  - **Important:** Do NOT modify any existing lines in `index.ts`. Only append new exports. The existing `configure()`, `client`, and `export * from "./client/index.js"` must remain untouched.

- [x] **Task 5: Build and verify** (AC: #7)
  - Run `pnpm --filter benji-sdk build`
  - Verify: build succeeds with no errors
  - Verify: `packages/benji-sdk/dist/errors.js`, `dist/env.js`, `dist/wrapper.js` exist
  - Verify: `packages/benji-sdk/dist/index.d.ts` exports `BenjiError`, `BenjiConfigError`, `BenjiApiError`, `initializeFromEnv`, `wrapSdkCall`
  - Verify: existing exports (`configure`, `client`, `Todos`, `Habits`, etc.) still present in `dist/index.d.ts`

- [x] **Task 6: Verify from consumer perspective** (AC: #6)
  - Run `pnpm --filter benji-mcp build` and `pnpm --filter benji-cli build` to ensure workspace consumers can still resolve `benji-sdk`
  - Optionally, add a quick smoke-test import in `packages/benji-mcp/src/index.ts`:
    ```ts
    import { initializeFromEnv, BenjiApiError, wrapSdkCall } from "benji-sdk";
    ```
    Build, then revert the import (the placeholder should remain clean for Story 2.1)

## Dev Notes

### Architecture Constraints

- **ESM-only:** All files must use `.js` extensions in imports (e.g., `./errors.js` not `./errors`). The SDK uses `"module": "ESNext"` and `"moduleResolution": "bundler"` but the built output needs `.js` extensions for Node.js ESM resolution. The existing `fix-imports.mjs` script handles this for auto-generated files in `src/client/`, but **hand-written files in `src/` should use `.js` extensions directly** in their import statements.
- **No new dependencies:** This story adds zero new npm dependencies. Everything uses the existing SDK infrastructure and Node.js built-in `process.env`.
- **Do not modify generated files:** Files under `src/client/` are auto-generated by `@hey-api/openapi-ts`. Never edit them manually. The new files (`errors.ts`, `env.ts`, `wrapper.ts`) live directly under `src/` alongside `index.ts`.
- **TypeScript strict mode:** The project uses `"strict": true`. All types must be explicit, no implicit `any`.

### SDK Client Response Shape

The `@hey-api/openapi-ts` client (v0.90.0) returns different shapes depending on `responseStyle` and `throwOnError`:

- **Default (non-throw, fields):** `{ data: T | undefined, error: E | undefined, request: Request, response: Response }`
- When `error` is present, `data` is `undefined` and vice versa.
- The `error` value matches the API error types (`ErrorBadRequest`, `ErrorUnauthorized`, etc.) which all share the shape `{ message: string, code: string, issues?: Array<{ message: string }> }`.
- The `response.status` gives the HTTP status code (400, 401, 403, 404, 500).

### Source Tree: Files to Create/Modify

| Action | File |
|--------|------|
| CREATE | `packages/benji-sdk/src/errors.ts` |
| CREATE | `packages/benji-sdk/src/env.ts` |
| CREATE | `packages/benji-sdk/src/wrapper.ts` |
| MODIFY | `packages/benji-sdk/src/index.ts` (append exports) |

### Error Type Design Rationale

The Benji API returns errors in a consistent shape across all status codes (seen in `types.gen.ts`):

```ts
{
  message: string;  // Human-readable error message
  code: string;     // Machine-readable error code
  issues?: Array<{ message: string }>;  // Validation issues (mainly 400)
}
```

The `BenjiApiError` class mirrors this shape and adds `status` (HTTP status code) for programmatic handling. This lets consumers do:

```ts
try {
  const data = await wrapSdkCall(Todos.todosList({ body: { screen: "today" } }));
} catch (e) {
  if (e instanceof BenjiApiError) {
    if (e.status === 401) { /* auth issue */ }
    if (e.status === 400) { /* validation: check e.issues */ }
  }
}
```

### Circular Import Prevention

`env.ts` imports from `index.ts` (for `configure`). To avoid circular imports if this becomes a problem, `configure` could be imported directly from where it's defined. However, since `index.ts` re-exports from `client/index.js` and defines `configure` locally, the import `from "./index.js"` is safe as long as `index.ts` does not import from `env.ts` at the module level (it only re-exports the symbol). The re-export `export { initializeFromEnv } from "./env.js"` in `index.ts` creates a one-way dependency: `env.ts` -> `index.ts` for `configure`, and `index.ts` re-exports `env.ts` symbols. This is a standard pattern in TypeScript and does not cause circular import issues because ES modules handle this correctly.

**Alternative if needed:** Import `configure` directly, or import `client` from `./client/client.gen.js` and call `client.setConfig()` directly in `env.ts`. This completely avoids any circular reference concern. The developer should use whichever approach builds cleanly.

### Project Structure Notes

**Directory layout after this story:**

```
packages/benji-sdk/src/
  index.ts            (MODIFIED - added 3 re-export lines)
  errors.ts           (NEW - BenjiError, BenjiConfigError, BenjiApiError)
  env.ts              (NEW - initializeFromEnv)
  wrapper.ts          (NEW - wrapSdkCall)
  client/             (UNCHANGED - auto-generated)
    index.ts
    types.gen.ts
    sdk.gen.ts
    client.gen.ts
    client/
    core/
```

### Learnings from Story 1.1

- The monorepo uses pnpm workspaces with `packages/*`. The SDK is at `packages/benji-sdk/`.
- ESM `.js` extensions are required in all hand-written import paths. The `fix-imports.mjs` only patches auto-generated files.
- Build pipeline is `generate` -> `fix-imports` -> `tsc`. New hand-written files bypass `generate` and `fix-imports` and are compiled directly by `tsc`.
- `pnpm -r build` runs builds in dependency order. SDK builds before MCP and CLI.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3 - acceptance criteria and FR2/FR3]
- [Source: packages/benji-sdk/src/index.ts - configure() function and BenjiConfig interface]
- [Source: packages/benji-sdk/src/client/types.gen.ts - ErrorBadRequest, ErrorUnauthorized, ErrorForbidden, ErrorNotFound, ErrorInternalServerError type definitions]
- [Source: packages/benji-sdk/src/client/client/types.gen.ts#RequestResult - SDK response shape (data/error/response)]
- [Source: packages/benji-sdk/src/client/sdk.gen.ts - SDK class methods showing ThrowOnError default = false]
- [Source: packages/benji-sdk/package.json - build scripts and exports configuration]
- [Source: packages/benji-sdk/tsconfig.json - strict mode, ESNext module, bundler resolution]
- [Source: _bmad-output/sprint-artifacts/1-1-convert-to-pnpm-workspace-monorepo.md - ESM and workspace learnings]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List

### File List

- `packages/benji-sdk/src/errors.ts` (CREATED) - BenjiError, BenjiConfigError, BenjiApiError classes
- `packages/benji-sdk/src/env.ts` (CREATED) - initializeFromEnv() function
- `packages/benji-sdk/src/wrapper.ts` (CREATED) - wrapSdkCall() function
- `packages/benji-sdk/src/index.ts` (MODIFIED) - Added re-exports for errors, env, wrapper
