# Troubleshooting Guide

## Common TypeScript Errors & Solutions

### oRPC Procedure Patterns

#### ❌ Error: `Property 'input' does not exist on type`

**Problem**: Using `oz.input()` wrapper function which doesn't exist.

```typescript
// WRONG
import { oz } from "@orpc/zod";
const procedure = authedProcedure
  .input(oz.input(z.object({ name: z.string() }))) // ERROR!
```

**Solution**: Use `.input()` directly with Zod schemas:

```typescript
// CORRECT
import { z } from "zod";
const procedure = authedProcedure
  .input(z.object({ name: z.string() })) // ✓
```

**Note**: `oz` from `@orpc/zod` provides extended types (File, Blob, URL) only:
```typescript
import { oz } from "@orpc/zod";
const schema = z.object({
  file: oz.file(), // Only use oz for these extended types
  blob: oz.blob(),
  url: oz.url(),
});
```

---

#### ❌ Error: `Property 'input' does not exist on type 'MiddlewareOptions'`

**Problem**: Trying to access typed `input` in middleware `.use()` functions.

```typescript
// WRONG - Middleware doesn't have typed input access
export const createEmployee = authedProcedure
  .input(z.object({ email: z.string() }))
  .use(async ({ next, context, input }) => {
    // input is not typed here!
    const existing = await db.query.employees.findFirst({
      where: eq(employees.email, input.email), // Type error
    });
    if (existing) throw new Error("Email exists");
    return next({ context });
  })
  .handler(async ({ input }) => { ... });
```

**Solution**: Move validation logic into the handler:

```typescript
// CORRECT - Validation in handler where input is typed
export const createEmployee = authedProcedure
  .input(z.object({ email: z.string() }))
  .handler(async ({ input }) => {
    // input is properly typed here
    const existing = await db.query.employees.findFirst({
      where: eq(employees.email, input.email), // ✓
    });
    if (existing) throw new Error("Email exists");
    // ... rest of logic
  });
```

---

### Drizzle ORM Type Safety

#### ❌ Error: `Argument of type 'SQL<unknown> | undefined' is not assignable`

**Problem**: Drizzle SQL helpers like `or()` and `and()` can return `undefined`.

```typescript
// WRONG - Pushing potentially undefined to array
const filters = [eq(employees.organizationId, input.organizationId)];

if (input?.search) {
  filters.push(
    or(
      like(employees.firstName, `%${input.search}%`),
      like(employees.lastName, `%${input.search}%`)
    ) // Type error: or() can return undefined
  );
}
```

**Solution**: Check for undefined before using SQL helper results:

```typescript
// CORRECT - Check for undefined
const filters = [eq(employees.organizationId, input.organizationId)];

if (input?.search) {
  const searchFilter = or(
    like(employees.firstName, `%${input.search}%`),
    like(employees.lastName, `%${input.search}%`)
  );
  if (searchFilter) {  // Check for undefined
    filters.push(searchFilter); // ✓
  }
}

const results = await db.query.employees.findMany({
  where: and(...filters),
});
```

---

### Hono Middleware Imports

#### ❌ Error: `TS2306: File '...' is not a module`

**Problem**: Hono middleware type definition files may be empty or missing.

```typescript
// May cause TS2306 error if type definitions are missing
import { cors } from "hono/cors";
import { logger } from "hono/logger";
```

**Solution 1**: Use default imports (preferred):

```typescript
// CORRECT - Default imports work
import cors from "hono/cors";
import logger from "hono/logger";
```

**Solution 2**: Create local type declarations if needed:

```typescript
// apps/server/src/hono-middleware.d.ts
declare module "hono/cors" {
  import type { MiddlewareHandler } from "hono";

  interface CORSOptions {
    origin?: string | string[] | ((origin: string) => string | null);
    allowMethods?: string[];
    allowHeaders?: string[];
    maxAge?: number;
    credentials?: boolean;
    exposeHeaders?: string[];
  }

  export default function cors(options?: CORSOptions): MiddlewareHandler;
}

declare module "hono/logger" {
  import type { MiddlewareHandler } from "hono";
  export default function logger(): MiddlewareHandler;
}
```

**Always add explicit types for Hono handlers**:

```typescript
import { type Context, type Next, Hono } from "hono";

app.use("/*", async (c: Context, next: Next) => {
  // Handler logic
});

app.get("/", (c: Context) => {
  return c.text("OK");
});
```

---

### Monorepo Package Imports

#### ❌ Error: `TS2307: Cannot find module '@PeopleFlow-HR-Suite/db/schema'`

**Problem**: Importing from subpath not exposed in package.json exports.

```typescript
// WRONG - Subpath not exposed
import { employees } from "@PeopleFlow-HR-Suite/db/schema"; // ERROR!
import { organizations } from "@PeopleFlow-HR-Suite/db/schema/organizations"; // ERROR!
```

**Solution**: Import from root package path only:

```typescript
// CORRECT - Import from root
import { employees, organizations, db } from "@PeopleFlow-HR-Suite/db"; // ✓
```

**Ensure proper re-exports in package index**:

```typescript
// packages/db/src/index.ts
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export const db = drizzle(env.DATABASE_URL, { schema });

// Re-export all schema tables and types
export * from "./schema"; // This is critical!
```

