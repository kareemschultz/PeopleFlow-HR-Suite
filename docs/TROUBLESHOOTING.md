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

---

## Hono Framework Patterns

### ❌ Error: `SyntaxError: module does not have an export named 'default'`

**Problem**: Attempting to use default imports for Hono middleware when they only export named exports.

```typescript
// WRONG - Will cause runtime error
import cors from "hono/cors";
import logger from "hono/logger";

app.use(cors({ origin: "*" }));
```

**Error Message**:
```
SyntaxError: module '/node_modules/hono/dist/middleware/cors/index.js' 
does not have an export named 'default'. Did you mean 'cors'?
```

**Solution**: Use named imports for all Hono middleware:

```typescript
// CORRECT - Hono v4 uses named exports
import { cors } from "hono/cors";
import { logger } from "hono/logger";

app.use(cors({ origin: "*" }));
app.use(logger());
```

**Debugging Steps**:
1. Check actual module exports: `cat node_modules/hono/dist/middleware/cors/index.js`
2. Look for `export { cors }` instead of `export default`
3. Remove any custom `.d.ts` type declaration files that might hide the real exports
4. Use named imports consistently for all Hono middleware

**Common Hono middleware imports**:
```typescript
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { bearerAuth } from "hono/bearer-auth";
import { jwt } from "hono/jwt";
import { compress } from "hono/compress";
import { csrf } from "hono/csrf";
```

---

## Environment Variable Strategy

### ❌ Error: `Invalid environment variables: expected string, received undefined`

**Problem**: Required environment variables for optional features block development.

```typescript
// WRONG - Requires payment vars even if not using payments yet
export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    POLAR_ACCESS_TOKEN: z.string().min(1), // Blocks dev if missing!
    POLAR_SUCCESS_URL: z.url(),
  },
});
```

**Solution**: Make feature-specific environment variables optional during development:

```typescript
// CORRECT - Optional feature vars don't block development
export const env = createEnv({
  server: {
    // Core required vars
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    
    // Optional feature vars (payments, analytics, etc.)
    POLAR_ACCESS_TOKEN: z.string().min(1).optional(),
    POLAR_SUCCESS_URL: z.url().optional(),
  },
});
```

**Pattern**:
- **Required**: Database, authentication, core services
- **Optional**: Payment integrations, analytics, monitoring, third-party APIs
- Configure optional vars later when implementing those features

---

## Vite & Plugin Dependency Issues

### ❌ Error: Nested dependency with incompatible ESM exports

**Problem**: Vite plugins with bundled dependencies causing ESM import errors.

```typescript
// Plugin with nested zod causing issues
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [tanstackRouter({})],
});
```

**Error Message**:
```
file:///node_modules/@tanstack/router-plugin/node_modules/zod/v3/errors.js:1
import defaultErrorMap from "./locales/en.js";
       ^^^^^^^^^^^^^^^
SyntaxError: The requested module './locales/en.js' does not provide an export named 'default'
```

**Root Cause**:
- Plugin bundles its own copy of a shared dependency (e.g., zod)
- Bundled copy uses old export pattern incompatible with current ESM
- Can't be fixed with resolutions since it's bundled inside plugin dist

**Workaround**: Temporarily disable problematic plugin:

```typescript
// WORKAROUND - Disable plugin until fixed upstream
export default defineConfig({
  plugins: [
    // Temporarily disabled due to zod ESM import issue in nested dependencies
    // TODO: Re-enable when plugin fixes bundled dependency exports
    // tanstackRouter({}),
    
    // Other plugins still work
    react(),
    tailwindcss(),
  ],
});
```

**When to use this workaround**:
1. Plugin is non-critical for development (like route generation)
2. Core functionality works without it  
3. Issue is in plugin's bundled dependencies, not your code
4. Waiting for upstream fix

**Alternative approaches**:
- Check if newer plugin version fixes the issue
- Try package manager's hoisting/deduplication features
- Use different plugin that doesn't bundle the problematic dependency

---

## API Testing Without Authentication

### Pattern: Temporary Test Endpoints for Development

When building APIs with authentication, create temporary public test endpoints to verify database connectivity and basic operations:

```typescript
// TEMPORARY: Test endpoint to verify DB connectivity
// REMOVE BEFORE PRODUCTION
export const appRouter = {
  // Production endpoints with auth
  organizations: organizationsRouter, // Requires auth
  
  // Test endpoint for development (public, no auth required)
  testDbConnection: publicProcedure.handler(async () => {
    const { db, organizations } = await import("@PeopleFlow-HR-Suite/db");
    const orgs = await db.select().from(organizations).limit(5);
    return {
      connected: true,
      organizationCount: orgs.length,
      organizations: orgs,
    };
  }),
};
```

**Benefits**:
- Verify database schema and queries work
- Test API routing before auth is fully configured
- Quick validation during development
- Doesn't require setting up test users/sessions

**Remember**: Add clear comments and remove before production!

---

## Checklist: Server Startup Issues

When the development server fails to start, check in this order:

1. **Import Patterns**
   - [ ] Hono middleware using named imports? (`import { cors }`)
   - [ ] No custom `.d.ts` files hiding real exports?

2. **Environment Variables**
   - [ ] All required vars set in `.env`?
   - [ ] Optional feature vars marked with `.optional()`?
   - [ ] Check error message for missing var name

3. **Dependencies**
   - [ ] `bun install` completed without errors?
   - [ ] No nested dependency ESM conflicts?
   - [ ] Try `rm -rf node_modules && bun install`

4. **Database Connection**
   - [ ] PostgreSQL running? (`bun run db:start`)
   - [ ] Schema pushed? (`bun run db:push`)
   - [ ] DATABASE_URL correct in `.env`?

5. **Port Conflicts**
   - [ ] Is port already in use? `lsof -ti:3000 | xargs kill -9`
   - [ ] Check `ps aux | grep bun` for zombie processes


---

## RESOLUTION: Nested Dependency Conflicts (UPDATED)

### ✅ Solution: Use Bun's resolutions/overrides to force dependency deduplication

**Problem**: Vite plugins with bundled dependencies causing ESM import errors.

**Root Cause**:
- Plugins bundle their own copies of shared dependencies (like zod)
- These bundled copies may use old export patterns
- Standard `bun install` doesn't deduplicate these nested dependencies

**PERMANENT SOLUTION**: Add `resolutions` and `overrides` to root package.json:

```json
{
  "resolutions": {
    "zod": "^4.3.5"
  },
  "overrides": {
    "zod": "^4.3.5"
  }
}
```

Then reinstall:
```bash
rm -rf node_modules apps/*/node_modules
bun install
```

**Verification**:
```bash
# Check if nested dependency was removed
test -d node_modules/@tanstack/router-plugin/node_modules/zod && \
  echo "Still nested" || echo "Deduplicated successfully!"
```

**How it works**:
- `resolutions` (Yarn format) and `overrides` (npm format) force ALL packages in the dependency tree to use the specified version
- Bun supports both formats for cross-compatibility
- Prevents plugins from using their own bundled versions
- Applies to the entire workspace in monorepos

**When to use**:
- Nested dependency causing ESM/CJS import errors  
- Multiple versions of same package causing type conflicts
- Plugin bundled dependency incompatible with your workspace version

**References**:
- [Bun Overrides and Resolutions Docs](https://bun.com/docs/pm/overrides)
- [Bun v1.0.6 Release Notes](https://bun.com/blog/bun-v1.0.6)

