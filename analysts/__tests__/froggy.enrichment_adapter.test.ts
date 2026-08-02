import { describe, it, expect } from "vitest";
import {
  scoreFroggyTrendPullbackFromEnriched,
  type FroggyTrendPullbackScore
} from "../froggy.trend_pullback_v1";
import {
  buildFroggyTrendPullbackInputFromEnriched,
  type FroggyEnrichedView
} from "../froggy.enrichment_adapter";

describe("froggy.enrichment_adapter", () => {
  it("produces a high-ish score for a strong enriched setup", () => {
    const enriched: FroggyEnrichedView = {
      signalId: "enriched-1",
      symbol: "BTC",
      market: "crypto",
      timeframe: "1h",
      technical: {
        emaDistancePct: 0.5,
        isInValueSweetSpot: true,
        brokeEmaWithBody: false
      },
      pattern: {
        patternName: "liquidity sweep + reversal",
        patternConfidence: 85
      },
      sentiment: {
        tags: ["liquidity sweep", "momentum"]
      }
    };

    const result: FroggyTrendPullbackScore =
      scoreFroggyTrendPullbackFromEnriched(enriched);

    // All scoring data is now in analystScore (canonical)
    expect(result.analystScore.uwrAxes.structure).toBeGreaterThan(0.3);
    expect(result.analystScore.uwrAxes.execution).toBeGreaterThan(0.3);
    expect(result.analystScore.uwrAxes.risk).toBeGreaterThan(0.3);
    expect(result.analystScore.uwrAxes.insight).toBeGreaterThan(0.3);
    expect(result.analystScore.uwrScore).toBeGreaterThan(0.3);
  });

  it("falls back to safe defaults when optional sections are missing", () => {
    const enriched: FroggyEnrichedView = {
      signalId: "enriched-2",
      symbol: "ETH",
      market: "crypto",
      timeframe: "4h"
      // no technical/pattern/sentiment/news/aiMl
    };

    const result = scoreFroggyTrendPullbackFromEnriched(enriched);

    // All scoring data is now in analystScore (canonical)
    expect(result.analystScore.uwrAxes.structure).toBeDefined();
    expect(result.analystScore.uwrAxes.execution).toBeDefined();
    expect(result.analystScore.uwrAxes.risk).toBeDefined();
    expect(result.analystScore.uwrAxes.insight).toBeDefined();
    expect(result.analystScore.uwrScore).toBeDefined();
  });

  // EQ-GOV D-EQ-2: the confidence -> triggerPatternQuality threshold map is
  // law. Exact-value pins over every band boundary; the absent case stays 0.
  describe("triggerPatternQuality quantisation (EQ-GOV D-EQ-2)", () => {
    const enrichedWithConfidence = (
      patternConfidence: number
    ): FroggyEnrichedView => ({
      signalId: `quant-${patternConfidence}`,
      symbol: "BTC",
      market: "crypto",
      timeframe: "1h",
      pattern: { patternName: "pin bar", patternConfidence }
    });

    const expected: Array<[confidence: number, quality: 0 | 1 | 2 | 3]> = [
      [0, 0],
      [0.8, 1], // fractional probe: the 0 < conf < 65 band has no integer floor
      [1, 1],
      [59, 1],
      [60, 1], // inside bar grade
      [64, 1],
      [65, 2], // pin bar grade — the committed-golden fixpoint
      [74, 2],
      [75, 3], // engulfing grade
      [100, 3]
    ];

    it.each(expected)("maps confidence %d to quality %d", (confidence, quality) => {
      const input = buildFroggyTrendPullbackInputFromEnriched(
        enrichedWithConfidence(confidence)
      );
      expect(input.triggerPatternQuality).toBe(quality);
    });

    it("maps an absent pattern section to quality 0", () => {
      const input = buildFroggyTrendPullbackInputFromEnriched({
        signalId: "quant-absent",
        symbol: "BTC",
        market: "crypto",
        timeframe: "1h"
      });
      expect(input.triggerPatternQuality).toBe(0);
    });

    it("maps a pattern block without a confidence to quality 0", () => {
      const input = buildFroggyTrendPullbackInputFromEnriched({
        signalId: "quant-no-confidence",
        symbol: "BTC",
        market: "crypto",
        timeframe: "1h",
        pattern: { patternName: "pin bar" }
      });
      expect(input.triggerPatternQuality).toBe(0);
    });
  });
});
