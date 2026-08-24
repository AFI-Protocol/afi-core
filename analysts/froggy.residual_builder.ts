/**
 * DEM-BIND: the residual (unexpressible) input builder + the composer that
 * assembles the froggy scorer input from an interpreted mapping fragment plus
 * the residual half (DEM-GOV D-DEM-2(6)(7); §9 slot DEM-BIND, owner-authorized
 * 2026-08-22).
 *
 * WHY THIS MODULE EXISTS, AND WHY THE ADAPTER IS NOT EDITED:
 * `froggy.enrichment_adapter.ts` stays byte-identical — the DEM-BIND gate
 * requires the FLPR-GOV inertness guards and the oracle/byte-equivalence
 * suites (which import the adapter export as their oracle) to pass UNCHANGED,
 * and the owner directive requires the unexpressible half left in place. So
 * the residual builder CALLS the untouched adapter and picks only the six
 * fields the mapping cannot express (D-DEM-3): the five placeholders whose
 * real producers are the DEM-PRODUCER slots, plus liquiditySwept (a two-lane
 * read, inexpressible by construction — D-DEM-3(5), expressly reserved).
 *
 * On the live mapping path the adapter's expressible computation still
 * executes here and its expressible outputs are DISCARDED — only the
 * interpreter fragment is authoritative (D-DEM-2(6): "no code-path fallback
 * to the retired bespoke code" — a discarded value is not a fallback; where a
 * determination exists the fragment is unconditionally authoritative, and an
 * interpreter refusal means no determination at all, D-DEM-5(7)).
 *
 * SINCE THE FINAL BOUNDED STEP (mappingRef required; DEM-BIND (e2)): the
 * reactor's scorer node has NO legacy branch — it refuses to score without a
 * resolved mapping, so this composer is the ONLY assembly of the froggy
 * scorer input at runtime. The adapter export's remaining consumers are the
 * test-side byte-equivalence oracles and this module's residual Pick — see
 * the retirement note in froggy.enrichment_adapter.ts (D-DEM-2(7), ruling R1).
 */

import type { FroggyEnrichedView } from "./froggy.enrichment_adapter.js";
import { buildFroggyTrendPullbackInputFromEnriched } from "./froggy.enrichment_adapter.js";
import type { FroggyTrendPullbackInput } from "./froggy.trend_pullback_v1.js";
import type { EnrichmentMappingResult } from "../validators/EnrichmentMappingInterpreter.js";

/** The six fields the mapping cannot express (D-DEM-3; DEM-PRODUCER-reserved
 * placeholders + the reserved two-lane liquiditySwept). */
export type FroggyResidualInput = Pick<
  FroggyTrendPullbackInput,
  | "weeklyBias"
  | "dailyBias"
  | "haFlatBackConfirmed"
  | "brokeEmaWithBody"
  | "rrMultiplePlanned"
  | "liquiditySwept"
>;

/** The four targets the registered froggy mapping declares (D-DEM-3(4)). */
const EXPRESSIBLE_TARGETS = [
  "distanceFromDailyEmaPct",
  "pulledBackIntoSweetSpot",
  "triggerPatternQuality",
  "atrRegime",
] as const;

type ExpressibleTarget = (typeof EXPRESSIBLE_TARGETS)[number];

/**
 * Build the residual half by running the untouched legacy adapter and picking
 * the six unexpressible fields from its output. The expressible outputs are
 * discarded (see the module header for the D-DEM-2(6) defense).
 */
export function buildFroggyResidualInput(
  enriched: FroggyEnrichedView
): FroggyResidualInput {
  const full = buildFroggyTrendPullbackInputFromEnriched(enriched);
  return {
    weeklyBias: full.weeklyBias,
    dailyBias: full.dailyBias,
    haFlatBackConfirmed: full.haFlatBackConfirmed,
    brokeEmaWithBody: full.brokeEmaWithBody,
    rrMultiplePlanned: full.rrMultiplePlanned,
    liquiditySwept: full.liquiditySwept,
  };
}

/**
 * Compose the scorer input from an interpreted mapping fragment plus the
 * residual half. Fail-closed (D-DEM-5(2)): the fragment must carry EXACTLY
 * the four declared targets with the declared types — anything else throws;
 * no defaulted, partial, or fabricated input ever reaches the scorer.
 */
export function composeFroggyTrendPullbackInput(
  fragment: EnrichmentMappingResult["fragment"],
  residual: FroggyResidualInput
): FroggyTrendPullbackInput {
  const keys = Object.keys(fragment).sort();
  const expected = [...EXPRESSIBLE_TARGETS].sort();
  if (
    keys.length !== expected.length ||
    !expected.every((k, i) => keys[i] === k)
  ) {
    throw new Error(
      `composeFroggyTrendPullbackInput: fragment must carry exactly ` +
        `[${expected.join(", ")}], got [${keys.join(", ")}] — refusing to ` +
        `compose (fail-closed, D-DEM-5(2)).`
    );
  }
  const distanceFromDailyEmaPct = fragment["distanceFromDailyEmaPct" satisfies ExpressibleTarget];
  const pulledBackIntoSweetSpot = fragment["pulledBackIntoSweetSpot" satisfies ExpressibleTarget];
  const triggerPatternQuality = fragment["triggerPatternQuality" satisfies ExpressibleTarget];
  const atrRegime = fragment["atrRegime" satisfies ExpressibleTarget];
  if (typeof distanceFromDailyEmaPct !== "number") {
    throw new Error(
      `composeFroggyTrendPullbackInput: distanceFromDailyEmaPct must be a number, got ${typeof distanceFromDailyEmaPct} — refusing (D-DEM-5(2)).`
    );
  }
  if (typeof pulledBackIntoSweetSpot !== "boolean") {
    throw new Error(
      `composeFroggyTrendPullbackInput: pulledBackIntoSweetSpot must be a boolean, got ${typeof pulledBackIntoSweetSpot} — refusing (D-DEM-5(2)).`
    );
  }
  if (
    triggerPatternQuality !== 0 &&
    triggerPatternQuality !== 1 &&
    triggerPatternQuality !== 2 &&
    triggerPatternQuality !== 3
  ) {
    throw new Error(
      `composeFroggyTrendPullbackInput: triggerPatternQuality must be 0|1|2|3 (the D-EQ-2 grade set), got ${String(triggerPatternQuality)} — refusing (D-DEM-5(2)).`
    );
  }
  if (typeof atrRegime !== "string") {
    throw new Error(
      `composeFroggyTrendPullbackInput: atrRegime must be a string, got ${typeof atrRegime} — refusing (D-DEM-5(2)).`
    );
  }
  return {
    ...residual,
    distanceFromDailyEmaPct,
    pulledBackIntoSweetSpot,
    triggerPatternQuality,
    atrRegime: atrRegime as FroggyTrendPullbackInput["atrRegime"],
  };
}
