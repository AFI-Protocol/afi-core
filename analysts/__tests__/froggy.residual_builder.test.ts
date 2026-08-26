/**
 * DEM-BIND (a') as generalized by DEM-PRODUCER-PLAN: the residual builder +
 * composer.
 *
 * The load-bearing property (the equivalence the reactor's scorer node relies
 * on): for every enriched view,
 *   compose(interpret(registeredMapping, view).fragment, residual(view))
 * equals the retired adapter's output on every field the adapter still
 * computes, plus — for the fields whose producers have landed — the value the
 * registered mapping binds from the lane fact (or its declared default when
 * the producer legitimately emitted nothing). Proven here at the afi-core
 * layer against the same adapter export the FLPR-GOV guards pin.
 */

import { describe, it, expect } from "vitest";
import {
  buildFroggyResidualInput,
  composeFroggyTrendPullbackInput,
  FROGGY_INPUT_FIELDS,
} from "../froggy.residual_builder.js";
import {
  buildFroggyTrendPullbackInputFromEnriched,
  type FroggyEnrichedView,
} from "../froggy.enrichment_adapter.js";
import { interpretEnrichmentMapping } from "../../validators/EnrichmentMappingInterpreter.js";
import {
  froggyMapping130,
  loadRegisteredFroggyMapping,
  NEWEST_REGISTERED_FROGGY_MAPPING_VERSION,
} from "./support/froggyMappings.js";

const REGISTERED = loadRegisteredFroggyMapping(NEWEST_REGISTERED_FROGGY_MAPPING_VERSION, froggyMapping130);

/** The technical lane's candle-structure facts (DEM-PRODUCER-CANDLE) every
 * probe view carries — the mapping binds them as REQUIRED. */
const CANDLE = { brokeEmaWithBody: false, haFlatBack: "none" as const, haFlatBackConfirmed: false };
/** DEM-PRODUCER-HTF: the lane's higher-timeframe trend facts (recoded by the
 * mapping into the rubric's bias vocabulary). */
const HTF = {
  htf: {
    daily: { timeframe: "1d", trendBias: "bullish" as const, ema20: 101, ema50: 100, barCount: 100 },
    weekly: { timeframe: "1w", trendBias: "bullish" as const, ema20: 102, ema50: 100, barCount: 100 },
  },
};

function view(overrides: Partial<FroggyEnrichedView>): FroggyEnrichedView {
  return {
    signalId: "sig-residual-test",
    symbol: "BTCUSDT",
    market: "crypto",
    timeframe: "4h",
    technical: { emaDistancePct: 1.5, isInValueSweetSpot: true, atrRegime: "low", ...CANDLE, ...HTF },
    pattern: { patternName: "bull flag", patternConfidence: 80 },
    sentiment: { score: 0.4, tags: ["liquidity sweep"] },
    ...overrides,
  };
}

/** The full-domain probe set: every adapter branch the mapping expresses,
 * residual-relevant variation (sweep hints on/off), and the PLAN producer's
 * fact present / partial / absent. */
