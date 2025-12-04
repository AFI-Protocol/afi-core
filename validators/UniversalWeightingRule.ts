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
 * This function is intentionally stubbed. It should apply the Universal
 * Weighting Rule to axis scores to produce a scalar uwrScore /
 * uwrConfidence. UWR is a canonical protocol primitive and should be
 * invoked by analysts (e.g., Froggie) and validators (e.g., Val Dook) after
 * they translate their strategy-specific metrics into {@link UwrAxesInput}.
 *
 * @param axes - Normalized axis inputs supplied by scoring agents.
 * @param config - Optional UWR configuration; defaults to {@link defaultUwrConfig}.
 * @returns Placeholder UWR score; replace with production math.
 */
export function computeUwrScore(
  axes: UwrAxesInput,
  config: UniversalWeightingRuleConfig = defaultUwrConfig
): number {
  // TODO: implement Universal Weighting Rule aggregation using governance-approved math.
  // Placeholder implementation to satisfy type-checking; not production-ready.
  void axes;
  void config;
  return 0;
}
