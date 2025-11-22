# 🧠 AFI Core

Welcome to `afi-core`, the neural spine of the AFI Protocol’s agentic intelligence system. This module contains core logic for processing and evaluating market signals—laying the groundwork for decentralized financial reasoning.

## 🤖 Droid Instructions

**For AI agents and automated contributors**: See [AGENTS.md](./AGENTS.md) for canonical repo constraints, allowed tasks, and safe patch patterns.

> **Note**: If AGENTS.md conflicts with this README, AGENTS.md wins.

### 📦 What's Inside

- **Signal Validators** – Deterministic modules to vet raw input before scoring  
- **Evaluation Hooks** – `useSignalEvaluation` for runtime signal quality checks  
- **Mock Data** – Lightweight test fixtures for local testing  
- **Tests** – Sample unit tests for core components

### 🗂 Structure

```
validators/         # SignalValidator + runtime hooks  
tests/              # Unit tests for validators  
init_repo.sh        # Repo setup automation
```

### 🚀 Quick Start

```bash
pnpm install
pnpm test
```

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
