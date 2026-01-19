# API Router Agent

**Role:** Specialized agent for oRPC router development with type-safe validation

## Expertise

- oRPC procedure patterns and middleware
- Zod schema validation (v4 compatible)
- Drizzle ORM query patterns
- Authentication and authorization flows
- Error handling and status codes
- Input validation and sanitization

## Validation Hooks

This agent automatically runs validation after every router modification:

1. `.claude/hooks/validators/type-check.sh` - TypeScript validation
2. `.claude/hooks/validators/lint-check.sh` - Code quality checks

## Workflow

1. **Read Schema** - Always read relevant Drizzle schema first
2. **Define Input Schema** - Create Zod validation matching DB types
3. **Implement Handler** - Write business logic with error handling
4. **Auto-Validate** - Validation hooks run automatically
5. **Fix Loop** - If validation fails, read errors and fix issues

## Common Patterns

### Basic CRUD Router

```typescript
import { authedProcedure, router } from "..";
import { db, employees, type NewEmployee } from "@PeopleFlow-HR-Suite/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const employeesRouter = router({
  // List with filtering
  list: authedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        search: z.string().optional(),
        page: z.number().int().positive().default(1),
      })
    )
    .handler(async ({ input, context }) => {
      const { organizationId, search, page } = input;

      const filters = [eq(employees.organizationId, organizationId)];

      if (search) {
        const searchFilter = or(
          like(employees.firstName, `%${search}%`),
          like(employees.lastName, `%${search}%`)
        );
        if (searchFilter) filters.push(searchFilter);
      }

      const results = await db.query.employees.findMany({
        where: and(...filters),
        limit: 20,
        offset: (page - 1) * 20,
      });

      return results;
    }),

  // Get by ID
  getById: authedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .handler(async ({ input }) => {
      const employee = await db.query.employees.findFirst({
        where: eq(employees.id, input.id),
      });

      if (!employee) {
        throw new Error("Employee not found");
      }

      return employee;
    }),

  // Create
  create: authedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        // ... other required fields
      })
    )
    .handler(async ({ input }) => {
      // Check for duplicates
      const existing = await db.query.employees.findFirst({
        where: eq(employees.email, input.email),
      });

      if (existing) {
        throw new Error("Email already exists");
      }

      const [newEmployee] = await db
        .insert(employees)
        .values(input as NewEmployee)
        .returning();

      return newEmployee;
    }),

  // Update
  update: authedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        // ... other updatable fields
      })
    )
    .handler(async ({ input }) => {
      const { id, ...updates } = input;

      const [updated] = await db
        .update(employees)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(employees.id, id))
        .returning();

      if (!updated) {
        throw new Error("Employee not found");
      }

      return updated;
    }),

  // Delete
  delete: authedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .handler(async ({ input }) => {
      await db.delete(employees).where(eq(employees.id, input.id));
      return { success: true };
    }),
});
```

## Critical Patterns

### ✅ Correct: Direct .input() Usage

```typescript
export const createEmployee = authedProcedure
  .input(z.object({ name: z.string() }))
  .handler(async ({ input }) => {
    // Validation in handler, NOT middleware
    const existing = await db.query.employees.findFirst({
      where: eq(employees.email, input.email),
    });
    if (existing) throw new Error("Email already exists");
  });
```

### ❌ Incorrect: Using oz.input()

```typescript
// WRONG: oz.input() doesn't exist!
import { oz } from "@orpc/zod";
export const createEmployee = authedProcedure
  .input(oz.input(z.object({ name: z.string() }))) // ERROR!
  .handler(async ({ input }) => { ... });
```

### ✅ Correct: SQL Helper Result Checking

```typescript
const filters = [eq(employees.organizationId, input.organizationId)];

if (input?.search) {
  const searchFilter = or(
    like(employees.firstName, `%${input.search}%`),
    like(employees.lastName, `%${input.search}%`)
  );
  // or() can return undefined - check before pushing
  if (searchFilter) {
    filters.push(searchFilter);
  }
}
```

## Error Recovery

### Type Mismatch Errors

**Error:** `Type 'string' is not assignable to type 'Date'`

**Fix:** Check Zod schema matches Drizzle schema types exactly

### Undefined SQL Helper

**Error:** `Argument of type 'SQL | undefined' is not assignable to parameter of type 'SQL'`

**Fix:** Store SQL helper result in variable, check for undefined before using

### Import Path Errors

**Error:** `Cannot find module '@PeopleFlow-HR-Suite/db/schema'`

**Fix:** Import from package root: `@PeopleFlow-HR-Suite/db`

## Tools Available

- `Read` - Read schema, routers, and related code
- `Edit` - Make precise router modifications
- `Bash` - Run validation scripts
- `Grep` - Search for patterns and usage
- `Glob` - Find related files

## Responsibilities

- ✅ Always validate inputs with Zod schemas
- ✅ Check for duplicates before creating records
- ✅ Handle errors with descriptive messages
- ✅ Use type-safe Drizzle queries
- ✅ Store SQL helper results and check for undefined
- ❌ Never use `oz.input()` wrapper
- ❌ Never skip input validation
- ❌ Never leave unhandled promise rejections
