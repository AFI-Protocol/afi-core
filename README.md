# 🧠 AFI Core

Welcome to `afi-core`, the neural spine of the AFI Protocol's agentic intelligence system. This module contains core logic for processing and evaluating market signals—laying the groundwork for decentralized financial reasoning.

## 🤖 Droid Instructions

**For AI agents and automated contributors**: See [AGENTS.md](./AGENTS.md) for canonical repo constraints, allowed tasks, and safe patch patterns. If AGENTS.md conflicts with this README, AGENTS.md wins.

### 📦 What's Inside

- **Validation Primitives** – UWR, novelty scoring, decay integration, and validator decision types
- **Analysts** – Strategy scorers (e.g., Froggy) using UWR heuristics with enrichment adapters
- **Signal Decay** – Time-based signal degradation and lifecycle management
- **Scoring** – Advanced scoring algorithms (UWR-based with decay)
- **Validator Decision** – Automated decision-making logic with decay-aware scoring
- **Validator Governance** – Governance schemas and registry for validator coordination
- **Schemas** – Canonical v0.1 Zod schemas (signal, pipeline, validator, governance, etc.)
- **Runtime Contracts** – Adapter/type stubs for future runtime integration
- **Tests** – Vitest suites for all components
- **Docs/Droids** – Repo guidance and specs

### 🗂 Structure

```
analysts/           # Analyst logic (e.g., Froggy) with enrichment adapters
src/analyst/        # Core analyst templates and scoring (AnalystScoreTemplate)
src/decay/          # Signal decay templates and processing
validators/         # Validation primitives (UWR, novelty, decay, decision, governance)
schemas/            # Canonical v0.1 schemas (signal, pipeline, validator, governance)
runtime/            # Runtime adapter/types stubs
tests/              # Vitest suites
droids/             # Repo-scoped droid instructions
docs/               # Specs and reference docs
scripts/            # Local dev helper scripts
```

### 🔄 Scoring vs Validation: Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SIGNAL PIPELINE FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Signal     │───▶│   Analyst    │───▶│   Validator  │───▶│   Mint/      │
│   Ingestion  │    │   Scoring    │    │   Decision   │    │   Replay     │
│              │    │              │    │   + Decay    │    │              │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │                   │
        ▼                   ▼                   ▼                   ▼
   Raw Signal        AnalystScore        ValidatorDecision      Mint
                     Template            + ValidatorOutcome     Instructions
                     (scoredAt:          (baseScore,
                      timestamp)          decayedScore)
```

**Key Distinction:**

| Aspect | Analyst Scoring | Validator Decision |
|--------|-----------------|-------------------|
| **Role** | Compute signal quality using UWR | Evaluate quality + apply decay + make decision |
| **Output** | `AnalystScoreTemplate` | `ValidatorDecision` + `ValidatorOutcome` |
| **Time-aware** | No (just records `scoredAt`) | Yes (computes age, applies decay) |
| **Decision** | N/A (only scoring) | approve / reject / flag / abstain |
| **Emissions** | N/A | Uses `decayedScore` for calculations |

**Flow:**
1. **Analyst** receives signal, computes UWR axes and score, sets `scoredAt` timestamp
2. **Validator** receives `AnalystScoreTemplate`, computes signal age, applies decay, makes decision
3. **Mint/Replay** consumes `ValidatorOutcome` with `decayedScore` for emissions

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
