/**
 * AnalystScoreTemplate - Canonical per-signal analyst scoring template for AFI Protocol
 *
 * This template provides a standardized structure for analyst scoring outputs across
 * all AFI analysts (Froggy, future analysts, etc.). It captures:
 * - Market context (asset class, instrument type, venue, etc.)
 * - Time horizon and direction
 * - UWR axes and score (structure, execution, risk, insight)
 * - Optional narrative fields (rationale, caveats, flags)
 *
 * IMPORTANT BOUNDARIES:
 * 1. This template is PER-SIGNAL analyst scoring only.
 * 2. PoI (Proof of Intelligence) and PoInsight are ANALYST-LEVEL reputation metrics, not per-signal fields.
 *    They are tracked in analyst reputation systems and computed by validators over time, NOT in this template.
 * 3. AFI Index "execution multiplier" (capital-followed weighting) is an INDEX-LEVEL concern
 *    and is defined elsewhere. Do NOT add execution multipliers to this template.
 * 4. UWR (Universal Weighting Rule) math is defined in validators/UniversalWeightingRule.ts.
 *    This template STRUCTURES the UWR output but does NOT change the math.
 *
 * @module afi-core/src/analyst/AnalystScoreTemplate
 */

import { z } from "zod";

/**
 * AnalystScoreTemplate - TypeScript interface for canonical analyst scoring
 *
 * This interface defines the complete structure for analyst scoring outputs.
 * All analysts should emit this template alongside any strategy-specific fields.
 */
export interface AnalystScoreTemplate {
  // ========== Identity ==========
  /** Unique identifier for the analyst (e.g., "froggy", "alpha", "pixel-rick") */
  analystId: string;
  /** Strategy identifier (e.g., "trend_pullback_v1", "mean_reversion_v2") */
  strategyId: string;
  /** Optional strategy version (e.g., "1.0.0", "2.1.3") */
  strategyVersion?: string;

  // ========== Market Context ==========
  /** Market type: spot, perp, futures, options, index, basket, other */
  marketType: "spot" | "perp" | "futures" | "options" | "index" | "basket" | "other";
  /** Asset class: crypto, fx, equity, rates, commodity, multi, other */
  assetClass: "crypto" | "fx" | "equity" | "rates" | "commodity" | "multi" | "other";
  /** Instrument type: spot, linear-perp, inverse-perp, futures, option, index, synthetic, other */
  instrumentType: "spot" | "linear-perp" | "inverse-perp" | "futures" | "option" | "index" | "synthetic" | "other";
  /** Base asset symbol (e.g., "BTC", "ETH", "SPY") */
  baseAsset: string;
  /** Quote asset symbol (e.g., "USDT", "USD", "BTC") - optional for indices */
  quoteAsset?: string;
  /** Exchange or venue name (e.g., "binance", "coinbase", "deribit") */
  venue?: string;
  /** Units per contract (for futures/options) */
  contractSize?: number;
  /** Expiry date (ISO 8601 format) for futures/options */
  expiry?: string;
  /** Strike price (for options) */
  strike?: number;
  /** Option type: call or put */
  optionType?: "call" | "put";

  // ========== Time / Horizon ==========
  /** Signal timeframe (e.g., "1m", "5m", "1h", "4h", "1d") */
  signalTimeframe: string;
  /** Holding horizon: scalp, intraday, swing, position, long-term, unknown */
  holdingHorizon?: "scalp" | "intraday" | "swing" | "position" | "long-term" | "unknown";
  /** ISO timestamp when scoring was completed (for decay calculation) */
  scoredAt: string;

  // ========== Direction & Risk ==========
  /** Trade direction: long, short, neutral, unknown */
  direction: "long" | "short" | "neutral" | "unknown";
  /** Risk bucket: low, medium, high, extreme */
  riskBucket: "low" | "medium" | "high" | "extreme";
  /** Conviction level (0-1 scale, where 0 = no conviction, 1 = maximum conviction) */
  conviction: number;

  // ========== Greeks (Optional: mostly for derivatives) ==========
  /** Option Greeks (delta, gamma, theta, vega, rho) */
  greeks?: {
    delta?: number;
    gamma?: number;
    theta?: number;
    vega?: number;
    rho?: number;
  };

  // ========== UWR Axes + Score ==========
  /**
   * UWR axes (structure, execution, risk, insight)
   * These are the normalized axis scores computed by the analyst.
   * Each axis should be in [0, 1] range.
   */
  uwrAxes: {
    structure: number;
    execution: number;
    risk: number;
    insight: number;
  };
  /**
   * UWR score (weighted average of axes)
   * Computed via computeUwrScore() from validators/UniversalWeightingRule.ts
   * Should be in [0, 1] range.
   */
  uwrScore: number;

  // ========== Optional Narrative ==========
  /** Per-axis notes explaining the scoring rationale */
  axisNotes?: {
    structure?: string;
    execution?: string;
    risk?: string;
    insight?: string;
  };
  /** Flags for special conditions (e.g., ["high-risk", "thin-liquidity", "news-driven"]) */
  axisFlags?: string[];
  /** Short human explanation of the overall score */
  rationale?: string;
  /** Known limitations or edge cases for this signal */
  caveats?: string;
  /** Arbitrary tags for categorization (e.g., ["trend-following", "mean-reversion"]) */
  tags?: string[];
}

/**
 * Zod schema for AnalystScoreTemplate
 *
 * This schema enforces:
 * - Required vs optional fields
 * - Reasonable ranges (conviction in [0, 1], UWR axes in [0, 1], UWR score in [0, 1])
 * - Enum constraints for categorical fields
 * - No PoI / PoInsight fields (those are analyst-level reputation metrics)
 * - No AFI Index execution multipliers (those are index-level)
 */
