<!-- Source: AGENTS.md -->

# Ultracite Code Standards

This project uses **Ultracite**, a zero-config preset that enforces strict code quality standards through automated formatting and linting.

## Quick Reference

- **Format code**: `bun x ultracite fix`
- **Check for issues**: `bun x ultracite check`
- **Diagnose setup**: `bun x ultracite doctor`

Biome (the underlying engine) provides robust linting and formatting. Most issues are automatically fixable.

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors

### React & JSX

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags instead of passing as props
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility:
  - Provide meaningful alt text for images
  - Use proper heading hierarchy
  - Add labels for form inputs
  - Include keyboard event handlers alongside mouse events
  - Use semantic elements (`<button>`, `<nav>`, etc.) instead of divs with roles

### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases

### Code Organization

- Keep functions focused and under reasonable cognitive complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together and separate concerns

### Security

- Add `rel="noopener"` when using `target="_blank"` on links
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)
- Use proper image components (e.g., Next.js `<Image>`) over `<img>` tags

### Framework-Specific Guidance

**Next.js:**

- Use Next.js `<Image>` component for images
- Use `next/head` or App Router metadata API for head elements
- Use Server Components for async data fetching instead of async Client Components

**React 19+:**

- Use ref as a prop instead of `React.forwardRef`

**Solid/Svelte/Vue/Qwik:**

- Use `class` and `for` attributes (not `className` or `htmlFor`)

---

## Testing

- Write assertions inside `it()` or `test()` blocks
- Avoid done callbacks in async tests - use async/await instead
- Don't use `.only` or `.skip` in committed code
- Keep test suites reasonably flat - avoid excessive `describe` nesting

## When Biome Can't Help

Biome's linter will catch most issues automatically. Focus your attention on:

1. **Business logic correctness** - Biome can't validate your algorithms
2. **Meaningful naming** - Use descriptive names for functions, variables, and types
3. **Architecture decisions** - Component structure, data flow, and API design
4. **Edge cases** - Handle boundary conditions and error states
5. **User experience** - Accessibility, performance, and usability considerations
6. **Documentation** - Add comments for complex logic, but prefer self-documenting code

---

Most formatting and common issues are automatically fixed by Biome. Run `bun x ultracite fix` before committing to ensure compliance.

<!-- Source: .ruler/bts.md -->

# Better-T-Stack Project Rules

This is a PeopleFlow-HR-Suite project created with Better-T-Stack CLI.

## Project Structure

This is a monorepo with the following structure:

- **`apps/web/`** - Frontend application (React with TanStack Router)

- **`apps/server/`** - Backend server (Hono)

- **`apps/native/`** - React Native mobile app (with NativeWind)

- **`packages/api/`** - Shared API logic and types
- **`packages/auth/`** - Authentication logic and utilities
- **`packages/db/`** - Database schema and utilities
- **`packages/env/`** - Shared environment variables and validation
- **`packages/config/`** - Shared TypeScript configuration

## Available Scripts

- `bun run dev` - Start all apps in development mode
- `bun run dev:web` - Start only the web app
- `bun run dev:server` - Start only the server
- `bun run dev:native` - Start only the native app
- `bun run build` - Build all apps
- `bun run lint` - Lint all packages
- `bun run typecheck` - Type check all packages

## Database Commands

All database operations should be run from the server workspace:

- `bun run db:push` - Push schema changes to database
- `bun run db:studio` - Open database studio
- `bun run db:generate` - Generate Drizzle files
- `bun run db:migrate` - Run database migrations

Database schema files are located in `packages/db/src/schema/`

## API Structure

- oRPC contracts and routers are in `packages/api/src/`
- Client-side oRPC client is in `apps/web/src/utils/orpc.ts`

## Authentication

Authentication is powered by Better Auth:

- Auth configuration is in `packages/auth/src/`
- Web app auth client is in `apps/web/src/lib/auth-client.ts`
- Native app auth client is in `apps/native/src/lib/auth-client.ts`

## Project Configuration

This project includes a `bts.jsonc` configuration file that stores your Better-T-Stack settings:

- Contains your selected stack configuration (database, ORM, backend, frontend, etc.)
- Used by the CLI to understand your project structure
- Safe to delete if not needed

## Key Points

