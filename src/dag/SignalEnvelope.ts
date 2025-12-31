/**
 * AFI Core - Signal Envelope
 *
 * This file defines TypeScript interfaces for signal envelope,
 * extending the core signal schema with DAG-specific metadata.
 *
 * The signal envelope wraps raw signals with enrichment results and execution
 * metadata, providing a complete record of the signal processing pipeline.
 *
 * @module afi-core/src/dag/SignalEnvelope
 */

/**
 * Signal envelope
 *
 * Wraps a raw signal with enrichment results and execution metadata.
 * The envelope provides a complete record of the signal processing pipeline,
 * including which enrichment nodes were executed, which were skipped, and
 * the full execution trace.
 */
export interface SignalEnvelope {
  /** Signal ID. Unique identifier for the signal. */
  signalId: string;

  /** Raw signal data. The original signal before enrichment. */
  rawSignal: unknown;

  /** Enrichment results. Map of node ID to enrichment result. */
  enrichmentResults: Map<string, unknown>;

  /** Analyst configuration ID. The ID of the analyst configuration used for processing. */
  analystConfigId: string;

  /** Envelope metadata. Tracks creation, updates, and execution details. */
  metadata: {
    /** Creation timestamp. ISO 8601 timestamp when the envelope was created. */
    createdAt: string;

    /** Last update timestamp. ISO 8601 timestamp when the envelope was last updated. */
    updatedAt: string;

    /** Enrichment nodes executed. Array of node IDs that were successfully executed. */
    enrichmentNodesExecuted: string[];

    /** Enrichment nodes skipped. Array of node IDs that were skipped (e.g., disabled, optional failure). */
    enrichmentNodesSkipped: string[];

    /** Execution trace. Array of trace entries for each executed node. */
    executionTrace: ExecutionTraceEntry[];
  };
}

/**
 * Execution trace entry
 *
 * Represents a single entry in the execution trace. Each node execution
 * produces a trace entry with timing and status information.
 */
export interface ExecutionTraceEntry {
  /** Node ID. */
  nodeId: string;

  /** Node type. */
  nodeType: 'required' | 'enrichment' | 'ingress';

  /** Start time. ISO 8601 timestamp. */
  startTime: string;

  /** End time. ISO 8601 timestamp. Present only after node completes. */
  endTime?: string;

  /** Duration in milliseconds. Present only after node completes. */
  duration?: number;

  /** Status. */
  status: 'pending' | 'running' | 'completed' | 'failed';

  /** Error message. Present only if node failed. */
  error?: string;
}

/**
 * Enrichment result
 *
 * Represents the result of a single enrichment node execution.
 */
export interface EnrichmentResult {
  /** Node ID. */
  nodeId: string;

  /** Result data. The actual enrichment data produced by the node. */
  data: unknown;

  /** Result metadata. Execution metadata for the enrichment result. */
  metadata: {
    /** Execution time in milliseconds. */
    executionTime: number;

    /** Success flag. */
    success: boolean;

    /** Error message. Present only if execution failed. */
    error?: string;
  };
}

/**
 * Signal envelope status
 *
 * Represents the overall status of a signal envelope.
 */
export type SignalEnvelopeStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Signal envelope summary
 *
 * Provides a summary of a signal envelope for quick inspection.
 */
export interface SignalEnvelopeSummary {
  /** Signal ID. */
  signalId: string;

  /** Analyst configuration ID. */
  analystConfigId: string;

  /** Envelope status. */
  status: SignalEnvelopeStatus;

  /** Number of enrichment nodes executed. */
  nodesExecuted: number;

  /** Number of enrichment nodes skipped. */
  nodesSkipped: number;

  /** Number of enrichment nodes failed. */
  nodesFailed: number;

  /** Total execution time in milliseconds. */
  totalExecutionTime: number;

  /** Creation timestamp. */
  createdAt: string;

  /** Last update timestamp. */
  updatedAt: string;
}

