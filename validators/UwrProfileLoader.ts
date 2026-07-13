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
 * `defaultUwrConfig` remains the live config unchanged (RC-8).
 */

import {
  defaultUwrConfig,
  type UniversalWeightingRuleConfig
} from "./UniversalWeightingRule.js";

/** Document-format id accepted by this loader (RC-2 "schema id"). */
export const UWR_PROFILE_SCHEMA_ID = "afi.uwr-profile.v0";

/**
 * The single registrable profile id (UP-2/UP-10 pin; RC-5 condition 3).
 * Any other id — including `defaultUwrConfig.id` itself — is refused.
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
  | "weights-shape-mismatch"
  | "weight-value-mismatch";

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
 * Enforces the RC-5 identity predicate against {@link defaultUwrConfig}:
 * 1. the four weights equal `defaultUwrConfig`'s per axis;
 * 2. the axes array equals the pinned registry in content and order;
 * 3. `profileId` equals the pinned `uwr-weighted-lifts-v0.1` AND
 *    `supersedes` equals `defaultUwrConfig.id`;
 * 4. id fields are deliberately NOT compared for direct equality — the ids
 *    differ by design (supersession, not equality, is the pinned relation).
 *
 * Fields this loader does not consume (engine, outputSurface, decaySurface,
 * qualification, scorerIdentity, katRefs, doctrineRefs, …) are ignored, not
 * validated: full document validation is owned by the afi-config schema and
 * its CI pin guards.
 *
 * @param profileJson - Already-parsed registry document (caller does the I/O)
 * @returns Frozen config whose weight values are `defaultUwrConfig`'s own
 *          (identity by construction — the predicate proved the document's
 *          values equal them, so registry-supplied numbers never flow into
 *          the result) and whose `id` is the registered profile id. The `id`
 *          records which governed profile the values were validated against;
 *          it does NOT signal that any registry was read at runtime — stamp
 *          and consumption semantics remain governed by RC-6/RC-8.
 * @throws UwrProfileLoadError on any shape or predicate violation
 */
export function loadUwrProfile(
  profileJson: unknown
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

  // RC-5 condition 3 (first half): only the pinned profile id is loadable.
  const profileId = ownValue(doc, "profileId");
  if (profileId !== PINNED_UWR_PROFILE_ID) {
    fail(
      "profile-id-mismatch",
      `expected profileId "${PINNED_UWR_PROFILE_ID}", got ${describe(profileId)}`
    );
  }

  // RC-5 condition 3 (second half): supersession is checked as data.
  const supersedes = ownValue(doc, "supersedes");
  if (supersedes !== defaultUwrConfig.id) {
    fail(
      "supersedes-mismatch",
      `expected supersedes "${defaultUwrConfig.id}", got ${describe(supersedes)}`
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
  // properties, each read once; RC-5 condition 1: each value strictly equal
  // to defaultUwrConfig's.
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
  for (const key of WEIGHT_KEYS) {
    const value = weightRecord[key];
    if (typeof value !== "number" || !Number.isFinite(value)) {
      fail("weights-shape-mismatch", `${key} must be a finite number, got ${describe(value)}`);
    }
    if (value !== defaultUwrConfig[key]) {
      fail(
        "weight-value-mismatch",
        `${key} must equal defaultUwrConfig.${key} (${defaultUwrConfig[key]}), got ${String(value)}`
      );
    }
  }

  // RC-5 condition 4 is enforced by omission: no profileId === defaultUwrConfig.id
  // comparison exists anywhere above.
  //
  // Identity by construction: the predicate just proved the document's weight
  // values equal defaultUwrConfig's, so the returned config spreads
  // defaultUwrConfig itself — emitting registry-supplied numbers is
  // structurally impossible, whatever future edits do to the checks above.
  return Object.freeze({ ...defaultUwrConfig, id: PINNED_UWR_PROFILE_ID });
}

/** Compact value description for refusal messages (never throws). */
function describe(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return `array(${value.length})`;
  if (typeof value === "string") return `"${value}"`;
  return `${typeof value}${typeof value === "number" ? ` ${String(value)}` : ""}`;
}
