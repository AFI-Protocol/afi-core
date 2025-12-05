# 🧠 AFI Core

Welcome to `afi-core`, the neural spine of the AFI Protocol’s agentic intelligence system. This module contains core logic for processing and evaluating market signals—laying the groundwork for decentralized financial reasoning.

## 🤖 Droid Instructions

**For AI agents and automated contributors**: See [AGENTS.md](./AGENTS.md) for canonical repo constraints, allowed tasks, and safe patch patterns. If AGENTS.md conflicts with this README, AGENTS.md wins.

### 📦 What's Inside

- **Signal Validators** – Deterministic modules to vet raw input before scoring  
- **Analysts** – Strategy scorers (e.g., Froggy) using UWR heuristics  
- **Schemas** – Canonical v0.1 Zod schemas (signal, pipeline config, validator metadata, etc.)  
- **Runtime Contracts** – Adapter/type stubs for future runtime integration  
- **Tests** – Vitest suites for validators/analysts/schemas  
- **Docs/Droids** – Repo guidance and specs

### 🗂 Structure

```
analysts/           # Analyst logic (e.g., Froggy)
validators/         # Validator logic, UWR contracts, novelty types
schemas/            # Canonical v0.1 schemas
runtime/            # Runtime adapter/types stubs
signal_schema_test/ # Legacy sandbox (deprecated; retained only if reintroduced for experiments)
tests/              # Vitest suites
droids/             # Repo-scoped droid instructions
docs/               # Specs and reference docs
scripts/            # Local dev helper scripts
src/components/     # Future-facing UI stub (ModalSignalReview), not wired into runtime
```

### 🚀 Quick Start

```bash
npm install
npm test
```

> Note: pnpm works too if you prefer, but npm is the default for examples here.

### 🧩 Part of the Modular AFI Ecosystem

`afi-core` is one of several composable modules in the Agentic Financial Intelligence Protocol. Other modules include:

- `afi-agents` – Persona logic and mentor pairing  
- `afi-infra` – Infra bus + observer daemons  
- `afi-cli` – Command-line agent interface  
- `afi-docs` – Specs and documentation

For architecture, see [AFI Protocol Docs](https://github.com/AFI-Protocol/afi-docs)

---

🛡 Maintained by the AFI Core Team  
🔗 [afi-protocol.github.io](https://afi-protocol.github.io) _(coming soon)_
