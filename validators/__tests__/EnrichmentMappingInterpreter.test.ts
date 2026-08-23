/**
 * DEM-CONTRACT: totality, purity, and adapter-oracle tests for the pure
 * enrichment-mapping interpreter (DEM-GOV D-DEM-2(4); slot gate: "the
 * interpreter proven total and side-effect-free by test over the
 * invalid-vector set").
 *
 * The 12 invalid-vector mirrors below are inline copies of the canonical
 * vectors in afi-config `examples/enrichment-mapping/v1/vectors/invalid/`
 * (authored in the same DEM-CONTRACT wave). A dev-only sibling-checkout
 * describe deep-equals each mirror against its canonical file whenever the
 * sibling afi-config checkout is present, so mirror↔file drift fails
 * mechanically — the computeUwrScore.kat.test.ts / UwrProfileLoader pattern.
 *
 * The happy path is oracle-tested against the retired-seam adapter
 * `buildFroggyTrendPullbackInputFromEnriched` (read-only import; the adapter
 * itself is retired only under DEM-BIND, D-DEM-2(7)) — the mapping must
 * reproduce the adapter's expressible subset byte-for-byte, INCLUDING the
 * null-valued and undefined-valued-own-key absence classes the live
 * projection produces (froggy.enrichment_adapter.ts:68-76 documents the
 * class; laneView writes own keys with undefined values).
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { describe, it, expect } from "vitest";
import {
  interpretEnrichmentMapping,
  describeEnrichmentMappingError,
  EnrichmentMappingError,
  type EnrichmentMappingRefusalReason,
} from "../EnrichmentMappingInterpreter.js";
import {
  buildFroggyTrendPullbackInputFromEnriched,
  type FroggyEnrichedView,
} from "../../analysts/froggy.enrichment_adapter.js";

/** The real froggy expressible mapping — byte-content-identical to
 * afi-config examples/enrichment-mapping/v1/enrichment-mapping.example.json. */
