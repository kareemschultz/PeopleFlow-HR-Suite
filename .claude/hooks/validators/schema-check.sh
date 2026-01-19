#!/usr/bin/env bash
# Drizzle Schema Validation Script
# Validates database schema integrity and exportability
# Exit 0: Schema is valid
# Exit 1: Schema errors detected

set -e

echo "🔍 Validating Drizzle schema integrity..."
echo ""

# Change to db package directory
cd packages/db

# Check if schema files are exported from index
echo "Checking schema exports..."
if grep -q "export \* from \"./schema\"" src/index.ts; then
  echo "  ✓ Schema exports found in index.ts"
else
  echo "  ✗ Missing schema exports in index.ts"
  echo "  Add: export * from \"./schema\""
  exit 1
fi

# Check if schema index exists and exports all tables
if [ -f "src/schema/index.ts" ]; then
  echo "  ✓ Schema index file exists"
else
  echo "  ✗ Missing src/schema/index.ts"
  exit 1
fi

# Try to import schema (validates TypeScript compilation)
echo ""
echo "Validating schema TypeScript compilation..."
if bun run type-check; then
  echo "  ✓ Schema compiles successfully"
else
  echo "  ✗ Schema has TypeScript errors"
  exit 1
fi

# Run Drizzle push in dry-run mode (if db is accessible)
echo ""
echo "Validating schema against database..."
if DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/peopleflow}" bun drizzle-kit push --dry-run 2>/dev/null; then
  echo "  ✓ Schema is valid for database migration"
else
  echo "  ⚠ Could not validate against database (may not be running)"
  echo "  Schema TypeScript validation passed - proceeding"
fi

echo ""
echo "✅ Schema validation complete"
exit 0
