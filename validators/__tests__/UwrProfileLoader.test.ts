/**
 * PR-UWR-RUNTIME-LOADER: unit tests for the pure `loadUwrProfile`
 * validator/mapper (afi-governance decisions/uwr-runtime-consumption-v0.1.md,
 * RC-2/RC-5; §7 row flipped via afi-governance PR #11).
 *
 * The primary fixture is an inline object literal mirroring
 * afi-config `registries/uwr-profiles/uwr-weighted-lifts-v0.1.json`
 * @ merge fe329164919f0c1c9dc24bb5c279978fb680e983 — the unit tests perform
 * no I/O, matching the loader's own purity. One dev-only integration test
 * additionally reads the sibling afi-config checkout when present (skipped
 * otherwise), following the established pattern of
 * ./computeUwrScore.kat.test.ts.
 *
 * Scope: loading ≠ wiring — nothing here consumes the registry at runtime,
 * `defaultUwrConfig` is unchanged, and no reward, mint, or validator-scoring
 * path is touched. The runtime read is separately authorized
 * (PR-UWR-RUNTIME-READ).
 */

import { existsSync, readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import {
  loadUwrProfile,
  UwrProfileLoadError,
  PINNED_UWR_PROFILE_ID,
  PINNED_UWR_AXES,
  UWR_PROFILE_SCHEMA_ID,
  type UwrProfileLoadErrorReason
} from "../UwrProfileLoader.js";
import {
  computeUwrScore,
  defaultUwrConfig,
  type UwrAxesInput
} from "../UniversalWeightingRule.js";

/** Sibling afi-config checkout (dev machines only; CI has no sibling). */
const SIBLING_REGISTRY_URL = new URL(
  "../../../afi-config/registries/uwr-profiles/uwr-weighted-lifts-v0.1.json",
  import.meta.url
);

/**
 * Inline mirror of the registered profile document (fields the loader
 * consumes are exact; consumed-irrelevant blocks are carried to prove they
 * are ignored, abbreviated where their content cannot matter).
 */
function validRegistryDocument(): Record<string, unknown> {
  return {
    schema: "afi.uwr-profile.v0",
    "x-afiStatus": "draft-non-implementation",
    profileId: "uwr-weighted-lifts-v0.1",
    humanAlias: "Testnet Scoring Profile v0",
    status: "testnet-provisional",
    supersedes: "uwr-default-stub",
    engine: {
      function: "computeUwrScore",
      model: "normalized-weighted-average-of-clamped-axes",
      sourceModule: "afi-core/validators/UniversalWeightingRule.ts"
    },
    axes: ["structure", "execution", "risk", "insight"],
    weights: {
      structureWeight: 0.25,
      executionWeight: 0.25,
      riskWeight: 0.25,
      insightWeight: 0.25
    },
    outputSurface: {
      uwrScoreRange: { min: 0, max: 1 },
      riskBucketTaxonomy: ["low", "medium", "high", "extreme"],
      convictionRange: { min: 0, max: 1 }
    },
    qualification: {
      minDecayScoreThreshold: 0.5,
      challengeWindowDurationHours: 24,
      rule: "decayedScore >= minDecayScoreThreshold"
    },
    scorerIdentity: {
      analystId: "froggy",
      strategyId: "trend_pullback_v1",
      invokedAs: "scoreFroggyTrendPullbackFromEnriched"
    },
    katRefs: {
      computeUwrScore: "kats/uwr-profile/v0/compute-uwr-score.kat.json",
      applyTimeDecay: "kats/uwr-profile/v0/apply-time-decay.kat.json"
    },
    doctrineRefs: [
      "afi-governance/decisions/uwr-profile-pin-v0.1.md",
      "afi-governance/decisions/math-authority-v0.1.md",
      "afi-governance/decisions/mint-formula-bt-86b-alignment-v0.1.md"
    ]
  };
}

function expectRefusal(
  document: unknown,
  reason: UwrProfileLoadErrorReason,
  expectedProfileId: string = PINNED_UWR_PROFILE_ID
): void {
  let caught: unknown;
  try {
    loadUwrProfile(document, expectedProfileId);
  } catch (error) {
    caught = error;
  }
  expect(caught, `expected a ${reason} refusal`).toBeInstanceOf(
    UwrProfileLoadError
  );
  expect((caught as UwrProfileLoadError).reason).toBe(reason);
}

describe("PR-UWR-RUNTIME-LOADER: loadUwrProfile happy path", () => {
  it("maps the registered document onto UniversalWeightingRuleConfig", () => {
    const config = loadUwrProfile(validRegistryDocument(), PINNED_UWR_PROFILE_ID);
    expect(config).toEqual({
      id: "uwr-weighted-lifts-v0.1",
      structureWeight: 0.25,
      executionWeight: 0.25,
      riskWeight: 0.25,
      insightWeight: 0.25
    });
  });

  it("returns a frozen config and does not mutate the input", () => {
    const document = validRegistryDocument();
    const snapshot = structuredClone(document);
    const config = loadUwrProfile(document, PINNED_UWR_PROFILE_ID);
    expect(Object.isFrozen(config)).toBe(true);
    expect(document).toEqual(snapshot);
  });

  it("exposes the pinned constants it validates against", () => {
    expect(PINNED_UWR_PROFILE_ID).toBe("uwr-weighted-lifts-v0.1");
    expect(UWR_PROFILE_SCHEMA_ID).toBe("afi.uwr-profile.v0");
    expect([...PINNED_UWR_AXES]).toEqual([
      "structure",
      "execution",
      "risk",
      "insight"
    ]);
  });
});

describe("CFG-GOV D-CFG-4(1): registry values flow into the config", () => {
  it("the document's own weight values are what the loader returns", () => {
    const document = validRegistryDocument();
    document.weights = {
      structureWeight: 0.4,
      executionWeight: 0.3,
      riskWeight: 0.2,
      insightWeight: 0.1
    };
    const config = loadUwrProfile(document, PINNED_UWR_PROFILE_ID);
    expect(config.structureWeight).toBe(0.4);
    expect(config.executionWeight).toBe(0.3);
    expect(config.riskWeight).toBe(0.2);
    expect(config.insightWeight).toBe(0.1);
    // The retired predicate would have refused this document outright.
  });

  it("weights that differ from defaultUwrConfig are accepted, not refused", () => {
    const drifted = validRegistryDocument();
    drifted.weights = {
      structureWeight: 0.2499,
      executionWeight: 0.25,
      riskWeight: 0.25,
      insightWeight: 0.2501
    };
    const config = loadUwrProfile(drifted, PINNED_UWR_PROFILE_ID);
    expect(config.structureWeight).toBe(0.2499);
    expect(config.insightWeight).toBe(0.2501);
    expect(config.structureWeight).not.toBe(defaultUwrConfig.structureWeight);
  });

  it("the returned id is the document's own profileId", () => {
    const document = validRegistryDocument();
    const config = loadUwrProfile(document, PINNED_UWR_PROFILE_ID);
    expect(config.id).toBe(document.profileId);
  });

  it("a document whose profileId is not the one the registration named is refused", () => {
    const document = validRegistryDocument();
    document.profileId = "uwr-default-stub";
    expectRefusal(document, "profile-id-mismatch");
  });

  it("recognition is registration-driven: the same document refuses under a different expected id", () => {
    expectRefusal(validRegistryDocument(), "profile-id-mismatch", "uwr-some-other-profile-v1");
  });

  it("CFG-WEIGHTS GATE: the 0.25x4 registered profile still yields the 0.1875 UP-5 anchor", () => {
    // The gate for this slot. uwr-weighted-lifts-v0.1 registers 0.25 on every
    // axis, so routing froggy through the registry is numerically identical to
    // the compile-time defaults. RC-10 makes anchor stability an acceptance
    // criterion for every program PR.
    const config = loadUwrProfile(validRegistryDocument(), PINNED_UWR_PROFILE_ID);
    const vectors: UwrAxesInput[] = [
      // D2 M2 golden anchor axes (UP-5): expected uwrScore 0.1875.
      { structureAxis: 0.15, executionAxis: 0, riskAxis: 0.2, insightAxis: 0.4 },
      { structureAxis: 0.5, executionAxis: 0.5, riskAxis: 0.5, insightAxis: 0.5 },
      { structureAxis: 1, executionAxis: 1, riskAxis: 1, insightAxis: 1 },
      { structureAxis: 0, executionAxis: 0, riskAxis: 0, insightAxis: 0 },
      { structureAxis: 0.8, executionAxis: 0.7, riskAxis: 0.9, insightAxis: 0.9 }
    ];
    for (const axes of vectors) {
      expect(
        Object.is(computeUwrScore(axes, config), computeUwrScore(axes, defaultUwrConfig))
      ).toBe(true);
    }
    expect(
      computeUwrScore(
        { structureAxis: 0.15, executionAxis: 0, riskAxis: 0.2, insightAxis: 0.4 },
        config
      )
    ).toBe(0.1875);
  });
});

describe("PR-UWR-RUNTIME-LOADER: shape refusals", () => {
  it("refuses non-object inputs", () => {
    expectRefusal(null, "not-an-object");
    expectRefusal(undefined, "not-an-object");
    expectRefusal("uwr-weighted-lifts-v0.1", "not-an-object");
    expectRefusal(0.25, "not-an-object");
    expectRefusal([validRegistryDocument()], "not-an-object");
  });

  it("refuses a wrong or missing schema id", () => {
    const wrongSchema = validRegistryDocument();
    wrongSchema.schema = "afi.uwr-profile.v1";
    expectRefusal(wrongSchema, "schema-mismatch");

    const missingSchema = validRegistryDocument();
    delete missingSchema.schema;
    expectRefusal(missingSchema, "schema-mismatch");
  });

  it("refuses a wrong, missing, or alias-as-id profileId", () => {
    const wrongId = validRegistryDocument();
    wrongId.profileId = "uwr-weighted-lifts-v0.2";
    expectRefusal(wrongId, "profile-id-mismatch");

    const aliasAsId = validRegistryDocument();
    aliasAsId.profileId = "Testnet Scoring Profile v0";
    expectRefusal(aliasAsId, "profile-id-mismatch");

    const missingId = validRegistryDocument();
    delete missingId.profileId;
    expectRefusal(missingId, "profile-id-mismatch");
  });

  it("accepts any string supersedes, and its absence, but refuses a non-string", () => {
    // D-CFG-4(1): RC-5 condition 3's second half is retired with the rest of
    // the identity predicate. Shape survives; value equality does not.
    const otherSupersedes = validRegistryDocument();
    otherSupersedes.supersedes = "uwr-default-stub-v2";
    expect(loadUwrProfile(otherSupersedes, PINNED_UWR_PROFILE_ID).id).toBe(
      PINNED_UWR_PROFILE_ID
    );

    const missingSupersedes = validRegistryDocument();
    delete missingSupersedes.supersedes;
    expect(loadUwrProfile(missingSupersedes, PINNED_UWR_PROFILE_ID).id).toBe(
      PINNED_UWR_PROFILE_ID
    );

    const nonString = validRegistryDocument();
    nonString.supersedes = 42;
    expectRefusal(nonString, "supersedes-mismatch");
  });

  it("refuses axes drift: reorder, drop, extend, rename, non-array", () => {
    const reordered = validRegistryDocument();
    reordered.axes = ["execution", "structure", "risk", "insight"];
    expectRefusal(reordered, "axes-mismatch");

    const dropped = validRegistryDocument();
    dropped.axes = ["structure", "execution", "risk"];
    expectRefusal(dropped, "axes-mismatch");

    const extended = validRegistryDocument();
    extended.axes = ["structure", "execution", "risk", "insight", "novelty"];
    expectRefusal(extended, "axes-mismatch");

    // Gateway-drift axis names (recorded non-conformant per UP-4).
    const renamed = validRegistryDocument();
    renamed.axes = ["utility", "workQuality", "rarity", "insight"];
    expectRefusal(renamed, "axes-mismatch");

    const nonArray = validRegistryDocument();
    nonArray.axes = "structure,execution,risk,insight";
    expectRefusal(nonArray, "axes-mismatch");
  });

  it("refuses weights shape violations: missing, extra, non-numeric, NaN", () => {
    const missingKey = validRegistryDocument();
    missingKey.weights = {
      structureWeight: 0.25,
      executionWeight: 0.25,
      riskWeight: 0.25
    };
    expectRefusal(missingKey, "weights-shape-mismatch");

    const extraKey = validRegistryDocument();
    extraKey.weights = {
      structureWeight: 0.25,
      executionWeight: 0.25,
      riskWeight: 0.25,
      insightWeight: 0.25,
      noveltyWeight: 0
    };
    expectRefusal(extraKey, "weights-shape-mismatch");

    const stringWeight = validRegistryDocument();
    stringWeight.weights = {
      structureWeight: "0.25",
      executionWeight: 0.25,
      riskWeight: 0.25,
      insightWeight: 0.25
    };
    expectRefusal(stringWeight, "weights-shape-mismatch");

    const nanWeight = validRegistryDocument();
    nanWeight.weights = {
      structureWeight: Number.NaN,
      executionWeight: 0.25,
      riskWeight: 0.25,
      insightWeight: 0.25
    };
    expectRefusal(nanWeight, "weights-shape-mismatch");

    const nonObject = validRegistryDocument();
    nonObject.weights = [0.25, 0.25, 0.25, 0.25];
    expectRefusal(nonObject, "weights-shape-mismatch");
  });

  it("ignores fields the loader does not consume", () => {
    const document = validRegistryDocument();
    document.decaySurface = { family: "GreeksDecayTemplate", version: "v1" };
    document["x-futureField"] = { anything: true };
    expect(loadUwrProfile(document, PINNED_UWR_PROFILE_ID).id).toBe("uwr-weighted-lifts-v0.1");
  });
});

describe("PR-UWR-RUNTIME-LOADER: hostile-input hardening (fail-closed)", () => {
  it("reads each weight exactly once, so accessor-backed values cannot change after validation", () => {
    let reads = 0;
    const document = validRegistryDocument();
    document.weights = {
      get structureWeight() {
        reads += 1;
        return reads === 1 ? 0.25 : 9;
      },
      executionWeight: 0.25,
      riskWeight: 0.25,
      insightWeight: 0.25
    };
    const config = loadUwrProfile(document, PINNED_UWR_PROFILE_ID);
    expect(reads).toBe(1);
    expect(Object.is(config.structureWeight, 0.25)).toBe(true);
  });

  it("an accessor's single read is the value that flows (D-CFG-4(1))", () => {
    const document = validRegistryDocument();
    document.weights = {
      get structureWeight() {
        return 9;
      },
      executionWeight: 0.25,
      riskWeight: 0.25,
      insightWeight: 0.25
    };
    // Under the retired predicate this refused as weight-value-mismatch. The
    // surviving property is that the one read is authoritative: 9 is finite,
    // so it validates and it is what the config carries.
    const config = loadUwrProfile(document, PINNED_UWR_PROFILE_ID);
    expect(config.structureWeight).toBe(9);
  });

  it("an accessor returning a non-finite or non-number value still fails closed", () => {
    const nonFinite = validRegistryDocument();
    nonFinite.weights = {
      get structureWeight() {
        return Number.NaN;
      },
      executionWeight: 0.25,
      riskWeight: 0.25,
      insightWeight: 0.25
    };
    expectRefusal(nonFinite, "weights-shape-mismatch");

    const nonNumber = validRegistryDocument();
    nonNumber.weights = {
      get structureWeight() {
        return "0.25";
      },
      executionWeight: 0.25,
      riskWeight: 0.25,
      insightWeight: 0.25
    };
    expectRefusal(nonNumber, "weights-shape-mismatch");
  });

  it("inherited (prototype-supplied) fields never satisfy the predicate", () => {
    // A document with NO own properties, everything inherited from a
    // fully-conforming prototype: must be refused at the first own-field check.
    const ghost = Object.create(validRegistryDocument());
    expectRefusal(ghost, "schema-mismatch");

    // Same for the weights object specifically: inherited weight keys are
    // not own keys, so the shape check refuses.
    const document = validRegistryDocument();
    document.weights = Object.create({
      structureWeight: 0.25,
      executionWeight: 0.25,
      riskWeight: 0.25,
      insightWeight: 0.25
    });
    expectRefusal(document, "weights-shape-mismatch");
  });

  it("returned weight values are the DOCUMENT's own, never defaultUwrConfig's", () => {
    const document = validRegistryDocument();
    document.weights = {
      structureWeight: 0.7,
      executionWeight: 0.1,
      riskWeight: 0.1,
      insightWeight: 0.1
    };
    const config = loadUwrProfile(document, PINNED_UWR_PROFILE_ID);
    expect(config.structureWeight).toBe(0.7);
    expect(config.structureWeight).not.toBe(defaultUwrConfig.structureWeight);
    // Nothing is spread from defaultUwrConfig: mutating the returned config is
    // impossible (frozen), and no key arrives that the document did not supply.
    expect(Object.keys(config).sort()).toEqual([
      "executionWeight",
      "id",
      "insightWeight",
      "riskWeight",
      "structureWeight"
    ]);
  });
});

describe("PR-UWR-RUNTIME-LOADER: sibling registry integration (dev-only)", () => {
  it.skipIf(!existsSync(SIBLING_REGISTRY_URL))(
    "the live sibling afi-config registry document loads through the RC-5 predicate",
    () => {
      const sibling = JSON.parse(readFileSync(SIBLING_REGISTRY_URL, "utf8"));
      const config = loadUwrProfile(sibling, PINNED_UWR_PROFILE_ID);
      expect(config).toEqual({
        id: PINNED_UWR_PROFILE_ID,
        structureWeight: 0.25,
        executionWeight: 0.25,
        riskWeight: 0.25,
        insightWeight: 0.25
      });
    }
  );
});
