# /db-seed - Seed Database with Sample Data

Update and run database seed data with automatic validation.

## Description

This command safely creates or updates database seed data with comprehensive validation. It ensures seed data matches schema requirements and runs successfully.

## Allowed Tools

- `Edit` - Modify seed data files
- `Read` - Read schema and seed files
- `Bash` - Run seed scripts and validators

## Workflow

1. **Pre-Seed Validation**
   - Run `seed-check.sh` to validate seed data structure
   - Run `type-check.sh` to ensure TypeScript compilation

2. **Review Seed Data**
   - Show summary of data that will be created
   - Highlight any dependencies or FK relationships

3. **Confirm with User**
   - Ask user to confirm before running seed

4. **Run Seed Script**
   - Execute seed data insertion
   - Handle errors and show detailed output

5. **Post-Seed Validation**
   - Verify data was created successfully
   - Show summary of created records

## Usage

```
/db-seed
```

The command will:
1. Validate seed data structure
2. Show what data will be created
3. Ask for confirmation
4. Run the seed script
5. Validate the result

## Auto-Fix Loop

If validation fails, the command will:
1. Read the error message
2. Identify the issue (NOT NULL violation, FK constraint, type mismatch)
3. Fix the seed data file
4. Re-run validation
5. Repeat until validation passes

## Common Fixes

### NOT NULL Constraint Violation

**Error:** null value in column "X" violates not-null constraint

**Fix:** Add missing required field to seed data

### Foreign Key Constraint Violation

**Error:** insert or update violates foreign key constraint

**Fix:** Ensure parent records are created first, in correct order

### Type Mismatch

**Error:** Type 'string' is not assignable to type 'Date'

**Fix:** Use `new Date()` instead of string for date fields

## Example

```
User: /db-seed
Assistant: Running seed data validation...
  ✓ Seed data file exists
  ✓ TypeScript compilation passed
  ✓ All validations passed

Seed data summary:
  - 1 organization (Acme Corporation)
  - 2 departments (Engineering, Sales)
  - 3 positions (Software Engineer, Sales Rep, Manager)
  - 5 employees

Do you want to run the seed? (yes/no)
User: yes
Assistant: Running seed script...
  → Creating organizations...
  → Creating departments...
  → Creating positions...
  → Creating employees...
  ✅ Seed data created successfully
```
