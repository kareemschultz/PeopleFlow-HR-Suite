#!/usr/bin/env bash
# Turborepo Build Validation Script
# Builds all packages and apps to verify they compile successfully
# Exit 0: All builds successful
# Exit 1: Build errors detected

set -e

echo "🔍 Running Turborepo build across all packages..."
echo ""

# Run Turborepo build
if bun run build; then
  echo ""
  echo "✅ All packages built successfully"
  exit 0
else
  echo ""
  echo "❌ Build failed - see errors above"
  echo ""
  echo "💡 Common fixes:"
  echo "  - Fix TypeScript errors first"
  echo "  - Verify all imports resolve correctly"
  echo "  - Check for circular dependencies"
  echo "  - Ensure all package dependencies are installed"
  exit 1
fi
