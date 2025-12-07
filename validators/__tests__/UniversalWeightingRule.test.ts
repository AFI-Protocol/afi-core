/**
 * UWR (Universal Weighting Rule) Math Tests
 * 
 * Tests the canonical UWR implementation with specific numeric expectations.
 * These tests verify that the weighted average formula behaves correctly
 * and produces deterministic, auditable scores.
 * 
 * Math Audit 2025-12-06
 */

import { describe, it, expect } from "vitest";
import {
  computeUwrScore,
  defaultUwrConfig,
  type UwrAxesInput,
  type UniversalWeightingRuleConfig
} from "../UniversalWeightingRule.js";

describe("UniversalWeightingRule - UWR Math", () => {
  describe("computeUwrScore - Basic Weighted Average", () => {
    it("should return 0 for all-zero axes", () => {
      const axes: UwrAxesInput = {
        structureAxis: 0,
        executionAxis: 0,
        riskAxis: 0,
        insightAxis: 0
      };
      
      const score = computeUwrScore(axes, defaultUwrConfig);
      expect(score).toBe(0);
    });

    it("should return 1 for all-max axes", () => {
      const axes: UwrAxesInput = {
        structureAxis: 1,
        executionAxis: 1,
        riskAxis: 1,
        insightAxis: 1
      };
      
      const score = computeUwrScore(axes, defaultUwrConfig);
      expect(score).toBe(1);
    });

    it("should compute correct weighted average with equal weights", () => {
      // Default config has equal weights (0.25 each)
      const axes: UwrAxesInput = {
        structureAxis: 0.8,
        executionAxis: 0.6,
        riskAxis: 0.4,
        insightAxis: 0.2
      };
      
      // Expected: (0.8 + 0.6 + 0.4 + 0.2) / 4 = 2.0 / 4 = 0.5
      const score = computeUwrScore(axes, defaultUwrConfig);
      expect(score).toBeCloseTo(0.5, 10);
    });

    it("should compute correct weighted average with custom weights", () => {
      const config: UniversalWeightingRuleConfig = {
        id: "test-custom",
        structureWeight: 0.4,  // 40%
        executionWeight: 0.3,  // 30%
        riskWeight: 0.2,       // 20%
        insightWeight: 0.1     // 10%
      };

      const axes: UwrAxesInput = {
        structureAxis: 1.0,
        executionAxis: 0.5,
        riskAxis: 0.5,
        insightAxis: 0.0
      };

      // Expected: (1.0*0.4 + 0.5*0.3 + 0.5*0.2 + 0.0*0.1) / 1.0
      //         = (0.4 + 0.15 + 0.1 + 0.0) / 1.0 = 0.65
      const score = computeUwrScore(axes, config);
      expect(score).toBeCloseTo(0.65, 10);
    });
  });

  describe("computeUwrScore - Edge Cases", () => {
    it("should clamp negative axis values to 0", () => {
      const axes: UwrAxesInput = {
        structureAxis: -0.5,
        executionAxis: 0.5,
        riskAxis: 0.5,
        insightAxis: 0.5
      };

      // structureAxis should be clamped to 0
      // Expected: (0*0.25 + 0.5*0.25 + 0.5*0.25 + 0.5*0.25) / 1.0 = 0.375
      const score = computeUwrScore(axes, defaultUwrConfig);
      expect(score).toBeCloseTo(0.375, 10);
    });

    it("should clamp axis values > 1 to 1", () => {
      const axes: UwrAxesInput = {
        structureAxis: 1.5,
        executionAxis: 0.5,
        riskAxis: 0.5,
        insightAxis: 0.5
      };

      // structureAxis should be clamped to 1
      // Expected: (1*0.25 + 0.5*0.25 + 0.5*0.25 + 0.5*0.25) / 1.0 = 0.625
      const score = computeUwrScore(axes, defaultUwrConfig);
      expect(score).toBeCloseTo(0.625, 10);
    });

    it("should return 0 if all weights are zero", () => {
      const config: UniversalWeightingRuleConfig = {
        id: "test-zero-weights",
        structureWeight: 0,
        executionWeight: 0,
        riskWeight: 0,
        insightWeight: 0
      };

      const axes: UwrAxesInput = {
        structureAxis: 1,
        executionAxis: 1,
        riskAxis: 1,
        insightAxis: 1
      };

      const score = computeUwrScore(axes, config);
      expect(score).toBe(0);
    });

    it("should normalize weights that don't sum to 1", () => {
      const config: UniversalWeightingRuleConfig = {
        id: "test-unnormalized",
        structureWeight: 2,
        executionWeight: 2,
        riskWeight: 2,
        insightWeight: 2
      };

      const axes: UwrAxesInput = {
        structureAxis: 0.8,
        executionAxis: 0.6,
        riskAxis: 0.4,
        insightAxis: 0.2
      };

      // Weights sum to 8, but result should be same as equal weights
      // Expected: (0.8*2 + 0.6*2 + 0.4*2 + 0.2*2) / 8 = 4.0 / 8 = 0.5
      const score = computeUwrScore(axes, config as any);
      expect(score).toBeCloseTo(0.5, 10);
    });
  });

  describe("computeUwrScore - Realistic Signal Scenarios", () => {
    it("should score a high-quality signal correctly", () => {
      // High-quality signal: strong structure, good execution, acceptable risk, good insight
      const axes: UwrAxesInput = {
        structureAxis: 0.9,   // Strong HTF alignment
        executionAxis: 0.8,   // Good trigger pattern
        riskAxis: 0.75,       // Decent R:R
        insightAxis: 0.85     // Liquidity sweep confirmed
      };

      const score = computeUwrScore(axes, defaultUwrConfig);

      // Expected: (0.9 + 0.8 + 0.75 + 0.85) / 4 = 3.3 / 4 = 0.825
      expect(score).toBeCloseTo(0.825, 10);
      expect(score).toBeGreaterThan(0.8); // High-quality threshold
    });

    it("should score a low-quality signal correctly", () => {
      // Low-quality signal: weak structure, poor execution, bad risk, weak insight
      const axes: UwrAxesInput = {
        structureAxis: 0.2,   // Weak HTF structure
        executionAxis: 0.1,   // Poor trigger
        riskAxis: 0.3,        // Bad R:R
        insightAxis: 0.15     // No liquidity context
      };

      const score = computeUwrScore(axes, defaultUwrConfig);

      // Expected: (0.2 + 0.1 + 0.3 + 0.15) / 4 = 0.75 / 4 = 0.1875
      expect(score).toBeCloseTo(0.1875, 10);
      expect(score).toBeLessThan(0.3); // Low-quality threshold
    });

    it("should score a mixed-quality signal correctly", () => {
      // Mixed signal: good structure, weak execution, good risk, weak insight
      const axes: UwrAxesInput = {
        structureAxis: 0.7,   // Good HTF alignment
        executionAxis: 0.3,   // Weak trigger
        riskAxis: 0.8,        // Good R:R
        insightAxis: 0.4      // Moderate insight
      };

      const score = computeUwrScore(axes, defaultUwrConfig);

      // Expected: (0.7 + 0.3 + 0.8 + 0.4) / 4 = 2.2 / 4 = 0.55
      expect(score).toBeCloseTo(0.55, 10);
      expect(score).toBeGreaterThan(0.4);
      expect(score).toBeLessThan(0.7);
    });

    it("should be deterministic - same inputs produce same output", () => {
      const axes: UwrAxesInput = {
        structureAxis: 0.6,
        executionAxis: 0.5,
        riskAxis: 0.7,
        insightAxis: 0.4
      };

      const score1 = computeUwrScore(axes, defaultUwrConfig);
      const score2 = computeUwrScore(axes, defaultUwrConfig);
      const score3 = computeUwrScore(axes, defaultUwrConfig);

      expect(score1).toBe(score2);
      expect(score2).toBe(score3);
    });

    it("should produce monotonic behavior - higher axes = higher score", () => {
      const lowAxes: UwrAxesInput = {
        structureAxis: 0.3,
        executionAxis: 0.3,
        riskAxis: 0.3,
        insightAxis: 0.3
      };

      const highAxes: UwrAxesInput = {
        structureAxis: 0.7,
        executionAxis: 0.7,
        riskAxis: 0.7,
        insightAxis: 0.7
      };

      const lowScore = computeUwrScore(lowAxes, defaultUwrConfig);
      const highScore = computeUwrScore(highAxes, defaultUwrConfig);

      expect(highScore).toBeGreaterThan(lowScore);
      expect(lowScore).toBeCloseTo(0.3, 10);
      expect(highScore).toBeCloseTo(0.7, 10);
    });
  });
});