const PROBES: Array<[string, FroggyEnrichedView]> = [
  ["baseline (no plan)", view({})],
  ["band 75", view({ pattern: { patternConfidence: 75 } })],
  ["band 74.999", view({ pattern: { patternConfidence: 74.999 } })],
  ["band 65", view({ pattern: { patternConfidence: 65 } })],
  ["band 0.5", view({ pattern: { patternConfidence: 0.5 } })],
  ["band present-zero", view({ pattern: { patternConfidence: 0 } })],
  ["band absent", view({ pattern: { patternName: "bull flag" } })],
  ["recode high", view({ technical: { emaDistancePct: 1.5, isInValueSweetSpot: true, atrRegime: "high", ...CANDLE, ...HTF } })],
  ["recode extreme", view({ technical: { emaDistancePct: 1.5, isInValueSweetSpot: true, atrRegime: "extreme", ...CANDLE, ...HTF } })],
  ["recode present-normal", view({ technical: { emaDistancePct: 1.5, isInValueSweetSpot: true, atrRegime: "normal", ...CANDLE, ...HTF } })],
  ["recode unrecognized", view({ technical: { emaDistancePct: 1.5, isInValueSweetSpot: true, atrRegime: "weird", ...CANDLE, ...HTF } })],
  ["recode absent", view({ technical: { emaDistancePct: 1.5, isInValueSweetSpot: true, ...CANDLE, ...HTF } })],
  ["grandfathers fire (technical carries only the candle facts)", view({ technical: { ...CANDLE, ...HTF } })],
    ["pattern namespace missing", (() => { const v = view({}); delete (v as Record<string, unknown>).pattern; return v; })()],
    ["null-valued sources", view({ technical: { emaDistancePct: null, isInValueSweetSpot: null, atrRegime: null, ...CANDLE, ...HTF } } as unknown as Partial<FroggyEnrichedView>)],
  ["sweep hints off", view({ sentiment: { score: 0.1, tags: [] }, pattern: { patternName: "doji", patternConfidence: 50 } })],
  ["stop-hunt hint", view({ sentiment: { score: 0.1, tags: ["stop hunt"] } })],
  ["negative distance out of sweet spot", view({ technical: { emaDistancePct: -3.2, isInValueSweetSpot: false, atrRegime: "low", ...CANDLE, ...HTF } })],
  ["plan present: rr 1.4286", view({ technical: { emaDistancePct: 1.5, isInValueSweetSpot: true, atrRegime: "low", ...CANDLE, ...HTF, plan: { entryPrice: 50000, stopPrice: 49300, firstTargetPrice: 51000, rrToFirstTarget: 1.4286, targetCount: 1 } } })],
  ["plan present: rr 2.5", view({ technical: { emaDistancePct: 1.5, isInValueSweetSpot: true, atrRegime: "low", ...CANDLE, ...HTF, plan: { entryPrice: 100, stopPrice: 98, firstTargetPrice: 105, rrToFirstTarget: 2.5, targetCount: 2 } } })],
  ["plan present but incomplete (entry only → no R:R fact)", view({ technical: { emaDistancePct: 1.5, isInValueSweetSpot: true, atrRegime: "low", ...CANDLE, ...HTF, plan: { entryPrice: 3001.5, targetCount: 0 } } })],
  ["candle facts: broke + confirmed", view({ technical: { emaDistancePct: 1.5, isInValueSweetSpot: true, atrRegime: "low", brokeEmaWithBody: true, haFlatBack: "bullish", haFlatBackConfirmed: true, ...HTF } })],
  ["candle facts: flat-back present but unconfirmed", view({ technical: { emaDistancePct: 1.5, isInValueSweetSpot: true, atrRegime: "low", brokeEmaWithBody: false, haFlatBack: "bearish", haFlatBackConfirmed: false, ...HTF } })],
  ["htf: weekly bearish, daily bullish (conflict → the analyst's 'unknown' verdict)", view({ technical: { emaDistancePct: 1.5, isInValueSweetSpot: true, atrRegime: "low", ...CANDLE, htf: { daily: { timeframe: "1d", trendBias: "bullish" as const, ema20: 101, ema50: 100, barCount: 100 }, weekly: { timeframe: "1w", trendBias: "bearish" as const, ema20: 98, ema50: 100, barCount: 100 } } } })],
  ["htf: range on both (neutral)", view({ technical: { emaDistancePct: 1.5, isInValueSweetSpot: true, atrRegime: "low", ...CANDLE, htf: { daily: { timeframe: "1d", trendBias: "range" as const, ema20: 100, ema50: 100, barCount: 100 }, weekly: { timeframe: "1w", trendBias: "range" as const, ema20: 100, ema50: 100, barCount: 100 } } } })],
  ["htf: weekly window absent (declared producer absence → recode absent member)", view({ technical: { emaDistancePct: 1.5, isInValueSweetSpot: true, atrRegime: "low", ...CANDLE, htf: { daily: { timeframe: "1d", trendBias: "bullish" as const, ema20: 101, ema50: 100, barCount: 100 } } } })],
  ["plan block null", view({ technical: { emaDistancePct: 1.5, isInValueSweetSpot: true, atrRegime: "low", ...CANDLE, ...HTF, plan: null } })],
];

/** What the registered mapping must yield for the PLAN-produced field. */
function expectedRr(v: FroggyEnrichedView): number {
  const rr = v.technical?.plan?.rrToFirstTarget;
  return typeof rr === "number" ? rr : 1;
}

