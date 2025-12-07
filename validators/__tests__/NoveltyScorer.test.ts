/**
 * Novelty Scorer Tests
 * 
 * Tests deterministic novelty scoring for AFI signals.
 * 
 * Math Audit 2025-12-06
 */

import { describe, it, expect } from "vitest";
import {
  computeNoveltyScore,
  type NoveltySignalInput
} from "../NoveltyScorer.js";

describe("NoveltyScorer - Deterministic Novelty Evaluation", () => {
  const baseSignal: NoveltySignalInput = {
    signalId: "sig-001",
    cohortId: "btc-perp-4h-trend_pullback_v1",
    market: "BTC/USDT",
    timeframe: "4h",
    strategy: "trend_pullback_v1",
    direction: "long",
    structureAxis: 0.8,
    executionAxis: 0.7,
    riskAxis: 0.6,
    insightAxis: 0.9,
    createdAt: "2025-12-06T10:00:00Z"
  };

  describe("computeNoveltyScore - Empty Cohort", () => {
    it("should return breakthrough novelty for first signal in cohort", () => {
      const result = computeNoveltyScore(baseSignal, []);
      
      expect(result.noveltyScore).toBe(1.0);
      expect(result.noveltyClass).toBe("breakthrough");
      expect(result.cohortId).toBe("btc-perp-4h-trend_pullback_v1");
      expect(result.baselineId).toBe("empty-cohort");
    });
  });

  describe("computeNoveltyScore - Identical Signal", () => {
    it("should return low novelty for duplicate signal", () => {
      const duplicate: NoveltySignalInput = { ...baseSignal, signalId: "sig-002" };
      
      const result = computeNoveltyScore(baseSignal, [duplicate]);
      
      // Should be very low novelty (high similarity)
      expect(result.noveltyScore).toBeLessThan(0.1);
      expect(result.noveltyClass).toBe("redundant");
    });
  });

  describe("computeNoveltyScore - Similar Signal", () => {
    it("should return low novelty for very similar signal", () => {
      const similar: NoveltySignalInput = {
        ...baseSignal,
        signalId: "sig-003",
        structureAxis: 0.75, // Slightly different
        executionAxis: 0.65,
        riskAxis: 0.55,
        insightAxis: 0.85
      };

      const result = computeNoveltyScore(baseSignal, [similar]);

      // Signals are very similar (same market, direction, close UWR axes)
      // so novelty should be low
      expect(result.noveltyScore).toBeGreaterThan(0);
      expect(result.noveltyScore).toBeLessThan(0.2);
      expect(result.noveltyClass).toMatch(/incremental|redundant/);
    });
  });

  describe("computeNoveltyScore - Different Direction", () => {
    it("should return higher novelty for opposite direction", () => {
      const opposite: NoveltySignalInput = {
        ...baseSignal,
        signalId: "sig-004",
        direction: "short" // Opposite direction
      };
      
      const result = computeNoveltyScore(baseSignal, [opposite]);
      
      // Direction mismatch should increase novelty
      expect(result.noveltyScore).toBeGreaterThan(0.15);
    });
  });

  describe("computeNoveltyScore - Different Market", () => {
    it("should return higher novelty for different market", () => {
      const differentMarket: NoveltySignalInput = {
        ...baseSignal,
        signalId: "sig-005",
        market: "ETH/USDT" // Different market
      };
      
      const result = computeNoveltyScore(baseSignal, [differentMarket]);
      
      // Market mismatch should increase novelty
      expect(result.noveltyScore).toBeGreaterThan(0.25);
    });
  });

  describe("computeNoveltyScore - Completely Different Signal", () => {
    it("should return high novelty for completely different signal", () => {
      const different: NoveltySignalInput = {
        signalId: "sig-006",
        cohortId: "btc-perp-4h-trend_pullback_v1",
        market: "ETH/USDT",
        direction: "short",
        structureAxis: 0.2,
        executionAxis: 0.3,
        riskAxis: 0.1,
        insightAxis: 0.15,
        createdAt: "2025-12-06T12:00:00Z"
      };
      
      const result = computeNoveltyScore(baseSignal, [different]);
      
      // Should be high novelty
      expect(result.noveltyScore).toBeGreaterThan(0.5);
      expect(result.noveltyClass).toMatch(/breakthrough|incremental/);
    });
  });

  describe("computeNoveltyScore - Multiple Baseline Signals", () => {
    it("should compute average similarity across cohort", () => {
      const similar1: NoveltySignalInput = {
        ...baseSignal,
        signalId: "sig-007",
        structureAxis: 0.75
      };
      
      const similar2: NoveltySignalInput = {
        ...baseSignal,
        signalId: "sig-008",
        executionAxis: 0.65
      };
      
      const different: NoveltySignalInput = {
        ...baseSignal,
        signalId: "sig-009",
        market: "ETH/USDT",
        direction: "short"
      };
      
      const result = computeNoveltyScore(baseSignal, [similar1, similar2, different]);
      
      // Should average similarity across all baseline signals
      expect(result.noveltyScore).toBeGreaterThan(0);
      expect(result.noveltyScore).toBeLessThan(1);
      expect(result.referenceSignals).toHaveLength(3);
    });
  });

  describe("computeNoveltyScore - Determinism", () => {
    it("should return same result for same inputs", () => {
      const baseline: NoveltySignalInput[] = [
        { ...baseSignal, signalId: "sig-010", structureAxis: 0.75 }
      ];
      
      const result1 = computeNoveltyScore(baseSignal, baseline);
      const result2 = computeNoveltyScore(baseSignal, baseline);
      
      expect(result1.noveltyScore).toBe(result2.noveltyScore);
      expect(result1.noveltyClass).toBe(result2.noveltyClass);
    });
  });

  describe("computeNoveltyScore - Result Structure", () => {
    it("should return complete NoveltyResult structure", () => {
      const baseline: NoveltySignalInput[] = [
        { ...baseSignal, signalId: "sig-011" }
      ];
      
      const result = computeNoveltyScore(baseSignal, baseline);
      
      expect(result).toHaveProperty("noveltyScore");
      expect(result).toHaveProperty("noveltyClass");
      expect(result).toHaveProperty("cohortId");
      expect(result).toHaveProperty("baselineId");
      expect(result).toHaveProperty("referenceSignals");
      expect(result).toHaveProperty("evidenceNotes");
      expect(result).toHaveProperty("computedAt");
      
      expect(result.noveltyScore).toBeGreaterThanOrEqual(0);
      expect(result.noveltyScore).toBeLessThanOrEqual(1);
    });
  });
});

