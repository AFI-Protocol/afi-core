/**
 * AFI Runtime Adapter
 * ===================
 * 
 * This is the **thin runtime layer** that bridges AFI-Reactor's DAG orchestration
 * with ElizaOS agents (or a future soft fork thereof).
 * 
 * CURRENT STATUS: Stub interfaces and type definitions only.
 * 
 * FUTURE WORK: Implement the actual runtime logic that:
 * - Receives DAG execution plans from AFI-Reactor
 * - Spins up appropriate ElizaOS agents and tools
 * - Executes agent logic according to Reactor's instructions
 * - Reports results back to Reactor for next-step routing
 * 
 * This file will grow as we integrate ElizaOS and eventually evolve into
 * a soft fork of ElizaOS customized for AFI Protocol's needs.
 * 
 * @module runtime/afiRuntimeAdapter
 * @see docs/AFI_CORE_RUNTIME_OVERVIEW.md
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Runtime context for AFI agent execution.
 * Contains metadata about the current execution environment.
 */
export interface AFIRuntimeContext {
  /** Unique identifier for the agent executing this task */
  agentId: string;
  
  /** Unique identifier for the signal being processed */
  signalId: string;
  
  /** Unique identifier for this execution run (for replay/audit) */
  runId: string;
  
  /** Reference to the Reactor DAG node that triggered this execution */
  reactorNodeId?: string;
  
  /** Pipeline type (e.g., "signal-to-vault", "signal-to-vault-cognition") */
  pipelineType?: string;
  
  /** Additional metadata from Reactor */
  reactorMetadata?: Record<string, unknown>;
  
  /** Timestamp when this execution started */
  startedAt: Date;
}

/**
 * Raw signal data from AFI-Reactor.
 * This is the input to the runtime adapter.
 */
export interface AFISignalInput {
  /** Unique signal identifier */
  signalId: string;
  
  /** Signal source (e.g., "market-data-streamer", "social-signal-crawler") */
  source: string;
  
  /** Signal timestamp */
  timestamp: string;
  
  /** Signal payload (structure depends on source) */
  payload: unknown;
  
  /** Signal metadata */
  meta?: Record<string, unknown>;
}

/**
 * DAG step instruction from AFI-Reactor.
 * Tells the runtime adapter which node to execute and with what parameters.
 */
export interface AFIDAGStepInstruction {
  /** DAG node to execute (e.g., "technical-analysis-node") */
  nodeId: string;
  
  /** Node category (generator, analyzer, validator, executor, observer) */
  nodeCategory: 'generator' | 'analyzer' | 'validator' | 'executor' | 'observer';
  
  /** Input signal or data for this step */
  input: unknown;
  
  /** Step-specific parameters */
  parameters?: Record<string, unknown>;
  
  /** Execution timeout in milliseconds */
  timeoutMs?: number;
}

/**
 * Result of executing a DAG step.
 * Returned to AFI-Reactor for routing to next step.
 */
export interface AFIDAGStepResult {
  /** Node that executed this step */
  nodeId: string;
  
  /** Execution status */
  status: 'success' | 'failure' | 'timeout';
  
  /** Output data from this step */
  output?: unknown;
  
  /** Error message if status is 'failure' */
  error?: string;
  
  /** Execution duration in milliseconds */
  durationMs: number;
  
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// AFI Runtime Adapter Interface
// ============================================================================

/**
 * AFI Runtime Adapter
 * 
 * This is the main interface for the AFI runtime layer.
 * It bridges AFI-Reactor's DAG orchestration with ElizaOS agents.
 * 
 * IMPLEMENTATION STATUS: Stub only. Future work will implement these methods.
 * 
 * @interface AFIRuntimeAdapter
 */
export interface AFIRuntimeAdapter {
  /**
   * Initialize the runtime adapter with the given context.
   * 
   * TODO: Implement initialization logic:
   * - Load ElizaOS runtime
   * - Register AFI agents and tools
   * - Connect to T.S.S.D. Vault for telemetry
   * - Set up mentor registry
   * 
   * @param context - Runtime context for this execution
   */
  initialize(context: AFIRuntimeContext): Promise<void>;
  
  /**
   * Handle a raw signal from AFI-Reactor.
   * 
   * TODO: Implement signal handling logic:
   * - Validate signal structure
   * - Route to appropriate agent/validator
   * - Return validation result
   * 
   * @param signal - Raw signal input
   */
  handleSignal(signal: AFISignalInput): Promise<void>;
  
  /**
   * Execute a DAG step instruction from AFI-Reactor.
   * 
   * TODO: Implement DAG step execution:
   * - Identify the agent/tool for this node
   * - Execute the agent logic
   * - Capture output and errors
   * - Return result to Reactor
   * 
   * @param step - DAG step instruction
   * @returns Result of executing the step
   */
  handleDAGStep(step: AFIDAGStepInstruction): Promise<AFIDAGStepResult>;
  
  /**
   * Emit a mint instruction to the mint pipeline driver.
   * 
   * TODO: Implement mint instruction emission:
   * - Validate mint instruction structure
   * - Queue instruction for backend/Safe approval
   * - Log to T.S.S.D. Vault for audit
   * 
   * @param instruction - Mint instruction to emit
 * @see runtime/mintPipelineDriver.ts
   */
  emitMintInstruction(instruction: unknown): Promise<void>;
  
  /**
   * Shutdown the runtime adapter and clean up resources.
   * 
   * TODO: Implement cleanup logic:
   * - Stop all running agents
   * - Flush telemetry to vault
   * - Close connections
   */
  shutdown(): Promise<void>;
}

// ============================================================================
// Stub Implementation (for testing/scaffolding only)
// ============================================================================

/**
 * Stub implementation of AFIRuntimeAdapter.
 * 
 * This is a placeholder implementation that does nothing.
 * Future work will replace this with a real implementation using ElizaOS.
 * 
 * @class StubRuntimeAdapter
 * @implements {AFIRuntimeAdapter}
 */
export class StubRuntimeAdapter implements AFIRuntimeAdapter {
  async initialize(context: AFIRuntimeContext): Promise<void> {
    console.log('[StubRuntimeAdapter] initialize() called with context:', context);
    // TODO: Implement real initialization
  }
  
  async handleSignal(signal: AFISignalInput): Promise<void> {
    console.log('[StubRuntimeAdapter] handleSignal() called with signal:', signal);
    // TODO: Implement real signal handling
  }
  
  async handleDAGStep(step: AFIDAGStepInstruction): Promise<AFIDAGStepResult> {
    console.log('[StubRuntimeAdapter] handleDAGStep() called with step:', step);
    // TODO: Implement real DAG step execution
    return {
      nodeId: step.nodeId,
      status: 'success',
      output: { message: 'Stub implementation - no real execution' },
      durationMs: 0,
    };
  }
  
  async emitMintInstruction(instruction: unknown): Promise<void> {
    console.log('[StubRuntimeAdapter] emitMintInstruction() called with instruction:', instruction);
    // TODO: Implement real mint instruction emission
  }
  
  async shutdown(): Promise<void> {
    console.log('[StubRuntimeAdapter] shutdown() called');
    // TODO: Implement real cleanup
  }
}
