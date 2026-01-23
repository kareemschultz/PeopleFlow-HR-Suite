# Gemini Agent Context & Code Standards

This project is **PeopleFlow-HR-Suite**, a multi-country HR & Payroll SaaS built on the **Better-T-Stack**.

## 🚀 Technology Stack

**⚠️ CRITICAL**: Always reference the official documentation in `STACK.md`.

- **Runtime**: Bun 1.x
- **Language**: TypeScript 5.x
- **Monorepo**: Turborepo
- **Frontend**: React 19, TanStack Router, Tailwind CSS v4, shadcn/ui (maia), HugeIcons
- **Backend**: Hono (v4), oRPC (Type-safe API), Better Auth
- **Database**: PostgreSQL 14+, Drizzle ORM
- **Mobile**: React Native (Expo), NativeWind
- **Desktop**: Tauri v2
- **Linting**: Ultracite (Biome)

---

## 🏗️ Project Structure

- **`apps/web`**: Frontend (React + TanStack Router)
  - `src/routes`: File-based routing (generated via `tsr generate`)
  - `src/utils/orpc.ts`: Type-safe API client
- **`apps/server`**: Backend (Hono)
  - `src/index.ts`: Entry point
  - `src/routes`: Hono/oRPC handlers
- **`apps/native`**: Mobile (Expo)
- **`packages/api`**: Shared business logic & routers
  - `src/routers`: oRPC procedure definitions
  - `src/services`: Domain logic (Tax, Payroll, etc.)
- **`packages/db`**: Database schema & queries
  - `src/schema`: Drizzle definitions (`organizations.ts`, `employees.ts`, etc.)
- **`packages/auth`**: Better Auth configuration
- **`packages/config`**: Shared configurations
- **`.beads`**: Local issue tracking

---

## 🛠️ Core Workflows

### 1. Database Updates
```bash
# Edit schema in packages/db/src/schema/*.ts
bun run db:push    # Push changes
bun run db:studio  # Verify in UI
```

### 2. Route Generation (TanStack Router)
**Note**: The project uses Zod v4, which conflicts with `@tanstack/router-generator`.
**Workaround**: Use the patched generator or run:
```bash
cd apps/web && bun x tsr generate
```
(Ensure `@tanstack/router-generator` is patched to support Zod v4 if errors occur).

### 3. Code Quality
```bash
bun x ultracite fix   # Format & Lint
bun run check-types   # TypeScript Check
```

### 4. Running the Stack
```bash
bun run dev           # Start everything
bun run dev:web       # Web only
bun run dev:server    # Server only
```

---

## 🧩 Key Patterns & Rules

### Type Safety
- **Strict Mode**: Enabled. No implicit `any`.
- **Validation**: Use Zod for all inputs.
- **API**: Use oRPC for end-to-end type safety.
- **Database**: Use Drizzle's type inference.

### Drizzle ORM
- **SQL Helpers**: Check for `undefined` before using `or()`, `and()`, etc.
  ```typescript
  // ✅ Correct
  const searchFilter = input.search ? or(...) : undefined;
  const where = searchFilter ? and(baseFilter, searchFilter) : baseFilter;
  ```
- **Exports**: Re-export new schemas in `packages/db/src/schema/index.ts`.

### Hono & Backend
- **Middleware**: Use default imports (`import cors from "hono/cors"`).
- **Context**: Explicitly type `Context` and `Next`.

### Frontend (React 19)
- **Components**: Functional components only.
- **Hooks**: Top-level only.
- **Routing**: File-based in `apps/web/src/routes`.
- **Icons**: Use `hugeicons-react`.

---

## 🔧 Stack-Specific Patterns & Anti-Patterns

### oRPC (API Layer)

**✅ Correct Patterns**:

```typescript
// ✅ Use .input() directly with Zod schemas
export const createEmployee = authedProcedure
	.input(z.object({ name: z.string() }))
	.handler(async ({ input }) => {
		// Validation logic goes in handler, not middleware
		const existing = await db.query.employees.findFirst({
			where: eq(employees.email, input.email),
		});
		if (existing) throw new Error("Email already exists");
		// ... rest of logic
	});

// ✅ Use oz from @orpc/zod for extended types only
import { oz } from "@orpc/zod";
const schema = z.object({
	file: oz.file(), // Only use oz for File, Blob, URL types
});
```

**❌ Anti-Patterns**:

```typescript
// ❌ WRONG: oz.input() doesn't exist
import { oz } from "@orpc/zod";
export const createEmployee = authedProcedure
	.input(oz.input(z.object({ name: z.string() }))) // ERROR!
	.handler(async ({ input }) => { ... });

// ❌ WRONG: Middleware doesn't have typed input access
export const createEmployee = authedProcedure
	.input(z.object({ email: z.string() }))
	.use(async ({ next, context, input }) => {
		// input is not typed here - middleware limitation
		const existing = await db.query.employees.findFirst({
			where: eq(employees.email, input.email), // Type error!
		});
		if (existing) throw new Error("...");
		return next({ context });
	})
	.handler(async ({ input }) => { ... });
```

