/**
 * DEM-BIND (a'): the residual builder + composer.
 *
 * The load-bearing property: for every enriched view,
 *   compose(interpret(registeredMapping, view).fragment, residual(view))
 * byte-equals the untouched legacy adapter's FULL output. This is the
 * equivalence DEM-BIND's runtime seam relies on, proven here at the afi-core
 * layer against the same adapter export the FLPR-GOV guards pin.
 */

import { existsSync, readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import {
  buildFroggyResidualInput,
  composeFroggyTrendPullbackInput,
} from "../froggy.residual_builder.js";
import {
  buildFroggyTrendPullbackInputFromEnriched,
  type FroggyEnrichedView,
} from "../froggy.enrichment_adapter.js";
import { interpretEnrichmentMapping } from "../../validators/EnrichmentMappingInterpreter.js";

const SIBLING_MAPPING = new URL(
  "../../../afi-config/examples/enrichment-mapping/v1/enrichment-mapping.example.json",
  import.meta.url
).pathname;

/** Inline copy of the canonical froggy mapping's bindings (byte-locked to the
 * afi-config example by the DEM-CONTRACT interpreter test's sibling describe;
 * duplicated minimally here so this suite stays hermetic). */
function froggyMapping(): Record<string, unknown> {
  if (existsSync(SIBLING_MAPPING)) {
    return JSON.parse(readFileSync(SIBLING_MAPPING, "utf8"));
  }
  return {
    schema: "afi.enrichment-mapping.v1",
    mappingId: "froggy-trend-pullback",
    version: "1.0.0",
    namespaceDefaults: ["technical", "pattern"],
    bindings: {
      distanceFromDailyEmaPct: {
        operator: "bind",
        source: { lane: "technical", path: "emaDistancePct" },
        type: "number",
        optionality: { ground: "grandfather", default: 0 },
      },
      pulledBackIntoSweetSpot: {
        operator: "bind",
        source: { lane: "technical", path: "isInValueSweetSpot" },
        type: "boolean",
        optionality: { ground: "grandfather", default: false },
      },
      triggerPatternQuality: {
        operator: "band",
        source: { lane: "pattern", path: "patternConfidence" },
        rows: [
          { when: { gte: 75 }, value: 3 },
          { when: { gte: 65 }, value: 2 },
          { when: { gt: 0 }, value: 1 },
        ],
        otherwise: 0,
        absent: 0,
      },
      atrRegime: {
        operator: "recode",
        source: { lane: "technical", path: "atrRegime" },
        table: { low: "low", high: "high", extreme: "extreme" },
        fallback: "normal",
        absent: "normal",
      },
    },
  };
}

function view(overrides: Partial<FroggyEnrichedView>): FroggyEnrichedView {
  return {
    signalId: "sig-residual-test",
    symbol: "BTCUSDT",
    market: "crypto",
    timeframe: "4h",
    technical: { emaDistancePct: 1.5, isInValueSweetSpot: true, atrRegime: "low" },
    pattern: { patternName: "bull flag", patternConfidence: 80 },
    sentiment: { score: 0.4, tags: ["liquidity sweep"] },
    ...overrides,
  };
}

/** The full-domain probe set: every adapter branch the mapping expresses,
 * plus residual-relevant variation (sweep hints on/off). */
const PROBES: Array<[string, FroggyEnrichedView]> = [
  ["baseline", view({})],
  ["band 75", view({ pattern: { patternConfidence: 75 } })],
  ["band 74.999", view({ pattern: { patternConfidence: 74.999 } })],
  ["band 65", view({ pattern: { patternConfidence: 65 } })],
  ["band 0.5", view({ pattern: { patternConfidence: 0.5 } })],
  ["band present-zero", view({ pattern: { patternConfidence: 0 } })],
  ["band absent", view({ pattern: { patternName: "bull flag" } })],
  ["recode high", view({ technical: { emaDistancePct: 1.5, isInValueSweetSpot: true, atrRegime: "high" } })],
  ["recode extreme", view({ technical: { emaDistancePct: 1.5, isInValueSweetSpot: true, atrRegime: "extreme" } })],
  ["recode present-normal", view({ technical: { emaDistancePct: 1.5, isInValueSweetSpot: true, atrRegime: "normal" } })],
  ["recode unrecognized", view({ technical: { emaDistancePct: 1.5, isInValueSweetSpot: true, atrRegime: "weird" } })],
  ["recode absent", view({ technical: { emaDistancePct: 1.5, isInValueSweetSpot: true } })],
  ["grandfathers fire (empty technical)", view({ technical: {} })],
  ["technical namespace missing", (() => { const v = view({}); delete (v as Record<string, unknown>).technical; return v; })()],
  ["pattern namespace missing", (() => { const v = view({}); delete (v as Record<string, unknown>).pattern; return v; })()],
  ["null namespace", view({ technical: null } as unknown as Partial<FroggyEnrichedView>)],
  ["null-valued sources", view({ technical: { emaDistancePct: null, isInValueSweetSpot: null, atrRegime: null } } as unknown as Partial<FroggyEnrichedView>)],
  ["sweep hints off", view({ sentiment: { score: 0.1, tags: [] }, pattern: { patternName: "doji", patternConfidence: 50 } })],
  ["stop-hunt hint", view({ sentiment: { score: 0.1, tags: ["stop hunt"] } })],
  ["negative distance out of sweet spot", view({ technical: { emaDistancePct: -3.2, isInValueSweetSpot: false, atrRegime: "low" } })],
];

describe("DEM-BIND (a'): compose(fragment, residual) === legacy adapter, byte-for-byte", () => {
  for (const [label, v] of PROBES) {
    it(label, () => {
      const mapping = froggyMapping();
      const result = interpretEnrichmentMapping(mapping, v);
      const residual = buildFroggyResidualInput(v);
      const composed = composeFroggyTrendPullbackInput(result.fragment, residual);
      const legacy = buildFroggyTrendPullbackInputFromEnriched(v);
      expect(composed).toStrictEqual(legacy);
    });
  }

  it("the residual carries exactly the six unexpressible fields", () => {
    const residual = buildFroggyResidualInput(view({}));
    expect(Object.keys(residual).sort()).toEqual([
      "brokeEmaWithBody",
      "dailyBias",
      "haFlatBackConfirmed",
      "liquiditySwept",
      "rrMultiplePlanned",
      "weeklyBias",
    ]);
  });
});

describe("DEM-BIND (a'): the composer fails closed (D-DEM-5(2))", () => {
  const residual = buildFroggyResidualInput(view({}));

  it("refuses a fragment missing a declared target", () => {
    expect(() =>
      composeFroggyTrendPullbackInput(
        { distanceFromDailyEmaPct: 1, pulledBackIntoSweetSpot: true, triggerPatternQuality: 2 },
        residual
      )
    ).toThrow(/exactly/);
  });

  it("refuses a fragment carrying an extra target", () => {
    expect(() =>
      composeFroggyTrendPullbackInput(
        { distanceFromDailyEmaPct: 1, pulledBackIntoSweetSpot: true, triggerPatternQuality: 2, atrRegime: "low", extra: 1 },
        residual
      )
    ).toThrow(/exactly/);
  });

  it("refuses wrong-typed targets, including an out-of-grade integer", () => {
    expect(() =>
      composeFroggyTrendPullbackInput(
        { distanceFromDailyEmaPct: "1", pulledBackIntoSweetSpot: true, triggerPatternQuality: 2, atrRegime: "low" },
        residual
      )
    ).toThrow(/number/);
    expect(() =>
      composeFroggyTrendPullbackInput(
        { distanceFromDailyEmaPct: 1, pulledBackIntoSweetSpot: true, triggerPatternQuality: 7, atrRegime: "low" },
        residual
      )
    ).toThrow(/0\|1\|2\|3/);
  });
});
