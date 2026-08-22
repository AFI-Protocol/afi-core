/**
 * CFG-WEIGHTS (CFG-GOV §8 slot, authorized 2026-08-12): proves the substance of
 * D-CFG-4(1) — a validated registry document's OWN weight values flow into the
 * computed configuration, and RC-4's fail-closed rule survives the retirement of
 * RC-5's identity predicate.
 *
 * Companion to ./UwrProfileLoader.test.ts, which covers the loader's full shape
 * surface. This file exists to state the D-CFG-4(1) contract as its own
 * assertion set, so a future regression toward identity-by-construction is a
 * red test rather than a silent behavioural reversal.
 *
 * Purity is unchanged: no I/O, inline fixtures only.
 */

import { describe, it, expect } from "vitest";
import {
  loadUwrProfile,
  UwrProfileLoadError,
  UWR_PROFILE_SCHEMA_ID,
  PINNED_UWR_AXES
} from "../UwrProfileLoader.js";
import {
  computeUwrScore,
  defaultUwrConfig,
  type UwrAxesInput
} from "../UniversalWeightingRule.js";

/** Minimal schema-valid profile document, parameterised by id and weights. */
function profileDocument(
  profileId: string,
  weights: Record<string, unknown>
): Record<string, unknown> {
  return {
    schema: UWR_PROFILE_SCHEMA_ID,
    profileId,
    supersedes: "uwr-default-stub",
    axes: [...PINNED_UWR_AXES],
    weights
  };
}

const NON_DEFAULT = {
  structureWeight: 0.4,
  executionWeight: 0.3,
  riskWeight: 0.2,
  insightWeight: 0.1
};

function expectReason(fn: () => unknown, reason: string): void {
  let caught: unknown;
  try {
    fn();
  } catch (error) {
    caught = error;
  }
  expect(caught, `expected a ${reason} refusal`).toBeInstanceOf(UwrProfileLoadError);
  expect((caught as UwrProfileLoadError).reason).toBe(reason);
}

describe("D-CFG-4(1): registry weights flow into the computed configuration", () => {
  it("returns the document's own four numbers and its own id", () => {
    const config = loadUwrProfile(
      profileDocument("uwr-test-nondefault-v0", NON_DEFAULT),
      "uwr-test-nondefault-v0"
    );
    expect(config.id).toBe("uwr-test-nondefault-v0");
    expect(config.structureWeight).toBe(0.4);
    expect(config.executionWeight).toBe(0.3);
    expect(config.riskWeight).toBe(0.2);
    expect(config.insightWeight).toBe(0.1);
  });

  it("those values are NOT defaultUwrConfig's", () => {
    const config = loadUwrProfile(
      profileDocument("uwr-test-nondefault-v0", NON_DEFAULT),
      "uwr-test-nondefault-v0"
    );
    expect(config.structureWeight).not.toBe(defaultUwrConfig.structureWeight);
    expect(config.insightWeight).not.toBe(defaultUwrConfig.insightWeight);
  });

  it("no weight-value-mismatch reason remains reachable: non-default finite weights load", () => {
    expect(() =>
      loadUwrProfile(profileDocument("uwr-test-nondefault-v0", NON_DEFAULT), "uwr-test-nondefault-v0")
    ).not.toThrow();
  });
});

describe("CFG-WEIGHTS gate: the 0.25x4 registration still anchors at 0.1875", () => {
  it("scores the D2 M2 anchor axes to exactly 0.1875", () => {
    const config = loadUwrProfile(
      profileDocument("uwr-weighted-lifts-v0.1", {
        structureWeight: 0.25,
        executionWeight: 0.25,
        riskWeight: 0.25,
        insightWeight: 0.25
      }),
      "uwr-weighted-lifts-v0.1"
    );
    const anchor: UwrAxesInput = {
      structureAxis: 0.15,
      executionAxis: 0,
      riskAxis: 0.2,
      insightAxis: 0.4
    };
    expect(Object.is(computeUwrScore(anchor, config), 0.1875)).toBe(true);
    expect(
      Object.is(computeUwrScore(anchor, config), computeUwrScore(anchor, defaultUwrConfig))
    ).toBe(true);
  });
});

describe("D-CFG-4(3): recognition is registration-driven", () => {
  it("refuses when the document is not the profile the registration named", () => {
    expectReason(
      () => loadUwrProfile(profileDocument("uwr-test-nondefault-v0", NON_DEFAULT), "some-other-id"),
      "profile-id-mismatch"
    );
  });
});

describe("RC-4 survives the retirement: malformed weights still fail closed", () => {
  const cases: Array<[string, Record<string, unknown>]> = [
    ["a string value", { ...NON_DEFAULT, structureWeight: "0.4" }],
    ["NaN", { ...NON_DEFAULT, structureWeight: Number.NaN }],
    ["Infinity", { ...NON_DEFAULT, structureWeight: Number.POSITIVE_INFINITY }],
    ["-Infinity", { ...NON_DEFAULT, structureWeight: Number.NEGATIVE_INFINITY }],
    ["null", { ...NON_DEFAULT, structureWeight: null }],
    ["a missing key", { executionWeight: 0.3, riskWeight: 0.2, insightWeight: 0.1 }],
    ["an extra key", { ...NON_DEFAULT, bonusWeight: 0.1 }]
  ];

  for (const [label, weights] of cases) {
    it(`refuses ${label}`, () => {
      expectReason(
        () => loadUwrProfile(profileDocument("uwr-test-nondefault-v0", weights), "uwr-test-nondefault-v0"),
        "weights-shape-mismatch"
      );
    });
  }

  it("refuses prototype-supplied weight keys (not own properties)", () => {
    const inherited = Object.create(NON_DEFAULT) as Record<string, unknown>;
    expectReason(
      () => loadUwrProfile(profileDocument("uwr-test-nondefault-v0", inherited), "uwr-test-nondefault-v0"),
      "weights-shape-mismatch"
    );
  });
});

describe("read-once value fidelity", () => {
  it("an accessor is read exactly once and that read is the value that flows", () => {
    let reads = 0;
    const weights = {
      get structureWeight() {
        reads += 1;
        return reads === 1 ? 0.4 : 9;
      },
      executionWeight: 0.3,
      riskWeight: 0.2,
      insightWeight: 0.1
    };
    const config = loadUwrProfile(
      profileDocument("uwr-test-nondefault-v0", weights),
      "uwr-test-nondefault-v0"
    );
    expect(reads).toBe(1);
    expect(config.structureWeight).toBe(0.4);
  });
});
