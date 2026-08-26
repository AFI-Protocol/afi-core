/**
 * DEM-BIND: the residual (unexpressible) input builder + the composer that
 * assembles the froggy scorer input from an interpreted mapping fragment plus
 * the residual half (DEM-GOV D-DEM-2(6)(7); §9 slot DEM-BIND, owner-authorized
 * 2026-08-22). Generalized by DEM-PRODUCER-PLAN (owner-authorized 2026-08-25).
 *
 * WHY THIS MODULE EXISTS, AND WHY THE ADAPTER IS NOT DELETED:
 * `froggy.enrichment_adapter.ts` survives as the test-side oracle the FLPR-GOV
 * inertness guards import, and as the callee that still computes the
 * placeholders whose producers have not landed yet. The residual builder CALLS
 * it and picks ONLY the fields the registered mapping cannot express (D-DEM-3):
 * the placeholders still awaiting their producer slots (CANDLE: brokeEmaWithBody
 * + haFlatBackConfirmed; HTF: weeklyBias + dailyBias) plus liquiditySwept (a
 * two-lane read, inexpressible by construction — D-DEM-3(5), reserved).
 * rrMultiplePlanned left the residual with DEM-PRODUCER-PLAN: it is a
 * provider fact the technical lane produces and the mapping binds.
 *
 * On the live mapping path the adapter's expressible computation still
 * executes here and its expressible outputs are DISCARDED — only the
 * interpreter fragment is authoritative (D-DEM-2(6): "no code-path fallback
 * to the retired bespoke code" — a discarded value is not a fallback; where a
 * determination exists the fragment is unconditionally authoritative, and an
 * interpreter refusal means no determination at all, D-DEM-5(7)).
 *
 * THE COMPOSER IS MAPPING-VERSION-AGNOSTIC AND FAIL-CLOSED (D-DEM-5(2)): the
 * fragment (whatever the registered mapping version binds) and the residual
 * (whatever is still unexpressible) must partition the scorer input's field set
 * EXACTLY — no field missing, none supplied twice — and every value must lie in
 * its field's declared domain. Anything else refuses: no defaulted, partial, or
 * fabricated input ever reaches the scorer. The domain table below is
 * predicate-valued on purpose: no scorer-input field is ever assigned a
 * literal in this module (DEM-PLACEHOLDER-GUARD bound).
 */

import type { FroggyEnrichedView } from "./froggy.enrichment_adapter.js";
import { buildFroggyTrendPullbackInputFromEnriched } from "./froggy.enrichment_adapter.js";
import type { FroggyTrendPullbackInput } from "./froggy.trend_pullback_v1.js";
import type { EnrichmentMappingResult } from "../validators/EnrichmentMappingInterpreter.js";

/** The fields the mapping cannot express yet (D-DEM-3): the placeholders
 * awaiting DEM-PRODUCER-CANDLE / DEM-PRODUCER-HTF + the reserved liquiditySwept. */
export type FroggyResidualInput = Pick<
  FroggyTrendPullbackInput,
  "weeklyBias" | "dailyBias" | "haFlatBackConfirmed" | "brokeEmaWithBody" | "liquiditySwept"
>;

type FroggyInputField = keyof FroggyTrendPullbackInput;

/** The scorer input's complete field set — the partition the composer enforces. */
export const FROGGY_INPUT_FIELDS: readonly FroggyInputField[] = Object.freeze([
  "weeklyBias",
  "dailyBias",
  "haFlatBackConfirmed",
  "distanceFromDailyEmaPct",
  "pulledBackIntoSweetSpot",
  "brokeEmaWithBody",
  "liquiditySwept",
  "triggerPatternQuality",
  "atrRegime",
  "rrMultiplePlanned",
] as const);

type DomainPredicate = (value: unknown) => boolean;

