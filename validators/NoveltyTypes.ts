/**
 * NoveltyResult v0.1 — validator-facing, deterministic novelty envelope.
 * Novelty is cohort-relative metadata and MUST NOT override UWR, TSSD vault
 * finality, or emissions. See docs/NOVELTY_SPEC.v0.1.md for lifecycle and examples.
 */

/**
 * Novelty class labels.
 */
export type NoveltyClass =
  | "breakthrough"
  | "incremental"
  | "redundant"
  | "contradictory";

/**
 * Lightweight reference to prior signals used in novelty comparison.
 */
export interface NoveltyReferenceSignal {
  /** Unique signal identifier */
  signalId: string;
  /** Short human label or description */
  label?: string;
  /** Optional PoInsight or score snapshot at the time */
  scoreAtTime?: number;
  /** ISO timestamp of the referenced signal */
  timestamp?: string;
}

/**
 * Structured novelty evaluation result. Deterministic and cohort-relative.
 */
export interface NoveltyResult {
  /** Novelty score in [0,1], where 1.0 is maximally novel vs. the baseline. */
  noveltyScore: number;
  /** Novelty class label describing qualitative novelty. */
  noveltyClass: NoveltyClass;
  /** Cohort identifier (e.g., market + timeframe + strategy family). */
  cohortId: string;
  /** Baseline or benchmark identifier used for comparison. */
  baselineId?: string;
  /** References to most similar or relevant prior signals. */
  referenceSignals?: NoveltyReferenceSignal[];
  /** Short rationale for how novelty was determined. */
  evidenceNotes?: string;
  /** Optional structured flags (e.g., high-similarity, novel-market). */
  flags?: string[];
  /** ISO timestamp when this novelty result was computed. */
  computedAt: string;
}
