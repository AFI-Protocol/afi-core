/**
 * Universal Weighting Rule (UWR) axes input captured by scoring agents.
 *
 * Scoring agents (e.g., analyst personas or validators) should map their
 * strategy-specific evaluations into these normalized axes before invoking
 * the Universal Weighting Rule aggregator. Values are expected to be
 * normalized (e.g., 0..1 or 0..100) by the caller, but the exact
 * normalization scheme is intentionally left undefined here.
 */
export interface UwrAxesInput {
  /** Structure quality: HTF alignment, value line adherence, liquidity quality, etc. */
  structureAxis: number;
  /** Execution quality: entry timing, trigger pattern, volatility regime fit. */
  executionAxis: number;
  /** Risk discipline: risk/reward, stop/target placement, drawdown discipline. */
  riskAxis: number;
  /** Insight depth: asymmetry, originality, non-trivial edge. */
  insightAxis: number;
}

/**
 * Configuration for the Universal Weighting Rule.
 *
 * UWR is a protocol-level primitive and MUST NOT be modified by reputation
 * (see afi-config/docs/REGISTRIES_AND_REPUTATION.v0.1.md). Callers may
 * choose from versioned configs approved by governance.
 */
export interface UniversalWeightingRuleConfig {
  /** Optional version or identifier for this UWR configuration. */
  id?: string;
  /** Weight applied to the structure axis. */
  structureWeight: number;
  /** Weight applied to the execution axis. */
  executionWeight: number;
  /** Weight applied to the risk axis. */
  riskWeight: number;
  /** Weight applied to the insight axis. */
  insightWeight: number;
}

/**
 * Default UWR configuration placeholder.
 *
 * TODO: Replace with governance-approved weights sourced from afi-config.
 */
export const defaultUwrConfig: Readonly<UniversalWeightingRuleConfig> = {
  id: "uwr-default-stub",
  structureWeight: 0.25,
  executionWeight: 0.25,
  riskWeight: 0.25,
  insightWeight: 0.25
};

/**
 * Compute a Universal Weighting Rule score from normalized axes.
 *
 * UWR v0.1 Implementation (Math Audit 2025-12-06):
 * - Computes weighted average of four normalized axes: structure, execution, risk, insight
 * - Each axis must be in [0, 1] range (enforced by analysts before calling)
 * - Weights are governance-approved and sum to 1.0 (or normalized if not)
 * - Returns scalar score in [0, 1] representing signal quality
 *
 * Formula:
 *   UWR = (structure * w_s + execution * w_e + risk * w_r + insight * w_i) / total_weight
 *
 * This is the canonical UWR implementation. Analysts (e.g., Froggy) and validators
 * (e.g., Val Dook) MUST use this function after translating strategy-specific metrics
 * into {@link UwrAxesInput}.
 *
 * @param axes - Normalized axis inputs supplied by scoring agents (each in [0,1])
 * @param config - Optional UWR configuration; defaults to {@link defaultUwrConfig}
 * @returns UWR score in [0, 1] representing overall signal quality
 */
export function computeUwrScore(
  axes: UwrAxesInput,
  config: UniversalWeightingRuleConfig = defaultUwrConfig
): number {
  // Validate inputs are in [0, 1] range
  const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
  const structure = clamp01(axes.structureAxis);
  const execution = clamp01(axes.executionAxis);
  const risk = clamp01(axes.riskAxis);
  const insight = clamp01(axes.insightAxis);

  // Compute total weight for normalization
  const totalWeight =
    config.structureWeight +
    config.executionWeight +
    config.riskWeight +
    config.insightWeight;

  // Guard against zero weights (should never happen with governance config)
  if (totalWeight === 0) {
    return 0;
  }

  // Compute weighted sum
  const weightedSum =
    structure * config.structureWeight +
    execution * config.executionWeight +
    risk * config.riskWeight +
    insight * config.insightWeight;

  // Return normalized score in [0, 1]
  return weightedSum / totalWeight;
}
