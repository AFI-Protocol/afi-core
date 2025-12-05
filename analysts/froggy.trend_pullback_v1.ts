import {
  computeUwrScore,
  defaultUwrConfig,
  type UniversalWeightingRuleConfig,
  type UwrAxesInput
} from "../validators/UniversalWeightingRule";
import type { FroggyEnrichedView } from "./froggy.enrichment_adapter";
import { buildFroggyTrendPullbackInputFromEnriched } from "./froggy.enrichment_adapter";

type Bias = "long" | "short" | "neutral";
type AtrRegime = "low" | "normal" | "high" | "extreme";

/**
 * Temporary analyst v0 input for Froggy's trend_pullback_v1 strategy.
 * TODO: align this shape with the canonical AFI signal schema once the analyst pipeline is integrated.
 */
export interface FroggyTrendPullbackInput {
  weeklyBias: Bias;
  dailyBias: Bias;
  haFlatBackConfirmed: boolean;

  distanceFromDailyEmaPct: number;
  pulledBackIntoSweetSpot: boolean;
  brokeEmaWithBody: boolean;

  liquiditySwept: boolean;
  triggerPatternQuality: 0 | 1 | 2 | 3;

  atrRegime: AtrRegime;
  rrMultiplePlanned: number;
}

export interface FroggyTrendPullbackScore {
  analystId: "froggy";
  strategyId: "trend_pullback_v1";
  uwrAxes: UwrAxesInput;
  uwrScore: number;
  notes?: string[];
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const scoreStructureAxis = (input: FroggyTrendPullbackInput): number => {
  let score = 0;

  // Favor aligned HTF bias that is not neutral.
  if (input.weeklyBias === input.dailyBias && input.weeklyBias !== "neutral") {
    score += 0.4;
  }

  // Confirmed HA flat-back adds structure confidence.
  if (input.haFlatBackConfirmed) {
    score += 0.2;
  }

  // Pullback into the EMA "sweet spot" matters more than distance alone.
  if (input.pulledBackIntoSweetSpot) {
    score += 0.25;
  } else if (input.distanceFromDailyEmaPct <= 2) {
    // Slight credit if within a modest range even if not perfect.
    score += 0.1;
  }

  // Breaking the EMA with a body is a structural negative.
  if (!input.brokeEmaWithBody) {
    score += 0.15;
  } else {
    score -= 0.1;
  }

  return clamp01(score);
};

const scoreExecutionAxis = (input: FroggyTrendPullbackInput): number => {
  // Trigger quality is the primary execution signal (0..3 -> 0..1).
  let score = input.triggerPatternQuality / 3;

  // If the pullback never reached the "sweet spot", reduce execution conviction.
  if (!input.pulledBackIntoSweetSpot) {
    score -= 0.15;
  }

  return clamp01(score);
};

const scoreRiskAxis = (input: FroggyTrendPullbackInput): number => {
  const rr = input.rrMultiplePlanned;
  let rrScore: number;

  if (rr <= 1) {
    rrScore = 0.2;
  } else if (rr <= 1.5) {
    rrScore = 0.5;
  } else if (rr <= 3) {
    rrScore = 0.9;
  } else if (rr <= 4) {
    rrScore = 0.75;
  } else {
    rrScore = 0.6;
  }

  if (input.brokeEmaWithBody) {
    rrScore -= 0.2;
  }

  return clamp01(rrScore);
};

const scoreInsightAxis = (input: FroggyTrendPullbackInput): number => {
  // Liquidity sweeps are the primary insight driver.
  let score = input.liquiditySwept ? 0.7 : 0.25;

  // Volatility regime interacts with liquidity context.
  switch (input.atrRegime) {
    case "normal":
      score += 0.15;
      break;
    case "high":
      score += 0.05;
      break;
    case "low":
      score -= 0.15;
      break;
    case "extreme":
      score -= 0.25;
      break;
  }

  return clamp01(score);
};

const computeWeightedFallbackScore = (
  axes: UwrAxesInput,
  config: UniversalWeightingRuleConfig
): number => {
  const totalWeight =
    config.structureWeight +
    config.executionWeight +
    config.riskWeight +
    config.insightWeight;

  if (!totalWeight) {
    return 0;
  }

  const weightedSum =
    axes.structureAxis * config.structureWeight +
    axes.executionAxis * config.executionWeight +
    axes.riskAxis * config.riskWeight +
    axes.insightAxis * config.insightWeight;

  return weightedSum / totalWeight;
};

export const buildUwrAxesFromFroggyInput = (
  input: FroggyTrendPullbackInput
): UwrAxesInput => {
  return {
    structureAxis: scoreStructureAxis(input),
    executionAxis: scoreExecutionAxis(input),
    riskAxis: scoreRiskAxis(input),
    insightAxis: scoreInsightAxis(input)
  };
};

export function scoreFroggyTrendPullback(
  input: FroggyTrendPullbackInput,
  config: UniversalWeightingRuleConfig = defaultUwrConfig
): FroggyTrendPullbackScore {
  const uwrAxes = buildUwrAxesFromFroggyInput(input);
  const uwrScoreFromCore = computeUwrScore(uwrAxes, config);

  // UWR implementation is currently a stub; fallback to a simple weighted mean
  // so analysts can still reason about relative quality until governance math is wired.
  const uwrScore =
    uwrScoreFromCore !== 0
      ? uwrScoreFromCore
      : computeWeightedFallbackScore(uwrAxes, config);

  const notes: string[] = [];

  if (uwrAxes.structureAxis < 0.4) {
    notes.push("Weak HTF structure or EMA context.");
  }
  if (uwrAxes.executionAxis < 0.4) {
    notes.push("Trigger pattern quality is low for this setup.");
  }
  if (uwrAxes.insightAxis < 0.4) {
    notes.push("Liquidity or volatility context is weak.");
  }

  return {
    analystId: "froggy",
    strategyId: "trend_pullback_v1",
    uwrAxes,
    uwrScore,
    notes: notes.length ? notes : undefined
  };
}

export function scoreFroggyTrendPullbackFromEnriched(
  enriched: FroggyEnrichedView
): FroggyTrendPullbackScore {
  const input = buildFroggyTrendPullbackInputFromEnriched(enriched);
  return scoreFroggyTrendPullback(input);
}
