# AGENTS.md — AFI Core Droid Instructions (v1)

This file is the canonical instruction set for Factory.ai droids and other agents working in this repository.
If AGENTS.md conflicts with README or docs, **AGENTS.md wins.**

---

## 0. Repo Purpose

**What this repo is for:**  
Core runtime for AFI Protocol agent signal validation, ElizaOS integration layer, validator/mentor registry logic, and PoI/PoInsight validation. This is the neural spine of the agentic intelligence system.

**What this repo is NOT for:**  
- UI/Next.js/React components (use afi-research-site)
- Deployment/infrastructure (use afi-ops, afi-infra)
- Token contracts (use afi-token)
- DAG orchestration (use afi-reactor)

---

## 1. Prime Directives (Global AFI Rules)

- **Scaffold, wire, and align context only.** Do not expand full feature logic unless explicitly instructed.
- **Keep changes minimal and deterministic.**
- **Preserve modular boundaries.** No cross-repo code moves unless asked.
- **Codex + AOS are truth sources.** Whitepaper is narrative, not canonical.
- **Never delete or overwrite without a replacement plan.**
- **Prefer small patches over large refactors.**

---

## 2. Allowed Tasks

Droids MAY:
- Add or update validators in `validators/`
- Add or update schemas in `schemas/`
- Add runtime adapters in `runtime/`
- Create tests in `tests/`
- Fix obvious bugs that block tooling/CI or violate repo invariants
- Improve documentation in `docs/` to reduce ambiguity for agents
- Add type definitions and interfaces
- Update `.afi-codex.json` metadata if repo capabilities change

---

## 3. Forbidden Tasks

Droids MUST NOT:
- Change PoI (Proof of Insight) or PoInsight validation semantics without explicit instruction
- Modify scoring logic or validator math without approval
- Rename core concepts (PoI, PoInsight, Epoch Pulse, etc.)
- Move code to/from other repos
- Add dependencies beyond standard AFI stack (TypeScript, Zod, Vitest)
- Modify ElizaOS integration contracts without understanding downstream impact

---

## 4. Key Invariants

These must remain true after changes:
- Signal schema remains compatible with afi-reactor DAG
- Validator interface stability (PoIValidator, mentor registry)
- ElizaOS runtime adapter contracts preserved
- Test coverage does not decrease
- All schemas export valid Zod types

---

## 5. Repo Layout Map

- `validators/` — PoIValidator, signal validators, core validation logic
- `schemas/` — Universal signal schema, validator metadata, governance schemas
- `runtime/` — ElizaOS adapter, mentor registry, mint pipeline driver
- `tests/` — Unit tests for validators and runtime
- `docs/` — Architecture docs, readiness reports
- `cli_hooks/` — Validator invoker for CLI integration
- `.afi-codex.json` — Repo metadata (role, provides, dependsOn, consumers)

---

## 6. Codex / AOS Touchpoints

- `.afi-codex.json` location: Root of repo
- AOS streams / registries referenced:
  - `signal-validation` stream
  - `validator-registry` stream
  - `mentor-evaluation` stream
- Schema contracts this repo must obey:
  - `universal_signal_schema.mjs` (canonical signal format)
  - `validator_metadata_schema.ts` (validator registration)
  - `validator_governance_schema.ts` (governance proposals)

---

## 7. Safe Patch Patterns

When editing, prefer:
- Small diffs, one intent per commit/patch
- Additive changes over rewrites
- Clear comments stating why a stub exists and what droids should generate next
- Type-safe changes (leverage TypeScript strict mode)
- Test-first for validators (add test, then implementation)

Example safe patch:
```typescript
// TODO(droid): Add validator for signal confidence threshold
// Expected behavior: Reject signals with confidence < 0.7
// Test case: tests/confidence_validator.test.ts
export function validateSignalConfidence(signal: Signal): boolean {
  // Stub: Always returns true for now
  return true;
}
```

---

## 8. How to Validate Locally

Run these before finalizing:
```bash
npm install
npm run build
npm test
npm run typecheck  # if available
```

Expected outcomes:
- Tests pass (Vitest)
- TypeScript compiles without errors
- No linter errors
- Schemas export valid types

---

## 9. CI / PR Expectations

- CI must stay green
- Any new validator must include at least one unit test
- Any new schema must include type exports and validation test
- Documentation updates should reduce ambiguity for agents
- PR description must explain: what changed, why, and how to test

---

## 10. Current Priorities

1. Stabilize PoIValidator interface for afi-reactor integration
2. Add comprehensive tests for mentor registry
3. Document ElizaOS runtime adapter contracts
4. Migrate code from `validators/` and `schemas/` to `src/` for consistency (low priority)

---

## 11. If You're Unsure

Default to:
1. Do nothing risky
2. Add a stub + TODO comment
3. Document the uncertainty in a short comment
4. Ask a human maintainer (tag @afi-core-team in PR)

---

**Last Updated**: 2025-11-22  
**Maintainers**: AFI Core Team  
**Version**: 1.0.0

