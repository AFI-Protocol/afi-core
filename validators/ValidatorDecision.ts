/**
 * ValidatorDecision v0.2 + UWR contracts + Decay Integration
 * - Defines validator-facing decision envelopes and UWR structural contracts.
 * - UWR is a protocol primitive; weights/math must come from governance-approved config in afi-config.
 * - Reputation, PoI, and PoInsight MUST NOT override UWR output or TSSD vault finality.
 * - Structural envelopes only; emissions/mint/replay wiring live in afi-token / afi-reactor / afi-infra.
 * - Decay Integration: Computes signal age and applies time-based decay to UWR scores.
 */

import type { NoveltyResult } from "./NoveltyTypes.js";
import { applyTimeDecayToUwrScore, calculateAdjustedHalfLife } from "./SignalDecay.js";
import type { AnalystScoreTemplate } from "../analyst/AnalystScoreTemplate.js";

/**
 * Allowed validator decision kinds.
 */
export type ValidatorDecisionKind = "approve" | "reject" | "flag" | "abstain";

/**
 * Scoring output combining base and decayed scores.
 */
export interface ValidatorScoreOutput {
  /** Base UWR score (fresh, no decay applied) */
  baseScore: number;
  /** Time-decayed UWR score (adjusted for signal age) */
  decayedScore: number;
  /** Signal age in hours at decision time */
  ageHours: number;
  /** Half-life used for decay calculation (may be adjusted for volatility/conviction) */
  halfLifeHours: number;
  /** Original conviction level from analyst */
  conviction: number;
  /** Volatility factor used (1.0 = normal) */
  volatility?: number;
}

/**
 * Compute validator scoring output from analyst score template.
 * 
 * This function:
 * 1. Computes signal age from scoredAt timestamp
 * 2. Calculates adjusted half-life based on conviction
 * 3. Applies time decay to UWR score
 * 4. Returns both baseScore (fresh) and decayedScore (time-adjusted)
 * 
 * @param analystScore - The analyst score template
 * @param volatility - Optional volatility factor (default: 1.0 = normal)
 * @param now - Optional current time for testing (defaults to Date.now())
 * @returns ValidatorScoreOutput with base and decayed scores
 */
export function computeValidatorScore(
  analystScore: AnalystScoreTemplate,
  volatility: number = 1.0,
  now: number = Date.now()
): ValidatorScoreOutput {
  // Compute signal age in hours
  const scoredAt = new Date(analystScore.scoredAt).getTime();
  const ageMs = now - scoredAt;
  const ageHours = ageMs / (1000 * 60 * 60);
  
  // Calculate adjusted half-life based on conviction
  // Higher conviction → longer half-life (signal stays relevant longer)
  const baseHalfLifeHours = 24; // Default 24 hours
  const adjustedHalfLife = calculateAdjustedHalfLife(
    baseHalfLifeHours,
    volatility,
    analystScore.conviction
  );
  
  // Apply decay to get decayed score
  const decayedScore = applyTimeDecayToUwrScore(
    analystScore.uwrScore,
    ageHours,
    adjustedHalfLife
  );
  
  return {
    baseScore: analystScore.uwrScore,
    decayedScore,
    ageHours,
    halfLifeHours: adjustedHalfLife,
    conviction: analystScore.conviction,
    volatility
  };
}

/**
 * Base validator decision envelope, captured for audit/replay.
 * This type is strictly structural; it does not implement UWR or emissions.
 */
export interface ValidatorDecisionBase {
  /** Unique signal identifier being decided on */
  signalId: string;
  /** Validator identifier (agent/droid/human) producing the decision */
  validatorId: string;
  /** Decision outcome */
  decision: ValidatorDecisionKind;
  /** UWR-derived confidence scalar in [0,1]; UWR logic lives elsewhere */
  uwrConfidence: number;
  /** Time-decayed UWR score (for emissions calculation) */
  decayedScore?: number;
  /** Signal age in hours at decision time */
  ageHours?: number;
  /** Optional regime tag aligned with macro.regimeTag in usignal schema */
  regimeTag?: string;
  /** Optional novelty evaluation result (see NoveltySpec v0.1) */
  novelty?: NoveltyResult;
  /** Short machine-readable reason tags (e.g., ["low-novelty", "conflict-with-baseline"]) */
  reasonCodes?: string[];
  /** Free-text justification */
  notes?: string;
  /** ISO timestamp when decision was created (for audit/replay) */
  createdAt: string;
}

/**
 * Outcome envelope that downstream mint/replay logic can consume.
 * This file does not define emissions or mint logic—only the shape.
 */
export interface ValidatorOutcome {
  mintEligible: boolean;
  mintReason?: string;
  replaySessionId?: string;
  decision: ValidatorDecisionBase;
  /** Scoring output for emissions calculation */
  scoring?: ValidatorScoreOutput;
}

/**
 * Position in Flow:
 * - Consumed by validators after scoring and novelty evaluation, before mint gating.
 * - Provides a deterministic envelope for replay and audit; does NOT define emissions, tokenomics, or PoI/PoInsight formulas.
 * - uwrConfidence references UWR outputs but this file does NOT implement UWR.
 * - PoI (Proof-of-Intelligence) and PoInsight are analyst-level reputation metrics computed by validators over time; 
 *   they are not per-signal metrics. Analyst reputation scores may influence validator selection/weighting, 
 *   but must never override UWR or vault finality for already-scored/recorded signals.
 * - Scoring flow: Analyst → AnalystScoreTemplate (with scoredAt) → ValidatorDecision.computeValidatorScore() → ValidatorOutcome
 */
