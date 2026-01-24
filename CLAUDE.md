# PeopleFlow HR Suite - Coding Standards

## Ultracite Code Quality

- **Format**: `bun x ultracite fix`
- **Check**: `bun x ultracite check`
- **Type-safe, accessible, performant code**
- **Explicit types, modern JS/TS patterns**
- **React 19+: ref as prop, function components**
- **Never use `any`, prefer `unknown`**
- **Max cognitive complexity: 20**

## Project Structure

**Monorepo with TurboRepo + Bun**

- `apps/web/` - React + TanStack Router + shadcn/ui (Maia theme)
- `apps/server/` - Hono backend
- `packages/api/` - oRPC contracts & routers
- `packages/auth/` - Better Auth
- `packages/db/` - Drizzle ORM schemas
- `packages/env/` - Environment validation

## Available Scripts

- `bun run dev` - Start all apps
- `bun run build` - Build all
- `bun run check-types` - TypeScript validation
- `bun run db:push` - Push schema to PostgreSQL
- `bun run db:studio` - Drizzle Studio
- `bun run db:seed` - Seed database

## Key Technologies

**Read STACK.md for official docs!** Always reference latest documentation instead of AI knowledge.

- **Runtime**: Bun
- **Language**: TypeScript
- **Frontend**: React 19, TanStack Router v1.154+, shadcn/ui (Maia), Tailwind CSS v4
- **Backend**: Hono v4
- **Database**: PostgreSQL 16, Drizzle ORM
- **Auth**: Better Auth
- **API**: oRPC v1.0, Zod v4
- **UI Icons**: HugeIcons
- **Animations**: Framer Motion
- **Quality**: Ultracite/Biome
- **Build**: Turborepo

## Important Patterns

### oRPC API

```typescript
// ✅ CORRECT: Use .input() directly
export const createEmployee = authedProcedure
  .input(z.object({ name: z.string() }))
  .handler(async ({ input }) => {
    // Validation in handler
  });

// ❌ WRONG: oz.input() doesn't exist
import { oz } from "@orpc/zod";
.input(oz.input(z.object({ ... }))) // ERROR!
```

### Drizzle SQL Helpers

```typescript
// ✅ CORRECT: Check for undefined
const searchFilter = or(
  like(employees.firstName, `%${search}%`),
  like(employees.lastName, `%${search}%`)
);
if (searchFilter) {
  filters.push(searchFilter);
}

// ❌ WRONG: or() can return undefined
filters.push(or(...)); // Type error
```

### Package Imports

```typescript
// ✅ CORRECT: Import from root package
import { db, employees } from "@PeopleFlow-HR-Suite/db";

// ❌ WRONG: Subpath not exposed
import { employees } from "@PeopleFlow-HR-Suite/db/schema";
```

## Database Schema Guidelines

1. **Foreign Keys**: Use `onDelete: "cascade"` or `"restrict"`
2. **Indexes**: Add for FKs and frequently queried fields
3. **Timestamps**: Include `createdAt` and `updatedAt`
4. **JSONB**: For complex nested data (settings, metadata)

## Cognitive Complexity Refactoring

When Biome reports complexity > 20:

1. **Extract helper functions** with descriptive names
2. **Extract sub-components** for large React components
3. **Create reusable UI patterns** (EditableField, etc.)
4. **Extract state helpers** for complex updates

## TypeScript Common Fixes

### Union Type Casts

```typescript
// ✅ Cast to union types
gender: formData.gender as "male" | "female" | "other" | undefined,
employmentType: formData.employmentType as "full_time" | "part_time",
```

### Complex Query Types

```typescript
// ✅ Use any with biome-ignore for complex orpc results
// biome-ignore lint/suspicious/noExplicitAny: Complex query result
department: any
```

### JSX Comments

```typescript
// ✅ Use JSX comment syntax
{/* biome-ignore lint/suspicious/noExplicitAny: explanation */}
{items.map((item: any) => ...)}
```

## Pre-Commit Validation

Husky hooks run:
1. `bun x ultracite fix` - Auto-fix formatting
2. `bun run check-types` - Type validation
3. **Commit blocked if errors**

## Color Scheme (Maia Theme)

CSS uses OKLCH format: `oklch(lightness chroma hue)`
- Primary: `oklch(0.488 0.243 264.376)` - Deep indigo
- Accent: `oklch(0.809 0.105 251.813)` - Light blue
- Vibrant colors with non-zero chroma for saturation
- Hue ~264 for indigo/purple tones

## Development Workflow

1. **Read relevant schema** in `packages/db/src/schema/`
2. **Review existing services** in `packages/api/src/services/`
3. **Run type check**: `bun run check-types`
4. **Format code**: `bun x ultracite fix`
5. **Test build**: `bun run build`

## Common Pitfalls

- ❌ Don't skip Zod validation
- ❌ Don't use `any` (use `unknown`)
- ❌ Don't forget indexes for FKs
- ❌ Don't hardcode values (use env vars)
- ❌ Don't commit console.log
- ❌ Don't use barrel files excessively

## Deployment

**Docker Compose** for local development:
```bash
docker-compose -f docker-compose.local.yml --env-file .env.docker up -d
```

Environment variables in `.env.docker` - never commit to git!

---

**For full tech stack docs**: See `STACK.md`
**For detailed spec**: See `hrms_saas_spec_v4.md`
