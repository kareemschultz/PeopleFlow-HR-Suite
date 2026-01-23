# Gemini Agent Context & Code Standards

This project is **PeopleFlow-HR-Suite**, a multi-country HR & Payroll SaaS built on the **Better-T-Stack**.

## 🚀 Technology Stack

**⚠️ CRITICAL**: Always reference the official documentation in `STACK.md`.

- **Runtime**: Bun 1.x
- **Language**: TypeScript 5.x
- **Monorepo**: Turborepo
- **Frontend**: React 19, TanStack Router, Tailwind CSS, shadcn/ui (maia), HugeIcons
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

## 🤖 Self-Validation System

The project uses a set of hooks and validators in `.claude/hooks/validators/`.
- **Always run `bun run check-types` before declaring a task complete.**
- **Always run `bun x ultracite fix` to ensure formatting.**

---

## 📝 Documentation

- `STACK.md`: Detailed tech stack docs.
- `SPEC-ENHANCED.md`: Functional requirements.
- `AGENTS.md`: Code standards.
- `README.md`: Overview.