**Key Learnings**:
- `oz` from `@orpc/zod` provides extended types (File, Blob, URL), **not** an input wrapper
- Use `.input(zodSchema)` directly, NOT `oz.input(zodSchema)`
- Middleware functions don't have typed access to validated `input` - move validation to handlers
- oRPC procedure structure: `.input()` → `.handler()` or `.use()` → `.handler()`

---

### Drizzle ORM (Database)

**✅ Correct Patterns**:

```typescript
// ✅ Check for undefined before using SQL helpers
const filters = [eq(employees.organizationId, input.organizationId)];

if (input?.search) {
	const searchFilter = or(
		like(employees.firstName, `%${input.search}%`),
		like(employees.lastName, `%${input.search}%`),
		like(employees.email, `%${input.search}%`)
	);
	// or() can return undefined, must check before pushing
	if (searchFilter) {
		filters.push(searchFilter);
	}
}

const employees = await db.query.employees.findMany({
	where: and(...filters),
});
```

**❌ Anti-Patterns**:

```typescript
// ❌ WRONG: Pushing potentially undefined to array
const filters = [eq(employees.organizationId, input.organizationId)];

if (input?.search) {
	filters.push(
		or(
			like(employees.firstName, `%${input.search}%`),
			like(employees.lastName, `%${input.search}%`)
		)
	); // Type error: or() can return undefined
}
```

**Key Learnings**:
- Drizzle's `or()` and `and()` can return `undefined` when given empty arrays
- Always store SQL helper results in variables and check for undefined before using
- Use strict null checks to catch these issues early

---

### Hono (Backend Framework)

**✅ Correct Patterns**:

```typescript
// ✅ Import middleware with default imports
import { type Context, Hono, type Next } from "hono";
import cors from "hono/cors";
import logger from "hono/logger";

const app = new Hono();

// ✅ Add explicit types for handler parameters
app.use(logger());
app.use("/*", cors({ origin: env.CORS_ORIGIN }));

app.on(["POST", "GET"], "/api/auth/*", (c: Context) =>
	auth.handler(c.req.raw)
);

app.use("/*", async (c: Context, next: Next) => {
	const context = await createContext({ context: c });
	// ... handler logic
});
```

**❌ Anti-Patterns**:

```typescript
// ❌ WRONG: Named imports for middleware (type definitions may be missing)
import { cors } from "hono/cors"; // May cause TS2306 error
import { logger } from "hono/logger"; // May cause TS2306 error

// ❌ WRONG: Missing type annotations
app.use("/*", async (c, next) => { // Implicit any error
	// ...
});
```

**Key Learnings**:
- Hono v4 uses default exports for middleware modules
- Some Hono packages may have empty type definition files - use local declarations if needed
- Always add explicit `Context` and `Next` types for handler parameters

---

### Monorepo Package Structure

**✅ Correct Patterns**:

```typescript
// ✅ Import from root package path
import { db, employees, organizations } from "@PeopleFlow-HR-Suite/db";

// ✅ Re-export all schemas from index
// packages/db/src/index.ts
export const db = drizzle(env.DATABASE_URL, { schema });
export * from "./schema"; // Re-export all schemas

// ✅ Schema index exports
// packages/db/src/schema/index.ts
export * from "./organizations";
export * from "./departments";
export * from "./employees";
// ... all schemas
```

**❌ Anti-Patterns**:

```typescript
// ❌ WRONG: Importing from subpath not exposed in package.json
import { employees } from "@PeopleFlow-HR-Suite/db/schema"; // ERROR!
import { organizations } from "@PeopleFlow-HR-Suite/db/schema/organizations"; // ERROR!

// ❌ WRONG: Not re-exporting from package index
// packages/db/src/index.ts
export const db = drizzle(env.DATABASE_URL, { schema });
// Missing: export * from "./schema";
```

**Key Learnings**:
- Always import from the root package path defined in package.json `exports` field
- Subpaths like `/schema` or `/schema/employees` must be explicitly exported in package.json
- Re-export all schemas from `packages/db/src/index.ts` for easy consumption
- Use barrel file (`schema/index.ts`) to aggregate all schema exports

---

### Import/Export Best Practices

**✅ Correct Patterns**:

```typescript
// ✅ Named imports from specific modules
import { authedProcedure } from "..";
import { db, employees, type NewEmployee } from "@PeopleFlow-HR-Suite/db";
import { eq, and, like } from "drizzle-orm";

// ✅ Avoid namespace imports (better tree-shaking)
import { getSession, setSession } from "expo-secure-store";

// ✅ Export alias for backward compatibility
export const protectedProcedure = publicProcedure.use(requireAuth);
export const authedProcedure = protectedProcedure; // Alias
```

**❌ Anti-Patterns**:

