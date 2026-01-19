# /build - Build Project with Validation

Build all packages and apps with comprehensive validation.

## Description

This command builds the entire monorepo with automatic validation at each step. It ensures type safety, code quality, and successful compilation.

## Allowed Tools

- `Edit` - Fix code issues
- `Read` - Read code and configuration
- `Bash` - Run build and validation scripts

## Workflow

1. **Type Check**
   - Run `type-check.sh` across all packages
   - Identify and fix TypeScript errors

2. **Lint Check**
   - Run `lint-check.sh` to validate code quality
   - Auto-fix issues where possible

3. **Build**
   - Run `build-check.sh` to compile all packages
   - Handle build errors

4. **Report Results**
   - Show build summary
   - Report any issues that need manual attention

## Usage

```
/build
```

The command will:
1. Run type checking
2. Run linting
3. Build all packages
4. Report results

## Auto-Fix Loop

If any validation fails, the command will:
1. Read the error output
2. Identify the root cause
3. Fix the issue (type error, lint issue, etc.)
4. Re-run validation
5. Repeat until all validations pass

## Example

```
User: /build
Assistant: Running validation pipeline...

Step 1/3: Type checking...
  ✓ All packages type-checked successfully

Step 2/3: Linting...
  ✓ No linting errors found

Step 3/3: Building...
  ✓ packages/db built
  ✓ packages/api built
  ✓ apps/server built
  ✓ apps/web built

✅ Build complete! All validations passed.
```

## Error Handling

### TypeScript Error

**Error:** Type 'X' is not assignable to type 'Y'

**Fix:** Add proper type annotations or fix type mismatch

### Lint Error

**Error:** Missing return type annotation

**Fix:** Add explicit return type to function

### Build Error

**Error:** Cannot find module 'X'

**Fix:** Verify import path, ensure package is installed

## Progressive Fixes

If multiple errors are found, the command will:
1. Fix the first error
2. Re-run validation
3. Continue to next error
4. Repeat until all errors are fixed

This progressive approach ensures each fix doesn't introduce new errors.
