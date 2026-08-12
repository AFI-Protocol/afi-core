/**
 * PR-UWR-RUNTIME-LOADER: pure loader/validator for the registered UWR profile.
 *
 * Authorized by afi-governance `decisions/uwr-runtime-consumption-v0.1.md`
 * (§7 row PR-UWR-RUNTIME-LOADER, flipped by owner merge of afi-governance
 * PR #11 per RC-12). Scope per RC-2/RC-5: validate a passed-in,
 * already-parsed registry document and map it onto
 * {@link UniversalWeightingRuleConfig}. PURE by decision: no `fs`, no path
 * resolution, no afi-config dependency — the caller supplies the parsed
 * document. Nothing here reads the registry at runtime; the composition-root
 * read is separately authorized (PR-UWR-RUNTIME-READ, RC-3/RC-4), and
 * `defaultUwrConfig` remains the compile-time fallback of last resort (RC-8,
 * as demoted by CFG-GOV D-CFG-4(2)).
 *
 * CFG-GOV D-CFG-4(1) retired RC-5's identity predicate: a validated registry
 * document's own weight values now flow into the returned config. This loader
 * no longer compares anything to `defaultUwrConfig`.
 */

import { type UniversalWeightingRuleConfig } from "./UniversalWeightingRule.js";

/** Document-format id accepted by this loader (RC-2 "schema id"). */
export const UWR_PROFILE_SCHEMA_ID = "afi.uwr-profile.v0";

/**
 * The first registered profile id. **No longer a loader gate** — recognition is
 * registration-driven (CFG-GOV D-CFG-4(3)); the loader checks the document
 * against the id the caller's registration named. Retained as a
 * documentation/fixture constant.
 */
export const PINNED_UWR_PROFILE_ID = "uwr-weighted-lifts-v0.1";

/** Axis registry, order significant (UP-4; RC-5 condition 2). */
export const PINNED_UWR_AXES = Object.freeze([
  "structure",
  "execution",
  "risk",
  "insight"
] as const);

type WeightKey = Exclude<keyof UniversalWeightingRuleConfig, "id">;

/**
 * The weight keys a profile document must carry (RC-2 "weight shape"),
 * derived from the pinned axes so the `axis → ${axis}Weight` correspondence
 * is structural, and compile-checked against
 * {@link UniversalWeightingRuleConfig} so a config-field rename cannot
 * silently diverge from this list.
 */
const WEIGHT_KEYS: readonly WeightKey[] = Object.freeze(
  PINNED_UWR_AXES.map((axis): WeightKey => `${axis}Weight`)
);

/**
 * Machine-checkable refusal reasons. Each maps to a violated condition of the
 * RC-5 identity predicate (which RC-4 defines as the fail-closed mismatch
 * trigger) or to a document-shape precondition of evaluating it.
 */
export type UwrProfileLoadErrorReason =
  | "not-an-object"
  | "schema-mismatch"
  | "profile-id-mismatch"
  | "supersedes-mismatch"
  | "axes-mismatch"
  | "weights-shape-mismatch";

/** Refusal error thrown by {@link loadUwrProfile}; never swallowed here. */
export class UwrProfileLoadError extends Error {
  readonly reason: UwrProfileLoadErrorReason;

  constructor(reason: UwrProfileLoadErrorReason, detail: string) {
    super(`UWR profile load refused (${reason}): ${detail}`);
    this.name = "UwrProfileLoadError";
    this.reason = reason;
  }
}

function fail(reason: UwrProfileLoadErrorReason, detail: string): never {
  throw new UwrProfileLoadError(reason, detail);
}

/**
 * Read an OWN property exactly once. Inherited (prototype-supplied) values
 * must never satisfy the predicate, and accessor-backed documents must not
 * get a second read after validation — every field below is read once into a
 * local and only the local is used.
 */
function ownValue(record: Record<string, unknown>, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(record, key)
    ? record[key]
    : undefined;
}

/**
 * Validate a parsed UWR profile registry document and map it onto
 * {@link UniversalWeightingRuleConfig}.
 *
 * Validates the document and maps it, per CFG-GOV D-CFG-4(1):
 * 1. the four weights are present, exactly keyed, and finite — their VALUES
 *    are the document's own and flow into the result (RC-5's per-axis value
 *    equality is retired);
 * 2. the axes array equals the pinned registry in content and order (UP-4,
 *    unchanged by D-CFG-4(7));
 * 3. `profileId` equals the id the caller's registration named (D-CFG-4(3));
 *    `supersedes`, when present, must be a string — its value equality is
 *    retired with the rest of the predicate;
 * 4. validation fails closed on a malformed, mis-identified, or schema-invalid
 *    document (RC-4, retained in full by D-CFG-4(1)). There is no fallback.
 *
 * Fields this loader does not consume (engine, outputSurface, decaySurface,
 * qualification, scorerIdentity, katRefs, doctrineRefs, …) are ignored, not
 * validated: full document validation is owned by the afi-config schema and
 * its CI pin guards.
 *
 * @param profileJson - Already-parsed registry document (caller does the I/O)
 * @param expectedProfileId - The profile id the resolving registration named
 * @returns Frozen config whose weight values are the DOCUMENT's own validated
 *          numbers and whose `id` is the document's `profileId`. Nothing is
 *          spread from `defaultUwrConfig`. Stamp semantics remain governed by
 *          RC-6 as extended by D-CFG-4(5).
 * @throws UwrProfileLoadError on any shape or predicate violation
 */