function isBoolean(value: unknown): boolean {
  return typeof value === "boolean";
}
function isFiniteNumber(value: unknown): boolean {
  return typeof value === "number" && Number.isFinite(value);
}
function isBias(value: unknown): boolean {
  return value === "long" || value === "short" || value === "neutral";
}
function isGrade(value: unknown): boolean {
  return value === 0 || value === 1 || value === 2 || value === 3;
}
function isAtrRegime(value: unknown): boolean {
  return value === "low" || value === "normal" || value === "high" || value === "extreme";
}

/** Per-field declared domain (the rubric's input contract, froggy.trend_pullback_v1.ts:21-35). */
const FIELD_DOMAIN: Readonly<Record<FroggyInputField, { describe: string; test: DomainPredicate }>> =
  Object.freeze({
    weeklyBias: { describe: "long|short|neutral", test: isBias },
    dailyBias: { describe: "long|short|neutral", test: isBias },
    haFlatBackConfirmed: { describe: "boolean", test: isBoolean },
    distanceFromDailyEmaPct: { describe: "finite number", test: isFiniteNumber },
    pulledBackIntoSweetSpot: { describe: "boolean", test: isBoolean },
    brokeEmaWithBody: { describe: "boolean", test: isBoolean },
    liquiditySwept: { describe: "boolean", test: isBoolean },
    triggerPatternQuality: { describe: "0|1|2|3 (the D-EQ-2 grade set)", test: isGrade },
    atrRegime: { describe: "low|normal|high|extreme", test: isAtrRegime },
    rrMultiplePlanned: { describe: "finite number", test: isFiniteNumber },
  });

/**
 * Build the residual half by running the untouched legacy adapter and picking
 * the still-unexpressible fields from its output. The expressible outputs are
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
    liquiditySwept: full.liquiditySwept,
  };
}

function refuse(detail: string): never {
  throw new Error(
    `composeFroggyTrendPullbackInput: ${detail} — refusing to compose (fail-closed, D-DEM-5(2)).`
  );
}

/**
 * Compose the scorer input from an interpreted mapping fragment plus the
 * residual half. Fail-closed (D-DEM-5(2)): fragment and residual must
 * partition the scorer input's field set exactly, and every value must lie
 * in its declared domain — anything else throws; no defaulted, partial, or
 * fabricated input ever reaches the scorer.
 */
export function composeFroggyTrendPullbackInput(
  fragment: EnrichmentMappingResult["fragment"],
  residual: FroggyResidualInput
): FroggyTrendPullbackInput {
  const fragmentKeys = Object.keys(fragment);
  const residualKeys = Object.keys(residual);
  const expected = [...FROGGY_INPUT_FIELDS].sort();

  const overlap = fragmentKeys.filter((k) => residualKeys.includes(k));
  if (overlap.length > 0) {
    refuse(`fragment and residual both supply [${overlap.sort().join(", ")}]`);
  }
  const union = [...fragmentKeys, ...residualKeys].sort();
  if (union.length !== expected.length || !expected.every((k, i) => union[i] === k)) {
    const missing = expected.filter((k) => !union.includes(k));
    const extra = union.filter((k) => !(expected as string[]).includes(k));
    refuse(
      `fragment ∪ residual must carry exactly [${expected.join(", ")}]; ` +
        `missing [${missing.join(", ")}], extra [${extra.join(", ")}]`
    );
  }

  const assembled: Record<string, unknown> = {};
  for (const field of FROGGY_INPUT_FIELDS) {
    const fromFragment = Object.prototype.hasOwnProperty.call(fragment, field);
    const value = fromFragment
      ? (fragment as Record<string, unknown>)[field]
      : (residual as Record<string, unknown>)[field];
    const domain = FIELD_DOMAIN[field];
    if (!domain.test(value)) {
      refuse(
        `${field} must be ${domain.describe}, got ${describeValue(value)} ` +
          `(${fromFragment ? "mapping fragment" : "residual"})`
      );
    }
    assembled[field] = value;
  }
  return assembled as unknown as FroggyTrendPullbackInput;
}

function describeValue(value: unknown): string {
  if (typeof value === "string") return `string ${JSON.stringify(value)}`;
  if (typeof value === "number") return `number ${String(value)}`;
  return typeof value;
}
