#!/usr/bin/env bash
# Biome/Ultracite Linting Validation Script
# Runs linting checks across all packages
# Exit 0: No linting errors
# Exit 1: Linting errors detected

set -e

echo "🔍 Running Ultracite/Biome linting checks..."
echo ""

# Run Ultracite check
if bun x ultracite check; then
  echo ""
  echo "✅ All linting checks passed"
  exit 0
else
  echo ""
  echo "❌ Linting errors detected - see above"
  echo ""
  echo "💡 Auto-fix most issues with: bun x ultracite fix"
  exit 1
fi
