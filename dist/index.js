/**
 * AFI Protocol — Main ESM Entrypoint
 * Exports all core modules, validators, schemas, and DAG stubs.
 * Agent-first, modular, and Codex/AOS-aligned.
 */

// Core modules (add more as needed)
// Example: export * from './core/AgentRuntime.js';

// Validators
export * from './validators/index.js';

// Schemas
export * from './schemas/index.js';

// DAG stubs (expand as real DAGs are implemented)
export const dagStubs = {
  // Example stub: Replace with real DAG exports as needed
  signalProcessing: () => {
    throw new Error('DAG signalProcessing not yet implemented');
  }
};

// Agent-first: allow dynamic extension in the future
export const registerAgentExtension = (ext) => {
  // Placeholder for agent extension registration
  // (Codex/AOS-aligned, safe for future modularity)
  console.warn('registerAgentExtension: Not yet implemented', ext);
};
