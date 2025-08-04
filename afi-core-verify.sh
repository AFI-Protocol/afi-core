#!/bin/bash
# afi-core-verify.sh
# Verifies AFI-core ESM compliance, DAG/schema/validator coverage, and type declarations

echo "🔎 Verifying AFI-core structure..."

# 1. Check main entrypoint
[ -f dist/index.js ] && echo "✅ dist/index.js exists" || echo "❌ dist/index.js missing"

# 2. Check DAG scaffolding
[ -f dist/dags/index.js ] && echo "✅ DAG index exists" || echo "❌ DAG index missing"
[ -f dist/dags/signalProcessingDAG.js ] && echo "✅ signalProcessingDAG exists" || echo "❌ signalProcessingDAG missing"

# 3. Check schema coverage
schemas=(pipeline_config_schema.js universal_signal_schema.js signal_finalization_request_schema.js validator_metadata_schema.js validator_governance_schema.js)
for schema in "${schemas[@]}"; do
  [ -f "dist/schemas/$schema" ] && echo "✅ Schema $schema exists" || echo "❌ Schema $schema missing"
done

# 4. Check validator index
[ -f dist/validators/index.js ] && echo "✅ Validator index exists" || echo "❌ Validator index missing"

# 5. Check type declarations
types=(dist/index.d.ts dist/schemas/index.d.ts dist/validators/index.d.ts)
for typefile in "${types[@]}"; do
  [ -f "$typefile" ] && echo "✅ Type declarations $typefile exists" || echo "❌ Type declarations $typefile missing"
done

# 6. Quick ESM check (grep for CommonJS)
if grep -R "module.exports\|require(" dist/ > /dev/null 2>&1; then
  echo "❌ Found CommonJS usage in dist/"
else
  echo "✅ ESM-only (no CommonJS found)"
fi

echo "🎉 Verification complete!"