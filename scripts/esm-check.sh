#!/usr/bin/env bash
# ESM Invariants Check for afi-core
# Detects common ESM gotchas: missing .js extensions in relative imports

set -e

echo "🔍 Checking ESM invariants in afi-core..."

ERRORS=0

# Check for relative imports without .js extensions in source files
echo ""
echo "Checking for missing .js extensions in relative imports..."

# Find TypeScript files in source directories (exclude tests, node_modules, dist)
SOURCE_FILES=$(find analysts validators schemas runtime -name "*.ts" -type f ! -path "*/__tests__/*" ! -path "*/tests/*" 2>/dev/null || true)

if [ -n "$SOURCE_FILES" ]; then
  # Look for imports like: from "./Something" or from "../Something" (without .js)
  # Exclude external packages (no ./ or ../)
  MISSING_JS=$(echo "$SOURCE_FILES" | xargs grep -n "from ['\"]\.\.*/[^'\"]*['\"]" 2>/dev/null | grep -v "\.js['\"]" || true)
  
  if [ -n "$MISSING_JS" ]; then
    echo "❌ Found relative imports without .js extensions:"
    echo "$MISSING_JS"
    ERRORS=$((ERRORS + 1))
  else
    echo "✅ All relative imports have .js extensions"
  fi
fi

# Check for .ts extensions in imports (should never happen)
echo ""
echo "Checking for .ts extensions in imports..."
TS_IMPORTS=$(echo "$SOURCE_FILES" | xargs grep -n "from ['\"][^'\"]*\.ts['\"]" 2>/dev/null || true)

if [ -n "$TS_IMPORTS" ]; then
  echo "❌ Found .ts extensions in imports (should be .js):"
  echo "$TS_IMPORTS"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ No .ts extensions in imports"
fi

# Summary
echo ""
if [ $ERRORS -eq 0 ]; then
  echo "✅ ESM invariants check passed!"
  exit 0
else
  echo "❌ ESM invariants check failed with $ERRORS error(s)"
  echo ""
  echo "Fix by adding .js extensions to relative imports:"
  echo "  from \"./Something\" → from \"./Something.js\""
  echo "  from \"../validators/Foo\" → from \"../validators/Foo.js\""
  exit 1
fi

