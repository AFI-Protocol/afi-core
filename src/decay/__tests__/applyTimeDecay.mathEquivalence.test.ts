/**
 * PR-7 numerical-equivalence proof: applyTimeDecay delegated to afi-math.
 *
 * `applyTimeDecay` now delegates its kernel to afi-math
 * `decay.remainingAfterHalfLives({ halfLives })` = `Math.pow(0.5, halfLives)`.
 * This suite proves the delegation is BIT-EXACT against the pre-delegation
 * closed form `baseScore * Math.pow(0.5, elapsedMinutes / halfLifeMinutes)`
 * (preserved verbatim below as the reference oracle), using `Object.is` —
 * never approximate matchers. Bit-identity is structural: old and new code
 * execute the same Math.pow(0.5, x) operation, so the proof is
 * runtime-independent (unlike the exp kernel — see the kernel-selection
 * block at the bottom).
 *
 * Governance framing (math-authority-v0.1.md §8, PR-7: "preserve wrapper
 * semantics; prove numerical equivalence"):
 * - Wrapper semantics (validation order, exact throw message, negative-elapsed
 *   floor, conditional [0,1] clamp) are asserted byte-exactly here.
 * - Decay-engine canonicality (uwr-profile-pin-v0.1.md UP-8) remains OPEN;
 *   nothing in this suite or the delegation resolves it.
 * - This is an equivalence proof, NOT the PR-UWR-KAT-EXEC qualification gate:
 *   the afi-config KAT file is not read or executed here.
 */

import { describe, it, expect } from "vitest";
import { decay } from "@afi-protocol/afi-math";
import { applyTimeDecay } from "../GreeksDecayTemplate.js";

/**
 * Reference oracle: the pre-delegation implementation of applyTimeDecay's
 * math, preserved verbatim (local Math.pow kernel + conditional clamp).
 * Takes elapsedMinutes directly (the wrapper's timestamp handling is
 * exercised separately via ISO inputs below).
 */
function referenceDecay(
  baseScore: number,
  elapsedMinutes: number,
  halfLifeMinutes: number
): number {
  const decayed = baseScore * Math.pow(0.5, elapsedMinutes / halfLifeMinutes);
  if (baseScore >= 0 && baseScore <= 1) {
    return Math.max(0, Math.min(1, decayed));
  }
  return decayed;
}

/** Fixed epoch for ISO construction. */
const T0 = "2026-01-01T00:00:00.000Z";
const T0_MS = Date.parse(T0);