describe(`compose(fragment(${NEWEST_REGISTERED_FROGGY_MAPPING_VERSION}), residual) partitions the scorer input exactly`, () => {
  it("the inline registered mapping is byte-content-identical to the sibling registry file (when present)", () => {
    if (!REGISTERED.fromSibling) return; // hermetic checkout: inline copy is the vector
    expect(REGISTERED.doc).toStrictEqual(froggyMapping130());
  });

  for (const [label, v] of PROBES) {
    it(label, () => {
      const result = interpretEnrichmentMapping(REGISTERED.doc, v);
      const residual = buildFroggyResidualInput(v);
      const composed = composeFroggyTrendPullbackInput(result.fragment, residual);
      const adapter = buildFroggyTrendPullbackInputFromEnriched(v);
      const bias = (b?: string) => (b === "bullish" ? "long" : b === "bearish" ? "short" : "neutral");
      expect(composed).toStrictEqual({
        ...adapter,
        rrMultiplePlanned: expectedRr(v),
        // DEM-PRODUCER-CANDLE: the lane's computed facts, bound verbatim.
        brokeEmaWithBody: v.technical!.brokeEmaWithBody,
        haFlatBackConfirmed: v.technical!.haFlatBackConfirmed,
        // DEM-PRODUCER-HTF: the lane's trend vocabulary, recoded by the mapping.
        weeklyBias: bias(v.technical?.htf?.weekly?.trendBias ?? undefined),
        dailyBias: bias(v.technical?.htf?.daily?.trendBias ?? undefined),
      });
      // Every producer fact rides the mapping, never the adapter: the
      // synthesis, the stub, and all three literals are deleted.
      for (const gone of ["rrMultiplePlanned", "brokeEmaWithBody", "haFlatBackConfirmed", "weeklyBias", "dailyBias"]) {
        expect(Object.keys(adapter)).not.toContain(gone);
      }
      // A missing R:R fact fires the declared default and is RECORDED.
      const rrFired = result.firedDefaults.includes("rrMultiplePlanned");
      expect(rrFired).toBe(typeof v.technical?.plan?.rrToFirstTarget !== "number");
    });
  }

  it("the residual carries ONLY liquiditySwept — the D-DEM-4(2) placeholder inventory is empty", () => {
    const residual = buildFroggyResidualInput(view({}));
    expect(Object.keys(residual)).toEqual(["liquiditySwept"]);
  });

  it("a view without the candle facts REFUSES at the interpreter (required binds; D-DEM-5(2)) — never a default", () => {
    const bare = view({ technical: { emaDistancePct: 1.5, isInValueSweetSpot: true, atrRegime: "low" } });
    expect(() => interpretEnrichmentMapping(REGISTERED.doc, bare)).toThrow(/required-source-absent|brokeEmaWithBody/);
    const noTechnical = view({}); delete (noTechnical as Record<string, unknown>).technical;
    expect(() => interpretEnrichmentMapping(REGISTERED.doc, noTechnical)).toThrow(/required-source-absent|brokeEmaWithBody/);
  });

  it("FROGGY_INPUT_FIELDS is the scorer input's complete field set", () => {
    expect([...FROGGY_INPUT_FIELDS].sort()).toEqual([
      "atrRegime",
      "brokeEmaWithBody",
      "dailyBias",
      "distanceFromDailyEmaPct",
      "haFlatBackConfirmed",
      "liquiditySwept",
      "pulledBackIntoSweetSpot",
      "rrMultiplePlanned",
      "triggerPatternQuality",
      "weeklyBias",
    ]);
  });
});

describe("the composer fails closed (D-DEM-5(2))", () => {
  const residual = buildFroggyResidualInput(view({}));
  const goodFragment = {
    distanceFromDailyEmaPct: 1,
    pulledBackIntoSweetSpot: true,
    triggerPatternQuality: 2,
    atrRegime: "low",
    rrMultiplePlanned: 2,
    brokeEmaWithBody: false,
    haFlatBackConfirmed: true,
    weeklyBias: "long",
    dailyBias: "long",
  };

  it("composes a complete partition", () => {
    const out = composeFroggyTrendPullbackInput(goodFragment, residual);
    expect(Object.keys(out).sort()).toEqual([...FROGGY_INPUT_FIELDS].sort());
    expect(out.rrMultiplePlanned).toBe(2);
  });

  it("refuses a fragment missing a target the residual does not supply", () => {
    const { rrMultiplePlanned: _rr, ...missingRr } = goodFragment;
    expect(() => composeFroggyTrendPullbackInput(missingRr, residual)).toThrow(/exactly[\s\S]*missing \[rrMultiplePlanned\]/);
  });

  it("refuses a fragment carrying an unknown target", () => {
    expect(() =>
      composeFroggyTrendPullbackInput({ ...goodFragment, extra: 1 }, residual)
    ).toThrow(/exactly[\s\S]*extra \[extra\]/);
  });

  it("refuses a fragment that also supplies a residual field (no dual source)", () => {
    expect(() =>
      composeFroggyTrendPullbackInput({ ...goodFragment, liquiditySwept: false }, residual)
    ).toThrow(/both supply \[liquiditySwept\]/);
  });

  it("refuses wrong-typed targets, including an out-of-grade integer and a non-finite number", () => {
    expect(() =>
      composeFroggyTrendPullbackInput({ ...goodFragment, distanceFromDailyEmaPct: "1" }, residual)
    ).toThrow(/distanceFromDailyEmaPct must be finite number/);
    expect(() =>
      composeFroggyTrendPullbackInput({ ...goodFragment, triggerPatternQuality: 7 }, residual)
    ).toThrow(/0\|1\|2\|3/);
    expect(() =>
      composeFroggyTrendPullbackInput({ ...goodFragment, rrMultiplePlanned: Number.NaN }, residual)
    ).toThrow(/rrMultiplePlanned must be finite number/);
    expect(() =>
      composeFroggyTrendPullbackInput({ ...goodFragment, atrRegime: "volatile" }, residual)
    ).toThrow(/atrRegime must be low\|normal\|high\|extreme/);
  });

  it("refuses a residual value outside its domain (the residual is checked too)", () => {
    expect(() =>
      composeFroggyTrendPullbackInput(goodFragment, { liquiditySwept: "yes" as never })
    ).toThrow(/liquiditySwept must be boolean/);
  });

  it("refuses a mapping-sourced bias outside the rubric's vocabulary", () => {
    expect(() =>
      composeFroggyTrendPullbackInput({ ...goodFragment, weeklyBias: "sideways" }, residual)
    ).toThrow(/weeklyBias must be long\|short\|neutral/);
  });
});