export function loadUwrProfile(
  profileJson: unknown,
  expectedProfileId: string
): Readonly<UniversalWeightingRuleConfig> {
  if (
    typeof profileJson !== "object" ||
    profileJson === null ||
    Array.isArray(profileJson)
  ) {
    fail("not-an-object", `expected a plain object, got ${describe(profileJson)}`);
  }
  const doc = profileJson as Record<string, unknown>;

  const schema = ownValue(doc, "schema");
  if (schema !== UWR_PROFILE_SCHEMA_ID) {
    fail(
      "schema-mismatch",
      `expected schema "${UWR_PROFILE_SCHEMA_ID}", got ${describe(schema)}`
    );
  }

  // D-CFG-4(3): the document must be the profile the registration named.
  // Recognition is registration-driven; refusal stays fail-closed (RC-4).
  const profileId = ownValue(doc, "profileId");
  if (typeof profileId !== "string" || profileId !== expectedProfileId) {
    fail(
      "profile-id-mismatch",
      `expected profileId "${expectedProfileId}", got ${describe(profileId)}`
    );
  }

  // D-CFG-4(1): RC-5 condition 3's value equality is retired with the rest of
  // the identity predicate. Shape is still enforced (a non-string supersedes is
  // a malformed document, RC-4).
  const supersedes = ownValue(doc, "supersedes");
  if (supersedes !== undefined && typeof supersedes !== "string") {
    fail(
      "supersedes-mismatch",
      `supersedes must be a string when present, got ${describe(supersedes)}`
    );
  }

  // RC-5 condition 2: axis registry equal in content and order.
  const axes = ownValue(doc, "axes");
  if (
    !Array.isArray(axes) ||
    axes.length !== PINNED_UWR_AXES.length ||
    !PINNED_UWR_AXES.every((name, i) => axes[i] === name)
  ) {
    fail(
      "axes-mismatch",
      `expected axes [${PINNED_UWR_AXES.join(", ")}] in order, got ${describe(axes)}`
    );
  }

  // RC-2 weight shape: exactly the four pinned keys as own enumerable
  // properties, each read once. D-CFG-4(1): the per-key value equality of
  // RC-5 condition 1 is retired — shape and finiteness are the only gates.
  const weights = ownValue(doc, "weights");
  if (typeof weights !== "object" || weights === null || Array.isArray(weights)) {
    fail("weights-shape-mismatch", `expected a weights object, got ${describe(weights)}`);
  }
  const weightRecord = weights as Record<string, unknown>;
  const presentKeys = Object.keys(weightRecord);
  if (
    presentKeys.length !== WEIGHT_KEYS.length ||
    !WEIGHT_KEYS.every((key) => presentKeys.includes(key))
  ) {
    fail(
      "weights-shape-mismatch",
      `expected exactly keys [${WEIGHT_KEYS.join(", ")}], got [${presentKeys.join(", ")}]`
    );
  }
  const resolvedWeights: Record<string, number> = {};
  for (const key of WEIGHT_KEYS) {
    const value = weightRecord[key];
    if (typeof value !== "number" || !Number.isFinite(value)) {
      fail("weights-shape-mismatch", `${key} must be a finite number, got ${describe(value)}`);
    }
    resolvedWeights[key] = value as number;
  }

  // D-CFG-4(1): the identity predicate is retired. The returned config carries
  // the DOCUMENT's validated weights and the DOCUMENT's profileId — nothing is
  // spread from defaultUwrConfig. Validation above is the only gate, and it
  // fails closed (RC-4): a malformed, mis-identified, or schema-invalid
  // document yields a throw, never a defaulted config.
  return Object.freeze({
    id: profileId,
    structureWeight: resolvedWeights.structureWeight,
    executionWeight: resolvedWeights.executionWeight,
    riskWeight: resolvedWeights.riskWeight,
    insightWeight: resolvedWeights.insightWeight,
  });
}

/** Compact value description for refusal messages (never throws). */
function describe(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return `array(${value.length})`;
  if (typeof value === "string") return `"${value}"`;
  return `${typeof value}${typeof value === "number" ? ` ${String(value)}` : ""}`;
}
