// Analyst-side adapter / anti-corruption layer for Froggy.
// This view intentionally mirrors the shape of an enriched signal (similar to infra EnrichedSignalCore)
// but lives locally in afi-core to avoid cross-repo coupling. Future work may swap this
// to a shared @afi/domain type once a domain package exists.

import type { FroggyTrendPullbackInput } from "./froggy.trend_pullback_v1.js";

/**
 * FroggyAiMlV1 - AI/ML model predictions from Tiny Brains
 *
 * This interface represents predictions from external ML models (Tiny Brains).
 * It is a read-only context field that downstream code can optionally use.
 *
 * **Important:**
 * - UWR (Universal Weighting Rule) scoring does NOT currently depend on this field.
 * - Froggy strategy scoring (e.g., trend_pullback_v1) does NOT currently use this field.
 * - This is a future integration point for ML-based signals.
 *
 * @example
 * const aiMlPrediction: FroggyAiMlV1 = {
 *   convictionScore: 0.85,
 *   direction: "long",
 *   regime: "bull",
 *   riskFlag: false,
 *   notes: "Strong uptrend detected by ensemble model"
 * };
 */
export interface FroggyAiMlV1 {
  /** Confidence in the suggested direction (0–1 range) */
  convictionScore: number;
  /** Suggested trade direction from ML model */
  direction: "long" | "short" | "neutral";
  /** Optional market regime detected by model (e.g., "bull", "bear", "highVol") */
  regime?: string;
  /** True if model detects elevated risk conditions */
  riskFlag?: boolean;
  /** Optional human-readable notes or explanation from model */
  notes?: string | null;
}

/**
 * Declared stub for `brokeEmaWithBody` until a modelling filing implements a
 * candle-derived producer (D5 / D5-GOV zero-movement option).
 *
 * Live reactor `viewTechnical` pins this exact value. It is **not** a silent
 * missing-data default: it is the explicit, unimplemented-input law. Changing
 * it, or wiring a real producer, is a score-moving Tier-F act.
 */
export const BROKE_EMA_WITH_BODY_UNIMPLEMENTED_STUB = false as const;

export interface FroggyEnrichedView {
  signalId: string;
  symbol: string;
  market: string;
  timeframe: string;

  technical?: {
    emaDistancePct?: number | null;
    isInValueSweetSpot?: boolean | null;
    brokeEmaWithBody?: boolean | null;
    /**
     * Raw indicator readings projected from the technical lane
     * (rsi / ema_20 / ema_50 / volume_ratio). Context only — NOT read by this
     * adapter or any scorer input; wiring one into an axis is a separately
     * governed change. Documented here to match its siblings below, which
     * already carry this annotation.
     *
     * Values are `| undefined` because the producing lane payload marks some
     * readings optional (e.g. TechnicalLensV1.volumeRatio): the projecting node
     * writes the key with an `undefined` value rather than omitting it or
     * substituting null.
     *
     * The type is widened to match that rather than coercing at the producer
     * because widening is the only option that provably changes nothing. The
     * alternatives do not: canonical JSON drops an `undefined`-valued key but
     * retains a `null`-valued one, and omitting the key changes `Object.keys()`.
     * This view reaches no live hash preimage today (`enrichmentHash` is taken
     * over the raw lane payloads, not this renamed projection), but
     * `strategyLocalViewHash` is a declared-but-unproduced pin over exactly this
     * view — so a coercion here would become hash-relevant the moment that
     * producer is wired up.
     */
    indicators?: Record<string, number | null | undefined> | null;
    /**
     * ATR(14) projected from the technical lane. Context only — NOT read by
     * this adapter or any scorer input; wiring it into an axis is a separately
     * governed change.
     */
    atr14?: number | null;
    /**
     * EMA20-vs-EMA50 trend bias projected from the technical lane. Context
     * only — NOT read by this adapter; wiring it into an axis is a separately
     * governed change.
     */
    trendBias?: "bullish" | "bearish" | "range" | null;
    /**
     * ATR-percentile volatility regime projected from the technical lane —
     * the governed lane fact this adapter READS (AR-GOV D-AR-3). Closed
     * vocabulary; absent or unrecognized maps to "normal".
     */
    atrRegime?: "low" | "normal" | "high" | "extreme" | null;
  };

  pattern?: {
    patternName?: string | null;
    patternConfidence?: number | null;
    /**
     * SAME-TIMEFRAME structure read projected from the pattern lane. Context
     * only — NOT read by this adapter, and never a higher-timeframe bias
     * (weeklyBias/dailyBias remain a separate future capability).
     */
    structureBias?: "higher-highs" | "lower-lows" | "choppy" | null;
    /**
     * SAME-TIMEFRAME pullback confirmation projected from the pattern lane.
     * Context only — NOT read by this adapter.
     */
    trendPullbackConfirmed?: boolean | null;
    regime?: {
      cyclePhase?:
        | "early_bull"
        | "mid_bull"
        | "late_bull"
        | "bear"
        | "sideways"
        | "capitulation"
        | "accumulation"
        | "euphoria"
        | "unknown";
      trendState?: "uptrend" | "downtrend" | "range" | "choppy";
      volRegime?: "low" | "normal" | "high" | "extreme";
      topBottomRisk?: "top_risk" | "bottom_risk" | "neutral";
      externalLabels?: {
        fearGreedValue?: number;
        fearGreedLabel?:
          | "extreme_fear"
          | "fear"
          | "neutral"
          | "greed"
          | "extreme_greed"
          | "unknown";
        notes?: string;
      };
    };
  };