- This is a Turborepo monorepo using bun workspaces
- Each app has its own `package.json` and dependencies
- Run commands from the root to execute across all workspaces
- Run workspace-specific commands with `bun run command-name`
- Turborepo handles build caching and parallel execution
- Git hooks are configured with Husky for pre-commit checks

---

## 📚 Documentation & Reference

### Technology Stack Documentation

**⚠️ CRITICAL**: Always reference the official documentation in `STACK.md` instead of relying on AI knowledge.

- **File**: `STACK.md`
- **Purpose**: Centralized documentation links for all technologies
- **Contents**:
  - Runtime (Bun), Language (TypeScript), Build System (Turborepo)
  - Frontend (React 19, TanStack Router), Backend (Hono)
  - Database (PostgreSQL, Drizzle ORM)
  - Authentication (Better Auth), API (oRPC, Zod)
  - UI (shadcn/ui, Tailwind CSS, Framer Motion, HugeIcons)
  - Code Quality (Ultracite/Biome)
  - Mobile (React Native, Expo), Desktop (Tauri)
  - Project Management (Beads)

**When to Reference STACK.md**:
- Before using any API from a library
- When implementing new features
- When encountering errors or unexpected behavior
- When upgrading dependencies
- When making architectural decisions

---

## 📁 Key File Paths & Structure

### Database Schemas (`packages/db/src/schema/`)

**Core HR**:
- `organizations.ts` - Multi-tenant organization management
- `departments.ts` - Department hierarchy and positions
- `employees.ts` - Employee records with allowances and deductions

**Tax System**:
- `tax-jurisdictions.ts` - Multi-country tax rules (PAYE, NIS, filing requirements)

**Payroll**:
- `payroll.ts` - Payroll runs and payslips with YTD tracking
- `retro-adjustments.ts` - Delta-based retroactive corrections with approval workflow

**Analytics**:
- `metrics.ts` - Metric dependencies, data freshness, and metric values
- `anomalies.ts` - Anomaly detection rules and detected anomalies

**Audit**:
- `audit.ts` - Comprehensive audit log and permission snapshots

**Schema Index**: `index.ts` - Exports all schemas

### Service Layer (`packages/api/src/services/`)

- `tax-calculator.ts` - PAYE (income tax) and NIS (social security) calculations
  - Formula evaluator (MAX, MIN, IF, ROUND)
  - Progressive tax band calculations
  - Rounding modes and periodization

- `payroll-service.ts` - Payroll processing logic
  - Payslip calculation with earnings/deductions
  - Statutory deductions integration
  - YTD accumulation

- `audit-service.ts` - Audit logging utilities
  - Change tracking
  - Permission snapshots
  - Audit log creation

### API Routers (`packages/api/src/routers/`)

- `organizations.ts` - Organization CRUD operations
- `departments.ts` - Department management
- `employees.ts` - Employee management
- `index.ts` - Router aggregation

### Frontend Applications

**Web App** (`apps/web/`):
- `src/routes/` - TanStack Router file-based routes
- `src/components/` - React components
- `src/lib/auth-client.ts` - Better Auth client
- `src/utils/orpc.ts` - oRPC client setup
- `components.json` - shadcn/ui config (maia style, hugeicons)
- `tailwind.config.ts` - Tailwind configuration

**Native App** (`apps/native/`):
- `app/` - Expo Router file-based routes
- `components/` - React Native components
- `lib/auth-client.ts` - Better Auth client for Expo

**Server** (`apps/server/`):
- `src/index.ts` - Hono server entry point
- `.env` - Server environment variables

### Configuration Files

**Root Level**:
- `turbo.json` - Turborepo configuration
- `biome.json` - Biome/Ultracite linting rules
- `bts.jsonc` - Better-T-Stack configuration
- `STACK.md` - Technology documentation (READ THIS FIRST)
- `README.md` - Project overview and quick start
- `CLAUDE.md` - This file (AI coding standards)

**Database**:
- `packages/db/drizzle.config.ts` - Drizzle Kit configuration
- `packages/db/docker-compose.yml` - PostgreSQL Docker setup

**Packages**:
- `packages/config/tsconfig.json` - Shared TypeScript config
- `packages/env/src/server.ts` - Server environment validation
- `packages/env/src/web.ts` - Web environment validation

