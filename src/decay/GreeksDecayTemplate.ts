/**
 * GreeksDecayTemplate - Canonical time-decay template for AFI Protocol signals
 *
 * This module provides a standardized approach to signal score decay over time,
 * inspired by options Greeks (particularly theta - time decay).
 *
 * Key concepts:
 * - Different holding horizons (scalp, intraday, swing, position, event) have different decay profiles
 * - Decay models: exponential (most common), linear, or cliff (hard cutoff)
 * - Half-life is the primary parameter for exponential decay
 * - Optional theta bias for aggressive/conservative decay tuning
 *
 * @module afi-core/src/decay/GreeksDecayTemplate
 */

import { z } from "zod";
import type { AnalystScoreTemplate } from "../analyst/AnalystScoreTemplate.js";

/**
 * Holding horizon labels for decay templates
 * Subset of AnalystScoreTemplate.holdingHorizon with concrete decay profiles
 */
export type HoldingHorizon = "scalp" | "intraday" | "swing" | "position";

/**
 * Decay model types
 * - exp: Exponential decay (most common, smooth degradation)
 * - linear: Linear decay (constant rate)
 * - cliff: Hard cutoff at maxLifeMinutes (no gradual decay)
 */
export type DecayModel = "exp" | "linear" | "cliff";

/**
 * GreeksDecayTemplate - TypeScript interface for signal decay configuration
 */
export interface GreeksDecayTemplate {
  /** Unique template identifier (e.g., "decay-scalp-v1") */
  templateId: string;

  /** Holding horizon this template applies to */
  horizonLabel: HoldingHorizon;

  // ========== Time Anchors ==========
  /** Expected mean time in trade (minutes) */
  targetHoldingMinutes: number;

  /** Optional hard cut-off time (minutes) - signal becomes invalid after this */
  maxLifeMinutes?: number;

  // ========== Decay Model ==========
  /** Decay model type */
  decayModel: DecayModel;

  /** Half-life in minutes (required for exp model, used as core parameter) */
  halfLifeMinutes?: number;

  // ========== Optional Greeks-Flavored Extras ==========
  /** Theta bias: scalar 0-1, how aggressively to bleed score (0 = conservative, 1 = aggressive) */
  thetaBias?: number | null;

  /** Event time (ISO 8601) for event-style signals (e.g., "FOMC at 2024-12-15T14:00:00Z") */
  eventTimeIso?: string | null;

  /** Optional notes about this decay template */
  notes?: string[];
}

/**
 * Zod schema for GreeksDecayTemplate with validation
 */
export const GreeksDecayTemplateSchema = z.object({
  templateId: z.string().min(1),
  horizonLabel: z.enum(["scalp", "intraday", "swing", "position"]),

  // Time anchors - must be positive
  targetHoldingMinutes: z.number().positive(),
  maxLifeMinutes: z.number().positive().optional(),

  // Decay model
  decayModel: z.enum(["exp", "linear", "cliff"]),
  halfLifeMinutes: z.number().positive().optional(),

  // Optional extras
  thetaBias: z.number().min(0).max(1).nullable().optional(),
  eventTimeIso: z.string().nullable().optional(),
  notes: z.array(z.string()).optional(),
}).refine(
  (data) => {
    // For exp and linear models, halfLifeMinutes is required
    if ((data.decayModel === "exp" || data.decayModel === "linear") && !data.halfLifeMinutes) {
      return false;
    }
    return true;
  },
  {
    message: "halfLifeMinutes is required for exp and linear decay models",
  }
);

/**
 * Default decay templates by holding horizon
 *
 * These are protocol defaults based on typical trading patterns.
 * They can be refined over time as we gather more data.
 */
export const DEFAULT_DECAY_TEMPLATES_BY_HORIZON: Record<HoldingHorizon, GreeksDecayTemplate> = {
  scalp: {
    templateId: "decay-scalp-v1",
    horizonLabel: "scalp",
    targetHoldingMinutes: 10,
    maxLifeMinutes: 30,
    decayModel: "exp",
    halfLifeMinutes: 8,
    thetaBias: 0.8, // Aggressive decay for scalp trades
    notes: ["Fast decay for scalp trades (seconds to minutes)"],
  },

  intraday: {
    templateId: "decay-intraday-v1",
    horizonLabel: "intraday",
    targetHoldingMinutes: 90,
    maxLifeMinutes: 360,
    decayModel: "exp",
    halfLifeMinutes: 60,
    thetaBias: 0.6,
    notes: ["Moderate decay for intraday trades (minutes to hours)"],
  },

  swing: {
    templateId: "decay-swing-v1",
    horizonLabel: "swing",
    targetHoldingMinutes: 1440, // 1 day
    maxLifeMinutes: 4320, // 3 days
    decayModel: "exp",
    halfLifeMinutes: 720, // 12 hours
    thetaBias: 0.4,
    notes: ["Slower decay for swing trades (hours to days)"],
  },

  position: {
    templateId: "decay-position-v1",
    horizonLabel: "position",
    targetHoldingMinutes: 10080, // 1 week
    maxLifeMinutes: 43200, // 30 days
    decayModel: "exp",
    halfLifeMinutes: 5040, // 3.5 days
    thetaBias: 0.2, // Conservative decay for position trades
    notes: ["Very slow decay for position trades (days to weeks)"],
  },
};

