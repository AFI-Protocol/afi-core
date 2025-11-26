# afi-core — Agent Instructions

**afi-core** is the core runtime for AFI Protocol. It provides signal validation, PoI/PoInsight scoring, validator/mentor registry logic, and ElizaOS integration. This is the "neural spine" of the agentic intelligence system.

**Global Authority**: All agents operating in AFI Protocol repos must follow `afi-config/codex/governance/droids/AFI_DROID_CHARTER.v0.1.md`. If this AGENTS.md conflicts with the Charter, **the Charter wins**.

---

## Build & Test

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Clean build
npm run build:clean

# Run tests (Vitest)
npm test

# Run tests once
npm run test:run

# Validate all configs
npm run validate-all

# Simulate signal processing
npm run simulate-signal
```

**Expected outcomes**: All tests pass, TypeScript compiles, signal validation succeeds.

---

## Run Locally / Dev Workflow

```bash
# Simulate a signal
npm run simulate-signal

# Simulate from vault
npm run simulate-from-vault

# Replay vault for determinism testing
npm run replay-vault

# Lint Codex metadata
npm run codex-lint

# Run mentor evaluations
npm run mentor-eval
```

---

## Architecture Overview

**Purpose**: Core runtime behavior, validators, scoring, shared types and client libraries. **Not** for orchestration (that's afi-reactor).

**Key directories**:
- `src/validators/` — Validator implementations (PoI, PoInsight)
- `src/scoring/` — Signal scoring logic
- `src/registry/` — Validator and mentor registry
- `src/types/` — TypeScript type definitions (shared with Eliza gateways)
- `src/clients/` — Client libraries for AFI services
- `test/` — Vitest tests

**Consumed by**: afi-reactor (orchestration), afi-ops (deployment), Eliza gateways (types/clients)
**Depends on**: afi-config (schemas)

**Boundary with afi-reactor**:
- `afi-core` = runtime behavior (validators, scoring)
- `afi-reactor` = orchestration (DAG wiring, pipeline execution)

**Eliza integration**:
- `afi-core` defines shared types, client libraries, and helpers used by AFI services and Eliza plugins.
- Eliza gateways may import these types/clients to call AFI APIs.
- `afi-core` MUST NOT import ElizaOS code or assume anything about Eliza's internal structure.
- **Dependency direction**: Eliza gateways depend on afi-core; afi-core never depends on Eliza.

---

## Security

- **Validator logic is security-critical**: Incorrect validation can corrupt signal integrity.
- **PoI/PoInsight are validator traits, not signal fields**: Do not mislabel these concepts.
- **No secrets in code**: Use environment variables.
- **Signal schema compatibility**: Changes must be compatible with afi-reactor.

---

## Git Workflows

- **Base branch**: `main` or `migration/multi-repo-reorg`
- **Branch naming**: `feat/`, `fix/`, `refactor/`
- **Commit messages**: Conventional commits (e.g., `feat(validators): add PoInsight v2`)
- **Before committing**: Run `npm test && npm run validate-all`

---

## Conventions & Patterns

- **Language**: TypeScript (ESM)
- **Validators**: Follow validator interface contract
- **Scoring**: Deterministic where possible, document non-determinism
- **Tests**: Vitest, comprehensive coverage for validators
- **ElizaOS**: Follow ElizaOS adapter contracts

---

## Scope & Boundaries for Agents

**Allowed**:
- Small, well-scoped changes to validators, types, runtime glue when requested
- Add tests for existing validators
- Improve ElizaOS integration with clear spec
- Update `.afi-codex.json` if capabilities change

**Forbidden**:
- Large-scale refactors without explicit spec
- Renaming core concepts (PoI, PoInsight, validators)
- Introducing PoI/PoInsight mislabeling (they are validator traits, not signal fields)
- Adding orchestration logic (that belongs in afi-reactor)
- Breaking signal schema compatibility with afi-reactor

**When unsure**: Ask for explicit spec. Prefer small, reversible changes. Do not refactor without clear reason.

---

**Last Updated**: 2025-11-26  
**Maintainers**: AFI Core Team  
**Charter**: `afi-config/codex/governance/droids/AFI_DROID_CHARTER.v0.1.md`

