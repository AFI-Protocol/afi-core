import { describe, expect, it } from "vitest";
import {
  scoreFroggyTrendPullback,
  scoreFroggyTrendPullbackFromEnriched,
  type FroggyTrendPullbackInput
} from "../froggy.trend_pullback_v1";
import { AnalystScoreTemplateSchema } from "../../src/analyst/AnalystScoreTemplate.js";
import type { FroggyEnrichedView } from "../froggy.enrichment_adapter.js";

const baseGoodInput: FroggyTrendPullbackInput = {
  weeklyBias: "long",
  dailyBias: "long",
  haFlatBackConfirmed: true,
  distanceFromDailyEmaPct: 0.5,
  pulledBackIntoSweetSpot: true,
  brokeEmaWithBody: false,
  liquiditySwept: true,
  triggerPatternQuality: 3,
  atrRegime: "normal",
  rrMultiplePlanned: 2
};

describe("Froggy trend_pullback_v1 analyst mapping", () => {
  it("scores a high-quality setup with strong axes", () => {
    const result = scoreFroggyTrendPullback(baseGoodInput);

    // All scoring data is now in analystScore (canonical)
    expect(result.analystScore.uwrAxes.structure).toBeGreaterThan(0.6);
    expect(result.analystScore.uwrAxes.execution).toBeGreaterThan(0.6);
    expect(result.analystScore.uwrAxes.risk).toBeGreaterThan(0.6);
    expect(result.analystScore.uwrAxes.insight).toBeGreaterThan(0.6);
    expect(result.analystScore.uwrScore).toBeGreaterThan(0.6);
  });

  it("penalizes weak structure when HTF alignment and HA confirmation are missing", () => {
    const result = scoreFroggyTrendPullback({
      ...baseGoodInput,
      weeklyBias: "long",
      dailyBias: "short",
      haFlatBackConfirmed: false,
      pulledBackIntoSweetSpot: false,
      brokeEmaWithBody: true
    });

    expect(result.analystScore.uwrAxes.structure).toBeLessThan(0.4);
  });

  it("penalizes insight when liquidity sweep is absent", () => {
    const result = scoreFroggyTrendPullback({
      ...baseGoodInput,
      liquiditySwept: false
    });

    expect(result.analystScore.uwrAxes.insight).toBeLessThan(0.5);
    expect(result.analystScore.uwrScore).toBeLessThan(
      scoreFroggyTrendPullback(baseGoodInput).analystScore.uwrScore
    );
  });

  it("emits a valid AnalystScoreTemplate", () => {
    const result = scoreFroggyTrendPullback(baseGoodInput);

    // Verify analystScore is present
    expect(result.analystScore).toBeDefined();

    // Validate with schema
    const validationResult = AnalystScoreTemplateSchema.safeParse(result.analystScore);
    expect(validationResult.success).toBe(true);

    // Verify Froggy-specific fields
    expect(result.analystScore.analystId).toBe("froggy");
    expect(result.analystScore.strategyId).toBe("trend_pullback_v1");
    expect(result.analystScore.marketType).toBe("perp");
    expect(result.analystScore.assetClass).toBe("crypto");
    expect(result.analystScore.instrumentType).toBe("linear-perp");
    expect(result.analystScore.direction).toBe("long"); // baseGoodInput has long bias
  });

  it("emits AnalystScoreTemplate with enriched view context", () => {
    const enrichedView: FroggyEnrichedView = {
      signalId: "test-signal-123",
      symbol: "ETH/USDT",
      market: "perp",
      timeframe: "4h",
      technical: {
        emaDistancePct: 0.5,
        isInValueSweetSpot: true,
        brokeEmaWithBody: false,
      },
      pattern: {
        patternName: "bullish_engulfing",
        patternConfidence: 0.8,
      },
    };

    const result = scoreFroggyTrendPullbackFromEnriched(enrichedView);

    // Verify analystScore uses enriched view data
    expect(result.analystScore.baseAsset).toBe("ETH");
    expect(result.analystScore.quoteAsset).toBe("USDT");
    expect(result.analystScore.signalTimeframe).toBe("4h");

    // Validate with schema
    const validationResult = AnalystScoreTemplateSchema.safeParse(result.analystScore);
    expect(validationResult.success).toBe(true);
  });
});

