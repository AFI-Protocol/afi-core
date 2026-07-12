/**
 * PR-UWR-KAT-EXEC: execute the afi-config decay KAT vectors against
 * `applyTimeDecay` (UP-11 item 2).
 *
 * Fixture: ./kats/apply-time-decay.kat.json — a byte-identical vendored copy
 * of afi-config `kats/uwr-profile/v0/apply-time-decay.kat.json` @ merge
 * commit fe329164919f0c1c9dc24bb5c279978fb680e983 (PR #17), content commit
 * 7809af4b0308f7db47488947770a0ab9f236268d, blob
 * 1199f705ee65eef70e6c0c58fffcd10206693cf0. Full provenance, change control,
 * and the engine.sourceCommit 390b440 pre-delegation caveat (PR #16 kernel
 * delegation to afi-math proven bit-exact in
 * applyTimeDecay.mathEquivalence.test.ts): ./kats/README.md.
 *
 * The KAT's own engine.canonicalityNote, quoted: "Decay-engine canonicality
 * is OPEN and deferred to PR-7 (math-authority-v0.1.md §8); this file pins
 * the GreeksDecayTemplate surface only (UP-8)." UP-8 stays OPEN — nothing
 * here resolves it.
 *
 * Comparison policy (owned here, per the KAT's exactnessRule): every
 * elapsedMinutes is an integer multiple of halfLifeMinutes and every
 * baseScore is dyadic, so all 32 expected values are exact in IEEE-754
 * binary64 — `Object.is` bit-exactness for all 32 vectors, no tolerance.
 *
 * Scope: profile uwr-weighted-lifts-v0.1 is testnet-provisional
 * (x-afiStatus: draft-non-implementation). Execution ≠ wiring — this suite
 * executes vectors against the engine and nothing more: no reward, mint, or
 * validator-scoring path is touched and no registry is consumed at runtime
 * (the KAT JSON is imported only by this test). The KAT description's
 * observation that base-1 rows at exactly one half-life land on 0.5 — the
 * testnet-provisional minDecayScoreThreshold (UP-9) — stays data commentary
 * here too: no eligibility gate is asserted or wired. Each follow-up is
 * separately authorized.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { applyTimeDecay } from "../GreeksDecayTemplate.js";
import kat from "./kats/apply-time-decay.kat.json";

/** Vendored fixture location (raw bytes for the integrity check). */
const VENDORED_URL = new URL(
  "./kats/apply-time-decay.kat.json",
  import.meta.url
);

/** Sibling afi-config checkout (dev machines only; CI has no sibling). */
const SIBLING_URL = new URL(
  "../../../../afi-config/kats/uwr-profile/v0/apply-time-decay.kat.json",
  import.meta.url
);

/** sha256 of the vendored bytes, pinned at vendoring time (PR-UWR-KAT-EXEC). */
const PINNED_SHA256 =
  "1a1240cc9f8cc8ed70b22f4aa00e7cdfe1176f4f1d3c6b1e10e886b0cfe81b78";

const DRIFT_MESSAGE =
  "Vendored copy or upstream KAT changed — requires a new scoped " +
  "authorization; never silently re-vendor, never edit the vectors " +
  "(see src/decay/__tests__/kats/README.md).";

const PINNED_HALF_LIVES = [8, 60, 720, 5040] as const;

/** Fixed epoch for ISO construction. */
const T0 = "2026-01-01T00:00:00.000Z";
const T0_MS = Date.parse(T0);

/**
 * Build (nowIso, actualElapsedMinutes) for an intended elapsed duration.
 * Milliseconds are rounded to integers (Date time values are integral), and
 * actualElapsedMinutes is recomputed exactly the way applyTimeDecay does,
 * so oracle and wrapper see the identical elapsed value.
 *
 * Copied verbatim from applyTimeDecay.mathEquivalence.test.ts (deliberately
 * not exported there — the suites stay independent). For KAT inputs every
 * elapsedMinutes is an integer, so nowMs is integer-ms exact and
 * actualElapsedMinutes reproduces the KAT value with zero rounding.
 */