/**
 * Build (nowIso, actualElapsedMinutes) for an intended elapsed duration.
 * Milliseconds are rounded to integers (Date time values are integral), and
 * actualElapsedMinutes is recomputed exactly the way applyTimeDecay does,
 * so oracle and wrapper see the identical elapsed value.
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

/** Deterministic PRNG (mulberry32) — seeded, reproducible fuzz. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PINNED_HALF_LIVES = [8, 60, 720, 5040] as const;

describe("applyTimeDecay ≡ pre-delegation closed form (bit-exact, Object.is)", () => {
  describe("pinned dyadic grid", () => {
    // Grid mirrors afi-config/kats/uwr-profile/v0/apply-time-decay.kat.json
    // @ afi-config fe32916 (schema afi.uwr-decay-kat.v0, engine.sourceCommit
    // 390b440): halfLifeMinutes {8, 60, 720, 5040} x baseScore {1, 0.1875}
    // x k in {0, 1, 2, 4} half-lives. Inputs are vendored as literals — this
    // is an equivalence proof, NOT the PR-UWR-KAT-EXEC qualification gate.
    const BASES = [1, 0.1875] as const;
    const KS = [0, 1, 2, 4] as const;
    // Dyadic per-k factors: 2^0, 2^-1, 2^-2, 2^-4.
    const FACTORS: Record<number, number> = { 0: 1, 1: 0.5, 2: 0.25, 4: 0.0625 };

    PINNED_HALF_LIVES.forEach(halfLife => {
      BASES.forEach(base => {
        KS.forEach(k => {
          it(`halfLife ${halfLife}m, base ${base}, k=${k}: delegated === closed form === dyadic literal`, () => {
            const { nowIso, actualElapsedMinutes } = isoElapsed(k * halfLife);
            const delegated = applyTimeDecay(base, T0, nowIso, {
              halfLifeMinutes: halfLife,
            });

            // Primary: bit-identity with the pre-delegation closed form.
            expect(
              Object.is(
                delegated,
                referenceDecay(base, actualElapsedMinutes, halfLife)
              )
            ).toBe(true);

            // Secondary (decision-anchored sanity literal, exact by dyadic
            // arithmetic): expected = base * 2^-k.
            expect(delegated).toBe(base * FACTORS[k]);
          });
        });
      });
    });
  });

  describe("fractional and irrational half-life multiples", () => {
    PINNED_HALF_LIVES.forEach(halfLife => {
      const elapsedCases = [
        0.5 * halfLife,
        1.5 * halfLife,
        (halfLife * Math.E) / 2,
        (halfLife * Math.PI) / 3,
        7,
        1234.5678,
      ];

      elapsedCases.forEach(intended => {
        it(`halfLife ${halfLife}m, elapsed ~${intended.toFixed(4)}m: bit-identical`, () => {
          const { nowIso, actualElapsedMinutes } = isoElapsed(intended);
          const delegated = applyTimeDecay(0.825, T0, nowIso, {
            halfLifeMinutes: halfLife,
          });

          expect(
            Object.is(
              delegated,
              referenceDecay(0.825, actualElapsedMinutes, halfLife)
            )
          ).toBe(true);
        });
      });
    });
  });

  describe("seeded fuzz (500 triples, reproducible)", () => {
    it("delegated output is bit-identical to the closed form across randomized inputs", () => {
      const rand = mulberry32(0xaf1deca1);

      for (let i = 0; i < 500; i++) {
        // baseScore in [-2, 2] — deliberately includes out-of-[0,1] values
        // so the unclamped return path is fuzzed too.
        const base = rand() * 4 - 2;
        // halfLife in (0.001, 10080]
        const halfLife = 0.001 + rand() * 10079.999;
        // elapsed in [-100, 1e7] minutes — negatives exercise the floor.
        const intended = rand() * 10_000_100 - 100;

        const { nowIso, actualElapsedMinutes } = isoElapsed(intended);
        const delegated = applyTimeDecay(base, T0, nowIso, {
          halfLifeMinutes: halfLife,
        });
        const oracle = referenceDecay(base, actualElapsedMinutes, halfLife);

        if (!Object.is(delegated, oracle)) {
          throw new Error(
            `fuzz mismatch at i=${i}: base=${base}, halfLife=${halfLife}, ` +
              `elapsed=${actualElapsedMinutes} -> delegated=${delegated}, oracle=${oracle}`
          );
        }
      }
    });
  });

  describe("wrapper semantics preserved byte-exactly", () => {
    it("t = 0 returns baseScore exactly", () => {
      [1, 0.1875, 0.7].forEach(base => {
        const result = applyTimeDecay(base, T0, T0, { halfLifeMinutes: 60 });
        expect(Object.is(result, base)).toBe(true);
      });
    });

    it("negative elapsed (now before scoredAt) floors to zero decay", () => {
      const earlier = "2025-12-31T23:00:00.000Z";
      const result = applyTimeDecay(0.7, T0, earlier, { halfLifeMinutes: 60 });
      expect(Object.is(result, 0.7)).toBe(true);
    });

    it("throws the exact pre-delegation message for halfLifeMinutes <= 0", () => {
      // Anchored regexes: exact-message equality, not substring containment.
      // (Validation precedes the kernel call by code structure — the wrapper
      // keeps ownership of validation; afi-math's kernel validates nothing.)
      expect(() =>
        applyTimeDecay(0.5, T0, T0, { halfLifeMinutes: 0 })
      ).toThrow(/^Invalid halfLifeMinutes: 0\. Must be > 0\.$/);
      expect(() =>
        applyTimeDecay(0.5, T0, T0, { halfLifeMinutes: -10 })
      ).toThrow(/^Invalid halfLifeMinutes: -10\. Must be > 0\.$/);
    });

    it("baseScore outside [0, 1] is returned unclamped (raw path)", () => {
      const { nowIso } = isoElapsed(60);
      const result = applyTimeDecay(1.5, T0, nowIso, { halfLifeMinutes: 60 });
      expect(Object.is(result, 1.5 * Math.pow(0.5, 1))).toBe(true);
      expect(result).toBe(0.75);
    });

    it("huge elapsed underflows to exactly 0 on both clamped and raw paths", () => {
      // 1e9 minutes stays within the valid Date range (~2.7e8 ms short of the
      // 8.64e15 cap) and is ~1.25e8 half-lives at 8m — far past binary64
      // underflow (~1075 half-lives), so the result is exactly 0.
      const { nowIso, actualElapsedMinutes } = isoElapsed(1e9);

      const clamped = applyTimeDecay(1, T0, nowIso, { halfLifeMinutes: 8 });
      expect(Object.is(clamped, 0)).toBe(true);

      const raw = applyTimeDecay(2, T0, nowIso, { halfLifeMinutes: 8 });
      expect(Object.is(raw, referenceDecay(2, actualElapsedMinutes, 8))).toBe(
        true
      );
      expect(Object.is(raw, 0)).toBe(true);
    });
  });
});

describe("kernel selection (do not swap the pow kernel for the exp kernel)", () => {
  // Why decay.remainingAfterHalfLives (pow kernel) and not
  // decay.exponentialDecay / timeWeightedScore (exp kernel):
  //
  // 1. The pow kernel is bit-identical to the pre-delegation code BY
  //    CONSTRUCTION — both are the single operation Math.pow(0.5, x) — so
  //    equivalence holds on every runtime, whatever Math.pow returns.
  // 2. The exp kernel (initialValue * Math.exp(-(LN2/halfLife) * elapsed))
  //    is NOT bit-equivalent to the pow form in general: on this runtime a
  //    seeded fuzz shows the two forms differ on the vast majority of
  //    non-anchor inputs. Whether the exp form happens to land exactly on
  //    the dyadic anchors (0.5, 0.25, ...) is IMPLEMENTATION-DEPENDENT —
  //    ECMA-262 does not require correctly-rounded Math.exp (Node 22 returns
  //    exactly 0.5 for exp(-LN2); older engines returned 0.4999999999999999)
  //    — so the exp kernel carries no bit-exactness guarantee and cannot
  //    back the bit-exact afi-config decay KAT expectations (exactnessRule,
  //    apply-time-decay.kat.json) nor UP-8's requirement that a PR-7
  //    delegation preserve the pinned surface values.
  it("delegated kernel is structurally Math.pow(0.5, x): bit-identical across fuzzed exponents", () => {
    const rand = mulberry32(0x9042c0de);

    for (let i = 0; i < 1000; i++) {
      const r = rand() * 2000 - 10; // exponents in [-10, 1990)
      const kernel = decay.remainingAfterHalfLives({ halfLives: r });
      if (!Object.is(kernel, Math.pow(0.5, r))) {
        throw new Error(
          `kernel mismatch at halfLives=${r}: ${kernel} !== ${Math.pow(0.5, r)}`
        );
      }
    }
  });

  it("pow kernel is exactly 2^-k at every pinned dyadic grid point", () => {
    expect(decay.remainingAfterHalfLives({ halfLives: 0 })).toBe(1);
    [1, 2, 4].forEach(k => {
      expect(decay.remainingAfterHalfLives({ halfLives: k })).toBe(
        Math.pow(2, -k)
      );
    });
  });

  it("exp kernel diverges bitwise from the pow form on most non-anchor inputs (seeded fuzz)", () => {
    const rand = mulberry32(0xc0ffee);
    const samples = 20_000;
    let mismatches = 0;

    for (let i = 0; i < samples; i++) {
      const halfLife = 0.001 + rand() * 10080;
      const elapsed = rand() * 1e6;
      const powForm = Math.pow(0.5, elapsed / halfLife);
      const expForm = decay.exponentialDecay({
        initialValue: 1,
        halfLife,
        elapsed,
      });
      if (!Object.is(powForm, expForm)) {
        mismatches++;
      }
    }

    // On this runtime ~92% of samples differ; assert a robust lower bound so
    // the non-equivalence demonstration survives runtime-rounding variation.
    expect(mismatches).toBeGreaterThan(samples / 2);
  });
});
