#!/usr/bin/env bash
# TypeScript Type Validation Script
# Runs type checking across all workspaces in the monorepo
# Exit 0: All types valid
# Exit 1: Type errors detected

set -e

echo "🔍 Running TypeScript type check across all packages..."
echo ""

# Run Turborepo type check
if bun run check-types; then
  echo ""
  echo "✅ All TypeScript types are valid"
  exit 0
else
  echo ""
  echo "❌ Type check failed - see errors above"
  echo ""
  echo "💡 Common fixes:"
  echo "  - Add missing type annotations"
  echo "  - Verify imported types exist"
  echo "  - Check generic constraints"
  echo "  - Ensure all exports are defined"
  exit 1
fi