function froggyMapping(): Record<string, unknown> {
  return {
    schema: "afi.enrichment-mapping.v1",
    mappingId: "froggy-trend-pullback",
    version: "1.0.0",
    description:
      "The expressible half of the froggy trend_pullback_v1 enrichment adapter, exactly as performed today (froggy.enrichment_adapter.ts:218-276 at afi-core 1be76cd). The D-DEM-5(4) grandfather — four absent-source defaults, exhaustive and non-extensible — is carried as two optionality declarations (ground 'grandfather') plus the band's declared absent member and the recode's fallback/absent members.",
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

const EXPRESSIBLE_TARGETS = [
  "distanceFromDailyEmaPct",
  "pulledBackIntoSweetSpot",
  "triggerPatternQuality",
  "atrRegime",
] as const;

function deepFreeze<T>(value: T): T {
  if (typeof value === "object" && value !== null) {
    for (const key of Object.keys(value as Record<string, unknown>)) {
      deepFreeze((value as Record<string, unknown>)[key]);
    }
    Object.freeze(value);
  }
  return value;
}

/** Run interpreter and adapter over the same view; assert byte-equality on
 * the expressible subset. Inputs are deep-frozen first (purity check). */
function assertOracle(view: FroggyEnrichedView): void {
  const doc = deepFreeze(froggyMapping());
  const frozenView = deepFreeze(JSON.parse(JSON.stringify(view)) as FroggyEnrichedView);
  const result = interpretEnrichmentMapping(doc, frozenView);
  const adapter = buildFroggyTrendPullbackInputFromEnriched(view);
  const projected: Record<string, unknown> = {};
  for (const t of EXPRESSIBLE_TARGETS) {
    projected[t] = adapter[t];
  }
  expect(result.fragment).toStrictEqual(projected);
}

function expectRefusal(
  doc: unknown,
  view: unknown,
  reason: EnrichmentMappingRefusalReason
): EnrichmentMappingError {
  let caught: unknown;
  try {
    interpretEnrichmentMapping(doc, view);
  } catch (error) {
    caught = error;
  }
  expect(caught, `expected a ${reason} refusal`).toBeInstanceOf(EnrichmentMappingError);
  expect((caught as EnrichmentMappingError).reason).toBe(reason);
  return caught as EnrichmentMappingError;
}

const BASE_VIEW: FroggyEnrichedView = {
  signalId: "sig-dem-contract-test",
  symbol: "BTCUSDT",
  market: "crypto",
  timeframe: "4h",
  technical: { emaDistancePct: 1.5, isInValueSweetSpot: true, atrRegime: "low" },
  pattern: { patternName: "bull flag", patternConfidence: 80 },
};

// ---------------------------------------------------------------------------
// 1. Totality over the invalid-vector set (the gate's named proof)
// ---------------------------------------------------------------------------

/** Inline mirrors of the canonical invalid vectors, keyed by filename.
 * Each { doc, reason } — reason null means "no refusal; frozen result". */
const INVALID_VECTOR_MIRRORS: Record<
  string,
  { doc: () => Record<string, unknown>; reason: EnrichmentMappingRefusalReason | null }
> = {
  "extra-properties.json": {
    doc: () => ({ ...froggyMapping(), computedBy: "not-allowed" }),
    reason: "schema-mismatch",
  },
  "wrong-schema-const.json": {
    doc: () => ({ ...froggyMapping(), schema: "afi.enrichment-mapping.v2" }),
    reason: "schema-mismatch",
  },
  "empty-bindings.json": {
    doc: () => ({ ...froggyMapping(), bindings: {} }),
    reason: "bindings-invalid",
  },
  "unknown-operator.json": {
    doc: () => {
      const d = froggyMapping();
      (d.bindings as Record<string, unknown>).distanceFromDailyEmaPct = {
        operator: "compute",
        source: { lane: "technical", path: "emaDistancePct" },
        type: "number",
      };
      return d;
    },
    reason: "operator-unknown",
  },
  "expression-smuggle.json": {
    doc: () => {
      const d = froggyMapping();
      (d.bindings as Record<string, unknown>).distanceFromDailyEmaPct = {
        operator: "bind",
        source: { lane: "technical", path: "emaDistancePct" },
        type: "number",
        expression: "a*b",
      };
      return d;
    },
    reason: "operator-invalid",
  },
  "optionality-missing-default.json": {
    doc: () => {
      const d = froggyMapping();
      (d.bindings as Record<string, unknown>).distanceFromDailyEmaPct = {
        operator: "bind",
        source: { lane: "technical", path: "emaDistancePct" },
        type: "number",
        optionality: { ground: "grandfather" },
      };
      return d;
    },
    reason: "optionality-invalid",
  },
  "producer-ground-without-ref.json": {
    doc: () => {
      const d = froggyMapping();
      (d.bindings as Record<string, unknown>).distanceFromDailyEmaPct = {
        operator: "bind",
        source: { lane: "technical", path: "emaDistancePct" },
        type: "number",
        optionality: { ground: "producer-declared", default: 0 },
      };
      return d;
    },
    reason: "optionality-invalid",
  },
  "band-missing-absent.json": {
    doc: () => {
      const d = froggyMapping();
      (d.bindings as Record<string, unknown>).triggerPatternQuality = {
        operator: "band",
        source: { lane: "pattern", path: "patternConfidence" },
        rows: [{ when: { gte: 75 }, value: 3 }],
        otherwise: 0,
      };
      return d;
    },
    reason: "band-table-invalid",
  },
  "recode-missing-fallback.json": {
    doc: () => {
      const d = froggyMapping();
      (d.bindings as Record<string, unknown>).atrRegime = {
        operator: "recode",
        source: { lane: "technical", path: "atrRegime" },
        table: { low: "low" },
        absent: "normal",
      };
      return d;
    },
    reason: "recode-table-invalid",
  },
  "bad-source-path.json": {
    doc: () => {
      const d = froggyMapping();
      (d.bindings as Record<string, unknown>).distanceFromDailyEmaPct = {
        operator: "bind",
        source: { lane: "technical", path: "emaDistancePct + 1" },
        type: "number",
      };
      return d;
    },
    reason: "source-path-invalid",
  },
  "band-overlapping-rows.json": {
    doc: () => {
      const d = froggyMapping();
      (d.bindings as Record<string, unknown>).triggerPatternQuality = {
        operator: "band",
        source: { lane: "pattern", path: "patternConfidence" },
        rows: [
          { when: { gte: 65 }, value: 2 },
          { when: { gte: 75 }, value: 3 },
        ],
        otherwise: 0,
        absent: 0,
      };
      return d;
    },
    reason: "band-table-invalid",
  },
  "grandfather-nonmember.json": {
    // Schema-valid; grandfather membership is registration-content review
    // (DEM-BIND), deliberately OUT of the strategy-agnostic interpreter
    // (D-DEM-2(4)). The totality half: no throw, frozen result.
    doc: () => {
      const d = froggyMapping();
      (d.bindings as Record<string, unknown>).someOtherInput = {
        operator: "bind",
        source: { lane: "news", path: "hasShockEvent" },
        type: "boolean",
        optionality: { ground: "grandfather", default: true },
      };
      return d;
    },
    reason: null,
  },
};

describe("DEM-CONTRACT: totality over the invalid-vector set", () => {
  for (const [file, { doc, reason }] of Object.entries(INVALID_VECTOR_MIRRORS)) {
    if (reason === null) {
      it(`${file}: no refusal — returns a deep-frozen result (registration review owns it)`, () => {
        const result = interpretEnrichmentMapping(deepFreeze(doc()), deepFreeze(structuredClone(BASE_VIEW)));
        expect(Object.isFrozen(result)).toBe(true);
        expect(Object.isFrozen(result.fragment)).toBe(true);
      });
    } else {
      it(`${file}: refuses with reason "${reason}" and EnrichmentMappingError only`, () => {
        expectRefusal(deepFreeze(doc()), deepFreeze(structuredClone(BASE_VIEW)), reason);
      });
    }
  }

  it("hostile non-object inputs refuse as not-an-object, never TypeError", () => {
    for (const bad of [null, undefined, 42, "doc", [1, 2]]) {
      expectRefusal(bad, {}, "not-an-object");
      expectRefusal(froggyMapping(), bad, "not-an-object");
    }
  });

  it("describeEnrichmentMappingError never throws and names the reason", () => {
    const err = expectRefusal({ schema: "nope" }, {}, "schema-mismatch");
    expect(describeEnrichmentMappingError(err)).toContain("schema-mismatch");
    expect(describeEnrichmentMappingError(new Error("plain"))).toContain("plain");
    expect(describeEnrichmentMappingError("junk")).toContain("junk");
  });
});

// ---------------------------------------------------------------------------
// 2. Purity: no mutation, deterministic
// ---------------------------------------------------------------------------

describe("DEM-CONTRACT: side-effect-freedom and determinism", () => {
  it("mutates neither the mapping document nor the enriched view (happy + hostile)", () => {
    const doc = froggyMapping();
    const docBefore = structuredClone(doc);
    const view = structuredClone(BASE_VIEW);
    const viewBefore = structuredClone(view);
    interpretEnrichmentMapping(doc, view);
    expect(doc).toStrictEqual(docBefore);
    expect(view).toStrictEqual(viewBefore);

    const hostile = INVALID_VECTOR_MIRRORS["band-overlapping-rows.json"].doc();
    const hostileBefore = structuredClone(hostile);
    try {
      interpretEnrichmentMapping(hostile, view);
    } catch {
      // expected
    }
    expect(hostile).toStrictEqual(hostileBefore);
    expect(view).toStrictEqual(viewBefore);
  });

  it("two identical calls produce deep-equal results", () => {
    const a = interpretEnrichmentMapping(froggyMapping(), structuredClone(BASE_VIEW));
    const b = interpretEnrichmentMapping(froggyMapping(), structuredClone(BASE_VIEW));
    expect(a).toStrictEqual(b);
  });
});

// ---------------------------------------------------------------------------
// 3. Happy path = adapter oracle, byte-for-byte on the expressible subset
// ---------------------------------------------------------------------------

describe("DEM-CONTRACT: adapter oracle — expressible subset reproduces byte-for-byte", () => {
  it("band boundaries: 75 → 3, 74.999 → 2, 65 → 2, 0.5 → 1, 0 → 0 (present-zero via otherwise)", () => {
    for (const confidence of [75, 74.999, 65, 0.5, 0]) {
      assertOracle({
        ...BASE_VIEW,
        pattern: { patternName: "bull flag", patternConfidence: confidence },
      });
    }
  });

  it("recode: low/high/extreme map; present 'normal' and unrecognized land on fallback", () => {
    for (const atrRegime of ["low", "high", "extreme", "normal", "weird-unknown"]) {
      assertOracle({
        ...BASE_VIEW,
        technical: { emaDistancePct: 1.5, isInValueSweetSpot: true, atrRegime },
      });
    }
  });

  it("grandfather bind defaults: firing (absent keys) and not firing (present values)", () => {
    assertOracle({ ...BASE_VIEW, technical: {} });
    assertOracle({
      ...BASE_VIEW,
      technical: { emaDistancePct: -2.25, isInValueSweetSpot: false, atrRegime: "high" },
    });
  });

  it("absent lane namespaces (namespace-default path): technical and pattern missing", () => {
    const { technical: _t, ...noTechnical } = BASE_VIEW;
    assertOracle(noTechnical as FroggyEnrichedView);
    const { pattern: _p, ...noPattern } = BASE_VIEW;
    assertOracle(noPattern as FroggyEnrichedView);
  });

  it("null lane namespace resolves absent exactly like the adapter's ?? {} (review-mandated)", () => {
    assertOracle({ ...BASE_VIEW, technical: null } as unknown as FroggyEnrichedView);
    assertOracle({ ...BASE_VIEW, pattern: null } as unknown as FroggyEnrichedView);
  });

  it("null-valued sources per operator form resolve absent (adapter ?? / != null semantics)", () => {
    assertOracle({
      ...BASE_VIEW,
      technical: { emaDistancePct: null, isInValueSweetSpot: null, atrRegime: null },
      pattern: { patternName: "bull flag", patternConfidence: null },
    } as unknown as FroggyEnrichedView);
  });

  it("own keys written with undefined values resolve absent (live-projection class)", () => {
    const view = structuredClone(BASE_VIEW) as Record<string, unknown>;
    (view.technical as Record<string, unknown>).emaDistancePct = undefined;
    (view.technical as Record<string, unknown>).isInValueSweetSpot = undefined;
    (view.technical as Record<string, unknown>).atrRegime = undefined;
    (view.pattern as Record<string, unknown>).patternConfidence = undefined;
    assertOracle(view as unknown as FroggyEnrichedView);
  });

  it("firedDefaults: all four grandfather firings observable; fallback on present value is NOT fired", () => {
    // Everything absent: bind defaults (2) + band absent + recode absent.
    const allAbsent = interpretEnrichmentMapping(froggyMapping(), {
      signalId: "sig", symbol: "BTCUSDT", market: "crypto", timeframe: "4h",
    });
    expect([...allAbsent.firedDefaults].sort()).toEqual([
      "atrRegime",
      "distanceFromDailyEmaPct",
      "pulledBackIntoSweetSpot",
      "triggerPatternQuality",
    ]);
    // Present-unrecognized recode value: "normal" via fallback, NO entry.
    const presentUnrecognized = interpretEnrichmentMapping(froggyMapping(), {
      ...structuredClone(BASE_VIEW),
    });
    expect(presentUnrecognized.firedDefaults).toEqual([]);
    const fallbackCase = interpretEnrichmentMapping(froggyMapping(), {
      ...structuredClone(BASE_VIEW),
      technical: { emaDistancePct: 1.5, isInValueSweetSpot: true, atrRegime: "unheard-of" },
    });
    expect(fallbackCase.fragment.atrRegime).toBe("normal");
    expect(fallbackCase.firedDefaults).toEqual([]);
  });

  it("declared divergence: a present NaN refuses non-finite-number (adapter would propagate)", () => {
    expectRefusal(
      froggyMapping(),
      { ...structuredClone(BASE_VIEW), technical: { emaDistancePct: Number.NaN } },
      "non-finite-number"
    );
  });

  it("declared divergence: a present wrong-type value refuses source-type-mismatch", () => {
    expectRefusal(
      froggyMapping(),
      { ...structuredClone(BASE_VIEW), technical: { emaDistancePct: "1.5" } },
      "source-type-mismatch"
    );
    expectRefusal(
      froggyMapping(),
      { ...structuredClone(BASE_VIEW), technical: { emaDistancePct: 1.5, isInValueSweetSpot: true, atrRegime: 5 } },
      "source-type-mismatch"
    );
  });

  it("a required bind (no optionality) refuses on an absent source", () => {
    const doc = froggyMapping();
    (doc.bindings as Record<string, unknown>).distanceFromDailyEmaPct = {
      operator: "bind",
      source: { lane: "technical", path: "emaDistancePct" },
      type: "number",
    };
    expectRefusal(doc, { signalId: "s", symbol: "B", market: "c", timeframe: "4h" }, "required-source-absent");
  });
});

// ---------------------------------------------------------------------------
// 4. Result immutability
// ---------------------------------------------------------------------------

describe("DEM-CONTRACT: result immutability", () => {
  it("result, fragment, and firedDefaults are frozen", () => {
    const result = interpretEnrichmentMapping(froggyMapping(), structuredClone(BASE_VIEW));
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.fragment)).toBe(true);
    expect(Object.isFrozen(result.firedDefaults)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5. Dev-only sibling-checkout integration (mirror↔file drift guard)
// ---------------------------------------------------------------------------

const SIBLING_VECTORS = new URL(
  "../../../afi-config/examples/enrichment-mapping/v1/vectors/",
  import.meta.url
).pathname;
const SIBLING_EXAMPLE = new URL(
  "../../../afi-config/examples/enrichment-mapping/v1/enrichment-mapping.example.json",
  import.meta.url
).pathname;

describe.skipIf(!existsSync(SIBLING_VECTORS))(
  "DEM-CONTRACT: sibling afi-config vectors (dev-only integration)",
  () => {
    it("the canonical example interprets to the adapter oracle over the base view", () => {
      const example = JSON.parse(readFileSync(SIBLING_EXAMPLE, "utf8"));
      const result = interpretEnrichmentMapping(example, structuredClone(BASE_VIEW));
      const adapter = buildFroggyTrendPullbackInputFromEnriched(structuredClone(BASE_VIEW));
      const projected: Record<string, unknown> = {};
      for (const t of EXPRESSIBLE_TARGETS) projected[t] = adapter[t];
      expect(result.fragment).toStrictEqual(projected);
    });

    it("every valid vector interprets or validates; every invalid vector behaves per its mirror", () => {
      const validDir = `${SIBLING_VECTORS}valid`;
      for (const f of readdirSync(validDir).sort()) {
        const doc = JSON.parse(readFileSync(`${validDir}/${f}`, "utf8"));
        // A valid document must never refuse STRUCTURALLY; evaluation over the
        // base view may legitimately refuse only on evaluation-class reasons.
        try {
          interpretEnrichmentMapping(doc, structuredClone(BASE_VIEW));
        } catch (error) {
          expect(error).toBeInstanceOf(EnrichmentMappingError);
          expect([
            "required-source-absent",
            "source-type-mismatch",
            "non-finite-number",
          ]).toContain((error as EnrichmentMappingError).reason);
        }
      }
      const invalidDir = `${SIBLING_VECTORS}invalid`;
      const files = readdirSync(invalidDir).sort();
      expect(files).toEqual(Object.keys(INVALID_VECTOR_MIRRORS).sort());
      for (const f of files) {
        const canonical = JSON.parse(readFileSync(`${invalidDir}/${f}`, "utf8"));
        const mirror = INVALID_VECTOR_MIRRORS[f];
        expect(canonical, `${f}: inline mirror must equal the canonical vector`).toStrictEqual(mirror.doc());
        if (mirror.reason === null) {
          const result = interpretEnrichmentMapping(canonical, structuredClone(BASE_VIEW));
          expect(Object.isFrozen(result)).toBe(true);
        } else {
          expectRefusal(canonical, structuredClone(BASE_VIEW), mirror.reason);
        }
      }
    });
  }
);