### Issue Tracking

**Beads** (`.beads/`):
- `metadata.json` - Issue tracking metadata
- Individual issue files for each tracked item

---

## 🔄 Development Workflow

### Before Writing Code

1. **Check STACK.md** for the latest documentation links
2. **Read the relevant schema** in `packages/db/src/schema/`
3. **Review existing services** in `packages/api/src/services/`
4. **Check router patterns** in `packages/api/src/routers/`
5. **Run type check**: `bun run check-types`

### Writing New Features

**Database Changes**:
1. Add/modify schema in `packages/db/src/schema/`
2. Export from `packages/db/src/schema/index.ts`
3. Push to database: `bun run db:push`
4. Verify in Drizzle Studio: `bun run db:studio`

**Service Layer**:
1. Create service in `packages/api/src/services/`
2. Import types from `@PeopleFlow-HR-Suite/db`
3. Write pure functions with clear inputs/outputs
4. Add JSDoc comments for complex logic

**API Routers**:
1. Create/modify router in `packages/api/src/routers/`
2. Use oRPC procedure patterns
3. Add Zod validation schemas
4. Export from `packages/api/src/routers/index.ts`

**Frontend**:
1. Create route in `apps/web/src/routes/`
2. Use oRPC client from `apps/web/src/utils/orpc.ts`
3. Add shadcn components: `bunx --bun shadcn@latest add <component>`
4. Style with Tailwind utilities

### Before Committing

1. **Format code**: `bun x ultracite fix`
2. **Type check**: `bun run check-types`
3. **Test build**: `bun run build`
4. **Review changes**: `git diff`
5. **Commit with conventional commits**: `feat:`, `fix:`, `docs:`, etc.

---

## 🧭 Navigation Shortcuts

**Quick Links to Common Files**:

```bash
# Database schemas
packages/db/src/schema/

# Business logic
packages/api/src/services/

# API endpoints
packages/api/src/routers/

# Frontend routes
apps/web/src/routes/

# UI components
apps/web/src/components/

# Tech stack docs
STACK.md

# Project overview
README.md
```

**Common Commands**:

```bash
# Development
bun run dev                    # All apps
bun run dev:web               # Web only
bun run dev:server            # Server only

# Database
bun run db:push               # Push schema
bun run db:studio             # Open UI

# Code quality
bun x ultracite fix           # Format
bun run check-types           # Type check

# Issue tracking
bd list                       # List issues
bd create                     # New issue
```

---

## 🎯 Best Practices for AI Assistance

### Always Reference Latest Documentation

1. **Check STACK.md first** - AI knowledge may be outdated
2. **Use official docs** - Links are provided for every technology
3. **Verify API signatures** - Check the actual documentation
4. **Test examples** - Don't assume examples work without testing

### Code Quality Standards

1. **Type Safety**: Explicit types, no `any`, proper generics
2. **Error Handling**: Try-catch blocks, early returns, descriptive errors
3. **Performance**: Avoid unnecessary re-renders, optimize queries
4. **Accessibility**: ARIA attributes, semantic HTML, keyboard navigation
5. **Security**: Validate inputs, sanitize outputs, prevent injections

### Database Schema Guidelines

1. **Foreign Keys**: Always use `onDelete: "cascade"` or `"restrict"`
2. **Indexes**: Add indexes for foreign keys and frequently queried fields
3. **JSONB**: Use for complex nested data (settings, metadata)
4. **Timestamps**: Include `createdAt` and `updatedAt`
5. **Soft Deletes**: Use `isActive` or `deletedAt` flags when needed

### Service Layer Guidelines

1. **Pure Functions**: No side effects, testable, predictable
2. **Input Validation**: Validate at boundaries
3. **Type Safety**: Strict input/output types
4. **Error Messages**: Clear, actionable error messages
5. **Documentation**: JSDoc for complex logic

---

## 🚨 Common Pitfalls to Avoid

1. **Don't use outdated React patterns** - We use React 19 (ref as prop, no forwardRef)
2. **Don't skip Zod validation** - Always validate user inputs
3. **Don't use `any` type** - Use `unknown` and narrow with type guards
4. **Don't forget indexes** - Add indexes for foreign keys
5. **Don't hardcode values** - Use environment variables
6. **Don't skip error handling** - Always handle potential errors
7. **Don't use barrel files excessively** - They hurt tree-shaking
8. **Don't commit console.log** - Use proper logging in production

