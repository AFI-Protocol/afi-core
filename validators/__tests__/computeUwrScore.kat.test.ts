/**
 * PR-UWR-KAT-EXEC: execute the afi-config UWR score KAT vectors against
 * `computeUwrScore` (UP-11 item 1).
 *
 * Fixture: ./kats/compute-uwr-score.kat.json — a byte-identical vendored copy
 * of afi-config `kats/uwr-profile/v0/compute-uwr-score.kat.json` @ merge
 * commit fe329164919f0c1c9dc24bb5c279978fb680e983 (PR #17), content commit
 * 7809af4b0308f7db47488947770a0ab9f236268d, blob
 * 276be9e9348b4e0c2e92e5a9c59d05b50bfeb75d. Full provenance and change
 * control: ./kats/README.md. The KAT's engine.sourceCommit 390b440 pin is
 * exact for this suite: validators/UniversalWeightingRule.ts is
 * blob-identical between 390b440 and the executed-against commit 2541853.
 *
 * Comparison policy (owned here): the KAT's own comparisonPolicyNote assigns
 * floating-point comparison policy to PR-UWR-KAT-EXEC scope and deliberately
 * defines none in the data. This suite's policy: `Object.is` bit-exactness
 * for 9/10 vectors; a dual-pinned characterized exception for
 * uwr-score-anchor-0650 (see the rationale at that test).
 *
 * Scope: profile uwr-weighted-lifts-v0.1 is testnet-provisional
 * (x-afiStatus: draft-non-implementation). Execution ≠ wiring — this suite
 * executes vectors against the engine and nothing more: no reward, mint, or
 * validator-scoring path is touched, no registry is consumed at runtime
 * (the KAT JSON is imported only by this test), and defaultUwrConfig is
 * unchanged. Each follow-up is separately authorized.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import {
  computeUwrScore,
  defaultUwrConfig,
  type UwrAxesInput,
  type UniversalWeightingRuleConfig
} from "../UniversalWeightingRule.js";
import kat from "./kats/compute-uwr-score.kat.json";

/** Vendored fixture location (raw bytes for the integrity check). */
const VENDORED_URL = new URL(
  "./kats/compute-uwr-score.kat.json",
  import.meta.url
);

/** Sibling afi-config checkout (dev machines only; CI has no sibling). */
const SIBLING_URL = new URL(
  "../../../afi-config/kats/uwr-profile/v0/compute-uwr-score.kat.json",
  import.meta.url
);

/** sha256 of the vendored bytes, pinned at vendoring time (PR-UWR-KAT-EXEC). */
const PINNED_SHA256 =
  "ff2f63956038b1d5c01109184e2ddddb2606c11405d2420c35b7decb5eb36546";

const DRIFT_MESSAGE =
  "Vendored copy or upstream KAT changed — requires a new scoped " +
  "authorization; never silently re-vendor, never edit the vectors " +
  "(see validators/__tests__/kats/README.md).";

/**
 * Map KAT axis names to the engine's UwrAxesInput field names:
 * structure→structureAxis, execution→executionAxis, risk→riskAxis,
 * insight→insightAxis.
 */
function toAxesInput(axes: {
  structure: number;
  execution: number;
  risk: number;
  insight: number;
}): UwrAxesInput {
  return {
    structureAxis: axes.structure,
    executionAxis: axes.execution,
    riskAxis: axes.risk,
    insightAxis: axes.insight
  };
}

/**
 * Engine config built from the KAT's own weights block — the executed config
 * comes from the governed data, not from any runtime registry. Value-identity
 * with defaultUwrConfig is documented by a structural test below.
 */
const katConfig: UniversalWeightingRuleConfig = {
  id: "uwr-weighted-lifts-v0.1-kat",
  ...kat.weights
};

const ANCHOR_0650_ID = "uwr-score-anchor-0650";

/**
 * The engine's exact output for uwr-score-anchor-0650, pinned verbatim.
 * See the dual-assertion test below for the full rationale.
 */
