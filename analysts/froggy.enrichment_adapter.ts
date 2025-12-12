// Analyst-side adapter / anti-corruption layer for Froggy.
// This view intentionally mirrors the shape of an enriched signal (similar to infra EnrichedSignalCore)
// but lives locally in afi-core to avoid cross-repo coupling. Future work may swap this
// to a shared @afi/domain type once a domain package exists.

import type { FroggyTrendPullbackInput } from "./froggy.trend_pullback_v1.js";

/**
 * EnrichmentProfile - Configuration for which enrichment categories to apply
 *
 * This is the "enrichment design" that Pixel Rick (and similar personas) will configure.
 * It specifies which enrichment categories should be enabled and how they should be parameterized.
 *
 * Categories map to DAG enrichment nodes:
 * - technical: Technical indicators (EMA, RSI, volume, etc.)
 * - pattern: Chart pattern detection (engulfing, hammer, etc.)
 * - sentiment: Market sentiment analysis
 * - news: News/event analysis
 * - aiMl: AI/ML ensemble predictions
 *
 * Missing categories are treated as "use default behavior" (typically enabled with default preset).
 *
 * @example
 * // Trend-pullback profile with all categories enabled
 * const fullProfile: EnrichmentProfile = {
 *   technical: { enabled: true, preset: "trend_pullback" },
 *   pattern: { enabled: true, preset: "reversal_patterns" },
 *   sentiment: { enabled: true },
 *   news: { enabled: true },
 *   aiMl: { enabled: true, preset: "ensemble_v1" }
 * };
 *
 * @example
 * // TA-only profile (no sentiment or news)
 * const taOnlyProfile: EnrichmentProfile = {
 *   technical: { enabled: true, preset: "full_suite" },
 *   pattern: { enabled: true },
 *   sentiment: { enabled: false },
 *   news: { enabled: false },
 *   aiMl: { enabled: false }
 * };
 */
export interface EnrichmentProfile {
  technical?: {
    enabled: boolean;
    preset?: string;
    params?: Record<string, unknown>;
  };
  pattern?: {
    enabled: boolean;
    preset?: string;
    params?: Record<string, unknown>;
  };
  sentiment?: {
    enabled: boolean;
    preset?: string;
    params?: Record<string, unknown>;
  };
  news?: {
    enabled: boolean;
    preset?: string;
    params?: Record<string, unknown>;
  };
  aiMl?: {
    enabled: boolean;
    preset?: string;
    params?: Record<string, unknown>;
  };
}

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

export interface FroggyEnrichedView {
  signalId: string;
  symbol: string;
  market: string;
  timeframe: string;

  technical?: {
    emaDistancePct?: number | null;
    isInValueSweetSpot?: boolean | null;
    brokeEmaWithBody?: boolean | null;
    indicators?: Record<string, number | null> | null;
  };

  pattern?: {
    patternName?: string | null;
    patternConfidence?: number | null;
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

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

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
  const brokeEmaWithBody = technical.brokeEmaWithBody ?? false;

  // Map patternConfidence (0..100) to triggerPatternQuality (0..3) conservatively.
  const triggerPatternQuality =
    (pattern.patternConfidence != null
      ? Math.round(clamp01(pattern.patternConfidence / 100) * 3)
      : 0) as 0 | 1 | 2 | 3;

  // Simple liquidity sweep hint from pattern name or sentiment tags.
  const sweepHints = [pattern.patternName, ...(sentiment.tags ?? [])]
    .filter(Boolean)
    .map((s) => (s as string).toLowerCase());
  const liquiditySwept = sweepHints.some((s) =>
    ["liquidity sweep", "stop hunt", "stop-hunt", "sweep"].some((hint) =>
      s.includes(hint)
    )
  );

  // ATR/regime: default to normal until we have a reliable indicator mapping.
  const atrRegime = "normal" as const; // TODO: map from ATR percentile indicators.

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
