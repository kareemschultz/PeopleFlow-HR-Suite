# Validate All - Comprehensive Validation

Run all validation scripts in sequence and report comprehensive status.

## Description

This skill runs the full validation suite to ensure the project is in a healthy state. It's used before commits, PRs, and deployments.

## Validation Sequence

1. **Schema Validation**
   - Run `.claude/hooks/validators/schema-check.sh`
   - Verify Drizzle schema integrity

2. **Type Checking**
   - Run `.claude/hooks/validators/type-check.sh`
   - Ensure TypeScript compilation

3. **Linting**
   - Run `.claude/hooks/validators/lint-check.sh`
   - Check code quality

4. **Seed Data Validation**
   - Run `.claude/hooks/validators/seed-check.sh`
   - Verify seed data structure

5. **Build Validation**
   - Run `.claude/hooks/validators/build-check.sh`
   - Ensure successful compilation

## Usage

```
/validate-all
```

or invoke as a skill in other commands:
```
Use validate-all skill
```

## Output Format

```
🔍 Running Comprehensive Validation Suite

[1/5] Schema Validation
  ✓ Schema exports found
  ✓ Schema compiles successfully
  ✓ Schema is valid

[2/5] Type Checking
  ✓ All TypeScript types are valid

[3/5] Linting
  ✓ All linting checks passed

[4/5] Seed Data Validation
  ✓ Seed data structure valid
  ✓ Seed data compiles successfully

[5/5] Build Validation
  ✓ All packages built successfully

✅ All validations passed! Project is healthy.
```

## On Failure

If any validation fails, the output will show:

```
❌ Validation failed at step [X/5]: [Step Name]

Error details:
[Error output]

Suggested fixes:
- [Fix 1]
- [Fix 2]
```

## When to Use

- Before creating commits
- Before creating pull requests
- After major refactoring
- Before deploying to production
- When debugging build issues
- As part of CI/CD pipeline

## Auto-Fix Mode

When run with auto-fix enabled, the skill will:
1. Run all validations
2. If any fail, attempt to fix issues
3. Re-run failed validations
4. Continue until all pass or manual intervention needed

## Example

```
User: Run validate-all before I create a PR
Assistant: Running comprehensive validation suite...

[1/5] Schema Validation
  ✓ Passed

[2/5] Type Checking
  ✗ Failed: Type error in api/routers/employees.ts
  Fixing: Adding missing type annotation...
  ✓ Re-run passed

[3/5] Linting
  ✓ Passed

[4/5] Seed Data Validation
  ✓ Passed

[5/5] Build Validation
  ✓ Passed

✅ All validations passed! Safe to create PR.
```

## Integration with Git Hooks

This skill is automatically run by:
- Pre-commit hook (type-check + lint)
- Pre-push hook (full validation suite)

## Return Codes

- `0` - All validations passed
- `1` - One or more validations failed

## Performance

Full validation suite typically takes:
- **Schema validation**: ~2 seconds
- **Type checking**: ~10 seconds
- **Linting**: ~5 seconds
- **Seed validation**: ~3 seconds
- **Build**: ~20 seconds

**Total**: ~40 seconds for full validation
