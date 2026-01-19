# /api-update - Update API Routers

Update API routers with type-safe validation.

## Description

This command safely updates oRPC API routers with comprehensive validation. It ensures routers are type-safe, use correct patterns, and integrate properly with the database schema.

## Allowed Tools

- `Edit` - Modify router files
- `Read` - Read schema, routers, and services
- `Bash` - Run validation scripts
- `Grep` - Search for patterns

## Workflow

1. **Read Schema**
   - Review relevant Drizzle schema files
   - Understand data types and relationships

2. **Update Router**
   - Modify router procedures
   - Ensure Zod schemas match Drizzle types

3. **Validate**
   - Run `type-check.sh` to verify types
   - Run `lint-check.sh` for code quality

4. **Fix Loop**
   - If validation fails, read errors
   - Fix issues automatically
   - Re-run validation

## Usage

```
/api-update <router-name>
```

Example:
```
/api-update employees
```

The command will:
1. Read the employees schema
2. Update the employees router
3. Validate type safety
4. Fix any issues

## Common Patterns Enforced

### ✅ Correct Input Schema

```typescript
.input(z.object({ name: z.string() }))
```

### ❌ Incorrect (Don't Use oz.input)

```typescript
.input(oz.input(z.object({ name: z.string() })))
```

### ✅ SQL Helper Checking

```typescript
const searchFilter = or(...);
if (searchFilter) filters.push(searchFilter);
```

### ❌ Incorrect (Undefined Push)

```typescript
filters.push(or(...)); // or() can return undefined
```

## Auto-Fix Examples

### Fix 1: Remove oz.input Wrapper

**Before:**
```typescript
import { oz } from "@orpc/zod";
.input(oz.input(z.object({ ... })))
```

**After:**
```typescript
.input(z.object({ ... }))
```

### Fix 2: Add SQL Helper Check

**Before:**
```typescript
const filters = [];
filters.push(or(like(...), like(...)));
```

**After:**
```typescript
const filters = [];
const searchFilter = or(like(...), like(...));
if (searchFilter) filters.push(searchFilter);
```

### Fix 3: Fix Import Path

**Before:**
```typescript
import { employees } from "@PeopleFlow-HR-Suite/db/schema";
```

**After:**
```typescript
import { employees } from "@PeopleFlow-HR-Suite/db";
```

## Validation Rules

1. **Input Validation**
   - All inputs must have Zod schemas
   - Schemas must match Drizzle types

2. **SQL Helpers**
   - Store results in variables
   - Check for undefined before using

3. **Error Handling**
   - Throw descriptive Error objects
   - Handle common cases (not found, duplicate, etc.)

4. **Type Safety**
   - No `any` types
   - Explicit return types for complex functions

## Example

```
User: /api-update employees
Assistant: Reading employees schema...
  ✓ Schema loaded from packages/db/src/schema/employees.ts

Updating employees router...
  ✓ Added type-safe input schemas
  ✓ Fixed SQL helper undefined checks
  ✓ Added error handling

Running validation...
  ✓ Type check passed
  ✓ Lint check passed

✅ API router updated successfully
```