export const AnalystScoreTemplateSchema = z.object({
  // Identity
  analystId: z.string().min(1),
  strategyId: z.string().min(1),
  strategyVersion: z.string().optional(),

  // Market context
  marketType: z.enum(["spot", "perp", "futures", "options", "index", "basket", "other"]),
  assetClass: z.enum(["crypto", "fx", "equity", "rates", "commodity", "multi", "other"]),
  instrumentType: z.enum(["spot", "linear-perp", "inverse-perp", "futures", "option", "index", "synthetic", "other"]),
  baseAsset: z.string().min(1),
  quoteAsset: z.string().optional(),
  venue: z.string().optional(),
  contractSize: z.number().positive().optional(),
  expiry: z.string().optional(), // ISO 8601 date string
  strike: z.number().positive().optional(),
  optionType: z.enum(["call", "put"]).optional(),

  // Time / horizon
  signalTimeframe: z.string().min(1),
  holdingHorizon: z.enum(["scalp", "intraday", "swing", "position", "long-term", "unknown"]).optional(),
  scoredAt: z.string().datetime(), // ISO 8601 timestamp

  // Direction & risk
  direction: z.enum(["long", "short", "neutral", "unknown"]),
  riskBucket: z.enum(["low", "medium", "high", "extreme"]),
  conviction: z.number().min(0).max(1), // 0-1 scale

  // Greeks (optional)
  greeks: z.object({
    delta: z.number().optional(),
    gamma: z.number().optional(),
    theta: z.number().optional(),
    vega: z.number().optional(),
    rho: z.number().optional(),
  }).optional(),

  // UWR axes + score
  uwrAxes: z.object({
    structure: z.number().min(0).max(1),
    execution: z.number().min(0).max(1),
    risk: z.number().min(0).max(1),
    insight: z.number().min(0).max(1),
  }),
  uwrScore: z.number().min(0).max(1),

  // Optional narrative
  axisNotes: z.object({
    structure: z.string().optional(),
    execution: z.string().optional(),
    risk: z.string().optional(),
    insight: z.string().optional(),
  }).optional(),
  axisFlags: z.array(z.string()).optional(),
  rationale: z.string().optional(),
  caveats: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * AFI DAG configuration for analyst score template
 *
 * Configuration for AFI DAG integration with the analyst score template.
 * This allows analysts to specify enrichment nodes and parallel processing options.
 */
export interface AFIDAGConfig {
  /** Enrichment nodes to use. Array of node IDs to execute. */
  enrichmentNodes: string[];

  /** Whether to enable parallel processing. */
  parallelProcessing: boolean;

  /** Maximum parallel nodes. Limits the number of nodes that can run in parallel. */
  maxParallelNodes?: number;

  /** Timeout for enrichment nodes in milliseconds. */
  enrichmentTimeout?: number;
}

/**
 * Extended AnalystScoreTemplate with AFI DAG configuration
 *
 * Extends the base AnalystScoreTemplate with optional AFI DAG-specific fields.
 * This allows analysts to include enrichment results and AFI DAG configuration
 * in their score output.
 */
export interface AnalystScoreTemplateWithAFIDAG extends AnalystScoreTemplate {
  /** Optional AFI DAG configuration. */
  afiDAGConfig?: AFIDAGConfig;

  /** Optional enrichment results. Map of node ID to enrichment result. */
  enrichmentResults?: Map<string, unknown>;
}

/**
 * Type guard to check if an object is an AFIDAGConfig
 */
export function isAFIDAGConfig(obj: unknown): obj is AFIDAGConfig {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const config = obj as unknown as Record<string, unknown>;

  return (
    Array.isArray(config.enrichmentNodes) &&
    typeof config.parallelProcessing === 'boolean' &&
    (config.maxParallelNodes === undefined || typeof config.maxParallelNodes === 'number') &&
    (config.enrichmentTimeout === undefined || typeof config.enrichmentTimeout === 'number')
  );
}

/**
 * Type guard to check if an object is an AnalystScoreTemplateWithAFIDAG
 */
export function isAnalystScoreTemplateWithAFIDAG(obj: unknown): obj is AnalystScoreTemplateWithAFIDAG {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const template = obj as unknown as Record<string, unknown>;

  // Check base AnalystScoreTemplate fields
  if (
    typeof template.analystId !== 'string' ||
    typeof template.strategyId !== 'string' ||
    typeof template.marketType !== 'string' ||
    typeof template.assetClass !== 'string' ||
    typeof template.instrumentType !== 'string' ||
    typeof template.baseAsset !== 'string' ||
    typeof template.signalTimeframe !== 'string' ||
    typeof template.direction !== 'string' ||
    typeof template.riskBucket !== 'string' ||
    typeof template.conviction !== 'number' ||
    typeof template.uwrScore !== 'number' ||
    typeof template.scoredAt !== 'string'
  ) {
    return false;
  }

  // Check uwrAxes
  const uwrAxes = template.uwrAxes as unknown as Record<string, unknown> | undefined;
  if (
    typeof uwrAxes !== 'object' ||
    uwrAxes === null ||
    typeof uwrAxes.structure !== 'number' ||
    typeof uwrAxes.execution !== 'number' ||
    typeof uwrAxes.risk !== 'number' ||
    typeof uwrAxes.insight !== 'number'
  ) {
    return false;
  }

  // Check optional AFI DAG fields
  if (template.afiDAGConfig !== undefined && !isAFIDAGConfig(template.afiDAGConfig)) {
    return false;
  }

  if (template.enrichmentResults !== undefined && !(template.enrichmentResults instanceof Map)) {
    return false;
  }

  return true;
}
