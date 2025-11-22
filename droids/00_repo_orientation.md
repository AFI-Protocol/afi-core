# AFI Core - Droid Repo Orientation

**Quick Start**: You're in `afi-core`, the neural spine of AFI Protocol.

---

## What This Repo Does

Core runtime for agent signal validation, ElizaOS integration, and PoI/PoInsight validation. This is where signals get validated before entering the DAG pipeline.

**Key Capabilities**:
- Signal validation (PoI, PoInsight)
- Validator registry
- Mentor evaluation
- ElizaOS runtime adapter
- Universal signal schema

---

## Repo Boundaries

**This repo handles**:
- ✅ Signal validation logic
- ✅ Validator interfaces
- ✅ Runtime adapters
- ✅ Core schemas

**This repo does NOT handle**:
- ❌ DAG orchestration (that's afi-reactor)
- ❌ UI/frontend (that's afi-research-site)
- ❌ Deployment (that's afi-ops)
- ❌ Smart contracts (that's afi-token)

---

## Key Files to Know

```
validators/
  PoIValidator.ts          # Proof of Insight validator
  
schemas/
  universal_signal_schema.mjs  # Canonical signal format
  validator_metadata_schema.ts # Validator registration
  
runtime/
  afiRuntimeAdapter.ts     # ElizaOS integration
  mentor_registry.ts       # Mentor evaluation
  
tests/
  poi_validator.test.ts    # Validator tests
  mentor_registry.test.ts  # Registry tests
```

---

## Quick Commands

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Type check
npm run typecheck  # if available
```

---

## Common Droid Tasks

See `10_common_tasks.md` for detailed workflows.

**Most frequent**:
1. Add a new validator
2. Update signal schema
3. Add runtime adapter
4. Add tests

---

## Safety Notes

**Before making changes**:
1. Read `AGENTS.md` for constraints
2. Check `.afi-codex.json` for dependencies
3. Run tests locally
4. Ensure no breaking changes to signal schema

**Red flags** (ask a human):
- Changing PoI/PoInsight semantics
- Modifying signal schema structure
- Breaking validator interface
- Removing tests

---

## Getting Help

- **AGENTS.md**: Canonical constraints
- **README.md**: High-level overview
- **docs/**: Architecture documentation
- **Human maintainers**: Tag @afi-core-team in PR

---

**Last Updated**: 2025-11-22