---

## 📖 Additional Resources

**Project Documentation**:
- Full specification: `docs/spec.md` (if exists)
- Implementation plan: Check git history for planning documents
- API reference: http://localhost:3000/api-reference (when server running)

**External Resources**:
- Better-T-Stack: https://github.com/AmanVarshney01/create-better-t-stack
- Ultracite: https://github.com/privatenumber/ultracite
- shadcn/ui: https://ui.shadcn.com/

**Community Support**:
- Check STACK.md for Discord/community links
- GitHub discussions for specific libraries
- Stack Overflow for general questions

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

**Workaround for Missing Type Definitions**:

If you encounter `TS2306: File '...' is not a module` errors with Hono middleware, create a local type declaration file:

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

**Key Learnings**:
- Hono v4 uses default exports for middleware modules
- Some Hono packages may have empty type definition files - use local declarations if needed
- Always add explicit `Context` and `Next` types for handler parameters
- TypeScript's `skipLibCheck` doesn't help with module resolution errors

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
- Always verify the correct import path from package entry points

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

**Last Updated**: 2025-01-19
**Maintainer**: Reference STACK.md for latest updates

---

## Dependency Management Patterns

### Resolving Nested Dependency Conflicts

When plugins or dependencies bundle their own copies of shared packages, use Bun's `resolutions` and `overrides` to force deduplication:

```json
{
  "resolutions": {
    "package-name": "^version"
  },
  "overrides": {
    "package-name": "^version"
  }
}
```

**Benefits**:
- Forces ALL packages to use the same version
- Prevents ESM/CJS import conflicts
- Eliminates type incompatibilities from multiple versions
- Works across entire workspace in monorepos

**After adding overrides**:
```bash
rm -rf node_modules apps/*/node_modules && bun install
```

This is especially useful for packages like `zod`, `typescript`, `react`, or other core dependencies that must be consistent across the entire dependency tree.


---

## TanStack Router with Zod v4

### Router Generation

TanStack Router's generator (`tsr generate`) has a known incompatibility with Zod v4 (used in this project).

**Current Setup**:
- ✅ TanStack Router v1.154+
- ✅ Zod v4.x
- ⚠️ Generator requires patching (replaced `.returns()` with `.custom()`)

**Workflow**:
To generate routes after creating files in `apps/web/src/routes/`:
```bash
cd apps/web && bun x tsr generate
```
*Note: If this fails with a Zod error, the generator package in `node_modules` needs to be patched.*

**Route Definition Pattern**:
```typescript
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/employees/")({
  component: EmployeesPage,
  validateSearch: z.object({
    search: z.string().optional(),
    page: z.number().int().positive().default(1),
  }),
});
```

---

## 🔒 Self-Validating System

This project includes a comprehensive self-validating system with automated hooks, commands, and specialized agents that ensure code quality and correctness.

### Validator Scripts

Located in `.claude/hooks/validators/`, these scripts provide automated validation:

**Available Validators:**
- `type-check.sh` - TypeScript compilation across all workspaces
- `lint-check.sh` - Biome/Ultracite code quality checks
- `build-check.sh` - Turborepo build validation
- `schema-check.sh` - Drizzle schema integrity validation
- `seed-check.sh` - Seed data structure validation

**Exit Codes:**
- `0` - Validation passed
- `1` - Validation failed (with detailed error output)

### Specialized Agents

Located in `.claude/agents/`, these agents have domain-specific expertise:

- **db-schema-agent.md** - Drizzle ORM schema expert
  - Validates foreign keys, indexes, exports
  - Auto-fixes schema issues
  - Ensures type safety

- **api-router-agent.md** - oRPC router expert
  - Validates Zod schemas match Drizzle types
  - Ensures SQL helpers are checked for undefined
  - Fixes import path errors

- **seed-data-agent.md** - Production-quality seed data
  - Validates dependency order (FK constraints)
  - Ensures all NOT NULL fields are present
  - Fixes type mismatches

- **tax-rules-agent.md** - Multi-country tax configuration
  - PAYE progressive band calculations
  - NIS/social security rules
  - Formula evaluation validation

