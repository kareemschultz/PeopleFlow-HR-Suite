# PeopleFlow HR Suite - Technology Stack Documentation

> **⚠️ IMPORTANT**: Always reference these official documentation sources instead of relying on AI knowledge. Documentation is updated frequently and this file contains the latest links.

---

## 📚 Table of Contents

- [Runtime & Package Manager](#runtime--package-manager)
- [Language & Type System](#language--type-system)
- [Monorepo & Build System](#monorepo--build-system)
- [Frontend Framework](#frontend-framework)
- [Backend Framework](#backend-framework)
- [Database & ORM](#database--orm)
- [Authentication](#authentication)
- [API Layer](#api-layer)
- [UI Components](#ui-components)
- [Styling](#styling)
- [Code Quality](#code-quality)
- [Mobile Development](#mobile-development)
- [Desktop Development](#desktop-development)
- [Project Management](#project-management)
- [Environment Variables](#environment-variables)

---

## Runtime & Package Manager

### Bun
**Version**: 1.x
**Documentation**: https://bun.sh/docs
**GitHub**: https://github.com/oven-sh/bun

**Key Features**:
- Fast JavaScript runtime
- Built-in package manager
- Native TypeScript support
- Drop-in Node.js replacement

**Common Commands**:
```bash
bun install           # Install dependencies
bun run dev          # Run development server
bun run build        # Build for production
bun x <package>      # Execute package
```

**API Reference**: https://bun.sh/docs/api

---

## Language & Type System

### TypeScript
**Version**: 5.x
**Documentation**: https://www.typescriptlang.org/docs/
**Handbook**: https://www.typescriptlang.org/docs/handbook/intro.html

**Key Concepts**:
- Type inference and annotations
- Interfaces vs Types
- Generics
- Utility types
- Declaration files

**TSConfig Reference**: https://www.typescriptlang.org/tsconfig

**Our Project Config**: See `packages/config/tsconfig.json`

---

## Monorepo & Build System

### Turborepo
**Documentation**: https://turbo.build/repo/docs
**GitHub**: https://github.com/vercel/turbo

**Key Features**:
- Incremental builds
- Remote caching
- Task orchestration
- Workspace management

**Configuration File**: `turbo.json`

**Turborepo CLI**: https://turbo.build/repo/docs/reference/command-line-reference

---

## Frontend Framework

### React 19
**Documentation**: https://react.dev/
**Reference**: https://react.dev/reference/react

**Key Features (React 19)**:
- React Compiler
- Actions
- `use()` hook
- Document metadata
- Asset loading

**Hooks Reference**: https://react.dev/reference/react/hooks

**Important React 19 Changes**:
- ref as a prop (no more forwardRef)
- Improved error handling
- Better async support

### TanStack Router
**Documentation**: https://tanstack.com/router/latest
**GitHub**: https://github.com/TanStack/router

**Key Features**:
- Type-safe routing
- File-based routing
- Search params validation
- Loaders and actions
- Code splitting

**File-Based Routing**: https://tanstack.com/router/latest/docs/framework/react/guide/file-based-routing

**API Reference**: https://tanstack.com/router/latest/docs/framework/react/api

---

## Backend Framework

### Hono
**Documentation**: https://hono.dev/
**GitHub**: https://github.com/honojs/hono

**Key Features**:
- Ultra-fast web framework
- Middleware support
- Built-in validation
- TypeScript-first
- Works on any runtime

**Routing**: https://hono.dev/docs/api/routing
**Middleware**: https://hono.dev/docs/middleware/builtin/cors
**Context**: https://hono.dev/docs/api/context

**File**: `apps/server/src/index.ts`

---

## Database & ORM

### PostgreSQL
**Version**: 14+
**Documentation**: https://www.postgresql.org/docs/current/
**Tutorial**: https://www.postgresql.org/docs/current/tutorial.html

**Key Concepts**:
- ACID compliance
- JSONB support
- Indexes and performance
- Transactions
- Full-text search

**SQL Reference**: https://www.postgresql.org/docs/current/sql.html

### Drizzle ORM
**Documentation**: https://orm.drizzle.team/docs/overview
**GitHub**: https://github.com/drizzle-team/drizzle-orm

**Key Features**:
- Type-safe SQL
- Relational queries
- Migrations
- Schema introspection
- Zero dependencies runtime

**Schema Declaration**: https://orm.drizzle.team/docs/sql-schema-declaration
**Queries**: https://orm.drizzle.team/docs/rqb
**Migrations**: https://orm.drizzle.team/docs/migrations

**Our Schemas**: `packages/db/src/schema/*.ts`

**Drizzle Kit (CLI)**:
```bash
bun run db:push       # Push schema changes
bun run db:studio     # Open Drizzle Studio UI
bun run db:generate   # Generate migrations
```

**Drizzle Kit Docs**: https://orm.drizzle.team/kit-docs/overview

---

## Authentication

### Better Auth
**Documentation**: https://www.better-auth.com/docs
**GitHub**: https://github.com/better-auth/better-auth

**Key Features**:
- Framework agnostic
- Multiple providers
- Session management
- TypeScript-first
- Expo/React Native support

**Core Concepts**: https://www.better-auth.com/docs/concepts
**Plugins**: https://www.better-auth.com/docs/plugins/overview
**API Reference**: https://www.better-auth.com/docs/api-reference

**Configuration**: `packages/auth/src/index.ts`
**Web Client**: `apps/web/src/lib/auth-client.ts`
**Native Client**: `apps/native/src/lib/auth-client.ts`

---

## API Layer

### oRPC
**Documentation**: https://orpc.unnoq.com/docs
**GitHub**: https://github.com/unnoq/orpc

**Key Features**:
- End-to-end type safety
- OpenAPI integration
- Zod validation
- Procedure-based API
- Client SDK generation

**Server Setup**: https://orpc.unnoq.com/docs/server
**Client Usage**: https://orpc.unnoq.com/docs/client
**Validation**: https://orpc.unnoq.com/docs/validation

**Our Implementation**:
- Routers: `packages/api/src/routers/*.ts`
- Client: `apps/web/src/utils/orpc.ts`

### Zod
**Documentation**: https://zod.dev/
**GitHub**: https://github.com/colinhacks/zod

**Key Features**:
- Schema validation
- Type inference
- Composable schemas
- Error messages

**API Reference**: https://zod.dev/?id=table-of-contents

---

## UI Components

### shadcn/ui
**Documentation**: https://ui.shadcn.com/
**GitHub**: https://github.com/shadcn-ui/ui

**Style**: maia (zinc background, blue primary)
**Icon Library**: hugeicons

**Components**: https://ui.shadcn.com/docs/components
**Themes**: https://ui.shadcn.com/themes
**CLI**: https://ui.shadcn.com/docs/cli

**Installation**:
```bash
cd apps/web
bunx --bun shadcn@latest add <component>
```

**Configuration**: `apps/web/components.json`

### HugeIcons React
**Website**: https://hugeicons.com/
**NPM**: https://www.npmjs.com/package/hugeicons-react

**Usage**:
```tsx
import { Icon01, Icon02 } from 'hugeicons-react';
```

### Framer Motion
**Documentation**: https://www.framer.com/motion/
**API**: https://www.framer.com/motion/component/

**Key Features**:
- Animations
- Gestures
- Layout animations
- Scroll animations
- Variants

**Examples**: https://www.framer.com/motion/examples/

---

## Styling

### Tailwind CSS
**Version**: 3.x
**Documentation**: https://tailwindcss.com/docs
**Configuration**: https://tailwindcss.com/docs/configuration

**Core Concepts**:
- Utility-first CSS
- Responsive design
- Dark mode
- Custom variants
- Plugins

**Customization**: https://tailwindcss.com/docs/theme
**Configuration**: `apps/web/tailwind.config.ts`

### CSS Variables
**Documentation**: https://ui.shadcn.com/docs/theming

Our theme uses CSS variables for colors:
- `apps/web/src/index.css`

---

## Code Quality

### Ultracite (Biome)
**Ultracite**: https://github.com/privatenumber/ultracite
**Biome Documentation**: https://biomejs.dev/

**Key Features**:
- Fast linting & formatting
- Zero config preset
- TypeScript support
- Import sorting

**Commands**:
```bash
bun x ultracite check      # Check for issues
bun x ultracite fix        # Auto-fix issues
bun x ultracite doctor     # Diagnose setup
```

**Configuration**: `biome.json`

**Rules**: https://biomejs.dev/linter/rules/

---

## Mobile Development

### React Native
**Documentation**: https://reactnative.dev/docs/getting-started
**API Reference**: https://reactnative.dev/docs/components-and-apis

**Key Components**:
- View, Text, Image
- ScrollView, FlatList
- TouchableOpacity
- Modal, Alert

### Expo
**Documentation**: https://docs.expo.dev/
**SDK Reference**: https://docs.expo.dev/versions/latest/

**Key Features**:
- Development builds
- OTA updates
- Native modules
- Build service

**Expo Router**: https://docs.expo.dev/router/introduction/
**Our App**: `apps/native/`

### NativeWind
**Documentation**: https://www.nativewind.dev/
**V4 Docs**: https://www.nativewind.dev/v4/overview

**Key Features**:
- Tailwind CSS for React Native
- Universal styling
- Dark mode support

---

## Desktop Development

### Tauri
**Documentation**: https://v2.tauri.app/
**API**: https://v2.tauri.app/reference/javascript/

**Key Features**:
- Native desktop apps
- Small bundle size
- System APIs
- Auto-updater

**Commands**:
```bash
cd apps/web
bun run desktop:dev      # Development
bun run desktop:build    # Production build
```

**Configuration**: `apps/web/src-tauri/tauri.conf.json`

---

## Project Management

### Beads
**GitHub**: https://github.com/beadslabs/beads
**Documentation**: https://github.com/beadslabs/beads#readme

**Key Features**:
- Local-first issue tracking
- Git-based
- Markdown files
- No external services

**Commands**:
```bash
bd init              # Initialize
bd list              # List issues
bd create            # Create issue
bd show <id>         # Show issue details
```

**Our Issues**: `.beads/` directory

---

## Environment Variables

### T3 Env
**Documentation**: https://env.t3.gg/docs/introduction
**GitHub**: https://github.com/t3-oss/t3-env

**Key Features**:
- Type-safe environment variables
- Runtime validation
- Client/server separation
- Zod schemas

**Our Implementation**:
- Server: `packages/env/src/server.ts`
- Web: `packages/env/src/web.ts`

**Configuration Files**:
- `apps/server/.env` - Server environment variables
- `apps/web/.env` - Web environment variables

---

## Project-Specific Documentation

### Database Schemas

All schemas are in `packages/db/src/schema/`:

1. **Core HR**:
   - `organizations.ts` - Multi-tenancy
   - `departments.ts` - Department hierarchy
   - `employees.ts` - Employee records

2. **Tax System**:
   - `tax-jurisdictions.ts` - Multi-country tax rules

3. **Payroll**:
   - `payroll.ts` - Payroll runs and payslips
   - `retro-adjustments.ts` - Retroactive corrections

4. **Analytics**:
   - `metrics.ts` - Metric lineage and freshness
   - `anomalies.ts` - Anomaly detection

5. **Audit**:
   - `audit.ts` - Audit log and permission snapshots

### Service Layer

All services are in `packages/api/src/services/`:

- `tax-calculator.ts` - PAYE and NIS calculations
- `payroll-service.ts` - Payroll processing
- `audit-service.ts` - Audit logging

### API Routers

All routers are in `packages/api/src/routers/`:

- `organizations.ts` - Organization CRUD
- `departments.ts` - Department management
- `employees.ts` - Employee management

---

## Additional Resources

### Community & Support

- **React**: https://react.dev/community
- **TypeScript**: https://github.com/microsoft/TypeScript/discussions
- **Drizzle**: https://discord.gg/drizzle
- **Hono**: https://discord.gg/hono
- **Better Auth**: https://discord.gg/better-auth

### Learning Resources

- **React Docs Beta**: https://react.dev/learn
- **TypeScript Deep Dive**: https://basarat.gitbook.io/typescript/
- **Tailwind UI**: https://tailwindui.com/
- **Drizzle Examples**: https://github.com/drizzle-team/drizzle-orm/tree/main/examples

---

## Version Compatibility Matrix

| Package | Version | Notes |
|---------|---------|-------|
| Bun | 1.x | Runtime |
| Node.js | 18+ | Fallback runtime |
| TypeScript | 5.x | Language |
| React | 19.x | UI library |
| PostgreSQL | 14+ | Database |
| Drizzle ORM | Latest | ORM |
| TanStack Router | v1 | Routing |
| Hono | 4.x | Backend |
| Expo | SDK 51+ | Mobile |
| Tauri | v2 | Desktop |

---

## Updates & Maintenance

**Last Updated**: 2025-01-19

**Update Frequency**: Review this file monthly or when major version updates occur.

**To Update Documentation Links**:
1. Check for breaking changes in major versions
2. Update links to point to correct version docs
3. Update version compatibility matrix
4. Test all code examples

**Automated Checks**:
```bash
# Check for outdated packages
bun outdated

# Update dependencies
bun update
```

---

## Quick Reference

### Most Common Documentation Pages

**Daily Use**:
- React Hooks: https://react.dev/reference/react/hooks
- Drizzle Queries: https://orm.drizzle.team/docs/rqb
- Tailwind Classes: https://tailwindcss.com/docs
- shadcn Components: https://ui.shadcn.com/docs/components

**Setup & Config**:
- TypeScript Config: https://www.typescriptlang.org/tsconfig
- Turborepo Config: https://turbo.build/repo/docs/reference/configuration
- Biome Rules: https://biomejs.dev/linter/rules/

**Troubleshooting**:
- Drizzle Migrations: https://orm.drizzle.team/docs/migrations
- Better Auth Issues: https://github.com/better-auth/better-auth/issues
- Bun Compatibility: https://bun.sh/docs/runtime/nodejs-apis

---

**Remember**: Always check the official documentation first. AI knowledge can be outdated!
