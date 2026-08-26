import { describe, expect, it } from "vitest";
import {
  scoreFroggyTrendPullback,
  type FroggyTrendPullbackInput
} from "../froggy.trend_pullback_v1";
import { AnalystScoreTemplateSchema } from "../../src/analyst/AnalystScoreTemplate.js";
import type { FroggyEnrichedView } from "../froggy.enrichment_adapter.js";
import { defaultUwrConfig } from "../../validators/UniversalWeightingRule";
import {
  buildFroggyResidualInput,
  composeFroggyTrendPullbackInput
} from "../froggy.residual_builder";
import { interpretEnrichmentMapping } from "../../validators/EnrichmentMappingInterpreter";
import { NEWEST_REGISTERED_FROGGY_MAPPING } from "./support/froggyMappings";

/** The live composition (registered mapping fragment + residual → rubric);
 * the adapter-only wrapper left with DEM-PRODUCER-PLAN. */
function scoreViaMapping(enriched: FroggyEnrichedView) {
  const { fragment } = interpretEnrichmentMapping(NEWEST_REGISTERED_FROGGY_MAPPING(), enriched);
  return scoreFroggyTrendPullback(
    composeFroggyTrendPullbackInput(fragment, buildFroggyResidualInput(enriched)),
    defaultUwrConfig,
    enriched
  );
}

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

  it("declares conviction as an alias of uwrScore (D5 zero-movement)", () => {
    const result = scoreFroggyTrendPullback(baseGoodInput);
    expect(result.analystScore.conviction).toBe(result.analystScore.uwrScore);
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
        haFlatBack: "none",
        haFlatBackConfirmed: false,
      },
      pattern: {
        patternName: "bullish_engulfing",
        patternConfidence: 0.8,
      },
    };

    const result = scoreViaMapping(enrichedView);

    // Verify analystScore uses enriched view data
    expect(result.analystScore.baseAsset).toBe("ETH");
    expect(result.analystScore.quoteAsset).toBe("USDT");
    expect(result.analystScore.signalTimeframe).toBe("4h");

    // Validate with schema
    const validationResult = AnalystScoreTemplateSchema.safeParse(result.analystScore);
    expect(validationResult.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// DEM-PRODUCER-HTF: the analyst's own direction verdict, now reachable
// (DIR-GOV D-DIR-3's scope-guard required this branch's semantics to be
// resolved in the slot that makes non-neutral biases reachable).
// ---------------------------------------------------------------------------
describe("analystScore.direction — the analyst's verdict from real HTF biases", () => {
  const withBiases = (weeklyBias: FroggyTrendPullbackInput["weeklyBias"], dailyBias: FroggyTrendPullbackInput["dailyBias"]) =>
    scoreFroggyTrendPullback({ ...baseGoodInput, weeklyBias, dailyBias }).analystScore.direction;

  it("both timeframes agree on a side → that side", () => {
    expect(withBiases("long", "long")).toBe("long");
    expect(withBiases("short", "short")).toBe("short");
  });

  it("either timeframe has no directional bias → neutral (the analyst asserts no direction)", () => {
    expect(withBiases("neutral", "long")).toBe("neutral");
    expect(withBiases("long", "neutral")).toBe("neutral");
    expect(withBiases("neutral", "neutral")).toBe("neutral");
  });

  it("both directional and DISAGREEING → 'unknown': a higher-timeframe CONFLICT, not an error or an absence", () => {
    expect(withBiases("long", "short")).toBe("unknown");
    expect(withBiases("short", "long")).toBe("unknown");
  });

  it("the verdict feeds no axis: only the aligned-bias structure term reads the biases, and it is computed before the verdict", () => {
    const conflict = scoreFroggyTrendPullback({ ...baseGoodInput, weeklyBias: "long", dailyBias: "short" });
    const neutral = scoreFroggyTrendPullback({ ...baseGoodInput, weeklyBias: "neutral", dailyBias: "neutral" });
    // Neither pairing is aligned-and-non-neutral, so the +0.4 term fires for
    // neither: the axes are identical and only the verdict differs.
    expect(conflict.analystScore.uwrAxes).toEqual(neutral.analystScore.uwrAxes);
    expect(conflict.analystScore.direction).not.toBe(neutral.analystScore.direction);
  });

  it("an aligned non-neutral pair is the ONLY pairing that lifts structure (+0.4)", () => {
    const aligned = scoreFroggyTrendPullback({ ...baseGoodInput, weeklyBias: "long", dailyBias: "long" }).analystScore.uwrAxes.structure;
    const conflict = scoreFroggyTrendPullback({ ...baseGoodInput, weeklyBias: "long", dailyBias: "short" }).analystScore.uwrAxes.structure;
    expect(aligned).toBeGreaterThan(conflict);
    expect(Math.round((aligned - conflict) * 100) / 100).toBe(0.4);
  });
});
