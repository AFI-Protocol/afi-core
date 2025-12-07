/**
 * Signal Decay Integration for AFI Protocol
 * 
 * Wraps afi-math decay functions with AFI-specific signal scoring logic.
 * 
 * Math Audit 2025-12-06:
 * - Integrates afi-math decay models into AFI signal lifecycle
 * - Provides time-weighted UWR scoring
 * - Supports volatility and conviction adjustments
 * 
 * Status: WIRED (Math Audit 2025-12-06)
 * - Real math from afi-math/src/decay/decayModels.ts
 * - Ready for integration into Froggy pipeline and validator layer
 * - Currently NOT used in Prize Demo (static data, no timestamps)
 */

import { decay } from "@afi-protocol/afi-math";

/**
 * Default half-life for signal decay (in hours).
 * 
 * Signals lose 50% of their value after this many hours.
 * Default: 24 hours (1 day)
 * 
 * TODO: Source from governance config (afi-config)
 */
export const DEFAULT_SIGNAL_HALF_LIFE_HOURS = 24;

/**
 * Apply time-based decay to a UWR score.
 * 
 * Formula: decayed_score = uwr_score * e^(-λ * age)
 * where λ = ln(2) / half_life
 * 
 * @param uwrScore - Base UWR score in [0, 1]
 * @param ageHours - Signal age in hours
 * @param halfLifeHours - Half-life in hours (default: 24)
 * @returns Time-decayed score in [0, 1]
 */
export function applyTimeDecayToUwrScore(
  uwrScore: number,
  ageHours: number,
  halfLifeHours: number = DEFAULT_SIGNAL_HALF_LIFE_HOURS
): number {
  return decay.timeWeightedScore({
    baseScore: uwrScore,
    halfLife: halfLifeHours,
    age: ageHours
  });
}

/**
 * Calculate adjusted half-life based on market volatility and signal conviction.
 * 
 * - Higher volatility → shorter half-life (signals decay faster in volatile markets)
 * - Higher conviction → longer half-life (high-conviction signals stay relevant longer)
 * 
 * @param baseHalfLifeHours - Base half-life in hours
 * @param volatility - Volatility factor (1.0 = normal, >1.0 = high volatility)
 * @param conviction - Conviction factor (1.0 = normal, >1.0 = high conviction)
 * @returns Adjusted half-life in hours
 */
export function calculateAdjustedHalfLife(
  baseHalfLifeHours: number,
  volatility: number = 1.0,
  conviction: number = 1.0
): number {
  return decay.adjustedHalfLife({
    baseHalfLife: baseHalfLifeHours,
    volatility,
    conviction
  });
}

/**
 * Apply volatility-adjusted decay to a UWR score.
 * 
 * Combines volatility and conviction adjustments with exponential decay.
 * 
 * @param uwrScore - Base UWR score in [0, 1]
 * @param ageHours - Signal age in hours
 * @param volatility - Volatility factor (1.0 = normal)
 * @param conviction - Conviction factor (1.0 = normal)
 * @param baseHalfLifeHours - Base half-life in hours
 * @returns Volatility-adjusted decayed score in [0, 1]
 */
export function applyVolatilityAdjustedDecay(
  uwrScore: number,
  ageHours: number,
  volatility: number,
  conviction: number,
  baseHalfLifeHours: number = DEFAULT_SIGNAL_HALF_LIFE_HOURS
): number {
  const adjustedHalfLife = calculateAdjustedHalfLife(
    baseHalfLifeHours,
    volatility,
    conviction
  );

  return applyTimeDecayToUwrScore(uwrScore, ageHours, adjustedHalfLife);
}

/**
 * Calculate remaining value percentage after N half-lives.
 * 
 * Useful for understanding signal decay over time:
 * - After 1 half-life: 50% remains
 * - After 2 half-lives: 25% remains
 * - After 3 half-lives: 12.5% remains
 * 
 * @param halfLives - Number of half-lives elapsed
 * @returns Remaining value as fraction in [0, 1]
 */
export function remainingAfterHalfLives(halfLives: number): number {
  return decay.remainingAfterHalfLives({ halfLives });
}

/**
 * Re-export core decay functions from afi-math for convenience.
 */
export const {
  exponentialDecay,
  powerDecay,
  lambdaFromHalfLife,
  halfLifeFromLambda,
  compositeDecayScore,
  greeksAdjustedHalfLife
} = decay;

/**
 * Integration Notes for Froggy Pipeline:
 * 
 * To wire decay into the Froggy trend_pullback_v1 analyst:
 * 
 * 1. Add timestamp to FroggyEnrichedView (signal creation time)
 * 2. In scoreFroggyTrendPullback(), after computing uwrScore:
 *    ```
 *    const ageHours = (Date.now() - signal.createdAt) / (1000 * 60 * 60);
 *    const decayedScore = applyTimeDecayToUwrScore(uwrScore, ageHours);
 *    ```
 * 3. Return both uwrScore (base) and decayedScore (time-adjusted)
 * 4. Validators should use decayedScore for emissions decisions
 * 
 * For Prize Demo (static data):
 * - Decay is NOT applied because demo uses fixed example data
 * - All signals are treated as "fresh" (age = 0)
 * - Decay integration is ready but dormant until live data flows
 */

