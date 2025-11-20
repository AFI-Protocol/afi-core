/**
 * AFI Core Runtime Types
 * ======================
 * 
 * Canonical type definitions for AFI Protocol runtime.
 * These types align with the Zod schemas in schemas/ but provide
 * TypeScript-native interfaces for validators, runtime adapters,
 * and other protocol components.
 * 
 * @module runtime/types
 */

// ============================================================================
// Signal Types
// ============================================================================

/**
 * Indicator data point attached to a signal.
 * Represents technical indicators, sentiment scores, or other metrics.
 */
export interface SignalIndicator {
  name: string;
  value: string | number | boolean | null;
  timeframe?: string;
}

/**
 * Analysis result attached to a signal.
 * Represents output from validators, analyzers, or other processing steps.
 */
export interface SignalAnalysis {
  type: string;
  result: string;
  confidence?: number;
}

/**
 * SignalPayload - Canonical signal structure for AFI Protocol
 * 
 * This is the primary data structure passed through the signal lifecycle:
 * ingestion → validation → scoring → DAG processing → finalization
 * 
 * Aligns with schemas/universal_signal_schema.mjs (Zod schema).
 * 
 * @see schemas/universal_signal_schema.mjs
 */
export interface SignalPayload {
  /** Unique signal identifier (optional during ingestion, required after) */
  id?: string;
  
  /** Trading symbol or asset identifier */
  symbol: string;
  
  /** Market context (e.g., "crypto", "equity", "forex") */
  market?: string;
  
  /** Signal action type */
  action: "buy" | "sell" | "hold";
  
  /** Current or target price */
  price?: number;
  
  /** Signal timestamp (Unix ms or ISO string) */
  timestamp?: number | string;
  
  /** Signal source (e.g., "twitter", "discord", "validator-xyz") */
  source?: string;
  
  /** Strategy or methodology (e.g., "momentum", "mean-reversion") */
  strategy?: string;
  
  /** Human-readable notes or rationale */
  notes?: string;
  
  /** Target price for the signal */
  targetPrice?: number;
  
  /** Stop-loss price */
  stopLoss?: number;
  
  /** Timeframe (e.g., "1h", "1d", "1w") */
  timeframe?: string;
  
  /** Signal strength classification */
  strength?: "low" | "medium" | "high";
  
  /** Technical indicators or metrics */
  indicators?: SignalIndicator[];
  
  /** Analysis results from validators/processors */
  analysis?: SignalAnalysis[];
  
  /** Whether user is subscribed to this signal source */
  subscribed?: boolean;
  
  /** Composite score (0-100, computed by validators) */
  score?: number;
}

/**
 * Minimal signal payload for validators that only need core fields.
 * Useful for validators that operate on content/metadata without
 * requiring full market data.
 */
export interface MinimalSignalPayload {
  /** Signal identifier */
  signalId: string;
  
  /** Signal content (text, JSON, or other serialized data) */
  content: string;
  
  /** Arbitrary metadata */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Re-exports for convenience
// ============================================================================

/**
 * Type alias for backward compatibility.
 * Use SignalPayload directly in new code.
 * @deprecated Use SignalPayload instead
 */
export type Signal = SignalPayload;