const ANCHOR_0650_ENGINE_VALUE = 0.6499999999999999;

/** 1 ULP for binary64 values in [0.5, 1): adjacent doubles differ by 2^-53. */
const ULP_HALF_TO_ONE = 2 ** -53;

describe("PR-UWR-KAT-EXEC: computeUwrScore vs afi-config KAT vectors", () => {
  it("vendored KAT bytes match the pinned sha256 (always-on self-integrity)", () => {
    const actual = createHash("sha256")
      .update(readFileSync(VENDORED_URL))
      .digest("hex");
    expect(actual, DRIFT_MESSAGE).toBe(PINNED_SHA256);
  });

  it.skipIf(!existsSync(SIBLING_URL))(
    "vendored bytes are byte-identical to the sibling afi-config checkout (dev-only)",
    () => {
      expect(
        readFileSync(VENDORED_URL).equals(readFileSync(SIBLING_URL)),
        DRIFT_MESSAGE
      ).toBe(true);
    }
  );

  it("KAT metadata pins are intact", () => {
    expect(kat.schema, DRIFT_MESSAGE).toBe("afi.uwr-score-kat.v0");
    expect(kat["x-afiStatus"], DRIFT_MESSAGE).toBe("draft-non-implementation");
    expect(kat.profileId, DRIFT_MESSAGE).toBe("uwr-weighted-lifts-v0.1");
    expect(kat.status, DRIFT_MESSAGE).toBe("testnet-provisional");
    expect(kat.decisionRef, DRIFT_MESSAGE).toBe(
      "afi-governance/decisions/uwr-profile-pin-v0.1.md (UP-3, UP-4, UP-5, UP-11)"
    );
    expect(kat.engine.function, DRIFT_MESSAGE).toBe("computeUwrScore");
    expect(kat.engine.sourceModule, DRIFT_MESSAGE).toBe(
      "afi-core/validators/UniversalWeightingRule.ts"
    );
    expect(kat.engine.sourceCommit, DRIFT_MESSAGE).toBe("390b440");
    expect(kat.vectors, DRIFT_MESSAGE).toHaveLength(10);
  });

  it("every vector's axes block has exactly the four KAT axis keys", () => {
    // Guards the toAxesInput mapping: a renamed or missing axis in a future
    // KAT revision must fail here, not silently map to undefined.
    kat.vectors.forEach(v => {
      expect(
        Object.keys(v.axes).sort(),
        `${v.vectorId}: unexpected axes shape. ${DRIFT_MESSAGE}`
      ).toEqual(["execution", "insight", "risk", "structure"]);
    });
  });

  it("KAT weights block numerically equals defaultUwrConfig's four weights", () => {
    // Documents value-identity with the shipped default config WITHOUT
    // consuming any registry at runtime — the executed config (katConfig) is
    // built from the KAT's own weights block. defaultUwrConfig is unchanged.
    (
      [
        "structureWeight",
        "executionWeight",
        "riskWeight",
        "insightWeight"
      ] as const
    ).forEach(key => {
      expect(
        Object.is(kat.weights[key], defaultUwrConfig[key]),
        `${key}: KAT weights block diverged from defaultUwrConfig — ` +
          "value-identity documented at PR-UWR-KAT-EXEC no longer holds; " +
          "re-documenting it requires a new scoped authorization " +
          "(see validators/__tests__/kats/README.md)"
      ).toBe(true);
    });
  });

  describe("vector execution (Object.is bit-exact for 9/10)", () => {
    kat.vectors
      .filter(v => v.vectorId !== ANCHOR_0650_ID)
      .forEach(v => {
        it(`${v.vectorId}: bit-exact against the pinned expected value`, () => {
          const actual = computeUwrScore(toAxesInput(v.axes), katConfig);
          expect(
            Object.is(actual, v.expected.uwrScore),
            `${v.vectorId}: computeUwrScore returned ${actual}, KAT pins ` +
              `${v.expected.uwrScore}. Engine output or vendored vectors ` +
              `changed. ${DRIFT_MESSAGE}`
          ).toBe(true);
        });
      });

    it(`${ANCHOR_0650_ID}: dual-pinned characterized exception (≤ 1 ULP of 0.65 AND exact engine value)`, () => {
      // Why this vector is not Object.is-exact against 0.65:
      // the engine's multiply-accumulate order —
      //   (0.6*0.25 + 0.7*0.25 + 0.6*0.25 + 0.7*0.25) / 1
      // accumulated left-to-right — yields 0.6499999999999999, exactly 1 ULP
      // below the decimal anchor 0.65. Every operation involved is a
      // correctly-rounded IEEE-754 binary64 add/multiply/divide (no
      // transcendentals), so this value is deterministic and identical on
      // every conforming engine: characterized behavior, not flake.
      //
      // Policy authority: the KAT's comparisonPolicyNote — "Floating-point
      // comparison policy is PR-UWR-KAT-EXEC scope (afi-core); this file
      // deliberately defines none." This suite is that scope. 0.65 is not a
      // decision-pinned anchor (only the 0.1875 golden anchor and the 0.25
      // weights are decision-named), so characterizing it here contradicts
      // no governance text.
      //
      // The dual pin keeps drift-detection strength equal to bit-exact:
      //   (1) |actual − 0.65| ≤ 1 ULP bounds the sanctioned deviation;
      //   (2) Object.is(actual, 0.6499999999999999) pins the engine's true
      //       output verbatim, so ANY future engine change fails loudly.
      // Rejected alternatives: editing the vendored expected value (violates
      // afi-config change control) and a blanket tolerance (orders looser
      // than the data permits; would weaken the 41 vectors that CAN be
      // exact).
      const v = kat.vectors.find(vec => vec.vectorId === ANCHOR_0650_ID);
      expect(v, `${ANCHOR_0650_ID} missing from KAT. ${DRIFT_MESSAGE}`)
        .toBeDefined();

      const actual = computeUwrScore(toAxesInput(v!.axes), katConfig);

      expect(
        Math.abs(actual - v!.expected.uwrScore) <= ULP_HALF_TO_ONE,
        `${ANCHOR_0650_ID}: computeUwrScore returned ${actual}, more than ` +
          `1 ULP from the pinned ${v!.expected.uwrScore}. Engine output or ` +
          `vendored vectors changed. ${DRIFT_MESSAGE}`
      ).toBe(true);

      expect(
        Object.is(actual, ANCHOR_0650_ENGINE_VALUE),
        `${ANCHOR_0650_ID}: computeUwrScore returned ${actual}, but the ` +
          `characterized engine value pinned at PR-UWR-KAT-EXEC is ` +
          `${ANCHOR_0650_ENGINE_VALUE}. The engine's float path changed — ` +
          `re-characterization requires a new scoped authorization.`
      ).toBe(true);
    });

    it("uwr-score-d2m2-golden-anchor: the 0.1875 golden anchor reproduces bit-exactly", () => {
      // Decision-named anchor (D2 M2 golden replay:
      // afi-reactor/test/pipeheads/fixtures/golden.json @ 79c4a6f). Byte-
      // stability of the D2 M2 goldens is an acceptance criterion (UP-5,
      // UP-11) — called out explicitly on top of the generic loop above.
      const v = kat.vectors.find(
        vec => vec.vectorId === "uwr-score-d2m2-golden-anchor"
      );
      expect(v, `golden anchor vector missing from KAT. ${DRIFT_MESSAGE}`)
        .toBeDefined();
      expect(v!.expected.uwrScore, DRIFT_MESSAGE).toBe(0.1875);

      const actual = computeUwrScore(toAxesInput(v!.axes), katConfig);
      expect(
        Object.is(actual, 0.1875),
        `D2 M2 golden anchor: computeUwrScore returned ${actual}, expected ` +
          `exactly 0.1875. This anchor is decision-named (UP-5/UP-11) — ` +
          `divergence is a governance-visible event. ${DRIFT_MESSAGE}`
      ).toBe(true);
    });
  });
});