```typescript
// packages/db/src/schema/index.ts (barrel file)
export * from "./organizations";
export * from "./departments";
export * from "./employees";
export * from "./tax-jurisdictions";
// ... all schemas
```

---

#### ❌ Error: `Module has no exported member 'authedProcedure'`

**Problem**: Importing from wrong location or missing export.

```typescript
// WRONG - Wrong import path
import { authedProcedure } from "../context"; // ERROR!
```

**Solution**: Import from correct location:

```typescript
// CORRECT - Import from parent directory
import { authedProcedure } from ".."; // ✓
```

**Ensure export exists in the package**:

```typescript
// packages/api/src/index.ts
export const protectedProcedure = publicProcedure.use(requireAuth);

// Export alias for backward compatibility
export const authedProcedure = protectedProcedure; // ✓
```

---

### Import Best Practices

#### ⚠️ Warning: `Avoid namespace imports`

**Problem**: Namespace imports hurt tree-shaking and increase bundle size.

```typescript
// AVOID - Namespace import
import * as SecureStore from "expo-secure-store";
import * as Haptics from "expo-haptics";

SecureStore.setItem("key", "value");
```

**Solution**: Use named imports:

```typescript
// BETTER - Named imports
import { setItem, getItem } from "expo-secure-store";
import { impactAsync } from "expo-haptics";

setItem("key", "value"); // ✓
```

**Exception**: Drizzle schema and Better Auth often require namespace imports:

```typescript
// Acceptable for schema definition
import * as schema from "./schema";
export const db = drizzle(env.DATABASE_URL, { schema });
```

---

## Debugging Checklist

When encountering TypeScript errors, follow these steps:

### 1. Module Resolution Errors (TS2306, TS2307)

- [ ] Check if importing from correct package path (root, not subpath)
- [ ] Verify `package.json` exports field includes the import path
- [ ] Check if type definition files exist (`.d.ts` not empty)
- [ ] Create local type declaration if third-party types are missing
- [ ] Ensure package index re-exports all schemas

### 2. oRPC Procedure Errors

- [ ] Remove any `oz.input()` wrappers - use `.input()` directly
- [ ] Move validation logic from middleware to handlers
- [ ] Check import path for `authedProcedure` (should be from `".."`)
- [ ] Verify Zod schemas are used directly with `.input()`

### 3. Drizzle SQL Type Errors

- [ ] Store SQL helper results (`or()`, `and()`) in variables
- [ ] Check for `undefined` before pushing to arrays
- [ ] Use type guards when working with nullable columns
- [ ] Enable `strictNullChecks` in `tsconfig.json`

### 4. Hono Handler Errors

- [ ] Add explicit `Context` and `Next` type annotations
- [ ] Use default imports for middleware
- [ ] Create local type declarations if type definitions are empty
- [ ] Check Hono version compatibility

### 5. Package Export Errors

- [ ] Ensure schemas are re-exported from package `index.ts`
- [ ] Check barrel files (`schema/index.ts`) export all sub-modules
- [ ] Verify `package.json` exports field is correctly configured
- [ ] Use `export *` cautiously (may trigger Ultracite warnings)

---

## TypeScript Configuration

**Key Settings** (`packages/config/tsconfig.base.json`):

```json
{
  "compilerOptions": {
    "strict": true,                    // Enable all strict checks
    "skipLibCheck": true,              // Skip type checking .d.ts files
    "moduleResolution": "bundler",     // Modern bundler resolution
    "noUncheckedIndexedAccess": true,  // Array access returns T | undefined
    "noUnusedLocals": true,            // Catch unused variables
    "noUnusedParameters": true         // Catch unused parameters
  }
}
```

**Important Notes**:
- `skipLibCheck: true` skips type checking of declaration files but **NOT** module resolution
- Module resolution errors (TS2306) require local type declarations or package fixes
- `noUncheckedIndexedAccess: true` makes array access safer by adding `| undefined`
- Strict mode catches most type errors early

---

## Common Commands

```bash
# Type checking
bun run check-types              # Check all workspaces
cd apps/server && bun run check-types  # Check specific workspace

# Linting
bunx @biomejs/biome check .      # Check with Biome directly
bun x ultracite fix              # Auto-fix issues (requires config)

# Development
bun run dev                      # Start all apps
bun run dev:server               # Start server only
bun run dev:web                  # Start web only

# Database
bun run db:push                  # Push schema changes
bun run db:studio                # Open Drizzle Studio
```

---

## Quick Reference

### oRPC Pattern
```typescript
export const myProcedure = authedProcedure
  .input(z.object({ ... }))  // Direct Zod schema
  .handler(async ({ input }) => {
    // Validation and logic here
  });
```

### Drizzle SQL Safety
```typescript
const filters = [baseFilter];
const sqlResult = or(...conditions);
if (sqlResult) filters.push(sqlResult);
```

### Hono Middleware
```typescript
import cors from "hono/cors";  // Default import
import logger from "hono/logger";

app.use(logger());
app.use("/*", cors({ origin: env.CORS_ORIGIN }));
```

### Package Imports
```typescript
// Always import from root
import { db, employees } from "@PeopleFlow-HR-Suite/db";
```

---

**Last Updated**: 2025-01-19
**See Also**: `STACK.md` for technology documentation, `CLAUDE.md` for coding standards