```typescript
// ❌ WRONG: Namespace imports hurt tree-shaking
import * as SecureStore from "expo-secure-store";
import * as Haptics from "expo-haptics";

// ❌ WRONG: Importing from wrong location
import { authedProcedure } from "../context"; // Should be from ".."
```

**Key Learnings**:
- Prefer named imports over namespace imports for better tree-shaking
- Ultracite/Biome will warn about namespace imports (`lint/performance/noNamespaceImport`)
- Create export aliases for backward compatibility when refactoring

---

### TypeScript Configuration

**✅ Configuration Highlights**:

```json
// packages/config/tsconfig.base.json
{
	"compilerOptions": {
		"strict": true,
		"skipLibCheck": true, // Skip type checking .d.ts files
		"moduleResolution": "bundler", // Use modern bundler resolution
		"noUncheckedIndexedAccess": true, // Array access returns T | undefined
		"noUnusedLocals": true,
		"noUnusedParameters": true
	}
}
```

**Key Learnings**:
- `skipLibCheck: true` skips type checking of declaration files but **not** module resolution
- Module resolution errors (TS2306) require local type declarations or package fixes
- `noUncheckedIndexedAccess: true` makes array access safer by adding `| undefined`
- Strict mode catches most type errors early

---

### Debugging Checklist

When encountering TypeScript errors:

1. **Module Resolution Errors (TS2306, TS2307)**:
   - Check if importing from correct package path (root, not subpath)
   - Verify package.json `exports` field includes the path
   - Check if type definitions exist (not empty .d.ts files)
   - Create local type declaration if third-party types are missing

2. **Type Errors in oRPC Procedures**:
   - Remove any `oz.input()` wrappers - use `.input()` directly
   - Move validation logic from middleware to handlers
   - Check import path for `authedProcedure` (should be from `".."`)

3. **Drizzle SQL Type Errors**:
   - Store SQL helper results in variables
   - Check for undefined before pushing to arrays
   - Use type guards when working with nullable columns

4. **Hono Handler Errors**:
   - Add explicit `Context` and `Next` type annotations
   - Use default imports for middleware
   - Create local type declarations if needed

5. **Package Export Errors**:
   - Ensure schemas are re-exported from package index
   - Check barrel files export all sub-modules
   - Use `export *` cautiously (Ultracite warns about barrel files)

---

## 🔧 Refactoring Patterns & Common Fixes

### Cognitive Complexity (Max: 20)

**Refactoring Strategies:**

1. **Extract Helper Functions** - Separate complex logic
2. **Extract Sub-Components** - Break large React components
3. **Reusable UI Patterns** - Create components like `EditableField`, `ApprovalCheckbox`
4. **State Management Helpers** - Centralize updates (`handleFieldChange`, `handleSettingChange`)

### Common TypeScript Fixes

**Missing Function Parameters:**
```typescript
// ❌ {formatCurrency(amount)}
// ✅ {formatCurrency(amount, currency)}
```

**Union Type Casts:**
```typescript
gender: formData.gender as "male" | "female" | "other" | undefined
employmentType: formData.employmentType as "full_time" | "part_time"
```

**Complex Query Types:**
```typescript
// biome-ignore lint/suspicious/noExplicitAny: Complex query result from orpc
department: any
```

**JSX Comments:**
```typescript
{/* biome-ignore lint/suspicious/noExplicitAny: explanation */}
```

**TanStack Router:**
```typescript
// ✅ import from "@tanstack/react-router" (not "@tanstack/router")
```

---

## 🤖 Self-Validation System

The project uses automated validation hooks in `.claude/hooks/validators/`:

**Available Validators:**
- `type-check.sh` - TypeScript compilation
- `lint-check.sh` - Biome/Ultracite quality checks
- `build-check.sh` - Turborepo build validation
- `schema-check.sh` - Drizzle schema integrity
- `seed-check.sh` - Seed data structure

**Always run before completing work:**
- `bun run check-types`
- `bun x ultracite fix`

**Git Hooks:**
- Pre-commit: Format → Type check
- Pre-push: Type + Lint + Build

---

## 📝 Pre-Commit Checklist

- [ ] `bun x ultracite check` - complexity < 20
- [ ] `bun run check-types` - no TypeScript errors
- [ ] All functions have correct parameter counts
- [ ] Union types have type casts
- [ ] JSX comments use `{/* */}` syntax
- [ ] biome-ignore added for legitimate any types
- [ ] Schema exports updated in index.ts
- [ ] SQL helpers checked for undefined

---

## 📚 Documentation

- `STACK.md`: Detailed tech stack docs with official links
- `CLAUDE.md`: Comprehensive AI agent guidelines
- `AGENTS.md`: Code standards and refactoring patterns
- `README.md`: Project overview
- `SPEC.md`: Functional requirements

---

**Last Updated**: 2025-01-23
**Project**: PeopleFlow-HR-Suite
**Maintainer**: Reference STACK.md for latest updates