- **payroll-agent.md** - Payroll calculation logic
  - Gross → deductions → net validation
  - Retroactive adjustment patterns
  - YTD tracking accuracy

- **ui-component-agent.md** - Maia-style shadcn/ui components
  - HugeIcons integration
  - Framer Motion animations
  - Accessibility compliance (WCAG 2.1 AA)

### Self-Validating Commands

Located in `.claude/commands/`, these commands include automatic validation:

- `/db-push` - Push schema changes with validation
- `/db-seed` - Run seed data with validation
- `/build` - Build with type-check → lint → build pipeline
- `/api-update` - Update routers with type-safe validation

**Command Pattern:**
1. Read relevant files
2. Make changes
3. Auto-validate (runs hooks)
4. Fix loop (if validation fails)
5. Report success

### Reusable Skills

Located in `.claude/skills/`:

- **validate-all.md** - Run all validators in sequence
- **fix-lint.md** - Auto-fix all linting issues

### Git Hooks

**Pre-Commit Hook** (`.husky/pre-commit`):
- Formats code with Ultracite
- Runs type checking
- Prevents commits with type errors

**Pre-Push Hook** (`.husky/pre-push`):
- Type checking
- Linting
- Full build validation
- Prevents broken code from reaching remote

### Validation Workflow

**During Development:**
```
Code Change → Type Check → Lint Check → Build Validation
     ↓               ↓            ↓              ↓
   Pass?         Pass?        Pass?         Pass?
     ↓               ↓            ↓              ↓
    Fix ← ← ← ← ← Fix ← ← ← ← Fix ← ← ← ← ← Fix
```

**Before Commit:**
```
git add . → Pre-commit Hook → Format → Type Check → Commit
```

**Before Push:**
```
git push → Pre-push Hook → Type + Lint + Build → Push
```

### Auto-Fix Loop

When validation fails, the system:
1. **Captures Error** - Reads detailed error output
2. **Identifies Cause** - Analyzes the root issue
3. **Applies Fix** - Makes surgical code changes
4. **Re-validates** - Runs validation again
5. **Repeats** - Until validation passes or manual intervention needed

**Common Auto-Fixes:**
- Missing schema exports
- SQL helper undefined checks
- Import path corrections
- NOT NULL field additions
- Type annotation additions

### Using the System

**Run Full Validation:**
```bash
# Using skills
/validate-all

# Or manually
.claude/hooks/validators/type-check.sh
.claude/hooks/validators/lint-check.sh
.claude/hooks/validators/build-check.sh
```

**Fix Linting Issues:**
```bash
/fix-lint
# or
bun x ultracite fix
```

**Update Schema Safely:**
```bash
/db-push
```

**Update Seed Data:**
```bash
/db-seed
```

### Benefits

1. **Catch Issues Early** - Validation happens before commits
2. **Automatic Fixes** - Most issues are auto-fixed
3. **Consistent Quality** - All code follows same standards
4. **Fast Feedback** - Errors detected in seconds
5. **Safe Refactoring** - Type system prevents regressions

### Performance

Typical validation times:
- Type check: ~10 seconds
- Lint check: ~5 seconds
- Build: ~20 seconds
- Schema validation: ~2 seconds
- Seed validation: ~3 seconds

**Full validation suite: ~40 seconds**

### Best Practices

1. **Use Specialized Agents** - Let domain experts handle their areas
2. **Run Validation Often** - Before commits, pushes, PRs
3. **Trust Auto-Fix** - Ultracite fixes are safe and deterministic
4. **Check Error Output** - Validators provide actionable error messages
5. **Progressive Fixes** - Fix one error at a time, re-validate

### Troubleshooting

**Type Check Fails:**
- Run `bun run check-types` to see errors
- Fix type annotations
- Verify imports are correct

**Lint Check Fails:**
- Run `bun x ultracite fix` to auto-fix
- Review remaining issues in output

**Build Fails:**
- Fix type errors first
- Check for missing dependencies
- Verify all imports resolve

**Schema Validation Fails:**
- Check schema exports in `schema/index.ts`
- Verify foreign keys are correct
- Ensure all types are properly defined

---

**Last Updated**: 2025-01-19
**Validation System Version**: 1.0.0