/**
 * DecayParams - Simplified decay parameters for storage in ScoreSnapshot
 *
 * This is the minimal set of decay parameters needed to apply time decay
 * to a scored signal at rest in the TSSD vault.
 */
export interface DecayParams {
  /** Half-life in minutes for exponential decay */
  halfLifeMinutes: number;

  /** Reference to the Greeks decay template used */
  greeksTemplateId: string;
}

/**
 * Pick decay parameters for an analyst score based on holding horizon
 *
 * This helper maps an AnalystScoreTemplate to the appropriate decay parameters
 * by looking up the holding horizon in the default decay template registry.
 *
 * @param analystScore - The analyst score template to derive decay params from
 * @returns DecayParams with halfLifeMinutes and greeksTemplateId
 *
 * @example
 * ```typescript
 * const analystScore: AnalystScoreTemplate = {
 *   holdingHorizon: "swing",
 *   // ... other fields
 * };
 *
 * const decayParams = pickDecayParamsForAnalystScore(analystScore);
 * // => { halfLifeMinutes: 720, greeksTemplateId: "decay-swing-v1" }
 * ```
 */
export function pickDecayParamsForAnalystScore(
  analystScore: AnalystScoreTemplate
): DecayParams {
  // Primary key: holdingHorizon from analyst score
  // Fall back to "swing" if missing or unrecognized
  const horizon = analystScore.holdingHorizon;

  // Map to known horizons, default to swing for unknown/missing values
  let normalizedHorizon: HoldingHorizon;

  switch (horizon) {
    case "scalp":
    case "intraday":
    case "swing":
    case "position":
      normalizedHorizon = horizon;
      break;
    case "long-term":
      // Map long-term to position (similar decay profile)
      normalizedHorizon = "position";
      break;
    case "unknown":
    case undefined:
    default:
      // Default to swing for unknown or missing horizons
      normalizedHorizon = "swing";
      break;
  }

  const template = DEFAULT_DECAY_TEMPLATES_BY_HORIZON[normalizedHorizon];

  return {
    halfLifeMinutes: template.halfLifeMinutes ?? template.targetHoldingMinutes / 2,
    greeksTemplateId: template.templateId,
  };
}

/**
 * Apply exponential time decay to a base score.
 *
 * Uses half-life decay formula:
 * `decayed = baseScore * 0.5 ^ (elapsedMinutes / halfLifeMinutes)`
 *
 * @param baseScore - The original score (typically in [0, 1] range)
 * @param scoredAtIso - ISO 8601 timestamp when the score was computed
 * @param nowIso - ISO 8601 timestamp representing "now"
 * @param params - Decay parameters (halfLifeMinutes)
 * @param model - Decay model (only "exp" supported in v1)
 * @returns Decayed score, clamped to [0, 1] if baseScore was in that range
 * @throws Error if halfLifeMinutes <= 0
 *
 * @example
 * ```typescript
 * const decayed = applyTimeDecay(
 *   1.0,
 *   "2025-01-01T00:00:00.000Z",
 *   "2025-01-01T01:00:00.000Z",
 *   { halfLifeMinutes: 60 }
 * );
 * // => 0.5 (one half-life elapsed)
 * ```
 */
export function applyTimeDecay(
  baseScore: number,
  scoredAtIso: string,
  nowIso: string,
  params: { halfLifeMinutes: number },
  _model: "exp" = "exp"
): number {
  // Validate halfLifeMinutes
  if (params.halfLifeMinutes <= 0) {
    throw new Error(
      `Invalid halfLifeMinutes: ${params.halfLifeMinutes}. Must be > 0.`
    );
  }

  // Parse timestamps
  const scoredAt = new Date(scoredAtIso);
  const now = new Date(nowIso);

  // Calculate elapsed time in minutes
  const elapsedMs = now.getTime() - scoredAt.getTime();
  const elapsedMinutes = Math.max(0, elapsedMs / (1000 * 60));

  // Apply exponential decay
  const decayed = baseScore * Math.pow(0.5, elapsedMinutes / params.halfLifeMinutes);

  // Clamp to [0, 1] if baseScore was in that range
  if (baseScore >= 0 && baseScore <= 1) {
    return Math.max(0, Math.min(1, decayed));
  }

  return decayed;
}

