/**
 * Novelty Scorer for AFI Protocol
 * 
 * Deterministic, rule-based novelty scoring for signals within a cohort.
 * 
 * Math Audit 2025-12-06:
 * - Status: STUBBED → BASIC_IMPLEMENTATION
 * - Provides deterministic novelty scoring based on signal attributes
 * - Cohort-relative: compares signals within same market/timeframe/strategy
 * - Future: Can be enhanced with embeddings/ML for semantic similarity
 * 
 * Novelty Principles:
 * 1. Novelty is COHORT-RELATIVE (not absolute)
 * 2. Novelty does NOT override UWR or emissions finality
 * 3. Novelty is DETERMINISTIC (same inputs → same output)
 * 4. Novelty helps avoid double-paying for duplicate insights
 */

import type {
  NoveltyResult,
  NoveltyClass,
  NoveltyReferenceSignal
} from "./NoveltyTypes.js";

/**
 * Signal attributes used for novelty comparison.
 * 
 * This is a simplified interface for the Math Audit.
 * In production, this would be extracted from the full signal envelope.
 */
export interface NoveltySignalInput {
  signalId: string;
  cohortId: string; // e.g., "btc-perp-4h-trend_pullback_v1"
  
  // Core signal attributes for comparison
  market?: string;
  timeframe?: string;
  strategy?: string;
  direction?: "long" | "short" | "neutral";
  
  // Optional: UWR axes for similarity comparison
  structureAxis?: number;
  executionAxis?: number;
  riskAxis?: number;
  insightAxis?: number;
  
  // Timestamp for recency comparison
  createdAt?: string;
}

/**
 * Compute novelty score by comparing signal to cohort baseline.
 * 
 * v0.1 Implementation (Math Audit):
 * - Uses simple attribute-based similarity
 * - Compares UWR axes if available
 * - Returns deterministic score in [0, 1]
 * 
 * Future enhancements:
 * - Semantic embeddings for reasoning/narrative comparison
 * - Historical cohort database for real similarity search
 * - ML-based duplicate detection
 * 
 * @param signal - Signal to evaluate for novelty
 * @param cohortBaseline - Recent signals in same cohort for comparison
 * @returns NoveltyResult with score, class, and evidence
 */
export function computeNoveltyScore(
  signal: NoveltySignalInput,
  cohortBaseline: NoveltySignalInput[] = []
): NoveltyResult {
  const computedAt = new Date().toISOString();
  
  // If no baseline, signal is novel by default
  if (cohortBaseline.length === 0) {
    return {
      noveltyScore: 1.0,
      noveltyClass: "breakthrough",
      cohortId: signal.cohortId,
      baselineId: "empty-cohort",
      evidenceNotes: "First signal in cohort",
      computedAt
    };
  }

  // Find most similar signals in cohort
  const similarities = cohortBaseline.map(baseline => ({
    signal: baseline,
    similarity: computeSignalSimilarity(signal, baseline)
  }));

  // Sort by similarity (highest first)
  similarities.sort((a, b) => b.similarity - a.similarity);
  
  const mostSimilar = similarities[0];
  const avgSimilarity = similarities.reduce((sum, s) => sum + s.similarity, 0) / similarities.length;

  // Novelty score is inverse of similarity
  // If signal is 90% similar to baseline, novelty is 10%
  const noveltyScore = 1.0 - avgSimilarity;

  // Classify novelty based on score
  const noveltyClass = classifyNovelty(noveltyScore, mostSimilar.similarity);

  // Build reference signals (top 3 most similar)
  const referenceSignals: NoveltyReferenceSignal[] = similarities
    .slice(0, 3)
    .map(s => ({
      signalId: s.signal.signalId,
      label: `${s.signal.market} ${s.signal.direction}`,
      timestamp: s.signal.createdAt
    }));

  return {
    noveltyScore,
    noveltyClass,
    cohortId: signal.cohortId,
    baselineId: `cohort-${cohortBaseline.length}-signals`,
    referenceSignals,
    evidenceNotes: `Avg similarity: ${(avgSimilarity * 100).toFixed(1)}%, most similar: ${(mostSimilar.similarity * 100).toFixed(1)}%`,
    computedAt
  };
}

/**
 * Compute similarity between two signals (0 = completely different, 1 = identical).
 * 
 * v0.1: Simple attribute-based similarity
 * - Market match: 30%
 * - Direction match: 20%
 * - UWR axes similarity: 50% (if available)
 */
function computeSignalSimilarity(a: NoveltySignalInput, b: NoveltySignalInput): number {
  let similarity = 0;
  let weights = 0;

  // Market similarity (exact match)
  if (a.market && b.market) {
    similarity += a.market === b.market ? 0.3 : 0;
    weights += 0.3;
  }

  // Direction similarity (exact match)
  if (a.direction && b.direction) {
    similarity += a.direction === b.direction ? 0.2 : 0;
    weights += 0.2;
  }

  // UWR axes similarity (Euclidean distance in 4D space)
  if (
    a.structureAxis !== undefined && b.structureAxis !== undefined &&
    a.executionAxis !== undefined && b.executionAxis !== undefined &&
    a.riskAxis !== undefined && b.riskAxis !== undefined &&
    a.insightAxis !== undefined && b.insightAxis !== undefined
  ) {
    const axesSimilarity = computeUwrAxesSimilarity(a, b);
    similarity += axesSimilarity * 0.5;
    weights += 0.5;
  }

  // Normalize by total weights
  return weights > 0 ? similarity / weights : 0;
}

/**
 * Compute similarity between UWR axes using normalized Euclidean distance.
 */
function computeUwrAxesSimilarity(a: NoveltySignalInput, b: NoveltySignalInput): number {
  const distance = Math.sqrt(
    Math.pow((a.structureAxis || 0) - (b.structureAxis || 0), 2) +
    Math.pow((a.executionAxis || 0) - (b.executionAxis || 0), 2) +
    Math.pow((a.riskAxis || 0) - (b.riskAxis || 0), 2) +
    Math.pow((a.insightAxis || 0) - (b.insightAxis || 0), 2)
  );

  // Max distance in 4D unit hypercube is 2.0
  // Similarity = 1 - (distance / max_distance)
  return 1.0 - Math.min(distance / 2.0, 1.0);
}

/**
 * Classify novelty based on score and max similarity.
 */
function classifyNovelty(noveltyScore: number, maxSimilarity: number): NoveltyClass {
  if (noveltyScore >= 0.7) return "breakthrough";
  if (noveltyScore >= 0.4) return "incremental";
  if (maxSimilarity >= 0.9) return "redundant";
  return "incremental";
}

