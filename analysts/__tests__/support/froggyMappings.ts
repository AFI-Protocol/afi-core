/**
 * Test support: the REGISTERED froggy mapping versions, as data.
 *
 * Each `froggyMappingVXYZ()` is an inline, hermetic copy of the registry file
 * `afi-config/registries/enrichment-mappings/froggy-trend-pullback--X.Y.Z.json`.
 * When the sibling afi-config checkout is present, `loadRegisteredFroggyMapping`
 * reads the registry file and the suite asserts the inline copy is
 * byte-content-identical to it (a drift guard between the two repos); in a
 * hermetic CI checkout the inline copy is used alone.
 */
import { existsSync, readFileSync } from "node:fs";

export function siblingMappingPath(version: string): string {
  return new URL(
    `../../../../afi-config/registries/enrichment-mappings/froggy-trend-pullback--${version}.json`,
    import.meta.url
  ).pathname;
}

/** The DEM-BIND registration (four expressible bindings; D-DEM-5(4) grandfather). */
export function froggyMapping100(): Record<string, unknown> {
  return {
    schema: "afi.enrichment-mapping.v1",
    mappingId: "froggy-trend-pullback",
    version: "1.0.0",
    description:
      "The expressible half of the froggy trend_pullback_v1 enrichment adapter, exactly as performed today (froggy.enrichment_adapter.ts:218-276 at afi-core 1be76cd). The D-DEM-5(4) grandfather — four absent-source defaults, exhaustive and non-extensible — is carried as two optionality declarations (ground 'grandfather') plus the band's declared absent member and the recode's fallback/absent members.",
    namespaceDefaults: ["technical", "pattern"],
    bindings: expressibleBindings100(),
  };
}

function expressibleBindings100(): Record<string, unknown> {
  return {
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
  };
}

/** DEM-PRODUCER-PLAN: 1.0.0 + rrMultiplePlanned bound to the technical lane's
 * verified trade-plan fact (producer-declared optional, floor default 1). */
export function froggyMapping110(): Record<string, unknown> {
  return {
    schema: "afi.enrichment-mapping.v1",
    mappingId: "froggy-trend-pullback",
    version: "1.1.0",
    description:
      "DEM-PRODUCER-PLAN: the 1.0.0 bindings plus rrMultiplePlanned bound to technical.plan.rrToFirstTarget, the technical lane's VERIFIED trade-plan fact (the submitted afi.trade-plan.v1 levels checked against the fetched candles, D-DEM-5(6)). Optional under D-DEM-5(4)(b): the producer emits no R:R for a submission carrying no complete plan; the declared default is the rubric floor (1), hash-committed when fired (DEM-GOV §9 D-5).",
    namespaceDefaults: ["technical", "pattern"],
    bindings: {
      ...expressibleBindings100(),
      rrMultiplePlanned: {
        operator: "bind",
        source: {
          lane: "technical",
          path: "plan.rrToFirstTarget",
          producedBy: { pluginId: "afi-analysis-technical", pluginVersion: "2.0.0" },
        },
        type: "number",
        optionality: {
          ground: "producer-declared",
          default: 1,
          producerRef: { pluginId: "afi-analysis-technical", pluginVersion: "2.0.0" },
        },
      },
    },
  };
}

/** The newest registered mapping this afi-core revision composes against. */
export const NEWEST_REGISTERED_FROGGY_MAPPING = froggyMapping110;
export const NEWEST_REGISTERED_FROGGY_MAPPING_VERSION = "1.1.0";

/** Prefer the sibling registry file when present (and let the suite drift-check it). */
export function loadRegisteredFroggyMapping(version: string, inline: () => Record<string, unknown>): {
  doc: Record<string, unknown>;
  fromSibling: boolean;
} {
  const path = siblingMappingPath(version);
  if (existsSync(path)) {
    return { doc: JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>, fromSibling: true };
  }
  return { doc: inline(), fromSibling: false };
}