/**
 * Enrichment node status
 *
 * Represents the status of a single enrichment node.
 */
export type EnrichmentNodeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

/**
 * Enrichment node summary
 *
 * Provides a summary of a single enrichment node execution.
 */
export interface EnrichmentNodeSummary {
  /** Node ID. */
  nodeId: string;

  /** Node type. */
  nodeType: 'required' | 'enrichment' | 'ingress';

  /** Node status. */
  status: EnrichmentNodeStatus;

  /** Execution time in milliseconds. Present only if node was executed. */
  executionTime?: number;

  /** Error message. Present only if node failed. */
  error?: string;
}

/**
 * Signal envelope validation result
 *
 * Result of validating a signal envelope.
 */
export interface SignalEnvelopeValidationResult {
  /** Whether the envelope is valid. */
  valid: boolean;

  /** Validation errors. */
  errors: string[];

  /** Validation warnings. */
  warnings: string[];
}

/**
 * Type guard to check if an object is a SignalEnvelope
 */
export function isSignalEnvelope(obj: unknown): obj is SignalEnvelope {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const envelope = obj as unknown as Record<string, unknown>;
  const metadata = envelope.metadata as unknown as Record<string, unknown> | undefined;

  return (
    typeof envelope.signalId === 'string' &&
    envelope.rawSignal !== undefined &&
    envelope.enrichmentResults instanceof Map &&
    typeof envelope.analystConfigId === 'string' &&
    typeof metadata === 'object' &&
    metadata !== null &&
    typeof metadata.createdAt === 'string' &&
    typeof metadata.updatedAt === 'string' &&
    Array.isArray(metadata.enrichmentNodesExecuted) &&
    Array.isArray(metadata.enrichmentNodesSkipped) &&
    Array.isArray(metadata.executionTrace)
  );
}

/**
 * Type guard to check if an object is an ExecutionTraceEntry
 */
export function isExecutionTraceEntry(obj: unknown): obj is ExecutionTraceEntry {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const entry = obj as unknown as Record<string, unknown>;

  return (
    typeof entry.nodeId === 'string' &&
    (entry.nodeType === 'required' || entry.nodeType === 'enrichment' || entry.nodeType === 'ingress') &&
    typeof entry.startTime === 'string' &&
    (entry.status === 'pending' || entry.status === 'running' || entry.status === 'completed' || entry.status === 'failed')
  );
}

/**
 * Type guard to check if an object is an EnrichmentResult
 */
export function isEnrichmentResult(obj: unknown): obj is EnrichmentResult {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const result = obj as unknown as Record<string, unknown>;
  const metadata = result.metadata as unknown as Record<string, unknown> | undefined;

  return (
    typeof result.nodeId === 'string' &&
    result.data !== undefined &&
    typeof metadata === 'object' &&
    metadata !== null &&
    typeof metadata.executionTime === 'number' &&
    typeof metadata.success === 'boolean'
  );
}

/**
 * Create a new signal envelope
 */
export function createSignalEnvelope(
  signalId: string,
  rawSignal: unknown,
  analystConfigId: string
): SignalEnvelope {
  const now = new Date().toISOString();

  return {
    signalId,
    rawSignal,
    enrichmentResults: new Map(),
    analystConfigId,
    metadata: {
      createdAt: now,
      updatedAt: now,
      enrichmentNodesExecuted: [],
      enrichmentNodesSkipped: [],
      executionTrace: [],
    },
  };
}

/**
 * Add enrichment result to signal envelope
 */
