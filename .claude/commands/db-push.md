# /db-push - Push Database Schema Changes

Push database schema changes with automatic validation.

## Description

This command safely pushes Drizzle schema changes to the database with comprehensive validation. It runs pre-flight checks, applies migrations, and validates the result.

## Allowed Tools

- `Edit` - Modify schema files
- `Read` - Read schema files and configuration
- `Bash` - Run database commands and validators
- `Grep` - Search for schema patterns
- `Glob` - Find schema files

## Workflow

1. **Pre-Flight Validation**
   - Run `schema-check.sh` to validate schema integrity
   - Run `type-check.sh` to ensure TypeScript compilation

2. **Show Preview**
   - Run `drizzle-kit push --dry-run` to show proposed changes
   - Display SQL statements that will be executed

3. **Confirm with User**
   - Ask user to confirm changes before applying

4. **Apply Changes**
   - Run `drizzle-kit push` to apply schema changes
   - Handle errors and rollback if needed

5. **Post-Push Validation**
   - Verify schema was applied successfully
   - Run type-check again to ensure everything still compiles

## Usage

```
/db-push
```

The command will:
1. Validate your schema files
2. Show you what changes will be made
3. Ask for confirmation
4. Apply the changes
5. Validate the result

## Auto-Fix Loop

If validation fails, the command will:
1. Read the error message
2. Identify the issue (missing export, type error, etc.)
3. Fix the schema files
4. Re-run validation
5. Repeat until validation passes

## Example

```
User: /db-push
Assistant: Running pre-flight schema validation...
  ✓ Schema exports found
  ✓ Schema compiles successfully
  ✓ All validations passed

Showing proposed changes:
  CREATE TABLE employees (...)
  CREATE INDEX idx_employees_organization_id ON employees(organization_id)

Do you want to apply these changes? (yes/no)
User: yes
Assistant: Applying schema changes...
  ✓ Schema pushed successfully
  ✓ Post-push validation passed
```

## Error Handling

### Missing Schema Exports

**Error:** Cannot import schema from @PeopleFlow-HR-Suite/db

**Fix:** Add export to packages/db/src/schema/index.ts

### Type Compilation Error

**Error:** Type 'X' is not assignable to type 'Y'

**Fix:** Correct schema type definitions

### Database Connection Error

**Error:** Could not connect to database

**Fix:** Verify DATABASE_URL is set and database is running