  sentiment?: {
    score?: number | null;
    tags?: string[] | null;
  };

  news?: {
    hasShockEvent?: boolean | null;
    shockDirection?: "bullish" | "bearish" | "mixed" | "none" | "unknown" | null;
    headlines?: string[] | null;
    /** Structured news items with full metadata (optional, v2 format) */
    items?: {
      title: string;
      source: string;
      url: string;
      publishedAt: string; // ISO 8601 string
    }[] | null;
  };

  /**
   * AI/ML predictions from Tiny Brains (optional, read-only context)
   *
   * Populated by external ML models. Not currently used by UWR scoring or
   * Froggy strategy logic. This is a future integration point.
   */
  aiMl?: FroggyAiMlV1;

  /**
   * News Features (UWR-ready, not wired yet)
   *
   * Derived summary of news enrichment for potential use in UWR scoring.
   * Currently not used by UWR math - this is a future input layer.
   *
   * Computed from the `news` field (headlines, items, timestamps).
   */
  newsFeatures?: {
    /** True if hasShockEvent === true */
    hasNewsShock: boolean;
    /** Number of unique headlines in the time window */
    headlineCount: number;
    /** Minutes since most recent article (null if no items) */
    mostRecentMinutesAgo: number | null;
    /** Minutes since oldest article (null if no items) */
    oldestMinutesAgo: number | null;
    /** True if headlines mention exchanges (Binance, Coinbase, etc.) */
    hasExchangeEvent: boolean;
    /** True if headlines mention regulation (SEC, ETF, lawsuit, etc.) */
    hasRegulatoryEvent: boolean;
    /** True if headlines mention macro events (Fed, inflation, etc.) */
    hasMacroEvent: boolean;
  };

  enrichmentMeta?: {
    categories?: string[];
    enrichedBy?: string;
    enrichedAt?: string;
  };
}

// Map patternConfidence (0..100) to triggerPatternQuality (0..3) at the
// emitted grade boundaries (EQ-GOV D-EQ-2): >=75 -> 3, >=65 -> 2, >0 -> 1.
// A present-but-zero-confidence pattern stays 0, like the absent case.
const quantisePatternConfidence = (confidence: number): 0 | 1 | 2 | 3 => {
  if (confidence >= 75) return 3;
  if (confidence >= 65) return 2;
  if (confidence > 0) return 1;
  return 0;
};

/**
 * Map an enriched view into Froggy's strategy-specific input.
 * Uses conservative defaults; avoids guessy heuristics.
 */
export function buildFroggyTrendPullbackInputFromEnriched(
  enriched: FroggyEnrichedView
): FroggyTrendPullbackInput {
  const technical = enriched.technical ?? {};
  const pattern = enriched.pattern ?? {};
  const sentiment = enriched.sentiment ?? {};

  const distanceFromDailyEmaPct = technical.emaDistancePct ?? 0;
  const pulledBackIntoSweetSpot = technical.isInValueSweetSpot ?? false;
  // Explicit stub law (not a silent default): absent/undefined → declared
  // unimplemented stub. A future producer must land via a score-moving filing.
  const brokeEmaWithBody =
    technical.brokeEmaWithBody ?? BROKE_EMA_WITH_BODY_UNIMPLEMENTED_STUB;

  const triggerPatternQuality =
    pattern.patternConfidence != null
      ? quantisePatternConfidence(pattern.patternConfidence)
      : 0;

  // Simple liquidity sweep hint from pattern name or sentiment tags.
  const sweepHints = [pattern.patternName, ...(sentiment.tags ?? [])]
    .filter(Boolean)
    .map((s) => (s as string).toLowerCase());
  const liquiditySwept = sweepHints.some((s) =>
    ["liquidity sweep", "stop hunt", "stop-hunt", "sweep"].some((hint) =>
      s.includes(hint)
    )
  );

  // ATR regime is the technical lane's governed percentile fact (AR-GOV
  // D-AR-2/D-AR-3). Absent (regime-less signal, pre-AR record, or the
  // defensive unknown-string branch) -> "normal", preserving prior behavior.
  const atrRegime =
    technical.atrRegime === "low" ||
    technical.atrRegime === "high" ||
    technical.atrRegime === "extreme"
      ? technical.atrRegime
      : "normal";

  // HTF bias defaults neutral (could be extended when HTF context is available).
  const weeklyBias = "neutral" as const;
  const dailyBias = "neutral" as const;

  const rrMultiplePlanned =
    pulledBackIntoSweetSpot && !brokeEmaWithBody ? 2 : 1;

  return {
    weeklyBias,
    dailyBias,
    haFlatBackConfirmed: false, // TODO: map from enriched technical context when available
    distanceFromDailyEmaPct,
    pulledBackIntoSweetSpot,
    brokeEmaWithBody,
    liquiditySwept,
    triggerPatternQuality,
    atrRegime,
    rrMultiplePlanned, // conservative default; TODO: map from enriched risk cues if present
  };
}
