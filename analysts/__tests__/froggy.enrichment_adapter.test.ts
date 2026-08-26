import { describe, it, expect } from "vitest";
import {
  scoreFroggyTrendPullback,
  type FroggyTrendPullbackScore
} from "../froggy.trend_pullback_v1";
import { defaultUwrConfig } from "../../validators/UniversalWeightingRule";
import {
  buildFroggyTrendPullbackInputFromEnriched,
  type FroggyEnrichedView
} from "../froggy.enrichment_adapter";
import {
  buildFroggyResidualInput,
  composeFroggyTrendPullbackInput
} from "../froggy.residual_builder";
import { interpretEnrichmentMapping } from "../../validators/EnrichmentMappingInterpreter";
import { NEWEST_REGISTERED_FROGGY_MAPPING } from "./support/froggyMappings";

/** The live scoring path (scorer node shape): registered mapping fragment +
 * residual → composer → rubric. The adapter-only convenience wrapper left
 * with DEM-PRODUCER-PLAN (the adapter no longer emits a full input). */
function scoreViaMapping(enriched: FroggyEnrichedView): FroggyTrendPullbackScore {
  const { fragment } = interpretEnrichmentMapping(NEWEST_REGISTERED_FROGGY_MAPPING(), enriched);
  const input = composeFroggyTrendPullbackInput(fragment, buildFroggyResidualInput(enriched));
  return scoreFroggyTrendPullback(input, defaultUwrConfig, enriched);
}

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
        // DEM-PRODUCER-CANDLE: the lane's computed candle-structure facts.
        brokeEmaWithBody: false,
        haFlatBack: "bullish",
        haFlatBackConfirmed: true,
        // DEM-PRODUCER-PLAN: a strong setup carries a verified plan; the
        // risk axis reads the provider's R:R through the mapping (a plan-less
        // submission scores the declared floor).
        plan: { entryPrice: 100, stopPrice: 98, firstTargetPrice: 104, rrToFirstTarget: 2, targetCount: 1 }
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
      scoreViaMapping(enriched);

    // All scoring data is now in analystScore (canonical)
    expect(result.analystScore.uwrAxes.structure).toBeGreaterThan(0.3);
    expect(result.analystScore.uwrAxes.execution).toBeGreaterThan(0.3);
    expect(result.analystScore.uwrAxes.risk).toBeGreaterThan(0.3);
    expect(result.analystScore.uwrAxes.insight).toBeGreaterThan(0.3);
    expect(result.analystScore.uwrScore).toBeGreaterThan(0.3);
  });

  it("REFUSES when the technical lane is absent — the candle facts are required binds (D-DEM-5(2)); no safe default", () => {
    const enriched: FroggyEnrichedView = {
      signalId: "enriched-2",
      symbol: "ETH",
      market: "crypto",
      timeframe: "4h"
      // no technical/pattern/sentiment/news/aiMl
    };
    expect(() => scoreViaMapping(enriched)).toThrow(/required-source-absent|brokeEmaWithBody/);
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

  // AR-GOV D-AR-3: the ATR regime is the technical lane's governed fact.
  // Absent or unrecognized -> "normal" (behavior-preserving); each closed
  // vocabulary value passes through to the scorer input.
  describe("atrRegime mapping (AR-GOV D-AR-3)", () => {
    const enrichedWithRegime = (
      atrRegime?: "low" | "normal" | "high" | "extreme" | null
    ): FroggyEnrichedView => ({
      signalId: `regime-${String(atrRegime)}`,
      symbol: "BTC",
      market: "crypto",
      timeframe: "1h",
      technical: { emaDistancePct: 0.5, atrRegime }
    });

    it.each([["low"], ["normal"], ["high"], ["extreme"]] as const)(
      "passes the lane fact %s through to the scorer input",
      (regime) => {
        const input = buildFroggyTrendPullbackInputFromEnriched(
          enrichedWithRegime(regime)
        );
        expect(input.atrRegime).toBe(regime);
      }
    );

    it("maps an absent regime to normal (regime-less signals keep today's behavior)", () => {
      const input = buildFroggyTrendPullbackInputFromEnriched(
        enrichedWithRegime(undefined)
      );
      expect(input.atrRegime).toBe("normal");

      const noTechnical = buildFroggyTrendPullbackInputFromEnriched({
        signalId: "regime-no-technical",
        symbol: "BTC",
        market: "crypto",
        timeframe: "1h"
      });
      expect(noTechnical.atrRegime).toBe("normal");
    });

    it("maps an unrecognized string to normal (defensive; the lane vocabulary is closed)", () => {
      const input = buildFroggyTrendPullbackInputFromEnriched(
        enrichedWithRegime("volatile" as unknown as "normal")
      );
      expect(input.atrRegime).toBe("normal");
    });
  });

  it("emits neither brokeEmaWithBody nor haFlatBackConfirmed (DEM-PRODUCER-CANDLE: computed lane facts, mapping-bound)", () => {
    const input = buildFroggyTrendPullbackInputFromEnriched({
      signalId: "no-stub",
      symbol: "BTC",
      market: "crypto",
      timeframe: "1h",
      technical: { emaDistancePct: 0.5, isInValueSweetSpot: true }
    });
    expect(Object.keys(input)).not.toContain("brokeEmaWithBody");
    expect(Object.keys(input)).not.toContain("haFlatBackConfirmed");
  });
});
