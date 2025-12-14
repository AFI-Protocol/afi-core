import { describe, it, expect } from "vitest";
import {
  scoreFroggyTrendPullbackFromEnriched,
  type FroggyTrendPullbackScore
} from "../froggy.trend_pullback_v1";
import type { FroggyEnrichedView } from "../froggy.enrichment_adapter";

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
});