export function addEnrichmentResult(
  envelope: SignalEnvelope,
  nodeId: string,
  result: unknown,
  executionTime: number,
  success: boolean,
  error?: string
): SignalEnvelope {
  const updatedEnvelope = { ...envelope };

  // Add enrichment result
  updatedEnvelope.enrichmentResults = new Map(envelope.enrichmentResults);
  updatedEnvelope.enrichmentResults.set(nodeId, {
    nodeId,
    data: result,
    metadata: {
      executionTime,
      success,
      error,
    },
  });

  // Update metadata
  updatedEnvelope.metadata = { ...envelope.metadata };
  updatedEnvelope.metadata.updatedAt = new Date().toISOString();

  if (success) {
    updatedEnvelope.metadata.enrichmentNodesExecuted = [
      ...envelope.metadata.enrichmentNodesExecuted,
      nodeId,
    ];
  } else {
    updatedEnvelope.metadata.enrichmentNodesSkipped = [
      ...envelope.metadata.enrichmentNodesSkipped,
      nodeId,
    ];
  }

  return updatedEnvelope;
}

/**
 * Add execution trace entry to signal envelope
 */
export function addExecutionTraceEntry(
  envelope: SignalEnvelope,
  entry: ExecutionTraceEntry
): SignalEnvelope {
  const updatedEnvelope = { ...envelope };

  updatedEnvelope.metadata = { ...envelope.metadata };
  updatedEnvelope.metadata.executionTrace = [
    ...envelope.metadata.executionTrace,
    entry,
  ];
  updatedEnvelope.metadata.updatedAt = new Date().toISOString();

  return updatedEnvelope;
}

/**
 * Get signal envelope summary
 */
export function getSignalEnvelopeSummary(
  envelope: SignalEnvelope
): SignalEnvelopeSummary {
  const nodesFailed = envelope.metadata.executionTrace.filter(
    entry => entry.status === 'failed'
  ).length;

  const totalExecutionTime = envelope.metadata.executionTrace.reduce(
    (sum, entry) => sum + (entry.duration || 0),
    0
  );

  return {
    signalId: envelope.signalId,
    analystConfigId: envelope.analystConfigId,
    status: nodesFailed > 0 ? 'failed' : 'completed',
    nodesExecuted: envelope.metadata.enrichmentNodesExecuted.length,
    nodesSkipped: envelope.metadata.enrichmentNodesSkipped.length,
    nodesFailed,
    totalExecutionTime,
    createdAt: envelope.metadata.createdAt,
    updatedAt: envelope.metadata.updatedAt,
  };
}

/**
 * Validate signal envelope
 */
export function validateSignalEnvelope(
  envelope: SignalEnvelope
): SignalEnvelopeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (!envelope.signalId) {
    errors.push('Missing signalId');
  }

  if (!envelope.analystConfigId) {
    errors.push('Missing analystConfigId');
  }

  if (!envelope.metadata) {
    errors.push('Missing metadata');
  } else {
    if (!envelope.metadata.createdAt) {
      errors.push('Missing metadata.createdAt');
    }

    if (!envelope.metadata.updatedAt) {
      errors.push('Missing metadata.updatedAt');
    }

    if (!Array.isArray(envelope.metadata.enrichmentNodesExecuted)) {
      errors.push('Missing or invalid metadata.enrichmentNodesExecuted');
    }

    if (!Array.isArray(envelope.metadata.enrichmentNodesSkipped)) {
      errors.push('Missing or invalid metadata.enrichmentNodesSkipped');
    }

    if (!Array.isArray(envelope.metadata.executionTrace)) {
      errors.push('Missing or invalid metadata.executionTrace');
    }
  }

  // Check for duplicate trace entries
  const nodeIds = envelope.metadata.executionTrace.map(entry => entry.nodeId);
  const duplicateNodeIds = nodeIds.filter((id, index) => nodeIds.indexOf(id) !== index);
  if (duplicateNodeIds.length > 0) {
    warnings.push(`Duplicate trace entries for nodes: ${duplicateNodeIds.join(', ')}`);
  }

  // Check for failed nodes
  const failedNodes = envelope.metadata.executionTrace.filter(entry => entry.status === 'failed');
  if (failedNodes.length > 0) {
    warnings.push(`Failed nodes: ${failedNodes.map(entry => entry.nodeId).join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
