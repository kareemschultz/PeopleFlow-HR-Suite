#!/usr/bin/env bash
# Seed Data Validation Script
# Validates seed data structure and type compliance
# Exit 0: Seed data is valid
# Exit 1: Seed data errors detected

set -e

echo "🔍 Validating seed data structure..."
echo ""

# Change to db package directory
cd packages/db

# Check if seed files exist
if [ -f "src/seeds/sample-data.ts" ]; then
  echo "  ✓ Seed data file exists"
else
  echo "  ✗ Missing src/seeds/sample-data.ts"
  exit 1
fi

# Validate seed data compiles
echo ""
echo "Validating seed data TypeScript compilation..."
if bun run type-check; then
  echo "  ✓ Seed data compiles successfully"
else
  echo "  ✗ Seed data has TypeScript errors"
  exit 1
fi

# Check for common seed data issues
echo ""
echo "Checking for common seed data patterns..."

# Check for proper schema imports
if grep -q "from.*@PeopleFlow-HR-Suite/db" src/seeds/sample-data.ts; then
  echo "  ✓ Schema imports found"
else
  echo "  ⚠ No schema imports detected - verify import paths"
fi

# Check for db.insert usage
if grep -q "db\.insert" src/seeds/sample-data.ts; then
  echo "  ✓ Database insert operations found"
else
  echo "  ⚠ No database insert operations detected"
fi

echo ""
echo "✅ Seed data validation complete"
echo ""
echo "💡 To test seed data execution:"
echo "  bun run db:seed"
exit 0
