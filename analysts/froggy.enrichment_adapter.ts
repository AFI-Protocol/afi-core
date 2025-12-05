// Analyst-side adapter / anti-corruption layer for Froggy.
// This view intentionally mirrors the shape of an enriched signal (similar to infra EnrichedSignalCore)
// but lives locally in afi-core to avoid cross-repo coupling. Future work may swap this
// to a shared @afi/domain type once a domain package exists.

import type { FroggyTrendPullbackInput } from "./froggy.trend_pullback_v1";

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
  };

  sentiment?: {
    score?: number | null;
    tags?: string[] | null;
  };

  news?: {
    hasShockEvent?: boolean | null;
    shockDirection?: "bullish" | "bearish" | "mixed" | "none" | null;
    headlines?: string[] | null;
  };

  aiMl?: {
    ensembleScore?: number | null;
    modelTags?: string[] | null;
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
