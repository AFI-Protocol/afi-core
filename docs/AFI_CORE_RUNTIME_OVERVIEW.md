# AFI-Core Runtime Overview

**Date:** 2025-11-16  
**Purpose:** Define AFI-Core's role as the ElizaOS-based runtime layer in AFI Protocol

---

## Role of AFI-Core

AFI-Core is the **runtime layer powered by ElizaOS** (or a future soft fork thereof). It sits between:
- **AFI-Reactor** (DAG orchestration and policy)
- **AFI-Token** (on-chain token contracts and minting)

### Core Responsibilities

AFI-Core is responsible for:

1. **Agent Orchestration** - Managing ElizaOS agents, personas, and tools that execute AFI Protocol logic
2. **Signal Validation** - Running Proof-of-Insight (PoI) and Proof-of-Intelligence validators on signals
3. **Runtime Coordination** - Receiving DAG execution plans from Reactor and coordinating agent execution
4. **Mint Instruction Generation** - Producing structured, verifiable mint instructions for the token layer
5. **Mentor Pairing** - Matching signals with appropriate mentor agents for validation

### What AFI-Core is NOT Responsible For

AFI-Core does **NOT** handle:

❌ **Token Contract Definitions** - That's `afi-token` (AFIToken, AFISignalReceipt, AFIMintCoordinator)  
❌ **DAG Topology / Policy** - That's `afi-reactor` (15-node DAG, pipeline definitions, orchestration rules)  
❌ **Infrastructure / Deployment** - That's `afi-infra` or `afi-ops` (Kubernetes, Terraform, CI/CD)  
❌ **Direct On-Chain Writes** - AFI-Core generates instructions; execution happens via Safe/backend/droid

---

## Relationship to AFI-Reactor

### Reactor = DAG + Policy Orchestrator

