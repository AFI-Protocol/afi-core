# 🧠 AFI Core

Welcome to `afi-core`, the neural spine of the AFI Protocol’s agentic intelligence system. This module contains core logic for processing and evaluating market signals—laying the groundwork for decentralized financial reasoning.

## 🤖 Droid Instructions

**For AI agents and automated contributors**: See [AGENTS.md](./AGENTS.md) for canonical repo constraints, allowed tasks, and safe patch patterns. If AGENTS.md conflicts with this README, AGENTS.md wins.

### 📦 What's Inside

- **Signal Validators** – Deterministic modules to vet raw input before scoring
- **Analysts** – Strategy scorers (e.g., Froggy) using UWR heuristics with enrichment adapters
- **Signal Decay** – Time-based signal degradation and lifecycle management
- **Signal Scoring** – Advanced scoring algorithms for signal evaluation
- **Validator Decision** – Automated decision-making logic for validators
- **Validator Governance** – Governance schemas and registry for validator coordination
- **Schemas** – Canonical v0.1 Zod schemas (signal, pipeline config, validator metadata, governance, etc.)
- **Runtime Contracts** – Adapter/type stubs for future runtime integration
- **Tests** – Vitest suites for all components
- **Docs/Droids** – Repo guidance and specs

### 🗂 Structure

```
analysts/           # Analyst logic (e.g., Froggy) with enrichment adapters
src/analyst/        # Core analyst templates and scoring
src/decay/          # Signal decay templates and processing
validators/         # Validator logic, UWR contracts, novelty types, scoring, decision, governance
schemas/            # Canonical v0.1 schemas (signal, pipeline, validator, governance)
runtime/            # Runtime adapter/types stubs
tests/              # Vitest suites
droids/             # Repo-scoped droid instructions
docs/               # Specs and reference docs
scripts/            # Local dev helper scripts
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

