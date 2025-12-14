import {
  computeUwrScore,
  defaultUwrConfig,
  type UniversalWeightingRuleConfig,
  type UwrAxesInput
} from "../validators/UniversalWeightingRule.js";
import type { FroggyEnrichedView } from "./froggy.enrichment_adapter.js";
import { buildFroggyTrendPullbackInputFromEnriched } from "./froggy.enrichment_adapter.js";
import {
  type AnalystScoreTemplate,
  AnalystScoreTemplateSchema
} from "../src/analyst/AnalystScoreTemplate.js";

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

/**
 * FroggyTrendPullbackScore - Canonical analyst output for Froggy's trend_pullback_v1 strategy
 *
 * This interface now uses AnalystScoreTemplate as the single source of truth.
 * All scoring information (UWR axes, UWR score, market context, etc.) is contained
 * in the analystScore field.
 *
 * Legacy top-level fields (uwrAxes, uwrScore) have been removed. Consumers should
 * read from analystScore instead.
 */
export interface FroggyTrendPullbackScore {
  /** Canonical analyst score template - single source of truth for all scoring data */
  analystScore: AnalystScoreTemplate;
  /** Optional human-readable notes (also available in analystScore.rationale) */
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

/**
 * Build AnalystScoreTemplate from Froggy input and UWR results
 *
 * This helper populates the canonical analyst score template with:
 * - Market context (perp, crypto, BTC/USDT)
 * - UWR axes and score
 * - Risk bucket and conviction derived from Froggy heuristics
 * - Optional narrative fields
 *
 * @param input - Froggy trend pullback input
 * @param uwrAxes - Computed UWR axes
 * @param uwrScore - Computed UWR score
 * @param notes - Optional notes array
 * @param enriched - Optional enriched view for additional context
 * @returns AnalystScoreTemplate
 */
function buildAnalystScoreTemplate(
  input: FroggyTrendPullbackInput,
  uwrAxes: UwrAxesInput,
  uwrScore: number,
  notes?: string[],
  enriched?: FroggyEnrichedView
): AnalystScoreTemplate {
  // Derive risk bucket from ATR regime
  const riskBucket: "low" | "medium" | "high" | "extreme" =
    input.atrRegime === "low" ? "low" :
    input.atrRegime === "normal" ? "medium" :
    input.atrRegime === "high" ? "high" : "extreme";

  // Derive conviction from UWR score (simple mapping: uwrScore is already 0-1)
  const conviction = uwrScore;

  // Derive direction from bias
  const direction: "long" | "short" | "neutral" | "unknown" =
    input.weeklyBias === "long" && input.dailyBias === "long" ? "long" :
    input.weeklyBias === "short" && input.dailyBias === "short" ? "short" :
    input.weeklyBias === "neutral" || input.dailyBias === "neutral" ? "neutral" : "unknown";

  // Parse symbol from enriched view if available (e.g., "BTC/USDT" -> baseAsset: "BTC", quoteAsset: "USDT")
  let baseAsset = "BTC"; // default
  let quoteAsset = "USDT"; // default
  if (enriched?.symbol) {
    const parts = enriched.symbol.split("/");
    if (parts.length === 2) {
      baseAsset = parts[0];
      quoteAsset = parts[1];
    }
  }

  // Build axis notes from notes array
  const axisNotes: AnalystScoreTemplate["axisNotes"] = {};
  if (notes && notes.length > 0) {
    if (notes.some(n => n.includes("structure") || n.includes("HTF") || n.includes("EMA"))) {
      axisNotes.structure = notes.filter(n => n.includes("structure") || n.includes("HTF") || n.includes("EMA")).join(" ");
    }
    if (notes.some(n => n.includes("execution") || n.includes("Trigger") || n.includes("pattern"))) {
      axisNotes.execution = notes.filter(n => n.includes("execution") || n.includes("Trigger") || n.includes("pattern")).join(" ");
    }
    if (notes.some(n => n.includes("risk"))) {
      axisNotes.risk = notes.filter(n => n.includes("risk")).join(" ");
    }
    if (notes.some(n => n.includes("insight") || n.includes("Liquidity") || n.includes("volatility"))) {
      axisNotes.insight = notes.filter(n => n.includes("insight") || n.includes("Liquidity") || n.includes("volatility")).join(" ");
    }
  }

  const analystScore: AnalystScoreTemplate = {
    // Identity
    analystId: "froggy",
    strategyId: "trend_pullback_v1",
    strategyVersion: "1.0.0",

    // Market context
    marketType: "perp",
    assetClass: "crypto",
    instrumentType: "linear-perp",
    baseAsset,
    quoteAsset,
    venue: undefined, // Not available in current Froggy input

    // Time / horizon
    signalTimeframe: enriched?.timeframe || "1h", // default to 1h if not available
    holdingHorizon: "swing", // Froggy trend_pullback_v1 is typically swing trading

    // Direction & risk
    direction,
    riskBucket,
    conviction,

    // UWR axes + score
    uwrAxes: {
      structure: uwrAxes.structureAxis,
      execution: uwrAxes.executionAxis,
      risk: uwrAxes.riskAxis,
      insight: uwrAxes.insightAxis,
    },
    uwrScore,

    // Optional narrative
    axisNotes: Object.keys(axisNotes).length > 0 ? axisNotes : undefined,
    rationale: notes && notes.length > 0 ? notes.join(" ") : undefined,
    tags: ["trend-following", "pullback", "ema-based"],
  };

  // Validate with schema
  const validationResult = AnalystScoreTemplateSchema.safeParse(analystScore);
  if (!validationResult.success) {
    throw new Error(
      `AnalystScoreTemplate validation failed: ${JSON.stringify(validationResult.error.errors)}`
    );
  }

  return analystScore;
}

export function scoreFroggyTrendPullback(
  input: FroggyTrendPullbackInput,
  config: UniversalWeightingRuleConfig = defaultUwrConfig,
  enriched?: FroggyEnrichedView
): FroggyTrendPullbackScore {
  const uwrAxes = buildUwrAxesFromFroggyInput(input);

  // Math Audit 2025-12-06: Now using real UWR implementation from afi-core
  // computeUwrScore() now implements the canonical weighted average formula
  const uwrScore = computeUwrScore(uwrAxes, config);

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

  // Build canonical analyst score template
  const analystScore = buildAnalystScoreTemplate(
    input,
    uwrAxes,
    uwrScore,
    notes.length ? notes : undefined,
    enriched
  );

  return {
    analystScore,
    notes: notes.length ? notes : undefined,
  };
}

export function scoreFroggyTrendPullbackFromEnriched(
  enriched: FroggyEnrichedView
): FroggyTrendPullbackScore {
  const input = buildFroggyTrendPullbackInputFromEnriched(enriched);
  return scoreFroggyTrendPullback(input, defaultUwrConfig, enriched);
}
