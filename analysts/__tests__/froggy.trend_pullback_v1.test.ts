import { describe, expect, it } from "vitest";
import {
  scoreFroggyTrendPullback,
  type FroggyTrendPullbackInput
} from "../froggy.trend_pullback_v1";

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

    expect(result.uwrAxes.structureAxis).toBeGreaterThan(0.6);
    expect(result.uwrAxes.executionAxis).toBeGreaterThan(0.6);
    expect(result.uwrAxes.riskAxis).toBeGreaterThan(0.6);
    expect(result.uwrAxes.insightAxis).toBeGreaterThan(0.6);
    expect(result.uwrScore).toBeGreaterThan(0.6);
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

    expect(result.uwrAxes.structureAxis).toBeLessThan(0.4);
  });

  it("penalizes insight when liquidity sweep is absent", () => {
    const result = scoreFroggyTrendPullback({
      ...baseGoodInput,
      liquiditySwept: false
    });

    expect(result.uwrAxes.insightAxis).toBeLessThan(0.5);
    expect(result.uwrScore).toBeLessThan(
      scoreFroggyTrendPullback(baseGoodInput).uwrScore
    );
  });
});