AFI-Reactor (already hardened) is the **canonical orchestrator** for AFI Protocol. It:
- Defines the 15-node DAG architecture (generators, analyzers, validators, executors, observers)
- Controls pipeline topology and execution order
- Enforces orchestration rules (agents don't call each other directly)
- Routes signals through the DAG based on policy

### Core = Runtime Executor

AFI-Core is the **runtime that executes Reactor's plans**. It:
- **Receives** DAG execution plans from Reactor (e.g., "run signal through technical-analysis-node")
- **Spins up** the appropriate ElizaOS agents and tools to execute each DAG step
- **Executes** agent logic (analysis, validation, scoring) according to Reactor's instructions
- **Reports** results back to Reactor, which decides what happens next

### Interaction Flow

```
┌─────────────────┐
│  AFI-Reactor    │  (DAG Orchestrator)
│  - 15-node DAG  │
│  - Pipelines    │
│  - Routing      │
└────────┬────────┘
         │ DAG execution plan
         │ (e.g., "analyze signal X with node Y")
         ▼
┌─────────────────┐
│  AFI-Core       │  (ElizaOS Runtime)
│  - Agent pool   │
│  - Validators   │
│  - Tools        │
└────────┬────────┘
         │ Execution result
         │ (e.g., "analysis complete, score: 85")
         ▼
┌─────────────────┐
│  AFI-Reactor    │  (Routes to next node)
└─────────────────┘
```

### Key Principle

**Reactor tells Core WHAT to do and WHEN. Core tells agents HOW to do it.**

- Reactor controls the DAG topology and orchestration
- Core controls the agent runtime and execution
- Agents are workers that obey both Reactor's routing and Core's runtime

---

## Relationship to AFI-Token Layer

### Token Layer = On-Chain Contracts

The `afi-token` repository contains:
- **AFIToken** - ERC20 token with capped supply and minting controls
- **AFISignalReceipt** - On-chain record of validated signals
- **AFIMintCoordinator** - Coordinator for minting AFI tokens based on signals

### Core's Role in Minting

AFI-Core **generates mint instructions** but does **NOT** execute them on-chain.

#### Mint Instruction Flow

```
┌─────────────────┐
│  AFI-Core       │
│  - Validates    │
│  - Scores       │
│  - Generates    │
│    mint instr.  │
└────────┬────────┘
         │ Structured mint instruction
         │ (signalId, amount, recipient, proof)
         ▼
┌─────────────────┐
│  Backend/Safe   │  (Off-chain coordinator)
│  - Reviews      │
│  - Approves     │
│  - Executes     │
└────────┬────────┘
         │ On-chain transaction
         ▼
┌─────────────────┐
│  AFI-Token      │  (On-chain contracts)
│  - AFIMint      │
│    Coordinator  │
│  - AFIToken     │
└─────────────────┘
```

### Structured, Verifiable Outputs

At this stage, AFI-Core focuses on generating **structured, verifiable outputs**:

- **Mint Instructions** - JSON objects with signal ID, amount, recipient, proof
- **Signal Receipts** - Validated signal metadata for on-chain recording
- **Audit Logs** - Telemetry for T.S.S.D. Vault

AFI-Core does **NOT**:
- Import web3 libraries (ethers, viem)
- Make RPC calls to Base or Ethereum
- Sign transactions or broadcast to the network
- Directly call AFIMintCoordinator

**Why?** Separation of concerns:
- Core focuses on **intelligence and validation**
- Token layer focuses on **on-chain execution and security**
- Backend/Safe/droid handles **coordination and approval**

---

## Future Soft Fork of ElizaOS

### Current State

AFI-Core is currently a **standalone validator/runtime library** with:
- No ElizaOS integration
- Minimal runtime infrastructure (MentorRegistry)
- Basic validators (PoIValidator)

### Evolution Path

AFI-Core will evolve into a **soft fork of ElizaOS** once the thin layer's limits are clear:

1. **Phase 1 (Current)** - Thin runtime adapter layer
   - Stub interfaces for runtime adapter and mint pipeline driver
   - Documentation of integration points
   - No ElizaOS dependencies yet

2. **Phase 2 (Near Future)** - ElizaOS integration
   - Import ElizaOS as a dependency
   - Implement runtime adapter using ElizaOS APIs
   - Register AFI agents, tools, and evaluators with ElizaOS

3. **Phase 3 (Future)** - Soft fork
   - Vendor ElizaOS into `afi-core` as a soft fork
   - Customize ElizaOS runtime for AFI-specific needs
   - Maintain compatibility with upstream ElizaOS where possible

### Why a Soft Fork?

AFI Protocol has specific requirements that may diverge from ElizaOS:
- **Deterministic execution** for signal validation and replay
- **DAG-based orchestration** (Reactor controls flow, not ElizaOS)
- **Proof-of-Intelligence** validators and mentor pairing
- **On-chain integration** with AFI-Token contracts

A soft fork allows AFI to:
- Leverage ElizaOS's agent runtime and tooling
- Customize for AFI-specific needs
- Maintain compatibility with ElizaOS ecosystem
- Control the runtime evolution independently

### This Repo is the Natural Home

`afi-core` will be the natural home of the ElizaOS soft fork (or vendored runtime) because:
- It already contains runtime infrastructure (MentorRegistry)
- It already contains validators and schemas
- It sits at the right layer (between Reactor and Token)
- It's designed to be the "runtime layer" from the start

---

## Summary

| Layer | Repository | Role |
|-------|-----------|------|
| **Orchestration** | `afi-reactor` | DAG topology, pipeline routing, orchestration rules |
| **Runtime** | `afi-core` | ElizaOS agents, validators, mint instruction generation |
| **On-Chain** | `afi-token` | Token contracts, minting, signal receipts |

**AFI-Core is the bridge** between Reactor's orchestration and Token's on-chain execution.

---

**Last Updated:** 2025-11-16  
**Maintained By:** AFI Protocol Core Team