function isoElapsed(intendedElapsedMinutes: number): {
  nowIso: string;
  actualElapsedMinutes: number;
} {
  const nowMs = Math.round(T0_MS + intendedElapsedMinutes * 60_000);
  return {
    nowIso: new Date(nowMs).toISOString(),
    actualElapsedMinutes: Math.max(0, (nowMs - T0_MS) / (1000 * 60)),
  };
}

describe("PR-UWR-KAT-EXEC: applyTimeDecay vs afi-config KAT vectors", () => {
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
    expect(kat.schema, DRIFT_MESSAGE).toBe("afi.uwr-decay-kat.v0");
    expect(kat["x-afiStatus"], DRIFT_MESSAGE).toBe("draft-non-implementation");
    expect(kat.profileId, DRIFT_MESSAGE).toBe("uwr-weighted-lifts-v0.1");
    expect(kat.status, DRIFT_MESSAGE).toBe("testnet-provisional");
    expect(kat.decisionRef, DRIFT_MESSAGE).toBe(
      "afi-governance/decisions/uwr-profile-pin-v0.1.md (UP-7, UP-8, UP-11)"
    );
    expect(kat.engine.function, DRIFT_MESSAGE).toBe("applyTimeDecay");
    expect(kat.engine.sourceModule, DRIFT_MESSAGE).toBe(
      "afi-core/src/decay/GreeksDecayTemplate.ts"
    );
    expect(kat.engine.sourceCommit, DRIFT_MESSAGE).toBe("390b440");
    expect(kat.engine.decayModel, DRIFT_MESSAGE).toBe("exp");
    expect(kat.engine.unit, DRIFT_MESSAGE).toBe("minutes");
    expect(kat.exactnessRule, DRIFT_MESSAGE).toBe(
      "elapsedMinutes is always an integer multiple of halfLifeMinutes and " +
        "baseScore is dyadic, so every expected value equals baseScore * " +
        "2^-k exactly in decimal and IEEE-754 binary64; no comparison " +
        "tolerance is defined in this file (PR-UWR-KAT-EXEC owns comparison " +
        "policy)."
    );
    expect(kat.templates.map(t => t.halfLifeMinutes), DRIFT_MESSAGE).toEqual([
      ...PINNED_HALF_LIVES
    ]);
    expect(kat.vectors, DRIFT_MESSAGE).toHaveLength(32);
  });

  it("coverage: all four half-lives {8, 60, 720, 5040} × 8 vectors each", () => {
    const counts = new Map<number, number>();
    kat.vectors.forEach(v => {
      counts.set(v.halfLifeMinutes, (counts.get(v.halfLifeMinutes) ?? 0) + 1);
    });
    expect([...counts.keys()].sort((a, b) => a - b)).toEqual([
      ...PINNED_HALF_LIVES
    ]);
    PINNED_HALF_LIVES.forEach(halfLife => {
      expect(
        counts.get(halfLife),
        `half-life ${halfLife}m: expected 8 vectors. ${DRIFT_MESSAGE}`
      ).toBe(8);
    });
  });

  describe("vector execution (Object.is bit-exact, all 32)", () => {
    kat.vectors.forEach(v => {
      it(`${v.vectorId}: bit-exact against the pinned expected value`, () => {
        const { nowIso, actualElapsedMinutes } = isoElapsed(v.elapsedMinutes);
        // Integer-ms exact: the constructed timestamps reproduce the KAT's
        // elapsedMinutes with zero rounding, so the engine sees exactly the
        // pinned input.
        expect(
          actualElapsedMinutes,
          `${v.vectorId}: test-harness self-check failed — the constructed ` +
            `timestamps did not reproduce elapsedMinutes exactly (harness ` +
            `defect, not an engine or KAT divergence)`
        ).toBe(v.elapsedMinutes);

        const actual = applyTimeDecay(v.baseScore, T0, nowIso, {
          halfLifeMinutes: v.halfLifeMinutes
        });
        expect(
          Object.is(actual, v.expected.decayedScore),
          `${v.vectorId}: applyTimeDecay returned ${actual}, KAT pins ` +
            `${v.expected.decayedScore}. A shipped decay output changed — ` +
            `engine or vendored vectors. ${DRIFT_MESSAGE}`
        ).toBe(true);
      });
    });
  });
});
