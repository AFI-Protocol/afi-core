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

    expect(result.uwrAxes.structureAxis).toBeGreaterThan(0.3);
    expect(result.uwrAxes.executionAxis).toBeGreaterThan(0.3);
    expect(result.uwrAxes.riskAxis).toBeGreaterThan(0.3);
    expect(result.uwrAxes.insightAxis).toBeGreaterThan(0.3);
    expect(result.uwrScore).toBeGreaterThan(0.3);
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

    expect(result.uwrAxes.structureAxis).toBeDefined();
    expect(result.uwrAxes.executionAxis).toBeDefined();
    expect(result.uwrAxes.riskAxis).toBeDefined();
    expect(result.uwrAxes.insightAxis).toBeDefined();
    expect(result.uwrScore).toBeDefined();
  });
});
